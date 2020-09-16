(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var FS = Package['steedos:cfs-base-package'].FS;
var PowerQueue = Package['steedos:cfs-power-queue'].PowerQueue;
var ReactiveList = Package['steedos:cfs-reactive-list'].ReactiveList;

(function(){

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/steedos_cfs-upload-http/upload-http-common.js            //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
FS.HTTP = FS.HTTP || {};

///////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("steedos:cfs-upload-http");

})();
