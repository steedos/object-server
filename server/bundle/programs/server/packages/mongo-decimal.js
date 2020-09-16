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
var Decimal;

var require = meteorInstall({"node_modules":{"meteor":{"mongo-decimal":{"decimal.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/mongo-decimal/decimal.js                                 //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
module.export({
  Decimal: () => Decimal
});
let EJSON;
module.link("meteor/ejson", {
  EJSON(v) {
    EJSON = v;
  }

}, 0);
let Decimal;
module.link("decimal.js", {
  Decimal(v) {
    Decimal = v;
  }

}, 1);

Decimal.prototype.typeName = function () {
  return 'Decimal';
};

Decimal.prototype.toJSONValue = function () {
  return this.toJSON();
};

Decimal.prototype.clone = function () {
  return Decimal(this.toString());
};

EJSON.addType('Decimal', function (str) {
  return Decimal(str);
});
///////////////////////////////////////////////////////////////////////

},"node_modules":{"decimal.js":{"package.json":function(require,exports,module){

///////////////////////////////////////////////////////////////////////
//                                                                   //
// node_modules/meteor/mongo-decimal/node_modules/decimal.js/package //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
module.exports = {
  "name": "decimal.js",
  "version": "9.0.1",
  "main": "./decimal"
};

///////////////////////////////////////////////////////////////////////

},"decimal.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////
//                                                                   //
// node_modules/meteor/mongo-decimal/node_modules/decimal.js/decimal //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
module.useNode();
///////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/mongo-decimal/decimal.js");

/* Exports */
Package._define("mongo-decimal", exports, {
  Decimal: Decimal
});

})();

//# sourceURL=meteor://💻app/packages/mongo-decimal.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9uZ28tZGVjaW1hbC9kZWNpbWFsLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydCIsIkRlY2ltYWwiLCJFSlNPTiIsImxpbmsiLCJ2IiwicHJvdG90eXBlIiwidHlwZU5hbWUiLCJ0b0pTT05WYWx1ZSIsInRvSlNPTiIsImNsb25lIiwidG9TdHJpbmciLCJhZGRUeXBlIiwic3RyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxNQUFNLENBQUNDLE1BQVAsQ0FBYztBQUFDQyxTQUFPLEVBQUMsTUFBSUE7QUFBYixDQUFkO0FBQXFDLElBQUlDLEtBQUo7QUFBVUgsTUFBTSxDQUFDSSxJQUFQLENBQVksY0FBWixFQUEyQjtBQUFDRCxPQUFLLENBQUNFLENBQUQsRUFBRztBQUFDRixTQUFLLEdBQUNFLENBQU47QUFBUTs7QUFBbEIsQ0FBM0IsRUFBK0MsQ0FBL0M7QUFBa0QsSUFBSUgsT0FBSjtBQUFZRixNQUFNLENBQUNJLElBQVAsQ0FBWSxZQUFaLEVBQXlCO0FBQUNGLFNBQU8sQ0FBQ0csQ0FBRCxFQUFHO0FBQUNILFdBQU8sR0FBQ0csQ0FBUjtBQUFVOztBQUF0QixDQUF6QixFQUFpRCxDQUFqRDs7QUFHN0dILE9BQU8sQ0FBQ0ksU0FBUixDQUFrQkMsUUFBbEIsR0FBNkIsWUFBVztBQUN0QyxTQUFPLFNBQVA7QUFDRCxDQUZEOztBQUlBTCxPQUFPLENBQUNJLFNBQVIsQ0FBa0JFLFdBQWxCLEdBQWdDLFlBQVk7QUFDMUMsU0FBTyxLQUFLQyxNQUFMLEVBQVA7QUFDRCxDQUZEOztBQUlBUCxPQUFPLENBQUNJLFNBQVIsQ0FBa0JJLEtBQWxCLEdBQTBCLFlBQVk7QUFDcEMsU0FBT1IsT0FBTyxDQUFDLEtBQUtTLFFBQUwsRUFBRCxDQUFkO0FBQ0QsQ0FGRDs7QUFJQVIsS0FBSyxDQUFDUyxPQUFOLENBQWMsU0FBZCxFQUF5QixVQUFVQyxHQUFWLEVBQWU7QUFDdEMsU0FBT1gsT0FBTyxDQUFDVyxHQUFELENBQWQ7QUFDRCxDQUZELEUiLCJmaWxlIjoiL3BhY2thZ2VzL21vbmdvLWRlY2ltYWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFSlNPTiB9IGZyb20gJ21ldGVvci9lanNvbic7XG5pbXBvcnQgeyBEZWNpbWFsIH0gZnJvbSAnZGVjaW1hbC5qcyc7XG5cbkRlY2ltYWwucHJvdG90eXBlLnR5cGVOYW1lID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAnRGVjaW1hbCc7XG59O1xuXG5EZWNpbWFsLnByb3RvdHlwZS50b0pTT05WYWx1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMudG9KU09OKCk7XG59O1xuXG5EZWNpbWFsLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIERlY2ltYWwodGhpcy50b1N0cmluZygpKTtcbn07XG5cbkVKU09OLmFkZFR5cGUoJ0RlY2ltYWwnLCBmdW5jdGlvbiAoc3RyKSB7XG4gIHJldHVybiBEZWNpbWFsKHN0cik7XG59KTtcblxuZXhwb3J0IHsgRGVjaW1hbCB9O1xuIl19
