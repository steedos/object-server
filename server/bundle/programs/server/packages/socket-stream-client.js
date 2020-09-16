(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Retry = Package.retry.Retry;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var options;

var require = meteorInstall({"node_modules":{"meteor":{"socket-stream-client":{"server.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/socket-stream-client/server.js                                                                        //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
const module1 = module;
let setMinimumBrowserVersions;
module1.link("meteor/modern-browsers", {
  setMinimumBrowserVersions(v) {
    setMinimumBrowserVersions = v;
  }

}, 0);
setMinimumBrowserVersions({
  chrome: 16,
  edge: 12,
  firefox: 11,
  ie: 10,
  mobileSafari: [6, 1],
  phantomjs: 2,
  safari: 7,
  electron: [0, 20]
}, module.id);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/socket-stream-client/node.js                                                                          //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
const module1 = module;
module1.export({
  ClientStream: () => ClientStream
});
let Meteor;
module1.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let toWebsocketUrl;
module1.link("./urls.js", {
  toWebsocketUrl(v) {
    toWebsocketUrl = v;
  }

}, 1);
let StreamClientCommon;
module1.link("./common.js", {
  StreamClientCommon(v) {
    StreamClientCommon = v;
  }

}, 2);

class ClientStream extends StreamClientCommon {
  constructor(endpoint, options) {
    super(options);
    this.client = null; // created in _launchConnection

    this.endpoint = endpoint;
    this.headers = this.options.headers || Object.create(null);
    this.npmFayeOptions = this.options.npmFayeOptions || Object.create(null);

    this._initCommon(this.options); //// Kickoff!


    this._launchConnection();
  } // data is a utf8 string. Data sent while not connected is dropped on
  // the floor, and it is up the user of this API to retransmit lost
  // messages on 'reset'


  send(data) {
    if (this.currentStatus.connected) {
      this.client.send(data);
    }
  } // Changes where this connection points


  _changeUrl(url) {
    this.endpoint = url;
  }

  _onConnect(client) {
    if (client !== this.client) {
      // This connection is not from the last call to _launchConnection.
      // But _launchConnection calls _cleanup which closes previous connections.
      // It's our belief that this stifles future 'open' events, but maybe
      // we are wrong?
      throw new Error('Got open from inactive client ' + !!this.client);
    }

    if (this._forcedToDisconnect) {
      // We were asked to disconnect between trying to open the connection and
      // actually opening it. Let's just pretend this never happened.
      this.client.close();
      this.client = null;
      return;
    }

    if (this.currentStatus.connected) {
      // We already have a connection. It must have been the case that we
      // started two parallel connection attempts (because we wanted to
      // 'reconnect now' on a hanging connection and we had no way to cancel the
      // connection attempt.) But this shouldn't happen (similarly to the client
      // !== this.client check above).
      throw new Error('Two parallel connections?');
    }

    this._clearConnectionTimer(); // update status


    this.currentStatus.status = 'connected';
    this.currentStatus.connected = true;
    this.currentStatus.retryCount = 0;
    this.statusChanged(); // fire resets. This must come after status change so that clients
    // can call send from within a reset callback.

    this.forEachCallback('reset', callback => {
      callback();
    });
  }

  _cleanup(maybeError) {
    this._clearConnectionTimer();

    if (this.client) {
      var client = this.client;
      this.client = null;
      client.close();
      this.forEachCallback('disconnect', callback => {
        callback(maybeError);
      });
    }
  }

  _clearConnectionTimer() {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  _getProxyUrl(targetUrl) {
    // Similar to code in tools/http-helpers.js.
    var proxy = process.env.HTTP_PROXY || process.env.http_proxy || null; // if we're going to a secure url, try the https_proxy env variable first.

    if (targetUrl.match(/^wss:/)) {
      proxy = process.env.HTTPS_PROXY || process.env.https_proxy || proxy;
    }

    return proxy;
  }

  _launchConnection() {
    this._cleanup(); // cleanup the old socket, if there was one.
    // Since server-to-server DDP is still an experimental feature, we only
    // require the module if we actually create a server-to-server
    // connection.


    var FayeWebSocket = Npm.require('faye-websocket');

    var deflate = Npm.require('permessage-deflate');

    var targetUrl = toWebsocketUrl(this.endpoint);
    var fayeOptions = {
      headers: this.headers,
      extensions: [deflate]
    };
    fayeOptions = Object.assign(fayeOptions, this.npmFayeOptions);

    var proxyUrl = this._getProxyUrl(targetUrl);

    if (proxyUrl) {
      fayeOptions.proxy = {
        origin: proxyUrl
      };
    } // We would like to specify 'ddp' as the subprotocol here. The npm module we
    // used to use as a client would fail the handshake if we ask for a
    // subprotocol and the server doesn't send one back (and sockjs doesn't).
    // Faye doesn't have that behavior; it's unclear from reading RFC 6455 if
    // Faye is erroneous or not.  So for now, we don't specify protocols.


    var subprotocols = [];
    var client = this.client = new FayeWebSocket.Client(targetUrl, subprotocols, fayeOptions);

    this._clearConnectionTimer();

    this.connectionTimer = Meteor.setTimeout(() => {
      this._lostConnection(new this.ConnectionError('DDP connection timed out'));
    }, this.CONNECT_TIMEOUT);
    this.client.on('open', Meteor.bindEnvironment(() => {
      return this._onConnect(client);
    }, 'stream connect callback'));

    var clientOnIfCurrent = (event, description, callback) => {
      this.client.on(event, Meteor.bindEnvironment((...args) => {
        // Ignore events from any connection we've already cleaned up.
        if (client !== this.client) return;
        callback(...args);
      }, description));
    };

    clientOnIfCurrent('error', 'stream error callback', error => {
      if (!this.options._dontPrintErrors) Meteor._debug('stream error', error.message); // Faye's 'error' object is not a JS error (and among other things,
      // doesn't stringify well). Convert it to one.

      this._lostConnection(new this.ConnectionError(error.message));
    });
    clientOnIfCurrent('close', 'stream close callback', () => {
      this._lostConnection();
    });
    clientOnIfCurrent('message', 'stream message callback', message => {
      // Ignore binary frames, where message.data is a Buffer
      if (typeof message.data !== 'string') return;
      this.forEachCallback('message', callback => {
        callback(message.data);
      });
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"common.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/socket-stream-client/common.js                                                                        //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

module.export({
  StreamClientCommon: () => StreamClientCommon
});
let Retry;
module.link("meteor/retry", {
  Retry(v) {
    Retry = v;
  }

}, 0);
const forcedReconnectError = new Error("forced reconnect");

class StreamClientCommon {
  constructor(options) {
    this.options = (0, _objectSpread2.default)({
      retry: true
    }, options || null);
    this.ConnectionError = options && options.ConnectionError || Error;
  } // Register for callbacks.


  on(name, callback) {
    if (name !== 'message' && name !== 'reset' && name !== 'disconnect') throw new Error('unknown event type: ' + name);
    if (!this.eventCallbacks[name]) this.eventCallbacks[name] = [];
    this.eventCallbacks[name].push(callback);
  }

  forEachCallback(name, cb) {
    if (!this.eventCallbacks[name] || !this.eventCallbacks[name].length) {
      return;
    }

    this.eventCallbacks[name].forEach(cb);
  }

  _initCommon(options) {
    options = options || Object.create(null); //// Constants
    // how long to wait until we declare the connection attempt
    // failed.

    this.CONNECT_TIMEOUT = options.connectTimeoutMs || 10000;
    this.eventCallbacks = Object.create(null); // name -> [callback]

    this._forcedToDisconnect = false; //// Reactive status

    this.currentStatus = {
      status: 'connecting',
      connected: false,
      retryCount: 0
    };

    if (Package.tracker) {
      this.statusListeners = new Package.tracker.Tracker.Dependency();
    }

    this.statusChanged = () => {
      if (this.statusListeners) {
        this.statusListeners.changed();
      }
    }; //// Retry logic


    this._retry = new Retry();
    this.connectionTimer = null;
  } // Trigger a reconnect.


  reconnect(options) {
    options = options || Object.create(null);

    if (options.url) {
      this._changeUrl(options.url);
    }

    if (options._sockjsOptions) {
      this.options._sockjsOptions = options._sockjsOptions;
    }

    if (this.currentStatus.connected) {
      if (options._force || options.url) {
        this._lostConnection(forcedReconnectError);
      }

      return;
    } // if we're mid-connection, stop it.


    if (this.currentStatus.status === 'connecting') {
      // Pretend it's a clean close.
      this._lostConnection();
    }

    this._retry.clear();

    this.currentStatus.retryCount -= 1; // don't count manual retries

    this._retryNow();
  }

  disconnect(options) {
    options = options || Object.create(null); // Failed is permanent. If we're failed, don't let people go back
    // online by calling 'disconnect' then 'reconnect'.

    if (this._forcedToDisconnect) return; // If _permanent is set, permanently disconnect a stream. Once a stream
    // is forced to disconnect, it can never reconnect. This is for
    // error cases such as ddp version mismatch, where trying again
    // won't fix the problem.

    if (options._permanent) {
      this._forcedToDisconnect = true;
    }

    this._cleanup();

    this._retry.clear();

    this.currentStatus = {
      status: options._permanent ? 'failed' : 'offline',
      connected: false,
      retryCount: 0
    };
    if (options._permanent && options._error) this.currentStatus.reason = options._error;
    this.statusChanged();
  } // maybeError is set unless it's a clean protocol-level close.


  _lostConnection(maybeError) {
    this._cleanup(maybeError);

    this._retryLater(maybeError); // sets status. no need to do it here.

  } // fired when we detect that we've gone online. try to reconnect
  // immediately.


  _online() {
    // if we've requested to be offline by disconnecting, don't reconnect.
    if (this.currentStatus.status != 'offline') this.reconnect();
  }

  _retryLater(maybeError) {
    var timeout = 0;

    if (this.options.retry || maybeError === forcedReconnectError) {
      timeout = this._retry.retryLater(this.currentStatus.retryCount, this._retryNow.bind(this));
      this.currentStatus.status = 'waiting';
      this.currentStatus.retryTime = new Date().getTime() + timeout;
    } else {
      this.currentStatus.status = 'failed';
      delete this.currentStatus.retryTime;
    }

    this.currentStatus.connected = false;
    this.statusChanged();
  }

  _retryNow() {
    if (this._forcedToDisconnect) return;
    this.currentStatus.retryCount += 1;
    this.currentStatus.status = 'connecting';
    this.currentStatus.connected = false;
    delete this.currentStatus.retryTime;
    this.statusChanged();

    this._launchConnection();
  } // Get current status. Reactive.


  status() {
    if (this.statusListeners) {
      this.statusListeners.depend();
    }

    return this.currentStatus;
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"urls.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/socket-stream-client/urls.js                                                                          //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
module.export({
  toSockjsUrl: () => toSockjsUrl,
  toWebsocketUrl: () => toWebsocketUrl
});

// @param url {String} URL to Meteor app, eg:
//   "/" or "madewith.meteor.com" or "https://foo.meteor.com"
//   or "ddp+sockjs://ddp--****-foo.meteor.com/sockjs"
// @returns {String} URL to the endpoint with the specific scheme and subPath, e.g.
// for scheme "http" and subPath "sockjs"
//   "http://subdomain.meteor.com/sockjs" or "/sockjs"
//   or "https://ddp--1234-foo.meteor.com/sockjs"
function translateUrl(url, newSchemeBase, subPath) {
  if (!newSchemeBase) {
    newSchemeBase = 'http';
  }

  if (subPath !== "sockjs" && url.startsWith("/")) {
    url = Meteor.absoluteUrl(url.substr(1));
  }

  var ddpUrlMatch = url.match(/^ddp(i?)\+sockjs:\/\//);
  var httpUrlMatch = url.match(/^http(s?):\/\//);
  var newScheme;

  if (ddpUrlMatch) {
    // Remove scheme and split off the host.
    var urlAfterDDP = url.substr(ddpUrlMatch[0].length);
    newScheme = ddpUrlMatch[1] === 'i' ? newSchemeBase : newSchemeBase + 's';
    var slashPos = urlAfterDDP.indexOf('/');
    var host = slashPos === -1 ? urlAfterDDP : urlAfterDDP.substr(0, slashPos);
    var rest = slashPos === -1 ? '' : urlAfterDDP.substr(slashPos); // In the host (ONLY!), change '*' characters into random digits. This
    // allows different stream connections to connect to different hostnames
    // and avoid browser per-hostname connection limits.

    host = host.replace(/\*/g, () => Math.floor(Math.random() * 10));
    return newScheme + '://' + host + rest;
  } else if (httpUrlMatch) {
    newScheme = !httpUrlMatch[1] ? newSchemeBase : newSchemeBase + 's';
    var urlAfterHttp = url.substr(httpUrlMatch[0].length);
    url = newScheme + '://' + urlAfterHttp;
  } // Prefix FQDNs but not relative URLs


  if (url.indexOf('://') === -1 && !url.startsWith('/')) {
    url = newSchemeBase + '://' + url;
  } // XXX This is not what we should be doing: if I have a site
  // deployed at "/foo", then DDP.connect("/") should actually connect
  // to "/", not to "/foo". "/" is an absolute path. (Contrast: if
  // deployed at "/foo", it would be reasonable for DDP.connect("bar")
  // to connect to "/foo/bar").
  //
  // We should make this properly honor absolute paths rather than
  // forcing the path to be relative to the site root. Simultaneously,
  // we should set DDP_DEFAULT_CONNECTION_URL to include the site
  // root. See also client_convenience.js #RationalizingRelativeDDPURLs


  url = Meteor._relativeToSiteRootUrl(url);
  if (url.endsWith('/')) return url + subPath;else return url + '/' + subPath;
}

function toSockjsUrl(url) {
  return translateUrl(url, 'http', 'sockjs');
}

function toWebsocketUrl(url) {
  return translateUrl(url, 'ws', 'websocket');
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/socket-stream-client/server.js");

/* Exports */
Package._define("socket-stream-client");

})();

//# sourceURL=meteor://💻app/packages/socket-stream-client.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc29ja2V0LXN0cmVhbS1jbGllbnQvc2VydmVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zb2NrZXQtc3RyZWFtLWNsaWVudC9ub2RlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zb2NrZXQtc3RyZWFtLWNsaWVudC9jb21tb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3NvY2tldC1zdHJlYW0tY2xpZW50L3VybHMuanMiXSwibmFtZXMiOlsibW9kdWxlMSIsIm1vZHVsZSIsInNldE1pbmltdW1Ccm93c2VyVmVyc2lvbnMiLCJsaW5rIiwidiIsImNocm9tZSIsImVkZ2UiLCJmaXJlZm94IiwiaWUiLCJtb2JpbGVTYWZhcmkiLCJwaGFudG9tanMiLCJzYWZhcmkiLCJlbGVjdHJvbiIsImlkIiwiZXhwb3J0IiwiQ2xpZW50U3RyZWFtIiwiTWV0ZW9yIiwidG9XZWJzb2NrZXRVcmwiLCJTdHJlYW1DbGllbnRDb21tb24iLCJjb25zdHJ1Y3RvciIsImVuZHBvaW50Iiwib3B0aW9ucyIsImNsaWVudCIsImhlYWRlcnMiLCJPYmplY3QiLCJjcmVhdGUiLCJucG1GYXllT3B0aW9ucyIsIl9pbml0Q29tbW9uIiwiX2xhdW5jaENvbm5lY3Rpb24iLCJzZW5kIiwiZGF0YSIsImN1cnJlbnRTdGF0dXMiLCJjb25uZWN0ZWQiLCJfY2hhbmdlVXJsIiwidXJsIiwiX29uQ29ubmVjdCIsIkVycm9yIiwiX2ZvcmNlZFRvRGlzY29ubmVjdCIsImNsb3NlIiwiX2NsZWFyQ29ubmVjdGlvblRpbWVyIiwic3RhdHVzIiwicmV0cnlDb3VudCIsInN0YXR1c0NoYW5nZWQiLCJmb3JFYWNoQ2FsbGJhY2siLCJjYWxsYmFjayIsIl9jbGVhbnVwIiwibWF5YmVFcnJvciIsImNvbm5lY3Rpb25UaW1lciIsImNsZWFyVGltZW91dCIsIl9nZXRQcm94eVVybCIsInRhcmdldFVybCIsInByb3h5IiwicHJvY2VzcyIsImVudiIsIkhUVFBfUFJPWFkiLCJodHRwX3Byb3h5IiwibWF0Y2giLCJIVFRQU19QUk9YWSIsImh0dHBzX3Byb3h5IiwiRmF5ZVdlYlNvY2tldCIsIk5wbSIsInJlcXVpcmUiLCJkZWZsYXRlIiwiZmF5ZU9wdGlvbnMiLCJleHRlbnNpb25zIiwiYXNzaWduIiwicHJveHlVcmwiLCJvcmlnaW4iLCJzdWJwcm90b2NvbHMiLCJDbGllbnQiLCJzZXRUaW1lb3V0IiwiX2xvc3RDb25uZWN0aW9uIiwiQ29ubmVjdGlvbkVycm9yIiwiQ09OTkVDVF9USU1FT1VUIiwib24iLCJiaW5kRW52aXJvbm1lbnQiLCJjbGllbnRPbklmQ3VycmVudCIsImV2ZW50IiwiZGVzY3JpcHRpb24iLCJhcmdzIiwiZXJyb3IiLCJfZG9udFByaW50RXJyb3JzIiwiX2RlYnVnIiwibWVzc2FnZSIsIlJldHJ5IiwiZm9yY2VkUmVjb25uZWN0RXJyb3IiLCJyZXRyeSIsIm5hbWUiLCJldmVudENhbGxiYWNrcyIsInB1c2giLCJjYiIsImxlbmd0aCIsImZvckVhY2giLCJjb25uZWN0VGltZW91dE1zIiwiUGFja2FnZSIsInRyYWNrZXIiLCJzdGF0dXNMaXN0ZW5lcnMiLCJUcmFja2VyIiwiRGVwZW5kZW5jeSIsImNoYW5nZWQiLCJfcmV0cnkiLCJyZWNvbm5lY3QiLCJfc29ja2pzT3B0aW9ucyIsIl9mb3JjZSIsImNsZWFyIiwiX3JldHJ5Tm93IiwiZGlzY29ubmVjdCIsIl9wZXJtYW5lbnQiLCJfZXJyb3IiLCJyZWFzb24iLCJfcmV0cnlMYXRlciIsIl9vbmxpbmUiLCJ0aW1lb3V0IiwicmV0cnlMYXRlciIsImJpbmQiLCJyZXRyeVRpbWUiLCJEYXRlIiwiZ2V0VGltZSIsImRlcGVuZCIsInRvU29ja2pzVXJsIiwidHJhbnNsYXRlVXJsIiwibmV3U2NoZW1lQmFzZSIsInN1YlBhdGgiLCJzdGFydHNXaXRoIiwiYWJzb2x1dGVVcmwiLCJzdWJzdHIiLCJkZHBVcmxNYXRjaCIsImh0dHBVcmxNYXRjaCIsIm5ld1NjaGVtZSIsInVybEFmdGVyRERQIiwic2xhc2hQb3MiLCJpbmRleE9mIiwiaG9zdCIsInJlc3QiLCJyZXBsYWNlIiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwidXJsQWZ0ZXJIdHRwIiwiX3JlbGF0aXZlVG9TaXRlUm9vdFVybCIsImVuZHNXaXRoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLE1BQU1BLE9BQU8sR0FBQ0MsTUFBZDtBQUFxQixJQUFJQyx5QkFBSjtBQUE4QkYsT0FBTyxDQUFDRyxJQUFSLENBQWEsd0JBQWIsRUFBc0M7QUFBQ0QsMkJBQXlCLENBQUNFLENBQUQsRUFBRztBQUFDRiw2QkFBeUIsR0FBQ0UsQ0FBMUI7QUFBNEI7O0FBQTFELENBQXRDLEVBQWtHLENBQWxHO0FBSW5ERix5QkFBeUIsQ0FBQztBQUN4QkcsUUFBTSxFQUFFLEVBRGdCO0FBRXhCQyxNQUFJLEVBQUUsRUFGa0I7QUFHeEJDLFNBQU8sRUFBRSxFQUhlO0FBSXhCQyxJQUFFLEVBQUUsRUFKb0I7QUFLeEJDLGNBQVksRUFBRSxDQUFDLENBQUQsRUFBSSxDQUFKLENBTFU7QUFNeEJDLFdBQVMsRUFBRSxDQU5hO0FBT3hCQyxRQUFNLEVBQUUsQ0FQZ0I7QUFReEJDLFVBQVEsRUFBRSxDQUFDLENBQUQsRUFBSSxFQUFKO0FBUmMsQ0FBRCxFQVN0QlgsTUFBTSxDQUFDWSxFQVRlLENBQXpCLEM7Ozs7Ozs7Ozs7O0FDSkEsTUFBTWIsT0FBTyxHQUFDQyxNQUFkO0FBQXFCRCxPQUFPLENBQUNjLE1BQVIsQ0FBZTtBQUFDQyxjQUFZLEVBQUMsTUFBSUE7QUFBbEIsQ0FBZjtBQUFnRCxJQUFJQyxNQUFKO0FBQVdoQixPQUFPLENBQUNHLElBQVIsQ0FBYSxlQUFiLEVBQTZCO0FBQUNhLFFBQU0sQ0FBQ1osQ0FBRCxFQUFHO0FBQUNZLFVBQU0sR0FBQ1osQ0FBUDtBQUFTOztBQUFwQixDQUE3QixFQUFtRCxDQUFuRDtBQUFzRCxJQUFJYSxjQUFKO0FBQW1CakIsT0FBTyxDQUFDRyxJQUFSLENBQWEsV0FBYixF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U0FBU0gsV0FBVCxDQUFxQnJGLEdBQXJCLEVBQTBCO0FBQy9CLFNBQU9zRixZQUFZLENBQUN0RixHQUFELEVBQU0sTUFBTixFQUFjLFFBQWQsQ0FBbkI7QUFDRDs7QUFFTSxTQUFTakIsY0FBVCxDQUF3QmlCLEdBQXhCLEVBQTZCO0FBQ2xDLFNBQU9zRixZQUFZLENBQUN0RixHQUFELEVBQU0sSUFBTixFQUFZLFdBQVosQ0FBbkI7QUFDRCxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9zb2NrZXQtc3RyZWFtLWNsaWVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIHNldE1pbmltdW1Ccm93c2VyVmVyc2lvbnMsXG59IGZyb20gXCJtZXRlb3IvbW9kZXJuLWJyb3dzZXJzXCI7XG5cbnNldE1pbmltdW1Ccm93c2VyVmVyc2lvbnMoe1xuICBjaHJvbWU6IDE2LFxuICBlZGdlOiAxMixcbiAgZmlyZWZveDogMTEsXG4gIGllOiAxMCxcbiAgbW9iaWxlU2FmYXJpOiBbNiwgMV0sXG4gIHBoYW50b21qczogMixcbiAgc2FmYXJpOiA3LFxuICBlbGVjdHJvbjogWzAsIDIwXSxcbn0sIG1vZHVsZS5pZCk7XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tIFwibWV0ZW9yL21ldGVvclwiO1xuaW1wb3J0IHsgdG9XZWJzb2NrZXRVcmwgfSBmcm9tIFwiLi91cmxzLmpzXCI7XG5pbXBvcnQgeyBTdHJlYW1DbGllbnRDb21tb24gfSBmcm9tIFwiLi9jb21tb24uanNcIjtcblxuLy8gQHBhcmFtIGVuZHBvaW50IHtTdHJpbmd9IFVSTCB0byBNZXRlb3IgYXBwXG4vLyAgIFwiaHR0cDovL3N1YmRvbWFpbi5tZXRlb3IuY29tL1wiIG9yIFwiL1wiIG9yXG4vLyAgIFwiZGRwK3NvY2tqczovL2Zvby0qKi5tZXRlb3IuY29tL3NvY2tqc1wiXG4vL1xuLy8gV2UgZG8gc29tZSByZXdyaXRpbmcgb2YgdGhlIFVSTCB0byBldmVudHVhbGx5IG1ha2UgaXQgXCJ3czovL1wiIG9yIFwid3NzOi8vXCIsXG4vLyB3aGF0ZXZlciB3YXMgcGFzc2VkIGluLiAgQXQgdGhlIHZlcnkgbGVhc3QsIHdoYXQgTWV0ZW9yLmFic29sdXRlVXJsKCkgcmV0dXJuc1xuLy8gdXMgc2hvdWxkIHdvcmsuXG4vL1xuLy8gV2UgZG9uJ3QgZG8gYW55IGhlYXJ0YmVhdGluZy4gKFRoZSBsb2dpYyB0aGF0IGRpZCB0aGlzIGluIHNvY2tqcyB3YXMgcmVtb3ZlZCxcbi8vIGJlY2F1c2UgaXQgdXNlZCBhIGJ1aWx0LWluIHNvY2tqcyBtZWNoYW5pc20uIFdlIGNvdWxkIGRvIGl0IHdpdGggV2ViU29ja2V0XG4vLyBwaW5nIGZyYW1lcyBvciB3aXRoIEREUC1sZXZlbCBtZXNzYWdlcy4pXG5leHBvcnQgY2xhc3MgQ2xpZW50U3RyZWFtIGV4dGVuZHMgU3RyZWFtQ2xpZW50Q29tbW9uIHtcbiAgY29uc3RydWN0b3IoZW5kcG9pbnQsIG9wdGlvbnMpIHtcbiAgICBzdXBlcihvcHRpb25zKTtcblxuICAgIHRoaXMuY2xpZW50ID0gbnVsbDsgLy8gY3JlYXRlZCBpbiBfbGF1bmNoQ29ubmVjdGlvblxuICAgIHRoaXMuZW5kcG9pbnQgPSBlbmRwb2ludDtcblxuICAgIHRoaXMuaGVhZGVycyA9IHRoaXMub3B0aW9ucy5oZWFkZXJzIHx8IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgdGhpcy5ucG1GYXllT3B0aW9ucyA9IHRoaXMub3B0aW9ucy5ucG1GYXllT3B0aW9ucyB8fCBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gICAgdGhpcy5faW5pdENvbW1vbih0aGlzLm9wdGlvbnMpO1xuXG4gICAgLy8vLyBLaWNrb2ZmIVxuICAgIHRoaXMuX2xhdW5jaENvbm5lY3Rpb24oKTtcbiAgfVxuXG4gIC8vIGRhdGEgaXMgYSB1dGY4IHN0cmluZy4gRGF0YSBzZW50IHdoaWxlIG5vdCBjb25uZWN0ZWQgaXMgZHJvcHBlZCBvblxuICAvLyB0aGUgZmxvb3IsIGFuZCBpdCBpcyB1cCB0aGUgdXNlciBvZiB0aGlzIEFQSSB0byByZXRyYW5zbWl0IGxvc3RcbiAgLy8gbWVzc2FnZXMgb24gJ3Jlc2V0J1xuICBzZW5kKGRhdGEpIHtcbiAgICBpZiAodGhpcy5jdXJyZW50U3RhdHVzLmNvbm5lY3RlZCkge1xuICAgICAgdGhpcy5jbGllbnQuc2VuZChkYXRhKTtcbiAgICB9XG4gIH1cblxuICAvLyBDaGFuZ2VzIHdoZXJlIHRoaXMgY29ubmVjdGlvbiBwb2ludHNcbiAgX2NoYW5nZVVybCh1cmwpIHtcbiAgICB0aGlzLmVuZHBvaW50ID0gdXJsO1xuICB9XG5cbiAgX29uQ29ubmVjdChjbGllbnQpIHtcbiAgICBpZiAoY2xpZW50ICE9PSB0aGlzLmNsaWVudCkge1xuICAgICAgLy8gVGhpcyBjb25uZWN0aW9uIGlzIG5vdCBmcm9tIHRoZSBsYXN0IGNhbGwgdG8gX2xhdW5jaENvbm5lY3Rpb24uXG4gICAgICAvLyBCdXQgX2xhdW5jaENvbm5lY3Rpb24gY2FsbHMgX2NsZWFudXAgd2hpY2ggY2xvc2VzIHByZXZpb3VzIGNvbm5lY3Rpb25zLlxuICAgICAgLy8gSXQncyBvdXIgYmVsaWVmIHRoYXQgdGhpcyBzdGlmbGVzIGZ1dHVyZSAnb3BlbicgZXZlbnRzLCBidXQgbWF5YmVcbiAgICAgIC8vIHdlIGFyZSB3cm9uZz9cbiAgICAgIHRocm93IG5ldyBFcnJvcignR290IG9wZW4gZnJvbSBpbmFjdGl2ZSBjbGllbnQgJyArICEhdGhpcy5jbGllbnQpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9mb3JjZWRUb0Rpc2Nvbm5lY3QpIHtcbiAgICAgIC8vIFdlIHdlcmUgYXNrZWQgdG8gZGlzY29ubmVjdCBiZXR3ZWVuIHRyeWluZyB0byBvcGVuIHRoZSBjb25uZWN0aW9uIGFuZFxuICAgICAgLy8gYWN0dWFsbHkgb3BlbmluZyBpdC4gTGV0J3MganVzdCBwcmV0ZW5kIHRoaXMgbmV2ZXIgaGFwcGVuZWQuXG4gICAgICB0aGlzLmNsaWVudC5jbG9zZSgpO1xuICAgICAgdGhpcy5jbGllbnQgPSBudWxsO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmN1cnJlbnRTdGF0dXMuY29ubmVjdGVkKSB7XG4gICAgICAvLyBXZSBhbHJlYWR5IGhhdmUgYSBjb25uZWN0aW9uLiBJdCBtdXN0IGhhdmUgYmVlbiB0aGUgY2FzZSB0aGF0IHdlXG4gICAgICAvLyBzdGFydGVkIHR3byBwYXJhbGxlbCBjb25uZWN0aW9uIGF0dGVtcHRzIChiZWNhdXNlIHdlIHdhbnRlZCB0b1xuICAgICAgLy8gJ3JlY29ubmVjdCBub3cnIG9uIGEgaGFuZ2luZyBjb25uZWN0aW9uIGFuZCB3ZSBoYWQgbm8gd2F5IHRvIGNhbmNlbCB0aGVcbiAgICAgIC8vIGNvbm5lY3Rpb24gYXR0ZW1wdC4pIEJ1dCB0aGlzIHNob3VsZG4ndCBoYXBwZW4gKHNpbWlsYXJseSB0byB0aGUgY2xpZW50XG4gICAgICAvLyAhPT0gdGhpcy5jbGllbnQgY2hlY2sgYWJvdmUpLlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUd28gcGFyYWxsZWwgY29ubmVjdGlvbnM/Jyk7XG4gICAgfVxuXG4gICAgdGhpcy5fY2xlYXJDb25uZWN0aW9uVGltZXIoKTtcblxuICAgIC8vIHVwZGF0ZSBzdGF0dXNcbiAgICB0aGlzLmN1cnJlbnRTdGF0dXMuc3RhdHVzID0gJ2Nvbm5lY3RlZCc7XG4gICAgdGhpcy5jdXJyZW50U3RhdHVzLmNvbm5lY3RlZCA9IHRydWU7XG4gICAgdGhpcy5jdXJyZW50U3RhdHVzLnJldHJ5Q291bnQgPSAwO1xuICAgIHRoaXMuc3RhdHVzQ2hhbmdlZCgpO1xuXG4gICAgLy8gZmlyZSByZXNldHMuIFRoaXMgbXVzdCBjb21lIGFmdGVyIHN0YXR1cyBjaGFuZ2Ugc28gdGhhdCBjbGllbnRzXG4gICAgLy8gY2FuIGNhbGwgc2VuZCBmcm9tIHdpdGhpbiBhIHJlc2V0IGNhbGxiYWNrLlxuICAgIHRoaXMuZm9yRWFjaENhbGxiYWNrKCdyZXNldCcsIGNhbGxiYWNrID0+IHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfSk7XG4gIH1cblxuICBfY2xlYW51cChtYXliZUVycm9yKSB7XG4gICAgdGhpcy5fY2xlYXJDb25uZWN0aW9uVGltZXIoKTtcbiAgICBpZiAodGhpcy5jbGllbnQpIHtcbiAgICAgIHZhciBjbGllbnQgPSB0aGlzLmNsaWVudDtcbiAgICAgIHRoaXMuY2xpZW50ID0gbnVsbDtcbiAgICAgIGNsaWVudC5jbG9zZSgpO1xuXG4gICAgICB0aGlzLmZvckVhY2hDYWxsYmFjaygnZGlzY29ubmVjdCcsIGNhbGxiYWNrID0+IHtcbiAgICAgICAgY2FsbGJhY2sobWF5YmVFcnJvcik7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBfY2xlYXJDb25uZWN0aW9uVGltZXIoKSB7XG4gICAgaWYgKHRoaXMuY29ubmVjdGlvblRpbWVyKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5jb25uZWN0aW9uVGltZXIpO1xuICAgICAgdGhpcy5jb25uZWN0aW9uVGltZXIgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIF9nZXRQcm94eVVybCh0YXJnZXRVcmwpIHtcbiAgICAvLyBTaW1pbGFyIHRvIGNvZGUgaW4gdG9vbHMvaHR0cC1oZWxwZXJzLmpzLlxuICAgIHZhciBwcm94eSA9IHByb2Nlc3MuZW52LkhUVFBfUFJPWFkgfHwgcHJvY2Vzcy5lbnYuaHR0cF9wcm94eSB8fCBudWxsO1xuICAgIC8vIGlmIHdlJ3JlIGdvaW5nIHRvIGEgc2VjdXJlIHVybCwgdHJ5IHRoZSBodHRwc19wcm94eSBlbnYgdmFyaWFibGUgZmlyc3QuXG4gICAgaWYgKHRhcmdldFVybC5tYXRjaCgvXndzczovKSkge1xuICAgICAgcHJveHkgPSBwcm9jZXNzLmVudi5IVFRQU19QUk9YWSB8fCBwcm9jZXNzLmVudi5odHRwc19wcm94eSB8fCBwcm94eTtcbiAgICB9XG4gICAgcmV0dXJuIHByb3h5O1xuICB9XG5cbiAgX2xhdW5jaENvbm5lY3Rpb24oKSB7XG4gICAgdGhpcy5fY2xlYW51cCgpOyAvLyBjbGVhbnVwIHRoZSBvbGQgc29ja2V0LCBpZiB0aGVyZSB3YXMgb25lLlxuXG4gICAgLy8gU2luY2Ugc2VydmVyLXRvLXNlcnZlciBERFAgaXMgc3RpbGwgYW4gZXhwZXJpbWVudGFsIGZlYXR1cmUsIHdlIG9ubHlcbiAgICAvLyByZXF1aXJlIHRoZSBtb2R1bGUgaWYgd2UgYWN0dWFsbHkgY3JlYXRlIGEgc2VydmVyLXRvLXNlcnZlclxuICAgIC8vIGNvbm5lY3Rpb24uXG4gICAgdmFyIEZheWVXZWJTb2NrZXQgPSBOcG0ucmVxdWlyZSgnZmF5ZS13ZWJzb2NrZXQnKTtcbiAgICB2YXIgZGVmbGF0ZSA9IE5wbS5yZXF1aXJlKCdwZXJtZXNzYWdlLWRlZmxhdGUnKTtcblxuICAgIHZhciB0YXJnZXRVcmwgPSB0b1dlYnNvY2tldFVybCh0aGlzLmVuZHBvaW50KTtcbiAgICB2YXIgZmF5ZU9wdGlvbnMgPSB7XG4gICAgICBoZWFkZXJzOiB0aGlzLmhlYWRlcnMsXG4gICAgICBleHRlbnNpb25zOiBbZGVmbGF0ZV1cbiAgICB9O1xuICAgIGZheWVPcHRpb25zID0gT2JqZWN0LmFzc2lnbihmYXllT3B0aW9ucywgdGhpcy5ucG1GYXllT3B0aW9ucyk7XG4gICAgdmFyIHByb3h5VXJsID0gdGhpcy5fZ2V0UHJveHlVcmwodGFyZ2V0VXJsKTtcbiAgICBpZiAocHJveHlVcmwpIHtcbiAgICAgIGZheWVPcHRpb25zLnByb3h5ID0geyBvcmlnaW46IHByb3h5VXJsIH07XG4gICAgfVxuXG4gICAgLy8gV2Ugd291bGQgbGlrZSB0byBzcGVjaWZ5ICdkZHAnIGFzIHRoZSBzdWJwcm90b2NvbCBoZXJlLiBUaGUgbnBtIG1vZHVsZSB3ZVxuICAgIC8vIHVzZWQgdG8gdXNlIGFzIGEgY2xpZW50IHdvdWxkIGZhaWwgdGhlIGhhbmRzaGFrZSBpZiB3ZSBhc2sgZm9yIGFcbiAgICAvLyBzdWJwcm90b2NvbCBhbmQgdGhlIHNlcnZlciBkb2Vzbid0IHNlbmQgb25lIGJhY2sgKGFuZCBzb2NranMgZG9lc24ndCkuXG4gICAgLy8gRmF5ZSBkb2Vzbid0IGhhdmUgdGhhdCBiZWhhdmlvcjsgaXQncyB1bmNsZWFyIGZyb20gcmVhZGluZyBSRkMgNjQ1NSBpZlxuICAgIC8vIEZheWUgaXMgZXJyb25lb3VzIG9yIG5vdC4gIFNvIGZvciBub3csIHdlIGRvbid0IHNwZWNpZnkgcHJvdG9jb2xzLlxuICAgIHZhciBzdWJwcm90b2NvbHMgPSBbXTtcblxuICAgIHZhciBjbGllbnQgPSAodGhpcy5jbGllbnQgPSBuZXcgRmF5ZVdlYlNvY2tldC5DbGllbnQoXG4gICAgICB0YXJnZXRVcmwsXG4gICAgICBzdWJwcm90b2NvbHMsXG4gICAgICBmYXllT3B0aW9uc1xuICAgICkpO1xuXG4gICAgdGhpcy5fY2xlYXJDb25uZWN0aW9uVGltZXIoKTtcbiAgICB0aGlzLmNvbm5lY3Rpb25UaW1lciA9IE1ldGVvci5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuX2xvc3RDb25uZWN0aW9uKG5ldyB0aGlzLkNvbm5lY3Rpb25FcnJvcignRERQIGNvbm5lY3Rpb24gdGltZWQgb3V0JykpO1xuICAgIH0sIHRoaXMuQ09OTkVDVF9USU1FT1VUKTtcblxuICAgIHRoaXMuY2xpZW50Lm9uKFxuICAgICAgJ29wZW4nLFxuICAgICAgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9vbkNvbm5lY3QoY2xpZW50KTtcbiAgICAgIH0sICdzdHJlYW0gY29ubmVjdCBjYWxsYmFjaycpXG4gICAgKTtcblxuICAgIHZhciBjbGllbnRPbklmQ3VycmVudCA9IChldmVudCwgZGVzY3JpcHRpb24sIGNhbGxiYWNrKSA9PiB7XG4gICAgICB0aGlzLmNsaWVudC5vbihcbiAgICAgICAgZXZlbnQsXG4gICAgICAgIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgICAvLyBJZ25vcmUgZXZlbnRzIGZyb20gYW55IGNvbm5lY3Rpb24gd2UndmUgYWxyZWFkeSBjbGVhbmVkIHVwLlxuICAgICAgICAgIGlmIChjbGllbnQgIT09IHRoaXMuY2xpZW50KSByZXR1cm47XG4gICAgICAgICAgY2FsbGJhY2soLi4uYXJncyk7XG4gICAgICAgIH0sIGRlc2NyaXB0aW9uKVxuICAgICAgKTtcbiAgICB9O1xuXG4gICAgY2xpZW50T25JZkN1cnJlbnQoJ2Vycm9yJywgJ3N0cmVhbSBlcnJvciBjYWxsYmFjaycsIGVycm9yID0+IHtcbiAgICAgIGlmICghdGhpcy5vcHRpb25zLl9kb250UHJpbnRFcnJvcnMpXG4gICAgICAgIE1ldGVvci5fZGVidWcoJ3N0cmVhbSBlcnJvcicsIGVycm9yLm1lc3NhZ2UpO1xuXG4gICAgICAvLyBGYXllJ3MgJ2Vycm9yJyBvYmplY3QgaXMgbm90IGEgSlMgZXJyb3IgKGFuZCBhbW9uZyBvdGhlciB0aGluZ3MsXG4gICAgICAvLyBkb2Vzbid0IHN0cmluZ2lmeSB3ZWxsKS4gQ29udmVydCBpdCB0byBvbmUuXG4gICAgICB0aGlzLl9sb3N0Q29ubmVjdGlvbihuZXcgdGhpcy5Db25uZWN0aW9uRXJyb3IoZXJyb3IubWVzc2FnZSkpO1xuICAgIH0pO1xuXG4gICAgY2xpZW50T25JZkN1cnJlbnQoJ2Nsb3NlJywgJ3N0cmVhbSBjbG9zZSBjYWxsYmFjaycsICgpID0+IHtcbiAgICAgIHRoaXMuX2xvc3RDb25uZWN0aW9uKCk7XG4gICAgfSk7XG5cbiAgICBjbGllbnRPbklmQ3VycmVudCgnbWVzc2FnZScsICdzdHJlYW0gbWVzc2FnZSBjYWxsYmFjaycsIG1lc3NhZ2UgPT4ge1xuICAgICAgLy8gSWdub3JlIGJpbmFyeSBmcmFtZXMsIHdoZXJlIG1lc3NhZ2UuZGF0YSBpcyBhIEJ1ZmZlclxuICAgICAgaWYgKHR5cGVvZiBtZXNzYWdlLmRhdGEgIT09ICdzdHJpbmcnKSByZXR1cm47XG5cbiAgICAgIHRoaXMuZm9yRWFjaENhbGxiYWNrKCdtZXNzYWdlJywgY2FsbGJhY2sgPT4ge1xuICAgICAgICBjYWxsYmFjayhtZXNzYWdlLmRhdGEpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFJldHJ5IH0gZnJvbSAnbWV0ZW9yL3JldHJ5JztcblxuY29uc3QgZm9yY2VkUmVjb25uZWN0RXJyb3IgPSBuZXcgRXJyb3IoXCJmb3JjZWQgcmVjb25uZWN0XCIpO1xuXG5leHBvcnQgY2xhc3MgU3RyZWFtQ2xpZW50Q29tbW9uIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IHtcbiAgICAgIHJldHJ5OiB0cnVlLFxuICAgICAgLi4uKG9wdGlvbnMgfHwgbnVsbCksXG4gICAgfTtcblxuICAgIHRoaXMuQ29ubmVjdGlvbkVycm9yID1cbiAgICAgIG9wdGlvbnMgJiYgb3B0aW9ucy5Db25uZWN0aW9uRXJyb3IgfHwgRXJyb3I7XG4gIH1cblxuICAvLyBSZWdpc3RlciBmb3IgY2FsbGJhY2tzLlxuICBvbihuYW1lLCBjYWxsYmFjaykge1xuICAgIGlmIChuYW1lICE9PSAnbWVzc2FnZScgJiYgbmFtZSAhPT0gJ3Jlc2V0JyAmJiBuYW1lICE9PSAnZGlzY29ubmVjdCcpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Vua25vd24gZXZlbnQgdHlwZTogJyArIG5hbWUpO1xuXG4gICAgaWYgKCF0aGlzLmV2ZW50Q2FsbGJhY2tzW25hbWVdKSB0aGlzLmV2ZW50Q2FsbGJhY2tzW25hbWVdID0gW107XG4gICAgdGhpcy5ldmVudENhbGxiYWNrc1tuYW1lXS5wdXNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIGZvckVhY2hDYWxsYmFjayhuYW1lLCBjYikge1xuICAgIGlmICghdGhpcy5ldmVudENhbGxiYWNrc1tuYW1lXSB8fCAhdGhpcy5ldmVudENhbGxiYWNrc1tuYW1lXS5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmV2ZW50Q2FsbGJhY2tzW25hbWVdLmZvckVhY2goY2IpO1xuICB9XG5cbiAgX2luaXRDb21tb24ob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgICAvLy8vIENvbnN0YW50c1xuXG4gICAgLy8gaG93IGxvbmcgdG8gd2FpdCB1bnRpbCB3ZSBkZWNsYXJlIHRoZSBjb25uZWN0aW9uIGF0dGVtcHRcbiAgICAvLyBmYWlsZWQuXG4gICAgdGhpcy5DT05ORUNUX1RJTUVPVVQgPSBvcHRpb25zLmNvbm5lY3RUaW1lb3V0TXMgfHwgMTAwMDA7XG5cbiAgICB0aGlzLmV2ZW50Q2FsbGJhY2tzID0gT2JqZWN0LmNyZWF0ZShudWxsKTsgLy8gbmFtZSAtPiBbY2FsbGJhY2tdXG5cbiAgICB0aGlzLl9mb3JjZWRUb0Rpc2Nvbm5lY3QgPSBmYWxzZTtcblxuICAgIC8vLy8gUmVhY3RpdmUgc3RhdHVzXG4gICAgdGhpcy5jdXJyZW50U3RhdHVzID0ge1xuICAgICAgc3RhdHVzOiAnY29ubmVjdGluZycsXG4gICAgICBjb25uZWN0ZWQ6IGZhbHNlLFxuICAgICAgcmV0cnlDb3VudDogMFxuICAgIH07XG5cbiAgICBpZiAoUGFja2FnZS50cmFja2VyKSB7XG4gICAgICB0aGlzLnN0YXR1c0xpc3RlbmVycyA9IG5ldyBQYWNrYWdlLnRyYWNrZXIuVHJhY2tlci5EZXBlbmRlbmN5KCk7XG4gICAgfVxuXG4gICAgdGhpcy5zdGF0dXNDaGFuZ2VkID0gKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuc3RhdHVzTGlzdGVuZXJzKSB7XG4gICAgICAgIHRoaXMuc3RhdHVzTGlzdGVuZXJzLmNoYW5nZWQoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8vLyBSZXRyeSBsb2dpY1xuICAgIHRoaXMuX3JldHJ5ID0gbmV3IFJldHJ5KCk7XG4gICAgdGhpcy5jb25uZWN0aW9uVGltZXIgPSBudWxsO1xuICB9XG5cbiAgLy8gVHJpZ2dlciBhIHJlY29ubmVjdC5cbiAgcmVjb25uZWN0KG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gICAgaWYgKG9wdGlvbnMudXJsKSB7XG4gICAgICB0aGlzLl9jaGFuZ2VVcmwob3B0aW9ucy51cmwpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLl9zb2NranNPcHRpb25zKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuX3NvY2tqc09wdGlvbnMgPSBvcHRpb25zLl9zb2NranNPcHRpb25zO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmN1cnJlbnRTdGF0dXMuY29ubmVjdGVkKSB7XG4gICAgICBpZiAob3B0aW9ucy5fZm9yY2UgfHwgb3B0aW9ucy51cmwpIHtcbiAgICAgICAgdGhpcy5fbG9zdENvbm5lY3Rpb24oZm9yY2VkUmVjb25uZWN0RXJyb3IpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGlmIHdlJ3JlIG1pZC1jb25uZWN0aW9uLCBzdG9wIGl0LlxuICAgIGlmICh0aGlzLmN1cnJlbnRTdGF0dXMuc3RhdHVzID09PSAnY29ubmVjdGluZycpIHtcbiAgICAgIC8vIFByZXRlbmQgaXQncyBhIGNsZWFuIGNsb3NlLlxuICAgICAgdGhpcy5fbG9zdENvbm5lY3Rpb24oKTtcbiAgICB9XG5cbiAgICB0aGlzLl9yZXRyeS5jbGVhcigpO1xuICAgIHRoaXMuY3VycmVudFN0YXR1cy5yZXRyeUNvdW50IC09IDE7IC8vIGRvbid0IGNvdW50IG1hbnVhbCByZXRyaWVzXG4gICAgdGhpcy5fcmV0cnlOb3coKTtcbiAgfVxuXG4gIGRpc2Nvbm5lY3Qob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgICAvLyBGYWlsZWQgaXMgcGVybWFuZW50LiBJZiB3ZSdyZSBmYWlsZWQsIGRvbid0IGxldCBwZW9wbGUgZ28gYmFja1xuICAgIC8vIG9ubGluZSBieSBjYWxsaW5nICdkaXNjb25uZWN0JyB0aGVuICdyZWNvbm5lY3QnLlxuICAgIGlmICh0aGlzLl9mb3JjZWRUb0Rpc2Nvbm5lY3QpIHJldHVybjtcblxuICAgIC8vIElmIF9wZXJtYW5lbnQgaXMgc2V0LCBwZXJtYW5lbnRseSBkaXNjb25uZWN0IGEgc3RyZWFtLiBPbmNlIGEgc3RyZWFtXG4gICAgLy8gaXMgZm9yY2VkIHRvIGRpc2Nvbm5lY3QsIGl0IGNhbiBuZXZlciByZWNvbm5lY3QuIFRoaXMgaXMgZm9yXG4gICAgLy8gZXJyb3IgY2FzZXMgc3VjaCBhcyBkZHAgdmVyc2lvbiBtaXNtYXRjaCwgd2hlcmUgdHJ5aW5nIGFnYWluXG4gICAgLy8gd29uJ3QgZml4IHRoZSBwcm9ibGVtLlxuICAgIGlmIChvcHRpb25zLl9wZXJtYW5lbnQpIHtcbiAgICAgIHRoaXMuX2ZvcmNlZFRvRGlzY29ubmVjdCA9IHRydWU7XG4gICAgfVxuXG4gICAgdGhpcy5fY2xlYW51cCgpO1xuICAgIHRoaXMuX3JldHJ5LmNsZWFyKCk7XG5cbiAgICB0aGlzLmN1cnJlbnRTdGF0dXMgPSB7XG4gICAgICBzdGF0dXM6IG9wdGlvbnMuX3Blcm1hbmVudCA/ICdmYWlsZWQnIDogJ29mZmxpbmUnLFxuICAgICAgY29ubmVjdGVkOiBmYWxzZSxcbiAgICAgIHJldHJ5Q291bnQ6IDBcbiAgICB9O1xuXG4gICAgaWYgKG9wdGlvbnMuX3Blcm1hbmVudCAmJiBvcHRpb25zLl9lcnJvcilcbiAgICAgIHRoaXMuY3VycmVudFN0YXR1cy5yZWFzb24gPSBvcHRpb25zLl9lcnJvcjtcblxuICAgIHRoaXMuc3RhdHVzQ2hhbmdlZCgpO1xuICB9XG5cbiAgLy8gbWF5YmVFcnJvciBpcyBzZXQgdW5sZXNzIGl0J3MgYSBjbGVhbiBwcm90b2NvbC1sZXZlbCBjbG9zZS5cbiAgX2xvc3RDb25uZWN0aW9uKG1heWJlRXJyb3IpIHtcbiAgICB0aGlzLl9jbGVhbnVwKG1heWJlRXJyb3IpO1xuICAgIHRoaXMuX3JldHJ5TGF0ZXIobWF5YmVFcnJvcik7IC8vIHNldHMgc3RhdHVzLiBubyBuZWVkIHRvIGRvIGl0IGhlcmUuXG4gIH1cblxuICAvLyBmaXJlZCB3aGVuIHdlIGRldGVjdCB0aGF0IHdlJ3ZlIGdvbmUgb25saW5lLiB0cnkgdG8gcmVjb25uZWN0XG4gIC8vIGltbWVkaWF0ZWx5LlxuICBfb25saW5lKCkge1xuICAgIC8vIGlmIHdlJ3ZlIHJlcXVlc3RlZCB0byBiZSBvZmZsaW5lIGJ5IGRpc2Nvbm5lY3RpbmcsIGRvbid0IHJlY29ubmVjdC5cbiAgICBpZiAodGhpcy5jdXJyZW50U3RhdHVzLnN0YXR1cyAhPSAnb2ZmbGluZScpIHRoaXMucmVjb25uZWN0KCk7XG4gIH1cblxuICBfcmV0cnlMYXRlcihtYXliZUVycm9yKSB7XG4gICAgdmFyIHRpbWVvdXQgPSAwO1xuICAgIGlmICh0aGlzLm9wdGlvbnMucmV0cnkgfHxcbiAgICAgICAgbWF5YmVFcnJvciA9PT0gZm9yY2VkUmVjb25uZWN0RXJyb3IpIHtcbiAgICAgIHRpbWVvdXQgPSB0aGlzLl9yZXRyeS5yZXRyeUxhdGVyKFxuICAgICAgICB0aGlzLmN1cnJlbnRTdGF0dXMucmV0cnlDb3VudCxcbiAgICAgICAgdGhpcy5fcmV0cnlOb3cuYmluZCh0aGlzKVxuICAgICAgKTtcbiAgICAgIHRoaXMuY3VycmVudFN0YXR1cy5zdGF0dXMgPSAnd2FpdGluZyc7XG4gICAgICB0aGlzLmN1cnJlbnRTdGF0dXMucmV0cnlUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgKyB0aW1lb3V0O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmN1cnJlbnRTdGF0dXMuc3RhdHVzID0gJ2ZhaWxlZCc7XG4gICAgICBkZWxldGUgdGhpcy5jdXJyZW50U3RhdHVzLnJldHJ5VGltZTtcbiAgICB9XG5cbiAgICB0aGlzLmN1cnJlbnRTdGF0dXMuY29ubmVjdGVkID0gZmFsc2U7XG4gICAgdGhpcy5zdGF0dXNDaGFuZ2VkKCk7XG4gIH1cblxuICBfcmV0cnlOb3coKSB7XG4gICAgaWYgKHRoaXMuX2ZvcmNlZFRvRGlzY29ubmVjdCkgcmV0dXJuO1xuXG4gICAgdGhpcy5jdXJyZW50U3RhdHVzLnJldHJ5Q291bnQgKz0gMTtcbiAgICB0aGlzLmN1cnJlbnRTdGF0dXMuc3RhdHVzID0gJ2Nvbm5lY3RpbmcnO1xuICAgIHRoaXMuY3VycmVudFN0YXR1cy5jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICBkZWxldGUgdGhpcy5jdXJyZW50U3RhdHVzLnJldHJ5VGltZTtcbiAgICB0aGlzLnN0YXR1c0NoYW5nZWQoKTtcblxuICAgIHRoaXMuX2xhdW5jaENvbm5lY3Rpb24oKTtcbiAgfVxuXG4gIC8vIEdldCBjdXJyZW50IHN0YXR1cy4gUmVhY3RpdmUuXG4gIHN0YXR1cygpIHtcbiAgICBpZiAodGhpcy5zdGF0dXNMaXN0ZW5lcnMpIHtcbiAgICAgIHRoaXMuc3RhdHVzTGlzdGVuZXJzLmRlcGVuZCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5jdXJyZW50U3RhdHVzO1xuICB9XG59XG4iLCIvLyBAcGFyYW0gdXJsIHtTdHJpbmd9IFVSTCB0byBNZXRlb3IgYXBwLCBlZzpcbi8vICAgXCIvXCIgb3IgXCJtYWRld2l0aC5tZXRlb3IuY29tXCIgb3IgXCJodHRwczovL2Zvby5tZXRlb3IuY29tXCJcbi8vICAgb3IgXCJkZHArc29ja2pzOi8vZGRwLS0qKioqLWZvby5tZXRlb3IuY29tL3NvY2tqc1wiXG4vLyBAcmV0dXJucyB7U3RyaW5nfSBVUkwgdG8gdGhlIGVuZHBvaW50IHdpdGggdGhlIHNwZWNpZmljIHNjaGVtZSBhbmQgc3ViUGF0aCwgZS5nLlxuLy8gZm9yIHNjaGVtZSBcImh0dHBcIiBhbmQgc3ViUGF0aCBcInNvY2tqc1wiXG4vLyAgIFwiaHR0cDovL3N1YmRvbWFpbi5tZXRlb3IuY29tL3NvY2tqc1wiIG9yIFwiL3NvY2tqc1wiXG4vLyAgIG9yIFwiaHR0cHM6Ly9kZHAtLTEyMzQtZm9vLm1ldGVvci5jb20vc29ja2pzXCJcbmZ1bmN0aW9uIHRyYW5zbGF0ZVVybCh1cmwsIG5ld1NjaGVtZUJhc2UsIHN1YlBhdGgpIHtcbiAgaWYgKCFuZXdTY2hlbWVCYXNlKSB7XG4gICAgbmV3U2NoZW1lQmFzZSA9ICdodHRwJztcbiAgfVxuXG4gIGlmIChzdWJQYXRoICE9PSBcInNvY2tqc1wiICYmIHVybC5zdGFydHNXaXRoKFwiL1wiKSkge1xuICAgIHVybCA9IE1ldGVvci5hYnNvbHV0ZVVybCh1cmwuc3Vic3RyKDEpKTtcbiAgfVxuXG4gIHZhciBkZHBVcmxNYXRjaCA9IHVybC5tYXRjaCgvXmRkcChpPylcXCtzb2NranM6XFwvXFwvLyk7XG4gIHZhciBodHRwVXJsTWF0Y2ggPSB1cmwubWF0Y2goL15odHRwKHM/KTpcXC9cXC8vKTtcbiAgdmFyIG5ld1NjaGVtZTtcbiAgaWYgKGRkcFVybE1hdGNoKSB7XG4gICAgLy8gUmVtb3ZlIHNjaGVtZSBhbmQgc3BsaXQgb2ZmIHRoZSBob3N0LlxuICAgIHZhciB1cmxBZnRlckREUCA9IHVybC5zdWJzdHIoZGRwVXJsTWF0Y2hbMF0ubGVuZ3RoKTtcbiAgICBuZXdTY2hlbWUgPSBkZHBVcmxNYXRjaFsxXSA9PT0gJ2knID8gbmV3U2NoZW1lQmFzZSA6IG5ld1NjaGVtZUJhc2UgKyAncyc7XG4gICAgdmFyIHNsYXNoUG9zID0gdXJsQWZ0ZXJERFAuaW5kZXhPZignLycpO1xuICAgIHZhciBob3N0ID0gc2xhc2hQb3MgPT09IC0xID8gdXJsQWZ0ZXJERFAgOiB1cmxBZnRlckREUC5zdWJzdHIoMCwgc2xhc2hQb3MpO1xuICAgIHZhciByZXN0ID0gc2xhc2hQb3MgPT09IC0xID8gJycgOiB1cmxBZnRlckREUC5zdWJzdHIoc2xhc2hQb3MpO1xuXG4gICAgLy8gSW4gdGhlIGhvc3QgKE9OTFkhKSwgY2hhbmdlICcqJyBjaGFyYWN0ZXJzIGludG8gcmFuZG9tIGRpZ2l0cy4gVGhpc1xuICAgIC8vIGFsbG93cyBkaWZmZXJlbnQgc3RyZWFtIGNvbm5lY3Rpb25zIHRvIGNvbm5lY3QgdG8gZGlmZmVyZW50IGhvc3RuYW1lc1xuICAgIC8vIGFuZCBhdm9pZCBicm93c2VyIHBlci1ob3N0bmFtZSBjb25uZWN0aW9uIGxpbWl0cy5cbiAgICBob3N0ID0gaG9zdC5yZXBsYWNlKC9cXCovZywgKCkgPT4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTApKTtcblxuICAgIHJldHVybiBuZXdTY2hlbWUgKyAnOi8vJyArIGhvc3QgKyByZXN0O1xuICB9IGVsc2UgaWYgKGh0dHBVcmxNYXRjaCkge1xuICAgIG5ld1NjaGVtZSA9ICFodHRwVXJsTWF0Y2hbMV0gPyBuZXdTY2hlbWVCYXNlIDogbmV3U2NoZW1lQmFzZSArICdzJztcbiAgICB2YXIgdXJsQWZ0ZXJIdHRwID0gdXJsLnN1YnN0cihodHRwVXJsTWF0Y2hbMF0ubGVuZ3RoKTtcbiAgICB1cmwgPSBuZXdTY2hlbWUgKyAnOi8vJyArIHVybEFmdGVySHR0cDtcbiAgfVxuXG4gIC8vIFByZWZpeCBGUUROcyBidXQgbm90IHJlbGF0aXZlIFVSTHNcbiAgaWYgKHVybC5pbmRleE9mKCc6Ly8nKSA9PT0gLTEgJiYgIXVybC5zdGFydHNXaXRoKCcvJykpIHtcbiAgICB1cmwgPSBuZXdTY2hlbWVCYXNlICsgJzovLycgKyB1cmw7XG4gIH1cblxuICAvLyBYWFggVGhpcyBpcyBub3Qgd2hhdCB3ZSBzaG91bGQgYmUgZG9pbmc6IGlmIEkgaGF2ZSBhIHNpdGVcbiAgLy8gZGVwbG95ZWQgYXQgXCIvZm9vXCIsIHRoZW4gRERQLmNvbm5lY3QoXCIvXCIpIHNob3VsZCBhY3R1YWxseSBjb25uZWN0XG4gIC8vIHRvIFwiL1wiLCBub3QgdG8gXCIvZm9vXCIuIFwiL1wiIGlzIGFuIGFic29sdXRlIHBhdGguIChDb250cmFzdDogaWZcbiAgLy8gZGVwbG95ZWQgYXQgXCIvZm9vXCIsIGl0IHdvdWxkIGJlIHJlYXNvbmFibGUgZm9yIEREUC5jb25uZWN0KFwiYmFyXCIpXG4gIC8vIHRvIGNvbm5lY3QgdG8gXCIvZm9vL2JhclwiKS5cbiAgLy9cbiAgLy8gV2Ugc2hvdWxkIG1ha2UgdGhpcyBwcm9wZXJseSBob25vciBhYnNvbHV0ZSBwYXRocyByYXRoZXIgdGhhblxuICAvLyBmb3JjaW5nIHRoZSBwYXRoIHRvIGJlIHJlbGF0aXZlIHRvIHRoZSBzaXRlIHJvb3QuIFNpbXVsdGFuZW91c2x5LFxuICAvLyB3ZSBzaG91bGQgc2V0IEREUF9ERUZBVUxUX0NPTk5FQ1RJT05fVVJMIHRvIGluY2x1ZGUgdGhlIHNpdGVcbiAgLy8gcm9vdC4gU2VlIGFsc28gY2xpZW50X2NvbnZlbmllbmNlLmpzICNSYXRpb25hbGl6aW5nUmVsYXRpdmVERFBVUkxzXG4gIHVybCA9IE1ldGVvci5fcmVsYXRpdmVUb1NpdGVSb290VXJsKHVybCk7XG5cbiAgaWYgKHVybC5lbmRzV2l0aCgnLycpKSByZXR1cm4gdXJsICsgc3ViUGF0aDtcbiAgZWxzZSByZXR1cm4gdXJsICsgJy8nICsgc3ViUGF0aDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvU29ja2pzVXJsKHVybCkge1xuICByZXR1cm4gdHJhbnNsYXRlVXJsKHVybCwgJ2h0dHAnLCAnc29ja2pzJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b1dlYnNvY2tldFVybCh1cmwpIHtcbiAgcmV0dXJuIHRyYW5zbGF0ZVVybCh1cmwsICd3cycsICd3ZWJzb2NrZXQnKTtcbn1cbiJdfQ==
