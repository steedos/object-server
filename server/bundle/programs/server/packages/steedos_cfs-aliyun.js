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
var Aliyun, o, s;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:cfs-aliyun":{"checkNpm.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/steedos_cfs-aliyun/checkNpm.js                                                                    //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
let checkNpmVersions;
module.link("meteor/tmeasday:check-npm-versions", {
  checkNpmVersions(v) {
    checkNpmVersions = v;
  }

}, 0);

if (Meteor.settings && Meteor.settings.cfs && Meteor.settings.cfs.aliyun) {
  checkNpmVersions({
    'aliyun-sdk': '^1.9.2'
  }, 'steedos:cfs-aliyun');
  Aliyun = require('aliyun-sdk');
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"aliyun.server.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/steedos_cfs-aliyun/aliyun.server.js                                                               //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
if (!Aliyun) return; // We use the official aws sdk

/**
 * Creates an Aliyun OSS store instance on server. Inherits `FS.StorageAdapter`
 * type.
 *
 * @public
 * @constructor
 * @param {String} name      The store name
 * @param {Object} options   Storage options
 * @return {FS.Store.OSS}    An instance of FS.StorageAdapter.
 */

FS.Store.OSS = function (name, options) {
  var self = this;

  if (!(self instanceof FS.Store.OSS)) {
    throw new Error('FS.Store.OSS missing keyword "new"');
  }

  options = options || {}; // Determine which folder (key prefix) in the bucket to use

  var folder = options.folder;
  folder = typeof folder === 'string' && folder.length ? folder.replace(/^\//, '').replace(/\/?$/, '/') : '';
  folder = folder === '/' ? '' : folder; // Determine which bucket to use, reruired

  var bucket = options.bucket;

  if (!bucket) {
    throw new Error('FS.Store.OSS requires "buckect"');
  } // Those ACL values are allowed: 'private', 'public-read', 'public-read-write'


  var defaultAcl = options.ACL || 'private';
  var region = options.region || 'oss-cn-beijing'; // var regionList = ['oss-cn-hangzhou', 'oss-cn-beijing', 'oss-cn-qingdao',
  //                   'oss-cn-shenzhen', 'oss-cn-hongkong'];
  // if (regionList.indexOf(region) === -1) {
  //   throw new Error('FS.Store.OSS invalid region');
  // }
  // var endpoint = 'http://' + region + (options.internal ? '-internal' : '') +
  //                '.aliyuncs.com';

  var endpoint = 'http://' + region + '.aliyuncs.com';
  var serviceParams = FS.Utility.extend({
    accessKeyId: null,
    // Required
    secretAccessKey: null,
    // Required
    endpoint: endpoint,
    httpOptions: {
      timeout: 60000
    },
    apiVersion: '2013-10-15' // Required, DO NOT UPDATE

  }, options); // Create S3 service

  var ossStore = new Aliyun.OSS(serviceParams);
  /**
   * Pick keys from object
   * @param  {Object} obj  Original object
   * @param  {Array}  keys Array of keys to be preserved
   * @return {Object}      New object
   */

  function pick(obj, keys) {
    var result = {},
        iteratee = keys[0];
    if (obj == null || arguments.length < 2) return result;

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];

      if (obj.hasOwnProperty(key)) {
        result[key] = obj[key];
      }
    }

    return result;
  }

  return new FS.StorageAdapter(name, options, {
    typeName: 'storage.oss',
    fileKey: function (fileObj) {
      // Lookup the copy
      var info = fileObj && fileObj._getInfo(name); // If the store and key is found return the key


      if (info && info.key) return info.key;
      var filename = fileObj.name();
      var filenameInStore = fileObj.name({
        store: name
      }); // If no store key found we resolve / generate a key

      return fileObj.collectionName + '/' + fileObj.collectionName + "-" + fileObj._id + '-' + (filenameInStore || filename);
    },
    createReadStream: function (fileKey, options) {
      return ossStore.createReadStream({
        Bucket: bucket,
        Key: fileKey
      }, options);
    },
    // Comment to documentation: Set options.ContentLength otherwise the
    // indirect stream will be used creating extra overhead on the filesystem.
    // An easy way if the data is not transformed is to set the
    // options.ContentLength = fileObj.size ...
    createWriteStream: function (fileKey, options) {
      options = options || {}; // We dont support array of aliases

      delete options.aliases; // We dont support contentType

      delete options.contentType; // We dont support metadata use Metadata?

      delete options.metadata; // Set options

      var options = FS.Utility.extend({
        Bucket: bucket,
        Key: folder + fileKey,
        ACL: defaultAcl
      }, options);
      return ossStore.createWriteStream(options);
    },
    remove: function (fileKey, callback) {
      ossStore.deleteObject({
        Bucket: bucket,
        Key: fileKey
      }, function (error) {
        console.log(error);
        callback(error, !error);
      }); // callback(null, true);
    },
    watch: function () {
      throw new Error('OSS does not support watch.');
    }
  });
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"aliyun.stream.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/steedos_cfs-aliyun/aliyun.stream.js                                                               //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
if (!Aliyun) return;

var stream = require('stream');
/**
 * Wraps official put stream
 * @param  {[type]} params [description]
 * @param  {[type]} option [description]
 * @return {[type]}        [description]
 */


Aliyun.OSS.prototype.createReadStream = function (params, option) {
  o = this.getObject(params);
  s = o.createReadStream();
  s._aliyunObject = o;
  s._maxListeners = 100;
  return s;
};
/**
 * Creates get put stream, inspired by github.com/meteormatt:
 * https://github.com/meteormatt/oss-upload-stream
 * @param  {Object} params CollectionFS Params
 * @param  {Object} option CollectionFS Options
 * @return {Stream}        writeStream object
 */


Aliyun.OSS.prototype.createWriteStream = function (params, option) {
  var self = this; // Scope variables
  // Create the writable stream interface.

  var writeStream = new stream.Writable({
    highWaterMark: 4194304
  }); // 4MB

  var multipartUploadID = null;
  var chunkSizeThreashold = 5242880;
  var awaitingCallback;
  var fileKey = params && (params.fileKey || params.Key); // Current chunk

  var currentChunk = Buffer(0);
  var chunkNumber = 1; // Status

  var parts = [];
  var receivedSize = 0;
  var uploadedSize = 0;

  var runWhenReady = function (callback) {
    // If we dont have a upload id we are not ready
    if (multipartUploadID === null) {
      // We set the waiting callback
      awaitingCallback = callback;
    } else {
      // No problem - just continue
      callback();
    }
  }; // Handler to receive data and upload it to OSS.


  writeStream._write = function (incomingChunk, enc, next) {
    currentChunk = Buffer.concat([currentChunk, incomingChunk]); // While the current chunk is larger than chunkSizeThreashold, we flush
    // the chunk buffer to OSS via multipart upload.

    if (currentChunk.length > chunkSizeThreashold) {
      // Upload when necessary;
      runWhenReady(function () {
        flushChunk(next, false);
      });
    } else {
      runWhenReady(next);
    }
  }; // Hijack the end method, send to OSS and complete.


  var _originalEnd = writeStream.end;

  writeStream.end = function (chunk, encoding, callback) {
    _originalEnd.call(this, chunk, encoding, function () {
      runWhenReady(function () {
        flushChunk(callback, true);
      });
    });
  };
  /**
   * Flushes chunk to Aliyun
   * @param  {Function} callback  Callback, normally for next part of data.
   * @param  {Boolean}  lastChunk If it's the last chunk.
   * @return {undefined}
   */


  function flushChunk(callback, lastChunk) {
    if (multipartUploadID === null) {
      throw new Error('OSS Client Error: Missing mulitipart upload ID');
    } // Chunk to upload


    var uploadingChunk = Buffer(currentChunk.length);
    currentChunk.copy(uploadingChunk); // copies to target

    var localChunkNumber = chunkNumber++;
    receivedSize += uploadingChunk.length;
    self.uploadPart({
      Body: uploadingChunk,
      Bucket: params.Bucket,
      Key: params.Key,
      UploadId: multipartUploadID,
      PartNumber: localChunkNumber
    }, uploadPartCallback); // Reset the current buffer

    currentChunk = Buffer(0);

    function uploadPartCallback(error, result) {
      // Handle error as the top priority;
      if (error) {
        abortUpload('OSS Client Error: ' + JSON.stringify(error));
        return;
      } // Next part of data.


      if (typeof callback === 'function') {
        callback();
      }

      uploadedSize += uploadingChunk.length;
      parts[localChunkNumber - 1] = {
        ETag: result.ETag,
        PartNumber: localChunkNumber
      }; // Debug only.
      // writeStream.emit('chunk', {
      //   ETag: result.ETag,
      //   PartNumber: localChunkNumber,
      //   receivedSize: receivedSize,
      //   uploadedSize: uploadedSize
      // });
      // While incoming stream is finished and we have uploaded everything,
      // we would further notice OSS

      if (writeStream._writableState.ended === true && uploadedSize === receivedSize && lastChunk) {
        closeUploadStream();
      }
    }
  }

  ;
  /**
   * Shuts down upload stream, calls Aliyun to merge every chunk of file
   * @return {undefined}
   */

  function closeUploadStream() {
    // Not possible without multipart upload id
    if (!multipartUploadID) {
      return;
    }

    self.completeMultipartUpload({
      Bucket: params.Bucket,
      Key: params.Key,
      UploadId: multipartUploadID,
      CompleteMultipartUpload: {
        Parts: parts
      }
    }, function (error, result) {
      if (error) {
        abortUpload('OSS Client Error at Comletion: ' + JSON.stringify(error));
        return;
      }

      if (FS.debug) {
        console.log('SA OSS - DONE!!');
      }

      writeStream.emit('stored', {
        fileKey: fileKey,
        size: uploadedSize,
        storedAt: new Date()
      });
    });
  }
  /**
   * When a fatal error occurs abort the multipart upload
   * @param  {String} errorText Error text
   * @return {undefined}
   */


  function abortUpload(errorText) {
    self.abortMultipartUpload({
      Bucket: params.Bucket,
      Key: params.Key,
      UploadId: multipartUploadID
    }, function (abortError) {
      if (abortError) {
        writeStream.emit('error', errorText + '\nOSS Client Abort Error: ' + abortError);
      } else {
        writeStream.emit('error', errorText);
      }
    });
  }

  ;
  self.createMultipartUpload(params, function (error, data) {
    if (error) {
      writeStream.emit('error', 'OSS Client Error: ' + JSON.stringify(error));
      return;
    }

    multipartUploadID = data.UploadId; // Call awaiting callback to start upload

    if (typeof awaitingCallback === 'function') {
      awaitingCallback();
    }
  });
  return writeStream;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/steedos:cfs-aliyun/checkNpm.js");
require("/node_modules/meteor/steedos:cfs-aliyun/aliyun.server.js");
require("/node_modules/meteor/steedos:cfs-aliyun/aliyun.stream.js");

/* Exports */
Package._define("steedos:cfs-aliyun");

})();

//# sourceURL=meteor://💻app/packages/steedos_cfs-aliyun.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpjZnMtYWxpeXVuL2NoZWNrTnBtLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zOmNmcy1hbGl5dW4vYWxpeXVuLnNlcnZlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpjZnMtYWxpeXVuL2FsaXl1bi5zdHJlYW0uanMiXSwibmFtZXMiOlsiY2hlY2tOcG1WZXJzaW9ucyIsIm1vZHVsZSIsImxpbmsiLCJ2IiwiTWV0ZW9yIiwic2V0dGluZ3MiLCJjZnMiLCJhbGl5dW4iLCJBbGl5dW4iLCJyZXF1aXJlIiwiRlMiLCJTdG9yZSIsIk9TUyIsIm5hbWUiLCJvcHRpb25zIiwic2VsZiIsIkVycm9yIiwiZm9sZGVyIiwibGVuZ3RoIiwicmVwbGFjZSIsImJ1Y2tldCIsImRlZmF1bHRBY2wiLCJBQ0wiLCJyZWdpb24iLCJlbmRwb2ludCIsInNlcnZpY2VQYXJhbXMiLCJVdGlsaXR5IiwiZXh0ZW5kIiwiYWNjZXNzS2V5SWQiLCJzZWNyZXRBY2Nlc3NLZXkiLCJodHRwT3B0aW9ucyIsInRpbWVvdXQiLCJhcGlWZXJzaW9uIiwib3NzU3RvcmUiLCJwaWNrIiwib2JqIiwia2V5cyIsInJlc3VsdCIsIml0ZXJhdGVlIiwiYXJndW1lbnRzIiwiaSIsImtleSIsImhhc093blByb3BlcnR5IiwiU3RvcmFnZUFkYXB0ZXIiLCJ0eXBlTmFtZSIsImZpbGVLZXkiLCJmaWxlT2JqIiwiaW5mbyIsIl9nZXRJbmZvIiwiZmlsZW5hbWUiLCJmaWxlbmFtZUluU3RvcmUiLCJzdG9yZSIsImNvbGxlY3Rpb25OYW1lIiwiX2lkIiwiY3JlYXRlUmVhZFN0cmVhbSIsIkJ1Y2tldCIsIktleSIsImNyZWF0ZVdyaXRlU3RyZWFtIiwiYWxpYXNlcyIsImNvbnRlbnRUeXBlIiwibWV0YWRhdGEiLCJyZW1vdmUiLCJjYWxsYmFjayIsImRlbGV0ZU9iamVjdCIsImVycm9yIiwiY29uc29sZSIsImxvZyIsIndhdGNoIiwic3RyZWFtIiwicHJvdG90eXBlIiwicGFyYW1zIiwib3B0aW9uIiwibyIsImdldE9iamVjdCIsInMiLCJfYWxpeXVuT2JqZWN0IiwiX21heExpc3RlbmVycyIsIndyaXRlU3RyZWFtIiwiV3JpdGFibGUiLCJoaWdoV2F0ZXJNYXJrIiwibXVsdGlwYXJ0VXBsb2FkSUQiLCJjaHVua1NpemVUaHJlYXNob2xkIiwiYXdhaXRpbmdDYWxsYmFjayIsImN1cnJlbnRDaHVuayIsIkJ1ZmZlciIsImNodW5rTnVtYmVyIiwicGFydHMiLCJyZWNlaXZlZFNpemUiLCJ1cGxvYWRlZFNpemUiLCJydW5XaGVuUmVhZHkiLCJfd3JpdGUiLCJpbmNvbWluZ0NodW5rIiwiZW5jIiwibmV4dCIsImNvbmNhdCIsImZsdXNoQ2h1bmsiLCJfb3JpZ2luYWxFbmQiLCJlbmQiLCJjaHVuayIsImVuY29kaW5nIiwiY2FsbCIsImxhc3RDaHVuayIsInVwbG9hZGluZ0NodW5rIiwiY29weSIsImxvY2FsQ2h1bmtOdW1iZXIiLCJ1cGxvYWRQYXJ0IiwiQm9keSIsIlVwbG9hZElkIiwiUGFydE51bWJlciIsInVwbG9hZFBhcnRDYWxsYmFjayIsImFib3J0VXBsb2FkIiwiSlNPTiIsInN0cmluZ2lmeSIsIkVUYWciLCJfd3JpdGFibGVTdGF0ZSIsImVuZGVkIiwiY2xvc2VVcGxvYWRTdHJlYW0iLCJjb21wbGV0ZU11bHRpcGFydFVwbG9hZCIsIkNvbXBsZXRlTXVsdGlwYXJ0VXBsb2FkIiwiUGFydHMiLCJkZWJ1ZyIsImVtaXQiLCJzaXplIiwic3RvcmVkQXQiLCJEYXRlIiwiZXJyb3JUZXh0IiwiYWJvcnRNdWx0aXBhcnRVcGxvYWQiLCJhYm9ydEVycm9yIiwiY3JlYXRlTXVsdGlwYXJ0VXBsb2FkIiwiZGF0YSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxnQkFBSjtBQUFxQkMsTUFBTSxDQUFDQyxJQUFQLENBQVksb0NBQVosRUFBaUQ7QUFBQ0Ysa0JBQWdCLENB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QUFFZSxNQUFNLENBQUNmLE1BRFM7QUFFeEJDLFNBQUcsRUFBRWMsTUFBTSxDQUFDZCxHQUZZO0FBR3hCbUQsY0FBUSxFQUFFM0I7QUFIYyxLQUExQixFQUlHLFVBQVMrQyxVQUFULEVBQXFCO0FBQ3RCLFVBQUlBLFVBQUosRUFBZ0I7QUFDZGxELG1CQUFXLENBQUM0QyxJQUFaLENBQWlCLE9BQWpCLEVBQ2lCSSxTQUFTLEdBQUcsNEJBQVosR0FBMkNFLFVBRDVEO0FBRUQsT0FIRCxNQUdPO0FBQ0xsRCxtQkFBVyxDQUFDNEMsSUFBWixDQUFpQixPQUFqQixFQUEwQkksU0FBMUI7QUFDRDtBQUNGLEtBWEQ7QUFZRDs7QUFBQTtBQUVEOUcsTUFBSSxDQUFDaUgscUJBQUwsQ0FBMkIxRCxNQUEzQixFQUFtQyxVQUFTTixLQUFULEVBQWdCaUUsSUFBaEIsRUFBc0I7QUFDdkQsUUFBSWpFLEtBQUosRUFBVztBQUNUYSxpQkFBVyxDQUFDNEMsSUFBWixDQUFpQixPQUFqQixFQUEwQix1QkFBdUJWLElBQUksQ0FBQ0MsU0FBTCxDQUFlaEQsS0FBZixDQUFqRDtBQUNBO0FBQ0Q7O0FBQ0RnQixxQkFBaUIsR0FBR2lELElBQUksQ0FBQ3RCLFFBQXpCLENBTHVELENBTXZEOztBQUNBLFFBQUksT0FBT3pCLGdCQUFQLEtBQTRCLFVBQWhDLEVBQTRDO0FBQzFDQSxzQkFBZ0I7QUFDakI7QUFDRixHQVZEO0FBWUEsU0FBT0wsV0FBUDtBQUNELENBdExELEMiLCJmaWxlIjoiL3BhY2thZ2VzL3N0ZWVkb3NfY2ZzLWFsaXl1bi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XHJcbiAgY2hlY2tOcG1WZXJzaW9uc1xyXG59IGZyb20gJ21ldGVvci90bWVhc2RheTpjaGVjay1ucG0tdmVyc2lvbnMnO1xyXG5cclxuaWYgKE1ldGVvci5zZXR0aW5ncyAmJiBNZXRlb3Iuc2V0dGluZ3MuY2ZzICYmIE1ldGVvci5zZXR0aW5ncy5jZnMuYWxpeXVuKSB7XHJcbiAgY2hlY2tOcG1WZXJzaW9ucyh7XHJcbiAgICAnYWxpeXVuLXNkayc6ICdeMS45LjInXHJcbiAgfSwgJ3N0ZWVkb3M6Y2ZzLWFsaXl1bicpO1xyXG5cclxuICBBbGl5dW4gPSByZXF1aXJlKCdhbGl5dW4tc2RrJyk7XHJcbn0iLCJpZiAoIUFsaXl1bilcclxuICByZXR1cm47XHJcblxyXG4vLyBXZSB1c2UgdGhlIG9mZmljaWFsIGF3cyBzZGtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGFuIEFsaXl1biBPU1Mgc3RvcmUgaW5zdGFuY2Ugb24gc2VydmVyLiBJbmhlcml0cyBgRlMuU3RvcmFnZUFkYXB0ZXJgXHJcbiAqIHR5cGUuXHJcbiAqXHJcbiAqIEBwdWJsaWNcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lICAgICAgVGhlIHN0b3JlIG5hbWVcclxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgICBTdG9yYWdlIG9wdGlvbnNcclxuICogQHJldHVybiB7RlMuU3RvcmUuT1NTfSAgICBBbiBpbnN0YW5jZSBvZiBGUy5TdG9yYWdlQWRhcHRlci5cclxuICovXHJcbkZTLlN0b3JlLk9TUyA9IGZ1bmN0aW9uKG5hbWUsIG9wdGlvbnMpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgaWYgKCEoc2VsZiBpbnN0YW5jZW9mIEZTLlN0b3JlLk9TUykpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignRlMuU3RvcmUuT1NTIG1pc3Npbmcga2V5d29yZCBcIm5ld1wiJyk7XHJcbiAgfVxyXG5cclxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgLy8gRGV0ZXJtaW5lIHdoaWNoIGZvbGRlciAoa2V5IHByZWZpeCkgaW4gdGhlIGJ1Y2tldCB0byB1c2VcclxuICB2YXIgZm9sZGVyID0gb3B0aW9ucy5mb2xkZXI7XHJcbiAgZm9sZGVyID0gdHlwZW9mIGZvbGRlciA9PT0gJ3N0cmluZycgJiYgZm9sZGVyLmxlbmd0aCA/XHJcbiAgICBmb2xkZXIucmVwbGFjZSgvXlxcLy8sICcnKS5yZXBsYWNlKC9cXC8/JC8sICcvJykgOiAnJztcclxuICBmb2xkZXIgPSBmb2xkZXIgPT09ICcvJyA/ICcnIDogZm9sZGVyO1xyXG5cclxuICAvLyBEZXRlcm1pbmUgd2hpY2ggYnVja2V0IHRvIHVzZSwgcmVydWlyZWRcclxuICB2YXIgYnVja2V0ID0gb3B0aW9ucy5idWNrZXQ7XHJcbiAgaWYgKCFidWNrZXQpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignRlMuU3RvcmUuT1NTIHJlcXVpcmVzIFwiYnVja2VjdFwiJyk7XHJcbiAgfVxyXG5cclxuICAvLyBUaG9zZSBBQ0wgdmFsdWVzIGFyZSBhbGxvd2VkOiAncHJpdmF0ZScsICdwdWJsaWMtcmVhZCcsICdwdWJsaWMtcmVhZC13cml0ZSdcclxuICB2YXIgZGVmYXVsdEFjbCA9IG9wdGlvbnMuQUNMIHx8ICdwcml2YXRlJztcclxuXHJcbiAgdmFyIHJlZ2lvbiA9IG9wdGlvbnMucmVnaW9uIHx8ICdvc3MtY24tYmVpamluZyc7XHJcbiAgLy8gdmFyIHJlZ2lvbkxpc3QgPSBbJ29zcy1jbi1oYW5nemhvdScsICdvc3MtY24tYmVpamluZycsICdvc3MtY24tcWluZ2RhbycsXHJcbiAgLy8gICAgICAgICAgICAgICAgICAgJ29zcy1jbi1zaGVuemhlbicsICdvc3MtY24taG9uZ2tvbmcnXTtcclxuICAvLyBpZiAocmVnaW9uTGlzdC5pbmRleE9mKHJlZ2lvbikgPT09IC0xKSB7XHJcbiAgLy8gICB0aHJvdyBuZXcgRXJyb3IoJ0ZTLlN0b3JlLk9TUyBpbnZhbGlkIHJlZ2lvbicpO1xyXG4gIC8vIH1cclxuXHJcbiAgLy8gdmFyIGVuZHBvaW50ID0gJ2h0dHA6Ly8nICsgcmVnaW9uICsgKG9wdGlvbnMuaW50ZXJuYWwgPyAnLWludGVybmFsJyA6ICcnKSArXHJcbiAgLy8gICAgICAgICAgICAgICAgJy5hbGl5dW5jcy5jb20nO1xyXG4gIHZhciBlbmRwb2ludCA9ICdodHRwOi8vJyArIHJlZ2lvbiArICcuYWxpeXVuY3MuY29tJztcclxuXHJcbiAgdmFyIHNlcnZpY2VQYXJhbXMgPSBGUy5VdGlsaXR5LmV4dGVuZCh7XHJcbiAgICBhY2Nlc3NLZXlJZDogbnVsbCwgLy8gUmVxdWlyZWRcclxuICAgIHNlY3JldEFjY2Vzc0tleTogbnVsbCwgLy8gUmVxdWlyZWRcclxuICAgIGVuZHBvaW50OiBlbmRwb2ludCxcclxuICAgIGh0dHBPcHRpb25zOiB7XHJcbiAgICAgIHRpbWVvdXQ6IDYwMDAwXHJcbiAgICB9LFxyXG4gICAgYXBpVmVyc2lvbjogJzIwMTMtMTAtMTUnIC8vIFJlcXVpcmVkLCBETyBOT1QgVVBEQVRFXHJcbiAgfSwgb3B0aW9ucyk7XHJcblxyXG4gIC8vIENyZWF0ZSBTMyBzZXJ2aWNlXHJcbiAgdmFyIG9zc1N0b3JlID0gbmV3IEFsaXl1bi5PU1Moc2VydmljZVBhcmFtcyk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFBpY2sga2V5cyBmcm9tIG9iamVjdFxyXG4gICAqIEBwYXJhbSAge09iamVjdH0gb2JqICBPcmlnaW5hbCBvYmplY3RcclxuICAgKiBAcGFyYW0gIHtBcnJheX0gIGtleXMgQXJyYXkgb2Yga2V5cyB0byBiZSBwcmVzZXJ2ZWRcclxuICAgKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgTmV3IG9iamVjdFxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIHBpY2sob2JqLCBrZXlzKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0ge30sXHJcbiAgICAgIGl0ZXJhdGVlID0ga2V5c1swXTtcclxuICAgIGlmIChvYmogPT0gbnVsbCB8fCBhcmd1bWVudHMubGVuZ3RoIDwgMikgcmV0dXJuIHJlc3VsdDtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICB2YXIga2V5ID0ga2V5c1tpXTtcclxuICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgcmVzdWx0W2tleV0gPSBvYmpba2V5XTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcblxyXG4gIHJldHVybiBuZXcgRlMuU3RvcmFnZUFkYXB0ZXIobmFtZSwgb3B0aW9ucywge1xyXG4gICAgdHlwZU5hbWU6ICdzdG9yYWdlLm9zcycsXHJcbiAgICBmaWxlS2V5OiBmdW5jdGlvbihmaWxlT2JqKSB7XHJcbiAgICAgIC8vIExvb2t1cCB0aGUgY29weVxyXG4gICAgICB2YXIgaW5mbyA9IGZpbGVPYmogJiYgZmlsZU9iai5fZ2V0SW5mbyhuYW1lKTtcclxuICAgICAgLy8gSWYgdGhlIHN0b3JlIGFuZCBrZXkgaXMgZm91bmQgcmV0dXJuIHRoZSBrZXlcclxuICAgICAgaWYgKGluZm8gJiYgaW5mby5rZXkpIHJldHVybiBpbmZvLmtleTtcclxuXHJcbiAgICAgIHZhciBmaWxlbmFtZSA9IGZpbGVPYmoubmFtZSgpO1xyXG4gICAgICB2YXIgZmlsZW5hbWVJblN0b3JlID0gZmlsZU9iai5uYW1lKHtcclxuICAgICAgICBzdG9yZTogbmFtZVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIC8vIElmIG5vIHN0b3JlIGtleSBmb3VuZCB3ZSByZXNvbHZlIC8gZ2VuZXJhdGUgYSBrZXlcclxuICAgICAgcmV0dXJuIGZpbGVPYmouY29sbGVjdGlvbk5hbWUgKyAnLycgKyBmaWxlT2JqLmNvbGxlY3Rpb25OYW1lICsgXCItXCIgK1xyXG4gICAgICAgIGZpbGVPYmouX2lkICsgJy0nICsgKGZpbGVuYW1lSW5TdG9yZSB8fCBmaWxlbmFtZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNyZWF0ZVJlYWRTdHJlYW06IGZ1bmN0aW9uKGZpbGVLZXksIG9wdGlvbnMpIHtcclxuICAgICAgcmV0dXJuIG9zc1N0b3JlLmNyZWF0ZVJlYWRTdHJlYW0oe1xyXG4gICAgICAgIEJ1Y2tldDogYnVja2V0LFxyXG4gICAgICAgIEtleTogZmlsZUtleVxyXG4gICAgICB9LCBvcHRpb25zKTtcclxuICAgIH0sXHJcbiAgICAvLyBDb21tZW50IHRvIGRvY3VtZW50YXRpb246IFNldCBvcHRpb25zLkNvbnRlbnRMZW5ndGggb3RoZXJ3aXNlIHRoZVxyXG4gICAgLy8gaW5kaXJlY3Qgc3RyZWFtIHdpbGwgYmUgdXNlZCBjcmVhdGluZyBleHRyYSBvdmVyaGVhZCBvbiB0aGUgZmlsZXN5c3RlbS5cclxuICAgIC8vIEFuIGVhc3kgd2F5IGlmIHRoZSBkYXRhIGlzIG5vdCB0cmFuc2Zvcm1lZCBpcyB0byBzZXQgdGhlXHJcbiAgICAvLyBvcHRpb25zLkNvbnRlbnRMZW5ndGggPSBmaWxlT2JqLnNpemUgLi4uXHJcbiAgICBjcmVhdGVXcml0ZVN0cmVhbTogZnVuY3Rpb24oZmlsZUtleSwgb3B0aW9ucykge1xyXG4gICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgIC8vIFdlIGRvbnQgc3VwcG9ydCBhcnJheSBvZiBhbGlhc2VzXHJcbiAgICAgIGRlbGV0ZSBvcHRpb25zLmFsaWFzZXM7XHJcbiAgICAgIC8vIFdlIGRvbnQgc3VwcG9ydCBjb250ZW50VHlwZVxyXG4gICAgICBkZWxldGUgb3B0aW9ucy5jb250ZW50VHlwZTtcclxuICAgICAgLy8gV2UgZG9udCBzdXBwb3J0IG1ldGFkYXRhIHVzZSBNZXRhZGF0YT9cclxuICAgICAgZGVsZXRlIG9wdGlvbnMubWV0YWRhdGE7XHJcblxyXG4gICAgICAvLyBTZXQgb3B0aW9uc1xyXG4gICAgICB2YXIgb3B0aW9ucyA9IEZTLlV0aWxpdHkuZXh0ZW5kKHtcclxuICAgICAgICBCdWNrZXQ6IGJ1Y2tldCxcclxuICAgICAgICBLZXk6IGZvbGRlciArIGZpbGVLZXksXHJcbiAgICAgICAgQUNMOiBkZWZhdWx0QWNsXHJcbiAgICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgICAgcmV0dXJuIG9zc1N0b3JlLmNyZWF0ZVdyaXRlU3RyZWFtKG9wdGlvbnMpO1xyXG4gICAgfSxcclxuICAgIHJlbW92ZTogZnVuY3Rpb24oZmlsZUtleSwgY2FsbGJhY2spIHtcclxuXHJcbiAgICAgIG9zc1N0b3JlLmRlbGV0ZU9iamVjdCh7XHJcbiAgICAgICAgQnVja2V0OiBidWNrZXQsXHJcbiAgICAgICAgS2V5OiBmaWxlS2V5XHJcbiAgICAgIH0sIGZ1bmN0aW9uKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xyXG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCAhZXJyb3IpO1xyXG4gICAgICB9KTtcclxuICAgICAgLy8gY2FsbGJhY2sobnVsbCwgdHJ1ZSk7XHJcbiAgICB9LFxyXG4gICAgd2F0Y2g6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ09TUyBkb2VzIG5vdCBzdXBwb3J0IHdhdGNoLicpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59OyIsImlmICghQWxpeXVuKVxyXG4gIHJldHVybjtcclxuXHJcbnZhciBzdHJlYW0gPSByZXF1aXJlKCdzdHJlYW0nKTtcclxuXHJcbi8qKlxyXG4gKiBXcmFwcyBvZmZpY2lhbCBwdXQgc3RyZWFtXHJcbiAqIEBwYXJhbSAge1t0eXBlXX0gcGFyYW1zIFtkZXNjcmlwdGlvbl1cclxuICogQHBhcmFtICB7W3R5cGVdfSBvcHRpb24gW2Rlc2NyaXB0aW9uXVxyXG4gKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICBbZGVzY3JpcHRpb25dXHJcbiAqL1xyXG5BbGl5dW4uT1NTLnByb3RvdHlwZS5jcmVhdGVSZWFkU3RyZWFtID0gZnVuY3Rpb24ocGFyYW1zLCBvcHRpb24pIHtcclxuICBvID0gdGhpcy5nZXRPYmplY3QocGFyYW1zKTtcclxuICBzID0gby5jcmVhdGVSZWFkU3RyZWFtKCk7XHJcbiAgcy5fYWxpeXVuT2JqZWN0ID0gbztcclxuICBzLl9tYXhMaXN0ZW5lcnMgPSAxMDA7XHJcbiAgcmV0dXJuIHM7XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBnZXQgcHV0IHN0cmVhbSwgaW5zcGlyZWQgYnkgZ2l0aHViLmNvbS9tZXRlb3JtYXR0OlxyXG4gKiBodHRwczovL2dpdGh1Yi5jb20vbWV0ZW9ybWF0dC9vc3MtdXBsb2FkLXN0cmVhbVxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHBhcmFtcyBDb2xsZWN0aW9uRlMgUGFyYW1zXHJcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9uIENvbGxlY3Rpb25GUyBPcHRpb25zXHJcbiAqIEByZXR1cm4ge1N0cmVhbX0gICAgICAgIHdyaXRlU3RyZWFtIG9iamVjdFxyXG4gKi9cclxuQWxpeXVuLk9TUy5wcm90b3R5cGUuY3JlYXRlV3JpdGVTdHJlYW0gPSBmdW5jdGlvbihwYXJhbXMsIG9wdGlvbikge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgLy8gU2NvcGUgdmFyaWFibGVzXHJcbiAgLy8gQ3JlYXRlIHRoZSB3cml0YWJsZSBzdHJlYW0gaW50ZXJmYWNlLlxyXG4gIHZhciB3cml0ZVN0cmVhbSA9IG5ldyBzdHJlYW0uV3JpdGFibGUoe2hpZ2hXYXRlck1hcms6IDQxOTQzMDR9KTsgLy8gNE1CXHJcbiAgdmFyIG11bHRpcGFydFVwbG9hZElEID0gbnVsbDtcclxuICB2YXIgY2h1bmtTaXplVGhyZWFzaG9sZCA9IDUyNDI4ODA7XHJcbiAgdmFyIGF3YWl0aW5nQ2FsbGJhY2s7XHJcbiAgdmFyIGZpbGVLZXkgPSBwYXJhbXMgJiYgKHBhcmFtcy5maWxlS2V5IHx8IHBhcmFtcy5LZXkpO1xyXG5cclxuICAvLyBDdXJyZW50IGNodW5rXHJcbiAgdmFyIGN1cnJlbnRDaHVuayA9IEJ1ZmZlcigwKTtcclxuICB2YXIgY2h1bmtOdW1iZXIgPSAxO1xyXG5cclxuICAvLyBTdGF0dXNcclxuICB2YXIgcGFydHMgPSBbXTtcclxuICB2YXIgcmVjZWl2ZWRTaXplID0gMDtcclxuICB2YXIgdXBsb2FkZWRTaXplID0gMDtcclxuXHJcbiAgdmFyIHJ1bldoZW5SZWFkeSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XHJcbiAgICAvLyBJZiB3ZSBkb250IGhhdmUgYSB1cGxvYWQgaWQgd2UgYXJlIG5vdCByZWFkeVxyXG4gICAgaWYgKG11bHRpcGFydFVwbG9hZElEID09PSBudWxsKSB7XHJcbiAgICAgIC8vIFdlIHNldCB0aGUgd2FpdGluZyBjYWxsYmFja1xyXG4gICAgICBhd2FpdGluZ0NhbGxiYWNrID0gY2FsbGJhY2s7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBObyBwcm9ibGVtIC0ganVzdCBjb250aW51ZVxyXG4gICAgICBjYWxsYmFjaygpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8vIEhhbmRsZXIgdG8gcmVjZWl2ZSBkYXRhIGFuZCB1cGxvYWQgaXQgdG8gT1NTLlxyXG4gIHdyaXRlU3RyZWFtLl93cml0ZSA9IGZ1bmN0aW9uKGluY29taW5nQ2h1bmssIGVuYywgbmV4dCkge1xyXG4gICAgY3VycmVudENodW5rID0gQnVmZmVyLmNvbmNhdChbY3VycmVudENodW5rLCBpbmNvbWluZ0NodW5rXSk7XHJcblxyXG4gICAgLy8gV2hpbGUgdGhlIGN1cnJlbnQgY2h1bmsgaXMgbGFyZ2VyIHRoYW4gY2h1bmtTaXplVGhyZWFzaG9sZCwgd2UgZmx1c2hcclxuICAgIC8vIHRoZSBjaHVuayBidWZmZXIgdG8gT1NTIHZpYSBtdWx0aXBhcnQgdXBsb2FkLlxyXG4gICAgaWYgKGN1cnJlbnRDaHVuay5sZW5ndGggPiBjaHVua1NpemVUaHJlYXNob2xkKSB7XHJcbiAgICAgIC8vIFVwbG9hZCB3aGVuIG5lY2Vzc2FyeTtcclxuICAgICAgcnVuV2hlblJlYWR5KGZ1bmN0aW9uKCkgeyBmbHVzaENodW5rKG5leHQsIGZhbHNlKTsgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBydW5XaGVuUmVhZHkobmV4dCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLy8gSGlqYWNrIHRoZSBlbmQgbWV0aG9kLCBzZW5kIHRvIE9TUyBhbmQgY29tcGxldGUuXHJcbiAgdmFyIF9vcmlnaW5hbEVuZCA9IHdyaXRlU3RyZWFtLmVuZDtcclxuICB3cml0ZVN0cmVhbS5lbmQgPSBmdW5jdGlvbihjaHVuaywgZW5jb2RpbmcsIGNhbGxiYWNrKSB7XHJcbiAgICBfb3JpZ2luYWxFbmQuY2FsbCh0aGlzLCBjaHVuaywgZW5jb2RpbmcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICBydW5XaGVuUmVhZHkoZnVuY3Rpb24oKSB7IGZsdXNoQ2h1bmsoY2FsbGJhY2ssIHRydWUpOyB9KTtcclxuICAgIH0pO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEZsdXNoZXMgY2h1bmsgdG8gQWxpeXVuXHJcbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrICBDYWxsYmFjaywgbm9ybWFsbHkgZm9yIG5leHQgcGFydCBvZiBkYXRhLlxyXG4gICAqIEBwYXJhbSAge0Jvb2xlYW59ICBsYXN0Q2h1bmsgSWYgaXQncyB0aGUgbGFzdCBjaHVuay5cclxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWR9XHJcbiAgICovXHJcbiAgZnVuY3Rpb24gZmx1c2hDaHVuayhjYWxsYmFjaywgbGFzdENodW5rKSB7XHJcbiAgICBpZiAobXVsdGlwYXJ0VXBsb2FkSUQgPT09IG51bGwpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdPU1MgQ2xpZW50IEVycm9yOiBNaXNzaW5nIG11bGl0aXBhcnQgdXBsb2FkIElEJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ2h1bmsgdG8gdXBsb2FkXHJcbiAgICB2YXIgdXBsb2FkaW5nQ2h1bmsgPSBCdWZmZXIoY3VycmVudENodW5rLmxlbmd0aCk7XHJcbiAgICBjdXJyZW50Q2h1bmsuY29weSh1cGxvYWRpbmdDaHVuayk7IC8vIGNvcGllcyB0byB0YXJnZXRcclxuXHJcbiAgICB2YXIgbG9jYWxDaHVua051bWJlciA9IGNodW5rTnVtYmVyKys7XHJcbiAgICByZWNlaXZlZFNpemUgKz0gdXBsb2FkaW5nQ2h1bmsubGVuZ3RoO1xyXG5cclxuICAgIHNlbGYudXBsb2FkUGFydCh7XHJcbiAgICAgIEJvZHk6IHVwbG9hZGluZ0NodW5rLFxyXG4gICAgICBCdWNrZXQ6IHBhcmFtcy5CdWNrZXQsXHJcbiAgICAgIEtleTogcGFyYW1zLktleSxcclxuICAgICAgVXBsb2FkSWQ6IG11bHRpcGFydFVwbG9hZElELFxyXG4gICAgICBQYXJ0TnVtYmVyOiBsb2NhbENodW5rTnVtYmVyXHJcbiAgICB9LCB1cGxvYWRQYXJ0Q2FsbGJhY2spO1xyXG5cclxuICAgIC8vIFJlc2V0IHRoZSBjdXJyZW50IGJ1ZmZlclxyXG4gICAgY3VycmVudENodW5rID0gQnVmZmVyKDApO1xyXG5cclxuICAgIGZ1bmN0aW9uIHVwbG9hZFBhcnRDYWxsYmFjayhlcnJvciwgcmVzdWx0KSB7XHJcbiAgICAgIC8vIEhhbmRsZSBlcnJvciBhcyB0aGUgdG9wIHByaW9yaXR5O1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBhYm9ydFVwbG9hZCgnT1NTIENsaWVudCBFcnJvcjogJyArIEpTT04uc3RyaW5naWZ5KGVycm9yKSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBOZXh0IHBhcnQgb2YgZGF0YS5cclxuICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHVwbG9hZGVkU2l6ZSArPSB1cGxvYWRpbmdDaHVuay5sZW5ndGg7XHJcbiAgICAgIHBhcnRzW2xvY2FsQ2h1bmtOdW1iZXIgLSAxXSA9IHtcclxuICAgICAgICBFVGFnOiByZXN1bHQuRVRhZyxcclxuICAgICAgICBQYXJ0TnVtYmVyOiBsb2NhbENodW5rTnVtYmVyXHJcbiAgICAgIH07XHJcblxyXG4gICAgICAvLyBEZWJ1ZyBvbmx5LlxyXG4gICAgICAvLyB3cml0ZVN0cmVhbS5lbWl0KCdjaHVuaycsIHtcclxuICAgICAgLy8gICBFVGFnOiByZXN1bHQuRVRhZyxcclxuICAgICAgLy8gICBQYXJ0TnVtYmVyOiBsb2NhbENodW5rTnVtYmVyLFxyXG4gICAgICAvLyAgIHJlY2VpdmVkU2l6ZTogcmVjZWl2ZWRTaXplLFxyXG4gICAgICAvLyAgIHVwbG9hZGVkU2l6ZTogdXBsb2FkZWRTaXplXHJcbiAgICAgIC8vIH0pO1xyXG5cclxuICAgICAgLy8gV2hpbGUgaW5jb21pbmcgc3RyZWFtIGlzIGZpbmlzaGVkIGFuZCB3ZSBoYXZlIHVwbG9hZGVkIGV2ZXJ5dGhpbmcsXHJcbiAgICAgIC8vIHdlIHdvdWxkIGZ1cnRoZXIgbm90aWNlIE9TU1xyXG4gICAgICBpZiAod3JpdGVTdHJlYW0uX3dyaXRhYmxlU3RhdGUuZW5kZWQgPT09IHRydWUgJiZcclxuICAgICAgICAgIHVwbG9hZGVkU2l6ZSA9PT0gcmVjZWl2ZWRTaXplICYmIGxhc3RDaHVuaykge1xyXG4gICAgICAgIGNsb3NlVXBsb2FkU3RyZWFtKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBTaHV0cyBkb3duIHVwbG9hZCBzdHJlYW0sIGNhbGxzIEFsaXl1biB0byBtZXJnZSBldmVyeSBjaHVuayBvZiBmaWxlXHJcbiAgICogQHJldHVybiB7dW5kZWZpbmVkfVxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGNsb3NlVXBsb2FkU3RyZWFtKCkge1xyXG4gICAgLy8gTm90IHBvc3NpYmxlIHdpdGhvdXQgbXVsdGlwYXJ0IHVwbG9hZCBpZFxyXG4gICAgaWYgKCFtdWx0aXBhcnRVcGxvYWRJRCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgc2VsZi5jb21wbGV0ZU11bHRpcGFydFVwbG9hZCh7XHJcbiAgICAgIEJ1Y2tldDogcGFyYW1zLkJ1Y2tldCxcclxuICAgICAgS2V5OiBwYXJhbXMuS2V5LFxyXG4gICAgICBVcGxvYWRJZDogbXVsdGlwYXJ0VXBsb2FkSUQsXHJcbiAgICAgIENvbXBsZXRlTXVsdGlwYXJ0VXBsb2FkOiB7UGFydHM6IHBhcnRzfVxyXG4gICAgfSwgZnVuY3Rpb24oZXJyb3IsIHJlc3VsdCkge1xyXG4gICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICBhYm9ydFVwbG9hZCgnT1NTIENsaWVudCBFcnJvciBhdCBDb21sZXRpb246ICcgKyBKU09OLnN0cmluZ2lmeShlcnJvcikpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKEZTLmRlYnVnKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1NBIE9TUyAtIERPTkUhIScpO1xyXG4gICAgICB9XHJcbiAgICAgIHdyaXRlU3RyZWFtLmVtaXQoJ3N0b3JlZCcsIHtcclxuICAgICAgICBmaWxlS2V5OiBmaWxlS2V5LFxyXG4gICAgICAgIHNpemU6IHVwbG9hZGVkU2l6ZSxcclxuICAgICAgICBzdG9yZWRBdDogbmV3IERhdGUoKVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogV2hlbiBhIGZhdGFsIGVycm9yIG9jY3VycyBhYm9ydCB0aGUgbXVsdGlwYXJ0IHVwbG9hZFxyXG4gICAqIEBwYXJhbSAge1N0cmluZ30gZXJyb3JUZXh0IEVycm9yIHRleHRcclxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWR9XHJcbiAgICovXHJcbiAgZnVuY3Rpb24gYWJvcnRVcGxvYWQoZXJyb3JUZXh0KSB7XHJcbiAgICBzZWxmLmFib3J0TXVsdGlwYXJ0VXBsb2FkKHtcclxuICAgICAgQnVja2V0OiBwYXJhbXMuQnVja2V0LFxyXG4gICAgICBLZXk6IHBhcmFtcy5LZXksXHJcbiAgICAgIFVwbG9hZElkOiBtdWx0aXBhcnRVcGxvYWRJRFxyXG4gICAgfSwgZnVuY3Rpb24oYWJvcnRFcnJvcikge1xyXG4gICAgICBpZiAoYWJvcnRFcnJvcikge1xyXG4gICAgICAgIHdyaXRlU3RyZWFtLmVtaXQoJ2Vycm9yJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yVGV4dCArICdcXG5PU1MgQ2xpZW50IEFib3J0IEVycm9yOiAnICsgYWJvcnRFcnJvcik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgd3JpdGVTdHJlYW0uZW1pdCgnZXJyb3InLCBlcnJvclRleHQpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9O1xyXG5cclxuICBzZWxmLmNyZWF0ZU11bHRpcGFydFVwbG9hZChwYXJhbXMsIGZ1bmN0aW9uKGVycm9yLCBkYXRhKSB7XHJcbiAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgd3JpdGVTdHJlYW0uZW1pdCgnZXJyb3InLCAnT1NTIENsaWVudCBFcnJvcjogJyArIEpTT04uc3RyaW5naWZ5KGVycm9yKSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIG11bHRpcGFydFVwbG9hZElEID0gZGF0YS5VcGxvYWRJZDtcclxuICAgIC8vIENhbGwgYXdhaXRpbmcgY2FsbGJhY2sgdG8gc3RhcnQgdXBsb2FkXHJcbiAgICBpZiAodHlwZW9mIGF3YWl0aW5nQ2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgYXdhaXRpbmdDYWxsYmFjaygpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gd3JpdGVTdHJlYW07XHJcbn07XHJcbiJdfQ==
