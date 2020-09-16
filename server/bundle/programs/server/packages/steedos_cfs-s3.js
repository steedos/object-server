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
var AWS;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:cfs-s3":{"checkNpm.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/steedos_cfs-s3/checkNpm.js                                                                       //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
let checkNpmVersions;
module.link("meteor/tmeasday:check-npm-versions", {
  checkNpmVersions(v) {
    checkNpmVersions = v;
  }

}, 0);

if (Meteor.settings && Meteor.settings.cfs && Meteor.settings.cfs.aws) {
  checkNpmVersions({
    'aws-sdk': "^2.0.23"
  }, 'steedos:cfs-s3');
  AWS = require('aws-sdk');
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"s3.server.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/steedos_cfs-s3/s3.server.js                                                                      //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
if (!AWS) return; // We use the official aws sdk

var validS3ServiceParamKeys = ['endpoint', 'accessKeyId', 'secretAccessKey', 'sessionToken', 'credentials', 'credentialProvider', 'region', 'maxRetries', 'maxRedirects', 'sslEnabled', 'paramValidation', 'computeChecksums', 's3ForcePathStyle', 'httpOptions', 'apiVersion', 'apiVersions', 'logger', 'signatureVersion'];
var validS3PutParamKeys = ['ACL', 'Body', 'Bucket', 'CacheControl', 'ContentDisposition', 'ContentEncoding', 'ContentLanguage', 'ContentLength', 'ContentMD5', 'ContentType', 'Expires', 'GrantFullControl', 'GrantRead', 'GrantReadACP', 'GrantWriteACP', 'Key', 'Metadata', 'ServerSideEncryption', 'StorageClass', 'WebsiteRedirectLocation'];
/**
 * @public
 * @constructor
 * @param {String} name - The store name
 * @param {Object} options
 * @param {String} options.region - Bucket region
 * @param {String} options.bucket - Bucket name
 * @param {String} [options.accessKeyId] - AWS IAM key; required if not set in environment variables
 * @param {String} [options.secretAccessKey] - AWS IAM secret; required if not set in environment variables
 * @param {String} [options.ACL='private'] - ACL for objects when putting
 * @param {String} [options.folder='/'] - Which folder (key prefix) in the bucket to use
 * @param {Function} [options.beforeSave] - Function to run before saving a file from the server. The context of the function will be the `FS.File` instance we're saving. The function may alter its properties.
 * @param {Number} [options.maxTries=5] - Max times to attempt saving a file
 * @returns {FS.StorageAdapter} An instance of FS.StorageAdapter.
 *
 * Creates an S3 store instance on the server. Inherits from FS.StorageAdapter
 * type.
 */

FS.Store.S3 = function (name, options) {
  var self = this;
  if (!(self instanceof FS.Store.S3)) throw new Error('FS.Store.S3 missing keyword "new"');
  options = options || {}; // Determine which folder (key prefix) in the bucket to use

  var folder = options.folder;

  if (typeof folder === "string" && folder.length) {
    if (folder.slice(0, 1) === "/") {
      folder = folder.slice(1);
    }

    if (folder.slice(-1) !== "/") {
      folder += "/";
    }
  } else {
    folder = "";
  }

  var bucket = options.bucket;
  if (!bucket) throw new Error('FS.Store.S3 you must specify the "bucket" option');
  var defaultAcl = options.ACL || 'private'; // Remove serviceParams from SA options
  // options = _.omit(options, validS3ServiceParamKeys);

  var serviceParams = FS.Utility.extend({
    Bucket: bucket,
    region: null,
    //required
    accessKeyId: null,
    //required
    secretAccessKey: null,
    //required
    ACL: defaultAcl
  }, options); // Whitelist serviceParams, else aws-sdk throws an error
  // XXX: I've commented this at the moment... It stopped things from working
  // we have to check up on this
  // serviceParams = _.pick(serviceParams, validS3ServiceParamKeys);
  // Create S3 service

  var S3 = new AWS.S3(serviceParams);
  return new FS.StorageAdapter(name, options, {
    typeName: 'storage.s3',
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
      return S3.createReadStream({
        Bucket: bucket,
        Key: folder + fileKey
      });
    },
    // Comment to documentation: Set options.ContentLength otherwise the
    // indirect stream will be used creating extra overhead on the filesystem.
    // An easy way if the data is not transformed is to set the
    // options.ContentLength = fileObj.size ...
    createWriteStream: function (fileKey, options) {
      options = options || {};

      if (options.contentType) {
        options.ContentType = options.contentType;
      } // We dont support array of aliases


      delete options.aliases; // We dont support contentType

      delete options.contentType; // We dont support metadata use Metadata?

      delete options.metadata; // Set options

      var options = FS.Utility.extend({
        Bucket: bucket,
        Key: folder + fileKey,
        fileKey: fileKey,
        ACL: defaultAcl
      }, options);
      return S3.createWriteStream(options);
    },
    remove: function (fileKey, callback) {
      S3.deleteObject({
        Bucket: bucket,
        Key: folder + fileKey
      }, function (error) {
        callback(error, !error);
      }); // callback(null, true);
    },
    watch: function () {
      throw new Error("S3 storage adapter does not support the sync option");
    }
  });
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"s3.upload.stream2.js":function(require){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/steedos_cfs-s3/s3.upload.stream2.js                                                              //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
if (!AWS) return;

var Writable = require('stream').Writable; // This is based on the code from
// https://github.com/nathanpeck/s3-upload-stream/blob/master/lib/s3-upload-stream.js
// But much is rewritten and adapted to cfs


AWS.S3.prototype.createReadStream = function (params, options) {
  // Simple wrapper
  return this.getObject(params).createReadStream();
}; // Extend the AWS.S3 API


AWS.S3.prototype.createWriteStream = function (params, options) {
  var self = this; //Create the writeable stream interface.

  var writeStream = Writable({
    highWaterMark: 4194304 // 4 MB

  });
  var partNumber = 1;
  var parts = [];
  var receivedSize = 0;
  var uploadedSize = 0;
  var currentChunk = Buffer(0);
  var maxChunkSize = 5242880;
  var multipartUploadID = null;
  var waitingCallback;
  var fileKey = params && (params.fileKey || params.Key); // Clean up for AWS sdk

  delete params.fileKey; // This small function stops the write stream until we have connected with
  // the s3 server

  var runWhenReady = function (callback) {
    // If we dont have a upload id we are not ready
    if (multipartUploadID === null) {
      // We set the waiting callback
      waitingCallback = callback;
    } else {
      // No problem - just continue
      callback();
    }
  }; //Handler to receive data and upload it to S3.


  writeStream._write = function (chunk, enc, next) {
    currentChunk = Buffer.concat([currentChunk, chunk]); // If the current chunk buffer is getting to large, or the stream piped in
    // has ended then flush the chunk buffer downstream to S3 via the multipart
    // upload API.

    if (currentChunk.length > maxChunkSize) {
      // Make sure we only run when the s3 upload is ready
      runWhenReady(function () {
        flushChunk(next, false);
      });
    } else {
      // We dont have to contact s3 for this
      runWhenReady(next);
    }
  }; // Overwrite the end method so that we can hijack it to flush the last part
  // and then complete the multipart upload


  var _originalEnd = writeStream.end;

  writeStream.end = function (chunk, encoding, callback) {
    // Call the super
    _originalEnd.call(this, chunk, encoding, function () {
      // Make sure we only run when the s3 upload is ready
      runWhenReady(function () {
        flushChunk(callback, true);
      });
    });
  };

  writeStream.on('error', function () {
    if (multipartUploadID) {
      if (FS.debug) {
        console.log('SA S3 - ERROR!!');
      }

      self.abortMultipartUpload({
        Bucket: params.Bucket,
        Key: params.Key,
        UploadId: multipartUploadID
      }, function (err) {
        if (err) {
          console.error('SA S3 - Could not abort multipart upload', err);
        }
      });
    }
  });

  var flushChunk = function (callback, lastChunk) {
    if (multipartUploadID === null) {
      throw new Error('Internal error multipartUploadID is null');
    } // Get the chunk data


    var uploadingChunk = Buffer(currentChunk.length);
    currentChunk.copy(uploadingChunk); // Store the current part number and then increase the counter

    var localChunkNumber = partNumber++; // We add the size of data

    receivedSize += uploadingChunk.length; // Upload the part

    self.uploadPart({
      Body: uploadingChunk,
      Bucket: params.Bucket,
      Key: params.Key,
      UploadId: multipartUploadID,
      PartNumber: localChunkNumber
    }, function (err, result) {
      // Call the next data
      if (typeof callback === 'function') {
        callback();
      }

      if (err) {
        writeStream.emit('error', err);
      } else {
        // Increase the upload size
        uploadedSize += uploadingChunk.length;
        parts[localChunkNumber - 1] = {
          ETag: result.ETag,
          PartNumber: localChunkNumber
        }; // XXX: event for debugging

        writeStream.emit('chunk', {
          ETag: result.ETag,
          PartNumber: localChunkNumber,
          receivedSize: receivedSize,
          uploadedSize: uploadedSize
        }); // The incoming stream has finished giving us all data and we have
        // finished uploading all that data to S3. So tell S3 to assemble those
        // parts we uploaded into the final product.

        if (writeStream._writableState.ended === true && uploadedSize === receivedSize && lastChunk) {
          // Complete the upload
          self.completeMultipartUpload({
            Bucket: params.Bucket,
            Key: params.Key,
            UploadId: multipartUploadID,
            MultipartUpload: {
              Parts: parts
            }
          }, function (err, result) {
            if (err) {
              writeStream.emit('error', err);
            } else {
              // Emit the cfs end event for uploads
              if (FS.debug) {
                console.log('SA S3 - DONE!!');
              }

              writeStream.emit('stored', {
                fileKey: fileKey,
                size: uploadedSize,
                storedAt: new Date()
              });
            }
          });
        }
      }
    }); // Reset the current buffer

    currentChunk = Buffer(0);
  }; //Use the S3 client to initialize a multipart upload to S3.


  self.createMultipartUpload(params, function (err, data) {
    if (err) {
      // Emit the error
      writeStream.emit('error', err);
    } else {
      // Set the upload id
      multipartUploadID = data.UploadId; // Call waiting callback

      if (typeof waitingCallback === 'function') {
        // We call the waiting callback if any now since we established a
        // connection to the s3
        waitingCallback();
      }
    }
  }); // We return the write stream

  return writeStream;
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/steedos:cfs-s3/checkNpm.js");
require("/node_modules/meteor/steedos:cfs-s3/s3.server.js");
require("/node_modules/meteor/steedos:cfs-s3/s3.upload.stream2.js");

/* Exports */
Package._define("steedos:cfs-s3");

})();

//# sourceURL=meteor://💻app/packages/steedos_cfs-s3.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpjZnMtczMvY2hlY2tOcG0uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3M6Y2ZzLXMzL3MzLnNlcnZlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpjZnMtczMvczMudXBsb2FkLnN0cmVhbTIuanMiXSwibmFtZXMiOlsiY2hlY2tOcG1WZXJzaW9ucyIsIm1vZHVsZSIsImxpbmsiLCJ2IiwiTWV0ZW9yIiwic2V0dGluZ3MiLCJjZnMiLCJhd3MiLCJBV1MiLCJyZXF1aXJlIiwidmFsaWRTM1NlcnZpY2VQYXJhbUtleXMiLCJ2YWxpZFMzUHV0UGFyYW1LZXlzIiwiRlMiLCJTdG9yZSIsIlMzIiwibmFtZSIsIm9wdGlvbnMiLCJzZWxmIiwiRXJyb3IiLCJmb2xkZXIiLCJsZW5ndGgiLCJzbGljZSIsImJ1Y2tldCIsImRlZmF1bHRBY2wiLCJBQ0wiLCJzZXJ2aWNlUGFyYW1zIiwiVXRpbGl0eSIsImV4dGVuZCIsIkJ1Y2tldCIsInJlZ2lvbiIsImFjY2Vzc0tleUlkIiwic2VjcmV0QWNjZXNzS2V5IiwiU3RvcmFnZUFkYXB0ZXIiLCJ0eXBlTmFtZSIsImZpbGVLZXkiLCJmaWxlT2JqIiwiaW5mbyIsIl9nZXRJbmZvIiwia2V5IiwiZmlsZW5hbWUiLCJmaWxlbmFtZUluU3RvcmUiLCJzdG9yZSIsImNvbGxlY3Rpb25OYW1lIiwiX2lkIiwiY3JlYXRlUmVhZFN0cmVhbSIsIktleSIsImNyZWF0ZVdyaXRlU3RyZWFtIiwiY29udGVudFR5cGUiLCJDb250ZW50VHlwZSIsImFsaWFzZXMiLCJtZXRhZGF0YSIsInJlbW92ZSIsImNhbGxiYWNrIiwiZGVsZXRlT2JqZWN0IiwiZXJyb3IiLCJ3YXRjaCIsIldyaXRhYmxlIiwicHJvdG90eXBlIiwicGFyYW1zIiwiZ2V0T2JqZWN0Iiwid3JpdGVTdHJlYW0iLCJoaWdoV2F0ZXJNYXJrIiwicGFydE51bWJlciIsInBhcnRzIiwicmVjZWl2ZWRTaXplIiwidXBsb2FkZWRTaXplIiwiY3VycmVudENodW5rIiwiQnVmZmVyIiwibWF4Q2h1bmtTaXplIiwibXVsdGlwYXJ0VXBsb2FkSUQiLCJ3YWl0aW5nQ2FsbGJhY2siLCJydW5XaGVuUmVhZHkiLCJfd3JpdGUiLCJjaHVuayIsImVuYyIsIm5leHQiLCJjb25jYXQiLCJmbHVzaENodW5rIiwiX29yaWdpbmFsRW5kIiwiZW5kIiwiZW5jb2RpbmciLCJjYWxsIiwib24iLCJkZWJ1ZyIsImNvbnNvbGUiLCJsb2ciLCJhYm9ydE11bHRpcGFydFVwbG9hZCIsIlVwbG9hZElkIiwiZXJyIiwibGFzdENodW5rIiwidXBsb2FkaW5nQ2h1bmsiLCJjb3B5IiwibG9jYWxDaHVua051bWJlciIsInVwbG9hZFBhcnQiLCJCb2R5IiwiUGFydE51bWJlciIsInJlc3VsdCIsImVtaXQiLCJFVGFnIiwiX3dyaXRhYmxlU3RhdGUiLCJlbmRlZCIsImNvbXBsZXRlTXVsdGlwYXJ0VXBsb2FkIiwiTXVsdGlwYXJ0VXBsb2FkIiwiUGFydHMiLCJzaXplIiwic3RvcmVkQXQiLCJEYXRlIiwiY3JlYXRlTXVsdGlwYXJ0VXBsb2FkIiwiZGF0YSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxnQkFBSjtBQUFxQkMsTUFBTSxDQUFDQyxJQUFQLENBQVksb0NBQVosRUFBaUQ7QUFBQ0Ysa0JBQWdCLENBQUNHLENBQUQsRUFBRztBQUFDSCxvQkFBZ0IsR0FBQ0csQ0FBakI7QUFBbUI7O0FBQXhDLENBQWpELEVBQTJGLENBQTNGOztBQUlyQixJQUFJQyxNQUFNLENBQUNDLFFBQVAsSUFBbUJELE1BQU0sQ0FBQ0MsUUFBUCxDQUFnQkMsR0FBbkMsSUFBMENGLE1BQU0sQ0FBQ0MsUUFBUCxDQUFnQkMsR0FBaEIsQ0FBb0JDLEdBQWxFLEVBQXVFO0FBQ3JFUCxrQkFBZ0IsQ0FBQztBQUNmLGVBQVc7QUFESSxHQUFELEVBRWIsZ0JBRmEsQ0FBaEI7QUFJQVEsS0FBRyxHQUFH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QUFDRjtBQUNGLEtBN0RELEVBaEI4QyxDQStFOUM7O0FBQ0F4QyxnQkFBWSxHQUFHQyxNQUFNLENBQUMsQ0FBRCxDQUFyQjtBQUNELEdBakZELENBOUU2RCxDQWlLN0Q7OztBQUNBbEQsTUFBSSxDQUFDMEYscUJBQUwsQ0FBNEJqRCxNQUE1QixFQUFvQyxVQUFVOEIsR0FBVixFQUFlb0IsSUFBZixFQUFxQjtBQUN2RCxRQUFHcEIsR0FBSCxFQUFRO0FBQ047QUFDQTVCLGlCQUFXLENBQUNxQyxJQUFaLENBQWlCLE9BQWpCLEVBQTBCVCxHQUExQjtBQUNELEtBSEQsTUFHTztBQUNMO0FBQ0FuQix1QkFBaUIsR0FBR3VDLElBQUksQ0FBQ3JCLFFBQXpCLENBRkssQ0FJTDs7QUFDQSxVQUFJLE9BQU9qQixlQUFQLEtBQTJCLFVBQS9CLEVBQTJDO0FBQ3pDO0FBQ0E7QUFDQUEsdUJBQWU7QUFDaEI7QUFFRjtBQUNGLEdBaEJELEVBbEs2RCxDQW9MN0Q7O0FBQ0EsU0FBT1YsV0FBUDtBQUNELENBdExELEMiLCJmaWxlIjoiL3BhY2thZ2VzL3N0ZWVkb3NfY2ZzLXMzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcclxuICBjaGVja05wbVZlcnNpb25zXHJcbn0gZnJvbSAnbWV0ZW9yL3RtZWFzZGF5OmNoZWNrLW5wbS12ZXJzaW9ucyc7XHJcblxyXG5pZiAoTWV0ZW9yLnNldHRpbmdzICYmIE1ldGVvci5zZXR0aW5ncy5jZnMgJiYgTWV0ZW9yLnNldHRpbmdzLmNmcy5hd3MpIHtcclxuICBjaGVja05wbVZlcnNpb25zKHtcclxuICAgICdhd3Mtc2RrJzogXCJeMi4wLjIzXCJcclxuICB9LCAnc3RlZWRvczpjZnMtczMnKTtcclxuXHJcbiAgQVdTID0gcmVxdWlyZSgnYXdzLXNkaycpO1xyXG59XHJcbiIsImlmICghQVdTKVxyXG4gIHJldHVybjtcclxuXHJcbi8vIFdlIHVzZSB0aGUgb2ZmaWNpYWwgYXdzIHNka1xyXG5cclxuXHJcbnZhciB2YWxpZFMzU2VydmljZVBhcmFtS2V5cyA9IFtcclxuICAnZW5kcG9pbnQnLFxyXG4gICdhY2Nlc3NLZXlJZCcsXHJcbiAgJ3NlY3JldEFjY2Vzc0tleScsXHJcbiAgJ3Nlc3Npb25Ub2tlbicsXHJcbiAgJ2NyZWRlbnRpYWxzJyxcclxuICAnY3JlZGVudGlhbFByb3ZpZGVyJyxcclxuICAncmVnaW9uJyxcclxuICAnbWF4UmV0cmllcycsXHJcbiAgJ21heFJlZGlyZWN0cycsXHJcbiAgJ3NzbEVuYWJsZWQnLFxyXG4gICdwYXJhbVZhbGlkYXRpb24nLFxyXG4gICdjb21wdXRlQ2hlY2tzdW1zJyxcclxuICAnczNGb3JjZVBhdGhTdHlsZScsXHJcbiAgJ2h0dHBPcHRpb25zJyxcclxuICAnYXBpVmVyc2lvbicsXHJcbiAgJ2FwaVZlcnNpb25zJyxcclxuICAnbG9nZ2VyJyxcclxuICAnc2lnbmF0dXJlVmVyc2lvbidcclxuXTtcclxudmFyIHZhbGlkUzNQdXRQYXJhbUtleXMgPSBbXHJcbiAgJ0FDTCcsXHJcbiAgJ0JvZHknLFxyXG4gICdCdWNrZXQnLFxyXG4gICdDYWNoZUNvbnRyb2wnLFxyXG4gICdDb250ZW50RGlzcG9zaXRpb24nLFxyXG4gICdDb250ZW50RW5jb2RpbmcnLFxyXG4gICdDb250ZW50TGFuZ3VhZ2UnLFxyXG4gICdDb250ZW50TGVuZ3RoJyxcclxuICAnQ29udGVudE1ENScsXHJcbiAgJ0NvbnRlbnRUeXBlJyxcclxuICAnRXhwaXJlcycsXHJcbiAgJ0dyYW50RnVsbENvbnRyb2wnLFxyXG4gICdHcmFudFJlYWQnLFxyXG4gICdHcmFudFJlYWRBQ1AnLFxyXG4gICdHcmFudFdyaXRlQUNQJyxcclxuICAnS2V5JyxcclxuICAnTWV0YWRhdGEnLFxyXG4gICdTZXJ2ZXJTaWRlRW5jcnlwdGlvbicsXHJcbiAgJ1N0b3JhZ2VDbGFzcycsXHJcbiAgJ1dlYnNpdGVSZWRpcmVjdExvY2F0aW9uJ1xyXG5dO1xyXG5cclxuLyoqXHJcbiAqIEBwdWJsaWNcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIC0gVGhlIHN0b3JlIG5hbWVcclxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcclxuICogQHBhcmFtIHtTdHJpbmd9IG9wdGlvbnMucmVnaW9uIC0gQnVja2V0IHJlZ2lvblxyXG4gKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5idWNrZXQgLSBCdWNrZXQgbmFtZVxyXG4gKiBAcGFyYW0ge1N0cmluZ30gW29wdGlvbnMuYWNjZXNzS2V5SWRdIC0gQVdTIElBTSBrZXk7IHJlcXVpcmVkIGlmIG5vdCBzZXQgaW4gZW52aXJvbm1lbnQgdmFyaWFibGVzXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBbb3B0aW9ucy5zZWNyZXRBY2Nlc3NLZXldIC0gQVdTIElBTSBzZWNyZXQ7IHJlcXVpcmVkIGlmIG5vdCBzZXQgaW4gZW52aXJvbm1lbnQgdmFyaWFibGVzXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBbb3B0aW9ucy5BQ0w9J3ByaXZhdGUnXSAtIEFDTCBmb3Igb2JqZWN0cyB3aGVuIHB1dHRpbmdcclxuICogQHBhcmFtIHtTdHJpbmd9IFtvcHRpb25zLmZvbGRlcj0nLyddIC0gV2hpY2ggZm9sZGVyIChrZXkgcHJlZml4KSBpbiB0aGUgYnVja2V0IHRvIHVzZVxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbb3B0aW9ucy5iZWZvcmVTYXZlXSAtIEZ1bmN0aW9uIHRvIHJ1biBiZWZvcmUgc2F2aW5nIGEgZmlsZSBmcm9tIHRoZSBzZXJ2ZXIuIFRoZSBjb250ZXh0IG9mIHRoZSBmdW5jdGlvbiB3aWxsIGJlIHRoZSBgRlMuRmlsZWAgaW5zdGFuY2Ugd2UncmUgc2F2aW5nLiBUaGUgZnVuY3Rpb24gbWF5IGFsdGVyIGl0cyBwcm9wZXJ0aWVzLlxyXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMubWF4VHJpZXM9NV0gLSBNYXggdGltZXMgdG8gYXR0ZW1wdCBzYXZpbmcgYSBmaWxlXHJcbiAqIEByZXR1cm5zIHtGUy5TdG9yYWdlQWRhcHRlcn0gQW4gaW5zdGFuY2Ugb2YgRlMuU3RvcmFnZUFkYXB0ZXIuXHJcbiAqXHJcbiAqIENyZWF0ZXMgYW4gUzMgc3RvcmUgaW5zdGFuY2Ugb24gdGhlIHNlcnZlci4gSW5oZXJpdHMgZnJvbSBGUy5TdG9yYWdlQWRhcHRlclxyXG4gKiB0eXBlLlxyXG4gKi9cclxuRlMuU3RvcmUuUzMgPSBmdW5jdGlvbihuYW1lLCBvcHRpb25zKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIGlmICghKHNlbGYgaW5zdGFuY2VvZiBGUy5TdG9yZS5TMykpXHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZTLlN0b3JlLlMzIG1pc3Npbmcga2V5d29yZCBcIm5ld1wiJyk7XHJcblxyXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAvLyBEZXRlcm1pbmUgd2hpY2ggZm9sZGVyIChrZXkgcHJlZml4KSBpbiB0aGUgYnVja2V0IHRvIHVzZVxyXG4gIHZhciBmb2xkZXIgPSBvcHRpb25zLmZvbGRlcjtcclxuICBpZiAodHlwZW9mIGZvbGRlciA9PT0gXCJzdHJpbmdcIiAmJiBmb2xkZXIubGVuZ3RoKSB7XHJcbiAgICBpZiAoZm9sZGVyLnNsaWNlKDAsIDEpID09PSBcIi9cIikge1xyXG4gICAgICBmb2xkZXIgPSBmb2xkZXIuc2xpY2UoMSk7XHJcbiAgICB9XHJcbiAgICBpZiAoZm9sZGVyLnNsaWNlKC0xKSAhPT0gXCIvXCIpIHtcclxuICAgICAgZm9sZGVyICs9IFwiL1wiO1xyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICBmb2xkZXIgPSBcIlwiO1xyXG4gIH1cclxuXHJcbiAgdmFyIGJ1Y2tldCA9IG9wdGlvbnMuYnVja2V0O1xyXG4gIGlmICghYnVja2V0KVxyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdGUy5TdG9yZS5TMyB5b3UgbXVzdCBzcGVjaWZ5IHRoZSBcImJ1Y2tldFwiIG9wdGlvbicpO1xyXG5cclxuICB2YXIgZGVmYXVsdEFjbCA9IG9wdGlvbnMuQUNMIHx8ICdwcml2YXRlJztcclxuXHJcbiAgLy8gUmVtb3ZlIHNlcnZpY2VQYXJhbXMgZnJvbSBTQSBvcHRpb25zXHJcbiAgLy8gb3B0aW9ucyA9IF8ub21pdChvcHRpb25zLCB2YWxpZFMzU2VydmljZVBhcmFtS2V5cyk7XHJcblxyXG4gIHZhciBzZXJ2aWNlUGFyYW1zID0gRlMuVXRpbGl0eS5leHRlbmQoe1xyXG4gICAgQnVja2V0OiBidWNrZXQsXHJcbiAgICByZWdpb246IG51bGwsIC8vcmVxdWlyZWRcclxuICAgIGFjY2Vzc0tleUlkOiBudWxsLCAvL3JlcXVpcmVkXHJcbiAgICBzZWNyZXRBY2Nlc3NLZXk6IG51bGwsIC8vcmVxdWlyZWRcclxuICAgIEFDTDogZGVmYXVsdEFjbFxyXG4gIH0sIG9wdGlvbnMpO1xyXG5cclxuICAvLyBXaGl0ZWxpc3Qgc2VydmljZVBhcmFtcywgZWxzZSBhd3Mtc2RrIHRocm93cyBhbiBlcnJvclxyXG4gIC8vIFhYWDogSSd2ZSBjb21tZW50ZWQgdGhpcyBhdCB0aGUgbW9tZW50Li4uIEl0IHN0b3BwZWQgdGhpbmdzIGZyb20gd29ya2luZ1xyXG4gIC8vIHdlIGhhdmUgdG8gY2hlY2sgdXAgb24gdGhpc1xyXG4gIC8vIHNlcnZpY2VQYXJhbXMgPSBfLnBpY2soc2VydmljZVBhcmFtcywgdmFsaWRTM1NlcnZpY2VQYXJhbUtleXMpO1xyXG5cclxuICAvLyBDcmVhdGUgUzMgc2VydmljZVxyXG4gIHZhciBTMyA9IG5ldyBBV1MuUzMoc2VydmljZVBhcmFtcyk7XHJcblxyXG4gIHJldHVybiBuZXcgRlMuU3RvcmFnZUFkYXB0ZXIobmFtZSwgb3B0aW9ucywge1xyXG4gICAgdHlwZU5hbWU6ICdzdG9yYWdlLnMzJyxcclxuICAgIGZpbGVLZXk6IGZ1bmN0aW9uKGZpbGVPYmopIHtcclxuICAgICAgLy8gTG9va3VwIHRoZSBjb3B5XHJcbiAgICAgIHZhciBpbmZvID0gZmlsZU9iaiAmJiBmaWxlT2JqLl9nZXRJbmZvKG5hbWUpO1xyXG4gICAgICAvLyBJZiB0aGUgc3RvcmUgYW5kIGtleSBpcyBmb3VuZCByZXR1cm4gdGhlIGtleVxyXG4gICAgICBpZiAoaW5mbyAmJiBpbmZvLmtleSkgcmV0dXJuIGluZm8ua2V5O1xyXG5cclxuICAgICAgdmFyIGZpbGVuYW1lID0gZmlsZU9iai5uYW1lKCk7XHJcbiAgICAgIHZhciBmaWxlbmFtZUluU3RvcmUgPSBmaWxlT2JqLm5hbWUoe1xyXG4gICAgICAgIHN0b3JlOiBuYW1lXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgLy8gSWYgbm8gc3RvcmUga2V5IGZvdW5kIHdlIHJlc29sdmUgLyBnZW5lcmF0ZSBhIGtleVxyXG4gICAgICByZXR1cm4gZmlsZU9iai5jb2xsZWN0aW9uTmFtZSArICcvJyArIGZpbGVPYmouY29sbGVjdGlvbk5hbWUgKyBcIi1cIiArIGZpbGVPYmouX2lkICsgJy0nICsgKGZpbGVuYW1lSW5TdG9yZSB8fCBmaWxlbmFtZSk7XHJcbiAgICB9LFxyXG4gICAgY3JlYXRlUmVhZFN0cmVhbTogZnVuY3Rpb24oZmlsZUtleSwgb3B0aW9ucykge1xyXG5cclxuICAgICAgcmV0dXJuIFMzLmNyZWF0ZVJlYWRTdHJlYW0oe1xyXG4gICAgICAgIEJ1Y2tldDogYnVja2V0LFxyXG4gICAgICAgIEtleTogZm9sZGVyICsgZmlsZUtleVxyXG4gICAgICB9KTtcclxuXHJcbiAgICB9LFxyXG4gICAgLy8gQ29tbWVudCB0byBkb2N1bWVudGF0aW9uOiBTZXQgb3B0aW9ucy5Db250ZW50TGVuZ3RoIG90aGVyd2lzZSB0aGVcclxuICAgIC8vIGluZGlyZWN0IHN0cmVhbSB3aWxsIGJlIHVzZWQgY3JlYXRpbmcgZXh0cmEgb3ZlcmhlYWQgb24gdGhlIGZpbGVzeXN0ZW0uXHJcbiAgICAvLyBBbiBlYXN5IHdheSBpZiB0aGUgZGF0YSBpcyBub3QgdHJhbnNmb3JtZWQgaXMgdG8gc2V0IHRoZVxyXG4gICAgLy8gb3B0aW9ucy5Db250ZW50TGVuZ3RoID0gZmlsZU9iai5zaXplIC4uLlxyXG4gICAgY3JlYXRlV3JpdGVTdHJlYW06IGZ1bmN0aW9uKGZpbGVLZXksIG9wdGlvbnMpIHtcclxuICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgICBpZiAob3B0aW9ucy5jb250ZW50VHlwZSkge1xyXG4gICAgICAgIG9wdGlvbnMuQ29udGVudFR5cGUgPSBvcHRpb25zLmNvbnRlbnRUeXBlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBXZSBkb250IHN1cHBvcnQgYXJyYXkgb2YgYWxpYXNlc1xyXG4gICAgICBkZWxldGUgb3B0aW9ucy5hbGlhc2VzO1xyXG4gICAgICAvLyBXZSBkb250IHN1cHBvcnQgY29udGVudFR5cGVcclxuICAgICAgZGVsZXRlIG9wdGlvbnMuY29udGVudFR5cGU7XHJcbiAgICAgIC8vIFdlIGRvbnQgc3VwcG9ydCBtZXRhZGF0YSB1c2UgTWV0YWRhdGE/XHJcbiAgICAgIGRlbGV0ZSBvcHRpb25zLm1ldGFkYXRhO1xyXG5cclxuICAgICAgLy8gU2V0IG9wdGlvbnNcclxuICAgICAgdmFyIG9wdGlvbnMgPSBGUy5VdGlsaXR5LmV4dGVuZCh7XHJcbiAgICAgICAgQnVja2V0OiBidWNrZXQsXHJcbiAgICAgICAgS2V5OiBmb2xkZXIgKyBmaWxlS2V5LFxyXG4gICAgICAgIGZpbGVLZXk6IGZpbGVLZXksXHJcbiAgICAgICAgQUNMOiBkZWZhdWx0QWNsXHJcbiAgICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgICAgcmV0dXJuIFMzLmNyZWF0ZVdyaXRlU3RyZWFtKG9wdGlvbnMpO1xyXG4gICAgfSxcclxuICAgIHJlbW92ZTogZnVuY3Rpb24oZmlsZUtleSwgY2FsbGJhY2spIHtcclxuXHJcbiAgICAgIFMzLmRlbGV0ZU9iamVjdCh7XHJcbiAgICAgICAgQnVja2V0OiBidWNrZXQsXHJcbiAgICAgICAgS2V5OiBmb2xkZXIgKyBmaWxlS2V5XHJcbiAgICAgIH0sIGZ1bmN0aW9uKGVycm9yKSB7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsICFlcnJvcik7XHJcbiAgICAgIH0pO1xyXG4gICAgICAvLyBjYWxsYmFjayhudWxsLCB0cnVlKTtcclxuICAgIH0sXHJcbiAgICB3YXRjaDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlMzIHN0b3JhZ2UgYWRhcHRlciBkb2VzIG5vdCBzdXBwb3J0IHRoZSBzeW5jIG9wdGlvblwiKTtcclxuICAgIH1cclxuICB9KTtcclxufTsiLCJpZiAoIUFXUylcclxuICByZXR1cm47XHJcblxyXG52YXIgV3JpdGFibGUgPSByZXF1aXJlKCdzdHJlYW0nKS5Xcml0YWJsZTtcclxuXHJcbi8vIFRoaXMgaXMgYmFzZWQgb24gdGhlIGNvZGUgZnJvbVxyXG4vLyBodHRwczovL2dpdGh1Yi5jb20vbmF0aGFucGVjay9zMy11cGxvYWQtc3RyZWFtL2Jsb2IvbWFzdGVyL2xpYi9zMy11cGxvYWQtc3RyZWFtLmpzXHJcbi8vIEJ1dCBtdWNoIGlzIHJld3JpdHRlbiBhbmQgYWRhcHRlZCB0byBjZnNcclxuXHJcbkFXUy5TMy5wcm90b3R5cGUuY3JlYXRlUmVhZFN0cmVhbSA9IGZ1bmN0aW9uKHBhcmFtcywgb3B0aW9ucykge1xyXG4gIC8vIFNpbXBsZSB3cmFwcGVyXHJcbiAgcmV0dXJuIHRoaXMuZ2V0T2JqZWN0KHBhcmFtcykuY3JlYXRlUmVhZFN0cmVhbSgpO1xyXG59O1xyXG5cclxuLy8gRXh0ZW5kIHRoZSBBV1MuUzMgQVBJXHJcbkFXUy5TMy5wcm90b3R5cGUuY3JlYXRlV3JpdGVTdHJlYW0gPSBmdW5jdGlvbihwYXJhbXMsIG9wdGlvbnMpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gIC8vQ3JlYXRlIHRoZSB3cml0ZWFibGUgc3RyZWFtIGludGVyZmFjZS5cclxuICB2YXIgd3JpdGVTdHJlYW0gPSBXcml0YWJsZSh7XHJcbiAgICBoaWdoV2F0ZXJNYXJrOiA0MTk0MzA0IC8vIDQgTUJcclxuICB9KTtcclxuXHJcbiAgdmFyIHBhcnROdW1iZXIgPSAxO1xyXG4gIHZhciBwYXJ0cyA9IFtdO1xyXG4gIHZhciByZWNlaXZlZFNpemUgPSAwO1xyXG4gIHZhciB1cGxvYWRlZFNpemUgPSAwO1xyXG4gIHZhciBjdXJyZW50Q2h1bmsgPSBCdWZmZXIoMCk7XHJcbiAgdmFyIG1heENodW5rU2l6ZSA9IDUyNDI4ODA7XHJcbiAgdmFyIG11bHRpcGFydFVwbG9hZElEID0gbnVsbDtcclxuICB2YXIgd2FpdGluZ0NhbGxiYWNrO1xyXG4gIHZhciBmaWxlS2V5ID0gcGFyYW1zICYmIChwYXJhbXMuZmlsZUtleSB8fCBwYXJhbXMuS2V5KTtcclxuXHJcbiAgLy8gQ2xlYW4gdXAgZm9yIEFXUyBzZGtcclxuICBkZWxldGUgcGFyYW1zLmZpbGVLZXk7XHJcblxyXG4gIC8vIFRoaXMgc21hbGwgZnVuY3Rpb24gc3RvcHMgdGhlIHdyaXRlIHN0cmVhbSB1bnRpbCB3ZSBoYXZlIGNvbm5lY3RlZCB3aXRoXHJcbiAgLy8gdGhlIHMzIHNlcnZlclxyXG4gIHZhciBydW5XaGVuUmVhZHkgPSBmdW5jdGlvbihjYWxsYmFjaykge1xyXG4gICAgLy8gSWYgd2UgZG9udCBoYXZlIGEgdXBsb2FkIGlkIHdlIGFyZSBub3QgcmVhZHlcclxuICAgIGlmIChtdWx0aXBhcnRVcGxvYWRJRCA9PT0gbnVsbCkge1xyXG4gICAgICAvLyBXZSBzZXQgdGhlIHdhaXRpbmcgY2FsbGJhY2tcclxuICAgICAgd2FpdGluZ0NhbGxiYWNrID0gY2FsbGJhY2s7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBObyBwcm9ibGVtIC0ganVzdCBjb250aW51ZVxyXG4gICAgICBjYWxsYmFjaygpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8vSGFuZGxlciB0byByZWNlaXZlIGRhdGEgYW5kIHVwbG9hZCBpdCB0byBTMy5cclxuICB3cml0ZVN0cmVhbS5fd3JpdGUgPSBmdW5jdGlvbiAoY2h1bmssIGVuYywgbmV4dCkge1xyXG4gICAgY3VycmVudENodW5rID0gQnVmZmVyLmNvbmNhdChbY3VycmVudENodW5rLCBjaHVua10pO1xyXG5cclxuICAgIC8vIElmIHRoZSBjdXJyZW50IGNodW5rIGJ1ZmZlciBpcyBnZXR0aW5nIHRvIGxhcmdlLCBvciB0aGUgc3RyZWFtIHBpcGVkIGluXHJcbiAgICAvLyBoYXMgZW5kZWQgdGhlbiBmbHVzaCB0aGUgY2h1bmsgYnVmZmVyIGRvd25zdHJlYW0gdG8gUzMgdmlhIHRoZSBtdWx0aXBhcnRcclxuICAgIC8vIHVwbG9hZCBBUEkuXHJcbiAgICBpZihjdXJyZW50Q2h1bmsubGVuZ3RoID4gbWF4Q2h1bmtTaXplKSB7XHJcbiAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBvbmx5IHJ1biB3aGVuIHRoZSBzMyB1cGxvYWQgaXMgcmVhZHlcclxuICAgICAgcnVuV2hlblJlYWR5KGZ1bmN0aW9uKCkgeyBmbHVzaENodW5rKG5leHQsIGZhbHNlKTsgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBXZSBkb250IGhhdmUgdG8gY29udGFjdCBzMyBmb3IgdGhpc1xyXG4gICAgICBydW5XaGVuUmVhZHkobmV4dCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLy8gT3ZlcndyaXRlIHRoZSBlbmQgbWV0aG9kIHNvIHRoYXQgd2UgY2FuIGhpamFjayBpdCB0byBmbHVzaCB0aGUgbGFzdCBwYXJ0XHJcbiAgLy8gYW5kIHRoZW4gY29tcGxldGUgdGhlIG11bHRpcGFydCB1cGxvYWRcclxuICB2YXIgX29yaWdpbmFsRW5kID0gd3JpdGVTdHJlYW0uZW5kO1xyXG4gIHdyaXRlU3RyZWFtLmVuZCA9IGZ1bmN0aW9uIChjaHVuaywgZW5jb2RpbmcsIGNhbGxiYWNrKSB7XHJcbiAgICAvLyBDYWxsIHRoZSBzdXBlclxyXG4gICAgX29yaWdpbmFsRW5kLmNhbGwodGhpcywgY2h1bmssIGVuY29kaW5nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBvbmx5IHJ1biB3aGVuIHRoZSBzMyB1cGxvYWQgaXMgcmVhZHlcclxuICAgICAgcnVuV2hlblJlYWR5KGZ1bmN0aW9uKCkgeyBmbHVzaENodW5rKGNhbGxiYWNrLCB0cnVlKTsgfSk7XHJcbiAgICB9KTtcclxuICB9O1xyXG5cclxuICB3cml0ZVN0cmVhbS5vbignZXJyb3InLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAobXVsdGlwYXJ0VXBsb2FkSUQpIHtcclxuICAgICAgaWYgKEZTLmRlYnVnKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1NBIFMzIC0gRVJST1IhIScpO1xyXG4gICAgICB9XHJcbiAgICAgIHNlbGYuYWJvcnRNdWx0aXBhcnRVcGxvYWQoe1xyXG4gICAgICAgIEJ1Y2tldDogcGFyYW1zLkJ1Y2tldCxcclxuICAgICAgICBLZXk6IHBhcmFtcy5LZXksXHJcbiAgICAgICAgVXBsb2FkSWQ6IG11bHRpcGFydFVwbG9hZElEXHJcbiAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICBpZihlcnIpIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1NBIFMzIC0gQ291bGQgbm90IGFib3J0IG11bHRpcGFydCB1cGxvYWQnLCBlcnIpXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgdmFyIGZsdXNoQ2h1bmsgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIGxhc3RDaHVuaykge1xyXG4gICAgaWYgKG11bHRpcGFydFVwbG9hZElEID09PSBudWxsKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW50ZXJuYWwgZXJyb3IgbXVsdGlwYXJ0VXBsb2FkSUQgaXMgbnVsbCcpO1xyXG4gICAgfVxyXG4gICAgLy8gR2V0IHRoZSBjaHVuayBkYXRhXHJcbiAgICB2YXIgdXBsb2FkaW5nQ2h1bmsgPSBCdWZmZXIoY3VycmVudENodW5rLmxlbmd0aCk7XHJcbiAgICBjdXJyZW50Q2h1bmsuY29weSh1cGxvYWRpbmdDaHVuayk7XHJcblxyXG5cclxuICAgIC8vIFN0b3JlIHRoZSBjdXJyZW50IHBhcnQgbnVtYmVyIGFuZCB0aGVuIGluY3JlYXNlIHRoZSBjb3VudGVyXHJcbiAgICB2YXIgbG9jYWxDaHVua051bWJlciA9IHBhcnROdW1iZXIrKztcclxuXHJcbiAgICAvLyBXZSBhZGQgdGhlIHNpemUgb2YgZGF0YVxyXG4gICAgcmVjZWl2ZWRTaXplICs9IHVwbG9hZGluZ0NodW5rLmxlbmd0aDtcclxuXHJcbiAgICAvLyBVcGxvYWQgdGhlIHBhcnRcclxuICAgIHNlbGYudXBsb2FkUGFydCh7XHJcbiAgICAgIEJvZHk6IHVwbG9hZGluZ0NodW5rLFxyXG4gICAgICBCdWNrZXQ6IHBhcmFtcy5CdWNrZXQsXHJcbiAgICAgIEtleTogcGFyYW1zLktleSxcclxuICAgICAgVXBsb2FkSWQ6IG11bHRpcGFydFVwbG9hZElELFxyXG4gICAgICBQYXJ0TnVtYmVyOiBsb2NhbENodW5rTnVtYmVyXHJcbiAgICB9LCBmdW5jdGlvbiAoZXJyLCByZXN1bHQpIHtcclxuICAgICAgLy8gQ2FsbCB0aGUgbmV4dCBkYXRhXHJcbiAgICAgIGlmKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmKGVycikge1xyXG4gICAgICAgIHdyaXRlU3RyZWFtLmVtaXQoJ2Vycm9yJywgZXJyKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBJbmNyZWFzZSB0aGUgdXBsb2FkIHNpemVcclxuICAgICAgICB1cGxvYWRlZFNpemUgKz0gdXBsb2FkaW5nQ2h1bmsubGVuZ3RoO1xyXG4gICAgICAgIHBhcnRzW2xvY2FsQ2h1bmtOdW1iZXItMV0gPSB7XHJcbiAgICAgICAgICBFVGFnOiByZXN1bHQuRVRhZyxcclxuICAgICAgICAgIFBhcnROdW1iZXI6IGxvY2FsQ2h1bmtOdW1iZXJcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBYWFg6IGV2ZW50IGZvciBkZWJ1Z2dpbmdcclxuICAgICAgICB3cml0ZVN0cmVhbS5lbWl0KCdjaHVuaycsIHtcclxuICAgICAgICAgIEVUYWc6IHJlc3VsdC5FVGFnLFxyXG4gICAgICAgICAgUGFydE51bWJlcjogbG9jYWxDaHVua051bWJlcixcclxuICAgICAgICAgIHJlY2VpdmVkU2l6ZTogcmVjZWl2ZWRTaXplLFxyXG4gICAgICAgICAgdXBsb2FkZWRTaXplOiB1cGxvYWRlZFNpemVcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVGhlIGluY29taW5nIHN0cmVhbSBoYXMgZmluaXNoZWQgZ2l2aW5nIHVzIGFsbCBkYXRhIGFuZCB3ZSBoYXZlXHJcbiAgICAgICAgLy8gZmluaXNoZWQgdXBsb2FkaW5nIGFsbCB0aGF0IGRhdGEgdG8gUzMuIFNvIHRlbGwgUzMgdG8gYXNzZW1ibGUgdGhvc2VcclxuICAgICAgICAvLyBwYXJ0cyB3ZSB1cGxvYWRlZCBpbnRvIHRoZSBmaW5hbCBwcm9kdWN0LlxyXG4gICAgICAgIGlmKHdyaXRlU3RyZWFtLl93cml0YWJsZVN0YXRlLmVuZGVkID09PSB0cnVlICYmXHJcbiAgICAgICAgICAgICAgICB1cGxvYWRlZFNpemUgPT09IHJlY2VpdmVkU2l6ZSAmJiBsYXN0Q2h1bmspIHtcclxuICAgICAgICAgIC8vIENvbXBsZXRlIHRoZSB1cGxvYWRcclxuICAgICAgICAgIHNlbGYuY29tcGxldGVNdWx0aXBhcnRVcGxvYWQoe1xyXG4gICAgICAgICAgICBCdWNrZXQ6IHBhcmFtcy5CdWNrZXQsXHJcbiAgICAgICAgICAgIEtleTogcGFyYW1zLktleSxcclxuICAgICAgICAgICAgVXBsb2FkSWQ6IG11bHRpcGFydFVwbG9hZElELFxyXG4gICAgICAgICAgICBNdWx0aXBhcnRVcGxvYWQ6IHtcclxuICAgICAgICAgICAgICBQYXJ0czogcGFydHNcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSwgZnVuY3Rpb24gKGVyciwgcmVzdWx0KSB7XHJcbiAgICAgICAgICAgIGlmKGVycikge1xyXG4gICAgICAgICAgICAgIHdyaXRlU3RyZWFtLmVtaXQoJ2Vycm9yJywgZXJyKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAvLyBFbWl0IHRoZSBjZnMgZW5kIGV2ZW50IGZvciB1cGxvYWRzXHJcbiAgICAgICAgICAgICAgaWYgKEZTLmRlYnVnKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnU0EgUzMgLSBET05FISEnKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgd3JpdGVTdHJlYW0uZW1pdCgnc3RvcmVkJywge1xyXG4gICAgICAgICAgICAgICAgZmlsZUtleTogZmlsZUtleSxcclxuICAgICAgICAgICAgICAgIHNpemU6IHVwbG9hZGVkU2l6ZSxcclxuICAgICAgICAgICAgICAgIHN0b3JlZEF0OiBuZXcgRGF0ZSgpXHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFJlc2V0IHRoZSBjdXJyZW50IGJ1ZmZlclxyXG4gICAgY3VycmVudENodW5rID0gQnVmZmVyKDApO1xyXG4gIH07XHJcblxyXG4gIC8vVXNlIHRoZSBTMyBjbGllbnQgdG8gaW5pdGlhbGl6ZSBhIG11bHRpcGFydCB1cGxvYWQgdG8gUzMuXHJcbiAgc2VsZi5jcmVhdGVNdWx0aXBhcnRVcGxvYWQoIHBhcmFtcywgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xyXG4gICAgaWYoZXJyKSB7XHJcbiAgICAgIC8vIEVtaXQgdGhlIGVycm9yXHJcbiAgICAgIHdyaXRlU3RyZWFtLmVtaXQoJ2Vycm9yJywgZXJyKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIFNldCB0aGUgdXBsb2FkIGlkXHJcbiAgICAgIG11bHRpcGFydFVwbG9hZElEID0gZGF0YS5VcGxvYWRJZDtcclxuXHJcbiAgICAgIC8vIENhbGwgd2FpdGluZyBjYWxsYmFja1xyXG4gICAgICBpZiAodHlwZW9mIHdhaXRpbmdDYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIC8vIFdlIGNhbGwgdGhlIHdhaXRpbmcgY2FsbGJhY2sgaWYgYW55IG5vdyBzaW5jZSB3ZSBlc3RhYmxpc2hlZCBhXHJcbiAgICAgICAgLy8gY29ubmVjdGlvbiB0byB0aGUgczNcclxuICAgICAgICB3YWl0aW5nQ2FsbGJhY2soKTtcclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLy8gV2UgcmV0dXJuIHRoZSB3cml0ZSBzdHJlYW1cclxuICByZXR1cm4gd3JpdGVTdHJlYW07XHJcbn07XHJcbiJdfQ==
