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
var IdMap;

var require = meteorInstall({"node_modules":{"meteor":{"id-map":{"id-map.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                        //
// packages/id-map/id-map.js                                                              //
//                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////
                                                                                          //
module.export({
  IdMap: () => IdMap
});
const hasOwn = Object.prototype.hasOwnProperty;

class IdMap {
  constructor(idStringify, idParse) {
    this.clear();
    this._idStringify = idStringify || JSON.stringify;
    this._idParse = idParse || JSON.parse;
  } // Some of these methods are designed to match methods on OrderedDict, since
  // (eg) ObserveMultiplex and _CachingChangeObserver use them interchangeably.
  // (Conceivably, this should be replaced with "UnorderedDict" with a specific
  // set of methods that overlap between the two.)


  get(id) {
    var key = this._idStringify(id);

    return this._map[key];
  }

  set(id, value) {
    var key = this._idStringify(id);

    this._map[key] = value;
  }

  remove(id) {
    var key = this._idStringify(id);

    delete this._map[key];
  }

  has(id) {
    var key = this._idStringify(id);

    return hasOwn.call(this._map, key);
  }

  empty() {
    for (let key in this._map) {
      return false;
    }

    return true;
  }

  clear() {
    this._map = Object.create(null);
  } // Iterates over the items in the map. Return `false` to break the loop.


  forEach(iterator) {
    // don't use _.each, because we can't break out of it.
    var keys = Object.keys(this._map);

    for (var i = 0; i < keys.length; i++) {
      var breakIfFalse = iterator.call(null, this._map[keys[i]], this._idParse(keys[i]));

      if (breakIfFalse === false) {
        return;
      }
    }
  }

  size() {
    return Object.keys(this._map).length;
  }

  setDefault(id, def) {
    var key = this._idStringify(id);

    if (hasOwn.call(this._map, key)) {
      return this._map[key];
    }

    this._map[key] = def;
    return def;
  } // Assumes that values are EJSON-cloneable, and that we don't need to clone
  // IDs (ie, that nobody is going to mutate an ObjectId).


  clone() {
    var clone = new IdMap(this._idStringify, this._idParse);
    this.forEach(function (value, id) {
      clone.set(id, EJSON.clone(value));
    });
    return clone;
  }

}
////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/id-map/id-map.js");

/* Exports */
Package._define("id-map", exports, {
  IdMap: IdMap
});

})();

//# sourceURL=meteor://💻app/packages/id-map.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvaWQtbWFwL2lkLW1hcC5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJJZE1hcCIsImhhc093biIsIk9iamVjdCIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiY29uc3RydWN0b3IiLCJpZFN0cmluZ2lmeSIsImlkUGFyc2UiLCJjbGVhciIsIl9pZFN0cmluZ2lmeSIsIkpTT04iLCJzdHJpbmdpZnkiLCJfaWRQYXJzZSIsInBhcnNlIiwiZ2V0IiwiaWQiLCJrZXkiLCJfbWFwIiwic2V0IiwidmFsdWUiLCJyZW1vdmUiLCJoYXMiLCJjYWxsIiwiZW1wdHkiLCJjcmVhdGUiLCJmb3JFYWNoIiwiaXRlcmF0b3IiLCJrZXlzIiwiaSIsImxlbmd0aCIsImJyZWFrSWZGYWxzZSIsInNpemUiLCJzZXREZWZhdWx0IiwiZGVmIiwiY2xvbmUiLCJFSlNPTiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsTUFBTSxDQUFDQyxNQUFQLENBQWM7QUFBQ0MsT0FBSyxFQUFDLE1BQUlBO0FBQVgsQ0FBZDtBQUFBLE1BQU1DLE1BQU0sR0FBR0MsTUFBTSxDQUFDQyxTQUFQLENBQWlCQyxjQUFoQzs7QUFFTyxNQUFNSixLQUFOLENBQVk7QUFDakJLLGFBQVcsQ0FBQ0MsV0FBRCxFQUFjQyxPQUFkLEVBQXVCO0FBQ2hDLFNBQUtDLEtBQUw7QUFDQSxTQUFLQyxZQUFMLEdBQW9CSCxXQUFXLElBQUlJLElBQUksQ0FBQ0MsU0FBeEM7QUFDQSxTQUFLQyxRQUFMLEdBQWdCTCxPQUFPLElBQUlHLElBQUksQ0FBQ0csS0FBaEM7QUFDRCxHQUxnQixDQU9uQjtBQUNBO0FBQ0E7QUFDQTs7O0FBRUVDLEtBQUcsQ0FBQ0MsRUFBRCxFQUFLO0FBQ04sUUFBSUMsR0FBRyxHQUFHLEtBQUtQLFlBQUwsQ0FBa0JNLEVBQWxCLENBQVY7O0FBQ0EsV0FBTyxLQUFLRSxJQUFMLENBQVVELEdBQVYsQ0FBUDtBQUNEOztBQUVERSxLQUFHLENBQUNILEVBQUQsRUFBS0ksS0FBTCxFQUFZO0FBQ2IsUUFBSUgsR0FBRyxHQUFHLEtBQUtQLFlBQUwsQ0FBa0JNLEVBQWxCLENBQVY7O0FBQ0EsU0FBS0UsSUFBTCxDQUFVRCxHQUFWLElBQWlCRyxLQUFqQjtBQUNEOztBQUVEQyxRQUFNLENBQUNMLEVBQUQsRUFBSztBQUNULFFBQUlDLEdBQUcsR0FBRyxLQUFLUCxZQUFMLENBQWtCTSxFQUFsQixDQUFWOztBQUNBLFdBQU8sS0FBS0UsSUFBTCxDQUFVRCxHQUFWLENBQVA7QUFDRDs7QUFFREssS0FBRyxDQUFDTixFQUFELEVBQUs7QUFDTixRQUFJQyxHQUFHLEdBQUcsS0FBS1AsWUFBTCxDQUFrQk0sRUFBbEIsQ0FBVjs7QUFDQSxXQUFPZCxNQUFNLENBQUNxQixJQUFQLENBQVksS0FBS0wsSUFBakIsRUFBdUJELEdBQXZCLENBQVA7QUFDRDs7QUFFRE8sT0FBSyxHQUFHO0FBQ04sU0FBSyxJQUFJUCxHQUFULElBQWdCLEtBQUtDLElBQXJCLEVBQTJCO0FBQ3pCLGFBQU8sS0FBUDtBQUNEOztBQUNELFdBQU8sSUFBUDtBQUNEOztBQUVEVCxPQUFLLEdBQUc7QUFDTixTQUFLUyxJQUFMLEdBQVlmLE1BQU0sQ0FBQ3NCLE1BQVAsQ0FBYyxJQUFkLENBQVo7QUFDRCxHQXpDZ0IsQ0EyQ2pCOzs7QUFDQUMsU0FBTyxDQUFDQyxRQUFELEVBQVc7QUFDaEI7QUFDQSxRQUFJQyxJQUFJLEdBQUd6QixNQUFNLENBQUN5QixJQUFQLENBQVksS0FBS1YsSUFBakIsQ0FBWDs7QUFDQSxTQUFLLElBQUlXLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdELElBQUksQ0FBQ0UsTUFBekIsRUFBaUNELENBQUMsRUFBbEMsRUFBc0M7QUFDcEMsVUFBSUUsWUFBWSxHQUFHSixRQUFRLENBQUNKLElBQVQsQ0FDakIsSUFEaUIsRUFFakIsS0FBS0wsSUFBTCxDQUFVVSxJQUFJLENBQUNDLENBQUQsQ0FBZCxDQUZpQixFQUdqQixLQUFLaEIsUUFBTCxDQUFjZSxJQUFJLENBQUNDLENBQUQsQ0FBbEIsQ0FIaUIsQ0FBbkI7O0FBS0EsVUFBSUUsWUFBWSxLQUFLLEtBQXJCLEVBQTRCO0FBQzFCO0FBQ0Q7QUFDRjtBQUNGOztBQUVEQyxNQUFJLEdBQUc7QUFDTCxXQUFPN0IsTUFBTSxDQUFDeUIsSUFBUCxDQUFZLEtBQUtWLElBQWpCLEVBQXVCWSxNQUE5QjtBQUNEOztBQUVERyxZQUFVLENBQUNqQixFQUFELEVBQUtrQixHQUFMLEVBQVU7QUFDbEIsUUFBSWpCLEdBQUcsR0FBRyxLQUFLUCxZQUFMLENBQWtCTSxFQUFsQixDQUFWOztBQUNBLFFBQUlkLE1BQU0sQ0FBQ3FCLElBQVAsQ0FBWSxLQUFLTCxJQUFqQixFQUF1QkQsR0FBdkIsQ0FBSixFQUFpQztBQUMvQixhQUFPLEtBQUtDLElBQUwsQ0FBVUQsR0FBVixDQUFQO0FBQ0Q7O0FBQ0QsU0FBS0MsSUFBTCxDQUFVRCxHQUFWLElBQWlCaUIsR0FBakI7QUFDQSxXQUFPQSxHQUFQO0FBQ0QsR0F0RWdCLENBd0VqQjtBQUNBOzs7QUFDQUMsT0FBSyxHQUFHO0FBQ04sUUFBSUEsS0FBSyxHQUFHLElBQUlsQyxLQUFKLENBQVUsS0FBS1MsWUFBZixFQUE2QixLQUFLRyxRQUFsQyxDQUFaO0FBQ0EsU0FBS2EsT0FBTCxDQUFhLFVBQVVOLEtBQVYsRUFBaUJKLEVBQWpCLEVBQXFCO0FBQ2hDbUIsV0FBSyxDQUFDaEIsR0FBTixDQUFVSCxFQUFWLEVBQWNvQixLQUFLLENBQUNELEtBQU4sQ0FBWWYsS0FBWixDQUFkO0FBQ0QsS0FGRDtBQUdBLFdBQU9lLEtBQVA7QUFDRDs7QUFoRmdCLEMiLCJmaWxlIjoiL3BhY2thZ2VzL2lkLW1hcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbmV4cG9ydCBjbGFzcyBJZE1hcCB7XG4gIGNvbnN0cnVjdG9yKGlkU3RyaW5naWZ5LCBpZFBhcnNlKSB7XG4gICAgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMuX2lkU3RyaW5naWZ5ID0gaWRTdHJpbmdpZnkgfHwgSlNPTi5zdHJpbmdpZnk7XG4gICAgdGhpcy5faWRQYXJzZSA9IGlkUGFyc2UgfHwgSlNPTi5wYXJzZTtcbiAgfVxuXG4vLyBTb21lIG9mIHRoZXNlIG1ldGhvZHMgYXJlIGRlc2lnbmVkIHRvIG1hdGNoIG1ldGhvZHMgb24gT3JkZXJlZERpY3QsIHNpbmNlXG4vLyAoZWcpIE9ic2VydmVNdWx0aXBsZXggYW5kIF9DYWNoaW5nQ2hhbmdlT2JzZXJ2ZXIgdXNlIHRoZW0gaW50ZXJjaGFuZ2VhYmx5LlxuLy8gKENvbmNlaXZhYmx5LCB0aGlzIHNob3VsZCBiZSByZXBsYWNlZCB3aXRoIFwiVW5vcmRlcmVkRGljdFwiIHdpdGggYSBzcGVjaWZpY1xuLy8gc2V0IG9mIG1ldGhvZHMgdGhhdCBvdmVybGFwIGJldHdlZW4gdGhlIHR3by4pXG5cbiAgZ2V0KGlkKSB7XG4gICAgdmFyIGtleSA9IHRoaXMuX2lkU3RyaW5naWZ5KGlkKTtcbiAgICByZXR1cm4gdGhpcy5fbWFwW2tleV07XG4gIH1cblxuICBzZXQoaWQsIHZhbHVlKSB7XG4gICAgdmFyIGtleSA9IHRoaXMuX2lkU3RyaW5naWZ5KGlkKTtcbiAgICB0aGlzLl9tYXBba2V5XSA9IHZhbHVlO1xuICB9XG5cbiAgcmVtb3ZlKGlkKSB7XG4gICAgdmFyIGtleSA9IHRoaXMuX2lkU3RyaW5naWZ5KGlkKTtcbiAgICBkZWxldGUgdGhpcy5fbWFwW2tleV07XG4gIH1cblxuICBoYXMoaWQpIHtcbiAgICB2YXIga2V5ID0gdGhpcy5faWRTdHJpbmdpZnkoaWQpO1xuICAgIHJldHVybiBoYXNPd24uY2FsbCh0aGlzLl9tYXAsIGtleSk7XG4gIH1cblxuICBlbXB0eSgpIHtcbiAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5fbWFwKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgY2xlYXIoKSB7XG4gICAgdGhpcy5fbWFwID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgfVxuXG4gIC8vIEl0ZXJhdGVzIG92ZXIgdGhlIGl0ZW1zIGluIHRoZSBtYXAuIFJldHVybiBgZmFsc2VgIHRvIGJyZWFrIHRoZSBsb29wLlxuICBmb3JFYWNoKGl0ZXJhdG9yKSB7XG4gICAgLy8gZG9uJ3QgdXNlIF8uZWFjaCwgYmVjYXVzZSB3ZSBjYW4ndCBicmVhayBvdXQgb2YgaXQuXG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLl9tYXApO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGJyZWFrSWZGYWxzZSA9IGl0ZXJhdG9yLmNhbGwoXG4gICAgICAgIG51bGwsXG4gICAgICAgIHRoaXMuX21hcFtrZXlzW2ldXSxcbiAgICAgICAgdGhpcy5faWRQYXJzZShrZXlzW2ldKVxuICAgICAgKTtcbiAgICAgIGlmIChicmVha0lmRmFsc2UgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzaXplKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLl9tYXApLmxlbmd0aDtcbiAgfVxuXG4gIHNldERlZmF1bHQoaWQsIGRlZikge1xuICAgIHZhciBrZXkgPSB0aGlzLl9pZFN0cmluZ2lmeShpZCk7XG4gICAgaWYgKGhhc093bi5jYWxsKHRoaXMuX21hcCwga2V5KSkge1xuICAgICAgcmV0dXJuIHRoaXMuX21hcFtrZXldO1xuICAgIH1cbiAgICB0aGlzLl9tYXBba2V5XSA9IGRlZjtcbiAgICByZXR1cm4gZGVmO1xuICB9XG5cbiAgLy8gQXNzdW1lcyB0aGF0IHZhbHVlcyBhcmUgRUpTT04tY2xvbmVhYmxlLCBhbmQgdGhhdCB3ZSBkb24ndCBuZWVkIHRvIGNsb25lXG4gIC8vIElEcyAoaWUsIHRoYXQgbm9ib2R5IGlzIGdvaW5nIHRvIG11dGF0ZSBhbiBPYmplY3RJZCkuXG4gIGNsb25lKCkge1xuICAgIHZhciBjbG9uZSA9IG5ldyBJZE1hcCh0aGlzLl9pZFN0cmluZ2lmeSwgdGhpcy5faWRQYXJzZSk7XG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSwgaWQpIHtcbiAgICAgIGNsb25lLnNldChpZCwgRUpTT04uY2xvbmUodmFsdWUpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gY2xvbmU7XG4gIH1cbn1cbiJdfQ==
