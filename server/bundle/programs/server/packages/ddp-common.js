(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var check = Package.check.check;
var Match = Package.check.Match;
var Random = Package.random.Random;
var ECMAScript = Package.ecmascript.ECMAScript;
var EJSON = Package.ejson.EJSON;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var Retry = Package.retry.Retry;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var DDPCommon;

var require = meteorInstall({"node_modules":{"meteor":{"ddp-common":{"namespace.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ddp-common/namespace.js                                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/**
 * @namespace DDPCommon
 * @summary Namespace for DDPCommon-related methods/classes. Shared between 
 * `ddp-client` and `ddp-server`, where the ddp-client is the implementation
 * of a ddp client for both client AND server; and the ddp server is the
 * implementation of the livedata server and stream server. Common 
 * functionality shared between both can be shared under this namespace
 */
DDPCommon = {};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"heartbeat.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ddp-common/heartbeat.js                                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// Heartbeat options:
//   heartbeatInterval: interval to send pings, in milliseconds.
//   heartbeatTimeout: timeout to close the connection if a reply isn't
//     received, in milliseconds.
//   sendPing: function to call to send a ping on the connection.
//   onTimeout: function to call to close the connection.
DDPCommon.Heartbeat = class Heartbeat {
  constructor(options) {
    this.heartbeatInterval = options.heartbeatInterval;
    this.heartbeatTimeout = options.heartbeatTimeout;
    this._sendPing = options.sendPing;
    this._onTimeout = options.onTimeout;
    this._seenPacket = false;
    this._heartbeatIntervalHandle = null;
    this._heartbeatTimeoutHandle = null;
  }

  stop() {
    this._clearHeartbeatIntervalTimer();

    this._clearHeartbeatTimeoutTimer();
  }

  start() {
    this.stop();

    this._startHeartbeatIntervalTimer();
  }

  _startHeartbeatIntervalTimer() {
    this._heartbeatIntervalHandle = Meteor.setInterval(() => this._heartbeatIntervalFired(), this.heartbeatInterval);
  }

  _startHeartbeatTimeoutTimer() {
    this._heartbeatTimeoutHandle = Meteor.setTimeout(() => this._heartbeatTimeoutFired(), this.heartbeatTimeout);
  }

  _clearHeartbeatIntervalTimer() {
    if (this._heartbeatIntervalHandle) {
      Meteor.clearInterval(this._heartbeatIntervalHandle);
      this._heartbeatIntervalHandle = null;
    }
  }

  _clearHeartbeatTimeoutTimer() {
    if (this._heartbeatTimeoutHandle) {
      Meteor.clearTimeout(this._heartbeatTimeoutHandle);
      this._heartbeatTimeoutHandle = null;
    }
  } // The heartbeat interval timer is fired when we should send a ping.


  _heartbeatIntervalFired() {
    // don't send ping if we've seen a packet since we last checked,
    // *or* if we have already sent a ping and are awaiting a timeout.
    // That shouldn't happen, but it's possible if
    // `this.heartbeatInterval` is smaller than
    // `this.heartbeatTimeout`.
    if (!this._seenPacket && !this._heartbeatTimeoutHandle) {
      this._sendPing(); // Set up timeout, in case a pong doesn't arrive in time.


      this._startHeartbeatTimeoutTimer();
    }

    this._seenPacket = false;
  } // The heartbeat timeout timer is fired when we sent a ping, but we
  // timed out waiting for the pong.


  _heartbeatTimeoutFired() {
    this._heartbeatTimeoutHandle = null;

    this._onTimeout();
  }

  messageReceived() {
    // Tell periodic checkin that we have seen a packet, and thus it
    // does not need to send a ping this cycle.
    this._seenPacket = true; // If we were waiting for a pong, we got it.

    if (this._heartbeatTimeoutHandle) {
      this._clearHeartbeatTimeoutTimer();
    }
  }

};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"utils.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ddp-common/utils.js                                                                                       //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";

module.export({
  hasOwn: () => hasOwn,
  slice: () => slice,
  keys: () => keys,
  isEmpty: () => isEmpty,
  last: () => last
});
const hasOwn = Object.prototype.hasOwnProperty;
const slice = Array.prototype.slice;

function keys(obj) {
  return Object.keys(Object(obj));
}

function isEmpty(obj) {
  if (obj == null) {
    return true;
  }

  if (Array.isArray(obj) || typeof obj === "string") {
    return obj.length === 0;
  }

  for (const key in obj) {
    if (hasOwn.call(obj, key)) {
      return false;
    }
  }

  return true;
}

function last(array, n, guard) {
  if (array == null) {
    return;
  }

  if (n == null || guard) {
    return array[array.length - 1];
  }

  return slice.call(array, Math.max(array.length - n, 0));
}

DDPCommon.SUPPORTED_DDP_VERSIONS = ['1', 'pre2', 'pre1'];

DDPCommon.parseDDP = function (stringMessage) {
  try {
    var msg = JSON.parse(stringMessage);
  } catch (e) {
    Meteor._debug("Discarding message with invalid JSON", stringMessage);

    return null;
  } // DDP messages must be objects.


  if (msg === null || typeof msg !== 'object') {
    Meteor._debug("Discarding non-object DDP message", stringMessage);

    return null;
  } // massage msg to get it into "abstract ddp" rather than "wire ddp" format.
  // switch between "cleared" rep of unsetting fields and "undefined"
  // rep of same


  if (hasOwn.call(msg, 'cleared')) {
    if (!hasOwn.call(msg, 'fields')) {
      msg.fields = {};
    }

    msg.cleared.forEach(clearKey => {
      msg.fields[clearKey] = undefined;
    });
    delete msg.cleared;
  }

  ['fields', 'params', 'result'].forEach(field => {
    if (hasOwn.call(msg, field)) {
      msg[field] = EJSON._adjustTypesFromJSONValue(msg[field]);
    }
  });
  return msg;
};

DDPCommon.stringifyDDP = function (msg) {
  const copy = EJSON.clone(msg); // swizzle 'changed' messages from 'fields undefined' rep to 'fields
  // and cleared' rep

  if (hasOwn.call(msg, 'fields')) {
    const cleared = [];
    Object.keys(msg.fields).forEach(key => {
      const value = msg.fields[key];

      if (typeof value === "undefined") {
        cleared.push(key);
        delete copy.fields[key];
      }
    });

    if (!isEmpty(cleared)) {
      copy.cleared = cleared;
    }

    if (isEmpty(copy.fields)) {
      delete copy.fields;
    }
  } // adjust types to basic


  ['fields', 'params', 'result'].forEach(field => {
    if (hasOwn.call(copy, field)) {
      copy[field] = EJSON._adjustTypesToJSONValue(copy[field]);
    }
  });

  if (msg.id && typeof msg.id !== 'string') {
    throw new Error("Message id is not a string");
  }

  return JSON.stringify(copy);
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"method_invocation.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ddp-common/method_invocation.js                                                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// Instance name is this because it is usually referred to as this inside a
// method definition

/**
 * @summary The state for a single invocation of a method, referenced by this
 * inside a method definition.
 * @param {Object} options
 * @instanceName this
 * @showInstanceName true
 */
DDPCommon.MethodInvocation = class MethodInvocation {
  constructor(options) {
    // true if we're running not the actual method, but a stub (that is,
    // if we're on a client (which may be a browser, or in the future a
    // server connecting to another server) and presently running a
    // simulation of a server-side method for latency compensation
    // purposes). not currently true except in a client such as a browser,
    // since there's usually no point in running stubs unless you have a
    // zero-latency connection to the user.

    /**
     * @summary Access inside a method invocation.  Boolean value, true if this invocation is a stub.
     * @locus Anywhere
     * @name  isSimulation
     * @memberOf DDPCommon.MethodInvocation
     * @instance
     * @type {Boolean}
     */
    this.isSimulation = options.isSimulation; // call this function to allow other method invocations (from the
    // same client) to continue running without waiting for this one to
    // complete.

    this._unblock = options.unblock || function () {};

    this._calledUnblock = false; // current user id

    /**
     * @summary The id of the user that made this method call, or `null` if no user was logged in.
     * @locus Anywhere
     * @name  userId
     * @memberOf DDPCommon.MethodInvocation
     * @instance
     */

    this.userId = options.userId; // sets current user id in all appropriate server contexts and
    // reruns subscriptions

    this._setUserId = options.setUserId || function () {}; // On the server, the connection this method call came in on.

    /**
     * @summary Access inside a method invocation. The [connection](#meteor_onconnection) that this method was received on. `null` if the method is not associated with a connection, eg. a server initiated method call. Calls to methods made from a server method which was in turn initiated from the client share the same `connection`.
     * @locus Server
     * @name  connection
     * @memberOf DDPCommon.MethodInvocation
     * @instance
     */


    this.connection = options.connection; // The seed for randomStream value generation

    this.randomSeed = options.randomSeed; // This is set by RandomStream.get; and holds the random stream state

    this.randomStream = null;
  }
  /**
   * @summary Call inside a method invocation.  Allow subsequent method from this client to begin running in a new fiber.
   * @locus Server
   * @memberOf DDPCommon.MethodInvocation
   * @instance
   */


  unblock() {
    this._calledUnblock = true;

    this._unblock();
  }
  /**
   * @summary Set the logged in user.
   * @locus Server
   * @memberOf DDPCommon.MethodInvocation
   * @instance
   * @param {String | null} userId The value that should be returned by `userId` on this connection.
   */


  setUserId(userId) {
    if (this._calledUnblock) {
      throw new Error("Can't call setUserId in a method after calling unblock");
    }

    this.userId = userId;

    this._setUserId(userId);
  }

};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"random_stream.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/ddp-common/random_stream.js                                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// RandomStream allows for generation of pseudo-random values, from a seed.
//
// We use this for consistent 'random' numbers across the client and server.
// We want to generate probably-unique IDs on the client, and we ideally want
// the server to generate the same IDs when it executes the method.
//
// For generated values to be the same, we must seed ourselves the same way,
// and we must keep track of the current state of our pseudo-random generators.
// We call this state the scope. By default, we use the current DDP method
// invocation as our scope.  DDP now allows the client to specify a randomSeed.
// If a randomSeed is provided it will be used to seed our random sequences.
// In this way, client and server method calls will generate the same values.
//
// We expose multiple named streams; each stream is independent
// and is seeded differently (but predictably from the name).
// By using multiple streams, we support reordering of requests,
// as long as they occur on different streams.
//
// @param options {Optional Object}
//   seed: Array or value - Seed value(s) for the generator.
//                          If an array, will be used as-is
//                          If a value, will be converted to a single-value array
//                          If omitted, a random array will be used as the seed.
DDPCommon.RandomStream = class RandomStream {
  constructor(options) {
    this.seed = [].concat(options.seed || randomToken());
    this.sequences = Object.create(null);
  } // Get a random sequence with the specified name, creating it if does not exist.
  // New sequences are seeded with the seed concatenated with the name.
  // By passing a seed into Random.create, we use the Alea generator.


  _sequence(name) {
    var self = this;
    var sequence = self.sequences[name] || null;

    if (sequence === null) {
      var sequenceSeed = self.seed.concat(name);

      for (var i = 0; i < sequenceSeed.length; i++) {
        if (typeof sequenceSeed[i] === "function") {
          sequenceSeed[i] = sequenceSeed[i]();
        }
      }

      self.sequences[name] = sequence = Random.createWithSeeds.apply(null, sequenceSeed);
    }

    return sequence;
  }

}; // Returns a random string of sufficient length for a random seed.
// This is a placeholder function; a similar function is planned
// for Random itself; when that is added we should remove this function,
// and call Random's randomToken instead.

function randomToken() {
  return Random.hexString(20);
}

; // Returns the random stream with the specified name, in the specified
// scope. If a scope is passed, then we use that to seed a (not
// cryptographically secure) PRNG using the fast Alea algorithm.  If
// scope is null (or otherwise falsey) then we use a generated seed.
//
// However, scope will normally be the current DDP method invocation,
// so we'll use the stream with the specified name, and we should get
// consistent values on the client and server sides of a method call.

DDPCommon.RandomStream.get = function (scope, name) {
  if (!name) {
    name = "default";
  }

  if (!scope) {
    // There was no scope passed in; the sequence won't actually be
    // reproducible. but make it fast (and not cryptographically
    // secure) anyways, so that the behavior is similar to what you'd
    // get by passing in a scope.
    return Random.insecure;
  }

  var randomStream = scope.randomStream;

  if (!randomStream) {
    scope.randomStream = randomStream = new DDPCommon.RandomStream({
      seed: scope.randomSeed
    });
  }

  return randomStream._sequence(name);
}; // Creates a randomSeed for passing to a method call.
// Note that we take enclosing as an argument,
// though we expect it to be DDP._CurrentMethodInvocation.get()
// However, we often evaluate makeRpcSeed lazily, and thus the relevant
// invocation may not be the one currently in scope.
// If enclosing is null, we'll use Random and values won't be repeatable.


DDPCommon.makeRpcSeed = function (enclosing, methodName) {
  var stream = DDPCommon.RandomStream.get(enclosing, '/rpc/' + methodName);
  return stream.hexString(20);
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/ddp-common/namespace.js");
require("/node_modules/meteor/ddp-common/heartbeat.js");
require("/node_modules/meteor/ddp-common/utils.js");
require("/node_modules/meteor/ddp-common/method_invocation.js");
require("/node_modules/meteor/ddp-common/random_stream.js");

/* Exports */
Package._define("ddp-common", {
  DDPCommon: DDPCommon
});

})();

//# sourceURL=meteor://💻app/packages/ddp-common.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvZGRwLWNvbW1vbi9uYW1lc3BhY2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2RkcC1jb21tb24vaGVhcnRiZWF0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9kZHAtY29tbW9uL3V0aWxzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9kZHAtY29tbW9uL21ldGhvZF9pbnZvY2F0aW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9kZHAtY29tbW9uL3JhbmRvbV9zdHJlYW0uanMiXSwibmFtZXMiOlsiRERQQ29tbW9uIiwiSGVhcnRiZWF0IiwiY29uc3RydWN0b3IiLCJvcHRpb25zIiwiaGVhcnRiZWF0SW50ZXJ2YWwiLCJoZWFydGJlYXRUaW1lb3V0IiwiX3NlbmRQaW5nIiwic2VuZFBpbmciLCJfb25UaW1lb3V0Iiwib25UaW1lb3V0IiwiX3NlZW5QYWNrZXQiLCJfaGVhcnRiZWF0SW50ZXJ2YWxIYW5kbGUiLCJfaGVhcnRiZWF0VGltZW91dEhhbmRsZSIsInN0b3AiLCJfY2xlYXJIZWFydGJlYXRJbnRlcnZhbFRpbWVyIiwiX2NsZWFySGVhcnRiZWF0VGltZW91dFRpbWVyIiwic3RhcnQiLCJfc3RhcnRIZWFydGJlYXRJbnRlcnZhbFRpbWVyIiwiTWV0ZW9yIiwic2V0SW50ZXJ2YWwiLCJfaGVhcnRiZWF0SW50ZXJ2YWxGaXJlZCIsIl9zdGFydEhlYXJ0YmVhdFRpbWVvdXRUaW1lciIsInNldFRpbWVvdXQiLCJfaGVhcnRiZWF0VGltZW91dEZpcmVkIiwiY2xlYXJJbnRlcnZhbCIsImNsZWFyVGltZW91dCIsIm1lc3NhZ2VSZWNlaXZlZCIsIm1vZHVsZSIsImV4cG9ydCIsImhhc093biIsInNsaWNlIiwia2V5cyIsImlzRW1wdHkiLCJsYXN0IiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJBcnJheSIsIm9iaiIsImlzQXJyYXkiLCJsZW5ndGgiLCJrZXkiLCJjYWxsIiwiYXJyYXkiLCJuIiwiZ3VhcmQiLCJNYXRoIiwibWF4IiwiU1VQUE9SVEVEX0REUF9WRVJTSU9OUyIsInBhcnNlRERQIiwic3RyaW5nTWVzc2FnZSIsIm1zZyIsIkpTT04iLCJwYXJzZSIsImUiLCJfZGVidWciLCJmaWVsZHMiLCJjbGVhcmVkIiwiZm9yRWFjaCIsImNsZWFyS2V5IiwidW5kZWZpbmVkIiwiZmllbGQiLCJFSlNPTiIsIl9hZGp1c3RUeXBlc0Zyb21KU09OVmFsdWUiLCJzdHJpbmdpZnlERFAiLCJjb3B5IiwiY2xvbmUiLCJ2YWx1ZSIsInB1c2giLCJfYWRqdXN0VHlwZXNUb0pTT05WYWx1ZSIsImlkIiwiRXJyb3IiLCJzdHJpbmdpZnkiLCJNZXRob2RJbnZvY2F0aW9uIiwiaXNTaW11bGF0aW9uIiwiX3VuYmxvY2siLCJ1bmJsb2NrIiwiX2NhbGxlZFVuYmxvY2siLCJ1c2VySWQiLCJfc2V0VXNlcklkIiwic2V0VXNlcklkIiwiY29ubmVjdGlvbiIsInJhbmRvbVNlZWQiLCJyYW5kb21TdHJlYW0iLCJSYW5kb21TdHJlYW0iLCJzZWVkIiwiY29uY2F0IiwicmFuZG9tVG9rZW4iLCJzZXF1ZW5jZXMiLCJjcmVhdGUiLCJfc2VxdWVuY2UiLCJuYW1lIiwic2VsZiIsInNlcXVlbmNlIiwic2VxdWVuY2VTZWVkIiwiaSIsIlJhbmRvbSIsImNyZWF0ZVdpdGhTZWVkcyIsImFwcGx5IiwiaGV4U3RyaW5nIiwiZ2V0Iiwic2NvcGUiLCJpbnNlY3VyZSIsIm1ha2VScGNTZWVkIiwiZW5jbG9zaW5nIiwibWV0aG9kTmFtZSIsInN0cmVhbSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7QUFRQUEsU0FBUyxHQUFHLEVBQVosQzs7Ozs7Ozs7Ozs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQUEsU0FBUyxDQUFDQyxTQUFWLEdBQXNCLE1BQU1BLFNBQU4sQ0FBZ0I7QUFDcENDLGFBQVcsQ0FBQ0Ms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Q0FBUDtBQUNELENBSEQsQyIsImZpbGUiOiIvcGFja2FnZXMvZGRwLWNvbW1vbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZSBERFBDb21tb25cbiAqIEBzdW1tYXJ5IE5hbWVzcGFjZSBmb3IgRERQQ29tbW9uLXJlbGF0ZWQgbWV0aG9kcy9jbGFzc2VzLiBTaGFyZWQgYmV0d2VlbiBcbiAqIGBkZHAtY2xpZW50YCBhbmQgYGRkcC1zZXJ2ZXJgLCB3aGVyZSB0aGUgZGRwLWNsaWVudCBpcyB0aGUgaW1wbGVtZW50YXRpb25cbiAqIG9mIGEgZGRwIGNsaWVudCBmb3IgYm90aCBjbGllbnQgQU5EIHNlcnZlcjsgYW5kIHRoZSBkZHAgc2VydmVyIGlzIHRoZVxuICogaW1wbGVtZW50YXRpb24gb2YgdGhlIGxpdmVkYXRhIHNlcnZlciBhbmQgc3RyZWFtIHNlcnZlci4gQ29tbW9uIFxuICogZnVuY3Rpb25hbGl0eSBzaGFyZWQgYmV0d2VlbiBib3RoIGNhbiBiZSBzaGFyZWQgdW5kZXIgdGhpcyBuYW1lc3BhY2VcbiAqL1xuRERQQ29tbW9uID0ge307XG4iLCIvLyBIZWFydGJlYXQgb3B0aW9uczpcbi8vICAgaGVhcnRiZWF0SW50ZXJ2YWw6IGludGVydmFsIHRvIHNlbmQgcGluZ3MsIGluIG1pbGxpc2Vjb25kcy5cbi8vICAgaGVhcnRiZWF0VGltZW91dDogdGltZW91dCB0byBjbG9zZSB0aGUgY29ubmVjdGlvbiBpZiBhIHJlcGx5IGlzbid0XG4vLyAgICAgcmVjZWl2ZWQsIGluIG1pbGxpc2Vjb25kcy5cbi8vICAgc2VuZFBpbmc6IGZ1bmN0aW9uIHRvIGNhbGwgdG8gc2VuZCBhIHBpbmcgb24gdGhlIGNvbm5lY3Rpb24uXG4vLyAgIG9uVGltZW91dDogZnVuY3Rpb24gdG8gY2FsbCB0byBjbG9zZSB0aGUgY29ubmVjdGlvbi5cblxuRERQQ29tbW9uLkhlYXJ0YmVhdCA9IGNsYXNzIEhlYXJ0YmVhdCB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICB0aGlzLmhlYXJ0YmVhdEludGVydmFsID0gb3B0aW9ucy5oZWFydGJlYXRJbnRlcnZhbDtcbiAgICB0aGlzLmhlYXJ0YmVhdFRpbWVvdXQgPSBvcHRpb25zLmhlYXJ0YmVhdFRpbWVvdXQ7XG4gICAgdGhpcy5fc2VuZFBpbmcgPSBvcHRpb25zLnNlbmRQaW5nO1xuICAgIHRoaXMuX29uVGltZW91dCA9IG9wdGlvbnMub25UaW1lb3V0O1xuICAgIHRoaXMuX3NlZW5QYWNrZXQgPSBmYWxzZTtcblxuICAgIHRoaXMuX2hlYXJ0YmVhdEludGVydmFsSGFuZGxlID0gbnVsbDtcbiAgICB0aGlzLl9oZWFydGJlYXRUaW1lb3V0SGFuZGxlID0gbnVsbDtcbiAgfVxuXG4gIHN0b3AoKSB7XG4gICAgdGhpcy5fY2xlYXJIZWFydGJlYXRJbnRlcnZhbFRpbWVyKCk7XG4gICAgdGhpcy5fY2xlYXJIZWFydGJlYXRUaW1lb3V0VGltZXIoKTtcbiAgfVxuXG4gIHN0YXJ0KCkge1xuICAgIHRoaXMuc3RvcCgpO1xuICAgIHRoaXMuX3N0YXJ0SGVhcnRiZWF0SW50ZXJ2YWxUaW1lcigpO1xuICB9XG5cbiAgX3N0YXJ0SGVhcnRiZWF0SW50ZXJ2YWxUaW1lcigpIHtcbiAgICB0aGlzLl9oZWFydGJlYXRJbnRlcnZhbEhhbmRsZSA9IE1ldGVvci5zZXRJbnRlcnZhbChcbiAgICAgICgpID0+IHRoaXMuX2hlYXJ0YmVhdEludGVydmFsRmlyZWQoKSxcbiAgICAgIHRoaXMuaGVhcnRiZWF0SW50ZXJ2YWxcbiAgICApO1xuICB9XG5cbiAgX3N0YXJ0SGVhcnRiZWF0VGltZW91dFRpbWVyKCkge1xuICAgIHRoaXMuX2hlYXJ0YmVhdFRpbWVvdXRIYW5kbGUgPSBNZXRlb3Iuc2V0VGltZW91dChcbiAgICAgICgpID0+IHRoaXMuX2hlYXJ0YmVhdFRpbWVvdXRGaXJlZCgpLFxuICAgICAgdGhpcy5oZWFydGJlYXRUaW1lb3V0XG4gICAgKTtcbiAgfVxuXG4gIF9jbGVhckhlYXJ0YmVhdEludGVydmFsVGltZXIoKSB7XG4gICAgaWYgKHRoaXMuX2hlYXJ0YmVhdEludGVydmFsSGFuZGxlKSB7XG4gICAgICBNZXRlb3IuY2xlYXJJbnRlcnZhbCh0aGlzLl9oZWFydGJlYXRJbnRlcnZhbEhhbmRsZSk7XG4gICAgICB0aGlzLl9oZWFydGJlYXRJbnRlcnZhbEhhbmRsZSA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgX2NsZWFySGVhcnRiZWF0VGltZW91dFRpbWVyKCkge1xuICAgIGlmICh0aGlzLl9oZWFydGJlYXRUaW1lb3V0SGFuZGxlKSB7XG4gICAgICBNZXRlb3IuY2xlYXJUaW1lb3V0KHRoaXMuX2hlYXJ0YmVhdFRpbWVvdXRIYW5kbGUpO1xuICAgICAgdGhpcy5faGVhcnRiZWF0VGltZW91dEhhbmRsZSA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgLy8gVGhlIGhlYXJ0YmVhdCBpbnRlcnZhbCB0aW1lciBpcyBmaXJlZCB3aGVuIHdlIHNob3VsZCBzZW5kIGEgcGluZy5cbiAgX2hlYXJ0YmVhdEludGVydmFsRmlyZWQoKSB7XG4gICAgLy8gZG9uJ3Qgc2VuZCBwaW5nIGlmIHdlJ3ZlIHNlZW4gYSBwYWNrZXQgc2luY2Ugd2UgbGFzdCBjaGVja2VkLFxuICAgIC8vICpvciogaWYgd2UgaGF2ZSBhbHJlYWR5IHNlbnQgYSBwaW5nIGFuZCBhcmUgYXdhaXRpbmcgYSB0aW1lb3V0LlxuICAgIC8vIFRoYXQgc2hvdWxkbid0IGhhcHBlbiwgYnV0IGl0J3MgcG9zc2libGUgaWZcbiAgICAvLyBgdGhpcy5oZWFydGJlYXRJbnRlcnZhbGAgaXMgc21hbGxlciB0aGFuXG4gICAgLy8gYHRoaXMuaGVhcnRiZWF0VGltZW91dGAuXG4gICAgaWYgKCEgdGhpcy5fc2VlblBhY2tldCAmJiAhIHRoaXMuX2hlYXJ0YmVhdFRpbWVvdXRIYW5kbGUpIHtcbiAgICAgIHRoaXMuX3NlbmRQaW5nKCk7XG4gICAgICAvLyBTZXQgdXAgdGltZW91dCwgaW4gY2FzZSBhIHBvbmcgZG9lc24ndCBhcnJpdmUgaW4gdGltZS5cbiAgICAgIHRoaXMuX3N0YXJ0SGVhcnRiZWF0VGltZW91dFRpbWVyKCk7XG4gICAgfVxuICAgIHRoaXMuX3NlZW5QYWNrZXQgPSBmYWxzZTtcbiAgfVxuXG4gIC8vIFRoZSBoZWFydGJlYXQgdGltZW91dCB0aW1lciBpcyBmaXJlZCB3aGVuIHdlIHNlbnQgYSBwaW5nLCBidXQgd2VcbiAgLy8gdGltZWQgb3V0IHdhaXRpbmcgZm9yIHRoZSBwb25nLlxuICBfaGVhcnRiZWF0VGltZW91dEZpcmVkKCkge1xuICAgIHRoaXMuX2hlYXJ0YmVhdFRpbWVvdXRIYW5kbGUgPSBudWxsO1xuICAgIHRoaXMuX29uVGltZW91dCgpO1xuICB9XG5cbiAgbWVzc2FnZVJlY2VpdmVkKCkge1xuICAgIC8vIFRlbGwgcGVyaW9kaWMgY2hlY2tpbiB0aGF0IHdlIGhhdmUgc2VlbiBhIHBhY2tldCwgYW5kIHRodXMgaXRcbiAgICAvLyBkb2VzIG5vdCBuZWVkIHRvIHNlbmQgYSBwaW5nIHRoaXMgY3ljbGUuXG4gICAgdGhpcy5fc2VlblBhY2tldCA9IHRydWU7XG4gICAgLy8gSWYgd2Ugd2VyZSB3YWl0aW5nIGZvciBhIHBvbmcsIHdlIGdvdCBpdC5cbiAgICBpZiAodGhpcy5faGVhcnRiZWF0VGltZW91dEhhbmRsZSkge1xuICAgICAgdGhpcy5fY2xlYXJIZWFydGJlYXRUaW1lb3V0VGltZXIoKTtcbiAgICB9XG4gIH1cbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuZXhwb3J0IGNvbnN0IGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5leHBvcnQgY29uc3Qgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG5cbmV4cG9ydCBmdW5jdGlvbiBrZXlzKG9iaikge1xuICByZXR1cm4gT2JqZWN0LmtleXMoT2JqZWN0KG9iaikpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNFbXB0eShvYmopIHtcbiAgaWYgKG9iaiA9PSBudWxsKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShvYmopIHx8XG4gICAgICB0eXBlb2Ygb2JqID09PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIG9iai5sZW5ndGggPT09IDA7XG4gIH1cblxuICBmb3IgKGNvbnN0IGtleSBpbiBvYmopIHtcbiAgICBpZiAoaGFzT3duLmNhbGwob2JqLCBrZXkpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsYXN0KGFycmF5LCBuLCBndWFyZCkge1xuICBpZiAoYXJyYXkgPT0gbnVsbCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICgobiA9PSBudWxsKSB8fCBndWFyZCkge1xuICAgIHJldHVybiBhcnJheVthcnJheS5sZW5ndGggLSAxXTtcbiAgfVxuXG4gIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCBNYXRoLm1heChhcnJheS5sZW5ndGggLSBuLCAwKSk7XG59XG5cbkREUENvbW1vbi5TVVBQT1JURURfRERQX1ZFUlNJT05TID0gWyAnMScsICdwcmUyJywgJ3ByZTEnIF07XG5cbkREUENvbW1vbi5wYXJzZUREUCA9IGZ1bmN0aW9uIChzdHJpbmdNZXNzYWdlKSB7XG4gIHRyeSB7XG4gICAgdmFyIG1zZyA9IEpTT04ucGFyc2Uoc3RyaW5nTWVzc2FnZSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBNZXRlb3IuX2RlYnVnKFwiRGlzY2FyZGluZyBtZXNzYWdlIHdpdGggaW52YWxpZCBKU09OXCIsIHN0cmluZ01lc3NhZ2UpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIC8vIEREUCBtZXNzYWdlcyBtdXN0IGJlIG9iamVjdHMuXG4gIGlmIChtc2cgPT09IG51bGwgfHwgdHlwZW9mIG1zZyAhPT0gJ29iamVjdCcpIHtcbiAgICBNZXRlb3IuX2RlYnVnKFwiRGlzY2FyZGluZyBub24tb2JqZWN0IEREUCBtZXNzYWdlXCIsIHN0cmluZ01lc3NhZ2UpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gbWFzc2FnZSBtc2cgdG8gZ2V0IGl0IGludG8gXCJhYnN0cmFjdCBkZHBcIiByYXRoZXIgdGhhbiBcIndpcmUgZGRwXCIgZm9ybWF0LlxuXG4gIC8vIHN3aXRjaCBiZXR3ZWVuIFwiY2xlYXJlZFwiIHJlcCBvZiB1bnNldHRpbmcgZmllbGRzIGFuZCBcInVuZGVmaW5lZFwiXG4gIC8vIHJlcCBvZiBzYW1lXG4gIGlmIChoYXNPd24uY2FsbChtc2csICdjbGVhcmVkJykpIHtcbiAgICBpZiAoISBoYXNPd24uY2FsbChtc2csICdmaWVsZHMnKSkge1xuICAgICAgbXNnLmZpZWxkcyA9IHt9O1xuICAgIH1cbiAgICBtc2cuY2xlYXJlZC5mb3JFYWNoKGNsZWFyS2V5ID0+IHtcbiAgICAgIG1zZy5maWVsZHNbY2xlYXJLZXldID0gdW5kZWZpbmVkO1xuICAgIH0pO1xuICAgIGRlbGV0ZSBtc2cuY2xlYXJlZDtcbiAgfVxuXG4gIFsnZmllbGRzJywgJ3BhcmFtcycsICdyZXN1bHQnXS5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICBpZiAoaGFzT3duLmNhbGwobXNnLCBmaWVsZCkpIHtcbiAgICAgIG1zZ1tmaWVsZF0gPSBFSlNPTi5fYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlKG1zZ1tmaWVsZF0pO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIG1zZztcbn07XG5cbkREUENvbW1vbi5zdHJpbmdpZnlERFAgPSBmdW5jdGlvbiAobXNnKSB7XG4gIGNvbnN0IGNvcHkgPSBFSlNPTi5jbG9uZShtc2cpO1xuXG4gIC8vIHN3aXp6bGUgJ2NoYW5nZWQnIG1lc3NhZ2VzIGZyb20gJ2ZpZWxkcyB1bmRlZmluZWQnIHJlcCB0byAnZmllbGRzXG4gIC8vIGFuZCBjbGVhcmVkJyByZXBcbiAgaWYgKGhhc093bi5jYWxsKG1zZywgJ2ZpZWxkcycpKSB7XG4gICAgY29uc3QgY2xlYXJlZCA9IFtdO1xuXG4gICAgT2JqZWN0LmtleXMobXNnLmZpZWxkcykuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgY29uc3QgdmFsdWUgPSBtc2cuZmllbGRzW2tleV07XG5cbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgY2xlYXJlZC5wdXNoKGtleSk7XG4gICAgICAgIGRlbGV0ZSBjb3B5LmZpZWxkc1trZXldO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKCEgaXNFbXB0eShjbGVhcmVkKSkge1xuICAgICAgY29weS5jbGVhcmVkID0gY2xlYXJlZDtcbiAgICB9XG5cbiAgICBpZiAoaXNFbXB0eShjb3B5LmZpZWxkcykpIHtcbiAgICAgIGRlbGV0ZSBjb3B5LmZpZWxkcztcbiAgICB9XG4gIH1cblxuICAvLyBhZGp1c3QgdHlwZXMgdG8gYmFzaWNcbiAgWydmaWVsZHMnLCAncGFyYW1zJywgJ3Jlc3VsdCddLmZvckVhY2goZmllbGQgPT4ge1xuICAgIGlmIChoYXNPd24uY2FsbChjb3B5LCBmaWVsZCkpIHtcbiAgICAgIGNvcHlbZmllbGRdID0gRUpTT04uX2FkanVzdFR5cGVzVG9KU09OVmFsdWUoY29weVtmaWVsZF0pO1xuICAgIH1cbiAgfSk7XG5cbiAgaWYgKG1zZy5pZCAmJiB0eXBlb2YgbXNnLmlkICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBFcnJvcihcIk1lc3NhZ2UgaWQgaXMgbm90IGEgc3RyaW5nXCIpO1xuICB9XG5cbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGNvcHkpO1xufTtcbiIsIi8vIEluc3RhbmNlIG5hbWUgaXMgdGhpcyBiZWNhdXNlIGl0IGlzIHVzdWFsbHkgcmVmZXJyZWQgdG8gYXMgdGhpcyBpbnNpZGUgYVxuLy8gbWV0aG9kIGRlZmluaXRpb25cbi8qKlxuICogQHN1bW1hcnkgVGhlIHN0YXRlIGZvciBhIHNpbmdsZSBpbnZvY2F0aW9uIG9mIGEgbWV0aG9kLCByZWZlcmVuY2VkIGJ5IHRoaXNcbiAqIGluc2lkZSBhIG1ldGhvZCBkZWZpbml0aW9uLlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBpbnN0YW5jZU5hbWUgdGhpc1xuICogQHNob3dJbnN0YW5jZU5hbWUgdHJ1ZVxuICovXG5ERFBDb21tb24uTWV0aG9kSW52b2NhdGlvbiA9IGNsYXNzIE1ldGhvZEludm9jYXRpb24ge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgLy8gdHJ1ZSBpZiB3ZSdyZSBydW5uaW5nIG5vdCB0aGUgYWN0dWFsIG1ldGhvZCwgYnV0IGEgc3R1YiAodGhhdCBpcyxcbiAgICAvLyBpZiB3ZSdyZSBvbiBhIGNsaWVudCAod2hpY2ggbWF5IGJlIGEgYnJvd3Nlciwgb3IgaW4gdGhlIGZ1dHVyZSBhXG4gICAgLy8gc2VydmVyIGNvbm5lY3RpbmcgdG8gYW5vdGhlciBzZXJ2ZXIpIGFuZCBwcmVzZW50bHkgcnVubmluZyBhXG4gICAgLy8gc2ltdWxhdGlvbiBvZiBhIHNlcnZlci1zaWRlIG1ldGhvZCBmb3IgbGF0ZW5jeSBjb21wZW5zYXRpb25cbiAgICAvLyBwdXJwb3NlcykuIG5vdCBjdXJyZW50bHkgdHJ1ZSBleGNlcHQgaW4gYSBjbGllbnQgc3VjaCBhcyBhIGJyb3dzZXIsXG4gICAgLy8gc2luY2UgdGhlcmUncyB1c3VhbGx5IG5vIHBvaW50IGluIHJ1bm5pbmcgc3R1YnMgdW5sZXNzIHlvdSBoYXZlIGFcbiAgICAvLyB6ZXJvLWxhdGVuY3kgY29ubmVjdGlvbiB0byB0aGUgdXNlci5cblxuICAgIC8qKlxuICAgICAqIEBzdW1tYXJ5IEFjY2VzcyBpbnNpZGUgYSBtZXRob2QgaW52b2NhdGlvbi4gIEJvb2xlYW4gdmFsdWUsIHRydWUgaWYgdGhpcyBpbnZvY2F0aW9uIGlzIGEgc3R1Yi5cbiAgICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICAgKiBAbmFtZSAgaXNTaW11bGF0aW9uXG4gICAgICogQG1lbWJlck9mIEREUENvbW1vbi5NZXRob2RJbnZvY2F0aW9uXG4gICAgICogQGluc3RhbmNlXG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgdGhpcy5pc1NpbXVsYXRpb24gPSBvcHRpb25zLmlzU2ltdWxhdGlvbjtcblxuICAgIC8vIGNhbGwgdGhpcyBmdW5jdGlvbiB0byBhbGxvdyBvdGhlciBtZXRob2QgaW52b2NhdGlvbnMgKGZyb20gdGhlXG4gICAgLy8gc2FtZSBjbGllbnQpIHRvIGNvbnRpbnVlIHJ1bm5pbmcgd2l0aG91dCB3YWl0aW5nIGZvciB0aGlzIG9uZSB0b1xuICAgIC8vIGNvbXBsZXRlLlxuICAgIHRoaXMuX3VuYmxvY2sgPSBvcHRpb25zLnVuYmxvY2sgfHwgZnVuY3Rpb24gKCkge307XG4gICAgdGhpcy5fY2FsbGVkVW5ibG9jayA9IGZhbHNlO1xuXG4gICAgLy8gY3VycmVudCB1c2VyIGlkXG5cbiAgICAvKipcbiAgICAgKiBAc3VtbWFyeSBUaGUgaWQgb2YgdGhlIHVzZXIgdGhhdCBtYWRlIHRoaXMgbWV0aG9kIGNhbGwsIG9yIGBudWxsYCBpZiBubyB1c2VyIHdhcyBsb2dnZWQgaW4uXG4gICAgICogQGxvY3VzIEFueXdoZXJlXG4gICAgICogQG5hbWUgIHVzZXJJZFxuICAgICAqIEBtZW1iZXJPZiBERFBDb21tb24uTWV0aG9kSW52b2NhdGlvblxuICAgICAqIEBpbnN0YW5jZVxuICAgICAqL1xuICAgIHRoaXMudXNlcklkID0gb3B0aW9ucy51c2VySWQ7XG5cbiAgICAvLyBzZXRzIGN1cnJlbnQgdXNlciBpZCBpbiBhbGwgYXBwcm9wcmlhdGUgc2VydmVyIGNvbnRleHRzIGFuZFxuICAgIC8vIHJlcnVucyBzdWJzY3JpcHRpb25zXG4gICAgdGhpcy5fc2V0VXNlcklkID0gb3B0aW9ucy5zZXRVc2VySWQgfHwgZnVuY3Rpb24gKCkge307XG5cbiAgICAvLyBPbiB0aGUgc2VydmVyLCB0aGUgY29ubmVjdGlvbiB0aGlzIG1ldGhvZCBjYWxsIGNhbWUgaW4gb24uXG5cbiAgICAvKipcbiAgICAgKiBAc3VtbWFyeSBBY2Nlc3MgaW5zaWRlIGEgbWV0aG9kIGludm9jYXRpb24uIFRoZSBbY29ubmVjdGlvbl0oI21ldGVvcl9vbmNvbm5lY3Rpb24pIHRoYXQgdGhpcyBtZXRob2Qgd2FzIHJlY2VpdmVkIG9uLiBgbnVsbGAgaWYgdGhlIG1ldGhvZCBpcyBub3QgYXNzb2NpYXRlZCB3aXRoIGEgY29ubmVjdGlvbiwgZWcuIGEgc2VydmVyIGluaXRpYXRlZCBtZXRob2QgY2FsbC4gQ2FsbHMgdG8gbWV0aG9kcyBtYWRlIGZyb20gYSBzZXJ2ZXIgbWV0aG9kIHdoaWNoIHdhcyBpbiB0dXJuIGluaXRpYXRlZCBmcm9tIHRoZSBjbGllbnQgc2hhcmUgdGhlIHNhbWUgYGNvbm5lY3Rpb25gLlxuICAgICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICAgKiBAbmFtZSAgY29ubmVjdGlvblxuICAgICAqIEBtZW1iZXJPZiBERFBDb21tb24uTWV0aG9kSW52b2NhdGlvblxuICAgICAqIEBpbnN0YW5jZVxuICAgICAqL1xuICAgIHRoaXMuY29ubmVjdGlvbiA9IG9wdGlvbnMuY29ubmVjdGlvbjtcblxuICAgIC8vIFRoZSBzZWVkIGZvciByYW5kb21TdHJlYW0gdmFsdWUgZ2VuZXJhdGlvblxuICAgIHRoaXMucmFuZG9tU2VlZCA9IG9wdGlvbnMucmFuZG9tU2VlZDtcblxuICAgIC8vIFRoaXMgaXMgc2V0IGJ5IFJhbmRvbVN0cmVhbS5nZXQ7IGFuZCBob2xkcyB0aGUgcmFuZG9tIHN0cmVhbSBzdGF0ZVxuICAgIHRoaXMucmFuZG9tU3RyZWFtID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBDYWxsIGluc2lkZSBhIG1ldGhvZCBpbnZvY2F0aW9uLiAgQWxsb3cgc3Vic2VxdWVudCBtZXRob2QgZnJvbSB0aGlzIGNsaWVudCB0byBiZWdpbiBydW5uaW5nIGluIGEgbmV3IGZpYmVyLlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBtZW1iZXJPZiBERFBDb21tb24uTWV0aG9kSW52b2NhdGlvblxuICAgKiBAaW5zdGFuY2VcbiAgICovXG4gIHVuYmxvY2soKSB7XG4gICAgdGhpcy5fY2FsbGVkVW5ibG9jayA9IHRydWU7XG4gICAgdGhpcy5fdW5ibG9jaygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFNldCB0aGUgbG9nZ2VkIGluIHVzZXIuXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQG1lbWJlck9mIEREUENvbW1vbi5NZXRob2RJbnZvY2F0aW9uXG4gICAqIEBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge1N0cmluZyB8IG51bGx9IHVzZXJJZCBUaGUgdmFsdWUgdGhhdCBzaG91bGQgYmUgcmV0dXJuZWQgYnkgYHVzZXJJZGAgb24gdGhpcyBjb25uZWN0aW9uLlxuICAgKi9cbiAgc2V0VXNlcklkKHVzZXJJZCkge1xuICAgIGlmICh0aGlzLl9jYWxsZWRVbmJsb2NrKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBjYWxsIHNldFVzZXJJZCBpbiBhIG1ldGhvZCBhZnRlciBjYWxsaW5nIHVuYmxvY2tcIik7XG4gICAgfVxuICAgIHRoaXMudXNlcklkID0gdXNlcklkO1xuICAgIHRoaXMuX3NldFVzZXJJZCh1c2VySWQpO1xuICB9XG59O1xuIiwiLy8gUmFuZG9tU3RyZWFtIGFsbG93cyBmb3IgZ2VuZXJhdGlvbiBvZiBwc2V1ZG8tcmFuZG9tIHZhbHVlcywgZnJvbSBhIHNlZWQuXG4vL1xuLy8gV2UgdXNlIHRoaXMgZm9yIGNvbnNpc3RlbnQgJ3JhbmRvbScgbnVtYmVycyBhY3Jvc3MgdGhlIGNsaWVudCBhbmQgc2VydmVyLlxuLy8gV2Ugd2FudCB0byBnZW5lcmF0ZSBwcm9iYWJseS11bmlxdWUgSURzIG9uIHRoZSBjbGllbnQsIGFuZCB3ZSBpZGVhbGx5IHdhbnRcbi8vIHRoZSBzZXJ2ZXIgdG8gZ2VuZXJhdGUgdGhlIHNhbWUgSURzIHdoZW4gaXQgZXhlY3V0ZXMgdGhlIG1ldGhvZC5cbi8vXG4vLyBGb3IgZ2VuZXJhdGVkIHZhbHVlcyB0byBiZSB0aGUgc2FtZSwgd2UgbXVzdCBzZWVkIG91cnNlbHZlcyB0aGUgc2FtZSB3YXksXG4vLyBhbmQgd2UgbXVzdCBrZWVwIHRyYWNrIG9mIHRoZSBjdXJyZW50IHN0YXRlIG9mIG91ciBwc2V1ZG8tcmFuZG9tIGdlbmVyYXRvcnMuXG4vLyBXZSBjYWxsIHRoaXMgc3RhdGUgdGhlIHNjb3BlLiBCeSBkZWZhdWx0LCB3ZSB1c2UgdGhlIGN1cnJlbnQgRERQIG1ldGhvZFxuLy8gaW52b2NhdGlvbiBhcyBvdXIgc2NvcGUuICBERFAgbm93IGFsbG93cyB0aGUgY2xpZW50IHRvIHNwZWNpZnkgYSByYW5kb21TZWVkLlxuLy8gSWYgYSByYW5kb21TZWVkIGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgdXNlZCB0byBzZWVkIG91ciByYW5kb20gc2VxdWVuY2VzLlxuLy8gSW4gdGhpcyB3YXksIGNsaWVudCBhbmQgc2VydmVyIG1ldGhvZCBjYWxscyB3aWxsIGdlbmVyYXRlIHRoZSBzYW1lIHZhbHVlcy5cbi8vXG4vLyBXZSBleHBvc2UgbXVsdGlwbGUgbmFtZWQgc3RyZWFtczsgZWFjaCBzdHJlYW0gaXMgaW5kZXBlbmRlbnRcbi8vIGFuZCBpcyBzZWVkZWQgZGlmZmVyZW50bHkgKGJ1dCBwcmVkaWN0YWJseSBmcm9tIHRoZSBuYW1lKS5cbi8vIEJ5IHVzaW5nIG11bHRpcGxlIHN0cmVhbXMsIHdlIHN1cHBvcnQgcmVvcmRlcmluZyBvZiByZXF1ZXN0cyxcbi8vIGFzIGxvbmcgYXMgdGhleSBvY2N1ciBvbiBkaWZmZXJlbnQgc3RyZWFtcy5cbi8vXG4vLyBAcGFyYW0gb3B0aW9ucyB7T3B0aW9uYWwgT2JqZWN0fVxuLy8gICBzZWVkOiBBcnJheSBvciB2YWx1ZSAtIFNlZWQgdmFsdWUocykgZm9yIHRoZSBnZW5lcmF0b3IuXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgSWYgYW4gYXJyYXksIHdpbGwgYmUgdXNlZCBhcy1pc1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgIElmIGEgdmFsdWUsIHdpbGwgYmUgY29udmVydGVkIHRvIGEgc2luZ2xlLXZhbHVlIGFycmF5XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgSWYgb21pdHRlZCwgYSByYW5kb20gYXJyYXkgd2lsbCBiZSB1c2VkIGFzIHRoZSBzZWVkLlxuRERQQ29tbW9uLlJhbmRvbVN0cmVhbSA9IGNsYXNzIFJhbmRvbVN0cmVhbSB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICB0aGlzLnNlZWQgPSBbXS5jb25jYXQob3B0aW9ucy5zZWVkIHx8IHJhbmRvbVRva2VuKCkpO1xuICAgIHRoaXMuc2VxdWVuY2VzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgfVxuXG4gIC8vIEdldCBhIHJhbmRvbSBzZXF1ZW5jZSB3aXRoIHRoZSBzcGVjaWZpZWQgbmFtZSwgY3JlYXRpbmcgaXQgaWYgZG9lcyBub3QgZXhpc3QuXG4gIC8vIE5ldyBzZXF1ZW5jZXMgYXJlIHNlZWRlZCB3aXRoIHRoZSBzZWVkIGNvbmNhdGVuYXRlZCB3aXRoIHRoZSBuYW1lLlxuICAvLyBCeSBwYXNzaW5nIGEgc2VlZCBpbnRvIFJhbmRvbS5jcmVhdGUsIHdlIHVzZSB0aGUgQWxlYSBnZW5lcmF0b3IuXG4gIF9zZXF1ZW5jZShuYW1lKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdmFyIHNlcXVlbmNlID0gc2VsZi5zZXF1ZW5jZXNbbmFtZV0gfHwgbnVsbDtcbiAgICBpZiAoc2VxdWVuY2UgPT09IG51bGwpIHtcbiAgICAgIHZhciBzZXF1ZW5jZVNlZWQgPSBzZWxmLnNlZWQuY29uY2F0KG5hbWUpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZXF1ZW5jZVNlZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXF1ZW5jZVNlZWRbaV0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgIHNlcXVlbmNlU2VlZFtpXSA9IHNlcXVlbmNlU2VlZFtpXSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzZWxmLnNlcXVlbmNlc1tuYW1lXSA9IHNlcXVlbmNlID0gUmFuZG9tLmNyZWF0ZVdpdGhTZWVkcy5hcHBseShudWxsLCBzZXF1ZW5jZVNlZWQpO1xuICAgIH1cbiAgICByZXR1cm4gc2VxdWVuY2U7XG4gIH1cbn07XG5cbi8vIFJldHVybnMgYSByYW5kb20gc3RyaW5nIG9mIHN1ZmZpY2llbnQgbGVuZ3RoIGZvciBhIHJhbmRvbSBzZWVkLlxuLy8gVGhpcyBpcyBhIHBsYWNlaG9sZGVyIGZ1bmN0aW9uOyBhIHNpbWlsYXIgZnVuY3Rpb24gaXMgcGxhbm5lZFxuLy8gZm9yIFJhbmRvbSBpdHNlbGY7IHdoZW4gdGhhdCBpcyBhZGRlZCB3ZSBzaG91bGQgcmVtb3ZlIHRoaXMgZnVuY3Rpb24sXG4vLyBhbmQgY2FsbCBSYW5kb20ncyByYW5kb21Ub2tlbiBpbnN0ZWFkLlxuZnVuY3Rpb24gcmFuZG9tVG9rZW4oKSB7XG4gIHJldHVybiBSYW5kb20uaGV4U3RyaW5nKDIwKTtcbn07XG5cbi8vIFJldHVybnMgdGhlIHJhbmRvbSBzdHJlYW0gd2l0aCB0aGUgc3BlY2lmaWVkIG5hbWUsIGluIHRoZSBzcGVjaWZpZWRcbi8vIHNjb3BlLiBJZiBhIHNjb3BlIGlzIHBhc3NlZCwgdGhlbiB3ZSB1c2UgdGhhdCB0byBzZWVkIGEgKG5vdFxuLy8gY3J5cHRvZ3JhcGhpY2FsbHkgc2VjdXJlKSBQUk5HIHVzaW5nIHRoZSBmYXN0IEFsZWEgYWxnb3JpdGhtLiAgSWZcbi8vIHNjb3BlIGlzIG51bGwgKG9yIG90aGVyd2lzZSBmYWxzZXkpIHRoZW4gd2UgdXNlIGEgZ2VuZXJhdGVkIHNlZWQuXG4vL1xuLy8gSG93ZXZlciwgc2NvcGUgd2lsbCBub3JtYWxseSBiZSB0aGUgY3VycmVudCBERFAgbWV0aG9kIGludm9jYXRpb24sXG4vLyBzbyB3ZSdsbCB1c2UgdGhlIHN0cmVhbSB3aXRoIHRoZSBzcGVjaWZpZWQgbmFtZSwgYW5kIHdlIHNob3VsZCBnZXRcbi8vIGNvbnNpc3RlbnQgdmFsdWVzIG9uIHRoZSBjbGllbnQgYW5kIHNlcnZlciBzaWRlcyBvZiBhIG1ldGhvZCBjYWxsLlxuRERQQ29tbW9uLlJhbmRvbVN0cmVhbS5nZXQgPSBmdW5jdGlvbiAoc2NvcGUsIG5hbWUpIHtcbiAgaWYgKCFuYW1lKSB7XG4gICAgbmFtZSA9IFwiZGVmYXVsdFwiO1xuICB9XG4gIGlmICghc2NvcGUpIHtcbiAgICAvLyBUaGVyZSB3YXMgbm8gc2NvcGUgcGFzc2VkIGluOyB0aGUgc2VxdWVuY2Ugd29uJ3QgYWN0dWFsbHkgYmVcbiAgICAvLyByZXByb2R1Y2libGUuIGJ1dCBtYWtlIGl0IGZhc3QgKGFuZCBub3QgY3J5cHRvZ3JhcGhpY2FsbHlcbiAgICAvLyBzZWN1cmUpIGFueXdheXMsIHNvIHRoYXQgdGhlIGJlaGF2aW9yIGlzIHNpbWlsYXIgdG8gd2hhdCB5b3UnZFxuICAgIC8vIGdldCBieSBwYXNzaW5nIGluIGEgc2NvcGUuXG4gICAgcmV0dXJuIFJhbmRvbS5pbnNlY3VyZTtcbiAgfVxuICB2YXIgcmFuZG9tU3RyZWFtID0gc2NvcGUucmFuZG9tU3RyZWFtO1xuICBpZiAoIXJhbmRvbVN0cmVhbSkge1xuICAgIHNjb3BlLnJhbmRvbVN0cmVhbSA9IHJhbmRvbVN0cmVhbSA9IG5ldyBERFBDb21tb24uUmFuZG9tU3RyZWFtKHtcbiAgICAgIHNlZWQ6IHNjb3BlLnJhbmRvbVNlZWRcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gcmFuZG9tU3RyZWFtLl9zZXF1ZW5jZShuYW1lKTtcbn07XG5cbi8vIENyZWF0ZXMgYSByYW5kb21TZWVkIGZvciBwYXNzaW5nIHRvIGEgbWV0aG9kIGNhbGwuXG4vLyBOb3RlIHRoYXQgd2UgdGFrZSBlbmNsb3NpbmcgYXMgYW4gYXJndW1lbnQsXG4vLyB0aG91Z2ggd2UgZXhwZWN0IGl0IHRvIGJlIEREUC5fQ3VycmVudE1ldGhvZEludm9jYXRpb24uZ2V0KClcbi8vIEhvd2V2ZXIsIHdlIG9mdGVuIGV2YWx1YXRlIG1ha2VScGNTZWVkIGxhemlseSwgYW5kIHRodXMgdGhlIHJlbGV2YW50XG4vLyBpbnZvY2F0aW9uIG1heSBub3QgYmUgdGhlIG9uZSBjdXJyZW50bHkgaW4gc2NvcGUuXG4vLyBJZiBlbmNsb3NpbmcgaXMgbnVsbCwgd2UnbGwgdXNlIFJhbmRvbSBhbmQgdmFsdWVzIHdvbid0IGJlIHJlcGVhdGFibGUuXG5ERFBDb21tb24ubWFrZVJwY1NlZWQgPSBmdW5jdGlvbiAoZW5jbG9zaW5nLCBtZXRob2ROYW1lKSB7XG4gIHZhciBzdHJlYW0gPSBERFBDb21tb24uUmFuZG9tU3RyZWFtLmdldChlbmNsb3NpbmcsICcvcnBjLycgKyBtZXRob2ROYW1lKTtcbiAgcmV0dXJuIHN0cmVhbS5oZXhTdHJpbmcoMjApO1xufTtcbiJdfQ==
