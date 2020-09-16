(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Random = Package.random.Random;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Retry;

var require = meteorInstall({"node_modules":{"meteor":{"retry":{"retry.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// packages/retry/retry.js                                                   //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
                                                                             //
module.export({
  Retry: () => Retry
});

class Retry {
  constructor({
    baseTimeout = 1000,
    exponent = 2.2,
    // The default is high-ish to ensure a server can recover from a
    // failure caused by load.
    maxTimeout = 5 * 60 * 1000,
    minTimeout = 10,
    minCount = 2,
    fuzz = 0.5
  } = {}) {
    this.baseTimeout = baseTimeout;
    this.exponent = exponent;
    this.maxTimeout = maxTimeout;
    this.minTimeout = minTimeout;
    this.minCount = minCount;
    this.fuzz = fuzz;
    this.retryTimer = null;
  } // Reset a pending retry, if any.


  clear() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    this.retryTimer = null;
  } // Calculate how long to wait in milliseconds to retry, based on the
  // `count` of which retry this is.


  _timeout(count) {
    if (count < this.minCount) {
      return this.minTimeout;
    } // fuzz the timeout randomly, to avoid reconnect storms when a
    // server goes down.


    var timeout = Math.min(this.maxTimeout, this.baseTimeout * Math.pow(this.exponent, count)) * (Random.fraction() * this.fuzz + (1 - this.fuzz / 2));
    return timeout;
  } // Call `fn` after a delay, based on the `count` of which retry this is.


  retryLater(count, fn) {
    var timeout = this._timeout(count);

    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = Meteor.setTimeout(fn, timeout);
    return timeout;
  }

}
///////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/retry/retry.js");

/* Exports */
Package._define("retry", exports, {
  Retry: Retry
});

})();

//# sourceURL=meteor://💻app/packages/retry.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcmV0cnkvcmV0cnkuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiUmV0cnkiLCJjb25zdHJ1Y3RvciIsImJhc2VUaW1lb3V0IiwiZXhwb25lbnQiLCJtYXhUaW1lb3V0IiwibWluVGltZW91dCIsIm1pbkNvdW50IiwiZnV6eiIsInJldHJ5VGltZXIiLCJjbGVhciIsImNsZWFyVGltZW91dCIsIl90aW1lb3V0IiwiY291bnQiLCJ0aW1lb3V0IiwiTWF0aCIsIm1pbiIsInBvdyIsIlJhbmRvbSIsImZyYWN0aW9uIiwicmV0cnlMYXRlciIsImZuIiwiTWV0ZW9yIiwic2V0VGltZW91dCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsTUFBTSxDQUFDQyxNQUFQLENBQWM7QUFBQ0MsT0FBSyxFQUFDLE1BQUlBO0FBQVgsQ0FBZDs7QUFVTyxNQUFNQSxLQUFOLENBQVk7QUFDakJDLGFBQVcsQ0FBQztBQUNWQyxlQUFXLEdBQUcsSUFESjtBQUVWQyxZQUFRLEdBQUcsR0FGRDtBQUdWO0FBQ0E7QUFDQUMsY0FBVSxHQUFHLElBQUksRUFBSixHQUFTLElBTFo7QUFNVkMsY0FBVSxHQUFHLEVBTkg7QUFPVkMsWUFBUSxHQUFHLENBUEQ7QUFRVkMsUUFBSSxHQUFHO0FBUkcsTUFTUixFQVRPLEVBU0g7QUFDTixTQUFLTCxXQUFMLEdBQW1CQSxXQUFuQjtBQUNBLFNBQUtDLFFBQUwsR0FBZ0JBLFFBQWhCO0FBQ0EsU0FBS0MsVUFBTCxHQUFrQkEsVUFBbEI7QUFDQSxTQUFLQyxVQUFMLEdBQWtCQSxVQUFsQjtBQUNBLFNBQUtDLFFBQUwsR0FBZ0JBLFFBQWhCO0FBQ0EsU0FBS0MsSUFBTCxHQUFZQSxJQUFaO0FBQ0EsU0FBS0MsVUFBTCxHQUFrQixJQUFsQjtBQUNELEdBbEJnQixDQW9CakI7OztBQUNBQyxPQUFLLEdBQUc7QUFDTixRQUFJLEtBQUtELFVBQVQsRUFBcUI7QUFDbkJFLGtCQUFZLENBQUMsS0FBS0YsVUFBTixDQUFaO0FBQ0Q7O0FBQ0QsU0FBS0EsVUFBTCxHQUFrQixJQUFsQjtBQUNELEdBMUJnQixDQTRCakI7QUFDQTs7O0FBQ0FHLFVBQVEsQ0FBQ0MsS0FBRCxFQUFRO0FBQ2QsUUFBSUEsS0FBSyxHQUFHLEtBQUtOLFFBQWpCLEVBQTJCO0FBQ3pCLGFBQU8sS0FBS0QsVUFBWjtBQUNELEtBSGEsQ0FLZDtBQUNBOzs7QUFDQSxRQUFJUSxPQUFPLEdBQUdDLElBQUksQ0FBQ0MsR0FBTCxDQUNaLEtBQUtYLFVBRE8sRUFFWixLQUFLRixXQUFMLEdBQW1CWSxJQUFJLENBQUNFLEdBQUwsQ0FBUyxLQUFLYixRQUFkLEVBQXdCUyxLQUF4QixDQUZQLEtBSVpLLE1BQU0sQ0FBQ0MsUUFBUCxLQUFvQixLQUFLWCxJQUF6QixJQUFpQyxJQUFJLEtBQUtBLElBQUwsR0FBWSxDQUFqRCxDQUpZLENBQWQ7QUFPQSxXQUFPTSxPQUFQO0FBQ0QsR0E3Q2dCLENBK0NqQjs7O0FBQ0FNLFlBQVUsQ0FBQ1AsS0FBRCxFQUFRUSxFQUFSLEVBQVk7QUFDcEIsUUFBSVAsT0FBTyxHQUFHLEtBQUtGLFFBQUwsQ0FBY0MsS0FBZCxDQUFkOztBQUNBLFFBQUksS0FBS0osVUFBVCxFQUNFRSxZQUFZLENBQUMsS0FBS0YsVUFBTixDQUFaO0FBQ0YsU0FBS0EsVUFBTCxHQUFrQmEsTUFBTSxDQUFDQyxVQUFQLENBQWtCRixFQUFsQixFQUFzQlAsT0FBdEIsQ0FBbEI7QUFDQSxXQUFPQSxPQUFQO0FBQ0Q7O0FBdERnQixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9yZXRyeS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFJldHJ5IGxvZ2ljIHdpdGggYW4gZXhwb25lbnRpYWwgYmFja29mZi5cbi8vXG4vLyBvcHRpb25zOlxuLy8gIGJhc2VUaW1lb3V0OiB0aW1lIGZvciBpbml0aWFsIHJlY29ubmVjdCBhdHRlbXB0IChtcykuXG4vLyAgZXhwb25lbnQ6IGV4cG9uZW50aWFsIGZhY3RvciB0byBpbmNyZWFzZSB0aW1lb3V0IGVhY2ggYXR0ZW1wdC5cbi8vICBtYXhUaW1lb3V0OiBtYXhpbXVtIHRpbWUgYmV0d2VlbiByZXRyaWVzIChtcykuXG4vLyAgbWluQ291bnQ6IGhvdyBtYW55IHRpbWVzIHRvIHJlY29ubmVjdCBcImluc3RhbnRseVwiLlxuLy8gIG1pblRpbWVvdXQ6IHRpbWUgdG8gd2FpdCBmb3IgdGhlIGZpcnN0IGBtaW5Db3VudGAgcmV0cmllcyAobXMpLlxuLy8gIGZ1eno6IGZhY3RvciB0byByYW5kb21pemUgcmV0cnkgdGltZXMgYnkgKHRvIGF2b2lkIHJldHJ5IHN0b3JtcykuXG5cbmV4cG9ydCBjbGFzcyBSZXRyeSB7XG4gIGNvbnN0cnVjdG9yKHtcbiAgICBiYXNlVGltZW91dCA9IDEwMDAsXG4gICAgZXhwb25lbnQgPSAyLjIsXG4gICAgLy8gVGhlIGRlZmF1bHQgaXMgaGlnaC1pc2ggdG8gZW5zdXJlIGEgc2VydmVyIGNhbiByZWNvdmVyIGZyb20gYVxuICAgIC8vIGZhaWx1cmUgY2F1c2VkIGJ5IGxvYWQuXG4gICAgbWF4VGltZW91dCA9IDUgKiA2MCAqIDEwMDAsXG4gICAgbWluVGltZW91dCA9IDEwLFxuICAgIG1pbkNvdW50ID0gMixcbiAgICBmdXp6ID0gMC41LFxuICB9ID0ge30pIHtcbiAgICB0aGlzLmJhc2VUaW1lb3V0ID0gYmFzZVRpbWVvdXQ7XG4gICAgdGhpcy5leHBvbmVudCA9IGV4cG9uZW50O1xuICAgIHRoaXMubWF4VGltZW91dCA9IG1heFRpbWVvdXQ7XG4gICAgdGhpcy5taW5UaW1lb3V0ID0gbWluVGltZW91dDtcbiAgICB0aGlzLm1pbkNvdW50ID0gbWluQ291bnQ7XG4gICAgdGhpcy5mdXp6ID0gZnV6ejtcbiAgICB0aGlzLnJldHJ5VGltZXIgPSBudWxsO1xuICB9XG5cbiAgLy8gUmVzZXQgYSBwZW5kaW5nIHJldHJ5LCBpZiBhbnkuXG4gIGNsZWFyKCkge1xuICAgIGlmICh0aGlzLnJldHJ5VGltZXIpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnJldHJ5VGltZXIpO1xuICAgIH1cbiAgICB0aGlzLnJldHJ5VGltZXIgPSBudWxsO1xuICB9XG5cbiAgLy8gQ2FsY3VsYXRlIGhvdyBsb25nIHRvIHdhaXQgaW4gbWlsbGlzZWNvbmRzIHRvIHJldHJ5LCBiYXNlZCBvbiB0aGVcbiAgLy8gYGNvdW50YCBvZiB3aGljaCByZXRyeSB0aGlzIGlzLlxuICBfdGltZW91dChjb3VudCkge1xuICAgIGlmIChjb3VudCA8IHRoaXMubWluQ291bnQpIHtcbiAgICAgIHJldHVybiB0aGlzLm1pblRpbWVvdXQ7XG4gICAgfVxuXG4gICAgLy8gZnV6eiB0aGUgdGltZW91dCByYW5kb21seSwgdG8gYXZvaWQgcmVjb25uZWN0IHN0b3JtcyB3aGVuIGFcbiAgICAvLyBzZXJ2ZXIgZ29lcyBkb3duLlxuICAgIHZhciB0aW1lb3V0ID0gTWF0aC5taW4oXG4gICAgICB0aGlzLm1heFRpbWVvdXQsXG4gICAgICB0aGlzLmJhc2VUaW1lb3V0ICogTWF0aC5wb3codGhpcy5leHBvbmVudCwgY291bnQpXG4gICAgKSAqIChcbiAgICAgIFJhbmRvbS5mcmFjdGlvbigpICogdGhpcy5mdXp6ICsgKDEgLSB0aGlzLmZ1enogLyAyKVxuICAgICk7XG5cbiAgICByZXR1cm4gdGltZW91dDtcbiAgfVxuXG4gIC8vIENhbGwgYGZuYCBhZnRlciBhIGRlbGF5LCBiYXNlZCBvbiB0aGUgYGNvdW50YCBvZiB3aGljaCByZXRyeSB0aGlzIGlzLlxuICByZXRyeUxhdGVyKGNvdW50LCBmbikge1xuICAgIHZhciB0aW1lb3V0ID0gdGhpcy5fdGltZW91dChjb3VudCk7XG4gICAgaWYgKHRoaXMucmV0cnlUaW1lcilcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnJldHJ5VGltZXIpO1xuICAgIHRoaXMucmV0cnlUaW1lciA9IE1ldGVvci5zZXRUaW1lb3V0KGZuLCB0aW1lb3V0KTtcbiAgICByZXR1cm4gdGltZW91dDtcbiAgfVxufVxuIl19
