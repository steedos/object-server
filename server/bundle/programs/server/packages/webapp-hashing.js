(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var _ = Package.underscore._;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var WebAppHashing;

var require = meteorInstall({"node_modules":{"meteor":{"webapp-hashing":{"webapp-hashing.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/webapp-hashing/webapp-hashing.js                                                               //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
var crypto = Npm.require("crypto");

WebAppHashing = {}; // Calculate a hash of all the client resources downloaded by the
// browser, including the application HTML, runtime config, code, and
// static files.
//
// This hash *must* change if any resources seen by the browser
// change, and ideally *doesn't* change for any server-only changes
// (but the second is a performance enhancement, not a hard
// requirement).

WebAppHashing.calculateClientHash = function (manifest, includeFilter, runtimeConfigOverride) {
  var hash = crypto.createHash('sha1'); // Omit the old hashed client values in the new hash. These may be
  // modified in the new boilerplate.

  var runtimeCfg = _.omit(__meteor_runtime_config__, ['autoupdateVersion', 'autoupdateVersionRefreshable', 'autoupdateVersionCordova']);

  if (runtimeConfigOverride) {
    runtimeCfg = runtimeConfigOverride;
  }

  hash.update(JSON.stringify(runtimeCfg, 'utf8'));

  _.each(manifest, function (resource) {
    if ((!includeFilter || includeFilter(resource.type)) && (resource.where === 'client' || resource.where === 'internal')) {
      hash.update(resource.path);
      hash.update(resource.hash);
    }
  });

  return hash.digest('hex');
};

WebAppHashing.calculateCordovaCompatibilityHash = function (platformVersion, pluginVersions) {
  const hash = crypto.createHash('sha1');
  hash.update(platformVersion); // Sort plugins first so iteration order doesn't affect the hash

  const plugins = Object.keys(pluginVersions).sort();

  for (let plugin of plugins) {
    const version = pluginVersions[plugin];
    hash.update(plugin);
    hash.update(version);
  }

  return hash.digest('hex');
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/webapp-hashing/webapp-hashing.js");

/* Exports */
Package._define("webapp-hashing", {
  WebAppHashing: WebAppHashing
});

})();

//# sourceURL=meteor://💻app/packages/webapp-hashing.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvd2ViYXBwLWhhc2hpbmcvd2ViYXBwLWhhc2hpbmcuanMiXSwibmFtZXMiOlsiY3J5cHRvIiwiTnBtIiwicmVxdWlyZSIsIldlYkFwcEhhc2hpbmciLCJjYWxjdWxhdGVDbGllbnRIYXNoIiwibWFuaWZlc3QiLCJpbmNsdWRlRmlsdGVyIiwicnVudGltZUNvbmZpZ092ZXJyaWRlIiwiaGFzaCIsImNyZWF0ZUhhc2giLCJydW50aW1lQ2ZnIiwiXyIsIm9taXQiLCJfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fIiwidXBkYXRlIiwiSlNPTiIsInN0cmluZ2lmeSIsImVhY2giLCJyZXNvdXJjZSIsInR5cGUiLCJ3aGVyZSIsInBhdGgiLCJkaWdlc3QiLCJjYWxjdWxhdGVDb3Jkb3ZhQ29tcGF0aWJpbGl0eUhhc2giLCJwbGF0Zm9ybVZlcnNpb24iLCJwbHVnaW5WZXJzaW9ucyIsInBsdWdpbnMiLCJPYmplY3QiLCJrZXlzIiwic29ydCIsInBsdWdpbiIsInZlcnNpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSUEsTUFBTSxHQUFHQyxHQUFHLENBQUNDLE9BQUosQ0FBWSxRQUFaLENBQWI7O0FBRUFDLGFBQWEsR0FBRyxFQUFoQixDLENBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQUEsYUFBYSxDQUFDQyxtQkFBZCxHQUNFLFVBQVVDLFFBQVYsRUFBb0JDLGFBQXBCLEVBQW1DQyxxQkFBbkMsRUFBMEQ7QUFDMUQsTUFBSUMsSUFBSSxHQUFHUixNQUFNLENBQUNTLFVBQVAsQ0FBa0IsTUFBbEIsQ0FBWCxDQUQwRCxDQUcxRDtBQUNBOztBQUNBLE1BQUlDLFVBQVUsR0FBR0MsQ0FBQyxDQUFDQyxJQUFGLENBQU9DLHlCQUFQLEVBQ2YsQ0FBQyxtQkFBRCxFQUFzQiw4QkFBdEIsRUFDQywwQkFERCxDQURlLENBQWpCOztBQUlBLE1BQUlOLHFCQUFKLEVBQTJCO0FBQ3pCRyxjQUFVLEdBQUdILHFCQUFiO0FBQ0Q7O0FBRURDLE1BQUksQ0FBQ00sTUFBTCxDQUFZQyxJQUFJLENBQUNDLFNBQUwsQ0FBZU4sVUFBZixFQUEyQixNQUEzQixDQUFaOztBQUVBQyxHQUFDLENBQUNNLElBQUYsQ0FBT1osUUFBUCxFQUFpQixVQUFVYSxRQUFWLEVBQW9CO0FBQ2pDLFFBQUksQ0FBQyxDQUFFWixhQUFGLElBQW1CQSxhQUFhLENBQUNZLFFBQVEsQ0FBQ0MsSUFBVixDQUFqQyxNQUNDRCxRQUFRLENBQUNFLEtBQVQsS0FBbUIsUUFBbkIsSUFBK0JGLFFBQVEsQ0FBQ0UsS0FBVCxLQUFtQixVQURuRCxDQUFKLEVBQ29FO0FBQ3BFWixVQUFJLENBQUNNLE1BQUwsQ0FBWUksUUFBUSxDQUFDRyxJQUFyQjtBQUNBYixVQUFJLENBQUNNLE1BQUwsQ0FBWUksUUFBUSxDQUFDVixJQUFyQjtBQUNEO0FBQ0YsR0FORDs7QUFPQSxTQUFPQSxJQUFJLENBQUNjLE1BQUwsQ0FBWSxLQUFaLENBQVA7QUFDRCxDQXhCRDs7QUEwQkFuQixhQUFhLENBQUNvQixpQ0FBZCxHQUNFLFVBQVNDLGVBQVQsRUFBMEJDLGNBQTFCLEVBQTBDO0FBQzFDLFFBQU1qQixJQUFJLEdBQUdSLE1BQU0sQ0FBQ1MsVUFBUCxDQUFrQixNQUFsQixDQUFiO0FBRUFELE1BQUksQ0FBQ00sTUFBTCxDQUFZVSxlQUFaLEVBSDBDLENBSzFDOztBQUNBLFFBQU1FLE9BQU8sR0FBR0MsTUFBTSxDQUFDQyxJQUFQLENBQVlILGNBQVosRUFBNEJJLElBQTVCLEVBQWhCOztBQUNBLE9BQUssSUFBSUMsTUFBVCxJQUFtQkosT0FBbkIsRUFBNEI7QUFDMUIsVUFBTUssT0FBTyxHQUFHTixjQUFjLENBQUNLLE1BQUQsQ0FBOUI7QUFDQXRCLFFBQUksQ0FBQ00sTUFBTCxDQUFZZ0IsTUFBWjtBQUNBdEIsUUFBSSxDQUFDTSxNQUFMLENBQVlpQixPQUFaO0FBQ0Q7O0FBRUQsU0FBT3ZCLElBQUksQ0FBQ2MsTUFBTCxDQUFZLEtBQVosQ0FBUDtBQUNELENBZkQsQyIsImZpbGUiOiIvcGFja2FnZXMvd2ViYXBwLWhhc2hpbmcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgY3J5cHRvID0gTnBtLnJlcXVpcmUoXCJjcnlwdG9cIik7XG5cbldlYkFwcEhhc2hpbmcgPSB7fTtcblxuLy8gQ2FsY3VsYXRlIGEgaGFzaCBvZiBhbGwgdGhlIGNsaWVudCByZXNvdXJjZXMgZG93bmxvYWRlZCBieSB0aGVcbi8vIGJyb3dzZXIsIGluY2x1ZGluZyB0aGUgYXBwbGljYXRpb24gSFRNTCwgcnVudGltZSBjb25maWcsIGNvZGUsIGFuZFxuLy8gc3RhdGljIGZpbGVzLlxuLy9cbi8vIFRoaXMgaGFzaCAqbXVzdCogY2hhbmdlIGlmIGFueSByZXNvdXJjZXMgc2VlbiBieSB0aGUgYnJvd3NlclxuLy8gY2hhbmdlLCBhbmQgaWRlYWxseSAqZG9lc24ndCogY2hhbmdlIGZvciBhbnkgc2VydmVyLW9ubHkgY2hhbmdlc1xuLy8gKGJ1dCB0aGUgc2Vjb25kIGlzIGEgcGVyZm9ybWFuY2UgZW5oYW5jZW1lbnQsIG5vdCBhIGhhcmRcbi8vIHJlcXVpcmVtZW50KS5cblxuV2ViQXBwSGFzaGluZy5jYWxjdWxhdGVDbGllbnRIYXNoID1cbiAgZnVuY3Rpb24gKG1hbmlmZXN0LCBpbmNsdWRlRmlsdGVyLCBydW50aW1lQ29uZmlnT3ZlcnJpZGUpIHtcbiAgdmFyIGhhc2ggPSBjcnlwdG8uY3JlYXRlSGFzaCgnc2hhMScpO1xuXG4gIC8vIE9taXQgdGhlIG9sZCBoYXNoZWQgY2xpZW50IHZhbHVlcyBpbiB0aGUgbmV3IGhhc2guIFRoZXNlIG1heSBiZVxuICAvLyBtb2RpZmllZCBpbiB0aGUgbmV3IGJvaWxlcnBsYXRlLlxuICB2YXIgcnVudGltZUNmZyA9IF8ub21pdChfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLFxuICAgIFsnYXV0b3VwZGF0ZVZlcnNpb24nLCAnYXV0b3VwZGF0ZVZlcnNpb25SZWZyZXNoYWJsZScsXG4gICAgICdhdXRvdXBkYXRlVmVyc2lvbkNvcmRvdmEnXSk7XG5cbiAgaWYgKHJ1bnRpbWVDb25maWdPdmVycmlkZSkge1xuICAgIHJ1bnRpbWVDZmcgPSBydW50aW1lQ29uZmlnT3ZlcnJpZGU7XG4gIH1cblxuICBoYXNoLnVwZGF0ZShKU09OLnN0cmluZ2lmeShydW50aW1lQ2ZnLCAndXRmOCcpKTtcblxuICBfLmVhY2gobWFuaWZlc3QsIGZ1bmN0aW9uIChyZXNvdXJjZSkge1xuICAgICAgaWYgKCghIGluY2x1ZGVGaWx0ZXIgfHwgaW5jbHVkZUZpbHRlcihyZXNvdXJjZS50eXBlKSkgJiZcbiAgICAgICAgICAocmVzb3VyY2Uud2hlcmUgPT09ICdjbGllbnQnIHx8IHJlc291cmNlLndoZXJlID09PSAnaW50ZXJuYWwnKSkge1xuICAgICAgaGFzaC51cGRhdGUocmVzb3VyY2UucGF0aCk7XG4gICAgICBoYXNoLnVwZGF0ZShyZXNvdXJjZS5oYXNoKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gaGFzaC5kaWdlc3QoJ2hleCcpO1xufTtcblxuV2ViQXBwSGFzaGluZy5jYWxjdWxhdGVDb3Jkb3ZhQ29tcGF0aWJpbGl0eUhhc2ggPVxuICBmdW5jdGlvbihwbGF0Zm9ybVZlcnNpb24sIHBsdWdpblZlcnNpb25zKSB7XG4gIGNvbnN0IGhhc2ggPSBjcnlwdG8uY3JlYXRlSGFzaCgnc2hhMScpO1xuXG4gIGhhc2gudXBkYXRlKHBsYXRmb3JtVmVyc2lvbik7XG5cbiAgLy8gU29ydCBwbHVnaW5zIGZpcnN0IHNvIGl0ZXJhdGlvbiBvcmRlciBkb2Vzbid0IGFmZmVjdCB0aGUgaGFzaFxuICBjb25zdCBwbHVnaW5zID0gT2JqZWN0LmtleXMocGx1Z2luVmVyc2lvbnMpLnNvcnQoKTtcbiAgZm9yIChsZXQgcGx1Z2luIG9mIHBsdWdpbnMpIHtcbiAgICBjb25zdCB2ZXJzaW9uID0gcGx1Z2luVmVyc2lvbnNbcGx1Z2luXTtcbiAgICBoYXNoLnVwZGF0ZShwbHVnaW4pO1xuICAgIGhhc2gudXBkYXRlKHZlcnNpb24pO1xuICB9XG5cbiAgcmV0dXJuIGhhc2guZGlnZXN0KCdoZXgnKTtcbn07XG4iXX0=
