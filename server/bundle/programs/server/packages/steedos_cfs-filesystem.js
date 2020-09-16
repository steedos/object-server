(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var FS = Package['steedos:cfs-base-package'].FS;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var exists;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:cfs-filesystem":{"checkNpm.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/steedos_cfs-filesystem/checkNpm.js                                                                    //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
let checkNpmVersions;
module.link("meteor/tmeasday:check-npm-versions", {
  checkNpmVersions(v) {
    checkNpmVersions = v;
  }

}, 0);
checkNpmVersions({
  mkdirp: "0.3.5"
}, 'steedos:cfs-filesystem');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"filesystem.server.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/steedos_cfs-filesystem/filesystem.server.js                                                           //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
var fs = require('fs');

var path = require('path');

var mkdirp = require('mkdirp'); //var chokidar = require('chokidar');


FS.Store.FileSystem = function (name, options) {
  var self = this;
  if (!(self instanceof FS.Store.FileSystem)) throw new Error('FS.Store.FileSystem missing keyword "new"'); // We allow options to be string/path empty or options.path

  options = options !== '' + options ? options || {} : {
    path: options
  }; // Provide a default FS directory one level up from the build/bundle directory

  var pathname = options.path;

  if (!pathname && __meteor_bootstrap__ && __meteor_bootstrap__.serverDir) {
    pathname = path.join(__meteor_bootstrap__.serverDir, '../../../cfs/files/' + name);
  }

  if (!pathname) throw new Error('FS.Store.FileSystem unable to determine path'); // Check if we have '~/foo/bar'

  if (pathname.split(path.sep)[0] === '~') {
    var homepath = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

    if (homepath) {
      pathname = pathname.replace('~', homepath);
    } else {
      throw new Error('FS.Store.FileSystem unable to resolve "~" in path');
    }
  } // Set absolute path


  var absolutePath = path.resolve(pathname); // Ensure the path exists

  mkdirp.sync(absolutePath);
  FS.debug && console.log(name + ' FileSystem mounted on: ' + absolutePath);
  return new FS.StorageAdapter(name, options, {
    typeName: 'storage.filesystem',
    fileKey: function (fileObj) {
      // Lookup the copy
      var store = fileObj && fileObj._getInfo(name); // If the store and key is found return the key


      if (store && store.key) return store.key;
      var filename = fileObj.name();
      var filenameInStore = fileObj.name({
        store: name
      }); // If no store key found we resolve / generate a key

      return fileObj.collectionName + '-' + fileObj._id + '-' + (filenameInStore || filename);
    },
    createReadStream: function (fileKey, options) {
      // this is the Storage adapter scope
      var filepath = path.join(absolutePath, fileKey);
      exists = fs.existsSync(filepath);
      if (!exists) throw new Meteor.Error(404, "Not Found", 'No file found'); // return the read stream - Options allow { start, end }

      return fs.createReadStream(filepath, options);
    },
    createWriteStream: function (fileKey, options) {
      options = options || {}; // this is the Storage adapter scope

      var filepath = path.join(absolutePath, fileKey); // Return the stream handle

      var writeStream = fs.createWriteStream(filepath, options); // The filesystem does not emit the "end" event only close - so we
      // manually send the end event

      writeStream.on('close', function () {
        if (FS.debug) console.log('SA FileSystem - DONE!! fileKey: "' + fileKey + '"'); // Get the exact size of the stored file, so that we can pass it to onEnd/onStored.
        // Since stream transforms might have altered the size, this is the best way to
        // ensure we update the fileObj.copies with the correct size.

        try {
          // Get the stats of the file
          var stats = fs.statSync(filepath); // Emit end and return the fileKey, size, and updated date

          writeStream.emit('stored', {
            fileKey: fileKey,
            size: stats.size,
            storedAt: stats.mtime
          });
        } catch (err) {
          // On error we emit the error on
          writeStream.emit('error', err);
        }
      });
      return writeStream;
    },
    remove: function (fileKey, callback) {
      // this is the Storage adapter scope
      var filepath = path.join(absolutePath, fileKey);
      var is_exists = fs.existsSync(filepath);

      if (is_exists) {
        // Call node unlink file
        fs.unlink(filepath, function (error, result) {
          if (error && error.errno === 34) {
            console.warn("SA FileSystem: Could not delete " + filepath + " because the file was not found.");
            callback && callback(null);
          } else {
            callback && callback(error, result);
          }
        });
      } else {
        callback && callback(null);
      }
    },
    stats: function (fileKey, callback) {
      // this is the Storage adapter scope
      var filepath = path.join(absolutePath, fileKey);

      if (typeof callback === 'function') {
        fs.stat(filepath, callback);
      } else {
        return fs.statSync(filepath);
      }
    } // Add this back and add the chokidar dependency back when we make this work eventually
    // watch: function(callback) {
    //   function fileKey(filePath) {
    //     return filePath.replace(absolutePath, "");
    //   }
    //   FS.debug && console.log('Watching ' + absolutePath);
    //   // chokidar seems to be most widely used and production ready watcher
    //   var watcher = chokidar.watch(absolutePath, {ignored: /\/\./, ignoreInitial: true});
    //   watcher.on('add', Meteor.bindEnvironment(function(filePath, stats) {
    //     callback("change", fileKey(filePath), {
    //       name: path.basename(filePath),
    //       type: null,
    //       size: stats.size,
    //       utime: stats.mtime
    //     });
    //   }, function(err) {
    //     throw err;
    //   }));
    //   watcher.on('change', Meteor.bindEnvironment(function(filePath, stats) {
    //     callback("change", fileKey(filePath), {
    //       name: path.basename(filePath),
    //       type: null,
    //       size: stats.size,
    //       utime: stats.mtime
    //     });
    //   }, function(err) {
    //     throw err;
    //   }));
    //   watcher.on('unlink', Meteor.bindEnvironment(function(filePath) {
    //     callback("remove", fileKey(filePath));
    //   }, function(err) {
    //     throw err;
    //   }));
    // }

  });
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/steedos:cfs-filesystem/checkNpm.js");
require("/node_modules/meteor/steedos:cfs-filesystem/filesystem.server.js");

/* Exports */
Package._define("steedos:cfs-filesystem");

})();

//# sourceURL=meteor://💻app/packages/steedos_cfs-filesystem.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpjZnMtZmlsZXN5c3RlbS9jaGVja05wbS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpjZnMtZmlsZXN5c3RlbS9maWxlc3lzdGVtLnNlcnZlci5qcyJdLCJuYW1lcyI6WyJjaGVja05wbVZlcnNpb25zIiwibW9kdWxlIiwibGluayIsInYiLCJta2RpcnAiLCJmcyIsInJlcXVpcmUiLCJwYXRoIiwiRlMiLCJTdG9yZSIsIkZpbGVTeXN0ZW0iLCJuYW1lIiwib3B0aW9ucyIsInNlbGYiLCJFcnJvciIsInBhdGhuYW1lIiwiX19tZXRlb3JfYm9vdHN0cmFwX18iLCJzZXJ2ZXJEaXIiLCJqb2luIiwic3BsaXQiLCJzZXAiLCJob21lcGF0aCIsInByb2Nlc3MiLCJlbnYiLCJIT01FIiwiSE9NRVBBVEgiLCJVU0VSUFJPRklMRSIsInJlcGxhY2UiLCJhYnNvbHV0ZVBhdGgiLCJyZXNvbHZlIiwic3luYyIsImRlYnVnIiwiY29uc29sZSIsImxvZyIsIlN0b3JhZ2VBZGFwdGVyIiwidHlwZU5hbWUiLCJmaWxlS2V5IiwiZmlsZU9iaiIsInN0b3JlIiwiX2dldEluZm8iLCJrZXkiLCJmaWxlbmFtZSIsImZpbGVuYW1lSW5TdG9yZSIsImNvbGxlY3Rpb25OYW1lIiwiX2lkIiwiY3JlYXRlUmVhZFN0cmVhbSIsImZpbGVwYXRoIiwiZXhpc3RzIiwiZXhpc3RzU3luYyIsIk1ldGVvciIsImNyZWF0ZVdyaXRlU3RyZWFtIiwid3JpdGVTdHJlYW0iLCJvbiIsInN0YXRzIiwic3RhdFN5bmMiLCJlbWl0Iiwic2l6ZSIsInN0b3JlZEF0IiwibXRpbWUiLCJlcnIiLCJyZW1vdmUiLCJjYWxsYmFjayIsImlzX2V4aXN0cyIsInVubGluayIsImVycm9yIiwicmVzdWx0IiwiZXJybm8iLCJ3YXJuIiwic3RhdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxn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QUFDRCxXQUhELE1BR087QUFDTEEsb0JBQVEsSUFBSUEsUUFBUSxDQUFDRyxLQUFELEVBQVFDLE1BQVIsQ0FBcEI7QUFDRDtBQUNGLFNBUEQ7QUFRRCxPQVZELE1BVU87QUFDTEosZ0JBQVEsSUFBSUEsUUFBUSxDQUFDLElBQUQsQ0FBcEI7QUFDRDtBQUNGLEtBaEZ5QztBQWlGMUNSLFNBQUssRUFBRSxVQUFTakIsT0FBVCxFQUFrQnlCLFFBQWxCLEVBQTRCO0FBQy9CO0FBQ0EsVUFBSWYsUUFBUSxHQUFHdkMsSUFBSSxDQUFDVyxJQUFMLENBQVVVLFlBQVYsRUFBd0JRLE9BQXhCLENBQWY7O0FBQ0EsVUFBSSxPQUFPeUIsUUFBUCxLQUFvQixVQUF4QixFQUFvQztBQUNsQ3hELFVBQUUsQ0FBQytELElBQUgsQ0FBUXRCLFFBQVIsRUFBa0JlLFFBQWxCO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBT3hELEVBQUUsQ0FBQ2lELFFBQUgsQ0FBWVIsUUFBWixDQUFQO0FBQ0Q7QUFDRixLQXpGdUMsQ0EwRnhDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFRjtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQTdIMEMsR0FBckMsQ0FBUDtBQStIRCxDQW5LRCxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9zdGVlZG9zX2Nmcy1maWxlc3lzdGVtLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY2hlY2tOcG1WZXJzaW9ucyB9IGZyb20gJ21ldGVvci90bWVhc2RheTpjaGVjay1ucG0tdmVyc2lvbnMnO1xyXG5jaGVja05wbVZlcnNpb25zKHtcclxuXHRta2RpcnA6IFwiMC4zLjVcIlxyXG59LCAnc3RlZWRvczpjZnMtZmlsZXN5c3RlbScpOyIsInZhciBmcyA9IHJlcXVpcmUoJ2ZzJyk7XHJcbnZhciBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xyXG52YXIgbWtkaXJwID0gcmVxdWlyZSgnbWtkaXJwJyk7XHJcbi8vdmFyIGNob2tpZGFyID0gcmVxdWlyZSgnY2hva2lkYXInKTtcclxuXHJcbkZTLlN0b3JlLkZpbGVTeXN0ZW0gPSBmdW5jdGlvbihuYW1lLCBvcHRpb25zKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIGlmICghKHNlbGYgaW5zdGFuY2VvZiBGUy5TdG9yZS5GaWxlU3lzdGVtKSlcclxuICAgIHRocm93IG5ldyBFcnJvcignRlMuU3RvcmUuRmlsZVN5c3RlbSBtaXNzaW5nIGtleXdvcmQgXCJuZXdcIicpO1xyXG5cclxuICAvLyBXZSBhbGxvdyBvcHRpb25zIHRvIGJlIHN0cmluZy9wYXRoIGVtcHR5IG9yIG9wdGlvbnMucGF0aFxyXG4gIG9wdGlvbnMgPSAob3B0aW9ucyAhPT0gJycgKyBvcHRpb25zKSA/IG9wdGlvbnMgfHwge30gOiB7XHJcbiAgICBwYXRoOiBvcHRpb25zXHJcbiAgfTtcclxuXHJcbiAgLy8gUHJvdmlkZSBhIGRlZmF1bHQgRlMgZGlyZWN0b3J5IG9uZSBsZXZlbCB1cCBmcm9tIHRoZSBidWlsZC9idW5kbGUgZGlyZWN0b3J5XHJcbiAgdmFyIHBhdGhuYW1lID0gb3B0aW9ucy5wYXRoO1xyXG4gIGlmICghcGF0aG5hbWUgJiYgX19tZXRlb3JfYm9vdHN0cmFwX18gJiYgX19tZXRlb3JfYm9vdHN0cmFwX18uc2VydmVyRGlyKSB7XHJcbiAgICBwYXRobmFtZSA9IHBhdGguam9pbihfX21ldGVvcl9ib290c3RyYXBfXy5zZXJ2ZXJEaXIsICcuLi8uLi8uLi9jZnMvZmlsZXMvJyArIG5hbWUpO1xyXG4gIH1cclxuXHJcbiAgaWYgKCFwYXRobmFtZSlcclxuICAgIHRocm93IG5ldyBFcnJvcignRlMuU3RvcmUuRmlsZVN5c3RlbSB1bmFibGUgdG8gZGV0ZXJtaW5lIHBhdGgnKTtcclxuXHJcbiAgLy8gQ2hlY2sgaWYgd2UgaGF2ZSAnfi9mb28vYmFyJ1xyXG4gIGlmIChwYXRobmFtZS5zcGxpdChwYXRoLnNlcClbMF0gPT09ICd+Jykge1xyXG4gICAgdmFyIGhvbWVwYXRoID0gcHJvY2Vzcy5lbnYuSE9NRSB8fCBwcm9jZXNzLmVudi5IT01FUEFUSCB8fCBwcm9jZXNzLmVudi5VU0VSUFJPRklMRTtcclxuICAgIGlmIChob21lcGF0aCkge1xyXG4gICAgICBwYXRobmFtZSA9IHBhdGhuYW1lLnJlcGxhY2UoJ34nLCBob21lcGF0aCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZTLlN0b3JlLkZpbGVTeXN0ZW0gdW5hYmxlIHRvIHJlc29sdmUgXCJ+XCIgaW4gcGF0aCcpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gU2V0IGFic29sdXRlIHBhdGhcclxuICB2YXIgYWJzb2x1dGVQYXRoID0gcGF0aC5yZXNvbHZlKHBhdGhuYW1lKTtcclxuXHJcbiAgLy8gRW5zdXJlIHRoZSBwYXRoIGV4aXN0c1xyXG4gIG1rZGlycC5zeW5jKGFic29sdXRlUGF0aCk7XHJcbiAgRlMuZGVidWcgJiYgY29uc29sZS5sb2cobmFtZSArICcgRmlsZVN5c3RlbSBtb3VudGVkIG9uOiAnICsgYWJzb2x1dGVQYXRoKTtcclxuXHJcbiAgcmV0dXJuIG5ldyBGUy5TdG9yYWdlQWRhcHRlcihuYW1lLCBvcHRpb25zLCB7XHJcbiAgICB0eXBlTmFtZTogJ3N0b3JhZ2UuZmlsZXN5c3RlbScsXHJcbiAgICBmaWxlS2V5OiBmdW5jdGlvbihmaWxlT2JqKSB7XHJcbiAgICAgIC8vIExvb2t1cCB0aGUgY29weVxyXG4gICAgICB2YXIgc3RvcmUgPSBmaWxlT2JqICYmIGZpbGVPYmouX2dldEluZm8obmFtZSk7XHJcbiAgICAgIC8vIElmIHRoZSBzdG9yZSBhbmQga2V5IGlzIGZvdW5kIHJldHVybiB0aGUga2V5XHJcbiAgICAgIGlmIChzdG9yZSAmJiBzdG9yZS5rZXkpIHJldHVybiBzdG9yZS5rZXk7XHJcblxyXG4gICAgICB2YXIgZmlsZW5hbWUgPSBmaWxlT2JqLm5hbWUoKTtcclxuICAgICAgdmFyIGZpbGVuYW1lSW5TdG9yZSA9IGZpbGVPYmoubmFtZSh7XHJcbiAgICAgICAgc3RvcmU6IG5hbWVcclxuICAgICAgfSk7XHJcblxyXG4gICAgICAvLyBJZiBubyBzdG9yZSBrZXkgZm91bmQgd2UgcmVzb2x2ZSAvIGdlbmVyYXRlIGEga2V5XHJcbiAgICAgIHJldHVybiBmaWxlT2JqLmNvbGxlY3Rpb25OYW1lICsgJy0nICsgZmlsZU9iai5faWQgKyAnLScgKyAoZmlsZW5hbWVJblN0b3JlIHx8IGZpbGVuYW1lKTtcclxuICAgIH0sXHJcbiAgICBjcmVhdGVSZWFkU3RyZWFtOiBmdW5jdGlvbihmaWxlS2V5LCBvcHRpb25zKSB7XHJcbiAgICAgIC8vIHRoaXMgaXMgdGhlIFN0b3JhZ2UgYWRhcHRlciBzY29wZVxyXG4gICAgICB2YXIgZmlsZXBhdGggPSBwYXRoLmpvaW4oYWJzb2x1dGVQYXRoLCBmaWxlS2V5KTtcclxuXHJcbiAgICAgIGV4aXN0cyA9IGZzLmV4aXN0c1N5bmMoZmlsZXBhdGgpO1xyXG4gICAgICBpZiAoIWV4aXN0cylcclxuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwNCwgXCJOb3QgRm91bmRcIiwgJ05vIGZpbGUgZm91bmQnKTtcclxuXHJcbiAgICAgIC8vIHJldHVybiB0aGUgcmVhZCBzdHJlYW0gLSBPcHRpb25zIGFsbG93IHsgc3RhcnQsIGVuZCB9XHJcbiAgICAgIHJldHVybiBmcy5jcmVhdGVSZWFkU3RyZWFtKGZpbGVwYXRoLCBvcHRpb25zKTtcclxuICAgIH0sXHJcbiAgICBjcmVhdGVXcml0ZVN0cmVhbTogZnVuY3Rpb24oZmlsZUtleSwgb3B0aW9ucykge1xyXG4gICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgIC8vIHRoaXMgaXMgdGhlIFN0b3JhZ2UgYWRhcHRlciBzY29wZVxyXG4gICAgICB2YXIgZmlsZXBhdGggPSBwYXRoLmpvaW4oYWJzb2x1dGVQYXRoLCBmaWxlS2V5KTtcclxuXHJcbiAgICAgIC8vIFJldHVybiB0aGUgc3RyZWFtIGhhbmRsZVxyXG4gICAgICB2YXIgd3JpdGVTdHJlYW0gPSBmcy5jcmVhdGVXcml0ZVN0cmVhbShmaWxlcGF0aCwgb3B0aW9ucyk7XHJcblxyXG4gICAgICAvLyBUaGUgZmlsZXN5c3RlbSBkb2VzIG5vdCBlbWl0IHRoZSBcImVuZFwiIGV2ZW50IG9ubHkgY2xvc2UgLSBzbyB3ZVxyXG4gICAgICAvLyBtYW51YWxseSBzZW5kIHRoZSBlbmQgZXZlbnRcclxuICAgICAgd3JpdGVTdHJlYW0ub24oJ2Nsb3NlJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKEZTLmRlYnVnKSBjb25zb2xlLmxvZygnU0EgRmlsZVN5c3RlbSAtIERPTkUhISBmaWxlS2V5OiBcIicgKyBmaWxlS2V5ICsgJ1wiJyk7XHJcblxyXG4gICAgICAgIC8vIEdldCB0aGUgZXhhY3Qgc2l6ZSBvZiB0aGUgc3RvcmVkIGZpbGUsIHNvIHRoYXQgd2UgY2FuIHBhc3MgaXQgdG8gb25FbmQvb25TdG9yZWQuXHJcbiAgICAgICAgLy8gU2luY2Ugc3RyZWFtIHRyYW5zZm9ybXMgbWlnaHQgaGF2ZSBhbHRlcmVkIHRoZSBzaXplLCB0aGlzIGlzIHRoZSBiZXN0IHdheSB0b1xyXG4gICAgICAgIC8vIGVuc3VyZSB3ZSB1cGRhdGUgdGhlIGZpbGVPYmouY29waWVzIHdpdGggdGhlIGNvcnJlY3Qgc2l6ZS5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgLy8gR2V0IHRoZSBzdGF0cyBvZiB0aGUgZmlsZVxyXG4gICAgICAgICAgdmFyIHN0YXRzID0gZnMuc3RhdFN5bmMoZmlsZXBhdGgpO1xyXG5cclxuICAgICAgICAgIC8vIEVtaXQgZW5kIGFuZCByZXR1cm4gdGhlIGZpbGVLZXksIHNpemUsIGFuZCB1cGRhdGVkIGRhdGVcclxuICAgICAgICAgIHdyaXRlU3RyZWFtLmVtaXQoJ3N0b3JlZCcsIHtcclxuICAgICAgICAgICAgZmlsZUtleTogZmlsZUtleSxcclxuICAgICAgICAgICAgc2l6ZTogc3RhdHMuc2l6ZSxcclxuICAgICAgICAgICAgc3RvcmVkQXQ6IHN0YXRzLm10aW1lXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAvLyBPbiBlcnJvciB3ZSBlbWl0IHRoZSBlcnJvciBvblxyXG4gICAgICAgICAgd3JpdGVTdHJlYW0uZW1pdCgnZXJyb3InLCBlcnIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gd3JpdGVTdHJlYW07XHJcbiAgICB9LFxyXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihmaWxlS2V5LCBjYWxsYmFjaykge1xyXG4gICAgICAvLyB0aGlzIGlzIHRoZSBTdG9yYWdlIGFkYXB0ZXIgc2NvcGVcclxuICAgICAgdmFyIGZpbGVwYXRoID0gcGF0aC5qb2luKGFic29sdXRlUGF0aCwgZmlsZUtleSk7XHJcbiAgICAgIHZhciBpc19leGlzdHMgPSBmcy5leGlzdHNTeW5jKGZpbGVwYXRoKTtcclxuICAgICAgaWYgKGlzX2V4aXN0cykge1xyXG4gICAgICAgIC8vIENhbGwgbm9kZSB1bmxpbmsgZmlsZVxyXG4gICAgICAgIGZzLnVubGluayhmaWxlcGF0aCwgZnVuY3Rpb24oZXJyb3IsIHJlc3VsdCkge1xyXG4gICAgICAgICAgaWYgKGVycm9yICYmIGVycm9yLmVycm5vID09PSAzNCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJTQSBGaWxlU3lzdGVtOiBDb3VsZCBub3QgZGVsZXRlIFwiICsgZmlsZXBhdGggKyBcIiBiZWNhdXNlIHRoZSBmaWxlIHdhcyBub3QgZm91bmQuXCIpO1xyXG4gICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhudWxsKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKGVycm9yLCByZXN1bHQpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKG51bGwpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgc3RhdHM6IGZ1bmN0aW9uKGZpbGVLZXksIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgLy8gdGhpcyBpcyB0aGUgU3RvcmFnZSBhZGFwdGVyIHNjb3BlXHJcbiAgICAgICAgdmFyIGZpbGVwYXRoID0gcGF0aC5qb2luKGFic29sdXRlUGF0aCwgZmlsZUtleSk7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgZnMuc3RhdChmaWxlcGF0aCwgY2FsbGJhY2spO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gZnMuc3RhdFN5bmMoZmlsZXBhdGgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICAvLyBBZGQgdGhpcyBiYWNrIGFuZCBhZGQgdGhlIGNob2tpZGFyIGRlcGVuZGVuY3kgYmFjayB3aGVuIHdlIG1ha2UgdGhpcyB3b3JrIGV2ZW50dWFsbHlcclxuICAgICAgLy8gd2F0Y2g6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XHJcbiAgICAgIC8vICAgZnVuY3Rpb24gZmlsZUtleShmaWxlUGF0aCkge1xyXG4gICAgICAvLyAgICAgcmV0dXJuIGZpbGVQYXRoLnJlcGxhY2UoYWJzb2x1dGVQYXRoLCBcIlwiKTtcclxuICAgICAgLy8gICB9XHJcblxyXG4gICAgLy8gICBGUy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnV2F0Y2hpbmcgJyArIGFic29sdXRlUGF0aCk7XHJcblxyXG4gICAgLy8gICAvLyBjaG9raWRhciBzZWVtcyB0byBiZSBtb3N0IHdpZGVseSB1c2VkIGFuZCBwcm9kdWN0aW9uIHJlYWR5IHdhdGNoZXJcclxuICAgIC8vICAgdmFyIHdhdGNoZXIgPSBjaG9raWRhci53YXRjaChhYnNvbHV0ZVBhdGgsIHtpZ25vcmVkOiAvXFwvXFwuLywgaWdub3JlSW5pdGlhbDogdHJ1ZX0pO1xyXG4gICAgLy8gICB3YXRjaGVyLm9uKCdhZGQnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KGZ1bmN0aW9uKGZpbGVQYXRoLCBzdGF0cykge1xyXG4gICAgLy8gICAgIGNhbGxiYWNrKFwiY2hhbmdlXCIsIGZpbGVLZXkoZmlsZVBhdGgpLCB7XHJcbiAgICAvLyAgICAgICBuYW1lOiBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKSxcclxuICAgIC8vICAgICAgIHR5cGU6IG51bGwsXHJcbiAgICAvLyAgICAgICBzaXplOiBzdGF0cy5zaXplLFxyXG4gICAgLy8gICAgICAgdXRpbWU6IHN0YXRzLm10aW1lXHJcbiAgICAvLyAgICAgfSk7XHJcbiAgICAvLyAgIH0sIGZ1bmN0aW9uKGVycikge1xyXG4gICAgLy8gICAgIHRocm93IGVycjtcclxuICAgIC8vICAgfSkpO1xyXG4gICAgLy8gICB3YXRjaGVyLm9uKCdjaGFuZ2UnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KGZ1bmN0aW9uKGZpbGVQYXRoLCBzdGF0cykge1xyXG4gICAgLy8gICAgIGNhbGxiYWNrKFwiY2hhbmdlXCIsIGZpbGVLZXkoZmlsZVBhdGgpLCB7XHJcbiAgICAvLyAgICAgICBuYW1lOiBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKSxcclxuICAgIC8vICAgICAgIHR5cGU6IG51bGwsXHJcbiAgICAvLyAgICAgICBzaXplOiBzdGF0cy5zaXplLFxyXG4gICAgLy8gICAgICAgdXRpbWU6IHN0YXRzLm10aW1lXHJcbiAgICAvLyAgICAgfSk7XHJcbiAgICAvLyAgIH0sIGZ1bmN0aW9uKGVycikge1xyXG4gICAgLy8gICAgIHRocm93IGVycjtcclxuICAgIC8vICAgfSkpO1xyXG4gICAgLy8gICB3YXRjaGVyLm9uKCd1bmxpbmsnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KGZ1bmN0aW9uKGZpbGVQYXRoKSB7XHJcbiAgICAvLyAgICAgY2FsbGJhY2soXCJyZW1vdmVcIiwgZmlsZUtleShmaWxlUGF0aCkpO1xyXG4gICAgLy8gICB9LCBmdW5jdGlvbihlcnIpIHtcclxuICAgIC8vICAgICB0aHJvdyBlcnI7XHJcbiAgICAvLyAgIH0pKTtcclxuICAgIC8vIH1cclxuICB9KTtcclxufTsiXX0=
