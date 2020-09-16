(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var EJSON = Package.ejson.EJSON;
var IdMap = Package['id-map'].IdMap;
var Random = Package.random.Random;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var hexString, MongoID;

var require = meteorInstall({"node_modules":{"meteor":{"mongo-id":{"id.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                           //
// packages/mongo-id/id.js                                                                   //
//                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////
                                                                                             //
module.export({
  MongoID: () => MongoID
});
let EJSON;
module.link("meteor/ejson", {
  EJSON(v) {
    EJSON = v;
  }

}, 0);
let Random;
module.link("meteor/random", {
  Random(v) {
    Random = v;
  }

}, 1);
const MongoID = {};

MongoID._looksLikeObjectID = str => str.length === 24 && str.match(/^[0-9a-f]*$/);

MongoID.ObjectID = class ObjectID {
  constructor(hexString) {
    //random-based impl of Mongo ObjectID
    if (hexString) {
      hexString = hexString.toLowerCase();

      if (!MongoID._looksLikeObjectID(hexString)) {
        throw new Error('Invalid hexadecimal string for creating an ObjectID');
      } // meant to work with _.isEqual(), which relies on structural equality


      this._str = hexString;
    } else {
      this._str = Random.hexString(24);
    }
  }

  equals(other) {
    return other instanceof MongoID.ObjectID && this.valueOf() === other.valueOf();
  }

  toString() {
    return `ObjectID("${this._str}")`;
  }

  clone() {
    return new MongoID.ObjectID(this._str);
  }

  typeName() {
    return 'oid';
  }

  getTimestamp() {
    return Number.parseInt(this._str.substr(0, 8), 16);
  }

  valueOf() {
    return this._str;
  }

  toJSONValue() {
    return this.valueOf();
  }

  toHexString() {
    return this.valueOf();
  }

};
EJSON.addType('oid', str => new MongoID.ObjectID(str));

MongoID.idStringify = id => {
  if (id instanceof MongoID.ObjectID) {
    return id.valueOf();
  } else if (typeof id === 'string') {
    if (id === '') {
      return id;
    } else if (id.startsWith('-') || // escape previously dashed strings
    id.startsWith('~') || // escape escaped numbers, true, false
    MongoID._looksLikeObjectID(id) || // escape object-id-form strings
    id.startsWith('{')) {
      // escape object-form strings, for maybe implementing later
      return `-${id}`;
    } else {
      return id; // other strings go through unchanged.
    }
  } else if (id === undefined) {
    return '-';
  } else if (typeof id === 'object' && id !== null) {
    throw new Error('Meteor does not currently support objects other than ObjectID as ids');
  } else {
    // Numbers, true, false, null
    return `~${JSON.stringify(id)}`;
  }
};

MongoID.idParse = id => {
  if (id === '') {
    return id;
  } else if (id === '-') {
    return undefined;
  } else if (id.startsWith('-')) {
    return id.substr(1);
  } else if (id.startsWith('~')) {
    return JSON.parse(id.substr(1));
  } else if (MongoID._looksLikeObjectID(id)) {
    return new MongoID.ObjectID(id);
  } else {
    return id;
  }
};
///////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/mongo-id/id.js");

/* Exports */
Package._define("mongo-id", exports, {
  MongoID: MongoID
});

})();

//# sourceURL=meteor://💻app/packages/mongo-id.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9uZ28taWQvaWQuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiTW9uZ29JRCIsIkVKU09OIiwibGluayIsInYiLCJSYW5kb20iLCJfbG9va3NMaWtlT2JqZWN0SUQiLCJzdHIiLCJsZW5ndGgiLCJtYXRjaCIsIk9iamVjdElEIiwiY29uc3RydWN0b3IiLCJoZXhTdHJpbmciLCJ0b0xvd2VyQ2FzZSIsIkVycm9yIiwiX3N0ciIsImVxdWFscyIsIm90aGVyIiwidmFsdWVPZiIsInRvU3RyaW5nIiwiY2xvbmUiLCJ0eXBlTmFtZSIsImdldFRpbWVzdGFtcCIsIk51bWJlciIsInBhcnNlSW50Iiwic3Vic3RyIiwidG9KU09OVmFsdWUiLCJ0b0hleFN0cmluZyIsImFkZFR5cGUiLCJpZFN0cmluZ2lmeSIsImlkIiwic3RhcnRzV2l0aCIsInVuZGVmaW5lZCIsIkpTT04iLCJzdHJpbmdpZnkiLCJpZFBhcnNlIiwicGFyc2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsTUFBTSxDQUFDQyxNQUFQLENBQWM7QUFBQ0MsU0FBTyxFQUFDLE1BQUlBO0FBQWIsQ0FBZDtBQUFxQyxJQUFJQyxLQUFKO0FBQVVILE1BQU0sQ0FBQ0ksSUFBUCxDQUFZLGNBQVosRUFBMkI7QUFBQ0QsT0FBSyxDQUFDRSxDQUFELEVBQUc7QUFBQ0YsU0FBSyxHQUFDRSxDQUFOO0FBQVE7O0FBQWxCLENBQTNCLEVBQStDLENBQS9DO0FBQWtELElBQUlDLE1BQUo7QUFBV04sTUFBTSxDQUFDSSxJQUFQLENBQVksZUFBWixFQUE0QjtBQUFDRSxRQUFNLENBQUNELENBQUQsRUFBRztBQUFDQyxVQUFNLEdBQUNELENBQVA7QUFBUzs7QUFBcEIsQ0FBNUIsRUFBa0QsQ0FBbEQ7QUFHNUcsTUFBTUgsT0FBTyxHQUFHLEVBQWhCOztBQUVBQSxPQUFPLENBQUNLLGtCQUFSLEdBQTZCQyxHQUFHLElBQUlBLEdB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QW1CLEVBQTlCO0FBQ0Q7QUFDRixDQXJCRDs7QUF1QkE3QixPQUFPLENBQUNrQyxPQUFSLEdBQW1CTCxFQUFELElBQVE7QUFDeEIsTUFBSUEsRUFBRSxLQUFLLEVBQVgsRUFBZTtBQUNiLFdBQU9BLEVBQVA7QUFDRCxHQUZELE1BRU8sSUFBSUEsRUFBRSxLQUFLLEdBQVgsRUFBZ0I7QUFDckIsV0FBT0UsU0FBUDtBQUNELEdBRk0sTUFFQSxJQUFJRixFQUFFLENBQUNDLFVBQUgsQ0FBYyxHQUFkLENBQUosRUFBd0I7QUFDN0IsV0FBT0QsRUFBRSxDQUFDTCxNQUFILENBQVUsQ0FBVixDQUFQO0FBQ0QsR0FGTSxNQUVBLElBQUlLLEVBQUUsQ0FBQ0MsVUFBSCxDQUFjLEdBQWQsQ0FBSixFQUF3QjtBQUM3QixXQUFPRSxJQUFJLENBQUNHLEtBQUwsQ0FBV04sRUFBRSxDQUFDTCxNQUFILENBQVUsQ0FBVixDQUFYLENBQVA7QUFDRCxHQUZNLE1BRUEsSUFBSXhCLE9BQU8sQ0FBQ0ssa0JBQVIsQ0FBMkJ3QixFQUEzQixDQUFKLEVBQW9DO0FBQ3pDLFdBQU8sSUFBSTdCLE9BQU8sQ0FBQ1MsUUFBWixDQUFxQm9CLEVBQXJCLENBQVA7QUFDRCxHQUZNLE1BRUE7QUFDTCxXQUFPQSxFQUFQO0FBQ0Q7QUFDRixDQWRELEMiLCJmaWxlIjoiL3BhY2thZ2VzL21vbmdvLWlkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRUpTT04gfSBmcm9tICdtZXRlb3IvZWpzb24nO1xuaW1wb3J0IHsgUmFuZG9tIH0gZnJvbSAnbWV0ZW9yL3JhbmRvbSc7XG5cbmNvbnN0IE1vbmdvSUQgPSB7fTtcblxuTW9uZ29JRC5fbG9va3NMaWtlT2JqZWN0SUQgPSBzdHIgPT4gc3RyLmxlbmd0aCA9PT0gMjQgJiYgc3RyLm1hdGNoKC9eWzAtOWEtZl0qJC8pO1xuXG5Nb25nb0lELk9iamVjdElEID0gY2xhc3MgT2JqZWN0SUQge1xuICBjb25zdHJ1Y3RvciAoaGV4U3RyaW5nKSB7XG4gICAgLy9yYW5kb20tYmFzZWQgaW1wbCBvZiBNb25nbyBPYmplY3RJRFxuICAgIGlmIChoZXhTdHJpbmcpIHtcbiAgICAgIGhleFN0cmluZyA9IGhleFN0cmluZy50b0xvd2VyQ2FzZSgpO1xuICAgICAgaWYgKCFNb25nb0lELl9sb29rc0xpa2VPYmplY3RJRChoZXhTdHJpbmcpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBoZXhhZGVjaW1hbCBzdHJpbmcgZm9yIGNyZWF0aW5nIGFuIE9iamVjdElEJyk7XG4gICAgICB9XG4gICAgICAvLyBtZWFudCB0byB3b3JrIHdpdGggXy5pc0VxdWFsKCksIHdoaWNoIHJlbGllcyBvbiBzdHJ1Y3R1cmFsIGVxdWFsaXR5XG4gICAgICB0aGlzLl9zdHIgPSBoZXhTdHJpbmc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3N0ciA9IFJhbmRvbS5oZXhTdHJpbmcoMjQpO1xuICAgIH1cbiAgfVxuXG4gIGVxdWFscyhvdGhlcikge1xuICAgIHJldHVybiBvdGhlciBpbnN0YW5jZW9mIE1vbmdvSUQuT2JqZWN0SUQgJiZcbiAgICB0aGlzLnZhbHVlT2YoKSA9PT0gb3RoZXIudmFsdWVPZigpO1xuICB9XG5cbiAgdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIGBPYmplY3RJRChcIiR7dGhpcy5fc3RyfVwiKWA7XG4gIH1cblxuICBjbG9uZSgpIHtcbiAgICByZXR1cm4gbmV3IE1vbmdvSUQuT2JqZWN0SUQodGhpcy5fc3RyKTtcbiAgfVxuXG4gIHR5cGVOYW1lKCkge1xuICAgIHJldHVybiAnb2lkJztcbiAgfVxuICBcbiAgZ2V0VGltZXN0YW1wKCkge1xuICAgIHJldHVybiBOdW1iZXIucGFyc2VJbnQodGhpcy5fc3RyLnN1YnN0cigwLCA4KSwgMTYpO1xuICB9XG5cbiAgdmFsdWVPZigpIHtcbiAgICByZXR1cm4gdGhpcy5fc3RyO1xuICB9XG5cbiAgdG9KU09OVmFsdWUoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWVPZigpO1xuICB9XG5cbiAgdG9IZXhTdHJpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWVPZigpO1xuICB9XG5cbn1cblxuRUpTT04uYWRkVHlwZSgnb2lkJywgc3RyID0+IG5ldyBNb25nb0lELk9iamVjdElEKHN0cikpO1xuXG5Nb25nb0lELmlkU3RyaW5naWZ5ID0gKGlkKSA9PiB7XG4gIGlmIChpZCBpbnN0YW5jZW9mIE1vbmdvSUQuT2JqZWN0SUQpIHtcbiAgICByZXR1cm4gaWQudmFsdWVPZigpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBpZCA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAoaWQgPT09ICcnKSB7XG4gICAgICByZXR1cm4gaWQ7XG4gICAgfSBlbHNlIGlmIChpZC5zdGFydHNXaXRoKCctJykgfHwgLy8gZXNjYXBlIHByZXZpb3VzbHkgZGFzaGVkIHN0cmluZ3NcbiAgICAgICAgICAgICAgIGlkLnN0YXJ0c1dpdGgoJ34nKSB8fCAvLyBlc2NhcGUgZXNjYXBlZCBudW1iZXJzLCB0cnVlLCBmYWxzZVxuICAgICAgICAgICAgICAgTW9uZ29JRC5fbG9va3NMaWtlT2JqZWN0SUQoaWQpIHx8IC8vIGVzY2FwZSBvYmplY3QtaWQtZm9ybSBzdHJpbmdzXG4gICAgICAgICAgICAgICBpZC5zdGFydHNXaXRoKCd7JykpIHsgLy8gZXNjYXBlIG9iamVjdC1mb3JtIHN0cmluZ3MsIGZvciBtYXliZSBpbXBsZW1lbnRpbmcgbGF0ZXJcbiAgICAgIHJldHVybiBgLSR7aWR9YDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGlkOyAvLyBvdGhlciBzdHJpbmdzIGdvIHRocm91Z2ggdW5jaGFuZ2VkLlxuICAgIH1cbiAgfSBlbHNlIGlmIChpZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuICctJztcbiAgfSBlbHNlIGlmICh0eXBlb2YgaWQgPT09ICdvYmplY3QnICYmIGlkICE9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNZXRlb3IgZG9lcyBub3QgY3VycmVudGx5IHN1cHBvcnQgb2JqZWN0cyBvdGhlciB0aGFuIE9iamVjdElEIGFzIGlkcycpO1xuICB9IGVsc2UgeyAvLyBOdW1iZXJzLCB0cnVlLCBmYWxzZSwgbnVsbFxuICAgIHJldHVybiBgfiR7SlNPTi5zdHJpbmdpZnkoaWQpfWA7XG4gIH1cbn07XG5cbk1vbmdvSUQuaWRQYXJzZSA9IChpZCkgPT4ge1xuICBpZiAoaWQgPT09ICcnKSB7XG4gICAgcmV0dXJuIGlkO1xuICB9IGVsc2UgaWYgKGlkID09PSAnLScpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9IGVsc2UgaWYgKGlkLnN0YXJ0c1dpdGgoJy0nKSkge1xuICAgIHJldHVybiBpZC5zdWJzdHIoMSk7XG4gIH0gZWxzZSBpZiAoaWQuc3RhcnRzV2l0aCgnficpKSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UoaWQuc3Vic3RyKDEpKTtcbiAgfSBlbHNlIGlmIChNb25nb0lELl9sb29rc0xpa2VPYmplY3RJRChpZCkpIHtcbiAgICByZXR1cm4gbmV3IE1vbmdvSUQuT2JqZWN0SUQoaWQpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBpZDtcbiAgfVxufTtcblxuZXhwb3J0IHsgTW9uZ29JRCB9O1xuIl19
