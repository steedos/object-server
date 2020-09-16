(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var EJSON = Package.ejson.EJSON;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var value, ReactiveDict;

var require = meteorInstall({"node_modules":{"meteor":{"reactive-dict":{"migration.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/reactive-dict/migration.js                                                                           //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
module.export({
  ReactiveDict: () => ReactiveDict
});
let ReactiveDict;
module.link("./reactive-dict", {
  ReactiveDict(v) {
    ReactiveDict = v;
  }

}, 0);
const hasOwn = Object.prototype.hasOwnProperty;
ReactiveDict._migratedDictData = {}; // name -> data

ReactiveDict._dictsToMigrate = {}; // name -> ReactiveDict

ReactiveDict._loadMigratedDict = function (dictName) {
  if (hasOwn.call(ReactiveDict._migratedDictData, dictName)) {
    const data = ReactiveDict._migratedDictData[dictName];
    delete ReactiveDict._migratedDictData[dictName];
    return data;
  }

  return null;
};

ReactiveDict._registerDictForMigrate = function (dictName, dict) {
  if (hasOwn.call(ReactiveDict._dictsToMigrate, dictName)) throw new Error("Duplicate ReactiveDict name: " + dictName);
  ReactiveDict._dictsToMigrate[dictName] = dict;
};

if (Meteor.isClient && Package.reload) {
  // Put old migrated data into ReactiveDict._migratedDictData,
  // where it can be accessed by ReactiveDict._loadMigratedDict.
  var migrationData = Package.reload.Reload._migrationData('reactive-dict');

  if (migrationData && migrationData.dicts) ReactiveDict._migratedDictData = migrationData.dicts; // On migration, assemble the data from all the dicts that have been
  // registered.

  Package.reload.Reload._onMigrate('reactive-dict', function () {
    var dictsToMigrate = ReactiveDict._dictsToMigrate;
    var dataToMigrate = {};

    for (var dictName in dictsToMigrate) dataToMigrate[dictName] = dictsToMigrate[dictName]._getMigrationData();

    return [true, {
      dicts: dataToMigrate
    }];
  });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"reactive-dict.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/reactive-dict/reactive-dict.js                                                                       //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
module.export({
  ReactiveDict: () => ReactiveDict
});
const hasOwn = Object.prototype.hasOwnProperty; // XXX come up with a serialization method which canonicalizes object key
// order, which would allow us to use objects as values for equals.

function stringify(value) {
  if (value === undefined) {
    return 'undefined';
  }

  return EJSON.stringify(value);
}

function parse(serialized) {
  if (serialized === undefined || serialized === 'undefined') {
    return undefined;
  }

  return EJSON.parse(serialized);
}

function changed(v) {
  v && v.changed();
} // XXX COMPAT WITH 0.9.1 : accept migrationData instead of dictName


class ReactiveDict {
  constructor(dictName, dictData) {
    // this.keys: key -> value
    this.keys = {};

    if (dictName) {
      // name given; migration will be performed
      if (typeof dictName === 'string') {
        // the normal case, argument is a string name.
        // Only run migration logic on client, it will cause
        // duplicate name errors on server during reloads.
        // _registerDictForMigrate will throw an error on duplicate name.
        Meteor.isClient && ReactiveDict._registerDictForMigrate(dictName, this);

        const migratedData = Meteor.isClient && ReactiveDict._loadMigratedDict(dictName);

        if (migratedData) {
          // Don't stringify migrated data
          this.keys = migratedData;
        } else {
          // Use _setObject to make sure values are stringified
          this._setObject(dictData || {});
        }

        this.name = dictName;
      } else if (typeof dictName === 'object') {
        // back-compat case: dictName is actually migrationData
        // Use _setObject to make sure values are stringified
        this._setObject(dictName);
      } else {
        throw new Error("Invalid ReactiveDict argument: " + dictName);
      }
    } else if (typeof dictData === 'object') {
      this._setObject(dictData);
    }

    this.allDeps = new Tracker.Dependency();
    this.keyDeps = {}; // key -> Dependency

    this.keyValueDeps = {}; // key -> Dependency
  } // set() began as a key/value method, but we are now overloading it
  // to take an object of key/value pairs, similar to backbone
  // http://backbonejs.org/#Model-set


  set(keyOrObject, value) {
    if (typeof keyOrObject === 'object' && value === undefined) {
      // Called as `dict.set({...})`
      this._setObject(keyOrObject);

      return;
    } // the input isn't an object, so it must be a key
    // and we resume with the rest of the function


    const key = keyOrObject;
    value = stringify(value);
    const keyExisted = hasOwn.call(this.keys, key);
    const oldSerializedValue = keyExisted ? this.keys[key] : 'undefined';
    const isNewValue = value !== oldSerializedValue;
    this.keys[key] = value;

    if (isNewValue || !keyExisted) {
      // Using the changed utility function here because this.allDeps might not exist yet,
      // when setting initial data from constructor
      changed(this.allDeps);
    } // Don't trigger changes when setting initial data from constructor,
    // this.KeyDeps is undefined in this case


    if (isNewValue && this.keyDeps) {
      changed(this.keyDeps[key]);

      if (this.keyValueDeps[key]) {
        changed(this.keyValueDeps[key][oldSerializedValue]);
        changed(this.keyValueDeps[key][value]);
      }
    }
  }

  setDefault(keyOrObject, value) {
    if (typeof keyOrObject === 'object' && value === undefined) {
      // Called as `dict.setDefault({...})`
      this._setDefaultObject(keyOrObject);

      return;
    } // the input isn't an object, so it must be a key
    // and we resume with the rest of the function


    const key = keyOrObject;

    if (!hasOwn.call(this.keys, key)) {
      this.set(key, value);
    }
  }

  get(key) {
    this._ensureKey(key);

    this.keyDeps[key].depend();
    return parse(this.keys[key]);
  }

  equals(key, value) {
    // Mongo.ObjectID is in the 'mongo' package
    let ObjectID = null;

    if (Package.mongo) {
      ObjectID = Package.mongo.Mongo.ObjectID;
    } // We don't allow objects (or arrays that might include objects) for
    // .equals, because JSON.stringify doesn't canonicalize object key
    // order. (We can make equals have the right return value by parsing the
    // current value and using EJSON.equals, but we won't have a canonical
    // element of keyValueDeps[key] to store the dependency.) You can still use
    // "EJSON.equals(reactiveDict.get(key), value)".
    //
    // XXX we could allow arrays as long as we recursively check that there
    // are no objects


    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean' && typeof value !== 'undefined' && !(value instanceof Date) && !(ObjectID && value instanceof ObjectID) && value !== null) {
      throw new Error("ReactiveDict.equals: value must be scalar");
    }

    const serializedValue = stringify(value);

    if (Tracker.active) {
      this._ensureKey(key);

      if (!hasOwn.call(this.keyValueDeps[key], serializedValue)) {
        this.keyValueDeps[key][serializedValue] = new Tracker.Dependency();
      }

      var isNew = this.keyValueDeps[key][serializedValue].depend();

      if (isNew) {
        Tracker.onInvalidate(() => {
          // clean up [key][serializedValue] if it's now empty, so we don't
          // use O(n) memory for n = values seen ever
          if (!this.keyValueDeps[key][serializedValue].hasDependents()) {
            delete this.keyValueDeps[key][serializedValue];
          }
        });
      }
    }

    let oldValue = undefined;

    if (hasOwn.call(this.keys, key)) {
      oldValue = parse(this.keys[key]);
    }

    return EJSON.equals(oldValue, value);
  }

  all() {
    this.allDeps.depend();
    let ret = {};
    Object.keys(this.keys).forEach(key => {
      ret[key] = parse(this.keys[key]);
    });
    return ret;
  }

  clear() {
    const oldKeys = this.keys;
    this.keys = {};
    this.allDeps.changed();
    Object.keys(oldKeys).forEach(key => {
      changed(this.keyDeps[key]);

      if (this.keyValueDeps[key]) {
        changed(this.keyValueDeps[key][oldKeys[key]]);
        changed(this.keyValueDeps[key]['undefined']);
      }
    });
  }

  delete(key) {
    let didRemove = false;

    if (hasOwn.call(this.keys, key)) {
      const oldValue = this.keys[key];
      delete this.keys[key];
      changed(this.keyDeps[key]);

      if (this.keyValueDeps[key]) {
        changed(this.keyValueDeps[key][oldValue]);
        changed(this.keyValueDeps[key]['undefined']);
      }

      this.allDeps.changed();
      didRemove = true;
    }

    return didRemove;
  }

  destroy() {
    this.clear();

    if (this.name && hasOwn.call(ReactiveDict._dictsToMigrate, this.name)) {
      delete ReactiveDict._dictsToMigrate[this.name];
    }
  }

  _setObject(object) {
    Object.keys(object).forEach(key => {
      this.set(key, object[key]);
    });
  }

  _setDefaultObject(object) {
    Object.keys(object).forEach(key => {
      this.setDefault(key, object[key]);
    });
  }

  _ensureKey(key) {
    if (!(key in this.keyDeps)) {
      this.keyDeps[key] = new Tracker.Dependency();
      this.keyValueDeps[key] = {};
    }
  } // Get a JSON value that can be passed to the constructor to
  // create a new ReactiveDict with the same contents as this one


  _getMigrationData() {
    // XXX sanitize and make sure it's JSONible?
    return this.keys;
  }

}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/reactive-dict/migration.js");

/* Exports */
Package._define("reactive-dict", exports, {
  ReactiveDict: ReactiveDict
});

})();

//# sourceURL=meteor://💻app/packages/reactive-dict.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcmVhY3RpdmUtZGljdC9taWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JlYWN0aXZlLWRpY3QvcmVhY3RpdmUtZGljdC5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJSZWFjdGl2ZURpY3QiLCJsaW5rIiwidiIsImhhc093biIsIk9iamVjdCIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiX21pZ3JhdGVkRGljdERhdGEiLCJfZGljdHNUb01pZ3JhdGUiLCJfbG9hZE1pZ3JhdGVkRGljdCIsImRpY3ROYW1lIiwiY2FsbCIsImRhdGEiLCJfcmVnaXN0ZXJEaWN0Rm9yTWlncmF0ZSIsImRpY3QiLCJFcnJvciIsIk1ldGVvciIsImlzQ2xpZW50IiwiUGFja2FnZSIsInJlbG9hZCIsIm1pZ3JhdGlvbkRhdGEiLCJSZWxvYWQiLCJfbWlncmF0aW9uRGF0YSIsImRpY3RzIiwiX29uTWlncmF0ZSIsImRpY3RzVG9NaWdyYXRlIiwiZGF0YVRvTWlncmF0ZSIsIl9nZXRNaWdyYXRpb25EYXRhIiwic3RyaW5naWZ5IiwidmFsdWUiLCJ1bmRlZmluZWQiLCJFSlNPTiIsInBhcnNlIiwic2VyaWFsaXplZCIsImNoYW5nZWQiLCJjb25zdHJ1Y3RvciIsImRpY3REYXRhIiwia2V5cyIsIm1pZ3JhdGVkRGF0YSIsIl9zZXRPYmplY3QiLCJuYW1lIiwiYWxsRGVwcyIsIlRyYWNrZXIiLCJEZXBlbmRlbmN5Iiwia2V5RGVwcyIsImtleVZhbHVlRGVwcyIsInNldCIsImtleU9yT2JqZWN0Iiwia2V5Iiwia2V5RXhpc3RlZCIsIm9sZFNlcmlhbGl6ZWRWYWx1ZSIsImlzTmV3VmFsdWUiLCJzZXREZWZhdWx0IiwiX3NldERlZmF1bHRPYmplY3QiLCJnZXQiLCJfZW5zdXJlS2V5IiwiZGVwZW5kIiwiZXF1YWxzIiwiT2JqZWN0SUQiLCJtb25nbyIsIk1vbmdvIiwiRGF0ZSIsInNlcmlhbGl6ZWRWYWx1ZSIsImFjdGl2ZSIsImlzTmV3Iiwib25JbnZhbGlkYXRlIiwiaGFzRGVwZW5kZW50cyIsIm9sZFZhbHVlIiwiYWxsIiwicmV0IiwiZm9yRWFjaCIsImNsZWFyIiwib2xkS2V5cyIsImRlbGV0ZSIsImRpZFJlbW92ZSIsImRlc3Ryb3kiLCJvYmplY3QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsTUFBTSxDQUFDQyxNQUFQLENBQWM7QUFBQ0MsY0FBWSxFQUFDLE1BQUlBO0FBQWxCLENBQWQ7QUFBK0MsSUFBSUEsWUFBSjtBQUFpQkYsTUFBTSxDQUFDRyxJQUFQLENBQVksaUJBQVosRUFBOEI7QUFBQ0QsY0FBWSxDQUFDRSxDQUFELEVBQUc7QUFBQ0YsZ0JBQVksR0FBQ0UsQ0FBYjtBQUFlOztBQUFoQyxDQUE5QixFQUFnRSxDQUFoRTtBQUVoRSxNQUFNQyxNQUFNLEdBQUdDLE1BQU0sQ0FBQ0MsU0FBUCxDQUFpQkMsY0FBaEM7QUFFQU4sWUFBWSxDQUFDTyxpQkFBYixHQUFpQyxFQUFqQyxDLENBQXFDOztBQUNyQ1AsWUFBWSxDQUFDUSxlQUFiLEdBQStCLEVBQS9CLEMsQ0FBbUM7O0FBRW5DUixZQUFZLENBQUNTLGlCQUFiLEdBQWlDLFVBQVVDLFFBQVYsRUFBb0I7QUFDbkQsTUFBSVAsTUFBTSxDQUFDUSxJQUFQLENBQVlYLFlBQVksQ0FBQ08saUJBQXpCLEVBQTRDRyxRQUE1QyxDQUFKLEVBQTJEO0FBQ3pELFVBQU1FLElBQUksR0FBR1osWUFBWSxDQUFDTyxpQkFBYixDQUErQkcsUUFBL0IsQ0FBYjtBQUNBLFdBQU9WLFlBQVksQ0FBQ08saUJBQWIsQ0FBK0JHLFFBQS9CLENBQVA7QUFDQSxXQUFPRSxJQUFQO0FBQ0Q7O0FBRUQsU0FBTyxJQUFQO0FBQ0QsQ0FSRDs7QUFVQVosWUFBWSxDQUFDYSx1QkFBYixHQUF1QyxVQUFVSCxRQUFWLEVBQW9CSSxJQUFwQixFQUEwQjtBQUMvRCxNQUFJWCxNQUFNLENBQUNRLElBQVAsQ0FBWVgsWUFBWSxDQUFD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LENBQTRCdEIsR0FBRyxJQUFJO0FBQ2pDLFdBQUtGLEdBQUwsQ0FBU0UsR0FBVCxFQUFjNEIsTUFBTSxDQUFDNUIsR0FBRCxDQUFwQjtBQUNELEtBRkQ7QUFHRDs7QUFFREssbUJBQWlCLENBQUN1QixNQUFELEVBQVM7QUFDeEJ4RSxVQUFNLENBQUNpQyxJQUFQLENBQVl1QyxNQUFaLEVBQW9CTixPQUFwQixDQUE0QnRCLEdBQUcsSUFBSTtBQUNqQyxXQUFLSSxVQUFMLENBQWdCSixHQUFoQixFQUFxQjRCLE1BQU0sQ0FBQzVCLEdBQUQsQ0FBM0I7QUFDRCxLQUZEO0FBR0Q7O0FBRURPLFlBQVUsQ0FBQ1AsR0FBRCxFQUFNO0FBQ2QsUUFBSSxFQUFFQSxHQUFHLElBQUksS0FBS0osT0FBZCxDQUFKLEVBQTRCO0FBQzFCLFdBQUtBLE9BQUwsQ0FBYUksR0FBYixJQUFvQixJQUFJTixPQUFPLENBQUNDLFVBQVosRUFBcEI7QUFDQSxXQUFLRSxZQUFMLENBQWtCRyxHQUFsQixJQUF5QixFQUF6QjtBQUNEO0FBQ0YsR0F4TnVCLENBME54QjtBQUNBOzs7QUFDQXJCLG1CQUFpQixHQUFHO0FBQ2xCO0FBQ0EsV0FBTyxLQUFLVSxJQUFaO0FBQ0Q7O0FBL051QixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9yZWFjdGl2ZS1kaWN0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUmVhY3RpdmVEaWN0IH0gZnJvbSAnLi9yZWFjdGl2ZS1kaWN0JztcblxuY29uc3QgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuUmVhY3RpdmVEaWN0Ll9taWdyYXRlZERpY3REYXRhID0ge307IC8vIG5hbWUgLT4gZGF0YVxuUmVhY3RpdmVEaWN0Ll9kaWN0c1RvTWlncmF0ZSA9IHt9OyAvLyBuYW1lIC0+IFJlYWN0aXZlRGljdFxuXG5SZWFjdGl2ZURpY3QuX2xvYWRNaWdyYXRlZERpY3QgPSBmdW5jdGlvbiAoZGljdE5hbWUpIHtcbiAgaWYgKGhhc093bi5jYWxsKFJlYWN0aXZlRGljdC5fbWlncmF0ZWREaWN0RGF0YSwgZGljdE5hbWUpKSB7XG4gICAgY29uc3QgZGF0YSA9IFJlYWN0aXZlRGljdC5fbWlncmF0ZWREaWN0RGF0YVtkaWN0TmFtZV07XG4gICAgZGVsZXRlIFJlYWN0aXZlRGljdC5fbWlncmF0ZWREaWN0RGF0YVtkaWN0TmFtZV07XG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn07XG5cblJlYWN0aXZlRGljdC5fcmVnaXN0ZXJEaWN0Rm9yTWlncmF0ZSA9IGZ1bmN0aW9uIChkaWN0TmFtZSwgZGljdCkge1xuICBpZiAoaGFzT3duLmNhbGwoUmVhY3RpdmVEaWN0Ll9kaWN0c1RvTWlncmF0ZSwgZGljdE5hbWUpKVxuICAgIHRocm93IG5ldyBFcnJvcihcIkR1cGxpY2F0ZSBSZWFjdGl2ZURpY3QgbmFtZTogXCIgKyBkaWN0TmFtZSk7XG5cbiAgUmVhY3RpdmVEaWN0Ll9kaWN0c1RvTWlncmF0ZVtkaWN0TmFtZV0gPSBkaWN0O1xufTtcblxuaWYgKE1ldGVvci5pc0NsaWVudCAmJiBQYWNrYWdlLnJlbG9hZCkge1xuICAvLyBQdXQgb2xkIG1pZ3JhdGVkIGRhdGEgaW50byBSZWFjdGl2ZURpY3QuX21pZ3JhdGVkRGljdERhdGEsXG4gIC8vIHdoZXJlIGl0IGNhbiBiZSBhY2Nlc3NlZCBieSBSZWFjdGl2ZURpY3QuX2xvYWRNaWdyYXRlZERpY3QuXG4gIHZhciBtaWdyYXRpb25EYXRhID0gUGFja2FnZS5yZWxvYWQuUmVsb2FkLl9taWdyYXRpb25EYXRhKCdyZWFjdGl2ZS1kaWN0Jyk7XG4gIGlmIChtaWdyYXRpb25EYXRhICYmIG1pZ3JhdGlvbkRhdGEuZGljdHMpXG4gICAgUmVhY3RpdmVEaWN0Ll9taWdyYXRlZERpY3REYXRhID0gbWlncmF0aW9uRGF0YS5kaWN0cztcblxuICAvLyBPbiBtaWdyYXRpb24sIGFzc2VtYmxlIHRoZSBkYXRhIGZyb20gYWxsIHRoZSBkaWN0cyB0aGF0IGhhdmUgYmVlblxuICAvLyByZWdpc3RlcmVkLlxuICBQYWNrYWdlLnJlbG9hZC5SZWxvYWQuX29uTWlncmF0ZSgncmVhY3RpdmUtZGljdCcsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZGljdHNUb01pZ3JhdGUgPSBSZWFjdGl2ZURpY3QuX2RpY3RzVG9NaWdyYXRlO1xuICAgIHZhciBkYXRhVG9NaWdyYXRlID0ge307XG5cbiAgICBmb3IgKHZhciBkaWN0TmFtZSBpbiBkaWN0c1RvTWlncmF0ZSlcbiAgICAgIGRhdGFUb01pZ3JhdGVbZGljdE5hbWVdID0gZGljdHNUb01pZ3JhdGVbZGljdE5hbWVdLl9nZXRNaWdyYXRpb25EYXRhKCk7XG5cbiAgICByZXR1cm4gW3RydWUsIHtkaWN0czogZGF0YVRvTWlncmF0ZX1dO1xuICB9KTtcbn1cblxuZXhwb3J0IHsgUmVhY3RpdmVEaWN0IH07XG4iLCJjb25zdCBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vLyBYWFggY29tZSB1cCB3aXRoIGEgc2VyaWFsaXphdGlvbiBtZXRob2Qgd2hpY2ggY2Fub25pY2FsaXplcyBvYmplY3Qga2V5XG4vLyBvcmRlciwgd2hpY2ggd291bGQgYWxsb3cgdXMgdG8gdXNlIG9iamVjdHMgYXMgdmFsdWVzIGZvciBlcXVhbHMuXG5mdW5jdGlvbiBzdHJpbmdpZnkodmFsdWUpIHtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gJ3VuZGVmaW5lZCc7XG4gIH1cbiAgcmV0dXJuIEVKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIHBhcnNlKHNlcmlhbGl6ZWQpIHtcbiAgaWYgKHNlcmlhbGl6ZWQgPT09IHVuZGVmaW5lZCB8fCBzZXJpYWxpemVkID09PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgcmV0dXJuIEVKU09OLnBhcnNlKHNlcmlhbGl6ZWQpO1xufVxuXG5mdW5jdGlvbiBjaGFuZ2VkKHYpIHtcbiAgdiAmJiB2LmNoYW5nZWQoKTtcbn1cblxuLy8gWFhYIENPTVBBVCBXSVRIIDAuOS4xIDogYWNjZXB0IG1pZ3JhdGlvbkRhdGEgaW5zdGVhZCBvZiBkaWN0TmFtZVxuZXhwb3J0IGNsYXNzIFJlYWN0aXZlRGljdCB7XG4gIGNvbnN0cnVjdG9yKGRpY3ROYW1lLCBkaWN0RGF0YSkge1xuICAgIC8vIHRoaXMua2V5czoga2V5IC0+IHZhbHVlXG4gICAgdGhpcy5rZXlzID0ge307XG5cbiAgICBpZiAoZGljdE5hbWUpIHtcbiAgICAgIC8vIG5hbWUgZ2l2ZW47IG1pZ3JhdGlvbiB3aWxsIGJlIHBlcmZvcm1lZFxuICAgICAgaWYgKHR5cGVvZiBkaWN0TmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gdGhlIG5vcm1hbCBjYXNlLCBhcmd1bWVudCBpcyBhIHN0cmluZyBuYW1lLlxuXG4gICAgICAgIC8vIE9ubHkgcnVuIG1pZ3JhdGlvbiBsb2dpYyBvbiBjbGllbnQsIGl0IHdpbGwgY2F1c2VcbiAgICAgICAgLy8gZHVwbGljYXRlIG5hbWUgZXJyb3JzIG9uIHNlcnZlciBkdXJpbmcgcmVsb2Fkcy5cbiAgICAgICAgLy8gX3JlZ2lzdGVyRGljdEZvck1pZ3JhdGUgd2lsbCB0aHJvdyBhbiBlcnJvciBvbiBkdXBsaWNhdGUgbmFtZS5cbiAgICAgICAgTWV0ZW9yLmlzQ2xpZW50ICYmIFJlYWN0aXZlRGljdC5fcmVnaXN0ZXJEaWN0Rm9yTWlncmF0ZShkaWN0TmFtZSwgdGhpcyk7XG4gICAgICAgIGNvbnN0IG1pZ3JhdGVkRGF0YSA9IE1ldGVvci5pc0NsaWVudCAmJiBSZWFjdGl2ZURpY3QuX2xvYWRNaWdyYXRlZERpY3QoZGljdE5hbWUpO1xuXG4gICAgICAgIGlmIChtaWdyYXRlZERhdGEpIHtcbiAgICAgICAgICAvLyBEb24ndCBzdHJpbmdpZnkgbWlncmF0ZWQgZGF0YVxuICAgICAgICAgIHRoaXMua2V5cyA9IG1pZ3JhdGVkRGF0YTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBVc2UgX3NldE9iamVjdCB0byBtYWtlIHN1cmUgdmFsdWVzIGFyZSBzdHJpbmdpZmllZFxuICAgICAgICAgIHRoaXMuX3NldE9iamVjdChkaWN0RGF0YSB8fCB7fSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5uYW1lID0gZGljdE5hbWU7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBkaWN0TmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgLy8gYmFjay1jb21wYXQgY2FzZTogZGljdE5hbWUgaXMgYWN0dWFsbHkgbWlncmF0aW9uRGF0YVxuICAgICAgICAvLyBVc2UgX3NldE9iamVjdCB0byBtYWtlIHN1cmUgdmFsdWVzIGFyZSBzdHJpbmdpZmllZFxuICAgICAgICB0aGlzLl9zZXRPYmplY3QoZGljdE5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBSZWFjdGl2ZURpY3QgYXJndW1lbnQ6IFwiICsgZGljdE5hbWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRpY3REYXRhID09PSAnb2JqZWN0Jykge1xuICAgICAgdGhpcy5fc2V0T2JqZWN0KGRpY3REYXRhKTtcbiAgICB9XG5cbiAgICB0aGlzLmFsbERlcHMgPSBuZXcgVHJhY2tlci5EZXBlbmRlbmN5O1xuICAgIHRoaXMua2V5RGVwcyA9IHt9OyAvLyBrZXkgLT4gRGVwZW5kZW5jeVxuICAgIHRoaXMua2V5VmFsdWVEZXBzID0ge307IC8vIGtleSAtPiBEZXBlbmRlbmN5XG4gIH1cblxuICAvLyBzZXQoKSBiZWdhbiBhcyBhIGtleS92YWx1ZSBtZXRob2QsIGJ1dCB3ZSBhcmUgbm93IG92ZXJsb2FkaW5nIGl0XG4gIC8vIHRvIHRha2UgYW4gb2JqZWN0IG9mIGtleS92YWx1ZSBwYWlycywgc2ltaWxhciB0byBiYWNrYm9uZVxuICAvLyBodHRwOi8vYmFja2JvbmVqcy5vcmcvI01vZGVsLXNldFxuICBzZXQoa2V5T3JPYmplY3QsIHZhbHVlKSB7XG4gICAgaWYgKCh0eXBlb2Yga2V5T3JPYmplY3QgPT09ICdvYmplY3QnKSAmJiAodmFsdWUgPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgIC8vIENhbGxlZCBhcyBgZGljdC5zZXQoey4uLn0pYFxuICAgICAgdGhpcy5fc2V0T2JqZWN0KGtleU9yT2JqZWN0KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gdGhlIGlucHV0IGlzbid0IGFuIG9iamVjdCwgc28gaXQgbXVzdCBiZSBhIGtleVxuICAgIC8vIGFuZCB3ZSByZXN1bWUgd2l0aCB0aGUgcmVzdCBvZiB0aGUgZnVuY3Rpb25cbiAgICBjb25zdCBrZXkgPSBrZXlPck9iamVjdDtcblxuICAgIHZhbHVlID0gc3RyaW5naWZ5KHZhbHVlKTtcblxuICAgIGNvbnN0IGtleUV4aXN0ZWQgPSBoYXNPd24uY2FsbCh0aGlzLmtleXMsIGtleSk7XG4gICAgY29uc3Qgb2xkU2VyaWFsaXplZFZhbHVlID0ga2V5RXhpc3RlZCA/IHRoaXMua2V5c1trZXldIDogJ3VuZGVmaW5lZCc7XG4gICAgY29uc3QgaXNOZXdWYWx1ZSA9ICh2YWx1ZSAhPT0gb2xkU2VyaWFsaXplZFZhbHVlKTtcblxuICAgIHRoaXMua2V5c1trZXldID0gdmFsdWU7XG5cbiAgICBpZiAoaXNOZXdWYWx1ZSB8fCAha2V5RXhpc3RlZCkge1xuICAgICAgLy8gVXNpbmcgdGhlIGNoYW5nZWQgdXRpbGl0eSBmdW5jdGlvbiBoZXJlIGJlY2F1c2UgdGhpcy5hbGxEZXBzIG1pZ2h0IG5vdCBleGlzdCB5ZXQsXG4gICAgICAvLyB3aGVuIHNldHRpbmcgaW5pdGlhbCBkYXRhIGZyb20gY29uc3RydWN0b3JcbiAgICAgIGNoYW5nZWQodGhpcy5hbGxEZXBzKTtcbiAgICB9XG5cbiAgICAvLyBEb24ndCB0cmlnZ2VyIGNoYW5nZXMgd2hlbiBzZXR0aW5nIGluaXRpYWwgZGF0YSBmcm9tIGNvbnN0cnVjdG9yLFxuICAgIC8vIHRoaXMuS2V5RGVwcyBpcyB1bmRlZmluZWQgaW4gdGhpcyBjYXNlXG4gICAgaWYgKGlzTmV3VmFsdWUgJiYgdGhpcy5rZXlEZXBzKSB7XG4gICAgICBjaGFuZ2VkKHRoaXMua2V5RGVwc1trZXldKTtcbiAgICAgIGlmICh0aGlzLmtleVZhbHVlRGVwc1trZXldKSB7XG4gICAgICAgIGNoYW5nZWQodGhpcy5rZXlWYWx1ZURlcHNba2V5XVtvbGRTZXJpYWxpemVkVmFsdWVdKTtcbiAgICAgICAgY2hhbmdlZCh0aGlzLmtleVZhbHVlRGVwc1trZXldW3ZhbHVlXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2V0RGVmYXVsdChrZXlPck9iamVjdCwgdmFsdWUpIHtcbiAgICBpZiAoKHR5cGVvZiBrZXlPck9iamVjdCA9PT0gJ29iamVjdCcpICYmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgLy8gQ2FsbGVkIGFzIGBkaWN0LnNldERlZmF1bHQoey4uLn0pYFxuICAgICAgdGhpcy5fc2V0RGVmYXVsdE9iamVjdChrZXlPck9iamVjdCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIHRoZSBpbnB1dCBpc24ndCBhbiBvYmplY3QsIHNvIGl0IG11c3QgYmUgYSBrZXlcbiAgICAvLyBhbmQgd2UgcmVzdW1lIHdpdGggdGhlIHJlc3Qgb2YgdGhlIGZ1bmN0aW9uXG4gICAgY29uc3Qga2V5ID0ga2V5T3JPYmplY3Q7XG5cbiAgICBpZiAoISBoYXNPd24uY2FsbCh0aGlzLmtleXMsIGtleSkpIHtcbiAgICAgIHRoaXMuc2V0KGtleSwgdmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIGdldChrZXkpIHtcbiAgICB0aGlzLl9lbnN1cmVLZXkoa2V5KTtcbiAgICB0aGlzLmtleURlcHNba2V5XS5kZXBlbmQoKTtcbiAgICByZXR1cm4gcGFyc2UodGhpcy5rZXlzW2tleV0pO1xuICB9XG5cbiAgZXF1YWxzKGtleSwgdmFsdWUpIHtcbiAgICAvLyBNb25nby5PYmplY3RJRCBpcyBpbiB0aGUgJ21vbmdvJyBwYWNrYWdlXG4gICAgbGV0IE9iamVjdElEID0gbnVsbDtcbiAgICBpZiAoUGFja2FnZS5tb25nbykge1xuICAgICAgT2JqZWN0SUQgPSBQYWNrYWdlLm1vbmdvLk1vbmdvLk9iamVjdElEO1xuICAgIH1cbiAgICAvLyBXZSBkb24ndCBhbGxvdyBvYmplY3RzIChvciBhcnJheXMgdGhhdCBtaWdodCBpbmNsdWRlIG9iamVjdHMpIGZvclxuICAgIC8vIC5lcXVhbHMsIGJlY2F1c2UgSlNPTi5zdHJpbmdpZnkgZG9lc24ndCBjYW5vbmljYWxpemUgb2JqZWN0IGtleVxuICAgIC8vIG9yZGVyLiAoV2UgY2FuIG1ha2UgZXF1YWxzIGhhdmUgdGhlIHJpZ2h0IHJldHVybiB2YWx1ZSBieSBwYXJzaW5nIHRoZVxuICAgIC8vIGN1cnJlbnQgdmFsdWUgYW5kIHVzaW5nIEVKU09OLmVxdWFscywgYnV0IHdlIHdvbid0IGhhdmUgYSBjYW5vbmljYWxcbiAgICAvLyBlbGVtZW50IG9mIGtleVZhbHVlRGVwc1trZXldIHRvIHN0b3JlIHRoZSBkZXBlbmRlbmN5LikgWW91IGNhbiBzdGlsbCB1c2VcbiAgICAvLyBcIkVKU09OLmVxdWFscyhyZWFjdGl2ZURpY3QuZ2V0KGtleSksIHZhbHVlKVwiLlxuICAgIC8vXG4gICAgLy8gWFhYIHdlIGNvdWxkIGFsbG93IGFycmF5cyBhcyBsb25nIGFzIHdlIHJlY3Vyc2l2ZWx5IGNoZWNrIHRoYXQgdGhlcmVcbiAgICAvLyBhcmUgbm8gb2JqZWN0c1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnICYmXG4gICAgICAgIHR5cGVvZiB2YWx1ZSAhPT0gJ251bWJlcicgJiZcbiAgICAgICAgdHlwZW9mIHZhbHVlICE9PSAnYm9vbGVhbicgJiZcbiAgICAgICAgdHlwZW9mIHZhbHVlICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAhKHZhbHVlIGluc3RhbmNlb2YgRGF0ZSkgJiZcbiAgICAgICAgIShPYmplY3RJRCAmJiB2YWx1ZSBpbnN0YW5jZW9mIE9iamVjdElEKSAmJlxuICAgICAgICB2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUmVhY3RpdmVEaWN0LmVxdWFsczogdmFsdWUgbXVzdCBiZSBzY2FsYXJcIik7XG4gICAgfVxuICAgIGNvbnN0IHNlcmlhbGl6ZWRWYWx1ZSA9IHN0cmluZ2lmeSh2YWx1ZSk7XG5cbiAgICBpZiAoVHJhY2tlci5hY3RpdmUpIHtcbiAgICAgIHRoaXMuX2Vuc3VyZUtleShrZXkpO1xuXG4gICAgICBpZiAoISBoYXNPd24uY2FsbCh0aGlzLmtleVZhbHVlRGVwc1trZXldLCBzZXJpYWxpemVkVmFsdWUpKSB7XG4gICAgICAgIHRoaXMua2V5VmFsdWVEZXBzW2tleV1bc2VyaWFsaXplZFZhbHVlXSA9IG5ldyBUcmFja2VyLkRlcGVuZGVuY3k7XG4gICAgICB9XG5cbiAgICAgIHZhciBpc05ldyA9IHRoaXMua2V5VmFsdWVEZXBzW2tleV1bc2VyaWFsaXplZFZhbHVlXS5kZXBlbmQoKTtcbiAgICAgIGlmIChpc05ldykge1xuICAgICAgICBUcmFja2VyLm9uSW52YWxpZGF0ZSgoKSA9PiB7XG4gICAgICAgICAgLy8gY2xlYW4gdXAgW2tleV1bc2VyaWFsaXplZFZhbHVlXSBpZiBpdCdzIG5vdyBlbXB0eSwgc28gd2UgZG9uJ3RcbiAgICAgICAgICAvLyB1c2UgTyhuKSBtZW1vcnkgZm9yIG4gPSB2YWx1ZXMgc2VlbiBldmVyXG4gICAgICAgICAgaWYgKCEgdGhpcy5rZXlWYWx1ZURlcHNba2V5XVtzZXJpYWxpemVkVmFsdWVdLmhhc0RlcGVuZGVudHMoKSkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMua2V5VmFsdWVEZXBzW2tleV1bc2VyaWFsaXplZFZhbHVlXTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBvbGRWYWx1ZSA9IHVuZGVmaW5lZDtcbiAgICBpZiAoaGFzT3duLmNhbGwodGhpcy5rZXlzLCBrZXkpKSB7XG4gICAgICBvbGRWYWx1ZSA9IHBhcnNlKHRoaXMua2V5c1trZXldKTtcbiAgICB9XG4gICAgcmV0dXJuIEVKU09OLmVxdWFscyhvbGRWYWx1ZSwgdmFsdWUpO1xuICB9XG5cbiAgYWxsKCkge1xuICAgIHRoaXMuYWxsRGVwcy5kZXBlbmQoKTtcbiAgICBsZXQgcmV0ID0ge307XG4gICAgT2JqZWN0LmtleXModGhpcy5rZXlzKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICByZXRba2V5XSA9IHBhcnNlKHRoaXMua2V5c1trZXldKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgY2xlYXIoKSB7XG4gICAgY29uc3Qgb2xkS2V5cyA9IHRoaXMua2V5cztcbiAgICB0aGlzLmtleXMgPSB7fTtcblxuICAgIHRoaXMuYWxsRGVwcy5jaGFuZ2VkKCk7XG5cbiAgICBPYmplY3Qua2V5cyhvbGRLZXlzKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICBjaGFuZ2VkKHRoaXMua2V5RGVwc1trZXldKTtcbiAgICAgIGlmICh0aGlzLmtleVZhbHVlRGVwc1trZXldKSB7XG4gICAgICAgIGNoYW5nZWQodGhpcy5rZXlWYWx1ZURlcHNba2V5XVtvbGRLZXlzW2tleV1dKTtcbiAgICAgICAgY2hhbmdlZCh0aGlzLmtleVZhbHVlRGVwc1trZXldWyd1bmRlZmluZWQnXSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBkZWxldGUoa2V5KSB7XG4gICAgbGV0IGRpZFJlbW92ZSA9IGZhbHNlO1xuXG4gICAgaWYgKGhhc093bi5jYWxsKHRoaXMua2V5cywga2V5KSkge1xuICAgICAgY29uc3Qgb2xkVmFsdWUgPSB0aGlzLmtleXNba2V5XTtcbiAgICAgIGRlbGV0ZSB0aGlzLmtleXNba2V5XTtcbiAgICAgIGNoYW5nZWQodGhpcy5rZXlEZXBzW2tleV0pO1xuICAgICAgaWYgKHRoaXMua2V5VmFsdWVEZXBzW2tleV0pIHtcbiAgICAgICAgY2hhbmdlZCh0aGlzLmtleVZhbHVlRGVwc1trZXldW29sZFZhbHVlXSk7XG4gICAgICAgIGNoYW5nZWQodGhpcy5rZXlWYWx1ZURlcHNba2V5XVsndW5kZWZpbmVkJ10pO1xuICAgICAgfVxuICAgICAgdGhpcy5hbGxEZXBzLmNoYW5nZWQoKTtcbiAgICAgIGRpZFJlbW92ZSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBkaWRSZW1vdmU7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIHRoaXMuY2xlYXIoKTtcbiAgICBpZiAodGhpcy5uYW1lICYmIGhhc093bi5jYWxsKFJlYWN0aXZlRGljdC5fZGljdHNUb01pZ3JhdGUsIHRoaXMubmFtZSkpIHtcbiAgICAgIGRlbGV0ZSBSZWFjdGl2ZURpY3QuX2RpY3RzVG9NaWdyYXRlW3RoaXMubmFtZV07XG4gICAgfVxuICB9XG5cbiAgX3NldE9iamVjdChvYmplY3QpIHtcbiAgICBPYmplY3Qua2V5cyhvYmplY3QpLmZvckVhY2goa2V5ID0+IHtcbiAgICAgIHRoaXMuc2V0KGtleSwgb2JqZWN0W2tleV0pO1xuICAgIH0pO1xuICB9XG5cbiAgX3NldERlZmF1bHRPYmplY3Qob2JqZWN0KSB7XG4gICAgT2JqZWN0LmtleXMob2JqZWN0KS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICB0aGlzLnNldERlZmF1bHQoa2V5LCBvYmplY3Rba2V5XSk7XG4gICAgfSk7XG4gIH1cblxuICBfZW5zdXJlS2V5KGtleSkge1xuICAgIGlmICghKGtleSBpbiB0aGlzLmtleURlcHMpKSB7XG4gICAgICB0aGlzLmtleURlcHNba2V5XSA9IG5ldyBUcmFja2VyLkRlcGVuZGVuY3k7XG4gICAgICB0aGlzLmtleVZhbHVlRGVwc1trZXldID0ge307XG4gICAgfVxuICB9XG5cbiAgLy8gR2V0IGEgSlNPTiB2YWx1ZSB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gdGhlIGNvbnN0cnVjdG9yIHRvXG4gIC8vIGNyZWF0ZSBhIG5ldyBSZWFjdGl2ZURpY3Qgd2l0aCB0aGUgc2FtZSBjb250ZW50cyBhcyB0aGlzIG9uZVxuICBfZ2V0TWlncmF0aW9uRGF0YSgpIHtcbiAgICAvLyBYWFggc2FuaXRpemUgYW5kIG1ha2Ugc3VyZSBpdCdzIEpTT05pYmxlP1xuICAgIHJldHVybiB0aGlzLmtleXM7XG4gIH1cbn1cbiJdfQ==
