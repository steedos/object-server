(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var _ = Package.underscore._;
var EJSON = Package.ejson.EJSON;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var HTTP, _methodHTTP, Fiber, runServerMethod;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:cfs-http-methods":{"http.methods.server.api.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/steedos_cfs-http-methods/http.methods.server.api.js                                                       //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/*

GET /note
GET /note/:id
POST /note
PUT /note/:id
DELETE /note/:id

*/
HTTP = Package.http && Package.http.HTTP || {}; // Primary local test scope

_methodHTTP = {};
_methodHTTP.methodHandlers = {};
_methodHTTP.methodTree = {}; // This could be changed eg. could allow larger data chunks than 1.000.000
// 5mb = 5 * 1024 * 1024 = 5242880;

HTTP.methodsMaxDataLength = 5242880; //1e6;

_methodHTTP.nameFollowsConventions = function (name) {
  // Check that name is string, not a falsy or empty
  return name && name === '' + name && name !== '';
};

_methodHTTP.getNameList = function (name) {
  // Remove leading and trailing slashes and make command array
  name = name && name.replace(/^\//g, '') || ''; // /^\/|\/$/g
  // TODO: Get the format from the url - eg.: "/list/45.json" format should be
  // set in this function by splitting the last list item by . and have format
  // as the last item. How should we toggle:
  // "/list/45/item.name.json" and "/list/45/item.name"?
  // We would either have to check all known formats or allways determin the "."
  // as an extension. Resolving in "json" and "name" as handed format - the user
  // Could simply just add the format as a parametre? or be explicit about
  // naming

  return name && name.split('/') || [];
}; // Merge two arrays one containing keys and one values


_methodHTTP.createObject = function (keys, values) {
  var result = {};

  if (keys && values) {
    for (var i = 0; i < keys.length; i++) {
      result[keys[i]] = values[i] && decodeURIComponent(values[i]) || '';
    }
  }

  return result;
};

_methodHTTP.addToMethodTree = function (methodName) {
  var list = _methodHTTP.getNameList(methodName);

  var name = '/'; // Contains the list of params names

  var params = [];
  var currentMethodTree = _methodHTTP.methodTree;

  for (var i = 0; i < list.length; i++) {
    // get the key name
    var key = list[i]; // Check if it expects a value

    if (key[0] === ':') {
      // This is a value
      params.push(key.slice(1));
      key = ':value';
    }

    name += key + '/'; // Set the key into the method tree

    if (typeof currentMethodTree[key] === 'undefined') {
      currentMethodTree[key] = {};
    } // Dig deeper


    currentMethodTree = currentMethodTree[key];
  }

  if (_.isEmpty(currentMethodTree[':ref'])) {
    currentMethodTree[':ref'] = {
      name: name,
      params: params
    };
  }

  return currentMethodTree[':ref'];
}; // This method should be optimized for speed since its called on allmost every
// http call to the server so we return null as soon as we know its not a method


_methodHTTP.getMethod = function (name) {
  // Check if the
  if (!_methodHTTP.nameFollowsConventions(name)) {
    return null;
  }

  var list = _methodHTTP.getNameList(name); // Check if we got a correct list


  if (!list || !list.length) {
    return null;
  } // Set current refernce in the _methodHTTP.methodTree


  var currentMethodTree = _methodHTTP.methodTree; // Buffer for values to hand on later

  var values = []; // Iterate over the method name and check if its found in the method tree

  for (var i = 0; i < list.length; i++) {
    // get the key name
    var key = list[i]; // We expect to find the key or :value if not we break

    if (typeof currentMethodTree[key] !== 'undefined' || typeof currentMethodTree[':value'] !== 'undefined') {
      // We got a result now check if its a value
      if (typeof currentMethodTree[key] === 'undefined') {
        // Push the value
        values.push(key); // Set the key to :value to dig deeper

        key = ':value';
      }
    } else {
      // Break - method call not found
      return null;
    } // Dig deeper


    currentMethodTree = currentMethodTree[key];
  } // Extract reference pointer


  var reference = currentMethodTree && currentMethodTree[':ref'];

  if (typeof reference !== 'undefined') {
    return {
      name: reference.name,
      params: _methodHTTP.createObject(reference.params, values),
      handle: _methodHTTP.methodHandlers[reference.name]
    };
  } else {
    // Did not get any reference to the method
    return null;
  }
}; // This method retrieves the userId from the token and makes sure that the token
// is valid and not expired


_methodHTTP.getUserId = function () {
  var self = this; // // Get ip, x-forwarded-for can be comma seperated ips where the first is the
  // // client ip
  // var ip = self.req.headers['x-forwarded-for'] &&
  //         // Return the first item in ip list
  //         self.req.headers['x-forwarded-for'].split(',')[0] ||
  //         // or return the remoteAddress
  //         self.req.connection.remoteAddress;
  // Check authentication

  var userToken = self.query.token; // Check if we are handed strings

  try {
    userToken && check(userToken, String);
  } catch (err) {
    throw new Meteor.Error(404, 'Error user token and id not of type strings, Error: ' + (err.stack || err.message));
  } // Set the this.userId


  if (userToken) {
    // Look up user to check if user exists and is loggedin via token
    var user = Meteor.users.findOne({
      $or: [{
        'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(userToken)
      }, {
        'services.resume.loginTokens.token': userToken
      }]
    }); // TODO: check 'services.resume.loginTokens.when' to have the token expire
    // Set the userId in the scope

    return user && user._id;
  }

  return null;
}; // Expose the default auth for calling from custom authentication handlers.


HTTP.defaultAuth = _methodHTTP.getUserId;
/*

Add default support for options

*/

_methodHTTP.defaultOptionsHandler = function (methodObject) {
  // List of supported methods
  var allowMethods = []; // The final result object

  var result = {}; // Iterate over the methods
  // XXX: We should have a way to extend this - We should have some schema model
  // for our methods...

  _.each(methodObject, function (f, methodName) {
    // Skip the stream and auth functions - they are not public / accessible
    if (methodName !== 'stream' && methodName !== 'auth') {
      // Create an empty description
      result[methodName] = {
        description: '',
        parameters: {}
      }; // Add method name to headers

      allowMethods.push(methodName);
    }
  }); // Lets play nice


  this.setStatusCode(200); // We have to set some allow headers here

  this.addHeader('Allow', allowMethods.join(',')); // Return json result - Pretty print

  return JSON.stringify(result, null, '\t');
}; // Public interface for adding server-side http methods - if setting a method to
// 'false' it would actually remove the method (can be used to unpublish a method)


HTTP.methods = function (newMethods) {
  _.each(newMethods, function (func, name) {
    if (_methodHTTP.nameFollowsConventions(name)) {
      // Check if we got a function
      //if (typeof func === 'function') {
      var method = _methodHTTP.addToMethodTree(name); // The func is good


      if (typeof _methodHTTP.methodHandlers[method.name] !== 'undefined') {
        if (func === false) {
          // If the method is set to false then unpublish
          delete _methodHTTP.methodHandlers[method.name]; // Delete the reference in the _methodHTTP.methodTree

          delete method.name;
          delete method.params;
        } else {
          // We should not allow overwriting - following Meteor.methods
          throw new Error('HTTP method "' + name + '" is already registered');
        }
      } else {
        // We could have a function or a object
        // The object could have:
        // '/test/': {
        //   auth: function() ... returning the userId using over default
        //
        //   method: function() ...
        //   or
        //   post: function() ...
        //   put:
        //   get:
        //   delete:
        //   head:
        // }

        /*
        We conform to the object format:
        {
          auth:
          post:
          put:
          get:
          delete:
          head:
        }
        This way we have a uniform reference
        */
        var uniObj = {};

        if (typeof func === 'function') {
          uniObj = {
            'auth': _methodHTTP.getUserId,
            'stream': false,
            'POST': func,
            'PUT': func,
            'GET': func,
            'DELETE': func,
            'HEAD': func,
            'OPTIONS': _methodHTTP.defaultOptionsHandler
          };
        } else {
          uniObj = {
            'stream': func.stream || false,
            'auth': func.auth || _methodHTTP.getUserId,
            'POST': func.post || func.method,
            'PUT': func.put || func.method,
            'GET': func.get || func.method,
            'DELETE': func.delete || func.method,
            'HEAD': func.head || func.get || func.method,
            'OPTIONS': func.options || _methodHTTP.defaultOptionsHandler
          };
        } // Registre the method


        _methodHTTP.methodHandlers[method.name] = uniObj; // func;
      } // } else {
      //   // We do require a function as a function to execute later
      //   throw new Error('HTTP.methods failed: ' + name + ' is not a function');
      // }

    } else {
      // We have to follow the naming spec defined in nameFollowsConventions
      throw new Error('HTTP.method "' + name + '" invalid naming of method');
    }
  });
};

var sendError = function (res, code, message) {
  if (code) {
    res.writeHead(code);
  } else {
    res.writeHead(500);
  }

  res.end(message);
}; // This handler collects the header data into either an object (if json) or the
// raw data. The data is passed to the callback


var requestHandler = function (req, res, callback) {
  if (typeof callback !== 'function') {
    return null;
  } // Container for buffers and a sum of the length


  var bufferData = [],
      dataLen = 0; // Extract the body

  req.on('data', function (data) {
    bufferData.push(data);
    dataLen += data.length; // We have to check the data length in order to spare the server

    if (dataLen > HTTP.methodsMaxDataLength) {
      dataLen = 0;
      bufferData = []; // Flood attack or faulty client

      sendError(res, 413, 'Flood attack or faulty client');
      req.connection.destroy();
    }
  }); // When message is ready to be passed on

  req.on('end', function () {
    if (res.finished) {
      return;
    } // Allow the result to be undefined if so


    var result; // If data found the work it - either buffer or json

    if (dataLen > 0) {
      result = new Buffer(dataLen); // Merge the chunks into one buffer

      for (var i = 0, ln = bufferData.length, pos = 0; i < ln; i++) {
        bufferData[i].copy(result, pos);
        pos += bufferData[i].length;
        delete bufferData[i];
      } // Check if we could be dealing with json


      if (result[0] == 0x7b && result[1] === 0x22) {
        try {
          // Convert the body into json and extract the data object
          result = EJSON.parse(result.toString());
        } catch (err) {// Could not parse so we return the raw data
        }
      }
    } // Else result will be undefined


    try {
      callback(result);
    } catch (err) {
      sendError(res, 500, 'Error in requestHandler callback, Error: ' + (err.stack || err.message));
    }
  });
}; // This is the simplest handler - it simply passes req stream as data to the
// method


var streamHandler = function (req, res, callback) {
  try {
    callback();
  } catch (err) {
    sendError(res, 500, 'Error in requestHandler callback, Error: ' + (err.stack || err.message));
  }
};
/*
  Allow file uploads in cordova cfs
*/


var setCordovaHeaders = function (request, response) {
  var origin = request.headers.origin; // Match http://localhost:<port> for Cordova clients in Meteor 1.3
  // and http://meteor.local for earlier versions

  if (origin && (origin === 'http://meteor.local' || /^http:\/\/localhost/.test(origin))) {
    // We need to echo the origin provided in the request
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Methods", "PUT");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
}; // Handle the actual connection


WebApp.connectHandlers.use(function (req, res, next) {
  // Check to se if this is a http method call
  var method = _methodHTTP.getMethod(req._parsedUrl.pathname); // If method is null then it wasn't and we pass the request along


  if (method === null) {
    return next();
  }

  var dataHandle = method.handle && method.handle.stream ? streamHandler : requestHandler;
  dataHandle(req, res, function (data) {
    // If methodsHandler not found or somehow the methodshandler is not a
    // function then return a 404
    if (typeof method.handle === 'undefined') {
      sendError(res, 404, 'Error HTTP method handler "' + method.name + '" is not found');
      return;
    } // Set CORS headers for Meteor Cordova clients


    setCordovaHeaders(req, res); // Set fiber scope

    var fiberScope = {
      // Pointers to Request / Response
      req: req,
      res: res,
      // Request / Response helpers
      statusCode: 200,
      method: req.method,
      // Headers for response
      headers: {
        'Content-Type': 'text/html' // Set default type

      },
      // Arguments
      data: data,
      query: req.query,
      params: method.params,
      // Method reference
      reference: method.name,
      methodObject: method.handle,
      _streamsWaiting: 0
    }; // Helper functions this scope

    Fiber = require('fibers');
    runServerMethod = Fiber(function (self) {
      var result, resultBuffer; // We fetch methods data from methodsHandler, the handler uses the this.addItem()
      // function to populate the methods, this way we have better check control and
      // better error handling + messages
      // The scope for the user methodObject callbacks

      var thisScope = {
        // The user whos id and token was used to run this method, if set/found
        userId: null,
        // The id of the data
        _id: null,
        // Set the query params ?token=1&id=2 -> { token: 1, id: 2 }
        query: self.query,
        // Set params /foo/:name/test/:id -> { name: '', id: '' }
        params: self.params,
        // Method GET, PUT, POST, DELETE, HEAD
        method: self.method,
        // User agent
        userAgent: req.headers['user-agent'],
        // All request headers
        requestHeaders: req.headers,
        // Add the request object it self
        request: req,
        // Set the userId
        setUserId: function (id) {
          this.userId = id;
        },
        // We dont simulate / run this on the client at the moment
        isSimulation: false,
        // Run the next method in a new fiber - This is default at the moment
        unblock: function () {},
        // Set the content type in header, defaults to text/html?
        setContentType: function (type) {
          self.headers['Content-Type'] = type;
        },
        setStatusCode: function (code) {
          self.statusCode = code;
        },
        addHeader: function (key, value) {
          self.headers[key] = value;
        },
        createReadStream: function () {
          self._streamsWaiting++;
          return req;
        },
        createWriteStream: function () {
          self._streamsWaiting++;
          return res;
        },
        Error: function (err) {
          if (err instanceof Meteor.Error) {
            // Return controlled error
            sendError(res, err.error, err.message);
          } else if (err instanceof Error) {
            // Return error trace - this is not intented
            sendError(res, 503, 'Error in method "' + self.reference + '", Error: ' + (err.stack || err.message));
          } else {
            sendError(res, 503, 'Error in method "' + self.reference + '"');
          }
        } // getData: function() {
        //   // XXX: TODO if we could run the request handler stuff eg.
        //   // in here in a fiber sync it could be cool - and the user did
        //   // not have to specify the stream=true flag?
        // }

      }; // This function sends the final response. Depending on the
      // timing of the streaming, we might have to wait for all
      // streaming to end, or we might have to wait for this function
      // to finish after streaming ends. The checks in this function
      // and the fact that we call it twice ensure that we will always
      // send the response if we haven't sent an error response, but
      // we will not send it too early.

      function sendResponseIfDone() {
        res.statusCode = self.statusCode; // If no streams are waiting

        if (self._streamsWaiting === 0 && (self.statusCode === 200 || self.statusCode === 206) && self.done && !self._responseSent && !res.finished) {
          self._responseSent = true;
          res.end(resultBuffer);
        }
      }

      var methodCall = self.methodObject[self.method]; // If the method call is set for the POST/PUT/GET or DELETE then run the
      // respective methodCall if its a function

      if (typeof methodCall === 'function') {
        // Get the userId - This is either set as a method specific handler and
        // will allways default back to the builtin getUserId handler
        try {
          // Try to set the userId
          thisScope.userId = self.methodObject.auth.apply(self);
        } catch (err) {
          sendError(res, err.error, err.message || err.stack);
          return;
        } // This must be attached before there's any chance of `createReadStream`
        // or `createWriteStream` being called, which means before we do
        // `methodCall.apply` below.


        req.on('end', function () {
          self._streamsWaiting--;
          sendResponseIfDone();
        }); // Get the result of the methodCall

        try {
          if (self.method === 'OPTIONS') {
            result = methodCall.apply(thisScope, [self.methodObject]) || '';
          } else {
            result = methodCall.apply(thisScope, [self.data]) || '';
          }
        } catch (err) {
          if (err instanceof Meteor.Error) {
            // Return controlled error
            sendError(res, err.error, err.message);
          } else {
            // Return error trace - this is not intented
            sendError(res, 503, 'Error in method "' + self.reference + '", Error: ' + (err.stack || err.message));
          }

          return;
        } // Set headers


        _.each(self.headers, function (value, key) {
          // If value is defined then set the header, this allows for unsetting
          // the default content-type
          if (typeof value !== 'undefined') res.setHeader(key, value);
        }); // If OK / 200 then Return the result


        if (self.statusCode === 200 || self.statusCode === 206) {
          if (self.method !== "HEAD") {
            // Return result
            if (typeof result === 'string') {
              resultBuffer = new Buffer(result);
            } else {
              resultBuffer = new Buffer(JSON.stringify(result));
            } // Check if user wants to overwrite content length for some reason?


            if (typeof self.headers['Content-Length'] === 'undefined') {
              self.headers['Content-Length'] = resultBuffer.length;
            }
          }

          self.done = true;
          sendResponseIfDone();
        } else {
          // Allow user to alter the status code and send a message
          sendError(res, self.statusCode, result);
        }
      } else {
        sendError(res, 404, 'Service not found');
      }
    }); // Run http methods handler

    try {
      runServerMethod.run(fiberScope);
    } catch (err) {
      sendError(res, 500, 'Error running the server http method handler, Error: ' + (err.stack || err.message));
    }
  }); // EO Request handler
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/steedos:cfs-http-methods/http.methods.server.api.js");

/* Exports */
Package._define("steedos:cfs-http-methods", {
  HTTP: HTTP,
  _methodHTTP: _methodHTTP
});

})();

//# sourceURL=meteor://💻app/packages/steedos_cfs-http-methods.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpjZnMtaHR0cC1tZXRob2RzL2h0dHAubWV0aG9kcy5zZXJ2ZXIuYXBpLmpzIl0sIm5hbWVzIjpbIkhUVFAiLCJQYWNrYWdlIiwiaHR0cCIsIl9tZXRob2RIVFRQIiwibWV0aG9kSGFuZGxlcnMiLCJtZXRob2RUcmVlIiwibWV0aG9kc01heERhdGFMZW5ndGgiLCJuYW1lRm9sbG93c0NvbnZlbnRpb25zIiwibmFtZSIsImdldE5hbWVMaXN0IiwicmVwbGFjZSIsInNwbGl0IiwiY3JlYXRlT2JqZWN0Iiwia2V5cyIsInZhbHVlcyIsInJlc3VsdCIsImkiLCJsZW5ndGgiLCJkZWNvZGVVUklDb21wb25lbnQiLCJhZGRUb01ldGhvZFRyZWUiLCJtZXRob2ROYW1lIiwibGlzdCIsInBhcmFtcyIsImN1cnJlbnRNZXRob2RUcmVlIiwia2V5IiwicHVzaCIsInNsaWNlIiwiXyIsImlzRW1wdHkiLCJnZXRNZXRob2QiLCJyZWZlcmVuY2UiLCJoYW5kbGUiLCJnZXRVc2VySWQiLCJzZWxmIiwidXNlclRva2VuIiwicXVlcnkiLCJ0b2tlbiIsImNoZWNrIiwiU3RyaW5nIiwiZXJyIiwiTWV0ZW9yIiwiRXJyb3IiLCJzdGFjayIsIm1lc3NhZ2UiLCJ1c2VyIiwidXNlcnMiLCJmaW5kT25lIiwiJG9yIiwiQWNjb3VudHMiLCJfaGFzaExvZ2luVG9rZW4iLCJfaWQiLCJkZWZhdWx0QXV0aCIsImRlZmF1bHRPcHRpb25zSGFuZGxlciIsIm1ldGhvZE9iamVjdCIsImFsbG93TWV0aG9kcyIsImVhY2giLCJmIiwiZGVzY3JpcHRpb24iLCJwYXJhbWV0ZXJzIiwic2V0U3RhdHVzQ29kZSIsImFkZEhlYWRlciIsImpvaW4iLCJKU09OIiwic3RyaW5naWZ5IiwibWV0aG9kcyIsIm5ld01ldGhvZHMiLCJmdW5jIiwibWV0aG9kIiwidW5pT2JqIiwic3RyZWFtIiwiYXV0aCIsInBvc3QiLCJwdXQiLCJnZXQiLCJkZWxldGUiLCJoZWFkIiwib3B0aW9ucyIsInNlbmRFcnJvciIsInJlcyIsImNvZGUiLCJ3cml0ZUhlYWQiLCJlbmQiLCJyZXF1ZXN0SGFuZGxlciIsInJlcSIsImNhbGxiYWNrIiwiYnVmZmVyRGF0YSIsImRhdGFMZW4iLCJvbiIsImRhdGEiLCJjb25uZWN0aW9uIiwiZGVzdHJveSIsImZpbmlzaGVkIiwiQnVmZmVyIiwibG4iLCJwb3MiLCJjb3B5IiwiRUpTT04iLCJwYXJzZSIsInRvU3RyaW5nIiwic3RyZWFtSGFuZGxlciIsInNldENvcmRvdmFIZWFkZXJzIiwicmVxdWVzdCIsInJlc3BvbnNlIiwib3JpZ2luIiwiaGVhZGVycyIsInRlc3QiLCJzZXRIZWFkZXIiLCJXZWJBcHAiLCJjb25uZWN0SGFuZGxlcnMiLCJ1c2UiLCJuZXh0IiwiX3BhcnNlZFVybCIsInBhdGhuYW1lIiwiZGF0YUhhbmRsZSIsImZpYmVyU2NvcGUiLCJzdGF0dXNDb2RlIiwiX3N0cmVhbXNXYWl0aW5nIiwiRmliZXIiLCJyZXF1aXJlIiwicnVuU2VydmVyTWV0aG9kIiwicmVzdWx0QnVmZmVyIiwidGhpc1Njb3BlIiwidXNlcklkIiwidXNlckFnZW50IiwicmVxdWVzdEhlYWRlcnMiLCJzZXRVc2VySWQiLCJpZCIsImlzU2ltdWxhdGlvbiIsInVuYmxvY2siLCJzZXRDb250ZW50VHlwZSIsInR5cGUiLCJ2YWx1ZSIsImNyZWF0ZVJlYWRTdHJlYW0iLCJjcmVhdGVXcml0ZVN0cmVhbSIsImVycm9yIiwic2VuZFJlc3BvbnNlSWZEb25lIiwiZG9uZSIsIl9yZXNwb25zZVNlbnQiLCJtZXRob2RDYWxsIiwiYXBwbHkiLCJydW4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7QUFTQUEsSUFBSSxHQUFHQyxPQUFPLENBQUNDLElBQVIsSUFBZ0JELE9BQU8sQ0FBQ0MsSUFBUixDQUFhRixJQUE3QixJQUFxQyxFQUE1QyxDLENBRUE7O0FBQ0FHLFdBQVcsR0FBRyxFQUFkO0FBR0FBLFdBQVcs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RCxtQkFBUyxDQUFDQyxHQUFELEVBQU03QyxJQUFJLENBQUNrRixVQUFYLEVBQXVCcEcsTUFBdkIsQ0FBVDtBQUNEO0FBRUYsT0F4RUQsTUF3RU87QUFDTDhELGlCQUFTLENBQUNDLEdBQUQsRUFBTSxHQUFOLEVBQVcsbUJBQVgsQ0FBVDtBQUNEO0FBR0YsS0E1S3NCLENBQXZCLENBbkNrQyxDQWdObEM7O0FBQ0EsUUFBSTtBQUNGeUMscUJBQWUsQ0FBQ3FCLEdBQWhCLENBQW9CMUIsVUFBcEI7QUFDRCxLQUZELENBRUUsT0FBTTNFLEdBQU4sRUFBVztBQUNYc0MsZUFBUyxDQUFDQyxHQUFELEVBQU0sR0FBTixFQUFXLDJEQUEyRHZDLEdBQUcsQ0FBQ0csS0FBSixJQUFhSCxHQUFHLENBQUNJLE9BQTVFLENBQVgsQ0FBVDtBQUNEO0FBRUYsR0F2TlMsQ0FBVixDQVprRCxDQW1POUM7QUFHTCxDQXRPRCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9zdGVlZG9zX2Nmcy1odHRwLW1ldGhvZHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxyXG5cclxuR0VUIC9ub3RlXHJcbkdFVCAvbm90ZS86aWRcclxuUE9TVCAvbm90ZVxyXG5QVVQgL25vdGUvOmlkXHJcbkRFTEVURSAvbm90ZS86aWRcclxuXHJcbiovXHJcbkhUVFAgPSBQYWNrYWdlLmh0dHAgJiYgUGFja2FnZS5odHRwLkhUVFAgfHwge307XHJcblxyXG4vLyBQcmltYXJ5IGxvY2FsIHRlc3Qgc2NvcGVcclxuX21ldGhvZEhUVFAgPSB7fTtcclxuXHJcblxyXG5fbWV0aG9kSFRUUC5tZXRob2RIYW5kbGVycyA9IHt9O1xyXG5fbWV0aG9kSFRUUC5tZXRob2RUcmVlID0ge307XHJcblxyXG4vLyBUaGlzIGNvdWxkIGJlIGNoYW5nZWQgZWcuIGNvdWxkIGFsbG93IGxhcmdlciBkYXRhIGNodW5rcyB0aGFuIDEuMDAwLjAwMFxyXG4vLyA1bWIgPSA1ICogMTAyNCAqIDEwMjQgPSA1MjQyODgwO1xyXG5IVFRQLm1ldGhvZHNNYXhEYXRhTGVuZ3RoID0gNTI0Mjg4MDsgLy8xZTY7XHJcblxyXG5fbWV0aG9kSFRUUC5uYW1lRm9sbG93c0NvbnZlbnRpb25zID0gZnVuY3Rpb24obmFtZSkge1xyXG4gIC8vIENoZWNrIHRoYXQgbmFtZSBpcyBzdHJpbmcsIG5vdCBhIGZhbHN5IG9yIGVtcHR5XHJcbiAgcmV0dXJuIG5hbWUgJiYgbmFtZSA9PT0gJycgKyBuYW1lICYmIG5hbWUgIT09ICcnO1xyXG59O1xyXG5cclxuXHJcbl9tZXRob2RIVFRQLmdldE5hbWVMaXN0ID0gZnVuY3Rpb24obmFtZSkge1xyXG4gIC8vIFJlbW92ZSBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaGVzIGFuZCBtYWtlIGNvbW1hbmQgYXJyYXlcclxuICBuYW1lID0gbmFtZSAmJiBuYW1lLnJlcGxhY2UoL15cXC8vZywgJycpIHx8ICcnOyAvLyAvXlxcL3xcXC8kL2dcclxuICAvLyBUT0RPOiBHZXQgdGhlIGZvcm1hdCBmcm9tIHRoZSB1cmwgLSBlZy46IFwiL2xpc3QvNDUuanNvblwiIGZvcm1hdCBzaG91bGQgYmVcclxuICAvLyBzZXQgaW4gdGhpcyBmdW5jdGlvbiBieSBzcGxpdHRpbmcgdGhlIGxhc3QgbGlzdCBpdGVtIGJ5IC4gYW5kIGhhdmUgZm9ybWF0XHJcbiAgLy8gYXMgdGhlIGxhc3QgaXRlbS4gSG93IHNob3VsZCB3ZSB0b2dnbGU6XHJcbiAgLy8gXCIvbGlzdC80NS9pdGVtLm5hbWUuanNvblwiIGFuZCBcIi9saXN0LzQ1L2l0ZW0ubmFtZVwiP1xyXG4gIC8vIFdlIHdvdWxkIGVpdGhlciBoYXZlIHRvIGNoZWNrIGFsbCBrbm93biBmb3JtYXRzIG9yIGFsbHdheXMgZGV0ZXJtaW4gdGhlIFwiLlwiXHJcbiAgLy8gYXMgYW4gZXh0ZW5zaW9uLiBSZXNvbHZpbmcgaW4gXCJqc29uXCIgYW5kIFwibmFtZVwiIGFzIGhhbmRlZCBmb3JtYXQgLSB0aGUgdXNlclxyXG4gIC8vIENvdWxkIHNpbXBseSBqdXN0IGFkZCB0aGUgZm9ybWF0IGFzIGEgcGFyYW1ldHJlPyBvciBiZSBleHBsaWNpdCBhYm91dFxyXG4gIC8vIG5hbWluZ1xyXG4gIHJldHVybiBuYW1lICYmIG5hbWUuc3BsaXQoJy8nKSB8fCBbXTtcclxufTtcclxuXHJcbi8vIE1lcmdlIHR3byBhcnJheXMgb25lIGNvbnRhaW5pbmcga2V5cyBhbmQgb25lIHZhbHVlc1xyXG5fbWV0aG9kSFRUUC5jcmVhdGVPYmplY3QgPSBmdW5jdGlvbihrZXlzLCB2YWx1ZXMpIHtcclxuICB2YXIgcmVzdWx0ID0ge307XHJcbiAgaWYgKGtleXMgJiYgdmFsdWVzKSB7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgcmVzdWx0W2tleXNbaV1dID0gdmFsdWVzW2ldICYmIGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZXNbaV0pIHx8ICcnO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxuX21ldGhvZEhUVFAuYWRkVG9NZXRob2RUcmVlID0gZnVuY3Rpb24obWV0aG9kTmFtZSkge1xyXG4gIHZhciBsaXN0ID0gX21ldGhvZEhUVFAuZ2V0TmFtZUxpc3QobWV0aG9kTmFtZSk7XHJcbiAgdmFyIG5hbWUgPSAnLyc7XHJcbiAgLy8gQ29udGFpbnMgdGhlIGxpc3Qgb2YgcGFyYW1zIG5hbWVzXHJcbiAgdmFyIHBhcmFtcyA9IFtdO1xyXG4gIHZhciBjdXJyZW50TWV0aG9kVHJlZSA9IF9tZXRob2RIVFRQLm1ldGhvZFRyZWU7XHJcblxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xyXG5cclxuICAgIC8vIGdldCB0aGUga2V5IG5hbWVcclxuICAgIHZhciBrZXkgPSBsaXN0W2ldO1xyXG4gICAgLy8gQ2hlY2sgaWYgaXQgZXhwZWN0cyBhIHZhbHVlXHJcbiAgICBpZiAoa2V5WzBdID09PSAnOicpIHtcclxuICAgICAgLy8gVGhpcyBpcyBhIHZhbHVlXHJcbiAgICAgIHBhcmFtcy5wdXNoKGtleS5zbGljZSgxKSk7XHJcbiAgICAgIGtleSA9ICc6dmFsdWUnO1xyXG4gICAgfVxyXG4gICAgbmFtZSArPSBrZXkgKyAnLyc7XHJcblxyXG4gICAgLy8gU2V0IHRoZSBrZXkgaW50byB0aGUgbWV0aG9kIHRyZWVcclxuICAgIGlmICh0eXBlb2YgY3VycmVudE1ldGhvZFRyZWVba2V5XSA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgY3VycmVudE1ldGhvZFRyZWVba2V5XSA9IHt9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERpZyBkZWVwZXJcclxuICAgIGN1cnJlbnRNZXRob2RUcmVlID0gY3VycmVudE1ldGhvZFRyZWVba2V5XTtcclxuXHJcbiAgfVxyXG5cclxuICBpZiAoXy5pc0VtcHR5KGN1cnJlbnRNZXRob2RUcmVlWyc6cmVmJ10pKSB7XHJcbiAgICBjdXJyZW50TWV0aG9kVHJlZVsnOnJlZiddID0ge1xyXG4gICAgICBuYW1lOiBuYW1lLFxyXG4gICAgICBwYXJhbXM6IHBhcmFtc1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHJldHVybiBjdXJyZW50TWV0aG9kVHJlZVsnOnJlZiddO1xyXG59O1xyXG5cclxuLy8gVGhpcyBtZXRob2Qgc2hvdWxkIGJlIG9wdGltaXplZCBmb3Igc3BlZWQgc2luY2UgaXRzIGNhbGxlZCBvbiBhbGxtb3N0IGV2ZXJ5XHJcbi8vIGh0dHAgY2FsbCB0byB0aGUgc2VydmVyIHNvIHdlIHJldHVybiBudWxsIGFzIHNvb24gYXMgd2Uga25vdyBpdHMgbm90IGEgbWV0aG9kXHJcbl9tZXRob2RIVFRQLmdldE1ldGhvZCA9IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAvLyBDaGVjayBpZiB0aGVcclxuICBpZiAoIV9tZXRob2RIVFRQLm5hbWVGb2xsb3dzQ29udmVudGlvbnMobmFtZSkpIHtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuICB2YXIgbGlzdCA9IF9tZXRob2RIVFRQLmdldE5hbWVMaXN0KG5hbWUpO1xyXG4gIC8vIENoZWNrIGlmIHdlIGdvdCBhIGNvcnJlY3QgbGlzdFxyXG4gIGlmICghbGlzdCB8fCAhbGlzdC5sZW5ndGgpIHtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuICAvLyBTZXQgY3VycmVudCByZWZlcm5jZSBpbiB0aGUgX21ldGhvZEhUVFAubWV0aG9kVHJlZVxyXG4gIHZhciBjdXJyZW50TWV0aG9kVHJlZSA9IF9tZXRob2RIVFRQLm1ldGhvZFRyZWU7XHJcbiAgLy8gQnVmZmVyIGZvciB2YWx1ZXMgdG8gaGFuZCBvbiBsYXRlclxyXG4gIHZhciB2YWx1ZXMgPSBbXTtcclxuICAvLyBJdGVyYXRlIG92ZXIgdGhlIG1ldGhvZCBuYW1lIGFuZCBjaGVjayBpZiBpdHMgZm91bmQgaW4gdGhlIG1ldGhvZCB0cmVlXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAvLyBnZXQgdGhlIGtleSBuYW1lXHJcbiAgICB2YXIga2V5ID0gbGlzdFtpXTtcclxuICAgIC8vIFdlIGV4cGVjdCB0byBmaW5kIHRoZSBrZXkgb3IgOnZhbHVlIGlmIG5vdCB3ZSBicmVha1xyXG4gICAgaWYgKHR5cGVvZiBjdXJyZW50TWV0aG9kVHJlZVtrZXldICE9PSAndW5kZWZpbmVkJyB8fFxyXG4gICAgICAgICAgICB0eXBlb2YgY3VycmVudE1ldGhvZFRyZWVbJzp2YWx1ZSddICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAvLyBXZSBnb3QgYSByZXN1bHQgbm93IGNoZWNrIGlmIGl0cyBhIHZhbHVlXHJcbiAgICAgIGlmICh0eXBlb2YgY3VycmVudE1ldGhvZFRyZWVba2V5XSA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAvLyBQdXNoIHRoZSB2YWx1ZVxyXG4gICAgICAgIHZhbHVlcy5wdXNoKGtleSk7XHJcbiAgICAgICAgLy8gU2V0IHRoZSBrZXkgdG8gOnZhbHVlIHRvIGRpZyBkZWVwZXJcclxuICAgICAgICBrZXkgPSAnOnZhbHVlJztcclxuICAgICAgfVxyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIEJyZWFrIC0gbWV0aG9kIGNhbGwgbm90IGZvdW5kXHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERpZyBkZWVwZXJcclxuICAgIGN1cnJlbnRNZXRob2RUcmVlID0gY3VycmVudE1ldGhvZFRyZWVba2V5XTtcclxuICB9XHJcblxyXG4gIC8vIEV4dHJhY3QgcmVmZXJlbmNlIHBvaW50ZXJcclxuICB2YXIgcmVmZXJlbmNlID0gY3VycmVudE1ldGhvZFRyZWUgJiYgY3VycmVudE1ldGhvZFRyZWVbJzpyZWYnXTtcclxuICBpZiAodHlwZW9mIHJlZmVyZW5jZSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIG5hbWU6IHJlZmVyZW5jZS5uYW1lLFxyXG4gICAgICBwYXJhbXM6IF9tZXRob2RIVFRQLmNyZWF0ZU9iamVjdChyZWZlcmVuY2UucGFyYW1zLCB2YWx1ZXMpLFxyXG4gICAgICBoYW5kbGU6IF9tZXRob2RIVFRQLm1ldGhvZEhhbmRsZXJzW3JlZmVyZW5jZS5uYW1lXVxyXG4gICAgfTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gRGlkIG5vdCBnZXQgYW55IHJlZmVyZW5jZSB0byB0aGUgbWV0aG9kXHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcbn07XHJcblxyXG4vLyBUaGlzIG1ldGhvZCByZXRyaWV2ZXMgdGhlIHVzZXJJZCBmcm9tIHRoZSB0b2tlbiBhbmQgbWFrZXMgc3VyZSB0aGF0IHRoZSB0b2tlblxyXG4vLyBpcyB2YWxpZCBhbmQgbm90IGV4cGlyZWRcclxuX21ldGhvZEhUVFAuZ2V0VXNlcklkID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAvLyAvLyBHZXQgaXAsIHgtZm9yd2FyZGVkLWZvciBjYW4gYmUgY29tbWEgc2VwZXJhdGVkIGlwcyB3aGVyZSB0aGUgZmlyc3QgaXMgdGhlXHJcbiAgLy8gLy8gY2xpZW50IGlwXHJcbiAgLy8gdmFyIGlwID0gc2VsZi5yZXEuaGVhZGVyc1sneC1mb3J3YXJkZWQtZm9yJ10gJiZcclxuICAvLyAgICAgICAgIC8vIFJldHVybiB0aGUgZmlyc3QgaXRlbSBpbiBpcCBsaXN0XHJcbiAgLy8gICAgICAgICBzZWxmLnJlcS5oZWFkZXJzWyd4LWZvcndhcmRlZC1mb3InXS5zcGxpdCgnLCcpWzBdIHx8XHJcbiAgLy8gICAgICAgICAvLyBvciByZXR1cm4gdGhlIHJlbW90ZUFkZHJlc3NcclxuICAvLyAgICAgICAgIHNlbGYucmVxLmNvbm5lY3Rpb24ucmVtb3RlQWRkcmVzcztcclxuXHJcbiAgLy8gQ2hlY2sgYXV0aGVudGljYXRpb25cclxuICB2YXIgdXNlclRva2VuID0gc2VsZi5xdWVyeS50b2tlbjtcclxuXHJcbiAgLy8gQ2hlY2sgaWYgd2UgYXJlIGhhbmRlZCBzdHJpbmdzXHJcbiAgdHJ5IHtcclxuICAgIHVzZXJUb2tlbiAmJiBjaGVjayh1c2VyVG9rZW4sIFN0cmluZyk7XHJcbiAgfSBjYXRjaChlcnIpIHtcclxuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDA0LCAnRXJyb3IgdXNlciB0b2tlbiBhbmQgaWQgbm90IG9mIHR5cGUgc3RyaW5ncywgRXJyb3I6ICcgKyAoZXJyLnN0YWNrIHx8IGVyci5tZXNzYWdlKSk7XHJcbiAgfVxyXG5cclxuICAvLyBTZXQgdGhlIHRoaXMudXNlcklkXHJcbiAgaWYgKHVzZXJUb2tlbikge1xyXG4gICAgLy8gTG9vayB1cCB1c2VyIHRvIGNoZWNrIGlmIHVzZXIgZXhpc3RzIGFuZCBpcyBsb2dnZWRpbiB2aWEgdG9rZW5cclxuICAgIHZhciB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUoe1xyXG4gICAgICAgICRvcjogW1xyXG4gICAgICAgICAgeydzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMuaGFzaGVkVG9rZW4nOiBBY2NvdW50cy5faGFzaExvZ2luVG9rZW4odXNlclRva2VuKX0sXHJcbiAgICAgICAgICB7J3NlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy50b2tlbic6IHVzZXJUb2tlbn1cclxuICAgICAgICBdXHJcbiAgICAgIH0pO1xyXG4gICAgLy8gVE9ETzogY2hlY2sgJ3NlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy53aGVuJyB0byBoYXZlIHRoZSB0b2tlbiBleHBpcmVcclxuXHJcbiAgICAvLyBTZXQgdGhlIHVzZXJJZCBpbiB0aGUgc2NvcGVcclxuICAgIHJldHVybiB1c2VyICYmIHVzZXIuX2lkO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG51bGw7XHJcbn07XHJcblxyXG4vLyBFeHBvc2UgdGhlIGRlZmF1bHQgYXV0aCBmb3IgY2FsbGluZyBmcm9tIGN1c3RvbSBhdXRoZW50aWNhdGlvbiBoYW5kbGVycy5cclxuSFRUUC5kZWZhdWx0QXV0aCA9IF9tZXRob2RIVFRQLmdldFVzZXJJZDtcclxuXHJcbi8qXHJcblxyXG5BZGQgZGVmYXVsdCBzdXBwb3J0IGZvciBvcHRpb25zXHJcblxyXG4qL1xyXG5fbWV0aG9kSFRUUC5kZWZhdWx0T3B0aW9uc0hhbmRsZXIgPSBmdW5jdGlvbihtZXRob2RPYmplY3QpIHtcclxuICAvLyBMaXN0IG9mIHN1cHBvcnRlZCBtZXRob2RzXHJcbiAgdmFyIGFsbG93TWV0aG9kcyA9IFtdO1xyXG4gIC8vIFRoZSBmaW5hbCByZXN1bHQgb2JqZWN0XHJcbiAgdmFyIHJlc3VsdCA9IHt9O1xyXG5cclxuICAvLyBJdGVyYXRlIG92ZXIgdGhlIG1ldGhvZHNcclxuICAvLyBYWFg6IFdlIHNob3VsZCBoYXZlIGEgd2F5IHRvIGV4dGVuZCB0aGlzIC0gV2Ugc2hvdWxkIGhhdmUgc29tZSBzY2hlbWEgbW9kZWxcclxuICAvLyBmb3Igb3VyIG1ldGhvZHMuLi5cclxuICBfLmVhY2gobWV0aG9kT2JqZWN0LCBmdW5jdGlvbihmLCBtZXRob2ROYW1lKSB7XHJcbiAgICAvLyBTa2lwIHRoZSBzdHJlYW0gYW5kIGF1dGggZnVuY3Rpb25zIC0gdGhleSBhcmUgbm90IHB1YmxpYyAvIGFjY2Vzc2libGVcclxuICAgIGlmIChtZXRob2ROYW1lICE9PSAnc3RyZWFtJyAmJiBtZXRob2ROYW1lICE9PSAnYXV0aCcpIHtcclxuXHJcbiAgICAgIC8vIENyZWF0ZSBhbiBlbXB0eSBkZXNjcmlwdGlvblxyXG4gICAgICByZXN1bHRbbWV0aG9kTmFtZV0gPSB7IGRlc2NyaXB0aW9uOiAnJywgcGFyYW1ldGVyczoge30gfTtcclxuICAgICAgLy8gQWRkIG1ldGhvZCBuYW1lIHRvIGhlYWRlcnNcclxuICAgICAgYWxsb3dNZXRob2RzLnB1c2gobWV0aG9kTmFtZSk7XHJcblxyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvLyBMZXRzIHBsYXkgbmljZVxyXG4gIHRoaXMuc2V0U3RhdHVzQ29kZSgyMDApO1xyXG5cclxuICAvLyBXZSBoYXZlIHRvIHNldCBzb21lIGFsbG93IGhlYWRlcnMgaGVyZVxyXG4gIHRoaXMuYWRkSGVhZGVyKCdBbGxvdycsIGFsbG93TWV0aG9kcy5qb2luKCcsJykpO1xyXG5cclxuICAvLyBSZXR1cm4ganNvbiByZXN1bHQgLSBQcmV0dHkgcHJpbnRcclxuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkocmVzdWx0LCBudWxsLCAnXFx0Jyk7XHJcbn07XHJcblxyXG4vLyBQdWJsaWMgaW50ZXJmYWNlIGZvciBhZGRpbmcgc2VydmVyLXNpZGUgaHR0cCBtZXRob2RzIC0gaWYgc2V0dGluZyBhIG1ldGhvZCB0b1xyXG4vLyAnZmFsc2UnIGl0IHdvdWxkIGFjdHVhbGx5IHJlbW92ZSB0aGUgbWV0aG9kIChjYW4gYmUgdXNlZCB0byB1bnB1Ymxpc2ggYSBtZXRob2QpXHJcbkhUVFAubWV0aG9kcyA9IGZ1bmN0aW9uKG5ld01ldGhvZHMpIHtcclxuICBfLmVhY2gobmV3TWV0aG9kcywgZnVuY3Rpb24oZnVuYywgbmFtZSkge1xyXG4gICAgaWYgKF9tZXRob2RIVFRQLm5hbWVGb2xsb3dzQ29udmVudGlvbnMobmFtZSkpIHtcclxuICAgICAgLy8gQ2hlY2sgaWYgd2UgZ290IGEgZnVuY3Rpb25cclxuICAgICAgLy9pZiAodHlwZW9mIGZ1bmMgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICB2YXIgbWV0aG9kID0gX21ldGhvZEhUVFAuYWRkVG9NZXRob2RUcmVlKG5hbWUpO1xyXG4gICAgICAgIC8vIFRoZSBmdW5jIGlzIGdvb2RcclxuICAgICAgICBpZiAodHlwZW9mIF9tZXRob2RIVFRQLm1ldGhvZEhhbmRsZXJzW21ldGhvZC5uYW1lXSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgIGlmIChmdW5jID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAvLyBJZiB0aGUgbWV0aG9kIGlzIHNldCB0byBmYWxzZSB0aGVuIHVucHVibGlzaFxyXG4gICAgICAgICAgICBkZWxldGUgX21ldGhvZEhUVFAubWV0aG9kSGFuZGxlcnNbbWV0aG9kLm5hbWVdO1xyXG4gICAgICAgICAgICAvLyBEZWxldGUgdGhlIHJlZmVyZW5jZSBpbiB0aGUgX21ldGhvZEhUVFAubWV0aG9kVHJlZVxyXG4gICAgICAgICAgICBkZWxldGUgbWV0aG9kLm5hbWU7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBtZXRob2QucGFyYW1zO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gV2Ugc2hvdWxkIG5vdCBhbGxvdyBvdmVyd3JpdGluZyAtIGZvbGxvd2luZyBNZXRlb3IubWV0aG9kc1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0hUVFAgbWV0aG9kIFwiJyArIG5hbWUgKyAnXCIgaXMgYWxyZWFkeSByZWdpc3RlcmVkJyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIC8vIFdlIGNvdWxkIGhhdmUgYSBmdW5jdGlvbiBvciBhIG9iamVjdFxyXG4gICAgICAgICAgLy8gVGhlIG9iamVjdCBjb3VsZCBoYXZlOlxyXG4gICAgICAgICAgLy8gJy90ZXN0Lyc6IHtcclxuICAgICAgICAgIC8vICAgYXV0aDogZnVuY3Rpb24oKSAuLi4gcmV0dXJuaW5nIHRoZSB1c2VySWQgdXNpbmcgb3ZlciBkZWZhdWx0XHJcbiAgICAgICAgICAvL1xyXG4gICAgICAgICAgLy8gICBtZXRob2Q6IGZ1bmN0aW9uKCkgLi4uXHJcbiAgICAgICAgICAvLyAgIG9yXHJcbiAgICAgICAgICAvLyAgIHBvc3Q6IGZ1bmN0aW9uKCkgLi4uXHJcbiAgICAgICAgICAvLyAgIHB1dDpcclxuICAgICAgICAgIC8vICAgZ2V0OlxyXG4gICAgICAgICAgLy8gICBkZWxldGU6XHJcbiAgICAgICAgICAvLyAgIGhlYWQ6XHJcbiAgICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgICAgLypcclxuICAgICAgICAgIFdlIGNvbmZvcm0gdG8gdGhlIG9iamVjdCBmb3JtYXQ6XHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGF1dGg6XHJcbiAgICAgICAgICAgIHBvc3Q6XHJcbiAgICAgICAgICAgIHB1dDpcclxuICAgICAgICAgICAgZ2V0OlxyXG4gICAgICAgICAgICBkZWxldGU6XHJcbiAgICAgICAgICAgIGhlYWQ6XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBUaGlzIHdheSB3ZSBoYXZlIGEgdW5pZm9ybSByZWZlcmVuY2VcclxuICAgICAgICAgICovXHJcblxyXG4gICAgICAgICAgdmFyIHVuaU9iaiA9IHt9O1xyXG4gICAgICAgICAgaWYgKHR5cGVvZiBmdW5jID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHVuaU9iaiA9IHtcclxuICAgICAgICAgICAgICAnYXV0aCc6IF9tZXRob2RIVFRQLmdldFVzZXJJZCxcclxuICAgICAgICAgICAgICAnc3RyZWFtJzogZmFsc2UsXHJcbiAgICAgICAgICAgICAgJ1BPU1QnOiBmdW5jLFxyXG4gICAgICAgICAgICAgICdQVVQnOiBmdW5jLFxyXG4gICAgICAgICAgICAgICdHRVQnOiBmdW5jLFxyXG4gICAgICAgICAgICAgICdERUxFVEUnOiBmdW5jLFxyXG4gICAgICAgICAgICAgICdIRUFEJzogZnVuYyxcclxuICAgICAgICAgICAgICAnT1BUSU9OUyc6IF9tZXRob2RIVFRQLmRlZmF1bHRPcHRpb25zSGFuZGxlclxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdW5pT2JqID0ge1xyXG4gICAgICAgICAgICAgICdzdHJlYW0nOiBmdW5jLnN0cmVhbSB8fCBmYWxzZSxcclxuICAgICAgICAgICAgICAnYXV0aCc6IGZ1bmMuYXV0aCB8fCBfbWV0aG9kSFRUUC5nZXRVc2VySWQsXHJcbiAgICAgICAgICAgICAgJ1BPU1QnOiBmdW5jLnBvc3QgfHwgZnVuYy5tZXRob2QsXHJcbiAgICAgICAgICAgICAgJ1BVVCc6IGZ1bmMucHV0IHx8IGZ1bmMubWV0aG9kLFxyXG4gICAgICAgICAgICAgICdHRVQnOiBmdW5jLmdldCB8fCBmdW5jLm1ldGhvZCxcclxuICAgICAgICAgICAgICAnREVMRVRFJzogZnVuYy5kZWxldGUgfHwgZnVuYy5tZXRob2QsXHJcbiAgICAgICAgICAgICAgJ0hFQUQnOiBmdW5jLmhlYWQgfHwgZnVuYy5nZXQgfHwgZnVuYy5tZXRob2QsXHJcbiAgICAgICAgICAgICAgJ09QVElPTlMnOiBmdW5jLm9wdGlvbnMgfHwgX21ldGhvZEhUVFAuZGVmYXVsdE9wdGlvbnNIYW5kbGVyXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gUmVnaXN0cmUgdGhlIG1ldGhvZFxyXG4gICAgICAgICAgX21ldGhvZEhUVFAubWV0aG9kSGFuZGxlcnNbbWV0aG9kLm5hbWVdID0gdW5pT2JqOyAvLyBmdW5jO1xyXG5cclxuICAgICAgICB9XHJcbiAgICAgIC8vIH0gZWxzZSB7XHJcbiAgICAgIC8vICAgLy8gV2UgZG8gcmVxdWlyZSBhIGZ1bmN0aW9uIGFzIGEgZnVuY3Rpb24gdG8gZXhlY3V0ZSBsYXRlclxyXG4gICAgICAvLyAgIHRocm93IG5ldyBFcnJvcignSFRUUC5tZXRob2RzIGZhaWxlZDogJyArIG5hbWUgKyAnIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XHJcbiAgICAgIC8vIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIFdlIGhhdmUgdG8gZm9sbG93IHRoZSBuYW1pbmcgc3BlYyBkZWZpbmVkIGluIG5hbWVGb2xsb3dzQ29udmVudGlvbnNcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdIVFRQLm1ldGhvZCBcIicgKyBuYW1lICsgJ1wiIGludmFsaWQgbmFtaW5nIG9mIG1ldGhvZCcpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59O1xyXG5cclxudmFyIHNlbmRFcnJvciA9IGZ1bmN0aW9uKHJlcywgY29kZSwgbWVzc2FnZSkge1xyXG4gIGlmIChjb2RlKSB7XHJcbiAgICByZXMud3JpdGVIZWFkKGNvZGUpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXMud3JpdGVIZWFkKDUwMCk7XHJcbiAgfVxyXG4gIHJlcy5lbmQobWVzc2FnZSk7XHJcbn07XHJcblxyXG4vLyBUaGlzIGhhbmRsZXIgY29sbGVjdHMgdGhlIGhlYWRlciBkYXRhIGludG8gZWl0aGVyIGFuIG9iamVjdCAoaWYganNvbikgb3IgdGhlXHJcbi8vIHJhdyBkYXRhLiBUaGUgZGF0YSBpcyBwYXNzZWQgdG8gdGhlIGNhbGxiYWNrXHJcbnZhciByZXF1ZXN0SGFuZGxlciA9IGZ1bmN0aW9uKHJlcSwgcmVzLCBjYWxsYmFjaykge1xyXG4gIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgLy8gQ29udGFpbmVyIGZvciBidWZmZXJzIGFuZCBhIHN1bSBvZiB0aGUgbGVuZ3RoXHJcbiAgdmFyIGJ1ZmZlckRhdGEgPSBbXSwgZGF0YUxlbiA9IDA7XHJcblxyXG4gIC8vIEV4dHJhY3QgdGhlIGJvZHlcclxuICByZXEub24oJ2RhdGEnLCBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICBidWZmZXJEYXRhLnB1c2goZGF0YSk7XHJcbiAgICBkYXRhTGVuICs9IGRhdGEubGVuZ3RoO1xyXG5cclxuICAgIC8vIFdlIGhhdmUgdG8gY2hlY2sgdGhlIGRhdGEgbGVuZ3RoIGluIG9yZGVyIHRvIHNwYXJlIHRoZSBzZXJ2ZXJcclxuICAgIGlmIChkYXRhTGVuID4gSFRUUC5tZXRob2RzTWF4RGF0YUxlbmd0aCkge1xyXG4gICAgICBkYXRhTGVuID0gMDtcclxuICAgICAgYnVmZmVyRGF0YSA9IFtdO1xyXG4gICAgICAvLyBGbG9vZCBhdHRhY2sgb3IgZmF1bHR5IGNsaWVudFxyXG4gICAgICBzZW5kRXJyb3IocmVzLCA0MTMsICdGbG9vZCBhdHRhY2sgb3IgZmF1bHR5IGNsaWVudCcpO1xyXG4gICAgICByZXEuY29ubmVjdGlvbi5kZXN0cm95KCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8vIFdoZW4gbWVzc2FnZSBpcyByZWFkeSB0byBiZSBwYXNzZWQgb25cclxuICByZXEub24oJ2VuZCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgaWYgKHJlcy5maW5pc2hlZCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWxsb3cgdGhlIHJlc3VsdCB0byBiZSB1bmRlZmluZWQgaWYgc29cclxuICAgIHZhciByZXN1bHQ7XHJcblxyXG4gICAgLy8gSWYgZGF0YSBmb3VuZCB0aGUgd29yayBpdCAtIGVpdGhlciBidWZmZXIgb3IganNvblxyXG4gICAgaWYgKGRhdGFMZW4gPiAwKSB7XHJcbiAgICAgIHJlc3VsdCA9IG5ldyBCdWZmZXIoZGF0YUxlbik7XHJcbiAgICAgIC8vIE1lcmdlIHRoZSBjaHVua3MgaW50byBvbmUgYnVmZmVyXHJcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsbiA9IGJ1ZmZlckRhdGEubGVuZ3RoLCBwb3MgPSAwOyBpIDwgbG47IGkrKykge1xyXG4gICAgICAgIGJ1ZmZlckRhdGFbaV0uY29weShyZXN1bHQsIHBvcyk7XHJcbiAgICAgICAgcG9zICs9IGJ1ZmZlckRhdGFbaV0ubGVuZ3RoO1xyXG4gICAgICAgIGRlbGV0ZSBidWZmZXJEYXRhW2ldO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIENoZWNrIGlmIHdlIGNvdWxkIGJlIGRlYWxpbmcgd2l0aCBqc29uXHJcbiAgICAgIGlmIChyZXN1bHRbMF0gPT0gMHg3YiAmJiByZXN1bHRbMV0gPT09IDB4MjIpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgLy8gQ29udmVydCB0aGUgYm9keSBpbnRvIGpzb24gYW5kIGV4dHJhY3QgdGhlIGRhdGEgb2JqZWN0XHJcbiAgICAgICAgICByZXN1bHQgPSBFSlNPTi5wYXJzZShyZXN1bHQudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgfSBjYXRjaChlcnIpIHtcclxuICAgICAgICAgIC8vIENvdWxkIG5vdCBwYXJzZSBzbyB3ZSByZXR1cm4gdGhlIHJhdyBkYXRhXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9IC8vIEVsc2UgcmVzdWx0IHdpbGwgYmUgdW5kZWZpbmVkXHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgY2FsbGJhY2socmVzdWx0KTtcclxuICAgIH0gY2F0Y2goZXJyKSB7XHJcbiAgICAgIHNlbmRFcnJvcihyZXMsIDUwMCwgJ0Vycm9yIGluIHJlcXVlc3RIYW5kbGVyIGNhbGxiYWNrLCBFcnJvcjogJyArIChlcnIuc3RhY2sgfHwgZXJyLm1lc3NhZ2UpICk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG59O1xyXG5cclxuLy8gVGhpcyBpcyB0aGUgc2ltcGxlc3QgaGFuZGxlciAtIGl0IHNpbXBseSBwYXNzZXMgcmVxIHN0cmVhbSBhcyBkYXRhIHRvIHRoZVxyXG4vLyBtZXRob2RcclxudmFyIHN0cmVhbUhhbmRsZXIgPSBmdW5jdGlvbihyZXEsIHJlcywgY2FsbGJhY2spIHtcclxuICB0cnkge1xyXG4gICAgY2FsbGJhY2soKTtcclxuICB9IGNhdGNoKGVycikge1xyXG4gICAgc2VuZEVycm9yKHJlcywgNTAwLCAnRXJyb3IgaW4gcmVxdWVzdEhhbmRsZXIgY2FsbGJhY2ssIEVycm9yOiAnICsgKGVyci5zdGFjayB8fCBlcnIubWVzc2FnZSkgKTtcclxuICB9XHJcbn07XHJcblxyXG4vKlxyXG4gIEFsbG93IGZpbGUgdXBsb2FkcyBpbiBjb3Jkb3ZhIGNmc1xyXG4qL1xyXG52YXIgc2V0Q29yZG92YUhlYWRlcnMgPSBmdW5jdGlvbihyZXF1ZXN0LCByZXNwb25zZSkge1xyXG4gIHZhciBvcmlnaW4gPSByZXF1ZXN0LmhlYWRlcnMub3JpZ2luO1xyXG4gIC8vIE1hdGNoIGh0dHA6Ly9sb2NhbGhvc3Q6PHBvcnQ+IGZvciBDb3Jkb3ZhIGNsaWVudHMgaW4gTWV0ZW9yIDEuM1xyXG4gIC8vIGFuZCBodHRwOi8vbWV0ZW9yLmxvY2FsIGZvciBlYXJsaWVyIHZlcnNpb25zXHJcbiAgaWYgKG9yaWdpbiAmJiAob3JpZ2luID09PSAnaHR0cDovL21ldGVvci5sb2NhbCcgfHwgL15odHRwOlxcL1xcL2xvY2FsaG9zdC8udGVzdChvcmlnaW4pKSkge1xyXG4gICAgLy8gV2UgbmVlZCB0byBlY2hvIHRoZSBvcmlnaW4gcHJvdmlkZWQgaW4gdGhlIHJlcXVlc3RcclxuICAgIHJlc3BvbnNlLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiLCBvcmlnaW4pO1xyXG5cclxuICAgIHJlc3BvbnNlLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHNcIiwgXCJQVVRcIik7XHJcbiAgICByZXNwb25zZS5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCIsIFwiQ29udGVudC1UeXBlXCIpO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIEhhbmRsZSB0aGUgYWN0dWFsIGNvbm5lY3Rpb25cclxuV2ViQXBwLmNvbm5lY3RIYW5kbGVycy51c2UoZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcclxuXHJcbiAgLy8gQ2hlY2sgdG8gc2UgaWYgdGhpcyBpcyBhIGh0dHAgbWV0aG9kIGNhbGxcclxuICB2YXIgbWV0aG9kID0gX21ldGhvZEhUVFAuZ2V0TWV0aG9kKHJlcS5fcGFyc2VkVXJsLnBhdGhuYW1lKTtcclxuXHJcbiAgLy8gSWYgbWV0aG9kIGlzIG51bGwgdGhlbiBpdCB3YXNuJ3QgYW5kIHdlIHBhc3MgdGhlIHJlcXVlc3QgYWxvbmdcclxuICBpZiAobWV0aG9kID09PSBudWxsKSB7XHJcbiAgICByZXR1cm4gbmV4dCgpO1xyXG4gIH1cclxuXHJcbiAgdmFyIGRhdGFIYW5kbGUgPSAobWV0aG9kLmhhbmRsZSAmJiBtZXRob2QuaGFuZGxlLnN0cmVhbSk/c3RyZWFtSGFuZGxlcjpyZXF1ZXN0SGFuZGxlcjtcclxuXHJcbiAgZGF0YUhhbmRsZShyZXEsIHJlcywgZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgLy8gSWYgbWV0aG9kc0hhbmRsZXIgbm90IGZvdW5kIG9yIHNvbWVob3cgdGhlIG1ldGhvZHNoYW5kbGVyIGlzIG5vdCBhXHJcbiAgICAvLyBmdW5jdGlvbiB0aGVuIHJldHVybiBhIDQwNFxyXG4gICAgaWYgKHR5cGVvZiBtZXRob2QuaGFuZGxlID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICBzZW5kRXJyb3IocmVzLCA0MDQsICdFcnJvciBIVFRQIG1ldGhvZCBoYW5kbGVyIFwiJyArIG1ldGhvZC5uYW1lICsgJ1wiIGlzIG5vdCBmb3VuZCcpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2V0IENPUlMgaGVhZGVycyBmb3IgTWV0ZW9yIENvcmRvdmEgY2xpZW50c1xyXG4gICAgc2V0Q29yZG92YUhlYWRlcnMocmVxLCByZXMpO1xyXG5cclxuICAgIC8vIFNldCBmaWJlciBzY29wZVxyXG4gICAgdmFyIGZpYmVyU2NvcGUgPSB7XHJcbiAgICAgIC8vIFBvaW50ZXJzIHRvIFJlcXVlc3QgLyBSZXNwb25zZVxyXG4gICAgICByZXE6IHJlcSxcclxuICAgICAgcmVzOiByZXMsXHJcbiAgICAgIC8vIFJlcXVlc3QgLyBSZXNwb25zZSBoZWxwZXJzXHJcbiAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgbWV0aG9kOiByZXEubWV0aG9kLFxyXG4gICAgICAvLyBIZWFkZXJzIGZvciByZXNwb25zZVxyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICd0ZXh0L2h0bWwnICAvLyBTZXQgZGVmYXVsdCB0eXBlXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIEFyZ3VtZW50c1xyXG4gICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICBxdWVyeTogcmVxLnF1ZXJ5LFxyXG4gICAgICBwYXJhbXM6IG1ldGhvZC5wYXJhbXMsXHJcbiAgICAgIC8vIE1ldGhvZCByZWZlcmVuY2VcclxuICAgICAgcmVmZXJlbmNlOiBtZXRob2QubmFtZSxcclxuICAgICAgbWV0aG9kT2JqZWN0OiBtZXRob2QuaGFuZGxlLFxyXG4gICAgICBfc3RyZWFtc1dhaXRpbmc6IDBcclxuICAgIH07XHJcblxyXG4gICAgLy8gSGVscGVyIGZ1bmN0aW9ucyB0aGlzIHNjb3BlXHJcbiAgICBGaWJlciA9IHJlcXVpcmUoJ2ZpYmVycycpO1xyXG4gICAgcnVuU2VydmVyTWV0aG9kID0gRmliZXIoZnVuY3Rpb24oc2VsZikge1xyXG4gICAgICB2YXIgcmVzdWx0LCByZXN1bHRCdWZmZXI7XHJcblxyXG4gICAgICAvLyBXZSBmZXRjaCBtZXRob2RzIGRhdGEgZnJvbSBtZXRob2RzSGFuZGxlciwgdGhlIGhhbmRsZXIgdXNlcyB0aGUgdGhpcy5hZGRJdGVtKClcclxuICAgICAgLy8gZnVuY3Rpb24gdG8gcG9wdWxhdGUgdGhlIG1ldGhvZHMsIHRoaXMgd2F5IHdlIGhhdmUgYmV0dGVyIGNoZWNrIGNvbnRyb2wgYW5kXHJcbiAgICAgIC8vIGJldHRlciBlcnJvciBoYW5kbGluZyArIG1lc3NhZ2VzXHJcblxyXG4gICAgICAvLyBUaGUgc2NvcGUgZm9yIHRoZSB1c2VyIG1ldGhvZE9iamVjdCBjYWxsYmFja3NcclxuICAgICAgdmFyIHRoaXNTY29wZSA9IHtcclxuICAgICAgICAvLyBUaGUgdXNlciB3aG9zIGlkIGFuZCB0b2tlbiB3YXMgdXNlZCB0byBydW4gdGhpcyBtZXRob2QsIGlmIHNldC9mb3VuZFxyXG4gICAgICAgIHVzZXJJZDogbnVsbCxcclxuICAgICAgICAvLyBUaGUgaWQgb2YgdGhlIGRhdGFcclxuICAgICAgICBfaWQ6IG51bGwsXHJcbiAgICAgICAgLy8gU2V0IHRoZSBxdWVyeSBwYXJhbXMgP3Rva2VuPTEmaWQ9MiAtPiB7IHRva2VuOiAxLCBpZDogMiB9XHJcbiAgICAgICAgcXVlcnk6IHNlbGYucXVlcnksXHJcbiAgICAgICAgLy8gU2V0IHBhcmFtcyAvZm9vLzpuYW1lL3Rlc3QvOmlkIC0+IHsgbmFtZTogJycsIGlkOiAnJyB9XHJcbiAgICAgICAgcGFyYW1zOiBzZWxmLnBhcmFtcyxcclxuICAgICAgICAvLyBNZXRob2QgR0VULCBQVVQsIFBPU1QsIERFTEVURSwgSEVBRFxyXG4gICAgICAgIG1ldGhvZDogc2VsZi5tZXRob2QsXHJcbiAgICAgICAgLy8gVXNlciBhZ2VudFxyXG4gICAgICAgIHVzZXJBZ2VudDogcmVxLmhlYWRlcnNbJ3VzZXItYWdlbnQnXSxcclxuICAgICAgICAvLyBBbGwgcmVxdWVzdCBoZWFkZXJzXHJcbiAgICAgICAgcmVxdWVzdEhlYWRlcnM6IHJlcS5oZWFkZXJzLFxyXG4gICAgICAgIC8vIEFkZCB0aGUgcmVxdWVzdCBvYmplY3QgaXQgc2VsZlxyXG4gICAgICAgIHJlcXVlc3Q6IHJlcSxcclxuICAgICAgICAvLyBTZXQgdGhlIHVzZXJJZFxyXG4gICAgICAgIHNldFVzZXJJZDogZnVuY3Rpb24oaWQpIHtcclxuICAgICAgICAgIHRoaXMudXNlcklkID0gaWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvLyBXZSBkb250IHNpbXVsYXRlIC8gcnVuIHRoaXMgb24gdGhlIGNsaWVudCBhdCB0aGUgbW9tZW50XHJcbiAgICAgICAgaXNTaW11bGF0aW9uOiBmYWxzZSxcclxuICAgICAgICAvLyBSdW4gdGhlIG5leHQgbWV0aG9kIGluIGEgbmV3IGZpYmVyIC0gVGhpcyBpcyBkZWZhdWx0IGF0IHRoZSBtb21lbnRcclxuICAgICAgICB1bmJsb2NrOiBmdW5jdGlvbigpIHt9LFxyXG4gICAgICAgIC8vIFNldCB0aGUgY29udGVudCB0eXBlIGluIGhlYWRlciwgZGVmYXVsdHMgdG8gdGV4dC9odG1sP1xyXG4gICAgICAgIHNldENvbnRlbnRUeXBlOiBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICAgICAgICBzZWxmLmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0gdHlwZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldFN0YXR1c0NvZGU6IGZ1bmN0aW9uKGNvZGUpIHtcclxuICAgICAgICAgIHNlbGYuc3RhdHVzQ29kZSA9IGNvZGU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBhZGRIZWFkZXI6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgIHNlbGYuaGVhZGVyc1trZXldID0gdmFsdWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjcmVhdGVSZWFkU3RyZWFtOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHNlbGYuX3N0cmVhbXNXYWl0aW5nKys7XHJcbiAgICAgICAgICByZXR1cm4gcmVxO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY3JlYXRlV3JpdGVTdHJlYW06IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgc2VsZi5fc3RyZWFtc1dhaXRpbmcrKztcclxuICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBFcnJvcjogZnVuY3Rpb24oZXJyKSB7XHJcblxyXG4gICAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIE1ldGVvci5FcnJvcikge1xyXG4gICAgICAgICAgICAvLyBSZXR1cm4gY29udHJvbGxlZCBlcnJvclxyXG4gICAgICAgICAgICBzZW5kRXJyb3IocmVzLCBlcnIuZXJyb3IsIGVyci5tZXNzYWdlKTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAoZXJyIGluc3RhbmNlb2YgRXJyb3IpIHtcclxuICAgICAgICAgICAgLy8gUmV0dXJuIGVycm9yIHRyYWNlIC0gdGhpcyBpcyBub3QgaW50ZW50ZWRcclxuICAgICAgICAgICAgc2VuZEVycm9yKHJlcywgNTAzLCAnRXJyb3IgaW4gbWV0aG9kIFwiJyArIHNlbGYucmVmZXJlbmNlICsgJ1wiLCBFcnJvcjogJyArIChlcnIuc3RhY2sgfHwgZXJyLm1lc3NhZ2UpICk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzZW5kRXJyb3IocmVzLCA1MDMsICdFcnJvciBpbiBtZXRob2QgXCInICsgc2VsZi5yZWZlcmVuY2UgKyAnXCInICk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLy8gZ2V0RGF0YTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgLy8gICAvLyBYWFg6IFRPRE8gaWYgd2UgY291bGQgcnVuIHRoZSByZXF1ZXN0IGhhbmRsZXIgc3R1ZmYgZWcuXHJcbiAgICAgICAgLy8gICAvLyBpbiBoZXJlIGluIGEgZmliZXIgc3luYyBpdCBjb3VsZCBiZSBjb29sIC0gYW5kIHRoZSB1c2VyIGRpZFxyXG4gICAgICAgIC8vICAgLy8gbm90IGhhdmUgdG8gc3BlY2lmeSB0aGUgc3RyZWFtPXRydWUgZmxhZz9cclxuICAgICAgICAvLyB9XHJcbiAgICAgIH07XHJcblxyXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIHNlbmRzIHRoZSBmaW5hbCByZXNwb25zZS4gRGVwZW5kaW5nIG9uIHRoZVxyXG4gICAgICAvLyB0aW1pbmcgb2YgdGhlIHN0cmVhbWluZywgd2UgbWlnaHQgaGF2ZSB0byB3YWl0IGZvciBhbGxcclxuICAgICAgLy8gc3RyZWFtaW5nIHRvIGVuZCwgb3Igd2UgbWlnaHQgaGF2ZSB0byB3YWl0IGZvciB0aGlzIGZ1bmN0aW9uXHJcbiAgICAgIC8vIHRvIGZpbmlzaCBhZnRlciBzdHJlYW1pbmcgZW5kcy4gVGhlIGNoZWNrcyBpbiB0aGlzIGZ1bmN0aW9uXHJcbiAgICAgIC8vIGFuZCB0aGUgZmFjdCB0aGF0IHdlIGNhbGwgaXQgdHdpY2UgZW5zdXJlIHRoYXQgd2Ugd2lsbCBhbHdheXNcclxuICAgICAgLy8gc2VuZCB0aGUgcmVzcG9uc2UgaWYgd2UgaGF2ZW4ndCBzZW50IGFuIGVycm9yIHJlc3BvbnNlLCBidXRcclxuICAgICAgLy8gd2Ugd2lsbCBub3Qgc2VuZCBpdCB0b28gZWFybHkuXHJcbiAgICAgIGZ1bmN0aW9uIHNlbmRSZXNwb25zZUlmRG9uZSgpIHtcclxuICAgICAgICByZXMuc3RhdHVzQ29kZSA9IHNlbGYuc3RhdHVzQ29kZTtcclxuICAgICAgICAvLyBJZiBubyBzdHJlYW1zIGFyZSB3YWl0aW5nXHJcbiAgICAgICAgaWYgKHNlbGYuX3N0cmVhbXNXYWl0aW5nID09PSAwICYmXHJcbiAgICAgICAgICAgIChzZWxmLnN0YXR1c0NvZGUgPT09IDIwMCB8fCBzZWxmLnN0YXR1c0NvZGUgPT09IDIwNikgJiZcclxuICAgICAgICAgICAgc2VsZi5kb25lICYmXHJcbiAgICAgICAgICAgICFzZWxmLl9yZXNwb25zZVNlbnQgJiZcclxuICAgICAgICAgICAgIXJlcy5maW5pc2hlZCkge1xyXG4gICAgICAgICAgc2VsZi5fcmVzcG9uc2VTZW50ID0gdHJ1ZTtcclxuICAgICAgICAgIHJlcy5lbmQocmVzdWx0QnVmZmVyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBtZXRob2RDYWxsID0gc2VsZi5tZXRob2RPYmplY3Rbc2VsZi5tZXRob2RdO1xyXG5cclxuICAgICAgLy8gSWYgdGhlIG1ldGhvZCBjYWxsIGlzIHNldCBmb3IgdGhlIFBPU1QvUFVUL0dFVCBvciBERUxFVEUgdGhlbiBydW4gdGhlXHJcbiAgICAgIC8vIHJlc3BlY3RpdmUgbWV0aG9kQ2FsbCBpZiBpdHMgYSBmdW5jdGlvblxyXG4gICAgICBpZiAodHlwZW9mIG1ldGhvZENhbGwgPT09ICdmdW5jdGlvbicpIHtcclxuXHJcbiAgICAgICAgLy8gR2V0IHRoZSB1c2VySWQgLSBUaGlzIGlzIGVpdGhlciBzZXQgYXMgYSBtZXRob2Qgc3BlY2lmaWMgaGFuZGxlciBhbmRcclxuICAgICAgICAvLyB3aWxsIGFsbHdheXMgZGVmYXVsdCBiYWNrIHRvIHRoZSBidWlsdGluIGdldFVzZXJJZCBoYW5kbGVyXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIC8vIFRyeSB0byBzZXQgdGhlIHVzZXJJZFxyXG4gICAgICAgICAgdGhpc1Njb3BlLnVzZXJJZCA9IHNlbGYubWV0aG9kT2JqZWN0LmF1dGguYXBwbHkoc2VsZik7XHJcbiAgICAgICAgfSBjYXRjaChlcnIpIHtcclxuICAgICAgICAgIHNlbmRFcnJvcihyZXMsIGVyci5lcnJvciwgKGVyci5tZXNzYWdlIHx8IGVyci5zdGFjaykpO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVGhpcyBtdXN0IGJlIGF0dGFjaGVkIGJlZm9yZSB0aGVyZSdzIGFueSBjaGFuY2Ugb2YgYGNyZWF0ZVJlYWRTdHJlYW1gXHJcbiAgICAgICAgLy8gb3IgYGNyZWF0ZVdyaXRlU3RyZWFtYCBiZWluZyBjYWxsZWQsIHdoaWNoIG1lYW5zIGJlZm9yZSB3ZSBkb1xyXG4gICAgICAgIC8vIGBtZXRob2RDYWxsLmFwcGx5YCBiZWxvdy5cclxuICAgICAgICByZXEub24oJ2VuZCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgc2VsZi5fc3RyZWFtc1dhaXRpbmctLTtcclxuICAgICAgICAgIHNlbmRSZXNwb25zZUlmRG9uZSgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBHZXQgdGhlIHJlc3VsdCBvZiB0aGUgbWV0aG9kQ2FsbFxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBpZiAoc2VsZi5tZXRob2QgPT09ICdPUFRJT05TJykge1xyXG4gICAgICAgICAgICByZXN1bHQgPSBtZXRob2RDYWxsLmFwcGx5KHRoaXNTY29wZSwgW3NlbGYubWV0aG9kT2JqZWN0XSkgfHwgJyc7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXN1bHQgPSBtZXRob2RDYWxsLmFwcGx5KHRoaXNTY29wZSwgW3NlbGYuZGF0YV0pIHx8ICcnO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2goZXJyKSB7XHJcbiAgICAgICAgICBpZiAoZXJyIGluc3RhbmNlb2YgTWV0ZW9yLkVycm9yKSB7XHJcbiAgICAgICAgICAgIC8vIFJldHVybiBjb250cm9sbGVkIGVycm9yXHJcbiAgICAgICAgICAgIHNlbmRFcnJvcihyZXMsIGVyci5lcnJvciwgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gUmV0dXJuIGVycm9yIHRyYWNlIC0gdGhpcyBpcyBub3QgaW50ZW50ZWRcclxuICAgICAgICAgICAgc2VuZEVycm9yKHJlcywgNTAzLCAnRXJyb3IgaW4gbWV0aG9kIFwiJyArIHNlbGYucmVmZXJlbmNlICsgJ1wiLCBFcnJvcjogJyArIChlcnIuc3RhY2sgfHwgZXJyLm1lc3NhZ2UpICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBTZXQgaGVhZGVyc1xyXG4gICAgICAgIF8uZWFjaChzZWxmLmhlYWRlcnMsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcclxuICAgICAgICAgIC8vIElmIHZhbHVlIGlzIGRlZmluZWQgdGhlbiBzZXQgdGhlIGhlYWRlciwgdGhpcyBhbGxvd3MgZm9yIHVuc2V0dGluZ1xyXG4gICAgICAgICAgLy8gdGhlIGRlZmF1bHQgY29udGVudC10eXBlXHJcbiAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcihrZXksIHZhbHVlKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gSWYgT0sgLyAyMDAgdGhlbiBSZXR1cm4gdGhlIHJlc3VsdFxyXG4gICAgICAgIGlmIChzZWxmLnN0YXR1c0NvZGUgPT09IDIwMCB8fCBzZWxmLnN0YXR1c0NvZGUgPT09IDIwNikge1xyXG5cclxuICAgICAgICAgIGlmIChzZWxmLm1ldGhvZCAhPT0gXCJIRUFEXCIpIHtcclxuICAgICAgICAgICAgLy8gUmV0dXJuIHJlc3VsdFxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICByZXN1bHRCdWZmZXIgPSBuZXcgQnVmZmVyKHJlc3VsdCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmVzdWx0QnVmZmVyID0gbmV3IEJ1ZmZlcihKU09OLnN0cmluZ2lmeShyZXN1bHQpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdXNlciB3YW50cyB0byBvdmVyd3JpdGUgY29udGVudCBsZW5ndGggZm9yIHNvbWUgcmVhc29uP1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHNlbGYuaGVhZGVyc1snQ29udGVudC1MZW5ndGgnXSA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICBzZWxmLmhlYWRlcnNbJ0NvbnRlbnQtTGVuZ3RoJ10gPSByZXN1bHRCdWZmZXIubGVuZ3RoO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHNlbGYuZG9uZSA9IHRydWU7XHJcbiAgICAgICAgICBzZW5kUmVzcG9uc2VJZkRvbmUoKTtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIC8vIEFsbG93IHVzZXIgdG8gYWx0ZXIgdGhlIHN0YXR1cyBjb2RlIGFuZCBzZW5kIGEgbWVzc2FnZVxyXG4gICAgICAgICAgc2VuZEVycm9yKHJlcywgc2VsZi5zdGF0dXNDb2RlLCByZXN1bHQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2VuZEVycm9yKHJlcywgNDA0LCAnU2VydmljZSBub3QgZm91bmQnKTtcclxuICAgICAgfVxyXG5cclxuXHJcbiAgICB9KTtcclxuICAgIC8vIFJ1biBodHRwIG1ldGhvZHMgaGFuZGxlclxyXG4gICAgdHJ5IHtcclxuICAgICAgcnVuU2VydmVyTWV0aG9kLnJ1bihmaWJlclNjb3BlKTtcclxuICAgIH0gY2F0Y2goZXJyKSB7XHJcbiAgICAgIHNlbmRFcnJvcihyZXMsIDUwMCwgJ0Vycm9yIHJ1bm5pbmcgdGhlIHNlcnZlciBodHRwIG1ldGhvZCBoYW5kbGVyLCBFcnJvcjogJyArIChlcnIuc3RhY2sgfHwgZXJyLm1lc3NhZ2UpKTtcclxuICAgIH1cclxuXHJcbiAgfSk7IC8vIEVPIFJlcXVlc3QgaGFuZGxlclxyXG5cclxuXHJcbn0pO1xyXG4iXX0=
