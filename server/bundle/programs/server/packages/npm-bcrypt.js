(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var meteorInstall = Package.modules.meteorInstall;

/* Package-scope variables */
var NpmModuleBcrypt;

var require = meteorInstall({"node_modules":{"meteor":{"npm-bcrypt":{"wrapper.js":function(require,exports){

/////////////////////////////////////////////////////////////////////////////
//                                                                         //
// packages/npm-bcrypt/wrapper.js                                          //
//                                                                         //
/////////////////////////////////////////////////////////////////////////////
                                                                           //
var assert = require("assert");

// The bcryptjs package has a slightly larger API than the native bcrypt
// package, so we stick to the smaller API for consistency.
var methods = {
  compare: true,
  compareSync: true,
  genSalt: true,
  genSaltSync: true,
  getRounds: true,
  hash: true,
  hashSync: true
};

try {
  // If you really need the native `bcrypt` package, then you should
  // `meteor npm install --save bcrypt` into the node_modules directory in
  // the root of your application.
  var bcrypt = require("bcrypt");
} catch (e) {
  bcrypt = require("bcryptjs");
  console.warn([
    "Note: you are using a pure-JavaScript implementation of bcrypt.",
    "While this implementation will work correctly, it is known to be",
    "approximately three times slower than the native implementation.",
    "In order to use the native implementation instead, run",
    "",
    "  meteor npm install --save bcrypt",
    "",
    "in the root directory of your application."
  ].join("\n"));
}

exports.NpmModuleBcrypt = {};
Object.keys(methods).forEach(function (key) {
  assert.strictEqual(typeof bcrypt[key], "function");
  exports.NpmModuleBcrypt[key] = bcrypt[key];
});

/////////////////////////////////////////////////////////////////////////////

},"node_modules":{"bcryptjs":{"package.json":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////
//                                                                         //
// node_modules/meteor/npm-bcrypt/node_modules/bcryptjs/package.json       //
//                                                                         //
/////////////////////////////////////////////////////////////////////////////
                                                                           //
module.exports = {
  "name": "bcryptjs",
  "version": "2.3.0",
  "main": "index.js"
};

/////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////
//                                                                         //
// node_modules/meteor/npm-bcrypt/node_modules/bcryptjs/index.js           //
//                                                                         //
/////////////////////////////////////////////////////////////////////////////
                                                                           //
module.useNode();
/////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/npm-bcrypt/wrapper.js");

/* Exports */
Package._define("npm-bcrypt", exports, {
  NpmModuleBcrypt: NpmModuleBcrypt
});

})();
