(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var _ = Package.underscore._;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var JsonRoutes, RestMiddleware;

var require = meteorInstall({"node_modules":{"meteor":{"simple:json-routes":{"checkNpm.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/simple_json-routes/checkNpm.js                                                          //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
let checkNpmVersions;
module.link("meteor/tmeasday:check-npm-versions", {
  checkNpmVersions(v) {
    checkNpmVersions = v;
  }

}, 0);
checkNpmVersions({
  "connect": "^3.6.6",
  "connect-route": "^0.1.5",
  "qs": "^6.6.0",
  "body-parser": "^1.18.3"
}, 'simple:json-routes');
//////////////////////////////////////////////////////////////////////////////////////////////////////

},"json-routes.js":function(require){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/simple_json-routes/json-routes.js                                                       //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
/* global JsonRoutes:true */
var Fiber = require('fibers');

var connect = require('connect');

var connectRoute = require('connect-route');

var qs = require("qs");

var url = require("url");

var bodyParser = require('body-parser');

JsonRoutes = {};

function qsMiddleware(options) {
  return function (request, response, next) {
    if (!request.query) request.query = qs.parse(url.parse(request.url).query, options);
    next();
  };
}

WebApp.connectHandlers.use(qsMiddleware());
WebApp.connectHandlers.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true
})); //Override default request size

WebApp.connectHandlers.use(bodyParser.json({
  limit: '50mb'
})); //Override default request size
// Handler for adding middleware before an endpoint (JsonRoutes.middleWare
// is just for legacy reasons). Also serves as a namespace for middleware
// packages to declare their middleware functions.

JsonRoutes.Middleware = JsonRoutes.middleWare = connect();
WebApp.connectHandlers.use(JsonRoutes.Middleware); // List of all defined JSON API endpoints

JsonRoutes.routes = []; // Save reference to router for later

var connectRouter; // Register as a middleware

WebApp.connectHandlers.use(Meteor.bindEnvironment(connectRoute(function (router) {
  connectRouter = router;
}))); // Error middleware must be added last, to catch errors from prior middleware.
// That's why we cache them and then add after startup.

var errorMiddlewares = [];
JsonRoutes.ErrorMiddleware = {
  use: function () {
    errorMiddlewares.push(arguments);
  }
};
Meteor.startup(function () {
  _.each(errorMiddlewares, function (errorMiddleware) {
    errorMiddleware = _.map(errorMiddleware, function (maybeFn) {
      if (_.isFunction(maybeFn)) {
        // A connect error middleware needs exactly 4 arguments because they use fn.length === 4 to
        // decide if something is an error middleware.
        return function (a, b, c, d) {
          Meteor.bindEnvironment(maybeFn)(a, b, c, d);
        };
      }

      return maybeFn;
    });
    WebApp.connectHandlers.use.apply(WebApp.connectHandlers, errorMiddleware);
  });

  errorMiddlewares = [];
});

JsonRoutes.add = function (method, path, handler) {
  // Make sure path starts with a slash
  if (path[0] !== '/') {
    path = '/' + path;
  } // Add to list of known endpoints


  JsonRoutes.routes.push({
    method: method,
    path: path
  });
  connectRouter[method.toLowerCase()](path, function (req, res, next) {
    // Set headers on response
    setHeaders(res, responseHeaders);
    Fiber(function () {
      try {
        handler(req, res, next);
      } catch (error) {
        next(error);
      }
    }).run();
  });
};

var responseHeaders = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache'
};

JsonRoutes.setResponseHeaders = function (headers) {
  responseHeaders = headers;
};
/**
 * Sets the response headers, status code, and body, and ends it.
 * The JSON response will be pretty printed if NODE_ENV is `development`.
 *
 * @param {Object} res Response object
 * @param {Object} [options]
 * @param {Number} [options.code] HTTP status code. Default is 200.
 * @param {Object} [options.headers] Dictionary of headers.
 * @param {Object|Array|null|undefined} [options.data] The object to
 *   stringify as the response. If `null`, the response will be "null".
 *   If `undefined`, there will be no response body.
 */


JsonRoutes.sendResult = function (res, options) {
  options = options || {}; // We've already set global headers on response, but if they
  // pass in more here, we set those.

  if (options.headers) setHeaders(res, options.headers); // Set status code on response

  res.statusCode = options.code || 200; // Set response body

  writeJsonToBody(res, options.data); // Send the response

  res.end();
};

function setHeaders(res, headers) {
  _.each(headers, function (value, key) {
    res.setHeader(key, value);
  });
}

function writeJsonToBody(res, json) {
  if (json !== undefined) {
    var shouldPrettyPrint = process.env.NODE_ENV === 'development';
    var spacer = shouldPrettyPrint ? 2 : null;
    res.setHeader('Content-type', 'application/json');
    res.write(JSON.stringify(json, null, spacer));
  }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////

},"middleware.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/simple_json-routes/middleware.js                                                        //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
/* global RestMiddleware:true */
RestMiddleware = {};
//////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/simple:json-routes/checkNpm.js");
require("/node_modules/meteor/simple:json-routes/json-routes.js");
require("/node_modules/meteor/simple:json-routes/middleware.js");

/* Exports */
Package._define("simple:json-routes", {
  JsonRoutes: JsonRoutes,
  RestMiddleware: RestMiddleware
});

})();

//# sourceURL=meteor://💻app/packages/simple_json-routes.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc2ltcGxlOmpzb24tcm91dGVzL2NoZWNrTnBtLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zaW1wbGU6anNvbi1yb3V0ZXMvanNvbi1yb3V0ZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3NpbXBsZTpqc29uLXJvdXRlcy9taWRkbGV3YXJlLmpzIl0sIm5hbWVzIjpbImNoZWNrTnBtVmVyc2lvbnMiLCJtb2R1bGUiLCJsaW5rIiwidiIsIkZpYmVyIiwicmVxdWlyZSIsImNvbm5lY3QiLCJjb25uZWN0Um91dGUiLCJxcyIsInVybCIsImJvZHlQYXJzZXIiLCJKc29uUm91dGVzIiwicXNNaWRkbGV3YXJlIiwib3B0aW9ucyIsInJlcXVlc3QiLCJyZXNwb25zZSIsIm5leHQiLCJxdWVyeSIsInBhcnNlIiwiV2ViQXBwIiwiY29ubmVjdEhhbmRsZXJzIiwidXNlIiwidXJsZW5jb2RlZCIsImxpbWl0IiwiZXh0ZW5kZWQiLCJqc29uIiwiTWlkZGxld2FyZSIsIm1pZGRsZVdhcmUiLCJyb3V0ZXMiLCJjb25uZWN0Um91dGVyIiwiTWV0ZW9yIiwiYmluZEVudmlyb25tZW50Iiwicm91dGVyIiwiZXJyb3JNaWRkbGV3YXJlcyIsIkVycm9yTWlkZGxld2FyZSIsInB1c2giLCJhcmd1bWVudHMiLCJzdGFydHVwIiwiXyIsImVhY2giLCJlcnJvck1pZGRsZXdhcmUiLCJtYXAiLCJtYXliZUZuIiwiaXNGdW5jdGlvbiIsImEiLCJiIiwiYyIsImQiLCJhcHBseSIsImFkZCIsIm1ldGhvZCIsInBhdGgiLCJoYW5kbGVyIiwidG9Mb3dlckNhc2UiLCJyZXEiLCJyZXMiLCJzZXRIZWFkZXJzIiwicmVzcG9uc2VIZWFkZXJzIiwiZXJyb3IiLCJydW4iLCJQcmFnbWEiLCJzZXRSZXNwb25zZUhlYWRlcnMiLCJoZWFkZXJzIiwic2VuZFJlc3VsdCIsInN0YXR1c0NvZGUiLCJjb2RlIiwid3JpdGVKc29uVG9Cb2R5IiwiZGF0YSIsImVuZCIsInZhbHVlIiwia2V5Iiwic2V0SGVhZGVyIiwidW5kZWZpbmVkIiwic2hvdWxkUHJldHR5UHJpbnQiLCJwcm9jZXNzIiwiZW52IiwiTk9ERV9FTlYiLCJzcGFjZXIiLCJ3cml0ZSIsIkpTT04iLCJzdHJpbmdpZnkiLCJSZXN0TWlkZGxld2FyZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxnQkFBSjtBQUFxQkMsTUFBTSxDQUFDQyxJQUFQLENBQVksb0NBQVosRUFBaUQ7QUFBQ0Ysa0JBQWdCLENBQUNHLENBQUQsRUFBRztBQUFDSCxvQkFBZ0IsR0FBQ0csQ0FBakI7QUFBbUI7O0FBQXhDLENBQWpELEVBQTJGLENBQTNGO0FBQ3JCSCxnQkFBZ0IsQ0FBQztBQUNoQixhQUFXLFFBREs7QUFFaEIsbUJBQWlCLFFBRkQ7QUFHaEIsUUFBTSxRQUhVO0FBSWhCLGlCQUFlO0FBSkMsQ0FBRCxFQUtiLG9CQUxhLENBQWhCLEM7Ozs7Ozs7Ozs7O0FDREE7QUFFQSxJQUFJSSxLQUFLLEdBQUdDLE9BQU8sQ0FBQyxRQUFELENBQW5COztBQUNBLElBQUlDLE9BQU8sR0FBR0QsT0FBTyxDQUFDLFNBQUQsQ0FBckI7O0FBQ0EsSUFBSUUsWUFBWSxHQUFHRixPQUFPLENBQUMsZUFBRCxDQUExQjs7QUFFQSxJQUFJRyxFQUFFLEdBQUdILE9BQU8sQ0FBQyxJQUFELENBQWhCOztBQUNBLElBQUlJLEdBQUcsR0FBR0osT0FBTyxDQUFDLEtBQUQsQ0FBakI7O0FBQ0EsSUFBSUssVUFBVSxHQUFHTCxPQUFPLENBQUMsYUFBRCxDQUF4Qjs7QUFFQU0sVUFBVSxHQUFHLEVBQWI7O0FBRUEsU0FBU0MsWUFBVCxDQUFzQkMsT0FBdEIsRUFBK0I7QUFDN0IsU0FBTyxVQUFVQyxPQUFWLEVBQW1CQyxRQUFuQixFQUE2QkMsSUFBN0IsRUFBbUM7QUFDeEMsUUFBSSxDQUFDRixPQUFPLENBQUNHLEtBQWIsRUFDRUgsT0FBTyxDQUFDRyxLQUFSLEdBQWdCVCxF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QUNDLElBQUYsQ0FBT3VCLE9BQVAsRUFBZ0IsVUFBVU8sS0FBVixFQUFpQkMsR0FBakIsRUFBc0I7QUFDcENmLE9BQUcsQ0FBQ2dCLFNBQUosQ0FBY0QsR0FBZCxFQUFtQkQsS0FBbkI7QUFDRCxHQUZEO0FBR0Q7O0FBRUQsU0FBU0gsZUFBVCxDQUF5QlgsR0FBekIsRUFBOEI5QixJQUE5QixFQUFvQztBQUNsQyxNQUFJQSxJQUFJLEtBQUsrQyxTQUFiLEVBQXdCO0FBQ3RCLFFBQUlDLGlCQUFpQixHQUFJQyxPQUFPLENBQUNDLEdBQVIsQ0FBWUMsUUFBWixLQUF5QixhQUFsRDtBQUNBLFFBQUlDLE1BQU0sR0FBR0osaUJBQWlCLEdBQUcsQ0FBSCxHQUFPLElBQXJDO0FBQ0FsQixPQUFHLENBQUNnQixTQUFKLENBQWMsY0FBZCxFQUE4QixrQkFBOUI7QUFDQWhCLE9BQUcsQ0FBQ3VCLEtBQUosQ0FBVUMsSUFBSSxDQUFDQyxTQUFMLENBQWV2RCxJQUFmLEVBQXFCLElBQXJCLEVBQTJCb0QsTUFBM0IsQ0FBVjtBQUNEO0FBQ0YsQzs7Ozs7Ozs7Ozs7QUNsSkQ7QUFFQUksY0FBYyxHQUFHLEVBQWpCLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3NpbXBsZV9qc29uLXJvdXRlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNoZWNrTnBtVmVyc2lvbnMgfSBmcm9tICdtZXRlb3IvdG1lYXNkYXk6Y2hlY2stbnBtLXZlcnNpb25zJztcclxuY2hlY2tOcG1WZXJzaW9ucyh7XHJcblx0XCJjb25uZWN0XCI6IFwiXjMuNi42XCIsXHJcblx0XCJjb25uZWN0LXJvdXRlXCI6IFwiXjAuMS41XCIsXHJcblx0XCJxc1wiOiBcIl42LjYuMFwiLFxyXG5cdFwiYm9keS1wYXJzZXJcIjogXCJeMS4xOC4zXCJcclxufSwgJ3NpbXBsZTpqc29uLXJvdXRlcycpO1xyXG4iLCIvKiBnbG9iYWwgSnNvblJvdXRlczp0cnVlICovXHJcblxyXG52YXIgRmliZXIgPSByZXF1aXJlKCdmaWJlcnMnKTtcclxudmFyIGNvbm5lY3QgPSByZXF1aXJlKCdjb25uZWN0Jyk7XHJcbnZhciBjb25uZWN0Um91dGUgPSByZXF1aXJlKCdjb25uZWN0LXJvdXRlJyk7XHJcblxyXG52YXIgcXMgPSByZXF1aXJlKFwicXNcIik7XHJcbnZhciB1cmwgPSByZXF1aXJlKFwidXJsXCIpO1xyXG52YXIgYm9keVBhcnNlciA9IHJlcXVpcmUoJ2JvZHktcGFyc2VyJyk7XHJcblxyXG5Kc29uUm91dGVzID0ge307XHJcblxyXG5mdW5jdGlvbiBxc01pZGRsZXdhcmUob3B0aW9ucykge1xyXG4gIHJldHVybiBmdW5jdGlvbiAocmVxdWVzdCwgcmVzcG9uc2UsIG5leHQpIHtcclxuICAgIGlmICghcmVxdWVzdC5xdWVyeSlcclxuICAgICAgcmVxdWVzdC5xdWVyeSA9IHFzLnBhcnNlKHVybC5wYXJzZShyZXF1ZXN0LnVybCkucXVlcnksIG9wdGlvbnMpO1xyXG4gICAgbmV4dCgpO1xyXG4gIH07XHJcbn1cclxuXHJcbldlYkFwcC5jb25uZWN0SGFuZGxlcnMudXNlKHFzTWlkZGxld2FyZSgpKTtcclxuV2ViQXBwLmNvbm5lY3RIYW5kbGVycy51c2UoYm9keVBhcnNlci51cmxlbmNvZGVkKHsgbGltaXQ6ICc1MG1iJywgZXh0ZW5kZWQ6IHRydWUgfSkpOyAvL092ZXJyaWRlIGRlZmF1bHQgcmVxdWVzdCBzaXplXHJcbldlYkFwcC5jb25uZWN0SGFuZGxlcnMudXNlKGJvZHlQYXJzZXIuanNvbih7IGxpbWl0OiAnNTBtYicgfSkpOyAvL092ZXJyaWRlIGRlZmF1bHQgcmVxdWVzdCBzaXplXHJcblxyXG4vLyBIYW5kbGVyIGZvciBhZGRpbmcgbWlkZGxld2FyZSBiZWZvcmUgYW4gZW5kcG9pbnQgKEpzb25Sb3V0ZXMubWlkZGxlV2FyZVxyXG4vLyBpcyBqdXN0IGZvciBsZWdhY3kgcmVhc29ucykuIEFsc28gc2VydmVzIGFzIGEgbmFtZXNwYWNlIGZvciBtaWRkbGV3YXJlXHJcbi8vIHBhY2thZ2VzIHRvIGRlY2xhcmUgdGhlaXIgbWlkZGxld2FyZSBmdW5jdGlvbnMuXHJcbkpzb25Sb3V0ZXMuTWlkZGxld2FyZSA9IEpzb25Sb3V0ZXMubWlkZGxlV2FyZSA9IGNvbm5lY3QoKTtcclxuV2ViQXBwLmNvbm5lY3RIYW5kbGVycy51c2UoSnNvblJvdXRlcy5NaWRkbGV3YXJlKTtcclxuXHJcbi8vIExpc3Qgb2YgYWxsIGRlZmluZWQgSlNPTiBBUEkgZW5kcG9pbnRzXHJcbkpzb25Sb3V0ZXMucm91dGVzID0gW107XHJcblxyXG4vLyBTYXZlIHJlZmVyZW5jZSB0byByb3V0ZXIgZm9yIGxhdGVyXHJcbnZhciBjb25uZWN0Um91dGVyO1xyXG5cclxuLy8gUmVnaXN0ZXIgYXMgYSBtaWRkbGV3YXJlXHJcbldlYkFwcC5jb25uZWN0SGFuZGxlcnMudXNlKE1ldGVvci5iaW5kRW52aXJvbm1lbnQoY29ubmVjdFJvdXRlKGZ1bmN0aW9uIChyb3V0ZXIpIHtcclxuICBjb25uZWN0Um91dGVyID0gcm91dGVyO1xyXG59KSkpO1xyXG5cclxuLy8gRXJyb3IgbWlkZGxld2FyZSBtdXN0IGJlIGFkZGVkIGxhc3QsIHRvIGNhdGNoIGVycm9ycyBmcm9tIHByaW9yIG1pZGRsZXdhcmUuXHJcbi8vIFRoYXQncyB3aHkgd2UgY2FjaGUgdGhlbSBhbmQgdGhlbiBhZGQgYWZ0ZXIgc3RhcnR1cC5cclxudmFyIGVycm9yTWlkZGxld2FyZXMgPSBbXTtcclxuSnNvblJvdXRlcy5FcnJvck1pZGRsZXdhcmUgPSB7XHJcbiAgdXNlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICBlcnJvck1pZGRsZXdhcmVzLnB1c2goYXJndW1lbnRzKTtcclxuICB9LFxyXG59O1xyXG5cclxuTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24gKCkge1xyXG4gIF8uZWFjaChlcnJvck1pZGRsZXdhcmVzLCBmdW5jdGlvbiAoZXJyb3JNaWRkbGV3YXJlKSB7XHJcbiAgICBlcnJvck1pZGRsZXdhcmUgPSBfLm1hcChlcnJvck1pZGRsZXdhcmUsIGZ1bmN0aW9uIChtYXliZUZuKSB7XHJcbiAgICAgIGlmIChfLmlzRnVuY3Rpb24obWF5YmVGbikpIHtcclxuICAgICAgICAvLyBBIGNvbm5lY3QgZXJyb3IgbWlkZGxld2FyZSBuZWVkcyBleGFjdGx5IDQgYXJndW1lbnRzIGJlY2F1c2UgdGhleSB1c2UgZm4ubGVuZ3RoID09PSA0IHRvXHJcbiAgICAgICAgLy8gZGVjaWRlIGlmIHNvbWV0aGluZyBpcyBhbiBlcnJvciBtaWRkbGV3YXJlLlxyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoYSwgYiwgYywgZCkge1xyXG4gICAgICAgICAgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChtYXliZUZuKShhLCBiLCBjLCBkKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBtYXliZUZuO1xyXG4gICAgfSk7XHJcblxyXG4gICAgV2ViQXBwLmNvbm5lY3RIYW5kbGVycy51c2UuYXBwbHkoV2ViQXBwLmNvbm5lY3RIYW5kbGVycywgZXJyb3JNaWRkbGV3YXJlKTtcclxuICB9KTtcclxuXHJcbiAgZXJyb3JNaWRkbGV3YXJlcyA9IFtdO1xyXG59KTtcclxuXHJcbkpzb25Sb3V0ZXMuYWRkID0gZnVuY3Rpb24gKG1ldGhvZCwgcGF0aCwgaGFuZGxlcikge1xyXG4gIC8vIE1ha2Ugc3VyZSBwYXRoIHN0YXJ0cyB3aXRoIGEgc2xhc2hcclxuICBpZiAocGF0aFswXSAhPT0gJy8nKSB7XHJcbiAgICBwYXRoID0gJy8nICsgcGF0aDtcclxuICB9XHJcblxyXG4gIC8vIEFkZCB0byBsaXN0IG9mIGtub3duIGVuZHBvaW50c1xyXG4gIEpzb25Sb3V0ZXMucm91dGVzLnB1c2goe1xyXG4gICAgbWV0aG9kOiBtZXRob2QsXHJcbiAgICBwYXRoOiBwYXRoLFxyXG4gIH0pO1xyXG5cclxuICBjb25uZWN0Um91dGVyW21ldGhvZC50b0xvd2VyQ2FzZSgpXShwYXRoLCBmdW5jdGlvbiAocmVxLCByZXMsIG5leHQpIHtcclxuICAgIC8vIFNldCBoZWFkZXJzIG9uIHJlc3BvbnNlXHJcbiAgICBzZXRIZWFkZXJzKHJlcywgcmVzcG9uc2VIZWFkZXJzKTtcclxuICAgIEZpYmVyKGZ1bmN0aW9uICgpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBoYW5kbGVyKHJlcSwgcmVzLCBuZXh0KTtcclxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBuZXh0KGVycm9yKTtcclxuICAgICAgfVxyXG4gICAgfSkucnVuKCk7XHJcbiAgfSk7XHJcbn07XHJcblxyXG52YXIgcmVzcG9uc2VIZWFkZXJzID0ge1xyXG4gICdDYWNoZS1Db250cm9sJzogJ25vLXN0b3JlJyxcclxuICBQcmFnbWE6ICduby1jYWNoZScsXHJcbn07XHJcblxyXG5Kc29uUm91dGVzLnNldFJlc3BvbnNlSGVhZGVycyA9IGZ1bmN0aW9uIChoZWFkZXJzKSB7XHJcbiAgcmVzcG9uc2VIZWFkZXJzID0gaGVhZGVycztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIHRoZSByZXNwb25zZSBoZWFkZXJzLCBzdGF0dXMgY29kZSwgYW5kIGJvZHksIGFuZCBlbmRzIGl0LlxyXG4gKiBUaGUgSlNPTiByZXNwb25zZSB3aWxsIGJlIHByZXR0eSBwcmludGVkIGlmIE5PREVfRU5WIGlzIGBkZXZlbG9wbWVudGAuXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSByZXMgUmVzcG9uc2Ugb2JqZWN0XHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cclxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLmNvZGVdIEhUVFAgc3RhdHVzIGNvZGUuIERlZmF1bHQgaXMgMjAwLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMuaGVhZGVyc10gRGljdGlvbmFyeSBvZiBoZWFkZXJzLlxyXG4gKiBAcGFyYW0ge09iamVjdHxBcnJheXxudWxsfHVuZGVmaW5lZH0gW29wdGlvbnMuZGF0YV0gVGhlIG9iamVjdCB0b1xyXG4gKiAgIHN0cmluZ2lmeSBhcyB0aGUgcmVzcG9uc2UuIElmIGBudWxsYCwgdGhlIHJlc3BvbnNlIHdpbGwgYmUgXCJudWxsXCIuXHJcbiAqICAgSWYgYHVuZGVmaW5lZGAsIHRoZXJlIHdpbGwgYmUgbm8gcmVzcG9uc2UgYm9keS5cclxuICovXHJcbkpzb25Sb3V0ZXMuc2VuZFJlc3VsdCA9IGZ1bmN0aW9uIChyZXMsIG9wdGlvbnMpIHtcclxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgLy8gV2UndmUgYWxyZWFkeSBzZXQgZ2xvYmFsIGhlYWRlcnMgb24gcmVzcG9uc2UsIGJ1dCBpZiB0aGV5XHJcbiAgLy8gcGFzcyBpbiBtb3JlIGhlcmUsIHdlIHNldCB0aG9zZS5cclxuICBpZiAob3B0aW9ucy5oZWFkZXJzKSBzZXRIZWFkZXJzKHJlcywgb3B0aW9ucy5oZWFkZXJzKTtcclxuXHJcbiAgLy8gU2V0IHN0YXR1cyBjb2RlIG9uIHJlc3BvbnNlXHJcbiAgcmVzLnN0YXR1c0NvZGUgPSBvcHRpb25zLmNvZGUgfHwgMjAwO1xyXG5cclxuICAvLyBTZXQgcmVzcG9uc2UgYm9keVxyXG4gIHdyaXRlSnNvblRvQm9keShyZXMsIG9wdGlvbnMuZGF0YSk7XHJcblxyXG4gIC8vIFNlbmQgdGhlIHJlc3BvbnNlXHJcbiAgcmVzLmVuZCgpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gc2V0SGVhZGVycyhyZXMsIGhlYWRlcnMpIHtcclxuICBfLmVhY2goaGVhZGVycywgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcclxuICAgIHJlcy5zZXRIZWFkZXIoa2V5LCB2YWx1ZSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHdyaXRlSnNvblRvQm9keShyZXMsIGpzb24pIHtcclxuICBpZiAoanNvbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICB2YXIgc2hvdWxkUHJldHR5UHJpbnQgPSAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcpO1xyXG4gICAgdmFyIHNwYWNlciA9IHNob3VsZFByZXR0eVByaW50ID8gMiA6IG51bGw7XHJcbiAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xyXG4gICAgcmVzLndyaXRlKEpTT04uc3RyaW5naWZ5KGpzb24sIG51bGwsIHNwYWNlcikpO1xyXG4gIH1cclxufVxyXG4iLCIvKiBnbG9iYWwgUmVzdE1pZGRsZXdhcmU6dHJ1ZSAqL1xyXG5cclxuUmVzdE1pZGRsZXdhcmUgPSB7fTtcclxuIl19
