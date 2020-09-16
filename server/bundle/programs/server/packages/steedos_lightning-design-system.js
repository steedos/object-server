(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:lightning-design-system":{"server.js":function(require){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/steedos_lightning-design-system/server.js                                               //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //

// const express = require("express");
// const path = require("path");

// const router = express.Router()
// let dsPath = require.resolve("@salesforce-ux/design-system/package.json")
// dsPath = dsPath.replace("package.json", 'assets')

// // Meteor 开发环境
// let projectPath = process.cwd()
// if (projectPath.indexOf(".meteor")) {
//     projectPath = projectPath.split(".meteor")[0]
//     dsPath = path.join(projectPath, "node_modules", dsPath)
// }

// router.use("/assets/", express.static(dsPath));

// if (__meteor_runtime_config__ && __meteor_runtime_config__.ROOT_URL_PATH_PREFIX)
// router.use(__meteor_runtime_config__.ROOT_URL_PATH_PREFIX + "/assets/", express.static(dsPath));


// WebApp.rawConnectHandlers.use(router);

//////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/steedos:lightning-design-system/server.js");

/* Exports */
Package._define("steedos:lightning-design-system");

})();
