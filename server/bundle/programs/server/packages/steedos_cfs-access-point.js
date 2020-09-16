(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var FS = Package['steedos:cfs-base-package'].FS;
var check = Package.check.check;
var Match = Package.check.Match;
var EJSON = Package.ejson.EJSON;
var HTTP = Package['steedos:cfs-http-methods'].HTTP;

/* Package-scope variables */
var rootUrlPathPrefix, baseUrl, getHeaders, getHeadersByCollection, _existingMountPoints, mountUrls;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_cfs-access-point/access-point-common.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
rootUrlPathPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || "";
// Adjust the rootUrlPathPrefix if necessary
if (rootUrlPathPrefix.length > 0) {
  if (rootUrlPathPrefix.slice(0, 1) !== '/') {
    rootUrlPathPrefix = '/' + rootUrlPathPrefix;
  }
  if (rootUrlPathPrefix.slice(-1) === '/') {
    rootUrlPathPrefix = rootUrlPathPrefix.slice(0, -1);
  }
}

// prepend ROOT_URL when isCordova
if (Meteor.isCordova) {
  rootUrlPathPrefix = Meteor.absoluteUrl('');
}

baseUrl = '/cfs';
FS.HTTP = FS.HTTP || {};

// Note the upload URL so that client uploader packages know what it is
FS.HTTP.uploadUrl = rootUrlPathPrefix + baseUrl + '/files';

/**
 * @method FS.HTTP.setBaseUrl
 * @public
 * @param {String} newBaseUrl - Change the base URL for the HTTP GET and DELETE endpoints.
 * @returns {undefined}
 */
FS.HTTP.setBaseUrl = function setBaseUrl(newBaseUrl) {

  // Adjust the baseUrl if necessary
  if (newBaseUrl.slice(0, 1) !== '/') {
    newBaseUrl = '/' + newBaseUrl;
  }
  if (newBaseUrl.slice(-1) === '/') {
    newBaseUrl = newBaseUrl.slice(0, -1);
  }

  // Update the base URL
  baseUrl = newBaseUrl;

  // Change the upload URL so that client uploader packages know what it is
  FS.HTTP.uploadUrl = rootUrlPathPrefix + baseUrl + '/files';

  // Remount URLs with the new baseUrl, unmounting the old, on the server only.
  // If existingMountPoints is empty, then we haven't run the server startup
  // code yet, so this new URL will be used at that point for the initial mount.
  if (Meteor.isServer && !FS.Utility.isEmpty(_existingMountPoints)) {
    mountUrls();
  }
};

/*
 * FS.File extensions
 */

/**
 * @method FS.File.prototype.url Construct the file url
 * @public
 * @param {Object} [options]
 * @param {String} [options.store] Name of the store to get from. If not defined, the first store defined in `options.stores` for the collection on the client is used.
 * @param {Boolean} [options.auth=null] Add authentication token to the URL query string? By default, a token for the current logged in user is added on the client. Set this to `false` to omit the token. Set this to a string to provide your own token. Set this to a number to specify an expiration time for the token in seconds.
 * @param {Boolean} [options.download=false] Should headers be set to force a download? Typically this means that clicking the link with this URL will download the file to the user's Downloads folder instead of displaying the file in the browser.
 * @param {Boolean} [options.brokenIsFine=false] Return the URL even if we know it's currently a broken link because the file hasn't been saved in the requested store yet.
 * @param {Boolean} [options.metadata=false] Return the URL for the file metadata access point rather than the file itself.
 * @param {String} [options.uploading=null] A URL to return while the file is being uploaded.
 * @param {String} [options.storing=null] A URL to return while the file is being stored.
 * @param {String} [options.filename=null] Override the filename that should appear at the end of the URL. By default it is the name of the file in the requested store.
 *
 * Returns the HTTP URL for getting the file or its metadata.
 */
FS.File.prototype.url = function(options) {
  var self = this;
  options = options || {};
  options = FS.Utility.extend({
    store: null,
    auth: null,
    download: false,
    metadata: false,
    brokenIsFine: false,
    uploading: null, // return this URL while uploading
    storing: null, // return this URL while storing
    filename: null // override the filename that is shown to the user
  }, options.hash || options); // check for "hash" prop if called as helper

  // Primarily useful for displaying a temporary image while uploading an image
  if (options.uploading && !self.isUploaded()) {
    return options.uploading;
  }

  if (self.isMounted()) {
    // See if we've stored in the requested store yet
    var storeName = options.store || self.collection.primaryStore.name;
    if (!self.hasStored(storeName)) {
      if (options.storing) {
        return options.storing;
      } else if (!options.brokenIsFine) {
        // We want to return null if we know the URL will be a broken
        // link because then we can avoid rendering broken links, broken
        // images, etc.
        return null;
      }
    }

    // Add filename to end of URL if we can determine one
    var filename = options.filename || self.name({store: storeName});
    if (typeof filename === "string" && filename.length) {
      filename = '/' + filename;
    } else {
      filename = '';
    }

    // TODO: Could we somehow figure out if the collection requires login?
    var authToken = '';
    if (Meteor.isClient && typeof Accounts !== "undefined" && typeof Accounts._storedLoginToken === "function") {
      if (options.auth !== false) {
        // Add reactive deps on the user
        Meteor.userId();

        var authObject = {
          authToken: Accounts._storedLoginToken() || ''
        };

        // If it's a number, we use that as the expiration time (in seconds)
        if (options.auth === +options.auth) {
          authObject.expiration = FS.HTTP.now() + options.auth * 1000;
        }

        // Set the authToken
        var authString = JSON.stringify(authObject);
        authToken = FS.Utility.btoa(authString);
      }
    } else if (typeof options.auth === "string") {
      // If the user supplies auth token the user will be responsible for
      // updating
      authToken = options.auth;
    }

    // Construct query string
    var params = {};
    if (authToken !== '') {
      params.token = authToken;
    }
    if (options.download) {
      params.download = true;
    }
    if (options.store) {
      // We use options.store here instead of storeName because we want to omit the queryString
      // whenever possible, allowing users to have "clean" URLs if they want. The server will
      // assume the first store defined on the server, which means that we are assuming that
      // the first on the client is also the first on the server. If that's not the case, the
      // store option should be supplied.
      params.store = options.store;
    }
    var queryString = FS.Utility.encodeParams(params);
    if (queryString.length) {
      queryString = '?' + queryString;
    }

    // Determine which URL to use
    var area;
    if (options.metadata) {
      area = '/record';
    } else {
      area = '/files';
    }

    // Construct and return the http method url
    return rootUrlPathPrefix + baseUrl + area + '/' + self.collection.name + '/' + self._id + filename + queryString;
  }

};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_cfs-access-point/access-point-handlers.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
getHeaders = [];
getHeadersByCollection = {};

FS.HTTP.Handlers = {};

/**
 * @method FS.HTTP.Handlers.Del
 * @public
 * @returns {any} response
 *
 * HTTP DEL request handler
 */
FS.HTTP.Handlers.Del = function httpDelHandler(ref) {
  var self = this;
  var opts = FS.Utility.extend({}, self.query || {}, self.params || {});

  // If DELETE request, validate with 'remove' allow/deny, delete the file, and return
  FS.Utility.validateAction(ref.collection.files._validators['remove'], ref.file, self.userId);

  /*
   * From the DELETE spec:
   * A successful response SHOULD be 200 (OK) if the response includes an
   * entity describing the status, 202 (Accepted) if the action has not
   * yet been enacted, or 204 (No Content) if the action has been enacted
   * but the response does not include an entity.
   */
  self.setStatusCode(200);

  return {
    deleted: !!ref.file.remove()
  };
};

/**
 * @method FS.HTTP.Handlers.GetList
 * @public
 * @returns {Object} response
 *
 * HTTP GET file list request handler
 */
FS.HTTP.Handlers.GetList = function httpGetListHandler() {
  // Not Yet Implemented
  // Need to check publications and return file list based on
  // what user is allowed to see
};

/*
  requestRange will parse the range set in request header - if not possible it
  will throw fitting errors and autofill range for both partial and full ranges

  throws error or returns the object:
  {
    start
    end
    length
    unit
    partial
  }
*/
var requestRange = function(req, fileSize) {
  if (req) {
    if (req.headers) {
      var rangeString = req.headers.range;

      // Make sure range is a string
      if (rangeString === ''+rangeString) {

        // range will be in the format "bytes=0-32767"
        var parts = rangeString.split('=');
        var unit = parts[0];

        // Make sure parts consists of two strings and range is of type "byte"
        if (parts.length == 2 && unit == 'bytes') {
          // Parse the range
          var range = parts[1].split('-');
          var start = Number(range[0]);
          var end = Number(range[1]);

          // Fix invalid ranges?
          if (range[0] != start) start = 0;
          if (range[1] != end || !end) end = fileSize - 1;

          // Make sure range consists of a start and end point of numbers and start is less than end
          if (start < end) {

            var partSize = 0 - start + end + 1;

            // Return the parsed range
            return {
              start: start,
              end: end,
              length: partSize,
              size: fileSize,
              unit: unit,
              partial: (partSize < fileSize)
            };

          } else {
            throw new Meteor.Error(416, "Requested Range Not Satisfiable");
          }

        } else {
          // The first part should be bytes
          throw new Meteor.Error(416, "Requested Range Unit Not Satisfiable");
        }

      } else {
        // No range found
      }

    } else {
      // throw new Error('No request headers set for _parseRange function');
    }
  } else {
    throw new Error('No request object passed to _parseRange function');
  }

  return {
    start: 0,
    end: fileSize - 1,
    length: fileSize,
    size: fileSize,
    unit: 'bytes',
    partial: false
  };
};

/**
 * @method FS.HTTP.Handlers.Get
 * @public
 * @returns {any} response
 *
 * HTTP GET request handler
 */
FS.HTTP.Handlers.Get = function httpGetHandler(ref) {
  var self = this;
  // Once we have the file, we can test allow/deny validators
  // XXX: pass on the "share" query eg. ?share=342hkjh23ggj for shared url access?
  FS.Utility.validateAction(ref.collection._validators['download'], ref.file, self.userId /*, self.query.shareId*/);

  var storeName = ref.storeName;

  // If no storeName was specified, use the first defined storeName
  if (typeof storeName !== "string") {
    // No store handed, we default to primary store
    storeName = ref.collection.primaryStore.name;
  }

  // Get the storage reference
  var storage = ref.collection.storesLookup[storeName];

  if (!storage) {
    throw new Meteor.Error(404, "Not Found", 'There is no store "' + storeName + '"');
  }

  // Get the file
  var copyInfo = ref.file.copies[storeName];

  if (!copyInfo) {
    throw new Meteor.Error(404, "Not Found", 'This file was not stored in the ' + storeName + ' store');
  }

  // Set the content type for file
  if (typeof copyInfo.type === "string" ) {
    self.setContentType(copyInfo.type);
  } else {
    self.setContentType('application/octet-stream');
  }

  // Add 'Content-Disposition' header if requested a download/attachment URL
  if (typeof ref.download !== "undefined") {
    var filename = ref.filename || copyInfo.name;
    self.addHeader('Content-Disposition', "attachment; filename*=UTF-8''" + encodeURIComponent(filename) );
  } else {
    self.addHeader('Content-Disposition', 'inline');
  }

  // Get the contents range from request
  var range = requestRange(self.request, copyInfo.size);

  // Some browsers cope better if the content-range header is
  // still included even for the full file being returned.
  self.addHeader('Content-Range', range.unit + ' ' + range.start + '-' + range.end + '/' + range.size);

  // If a chunk/range was requested instead of the whole file, serve that'
  if (range.partial) {
    self.setStatusCode(206, 'Partial Content');
  } else {
    self.setStatusCode(200, 'OK');
  }

  // Add any other global custom headers and collection-specific custom headers
  FS.Utility.each(getHeaders.concat(getHeadersByCollection[ref.collection.name] || []), function(header) {
    self.addHeader(header[0], header[1]);
  });

  // Inform clients about length (or chunk length in case of ranges)
  self.addHeader('Content-Length', range.length);
  
  // Inform clients for browser cache
  self.addHeader('cache-control', 'public, max-age=31536000');

  var modiFied = copyInfo.updatedAt;
  var reqModifiedHeader = self.requestHeaders['if-modified-since'];
  if (reqModifiedHeader != null){
    if (reqModifiedHeader == modiFied.toUTCString()){
      self.addHeader('Last-Modified', reqModifiedHeader);
      self.setStatusCode(304);
      return;
    }
  }  
  // Last modified header (updatedAt from file info) 
  self.addHeader('Last-Modified', copyInfo.updatedAt.toUTCString());

  // Inform clients that we accept ranges for resumable chunked downloads
  self.addHeader('Accept-Ranges', range.unit);

  if (FS.debug) console.log('Read file "' + (ref.filename || copyInfo.name) + '" ' + range.unit + ' ' + range.start + '-' + range.end + '/' + range.size);
  var readStream = storage.adapter.createReadStream(ref.file, {start: range.start, end: range.end});

  var writeStream = self.createWriteStream();
  
  readStream.on('error', function(err) {
    // Send proper error message on get error
    // if (err.message && err.statusCode) {
    //   self.Error(new Meteor.Error(err.statusCode, err.message));
    // } else {
    //   self.Error(new Meteor.Error(503, 'Service unavailable'));
    // }

    console.log(err);
    writeStream.end();
    
  });

  self.request.on('aborted', function() {
    if (readStream._aliyunObject){
      readStream._aliyunObject.httpRequest._abortCallback = function(){}
      readStream._aliyunObject.abort();
    }
  });

  readStream.pipe(writeStream);
};

/**
 * @method FS.HTTP.Handlers.PutInsert
 * @public
 * @returns {Object} response object with _id property
 *
 * HTTP PUT file insert request handler
 */
FS.HTTP.Handlers.PutInsert = function httpPutInsertHandler(ref) {
  var self = this;
  var opts = FS.Utility.extend({}, self.query || {}, self.params || {});

  FS.debug && console.log("HTTP PUT (insert) handler");

  // Create the nice FS.File
  var fileObj = new FS.File();

  // Set its name
  fileObj.name(opts.filename || null);

  // Attach the readstream as the file's data
  fileObj.attachData(self.createReadStream(), {type: self.requestHeaders['content-type'] || 'application/octet-stream'});

  // Validate with insert allow/deny
  FS.Utility.validateAction(ref.collection.files._validators['insert'], fileObj, self.userId);

  // Insert file into collection, triggering readStream storage
  ref.collection.insert(fileObj);

  // Send response
  self.setStatusCode(200);

  // Return the new file id
  return {_id: fileObj._id};
};

/**
 * @method FS.HTTP.Handlers.PutUpdate
 * @public
 * @returns {Object} response object with _id and chunk properties
 *
 * HTTP PUT file update chunk request handler
 */
FS.HTTP.Handlers.PutUpdate = function httpPutUpdateHandler(ref) {
  var self = this;
  var opts = FS.Utility.extend({}, self.query || {}, self.params || {});

  var chunk = parseInt(opts.chunk, 10);
  if (isNaN(chunk)) chunk = 0;

  FS.debug && console.log("HTTP PUT (update) handler received chunk: ", chunk);

  // Validate with insert allow/deny; also mounts and retrieves the file
  FS.Utility.validateAction(ref.collection.files._validators['insert'], ref.file, self.userId);

  self.createReadStream().pipe( FS.TempStore.createWriteStream(ref.file, chunk) );

  // Send response
  self.setStatusCode(200);

  return { _id: ref.file._id, chunk: chunk };
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_cfs-access-point/access-point-server.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

HTTP.publishFormats({
  fileRecordFormat: function (input) {
    // Set the method scope content type to json
    this.setContentType('application/json');
    if (FS.Utility.isArray(input)) {
      return EJSON.stringify(FS.Utility.map(input, function (obj) {
        return FS.Utility.cloneFileRecord(obj);
      }));
    } else {
      return EJSON.stringify(FS.Utility.cloneFileRecord(input));
    }
  }
});

/**
 * @method FS.HTTP.setHeadersForGet
 * @public
 * @param {Array} headers - List of headers, where each is a two-item array in which item 1 is the header name and item 2 is the header value.
 * @param {Array|String} [collections] - Which collections the headers should be added for. Omit this argument to add the header for all collections.
 * @returns {undefined}
 */
FS.HTTP.setHeadersForGet = function setHeadersForGet(headers, collections) {
  if (typeof collections === "string") {
    collections = [collections];
  }
  if (collections) {
    FS.Utility.each(collections, function(collectionName) {
      getHeadersByCollection[collectionName] = headers || [];
    });
  } else {
    getHeaders = headers || [];
  }
};

/**
 * @method FS.HTTP.publish
 * @public
 * @param {FS.Collection} collection
 * @param {Function} func - Publish function that returns a cursor.
 * @returns {undefined}
 *
 * Publishes all documents returned by the cursor at a GET URL
 * with the format baseUrl/record/collectionName. The publish
 * function `this` is similar to normal `Meteor.publish`.
 */
FS.HTTP.publish = function fsHttpPublish(collection, func) {
  var name = baseUrl + '/record/' + collection.name;
  // Mount collection listing URL using http-publish package
  HTTP.publish({
    name: name,
    defaultFormat: 'fileRecordFormat',
    collection: collection,
    collectionGet: true,
    collectionPost: false,
    documentGet: true,
    documentPut: false,
    documentDelete: false
  }, func);

  FS.debug && console.log("Registered HTTP method GET URLs:\n\n" + name + '\n' + name + '/:id\n');
};

/**
 * @method FS.HTTP.unpublish
 * @public
 * @param {FS.Collection} collection
 * @returns {undefined}
 *
 * Unpublishes a restpoint created by a call to `FS.HTTP.publish`
 */
FS.HTTP.unpublish = function fsHttpUnpublish(collection) {
  // Mount collection listing URL using http-publish package
  HTTP.unpublish(baseUrl + '/record/' + collection.name);
};

_existingMountPoints = {};

/**
 * @method defaultSelectorFunction
 * @private
 * @returns { collection, file }
 *
 * This is the default selector function
 */
var defaultSelectorFunction = function() {
  var self = this;
  // Selector function
  //
  // This function will have to return the collection and the
  // file. If file not found undefined is returned - if null is returned the
  // search was not possible
  var opts = FS.Utility.extend({}, self.query || {}, self.params || {});

  // Get the collection name from the url
  var collectionName = opts.collectionName;

  // Get the id from the url
  var id = opts.id;

  // Get the collection
  var collection = FS._collections[collectionName];

  // Get the file if possible else return null
  var file = (id && collection)? collection.findOne({ _id: id }): null;

  // Return the collection and the file
  return {
    collection: collection,
    file: file,
    storeName: opts.store,
    download: opts.download,
    filename: opts.filename
  };
};

/*
 * @method FS.HTTP.mount
 * @public
 * @param {array of string} mountPoints mount points to map rest functinality on
 * @param {function} selector_f [selector] function returns `{ collection, file }` for mount points to work with
 *
*/
FS.HTTP.mount = function(mountPoints, selector_f) {
  // We take mount points as an array and we get a selector function
  var selectorFunction = selector_f || defaultSelectorFunction;

  var accessPoint = {
    'stream': true,
    'auth': expirationAuth,
    'post': function(data) {
      // Use the selector for finding the collection and file reference
      var ref = selectorFunction.call(this);

      // We dont support post - this would be normal insert eg. of filerecord?
      throw new Meteor.Error(501, "Not implemented", "Post is not supported");
    },
    'put': function(data) {
      // Use the selector for finding the collection and file reference
      var ref = selectorFunction.call(this);

      // Make sure we have a collection reference
      if (!ref.collection)
        throw new Meteor.Error(404, "Not Found", "No collection found");

      // Make sure we have a file reference
      if (ref.file === null) {
        // No id supplied so we will create a new FS.File instance and
        // insert the supplied data.
        return FS.HTTP.Handlers.PutInsert.apply(this, [ref]);
      } else {
        if (ref.file) {
          return FS.HTTP.Handlers.PutUpdate.apply(this, [ref]);
        } else {
          throw new Meteor.Error(404, "Not Found", 'No file found');
        }
      }
    },
    'get': function(data) {
      // Use the selector for finding the collection and file reference
      var ref = selectorFunction.call(this);

      // Make sure we have a collection reference
      if (!ref.collection)
        throw new Meteor.Error(404, "Not Found", "No collection found");

      // Make sure we have a file reference
      if (ref.file === null) {
        // No id supplied so we will return the published list of files ala
        // http.publish in json format
        return FS.HTTP.Handlers.GetList.apply(this, [ref]);
      } else {
        if (ref.file) {
          return FS.HTTP.Handlers.Get.apply(this, [ref]);
        } else {
          throw new Meteor.Error(404, "Not Found", 'No file found');
        }
      }
    },
    'delete': function(data) {
      // Use the selector for finding the collection and file reference
      var ref = selectorFunction.call(this);

      // Make sure we have a collection reference
      if (!ref.collection)
        throw new Meteor.Error(404, "Not Found", "No collection found");

      // Make sure we have a file reference
      if (ref.file) {
        return FS.HTTP.Handlers.Del.apply(this, [ref]);
      } else {
        throw new Meteor.Error(404, "Not Found", 'No file found');
      }
    }
  };

  var accessPoints = {};

  // Add debug message
  FS.debug && console.log('Registered HTTP method URLs:');

  FS.Utility.each(mountPoints, function(mountPoint) {
    // Couple mountpoint and accesspoint
    accessPoints[mountPoint] = accessPoint;
    // Remember our mountpoints
    _existingMountPoints[mountPoint] = mountPoint;
    // Add debug message
    FS.debug && console.log(mountPoint);
  });

  // XXX: HTTP:methods should unmount existing mounts in case of overwriting?
  HTTP.methods(accessPoints);

};

/**
 * @method FS.HTTP.unmount
 * @public
 * @param {string | array of string} [mountPoints] Optional, if not specified all mountpoints are unmounted
 *
 */
FS.HTTP.unmount = function(mountPoints) {
  // The mountPoints is optional, can be string or array if undefined then
  // _existingMountPoints will be used
  var unmountList;
  // Container for the mount points to unmount
  var unmountPoints = {};

  if (typeof mountPoints === 'undefined') {
    // Use existing mount points - unmount all
    unmountList = _existingMountPoints;
  } else if (mountPoints === ''+mountPoints) {
    // Got a string
    unmountList = [mountPoints];
  } else if (mountPoints.length) {
    // Got an array
    unmountList = mountPoints;
  }

  // If we have a list to unmount
  if (unmountList) {
    // Iterate over each item
    FS.Utility.each(unmountList, function(mountPoint) {
      // Check _existingMountPoints to make sure the mount point exists in our
      // context / was created by the FS.HTTP.mount
      if (_existingMountPoints[mountPoint]) {
        // Mark as unmount
        unmountPoints[mountPoint] = false;
        // Release
        delete _existingMountPoints[mountPoint];
      }
    });
    FS.debug && console.log('FS.HTTP.unmount:');
    FS.debug && console.log(unmountPoints);
    // Complete unmount
    HTTP.methods(unmountPoints);
  }
};

// ### FS.Collection maps on HTTP pr. default on the following restpoints:
// *
//    baseUrl + '/files/:collectionName/:id/:filename',
//    baseUrl + '/files/:collectionName/:id',
//    baseUrl + '/files/:collectionName'
//
// Change/ replace the existing mount point by:
// ```js
//   // unmount all existing
//   FS.HTTP.unmount();
//   // Create new mount point
//   FS.HTTP.mount([
//    '/cfs/files/:collectionName/:id/:filename',
//    '/cfs/files/:collectionName/:id',
//    '/cfs/files/:collectionName'
//  ]);
//  ```
//
mountUrls = function mountUrls() {
  // We unmount first in case we are calling this a second time
  FS.HTTP.unmount();

  FS.HTTP.mount([
    baseUrl + '/files/:collectionName/:id/:filename',
    baseUrl + '/files/:collectionName/:id',
    baseUrl + '/files/:collectionName'
  ]);
};

// Returns the userId from URL token
var expirationAuth = function expirationAuth() {
  var self = this;

  // Read the token from '/hello?token=base64'
  var encodedToken = self.query.token;

  FS.debug && console.log("token: "+encodedToken);

  if (!encodedToken || !Meteor.users) return false;

  // Check the userToken before adding it to the db query
  // Set the this.userId
  var tokenString = FS.Utility.atob(encodedToken);

  var tokenObject;
  try {
    tokenObject = JSON.parse(tokenString);
  } catch(err) {
    throw new Meteor.Error(400, 'Bad Request');
  }

  // XXX: Do some check here of the object
  var userToken = tokenObject.authToken;
  if (userToken !== ''+userToken) {
    throw new Meteor.Error(400, 'Bad Request');
  }

  // If we have an expiration token we should check that it's still valid
  if (tokenObject.expiration != null) {
    // check if its too old
    var now = Date.now();
    if (tokenObject.expiration < now) {
      FS.debug && console.log('Expired token: ' + tokenObject.expiration + ' is less than ' + now);
      throw new Meteor.Error(500, 'Expired token');
    }
  }

  // We are not on a secure line - so we have to look up the user...
  var user = Meteor.users.findOne({
    $or: [
      {'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(userToken)},
      {'services.resume.loginTokens.token': userToken}
    ]
  });

  // Set the userId in the scope
  return user && user._id;
};

HTTP.methods(
  {'/cfs/servertime': {
    get: function(data) {
      return Date.now().toString();
    }
  }
});

// Unify client / server api
FS.HTTP.now = function() {
  return Date.now();
};

// Start up the basic mount points
Meteor.startup(function () {
  mountUrls();
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("steedos:cfs-access-point");

})();
