(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var IdMap = Package['id-map'].IdMap;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var idx, MaxHeap, MinHeap, MinMaxHeap;

var require = meteorInstall({"node_modules":{"meteor":{"binary-heap":{"binary-heap.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/binary-heap/binary-heap.js                                                                              //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.link("./max-heap.js", {
  MaxHeap: "MaxHeap"
}, 0);
module.link("./min-heap.js", {
  MinHeap: "MinHeap"
}, 1);
module.link("./min-max-heap.js", {
  MinMaxHeap: "MinMaxHeap"
}, 2);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"max-heap.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/binary-heap/max-heap.js                                                                                 //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  MaxHeap: () => MaxHeap
});

class MaxHeap {
  constructor(comparator, options = {}) {
    if (typeof comparator !== 'function') {
      throw new Error('Passed comparator is invalid, should be a comparison function');
    } // a C-style comparator that is given two values and returns a number,
    // negative if the first value is less than the second, positive if the second
    // value is greater than the first and zero if they are equal.


    this._comparator = comparator;

    if (!options.IdMap) {
      options.IdMap = IdMap;
    } // _heapIdx maps an id to an index in the Heap array the corresponding value
    // is located on.


    this._heapIdx = new options.IdMap(); // The Heap data-structure implemented as a 0-based contiguous array where
    // every item on index idx is a node in a complete binary tree. Every node can
    // have children on indexes idx*2+1 and idx*2+2, except for the leaves. Every
    // node has a parent on index (idx-1)/2;

    this._heap = []; // If the initial array is passed, we can build the heap in linear time
    // complexity (O(N)) compared to linearithmic time complexity (O(nlogn)) if
    // we push elements one by one.

    if (Array.isArray(options.initData)) {
      this._initFromData(options.initData);
    }
  } // Builds a new heap in-place in linear time based on passed data


  _initFromData(data) {
    this._heap = data.map(({
      id,
      value
    }) => ({
      id,
      value
    }));
    data.forEach(({
      id
    }, i) => this._heapIdx.set(id, i));

    if (!data.length) {
      return;
    } // start from the first non-leaf - the parent of the last leaf


    for (let i = parentIdx(data.length - 1); i >= 0; i--) {
      this._downHeap(i);
    }
  }

  _downHeap(idx) {
    while (leftChildIdx(idx) < this.size()) {
      const left = leftChildIdx(idx);
      const right = rightChildIdx(idx);
      let largest = idx;

      if (left < this.size()) {
        largest = this._maxIndex(largest, left);
      }

      if (right < this.size()) {
        largest = this._maxIndex(largest, right);
      }

      if (largest === idx) {
        break;
      }

      this._swap(largest, idx);

      idx = largest;
    }
  }

  _upHeap(idx) {
    while (idx > 0) {
      const parent = parentIdx(idx);

      if (this._maxIndex(parent, idx) === idx) {
        this._swap(parent, idx);

        idx = parent;
      } else {
        break;
      }
    }
  }

  _maxIndex(idxA, idxB) {
    const valueA = this._get(idxA);

    const valueB = this._get(idxB);

    return this._comparator(valueA, valueB) >= 0 ? idxA : idxB;
  } // Internal: gets raw data object placed on idxth place in heap


  _get(idx) {
    return this._heap[idx].value;
  }

  _swap(idxA, idxB) {
    const recA = this._heap[idxA];
    const recB = this._heap[idxB];

    this._heapIdx.set(recA.id, idxB);

    this._heapIdx.set(recB.id, idxA);

    this._heap[idxA] = recB;
    this._heap[idxB] = recA;
  }

  get(id) {
    return this.has(id) ? this._get(this._heapIdx.get(id)) : null;
  }

  set(id, value) {
    if (this.has(id)) {
      if (this.get(id) === value) {
        return;
      }

      const idx = this._heapIdx.get(id);

      this._heap[idx].value = value; // Fix the new value's position
      // Either bubble new value up if it is greater than its parent

      this._upHeap(idx); // or bubble it down if it is smaller than one of its children


      this._downHeap(idx);
    } else {
      this._heapIdx.set(id, this._heap.length);

      this._heap.push({
        id,
        value
      });

      this._upHeap(this._heap.length - 1);
    }
  }

  remove(id) {
    if (this.has(id)) {
      const last = this._heap.length - 1;

      const idx = this._heapIdx.get(id);

      if (idx !== last) {
        this._swap(idx, last);

        this._heap.pop();

        this._heapIdx.remove(id); // Fix the swapped value's position


        this._upHeap(idx);

        this._downHeap(idx);
      } else {
        this._heap.pop();

        this._heapIdx.remove(id);
      }
    }
  }

  has(id) {
    return this._heapIdx.has(id);
  }

  empty() {
    return !this.size();
  }

  clear() {
    this._heap = [];

    this._heapIdx.clear();
  } // iterate over values in no particular order


  forEach(iterator) {
    this._heap.forEach(obj => iterator(obj.value, obj.id));
  }

  size() {
    return this._heap.length;
  }

  setDefault(id, def) {
    if (this.has(id)) {
      return this.get(id);
    }

    this.set(id, def);
    return def;
  }

  clone() {
    const clone = new MaxHeap(this._comparator, this._heap);
    return clone;
  }

  maxElementId() {
    return this.size() ? this._heap[0].id : null;
  }

  _selfCheck() {
    for (let i = 1; i < this._heap.length; i++) {
      if (this._maxIndex(parentIdx(i), i) !== parentIdx(i)) {
        throw new Error(`An item with id ${this._heap[i].id}` + " has a parent younger than it: " + this._heap[parentIdx(i)].id);
      }
    }
  }

}

const leftChildIdx = i => i * 2 + 1;

const rightChildIdx = i => i * 2 + 2;

const parentIdx = i => i - 1 >> 1;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"min-heap.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/binary-heap/min-heap.js                                                                                 //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  MinHeap: () => MinHeap
});
let MaxHeap;
module.link("./max-heap.js", {
  MaxHeap(v) {
    MaxHeap = v;
  }

}, 0);

class MinHeap extends MaxHeap {
  constructor(comparator, options) {
    super((a, b) => -comparator(a, b), options);
  }

  maxElementId() {
    throw new Error("Cannot call maxElementId on MinHeap");
  }

  minElementId() {
    return super.maxElementId();
  }

}

;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"min-max-heap.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/binary-heap/min-max-heap.js                                                                             //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  MinMaxHeap: () => MinMaxHeap
});
let MaxHeap;
module.link("./max-heap.js", {
  MaxHeap(v) {
    MaxHeap = v;
  }

}, 0);
let MinHeap;
module.link("./min-heap.js", {
  MinHeap(v) {
    MinHeap = v;
  }

}, 1);

class MinMaxHeap extends MaxHeap {
  constructor(comparator, options) {
    super(comparator, options);
    this._minHeap = new MinHeap(comparator, options);
  }

  set(...args) {
    super.set(...args);

    this._minHeap.set(...args);
  }

  remove(...args) {
    super.remove(...args);

    this._minHeap.remove(...args);
  }

  clear(...args) {
    super.clear(...args);

    this._minHeap.clear(...args);
  }

  setDefault(...args) {
    super.setDefault(...args);
    return this._minHeap.setDefault(...args);
  }

  clone() {
    const clone = new MinMaxHeap(this._comparator, this._heap);
    return clone;
  }

  minElementId() {
    return this._minHeap.minElementId();
  }

}

;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/binary-heap/binary-heap.js");

/* Exports */
Package._define("binary-heap", exports, {
  MaxHeap: MaxHeap,
  MinHeap: MinHeap,
  MinMaxHeap: MinMaxHeap
});

})();

//# sourceURL=meteor://💻app/packages/binary-heap.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYmluYXJ5LWhlYXAvYmluYXJ5LWhlYXAuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2JpbmFyeS1oZWFwL21heC1oZWFwLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9iaW5hcnktaGVhcC9taW4taGVhcC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYmluYXJ5LWhlYXAvbWluLW1heC1oZWFwLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImxpbmsiLCJNYXhIZWFwIiwiTWluSGVhcCIsIk1pbk1heEhlYXAiLCJleHBvcnQiLCJjb25zdHJ1Y3RvciIsImNvbXBhcmF0b3IiLCJvcHRpb25zIiwiRXJyb3IiLCJfY29tcGFyYXRvciIsIklkTWFwIiwiX2hlYXBJZHgiLCJfaGVhcCIsIkFycmF5IiwiaXNBcnJheSIsImluaXREYXRhIiwiX2luaXRGcm9tRGF0YSIsImRhdGEiLCJtYXAiLCJpZCIsInZhbHVlIiwiZm9yRWFjaCIsImkiLCJzZXQiLCJsZW5ndGgiLCJwYXJlbnRJZHgiLCJfZG93bkhlYXAiLCJpZHgiLCJsZWZ0Q2hpbGRJZHgiLCJzaXplIiwibGVmdCIsInJpZ2h0IiwicmlnaHRDaGlsZElkeCIsImxhcmdlc3QiLCJfbWF4SW5kZXgiLCJfc3dhcCIsIl91cEhlYXAiLCJwYXJlbnQiLCJpZHhBIiwiaWR4QiIsInZhbHVlQSIsIl9nZXQiLCJ2YWx1ZUIiLCJyZWNBIiwicmVjQiIsImdldCIsImhhcyIsInB1c2giLCJyZW1vdmUiLCJsYXN0IiwicG9wIiwiZW1wdHkiLCJjbGVhciIsIml0ZXJhdG9yIiwib2JqIiwic2V0RGVmYXVsdCIsImRlZiIsImNsb25lIiwibWF4RWxlbWVudElkIiwiX3NlbGZDaGVjayIsInYiLCJhIiwiYiIsIm1pbkVsZW1lbnRJZCIsIl9taW5IZWFwIiwiYXJncyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsTUFBTSxD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IjoiL3BhY2thZ2VzL2JpbmFyeS1oZWFwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IHsgTWF4SGVhcCB9IGZyb20gJy4vbWF4LWhlYXAuanMnO1xuZXhwb3J0IHsgTWluSGVhcCB9IGZyb20gJy4vbWluLWhlYXAuanMnO1xuZXhwb3J0IHsgTWluTWF4SGVhcCB9IGZyb20gJy4vbWluLW1heC1oZWFwLmpzJztcbiIsIi8vIENvbnN0cnVjdG9yIG9mIEhlYXBcbi8vIC0gY29tcGFyYXRvciAtIEZ1bmN0aW9uIC0gZ2l2ZW4gdHdvIGl0ZW1zIHJldHVybnMgYSBudW1iZXJcbi8vIC0gb3B0aW9uczpcbi8vICAgLSBpbml0RGF0YSAtIEFycmF5IC0gT3B0aW9uYWwgLSB0aGUgaW5pdGlhbCBkYXRhIGluIGEgZm9ybWF0OlxuLy8gICAgICAgIE9iamVjdDpcbi8vICAgICAgICAgIC0gaWQgLSBTdHJpbmcgLSB1bmlxdWUgaWQgb2YgdGhlIGl0ZW1cbi8vICAgICAgICAgIC0gdmFsdWUgLSBBbnkgLSB0aGUgZGF0YSB2YWx1ZVxuLy8gICAgICBlYWNoIHZhbHVlIGlzIHJldGFpbmVkXG4vLyAgIC0gSWRNYXAgLSBDb25zdHJ1Y3RvciAtIE9wdGlvbmFsIC0gY3VzdG9tIElkTWFwIGNsYXNzIHRvIHN0b3JlIGlkLT5pbmRleFxuLy8gICAgICAgbWFwcGluZ3MgaW50ZXJuYWxseS4gU3RhbmRhcmQgSWRNYXAgaXMgdXNlZCBieSBkZWZhdWx0LlxuZXhwb3J0IGNsYXNzIE1heEhlYXAgeyBcbiAgY29uc3RydWN0b3IoY29tcGFyYXRvciwgb3B0aW9ucyA9IHt9KSB7XG4gICAgaWYgKHR5cGVvZiBjb21wYXJhdG9yICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Bhc3NlZCBjb21wYXJhdG9yIGlzIGludmFsaWQsIHNob3VsZCBiZSBhIGNvbXBhcmlzb24gZnVuY3Rpb24nKTtcbiAgICB9XG5cbiAgICAvLyBhIEMtc3R5bGUgY29tcGFyYXRvciB0aGF0IGlzIGdpdmVuIHR3byB2YWx1ZXMgYW5kIHJldHVybnMgYSBudW1iZXIsXG4gICAgLy8gbmVnYXRpdmUgaWYgdGhlIGZpcnN0IHZhbHVlIGlzIGxlc3MgdGhhbiB0aGUgc2Vjb25kLCBwb3NpdGl2ZSBpZiB0aGUgc2Vjb25kXG4gICAgLy8gdmFsdWUgaXMgZ3JlYXRlciB0aGFuIHRoZSBmaXJzdCBhbmQgemVybyBpZiB0aGV5IGFyZSBlcXVhbC5cbiAgICB0aGlzLl9jb21wYXJhdG9yID0gY29tcGFyYXRvcjtcblxuICAgIGlmICghIG9wdGlvbnMuSWRNYXApIHtcbiAgICAgIG9wdGlvbnMuSWRNYXAgPSBJZE1hcDtcbiAgICB9XG5cbiAgICAvLyBfaGVhcElkeCBtYXBzIGFuIGlkIHRvIGFuIGluZGV4IGluIHRoZSBIZWFwIGFycmF5IHRoZSBjb3JyZXNwb25kaW5nIHZhbHVlXG4gICAgLy8gaXMgbG9jYXRlZCBvbi5cbiAgICB0aGlzLl9oZWFwSWR4ID0gbmV3IG9wdGlvbnMuSWRNYXA7XG5cbiAgICAvLyBUaGUgSGVhcCBkYXRhLXN0cnVjdHVyZSBpbXBsZW1lbnRlZCBhcyBhIDAtYmFzZWQgY29udGlndW91cyBhcnJheSB3aGVyZVxuICAgIC8vIGV2ZXJ5IGl0ZW0gb24gaW5kZXggaWR4IGlzIGEgbm9kZSBpbiBhIGNvbXBsZXRlIGJpbmFyeSB0cmVlLiBFdmVyeSBub2RlIGNhblxuICAgIC8vIGhhdmUgY2hpbGRyZW4gb24gaW5kZXhlcyBpZHgqMisxIGFuZCBpZHgqMisyLCBleGNlcHQgZm9yIHRoZSBsZWF2ZXMuIEV2ZXJ5XG4gICAgLy8gbm9kZSBoYXMgYSBwYXJlbnQgb24gaW5kZXggKGlkeC0xKS8yO1xuICAgIHRoaXMuX2hlYXAgPSBbXTtcblxuICAgIC8vIElmIHRoZSBpbml0aWFsIGFycmF5IGlzIHBhc3NlZCwgd2UgY2FuIGJ1aWxkIHRoZSBoZWFwIGluIGxpbmVhciB0aW1lXG4gICAgLy8gY29tcGxleGl0eSAoTyhOKSkgY29tcGFyZWQgdG8gbGluZWFyaXRobWljIHRpbWUgY29tcGxleGl0eSAoTyhubG9nbikpIGlmXG4gICAgLy8gd2UgcHVzaCBlbGVtZW50cyBvbmUgYnkgb25lLlxuICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMuaW5pdERhdGEpKSB7XG4gICAgICB0aGlzLl9pbml0RnJvbURhdGEob3B0aW9ucy5pbml0RGF0YSk7XG4gICAgfVxuICB9XG5cbiAgLy8gQnVpbGRzIGEgbmV3IGhlYXAgaW4tcGxhY2UgaW4gbGluZWFyIHRpbWUgYmFzZWQgb24gcGFzc2VkIGRhdGFcbiAgX2luaXRGcm9tRGF0YShkYXRhKSB7XG4gICAgdGhpcy5faGVhcCA9IGRhdGEubWFwKCh7IGlkLCB2YWx1ZSB9KSA9PiAoeyBpZCwgdmFsdWUgfSkpO1xuXG4gICAgZGF0YS5mb3JFYWNoKCh7IGlkIH0sIGkpID0+IHRoaXMuX2hlYXBJZHguc2V0KGlkLCBpKSk7XG5cbiAgICBpZiAoISBkYXRhLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIHN0YXJ0IGZyb20gdGhlIGZpcnN0IG5vbi1sZWFmIC0gdGhlIHBhcmVudCBvZiB0aGUgbGFzdCBsZWFmXG4gICAgZm9yIChsZXQgaSA9IHBhcmVudElkeChkYXRhLmxlbmd0aCAtIDEpOyBpID49IDA7IGktLSkge1xuICAgICAgdGhpcy5fZG93bkhlYXAoaSk7XG4gICAgfVxuICB9XG5cbiAgX2Rvd25IZWFwKGlkeCkge1xuICAgIHdoaWxlIChsZWZ0Q2hpbGRJZHgoaWR4KSA8IHRoaXMuc2l6ZSgpKSB7XG4gICAgICBjb25zdCBsZWZ0ID0gbGVmdENoaWxkSWR4KGlkeCk7XG4gICAgICBjb25zdCByaWdodCA9IHJpZ2h0Q2hpbGRJZHgoaWR4KTtcbiAgICAgIGxldCBsYXJnZXN0ID0gaWR4O1xuXG4gICAgICBpZiAobGVmdCA8IHRoaXMuc2l6ZSgpKSB7XG4gICAgICAgIGxhcmdlc3QgPSB0aGlzLl9tYXhJbmRleChsYXJnZXN0LCBsZWZ0KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHJpZ2h0IDwgdGhpcy5zaXplKCkpIHtcbiAgICAgICAgbGFyZ2VzdCA9IHRoaXMuX21heEluZGV4KGxhcmdlc3QsIHJpZ2h0KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGxhcmdlc3QgPT09IGlkeCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgdGhpcy5fc3dhcChsYXJnZXN0LCBpZHgpO1xuICAgICAgaWR4ID0gbGFyZ2VzdDtcbiAgICB9XG4gIH1cblxuICBfdXBIZWFwKGlkeCkge1xuICAgIHdoaWxlIChpZHggPiAwKSB7XG4gICAgICBjb25zdCBwYXJlbnQgPSBwYXJlbnRJZHgoaWR4KTtcbiAgICAgIGlmICh0aGlzLl9tYXhJbmRleChwYXJlbnQsIGlkeCkgPT09IGlkeCkge1xuICAgICAgICB0aGlzLl9zd2FwKHBhcmVudCwgaWR4KVxuICAgICAgICBpZHggPSBwYXJlbnQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBfbWF4SW5kZXgoaWR4QSwgaWR4Qikge1xuICAgIGNvbnN0IHZhbHVlQSA9IHRoaXMuX2dldChpZHhBKTtcbiAgICBjb25zdCB2YWx1ZUIgPSB0aGlzLl9nZXQoaWR4Qik7XG4gICAgcmV0dXJuIHRoaXMuX2NvbXBhcmF0b3IodmFsdWVBLCB2YWx1ZUIpID49IDAgPyBpZHhBIDogaWR4QjtcbiAgfVxuXG4gIC8vIEludGVybmFsOiBnZXRzIHJhdyBkYXRhIG9iamVjdCBwbGFjZWQgb24gaWR4dGggcGxhY2UgaW4gaGVhcFxuICBfZ2V0KGlkeCkge1xuICAgIHJldHVybiB0aGlzLl9oZWFwW2lkeF0udmFsdWU7XG4gIH1cblxuICBfc3dhcChpZHhBLCBpZHhCKSB7XG4gICAgY29uc3QgcmVjQSA9IHRoaXMuX2hlYXBbaWR4QV07XG4gICAgY29uc3QgcmVjQiA9IHRoaXMuX2hlYXBbaWR4Ql07XG5cbiAgICB0aGlzLl9oZWFwSWR4LnNldChyZWNBLmlkLCBpZHhCKTtcbiAgICB0aGlzLl9oZWFwSWR4LnNldChyZWNCLmlkLCBpZHhBKTtcblxuICAgIHRoaXMuX2hlYXBbaWR4QV0gPSByZWNCO1xuICAgIHRoaXMuX2hlYXBbaWR4Ql0gPSByZWNBO1xuICB9XG5cbiAgZ2V0KGlkKSB7XG4gICAgcmV0dXJuIHRoaXMuaGFzKGlkKSA/XG4gICAgICB0aGlzLl9nZXQodGhpcy5faGVhcElkeC5nZXQoaWQpKSA6XG4gICAgICBudWxsO1xuICB9XG5cbiAgc2V0KGlkLCB2YWx1ZSkge1xuICAgIGlmICh0aGlzLmhhcyhpZCkpIHtcbiAgICAgIGlmICh0aGlzLmdldChpZCkgPT09IHZhbHVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgaWR4ID0gdGhpcy5faGVhcElkeC5nZXQoaWQpO1xuICAgICAgdGhpcy5faGVhcFtpZHhdLnZhbHVlID0gdmFsdWU7XG5cbiAgICAgIC8vIEZpeCB0aGUgbmV3IHZhbHVlJ3MgcG9zaXRpb25cbiAgICAgIC8vIEVpdGhlciBidWJibGUgbmV3IHZhbHVlIHVwIGlmIGl0IGlzIGdyZWF0ZXIgdGhhbiBpdHMgcGFyZW50XG4gICAgICB0aGlzLl91cEhlYXAoaWR4KTtcbiAgICAgIC8vIG9yIGJ1YmJsZSBpdCBkb3duIGlmIGl0IGlzIHNtYWxsZXIgdGhhbiBvbmUgb2YgaXRzIGNoaWxkcmVuXG4gICAgICB0aGlzLl9kb3duSGVhcChpZHgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9oZWFwSWR4LnNldChpZCwgdGhpcy5faGVhcC5sZW5ndGgpO1xuICAgICAgdGhpcy5faGVhcC5wdXNoKHsgaWQsIHZhbHVlIH0pO1xuICAgICAgdGhpcy5fdXBIZWFwKHRoaXMuX2hlYXAubGVuZ3RoIC0gMSk7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlKGlkKSB7XG4gICAgaWYgKHRoaXMuaGFzKGlkKSkge1xuICAgICAgY29uc3QgbGFzdCA9IHRoaXMuX2hlYXAubGVuZ3RoIC0gMTtcbiAgICAgIGNvbnN0IGlkeCA9IHRoaXMuX2hlYXBJZHguZ2V0KGlkKTtcblxuICAgICAgaWYgKGlkeCAhPT0gbGFzdCkge1xuICAgICAgICB0aGlzLl9zd2FwKGlkeCwgbGFzdCk7XG4gICAgICAgIHRoaXMuX2hlYXAucG9wKCk7XG4gICAgICAgIHRoaXMuX2hlYXBJZHgucmVtb3ZlKGlkKTtcblxuICAgICAgICAvLyBGaXggdGhlIHN3YXBwZWQgdmFsdWUncyBwb3NpdGlvblxuICAgICAgICB0aGlzLl91cEhlYXAoaWR4KTtcbiAgICAgICAgdGhpcy5fZG93bkhlYXAoaWR4KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2hlYXAucG9wKCk7XG4gICAgICAgIHRoaXMuX2hlYXBJZHgucmVtb3ZlKGlkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBoYXMoaWQpIHtcbiAgICByZXR1cm4gdGhpcy5faGVhcElkeC5oYXMoaWQpO1xuICB9XG5cbiAgZW1wdHkoKSB7XG4gICAgcmV0dXJuICF0aGlzLnNpemUoKTtcbiAgfVxuXG4gIGNsZWFyKCkge1xuICAgIHRoaXMuX2hlYXAgPSBbXTtcbiAgICB0aGlzLl9oZWFwSWR4LmNsZWFyKCk7XG4gIH1cblxuICAvLyBpdGVyYXRlIG92ZXIgdmFsdWVzIGluIG5vIHBhcnRpY3VsYXIgb3JkZXJcbiAgZm9yRWFjaChpdGVyYXRvcikge1xuICAgIHRoaXMuX2hlYXAuZm9yRWFjaChvYmogPT4gaXRlcmF0b3Iob2JqLnZhbHVlLCBvYmouaWQpKTtcbiAgfVxuXG4gIHNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2hlYXAubGVuZ3RoO1xuICB9XG5cbiAgc2V0RGVmYXVsdChpZCwgZGVmKSB7XG4gICAgaWYgKHRoaXMuaGFzKGlkKSkge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0KGlkKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldChpZCwgZGVmKTtcbiAgICByZXR1cm4gZGVmO1xuICB9XG5cbiAgY2xvbmUoKSB7XG4gICAgY29uc3QgY2xvbmUgPSBuZXcgTWF4SGVhcCh0aGlzLl9jb21wYXJhdG9yLCB0aGlzLl9oZWFwKTtcbiAgICByZXR1cm4gY2xvbmU7XG4gIH1cblxuICBtYXhFbGVtZW50SWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuc2l6ZSgpID8gdGhpcy5faGVhcFswXS5pZCA6IG51bGw7XG4gIH1cblxuICBfc2VsZkNoZWNrKCkge1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgdGhpcy5faGVhcC5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMuX21heEluZGV4KHBhcmVudElkeChpKSwgaSkgIT09IHBhcmVudElkeChpKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQW4gaXRlbSB3aXRoIGlkICR7dGhpcy5faGVhcFtpXS5pZH1gICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgaGFzIGEgcGFyZW50IHlvdW5nZXIgdGhhbiBpdDogXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9oZWFwW3BhcmVudElkeChpKV0uaWQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCBsZWZ0Q2hpbGRJZHggPSBpID0+IGkgKiAyICsgMTtcbmNvbnN0IHJpZ2h0Q2hpbGRJZHggPSBpID0+IGkgKiAyICsgMjtcbmNvbnN0IHBhcmVudElkeCA9IGkgPT4gKGkgLSAxKSA+PiAxO1xuIiwiaW1wb3J0IHsgTWF4SGVhcCB9IGZyb20gJy4vbWF4LWhlYXAuanMnO1xuXG5leHBvcnQgY2xhc3MgTWluSGVhcCBleHRlbmRzIE1heEhlYXAge1xuICBjb25zdHJ1Y3Rvcihjb21wYXJhdG9yLCBvcHRpb25zKSB7XG4gICAgc3VwZXIoKGEsIGIpID0+IC1jb21wYXJhdG9yKGEsIGIpLCBvcHRpb25zKTtcbiAgfVxuXG4gIG1heEVsZW1lbnRJZCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgY2FsbCBtYXhFbGVtZW50SWQgb24gTWluSGVhcFwiKTtcbiAgfVxuXG4gIG1pbkVsZW1lbnRJZCgpIHtcbiAgICByZXR1cm4gc3VwZXIubWF4RWxlbWVudElkKCk7XG4gIH1cbn07XG4iLCJpbXBvcnQgeyBNYXhIZWFwIH0gZnJvbSAnLi9tYXgtaGVhcC5qcyc7XG5pbXBvcnQgeyBNaW5IZWFwIH0gZnJvbSAnLi9taW4taGVhcC5qcyc7XG5cbi8vIFRoaXMgaW1wbGVtZW50YXRpb24gb2YgTWluL01heC1IZWFwIGlzIGp1c3QgYSBzdWJjbGFzcyBvZiBNYXgtSGVhcFxuLy8gd2l0aCBhIE1pbi1IZWFwIGFzIGFuIGVuY2Fwc3VsYXRlZCBwcm9wZXJ0eS5cbi8vXG4vLyBNb3N0IG9mIHRoZSBvcGVyYXRpb25zIGFyZSBqdXN0IHByb3h5IG1ldGhvZHMgdG8gY2FsbCB0aGUgc2FtZSBtZXRob2Qgb24gYm90aFxuLy8gaGVhcHMuXG4vL1xuLy8gVGhpcyBpbXBsZW1lbnRhdGlvbiB0YWtlcyAyKk4gbWVtb3J5IGJ1dCBpcyBmYWlybHkgc2ltcGxlIHRvIHdyaXRlIGFuZFxuLy8gdW5kZXJzdGFuZC4gQW5kIHRoZSBjb25zdGFudCBmYWN0b3Igb2YgYSBzaW1wbGUgSGVhcCBpcyB1c3VhbGx5IHNtYWxsZXJcbi8vIGNvbXBhcmVkIHRvIG90aGVyIHR3by13YXkgcHJpb3JpdHkgcXVldWVzIGxpa2UgTWluL01heCBIZWFwc1xuLy8gKGh0dHA6Ly93d3cuY3Mub3RhZ28uYWMubnovc3RhZmZwcml2L21pa2UvUGFwZXJzL01pbk1heEhlYXBzL01pbk1heEhlYXBzLnBkZilcbi8vIGFuZCBJbnRlcnZhbCBIZWFwc1xuLy8gKGh0dHA6Ly93d3cuY2lzZS51ZmwuZWR1L35zYWhuaS9kc2FhYy9lbnJpY2gvYzEzL2RvdWJsZS5odG0pXG5leHBvcnQgY2xhc3MgTWluTWF4SGVhcCBleHRlbmRzIE1heEhlYXAge1xuICBjb25zdHJ1Y3Rvcihjb21wYXJhdG9yLCBvcHRpb25zKSB7XG4gICAgc3VwZXIoY29tcGFyYXRvciwgb3B0aW9ucyk7XG4gICAgdGhpcy5fbWluSGVhcCA9IG5ldyBNaW5IZWFwKGNvbXBhcmF0b3IsIG9wdGlvbnMpO1xuICB9XG5cbiAgc2V0KC4uLmFyZ3MpIHtcbiAgICBzdXBlci5zZXQoLi4uYXJncyk7XG4gICAgdGhpcy5fbWluSGVhcC5zZXQoLi4uYXJncyk7XG4gIH1cblxuICByZW1vdmUoLi4uYXJncykge1xuICAgIHN1cGVyLnJlbW92ZSguLi5hcmdzKTtcbiAgICB0aGlzLl9taW5IZWFwLnJlbW92ZSguLi5hcmdzKTtcbiAgfVxuXG4gIGNsZWFyKC4uLmFyZ3MpIHtcbiAgICBzdXBlci5jbGVhciguLi5hcmdzKTtcbiAgICB0aGlzLl9taW5IZWFwLmNsZWFyKC4uLmFyZ3MpO1xuICB9XG5cbiAgc2V0RGVmYXVsdCguLi5hcmdzKSB7XG4gICAgc3VwZXIuc2V0RGVmYXVsdCguLi5hcmdzKTtcbiAgICByZXR1cm4gdGhpcy5fbWluSGVhcC5zZXREZWZhdWx0KC4uLmFyZ3MpO1xuICB9XG5cbiAgY2xvbmUoKSB7XG4gICAgY29uc3QgY2xvbmUgPSBuZXcgTWluTWF4SGVhcCh0aGlzLl9jb21wYXJhdG9yLCB0aGlzLl9oZWFwKTtcbiAgICByZXR1cm4gY2xvbmU7XG4gIH1cblxuICBtaW5FbGVtZW50SWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX21pbkhlYXAubWluRWxlbWVudElkKCk7XG4gIH1cblxufTtcbiJdfQ==
