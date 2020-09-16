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
var OrderedDict;

var require = meteorInstall({"node_modules":{"meteor":{"ordered-dict":{"ordered_dict.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                      //
// packages/ordered-dict/ordered_dict.js                                                                //
//                                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                        //
module.export({
  OrderedDict: () => OrderedDict
});

// This file defines an ordered dictionary abstraction that is useful for
// maintaining a dataset backed by observeChanges.  It supports ordering items
// by specifying the item they now come before.
// The implementation is a dictionary that contains nodes of a doubly-linked
// list as its values.
// constructs a new element struct
// next and prev are whole elements, not keys.
function element(key, value, next, prev) {
  return {
    key: key,
    value: value,
    next: next,
    prev: prev
  };
}

class OrderedDict {
  constructor(...args) {
    this._dict = Object.create(null);
    this._first = null;
    this._last = null;
    this._size = 0;

    if (typeof args[0] === 'function') {
      this._stringify = args.shift();
    } else {
      this._stringify = function (x) {
        return x;
      };
    }

    args.forEach(kv => this.putBefore(kv[0], kv[1], null));
  } // the "prefix keys with a space" thing comes from here
  // https://github.com/documentcloud/underscore/issues/376#issuecomment-2815649


  _k(key) {
    return " " + this._stringify(key);
  }

  empty() {
    return !this._first;
  }

  size() {
    return this._size;
  }

  _linkEltIn(elt) {
    if (!elt.next) {
      elt.prev = this._last;
      if (this._last) this._last.next = elt;
      this._last = elt;
    } else {
      elt.prev = elt.next.prev;
      elt.next.prev = elt;
      if (elt.prev) elt.prev.next = elt;
    }

    if (this._first === null || this._first === elt.next) this._first = elt;
  }

  _linkEltOut(elt) {
    if (elt.next) elt.next.prev = elt.prev;
    if (elt.prev) elt.prev.next = elt.next;
    if (elt === this._last) this._last = elt.prev;
    if (elt === this._first) this._first = elt.next;
  }

  putBefore(key, item, before) {
    if (this._dict[this._k(key)]) throw new Error("Item " + key + " already present in OrderedDict");
    var elt = before ? element(key, item, this._dict[this._k(before)]) : element(key, item, null);
    if (typeof elt.next === "undefined") throw new Error("could not find item to put this one before");

    this._linkEltIn(elt);

    this._dict[this._k(key)] = elt;
    this._size++;
  }

  append(key, item) {
    this.putBefore(key, item, null);
  }

  remove(key) {
    var elt = this._dict[this._k(key)];

    if (typeof elt === "undefined") throw new Error("Item " + key + " not present in OrderedDict");

    this._linkEltOut(elt);

    this._size--;
    delete this._dict[this._k(key)];
    return elt.value;
  }

  get(key) {
    if (this.has(key)) {
      return this._dict[this._k(key)].value;
    }
  }

  has(key) {
    return Object.prototype.hasOwnProperty.call(this._dict, this._k(key));
  } // Iterate through the items in this dictionary in order, calling
  // iter(value, key, index) on each one.
  // Stops whenever iter returns OrderedDict.BREAK, or after the last element.


  forEach(iter, context = null) {
    var i = 0;
    var elt = this._first;

    while (elt !== null) {
      var b = iter.call(context, elt.value, elt.key, i);
      if (b === OrderedDict.BREAK) return;
      elt = elt.next;
      i++;
    }
  }

  first() {
    if (this.empty()) {
      return;
    }

    return this._first.key;
  }

  firstValue() {
    if (this.empty()) {
      return;
    }

    return this._first.value;
  }

  last() {
    if (this.empty()) {
      return;
    }

    return this._last.key;
  }

  lastValue() {
    if (this.empty()) {
      return;
    }

    return this._last.value;
  }

  prev(key) {
    if (this.has(key)) {
      var elt = this._dict[this._k(key)];

      if (elt.prev) return elt.prev.key;
    }

    return null;
  }

  next(key) {
    if (this.has(key)) {
      var elt = this._dict[this._k(key)];

      if (elt.next) return elt.next.key;
    }

    return null;
  }

  moveBefore(key, before) {
    var elt = this._dict[this._k(key)];

    var eltBefore = before ? this._dict[this._k(before)] : null;

    if (typeof elt === "undefined") {
      throw new Error("Item to move is not present");
    }

    if (typeof eltBefore === "undefined") {
      throw new Error("Could not find element to move this one before");
    }

    if (eltBefore === elt.next) // no moving necessary
      return; // remove from its old place

    this._linkEltOut(elt); // patch into its new place


    elt.next = eltBefore;

    this._linkEltIn(elt);
  } // Linear, sadly.


  indexOf(key) {
    var ret = null;
    this.forEach((v, k, i) => {
      if (this._k(k) === this._k(key)) {
        ret = i;
        return OrderedDict.BREAK;
      }

      return;
    });
    return ret;
  }

  _checkRep() {
    Object.keys(this._dict).forEach(k => {
      const v = this._dict[k];

      if (v.next === v) {
        throw new Error("Next is a loop");
      }

      if (v.prev === v) {
        throw new Error("Prev is a loop");
      }
    });
  }

}

OrderedDict.BREAK = {
  "break": true
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/ordered-dict/ordered_dict.js");

/* Exports */
Package._define("ordered-dict", exports, {
  OrderedDict: OrderedDict
});

})();

//# sourceURL=meteor://💻app/packages/ordered-dict.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb3JkZXJlZC1kaWN0L29yZGVyZWRfZGljdC5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJPcmRlcmVkRGljdCIsImVsZW1lbnQiLCJrZXkiLCJ2YWx1ZSIsIm5leHQiLCJwcmV2IiwiY29uc3RydWN0b3IiLCJhcmdzIiwiX2RpY3QiLCJPYmplY3QiLCJjcmVhdGUiLCJfZmlyc3QiLCJfbGFzdCIsIl9zaXplIiwiX3N0cmluZ2lmeSIsInNoaWZ0IiwieCIsImZvckVhY2giLCJrdiIsInB1dEJlZm9yZSIsIl9rIiwiZW1wdHkiLCJzaXplIiwiX2xpbmtFbHRJbiIsImVsdCIsIl9saW5rRWx0T3V0IiwiaXRlbSIsImJlZm9yZSIsIkVycm9yIiwiYXBwZW5kIiwicmVtb3ZlIiwiZ2V0IiwiaGFzIiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwiaXRlciIsImNvbnRleHQiLCJpIiwiYiIsIkJSRUFLIiwiZmlyc3QiLCJmaXJzdFZhbHVlIiwibGFzdCIsImxhc3RWYWx1ZSIsIm1vdmVCZWZvcmUiLCJlbHRCZWZvcmUiLCJpbmRleE9mIiwicmV0IiwidiIsImsiLCJfY2hlY2tSZXAiLCJrZXlzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjO0FBQUNDLGFBQVcsRUFBQyxNQUFJQTtBQUFqQixDQUFkOztBQUFBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBQ0EsU0FBU0MsT0FBVCxDQUFpQkMsR0FBakIsRUFBc0JDLEtBQXRCLEVBQTZCQyxJQUE3QixFQUFtQ0MsSUFBbkMsRUFBeUM7QUFDdkMsU0FBTztBQUNMSCxPQUFHLEVBQUVBLEdBREE7QUFFTEMsU0FBSyxFQUFFQSxLQUZGO0FBR0xDLFFBQUksRUFBRUEsSUFIRDtBQUlMQyxRQUFJLEVBQUVBO0FBSkQsR0FBUDtBQU1EOztBQUVNLE1BQU1MLFdBQU4s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cyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFRoaXMgZmlsZSBkZWZpbmVzIGFuIG9yZGVyZWQgZGljdGlvbmFyeSBhYnN0cmFjdGlvbiB0aGF0IGlzIHVzZWZ1bCBmb3Jcbi8vIG1haW50YWluaW5nIGEgZGF0YXNldCBiYWNrZWQgYnkgb2JzZXJ2ZUNoYW5nZXMuICBJdCBzdXBwb3J0cyBvcmRlcmluZyBpdGVtc1xuLy8gYnkgc3BlY2lmeWluZyB0aGUgaXRlbSB0aGV5IG5vdyBjb21lIGJlZm9yZS5cblxuLy8gVGhlIGltcGxlbWVudGF0aW9uIGlzIGEgZGljdGlvbmFyeSB0aGF0IGNvbnRhaW5zIG5vZGVzIG9mIGEgZG91Ymx5LWxpbmtlZFxuLy8gbGlzdCBhcyBpdHMgdmFsdWVzLlxuXG4vLyBjb25zdHJ1Y3RzIGEgbmV3IGVsZW1lbnQgc3RydWN0XG4vLyBuZXh0IGFuZCBwcmV2IGFyZSB3aG9sZSBlbGVtZW50cywgbm90IGtleXMuXG5mdW5jdGlvbiBlbGVtZW50KGtleSwgdmFsdWUsIG5leHQsIHByZXYpIHtcbiAgcmV0dXJuIHtcbiAgICBrZXk6IGtleSxcbiAgICB2YWx1ZTogdmFsdWUsXG4gICAgbmV4dDogbmV4dCxcbiAgICBwcmV2OiBwcmV2XG4gIH07XG59XG5cbmV4cG9ydCBjbGFzcyBPcmRlcmVkRGljdCB7XG4gIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICB0aGlzLl9kaWN0ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB0aGlzLl9maXJzdCA9IG51bGw7XG4gICAgdGhpcy5fbGFzdCA9IG51bGw7XG4gICAgdGhpcy5fc2l6ZSA9IDA7XG5cbiAgICBpZiAodHlwZW9mIGFyZ3NbMF0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMuX3N0cmluZ2lmeSA9IGFyZ3Muc2hpZnQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fc3RyaW5naWZ5ID0gZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHg7IH07XG4gICAgfVxuXG4gICAgYXJncy5mb3JFYWNoKGt2ID0+IHRoaXMucHV0QmVmb3JlKGt2WzBdLCBrdlsxXSwgbnVsbCkpO1xuICB9XG5cbiAgLy8gdGhlIFwicHJlZml4IGtleXMgd2l0aCBhIHNwYWNlXCIgdGhpbmcgY29tZXMgZnJvbSBoZXJlXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kb2N1bWVudGNsb3VkL3VuZGVyc2NvcmUvaXNzdWVzLzM3NiNpc3N1ZWNvbW1lbnQtMjgxNTY0OVxuICBfayhrZXkpIHtcbiAgICByZXR1cm4gXCIgXCIgKyB0aGlzLl9zdHJpbmdpZnkoa2V5KTtcbiAgfVxuXG4gIGVtcHR5KCkge1xuICAgIHJldHVybiAhdGhpcy5fZmlyc3Q7XG4gIH1cblxuICBzaXplKCkge1xuICAgIHJldHVybiB0aGlzLl9zaXplO1xuICB9XG5cbiAgX2xpbmtFbHRJbihlbHQpIHtcbiAgICBpZiAoIWVsdC5uZXh0KSB7XG4gICAgICBlbHQucHJldiA9IHRoaXMuX2xhc3Q7XG4gICAgICBpZiAodGhpcy5fbGFzdClcbiAgICAgICAgdGhpcy5fbGFzdC5uZXh0ID0gZWx0O1xuICAgICAgdGhpcy5fbGFzdCA9IGVsdDtcbiAgICB9IGVsc2Uge1xuICAgICAgZWx0LnByZXYgPSBlbHQubmV4dC5wcmV2O1xuICAgICAgZWx0Lm5leHQucHJldiA9IGVsdDtcbiAgICAgIGlmIChlbHQucHJldilcbiAgICAgICAgZWx0LnByZXYubmV4dCA9IGVsdDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX2ZpcnN0ID09PSBudWxsIHx8IHRoaXMuX2ZpcnN0ID09PSBlbHQubmV4dClcbiAgICAgIHRoaXMuX2ZpcnN0ID0gZWx0O1xuICB9XG5cbiAgX2xpbmtFbHRPdXQoZWx0KSB7XG4gICAgaWYgKGVsdC5uZXh0KVxuICAgICAgZWx0Lm5leHQucHJldiA9IGVsdC5wcmV2O1xuICAgIGlmIChlbHQucHJldilcbiAgICAgIGVsdC5wcmV2Lm5leHQgPSBlbHQubmV4dDtcbiAgICBpZiAoZWx0ID09PSB0aGlzLl9sYXN0KVxuICAgICAgdGhpcy5fbGFzdCA9IGVsdC5wcmV2O1xuICAgIGlmIChlbHQgPT09IHRoaXMuX2ZpcnN0KVxuICAgICAgdGhpcy5fZmlyc3QgPSBlbHQubmV4dDtcbiAgfVxuXG4gIHB1dEJlZm9yZShrZXksIGl0ZW0sIGJlZm9yZSkge1xuICAgIGlmICh0aGlzLl9kaWN0W3RoaXMuX2soa2V5KV0pXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJdGVtIFwiICsga2V5ICsgXCIgYWxyZWFkeSBwcmVzZW50IGluIE9yZGVyZWREaWN0XCIpO1xuICAgIHZhciBlbHQgPSBiZWZvcmUgP1xuICAgICAgZWxlbWVudChrZXksIGl0ZW0sIHRoaXMuX2RpY3RbdGhpcy5fayhiZWZvcmUpXSkgOlxuICAgICAgZWxlbWVudChrZXksIGl0ZW0sIG51bGwpO1xuICAgIGlmICh0eXBlb2YgZWx0Lm5leHQgPT09IFwidW5kZWZpbmVkXCIpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjb3VsZCBub3QgZmluZCBpdGVtIHRvIHB1dCB0aGlzIG9uZSBiZWZvcmVcIik7XG4gICAgdGhpcy5fbGlua0VsdEluKGVsdCk7XG4gICAgdGhpcy5fZGljdFt0aGlzLl9rKGtleSldID0gZWx0O1xuICAgIHRoaXMuX3NpemUrKztcbiAgfVxuXG4gIGFwcGVuZChrZXksIGl0ZW0pIHtcbiAgICB0aGlzLnB1dEJlZm9yZShrZXksIGl0ZW0sIG51bGwpO1xuICB9XG5cbiAgcmVtb3ZlKGtleSkge1xuICAgIHZhciBlbHQgPSB0aGlzLl9kaWN0W3RoaXMuX2soa2V5KV07XG4gICAgaWYgKHR5cGVvZiBlbHQgPT09IFwidW5kZWZpbmVkXCIpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJdGVtIFwiICsga2V5ICsgXCIgbm90IHByZXNlbnQgaW4gT3JkZXJlZERpY3RcIik7XG4gICAgdGhpcy5fbGlua0VsdE91dChlbHQpO1xuICAgIHRoaXMuX3NpemUtLTtcbiAgICBkZWxldGUgdGhpcy5fZGljdFt0aGlzLl9rKGtleSldO1xuICAgIHJldHVybiBlbHQudmFsdWU7XG4gIH1cblxuICBnZXQoa2V5KSB7XG4gICAgaWYgKHRoaXMuaGFzKGtleSkpIHtcbiAgICAgIHJldHVybiB0aGlzLl9kaWN0W3RoaXMuX2soa2V5KV0udmFsdWU7XG4gICAgfVxuICB9XG5cbiAgaGFzKGtleSkge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoXG4gICAgICB0aGlzLl9kaWN0LFxuICAgICAgdGhpcy5fayhrZXkpXG4gICAgKTtcbiAgfVxuXG4gIC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgaXRlbXMgaW4gdGhpcyBkaWN0aW9uYXJ5IGluIG9yZGVyLCBjYWxsaW5nXG4gIC8vIGl0ZXIodmFsdWUsIGtleSwgaW5kZXgpIG9uIGVhY2ggb25lLlxuXG4gIC8vIFN0b3BzIHdoZW5ldmVyIGl0ZXIgcmV0dXJucyBPcmRlcmVkRGljdC5CUkVBSywgb3IgYWZ0ZXIgdGhlIGxhc3QgZWxlbWVudC5cbiAgZm9yRWFjaChpdGVyLCBjb250ZXh0ID0gbnVsbCkge1xuICAgIHZhciBpID0gMDtcbiAgICB2YXIgZWx0ID0gdGhpcy5fZmlyc3Q7XG4gICAgd2hpbGUgKGVsdCAhPT0gbnVsbCkge1xuICAgICAgdmFyIGIgPSBpdGVyLmNhbGwoY29udGV4dCwgZWx0LnZhbHVlLCBlbHQua2V5LCBpKTtcbiAgICAgIGlmIChiID09PSBPcmRlcmVkRGljdC5CUkVBSykgcmV0dXJuO1xuICAgICAgZWx0ID0gZWx0Lm5leHQ7XG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgZmlyc3QoKSB7XG4gICAgaWYgKHRoaXMuZW1wdHkoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fZmlyc3Qua2V5O1xuICB9XG5cbiAgZmlyc3RWYWx1ZSgpIHtcbiAgICBpZiAodGhpcy5lbXB0eSgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9maXJzdC52YWx1ZTtcbiAgfVxuXG4gIGxhc3QoKSB7XG4gICAgaWYgKHRoaXMuZW1wdHkoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fbGFzdC5rZXk7XG4gIH1cblxuICBsYXN0VmFsdWUoKSB7XG4gICAgaWYgKHRoaXMuZW1wdHkoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fbGFzdC52YWx1ZTtcbiAgfVxuXG4gIHByZXYoa2V5KSB7XG4gICAgaWYgKHRoaXMuaGFzKGtleSkpIHtcbiAgICAgIHZhciBlbHQgPSB0aGlzLl9kaWN0W3RoaXMuX2soa2V5KV07XG4gICAgICBpZiAoZWx0LnByZXYpXG4gICAgICAgIHJldHVybiBlbHQucHJldi5rZXk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgbmV4dChrZXkpIHtcbiAgICBpZiAodGhpcy5oYXMoa2V5KSkge1xuICAgICAgdmFyIGVsdCA9IHRoaXMuX2RpY3RbdGhpcy5fayhrZXkpXTtcbiAgICAgIGlmIChlbHQubmV4dClcbiAgICAgICAgcmV0dXJuIGVsdC5uZXh0LmtleTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBtb3ZlQmVmb3JlKGtleSwgYmVmb3JlKSB7XG4gICAgdmFyIGVsdCA9IHRoaXMuX2RpY3RbdGhpcy5fayhrZXkpXTtcbiAgICB2YXIgZWx0QmVmb3JlID0gYmVmb3JlID8gdGhpcy5fZGljdFt0aGlzLl9rKGJlZm9yZSldIDogbnVsbDtcbiAgICBpZiAodHlwZW9mIGVsdCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSXRlbSB0byBtb3ZlIGlzIG5vdCBwcmVzZW50XCIpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGVsdEJlZm9yZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IGZpbmQgZWxlbWVudCB0byBtb3ZlIHRoaXMgb25lIGJlZm9yZVwiKTtcbiAgICB9XG4gICAgaWYgKGVsdEJlZm9yZSA9PT0gZWx0Lm5leHQpIC8vIG5vIG1vdmluZyBuZWNlc3NhcnlcbiAgICAgIHJldHVybjtcbiAgICAvLyByZW1vdmUgZnJvbSBpdHMgb2xkIHBsYWNlXG4gICAgdGhpcy5fbGlua0VsdE91dChlbHQpO1xuICAgIC8vIHBhdGNoIGludG8gaXRzIG5ldyBwbGFjZVxuICAgIGVsdC5uZXh0ID0gZWx0QmVmb3JlO1xuICAgIHRoaXMuX2xpbmtFbHRJbihlbHQpO1xuICB9XG5cbiAgLy8gTGluZWFyLCBzYWRseS5cbiAgaW5kZXhPZihrZXkpIHtcbiAgICB2YXIgcmV0ID0gbnVsbDtcbiAgICB0aGlzLmZvckVhY2goKHYsIGssIGkpID0+IHtcbiAgICAgIGlmICh0aGlzLl9rKGspID09PSB0aGlzLl9rKGtleSkpIHtcbiAgICAgICAgcmV0ID0gaTtcbiAgICAgICAgcmV0dXJuIE9yZGVyZWREaWN0LkJSRUFLO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH0pO1xuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICBfY2hlY2tSZXAoKSB7XG4gICAgT2JqZWN0LmtleXModGhpcy5fZGljdCkuZm9yRWFjaChrID0+IHtcbiAgICAgIGNvbnN0IHYgPSB0aGlzLl9kaWN0W2tdO1xuICAgICAgaWYgKHYubmV4dCA9PT0gdikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOZXh0IGlzIGEgbG9vcFwiKTtcbiAgICAgIH1cbiAgICAgIGlmICh2LnByZXYgPT09IHYpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUHJldiBpcyBhIGxvb3BcIik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuT3JkZXJlZERpY3QuQlJFQUsgPSB7XCJicmVha1wiOiB0cnVlfTtcbiJdfQ==
