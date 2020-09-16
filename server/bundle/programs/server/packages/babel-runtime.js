(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var meteorInstall = Package.modules.meteorInstall;

/* Package-scope variables */
var meteorBabelHelpers;

var require = meteorInstall({"node_modules":{"meteor":{"babel-runtime":{"babel-runtime.js":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////
//                                                                                 //
// packages/babel-runtime/babel-runtime.js                                         //
//                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////
                                                                                   //
exports.meteorBabelHelpers = require("meteor-babel-helpers");

try {
  var babelRuntimeVersion = require("@babel/runtime/package.json").version;
} catch (e) {
  throw new Error([
    "",
    "The @babel/runtime npm package could not be found in your node_modules ",
    "directory. Please run the following command to install it:",
    "",
    "  meteor npm install --save @babel/runtime",
    ""
  ].join("\n"));
}

if (parseInt(babelRuntimeVersion, 10) < 7 ||
    (babelRuntimeVersion.indexOf("7.0.0-beta.") === 0 &&
     parseInt(babelRuntimeVersion.split(".").pop(), 10) < 56)) {
  console.error([
    "The version of @babel/runtime installed in your node_modules directory ",
    "(" + babelRuntimeVersion + ") is out of date. Please upgrade it by running ",
    "",
    "  meteor npm install --save @babel/runtime@latest",
    "",
    "in your application directory.",
    ""
  ].join("\n"));
}

/////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"meteor-babel-helpers":{"package.json":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////
//                                                                                 //
// node_modules/meteor/babel-runtime/node_modules/meteor-babel-helpers/package.jso //
//                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////
                                                                                   //
module.exports = {
  "name": "meteor-babel-helpers",
  "version": "0.0.3",
  "main": "index.js"
};

/////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////
//                                                                                 //
// node_modules/meteor/babel-runtime/node_modules/meteor-babel-helpers/index.js    //
//                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////
                                                                                   //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/babel-runtime/babel-runtime.js");

/* Exports */
Package._define("babel-runtime", exports, {
  meteorBabelHelpers: meteorBabelHelpers
});

})();
