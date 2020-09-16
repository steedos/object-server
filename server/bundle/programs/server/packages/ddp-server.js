(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var check = Package.check.check;
var Match = Package.check.Match;
var Random = Package.random.Random;
var EJSON = Package.ejson.EJSON;
var _ = Package.underscore._;
var Retry = Package.retry.Retry;
var MongoID = Package['mongo-id'].MongoID;
var DiffSequence = Package['diff-sequence'].DiffSequence;
var ECMAScript = Package.ecmascript.ECMAScript;
var DDPCommon = Package['ddp-common'].DDPCommon;
var DDP = Package['ddp-client'].DDP;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var RoutePolicy = Package.routepolicy.RoutePolicy;
var Hook = Package['callback-hook'].Hook;
var LocalCollection = Package.minimongo.LocalCollection;
var Minimongo = Package.minimongo.Minimongo;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var StreamServer, DDPServer, Server;

var require = meteorInstall({"node_modules":{"meteor":{"ddp-server":{"stream_server.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ddp-server/stream_server.js                                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var url = Npm.require('url'); // By default, we use the permessage-deflate extension with default
// configuration. If $SERVER_WEBSOCKET_COMPRESSION is set, then it must be valid
// JSON. If it represents a falsey value, then we do not use permessage-deflate
// at all; otherwise, the JSON value is used as an argument to deflate's
// configure method; see
// https://github.com/faye/permessage-deflate-node/blob/master/README.md
//
// (We do this in an _.once instead of at startup, because we don't want to
// crash the tool during isopacket load if your JSON doesn't parse. This is only
// a problem because the tool has to load the DDP server code just in order to
// be a DDP client; see https://github.com/meteor/meteor/issues/3452 .)


var websocketExtensions = _.once(function () {
  var extensions = [];
  var websocketCompressionConfig = process.env.SERVER_WEBSOCKET_COMPRESSION ? JSON.parse(process.env.SERVER_WEBSOCKET_COMPRESSION) : {};

  if (websocketCompressionConfig) {
    extensions.push(Npm.require('permessage-deflate').configure(websocketCompressionConfig));
  }

  return extensions;
});

var pathPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || "";

StreamServer = function () {
  var self = this;
  self.registration_callbacks = [];
  self.open_sockets = []; // Because we are installing directly onto WebApp.httpServer instead of using
  // WebApp.app, we have to process the path prefix ourselves.

  self.prefix = pathPrefix + '/sockjs';
  RoutePolicy.declare(self.prefix + '/', 'network'); // set up sockjs

  var sockjs = Npm.require('sockjs');

  var serverOptions = {
    prefix: self.prefix,
    log: function () {},
    // this is the default, but we code it explicitly because we depend
    // on it in stream_client:HEARTBEAT_TIMEOUT
    heartbeat_delay: 45000,
    // The default disconnect_delay is 5 seconds, but if the server ends up CPU
    // bound for that much time, SockJS might not notice that the user has
    // reconnected because the timer (of disconnect_delay ms) can fire before
    // SockJS processes the new connection. Eventually we'll fix this by not
    // combining CPU-heavy processing with SockJS termination (eg a proxy which
    // converts to Unix sockets) but for now, raise the delay.
    disconnect_delay: 60 * 1000,
    // Set the USE_JSESSIONID environment variable to enable setting the
    // JSESSIONID cookie. This is useful for setting up proxies with
    // session affinity.
    jsessionid: !!process.env.USE_JSESSIONID
  }; // If you know your server environment (eg, proxies) will prevent websockets
  // from ever working, set $DISABLE_WEBSOCKETS and SockJS clients (ie,
  // browsers) will not waste time attempting to use them.
  // (Your server will still have a /websocket endpoint.)

  if (process.env.DISABLE_WEBSOCKETS) {
    serverOptions.websocket = false;
  } else {
    serverOptions.faye_server_options = {
      extensions: websocketExtensions()
    };
  }

  self.server = sockjs.createServer(serverOptions); // Install the sockjs handlers, but we want to keep around our own particular
  // request handler that adjusts idle timeouts while we have an outstanding
  // request.  This compensates for the fact that sockjs removes all listeners
  // for "request" to add its own.

  WebApp.httpServer.removeListener('request', WebApp._timeoutAdjustmentRequestCallback);
  self.server.installHandlers(WebApp.httpServer);
  WebApp.httpServer.addListener('request', WebApp._timeoutAdjustmentRequestCallback); // Support the /websocket endpoint

  self._redirectWebsocketEndpoint();

  self.server.on('connection', function (socket) {
    // We want to make sure that if a client connects to us and does the initial
    // Websocket handshake but never gets to the DDP handshake, that we
    // eventually kill the socket.  Once the DDP handshake happens, DDP
    // heartbeating will work. And before the Websocket handshake, the timeouts
    // we set at the server level in webapp_server.js will work. But
    // faye-websocket calls setTimeout(0) on any socket it takes over, so there
    // is an "in between" state where this doesn't happen.  We work around this
    // by explicitly setting the socket timeout to a relatively large time here,
    // and setting it back to zero when we set up the heartbeat in
    // livedata_server.js.
    socket.setWebsocketTimeout = function (timeout) {
      if ((socket.protocol === 'websocket' || socket.protocol === 'websocket-raw') && socket._session.recv) {
        socket._session.recv.connection.setTimeout(timeout);
      }
    };

    socket.setWebsocketTimeout(45 * 1000);

    socket.send = function (data) {
      socket.write(data);
    };

    socket.on('close', function () {
      self.open_sockets = _.without(self.open_sockets, socket);
    });
    self.open_sockets.push(socket); // XXX COMPAT WITH 0.6.6. Send the old style welcome message, which
    // will force old clients to reload. Remove this once we're not
    // concerned about people upgrading from a pre-0.7.0 release. Also,
    // remove the clause in the client that ignores the welcome message
    // (livedata_connection.js)

    socket.send(JSON.stringify({
      server_id: "0"
    })); // call all our callbacks when we get a new socket. they will do the
    // work of setting up handlers and such for specific messages.

    _.each(self.registration_callbacks, function (callback) {
      callback(socket);
    });
  });
};

_.extend(StreamServer.prototype, {
  // call my callback when a new socket connects.
  // also call it for all current connections.
  register: function (callback) {
    var self = this;
    self.registration_callbacks.push(callback);

    _.each(self.all_sockets(), function (socket) {
      callback(socket);
    });
  },
  // get a list of all sockets
  all_sockets: function () {
    var self = this;
    return _.values(self.open_sockets);
  },
  // Redirect /websocket to /sockjs/websocket in order to not expose
  // sockjs to clients that want to use raw websockets
  _redirectWebsocketEndpoint: function () {
    var self = this; // Unfortunately we can't use a connect middleware here since
    // sockjs installs itself prior to all existing listeners
    // (meaning prior to any connect middlewares) so we need to take
    // an approach similar to overshadowListeners in
    // https://github.com/sockjs/sockjs-node/blob/cf820c55af6a9953e16558555a31decea554f70e/src/utils.coffee

    _.each(['request', 'upgrade'], function (event) {
      var httpServer = WebApp.httpServer;
      var oldHttpServerListeners = httpServer.listeners(event).slice(0);
      httpServer.removeAllListeners(event); // request and upgrade have different arguments passed but
      // we only care about the first one which is always request

      var newListener = function (request
      /*, moreArguments */
      ) {
        // Store arguments for use within the closure below
        var args = arguments; // Rewrite /websocket and /websocket/ urls to /sockjs/websocket while
        // preserving query string.

        var parsedUrl = url.parse(request.url);

        if (parsedUrl.pathname === pathPrefix + '/websocket' || parsedUrl.pathname === pathPrefix + '/websocket/') {
          parsedUrl.pathname = self.prefix + '/websocket';
          request.url = url.format(parsedUrl);
        }

        _.each(oldHttpServerListeners, function (oldListener) {
          oldListener.apply(httpServer, args);
        });
      };

      httpServer.addListener(event, newListener);
    });
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livedata_server.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ddp-server/livedata_server.js                                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
DDPServer = {};

var Fiber = Npm.require('fibers'); // This file contains classes:
// * Session - The server's connection to a single DDP client
// * Subscription - A single subscription for a single client
// * Server - An entire server that may talk to > 1 client. A DDP endpoint.
//
// Session and Subscription are file scope. For now, until we freeze
// the interface, Server is package scope (in the future it should be
// exported.)
// Represents a single document in a SessionCollectionView


var SessionDocumentView = function () {
  var self = this;
  self.existsIn = {}; // set of subscriptionHandle

  self.dataByKey = {}; // key-> [ {subscriptionHandle, value} by precedence]
};

DDPServer._SessionDocumentView = SessionDocumentView;

_.extend(SessionDocumentView.prototype, {
  getFields: function () {
    var self = this;
    var ret = {};

    _.each(self.dataByKey, function (precedenceList, key) {
      ret[key] = precedenceList[0].value;
    });

    return ret;
  },
  clearField: function (subscriptionHandle, key, changeCollector) {
    var self = this; // Publish API ignores _id if present in fields

    if (key === "_id") return;
    var precedenceList = self.dataByKey[key]; // It's okay to clear fields that didn't exist. No need to throw
    // an error.

    if (!precedenceList) return;
    var removedValue = undefined;

    for (var i = 0; i < precedenceList.length; i++) {
      var precedence = precedenceList[i];

      if (precedence.subscriptionHandle === subscriptionHandle) {
        // The view's value can only change if this subscription is the one that
        // used to have precedence.
        if (i === 0) removedValue = precedence.value;
        precedenceList.splice(i, 1);
        break;
      }
    }

    if (_.isEmpty(precedenceList)) {
      delete self.dataByKey[key];
      changeCollector[key] = undefined;
    } else if (removedValue !== undefined && !EJSON.equals(removedValue, precedenceList[0].value)) {
      changeCollector[key] = precedenceList[0].value;
    }
  },
  changeField: function (subscriptionHandle, key, value, changeCollector, isAdd) {
    var self = this; // Publish API ignores _id if present in fields

    if (key === "_id") return; // Don't share state with the data passed in by the user.

    value = EJSON.clone(value);

    if (!_.has(self.dataByKey, key)) {
      self.dataByKey[key] = [{
        subscriptionHandle: subscriptionHandle,
        value: value
      }];
      changeCollector[key] = value;
      return;
    }

    var precedenceList = self.dataByKey[key];
    var elt;

    if (!isAdd) {
      elt = _.find(precedenceList, function (precedence) {
        return precedence.subscriptionHandle === subscriptionHandle;
      });
    }

    if (elt) {
      if (elt === precedenceList[0] && !EJSON.equals(value, elt.value)) {
        // this subscription is changing the value of this field.
        changeCollector[key] = value;
      }

      elt.value = value;
    } else {
      // this subscription is newly caring about this field
      precedenceList.push({
        subscriptionHandle: subscriptionHandle,
        value: value
      });
    }
  }
});
/**
 * Represents a client's view of a single collection
 * @param {String} collectionName Name of the collection it represents
 * @param {Object.<String, Function>} sessionCallbacks The callbacks for added, changed, removed
 * @class SessionCollectionView
 */


var SessionCollectionView = function (collectionName, sessionCallbacks) {
  var self = this;
  self.collectionName = collectionName;
  self.documents = {};
  self.callbacks = sessionCallbacks;
};

DDPServer._SessionCollectionView = SessionCollectionView;

_.extend(SessionCollectionView.prototype, {
  isEmpty: function () {
    var self = this;
    return _.isEmpty(self.documents);
  },
  diff: function (previous) {
    var self = this;
    DiffSequence.diffObjects(previous.documents, self.documents, {
      both: _.bind(self.diffDocument, self),
      rightOnly: function (id, nowDV) {
        self.callbacks.added(self.collectionName, id, nowDV.getFields());
      },
      leftOnly: function (id, prevDV) {
        self.callbacks.removed(self.collectionName, id);
      }
    });
  },
  diffDocument: function (id, prevDV, nowDV) {
    var self = this;
    var fields = {};
    DiffSequence.diffObjects(prevDV.getFields(), nowDV.getFields(), {
      both: function (key, prev, now) {
        if (!EJSON.equals(prev, now)) fields[key] = now;
      },
      rightOnly: function (key, now) {
        fields[key] = now;
      },
      leftOnly: function (key, prev) {
        fields[key] = undefined;
      }
    });
    self.callbacks.changed(self.collectionName, id, fields);
  },
  added: function (subscriptionHandle, id, fields) {
    var self = this;
    var docView = self.documents[id];
    var added = false;

    if (!docView) {
      added = true;
      docView = new SessionDocumentView();
      self.documents[id] = docView;
    }

    docView.existsIn[subscriptionHandle] = true;
    var changeCollector = {};

    _.each(fields, function (value, key) {
      docView.changeField(subscriptionHandle, key, value, changeCollector, true);
    });

    if (added) self.callbacks.added(self.collectionName, id, changeCollector);else self.callbacks.changed(self.collectionName, id, changeCollector);
  },
  changed: function (subscriptionHandle, id, changed) {
    var self = this;
    var changedResult = {};
    var docView = self.documents[id];
    if (!docView) throw new Error("Could not find element with id " + id + " to change");

    _.each(changed, function (value, key) {
      if (value === undefined) docView.clearField(subscriptionHandle, key, changedResult);else docView.changeField(subscriptionHandle, key, value, changedResult);
    });

    self.callbacks.changed(self.collectionName, id, changedResult);
  },
  removed: function (subscriptionHandle, id) {
    var self = this;
    var docView = self.documents[id];

    if (!docView) {
      var err = new Error("Removed nonexistent document " + id);
      throw err;
    }

    delete docView.existsIn[subscriptionHandle];

    if (_.isEmpty(docView.existsIn)) {
      // it is gone from everyone
      self.callbacks.removed(self.collectionName, id);
      delete self.documents[id];
    } else {
      var changed = {}; // remove this subscription from every precedence list
      // and record the changes

      _.each(docView.dataByKey, function (precedenceList, key) {
        docView.clearField(subscriptionHandle, key, changed);
      });

      self.callbacks.changed(self.collectionName, id, changed);
    }
  }
});
/******************************************************************************/

/* Session                                                                    */

/******************************************************************************/


var Session = function (server, version, socket, options) {
  var self = this;
  self.id = Random.id();
  self.server = server;
  self.version = version;
  self.initialized = false;
  self.socket = socket; // set to null when the session is destroyed. multiple places below
  // use this to determine if the session is alive or not.

  self.inQueue = new Meteor._DoubleEndedQueue();
  self.blocked = false;
  self.workerRunning = false; // Sub objects for active subscriptions

  self._namedSubs = {};
  self._universalSubs = [];
  self.userId = null;
  self.collectionViews = {}; // Set this to false to not send messages when collectionViews are
  // modified. This is done when rerunning subs in _setUserId and those messages
  // are calculated via a diff instead.

  self._isSending = true; // If this is true, don't start a newly-created universal publisher on this
  // session. The session will take care of starting it when appropriate.

  self._dontStartNewUniversalSubs = false; // when we are rerunning subscriptions, any ready messages
  // we want to buffer up for when we are done rerunning subscriptions

  self._pendingReady = []; // List of callbacks to call when this connection is closed.

  self._closeCallbacks = []; // XXX HACK: If a sockjs connection, save off the URL. This is
  // temporary and will go away in the near future.

  self._socketUrl = socket.url; // Allow tests to disable responding to pings.

  self._respondToPings = options.respondToPings; // This object is the public interface to the session. In the public
  // API, it is called the `connection` object.  Internally we call it
  // a `connectionHandle` to avoid ambiguity.

  self.connectionHandle = {
    id: self.id,
    close: function () {
      self.close();
    },
    onClose: function (fn) {
      var cb = Meteor.bindEnvironment(fn, "connection onClose callback");

      if (self.inQueue) {
        self._closeCallbacks.push(cb);
      } else {
        // if we're already closed, call the callback.
        Meteor.defer(cb);
      }
    },
    clientAddress: self._clientAddress(),
    httpHeaders: self.socket.headers
  };
  self.send({
    msg: 'connected',
    session: self.id
  }); // On initial connect, spin up all the universal publishers.

  Fiber(function () {
    self.startUniversalSubs();
  }).run();

  if (version !== 'pre1' && options.heartbeatInterval !== 0) {
    // We no longer need the low level timeout because we have heartbeating.
    socket.setWebsocketTimeout(0);
    self.heartbeat = new DDPCommon.Heartbeat({
      heartbeatInterval: options.heartbeatInterval,
      heartbeatTimeout: options.heartbeatTimeout,
      onTimeout: function () {
        self.close();
      },
      sendPing: function () {
        self.send({
          msg: 'ping'
        });
      }
    });
    self.heartbeat.start();
  }

  Package['facts-base'] && Package['facts-base'].Facts.incrementServerFact("livedata", "sessions", 1);
};

_.extend(Session.prototype, {
  sendReady: function (subscriptionIds) {
    var self = this;
    if (self._isSending) self.send({
      msg: "ready",
      subs: subscriptionIds
    });else {
      _.each(subscriptionIds, function (subscriptionId) {
        self._pendingReady.push(subscriptionId);
      });
    }
  },
  sendAdded: function (collectionName, id, fields) {
    var self = this;
    if (self._isSending) self.send({
      msg: "added",
      collection: collectionName,
      id: id,
      fields: fields
    });
  },
  sendChanged: function (collectionName, id, fields) {
    var self = this;
    if (_.isEmpty(fields)) return;

    if (self._isSending) {
      self.send({
        msg: "changed",
        collection: collectionName,
        id: id,
        fields: fields
      });
    }
  },
  sendRemoved: function (collectionName, id) {
    var self = this;
    if (self._isSending) self.send({
      msg: "removed",
      collection: collectionName,
      id: id
    });
  },
  getSendCallbacks: function () {
    var self = this;
    return {
      added: _.bind(self.sendAdded, self),
      changed: _.bind(self.sendChanged, self),
      removed: _.bind(self.sendRemoved, self)
    };
  },
  getCollectionView: function (collectionName) {
    var self = this;

    if (_.has(self.collectionViews, collectionName)) {
      return self.collectionViews[collectionName];
    }

    var ret = new SessionCollectionView(collectionName, self.getSendCallbacks());
    self.collectionViews[collectionName] = ret;
    return ret;
  },
  added: function (subscriptionHandle, collectionName, id, fields) {
    var self = this;
    var view = self.getCollectionView(collectionName);
    view.added(subscriptionHandle, id, fields);
  },
  removed: function (subscriptionHandle, collectionName, id) {
    var self = this;
    var view = self.getCollectionView(collectionName);
    view.removed(subscriptionHandle, id);

    if (view.isEmpty()) {
      delete self.collectionViews[collectionName];
    }
  },
  changed: function (subscriptionHandle, collectionName, id, fields) {
    var self = this;
    var view = self.getCollectionView(collectionName);
    view.changed(subscriptionHandle, id, fields);
  },
  startUniversalSubs: function () {
    var self = this; // Make a shallow copy of the set of universal handlers and start them. If
    // additional universal publishers start while we're running them (due to
    // yielding), they will run separately as part of Server.publish.

    var handlers = _.clone(self.server.universal_publish_handlers);

    _.each(handlers, function (handler) {
      self._startSubscription(handler);
    });
  },
  // Destroy this session and unregister it at the server.
  close: function () {
    var self = this; // Destroy this session, even if it's not registered at the
    // server. Stop all processing and tear everything down. If a socket
    // was attached, close it.
    // Already destroyed.

    if (!self.inQueue) return; // Drop the merge box data immediately.

    self.inQueue = null;
    self.collectionViews = {};

    if (self.heartbeat) {
      self.heartbeat.stop();
      self.heartbeat = null;
    }

    if (self.socket) {
      self.socket.close();
      self.socket._meteorSession = null;
    }

    Package['facts-base'] && Package['facts-base'].Facts.incrementServerFact("livedata", "sessions", -1);
    Meteor.defer(function () {
      // stop callbacks can yield, so we defer this on close.
      // sub._isDeactivated() detects that we set inQueue to null and
      // treats it as semi-deactivated (it will ignore incoming callbacks, etc).
      self._deactivateAllSubscriptions(); // Defer calling the close callbacks, so that the caller closing
      // the session isn't waiting for all the callbacks to complete.


      _.each(self._closeCallbacks, function (callback) {
        callback();
      });
    }); // Unregister the session.

    self.server._removeSession(self);
  },
  // Send a message (doing nothing if no socket is connected right now.)
  // It should be a JSON object (it will be stringified.)
  send: function (msg) {
    var self = this;

    if (self.socket) {
      if (Meteor._printSentDDP) Meteor._debug("Sent DDP", DDPCommon.stringifyDDP(msg));
      self.socket.send(DDPCommon.stringifyDDP(msg));
    }
  },
  // Send a connection error.
  sendError: function (reason, offendingMessage) {
    var self = this;
    var msg = {
      msg: 'error',
      reason: reason
    };
    if (offendingMessage) msg.offendingMessage = offendingMessage;
    self.send(msg);
  },
  // Process 'msg' as an incoming message. (But as a guard against
  // race conditions during reconnection, ignore the message if
  // 'socket' is not the currently connected socket.)
  //
  // We run the messages from the client one at a time, in the order
  // given by the client. The message handler is passed an idempotent
  // function 'unblock' which it may call to allow other messages to
  // begin running in parallel in another fiber (for example, a method
  // that wants to yield.) Otherwise, it is automatically unblocked
  // when it returns.
  //
  // Actually, we don't have to 'totally order' the messages in this
  // way, but it's the easiest thing that's correct. (unsub needs to
  // be ordered against sub, methods need to be ordered against each
  // other.)
  processMessage: function (msg_in) {
    var self = this;
    if (!self.inQueue) // we have been destroyed.
      return; // Respond to ping and pong messages immediately without queuing.
    // If the negotiated DDP version is "pre1" which didn't support
    // pings, preserve the "pre1" behavior of responding with a "bad
    // request" for the unknown messages.
    //
    // Fibers are needed because heartbeat uses Meteor.setTimeout, which
    // needs a Fiber. We could actually use regular setTimeout and avoid
    // these new fibers, but it is easier to just make everything use
    // Meteor.setTimeout and not think too hard.
    //
    // Any message counts as receiving a pong, as it demonstrates that
    // the client is still alive.

    if (self.heartbeat) {
      Fiber(function () {
        self.heartbeat.messageReceived();
      }).run();
    }

    if (self.version !== 'pre1' && msg_in.msg === 'ping') {
      if (self._respondToPings) self.send({
        msg: "pong",
        id: msg_in.id
      });
      return;
    }

    if (self.version !== 'pre1' && msg_in.msg === 'pong') {
      // Since everything is a pong, nothing to do
      return;
    }

    self.inQueue.push(msg_in);
    if (self.workerRunning) return;
    self.workerRunning = true;

    var processNext = function () {
      var msg = self.inQueue && self.inQueue.shift();

      if (!msg) {
        self.workerRunning = false;
        return;
      }

      Fiber(function () {
        var blocked = true;

        var unblock = function () {
          if (!blocked) return; // idempotent

          blocked = false;
          processNext();
        };

        self.server.onMessageHook.each(function (callback) {
          callback(msg, self);
          return true;
        });
        if (_.has(self.protocol_handlers, msg.msg)) self.protocol_handlers[msg.msg].call(self, msg, unblock);else self.sendError('Bad request', msg);
        unblock(); // in case the handler didn't already do it
      }).run();
    };

    processNext();
  },
  protocol_handlers: {
    sub: function (msg) {
      var self = this; // reject malformed messages

      if (typeof msg.id !== "string" || typeof msg.name !== "string" || 'params' in msg && !(msg.params instanceof Array)) {
        self.sendError("Malformed subscription", msg);
        return;
      }

      if (!self.server.publish_handlers[msg.name]) {
        self.send({
          msg: 'nosub',
          id: msg.id,
          error: new Meteor.Error(404, `Subscription '${msg.name}' not found`)
        });
        return;
      }

      if (_.has(self._namedSubs, msg.id)) // subs are idempotent, or rather, they are ignored if a sub
        // with that id already exists. this is important during
        // reconnect.
        return; // XXX It'd be much better if we had generic hooks where any package can
      // hook into subscription handling, but in the mean while we special case
      // ddp-rate-limiter package. This is also done for weak requirements to
      // add the ddp-rate-limiter package in case we don't have Accounts. A
      // user trying to use the ddp-rate-limiter must explicitly require it.

      if (Package['ddp-rate-limiter']) {
        var DDPRateLimiter = Package['ddp-rate-limiter'].DDPRateLimiter;
        var rateLimiterInput = {
          userId: self.userId,
          clientAddress: self.connectionHandle.clientAddress,
          type: "subscription",
          name: msg.name,
          connectionId: self.id
        };

        DDPRateLimiter._increment(rateLimiterInput);

        var rateLimitResult = DDPRateLimiter._check(rateLimiterInput);

        if (!rateLimitResult.allowed) {
          self.send({
            msg: 'nosub',
            id: msg.id,
            error: new Meteor.Error('too-many-requests', DDPRateLimiter.getErrorMessage(rateLimitResult), {
              timeToReset: rateLimitResult.timeToReset
            })
          });
          return;
        }
      }

      var handler = self.server.publish_handlers[msg.name];

      self._startSubscription(handler, msg.id, msg.params, msg.name);
    },
    unsub: function (msg) {
      var self = this;

      self._stopSubscription(msg.id);
    },
    method: function (msg, unblock) {
      var self = this; // reject malformed messages
      // For now, we silently ignore unknown attributes,
      // for forwards compatibility.

      if (typeof msg.id !== "string" || typeof msg.method !== "string" || 'params' in msg && !(msg.params instanceof Array) || 'randomSeed' in msg && typeof msg.randomSeed !== "string") {
        self.sendError("Malformed method invocation", msg);
        return;
      }

      var randomSeed = msg.randomSeed || null; // set up to mark the method as satisfied once all observers
      // (and subscriptions) have reacted to any writes that were
      // done.

      var fence = new DDPServer._WriteFence();
      fence.onAllCommitted(function () {
        // Retire the fence so that future writes are allowed.
        // This means that callbacks like timers are free to use
        // the fence, and if they fire before it's armed (for
        // example, because the method waits for them) their
        // writes will be included in the fence.
        fence.retire();
        self.send({
          msg: 'updated',
          methods: [msg.id]
        });
      }); // find the handler

      var handler = self.server.method_handlers[msg.method];

      if (!handler) {
        self.send({
          msg: 'result',
          id: msg.id,
          error: new Meteor.Error(404, `Method '${msg.method}' not found`)
        });
        fence.arm();
        return;
      }

      var setUserId = function (userId) {
        self._setUserId(userId);
      };

      var invocation = new DDPCommon.MethodInvocation({
        isSimulation: false,
        userId: self.userId,
        setUserId: setUserId,
        unblock: unblock,
        connection: self.connectionHandle,
        randomSeed: randomSeed
      });
      const promise = new Promise((resolve, reject) => {
        // XXX It'd be better if we could hook into method handlers better but
        // for now, we need to check if the ddp-rate-limiter exists since we
        // have a weak requirement for the ddp-rate-limiter package to be added
        // to our application.
        if (Package['ddp-rate-limiter']) {
          var DDPRateLimiter = Package['ddp-rate-limiter'].DDPRateLimiter;
          var rateLimiterInput = {
            userId: self.userId,
            clientAddress: self.connectionHandle.clientAddress,
            type: "method",
            name: msg.method,
            connectionId: self.id
          };

          DDPRateLimiter._increment(rateLimiterInput);

          var rateLimitResult = DDPRateLimiter._check(rateLimiterInput);

          if (!rateLimitResult.allowed) {
            reject(new Meteor.Error("too-many-requests", DDPRateLimiter.getErrorMessage(rateLimitResult), {
              timeToReset: rateLimitResult.timeToReset
            }));
            return;
          }
        }

        resolve(DDPServer._CurrentWriteFence.withValue(fence, () => DDP._CurrentMethodInvocation.withValue(invocation, () => maybeAuditArgumentChecks(handler, invocation, msg.params, "call to '" + msg.method + "'"))));
      });

      function finish() {
        fence.arm();
        unblock();
      }

      const payload = {
        msg: "result",
        id: msg.id
      };
      promise.then(result => {
        finish();

        if (result !== undefined) {
          payload.result = result;
        }

        self.send(payload);
      }, exception => {
        finish();
        payload.error = wrapInternalException(exception, `while invoking method '${msg.method}'`);
        self.send(payload);
      });
    }
  },
  _eachSub: function (f) {
    var self = this;

    _.each(self._namedSubs, f);

    _.each(self._universalSubs, f);
  },
  _diffCollectionViews: function (beforeCVs) {
    var self = this;
    DiffSequence.diffObjects(beforeCVs, self.collectionViews, {
      both: function (collectionName, leftValue, rightValue) {
        rightValue.diff(leftValue);
      },
      rightOnly: function (collectionName, rightValue) {
        _.each(rightValue.documents, function (docView, id) {
          self.sendAdded(collectionName, id, docView.getFields());
        });
      },
      leftOnly: function (collectionName, leftValue) {
        _.each(leftValue.documents, function (doc, id) {
          self.sendRemoved(collectionName, id);
        });
      }
    });
  },
  // Sets the current user id in all appropriate contexts and reruns
  // all subscriptions
  _setUserId: function (userId) {
    var self = this;
    if (userId !== null && typeof userId !== "string") throw new Error("setUserId must be called on string or null, not " + typeof userId); // Prevent newly-created universal subscriptions from being added to our
    // session; they will be found below when we call startUniversalSubs.
    //
    // (We don't have to worry about named subscriptions, because we only add
    // them when we process a 'sub' message. We are currently processing a
    // 'method' message, and the method did not unblock, because it is illegal
    // to call setUserId after unblock. Thus we cannot be concurrently adding a
    // new named subscription.)

    self._dontStartNewUniversalSubs = true; // Prevent current subs from updating our collectionViews and call their
    // stop callbacks. This may yield.

    self._eachSub(function (sub) {
      sub._deactivate();
    }); // All subs should now be deactivated. Stop sending messages to the client,
    // save the state of the published collections, reset to an empty view, and
    // update the userId.


    self._isSending = false;
    var beforeCVs = self.collectionViews;
    self.collectionViews = {};
    self.userId = userId; // _setUserId is normally called from a Meteor method with
    // DDP._CurrentMethodInvocation set. But DDP._CurrentMethodInvocation is not
    // expected to be set inside a publish function, so we temporary unset it.
    // Inside a publish function DDP._CurrentPublicationInvocation is set.

    DDP._CurrentMethodInvocation.withValue(undefined, function () {
      // Save the old named subs, and reset to having no subscriptions.
      var oldNamedSubs = self._namedSubs;
      self._namedSubs = {};
      self._universalSubs = [];

      _.each(oldNamedSubs, function (sub, subscriptionId) {
        self._namedSubs[subscriptionId] = sub._recreate(); // nb: if the handler throws or calls this.error(), it will in fact
        // immediately send its 'nosub'. This is OK, though.

        self._namedSubs[subscriptionId]._runHandler();
      }); // Allow newly-created universal subs to be started on our connection in
      // parallel with the ones we're spinning up here, and spin up universal
      // subs.


      self._dontStartNewUniversalSubs = false;
      self.startUniversalSubs();
    }); // Start sending messages again, beginning with the diff from the previous
    // state of the world to the current state. No yields are allowed during
    // this diff, so that other changes cannot interleave.


    Meteor._noYieldsAllowed(function () {
      self._isSending = true;

      self._diffCollectionViews(beforeCVs);

      if (!_.isEmpty(self._pendingReady)) {
        self.sendReady(self._pendingReady);
        self._pendingReady = [];
      }
    });
  },
  _startSubscription: function (handler, subId, params, name) {
    var self = this;
    var sub = new Subscription(self, handler, subId, params, name);
    if (subId) self._namedSubs[subId] = sub;else self._universalSubs.push(sub);

    sub._runHandler();
  },
  // tear down specified subscription
  _stopSubscription: function (subId, error) {
    var self = this;
    var subName = null;

    if (subId && self._namedSubs[subId]) {
      subName = self._namedSubs[subId]._name;

      self._namedSubs[subId]._removeAllDocuments();

      self._namedSubs[subId]._deactivate();

      delete self._namedSubs[subId];
    }

    var response = {
      msg: 'nosub',
      id: subId
    };

    if (error) {
      response.error = wrapInternalException(error, subName ? "from sub " + subName + " id " + subId : "from sub id " + subId);
    }

    self.send(response);
  },
  // tear down all subscriptions. Note that this does NOT send removed or nosub
  // messages, since we assume the client is gone.
  _deactivateAllSubscriptions: function () {
    var self = this;

    _.each(self._namedSubs, function (sub, id) {
      sub._deactivate();
    });

    self._namedSubs = {};

    _.each(self._universalSubs, function (sub) {
      sub._deactivate();
    });

    self._universalSubs = [];
  },
  // Determine the remote client's IP address, based on the
  // HTTP_FORWARDED_COUNT environment variable representing how many
  // proxies the server is behind.
  _clientAddress: function () {
    var self = this; // For the reported client address for a connection to be correct,
    // the developer must set the HTTP_FORWARDED_COUNT environment
    // variable to an integer representing the number of hops they
    // expect in the `x-forwarded-for` header. E.g., set to "1" if the
    // server is behind one proxy.
    //
    // This could be computed once at startup instead of every time.

    var httpForwardedCount = parseInt(process.env['HTTP_FORWARDED_COUNT']) || 0;
    if (httpForwardedCount === 0) return self.socket.remoteAddress;
    var forwardedFor = self.socket.headers["x-forwarded-for"];
    if (!_.isString(forwardedFor)) return null;
    forwardedFor = forwardedFor.trim().split(/\s*,\s*/); // Typically the first value in the `x-forwarded-for` header is
    // the original IP address of the client connecting to the first
    // proxy.  However, the end user can easily spoof the header, in
    // which case the first value(s) will be the fake IP address from
    // the user pretending to be a proxy reporting the original IP
    // address value.  By counting HTTP_FORWARDED_COUNT back from the
    // end of the list, we ensure that we get the IP address being
    // reported by *our* first proxy.

    if (httpForwardedCount < 0 || httpForwardedCount > forwardedFor.length) return null;
    return forwardedFor[forwardedFor.length - httpForwardedCount];
  }
});
/******************************************************************************/

/* Subscription                                                               */

/******************************************************************************/
// ctor for a sub handle: the input to each publish function
// Instance name is this because it's usually referred to as this inside a
// publish

/**
 * @summary The server's side of a subscription
 * @class Subscription
 * @instanceName this
 * @showInstanceName true
 */


var Subscription = function (session, handler, subscriptionId, params, name) {
  var self = this;
  self._session = session; // type is Session

  /**
   * @summary Access inside the publish function. The incoming [connection](#meteor_onconnection) for this subscription.
   * @locus Server
   * @name  connection
   * @memberOf Subscription
   * @instance
   */

  self.connection = session.connectionHandle; // public API object

  self._handler = handler; // my subscription ID (generated by client, undefined for universal subs).

  self._subscriptionId = subscriptionId; // undefined for universal subs

  self._name = name;
  self._params = params || []; // Only named subscriptions have IDs, but we need some sort of string
  // internally to keep track of all subscriptions inside
  // SessionDocumentViews. We use this subscriptionHandle for that.

  if (self._subscriptionId) {
    self._subscriptionHandle = 'N' + self._subscriptionId;
  } else {
    self._subscriptionHandle = 'U' + Random.id();
  } // has _deactivate been called?


  self._deactivated = false; // stop callbacks to g/c this sub.  called w/ zero arguments.

  self._stopCallbacks = []; // the set of (collection, documentid) that this subscription has
  // an opinion about

  self._documents = {}; // remember if we are ready.

  self._ready = false; // Part of the public API: the user of this sub.

  /**
   * @summary Access inside the publish function. The id of the logged-in user, or `null` if no user is logged in.
   * @locus Server
   * @memberOf Subscription
   * @name  userId
   * @instance
   */

  self.userId = session.userId; // For now, the id filter is going to default to
  // the to/from DDP methods on MongoID, to
  // specifically deal with mongo/minimongo ObjectIds.
  // Later, you will be able to make this be "raw"
  // if you want to publish a collection that you know
  // just has strings for keys and no funny business, to
  // a ddp consumer that isn't minimongo

  self._idFilter = {
    idStringify: MongoID.idStringify,
    idParse: MongoID.idParse
  };
  Package['facts-base'] && Package['facts-base'].Facts.incrementServerFact("livedata", "subscriptions", 1);
};

_.extend(Subscription.prototype, {
  _runHandler: function () {
    // XXX should we unblock() here? Either before running the publish
    // function, or before running _publishCursor.
    //
    // Right now, each publish function blocks all future publishes and
    // methods waiting on data from Mongo (or whatever else the function
    // blocks on). This probably slows page load in common cases.
    var self = this;

    try {
      var res = DDP._CurrentPublicationInvocation.withValue(self, () => maybeAuditArgumentChecks(self._handler, self, EJSON.clone(self._params), // It's OK that this would look weird for universal subscriptions,
      // because they have no arguments so there can never be an
      // audit-argument-checks failure.
      "publisher '" + self._name + "'"));
    } catch (e) {
      self.error(e);
      return;
    } // Did the handler call this.error or this.stop?


    if (self._isDeactivated()) return;

    self._publishHandlerResult(res);
  },
  _publishHandlerResult: function (res) {
    // SPECIAL CASE: Instead of writing their own callbacks that invoke
    // this.added/changed/ready/etc, the user can just return a collection
    // cursor or array of cursors from the publish function; we call their
    // _publishCursor method which starts observing the cursor and publishes the
    // results. Note that _publishCursor does NOT call ready().
    //
    // XXX This uses an undocumented interface which only the Mongo cursor
    // interface publishes. Should we make this interface public and encourage
    // users to implement it themselves? Arguably, it's unnecessary; users can
    // already write their own functions like
    //   var publishMyReactiveThingy = function (name, handler) {
    //     Meteor.publish(name, function () {
    //       var reactiveThingy = handler();
    //       reactiveThingy.publishMe();
    //     });
    //   };
    var self = this;

    var isCursor = function (c) {
      return c && c._publishCursor;
    };

    if (isCursor(res)) {
      try {
        res._publishCursor(self);
      } catch (e) {
        self.error(e);
        return;
      } // _publishCursor only returns after the initial added callbacks have run.
      // mark subscription as ready.


      self.ready();
    } else if (_.isArray(res)) {
      // check all the elements are cursors
      if (!_.all(res, isCursor)) {
        self.error(new Error("Publish function returned an array of non-Cursors"));
        return;
      } // find duplicate collection names
      // XXX we should support overlapping cursors, but that would require the
      // merge box to allow overlap within a subscription


      var collectionNames = {};

      for (var i = 0; i < res.length; ++i) {
        var collectionName = res[i]._getCollectionName();

        if (_.has(collectionNames, collectionName)) {
          self.error(new Error("Publish function returned multiple cursors for collection " + collectionName));
          return;
        }

        collectionNames[collectionName] = true;
      }

      ;

      try {
        _.each(res, function (cur) {
          cur._publishCursor(self);
        });
      } catch (e) {
        self.error(e);
        return;
      }

      self.ready();
    } else if (res) {
      // truthy values other than cursors or arrays are probably a
      // user mistake (possible returning a Mongo document via, say,
      // `coll.findOne()`).
      self.error(new Error("Publish function can only return a Cursor or " + "an array of Cursors"));
    }
  },
  // This calls all stop callbacks and prevents the handler from updating any
  // SessionCollectionViews further. It's used when the user unsubscribes or
  // disconnects, as well as during setUserId re-runs. It does *NOT* send
  // removed messages for the published objects; if that is necessary, call
  // _removeAllDocuments first.
  _deactivate: function () {
    var self = this;
    if (self._deactivated) return;
    self._deactivated = true;

    self._callStopCallbacks();

    Package['facts-base'] && Package['facts-base'].Facts.incrementServerFact("livedata", "subscriptions", -1);
  },
  _callStopCallbacks: function () {
    var self = this; // tell listeners, so they can clean up

    var callbacks = self._stopCallbacks;
    self._stopCallbacks = [];

    _.each(callbacks, function (callback) {
      callback();
    });
  },
  // Send remove messages for every document.
  _removeAllDocuments: function () {
    var self = this;

    Meteor._noYieldsAllowed(function () {
      _.each(self._documents, function (collectionDocs, collectionName) {
        // Iterate over _.keys instead of the dictionary itself, since we'll be
        // mutating it.
        _.each(_.keys(collectionDocs), function (strId) {
          self.removed(collectionName, self._idFilter.idParse(strId));
        });
      });
    });
  },
  // Returns a new Subscription for the same session with the same
  // initial creation parameters. This isn't a clone: it doesn't have
  // the same _documents cache, stopped state or callbacks; may have a
  // different _subscriptionHandle, and gets its userId from the
  // session, not from this object.
  _recreate: function () {
    var self = this;
    return new Subscription(self._session, self._handler, self._subscriptionId, self._params, self._name);
  },

  /**
   * @summary Call inside the publish function.  Stops this client's subscription, triggering a call on the client to the `onStop` callback passed to [`Meteor.subscribe`](#meteor_subscribe), if any. If `error` is not a [`Meteor.Error`](#meteor_error), it will be [sanitized](#meteor_error).
   * @locus Server
   * @param {Error} error The error to pass to the client.
   * @instance
   * @memberOf Subscription
   */
  error: function (error) {
    var self = this;
    if (self._isDeactivated()) return;

    self._session._stopSubscription(self._subscriptionId, error);
  },
  // Note that while our DDP client will notice that you've called stop() on the
  // server (and clean up its _subscriptions table) we don't actually provide a
  // mechanism for an app to notice this (the subscribe onError callback only
  // triggers if there is an error).

  /**
   * @summary Call inside the publish function.  Stops this client's subscription and invokes the client's `onStop` callback with no error.
   * @locus Server
   * @instance
   * @memberOf Subscription
   */
  stop: function () {
    var self = this;
    if (self._isDeactivated()) return;

    self._session._stopSubscription(self._subscriptionId);
  },

  /**
   * @summary Call inside the publish function.  Registers a callback function to run when the subscription is stopped.
   * @locus Server
   * @memberOf Subscription
   * @instance
   * @param {Function} func The callback function
   */
  onStop: function (callback) {
    var self = this;
    callback = Meteor.bindEnvironment(callback, 'onStop callback', self);
    if (self._isDeactivated()) callback();else self._stopCallbacks.push(callback);
  },
  // This returns true if the sub has been deactivated, *OR* if the session was
  // destroyed but the deferred call to _deactivateAllSubscriptions hasn't
  // happened yet.
  _isDeactivated: function () {
    var self = this;
    return self._deactivated || self._session.inQueue === null;
  },

  /**
   * @summary Call inside the publish function.  Informs the subscriber that a document has been added to the record set.
   * @locus Server
   * @memberOf Subscription
   * @instance
   * @param {String} collection The name of the collection that contains the new document.
   * @param {String} id The new document's ID.
   * @param {Object} fields The fields in the new document.  If `_id` is present it is ignored.
   */
  added: function (collectionName, id, fields) {
    var self = this;
    if (self._isDeactivated()) return;
    id = self._idFilter.idStringify(id);
    Meteor._ensure(self._documents, collectionName)[id] = true;

    self._session.added(self._subscriptionHandle, collectionName, id, fields);
  },

  /**
   * @summary Call inside the publish function.  Informs the subscriber that a document in the record set has been modified.
   * @locus Server
   * @memberOf Subscription
   * @instance
   * @param {String} collection The name of the collection that contains the changed document.
   * @param {String} id The changed document's ID.
   * @param {Object} fields The fields in the document that have changed, together with their new values.  If a field is not present in `fields` it was left unchanged; if it is present in `fields` and has a value of `undefined` it was removed from the document.  If `_id` is present it is ignored.
   */
  changed: function (collectionName, id, fields) {
    var self = this;
    if (self._isDeactivated()) return;
    id = self._idFilter.idStringify(id);

    self._session.changed(self._subscriptionHandle, collectionName, id, fields);
  },

  /**
   * @summary Call inside the publish function.  Informs the subscriber that a document has been removed from the record set.
   * @locus Server
   * @memberOf Subscription
   * @instance
   * @param {String} collection The name of the collection that the document has been removed from.
   * @param {String} id The ID of the document that has been removed.
   */
  removed: function (collectionName, id) {
    var self = this;
    if (self._isDeactivated()) return;
    id = self._idFilter.idStringify(id); // We don't bother to delete sets of things in a collection if the
    // collection is empty.  It could break _removeAllDocuments.

    delete self._documents[collectionName][id];

    self._session.removed(self._subscriptionHandle, collectionName, id);
  },

  /**
   * @summary Call inside the publish function.  Informs the subscriber that an initial, complete snapshot of the record set has been sent.  This will trigger a call on the client to the `onReady` callback passed to  [`Meteor.subscribe`](#meteor_subscribe), if any.
   * @locus Server
   * @memberOf Subscription
   * @instance
   */
  ready: function () {
    var self = this;
    if (self._isDeactivated()) return;
    if (!self._subscriptionId) return; // unnecessary but ignored for universal sub

    if (!self._ready) {
      self._session.sendReady([self._subscriptionId]);

      self._ready = true;
    }
  }
});
/******************************************************************************/

/* Server                                                                     */

/******************************************************************************/


Server = function (options) {
  var self = this; // The default heartbeat interval is 30 seconds on the server and 35
  // seconds on the client.  Since the client doesn't need to send a
  // ping as long as it is receiving pings, this means that pings
  // normally go from the server to the client.
  //
  // Note: Troposphere depends on the ability to mutate
  // Meteor.server.options.heartbeatTimeout! This is a hack, but it's life.

  self.options = _.defaults(options || {}, {
    heartbeatInterval: 15000,
    heartbeatTimeout: 15000,
    // For testing, allow responding to pings to be disabled.
    respondToPings: true
  }); // Map of callbacks to call when a new connection comes in to the
  // server and completes DDP version negotiation. Use an object instead
  // of an array so we can safely remove one from the list while
  // iterating over it.

  self.onConnectionHook = new Hook({
    debugPrintExceptions: "onConnection callback"
  }); // Map of callbacks to call when a new message comes in.

  self.onMessageHook = new Hook({
    debugPrintExceptions: "onMessage callback"
  });
  self.publish_handlers = {};
  self.universal_publish_handlers = [];
  self.method_handlers = {};
  self.sessions = {}; // map from id to session

  self.stream_server = new StreamServer();
  self.stream_server.register(function (socket) {
    // socket implements the SockJSConnection interface
    socket._meteorSession = null;

    var sendError = function (reason, offendingMessage) {
      var msg = {
        msg: 'error',
        reason: reason
      };
      if (offendingMessage) msg.offendingMessage = offendingMessage;
      socket.send(DDPCommon.stringifyDDP(msg));
    };

    socket.on('data', function (raw_msg) {
      if (Meteor._printReceivedDDP) {
        Meteor._debug("Received DDP", raw_msg);
      }

      try {
        try {
          var msg = DDPCommon.parseDDP(raw_msg);
        } catch (err) {
          sendError('Parse error');
          return;
        }

        if (msg === null || !msg.msg) {
          sendError('Bad request', msg);
          return;
        }

        if (msg.msg === 'connect') {
          if (socket._meteorSession) {
            sendError("Already connected", msg);
            return;
          }

          Fiber(function () {
            self._handleConnect(socket, msg);
          }).run();
          return;
        }

        if (!socket._meteorSession) {
          sendError('Must connect first', msg);
          return;
        }

        socket._meteorSession.processMessage(msg);
      } catch (e) {
        // XXX print stack nicely
        Meteor._debug("Internal exception while processing message", msg, e);
      }
    });
    socket.on('close', function () {
      if (socket._meteorSession) {
        Fiber(function () {
          socket._meteorSession.close();
        }).run();
      }
    });
  });
};

_.extend(Server.prototype, {
  /**
   * @summary Register a callback to be called when a new DDP connection is made to the server.
   * @locus Server
   * @param {function} callback The function to call when a new DDP connection is established.
   * @memberOf Meteor
   * @importFromPackage meteor
   */
  onConnection: function (fn) {
    var self = this;
    return self.onConnectionHook.register(fn);
  },

  /**
   * @summary Register a callback to be called when a new DDP message is received.
   * @locus Server
   * @param {function} callback The function to call when a new DDP message is received.
   * @memberOf Meteor
   * @importFromPackage meteor
   */
  onMessage: function (fn) {
    var self = this;
    return self.onMessageHook.register(fn);
  },
  _handleConnect: function (socket, msg) {
    var self = this; // The connect message must specify a version and an array of supported
    // versions, and it must claim to support what it is proposing.

    if (!(typeof msg.version === 'string' && _.isArray(msg.support) && _.all(msg.support, _.isString) && _.contains(msg.support, msg.version))) {
      socket.send(DDPCommon.stringifyDDP({
        msg: 'failed',
        version: DDPCommon.SUPPORTED_DDP_VERSIONS[0]
      }));
      socket.close();
      return;
    } // In the future, handle session resumption: something like:
    //  socket._meteorSession = self.sessions[msg.session]


    var version = calculateVersion(msg.support, DDPCommon.SUPPORTED_DDP_VERSIONS);

    if (msg.version !== version) {
      // The best version to use (according to the client's stated preferences)
      // is not the one the client is trying to use. Inform them about the best
      // version to use.
      socket.send(DDPCommon.stringifyDDP({
        msg: 'failed',
        version: version
      }));
      socket.close();
      return;
    } // Yay, version matches! Create a new session.
    // Note: Troposphere depends on the ability to mutate
    // Meteor.server.options.heartbeatTimeout! This is a hack, but it's life.


    socket._meteorSession = new Session(self, version, socket, self.options);
    self.sessions[socket._meteorSession.id] = socket._meteorSession;
    self.onConnectionHook.each(function (callback) {
      if (socket._meteorSession) callback(socket._meteorSession.connectionHandle);
      return true;
    });
  },

  /**
   * Register a publish handler function.
   *
   * @param name {String} identifier for query
   * @param handler {Function} publish handler
   * @param options {Object}
   *
   * Server will call handler function on each new subscription,
   * either when receiving DDP sub message for a named subscription, or on
   * DDP connect for a universal subscription.
   *
   * If name is null, this will be a subscription that is
   * automatically established and permanently on for all connected
   * client, instead of a subscription that can be turned on and off
   * with subscribe().
   *
   * options to contain:
   *  - (mostly internal) is_auto: true if generated automatically
   *    from an autopublish hook. this is for cosmetic purposes only
   *    (it lets us determine whether to print a warning suggesting
   *    that you turn off autopublish.)
   */

  /**
   * @summary Publish a record set.
   * @memberOf Meteor
   * @importFromPackage meteor
   * @locus Server
   * @param {String|Object} name If String, name of the record set.  If Object, publications Dictionary of publish functions by name.  If `null`, the set has no name, and the record set is automatically sent to all connected clients.
   * @param {Function} func Function called on the server each time a client subscribes.  Inside the function, `this` is the publish handler object, described below.  If the client passed arguments to `subscribe`, the function is called with the same arguments.
   */
  publish: function (name, handler, options) {
    var self = this;

    if (!_.isObject(name)) {
      options = options || {};

      if (name && name in self.publish_handlers) {
        Meteor._debug("Ignoring duplicate publish named '" + name + "'");

        return;
      }

      if (Package.autopublish && !options.is_auto) {
        // They have autopublish on, yet they're trying to manually
        // picking stuff to publish. They probably should turn off
        // autopublish. (This check isn't perfect -- if you create a
        // publish before you turn on autopublish, it won't catch
        // it. But this will definitely handle the simple case where
        // you've added the autopublish package to your app, and are
        // calling publish from your app code.)
        if (!self.warned_about_autopublish) {
          self.warned_about_autopublish = true;

          Meteor._debug("** You've set up some data subscriptions with Meteor.publish(), but\n" + "** you still have autopublish turned on. Because autopublish is still\n" + "** on, your Meteor.publish() calls won't have much effect. All data\n" + "** will still be sent to all clients.\n" + "**\n" + "** Turn off autopublish by removing the autopublish package:\n" + "**\n" + "**   $ meteor remove autopublish\n" + "**\n" + "** .. and make sure you have Meteor.publish() and Meteor.subscribe() calls\n" + "** for each collection that you want clients to see.\n");
        }
      }

      if (name) self.publish_handlers[name] = handler;else {
        self.universal_publish_handlers.push(handler); // Spin up the new publisher on any existing session too. Run each
        // session's subscription in a new Fiber, so that there's no change for
        // self.sessions to change while we're running this loop.

        _.each(self.sessions, function (session) {
          if (!session._dontStartNewUniversalSubs) {
            Fiber(function () {
              session._startSubscription(handler);
            }).run();
          }
        });
      }
    } else {
      _.each(name, function (value, key) {
        self.publish(key, value, {});
      });
    }
  },
  _removeSession: function (session) {
    var self = this;

    if (self.sessions[session.id]) {
      delete self.sessions[session.id];
    }
  },

  /**
   * @summary Defines functions that can be invoked over the network by clients.
   * @locus Anywhere
   * @param {Object} methods Dictionary whose keys are method names and values are functions.
   * @memberOf Meteor
   * @importFromPackage meteor
   */
  methods: function (methods) {
    var self = this;

    _.each(methods, function (func, name) {
      if (typeof func !== 'function') throw new Error("Method '" + name + "' must be a function");
      if (self.method_handlers[name]) throw new Error("A method named '" + name + "' is already defined");
      self.method_handlers[name] = func;
    });
  },
  call: function (name, ...args) {
    if (args.length && typeof args[args.length - 1] === "function") {
      // If it's a function, the last argument is the result callback, not
      // a parameter to the remote method.
      var callback = args.pop();
    }

    return this.apply(name, args, callback);
  },
  // A version of the call method that always returns a Promise.
  callAsync: function (name, ...args) {
    return this.applyAsync(name, args);
  },
  apply: function (name, args, options, callback) {
    // We were passed 3 arguments. They may be either (name, args, options)
    // or (name, args, callback)
    if (!callback && typeof options === 'function') {
      callback = options;
      options = {};
    } else {
      options = options || {};
    }

    const promise = this.applyAsync(name, args, options); // Return the result in whichever way the caller asked for it. Note that we
    // do NOT block on the write fence in an analogous way to how the client
    // blocks on the relevant data being visible, so you are NOT guaranteed that
    // cursor observe callbacks have fired when your callback is invoked. (We
    // can change this if there's a real use case.)

    if (callback) {
      promise.then(result => callback(undefined, result), exception => callback(exception));
    } else {
      return promise.await();
    }
  },
  // @param options {Optional Object}
  applyAsync: function (name, args, options) {
    // Run the handler
    var handler = this.method_handlers[name];

    if (!handler) {
      return Promise.reject(new Meteor.Error(404, `Method '${name}' not found`));
    } // If this is a method call from within another method or publish function,
    // get the user state from the outer method or publish function, otherwise
    // don't allow setUserId to be called


    var userId = null;

    var setUserId = function () {
      throw new Error("Can't call setUserId on a server initiated method call");
    };

    var connection = null;

    var currentMethodInvocation = DDP._CurrentMethodInvocation.get();

    var currentPublicationInvocation = DDP._CurrentPublicationInvocation.get();

    var randomSeed = null;

    if (currentMethodInvocation) {
      userId = currentMethodInvocation.userId;

      setUserId = function (userId) {
        currentMethodInvocation.setUserId(userId);
      };

      connection = currentMethodInvocation.connection;
      randomSeed = DDPCommon.makeRpcSeed(currentMethodInvocation, name);
    } else if (currentPublicationInvocation) {
      userId = currentPublicationInvocation.userId;

      setUserId = function (userId) {
        currentPublicationInvocation._session._setUserId(userId);
      };

      connection = currentPublicationInvocation.connection;
    }

    var invocation = new DDPCommon.MethodInvocation({
      isSimulation: false,
      userId,
      setUserId,
      connection,
      randomSeed
    });
    return new Promise(resolve => resolve(DDP._CurrentMethodInvocation.withValue(invocation, () => maybeAuditArgumentChecks(handler, invocation, EJSON.clone(args), "internal call to '" + name + "'")))).then(EJSON.clone);
  },
  _urlForSession: function (sessionId) {
    var self = this;
    var session = self.sessions[sessionId];
    if (session) return session._socketUrl;else return null;
  }
});

var calculateVersion = function (clientSupportedVersions, serverSupportedVersions) {
  var correctVersion = _.find(clientSupportedVersions, function (version) {
    return _.contains(serverSupportedVersions, version);
  });

  if (!correctVersion) {
    correctVersion = serverSupportedVersions[0];
  }

  return correctVersion;
};

DDPServer._calculateVersion = calculateVersion; // "blind" exceptions other than those that were deliberately thrown to signal
// errors to the client

var wrapInternalException = function (exception, context) {
  if (!exception) return exception; // To allow packages to throw errors intended for the client but not have to
  // depend on the Meteor.Error class, `isClientSafe` can be set to true on any
  // error before it is thrown.

  if (exception.isClientSafe) {
    if (!(exception instanceof Meteor.Error)) {
      const originalMessage = exception.message;
      exception = new Meteor.Error(exception.error, exception.reason, exception.details);
      exception.message = originalMessage;
    }

    return exception;
  } // Tests can set the '_expectedByTest' flag on an exception so it won't go to
  // the server log.


  if (!exception._expectedByTest) {
    Meteor._debug("Exception " + context, exception);

    if (exception.sanitizedError) {
      Meteor._debug("Sanitized and reported to the client as:", exception.sanitizedError);

      Meteor._debug();
    }
  } // Did the error contain more details that could have been useful if caught in
  // server code (or if thrown from non-client-originated code), but also
  // provided a "sanitized" version with more context than 500 Internal server
  // error? Use that.


  if (exception.sanitizedError) {
    if (exception.sanitizedError.isClientSafe) return exception.sanitizedError;

    Meteor._debug("Exception " + context + " provides a sanitizedError that " + "does not have isClientSafe property set; ignoring");
  }

  return new Meteor.Error(500, "Internal server error");
}; // Audit argument checks, if the audit-argument-checks package exists (it is a
// weak dependency of this package).


var maybeAuditArgumentChecks = function (f, context, args, description) {
  args = args || [];

  if (Package['audit-argument-checks']) {
    return Match._failIfArgumentsAreNotAllChecked(f, context, args, description);
  }

  return f.apply(context, args);
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"writefence.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ddp-server/writefence.js                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var Future = Npm.require('fibers/future'); // A write fence collects a group of writes, and provides a callback
// when all of the writes are fully committed and propagated (all
// observers have been notified of the write and acknowledged it.)
//


DDPServer._WriteFence = function () {
  var self = this;
  self.armed = false;
  self.fired = false;
  self.retired = false;
  self.outstanding_writes = 0;
  self.before_fire_callbacks = [];
  self.completion_callbacks = [];
}; // The current write fence. When there is a current write fence, code
// that writes to databases should register their writes with it using
// beginWrite().
//


DDPServer._CurrentWriteFence = new Meteor.EnvironmentVariable();

_.extend(DDPServer._WriteFence.prototype, {
  // Start tracking a write, and return an object to represent it. The
  // object has a single method, committed(). This method should be
  // called when the write is fully committed and propagated. You can
  // continue to add writes to the WriteFence up until it is triggered
  // (calls its callbacks because all writes have committed.)
  beginWrite: function () {
    var self = this;
    if (self.retired) return {
      committed: function () {}
    };
    if (self.fired) throw new Error("fence has already activated -- too late to add writes");
    self.outstanding_writes++;
    var committed = false;
    return {
      committed: function () {
        if (committed) throw new Error("committed called twice on the same write");
        committed = true;
        self.outstanding_writes--;

        self._maybeFire();
      }
    };
  },
  // Arm the fence. Once the fence is armed, and there are no more
  // uncommitted writes, it will activate.
  arm: function () {
    var self = this;
    if (self === DDPServer._CurrentWriteFence.get()) throw Error("Can't arm the current fence");
    self.armed = true;

    self._maybeFire();
  },
  // Register a function to be called once before firing the fence.
  // Callback function can add new writes to the fence, in which case
  // it won't fire until those writes are done as well.
  onBeforeFire: function (func) {
    var self = this;
    if (self.fired) throw new Error("fence has already activated -- too late to " + "add a callback");
    self.before_fire_callbacks.push(func);
  },
  // Register a function to be called when the fence fires.
  onAllCommitted: function (func) {
    var self = this;
    if (self.fired) throw new Error("fence has already activated -- too late to " + "add a callback");
    self.completion_callbacks.push(func);
  },
  // Convenience function. Arms the fence, then blocks until it fires.
  armAndWait: function () {
    var self = this;
    var future = new Future();
    self.onAllCommitted(function () {
      future['return']();
    });
    self.arm();
    future.wait();
  },
  _maybeFire: function () {
    var self = this;
    if (self.fired) throw new Error("write fence already activated?");

    if (self.armed && !self.outstanding_writes) {
      function invokeCallback(func) {
        try {
          func(self);
        } catch (err) {
          Meteor._debug("exception in write fence callback", err);
        }
      }

      self.outstanding_writes++;

      while (self.before_fire_callbacks.length > 0) {
        var callbacks = self.before_fire_callbacks;
        self.before_fire_callbacks = [];

        _.each(callbacks, invokeCallback);
      }

      self.outstanding_writes--;

      if (!self.outstanding_writes) {
        self.fired = true;
        var callbacks = self.completion_callbacks;
        self.completion_callbacks = [];

        _.each(callbacks, invokeCallback);
      }
    }
  },
  // Deactivate this fence so that adding more writes has no effect.
  // The fence must have already fired.
  retire: function () {
    var self = this;
    if (!self.fired) throw new Error("Can't retire a fence that hasn't fired.");
    self.retired = true;
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"crossbar.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ddp-server/crossbar.js                                                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// A "crossbar" is a class that provides structured notification registration.
// See _match for the definition of how a notification matches a trigger.
// All notifications and triggers must have a string key named 'collection'.
DDPServer._Crossbar = function (options) {
  var self = this;
  options = options || {};
  self.nextId = 1; // map from collection name (string) -> listener id -> object. each object has
  // keys 'trigger', 'callback'.  As a hack, the empty string means "no
  // collection".

  self.listenersByCollection = {};
  self.listenersByCollectionCount = {};
  self.factPackage = options.factPackage || "livedata";
  self.factName = options.factName || null;
};

_.extend(DDPServer._Crossbar.prototype, {
  // msg is a trigger or a notification
  _collectionForMessage: function (msg) {
    var self = this;

    if (!_.has(msg, 'collection')) {
      return '';
    } else if (typeof msg.collection === 'string') {
      if (msg.collection === '') throw Error("Message has empty collection!");
      return msg.collection;
    } else {
      throw Error("Message has non-string collection!");
    }
  },
  // Listen for notification that match 'trigger'. A notification
  // matches if it has the key-value pairs in trigger as a
  // subset. When a notification matches, call 'callback', passing
  // the actual notification.
  //
  // Returns a listen handle, which is an object with a method
  // stop(). Call stop() to stop listening.
  //
  // XXX It should be legal to call fire() from inside a listen()
  // callback?
  listen: function (trigger, callback) {
    var self = this;
    var id = self.nextId++;

    var collection = self._collectionForMessage(trigger);

    var record = {
      trigger: EJSON.clone(trigger),
      callback: callback
    };

    if (!_.has(self.listenersByCollection, collection)) {
      self.listenersByCollection[collection] = {};
      self.listenersByCollectionCount[collection] = 0;
    }

    self.listenersByCollection[collection][id] = record;
    self.listenersByCollectionCount[collection]++;

    if (self.factName && Package['facts-base']) {
      Package['facts-base'].Facts.incrementServerFact(self.factPackage, self.factName, 1);
    }

    return {
      stop: function () {
        if (self.factName && Package['facts-base']) {
          Package['facts-base'].Facts.incrementServerFact(self.factPackage, self.factName, -1);
        }

        delete self.listenersByCollection[collection][id];
        self.listenersByCollectionCount[collection]--;

        if (self.listenersByCollectionCount[collection] === 0) {
          delete self.listenersByCollection[collection];
          delete self.listenersByCollectionCount[collection];
        }
      }
    };
  },
  // Fire the provided 'notification' (an object whose attribute
  // values are all JSON-compatibile) -- inform all matching listeners
  // (registered with listen()).
  //
  // If fire() is called inside a write fence, then each of the
  // listener callbacks will be called inside the write fence as well.
  //
  // The listeners may be invoked in parallel, rather than serially.
  fire: function (notification) {
    var self = this;

    var collection = self._collectionForMessage(notification);

    if (!_.has(self.listenersByCollection, collection)) {
      return;
    }

    var listenersForCollection = self.listenersByCollection[collection];
    var callbackIds = [];

    _.each(listenersForCollection, function (l, id) {
      if (self._matches(notification, l.trigger)) {
        callbackIds.push(id);
      }
    }); // Listener callbacks can yield, so we need to first find all the ones that
    // match in a single iteration over self.listenersByCollection (which can't
    // be mutated during this iteration), and then invoke the matching
    // callbacks, checking before each call to ensure they haven't stopped.
    // Note that we don't have to check that
    // self.listenersByCollection[collection] still === listenersForCollection,
    // because the only way that stops being true is if listenersForCollection
    // first gets reduced down to the empty object (and then never gets
    // increased again).


    _.each(callbackIds, function (id) {
      if (_.has(listenersForCollection, id)) {
        listenersForCollection[id].callback(notification);
      }
    });
  },
  // A notification matches a trigger if all keys that exist in both are equal.
  //
  // Examples:
  //  N:{collection: "C"} matches T:{collection: "C"}
  //    (a non-targeted write to a collection matches a
  //     non-targeted query)
  //  N:{collection: "C", id: "X"} matches T:{collection: "C"}
  //    (a targeted write to a collection matches a non-targeted query)
  //  N:{collection: "C"} matches T:{collection: "C", id: "X"}
  //    (a non-targeted write to a collection matches a
  //     targeted query)
  //  N:{collection: "C", id: "X"} matches T:{collection: "C", id: "X"}
  //    (a targeted write to a collection matches a targeted query targeted
  //     at the same document)
  //  N:{collection: "C", id: "X"} does not match T:{collection: "C", id: "Y"}
  //    (a targeted write to a collection does not match a targeted query
  //     targeted at a different document)
  _matches: function (notification, trigger) {
    // Most notifications that use the crossbar have a string `collection` and
    // maybe an `id` that is a string or ObjectID. We're already dividing up
    // triggers by collection, but let's fast-track "nope, different ID" (and
    // avoid the overly generic EJSON.equals). This makes a noticeable
    // performance difference; see https://github.com/meteor/meteor/pull/3697
    if (typeof notification.id === 'string' && typeof trigger.id === 'string' && notification.id !== trigger.id) {
      return false;
    }

    if (notification.id instanceof MongoID.ObjectID && trigger.id instanceof MongoID.ObjectID && !notification.id.equals(trigger.id)) {
      return false;
    }

    return _.all(trigger, function (triggerValue, key) {
      return !_.has(notification, key) || EJSON.equals(triggerValue, notification[key]);
    });
  }
}); // The "invalidation crossbar" is a specific instance used by the DDP server to
// implement write fence notifications. Listener callbacks on this crossbar
// should call beginWrite on the current write fence before they return, if they
// want to delay the write fence from firing (ie, the DDP method-data-updated
// message from being sent).


DDPServer._InvalidationCrossbar = new DDPServer._Crossbar({
  factName: "invalidation-crossbar-listeners"
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server_convenience.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ddp-server/server_convenience.js                                                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
if (process.env.DDP_DEFAULT_CONNECTION_URL) {
  __meteor_runtime_config__.DDP_DEFAULT_CONNECTION_URL = process.env.DDP_DEFAULT_CONNECTION_URL;
}

Meteor.server = new Server();

Meteor.refresh = function (notification) {
  DDPServer._InvalidationCrossbar.fire(notification);
}; // Proxy the public methods of Meteor.server so they can
// be called directly on Meteor.


_.each(['publish', 'methods', 'call', 'apply', 'onConnection', 'onMessage'], function (name) {
  Meteor[name] = _.bind(Meteor.server[name], Meteor.server);
}); // Meteor.server used to be called Meteor.default_server. Provide
// backcompat as a courtesy even though it was never documented.
// XXX COMPAT WITH 0.6.4


Meteor.default_server = Meteor.server;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/ddp-server/stream_server.js");
require("/node_modules/meteor/ddp-server/livedata_server.js");
require("/node_modules/meteor/ddp-server/writefence.js");
require("/node_modules/meteor/ddp-server/crossbar.js");
require("/node_modules/meteor/ddp-server/server_convenience.js");

/* Exports */
Package._define("ddp-server", {
  DDPServer: DDPServer
});

})();

//# sourceURL=meteor://💻app/packages/ddp-server.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvZGRwLXNlcnZlci9zdHJlYW1fc2VydmVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9kZHAtc2VydmVyL2xpdmVkYXRhX3NlcnZlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvZGRwLXNlcnZlci93cml0ZWZlbmNlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9kZHAtc2VydmVyL2Nyb3NzYmFyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9kZHAtc2VydmVyL3NlcnZlcl9jb252ZW5pZW5jZS5qcyJdLCJuYW1lcyI6WyJ1cmwiLCJOcG0iLCJyZXF1aXJlIiwid2Vic29ja2V0RXh0ZW5zaW9ucyIsIl8iLCJvbmNlIiwiZXh0ZW5zaW9ucyIsIndlYnNvY2tldENvbXByZXNzaW9uQ29uZmlnIiwicHJvY2VzcyIsImVudiIsIlNFUlZFUl9XRUJTT0NLRVRfQ09NUFJFU1NJT04iLCJKU09OIiwicGFyc2UiLCJwdXNoIiwiY29uZmlndXJlIiwicGF0aFByZWZpeCIsIl9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18iLCJST09UX1VSTF9QQVRIX1BSRUZJWCIsIlN0cmVhbVNlcnZlciIsInNlbGYiLCJyZWdpc3RyYXRpb25fY2FsbGJhY2tzIiwib3Blbl9zb2NrZXRzIiwicHJlZml4IiwiUm91dGVQb2xpY3kiLCJkZWNsYXJlIiwic29ja2pzIiwic2VydmVyT3B0aW9ucyIsImxvZyIsImhlYXJ0YmVhdF9kZWxheSIsImRpc2Nvbm5lY3RfZGVsYXkiLCJqc2Vzc2lvbmlkIiwiVVNFX0pTRVNTSU9OSUQiLCJESVNBQkxFX1dFQlNPQ0tFVFMiLCJ3ZWJzb2NrZXQiLCJmYXllX3NlcnZlcl9vcHRpb25zIiwic2VydmVyIiwiY3JlYXRlU2VydmVyIiwiV2ViQXBwIiwiaHR0cFNlcnZlciIsInJlbW92ZUxpc3RlbmVyIiwiX3RpbWVvdXRBZGp1c3RtZW50UmVxdWVzdENhbGxiYWNrIiwiaW5zdGFsbEhhbmRsZXJzIiwiYWRkTGlzdGVuZXIiLCJfcmVkaXJlY3RXZWJzb2NrZXRFbmRwb2ludCIsIm9uIiwic29ja2V0Iiwic2V0V2Vic29ja2V0VGltZW91dCIsInRpbWVvdXQiLCJwcm90b2NvbCIsIl9zZXNzaW9uIiwicmVjdiIsImNvbm5lY3Rpb24iLCJzZXRUaW1lb3V0Iiwic2VuZCIsImRhdGEiLCJ3cml0ZSIsIndpdGhvdXQiLCJzdHJpbmdpZnkiLCJzZXJ2ZXJfaWQiLCJlYWNoIiwiY2FsbGJhY2siLCJleHRlbmQiLCJwcm90b3R5cGUiLCJyZWdpc3RlciIsImFsbF9zb2NrZXRzIiwidmFsdWVzIiwiZXZlbnQiLCJvbGRIdHRwU2VydmVyTGlzdGVuZXJzIiwibGlzdGVuZXJzIiwic2xpY2UiLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJuZXdMaXN0ZW5lciIsInJlcXVlc3QiLCJhcmdzIiwiYXJndW1lbnRzIiwicGFyc2VkVXJsIiwicGF0aG5hbWUiLCJmb3JtYXQiLCJvbGRMaXN0ZW5lciIsImFwcGx5IiwiRERQU2VydmVyIiwiRmliZXIiLCJTZXNzaW9uRG9jdW1lbnRWaWV3IiwiZXhpc3RzSW4iLCJkYXRhQnlLZXkiLCJfU2Vzc2lvbkRvY3VtZW50VmlldyIsImdldEZpZWxkcyIsInJldCIsInByZWNlZGVuY2VMaXN0Iiwia2V5IiwidmFsdWUiLCJjbGVhckZpZWxkIiwic3Vic2NyaXB0aW9uSGFuZGxlIiwiY2hhbmdlQ29sbGVjdG9yIiwicmVtb3ZlZFZhbHVlIiwidW5kZWZpbmVkIiwiaSIsImxlbmd0aCIsInByZWNlZGVuY2UiLCJzcGxpY2UiLCJpc0VtcHR5IiwiRUpTT04iLCJlcXVhbHMiLCJjaGFuZ2VGaWVsZCIsImlzQWRkIiwiY2xvbmUiLCJoYXMiLCJlbHQiLCJmaW5kIiwiU2Vzc2lvbkNvbGxlY3Rpb25WaWV3IiwiY29sbGVjdGlvbk5hbWUiLCJzZXNzaW9uQ2FsbGJhY2tzIiwiZG9jdW1lbnRzIiwiY2FsbGJhY2tzIiwiX1Nlc3Npb25Db2xsZWN0aW9uVmlldyIsImRpZmYiLCJwcmV2aW91cyIsIkRpZmZTZXF1ZW5jZSIsImRpZmZPYmplY3RzIiwiYm90aCIsImJpbmQiLCJkaWZmRG9jdW1lbnQiLCJyaWdodE9ubHkiLCJpZCIsIm5vd0RWIiwiYWRkZWQiLCJsZWZ0T25seSIsInByZXZEViIsInJlbW92ZWQiLCJmaWVsZHMiLCJwcmV2Iiwibm93IiwiY2hhbmdlZCIsImRvY1ZpZXciLCJjaGFuZ2VkUmVzdWx0IiwiRXJyb3IiLCJlcnIiLCJTZXNzaW9uIiwidmVyc2lvbiIsIm9wdGlvbnMiLCJSYW5kb20iLCJpbml0aWFsaXplZCIsImluUXVldWUiLCJNZXRlb3IiLCJfRG91YmxlRW5kZWRRdWV1ZSIsImJsb2NrZWQiLCJ3b3JrZXJSdW5uaW5nIiwiX25hbWVkU3VicyIsIl91bml2ZXJzYWxTdWJzIiwidXNlcklkIiwiY29sbGVjdGlvblZpZXdzIiwiX2lzU2VuZGluZyIsIl9kb250U3RhcnROZXdVbml2ZXJzYWxTdWJzIiwiX3BlbmRpbmdSZWFkeSIsIl9jbG9zZUNhbGxiYWNrcyIsIl9zb2NrZXRVcmwiLCJfcmVzcG9uZFRvUGluZ3MiLCJyZXNwb25kVG9QaW5ncyIsImNvbm5lY3Rpb25IYW5kbGUiLCJjbG9zZSIsIm9uQ2xvc2UiLCJmbiIsImNiIiwiYmluZEVudmlyb25tZW50IiwiZGVmZXIiLCJjbGllbnRBZGRyZXNzIiwiX2NsaWVudEFkZHJlc3MiLCJodHRwSGVhZGVycyIsImhlYWRlcnMiLCJtc2ciLCJzZXNzaW9uIiwic3RhcnRVbml2ZXJzYWxTdWJzIiwicnVuIiwiaGVhcnRiZWF0SW50ZXJ2YWwiLCJoZWFydGJlYXQiLCJERFBDb21tb24iLCJIZWFydGJlYXQiLCJoZWFydGJlYXRUaW1lb3V0Iiwib25UaW1lb3V0Iiwic2VuZFBpbmciLCJzdGFydCIsIlBhY2thZ2UiLCJGYWN0cyIsImluY3JlbWVudFNlcnZlckZhY3QiLCJzZW5kUmVhZHkiLCJzdWJzY3JpcHRpb25JZHMiLCJzdWJzIiwic3Vic2NyaXB0aW9uSWQiLCJzZW5kQWRkZWQiLCJjb2xsZWN0aW9uIiwic2VuZENoYW5nZWQiLCJzZW5kUmVtb3ZlZCIsImdldFNlbmRDYWxsYmFja3MiLCJnZXRDb2xsZWN0aW9uVmlldyIsInZpZXciLCJoYW5kbGVycyIsInVuaXZlcnNhbF9wdWJsaXNoX2hhbmRsZXJzIiwiaGFuZGxlciIsIl9zdGFydFN1YnNjcmlwdGlvbiIsInN0b3AiLCJfbWV0ZW9yU2Vzc2lvbiIsIl9kZWFjdGl2YXRlQWxsU3Vic2NyaXB0aW9ucyIsIl9yZW1vdmVTZXNzaW9uIiwiX3ByaW50U2VudEREUCIsIl9kZWJ1ZyIsInN0cmluZ2lmeUREUCIsInNlbmRFcnJvciIsInJlYXNvbiIsIm9mZmVuZGluZ01lc3NhZ2UiLCJwcm9jZXNzTWVzc2FnZSIsIm1zZ19pbiIsIm1lc3NhZ2VSZWNlaXZlZCIsInByb2Nlc3NOZXh0Iiwic2hpZnQiLCJ1bmJsb2NrIiwib25NZXNzYWdlSG9vayIsInByb3RvY29sX2hhbmRsZXJzIiwiY2FsbCIsInN1YiIsIm5hbWUiLCJwYXJhbXMiLCJBcnJheSIsInB1Ymxpc2hfaGFuZGxlcnMiLCJlcnJvciIsIkREUFJhdGVMaW1pdGVyIiwicmF0ZUxpbWl0ZXJJbnB1dCIsInR5cGUiLCJjb25uZWN0aW9uSWQiLCJfaW5jcmVtZW50IiwicmF0ZUxpbWl0UmVzdWx0IiwiX2NoZWNrIiwiYWxsb3dlZCIsImdldEVycm9yTWVzc2FnZSIsInRpbWVUb1Jlc2V0IiwidW5zdWIiLCJfc3RvcFN1YnNjcmlwdGlvbiIsIm1ldGhvZCIsInJhbmRvbVNlZWQiLCJmZW5jZSIsIl9Xcml0ZUZlbmNlIiwib25BbGxDb21taXR0ZWQiLCJyZXRpcmUiLCJtZXRob2RzIiwibWV0aG9kX2hhbmRsZXJzIiwiYXJtIiwic2V0VXNlcklkIiwiX3NldFVzZXJJZCIsImludm9jYXRpb24iLCJNZXRob2RJbnZvY2F0aW9uIiwiaXNTaW11bGF0aW9uIiwicHJvbWlzZSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiX0N1cnJlbnRXcml0ZUZlbmNlIiwid2l0aFZhbHVlIiwiRERQIiwiX0N1cnJlbnRNZXRob2RJbnZvY2F0aW9uIiwibWF5YmVBdWRpdEFyZ3VtZW50Q2hlY2tzIiwiZmluaXNoIiwicGF5bG9hZCIsInRoZW4iLCJyZXN1bHQiLCJleGNlcHRpb24iLCJ3cmFwSW50ZXJuYWxFeGNlcHRpb24iLCJfZWFjaFN1YiIsImYiLCJfZGlmZkNvbGxlY3Rpb25WaWV3cyIsImJlZm9yZUNWcyIsImxlZnRWYWx1ZSIsInJpZ2h0VmFsdWUiLCJkb2MiLCJfZGVhY3RpdmF0ZSIsIm9sZE5hbWVkU3VicyIsIl9yZWNyZWF0ZSIsIl9ydW5IYW5kbGVyIiwiX25vWWllbGRzQWxsb3dlZCIsInN1YklkIiwiU3Vic2NyaXB0aW9uIiwic3ViTmFtZSIsIl9uYW1lIiwiX3JlbW92ZUFsbERvY3VtZW50cyIsInJlc3BvbnNlIiwiaHR0cEZvcndhcmRlZENvdW50IiwicGFyc2VJbnQiLCJyZW1vdGVBZGRyZXNzIiwiZm9yd2FyZGVkRm9yIiwiaXNTdHJpbmciLCJ0cmltIiwic3BsaXQiLCJfaGFuZGxlciIsIl9zdWJzY3JpcHRpb25JZCIsIl9wYXJhbXMiLCJfc3Vic2NyaXB0aW9uSGFuZGxlIiwiX2RlYWN0aXZhdGVkIiwiX3N0b3BDYWxsYmFja3MiLCJfZG9jdW1lbnRzIiwiX3JlYWR5IiwiX2lkRmlsdGVyIiwiaWRTdHJpbmdpZnkiLCJNb25nb0lEIiwiaWRQYXJzZSIsInJlcyIsIl9DdXJyZW50UHVibGljYXRpb25JbnZvY2F0aW9uIiwiZSIsIl9pc0RlYWN0aXZhdGVkIiwiX3B1Ymxpc2hIYW5kbGVyUmVzdWx0IiwiaXNDdXJzb3IiLCJjIiwiX3B1Ymxpc2hDdXJzb3IiLCJyZWFkeSIsImlzQXJyYXkiLCJhbGwiLCJjb2xsZWN0aW9uTmFtZXMiLCJfZ2V0Q29sbGVjdGlvbk5hbWUiLCJjdXIiLCJfY2FsbFN0b3BDYWxsYmFja3MiLCJjb2xsZWN0aW9uRG9jcyIsImtleXMiLCJzdHJJZCIsIm9uU3RvcCIsIl9lbnN1cmUiLCJTZXJ2ZXIiLCJkZWZhdWx0cyIsIm9uQ29ubmVjdGlvbkhvb2siLCJIb29rIiwiZGVidWdQcmludEV4Y2VwdGlvbnMiLCJzZXNzaW9ucyIsInN0cmVhbV9zZXJ2ZXIiLCJyYXdfbXNnIiwiX3ByaW50UmVjZWl2ZWRERFAiLCJwYXJzZUREUCIsIl9oYW5kbGVDb25uZWN0Iiwib25Db25uZWN0aW9uIiwib25NZXNzYWdlIiwic3VwcG9ydCIsImNvbnRhaW5zIiwiU1VQUE9SVEVEX0REUF9WRVJTSU9OUyIsImNhbGN1bGF0ZVZlcnNpb24iLCJwdWJsaXNoIiwiaXNPYmplY3QiLCJhdXRvcHVibGlzaCIsImlzX2F1dG8iLCJ3YXJuZWRfYWJvdXRfYXV0b3B1Ymxpc2giLCJmdW5jIiwicG9wIiwiY2FsbEFzeW5jIiwiYXBwbHlBc3luYyIsImF3YWl0IiwiY3VycmVudE1ldGhvZEludm9jYXRpb24iLCJnZXQiLCJjdXJyZW50UHVibGljYXRpb25JbnZvY2F0aW9uIiwibWFrZVJwY1NlZWQiLCJfdXJsRm9yU2Vzc2lvbiIsInNlc3Npb25JZCIsImNsaWVudFN1cHBvcnRlZFZlcnNpb25zIiwic2VydmVyU3VwcG9ydGVkVmVyc2lvbnMiLCJjb3JyZWN0VmVyc2lvbiIsIl9jYWxjdWxhdGVWZXJzaW9uIiwiY29udGV4dCIsImlzQ2xpZW50U2FmZSIsIm9yaWdpbmFsTWVzc2FnZSIsIm1lc3NhZ2UiLCJkZXRhaWxzIiwiX2V4cGVjdGVkQnlUZXN0Iiwic2FuaXRpemVkRXJyb3IiLCJkZXNjcmlwdGlvbiIsIk1hdGNoIiwiX2ZhaWxJZkFyZ3VtZW50c0FyZU5vdEFsbENoZWNrZWQiLCJGdXR1cmUiLCJhcm1lZCIsImZpcmVkIiwicmV0aXJlZCIsIm91dHN0YW5kaW5nX3dyaXRlcyIsImJlZm9yZV9maXJlX2NhbGxiYWNrcyIsImNvbXBsZXRpb25fY2FsbGJhY2tzIiwiRW52aXJvbm1lbnRWYXJpYWJsZSIsImJlZ2luV3JpdGUiLCJjb21taXR0ZWQiLCJfbWF5YmVGaXJlIiwib25CZWZvcmVGaXJlIiwiYXJtQW5kV2FpdCIsImZ1dHVyZSIsIndhaXQiLCJpbnZva2VDYWxsYmFjayIsIl9Dcm9zc2JhciIsIm5leHRJZCIsImxpc3RlbmVyc0J5Q29sbGVjdGlvbiIsImxpc3RlbmVyc0J5Q29sbGVjdGlvbkNvdW50IiwiZmFjdFBhY2thZ2UiLCJmYWN0TmFtZSIsIl9jb2xsZWN0aW9uRm9yTWVzc2FnZSIsImxpc3RlbiIsInRyaWdnZXIiLCJyZWNvcmQiLCJmaXJlIiwibm90aWZpY2F0aW9uIiwibGlzdGVuZXJzRm9yQ29sbGVjdGlvbiIsImNhbGxiYWNrSWRzIiwibCIsIl9tYXRjaGVzIiwiT2JqZWN0SUQiLCJ0cmlnZ2VyVmFsdWUiLCJfSW52YWxpZGF0aW9uQ3Jvc3NiYXIiLCJERFBfREVGQVVMVF9DT05ORUNUSU9OX1VSTCIsInJlZnJlc2giLCJkZWZhdWx0X3NlcnZlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSUEsR0FBRyxHQUFHQyxHQUFHLENBQUNDLE9BQUosQ0FBWSxLQUFaLENBQVYsQyxDQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUNBLElBQUlDLG1CQUFtQixHQUFHQyxDQUFDLENBQUNDLElBQUYsQ0FBTyxZQUFZO0FBQzNDLE1BQUlDLFVBQVUsR0FBRyxFQUFqQjtBQUVBLE1BQUlDLDBCQUEwQixHQUFHQyxPQUFPLENBQUNDLEdBQVIsQ0FBWUMsNEJBQVosR0FDekJDLElBQUksQ0FBQ0MsS0FBTCxDQUFXSixPQUFPLENBQUNDLEdBQVIsQ0FBWUMsNEJBQXZCLENBRHlCLEdBQzhCLEVBRC9EOztBQUVBLE1BQUlILDBCQUFKLEVBQWdDO0FBQzlCRCxjQUFVLENBQUNPLElBQVgsQ0FBZ0JaLEdBQUcsQ0FBQ0MsT0FBSixDQUFZLG9CQUFaLEVBQWtDWSxTQUFsQyxDQUNkUCwwQkFEYyxDQUFoQjtBQUdEOztBQUVELFNBQU9ELFVBQVA7QUFDRCxDQVp5QixDQUExQjs7QUFjQSxJQUFJUyxVQUFVLEdBQUdDLHlCQUF5QixDQUFDQyxvQkFBMUIsSUFB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LFFBQU0sQ0FBQzRFLElBQUQsQ0FBTixHQUFldk4sQ0FBQyxDQUFDb0gsSUFBRixDQUFPdUIsTUFBTSxDQUFDNUcsTUFBUCxDQUFjd0wsSUFBZCxDQUFQLEVBQTRCNUUsTUFBTSxDQUFDNUcsTUFBbkMsQ0FBZjtBQUNELENBSFIsRSxDQUtBO0FBQ0E7QUFDQTs7O0FBQ0E0RyxNQUFNLENBQUN1USxjQUFQLEdBQXdCdlEsTUFBTSxDQUFDNUcsTUFBL0IsQyIsImZpbGUiOiIvcGFja2FnZXMvZGRwLXNlcnZlci5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciB1cmwgPSBOcG0ucmVxdWlyZSgndXJsJyk7XG5cbi8vIEJ5IGRlZmF1bHQsIHdlIHVzZSB0aGUgcGVybWVzc2FnZS1kZWZsYXRlIGV4dGVuc2lvbiB3aXRoIGRlZmF1bHRcbi8vIGNvbmZpZ3VyYXRpb24uIElmICRTRVJWRVJfV0VCU09DS0VUX0NPTVBSRVNTSU9OIGlzIHNldCwgdGhlbiBpdCBtdXN0IGJlIHZhbGlkXG4vLyBKU09OLiBJZiBpdCByZXByZXNlbnRzIGEgZmFsc2V5IHZhbHVlLCB0aGVuIHdlIGRvIG5vdCB1c2UgcGVybWVzc2FnZS1kZWZsYXRlXG4vLyBhdCBhbGw7IG90aGVyd2lzZSwgdGhlIEpTT04gdmFsdWUgaXMgdXNlZCBhcyBhbiBhcmd1bWVudCB0byBkZWZsYXRlJ3Ncbi8vIGNvbmZpZ3VyZSBtZXRob2Q7IHNlZVxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2ZheWUvcGVybWVzc2FnZS1kZWZsYXRlLW5vZGUvYmxvYi9tYXN0ZXIvUkVBRE1FLm1kXG4vL1xuLy8gKFdlIGRvIHRoaXMgaW4gYW4gXy5vbmNlIGluc3RlYWQgb2YgYXQgc3RhcnR1cCwgYmVjYXVzZSB3ZSBkb24ndCB3YW50IHRvXG4vLyBjcmFzaCB0aGUgdG9vbCBkdXJpbmcgaXNvcGFja2V0IGxvYWQgaWYgeW91ciBKU09OIGRvZXNuJ3QgcGFyc2UuIFRoaXMgaXMgb25seVxuLy8gYSBwcm9ibGVtIGJlY2F1c2UgdGhlIHRvb2wgaGFzIHRvIGxvYWQgdGhlIEREUCBzZXJ2ZXIgY29kZSBqdXN0IGluIG9yZGVyIHRvXG4vLyBiZSBhIEREUCBjbGllbnQ7IHNlZSBodHRwczovL2dpdGh1Yi5jb20vbWV0ZW9yL21ldGVvci9pc3N1ZXMvMzQ1MiAuKVxudmFyIHdlYnNvY2tldEV4dGVuc2lvbnMgPSBfLm9uY2UoZnVuY3Rpb24gKCkge1xuICB2YXIgZXh0ZW5zaW9ucyA9IFtdO1xuXG4gIHZhciB3ZWJzb2NrZXRDb21wcmVzc2lvbkNvbmZpZyA9IHByb2Nlc3MuZW52LlNFUlZFUl9XRUJTT0NLRVRfQ09NUFJFU1NJT05cbiAgICAgICAgPyBKU09OLnBhcnNlKHByb2Nlc3MuZW52LlNFUlZFUl9XRUJTT0NLRVRfQ09NUFJFU1NJT04pIDoge307XG4gIGlmICh3ZWJzb2NrZXRDb21wcmVzc2lvbkNvbmZpZykge1xuICAgIGV4dGVuc2lvbnMucHVzaChOcG0ucmVxdWlyZSgncGVybWVzc2FnZS1kZWZsYXRlJykuY29uZmlndXJlKFxuICAgICAgd2Vic29ja2V0Q29tcHJlc3Npb25Db25maWdcbiAgICApKTtcbiAgfVxuXG4gIHJldHVybiBleHRlbnNpb25zO1xufSk7XG5cbnZhciBwYXRoUHJlZml4ID0gX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ST09UX1VSTF9QQVRIX1BSRUZJWCB8fCAgXCJcIjtcblxuU3RyZWFtU2VydmVyID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHNlbGYucmVnaXN0cmF0aW9uX2NhbGxiYWNrcyA9IFtdO1xuICBzZWxmLm9wZW5fc29ja2V0cyA9IFtdO1xuXG4gIC8vIEJlY2F1c2Ugd2UgYXJlIGluc3RhbGxpbmcgZGlyZWN0bHkgb250byBXZWJBcHAuaHR0cFNlcnZlciBpbnN0ZWFkIG9mIHVzaW5nXG4gIC8vIFdlYkFwcC5hcHAsIHdlIGhhdmUgdG8gcHJvY2VzcyB0aGUgcGF0aCBwcmVmaXggb3Vyc2VsdmVzLlxuICBzZWxmLnByZWZpeCA9IHBhdGhQcmVmaXggKyAnL3NvY2tqcyc7XG4gIFJvdXRlUG9saWN5LmRlY2xhcmUoc2VsZi5wcmVmaXggKyAnLycsICduZXR3b3JrJyk7XG5cbiAgLy8gc2V0IHVwIHNvY2tqc1xuICB2YXIgc29ja2pzID0gTnBtLnJlcXVpcmUoJ3NvY2tqcycpO1xuICB2YXIgc2VydmVyT3B0aW9ucyA9IHtcbiAgICBwcmVmaXg6IHNlbGYucHJlZml4LFxuICAgIGxvZzogZnVuY3Rpb24oKSB7fSxcbiAgICAvLyB0aGlzIGlzIHRoZSBkZWZhdWx0LCBidXQgd2UgY29kZSBpdCBleHBsaWNpdGx5IGJlY2F1c2Ugd2UgZGVwZW5kXG4gICAgLy8gb24gaXQgaW4gc3RyZWFtX2NsaWVudDpIRUFSVEJFQVRfVElNRU9VVFxuICAgIGhlYXJ0YmVhdF9kZWxheTogNDUwMDAsXG4gICAgLy8gVGhlIGRlZmF1bHQgZGlzY29ubmVjdF9kZWxheSBpcyA1IHNlY29uZHMsIGJ1dCBpZiB0aGUgc2VydmVyIGVuZHMgdXAgQ1BVXG4gICAgLy8gYm91bmQgZm9yIHRoYXQgbXVjaCB0aW1lLCBTb2NrSlMgbWlnaHQgbm90IG5vdGljZSB0aGF0IHRoZSB1c2VyIGhhc1xuICAgIC8vIHJlY29ubmVjdGVkIGJlY2F1c2UgdGhlIHRpbWVyIChvZiBkaXNjb25uZWN0X2RlbGF5IG1zKSBjYW4gZmlyZSBiZWZvcmVcbiAgICAvLyBTb2NrSlMgcHJvY2Vzc2VzIHRoZSBuZXcgY29ubmVjdGlvbi4gRXZlbnR1YWxseSB3ZSdsbCBmaXggdGhpcyBieSBub3RcbiAgICAvLyBjb21iaW5pbmcgQ1BVLWhlYXZ5IHByb2Nlc3Npbmcgd2l0aCBTb2NrSlMgdGVybWluYXRpb24gKGVnIGEgcHJveHkgd2hpY2hcbiAgICAvLyBjb252ZXJ0cyB0byBVbml4IHNvY2tldHMpIGJ1dCBmb3Igbm93LCByYWlzZSB0aGUgZGVsYXkuXG4gICAgZGlzY29ubmVjdF9kZWxheTogNjAgKiAxMDAwLFxuICAgIC8vIFNldCB0aGUgVVNFX0pTRVNTSU9OSUQgZW52aXJvbm1lbnQgdmFyaWFibGUgdG8gZW5hYmxlIHNldHRpbmcgdGhlXG4gICAgLy8gSlNFU1NJT05JRCBjb29raWUuIFRoaXMgaXMgdXNlZnVsIGZvciBzZXR0aW5nIHVwIHByb3hpZXMgd2l0aFxuICAgIC8vIHNlc3Npb24gYWZmaW5pdHkuXG4gICAganNlc3Npb25pZDogISFwcm9jZXNzLmVudi5VU0VfSlNFU1NJT05JRFxuICB9O1xuXG4gIC8vIElmIHlvdSBrbm93IHlvdXIgc2VydmVyIGVudmlyb25tZW50IChlZywgcHJveGllcykgd2lsbCBwcmV2ZW50IHdlYnNvY2tldHNcbiAgLy8gZnJvbSBldmVyIHdvcmtpbmcsIHNldCAkRElTQUJMRV9XRUJTT0NLRVRTIGFuZCBTb2NrSlMgY2xpZW50cyAoaWUsXG4gIC8vIGJyb3dzZXJzKSB3aWxsIG5vdCB3YXN0ZSB0aW1lIGF0dGVtcHRpbmcgdG8gdXNlIHRoZW0uXG4gIC8vIChZb3VyIHNlcnZlciB3aWxsIHN0aWxsIGhhdmUgYSAvd2Vic29ja2V0IGVuZHBvaW50LilcbiAgaWYgKHByb2Nlc3MuZW52LkRJU0FCTEVfV0VCU09DS0VUUykge1xuICAgIHNlcnZlck9wdGlvbnMud2Vic29ja2V0ID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgc2VydmVyT3B0aW9ucy5mYXllX3NlcnZlcl9vcHRpb25zID0ge1xuICAgICAgZXh0ZW5zaW9uczogd2Vic29ja2V0RXh0ZW5zaW9ucygpXG4gICAgfTtcbiAgfVxuXG4gIHNlbGYuc2VydmVyID0gc29ja2pzLmNyZWF0ZVNlcnZlcihzZXJ2ZXJPcHRpb25zKTtcblxuICAvLyBJbnN0YWxsIHRoZSBzb2NranMgaGFuZGxlcnMsIGJ1dCB3ZSB3YW50IHRvIGtlZXAgYXJvdW5kIG91ciBvd24gcGFydGljdWxhclxuICAvLyByZXF1ZXN0IGhhbmRsZXIgdGhhdCBhZGp1c3RzIGlkbGUgdGltZW91dHMgd2hpbGUgd2UgaGF2ZSBhbiBvdXRzdGFuZGluZ1xuICAvLyByZXF1ZXN0LiAgVGhpcyBjb21wZW5zYXRlcyBmb3IgdGhlIGZhY3QgdGhhdCBzb2NranMgcmVtb3ZlcyBhbGwgbGlzdGVuZXJzXG4gIC8vIGZvciBcInJlcXVlc3RcIiB0byBhZGQgaXRzIG93bi5cbiAgV2ViQXBwLmh0dHBTZXJ2ZXIucmVtb3ZlTGlzdGVuZXIoXG4gICAgJ3JlcXVlc3QnLCBXZWJBcHAuX3RpbWVvdXRBZGp1c3RtZW50UmVxdWVzdENhbGxiYWNrKTtcbiAgc2VsZi5zZXJ2ZXIuaW5zdGFsbEhhbmRsZXJzKFdlYkFwcC5odHRwU2VydmVyKTtcbiAgV2ViQXBwLmh0dHBTZXJ2ZXIuYWRkTGlzdGVuZXIoXG4gICAgJ3JlcXVlc3QnLCBXZWJBcHAuX3RpbWVvdXRBZGp1c3RtZW50UmVxdWVzdENhbGxiYWNrKTtcblxuICAvLyBTdXBwb3J0IHRoZSAvd2Vic29ja2V0IGVuZHBvaW50XG4gIHNlbGYuX3JlZGlyZWN0V2Vic29ja2V0RW5kcG9pbnQoKTtcblxuICBzZWxmLnNlcnZlci5vbignY29ubmVjdGlvbicsIGZ1bmN0aW9uIChzb2NrZXQpIHtcbiAgICAvLyBXZSB3YW50IHRvIG1ha2Ugc3VyZSB0aGF0IGlmIGEgY2xpZW50IGNvbm5lY3RzIHRvIHVzIGFuZCBkb2VzIHRoZSBpbml0aWFsXG4gICAgLy8gV2Vic29ja2V0IGhhbmRzaGFrZSBidXQgbmV2ZXIgZ2V0cyB0byB0aGUgRERQIGhhbmRzaGFrZSwgdGhhdCB3ZVxuICAgIC8vIGV2ZW50dWFsbHkga2lsbCB0aGUgc29ja2V0LiAgT25jZSB0aGUgRERQIGhhbmRzaGFrZSBoYXBwZW5zLCBERFBcbiAgICAvLyBoZWFydGJlYXRpbmcgd2lsbCB3b3JrLiBBbmQgYmVmb3JlIHRoZSBXZWJzb2NrZXQgaGFuZHNoYWtlLCB0aGUgdGltZW91dHNcbiAgICAvLyB3ZSBzZXQgYXQgdGhlIHNlcnZlciBsZXZlbCBpbiB3ZWJhcHBfc2VydmVyLmpzIHdpbGwgd29yay4gQnV0XG4gICAgLy8gZmF5ZS13ZWJzb2NrZXQgY2FsbHMgc2V0VGltZW91dCgwKSBvbiBhbnkgc29ja2V0IGl0IHRha2VzIG92ZXIsIHNvIHRoZXJlXG4gICAgLy8gaXMgYW4gXCJpbiBiZXR3ZWVuXCIgc3RhdGUgd2hlcmUgdGhpcyBkb2Vzbid0IGhhcHBlbi4gIFdlIHdvcmsgYXJvdW5kIHRoaXNcbiAgICAvLyBieSBleHBsaWNpdGx5IHNldHRpbmcgdGhlIHNvY2tldCB0aW1lb3V0IHRvIGEgcmVsYXRpdmVseSBsYXJnZSB0aW1lIGhlcmUsXG4gICAgLy8gYW5kIHNldHRpbmcgaXQgYmFjayB0byB6ZXJvIHdoZW4gd2Ugc2V0IHVwIHRoZSBoZWFydGJlYXQgaW5cbiAgICAvLyBsaXZlZGF0YV9zZXJ2ZXIuanMuXG4gICAgc29ja2V0LnNldFdlYnNvY2tldFRpbWVvdXQgPSBmdW5jdGlvbiAodGltZW91dCkge1xuICAgICAgaWYgKChzb2NrZXQucHJvdG9jb2wgPT09ICd3ZWJzb2NrZXQnIHx8XG4gICAgICAgICAgIHNvY2tldC5wcm90b2NvbCA9PT0gJ3dlYnNvY2tldC1yYXcnKVxuICAgICAgICAgICYmIHNvY2tldC5fc2Vzc2lvbi5yZWN2KSB7XG4gICAgICAgIHNvY2tldC5fc2Vzc2lvbi5yZWN2LmNvbm5lY3Rpb24uc2V0VGltZW91dCh0aW1lb3V0KTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHNvY2tldC5zZXRXZWJzb2NrZXRUaW1lb3V0KDQ1ICogMTAwMCk7XG5cbiAgICBzb2NrZXQuc2VuZCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICBzb2NrZXQud3JpdGUoZGF0YSk7XG4gICAgfTtcbiAgICBzb2NrZXQub24oJ2Nsb3NlJywgZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi5vcGVuX3NvY2tldHMgPSBfLndpdGhvdXQoc2VsZi5vcGVuX3NvY2tldHMsIHNvY2tldCk7XG4gICAgfSk7XG4gICAgc2VsZi5vcGVuX3NvY2tldHMucHVzaChzb2NrZXQpO1xuXG4gICAgLy8gWFhYIENPTVBBVCBXSVRIIDAuNi42LiBTZW5kIHRoZSBvbGQgc3R5bGUgd2VsY29tZSBtZXNzYWdlLCB3aGljaFxuICAgIC8vIHdpbGwgZm9yY2Ugb2xkIGNsaWVudHMgdG8gcmVsb2FkLiBSZW1vdmUgdGhpcyBvbmNlIHdlJ3JlIG5vdFxuICAgIC8vIGNvbmNlcm5lZCBhYm91dCBwZW9wbGUgdXBncmFkaW5nIGZyb20gYSBwcmUtMC43LjAgcmVsZWFzZS4gQWxzbyxcbiAgICAvLyByZW1vdmUgdGhlIGNsYXVzZSBpbiB0aGUgY2xpZW50IHRoYXQgaWdub3JlcyB0aGUgd2VsY29tZSBtZXNzYWdlXG4gICAgLy8gKGxpdmVkYXRhX2Nvbm5lY3Rpb24uanMpXG4gICAgc29ja2V0LnNlbmQoSlNPTi5zdHJpbmdpZnkoe3NlcnZlcl9pZDogXCIwXCJ9KSk7XG5cbiAgICAvLyBjYWxsIGFsbCBvdXIgY2FsbGJhY2tzIHdoZW4gd2UgZ2V0IGEgbmV3IHNvY2tldC4gdGhleSB3aWxsIGRvIHRoZVxuICAgIC8vIHdvcmsgb2Ygc2V0dGluZyB1cCBoYW5kbGVycyBhbmQgc3VjaCBmb3Igc3BlY2lmaWMgbWVzc2FnZXMuXG4gICAgXy5lYWNoKHNlbGYucmVnaXN0cmF0aW9uX2NhbGxiYWNrcywgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICBjYWxsYmFjayhzb2NrZXQpO1xuICAgIH0pO1xuICB9KTtcblxufTtcblxuXy5leHRlbmQoU3RyZWFtU2VydmVyLnByb3RvdHlwZSwge1xuICAvLyBjYWxsIG15IGNhbGxiYWNrIHdoZW4gYSBuZXcgc29ja2V0IGNvbm5lY3RzLlxuICAvLyBhbHNvIGNhbGwgaXQgZm9yIGFsbCBjdXJyZW50IGNvbm5lY3Rpb25zLlxuICByZWdpc3RlcjogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHNlbGYucmVnaXN0cmF0aW9uX2NhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICBfLmVhY2goc2VsZi5hbGxfc29ja2V0cygpLCBmdW5jdGlvbiAoc29ja2V0KSB7XG4gICAgICBjYWxsYmFjayhzb2NrZXQpO1xuICAgIH0pO1xuICB9LFxuXG4gIC8vIGdldCBhIGxpc3Qgb2YgYWxsIHNvY2tldHNcbiAgYWxsX3NvY2tldHM6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgcmV0dXJuIF8udmFsdWVzKHNlbGYub3Blbl9zb2NrZXRzKTtcbiAgfSxcblxuICAvLyBSZWRpcmVjdCAvd2Vic29ja2V0IHRvIC9zb2NranMvd2Vic29ja2V0IGluIG9yZGVyIHRvIG5vdCBleHBvc2VcbiAgLy8gc29ja2pzIHRvIGNsaWVudHMgdGhhdCB3YW50IHRvIHVzZSByYXcgd2Vic29ja2V0c1xuICBfcmVkaXJlY3RXZWJzb2NrZXRFbmRwb2ludDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIC8vIFVuZm9ydHVuYXRlbHkgd2UgY2FuJ3QgdXNlIGEgY29ubmVjdCBtaWRkbGV3YXJlIGhlcmUgc2luY2VcbiAgICAvLyBzb2NranMgaW5zdGFsbHMgaXRzZWxmIHByaW9yIHRvIGFsbCBleGlzdGluZyBsaXN0ZW5lcnNcbiAgICAvLyAobWVhbmluZyBwcmlvciB0byBhbnkgY29ubmVjdCBtaWRkbGV3YXJlcykgc28gd2UgbmVlZCB0byB0YWtlXG4gICAgLy8gYW4gYXBwcm9hY2ggc2ltaWxhciB0byBvdmVyc2hhZG93TGlzdGVuZXJzIGluXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3NvY2tqcy9zb2NranMtbm9kZS9ibG9iL2NmODIwYzU1YWY2YTk5NTNlMTY1NTg1NTVhMzFkZWNlYTU1NGY3MGUvc3JjL3V0aWxzLmNvZmZlZVxuICAgIF8uZWFjaChbJ3JlcXVlc3QnLCAndXBncmFkZSddLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgdmFyIGh0dHBTZXJ2ZXIgPSBXZWJBcHAuaHR0cFNlcnZlcjtcbiAgICAgIHZhciBvbGRIdHRwU2VydmVyTGlzdGVuZXJzID0gaHR0cFNlcnZlci5saXN0ZW5lcnMoZXZlbnQpLnNsaWNlKDApO1xuICAgICAgaHR0cFNlcnZlci5yZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnQpO1xuXG4gICAgICAvLyByZXF1ZXN0IGFuZCB1cGdyYWRlIGhhdmUgZGlmZmVyZW50IGFyZ3VtZW50cyBwYXNzZWQgYnV0XG4gICAgICAvLyB3ZSBvbmx5IGNhcmUgYWJvdXQgdGhlIGZpcnN0IG9uZSB3aGljaCBpcyBhbHdheXMgcmVxdWVzdFxuICAgICAgdmFyIG5ld0xpc3RlbmVyID0gZnVuY3Rpb24ocmVxdWVzdCAvKiwgbW9yZUFyZ3VtZW50cyAqLykge1xuICAgICAgICAvLyBTdG9yZSBhcmd1bWVudHMgZm9yIHVzZSB3aXRoaW4gdGhlIGNsb3N1cmUgYmVsb3dcbiAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG5cbiAgICAgICAgLy8gUmV3cml0ZSAvd2Vic29ja2V0IGFuZCAvd2Vic29ja2V0LyB1cmxzIHRvIC9zb2NranMvd2Vic29ja2V0IHdoaWxlXG4gICAgICAgIC8vIHByZXNlcnZpbmcgcXVlcnkgc3RyaW5nLlxuICAgICAgICB2YXIgcGFyc2VkVXJsID0gdXJsLnBhcnNlKHJlcXVlc3QudXJsKTtcbiAgICAgICAgaWYgKHBhcnNlZFVybC5wYXRobmFtZSA9PT0gcGF0aFByZWZpeCArICcvd2Vic29ja2V0JyB8fFxuICAgICAgICAgICAgcGFyc2VkVXJsLnBhdGhuYW1lID09PSBwYXRoUHJlZml4ICsgJy93ZWJzb2NrZXQvJykge1xuICAgICAgICAgIHBhcnNlZFVybC5wYXRobmFtZSA9IHNlbGYucHJlZml4ICsgJy93ZWJzb2NrZXQnO1xuICAgICAgICAgIHJlcXVlc3QudXJsID0gdXJsLmZvcm1hdChwYXJzZWRVcmwpO1xuICAgICAgICB9XG4gICAgICAgIF8uZWFjaChvbGRIdHRwU2VydmVyTGlzdGVuZXJzLCBmdW5jdGlvbihvbGRMaXN0ZW5lcikge1xuICAgICAgICAgIG9sZExpc3RlbmVyLmFwcGx5KGh0dHBTZXJ2ZXIsIGFyZ3MpO1xuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgICBodHRwU2VydmVyLmFkZExpc3RlbmVyKGV2ZW50LCBuZXdMaXN0ZW5lcik7XG4gICAgfSk7XG4gIH1cbn0pO1xuIiwiRERQU2VydmVyID0ge307XG5cbnZhciBGaWJlciA9IE5wbS5yZXF1aXJlKCdmaWJlcnMnKTtcblxuLy8gVGhpcyBmaWxlIGNvbnRhaW5zIGNsYXNzZXM6XG4vLyAqIFNlc3Npb24gLSBUaGUgc2VydmVyJ3MgY29ubmVjdGlvbiB0byBhIHNpbmdsZSBERFAgY2xpZW50XG4vLyAqIFN1YnNjcmlwdGlvbiAtIEEgc2luZ2xlIHN1YnNjcmlwdGlvbiBmb3IgYSBzaW5nbGUgY2xpZW50XG4vLyAqIFNlcnZlciAtIEFuIGVudGlyZSBzZXJ2ZXIgdGhhdCBtYXkgdGFsayB0byA+IDEgY2xpZW50LiBBIEREUCBlbmRwb2ludC5cbi8vXG4vLyBTZXNzaW9uIGFuZCBTdWJzY3JpcHRpb24gYXJlIGZpbGUgc2NvcGUuIEZvciBub3csIHVudGlsIHdlIGZyZWV6ZVxuLy8gdGhlIGludGVyZmFjZSwgU2VydmVyIGlzIHBhY2thZ2Ugc2NvcGUgKGluIHRoZSBmdXR1cmUgaXQgc2hvdWxkIGJlXG4vLyBleHBvcnRlZC4pXG5cbi8vIFJlcHJlc2VudHMgYSBzaW5nbGUgZG9jdW1lbnQgaW4gYSBTZXNzaW9uQ29sbGVjdGlvblZpZXdcbnZhciBTZXNzaW9uRG9jdW1lbnRWaWV3ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHNlbGYuZXhpc3RzSW4gPSB7fTsgLy8gc2V0IG9mIHN1YnNjcmlwdGlvbkhhbmRsZVxuICBzZWxmLmRhdGFCeUtleSA9IHt9OyAvLyBrZXktPiBbIHtzdWJzY3JpcHRpb25IYW5kbGUsIHZhbHVlfSBieSBwcmVjZWRlbmNlXVxufTtcblxuRERQU2VydmVyLl9TZXNzaW9uRG9jdW1lbnRWaWV3ID0gU2Vzc2lvbkRvY3VtZW50VmlldztcblxuXG5fLmV4dGVuZChTZXNzaW9uRG9jdW1lbnRWaWV3LnByb3RvdHlwZSwge1xuXG4gIGdldEZpZWxkczogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgcmV0ID0ge307XG4gICAgXy5lYWNoKHNlbGYuZGF0YUJ5S2V5LCBmdW5jdGlvbiAocHJlY2VkZW5jZUxpc3QsIGtleSkge1xuICAgICAgcmV0W2tleV0gPSBwcmVjZWRlbmNlTGlzdFswXS52YWx1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmV0O1xuICB9LFxuXG4gIGNsZWFyRmllbGQ6IGZ1bmN0aW9uIChzdWJzY3JpcHRpb25IYW5kbGUsIGtleSwgY2hhbmdlQ29sbGVjdG9yKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIC8vIFB1Ymxpc2ggQVBJIGlnbm9yZXMgX2lkIGlmIHByZXNlbnQgaW4gZmllbGRzXG4gICAgaWYgKGtleSA9PT0gXCJfaWRcIilcbiAgICAgIHJldHVybjtcbiAgICB2YXIgcHJlY2VkZW5jZUxpc3QgPSBzZWxmLmRhdGFCeUtleVtrZXldO1xuXG4gICAgLy8gSXQncyBva2F5IHRvIGNsZWFyIGZpZWxkcyB0aGF0IGRpZG4ndCBleGlzdC4gTm8gbmVlZCB0byB0aHJvd1xuICAgIC8vIGFuIGVycm9yLlxuICAgIGlmICghcHJlY2VkZW5jZUxpc3QpXG4gICAgICByZXR1cm47XG5cbiAgICB2YXIgcmVtb3ZlZFZhbHVlID0gdW5kZWZpbmVkO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJlY2VkZW5jZUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBwcmVjZWRlbmNlID0gcHJlY2VkZW5jZUxpc3RbaV07XG4gICAgICBpZiAocHJlY2VkZW5jZS5zdWJzY3JpcHRpb25IYW5kbGUgPT09IHN1YnNjcmlwdGlvbkhhbmRsZSkge1xuICAgICAgICAvLyBUaGUgdmlldydzIHZhbHVlIGNhbiBvbmx5IGNoYW5nZSBpZiB0aGlzIHN1YnNjcmlwdGlvbiBpcyB0aGUgb25lIHRoYXRcbiAgICAgICAgLy8gdXNlZCB0byBoYXZlIHByZWNlZGVuY2UuXG4gICAgICAgIGlmIChpID09PSAwKVxuICAgICAgICAgIHJlbW92ZWRWYWx1ZSA9IHByZWNlZGVuY2UudmFsdWU7XG4gICAgICAgIHByZWNlZGVuY2VMaXN0LnNwbGljZShpLCAxKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChfLmlzRW1wdHkocHJlY2VkZW5jZUxpc3QpKSB7XG4gICAgICBkZWxldGUgc2VsZi5kYXRhQnlLZXlba2V5XTtcbiAgICAgIGNoYW5nZUNvbGxlY3RvcltrZXldID0gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSBpZiAocmVtb3ZlZFZhbHVlICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgICAgICFFSlNPTi5lcXVhbHMocmVtb3ZlZFZhbHVlLCBwcmVjZWRlbmNlTGlzdFswXS52YWx1ZSkpIHtcbiAgICAgIGNoYW5nZUNvbGxlY3RvcltrZXldID0gcHJlY2VkZW5jZUxpc3RbMF0udmFsdWU7XG4gICAgfVxuICB9LFxuXG4gIGNoYW5nZUZpZWxkOiBmdW5jdGlvbiAoc3Vic2NyaXB0aW9uSGFuZGxlLCBrZXksIHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZUNvbGxlY3RvciwgaXNBZGQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgLy8gUHVibGlzaCBBUEkgaWdub3JlcyBfaWQgaWYgcHJlc2VudCBpbiBmaWVsZHNcbiAgICBpZiAoa2V5ID09PSBcIl9pZFwiKVxuICAgICAgcmV0dXJuO1xuXG4gICAgLy8gRG9uJ3Qgc2hhcmUgc3RhdGUgd2l0aCB0aGUgZGF0YSBwYXNzZWQgaW4gYnkgdGhlIHVzZXIuXG4gICAgdmFsdWUgPSBFSlNPTi5jbG9uZSh2YWx1ZSk7XG5cbiAgICBpZiAoIV8uaGFzKHNlbGYuZGF0YUJ5S2V5LCBrZXkpKSB7XG4gICAgICBzZWxmLmRhdGFCeUtleVtrZXldID0gW3tzdWJzY3JpcHRpb25IYW5kbGU6IHN1YnNjcmlwdGlvbkhhbmRsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZX1dO1xuICAgICAgY2hhbmdlQ29sbGVjdG9yW2tleV0gPSB2YWx1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHByZWNlZGVuY2VMaXN0ID0gc2VsZi5kYXRhQnlLZXlba2V5XTtcbiAgICB2YXIgZWx0O1xuICAgIGlmICghaXNBZGQpIHtcbiAgICAgIGVsdCA9IF8uZmluZChwcmVjZWRlbmNlTGlzdCwgZnVuY3Rpb24gKHByZWNlZGVuY2UpIHtcbiAgICAgICAgcmV0dXJuIHByZWNlZGVuY2Uuc3Vic2NyaXB0aW9uSGFuZGxlID09PSBzdWJzY3JpcHRpb25IYW5kbGU7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoZWx0KSB7XG4gICAgICBpZiAoZWx0ID09PSBwcmVjZWRlbmNlTGlzdFswXSAmJiAhRUpTT04uZXF1YWxzKHZhbHVlLCBlbHQudmFsdWUpKSB7XG4gICAgICAgIC8vIHRoaXMgc3Vic2NyaXB0aW9uIGlzIGNoYW5naW5nIHRoZSB2YWx1ZSBvZiB0aGlzIGZpZWxkLlxuICAgICAgICBjaGFuZ2VDb2xsZWN0b3Jba2V5XSA9IHZhbHVlO1xuICAgICAgfVxuICAgICAgZWx0LnZhbHVlID0gdmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHRoaXMgc3Vic2NyaXB0aW9uIGlzIG5ld2x5IGNhcmluZyBhYm91dCB0aGlzIGZpZWxkXG4gICAgICBwcmVjZWRlbmNlTGlzdC5wdXNoKHtzdWJzY3JpcHRpb25IYW5kbGU6IHN1YnNjcmlwdGlvbkhhbmRsZSwgdmFsdWU6IHZhbHVlfSk7XG4gICAgfVxuXG4gIH1cbn0pO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBjbGllbnQncyB2aWV3IG9mIGEgc2luZ2xlIGNvbGxlY3Rpb25cbiAqIEBwYXJhbSB7U3RyaW5nfSBjb2xsZWN0aW9uTmFtZSBOYW1lIG9mIHRoZSBjb2xsZWN0aW9uIGl0IHJlcHJlc2VudHNcbiAqIEBwYXJhbSB7T2JqZWN0LjxTdHJpbmcsIEZ1bmN0aW9uPn0gc2Vzc2lvbkNhbGxiYWNrcyBUaGUgY2FsbGJhY2tzIGZvciBhZGRlZCwgY2hhbmdlZCwgcmVtb3ZlZFxuICogQGNsYXNzIFNlc3Npb25Db2xsZWN0aW9uVmlld1xuICovXG52YXIgU2Vzc2lvbkNvbGxlY3Rpb25WaWV3ID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25OYW1lLCBzZXNzaW9uQ2FsbGJhY2tzKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgc2VsZi5jb2xsZWN0aW9uTmFtZSA9IGNvbGxlY3Rpb25OYW1lO1xuICBzZWxmLmRvY3VtZW50cyA9IHt9O1xuICBzZWxmLmNhbGxiYWNrcyA9IHNlc3Npb25DYWxsYmFja3M7XG59O1xuXG5ERFBTZXJ2ZXIuX1Nlc3Npb25Db2xsZWN0aW9uVmlldyA9IFNlc3Npb25Db2xsZWN0aW9uVmlldztcblxuXG5fLmV4dGVuZChTZXNzaW9uQ29sbGVjdGlvblZpZXcucHJvdG90eXBlLCB7XG5cbiAgaXNFbXB0eTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICByZXR1cm4gXy5pc0VtcHR5KHNlbGYuZG9jdW1lbnRzKTtcbiAgfSxcblxuICBkaWZmOiBmdW5jdGlvbiAocHJldmlvdXMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgRGlmZlNlcXVlbmNlLmRpZmZPYmplY3RzKHByZXZpb3VzLmRvY3VtZW50cywgc2VsZi5kb2N1bWVudHMsIHtcbiAgICAgIGJvdGg6IF8uYmluZChzZWxmLmRpZmZEb2N1bWVudCwgc2VsZiksXG5cbiAgICAgIHJpZ2h0T25seTogZnVuY3Rpb24gKGlkLCBub3dEVikge1xuICAgICAgICBzZWxmLmNhbGxiYWNrcy5hZGRlZChzZWxmLmNvbGxlY3Rpb25OYW1lLCBpZCwgbm93RFYuZ2V0RmllbGRzKCkpO1xuICAgICAgfSxcblxuICAgICAgbGVmdE9ubHk6IGZ1bmN0aW9uIChpZCwgcHJldkRWKSB7XG4gICAgICAgIHNlbGYuY2FsbGJhY2tzLnJlbW92ZWQoc2VsZi5jb2xsZWN0aW9uTmFtZSwgaWQpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIGRpZmZEb2N1bWVudDogZnVuY3Rpb24gKGlkLCBwcmV2RFYsIG5vd0RWKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBmaWVsZHMgPSB7fTtcbiAgICBEaWZmU2VxdWVuY2UuZGlmZk9iamVjdHMocHJldkRWLmdldEZpZWxkcygpLCBub3dEVi5nZXRGaWVsZHMoKSwge1xuICAgICAgYm90aDogZnVuY3Rpb24gKGtleSwgcHJldiwgbm93KSB7XG4gICAgICAgIGlmICghRUpTT04uZXF1YWxzKHByZXYsIG5vdykpXG4gICAgICAgICAgZmllbGRzW2tleV0gPSBub3c7XG4gICAgICB9LFxuICAgICAgcmlnaHRPbmx5OiBmdW5jdGlvbiAoa2V5LCBub3cpIHtcbiAgICAgICAgZmllbGRzW2tleV0gPSBub3c7XG4gICAgICB9LFxuICAgICAgbGVmdE9ubHk6IGZ1bmN0aW9uKGtleSwgcHJldikge1xuICAgICAgICBmaWVsZHNba2V5XSA9IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBzZWxmLmNhbGxiYWNrcy5jaGFuZ2VkKHNlbGYuY29sbGVjdGlvbk5hbWUsIGlkLCBmaWVsZHMpO1xuICB9LFxuXG4gIGFkZGVkOiBmdW5jdGlvbiAoc3Vic2NyaXB0aW9uSGFuZGxlLCBpZCwgZmllbGRzKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBkb2NWaWV3ID0gc2VsZi5kb2N1bWVudHNbaWRdO1xuICAgIHZhciBhZGRlZCA9IGZhbHNlO1xuICAgIGlmICghZG9jVmlldykge1xuICAgICAgYWRkZWQgPSB0cnVlO1xuICAgICAgZG9jVmlldyA9IG5ldyBTZXNzaW9uRG9jdW1lbnRWaWV3KCk7XG4gICAgICBzZWxmLmRvY3VtZW50c1tpZF0gPSBkb2NWaWV3O1xuICAgIH1cbiAgICBkb2NWaWV3LmV4aXN0c0luW3N1YnNjcmlwdGlvbkhhbmRsZV0gPSB0cnVlO1xuICAgIHZhciBjaGFuZ2VDb2xsZWN0b3IgPSB7fTtcbiAgICBfLmVhY2goZmllbGRzLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgZG9jVmlldy5jaGFuZ2VGaWVsZChcbiAgICAgICAgc3Vic2NyaXB0aW9uSGFuZGxlLCBrZXksIHZhbHVlLCBjaGFuZ2VDb2xsZWN0b3IsIHRydWUpO1xuICAgIH0pO1xuICAgIGlmIChhZGRlZClcbiAgICAgIHNlbGYuY2FsbGJhY2tzLmFkZGVkKHNlbGYuY29sbGVjdGlvbk5hbWUsIGlkLCBjaGFuZ2VDb2xsZWN0b3IpO1xuICAgIGVsc2VcbiAgICAgIHNlbGYuY2FsbGJhY2tzLmNoYW5nZWQoc2VsZi5jb2xsZWN0aW9uTmFtZSwgaWQsIGNoYW5nZUNvbGxlY3Rvcik7XG4gIH0sXG5cbiAgY2hhbmdlZDogZnVuY3Rpb24gKHN1YnNjcmlwdGlvbkhhbmRsZSwgaWQsIGNoYW5nZWQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGNoYW5nZWRSZXN1bHQgPSB7fTtcbiAgICB2YXIgZG9jVmlldyA9IHNlbGYuZG9jdW1lbnRzW2lkXTtcbiAgICBpZiAoIWRvY1ZpZXcpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3QgZmluZCBlbGVtZW50IHdpdGggaWQgXCIgKyBpZCArIFwiIHRvIGNoYW5nZVwiKTtcbiAgICBfLmVhY2goY2hhbmdlZCwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICBkb2NWaWV3LmNsZWFyRmllbGQoc3Vic2NyaXB0aW9uSGFuZGxlLCBrZXksIGNoYW5nZWRSZXN1bHQpO1xuICAgICAgZWxzZVxuICAgICAgICBkb2NWaWV3LmNoYW5nZUZpZWxkKHN1YnNjcmlwdGlvbkhhbmRsZSwga2V5LCB2YWx1ZSwgY2hhbmdlZFJlc3VsdCk7XG4gICAgfSk7XG4gICAgc2VsZi5jYWxsYmFja3MuY2hhbmdlZChzZWxmLmNvbGxlY3Rpb25OYW1lLCBpZCwgY2hhbmdlZFJlc3VsdCk7XG4gIH0sXG5cbiAgcmVtb3ZlZDogZnVuY3Rpb24gKHN1YnNjcmlwdGlvbkhhbmRsZSwgaWQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGRvY1ZpZXcgPSBzZWxmLmRvY3VtZW50c1tpZF07XG4gICAgaWYgKCFkb2NWaWV3KSB7XG4gICAgICB2YXIgZXJyID0gbmV3IEVycm9yKFwiUmVtb3ZlZCBub25leGlzdGVudCBkb2N1bWVudCBcIiArIGlkKTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gICAgZGVsZXRlIGRvY1ZpZXcuZXhpc3RzSW5bc3Vic2NyaXB0aW9uSGFuZGxlXTtcbiAgICBpZiAoXy5pc0VtcHR5KGRvY1ZpZXcuZXhpc3RzSW4pKSB7XG4gICAgICAvLyBpdCBpcyBnb25lIGZyb20gZXZlcnlvbmVcbiAgICAgIHNlbGYuY2FsbGJhY2tzLnJlbW92ZWQoc2VsZi5jb2xsZWN0aW9uTmFtZSwgaWQpO1xuICAgICAgZGVsZXRlIHNlbGYuZG9jdW1lbnRzW2lkXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGNoYW5nZWQgPSB7fTtcbiAgICAgIC8vIHJlbW92ZSB0aGlzIHN1YnNjcmlwdGlvbiBmcm9tIGV2ZXJ5IHByZWNlZGVuY2UgbGlzdFxuICAgICAgLy8gYW5kIHJlY29yZCB0aGUgY2hhbmdlc1xuICAgICAgXy5lYWNoKGRvY1ZpZXcuZGF0YUJ5S2V5LCBmdW5jdGlvbiAocHJlY2VkZW5jZUxpc3QsIGtleSkge1xuICAgICAgICBkb2NWaWV3LmNsZWFyRmllbGQoc3Vic2NyaXB0aW9uSGFuZGxlLCBrZXksIGNoYW5nZWQpO1xuICAgICAgfSk7XG5cbiAgICAgIHNlbGYuY2FsbGJhY2tzLmNoYW5nZWQoc2VsZi5jb2xsZWN0aW9uTmFtZSwgaWQsIGNoYW5nZWQpO1xuICAgIH1cbiAgfVxufSk7XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiBTZXNzaW9uICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxudmFyIFNlc3Npb24gPSBmdW5jdGlvbiAoc2VydmVyLCB2ZXJzaW9uLCBzb2NrZXQsIG9wdGlvbnMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLmlkID0gUmFuZG9tLmlkKCk7XG5cbiAgc2VsZi5zZXJ2ZXIgPSBzZXJ2ZXI7XG4gIHNlbGYudmVyc2lvbiA9IHZlcnNpb247XG5cbiAgc2VsZi5pbml0aWFsaXplZCA9IGZhbHNlO1xuICBzZWxmLnNvY2tldCA9IHNvY2tldDtcblxuICAvLyBzZXQgdG8gbnVsbCB3aGVuIHRoZSBzZXNzaW9uIGlzIGRlc3Ryb3llZC4gbXVsdGlwbGUgcGxhY2VzIGJlbG93XG4gIC8vIHVzZSB0aGlzIHRvIGRldGVybWluZSBpZiB0aGUgc2Vzc2lvbiBpcyBhbGl2ZSBvciBub3QuXG4gIHNlbGYuaW5RdWV1ZSA9IG5ldyBNZXRlb3IuX0RvdWJsZUVuZGVkUXVldWUoKTtcblxuICBzZWxmLmJsb2NrZWQgPSBmYWxzZTtcbiAgc2VsZi53b3JrZXJSdW5uaW5nID0gZmFsc2U7XG5cbiAgLy8gU3ViIG9iamVjdHMgZm9yIGFjdGl2ZSBzdWJzY3JpcHRpb25zXG4gIHNlbGYuX25hbWVkU3VicyA9IHt9O1xuICBzZWxmLl91bml2ZXJzYWxTdWJzID0gW107XG5cbiAgc2VsZi51c2VySWQgPSBudWxsO1xuXG4gIHNlbGYuY29sbGVjdGlvblZpZXdzID0ge307XG5cbiAgLy8gU2V0IHRoaXMgdG8gZmFsc2UgdG8gbm90IHNlbmQgbWVzc2FnZXMgd2hlbiBjb2xsZWN0aW9uVmlld3MgYXJlXG4gIC8vIG1vZGlmaWVkLiBUaGlzIGlzIGRvbmUgd2hlbiByZXJ1bm5pbmcgc3VicyBpbiBfc2V0VXNlcklkIGFuZCB0aG9zZSBtZXNzYWdlc1xuICAvLyBhcmUgY2FsY3VsYXRlZCB2aWEgYSBkaWZmIGluc3RlYWQuXG4gIHNlbGYuX2lzU2VuZGluZyA9IHRydWU7XG5cbiAgLy8gSWYgdGhpcyBpcyB0cnVlLCBkb24ndCBzdGFydCBhIG5ld2x5LWNyZWF0ZWQgdW5pdmVyc2FsIHB1Ymxpc2hlciBvbiB0aGlzXG4gIC8vIHNlc3Npb24uIFRoZSBzZXNzaW9uIHdpbGwgdGFrZSBjYXJlIG9mIHN0YXJ0aW5nIGl0IHdoZW4gYXBwcm9wcmlhdGUuXG4gIHNlbGYuX2RvbnRTdGFydE5ld1VuaXZlcnNhbFN1YnMgPSBmYWxzZTtcblxuICAvLyB3aGVuIHdlIGFyZSByZXJ1bm5pbmcgc3Vic2NyaXB0aW9ucywgYW55IHJlYWR5IG1lc3NhZ2VzXG4gIC8vIHdlIHdhbnQgdG8gYnVmZmVyIHVwIGZvciB3aGVuIHdlIGFyZSBkb25lIHJlcnVubmluZyBzdWJzY3JpcHRpb25zXG4gIHNlbGYuX3BlbmRpbmdSZWFkeSA9IFtdO1xuXG4gIC8vIExpc3Qgb2YgY2FsbGJhY2tzIHRvIGNhbGwgd2hlbiB0aGlzIGNvbm5lY3Rpb24gaXMgY2xvc2VkLlxuICBzZWxmLl9jbG9zZUNhbGxiYWNrcyA9IFtdO1xuXG5cbiAgLy8gWFhYIEhBQ0s6IElmIGEgc29ja2pzIGNvbm5lY3Rpb24sIHNhdmUgb2ZmIHRoZSBVUkwuIFRoaXMgaXNcbiAgLy8gdGVtcG9yYXJ5IGFuZCB3aWxsIGdvIGF3YXkgaW4gdGhlIG5lYXIgZnV0dXJlLlxuICBzZWxmLl9zb2NrZXRVcmwgPSBzb2NrZXQudXJsO1xuXG4gIC8vIEFsbG93IHRlc3RzIHRvIGRpc2FibGUgcmVzcG9uZGluZyB0byBwaW5ncy5cbiAgc2VsZi5fcmVzcG9uZFRvUGluZ3MgPSBvcHRpb25zLnJlc3BvbmRUb1BpbmdzO1xuXG4gIC8vIFRoaXMgb2JqZWN0IGlzIHRoZSBwdWJsaWMgaW50ZXJmYWNlIHRvIHRoZSBzZXNzaW9uLiBJbiB0aGUgcHVibGljXG4gIC8vIEFQSSwgaXQgaXMgY2FsbGVkIHRoZSBgY29ubmVjdGlvbmAgb2JqZWN0LiAgSW50ZXJuYWxseSB3ZSBjYWxsIGl0XG4gIC8vIGEgYGNvbm5lY3Rpb25IYW5kbGVgIHRvIGF2b2lkIGFtYmlndWl0eS5cbiAgc2VsZi5jb25uZWN0aW9uSGFuZGxlID0ge1xuICAgIGlkOiBzZWxmLmlkLFxuICAgIGNsb3NlOiBmdW5jdGlvbiAoKSB7XG4gICAgICBzZWxmLmNsb3NlKCk7XG4gICAgfSxcbiAgICBvbkNsb3NlOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgIHZhciBjYiA9IE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZm4sIFwiY29ubmVjdGlvbiBvbkNsb3NlIGNhbGxiYWNrXCIpO1xuICAgICAgaWYgKHNlbGYuaW5RdWV1ZSkge1xuICAgICAgICBzZWxmLl9jbG9zZUNhbGxiYWNrcy5wdXNoKGNiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGlmIHdlJ3JlIGFscmVhZHkgY2xvc2VkLCBjYWxsIHRoZSBjYWxsYmFjay5cbiAgICAgICAgTWV0ZW9yLmRlZmVyKGNiKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGNsaWVudEFkZHJlc3M6IHNlbGYuX2NsaWVudEFkZHJlc3MoKSxcbiAgICBodHRwSGVhZGVyczogc2VsZi5zb2NrZXQuaGVhZGVyc1xuICB9O1xuXG4gIHNlbGYuc2VuZCh7IG1zZzogJ2Nvbm5lY3RlZCcsIHNlc3Npb246IHNlbGYuaWQgfSk7XG5cbiAgLy8gT24gaW5pdGlhbCBjb25uZWN0LCBzcGluIHVwIGFsbCB0aGUgdW5pdmVyc2FsIHB1Ymxpc2hlcnMuXG4gIEZpYmVyKGZ1bmN0aW9uICgpIHtcbiAgICBzZWxmLnN0YXJ0VW5pdmVyc2FsU3VicygpO1xuICB9KS5ydW4oKTtcblxuICBpZiAodmVyc2lvbiAhPT0gJ3ByZTEnICYmIG9wdGlvbnMuaGVhcnRiZWF0SW50ZXJ2YWwgIT09IDApIHtcbiAgICAvLyBXZSBubyBsb25nZXIgbmVlZCB0aGUgbG93IGxldmVsIHRpbWVvdXQgYmVjYXVzZSB3ZSBoYXZlIGhlYXJ0YmVhdGluZy5cbiAgICBzb2NrZXQuc2V0V2Vic29ja2V0VGltZW91dCgwKTtcblxuICAgIHNlbGYuaGVhcnRiZWF0ID0gbmV3IEREUENvbW1vbi5IZWFydGJlYXQoe1xuICAgICAgaGVhcnRiZWF0SW50ZXJ2YWw6IG9wdGlvbnMuaGVhcnRiZWF0SW50ZXJ2YWwsXG4gICAgICBoZWFydGJlYXRUaW1lb3V0OiBvcHRpb25zLmhlYXJ0YmVhdFRpbWVvdXQsXG4gICAgICBvblRpbWVvdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5jbG9zZSgpO1xuICAgICAgfSxcbiAgICAgIHNlbmRQaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYuc2VuZCh7bXNnOiAncGluZyd9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBzZWxmLmhlYXJ0YmVhdC5zdGFydCgpO1xuICB9XG5cbiAgUGFja2FnZVsnZmFjdHMtYmFzZSddICYmIFBhY2thZ2VbJ2ZhY3RzLWJhc2UnXS5GYWN0cy5pbmNyZW1lbnRTZXJ2ZXJGYWN0KFxuICAgIFwibGl2ZWRhdGFcIiwgXCJzZXNzaW9uc1wiLCAxKTtcbn07XG5cbl8uZXh0ZW5kKFNlc3Npb24ucHJvdG90eXBlLCB7XG5cbiAgc2VuZFJlYWR5OiBmdW5jdGlvbiAoc3Vic2NyaXB0aW9uSWRzKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmIChzZWxmLl9pc1NlbmRpbmcpXG4gICAgICBzZWxmLnNlbmQoe21zZzogXCJyZWFkeVwiLCBzdWJzOiBzdWJzY3JpcHRpb25JZHN9KTtcbiAgICBlbHNlIHtcbiAgICAgIF8uZWFjaChzdWJzY3JpcHRpb25JZHMsIGZ1bmN0aW9uIChzdWJzY3JpcHRpb25JZCkge1xuICAgICAgICBzZWxmLl9wZW5kaW5nUmVhZHkucHVzaChzdWJzY3JpcHRpb25JZCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgc2VuZEFkZGVkOiBmdW5jdGlvbiAoY29sbGVjdGlvbk5hbWUsIGlkLCBmaWVsZHMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHNlbGYuX2lzU2VuZGluZylcbiAgICAgIHNlbGYuc2VuZCh7bXNnOiBcImFkZGVkXCIsIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25OYW1lLCBpZDogaWQsIGZpZWxkczogZmllbGRzfSk7XG4gIH0sXG5cbiAgc2VuZENoYW5nZWQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uTmFtZSwgaWQsIGZpZWxkcykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoXy5pc0VtcHR5KGZpZWxkcykpXG4gICAgICByZXR1cm47XG5cbiAgICBpZiAoc2VsZi5faXNTZW5kaW5nKSB7XG4gICAgICBzZWxmLnNlbmQoe1xuICAgICAgICBtc2c6IFwiY2hhbmdlZFwiLFxuICAgICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uTmFtZSxcbiAgICAgICAgaWQ6IGlkLFxuICAgICAgICBmaWVsZHM6IGZpZWxkc1xuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIHNlbmRSZW1vdmVkOiBmdW5jdGlvbiAoY29sbGVjdGlvbk5hbWUsIGlkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmIChzZWxmLl9pc1NlbmRpbmcpXG4gICAgICBzZWxmLnNlbmQoe21zZzogXCJyZW1vdmVkXCIsIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25OYW1lLCBpZDogaWR9KTtcbiAgfSxcblxuICBnZXRTZW5kQ2FsbGJhY2tzOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHJldHVybiB7XG4gICAgICBhZGRlZDogXy5iaW5kKHNlbGYuc2VuZEFkZGVkLCBzZWxmKSxcbiAgICAgIGNoYW5nZWQ6IF8uYmluZChzZWxmLnNlbmRDaGFuZ2VkLCBzZWxmKSxcbiAgICAgIHJlbW92ZWQ6IF8uYmluZChzZWxmLnNlbmRSZW1vdmVkLCBzZWxmKVxuICAgIH07XG4gIH0sXG5cbiAgZ2V0Q29sbGVjdGlvblZpZXc6IGZ1bmN0aW9uIChjb2xsZWN0aW9uTmFtZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoXy5oYXMoc2VsZi5jb2xsZWN0aW9uVmlld3MsIGNvbGxlY3Rpb25OYW1lKSkge1xuICAgICAgcmV0dXJuIHNlbGYuY29sbGVjdGlvblZpZXdzW2NvbGxlY3Rpb25OYW1lXTtcbiAgICB9XG4gICAgdmFyIHJldCA9IG5ldyBTZXNzaW9uQ29sbGVjdGlvblZpZXcoY29sbGVjdGlvbk5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5nZXRTZW5kQ2FsbGJhY2tzKCkpO1xuICAgIHNlbGYuY29sbGVjdGlvblZpZXdzW2NvbGxlY3Rpb25OYW1lXSA9IHJldDtcbiAgICByZXR1cm4gcmV0O1xuICB9LFxuXG4gIGFkZGVkOiBmdW5jdGlvbiAoc3Vic2NyaXB0aW9uSGFuZGxlLCBjb2xsZWN0aW9uTmFtZSwgaWQsIGZpZWxkcykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgdmlldyA9IHNlbGYuZ2V0Q29sbGVjdGlvblZpZXcoY29sbGVjdGlvbk5hbWUpO1xuICAgIHZpZXcuYWRkZWQoc3Vic2NyaXB0aW9uSGFuZGxlLCBpZCwgZmllbGRzKTtcbiAgfSxcblxuICByZW1vdmVkOiBmdW5jdGlvbiAoc3Vic2NyaXB0aW9uSGFuZGxlLCBjb2xsZWN0aW9uTmFtZSwgaWQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIHZpZXcgPSBzZWxmLmdldENvbGxlY3Rpb25WaWV3KGNvbGxlY3Rpb25OYW1lKTtcbiAgICB2aWV3LnJlbW92ZWQoc3Vic2NyaXB0aW9uSGFuZGxlLCBpZCk7XG4gICAgaWYgKHZpZXcuaXNFbXB0eSgpKSB7XG4gICAgICBkZWxldGUgc2VsZi5jb2xsZWN0aW9uVmlld3NbY29sbGVjdGlvbk5hbWVdO1xuICAgIH1cbiAgfSxcblxuICBjaGFuZ2VkOiBmdW5jdGlvbiAoc3Vic2NyaXB0aW9uSGFuZGxlLCBjb2xsZWN0aW9uTmFtZSwgaWQsIGZpZWxkcykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgdmlldyA9IHNlbGYuZ2V0Q29sbGVjdGlvblZpZXcoY29sbGVjdGlvbk5hbWUpO1xuICAgIHZpZXcuY2hhbmdlZChzdWJzY3JpcHRpb25IYW5kbGUsIGlkLCBmaWVsZHMpO1xuICB9LFxuXG4gIHN0YXJ0VW5pdmVyc2FsU3ViczogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyBNYWtlIGEgc2hhbGxvdyBjb3B5IG9mIHRoZSBzZXQgb2YgdW5pdmVyc2FsIGhhbmRsZXJzIGFuZCBzdGFydCB0aGVtLiBJZlxuICAgIC8vIGFkZGl0aW9uYWwgdW5pdmVyc2FsIHB1Ymxpc2hlcnMgc3RhcnQgd2hpbGUgd2UncmUgcnVubmluZyB0aGVtIChkdWUgdG9cbiAgICAvLyB5aWVsZGluZyksIHRoZXkgd2lsbCBydW4gc2VwYXJhdGVseSBhcyBwYXJ0IG9mIFNlcnZlci5wdWJsaXNoLlxuICAgIHZhciBoYW5kbGVycyA9IF8uY2xvbmUoc2VsZi5zZXJ2ZXIudW5pdmVyc2FsX3B1Ymxpc2hfaGFuZGxlcnMpO1xuICAgIF8uZWFjaChoYW5kbGVycywgZnVuY3Rpb24gKGhhbmRsZXIpIHtcbiAgICAgIHNlbGYuX3N0YXJ0U3Vic2NyaXB0aW9uKGhhbmRsZXIpO1xuICAgIH0pO1xuICB9LFxuXG4gIC8vIERlc3Ryb3kgdGhpcyBzZXNzaW9uIGFuZCB1bnJlZ2lzdGVyIGl0IGF0IHRoZSBzZXJ2ZXIuXG4gIGNsb3NlOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgLy8gRGVzdHJveSB0aGlzIHNlc3Npb24sIGV2ZW4gaWYgaXQncyBub3QgcmVnaXN0ZXJlZCBhdCB0aGVcbiAgICAvLyBzZXJ2ZXIuIFN0b3AgYWxsIHByb2Nlc3NpbmcgYW5kIHRlYXIgZXZlcnl0aGluZyBkb3duLiBJZiBhIHNvY2tldFxuICAgIC8vIHdhcyBhdHRhY2hlZCwgY2xvc2UgaXQuXG5cbiAgICAvLyBBbHJlYWR5IGRlc3Ryb3llZC5cbiAgICBpZiAoISBzZWxmLmluUXVldWUpXG4gICAgICByZXR1cm47XG5cbiAgICAvLyBEcm9wIHRoZSBtZXJnZSBib3ggZGF0YSBpbW1lZGlhdGVseS5cbiAgICBzZWxmLmluUXVldWUgPSBudWxsO1xuICAgIHNlbGYuY29sbGVjdGlvblZpZXdzID0ge307XG5cbiAgICBpZiAoc2VsZi5oZWFydGJlYXQpIHtcbiAgICAgIHNlbGYuaGVhcnRiZWF0LnN0b3AoKTtcbiAgICAgIHNlbGYuaGVhcnRiZWF0ID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoc2VsZi5zb2NrZXQpIHtcbiAgICAgIHNlbGYuc29ja2V0LmNsb3NlKCk7XG4gICAgICBzZWxmLnNvY2tldC5fbWV0ZW9yU2Vzc2lvbiA9IG51bGw7XG4gICAgfVxuXG4gICAgUGFja2FnZVsnZmFjdHMtYmFzZSddICYmIFBhY2thZ2VbJ2ZhY3RzLWJhc2UnXS5GYWN0cy5pbmNyZW1lbnRTZXJ2ZXJGYWN0KFxuICAgICAgXCJsaXZlZGF0YVwiLCBcInNlc3Npb25zXCIsIC0xKTtcblxuICAgIE1ldGVvci5kZWZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBzdG9wIGNhbGxiYWNrcyBjYW4geWllbGQsIHNvIHdlIGRlZmVyIHRoaXMgb24gY2xvc2UuXG4gICAgICAvLyBzdWIuX2lzRGVhY3RpdmF0ZWQoKSBkZXRlY3RzIHRoYXQgd2Ugc2V0IGluUXVldWUgdG8gbnVsbCBhbmRcbiAgICAgIC8vIHRyZWF0cyBpdCBhcyBzZW1pLWRlYWN0aXZhdGVkIChpdCB3aWxsIGlnbm9yZSBpbmNvbWluZyBjYWxsYmFja3MsIGV0YykuXG4gICAgICBzZWxmLl9kZWFjdGl2YXRlQWxsU3Vic2NyaXB0aW9ucygpO1xuXG4gICAgICAvLyBEZWZlciBjYWxsaW5nIHRoZSBjbG9zZSBjYWxsYmFja3MsIHNvIHRoYXQgdGhlIGNhbGxlciBjbG9zaW5nXG4gICAgICAvLyB0aGUgc2Vzc2lvbiBpc24ndCB3YWl0aW5nIGZvciBhbGwgdGhlIGNhbGxiYWNrcyB0byBjb21wbGV0ZS5cbiAgICAgIF8uZWFjaChzZWxmLl9jbG9zZUNhbGxiYWNrcywgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIFVucmVnaXN0ZXIgdGhlIHNlc3Npb24uXG4gICAgc2VsZi5zZXJ2ZXIuX3JlbW92ZVNlc3Npb24oc2VsZik7XG4gIH0sXG5cbiAgLy8gU2VuZCBhIG1lc3NhZ2UgKGRvaW5nIG5vdGhpbmcgaWYgbm8gc29ja2V0IGlzIGNvbm5lY3RlZCByaWdodCBub3cuKVxuICAvLyBJdCBzaG91bGQgYmUgYSBKU09OIG9iamVjdCAoaXQgd2lsbCBiZSBzdHJpbmdpZmllZC4pXG4gIHNlbmQ6IGZ1bmN0aW9uIChtc2cpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHNlbGYuc29ja2V0KSB7XG4gICAgICBpZiAoTWV0ZW9yLl9wcmludFNlbnRERFApXG4gICAgICAgIE1ldGVvci5fZGVidWcoXCJTZW50IEREUFwiLCBERFBDb21tb24uc3RyaW5naWZ5RERQKG1zZykpO1xuICAgICAgc2VsZi5zb2NrZXQuc2VuZChERFBDb21tb24uc3RyaW5naWZ5RERQKG1zZykpO1xuICAgIH1cbiAgfSxcblxuICAvLyBTZW5kIGEgY29ubmVjdGlvbiBlcnJvci5cbiAgc2VuZEVycm9yOiBmdW5jdGlvbiAocmVhc29uLCBvZmZlbmRpbmdNZXNzYWdlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBtc2cgPSB7bXNnOiAnZXJyb3InLCByZWFzb246IHJlYXNvbn07XG4gICAgaWYgKG9mZmVuZGluZ01lc3NhZ2UpXG4gICAgICBtc2cub2ZmZW5kaW5nTWVzc2FnZSA9IG9mZmVuZGluZ01lc3NhZ2U7XG4gICAgc2VsZi5zZW5kKG1zZyk7XG4gIH0sXG5cbiAgLy8gUHJvY2VzcyAnbXNnJyBhcyBhbiBpbmNvbWluZyBtZXNzYWdlLiAoQnV0IGFzIGEgZ3VhcmQgYWdhaW5zdFxuICAvLyByYWNlIGNvbmRpdGlvbnMgZHVyaW5nIHJlY29ubmVjdGlvbiwgaWdub3JlIHRoZSBtZXNzYWdlIGlmXG4gIC8vICdzb2NrZXQnIGlzIG5vdCB0aGUgY3VycmVudGx5IGNvbm5lY3RlZCBzb2NrZXQuKVxuICAvL1xuICAvLyBXZSBydW4gdGhlIG1lc3NhZ2VzIGZyb20gdGhlIGNsaWVudCBvbmUgYXQgYSB0aW1lLCBpbiB0aGUgb3JkZXJcbiAgLy8gZ2l2ZW4gYnkgdGhlIGNsaWVudC4gVGhlIG1lc3NhZ2UgaGFuZGxlciBpcyBwYXNzZWQgYW4gaWRlbXBvdGVudFxuICAvLyBmdW5jdGlvbiAndW5ibG9jaycgd2hpY2ggaXQgbWF5IGNhbGwgdG8gYWxsb3cgb3RoZXIgbWVzc2FnZXMgdG9cbiAgLy8gYmVnaW4gcnVubmluZyBpbiBwYXJhbGxlbCBpbiBhbm90aGVyIGZpYmVyIChmb3IgZXhhbXBsZSwgYSBtZXRob2RcbiAgLy8gdGhhdCB3YW50cyB0byB5aWVsZC4pIE90aGVyd2lzZSwgaXQgaXMgYXV0b21hdGljYWxseSB1bmJsb2NrZWRcbiAgLy8gd2hlbiBpdCByZXR1cm5zLlxuICAvL1xuICAvLyBBY3R1YWxseSwgd2UgZG9uJ3QgaGF2ZSB0byAndG90YWxseSBvcmRlcicgdGhlIG1lc3NhZ2VzIGluIHRoaXNcbiAgLy8gd2F5LCBidXQgaXQncyB0aGUgZWFzaWVzdCB0aGluZyB0aGF0J3MgY29ycmVjdC4gKHVuc3ViIG5lZWRzIHRvXG4gIC8vIGJlIG9yZGVyZWQgYWdhaW5zdCBzdWIsIG1ldGhvZHMgbmVlZCB0byBiZSBvcmRlcmVkIGFnYWluc3QgZWFjaFxuICAvLyBvdGhlci4pXG4gIHByb2Nlc3NNZXNzYWdlOiBmdW5jdGlvbiAobXNnX2luKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmICghc2VsZi5pblF1ZXVlKSAvLyB3ZSBoYXZlIGJlZW4gZGVzdHJveWVkLlxuICAgICAgcmV0dXJuO1xuXG4gICAgLy8gUmVzcG9uZCB0byBwaW5nIGFuZCBwb25nIG1lc3NhZ2VzIGltbWVkaWF0ZWx5IHdpdGhvdXQgcXVldWluZy5cbiAgICAvLyBJZiB0aGUgbmVnb3RpYXRlZCBERFAgdmVyc2lvbiBpcyBcInByZTFcIiB3aGljaCBkaWRuJ3Qgc3VwcG9ydFxuICAgIC8vIHBpbmdzLCBwcmVzZXJ2ZSB0aGUgXCJwcmUxXCIgYmVoYXZpb3Igb2YgcmVzcG9uZGluZyB3aXRoIGEgXCJiYWRcbiAgICAvLyByZXF1ZXN0XCIgZm9yIHRoZSB1bmtub3duIG1lc3NhZ2VzLlxuICAgIC8vXG4gICAgLy8gRmliZXJzIGFyZSBuZWVkZWQgYmVjYXVzZSBoZWFydGJlYXQgdXNlcyBNZXRlb3Iuc2V0VGltZW91dCwgd2hpY2hcbiAgICAvLyBuZWVkcyBhIEZpYmVyLiBXZSBjb3VsZCBhY3R1YWxseSB1c2UgcmVndWxhciBzZXRUaW1lb3V0IGFuZCBhdm9pZFxuICAgIC8vIHRoZXNlIG5ldyBmaWJlcnMsIGJ1dCBpdCBpcyBlYXNpZXIgdG8ganVzdCBtYWtlIGV2ZXJ5dGhpbmcgdXNlXG4gICAgLy8gTWV0ZW9yLnNldFRpbWVvdXQgYW5kIG5vdCB0aGluayB0b28gaGFyZC5cbiAgICAvL1xuICAgIC8vIEFueSBtZXNzYWdlIGNvdW50cyBhcyByZWNlaXZpbmcgYSBwb25nLCBhcyBpdCBkZW1vbnN0cmF0ZXMgdGhhdFxuICAgIC8vIHRoZSBjbGllbnQgaXMgc3RpbGwgYWxpdmUuXG4gICAgaWYgKHNlbGYuaGVhcnRiZWF0KSB7XG4gICAgICBGaWJlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYuaGVhcnRiZWF0Lm1lc3NhZ2VSZWNlaXZlZCgpO1xuICAgICAgfSkucnVuKCk7XG4gICAgfVxuXG4gICAgaWYgKHNlbGYudmVyc2lvbiAhPT0gJ3ByZTEnICYmIG1zZ19pbi5tc2cgPT09ICdwaW5nJykge1xuICAgICAgaWYgKHNlbGYuX3Jlc3BvbmRUb1BpbmdzKVxuICAgICAgICBzZWxmLnNlbmQoe21zZzogXCJwb25nXCIsIGlkOiBtc2dfaW4uaWR9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHNlbGYudmVyc2lvbiAhPT0gJ3ByZTEnICYmIG1zZ19pbi5tc2cgPT09ICdwb25nJykge1xuICAgICAgLy8gU2luY2UgZXZlcnl0aGluZyBpcyBhIHBvbmcsIG5vdGhpbmcgdG8gZG9cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZWxmLmluUXVldWUucHVzaChtc2dfaW4pO1xuICAgIGlmIChzZWxmLndvcmtlclJ1bm5pbmcpXG4gICAgICByZXR1cm47XG4gICAgc2VsZi53b3JrZXJSdW5uaW5nID0gdHJ1ZTtcblxuICAgIHZhciBwcm9jZXNzTmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBtc2cgPSBzZWxmLmluUXVldWUgJiYgc2VsZi5pblF1ZXVlLnNoaWZ0KCk7XG4gICAgICBpZiAoIW1zZykge1xuICAgICAgICBzZWxmLndvcmtlclJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBGaWJlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBibG9ja2VkID0gdHJ1ZTtcblxuICAgICAgICB2YXIgdW5ibG9jayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAoIWJsb2NrZWQpXG4gICAgICAgICAgICByZXR1cm47IC8vIGlkZW1wb3RlbnRcbiAgICAgICAgICBibG9ja2VkID0gZmFsc2U7XG4gICAgICAgICAgcHJvY2Vzc05leHQoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLnNlcnZlci5vbk1lc3NhZ2VIb29rLmVhY2goZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgY2FsbGJhY2sobXNnLCBzZWxmKTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKF8uaGFzKHNlbGYucHJvdG9jb2xfaGFuZGxlcnMsIG1zZy5tc2cpKVxuICAgICAgICAgIHNlbGYucHJvdG9jb2xfaGFuZGxlcnNbbXNnLm1zZ10uY2FsbChzZWxmLCBtc2csIHVuYmxvY2spO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgc2VsZi5zZW5kRXJyb3IoJ0JhZCByZXF1ZXN0JywgbXNnKTtcbiAgICAgICAgdW5ibG9jaygpOyAvLyBpbiBjYXNlIHRoZSBoYW5kbGVyIGRpZG4ndCBhbHJlYWR5IGRvIGl0XG4gICAgICB9KS5ydW4oKTtcbiAgICB9O1xuXG4gICAgcHJvY2Vzc05leHQoKTtcbiAgfSxcblxuICBwcm90b2NvbF9oYW5kbGVyczoge1xuICAgIHN1YjogZnVuY3Rpb24gKG1zZykge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAvLyByZWplY3QgbWFsZm9ybWVkIG1lc3NhZ2VzXG4gICAgICBpZiAodHlwZW9mIChtc2cuaWQpICE9PSBcInN0cmluZ1wiIHx8XG4gICAgICAgICAgdHlwZW9mIChtc2cubmFtZSkgIT09IFwic3RyaW5nXCIgfHxcbiAgICAgICAgICAoKCdwYXJhbXMnIGluIG1zZykgJiYgIShtc2cucGFyYW1zIGluc3RhbmNlb2YgQXJyYXkpKSkge1xuICAgICAgICBzZWxmLnNlbmRFcnJvcihcIk1hbGZvcm1lZCBzdWJzY3JpcHRpb25cIiwgbXNnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXNlbGYuc2VydmVyLnB1Ymxpc2hfaGFuZGxlcnNbbXNnLm5hbWVdKSB7XG4gICAgICAgIHNlbGYuc2VuZCh7XG4gICAgICAgICAgbXNnOiAnbm9zdWInLCBpZDogbXNnLmlkLFxuICAgICAgICAgIGVycm9yOiBuZXcgTWV0ZW9yLkVycm9yKDQwNCwgYFN1YnNjcmlwdGlvbiAnJHttc2cubmFtZX0nIG5vdCBmb3VuZGApfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKF8uaGFzKHNlbGYuX25hbWVkU3VicywgbXNnLmlkKSlcbiAgICAgICAgLy8gc3VicyBhcmUgaWRlbXBvdGVudCwgb3IgcmF0aGVyLCB0aGV5IGFyZSBpZ25vcmVkIGlmIGEgc3ViXG4gICAgICAgIC8vIHdpdGggdGhhdCBpZCBhbHJlYWR5IGV4aXN0cy4gdGhpcyBpcyBpbXBvcnRhbnQgZHVyaW5nXG4gICAgICAgIC8vIHJlY29ubmVjdC5cbiAgICAgICAgcmV0dXJuO1xuXG4gICAgICAvLyBYWFggSXQnZCBiZSBtdWNoIGJldHRlciBpZiB3ZSBoYWQgZ2VuZXJpYyBob29rcyB3aGVyZSBhbnkgcGFja2FnZSBjYW5cbiAgICAgIC8vIGhvb2sgaW50byBzdWJzY3JpcHRpb24gaGFuZGxpbmcsIGJ1dCBpbiB0aGUgbWVhbiB3aGlsZSB3ZSBzcGVjaWFsIGNhc2VcbiAgICAgIC8vIGRkcC1yYXRlLWxpbWl0ZXIgcGFja2FnZS4gVGhpcyBpcyBhbHNvIGRvbmUgZm9yIHdlYWsgcmVxdWlyZW1lbnRzIHRvXG4gICAgICAvLyBhZGQgdGhlIGRkcC1yYXRlLWxpbWl0ZXIgcGFja2FnZSBpbiBjYXNlIHdlIGRvbid0IGhhdmUgQWNjb3VudHMuIEFcbiAgICAgIC8vIHVzZXIgdHJ5aW5nIHRvIHVzZSB0aGUgZGRwLXJhdGUtbGltaXRlciBtdXN0IGV4cGxpY2l0bHkgcmVxdWlyZSBpdC5cbiAgICAgIGlmIChQYWNrYWdlWydkZHAtcmF0ZS1saW1pdGVyJ10pIHtcbiAgICAgICAgdmFyIEREUFJhdGVMaW1pdGVyID0gUGFja2FnZVsnZGRwLXJhdGUtbGltaXRlciddLkREUFJhdGVMaW1pdGVyO1xuICAgICAgICB2YXIgcmF0ZUxpbWl0ZXJJbnB1dCA9IHtcbiAgICAgICAgICB1c2VySWQ6IHNlbGYudXNlcklkLFxuICAgICAgICAgIGNsaWVudEFkZHJlc3M6IHNlbGYuY29ubmVjdGlvbkhhbmRsZS5jbGllbnRBZGRyZXNzLFxuICAgICAgICAgIHR5cGU6IFwic3Vic2NyaXB0aW9uXCIsXG4gICAgICAgICAgbmFtZTogbXNnLm5hbWUsXG4gICAgICAgICAgY29ubmVjdGlvbklkOiBzZWxmLmlkXG4gICAgICAgIH07XG5cbiAgICAgICAgRERQUmF0ZUxpbWl0ZXIuX2luY3JlbWVudChyYXRlTGltaXRlcklucHV0KTtcbiAgICAgICAgdmFyIHJhdGVMaW1pdFJlc3VsdCA9IEREUFJhdGVMaW1pdGVyLl9jaGVjayhyYXRlTGltaXRlcklucHV0KTtcbiAgICAgICAgaWYgKCFyYXRlTGltaXRSZXN1bHQuYWxsb3dlZCkge1xuICAgICAgICAgIHNlbGYuc2VuZCh7XG4gICAgICAgICAgICBtc2c6ICdub3N1YicsIGlkOiBtc2cuaWQsXG4gICAgICAgICAgICBlcnJvcjogbmV3IE1ldGVvci5FcnJvcihcbiAgICAgICAgICAgICAgJ3Rvby1tYW55LXJlcXVlc3RzJyxcbiAgICAgICAgICAgICAgRERQUmF0ZUxpbWl0ZXIuZ2V0RXJyb3JNZXNzYWdlKHJhdGVMaW1pdFJlc3VsdCksXG4gICAgICAgICAgICAgIHt0aW1lVG9SZXNldDogcmF0ZUxpbWl0UmVzdWx0LnRpbWVUb1Jlc2V0fSlcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIGhhbmRsZXIgPSBzZWxmLnNlcnZlci5wdWJsaXNoX2hhbmRsZXJzW21zZy5uYW1lXTtcblxuICAgICAgc2VsZi5fc3RhcnRTdWJzY3JpcHRpb24oaGFuZGxlciwgbXNnLmlkLCBtc2cucGFyYW1zLCBtc2cubmFtZSk7XG5cbiAgICB9LFxuXG4gICAgdW5zdWI6IGZ1bmN0aW9uIChtc2cpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgc2VsZi5fc3RvcFN1YnNjcmlwdGlvbihtc2cuaWQpO1xuICAgIH0sXG5cbiAgICBtZXRob2Q6IGZ1bmN0aW9uIChtc2csIHVuYmxvY2spIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgLy8gcmVqZWN0IG1hbGZvcm1lZCBtZXNzYWdlc1xuICAgICAgLy8gRm9yIG5vdywgd2Ugc2lsZW50bHkgaWdub3JlIHVua25vd24gYXR0cmlidXRlcyxcbiAgICAgIC8vIGZvciBmb3J3YXJkcyBjb21wYXRpYmlsaXR5LlxuICAgICAgaWYgKHR5cGVvZiAobXNnLmlkKSAhPT0gXCJzdHJpbmdcIiB8fFxuICAgICAgICAgIHR5cGVvZiAobXNnLm1ldGhvZCkgIT09IFwic3RyaW5nXCIgfHxcbiAgICAgICAgICAoKCdwYXJhbXMnIGluIG1zZykgJiYgIShtc2cucGFyYW1zIGluc3RhbmNlb2YgQXJyYXkpKSB8fFxuICAgICAgICAgICgoJ3JhbmRvbVNlZWQnIGluIG1zZykgJiYgKHR5cGVvZiBtc2cucmFuZG9tU2VlZCAhPT0gXCJzdHJpbmdcIikpKSB7XG4gICAgICAgIHNlbGYuc2VuZEVycm9yKFwiTWFsZm9ybWVkIG1ldGhvZCBpbnZvY2F0aW9uXCIsIG1zZyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIHJhbmRvbVNlZWQgPSBtc2cucmFuZG9tU2VlZCB8fCBudWxsO1xuXG4gICAgICAvLyBzZXQgdXAgdG8gbWFyayB0aGUgbWV0aG9kIGFzIHNhdGlzZmllZCBvbmNlIGFsbCBvYnNlcnZlcnNcbiAgICAgIC8vIChhbmQgc3Vic2NyaXB0aW9ucykgaGF2ZSByZWFjdGVkIHRvIGFueSB3cml0ZXMgdGhhdCB3ZXJlXG4gICAgICAvLyBkb25lLlxuICAgICAgdmFyIGZlbmNlID0gbmV3IEREUFNlcnZlci5fV3JpdGVGZW5jZTtcbiAgICAgIGZlbmNlLm9uQWxsQ29tbWl0dGVkKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gUmV0aXJlIHRoZSBmZW5jZSBzbyB0aGF0IGZ1dHVyZSB3cml0ZXMgYXJlIGFsbG93ZWQuXG4gICAgICAgIC8vIFRoaXMgbWVhbnMgdGhhdCBjYWxsYmFja3MgbGlrZSB0aW1lcnMgYXJlIGZyZWUgdG8gdXNlXG4gICAgICAgIC8vIHRoZSBmZW5jZSwgYW5kIGlmIHRoZXkgZmlyZSBiZWZvcmUgaXQncyBhcm1lZCAoZm9yXG4gICAgICAgIC8vIGV4YW1wbGUsIGJlY2F1c2UgdGhlIG1ldGhvZCB3YWl0cyBmb3IgdGhlbSkgdGhlaXJcbiAgICAgICAgLy8gd3JpdGVzIHdpbGwgYmUgaW5jbHVkZWQgaW4gdGhlIGZlbmNlLlxuICAgICAgICBmZW5jZS5yZXRpcmUoKTtcbiAgICAgICAgc2VsZi5zZW5kKHtcbiAgICAgICAgICBtc2c6ICd1cGRhdGVkJywgbWV0aG9kczogW21zZy5pZF19KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBmaW5kIHRoZSBoYW5kbGVyXG4gICAgICB2YXIgaGFuZGxlciA9IHNlbGYuc2VydmVyLm1ldGhvZF9oYW5kbGVyc1ttc2cubWV0aG9kXTtcbiAgICAgIGlmICghaGFuZGxlcikge1xuICAgICAgICBzZWxmLnNlbmQoe1xuICAgICAgICAgIG1zZzogJ3Jlc3VsdCcsIGlkOiBtc2cuaWQsXG4gICAgICAgICAgZXJyb3I6IG5ldyBNZXRlb3IuRXJyb3IoNDA0LCBgTWV0aG9kICcke21zZy5tZXRob2R9JyBub3QgZm91bmRgKX0pO1xuICAgICAgICBmZW5jZS5hcm0oKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB2YXIgc2V0VXNlcklkID0gZnVuY3Rpb24odXNlcklkKSB7XG4gICAgICAgIHNlbGYuX3NldFVzZXJJZCh1c2VySWQpO1xuICAgICAgfTtcblxuICAgICAgdmFyIGludm9jYXRpb24gPSBuZXcgRERQQ29tbW9uLk1ldGhvZEludm9jYXRpb24oe1xuICAgICAgICBpc1NpbXVsYXRpb246IGZhbHNlLFxuICAgICAgICB1c2VySWQ6IHNlbGYudXNlcklkLFxuICAgICAgICBzZXRVc2VySWQ6IHNldFVzZXJJZCxcbiAgICAgICAgdW5ibG9jazogdW5ibG9jayxcbiAgICAgICAgY29ubmVjdGlvbjogc2VsZi5jb25uZWN0aW9uSGFuZGxlLFxuICAgICAgICByYW5kb21TZWVkOiByYW5kb21TZWVkXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgLy8gWFhYIEl0J2QgYmUgYmV0dGVyIGlmIHdlIGNvdWxkIGhvb2sgaW50byBtZXRob2QgaGFuZGxlcnMgYmV0dGVyIGJ1dFxuICAgICAgICAvLyBmb3Igbm93LCB3ZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSBkZHAtcmF0ZS1saW1pdGVyIGV4aXN0cyBzaW5jZSB3ZVxuICAgICAgICAvLyBoYXZlIGEgd2VhayByZXF1aXJlbWVudCBmb3IgdGhlIGRkcC1yYXRlLWxpbWl0ZXIgcGFja2FnZSB0byBiZSBhZGRlZFxuICAgICAgICAvLyB0byBvdXIgYXBwbGljYXRpb24uXG4gICAgICAgIGlmIChQYWNrYWdlWydkZHAtcmF0ZS1saW1pdGVyJ10pIHtcbiAgICAgICAgICB2YXIgRERQUmF0ZUxpbWl0ZXIgPSBQYWNrYWdlWydkZHAtcmF0ZS1saW1pdGVyJ10uRERQUmF0ZUxpbWl0ZXI7XG4gICAgICAgICAgdmFyIHJhdGVMaW1pdGVySW5wdXQgPSB7XG4gICAgICAgICAgICB1c2VySWQ6IHNlbGYudXNlcklkLFxuICAgICAgICAgICAgY2xpZW50QWRkcmVzczogc2VsZi5jb25uZWN0aW9uSGFuZGxlLmNsaWVudEFkZHJlc3MsXG4gICAgICAgICAgICB0eXBlOiBcIm1ldGhvZFwiLFxuICAgICAgICAgICAgbmFtZTogbXNnLm1ldGhvZCxcbiAgICAgICAgICAgIGNvbm5lY3Rpb25JZDogc2VsZi5pZFxuICAgICAgICAgIH07XG4gICAgICAgICAgRERQUmF0ZUxpbWl0ZXIuX2luY3JlbWVudChyYXRlTGltaXRlcklucHV0KTtcbiAgICAgICAgICB2YXIgcmF0ZUxpbWl0UmVzdWx0ID0gRERQUmF0ZUxpbWl0ZXIuX2NoZWNrKHJhdGVMaW1pdGVySW5wdXQpXG4gICAgICAgICAgaWYgKCFyYXRlTGltaXRSZXN1bHQuYWxsb3dlZCkge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBNZXRlb3IuRXJyb3IoXG4gICAgICAgICAgICAgIFwidG9vLW1hbnktcmVxdWVzdHNcIixcbiAgICAgICAgICAgICAgRERQUmF0ZUxpbWl0ZXIuZ2V0RXJyb3JNZXNzYWdlKHJhdGVMaW1pdFJlc3VsdCksXG4gICAgICAgICAgICAgIHt0aW1lVG9SZXNldDogcmF0ZUxpbWl0UmVzdWx0LnRpbWVUb1Jlc2V0fVxuICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmVzb2x2ZShERFBTZXJ2ZXIuX0N1cnJlbnRXcml0ZUZlbmNlLndpdGhWYWx1ZShcbiAgICAgICAgICBmZW5jZSxcbiAgICAgICAgICAoKSA9PiBERFAuX0N1cnJlbnRNZXRob2RJbnZvY2F0aW9uLndpdGhWYWx1ZShcbiAgICAgICAgICAgIGludm9jYXRpb24sXG4gICAgICAgICAgICAoKSA9PiBtYXliZUF1ZGl0QXJndW1lbnRDaGVja3MoXG4gICAgICAgICAgICAgIGhhbmRsZXIsIGludm9jYXRpb24sIG1zZy5wYXJhbXMsXG4gICAgICAgICAgICAgIFwiY2FsbCB0byAnXCIgKyBtc2cubWV0aG9kICsgXCInXCJcbiAgICAgICAgICAgIClcbiAgICAgICAgICApXG4gICAgICAgICkpO1xuICAgICAgfSk7XG5cbiAgICAgIGZ1bmN0aW9uIGZpbmlzaCgpIHtcbiAgICAgICAgZmVuY2UuYXJtKCk7XG4gICAgICAgIHVuYmxvY2soKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcGF5bG9hZCA9IHtcbiAgICAgICAgbXNnOiBcInJlc3VsdFwiLFxuICAgICAgICBpZDogbXNnLmlkXG4gICAgICB9O1xuXG4gICAgICBwcm9taXNlLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICBmaW5pc2goKTtcbiAgICAgICAgaWYgKHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgcGF5bG9hZC5yZXN1bHQgPSByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgc2VsZi5zZW5kKHBheWxvYWQpO1xuICAgICAgfSwgKGV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBmaW5pc2goKTtcbiAgICAgICAgcGF5bG9hZC5lcnJvciA9IHdyYXBJbnRlcm5hbEV4Y2VwdGlvbihcbiAgICAgICAgICBleGNlcHRpb24sXG4gICAgICAgICAgYHdoaWxlIGludm9raW5nIG1ldGhvZCAnJHttc2cubWV0aG9kfSdgXG4gICAgICAgICk7XG4gICAgICAgIHNlbGYuc2VuZChwYXlsb2FkKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICBfZWFjaFN1YjogZnVuY3Rpb24gKGYpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgXy5lYWNoKHNlbGYuX25hbWVkU3VicywgZik7XG4gICAgXy5lYWNoKHNlbGYuX3VuaXZlcnNhbFN1YnMsIGYpO1xuICB9LFxuXG4gIF9kaWZmQ29sbGVjdGlvblZpZXdzOiBmdW5jdGlvbiAoYmVmb3JlQ1ZzKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIERpZmZTZXF1ZW5jZS5kaWZmT2JqZWN0cyhiZWZvcmVDVnMsIHNlbGYuY29sbGVjdGlvblZpZXdzLCB7XG4gICAgICBib3RoOiBmdW5jdGlvbiAoY29sbGVjdGlvbk5hbWUsIGxlZnRWYWx1ZSwgcmlnaHRWYWx1ZSkge1xuICAgICAgICByaWdodFZhbHVlLmRpZmYobGVmdFZhbHVlKTtcbiAgICAgIH0sXG4gICAgICByaWdodE9ubHk6IGZ1bmN0aW9uIChjb2xsZWN0aW9uTmFtZSwgcmlnaHRWYWx1ZSkge1xuICAgICAgICBfLmVhY2gocmlnaHRWYWx1ZS5kb2N1bWVudHMsIGZ1bmN0aW9uIChkb2NWaWV3LCBpZCkge1xuICAgICAgICAgIHNlbGYuc2VuZEFkZGVkKGNvbGxlY3Rpb25OYW1lLCBpZCwgZG9jVmlldy5nZXRGaWVsZHMoKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICAgIGxlZnRPbmx5OiBmdW5jdGlvbiAoY29sbGVjdGlvbk5hbWUsIGxlZnRWYWx1ZSkge1xuICAgICAgICBfLmVhY2gobGVmdFZhbHVlLmRvY3VtZW50cywgZnVuY3Rpb24gKGRvYywgaWQpIHtcbiAgICAgICAgICBzZWxmLnNlbmRSZW1vdmVkKGNvbGxlY3Rpb25OYW1lLCBpZCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIC8vIFNldHMgdGhlIGN1cnJlbnQgdXNlciBpZCBpbiBhbGwgYXBwcm9wcmlhdGUgY29udGV4dHMgYW5kIHJlcnVuc1xuICAvLyBhbGwgc3Vic2NyaXB0aW9uc1xuICBfc2V0VXNlcklkOiBmdW5jdGlvbih1c2VySWQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBpZiAodXNlcklkICE9PSBudWxsICYmIHR5cGVvZiB1c2VySWQgIT09IFwic3RyaW5nXCIpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJzZXRVc2VySWQgbXVzdCBiZSBjYWxsZWQgb24gc3RyaW5nIG9yIG51bGwsIG5vdCBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHVzZXJJZCk7XG5cbiAgICAvLyBQcmV2ZW50IG5ld2x5LWNyZWF0ZWQgdW5pdmVyc2FsIHN1YnNjcmlwdGlvbnMgZnJvbSBiZWluZyBhZGRlZCB0byBvdXJcbiAgICAvLyBzZXNzaW9uOyB0aGV5IHdpbGwgYmUgZm91bmQgYmVsb3cgd2hlbiB3ZSBjYWxsIHN0YXJ0VW5pdmVyc2FsU3Vicy5cbiAgICAvL1xuICAgIC8vIChXZSBkb24ndCBoYXZlIHRvIHdvcnJ5IGFib3V0IG5hbWVkIHN1YnNjcmlwdGlvbnMsIGJlY2F1c2Ugd2Ugb25seSBhZGRcbiAgICAvLyB0aGVtIHdoZW4gd2UgcHJvY2VzcyBhICdzdWInIG1lc3NhZ2UuIFdlIGFyZSBjdXJyZW50bHkgcHJvY2Vzc2luZyBhXG4gICAgLy8gJ21ldGhvZCcgbWVzc2FnZSwgYW5kIHRoZSBtZXRob2QgZGlkIG5vdCB1bmJsb2NrLCBiZWNhdXNlIGl0IGlzIGlsbGVnYWxcbiAgICAvLyB0byBjYWxsIHNldFVzZXJJZCBhZnRlciB1bmJsb2NrLiBUaHVzIHdlIGNhbm5vdCBiZSBjb25jdXJyZW50bHkgYWRkaW5nIGFcbiAgICAvLyBuZXcgbmFtZWQgc3Vic2NyaXB0aW9uLilcbiAgICBzZWxmLl9kb250U3RhcnROZXdVbml2ZXJzYWxTdWJzID0gdHJ1ZTtcblxuICAgIC8vIFByZXZlbnQgY3VycmVudCBzdWJzIGZyb20gdXBkYXRpbmcgb3VyIGNvbGxlY3Rpb25WaWV3cyBhbmQgY2FsbCB0aGVpclxuICAgIC8vIHN0b3AgY2FsbGJhY2tzLiBUaGlzIG1heSB5aWVsZC5cbiAgICBzZWxmLl9lYWNoU3ViKGZ1bmN0aW9uIChzdWIpIHtcbiAgICAgIHN1Yi5fZGVhY3RpdmF0ZSgpO1xuICAgIH0pO1xuXG4gICAgLy8gQWxsIHN1YnMgc2hvdWxkIG5vdyBiZSBkZWFjdGl2YXRlZC4gU3RvcCBzZW5kaW5nIG1lc3NhZ2VzIHRvIHRoZSBjbGllbnQsXG4gICAgLy8gc2F2ZSB0aGUgc3RhdGUgb2YgdGhlIHB1Ymxpc2hlZCBjb2xsZWN0aW9ucywgcmVzZXQgdG8gYW4gZW1wdHkgdmlldywgYW5kXG4gICAgLy8gdXBkYXRlIHRoZSB1c2VySWQuXG4gICAgc2VsZi5faXNTZW5kaW5nID0gZmFsc2U7XG4gICAgdmFyIGJlZm9yZUNWcyA9IHNlbGYuY29sbGVjdGlvblZpZXdzO1xuICAgIHNlbGYuY29sbGVjdGlvblZpZXdzID0ge307XG4gICAgc2VsZi51c2VySWQgPSB1c2VySWQ7XG5cbiAgICAvLyBfc2V0VXNlcklkIGlzIG5vcm1hbGx5IGNhbGxlZCBmcm9tIGEgTWV0ZW9yIG1ldGhvZCB3aXRoXG4gICAgLy8gRERQLl9DdXJyZW50TWV0aG9kSW52b2NhdGlvbiBzZXQuIEJ1dCBERFAuX0N1cnJlbnRNZXRob2RJbnZvY2F0aW9uIGlzIG5vdFxuICAgIC8vIGV4cGVjdGVkIHRvIGJlIHNldCBpbnNpZGUgYSBwdWJsaXNoIGZ1bmN0aW9uLCBzbyB3ZSB0ZW1wb3JhcnkgdW5zZXQgaXQuXG4gICAgLy8gSW5zaWRlIGEgcHVibGlzaCBmdW5jdGlvbiBERFAuX0N1cnJlbnRQdWJsaWNhdGlvbkludm9jYXRpb24gaXMgc2V0LlxuICAgIEREUC5fQ3VycmVudE1ldGhvZEludm9jYXRpb24ud2l0aFZhbHVlKHVuZGVmaW5lZCwgZnVuY3Rpb24gKCkge1xuICAgICAgLy8gU2F2ZSB0aGUgb2xkIG5hbWVkIHN1YnMsIGFuZCByZXNldCB0byBoYXZpbmcgbm8gc3Vic2NyaXB0aW9ucy5cbiAgICAgIHZhciBvbGROYW1lZFN1YnMgPSBzZWxmLl9uYW1lZFN1YnM7XG4gICAgICBzZWxmLl9uYW1lZFN1YnMgPSB7fTtcbiAgICAgIHNlbGYuX3VuaXZlcnNhbFN1YnMgPSBbXTtcblxuICAgICAgXy5lYWNoKG9sZE5hbWVkU3VicywgZnVuY3Rpb24gKHN1Yiwgc3Vic2NyaXB0aW9uSWQpIHtcbiAgICAgICAgc2VsZi5fbmFtZWRTdWJzW3N1YnNjcmlwdGlvbklkXSA9IHN1Yi5fcmVjcmVhdGUoKTtcbiAgICAgICAgLy8gbmI6IGlmIHRoZSBoYW5kbGVyIHRocm93cyBvciBjYWxscyB0aGlzLmVycm9yKCksIGl0IHdpbGwgaW4gZmFjdFxuICAgICAgICAvLyBpbW1lZGlhdGVseSBzZW5kIGl0cyAnbm9zdWInLiBUaGlzIGlzIE9LLCB0aG91Z2guXG4gICAgICAgIHNlbGYuX25hbWVkU3Vic1tzdWJzY3JpcHRpb25JZF0uX3J1bkhhbmRsZXIoKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBBbGxvdyBuZXdseS1jcmVhdGVkIHVuaXZlcnNhbCBzdWJzIHRvIGJlIHN0YXJ0ZWQgb24gb3VyIGNvbm5lY3Rpb24gaW5cbiAgICAgIC8vIHBhcmFsbGVsIHdpdGggdGhlIG9uZXMgd2UncmUgc3Bpbm5pbmcgdXAgaGVyZSwgYW5kIHNwaW4gdXAgdW5pdmVyc2FsXG4gICAgICAvLyBzdWJzLlxuICAgICAgc2VsZi5fZG9udFN0YXJ0TmV3VW5pdmVyc2FsU3VicyA9IGZhbHNlO1xuICAgICAgc2VsZi5zdGFydFVuaXZlcnNhbFN1YnMoKTtcbiAgICB9KTtcblxuICAgIC8vIFN0YXJ0IHNlbmRpbmcgbWVzc2FnZXMgYWdhaW4sIGJlZ2lubmluZyB3aXRoIHRoZSBkaWZmIGZyb20gdGhlIHByZXZpb3VzXG4gICAgLy8gc3RhdGUgb2YgdGhlIHdvcmxkIHRvIHRoZSBjdXJyZW50IHN0YXRlLiBObyB5aWVsZHMgYXJlIGFsbG93ZWQgZHVyaW5nXG4gICAgLy8gdGhpcyBkaWZmLCBzbyB0aGF0IG90aGVyIGNoYW5nZXMgY2Fubm90IGludGVybGVhdmUuXG4gICAgTWV0ZW9yLl9ub1lpZWxkc0FsbG93ZWQoZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi5faXNTZW5kaW5nID0gdHJ1ZTtcbiAgICAgIHNlbGYuX2RpZmZDb2xsZWN0aW9uVmlld3MoYmVmb3JlQ1ZzKTtcbiAgICAgIGlmICghXy5pc0VtcHR5KHNlbGYuX3BlbmRpbmdSZWFkeSkpIHtcbiAgICAgICAgc2VsZi5zZW5kUmVhZHkoc2VsZi5fcGVuZGluZ1JlYWR5KTtcbiAgICAgICAgc2VsZi5fcGVuZGluZ1JlYWR5ID0gW107XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG5cbiAgX3N0YXJ0U3Vic2NyaXB0aW9uOiBmdW5jdGlvbiAoaGFuZGxlciwgc3ViSWQsIHBhcmFtcywgbmFtZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHZhciBzdWIgPSBuZXcgU3Vic2NyaXB0aW9uKFxuICAgICAgc2VsZiwgaGFuZGxlciwgc3ViSWQsIHBhcmFtcywgbmFtZSk7XG4gICAgaWYgKHN1YklkKVxuICAgICAgc2VsZi5fbmFtZWRTdWJzW3N1YklkXSA9IHN1YjtcbiAgICBlbHNlXG4gICAgICBzZWxmLl91bml2ZXJzYWxTdWJzLnB1c2goc3ViKTtcblxuICAgIHN1Yi5fcnVuSGFuZGxlcigpO1xuICB9LFxuXG4gIC8vIHRlYXIgZG93biBzcGVjaWZpZWQgc3Vic2NyaXB0aW9uXG4gIF9zdG9wU3Vic2NyaXB0aW9uOiBmdW5jdGlvbiAoc3ViSWQsIGVycm9yKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdmFyIHN1Yk5hbWUgPSBudWxsO1xuXG4gICAgaWYgKHN1YklkICYmIHNlbGYuX25hbWVkU3Vic1tzdWJJZF0pIHtcbiAgICAgIHN1Yk5hbWUgPSBzZWxmLl9uYW1lZFN1YnNbc3ViSWRdLl9uYW1lO1xuICAgICAgc2VsZi5fbmFtZWRTdWJzW3N1YklkXS5fcmVtb3ZlQWxsRG9jdW1lbnRzKCk7XG4gICAgICBzZWxmLl9uYW1lZFN1YnNbc3ViSWRdLl9kZWFjdGl2YXRlKCk7XG4gICAgICBkZWxldGUgc2VsZi5fbmFtZWRTdWJzW3N1YklkXTtcbiAgICB9XG5cbiAgICB2YXIgcmVzcG9uc2UgPSB7bXNnOiAnbm9zdWInLCBpZDogc3ViSWR9O1xuXG4gICAgaWYgKGVycm9yKSB7XG4gICAgICByZXNwb25zZS5lcnJvciA9IHdyYXBJbnRlcm5hbEV4Y2VwdGlvbihcbiAgICAgICAgZXJyb3IsXG4gICAgICAgIHN1Yk5hbWUgPyAoXCJmcm9tIHN1YiBcIiArIHN1Yk5hbWUgKyBcIiBpZCBcIiArIHN1YklkKVxuICAgICAgICAgIDogKFwiZnJvbSBzdWIgaWQgXCIgKyBzdWJJZCkpO1xuICAgIH1cblxuICAgIHNlbGYuc2VuZChyZXNwb25zZSk7XG4gIH0sXG5cbiAgLy8gdGVhciBkb3duIGFsbCBzdWJzY3JpcHRpb25zLiBOb3RlIHRoYXQgdGhpcyBkb2VzIE5PVCBzZW5kIHJlbW92ZWQgb3Igbm9zdWJcbiAgLy8gbWVzc2FnZXMsIHNpbmNlIHdlIGFzc3VtZSB0aGUgY2xpZW50IGlzIGdvbmUuXG4gIF9kZWFjdGl2YXRlQWxsU3Vic2NyaXB0aW9uczogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIF8uZWFjaChzZWxmLl9uYW1lZFN1YnMsIGZ1bmN0aW9uIChzdWIsIGlkKSB7XG4gICAgICBzdWIuX2RlYWN0aXZhdGUoKTtcbiAgICB9KTtcbiAgICBzZWxmLl9uYW1lZFN1YnMgPSB7fTtcblxuICAgIF8uZWFjaChzZWxmLl91bml2ZXJzYWxTdWJzLCBmdW5jdGlvbiAoc3ViKSB7XG4gICAgICBzdWIuX2RlYWN0aXZhdGUoKTtcbiAgICB9KTtcbiAgICBzZWxmLl91bml2ZXJzYWxTdWJzID0gW107XG4gIH0sXG5cbiAgLy8gRGV0ZXJtaW5lIHRoZSByZW1vdGUgY2xpZW50J3MgSVAgYWRkcmVzcywgYmFzZWQgb24gdGhlXG4gIC8vIEhUVFBfRk9SV0FSREVEX0NPVU5UIGVudmlyb25tZW50IHZhcmlhYmxlIHJlcHJlc2VudGluZyBob3cgbWFueVxuICAvLyBwcm94aWVzIHRoZSBzZXJ2ZXIgaXMgYmVoaW5kLlxuICBfY2xpZW50QWRkcmVzczogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIC8vIEZvciB0aGUgcmVwb3J0ZWQgY2xpZW50IGFkZHJlc3MgZm9yIGEgY29ubmVjdGlvbiB0byBiZSBjb3JyZWN0LFxuICAgIC8vIHRoZSBkZXZlbG9wZXIgbXVzdCBzZXQgdGhlIEhUVFBfRk9SV0FSREVEX0NPVU5UIGVudmlyb25tZW50XG4gICAgLy8gdmFyaWFibGUgdG8gYW4gaW50ZWdlciByZXByZXNlbnRpbmcgdGhlIG51bWJlciBvZiBob3BzIHRoZXlcbiAgICAvLyBleHBlY3QgaW4gdGhlIGB4LWZvcndhcmRlZC1mb3JgIGhlYWRlci4gRS5nLiwgc2V0IHRvIFwiMVwiIGlmIHRoZVxuICAgIC8vIHNlcnZlciBpcyBiZWhpbmQgb25lIHByb3h5LlxuICAgIC8vXG4gICAgLy8gVGhpcyBjb3VsZCBiZSBjb21wdXRlZCBvbmNlIGF0IHN0YXJ0dXAgaW5zdGVhZCBvZiBldmVyeSB0aW1lLlxuICAgIHZhciBodHRwRm9yd2FyZGVkQ291bnQgPSBwYXJzZUludChwcm9jZXNzLmVudlsnSFRUUF9GT1JXQVJERURfQ09VTlQnXSkgfHwgMDtcblxuICAgIGlmIChodHRwRm9yd2FyZGVkQ291bnQgPT09IDApXG4gICAgICByZXR1cm4gc2VsZi5zb2NrZXQucmVtb3RlQWRkcmVzcztcblxuICAgIHZhciBmb3J3YXJkZWRGb3IgPSBzZWxmLnNvY2tldC5oZWFkZXJzW1wieC1mb3J3YXJkZWQtZm9yXCJdO1xuICAgIGlmICghIF8uaXNTdHJpbmcoZm9yd2FyZGVkRm9yKSlcbiAgICAgIHJldHVybiBudWxsO1xuICAgIGZvcndhcmRlZEZvciA9IGZvcndhcmRlZEZvci50cmltKCkuc3BsaXQoL1xccyosXFxzKi8pO1xuXG4gICAgLy8gVHlwaWNhbGx5IHRoZSBmaXJzdCB2YWx1ZSBpbiB0aGUgYHgtZm9yd2FyZGVkLWZvcmAgaGVhZGVyIGlzXG4gICAgLy8gdGhlIG9yaWdpbmFsIElQIGFkZHJlc3Mgb2YgdGhlIGNsaWVudCBjb25uZWN0aW5nIHRvIHRoZSBmaXJzdFxuICAgIC8vIHByb3h5LiAgSG93ZXZlciwgdGhlIGVuZCB1c2VyIGNhbiBlYXNpbHkgc3Bvb2YgdGhlIGhlYWRlciwgaW5cbiAgICAvLyB3aGljaCBjYXNlIHRoZSBmaXJzdCB2YWx1ZShzKSB3aWxsIGJlIHRoZSBmYWtlIElQIGFkZHJlc3MgZnJvbVxuICAgIC8vIHRoZSB1c2VyIHByZXRlbmRpbmcgdG8gYmUgYSBwcm94eSByZXBvcnRpbmcgdGhlIG9yaWdpbmFsIElQXG4gICAgLy8gYWRkcmVzcyB2YWx1ZS4gIEJ5IGNvdW50aW5nIEhUVFBfRk9SV0FSREVEX0NPVU5UIGJhY2sgZnJvbSB0aGVcbiAgICAvLyBlbmQgb2YgdGhlIGxpc3QsIHdlIGVuc3VyZSB0aGF0IHdlIGdldCB0aGUgSVAgYWRkcmVzcyBiZWluZ1xuICAgIC8vIHJlcG9ydGVkIGJ5ICpvdXIqIGZpcnN0IHByb3h5LlxuXG4gICAgaWYgKGh0dHBGb3J3YXJkZWRDb3VudCA8IDAgfHwgaHR0cEZvcndhcmRlZENvdW50ID4gZm9yd2FyZGVkRm9yLmxlbmd0aClcbiAgICAgIHJldHVybiBudWxsO1xuXG4gICAgcmV0dXJuIGZvcndhcmRlZEZvcltmb3J3YXJkZWRGb3IubGVuZ3RoIC0gaHR0cEZvcndhcmRlZENvdW50XTtcbiAgfVxufSk7XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiBTdWJzY3JpcHRpb24gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuLy8gY3RvciBmb3IgYSBzdWIgaGFuZGxlOiB0aGUgaW5wdXQgdG8gZWFjaCBwdWJsaXNoIGZ1bmN0aW9uXG5cbi8vIEluc3RhbmNlIG5hbWUgaXMgdGhpcyBiZWNhdXNlIGl0J3MgdXN1YWxseSByZWZlcnJlZCB0byBhcyB0aGlzIGluc2lkZSBhXG4vLyBwdWJsaXNoXG4vKipcbiAqIEBzdW1tYXJ5IFRoZSBzZXJ2ZXIncyBzaWRlIG9mIGEgc3Vic2NyaXB0aW9uXG4gKiBAY2xhc3MgU3Vic2NyaXB0aW9uXG4gKiBAaW5zdGFuY2VOYW1lIHRoaXNcbiAqIEBzaG93SW5zdGFuY2VOYW1lIHRydWVcbiAqL1xudmFyIFN1YnNjcmlwdGlvbiA9IGZ1bmN0aW9uIChcbiAgICBzZXNzaW9uLCBoYW5kbGVyLCBzdWJzY3JpcHRpb25JZCwgcGFyYW1zLCBuYW1lKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgc2VsZi5fc2Vzc2lvbiA9IHNlc3Npb247IC8vIHR5cGUgaXMgU2Vzc2lvblxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBBY2Nlc3MgaW5zaWRlIHRoZSBwdWJsaXNoIGZ1bmN0aW9uLiBUaGUgaW5jb21pbmcgW2Nvbm5lY3Rpb25dKCNtZXRlb3Jfb25jb25uZWN0aW9uKSBmb3IgdGhpcyBzdWJzY3JpcHRpb24uXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQG5hbWUgIGNvbm5lY3Rpb25cbiAgICogQG1lbWJlck9mIFN1YnNjcmlwdGlvblxuICAgKiBAaW5zdGFuY2VcbiAgICovXG4gIHNlbGYuY29ubmVjdGlvbiA9IHNlc3Npb24uY29ubmVjdGlvbkhhbmRsZTsgLy8gcHVibGljIEFQSSBvYmplY3RcblxuICBzZWxmLl9oYW5kbGVyID0gaGFuZGxlcjtcblxuICAvLyBteSBzdWJzY3JpcHRpb24gSUQgKGdlbmVyYXRlZCBieSBjbGllbnQsIHVuZGVmaW5lZCBmb3IgdW5pdmVyc2FsIHN1YnMpLlxuICBzZWxmLl9zdWJzY3JpcHRpb25JZCA9IHN1YnNjcmlwdGlvbklkO1xuICAvLyB1bmRlZmluZWQgZm9yIHVuaXZlcnNhbCBzdWJzXG4gIHNlbGYuX25hbWUgPSBuYW1lO1xuXG4gIHNlbGYuX3BhcmFtcyA9IHBhcmFtcyB8fCBbXTtcblxuICAvLyBPbmx5IG5hbWVkIHN1YnNjcmlwdGlvbnMgaGF2ZSBJRHMsIGJ1dCB3ZSBuZWVkIHNvbWUgc29ydCBvZiBzdHJpbmdcbiAgLy8gaW50ZXJuYWxseSB0byBrZWVwIHRyYWNrIG9mIGFsbCBzdWJzY3JpcHRpb25zIGluc2lkZVxuICAvLyBTZXNzaW9uRG9jdW1lbnRWaWV3cy4gV2UgdXNlIHRoaXMgc3Vic2NyaXB0aW9uSGFuZGxlIGZvciB0aGF0LlxuICBpZiAoc2VsZi5fc3Vic2NyaXB0aW9uSWQpIHtcbiAgICBzZWxmLl9zdWJzY3JpcHRpb25IYW5kbGUgPSAnTicgKyBzZWxmLl9zdWJzY3JpcHRpb25JZDtcbiAgfSBlbHNlIHtcbiAgICBzZWxmLl9zdWJzY3JpcHRpb25IYW5kbGUgPSAnVScgKyBSYW5kb20uaWQoKTtcbiAgfVxuXG4gIC8vIGhhcyBfZGVhY3RpdmF0ZSBiZWVuIGNhbGxlZD9cbiAgc2VsZi5fZGVhY3RpdmF0ZWQgPSBmYWxzZTtcblxuICAvLyBzdG9wIGNhbGxiYWNrcyB0byBnL2MgdGhpcyBzdWIuICBjYWxsZWQgdy8gemVybyBhcmd1bWVudHMuXG4gIHNlbGYuX3N0b3BDYWxsYmFja3MgPSBbXTtcblxuICAvLyB0aGUgc2V0IG9mIChjb2xsZWN0aW9uLCBkb2N1bWVudGlkKSB0aGF0IHRoaXMgc3Vic2NyaXB0aW9uIGhhc1xuICAvLyBhbiBvcGluaW9uIGFib3V0XG4gIHNlbGYuX2RvY3VtZW50cyA9IHt9O1xuXG4gIC8vIHJlbWVtYmVyIGlmIHdlIGFyZSByZWFkeS5cbiAgc2VsZi5fcmVhZHkgPSBmYWxzZTtcblxuICAvLyBQYXJ0IG9mIHRoZSBwdWJsaWMgQVBJOiB0aGUgdXNlciBvZiB0aGlzIHN1Yi5cblxuICAvKipcbiAgICogQHN1bW1hcnkgQWNjZXNzIGluc2lkZSB0aGUgcHVibGlzaCBmdW5jdGlvbi4gVGhlIGlkIG9mIHRoZSBsb2dnZWQtaW4gdXNlciwgb3IgYG51bGxgIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBtZW1iZXJPZiBTdWJzY3JpcHRpb25cbiAgICogQG5hbWUgIHVzZXJJZFxuICAgKiBAaW5zdGFuY2VcbiAgICovXG4gIHNlbGYudXNlcklkID0gc2Vzc2lvbi51c2VySWQ7XG5cbiAgLy8gRm9yIG5vdywgdGhlIGlkIGZpbHRlciBpcyBnb2luZyB0byBkZWZhdWx0IHRvXG4gIC8vIHRoZSB0by9mcm9tIEREUCBtZXRob2RzIG9uIE1vbmdvSUQsIHRvXG4gIC8vIHNwZWNpZmljYWxseSBkZWFsIHdpdGggbW9uZ28vbWluaW1vbmdvIE9iamVjdElkcy5cblxuICAvLyBMYXRlciwgeW91IHdpbGwgYmUgYWJsZSB0byBtYWtlIHRoaXMgYmUgXCJyYXdcIlxuICAvLyBpZiB5b3Ugd2FudCB0byBwdWJsaXNoIGEgY29sbGVjdGlvbiB0aGF0IHlvdSBrbm93XG4gIC8vIGp1c3QgaGFzIHN0cmluZ3MgZm9yIGtleXMgYW5kIG5vIGZ1bm55IGJ1c2luZXNzLCB0b1xuICAvLyBhIGRkcCBjb25zdW1lciB0aGF0IGlzbid0IG1pbmltb25nb1xuXG4gIHNlbGYuX2lkRmlsdGVyID0ge1xuICAgIGlkU3RyaW5naWZ5OiBNb25nb0lELmlkU3RyaW5naWZ5LFxuICAgIGlkUGFyc2U6IE1vbmdvSUQuaWRQYXJzZVxuICB9O1xuXG4gIFBhY2thZ2VbJ2ZhY3RzLWJhc2UnXSAmJiBQYWNrYWdlWydmYWN0cy1iYXNlJ10uRmFjdHMuaW5jcmVtZW50U2VydmVyRmFjdChcbiAgICBcImxpdmVkYXRhXCIsIFwic3Vic2NyaXB0aW9uc1wiLCAxKTtcbn07XG5cbl8uZXh0ZW5kKFN1YnNjcmlwdGlvbi5wcm90b3R5cGUsIHtcbiAgX3J1bkhhbmRsZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBYWFggc2hvdWxkIHdlIHVuYmxvY2soKSBoZXJlPyBFaXRoZXIgYmVmb3JlIHJ1bm5pbmcgdGhlIHB1Ymxpc2hcbiAgICAvLyBmdW5jdGlvbiwgb3IgYmVmb3JlIHJ1bm5pbmcgX3B1Ymxpc2hDdXJzb3IuXG4gICAgLy9cbiAgICAvLyBSaWdodCBub3csIGVhY2ggcHVibGlzaCBmdW5jdGlvbiBibG9ja3MgYWxsIGZ1dHVyZSBwdWJsaXNoZXMgYW5kXG4gICAgLy8gbWV0aG9kcyB3YWl0aW5nIG9uIGRhdGEgZnJvbSBNb25nbyAob3Igd2hhdGV2ZXIgZWxzZSB0aGUgZnVuY3Rpb25cbiAgICAvLyBibG9ja3Mgb24pLiBUaGlzIHByb2JhYmx5IHNsb3dzIHBhZ2UgbG9hZCBpbiBjb21tb24gY2FzZXMuXG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdHJ5IHtcbiAgICAgIHZhciByZXMgPSBERFAuX0N1cnJlbnRQdWJsaWNhdGlvbkludm9jYXRpb24ud2l0aFZhbHVlKFxuICAgICAgICBzZWxmLFxuICAgICAgICAoKSA9PiBtYXliZUF1ZGl0QXJndW1lbnRDaGVja3MoXG4gICAgICAgICAgc2VsZi5faGFuZGxlciwgc2VsZiwgRUpTT04uY2xvbmUoc2VsZi5fcGFyYW1zKSxcbiAgICAgICAgICAvLyBJdCdzIE9LIHRoYXQgdGhpcyB3b3VsZCBsb29rIHdlaXJkIGZvciB1bml2ZXJzYWwgc3Vic2NyaXB0aW9ucyxcbiAgICAgICAgICAvLyBiZWNhdXNlIHRoZXkgaGF2ZSBubyBhcmd1bWVudHMgc28gdGhlcmUgY2FuIG5ldmVyIGJlIGFuXG4gICAgICAgICAgLy8gYXVkaXQtYXJndW1lbnQtY2hlY2tzIGZhaWx1cmUuXG4gICAgICAgICAgXCJwdWJsaXNoZXIgJ1wiICsgc2VsZi5fbmFtZSArIFwiJ1wiXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgc2VsZi5lcnJvcihlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBEaWQgdGhlIGhhbmRsZXIgY2FsbCB0aGlzLmVycm9yIG9yIHRoaXMuc3RvcD9cbiAgICBpZiAoc2VsZi5faXNEZWFjdGl2YXRlZCgpKVxuICAgICAgcmV0dXJuO1xuXG4gICAgc2VsZi5fcHVibGlzaEhhbmRsZXJSZXN1bHQocmVzKTtcbiAgfSxcblxuICBfcHVibGlzaEhhbmRsZXJSZXN1bHQ6IGZ1bmN0aW9uIChyZXMpIHtcbiAgICAvLyBTUEVDSUFMIENBU0U6IEluc3RlYWQgb2Ygd3JpdGluZyB0aGVpciBvd24gY2FsbGJhY2tzIHRoYXQgaW52b2tlXG4gICAgLy8gdGhpcy5hZGRlZC9jaGFuZ2VkL3JlYWR5L2V0YywgdGhlIHVzZXIgY2FuIGp1c3QgcmV0dXJuIGEgY29sbGVjdGlvblxuICAgIC8vIGN1cnNvciBvciBhcnJheSBvZiBjdXJzb3JzIGZyb20gdGhlIHB1Ymxpc2ggZnVuY3Rpb247IHdlIGNhbGwgdGhlaXJcbiAgICAvLyBfcHVibGlzaEN1cnNvciBtZXRob2Qgd2hpY2ggc3RhcnRzIG9ic2VydmluZyB0aGUgY3Vyc29yIGFuZCBwdWJsaXNoZXMgdGhlXG4gICAgLy8gcmVzdWx0cy4gTm90ZSB0aGF0IF9wdWJsaXNoQ3Vyc29yIGRvZXMgTk9UIGNhbGwgcmVhZHkoKS5cbiAgICAvL1xuICAgIC8vIFhYWCBUaGlzIHVzZXMgYW4gdW5kb2N1bWVudGVkIGludGVyZmFjZSB3aGljaCBvbmx5IHRoZSBNb25nbyBjdXJzb3JcbiAgICAvLyBpbnRlcmZhY2UgcHVibGlzaGVzLiBTaG91bGQgd2UgbWFrZSB0aGlzIGludGVyZmFjZSBwdWJsaWMgYW5kIGVuY291cmFnZVxuICAgIC8vIHVzZXJzIHRvIGltcGxlbWVudCBpdCB0aGVtc2VsdmVzPyBBcmd1YWJseSwgaXQncyB1bm5lY2Vzc2FyeTsgdXNlcnMgY2FuXG4gICAgLy8gYWxyZWFkeSB3cml0ZSB0aGVpciBvd24gZnVuY3Rpb25zIGxpa2VcbiAgICAvLyAgIHZhciBwdWJsaXNoTXlSZWFjdGl2ZVRoaW5neSA9IGZ1bmN0aW9uIChuYW1lLCBoYW5kbGVyKSB7XG4gICAgLy8gICAgIE1ldGVvci5wdWJsaXNoKG5hbWUsIGZ1bmN0aW9uICgpIHtcbiAgICAvLyAgICAgICB2YXIgcmVhY3RpdmVUaGluZ3kgPSBoYW5kbGVyKCk7XG4gICAgLy8gICAgICAgcmVhY3RpdmVUaGluZ3kucHVibGlzaE1lKCk7XG4gICAgLy8gICAgIH0pO1xuICAgIC8vICAgfTtcblxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgaXNDdXJzb3IgPSBmdW5jdGlvbiAoYykge1xuICAgICAgcmV0dXJuIGMgJiYgYy5fcHVibGlzaEN1cnNvcjtcbiAgICB9O1xuICAgIGlmIChpc0N1cnNvcihyZXMpKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXMuX3B1Ymxpc2hDdXJzb3Ioc2VsZik7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHNlbGYuZXJyb3IoZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vIF9wdWJsaXNoQ3Vyc29yIG9ubHkgcmV0dXJucyBhZnRlciB0aGUgaW5pdGlhbCBhZGRlZCBjYWxsYmFja3MgaGF2ZSBydW4uXG4gICAgICAvLyBtYXJrIHN1YnNjcmlwdGlvbiBhcyByZWFkeS5cbiAgICAgIHNlbGYucmVhZHkoKTtcbiAgICB9IGVsc2UgaWYgKF8uaXNBcnJheShyZXMpKSB7XG4gICAgICAvLyBjaGVjayBhbGwgdGhlIGVsZW1lbnRzIGFyZSBjdXJzb3JzXG4gICAgICBpZiAoISBfLmFsbChyZXMsIGlzQ3Vyc29yKSkge1xuICAgICAgICBzZWxmLmVycm9yKG5ldyBFcnJvcihcIlB1Ymxpc2ggZnVuY3Rpb24gcmV0dXJuZWQgYW4gYXJyYXkgb2Ygbm9uLUN1cnNvcnNcIikpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICAvLyBmaW5kIGR1cGxpY2F0ZSBjb2xsZWN0aW9uIG5hbWVzXG4gICAgICAvLyBYWFggd2Ugc2hvdWxkIHN1cHBvcnQgb3ZlcmxhcHBpbmcgY3Vyc29ycywgYnV0IHRoYXQgd291bGQgcmVxdWlyZSB0aGVcbiAgICAgIC8vIG1lcmdlIGJveCB0byBhbGxvdyBvdmVybGFwIHdpdGhpbiBhIHN1YnNjcmlwdGlvblxuICAgICAgdmFyIGNvbGxlY3Rpb25OYW1lcyA9IHt9O1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGNvbGxlY3Rpb25OYW1lID0gcmVzW2ldLl9nZXRDb2xsZWN0aW9uTmFtZSgpO1xuICAgICAgICBpZiAoXy5oYXMoY29sbGVjdGlvbk5hbWVzLCBjb2xsZWN0aW9uTmFtZSkpIHtcbiAgICAgICAgICBzZWxmLmVycm9yKG5ldyBFcnJvcihcbiAgICAgICAgICAgIFwiUHVibGlzaCBmdW5jdGlvbiByZXR1cm5lZCBtdWx0aXBsZSBjdXJzb3JzIGZvciBjb2xsZWN0aW9uIFwiICtcbiAgICAgICAgICAgICAgY29sbGVjdGlvbk5hbWUpKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29sbGVjdGlvbk5hbWVzW2NvbGxlY3Rpb25OYW1lXSA9IHRydWU7XG4gICAgICB9O1xuXG4gICAgICB0cnkge1xuICAgICAgICBfLmVhY2gocmVzLCBmdW5jdGlvbiAoY3VyKSB7XG4gICAgICAgICAgY3VyLl9wdWJsaXNoQ3Vyc29yKHNlbGYpO1xuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgc2VsZi5lcnJvcihlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgc2VsZi5yZWFkeSgpO1xuICAgIH0gZWxzZSBpZiAocmVzKSB7XG4gICAgICAvLyB0cnV0aHkgdmFsdWVzIG90aGVyIHRoYW4gY3Vyc29ycyBvciBhcnJheXMgYXJlIHByb2JhYmx5IGFcbiAgICAgIC8vIHVzZXIgbWlzdGFrZSAocG9zc2libGUgcmV0dXJuaW5nIGEgTW9uZ28gZG9jdW1lbnQgdmlhLCBzYXksXG4gICAgICAvLyBgY29sbC5maW5kT25lKClgKS5cbiAgICAgIHNlbGYuZXJyb3IobmV3IEVycm9yKFwiUHVibGlzaCBmdW5jdGlvbiBjYW4gb25seSByZXR1cm4gYSBDdXJzb3Igb3IgXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICsgXCJhbiBhcnJheSBvZiBDdXJzb3JzXCIpKTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gVGhpcyBjYWxscyBhbGwgc3RvcCBjYWxsYmFja3MgYW5kIHByZXZlbnRzIHRoZSBoYW5kbGVyIGZyb20gdXBkYXRpbmcgYW55XG4gIC8vIFNlc3Npb25Db2xsZWN0aW9uVmlld3MgZnVydGhlci4gSXQncyB1c2VkIHdoZW4gdGhlIHVzZXIgdW5zdWJzY3JpYmVzIG9yXG4gIC8vIGRpc2Nvbm5lY3RzLCBhcyB3ZWxsIGFzIGR1cmluZyBzZXRVc2VySWQgcmUtcnVucy4gSXQgZG9lcyAqTk9UKiBzZW5kXG4gIC8vIHJlbW92ZWQgbWVzc2FnZXMgZm9yIHRoZSBwdWJsaXNoZWQgb2JqZWN0czsgaWYgdGhhdCBpcyBuZWNlc3NhcnksIGNhbGxcbiAgLy8gX3JlbW92ZUFsbERvY3VtZW50cyBmaXJzdC5cbiAgX2RlYWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoc2VsZi5fZGVhY3RpdmF0ZWQpXG4gICAgICByZXR1cm47XG4gICAgc2VsZi5fZGVhY3RpdmF0ZWQgPSB0cnVlO1xuICAgIHNlbGYuX2NhbGxTdG9wQ2FsbGJhY2tzKCk7XG4gICAgUGFja2FnZVsnZmFjdHMtYmFzZSddICYmIFBhY2thZ2VbJ2ZhY3RzLWJhc2UnXS5GYWN0cy5pbmNyZW1lbnRTZXJ2ZXJGYWN0KFxuICAgICAgXCJsaXZlZGF0YVwiLCBcInN1YnNjcmlwdGlvbnNcIiwgLTEpO1xuICB9LFxuXG4gIF9jYWxsU3RvcENhbGxiYWNrczogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyB0ZWxsIGxpc3RlbmVycywgc28gdGhleSBjYW4gY2xlYW4gdXBcbiAgICB2YXIgY2FsbGJhY2tzID0gc2VsZi5fc3RvcENhbGxiYWNrcztcbiAgICBzZWxmLl9zdG9wQ2FsbGJhY2tzID0gW107XG4gICAgXy5lYWNoKGNhbGxiYWNrcywgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgIH0pO1xuICB9LFxuXG4gIC8vIFNlbmQgcmVtb3ZlIG1lc3NhZ2VzIGZvciBldmVyeSBkb2N1bWVudC5cbiAgX3JlbW92ZUFsbERvY3VtZW50czogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBNZXRlb3IuX25vWWllbGRzQWxsb3dlZChmdW5jdGlvbiAoKSB7XG4gICAgICBfLmVhY2goc2VsZi5fZG9jdW1lbnRzLCBmdW5jdGlvbihjb2xsZWN0aW9uRG9jcywgY29sbGVjdGlvbk5hbWUpIHtcbiAgICAgICAgLy8gSXRlcmF0ZSBvdmVyIF8ua2V5cyBpbnN0ZWFkIG9mIHRoZSBkaWN0aW9uYXJ5IGl0c2VsZiwgc2luY2Ugd2UnbGwgYmVcbiAgICAgICAgLy8gbXV0YXRpbmcgaXQuXG4gICAgICAgIF8uZWFjaChfLmtleXMoY29sbGVjdGlvbkRvY3MpLCBmdW5jdGlvbiAoc3RySWQpIHtcbiAgICAgICAgICBzZWxmLnJlbW92ZWQoY29sbGVjdGlvbk5hbWUsIHNlbGYuX2lkRmlsdGVyLmlkUGFyc2Uoc3RySWQpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcblxuICAvLyBSZXR1cm5zIGEgbmV3IFN1YnNjcmlwdGlvbiBmb3IgdGhlIHNhbWUgc2Vzc2lvbiB3aXRoIHRoZSBzYW1lXG4gIC8vIGluaXRpYWwgY3JlYXRpb24gcGFyYW1ldGVycy4gVGhpcyBpc24ndCBhIGNsb25lOiBpdCBkb2Vzbid0IGhhdmVcbiAgLy8gdGhlIHNhbWUgX2RvY3VtZW50cyBjYWNoZSwgc3RvcHBlZCBzdGF0ZSBvciBjYWxsYmFja3M7IG1heSBoYXZlIGFcbiAgLy8gZGlmZmVyZW50IF9zdWJzY3JpcHRpb25IYW5kbGUsIGFuZCBnZXRzIGl0cyB1c2VySWQgZnJvbSB0aGVcbiAgLy8gc2Vzc2lvbiwgbm90IGZyb20gdGhpcyBvYmplY3QuXG4gIF9yZWNyZWF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICByZXR1cm4gbmV3IFN1YnNjcmlwdGlvbihcbiAgICAgIHNlbGYuX3Nlc3Npb24sIHNlbGYuX2hhbmRsZXIsIHNlbGYuX3N1YnNjcmlwdGlvbklkLCBzZWxmLl9wYXJhbXMsXG4gICAgICBzZWxmLl9uYW1lKTtcbiAgfSxcblxuICAvKipcbiAgICogQHN1bW1hcnkgQ2FsbCBpbnNpZGUgdGhlIHB1Ymxpc2ggZnVuY3Rpb24uICBTdG9wcyB0aGlzIGNsaWVudCdzIHN1YnNjcmlwdGlvbiwgdHJpZ2dlcmluZyBhIGNhbGwgb24gdGhlIGNsaWVudCB0byB0aGUgYG9uU3RvcGAgY2FsbGJhY2sgcGFzc2VkIHRvIFtgTWV0ZW9yLnN1YnNjcmliZWBdKCNtZXRlb3Jfc3Vic2NyaWJlKSwgaWYgYW55LiBJZiBgZXJyb3JgIGlzIG5vdCBhIFtgTWV0ZW9yLkVycm9yYF0oI21ldGVvcl9lcnJvciksIGl0IHdpbGwgYmUgW3Nhbml0aXplZF0oI21ldGVvcl9lcnJvcikuXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQHBhcmFtIHtFcnJvcn0gZXJyb3IgVGhlIGVycm9yIHRvIHBhc3MgdG8gdGhlIGNsaWVudC5cbiAgICogQGluc3RhbmNlXG4gICAqIEBtZW1iZXJPZiBTdWJzY3JpcHRpb25cbiAgICovXG4gIGVycm9yOiBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHNlbGYuX2lzRGVhY3RpdmF0ZWQoKSlcbiAgICAgIHJldHVybjtcbiAgICBzZWxmLl9zZXNzaW9uLl9zdG9wU3Vic2NyaXB0aW9uKHNlbGYuX3N1YnNjcmlwdGlvbklkLCBlcnJvcik7XG4gIH0sXG5cbiAgLy8gTm90ZSB0aGF0IHdoaWxlIG91ciBERFAgY2xpZW50IHdpbGwgbm90aWNlIHRoYXQgeW91J3ZlIGNhbGxlZCBzdG9wKCkgb24gdGhlXG4gIC8vIHNlcnZlciAoYW5kIGNsZWFuIHVwIGl0cyBfc3Vic2NyaXB0aW9ucyB0YWJsZSkgd2UgZG9uJ3QgYWN0dWFsbHkgcHJvdmlkZSBhXG4gIC8vIG1lY2hhbmlzbSBmb3IgYW4gYXBwIHRvIG5vdGljZSB0aGlzICh0aGUgc3Vic2NyaWJlIG9uRXJyb3IgY2FsbGJhY2sgb25seVxuICAvLyB0cmlnZ2VycyBpZiB0aGVyZSBpcyBhbiBlcnJvcikuXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IENhbGwgaW5zaWRlIHRoZSBwdWJsaXNoIGZ1bmN0aW9uLiAgU3RvcHMgdGhpcyBjbGllbnQncyBzdWJzY3JpcHRpb24gYW5kIGludm9rZXMgdGhlIGNsaWVudCdzIGBvblN0b3BgIGNhbGxiYWNrIHdpdGggbm8gZXJyb3IuXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQGluc3RhbmNlXG4gICAqIEBtZW1iZXJPZiBTdWJzY3JpcHRpb25cbiAgICovXG4gIHN0b3A6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHNlbGYuX2lzRGVhY3RpdmF0ZWQoKSlcbiAgICAgIHJldHVybjtcbiAgICBzZWxmLl9zZXNzaW9uLl9zdG9wU3Vic2NyaXB0aW9uKHNlbGYuX3N1YnNjcmlwdGlvbklkKTtcbiAgfSxcblxuICAvKipcbiAgICogQHN1bW1hcnkgQ2FsbCBpbnNpZGUgdGhlIHB1Ymxpc2ggZnVuY3Rpb24uICBSZWdpc3RlcnMgYSBjYWxsYmFjayBmdW5jdGlvbiB0byBydW4gd2hlbiB0aGUgc3Vic2NyaXB0aW9uIGlzIHN0b3BwZWQuXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQG1lbWJlck9mIFN1YnNjcmlwdGlvblxuICAgKiBAaW5zdGFuY2VcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICovXG4gIG9uU3RvcDogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGNhbGxiYWNrID0gTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChjYWxsYmFjaywgJ29uU3RvcCBjYWxsYmFjaycsIHNlbGYpO1xuICAgIGlmIChzZWxmLl9pc0RlYWN0aXZhdGVkKCkpXG4gICAgICBjYWxsYmFjaygpO1xuICAgIGVsc2VcbiAgICAgIHNlbGYuX3N0b3BDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gIH0sXG5cbiAgLy8gVGhpcyByZXR1cm5zIHRydWUgaWYgdGhlIHN1YiBoYXMgYmVlbiBkZWFjdGl2YXRlZCwgKk9SKiBpZiB0aGUgc2Vzc2lvbiB3YXNcbiAgLy8gZGVzdHJveWVkIGJ1dCB0aGUgZGVmZXJyZWQgY2FsbCB0byBfZGVhY3RpdmF0ZUFsbFN1YnNjcmlwdGlvbnMgaGFzbid0XG4gIC8vIGhhcHBlbmVkIHlldC5cbiAgX2lzRGVhY3RpdmF0ZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgcmV0dXJuIHNlbGYuX2RlYWN0aXZhdGVkIHx8IHNlbGYuX3Nlc3Npb24uaW5RdWV1ZSA9PT0gbnVsbDtcbiAgfSxcblxuICAvKipcbiAgICogQHN1bW1hcnkgQ2FsbCBpbnNpZGUgdGhlIHB1Ymxpc2ggZnVuY3Rpb24uICBJbmZvcm1zIHRoZSBzdWJzY3JpYmVyIHRoYXQgYSBkb2N1bWVudCBoYXMgYmVlbiBhZGRlZCB0byB0aGUgcmVjb3JkIHNldC5cbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgU3Vic2NyaXB0aW9uXG4gICAqIEBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gY29sbGVjdGlvbiBUaGUgbmFtZSBvZiB0aGUgY29sbGVjdGlvbiB0aGF0IGNvbnRhaW5zIHRoZSBuZXcgZG9jdW1lbnQuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBpZCBUaGUgbmV3IGRvY3VtZW50J3MgSUQuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBmaWVsZHMgVGhlIGZpZWxkcyBpbiB0aGUgbmV3IGRvY3VtZW50LiAgSWYgYF9pZGAgaXMgcHJlc2VudCBpdCBpcyBpZ25vcmVkLlxuICAgKi9cbiAgYWRkZWQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uTmFtZSwgaWQsIGZpZWxkcykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoc2VsZi5faXNEZWFjdGl2YXRlZCgpKVxuICAgICAgcmV0dXJuO1xuICAgIGlkID0gc2VsZi5faWRGaWx0ZXIuaWRTdHJpbmdpZnkoaWQpO1xuICAgIE1ldGVvci5fZW5zdXJlKHNlbGYuX2RvY3VtZW50cywgY29sbGVjdGlvbk5hbWUpW2lkXSA9IHRydWU7XG4gICAgc2VsZi5fc2Vzc2lvbi5hZGRlZChzZWxmLl9zdWJzY3JpcHRpb25IYW5kbGUsIGNvbGxlY3Rpb25OYW1lLCBpZCwgZmllbGRzKTtcbiAgfSxcblxuICAvKipcbiAgICogQHN1bW1hcnkgQ2FsbCBpbnNpZGUgdGhlIHB1Ymxpc2ggZnVuY3Rpb24uICBJbmZvcm1zIHRoZSBzdWJzY3JpYmVyIHRoYXQgYSBkb2N1bWVudCBpbiB0aGUgcmVjb3JkIHNldCBoYXMgYmVlbiBtb2RpZmllZC5cbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgU3Vic2NyaXB0aW9uXG4gICAqIEBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gY29sbGVjdGlvbiBUaGUgbmFtZSBvZiB0aGUgY29sbGVjdGlvbiB0aGF0IGNvbnRhaW5zIHRoZSBjaGFuZ2VkIGRvY3VtZW50LlxuICAgKiBAcGFyYW0ge1N0cmluZ30gaWQgVGhlIGNoYW5nZWQgZG9jdW1lbnQncyBJRC5cbiAgICogQHBhcmFtIHtPYmplY3R9IGZpZWxkcyBUaGUgZmllbGRzIGluIHRoZSBkb2N1bWVudCB0aGF0IGhhdmUgY2hhbmdlZCwgdG9nZXRoZXIgd2l0aCB0aGVpciBuZXcgdmFsdWVzLiAgSWYgYSBmaWVsZCBpcyBub3QgcHJlc2VudCBpbiBgZmllbGRzYCBpdCB3YXMgbGVmdCB1bmNoYW5nZWQ7IGlmIGl0IGlzIHByZXNlbnQgaW4gYGZpZWxkc2AgYW5kIGhhcyBhIHZhbHVlIG9mIGB1bmRlZmluZWRgIGl0IHdhcyByZW1vdmVkIGZyb20gdGhlIGRvY3VtZW50LiAgSWYgYF9pZGAgaXMgcHJlc2VudCBpdCBpcyBpZ25vcmVkLlxuICAgKi9cbiAgY2hhbmdlZDogZnVuY3Rpb24gKGNvbGxlY3Rpb25OYW1lLCBpZCwgZmllbGRzKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmIChzZWxmLl9pc0RlYWN0aXZhdGVkKCkpXG4gICAgICByZXR1cm47XG4gICAgaWQgPSBzZWxmLl9pZEZpbHRlci5pZFN0cmluZ2lmeShpZCk7XG4gICAgc2VsZi5fc2Vzc2lvbi5jaGFuZ2VkKHNlbGYuX3N1YnNjcmlwdGlvbkhhbmRsZSwgY29sbGVjdGlvbk5hbWUsIGlkLCBmaWVsZHMpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBDYWxsIGluc2lkZSB0aGUgcHVibGlzaCBmdW5jdGlvbi4gIEluZm9ybXMgdGhlIHN1YnNjcmliZXIgdGhhdCBhIGRvY3VtZW50IGhhcyBiZWVuIHJlbW92ZWQgZnJvbSB0aGUgcmVjb3JkIHNldC5cbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgU3Vic2NyaXB0aW9uXG4gICAqIEBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gY29sbGVjdGlvbiBUaGUgbmFtZSBvZiB0aGUgY29sbGVjdGlvbiB0aGF0IHRoZSBkb2N1bWVudCBoYXMgYmVlbiByZW1vdmVkIGZyb20uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBpZCBUaGUgSUQgb2YgdGhlIGRvY3VtZW50IHRoYXQgaGFzIGJlZW4gcmVtb3ZlZC5cbiAgICovXG4gIHJlbW92ZWQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uTmFtZSwgaWQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHNlbGYuX2lzRGVhY3RpdmF0ZWQoKSlcbiAgICAgIHJldHVybjtcbiAgICBpZCA9IHNlbGYuX2lkRmlsdGVyLmlkU3RyaW5naWZ5KGlkKTtcbiAgICAvLyBXZSBkb24ndCBib3RoZXIgdG8gZGVsZXRlIHNldHMgb2YgdGhpbmdzIGluIGEgY29sbGVjdGlvbiBpZiB0aGVcbiAgICAvLyBjb2xsZWN0aW9uIGlzIGVtcHR5LiAgSXQgY291bGQgYnJlYWsgX3JlbW92ZUFsbERvY3VtZW50cy5cbiAgICBkZWxldGUgc2VsZi5fZG9jdW1lbnRzW2NvbGxlY3Rpb25OYW1lXVtpZF07XG4gICAgc2VsZi5fc2Vzc2lvbi5yZW1vdmVkKHNlbGYuX3N1YnNjcmlwdGlvbkhhbmRsZSwgY29sbGVjdGlvbk5hbWUsIGlkKTtcbiAgfSxcblxuICAvKipcbiAgICogQHN1bW1hcnkgQ2FsbCBpbnNpZGUgdGhlIHB1Ymxpc2ggZnVuY3Rpb24uICBJbmZvcm1zIHRoZSBzdWJzY3JpYmVyIHRoYXQgYW4gaW5pdGlhbCwgY29tcGxldGUgc25hcHNob3Qgb2YgdGhlIHJlY29yZCBzZXQgaGFzIGJlZW4gc2VudC4gIFRoaXMgd2lsbCB0cmlnZ2VyIGEgY2FsbCBvbiB0aGUgY2xpZW50IHRvIHRoZSBgb25SZWFkeWAgY2FsbGJhY2sgcGFzc2VkIHRvICBbYE1ldGVvci5zdWJzY3JpYmVgXSgjbWV0ZW9yX3N1YnNjcmliZSksIGlmIGFueS5cbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgU3Vic2NyaXB0aW9uXG4gICAqIEBpbnN0YW5jZVxuICAgKi9cbiAgcmVhZHk6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHNlbGYuX2lzRGVhY3RpdmF0ZWQoKSlcbiAgICAgIHJldHVybjtcbiAgICBpZiAoIXNlbGYuX3N1YnNjcmlwdGlvbklkKVxuICAgICAgcmV0dXJuOyAgLy8gdW5uZWNlc3NhcnkgYnV0IGlnbm9yZWQgZm9yIHVuaXZlcnNhbCBzdWJcbiAgICBpZiAoIXNlbGYuX3JlYWR5KSB7XG4gICAgICBzZWxmLl9zZXNzaW9uLnNlbmRSZWFkeShbc2VsZi5fc3Vic2NyaXB0aW9uSWRdKTtcbiAgICAgIHNlbGYuX3JlYWR5ID0gdHJ1ZTtcbiAgICB9XG4gIH1cbn0pO1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyogU2VydmVyICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblNlcnZlciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICAvLyBUaGUgZGVmYXVsdCBoZWFydGJlYXQgaW50ZXJ2YWwgaXMgMzAgc2Vjb25kcyBvbiB0aGUgc2VydmVyIGFuZCAzNVxuICAvLyBzZWNvbmRzIG9uIHRoZSBjbGllbnQuICBTaW5jZSB0aGUgY2xpZW50IGRvZXNuJ3QgbmVlZCB0byBzZW5kIGFcbiAgLy8gcGluZyBhcyBsb25nIGFzIGl0IGlzIHJlY2VpdmluZyBwaW5ncywgdGhpcyBtZWFucyB0aGF0IHBpbmdzXG4gIC8vIG5vcm1hbGx5IGdvIGZyb20gdGhlIHNlcnZlciB0byB0aGUgY2xpZW50LlxuICAvL1xuICAvLyBOb3RlOiBUcm9wb3NwaGVyZSBkZXBlbmRzIG9uIHRoZSBhYmlsaXR5IHRvIG11dGF0ZVxuICAvLyBNZXRlb3Iuc2VydmVyLm9wdGlvbnMuaGVhcnRiZWF0VGltZW91dCEgVGhpcyBpcyBhIGhhY2ssIGJ1dCBpdCdzIGxpZmUuXG4gIHNlbGYub3B0aW9ucyA9IF8uZGVmYXVsdHMob3B0aW9ucyB8fCB7fSwge1xuICAgIGhlYXJ0YmVhdEludGVydmFsOiAxNTAwMCxcbiAgICBoZWFydGJlYXRUaW1lb3V0OiAxNTAwMCxcbiAgICAvLyBGb3IgdGVzdGluZywgYWxsb3cgcmVzcG9uZGluZyB0byBwaW5ncyB0byBiZSBkaXNhYmxlZC5cbiAgICByZXNwb25kVG9QaW5nczogdHJ1ZVxuICB9KTtcblxuICAvLyBNYXAgb2YgY2FsbGJhY2tzIHRvIGNhbGwgd2hlbiBhIG5ldyBjb25uZWN0aW9uIGNvbWVzIGluIHRvIHRoZVxuICAvLyBzZXJ2ZXIgYW5kIGNvbXBsZXRlcyBERFAgdmVyc2lvbiBuZWdvdGlhdGlvbi4gVXNlIGFuIG9iamVjdCBpbnN0ZWFkXG4gIC8vIG9mIGFuIGFycmF5IHNvIHdlIGNhbiBzYWZlbHkgcmVtb3ZlIG9uZSBmcm9tIHRoZSBsaXN0IHdoaWxlXG4gIC8vIGl0ZXJhdGluZyBvdmVyIGl0LlxuICBzZWxmLm9uQ29ubmVjdGlvbkhvb2sgPSBuZXcgSG9vayh7XG4gICAgZGVidWdQcmludEV4Y2VwdGlvbnM6IFwib25Db25uZWN0aW9uIGNhbGxiYWNrXCJcbiAgfSk7XG5cbiAgLy8gTWFwIG9mIGNhbGxiYWNrcyB0byBjYWxsIHdoZW4gYSBuZXcgbWVzc2FnZSBjb21lcyBpbi5cbiAgc2VsZi5vbk1lc3NhZ2VIb29rID0gbmV3IEhvb2soe1xuICAgIGRlYnVnUHJpbnRFeGNlcHRpb25zOiBcIm9uTWVzc2FnZSBjYWxsYmFja1wiXG4gIH0pO1xuXG4gIHNlbGYucHVibGlzaF9oYW5kbGVycyA9IHt9O1xuICBzZWxmLnVuaXZlcnNhbF9wdWJsaXNoX2hhbmRsZXJzID0gW107XG5cbiAgc2VsZi5tZXRob2RfaGFuZGxlcnMgPSB7fTtcblxuICBzZWxmLnNlc3Npb25zID0ge307IC8vIG1hcCBmcm9tIGlkIHRvIHNlc3Npb25cblxuICBzZWxmLnN0cmVhbV9zZXJ2ZXIgPSBuZXcgU3RyZWFtU2VydmVyO1xuXG4gIHNlbGYuc3RyZWFtX3NlcnZlci5yZWdpc3RlcihmdW5jdGlvbiAoc29ja2V0KSB7XG4gICAgLy8gc29ja2V0IGltcGxlbWVudHMgdGhlIFNvY2tKU0Nvbm5lY3Rpb24gaW50ZXJmYWNlXG4gICAgc29ja2V0Ll9tZXRlb3JTZXNzaW9uID0gbnVsbDtcblxuICAgIHZhciBzZW5kRXJyb3IgPSBmdW5jdGlvbiAocmVhc29uLCBvZmZlbmRpbmdNZXNzYWdlKSB7XG4gICAgICB2YXIgbXNnID0ge21zZzogJ2Vycm9yJywgcmVhc29uOiByZWFzb259O1xuICAgICAgaWYgKG9mZmVuZGluZ01lc3NhZ2UpXG4gICAgICAgIG1zZy5vZmZlbmRpbmdNZXNzYWdlID0gb2ZmZW5kaW5nTWVzc2FnZTtcbiAgICAgIHNvY2tldC5zZW5kKEREUENvbW1vbi5zdHJpbmdpZnlERFAobXNnKSk7XG4gICAgfTtcblxuICAgIHNvY2tldC5vbignZGF0YScsIGZ1bmN0aW9uIChyYXdfbXNnKSB7XG4gICAgICBpZiAoTWV0ZW9yLl9wcmludFJlY2VpdmVkRERQKSB7XG4gICAgICAgIE1ldGVvci5fZGVidWcoXCJSZWNlaXZlZCBERFBcIiwgcmF3X21zZyk7XG4gICAgICB9XG4gICAgICB0cnkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHZhciBtc2cgPSBERFBDb21tb24ucGFyc2VERFAocmF3X21zZyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIHNlbmRFcnJvcignUGFyc2UgZXJyb3InKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1zZyA9PT0gbnVsbCB8fCAhbXNnLm1zZykge1xuICAgICAgICAgIHNlbmRFcnJvcignQmFkIHJlcXVlc3QnLCBtc2cpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtc2cubXNnID09PSAnY29ubmVjdCcpIHtcbiAgICAgICAgICBpZiAoc29ja2V0Ll9tZXRlb3JTZXNzaW9uKSB7XG4gICAgICAgICAgICBzZW5kRXJyb3IoXCJBbHJlYWR5IGNvbm5lY3RlZFwiLCBtc2cpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBGaWJlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLl9oYW5kbGVDb25uZWN0KHNvY2tldCwgbXNnKTtcbiAgICAgICAgICB9KS5ydW4oKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXNvY2tldC5fbWV0ZW9yU2Vzc2lvbikge1xuICAgICAgICAgIHNlbmRFcnJvcignTXVzdCBjb25uZWN0IGZpcnN0JywgbXNnKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc29ja2V0Ll9tZXRlb3JTZXNzaW9uLnByb2Nlc3NNZXNzYWdlKG1zZyk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIFhYWCBwcmludCBzdGFjayBuaWNlbHlcbiAgICAgICAgTWV0ZW9yLl9kZWJ1ZyhcIkludGVybmFsIGV4Y2VwdGlvbiB3aGlsZSBwcm9jZXNzaW5nIG1lc3NhZ2VcIiwgbXNnLCBlKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHNvY2tldC5vbignY2xvc2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoc29ja2V0Ll9tZXRlb3JTZXNzaW9uKSB7XG4gICAgICAgIEZpYmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBzb2NrZXQuX21ldGVvclNlc3Npb24uY2xvc2UoKTtcbiAgICAgICAgfSkucnVuKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufTtcblxuXy5leHRlbmQoU2VydmVyLnByb3RvdHlwZSwge1xuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBSZWdpc3RlciBhIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIGEgbmV3IEREUCBjb25uZWN0aW9uIGlzIG1hZGUgdG8gdGhlIHNlcnZlci5cbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIGEgbmV3IEREUCBjb25uZWN0aW9uIGlzIGVzdGFibGlzaGVkLlxuICAgKiBAbWVtYmVyT2YgTWV0ZW9yXG4gICAqIEBpbXBvcnRGcm9tUGFja2FnZSBtZXRlb3JcbiAgICovXG4gIG9uQ29ubmVjdGlvbjogZnVuY3Rpb24gKGZuKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHJldHVybiBzZWxmLm9uQ29ubmVjdGlvbkhvb2sucmVnaXN0ZXIoZm4pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBSZWdpc3RlciBhIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIGEgbmV3IEREUCBtZXNzYWdlIGlzIHJlY2VpdmVkLlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiB0byBjYWxsIHdoZW4gYSBuZXcgRERQIG1lc3NhZ2UgaXMgcmVjZWl2ZWQuXG4gICAqIEBtZW1iZXJPZiBNZXRlb3JcbiAgICogQGltcG9ydEZyb21QYWNrYWdlIG1ldGVvclxuICAgKi9cbiAgb25NZXNzYWdlOiBmdW5jdGlvbiAoZm4pIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgcmV0dXJuIHNlbGYub25NZXNzYWdlSG9vay5yZWdpc3Rlcihmbik7XG4gIH0sXG5cbiAgX2hhbmRsZUNvbm5lY3Q6IGZ1bmN0aW9uIChzb2NrZXQsIG1zZykge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIC8vIFRoZSBjb25uZWN0IG1lc3NhZ2UgbXVzdCBzcGVjaWZ5IGEgdmVyc2lvbiBhbmQgYW4gYXJyYXkgb2Ygc3VwcG9ydGVkXG4gICAgLy8gdmVyc2lvbnMsIGFuZCBpdCBtdXN0IGNsYWltIHRvIHN1cHBvcnQgd2hhdCBpdCBpcyBwcm9wb3NpbmcuXG4gICAgaWYgKCEodHlwZW9mIChtc2cudmVyc2lvbikgPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgXy5pc0FycmF5KG1zZy5zdXBwb3J0KSAmJlxuICAgICAgICAgIF8uYWxsKG1zZy5zdXBwb3J0LCBfLmlzU3RyaW5nKSAmJlxuICAgICAgICAgIF8uY29udGFpbnMobXNnLnN1cHBvcnQsIG1zZy52ZXJzaW9uKSkpIHtcbiAgICAgIHNvY2tldC5zZW5kKEREUENvbW1vbi5zdHJpbmdpZnlERFAoe21zZzogJ2ZhaWxlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246IEREUENvbW1vbi5TVVBQT1JURURfRERQX1ZFUlNJT05TWzBdfSkpO1xuICAgICAgc29ja2V0LmNsb3NlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSW4gdGhlIGZ1dHVyZSwgaGFuZGxlIHNlc3Npb24gcmVzdW1wdGlvbjogc29tZXRoaW5nIGxpa2U6XG4gICAgLy8gIHNvY2tldC5fbWV0ZW9yU2Vzc2lvbiA9IHNlbGYuc2Vzc2lvbnNbbXNnLnNlc3Npb25dXG4gICAgdmFyIHZlcnNpb24gPSBjYWxjdWxhdGVWZXJzaW9uKG1zZy5zdXBwb3J0LCBERFBDb21tb24uU1VQUE9SVEVEX0REUF9WRVJTSU9OUyk7XG5cbiAgICBpZiAobXNnLnZlcnNpb24gIT09IHZlcnNpb24pIHtcbiAgICAgIC8vIFRoZSBiZXN0IHZlcnNpb24gdG8gdXNlIChhY2NvcmRpbmcgdG8gdGhlIGNsaWVudCdzIHN0YXRlZCBwcmVmZXJlbmNlcylcbiAgICAgIC8vIGlzIG5vdCB0aGUgb25lIHRoZSBjbGllbnQgaXMgdHJ5aW5nIHRvIHVzZS4gSW5mb3JtIHRoZW0gYWJvdXQgdGhlIGJlc3RcbiAgICAgIC8vIHZlcnNpb24gdG8gdXNlLlxuICAgICAgc29ja2V0LnNlbmQoRERQQ29tbW9uLnN0cmluZ2lmeUREUCh7bXNnOiAnZmFpbGVkJywgdmVyc2lvbjogdmVyc2lvbn0pKTtcbiAgICAgIHNvY2tldC5jbG9zZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFlheSwgdmVyc2lvbiBtYXRjaGVzISBDcmVhdGUgYSBuZXcgc2Vzc2lvbi5cbiAgICAvLyBOb3RlOiBUcm9wb3NwaGVyZSBkZXBlbmRzIG9uIHRoZSBhYmlsaXR5IHRvIG11dGF0ZVxuICAgIC8vIE1ldGVvci5zZXJ2ZXIub3B0aW9ucy5oZWFydGJlYXRUaW1lb3V0ISBUaGlzIGlzIGEgaGFjaywgYnV0IGl0J3MgbGlmZS5cbiAgICBzb2NrZXQuX21ldGVvclNlc3Npb24gPSBuZXcgU2Vzc2lvbihzZWxmLCB2ZXJzaW9uLCBzb2NrZXQsIHNlbGYub3B0aW9ucyk7XG4gICAgc2VsZi5zZXNzaW9uc1tzb2NrZXQuX21ldGVvclNlc3Npb24uaWRdID0gc29ja2V0Ll9tZXRlb3JTZXNzaW9uO1xuICAgIHNlbGYub25Db25uZWN0aW9uSG9vay5lYWNoKGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgaWYgKHNvY2tldC5fbWV0ZW9yU2Vzc2lvbilcbiAgICAgICAgY2FsbGJhY2soc29ja2V0Ll9tZXRlb3JTZXNzaW9uLmNvbm5lY3Rpb25IYW5kbGUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gIH0sXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhIHB1Ymxpc2ggaGFuZGxlciBmdW5jdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUge1N0cmluZ30gaWRlbnRpZmllciBmb3IgcXVlcnlcbiAgICogQHBhcmFtIGhhbmRsZXIge0Z1bmN0aW9ufSBwdWJsaXNoIGhhbmRsZXJcbiAgICogQHBhcmFtIG9wdGlvbnMge09iamVjdH1cbiAgICpcbiAgICogU2VydmVyIHdpbGwgY2FsbCBoYW5kbGVyIGZ1bmN0aW9uIG9uIGVhY2ggbmV3IHN1YnNjcmlwdGlvbixcbiAgICogZWl0aGVyIHdoZW4gcmVjZWl2aW5nIEREUCBzdWIgbWVzc2FnZSBmb3IgYSBuYW1lZCBzdWJzY3JpcHRpb24sIG9yIG9uXG4gICAqIEREUCBjb25uZWN0IGZvciBhIHVuaXZlcnNhbCBzdWJzY3JpcHRpb24uXG4gICAqXG4gICAqIElmIG5hbWUgaXMgbnVsbCwgdGhpcyB3aWxsIGJlIGEgc3Vic2NyaXB0aW9uIHRoYXQgaXNcbiAgICogYXV0b21hdGljYWxseSBlc3RhYmxpc2hlZCBhbmQgcGVybWFuZW50bHkgb24gZm9yIGFsbCBjb25uZWN0ZWRcbiAgICogY2xpZW50LCBpbnN0ZWFkIG9mIGEgc3Vic2NyaXB0aW9uIHRoYXQgY2FuIGJlIHR1cm5lZCBvbiBhbmQgb2ZmXG4gICAqIHdpdGggc3Vic2NyaWJlKCkuXG4gICAqXG4gICAqIG9wdGlvbnMgdG8gY29udGFpbjpcbiAgICogIC0gKG1vc3RseSBpbnRlcm5hbCkgaXNfYXV0bzogdHJ1ZSBpZiBnZW5lcmF0ZWQgYXV0b21hdGljYWxseVxuICAgKiAgICBmcm9tIGFuIGF1dG9wdWJsaXNoIGhvb2suIHRoaXMgaXMgZm9yIGNvc21ldGljIHB1cnBvc2VzIG9ubHlcbiAgICogICAgKGl0IGxldHMgdXMgZGV0ZXJtaW5lIHdoZXRoZXIgdG8gcHJpbnQgYSB3YXJuaW5nIHN1Z2dlc3RpbmdcbiAgICogICAgdGhhdCB5b3UgdHVybiBvZmYgYXV0b3B1Ymxpc2guKVxuICAgKi9cblxuICAvKipcbiAgICogQHN1bW1hcnkgUHVibGlzaCBhIHJlY29yZCBzZXQuXG4gICAqIEBtZW1iZXJPZiBNZXRlb3JcbiAgICogQGltcG9ydEZyb21QYWNrYWdlIG1ldGVvclxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gbmFtZSBJZiBTdHJpbmcsIG5hbWUgb2YgdGhlIHJlY29yZCBzZXQuICBJZiBPYmplY3QsIHB1YmxpY2F0aW9ucyBEaWN0aW9uYXJ5IG9mIHB1Ymxpc2ggZnVuY3Rpb25zIGJ5IG5hbWUuICBJZiBgbnVsbGAsIHRoZSBzZXQgaGFzIG5vIG5hbWUsIGFuZCB0aGUgcmVjb3JkIHNldCBpcyBhdXRvbWF0aWNhbGx5IHNlbnQgdG8gYWxsIGNvbm5lY3RlZCBjbGllbnRzLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIEZ1bmN0aW9uIGNhbGxlZCBvbiB0aGUgc2VydmVyIGVhY2ggdGltZSBhIGNsaWVudCBzdWJzY3JpYmVzLiAgSW5zaWRlIHRoZSBmdW5jdGlvbiwgYHRoaXNgIGlzIHRoZSBwdWJsaXNoIGhhbmRsZXIgb2JqZWN0LCBkZXNjcmliZWQgYmVsb3cuICBJZiB0aGUgY2xpZW50IHBhc3NlZCBhcmd1bWVudHMgdG8gYHN1YnNjcmliZWAsIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQgd2l0aCB0aGUgc2FtZSBhcmd1bWVudHMuXG4gICAqL1xuICBwdWJsaXNoOiBmdW5jdGlvbiAobmFtZSwgaGFuZGxlciwgb3B0aW9ucykge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGlmICghIF8uaXNPYmplY3QobmFtZSkpIHtcbiAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICBpZiAobmFtZSAmJiBuYW1lIGluIHNlbGYucHVibGlzaF9oYW5kbGVycykge1xuICAgICAgICBNZXRlb3IuX2RlYnVnKFwiSWdub3JpbmcgZHVwbGljYXRlIHB1Ymxpc2ggbmFtZWQgJ1wiICsgbmFtZSArIFwiJ1wiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoUGFja2FnZS5hdXRvcHVibGlzaCAmJiAhb3B0aW9ucy5pc19hdXRvKSB7XG4gICAgICAgIC8vIFRoZXkgaGF2ZSBhdXRvcHVibGlzaCBvbiwgeWV0IHRoZXkncmUgdHJ5aW5nIHRvIG1hbnVhbGx5XG4gICAgICAgIC8vIHBpY2tpbmcgc3R1ZmYgdG8gcHVibGlzaC4gVGhleSBwcm9iYWJseSBzaG91bGQgdHVybiBvZmZcbiAgICAgICAgLy8gYXV0b3B1Ymxpc2guIChUaGlzIGNoZWNrIGlzbid0IHBlcmZlY3QgLS0gaWYgeW91IGNyZWF0ZSBhXG4gICAgICAgIC8vIHB1Ymxpc2ggYmVmb3JlIHlvdSB0dXJuIG9uIGF1dG9wdWJsaXNoLCBpdCB3b24ndCBjYXRjaFxuICAgICAgICAvLyBpdC4gQnV0IHRoaXMgd2lsbCBkZWZpbml0ZWx5IGhhbmRsZSB0aGUgc2ltcGxlIGNhc2Ugd2hlcmVcbiAgICAgICAgLy8geW91J3ZlIGFkZGVkIHRoZSBhdXRvcHVibGlzaCBwYWNrYWdlIHRvIHlvdXIgYXBwLCBhbmQgYXJlXG4gICAgICAgIC8vIGNhbGxpbmcgcHVibGlzaCBmcm9tIHlvdXIgYXBwIGNvZGUuKVxuICAgICAgICBpZiAoIXNlbGYud2FybmVkX2Fib3V0X2F1dG9wdWJsaXNoKSB7XG4gICAgICAgICAgc2VsZi53YXJuZWRfYWJvdXRfYXV0b3B1Ymxpc2ggPSB0cnVlO1xuICAgICAgICAgIE1ldGVvci5fZGVidWcoXG4gICAgXCIqKiBZb3UndmUgc2V0IHVwIHNvbWUgZGF0YSBzdWJzY3JpcHRpb25zIHdpdGggTWV0ZW9yLnB1Ymxpc2goKSwgYnV0XFxuXCIgK1xuICAgIFwiKiogeW91IHN0aWxsIGhhdmUgYXV0b3B1Ymxpc2ggdHVybmVkIG9uLiBCZWNhdXNlIGF1dG9wdWJsaXNoIGlzIHN0aWxsXFxuXCIgK1xuICAgIFwiKiogb24sIHlvdXIgTWV0ZW9yLnB1Ymxpc2goKSBjYWxscyB3b24ndCBoYXZlIG11Y2ggZWZmZWN0LiBBbGwgZGF0YVxcblwiICtcbiAgICBcIioqIHdpbGwgc3RpbGwgYmUgc2VudCB0byBhbGwgY2xpZW50cy5cXG5cIiArXG4gICAgXCIqKlxcblwiICtcbiAgICBcIioqIFR1cm4gb2ZmIGF1dG9wdWJsaXNoIGJ5IHJlbW92aW5nIHRoZSBhdXRvcHVibGlzaCBwYWNrYWdlOlxcblwiICtcbiAgICBcIioqXFxuXCIgK1xuICAgIFwiKiogICAkIG1ldGVvciByZW1vdmUgYXV0b3B1Ymxpc2hcXG5cIiArXG4gICAgXCIqKlxcblwiICtcbiAgICBcIioqIC4uIGFuZCBtYWtlIHN1cmUgeW91IGhhdmUgTWV0ZW9yLnB1Ymxpc2goKSBhbmQgTWV0ZW9yLnN1YnNjcmliZSgpIGNhbGxzXFxuXCIgK1xuICAgIFwiKiogZm9yIGVhY2ggY29sbGVjdGlvbiB0aGF0IHlvdSB3YW50IGNsaWVudHMgdG8gc2VlLlxcblwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAobmFtZSlcbiAgICAgICAgc2VsZi5wdWJsaXNoX2hhbmRsZXJzW25hbWVdID0gaGFuZGxlcjtcbiAgICAgIGVsc2Uge1xuICAgICAgICBzZWxmLnVuaXZlcnNhbF9wdWJsaXNoX2hhbmRsZXJzLnB1c2goaGFuZGxlcik7XG4gICAgICAgIC8vIFNwaW4gdXAgdGhlIG5ldyBwdWJsaXNoZXIgb24gYW55IGV4aXN0aW5nIHNlc3Npb24gdG9vLiBSdW4gZWFjaFxuICAgICAgICAvLyBzZXNzaW9uJ3Mgc3Vic2NyaXB0aW9uIGluIGEgbmV3IEZpYmVyLCBzbyB0aGF0IHRoZXJlJ3Mgbm8gY2hhbmdlIGZvclxuICAgICAgICAvLyBzZWxmLnNlc3Npb25zIHRvIGNoYW5nZSB3aGlsZSB3ZSdyZSBydW5uaW5nIHRoaXMgbG9vcC5cbiAgICAgICAgXy5lYWNoKHNlbGYuc2Vzc2lvbnMsIGZ1bmN0aW9uIChzZXNzaW9uKSB7XG4gICAgICAgICAgaWYgKCFzZXNzaW9uLl9kb250U3RhcnROZXdVbml2ZXJzYWxTdWJzKSB7XG4gICAgICAgICAgICBGaWJlcihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgc2Vzc2lvbi5fc3RhcnRTdWJzY3JpcHRpb24oaGFuZGxlcik7XG4gICAgICAgICAgICB9KS5ydW4oKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNle1xuICAgICAgXy5lYWNoKG5hbWUsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgc2VsZi5wdWJsaXNoKGtleSwgdmFsdWUsIHt9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICBfcmVtb3ZlU2Vzc2lvbjogZnVuY3Rpb24gKHNlc3Npb24pIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHNlbGYuc2Vzc2lvbnNbc2Vzc2lvbi5pZF0pIHtcbiAgICAgIGRlbGV0ZSBzZWxmLnNlc3Npb25zW3Nlc3Npb24uaWRdO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogQHN1bW1hcnkgRGVmaW5lcyBmdW5jdGlvbnMgdGhhdCBjYW4gYmUgaW52b2tlZCBvdmVyIHRoZSBuZXR3b3JrIGJ5IGNsaWVudHMuXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAcGFyYW0ge09iamVjdH0gbWV0aG9kcyBEaWN0aW9uYXJ5IHdob3NlIGtleXMgYXJlIG1ldGhvZCBuYW1lcyBhbmQgdmFsdWVzIGFyZSBmdW5jdGlvbnMuXG4gICAqIEBtZW1iZXJPZiBNZXRlb3JcbiAgICogQGltcG9ydEZyb21QYWNrYWdlIG1ldGVvclxuICAgKi9cbiAgbWV0aG9kczogZnVuY3Rpb24gKG1ldGhvZHMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgXy5lYWNoKG1ldGhvZHMsIGZ1bmN0aW9uIChmdW5jLCBuYW1lKSB7XG4gICAgICBpZiAodHlwZW9mIGZ1bmMgIT09ICdmdW5jdGlvbicpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1ldGhvZCAnXCIgKyBuYW1lICsgXCInIG11c3QgYmUgYSBmdW5jdGlvblwiKTtcbiAgICAgIGlmIChzZWxmLm1ldGhvZF9oYW5kbGVyc1tuYW1lXSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQSBtZXRob2QgbmFtZWQgJ1wiICsgbmFtZSArIFwiJyBpcyBhbHJlYWR5IGRlZmluZWRcIik7XG4gICAgICBzZWxmLm1ldGhvZF9oYW5kbGVyc1tuYW1lXSA9IGZ1bmM7XG4gICAgfSk7XG4gIH0sXG5cbiAgY2FsbDogZnVuY3Rpb24gKG5hbWUsIC4uLmFyZ3MpIHtcbiAgICBpZiAoYXJncy5sZW5ndGggJiYgdHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAvLyBJZiBpdCdzIGEgZnVuY3Rpb24sIHRoZSBsYXN0IGFyZ3VtZW50IGlzIHRoZSByZXN1bHQgY2FsbGJhY2ssIG5vdFxuICAgICAgLy8gYSBwYXJhbWV0ZXIgdG8gdGhlIHJlbW90ZSBtZXRob2QuXG4gICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzLnBvcCgpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmFwcGx5KG5hbWUsIGFyZ3MsIGNhbGxiYWNrKTtcbiAgfSxcblxuICAvLyBBIHZlcnNpb24gb2YgdGhlIGNhbGwgbWV0aG9kIHRoYXQgYWx3YXlzIHJldHVybnMgYSBQcm9taXNlLlxuICBjYWxsQXN5bmM6IGZ1bmN0aW9uIChuYW1lLCAuLi5hcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuYXBwbHlBc3luYyhuYW1lLCBhcmdzKTtcbiAgfSxcblxuICBhcHBseTogZnVuY3Rpb24gKG5hbWUsIGFyZ3MsIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgLy8gV2Ugd2VyZSBwYXNzZWQgMyBhcmd1bWVudHMuIFRoZXkgbWF5IGJlIGVpdGhlciAobmFtZSwgYXJncywgb3B0aW9ucylcbiAgICAvLyBvciAobmFtZSwgYXJncywgY2FsbGJhY2spXG4gICAgaWYgKCEgY2FsbGJhY2sgJiYgdHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNhbGxiYWNrID0gb3B0aW9ucztcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgfVxuXG4gICAgY29uc3QgcHJvbWlzZSA9IHRoaXMuYXBwbHlBc3luYyhuYW1lLCBhcmdzLCBvcHRpb25zKTtcblxuICAgIC8vIFJldHVybiB0aGUgcmVzdWx0IGluIHdoaWNoZXZlciB3YXkgdGhlIGNhbGxlciBhc2tlZCBmb3IgaXQuIE5vdGUgdGhhdCB3ZVxuICAgIC8vIGRvIE5PVCBibG9jayBvbiB0aGUgd3JpdGUgZmVuY2UgaW4gYW4gYW5hbG9nb3VzIHdheSB0byBob3cgdGhlIGNsaWVudFxuICAgIC8vIGJsb2NrcyBvbiB0aGUgcmVsZXZhbnQgZGF0YSBiZWluZyB2aXNpYmxlLCBzbyB5b3UgYXJlIE5PVCBndWFyYW50ZWVkIHRoYXRcbiAgICAvLyBjdXJzb3Igb2JzZXJ2ZSBjYWxsYmFja3MgaGF2ZSBmaXJlZCB3aGVuIHlvdXIgY2FsbGJhY2sgaXMgaW52b2tlZC4gKFdlXG4gICAgLy8gY2FuIGNoYW5nZSB0aGlzIGlmIHRoZXJlJ3MgYSByZWFsIHVzZSBjYXNlLilcbiAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgIHByb21pc2UudGhlbihcbiAgICAgICAgcmVzdWx0ID0+IGNhbGxiYWNrKHVuZGVmaW5lZCwgcmVzdWx0KSxcbiAgICAgICAgZXhjZXB0aW9uID0+IGNhbGxiYWNrKGV4Y2VwdGlvbilcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBwcm9taXNlLmF3YWl0KCk7XG4gICAgfVxuICB9LFxuXG4gIC8vIEBwYXJhbSBvcHRpb25zIHtPcHRpb25hbCBPYmplY3R9XG4gIGFwcGx5QXN5bmM6IGZ1bmN0aW9uIChuYW1lLCBhcmdzLCBvcHRpb25zKSB7XG4gICAgLy8gUnVuIHRoZSBoYW5kbGVyXG4gICAgdmFyIGhhbmRsZXIgPSB0aGlzLm1ldGhvZF9oYW5kbGVyc1tuYW1lXTtcbiAgICBpZiAoISBoYW5kbGVyKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXG4gICAgICAgIG5ldyBNZXRlb3IuRXJyb3IoNDA0LCBgTWV0aG9kICcke25hbWV9JyBub3QgZm91bmRgKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGlzIGlzIGEgbWV0aG9kIGNhbGwgZnJvbSB3aXRoaW4gYW5vdGhlciBtZXRob2Qgb3IgcHVibGlzaCBmdW5jdGlvbixcbiAgICAvLyBnZXQgdGhlIHVzZXIgc3RhdGUgZnJvbSB0aGUgb3V0ZXIgbWV0aG9kIG9yIHB1Ymxpc2ggZnVuY3Rpb24sIG90aGVyd2lzZVxuICAgIC8vIGRvbid0IGFsbG93IHNldFVzZXJJZCB0byBiZSBjYWxsZWRcbiAgICB2YXIgdXNlcklkID0gbnVsbDtcbiAgICB2YXIgc2V0VXNlcklkID0gZnVuY3Rpb24oKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBjYWxsIHNldFVzZXJJZCBvbiBhIHNlcnZlciBpbml0aWF0ZWQgbWV0aG9kIGNhbGxcIik7XG4gICAgfTtcbiAgICB2YXIgY29ubmVjdGlvbiA9IG51bGw7XG4gICAgdmFyIGN1cnJlbnRNZXRob2RJbnZvY2F0aW9uID0gRERQLl9DdXJyZW50TWV0aG9kSW52b2NhdGlvbi5nZXQoKTtcbiAgICB2YXIgY3VycmVudFB1YmxpY2F0aW9uSW52b2NhdGlvbiA9IEREUC5fQ3VycmVudFB1YmxpY2F0aW9uSW52b2NhdGlvbi5nZXQoKTtcbiAgICB2YXIgcmFuZG9tU2VlZCA9IG51bGw7XG4gICAgaWYgKGN1cnJlbnRNZXRob2RJbnZvY2F0aW9uKSB7XG4gICAgICB1c2VySWQgPSBjdXJyZW50TWV0aG9kSW52b2NhdGlvbi51c2VySWQ7XG4gICAgICBzZXRVc2VySWQgPSBmdW5jdGlvbih1c2VySWQpIHtcbiAgICAgICAgY3VycmVudE1ldGhvZEludm9jYXRpb24uc2V0VXNlcklkKHVzZXJJZCk7XG4gICAgICB9O1xuICAgICAgY29ubmVjdGlvbiA9IGN1cnJlbnRNZXRob2RJbnZvY2F0aW9uLmNvbm5lY3Rpb247XG4gICAgICByYW5kb21TZWVkID0gRERQQ29tbW9uLm1ha2VScGNTZWVkKGN1cnJlbnRNZXRob2RJbnZvY2F0aW9uLCBuYW1lKTtcbiAgICB9IGVsc2UgaWYgKGN1cnJlbnRQdWJsaWNhdGlvbkludm9jYXRpb24pIHtcbiAgICAgIHVzZXJJZCA9IGN1cnJlbnRQdWJsaWNhdGlvbkludm9jYXRpb24udXNlcklkO1xuICAgICAgc2V0VXNlcklkID0gZnVuY3Rpb24odXNlcklkKSB7XG4gICAgICAgIGN1cnJlbnRQdWJsaWNhdGlvbkludm9jYXRpb24uX3Nlc3Npb24uX3NldFVzZXJJZCh1c2VySWQpO1xuICAgICAgfTtcbiAgICAgIGNvbm5lY3Rpb24gPSBjdXJyZW50UHVibGljYXRpb25JbnZvY2F0aW9uLmNvbm5lY3Rpb247XG4gICAgfVxuXG4gICAgdmFyIGludm9jYXRpb24gPSBuZXcgRERQQ29tbW9uLk1ldGhvZEludm9jYXRpb24oe1xuICAgICAgaXNTaW11bGF0aW9uOiBmYWxzZSxcbiAgICAgIHVzZXJJZCxcbiAgICAgIHNldFVzZXJJZCxcbiAgICAgIGNvbm5lY3Rpb24sXG4gICAgICByYW5kb21TZWVkXG4gICAgfSk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiByZXNvbHZlKFxuICAgICAgRERQLl9DdXJyZW50TWV0aG9kSW52b2NhdGlvbi53aXRoVmFsdWUoXG4gICAgICAgIGludm9jYXRpb24sXG4gICAgICAgICgpID0+IG1heWJlQXVkaXRBcmd1bWVudENoZWNrcyhcbiAgICAgICAgICBoYW5kbGVyLCBpbnZvY2F0aW9uLCBFSlNPTi5jbG9uZShhcmdzKSxcbiAgICAgICAgICBcImludGVybmFsIGNhbGwgdG8gJ1wiICsgbmFtZSArIFwiJ1wiXG4gICAgICAgIClcbiAgICAgIClcbiAgICApKS50aGVuKEVKU09OLmNsb25lKTtcbiAgfSxcblxuICBfdXJsRm9yU2Vzc2lvbjogZnVuY3Rpb24gKHNlc3Npb25JZCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgc2Vzc2lvbiA9IHNlbGYuc2Vzc2lvbnNbc2Vzc2lvbklkXTtcbiAgICBpZiAoc2Vzc2lvbilcbiAgICAgIHJldHVybiBzZXNzaW9uLl9zb2NrZXRVcmw7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIG51bGw7XG4gIH1cbn0pO1xuXG52YXIgY2FsY3VsYXRlVmVyc2lvbiA9IGZ1bmN0aW9uIChjbGllbnRTdXBwb3J0ZWRWZXJzaW9ucyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZlclN1cHBvcnRlZFZlcnNpb25zKSB7XG4gIHZhciBjb3JyZWN0VmVyc2lvbiA9IF8uZmluZChjbGllbnRTdXBwb3J0ZWRWZXJzaW9ucywgZnVuY3Rpb24gKHZlcnNpb24pIHtcbiAgICByZXR1cm4gXy5jb250YWlucyhzZXJ2ZXJTdXBwb3J0ZWRWZXJzaW9ucywgdmVyc2lvbik7XG4gIH0pO1xuICBpZiAoIWNvcnJlY3RWZXJzaW9uKSB7XG4gICAgY29ycmVjdFZlcnNpb24gPSBzZXJ2ZXJTdXBwb3J0ZWRWZXJzaW9uc1swXTtcbiAgfVxuICByZXR1cm4gY29ycmVjdFZlcnNpb247XG59O1xuXG5ERFBTZXJ2ZXIuX2NhbGN1bGF0ZVZlcnNpb24gPSBjYWxjdWxhdGVWZXJzaW9uO1xuXG5cbi8vIFwiYmxpbmRcIiBleGNlcHRpb25zIG90aGVyIHRoYW4gdGhvc2UgdGhhdCB3ZXJlIGRlbGliZXJhdGVseSB0aHJvd24gdG8gc2lnbmFsXG4vLyBlcnJvcnMgdG8gdGhlIGNsaWVudFxudmFyIHdyYXBJbnRlcm5hbEV4Y2VwdGlvbiA9IGZ1bmN0aW9uIChleGNlcHRpb24sIGNvbnRleHQpIHtcbiAgaWYgKCFleGNlcHRpb24pIHJldHVybiBleGNlcHRpb247XG5cbiAgLy8gVG8gYWxsb3cgcGFja2FnZXMgdG8gdGhyb3cgZXJyb3JzIGludGVuZGVkIGZvciB0aGUgY2xpZW50IGJ1dCBub3QgaGF2ZSB0b1xuICAvLyBkZXBlbmQgb24gdGhlIE1ldGVvci5FcnJvciBjbGFzcywgYGlzQ2xpZW50U2FmZWAgY2FuIGJlIHNldCB0byB0cnVlIG9uIGFueVxuICAvLyBlcnJvciBiZWZvcmUgaXQgaXMgdGhyb3duLlxuICBpZiAoZXhjZXB0aW9uLmlzQ2xpZW50U2FmZSkge1xuICAgIGlmICghKGV4Y2VwdGlvbiBpbnN0YW5jZW9mIE1ldGVvci5FcnJvcikpIHtcbiAgICAgIGNvbnN0IG9yaWdpbmFsTWVzc2FnZSA9IGV4Y2VwdGlvbi5tZXNzYWdlO1xuICAgICAgZXhjZXB0aW9uID0gbmV3IE1ldGVvci5FcnJvcihleGNlcHRpb24uZXJyb3IsIGV4Y2VwdGlvbi5yZWFzb24sIGV4Y2VwdGlvbi5kZXRhaWxzKTtcbiAgICAgIGV4Y2VwdGlvbi5tZXNzYWdlID0gb3JpZ2luYWxNZXNzYWdlO1xuICAgIH1cbiAgICByZXR1cm4gZXhjZXB0aW9uO1xuICB9XG5cbiAgLy8gVGVzdHMgY2FuIHNldCB0aGUgJ19leHBlY3RlZEJ5VGVzdCcgZmxhZyBvbiBhbiBleGNlcHRpb24gc28gaXQgd29uJ3QgZ28gdG9cbiAgLy8gdGhlIHNlcnZlciBsb2cuXG4gIGlmICghZXhjZXB0aW9uLl9leHBlY3RlZEJ5VGVzdCkge1xuICAgIE1ldGVvci5fZGVidWcoXCJFeGNlcHRpb24gXCIgKyBjb250ZXh0LCBleGNlcHRpb24pO1xuICAgIGlmIChleGNlcHRpb24uc2FuaXRpemVkRXJyb3IpIHtcbiAgICAgIE1ldGVvci5fZGVidWcoXCJTYW5pdGl6ZWQgYW5kIHJlcG9ydGVkIHRvIHRoZSBjbGllbnQgYXM6XCIsIGV4Y2VwdGlvbi5zYW5pdGl6ZWRFcnJvcik7XG4gICAgICBNZXRlb3IuX2RlYnVnKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gRGlkIHRoZSBlcnJvciBjb250YWluIG1vcmUgZGV0YWlscyB0aGF0IGNvdWxkIGhhdmUgYmVlbiB1c2VmdWwgaWYgY2F1Z2h0IGluXG4gIC8vIHNlcnZlciBjb2RlIChvciBpZiB0aHJvd24gZnJvbSBub24tY2xpZW50LW9yaWdpbmF0ZWQgY29kZSksIGJ1dCBhbHNvXG4gIC8vIHByb3ZpZGVkIGEgXCJzYW5pdGl6ZWRcIiB2ZXJzaW9uIHdpdGggbW9yZSBjb250ZXh0IHRoYW4gNTAwIEludGVybmFsIHNlcnZlclxuICAvLyBlcnJvcj8gVXNlIHRoYXQuXG4gIGlmIChleGNlcHRpb24uc2FuaXRpemVkRXJyb3IpIHtcbiAgICBpZiAoZXhjZXB0aW9uLnNhbml0aXplZEVycm9yLmlzQ2xpZW50U2FmZSlcbiAgICAgIHJldHVybiBleGNlcHRpb24uc2FuaXRpemVkRXJyb3I7XG4gICAgTWV0ZW9yLl9kZWJ1ZyhcIkV4Y2VwdGlvbiBcIiArIGNvbnRleHQgKyBcIiBwcm92aWRlcyBhIHNhbml0aXplZEVycm9yIHRoYXQgXCIgK1xuICAgICAgICAgICAgICAgICAgXCJkb2VzIG5vdCBoYXZlIGlzQ2xpZW50U2FmZSBwcm9wZXJ0eSBzZXQ7IGlnbm9yaW5nXCIpO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIkludGVybmFsIHNlcnZlciBlcnJvclwiKTtcbn07XG5cblxuLy8gQXVkaXQgYXJndW1lbnQgY2hlY2tzLCBpZiB0aGUgYXVkaXQtYXJndW1lbnQtY2hlY2tzIHBhY2thZ2UgZXhpc3RzIChpdCBpcyBhXG4vLyB3ZWFrIGRlcGVuZGVuY3kgb2YgdGhpcyBwYWNrYWdlKS5cbnZhciBtYXliZUF1ZGl0QXJndW1lbnRDaGVja3MgPSBmdW5jdGlvbiAoZiwgY29udGV4dCwgYXJncywgZGVzY3JpcHRpb24pIHtcbiAgYXJncyA9IGFyZ3MgfHwgW107XG4gIGlmIChQYWNrYWdlWydhdWRpdC1hcmd1bWVudC1jaGVja3MnXSkge1xuICAgIHJldHVybiBNYXRjaC5fZmFpbElmQXJndW1lbnRzQXJlTm90QWxsQ2hlY2tlZChcbiAgICAgIGYsIGNvbnRleHQsIGFyZ3MsIGRlc2NyaXB0aW9uKTtcbiAgfVxuICByZXR1cm4gZi5hcHBseShjb250ZXh0LCBhcmdzKTtcbn07XG4iLCJ2YXIgRnV0dXJlID0gTnBtLnJlcXVpcmUoJ2ZpYmVycy9mdXR1cmUnKTtcblxuLy8gQSB3cml0ZSBmZW5jZSBjb2xsZWN0cyBhIGdyb3VwIG9mIHdyaXRlcywgYW5kIHByb3ZpZGVzIGEgY2FsbGJhY2tcbi8vIHdoZW4gYWxsIG9mIHRoZSB3cml0ZXMgYXJlIGZ1bGx5IGNvbW1pdHRlZCBhbmQgcHJvcGFnYXRlZCAoYWxsXG4vLyBvYnNlcnZlcnMgaGF2ZSBiZWVuIG5vdGlmaWVkIG9mIHRoZSB3cml0ZSBhbmQgYWNrbm93bGVkZ2VkIGl0Lilcbi8vXG5ERFBTZXJ2ZXIuX1dyaXRlRmVuY2UgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICBzZWxmLmFybWVkID0gZmFsc2U7XG4gIHNlbGYuZmlyZWQgPSBmYWxzZTtcbiAgc2VsZi5yZXRpcmVkID0gZmFsc2U7XG4gIHNlbGYub3V0c3RhbmRpbmdfd3JpdGVzID0gMDtcbiAgc2VsZi5iZWZvcmVfZmlyZV9jYWxsYmFja3MgPSBbXTtcbiAgc2VsZi5jb21wbGV0aW9uX2NhbGxiYWNrcyA9IFtdO1xufTtcblxuLy8gVGhlIGN1cnJlbnQgd3JpdGUgZmVuY2UuIFdoZW4gdGhlcmUgaXMgYSBjdXJyZW50IHdyaXRlIGZlbmNlLCBjb2RlXG4vLyB0aGF0IHdyaXRlcyB0byBkYXRhYmFzZXMgc2hvdWxkIHJlZ2lzdGVyIHRoZWlyIHdyaXRlcyB3aXRoIGl0IHVzaW5nXG4vLyBiZWdpbldyaXRlKCkuXG4vL1xuRERQU2VydmVyLl9DdXJyZW50V3JpdGVGZW5jZSA9IG5ldyBNZXRlb3IuRW52aXJvbm1lbnRWYXJpYWJsZTtcblxuXy5leHRlbmQoRERQU2VydmVyLl9Xcml0ZUZlbmNlLnByb3RvdHlwZSwge1xuICAvLyBTdGFydCB0cmFja2luZyBhIHdyaXRlLCBhbmQgcmV0dXJuIGFuIG9iamVjdCB0byByZXByZXNlbnQgaXQuIFRoZVxuICAvLyBvYmplY3QgaGFzIGEgc2luZ2xlIG1ldGhvZCwgY29tbWl0dGVkKCkuIFRoaXMgbWV0aG9kIHNob3VsZCBiZVxuICAvLyBjYWxsZWQgd2hlbiB0aGUgd3JpdGUgaXMgZnVsbHkgY29tbWl0dGVkIGFuZCBwcm9wYWdhdGVkLiBZb3UgY2FuXG4gIC8vIGNvbnRpbnVlIHRvIGFkZCB3cml0ZXMgdG8gdGhlIFdyaXRlRmVuY2UgdXAgdW50aWwgaXQgaXMgdHJpZ2dlcmVkXG4gIC8vIChjYWxscyBpdHMgY2FsbGJhY2tzIGJlY2F1c2UgYWxsIHdyaXRlcyBoYXZlIGNvbW1pdHRlZC4pXG4gIGJlZ2luV3JpdGU6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBpZiAoc2VsZi5yZXRpcmVkKVxuICAgICAgcmV0dXJuIHsgY29tbWl0dGVkOiBmdW5jdGlvbiAoKSB7fSB9O1xuXG4gICAgaWYgKHNlbGYuZmlyZWQpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJmZW5jZSBoYXMgYWxyZWFkeSBhY3RpdmF0ZWQgLS0gdG9vIGxhdGUgdG8gYWRkIHdyaXRlc1wiKTtcblxuICAgIHNlbGYub3V0c3RhbmRpbmdfd3JpdGVzKys7XG4gICAgdmFyIGNvbW1pdHRlZCA9IGZhbHNlO1xuICAgIHJldHVybiB7XG4gICAgICBjb21taXR0ZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGNvbW1pdHRlZClcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjb21taXR0ZWQgY2FsbGVkIHR3aWNlIG9uIHRoZSBzYW1lIHdyaXRlXCIpO1xuICAgICAgICBjb21taXR0ZWQgPSB0cnVlO1xuICAgICAgICBzZWxmLm91dHN0YW5kaW5nX3dyaXRlcy0tO1xuICAgICAgICBzZWxmLl9tYXliZUZpcmUoKTtcbiAgICAgIH1cbiAgICB9O1xuICB9LFxuXG4gIC8vIEFybSB0aGUgZmVuY2UuIE9uY2UgdGhlIGZlbmNlIGlzIGFybWVkLCBhbmQgdGhlcmUgYXJlIG5vIG1vcmVcbiAgLy8gdW5jb21taXR0ZWQgd3JpdGVzLCBpdCB3aWxsIGFjdGl2YXRlLlxuICBhcm06IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHNlbGYgPT09IEREUFNlcnZlci5fQ3VycmVudFdyaXRlRmVuY2UuZ2V0KCkpXG4gICAgICB0aHJvdyBFcnJvcihcIkNhbid0IGFybSB0aGUgY3VycmVudCBmZW5jZVwiKTtcbiAgICBzZWxmLmFybWVkID0gdHJ1ZTtcbiAgICBzZWxmLl9tYXliZUZpcmUoKTtcbiAgfSxcblxuICAvLyBSZWdpc3RlciBhIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbmNlIGJlZm9yZSBmaXJpbmcgdGhlIGZlbmNlLlxuICAvLyBDYWxsYmFjayBmdW5jdGlvbiBjYW4gYWRkIG5ldyB3cml0ZXMgdG8gdGhlIGZlbmNlLCBpbiB3aGljaCBjYXNlXG4gIC8vIGl0IHdvbid0IGZpcmUgdW50aWwgdGhvc2Ugd3JpdGVzIGFyZSBkb25lIGFzIHdlbGwuXG4gIG9uQmVmb3JlRmlyZTogZnVuY3Rpb24gKGZ1bmMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHNlbGYuZmlyZWQpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJmZW5jZSBoYXMgYWxyZWFkeSBhY3RpdmF0ZWQgLS0gdG9vIGxhdGUgdG8gXCIgK1xuICAgICAgICAgICAgICAgICAgICAgIFwiYWRkIGEgY2FsbGJhY2tcIik7XG4gICAgc2VsZi5iZWZvcmVfZmlyZV9jYWxsYmFja3MucHVzaChmdW5jKTtcbiAgfSxcblxuICAvLyBSZWdpc3RlciBhIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBmZW5jZSBmaXJlcy5cbiAgb25BbGxDb21taXR0ZWQ6IGZ1bmN0aW9uIChmdW5jKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmIChzZWxmLmZpcmVkKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZmVuY2UgaGFzIGFscmVhZHkgYWN0aXZhdGVkIC0tIHRvbyBsYXRlIHRvIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICBcImFkZCBhIGNhbGxiYWNrXCIpO1xuICAgIHNlbGYuY29tcGxldGlvbl9jYWxsYmFja3MucHVzaChmdW5jKTtcbiAgfSxcblxuICAvLyBDb252ZW5pZW5jZSBmdW5jdGlvbi4gQXJtcyB0aGUgZmVuY2UsIHRoZW4gYmxvY2tzIHVudGlsIGl0IGZpcmVzLlxuICBhcm1BbmRXYWl0OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBmdXR1cmUgPSBuZXcgRnV0dXJlO1xuICAgIHNlbGYub25BbGxDb21taXR0ZWQoZnVuY3Rpb24gKCkge1xuICAgICAgZnV0dXJlWydyZXR1cm4nXSgpO1xuICAgIH0pO1xuICAgIHNlbGYuYXJtKCk7XG4gICAgZnV0dXJlLndhaXQoKTtcbiAgfSxcblxuICBfbWF5YmVGaXJlOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmIChzZWxmLmZpcmVkKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwid3JpdGUgZmVuY2UgYWxyZWFkeSBhY3RpdmF0ZWQ/XCIpO1xuICAgIGlmIChzZWxmLmFybWVkICYmICFzZWxmLm91dHN0YW5kaW5nX3dyaXRlcykge1xuICAgICAgZnVuY3Rpb24gaW52b2tlQ2FsbGJhY2sgKGZ1bmMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBmdW5jKHNlbGYpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICBNZXRlb3IuX2RlYnVnKFwiZXhjZXB0aW9uIGluIHdyaXRlIGZlbmNlIGNhbGxiYWNrXCIsIGVycik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2VsZi5vdXRzdGFuZGluZ193cml0ZXMrKztcbiAgICAgIHdoaWxlIChzZWxmLmJlZm9yZV9maXJlX2NhbGxiYWNrcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBjYWxsYmFja3MgPSBzZWxmLmJlZm9yZV9maXJlX2NhbGxiYWNrcztcbiAgICAgICAgc2VsZi5iZWZvcmVfZmlyZV9jYWxsYmFja3MgPSBbXTtcbiAgICAgICAgXy5lYWNoKGNhbGxiYWNrcywgaW52b2tlQ2FsbGJhY2spO1xuICAgICAgfVxuICAgICAgc2VsZi5vdXRzdGFuZGluZ193cml0ZXMtLTtcblxuICAgICAgaWYgKCFzZWxmLm91dHN0YW5kaW5nX3dyaXRlcykge1xuICAgICAgICBzZWxmLmZpcmVkID0gdHJ1ZTtcbiAgICAgICAgdmFyIGNhbGxiYWNrcyA9IHNlbGYuY29tcGxldGlvbl9jYWxsYmFja3M7XG4gICAgICAgIHNlbGYuY29tcGxldGlvbl9jYWxsYmFja3MgPSBbXTtcbiAgICAgICAgXy5lYWNoKGNhbGxiYWNrcywgaW52b2tlQ2FsbGJhY2spO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvLyBEZWFjdGl2YXRlIHRoaXMgZmVuY2Ugc28gdGhhdCBhZGRpbmcgbW9yZSB3cml0ZXMgaGFzIG5vIGVmZmVjdC5cbiAgLy8gVGhlIGZlbmNlIG11c3QgaGF2ZSBhbHJlYWR5IGZpcmVkLlxuICByZXRpcmU6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKCEgc2VsZi5maXJlZClcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IHJldGlyZSBhIGZlbmNlIHRoYXQgaGFzbid0IGZpcmVkLlwiKTtcbiAgICBzZWxmLnJldGlyZWQgPSB0cnVlO1xuICB9XG59KTtcbiIsIi8vIEEgXCJjcm9zc2JhclwiIGlzIGEgY2xhc3MgdGhhdCBwcm92aWRlcyBzdHJ1Y3R1cmVkIG5vdGlmaWNhdGlvbiByZWdpc3RyYXRpb24uXG4vLyBTZWUgX21hdGNoIGZvciB0aGUgZGVmaW5pdGlvbiBvZiBob3cgYSBub3RpZmljYXRpb24gbWF0Y2hlcyBhIHRyaWdnZXIuXG4vLyBBbGwgbm90aWZpY2F0aW9ucyBhbmQgdHJpZ2dlcnMgbXVzdCBoYXZlIGEgc3RyaW5nIGtleSBuYW1lZCAnY29sbGVjdGlvbicuXG5cbkREUFNlcnZlci5fQ3Jvc3NiYXIgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIHNlbGYubmV4dElkID0gMTtcbiAgLy8gbWFwIGZyb20gY29sbGVjdGlvbiBuYW1lIChzdHJpbmcpIC0+IGxpc3RlbmVyIGlkIC0+IG9iamVjdC4gZWFjaCBvYmplY3QgaGFzXG4gIC8vIGtleXMgJ3RyaWdnZXInLCAnY2FsbGJhY2snLiAgQXMgYSBoYWNrLCB0aGUgZW1wdHkgc3RyaW5nIG1lYW5zIFwibm9cbiAgLy8gY29sbGVjdGlvblwiLlxuICBzZWxmLmxpc3RlbmVyc0J5Q29sbGVjdGlvbiA9IHt9O1xuICBzZWxmLmxpc3RlbmVyc0J5Q29sbGVjdGlvbkNvdW50ID0ge307XG4gIHNlbGYuZmFjdFBhY2thZ2UgPSBvcHRpb25zLmZhY3RQYWNrYWdlIHx8IFwibGl2ZWRhdGFcIjtcbiAgc2VsZi5mYWN0TmFtZSA9IG9wdGlvbnMuZmFjdE5hbWUgfHwgbnVsbDtcbn07XG5cbl8uZXh0ZW5kKEREUFNlcnZlci5fQ3Jvc3NiYXIucHJvdG90eXBlLCB7XG4gIC8vIG1zZyBpcyBhIHRyaWdnZXIgb3IgYSBub3RpZmljYXRpb25cbiAgX2NvbGxlY3Rpb25Gb3JNZXNzYWdlOiBmdW5jdGlvbiAobXNnKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmICghIF8uaGFzKG1zZywgJ2NvbGxlY3Rpb24nKSkge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mKG1zZy5jb2xsZWN0aW9uKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGlmIChtc2cuY29sbGVjdGlvbiA9PT0gJycpXG4gICAgICAgIHRocm93IEVycm9yKFwiTWVzc2FnZSBoYXMgZW1wdHkgY29sbGVjdGlvbiFcIik7XG4gICAgICByZXR1cm4gbXNnLmNvbGxlY3Rpb247XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IEVycm9yKFwiTWVzc2FnZSBoYXMgbm9uLXN0cmluZyBjb2xsZWN0aW9uIVwiKTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gTGlzdGVuIGZvciBub3RpZmljYXRpb24gdGhhdCBtYXRjaCAndHJpZ2dlcicuIEEgbm90aWZpY2F0aW9uXG4gIC8vIG1hdGNoZXMgaWYgaXQgaGFzIHRoZSBrZXktdmFsdWUgcGFpcnMgaW4gdHJpZ2dlciBhcyBhXG4gIC8vIHN1YnNldC4gV2hlbiBhIG5vdGlmaWNhdGlvbiBtYXRjaGVzLCBjYWxsICdjYWxsYmFjaycsIHBhc3NpbmdcbiAgLy8gdGhlIGFjdHVhbCBub3RpZmljYXRpb24uXG4gIC8vXG4gIC8vIFJldHVybnMgYSBsaXN0ZW4gaGFuZGxlLCB3aGljaCBpcyBhbiBvYmplY3Qgd2l0aCBhIG1ldGhvZFxuICAvLyBzdG9wKCkuIENhbGwgc3RvcCgpIHRvIHN0b3AgbGlzdGVuaW5nLlxuICAvL1xuICAvLyBYWFggSXQgc2hvdWxkIGJlIGxlZ2FsIHRvIGNhbGwgZmlyZSgpIGZyb20gaW5zaWRlIGEgbGlzdGVuKClcbiAgLy8gY2FsbGJhY2s/XG4gIGxpc3RlbjogZnVuY3Rpb24gKHRyaWdnZXIsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBpZCA9IHNlbGYubmV4dElkKys7XG5cbiAgICB2YXIgY29sbGVjdGlvbiA9IHNlbGYuX2NvbGxlY3Rpb25Gb3JNZXNzYWdlKHRyaWdnZXIpO1xuICAgIHZhciByZWNvcmQgPSB7dHJpZ2dlcjogRUpTT04uY2xvbmUodHJpZ2dlciksIGNhbGxiYWNrOiBjYWxsYmFja307XG4gICAgaWYgKCEgXy5oYXMoc2VsZi5saXN0ZW5lcnNCeUNvbGxlY3Rpb24sIGNvbGxlY3Rpb24pKSB7XG4gICAgICBzZWxmLmxpc3RlbmVyc0J5Q29sbGVjdGlvbltjb2xsZWN0aW9uXSA9IHt9O1xuICAgICAgc2VsZi5saXN0ZW5lcnNCeUNvbGxlY3Rpb25Db3VudFtjb2xsZWN0aW9uXSA9IDA7XG4gICAgfVxuICAgIHNlbGYubGlzdGVuZXJzQnlDb2xsZWN0aW9uW2NvbGxlY3Rpb25dW2lkXSA9IHJlY29yZDtcbiAgICBzZWxmLmxpc3RlbmVyc0J5Q29sbGVjdGlvbkNvdW50W2NvbGxlY3Rpb25dKys7XG5cbiAgICBpZiAoc2VsZi5mYWN0TmFtZSAmJiBQYWNrYWdlWydmYWN0cy1iYXNlJ10pIHtcbiAgICAgIFBhY2thZ2VbJ2ZhY3RzLWJhc2UnXS5GYWN0cy5pbmNyZW1lbnRTZXJ2ZXJGYWN0KFxuICAgICAgICBzZWxmLmZhY3RQYWNrYWdlLCBzZWxmLmZhY3ROYW1lLCAxKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3RvcDogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoc2VsZi5mYWN0TmFtZSAmJiBQYWNrYWdlWydmYWN0cy1iYXNlJ10pIHtcbiAgICAgICAgICBQYWNrYWdlWydmYWN0cy1iYXNlJ10uRmFjdHMuaW5jcmVtZW50U2VydmVyRmFjdChcbiAgICAgICAgICAgIHNlbGYuZmFjdFBhY2thZ2UsIHNlbGYuZmFjdE5hbWUsIC0xKTtcbiAgICAgICAgfVxuICAgICAgICBkZWxldGUgc2VsZi5saXN0ZW5lcnNCeUNvbGxlY3Rpb25bY29sbGVjdGlvbl1baWRdO1xuICAgICAgICBzZWxmLmxpc3RlbmVyc0J5Q29sbGVjdGlvbkNvdW50W2NvbGxlY3Rpb25dLS07XG4gICAgICAgIGlmIChzZWxmLmxpc3RlbmVyc0J5Q29sbGVjdGlvbkNvdW50W2NvbGxlY3Rpb25dID09PSAwKSB7XG4gICAgICAgICAgZGVsZXRlIHNlbGYubGlzdGVuZXJzQnlDb2xsZWN0aW9uW2NvbGxlY3Rpb25dO1xuICAgICAgICAgIGRlbGV0ZSBzZWxmLmxpc3RlbmVyc0J5Q29sbGVjdGlvbkNvdW50W2NvbGxlY3Rpb25dO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfSxcblxuICAvLyBGaXJlIHRoZSBwcm92aWRlZCAnbm90aWZpY2F0aW9uJyAoYW4gb2JqZWN0IHdob3NlIGF0dHJpYnV0ZVxuICAvLyB2YWx1ZXMgYXJlIGFsbCBKU09OLWNvbXBhdGliaWxlKSAtLSBpbmZvcm0gYWxsIG1hdGNoaW5nIGxpc3RlbmVyc1xuICAvLyAocmVnaXN0ZXJlZCB3aXRoIGxpc3RlbigpKS5cbiAgLy9cbiAgLy8gSWYgZmlyZSgpIGlzIGNhbGxlZCBpbnNpZGUgYSB3cml0ZSBmZW5jZSwgdGhlbiBlYWNoIG9mIHRoZVxuICAvLyBsaXN0ZW5lciBjYWxsYmFja3Mgd2lsbCBiZSBjYWxsZWQgaW5zaWRlIHRoZSB3cml0ZSBmZW5jZSBhcyB3ZWxsLlxuICAvL1xuICAvLyBUaGUgbGlzdGVuZXJzIG1heSBiZSBpbnZva2VkIGluIHBhcmFsbGVsLCByYXRoZXIgdGhhbiBzZXJpYWxseS5cbiAgZmlyZTogZnVuY3Rpb24gKG5vdGlmaWNhdGlvbikge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHZhciBjb2xsZWN0aW9uID0gc2VsZi5fY29sbGVjdGlvbkZvck1lc3NhZ2Uobm90aWZpY2F0aW9uKTtcblxuICAgIGlmICghIF8uaGFzKHNlbGYubGlzdGVuZXJzQnlDb2xsZWN0aW9uLCBjb2xsZWN0aW9uKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBsaXN0ZW5lcnNGb3JDb2xsZWN0aW9uID0gc2VsZi5saXN0ZW5lcnNCeUNvbGxlY3Rpb25bY29sbGVjdGlvbl07XG4gICAgdmFyIGNhbGxiYWNrSWRzID0gW107XG4gICAgXy5lYWNoKGxpc3RlbmVyc0ZvckNvbGxlY3Rpb24sIGZ1bmN0aW9uIChsLCBpZCkge1xuICAgICAgaWYgKHNlbGYuX21hdGNoZXMobm90aWZpY2F0aW9uLCBsLnRyaWdnZXIpKSB7XG4gICAgICAgIGNhbGxiYWNrSWRzLnB1c2goaWQpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gTGlzdGVuZXIgY2FsbGJhY2tzIGNhbiB5aWVsZCwgc28gd2UgbmVlZCB0byBmaXJzdCBmaW5kIGFsbCB0aGUgb25lcyB0aGF0XG4gICAgLy8gbWF0Y2ggaW4gYSBzaW5nbGUgaXRlcmF0aW9uIG92ZXIgc2VsZi5saXN0ZW5lcnNCeUNvbGxlY3Rpb24gKHdoaWNoIGNhbid0XG4gICAgLy8gYmUgbXV0YXRlZCBkdXJpbmcgdGhpcyBpdGVyYXRpb24pLCBhbmQgdGhlbiBpbnZva2UgdGhlIG1hdGNoaW5nXG4gICAgLy8gY2FsbGJhY2tzLCBjaGVja2luZyBiZWZvcmUgZWFjaCBjYWxsIHRvIGVuc3VyZSB0aGV5IGhhdmVuJ3Qgc3RvcHBlZC5cbiAgICAvLyBOb3RlIHRoYXQgd2UgZG9uJ3QgaGF2ZSB0byBjaGVjayB0aGF0XG4gICAgLy8gc2VsZi5saXN0ZW5lcnNCeUNvbGxlY3Rpb25bY29sbGVjdGlvbl0gc3RpbGwgPT09IGxpc3RlbmVyc0ZvckNvbGxlY3Rpb24sXG4gICAgLy8gYmVjYXVzZSB0aGUgb25seSB3YXkgdGhhdCBzdG9wcyBiZWluZyB0cnVlIGlzIGlmIGxpc3RlbmVyc0ZvckNvbGxlY3Rpb25cbiAgICAvLyBmaXJzdCBnZXRzIHJlZHVjZWQgZG93biB0byB0aGUgZW1wdHkgb2JqZWN0IChhbmQgdGhlbiBuZXZlciBnZXRzXG4gICAgLy8gaW5jcmVhc2VkIGFnYWluKS5cbiAgICBfLmVhY2goY2FsbGJhY2tJZHMsIGZ1bmN0aW9uIChpZCkge1xuICAgICAgaWYgKF8uaGFzKGxpc3RlbmVyc0ZvckNvbGxlY3Rpb24sIGlkKSkge1xuICAgICAgICBsaXN0ZW5lcnNGb3JDb2xsZWN0aW9uW2lkXS5jYWxsYmFjayhub3RpZmljYXRpb24pO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIC8vIEEgbm90aWZpY2F0aW9uIG1hdGNoZXMgYSB0cmlnZ2VyIGlmIGFsbCBrZXlzIHRoYXQgZXhpc3QgaW4gYm90aCBhcmUgZXF1YWwuXG4gIC8vXG4gIC8vIEV4YW1wbGVzOlxuICAvLyAgTjp7Y29sbGVjdGlvbjogXCJDXCJ9IG1hdGNoZXMgVDp7Y29sbGVjdGlvbjogXCJDXCJ9XG4gIC8vICAgIChhIG5vbi10YXJnZXRlZCB3cml0ZSB0byBhIGNvbGxlY3Rpb24gbWF0Y2hlcyBhXG4gIC8vICAgICBub24tdGFyZ2V0ZWQgcXVlcnkpXG4gIC8vICBOOntjb2xsZWN0aW9uOiBcIkNcIiwgaWQ6IFwiWFwifSBtYXRjaGVzIFQ6e2NvbGxlY3Rpb246IFwiQ1wifVxuICAvLyAgICAoYSB0YXJnZXRlZCB3cml0ZSB0byBhIGNvbGxlY3Rpb24gbWF0Y2hlcyBhIG5vbi10YXJnZXRlZCBxdWVyeSlcbiAgLy8gIE46e2NvbGxlY3Rpb246IFwiQ1wifSBtYXRjaGVzIFQ6e2NvbGxlY3Rpb246IFwiQ1wiLCBpZDogXCJYXCJ9XG4gIC8vICAgIChhIG5vbi10YXJnZXRlZCB3cml0ZSB0byBhIGNvbGxlY3Rpb24gbWF0Y2hlcyBhXG4gIC8vICAgICB0YXJnZXRlZCBxdWVyeSlcbiAgLy8gIE46e2NvbGxlY3Rpb246IFwiQ1wiLCBpZDogXCJYXCJ9IG1hdGNoZXMgVDp7Y29sbGVjdGlvbjogXCJDXCIsIGlkOiBcIlhcIn1cbiAgLy8gICAgKGEgdGFyZ2V0ZWQgd3JpdGUgdG8gYSBjb2xsZWN0aW9uIG1hdGNoZXMgYSB0YXJnZXRlZCBxdWVyeSB0YXJnZXRlZFxuICAvLyAgICAgYXQgdGhlIHNhbWUgZG9jdW1lbnQpXG4gIC8vICBOOntjb2xsZWN0aW9uOiBcIkNcIiwgaWQ6IFwiWFwifSBkb2VzIG5vdCBtYXRjaCBUOntjb2xsZWN0aW9uOiBcIkNcIiwgaWQ6IFwiWVwifVxuICAvLyAgICAoYSB0YXJnZXRlZCB3cml0ZSB0byBhIGNvbGxlY3Rpb24gZG9lcyBub3QgbWF0Y2ggYSB0YXJnZXRlZCBxdWVyeVxuICAvLyAgICAgdGFyZ2V0ZWQgYXQgYSBkaWZmZXJlbnQgZG9jdW1lbnQpXG4gIF9tYXRjaGVzOiBmdW5jdGlvbiAobm90aWZpY2F0aW9uLCB0cmlnZ2VyKSB7XG4gICAgLy8gTW9zdCBub3RpZmljYXRpb25zIHRoYXQgdXNlIHRoZSBjcm9zc2JhciBoYXZlIGEgc3RyaW5nIGBjb2xsZWN0aW9uYCBhbmRcbiAgICAvLyBtYXliZSBhbiBgaWRgIHRoYXQgaXMgYSBzdHJpbmcgb3IgT2JqZWN0SUQuIFdlJ3JlIGFscmVhZHkgZGl2aWRpbmcgdXBcbiAgICAvLyB0cmlnZ2VycyBieSBjb2xsZWN0aW9uLCBidXQgbGV0J3MgZmFzdC10cmFjayBcIm5vcGUsIGRpZmZlcmVudCBJRFwiIChhbmRcbiAgICAvLyBhdm9pZCB0aGUgb3Zlcmx5IGdlbmVyaWMgRUpTT04uZXF1YWxzKS4gVGhpcyBtYWtlcyBhIG5vdGljZWFibGVcbiAgICAvLyBwZXJmb3JtYW5jZSBkaWZmZXJlbmNlOyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL21ldGVvci9tZXRlb3IvcHVsbC8zNjk3XG4gICAgaWYgKHR5cGVvZihub3RpZmljYXRpb24uaWQpID09PSAnc3RyaW5nJyAmJlxuICAgICAgICB0eXBlb2YodHJpZ2dlci5pZCkgPT09ICdzdHJpbmcnICYmXG4gICAgICAgIG5vdGlmaWNhdGlvbi5pZCAhPT0gdHJpZ2dlci5pZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAobm90aWZpY2F0aW9uLmlkIGluc3RhbmNlb2YgTW9uZ29JRC5PYmplY3RJRCAmJlxuICAgICAgICB0cmlnZ2VyLmlkIGluc3RhbmNlb2YgTW9uZ29JRC5PYmplY3RJRCAmJlxuICAgICAgICAhIG5vdGlmaWNhdGlvbi5pZC5lcXVhbHModHJpZ2dlci5pZCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gXy5hbGwodHJpZ2dlciwgZnVuY3Rpb24gKHRyaWdnZXJWYWx1ZSwga2V5KSB7XG4gICAgICByZXR1cm4gIV8uaGFzKG5vdGlmaWNhdGlvbiwga2V5KSB8fFxuICAgICAgICBFSlNPTi5lcXVhbHModHJpZ2dlclZhbHVlLCBub3RpZmljYXRpb25ba2V5XSk7XG4gICAgfSk7XG4gIH1cbn0pO1xuXG4vLyBUaGUgXCJpbnZhbGlkYXRpb24gY3Jvc3NiYXJcIiBpcyBhIHNwZWNpZmljIGluc3RhbmNlIHVzZWQgYnkgdGhlIEREUCBzZXJ2ZXIgdG9cbi8vIGltcGxlbWVudCB3cml0ZSBmZW5jZSBub3RpZmljYXRpb25zLiBMaXN0ZW5lciBjYWxsYmFja3Mgb24gdGhpcyBjcm9zc2JhclxuLy8gc2hvdWxkIGNhbGwgYmVnaW5Xcml0ZSBvbiB0aGUgY3VycmVudCB3cml0ZSBmZW5jZSBiZWZvcmUgdGhleSByZXR1cm4sIGlmIHRoZXlcbi8vIHdhbnQgdG8gZGVsYXkgdGhlIHdyaXRlIGZlbmNlIGZyb20gZmlyaW5nIChpZSwgdGhlIEREUCBtZXRob2QtZGF0YS11cGRhdGVkXG4vLyBtZXNzYWdlIGZyb20gYmVpbmcgc2VudCkuXG5ERFBTZXJ2ZXIuX0ludmFsaWRhdGlvbkNyb3NzYmFyID0gbmV3IEREUFNlcnZlci5fQ3Jvc3NiYXIoe1xuICBmYWN0TmFtZTogXCJpbnZhbGlkYXRpb24tY3Jvc3NiYXItbGlzdGVuZXJzXCJcbn0pO1xuIiwiaWYgKHByb2Nlc3MuZW52LkREUF9ERUZBVUxUX0NPTk5FQ1RJT05fVVJMKSB7XG4gIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uRERQX0RFRkFVTFRfQ09OTkVDVElPTl9VUkwgPVxuICAgIHByb2Nlc3MuZW52LkREUF9ERUZBVUxUX0NPTk5FQ1RJT05fVVJMO1xufVxuXG5NZXRlb3Iuc2VydmVyID0gbmV3IFNlcnZlcjtcblxuTWV0ZW9yLnJlZnJlc2ggPSBmdW5jdGlvbiAobm90aWZpY2F0aW9uKSB7XG4gIEREUFNlcnZlci5fSW52YWxpZGF0aW9uQ3Jvc3NiYXIuZmlyZShub3RpZmljYXRpb24pO1xufTtcblxuLy8gUHJveHkgdGhlIHB1YmxpYyBtZXRob2RzIG9mIE1ldGVvci5zZXJ2ZXIgc28gdGhleSBjYW5cbi8vIGJlIGNhbGxlZCBkaXJlY3RseSBvbiBNZXRlb3IuXG5fLmVhY2goWydwdWJsaXNoJywgJ21ldGhvZHMnLCAnY2FsbCcsICdhcHBseScsICdvbkNvbm5lY3Rpb24nLCAnb25NZXNzYWdlJ10sXG4gICAgICAgZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgIE1ldGVvcltuYW1lXSA9IF8uYmluZChNZXRlb3Iuc2VydmVyW25hbWVdLCBNZXRlb3Iuc2VydmVyKTtcbiAgICAgICB9KTtcblxuLy8gTWV0ZW9yLnNlcnZlciB1c2VkIHRvIGJlIGNhbGxlZCBNZXRlb3IuZGVmYXVsdF9zZXJ2ZXIuIFByb3ZpZGVcbi8vIGJhY2tjb21wYXQgYXMgYSBjb3VydGVzeSBldmVuIHRob3VnaCBpdCB3YXMgbmV2ZXIgZG9jdW1lbnRlZC5cbi8vIFhYWCBDT01QQVQgV0lUSCAwLjYuNFxuTWV0ZW9yLmRlZmF1bHRfc2VydmVyID0gTWV0ZW9yLnNlcnZlcjtcbiJdfQ==
