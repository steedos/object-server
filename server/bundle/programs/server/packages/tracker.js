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
var Tracker, Deps, computation;

var require = meteorInstall({"node_modules":{"meteor":{"tracker":{"tracker.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/tracker/tracker.js                                                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/////////////////////////////////////////////////////
// Package docs at http://docs.meteor.com/#tracker //
/////////////////////////////////////////////////////

/**
 * @namespace Tracker
 * @summary The namespace for Tracker-related methods.
 */
Tracker = {};
/**
 * @namespace Deps
 * @deprecated
 */

Deps = Tracker; // http://docs.meteor.com/#tracker_active

/**
 * @summary True if there is a current computation, meaning that dependencies on reactive data sources will be tracked and potentially cause the current computation to be rerun.
 * @locus Client
 * @type {Boolean}
 */

Tracker.active = false; // http://docs.meteor.com/#tracker_currentcomputation

/**
 * @summary The current computation, or `null` if there isn't one.  The current computation is the [`Tracker.Computation`](#tracker_computation) object created by the innermost active call to `Tracker.autorun`, and it's the computation that gains dependencies when reactive data sources are accessed.
 * @locus Client
 * @type {Tracker.Computation}
 */

Tracker.currentComputation = null;

function setCurrentComputation(c) {
  Tracker.currentComputation = c;
  Tracker.active = !!c;
}

function _debugFunc() {
  // We want this code to work without Meteor, and also without
  // "console" (which is technically non-standard and may be missing
  // on some browser we come across, like it was on IE 7).
  //
  // Lazy evaluation because `Meteor` does not exist right away.(??)
  return typeof Meteor !== "undefined" ? Meteor._debug : typeof console !== "undefined" && console.error ? function () {
    console.error.apply(console, arguments);
  } : function () {};
}

function _maybeSuppressMoreLogs(messagesLength) {
  // Sometimes when running tests, we intentionally suppress logs on expected
  // printed errors. Since the current implementation of _throwOrLog can log
  // multiple separate log messages, suppress all of them if at least one suppress
  // is expected as we still want them to count as one.
  if (typeof Meteor !== "undefined") {
    if (Meteor._suppressed_log_expected()) {
      Meteor._suppress_log(messagesLength - 1);
    }
  }
}

function _throwOrLog(from, e) {
  if (throwFirstError) {
    throw e;
  } else {
    var printArgs = ["Exception from Tracker " + from + " function:"];

    if (e.stack && e.message && e.name) {
      var idx = e.stack.indexOf(e.message);

      if (idx < 0 || idx > e.name.length + 2) {
        // check for "Error: "
        // message is not part of the stack
        var message = e.name + ": " + e.message;
        printArgs.push(message);
      }
    }

    printArgs.push(e.stack);

    _maybeSuppressMoreLogs(printArgs.length);

    for (var i = 0; i < printArgs.length; i++) {
      _debugFunc()(printArgs[i]);
    }
  }
} // Takes a function `f`, and wraps it in a `Meteor._noYieldsAllowed`
// block if we are running on the server. On the client, returns the
// original function (since `Meteor._noYieldsAllowed` is a
// no-op). This has the benefit of not adding an unnecessary stack
// frame on the client.


function withNoYieldsAllowed(f) {
  if (typeof Meteor === 'undefined' || Meteor.isClient) {
    return f;
  } else {
    return function () {
      var args = arguments;

      Meteor._noYieldsAllowed(function () {
        f.apply(null, args);
      });
    };
  }
}

var nextId = 1; // computations whose callbacks we should call at flush time

var pendingComputations = []; // `true` if a Tracker.flush is scheduled, or if we are in Tracker.flush now

var willFlush = false; // `true` if we are in Tracker.flush now

var inFlush = false; // `true` if we are computing a computation now, either first time
// or recompute.  This matches Tracker.active unless we are inside
// Tracker.nonreactive, which nullfies currentComputation even though
// an enclosing computation may still be running.

var inCompute = false; // `true` if the `_throwFirstError` option was passed in to the call
// to Tracker.flush that we are in. When set, throw rather than log the
// first error encountered while flushing. Before throwing the error,
// finish flushing (from a finally block), logging any subsequent
// errors.

var throwFirstError = false;
var afterFlushCallbacks = [];

function requireFlush() {
  if (!willFlush) {
    // We want this code to work without Meteor, see debugFunc above
    if (typeof Meteor !== "undefined") Meteor._setImmediate(Tracker._runFlush);else setTimeout(Tracker._runFlush, 0);
    willFlush = true;
  }
} // Tracker.Computation constructor is visible but private
// (throws an error if you try to call it)


var constructingComputation = false; //
// http://docs.meteor.com/#tracker_computation

/**
 * @summary A Computation object represents code that is repeatedly rerun
 * in response to
 * reactive data changes. Computations don't have return values; they just
 * perform actions, such as rerendering a template on the screen. Computations
 * are created using Tracker.autorun. Use stop to prevent further rerunning of a
 * computation.
 * @instancename computation
 */

Tracker.Computation = class Computation {
  constructor(f, parent, onError) {
    if (!constructingComputation) throw new Error("Tracker.Computation constructor is private; use Tracker.autorun");
    constructingComputation = false; // http://docs.meteor.com/#computation_stopped

    /**
     * @summary True if this computation has been stopped.
     * @locus Client
     * @memberOf Tracker.Computation
     * @instance
     * @name  stopped
     */

    this.stopped = false; // http://docs.meteor.com/#computation_invalidated

    /**
     * @summary True if this computation has been invalidated (and not yet rerun), or if it has been stopped.
     * @locus Client
     * @memberOf Tracker.Computation
     * @instance
     * @name  invalidated
     * @type {Boolean}
     */

    this.invalidated = false; // http://docs.meteor.com/#computation_firstrun

    /**
     * @summary True during the initial run of the computation at the time `Tracker.autorun` is called, and false on subsequent reruns and at other times.
     * @locus Client
     * @memberOf Tracker.Computation
     * @instance
     * @name  firstRun
     * @type {Boolean}
     */

    this.firstRun = true;
    this._id = nextId++;
    this._onInvalidateCallbacks = [];
    this._onStopCallbacks = []; // the plan is at some point to use the parent relation
    // to constrain the order that computations are processed

    this._parent = parent;
    this._func = f;
    this._onError = onError;
    this._recomputing = false;
    var errored = true;

    try {
      this._compute();

      errored = false;
    } finally {
      this.firstRun = false;
      if (errored) this.stop();
    }
  } // http://docs.meteor.com/#computation_oninvalidate

  /**
   * @summary Registers `callback` to run when this computation is next invalidated, or runs it immediately if the computation is already invalidated.  The callback is run exactly once and not upon future invalidations unless `onInvalidate` is called again after the computation becomes valid again.
   * @locus Client
   * @param {Function} callback Function to be called on invalidation. Receives one argument, the computation that was invalidated.
   */


  onInvalidate(f) {
    if (typeof f !== 'function') throw new Error("onInvalidate requires a function");

    if (this.invalidated) {
      Tracker.nonreactive(() => {
        withNoYieldsAllowed(f)(this);
      });
    } else {
      this._onInvalidateCallbacks.push(f);
    }
  }
  /**
   * @summary Registers `callback` to run when this computation is stopped, or runs it immediately if the computation is already stopped.  The callback is run after any `onInvalidate` callbacks.
   * @locus Client
   * @param {Function} callback Function to be called on stop. Receives one argument, the computation that was stopped.
   */


  onStop(f) {
    if (typeof f !== 'function') throw new Error("onStop requires a function");

    if (this.stopped) {
      Tracker.nonreactive(() => {
        withNoYieldsAllowed(f)(this);
      });
    } else {
      this._onStopCallbacks.push(f);
    }
  } // http://docs.meteor.com/#computation_invalidate

  /**
   * @summary Invalidates this computation so that it will be rerun.
   * @locus Client
   */


  invalidate() {
    if (!this.invalidated) {
      // if we're currently in _recompute(), don't enqueue
      // ourselves, since we'll rerun immediately anyway.
      if (!this._recomputing && !this.stopped) {
        requireFlush();
        pendingComputations.push(this);
      }

      this.invalidated = true; // callbacks can't add callbacks, because
      // this.invalidated === true.

      for (var i = 0, f; f = this._onInvalidateCallbacks[i]; i++) {
        Tracker.nonreactive(() => {
          withNoYieldsAllowed(f)(this);
        });
      }

      this._onInvalidateCallbacks = [];
    }
  } // http://docs.meteor.com/#computation_stop

  /**
   * @summary Prevents this computation from rerunning.
   * @locus Client
   */


  stop() {
    if (!this.stopped) {
      this.stopped = true;
      this.invalidate();

      for (var i = 0, f; f = this._onStopCallbacks[i]; i++) {
        Tracker.nonreactive(() => {
          withNoYieldsAllowed(f)(this);
        });
      }

      this._onStopCallbacks = [];
    }
  }

  _compute() {
    this.invalidated = false;
    var previous = Tracker.currentComputation;
    setCurrentComputation(this);
    var previousInCompute = inCompute;
    inCompute = true;

    try {
      withNoYieldsAllowed(this._func)(this);
    } finally {
      setCurrentComputation(previous);
      inCompute = previousInCompute;
    }
  }

  _needsRecompute() {
    return this.invalidated && !this.stopped;
  }

  _recompute() {
    this._recomputing = true;

    try {
      if (this._needsRecompute()) {
        try {
          this._compute();
        } catch (e) {
          if (this._onError) {
            this._onError(e);
          } else {
            _throwOrLog("recompute", e);
          }
        }
      }
    } finally {
      this._recomputing = false;
    }
  }
  /**
   * @summary Process the reactive updates for this computation immediately
   * and ensure that the computation is rerun. The computation is rerun only
   * if it is invalidated.
   * @locus Client
   */


  flush() {
    if (this._recomputing) return;

    this._recompute();
  }
  /**
   * @summary Causes the function inside this computation to run and
   * synchronously process all reactive updtes.
   * @locus Client
   */


  run() {
    this.invalidate();
    this.flush();
  }

}; //
// http://docs.meteor.com/#tracker_dependency

/**
 * @summary A Dependency represents an atomic unit of reactive data that a
 * computation might depend on. Reactive data sources such as Session or
 * Minimongo internally create different Dependency objects for different
 * pieces of data, each of which may be depended on by multiple computations.
 * When the data changes, the computations are invalidated.
 * @class
 * @instanceName dependency
 */

Tracker.Dependency = class Dependency {
  constructor() {
    this._dependentsById = Object.create(null);
  } // http://docs.meteor.com/#dependency_depend
  //
  // Adds `computation` to this set if it is not already
  // present.  Returns true if `computation` is a new member of the set.
  // If no argument, defaults to currentComputation, or does nothing
  // if there is no currentComputation.

  /**
   * @summary Declares that the current computation (or `fromComputation` if given) depends on `dependency`.  The computation will be invalidated the next time `dependency` changes.
    If there is no current computation and `depend()` is called with no arguments, it does nothing and returns false.
    Returns true if the computation is a new dependent of `dependency` rather than an existing one.
   * @locus Client
   * @param {Tracker.Computation} [fromComputation] An optional computation declared to depend on `dependency` instead of the current computation.
   * @returns {Boolean}
   */


  depend(computation) {
    if (!computation) {
      if (!Tracker.active) return false;
      computation = Tracker.currentComputation;
    }

    var id = computation._id;

    if (!(id in this._dependentsById)) {
      this._dependentsById[id] = computation;
      computation.onInvalidate(() => {
        delete this._dependentsById[id];
      });
      return true;
    }

    return false;
  } // http://docs.meteor.com/#dependency_changed

  /**
   * @summary Invalidate all dependent computations immediately and remove them as dependents.
   * @locus Client
   */


  changed() {
    for (var id in this._dependentsById) this._dependentsById[id].invalidate();
  } // http://docs.meteor.com/#dependency_hasdependents

  /**
   * @summary True if this Dependency has one or more dependent Computations, which would be invalidated if this Dependency were to change.
   * @locus Client
   * @returns {Boolean}
   */


  hasDependents() {
    for (var id in this._dependentsById) return true;

    return false;
  }

}; // http://docs.meteor.com/#tracker_flush

/**
 * @summary Process all reactive updates immediately and ensure that all invalidated computations are rerun.
 * @locus Client
 */

Tracker.flush = function (options) {
  Tracker._runFlush({
    finishSynchronously: true,
    throwFirstError: options && options._throwFirstError
  });
};
/**
 * @summary True if we are computing a computation now, either first time or recompute.  This matches Tracker.active unless we are inside Tracker.nonreactive, which nullfies currentComputation even though an enclosing computation may still be running.
 * @locus Client
 * @returns {Boolean}
 */


Tracker.inFlush = function () {
  return inFlush;
}; // Run all pending computations and afterFlush callbacks.  If we were not called
// directly via Tracker.flush, this may return before they're all done to allow
// the event loop to run a little before continuing.


Tracker._runFlush = function (options) {
  // XXX What part of the comment below is still true? (We no longer
  // have Spark)
  //
  // Nested flush could plausibly happen if, say, a flush causes
  // DOM mutation, which causes a "blur" event, which runs an
  // app event handler that calls Tracker.flush.  At the moment
  // Spark blocks event handlers during DOM mutation anyway,
  // because the LiveRange tree isn't valid.  And we don't have
  // any useful notion of a nested flush.
  //
  // https://app.asana.com/0/159908330244/385138233856
  if (Tracker.inFlush()) throw new Error("Can't call Tracker.flush while flushing");
  if (inCompute) throw new Error("Can't flush inside Tracker.autorun");
  options = options || {};
  inFlush = true;
  willFlush = true;
  throwFirstError = !!options.throwFirstError;
  var recomputedCount = 0;
  var finishedTry = false;

  try {
    while (pendingComputations.length || afterFlushCallbacks.length) {
      // recompute all pending computations
      while (pendingComputations.length) {
        var comp = pendingComputations.shift();

        comp._recompute();

        if (comp._needsRecompute()) {
          pendingComputations.unshift(comp);
        }

        if (!options.finishSynchronously && ++recomputedCount > 1000) {
          finishedTry = true;
          return;
        }
      }

      if (afterFlushCallbacks.length) {
        // call one afterFlush callback, which may
        // invalidate more computations
        var func = afterFlushCallbacks.shift();

        try {
          func();
        } catch (e) {
          _throwOrLog("afterFlush", e);
        }
      }
    }

    finishedTry = true;
  } finally {
    if (!finishedTry) {
      // we're erroring due to throwFirstError being true.
      inFlush = false; // needed before calling `Tracker.flush()` again
      // finish flushing

      Tracker._runFlush({
        finishSynchronously: options.finishSynchronously,
        throwFirstError: false
      });
    }

    willFlush = false;
    inFlush = false;

    if (pendingComputations.length || afterFlushCallbacks.length) {
      // We're yielding because we ran a bunch of computations and we aren't
      // required to finish synchronously, so we'd like to give the event loop a
      // chance. We should flush again soon.
      if (options.finishSynchronously) {
        throw new Error("still have more to do?"); // shouldn't happen
      }

      setTimeout(requireFlush, 10);
    }
  }
}; // http://docs.meteor.com/#tracker_autorun
//
// Run f(). Record its dependencies. Rerun it whenever the
// dependencies change.
//
// Returns a new Computation, which is also passed to f.
//
// Links the computation to the current computation
// so that it is stopped if the current computation is invalidated.

/**
 * @callback Tracker.ComputationFunction
 * @param {Tracker.Computation}
 */

/**
 * @summary Run a function now and rerun it later whenever its dependencies
 * change. Returns a Computation object that can be used to stop or observe the
 * rerunning.
 * @locus Client
 * @param {Tracker.ComputationFunction} runFunc The function to run. It receives
 * one argument: the Computation object that will be returned.
 * @param {Object} [options]
 * @param {Function} options.onError Optional. The function to run when an error
 * happens in the Computation. The only argument it receives is the Error
 * thrown. Defaults to the error being logged to the console.
 * @returns {Tracker.Computation}
 */


Tracker.autorun = function (f, options) {
  if (typeof f !== 'function') throw new Error('Tracker.autorun requires a function argument');
  options = options || {};
  constructingComputation = true;
  var c = new Tracker.Computation(f, Tracker.currentComputation, options.onError);
  if (Tracker.active) Tracker.onInvalidate(function () {
    c.stop();
  });
  return c;
}; // http://docs.meteor.com/#tracker_nonreactive
//
// Run `f` with no current computation, returning the return value
// of `f`.  Used to turn off reactivity for the duration of `f`,
// so that reactive data sources accessed by `f` will not result in any
// computations being invalidated.

/**
 * @summary Run a function without tracking dependencies.
 * @locus Client
 * @param {Function} func A function to call immediately.
 */


Tracker.nonreactive = function (f) {
  var previous = Tracker.currentComputation;
  setCurrentComputation(null);

  try {
    return f();
  } finally {
    setCurrentComputation(previous);
  }
}; // http://docs.meteor.com/#tracker_oninvalidate

/**
 * @summary Registers a new [`onInvalidate`](#computation_oninvalidate) callback on the current computation (which must exist), to be called immediately when the current computation is invalidated or stopped.
 * @locus Client
 * @param {Function} callback A callback function that will be invoked as `func(c)`, where `c` is the computation on which the callback is registered.
 */


Tracker.onInvalidate = function (f) {
  if (!Tracker.active) throw new Error("Tracker.onInvalidate requires a currentComputation");
  Tracker.currentComputation.onInvalidate(f);
}; // http://docs.meteor.com/#tracker_afterflush

/**
 * @summary Schedules a function to be called during the next flush, or later in the current flush if one is in progress, after all invalidated computations have been rerun.  The function will be run once and not on subsequent flushes unless `afterFlush` is called again.
 * @locus Client
 * @param {Function} callback A function to call at flush time.
 */


Tracker.afterFlush = function (f) {
  afterFlushCallbacks.push(f);
  requireFlush();
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/tracker/tracker.js");

/* Exports */
Package._define("tracker", {
  Tracker: Tracker,
  Deps: Deps
});

})();

//# sourceURL=meteor://💻app/packages/tracker.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvdHJhY2tlci90cmFja2VyLmpzIl0sIm5hbWVzIjpbIlRyYWNrZXIiLCJEZXBzIiwiYWN0aXZlIiwiY3VycmVudENvbXB1dGF0aW9uIiwic2V0Q3VycmVudENvbXB1dGF0aW9uIiwiYyIsIl9kZWJ1Z0Z1bmMiLCJNZXRlb3IiLCJfZGVidWciLCJjb25zb2xlIiwiZXJyb3IiLCJhcHBseSIsImFyZ3VtZW50cyIsIl9tYXliZVN1cHByZXNzTW9yZUxvZ3MiLCJtZXNzYWdlc0xlbmd0aCIsIl9zdXBwcmVzc2VkX2xvZ19leHBlY3RlZCIsIl9zdXBwcmVzc19sb2ciLCJfdGhyb3dPckxvZyIsImZyb20iLCJlIiwidGhyb3dGaXJzdEVycm9yIiwicHJpbnRBcmdzIiwic3RhY2siLCJtZXNzYWdlIiwibmFtZSIsImlkeCIsImluZGV4T2YiLCJsZW5ndGgiLCJwdXNoIiwiaSIsIndpdGhOb1lpZWxkc0FsbG93ZWQiLCJmIiwiaXNDbGllbnQiLCJhcmdzIiwiX25vWWllbGRzQWxsb3dlZCIsIm5leHRJZCIsInBlbmRpbmdDb21wdXRhdGlvbnMiLCJ3aWxsRmx1c2giLCJpbkZsdXNoIiwiaW5Db21wdXRlIiwiYWZ0ZXJGbHVzaENhbGxiYWNrcyIsInJlcXVpcmVGbHVzaCIsIl9zZXRJbW1lZGlhdGUiLCJfcnVuRmx1c2giLCJzZXRUaW1lb3V0IiwiY29uc3RydWN0aW5nQ29tcHV0YXRpb24iLCJDb21wdXRhdGlvbiIsImNvbnN0cnVjdG9yIiwicGFyZW50Iiwib25FcnJvciIsIkVycm9yIiwic3RvcHBlZCIsImludmFsaWRhdGVkIiwiZmlyc3RSdW4iLCJfaWQiLCJfb25JbnZhbGlkYXRlQ2FsbGJhY2tzIiwiX29uU3RvcENhbGxiYWNrcyIsIl9wYXJlbnQiLCJfZnVuYyIsIl9vbkVycm9yIiwiX3JlY29tcHV0aW5nIiwiZXJyb3JlZCIsIl9jb21wdXRlIiwic3RvcCIsIm9uSW52YWxpZGF0ZSIsIm5vbnJlYWN0aXZlIiwib25TdG9wIiwiaW52YWxpZGF0ZSIsInByZXZpb3VzIiwicHJldmlvdXNJbkNvbXB1dGUiLCJfbmVlZHNSZWNvbXB1dGUiLCJfcmVjb21wdXRlIiwiZmx1c2giLCJydW4iLCJEZXBlbmRlbmN5IiwiX2RlcGVuZGVudHNCeUlkIiwiT2JqZWN0IiwiY3JlYXRlIiwiZGVwZW5kIiwiY29tcHV0YXRpb24iLCJpZCIsImNoYW5nZWQiLCJoYXNEZXBlbmRlbnRzIiwib3B0aW9ucyIsImZpbmlzaFN5bmNocm9ub3VzbHkiLCJfdGhyb3dGaXJzdEVycm9yIiwicmVjb21wdXRlZENvdW50IiwiZmluaXNoZWRUcnkiLCJjb21wIiwic2hpZnQiLCJ1bnNoaWZ0IiwiZnVuYyIsImF1dG9ydW4iLCJhZnRlckZsdXNoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBOztBQUVBOzs7O0FBSUFBLE9BQU8sR0FBRyxFQUFWO0FBRUE7Ozs7O0FBSUFDLElBQUksR0FBR0QsT0FBUCxDLENBRUE7O0FBRUE7Ozs7OztBQUtBQSxPQUFPLENBQUNFLE1BQVIsR0FBaUIsS0FBakIsQyxDQUVBOztBQUVBOzs7Ozs7QUFLQUYsT0FBTyxDQUFDRyxrQkFBUixHQUE2QixJQUE3Qjs7QUFFQSxTQUFTQyxxQkFBVCxDQUErQkMsQ0FBL0IsRUFBa0M7QUFDaENMLFNBQU8sQ0FBQ0csa0JBQVIsR0FBNkJFLENBQTdCO0FBQ0FMLFNBQU8sQ0FBQ0UsTUFBUixHQUFpQixDQUFDLENBQUVHLENBQXBCO0FBQ0Q7O0FBRUQsU0FBU0MsVUFBVCxHQUFzQjtBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUSxPQUFPQyxNQUFQLEtBQWtCLFdBQWxCLEdBQWdDQSxNQUFNLENBQUNDLE1BQXZDLEdBQ0UsT0FBT0MsT0FBUCxLQUFtQixXQUFwQixJQUFvQ0EsT0FBTyxDQUFDQyxLQUE1QyxHQUNBLFlBQVk7QUFBRUQsV0FBTyxDQUFDQyxLQUFSLENBQWNDLEtBQWQsQ0FBb0JGLE9BQXBCLEVBQTZCRyxT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Q0QsQ0FoQkQsQyxDQWtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7Ozs7Ozs7QUFLQUwsT0FBTyxDQUFDaUUsV0FBUixHQUFzQixVQUFVbEMsQ0FBVixFQUFhO0FBQ2pDLE1BQUlxQyxRQUFRLEdBQUdwRSxPQUFPLENBQUNHLGtCQUF2QjtBQUNBQyx1QkFBcUIsQ0FBQyxJQUFELENBQXJCOztBQUNBLE1BQUk7QUFDRixXQUFPMkIsQ0FBQyxFQUFSO0FBQ0QsR0FGRCxTQUVVO0FBQ1IzQix5QkFBcUIsQ0FBQ2dFLFFBQUQsQ0FBckI7QUFDRDtBQUNGLENBUkQsQyxDQVVBOztBQUVBOzs7Ozs7O0FBS0FwRSxPQUFPLENBQUNnRSxZQUFSLEdBQXVCLFVBQVVqQyxDQUFWLEVBQWE7QUFDbEMsTUFBSSxDQUFFL0IsT0FBTyxDQUFDRSxNQUFkLEVBQ0UsTUFBTSxJQUFJZ0QsS0FBSixDQUFVLG9EQUFWLENBQU47QUFFRmxELFNBQU8sQ0FBQ0csa0JBQVIsQ0FBMkI2RCxZQUEzQixDQUF3Q2pDLENBQXhDO0FBQ0QsQ0FMRCxDLENBT0E7O0FBRUE7Ozs7Ozs7QUFLQS9CLE9BQU8sQ0FBQzZGLFVBQVIsR0FBcUIsVUFBVTlELENBQVYsRUFBYTtBQUNoQ1MscUJBQW1CLENBQUNaLElBQXBCLENBQXlCRyxDQUF6QjtBQUNBVSxjQUFZO0FBQ2IsQ0FIRCxDIiwiZmlsZSI6Ii9wYWNrYWdlcy90cmFja2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFBhY2thZ2UgZG9jcyBhdCBodHRwOi8vZG9jcy5tZXRlb3IuY29tLyN0cmFja2VyIC8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgVHJhY2tlclxuICogQHN1bW1hcnkgVGhlIG5hbWVzcGFjZSBmb3IgVHJhY2tlci1yZWxhdGVkIG1ldGhvZHMuXG4gKi9cblRyYWNrZXIgPSB7fTtcblxuLyoqXG4gKiBAbmFtZXNwYWNlIERlcHNcbiAqIEBkZXByZWNhdGVkXG4gKi9cbkRlcHMgPSBUcmFja2VyO1xuXG4vLyBodHRwOi8vZG9jcy5tZXRlb3IuY29tLyN0cmFja2VyX2FjdGl2ZVxuXG4vKipcbiAqIEBzdW1tYXJ5IFRydWUgaWYgdGhlcmUgaXMgYSBjdXJyZW50IGNvbXB1dGF0aW9uLCBtZWFuaW5nIHRoYXQgZGVwZW5kZW5jaWVzIG9uIHJlYWN0aXZlIGRhdGEgc291cmNlcyB3aWxsIGJlIHRyYWNrZWQgYW5kIHBvdGVudGlhbGx5IGNhdXNlIHRoZSBjdXJyZW50IGNvbXB1dGF0aW9uIHRvIGJlIHJlcnVuLlxuICogQGxvY3VzIENsaWVudFxuICogQHR5cGUge0Jvb2xlYW59XG4gKi9cblRyYWNrZXIuYWN0aXZlID0gZmFsc2U7XG5cbi8vIGh0dHA6Ly9kb2NzLm1ldGVvci5jb20vI3RyYWNrZXJfY3VycmVudGNvbXB1dGF0aW9uXG5cbi8qKlxuICogQHN1bW1hcnkgVGhlIGN1cnJlbnQgY29tcHV0YXRpb24sIG9yIGBudWxsYCBpZiB0aGVyZSBpc24ndCBvbmUuICBUaGUgY3VycmVudCBjb21wdXRhdGlvbiBpcyB0aGUgW2BUcmFja2VyLkNvbXB1dGF0aW9uYF0oI3RyYWNrZXJfY29tcHV0YXRpb24pIG9iamVjdCBjcmVhdGVkIGJ5IHRoZSBpbm5lcm1vc3QgYWN0aXZlIGNhbGwgdG8gYFRyYWNrZXIuYXV0b3J1bmAsIGFuZCBpdCdzIHRoZSBjb21wdXRhdGlvbiB0aGF0IGdhaW5zIGRlcGVuZGVuY2llcyB3aGVuIHJlYWN0aXZlIGRhdGEgc291cmNlcyBhcmUgYWNjZXNzZWQuXG4gKiBAbG9jdXMgQ2xpZW50XG4gKiBAdHlwZSB7VHJhY2tlci5Db21wdXRhdGlvbn1cbiAqL1xuVHJhY2tlci5jdXJyZW50Q29tcHV0YXRpb24gPSBudWxsO1xuXG5mdW5jdGlvbiBzZXRDdXJyZW50Q29tcHV0YXRpb24oYykge1xuICBUcmFja2VyLmN1cnJlbnRDb21wdXRhdGlvbiA9IGM7XG4gIFRyYWNrZXIuYWN0aXZlID0gISEgYztcbn1cblxuZnVuY3Rpb24gX2RlYnVnRnVuYygpIHtcbiAgLy8gV2Ugd2FudCB0aGlzIGNvZGUgdG8gd29yayB3aXRob3V0IE1ldGVvciwgYW5kIGFsc28gd2l0aG91dFxuICAvLyBcImNvbnNvbGVcIiAod2hpY2ggaXMgdGVjaG5pY2FsbHkgbm9uLXN0YW5kYXJkIGFuZCBtYXkgYmUgbWlzc2luZ1xuICAvLyBvbiBzb21lIGJyb3dzZXIgd2UgY29tZSBhY3Jvc3MsIGxpa2UgaXQgd2FzIG9uIElFIDcpLlxuICAvL1xuICAvLyBMYXp5IGV2YWx1YXRpb24gYmVjYXVzZSBgTWV0ZW9yYCBkb2VzIG5vdCBleGlzdCByaWdodCBhd2F5Lig/PylcbiAgcmV0dXJuICh0eXBlb2YgTWV0ZW9yICE9PSBcInVuZGVmaW5lZFwiID8gTWV0ZW9yLl9kZWJ1ZyA6XG4gICAgICAgICAgKCh0eXBlb2YgY29uc29sZSAhPT0gXCJ1bmRlZmluZWRcIikgJiYgY29uc29sZS5lcnJvciA/XG4gICAgICAgICAgIGZ1bmN0aW9uICgpIHsgY29uc29sZS5lcnJvci5hcHBseShjb25zb2xlLCBhcmd1bWVudHMpOyB9IDpcbiAgICAgICAgICAgZnVuY3Rpb24gKCkge30pKTtcbn1cblxuZnVuY3Rpb24gX21heWJlU3VwcHJlc3NNb3JlTG9ncyhtZXNzYWdlc0xlbmd0aCkge1xuICAvLyBTb21ldGltZXMgd2hlbiBydW5uaW5nIHRlc3RzLCB3ZSBpbnRlbnRpb25hbGx5IHN1cHByZXNzIGxvZ3Mgb24gZXhwZWN0ZWRcbiAgLy8gcHJpbnRlZCBlcnJvcnMuIFNpbmNlIHRoZSBjdXJyZW50IGltcGxlbWVudGF0aW9uIG9mIF90aHJvd09yTG9nIGNhbiBsb2dcbiAgLy8gbXVsdGlwbGUgc2VwYXJhdGUgbG9nIG1lc3NhZ2VzLCBzdXBwcmVzcyBhbGwgb2YgdGhlbSBpZiBhdCBsZWFzdCBvbmUgc3VwcHJlc3NcbiAgLy8gaXMgZXhwZWN0ZWQgYXMgd2Ugc3RpbGwgd2FudCB0aGVtIHRvIGNvdW50IGFzIG9uZS5cbiAgaWYgKHR5cGVvZiBNZXRlb3IgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBpZiAoTWV0ZW9yLl9zdXBwcmVzc2VkX2xvZ19leHBlY3RlZCgpKSB7XG4gICAgICBNZXRlb3IuX3N1cHByZXNzX2xvZyhtZXNzYWdlc0xlbmd0aCAtIDEpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBfdGhyb3dPckxvZyhmcm9tLCBlKSB7XG4gIGlmICh0aHJvd0ZpcnN0RXJyb3IpIHtcbiAgICB0aHJvdyBlO1xuICB9IGVsc2Uge1xuICAgIHZhciBwcmludEFyZ3MgPSBbXCJFeGNlcHRpb24gZnJvbSBUcmFja2VyIFwiICsgZnJvbSArIFwiIGZ1bmN0aW9uOlwiXTtcbiAgICBpZiAoZS5zdGFjayAmJiBlLm1lc3NhZ2UgJiYgZS5uYW1lKSB7XG4gICAgICB2YXIgaWR4ID0gZS5zdGFjay5pbmRleE9mKGUubWVzc2FnZSk7XG4gICAgICBpZiAoaWR4IDwgMCB8fCBpZHggPiBlLm5hbWUubGVuZ3RoICsgMikgeyAvLyBjaGVjayBmb3IgXCJFcnJvcjogXCJcbiAgICAgICAgLy8gbWVzc2FnZSBpcyBub3QgcGFydCBvZiB0aGUgc3RhY2tcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSBlLm5hbWUgKyBcIjogXCIgKyBlLm1lc3NhZ2U7XG4gICAgICAgIHByaW50QXJncy5wdXNoKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH1cbiAgICBwcmludEFyZ3MucHVzaChlLnN0YWNrKTtcbiAgICBfbWF5YmVTdXBwcmVzc01vcmVMb2dzKHByaW50QXJncy5sZW5ndGgpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcmludEFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIF9kZWJ1Z0Z1bmMoKShwcmludEFyZ3NbaV0pO1xuICAgIH1cbiAgfVxufVxuXG4vLyBUYWtlcyBhIGZ1bmN0aW9uIGBmYCwgYW5kIHdyYXBzIGl0IGluIGEgYE1ldGVvci5fbm9ZaWVsZHNBbGxvd2VkYFxuLy8gYmxvY2sgaWYgd2UgYXJlIHJ1bm5pbmcgb24gdGhlIHNlcnZlci4gT24gdGhlIGNsaWVudCwgcmV0dXJucyB0aGVcbi8vIG9yaWdpbmFsIGZ1bmN0aW9uIChzaW5jZSBgTWV0ZW9yLl9ub1lpZWxkc0FsbG93ZWRgIGlzIGFcbi8vIG5vLW9wKS4gVGhpcyBoYXMgdGhlIGJlbmVmaXQgb2Ygbm90IGFkZGluZyBhbiB1bm5lY2Vzc2FyeSBzdGFja1xuLy8gZnJhbWUgb24gdGhlIGNsaWVudC5cbmZ1bmN0aW9uIHdpdGhOb1lpZWxkc0FsbG93ZWQoZikge1xuICBpZiAoKHR5cGVvZiBNZXRlb3IgPT09ICd1bmRlZmluZWQnKSB8fCBNZXRlb3IuaXNDbGllbnQpIHtcbiAgICByZXR1cm4gZjtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBNZXRlb3IuX25vWWllbGRzQWxsb3dlZChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGYuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG59XG5cbnZhciBuZXh0SWQgPSAxO1xuLy8gY29tcHV0YXRpb25zIHdob3NlIGNhbGxiYWNrcyB3ZSBzaG91bGQgY2FsbCBhdCBmbHVzaCB0aW1lXG52YXIgcGVuZGluZ0NvbXB1dGF0aW9ucyA9IFtdO1xuLy8gYHRydWVgIGlmIGEgVHJhY2tlci5mbHVzaCBpcyBzY2hlZHVsZWQsIG9yIGlmIHdlIGFyZSBpbiBUcmFja2VyLmZsdXNoIG5vd1xudmFyIHdpbGxGbHVzaCA9IGZhbHNlO1xuLy8gYHRydWVgIGlmIHdlIGFyZSBpbiBUcmFja2VyLmZsdXNoIG5vd1xudmFyIGluRmx1c2ggPSBmYWxzZTtcbi8vIGB0cnVlYCBpZiB3ZSBhcmUgY29tcHV0aW5nIGEgY29tcHV0YXRpb24gbm93LCBlaXRoZXIgZmlyc3QgdGltZVxuLy8gb3IgcmVjb21wdXRlLiAgVGhpcyBtYXRjaGVzIFRyYWNrZXIuYWN0aXZlIHVubGVzcyB3ZSBhcmUgaW5zaWRlXG4vLyBUcmFja2VyLm5vbnJlYWN0aXZlLCB3aGljaCBudWxsZmllcyBjdXJyZW50Q29tcHV0YXRpb24gZXZlbiB0aG91Z2hcbi8vIGFuIGVuY2xvc2luZyBjb21wdXRhdGlvbiBtYXkgc3RpbGwgYmUgcnVubmluZy5cbnZhciBpbkNvbXB1dGUgPSBmYWxzZTtcbi8vIGB0cnVlYCBpZiB0aGUgYF90aHJvd0ZpcnN0RXJyb3JgIG9wdGlvbiB3YXMgcGFzc2VkIGluIHRvIHRoZSBjYWxsXG4vLyB0byBUcmFja2VyLmZsdXNoIHRoYXQgd2UgYXJlIGluLiBXaGVuIHNldCwgdGhyb3cgcmF0aGVyIHRoYW4gbG9nIHRoZVxuLy8gZmlyc3QgZXJyb3IgZW5jb3VudGVyZWQgd2hpbGUgZmx1c2hpbmcuIEJlZm9yZSB0aHJvd2luZyB0aGUgZXJyb3IsXG4vLyBmaW5pc2ggZmx1c2hpbmcgKGZyb20gYSBmaW5hbGx5IGJsb2NrKSwgbG9nZ2luZyBhbnkgc3Vic2VxdWVudFxuLy8gZXJyb3JzLlxudmFyIHRocm93Rmlyc3RFcnJvciA9IGZhbHNlO1xuXG52YXIgYWZ0ZXJGbHVzaENhbGxiYWNrcyA9IFtdO1xuXG5mdW5jdGlvbiByZXF1aXJlRmx1c2goKSB7XG4gIGlmICghIHdpbGxGbHVzaCkge1xuICAgIC8vIFdlIHdhbnQgdGhpcyBjb2RlIHRvIHdvcmsgd2l0aG91dCBNZXRlb3IsIHNlZSBkZWJ1Z0Z1bmMgYWJvdmVcbiAgICBpZiAodHlwZW9mIE1ldGVvciAhPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgIE1ldGVvci5fc2V0SW1tZWRpYXRlKFRyYWNrZXIuX3J1bkZsdXNoKTtcbiAgICBlbHNlXG4gICAgICBzZXRUaW1lb3V0KFRyYWNrZXIuX3J1bkZsdXNoLCAwKTtcbiAgICB3aWxsRmx1c2ggPSB0cnVlO1xuICB9XG59XG5cbi8vIFRyYWNrZXIuQ29tcHV0YXRpb24gY29uc3RydWN0b3IgaXMgdmlzaWJsZSBidXQgcHJpdmF0ZVxuLy8gKHRocm93cyBhbiBlcnJvciBpZiB5b3UgdHJ5IHRvIGNhbGwgaXQpXG52YXIgY29uc3RydWN0aW5nQ29tcHV0YXRpb24gPSBmYWxzZTtcblxuLy9cbi8vIGh0dHA6Ly9kb2NzLm1ldGVvci5jb20vI3RyYWNrZXJfY29tcHV0YXRpb25cblxuLyoqXG4gKiBAc3VtbWFyeSBBIENvbXB1dGF0aW9uIG9iamVjdCByZXByZXNlbnRzIGNvZGUgdGhhdCBpcyByZXBlYXRlZGx5IHJlcnVuXG4gKiBpbiByZXNwb25zZSB0b1xuICogcmVhY3RpdmUgZGF0YSBjaGFuZ2VzLiBDb21wdXRhdGlvbnMgZG9uJ3QgaGF2ZSByZXR1cm4gdmFsdWVzOyB0aGV5IGp1c3RcbiAqIHBlcmZvcm0gYWN0aW9ucywgc3VjaCBhcyByZXJlbmRlcmluZyBhIHRlbXBsYXRlIG9uIHRoZSBzY3JlZW4uIENvbXB1dGF0aW9uc1xuICogYXJlIGNyZWF0ZWQgdXNpbmcgVHJhY2tlci5hdXRvcnVuLiBVc2Ugc3RvcCB0byBwcmV2ZW50IGZ1cnRoZXIgcmVydW5uaW5nIG9mIGFcbiAqIGNvbXB1dGF0aW9uLlxuICogQGluc3RhbmNlbmFtZSBjb21wdXRhdGlvblxuICovXG5UcmFja2VyLkNvbXB1dGF0aW9uID0gY2xhc3MgQ29tcHV0YXRpb24ge1xuICBjb25zdHJ1Y3RvcihmLCBwYXJlbnQsIG9uRXJyb3IpIHtcbiAgICBpZiAoISBjb25zdHJ1Y3RpbmdDb21wdXRhdGlvbilcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJUcmFja2VyLkNvbXB1dGF0aW9uIGNvbnN0cnVjdG9yIGlzIHByaXZhdGU7IHVzZSBUcmFja2VyLmF1dG9ydW5cIik7XG4gICAgY29uc3RydWN0aW5nQ29tcHV0YXRpb24gPSBmYWxzZTtcblxuICAgIC8vIGh0dHA6Ly9kb2NzLm1ldGVvci5jb20vI2NvbXB1dGF0aW9uX3N0b3BwZWRcblxuICAgIC8qKlxuICAgICAqIEBzdW1tYXJ5IFRydWUgaWYgdGhpcyBjb21wdXRhdGlvbiBoYXMgYmVlbiBzdG9wcGVkLlxuICAgICAqIEBsb2N1cyBDbGllbnRcbiAgICAgKiBAbWVtYmVyT2YgVHJhY2tlci5Db21wdXRhdGlvblxuICAgICAqIEBpbnN0YW5jZVxuICAgICAqIEBuYW1lICBzdG9wcGVkXG4gICAgICovXG4gICAgdGhpcy5zdG9wcGVkID0gZmFsc2U7XG5cbiAgICAvLyBodHRwOi8vZG9jcy5tZXRlb3IuY29tLyNjb21wdXRhdGlvbl9pbnZhbGlkYXRlZFxuXG4gICAgLyoqXG4gICAgICogQHN1bW1hcnkgVHJ1ZSBpZiB0aGlzIGNvbXB1dGF0aW9uIGhhcyBiZWVuIGludmFsaWRhdGVkIChhbmQgbm90IHlldCByZXJ1biksIG9yIGlmIGl0IGhhcyBiZWVuIHN0b3BwZWQuXG4gICAgICogQGxvY3VzIENsaWVudFxuICAgICAqIEBtZW1iZXJPZiBUcmFja2VyLkNvbXB1dGF0aW9uXG4gICAgICogQGluc3RhbmNlXG4gICAgICogQG5hbWUgIGludmFsaWRhdGVkXG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgdGhpcy5pbnZhbGlkYXRlZCA9IGZhbHNlO1xuXG4gICAgLy8gaHR0cDovL2RvY3MubWV0ZW9yLmNvbS8jY29tcHV0YXRpb25fZmlyc3RydW5cblxuICAgIC8qKlxuICAgICAqIEBzdW1tYXJ5IFRydWUgZHVyaW5nIHRoZSBpbml0aWFsIHJ1biBvZiB0aGUgY29tcHV0YXRpb24gYXQgdGhlIHRpbWUgYFRyYWNrZXIuYXV0b3J1bmAgaXMgY2FsbGVkLCBhbmQgZmFsc2Ugb24gc3Vic2VxdWVudCByZXJ1bnMgYW5kIGF0IG90aGVyIHRpbWVzLlxuICAgICAqIEBsb2N1cyBDbGllbnRcbiAgICAgKiBAbWVtYmVyT2YgVHJhY2tlci5Db21wdXRhdGlvblxuICAgICAqIEBpbnN0YW5jZVxuICAgICAqIEBuYW1lICBmaXJzdFJ1blxuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqL1xuICAgIHRoaXMuZmlyc3RSdW4gPSB0cnVlO1xuXG4gICAgdGhpcy5faWQgPSBuZXh0SWQrKztcbiAgICB0aGlzLl9vbkludmFsaWRhdGVDYWxsYmFja3MgPSBbXTtcbiAgICB0aGlzLl9vblN0b3BDYWxsYmFja3MgPSBbXTtcbiAgICAvLyB0aGUgcGxhbiBpcyBhdCBzb21lIHBvaW50IHRvIHVzZSB0aGUgcGFyZW50IHJlbGF0aW9uXG4gICAgLy8gdG8gY29uc3RyYWluIHRoZSBvcmRlciB0aGF0IGNvbXB1dGF0aW9ucyBhcmUgcHJvY2Vzc2VkXG4gICAgdGhpcy5fcGFyZW50ID0gcGFyZW50O1xuICAgIHRoaXMuX2Z1bmMgPSBmO1xuICAgIHRoaXMuX29uRXJyb3IgPSBvbkVycm9yO1xuICAgIHRoaXMuX3JlY29tcHV0aW5nID0gZmFsc2U7XG5cbiAgICB2YXIgZXJyb3JlZCA9IHRydWU7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuX2NvbXB1dGUoKTtcbiAgICAgIGVycm9yZWQgPSBmYWxzZTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5maXJzdFJ1biA9IGZhbHNlO1xuICAgICAgaWYgKGVycm9yZWQpXG4gICAgICAgIHRoaXMuc3RvcCgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGh0dHA6Ly9kb2NzLm1ldGVvci5jb20vI2NvbXB1dGF0aW9uX29uaW52YWxpZGF0ZVxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBSZWdpc3RlcnMgYGNhbGxiYWNrYCB0byBydW4gd2hlbiB0aGlzIGNvbXB1dGF0aW9uIGlzIG5leHQgaW52YWxpZGF0ZWQsIG9yIHJ1bnMgaXQgaW1tZWRpYXRlbHkgaWYgdGhlIGNvbXB1dGF0aW9uIGlzIGFscmVhZHkgaW52YWxpZGF0ZWQuICBUaGUgY2FsbGJhY2sgaXMgcnVuIGV4YWN0bHkgb25jZSBhbmQgbm90IHVwb24gZnV0dXJlIGludmFsaWRhdGlvbnMgdW5sZXNzIGBvbkludmFsaWRhdGVgIGlzIGNhbGxlZCBhZ2FpbiBhZnRlciB0aGUgY29tcHV0YXRpb24gYmVjb21lcyB2YWxpZCBhZ2Fpbi5cbiAgICogQGxvY3VzIENsaWVudFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBGdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gaW52YWxpZGF0aW9uLiBSZWNlaXZlcyBvbmUgYXJndW1lbnQsIHRoZSBjb21wdXRhdGlvbiB0aGF0IHdhcyBpbnZhbGlkYXRlZC5cbiAgICovXG4gIG9uSW52YWxpZGF0ZShmKSB7XG4gICAgaWYgKHR5cGVvZiBmICE9PSAnZnVuY3Rpb24nKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwib25JbnZhbGlkYXRlIHJlcXVpcmVzIGEgZnVuY3Rpb25cIik7XG5cbiAgICBpZiAodGhpcy5pbnZhbGlkYXRlZCkge1xuICAgICAgVHJhY2tlci5ub25yZWFjdGl2ZSgoKSA9PiB7XG4gICAgICAgIHdpdGhOb1lpZWxkc0FsbG93ZWQoZikodGhpcyk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fb25JbnZhbGlkYXRlQ2FsbGJhY2tzLnB1c2goZik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFJlZ2lzdGVycyBgY2FsbGJhY2tgIHRvIHJ1biB3aGVuIHRoaXMgY29tcHV0YXRpb24gaXMgc3RvcHBlZCwgb3IgcnVucyBpdCBpbW1lZGlhdGVseSBpZiB0aGUgY29tcHV0YXRpb24gaXMgYWxyZWFkeSBzdG9wcGVkLiAgVGhlIGNhbGxiYWNrIGlzIHJ1biBhZnRlciBhbnkgYG9uSW52YWxpZGF0ZWAgY2FsbGJhY2tzLlxuICAgKiBAbG9jdXMgQ2xpZW50XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIEZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbiBzdG9wLiBSZWNlaXZlcyBvbmUgYXJndW1lbnQsIHRoZSBjb21wdXRhdGlvbiB0aGF0IHdhcyBzdG9wcGVkLlxuICAgKi9cbiAgb25TdG9wKGYpIHtcbiAgICBpZiAodHlwZW9mIGYgIT09ICdmdW5jdGlvbicpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJvblN0b3AgcmVxdWlyZXMgYSBmdW5jdGlvblwiKTtcblxuICAgIGlmICh0aGlzLnN0b3BwZWQpIHtcbiAgICAgIFRyYWNrZXIubm9ucmVhY3RpdmUoKCkgPT4ge1xuICAgICAgICB3aXRoTm9ZaWVsZHNBbGxvd2VkKGYpKHRoaXMpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX29uU3RvcENhbGxiYWNrcy5wdXNoKGYpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGh0dHA6Ly9kb2NzLm1ldGVvci5jb20vI2NvbXB1dGF0aW9uX2ludmFsaWRhdGVcblxuICAvKipcbiAgICogQHN1bW1hcnkgSW52YWxpZGF0ZXMgdGhpcyBjb21wdXRhdGlvbiBzbyB0aGF0IGl0IHdpbGwgYmUgcmVydW4uXG4gICAqIEBsb2N1cyBDbGllbnRcbiAgICovXG4gIGludmFsaWRhdGUoKSB7XG4gICAgaWYgKCEgdGhpcy5pbnZhbGlkYXRlZCkge1xuICAgICAgLy8gaWYgd2UncmUgY3VycmVudGx5IGluIF9yZWNvbXB1dGUoKSwgZG9uJ3QgZW5xdWV1ZVxuICAgICAgLy8gb3Vyc2VsdmVzLCBzaW5jZSB3ZSdsbCByZXJ1biBpbW1lZGlhdGVseSBhbnl3YXkuXG4gICAgICBpZiAoISB0aGlzLl9yZWNvbXB1dGluZyAmJiAhIHRoaXMuc3RvcHBlZCkge1xuICAgICAgICByZXF1aXJlRmx1c2goKTtcbiAgICAgICAgcGVuZGluZ0NvbXB1dGF0aW9ucy5wdXNoKHRoaXMpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmludmFsaWRhdGVkID0gdHJ1ZTtcblxuICAgICAgLy8gY2FsbGJhY2tzIGNhbid0IGFkZCBjYWxsYmFja3MsIGJlY2F1c2VcbiAgICAgIC8vIHRoaXMuaW52YWxpZGF0ZWQgPT09IHRydWUuXG4gICAgICBmb3IodmFyIGkgPSAwLCBmOyBmID0gdGhpcy5fb25JbnZhbGlkYXRlQ2FsbGJhY2tzW2ldOyBpKyspIHtcbiAgICAgICAgVHJhY2tlci5ub25yZWFjdGl2ZSgoKSA9PiB7XG4gICAgICAgICAgd2l0aE5vWWllbGRzQWxsb3dlZChmKSh0aGlzKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICB0aGlzLl9vbkludmFsaWRhdGVDYWxsYmFja3MgPSBbXTtcbiAgICB9XG4gIH1cblxuICAvLyBodHRwOi8vZG9jcy5tZXRlb3IuY29tLyNjb21wdXRhdGlvbl9zdG9wXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFByZXZlbnRzIHRoaXMgY29tcHV0YXRpb24gZnJvbSByZXJ1bm5pbmcuXG4gICAqIEBsb2N1cyBDbGllbnRcbiAgICovXG4gIHN0b3AoKSB7XG4gICAgaWYgKCEgdGhpcy5zdG9wcGVkKSB7XG4gICAgICB0aGlzLnN0b3BwZWQgPSB0cnVlO1xuICAgICAgdGhpcy5pbnZhbGlkYXRlKCk7XG4gICAgICBmb3IodmFyIGkgPSAwLCBmOyBmID0gdGhpcy5fb25TdG9wQ2FsbGJhY2tzW2ldOyBpKyspIHtcbiAgICAgICAgVHJhY2tlci5ub25yZWFjdGl2ZSgoKSA9PiB7XG4gICAgICAgICAgd2l0aE5vWWllbGRzQWxsb3dlZChmKSh0aGlzKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICB0aGlzLl9vblN0b3BDYWxsYmFja3MgPSBbXTtcbiAgICB9XG4gIH1cblxuICBfY29tcHV0ZSgpIHtcbiAgICB0aGlzLmludmFsaWRhdGVkID0gZmFsc2U7XG5cbiAgICB2YXIgcHJldmlvdXMgPSBUcmFja2VyLmN1cnJlbnRDb21wdXRhdGlvbjtcbiAgICBzZXRDdXJyZW50Q29tcHV0YXRpb24odGhpcyk7XG4gICAgdmFyIHByZXZpb3VzSW5Db21wdXRlID0gaW5Db21wdXRlO1xuICAgIGluQ29tcHV0ZSA9IHRydWU7XG4gICAgdHJ5IHtcbiAgICAgIHdpdGhOb1lpZWxkc0FsbG93ZWQodGhpcy5fZnVuYykodGhpcyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldEN1cnJlbnRDb21wdXRhdGlvbihwcmV2aW91cyk7XG4gICAgICBpbkNvbXB1dGUgPSBwcmV2aW91c0luQ29tcHV0ZTtcbiAgICB9XG4gIH1cblxuICBfbmVlZHNSZWNvbXB1dGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52YWxpZGF0ZWQgJiYgISB0aGlzLnN0b3BwZWQ7XG4gIH1cblxuICBfcmVjb21wdXRlKCkge1xuICAgIHRoaXMuX3JlY29tcHV0aW5nID0gdHJ1ZTtcbiAgICB0cnkge1xuICAgICAgaWYgKHRoaXMuX25lZWRzUmVjb21wdXRlKCkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB0aGlzLl9jb21wdXRlKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBpZiAodGhpcy5fb25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5fb25FcnJvcihlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX3Rocm93T3JMb2coXCJyZWNvbXB1dGVcIiwgZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuX3JlY29tcHV0aW5nID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFByb2Nlc3MgdGhlIHJlYWN0aXZlIHVwZGF0ZXMgZm9yIHRoaXMgY29tcHV0YXRpb24gaW1tZWRpYXRlbHlcbiAgICogYW5kIGVuc3VyZSB0aGF0IHRoZSBjb21wdXRhdGlvbiBpcyByZXJ1bi4gVGhlIGNvbXB1dGF0aW9uIGlzIHJlcnVuIG9ubHlcbiAgICogaWYgaXQgaXMgaW52YWxpZGF0ZWQuXG4gICAqIEBsb2N1cyBDbGllbnRcbiAgICovXG4gIGZsdXNoKCkge1xuICAgIGlmICh0aGlzLl9yZWNvbXB1dGluZylcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXMuX3JlY29tcHV0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IENhdXNlcyB0aGUgZnVuY3Rpb24gaW5zaWRlIHRoaXMgY29tcHV0YXRpb24gdG8gcnVuIGFuZFxuICAgKiBzeW5jaHJvbm91c2x5IHByb2Nlc3MgYWxsIHJlYWN0aXZlIHVwZHRlcy5cbiAgICogQGxvY3VzIENsaWVudFxuICAgKi9cbiAgcnVuKCkge1xuICAgIHRoaXMuaW52YWxpZGF0ZSgpO1xuICAgIHRoaXMuZmx1c2goKTtcbiAgfVxufTtcblxuLy9cbi8vIGh0dHA6Ly9kb2NzLm1ldGVvci5jb20vI3RyYWNrZXJfZGVwZW5kZW5jeVxuXG4vKipcbiAqIEBzdW1tYXJ5IEEgRGVwZW5kZW5jeSByZXByZXNlbnRzIGFuIGF0b21pYyB1bml0IG9mIHJlYWN0aXZlIGRhdGEgdGhhdCBhXG4gKiBjb21wdXRhdGlvbiBtaWdodCBkZXBlbmQgb24uIFJlYWN0aXZlIGRhdGEgc291cmNlcyBzdWNoIGFzIFNlc3Npb24gb3JcbiAqIE1pbmltb25nbyBpbnRlcm5hbGx5IGNyZWF0ZSBkaWZmZXJlbnQgRGVwZW5kZW5jeSBvYmplY3RzIGZvciBkaWZmZXJlbnRcbiAqIHBpZWNlcyBvZiBkYXRhLCBlYWNoIG9mIHdoaWNoIG1heSBiZSBkZXBlbmRlZCBvbiBieSBtdWx0aXBsZSBjb21wdXRhdGlvbnMuXG4gKiBXaGVuIHRoZSBkYXRhIGNoYW5nZXMsIHRoZSBjb21wdXRhdGlvbnMgYXJlIGludmFsaWRhdGVkLlxuICogQGNsYXNzXG4gKiBAaW5zdGFuY2VOYW1lIGRlcGVuZGVuY3lcbiAqL1xuVHJhY2tlci5EZXBlbmRlbmN5ID0gY2xhc3MgRGVwZW5kZW5jeSB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX2RlcGVuZGVudHNCeUlkID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgfVxuXG4gIC8vIGh0dHA6Ly9kb2NzLm1ldGVvci5jb20vI2RlcGVuZGVuY3lfZGVwZW5kXG4gIC8vXG4gIC8vIEFkZHMgYGNvbXB1dGF0aW9uYCB0byB0aGlzIHNldCBpZiBpdCBpcyBub3QgYWxyZWFkeVxuICAvLyBwcmVzZW50LiAgUmV0dXJucyB0cnVlIGlmIGBjb21wdXRhdGlvbmAgaXMgYSBuZXcgbWVtYmVyIG9mIHRoZSBzZXQuXG4gIC8vIElmIG5vIGFyZ3VtZW50LCBkZWZhdWx0cyB0byBjdXJyZW50Q29tcHV0YXRpb24sIG9yIGRvZXMgbm90aGluZ1xuICAvLyBpZiB0aGVyZSBpcyBubyBjdXJyZW50Q29tcHV0YXRpb24uXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IERlY2xhcmVzIHRoYXQgdGhlIGN1cnJlbnQgY29tcHV0YXRpb24gKG9yIGBmcm9tQ29tcHV0YXRpb25gIGlmIGdpdmVuKSBkZXBlbmRzIG9uIGBkZXBlbmRlbmN5YC4gIFRoZSBjb21wdXRhdGlvbiB3aWxsIGJlIGludmFsaWRhdGVkIHRoZSBuZXh0IHRpbWUgYGRlcGVuZGVuY3lgIGNoYW5nZXMuXG5cbiAgIElmIHRoZXJlIGlzIG5vIGN1cnJlbnQgY29tcHV0YXRpb24gYW5kIGBkZXBlbmQoKWAgaXMgY2FsbGVkIHdpdGggbm8gYXJndW1lbnRzLCBpdCBkb2VzIG5vdGhpbmcgYW5kIHJldHVybnMgZmFsc2UuXG5cbiAgIFJldHVybnMgdHJ1ZSBpZiB0aGUgY29tcHV0YXRpb24gaXMgYSBuZXcgZGVwZW5kZW50IG9mIGBkZXBlbmRlbmN5YCByYXRoZXIgdGhhbiBhbiBleGlzdGluZyBvbmUuXG4gICAqIEBsb2N1cyBDbGllbnRcbiAgICogQHBhcmFtIHtUcmFja2VyLkNvbXB1dGF0aW9ufSBbZnJvbUNvbXB1dGF0aW9uXSBBbiBvcHRpb25hbCBjb21wdXRhdGlvbiBkZWNsYXJlZCB0byBkZXBlbmQgb24gYGRlcGVuZGVuY3lgIGluc3RlYWQgb2YgdGhlIGN1cnJlbnQgY29tcHV0YXRpb24uXG4gICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgKi9cbiAgZGVwZW5kKGNvbXB1dGF0aW9uKSB7XG4gICAgaWYgKCEgY29tcHV0YXRpb24pIHtcbiAgICAgIGlmICghIFRyYWNrZXIuYWN0aXZlKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgIGNvbXB1dGF0aW9uID0gVHJhY2tlci5jdXJyZW50Q29tcHV0YXRpb247XG4gICAgfVxuICAgIHZhciBpZCA9IGNvbXB1dGF0aW9uLl9pZDtcbiAgICBpZiAoISAoaWQgaW4gdGhpcy5fZGVwZW5kZW50c0J5SWQpKSB7XG4gICAgICB0aGlzLl9kZXBlbmRlbnRzQnlJZFtpZF0gPSBjb21wdXRhdGlvbjtcbiAgICAgIGNvbXB1dGF0aW9uLm9uSW52YWxpZGF0ZSgoKSA9PiB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9kZXBlbmRlbnRzQnlJZFtpZF07XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBodHRwOi8vZG9jcy5tZXRlb3IuY29tLyNkZXBlbmRlbmN5X2NoYW5nZWRcblxuICAvKipcbiAgICogQHN1bW1hcnkgSW52YWxpZGF0ZSBhbGwgZGVwZW5kZW50IGNvbXB1dGF0aW9ucyBpbW1lZGlhdGVseSBhbmQgcmVtb3ZlIHRoZW0gYXMgZGVwZW5kZW50cy5cbiAgICogQGxvY3VzIENsaWVudFxuICAgKi9cbiAgY2hhbmdlZCgpIHtcbiAgICBmb3IgKHZhciBpZCBpbiB0aGlzLl9kZXBlbmRlbnRzQnlJZClcbiAgICAgIHRoaXMuX2RlcGVuZGVudHNCeUlkW2lkXS5pbnZhbGlkYXRlKCk7XG4gIH1cblxuICAvLyBodHRwOi8vZG9jcy5tZXRlb3IuY29tLyNkZXBlbmRlbmN5X2hhc2RlcGVuZGVudHNcblxuICAvKipcbiAgICogQHN1bW1hcnkgVHJ1ZSBpZiB0aGlzIERlcGVuZGVuY3kgaGFzIG9uZSBvciBtb3JlIGRlcGVuZGVudCBDb21wdXRhdGlvbnMsIHdoaWNoIHdvdWxkIGJlIGludmFsaWRhdGVkIGlmIHRoaXMgRGVwZW5kZW5jeSB3ZXJlIHRvIGNoYW5nZS5cbiAgICogQGxvY3VzIENsaWVudFxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICovXG4gIGhhc0RlcGVuZGVudHMoKSB7XG4gICAgZm9yICh2YXIgaWQgaW4gdGhpcy5fZGVwZW5kZW50c0J5SWQpXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn07XG5cbi8vIGh0dHA6Ly9kb2NzLm1ldGVvci5jb20vI3RyYWNrZXJfZmx1c2hcblxuLyoqXG4gKiBAc3VtbWFyeSBQcm9jZXNzIGFsbCByZWFjdGl2ZSB1cGRhdGVzIGltbWVkaWF0ZWx5IGFuZCBlbnN1cmUgdGhhdCBhbGwgaW52YWxpZGF0ZWQgY29tcHV0YXRpb25zIGFyZSByZXJ1bi5cbiAqIEBsb2N1cyBDbGllbnRcbiAqL1xuVHJhY2tlci5mbHVzaCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIFRyYWNrZXIuX3J1bkZsdXNoKHsgZmluaXNoU3luY2hyb25vdXNseTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICB0aHJvd0ZpcnN0RXJyb3I6IG9wdGlvbnMgJiYgb3B0aW9ucy5fdGhyb3dGaXJzdEVycm9yIH0pO1xufTtcblxuLyoqXG4gKiBAc3VtbWFyeSBUcnVlIGlmIHdlIGFyZSBjb21wdXRpbmcgYSBjb21wdXRhdGlvbiBub3csIGVpdGhlciBmaXJzdCB0aW1lIG9yIHJlY29tcHV0ZS4gIFRoaXMgbWF0Y2hlcyBUcmFja2VyLmFjdGl2ZSB1bmxlc3Mgd2UgYXJlIGluc2lkZSBUcmFja2VyLm5vbnJlYWN0aXZlLCB3aGljaCBudWxsZmllcyBjdXJyZW50Q29tcHV0YXRpb24gZXZlbiB0aG91Z2ggYW4gZW5jbG9zaW5nIGNvbXB1dGF0aW9uIG1heSBzdGlsbCBiZSBydW5uaW5nLlxuICogQGxvY3VzIENsaWVudFxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cblRyYWNrZXIuaW5GbHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGluRmx1c2g7XG59XG5cbi8vIFJ1biBhbGwgcGVuZGluZyBjb21wdXRhdGlvbnMgYW5kIGFmdGVyRmx1c2ggY2FsbGJhY2tzLiAgSWYgd2Ugd2VyZSBub3QgY2FsbGVkXG4vLyBkaXJlY3RseSB2aWEgVHJhY2tlci5mbHVzaCwgdGhpcyBtYXkgcmV0dXJuIGJlZm9yZSB0aGV5J3JlIGFsbCBkb25lIHRvIGFsbG93XG4vLyB0aGUgZXZlbnQgbG9vcCB0byBydW4gYSBsaXR0bGUgYmVmb3JlIGNvbnRpbnVpbmcuXG5UcmFja2VyLl9ydW5GbHVzaCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIC8vIFhYWCBXaGF0IHBhcnQgb2YgdGhlIGNvbW1lbnQgYmVsb3cgaXMgc3RpbGwgdHJ1ZT8gKFdlIG5vIGxvbmdlclxuICAvLyBoYXZlIFNwYXJrKVxuICAvL1xuICAvLyBOZXN0ZWQgZmx1c2ggY291bGQgcGxhdXNpYmx5IGhhcHBlbiBpZiwgc2F5LCBhIGZsdXNoIGNhdXNlc1xuICAvLyBET00gbXV0YXRpb24sIHdoaWNoIGNhdXNlcyBhIFwiYmx1clwiIGV2ZW50LCB3aGljaCBydW5zIGFuXG4gIC8vIGFwcCBldmVudCBoYW5kbGVyIHRoYXQgY2FsbHMgVHJhY2tlci5mbHVzaC4gIEF0IHRoZSBtb21lbnRcbiAgLy8gU3BhcmsgYmxvY2tzIGV2ZW50IGhhbmRsZXJzIGR1cmluZyBET00gbXV0YXRpb24gYW55d2F5LFxuICAvLyBiZWNhdXNlIHRoZSBMaXZlUmFuZ2UgdHJlZSBpc24ndCB2YWxpZC4gIEFuZCB3ZSBkb24ndCBoYXZlXG4gIC8vIGFueSB1c2VmdWwgbm90aW9uIG9mIGEgbmVzdGVkIGZsdXNoLlxuICAvL1xuICAvLyBodHRwczovL2FwcC5hc2FuYS5jb20vMC8xNTk5MDgzMzAyNDQvMzg1MTM4MjMzODU2XG4gIGlmIChUcmFja2VyLmluRmx1c2goKSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBjYWxsIFRyYWNrZXIuZmx1c2ggd2hpbGUgZmx1c2hpbmdcIik7XG5cbiAgaWYgKGluQ29tcHV0ZSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBmbHVzaCBpbnNpZGUgVHJhY2tlci5hdXRvcnVuXCIpO1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIGluRmx1c2ggPSB0cnVlO1xuICB3aWxsRmx1c2ggPSB0cnVlO1xuICB0aHJvd0ZpcnN0RXJyb3IgPSAhISBvcHRpb25zLnRocm93Rmlyc3RFcnJvcjtcblxuICB2YXIgcmVjb21wdXRlZENvdW50ID0gMDtcbiAgdmFyIGZpbmlzaGVkVHJ5ID0gZmFsc2U7XG4gIHRyeSB7XG4gICAgd2hpbGUgKHBlbmRpbmdDb21wdXRhdGlvbnMubGVuZ3RoIHx8XG4gICAgICAgICAgIGFmdGVyRmx1c2hDYWxsYmFja3MubGVuZ3RoKSB7XG5cbiAgICAgIC8vIHJlY29tcHV0ZSBhbGwgcGVuZGluZyBjb21wdXRhdGlvbnNcbiAgICAgIHdoaWxlIChwZW5kaW5nQ29tcHV0YXRpb25zLmxlbmd0aCkge1xuICAgICAgICB2YXIgY29tcCA9IHBlbmRpbmdDb21wdXRhdGlvbnMuc2hpZnQoKTtcbiAgICAgICAgY29tcC5fcmVjb21wdXRlKCk7XG4gICAgICAgIGlmIChjb21wLl9uZWVkc1JlY29tcHV0ZSgpKSB7XG4gICAgICAgICAgcGVuZGluZ0NvbXB1dGF0aW9ucy51bnNoaWZ0KGNvbXApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCEgb3B0aW9ucy5maW5pc2hTeW5jaHJvbm91c2x5ICYmICsrcmVjb21wdXRlZENvdW50ID4gMTAwMCkge1xuICAgICAgICAgIGZpbmlzaGVkVHJ5ID0gdHJ1ZTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGFmdGVyRmx1c2hDYWxsYmFja3MubGVuZ3RoKSB7XG4gICAgICAgIC8vIGNhbGwgb25lIGFmdGVyRmx1c2ggY2FsbGJhY2ssIHdoaWNoIG1heVxuICAgICAgICAvLyBpbnZhbGlkYXRlIG1vcmUgY29tcHV0YXRpb25zXG4gICAgICAgIHZhciBmdW5jID0gYWZ0ZXJGbHVzaENhbGxiYWNrcy5zaGlmdCgpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGZ1bmMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIF90aHJvd09yTG9nKFwiYWZ0ZXJGbHVzaFwiLCBlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBmaW5pc2hlZFRyeSA9IHRydWU7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKCEgZmluaXNoZWRUcnkpIHtcbiAgICAgIC8vIHdlJ3JlIGVycm9yaW5nIGR1ZSB0byB0aHJvd0ZpcnN0RXJyb3IgYmVpbmcgdHJ1ZS5cbiAgICAgIGluRmx1c2ggPSBmYWxzZTsgLy8gbmVlZGVkIGJlZm9yZSBjYWxsaW5nIGBUcmFja2VyLmZsdXNoKClgIGFnYWluXG4gICAgICAvLyBmaW5pc2ggZmx1c2hpbmdcbiAgICAgIFRyYWNrZXIuX3J1bkZsdXNoKHtcbiAgICAgICAgZmluaXNoU3luY2hyb25vdXNseTogb3B0aW9ucy5maW5pc2hTeW5jaHJvbm91c2x5LFxuICAgICAgICB0aHJvd0ZpcnN0RXJyb3I6IGZhbHNlXG4gICAgICB9KTtcbiAgICB9XG4gICAgd2lsbEZsdXNoID0gZmFsc2U7XG4gICAgaW5GbHVzaCA9IGZhbHNlO1xuICAgIGlmIChwZW5kaW5nQ29tcHV0YXRpb25zLmxlbmd0aCB8fCBhZnRlckZsdXNoQ2FsbGJhY2tzLmxlbmd0aCkge1xuICAgICAgLy8gV2UncmUgeWllbGRpbmcgYmVjYXVzZSB3ZSByYW4gYSBidW5jaCBvZiBjb21wdXRhdGlvbnMgYW5kIHdlIGFyZW4ndFxuICAgICAgLy8gcmVxdWlyZWQgdG8gZmluaXNoIHN5bmNocm9ub3VzbHksIHNvIHdlJ2QgbGlrZSB0byBnaXZlIHRoZSBldmVudCBsb29wIGFcbiAgICAgIC8vIGNoYW5jZS4gV2Ugc2hvdWxkIGZsdXNoIGFnYWluIHNvb24uXG4gICAgICBpZiAob3B0aW9ucy5maW5pc2hTeW5jaHJvbm91c2x5KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInN0aWxsIGhhdmUgbW9yZSB0byBkbz9cIik7ICAvLyBzaG91bGRuJ3QgaGFwcGVuXG4gICAgICB9XG4gICAgICBzZXRUaW1lb3V0KHJlcXVpcmVGbHVzaCwgMTApO1xuICAgIH1cbiAgfVxufTtcblxuLy8gaHR0cDovL2RvY3MubWV0ZW9yLmNvbS8jdHJhY2tlcl9hdXRvcnVuXG4vL1xuLy8gUnVuIGYoKS4gUmVjb3JkIGl0cyBkZXBlbmRlbmNpZXMuIFJlcnVuIGl0IHdoZW5ldmVyIHRoZVxuLy8gZGVwZW5kZW5jaWVzIGNoYW5nZS5cbi8vXG4vLyBSZXR1cm5zIGEgbmV3IENvbXB1dGF0aW9uLCB3aGljaCBpcyBhbHNvIHBhc3NlZCB0byBmLlxuLy9cbi8vIExpbmtzIHRoZSBjb21wdXRhdGlvbiB0byB0aGUgY3VycmVudCBjb21wdXRhdGlvblxuLy8gc28gdGhhdCBpdCBpcyBzdG9wcGVkIGlmIHRoZSBjdXJyZW50IGNvbXB1dGF0aW9uIGlzIGludmFsaWRhdGVkLlxuXG4vKipcbiAqIEBjYWxsYmFjayBUcmFja2VyLkNvbXB1dGF0aW9uRnVuY3Rpb25cbiAqIEBwYXJhbSB7VHJhY2tlci5Db21wdXRhdGlvbn1cbiAqL1xuLyoqXG4gKiBAc3VtbWFyeSBSdW4gYSBmdW5jdGlvbiBub3cgYW5kIHJlcnVuIGl0IGxhdGVyIHdoZW5ldmVyIGl0cyBkZXBlbmRlbmNpZXNcbiAqIGNoYW5nZS4gUmV0dXJucyBhIENvbXB1dGF0aW9uIG9iamVjdCB0aGF0IGNhbiBiZSB1c2VkIHRvIHN0b3Agb3Igb2JzZXJ2ZSB0aGVcbiAqIHJlcnVubmluZy5cbiAqIEBsb2N1cyBDbGllbnRcbiAqIEBwYXJhbSB7VHJhY2tlci5Db21wdXRhdGlvbkZ1bmN0aW9ufSBydW5GdW5jIFRoZSBmdW5jdGlvbiB0byBydW4uIEl0IHJlY2VpdmVzXG4gKiBvbmUgYXJndW1lbnQ6IHRoZSBDb21wdXRhdGlvbiBvYmplY3QgdGhhdCB3aWxsIGJlIHJldHVybmVkLlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtGdW5jdGlvbn0gb3B0aW9ucy5vbkVycm9yIE9wdGlvbmFsLiBUaGUgZnVuY3Rpb24gdG8gcnVuIHdoZW4gYW4gZXJyb3JcbiAqIGhhcHBlbnMgaW4gdGhlIENvbXB1dGF0aW9uLiBUaGUgb25seSBhcmd1bWVudCBpdCByZWNlaXZlcyBpcyB0aGUgRXJyb3JcbiAqIHRocm93bi4gRGVmYXVsdHMgdG8gdGhlIGVycm9yIGJlaW5nIGxvZ2dlZCB0byB0aGUgY29uc29sZS5cbiAqIEByZXR1cm5zIHtUcmFja2VyLkNvbXB1dGF0aW9ufVxuICovXG5UcmFja2VyLmF1dG9ydW4gPSBmdW5jdGlvbiAoZiwgb3B0aW9ucykge1xuICBpZiAodHlwZW9mIGYgIT09ICdmdW5jdGlvbicpXG4gICAgdGhyb3cgbmV3IEVycm9yKCdUcmFja2VyLmF1dG9ydW4gcmVxdWlyZXMgYSBmdW5jdGlvbiBhcmd1bWVudCcpO1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIGNvbnN0cnVjdGluZ0NvbXB1dGF0aW9uID0gdHJ1ZTtcbiAgdmFyIGMgPSBuZXcgVHJhY2tlci5Db21wdXRhdGlvbihcbiAgICBmLCBUcmFja2VyLmN1cnJlbnRDb21wdXRhdGlvbiwgb3B0aW9ucy5vbkVycm9yKTtcblxuICBpZiAoVHJhY2tlci5hY3RpdmUpXG4gICAgVHJhY2tlci5vbkludmFsaWRhdGUoZnVuY3Rpb24gKCkge1xuICAgICAgYy5zdG9wKCk7XG4gICAgfSk7XG5cbiAgcmV0dXJuIGM7XG59O1xuXG4vLyBodHRwOi8vZG9jcy5tZXRlb3IuY29tLyN0cmFja2VyX25vbnJlYWN0aXZlXG4vL1xuLy8gUnVuIGBmYCB3aXRoIG5vIGN1cnJlbnQgY29tcHV0YXRpb24sIHJldHVybmluZyB0aGUgcmV0dXJuIHZhbHVlXG4vLyBvZiBgZmAuICBVc2VkIHRvIHR1cm4gb2ZmIHJlYWN0aXZpdHkgZm9yIHRoZSBkdXJhdGlvbiBvZiBgZmAsXG4vLyBzbyB0aGF0IHJlYWN0aXZlIGRhdGEgc291cmNlcyBhY2Nlc3NlZCBieSBgZmAgd2lsbCBub3QgcmVzdWx0IGluIGFueVxuLy8gY29tcHV0YXRpb25zIGJlaW5nIGludmFsaWRhdGVkLlxuXG4vKipcbiAqIEBzdW1tYXJ5IFJ1biBhIGZ1bmN0aW9uIHdpdGhvdXQgdHJhY2tpbmcgZGVwZW5kZW5jaWVzLlxuICogQGxvY3VzIENsaWVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBBIGZ1bmN0aW9uIHRvIGNhbGwgaW1tZWRpYXRlbHkuXG4gKi9cblRyYWNrZXIubm9ucmVhY3RpdmUgPSBmdW5jdGlvbiAoZikge1xuICB2YXIgcHJldmlvdXMgPSBUcmFja2VyLmN1cnJlbnRDb21wdXRhdGlvbjtcbiAgc2V0Q3VycmVudENvbXB1dGF0aW9uKG51bGwpO1xuICB0cnkge1xuICAgIHJldHVybiBmKCk7XG4gIH0gZmluYWxseSB7XG4gICAgc2V0Q3VycmVudENvbXB1dGF0aW9uKHByZXZpb3VzKTtcbiAgfVxufTtcblxuLy8gaHR0cDovL2RvY3MubWV0ZW9yLmNvbS8jdHJhY2tlcl9vbmludmFsaWRhdGVcblxuLyoqXG4gKiBAc3VtbWFyeSBSZWdpc3RlcnMgYSBuZXcgW2BvbkludmFsaWRhdGVgXSgjY29tcHV0YXRpb25fb25pbnZhbGlkYXRlKSBjYWxsYmFjayBvbiB0aGUgY3VycmVudCBjb21wdXRhdGlvbiAod2hpY2ggbXVzdCBleGlzdCksIHRvIGJlIGNhbGxlZCBpbW1lZGlhdGVseSB3aGVuIHRoZSBjdXJyZW50IGNvbXB1dGF0aW9uIGlzIGludmFsaWRhdGVkIG9yIHN0b3BwZWQuXG4gKiBAbG9jdXMgQ2xpZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBpbnZva2VkIGFzIGBmdW5jKGMpYCwgd2hlcmUgYGNgIGlzIHRoZSBjb21wdXRhdGlvbiBvbiB3aGljaCB0aGUgY2FsbGJhY2sgaXMgcmVnaXN0ZXJlZC5cbiAqL1xuVHJhY2tlci5vbkludmFsaWRhdGUgPSBmdW5jdGlvbiAoZikge1xuICBpZiAoISBUcmFja2VyLmFjdGl2ZSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJUcmFja2VyLm9uSW52YWxpZGF0ZSByZXF1aXJlcyBhIGN1cnJlbnRDb21wdXRhdGlvblwiKTtcblxuICBUcmFja2VyLmN1cnJlbnRDb21wdXRhdGlvbi5vbkludmFsaWRhdGUoZik7XG59O1xuXG4vLyBodHRwOi8vZG9jcy5tZXRlb3IuY29tLyN0cmFja2VyX2FmdGVyZmx1c2hcblxuLyoqXG4gKiBAc3VtbWFyeSBTY2hlZHVsZXMgYSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgZHVyaW5nIHRoZSBuZXh0IGZsdXNoLCBvciBsYXRlciBpbiB0aGUgY3VycmVudCBmbHVzaCBpZiBvbmUgaXMgaW4gcHJvZ3Jlc3MsIGFmdGVyIGFsbCBpbnZhbGlkYXRlZCBjb21wdXRhdGlvbnMgaGF2ZSBiZWVuIHJlcnVuLiAgVGhlIGZ1bmN0aW9uIHdpbGwgYmUgcnVuIG9uY2UgYW5kIG5vdCBvbiBzdWJzZXF1ZW50IGZsdXNoZXMgdW5sZXNzIGBhZnRlckZsdXNoYCBpcyBjYWxsZWQgYWdhaW4uXG4gKiBAbG9jdXMgQ2xpZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBBIGZ1bmN0aW9uIHRvIGNhbGwgYXQgZmx1c2ggdGltZS5cbiAqL1xuVHJhY2tlci5hZnRlckZsdXNoID0gZnVuY3Rpb24gKGYpIHtcbiAgYWZ0ZXJGbHVzaENhbGxiYWNrcy5wdXNoKGYpO1xuICByZXF1aXJlRmx1c2goKTtcbn07XG4iXX0=
