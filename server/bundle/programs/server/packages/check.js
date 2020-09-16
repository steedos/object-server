(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var EJSON = Package.ejson.EJSON;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var check, Match;

var require = meteorInstall({"node_modules":{"meteor":{"check":{"match.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/check/match.js                                                                                          //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  check: () => check,
  Match: () => Match
});
let isPlainObject;
module.link("./isPlainObject", {
  isPlainObject(v) {
    isPlainObject = v;
  }

}, 0);
// Things we explicitly do NOT support:
//    - heterogenous arrays
const currentArgumentChecker = new Meteor.EnvironmentVariable();
const hasOwn = Object.prototype.hasOwnProperty;
/**
 * @summary Check that a value matches a [pattern](#matchpatterns).
 * If the value does not match the pattern, throw a `Match.Error`.
 *
 * Particularly useful to assert that arguments to a function have the right
 * types and structure.
 * @locus Anywhere
 * @param {Any} value The value to check
 * @param {MatchPattern} pattern The pattern to match `value` against
 */

function check(value, pattern) {
  // Record that check got called, if somebody cared.
  //
  // We use getOrNullIfOutsideFiber so that it's OK to call check()
  // from non-Fiber server contexts; the downside is that if you forget to
  // bindEnvironment on some random callback in your method/publisher,
  // it might not find the argumentChecker and you'll get an error about
  // not checking an argument that it looks like you're checking (instead
  // of just getting a "Node code must run in a Fiber" error).
  const argChecker = currentArgumentChecker.getOrNullIfOutsideFiber();

  if (argChecker) {
    argChecker.checking(value);
  }

  const result = testSubtree(value, pattern);

  if (result) {
    const err = new Match.Error(result.message);

    if (result.path) {
      err.message += ` in field ${result.path}`;
      err.path = result.path;
    }

    throw err;
  }
}

;
/**
 * @namespace Match
 * @summary The namespace for all Match types and methods.
 */

const Match = {
  Optional: function (pattern) {
    return new Optional(pattern);
  },
  Maybe: function (pattern) {
    return new Maybe(pattern);
  },
  OneOf: function (...args) {
    return new OneOf(args);
  },
  Any: ['__any__'],
  Where: function (condition) {
    return new Where(condition);
  },
  ObjectIncluding: function (pattern) {
    return new ObjectIncluding(pattern);
  },
  ObjectWithValues: function (pattern) {
    return new ObjectWithValues(pattern);
  },
  // Matches only signed 32-bit integers
  Integer: ['__integer__'],
  // XXX matchers should know how to describe themselves for errors
  Error: Meteor.makeErrorType('Match.Error', function (msg) {
    this.message = `Match error: ${msg}`; // The path of the value that failed to match. Initially empty, this gets
    // populated by catching and rethrowing the exception as it goes back up the
    // stack.
    // E.g.: "vals[3].entity.created"

    this.path = ''; // If this gets sent over DDP, don't give full internal details but at least
    // provide something better than 500 Internal server error.

    this.sanitizedError = new Meteor.Error(400, 'Match failed');
  }),

  // Tests to see if value matches pattern. Unlike check, it merely returns true
  // or false (unless an error other than Match.Error was thrown). It does not
  // interact with _failIfArgumentsAreNotAllChecked.
  // XXX maybe also implement a Match.match which returns more information about
  //     failures but without using exception handling or doing what check()
  //     does with _failIfArgumentsAreNotAllChecked and Meteor.Error conversion

  /**
   * @summary Returns true if the value matches the pattern.
   * @locus Anywhere
   * @param {Any} value The value to check
   * @param {MatchPattern} pattern The pattern to match `value` against
   */
  test(value, pattern) {
    return !testSubtree(value, pattern);
  },

  // Runs `f.apply(context, args)`. If check() is not called on every element of
  // `args` (either directly or in the first level of an array), throws an error
  // (using `description` in the message).
  _failIfArgumentsAreNotAllChecked(f, context, args, description) {
    const argChecker = new ArgumentChecker(args, description);
    const result = currentArgumentChecker.withValue(argChecker, () => f.apply(context, args)); // If f didn't itself throw, make sure it checked all of its arguments.

    argChecker.throwUnlessAllArgumentsHaveBeenChecked();
    return result;
  }

};

class Optional {
  constructor(pattern) {
    this.pattern = pattern;
  }

}

class Maybe {
  constructor(pattern) {
    this.pattern = pattern;
  }

}

class OneOf {
  constructor(choices) {
    if (!choices || choices.length === 0) {
      throw new Error('Must provide at least one choice to Match.OneOf');
    }

    this.choices = choices;
  }

}

class Where {
  constructor(condition) {
    this.condition = condition;
  }

}

class ObjectIncluding {
  constructor(pattern) {
    this.pattern = pattern;
  }

}

class ObjectWithValues {
  constructor(pattern) {
    this.pattern = pattern;
  }

}

const stringForErrorMessage = (value, options = {}) => {
  if (value === null) {
    return 'null';
  }

  if (options.onlyShowType) {
    return typeof value;
  } // Your average non-object things.  Saves from doing the try/catch below for.


  if (typeof value !== 'object') {
    return EJSON.stringify(value);
  }

  try {
    // Find objects with circular references since EJSON doesn't support them yet (Issue #4778 + Unaccepted PR)
    // If the native stringify is going to choke, EJSON.stringify is going to choke too.
    JSON.stringify(value);
  } catch (stringifyError) {
    if (stringifyError.name === 'TypeError') {
      return typeof value;
    }
  }

  return EJSON.stringify(value);
};

const typeofChecks = [[String, 'string'], [Number, 'number'], [Boolean, 'boolean'], // While we don't allow undefined/function in EJSON, this is good for optional
// arguments with OneOf.
[Function, 'function'], [undefined, 'undefined']]; // Return `false` if it matches. Otherwise, return an object with a `message` and a `path` field.

const testSubtree = (value, pattern) => {
  // Match anything!
  if (pattern === Match.Any) {
    return false;
  } // Basic atomic types.
  // Do not match boxed objects (e.g. String, Boolean)


  for (let i = 0; i < typeofChecks.length; ++i) {
    if (pattern === typeofChecks[i][0]) {
      if (typeof value === typeofChecks[i][1]) {
        return false;
      }

      return {
        message: `Expected ${typeofChecks[i][1]}, got ${stringForErrorMessage(value, {
          onlyShowType: true
        })}`,
        path: ''
      };
    }
  }

  if (pattern === null) {
    if (value === null) {
      return false;
    }

    return {
      message: `Expected null, got ${stringForErrorMessage(value)}`,
      path: ''
    };
  } // Strings, numbers, and booleans match literally. Goes well with Match.OneOf.


  if (typeof pattern === 'string' || typeof pattern === 'number' || typeof pattern === 'boolean') {
    if (value === pattern) {
      return false;
    }

    return {
      message: `Expected ${pattern}, got ${stringForErrorMessage(value)}`,
      path: ''
    };
  } // Match.Integer is special type encoded with array


  if (pattern === Match.Integer) {
    // There is no consistent and reliable way to check if variable is a 64-bit
    // integer. One of the popular solutions is to get reminder of division by 1
    // but this method fails on really large floats with big precision.
    // E.g.: 1.348192308491824e+23 % 1 === 0 in V8
    // Bitwise operators work consistantly but always cast variable to 32-bit
    // signed integer according to JavaScript specs.
    if (typeof value === 'number' && (value | 0) === value) {
      return false;
    }

    return {
      message: `Expected Integer, got ${stringForErrorMessage(value)}`,
      path: ''
    };
  } // 'Object' is shorthand for Match.ObjectIncluding({});


  if (pattern === Object) {
    pattern = Match.ObjectIncluding({});
  } // Array (checked AFTER Any, which is implemented as an Array).


  if (pattern instanceof Array) {
    if (pattern.length !== 1) {
      return {
        message: `Bad pattern: arrays must have one type element ${stringForErrorMessage(pattern)}`,
        path: ''
      };
    }

    if (!Array.isArray(value) && !isArguments(value)) {
      return {
        message: `Expected array, got ${stringForErrorMessage(value)}`,
        path: ''
      };
    }

    for (let i = 0, length = value.length; i < length; i++) {
      const result = testSubtree(value[i], pattern[0]);

      if (result) {
        result.path = _prependPath(i, result.path);
        return result;
      }
    }

    return false;
  } // Arbitrary validation checks. The condition can return false or throw a
  // Match.Error (ie, it can internally use check()) to fail.


  if (pattern instanceof Where) {
    let result;

    try {
      result = pattern.condition(value);
    } catch (err) {
      if (!(err instanceof Match.Error)) {
        throw err;
      }

      return {
        message: err.message,
        path: err.path
      };
    }

    if (result) {
      return false;
    } // XXX this error is terrible


    return {
      message: 'Failed Match.Where validation',
      path: ''
    };
  }

  if (pattern instanceof Maybe) {
    pattern = Match.OneOf(undefined, null, pattern.pattern);
  } else if (pattern instanceof Optional) {
    pattern = Match.OneOf(undefined, pattern.pattern);
  }

  if (pattern instanceof OneOf) {
    for (let i = 0; i < pattern.choices.length; ++i) {
      const result = testSubtree(value, pattern.choices[i]);

      if (!result) {
        // No error? Yay, return.
        return false;
      } // Match errors just mean try another choice.

    } // XXX this error is terrible


    return {
      message: 'Failed Match.OneOf, Match.Maybe or Match.Optional validation',
      path: ''
    };
  } // A function that isn't something we special-case is assumed to be a
  // constructor.


  if (pattern instanceof Function) {
    if (value instanceof pattern) {
      return false;
    }

    return {
      message: `Expected ${pattern.name || 'particular constructor'}`,
      path: ''
    };
  }

  let unknownKeysAllowed = false;
  let unknownKeyPattern;

  if (pattern instanceof ObjectIncluding) {
    unknownKeysAllowed = true;
    pattern = pattern.pattern;
  }

  if (pattern instanceof ObjectWithValues) {
    unknownKeysAllowed = true;
    unknownKeyPattern = [pattern.pattern];
    pattern = {}; // no required keys
  }

  if (typeof pattern !== 'object') {
    return {
      message: 'Bad pattern: unknown pattern type',
      path: ''
    };
  } // An object, with required and optional keys. Note that this does NOT do
  // structural matches against objects of special types that happen to match
  // the pattern: this really needs to be a plain old {Object}!


  if (typeof value !== 'object') {
    return {
      message: `Expected object, got ${typeof value}`,
      path: ''
    };
  }

  if (value === null) {
    return {
      message: `Expected object, got null`,
      path: ''
    };
  }

  if (!isPlainObject(value)) {
    return {
      message: `Expected plain object`,
      path: ''
    };
  }

  const requiredPatterns = Object.create(null);
  const optionalPatterns = Object.create(null);
  Object.keys(pattern).forEach(key => {
    const subPattern = pattern[key];

    if (subPattern instanceof Optional || subPattern instanceof Maybe) {
      optionalPatterns[key] = subPattern.pattern;
    } else {
      requiredPatterns[key] = subPattern;
    }
  });

  for (let key in Object(value)) {
    const subValue = value[key];

    if (hasOwn.call(requiredPatterns, key)) {
      const result = testSubtree(subValue, requiredPatterns[key]);

      if (result) {
        result.path = _prependPath(key, result.path);
        return result;
      }

      delete requiredPatterns[key];
    } else if (hasOwn.call(optionalPatterns, key)) {
      const result = testSubtree(subValue, optionalPatterns[key]);

      if (result) {
        result.path = _prependPath(key, result.path);
        return result;
      }
    } else {
      if (!unknownKeysAllowed) {
        return {
          message: 'Unknown key',
          path: key
        };
      }

      if (unknownKeyPattern) {
        const result = testSubtree(subValue, unknownKeyPattern[0]);

        if (result) {
          result.path = _prependPath(key, result.path);
          return result;
        }
      }
    }
  }

  const keys = Object.keys(requiredPatterns);

  if (keys.length) {
    return {
      message: `Missing key '${keys[0]}'`,
      path: ''
    };
  }
};

class ArgumentChecker {
  constructor(args, description) {
    // Make a SHALLOW copy of the arguments. (We'll be doing identity checks
    // against its contents.)
    this.args = [...args]; // Since the common case will be to check arguments in order, and we splice
    // out arguments when we check them, make it so we splice out from the end
    // rather than the beginning.

    this.args.reverse();
    this.description = description;
  }

  checking(value) {
    if (this._checkingOneValue(value)) {
      return;
    } // Allow check(arguments, [String]) or check(arguments.slice(1), [String])
    // or check([foo, bar], [String]) to count... but only if value wasn't
    // itself an argument.


    if (Array.isArray(value) || isArguments(value)) {
      Array.prototype.forEach.call(value, this._checkingOneValue.bind(this));
    }
  }

  _checkingOneValue(value) {
    for (let i = 0; i < this.args.length; ++i) {
      // Is this value one of the arguments? (This can have a false positive if
      // the argument is an interned primitive, but it's still a good enough
      // check.)
      // (NaN is not === to itself, so we have to check specially.)
      if (value === this.args[i] || Number.isNaN(value) && Number.isNaN(this.args[i])) {
        this.args.splice(i, 1);
        return true;
      }
    }

    return false;
  }

  throwUnlessAllArgumentsHaveBeenChecked() {
    if (this.args.length > 0) throw new Error(`Did not check() all arguments during ${this.description}`);
  }

}

const _jsKeywords = ['do', 'if', 'in', 'for', 'let', 'new', 'try', 'var', 'case', 'else', 'enum', 'eval', 'false', 'null', 'this', 'true', 'void', 'with', 'break', 'catch', 'class', 'const', 'super', 'throw', 'while', 'yield', 'delete', 'export', 'import', 'public', 'return', 'static', 'switch', 'typeof', 'default', 'extends', 'finally', 'package', 'private', 'continue', 'debugger', 'function', 'arguments', 'interface', 'protected', 'implements', 'instanceof']; // Assumes the base of path is already escaped properly
// returns key + base

const _prependPath = (key, base) => {
  if (typeof key === 'number' || key.match(/^[0-9]+$/)) {
    key = `[${key}]`;
  } else if (!key.match(/^[a-z_$][0-9a-z_$]*$/i) || _jsKeywords.indexOf(key) >= 0) {
    key = JSON.stringify([key]);
  }

  if (base && base[0] !== '[') {
    return `${key}.${base}`;
  }

  return key + base;
};

const isObject = value => typeof value === 'object' && value !== null;

const baseIsArguments = item => isObject(item) && Object.prototype.toString.call(item) === '[object Arguments]';

const isArguments = baseIsArguments(function () {
  return arguments;
}()) ? baseIsArguments : value => isObject(value) && typeof value.callee === 'function';
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"isPlainObject.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/check/isPlainObject.js                                                                                  //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  isPlainObject: () => isPlainObject
});
// Copy of jQuery.isPlainObject for the server side from jQuery v3.1.1.
const class2type = {};
const toString = class2type.toString;
const hasOwn = Object.prototype.hasOwnProperty;
const fnToString = hasOwn.toString;
const ObjectFunctionString = fnToString.call(Object);
const getProto = Object.getPrototypeOf;

const isPlainObject = obj => {
  let proto;
  let Ctor; // Detect obvious negatives
  // Use toString instead of jQuery.type to catch host objects

  if (!obj || toString.call(obj) !== '[object Object]') {
    return false;
  }

  proto = getProto(obj); // Objects with no prototype (e.g., `Object.create( null )`) are plain

  if (!proto) {
    return true;
  } // Objects with prototype are plain iff they were constructed by a global Object function


  Ctor = hasOwn.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor === 'function' && fnToString.call(Ctor) === ObjectFunctionString;
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/check/match.js");

/* Exports */
Package._define("check", exports, {
  check: check,
  Match: Match
});

})();

//# sourceURL=meteor://💻app/packages/check.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvY2hlY2svbWF0Y2guanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2NoZWNrL2lzUGxhaW5PYmplY3QuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiY2hlY2siLCJNYXRjaCIsImlzUGxhaW5PYmplY3QiLCJsaW5rIiwidiIsImN1cnJlbnRBcmd1bWVudENoZWNrZXIiLCJNZXRlb3IiLCJFbnZpcm9ubWVudFZhcmlhYmxlIiwiaGFzT3duIiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJ2YWx1ZSIsInBhdHRlcm4iLCJhcmdDaGVja2VyIiwiZ2V0T3JOdWxsSWZPdXRzaWRlRmliZXIiLCJjaGVja2luZyIsInJlc3VsdCIsInRlc3RTdWJ0cmVlIiwiZXJyIiwiRXJyb3IiLCJtZXNzYWdlIiwicGF0aCIsIk9wdGlvbmFsIiwiTWF5YmUiLCJPbmVPZiIsImFyZ3MiLCJBbnkiLCJXaGVyZSIsImNvbmRpdGlvbiIsIk9iamVjdEluY2x1ZGluZyIsIk9iamVjdFdpdGhWYWx1ZXMiLCJJbnRlZ2VyIiwibWFrZUVycm9yVHlwZSIsIm1zZyIsInNhbml0aXplZEVycm9yIiwidGVzdCIsIl9mYWlsSWZBcmd1bWVudHNBcmVOb3RBbGxDaGVja2VkIiwiZiIsImNvbnRleHQiLCJkZXNjcmlwdGlvbiIsIkFyZ3VtZW50Q2hlY2tlciIsIndpdGhWYWx1ZSIsImFwcGx5IiwidGhyb3dVbmxlc3NBbGxBcmd1bWVudHNIYXZlQmVlbkNoZWNrZWQiLCJjb25zdHJ1Y3RvciIsImNob2ljZXMiLCJsZW5ndGgiLCJzdHJpbmdGb3JFcnJvck1lc3NhZ2UiLCJvcHRpb25zIiwib25seVNob3dUeXBlIiwiRUpTT04iLCJzdHJpbmdpZnkiLCJKU09OIiwic3RyaW5naWZ5RXJyb3IiLCJuYW1lIiwidHlwZW9mQ2hlY2tzIiwiU3RyaW5nIiwiTnVtYmVyIiwiQm9vbGVhbiIsIkZ1bmN0aW9uIiwidW5kZWZpbmVkIiwiaSIsIkFycmF5IiwiaXNBcnJheSIsImlzQXJndW1lbnRzIiwiX3ByZXBlbmRQYXRoIiwidW5rbm93bktleXNBbGxvd2VkIiwidW5rbm93bktleVBhdHRlcm4iLCJyZXF1aXJlZFBhdHRlcm5zIiwiY3JlYXRlIiwib3B0aW9uYWxQYXR0ZXJucyIsImtleXMiLCJmb3JFYWNoIiwia2V5Iiwic3ViUGF0dGVybiIsInN1YlZhbHVlIiwiY2FsbCIsInJldmVyc2UiLCJfY2hlY2tpbmdPbmVWYWx1ZSIsImJpbmQiLCJpc05hTiIsInNwbGljZSIsIl9qc0tleXdvcmRzIiwiYmFzZSIsIm1hdGNoIiwiaW5kZXhPZiIsImlzT2JqZWN0IiwiYmFzZUlzQXJndW1lbnRzIiwiaXRlbSIsInRvU3RyaW5nIiwiYXJndW1lbnRzIiwiY2FsbGVlIiwiY2xhc3MydHlwZSIsImZuVG9TdHJpbmciLCJPYmplY3RGdW5jdGlvblN0cmluZyIsImdldFByb3RvIiwiZ2V0UHJvdG90eXBlT2YiLCJvYmoiLCJwcm90byIsIkN0b3IiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjO0FBQUNDLE9BQUssRUFBQyxNQUFJQSxLQUFYO0FBQWlCQyxPQUFLLEVBQUMsTUFBSUE7QUFBM0IsQ0FBZDtBQUFpRCxJQUFJQyxhQUFKO0FBQWtCSixNQUFNLENBQUNLLElBQVAsQ0FBWSxpQkFBWixFQUE4QjtBQUFDRCxlQUFhLENBQUNFLENBQUQsRUFBRztBQUFDRixpQkFBYSxHQUFDRSxDQUFkO0FBQWdCOztBQUFsQyxDQUE5QixFQUFrRSxDQUFsRTtBQUduRTtBQUNBO0FBRUEsTUFBTUMsc0JBQXNCLEdBQUcsSUFBSUMsTUFBTSxDQUFDQyxtQkFBWCxFQUEvQjtBQUNBLE1BQU1DLE1BQU0sR0FBR0MsTUFBTSxDQUFDQyxTQUFQLENBQWlCQyxjQUFoQztBQUVBOzs7Ozs7Ozs7OztBQVVPLFNBQVNYLEtBQVQsQ0FBZVksS0FBZixFQUFzQkMsT0FBdEIsRUFBK0I7QUFD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QixDQUFkO0FBQUE7QUFFQSxNQUFNMkYsVUFBVSxHQUFHLEVBQW5CO0FBRUEsTUFBTUgsUUFBUSxHQUFHRyxVQUFVLENBQUNILFFBQTVCO0FBRUEsTUFBTWxGLE1BQU0sR0FBR0MsTUFBTSxDQUFDQyxTQUFQLENBQWlCQyxjQUFoQztBQUVBLE1BQU1tRixVQUFVLEdBQUd0RixNQUFNLENBQUNrRixRQUExQjtBQUVBLE1BQU1LLG9CQUFvQixHQUFHRCxVQUFVLENBQUNqQixJQUFYLENBQWdCcEUsTUFBaEIsQ0FBN0I7QUFFQSxNQUFNdUYsUUFBUSxHQUFHdkYsTUFBTSxDQUFDd0YsY0FBeEI7O0FBRU8sTUFBTS9GLGFBQWEsR0FBR2dHLEdBQUcsSUFBSTtBQUNsQyxNQUFJQyxLQUFKO0FBQ0EsTUFBSUMsSUFBSixDQUZrQyxDQUlsQztBQUNBOztBQUNBLE1BQUksQ0FBQ0YsR0FBRCxJQUFRUixRQUFRLENBQUNiLElBQVQsQ0FBY3FCLEdBQWQsTUFBdUIsaUJBQW5DLEVBQXNEO0FBQ3BELFdBQU8sS0FBUDtBQUNEOztBQUVEQyxPQUFLLEdBQUdILFFBQVEsQ0FBQ0UsR0FBRCxDQUFoQixDQVZrQyxDQVlsQzs7QUFDQSxNQUFJLENBQUNDLEtBQUwsRUFBWTtBQUNWLFdBQU8sSUFBUDtBQUNELEdBZmlDLENBaUJsQzs7O0FBQ0FDLE1BQUksR0FBRzVGLE1BQU0sQ0FBQ3FFLElBQVAsQ0FBWXNCLEtBQVosRUFBbUIsYUFBbkIsS0FBcUNBLEtBQUssQ0FBQ3RELFdBQWxEO0FBQ0EsU0FBTyxPQUFPdUQsSUFBUCxLQUFnQixVQUFoQixJQUNMTixVQUFVLENBQUNqQixJQUFYLENBQWdCdUIsSUFBaEIsTUFBMEJMLG9CQUQ1QjtBQUVELENBckJNLEMiLCJmaWxlIjoiL3BhY2thZ2VzL2NoZWNrLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gWFhYIGRvY3NcbmltcG9ydCB7IGlzUGxhaW5PYmplY3QgfSBmcm9tICcuL2lzUGxhaW5PYmplY3QnO1xuXG4vLyBUaGluZ3Mgd2UgZXhwbGljaXRseSBkbyBOT1Qgc3VwcG9ydDpcbi8vICAgIC0gaGV0ZXJvZ2Vub3VzIGFycmF5c1xuXG5jb25zdCBjdXJyZW50QXJndW1lbnRDaGVja2VyID0gbmV3IE1ldGVvci5FbnZpcm9ubWVudFZhcmlhYmxlO1xuY29uc3QgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBAc3VtbWFyeSBDaGVjayB0aGF0IGEgdmFsdWUgbWF0Y2hlcyBhIFtwYXR0ZXJuXSgjbWF0Y2hwYXR0ZXJucykuXG4gKiBJZiB0aGUgdmFsdWUgZG9lcyBub3QgbWF0Y2ggdGhlIHBhdHRlcm4sIHRocm93IGEgYE1hdGNoLkVycm9yYC5cbiAqXG4gKiBQYXJ0aWN1bGFybHkgdXNlZnVsIHRvIGFzc2VydCB0aGF0IGFyZ3VtZW50cyB0byBhIGZ1bmN0aW9uIGhhdmUgdGhlIHJpZ2h0XG4gKiB0eXBlcyBhbmQgc3RydWN0dXJlLlxuICogQGxvY3VzIEFueXdoZXJlXG4gKiBAcGFyYW0ge0FueX0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrXG4gKiBAcGFyYW0ge01hdGNoUGF0dGVybn0gcGF0dGVybiBUaGUgcGF0dGVybiB0byBtYXRjaCBgdmFsdWVgIGFnYWluc3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrKHZhbHVlLCBwYXR0ZXJuKSB7XG4gIC8vIFJlY29yZCB0aGF0IGNoZWNrIGdvdCBjYWxsZWQsIGlmIHNvbWVib2R5IGNhcmVkLlxuICAvL1xuICAvLyBXZSB1c2UgZ2V0T3JOdWxsSWZPdXRzaWRlRmliZXIgc28gdGhhdCBpdCdzIE9LIHRvIGNhbGwgY2hlY2soKVxuICAvLyBmcm9tIG5vbi1GaWJlciBzZXJ2ZXIgY29udGV4dHM7IHRoZSBkb3duc2lkZSBpcyB0aGF0IGlmIHlvdSBmb3JnZXQgdG9cbiAgLy8gYmluZEVudmlyb25tZW50IG9uIHNvbWUgcmFuZG9tIGNhbGxiYWNrIGluIHlvdXIgbWV0aG9kL3B1Ymxpc2hlcixcbiAgLy8gaXQgbWlnaHQgbm90IGZpbmQgdGhlIGFyZ3VtZW50Q2hlY2tlciBhbmQgeW91J2xsIGdldCBhbiBlcnJvciBhYm91dFxuICAvLyBub3QgY2hlY2tpbmcgYW4gYXJndW1lbnQgdGhhdCBpdCBsb29rcyBsaWtlIHlvdSdyZSBjaGVja2luZyAoaW5zdGVhZFxuICAvLyBvZiBqdXN0IGdldHRpbmcgYSBcIk5vZGUgY29kZSBtdXN0IHJ1biBpbiBhIEZpYmVyXCIgZXJyb3IpLlxuICBjb25zdCBhcmdDaGVja2VyID0gY3VycmVudEFyZ3VtZW50Q2hlY2tlci5nZXRPck51bGxJZk91dHNpZGVGaWJlcigpO1xuICBpZiAoYXJnQ2hlY2tlcikge1xuICAgIGFyZ0NoZWNrZXIuY2hlY2tpbmcodmFsdWUpO1xuICB9XG5cbiAgY29uc3QgcmVzdWx0ID0gdGVzdFN1YnRyZWUodmFsdWUsIHBhdHRlcm4pO1xuICBpZiAocmVzdWx0KSB7XG4gICAgY29uc3QgZXJyID0gbmV3IE1hdGNoLkVycm9yKHJlc3VsdC5tZXNzYWdlKTtcbiAgICBpZiAocmVzdWx0LnBhdGgpIHtcbiAgICAgIGVyci5tZXNzYWdlICs9IGAgaW4gZmllbGQgJHtyZXN1bHQucGF0aH1gO1xuICAgICAgZXJyLnBhdGggPSByZXN1bHQucGF0aDtcbiAgICB9XG5cbiAgICB0aHJvdyBlcnI7XG4gIH1cbn07XG5cbi8qKlxuICogQG5hbWVzcGFjZSBNYXRjaFxuICogQHN1bW1hcnkgVGhlIG5hbWVzcGFjZSBmb3IgYWxsIE1hdGNoIHR5cGVzIGFuZCBtZXRob2RzLlxuICovXG5leHBvcnQgY29uc3QgTWF0Y2ggPSB7XG4gIE9wdGlvbmFsOiBmdW5jdGlvbihwYXR0ZXJuKSB7XG4gICAgcmV0dXJuIG5ldyBPcHRpb25hbChwYXR0ZXJuKTtcbiAgfSxcblxuICBNYXliZTogZnVuY3Rpb24ocGF0dGVybikge1xuICAgIHJldHVybiBuZXcgTWF5YmUocGF0dGVybik7XG4gIH0sXG5cbiAgT25lT2Y6IGZ1bmN0aW9uKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gbmV3IE9uZU9mKGFyZ3MpO1xuICB9LFxuXG4gIEFueTogWydfX2FueV9fJ10sXG4gIFdoZXJlOiBmdW5jdGlvbihjb25kaXRpb24pIHtcbiAgICByZXR1cm4gbmV3IFdoZXJlKGNvbmRpdGlvbik7XG4gIH0sXG5cbiAgT2JqZWN0SW5jbHVkaW5nOiBmdW5jdGlvbihwYXR0ZXJuKSB7XG4gICAgcmV0dXJuIG5ldyBPYmplY3RJbmNsdWRpbmcocGF0dGVybilcbiAgfSxcblxuICBPYmplY3RXaXRoVmFsdWVzOiBmdW5jdGlvbihwYXR0ZXJuKSB7XG4gICAgcmV0dXJuIG5ldyBPYmplY3RXaXRoVmFsdWVzKHBhdHRlcm4pO1xuICB9LFxuXG4gIC8vIE1hdGNoZXMgb25seSBzaWduZWQgMzItYml0IGludGVnZXJzXG4gIEludGVnZXI6IFsnX19pbnRlZ2VyX18nXSxcblxuICAvLyBYWFggbWF0Y2hlcnMgc2hvdWxkIGtub3cgaG93IHRvIGRlc2NyaWJlIHRoZW1zZWx2ZXMgZm9yIGVycm9yc1xuICBFcnJvcjogTWV0ZW9yLm1ha2VFcnJvclR5cGUoJ01hdGNoLkVycm9yJywgZnVuY3Rpb24gKG1zZykge1xuICAgIHRoaXMubWVzc2FnZSA9IGBNYXRjaCBlcnJvcjogJHttc2d9YDtcblxuICAgIC8vIFRoZSBwYXRoIG9mIHRoZSB2YWx1ZSB0aGF0IGZhaWxlZCB0byBtYXRjaC4gSW5pdGlhbGx5IGVtcHR5LCB0aGlzIGdldHNcbiAgICAvLyBwb3B1bGF0ZWQgYnkgY2F0Y2hpbmcgYW5kIHJldGhyb3dpbmcgdGhlIGV4Y2VwdGlvbiBhcyBpdCBnb2VzIGJhY2sgdXAgdGhlXG4gICAgLy8gc3RhY2suXG4gICAgLy8gRS5nLjogXCJ2YWxzWzNdLmVudGl0eS5jcmVhdGVkXCJcbiAgICB0aGlzLnBhdGggPSAnJztcblxuICAgIC8vIElmIHRoaXMgZ2V0cyBzZW50IG92ZXIgRERQLCBkb24ndCBnaXZlIGZ1bGwgaW50ZXJuYWwgZGV0YWlscyBidXQgYXQgbGVhc3RcbiAgICAvLyBwcm92aWRlIHNvbWV0aGluZyBiZXR0ZXIgdGhhbiA1MDAgSW50ZXJuYWwgc2VydmVyIGVycm9yLlxuICAgIHRoaXMuc2FuaXRpemVkRXJyb3IgPSBuZXcgTWV0ZW9yLkVycm9yKDQwMCwgJ01hdGNoIGZhaWxlZCcpO1xuICB9KSxcblxuICAvLyBUZXN0cyB0byBzZWUgaWYgdmFsdWUgbWF0Y2hlcyBwYXR0ZXJuLiBVbmxpa2UgY2hlY2ssIGl0IG1lcmVseSByZXR1cm5zIHRydWVcbiAgLy8gb3IgZmFsc2UgKHVubGVzcyBhbiBlcnJvciBvdGhlciB0aGFuIE1hdGNoLkVycm9yIHdhcyB0aHJvd24pLiBJdCBkb2VzIG5vdFxuICAvLyBpbnRlcmFjdCB3aXRoIF9mYWlsSWZBcmd1bWVudHNBcmVOb3RBbGxDaGVja2VkLlxuICAvLyBYWFggbWF5YmUgYWxzbyBpbXBsZW1lbnQgYSBNYXRjaC5tYXRjaCB3aGljaCByZXR1cm5zIG1vcmUgaW5mb3JtYXRpb24gYWJvdXRcbiAgLy8gICAgIGZhaWx1cmVzIGJ1dCB3aXRob3V0IHVzaW5nIGV4Y2VwdGlvbiBoYW5kbGluZyBvciBkb2luZyB3aGF0IGNoZWNrKClcbiAgLy8gICAgIGRvZXMgd2l0aCBfZmFpbElmQXJndW1lbnRzQXJlTm90QWxsQ2hlY2tlZCBhbmQgTWV0ZW9yLkVycm9yIGNvbnZlcnNpb25cblxuICAvKipcbiAgICogQHN1bW1hcnkgUmV0dXJucyB0cnVlIGlmIHRoZSB2YWx1ZSBtYXRjaGVzIHRoZSBwYXR0ZXJuLlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQHBhcmFtIHtBbnl9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVja1xuICAgKiBAcGFyYW0ge01hdGNoUGF0dGVybn0gcGF0dGVybiBUaGUgcGF0dGVybiB0byBtYXRjaCBgdmFsdWVgIGFnYWluc3RcbiAgICovXG4gIHRlc3QodmFsdWUsIHBhdHRlcm4pIHtcbiAgICByZXR1cm4gIXRlc3RTdWJ0cmVlKHZhbHVlLCBwYXR0ZXJuKTtcbiAgfSxcblxuICAvLyBSdW5zIGBmLmFwcGx5KGNvbnRleHQsIGFyZ3MpYC4gSWYgY2hlY2soKSBpcyBub3QgY2FsbGVkIG9uIGV2ZXJ5IGVsZW1lbnQgb2ZcbiAgLy8gYGFyZ3NgIChlaXRoZXIgZGlyZWN0bHkgb3IgaW4gdGhlIGZpcnN0IGxldmVsIG9mIGFuIGFycmF5KSwgdGhyb3dzIGFuIGVycm9yXG4gIC8vICh1c2luZyBgZGVzY3JpcHRpb25gIGluIHRoZSBtZXNzYWdlKS5cbiAgX2ZhaWxJZkFyZ3VtZW50c0FyZU5vdEFsbENoZWNrZWQoZiwgY29udGV4dCwgYXJncywgZGVzY3JpcHRpb24pIHtcbiAgICBjb25zdCBhcmdDaGVja2VyID0gbmV3IEFyZ3VtZW50Q2hlY2tlcihhcmdzLCBkZXNjcmlwdGlvbik7XG4gICAgY29uc3QgcmVzdWx0ID0gY3VycmVudEFyZ3VtZW50Q2hlY2tlci53aXRoVmFsdWUoXG4gICAgICBhcmdDaGVja2VyLCBcbiAgICAgICgpID0+IGYuYXBwbHkoY29udGV4dCwgYXJncylcbiAgICApO1xuXG4gICAgLy8gSWYgZiBkaWRuJ3QgaXRzZWxmIHRocm93LCBtYWtlIHN1cmUgaXQgY2hlY2tlZCBhbGwgb2YgaXRzIGFyZ3VtZW50cy5cbiAgICBhcmdDaGVja2VyLnRocm93VW5sZXNzQWxsQXJndW1lbnRzSGF2ZUJlZW5DaGVja2VkKCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufTtcblxuY2xhc3MgT3B0aW9uYWwge1xuICBjb25zdHJ1Y3RvcihwYXR0ZXJuKSB7XG4gICAgdGhpcy5wYXR0ZXJuID0gcGF0dGVybjtcbiAgfVxufVxuXG5jbGFzcyBNYXliZSB7XG4gIGNvbnN0cnVjdG9yKHBhdHRlcm4pIHtcbiAgICB0aGlzLnBhdHRlcm4gPSBwYXR0ZXJuO1xuICB9XG59XG5cbmNsYXNzIE9uZU9mIHtcbiAgY29uc3RydWN0b3IoY2hvaWNlcykge1xuICAgIGlmICghY2hvaWNlcyB8fCBjaG9pY2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdNdXN0IHByb3ZpZGUgYXQgbGVhc3Qgb25lIGNob2ljZSB0byBNYXRjaC5PbmVPZicpO1xuICAgIH1cblxuICAgIHRoaXMuY2hvaWNlcyA9IGNob2ljZXM7XG4gIH1cbn1cblxuY2xhc3MgV2hlcmUge1xuICBjb25zdHJ1Y3Rvcihjb25kaXRpb24pIHtcbiAgICB0aGlzLmNvbmRpdGlvbiA9IGNvbmRpdGlvbjtcbiAgfVxufVxuXG5jbGFzcyBPYmplY3RJbmNsdWRpbmcge1xuICBjb25zdHJ1Y3RvcihwYXR0ZXJuKSB7XG4gICAgdGhpcy5wYXR0ZXJuID0gcGF0dGVybjtcbiAgfVxufVxuXG5jbGFzcyBPYmplY3RXaXRoVmFsdWVzIHtcbiAgY29uc3RydWN0b3IocGF0dGVybikge1xuICAgIHRoaXMucGF0dGVybiA9IHBhdHRlcm47XG4gIH1cbn1cblxuY29uc3Qgc3RyaW5nRm9yRXJyb3JNZXNzYWdlID0gKHZhbHVlLCBvcHRpb25zID0ge30pID0+IHtcbiAgaWYgKCB2YWx1ZSA9PT0gbnVsbCApIHtcbiAgICByZXR1cm4gJ251bGwnO1xuICB9XG5cbiAgaWYgKCBvcHRpb25zLm9ubHlTaG93VHlwZSApIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlO1xuICB9XG5cbiAgLy8gWW91ciBhdmVyYWdlIG5vbi1vYmplY3QgdGhpbmdzLiAgU2F2ZXMgZnJvbSBkb2luZyB0aGUgdHJ5L2NhdGNoIGJlbG93IGZvci5cbiAgaWYgKCB0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnICkge1xuICAgIHJldHVybiBFSlNPTi5zdHJpbmdpZnkodmFsdWUpXG4gIH1cblxuICB0cnkge1xuXG4gICAgLy8gRmluZCBvYmplY3RzIHdpdGggY2lyY3VsYXIgcmVmZXJlbmNlcyBzaW5jZSBFSlNPTiBkb2Vzbid0IHN1cHBvcnQgdGhlbSB5ZXQgKElzc3VlICM0Nzc4ICsgVW5hY2NlcHRlZCBQUilcbiAgICAvLyBJZiB0aGUgbmF0aXZlIHN0cmluZ2lmeSBpcyBnb2luZyB0byBjaG9rZSwgRUpTT04uc3RyaW5naWZ5IGlzIGdvaW5nIHRvIGNob2tlIHRvby5cbiAgICBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gIH0gY2F0Y2ggKHN0cmluZ2lmeUVycm9yKSB7XG4gICAgaWYgKCBzdHJpbmdpZnlFcnJvci5uYW1lID09PSAnVHlwZUVycm9yJyApIHtcbiAgICAgIHJldHVybiB0eXBlb2YgdmFsdWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIEVKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG59O1xuXG5jb25zdCB0eXBlb2ZDaGVja3MgPSBbXG4gIFtTdHJpbmcsICdzdHJpbmcnXSxcbiAgW051bWJlciwgJ251bWJlciddLFxuICBbQm9vbGVhbiwgJ2Jvb2xlYW4nXSxcblxuICAvLyBXaGlsZSB3ZSBkb24ndCBhbGxvdyB1bmRlZmluZWQvZnVuY3Rpb24gaW4gRUpTT04sIHRoaXMgaXMgZ29vZCBmb3Igb3B0aW9uYWxcbiAgLy8gYXJndW1lbnRzIHdpdGggT25lT2YuXG4gIFtGdW5jdGlvbiwgJ2Z1bmN0aW9uJ10sXG4gIFt1bmRlZmluZWQsICd1bmRlZmluZWQnXSxcbl07XG5cbi8vIFJldHVybiBgZmFsc2VgIGlmIGl0IG1hdGNoZXMuIE90aGVyd2lzZSwgcmV0dXJuIGFuIG9iamVjdCB3aXRoIGEgYG1lc3NhZ2VgIGFuZCBhIGBwYXRoYCBmaWVsZC5cbmNvbnN0IHRlc3RTdWJ0cmVlID0gKHZhbHVlLCBwYXR0ZXJuKSA9PiB7XG5cbiAgLy8gTWF0Y2ggYW55dGhpbmchXG4gIGlmIChwYXR0ZXJuID09PSBNYXRjaC5BbnkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBCYXNpYyBhdG9taWMgdHlwZXMuXG4gIC8vIERvIG5vdCBtYXRjaCBib3hlZCBvYmplY3RzIChlLmcuIFN0cmluZywgQm9vbGVhbilcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0eXBlb2ZDaGVja3MubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAocGF0dGVybiA9PT0gdHlwZW9mQ2hlY2tzW2ldWzBdKSB7XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSB0eXBlb2ZDaGVja3NbaV1bMV0pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBtZXNzYWdlOiBgRXhwZWN0ZWQgJHt0eXBlb2ZDaGVja3NbaV1bMV19LCBnb3QgJHtzdHJpbmdGb3JFcnJvck1lc3NhZ2UodmFsdWUsIHsgb25seVNob3dUeXBlOiB0cnVlIH0pfWAsXG4gICAgICAgIHBhdGg6ICcnLFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICBpZiAocGF0dGVybiA9PT0gbnVsbCkge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBtZXNzYWdlOiBgRXhwZWN0ZWQgbnVsbCwgZ290ICR7c3RyaW5nRm9yRXJyb3JNZXNzYWdlKHZhbHVlKX1gLFxuICAgICAgcGF0aDogJycsXG4gICAgfTtcbiAgfVxuXG4gIC8vIFN0cmluZ3MsIG51bWJlcnMsIGFuZCBib29sZWFucyBtYXRjaCBsaXRlcmFsbHkuIEdvZXMgd2VsbCB3aXRoIE1hdGNoLk9uZU9mLlxuICBpZiAodHlwZW9mIHBhdHRlcm4gPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBwYXR0ZXJuID09PSAnbnVtYmVyJyB8fCB0eXBlb2YgcGF0dGVybiA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgaWYgKHZhbHVlID09PSBwYXR0ZXJuKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIG1lc3NhZ2U6IGBFeHBlY3RlZCAke3BhdHRlcm59LCBnb3QgJHtzdHJpbmdGb3JFcnJvck1lc3NhZ2UodmFsdWUpfWAsXG4gICAgICBwYXRoOiAnJyxcbiAgICB9O1xuICB9XG5cbiAgLy8gTWF0Y2guSW50ZWdlciBpcyBzcGVjaWFsIHR5cGUgZW5jb2RlZCB3aXRoIGFycmF5XG4gIGlmIChwYXR0ZXJuID09PSBNYXRjaC5JbnRlZ2VyKSB7XG5cbiAgICAvLyBUaGVyZSBpcyBubyBjb25zaXN0ZW50IGFuZCByZWxpYWJsZSB3YXkgdG8gY2hlY2sgaWYgdmFyaWFibGUgaXMgYSA2NC1iaXRcbiAgICAvLyBpbnRlZ2VyLiBPbmUgb2YgdGhlIHBvcHVsYXIgc29sdXRpb25zIGlzIHRvIGdldCByZW1pbmRlciBvZiBkaXZpc2lvbiBieSAxXG4gICAgLy8gYnV0IHRoaXMgbWV0aG9kIGZhaWxzIG9uIHJlYWxseSBsYXJnZSBmbG9hdHMgd2l0aCBiaWcgcHJlY2lzaW9uLlxuICAgIC8vIEUuZy46IDEuMzQ4MTkyMzA4NDkxODI0ZSsyMyAlIDEgPT09IDAgaW4gVjhcbiAgICAvLyBCaXR3aXNlIG9wZXJhdG9ycyB3b3JrIGNvbnNpc3RhbnRseSBidXQgYWx3YXlzIGNhc3QgdmFyaWFibGUgdG8gMzItYml0XG4gICAgLy8gc2lnbmVkIGludGVnZXIgYWNjb3JkaW5nIHRvIEphdmFTY3JpcHQgc3BlY3MuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgKHZhbHVlIHwgMCkgPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBtZXNzYWdlOiBgRXhwZWN0ZWQgSW50ZWdlciwgZ290ICR7c3RyaW5nRm9yRXJyb3JNZXNzYWdlKHZhbHVlKX1gLFxuICAgICAgcGF0aDogJycsXG4gICAgfTtcbiAgfVxuXG4gIC8vICdPYmplY3QnIGlzIHNob3J0aGFuZCBmb3IgTWF0Y2guT2JqZWN0SW5jbHVkaW5nKHt9KTtcbiAgaWYgKHBhdHRlcm4gPT09IE9iamVjdCkge1xuICAgIHBhdHRlcm4gPSBNYXRjaC5PYmplY3RJbmNsdWRpbmcoe30pO1xuICB9XG5cbiAgLy8gQXJyYXkgKGNoZWNrZWQgQUZURVIgQW55LCB3aGljaCBpcyBpbXBsZW1lbnRlZCBhcyBhbiBBcnJheSkuXG4gIGlmIChwYXR0ZXJuIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICBpZiAocGF0dGVybi5sZW5ndGggIT09IDEpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG1lc3NhZ2U6IGBCYWQgcGF0dGVybjogYXJyYXlzIG11c3QgaGF2ZSBvbmUgdHlwZSBlbGVtZW50ICR7c3RyaW5nRm9yRXJyb3JNZXNzYWdlKHBhdHRlcm4pfWAsXG4gICAgICAgIHBhdGg6ICcnLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpICYmICFpc0FyZ3VtZW50cyh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG1lc3NhZ2U6IGBFeHBlY3RlZCBhcnJheSwgZ290ICR7c3RyaW5nRm9yRXJyb3JNZXNzYWdlKHZhbHVlKX1gLFxuICAgICAgICBwYXRoOiAnJyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbmd0aCA9IHZhbHVlLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSB0ZXN0U3VidHJlZSh2YWx1ZVtpXSwgcGF0dGVyblswXSk7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIHJlc3VsdC5wYXRoID0gX3ByZXBlbmRQYXRoKGksIHJlc3VsdC5wYXRoKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gQXJiaXRyYXJ5IHZhbGlkYXRpb24gY2hlY2tzLiBUaGUgY29uZGl0aW9uIGNhbiByZXR1cm4gZmFsc2Ugb3IgdGhyb3cgYVxuICAvLyBNYXRjaC5FcnJvciAoaWUsIGl0IGNhbiBpbnRlcm5hbGx5IHVzZSBjaGVjaygpKSB0byBmYWlsLlxuICBpZiAocGF0dGVybiBpbnN0YW5jZW9mIFdoZXJlKSB7XG4gICAgbGV0IHJlc3VsdDtcbiAgICB0cnkge1xuICAgICAgcmVzdWx0ID0gcGF0dGVybi5jb25kaXRpb24odmFsdWUpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgaWYgKCEoZXJyIGluc3RhbmNlb2YgTWF0Y2guRXJyb3IpKSB7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UsXG4gICAgICAgIHBhdGg6IGVyci5wYXRoXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChyZXN1bHQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBYWFggdGhpcyBlcnJvciBpcyB0ZXJyaWJsZVxuICAgIHJldHVybiB7XG4gICAgICBtZXNzYWdlOiAnRmFpbGVkIE1hdGNoLldoZXJlIHZhbGlkYXRpb24nLFxuICAgICAgcGF0aDogJycsXG4gICAgfTtcbiAgfVxuXG4gIGlmIChwYXR0ZXJuIGluc3RhbmNlb2YgTWF5YmUpIHtcbiAgICBwYXR0ZXJuID0gTWF0Y2guT25lT2YodW5kZWZpbmVkLCBudWxsLCBwYXR0ZXJuLnBhdHRlcm4pO1xuICB9IGVsc2UgaWYgKHBhdHRlcm4gaW5zdGFuY2VvZiBPcHRpb25hbCkge1xuICAgIHBhdHRlcm4gPSBNYXRjaC5PbmVPZih1bmRlZmluZWQsIHBhdHRlcm4ucGF0dGVybik7XG4gIH1cblxuICBpZiAocGF0dGVybiBpbnN0YW5jZW9mIE9uZU9mKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXR0ZXJuLmNob2ljZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHRlc3RTdWJ0cmVlKHZhbHVlLCBwYXR0ZXJuLmNob2ljZXNbaV0pO1xuICAgICAgaWYgKCFyZXN1bHQpIHtcblxuICAgICAgICAvLyBObyBlcnJvcj8gWWF5LCByZXR1cm4uXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gTWF0Y2ggZXJyb3JzIGp1c3QgbWVhbiB0cnkgYW5vdGhlciBjaG9pY2UuXG4gICAgfVxuXG4gICAgLy8gWFhYIHRoaXMgZXJyb3IgaXMgdGVycmlibGVcbiAgICByZXR1cm4ge1xuICAgICAgbWVzc2FnZTogJ0ZhaWxlZCBNYXRjaC5PbmVPZiwgTWF0Y2guTWF5YmUgb3IgTWF0Y2guT3B0aW9uYWwgdmFsaWRhdGlvbicsXG4gICAgICBwYXRoOiAnJyxcbiAgICB9O1xuICB9XG5cbiAgLy8gQSBmdW5jdGlvbiB0aGF0IGlzbid0IHNvbWV0aGluZyB3ZSBzcGVjaWFsLWNhc2UgaXMgYXNzdW1lZCB0byBiZSBhXG4gIC8vIGNvbnN0cnVjdG9yLlxuICBpZiAocGF0dGVybiBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgcGF0dGVybikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBtZXNzYWdlOiBgRXhwZWN0ZWQgJHtwYXR0ZXJuLm5hbWUgfHwgJ3BhcnRpY3VsYXIgY29uc3RydWN0b3InfWAsXG4gICAgICBwYXRoOiAnJyxcbiAgICB9O1xuICB9XG5cbiAgbGV0IHVua25vd25LZXlzQWxsb3dlZCA9IGZhbHNlO1xuICBsZXQgdW5rbm93bktleVBhdHRlcm47XG4gIGlmIChwYXR0ZXJuIGluc3RhbmNlb2YgT2JqZWN0SW5jbHVkaW5nKSB7XG4gICAgdW5rbm93bktleXNBbGxvd2VkID0gdHJ1ZTtcbiAgICBwYXR0ZXJuID0gcGF0dGVybi5wYXR0ZXJuO1xuICB9XG5cbiAgaWYgKHBhdHRlcm4gaW5zdGFuY2VvZiBPYmplY3RXaXRoVmFsdWVzKSB7XG4gICAgdW5rbm93bktleXNBbGxvd2VkID0gdHJ1ZTtcbiAgICB1bmtub3duS2V5UGF0dGVybiA9IFtwYXR0ZXJuLnBhdHRlcm5dO1xuICAgIHBhdHRlcm4gPSB7fTsgIC8vIG5vIHJlcXVpcmVkIGtleXNcbiAgfVxuXG4gIGlmICh0eXBlb2YgcGF0dGVybiAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbWVzc2FnZTogJ0JhZCBwYXR0ZXJuOiB1bmtub3duIHBhdHRlcm4gdHlwZScsXG4gICAgICBwYXRoOiAnJyxcbiAgICB9O1xuICB9XG5cbiAgLy8gQW4gb2JqZWN0LCB3aXRoIHJlcXVpcmVkIGFuZCBvcHRpb25hbCBrZXlzLiBOb3RlIHRoYXQgdGhpcyBkb2VzIE5PVCBkb1xuICAvLyBzdHJ1Y3R1cmFsIG1hdGNoZXMgYWdhaW5zdCBvYmplY3RzIG9mIHNwZWNpYWwgdHlwZXMgdGhhdCBoYXBwZW4gdG8gbWF0Y2hcbiAgLy8gdGhlIHBhdHRlcm46IHRoaXMgcmVhbGx5IG5lZWRzIHRvIGJlIGEgcGxhaW4gb2xkIHtPYmplY3R9IVxuICBpZiAodHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiB7XG4gICAgICBtZXNzYWdlOiBgRXhwZWN0ZWQgb2JqZWN0LCBnb3QgJHt0eXBlb2YgdmFsdWV9YCxcbiAgICAgIHBhdGg6ICcnLFxuICAgIH07XG4gIH1cblxuICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbWVzc2FnZTogYEV4cGVjdGVkIG9iamVjdCwgZ290IG51bGxgLFxuICAgICAgcGF0aDogJycsXG4gICAgfTtcbiAgfVxuXG4gIGlmICghIGlzUGxhaW5PYmplY3QodmFsdWUpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1lc3NhZ2U6IGBFeHBlY3RlZCBwbGFpbiBvYmplY3RgLFxuICAgICAgcGF0aDogJycsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IHJlcXVpcmVkUGF0dGVybnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBjb25zdCBvcHRpb25hbFBhdHRlcm5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICBPYmplY3Qua2V5cyhwYXR0ZXJuKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgY29uc3Qgc3ViUGF0dGVybiA9IHBhdHRlcm5ba2V5XTtcbiAgICBpZiAoc3ViUGF0dGVybiBpbnN0YW5jZW9mIE9wdGlvbmFsIHx8XG4gICAgICAgIHN1YlBhdHRlcm4gaW5zdGFuY2VvZiBNYXliZSkge1xuICAgICAgb3B0aW9uYWxQYXR0ZXJuc1trZXldID0gc3ViUGF0dGVybi5wYXR0ZXJuO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXF1aXJlZFBhdHRlcm5zW2tleV0gPSBzdWJQYXR0ZXJuO1xuICAgIH1cbiAgfSk7XG5cbiAgZm9yIChsZXQga2V5IGluIE9iamVjdCh2YWx1ZSkpIHtcbiAgICBjb25zdCBzdWJWYWx1ZSA9IHZhbHVlW2tleV07XG4gICAgaWYgKGhhc093bi5jYWxsKHJlcXVpcmVkUGF0dGVybnMsIGtleSkpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHRlc3RTdWJ0cmVlKHN1YlZhbHVlLCByZXF1aXJlZFBhdHRlcm5zW2tleV0pO1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICByZXN1bHQucGF0aCA9IF9wcmVwZW5kUGF0aChrZXksIHJlc3VsdC5wYXRoKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cblxuICAgICAgZGVsZXRlIHJlcXVpcmVkUGF0dGVybnNba2V5XTtcbiAgICB9IGVsc2UgaWYgKGhhc093bi5jYWxsKG9wdGlvbmFsUGF0dGVybnMsIGtleSkpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHRlc3RTdWJ0cmVlKHN1YlZhbHVlLCBvcHRpb25hbFBhdHRlcm5zW2tleV0pO1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICByZXN1bHQucGF0aCA9IF9wcmVwZW5kUGF0aChrZXksIHJlc3VsdC5wYXRoKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cblxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIXVua25vd25LZXlzQWxsb3dlZCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG1lc3NhZ2U6ICdVbmtub3duIGtleScsXG4gICAgICAgICAgcGF0aDoga2V5LFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBpZiAodW5rbm93bktleVBhdHRlcm4pIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGVzdFN1YnRyZWUoc3ViVmFsdWUsIHVua25vd25LZXlQYXR0ZXJuWzBdKTtcbiAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgIHJlc3VsdC5wYXRoID0gX3ByZXBlbmRQYXRoKGtleSwgcmVzdWx0LnBhdGgpO1xuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMocmVxdWlyZWRQYXR0ZXJucyk7XG4gIGlmIChrZXlzLmxlbmd0aCkge1xuICAgIHJldHVybiB7XG4gICAgICBtZXNzYWdlOiBgTWlzc2luZyBrZXkgJyR7a2V5c1swXX0nYCxcbiAgICAgIHBhdGg6ICcnLFxuICAgIH07XG4gIH1cbn07XG5cbmNsYXNzIEFyZ3VtZW50Q2hlY2tlciB7XG4gIGNvbnN0cnVjdG9yIChhcmdzLCBkZXNjcmlwdGlvbikge1xuXG4gICAgLy8gTWFrZSBhIFNIQUxMT1cgY29weSBvZiB0aGUgYXJndW1lbnRzLiAoV2UnbGwgYmUgZG9pbmcgaWRlbnRpdHkgY2hlY2tzXG4gICAgLy8gYWdhaW5zdCBpdHMgY29udGVudHMuKVxuICAgIHRoaXMuYXJncyA9IFsuLi5hcmdzXTtcblxuICAgIC8vIFNpbmNlIHRoZSBjb21tb24gY2FzZSB3aWxsIGJlIHRvIGNoZWNrIGFyZ3VtZW50cyBpbiBvcmRlciwgYW5kIHdlIHNwbGljZVxuICAgIC8vIG91dCBhcmd1bWVudHMgd2hlbiB3ZSBjaGVjayB0aGVtLCBtYWtlIGl0IHNvIHdlIHNwbGljZSBvdXQgZnJvbSB0aGUgZW5kXG4gICAgLy8gcmF0aGVyIHRoYW4gdGhlIGJlZ2lubmluZy5cbiAgICB0aGlzLmFyZ3MucmV2ZXJzZSgpO1xuICAgIHRoaXMuZGVzY3JpcHRpb24gPSBkZXNjcmlwdGlvbjtcbiAgfVxuXG4gIGNoZWNraW5nKHZhbHVlKSB7XG4gICAgaWYgKHRoaXMuX2NoZWNraW5nT25lVmFsdWUodmFsdWUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQWxsb3cgY2hlY2soYXJndW1lbnRzLCBbU3RyaW5nXSkgb3IgY2hlY2soYXJndW1lbnRzLnNsaWNlKDEpLCBbU3RyaW5nXSlcbiAgICAvLyBvciBjaGVjayhbZm9vLCBiYXJdLCBbU3RyaW5nXSkgdG8gY291bnQuLi4gYnV0IG9ubHkgaWYgdmFsdWUgd2Fzbid0XG4gICAgLy8gaXRzZWxmIGFuIGFyZ3VtZW50LlxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSB8fCBpc0FyZ3VtZW50cyh2YWx1ZSkpIHtcbiAgICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwodmFsdWUsIHRoaXMuX2NoZWNraW5nT25lVmFsdWUuYmluZCh0aGlzKSk7XG4gICAgfVxuICB9XG5cbiAgX2NoZWNraW5nT25lVmFsdWUodmFsdWUpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYXJncy5sZW5ndGg7ICsraSkge1xuXG4gICAgICAvLyBJcyB0aGlzIHZhbHVlIG9uZSBvZiB0aGUgYXJndW1lbnRzPyAoVGhpcyBjYW4gaGF2ZSBhIGZhbHNlIHBvc2l0aXZlIGlmXG4gICAgICAvLyB0aGUgYXJndW1lbnQgaXMgYW4gaW50ZXJuZWQgcHJpbWl0aXZlLCBidXQgaXQncyBzdGlsbCBhIGdvb2QgZW5vdWdoXG4gICAgICAvLyBjaGVjay4pXG4gICAgICAvLyAoTmFOIGlzIG5vdCA9PT0gdG8gaXRzZWxmLCBzbyB3ZSBoYXZlIHRvIGNoZWNrIHNwZWNpYWxseS4pXG4gICAgICBpZiAodmFsdWUgPT09IHRoaXMuYXJnc1tpXSB8fFxuICAgICAgICAgIChOdW1iZXIuaXNOYU4odmFsdWUpICYmIE51bWJlci5pc05hTih0aGlzLmFyZ3NbaV0pKSkge1xuICAgICAgICB0aGlzLmFyZ3Muc3BsaWNlKGksIDEpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgdGhyb3dVbmxlc3NBbGxBcmd1bWVudHNIYXZlQmVlbkNoZWNrZWQoKSB7XG4gICAgaWYgKHRoaXMuYXJncy5sZW5ndGggPiAwKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBEaWQgbm90IGNoZWNrKCkgYWxsIGFyZ3VtZW50cyBkdXJpbmcgJHt0aGlzLmRlc2NyaXB0aW9ufWApO1xuICB9XG59XG5cbmNvbnN0IF9qc0tleXdvcmRzID0gWydkbycsICdpZicsICdpbicsICdmb3InLCAnbGV0JywgJ25ldycsICd0cnknLCAndmFyJywgJ2Nhc2UnLFxuICAnZWxzZScsICdlbnVtJywgJ2V2YWwnLCAnZmFsc2UnLCAnbnVsbCcsICd0aGlzJywgJ3RydWUnLCAndm9pZCcsICd3aXRoJyxcbiAgJ2JyZWFrJywgJ2NhdGNoJywgJ2NsYXNzJywgJ2NvbnN0JywgJ3N1cGVyJywgJ3Rocm93JywgJ3doaWxlJywgJ3lpZWxkJyxcbiAgJ2RlbGV0ZScsICdleHBvcnQnLCAnaW1wb3J0JywgJ3B1YmxpYycsICdyZXR1cm4nLCAnc3RhdGljJywgJ3N3aXRjaCcsXG4gICd0eXBlb2YnLCAnZGVmYXVsdCcsICdleHRlbmRzJywgJ2ZpbmFsbHknLCAncGFja2FnZScsICdwcml2YXRlJywgJ2NvbnRpbnVlJyxcbiAgJ2RlYnVnZ2VyJywgJ2Z1bmN0aW9uJywgJ2FyZ3VtZW50cycsICdpbnRlcmZhY2UnLCAncHJvdGVjdGVkJywgJ2ltcGxlbWVudHMnLFxuICAnaW5zdGFuY2VvZiddO1xuXG4vLyBBc3N1bWVzIHRoZSBiYXNlIG9mIHBhdGggaXMgYWxyZWFkeSBlc2NhcGVkIHByb3Blcmx5XG4vLyByZXR1cm5zIGtleSArIGJhc2VcbmNvbnN0IF9wcmVwZW5kUGF0aCA9IChrZXksIGJhc2UpID0+IHtcbiAgaWYgKCh0eXBlb2Yga2V5KSA9PT0gJ251bWJlcicgfHwga2V5Lm1hdGNoKC9eWzAtOV0rJC8pKSB7XG4gICAga2V5ID0gYFske2tleX1dYDtcbiAgfSBlbHNlIGlmICgha2V5Lm1hdGNoKC9eW2Etel8kXVswLTlhLXpfJF0qJC9pKSB8fFxuICAgICAgICAgICAgIF9qc0tleXdvcmRzLmluZGV4T2Yoa2V5KSA+PSAwKSB7XG4gICAga2V5ID0gSlNPTi5zdHJpbmdpZnkoW2tleV0pO1xuICB9XG5cbiAgaWYgKGJhc2UgJiYgYmFzZVswXSAhPT0gJ1snKSB7XG4gICAgcmV0dXJuIGAke2tleX0uJHtiYXNlfWA7XG4gIH1cblxuICByZXR1cm4ga2V5ICsgYmFzZTtcbn1cblxuY29uc3QgaXNPYmplY3QgPSB2YWx1ZSA9PiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsO1xuXG5jb25zdCBiYXNlSXNBcmd1bWVudHMgPSBpdGVtID0+XG4gIGlzT2JqZWN0KGl0ZW0pICYmXG4gIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpdGVtKSA9PT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG5cbmNvbnN0IGlzQXJndW1lbnRzID0gYmFzZUlzQXJndW1lbnRzKGZ1bmN0aW9uKCkgeyByZXR1cm4gYXJndW1lbnRzOyB9KCkpID9cbiAgYmFzZUlzQXJndW1lbnRzIDpcbiAgdmFsdWUgPT4gaXNPYmplY3QodmFsdWUpICYmIHR5cGVvZiB2YWx1ZS5jYWxsZWUgPT09ICdmdW5jdGlvbic7XG4iLCIvLyBDb3B5IG9mIGpRdWVyeS5pc1BsYWluT2JqZWN0IGZvciB0aGUgc2VydmVyIHNpZGUgZnJvbSBqUXVlcnkgdjMuMS4xLlxuXG5jb25zdCBjbGFzczJ0eXBlID0ge307XG5cbmNvbnN0IHRvU3RyaW5nID0gY2xhc3MydHlwZS50b1N0cmluZztcblxuY29uc3QgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuY29uc3QgZm5Ub1N0cmluZyA9IGhhc093bi50b1N0cmluZztcblxuY29uc3QgT2JqZWN0RnVuY3Rpb25TdHJpbmcgPSBmblRvU3RyaW5nLmNhbGwoT2JqZWN0KTtcblxuY29uc3QgZ2V0UHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Y7XG5cbmV4cG9ydCBjb25zdCBpc1BsYWluT2JqZWN0ID0gb2JqID0+IHtcbiAgbGV0IHByb3RvO1xuICBsZXQgQ3RvcjtcblxuICAvLyBEZXRlY3Qgb2J2aW91cyBuZWdhdGl2ZXNcbiAgLy8gVXNlIHRvU3RyaW5nIGluc3RlYWQgb2YgalF1ZXJ5LnR5cGUgdG8gY2F0Y2ggaG9zdCBvYmplY3RzXG4gIGlmICghb2JqIHx8IHRvU3RyaW5nLmNhbGwob2JqKSAhPT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcm90byA9IGdldFByb3RvKG9iaik7XG5cbiAgLy8gT2JqZWN0cyB3aXRoIG5vIHByb3RvdHlwZSAoZS5nLiwgYE9iamVjdC5jcmVhdGUoIG51bGwgKWApIGFyZSBwbGFpblxuICBpZiAoIXByb3RvKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBPYmplY3RzIHdpdGggcHJvdG90eXBlIGFyZSBwbGFpbiBpZmYgdGhleSB3ZXJlIGNvbnN0cnVjdGVkIGJ5IGEgZ2xvYmFsIE9iamVjdCBmdW5jdGlvblxuICBDdG9yID0gaGFzT3duLmNhbGwocHJvdG8sICdjb25zdHJ1Y3RvcicpICYmIHByb3RvLmNvbnN0cnVjdG9yO1xuICByZXR1cm4gdHlwZW9mIEN0b3IgPT09ICdmdW5jdGlvbicgJiYgXG4gICAgZm5Ub1N0cmluZy5jYWxsKEN0b3IpID09PSBPYmplY3RGdW5jdGlvblN0cmluZztcbn07XG4iXX0=
