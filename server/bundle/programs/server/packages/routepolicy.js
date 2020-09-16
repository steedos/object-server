(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var _ = Package.underscore._;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var RoutePolicy;

var require = meteorInstall({"node_modules":{"meteor":{"routepolicy":{"main.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/routepolicy/main.js                                                                                //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
module.export({
  RoutePolicy: () => RoutePolicy
});
let RoutePolicyConstructor;
module.link("./routepolicy", {
  default(v) {
    RoutePolicyConstructor = v;
  }

}, 0);
const RoutePolicy = new RoutePolicyConstructor();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"routepolicy.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/routepolicy/routepolicy.js                                                                         //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
module.export({
  default: () => RoutePolicy
});

class RoutePolicy {
  constructor() {
    // maps prefix to a type
    this.urlPrefixTypes = {};
  }

  urlPrefixMatches(urlPrefix, url) {
    return url.startsWith(urlPrefix);
  }

  checkType(type) {
    if (!['network', 'static-online'].includes(type)) {
      return 'the route type must be "network" or "static-online"';
    }

    return null;
  }

  checkUrlPrefix(urlPrefix, type) {
    if (!urlPrefix.startsWith('/')) {
      return 'a route URL prefix must begin with a slash';
    }

    if (urlPrefix === '/') {
      return 'a route URL prefix cannot be /';
    }

    const existingType = this.urlPrefixTypes[urlPrefix];

    if (existingType && existingType !== type) {
      return `the route URL prefix ${urlPrefix} has already been declared ` + `to be of type ${existingType}`;
    }

    return null;
  }

  checkForConflictWithStatic(urlPrefix, type, _testManifest) {
    if (type === 'static-online') {
      return null;
    }

    const policy = this;

    function check(manifest) {
      const conflict = manifest.find(resource => resource.type === 'static' && resource.where === 'client' && policy.urlPrefixMatches(urlPrefix, resource.url));

      if (conflict) {
        return `static resource ${conflict.url} conflicts with ${type} ` + `route ${urlPrefix}`;
      }

      return null;
    }

    ;

    if (_testManifest) {
      return check(_testManifest);
    }

    const {
      WebApp
    } = require("meteor/webapp");

    let errorMessage = null;
    Object.keys(WebApp.clientPrograms).some(arch => {
      const {
        manifest
      } = WebApp.clientPrograms[arch];
      return errorMessage = check(manifest);
    });
    return errorMessage;
  }

  declare(urlPrefix, type) {
    const problem = this.checkType(type) || this.checkUrlPrefix(urlPrefix, type) || this.checkForConflictWithStatic(urlPrefix, type);

    if (problem) {
      throw new Error(problem);
    } // TODO overlapping prefixes, e.g. /foo/ and /foo/bar/


    this.urlPrefixTypes[urlPrefix] = type;
  }

  isValidUrl(url) {
    return url.startsWith('/');
  }

  classify(url) {
    if (!this.isValidUrl(url)) {
      throw new Error(`url must be a relative URL: ${url}`);
    }

    const prefix = Object.keys(this.urlPrefixTypes).find(prefix => this.urlPrefixMatches(prefix, url));
    return prefix ? this.urlPrefixTypes[prefix] : null;
  }

  urlPrefixesFor(type) {
    return Object.entries(this.urlPrefixTypes).filter(([_prefix, _type]) => _type === type).map(([_prefix]) => _prefix).sort();
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/routepolicy/main.js");

/* Exports */
Package._define("routepolicy", exports, {
  RoutePolicy: RoutePolicy
});

})();

//# sourceURL=meteor://💻app/packages/routepolicy.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm91dGVwb2xpY3kvbWFpbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm91dGVwb2xpY3kvcm91dGVwb2xpY3kuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiUm91dGVQb2xpY3kiLCJSb3V0ZVBvbGljeUNvbnN0cnVjdG9yIiwibGluayIsImRlZmF1bHQiLCJ2IiwiY29uc3RydWN0b3IiLCJ1cmxQcmVmaXhUeXBlcyIsInVybFByZWZpeE1hdGNoZXMiLCJ1cmxQcmVmaXgiLCJ1cmwiLCJzdGFydHNXaXRoIiwiY2hlY2tUeXBlIiwidHlwZSIsImluY2x1ZGVzIiwiY2hlY2tVcmxQcmVmaXgiLCJleGlzdGluZ1R5cGUiLCJjaGVja0ZvckNvbmZsaWN0V2l0aFN0YXRpYyIsIl90ZXN0TWFuaWZlc3QiLCJwb2xpY3kiLCJjaGVjayIsIm1hbmlmZXN0IiwiY29uZmxpY3QiLCJmaW5kIiwicmVzb3VyY2UiLCJ3aGVyZSIsIldlYkFwcCIsInJlcXVpcmUiLCJlcnJvck1lc3NhZ2UiLCJPYmplY3QiLCJrZXlzIiwiY2xpZW50UHJvZ3JhbXMiLCJzb21lIiwiYXJjaCIsImRlY2xhcmUiLCJwcm9ibGVtIiwiRXJyb3IiLCJpc1ZhbGlkVXJsIiwiY2xhc3NpZnkiLCJwcmVmaXgiLCJ1cmxQcmVmaXhlc0ZvciIsImVudHJpZXMiLCJmaWx0ZXIiLCJfcHJlZml4IiwiX3R5cGUiLCJtYXAiLCJzb3J0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxNQUFNLENBQUNDLE1BQVAsQ0FBYztBQUFDQyxhQUFXLEVBQUMsTUFBSUE7QUFBakIsQ0FBZDtBQUE2QyxJQUFJQyxzQkFBSjtBQUEyQkgsTUFBTSxDQUFDSSxJQUFQLENBQVksZUFBWixFQUE0QjtBQUFDQyxTQUFPLENBQUNDLENBQUQsRUFBRztBQUFDSCwwQkFBc0IsR0FBQ0csQ0FBdkI7QUFBeUI7O0FBQXJDLENBQTVC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SSxJQUEzQyxDQUhGOztBQUlBLFFBQUlzQixPQUFKLEVBQWE7QUFDWCxZQUFNLElBQUlDLEtBQUosQ0FBVUQsT0FBVixDQUFOO0FBQ0QsS0FQc0IsQ0FRdkI7OztBQUNBLFNBQUs1QixjQUFMLENBQW9CRSxTQUFwQixJQUFpQ0ksSUFBakM7QUFDRDs7QUFFRHdCLFlBQVUsQ0FBQzNCLEdBQUQsRUFBTTtBQUNkLFdBQU9BLEdBQUcsQ0FBQ0MsVUFBSixDQUFlLEdBQWYsQ0FBUDtBQUNEOztBQUVEMkIsVUFBUSxDQUFDNUIsR0FBRCxFQUFNO0FBQ1osUUFBSSxDQUFDLEtBQUsyQixVQUFMLENBQWdCM0IsR0FBaEIsQ0FBTCxFQUEyQjtBQUN6QixZQUFNLElBQUkwQixLQUFKLENBQVcsK0JBQThCMUIsR0FBSSxFQUE3QyxDQUFOO0FBQ0Q7O0FBRUQsVUFBTTZCLE1BQU0sR0FBR1YsTUFBTSxDQUFDQyxJQUFQLENBQVksS0FBS3ZCLGNBQWpCLEVBQWlDZ0IsSUFBakMsQ0FBc0NnQixNQUFNLElBQ3pELEtBQUsvQixnQkFBTCxDQUFzQitCLE1BQXRCLEVBQThCN0IsR0FBOUIsQ0FEYSxDQUFmO0FBSUEsV0FBTzZCLE1BQU0sR0FBRyxLQUFLaEMsY0FBTCxDQUFvQmdDLE1BQXBCLENBQUgsR0FBaUMsSUFBOUM7QUFDRDs7QUFFREMsZ0JBQWMsQ0FBQzNCLElBQUQsRUFBTztBQUNuQixXQUFPZ0IsTUFBTSxDQUFDWSxPQUFQLENBQWUsS0FBS2xDLGNBQXBCLEVBQ0ptQyxNQURJLENBQ0csQ0FBQyxDQUFDQyxPQUFELEVBQVVDLEtBQVYsQ0FBRCxLQUFzQkEsS0FBSyxLQUFLL0IsSUFEbkMsRUFFSmdDLEdBRkksQ0FFQSxDQUFDLENBQUNGLE9BQUQsQ0FBRCxLQUFlQSxPQUZmLEVBR0pHLElBSEksRUFBUDtBQUlEOztBQXpHOEIsQyIsImZpbGUiOiIvcGFja2FnZXMvcm91dGVwb2xpY3kuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkZWZhdWx0IGFzIFJvdXRlUG9saWN5Q29uc3RydWN0b3IgfSBmcm9tICcuL3JvdXRlcG9saWN5JztcbmV4cG9ydCBjb25zdCBSb3V0ZVBvbGljeSA9IG5ldyBSb3V0ZVBvbGljeUNvbnN0cnVjdG9yKCk7XG4iLCIvLyBJbiBhZGRpdGlvbiB0byBsaXN0aW5nIHNwZWNpZmljIGZpbGVzIHRvIGJlIGNhY2hlZCwgdGhlIGJyb3dzZXJcbi8vIGFwcGxpY2F0aW9uIGNhY2hlIG1hbmlmZXN0IGFsbG93cyBVUkxzIHRvIGJlIGRlc2lnbmF0ZWQgYXMgTkVUV09SS1xuLy8gKGFsd2F5cyBmZXRjaGVkIGZyb20gdGhlIEludGVybmV0KSBhbmQgRkFMTEJBQ0sgKHdoaWNoIHdlIHVzZSB0b1xuLy8gc2VydmUgYXBwIEhUTUwgb24gYXJiaXRyYXJ5IFVSTHMpLlxuLy9cbi8vIFRoZSBsaW1pdGF0aW9uIG9mIHRoZSBtYW5pZmVzdCBmaWxlIGZvcm1hdCBpcyB0aGF0IHRoZSBkZXNpZ25hdGlvbnNcbi8vIGFyZSBieSBwcmVmaXggb25seTogaWYgXCIvZm9vXCIgaXMgZGVjbGFyZWQgTkVUV09SSyB0aGVuIFwiL2Zvb2JhclwiXG4vLyB3aWxsIGFsc28gYmUgdHJlYXRlZCBhcyBhIG5ldHdvcmsgcm91dGUuXG4vL1xuLy8gUm91dGVQb2xpY3kgaXMgYSBsb3ctbGV2ZWwgQVBJIGZvciBkZWNsYXJpbmcgdGhlIHJvdXRlIHR5cGUgb2YgVVJMIHByZWZpeGVzOlxuLy9cbi8vIFwibmV0d29ya1wiOiBmb3IgbmV0d29yayByb3V0ZXMgdGhhdCBzaG91bGQgbm90IGNvbmZsaWN0IHdpdGggc3RhdGljXG4vLyByZXNvdXJjZXMuICAoRm9yIGV4YW1wbGUsIGlmIFwiL3NvY2tqcy9cIiBpcyBhIG5ldHdvcmsgcm91dGUsIHdlXG4vLyBzaG91bGRuJ3QgaGF2ZSBcIi9zb2NranMvcmVkLXNvY2suanBnXCIgYXMgYSBzdGF0aWMgcmVzb3VyY2UpLlxuLy9cbi8vIFwic3RhdGljLW9ubGluZVwiOiBmb3Igc3RhdGljIHJlc291cmNlcyB3aGljaCBzaG91bGQgbm90IGJlIGNhY2hlZCBpblxuLy8gdGhlIGFwcCBjYWNoZS4gIFRoaXMgaXMgaW1wbGVtZW50ZWQgYnkgYWxzbyBhZGRpbmcgdGhlbSB0byB0aGVcbi8vIE5FVFdPUksgc2VjdGlvbiAoYXMgb3RoZXJ3aXNlIHRoZSBicm93c2VyIHdvdWxkIHJlY2VpdmUgYXBwIEhUTUxcbi8vIGZvciB0aGVtIGJlY2F1c2Ugb2YgdGhlIEZBTExCQUNLIHNlY3Rpb24pLCBidXQgc3RhdGljLW9ubGluZSByb3V0ZXNcbi8vIGRvbid0IG5lZWQgdG8gYmUgY2hlY2tlZCBmb3IgY29uZmxpY3Qgd2l0aCBzdGF0aWMgcmVzb3VyY2VzLlxuXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJvdXRlUG9saWN5IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLy8gbWFwcyBwcmVmaXggdG8gYSB0eXBlXG4gICAgdGhpcy51cmxQcmVmaXhUeXBlcyA9IHt9O1xuICB9XG5cbiAgdXJsUHJlZml4TWF0Y2hlcyh1cmxQcmVmaXgsIHVybCkge1xuICAgIHJldHVybiB1cmwuc3RhcnRzV2l0aCh1cmxQcmVmaXgpO1xuICB9XG5cbiAgY2hlY2tUeXBlKHR5cGUpIHtcbiAgICBpZiAoIVsnbmV0d29yaycsICdzdGF0aWMtb25saW5lJ10uaW5jbHVkZXModHlwZSkpIHtcbiAgICAgIHJldHVybiAndGhlIHJvdXRlIHR5cGUgbXVzdCBiZSBcIm5ldHdvcmtcIiBvciBcInN0YXRpYy1vbmxpbmVcIic7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY2hlY2tVcmxQcmVmaXgodXJsUHJlZml4LCB0eXBlKSB7XG4gICAgaWYgKCF1cmxQcmVmaXguc3RhcnRzV2l0aCgnLycpKSB7XG4gICAgICByZXR1cm4gJ2Egcm91dGUgVVJMIHByZWZpeCBtdXN0IGJlZ2luIHdpdGggYSBzbGFzaCc7XG4gICAgfVxuXG4gICAgaWYgKHVybFByZWZpeCA9PT0gJy8nKSB7XG4gICAgICByZXR1cm4gJ2Egcm91dGUgVVJMIHByZWZpeCBjYW5ub3QgYmUgLyc7XG4gICAgfVxuXG4gICAgY29uc3QgZXhpc3RpbmdUeXBlID0gdGhpcy51cmxQcmVmaXhUeXBlc1t1cmxQcmVmaXhdO1xuICAgIGlmIChleGlzdGluZ1R5cGUgJiYgZXhpc3RpbmdUeXBlICE9PSB0eXBlKSB7XG4gICAgICByZXR1cm4gYHRoZSByb3V0ZSBVUkwgcHJlZml4ICR7dXJsUHJlZml4fSBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkIGAgK1xuICAgICAgICBgdG8gYmUgb2YgdHlwZSAke2V4aXN0aW5nVHlwZX1gO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY2hlY2tGb3JDb25mbGljdFdpdGhTdGF0aWModXJsUHJlZml4LCB0eXBlLCBfdGVzdE1hbmlmZXN0KSB7XG4gICAgaWYgKHR5cGUgPT09ICdzdGF0aWMtb25saW5lJykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgcG9saWN5ID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGNoZWNrKG1hbmlmZXN0KSB7XG4gICAgICBjb25zdCBjb25mbGljdCA9IG1hbmlmZXN0LmZpbmQocmVzb3VyY2UgPT4gKFxuICAgICAgICByZXNvdXJjZS50eXBlID09PSAnc3RhdGljJyAmJlxuICAgICAgICByZXNvdXJjZS53aGVyZSA9PT0gJ2NsaWVudCcgJiZcbiAgICAgICAgcG9saWN5LnVybFByZWZpeE1hdGNoZXModXJsUHJlZml4LCByZXNvdXJjZS51cmwpXG4gICAgICApKTtcblxuICAgICAgaWYgKGNvbmZsaWN0KSB7XG4gICAgICAgIHJldHVybiBgc3RhdGljIHJlc291cmNlICR7Y29uZmxpY3QudXJsfSBjb25mbGljdHMgd2l0aCAke3R5cGV9IGAgK1xuICAgICAgICAgIGByb3V0ZSAke3VybFByZWZpeH1gO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuXG4gICAgaWYgKF90ZXN0TWFuaWZlc3QpIHtcbiAgICAgIHJldHVybiBjaGVjayhfdGVzdE1hbmlmZXN0KTtcbiAgICB9XG5cbiAgICBjb25zdCB7IFdlYkFwcCB9ID0gcmVxdWlyZShcIm1ldGVvci93ZWJhcHBcIik7XG4gICAgbGV0IGVycm9yTWVzc2FnZSA9IG51bGw7XG5cbiAgICBPYmplY3Qua2V5cyhXZWJBcHAuY2xpZW50UHJvZ3JhbXMpLnNvbWUoYXJjaCA9PiB7XG4gICAgICBjb25zdCB7IG1hbmlmZXN0IH0gPSBXZWJBcHAuY2xpZW50UHJvZ3JhbXNbYXJjaF07XG4gICAgICByZXR1cm4gZXJyb3JNZXNzYWdlID0gY2hlY2sobWFuaWZlc3QpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGVycm9yTWVzc2FnZTtcbiAgfVxuXG4gIGRlY2xhcmUodXJsUHJlZml4LCB0eXBlKSB7XG4gICAgY29uc3QgcHJvYmxlbSA9XG4gICAgICB0aGlzLmNoZWNrVHlwZSh0eXBlKSB8fFxuICAgICAgdGhpcy5jaGVja1VybFByZWZpeCh1cmxQcmVmaXgsIHR5cGUpIHx8XG4gICAgICB0aGlzLmNoZWNrRm9yQ29uZmxpY3RXaXRoU3RhdGljKHVybFByZWZpeCwgdHlwZSk7XG4gICAgaWYgKHByb2JsZW0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihwcm9ibGVtKTtcbiAgICB9XG4gICAgLy8gVE9ETyBvdmVybGFwcGluZyBwcmVmaXhlcywgZS5nLiAvZm9vLyBhbmQgL2Zvby9iYXIvXG4gICAgdGhpcy51cmxQcmVmaXhUeXBlc1t1cmxQcmVmaXhdID0gdHlwZTtcbiAgfVxuXG4gIGlzVmFsaWRVcmwodXJsKSB7XG4gICAgcmV0dXJuIHVybC5zdGFydHNXaXRoKCcvJyk7XG4gIH1cblxuICBjbGFzc2lmeSh1cmwpIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZFVybCh1cmwpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHVybCBtdXN0IGJlIGEgcmVsYXRpdmUgVVJMOiAke3VybH1gKTtcbiAgICB9XG5cbiAgICBjb25zdCBwcmVmaXggPSBPYmplY3Qua2V5cyh0aGlzLnVybFByZWZpeFR5cGVzKS5maW5kKHByZWZpeCA9PlxuICAgICAgdGhpcy51cmxQcmVmaXhNYXRjaGVzKHByZWZpeCwgdXJsKVxuICAgICk7XG5cbiAgICByZXR1cm4gcHJlZml4ID8gdGhpcy51cmxQcmVmaXhUeXBlc1twcmVmaXhdIDogbnVsbDtcbiAgfVxuXG4gIHVybFByZWZpeGVzRm9yKHR5cGUpIHtcbiAgICByZXR1cm4gT2JqZWN0LmVudHJpZXModGhpcy51cmxQcmVmaXhUeXBlcylcbiAgICAgIC5maWx0ZXIoKFtfcHJlZml4LCBfdHlwZV0pID0+IF90eXBlID09PSB0eXBlKVxuICAgICAgLm1hcCgoW19wcmVmaXhdKSA9PiBfcHJlZml4KVxuICAgICAgLnNvcnQoKTtcbiAgfVxufVxuIl19
