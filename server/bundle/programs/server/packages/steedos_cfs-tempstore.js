(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var FS = Package['steedos:cfs-base-package'].FS;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var _chunkPath, _fileReference;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:cfs-tempstore":{"checkNpm.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_cfs-tempstore/checkNpm.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let checkNpmVersions;
module.link("meteor/tmeasday:check-npm-versions", {
  checkNpmVersions(v) {
    checkNpmVersions = v;
  }

}, 0);
checkNpmVersions({
  'combined-stream': '0.0.4'
}, 'steedos:cfs-tempstore');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"tempStore.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_cfs-tempstore/tempStore.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// ##Temporary Storage
//
// Temporary storage is used for chunked uploads until all chunks are received
// and all copies have been made or given up. In some cases, the original file
// is stored only in temporary storage (for example, if all copies do some
// manipulation in beforeSave). This is why we use the temporary file as the
// basis for each saved copy, and then remove it after all copies are saved.
//
// Every chunk is saved as an individual temporary file. This is safer than
// attempting to write multiple incoming chunks to different positions in a
// single temporary file, which can lead to write conflicts.
//
// Using temp files also allows us to easily resume uploads, even if the server
// restarts, and to keep the working memory clear.
// The FS.TempStore emits events that others are able to listen to
var EventEmitter = require('events').EventEmitter; // We have a special stream concating all chunk files into one readable stream


var CombinedStream = require('combined-stream');
/** @namespace FS.TempStore
 * @property FS.TempStore
 * @type {object}
 * @public
 * *it's an event emitter*
 */


FS.TempStore = new EventEmitter(); // Create a tracker collection for keeping track of all chunks for any files that are currently in the temp store

var tracker = FS.TempStore.Tracker = new Mongo.Collection('cfs._tempstore.chunks');
/**
 * @property FS.TempStore.Storage
 * @type {StorageAdapter}
 * @namespace FS.TempStore
 * @private
 * This property is set to either `FS.Store.FileSystem` or `FS.Store.GridFS`
 *
 * __When and why:__
 * We normally default to `cfs-filesystem` unless its not installed. *(we default to gridfs if installed)*
 * But if `cfs-gridfs` and `cfs-worker` is installed we default to `cfs-gridfs`
 *
 * If `cfs-gridfs` and `cfs-filesystem` is not installed we log a warning.
 * the user can set `FS.TempStore.Storage` them selfs eg.:
 * ```js
 *   // Its important to set `internal: true` this lets the SA know that we
 *   // are using this internally and it will give us direct SA api
 *   FS.TempStore.Storage = new FS.Store.GridFS('_tempstore', { internal: true });
 * ```
 *
 * > Note: This is considered as `advanced` use, its not a common pattern.
 */

FS.TempStore.Storage = null; // We will not mount a storage adapter until needed. This allows us to check for the
// existance of FS.FileWorker, which is loaded after this package because it
// depends on this package.

function mountStorage() {
  if (FS.TempStore.Storage) return; // XXX: We could replace this test, testing the FS scope for grifFS etc.
  // This is on the todo later when we get "stable"

  if (Package["steedos:cfs-gridfs"] && (Package["steedos:cfs-worker"] || !Package["steedos:cfs-filesystem"])) {
    // If the file worker is installed we would prefer to use the gridfs sa
    // for scalability. We also default to gridfs if filesystem is not found
    // Use the gridfs
    FS.TempStore.Storage = new FS.Store.GridFS('_tempstore', {
      internal: true
    });
  } else if (Package["steedos:cfs-filesystem"]) {
    // use the Filesystem
    FS.TempStore.Storage = new FS.Store.FileSystem('_tempstore', {
      internal: true
    });
  } else {
    throw new Error('FS.TempStore.Storage is not set: Install steedos:cfs-filesystem or steedos:cfs-gridfs or set it manually');
  }

  FS.debug && console.log('TempStore is mounted on', FS.TempStore.Storage.typeName);
}

function mountFile(fileObj, name) {
  if (!fileObj.isMounted()) {
    throw new Error(name + ' cannot work with unmounted file');
  }
} // We update the fileObj on progress


FS.TempStore.on('progress', function (fileObj, chunkNum, count, total, result) {
  FS.debug && console.log('TempStore progress: Received ' + count + ' of ' + total + ' chunks for ' + fileObj.name());
}); // XXX: TODO
// FS.TempStore.on('stored', function(fileObj, chunkCount, result) {
//   // This should work if we pass on result from the SA on stored event...
//   fileObj.update({ $set: { chunkSum: 1, chunkCount: chunkCount, size: result.size } });
// });
// Stream implementation

/**
 * @method _chunkPath
 * @private
 * @param {Number} [n] Chunk number
 * @returns {String} Chunk naming convention
 */

_chunkPath = function (n) {
  return (n || 0) + '.chunk';
};
/**
 * @method _fileReference
 * @param {FS.File} fileObj
 * @param {Number} chunk
 * @private
 * @returns {String} Generated SA specific fileKey for the chunk
 *
 * Note: Calling function should call mountStorage() first, and
 * make sure that fileObj is mounted.
 */


_fileReference = function (fileObj, chunk, existing) {
  // Maybe it's a chunk we've already saved
  existing = existing || tracker.findOne({
    fileId: fileObj._id,
    collectionName: fileObj.collectionName
  }); // Make a temporary fileObj just for fileKey generation

  var tempFileObj = new FS.File({
    collectionName: fileObj.collectionName,
    _id: fileObj._id,
    original: {
      name: _chunkPath(chunk)
    },
    copies: {
      _tempstore: {
        key: existing && existing.keys[chunk]
      }
    }
  }); // Return a fitting fileKey SA specific

  return FS.TempStore.Storage.adapter.fileKey(tempFileObj);
};
/**
 * @method FS.TempStore.exists
 * @param {FS.File} File object
 * @returns {Boolean} Is this file, or parts of it, currently stored in the TempStore
 */


FS.TempStore.exists = function (fileObj) {
  var existing = tracker.findOne({
    fileId: fileObj._id,
    collectionName: fileObj.collectionName
  });
  return !!existing;
};
/**
 * @method FS.TempStore.listParts
 * @param {FS.File} fileObj
 * @returns {Object} of parts already stored
 * @todo This is not yet implemented, milestone 1.1.0
 */


FS.TempStore.listParts = function fsTempStoreListParts(fileObj) {
  var self = this;
  console.warn('This function is not correctly implemented using SA in TempStore'); //XXX This function might be necessary for resume. Not currently supported.
};
/**
 * @method FS.TempStore.removeFile
 * @public
 * @param {FS.File} fileObj
 * This function removes the file from tempstorage - it cares not if file is
 * already removed or not found, goal is reached anyway.
 */


FS.TempStore.removeFile = function fsTempStoreRemoveFile(fileObj) {
  var self = this; // Ensure that we have a storage adapter mounted; if not, throw an error.

  mountStorage(); // If fileObj is not mounted or can't be, throw an error

  mountFile(fileObj, 'FS.TempStore.removeFile'); // Emit event

  self.emit('remove', fileObj);
  var chunkInfo = tracker.findOne({
    fileId: fileObj._id,
    collectionName: fileObj.collectionName
  });

  if (chunkInfo) {
    // Unlink each file
    FS.Utility.each(chunkInfo.keys || {}, function (key, chunk) {
      var fileKey = _fileReference(fileObj, chunk, chunkInfo);

      FS.TempStore.Storage.adapter.remove(fileKey, FS.Utility.noop);
    }); // Remove fileObj from tracker collection, too

    tracker.remove({
      _id: chunkInfo._id
    });
  }
};
/**
 * @method FS.TempStore.removeAll
 * @public
 * This function removes all files from tempstorage - it cares not if file is
 * already removed or not found, goal is reached anyway.
 */


FS.TempStore.removeAll = function fsTempStoreRemoveAll() {
  var self = this; // Ensure that we have a storage adapter mounted; if not, throw an error.

  mountStorage();
  tracker.find().forEach(function (chunkInfo) {
    // Unlink each file
    FS.Utility.each(chunkInfo.keys || {}, function (key, chunk) {
      var fileKey = _fileReference({
        _id: chunkInfo.fileId,
        collectionName: chunkInfo.collectionName
      }, chunk, chunkInfo);

      FS.TempStore.Storage.adapter.remove(fileKey, FS.Utility.noop);
    }); // Remove from tracker collection, too

    tracker.remove({
      _id: chunkInfo._id
    });
  });
};
/**
 * @method FS.TempStore.createWriteStream
 * @public
 * @param {FS.File} fileObj File to store in temporary storage
 * @param {Number | String} [options]
 * @returns {Stream} Writeable stream
 *
 * `options` of different types mean differnt things:
 * * `undefined` We store the file in one part
 * *(Normal server-side api usage)*
 * * `Number` the number is the part number total
 * *(multipart uploads will use this api)*
 * * `String` the string is the name of the `store` that wants to store file data
 * *(stores that want to sync their data to the rest of the files stores will use this)*
 *
 * > Note: fileObj must be mounted on a `FS.Collection`, it makes no sense to store otherwise
 */


FS.TempStore.createWriteStream = function (fileObj, options) {
  var self = this; // Ensure that we have a storage adapter mounted; if not, throw an error.

  mountStorage(); // If fileObj is not mounted or can't be, throw an error

  mountFile(fileObj, 'FS.TempStore.createWriteStream'); // Cache the selector for use multiple times below

  var selector = {
    fileId: fileObj._id,
    collectionName: fileObj.collectionName
  }; // TODO, should pass in chunkSum so we don't need to use FS.File for it

  var chunkSum = fileObj.chunkSum || 1; // Add fileObj to tracker collection

  tracker.upsert(selector, {
    $setOnInsert: {
      keys: {}
    }
  }); // Determine how we're using the writeStream

  var isOnePart = false,
      isMultiPart = false,
      isStoreSync = false,
      chunkNum = 0;

  if (options === +options) {
    isMultiPart = true;
    chunkNum = options;
  } else if (options === '' + options) {
    isStoreSync = true;
  } else {
    isOnePart = true;
  } // XXX: it should be possible for a store to sync by storing data into the
  // tempstore - this could be done nicely by setting the store name as string
  // in the chunk variable?
  // This store name could be passed on the the fileworker via the uploaded
  // event
  // So the uploaded event can return:
  // undefined - if data is stored into and should sync out to all storage adapters
  // number - if a chunk has been uploaded
  // string - if a storage adapter wants to sync its data to the other SA's
  // Find a nice location for the chunk data


  var fileKey = _fileReference(fileObj, chunkNum); // Create the stream as Meteor safe stream


  var writeStream = FS.TempStore.Storage.adapter.createWriteStream(fileKey); // When the stream closes we update the chunkCount

  writeStream.safeOn('stored', function (result) {
    // Save key in tracker document
    var setObj = {};
    setObj['keys.' + chunkNum] = result.fileKey;
    tracker.update(selector, {
      $set: setObj
    }); // Get updated chunkCount

    var chunkCount = FS.Utility.size(tracker.findOne(selector).keys); // Progress

    self.emit('progress', fileObj, chunkNum, chunkCount, chunkSum, result); // If upload is completed

    if (chunkCount === chunkSum) {
      // We no longer need the chunk info
      var modifier = {
        $set: {},
        $unset: {
          chunkCount: 1,
          chunkSum: 1,
          chunkSize: 1
        }
      }; // Check if the file has been uploaded before

      if (typeof fileObj.uploadedAt === 'undefined') {
        // We set the uploadedAt date
        modifier.$set.uploadedAt = new Date();
      } else {
        // We have been uploaded so an event were file data is updated is
        // called synchronizing - so this must be a synchronizedAt?
        modifier.$set.synchronizedAt = new Date();
      } // Update the fileObject


      fileObj.update(modifier); // Fire ending events

      var eventName = isStoreSync ? 'synchronized' : 'stored';
      self.emit(eventName, fileObj, result); // XXX is emitting "ready" necessary?

      self.emit('ready', fileObj, chunkCount, result);
    } else {
      // Update the chunkCount on the fileObject
      fileObj.update({
        $set: {
          chunkCount: chunkCount
        }
      });
    }
  }); // Emit errors

  writeStream.on('error', function (error) {
    FS.debug && console.log('TempStore writeStream error:', error);
    self.emit('error', error, fileObj);
  });
  return writeStream;
};
/**
  * @method FS.TempStore.createReadStream
  * @public
  * @param {FS.File} fileObj The file to read
  * @return {Stream} Returns readable stream
  *
  */


FS.TempStore.createReadStream = function (fileObj) {
  // Ensure that we have a storage adapter mounted; if not, throw an error.
  mountStorage(); // If fileObj is not mounted or can't be, throw an error

  mountFile(fileObj, 'FS.TempStore.createReadStream');
  FS.debug && console.log('FS.TempStore creating read stream for ' + fileObj._id); // Determine how many total chunks there are from the tracker collection

  var chunkInfo = tracker.findOne({
    fileId: fileObj._id,
    collectionName: fileObj.collectionName
  }) || {};
  var totalChunks = FS.Utility.size(chunkInfo.keys);

  function getNextStreamFunc(chunk) {
    return Meteor.bindEnvironment(function (next) {
      var fileKey = _fileReference(fileObj, chunk);

      var chunkReadStream = FS.TempStore.Storage.adapter.createReadStream(fileKey);
      next(chunkReadStream);
    }, function (error) {
      throw error;
    });
  } // Make a combined stream


  var combinedStream = CombinedStream.create(); // Add each chunk stream to the combined stream when the previous chunk stream ends

  var currentChunk = 0;

  for (var chunk = 0; chunk < totalChunks; chunk++) {
    combinedStream.append(getNextStreamFunc(chunk));
  } // Return the combined stream


  return combinedStream;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/steedos:cfs-tempstore/checkNpm.js");
require("/node_modules/meteor/steedos:cfs-tempstore/tempStore.js");

/* Exports */
Package._define("steedos:cfs-tempstore");

})();

//# sourceURL=meteor://💻app/packages/steedos_cfs-tempstore.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpjZnMtdGVtcHN0b3JlL2NoZWNrTnBtLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zOmNmcy10ZW1wc3RvcmUvdGVtcFN0b3JlLmpzIl0sIm5hbWVzIjpbImNoZWNrTnBtVmVyc2lvbnMiLCJtb2R1bGUiLCJsaW5rIiwidiIsIkV2ZW50RW1pdHRlciIsInJlcXVpcmUiLCJDb21iaW5lZFN0cmVhbSIsIkZTIiwiVGVtcFN0b3JlIiwidHJhY2tlciIsIlRyYWNrZXIiLCJNb25nbyIsIkNvbGxlY3Rpb24iLCJTdG9yYWdlIiwibW91bnRTdG9yYWdlIiwiUGFja2FnZSIsIlN0b3JlIiwiR3JpZEZTIiwiaW50ZXJuYWwiLCJGaWxlU3lzdGVtIiwiRXJyb3IiLCJkZWJ1ZyIsImNvbnNvbGUiLCJsb2ciLCJ0eXBlTmFtZSIsIm1vdW50RmlsZSIsImZpbGVPYmoiLCJuYW1lIiwiaXNNb3VudGVkIiwib24iLCJjaHVua051bSIsImNvdW50IiwidG90YWwiLCJyZXN1bHQiLCJfY2h1bmtQYXRoIiwibiIsIl9maWxlUmVmZXJlbmNlIiwiY2h1bmsiLCJleGlzdGluZyIsImZpbmRPbmUiLCJmaWxlSWQiLCJfaWQiLCJjb2xsZWN0aW9uTmFtZSIsInRlbXBGaWxlT2JqIiwiRmlsZSIsIm9yaWdpbmFsIiwiY29waWVzIiwiX3RlbXBzdG9yZSIsImtleSIsImtleXMiLCJhZGFwdGVyIiwiZmlsZUtleSIsImV4aXN0cyIsImxpc3RQYXJ0cyIsImZzVGVtcFN0b3JlTGlzdFBhcnRzIiwic2VsZiIsIndhcm4iLCJyZW1vdmVGaWxlIiwiZnNUZW1wU3RvcmVSZW1vdmVGaWxlIiwiZW1pdCIsImNodW5rSW5mbyIsIlV0aWxpdHkiLCJlYWNoIiwicmVtb3ZlIiwibm9vcCIsInJlbW92ZUFsbCIsImZzVGVtcFN0b3JlUmVtb3ZlQWxsIiwiZmluZCIsImZvckVhY2giLCJjcmVhdGVXcml0ZVN0cmVhbSIsIm9wdGlvbnMiLCJzZWxlY3RvciIsImNodW5rU3VtIiwidXBzZXJ0IiwiJHNldE9uSW5zZXJ0IiwiaXNPbmVQYXJ0IiwiaXNNdWx0aVBhcnQiLCJpc1N0b3JlU3luYyIsIndyaXRlU3RyZWFtIiwic2FmZU9uIiwic2V0T2JqIiwidXBkYXRlIiwiJHNldCIsImNodW5rQ291bnQiLCJzaXplIiwibW9kaWZpZXIiLCIkdW5zZXQiLCJjaHVua1NpemUiLCJ1cGxvYWRlZEF0IiwiRGF0ZSIsInN5bmNocm9uaXplZEF0IiwiZXZlbnROYW1lIiwiZXJyb3IiLCJjcmVhdGVSZWFkU3RyZWFtIiwidG90YWxDaHVua3MiLCJnZXROZXh0U3RyZWFtRnVuYyIsIk1ldGVvciIsImJpbmRFbnZpcm9ubWVudCIsIm5leHQiLCJjaHVua1JlYWRTdHJlYW0iLCJjb21iaW5lZFN0cmVhbSIsImNyZWF0ZSIsImN1cnJlbnRDaHVuayIsImFwcGVuZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLGdCQUFKO0FBQXFCQyxNQUFNLENBQUNDLElBQVAsQ0FBWSxvQ0FBWixFQUFpRDtBQUFDRixrQkFBZ0IsQ0FBQ0csQ0FBRCxFQUFHO0FBQUNILG9CQUFnQixHQUFDRyxDQUFqQjtBQUFtQjs7QUFBeEMsQ0FBakQsRUFBMkYsQ0FBM0Y7QUFDckJILGdCQUFnQixDQUFDO0FBQ2hCLHFCQUFtQjtBQURILENBQUQsRUFFYix1QkFGYSxDQUFoQixDOzs7Ozs7Ozs7OztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBLElBQUlJLFlBQVksR0FBR0MsT0FBTyxDQUFDLFFBQUQsQ0FBUCxDQUFrQkQsWUFBckMsQyxDQUVBOzs7QUFDQSxJQUFJRSxjQUFjLEdBQUdELE9BQU8sQ0FBQyxpQkFBRCxDQUE1QjtBQUVBOzs7Ozs7OztBQU1BRSxFQUFFLENBQUNDLFNBQUgsR0FBZSxJQUFJSixZQUFKLEVBQWYsQyxD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QUksQ0FBQ0MsZUFBRCxDQUFKO0FBQ0QsS0FKTSxFQUlKLFVBQVVQLEtBQVYsRUFBaUI7QUFDbEIsWUFBTUEsS0FBTjtBQUNELEtBTk0sQ0FBUDtBQU9ELEdBckIrQyxDQXVCaEQ7OztBQUNBLE1BQUlRLGNBQWMsR0FBRzlGLGNBQWMsQ0FBQytGLE1BQWYsRUFBckIsQ0F4QmdELENBMEJoRDs7QUFDQSxNQUFJQyxZQUFZLEdBQUcsQ0FBbkI7O0FBQ0EsT0FBSyxJQUFJakUsS0FBSyxHQUFHLENBQWpCLEVBQW9CQSxLQUFLLEdBQUd5RCxXQUE1QixFQUF5Q3pELEtBQUssRUFBOUMsRUFBa0Q7QUFDaEQrRCxrQkFBYyxDQUFDRyxNQUFmLENBQXNCUixpQkFBaUIsQ0FBQzFELEtBQUQsQ0FBdkM7QUFDRCxHQTlCK0MsQ0FnQ2hEOzs7QUFDQSxTQUFPK0QsY0FBUDtBQUNELENBbENELEMiLCJmaWxlIjoiL3BhY2thZ2VzL3N0ZWVkb3NfY2ZzLXRlbXBzdG9yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNoZWNrTnBtVmVyc2lvbnMgfSBmcm9tICdtZXRlb3IvdG1lYXNkYXk6Y2hlY2stbnBtLXZlcnNpb25zJztcclxuY2hlY2tOcG1WZXJzaW9ucyh7XHJcblx0J2NvbWJpbmVkLXN0cmVhbSc6ICcwLjAuNCdcclxufSwgJ3N0ZWVkb3M6Y2ZzLXRlbXBzdG9yZScpOyIsIi8vICMjVGVtcG9yYXJ5IFN0b3JhZ2VcclxuLy9cclxuLy8gVGVtcG9yYXJ5IHN0b3JhZ2UgaXMgdXNlZCBmb3IgY2h1bmtlZCB1cGxvYWRzIHVudGlsIGFsbCBjaHVua3MgYXJlIHJlY2VpdmVkXHJcbi8vIGFuZCBhbGwgY29waWVzIGhhdmUgYmVlbiBtYWRlIG9yIGdpdmVuIHVwLiBJbiBzb21lIGNhc2VzLCB0aGUgb3JpZ2luYWwgZmlsZVxyXG4vLyBpcyBzdG9yZWQgb25seSBpbiB0ZW1wb3Jhcnkgc3RvcmFnZSAoZm9yIGV4YW1wbGUsIGlmIGFsbCBjb3BpZXMgZG8gc29tZVxyXG4vLyBtYW5pcHVsYXRpb24gaW4gYmVmb3JlU2F2ZSkuIFRoaXMgaXMgd2h5IHdlIHVzZSB0aGUgdGVtcG9yYXJ5IGZpbGUgYXMgdGhlXHJcbi8vIGJhc2lzIGZvciBlYWNoIHNhdmVkIGNvcHksIGFuZCB0aGVuIHJlbW92ZSBpdCBhZnRlciBhbGwgY29waWVzIGFyZSBzYXZlZC5cclxuLy9cclxuLy8gRXZlcnkgY2h1bmsgaXMgc2F2ZWQgYXMgYW4gaW5kaXZpZHVhbCB0ZW1wb3JhcnkgZmlsZS4gVGhpcyBpcyBzYWZlciB0aGFuXHJcbi8vIGF0dGVtcHRpbmcgdG8gd3JpdGUgbXVsdGlwbGUgaW5jb21pbmcgY2h1bmtzIHRvIGRpZmZlcmVudCBwb3NpdGlvbnMgaW4gYVxyXG4vLyBzaW5nbGUgdGVtcG9yYXJ5IGZpbGUsIHdoaWNoIGNhbiBsZWFkIHRvIHdyaXRlIGNvbmZsaWN0cy5cclxuLy9cclxuLy8gVXNpbmcgdGVtcCBmaWxlcyBhbHNvIGFsbG93cyB1cyB0byBlYXNpbHkgcmVzdW1lIHVwbG9hZHMsIGV2ZW4gaWYgdGhlIHNlcnZlclxyXG4vLyByZXN0YXJ0cywgYW5kIHRvIGtlZXAgdGhlIHdvcmtpbmcgbWVtb3J5IGNsZWFyLlxyXG5cclxuLy8gVGhlIEZTLlRlbXBTdG9yZSBlbWl0cyBldmVudHMgdGhhdCBvdGhlcnMgYXJlIGFibGUgdG8gbGlzdGVuIHRvXHJcbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXI7XHJcblxyXG4vLyBXZSBoYXZlIGEgc3BlY2lhbCBzdHJlYW0gY29uY2F0aW5nIGFsbCBjaHVuayBmaWxlcyBpbnRvIG9uZSByZWFkYWJsZSBzdHJlYW1cclxudmFyIENvbWJpbmVkU3RyZWFtID0gcmVxdWlyZSgnY29tYmluZWQtc3RyZWFtJyk7XHJcblxyXG4vKiogQG5hbWVzcGFjZSBGUy5UZW1wU3RvcmVcclxuICogQHByb3BlcnR5IEZTLlRlbXBTdG9yZVxyXG4gKiBAdHlwZSB7b2JqZWN0fVxyXG4gKiBAcHVibGljXHJcbiAqICppdCdzIGFuIGV2ZW50IGVtaXR0ZXIqXHJcbiAqL1xyXG5GUy5UZW1wU3RvcmUgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XHJcblxyXG4vLyBDcmVhdGUgYSB0cmFja2VyIGNvbGxlY3Rpb24gZm9yIGtlZXBpbmcgdHJhY2sgb2YgYWxsIGNodW5rcyBmb3IgYW55IGZpbGVzIHRoYXQgYXJlIGN1cnJlbnRseSBpbiB0aGUgdGVtcCBzdG9yZVxyXG52YXIgdHJhY2tlciA9IEZTLlRlbXBTdG9yZS5UcmFja2VyID0gbmV3IE1vbmdvLkNvbGxlY3Rpb24oJ2Nmcy5fdGVtcHN0b3JlLmNodW5rcycpO1xyXG5cclxuLyoqXHJcbiAqIEBwcm9wZXJ0eSBGUy5UZW1wU3RvcmUuU3RvcmFnZVxyXG4gKiBAdHlwZSB7U3RvcmFnZUFkYXB0ZXJ9XHJcbiAqIEBuYW1lc3BhY2UgRlMuVGVtcFN0b3JlXHJcbiAqIEBwcml2YXRlXHJcbiAqIFRoaXMgcHJvcGVydHkgaXMgc2V0IHRvIGVpdGhlciBgRlMuU3RvcmUuRmlsZVN5c3RlbWAgb3IgYEZTLlN0b3JlLkdyaWRGU2BcclxuICpcclxuICogX19XaGVuIGFuZCB3aHk6X19cclxuICogV2Ugbm9ybWFsbHkgZGVmYXVsdCB0byBgY2ZzLWZpbGVzeXN0ZW1gIHVubGVzcyBpdHMgbm90IGluc3RhbGxlZC4gKih3ZSBkZWZhdWx0IHRvIGdyaWRmcyBpZiBpbnN0YWxsZWQpKlxyXG4gKiBCdXQgaWYgYGNmcy1ncmlkZnNgIGFuZCBgY2ZzLXdvcmtlcmAgaXMgaW5zdGFsbGVkIHdlIGRlZmF1bHQgdG8gYGNmcy1ncmlkZnNgXHJcbiAqXHJcbiAqIElmIGBjZnMtZ3JpZGZzYCBhbmQgYGNmcy1maWxlc3lzdGVtYCBpcyBub3QgaW5zdGFsbGVkIHdlIGxvZyBhIHdhcm5pbmcuXHJcbiAqIHRoZSB1c2VyIGNhbiBzZXQgYEZTLlRlbXBTdG9yZS5TdG9yYWdlYCB0aGVtIHNlbGZzIGVnLjpcclxuICogYGBganNcclxuICogICAvLyBJdHMgaW1wb3J0YW50IHRvIHNldCBgaW50ZXJuYWw6IHRydWVgIHRoaXMgbGV0cyB0aGUgU0Ega25vdyB0aGF0IHdlXHJcbiAqICAgLy8gYXJlIHVzaW5nIHRoaXMgaW50ZXJuYWxseSBhbmQgaXQgd2lsbCBnaXZlIHVzIGRpcmVjdCBTQSBhcGlcclxuICogICBGUy5UZW1wU3RvcmUuU3RvcmFnZSA9IG5ldyBGUy5TdG9yZS5HcmlkRlMoJ190ZW1wc3RvcmUnLCB7IGludGVybmFsOiB0cnVlIH0pO1xyXG4gKiBgYGBcclxuICpcclxuICogPiBOb3RlOiBUaGlzIGlzIGNvbnNpZGVyZWQgYXMgYGFkdmFuY2VkYCB1c2UsIGl0cyBub3QgYSBjb21tb24gcGF0dGVybi5cclxuICovXHJcbkZTLlRlbXBTdG9yZS5TdG9yYWdlID0gbnVsbDtcclxuXHJcbi8vIFdlIHdpbGwgbm90IG1vdW50IGEgc3RvcmFnZSBhZGFwdGVyIHVudGlsIG5lZWRlZC4gVGhpcyBhbGxvd3MgdXMgdG8gY2hlY2sgZm9yIHRoZVxyXG4vLyBleGlzdGFuY2Ugb2YgRlMuRmlsZVdvcmtlciwgd2hpY2ggaXMgbG9hZGVkIGFmdGVyIHRoaXMgcGFja2FnZSBiZWNhdXNlIGl0XHJcbi8vIGRlcGVuZHMgb24gdGhpcyBwYWNrYWdlLlxyXG5mdW5jdGlvbiBtb3VudFN0b3JhZ2UoKSB7XHJcblxyXG4gIGlmIChGUy5UZW1wU3RvcmUuU3RvcmFnZSkgcmV0dXJuO1xyXG5cclxuICAvLyBYWFg6IFdlIGNvdWxkIHJlcGxhY2UgdGhpcyB0ZXN0LCB0ZXN0aW5nIHRoZSBGUyBzY29wZSBmb3IgZ3JpZkZTIGV0Yy5cclxuICAvLyBUaGlzIGlzIG9uIHRoZSB0b2RvIGxhdGVyIHdoZW4gd2UgZ2V0IFwic3RhYmxlXCJcclxuICBpZiAoUGFja2FnZVtcInN0ZWVkb3M6Y2ZzLWdyaWRmc1wiXSAmJiAoUGFja2FnZVtcInN0ZWVkb3M6Y2ZzLXdvcmtlclwiXSB8fCAhUGFja2FnZVtcInN0ZWVkb3M6Y2ZzLWZpbGVzeXN0ZW1cIl0pKSB7XHJcbiAgICAvLyBJZiB0aGUgZmlsZSB3b3JrZXIgaXMgaW5zdGFsbGVkIHdlIHdvdWxkIHByZWZlciB0byB1c2UgdGhlIGdyaWRmcyBzYVxyXG4gICAgLy8gZm9yIHNjYWxhYmlsaXR5LiBXZSBhbHNvIGRlZmF1bHQgdG8gZ3JpZGZzIGlmIGZpbGVzeXN0ZW0gaXMgbm90IGZvdW5kXHJcblxyXG4gICAgLy8gVXNlIHRoZSBncmlkZnNcclxuICAgIEZTLlRlbXBTdG9yZS5TdG9yYWdlID0gbmV3IEZTLlN0b3JlLkdyaWRGUygnX3RlbXBzdG9yZScsIHsgaW50ZXJuYWw6IHRydWUgfSk7XHJcbiAgfSBlbHNlIGlmIChQYWNrYWdlW1wic3RlZWRvczpjZnMtZmlsZXN5c3RlbVwiXSkge1xyXG5cclxuICAgIC8vIHVzZSB0aGUgRmlsZXN5c3RlbVxyXG4gICAgRlMuVGVtcFN0b3JlLlN0b3JhZ2UgPSBuZXcgRlMuU3RvcmUuRmlsZVN5c3RlbSgnX3RlbXBzdG9yZScsIHsgaW50ZXJuYWw6IHRydWUgfSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignRlMuVGVtcFN0b3JlLlN0b3JhZ2UgaXMgbm90IHNldDogSW5zdGFsbCBzdGVlZG9zOmNmcy1maWxlc3lzdGVtIG9yIHN0ZWVkb3M6Y2ZzLWdyaWRmcyBvciBzZXQgaXQgbWFudWFsbHknKTtcclxuICB9XHJcblxyXG4gIEZTLmRlYnVnICYmIGNvbnNvbGUubG9nKCdUZW1wU3RvcmUgaXMgbW91bnRlZCBvbicsIEZTLlRlbXBTdG9yZS5TdG9yYWdlLnR5cGVOYW1lKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbW91bnRGaWxlKGZpbGVPYmosIG5hbWUpIHtcclxuICBpZiAoIWZpbGVPYmouaXNNb3VudGVkKCkpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihuYW1lICsgJyBjYW5ub3Qgd29yayB3aXRoIHVubW91bnRlZCBmaWxlJyk7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBXZSB1cGRhdGUgdGhlIGZpbGVPYmogb24gcHJvZ3Jlc3NcclxuRlMuVGVtcFN0b3JlLm9uKCdwcm9ncmVzcycsIGZ1bmN0aW9uKGZpbGVPYmosIGNodW5rTnVtLCBjb3VudCwgdG90YWwsIHJlc3VsdCkge1xyXG4gIEZTLmRlYnVnICYmIGNvbnNvbGUubG9nKCdUZW1wU3RvcmUgcHJvZ3Jlc3M6IFJlY2VpdmVkICcgKyBjb3VudCArICcgb2YgJyArIHRvdGFsICsgJyBjaHVua3MgZm9yICcgKyBmaWxlT2JqLm5hbWUoKSk7XHJcbn0pO1xyXG5cclxuLy8gWFhYOiBUT0RPXHJcbi8vIEZTLlRlbXBTdG9yZS5vbignc3RvcmVkJywgZnVuY3Rpb24oZmlsZU9iaiwgY2h1bmtDb3VudCwgcmVzdWx0KSB7XHJcbi8vICAgLy8gVGhpcyBzaG91bGQgd29yayBpZiB3ZSBwYXNzIG9uIHJlc3VsdCBmcm9tIHRoZSBTQSBvbiBzdG9yZWQgZXZlbnQuLi5cclxuLy8gICBmaWxlT2JqLnVwZGF0ZSh7ICRzZXQ6IHsgY2h1bmtTdW06IDEsIGNodW5rQ291bnQ6IGNodW5rQ291bnQsIHNpemU6IHJlc3VsdC5zaXplIH0gfSk7XHJcbi8vIH0pO1xyXG5cclxuLy8gU3RyZWFtIGltcGxlbWVudGF0aW9uXHJcblxyXG4vKipcclxuICogQG1ldGhvZCBfY2h1bmtQYXRoXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBbbl0gQ2h1bmsgbnVtYmVyXHJcbiAqIEByZXR1cm5zIHtTdHJpbmd9IENodW5rIG5hbWluZyBjb252ZW50aW9uXHJcbiAqL1xyXG5fY2h1bmtQYXRoID0gZnVuY3Rpb24obikge1xyXG4gIHJldHVybiAobiB8fCAwKSArICcuY2h1bmsnO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgX2ZpbGVSZWZlcmVuY2VcclxuICogQHBhcmFtIHtGUy5GaWxlfSBmaWxlT2JqXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBjaHVua1xyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBHZW5lcmF0ZWQgU0Egc3BlY2lmaWMgZmlsZUtleSBmb3IgdGhlIGNodW5rXHJcbiAqXHJcbiAqIE5vdGU6IENhbGxpbmcgZnVuY3Rpb24gc2hvdWxkIGNhbGwgbW91bnRTdG9yYWdlKCkgZmlyc3QsIGFuZFxyXG4gKiBtYWtlIHN1cmUgdGhhdCBmaWxlT2JqIGlzIG1vdW50ZWQuXHJcbiAqL1xyXG5fZmlsZVJlZmVyZW5jZSA9IGZ1bmN0aW9uKGZpbGVPYmosIGNodW5rLCBleGlzdGluZykge1xyXG4gIC8vIE1heWJlIGl0J3MgYSBjaHVuayB3ZSd2ZSBhbHJlYWR5IHNhdmVkXHJcbiAgZXhpc3RpbmcgPSBleGlzdGluZyB8fCB0cmFja2VyLmZpbmRPbmUoe2ZpbGVJZDogZmlsZU9iai5faWQsIGNvbGxlY3Rpb25OYW1lOiBmaWxlT2JqLmNvbGxlY3Rpb25OYW1lfSk7XHJcblxyXG4gIC8vIE1ha2UgYSB0ZW1wb3JhcnkgZmlsZU9iaiBqdXN0IGZvciBmaWxlS2V5IGdlbmVyYXRpb25cclxuICB2YXIgdGVtcEZpbGVPYmogPSBuZXcgRlMuRmlsZSh7XHJcbiAgICBjb2xsZWN0aW9uTmFtZTogZmlsZU9iai5jb2xsZWN0aW9uTmFtZSxcclxuICAgIF9pZDogZmlsZU9iai5faWQsXHJcbiAgICBvcmlnaW5hbDoge1xyXG4gICAgICBuYW1lOiBfY2h1bmtQYXRoKGNodW5rKVxyXG4gICAgfSxcclxuICAgIGNvcGllczoge1xyXG4gICAgICBfdGVtcHN0b3JlOiB7XHJcbiAgICAgICAga2V5OiBleGlzdGluZyAmJiBleGlzdGluZy5rZXlzW2NodW5rXVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8vIFJldHVybiBhIGZpdHRpbmcgZmlsZUtleSBTQSBzcGVjaWZpY1xyXG4gIHJldHVybiBGUy5UZW1wU3RvcmUuU3RvcmFnZS5hZGFwdGVyLmZpbGVLZXkodGVtcEZpbGVPYmopO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRlMuVGVtcFN0b3JlLmV4aXN0c1xyXG4gKiBAcGFyYW0ge0ZTLkZpbGV9IEZpbGUgb2JqZWN0XHJcbiAqIEByZXR1cm5zIHtCb29sZWFufSBJcyB0aGlzIGZpbGUsIG9yIHBhcnRzIG9mIGl0LCBjdXJyZW50bHkgc3RvcmVkIGluIHRoZSBUZW1wU3RvcmVcclxuICovXHJcbkZTLlRlbXBTdG9yZS5leGlzdHMgPSBmdW5jdGlvbihmaWxlT2JqKSB7XHJcbiAgdmFyIGV4aXN0aW5nID0gdHJhY2tlci5maW5kT25lKHtmaWxlSWQ6IGZpbGVPYmouX2lkLCBjb2xsZWN0aW9uTmFtZTogZmlsZU9iai5jb2xsZWN0aW9uTmFtZX0pO1xyXG4gIHJldHVybiAhIWV4aXN0aW5nO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRlMuVGVtcFN0b3JlLmxpc3RQYXJ0c1xyXG4gKiBAcGFyYW0ge0ZTLkZpbGV9IGZpbGVPYmpcclxuICogQHJldHVybnMge09iamVjdH0gb2YgcGFydHMgYWxyZWFkeSBzdG9yZWRcclxuICogQHRvZG8gVGhpcyBpcyBub3QgeWV0IGltcGxlbWVudGVkLCBtaWxlc3RvbmUgMS4xLjBcclxuICovXHJcbkZTLlRlbXBTdG9yZS5saXN0UGFydHMgPSBmdW5jdGlvbiBmc1RlbXBTdG9yZUxpc3RQYXJ0cyhmaWxlT2JqKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIGNvbnNvbGUud2FybignVGhpcyBmdW5jdGlvbiBpcyBub3QgY29ycmVjdGx5IGltcGxlbWVudGVkIHVzaW5nIFNBIGluIFRlbXBTdG9yZScpO1xyXG4gIC8vWFhYIFRoaXMgZnVuY3Rpb24gbWlnaHQgYmUgbmVjZXNzYXJ5IGZvciByZXN1bWUuIE5vdCBjdXJyZW50bHkgc3VwcG9ydGVkLlxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRlMuVGVtcFN0b3JlLnJlbW92ZUZpbGVcclxuICogQHB1YmxpY1xyXG4gKiBAcGFyYW0ge0ZTLkZpbGV9IGZpbGVPYmpcclxuICogVGhpcyBmdW5jdGlvbiByZW1vdmVzIHRoZSBmaWxlIGZyb20gdGVtcHN0b3JhZ2UgLSBpdCBjYXJlcyBub3QgaWYgZmlsZSBpc1xyXG4gKiBhbHJlYWR5IHJlbW92ZWQgb3Igbm90IGZvdW5kLCBnb2FsIGlzIHJlYWNoZWQgYW55d2F5LlxyXG4gKi9cclxuRlMuVGVtcFN0b3JlLnJlbW92ZUZpbGUgPSBmdW5jdGlvbiBmc1RlbXBTdG9yZVJlbW92ZUZpbGUoZmlsZU9iaikge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgLy8gRW5zdXJlIHRoYXQgd2UgaGF2ZSBhIHN0b3JhZ2UgYWRhcHRlciBtb3VudGVkOyBpZiBub3QsIHRocm93IGFuIGVycm9yLlxyXG4gIG1vdW50U3RvcmFnZSgpO1xyXG5cclxuICAvLyBJZiBmaWxlT2JqIGlzIG5vdCBtb3VudGVkIG9yIGNhbid0IGJlLCB0aHJvdyBhbiBlcnJvclxyXG4gIG1vdW50RmlsZShmaWxlT2JqLCAnRlMuVGVtcFN0b3JlLnJlbW92ZUZpbGUnKTtcclxuXHJcbiAgLy8gRW1pdCBldmVudFxyXG4gIHNlbGYuZW1pdCgncmVtb3ZlJywgZmlsZU9iaik7XHJcblxyXG4gIHZhciBjaHVua0luZm8gPSB0cmFja2VyLmZpbmRPbmUoe1xyXG4gICAgZmlsZUlkOiBmaWxlT2JqLl9pZCxcclxuICAgIGNvbGxlY3Rpb25OYW1lOiBmaWxlT2JqLmNvbGxlY3Rpb25OYW1lXHJcbiAgfSk7XHJcblxyXG4gIGlmIChjaHVua0luZm8pIHtcclxuXHJcbiAgICAvLyBVbmxpbmsgZWFjaCBmaWxlXHJcbiAgICBGUy5VdGlsaXR5LmVhY2goY2h1bmtJbmZvLmtleXMgfHwge30sIGZ1bmN0aW9uIChrZXksIGNodW5rKSB7XHJcbiAgICAgIHZhciBmaWxlS2V5ID0gX2ZpbGVSZWZlcmVuY2UoZmlsZU9iaiwgY2h1bmssIGNodW5rSW5mbyk7XHJcbiAgICAgIEZTLlRlbXBTdG9yZS5TdG9yYWdlLmFkYXB0ZXIucmVtb3ZlKGZpbGVLZXksIEZTLlV0aWxpdHkubm9vcCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBSZW1vdmUgZmlsZU9iaiBmcm9tIHRyYWNrZXIgY29sbGVjdGlvbiwgdG9vXHJcbiAgICB0cmFja2VyLnJlbW92ZSh7X2lkOiBjaHVua0luZm8uX2lkfSk7XHJcblxyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIEZTLlRlbXBTdG9yZS5yZW1vdmVBbGxcclxuICogQHB1YmxpY1xyXG4gKiBUaGlzIGZ1bmN0aW9uIHJlbW92ZXMgYWxsIGZpbGVzIGZyb20gdGVtcHN0b3JhZ2UgLSBpdCBjYXJlcyBub3QgaWYgZmlsZSBpc1xyXG4gKiBhbHJlYWR5IHJlbW92ZWQgb3Igbm90IGZvdW5kLCBnb2FsIGlzIHJlYWNoZWQgYW55d2F5LlxyXG4gKi9cclxuRlMuVGVtcFN0b3JlLnJlbW92ZUFsbCA9IGZ1bmN0aW9uIGZzVGVtcFN0b3JlUmVtb3ZlQWxsKCkge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgLy8gRW5zdXJlIHRoYXQgd2UgaGF2ZSBhIHN0b3JhZ2UgYWRhcHRlciBtb3VudGVkOyBpZiBub3QsIHRocm93IGFuIGVycm9yLlxyXG4gIG1vdW50U3RvcmFnZSgpO1xyXG5cclxuICB0cmFja2VyLmZpbmQoKS5mb3JFYWNoKGZ1bmN0aW9uIChjaHVua0luZm8pIHtcclxuICAgIC8vIFVubGluayBlYWNoIGZpbGVcclxuICAgIEZTLlV0aWxpdHkuZWFjaChjaHVua0luZm8ua2V5cyB8fCB7fSwgZnVuY3Rpb24gKGtleSwgY2h1bmspIHtcclxuICAgICAgdmFyIGZpbGVLZXkgPSBfZmlsZVJlZmVyZW5jZSh7X2lkOiBjaHVua0luZm8uZmlsZUlkLCBjb2xsZWN0aW9uTmFtZTogY2h1bmtJbmZvLmNvbGxlY3Rpb25OYW1lfSwgY2h1bmssIGNodW5rSW5mbyk7XHJcbiAgICAgIEZTLlRlbXBTdG9yZS5TdG9yYWdlLmFkYXB0ZXIucmVtb3ZlKGZpbGVLZXksIEZTLlV0aWxpdHkubm9vcCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBSZW1vdmUgZnJvbSB0cmFja2VyIGNvbGxlY3Rpb24sIHRvb1xyXG4gICAgdHJhY2tlci5yZW1vdmUoe19pZDogY2h1bmtJbmZvLl9pZH0pO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRlMuVGVtcFN0b3JlLmNyZWF0ZVdyaXRlU3RyZWFtXHJcbiAqIEBwdWJsaWNcclxuICogQHBhcmFtIHtGUy5GaWxlfSBmaWxlT2JqIEZpbGUgdG8gc3RvcmUgaW4gdGVtcG9yYXJ5IHN0b3JhZ2VcclxuICogQHBhcmFtIHtOdW1iZXIgfCBTdHJpbmd9IFtvcHRpb25zXVxyXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBXcml0ZWFibGUgc3RyZWFtXHJcbiAqXHJcbiAqIGBvcHRpb25zYCBvZiBkaWZmZXJlbnQgdHlwZXMgbWVhbiBkaWZmZXJudCB0aGluZ3M6XHJcbiAqICogYHVuZGVmaW5lZGAgV2Ugc3RvcmUgdGhlIGZpbGUgaW4gb25lIHBhcnRcclxuICogKihOb3JtYWwgc2VydmVyLXNpZGUgYXBpIHVzYWdlKSpcclxuICogKiBgTnVtYmVyYCB0aGUgbnVtYmVyIGlzIHRoZSBwYXJ0IG51bWJlciB0b3RhbFxyXG4gKiAqKG11bHRpcGFydCB1cGxvYWRzIHdpbGwgdXNlIHRoaXMgYXBpKSpcclxuICogKiBgU3RyaW5nYCB0aGUgc3RyaW5nIGlzIHRoZSBuYW1lIG9mIHRoZSBgc3RvcmVgIHRoYXQgd2FudHMgdG8gc3RvcmUgZmlsZSBkYXRhXHJcbiAqICooc3RvcmVzIHRoYXQgd2FudCB0byBzeW5jIHRoZWlyIGRhdGEgdG8gdGhlIHJlc3Qgb2YgdGhlIGZpbGVzIHN0b3JlcyB3aWxsIHVzZSB0aGlzKSpcclxuICpcclxuICogPiBOb3RlOiBmaWxlT2JqIG11c3QgYmUgbW91bnRlZCBvbiBhIGBGUy5Db2xsZWN0aW9uYCwgaXQgbWFrZXMgbm8gc2Vuc2UgdG8gc3RvcmUgb3RoZXJ3aXNlXHJcbiAqL1xyXG5GUy5UZW1wU3RvcmUuY3JlYXRlV3JpdGVTdHJlYW0gPSBmdW5jdGlvbihmaWxlT2JqLCBvcHRpb25zKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAvLyBFbnN1cmUgdGhhdCB3ZSBoYXZlIGEgc3RvcmFnZSBhZGFwdGVyIG1vdW50ZWQ7IGlmIG5vdCwgdGhyb3cgYW4gZXJyb3IuXHJcbiAgbW91bnRTdG9yYWdlKCk7XHJcblxyXG4gIC8vIElmIGZpbGVPYmogaXMgbm90IG1vdW50ZWQgb3IgY2FuJ3QgYmUsIHRocm93IGFuIGVycm9yXHJcbiAgbW91bnRGaWxlKGZpbGVPYmosICdGUy5UZW1wU3RvcmUuY3JlYXRlV3JpdGVTdHJlYW0nKTtcclxuXHJcbiAgLy8gQ2FjaGUgdGhlIHNlbGVjdG9yIGZvciB1c2UgbXVsdGlwbGUgdGltZXMgYmVsb3dcclxuICB2YXIgc2VsZWN0b3IgPSB7ZmlsZUlkOiBmaWxlT2JqLl9pZCwgY29sbGVjdGlvbk5hbWU6IGZpbGVPYmouY29sbGVjdGlvbk5hbWV9O1xyXG5cclxuICAvLyBUT0RPLCBzaG91bGQgcGFzcyBpbiBjaHVua1N1bSBzbyB3ZSBkb24ndCBuZWVkIHRvIHVzZSBGUy5GaWxlIGZvciBpdFxyXG4gIHZhciBjaHVua1N1bSA9IGZpbGVPYmouY2h1bmtTdW0gfHwgMTtcclxuXHJcbiAgLy8gQWRkIGZpbGVPYmogdG8gdHJhY2tlciBjb2xsZWN0aW9uXHJcbiAgdHJhY2tlci51cHNlcnQoc2VsZWN0b3IsIHskc2V0T25JbnNlcnQ6IHtrZXlzOiB7fX19KTtcclxuXHJcbiAgLy8gRGV0ZXJtaW5lIGhvdyB3ZSdyZSB1c2luZyB0aGUgd3JpdGVTdHJlYW1cclxuICB2YXIgaXNPbmVQYXJ0ID0gZmFsc2UsIGlzTXVsdGlQYXJ0ID0gZmFsc2UsIGlzU3RvcmVTeW5jID0gZmFsc2UsIGNodW5rTnVtID0gMDtcclxuICBpZiAob3B0aW9ucyA9PT0gK29wdGlvbnMpIHtcclxuICAgIGlzTXVsdGlQYXJ0ID0gdHJ1ZTtcclxuICAgIGNodW5rTnVtID0gb3B0aW9ucztcclxuICB9IGVsc2UgaWYgKG9wdGlvbnMgPT09ICcnK29wdGlvbnMpIHtcclxuICAgIGlzU3RvcmVTeW5jID0gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgaXNPbmVQYXJ0ID0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8vIFhYWDogaXQgc2hvdWxkIGJlIHBvc3NpYmxlIGZvciBhIHN0b3JlIHRvIHN5bmMgYnkgc3RvcmluZyBkYXRhIGludG8gdGhlXHJcbiAgLy8gdGVtcHN0b3JlIC0gdGhpcyBjb3VsZCBiZSBkb25lIG5pY2VseSBieSBzZXR0aW5nIHRoZSBzdG9yZSBuYW1lIGFzIHN0cmluZ1xyXG4gIC8vIGluIHRoZSBjaHVuayB2YXJpYWJsZT9cclxuICAvLyBUaGlzIHN0b3JlIG5hbWUgY291bGQgYmUgcGFzc2VkIG9uIHRoZSB0aGUgZmlsZXdvcmtlciB2aWEgdGhlIHVwbG9hZGVkXHJcbiAgLy8gZXZlbnRcclxuICAvLyBTbyB0aGUgdXBsb2FkZWQgZXZlbnQgY2FuIHJldHVybjpcclxuICAvLyB1bmRlZmluZWQgLSBpZiBkYXRhIGlzIHN0b3JlZCBpbnRvIGFuZCBzaG91bGQgc3luYyBvdXQgdG8gYWxsIHN0b3JhZ2UgYWRhcHRlcnNcclxuICAvLyBudW1iZXIgLSBpZiBhIGNodW5rIGhhcyBiZWVuIHVwbG9hZGVkXHJcbiAgLy8gc3RyaW5nIC0gaWYgYSBzdG9yYWdlIGFkYXB0ZXIgd2FudHMgdG8gc3luYyBpdHMgZGF0YSB0byB0aGUgb3RoZXIgU0Enc1xyXG5cclxuICAvLyBGaW5kIGEgbmljZSBsb2NhdGlvbiBmb3IgdGhlIGNodW5rIGRhdGFcclxuICB2YXIgZmlsZUtleSA9IF9maWxlUmVmZXJlbmNlKGZpbGVPYmosIGNodW5rTnVtKTtcclxuXHJcbiAgLy8gQ3JlYXRlIHRoZSBzdHJlYW0gYXMgTWV0ZW9yIHNhZmUgc3RyZWFtXHJcbiAgdmFyIHdyaXRlU3RyZWFtID0gRlMuVGVtcFN0b3JlLlN0b3JhZ2UuYWRhcHRlci5jcmVhdGVXcml0ZVN0cmVhbShmaWxlS2V5KTtcclxuXHJcbiAgLy8gV2hlbiB0aGUgc3RyZWFtIGNsb3NlcyB3ZSB1cGRhdGUgdGhlIGNodW5rQ291bnRcclxuICB3cml0ZVN0cmVhbS5zYWZlT24oJ3N0b3JlZCcsIGZ1bmN0aW9uKHJlc3VsdCkge1xyXG4gICAgLy8gU2F2ZSBrZXkgaW4gdHJhY2tlciBkb2N1bWVudFxyXG4gICAgdmFyIHNldE9iaiA9IHt9O1xyXG4gICAgc2V0T2JqWydrZXlzLicgKyBjaHVua051bV0gPSByZXN1bHQuZmlsZUtleTtcclxuICAgIHRyYWNrZXIudXBkYXRlKHNlbGVjdG9yLCB7JHNldDogc2V0T2JqfSk7XHJcblxyXG4gICAgLy8gR2V0IHVwZGF0ZWQgY2h1bmtDb3VudFxyXG4gICAgdmFyIGNodW5rQ291bnQgPSBGUy5VdGlsaXR5LnNpemUodHJhY2tlci5maW5kT25lKHNlbGVjdG9yKS5rZXlzKTtcclxuXHJcbiAgICAvLyBQcm9ncmVzc1xyXG4gICAgc2VsZi5lbWl0KCdwcm9ncmVzcycsIGZpbGVPYmosIGNodW5rTnVtLCBjaHVua0NvdW50LCBjaHVua1N1bSwgcmVzdWx0KTtcclxuXHJcbiAgICAvLyBJZiB1cGxvYWQgaXMgY29tcGxldGVkXHJcbiAgICBpZiAoY2h1bmtDb3VudCA9PT0gY2h1bmtTdW0pIHtcclxuICAgICAgLy8gV2Ugbm8gbG9uZ2VyIG5lZWQgdGhlIGNodW5rIGluZm9cclxuICAgICAgdmFyIG1vZGlmaWVyID0geyAkc2V0OiB7fSwgJHVuc2V0OiB7Y2h1bmtDb3VudDogMSwgY2h1bmtTdW06IDEsIGNodW5rU2l6ZTogMX0gfTtcclxuXHJcbiAgICAgIC8vIENoZWNrIGlmIHRoZSBmaWxlIGhhcyBiZWVuIHVwbG9hZGVkIGJlZm9yZVxyXG4gICAgICBpZiAodHlwZW9mIGZpbGVPYmoudXBsb2FkZWRBdCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAvLyBXZSBzZXQgdGhlIHVwbG9hZGVkQXQgZGF0ZVxyXG4gICAgICAgIG1vZGlmaWVyLiRzZXQudXBsb2FkZWRBdCA9IG5ldyBEYXRlKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gV2UgaGF2ZSBiZWVuIHVwbG9hZGVkIHNvIGFuIGV2ZW50IHdlcmUgZmlsZSBkYXRhIGlzIHVwZGF0ZWQgaXNcclxuICAgICAgICAvLyBjYWxsZWQgc3luY2hyb25pemluZyAtIHNvIHRoaXMgbXVzdCBiZSBhIHN5bmNocm9uaXplZEF0P1xyXG4gICAgICAgIG1vZGlmaWVyLiRzZXQuc3luY2hyb25pemVkQXQgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBVcGRhdGUgdGhlIGZpbGVPYmplY3RcclxuICAgICAgZmlsZU9iai51cGRhdGUobW9kaWZpZXIpO1xyXG5cclxuICAgICAgLy8gRmlyZSBlbmRpbmcgZXZlbnRzXHJcbiAgICAgIHZhciBldmVudE5hbWUgPSBpc1N0b3JlU3luYyA/ICdzeW5jaHJvbml6ZWQnIDogJ3N0b3JlZCc7XHJcbiAgICAgIHNlbGYuZW1pdChldmVudE5hbWUsIGZpbGVPYmosIHJlc3VsdCk7XHJcblxyXG4gICAgICAvLyBYWFggaXMgZW1pdHRpbmcgXCJyZWFkeVwiIG5lY2Vzc2FyeT9cclxuICAgICAgc2VsZi5lbWl0KCdyZWFkeScsIGZpbGVPYmosIGNodW5rQ291bnQsIHJlc3VsdCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBVcGRhdGUgdGhlIGNodW5rQ291bnQgb24gdGhlIGZpbGVPYmplY3RcclxuICAgICAgZmlsZU9iai51cGRhdGUoeyAkc2V0OiB7Y2h1bmtDb3VudDogY2h1bmtDb3VudH0gfSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8vIEVtaXQgZXJyb3JzXHJcbiAgd3JpdGVTdHJlYW0ub24oJ2Vycm9yJywgZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICBGUy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnVGVtcFN0b3JlIHdyaXRlU3RyZWFtIGVycm9yOicsIGVycm9yKTtcclxuICAgIHNlbGYuZW1pdCgnZXJyb3InLCBlcnJvciwgZmlsZU9iaik7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiB3cml0ZVN0cmVhbTtcclxufTtcclxuXHJcbi8qKlxyXG4gICogQG1ldGhvZCBGUy5UZW1wU3RvcmUuY3JlYXRlUmVhZFN0cmVhbVxyXG4gICogQHB1YmxpY1xyXG4gICogQHBhcmFtIHtGUy5GaWxlfSBmaWxlT2JqIFRoZSBmaWxlIHRvIHJlYWRcclxuICAqIEByZXR1cm4ge1N0cmVhbX0gUmV0dXJucyByZWFkYWJsZSBzdHJlYW1cclxuICAqXHJcbiAgKi9cclxuRlMuVGVtcFN0b3JlLmNyZWF0ZVJlYWRTdHJlYW0gPSBmdW5jdGlvbihmaWxlT2JqKSB7XHJcbiAgLy8gRW5zdXJlIHRoYXQgd2UgaGF2ZSBhIHN0b3JhZ2UgYWRhcHRlciBtb3VudGVkOyBpZiBub3QsIHRocm93IGFuIGVycm9yLlxyXG4gIG1vdW50U3RvcmFnZSgpO1xyXG5cclxuICAvLyBJZiBmaWxlT2JqIGlzIG5vdCBtb3VudGVkIG9yIGNhbid0IGJlLCB0aHJvdyBhbiBlcnJvclxyXG4gIG1vdW50RmlsZShmaWxlT2JqLCAnRlMuVGVtcFN0b3JlLmNyZWF0ZVJlYWRTdHJlYW0nKTtcclxuXHJcbiAgRlMuZGVidWcgJiYgY29uc29sZS5sb2coJ0ZTLlRlbXBTdG9yZSBjcmVhdGluZyByZWFkIHN0cmVhbSBmb3IgJyArIGZpbGVPYmouX2lkKTtcclxuXHJcbiAgLy8gRGV0ZXJtaW5lIGhvdyBtYW55IHRvdGFsIGNodW5rcyB0aGVyZSBhcmUgZnJvbSB0aGUgdHJhY2tlciBjb2xsZWN0aW9uXHJcbiAgdmFyIGNodW5rSW5mbyA9IHRyYWNrZXIuZmluZE9uZSh7ZmlsZUlkOiBmaWxlT2JqLl9pZCwgY29sbGVjdGlvbk5hbWU6IGZpbGVPYmouY29sbGVjdGlvbk5hbWV9KSB8fCB7fTtcclxuICB2YXIgdG90YWxDaHVua3MgPSBGUy5VdGlsaXR5LnNpemUoY2h1bmtJbmZvLmtleXMpO1xyXG5cclxuICBmdW5jdGlvbiBnZXROZXh0U3RyZWFtRnVuYyhjaHVuaykge1xyXG4gICAgcmV0dXJuIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZnVuY3Rpb24obmV4dCkge1xyXG4gICAgICB2YXIgZmlsZUtleSA9IF9maWxlUmVmZXJlbmNlKGZpbGVPYmosIGNodW5rKTtcclxuICAgICAgdmFyIGNodW5rUmVhZFN0cmVhbSA9IEZTLlRlbXBTdG9yZS5TdG9yYWdlLmFkYXB0ZXIuY3JlYXRlUmVhZFN0cmVhbShmaWxlS2V5KTtcclxuICAgICAgbmV4dChjaHVua1JlYWRTdHJlYW0pO1xyXG4gICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICAgIHRocm93IGVycm9yO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvLyBNYWtlIGEgY29tYmluZWQgc3RyZWFtXHJcbiAgdmFyIGNvbWJpbmVkU3RyZWFtID0gQ29tYmluZWRTdHJlYW0uY3JlYXRlKCk7XHJcblxyXG4gIC8vIEFkZCBlYWNoIGNodW5rIHN0cmVhbSB0byB0aGUgY29tYmluZWQgc3RyZWFtIHdoZW4gdGhlIHByZXZpb3VzIGNodW5rIHN0cmVhbSBlbmRzXHJcbiAgdmFyIGN1cnJlbnRDaHVuayA9IDA7XHJcbiAgZm9yICh2YXIgY2h1bmsgPSAwOyBjaHVuayA8IHRvdGFsQ2h1bmtzOyBjaHVuaysrKSB7XHJcbiAgICBjb21iaW5lZFN0cmVhbS5hcHBlbmQoZ2V0TmV4dFN0cmVhbUZ1bmMoY2h1bmspKTtcclxuICB9XHJcblxyXG4gIC8vIFJldHVybiB0aGUgY29tYmluZWQgc3RyZWFtXHJcbiAgcmV0dXJuIGNvbWJpbmVkU3RyZWFtO1xyXG59O1xyXG4iXX0=
