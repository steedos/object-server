(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Base64 = Package.base64.Base64;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var v, EJSON;

var require = meteorInstall({"node_modules":{"meteor":{"ejson":{"ejson.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/ejson/ejson.js                                                                                     //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
module.export({
  EJSON: () => EJSON
});

/**
 * @namespace
 * @summary Namespace for EJSON functions
 */
const EJSON = {}; // Custom type interface definition

/**
 * @class CustomType
 * @instanceName customType
 * @memberOf EJSON
 * @summary The interface that a class must satisfy to be able to become an
 * EJSON custom type via EJSON.addType.
 */

/**
 * @function typeName
 * @memberOf EJSON.CustomType
 * @summary Return the tag used to identify this type.  This must match the
 *          tag used to register this type with
 *          [`EJSON.addType`](#ejson_add_type).
 * @locus Anywhere
 * @instance
 */

/**
 * @function toJSONValue
 * @memberOf EJSON.CustomType
 * @summary Serialize this instance into a JSON-compatible value.
 * @locus Anywhere
 * @instance
 */

/**
 * @function clone
 * @memberOf EJSON.CustomType
 * @summary Return a value `r` such that `this.equals(r)` is true, and
 *          modifications to `r` do not affect `this` and vice versa.
 * @locus Anywhere
 * @instance
 */

/**
 * @function equals
 * @memberOf EJSON.CustomType
 * @summary Return `true` if `other` has a value equal to `this`; `false`
 *          otherwise.
 * @locus Anywhere
 * @param {Object} other Another object to compare this to.
 * @instance
 */

const customTypes = {};

const hasOwn = (obj, prop) => ({}).hasOwnProperty.call(obj, prop);

const isArguments = obj => obj != null && hasOwn(obj, 'callee');

const isInfOrNan = obj => Number.isNaN(obj) || obj === Infinity || obj === -Infinity; // Add a custom type, using a method of your choice to get to and
// from a basic JSON-able representation.  The factory argument
// is a function of JSON-able --> your object
// The type you add must have:
// - A toJSONValue() method, so that Meteor can serialize it
// - a typeName() method, to show how to look it up in our type table.
// It is okay if these methods are monkey-patched on.
// EJSON.clone will use toJSONValue and the given factory to produce
// a clone, but you may specify a method clone() that will be
// used instead.
// Similarly, EJSON.equals will use toJSONValue to make comparisons,
// but you may provide a method equals() instead.

/**
 * @summary Add a custom datatype to EJSON.
 * @locus Anywhere
 * @param {String} name A tag for your custom type; must be unique among
 *                      custom data types defined in your project, and must
 *                      match the result of your type's `typeName` method.
 * @param {Function} factory A function that deserializes a JSON-compatible
 *                           value into an instance of your type.  This should
 *                           match the serialization performed by your
 *                           type's `toJSONValue` method.
 */


EJSON.addType = (name, factory) => {
  if (hasOwn(customTypes, name)) {
    throw new Error(`Type ${name} already present`);
  }

  customTypes[name] = factory;
};

const builtinConverters = [{
  // Date
  matchJSONValue(obj) {
    return hasOwn(obj, '$date') && Object.keys(obj).length === 1;
  },

  matchObject(obj) {
    return obj instanceof Date;
  },

  toJSONValue(obj) {
    return {
      $date: obj.getTime()
    };
  },

  fromJSONValue(obj) {
    return new Date(obj.$date);
  }

}, {
  // RegExp
  matchJSONValue(obj) {
    return hasOwn(obj, '$regexp') && hasOwn(obj, '$flags') && Object.keys(obj).length === 2;
  },

  matchObject(obj) {
    return obj instanceof RegExp;
  },

  toJSONValue(regexp) {
    return {
      $regexp: regexp.source,
      $flags: regexp.flags
    };
  },

  fromJSONValue(obj) {
    // Replaces duplicate / invalid flags.
    return new RegExp(obj.$regexp, obj.$flags // Cut off flags at 50 chars to avoid abusing RegExp for DOS.
    .slice(0, 50).replace(/[^gimuy]/g, '').replace(/(.)(?=.*\1)/g, ''));
  }

}, {
  // NaN, Inf, -Inf. (These are the only objects with typeof !== 'object'
  // which we match.)
  matchJSONValue(obj) {
    return hasOwn(obj, '$InfNaN') && Object.keys(obj).length === 1;
  },

  matchObject: isInfOrNan,

  toJSONValue(obj) {
    let sign;

    if (Number.isNaN(obj)) {
      sign = 0;
    } else if (obj === Infinity) {
      sign = 1;
    } else {
      sign = -1;
    }

    return {
      $InfNaN: sign
    };
  },

  fromJSONValue(obj) {
    return obj.$InfNaN / 0;
  }

}, {
  // Binary
  matchJSONValue(obj) {
    return hasOwn(obj, '$binary') && Object.keys(obj).length === 1;
  },

  matchObject(obj) {
    return typeof Uint8Array !== 'undefined' && obj instanceof Uint8Array || obj && hasOwn(obj, '$Uint8ArrayPolyfill');
  },

  toJSONValue(obj) {
    return {
      $binary: Base64.encode(obj)
    };
  },

  fromJSONValue(obj) {
    return Base64.decode(obj.$binary);
  }

}, {
  // Escaping one level
  matchJSONValue(obj) {
    return hasOwn(obj, '$escape') && Object.keys(obj).length === 1;
  },

  matchObject(obj) {
    let match = false;

    if (obj) {
      const keyCount = Object.keys(obj).length;

      if (keyCount === 1 || keyCount === 2) {
        match = builtinConverters.some(converter => converter.matchJSONValue(obj));
      }
    }

    return match;
  },

  toJSONValue(obj) {
    const newObj = {};
    Object.keys(obj).forEach(key => {
      newObj[key] = EJSON.toJSONValue(obj[key]);
    });
    return {
      $escape: newObj
    };
  },

  fromJSONValue(obj) {
    const newObj = {};
    Object.keys(obj.$escape).forEach(key => {
      newObj[key] = EJSON.fromJSONValue(obj.$escape[key]);
    });
    return newObj;
  }

}, {
  // Custom
  matchJSONValue(obj) {
    return hasOwn(obj, '$type') && hasOwn(obj, '$value') && Object.keys(obj).length === 2;
  },

  matchObject(obj) {
    return EJSON._isCustomType(obj);
  },

  toJSONValue(obj) {
    const jsonValue = Meteor._noYieldsAllowed(() => obj.toJSONValue());

    return {
      $type: obj.typeName(),
      $value: jsonValue
    };
  },

  fromJSONValue(obj) {
    const typeName = obj.$type;

    if (!hasOwn(customTypes, typeName)) {
      throw new Error(`Custom EJSON type ${typeName} is not defined`);
    }

    const converter = customTypes[typeName];
    return Meteor._noYieldsAllowed(() => converter(obj.$value));
  }

}];

EJSON._isCustomType = obj => obj && typeof obj.toJSONValue === 'function' && typeof obj.typeName === 'function' && hasOwn(customTypes, obj.typeName());

EJSON._getTypes = () => customTypes;

EJSON._getConverters = () => builtinConverters; // Either return the JSON-compatible version of the argument, or undefined (if
// the item isn't itself replaceable, but maybe some fields in it are)


const toJSONValueHelper = item => {
  for (let i = 0; i < builtinConverters.length; i++) {
    const converter = builtinConverters[i];

    if (converter.matchObject(item)) {
      return converter.toJSONValue(item);
    }
  }

  return undefined;
}; // for both arrays and objects, in-place modification.


const adjustTypesToJSONValue = obj => {
  // Is it an atom that we need to adjust?
  if (obj === null) {
    return null;
  }

  const maybeChanged = toJSONValueHelper(obj);

  if (maybeChanged !== undefined) {
    return maybeChanged;
  } // Other atoms are unchanged.


  if (typeof obj !== 'object') {
    return obj;
  } // Iterate over array or object structure.


  Object.keys(obj).forEach(key => {
    const value = obj[key];

    if (typeof value !== 'object' && value !== undefined && !isInfOrNan(value)) {
      return; // continue
    }

    const changed = toJSONValueHelper(value);

    if (changed) {
      obj[key] = changed;
      return; // on to the next key
    } // if we get here, value is an object but not adjustable
    // at this level.  recurse.


    adjustTypesToJSONValue(value);
  });
  return obj;
};

EJSON._adjustTypesToJSONValue = adjustTypesToJSONValue;
/**
 * @summary Serialize an EJSON-compatible value into its plain JSON
 *          representation.
 * @locus Anywhere
 * @param {EJSON} val A value to serialize to plain JSON.
 */

EJSON.toJSONValue = item => {
  const changed = toJSONValueHelper(item);

  if (changed !== undefined) {
    return changed;
  }

  let newItem = item;

  if (typeof item === 'object') {
    newItem = EJSON.clone(item);
    adjustTypesToJSONValue(newItem);
  }

  return newItem;
}; // Either return the argument changed to have the non-json
// rep of itself (the Object version) or the argument itself.
// DOES NOT RECURSE.  For actually getting the fully-changed value, use
// EJSON.fromJSONValue


const fromJSONValueHelper = value => {
  if (typeof value === 'object' && value !== null) {
    const keys = Object.keys(value);

    if (keys.length <= 2 && keys.every(k => typeof k === 'string' && k.substr(0, 1) === '$')) {
      for (let i = 0; i < builtinConverters.length; i++) {
        const converter = builtinConverters[i];

        if (converter.matchJSONValue(value)) {
          return converter.fromJSONValue(value);
        }
      }
    }
  }

  return value;
}; // for both arrays and objects. Tries its best to just
// use the object you hand it, but may return something
// different if the object you hand it itself needs changing.


const adjustTypesFromJSONValue = obj => {
  if (obj === null) {
    return null;
  }

  const maybeChanged = fromJSONValueHelper(obj);

  if (maybeChanged !== obj) {
    return maybeChanged;
  } // Other atoms are unchanged.


  if (typeof obj !== 'object') {
    return obj;
  }

  Object.keys(obj).forEach(key => {
    const value = obj[key];

    if (typeof value === 'object') {
      const changed = fromJSONValueHelper(value);

      if (value !== changed) {
        obj[key] = changed;
        return;
      } // if we get here, value is an object but not adjustable
      // at this level.  recurse.


      adjustTypesFromJSONValue(value);
    }
  });
  return obj;
};

EJSON._adjustTypesFromJSONValue = adjustTypesFromJSONValue;
/**
 * @summary Deserialize an EJSON value from its plain JSON representation.
 * @locus Anywhere
 * @param {JSONCompatible} val A value to deserialize into EJSON.
 */

EJSON.fromJSONValue = item => {
  let changed = fromJSONValueHelper(item);

  if (changed === item && typeof item === 'object') {
    changed = EJSON.clone(item);
    adjustTypesFromJSONValue(changed);
  }

  return changed;
};
/**
 * @summary Serialize a value to a string. For EJSON values, the serialization
 *          fully represents the value. For non-EJSON values, serializes the
 *          same way as `JSON.stringify`.
 * @locus Anywhere
 * @param {EJSON} val A value to stringify.
 * @param {Object} [options]
 * @param {Boolean | Integer | String} options.indent Indents objects and
 * arrays for easy readability.  When `true`, indents by 2 spaces; when an
 * integer, indents by that number of spaces; and when a string, uses the
 * string as the indentation pattern.
 * @param {Boolean} options.canonical When `true`, stringifies keys in an
 *                                    object in sorted order.
 */


EJSON.stringify = (item, options) => {
  let serialized;
  const json = EJSON.toJSONValue(item);

  if (options && (options.canonical || options.indent)) {
    let canonicalStringify;
    module.link("./stringify", {
      default(v) {
        canonicalStringify = v;
      }

    }, 0);
    serialized = canonicalStringify(json, options);
  } else {
    serialized = JSON.stringify(json);
  }

  return serialized;
};
/**
 * @summary Parse a string into an EJSON value. Throws an error if the string
 *          is not valid EJSON.
 * @locus Anywhere
 * @param {String} str A string to parse into an EJSON value.
 */


EJSON.parse = item => {
  if (typeof item !== 'string') {
    throw new Error('EJSON.parse argument should be a string');
  }

  return EJSON.fromJSONValue(JSON.parse(item));
};
/**
 * @summary Returns true if `x` is a buffer of binary data, as returned from
 *          [`EJSON.newBinary`](#ejson_new_binary).
 * @param {Object} x The variable to check.
 * @locus Anywhere
 */


EJSON.isBinary = obj => {
  return !!(typeof Uint8Array !== 'undefined' && obj instanceof Uint8Array || obj && obj.$Uint8ArrayPolyfill);
};
/**
 * @summary Return true if `a` and `b` are equal to each other.  Return false
 *          otherwise.  Uses the `equals` method on `a` if present, otherwise
 *          performs a deep comparison.
 * @locus Anywhere
 * @param {EJSON} a
 * @param {EJSON} b
 * @param {Object} [options]
 * @param {Boolean} options.keyOrderSensitive Compare in key sensitive order,
 * if supported by the JavaScript implementation.  For example, `{a: 1, b: 2}`
 * is equal to `{b: 2, a: 1}` only when `keyOrderSensitive` is `false`.  The
 * default is `false`.
 */


EJSON.equals = (a, b, options) => {
  let i;
  const keyOrderSensitive = !!(options && options.keyOrderSensitive);

  if (a === b) {
    return true;
  } // This differs from the IEEE spec for NaN equality, b/c we don't want
  // anything ever with a NaN to be poisoned from becoming equal to anything.


  if (Number.isNaN(a) && Number.isNaN(b)) {
    return true;
  } // if either one is falsy, they'd have to be === to be equal


  if (!a || !b) {
    return false;
  }

  if (!(typeof a === 'object' && typeof b === 'object')) {
    return false;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.valueOf() === b.valueOf();
  }

  if (EJSON.isBinary(a) && EJSON.isBinary(b)) {
    if (a.length !== b.length) {
      return false;
    }

    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }

    return true;
  }

  if (typeof a.equals === 'function') {
    return a.equals(b, options);
  }

  if (typeof b.equals === 'function') {
    return b.equals(a, options);
  }

  if (a instanceof Array) {
    if (!(b instanceof Array)) {
      return false;
    }

    if (a.length !== b.length) {
      return false;
    }

    for (i = 0; i < a.length; i++) {
      if (!EJSON.equals(a[i], b[i], options)) {
        return false;
      }
    }

    return true;
  } // fallback for custom types that don't implement their own equals


  switch (EJSON._isCustomType(a) + EJSON._isCustomType(b)) {
    case 1:
      return false;

    case 2:
      return EJSON.equals(EJSON.toJSONValue(a), EJSON.toJSONValue(b));

    default: // Do nothing

  } // fall back to structural equality of objects


  let ret;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (keyOrderSensitive) {
    i = 0;
    ret = aKeys.every(key => {
      if (i >= bKeys.length) {
        return false;
      }

      if (key !== bKeys[i]) {
        return false;
      }

      if (!EJSON.equals(a[key], b[bKeys[i]], options)) {
        return false;
      }

      i++;
      return true;
    });
  } else {
    i = 0;
    ret = aKeys.every(key => {
      if (!hasOwn(b, key)) {
        return false;
      }

      if (!EJSON.equals(a[key], b[key], options)) {
        return false;
      }

      i++;
      return true;
    });
  }

  return ret && i === bKeys.length;
};
/**
 * @summary Return a deep copy of `val`.
 * @locus Anywhere
 * @param {EJSON} val A value to copy.
 */


EJSON.clone = v => {
  let ret;

  if (typeof v !== 'object') {
    return v;
  }

  if (v === null) {
    return null; // null has typeof "object"
  }

  if (v instanceof Date) {
    return new Date(v.getTime());
  } // RegExps are not really EJSON elements (eg we don't define a serialization
  // for them), but they're immutable anyway, so we can support them in clone.


  if (v instanceof RegExp) {
    return v;
  }

  if (EJSON.isBinary(v)) {
    ret = EJSON.newBinary(v.length);

    for (let i = 0; i < v.length; i++) {
      ret[i] = v[i];
    }

    return ret;
  }

  if (Array.isArray(v)) {
    return v.map(value => EJSON.clone(value));
  }

  if (isArguments(v)) {
    return Array.from(v).map(value => EJSON.clone(value));
  } // handle general user-defined typed Objects if they have a clone method


  if (typeof v.clone === 'function') {
    return v.clone();
  } // handle other custom types


  if (EJSON._isCustomType(v)) {
    return EJSON.fromJSONValue(EJSON.clone(EJSON.toJSONValue(v)), true);
  } // handle other objects


  ret = {};
  Object.keys(v).forEach(key => {
    ret[key] = EJSON.clone(v[key]);
  });
  return ret;
};
/**
 * @summary Allocate a new buffer of binary data that EJSON can serialize.
 * @locus Anywhere
 * @param {Number} size The number of bytes of binary data to allocate.
 */
// EJSON.newBinary is the public documented API for this functionality,
// but the implementation is in the 'base64' package to avoid
// introducing a circular dependency. (If the implementation were here,
// then 'base64' would have to use EJSON.newBinary, and 'ejson' would
// also have to use 'base64'.)


EJSON.newBinary = Base64.newBinary;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"stringify.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/ejson/stringify.js                                                                                 //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
// Based on json2.js from https://github.com/douglascrockford/JSON-js
//
//    json2.js
//    2012-10-08
//
//    Public Domain.
//
//    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
function quote(string) {
  return JSON.stringify(string);
}

const str = (key, holder, singleIndent, outerIndent, canonical) => {
  const value = holder[key]; // What happens next depends on the value's type.

  switch (typeof value) {
    case 'string':
      return quote(value);

    case 'number':
      // JSON numbers must be finite. Encode non-finite numbers as null.
      return isFinite(value) ? String(value) : 'null';

    case 'boolean':
      return String(value);
    // If the type is 'object', we might be dealing with an object or an array or
    // null.

    case 'object':
      // Due to a specification blunder in ECMAScript, typeof null is 'object',
      // so watch out for that case.
      if (!value) {
        return 'null';
      } // Make an array to hold the partial results of stringifying this object
      // value.


      const innerIndent = outerIndent + singleIndent;
      const partial = []; // Is the value an array?

      if (Array.isArray(value) || {}.hasOwnProperty.call(value, 'callee')) {
        // The value is an array. Stringify every element. Use null as a
        // placeholder for non-JSON values.
        const length = value.length;

        for (let i = 0; i < length; i += 1) {
          partial[i] = str(i, value, singleIndent, innerIndent, canonical) || 'null';
        } // Join all of the elements together, separated with commas, and wrap
        // them in brackets.


        let v;

        if (partial.length === 0) {
          v = '[]';
        } else if (innerIndent) {
          v = '[\n' + innerIndent + partial.join(',\n' + innerIndent) + '\n' + outerIndent + ']';
        } else {
          v = '[' + partial.join(',') + ']';
        }

        return v;
      } // Iterate through all of the keys in the object.


      let keys = Object.keys(value);

      if (canonical) {
        keys = keys.sort();
      }

      keys.forEach(k => {
        v = str(k, value, singleIndent, innerIndent, canonical);

        if (v) {
          partial.push(quote(k) + (innerIndent ? ': ' : ':') + v);
        }
      }); // Join all of the member texts together, separated with commas,
      // and wrap them in braces.

      if (partial.length === 0) {
        v = '{}';
      } else if (innerIndent) {
        v = '{\n' + innerIndent + partial.join(',\n' + innerIndent) + '\n' + outerIndent + '}';
      } else {
        v = '{' + partial.join(',') + '}';
      }

      return v;

    default: // Do nothing

  }
}; // If the JSON object does not yet have a stringify method, give it one.


const canonicalStringify = (value, options) => {
  // Make a fake root object containing our value under the key of ''.
  // Return the result of stringifying the value.
  const allOptions = Object.assign({
    indent: '',
    canonical: false
  }, options);

  if (allOptions.indent === true) {
    allOptions.indent = '  ';
  } else if (typeof allOptions.indent === 'number') {
    let newIndent = '';

    for (let i = 0; i < allOptions.indent; i++) {
      newIndent += ' ';
    }

    allOptions.indent = newIndent;
  }

  return str('', {
    '': value
  }, allOptions.indent, '', allOptions.canonical);
};

module.exportDefault(canonicalStringify);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/ejson/ejson.js");

/* Exports */
Package._define("ejson", exports, {
  EJSON: EJSON
});

})();

//# sourceURL=meteor://💻app/packages/ejson.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvZWpzb24vZWpzb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2Vqc29uL3N0cmluZ2lmeS5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJFSlNPTiIsImN1c3RvbVR5cGVzIiwiaGFzT3duIiwib2JqIiwicHJvcCIsImhhc093blByb3BlcnR5IiwiY2FsbCIsImlzQXJndW1lbnRzIiwiaXNJbmZPck5hbiIsIk51bWJlciIsImlzTmFOIiwiSW5maW5pdHkiLCJhZGRUeXBlIiwibmFtZSIsImZhY3RvcnkiLCJFcnJvciIsImJ1aWx0aW5Db252ZXJ0ZXJzIiwibWF0Y2hKU09OVmFsdWUiLCJPYmplY3QiLCJrZXlzIiwibGVuZ3RoIiwibWF0Y2hPYmplY3QiLCJEYXRlIiwidG9KU09OVmFsdWUiLCIkZGF0ZSIsImdldFRpbWUiLCJmcm9tSlNPTlZhbHVlIiwiUmVnRXhwIiwicmVnZXhwIiwiJHJlZ2V4cCIsInNvdXJjZSIsIiRmbGFncyIsImZsYWdzIiwic2xpY2UiLCJyZXBsYWNlIiwic2lnbiIsIiRJbmZOYU4iLCJVaW50OEFycmF5IiwiJGJpbmFyeSIsIkJhc2U2NCIsImVuY29kZSIsImRlY29kZSIsIm1hdGNoIiwia2V5Q291bnQiLCJzb21lIiwiY29udmVydGVyIiwibmV3T2JqIiwiZm9yRWFjaCIsImtleSIsIiRlc2NhcGUiLCJfaXNDdXN0b21UeXBlIiwianNvblZhbHVlIiwiTWV0ZW9yIiwiX25vWWllbGRzQWxsb3dlZCIsIiR0eXBlIiwidHlwZU5hbWUiLCIkdmFsdWUiLCJfZ2V0VHlwZXMiLCJfZ2V0Q29udmVydGVycyIsInRvSlNPTlZhbHVlSGVscGVyIiwiaXRlbSIsImkiLCJ1bmRlZmluZWQiLCJhZGp1c3RUeXBlc1RvSlNPTlZhbHVlIiwibWF5YmVDaGFuZ2VkIiwidmFsdWUiLCJjaGFuZ2VkIiwiX2FkanVzdFR5cGVzVG9KU09OVmFsdWUiLCJuZXdJdGVtIiwiY2xvbmUiLCJmcm9tSlNPTlZhbHVlSGVscGVyIiwiZXZlcnkiLCJrIiwic3Vic3RyIiwiYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlIiwiX2FkanVzdFR5cGVzRnJvbUpTT05WYWx1ZSIsInN0cmluZ2lmeSIsIm9wdGlvbnMiLCJzZXJpYWxpemVkIiwianNvbiIsImNhbm9uaWNhbCIsImluZGVudCIsImNhbm9uaWNhbFN0cmluZ2lmeSIsImxpbmsiLCJkZWZhdWx0IiwidiIsIkpTT04iLCJwYXJzZSIsImlzQmluYXJ5IiwiJFVpbnQ4QXJyYXlQb2x5ZmlsbCIsImVxdWFscyIsImEiLCJiIiwia2V5T3JkZXJTZW5zaXRpdmUiLCJ2YWx1ZU9mIiwiQXJyYXkiLCJyZXQiLCJhS2V5cyIsImJLZXlzIiwibmV3QmluYXJ5IiwiaXNBcnJheSIsIm1hcCIsImZyb20iLCJxdW90ZSIsInN0cmluZyIsInN0ciIsImhvbGRlciIsInNpbmdsZUluZGVudCIsIm91dGVySW5kZW50IiwiaXNGaW5pdGUiLCJTdHJpbmciLCJpbm5lckluZGVudCIsInBhcnRpYWwiLCJqb2luIiwic29ydCIsInB1c2giLCJhbGxPcHRpb25zIiwiYXNzaWduIiwibmV3SW5kZW50IiwiZXhwb3J0RGVmYXVsdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsTUFBTSxDQUFDQyxNQUFQLENBQWM7QUFBQ0MsT0FBSyxFQUFDLE1BQUlBO0FBQVgsQ0FBZDs7QUFBQTs7OztBQUlBLE1BQU1BLEtBQUssR0FBRyxFQUFkLEMsQ0FFQTs7QUFDQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7OztBQVVBOzs7Ozs7OztBQVFBOzs7Ozs7Ozs7QUFTQTs7Ozs7Ozs7OztBQVVBLE1BQU1DLFdBQVcsR0FBRyxFQUFwQjs7QUFFQSxNQUFNQyxNQUFNLEdBQUcsQ0FBQ0MsR0FBRCxFQUFNQyxJQUFOLEtBQWUsQ0FBQyxFQUFELEVBQUtDLGNBQUwsQ0FBb0JDLElBQXBCLENBQXlCSCxHQUF6QixFQUE4QkMsSUFBOUIsQ0FBOUI7O0FBRUEsTUFBTUcsV0FB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ckdBbEYsTUFBTSxDQUFDeUgsYUFBUCxDQXdIZXJDLGtCQXhIZixFIiwiZmlsZSI6Ii9wYWNrYWdlcy9lanNvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5hbWVzcGFjZVxuICogQHN1bW1hcnkgTmFtZXNwYWNlIGZvciBFSlNPTiBmdW5jdGlvbnNcbiAqL1xuY29uc3QgRUpTT04gPSB7fTtcblxuLy8gQ3VzdG9tIHR5cGUgaW50ZXJmYWNlIGRlZmluaXRpb25cbi8qKlxuICogQGNsYXNzIEN1c3RvbVR5cGVcbiAqIEBpbnN0YW5jZU5hbWUgY3VzdG9tVHlwZVxuICogQG1lbWJlck9mIEVKU09OXG4gKiBAc3VtbWFyeSBUaGUgaW50ZXJmYWNlIHRoYXQgYSBjbGFzcyBtdXN0IHNhdGlzZnkgdG8gYmUgYWJsZSB0byBiZWNvbWUgYW5cbiAqIEVKU09OIGN1c3RvbSB0eXBlIHZpYSBFSlNPTi5hZGRUeXBlLlxuICovXG5cbi8qKlxuICogQGZ1bmN0aW9uIHR5cGVOYW1lXG4gKiBAbWVtYmVyT2YgRUpTT04uQ3VzdG9tVHlwZVxuICogQHN1bW1hcnkgUmV0dXJuIHRoZSB0YWcgdXNlZCB0byBpZGVudGlmeSB0aGlzIHR5cGUuICBUaGlzIG11c3QgbWF0Y2ggdGhlXG4gKiAgICAgICAgICB0YWcgdXNlZCB0byByZWdpc3RlciB0aGlzIHR5cGUgd2l0aFxuICogICAgICAgICAgW2BFSlNPTi5hZGRUeXBlYF0oI2Vqc29uX2FkZF90eXBlKS5cbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQGluc3RhbmNlXG4gKi9cblxuLyoqXG4gKiBAZnVuY3Rpb24gdG9KU09OVmFsdWVcbiAqIEBtZW1iZXJPZiBFSlNPTi5DdXN0b21UeXBlXG4gKiBAc3VtbWFyeSBTZXJpYWxpemUgdGhpcyBpbnN0YW5jZSBpbnRvIGEgSlNPTi1jb21wYXRpYmxlIHZhbHVlLlxuICogQGxvY3VzIEFueXdoZXJlXG4gKiBAaW5zdGFuY2VcbiAqL1xuXG4vKipcbiAqIEBmdW5jdGlvbiBjbG9uZVxuICogQG1lbWJlck9mIEVKU09OLkN1c3RvbVR5cGVcbiAqIEBzdW1tYXJ5IFJldHVybiBhIHZhbHVlIGByYCBzdWNoIHRoYXQgYHRoaXMuZXF1YWxzKHIpYCBpcyB0cnVlLCBhbmRcbiAqICAgICAgICAgIG1vZGlmaWNhdGlvbnMgdG8gYHJgIGRvIG5vdCBhZmZlY3QgYHRoaXNgIGFuZCB2aWNlIHZlcnNhLlxuICogQGxvY3VzIEFueXdoZXJlXG4gKiBAaW5zdGFuY2VcbiAqL1xuXG4vKipcbiAqIEBmdW5jdGlvbiBlcXVhbHNcbiAqIEBtZW1iZXJPZiBFSlNPTi5DdXN0b21UeXBlXG4gKiBAc3VtbWFyeSBSZXR1cm4gYHRydWVgIGlmIGBvdGhlcmAgaGFzIGEgdmFsdWUgZXF1YWwgdG8gYHRoaXNgOyBgZmFsc2VgXG4gKiAgICAgICAgICBvdGhlcndpc2UuXG4gKiBAbG9jdXMgQW55d2hlcmVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvdGhlciBBbm90aGVyIG9iamVjdCB0byBjb21wYXJlIHRoaXMgdG8uXG4gKiBAaW5zdGFuY2VcbiAqL1xuXG5jb25zdCBjdXN0b21UeXBlcyA9IHt9O1xuXG5jb25zdCBoYXNPd24gPSAob2JqLCBwcm9wKSA9PiAoe30pLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcblxuY29uc3QgaXNBcmd1bWVudHMgPSBvYmogPT4gb2JqICE9IG51bGwgJiYgaGFzT3duKG9iaiwgJ2NhbGxlZScpO1xuXG5jb25zdCBpc0luZk9yTmFuID1cbiAgb2JqID0+IE51bWJlci5pc05hTihvYmopIHx8IG9iaiA9PT0gSW5maW5pdHkgfHwgb2JqID09PSAtSW5maW5pdHk7XG5cbi8vIEFkZCBhIGN1c3RvbSB0eXBlLCB1c2luZyBhIG1ldGhvZCBvZiB5b3VyIGNob2ljZSB0byBnZXQgdG8gYW5kXG4vLyBmcm9tIGEgYmFzaWMgSlNPTi1hYmxlIHJlcHJlc2VudGF0aW9uLiAgVGhlIGZhY3RvcnkgYXJndW1lbnRcbi8vIGlzIGEgZnVuY3Rpb24gb2YgSlNPTi1hYmxlIC0tPiB5b3VyIG9iamVjdFxuLy8gVGhlIHR5cGUgeW91IGFkZCBtdXN0IGhhdmU6XG4vLyAtIEEgdG9KU09OVmFsdWUoKSBtZXRob2QsIHNvIHRoYXQgTWV0ZW9yIGNhbiBzZXJpYWxpemUgaXRcbi8vIC0gYSB0eXBlTmFtZSgpIG1ldGhvZCwgdG8gc2hvdyBob3cgdG8gbG9vayBpdCB1cCBpbiBvdXIgdHlwZSB0YWJsZS5cbi8vIEl0IGlzIG9rYXkgaWYgdGhlc2UgbWV0aG9kcyBhcmUgbW9ua2V5LXBhdGNoZWQgb24uXG4vLyBFSlNPTi5jbG9uZSB3aWxsIHVzZSB0b0pTT05WYWx1ZSBhbmQgdGhlIGdpdmVuIGZhY3RvcnkgdG8gcHJvZHVjZVxuLy8gYSBjbG9uZSwgYnV0IHlvdSBtYXkgc3BlY2lmeSBhIG1ldGhvZCBjbG9uZSgpIHRoYXQgd2lsbCBiZVxuLy8gdXNlZCBpbnN0ZWFkLlxuLy8gU2ltaWxhcmx5LCBFSlNPTi5lcXVhbHMgd2lsbCB1c2UgdG9KU09OVmFsdWUgdG8gbWFrZSBjb21wYXJpc29ucyxcbi8vIGJ1dCB5b3UgbWF5IHByb3ZpZGUgYSBtZXRob2QgZXF1YWxzKCkgaW5zdGVhZC5cbi8qKlxuICogQHN1bW1hcnkgQWRkIGEgY3VzdG9tIGRhdGF0eXBlIHRvIEVKU09OLlxuICogQGxvY3VzIEFueXdoZXJlXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBBIHRhZyBmb3IgeW91ciBjdXN0b20gdHlwZTsgbXVzdCBiZSB1bmlxdWUgYW1vbmdcbiAqICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbSBkYXRhIHR5cGVzIGRlZmluZWQgaW4geW91ciBwcm9qZWN0LCBhbmQgbXVzdFxuICogICAgICAgICAgICAgICAgICAgICAgbWF0Y2ggdGhlIHJlc3VsdCBvZiB5b3VyIHR5cGUncyBgdHlwZU5hbWVgIG1ldGhvZC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZhY3RvcnkgQSBmdW5jdGlvbiB0aGF0IGRlc2VyaWFsaXplcyBhIEpTT04tY29tcGF0aWJsZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSBpbnRvIGFuIGluc3RhbmNlIG9mIHlvdXIgdHlwZS4gIFRoaXMgc2hvdWxkXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoIHRoZSBzZXJpYWxpemF0aW9uIHBlcmZvcm1lZCBieSB5b3VyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUncyBgdG9KU09OVmFsdWVgIG1ldGhvZC5cbiAqL1xuRUpTT04uYWRkVHlwZSA9IChuYW1lLCBmYWN0b3J5KSA9PiB7XG4gIGlmIChoYXNPd24oY3VzdG9tVHlwZXMsIG5hbWUpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBUeXBlICR7bmFtZX0gYWxyZWFkeSBwcmVzZW50YCk7XG4gIH1cbiAgY3VzdG9tVHlwZXNbbmFtZV0gPSBmYWN0b3J5O1xufTtcblxuY29uc3QgYnVpbHRpbkNvbnZlcnRlcnMgPSBbXG4gIHsgLy8gRGF0ZVxuICAgIG1hdGNoSlNPTlZhbHVlKG9iaikge1xuICAgICAgcmV0dXJuIGhhc093bihvYmosICckZGF0ZScpICYmIE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAxO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Qob2JqKSB7XG4gICAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgRGF0ZTtcbiAgICB9LFxuICAgIHRvSlNPTlZhbHVlKG9iaikge1xuICAgICAgcmV0dXJuIHskZGF0ZTogb2JqLmdldFRpbWUoKX07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlKG9iaikge1xuICAgICAgcmV0dXJuIG5ldyBEYXRlKG9iai4kZGF0ZSk7XG4gICAgfSxcbiAgfSxcbiAgeyAvLyBSZWdFeHBcbiAgICBtYXRjaEpTT05WYWx1ZShvYmopIHtcbiAgICAgIHJldHVybiBoYXNPd24ob2JqLCAnJHJlZ2V4cCcpXG4gICAgICAgICYmIGhhc093bihvYmosICckZmxhZ3MnKVxuICAgICAgICAmJiBPYmplY3Qua2V5cyhvYmopLmxlbmd0aCA9PT0gMjtcbiAgICB9LFxuICAgIG1hdGNoT2JqZWN0KG9iaikge1xuICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIFJlZ0V4cDtcbiAgICB9LFxuICAgIHRvSlNPTlZhbHVlKHJlZ2V4cCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgJHJlZ2V4cDogcmVnZXhwLnNvdXJjZSxcbiAgICAgICAgJGZsYWdzOiByZWdleHAuZmxhZ3NcbiAgICAgIH07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlKG9iaikge1xuICAgICAgLy8gUmVwbGFjZXMgZHVwbGljYXRlIC8gaW52YWxpZCBmbGFncy5cbiAgICAgIHJldHVybiBuZXcgUmVnRXhwKFxuICAgICAgICBvYmouJHJlZ2V4cCxcbiAgICAgICAgb2JqLiRmbGFnc1xuICAgICAgICAgIC8vIEN1dCBvZmYgZmxhZ3MgYXQgNTAgY2hhcnMgdG8gYXZvaWQgYWJ1c2luZyBSZWdFeHAgZm9yIERPUy5cbiAgICAgICAgICAuc2xpY2UoMCwgNTApXG4gICAgICAgICAgLnJlcGxhY2UoL1teZ2ltdXldL2csJycpXG4gICAgICAgICAgLnJlcGxhY2UoLyguKSg/PS4qXFwxKS9nLCAnJylcbiAgICAgICk7XG4gICAgfSxcbiAgfSxcbiAgeyAvLyBOYU4sIEluZiwgLUluZi4gKFRoZXNlIGFyZSB0aGUgb25seSBvYmplY3RzIHdpdGggdHlwZW9mICE9PSAnb2JqZWN0J1xuICAgIC8vIHdoaWNoIHdlIG1hdGNoLilcbiAgICBtYXRjaEpTT05WYWx1ZShvYmopIHtcbiAgICAgIHJldHVybiBoYXNPd24ob2JqLCAnJEluZk5hTicpICYmIE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAxO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Q6IGlzSW5mT3JOYW4sXG4gICAgdG9KU09OVmFsdWUob2JqKSB7XG4gICAgICBsZXQgc2lnbjtcbiAgICAgIGlmIChOdW1iZXIuaXNOYU4ob2JqKSkge1xuICAgICAgICBzaWduID0gMDtcbiAgICAgIH0gZWxzZSBpZiAob2JqID09PSBJbmZpbml0eSkge1xuICAgICAgICBzaWduID0gMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNpZ24gPSAtMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7JEluZk5hTjogc2lnbn07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlKG9iaikge1xuICAgICAgcmV0dXJuIG9iai4kSW5mTmFOIC8gMDtcbiAgICB9LFxuICB9LFxuICB7IC8vIEJpbmFyeVxuICAgIG1hdGNoSlNPTlZhbHVlKG9iaikge1xuICAgICAgcmV0dXJuIGhhc093bihvYmosICckYmluYXJ5JykgJiYgT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPT09IDE7XG4gICAgfSxcbiAgICBtYXRjaE9iamVjdChvYmopIHtcbiAgICAgIHJldHVybiB0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcgJiYgb2JqIGluc3RhbmNlb2YgVWludDhBcnJheVxuICAgICAgICB8fCAob2JqICYmIGhhc093bihvYmosICckVWludDhBcnJheVBvbHlmaWxsJykpO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWUob2JqKSB7XG4gICAgICByZXR1cm4geyRiaW5hcnk6IEJhc2U2NC5lbmNvZGUob2JqKX07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlKG9iaikge1xuICAgICAgcmV0dXJuIEJhc2U2NC5kZWNvZGUob2JqLiRiaW5hcnkpO1xuICAgIH0sXG4gIH0sXG4gIHsgLy8gRXNjYXBpbmcgb25lIGxldmVsXG4gICAgbWF0Y2hKU09OVmFsdWUob2JqKSB7XG4gICAgICByZXR1cm4gaGFzT3duKG9iaiwgJyRlc2NhcGUnKSAmJiBPYmplY3Qua2V5cyhvYmopLmxlbmd0aCA9PT0gMTtcbiAgICB9LFxuICAgIG1hdGNoT2JqZWN0KG9iaikge1xuICAgICAgbGV0IG1hdGNoID0gZmFsc2U7XG4gICAgICBpZiAob2JqKSB7XG4gICAgICAgIGNvbnN0IGtleUNvdW50ID0gT2JqZWN0LmtleXMob2JqKS5sZW5ndGg7XG4gICAgICAgIGlmIChrZXlDb3VudCA9PT0gMSB8fCBrZXlDb3VudCA9PT0gMikge1xuICAgICAgICAgIG1hdGNoID1cbiAgICAgICAgICAgIGJ1aWx0aW5Db252ZXJ0ZXJzLnNvbWUoY29udmVydGVyID0+IGNvbnZlcnRlci5tYXRjaEpTT05WYWx1ZShvYmopKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWUob2JqKSB7XG4gICAgICBjb25zdCBuZXdPYmogPSB7fTtcbiAgICAgIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICBuZXdPYmpba2V5XSA9IEVKU09OLnRvSlNPTlZhbHVlKG9ialtrZXldKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHskZXNjYXBlOiBuZXdPYmp9O1xuICAgIH0sXG4gICAgZnJvbUpTT05WYWx1ZShvYmopIHtcbiAgICAgIGNvbnN0IG5ld09iaiA9IHt9O1xuICAgICAgT2JqZWN0LmtleXMob2JqLiRlc2NhcGUpLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgbmV3T2JqW2tleV0gPSBFSlNPTi5mcm9tSlNPTlZhbHVlKG9iai4kZXNjYXBlW2tleV0pO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gbmV3T2JqO1xuICAgIH0sXG4gIH0sXG4gIHsgLy8gQ3VzdG9tXG4gICAgbWF0Y2hKU09OVmFsdWUob2JqKSB7XG4gICAgICByZXR1cm4gaGFzT3duKG9iaiwgJyR0eXBlJylcbiAgICAgICAgJiYgaGFzT3duKG9iaiwgJyR2YWx1ZScpICYmIE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAyO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Qob2JqKSB7XG4gICAgICByZXR1cm4gRUpTT04uX2lzQ3VzdG9tVHlwZShvYmopO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWUob2JqKSB7XG4gICAgICBjb25zdCBqc29uVmFsdWUgPSBNZXRlb3IuX25vWWllbGRzQWxsb3dlZCgoKSA9PiBvYmoudG9KU09OVmFsdWUoKSk7XG4gICAgICByZXR1cm4geyR0eXBlOiBvYmoudHlwZU5hbWUoKSwgJHZhbHVlOiBqc29uVmFsdWV9O1xuICAgIH0sXG4gICAgZnJvbUpTT05WYWx1ZShvYmopIHtcbiAgICAgIGNvbnN0IHR5cGVOYW1lID0gb2JqLiR0eXBlO1xuICAgICAgaWYgKCFoYXNPd24oY3VzdG9tVHlwZXMsIHR5cGVOYW1lKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEN1c3RvbSBFSlNPTiB0eXBlICR7dHlwZU5hbWV9IGlzIG5vdCBkZWZpbmVkYCk7XG4gICAgICB9XG4gICAgICBjb25zdCBjb252ZXJ0ZXIgPSBjdXN0b21UeXBlc1t0eXBlTmFtZV07XG4gICAgICByZXR1cm4gTWV0ZW9yLl9ub1lpZWxkc0FsbG93ZWQoKCkgPT4gY29udmVydGVyKG9iai4kdmFsdWUpKTtcbiAgICB9LFxuICB9LFxuXTtcblxuRUpTT04uX2lzQ3VzdG9tVHlwZSA9IChvYmopID0+IChcbiAgb2JqICYmXG4gIHR5cGVvZiBvYmoudG9KU09OVmFsdWUgPT09ICdmdW5jdGlvbicgJiZcbiAgdHlwZW9mIG9iai50eXBlTmFtZSA9PT0gJ2Z1bmN0aW9uJyAmJlxuICBoYXNPd24oY3VzdG9tVHlwZXMsIG9iai50eXBlTmFtZSgpKVxuKTtcblxuRUpTT04uX2dldFR5cGVzID0gKCkgPT4gY3VzdG9tVHlwZXM7XG5cbkVKU09OLl9nZXRDb252ZXJ0ZXJzID0gKCkgPT4gYnVpbHRpbkNvbnZlcnRlcnM7XG5cbi8vIEVpdGhlciByZXR1cm4gdGhlIEpTT04tY29tcGF0aWJsZSB2ZXJzaW9uIG9mIHRoZSBhcmd1bWVudCwgb3IgdW5kZWZpbmVkIChpZlxuLy8gdGhlIGl0ZW0gaXNuJ3QgaXRzZWxmIHJlcGxhY2VhYmxlLCBidXQgbWF5YmUgc29tZSBmaWVsZHMgaW4gaXQgYXJlKVxuY29uc3QgdG9KU09OVmFsdWVIZWxwZXIgPSBpdGVtID0+IHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBidWlsdGluQ29udmVydGVycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGNvbnZlcnRlciA9IGJ1aWx0aW5Db252ZXJ0ZXJzW2ldO1xuICAgIGlmIChjb252ZXJ0ZXIubWF0Y2hPYmplY3QoaXRlbSkpIHtcbiAgICAgIHJldHVybiBjb252ZXJ0ZXIudG9KU09OVmFsdWUoaXRlbSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59O1xuXG4vLyBmb3IgYm90aCBhcnJheXMgYW5kIG9iamVjdHMsIGluLXBsYWNlIG1vZGlmaWNhdGlvbi5cbmNvbnN0IGFkanVzdFR5cGVzVG9KU09OVmFsdWUgPSBvYmogPT4ge1xuICAvLyBJcyBpdCBhbiBhdG9tIHRoYXQgd2UgbmVlZCB0byBhZGp1c3Q/XG4gIGlmIChvYmogPT09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IG1heWJlQ2hhbmdlZCA9IHRvSlNPTlZhbHVlSGVscGVyKG9iaik7XG4gIGlmIChtYXliZUNoYW5nZWQgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBtYXliZUNoYW5nZWQ7XG4gIH1cblxuICAvLyBPdGhlciBhdG9tcyBhcmUgdW5jaGFuZ2VkLlxuICBpZiAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gb2JqO1xuICB9XG5cbiAgLy8gSXRlcmF0ZSBvdmVyIGFycmF5IG9yIG9iamVjdCBzdHJ1Y3R1cmUuXG4gIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChrZXkgPT4ge1xuICAgIGNvbnN0IHZhbHVlID0gb2JqW2tleV07XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAhaXNJbmZPck5hbih2YWx1ZSkpIHtcbiAgICAgIHJldHVybjsgLy8gY29udGludWVcbiAgICB9XG5cbiAgICBjb25zdCBjaGFuZ2VkID0gdG9KU09OVmFsdWVIZWxwZXIodmFsdWUpO1xuICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICBvYmpba2V5XSA9IGNoYW5nZWQ7XG4gICAgICByZXR1cm47IC8vIG9uIHRvIHRoZSBuZXh0IGtleVxuICAgIH1cbiAgICAvLyBpZiB3ZSBnZXQgaGVyZSwgdmFsdWUgaXMgYW4gb2JqZWN0IGJ1dCBub3QgYWRqdXN0YWJsZVxuICAgIC8vIGF0IHRoaXMgbGV2ZWwuICByZWN1cnNlLlxuICAgIGFkanVzdFR5cGVzVG9KU09OVmFsdWUodmFsdWUpO1xuICB9KTtcbiAgcmV0dXJuIG9iajtcbn07XG5cbkVKU09OLl9hZGp1c3RUeXBlc1RvSlNPTlZhbHVlID0gYWRqdXN0VHlwZXNUb0pTT05WYWx1ZTtcblxuLyoqXG4gKiBAc3VtbWFyeSBTZXJpYWxpemUgYW4gRUpTT04tY29tcGF0aWJsZSB2YWx1ZSBpbnRvIGl0cyBwbGFpbiBKU09OXG4gKiAgICAgICAgICByZXByZXNlbnRhdGlvbi5cbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQHBhcmFtIHtFSlNPTn0gdmFsIEEgdmFsdWUgdG8gc2VyaWFsaXplIHRvIHBsYWluIEpTT04uXG4gKi9cbkVKU09OLnRvSlNPTlZhbHVlID0gaXRlbSA9PiB7XG4gIGNvbnN0IGNoYW5nZWQgPSB0b0pTT05WYWx1ZUhlbHBlcihpdGVtKTtcbiAgaWYgKGNoYW5nZWQgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBjaGFuZ2VkO1xuICB9XG5cbiAgbGV0IG5ld0l0ZW0gPSBpdGVtO1xuICBpZiAodHlwZW9mIGl0ZW0gPT09ICdvYmplY3QnKSB7XG4gICAgbmV3SXRlbSA9IEVKU09OLmNsb25lKGl0ZW0pO1xuICAgIGFkanVzdFR5cGVzVG9KU09OVmFsdWUobmV3SXRlbSk7XG4gIH1cbiAgcmV0dXJuIG5ld0l0ZW07XG59O1xuXG4vLyBFaXRoZXIgcmV0dXJuIHRoZSBhcmd1bWVudCBjaGFuZ2VkIHRvIGhhdmUgdGhlIG5vbi1qc29uXG4vLyByZXAgb2YgaXRzZWxmICh0aGUgT2JqZWN0IHZlcnNpb24pIG9yIHRoZSBhcmd1bWVudCBpdHNlbGYuXG4vLyBET0VTIE5PVCBSRUNVUlNFLiAgRm9yIGFjdHVhbGx5IGdldHRpbmcgdGhlIGZ1bGx5LWNoYW5nZWQgdmFsdWUsIHVzZVxuLy8gRUpTT04uZnJvbUpTT05WYWx1ZVxuY29uc3QgZnJvbUpTT05WYWx1ZUhlbHBlciA9IHZhbHVlID0+IHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICAgIGlmIChrZXlzLmxlbmd0aCA8PSAyXG4gICAgICAgICYmIGtleXMuZXZlcnkoayA9PiB0eXBlb2YgayA9PT0gJ3N0cmluZycgJiYgay5zdWJzdHIoMCwgMSkgPT09ICckJykpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYnVpbHRpbkNvbnZlcnRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY29udmVydGVyID0gYnVpbHRpbkNvbnZlcnRlcnNbaV07XG4gICAgICAgIGlmIChjb252ZXJ0ZXIubWF0Y2hKU09OVmFsdWUodmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnZlcnRlci5mcm9tSlNPTlZhbHVlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWU7XG59O1xuXG4vLyBmb3IgYm90aCBhcnJheXMgYW5kIG9iamVjdHMuIFRyaWVzIGl0cyBiZXN0IHRvIGp1c3Rcbi8vIHVzZSB0aGUgb2JqZWN0IHlvdSBoYW5kIGl0LCBidXQgbWF5IHJldHVybiBzb21ldGhpbmdcbi8vIGRpZmZlcmVudCBpZiB0aGUgb2JqZWN0IHlvdSBoYW5kIGl0IGl0c2VsZiBuZWVkcyBjaGFuZ2luZy5cbmNvbnN0IGFkanVzdFR5cGVzRnJvbUpTT05WYWx1ZSA9IG9iaiA9PiB7XG4gIGlmIChvYmogPT09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IG1heWJlQ2hhbmdlZCA9IGZyb21KU09OVmFsdWVIZWxwZXIob2JqKTtcbiAgaWYgKG1heWJlQ2hhbmdlZCAhPT0gb2JqKSB7XG4gICAgcmV0dXJuIG1heWJlQ2hhbmdlZDtcbiAgfVxuXG4gIC8vIE90aGVyIGF0b21zIGFyZSB1bmNoYW5nZWQuXG4gIGlmICh0eXBlb2Ygb2JqICE9PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBvYmo7XG4gIH1cblxuICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goa2V5ID0+IHtcbiAgICBjb25zdCB2YWx1ZSA9IG9ialtrZXldO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICBjb25zdCBjaGFuZ2VkID0gZnJvbUpTT05WYWx1ZUhlbHBlcih2YWx1ZSk7XG4gICAgICBpZiAodmFsdWUgIT09IGNoYW5nZWQpIHtcbiAgICAgICAgb2JqW2tleV0gPSBjaGFuZ2VkO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICAvLyBpZiB3ZSBnZXQgaGVyZSwgdmFsdWUgaXMgYW4gb2JqZWN0IGJ1dCBub3QgYWRqdXN0YWJsZVxuICAgICAgLy8gYXQgdGhpcyBsZXZlbC4gIHJlY3Vyc2UuXG4gICAgICBhZGp1c3RUeXBlc0Zyb21KU09OVmFsdWUodmFsdWUpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvYmo7XG59O1xuXG5FSlNPTi5fYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlID0gYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlO1xuXG4vKipcbiAqIEBzdW1tYXJ5IERlc2VyaWFsaXplIGFuIEVKU09OIHZhbHVlIGZyb20gaXRzIHBsYWluIEpTT04gcmVwcmVzZW50YXRpb24uXG4gKiBAbG9jdXMgQW55d2hlcmVcbiAqIEBwYXJhbSB7SlNPTkNvbXBhdGlibGV9IHZhbCBBIHZhbHVlIHRvIGRlc2VyaWFsaXplIGludG8gRUpTT04uXG4gKi9cbkVKU09OLmZyb21KU09OVmFsdWUgPSBpdGVtID0+IHtcbiAgbGV0IGNoYW5nZWQgPSBmcm9tSlNPTlZhbHVlSGVscGVyKGl0ZW0pO1xuICBpZiAoY2hhbmdlZCA9PT0gaXRlbSAmJiB0eXBlb2YgaXRlbSA9PT0gJ29iamVjdCcpIHtcbiAgICBjaGFuZ2VkID0gRUpTT04uY2xvbmUoaXRlbSk7XG4gICAgYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlKGNoYW5nZWQpO1xuICB9XG4gIHJldHVybiBjaGFuZ2VkO1xufTtcblxuLyoqXG4gKiBAc3VtbWFyeSBTZXJpYWxpemUgYSB2YWx1ZSB0byBhIHN0cmluZy4gRm9yIEVKU09OIHZhbHVlcywgdGhlIHNlcmlhbGl6YXRpb25cbiAqICAgICAgICAgIGZ1bGx5IHJlcHJlc2VudHMgdGhlIHZhbHVlLiBGb3Igbm9uLUVKU09OIHZhbHVlcywgc2VyaWFsaXplcyB0aGVcbiAqICAgICAgICAgIHNhbWUgd2F5IGFzIGBKU09OLnN0cmluZ2lmeWAuXG4gKiBAbG9jdXMgQW55d2hlcmVcbiAqIEBwYXJhbSB7RUpTT059IHZhbCBBIHZhbHVlIHRvIHN0cmluZ2lmeS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEBwYXJhbSB7Qm9vbGVhbiB8IEludGVnZXIgfCBTdHJpbmd9IG9wdGlvbnMuaW5kZW50IEluZGVudHMgb2JqZWN0cyBhbmRcbiAqIGFycmF5cyBmb3IgZWFzeSByZWFkYWJpbGl0eS4gIFdoZW4gYHRydWVgLCBpbmRlbnRzIGJ5IDIgc3BhY2VzOyB3aGVuIGFuXG4gKiBpbnRlZ2VyLCBpbmRlbnRzIGJ5IHRoYXQgbnVtYmVyIG9mIHNwYWNlczsgYW5kIHdoZW4gYSBzdHJpbmcsIHVzZXMgdGhlXG4gKiBzdHJpbmcgYXMgdGhlIGluZGVudGF0aW9uIHBhdHRlcm4uXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9wdGlvbnMuY2Fub25pY2FsIFdoZW4gYHRydWVgLCBzdHJpbmdpZmllcyBrZXlzIGluIGFuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdCBpbiBzb3J0ZWQgb3JkZXIuXG4gKi9cbkVKU09OLnN0cmluZ2lmeSA9IChpdGVtLCBvcHRpb25zKSA9PiB7XG4gIGxldCBzZXJpYWxpemVkO1xuICBjb25zdCBqc29uID0gRUpTT04udG9KU09OVmFsdWUoaXRlbSk7XG4gIGlmIChvcHRpb25zICYmIChvcHRpb25zLmNhbm9uaWNhbCB8fCBvcHRpb25zLmluZGVudCkpIHtcbiAgICBpbXBvcnQgY2Fub25pY2FsU3RyaW5naWZ5IGZyb20gJy4vc3RyaW5naWZ5JztcbiAgICBzZXJpYWxpemVkID0gY2Fub25pY2FsU3RyaW5naWZ5KGpzb24sIG9wdGlvbnMpO1xuICB9IGVsc2Uge1xuICAgIHNlcmlhbGl6ZWQgPSBKU09OLnN0cmluZ2lmeShqc29uKTtcbiAgfVxuICByZXR1cm4gc2VyaWFsaXplZDtcbn07XG5cbi8qKlxuICogQHN1bW1hcnkgUGFyc2UgYSBzdHJpbmcgaW50byBhbiBFSlNPTiB2YWx1ZS4gVGhyb3dzIGFuIGVycm9yIGlmIHRoZSBzdHJpbmdcbiAqICAgICAgICAgIGlzIG5vdCB2YWxpZCBFSlNPTi5cbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQHBhcmFtIHtTdHJpbmd9IHN0ciBBIHN0cmluZyB0byBwYXJzZSBpbnRvIGFuIEVKU09OIHZhbHVlLlxuICovXG5FSlNPTi5wYXJzZSA9IGl0ZW0gPT4ge1xuICBpZiAodHlwZW9mIGl0ZW0gIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdFSlNPTi5wYXJzZSBhcmd1bWVudCBzaG91bGQgYmUgYSBzdHJpbmcnKTtcbiAgfVxuICByZXR1cm4gRUpTT04uZnJvbUpTT05WYWx1ZShKU09OLnBhcnNlKGl0ZW0pKTtcbn07XG5cbi8qKlxuICogQHN1bW1hcnkgUmV0dXJucyB0cnVlIGlmIGB4YCBpcyBhIGJ1ZmZlciBvZiBiaW5hcnkgZGF0YSwgYXMgcmV0dXJuZWQgZnJvbVxuICogICAgICAgICAgW2BFSlNPTi5uZXdCaW5hcnlgXSgjZWpzb25fbmV3X2JpbmFyeSkuXG4gKiBAcGFyYW0ge09iamVjdH0geCBUaGUgdmFyaWFibGUgdG8gY2hlY2suXG4gKiBAbG9jdXMgQW55d2hlcmVcbiAqL1xuRUpTT04uaXNCaW5hcnkgPSBvYmogPT4ge1xuICByZXR1cm4gISEoKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJyAmJiBvYmogaW5zdGFuY2VvZiBVaW50OEFycmF5KSB8fFxuICAgIChvYmogJiYgb2JqLiRVaW50OEFycmF5UG9seWZpbGwpKTtcbn07XG5cbi8qKlxuICogQHN1bW1hcnkgUmV0dXJuIHRydWUgaWYgYGFgIGFuZCBgYmAgYXJlIGVxdWFsIHRvIGVhY2ggb3RoZXIuICBSZXR1cm4gZmFsc2VcbiAqICAgICAgICAgIG90aGVyd2lzZS4gIFVzZXMgdGhlIGBlcXVhbHNgIG1ldGhvZCBvbiBgYWAgaWYgcHJlc2VudCwgb3RoZXJ3aXNlXG4gKiAgICAgICAgICBwZXJmb3JtcyBhIGRlZXAgY29tcGFyaXNvbi5cbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQHBhcmFtIHtFSlNPTn0gYVxuICogQHBhcmFtIHtFSlNPTn0gYlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtCb29sZWFufSBvcHRpb25zLmtleU9yZGVyU2Vuc2l0aXZlIENvbXBhcmUgaW4ga2V5IHNlbnNpdGl2ZSBvcmRlcixcbiAqIGlmIHN1cHBvcnRlZCBieSB0aGUgSmF2YVNjcmlwdCBpbXBsZW1lbnRhdGlvbi4gIEZvciBleGFtcGxlLCBge2E6IDEsIGI6IDJ9YFxuICogaXMgZXF1YWwgdG8gYHtiOiAyLCBhOiAxfWAgb25seSB3aGVuIGBrZXlPcmRlclNlbnNpdGl2ZWAgaXMgYGZhbHNlYC4gIFRoZVxuICogZGVmYXVsdCBpcyBgZmFsc2VgLlxuICovXG5FSlNPTi5lcXVhbHMgPSAoYSwgYiwgb3B0aW9ucykgPT4ge1xuICBsZXQgaTtcbiAgY29uc3Qga2V5T3JkZXJTZW5zaXRpdmUgPSAhIShvcHRpb25zICYmIG9wdGlvbnMua2V5T3JkZXJTZW5zaXRpdmUpO1xuICBpZiAoYSA9PT0gYikge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gVGhpcyBkaWZmZXJzIGZyb20gdGhlIElFRUUgc3BlYyBmb3IgTmFOIGVxdWFsaXR5LCBiL2Mgd2UgZG9uJ3Qgd2FudFxuICAvLyBhbnl0aGluZyBldmVyIHdpdGggYSBOYU4gdG8gYmUgcG9pc29uZWQgZnJvbSBiZWNvbWluZyBlcXVhbCB0byBhbnl0aGluZy5cbiAgaWYgKE51bWJlci5pc05hTihhKSAmJiBOdW1iZXIuaXNOYU4oYikpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIGlmIGVpdGhlciBvbmUgaXMgZmFsc3ksIHRoZXknZCBoYXZlIHRvIGJlID09PSB0byBiZSBlcXVhbFxuICBpZiAoIWEgfHwgIWIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoISh0eXBlb2YgYSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIGIgPT09ICdvYmplY3QnKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChhIGluc3RhbmNlb2YgRGF0ZSAmJiBiIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgIHJldHVybiBhLnZhbHVlT2YoKSA9PT0gYi52YWx1ZU9mKCk7XG4gIH1cblxuICBpZiAoRUpTT04uaXNCaW5hcnkoYSkgJiYgRUpTT04uaXNCaW5hcnkoYikpIHtcbiAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKHR5cGVvZiAoYS5lcXVhbHMpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGEuZXF1YWxzKGIsIG9wdGlvbnMpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiAoYi5lcXVhbHMpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGIuZXF1YWxzKGEsIG9wdGlvbnMpO1xuICB9XG5cbiAgaWYgKGEgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIGlmICghKGIgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKCFFSlNPTi5lcXVhbHMoYVtpXSwgYltpXSwgb3B0aW9ucykpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIGZhbGxiYWNrIGZvciBjdXN0b20gdHlwZXMgdGhhdCBkb24ndCBpbXBsZW1lbnQgdGhlaXIgb3duIGVxdWFsc1xuICBzd2l0Y2ggKEVKU09OLl9pc0N1c3RvbVR5cGUoYSkgKyBFSlNPTi5faXNDdXN0b21UeXBlKGIpKSB7XG4gICAgY2FzZSAxOiByZXR1cm4gZmFsc2U7XG4gICAgY2FzZSAyOiByZXR1cm4gRUpTT04uZXF1YWxzKEVKU09OLnRvSlNPTlZhbHVlKGEpLCBFSlNPTi50b0pTT05WYWx1ZShiKSk7XG4gICAgZGVmYXVsdDogLy8gRG8gbm90aGluZ1xuICB9XG5cbiAgLy8gZmFsbCBiYWNrIHRvIHN0cnVjdHVyYWwgZXF1YWxpdHkgb2Ygb2JqZWN0c1xuICBsZXQgcmV0O1xuICBjb25zdCBhS2V5cyA9IE9iamVjdC5rZXlzKGEpO1xuICBjb25zdCBiS2V5cyA9IE9iamVjdC5rZXlzKGIpO1xuICBpZiAoa2V5T3JkZXJTZW5zaXRpdmUpIHtcbiAgICBpID0gMDtcbiAgICByZXQgPSBhS2V5cy5ldmVyeShrZXkgPT4ge1xuICAgICAgaWYgKGkgPj0gYktleXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChrZXkgIT09IGJLZXlzW2ldKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICghRUpTT04uZXF1YWxzKGFba2V5XSwgYltiS2V5c1tpXV0sIG9wdGlvbnMpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGkgPSAwO1xuICAgIHJldCA9IGFLZXlzLmV2ZXJ5KGtleSA9PiB7XG4gICAgICBpZiAoIWhhc093bihiLCBrZXkpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICghRUpTT04uZXF1YWxzKGFba2V5XSwgYltrZXldLCBvcHRpb25zKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gcmV0ICYmIGkgPT09IGJLZXlzLmxlbmd0aDtcbn07XG5cbi8qKlxuICogQHN1bW1hcnkgUmV0dXJuIGEgZGVlcCBjb3B5IG9mIGB2YWxgLlxuICogQGxvY3VzIEFueXdoZXJlXG4gKiBAcGFyYW0ge0VKU09OfSB2YWwgQSB2YWx1ZSB0byBjb3B5LlxuICovXG5FSlNPTi5jbG9uZSA9IHYgPT4ge1xuICBsZXQgcmV0O1xuICBpZiAodHlwZW9mIHYgIT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIHY7XG4gIH1cblxuICBpZiAodiA9PT0gbnVsbCkge1xuICAgIHJldHVybiBudWxsOyAvLyBudWxsIGhhcyB0eXBlb2YgXCJvYmplY3RcIlxuICB9XG5cbiAgaWYgKHYgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKHYuZ2V0VGltZSgpKTtcbiAgfVxuXG4gIC8vIFJlZ0V4cHMgYXJlIG5vdCByZWFsbHkgRUpTT04gZWxlbWVudHMgKGVnIHdlIGRvbid0IGRlZmluZSBhIHNlcmlhbGl6YXRpb25cbiAgLy8gZm9yIHRoZW0pLCBidXQgdGhleSdyZSBpbW11dGFibGUgYW55d2F5LCBzbyB3ZSBjYW4gc3VwcG9ydCB0aGVtIGluIGNsb25lLlxuICBpZiAodiBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgIHJldHVybiB2O1xuICB9XG5cbiAgaWYgKEVKU09OLmlzQmluYXJ5KHYpKSB7XG4gICAgcmV0ID0gRUpTT04ubmV3QmluYXJ5KHYubGVuZ3RoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHYubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJldFtpXSA9IHZbaV07XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheSh2KSkge1xuICAgIHJldHVybiB2Lm1hcCh2YWx1ZSA9PiBFSlNPTi5jbG9uZSh2YWx1ZSkpO1xuICB9XG5cbiAgaWYgKGlzQXJndW1lbnRzKHYpKSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odikubWFwKHZhbHVlID0+IEVKU09OLmNsb25lKHZhbHVlKSk7XG4gIH1cblxuICAvLyBoYW5kbGUgZ2VuZXJhbCB1c2VyLWRlZmluZWQgdHlwZWQgT2JqZWN0cyBpZiB0aGV5IGhhdmUgYSBjbG9uZSBtZXRob2RcbiAgaWYgKHR5cGVvZiB2LmNsb25lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIHYuY2xvbmUoKTtcbiAgfVxuXG4gIC8vIGhhbmRsZSBvdGhlciBjdXN0b20gdHlwZXNcbiAgaWYgKEVKU09OLl9pc0N1c3RvbVR5cGUodikpIHtcbiAgICByZXR1cm4gRUpTT04uZnJvbUpTT05WYWx1ZShFSlNPTi5jbG9uZShFSlNPTi50b0pTT05WYWx1ZSh2KSksIHRydWUpO1xuICB9XG5cbiAgLy8gaGFuZGxlIG90aGVyIG9iamVjdHNcbiAgcmV0ID0ge307XG4gIE9iamVjdC5rZXlzKHYpLmZvckVhY2goKGtleSkgPT4ge1xuICAgIHJldFtrZXldID0gRUpTT04uY2xvbmUodltrZXldKTtcbiAgfSk7XG4gIHJldHVybiByZXQ7XG59O1xuXG4vKipcbiAqIEBzdW1tYXJ5IEFsbG9jYXRlIGEgbmV3IGJ1ZmZlciBvZiBiaW5hcnkgZGF0YSB0aGF0IEVKU09OIGNhbiBzZXJpYWxpemUuXG4gKiBAbG9jdXMgQW55d2hlcmVcbiAqIEBwYXJhbSB7TnVtYmVyfSBzaXplIFRoZSBudW1iZXIgb2YgYnl0ZXMgb2YgYmluYXJ5IGRhdGEgdG8gYWxsb2NhdGUuXG4gKi9cbi8vIEVKU09OLm5ld0JpbmFyeSBpcyB0aGUgcHVibGljIGRvY3VtZW50ZWQgQVBJIGZvciB0aGlzIGZ1bmN0aW9uYWxpdHksXG4vLyBidXQgdGhlIGltcGxlbWVudGF0aW9uIGlzIGluIHRoZSAnYmFzZTY0JyBwYWNrYWdlIHRvIGF2b2lkXG4vLyBpbnRyb2R1Y2luZyBhIGNpcmN1bGFyIGRlcGVuZGVuY3kuIChJZiB0aGUgaW1wbGVtZW50YXRpb24gd2VyZSBoZXJlLFxuLy8gdGhlbiAnYmFzZTY0JyB3b3VsZCBoYXZlIHRvIHVzZSBFSlNPTi5uZXdCaW5hcnksIGFuZCAnZWpzb24nIHdvdWxkXG4vLyBhbHNvIGhhdmUgdG8gdXNlICdiYXNlNjQnLilcbkVKU09OLm5ld0JpbmFyeSA9IEJhc2U2NC5uZXdCaW5hcnk7XG5cbmV4cG9ydCB7IEVKU09OIH07XG4iLCIvLyBCYXNlZCBvbiBqc29uMi5qcyBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9kb3VnbGFzY3JvY2tmb3JkL0pTT04tanNcbi8vXG4vLyAgICBqc29uMi5qc1xuLy8gICAgMjAxMi0xMC0wOFxuLy9cbi8vICAgIFB1YmxpYyBEb21haW4uXG4vL1xuLy8gICAgTk8gV0FSUkFOVFkgRVhQUkVTU0VEIE9SIElNUExJRUQuIFVTRSBBVCBZT1VSIE9XTiBSSVNLLlxuXG5mdW5jdGlvbiBxdW90ZShzdHJpbmcpIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHN0cmluZyk7XG59XG5cbmNvbnN0IHN0ciA9IChrZXksIGhvbGRlciwgc2luZ2xlSW5kZW50LCBvdXRlckluZGVudCwgY2Fub25pY2FsKSA9PiB7XG4gIGNvbnN0IHZhbHVlID0gaG9sZGVyW2tleV07XG5cbiAgLy8gV2hhdCBoYXBwZW5zIG5leHQgZGVwZW5kcyBvbiB0aGUgdmFsdWUncyB0eXBlLlxuICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICBjYXNlICdzdHJpbmcnOlxuICAgIHJldHVybiBxdW90ZSh2YWx1ZSk7XG4gIGNhc2UgJ251bWJlcic6XG4gICAgLy8gSlNPTiBudW1iZXJzIG11c3QgYmUgZmluaXRlLiBFbmNvZGUgbm9uLWZpbml0ZSBudW1iZXJzIGFzIG51bGwuXG4gICAgcmV0dXJuIGlzRmluaXRlKHZhbHVlKSA/IFN0cmluZyh2YWx1ZSkgOiAnbnVsbCc7XG4gIGNhc2UgJ2Jvb2xlYW4nOlxuICAgIHJldHVybiBTdHJpbmcodmFsdWUpO1xuICAvLyBJZiB0aGUgdHlwZSBpcyAnb2JqZWN0Jywgd2UgbWlnaHQgYmUgZGVhbGluZyB3aXRoIGFuIG9iamVjdCBvciBhbiBhcnJheSBvclxuICAvLyBudWxsLlxuICBjYXNlICdvYmplY3QnOlxuICAgIC8vIER1ZSB0byBhIHNwZWNpZmljYXRpb24gYmx1bmRlciBpbiBFQ01BU2NyaXB0LCB0eXBlb2YgbnVsbCBpcyAnb2JqZWN0JyxcbiAgICAvLyBzbyB3YXRjaCBvdXQgZm9yIHRoYXQgY2FzZS5cbiAgICBpZiAoIXZhbHVlKSB7XG4gICAgICByZXR1cm4gJ251bGwnO1xuICAgIH1cbiAgICAvLyBNYWtlIGFuIGFycmF5IHRvIGhvbGQgdGhlIHBhcnRpYWwgcmVzdWx0cyBvZiBzdHJpbmdpZnlpbmcgdGhpcyBvYmplY3RcbiAgICAvLyB2YWx1ZS5cbiAgICBjb25zdCBpbm5lckluZGVudCA9IG91dGVySW5kZW50ICsgc2luZ2xlSW5kZW50O1xuICAgIGNvbnN0IHBhcnRpYWwgPSBbXTtcblxuICAgIC8vIElzIHRoZSB2YWx1ZSBhbiBhcnJheT9cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgfHwgKHt9KS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCAnY2FsbGVlJykpIHtcbiAgICAgIC8vIFRoZSB2YWx1ZSBpcyBhbiBhcnJheS4gU3RyaW5naWZ5IGV2ZXJ5IGVsZW1lbnQuIFVzZSBudWxsIGFzIGFcbiAgICAgIC8vIHBsYWNlaG9sZGVyIGZvciBub24tSlNPTiB2YWx1ZXMuXG4gICAgICBjb25zdCBsZW5ndGggPSB2YWx1ZS5sZW5ndGg7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHBhcnRpYWxbaV0gPVxuICAgICAgICAgIHN0cihpLCB2YWx1ZSwgc2luZ2xlSW5kZW50LCBpbm5lckluZGVudCwgY2Fub25pY2FsKSB8fCAnbnVsbCc7XG4gICAgICB9XG5cbiAgICAgIC8vIEpvaW4gYWxsIG9mIHRoZSBlbGVtZW50cyB0b2dldGhlciwgc2VwYXJhdGVkIHdpdGggY29tbWFzLCBhbmQgd3JhcFxuICAgICAgLy8gdGhlbSBpbiBicmFja2V0cy5cbiAgICAgIGxldCB2O1xuICAgICAgaWYgKHBhcnRpYWwubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHYgPSAnW10nO1xuICAgICAgfSBlbHNlIGlmIChpbm5lckluZGVudCkge1xuICAgICAgICB2ID0gJ1tcXG4nICtcbiAgICAgICAgICBpbm5lckluZGVudCArXG4gICAgICAgICAgcGFydGlhbC5qb2luKCcsXFxuJyArXG4gICAgICAgICAgaW5uZXJJbmRlbnQpICtcbiAgICAgICAgICAnXFxuJyArXG4gICAgICAgICAgb3V0ZXJJbmRlbnQgK1xuICAgICAgICAgICddJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHYgPSAnWycgKyBwYXJ0aWFsLmpvaW4oJywnKSArICddJztcbiAgICAgIH1cbiAgICAgIHJldHVybiB2O1xuICAgIH1cblxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBhbGwgb2YgdGhlIGtleXMgaW4gdGhlIG9iamVjdC5cbiAgICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgICBpZiAoY2Fub25pY2FsKSB7XG4gICAgICBrZXlzID0ga2V5cy5zb3J0KCk7XG4gICAgfVxuICAgIGtleXMuZm9yRWFjaChrID0+IHtcbiAgICAgIHYgPSBzdHIoaywgdmFsdWUsIHNpbmdsZUluZGVudCwgaW5uZXJJbmRlbnQsIGNhbm9uaWNhbCk7XG4gICAgICBpZiAodikge1xuICAgICAgICBwYXJ0aWFsLnB1c2gocXVvdGUoaykgKyAoaW5uZXJJbmRlbnQgPyAnOiAnIDogJzonKSArIHYpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gSm9pbiBhbGwgb2YgdGhlIG1lbWJlciB0ZXh0cyB0b2dldGhlciwgc2VwYXJhdGVkIHdpdGggY29tbWFzLFxuICAgIC8vIGFuZCB3cmFwIHRoZW0gaW4gYnJhY2VzLlxuICAgIGlmIChwYXJ0aWFsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdiA9ICd7fSc7XG4gICAgfSBlbHNlIGlmIChpbm5lckluZGVudCkge1xuICAgICAgdiA9ICd7XFxuJyArXG4gICAgICAgIGlubmVySW5kZW50ICtcbiAgICAgICAgcGFydGlhbC5qb2luKCcsXFxuJyArXG4gICAgICAgIGlubmVySW5kZW50KSArXG4gICAgICAgICdcXG4nICtcbiAgICAgICAgb3V0ZXJJbmRlbnQgK1xuICAgICAgICAnfSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHYgPSAneycgKyBwYXJ0aWFsLmpvaW4oJywnKSArICd9JztcbiAgICB9XG4gICAgcmV0dXJuIHY7XG5cbiAgZGVmYXVsdDogLy8gRG8gbm90aGluZ1xuICB9XG59O1xuXG4vLyBJZiB0aGUgSlNPTiBvYmplY3QgZG9lcyBub3QgeWV0IGhhdmUgYSBzdHJpbmdpZnkgbWV0aG9kLCBnaXZlIGl0IG9uZS5cbmNvbnN0IGNhbm9uaWNhbFN0cmluZ2lmeSA9ICh2YWx1ZSwgb3B0aW9ucykgPT4ge1xuICAvLyBNYWtlIGEgZmFrZSByb290IG9iamVjdCBjb250YWluaW5nIG91ciB2YWx1ZSB1bmRlciB0aGUga2V5IG9mICcnLlxuICAvLyBSZXR1cm4gdGhlIHJlc3VsdCBvZiBzdHJpbmdpZnlpbmcgdGhlIHZhbHVlLlxuICBjb25zdCBhbGxPcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgaW5kZW50OiAnJyxcbiAgICBjYW5vbmljYWw6IGZhbHNlLFxuICB9LCBvcHRpb25zKTtcbiAgaWYgKGFsbE9wdGlvbnMuaW5kZW50ID09PSB0cnVlKSB7XG4gICAgYWxsT3B0aW9ucy5pbmRlbnQgPSAnICAnO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBhbGxPcHRpb25zLmluZGVudCA9PT0gJ251bWJlcicpIHtcbiAgICBsZXQgbmV3SW5kZW50ID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhbGxPcHRpb25zLmluZGVudDsgaSsrKSB7XG4gICAgICBuZXdJbmRlbnQgKz0gJyAnO1xuICAgIH1cbiAgICBhbGxPcHRpb25zLmluZGVudCA9IG5ld0luZGVudDtcbiAgfVxuICByZXR1cm4gc3RyKCcnLCB7Jyc6IHZhbHVlfSwgYWxsT3B0aW9ucy5pbmRlbnQsICcnLCBhbGxPcHRpb25zLmNhbm9uaWNhbCk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjYW5vbmljYWxTdHJpbmdpZnk7XG4iXX0=
