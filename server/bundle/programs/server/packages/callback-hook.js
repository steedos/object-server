(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var options, Hook;

var require = meteorInstall({"node_modules":{"meteor":{"callback-hook":{"hook.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                 //
// packages/callback-hook/hook.js                                                                  //
//                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                   //
module.export({
  Hook: () => Hook
});
// XXX This pattern is under development. Do not add more callsites
// using this package for now. See:
// https://meteor.hackpad.com/Design-proposal-Hooks-YxvgEW06q6f
//
// Encapsulates the pattern of registering callbacks on a hook.
//
// The `each` method of the hook calls its iterator function argument
// with each registered callback.  This allows the hook to
// conditionally decide not to call the callback (if, for example, the
// observed object has been closed or terminated).
//
// By default, callbacks are bound with `Meteor.bindEnvironment`, so they will be
// called with the Meteor environment of the calling code that
// registered the callback. Override by passing { bindEnvironment: false }
// to the constructor.
//
// Registering a callback returns an object with a single `stop`
// method which unregisters the callback.
//
// The code is careful to allow a callback to be safely unregistered
// while the callbacks are being iterated over.
//
// If the hook is configured with the `exceptionHandler` option, the
// handler will be called if a called callback throws an exception.
// By default (if the exception handler doesn't itself throw an
// exception, or if the iterator function doesn't return a falsy value
// to terminate the calling of callbacks), the remaining callbacks
// will still be called.
//
// Alternatively, the `debugPrintExceptions` option can be specified
// as string describing the callback.  On an exception the string and
// the exception will be printed to the console log with
// `Meteor._debug`, and the exception otherwise ignored.
//
// If an exception handler isn't specified, exceptions thrown in the
// callback will propagate up to the iterator function, and will
// terminate calling the remaining callbacks if not caught.
const hasOwn = Object.prototype.hasOwnProperty;

class Hook {
  constructor(options) {
    options = options || {};
    this.nextCallbackId = 0;
    this.callbacks = Object.create(null); // Whether to wrap callbacks with Meteor.bindEnvironment

    this.bindEnvironment = true;

    if (options.bindEnvironment === false) {
      this.bindEnvironment = false;
    }

    if (options.exceptionHandler) {
      this.exceptionHandler = options.exceptionHandler;
    } else if (options.debugPrintExceptions) {
      if (typeof options.debugPrintExceptions !== "string") {
        throw new Error("Hook option debugPrintExceptions should be a string");
      }

      this.exceptionHandler = options.debugPrintExceptions;
    }
  }

  register(callback) {
    var exceptionHandler = this.exceptionHandler || function (exception) {
      // Note: this relies on the undocumented fact that if bindEnvironment's
      // onException throws, and you are invoking the callback either in the
      // browser or from within a Fiber in Node, the exception is propagated.
      throw exception;
    };

    if (this.bindEnvironment) {
      callback = Meteor.bindEnvironment(callback, exceptionHandler);
    } else {
      callback = dontBindEnvironment(callback, exceptionHandler);
    }

    var id = this.nextCallbackId++;
    this.callbacks[id] = callback;
    return {
      stop: () => {
        delete this.callbacks[id];
      }
    };
  } // For each registered callback, call the passed iterator function
  // with the callback.
  //
  // The iterator function can choose whether or not to call the
  // callback.  (For example, it might not call the callback if the
  // observed object has been closed or terminated).
  //
  // The iteration is stopped if the iterator function returns a falsy
  // value or throws an exception.
  //


  each(iterator) {
    // Invoking bindEnvironment'd callbacks outside of a Fiber in Node doesn't
    // run them to completion (and exceptions thrown from onException are not
    // propagated), so we need to be in a Fiber.
    Meteor._nodeCodeMustBeInFiber();

    var ids = Object.keys(this.callbacks);

    for (var i = 0; i < ids.length; ++i) {
      var id = ids[i]; // check to see if the callback was removed during iteration

      if (hasOwn.call(this.callbacks, id)) {
        var callback = this.callbacks[id];

        if (!iterator(callback)) {
          break;
        }
      }
    }
  }

}

// Copied from Meteor.bindEnvironment and removed all the env stuff.
function dontBindEnvironment(func, onException, _this) {
  if (!onException || typeof onException === 'string') {
    var description = onException || "callback of async function";

    onException = function (error) {
      Meteor._debug("Exception in " + description + ":", error && error.stack || error);
    };
  }

  return function (...args) {
    try {
      var ret = func.apply(_this, args);
    } catch (e) {
      onException(e);
    }

    return ret;
  };
}
/////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/callback-hook/hook.js");

/* Exports */
Package._define("callback-hook", exports, {
  Hook: Hook
});

})();

//# sourceURL=meteor://💻app/packages/callback-hook.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvY2FsbGJhY2staG9vay9ob29rLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydCIsIkhvb2siLCJoYXNPd24iLCJPYmplY3QiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNvbnN0cnVjdG9yIiwib3B0aW9ucyIsIm5leHRDYWxsYmFja0lkIiwiY2FsbGJhY2tzIiwiY3JlYXRlIiwiYmluZEVudmlyb25tZW50IiwiZXhjZXB0aW9uSGFuZGxlciIsImRlYnVnUHJpbnRFeGNlcHRpb25zIiwiRXJyb3IiLCJyZWdpc3RlciIsImNhbGxiYWNrIiwiZXhjZXB0aW9uIiwiTWV0ZW9yIiwiZG9udEJpbmRFbnZpcm9ubWVudCIsImlkIiwic3RvcCIsImVhY2giLCJpdGVyYXRvciIsIl9ub2RlQ29kZU11c3RCZUluRmliZXIiLCJpZHMiLCJrZXlzIiwiaSIsImxlbmd0aCIsImNhbGwiLCJmdW5jIiwib25FeGNlcHRpb24iLCJfdGhpcyIsImRlc2NyaXB0aW9uIiwiZXJyb3IiLCJfZGVidWciLCJzdGFjayIsImFyZ3MiLCJyZXQiLCJhcHBseSIsImUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsTUFBTSxDQUFDQyxNQUFQLENBQWM7QUFBQ0MsTUFBSSxFQUFDLE1BQUlBO0FBQVYsQ0FBZDtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUEsTUFBTUMsTUFBTSxHQUFHQyxNQUFNLENBQUNDLFNBQVAsQ0FBaUJDLGNBQWhDOztBQUVPLE1BQU1KLElBQU4sQ0FBVztBQUNoQkssYUFBVyxDQUFD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RSxLQUFmLElBQXdCRixLQUYxQjtBQUlELEtBTEQ7QUFNRDs7QUFFRCxTQUFPLFVBQVUsR0FBR0csSUFBYixFQUFtQjtBQUN4QixRQUFJO0FBQ0YsVUFBSUMsR0FBRyxHQUFHUixJQUFJLENBQUNTLEtBQUwsQ0FBV1AsS0FBWCxFQUFrQkssSUFBbEIsQ0FBVjtBQUNELEtBRkQsQ0FFRSxPQUFPRyxDQUFQLEVBQVU7QUFDVlQsaUJBQVcsQ0FBQ1MsQ0FBRCxDQUFYO0FBQ0Q7O0FBQ0QsV0FBT0YsR0FBUDtBQUNELEdBUEQ7QUFRRCxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9jYWxsYmFjay1ob29rLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gWFhYIFRoaXMgcGF0dGVybiBpcyB1bmRlciBkZXZlbG9wbWVudC4gRG8gbm90IGFkZCBtb3JlIGNhbGxzaXRlc1xuLy8gdXNpbmcgdGhpcyBwYWNrYWdlIGZvciBub3cuIFNlZTpcbi8vIGh0dHBzOi8vbWV0ZW9yLmhhY2twYWQuY29tL0Rlc2lnbi1wcm9wb3NhbC1Ib29rcy1ZeHZnRVcwNnE2ZlxuLy9cbi8vIEVuY2Fwc3VsYXRlcyB0aGUgcGF0dGVybiBvZiByZWdpc3RlcmluZyBjYWxsYmFja3Mgb24gYSBob29rLlxuLy9cbi8vIFRoZSBgZWFjaGAgbWV0aG9kIG9mIHRoZSBob29rIGNhbGxzIGl0cyBpdGVyYXRvciBmdW5jdGlvbiBhcmd1bWVudFxuLy8gd2l0aCBlYWNoIHJlZ2lzdGVyZWQgY2FsbGJhY2suICBUaGlzIGFsbG93cyB0aGUgaG9vayB0b1xuLy8gY29uZGl0aW9uYWxseSBkZWNpZGUgbm90IHRvIGNhbGwgdGhlIGNhbGxiYWNrIChpZiwgZm9yIGV4YW1wbGUsIHRoZVxuLy8gb2JzZXJ2ZWQgb2JqZWN0IGhhcyBiZWVuIGNsb3NlZCBvciB0ZXJtaW5hdGVkKS5cbi8vXG4vLyBCeSBkZWZhdWx0LCBjYWxsYmFja3MgYXJlIGJvdW5kIHdpdGggYE1ldGVvci5iaW5kRW52aXJvbm1lbnRgLCBzbyB0aGV5IHdpbGwgYmVcbi8vIGNhbGxlZCB3aXRoIHRoZSBNZXRlb3IgZW52aXJvbm1lbnQgb2YgdGhlIGNhbGxpbmcgY29kZSB0aGF0XG4vLyByZWdpc3RlcmVkIHRoZSBjYWxsYmFjay4gT3ZlcnJpZGUgYnkgcGFzc2luZyB7IGJpbmRFbnZpcm9ubWVudDogZmFsc2UgfVxuLy8gdG8gdGhlIGNvbnN0cnVjdG9yLlxuLy9cbi8vIFJlZ2lzdGVyaW5nIGEgY2FsbGJhY2sgcmV0dXJucyBhbiBvYmplY3Qgd2l0aCBhIHNpbmdsZSBgc3RvcGBcbi8vIG1ldGhvZCB3aGljaCB1bnJlZ2lzdGVycyB0aGUgY2FsbGJhY2suXG4vL1xuLy8gVGhlIGNvZGUgaXMgY2FyZWZ1bCB0byBhbGxvdyBhIGNhbGxiYWNrIHRvIGJlIHNhZmVseSB1bnJlZ2lzdGVyZWRcbi8vIHdoaWxlIHRoZSBjYWxsYmFja3MgYXJlIGJlaW5nIGl0ZXJhdGVkIG92ZXIuXG4vL1xuLy8gSWYgdGhlIGhvb2sgaXMgY29uZmlndXJlZCB3aXRoIHRoZSBgZXhjZXB0aW9uSGFuZGxlcmAgb3B0aW9uLCB0aGVcbi8vIGhhbmRsZXIgd2lsbCBiZSBjYWxsZWQgaWYgYSBjYWxsZWQgY2FsbGJhY2sgdGhyb3dzIGFuIGV4Y2VwdGlvbi5cbi8vIEJ5IGRlZmF1bHQgKGlmIHRoZSBleGNlcHRpb24gaGFuZGxlciBkb2Vzbid0IGl0c2VsZiB0aHJvdyBhblxuLy8gZXhjZXB0aW9uLCBvciBpZiB0aGUgaXRlcmF0b3IgZnVuY3Rpb24gZG9lc24ndCByZXR1cm4gYSBmYWxzeSB2YWx1ZVxuLy8gdG8gdGVybWluYXRlIHRoZSBjYWxsaW5nIG9mIGNhbGxiYWNrcyksIHRoZSByZW1haW5pbmcgY2FsbGJhY2tzXG4vLyB3aWxsIHN0aWxsIGJlIGNhbGxlZC5cbi8vXG4vLyBBbHRlcm5hdGl2ZWx5LCB0aGUgYGRlYnVnUHJpbnRFeGNlcHRpb25zYCBvcHRpb24gY2FuIGJlIHNwZWNpZmllZFxuLy8gYXMgc3RyaW5nIGRlc2NyaWJpbmcgdGhlIGNhbGxiYWNrLiAgT24gYW4gZXhjZXB0aW9uIHRoZSBzdHJpbmcgYW5kXG4vLyB0aGUgZXhjZXB0aW9uIHdpbGwgYmUgcHJpbnRlZCB0byB0aGUgY29uc29sZSBsb2cgd2l0aFxuLy8gYE1ldGVvci5fZGVidWdgLCBhbmQgdGhlIGV4Y2VwdGlvbiBvdGhlcndpc2UgaWdub3JlZC5cbi8vXG4vLyBJZiBhbiBleGNlcHRpb24gaGFuZGxlciBpc24ndCBzcGVjaWZpZWQsIGV4Y2VwdGlvbnMgdGhyb3duIGluIHRoZVxuLy8gY2FsbGJhY2sgd2lsbCBwcm9wYWdhdGUgdXAgdG8gdGhlIGl0ZXJhdG9yIGZ1bmN0aW9uLCBhbmQgd2lsbFxuLy8gdGVybWluYXRlIGNhbGxpbmcgdGhlIHJlbWFpbmluZyBjYWxsYmFja3MgaWYgbm90IGNhdWdodC5cblxuY29uc3QgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuZXhwb3J0IGNsYXNzIEhvb2sge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy5uZXh0Q2FsbGJhY2tJZCA9IDA7XG4gICAgdGhpcy5jYWxsYmFja3MgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIC8vIFdoZXRoZXIgdG8gd3JhcCBjYWxsYmFja3Mgd2l0aCBNZXRlb3IuYmluZEVudmlyb25tZW50XG4gICAgdGhpcy5iaW5kRW52aXJvbm1lbnQgPSB0cnVlO1xuICAgIGlmIChvcHRpb25zLmJpbmRFbnZpcm9ubWVudCA9PT0gZmFsc2UpIHtcbiAgICAgIHRoaXMuYmluZEVudmlyb25tZW50ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuZXhjZXB0aW9uSGFuZGxlcikge1xuICAgICAgdGhpcy5leGNlcHRpb25IYW5kbGVyID0gb3B0aW9ucy5leGNlcHRpb25IYW5kbGVyO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5kZWJ1Z1ByaW50RXhjZXB0aW9ucykge1xuICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmRlYnVnUHJpbnRFeGNlcHRpb25zICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkhvb2sgb3B0aW9uIGRlYnVnUHJpbnRFeGNlcHRpb25zIHNob3VsZCBiZSBhIHN0cmluZ1wiKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZXhjZXB0aW9uSGFuZGxlciA9IG9wdGlvbnMuZGVidWdQcmludEV4Y2VwdGlvbnM7XG4gICAgfVxuICB9XG5cbiAgcmVnaXN0ZXIoY2FsbGJhY2spIHtcbiAgICB2YXIgZXhjZXB0aW9uSGFuZGxlciA9IHRoaXMuZXhjZXB0aW9uSGFuZGxlciB8fCBmdW5jdGlvbiAoZXhjZXB0aW9uKSB7XG4gICAgICAvLyBOb3RlOiB0aGlzIHJlbGllcyBvbiB0aGUgdW5kb2N1bWVudGVkIGZhY3QgdGhhdCBpZiBiaW5kRW52aXJvbm1lbnQnc1xuICAgICAgLy8gb25FeGNlcHRpb24gdGhyb3dzLCBhbmQgeW91IGFyZSBpbnZva2luZyB0aGUgY2FsbGJhY2sgZWl0aGVyIGluIHRoZVxuICAgICAgLy8gYnJvd3NlciBvciBmcm9tIHdpdGhpbiBhIEZpYmVyIGluIE5vZGUsIHRoZSBleGNlcHRpb24gaXMgcHJvcGFnYXRlZC5cbiAgICAgIHRocm93IGV4Y2VwdGlvbjtcbiAgICB9O1xuXG4gICAgaWYgKHRoaXMuYmluZEVudmlyb25tZW50KSB7XG4gICAgICBjYWxsYmFjayA9IE1ldGVvci5iaW5kRW52aXJvbm1lbnQoY2FsbGJhY2ssIGV4Y2VwdGlvbkhhbmRsZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYWxsYmFjayA9IGRvbnRCaW5kRW52aXJvbm1lbnQoY2FsbGJhY2ssIGV4Y2VwdGlvbkhhbmRsZXIpO1xuICAgIH1cblxuICAgIHZhciBpZCA9IHRoaXMubmV4dENhbGxiYWNrSWQrKztcbiAgICB0aGlzLmNhbGxiYWNrc1tpZF0gPSBjYWxsYmFjaztcblxuICAgIHJldHVybiB7XG4gICAgICBzdG9wOiAoKSA9PiB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmNhbGxiYWNrc1tpZF07XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8vIEZvciBlYWNoIHJlZ2lzdGVyZWQgY2FsbGJhY2ssIGNhbGwgdGhlIHBhc3NlZCBpdGVyYXRvciBmdW5jdGlvblxuICAvLyB3aXRoIHRoZSBjYWxsYmFjay5cbiAgLy9cbiAgLy8gVGhlIGl0ZXJhdG9yIGZ1bmN0aW9uIGNhbiBjaG9vc2Ugd2hldGhlciBvciBub3QgdG8gY2FsbCB0aGVcbiAgLy8gY2FsbGJhY2suICAoRm9yIGV4YW1wbGUsIGl0IG1pZ2h0IG5vdCBjYWxsIHRoZSBjYWxsYmFjayBpZiB0aGVcbiAgLy8gb2JzZXJ2ZWQgb2JqZWN0IGhhcyBiZWVuIGNsb3NlZCBvciB0ZXJtaW5hdGVkKS5cbiAgLy9cbiAgLy8gVGhlIGl0ZXJhdGlvbiBpcyBzdG9wcGVkIGlmIHRoZSBpdGVyYXRvciBmdW5jdGlvbiByZXR1cm5zIGEgZmFsc3lcbiAgLy8gdmFsdWUgb3IgdGhyb3dzIGFuIGV4Y2VwdGlvbi5cbiAgLy9cbiAgZWFjaChpdGVyYXRvcikge1xuICAgIC8vIEludm9raW5nIGJpbmRFbnZpcm9ubWVudCdkIGNhbGxiYWNrcyBvdXRzaWRlIG9mIGEgRmliZXIgaW4gTm9kZSBkb2Vzbid0XG4gICAgLy8gcnVuIHRoZW0gdG8gY29tcGxldGlvbiAoYW5kIGV4Y2VwdGlvbnMgdGhyb3duIGZyb20gb25FeGNlcHRpb24gYXJlIG5vdFxuICAgIC8vIHByb3BhZ2F0ZWQpLCBzbyB3ZSBuZWVkIHRvIGJlIGluIGEgRmliZXIuXG4gICAgTWV0ZW9yLl9ub2RlQ29kZU11c3RCZUluRmliZXIoKTtcblxuICAgIHZhciBpZHMgPSBPYmplY3Qua2V5cyh0aGlzLmNhbGxiYWNrcyk7XG4gICAgZm9yICh2YXIgaSA9IDA7ICBpIDwgaWRzLmxlbmd0aDsgICsraSkge1xuICAgICAgdmFyIGlkID0gaWRzW2ldO1xuICAgICAgLy8gY2hlY2sgdG8gc2VlIGlmIHRoZSBjYWxsYmFjayB3YXMgcmVtb3ZlZCBkdXJpbmcgaXRlcmF0aW9uXG4gICAgICBpZiAoaGFzT3duLmNhbGwodGhpcy5jYWxsYmFja3MsIGlkKSkge1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSB0aGlzLmNhbGxiYWNrc1tpZF07XG4gICAgICAgIGlmICghIGl0ZXJhdG9yKGNhbGxiYWNrKSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vIENvcGllZCBmcm9tIE1ldGVvci5iaW5kRW52aXJvbm1lbnQgYW5kIHJlbW92ZWQgYWxsIHRoZSBlbnYgc3R1ZmYuXG5mdW5jdGlvbiBkb250QmluZEVudmlyb25tZW50KGZ1bmMsIG9uRXhjZXB0aW9uLCBfdGhpcykge1xuICBpZiAoIW9uRXhjZXB0aW9uIHx8IHR5cGVvZihvbkV4Y2VwdGlvbikgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFyIGRlc2NyaXB0aW9uID0gb25FeGNlcHRpb24gfHwgXCJjYWxsYmFjayBvZiBhc3luYyBmdW5jdGlvblwiO1xuICAgIG9uRXhjZXB0aW9uID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICBNZXRlb3IuX2RlYnVnKFxuICAgICAgICBcIkV4Y2VwdGlvbiBpbiBcIiArIGRlc2NyaXB0aW9uICsgXCI6XCIsXG4gICAgICAgIGVycm9yICYmIGVycm9yLnN0YWNrIHx8IGVycm9yXG4gICAgICApO1xuICAgIH07XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICB0cnkge1xuICAgICAgdmFyIHJldCA9IGZ1bmMuYXBwbHkoX3RoaXMsIGFyZ3MpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIG9uRXhjZXB0aW9uKGUpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9O1xufVxuIl19
