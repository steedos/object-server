(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var FS = Package['steedos:cfs-base-package'].FS;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var check = Package.check.check;
var Match = Package.check.Match;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var EJSON = Package.ejson.EJSON;
var EventEmitter = Package['raix:eventemitter'].EventEmitter;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;

/* Package-scope variables */
var _storageAdapters;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:cfs-storage-adapter":{"checkNpm.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/steedos_cfs-storage-adapter/checkNpm.js                                                                 //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let checkNpmVersions;
module.link("meteor/tmeasday:check-npm-versions", {
  checkNpmVersions(v) {
    checkNpmVersions = v;
  }

}, 0);
checkNpmVersions({
  'length-stream': '0.1.1'
}, 'steedos:cfs-storage-adapter');
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"storageAdapter.server.js":function(require){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/steedos_cfs-storage-adapter/storageAdapter.server.js                                                    //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
/* global FS, _storageAdapters:true, EventEmitter */
// #############################################################################
//
// STORAGE ADAPTER
//
// #############################################################################
_storageAdapters = {};

FS.StorageAdapter = function (storeName, options, api) {
  var self = this,
      fileKeyMaker;
  options = options || {}; // If storeName is the only argument, a string and the SA already found
  // we will just return that SA

  if (arguments.length === 1 && storeName === '' + storeName && typeof _storageAdapters[storeName] !== 'undefined') return _storageAdapters[storeName]; // Verify that the storage adapter defines all the necessary API methods

  if (typeof api === 'undefined') {
    throw new Error('FS.StorageAdapter please define an api');
  }

  FS.Utility.each('fileKey,remove,typeName,createReadStream,createWriteStream'.split(','), function (name) {
    if (typeof api[name] === 'undefined') {
      throw new Error('FS.StorageAdapter please define an api. "' + name + '" ' + (api.typeName || ''));
    }
  }); // Create an internal namespace, starting a name with underscore is only
  // allowed for stores marked with options.internal === true

  if (options.internal !== true && storeName[0] === '_') {
    throw new Error('A storage adapter name may not begin with "_"');
  }

  if (storeName.indexOf('.') !== -1) {
    throw new Error('A storage adapter name may not contain a "."');
  } // store reference for easy lookup by storeName


  if (typeof _storageAdapters[storeName] !== 'undefined') {
    throw new Error('Storage name already exists: "' + storeName + '"');
  } else {
    _storageAdapters[storeName] = self;
  } // User can customize the file key generation function


  if (typeof options.fileKeyMaker === "function") {
    fileKeyMaker = options.fileKeyMaker;
  } else {
    fileKeyMaker = api.fileKey;
  } // User can provide a function to adjust the fileObj
  // before it is written to the store.


  var beforeWrite = options.beforeWrite; // extend self with options and other info

  FS.Utility.extend(this, options, {
    name: storeName,
    typeName: api.typeName
  }); // Create a nicer abstracted adapter interface

  self.adapter = {};

  self.adapter.fileKey = function (fileObj) {
    return fileKeyMaker(fileObj);
  }; // Return readable stream for fileKey


  self.adapter.createReadStreamForFileKey = function (fileKey, options) {
    if (FS.debug) console.log('createReadStreamForFileKey ' + storeName);
    return FS.Utility.safeStream(api.createReadStream(fileKey, options));
  }; // Return readable stream for fileObj


  self.adapter.createReadStream = function (fileObj, options) {
    if (FS.debug) console.log('createReadStream ' + storeName);

    if (self.internal) {
      // Internal stores take a fileKey
      return self.adapter.createReadStreamForFileKey(fileObj, options);
    }

    return FS.Utility.safeStream(self._transform.createReadStream(fileObj, options));
  };

  function logEventsForStream(stream) {
    if (FS.debug) {
      stream.on('stored', function () {
        console.log('-----------STORED STREAM', storeName);
      });
      stream.on('close', function () {
        console.log('-----------CLOSE STREAM', storeName);
      });
      stream.on('end', function () {
        console.log('-----------END STREAM', storeName);
      });
      stream.on('finish', function () {
        console.log('-----------FINISH STREAM', storeName);
      });
      stream.on('error', function (error) {
        console.log('-----------ERROR STREAM', storeName, error && (error.message || error.code));
      });
    }
  } // Return writeable stream for fileKey


  self.adapter.createWriteStreamForFileKey = function (fileKey, options) {
    if (FS.debug) console.log('createWriteStreamForFileKey ' + storeName);
    var writeStream = FS.Utility.safeStream(api.createWriteStream(fileKey, options));
    logEventsForStream(writeStream);
    return writeStream;
  }; // Return writeable stream for fileObj


  self.adapter.createWriteStream = function (fileObj, options) {
    if (FS.debug) console.log('createWriteStream ' + storeName + ', internal: ' + !!self.internal);

    if (self.internal) {
      // Internal stores take a fileKey
      return self.adapter.createWriteStreamForFileKey(fileObj, options);
    } // If we haven't set name, type, or size for this version yet,
    // set it to same values as original version. We don't save
    // these to the DB right away because they might be changed
    // in a transformWrite function.


    if (!fileObj.name({
      store: storeName
    })) {
      fileObj.name(fileObj.name(), {
        store: storeName,
        save: false
      });
    }

    if (!fileObj.type({
      store: storeName
    })) {
      fileObj.type(fileObj.type(), {
        store: storeName,
        save: false
      });
    }

    if (!fileObj.size({
      store: storeName
    })) {
      fileObj.size(fileObj.size(), {
        store: storeName,
        save: false
      });
    } // Call user function to adjust file metadata for this store.
    // We support updating name, extension, and/or type based on
    // info returned in an object. Or `fileObj` could be
    // altered directly within the beforeWrite function.


    if (beforeWrite) {
      var fileChanges = beforeWrite(fileObj);

      if (typeof fileChanges === "object") {
        if (fileChanges.extension) {
          fileObj.extension(fileChanges.extension, {
            store: storeName,
            save: false
          });
        } else if (fileChanges.name) {
          fileObj.name(fileChanges.name, {
            store: storeName,
            save: false
          });
        }

        if (fileChanges.type) {
          fileObj.type(fileChanges.type, {
            store: storeName,
            save: false
          });
        }
      }
    }

    var writeStream = FS.Utility.safeStream(self._transform.createWriteStream(fileObj, options));
    logEventsForStream(writeStream); // Its really only the storage adapter who knows if the file is uploaded
    //
    // We have to use our own event making sure the storage process is completed
    // this is mainly

    writeStream.safeOn('stored', function (result) {
      if (typeof result.fileKey === 'undefined') {
        throw new Error('SA ' + storeName + ' type ' + api.typeName + ' did not return a fileKey');
      }

      if (FS.debug) console.log('SA', storeName, 'stored', result.fileKey); // Set the fileKey

      fileObj.copies[storeName].key = result.fileKey; // Update the size, as provided by the SA, in case it was changed by stream transformation

      if (typeof result.size === "number") {
        fileObj.copies[storeName].size = result.size;
      } // Set last updated time, either provided by SA or now


      fileObj.copies[storeName].updatedAt = result.storedAt || new Date(); // If the file object copy havent got a createdAt then set this

      if (typeof fileObj.copies[storeName].createdAt === 'undefined') {
        fileObj.copies[storeName].createdAt = fileObj.copies[storeName].updatedAt;
      }

      fileObj._saveChanges(storeName); // There is code in transform that may have set the original file size, too.


      fileObj._saveChanges('_original');
    }); // Emit events from SA

    writeStream.once('stored', function ()
    /*result*/
    {
      // XXX Because of the way stores inherit from SA, this will emit on every store.
      // Maybe need to rewrite the way we inherit from SA?
      var emitted = self.emit('stored', storeName, fileObj);

      if (FS.debug && !emitted) {
        console.log(fileObj.name() + ' was successfully stored in the ' + storeName + ' store. You are seeing this informational message because you enabled debugging and you have not defined any listeners for the "stored" event on this store.');
      }
    });
    writeStream.on('error', function (error) {
      // XXX We could wrap and clarify error
      // XXX Because of the way stores inherit from SA, this will emit on every store.
      // Maybe need to rewrite the way we inherit from SA?
      var emitted = self.emit('error', storeName, error, fileObj);

      if (FS.debug && !emitted) {
        console.log(error);
      }
    });
    return writeStream;
  }; //internal


  self._removeAsync = function (fileKey, callback) {
    // Remove the file from the store
    api.remove.call(self, fileKey, callback);
  };
  /**
   * @method FS.StorageAdapter.prototype.remove
   * @public
   * @param {FS.File} fsFile The FS.File instance to be stored.
   * @param {Function} [callback] If not provided, will block and return true or false
   *
   * Attempts to remove a file from the store. Returns true if removed or not
   * found, or false if the file couldn't be removed.
   */


  self.adapter.remove = function (fileObj, callback) {
    if (FS.debug) console.log("---SA REMOVE"); // Get the fileKey

    var fileKey = fileObj instanceof FS.File ? self.adapter.fileKey(fileObj) : fileObj;

    if (callback) {
      return self._removeAsync(fileKey, FS.Utility.safeCallback(callback));
    } else {
      return Meteor.wrapAsync(self._removeAsync)(fileKey);
    }
  };

  self.remove = function (fileObj, callback) {
    // Add deprecation note
    console.warn('Storage.remove is deprecating, use "Storage.adapter.remove"');
    return self.adapter.remove(fileObj, callback);
  };

  if (typeof api.init === 'function') {
    Meteor.wrapAsync(api.init.bind(self))();
  } // This supports optional transformWrite and transformRead


  self._transform = new FS.Transform({
    adapter: self.adapter,
    // Optional transformation functions:
    transformWrite: options.transformWrite,
    transformRead: options.transformRead
  });
};

require('util').inherits(FS.StorageAdapter, EventEmitter);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"transform.server.js":function(require){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/steedos_cfs-storage-adapter/transform.server.js                                                         //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
/* global FS, gm */
var PassThrough = require('stream').PassThrough;

var lengthStream = require('length-stream');

FS.Transform = function (options) {
  var self = this;
  options = options || {};
  if (!(self instanceof FS.Transform)) throw new Error('FS.Transform must be called with the "new" keyword');
  if (!options.adapter) throw new Error('Transform expects option.adapter to be a storage adapter');
  self.storage = options.adapter; // Fetch the transformation functions if any

  self.transformWrite = options.transformWrite;
  self.transformRead = options.transformRead;
}; // Allow packages to add scope


FS.Transform.scope = {
  // Deprecate gm scope:
  gm: function (source, height, color) {
    console.warn('Deprecation notice: `this.gm` is deprecating in favour of the general global `gm` scope');
    if (typeof gm !== 'function') throw new Error('No graphicsmagick package installed, `gm` not found in scope, eg. `cfs-graphicsmagick`');
    return gm(source, height, color);
  } // EO Deprecate gm scope

}; // The transformation stream triggers an "stored" event when data is stored into
// the storage adapter

FS.Transform.prototype.createWriteStream = function (fileObj) {
  var self = this; // Get the file key

  var fileKey = self.storage.fileKey(fileObj); // Rig write stream

  var destinationStream = self.storage.createWriteStreamForFileKey(fileKey, {
    // Not all SA's can set these options and cfs dont depend on setting these
    // but its nice if other systems are accessing the SA that some of the data
    // is also available to those
    aliases: [fileObj.name()],
    contentType: fileObj.type(),
    metadata: fileObj.metadata
  }); // Pass through transformWrite function if provided

  if (typeof self.transformWrite === 'function') {
    destinationStream = addPassThrough(destinationStream, function (ptStream, originalStream) {
      // Rig transform
      try {
        self.transformWrite.call(FS.Transform.scope, fileObj, ptStream, originalStream); // XXX: If the transform function returns a buffer should we stream that?
      } catch (err) {
        // We emit an error - should we throw an error?
        console.warn('FS.Transform.createWriteStream transform function failed, Error: ');
        throw err;
      }
    });
  } // If original doesn't have size, add another PassThrough to get and set the size.
  // This will run on size=0, too, which is OK.
  // NOTE: This must come AFTER the transformWrite code block above. This might seem
  // confusing, but by coming after it, this will actually be executed BEFORE the user's
  // transform, which is what we need in order to be sure we get the original file
  // size and not the transformed file size.


  if (!fileObj.size()) {
    destinationStream = addPassThrough(destinationStream, function (ptStream, originalStream) {
      var lstream = lengthStream(function (fileSize) {
        fileObj.size(fileSize, {
          save: false
        });
      });
      ptStream.pipe(lstream).pipe(originalStream);
    });
  }

  return destinationStream;
};

FS.Transform.prototype.createReadStream = function (fileObj, options) {
  var self = this; // Get the file key

  var fileKey = self.storage.fileKey(fileObj); // Rig read stream

  var sourceStream = self.storage.createReadStreamForFileKey(fileKey, options); // Pass through transformRead function if provided

  if (typeof self.transformRead === 'function') {
    sourceStream = addPassThrough(sourceStream, function (ptStream, originalStream) {
      // Rig transform
      try {
        self.transformRead.call(FS.Transform.scope, fileObj, originalStream, ptStream);
      } catch (err) {
        //throw new Error(err);
        // We emit an error - should we throw an error?
        sourceStream.emit('error', 'FS.Transform.createReadStream transform function failed');
      }
    });
  } // We dont transform just normal SA interface


  return sourceStream;
}; // Utility function to simplify adding layers of passthrough


function addPassThrough(stream, func) {
  var pts = new PassThrough(); // We pass on the special "stored" event for those listening

  stream.on('stored', function (result) {
    pts.emit('stored', result);
  });
  func(pts, stream);
  return pts;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/steedos:cfs-storage-adapter/checkNpm.js");
require("/node_modules/meteor/steedos:cfs-storage-adapter/storageAdapter.server.js");
require("/node_modules/meteor/steedos:cfs-storage-adapter/transform.server.js");

/* Exports */
Package._define("steedos:cfs-storage-adapter");

})();

//# sourceURL=meteor://💻app/packages/steedos_cfs-storage-adapter.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpjZnMtc3RvcmFnZS1hZGFwdGVyL2NoZWNrTnBtLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zOmNmcy1zdG9yYWdlLWFkYXB0ZXIvc3RvcmFnZUFkYXB0ZXIuc2VydmVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zOmNmcy1zdG9yYWdlLWFkYXB0ZXIvdHJhbnNmb3JtLnNlcnZlci5qcyJdLCJuYW1lcyI6WyJjaGVja05wbVZlcnNpb25zIiwibW9kdWxlIiwibGluayIsInYiLCJfc3RvcmFnZUFkYXB0ZXJzIiwiRlMiLCJTdG9yYWdlQWRhcHRlciIsInN0b3JlTmFtZSIsIm9wdGlvbnMiLCJhcGkiLCJzZWxmIiwiZmlsZUtleU1ha2VyIiwiYXJndW1lbnRzIiwibGVuZ3RoIiwiRXJyb3IiLCJVdGlsaXR5IiwiZWFjaCIsInNwbGl0IiwibmFtZSIsInR5cGVOYW1lIiwiaW50ZXJuYWwiLCJpbmRleE9mIiwiZmlsZUtleSIsImJlZm9yZVdyaXRlIiwiZXh0ZW5kIiwiYWRhcHRlciIsImZpbGVPYmoiLCJjcmVhdGVSZWFkU3RyZWFtRm9yRmlsZUtleSIsImRlYnVnIiwiY29uc29sZSIsImxvZyIsInNhZmVTdHJlYW0iLCJjcmVhdGVSZWFkU3RyZWFtIiwiX3RyYW5zZm9ybSIsImxvZ0V2ZW50c0ZvclN0cmVhbSIsInN0cmVhbSIsIm9uIiwiZXJyb3IiLCJtZXNzYWdlIiwiY29kZSIsImNyZWF0ZVdyaXRlU3RyZWFtRm9yRmlsZUtleSIsIndyaXRlU3RyZWFtIiwiY3JlYXRlV3JpdGVTdHJlYW0iLCJzdG9yZSIsInNhdmUiLCJ0eXBlIiwic2l6ZSIsImZpbGVDaGFuZ2VzIiwiZXh0ZW5zaW9uIiwic2FmZU9uIiwicmVzdWx0IiwiY29waWVzIiwia2V5IiwidXBkYXRlZEF0Iiwic3RvcmVkQXQiLCJEYXRlIiwiY3JlYXRlZEF0IiwiX3NhdmVDaGFuZ2VzIiwib25jZSIsImVtaXR0ZWQiLCJlbWl0IiwiX3JlbW92ZUFzeW5jIiwiY2FsbGJhY2siLCJyZW1vdmUiLCJjYWxsIiwiRmlsZSIsInNhZmVDYWxsYmFjayIsIk1ldGVvciIsIndyYXBBc3luYyIsIndhcm4iLCJpbml0IiwiYmluZCIsIlRyYW5zZm9ybSIsInRyYW5zZm9ybVdyaXRlIiwidHJhbnNmb3JtUmVhZCIsInJlcXVpcmUiLCJpbmhlcml0cyIsIkV2ZW50RW1pdHRlciIsIlBhc3NUaHJvdWdoIiwibGVuZ3RoU3RyZWFtIiwic3RvcmFnZSIsInNjb3BlIiwiZ20iLCJzb3VyY2UiLCJoZWlnaHQiLCJjb2xvciIsInByb3RvdHlwZSIsImRlc3RpbmF0aW9uU3RyZWFtIiwiYWxpYXNlcyIsImNvbnRlbnRUeXBlIiwibWV0YWRhdGEiLCJhZGRQYXNzVGhyb3VnaCIsInB0U3RyZWFtIiwib3JpZ2luYWxTdHJlYW0iLCJlcnIiLCJsc3RyZWFtIiwiZmlsZVNpemUiLCJwaXBlIiwic291cmNlU3RyZWFtIiwiZnVuYyIsInB0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSUEsZ0JBQUo7QUFBcUJDLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZLG9DQUFaLEVBQWlEO0FBQUNGLGtCQUFnQixDQUFDRyxDQUFELEVBQUc7QUFBQ0gsb0JBQWdCLEdBQUNHLENBQWpCO0FBQW1COztBQUF4QyxDQUFqRCxFQUEyRixDQUEzRjtBQUNyQkgsZ0JBQWdCLENBQUM7QUFDaEIsbUJBQWlCO0FBREQsQ0FBRCxFQUViLDZCQUZhLENBQWhCLEM7Ozs7Ozs7Ozs7O0FDREE7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FJLGdCQUFnQixHQUFHLEVBQW5COztBQUVBQyxFQUFFLENBQUNDLGNBQUgsR0FBb0IsVUFBU0MsU0FBVCxFQUFvQkMsT0FBcEIsRUFBNkJDLEdBQTdCLEVBQWtDO0FBQ3BELE1BQUlDLElBQUksR0FBRyxJQUFYO0FBQUEsTUFBaUJDLFlBQWpCO0FBQ0FI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O0FBQ25Da0QsT0FBRyxDQUFDeEMsSUFBSixDQUFTLFFBQVQsRUFBbUJWLE1BQW5CO0FBQ0QsR0FGRDtBQUdBaUQsTUFBSSxDQUFDQyxHQUFELEVBQU1qRSxNQUFOLENBQUo7QUFDQSxTQUFPaUUsR0FBUDtBQUNELEMiLCJmaWxlIjoiL3BhY2thZ2VzL3N0ZWVkb3NfY2ZzLXN0b3JhZ2UtYWRhcHRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNoZWNrTnBtVmVyc2lvbnMgfSBmcm9tICdtZXRlb3IvdG1lYXNkYXk6Y2hlY2stbnBtLXZlcnNpb25zJztcclxuY2hlY2tOcG1WZXJzaW9ucyh7XHJcblx0J2xlbmd0aC1zdHJlYW0nOiAnMC4xLjEnXHJcbn0sICdzdGVlZG9zOmNmcy1zdG9yYWdlLWFkYXB0ZXInKTsiLCIvKiBnbG9iYWwgRlMsIF9zdG9yYWdlQWRhcHRlcnM6dHJ1ZSwgRXZlbnRFbWl0dGVyICovXHJcblxyXG4vLyAjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xyXG4vL1xyXG4vLyBTVE9SQUdFIEFEQVBURVJcclxuLy9cclxuLy8gIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcclxuX3N0b3JhZ2VBZGFwdGVycyA9IHt9O1xyXG5cclxuRlMuU3RvcmFnZUFkYXB0ZXIgPSBmdW5jdGlvbihzdG9yZU5hbWUsIG9wdGlvbnMsIGFwaSkge1xyXG4gIHZhciBzZWxmID0gdGhpcywgZmlsZUtleU1ha2VyO1xyXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAvLyBJZiBzdG9yZU5hbWUgaXMgdGhlIG9ubHkgYXJndW1lbnQsIGEgc3RyaW5nIGFuZCB0aGUgU0EgYWxyZWFkeSBmb3VuZFxyXG4gIC8vIHdlIHdpbGwganVzdCByZXR1cm4gdGhhdCBTQVxyXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIHN0b3JlTmFtZSA9PT0gJycgKyBzdG9yZU5hbWUgJiZcclxuICAgICAgICAgIHR5cGVvZiBfc3RvcmFnZUFkYXB0ZXJzW3N0b3JlTmFtZV0gIT09ICd1bmRlZmluZWQnKVxyXG4gICAgcmV0dXJuIF9zdG9yYWdlQWRhcHRlcnNbc3RvcmVOYW1lXTtcclxuXHJcbiAgLy8gVmVyaWZ5IHRoYXQgdGhlIHN0b3JhZ2UgYWRhcHRlciBkZWZpbmVzIGFsbCB0aGUgbmVjZXNzYXJ5IEFQSSBtZXRob2RzXHJcbiAgaWYgKHR5cGVvZiBhcGkgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZTLlN0b3JhZ2VBZGFwdGVyIHBsZWFzZSBkZWZpbmUgYW4gYXBpJyk7XHJcbiAgfVxyXG5cclxuICBGUy5VdGlsaXR5LmVhY2goJ2ZpbGVLZXkscmVtb3ZlLHR5cGVOYW1lLGNyZWF0ZVJlYWRTdHJlYW0sY3JlYXRlV3JpdGVTdHJlYW0nLnNwbGl0KCcsJyksIGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgIGlmICh0eXBlb2YgYXBpW25hbWVdID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZTLlN0b3JhZ2VBZGFwdGVyIHBsZWFzZSBkZWZpbmUgYW4gYXBpLiBcIicgKyBuYW1lICsgJ1wiICcgKyAoYXBpLnR5cGVOYW1lIHx8ICcnKSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8vIENyZWF0ZSBhbiBpbnRlcm5hbCBuYW1lc3BhY2UsIHN0YXJ0aW5nIGEgbmFtZSB3aXRoIHVuZGVyc2NvcmUgaXMgb25seVxyXG4gIC8vIGFsbG93ZWQgZm9yIHN0b3JlcyBtYXJrZWQgd2l0aCBvcHRpb25zLmludGVybmFsID09PSB0cnVlXHJcbiAgaWYgKG9wdGlvbnMuaW50ZXJuYWwgIT09IHRydWUgJiYgc3RvcmVOYW1lWzBdID09PSAnXycpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignQSBzdG9yYWdlIGFkYXB0ZXIgbmFtZSBtYXkgbm90IGJlZ2luIHdpdGggXCJfXCInKTtcclxuICB9XHJcblxyXG4gIGlmIChzdG9yZU5hbWUuaW5kZXhPZignLicpICE9PSAtMSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdBIHN0b3JhZ2UgYWRhcHRlciBuYW1lIG1heSBub3QgY29udGFpbiBhIFwiLlwiJyk7XHJcbiAgfVxyXG5cclxuICAvLyBzdG9yZSByZWZlcmVuY2UgZm9yIGVhc3kgbG9va3VwIGJ5IHN0b3JlTmFtZVxyXG4gIGlmICh0eXBlb2YgX3N0b3JhZ2VBZGFwdGVyc1tzdG9yZU5hbWVdICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdTdG9yYWdlIG5hbWUgYWxyZWFkeSBleGlzdHM6IFwiJyArIHN0b3JlTmFtZSArICdcIicpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBfc3RvcmFnZUFkYXB0ZXJzW3N0b3JlTmFtZV0gPSBzZWxmO1xyXG4gIH1cclxuXHJcbiAgLy8gVXNlciBjYW4gY3VzdG9taXplIHRoZSBmaWxlIGtleSBnZW5lcmF0aW9uIGZ1bmN0aW9uXHJcbiAgaWYgKHR5cGVvZiBvcHRpb25zLmZpbGVLZXlNYWtlciA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICBmaWxlS2V5TWFrZXIgPSBvcHRpb25zLmZpbGVLZXlNYWtlcjtcclxuICB9IGVsc2Uge1xyXG4gICAgZmlsZUtleU1ha2VyID0gYXBpLmZpbGVLZXk7XHJcbiAgfVxyXG5cclxuICAvLyBVc2VyIGNhbiBwcm92aWRlIGEgZnVuY3Rpb24gdG8gYWRqdXN0IHRoZSBmaWxlT2JqXHJcbiAgLy8gYmVmb3JlIGl0IGlzIHdyaXR0ZW4gdG8gdGhlIHN0b3JlLlxyXG4gIHZhciBiZWZvcmVXcml0ZSA9IG9wdGlvbnMuYmVmb3JlV3JpdGU7XHJcblxyXG4gIC8vIGV4dGVuZCBzZWxmIHdpdGggb3B0aW9ucyBhbmQgb3RoZXIgaW5mb1xyXG4gIEZTLlV0aWxpdHkuZXh0ZW5kKHRoaXMsIG9wdGlvbnMsIHtcclxuICAgIG5hbWU6IHN0b3JlTmFtZSxcclxuICAgIHR5cGVOYW1lOiBhcGkudHlwZU5hbWVcclxuICB9KTtcclxuXHJcbiAgLy8gQ3JlYXRlIGEgbmljZXIgYWJzdHJhY3RlZCBhZGFwdGVyIGludGVyZmFjZVxyXG4gIHNlbGYuYWRhcHRlciA9IHt9O1xyXG5cclxuICBzZWxmLmFkYXB0ZXIuZmlsZUtleSA9IGZ1bmN0aW9uKGZpbGVPYmopIHtcclxuICAgIHJldHVybiBmaWxlS2V5TWFrZXIoZmlsZU9iaik7XHJcbiAgfTtcclxuXHJcbiAgLy8gUmV0dXJuIHJlYWRhYmxlIHN0cmVhbSBmb3IgZmlsZUtleVxyXG4gIHNlbGYuYWRhcHRlci5jcmVhdGVSZWFkU3RyZWFtRm9yRmlsZUtleSA9IGZ1bmN0aW9uKGZpbGVLZXksIG9wdGlvbnMpIHtcclxuICAgIGlmIChGUy5kZWJ1ZykgY29uc29sZS5sb2coJ2NyZWF0ZVJlYWRTdHJlYW1Gb3JGaWxlS2V5ICcgKyBzdG9yZU5hbWUpO1xyXG4gICAgcmV0dXJuIEZTLlV0aWxpdHkuc2FmZVN0cmVhbSggYXBpLmNyZWF0ZVJlYWRTdHJlYW0oZmlsZUtleSwgb3B0aW9ucykgKTtcclxuICB9O1xyXG5cclxuICAvLyBSZXR1cm4gcmVhZGFibGUgc3RyZWFtIGZvciBmaWxlT2JqXHJcbiAgc2VsZi5hZGFwdGVyLmNyZWF0ZVJlYWRTdHJlYW0gPSBmdW5jdGlvbihmaWxlT2JqLCBvcHRpb25zKSB7XHJcbiAgICBpZiAoRlMuZGVidWcpIGNvbnNvbGUubG9nKCdjcmVhdGVSZWFkU3RyZWFtICcgKyBzdG9yZU5hbWUpO1xyXG4gICAgaWYgKHNlbGYuaW50ZXJuYWwpIHtcclxuICAgICAgLy8gSW50ZXJuYWwgc3RvcmVzIHRha2UgYSBmaWxlS2V5XHJcbiAgICAgIHJldHVybiBzZWxmLmFkYXB0ZXIuY3JlYXRlUmVhZFN0cmVhbUZvckZpbGVLZXkoZmlsZU9iaiwgb3B0aW9ucyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gRlMuVXRpbGl0eS5zYWZlU3RyZWFtKCBzZWxmLl90cmFuc2Zvcm0uY3JlYXRlUmVhZFN0cmVhbShmaWxlT2JqLCBvcHRpb25zKSApO1xyXG4gIH07XHJcblxyXG4gIGZ1bmN0aW9uIGxvZ0V2ZW50c0ZvclN0cmVhbShzdHJlYW0pIHtcclxuICAgIGlmIChGUy5kZWJ1Zykge1xyXG4gICAgICBzdHJlYW0ub24oJ3N0b3JlZCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLVNUT1JFRCBTVFJFQU0nLCBzdG9yZU5hbWUpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHN0cmVhbS5vbignY2xvc2UnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS1DTE9TRSBTVFJFQU0nLCBzdG9yZU5hbWUpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHN0cmVhbS5vbignZW5kJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJy0tLS0tLS0tLS0tRU5EIFNUUkVBTScsIHN0b3JlTmFtZSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgc3RyZWFtLm9uKCdmaW5pc2gnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS1GSU5JU0ggU1RSRUFNJywgc3RvcmVOYW1lKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBzdHJlYW0ub24oJ2Vycm9yJywgZnVuY3Rpb24oZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS1FUlJPUiBTVFJFQU0nLCBzdG9yZU5hbWUsIGVycm9yICYmIChlcnJvci5tZXNzYWdlIHx8IGVycm9yLmNvZGUpKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBSZXR1cm4gd3JpdGVhYmxlIHN0cmVhbSBmb3IgZmlsZUtleVxyXG4gIHNlbGYuYWRhcHRlci5jcmVhdGVXcml0ZVN0cmVhbUZvckZpbGVLZXkgPSBmdW5jdGlvbihmaWxlS2V5LCBvcHRpb25zKSB7XHJcbiAgICBpZiAoRlMuZGVidWcpIGNvbnNvbGUubG9nKCdjcmVhdGVXcml0ZVN0cmVhbUZvckZpbGVLZXkgJyArIHN0b3JlTmFtZSk7XHJcbiAgICB2YXIgd3JpdGVTdHJlYW0gPSBGUy5VdGlsaXR5LnNhZmVTdHJlYW0oIGFwaS5jcmVhdGVXcml0ZVN0cmVhbShmaWxlS2V5LCBvcHRpb25zKSApO1xyXG5cclxuICAgIGxvZ0V2ZW50c0ZvclN0cmVhbSh3cml0ZVN0cmVhbSk7XHJcblxyXG4gICAgcmV0dXJuIHdyaXRlU3RyZWFtO1xyXG4gIH07XHJcblxyXG4gIC8vIFJldHVybiB3cml0ZWFibGUgc3RyZWFtIGZvciBmaWxlT2JqXHJcbiAgc2VsZi5hZGFwdGVyLmNyZWF0ZVdyaXRlU3RyZWFtID0gZnVuY3Rpb24oZmlsZU9iaiwgb3B0aW9ucykge1xyXG4gICAgaWYgKEZTLmRlYnVnKSBjb25zb2xlLmxvZygnY3JlYXRlV3JpdGVTdHJlYW0gJyArIHN0b3JlTmFtZSArICcsIGludGVybmFsOiAnICsgISFzZWxmLmludGVybmFsKTtcclxuXHJcbiAgICBpZiAoc2VsZi5pbnRlcm5hbCkge1xyXG4gICAgICAvLyBJbnRlcm5hbCBzdG9yZXMgdGFrZSBhIGZpbGVLZXlcclxuICAgICAgcmV0dXJuIHNlbGYuYWRhcHRlci5jcmVhdGVXcml0ZVN0cmVhbUZvckZpbGVLZXkoZmlsZU9iaiwgb3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSWYgd2UgaGF2ZW4ndCBzZXQgbmFtZSwgdHlwZSwgb3Igc2l6ZSBmb3IgdGhpcyB2ZXJzaW9uIHlldCxcclxuICAgIC8vIHNldCBpdCB0byBzYW1lIHZhbHVlcyBhcyBvcmlnaW5hbCB2ZXJzaW9uLiBXZSBkb24ndCBzYXZlXHJcbiAgICAvLyB0aGVzZSB0byB0aGUgREIgcmlnaHQgYXdheSBiZWNhdXNlIHRoZXkgbWlnaHQgYmUgY2hhbmdlZFxyXG4gICAgLy8gaW4gYSB0cmFuc2Zvcm1Xcml0ZSBmdW5jdGlvbi5cclxuICAgIGlmICghZmlsZU9iai5uYW1lKHtzdG9yZTogc3RvcmVOYW1lfSkpIHtcclxuICAgICAgZmlsZU9iai5uYW1lKGZpbGVPYmoubmFtZSgpLCB7c3RvcmU6IHN0b3JlTmFtZSwgc2F2ZTogZmFsc2V9KTtcclxuICAgIH1cclxuICAgIGlmICghZmlsZU9iai50eXBlKHtzdG9yZTogc3RvcmVOYW1lfSkpIHtcclxuICAgICAgZmlsZU9iai50eXBlKGZpbGVPYmoudHlwZSgpLCB7c3RvcmU6IHN0b3JlTmFtZSwgc2F2ZTogZmFsc2V9KTtcclxuICAgIH1cclxuICAgIGlmICghZmlsZU9iai5zaXplKHtzdG9yZTogc3RvcmVOYW1lfSkpIHtcclxuICAgICAgZmlsZU9iai5zaXplKGZpbGVPYmouc2l6ZSgpLCB7c3RvcmU6IHN0b3JlTmFtZSwgc2F2ZTogZmFsc2V9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDYWxsIHVzZXIgZnVuY3Rpb24gdG8gYWRqdXN0IGZpbGUgbWV0YWRhdGEgZm9yIHRoaXMgc3RvcmUuXHJcbiAgICAvLyBXZSBzdXBwb3J0IHVwZGF0aW5nIG5hbWUsIGV4dGVuc2lvbiwgYW5kL29yIHR5cGUgYmFzZWQgb25cclxuICAgIC8vIGluZm8gcmV0dXJuZWQgaW4gYW4gb2JqZWN0LiBPciBgZmlsZU9iamAgY291bGQgYmVcclxuICAgIC8vIGFsdGVyZWQgZGlyZWN0bHkgd2l0aGluIHRoZSBiZWZvcmVXcml0ZSBmdW5jdGlvbi5cclxuICAgIGlmIChiZWZvcmVXcml0ZSkge1xyXG4gICAgICB2YXIgZmlsZUNoYW5nZXMgPSBiZWZvcmVXcml0ZShmaWxlT2JqKTtcclxuICAgICAgaWYgKHR5cGVvZiBmaWxlQ2hhbmdlcyA9PT0gXCJvYmplY3RcIikge1xyXG4gICAgICAgIGlmIChmaWxlQ2hhbmdlcy5leHRlbnNpb24pIHtcclxuICAgICAgICAgIGZpbGVPYmouZXh0ZW5zaW9uKGZpbGVDaGFuZ2VzLmV4dGVuc2lvbiwge3N0b3JlOiBzdG9yZU5hbWUsIHNhdmU6IGZhbHNlfSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChmaWxlQ2hhbmdlcy5uYW1lKSB7XHJcbiAgICAgICAgICBmaWxlT2JqLm5hbWUoZmlsZUNoYW5nZXMubmFtZSwge3N0b3JlOiBzdG9yZU5hbWUsIHNhdmU6IGZhbHNlfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChmaWxlQ2hhbmdlcy50eXBlKSB7XHJcbiAgICAgICAgICBmaWxlT2JqLnR5cGUoZmlsZUNoYW5nZXMudHlwZSwge3N0b3JlOiBzdG9yZU5hbWUsIHNhdmU6IGZhbHNlfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHdyaXRlU3RyZWFtID0gRlMuVXRpbGl0eS5zYWZlU3RyZWFtKCBzZWxmLl90cmFuc2Zvcm0uY3JlYXRlV3JpdGVTdHJlYW0oZmlsZU9iaiwgb3B0aW9ucykgKTtcclxuXHJcbiAgICBsb2dFdmVudHNGb3JTdHJlYW0od3JpdGVTdHJlYW0pO1xyXG5cclxuICAgIC8vIEl0cyByZWFsbHkgb25seSB0aGUgc3RvcmFnZSBhZGFwdGVyIHdobyBrbm93cyBpZiB0aGUgZmlsZSBpcyB1cGxvYWRlZFxyXG4gICAgLy9cclxuICAgIC8vIFdlIGhhdmUgdG8gdXNlIG91ciBvd24gZXZlbnQgbWFraW5nIHN1cmUgdGhlIHN0b3JhZ2UgcHJvY2VzcyBpcyBjb21wbGV0ZWRcclxuICAgIC8vIHRoaXMgaXMgbWFpbmx5XHJcbiAgICB3cml0ZVN0cmVhbS5zYWZlT24oJ3N0b3JlZCcsIGZ1bmN0aW9uKHJlc3VsdCkge1xyXG4gICAgICBpZiAodHlwZW9mIHJlc3VsdC5maWxlS2V5ID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU0EgJyArIHN0b3JlTmFtZSArICcgdHlwZSAnICsgYXBpLnR5cGVOYW1lICsgJyBkaWQgbm90IHJldHVybiBhIGZpbGVLZXknKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoRlMuZGVidWcpIGNvbnNvbGUubG9nKCdTQScsIHN0b3JlTmFtZSwgJ3N0b3JlZCcsIHJlc3VsdC5maWxlS2V5KTtcclxuICAgICAgLy8gU2V0IHRoZSBmaWxlS2V5XHJcbiAgICAgIGZpbGVPYmouY29waWVzW3N0b3JlTmFtZV0ua2V5ID0gcmVzdWx0LmZpbGVLZXk7XHJcblxyXG4gICAgICAvLyBVcGRhdGUgdGhlIHNpemUsIGFzIHByb3ZpZGVkIGJ5IHRoZSBTQSwgaW4gY2FzZSBpdCB3YXMgY2hhbmdlZCBieSBzdHJlYW0gdHJhbnNmb3JtYXRpb25cclxuICAgICAgaWYgKHR5cGVvZiByZXN1bHQuc2l6ZSA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICAgIGZpbGVPYmouY29waWVzW3N0b3JlTmFtZV0uc2l6ZSA9IHJlc3VsdC5zaXplO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBTZXQgbGFzdCB1cGRhdGVkIHRpbWUsIGVpdGhlciBwcm92aWRlZCBieSBTQSBvciBub3dcclxuICAgICAgZmlsZU9iai5jb3BpZXNbc3RvcmVOYW1lXS51cGRhdGVkQXQgPSByZXN1bHQuc3RvcmVkQXQgfHwgbmV3IERhdGUoKTtcclxuXHJcbiAgICAgIC8vIElmIHRoZSBmaWxlIG9iamVjdCBjb3B5IGhhdmVudCBnb3QgYSBjcmVhdGVkQXQgdGhlbiBzZXQgdGhpc1xyXG4gICAgICBpZiAodHlwZW9mIGZpbGVPYmouY29waWVzW3N0b3JlTmFtZV0uY3JlYXRlZEF0ID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIGZpbGVPYmouY29waWVzW3N0b3JlTmFtZV0uY3JlYXRlZEF0ID0gZmlsZU9iai5jb3BpZXNbc3RvcmVOYW1lXS51cGRhdGVkQXQ7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZpbGVPYmouX3NhdmVDaGFuZ2VzKHN0b3JlTmFtZSk7XHJcblxyXG4gICAgICAvLyBUaGVyZSBpcyBjb2RlIGluIHRyYW5zZm9ybSB0aGF0IG1heSBoYXZlIHNldCB0aGUgb3JpZ2luYWwgZmlsZSBzaXplLCB0b28uXHJcbiAgICAgIGZpbGVPYmouX3NhdmVDaGFuZ2VzKCdfb3JpZ2luYWwnKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEVtaXQgZXZlbnRzIGZyb20gU0FcclxuICAgIHdyaXRlU3RyZWFtLm9uY2UoJ3N0b3JlZCcsIGZ1bmN0aW9uKC8qcmVzdWx0Ki8pIHtcclxuICAgICAgLy8gWFhYIEJlY2F1c2Ugb2YgdGhlIHdheSBzdG9yZXMgaW5oZXJpdCBmcm9tIFNBLCB0aGlzIHdpbGwgZW1pdCBvbiBldmVyeSBzdG9yZS5cclxuICAgICAgLy8gTWF5YmUgbmVlZCB0byByZXdyaXRlIHRoZSB3YXkgd2UgaW5oZXJpdCBmcm9tIFNBP1xyXG4gICAgICB2YXIgZW1pdHRlZCA9IHNlbGYuZW1pdCgnc3RvcmVkJywgc3RvcmVOYW1lLCBmaWxlT2JqKTtcclxuICAgICAgaWYgKEZTLmRlYnVnICYmICFlbWl0dGVkKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coZmlsZU9iai5uYW1lKCkgKyAnIHdhcyBzdWNjZXNzZnVsbHkgc3RvcmVkIGluIHRoZSAnICsgc3RvcmVOYW1lICsgJyBzdG9yZS4gWW91IGFyZSBzZWVpbmcgdGhpcyBpbmZvcm1hdGlvbmFsIG1lc3NhZ2UgYmVjYXVzZSB5b3UgZW5hYmxlZCBkZWJ1Z2dpbmcgYW5kIHlvdSBoYXZlIG5vdCBkZWZpbmVkIGFueSBsaXN0ZW5lcnMgZm9yIHRoZSBcInN0b3JlZFwiIGV2ZW50IG9uIHRoaXMgc3RvcmUuJyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHdyaXRlU3RyZWFtLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGVycm9yKSB7XHJcbiAgICAgIC8vIFhYWCBXZSBjb3VsZCB3cmFwIGFuZCBjbGFyaWZ5IGVycm9yXHJcbiAgICAgIC8vIFhYWCBCZWNhdXNlIG9mIHRoZSB3YXkgc3RvcmVzIGluaGVyaXQgZnJvbSBTQSwgdGhpcyB3aWxsIGVtaXQgb24gZXZlcnkgc3RvcmUuXHJcbiAgICAgIC8vIE1heWJlIG5lZWQgdG8gcmV3cml0ZSB0aGUgd2F5IHdlIGluaGVyaXQgZnJvbSBTQT9cclxuICAgICAgdmFyIGVtaXR0ZWQgPSBzZWxmLmVtaXQoJ2Vycm9yJywgc3RvcmVOYW1lLCBlcnJvciwgZmlsZU9iaik7XHJcbiAgICAgIGlmIChGUy5kZWJ1ZyAmJiAhZW1pdHRlZCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHdyaXRlU3RyZWFtO1xyXG4gIH07XHJcblxyXG4gIC8vaW50ZXJuYWxcclxuICBzZWxmLl9yZW1vdmVBc3luYyA9IGZ1bmN0aW9uKGZpbGVLZXksIGNhbGxiYWNrKSB7XHJcbiAgICAvLyBSZW1vdmUgdGhlIGZpbGUgZnJvbSB0aGUgc3RvcmVcclxuICAgIGFwaS5yZW1vdmUuY2FsbChzZWxmLCBmaWxlS2V5LCBjYWxsYmFjayk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQG1ldGhvZCBGUy5TdG9yYWdlQWRhcHRlci5wcm90b3R5cGUucmVtb3ZlXHJcbiAgICogQHB1YmxpY1xyXG4gICAqIEBwYXJhbSB7RlMuRmlsZX0gZnNGaWxlIFRoZSBGUy5GaWxlIGluc3RhbmNlIHRvIGJlIHN0b3JlZC5cclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2tdIElmIG5vdCBwcm92aWRlZCwgd2lsbCBibG9jayBhbmQgcmV0dXJuIHRydWUgb3IgZmFsc2VcclxuICAgKlxyXG4gICAqIEF0dGVtcHRzIHRvIHJlbW92ZSBhIGZpbGUgZnJvbSB0aGUgc3RvcmUuIFJldHVybnMgdHJ1ZSBpZiByZW1vdmVkIG9yIG5vdFxyXG4gICAqIGZvdW5kLCBvciBmYWxzZSBpZiB0aGUgZmlsZSBjb3VsZG4ndCBiZSByZW1vdmVkLlxyXG4gICAqL1xyXG4gIHNlbGYuYWRhcHRlci5yZW1vdmUgPSBmdW5jdGlvbihmaWxlT2JqLCBjYWxsYmFjaykge1xyXG4gICAgaWYgKEZTLmRlYnVnKSBjb25zb2xlLmxvZyhcIi0tLVNBIFJFTU9WRVwiKTtcclxuXHJcbiAgICAvLyBHZXQgdGhlIGZpbGVLZXlcclxuICAgIHZhciBmaWxlS2V5ID0gKGZpbGVPYmogaW5zdGFuY2VvZiBGUy5GaWxlKSA/IHNlbGYuYWRhcHRlci5maWxlS2V5KGZpbGVPYmopIDogZmlsZU9iajtcclxuXHJcbiAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgcmV0dXJuIHNlbGYuX3JlbW92ZUFzeW5jKGZpbGVLZXksIEZTLlV0aWxpdHkuc2FmZUNhbGxiYWNrKGNhbGxiYWNrKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gTWV0ZW9yLndyYXBBc3luYyhzZWxmLl9yZW1vdmVBc3luYykoZmlsZUtleSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgc2VsZi5yZW1vdmUgPSBmdW5jdGlvbihmaWxlT2JqLCBjYWxsYmFjaykge1xyXG4gICAgLy8gQWRkIGRlcHJlY2F0aW9uIG5vdGVcclxuICAgIGNvbnNvbGUud2FybignU3RvcmFnZS5yZW1vdmUgaXMgZGVwcmVjYXRpbmcsIHVzZSBcIlN0b3JhZ2UuYWRhcHRlci5yZW1vdmVcIicpO1xyXG4gICAgcmV0dXJuIHNlbGYuYWRhcHRlci5yZW1vdmUoZmlsZU9iaiwgY2FsbGJhY2spO1xyXG4gIH07XHJcblxyXG4gIGlmICh0eXBlb2YgYXBpLmluaXQgPT09ICdmdW5jdGlvbicpIHtcclxuICAgIE1ldGVvci53cmFwQXN5bmMoYXBpLmluaXQuYmluZChzZWxmKSkoKTtcclxuICB9XHJcblxyXG4gIC8vIFRoaXMgc3VwcG9ydHMgb3B0aW9uYWwgdHJhbnNmb3JtV3JpdGUgYW5kIHRyYW5zZm9ybVJlYWRcclxuICBzZWxmLl90cmFuc2Zvcm0gPSBuZXcgRlMuVHJhbnNmb3JtKHtcclxuICAgIGFkYXB0ZXI6IHNlbGYuYWRhcHRlcixcclxuICAgIC8vIE9wdGlvbmFsIHRyYW5zZm9ybWF0aW9uIGZ1bmN0aW9uczpcclxuICAgIHRyYW5zZm9ybVdyaXRlOiBvcHRpb25zLnRyYW5zZm9ybVdyaXRlLFxyXG4gICAgdHJhbnNmb3JtUmVhZDogb3B0aW9ucy50cmFuc2Zvcm1SZWFkXHJcbiAgfSk7XHJcblxyXG59O1xyXG5cclxucmVxdWlyZSgndXRpbCcpLmluaGVyaXRzKEZTLlN0b3JhZ2VBZGFwdGVyLCBFdmVudEVtaXR0ZXIpO1xyXG4iLCIvKiBnbG9iYWwgRlMsIGdtICovXHJcblxyXG52YXIgUGFzc1Rocm91Z2ggPSByZXF1aXJlKCdzdHJlYW0nKS5QYXNzVGhyb3VnaDtcclxudmFyIGxlbmd0aFN0cmVhbSA9IHJlcXVpcmUoJ2xlbmd0aC1zdHJlYW0nKTtcclxuXHJcbkZTLlRyYW5zZm9ybSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICBpZiAoIShzZWxmIGluc3RhbmNlb2YgRlMuVHJhbnNmb3JtKSlcclxuICAgIHRocm93IG5ldyBFcnJvcignRlMuVHJhbnNmb3JtIG11c3QgYmUgY2FsbGVkIHdpdGggdGhlIFwibmV3XCIga2V5d29yZCcpO1xyXG5cclxuICBpZiAoIW9wdGlvbnMuYWRhcHRlcilcclxuICAgIHRocm93IG5ldyBFcnJvcignVHJhbnNmb3JtIGV4cGVjdHMgb3B0aW9uLmFkYXB0ZXIgdG8gYmUgYSBzdG9yYWdlIGFkYXB0ZXInKTtcclxuXHJcbiAgc2VsZi5zdG9yYWdlID0gb3B0aW9ucy5hZGFwdGVyO1xyXG5cclxuICAvLyBGZXRjaCB0aGUgdHJhbnNmb3JtYXRpb24gZnVuY3Rpb25zIGlmIGFueVxyXG4gIHNlbGYudHJhbnNmb3JtV3JpdGUgPSBvcHRpb25zLnRyYW5zZm9ybVdyaXRlO1xyXG4gIHNlbGYudHJhbnNmb3JtUmVhZCA9IG9wdGlvbnMudHJhbnNmb3JtUmVhZDtcclxufTtcclxuXHJcbi8vIEFsbG93IHBhY2thZ2VzIHRvIGFkZCBzY29wZVxyXG5GUy5UcmFuc2Zvcm0uc2NvcGUgPSB7XHJcbi8vIERlcHJlY2F0ZSBnbSBzY29wZTpcclxuICBnbTogZnVuY3Rpb24oc291cmNlLCBoZWlnaHQsIGNvbG9yKSB7XHJcbiAgICBjb25zb2xlLndhcm4oJ0RlcHJlY2F0aW9uIG5vdGljZTogYHRoaXMuZ21gIGlzIGRlcHJlY2F0aW5nIGluIGZhdm91ciBvZiB0aGUgZ2VuZXJhbCBnbG9iYWwgYGdtYCBzY29wZScpO1xyXG4gICAgaWYgKHR5cGVvZiBnbSAhPT0gJ2Z1bmN0aW9uJylcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBncmFwaGljc21hZ2ljayBwYWNrYWdlIGluc3RhbGxlZCwgYGdtYCBub3QgZm91bmQgaW4gc2NvcGUsIGVnLiBgY2ZzLWdyYXBoaWNzbWFnaWNrYCcpO1xyXG4gICAgcmV0dXJuIGdtKHNvdXJjZSwgaGVpZ2h0LCBjb2xvcik7XHJcbiAgfVxyXG4vLyBFTyBEZXByZWNhdGUgZ20gc2NvcGVcclxufTtcclxuXHJcbi8vIFRoZSB0cmFuc2Zvcm1hdGlvbiBzdHJlYW0gdHJpZ2dlcnMgYW4gXCJzdG9yZWRcIiBldmVudCB3aGVuIGRhdGEgaXMgc3RvcmVkIGludG9cclxuLy8gdGhlIHN0b3JhZ2UgYWRhcHRlclxyXG5GUy5UcmFuc2Zvcm0ucHJvdG90eXBlLmNyZWF0ZVdyaXRlU3RyZWFtID0gZnVuY3Rpb24oZmlsZU9iaikge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgLy8gR2V0IHRoZSBmaWxlIGtleVxyXG4gIHZhciBmaWxlS2V5ID0gc2VsZi5zdG9yYWdlLmZpbGVLZXkoZmlsZU9iaik7XHJcblxyXG4gIC8vIFJpZyB3cml0ZSBzdHJlYW1cclxuICB2YXIgZGVzdGluYXRpb25TdHJlYW0gPSBzZWxmLnN0b3JhZ2UuY3JlYXRlV3JpdGVTdHJlYW1Gb3JGaWxlS2V5KGZpbGVLZXksIHtcclxuICAgIC8vIE5vdCBhbGwgU0EncyBjYW4gc2V0IHRoZXNlIG9wdGlvbnMgYW5kIGNmcyBkb250IGRlcGVuZCBvbiBzZXR0aW5nIHRoZXNlXHJcbiAgICAvLyBidXQgaXRzIG5pY2UgaWYgb3RoZXIgc3lzdGVtcyBhcmUgYWNjZXNzaW5nIHRoZSBTQSB0aGF0IHNvbWUgb2YgdGhlIGRhdGFcclxuICAgIC8vIGlzIGFsc28gYXZhaWxhYmxlIHRvIHRob3NlXHJcbiAgICBhbGlhc2VzOiBbZmlsZU9iai5uYW1lKCldLFxyXG4gICAgY29udGVudFR5cGU6IGZpbGVPYmoudHlwZSgpLFxyXG4gICAgbWV0YWRhdGE6IGZpbGVPYmoubWV0YWRhdGFcclxuICB9KTtcclxuXHJcbiAgLy8gUGFzcyB0aHJvdWdoIHRyYW5zZm9ybVdyaXRlIGZ1bmN0aW9uIGlmIHByb3ZpZGVkXHJcbiAgaWYgKHR5cGVvZiBzZWxmLnRyYW5zZm9ybVdyaXRlID09PSAnZnVuY3Rpb24nKSB7XHJcblxyXG4gICAgZGVzdGluYXRpb25TdHJlYW0gPSBhZGRQYXNzVGhyb3VnaChkZXN0aW5hdGlvblN0cmVhbSwgZnVuY3Rpb24gKHB0U3RyZWFtLCBvcmlnaW5hbFN0cmVhbSkge1xyXG4gICAgICAvLyBSaWcgdHJhbnNmb3JtXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgc2VsZi50cmFuc2Zvcm1Xcml0ZS5jYWxsKEZTLlRyYW5zZm9ybS5zY29wZSwgZmlsZU9iaiwgcHRTdHJlYW0sIG9yaWdpbmFsU3RyZWFtKTtcclxuICAgICAgICAvLyBYWFg6IElmIHRoZSB0cmFuc2Zvcm0gZnVuY3Rpb24gcmV0dXJucyBhIGJ1ZmZlciBzaG91bGQgd2Ugc3RyZWFtIHRoYXQ/XHJcbiAgICAgIH0gY2F0Y2goZXJyKSB7XHJcbiAgICAgICAgLy8gV2UgZW1pdCBhbiBlcnJvciAtIHNob3VsZCB3ZSB0aHJvdyBhbiBlcnJvcj9cclxuICAgICAgICBjb25zb2xlLndhcm4oJ0ZTLlRyYW5zZm9ybS5jcmVhdGVXcml0ZVN0cmVhbSB0cmFuc2Zvcm0gZnVuY3Rpb24gZmFpbGVkLCBFcnJvcjogJyk7XHJcbiAgICAgICAgdGhyb3cgZXJyO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgfVxyXG5cclxuICAvLyBJZiBvcmlnaW5hbCBkb2Vzbid0IGhhdmUgc2l6ZSwgYWRkIGFub3RoZXIgUGFzc1Rocm91Z2ggdG8gZ2V0IGFuZCBzZXQgdGhlIHNpemUuXHJcbiAgLy8gVGhpcyB3aWxsIHJ1biBvbiBzaXplPTAsIHRvbywgd2hpY2ggaXMgT0suXHJcbiAgLy8gTk9URTogVGhpcyBtdXN0IGNvbWUgQUZURVIgdGhlIHRyYW5zZm9ybVdyaXRlIGNvZGUgYmxvY2sgYWJvdmUuIFRoaXMgbWlnaHQgc2VlbVxyXG4gIC8vIGNvbmZ1c2luZywgYnV0IGJ5IGNvbWluZyBhZnRlciBpdCwgdGhpcyB3aWxsIGFjdHVhbGx5IGJlIGV4ZWN1dGVkIEJFRk9SRSB0aGUgdXNlcidzXHJcbiAgLy8gdHJhbnNmb3JtLCB3aGljaCBpcyB3aGF0IHdlIG5lZWQgaW4gb3JkZXIgdG8gYmUgc3VyZSB3ZSBnZXQgdGhlIG9yaWdpbmFsIGZpbGVcclxuICAvLyBzaXplIGFuZCBub3QgdGhlIHRyYW5zZm9ybWVkIGZpbGUgc2l6ZS5cclxuICBpZiAoIWZpbGVPYmouc2l6ZSgpKSB7XHJcbiAgICBkZXN0aW5hdGlvblN0cmVhbSA9IGFkZFBhc3NUaHJvdWdoKGRlc3RpbmF0aW9uU3RyZWFtLCBmdW5jdGlvbiAocHRTdHJlYW0sIG9yaWdpbmFsU3RyZWFtKSB7XHJcbiAgICAgIHZhciBsc3RyZWFtID0gbGVuZ3RoU3RyZWFtKGZ1bmN0aW9uIChmaWxlU2l6ZSkge1xyXG4gICAgICAgIGZpbGVPYmouc2l6ZShmaWxlU2l6ZSwge3NhdmU6IGZhbHNlfSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcHRTdHJlYW0ucGlwZShsc3RyZWFtKS5waXBlKG9yaWdpbmFsU3RyZWFtKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGRlc3RpbmF0aW9uU3RyZWFtO1xyXG59O1xyXG5cclxuRlMuVHJhbnNmb3JtLnByb3RvdHlwZS5jcmVhdGVSZWFkU3RyZWFtID0gZnVuY3Rpb24oZmlsZU9iaiwgb3B0aW9ucykge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgLy8gR2V0IHRoZSBmaWxlIGtleVxyXG4gIHZhciBmaWxlS2V5ID0gc2VsZi5zdG9yYWdlLmZpbGVLZXkoZmlsZU9iaik7XHJcblxyXG4gIC8vIFJpZyByZWFkIHN0cmVhbVxyXG4gIHZhciBzb3VyY2VTdHJlYW0gPSBzZWxmLnN0b3JhZ2UuY3JlYXRlUmVhZFN0cmVhbUZvckZpbGVLZXkoZmlsZUtleSwgb3B0aW9ucyk7XHJcblxyXG4gIC8vIFBhc3MgdGhyb3VnaCB0cmFuc2Zvcm1SZWFkIGZ1bmN0aW9uIGlmIHByb3ZpZGVkXHJcbiAgaWYgKHR5cGVvZiBzZWxmLnRyYW5zZm9ybVJlYWQgPT09ICdmdW5jdGlvbicpIHtcclxuXHJcbiAgICBzb3VyY2VTdHJlYW0gPSBhZGRQYXNzVGhyb3VnaChzb3VyY2VTdHJlYW0sIGZ1bmN0aW9uIChwdFN0cmVhbSwgb3JpZ2luYWxTdHJlYW0pIHtcclxuICAgICAgLy8gUmlnIHRyYW5zZm9ybVxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIHNlbGYudHJhbnNmb3JtUmVhZC5jYWxsKEZTLlRyYW5zZm9ybS5zY29wZSwgZmlsZU9iaiwgb3JpZ2luYWxTdHJlYW0sIHB0U3RyZWFtKTtcclxuICAgICAgfSBjYXRjaChlcnIpIHtcclxuICAgICAgICAvL3Rocm93IG5ldyBFcnJvcihlcnIpO1xyXG4gICAgICAgIC8vIFdlIGVtaXQgYW4gZXJyb3IgLSBzaG91bGQgd2UgdGhyb3cgYW4gZXJyb3I/XHJcbiAgICAgICAgc291cmNlU3RyZWFtLmVtaXQoJ2Vycm9yJywgJ0ZTLlRyYW5zZm9ybS5jcmVhdGVSZWFkU3RyZWFtIHRyYW5zZm9ybSBmdW5jdGlvbiBmYWlsZWQnKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gIH1cclxuXHJcbiAgLy8gV2UgZG9udCB0cmFuc2Zvcm0ganVzdCBub3JtYWwgU0EgaW50ZXJmYWNlXHJcbiAgcmV0dXJuIHNvdXJjZVN0cmVhbTtcclxufTtcclxuXHJcbi8vIFV0aWxpdHkgZnVuY3Rpb24gdG8gc2ltcGxpZnkgYWRkaW5nIGxheWVycyBvZiBwYXNzdGhyb3VnaFxyXG5mdW5jdGlvbiBhZGRQYXNzVGhyb3VnaChzdHJlYW0sIGZ1bmMpIHtcclxuICB2YXIgcHRzID0gbmV3IFBhc3NUaHJvdWdoKCk7XHJcbiAgLy8gV2UgcGFzcyBvbiB0aGUgc3BlY2lhbCBcInN0b3JlZFwiIGV2ZW50IGZvciB0aG9zZSBsaXN0ZW5pbmdcclxuICBzdHJlYW0ub24oJ3N0b3JlZCcsIGZ1bmN0aW9uKHJlc3VsdCkge1xyXG4gICAgcHRzLmVtaXQoJ3N0b3JlZCcsIHJlc3VsdCk7XHJcbiAgfSk7XHJcbiAgZnVuYyhwdHMsIHN0cmVhbSk7XHJcbiAgcmV0dXJuIHB0cztcclxufVxyXG4iXX0=
