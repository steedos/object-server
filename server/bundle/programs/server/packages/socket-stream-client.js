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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc29ja2V0LXN0cmVhbS1jbGllbnQvc2VydmVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zb2NrZXQtc3RyZWFtLWNsaWVudC9ub2RlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zb2NrZXQtc3RyZWFtLWNsaWVudC9jb21tb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3NvY2tldC1zdHJlYW0tY2xpZW50L3VybHMuanMiXSwibmFtZXMiOlsibW9kdWxlMSIsIm1vZHVsZSIsInNldE1pbmltdW1Ccm93c2VyVmVyc2lvbnMiLCJsaW5rIiwidiIsImNocm9tZSIsImVkZ2UiLCJmaXJlZm94IiwiaWUiLCJtb2JpbGVTYWZhcmkiLCJwaGFudG9tanMiLCJzYWZhcmkiLCJlbGVjdHJvbiIsImlkIiwiZXhwb3J0IiwiQ2xpZW50U3RyZWFtIiwiTWV0ZW9yIiwidG9XZWJzb2NrZXRVcmwiLCJTdHJlYW1DbGllbnRDb21tb24iLCJjb25zdHJ1Y3RvciIsImVuZHBvaW50Iiwib3B0aW9ucyIsImNsaWVudCIsImhlYWRlcnMiLCJPYmplY3QiLCJjcmVhdGUiLCJucG1GYXllT3B0aW9ucyIsIl9pbml0Q29tbW9uIiwiX2xhdW5jaENvbm5lY3Rpb24iLCJzZW5kIiwiZGF0YSIsImN1cnJlbnRTdGF0dXMiLCJjb25uZWN0ZWQiLCJfY2hhbmdlVXJsIiwidXJsIiwiX29uQ29ubmVjdCIsIkVycm9yIiwiX2ZvcmNlZFRvRGlzY29ubmVjdCIsImNsb3NlIiwiX2NsZWFyQ29ubmVjdGlvblRpbWVyIiwic3RhdHVzIiwicmV0cnlDb3VudCIsInN0YXR1c0NoYW5nZWQiLCJmb3JFYWNoQ2FsbGJhY2siLCJjYWxsYmFjayIsIl9jbGVhbnVwIiwibWF5YmVFcnJvciIsImNvbm5lY3Rpb25UaW1lciIsImNsZWFyVGltZW91dCIsIl9nZXRQcm94eVVybCIsInRhcmdldFVybCIsInByb3h5IiwicHJvY2VzcyIsImVudiIsIkhUVFBfUFJPWFkiLCJodHRwX3Byb3h5IiwibWF0Y2giLCJIVFRQU19QUk9YWSIsImh0dHBzX3Byb3h5IiwiRmF5ZVdlYlNvY2tldCIsIk5wbSIsInJlcXVpcmUiLCJkZWZsYXRlIiwiZmF5ZU9wdGlvbnMiLCJleHRlbnNpb25zIiwiYXNzaWduIiwicHJveHlVcmwiLCJvcmlnaW4iLCJzdWJwcm90b2NvbHMiLCJDbGllbnQiLCJzZXRUaW1lb3V0IiwiX2xvc3RDb25uZWN0aW9uIiwiQ29ubmVjdGlvbkVycm9yIiwiQ09OTkVDVF9USU1FT1VUIiwib24iLCJiaW5kRW52aXJvbm1lbnQiLCJjbGllbnRPbklmQ3VycmVudCIsImV2ZW50IiwiZGVzY3JpcHRpb24iLCJhcmdzIiwiZXJyb3IiLCJfZG9udFByaW50RXJyb3JzIiwiX2RlYnVnIiwibWVzc2FnZSIsIlJldHJ5IiwiZm9yY2VkUmVjb25uZWN0RXJyb3IiLCJyZXRyeSIsIm5hbWUiLCJldmVudENhbGxiYWNrcyIsInB1c2giLCJjYiIsImxlbmd0aCIsImZvckVhY2giLCJjb25uZWN0VGltZW91dE1zIiwiUGFja2FnZSIsInRyYWNrZXIiLCJzdGF0dXNMaXN0ZW5lcnMiLCJUcmFja2VyIiwiRGVwZW5kZW5jeSIsImNoYW5nZWQiLCJfcmV0cnkiLCJyZWNvbm5lY3QiLCJfc29ja2pzT3B0aW9ucyIsIl9mb3JjZSIsImNsZWFyIiwiX3JldHJ5Tm93IiwiZGlzY29ubmVjdCIsIl9wZXJtYW5lbnQiLCJfZXJyb3IiLCJyZWFzb24iLCJfcmV0cnlMYXRlciIsIl9vbmxpbmUiLCJ0aW1lb3V0IiwicmV0cnlMYXRlciIsImJpbmQiLCJyZXRyeVRpbWUiLCJEYXRlIiwiZ2V0VGltZSIsImRlcGVuZCIsInRvU29ja2pzVXJsIiwidHJhbnNsYXRlVXJsIiwibmV3U2NoZW1lQmFzZSIsInN1YlBhdGgiLCJzdGFydHNXaXRoIiwiYWJzb2x1dGVVcmwiLCJzdWJzdHIiLCJkZHBVcmxNYXRjaCIsImh0dHBVcmxNYXRjaCIsIm5ld1NjaGVtZSIsInVybEFmdGVyRERQIiwic2xhc2hQb3MiLCJpbmRleE9mIiwiaG9zdCIsInJlc3QiLCJyZXBsYWNlIiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwidXJsQWZ0ZXJIdHRwIiwiX3JlbGF0aXZlVG9TaXRlUm9vdFVybCIsImVuZHNXaXRoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLE1BQU1BLE9BQU8sR0FBQ0MsTUFBZDtBQUFxQixJQUFJQyx5QkFBSjtBQUE4QkYsT0FBTyxDQUFDRyxJQUFSLENBQWEsd0JBQWIsRUFBc0M7QUFBQ0QsMkJBQXlCLENBQUNFLENBQUQsRUFBRztBQUFDRiw2QkFBeUIsR0FBQ0UsQ0FBMUI7QUFBNEI7O0FBQTFELENBQXRDLEVBQWtHLENBQWxHO0FBSW5ERix5QkFBeUIsQ0FBQztBQUN4QkcsUUFBTSxFQUFFLEVBRGdCO0FBRXhCQyxNQUFJLEVBQUUsRUFGa0I7QUFHeEJDLFNBQU8sRUFBRSxFQUhlO0FBSXhCQyxJQUFFLEVBQUUsRUFKb0I7QUFLeEJDLGNBQVksRUFBRSxDQUFDLENBQUQsRUFBSSxDQUFKLENBTFU7QUFNeEJDLFdBQVMsRUFBRSxDQU5hO0FBT3hCQyxRQUFNLEVBQUUsQ0FQZ0I7QUFReEJDLFVBQVEsRUFBRSxDQUFDLENBQUQsRUFBSSxFQUFKO0FBUmMsQ0FBRCxFQVN0QlgsTUFBTSxDQUFDWSxFQVRlLENBQXpCLEM7Ozs7Ozs7Ozs7O0FDSkEsTUFBTWIsT0FBTyxHQUFDQyxNQUFkO0FBQXFCRCxPQUFPLENBQUNjLE1BQVIsQ0FBZTtBQUFDQyxjQUFZLEVBQUMsTUFBSUE7QUFBbEIsQ0FBZjtBQUFnRCxJQUFJQyxNQUFKO0FBQVdoQixPQUFPLENBQUNHLElBQVIsQ0FBYSxlQUFiLEVBQTZCO0FBQUNhLFFBQU0sQ0FBQ1osQ0FBRCxFQUFHO0FBQUNZLFVBQU0sR0FBQ1osQ0FBUDtBQUFTOztBQUFwQixDQUE3QixFQUFtRCxDQUFuRDtBQUFzRCxJQUFJYSxjQUFKO0FBQW1CakIsT0FBTyxDQUFDRyxJQUFSLENBQWEsV0FBYixF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U0FBU0gsV0FBVCxDQUFxQnJGLEdBQXJCLEVBQTBCO0FBQy9CLFNBQU9zRixZQUFZLENBQUN0RixHQUFELEVBQU0sTUFBTixFQUFjLFFBQWQsQ0FBbkI7QUFDRDs7QUFFTSxTQUFTakIsY0FBVCxDQUF3QmlCLEdBQXhCLEVBQTZCO0FBQ2xDLFNBQU9zRixZQUFZLENBQUN0RixHQUFELEVBQU0sSUFBTixFQUFZLFdBQVosQ0FBbkI7QUFDRCxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9zb2NrZXQtc3RyZWFtLWNsaWVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XHJcbiAgc2V0TWluaW11bUJyb3dzZXJWZXJzaW9ucyxcclxufSBmcm9tIFwibWV0ZW9yL21vZGVybi1icm93c2Vyc1wiO1xyXG5cclxuc2V0TWluaW11bUJyb3dzZXJWZXJzaW9ucyh7XHJcbiAgY2hyb21lOiAxNixcclxuICBlZGdlOiAxMixcclxuICBmaXJlZm94OiAxMSxcclxuICBpZTogMTAsXHJcbiAgbW9iaWxlU2FmYXJpOiBbNiwgMV0sXHJcbiAgcGhhbnRvbWpzOiAyLFxyXG4gIHNhZmFyaTogNyxcclxuICBlbGVjdHJvbjogWzAsIDIwXSxcclxufSwgbW9kdWxlLmlkKTtcclxuIiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSBcIm1ldGVvci9tZXRlb3JcIjtcclxuaW1wb3J0IHsgdG9XZWJzb2NrZXRVcmwgfSBmcm9tIFwiLi91cmxzLmpzXCI7XHJcbmltcG9ydCB7IFN0cmVhbUNsaWVudENvbW1vbiB9IGZyb20gXCIuL2NvbW1vbi5qc1wiO1xyXG5cclxuLy8gQHBhcmFtIGVuZHBvaW50IHtTdHJpbmd9IFVSTCB0byBNZXRlb3IgYXBwXHJcbi8vICAgXCJodHRwOi8vc3ViZG9tYWluLm1ldGVvci5jb20vXCIgb3IgXCIvXCIgb3JcclxuLy8gICBcImRkcCtzb2NranM6Ly9mb28tKioubWV0ZW9yLmNvbS9zb2NranNcIlxyXG4vL1xyXG4vLyBXZSBkbyBzb21lIHJld3JpdGluZyBvZiB0aGUgVVJMIHRvIGV2ZW50dWFsbHkgbWFrZSBpdCBcIndzOi8vXCIgb3IgXCJ3c3M6Ly9cIixcclxuLy8gd2hhdGV2ZXIgd2FzIHBhc3NlZCBpbi4gIEF0IHRoZSB2ZXJ5IGxlYXN0LCB3aGF0IE1ldGVvci5hYnNvbHV0ZVVybCgpIHJldHVybnNcclxuLy8gdXMgc2hvdWxkIHdvcmsuXHJcbi8vXHJcbi8vIFdlIGRvbid0IGRvIGFueSBoZWFydGJlYXRpbmcuIChUaGUgbG9naWMgdGhhdCBkaWQgdGhpcyBpbiBzb2NranMgd2FzIHJlbW92ZWQsXHJcbi8vIGJlY2F1c2UgaXQgdXNlZCBhIGJ1aWx0LWluIHNvY2tqcyBtZWNoYW5pc20uIFdlIGNvdWxkIGRvIGl0IHdpdGggV2ViU29ja2V0XHJcbi8vIHBpbmcgZnJhbWVzIG9yIHdpdGggRERQLWxldmVsIG1lc3NhZ2VzLilcclxuZXhwb3J0IGNsYXNzIENsaWVudFN0cmVhbSBleHRlbmRzIFN0cmVhbUNsaWVudENvbW1vbiB7XHJcbiAgY29uc3RydWN0b3IoZW5kcG9pbnQsIG9wdGlvbnMpIHtcclxuICAgIHN1cGVyKG9wdGlvbnMpO1xyXG5cclxuICAgIHRoaXMuY2xpZW50ID0gbnVsbDsgLy8gY3JlYXRlZCBpbiBfbGF1bmNoQ29ubmVjdGlvblxyXG4gICAgdGhpcy5lbmRwb2ludCA9IGVuZHBvaW50O1xyXG5cclxuICAgIHRoaXMuaGVhZGVycyA9IHRoaXMub3B0aW9ucy5oZWFkZXJzIHx8IE9iamVjdC5jcmVhdGUobnVsbCk7XHJcbiAgICB0aGlzLm5wbUZheWVPcHRpb25zID0gdGhpcy5vcHRpb25zLm5wbUZheWVPcHRpb25zIHx8IE9iamVjdC5jcmVhdGUobnVsbCk7XHJcblxyXG4gICAgdGhpcy5faW5pdENvbW1vbih0aGlzLm9wdGlvbnMpO1xyXG5cclxuICAgIC8vLy8gS2lja29mZiFcclxuICAgIHRoaXMuX2xhdW5jaENvbm5lY3Rpb24oKTtcclxuICB9XHJcblxyXG4gIC8vIGRhdGEgaXMgYSB1dGY4IHN0cmluZy4gRGF0YSBzZW50IHdoaWxlIG5vdCBjb25uZWN0ZWQgaXMgZHJvcHBlZCBvblxyXG4gIC8vIHRoZSBmbG9vciwgYW5kIGl0IGlzIHVwIHRoZSB1c2VyIG9mIHRoaXMgQVBJIHRvIHJldHJhbnNtaXQgbG9zdFxyXG4gIC8vIG1lc3NhZ2VzIG9uICdyZXNldCdcclxuICBzZW5kKGRhdGEpIHtcclxuICAgIGlmICh0aGlzLmN1cnJlbnRTdGF0dXMuY29ubmVjdGVkKSB7XHJcbiAgICAgIHRoaXMuY2xpZW50LnNlbmQoZGF0YSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBDaGFuZ2VzIHdoZXJlIHRoaXMgY29ubmVjdGlvbiBwb2ludHNcclxuICBfY2hhbmdlVXJsKHVybCkge1xyXG4gICAgdGhpcy5lbmRwb2ludCA9IHVybDtcclxuICB9XHJcblxyXG4gIF9vbkNvbm5lY3QoY2xpZW50KSB7XHJcbiAgICBpZiAoY2xpZW50ICE9PSB0aGlzLmNsaWVudCkge1xyXG4gICAgICAvLyBUaGlzIGNvbm5lY3Rpb24gaXMgbm90IGZyb20gdGhlIGxhc3QgY2FsbCB0byBfbGF1bmNoQ29ubmVjdGlvbi5cclxuICAgICAgLy8gQnV0IF9sYXVuY2hDb25uZWN0aW9uIGNhbGxzIF9jbGVhbnVwIHdoaWNoIGNsb3NlcyBwcmV2aW91cyBjb25uZWN0aW9ucy5cclxuICAgICAgLy8gSXQncyBvdXIgYmVsaWVmIHRoYXQgdGhpcyBzdGlmbGVzIGZ1dHVyZSAnb3BlbicgZXZlbnRzLCBidXQgbWF5YmVcclxuICAgICAgLy8gd2UgYXJlIHdyb25nP1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0dvdCBvcGVuIGZyb20gaW5hY3RpdmUgY2xpZW50ICcgKyAhIXRoaXMuY2xpZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5fZm9yY2VkVG9EaXNjb25uZWN0KSB7XHJcbiAgICAgIC8vIFdlIHdlcmUgYXNrZWQgdG8gZGlzY29ubmVjdCBiZXR3ZWVuIHRyeWluZyB0byBvcGVuIHRoZSBjb25uZWN0aW9uIGFuZFxyXG4gICAgICAvLyBhY3R1YWxseSBvcGVuaW5nIGl0LiBMZXQncyBqdXN0IHByZXRlbmQgdGhpcyBuZXZlciBoYXBwZW5lZC5cclxuICAgICAgdGhpcy5jbGllbnQuY2xvc2UoKTtcclxuICAgICAgdGhpcy5jbGllbnQgPSBudWxsO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuY3VycmVudFN0YXR1cy5jb25uZWN0ZWQpIHtcclxuICAgICAgLy8gV2UgYWxyZWFkeSBoYXZlIGEgY29ubmVjdGlvbi4gSXQgbXVzdCBoYXZlIGJlZW4gdGhlIGNhc2UgdGhhdCB3ZVxyXG4gICAgICAvLyBzdGFydGVkIHR3byBwYXJhbGxlbCBjb25uZWN0aW9uIGF0dGVtcHRzIChiZWNhdXNlIHdlIHdhbnRlZCB0b1xyXG4gICAgICAvLyAncmVjb25uZWN0IG5vdycgb24gYSBoYW5naW5nIGNvbm5lY3Rpb24gYW5kIHdlIGhhZCBubyB3YXkgdG8gY2FuY2VsIHRoZVxyXG4gICAgICAvLyBjb25uZWN0aW9uIGF0dGVtcHQuKSBCdXQgdGhpcyBzaG91bGRuJ3QgaGFwcGVuIChzaW1pbGFybHkgdG8gdGhlIGNsaWVudFxyXG4gICAgICAvLyAhPT0gdGhpcy5jbGllbnQgY2hlY2sgYWJvdmUpLlxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1R3byBwYXJhbGxlbCBjb25uZWN0aW9ucz8nKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9jbGVhckNvbm5lY3Rpb25UaW1lcigpO1xyXG5cclxuICAgIC8vIHVwZGF0ZSBzdGF0dXNcclxuICAgIHRoaXMuY3VycmVudFN0YXR1cy5zdGF0dXMgPSAnY29ubmVjdGVkJztcclxuICAgIHRoaXMuY3VycmVudFN0YXR1cy5jb25uZWN0ZWQgPSB0cnVlO1xyXG4gICAgdGhpcy5jdXJyZW50U3RhdHVzLnJldHJ5Q291bnQgPSAwO1xyXG4gICAgdGhpcy5zdGF0dXNDaGFuZ2VkKCk7XHJcblxyXG4gICAgLy8gZmlyZSByZXNldHMuIFRoaXMgbXVzdCBjb21lIGFmdGVyIHN0YXR1cyBjaGFuZ2Ugc28gdGhhdCBjbGllbnRzXHJcbiAgICAvLyBjYW4gY2FsbCBzZW5kIGZyb20gd2l0aGluIGEgcmVzZXQgY2FsbGJhY2suXHJcbiAgICB0aGlzLmZvckVhY2hDYWxsYmFjaygncmVzZXQnLCBjYWxsYmFjayA9PiB7XHJcbiAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIF9jbGVhbnVwKG1heWJlRXJyb3IpIHtcclxuICAgIHRoaXMuX2NsZWFyQ29ubmVjdGlvblRpbWVyKCk7XHJcbiAgICBpZiAodGhpcy5jbGllbnQpIHtcclxuICAgICAgdmFyIGNsaWVudCA9IHRoaXMuY2xpZW50O1xyXG4gICAgICB0aGlzLmNsaWVudCA9IG51bGw7XHJcbiAgICAgIGNsaWVudC5jbG9zZSgpO1xyXG5cclxuICAgICAgdGhpcy5mb3JFYWNoQ2FsbGJhY2soJ2Rpc2Nvbm5lY3QnLCBjYWxsYmFjayA9PiB7XHJcbiAgICAgICAgY2FsbGJhY2sobWF5YmVFcnJvcik7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgX2NsZWFyQ29ubmVjdGlvblRpbWVyKCkge1xyXG4gICAgaWYgKHRoaXMuY29ubmVjdGlvblRpbWVyKSB7XHJcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLmNvbm5lY3Rpb25UaW1lcik7XHJcbiAgICAgIHRoaXMuY29ubmVjdGlvblRpbWVyID0gbnVsbDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIF9nZXRQcm94eVVybCh0YXJnZXRVcmwpIHtcclxuICAgIC8vIFNpbWlsYXIgdG8gY29kZSBpbiB0b29scy9odHRwLWhlbHBlcnMuanMuXHJcbiAgICB2YXIgcHJveHkgPSBwcm9jZXNzLmVudi5IVFRQX1BST1hZIHx8IHByb2Nlc3MuZW52Lmh0dHBfcHJveHkgfHwgbnVsbDtcclxuICAgIC8vIGlmIHdlJ3JlIGdvaW5nIHRvIGEgc2VjdXJlIHVybCwgdHJ5IHRoZSBodHRwc19wcm94eSBlbnYgdmFyaWFibGUgZmlyc3QuXHJcbiAgICBpZiAodGFyZ2V0VXJsLm1hdGNoKC9ed3NzOi8pKSB7XHJcbiAgICAgIHByb3h5ID0gcHJvY2Vzcy5lbnYuSFRUUFNfUFJPWFkgfHwgcHJvY2Vzcy5lbnYuaHR0cHNfcHJveHkgfHwgcHJveHk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcHJveHk7XHJcbiAgfVxyXG5cclxuICBfbGF1bmNoQ29ubmVjdGlvbigpIHtcclxuICAgIHRoaXMuX2NsZWFudXAoKTsgLy8gY2xlYW51cCB0aGUgb2xkIHNvY2tldCwgaWYgdGhlcmUgd2FzIG9uZS5cclxuXHJcbiAgICAvLyBTaW5jZSBzZXJ2ZXItdG8tc2VydmVyIEREUCBpcyBzdGlsbCBhbiBleHBlcmltZW50YWwgZmVhdHVyZSwgd2Ugb25seVxyXG4gICAgLy8gcmVxdWlyZSB0aGUgbW9kdWxlIGlmIHdlIGFjdHVhbGx5IGNyZWF0ZSBhIHNlcnZlci10by1zZXJ2ZXJcclxuICAgIC8vIGNvbm5lY3Rpb24uXHJcbiAgICB2YXIgRmF5ZVdlYlNvY2tldCA9IE5wbS5yZXF1aXJlKCdmYXllLXdlYnNvY2tldCcpO1xyXG4gICAgdmFyIGRlZmxhdGUgPSBOcG0ucmVxdWlyZSgncGVybWVzc2FnZS1kZWZsYXRlJyk7XHJcblxyXG4gICAgdmFyIHRhcmdldFVybCA9IHRvV2Vic29ja2V0VXJsKHRoaXMuZW5kcG9pbnQpO1xyXG4gICAgdmFyIGZheWVPcHRpb25zID0ge1xyXG4gICAgICBoZWFkZXJzOiB0aGlzLmhlYWRlcnMsXHJcbiAgICAgIGV4dGVuc2lvbnM6IFtkZWZsYXRlXVxyXG4gICAgfTtcclxuICAgIGZheWVPcHRpb25zID0gT2JqZWN0LmFzc2lnbihmYXllT3B0aW9ucywgdGhpcy5ucG1GYXllT3B0aW9ucyk7XHJcbiAgICB2YXIgcHJveHlVcmwgPSB0aGlzLl9nZXRQcm94eVVybCh0YXJnZXRVcmwpO1xyXG4gICAgaWYgKHByb3h5VXJsKSB7XHJcbiAgICAgIGZheWVPcHRpb25zLnByb3h5ID0geyBvcmlnaW46IHByb3h5VXJsIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gV2Ugd291bGQgbGlrZSB0byBzcGVjaWZ5ICdkZHAnIGFzIHRoZSBzdWJwcm90b2NvbCBoZXJlLiBUaGUgbnBtIG1vZHVsZSB3ZVxyXG4gICAgLy8gdXNlZCB0byB1c2UgYXMgYSBjbGllbnQgd291bGQgZmFpbCB0aGUgaGFuZHNoYWtlIGlmIHdlIGFzayBmb3IgYVxyXG4gICAgLy8gc3VicHJvdG9jb2wgYW5kIHRoZSBzZXJ2ZXIgZG9lc24ndCBzZW5kIG9uZSBiYWNrIChhbmQgc29ja2pzIGRvZXNuJ3QpLlxyXG4gICAgLy8gRmF5ZSBkb2Vzbid0IGhhdmUgdGhhdCBiZWhhdmlvcjsgaXQncyB1bmNsZWFyIGZyb20gcmVhZGluZyBSRkMgNjQ1NSBpZlxyXG4gICAgLy8gRmF5ZSBpcyBlcnJvbmVvdXMgb3Igbm90LiAgU28gZm9yIG5vdywgd2UgZG9uJ3Qgc3BlY2lmeSBwcm90b2NvbHMuXHJcbiAgICB2YXIgc3VicHJvdG9jb2xzID0gW107XHJcblxyXG4gICAgdmFyIGNsaWVudCA9ICh0aGlzLmNsaWVudCA9IG5ldyBGYXllV2ViU29ja2V0LkNsaWVudChcclxuICAgICAgdGFyZ2V0VXJsLFxyXG4gICAgICBzdWJwcm90b2NvbHMsXHJcbiAgICAgIGZheWVPcHRpb25zXHJcbiAgICApKTtcclxuXHJcbiAgICB0aGlzLl9jbGVhckNvbm5lY3Rpb25UaW1lcigpO1xyXG4gICAgdGhpcy5jb25uZWN0aW9uVGltZXIgPSBNZXRlb3Iuc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIHRoaXMuX2xvc3RDb25uZWN0aW9uKG5ldyB0aGlzLkNvbm5lY3Rpb25FcnJvcignRERQIGNvbm5lY3Rpb24gdGltZWQgb3V0JykpO1xyXG4gICAgfSwgdGhpcy5DT05ORUNUX1RJTUVPVVQpO1xyXG5cclxuICAgIHRoaXMuY2xpZW50Lm9uKFxyXG4gICAgICAnb3BlbicsXHJcbiAgICAgIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9vbkNvbm5lY3QoY2xpZW50KTtcclxuICAgICAgfSwgJ3N0cmVhbSBjb25uZWN0IGNhbGxiYWNrJylcclxuICAgICk7XHJcblxyXG4gICAgdmFyIGNsaWVudE9uSWZDdXJyZW50ID0gKGV2ZW50LCBkZXNjcmlwdGlvbiwgY2FsbGJhY2spID0+IHtcclxuICAgICAgdGhpcy5jbGllbnQub24oXHJcbiAgICAgICAgZXZlbnQsXHJcbiAgICAgICAgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoLi4uYXJncykgPT4ge1xyXG4gICAgICAgICAgLy8gSWdub3JlIGV2ZW50cyBmcm9tIGFueSBjb25uZWN0aW9uIHdlJ3ZlIGFscmVhZHkgY2xlYW5lZCB1cC5cclxuICAgICAgICAgIGlmIChjbGllbnQgIT09IHRoaXMuY2xpZW50KSByZXR1cm47XHJcbiAgICAgICAgICBjYWxsYmFjayguLi5hcmdzKTtcclxuICAgICAgICB9LCBkZXNjcmlwdGlvbilcclxuICAgICAgKTtcclxuICAgIH07XHJcblxyXG4gICAgY2xpZW50T25JZkN1cnJlbnQoJ2Vycm9yJywgJ3N0cmVhbSBlcnJvciBjYWxsYmFjaycsIGVycm9yID0+IHtcclxuICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuX2RvbnRQcmludEVycm9ycylcclxuICAgICAgICBNZXRlb3IuX2RlYnVnKCdzdHJlYW0gZXJyb3InLCBlcnJvci5tZXNzYWdlKTtcclxuXHJcbiAgICAgIC8vIEZheWUncyAnZXJyb3InIG9iamVjdCBpcyBub3QgYSBKUyBlcnJvciAoYW5kIGFtb25nIG90aGVyIHRoaW5ncyxcclxuICAgICAgLy8gZG9lc24ndCBzdHJpbmdpZnkgd2VsbCkuIENvbnZlcnQgaXQgdG8gb25lLlxyXG4gICAgICB0aGlzLl9sb3N0Q29ubmVjdGlvbihuZXcgdGhpcy5Db25uZWN0aW9uRXJyb3IoZXJyb3IubWVzc2FnZSkpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY2xpZW50T25JZkN1cnJlbnQoJ2Nsb3NlJywgJ3N0cmVhbSBjbG9zZSBjYWxsYmFjaycsICgpID0+IHtcclxuICAgICAgdGhpcy5fbG9zdENvbm5lY3Rpb24oKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNsaWVudE9uSWZDdXJyZW50KCdtZXNzYWdlJywgJ3N0cmVhbSBtZXNzYWdlIGNhbGxiYWNrJywgbWVzc2FnZSA9PiB7XHJcbiAgICAgIC8vIElnbm9yZSBiaW5hcnkgZnJhbWVzLCB3aGVyZSBtZXNzYWdlLmRhdGEgaXMgYSBCdWZmZXJcclxuICAgICAgaWYgKHR5cGVvZiBtZXNzYWdlLmRhdGEgIT09ICdzdHJpbmcnKSByZXR1cm47XHJcblxyXG4gICAgICB0aGlzLmZvckVhY2hDYWxsYmFjaygnbWVzc2FnZScsIGNhbGxiYWNrID0+IHtcclxuICAgICAgICBjYWxsYmFjayhtZXNzYWdlLmRhdGEpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBSZXRyeSB9IGZyb20gJ21ldGVvci9yZXRyeSc7XHJcblxyXG5jb25zdCBmb3JjZWRSZWNvbm5lY3RFcnJvciA9IG5ldyBFcnJvcihcImZvcmNlZCByZWNvbm5lY3RcIik7XHJcblxyXG5leHBvcnQgY2xhc3MgU3RyZWFtQ2xpZW50Q29tbW9uIHtcclxuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSB7XHJcbiAgICAgIHJldHJ5OiB0cnVlLFxyXG4gICAgICAuLi4ob3B0aW9ucyB8fCBudWxsKSxcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5Db25uZWN0aW9uRXJyb3IgPVxyXG4gICAgICBvcHRpb25zICYmIG9wdGlvbnMuQ29ubmVjdGlvbkVycm9yIHx8IEVycm9yO1xyXG4gIH1cclxuXHJcbiAgLy8gUmVnaXN0ZXIgZm9yIGNhbGxiYWNrcy5cclxuICBvbihuYW1lLCBjYWxsYmFjaykge1xyXG4gICAgaWYgKG5hbWUgIT09ICdtZXNzYWdlJyAmJiBuYW1lICE9PSAncmVzZXQnICYmIG5hbWUgIT09ICdkaXNjb25uZWN0JylcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bmtub3duIGV2ZW50IHR5cGU6ICcgKyBuYW1lKTtcclxuXHJcbiAgICBpZiAoIXRoaXMuZXZlbnRDYWxsYmFja3NbbmFtZV0pIHRoaXMuZXZlbnRDYWxsYmFja3NbbmFtZV0gPSBbXTtcclxuICAgIHRoaXMuZXZlbnRDYWxsYmFja3NbbmFtZV0ucHVzaChjYWxsYmFjayk7XHJcbiAgfVxyXG5cclxuICBmb3JFYWNoQ2FsbGJhY2sobmFtZSwgY2IpIHtcclxuICAgIGlmICghdGhpcy5ldmVudENhbGxiYWNrc1tuYW1lXSB8fCAhdGhpcy5ldmVudENhbGxiYWNrc1tuYW1lXS5sZW5ndGgpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZXZlbnRDYWxsYmFja3NbbmFtZV0uZm9yRWFjaChjYik7XHJcbiAgfVxyXG5cclxuICBfaW5pdENvbW1vbihvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCBPYmplY3QuY3JlYXRlKG51bGwpO1xyXG5cclxuICAgIC8vLy8gQ29uc3RhbnRzXHJcblxyXG4gICAgLy8gaG93IGxvbmcgdG8gd2FpdCB1bnRpbCB3ZSBkZWNsYXJlIHRoZSBjb25uZWN0aW9uIGF0dGVtcHRcclxuICAgIC8vIGZhaWxlZC5cclxuICAgIHRoaXMuQ09OTkVDVF9USU1FT1VUID0gb3B0aW9ucy5jb25uZWN0VGltZW91dE1zIHx8IDEwMDAwO1xyXG5cclxuICAgIHRoaXMuZXZlbnRDYWxsYmFja3MgPSBPYmplY3QuY3JlYXRlKG51bGwpOyAvLyBuYW1lIC0+IFtjYWxsYmFja11cclxuXHJcbiAgICB0aGlzLl9mb3JjZWRUb0Rpc2Nvbm5lY3QgPSBmYWxzZTtcclxuXHJcbiAgICAvLy8vIFJlYWN0aXZlIHN0YXR1c1xyXG4gICAgdGhpcy5jdXJyZW50U3RhdHVzID0ge1xyXG4gICAgICBzdGF0dXM6ICdjb25uZWN0aW5nJyxcclxuICAgICAgY29ubmVjdGVkOiBmYWxzZSxcclxuICAgICAgcmV0cnlDb3VudDogMFxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAoUGFja2FnZS50cmFja2VyKSB7XHJcbiAgICAgIHRoaXMuc3RhdHVzTGlzdGVuZXJzID0gbmV3IFBhY2thZ2UudHJhY2tlci5UcmFja2VyLkRlcGVuZGVuY3koKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnN0YXR1c0NoYW5nZWQgPSAoKSA9PiB7XHJcbiAgICAgIGlmICh0aGlzLnN0YXR1c0xpc3RlbmVycykge1xyXG4gICAgICAgIHRoaXMuc3RhdHVzTGlzdGVuZXJzLmNoYW5nZWQoKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLy8vIFJldHJ5IGxvZ2ljXHJcbiAgICB0aGlzLl9yZXRyeSA9IG5ldyBSZXRyeSgpO1xyXG4gICAgdGhpcy5jb25uZWN0aW9uVGltZXIgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgLy8gVHJpZ2dlciBhIHJlY29ubmVjdC5cclxuICByZWNvbm5lY3Qob3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwgT2JqZWN0LmNyZWF0ZShudWxsKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy51cmwpIHtcclxuICAgICAgdGhpcy5fY2hhbmdlVXJsKG9wdGlvbnMudXJsKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAob3B0aW9ucy5fc29ja2pzT3B0aW9ucykge1xyXG4gICAgICB0aGlzLm9wdGlvbnMuX3NvY2tqc09wdGlvbnMgPSBvcHRpb25zLl9zb2NranNPcHRpb25zO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLmN1cnJlbnRTdGF0dXMuY29ubmVjdGVkKSB7XHJcbiAgICAgIGlmIChvcHRpb25zLl9mb3JjZSB8fCBvcHRpb25zLnVybCkge1xyXG4gICAgICAgIHRoaXMuX2xvc3RDb25uZWN0aW9uKGZvcmNlZFJlY29ubmVjdEVycm9yKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gaWYgd2UncmUgbWlkLWNvbm5lY3Rpb24sIHN0b3AgaXQuXHJcbiAgICBpZiAodGhpcy5jdXJyZW50U3RhdHVzLnN0YXR1cyA9PT0gJ2Nvbm5lY3RpbmcnKSB7XHJcbiAgICAgIC8vIFByZXRlbmQgaXQncyBhIGNsZWFuIGNsb3NlLlxyXG4gICAgICB0aGlzLl9sb3N0Q29ubmVjdGlvbigpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX3JldHJ5LmNsZWFyKCk7XHJcbiAgICB0aGlzLmN1cnJlbnRTdGF0dXMucmV0cnlDb3VudCAtPSAxOyAvLyBkb24ndCBjb3VudCBtYW51YWwgcmV0cmllc1xyXG4gICAgdGhpcy5fcmV0cnlOb3coKTtcclxuICB9XHJcblxyXG4gIGRpc2Nvbm5lY3Qob3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwgT2JqZWN0LmNyZWF0ZShudWxsKTtcclxuXHJcbiAgICAvLyBGYWlsZWQgaXMgcGVybWFuZW50LiBJZiB3ZSdyZSBmYWlsZWQsIGRvbid0IGxldCBwZW9wbGUgZ28gYmFja1xyXG4gICAgLy8gb25saW5lIGJ5IGNhbGxpbmcgJ2Rpc2Nvbm5lY3QnIHRoZW4gJ3JlY29ubmVjdCcuXHJcbiAgICBpZiAodGhpcy5fZm9yY2VkVG9EaXNjb25uZWN0KSByZXR1cm47XHJcblxyXG4gICAgLy8gSWYgX3Blcm1hbmVudCBpcyBzZXQsIHBlcm1hbmVudGx5IGRpc2Nvbm5lY3QgYSBzdHJlYW0uIE9uY2UgYSBzdHJlYW1cclxuICAgIC8vIGlzIGZvcmNlZCB0byBkaXNjb25uZWN0LCBpdCBjYW4gbmV2ZXIgcmVjb25uZWN0LiBUaGlzIGlzIGZvclxyXG4gICAgLy8gZXJyb3IgY2FzZXMgc3VjaCBhcyBkZHAgdmVyc2lvbiBtaXNtYXRjaCwgd2hlcmUgdHJ5aW5nIGFnYWluXHJcbiAgICAvLyB3b24ndCBmaXggdGhlIHByb2JsZW0uXHJcbiAgICBpZiAob3B0aW9ucy5fcGVybWFuZW50KSB7XHJcbiAgICAgIHRoaXMuX2ZvcmNlZFRvRGlzY29ubmVjdCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fY2xlYW51cCgpO1xyXG4gICAgdGhpcy5fcmV0cnkuY2xlYXIoKTtcclxuXHJcbiAgICB0aGlzLmN1cnJlbnRTdGF0dXMgPSB7XHJcbiAgICAgIHN0YXR1czogb3B0aW9ucy5fcGVybWFuZW50ID8gJ2ZhaWxlZCcgOiAnb2ZmbGluZScsXHJcbiAgICAgIGNvbm5lY3RlZDogZmFsc2UsXHJcbiAgICAgIHJldHJ5Q291bnQ6IDBcclxuICAgIH07XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuX3Blcm1hbmVudCAmJiBvcHRpb25zLl9lcnJvcilcclxuICAgICAgdGhpcy5jdXJyZW50U3RhdHVzLnJlYXNvbiA9IG9wdGlvbnMuX2Vycm9yO1xyXG5cclxuICAgIHRoaXMuc3RhdHVzQ2hhbmdlZCgpO1xyXG4gIH1cclxuXHJcbiAgLy8gbWF5YmVFcnJvciBpcyBzZXQgdW5sZXNzIGl0J3MgYSBjbGVhbiBwcm90b2NvbC1sZXZlbCBjbG9zZS5cclxuICBfbG9zdENvbm5lY3Rpb24obWF5YmVFcnJvcikge1xyXG4gICAgdGhpcy5fY2xlYW51cChtYXliZUVycm9yKTtcclxuICAgIHRoaXMuX3JldHJ5TGF0ZXIobWF5YmVFcnJvcik7IC8vIHNldHMgc3RhdHVzLiBubyBuZWVkIHRvIGRvIGl0IGhlcmUuXHJcbiAgfVxyXG5cclxuICAvLyBmaXJlZCB3aGVuIHdlIGRldGVjdCB0aGF0IHdlJ3ZlIGdvbmUgb25saW5lLiB0cnkgdG8gcmVjb25uZWN0XHJcbiAgLy8gaW1tZWRpYXRlbHkuXHJcbiAgX29ubGluZSgpIHtcclxuICAgIC8vIGlmIHdlJ3ZlIHJlcXVlc3RlZCB0byBiZSBvZmZsaW5lIGJ5IGRpc2Nvbm5lY3RpbmcsIGRvbid0IHJlY29ubmVjdC5cclxuICAgIGlmICh0aGlzLmN1cnJlbnRTdGF0dXMuc3RhdHVzICE9ICdvZmZsaW5lJykgdGhpcy5yZWNvbm5lY3QoKTtcclxuICB9XHJcblxyXG4gIF9yZXRyeUxhdGVyKG1heWJlRXJyb3IpIHtcclxuICAgIHZhciB0aW1lb3V0ID0gMDtcclxuICAgIGlmICh0aGlzLm9wdGlvbnMucmV0cnkgfHxcclxuICAgICAgICBtYXliZUVycm9yID09PSBmb3JjZWRSZWNvbm5lY3RFcnJvcikge1xyXG4gICAgICB0aW1lb3V0ID0gdGhpcy5fcmV0cnkucmV0cnlMYXRlcihcclxuICAgICAgICB0aGlzLmN1cnJlbnRTdGF0dXMucmV0cnlDb3VudCxcclxuICAgICAgICB0aGlzLl9yZXRyeU5vdy5iaW5kKHRoaXMpXHJcbiAgICAgICk7XHJcbiAgICAgIHRoaXMuY3VycmVudFN0YXR1cy5zdGF0dXMgPSAnd2FpdGluZyc7XHJcbiAgICAgIHRoaXMuY3VycmVudFN0YXR1cy5yZXRyeVRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSArIHRpbWVvdXQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmN1cnJlbnRTdGF0dXMuc3RhdHVzID0gJ2ZhaWxlZCc7XHJcbiAgICAgIGRlbGV0ZSB0aGlzLmN1cnJlbnRTdGF0dXMucmV0cnlUaW1lO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuY3VycmVudFN0YXR1cy5jb25uZWN0ZWQgPSBmYWxzZTtcclxuICAgIHRoaXMuc3RhdHVzQ2hhbmdlZCgpO1xyXG4gIH1cclxuXHJcbiAgX3JldHJ5Tm93KCkge1xyXG4gICAgaWYgKHRoaXMuX2ZvcmNlZFRvRGlzY29ubmVjdCkgcmV0dXJuO1xyXG5cclxuICAgIHRoaXMuY3VycmVudFN0YXR1cy5yZXRyeUNvdW50ICs9IDE7XHJcbiAgICB0aGlzLmN1cnJlbnRTdGF0dXMuc3RhdHVzID0gJ2Nvbm5lY3RpbmcnO1xyXG4gICAgdGhpcy5jdXJyZW50U3RhdHVzLmNvbm5lY3RlZCA9IGZhbHNlO1xyXG4gICAgZGVsZXRlIHRoaXMuY3VycmVudFN0YXR1cy5yZXRyeVRpbWU7XHJcbiAgICB0aGlzLnN0YXR1c0NoYW5nZWQoKTtcclxuXHJcbiAgICB0aGlzLl9sYXVuY2hDb25uZWN0aW9uKCk7XHJcbiAgfVxyXG5cclxuICAvLyBHZXQgY3VycmVudCBzdGF0dXMuIFJlYWN0aXZlLlxyXG4gIHN0YXR1cygpIHtcclxuICAgIGlmICh0aGlzLnN0YXR1c0xpc3RlbmVycykge1xyXG4gICAgICB0aGlzLnN0YXR1c0xpc3RlbmVycy5kZXBlbmQoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLmN1cnJlbnRTdGF0dXM7XHJcbiAgfVxyXG59XHJcbiIsIi8vIEBwYXJhbSB1cmwge1N0cmluZ30gVVJMIHRvIE1ldGVvciBhcHAsIGVnOlxyXG4vLyAgIFwiL1wiIG9yIFwibWFkZXdpdGgubWV0ZW9yLmNvbVwiIG9yIFwiaHR0cHM6Ly9mb28ubWV0ZW9yLmNvbVwiXHJcbi8vICAgb3IgXCJkZHArc29ja2pzOi8vZGRwLS0qKioqLWZvby5tZXRlb3IuY29tL3NvY2tqc1wiXHJcbi8vIEByZXR1cm5zIHtTdHJpbmd9IFVSTCB0byB0aGUgZW5kcG9pbnQgd2l0aCB0aGUgc3BlY2lmaWMgc2NoZW1lIGFuZCBzdWJQYXRoLCBlLmcuXHJcbi8vIGZvciBzY2hlbWUgXCJodHRwXCIgYW5kIHN1YlBhdGggXCJzb2NranNcIlxyXG4vLyAgIFwiaHR0cDovL3N1YmRvbWFpbi5tZXRlb3IuY29tL3NvY2tqc1wiIG9yIFwiL3NvY2tqc1wiXHJcbi8vICAgb3IgXCJodHRwczovL2RkcC0tMTIzNC1mb28ubWV0ZW9yLmNvbS9zb2NranNcIlxyXG5mdW5jdGlvbiB0cmFuc2xhdGVVcmwodXJsLCBuZXdTY2hlbWVCYXNlLCBzdWJQYXRoKSB7XHJcbiAgaWYgKCFuZXdTY2hlbWVCYXNlKSB7XHJcbiAgICBuZXdTY2hlbWVCYXNlID0gJ2h0dHAnO1xyXG4gIH1cclxuXHJcbiAgaWYgKHN1YlBhdGggIT09IFwic29ja2pzXCIgJiYgdXJsLnN0YXJ0c1dpdGgoXCIvXCIpKSB7XHJcbiAgICB1cmwgPSBNZXRlb3IuYWJzb2x1dGVVcmwodXJsLnN1YnN0cigxKSk7XHJcbiAgfVxyXG5cclxuICB2YXIgZGRwVXJsTWF0Y2ggPSB1cmwubWF0Y2goL15kZHAoaT8pXFwrc29ja2pzOlxcL1xcLy8pO1xyXG4gIHZhciBodHRwVXJsTWF0Y2ggPSB1cmwubWF0Y2goL15odHRwKHM/KTpcXC9cXC8vKTtcclxuICB2YXIgbmV3U2NoZW1lO1xyXG4gIGlmIChkZHBVcmxNYXRjaCkge1xyXG4gICAgLy8gUmVtb3ZlIHNjaGVtZSBhbmQgc3BsaXQgb2ZmIHRoZSBob3N0LlxyXG4gICAgdmFyIHVybEFmdGVyRERQID0gdXJsLnN1YnN0cihkZHBVcmxNYXRjaFswXS5sZW5ndGgpO1xyXG4gICAgbmV3U2NoZW1lID0gZGRwVXJsTWF0Y2hbMV0gPT09ICdpJyA/IG5ld1NjaGVtZUJhc2UgOiBuZXdTY2hlbWVCYXNlICsgJ3MnO1xyXG4gICAgdmFyIHNsYXNoUG9zID0gdXJsQWZ0ZXJERFAuaW5kZXhPZignLycpO1xyXG4gICAgdmFyIGhvc3QgPSBzbGFzaFBvcyA9PT0gLTEgPyB1cmxBZnRlckREUCA6IHVybEFmdGVyRERQLnN1YnN0cigwLCBzbGFzaFBvcyk7XHJcbiAgICB2YXIgcmVzdCA9IHNsYXNoUG9zID09PSAtMSA/ICcnIDogdXJsQWZ0ZXJERFAuc3Vic3RyKHNsYXNoUG9zKTtcclxuXHJcbiAgICAvLyBJbiB0aGUgaG9zdCAoT05MWSEpLCBjaGFuZ2UgJyonIGNoYXJhY3RlcnMgaW50byByYW5kb20gZGlnaXRzLiBUaGlzXHJcbiAgICAvLyBhbGxvd3MgZGlmZmVyZW50IHN0cmVhbSBjb25uZWN0aW9ucyB0byBjb25uZWN0IHRvIGRpZmZlcmVudCBob3N0bmFtZXNcclxuICAgIC8vIGFuZCBhdm9pZCBicm93c2VyIHBlci1ob3N0bmFtZSBjb25uZWN0aW9uIGxpbWl0cy5cclxuICAgIGhvc3QgPSBob3N0LnJlcGxhY2UoL1xcKi9nLCAoKSA9PiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMCkpO1xyXG5cclxuICAgIHJldHVybiBuZXdTY2hlbWUgKyAnOi8vJyArIGhvc3QgKyByZXN0O1xyXG4gIH0gZWxzZSBpZiAoaHR0cFVybE1hdGNoKSB7XHJcbiAgICBuZXdTY2hlbWUgPSAhaHR0cFVybE1hdGNoWzFdID8gbmV3U2NoZW1lQmFzZSA6IG5ld1NjaGVtZUJhc2UgKyAncyc7XHJcbiAgICB2YXIgdXJsQWZ0ZXJIdHRwID0gdXJsLnN1YnN0cihodHRwVXJsTWF0Y2hbMF0ubGVuZ3RoKTtcclxuICAgIHVybCA9IG5ld1NjaGVtZSArICc6Ly8nICsgdXJsQWZ0ZXJIdHRwO1xyXG4gIH1cclxuXHJcbiAgLy8gUHJlZml4IEZRRE5zIGJ1dCBub3QgcmVsYXRpdmUgVVJMc1xyXG4gIGlmICh1cmwuaW5kZXhPZignOi8vJykgPT09IC0xICYmICF1cmwuc3RhcnRzV2l0aCgnLycpKSB7XHJcbiAgICB1cmwgPSBuZXdTY2hlbWVCYXNlICsgJzovLycgKyB1cmw7XHJcbiAgfVxyXG5cclxuICAvLyBYWFggVGhpcyBpcyBub3Qgd2hhdCB3ZSBzaG91bGQgYmUgZG9pbmc6IGlmIEkgaGF2ZSBhIHNpdGVcclxuICAvLyBkZXBsb3llZCBhdCBcIi9mb29cIiwgdGhlbiBERFAuY29ubmVjdChcIi9cIikgc2hvdWxkIGFjdHVhbGx5IGNvbm5lY3RcclxuICAvLyB0byBcIi9cIiwgbm90IHRvIFwiL2Zvb1wiLiBcIi9cIiBpcyBhbiBhYnNvbHV0ZSBwYXRoLiAoQ29udHJhc3Q6IGlmXHJcbiAgLy8gZGVwbG95ZWQgYXQgXCIvZm9vXCIsIGl0IHdvdWxkIGJlIHJlYXNvbmFibGUgZm9yIEREUC5jb25uZWN0KFwiYmFyXCIpXHJcbiAgLy8gdG8gY29ubmVjdCB0byBcIi9mb28vYmFyXCIpLlxyXG4gIC8vXHJcbiAgLy8gV2Ugc2hvdWxkIG1ha2UgdGhpcyBwcm9wZXJseSBob25vciBhYnNvbHV0ZSBwYXRocyByYXRoZXIgdGhhblxyXG4gIC8vIGZvcmNpbmcgdGhlIHBhdGggdG8gYmUgcmVsYXRpdmUgdG8gdGhlIHNpdGUgcm9vdC4gU2ltdWx0YW5lb3VzbHksXHJcbiAgLy8gd2Ugc2hvdWxkIHNldCBERFBfREVGQVVMVF9DT05ORUNUSU9OX1VSTCB0byBpbmNsdWRlIHRoZSBzaXRlXHJcbiAgLy8gcm9vdC4gU2VlIGFsc28gY2xpZW50X2NvbnZlbmllbmNlLmpzICNSYXRpb25hbGl6aW5nUmVsYXRpdmVERFBVUkxzXHJcbiAgdXJsID0gTWV0ZW9yLl9yZWxhdGl2ZVRvU2l0ZVJvb3RVcmwodXJsKTtcclxuXHJcbiAgaWYgKHVybC5lbmRzV2l0aCgnLycpKSByZXR1cm4gdXJsICsgc3ViUGF0aDtcclxuICBlbHNlIHJldHVybiB1cmwgKyAnLycgKyBzdWJQYXRoO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9Tb2NranNVcmwodXJsKSB7XHJcbiAgcmV0dXJuIHRyYW5zbGF0ZVVybCh1cmwsICdodHRwJywgJ3NvY2tqcycpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9XZWJzb2NrZXRVcmwodXJsKSB7XHJcbiAgcmV0dXJuIHRyYW5zbGF0ZVVybCh1cmwsICd3cycsICd3ZWJzb2NrZXQnKTtcclxufVxyXG4iXX0=
