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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc2ltcGxlOmpzb24tcm91dGVzL2NoZWNrTnBtLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zaW1wbGU6anNvbi1yb3V0ZXMvanNvbi1yb3V0ZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3NpbXBsZTpqc29uLXJvdXRlcy9taWRkbGV3YXJlLmpzIl0sIm5hbWVzIjpbImNoZWNrTnBtVmVyc2lvbnMiLCJtb2R1bGUiLCJsaW5rIiwidiIsIkZpYmVyIiwicmVxdWlyZSIsImNvbm5lY3QiLCJjb25uZWN0Um91dGUiLCJxcyIsInVybCIsImJvZHlQYXJzZXIiLCJKc29uUm91dGVzIiwicXNNaWRkbGV3YXJlIiwib3B0aW9ucyIsInJlcXVlc3QiLCJyZXNwb25zZSIsIm5leHQiLCJxdWVyeSIsInBhcnNlIiwiV2ViQXBwIiwiY29ubmVjdEhhbmRsZXJzIiwidXNlIiwidXJsZW5jb2RlZCIsImxpbWl0IiwiZXh0ZW5kZWQiLCJqc29uIiwiTWlkZGxld2FyZSIsIm1pZGRsZVdhcmUiLCJyb3V0ZXMiLCJjb25uZWN0Um91dGVyIiwiTWV0ZW9yIiwiYmluZEVudmlyb25tZW50Iiwicm91dGVyIiwiZXJyb3JNaWRkbGV3YXJlcyIsIkVycm9yTWlkZGxld2FyZSIsInB1c2giLCJhcmd1bWVudHMiLCJzdGFydHVwIiwiXyIsImVhY2giLCJlcnJvck1pZGRsZXdhcmUiLCJtYXAiLCJtYXliZUZuIiwiaXNGdW5jdGlvbiIsImEiLCJiIiwiYyIsImQiLCJhcHBseSIsImFkZCIsIm1ldGhvZCIsInBhdGgiLCJoYW5kbGVyIiwidG9Mb3dlckNhc2UiLCJyZXEiLCJyZXMiLCJzZXRIZWFkZXJzIiwicmVzcG9uc2VIZWFkZXJzIiwiZXJyb3IiLCJydW4iLCJQcmFnbWEiLCJzZXRSZXNwb25zZUhlYWRlcnMiLCJoZWFkZXJzIiwic2VuZFJlc3VsdCIsInN0YXR1c0NvZGUiLCJjb2RlIiwid3JpdGVKc29uVG9Cb2R5IiwiZGF0YSIsImVuZCIsInZhbHVlIiwia2V5Iiwic2V0SGVhZGVyIiwidW5kZWZpbmVkIiwic2hvdWxkUHJldHR5UHJpbnQiLCJwcm9jZXNzIiwiZW52IiwiTk9ERV9FTlYiLCJzcGFjZXIiLCJ3cml0ZSIsIkpTT04iLCJzdHJpbmdpZnkiLCJSZXN0TWlkZGxld2FyZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxnQkFBSjtBQUFxQkMsTUFBTSxDQUFDQyxJQUFQLENBQVksb0NBQVosRUFBaUQ7QUFBQ0Ysa0JBQWdCLENBQUNHLENBQUQsRUFBRztBQUFDSCxvQkFBZ0IsR0FBQ0csQ0FBakI7QUFBbUI7O0FBQXhDLENBQWpELEVBQTJGLENBQTNGO0FBQ3JCSCxnQkFBZ0IsQ0FBQztBQUNoQixhQUFXLFFBREs7QUFFaEIsbUJBQWlCLFFBRkQ7QUFHaEIsUUFBTSxRQUhVO0FBSWhCLGlCQUFlO0FBSkMsQ0FBRCxFQUtiLG9CQUxhLENBQWhCLEM7Ozs7Ozs7Ozs7O0FDREE7QUFFQSxJQUFJSSxLQUFLLEdBQUdDLE9BQU8sQ0FBQyxRQUFELENBQW5COztBQUNBLElBQUlDLE9BQU8sR0FBR0QsT0FBTyxDQUFDLFNBQUQsQ0FBckI7O0FBQ0EsSUFBSUUsWUFBWSxHQUFHRixPQUFPLENBQUMsZUFBRCxDQUExQjs7QUFFQSxJQUFJRyxFQUFFLEdBQUdILE9BQU8sQ0FBQyxJQUFELENBQWhCOztBQUNBLElBQUlJLEdBQUcsR0FBR0osT0FBTyxDQUFDLEtBQUQsQ0FBakI7O0FBQ0EsSUFBSUssVUFBVSxHQUFHTCxPQUFPLENBQUMsYUFBRCxDQUF4Qjs7QUFFQU0sVUFBVSxHQUFHLEVBQWI7O0FBRUEsU0FBU0MsWUFBVCxDQUFzQkMsT0FBdEIsRUFBK0I7QUFDN0IsU0FBTyxVQUFVQyxPQUFWLEVBQW1CQyxRQUFuQixFQUE2QkMsSUFBN0IsRUFBbUM7QUFDeEMsUUFBSSxDQUFDRixPQUFPLENBQUNHLEtBQWIsRUFDRUgsT0FBTyxDQUFDRyxLQUFSLEdBQWdCVCxF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QUNDLElBQUYsQ0FBT3VCLE9BQVAsRUFBZ0IsVUFBVU8sS0FBVixFQUFpQkMsR0FBakIsRUFBc0I7QUFDcENmLE9BQUcsQ0FBQ2dCLFNBQUosQ0FBY0QsR0FBZCxFQUFtQkQsS0FBbkI7QUFDRCxHQUZEO0FBR0Q7O0FBRUQsU0FBU0gsZUFBVCxDQUF5QlgsR0FBekIsRUFBOEI5QixJQUE5QixFQUFvQztBQUNsQyxNQUFJQSxJQUFJLEtBQUsrQyxTQUFiLEVBQXdCO0FBQ3RCLFFBQUlDLGlCQUFpQixHQUFJQyxPQUFPLENBQUNDLEdBQVIsQ0FBWUMsUUFBWixLQUF5QixhQUFsRDtBQUNBLFFBQUlDLE1BQU0sR0FBR0osaUJBQWlCLEdBQUcsQ0FBSCxHQUFPLElBQXJDO0FBQ0FsQixPQUFHLENBQUNnQixTQUFKLENBQWMsY0FBZCxFQUE4QixrQkFBOUI7QUFDQWhCLE9BQUcsQ0FBQ3VCLEtBQUosQ0FBVUMsSUFBSSxDQUFDQyxTQUFMLENBQWV2RCxJQUFmLEVBQXFCLElBQXJCLEVBQTJCb0QsTUFBM0IsQ0FBVjtBQUNEO0FBQ0YsQzs7Ozs7Ozs7Ozs7QUNsSkQ7QUFFQUksY0FBYyxHQUFHLEVBQWpCLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3NpbXBsZV9qc29uLXJvdXRlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNoZWNrTnBtVmVyc2lvbnMgfSBmcm9tICdtZXRlb3IvdG1lYXNkYXk6Y2hlY2stbnBtLXZlcnNpb25zJztcbmNoZWNrTnBtVmVyc2lvbnMoe1xuXHRcImNvbm5lY3RcIjogXCJeMy42LjZcIixcblx0XCJjb25uZWN0LXJvdXRlXCI6IFwiXjAuMS41XCIsXG5cdFwicXNcIjogXCJeNi42LjBcIixcblx0XCJib2R5LXBhcnNlclwiOiBcIl4xLjE4LjNcIlxufSwgJ3NpbXBsZTpqc29uLXJvdXRlcycpO1xuIiwiLyogZ2xvYmFsIEpzb25Sb3V0ZXM6dHJ1ZSAqL1xuXG52YXIgRmliZXIgPSByZXF1aXJlKCdmaWJlcnMnKTtcbnZhciBjb25uZWN0ID0gcmVxdWlyZSgnY29ubmVjdCcpO1xudmFyIGNvbm5lY3RSb3V0ZSA9IHJlcXVpcmUoJ2Nvbm5lY3Qtcm91dGUnKTtcblxudmFyIHFzID0gcmVxdWlyZShcInFzXCIpO1xudmFyIHVybCA9IHJlcXVpcmUoXCJ1cmxcIik7XG52YXIgYm9keVBhcnNlciA9IHJlcXVpcmUoJ2JvZHktcGFyc2VyJyk7XG5cbkpzb25Sb3V0ZXMgPSB7fTtcblxuZnVuY3Rpb24gcXNNaWRkbGV3YXJlKG9wdGlvbnMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChyZXF1ZXN0LCByZXNwb25zZSwgbmV4dCkge1xuICAgIGlmICghcmVxdWVzdC5xdWVyeSlcbiAgICAgIHJlcXVlc3QucXVlcnkgPSBxcy5wYXJzZSh1cmwucGFyc2UocmVxdWVzdC51cmwpLnF1ZXJ5LCBvcHRpb25zKTtcbiAgICBuZXh0KCk7XG4gIH07XG59XG5cbldlYkFwcC5jb25uZWN0SGFuZGxlcnMudXNlKHFzTWlkZGxld2FyZSgpKTtcbldlYkFwcC5jb25uZWN0SGFuZGxlcnMudXNlKGJvZHlQYXJzZXIudXJsZW5jb2RlZCh7IGxpbWl0OiAnNTBtYicsIGV4dGVuZGVkOiB0cnVlIH0pKTsgLy9PdmVycmlkZSBkZWZhdWx0IHJlcXVlc3Qgc2l6ZVxuV2ViQXBwLmNvbm5lY3RIYW5kbGVycy51c2UoYm9keVBhcnNlci5qc29uKHsgbGltaXQ6ICc1MG1iJyB9KSk7IC8vT3ZlcnJpZGUgZGVmYXVsdCByZXF1ZXN0IHNpemVcblxuLy8gSGFuZGxlciBmb3IgYWRkaW5nIG1pZGRsZXdhcmUgYmVmb3JlIGFuIGVuZHBvaW50IChKc29uUm91dGVzLm1pZGRsZVdhcmVcbi8vIGlzIGp1c3QgZm9yIGxlZ2FjeSByZWFzb25zKS4gQWxzbyBzZXJ2ZXMgYXMgYSBuYW1lc3BhY2UgZm9yIG1pZGRsZXdhcmVcbi8vIHBhY2thZ2VzIHRvIGRlY2xhcmUgdGhlaXIgbWlkZGxld2FyZSBmdW5jdGlvbnMuXG5Kc29uUm91dGVzLk1pZGRsZXdhcmUgPSBKc29uUm91dGVzLm1pZGRsZVdhcmUgPSBjb25uZWN0KCk7XG5XZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZShKc29uUm91dGVzLk1pZGRsZXdhcmUpO1xuXG4vLyBMaXN0IG9mIGFsbCBkZWZpbmVkIEpTT04gQVBJIGVuZHBvaW50c1xuSnNvblJvdXRlcy5yb3V0ZXMgPSBbXTtcblxuLy8gU2F2ZSByZWZlcmVuY2UgdG8gcm91dGVyIGZvciBsYXRlclxudmFyIGNvbm5lY3RSb3V0ZXI7XG5cbi8vIFJlZ2lzdGVyIGFzIGEgbWlkZGxld2FyZVxuV2ViQXBwLmNvbm5lY3RIYW5kbGVycy51c2UoTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChjb25uZWN0Um91dGUoZnVuY3Rpb24gKHJvdXRlcikge1xuICBjb25uZWN0Um91dGVyID0gcm91dGVyO1xufSkpKTtcblxuLy8gRXJyb3IgbWlkZGxld2FyZSBtdXN0IGJlIGFkZGVkIGxhc3QsIHRvIGNhdGNoIGVycm9ycyBmcm9tIHByaW9yIG1pZGRsZXdhcmUuXG4vLyBUaGF0J3Mgd2h5IHdlIGNhY2hlIHRoZW0gYW5kIHRoZW4gYWRkIGFmdGVyIHN0YXJ0dXAuXG52YXIgZXJyb3JNaWRkbGV3YXJlcyA9IFtdO1xuSnNvblJvdXRlcy5FcnJvck1pZGRsZXdhcmUgPSB7XG4gIHVzZTogZnVuY3Rpb24gKCkge1xuICAgIGVycm9yTWlkZGxld2FyZXMucHVzaChhcmd1bWVudHMpO1xuICB9LFxufTtcblxuTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24gKCkge1xuICBfLmVhY2goZXJyb3JNaWRkbGV3YXJlcywgZnVuY3Rpb24gKGVycm9yTWlkZGxld2FyZSkge1xuICAgIGVycm9yTWlkZGxld2FyZSA9IF8ubWFwKGVycm9yTWlkZGxld2FyZSwgZnVuY3Rpb24gKG1heWJlRm4pIHtcbiAgICAgIGlmIChfLmlzRnVuY3Rpb24obWF5YmVGbikpIHtcbiAgICAgICAgLy8gQSBjb25uZWN0IGVycm9yIG1pZGRsZXdhcmUgbmVlZHMgZXhhY3RseSA0IGFyZ3VtZW50cyBiZWNhdXNlIHRoZXkgdXNlIGZuLmxlbmd0aCA9PT0gNCB0b1xuICAgICAgICAvLyBkZWNpZGUgaWYgc29tZXRoaW5nIGlzIGFuIGVycm9yIG1pZGRsZXdhcmUuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoYSwgYiwgYywgZCkge1xuICAgICAgICAgIE1ldGVvci5iaW5kRW52aXJvbm1lbnQobWF5YmVGbikoYSwgYiwgYywgZCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG1heWJlRm47XG4gICAgfSk7XG5cbiAgICBXZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZS5hcHBseShXZWJBcHAuY29ubmVjdEhhbmRsZXJzLCBlcnJvck1pZGRsZXdhcmUpO1xuICB9KTtcblxuICBlcnJvck1pZGRsZXdhcmVzID0gW107XG59KTtcblxuSnNvblJvdXRlcy5hZGQgPSBmdW5jdGlvbiAobWV0aG9kLCBwYXRoLCBoYW5kbGVyKSB7XG4gIC8vIE1ha2Ugc3VyZSBwYXRoIHN0YXJ0cyB3aXRoIGEgc2xhc2hcbiAgaWYgKHBhdGhbMF0gIT09ICcvJykge1xuICAgIHBhdGggPSAnLycgKyBwYXRoO1xuICB9XG5cbiAgLy8gQWRkIHRvIGxpc3Qgb2Yga25vd24gZW5kcG9pbnRzXG4gIEpzb25Sb3V0ZXMucm91dGVzLnB1c2goe1xuICAgIG1ldGhvZDogbWV0aG9kLFxuICAgIHBhdGg6IHBhdGgsXG4gIH0pO1xuXG4gIGNvbm5lY3RSb3V0ZXJbbWV0aG9kLnRvTG93ZXJDYXNlKCldKHBhdGgsIGZ1bmN0aW9uIChyZXEsIHJlcywgbmV4dCkge1xuICAgIC8vIFNldCBoZWFkZXJzIG9uIHJlc3BvbnNlXG4gICAgc2V0SGVhZGVycyhyZXMsIHJlc3BvbnNlSGVhZGVycyk7XG4gICAgRmliZXIoZnVuY3Rpb24gKCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaGFuZGxlcihyZXEsIHJlcywgbmV4dCk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBuZXh0KGVycm9yKTtcbiAgICAgIH1cbiAgICB9KS5ydW4oKTtcbiAgfSk7XG59O1xuXG52YXIgcmVzcG9uc2VIZWFkZXJzID0ge1xuICAnQ2FjaGUtQ29udHJvbCc6ICduby1zdG9yZScsXG4gIFByYWdtYTogJ25vLWNhY2hlJyxcbn07XG5cbkpzb25Sb3V0ZXMuc2V0UmVzcG9uc2VIZWFkZXJzID0gZnVuY3Rpb24gKGhlYWRlcnMpIHtcbiAgcmVzcG9uc2VIZWFkZXJzID0gaGVhZGVycztcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgcmVzcG9uc2UgaGVhZGVycywgc3RhdHVzIGNvZGUsIGFuZCBib2R5LCBhbmQgZW5kcyBpdC5cbiAqIFRoZSBKU09OIHJlc3BvbnNlIHdpbGwgYmUgcHJldHR5IHByaW50ZWQgaWYgTk9ERV9FTlYgaXMgYGRldmVsb3BtZW50YC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcmVzIFJlc3BvbnNlIG9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLmNvZGVdIEhUVFAgc3RhdHVzIGNvZGUuIERlZmF1bHQgaXMgMjAwLlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLmhlYWRlcnNdIERpY3Rpb25hcnkgb2YgaGVhZGVycy5cbiAqIEBwYXJhbSB7T2JqZWN0fEFycmF5fG51bGx8dW5kZWZpbmVkfSBbb3B0aW9ucy5kYXRhXSBUaGUgb2JqZWN0IHRvXG4gKiAgIHN0cmluZ2lmeSBhcyB0aGUgcmVzcG9uc2UuIElmIGBudWxsYCwgdGhlIHJlc3BvbnNlIHdpbGwgYmUgXCJudWxsXCIuXG4gKiAgIElmIGB1bmRlZmluZWRgLCB0aGVyZSB3aWxsIGJlIG5vIHJlc3BvbnNlIGJvZHkuXG4gKi9cbkpzb25Sb3V0ZXMuc2VuZFJlc3VsdCA9IGZ1bmN0aW9uIChyZXMsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgLy8gV2UndmUgYWxyZWFkeSBzZXQgZ2xvYmFsIGhlYWRlcnMgb24gcmVzcG9uc2UsIGJ1dCBpZiB0aGV5XG4gIC8vIHBhc3MgaW4gbW9yZSBoZXJlLCB3ZSBzZXQgdGhvc2UuXG4gIGlmIChvcHRpb25zLmhlYWRlcnMpIHNldEhlYWRlcnMocmVzLCBvcHRpb25zLmhlYWRlcnMpO1xuXG4gIC8vIFNldCBzdGF0dXMgY29kZSBvbiByZXNwb25zZVxuICByZXMuc3RhdHVzQ29kZSA9IG9wdGlvbnMuY29kZSB8fCAyMDA7XG5cbiAgLy8gU2V0IHJlc3BvbnNlIGJvZHlcbiAgd3JpdGVKc29uVG9Cb2R5KHJlcywgb3B0aW9ucy5kYXRhKTtcblxuICAvLyBTZW5kIHRoZSByZXNwb25zZVxuICByZXMuZW5kKCk7XG59O1xuXG5mdW5jdGlvbiBzZXRIZWFkZXJzKHJlcywgaGVhZGVycykge1xuICBfLmVhY2goaGVhZGVycywgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICByZXMuc2V0SGVhZGVyKGtleSwgdmFsdWUpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gd3JpdGVKc29uVG9Cb2R5KHJlcywganNvbikge1xuICBpZiAoanNvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgdmFyIHNob3VsZFByZXR0eVByaW50ID0gKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnKTtcbiAgICB2YXIgc3BhY2VyID0gc2hvdWxkUHJldHR5UHJpbnQgPyAyIDogbnVsbDtcbiAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgIHJlcy53cml0ZShKU09OLnN0cmluZ2lmeShqc29uLCBudWxsLCBzcGFjZXIpKTtcbiAgfVxufVxuIiwiLyogZ2xvYmFsIFJlc3RNaWRkbGV3YXJlOnRydWUgKi9cblxuUmVzdE1pZGRsZXdhcmUgPSB7fTtcbiJdfQ==
