(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"tmeasday:check-npm-versions":{"check-npm-versions.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/tmeasday_check-npm-versions/check-npm-versions.js                                                     //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
const module1 = module;
module1.export({
  checkNpmVersions: () => checkNpmVersions
});
let semver;
module1.link("semver", {
  default(v) {
    semver = v;
  }

}, 0);

// Returns:
//   - true      if a version of the package in the range is installed
//   - false     if no version is installed
//   - version#  if incompatible version is installed
const compatibleVersionIsInstalled = (name, range) => {
  try {
    const installedVersion = require(`${name}/package.json`).version;

    if (semver.satisfies(installedVersion, range)) {
      return true;
    } else {
      return installedVersion;
    }
  } catch (e) {
    // XXX add something to the tool to make this more reliable
    const message = e.toString(); // One message comes out of the install npm package the other from npm directly

    if (message.match("Cannot find module") || message.match("Can't find npm module")) {
      return false;
    } else {
      throw e;
    }
  }
};

const checkNpmVersions = (packages, packageName) => {
  if (!Meteor.isDevelopment) {
    return;
  }

  const failures = {};
  Object.keys(packages).forEach(name => {
    const range = packages[name];
    const failure = compatibleVersionIsInstalled(name, range);

    if (failure !== true) {
      failures[name] = failure;
    }
  });

  if (Object.keys(failures).length === 0) {
    return true;
  }

  const errors = [];
  Object.keys(failures).forEach(name => {
    const installed = failures[name];
    const requirement = `${name}@${packages[name]}`;

    if (installed) {
      errors.push(` - ${name}@${installed} installed, ${requirement} needed`);
    } else {
      errors.push(` - ${name}@${packages[name]} not installed.`);
    }
  });
  const qualifier = packageName ? `(for ${packageName}) ` : '';
  console.warn(`WARNING: npm peer requirements ${qualifier}not installed:
${errors.join('\n')}

Read more about installing npm peer dependencies:
  http://guide.meteor.com/using-packages.html#peer-npm-dependencies
`);
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"semver":{"package.json":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// node_modules/meteor/tmeasday_check-npm-versions/node_modules/semver/package.json                               //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
module.exports = {
  "name": "semver",
  "version": "5.1.0",
  "main": "semver.js"
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"semver.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// node_modules/meteor/tmeasday_check-npm-versions/node_modules/semver/semver.js                                  //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
module.useNode();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/tmeasday:check-npm-versions/check-npm-versions.js");

/* Exports */
Package._define("tmeasday:check-npm-versions", exports);

})();

//# sourceURL=meteor://💻app/packages/tmeasday_check-npm-versions.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvdG1lYXNkYXk6Y2hlY2stbnBtLXZlcnNpb25zL2NoZWNrLW5wbS12ZXJzaW9ucy5qcyJdLCJuYW1lcyI6WyJtb2R1bGUxIiwibW9kdWxlIiwiZXhwb3J0IiwiY2hlY2tOcG1WZXJzaW9ucyIsInNlbXZlciIsImxpbmsiLCJkZWZhdWx0IiwidiIsImNvbXBhdGlibGVWZXJzaW9uSXNJbnN0YWxsZWQiLCJuYW1lIiwicmFuZ2UiLCJpbnN0YWxsZWRWZXJzaW9uIiwicmVxdWlyZSIsInZlcnNpb24iLCJzYXRpc2ZpZXMiLCJlIiwibWVzc2FnZSIsInRvU3RyaW5nIiwibWF0Y2giLCJwYWNrYWdlcyIsInBhY2thZ2VOYW1lIiwiTWV0ZW9yIiwiaXNEZXZlbG9wbWVudCIsImZhaWx1cmVzIiwiT2JqZWN0Iiwia2V5cyIsImZvckVhY2giLCJmYWlsdXJlIiwibGVuZ3RoIiwiZXJyb3JzIiwiaW5zdGFsbGVkIiwicmVxdWlyZW1lbnQiLCJwdXNoIiwicXVhbGlmaWVyIiwiY29uc29sZSIsIndhcm4iLCJqb2luIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsTUFBTUEsT0FBTyxHQUFDQyxNQUFkO0FBQXFCRCxPQUFPLENBQUNFLE1BQVIsQ0FBZTtBQUFDQyxrQkFBZ0IsRUFBQyxNQUFJQTtBQUF0QixDQUFmO0FBQXdELElBQUlDLE1BQUo7QUFBV0osT0FBTyxDQUFDSyxJQUFSLENBQWEsUUFBYixFQUFzQjtBQUFDQyxTQUFPLENBQUNDLENBQUQsRUFBRztBQUFDSCxVQUFNLEdBQUNHLENBQVA7QUFBUzs7QUFBckIsQ0FBdEIsRUFBNkMsQ0FBN0M7O0FBRXhGO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTUMsNEJBQTRCLEdBQUcsQ0FBQ0MsSUFBRCxFQUFPQyxLQUFQLEtBQWlCO0FBQ3BELE1BQUk7QUFDRixVQUFNQyxnQkFBZ0IsR0FBR0MsT0FBTyxDQUFFLEdBQUVILElBQUssZUFBVCxDQUFQLENBQWdDSSxPQUF6RDs7QUFDQSxRQUFJVCxNQUFNLENBQUNVLFNBQVAsQ0FBaUJILGdCQUFqQixFQUFtQ0QsS0FBbkMsQ0FBSixFQUErQztBQUM3QyxhQUFPLElBQVA7QUFDRCxLQUZELE1BRU87QUFDTCxhQUFPQyxnQkFBUDtBQUNEO0FBQ0YsR0FQRCxDQU9FLE9BQU9JLENBQVAsRUFBVTtBQUNWO0FBQ0EsVUFBTUMsT0FBTyxHQUFHRCxDQUFDLENBQUNFLFFBQUYsRUFBaEIsQ0FGVSxDQUdWOztBQUNBLFFBQUlELE9BQU8sQ0FBQ0UsS0FBUixDQUFjLG9CQUFkLEtBQXVDRixPQUFPLENBQUNFLEtBQVIsQ0FBYyx1QkFBZCxDQUEzQyxFQUFtRjtBQUNqRixhQUFPLEtBQVA7QUFDRCxLQUZELE1BRU87QUFDTCxZQUFNSCxDQUFOO0FBQ0Q7QUFDRjtBQUNGLENBbEJEOztBQW9CTyxNQUFNWixnQkFBZ0IsR0FBRyxDQUFDZ0IsUUFBRCxFQUFXQyxXQUFYLEtBQTJCO0FBQ3pELE1BQUksQ0FBQ0MsTUFBTSxDQUFDQyxhQUFaLEVBQTJCO0FBQ3pCO0FBQ0Q7O0FBQ0QsUUFBTUMsUUFBUSxHQUFHLEVBQWpCO0FBRUFDLFFBQU0sQ0FBQ0MsSUFBUCxDQUFZTixRQUFaLEVBQXNCTyxPQUF0QixDQUErQmpCLElBQUQsSUFBVTtBQUN0QyxVQUFNQyxLQUFLLEdBQUdTLFFBQVEsQ0FBQ1YsSUFBRCxDQUF0QjtBQUNBLFVBQU1rQixPQUFPLEdBQUduQiw0QkFBNEIsQ0FBQ0MsSUFBRCxFQUFPQyxLQUFQLENBQTVDOztBQUVBLFFBQUlpQixPQUFPLEtBQUssSUFBaEIsRUFBc0I7QUFDcEJKLGNBQVEsQ0FBQ2QsSUFBRCxDQUFSLEdBQWlCa0IsT0FBakI7QUFDRDtBQUNGLEdBUEQ7O0FBU0EsTUFBSUgsTUFBTSxDQUFDQyxJQUFQLENBQVlGLFFBQVosRUFBc0JLLE1BQXRCLEtBQWlDLENBQXJDLEVBQXdDO0FBQ3RDLFdBQU8sSUFBUDtBQUNEOztBQUVELFFBQU1DLE1BQU0sR0FBRyxFQUFmO0FBRUFMLFFBQU0sQ0FBQ0MsSUFBUCxDQUFZRixRQUFaLEVBQXNCRyxPQUF0QixDQUErQmpCLElBQUQsSUFBVTtBQUN0QyxVQUFNcUIsU0FBUyxHQUFHUCxRQUFRLENBQUNkLElBQUQsQ0FBMUI7QUFDQSxVQUFNc0IsV0FBVyxHQUFJLEdBQUV0QixJQUFLLElBQUdVLFFBQVEsQ0FBQ1YsSUFBRCxDQUFPLEVBQTlDOztBQUVBLFFBQUlxQixTQUFKLEVBQWU7QUFDYkQsWUFBTSxDQUFDRyxJQUFQLENBQWEsTUFBS3ZCLElBQUssSUFBR3FCLFNBQVUsZUFBY0MsV0FBWSxTQUE5RDtBQUNELEtBRkQsTUFFTztBQUNMRixZQUFNLENBQUNHLElBQVAsQ0FBYSxNQUFLdkIsSUFBSyxJQUFHVSxRQUFRLENBQUNWLElBQUQsQ0FBTyxpQkFBekM7QUFDRDtBQUNGLEdBVEQ7QUFXQSxRQUFNd0IsU0FBUyxHQUFHYixXQUFXLEdBQUksUUFBT0EsV0FBWSxJQUF2QixHQUE2QixFQUExRDtBQUNBYyxTQUFPLENBQUNDLElBQVIsQ0FBYyxrQ0FBaUNGLFNBQVU7RUFDekRKLE1BQU0sQ0FBQ08sSUFBUCxDQUFZLElBQVosQ0FBa0I7Ozs7Q0FEbEI7QUFNRCxDQXZDTSxDIiwiZmlsZSI6Ii9wYWNrYWdlcy90bWVhc2RheV9jaGVjay1ucG0tdmVyc2lvbnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcblxyXG4vLyBSZXR1cm5zOlxyXG4vLyAgIC0gdHJ1ZSAgICAgIGlmIGEgdmVyc2lvbiBvZiB0aGUgcGFja2FnZSBpbiB0aGUgcmFuZ2UgaXMgaW5zdGFsbGVkXHJcbi8vICAgLSBmYWxzZSAgICAgaWYgbm8gdmVyc2lvbiBpcyBpbnN0YWxsZWRcclxuLy8gICAtIHZlcnNpb24jICBpZiBpbmNvbXBhdGlibGUgdmVyc2lvbiBpcyBpbnN0YWxsZWRcclxuY29uc3QgY29tcGF0aWJsZVZlcnNpb25Jc0luc3RhbGxlZCA9IChuYW1lLCByYW5nZSkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBpbnN0YWxsZWRWZXJzaW9uID0gcmVxdWlyZShgJHtuYW1lfS9wYWNrYWdlLmpzb25gKS52ZXJzaW9uO1xyXG4gICAgaWYgKHNlbXZlci5zYXRpc2ZpZXMoaW5zdGFsbGVkVmVyc2lvbiwgcmFuZ2UpKSB7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIGluc3RhbGxlZFZlcnNpb247XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgLy8gWFhYIGFkZCBzb21ldGhpbmcgdG8gdGhlIHRvb2wgdG8gbWFrZSB0aGlzIG1vcmUgcmVsaWFibGVcclxuICAgIGNvbnN0IG1lc3NhZ2UgPSBlLnRvU3RyaW5nKCk7XHJcbiAgICAvLyBPbmUgbWVzc2FnZSBjb21lcyBvdXQgb2YgdGhlIGluc3RhbGwgbnBtIHBhY2thZ2UgdGhlIG90aGVyIGZyb20gbnBtIGRpcmVjdGx5XHJcbiAgICBpZiAobWVzc2FnZS5tYXRjaChcIkNhbm5vdCBmaW5kIG1vZHVsZVwiKSB8fCBtZXNzYWdlLm1hdGNoKFwiQ2FuJ3QgZmluZCBucG0gbW9kdWxlXCIpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IGU7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IGNoZWNrTnBtVmVyc2lvbnMgPSAocGFja2FnZXMsIHBhY2thZ2VOYW1lKSA9PiB7XHJcbiAgaWYgKCFNZXRlb3IuaXNEZXZlbG9wbWVudCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCBmYWlsdXJlcyA9IHt9O1xyXG5cclxuICBPYmplY3Qua2V5cyhwYWNrYWdlcykuZm9yRWFjaCgobmFtZSkgPT4ge1xyXG4gICAgY29uc3QgcmFuZ2UgPSBwYWNrYWdlc1tuYW1lXTtcclxuICAgIGNvbnN0IGZhaWx1cmUgPSBjb21wYXRpYmxlVmVyc2lvbklzSW5zdGFsbGVkKG5hbWUsIHJhbmdlKTtcclxuXHJcbiAgICBpZiAoZmFpbHVyZSAhPT0gdHJ1ZSkge1xyXG4gICAgICBmYWlsdXJlc1tuYW1lXSA9IGZhaWx1cmU7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIGlmIChPYmplY3Qua2V5cyhmYWlsdXJlcykubGVuZ3RoID09PSAwKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGVycm9ycyA9IFtdO1xyXG5cclxuICBPYmplY3Qua2V5cyhmYWlsdXJlcykuZm9yRWFjaCgobmFtZSkgPT4ge1xyXG4gICAgY29uc3QgaW5zdGFsbGVkID0gZmFpbHVyZXNbbmFtZV07XHJcbiAgICBjb25zdCByZXF1aXJlbWVudCA9IGAke25hbWV9QCR7cGFja2FnZXNbbmFtZV19YDtcclxuXHJcbiAgICBpZiAoaW5zdGFsbGVkKSB7XHJcbiAgICAgIGVycm9ycy5wdXNoKGAgLSAke25hbWV9QCR7aW5zdGFsbGVkfSBpbnN0YWxsZWQsICR7cmVxdWlyZW1lbnR9IG5lZWRlZGApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZXJyb3JzLnB1c2goYCAtICR7bmFtZX1AJHtwYWNrYWdlc1tuYW1lXX0gbm90IGluc3RhbGxlZC5gKTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgY29uc3QgcXVhbGlmaWVyID0gcGFja2FnZU5hbWUgPyBgKGZvciAke3BhY2thZ2VOYW1lfSkgYCA6ICcnO1xyXG4gIGNvbnNvbGUud2FybihgV0FSTklORzogbnBtIHBlZXIgcmVxdWlyZW1lbnRzICR7cXVhbGlmaWVyfW5vdCBpbnN0YWxsZWQ6XHJcbiR7ZXJyb3JzLmpvaW4oJ1xcbicpfVxyXG5cclxuUmVhZCBtb3JlIGFib3V0IGluc3RhbGxpbmcgbnBtIHBlZXIgZGVwZW5kZW5jaWVzOlxyXG4gIGh0dHA6Ly9ndWlkZS5tZXRlb3IuY29tL3VzaW5nLXBhY2thZ2VzLmh0bWwjcGVlci1ucG0tZGVwZW5kZW5jaWVzXHJcbmApO1xyXG59O1xyXG4iXX0=
