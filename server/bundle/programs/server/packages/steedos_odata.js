(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var check = Package.check.check;
var Match = Package.check.Match;
var _ = Package.underscore._;
var ECMAScript = Package.ecmascript.ECMAScript;
var JsonRoutes = Package['simple:json-routes'].JsonRoutes;
var RestMiddleware = Package['simple:json-routes'].RestMiddleware;
var DDPCommon = Package['ddp-common'].DDPCommon;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var meteorInstall = Package.modules.meteorInstall;
var Accounts = Package['accounts-base'].Accounts;

/* Package-scope variables */
var __coffeescriptShare, ironRouterSendErrorToResponse, msg;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:odata":{"checkNpm.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_odata/checkNpm.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let checkNpmVersions;
module.link("meteor/tmeasday:check-npm-versions", {
  checkNpmVersions(v) {
    checkNpmVersions = v;
  }

}, 0);

// fix warning: xxx not installed
require("basic-auth/package.json");

checkNpmVersions({
  'basic-auth': '^2.0.1',
  'odata-v4-service-metadata': "^0.1.6",
  "odata-v4-service-document": "^0.0.3",
  cookies: "^0.6.1"
}, 'steedos:odata');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"restivus":{"auth.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_odata/lib/restivus/auth.coffee                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var getUserQuerySelector, userValidator;
this.Auth || (this.Auth = {}); /*
                               	A valid user will have exactly one of the following identification fields: id, username, or email
                                */
userValidator = Match.Where(function (user) {
  check(user, {
    id: Match.Optional(String),
    username: Match.Optional(String),
    email: Match.Optional(String)
  });

  if (_.keys(user).length === !1) {
    throw new Match.Error('User must have exactly one identifier field');
  }

  return true;
}); /*
    	Return a MongoDB query selector for finding the given user
     */

getUserQuerySelector = function (user) {
  if (user.id) {
    return {
      '_id': user.id
    };
  } else if (user.username) {
    return {
      'username': user.username
    };
  } else if (user.email) {
    return {
      'emails.address': user.email
    };
  }

  throw new Error('Cannot create selector from invalid user');
}; /*
   	Log a user in with their password
    */

this.Auth.loginWithPassword = function (user, password) {
  var authToken, authenticatingUser, authenticatingUserSelector, hashedToken, passwordVerification, ref, space_users, spaces;

  if (!user || !password) {
    throw new Meteor.Error(401, 'Unauthorized');
  }

  check(user, userValidator);
  check(password, String);
  authenticatingUserSelector = getUserQuerySelector(user);
  authenticatingUser = Meteor.users.findOne(authenticatingUserSelector);

  if (!authenticatingUser) {
    throw new Meteor.Error(401, 'Unauthorized');
  }

  if (!((ref = authenticatingUser.services) != null ? ref.password : void 0)) {
    throw new Meteor.Error(401, 'Unauthorized');
  }

  passwordVerification = Accounts._checkPassword(authenticatingUser, password);

  if (passwordVerification.error) {
    throw new Meteor.Error(401, 'Unauthorized');
  }

  authToken = Accounts._generateStampedLoginToken();
  hashedToken = Accounts._hashStampedToken(authToken);

  Accounts._insertHashedLoginToken(authenticatingUser._id, hashedToken);

  space_users = db.space_users.find({
    user: authenticatingUser._id
  }).fetch();
  spaces = [];

  _.each(space_users, function (su) {
    var space;
    space = db.spaces.findOne(su.space);

    if ((space != null ? space.is_paid : void 0) && _.indexOf(space.admins, su.user) >= 0) {
      return spaces.push({
        _id: space._id,
        name: space.name
      });
    }
  });

  return {
    authToken: authToken.token,
    userId: authenticatingUser._id,
    adminSpaces: spaces
  };
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"iron-router-error-to-response.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_odata/lib/restivus/iron-router-error-to-response.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// We need a function that treats thrown errors exactly like Iron Router would.
// This file is written in JavaScript to enable copy-pasting Iron Router code.
// Taken from: https://github.com/iron-meteor/iron-router/blob/9c369499c98af9fd12ef9e68338dee3b1b1276aa/lib/router_server.js#L3
var env = process.env.NODE_ENV || 'development'; // Taken from: https://github.com/iron-meteor/iron-router/blob/9c369499c98af9fd12ef9e68338dee3b1b1276aa/lib/router_server.js#L47

ironRouterSendErrorToResponse = function (err, req, res) {
  if (res.statusCode < 400) res.statusCode = 500;
  if (err.status) res.statusCode = err.status;
  if (env === 'development') msg = (err.stack || err.toString()) + '\n';else //XXX get this from standard dict of error messages?
    msg = 'Server error.';
  console.error(err.stack || err.toString());
  if (res.headersSent) return req.socket.destroy();
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Length', Buffer.byteLength(msg));
  if (req.method === 'HEAD') return res.end();
  res.end(msg);
  return;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"route.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_odata/lib/restivus/route.coffee                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
share.Route = function () {
  function Route(api, path, options, endpoints1) {
    this.api = api;
    this.path = path;
    this.options = options;
    this.endpoints = endpoints1;

    if (!this.endpoints) {
      this.endpoints = this.options;
      this.options = {};
    }
  }

  Route.prototype.addToApi = function () {
    var availableMethods;
    availableMethods = ['get', 'post', 'put', 'patch', 'delete', 'options'];
    return function () {
      var allowedMethods, fullPath, rejectedMethods, self;
      self = this;

      if (_.contains(this.api._config.paths, this.path)) {
        throw new Error("Cannot add a route at an existing path: " + this.path);
      }

      this.endpoints = _.extend({
        options: this.api._config.defaultOptionsEndpoint
      }, this.endpoints);

      this._resolveEndpoints();

      this._configureEndpoints();

      this.api._config.paths.push(this.path);

      allowedMethods = _.filter(availableMethods, function (method) {
        return _.contains(_.keys(self.endpoints), method);
      });
      rejectedMethods = _.reject(availableMethods, function (method) {
        return _.contains(_.keys(self.endpoints), method);
      });
      fullPath = this.api._config.apiPath + this.path;

      _.each(allowedMethods, function (method) {
        var endpoint;
        endpoint = self.endpoints[method];
        return JsonRoutes.add(method, fullPath, function (req, res) {
          var doneFunc, endpointContext, error, responseData, responseInitiated;
          responseInitiated = false;

          doneFunc = function () {
            return responseInitiated = true;
          };

          endpointContext = {
            urlParams: req.params,
            queryParams: req.query,
            bodyParams: req.body,
            request: req,
            response: res,
            done: doneFunc
          };

          _.extend(endpointContext, endpoint);

          responseData = null;

          try {
            responseData = self._callEndpoint(endpointContext, endpoint);
          } catch (error1) {
            error = error1;
            ironRouterSendErrorToResponse(error, req, res);
            return;
          }

          if (responseInitiated) {
            res.end();
            return;
          } else {
            if (res.headersSent) {
              throw new Error("Must call this.done() after handling endpoint response manually: " + method + " " + fullPath);
            } else if (responseData === null || responseData === void 0) {
              throw new Error("Cannot return null or undefined from an endpoint: " + method + " " + fullPath);
            }
          }

          if (responseData.body && (responseData.statusCode || responseData.headers)) {
            return self._respond(res, responseData.body, responseData.statusCode, responseData.headers);
          } else {
            return self._respond(res, responseData);
          }
        });
      });

      return _.each(rejectedMethods, function (method) {
        return JsonRoutes.add(method, fullPath, function (req, res) {
          var headers, responseData;
          responseData = {
            status: 'error',
            message: 'API endpoint does not exist'
          };
          headers = {
            'Allow': allowedMethods.join(', ').toUpperCase()
          };
          return self._respond(res, responseData, 405, headers);
        });
      });
    };
  }(); /*
       		Convert all endpoints on the given route into our expected endpoint object if it is a bare
       		function
       
       		@param {Route} route The route the endpoints belong to
        */

  Route.prototype._resolveEndpoints = function () {
    _.each(this.endpoints, function (endpoint, method, endpoints) {
      if (_.isFunction(endpoint)) {
        return endpoints[method] = {
          action: endpoint
        };
      }
    });
  }; /*
     		Configure the authentication and role requirement on all endpoints (except OPTIONS, which must
     		be configured directly on the endpoint)
     
     		Authentication can be required on an entire route or individual endpoints. If required on an
     		entire route, that serves as the default. If required in any individual endpoints, that will
     		override the default.
     
     		After the endpoint is configured, all authentication and role requirements of an endpoint can be
     		accessed at <code>endpoint.authRequired</code> and <code>endpoint.roleRequired</code>,
     		respectively.
     
     		@param {Route} route The route the endpoints belong to
     		@param {Endpoint} endpoint The endpoint to configure
      */

  Route.prototype._configureEndpoints = function () {
    _.each(this.endpoints, function (endpoint, method) {
      var ref, ref1, ref2;

      if (method !== 'options') {
        if (!((ref = this.options) != null ? ref.roleRequired : void 0)) {
          this.options.roleRequired = [];
        }

        if (!endpoint.roleRequired) {
          endpoint.roleRequired = [];
        }

        endpoint.roleRequired = _.union(endpoint.roleRequired, this.options.roleRequired);

        if (_.isEmpty(endpoint.roleRequired)) {
          endpoint.roleRequired = false;
        }

        if (endpoint.authRequired === void 0) {
          if (((ref1 = this.options) != null ? ref1.authRequired : void 0) || endpoint.roleRequired) {
            endpoint.authRequired = true;
          } else {
            endpoint.authRequired = false;
          }
        }

        if ((ref2 = this.options) != null ? ref2.spaceRequired : void 0) {
          endpoint.spaceRequired = this.options.spaceRequired;
        }
      }
    }, this);
  }; /*
     		Authenticate an endpoint if required, and return the result of calling it
     
     		@returns The endpoint response or a 401 if authentication fails
      */

  Route.prototype._callEndpoint = function (endpointContext, endpoint) {
    var invocation;

    if (this._authAccepted(endpointContext, endpoint)) {
      if (this._roleAccepted(endpointContext, endpoint)) {
        if (this._spaceAccepted(endpointContext, endpoint)) {
          invocation = new DDPCommon.MethodInvocation({
            isSimulation: true,
            userId: endpointContext.userId,
            connection: null,
            randomSeed: DDPCommon.makeRpcSeed()
          });
          return DDP._CurrentInvocation.withValue(invocation, function () {
            return endpoint.action.call(endpointContext);
          });
        } else {
          return {
            statusCode: 403,
            body: {
              status: 'error',
              message: 'Bad X-Space-Id, Only admins of paid space can call this api.'
            }
          };
        }
      } else {
        return {
          statusCode: 403,
          body: {
            status: 'error',
            message: 'You do not have permission to do this.'
          }
        };
      }
    } else {
      return {
        statusCode: 401,
        body: {
          status: 'error',
          message: 'You must be logged in to do this.'
        }
      };
    }
  }; /*
     		Authenticate the given endpoint if required
     
     		Once it's globally configured in the API, authentication can be required on an entire route or
     		individual endpoints. If required on an entire endpoint, that serves as the default. If required
     		in any individual endpoints, that will override the default.
     
     		@returns False if authentication fails, and true otherwise
      */

  Route.prototype._authAccepted = function (endpointContext, endpoint) {
    if (endpoint.authRequired) {
      return this._authenticate(endpointContext);
    } else {
      return true;
    }
  }; /*
     		Verify the request is being made by an actively logged in user
     
     		If verified, attach the authenticated user to the context.
     
     		@returns {Boolean} True if the authentication was successful
      */

  Route.prototype._authenticate = function (endpointContext) {
    var auth, userSelector;
    auth = this.api._config.auth.user.call(endpointContext);

    if ((auth != null ? auth.userId : void 0) && (auth != null ? auth.token : void 0) && !(auth != null ? auth.user : void 0)) {
      userSelector = {};
      userSelector._id = auth.userId;
      userSelector[this.api._config.auth.token] = auth.token;
      auth.user = Meteor.users.findOne(userSelector);
    }

    if (auth != null ? auth.user : void 0) {
      endpointContext.user = auth.user;
      endpointContext.userId = auth.user._id;
      return true;
    } else {
      return false;
    }
  }; /*
     		Authenticate the user role if required
     
     		Must be called after _authAccepted().
     
     		@returns True if the authenticated user belongs to <i>any</i> of the acceptable roles on the
     						 endpoint
      */

  Route.prototype._spaceAccepted = function (endpointContext, endpoint) {
    var auth, space, space_users_count;

    if (endpoint.spaceRequired) {
      auth = this.api._config.auth.user.call(endpointContext);

      if (auth != null ? auth.spaceId : void 0) {
        space_users_count = db.space_users.find({
          user: auth.userId,
          space: auth.spaceId
        }).count();

        if (space_users_count) {
          space = db.spaces.findOne(auth.spaceId);

          if ((space != null ? space.is_paid : void 0) && _.indexOf(space.admins, auth.userId) >= 0) {
            endpointContext.spaceId = auth.spaceId;
            return true;
          }
        }
      }

      endpointContext.spaceId = "bad";
      return false;
    }

    return true;
  }; /*
     		Authenticate the user role if required
     
     		Must be called after _authAccepted().
     
     		@returns True if the authenticated user belongs to <i>any</i> of the acceptable roles on the
     						 endpoint
      */

  Route.prototype._roleAccepted = function (endpointContext, endpoint) {
    if (endpoint.roleRequired) {
      if (_.isEmpty(_.intersection(endpoint.roleRequired, endpointContext.user.roles))) {
        return false;
      }
    }

    return true;
  }; /*
     		Respond to an HTTP request
      */

  Route.prototype._respond = function (response, body, statusCode, headers) {
    var defaultHeaders, delayInMilliseconds, minimumDelayInMilliseconds, randomMultiplierBetweenOneAndTwo, sendResponse;

    if (statusCode == null) {
      statusCode = 200;
    }

    if (headers == null) {
      headers = {};
    }

    defaultHeaders = this._lowerCaseKeys(this.api._config.defaultHeaders);
    headers = this._lowerCaseKeys(headers);
    headers = _.extend(defaultHeaders, headers);

    if (headers['content-type'].match(/json|javascript/) !== null) {
      if (this.api._config.prettyJson) {
        body = JSON.stringify(body, void 0, 2);
      } else {
        body = JSON.stringify(body);
      }
    }

    sendResponse = function () {
      response.writeHead(statusCode, headers);
      response.write(body);
      return response.end();
    };

    if (statusCode === 401 || statusCode === 403) {
      minimumDelayInMilliseconds = 500;
      randomMultiplierBetweenOneAndTwo = 1 + Math.random();
      delayInMilliseconds = minimumDelayInMilliseconds * randomMultiplierBetweenOneAndTwo;
      return Meteor.setTimeout(sendResponse, delayInMilliseconds);
    } else {
      return sendResponse();
    }
  }; /*
     		Return the object with all of the keys converted to lowercase
      */

  Route.prototype._lowerCaseKeys = function (object) {
    return _.chain(object).pairs().map(function (attr) {
      return [attr[0].toLowerCase(), attr[1]];
    }).object().value();
  };

  return Route;
}();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"restivus.coffee":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_odata/lib/restivus/restivus.coffee                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var Cookies,
    OdataRestivus,
    basicAuth,
    indexOf = [].indexOf || function (item) {
  for (var i = 0, l = this.length; i < l; i++) {
    if (i in this && this[i] === item) return i;
  }

  return -1;
};

basicAuth = require('basic-auth');
Cookies = require("cookies");

this.OdataRestivus = function () {
  function OdataRestivus(options) {
    var corsHeaders;
    this._routes = [];
    this._config = {
      paths: [],
      useDefaultAuth: false,
      apiPath: 'api/',
      version: null,
      prettyJson: false,
      auth: {
        token: 'services.resume.loginTokens.hashedToken',
        user: function () {
          var _user, authToken, cookies, spaceId, token, userId;

          cookies = new Cookies(this.request, this.response);
          userId = this.request.headers['x-user-id'] || cookies.get("X-User-Id");
          authToken = this.request.headers['x-auth-token'] || cookies.get("X-Auth-Token");
          spaceId = this.request.headers['x-space-id'] || this.urlParams['spaceId'];

          if (authToken) {
            token = Accounts._hashLoginToken(authToken);
          }

          if (this.request.userId) {
            _user = db.users.findOne({
              _id: this.request.userId
            });
            return {
              user: _user,
              userId: userId,
              spaceId: spaceId,
              token: token
            };
          } else {
            return {
              userId: userId,
              spaceId: spaceId,
              token: token
            };
          }
        }
      },
      defaultHeaders: {
        'Content-Type': 'application/json'
      },
      enableCors: true
    };

    _.extend(this._config, options);

    if (this._config.enableCors) {
      corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, OData-Version'
      };

      if (this._config.useDefaultAuth) {
        corsHeaders['Access-Control-Allow-Headers'] += ', X-User-Id, X-Auth-Token, X-Space-Id';
      }

      _.extend(this._config.defaultHeaders, corsHeaders);

      if (!this._config.defaultOptionsEndpoint) {
        this._config.defaultOptionsEndpoint = function () {
          this.response.writeHead(200, corsHeaders);
          return this.done();
        };
      }
    }

    if (this._config.apiPath[0] === '/') {
      this._config.apiPath = this._config.apiPath.slice(1);
    }

    if (_.last(this._config.apiPath) !== '/') {
      this._config.apiPath = this._config.apiPath + '/';
    }

    if (this._config.version) {
      this._config.apiPath += this._config.version + '/';
    }

    if (this._config.useDefaultAuth) {
      this._initAuth();
    } else if (this._config.useAuth) {
      this._initAuth();

      console.warn('Warning: useAuth API config option will be removed in Restivus v1.0 ' + '\n    Use the useDefaultAuth option instead');
    }

    return this;
  } /**
    		Add endpoints for the given HTTP methods at the given path
    
    		@param path {String} The extended URL path (will be appended to base path of the API)
    		@param options {Object} Route configuration options
    		@param options.authRequired {Boolean} The default auth requirement for each endpoint on the route
    		@param options.roleRequired {String or String[]} The default role required for each endpoint on the route
    		@param endpoints {Object} A set of endpoints available on the new route (get, post, put, patch, delete, options)
    		@param endpoints.<method> {Function or Object} If a function is provided, all default route
    				configuration options will be applied to the endpoint. Otherwise an object with an `action`
    				and all other route config options available. An `action` must be provided with the object.
     */

  OdataRestivus.prototype.addRoute = function (path, options, endpoints) {
    var route;
    route = new share.Route(this, path, options, endpoints);

    this._routes.push(route);

    route.addToApi();
    return this;
  }; /**
     		Generate routes for the Meteor Collection with the given name
      */

  OdataRestivus.prototype.addCollection = function (collection, options) {
    var collectionEndpoints, collectionRouteEndpoints, endpointsAwaitingConfiguration, entityRouteEndpoints, excludedEndpoints, methods, methodsOnCollection, path, routeOptions;

    if (options == null) {
      options = {};
    }

    methods = ['get', 'post', 'put', 'delete', 'getAll'];
    methodsOnCollection = ['post', 'getAll'];

    if (collection === Meteor.users) {
      collectionEndpoints = this._userCollectionEndpoints;
    } else {
      collectionEndpoints = this._collectionEndpoints;
    }

    endpointsAwaitingConfiguration = options.endpoints || {};
    routeOptions = options.routeOptions || {};
    excludedEndpoints = options.excludedEndpoints || [];
    path = options.path || collection._name;
    collectionRouteEndpoints = {};
    entityRouteEndpoints = {};

    if (_.isEmpty(endpointsAwaitingConfiguration) && _.isEmpty(excludedEndpoints)) {
      _.each(methods, function (method) {
        if (indexOf.call(methodsOnCollection, method) >= 0) {
          _.extend(collectionRouteEndpoints, collectionEndpoints[method].call(this, collection));
        } else {
          _.extend(entityRouteEndpoints, collectionEndpoints[method].call(this, collection));
        }
      }, this);
    } else {
      _.each(methods, function (method) {
        var configuredEndpoint, endpointOptions;

        if (indexOf.call(excludedEndpoints, method) < 0 && endpointsAwaitingConfiguration[method] !== false) {
          endpointOptions = endpointsAwaitingConfiguration[method];
          configuredEndpoint = {};

          _.each(collectionEndpoints[method].call(this, collection), function (action, methodType) {
            return configuredEndpoint[methodType] = _.chain(action).clone().extend(endpointOptions).value();
          });

          if (indexOf.call(methodsOnCollection, method) >= 0) {
            _.extend(collectionRouteEndpoints, configuredEndpoint);
          } else {
            _.extend(entityRouteEndpoints, configuredEndpoint);
          }
        }
      }, this);
    }

    this.addRoute(path, routeOptions, collectionRouteEndpoints);
    this.addRoute(path + "/:id", routeOptions, entityRouteEndpoints);
    return this;
  }; /**
     		A set of endpoints that can be applied to a Collection Route
      */

  OdataRestivus.prototype._collectionEndpoints = {
    get: function (collection) {
      return {
        get: {
          action: function () {
            var entity, selector;
            selector = {
              _id: this.urlParams.id
            };

            if (this.spaceId) {
              selector.space = this.spaceId;
            }

            entity = collection.findOne(selector);

            if (entity) {
              return {
                status: 'success',
                data: entity
              };
            } else {
              return {
                statusCode: 404,
                body: {
                  status: 'fail',
                  message: 'Item not found'
                }
              };
            }
          }
        }
      };
    },
    put: function (collection) {
      return {
        put: {
          action: function () {
            var entity, entityIsUpdated, selector;
            selector = {
              _id: this.urlParams.id
            };

            if (this.spaceId) {
              selector.space = this.spaceId;
            }

            entityIsUpdated = collection.update(selector, {
              $set: this.bodyParams
            });

            if (entityIsUpdated) {
              entity = collection.findOne(this.urlParams.id);
              return {
                status: 'success',
                data: entity
              };
            } else {
              return {
                statusCode: 404,
                body: {
                  status: 'fail',
                  message: 'Item not found'
                }
              };
            }
          }
        }
      };
    },
    "delete": function (collection) {
      return {
        "delete": {
          action: function () {
            var selector;
            selector = {
              _id: this.urlParams.id
            };

            if (this.spaceId) {
              selector.space = this.spaceId;
            }

            if (collection.remove(selector)) {
              return {
                status: 'success',
                data: {
                  message: 'Item removed'
                }
              };
            } else {
              return {
                statusCode: 404,
                body: {
                  status: 'fail',
                  message: 'Item not found'
                }
              };
            }
          }
        }
      };
    },
    post: function (collection) {
      return {
        post: {
          action: function () {
            var entity, entityId;

            if (this.spaceId) {
              this.bodyParams.space = this.spaceId;
            }

            entityId = collection.insert(this.bodyParams);
            entity = collection.findOne(entityId);

            if (entity) {
              return {
                statusCode: 201,
                body: {
                  status: 'success',
                  data: entity
                }
              };
            } else {
              return {
                statusCode: 400,
                body: {
                  status: 'fail',
                  message: 'No item added'
                }
              };
            }
          }
        }
      };
    },
    getAll: function (collection) {
      return {
        get: {
          action: function () {
            var entities, selector;
            selector = {};

            if (this.spaceId) {
              selector.space = this.spaceId;
            }

            entities = collection.find(selector).fetch();

            if (entities) {
              return {
                status: 'success',
                data: entities
              };
            } else {
              return {
                statusCode: 404,
                body: {
                  status: 'fail',
                  message: 'Unable to retrieve items from collection'
                }
              };
            }
          }
        }
      };
    }
  }; /**
     		A set of endpoints that can be applied to a Meteor.users Collection Route
      */
  OdataRestivus.prototype._userCollectionEndpoints = {
    get: function (collection) {
      return {
        get: {
          action: function () {
            var entity;
            entity = collection.findOne(this.urlParams.id, {
              fields: {
                profile: 1
              }
            });

            if (entity) {
              return {
                status: 'success',
                data: entity
              };
            } else {
              return {
                statusCode: 404,
                body: {
                  status: 'fail',
                  message: 'User not found'
                }
              };
            }
          }
        }
      };
    },
    put: function (collection) {
      return {
        put: {
          action: function () {
            var entity, entityIsUpdated;
            entityIsUpdated = collection.update(this.urlParams.id, {
              $set: {
                profile: this.bodyParams
              }
            });

            if (entityIsUpdated) {
              entity = collection.findOne(this.urlParams.id, {
                fields: {
                  profile: 1
                }
              });
              return {
                status: "success",
                data: entity
              };
            } else {
              return {
                statusCode: 404,
                body: {
                  status: 'fail',
                  message: 'User not found'
                }
              };
            }
          }
        }
      };
    },
    "delete": function (collection) {
      return {
        "delete": {
          action: function () {
            if (collection.remove(this.urlParams.id)) {
              return {
                status: 'success',
                data: {
                  message: 'User removed'
                }
              };
            } else {
              return {
                statusCode: 404,
                body: {
                  status: 'fail',
                  message: 'User not found'
                }
              };
            }
          }
        }
      };
    },
    post: function (collection) {
      return {
        post: {
          action: function () {
            var entity, entityId;
            entityId = Accounts.createUser(this.bodyParams);
            entity = collection.findOne(entityId, {
              fields: {
                profile: 1
              }
            });

            if (entity) {
              return {
                statusCode: 201,
                body: {
                  status: 'success',
                  data: entity
                }
              };
            } else {
              ({
                statusCode: 400
              });
              return {
                status: 'fail',
                message: 'No user added'
              };
            }
          }
        }
      };
    },
    getAll: function (collection) {
      return {
        get: {
          action: function () {
            var entities;
            entities = collection.find({}, {
              fields: {
                profile: 1
              }
            }).fetch();

            if (entities) {
              return {
                status: 'success',
                data: entities
              };
            } else {
              return {
                statusCode: 404,
                body: {
                  status: 'fail',
                  message: 'Unable to retrieve users'
                }
              };
            }
          }
        }
      };
    }
  }; /*
     		Add /login and /logout endpoints to the API
      */

  OdataRestivus.prototype._initAuth = function () {
    var logout, self;
    self = this; /*
                 			Add a login endpoint to the API
                 
                 			After the user is logged in, the onLoggedIn hook is called (see Restfully.configure() for
                 			adding hook).
                  */
    this.addRoute('login', {
      authRequired: false
    }, {
      post: function () {
        var auth, e, extraData, ref, ref1, response, searchQuery, user;
        user = {};

        if (this.bodyParams.user) {
          if (this.bodyParams.user.indexOf('@') === -1) {
            user.username = this.bodyParams.user;
          } else {
            user.email = this.bodyParams.user;
          }
        } else if (this.bodyParams.username) {
          user.username = this.bodyParams.username;
        } else if (this.bodyParams.email) {
          user.email = this.bodyParams.email;
        }

        try {
          auth = Auth.loginWithPassword(user, this.bodyParams.password);
        } catch (error) {
          e = error;
          console.error(e);
          return {
            statusCode: e.error,
            body: {
              status: 'error',
              message: e.reason
            }
          };
        }

        if (auth.userId && auth.authToken) {
          searchQuery = {};
          searchQuery[self._config.auth.token] = Accounts._hashLoginToken(auth.authToken);
          this.user = Meteor.users.findOne({
            '_id': auth.userId
          }, searchQuery);
          this.userId = (ref = this.user) != null ? ref._id : void 0;
        }

        response = {
          status: 'success',
          data: auth
        };
        extraData = (ref1 = self._config.onLoggedIn) != null ? ref1.call(this) : void 0;

        if (extraData != null) {
          _.extend(response.data, {
            extra: extraData
          });
        }

        return response;
      }
    });

    logout = function () {
      var authToken, extraData, hashedToken, index, ref, response, tokenFieldName, tokenLocation, tokenPath, tokenRemovalQuery, tokenToRemove;
      authToken = this.request.headers['x-auth-token'];
      hashedToken = Accounts._hashLoginToken(authToken);
      tokenLocation = self._config.auth.token;
      index = tokenLocation.lastIndexOf('.');
      tokenPath = tokenLocation.substring(0, index);
      tokenFieldName = tokenLocation.substring(index + 1);
      tokenToRemove = {};
      tokenToRemove[tokenFieldName] = hashedToken;
      tokenRemovalQuery = {};
      tokenRemovalQuery[tokenPath] = tokenToRemove;
      Meteor.users.update(this.user._id, {
        $pull: tokenRemovalQuery
      });
      response = {
        status: 'success',
        data: {
          message: 'You\'ve been logged out!'
        }
      };
      extraData = (ref = self._config.onLoggedOut) != null ? ref.call(this) : void 0;

      if (extraData != null) {
        _.extend(response.data, {
          extra: extraData
        });
      }

      return response;
    }; /*
       			Add a logout endpoint to the API
       
       			After the user is logged out, the onLoggedOut hook is called (see Restfully.configure() for
       			adding hook).
        */

    return this.addRoute('logout', {
      authRequired: true
    }, {
      get: function () {
        console.warn("Warning: Default logout via GET will be removed in Restivus v1.0. Use POST instead.");
        console.warn("    See https://github.com/kahmali/meteor-restivus/issues/100");
        return logout.call(this);
      },
      post: logout
    });
  };

  return OdataRestivus;
}();

OdataRestivus = this.OdataRestivus;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"server":{"objects.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_odata/server/objects.coffee                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.startup(function () {
  var getObject, getObjects;

  getObjects = function (spaceId, userId, object_names) {
    var data;
    data = {};
    object_names.split(',').forEach(function (object_name) {
      var object;
      object = getObject(spaceId, userId, object_name);
      return data[object.name] = object;
    });
    return data;
  };

  getObject = function (spaceId, userId, object_name) {
    var data, fields, object_permissions, psets, psetsAdmin, psetsCurrent, psetsUser;
    data = _.clone(Creator.Objects[Creator.getObjectName(Creator.getObject(object_name, spaceId))]);

    if (!data) {
      throw new Meteor.Error(500, "无效的id " + object_name);
    }

    psetsAdmin = Creator.getCollection("permission_set").findOne({
      space: spaceId,
      name: 'admin'
    }, {
      fields: {
        _id: 1,
        assigned_apps: 1
      }
    });
    psetsUser = Creator.getCollection("permission_set").findOne({
      space: spaceId,
      name: 'user'
    }, {
      fields: {
        _id: 1,
        assigned_apps: 1
      }
    });
    psetsCurrent = Creator.getCollection("permission_set").find({
      users: userId,
      space: spaceId
    }, {
      fields: {
        _id: 1,
        assigned_apps: 1
      }
    }).fetch();
    psets = {
      psetsAdmin: psetsAdmin,
      psetsUser: psetsUser,
      psetsCurrent: psetsCurrent
    };
    object_permissions = Creator.getObjectPermissions.bind(psets)(spaceId, userId, object_name);
    delete data.list_views;
    delete data.permission_set;

    if (object_permissions.allowRead) {
      data.allowRead = true;
      data.allowEdit = object_permissions.allowEdit;
      data.allowDelete = object_permissions.allowDelete;
      data.allowCreate = object_permissions.allowCreate;
      data.modifyAllRecords = object_permissions.modifyAllRecords;
      fields = {};

      _.forEach(data.fields, function (field, key) {
        var _field;

        _field = _.clone(field);

        if (!_field.name) {
          _field.name = key;
        }

        if (_.indexOf(object_permissions.uneditable_fields, _field.name) > -1) {
          _field.readonly = true;
        }

        if (_.indexOf(object_permissions.unreadable_fields, _field.name) < 0) {
          return fields[key] = _field;
        }
      });

      data.fields = fields;
    } else {
      data.allowRead = false;
    }

    return data;
  };

  return JsonRoutes.add('get', SteedosOData.API_PATH + '/objects/:id', function (req, res, next) {
    var _obj, data, e, object_name, ref, ref1, spaceId, userId;

    try {
      userId = Steedos.getUserIdFromAuthToken(req, res);

      if (!userId) {
        throw new Meteor.Error(500, "No permission");
      }

      spaceId = (ref = req.params) != null ? ref.spaceId : void 0;

      if (!spaceId) {
        throw new Meteor.Error(500, "Miss spaceId");
      }

      object_name = (ref1 = req.params) != null ? ref1.id : void 0;

      if (!object_name) {
        throw new Meteor.Error(500, "Miss id");
      }

      _obj = Creator.getCollection("objects").findOne({
        _id: object_name
      });

      if (_obj && _obj.name) {
        object_name = _obj.name;
      }

      if (object_name.split(',').length > 1) {
        data = getObjects(spaceId, userId, object_name);
      } else {
        data = getObject(spaceId, userId, object_name);
      }

      return JsonRoutes.sendResult(res, {
        code: 200,
        data: data || {}
      });
    } catch (error) {
      e = error;
      console.error(e.stack);
      return JsonRoutes.sendResult(res, {
        code: e.error || 500,
        data: {
          errors: e.reason || e.message
        }
      });
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"odata.coffee":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_odata/server/odata.coffee                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.startup(function () {
  var MeteorODataAPIV4Router, MeteorODataRouter, ODataRouter, app, express;
  MeteorODataRouter = require('@steedos/core').MeteorODataRouter;
  ODataRouter = require('@steedos/core').ODataRouter;
  express = require('express');
  app = express();
  app.use('/api/odata/v4', MeteorODataRouter);
  MeteorODataAPIV4Router = require('@steedos/core').MeteorODataAPIV4Router;

  if (MeteorODataAPIV4Router) {
    app.use('/api/v4', MeteorODataAPIV4Router);
  }

  WebApp.connectHandlers.use(app);
  return _.each(Creator.steedosSchema.getDataSources(), function (datasource, name) {
    var otherApp;

    if (name !== 'default') {
      otherApp = express();
      otherApp.use("/api/odata/" + name, ODataRouter);
      return WebApp.connectHandlers.use(otherApp);
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"middleware.coffee":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_odata/server/middleware.coffee                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var Fiber, authorizationCache, basicAuth;
Fiber = require('fibers');
basicAuth = require('basic-auth');
authorizationCache = {};
JsonRoutes.Middleware.use('/api/odata/v4/', function (req, res, next) {
  return Fiber(function () {
    var app_id, app_login_token, auth, authToken, client_id, hashedToken, isAuthed, loginTokens, ref, ref1, ref2, result, token, user, userId;

    if (!req.userId) {
      isAuthed = false;

      if (req != null ? (ref = req.query) != null ? ref.access_token : void 0 : void 0) {
        console.log('OAuth2: ', req.query.access_token);
        userId = Steedos.getUserIdFromAccessToken(req.query.access_token);

        if (userId) {
          user = Meteor.users.findOne({
            _id: userId
          });

          if (user) {
            isAuthed = true;
          }
        }
      }

      if (req.headers['authorization']) {
        auth = basicAuth.parse(req.headers['authorization']);

        if (auth) {
          user = Meteor.users.findOne({
            username: auth.name
          }, {
            fields: {
              'services': 1
            }
          });

          if (user) {
            if (authorizationCache[auth.name] === auth.pass) {
              isAuthed = true;
            } else {
              result = Accounts._checkPassword(user, auth.pass);

              if (!result.error) {
                isAuthed = true;

                if (_.keys(authorizationCache).length > 100) {
                  authorizationCache = {};
                }

                authorizationCache[auth.name] = auth.pass;
              }
            }
          }
        }
      }

      if (isAuthed) {
        req.headers['x-user-id'] = user._id;
        token = null;
        app_id = "creator";
        client_id = "pc";
        loginTokens = (ref1 = user.services) != null ? (ref2 = ref1.resume) != null ? ref2.loginTokens : void 0 : void 0;

        if (loginTokens) {
          app_login_token = _.find(loginTokens, function (t) {
            return t.app_id === app_id && t.client_id === client_id;
          });

          if (app_login_token) {
            token = app_login_token.token;
          }
        }

        if (!token) {
          authToken = Accounts._generateStampedLoginToken();
          token = authToken.token;
          hashedToken = Accounts._hashStampedToken(authToken);
          hashedToken.app_id = app_id;
          hashedToken.client_id = client_id;
          hashedToken.token = token;

          Accounts._insertHashedLoginToken(user._id, hashedToken);
        }

        if (token) {
          req.headers['x-auth-token'] = token;
        }
      }
    }

    return next();
  }).run();
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"metadata.coffee":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_odata/server/metadata.coffee                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.startup(function () {
  var ServiceDocument, ServiceMetadata, _BOOLEAN_TYPES, _DATETIME_OFFSET_TYPES, _NAMESPACE, _NUMBER_TYPES, getObjectsOdataSchema;

  ServiceMetadata = require('odata-v4-service-metadata').ServiceMetadata;
  ServiceDocument = require('odata-v4-service-document').ServiceDocument;
  _NUMBER_TYPES = ["number", "currency"];
  _BOOLEAN_TYPES = ["boolean"];
  _DATETIME_OFFSET_TYPES = ['datetime'];
  _NAMESPACE = "CreatorEntities";

  getObjectsOdataSchema = function (spaceId) {
    var container_schema, entities_schema, schema;
    schema = {
      version: SteedosOData.VERSION,
      dataServices: {
        schema: []
      }
    };
    entities_schema = {};
    entities_schema.namespace = _NAMESPACE;
    entities_schema.entityType = [];
    entities_schema.annotations = [];

    _.each(Creator.Collections, function (value, key, list) {
      var _object, entitie, keys, navigationProperty, property;

      _object = Creator.getObject(key, spaceId);

      if (!(_object != null ? _object.enable_api : void 0)) {
        return;
      }

      keys = [{
        propertyRef: {
          name: "_id",
          computedKey: true
        }
      }];
      entitie = {
        name: _object.name,
        key: keys
      };
      keys.forEach(function (_key) {
        return entities_schema.annotations.push({
          target: _NAMESPACE + "." + _object.name + "/" + _key.propertyRef.name,
          annotation: [{
            "term": "Org.OData.Core.V1.Computed",
            "bool": "true"
          }]
        });
      });
      property = [];
      property.push({
        name: "_id",
        type: "Edm.String",
        nullable: false
      });
      navigationProperty = [];

      _.forEach(_object.fields, function (field, field_name) {
        var _property, reference_to;

        _property = {
          name: field_name,
          type: "Edm.String"
        };

        if (_.contains(_NUMBER_TYPES, field.type)) {
          _property.type = "Edm.Double";
        } else if (_.contains(_BOOLEAN_TYPES, field.type)) {
          _property.type = "Edm.Boolean";
        } else if (_.contains(_DATETIME_OFFSET_TYPES, field.type)) {
          _property.type = "Edm.DateTimeOffset";
          _property.precision = "8";
        }

        if (field.required) {
          _property.nullable = false;
        }

        property.push(_property);
        reference_to = field.reference_to;

        if (reference_to) {
          if (!_.isArray(reference_to)) {
            reference_to = [reference_to];
          }

          return reference_to.forEach(function (r) {
            var _name, reference_obj;

            reference_obj = Creator.getObject(r, spaceId);

            if (reference_obj) {
              _name = field_name + SteedosOData.EXPAND_FIELD_SUFFIX;

              if (_.isArray(field.reference_to)) {
                _name = field_name + SteedosOData.EXPAND_FIELD_SUFFIX + "." + reference_obj.name;
              }

              return navigationProperty.push({
                name: _name,
                type: _NAMESPACE + "." + reference_obj.name,
                partner: _object.name,
                _re_name: reference_obj.name,
                referentialConstraint: [{
                  property: field_name,
                  referencedProperty: "_id"
                }]
              });
            } else {
              return console.warn("reference to '" + r + "' invalid.");
            }
          });
        }
      });

      entitie.property = property;
      entitie.navigationProperty = navigationProperty;
      return entities_schema.entityType.push(entitie);
    });

    schema.dataServices.schema.push(entities_schema);
    container_schema = {};
    container_schema.entityContainer = {
      name: "container"
    };
    container_schema.entityContainer.entitySet = [];

    _.forEach(entities_schema.entityType, function (_et, k) {
      return container_schema.entityContainer.entitySet.push({
        "name": _et.name,
        "entityType": _NAMESPACE + "." + _et.name,
        "navigationPropertyBinding": []
      });
    });

    schema.dataServices.schema.push(container_schema);
    return schema;
  };

  SteedosOdataAPI.addRoute('', {
    authRequired: SteedosOData.AUTHREQUIRED
  }, {
    get: function () {
      var body, context, ref, ref1, serviceDocument;
      context = SteedosOData.getMetaDataPath((ref = this.urlParams) != null ? ref.spaceId : void 0);
      serviceDocument = ServiceDocument.processMetadataJson(getObjectsOdataSchema((ref1 = this.urlParams) != null ? ref1.spaceId : void 0), {
        context: context
      });
      body = serviceDocument.document();
      return {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'OData-Version': SteedosOData.VERSION
        },
        body: serviceDocument.document()
      };
    }
  });
  return SteedosOdataAPI.addRoute(SteedosOData.METADATA_PATH, {
    authRequired: SteedosOData.AUTHREQUIRED
  }, {
    get: function () {
      var body, ref, serviceMetadata;
      serviceMetadata = ServiceMetadata.processMetadataJson(getObjectsOdataSchema((ref = this.urlParams) != null ? ref.spaceId : void 0));
      body = serviceMetadata.document();
      return {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'OData-Version': SteedosOData.VERSION
        },
        body: body
      };
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"core.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_odata/core.coffee                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
this.SteedosOData = {};
SteedosOData.VERSION = '4.0';
SteedosOData.AUTHREQUIRED = true;
SteedosOData.API_PATH = '/api/odata/v4/:spaceId';
SteedosOData.METADATA_PATH = '$metadata';
SteedosOData.EXPAND_FIELD_SUFFIX = "_expand";

SteedosOData.getRootPath = function (spaceId) {
  return Meteor.absoluteUrl('api/odata/v4/' + spaceId);
};

SteedosOData.getODataPath = function (spaceId, object_name) {
  return SteedosOData.getRootPath(spaceId) + ("/" + object_name);
};

if (Meteor.isServer) {
  SteedosOData.getMetaDataPath = function (spaceId) {
    return SteedosOData.getRootPath(spaceId) + ("/" + SteedosOData.METADATA_PATH);
  };

  SteedosOData.getODataContextPath = function (spaceId, object_name) {
    return SteedosOData.getMetaDataPath(spaceId) + ("#" + object_name);
  };

  SteedosOData.getODataNextLinkPath = function (spaceId, object_name) {
    return SteedosOData.getRootPath(spaceId) + ("/" + object_name);
  };

  this.SteedosOdataAPI = new OdataRestivus({
    apiPath: SteedosOData.API_PATH,
    useDefaultAuth: true,
    prettyJson: true,
    enableCors: true,
    defaultHeaders: {
      'Content-Type': 'application/json'
    }
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".coffee"
  ]
});

require("/node_modules/meteor/steedos:odata/checkNpm.js");
require("/node_modules/meteor/steedos:odata/lib/restivus/auth.coffee");
require("/node_modules/meteor/steedos:odata/lib/restivus/iron-router-error-to-response.js");
require("/node_modules/meteor/steedos:odata/lib/restivus/route.coffee");
require("/node_modules/meteor/steedos:odata/lib/restivus/restivus.coffee");
require("/node_modules/meteor/steedos:odata/server/objects.coffee");
require("/node_modules/meteor/steedos:odata/server/odata.coffee");
require("/node_modules/meteor/steedos:odata/server/middleware.coffee");
require("/node_modules/meteor/steedos:odata/server/metadata.coffee");
require("/node_modules/meteor/steedos:odata/core.coffee");

/* Exports */
Package._define("steedos:odata");

})();

//# sourceURL=meteor://💻app/packages/steedos_odata.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpvZGF0YS9jaGVja05wbS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19vZGF0YS9saWIvcmVzdGl2dXMvYXV0aC5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL2xpYi9yZXN0aXZ1cy9hdXRoLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpvZGF0YS9saWIvcmVzdGl2dXMvaXJvbi1yb3V0ZXItZXJyb3ItdG8tcmVzcG9uc2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3Nfb2RhdGEvbGliL3Jlc3RpdnVzL3JvdXRlLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvbGliL3Jlc3RpdnVzL3JvdXRlLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19vZGF0YS9saWIvcmVzdGl2dXMvcmVzdGl2dXMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9saWIvcmVzdGl2dXMvcmVzdGl2dXMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX29kYXRhL3NlcnZlci9vYmplY3RzLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL29iamVjdHMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX29kYXRhL3NlcnZlci9vZGF0YS5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9vZGF0YS5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3Nfb2RhdGEvc2VydmVyL21pZGRsZXdhcmUuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvbWlkZGxld2FyZS5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3Nfb2RhdGEvc2VydmVyL21ldGFkYXRhLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL21ldGFkYXRhLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19vZGF0YS9jb3JlLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvY29yZS5jb2ZmZWUiXSwibmFtZXMiOlsiY2hlY2tOcG1WZXJzaW9ucyIsIm1vZHVsZSIsImxpbmsiLCJ2IiwicmVxdWlyZSIsImNvb2tpZXMiLCJnZXRVc2VyUXVlcnlTZWxlY3RvciIsInVzZXJWYWxpZGF0b3IiLCJBdXRoIiwiTWF0Y2giLCJXaGVyZSIsInVzZXIiLCJjaGVjayIsImlkIiwiT3B0aW9uYWwiLCJTdHJpbmciLCJ1c2VybmFtZSIsImVtYWlsIiwiXyIsImtleXMiLCJsZW5ndGgiLCJFcnJvciIsImxvZ2luV2l0aFBhc3N3b3JkIiwicGFzc3dvcmQiLCJhdXRoVG9rZW4iLCJhdXRoZW50aWNhdGluZ1VzZXIiLCJhdXRoZW50aWNhdGluZ1VzZXJTZWxlY3RvciIsImhhc2hlZFRva2VuIiwicGFzc3dvcmRWZXJpZmljYXRpb24iLCJyZWYiLCJzcGFjZV91c2VycyIsInNwYWNlcyIsIk1ldGVvciIsInVzZXJzIiwiZmluZE9uZSIsInNlcnZpY2VzIiwiQWNjb3VudHMiLCJfY2hlY2tQYXNzd29yZCIsImVycm9yIiwiX2dlbmVyYXRlU3RhbXBlZExvZ2luVG9rZW4iLCJfaGFzaFN0YW1wZWRUb2tlbiIsIl9pbnNlcnRIYXNoZWRMb2dpblRva2VuIiwiX2lkIiwiZGIiLCJmaW5kIiwiZmV0Y2giLCJlYWNoIiwic3UiLCJzcGFjZSIsImlzX3BhaWQiLCJpbmRleE9mIiwiYWRtaW5zIiwicHVzaCIsIm5hbWUiLCJ0b2tlbiIsInVzZXJJZCIsImFkbWluU3BhY2VzIiwiZW52IiwicHJvY2VzcyIsIk5PREVfRU5WIiwiaXJvblJvdXRlclNlbmRFcnJvclRvUmVzcG9uc2UiLCJlcnIiLCJyZXEiLCJyZXMiLCJzdGF0dXNDb2RlIiwic3RhdHVzIiwibXNnIiwic3RhY2siLCJ0b1N0cmluZyIsImNvbnNvbGUiLCJoZWFkZXJzU2VudCIsInNvY2tldCIsImRlc3Ryb3kiLCJzZXRIZWFkZXIiLCJCdWZmZXIiLCJieXRlTGVuZ3RoIiwibWV0aG9kIiwiZW5kIiwic2hhcmUiLCJSb3V0ZSIsImFwaSIsInBhdGgiLCJvcHRpb25zIiwiZW5kcG9pbnRzMSIsImVuZHBvaW50cyIsInByb3RvdHlwZSIsImFkZFRvQXBpIiwiYXZhaWxhYmxlTWV0aG9kcyIsImFsbG93ZWRNZXRob2RzIiwiZnVsbFBhdGgiLCJyZWplY3RlZE1ldGhvZHMiLCJzZWxmIiwiY29udGFpbnMiLCJfY29uZmlnIiwicGF0aHMiLCJleHRlbmQiLCJkZWZhdWx0T3B0aW9uc0VuZHBvaW50IiwiX3Jlc29sdmVFbmRwb2ludHMiLCJfY29uZmlndXJlRW5kcG9pbnRzIiwiZmlsdGVyIiwicmVqZWN0IiwiYXBpUGF0aCIsImVuZHBvaW50IiwiSnNvblJvdXRlcyIsImFkZCIsImRvbmVGdW5jIiwiZW5kcG9pbnRDb250ZXh0IiwicmVzcG9uc2VEYXRhIiwicmVzcG9uc2VJbml0aWF0ZWQiLCJ1cmxQYXJhbXMiLCJwYXJhbXMiLCJxdWVyeVBhcmFtcyIsInF1ZXJ5IiwiYm9keVBhcmFtcyIsImJvZHkiLCJyZXF1ZXN0IiwicmVzcG9uc2UiLCJkb25lIiwiX2NhbGxFbmRwb2ludCIsImVycm9yMSIsImhlYWRlcnMiLCJfcmVzcG9uZCIsIm1lc3NhZ2UiLCJqb2luIiwidG9VcHBlckNhc2UiLCJpc0Z1bmN0aW9uIiwiYWN0aW9uIiwicmVmMSIsInJlZjIiLCJyb2xlUmVxdWlyZWQiLCJ1bmlvbiIsImlzRW1wdHkiLCJhdXRoUmVxdWlyZWQiLCJzcGFjZVJlcXVpcmVkIiwiaW52b2NhdGlvbiIsIl9hdXRoQWNjZXB0ZWQiLCJfcm9sZUFjY2VwdGVkIiwiX3NwYWNlQWNjZXB0ZWQiLCJERFBDb21tb24iLCJNZXRob2RJbnZvY2F0aW9uIiwiaXNTaW11bGF0aW9uIiwiY29ubmVjdGlvbiIsInJhbmRvbVNlZWQiLCJtYWtlUnBjU2VlZCIsIkREUCIsIl9DdXJyZW50SW52b2NhdGlvbiIsIndpdGhWYWx1ZSIsImNhbGwiLCJfYXV0aGVudGljYXRlIiwiYXV0aCIsInVzZXJTZWxlY3RvciIsInNwYWNlX3VzZXJzX2NvdW50Iiwic3BhY2VJZCIsImNvdW50IiwiaW50ZXJzZWN0aW9uIiwicm9sZXMiLCJkZWZhdWx0SGVhZGVycyIsImRlbGF5SW5NaWxsaXNlY29uZHMiLCJtaW5pbXVtRGVsYXlJbk1pbGxpc2Vjb25kcyIsInJhbmRvbU11bHRpcGxpZXJCZXR3ZWVuT25lQW5kVHdvIiwic2VuZFJlc3BvbnNlIiwiX2xvd2VyQ2FzZUtleXMiLCJtYXRjaCIsInByZXR0eUpzb24iLCJKU09OIiwic3RyaW5naWZ5Iiwid3JpdGVIZWFkIiwid3JpdGUiLCJNYXRoIiwicmFuZG9tIiwic2V0VGltZW91dCIsIm9iamVjdCIsImNoYWluIiwicGFpcnMiLCJtYXAiLCJhdHRyIiwidG9Mb3dlckNhc2UiLCJ2YWx1ZSIsIkNvb2tpZXMiLCJPZGF0YVJlc3RpdnVzIiwiYmFzaWNBdXRoIiwiaXRlbSIsImkiLCJsIiwiY29yc0hlYWRlcnMiLCJfcm91dGVzIiwidXNlRGVmYXVsdEF1dGgiLCJ2ZXJzaW9uIiwiX3VzZXIiLCJnZXQiLCJfaGFzaExvZ2luVG9rZW4iLCJlbmFibGVDb3JzIiwic2xpY2UiLCJsYXN0IiwiX2luaXRBdXRoIiwidXNlQXV0aCIsIndhcm4iLCJhZGRSb3V0ZSIsInJvdXRlIiwiYWRkQ29sbGVjdGlvbiIsImNvbGxlY3Rpb24iLCJjb2xsZWN0aW9uRW5kcG9pbnRzIiwiY29sbGVjdGlvblJvdXRlRW5kcG9pbnRzIiwiZW5kcG9pbnRzQXdhaXRpbmdDb25maWd1cmF0aW9uIiwiZW50aXR5Um91dGVFbmRwb2ludHMiLCJleGNsdWRlZEVuZHBvaW50cyIsIm1ldGhvZHMiLCJtZXRob2RzT25Db2xsZWN0aW9uIiwicm91dGVPcHRpb25zIiwiX3VzZXJDb2xsZWN0aW9uRW5kcG9pbnRzIiwiX2NvbGxlY3Rpb25FbmRwb2ludHMiLCJfbmFtZSIsImNvbmZpZ3VyZWRFbmRwb2ludCIsImVuZHBvaW50T3B0aW9ucyIsIm1ldGhvZFR5cGUiLCJjbG9uZSIsImVudGl0eSIsInNlbGVjdG9yIiwiZGF0YSIsInB1dCIsImVudGl0eUlzVXBkYXRlZCIsInVwZGF0ZSIsIiRzZXQiLCJyZW1vdmUiLCJwb3N0IiwiZW50aXR5SWQiLCJpbnNlcnQiLCJnZXRBbGwiLCJlbnRpdGllcyIsImZpZWxkcyIsInByb2ZpbGUiLCJjcmVhdGVVc2VyIiwibG9nb3V0IiwiZSIsImV4dHJhRGF0YSIsInNlYXJjaFF1ZXJ5IiwicmVhc29uIiwib25Mb2dnZWRJbiIsImV4dHJhIiwiaW5kZXgiLCJ0b2tlbkZpZWxkTmFtZSIsInRva2VuTG9jYXRpb24iLCJ0b2tlblBhdGgiLCJ0b2tlblJlbW92YWxRdWVyeSIsInRva2VuVG9SZW1vdmUiLCJsYXN0SW5kZXhPZiIsInN1YnN0cmluZyIsIiRwdWxsIiwib25Mb2dnZWRPdXQiLCJzdGFydHVwIiwiZ2V0T2JqZWN0IiwiZ2V0T2JqZWN0cyIsIm9iamVjdF9uYW1lcyIsInNwbGl0IiwiZm9yRWFjaCIsIm9iamVjdF9uYW1lIiwib2JqZWN0X3Blcm1pc3Npb25zIiwicHNldHMiLCJwc2V0c0FkbWluIiwicHNldHNDdXJyZW50IiwicHNldHNVc2VyIiwiQ3JlYXRvciIsIk9iamVjdHMiLCJnZXRPYmplY3ROYW1lIiwiZ2V0Q29sbGVjdGlvbiIsImFzc2lnbmVkX2FwcHMiLCJnZXRPYmplY3RQZXJtaXNzaW9ucyIsImJpbmQiLCJsaXN0X3ZpZXdzIiwicGVybWlzc2lvbl9zZXQiLCJhbGxvd1JlYWQiLCJhbGxvd0VkaXQiLCJhbGxvd0RlbGV0ZSIsImFsbG93Q3JlYXRlIiwibW9kaWZ5QWxsUmVjb3JkcyIsImZpZWxkIiwia2V5IiwiX2ZpZWxkIiwidW5lZGl0YWJsZV9maWVsZHMiLCJyZWFkb25seSIsInVucmVhZGFibGVfZmllbGRzIiwiU3RlZWRvc09EYXRhIiwiQVBJX1BBVEgiLCJuZXh0IiwiX29iaiIsIlN0ZWVkb3MiLCJnZXRVc2VySWRGcm9tQXV0aFRva2VuIiwic2VuZFJlc3VsdCIsImNvZGUiLCJlcnJvcnMiLCJNZXRlb3JPRGF0YUFQSVY0Um91dGVyIiwiTWV0ZW9yT0RhdGFSb3V0ZXIiLCJPRGF0YVJvdXRlciIsImFwcCIsImV4cHJlc3MiLCJ1c2UiLCJXZWJBcHAiLCJjb25uZWN0SGFuZGxlcnMiLCJzdGVlZG9zU2NoZW1hIiwiZ2V0RGF0YVNvdXJjZXMiLCJkYXRhc291cmNlIiwib3RoZXJBcHAiLCJGaWJlciIsImF1dGhvcml6YXRpb25DYWNoZSIsIk1pZGRsZXdhcmUiLCJhcHBfaWQiLCJhcHBfbG9naW5fdG9rZW4iLCJjbGllbnRfaWQiLCJpc0F1dGhlZCIsImxvZ2luVG9rZW5zIiwicmVzdWx0IiwiYWNjZXNzX3Rva2VuIiwibG9nIiwiZ2V0VXNlcklkRnJvbUFjY2Vzc1Rva2VuIiwicGFyc2UiLCJwYXNzIiwicmVzdW1lIiwidCIsInJ1biIsIlNlcnZpY2VEb2N1bWVudCIsIlNlcnZpY2VNZXRhZGF0YSIsIl9CT09MRUFOX1RZUEVTIiwiX0RBVEVUSU1FX09GRlNFVF9UWVBFUyIsIl9OQU1FU1BBQ0UiLCJfTlVNQkVSX1RZUEVTIiwiZ2V0T2JqZWN0c09kYXRhU2NoZW1hIiwiY29udGFpbmVyX3NjaGVtYSIsImVudGl0aWVzX3NjaGVtYSIsInNjaGVtYSIsIlZFUlNJT04iLCJkYXRhU2VydmljZXMiLCJuYW1lc3BhY2UiLCJlbnRpdHlUeXBlIiwiYW5ub3RhdGlvbnMiLCJDb2xsZWN0aW9ucyIsImxpc3QiLCJfb2JqZWN0IiwiZW50aXRpZSIsIm5hdmlnYXRpb25Qcm9wZXJ0eSIsInByb3BlcnR5IiwiZW5hYmxlX2FwaSIsInByb3BlcnR5UmVmIiwiY29tcHV0ZWRLZXkiLCJfa2V5IiwidGFyZ2V0IiwiYW5ub3RhdGlvbiIsInR5cGUiLCJudWxsYWJsZSIsImZpZWxkX25hbWUiLCJfcHJvcGVydHkiLCJyZWZlcmVuY2VfdG8iLCJwcmVjaXNpb24iLCJyZXF1aXJlZCIsImlzQXJyYXkiLCJyIiwicmVmZXJlbmNlX29iaiIsIkVYUEFORF9GSUVMRF9TVUZGSVgiLCJwYXJ0bmVyIiwiX3JlX25hbWUiLCJyZWZlcmVudGlhbENvbnN0cmFpbnQiLCJyZWZlcmVuY2VkUHJvcGVydHkiLCJlbnRpdHlDb250YWluZXIiLCJlbnRpdHlTZXQiLCJfZXQiLCJrIiwiU3RlZWRvc09kYXRhQVBJIiwiQVVUSFJFUVVJUkVEIiwiY29udGV4dCIsInNlcnZpY2VEb2N1bWVudCIsImdldE1ldGFEYXRhUGF0aCIsInByb2Nlc3NNZXRhZGF0YUpzb24iLCJkb2N1bWVudCIsIk1FVEFEQVRBX1BBVEgiLCJzZXJ2aWNlTWV0YWRhdGEiLCJnZXRSb290UGF0aCIsImFic29sdXRlVXJsIiwiZ2V0T0RhdGFQYXRoIiwiaXNTZXJ2ZXIiLCJnZXRPRGF0YUNvbnRleHRQYXRoIiwiZ2V0T0RhdGFOZXh0TGlua1BhdGgiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSUEsZ0JBQUo7QUFBcUJDLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZLG9DQUFaLEVBQWlEO0FBQUNGLGtCQUFnQixDQUFDRyxDQUFELEVBQUc7QUFBQ0gsb0JBQWdCLEdBQUNHLENBQWpCO0FBQW1COztBQUF4QyxDQUFqRCxFQUEyRixDQUEzRjs7QUFBckI7QUFDQUMsT0FBTyxDQUFDLHlCQUFELENBQVA7O0FBR0FKLGdCQUFnQixDQUFDO0FBQ2hCLGdCQUFjLFFBREU7QUFFaEIsK0JBQTZCLFFBRmI7QUFHaEIsK0JBQTZCLFFBSGI7QUFJaEJLLFNBQU8sRUFBRTtBQUpPLENBQUQsRUFLYixlQUxhLENBQWhCLEM7Ozs7Ozs7Ozs7OztBQ0pBLElBQUFDLG9CQUFBLEVBQUFDLGFBQUE7QUFBQSxLQUFDQyxJQUFELFVBQUNBLElBQUQsR0FBVSxFQUFWLEUsQ0FFQTs7O0FBR0FELGdCQUFnQkUsTUFBTUMsS0FBTixDQUFZLFVBQUNDLElBQUQ7QUFDM0JDLFFBQU1ELElBQU4sRUFDQztBQUFBRSxRQUFJSixNQUFNSyxRQUFOLENBQWVDLE1BQWYsQ0FBSjtBQUNBQyxjQUFVUCxN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O0FBRDBCLENBQTNCOztBQUdBaUksYUFBYStGLFlBQWIsR0FBNEIsVUFBQ2hPLE9BQUQsRUFBU3VHLFdBQVQ7QUFDM0IsU0FBTzBCLGFBQWE2RixXQUFiLENBQXlCOU4sT0FBekIsS0FBb0MsTUFBSXVHLFdBQXhDLENBQVA7QUFEMkIsQ0FBNUI7O0FBR0EsSUFBRy9OLE9BQU95VixRQUFWO0FBQ0NoRyxlQUFhd0YsZUFBYixHQUErQixVQUFDek4sT0FBRDtBQUM5QixXQUFPaUksYUFBYTZGLFdBQWIsQ0FBeUI5TixPQUF6QixLQUFvQyxNQUFJaUksYUFBYTJGLGFBQXJELENBQVA7QUFEOEIsR0FBL0I7O0FBR0EzRixlQUFhaUcsbUJBQWIsR0FBbUMsVUFBQ2xPLE9BQUQsRUFBVXVHLFdBQVY7QUFDbEMsV0FBTzBCLGFBQWF3RixlQUFiLENBQTZCek4sT0FBN0IsS0FBd0MsTUFBSXVHLFdBQTVDLENBQVA7QUFEa0MsR0FBbkM7O0FBRUEwQixlQUFha0csb0JBQWIsR0FBb0MsVUFBQ25PLE9BQUQsRUFBU3VHLFdBQVQ7QUFDbkMsV0FBTzBCLGFBQWE2RixXQUFiLENBQXlCOU4sT0FBekIsS0FBb0MsTUFBSXVHLFdBQXhDLENBQVA7QUFEbUMsR0FBcEM7O0FBSUEsT0FBQzhHLGVBQUQsR0FBbUIsSUFBSTFMLGFBQUosQ0FDbEI7QUFBQTlFLGFBQVNvTCxhQUFhQyxRQUF0QjtBQUNBaEcsb0JBQWdCLElBRGhCO0FBRUF2QixnQkFBWSxJQUZaO0FBR0E0QixnQkFBWSxJQUhaO0FBSUFuQyxvQkFDQztBQUFBLHNCQUFnQjtBQUFoQjtBQUxELEdBRGtCLENBQW5CO0FDaUJBLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3N0ZWVkb3Nfb2RhdGEuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBmaXggd2FybmluZzogeHh4IG5vdCBpbnN0YWxsZWRcclxucmVxdWlyZShcImJhc2ljLWF1dGgvcGFja2FnZS5qc29uXCIpO1xyXG5cclxuaW1wb3J0IHsgY2hlY2tOcG1WZXJzaW9ucyB9IGZyb20gJ21ldGVvci90bWVhc2RheTpjaGVjay1ucG0tdmVyc2lvbnMnO1xyXG5jaGVja05wbVZlcnNpb25zKHtcclxuXHQnYmFzaWMtYXV0aCc6ICdeMi4wLjEnLFxyXG5cdCdvZGF0YS12NC1zZXJ2aWNlLW1ldGFkYXRhJzogXCJeMC4xLjZcIixcclxuXHRcIm9kYXRhLXY0LXNlcnZpY2UtZG9jdW1lbnRcIjogXCJeMC4wLjNcIixcclxuXHRjb29raWVzOiBcIl4wLjYuMVwiLFxyXG59LCAnc3RlZWRvczpvZGF0YScpO1xyXG4iLCJAQXV0aCBvcj0ge31cclxuXHJcbiMjI1xyXG5cdEEgdmFsaWQgdXNlciB3aWxsIGhhdmUgZXhhY3RseSBvbmUgb2YgdGhlIGZvbGxvd2luZyBpZGVudGlmaWNhdGlvbiBmaWVsZHM6IGlkLCB1c2VybmFtZSwgb3IgZW1haWxcclxuIyMjXHJcbnVzZXJWYWxpZGF0b3IgPSBNYXRjaC5XaGVyZSAodXNlcikgLT5cclxuXHRjaGVjayB1c2VyLFxyXG5cdFx0aWQ6IE1hdGNoLk9wdGlvbmFsIFN0cmluZ1xyXG5cdFx0dXNlcm5hbWU6IE1hdGNoLk9wdGlvbmFsIFN0cmluZ1xyXG5cdFx0ZW1haWw6IE1hdGNoLk9wdGlvbmFsIFN0cmluZ1xyXG5cclxuXHRpZiBfLmtleXModXNlcikubGVuZ3RoIGlzIG5vdCAxXHJcblx0XHR0aHJvdyBuZXcgTWF0Y2guRXJyb3IgJ1VzZXIgbXVzdCBoYXZlIGV4YWN0bHkgb25lIGlkZW50aWZpZXIgZmllbGQnXHJcblxyXG5cdHJldHVybiB0cnVlXHJcblxyXG5cclxuIyMjXHJcblx0UmV0dXJuIGEgTW9uZ29EQiBxdWVyeSBzZWxlY3RvciBmb3IgZmluZGluZyB0aGUgZ2l2ZW4gdXNlclxyXG4jIyNcclxuZ2V0VXNlclF1ZXJ5U2VsZWN0b3IgPSAodXNlcikgLT5cclxuXHRpZiB1c2VyLmlkXHJcblx0XHRyZXR1cm4geydfaWQnOiB1c2VyLmlkfVxyXG5cdGVsc2UgaWYgdXNlci51c2VybmFtZVxyXG5cdFx0cmV0dXJuIHsndXNlcm5hbWUnOiB1c2VyLnVzZXJuYW1lfVxyXG5cdGVsc2UgaWYgdXNlci5lbWFpbFxyXG5cdFx0cmV0dXJuIHsnZW1haWxzLmFkZHJlc3MnOiB1c2VyLmVtYWlsfVxyXG5cclxuXHQjIFdlIHNob3VsZG4ndCBiZSBoZXJlIGlmIHRoZSB1c2VyIG9iamVjdCB3YXMgcHJvcGVybHkgdmFsaWRhdGVkXHJcblx0dGhyb3cgbmV3IEVycm9yICdDYW5ub3QgY3JlYXRlIHNlbGVjdG9yIGZyb20gaW52YWxpZCB1c2VyJ1xyXG5cclxuXHJcbiMjI1xyXG5cdExvZyBhIHVzZXIgaW4gd2l0aCB0aGVpciBwYXNzd29yZFxyXG4jIyNcclxuQEF1dGgubG9naW5XaXRoUGFzc3dvcmQgPSAodXNlciwgcGFzc3dvcmQpIC0+XHJcblx0aWYgbm90IHVzZXIgb3Igbm90IHBhc3N3b3JkXHJcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yIDQwMSwgJ1VuYXV0aG9yaXplZCdcclxuXHJcblx0IyBWYWxpZGF0ZSB0aGUgbG9naW4gaW5wdXQgdHlwZXNcclxuXHRjaGVjayB1c2VyLCB1c2VyVmFsaWRhdG9yXHJcblx0Y2hlY2sgcGFzc3dvcmQsIFN0cmluZ1xyXG5cclxuXHQjIFJldHJpZXZlIHRoZSB1c2VyIGZyb20gdGhlIGRhdGFiYXNlXHJcblx0YXV0aGVudGljYXRpbmdVc2VyU2VsZWN0b3IgPSBnZXRVc2VyUXVlcnlTZWxlY3Rvcih1c2VyKVxyXG5cdGF1dGhlbnRpY2F0aW5nVXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKGF1dGhlbnRpY2F0aW5nVXNlclNlbGVjdG9yKVxyXG5cclxuXHRpZiBub3QgYXV0aGVudGljYXRpbmdVc2VyXHJcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yIDQwMSwgJ1VuYXV0aG9yaXplZCdcclxuXHRpZiBub3QgYXV0aGVudGljYXRpbmdVc2VyLnNlcnZpY2VzPy5wYXNzd29yZFxyXG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvciA0MDEsICdVbmF1dGhvcml6ZWQnXHJcblxyXG5cdCMgQXV0aGVudGljYXRlIHRoZSB1c2VyJ3MgcGFzc3dvcmRcclxuXHRwYXNzd29yZFZlcmlmaWNhdGlvbiA9IEFjY291bnRzLl9jaGVja1Bhc3N3b3JkIGF1dGhlbnRpY2F0aW5nVXNlciwgcGFzc3dvcmRcclxuXHRpZiBwYXNzd29yZFZlcmlmaWNhdGlvbi5lcnJvclxyXG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvciA0MDEsICdVbmF1dGhvcml6ZWQnXHJcblxyXG5cdCMgQWRkIGEgbmV3IGF1dGggdG9rZW4gdG8gdGhlIHVzZXIncyBhY2NvdW50XHJcblx0YXV0aFRva2VuID0gQWNjb3VudHMuX2dlbmVyYXRlU3RhbXBlZExvZ2luVG9rZW4oKVxyXG5cdGhhc2hlZFRva2VuID0gQWNjb3VudHMuX2hhc2hTdGFtcGVkVG9rZW4gYXV0aFRva2VuXHJcblx0QWNjb3VudHMuX2luc2VydEhhc2hlZExvZ2luVG9rZW4gYXV0aGVudGljYXRpbmdVc2VyLl9pZCwgaGFzaGVkVG9rZW5cclxuXHJcblx0c3BhY2VfdXNlcnMgPSBkYi5zcGFjZV91c2Vycy5maW5kKHt1c2VyOiBhdXRoZW50aWNhdGluZ1VzZXIuX2lkfSkuZmV0Y2goKVxyXG5cdHNwYWNlcyA9IFtdXHJcblx0Xy5lYWNoIHNwYWNlX3VzZXJzLCAoc3UpLT5cclxuXHRcdHNwYWNlID0gZGIuc3BhY2VzLmZpbmRPbmUoc3Uuc3BhY2UpXHJcblx0XHQjIHNwYWNlIG11c3QgYmUgcGFpZCwgYW5kIHVzZXIgbXVzdCBiZSBhZG1pbnNcclxuXHRcdGlmIHNwYWNlPy5pc19wYWlkIGFuZCBfLmluZGV4T2Yoc3BhY2UuYWRtaW5zLCBzdS51c2VyKT49MFxyXG5cdFx0XHRzcGFjZXMucHVzaFxyXG5cdFx0XHRcdF9pZDogc3BhY2UuX2lkXHJcblx0XHRcdFx0bmFtZTogc3BhY2UubmFtZVxyXG5cdHJldHVybiB7YXV0aFRva2VuOiBhdXRoVG9rZW4udG9rZW4sIHVzZXJJZDogYXV0aGVudGljYXRpbmdVc2VyLl9pZCwgYWRtaW5TcGFjZXM6IHNwYWNlc31cclxuIiwidmFyIGdldFVzZXJRdWVyeVNlbGVjdG9yLCB1c2VyVmFsaWRhdG9yO1xuXG50aGlzLkF1dGggfHwgKHRoaXMuQXV0aCA9IHt9KTtcblxuXG4vKlxuXHRBIHZhbGlkIHVzZXIgd2lsbCBoYXZlIGV4YWN0bHkgb25lIG9mIHRoZSBmb2xsb3dpbmcgaWRlbnRpZmljYXRpb24gZmllbGRzOiBpZCwgdXNlcm5hbWUsIG9yIGVtYWlsXG4gKi9cblxudXNlclZhbGlkYXRvciA9IE1hdGNoLldoZXJlKGZ1bmN0aW9uKHVzZXIpIHtcbiAgY2hlY2sodXNlciwge1xuICAgIGlkOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICAgIHVzZXJuYW1lOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICAgIGVtYWlsOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpXG4gIH0pO1xuICBpZiAoXy5rZXlzKHVzZXIpLmxlbmd0aCA9PT0gITEpIHtcbiAgICB0aHJvdyBuZXcgTWF0Y2guRXJyb3IoJ1VzZXIgbXVzdCBoYXZlIGV4YWN0bHkgb25lIGlkZW50aWZpZXIgZmllbGQnKTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn0pO1xuXG5cbi8qXG5cdFJldHVybiBhIE1vbmdvREIgcXVlcnkgc2VsZWN0b3IgZm9yIGZpbmRpbmcgdGhlIGdpdmVuIHVzZXJcbiAqL1xuXG5nZXRVc2VyUXVlcnlTZWxlY3RvciA9IGZ1bmN0aW9uKHVzZXIpIHtcbiAgaWYgKHVzZXIuaWQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgJ19pZCc6IHVzZXIuaWRcbiAgICB9O1xuICB9IGVsc2UgaWYgKHVzZXIudXNlcm5hbWUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgJ3VzZXJuYW1lJzogdXNlci51c2VybmFtZVxuICAgIH07XG4gIH0gZWxzZSBpZiAodXNlci5lbWFpbCkge1xuICAgIHJldHVybiB7XG4gICAgICAnZW1haWxzLmFkZHJlc3MnOiB1c2VyLmVtYWlsXG4gICAgfTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgc2VsZWN0b3IgZnJvbSBpbnZhbGlkIHVzZXInKTtcbn07XG5cblxuLypcblx0TG9nIGEgdXNlciBpbiB3aXRoIHRoZWlyIHBhc3N3b3JkXG4gKi9cblxudGhpcy5BdXRoLmxvZ2luV2l0aFBhc3N3b3JkID0gZnVuY3Rpb24odXNlciwgcGFzc3dvcmQpIHtcbiAgdmFyIGF1dGhUb2tlbiwgYXV0aGVudGljYXRpbmdVc2VyLCBhdXRoZW50aWNhdGluZ1VzZXJTZWxlY3RvciwgaGFzaGVkVG9rZW4sIHBhc3N3b3JkVmVyaWZpY2F0aW9uLCByZWYsIHNwYWNlX3VzZXJzLCBzcGFjZXM7XG4gIGlmICghdXNlciB8fCAhcGFzc3dvcmQpIHtcbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMSwgJ1VuYXV0aG9yaXplZCcpO1xuICB9XG4gIGNoZWNrKHVzZXIsIHVzZXJWYWxpZGF0b3IpO1xuICBjaGVjayhwYXNzd29yZCwgU3RyaW5nKTtcbiAgYXV0aGVudGljYXRpbmdVc2VyU2VsZWN0b3IgPSBnZXRVc2VyUXVlcnlTZWxlY3Rvcih1c2VyKTtcbiAgYXV0aGVudGljYXRpbmdVc2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUoYXV0aGVudGljYXRpbmdVc2VyU2VsZWN0b3IpO1xuICBpZiAoIWF1dGhlbnRpY2F0aW5nVXNlcikge1xuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAxLCAnVW5hdXRob3JpemVkJyk7XG4gIH1cbiAgaWYgKCEoKHJlZiA9IGF1dGhlbnRpY2F0aW5nVXNlci5zZXJ2aWNlcykgIT0gbnVsbCA/IHJlZi5wYXNzd29yZCA6IHZvaWQgMCkpIHtcbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMSwgJ1VuYXV0aG9yaXplZCcpO1xuICB9XG4gIHBhc3N3b3JkVmVyaWZpY2F0aW9uID0gQWNjb3VudHMuX2NoZWNrUGFzc3dvcmQoYXV0aGVudGljYXRpbmdVc2VyLCBwYXNzd29yZCk7XG4gIGlmIChwYXNzd29yZFZlcmlmaWNhdGlvbi5lcnJvcikge1xuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAxLCAnVW5hdXRob3JpemVkJyk7XG4gIH1cbiAgYXV0aFRva2VuID0gQWNjb3VudHMuX2dlbmVyYXRlU3RhbXBlZExvZ2luVG9rZW4oKTtcbiAgaGFzaGVkVG9rZW4gPSBBY2NvdW50cy5faGFzaFN0YW1wZWRUb2tlbihhdXRoVG9rZW4pO1xuICBBY2NvdW50cy5faW5zZXJ0SGFzaGVkTG9naW5Ub2tlbihhdXRoZW50aWNhdGluZ1VzZXIuX2lkLCBoYXNoZWRUb2tlbik7XG4gIHNwYWNlX3VzZXJzID0gZGIuc3BhY2VfdXNlcnMuZmluZCh7XG4gICAgdXNlcjogYXV0aGVudGljYXRpbmdVc2VyLl9pZFxuICB9KS5mZXRjaCgpO1xuICBzcGFjZXMgPSBbXTtcbiAgXy5lYWNoKHNwYWNlX3VzZXJzLCBmdW5jdGlvbihzdSkge1xuICAgIHZhciBzcGFjZTtcbiAgICBzcGFjZSA9IGRiLnNwYWNlcy5maW5kT25lKHN1LnNwYWNlKTtcbiAgICBpZiAoKHNwYWNlICE9IG51bGwgPyBzcGFjZS5pc19wYWlkIDogdm9pZCAwKSAmJiBfLmluZGV4T2Yoc3BhY2UuYWRtaW5zLCBzdS51c2VyKSA+PSAwKSB7XG4gICAgICByZXR1cm4gc3BhY2VzLnB1c2goe1xuICAgICAgICBfaWQ6IHNwYWNlLl9pZCxcbiAgICAgICAgbmFtZTogc3BhY2UubmFtZVxuICAgICAgfSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHtcbiAgICBhdXRoVG9rZW46IGF1dGhUb2tlbi50b2tlbixcbiAgICB1c2VySWQ6IGF1dGhlbnRpY2F0aW5nVXNlci5faWQsXG4gICAgYWRtaW5TcGFjZXM6IHNwYWNlc1xuICB9O1xufTtcbiIsIi8vIFdlIG5lZWQgYSBmdW5jdGlvbiB0aGF0IHRyZWF0cyB0aHJvd24gZXJyb3JzIGV4YWN0bHkgbGlrZSBJcm9uIFJvdXRlciB3b3VsZC5cclxuLy8gVGhpcyBmaWxlIGlzIHdyaXR0ZW4gaW4gSmF2YVNjcmlwdCB0byBlbmFibGUgY29weS1wYXN0aW5nIElyb24gUm91dGVyIGNvZGUuXHJcblxyXG4vLyBUYWtlbiBmcm9tOiBodHRwczovL2dpdGh1Yi5jb20vaXJvbi1tZXRlb3IvaXJvbi1yb3V0ZXIvYmxvYi85YzM2OTQ5OWM5OGFmOWZkMTJlZjllNjgzMzhkZWUzYjFiMTI3NmFhL2xpYi9yb3V0ZXJfc2VydmVyLmpzI0wzXHJcbnZhciBlbnYgPSBwcm9jZXNzLmVudi5OT0RFX0VOViB8fCAnZGV2ZWxvcG1lbnQnO1xyXG5cclxuLy8gVGFrZW4gZnJvbTogaHR0cHM6Ly9naXRodWIuY29tL2lyb24tbWV0ZW9yL2lyb24tcm91dGVyL2Jsb2IvOWMzNjk0OTljOThhZjlmZDEyZWY5ZTY4MzM4ZGVlM2IxYjEyNzZhYS9saWIvcm91dGVyX3NlcnZlci5qcyNMNDdcclxuaXJvblJvdXRlclNlbmRFcnJvclRvUmVzcG9uc2UgPSBmdW5jdGlvbihlcnIsIHJlcSwgcmVzKSB7XHJcblx0aWYgKHJlcy5zdGF0dXNDb2RlIDwgNDAwKVxyXG5cdFx0cmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcblxyXG5cdGlmIChlcnIuc3RhdHVzKVxyXG5cdFx0cmVzLnN0YXR1c0NvZGUgPSBlcnIuc3RhdHVzO1xyXG5cclxuXHRpZiAoZW52ID09PSAnZGV2ZWxvcG1lbnQnKVxyXG5cdFx0bXNnID0gKGVyci5zdGFjayB8fCBlcnIudG9TdHJpbmcoKSkgKyAnXFxuJztcclxuXHRlbHNlXHJcblx0Ly9YWFggZ2V0IHRoaXMgZnJvbSBzdGFuZGFyZCBkaWN0IG9mIGVycm9yIG1lc3NhZ2VzP1xyXG5cdFx0bXNnID0gJ1NlcnZlciBlcnJvci4nO1xyXG5cclxuXHRjb25zb2xlLmVycm9yKGVyci5zdGFjayB8fCBlcnIudG9TdHJpbmcoKSk7XHJcblxyXG5cdGlmIChyZXMuaGVhZGVyc1NlbnQpXHJcblx0XHRyZXR1cm4gcmVxLnNvY2tldC5kZXN0cm95KCk7XHJcblxyXG5cdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICd0ZXh0L2h0bWwnKTtcclxuXHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LUxlbmd0aCcsIEJ1ZmZlci5ieXRlTGVuZ3RoKG1zZykpO1xyXG5cdGlmIChyZXEubWV0aG9kID09PSAnSEVBRCcpXHJcblx0XHRyZXR1cm4gcmVzLmVuZCgpO1xyXG5cdHJlcy5lbmQobXNnKTtcclxuXHRyZXR1cm47XHJcbn1cclxuIiwiY2xhc3Mgc2hhcmUuUm91dGVcclxuXHJcblx0Y29uc3RydWN0b3I6IChAYXBpLCBAcGF0aCwgQG9wdGlvbnMsIEBlbmRwb2ludHMpIC0+XHJcblx0XHQjIENoZWNrIGlmIG9wdGlvbnMgd2VyZSBwcm92aWRlZFxyXG5cdFx0aWYgbm90IEBlbmRwb2ludHNcclxuXHRcdFx0QGVuZHBvaW50cyA9IEBvcHRpb25zXHJcblx0XHRcdEBvcHRpb25zID0ge31cclxuXHJcblxyXG5cdGFkZFRvQXBpOiBkbyAtPlxyXG5cdFx0YXZhaWxhYmxlTWV0aG9kcyA9IFsnZ2V0JywgJ3Bvc3QnLCAncHV0JywgJ3BhdGNoJywgJ2RlbGV0ZScsICdvcHRpb25zJ11cclxuXHJcblx0XHRyZXR1cm4gLT5cclxuXHRcdFx0c2VsZiA9IHRoaXNcclxuXHJcblx0XHRcdCMgVGhyb3cgYW4gZXJyb3IgaWYgYSByb3V0ZSBoYXMgYWxyZWFkeSBiZWVuIGFkZGVkIGF0IHRoaXMgcGF0aFxyXG5cdFx0XHQjIFRPRE86IENoZWNrIGZvciBjb2xsaXNpb25zIHdpdGggcGF0aHMgdGhhdCBmb2xsb3cgc2FtZSBwYXR0ZXJuIHdpdGggZGlmZmVyZW50IHBhcmFtZXRlciBuYW1lc1xyXG5cdFx0XHRpZiBfLmNvbnRhaW5zIEBhcGkuX2NvbmZpZy5wYXRocywgQHBhdGhcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJDYW5ub3QgYWRkIGEgcm91dGUgYXQgYW4gZXhpc3RpbmcgcGF0aDogI3tAcGF0aH1cIlxyXG5cclxuXHRcdFx0IyBPdmVycmlkZSB0aGUgZGVmYXVsdCBPUFRJT05TIGVuZHBvaW50IHdpdGggb3VyIG93blxyXG5cdFx0XHRAZW5kcG9pbnRzID0gXy5leHRlbmQgb3B0aW9uczogQGFwaS5fY29uZmlnLmRlZmF1bHRPcHRpb25zRW5kcG9pbnQsIEBlbmRwb2ludHNcclxuXHJcblx0XHRcdCMgQ29uZmlndXJlIGVhY2ggZW5kcG9pbnQgb24gdGhpcyByb3V0ZVxyXG5cdFx0XHRAX3Jlc29sdmVFbmRwb2ludHMoKVxyXG5cdFx0XHRAX2NvbmZpZ3VyZUVuZHBvaW50cygpXHJcblxyXG5cdFx0XHQjIEFkZCB0byBvdXIgbGlzdCBvZiBleGlzdGluZyBwYXRoc1xyXG5cdFx0XHRAYXBpLl9jb25maWcucGF0aHMucHVzaCBAcGF0aFxyXG5cclxuXHRcdFx0YWxsb3dlZE1ldGhvZHMgPSBfLmZpbHRlciBhdmFpbGFibGVNZXRob2RzLCAobWV0aG9kKSAtPlxyXG5cdFx0XHRcdF8uY29udGFpbnMoXy5rZXlzKHNlbGYuZW5kcG9pbnRzKSwgbWV0aG9kKVxyXG5cdFx0XHRyZWplY3RlZE1ldGhvZHMgPSBfLnJlamVjdCBhdmFpbGFibGVNZXRob2RzLCAobWV0aG9kKSAtPlxyXG5cdFx0XHRcdF8uY29udGFpbnMoXy5rZXlzKHNlbGYuZW5kcG9pbnRzKSwgbWV0aG9kKVxyXG5cclxuXHRcdFx0IyBTZXR1cCBlbmRwb2ludHMgb24gcm91dGVcclxuXHRcdFx0ZnVsbFBhdGggPSBAYXBpLl9jb25maWcuYXBpUGF0aCArIEBwYXRoXHJcblx0XHRcdF8uZWFjaCBhbGxvd2VkTWV0aG9kcywgKG1ldGhvZCkgLT5cclxuXHRcdFx0XHRlbmRwb2ludCA9IHNlbGYuZW5kcG9pbnRzW21ldGhvZF1cclxuXHRcdFx0XHRKc29uUm91dGVzLmFkZCBtZXRob2QsIGZ1bGxQYXRoLCAocmVxLCByZXMpIC0+XHJcblx0XHRcdFx0XHQjIEFkZCBmdW5jdGlvbiB0byBlbmRwb2ludCBjb250ZXh0IGZvciBpbmRpY2F0aW5nIGEgcmVzcG9uc2UgaGFzIGJlZW4gaW5pdGlhdGVkIG1hbnVhbGx5XHJcblx0XHRcdFx0XHRyZXNwb25zZUluaXRpYXRlZCA9IGZhbHNlXHJcblx0XHRcdFx0XHRkb25lRnVuYyA9IC0+XHJcblx0XHRcdFx0XHRcdHJlc3BvbnNlSW5pdGlhdGVkID0gdHJ1ZVxyXG5cclxuXHRcdFx0XHRcdGVuZHBvaW50Q29udGV4dCA9XHJcblx0XHRcdFx0XHRcdHVybFBhcmFtczogcmVxLnBhcmFtc1xyXG5cdFx0XHRcdFx0XHRxdWVyeVBhcmFtczogcmVxLnF1ZXJ5XHJcblx0XHRcdFx0XHRcdGJvZHlQYXJhbXM6IHJlcS5ib2R5XHJcblx0XHRcdFx0XHRcdHJlcXVlc3Q6IHJlcVxyXG5cdFx0XHRcdFx0XHRyZXNwb25zZTogcmVzXHJcblx0XHRcdFx0XHRcdGRvbmU6IGRvbmVGdW5jXHJcblx0XHRcdFx0XHQjIEFkZCBlbmRwb2ludCBjb25maWcgb3B0aW9ucyB0byBjb250ZXh0XHJcblx0XHRcdFx0XHRfLmV4dGVuZCBlbmRwb2ludENvbnRleHQsIGVuZHBvaW50XHJcblxyXG5cdFx0XHRcdFx0IyBSdW4gdGhlIHJlcXVlc3RlZCBlbmRwb2ludFxyXG5cdFx0XHRcdFx0cmVzcG9uc2VEYXRhID0gbnVsbFxyXG5cdFx0XHRcdFx0dHJ5XHJcblx0XHRcdFx0XHRcdHJlc3BvbnNlRGF0YSA9IHNlbGYuX2NhbGxFbmRwb2ludCBlbmRwb2ludENvbnRleHQsIGVuZHBvaW50XHJcblx0XHRcdFx0XHRjYXRjaCBlcnJvclxyXG5cdFx0XHRcdFx0XHQjIERvIGV4YWN0bHkgd2hhdCBJcm9uIFJvdXRlciB3b3VsZCBoYXZlIGRvbmUsIHRvIGF2b2lkIGNoYW5naW5nIHRoZSBBUElcclxuXHRcdFx0XHRcdFx0aXJvblJvdXRlclNlbmRFcnJvclRvUmVzcG9uc2UoZXJyb3IsIHJlcSwgcmVzKTtcclxuXHRcdFx0XHRcdFx0cmV0dXJuXHJcblxyXG5cdFx0XHRcdFx0aWYgcmVzcG9uc2VJbml0aWF0ZWRcclxuXHRcdFx0XHRcdFx0IyBFbnN1cmUgdGhlIHJlc3BvbnNlIGlzIHByb3Blcmx5IGNvbXBsZXRlZFxyXG5cdFx0XHRcdFx0XHRyZXMuZW5kKClcclxuXHRcdFx0XHRcdFx0cmV0dXJuXHJcblx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdGlmIHJlcy5oZWFkZXJzU2VudFxyXG5cdFx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvciBcIk11c3QgY2FsbCB0aGlzLmRvbmUoKSBhZnRlciBoYW5kbGluZyBlbmRwb2ludCByZXNwb25zZSBtYW51YWxseTogI3ttZXRob2R9ICN7ZnVsbFBhdGh9XCJcclxuXHRcdFx0XHRcdFx0ZWxzZSBpZiByZXNwb25zZURhdGEgaXMgbnVsbCBvciByZXNwb25zZURhdGEgaXMgdW5kZWZpbmVkXHJcblx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiQ2Fubm90IHJldHVybiBudWxsIG9yIHVuZGVmaW5lZCBmcm9tIGFuIGVuZHBvaW50OiAje21ldGhvZH0gI3tmdWxsUGF0aH1cIlxyXG5cclxuXHRcdFx0XHRcdCMgR2VuZXJhdGUgYW5kIHJldHVybiB0aGUgaHR0cCByZXNwb25zZSwgaGFuZGxpbmcgdGhlIGRpZmZlcmVudCBlbmRwb2ludCByZXNwb25zZSB0eXBlc1xyXG5cdFx0XHRcdFx0aWYgcmVzcG9uc2VEYXRhLmJvZHkgYW5kIChyZXNwb25zZURhdGEuc3RhdHVzQ29kZSBvciByZXNwb25zZURhdGEuaGVhZGVycylcclxuXHRcdFx0XHRcdFx0c2VsZi5fcmVzcG9uZCByZXMsIHJlc3BvbnNlRGF0YS5ib2R5LCByZXNwb25zZURhdGEuc3RhdHVzQ29kZSwgcmVzcG9uc2VEYXRhLmhlYWRlcnNcclxuXHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0c2VsZi5fcmVzcG9uZCByZXMsIHJlc3BvbnNlRGF0YVxyXG5cclxuXHRcdFx0Xy5lYWNoIHJlamVjdGVkTWV0aG9kcywgKG1ldGhvZCkgLT5cclxuXHRcdFx0XHRKc29uUm91dGVzLmFkZCBtZXRob2QsIGZ1bGxQYXRoLCAocmVxLCByZXMpIC0+XHJcblx0XHRcdFx0XHRyZXNwb25zZURhdGEgPSBzdGF0dXM6ICdlcnJvcicsIG1lc3NhZ2U6ICdBUEkgZW5kcG9pbnQgZG9lcyBub3QgZXhpc3QnXHJcblx0XHRcdFx0XHRoZWFkZXJzID0gJ0FsbG93JzogYWxsb3dlZE1ldGhvZHMuam9pbignLCAnKS50b1VwcGVyQ2FzZSgpXHJcblx0XHRcdFx0XHRzZWxmLl9yZXNwb25kIHJlcywgcmVzcG9uc2VEYXRhLCA0MDUsIGhlYWRlcnNcclxuXHJcblxyXG5cdCMjI1xyXG5cdFx0Q29udmVydCBhbGwgZW5kcG9pbnRzIG9uIHRoZSBnaXZlbiByb3V0ZSBpbnRvIG91ciBleHBlY3RlZCBlbmRwb2ludCBvYmplY3QgaWYgaXQgaXMgYSBiYXJlXHJcblx0XHRmdW5jdGlvblxyXG5cclxuXHRcdEBwYXJhbSB7Um91dGV9IHJvdXRlIFRoZSByb3V0ZSB0aGUgZW5kcG9pbnRzIGJlbG9uZyB0b1xyXG5cdCMjI1xyXG5cdF9yZXNvbHZlRW5kcG9pbnRzOiAtPlxyXG5cdFx0Xy5lYWNoIEBlbmRwb2ludHMsIChlbmRwb2ludCwgbWV0aG9kLCBlbmRwb2ludHMpIC0+XHJcblx0XHRcdGlmIF8uaXNGdW5jdGlvbihlbmRwb2ludClcclxuXHRcdFx0XHRlbmRwb2ludHNbbWV0aG9kXSA9IHthY3Rpb246IGVuZHBvaW50fVxyXG5cdFx0cmV0dXJuXHJcblxyXG5cclxuXHQjIyNcclxuXHRcdENvbmZpZ3VyZSB0aGUgYXV0aGVudGljYXRpb24gYW5kIHJvbGUgcmVxdWlyZW1lbnQgb24gYWxsIGVuZHBvaW50cyAoZXhjZXB0IE9QVElPTlMsIHdoaWNoIG11c3RcclxuXHRcdGJlIGNvbmZpZ3VyZWQgZGlyZWN0bHkgb24gdGhlIGVuZHBvaW50KVxyXG5cclxuXHRcdEF1dGhlbnRpY2F0aW9uIGNhbiBiZSByZXF1aXJlZCBvbiBhbiBlbnRpcmUgcm91dGUgb3IgaW5kaXZpZHVhbCBlbmRwb2ludHMuIElmIHJlcXVpcmVkIG9uIGFuXHJcblx0XHRlbnRpcmUgcm91dGUsIHRoYXQgc2VydmVzIGFzIHRoZSBkZWZhdWx0LiBJZiByZXF1aXJlZCBpbiBhbnkgaW5kaXZpZHVhbCBlbmRwb2ludHMsIHRoYXQgd2lsbFxyXG5cdFx0b3ZlcnJpZGUgdGhlIGRlZmF1bHQuXHJcblxyXG5cdFx0QWZ0ZXIgdGhlIGVuZHBvaW50IGlzIGNvbmZpZ3VyZWQsIGFsbCBhdXRoZW50aWNhdGlvbiBhbmQgcm9sZSByZXF1aXJlbWVudHMgb2YgYW4gZW5kcG9pbnQgY2FuIGJlXHJcblx0XHRhY2Nlc3NlZCBhdCA8Y29kZT5lbmRwb2ludC5hdXRoUmVxdWlyZWQ8L2NvZGU+IGFuZCA8Y29kZT5lbmRwb2ludC5yb2xlUmVxdWlyZWQ8L2NvZGU+LFxyXG5cdFx0cmVzcGVjdGl2ZWx5LlxyXG5cclxuXHRcdEBwYXJhbSB7Um91dGV9IHJvdXRlIFRoZSByb3V0ZSB0aGUgZW5kcG9pbnRzIGJlbG9uZyB0b1xyXG5cdFx0QHBhcmFtIHtFbmRwb2ludH0gZW5kcG9pbnQgVGhlIGVuZHBvaW50IHRvIGNvbmZpZ3VyZVxyXG5cdCMjI1xyXG5cdF9jb25maWd1cmVFbmRwb2ludHM6IC0+XHJcblx0XHRfLmVhY2ggQGVuZHBvaW50cywgKGVuZHBvaW50LCBtZXRob2QpIC0+XHJcblx0XHRcdGlmIG1ldGhvZCBpc250ICdvcHRpb25zJ1xyXG5cdFx0XHRcdCMgQ29uZmlndXJlIGFjY2VwdGFibGUgcm9sZXNcclxuXHRcdFx0XHRpZiBub3QgQG9wdGlvbnM/LnJvbGVSZXF1aXJlZFxyXG5cdFx0XHRcdFx0QG9wdGlvbnMucm9sZVJlcXVpcmVkID0gW11cclxuXHRcdFx0XHRpZiBub3QgZW5kcG9pbnQucm9sZVJlcXVpcmVkXHJcblx0XHRcdFx0XHRlbmRwb2ludC5yb2xlUmVxdWlyZWQgPSBbXVxyXG5cdFx0XHRcdGVuZHBvaW50LnJvbGVSZXF1aXJlZCA9IF8udW5pb24gZW5kcG9pbnQucm9sZVJlcXVpcmVkLCBAb3B0aW9ucy5yb2xlUmVxdWlyZWRcclxuXHRcdFx0XHQjIE1ha2UgaXQgZWFzaWVyIHRvIGNoZWNrIGlmIG5vIHJvbGVzIGFyZSByZXF1aXJlZFxyXG5cdFx0XHRcdGlmIF8uaXNFbXB0eSBlbmRwb2ludC5yb2xlUmVxdWlyZWRcclxuXHRcdFx0XHRcdGVuZHBvaW50LnJvbGVSZXF1aXJlZCA9IGZhbHNlXHJcblxyXG5cdFx0XHRcdCMgQ29uZmlndXJlIGF1dGggcmVxdWlyZW1lbnRcclxuXHRcdFx0XHRpZiBlbmRwb2ludC5hdXRoUmVxdWlyZWQgaXMgdW5kZWZpbmVkXHJcblx0XHRcdFx0XHRpZiBAb3B0aW9ucz8uYXV0aFJlcXVpcmVkIG9yIGVuZHBvaW50LnJvbGVSZXF1aXJlZFxyXG5cdFx0XHRcdFx0XHRlbmRwb2ludC5hdXRoUmVxdWlyZWQgPSB0cnVlXHJcblx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdGVuZHBvaW50LmF1dGhSZXF1aXJlZCA9IGZhbHNlXHJcblxyXG5cdFx0XHRcdGlmIEBvcHRpb25zPy5zcGFjZVJlcXVpcmVkXHJcblx0XHRcdFx0XHRlbmRwb2ludC5zcGFjZVJlcXVpcmVkID0gQG9wdGlvbnMuc3BhY2VSZXF1aXJlZFxyXG5cdFx0XHRcdHJldHVyblxyXG5cdFx0LCB0aGlzXHJcblx0XHRyZXR1cm5cclxuXHJcblxyXG5cdCMjI1xyXG5cdFx0QXV0aGVudGljYXRlIGFuIGVuZHBvaW50IGlmIHJlcXVpcmVkLCBhbmQgcmV0dXJuIHRoZSByZXN1bHQgb2YgY2FsbGluZyBpdFxyXG5cclxuXHRcdEByZXR1cm5zIFRoZSBlbmRwb2ludCByZXNwb25zZSBvciBhIDQwMSBpZiBhdXRoZW50aWNhdGlvbiBmYWlsc1xyXG5cdCMjI1xyXG5cdF9jYWxsRW5kcG9pbnQ6IChlbmRwb2ludENvbnRleHQsIGVuZHBvaW50KSAtPlxyXG5cdFx0IyBDYWxsIHRoZSBlbmRwb2ludCBpZiBhdXRoZW50aWNhdGlvbiBkb2Vzbid0IGZhaWxcclxuXHRcdGlmIEBfYXV0aEFjY2VwdGVkIGVuZHBvaW50Q29udGV4dCwgZW5kcG9pbnRcclxuXHRcdFx0aWYgQF9yb2xlQWNjZXB0ZWQgZW5kcG9pbnRDb250ZXh0LCBlbmRwb2ludFxyXG5cdFx0XHRcdGlmIEBfc3BhY2VBY2NlcHRlZCBlbmRwb2ludENvbnRleHQsIGVuZHBvaW50XHJcblx0XHRcdFx0XHQjZW5kcG9pbnQuYWN0aW9uLmNhbGwgZW5kcG9pbnRDb250ZXh0XHJcblx0XHRcdFx0XHRpbnZvY2F0aW9uID0gbmV3IEREUENvbW1vbi5NZXRob2RJbnZvY2F0aW9uXHJcblx0XHRcdFx0XHRcdGlzU2ltdWxhdGlvbjogdHJ1ZSxcclxuXHRcdFx0XHRcdFx0dXNlcklkOiBlbmRwb2ludENvbnRleHQudXNlcklkLFxyXG5cdFx0XHRcdFx0XHRjb25uZWN0aW9uOiBudWxsLFxyXG5cdFx0XHRcdFx0XHRyYW5kb21TZWVkOiBERFBDb21tb24ubWFrZVJwY1NlZWQoKVxyXG5cclxuXHRcdFx0XHRcdHJldHVybiBERFAuX0N1cnJlbnRJbnZvY2F0aW9uLndpdGhWYWx1ZSBpbnZvY2F0aW9uLCAtPlxyXG5cdFx0XHRcdFx0XHRyZXR1cm4gZW5kcG9pbnQuYWN0aW9uLmNhbGwoZW5kcG9pbnRDb250ZXh0KTtcclxuXHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDNcclxuXHRcdFx0XHRcdGJvZHk6IHtzdGF0dXM6ICdlcnJvcicsIG1lc3NhZ2U6ICdCYWQgWC1TcGFjZS1JZCwgT25seSBhZG1pbnMgb2YgcGFpZCBzcGFjZSBjYW4gY2FsbCB0aGlzIGFwaS4nfVxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0c3RhdHVzQ29kZTogNDAzXHJcblx0XHRcdFx0Ym9keToge3N0YXR1czogJ2Vycm9yJywgbWVzc2FnZTogJ1lvdSBkbyBub3QgaGF2ZSBwZXJtaXNzaW9uIHRvIGRvIHRoaXMuJ31cclxuXHRcdGVsc2VcclxuXHRcdFx0c3RhdHVzQ29kZTogNDAxXHJcblx0XHRcdGJvZHk6IHtzdGF0dXM6ICdlcnJvcicsIG1lc3NhZ2U6ICdZb3UgbXVzdCBiZSBsb2dnZWQgaW4gdG8gZG8gdGhpcy4nfVxyXG5cclxuXHJcblx0IyMjXHJcblx0XHRBdXRoZW50aWNhdGUgdGhlIGdpdmVuIGVuZHBvaW50IGlmIHJlcXVpcmVkXHJcblxyXG5cdFx0T25jZSBpdCdzIGdsb2JhbGx5IGNvbmZpZ3VyZWQgaW4gdGhlIEFQSSwgYXV0aGVudGljYXRpb24gY2FuIGJlIHJlcXVpcmVkIG9uIGFuIGVudGlyZSByb3V0ZSBvclxyXG5cdFx0aW5kaXZpZHVhbCBlbmRwb2ludHMuIElmIHJlcXVpcmVkIG9uIGFuIGVudGlyZSBlbmRwb2ludCwgdGhhdCBzZXJ2ZXMgYXMgdGhlIGRlZmF1bHQuIElmIHJlcXVpcmVkXHJcblx0XHRpbiBhbnkgaW5kaXZpZHVhbCBlbmRwb2ludHMsIHRoYXQgd2lsbCBvdmVycmlkZSB0aGUgZGVmYXVsdC5cclxuXHJcblx0XHRAcmV0dXJucyBGYWxzZSBpZiBhdXRoZW50aWNhdGlvbiBmYWlscywgYW5kIHRydWUgb3RoZXJ3aXNlXHJcblx0IyMjXHJcblx0X2F1dGhBY2NlcHRlZDogKGVuZHBvaW50Q29udGV4dCwgZW5kcG9pbnQpIC0+XHJcblx0XHRpZiBlbmRwb2ludC5hdXRoUmVxdWlyZWRcclxuXHRcdFx0QF9hdXRoZW50aWNhdGUgZW5kcG9pbnRDb250ZXh0XHJcblx0XHRlbHNlIHRydWVcclxuXHJcblxyXG5cdCMjI1xyXG5cdFx0VmVyaWZ5IHRoZSByZXF1ZXN0IGlzIGJlaW5nIG1hZGUgYnkgYW4gYWN0aXZlbHkgbG9nZ2VkIGluIHVzZXJcclxuXHJcblx0XHRJZiB2ZXJpZmllZCwgYXR0YWNoIHRoZSBhdXRoZW50aWNhdGVkIHVzZXIgdG8gdGhlIGNvbnRleHQuXHJcblxyXG5cdFx0QHJldHVybnMge0Jvb2xlYW59IFRydWUgaWYgdGhlIGF1dGhlbnRpY2F0aW9uIHdhcyBzdWNjZXNzZnVsXHJcblx0IyMjXHJcblx0X2F1dGhlbnRpY2F0ZTogKGVuZHBvaW50Q29udGV4dCkgLT5cclxuXHRcdCMgR2V0IGF1dGggaW5mb1xyXG5cdFx0YXV0aCA9IEBhcGkuX2NvbmZpZy5hdXRoLnVzZXIuY2FsbChlbmRwb2ludENvbnRleHQpXHJcblxyXG5cdFx0IyBHZXQgdGhlIHVzZXIgZnJvbSB0aGUgZGF0YWJhc2VcclxuXHRcdGlmIGF1dGg/LnVzZXJJZCBhbmQgYXV0aD8udG9rZW4gYW5kIG5vdCBhdXRoPy51c2VyXHJcblx0XHRcdHVzZXJTZWxlY3RvciA9IHt9XHJcblx0XHRcdHVzZXJTZWxlY3Rvci5faWQgPSBhdXRoLnVzZXJJZFxyXG5cdFx0XHR1c2VyU2VsZWN0b3JbQGFwaS5fY29uZmlnLmF1dGgudG9rZW5dID0gYXV0aC50b2tlblxyXG5cdFx0XHRhdXRoLnVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSB1c2VyU2VsZWN0b3JcclxuXHJcblx0XHQjIEF0dGFjaCB0aGUgdXNlciBhbmQgdGhlaXIgSUQgdG8gdGhlIGNvbnRleHQgaWYgdGhlIGF1dGhlbnRpY2F0aW9uIHdhcyBzdWNjZXNzZnVsXHJcblx0XHRpZiBhdXRoPy51c2VyXHJcblx0XHRcdGVuZHBvaW50Q29udGV4dC51c2VyID0gYXV0aC51c2VyXHJcblx0XHRcdGVuZHBvaW50Q29udGV4dC51c2VySWQgPSBhdXRoLnVzZXIuX2lkXHJcblx0XHRcdHRydWVcclxuXHRcdGVsc2UgZmFsc2VcclxuXHJcblx0IyMjXHJcblx0XHRBdXRoZW50aWNhdGUgdGhlIHVzZXIgcm9sZSBpZiByZXF1aXJlZFxyXG5cclxuXHRcdE11c3QgYmUgY2FsbGVkIGFmdGVyIF9hdXRoQWNjZXB0ZWQoKS5cclxuXHJcblx0XHRAcmV0dXJucyBUcnVlIGlmIHRoZSBhdXRoZW50aWNhdGVkIHVzZXIgYmVsb25ncyB0byA8aT5hbnk8L2k+IG9mIHRoZSBhY2NlcHRhYmxlIHJvbGVzIG9uIHRoZVxyXG5cdFx0XHRcdFx0XHQgZW5kcG9pbnRcclxuXHQjIyNcclxuXHRfc3BhY2VBY2NlcHRlZDogKGVuZHBvaW50Q29udGV4dCwgZW5kcG9pbnQpIC0+XHJcblx0XHRpZiBlbmRwb2ludC5zcGFjZVJlcXVpcmVkXHJcblx0XHRcdGF1dGggPSBAYXBpLl9jb25maWcuYXV0aC51c2VyLmNhbGwoZW5kcG9pbnRDb250ZXh0KVxyXG5cdFx0XHRpZiBhdXRoPy5zcGFjZUlkXHJcblx0XHRcdFx0c3BhY2VfdXNlcnNfY291bnQgPSBkYi5zcGFjZV91c2Vycy5maW5kKHt1c2VyOiBhdXRoLnVzZXJJZCwgc3BhY2U6YXV0aC5zcGFjZUlkfSkuY291bnQoKVxyXG5cdFx0XHRcdGlmIHNwYWNlX3VzZXJzX2NvdW50XHJcblx0XHRcdFx0XHRzcGFjZSA9IGRiLnNwYWNlcy5maW5kT25lKGF1dGguc3BhY2VJZClcclxuXHRcdFx0XHRcdCMgc3BhY2UgbXVzdCBiZSBwYWlkLCBhbmQgdXNlciBtdXN0IGJlIGFkbWluc1xyXG5cdFx0XHRcdFx0aWYgc3BhY2U/LmlzX3BhaWQgYW5kIF8uaW5kZXhPZihzcGFjZS5hZG1pbnMsIGF1dGgudXNlcklkKT49MFxyXG5cdFx0XHRcdFx0XHRlbmRwb2ludENvbnRleHQuc3BhY2VJZCA9IGF1dGguc3BhY2VJZFxyXG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0XHRlbmRwb2ludENvbnRleHQuc3BhY2VJZCA9IFwiYmFkXCJcclxuXHRcdFx0cmV0dXJuIGZhbHNlXHJcblx0XHRyZXR1cm4gdHJ1ZVxyXG5cclxuXHQjIyNcclxuXHRcdEF1dGhlbnRpY2F0ZSB0aGUgdXNlciByb2xlIGlmIHJlcXVpcmVkXHJcblxyXG5cdFx0TXVzdCBiZSBjYWxsZWQgYWZ0ZXIgX2F1dGhBY2NlcHRlZCgpLlxyXG5cclxuXHRcdEByZXR1cm5zIFRydWUgaWYgdGhlIGF1dGhlbnRpY2F0ZWQgdXNlciBiZWxvbmdzIHRvIDxpPmFueTwvaT4gb2YgdGhlIGFjY2VwdGFibGUgcm9sZXMgb24gdGhlXHJcblx0XHRcdFx0XHRcdCBlbmRwb2ludFxyXG5cdCMjI1xyXG5cdF9yb2xlQWNjZXB0ZWQ6IChlbmRwb2ludENvbnRleHQsIGVuZHBvaW50KSAtPlxyXG5cdFx0aWYgZW5kcG9pbnQucm9sZVJlcXVpcmVkXHJcblx0XHRcdGlmIF8uaXNFbXB0eSBfLmludGVyc2VjdGlvbihlbmRwb2ludC5yb2xlUmVxdWlyZWQsIGVuZHBvaW50Q29udGV4dC51c2VyLnJvbGVzKVxyXG5cdFx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0dHJ1ZVxyXG5cclxuXHJcblx0IyMjXHJcblx0XHRSZXNwb25kIHRvIGFuIEhUVFAgcmVxdWVzdFxyXG5cdCMjI1xyXG5cdF9yZXNwb25kOiAocmVzcG9uc2UsIGJvZHksIHN0YXR1c0NvZGU9MjAwLCBoZWFkZXJzPXt9KSAtPlxyXG5cdFx0IyBPdmVycmlkZSBhbnkgZGVmYXVsdCBoZWFkZXJzIHRoYXQgaGF2ZSBiZWVuIHByb3ZpZGVkIChrZXlzIGFyZSBub3JtYWxpemVkIHRvIGJlIGNhc2UgaW5zZW5zaXRpdmUpXHJcblx0XHQjIFRPRE86IENvbnNpZGVyIG9ubHkgbG93ZXJjYXNpbmcgdGhlIGhlYWRlciBrZXlzIHdlIG5lZWQgbm9ybWFsaXplZCwgbGlrZSBDb250ZW50LVR5cGVcclxuXHRcdGRlZmF1bHRIZWFkZXJzID0gQF9sb3dlckNhc2VLZXlzIEBhcGkuX2NvbmZpZy5kZWZhdWx0SGVhZGVyc1xyXG5cdFx0aGVhZGVycyA9IEBfbG93ZXJDYXNlS2V5cyBoZWFkZXJzXHJcblx0XHRoZWFkZXJzID0gXy5leHRlbmQgZGVmYXVsdEhlYWRlcnMsIGhlYWRlcnNcclxuXHJcblx0XHQjIFByZXBhcmUgSlNPTiBib2R5IGZvciByZXNwb25zZSB3aGVuIENvbnRlbnQtVHlwZSBpbmRpY2F0ZXMgSlNPTiB0eXBlXHJcblx0XHRpZiBoZWFkZXJzWydjb250ZW50LXR5cGUnXS5tYXRjaCgvanNvbnxqYXZhc2NyaXB0LykgaXNudCBudWxsXHJcblx0XHRcdGlmIEBhcGkuX2NvbmZpZy5wcmV0dHlKc29uXHJcblx0XHRcdFx0Ym9keSA9IEpTT04uc3RyaW5naWZ5IGJvZHksIHVuZGVmaW5lZCwgMlxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0Ym9keSA9IEpTT04uc3RyaW5naWZ5IGJvZHlcclxuXHJcblx0XHQjIFNlbmQgcmVzcG9uc2VcclxuXHRcdHNlbmRSZXNwb25zZSA9IC0+XHJcblx0XHRcdHJlc3BvbnNlLndyaXRlSGVhZCBzdGF0dXNDb2RlLCBoZWFkZXJzXHJcblx0XHRcdHJlc3BvbnNlLndyaXRlIGJvZHlcclxuXHRcdFx0cmVzcG9uc2UuZW5kKClcclxuXHRcdGlmIHN0YXR1c0NvZGUgaW4gWzQwMSwgNDAzXVxyXG5cdFx0XHQjIEhhY2tlcnMgY2FuIG1lYXN1cmUgdGhlIHJlc3BvbnNlIHRpbWUgdG8gZGV0ZXJtaW5lIHRoaW5ncyBsaWtlIHdoZXRoZXIgdGhlIDQwMSByZXNwb25zZSB3YXNcclxuXHRcdFx0IyBjYXVzZWQgYnkgYmFkIHVzZXIgaWQgdnMgYmFkIHBhc3N3b3JkLlxyXG5cdFx0XHQjIEluIGRvaW5nIHNvLCB0aGV5IGNhbiBmaXJzdCBzY2FuIGZvciB2YWxpZCB1c2VyIGlkcyByZWdhcmRsZXNzIG9mIHZhbGlkIHBhc3N3b3Jkcy5cclxuXHRcdFx0IyBEZWxheSBieSBhIHJhbmRvbSBhbW91bnQgdG8gcmVkdWNlIHRoZSBhYmlsaXR5IGZvciBhIGhhY2tlciB0byBkZXRlcm1pbmUgdGhlIHJlc3BvbnNlIHRpbWUuXHJcblx0XHRcdCMgU2VlIGh0dHBzOi8vd3d3Lm93YXNwLm9yZy9pbmRleC5waHAvQmxvY2tpbmdfQnJ1dGVfRm9yY2VfQXR0YWNrcyNGaW5kaW5nX090aGVyX0NvdW50ZXJtZWFzdXJlc1xyXG5cdFx0XHQjIFNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9UaW1pbmdfYXR0YWNrXHJcblx0XHRcdG1pbmltdW1EZWxheUluTWlsbGlzZWNvbmRzID0gNTAwXHJcblx0XHRcdHJhbmRvbU11bHRpcGxpZXJCZXR3ZWVuT25lQW5kVHdvID0gMSArIE1hdGgucmFuZG9tKClcclxuXHRcdFx0ZGVsYXlJbk1pbGxpc2Vjb25kcyA9IG1pbmltdW1EZWxheUluTWlsbGlzZWNvbmRzICogcmFuZG9tTXVsdGlwbGllckJldHdlZW5PbmVBbmRUd29cclxuXHRcdFx0TWV0ZW9yLnNldFRpbWVvdXQgc2VuZFJlc3BvbnNlLCBkZWxheUluTWlsbGlzZWNvbmRzXHJcblx0XHRlbHNlXHJcblx0XHRcdHNlbmRSZXNwb25zZSgpXHJcblxyXG5cdCMjI1xyXG5cdFx0UmV0dXJuIHRoZSBvYmplY3Qgd2l0aCBhbGwgb2YgdGhlIGtleXMgY29udmVydGVkIHRvIGxvd2VyY2FzZVxyXG5cdCMjI1xyXG5cdF9sb3dlckNhc2VLZXlzOiAob2JqZWN0KSAtPlxyXG5cdFx0Xy5jaGFpbiBvYmplY3RcclxuXHRcdC5wYWlycygpXHJcblx0XHQubWFwIChhdHRyKSAtPlxyXG5cdFx0XHRbYXR0clswXS50b0xvd2VyQ2FzZSgpLCBhdHRyWzFdXVxyXG5cdFx0Lm9iamVjdCgpXHJcblx0XHQudmFsdWUoKVxyXG4iLCJzaGFyZS5Sb3V0ZSA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gUm91dGUoYXBpLCBwYXRoLCBvcHRpb25zLCBlbmRwb2ludHMxKSB7XG4gICAgdGhpcy5hcGkgPSBhcGk7XG4gICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMuZW5kcG9pbnRzID0gZW5kcG9pbnRzMTtcbiAgICBpZiAoIXRoaXMuZW5kcG9pbnRzKSB7XG4gICAgICB0aGlzLmVuZHBvaW50cyA9IHRoaXMub3B0aW9ucztcbiAgICAgIHRoaXMub3B0aW9ucyA9IHt9O1xuICAgIH1cbiAgfVxuXG4gIFJvdXRlLnByb3RvdHlwZS5hZGRUb0FwaSA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgYXZhaWxhYmxlTWV0aG9kcztcbiAgICBhdmFpbGFibGVNZXRob2RzID0gWydnZXQnLCAncG9zdCcsICdwdXQnLCAncGF0Y2gnLCAnZGVsZXRlJywgJ29wdGlvbnMnXTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYWxsb3dlZE1ldGhvZHMsIGZ1bGxQYXRoLCByZWplY3RlZE1ldGhvZHMsIHNlbGY7XG4gICAgICBzZWxmID0gdGhpcztcbiAgICAgIGlmIChfLmNvbnRhaW5zKHRoaXMuYXBpLl9jb25maWcucGF0aHMsIHRoaXMucGF0aCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGFkZCBhIHJvdXRlIGF0IGFuIGV4aXN0aW5nIHBhdGg6IFwiICsgdGhpcy5wYXRoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZW5kcG9pbnRzID0gXy5leHRlbmQoe1xuICAgICAgICBvcHRpb25zOiB0aGlzLmFwaS5fY29uZmlnLmRlZmF1bHRPcHRpb25zRW5kcG9pbnRcbiAgICAgIH0sIHRoaXMuZW5kcG9pbnRzKTtcbiAgICAgIHRoaXMuX3Jlc29sdmVFbmRwb2ludHMoKTtcbiAgICAgIHRoaXMuX2NvbmZpZ3VyZUVuZHBvaW50cygpO1xuICAgICAgdGhpcy5hcGkuX2NvbmZpZy5wYXRocy5wdXNoKHRoaXMucGF0aCk7XG4gICAgICBhbGxvd2VkTWV0aG9kcyA9IF8uZmlsdGVyKGF2YWlsYWJsZU1ldGhvZHMsIGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgICAgICByZXR1cm4gXy5jb250YWlucyhfLmtleXMoc2VsZi5lbmRwb2ludHMpLCBtZXRob2QpO1xuICAgICAgfSk7XG4gICAgICByZWplY3RlZE1ldGhvZHMgPSBfLnJlamVjdChhdmFpbGFibGVNZXRob2RzLCBmdW5jdGlvbihtZXRob2QpIHtcbiAgICAgICAgcmV0dXJuIF8uY29udGFpbnMoXy5rZXlzKHNlbGYuZW5kcG9pbnRzKSwgbWV0aG9kKTtcbiAgICAgIH0pO1xuICAgICAgZnVsbFBhdGggPSB0aGlzLmFwaS5fY29uZmlnLmFwaVBhdGggKyB0aGlzLnBhdGg7XG4gICAgICBfLmVhY2goYWxsb3dlZE1ldGhvZHMsIGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgICAgICB2YXIgZW5kcG9pbnQ7XG4gICAgICAgIGVuZHBvaW50ID0gc2VsZi5lbmRwb2ludHNbbWV0aG9kXTtcbiAgICAgICAgcmV0dXJuIEpzb25Sb3V0ZXMuYWRkKG1ldGhvZCwgZnVsbFBhdGgsIGZ1bmN0aW9uKHJlcSwgcmVzKSB7XG4gICAgICAgICAgdmFyIGRvbmVGdW5jLCBlbmRwb2ludENvbnRleHQsIGVycm9yLCByZXNwb25zZURhdGEsIHJlc3BvbnNlSW5pdGlhdGVkO1xuICAgICAgICAgIHJlc3BvbnNlSW5pdGlhdGVkID0gZmFsc2U7XG4gICAgICAgICAgZG9uZUZ1bmMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZUluaXRpYXRlZCA9IHRydWU7XG4gICAgICAgICAgfTtcbiAgICAgICAgICBlbmRwb2ludENvbnRleHQgPSB7XG4gICAgICAgICAgICB1cmxQYXJhbXM6IHJlcS5wYXJhbXMsXG4gICAgICAgICAgICBxdWVyeVBhcmFtczogcmVxLnF1ZXJ5LFxuICAgICAgICAgICAgYm9keVBhcmFtczogcmVxLmJvZHksXG4gICAgICAgICAgICByZXF1ZXN0OiByZXEsXG4gICAgICAgICAgICByZXNwb25zZTogcmVzLFxuICAgICAgICAgICAgZG9uZTogZG9uZUZ1bmNcbiAgICAgICAgICB9O1xuICAgICAgICAgIF8uZXh0ZW5kKGVuZHBvaW50Q29udGV4dCwgZW5kcG9pbnQpO1xuICAgICAgICAgIHJlc3BvbnNlRGF0YSA9IG51bGw7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc3BvbnNlRGF0YSA9IHNlbGYuX2NhbGxFbmRwb2ludChlbmRwb2ludENvbnRleHQsIGVuZHBvaW50KTtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcjEpIHtcbiAgICAgICAgICAgIGVycm9yID0gZXJyb3IxO1xuICAgICAgICAgICAgaXJvblJvdXRlclNlbmRFcnJvclRvUmVzcG9uc2UoZXJyb3IsIHJlcSwgcmVzKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJlc3BvbnNlSW5pdGlhdGVkKSB7XG4gICAgICAgICAgICByZXMuZW5kKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChyZXMuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBjYWxsIHRoaXMuZG9uZSgpIGFmdGVyIGhhbmRsaW5nIGVuZHBvaW50IHJlc3BvbnNlIG1hbnVhbGx5OiBcIiArIG1ldGhvZCArIFwiIFwiICsgZnVsbFBhdGgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZURhdGEgPT09IG51bGwgfHwgcmVzcG9uc2VEYXRhID09PSB2b2lkIDApIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHJldHVybiBudWxsIG9yIHVuZGVmaW5lZCBmcm9tIGFuIGVuZHBvaW50OiBcIiArIG1ldGhvZCArIFwiIFwiICsgZnVsbFBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmVzcG9uc2VEYXRhLmJvZHkgJiYgKHJlc3BvbnNlRGF0YS5zdGF0dXNDb2RlIHx8IHJlc3BvbnNlRGF0YS5oZWFkZXJzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHNlbGYuX3Jlc3BvbmQocmVzLCByZXNwb25zZURhdGEuYm9keSwgcmVzcG9uc2VEYXRhLnN0YXR1c0NvZGUsIHJlc3BvbnNlRGF0YS5oZWFkZXJzKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHNlbGYuX3Jlc3BvbmQocmVzLCByZXNwb25zZURhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBfLmVhY2gocmVqZWN0ZWRNZXRob2RzLCBmdW5jdGlvbihtZXRob2QpIHtcbiAgICAgICAgcmV0dXJuIEpzb25Sb3V0ZXMuYWRkKG1ldGhvZCwgZnVsbFBhdGgsIGZ1bmN0aW9uKHJlcSwgcmVzKSB7XG4gICAgICAgICAgdmFyIGhlYWRlcnMsIHJlc3BvbnNlRGF0YTtcbiAgICAgICAgICByZXNwb25zZURhdGEgPSB7XG4gICAgICAgICAgICBzdGF0dXM6ICdlcnJvcicsXG4gICAgICAgICAgICBtZXNzYWdlOiAnQVBJIGVuZHBvaW50IGRvZXMgbm90IGV4aXN0J1xuICAgICAgICAgIH07XG4gICAgICAgICAgaGVhZGVycyA9IHtcbiAgICAgICAgICAgICdBbGxvdyc6IGFsbG93ZWRNZXRob2RzLmpvaW4oJywgJykudG9VcHBlckNhc2UoKVxuICAgICAgICAgIH07XG4gICAgICAgICAgcmV0dXJuIHNlbGYuX3Jlc3BvbmQocmVzLCByZXNwb25zZURhdGEsIDQwNSwgaGVhZGVycyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSkoKTtcblxuXG4gIC8qXG4gIFx0XHRDb252ZXJ0IGFsbCBlbmRwb2ludHMgb24gdGhlIGdpdmVuIHJvdXRlIGludG8gb3VyIGV4cGVjdGVkIGVuZHBvaW50IG9iamVjdCBpZiBpdCBpcyBhIGJhcmVcbiAgXHRcdGZ1bmN0aW9uXG4gIFxuICBcdFx0QHBhcmFtIHtSb3V0ZX0gcm91dGUgVGhlIHJvdXRlIHRoZSBlbmRwb2ludHMgYmVsb25nIHRvXG4gICAqL1xuXG4gIFJvdXRlLnByb3RvdHlwZS5fcmVzb2x2ZUVuZHBvaW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIF8uZWFjaCh0aGlzLmVuZHBvaW50cywgZnVuY3Rpb24oZW5kcG9pbnQsIG1ldGhvZCwgZW5kcG9pbnRzKSB7XG4gICAgICBpZiAoXy5pc0Z1bmN0aW9uKGVuZHBvaW50KSkge1xuICAgICAgICByZXR1cm4gZW5kcG9pbnRzW21ldGhvZF0gPSB7XG4gICAgICAgICAgYWN0aW9uOiBlbmRwb2ludFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG5cbiAgLypcbiAgXHRcdENvbmZpZ3VyZSB0aGUgYXV0aGVudGljYXRpb24gYW5kIHJvbGUgcmVxdWlyZW1lbnQgb24gYWxsIGVuZHBvaW50cyAoZXhjZXB0IE9QVElPTlMsIHdoaWNoIG11c3RcbiAgXHRcdGJlIGNvbmZpZ3VyZWQgZGlyZWN0bHkgb24gdGhlIGVuZHBvaW50KVxuICBcbiAgXHRcdEF1dGhlbnRpY2F0aW9uIGNhbiBiZSByZXF1aXJlZCBvbiBhbiBlbnRpcmUgcm91dGUgb3IgaW5kaXZpZHVhbCBlbmRwb2ludHMuIElmIHJlcXVpcmVkIG9uIGFuXG4gIFx0XHRlbnRpcmUgcm91dGUsIHRoYXQgc2VydmVzIGFzIHRoZSBkZWZhdWx0LiBJZiByZXF1aXJlZCBpbiBhbnkgaW5kaXZpZHVhbCBlbmRwb2ludHMsIHRoYXQgd2lsbFxuICBcdFx0b3ZlcnJpZGUgdGhlIGRlZmF1bHQuXG4gIFxuICBcdFx0QWZ0ZXIgdGhlIGVuZHBvaW50IGlzIGNvbmZpZ3VyZWQsIGFsbCBhdXRoZW50aWNhdGlvbiBhbmQgcm9sZSByZXF1aXJlbWVudHMgb2YgYW4gZW5kcG9pbnQgY2FuIGJlXG4gIFx0XHRhY2Nlc3NlZCBhdCA8Y29kZT5lbmRwb2ludC5hdXRoUmVxdWlyZWQ8L2NvZGU+IGFuZCA8Y29kZT5lbmRwb2ludC5yb2xlUmVxdWlyZWQ8L2NvZGU+LFxuICBcdFx0cmVzcGVjdGl2ZWx5LlxuICBcbiAgXHRcdEBwYXJhbSB7Um91dGV9IHJvdXRlIFRoZSByb3V0ZSB0aGUgZW5kcG9pbnRzIGJlbG9uZyB0b1xuICBcdFx0QHBhcmFtIHtFbmRwb2ludH0gZW5kcG9pbnQgVGhlIGVuZHBvaW50IHRvIGNvbmZpZ3VyZVxuICAgKi9cblxuICBSb3V0ZS5wcm90b3R5cGUuX2NvbmZpZ3VyZUVuZHBvaW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIF8uZWFjaCh0aGlzLmVuZHBvaW50cywgZnVuY3Rpb24oZW5kcG9pbnQsIG1ldGhvZCkge1xuICAgICAgdmFyIHJlZiwgcmVmMSwgcmVmMjtcbiAgICAgIGlmIChtZXRob2QgIT09ICdvcHRpb25zJykge1xuICAgICAgICBpZiAoISgocmVmID0gdGhpcy5vcHRpb25zKSAhPSBudWxsID8gcmVmLnJvbGVSZXF1aXJlZCA6IHZvaWQgMCkpIHtcbiAgICAgICAgICB0aGlzLm9wdGlvbnMucm9sZVJlcXVpcmVkID0gW107XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFlbmRwb2ludC5yb2xlUmVxdWlyZWQpIHtcbiAgICAgICAgICBlbmRwb2ludC5yb2xlUmVxdWlyZWQgPSBbXTtcbiAgICAgICAgfVxuICAgICAgICBlbmRwb2ludC5yb2xlUmVxdWlyZWQgPSBfLnVuaW9uKGVuZHBvaW50LnJvbGVSZXF1aXJlZCwgdGhpcy5vcHRpb25zLnJvbGVSZXF1aXJlZCk7XG4gICAgICAgIGlmIChfLmlzRW1wdHkoZW5kcG9pbnQucm9sZVJlcXVpcmVkKSkge1xuICAgICAgICAgIGVuZHBvaW50LnJvbGVSZXF1aXJlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlbmRwb2ludC5hdXRoUmVxdWlyZWQgPT09IHZvaWQgMCkge1xuICAgICAgICAgIGlmICgoKHJlZjEgPSB0aGlzLm9wdGlvbnMpICE9IG51bGwgPyByZWYxLmF1dGhSZXF1aXJlZCA6IHZvaWQgMCkgfHwgZW5kcG9pbnQucm9sZVJlcXVpcmVkKSB7XG4gICAgICAgICAgICBlbmRwb2ludC5hdXRoUmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbmRwb2ludC5hdXRoUmVxdWlyZWQgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKChyZWYyID0gdGhpcy5vcHRpb25zKSAhPSBudWxsID8gcmVmMi5zcGFjZVJlcXVpcmVkIDogdm9pZCAwKSB7XG4gICAgICAgICAgZW5kcG9pbnQuc3BhY2VSZXF1aXJlZCA9IHRoaXMub3B0aW9ucy5zcGFjZVJlcXVpcmVkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwgdGhpcyk7XG4gIH07XG5cblxuICAvKlxuICBcdFx0QXV0aGVudGljYXRlIGFuIGVuZHBvaW50IGlmIHJlcXVpcmVkLCBhbmQgcmV0dXJuIHRoZSByZXN1bHQgb2YgY2FsbGluZyBpdFxuICBcbiAgXHRcdEByZXR1cm5zIFRoZSBlbmRwb2ludCByZXNwb25zZSBvciBhIDQwMSBpZiBhdXRoZW50aWNhdGlvbiBmYWlsc1xuICAgKi9cblxuICBSb3V0ZS5wcm90b3R5cGUuX2NhbGxFbmRwb2ludCA9IGZ1bmN0aW9uKGVuZHBvaW50Q29udGV4dCwgZW5kcG9pbnQpIHtcbiAgICB2YXIgaW52b2NhdGlvbjtcbiAgICBpZiAodGhpcy5fYXV0aEFjY2VwdGVkKGVuZHBvaW50Q29udGV4dCwgZW5kcG9pbnQpKSB7XG4gICAgICBpZiAodGhpcy5fcm9sZUFjY2VwdGVkKGVuZHBvaW50Q29udGV4dCwgZW5kcG9pbnQpKSB7XG4gICAgICAgIGlmICh0aGlzLl9zcGFjZUFjY2VwdGVkKGVuZHBvaW50Q29udGV4dCwgZW5kcG9pbnQpKSB7XG4gICAgICAgICAgaW52b2NhdGlvbiA9IG5ldyBERFBDb21tb24uTWV0aG9kSW52b2NhdGlvbih7XG4gICAgICAgICAgICBpc1NpbXVsYXRpb246IHRydWUsXG4gICAgICAgICAgICB1c2VySWQ6IGVuZHBvaW50Q29udGV4dC51c2VySWQsXG4gICAgICAgICAgICBjb25uZWN0aW9uOiBudWxsLFxuICAgICAgICAgICAgcmFuZG9tU2VlZDogRERQQ29tbW9uLm1ha2VScGNTZWVkKClcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gRERQLl9DdXJyZW50SW52b2NhdGlvbi53aXRoVmFsdWUoaW52b2NhdGlvbiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gZW5kcG9pbnQuYWN0aW9uLmNhbGwoZW5kcG9pbnRDb250ZXh0KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhdHVzQ29kZTogNDAzLFxuICAgICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgICBzdGF0dXM6ICdlcnJvcicsXG4gICAgICAgICAgICAgIG1lc3NhZ2U6ICdCYWQgWC1TcGFjZS1JZCwgT25seSBhZG1pbnMgb2YgcGFpZCBzcGFjZSBjYW4gY2FsbCB0aGlzIGFwaS4nXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiA0MDMsXG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgc3RhdHVzOiAnZXJyb3InLFxuICAgICAgICAgICAgbWVzc2FnZTogJ1lvdSBkbyBub3QgaGF2ZSBwZXJtaXNzaW9uIHRvIGRvIHRoaXMuJ1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdHVzQ29kZTogNDAxLFxuICAgICAgICBib2R5OiB7XG4gICAgICAgICAgc3RhdHVzOiAnZXJyb3InLFxuICAgICAgICAgIG1lc3NhZ2U6ICdZb3UgbXVzdCBiZSBsb2dnZWQgaW4gdG8gZG8gdGhpcy4nXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICB9O1xuXG5cbiAgLypcbiAgXHRcdEF1dGhlbnRpY2F0ZSB0aGUgZ2l2ZW4gZW5kcG9pbnQgaWYgcmVxdWlyZWRcbiAgXG4gIFx0XHRPbmNlIGl0J3MgZ2xvYmFsbHkgY29uZmlndXJlZCBpbiB0aGUgQVBJLCBhdXRoZW50aWNhdGlvbiBjYW4gYmUgcmVxdWlyZWQgb24gYW4gZW50aXJlIHJvdXRlIG9yXG4gIFx0XHRpbmRpdmlkdWFsIGVuZHBvaW50cy4gSWYgcmVxdWlyZWQgb24gYW4gZW50aXJlIGVuZHBvaW50LCB0aGF0IHNlcnZlcyBhcyB0aGUgZGVmYXVsdC4gSWYgcmVxdWlyZWRcbiAgXHRcdGluIGFueSBpbmRpdmlkdWFsIGVuZHBvaW50cywgdGhhdCB3aWxsIG92ZXJyaWRlIHRoZSBkZWZhdWx0LlxuICBcbiAgXHRcdEByZXR1cm5zIEZhbHNlIGlmIGF1dGhlbnRpY2F0aW9uIGZhaWxzLCBhbmQgdHJ1ZSBvdGhlcndpc2VcbiAgICovXG5cbiAgUm91dGUucHJvdG90eXBlLl9hdXRoQWNjZXB0ZWQgPSBmdW5jdGlvbihlbmRwb2ludENvbnRleHQsIGVuZHBvaW50KSB7XG4gICAgaWYgKGVuZHBvaW50LmF1dGhSZXF1aXJlZCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2F1dGhlbnRpY2F0ZShlbmRwb2ludENvbnRleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH07XG5cblxuICAvKlxuICBcdFx0VmVyaWZ5IHRoZSByZXF1ZXN0IGlzIGJlaW5nIG1hZGUgYnkgYW4gYWN0aXZlbHkgbG9nZ2VkIGluIHVzZXJcbiAgXG4gIFx0XHRJZiB2ZXJpZmllZCwgYXR0YWNoIHRoZSBhdXRoZW50aWNhdGVkIHVzZXIgdG8gdGhlIGNvbnRleHQuXG4gIFxuICBcdFx0QHJldHVybnMge0Jvb2xlYW59IFRydWUgaWYgdGhlIGF1dGhlbnRpY2F0aW9uIHdhcyBzdWNjZXNzZnVsXG4gICAqL1xuXG4gIFJvdXRlLnByb3RvdHlwZS5fYXV0aGVudGljYXRlID0gZnVuY3Rpb24oZW5kcG9pbnRDb250ZXh0KSB7XG4gICAgdmFyIGF1dGgsIHVzZXJTZWxlY3RvcjtcbiAgICBhdXRoID0gdGhpcy5hcGkuX2NvbmZpZy5hdXRoLnVzZXIuY2FsbChlbmRwb2ludENvbnRleHQpO1xuICAgIGlmICgoYXV0aCAhPSBudWxsID8gYXV0aC51c2VySWQgOiB2b2lkIDApICYmIChhdXRoICE9IG51bGwgPyBhdXRoLnRva2VuIDogdm9pZCAwKSAmJiAhKGF1dGggIT0gbnVsbCA/IGF1dGgudXNlciA6IHZvaWQgMCkpIHtcbiAgICAgIHVzZXJTZWxlY3RvciA9IHt9O1xuICAgICAgdXNlclNlbGVjdG9yLl9pZCA9IGF1dGgudXNlcklkO1xuICAgICAgdXNlclNlbGVjdG9yW3RoaXMuYXBpLl9jb25maWcuYXV0aC50b2tlbl0gPSBhdXRoLnRva2VuO1xuICAgICAgYXV0aC51c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUodXNlclNlbGVjdG9yKTtcbiAgICB9XG4gICAgaWYgKGF1dGggIT0gbnVsbCA/IGF1dGgudXNlciA6IHZvaWQgMCkge1xuICAgICAgZW5kcG9pbnRDb250ZXh0LnVzZXIgPSBhdXRoLnVzZXI7XG4gICAgICBlbmRwb2ludENvbnRleHQudXNlcklkID0gYXV0aC51c2VyLl9pZDtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9O1xuXG5cbiAgLypcbiAgXHRcdEF1dGhlbnRpY2F0ZSB0aGUgdXNlciByb2xlIGlmIHJlcXVpcmVkXG4gIFxuICBcdFx0TXVzdCBiZSBjYWxsZWQgYWZ0ZXIgX2F1dGhBY2NlcHRlZCgpLlxuICBcbiAgXHRcdEByZXR1cm5zIFRydWUgaWYgdGhlIGF1dGhlbnRpY2F0ZWQgdXNlciBiZWxvbmdzIHRvIDxpPmFueTwvaT4gb2YgdGhlIGFjY2VwdGFibGUgcm9sZXMgb24gdGhlXG4gIFx0XHRcdFx0XHRcdCBlbmRwb2ludFxuICAgKi9cblxuICBSb3V0ZS5wcm90b3R5cGUuX3NwYWNlQWNjZXB0ZWQgPSBmdW5jdGlvbihlbmRwb2ludENvbnRleHQsIGVuZHBvaW50KSB7XG4gICAgdmFyIGF1dGgsIHNwYWNlLCBzcGFjZV91c2Vyc19jb3VudDtcbiAgICBpZiAoZW5kcG9pbnQuc3BhY2VSZXF1aXJlZCkge1xuICAgICAgYXV0aCA9IHRoaXMuYXBpLl9jb25maWcuYXV0aC51c2VyLmNhbGwoZW5kcG9pbnRDb250ZXh0KTtcbiAgICAgIGlmIChhdXRoICE9IG51bGwgPyBhdXRoLnNwYWNlSWQgOiB2b2lkIDApIHtcbiAgICAgICAgc3BhY2VfdXNlcnNfY291bnQgPSBkYi5zcGFjZV91c2Vycy5maW5kKHtcbiAgICAgICAgICB1c2VyOiBhdXRoLnVzZXJJZCxcbiAgICAgICAgICBzcGFjZTogYXV0aC5zcGFjZUlkXG4gICAgICAgIH0pLmNvdW50KCk7XG4gICAgICAgIGlmIChzcGFjZV91c2Vyc19jb3VudCkge1xuICAgICAgICAgIHNwYWNlID0gZGIuc3BhY2VzLmZpbmRPbmUoYXV0aC5zcGFjZUlkKTtcbiAgICAgICAgICBpZiAoKHNwYWNlICE9IG51bGwgPyBzcGFjZS5pc19wYWlkIDogdm9pZCAwKSAmJiBfLmluZGV4T2Yoc3BhY2UuYWRtaW5zLCBhdXRoLnVzZXJJZCkgPj0gMCkge1xuICAgICAgICAgICAgZW5kcG9pbnRDb250ZXh0LnNwYWNlSWQgPSBhdXRoLnNwYWNlSWQ7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVuZHBvaW50Q29udGV4dC5zcGFjZUlkID0gXCJiYWRcIjtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cblxuICAvKlxuICBcdFx0QXV0aGVudGljYXRlIHRoZSB1c2VyIHJvbGUgaWYgcmVxdWlyZWRcbiAgXG4gIFx0XHRNdXN0IGJlIGNhbGxlZCBhZnRlciBfYXV0aEFjY2VwdGVkKCkuXG4gIFxuICBcdFx0QHJldHVybnMgVHJ1ZSBpZiB0aGUgYXV0aGVudGljYXRlZCB1c2VyIGJlbG9uZ3MgdG8gPGk+YW55PC9pPiBvZiB0aGUgYWNjZXB0YWJsZSByb2xlcyBvbiB0aGVcbiAgXHRcdFx0XHRcdFx0IGVuZHBvaW50XG4gICAqL1xuXG4gIFJvdXRlLnByb3RvdHlwZS5fcm9sZUFjY2VwdGVkID0gZnVuY3Rpb24oZW5kcG9pbnRDb250ZXh0LCBlbmRwb2ludCkge1xuICAgIGlmIChlbmRwb2ludC5yb2xlUmVxdWlyZWQpIHtcbiAgICAgIGlmIChfLmlzRW1wdHkoXy5pbnRlcnNlY3Rpb24oZW5kcG9pbnQucm9sZVJlcXVpcmVkLCBlbmRwb2ludENvbnRleHQudXNlci5yb2xlcykpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cblxuICAvKlxuICBcdFx0UmVzcG9uZCB0byBhbiBIVFRQIHJlcXVlc3RcbiAgICovXG5cbiAgUm91dGUucHJvdG90eXBlLl9yZXNwb25kID0gZnVuY3Rpb24ocmVzcG9uc2UsIGJvZHksIHN0YXR1c0NvZGUsIGhlYWRlcnMpIHtcbiAgICB2YXIgZGVmYXVsdEhlYWRlcnMsIGRlbGF5SW5NaWxsaXNlY29uZHMsIG1pbmltdW1EZWxheUluTWlsbGlzZWNvbmRzLCByYW5kb21NdWx0aXBsaWVyQmV0d2Vlbk9uZUFuZFR3bywgc2VuZFJlc3BvbnNlO1xuICAgIGlmIChzdGF0dXNDb2RlID09IG51bGwpIHtcbiAgICAgIHN0YXR1c0NvZGUgPSAyMDA7XG4gICAgfVxuICAgIGlmIChoZWFkZXJzID09IG51bGwpIHtcbiAgICAgIGhlYWRlcnMgPSB7fTtcbiAgICB9XG4gICAgZGVmYXVsdEhlYWRlcnMgPSB0aGlzLl9sb3dlckNhc2VLZXlzKHRoaXMuYXBpLl9jb25maWcuZGVmYXVsdEhlYWRlcnMpO1xuICAgIGhlYWRlcnMgPSB0aGlzLl9sb3dlckNhc2VLZXlzKGhlYWRlcnMpO1xuICAgIGhlYWRlcnMgPSBfLmV4dGVuZChkZWZhdWx0SGVhZGVycywgaGVhZGVycyk7XG4gICAgaWYgKGhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddLm1hdGNoKC9qc29ufGphdmFzY3JpcHQvKSAhPT0gbnVsbCkge1xuICAgICAgaWYgKHRoaXMuYXBpLl9jb25maWcucHJldHR5SnNvbikge1xuICAgICAgICBib2R5ID0gSlNPTi5zdHJpbmdpZnkoYm9keSwgdm9pZCAwLCAyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJvZHkgPSBKU09OLnN0cmluZ2lmeShib2R5KTtcbiAgICAgIH1cbiAgICB9XG4gICAgc2VuZFJlc3BvbnNlID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXNwb25zZS53cml0ZUhlYWQoc3RhdHVzQ29kZSwgaGVhZGVycyk7XG4gICAgICByZXNwb25zZS53cml0ZShib2R5KTtcbiAgICAgIHJldHVybiByZXNwb25zZS5lbmQoKTtcbiAgICB9O1xuICAgIGlmIChzdGF0dXNDb2RlID09PSA0MDEgfHwgc3RhdHVzQ29kZSA9PT0gNDAzKSB7XG4gICAgICBtaW5pbXVtRGVsYXlJbk1pbGxpc2Vjb25kcyA9IDUwMDtcbiAgICAgIHJhbmRvbU11bHRpcGxpZXJCZXR3ZWVuT25lQW5kVHdvID0gMSArIE1hdGgucmFuZG9tKCk7XG4gICAgICBkZWxheUluTWlsbGlzZWNvbmRzID0gbWluaW11bURlbGF5SW5NaWxsaXNlY29uZHMgKiByYW5kb21NdWx0aXBsaWVyQmV0d2Vlbk9uZUFuZFR3bztcbiAgICAgIHJldHVybiBNZXRlb3Iuc2V0VGltZW91dChzZW5kUmVzcG9uc2UsIGRlbGF5SW5NaWxsaXNlY29uZHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc2VuZFJlc3BvbnNlKCk7XG4gICAgfVxuICB9O1xuXG5cbiAgLypcbiAgXHRcdFJldHVybiB0aGUgb2JqZWN0IHdpdGggYWxsIG9mIHRoZSBrZXlzIGNvbnZlcnRlZCB0byBsb3dlcmNhc2VcbiAgICovXG5cbiAgUm91dGUucHJvdG90eXBlLl9sb3dlckNhc2VLZXlzID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgcmV0dXJuIF8uY2hhaW4ob2JqZWN0KS5wYWlycygpLm1hcChmdW5jdGlvbihhdHRyKSB7XG4gICAgICByZXR1cm4gW2F0dHJbMF0udG9Mb3dlckNhc2UoKSwgYXR0clsxXV07XG4gICAgfSkub2JqZWN0KCkudmFsdWUoKTtcbiAgfTtcblxuICByZXR1cm4gUm91dGU7XG5cbn0pKCk7XG4iLCJiYXNpY0F1dGggPSByZXF1aXJlKCdiYXNpYy1hdXRoJylcclxuQ29va2llcyA9IHJlcXVpcmUoXCJjb29raWVzXCIpXHJcblxyXG5jbGFzcyBAT2RhdGFSZXN0aXZ1c1xyXG5cclxuXHRjb25zdHJ1Y3RvcjogKG9wdGlvbnMpIC0+XHJcblx0XHRAX3JvdXRlcyA9IFtdXHJcblx0XHRAX2NvbmZpZyA9XHJcblx0XHRcdHBhdGhzOiBbXVxyXG5cdFx0XHR1c2VEZWZhdWx0QXV0aDogZmFsc2VcclxuXHRcdFx0YXBpUGF0aDogJ2FwaS8nXHJcblx0XHRcdHZlcnNpb246IG51bGxcclxuXHRcdFx0cHJldHR5SnNvbjogZmFsc2VcclxuXHRcdFx0YXV0aDpcclxuXHRcdFx0XHR0b2tlbjogJ3NlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy5oYXNoZWRUb2tlbidcclxuXHRcdFx0XHR1c2VyOiAtPlxyXG5cdFx0XHRcdFx0Y29va2llcyA9IG5ldyBDb29raWVzKCBAcmVxdWVzdCwgQHJlc3BvbnNlIClcclxuXHRcdFx0XHRcdHVzZXJJZCA9IEByZXF1ZXN0LmhlYWRlcnNbJ3gtdXNlci1pZCddIHx8IGNvb2tpZXMuZ2V0KFwiWC1Vc2VyLUlkXCIpXHJcblx0XHRcdFx0XHRhdXRoVG9rZW4gPSBAcmVxdWVzdC5oZWFkZXJzWyd4LWF1dGgtdG9rZW4nXSB8fCBjb29raWVzLmdldChcIlgtQXV0aC1Ub2tlblwiKVxyXG5cdFx0XHRcdFx0c3BhY2VJZCA9IEByZXF1ZXN0LmhlYWRlcnNbJ3gtc3BhY2UtaWQnXSB8fCBAdXJsUGFyYW1zWydzcGFjZUlkJ11cclxuXHRcdFx0XHRcdGlmIGF1dGhUb2tlblxyXG5cdFx0XHRcdFx0XHR0b2tlbiA9IEFjY291bnRzLl9oYXNoTG9naW5Ub2tlbiBhdXRoVG9rZW5cclxuXHRcdFx0XHRcdGlmIEByZXF1ZXN0LnVzZXJJZFxyXG5cdFx0XHRcdFx0XHRfdXNlciA9IGRiLnVzZXJzLmZpbmRPbmUoe19pZDogQHJlcXVlc3QudXNlcklkfSlcclxuXHRcdFx0XHRcdFx0dXNlcjogX3VzZXJcclxuXHRcdFx0XHRcdFx0dXNlcklkOiB1c2VySWRcclxuXHRcdFx0XHRcdFx0c3BhY2VJZDogc3BhY2VJZFxyXG5cdFx0XHRcdFx0XHR0b2tlbjogdG9rZW5cclxuXHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0dXNlcklkOiB1c2VySWRcclxuXHRcdFx0XHRcdFx0c3BhY2VJZDogc3BhY2VJZFxyXG5cdFx0XHRcdFx0XHR0b2tlbjogdG9rZW5cclxuXHRcdFx0ZGVmYXVsdEhlYWRlcnM6XHJcblx0XHRcdFx0J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xyXG5cdFx0XHRlbmFibGVDb3JzOiB0cnVlXHJcblxyXG5cdFx0IyBDb25maWd1cmUgQVBJIHdpdGggdGhlIGdpdmVuIG9wdGlvbnNcclxuXHRcdF8uZXh0ZW5kIEBfY29uZmlnLCBvcHRpb25zXHJcblxyXG5cdFx0aWYgQF9jb25maWcuZW5hYmxlQ29yc1xyXG5cdFx0XHRjb3JzSGVhZGVycyA9XHJcblx0XHRcdFx0J0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJ1xyXG5cdFx0XHRcdCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJ09yaWdpbiwgWC1SZXF1ZXN0ZWQtV2l0aCwgQ29udGVudC1UeXBlLCBBY2NlcHQsIE9EYXRhLVZlcnNpb24nXHJcblxyXG5cdFx0XHRpZiBAX2NvbmZpZy51c2VEZWZhdWx0QXV0aFxyXG5cdFx0XHRcdGNvcnNIZWFkZXJzWydBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJ10gKz0gJywgWC1Vc2VyLUlkLCBYLUF1dGgtVG9rZW4sIFgtU3BhY2UtSWQnXHJcblxyXG5cdFx0XHQjIFNldCBkZWZhdWx0IGhlYWRlciB0byBlbmFibGUgQ09SUyBpZiBjb25maWd1cmVkXHJcblx0XHRcdF8uZXh0ZW5kIEBfY29uZmlnLmRlZmF1bHRIZWFkZXJzLCBjb3JzSGVhZGVyc1xyXG5cclxuXHRcdFx0aWYgbm90IEBfY29uZmlnLmRlZmF1bHRPcHRpb25zRW5kcG9pbnRcclxuXHRcdFx0XHRAX2NvbmZpZy5kZWZhdWx0T3B0aW9uc0VuZHBvaW50ID0gLT5cclxuXHRcdFx0XHRcdEByZXNwb25zZS53cml0ZUhlYWQgMjAwLCBjb3JzSGVhZGVyc1xyXG5cdFx0XHRcdFx0QGRvbmUoKVxyXG5cclxuXHRcdCMgTm9ybWFsaXplIHRoZSBBUEkgcGF0aFxyXG5cdFx0aWYgQF9jb25maWcuYXBpUGF0aFswXSBpcyAnLydcclxuXHRcdFx0QF9jb25maWcuYXBpUGF0aCA9IEBfY29uZmlnLmFwaVBhdGguc2xpY2UgMVxyXG5cdFx0aWYgXy5sYXN0KEBfY29uZmlnLmFwaVBhdGgpIGlzbnQgJy8nXHJcblx0XHRcdEBfY29uZmlnLmFwaVBhdGggPSBAX2NvbmZpZy5hcGlQYXRoICsgJy8nXHJcblxyXG5cdFx0IyBVUkwgcGF0aCB2ZXJzaW9uaW5nIGlzIHRoZSBvbmx5IHR5cGUgb2YgQVBJIHZlcnNpb25pbmcgY3VycmVudGx5IGF2YWlsYWJsZSwgc28gaWYgYSB2ZXJzaW9uIGlzXHJcblx0XHQjIHByb3ZpZGVkLCBhcHBlbmQgaXQgdG8gdGhlIGJhc2UgcGF0aCBvZiB0aGUgQVBJXHJcblx0XHRpZiBAX2NvbmZpZy52ZXJzaW9uXHJcblx0XHRcdEBfY29uZmlnLmFwaVBhdGggKz0gQF9jb25maWcudmVyc2lvbiArICcvJ1xyXG5cclxuXHRcdCMgQWRkIGRlZmF1bHQgbG9naW4gYW5kIGxvZ291dCBlbmRwb2ludHMgaWYgYXV0aCBpcyBjb25maWd1cmVkXHJcblx0XHRpZiBAX2NvbmZpZy51c2VEZWZhdWx0QXV0aFxyXG5cdFx0XHRAX2luaXRBdXRoKClcclxuXHRcdGVsc2UgaWYgQF9jb25maWcudXNlQXV0aFxyXG5cdFx0XHRAX2luaXRBdXRoKClcclxuXHRcdFx0Y29uc29sZS53YXJuICdXYXJuaW5nOiB1c2VBdXRoIEFQSSBjb25maWcgb3B0aW9uIHdpbGwgYmUgcmVtb3ZlZCBpbiBSZXN0aXZ1cyB2MS4wICcgK1xyXG5cdFx0XHRcdFx0J1xcbiAgICBVc2UgdGhlIHVzZURlZmF1bHRBdXRoIG9wdGlvbiBpbnN0ZWFkJ1xyXG5cclxuXHRcdHJldHVybiB0aGlzXHJcblxyXG5cclxuXHQjIyMqXHJcblx0XHRBZGQgZW5kcG9pbnRzIGZvciB0aGUgZ2l2ZW4gSFRUUCBtZXRob2RzIGF0IHRoZSBnaXZlbiBwYXRoXHJcblxyXG5cdFx0QHBhcmFtIHBhdGgge1N0cmluZ30gVGhlIGV4dGVuZGVkIFVSTCBwYXRoICh3aWxsIGJlIGFwcGVuZGVkIHRvIGJhc2UgcGF0aCBvZiB0aGUgQVBJKVxyXG5cdFx0QHBhcmFtIG9wdGlvbnMge09iamVjdH0gUm91dGUgY29uZmlndXJhdGlvbiBvcHRpb25zXHJcblx0XHRAcGFyYW0gb3B0aW9ucy5hdXRoUmVxdWlyZWQge0Jvb2xlYW59IFRoZSBkZWZhdWx0IGF1dGggcmVxdWlyZW1lbnQgZm9yIGVhY2ggZW5kcG9pbnQgb24gdGhlIHJvdXRlXHJcblx0XHRAcGFyYW0gb3B0aW9ucy5yb2xlUmVxdWlyZWQge1N0cmluZyBvciBTdHJpbmdbXX0gVGhlIGRlZmF1bHQgcm9sZSByZXF1aXJlZCBmb3IgZWFjaCBlbmRwb2ludCBvbiB0aGUgcm91dGVcclxuXHRcdEBwYXJhbSBlbmRwb2ludHMge09iamVjdH0gQSBzZXQgb2YgZW5kcG9pbnRzIGF2YWlsYWJsZSBvbiB0aGUgbmV3IHJvdXRlIChnZXQsIHBvc3QsIHB1dCwgcGF0Y2gsIGRlbGV0ZSwgb3B0aW9ucylcclxuXHRcdEBwYXJhbSBlbmRwb2ludHMuPG1ldGhvZD4ge0Z1bmN0aW9uIG9yIE9iamVjdH0gSWYgYSBmdW5jdGlvbiBpcyBwcm92aWRlZCwgYWxsIGRlZmF1bHQgcm91dGVcclxuXHRcdFx0XHRjb25maWd1cmF0aW9uIG9wdGlvbnMgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbmRwb2ludC4gT3RoZXJ3aXNlIGFuIG9iamVjdCB3aXRoIGFuIGBhY3Rpb25gXHJcblx0XHRcdFx0YW5kIGFsbCBvdGhlciByb3V0ZSBjb25maWcgb3B0aW9ucyBhdmFpbGFibGUuIEFuIGBhY3Rpb25gIG11c3QgYmUgcHJvdmlkZWQgd2l0aCB0aGUgb2JqZWN0LlxyXG5cdCMjI1xyXG5cdGFkZFJvdXRlOiAocGF0aCwgb3B0aW9ucywgZW5kcG9pbnRzKSAtPlxyXG5cdFx0IyBDcmVhdGUgYSBuZXcgcm91dGUgYW5kIGFkZCBpdCB0byBvdXIgbGlzdCBvZiBleGlzdGluZyByb3V0ZXNcclxuXHRcdHJvdXRlID0gbmV3IHNoYXJlLlJvdXRlKHRoaXMsIHBhdGgsIG9wdGlvbnMsIGVuZHBvaW50cylcclxuXHRcdEBfcm91dGVzLnB1c2gocm91dGUpXHJcblxyXG5cdFx0cm91dGUuYWRkVG9BcGkoKVxyXG5cclxuXHRcdHJldHVybiB0aGlzXHJcblxyXG5cclxuXHQjIyMqXHJcblx0XHRHZW5lcmF0ZSByb3V0ZXMgZm9yIHRoZSBNZXRlb3IgQ29sbGVjdGlvbiB3aXRoIHRoZSBnaXZlbiBuYW1lXHJcblx0IyMjXHJcblx0YWRkQ29sbGVjdGlvbjogKGNvbGxlY3Rpb24sIG9wdGlvbnM9e30pIC0+XHJcblx0XHRtZXRob2RzID0gWydnZXQnLCAncG9zdCcsICdwdXQnLCAnZGVsZXRlJywgJ2dldEFsbCddXHJcblx0XHRtZXRob2RzT25Db2xsZWN0aW9uID0gWydwb3N0JywgJ2dldEFsbCddXHJcblxyXG5cdFx0IyBHcmFiIHRoZSBzZXQgb2YgZW5kcG9pbnRzXHJcblx0XHRpZiBjb2xsZWN0aW9uIGlzIE1ldGVvci51c2Vyc1xyXG5cdFx0XHRjb2xsZWN0aW9uRW5kcG9pbnRzID0gQF91c2VyQ29sbGVjdGlvbkVuZHBvaW50c1xyXG5cdFx0ZWxzZVxyXG5cdFx0XHRjb2xsZWN0aW9uRW5kcG9pbnRzID0gQF9jb2xsZWN0aW9uRW5kcG9pbnRzXHJcblxyXG5cdFx0IyBGbGF0dGVuIHRoZSBvcHRpb25zIGFuZCBzZXQgZGVmYXVsdHMgaWYgbmVjZXNzYXJ5XHJcblx0XHRlbmRwb2ludHNBd2FpdGluZ0NvbmZpZ3VyYXRpb24gPSBvcHRpb25zLmVuZHBvaW50cyBvciB7fVxyXG5cdFx0cm91dGVPcHRpb25zID0gb3B0aW9ucy5yb3V0ZU9wdGlvbnMgb3Ige31cclxuXHRcdGV4Y2x1ZGVkRW5kcG9pbnRzID0gb3B0aW9ucy5leGNsdWRlZEVuZHBvaW50cyBvciBbXVxyXG5cdFx0IyBVc2UgY29sbGVjdGlvbiBuYW1lIGFzIGRlZmF1bHQgcGF0aFxyXG5cdFx0cGF0aCA9IG9wdGlvbnMucGF0aCBvciBjb2xsZWN0aW9uLl9uYW1lXHJcblxyXG5cdFx0IyBTZXBhcmF0ZSB0aGUgcmVxdWVzdGVkIGVuZHBvaW50cyBieSB0aGUgcm91dGUgdGhleSBiZWxvbmcgdG8gKG9uZSBmb3Igb3BlcmF0aW5nIG9uIHRoZSBlbnRpcmVcclxuXHRcdCMgY29sbGVjdGlvbiBhbmQgb25lIGZvciBvcGVyYXRpbmcgb24gYSBzaW5nbGUgZW50aXR5IHdpdGhpbiB0aGUgY29sbGVjdGlvbilcclxuXHRcdGNvbGxlY3Rpb25Sb3V0ZUVuZHBvaW50cyA9IHt9XHJcblx0XHRlbnRpdHlSb3V0ZUVuZHBvaW50cyA9IHt9XHJcblx0XHRpZiBfLmlzRW1wdHkoZW5kcG9pbnRzQXdhaXRpbmdDb25maWd1cmF0aW9uKSBhbmQgXy5pc0VtcHR5KGV4Y2x1ZGVkRW5kcG9pbnRzKVxyXG5cdFx0XHQjIEdlbmVyYXRlIGFsbCBlbmRwb2ludHMgb24gdGhpcyBjb2xsZWN0aW9uXHJcblx0XHRcdF8uZWFjaCBtZXRob2RzLCAobWV0aG9kKSAtPlxyXG5cdFx0XHRcdCMgUGFydGl0aW9uIHRoZSBlbmRwb2ludHMgaW50byB0aGVpciByZXNwZWN0aXZlIHJvdXRlc1xyXG5cdFx0XHRcdGlmIG1ldGhvZCBpbiBtZXRob2RzT25Db2xsZWN0aW9uXHJcblx0XHRcdFx0XHRfLmV4dGVuZCBjb2xsZWN0aW9uUm91dGVFbmRwb2ludHMsIGNvbGxlY3Rpb25FbmRwb2ludHNbbWV0aG9kXS5jYWxsKHRoaXMsIGNvbGxlY3Rpb24pXHJcblx0XHRcdFx0ZWxzZSBfLmV4dGVuZCBlbnRpdHlSb3V0ZUVuZHBvaW50cywgY29sbGVjdGlvbkVuZHBvaW50c1ttZXRob2RdLmNhbGwodGhpcywgY29sbGVjdGlvbilcclxuXHRcdFx0XHRyZXR1cm5cclxuXHRcdFx0LCB0aGlzXHJcblx0XHRlbHNlXHJcblx0XHRcdCMgR2VuZXJhdGUgYW55IGVuZHBvaW50cyB0aGF0IGhhdmVuJ3QgYmVlbiBleHBsaWNpdGx5IGV4Y2x1ZGVkXHJcblx0XHRcdF8uZWFjaCBtZXRob2RzLCAobWV0aG9kKSAtPlxyXG5cdFx0XHRcdGlmIG1ldGhvZCBub3QgaW4gZXhjbHVkZWRFbmRwb2ludHMgYW5kIGVuZHBvaW50c0F3YWl0aW5nQ29uZmlndXJhdGlvblttZXRob2RdIGlzbnQgZmFsc2VcclxuXHRcdFx0XHRcdCMgQ29uZmlndXJlIGVuZHBvaW50IGFuZCBtYXAgdG8gaXQncyBodHRwIG1ldGhvZFxyXG5cdFx0XHRcdFx0IyBUT0RPOiBDb25zaWRlciBwcmVkZWZpbmluZyBhIG1hcCBvZiBtZXRob2RzIHRvIHRoZWlyIGh0dHAgbWV0aG9kIHR5cGUgKGUuZy4sIGdldEFsbDogZ2V0KVxyXG5cdFx0XHRcdFx0ZW5kcG9pbnRPcHRpb25zID0gZW5kcG9pbnRzQXdhaXRpbmdDb25maWd1cmF0aW9uW21ldGhvZF1cclxuXHRcdFx0XHRcdGNvbmZpZ3VyZWRFbmRwb2ludCA9IHt9XHJcblx0XHRcdFx0XHRfLmVhY2ggY29sbGVjdGlvbkVuZHBvaW50c1ttZXRob2RdLmNhbGwodGhpcywgY29sbGVjdGlvbiksIChhY3Rpb24sIG1ldGhvZFR5cGUpIC0+XHJcblx0XHRcdFx0XHRcdGNvbmZpZ3VyZWRFbmRwb2ludFttZXRob2RUeXBlXSA9XHJcblx0XHRcdFx0XHRcdFx0Xy5jaGFpbiBhY3Rpb25cclxuXHRcdFx0XHRcdFx0XHQuY2xvbmUoKVxyXG5cdFx0XHRcdFx0XHRcdC5leHRlbmQgZW5kcG9pbnRPcHRpb25zXHJcblx0XHRcdFx0XHRcdFx0LnZhbHVlKClcclxuXHRcdFx0XHRcdCMgUGFydGl0aW9uIHRoZSBlbmRwb2ludHMgaW50byB0aGVpciByZXNwZWN0aXZlIHJvdXRlc1xyXG5cdFx0XHRcdFx0aWYgbWV0aG9kIGluIG1ldGhvZHNPbkNvbGxlY3Rpb25cclxuXHRcdFx0XHRcdFx0Xy5leHRlbmQgY29sbGVjdGlvblJvdXRlRW5kcG9pbnRzLCBjb25maWd1cmVkRW5kcG9pbnRcclxuXHRcdFx0XHRcdGVsc2UgXy5leHRlbmQgZW50aXR5Um91dGVFbmRwb2ludHMsIGNvbmZpZ3VyZWRFbmRwb2ludFxyXG5cdFx0XHRcdFx0cmV0dXJuXHJcblx0XHRcdCwgdGhpc1xyXG5cclxuXHRcdCMgQWRkIHRoZSByb3V0ZXMgdG8gdGhlIEFQSVxyXG5cdFx0QGFkZFJvdXRlIHBhdGgsIHJvdXRlT3B0aW9ucywgY29sbGVjdGlvblJvdXRlRW5kcG9pbnRzXHJcblx0XHRAYWRkUm91dGUgXCIje3BhdGh9LzppZFwiLCByb3V0ZU9wdGlvbnMsIGVudGl0eVJvdXRlRW5kcG9pbnRzXHJcblxyXG5cdFx0cmV0dXJuIHRoaXNcclxuXHJcblxyXG5cdCMjIypcclxuXHRcdEEgc2V0IG9mIGVuZHBvaW50cyB0aGF0IGNhbiBiZSBhcHBsaWVkIHRvIGEgQ29sbGVjdGlvbiBSb3V0ZVxyXG5cdCMjI1xyXG5cdF9jb2xsZWN0aW9uRW5kcG9pbnRzOlxyXG5cdFx0Z2V0OiAoY29sbGVjdGlvbikgLT5cclxuXHRcdFx0Z2V0OlxyXG5cdFx0XHRcdGFjdGlvbjogLT5cclxuXHRcdFx0XHRcdHNlbGVjdG9yID0ge19pZDogQHVybFBhcmFtcy5pZH1cclxuXHRcdFx0XHRcdGlmIHRoaXMuc3BhY2VJZFxyXG5cdFx0XHRcdFx0XHRzZWxlY3Rvci5zcGFjZSA9IHRoaXMuc3BhY2VJZFxyXG5cdFx0XHRcdFx0ZW50aXR5ID0gY29sbGVjdGlvbi5maW5kT25lIHNlbGVjdG9yXHJcblx0XHRcdFx0XHRpZiBlbnRpdHlcclxuXHRcdFx0XHRcdFx0e3N0YXR1czogJ3N1Y2Nlc3MnLCBkYXRhOiBlbnRpdHl9XHJcblx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxyXG5cdFx0XHRcdFx0XHRib2R5OiB7c3RhdHVzOiAnZmFpbCcsIG1lc3NhZ2U6ICdJdGVtIG5vdCBmb3VuZCd9XHJcblx0XHRwdXQ6IChjb2xsZWN0aW9uKSAtPlxyXG5cdFx0XHRwdXQ6XHJcblx0XHRcdFx0YWN0aW9uOiAtPlxyXG5cdFx0XHRcdFx0c2VsZWN0b3IgPSB7X2lkOiBAdXJsUGFyYW1zLmlkfVxyXG5cdFx0XHRcdFx0aWYgdGhpcy5zcGFjZUlkXHJcblx0XHRcdFx0XHRcdHNlbGVjdG9yLnNwYWNlID0gdGhpcy5zcGFjZUlkXHJcblx0XHRcdFx0XHRlbnRpdHlJc1VwZGF0ZWQgPSBjb2xsZWN0aW9uLnVwZGF0ZSBzZWxlY3RvciwgJHNldDogQGJvZHlQYXJhbXNcclxuXHRcdFx0XHRcdGlmIGVudGl0eUlzVXBkYXRlZFxyXG5cdFx0XHRcdFx0XHRlbnRpdHkgPSBjb2xsZWN0aW9uLmZpbmRPbmUgQHVybFBhcmFtcy5pZFxyXG5cdFx0XHRcdFx0XHR7c3RhdHVzOiAnc3VjY2VzcycsIGRhdGE6IGVudGl0eX1cclxuXHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XHJcblx0XHRcdFx0XHRcdGJvZHk6IHtzdGF0dXM6ICdmYWlsJywgbWVzc2FnZTogJ0l0ZW0gbm90IGZvdW5kJ31cclxuXHRcdGRlbGV0ZTogKGNvbGxlY3Rpb24pIC0+XHJcblx0XHRcdGRlbGV0ZTpcclxuXHRcdFx0XHRhY3Rpb246IC0+XHJcblx0XHRcdFx0XHRzZWxlY3RvciA9IHtfaWQ6IEB1cmxQYXJhbXMuaWR9XHJcblx0XHRcdFx0XHRpZiB0aGlzLnNwYWNlSWRcclxuXHRcdFx0XHRcdFx0c2VsZWN0b3Iuc3BhY2UgPSB0aGlzLnNwYWNlSWRcclxuXHRcdFx0XHRcdGlmIGNvbGxlY3Rpb24ucmVtb3ZlIHNlbGVjdG9yXHJcblx0XHRcdFx0XHRcdHtzdGF0dXM6ICdzdWNjZXNzJywgZGF0YTogbWVzc2FnZTogJ0l0ZW0gcmVtb3ZlZCd9XHJcblx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxyXG5cdFx0XHRcdFx0XHRib2R5OiB7c3RhdHVzOiAnZmFpbCcsIG1lc3NhZ2U6ICdJdGVtIG5vdCBmb3VuZCd9XHJcblx0XHRwb3N0OiAoY29sbGVjdGlvbikgLT5cclxuXHRcdFx0cG9zdDpcclxuXHRcdFx0XHRhY3Rpb246IC0+XHJcblx0XHRcdFx0XHRpZiB0aGlzLnNwYWNlSWRcclxuXHRcdFx0XHRcdFx0QGJvZHlQYXJhbXMuc3BhY2UgPSB0aGlzLnNwYWNlSWRcclxuXHRcdFx0XHRcdGVudGl0eUlkID0gY29sbGVjdGlvbi5pbnNlcnQgQGJvZHlQYXJhbXNcclxuXHRcdFx0XHRcdGVudGl0eSA9IGNvbGxlY3Rpb24uZmluZE9uZSBlbnRpdHlJZFxyXG5cdFx0XHRcdFx0aWYgZW50aXR5XHJcblx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDIwMVxyXG5cdFx0XHRcdFx0XHRib2R5OiB7c3RhdHVzOiAnc3VjY2VzcycsIGRhdGE6IGVudGl0eX1cclxuXHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDAwXHJcblx0XHRcdFx0XHRcdGJvZHk6IHtzdGF0dXM6ICdmYWlsJywgbWVzc2FnZTogJ05vIGl0ZW0gYWRkZWQnfVxyXG5cdFx0Z2V0QWxsOiAoY29sbGVjdGlvbikgLT5cclxuXHRcdFx0Z2V0OlxyXG5cdFx0XHRcdGFjdGlvbjogLT5cclxuXHRcdFx0XHRcdHNlbGVjdG9yID0ge31cclxuXHRcdFx0XHRcdGlmIHRoaXMuc3BhY2VJZFxyXG5cdFx0XHRcdFx0XHRzZWxlY3Rvci5zcGFjZSA9IHRoaXMuc3BhY2VJZFxyXG5cdFx0XHRcdFx0ZW50aXRpZXMgPSBjb2xsZWN0aW9uLmZpbmQoc2VsZWN0b3IpLmZldGNoKClcclxuXHRcdFx0XHRcdGlmIGVudGl0aWVzXHJcblx0XHRcdFx0XHRcdHtzdGF0dXM6ICdzdWNjZXNzJywgZGF0YTogZW50aXRpZXN9XHJcblx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxyXG5cdFx0XHRcdFx0XHRib2R5OiB7c3RhdHVzOiAnZmFpbCcsIG1lc3NhZ2U6ICdVbmFibGUgdG8gcmV0cmlldmUgaXRlbXMgZnJvbSBjb2xsZWN0aW9uJ31cclxuXHJcblxyXG5cdCMjIypcclxuXHRcdEEgc2V0IG9mIGVuZHBvaW50cyB0aGF0IGNhbiBiZSBhcHBsaWVkIHRvIGEgTWV0ZW9yLnVzZXJzIENvbGxlY3Rpb24gUm91dGVcclxuXHQjIyNcclxuXHRfdXNlckNvbGxlY3Rpb25FbmRwb2ludHM6XHJcblx0XHRnZXQ6IChjb2xsZWN0aW9uKSAtPlxyXG5cdFx0XHRnZXQ6XHJcblx0XHRcdFx0YWN0aW9uOiAtPlxyXG5cdFx0XHRcdFx0ZW50aXR5ID0gY29sbGVjdGlvbi5maW5kT25lIEB1cmxQYXJhbXMuaWQsIGZpZWxkczogcHJvZmlsZTogMVxyXG5cdFx0XHRcdFx0aWYgZW50aXR5XHJcblx0XHRcdFx0XHRcdHtzdGF0dXM6ICdzdWNjZXNzJywgZGF0YTogZW50aXR5fVxyXG5cdFx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDRcclxuXHRcdFx0XHRcdFx0Ym9keToge3N0YXR1czogJ2ZhaWwnLCBtZXNzYWdlOiAnVXNlciBub3QgZm91bmQnfVxyXG5cdFx0cHV0OiAoY29sbGVjdGlvbikgLT5cclxuXHRcdFx0cHV0OlxyXG5cdFx0XHRcdGFjdGlvbjogLT5cclxuXHRcdFx0XHRcdGVudGl0eUlzVXBkYXRlZCA9IGNvbGxlY3Rpb24udXBkYXRlIEB1cmxQYXJhbXMuaWQsICRzZXQ6IHByb2ZpbGU6IEBib2R5UGFyYW1zXHJcblx0XHRcdFx0XHRpZiBlbnRpdHlJc1VwZGF0ZWRcclxuXHRcdFx0XHRcdFx0ZW50aXR5ID0gY29sbGVjdGlvbi5maW5kT25lIEB1cmxQYXJhbXMuaWQsIGZpZWxkczogcHJvZmlsZTogMVxyXG5cdFx0XHRcdFx0XHR7c3RhdHVzOiBcInN1Y2Nlc3NcIiwgZGF0YTogZW50aXR5fVxyXG5cdFx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDRcclxuXHRcdFx0XHRcdFx0Ym9keToge3N0YXR1czogJ2ZhaWwnLCBtZXNzYWdlOiAnVXNlciBub3QgZm91bmQnfVxyXG5cdFx0ZGVsZXRlOiAoY29sbGVjdGlvbikgLT5cclxuXHRcdFx0ZGVsZXRlOlxyXG5cdFx0XHRcdGFjdGlvbjogLT5cclxuXHRcdFx0XHRcdGlmIGNvbGxlY3Rpb24ucmVtb3ZlIEB1cmxQYXJhbXMuaWRcclxuXHRcdFx0XHRcdFx0e3N0YXR1czogJ3N1Y2Nlc3MnLCBkYXRhOiBtZXNzYWdlOiAnVXNlciByZW1vdmVkJ31cclxuXHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XHJcblx0XHRcdFx0XHRcdGJvZHk6IHtzdGF0dXM6ICdmYWlsJywgbWVzc2FnZTogJ1VzZXIgbm90IGZvdW5kJ31cclxuXHRcdHBvc3Q6IChjb2xsZWN0aW9uKSAtPlxyXG5cdFx0XHRwb3N0OlxyXG5cdFx0XHRcdGFjdGlvbjogLT5cclxuXHRcdFx0XHRcdCMgQ3JlYXRlIGEgbmV3IHVzZXIgYWNjb3VudFxyXG5cdFx0XHRcdFx0ZW50aXR5SWQgPSBBY2NvdW50cy5jcmVhdGVVc2VyIEBib2R5UGFyYW1zXHJcblx0XHRcdFx0XHRlbnRpdHkgPSBjb2xsZWN0aW9uLmZpbmRPbmUgZW50aXR5SWQsIGZpZWxkczogcHJvZmlsZTogMVxyXG5cdFx0XHRcdFx0aWYgZW50aXR5XHJcblx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDIwMVxyXG5cdFx0XHRcdFx0XHRib2R5OiB7c3RhdHVzOiAnc3VjY2VzcycsIGRhdGE6IGVudGl0eX1cclxuXHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDAwXHJcblx0XHRcdFx0XHRcdHtzdGF0dXM6ICdmYWlsJywgbWVzc2FnZTogJ05vIHVzZXIgYWRkZWQnfVxyXG5cdFx0Z2V0QWxsOiAoY29sbGVjdGlvbikgLT5cclxuXHRcdFx0Z2V0OlxyXG5cdFx0XHRcdGFjdGlvbjogLT5cclxuXHRcdFx0XHRcdGVudGl0aWVzID0gY29sbGVjdGlvbi5maW5kKHt9LCBmaWVsZHM6IHByb2ZpbGU6IDEpLmZldGNoKClcclxuXHRcdFx0XHRcdGlmIGVudGl0aWVzXHJcblx0XHRcdFx0XHRcdHtzdGF0dXM6ICdzdWNjZXNzJywgZGF0YTogZW50aXRpZXN9XHJcblx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxyXG5cdFx0XHRcdFx0XHRib2R5OiB7c3RhdHVzOiAnZmFpbCcsIG1lc3NhZ2U6ICdVbmFibGUgdG8gcmV0cmlldmUgdXNlcnMnfVxyXG5cclxuXHJcblx0IyMjXHJcblx0XHRBZGQgL2xvZ2luIGFuZCAvbG9nb3V0IGVuZHBvaW50cyB0byB0aGUgQVBJXHJcblx0IyMjXHJcblx0X2luaXRBdXRoOiAtPlxyXG5cdFx0c2VsZiA9IHRoaXNcclxuXHRcdCMjI1xyXG5cdFx0XHRBZGQgYSBsb2dpbiBlbmRwb2ludCB0byB0aGUgQVBJXHJcblxyXG5cdFx0XHRBZnRlciB0aGUgdXNlciBpcyBsb2dnZWQgaW4sIHRoZSBvbkxvZ2dlZEluIGhvb2sgaXMgY2FsbGVkIChzZWUgUmVzdGZ1bGx5LmNvbmZpZ3VyZSgpIGZvclxyXG5cdFx0XHRhZGRpbmcgaG9vaykuXHJcblx0XHQjIyNcclxuXHRcdEBhZGRSb3V0ZSAnbG9naW4nLCB7YXV0aFJlcXVpcmVkOiBmYWxzZX0sXHJcblx0XHRcdHBvc3Q6IC0+XHJcblx0XHRcdFx0IyBHcmFiIHRoZSB1c2VybmFtZSBvciBlbWFpbCB0aGF0IHRoZSB1c2VyIGlzIGxvZ2dpbmcgaW4gd2l0aFxyXG5cdFx0XHRcdHVzZXIgPSB7fVxyXG5cdFx0XHRcdGlmIEBib2R5UGFyYW1zLnVzZXJcclxuXHRcdFx0XHRcdGlmIEBib2R5UGFyYW1zLnVzZXIuaW5kZXhPZignQCcpIGlzIC0xXHJcblx0XHRcdFx0XHRcdHVzZXIudXNlcm5hbWUgPSBAYm9keVBhcmFtcy51c2VyXHJcblx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdHVzZXIuZW1haWwgPSBAYm9keVBhcmFtcy51c2VyXHJcblx0XHRcdFx0ZWxzZSBpZiBAYm9keVBhcmFtcy51c2VybmFtZVxyXG5cdFx0XHRcdFx0dXNlci51c2VybmFtZSA9IEBib2R5UGFyYW1zLnVzZXJuYW1lXHJcblx0XHRcdFx0ZWxzZSBpZiBAYm9keVBhcmFtcy5lbWFpbFxyXG5cdFx0XHRcdFx0dXNlci5lbWFpbCA9IEBib2R5UGFyYW1zLmVtYWlsXHJcblxyXG5cdFx0XHRcdCMgVHJ5IHRvIGxvZyB0aGUgdXNlciBpbnRvIHRoZSB1c2VyJ3MgYWNjb3VudCAoaWYgc3VjY2Vzc2Z1bCB3ZSdsbCBnZXQgYW4gYXV0aCB0b2tlbiBiYWNrKVxyXG5cdFx0XHRcdHRyeVxyXG5cdFx0XHRcdFx0YXV0aCA9IEF1dGgubG9naW5XaXRoUGFzc3dvcmQgdXNlciwgQGJvZHlQYXJhbXMucGFzc3dvcmRcclxuXHRcdFx0XHRjYXRjaCBlXHJcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yIGVcclxuXHRcdFx0XHRcdHJldHVybiB7fSA9XHJcblx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IGUuZXJyb3JcclxuXHRcdFx0XHRcdFx0Ym9keTogc3RhdHVzOiAnZXJyb3InLCBtZXNzYWdlOiBlLnJlYXNvblxyXG5cclxuXHRcdFx0XHQjIEdldCB0aGUgYXV0aGVudGljYXRlZCB1c2VyXHJcblx0XHRcdFx0IyBUT0RPOiBDb25zaWRlciByZXR1cm5pbmcgdGhlIHVzZXIgaW4gQXV0aC5sb2dpbldpdGhQYXNzd29yZCgpLCBpbnN0ZWFkIG9mIGZldGNoaW5nIGl0IGFnYWluIGhlcmVcclxuXHRcdFx0XHRpZiBhdXRoLnVzZXJJZCBhbmQgYXV0aC5hdXRoVG9rZW5cclxuXHRcdFx0XHRcdHNlYXJjaFF1ZXJ5ID0ge31cclxuXHRcdFx0XHRcdHNlYXJjaFF1ZXJ5W3NlbGYuX2NvbmZpZy5hdXRoLnRva2VuXSA9IEFjY291bnRzLl9oYXNoTG9naW5Ub2tlbiBhdXRoLmF1dGhUb2tlblxyXG5cdFx0XHRcdFx0QHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZVxyXG5cdFx0XHRcdFx0XHQnX2lkJzogYXV0aC51c2VySWRcclxuXHRcdFx0XHRcdFx0c2VhcmNoUXVlcnlcclxuXHRcdFx0XHRcdEB1c2VySWQgPSBAdXNlcj8uX2lkXHJcblxyXG5cdFx0XHRcdHJlc3BvbnNlID0ge3N0YXR1czogJ3N1Y2Nlc3MnLCBkYXRhOiBhdXRofVxyXG5cclxuXHRcdFx0XHQjIENhbGwgdGhlIGxvZ2luIGhvb2sgd2l0aCB0aGUgYXV0aGVudGljYXRlZCB1c2VyIGF0dGFjaGVkXHJcblx0XHRcdFx0ZXh0cmFEYXRhID0gc2VsZi5fY29uZmlnLm9uTG9nZ2VkSW4/LmNhbGwodGhpcylcclxuXHRcdFx0XHRpZiBleHRyYURhdGE/XHJcblx0XHRcdFx0XHRfLmV4dGVuZChyZXNwb25zZS5kYXRhLCB7ZXh0cmE6IGV4dHJhRGF0YX0pXHJcblxyXG5cdFx0XHRcdHJlc3BvbnNlXHJcblxyXG5cdFx0bG9nb3V0ID0gLT5cclxuXHRcdFx0IyBSZW1vdmUgdGhlIGdpdmVuIGF1dGggdG9rZW4gZnJvbSB0aGUgdXNlcidzIGFjY291bnRcclxuXHRcdFx0YXV0aFRva2VuID0gQHJlcXVlc3QuaGVhZGVyc1sneC1hdXRoLXRva2VuJ11cclxuXHRcdFx0aGFzaGVkVG9rZW4gPSBBY2NvdW50cy5faGFzaExvZ2luVG9rZW4gYXV0aFRva2VuXHJcblx0XHRcdHRva2VuTG9jYXRpb24gPSBzZWxmLl9jb25maWcuYXV0aC50b2tlblxyXG5cdFx0XHRpbmRleCA9IHRva2VuTG9jYXRpb24ubGFzdEluZGV4T2YgJy4nXHJcblx0XHRcdHRva2VuUGF0aCA9IHRva2VuTG9jYXRpb24uc3Vic3RyaW5nIDAsIGluZGV4XHJcblx0XHRcdHRva2VuRmllbGROYW1lID0gdG9rZW5Mb2NhdGlvbi5zdWJzdHJpbmcgaW5kZXggKyAxXHJcblx0XHRcdHRva2VuVG9SZW1vdmUgPSB7fVxyXG5cdFx0XHR0b2tlblRvUmVtb3ZlW3Rva2VuRmllbGROYW1lXSA9IGhhc2hlZFRva2VuXHJcblx0XHRcdHRva2VuUmVtb3ZhbFF1ZXJ5ID0ge31cclxuXHRcdFx0dG9rZW5SZW1vdmFsUXVlcnlbdG9rZW5QYXRoXSA9IHRva2VuVG9SZW1vdmVcclxuXHRcdFx0TWV0ZW9yLnVzZXJzLnVwZGF0ZSBAdXNlci5faWQsIHskcHVsbDogdG9rZW5SZW1vdmFsUXVlcnl9XHJcblxyXG5cdFx0XHRyZXNwb25zZSA9IHtzdGF0dXM6ICdzdWNjZXNzJywgZGF0YToge21lc3NhZ2U6ICdZb3VcXCd2ZSBiZWVuIGxvZ2dlZCBvdXQhJ319XHJcblxyXG5cdFx0XHQjIENhbGwgdGhlIGxvZ291dCBob29rIHdpdGggdGhlIGF1dGhlbnRpY2F0ZWQgdXNlciBhdHRhY2hlZFxyXG5cdFx0XHRleHRyYURhdGEgPSBzZWxmLl9jb25maWcub25Mb2dnZWRPdXQ/LmNhbGwodGhpcylcclxuXHRcdFx0aWYgZXh0cmFEYXRhP1xyXG5cdFx0XHRcdF8uZXh0ZW5kKHJlc3BvbnNlLmRhdGEsIHtleHRyYTogZXh0cmFEYXRhfSlcclxuXHJcblx0XHRcdHJlc3BvbnNlXHJcblxyXG5cdFx0IyMjXHJcblx0XHRcdEFkZCBhIGxvZ291dCBlbmRwb2ludCB0byB0aGUgQVBJXHJcblxyXG5cdFx0XHRBZnRlciB0aGUgdXNlciBpcyBsb2dnZWQgb3V0LCB0aGUgb25Mb2dnZWRPdXQgaG9vayBpcyBjYWxsZWQgKHNlZSBSZXN0ZnVsbHkuY29uZmlndXJlKCkgZm9yXHJcblx0XHRcdGFkZGluZyBob29rKS5cclxuXHRcdCMjI1xyXG5cdFx0QGFkZFJvdXRlICdsb2dvdXQnLCB7YXV0aFJlcXVpcmVkOiB0cnVlfSxcclxuXHRcdFx0Z2V0OiAtPlxyXG5cdFx0XHRcdGNvbnNvbGUud2FybiBcIldhcm5pbmc6IERlZmF1bHQgbG9nb3V0IHZpYSBHRVQgd2lsbCBiZSByZW1vdmVkIGluIFJlc3RpdnVzIHYxLjAuIFVzZSBQT1NUIGluc3RlYWQuXCJcclxuXHRcdFx0XHRjb25zb2xlLndhcm4gXCIgICAgU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9rYWhtYWxpL21ldGVvci1yZXN0aXZ1cy9pc3N1ZXMvMTAwXCJcclxuXHRcdFx0XHRyZXR1cm4gbG9nb3V0LmNhbGwodGhpcylcclxuXHRcdFx0cG9zdDogbG9nb3V0XHJcblxyXG5PZGF0YVJlc3RpdnVzID0gQE9kYXRhUmVzdGl2dXNcclxuIiwidmFyIENvb2tpZXMsIE9kYXRhUmVzdGl2dXMsIGJhc2ljQXV0aCxcbiAgaW5kZXhPZiA9IFtdLmluZGV4T2YgfHwgZnVuY3Rpb24oaXRlbSkgeyBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7IGlmIChpIGluIHRoaXMgJiYgdGhpc1tpXSA9PT0gaXRlbSkgcmV0dXJuIGk7IH0gcmV0dXJuIC0xOyB9O1xuXG5iYXNpY0F1dGggPSByZXF1aXJlKCdiYXNpYy1hdXRoJyk7XG5cbkNvb2tpZXMgPSByZXF1aXJlKFwiY29va2llc1wiKTtcblxudGhpcy5PZGF0YVJlc3RpdnVzID0gKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBPZGF0YVJlc3RpdnVzKG9wdGlvbnMpIHtcbiAgICB2YXIgY29yc0hlYWRlcnM7XG4gICAgdGhpcy5fcm91dGVzID0gW107XG4gICAgdGhpcy5fY29uZmlnID0ge1xuICAgICAgcGF0aHM6IFtdLFxuICAgICAgdXNlRGVmYXVsdEF1dGg6IGZhbHNlLFxuICAgICAgYXBpUGF0aDogJ2FwaS8nLFxuICAgICAgdmVyc2lvbjogbnVsbCxcbiAgICAgIHByZXR0eUpzb246IGZhbHNlLFxuICAgICAgYXV0aDoge1xuICAgICAgICB0b2tlbjogJ3NlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy5oYXNoZWRUb2tlbicsXG4gICAgICAgIHVzZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBfdXNlciwgYXV0aFRva2VuLCBjb29raWVzLCBzcGFjZUlkLCB0b2tlbiwgdXNlcklkO1xuICAgICAgICAgIGNvb2tpZXMgPSBuZXcgQ29va2llcyh0aGlzLnJlcXVlc3QsIHRoaXMucmVzcG9uc2UpO1xuICAgICAgICAgIHVzZXJJZCA9IHRoaXMucmVxdWVzdC5oZWFkZXJzWyd4LXVzZXItaWQnXSB8fCBjb29raWVzLmdldChcIlgtVXNlci1JZFwiKTtcbiAgICAgICAgICBhdXRoVG9rZW4gPSB0aGlzLnJlcXVlc3QuaGVhZGVyc1sneC1hdXRoLXRva2VuJ10gfHwgY29va2llcy5nZXQoXCJYLUF1dGgtVG9rZW5cIik7XG4gICAgICAgICAgc3BhY2VJZCA9IHRoaXMucmVxdWVzdC5oZWFkZXJzWyd4LXNwYWNlLWlkJ10gfHwgdGhpcy51cmxQYXJhbXNbJ3NwYWNlSWQnXTtcbiAgICAgICAgICBpZiAoYXV0aFRva2VuKSB7XG4gICAgICAgICAgICB0b2tlbiA9IEFjY291bnRzLl9oYXNoTG9naW5Ub2tlbihhdXRoVG9rZW4pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0LnVzZXJJZCkge1xuICAgICAgICAgICAgX3VzZXIgPSBkYi51c2Vycy5maW5kT25lKHtcbiAgICAgICAgICAgICAgX2lkOiB0aGlzLnJlcXVlc3QudXNlcklkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHVzZXI6IF91c2VyLFxuICAgICAgICAgICAgICB1c2VySWQ6IHVzZXJJZCxcbiAgICAgICAgICAgICAgc3BhY2VJZDogc3BhY2VJZCxcbiAgICAgICAgICAgICAgdG9rZW46IHRva2VuXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB1c2VySWQ6IHVzZXJJZCxcbiAgICAgICAgICAgICAgc3BhY2VJZDogc3BhY2VJZCxcbiAgICAgICAgICAgICAgdG9rZW46IHRva2VuXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGRlZmF1bHRIZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgIH0sXG4gICAgICBlbmFibGVDb3JzOiB0cnVlXG4gICAgfTtcbiAgICBfLmV4dGVuZCh0aGlzLl9jb25maWcsIG9wdGlvbnMpO1xuICAgIGlmICh0aGlzLl9jb25maWcuZW5hYmxlQ29ycykge1xuICAgICAgY29yc0hlYWRlcnMgPSB7XG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJ09yaWdpbiwgWC1SZXF1ZXN0ZWQtV2l0aCwgQ29udGVudC1UeXBlLCBBY2NlcHQsIE9EYXRhLVZlcnNpb24nXG4gICAgICB9O1xuICAgICAgaWYgKHRoaXMuX2NvbmZpZy51c2VEZWZhdWx0QXV0aCkge1xuICAgICAgICBjb3JzSGVhZGVyc1snQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycyddICs9ICcsIFgtVXNlci1JZCwgWC1BdXRoLVRva2VuLCBYLVNwYWNlLUlkJztcbiAgICAgIH1cbiAgICAgIF8uZXh0ZW5kKHRoaXMuX2NvbmZpZy5kZWZhdWx0SGVhZGVycywgY29yc0hlYWRlcnMpO1xuICAgICAgaWYgKCF0aGlzLl9jb25maWcuZGVmYXVsdE9wdGlvbnNFbmRwb2ludCkge1xuICAgICAgICB0aGlzLl9jb25maWcuZGVmYXVsdE9wdGlvbnNFbmRwb2ludCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHRoaXMucmVzcG9uc2Uud3JpdGVIZWFkKDIwMCwgY29yc0hlYWRlcnMpO1xuICAgICAgICAgIHJldHVybiB0aGlzLmRvbmUoKTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMuX2NvbmZpZy5hcGlQYXRoWzBdID09PSAnLycpIHtcbiAgICAgIHRoaXMuX2NvbmZpZy5hcGlQYXRoID0gdGhpcy5fY29uZmlnLmFwaVBhdGguc2xpY2UoMSk7XG4gICAgfVxuICAgIGlmIChfLmxhc3QodGhpcy5fY29uZmlnLmFwaVBhdGgpICE9PSAnLycpIHtcbiAgICAgIHRoaXMuX2NvbmZpZy5hcGlQYXRoID0gdGhpcy5fY29uZmlnLmFwaVBhdGggKyAnLyc7XG4gICAgfVxuICAgIGlmICh0aGlzLl9jb25maWcudmVyc2lvbikge1xuICAgICAgdGhpcy5fY29uZmlnLmFwaVBhdGggKz0gdGhpcy5fY29uZmlnLnZlcnNpb24gKyAnLyc7XG4gICAgfVxuICAgIGlmICh0aGlzLl9jb25maWcudXNlRGVmYXVsdEF1dGgpIHtcbiAgICAgIHRoaXMuX2luaXRBdXRoKCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9jb25maWcudXNlQXV0aCkge1xuICAgICAgdGhpcy5faW5pdEF1dGgoKTtcbiAgICAgIGNvbnNvbGUud2FybignV2FybmluZzogdXNlQXV0aCBBUEkgY29uZmlnIG9wdGlvbiB3aWxsIGJlIHJlbW92ZWQgaW4gUmVzdGl2dXMgdjEuMCAnICsgJ1xcbiAgICBVc2UgdGhlIHVzZURlZmF1bHRBdXRoIG9wdGlvbiBpbnN0ZWFkJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cblxuICAvKipcbiAgXHRcdEFkZCBlbmRwb2ludHMgZm9yIHRoZSBnaXZlbiBIVFRQIG1ldGhvZHMgYXQgdGhlIGdpdmVuIHBhdGhcbiAgXG4gIFx0XHRAcGFyYW0gcGF0aCB7U3RyaW5nfSBUaGUgZXh0ZW5kZWQgVVJMIHBhdGggKHdpbGwgYmUgYXBwZW5kZWQgdG8gYmFzZSBwYXRoIG9mIHRoZSBBUEkpXG4gIFx0XHRAcGFyYW0gb3B0aW9ucyB7T2JqZWN0fSBSb3V0ZSBjb25maWd1cmF0aW9uIG9wdGlvbnNcbiAgXHRcdEBwYXJhbSBvcHRpb25zLmF1dGhSZXF1aXJlZCB7Qm9vbGVhbn0gVGhlIGRlZmF1bHQgYXV0aCByZXF1aXJlbWVudCBmb3IgZWFjaCBlbmRwb2ludCBvbiB0aGUgcm91dGVcbiAgXHRcdEBwYXJhbSBvcHRpb25zLnJvbGVSZXF1aXJlZCB7U3RyaW5nIG9yIFN0cmluZ1tdfSBUaGUgZGVmYXVsdCByb2xlIHJlcXVpcmVkIGZvciBlYWNoIGVuZHBvaW50IG9uIHRoZSByb3V0ZVxuICBcdFx0QHBhcmFtIGVuZHBvaW50cyB7T2JqZWN0fSBBIHNldCBvZiBlbmRwb2ludHMgYXZhaWxhYmxlIG9uIHRoZSBuZXcgcm91dGUgKGdldCwgcG9zdCwgcHV0LCBwYXRjaCwgZGVsZXRlLCBvcHRpb25zKVxuICBcdFx0QHBhcmFtIGVuZHBvaW50cy48bWV0aG9kPiB7RnVuY3Rpb24gb3IgT2JqZWN0fSBJZiBhIGZ1bmN0aW9uIGlzIHByb3ZpZGVkLCBhbGwgZGVmYXVsdCByb3V0ZVxuICBcdFx0XHRcdGNvbmZpZ3VyYXRpb24gb3B0aW9ucyB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGVuZHBvaW50LiBPdGhlcndpc2UgYW4gb2JqZWN0IHdpdGggYW4gYGFjdGlvbmBcbiAgXHRcdFx0XHRhbmQgYWxsIG90aGVyIHJvdXRlIGNvbmZpZyBvcHRpb25zIGF2YWlsYWJsZS4gQW4gYGFjdGlvbmAgbXVzdCBiZSBwcm92aWRlZCB3aXRoIHRoZSBvYmplY3QuXG4gICAqL1xuXG4gIE9kYXRhUmVzdGl2dXMucHJvdG90eXBlLmFkZFJvdXRlID0gZnVuY3Rpb24ocGF0aCwgb3B0aW9ucywgZW5kcG9pbnRzKSB7XG4gICAgdmFyIHJvdXRlO1xuICAgIHJvdXRlID0gbmV3IHNoYXJlLlJvdXRlKHRoaXMsIHBhdGgsIG9wdGlvbnMsIGVuZHBvaW50cyk7XG4gICAgdGhpcy5fcm91dGVzLnB1c2gocm91dGUpO1xuICAgIHJvdXRlLmFkZFRvQXBpKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cblxuICAvKipcbiAgXHRcdEdlbmVyYXRlIHJvdXRlcyBmb3IgdGhlIE1ldGVvciBDb2xsZWN0aW9uIHdpdGggdGhlIGdpdmVuIG5hbWVcbiAgICovXG5cbiAgT2RhdGFSZXN0aXZ1cy5wcm90b3R5cGUuYWRkQ29sbGVjdGlvbiA9IGZ1bmN0aW9uKGNvbGxlY3Rpb24sIG9wdGlvbnMpIHtcbiAgICB2YXIgY29sbGVjdGlvbkVuZHBvaW50cywgY29sbGVjdGlvblJvdXRlRW5kcG9pbnRzLCBlbmRwb2ludHNBd2FpdGluZ0NvbmZpZ3VyYXRpb24sIGVudGl0eVJvdXRlRW5kcG9pbnRzLCBleGNsdWRlZEVuZHBvaW50cywgbWV0aG9kcywgbWV0aG9kc09uQ29sbGVjdGlvbiwgcGF0aCwgcm91dGVPcHRpb25zO1xuICAgIGlmIChvcHRpb25zID09IG51bGwpIHtcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG4gICAgbWV0aG9kcyA9IFsnZ2V0JywgJ3Bvc3QnLCAncHV0JywgJ2RlbGV0ZScsICdnZXRBbGwnXTtcbiAgICBtZXRob2RzT25Db2xsZWN0aW9uID0gWydwb3N0JywgJ2dldEFsbCddO1xuICAgIGlmIChjb2xsZWN0aW9uID09PSBNZXRlb3IudXNlcnMpIHtcbiAgICAgIGNvbGxlY3Rpb25FbmRwb2ludHMgPSB0aGlzLl91c2VyQ29sbGVjdGlvbkVuZHBvaW50cztcbiAgICB9IGVsc2Uge1xuICAgICAgY29sbGVjdGlvbkVuZHBvaW50cyA9IHRoaXMuX2NvbGxlY3Rpb25FbmRwb2ludHM7XG4gICAgfVxuICAgIGVuZHBvaW50c0F3YWl0aW5nQ29uZmlndXJhdGlvbiA9IG9wdGlvbnMuZW5kcG9pbnRzIHx8IHt9O1xuICAgIHJvdXRlT3B0aW9ucyA9IG9wdGlvbnMucm91dGVPcHRpb25zIHx8IHt9O1xuICAgIGV4Y2x1ZGVkRW5kcG9pbnRzID0gb3B0aW9ucy5leGNsdWRlZEVuZHBvaW50cyB8fCBbXTtcbiAgICBwYXRoID0gb3B0aW9ucy5wYXRoIHx8IGNvbGxlY3Rpb24uX25hbWU7XG4gICAgY29sbGVjdGlvblJvdXRlRW5kcG9pbnRzID0ge307XG4gICAgZW50aXR5Um91dGVFbmRwb2ludHMgPSB7fTtcbiAgICBpZiAoXy5pc0VtcHR5KGVuZHBvaW50c0F3YWl0aW5nQ29uZmlndXJhdGlvbikgJiYgXy5pc0VtcHR5KGV4Y2x1ZGVkRW5kcG9pbnRzKSkge1xuICAgICAgXy5lYWNoKG1ldGhvZHMsIGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgICAgICBpZiAoaW5kZXhPZi5jYWxsKG1ldGhvZHNPbkNvbGxlY3Rpb24sIG1ldGhvZCkgPj0gMCkge1xuICAgICAgICAgIF8uZXh0ZW5kKGNvbGxlY3Rpb25Sb3V0ZUVuZHBvaW50cywgY29sbGVjdGlvbkVuZHBvaW50c1ttZXRob2RdLmNhbGwodGhpcywgY29sbGVjdGlvbikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIF8uZXh0ZW5kKGVudGl0eVJvdXRlRW5kcG9pbnRzLCBjb2xsZWN0aW9uRW5kcG9pbnRzW21ldGhvZF0uY2FsbCh0aGlzLCBjb2xsZWN0aW9uKSk7XG4gICAgICAgIH1cbiAgICAgIH0sIHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBfLmVhY2gobWV0aG9kcywgZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgICAgIHZhciBjb25maWd1cmVkRW5kcG9pbnQsIGVuZHBvaW50T3B0aW9ucztcbiAgICAgICAgaWYgKGluZGV4T2YuY2FsbChleGNsdWRlZEVuZHBvaW50cywgbWV0aG9kKSA8IDAgJiYgZW5kcG9pbnRzQXdhaXRpbmdDb25maWd1cmF0aW9uW21ldGhvZF0gIT09IGZhbHNlKSB7XG4gICAgICAgICAgZW5kcG9pbnRPcHRpb25zID0gZW5kcG9pbnRzQXdhaXRpbmdDb25maWd1cmF0aW9uW21ldGhvZF07XG4gICAgICAgICAgY29uZmlndXJlZEVuZHBvaW50ID0ge307XG4gICAgICAgICAgXy5lYWNoKGNvbGxlY3Rpb25FbmRwb2ludHNbbWV0aG9kXS5jYWxsKHRoaXMsIGNvbGxlY3Rpb24pLCBmdW5jdGlvbihhY3Rpb24sIG1ldGhvZFR5cGUpIHtcbiAgICAgICAgICAgIHJldHVybiBjb25maWd1cmVkRW5kcG9pbnRbbWV0aG9kVHlwZV0gPSBfLmNoYWluKGFjdGlvbikuY2xvbmUoKS5leHRlbmQoZW5kcG9pbnRPcHRpb25zKS52YWx1ZSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmIChpbmRleE9mLmNhbGwobWV0aG9kc09uQ29sbGVjdGlvbiwgbWV0aG9kKSA+PSAwKSB7XG4gICAgICAgICAgICBfLmV4dGVuZChjb2xsZWN0aW9uUm91dGVFbmRwb2ludHMsIGNvbmZpZ3VyZWRFbmRwb2ludCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF8uZXh0ZW5kKGVudGl0eVJvdXRlRW5kcG9pbnRzLCBjb25maWd1cmVkRW5kcG9pbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSwgdGhpcyk7XG4gICAgfVxuICAgIHRoaXMuYWRkUm91dGUocGF0aCwgcm91dGVPcHRpb25zLCBjb2xsZWN0aW9uUm91dGVFbmRwb2ludHMpO1xuICAgIHRoaXMuYWRkUm91dGUocGF0aCArIFwiLzppZFwiLCByb3V0ZU9wdGlvbnMsIGVudGl0eVJvdXRlRW5kcG9pbnRzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuXG4gIC8qKlxuICBcdFx0QSBzZXQgb2YgZW5kcG9pbnRzIHRoYXQgY2FuIGJlIGFwcGxpZWQgdG8gYSBDb2xsZWN0aW9uIFJvdXRlXG4gICAqL1xuXG4gIE9kYXRhUmVzdGl2dXMucHJvdG90eXBlLl9jb2xsZWN0aW9uRW5kcG9pbnRzID0ge1xuICAgIGdldDogZnVuY3Rpb24oY29sbGVjdGlvbikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0OiB7XG4gICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBlbnRpdHksIHNlbGVjdG9yO1xuICAgICAgICAgICAgc2VsZWN0b3IgPSB7XG4gICAgICAgICAgICAgIF9pZDogdGhpcy51cmxQYXJhbXMuaWRcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAodGhpcy5zcGFjZUlkKSB7XG4gICAgICAgICAgICAgIHNlbGVjdG9yLnNwYWNlID0gdGhpcy5zcGFjZUlkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZW50aXR5ID0gY29sbGVjdGlvbi5maW5kT25lKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIGlmIChlbnRpdHkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcbiAgICAgICAgICAgICAgICBkYXRhOiBlbnRpdHlcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogNDA0LFxuICAgICAgICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgICAgICAgIHN0YXR1czogJ2ZhaWwnLFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0l0ZW0gbm90IGZvdW5kJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcbiAgICBwdXQ6IGZ1bmN0aW9uKGNvbGxlY3Rpb24pIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHB1dDoge1xuICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZW50aXR5LCBlbnRpdHlJc1VwZGF0ZWQsIHNlbGVjdG9yO1xuICAgICAgICAgICAgc2VsZWN0b3IgPSB7XG4gICAgICAgICAgICAgIF9pZDogdGhpcy51cmxQYXJhbXMuaWRcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAodGhpcy5zcGFjZUlkKSB7XG4gICAgICAgICAgICAgIHNlbGVjdG9yLnNwYWNlID0gdGhpcy5zcGFjZUlkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZW50aXR5SXNVcGRhdGVkID0gY29sbGVjdGlvbi51cGRhdGUoc2VsZWN0b3IsIHtcbiAgICAgICAgICAgICAgJHNldDogdGhpcy5ib2R5UGFyYW1zXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChlbnRpdHlJc1VwZGF0ZWQpIHtcbiAgICAgICAgICAgICAgZW50aXR5ID0gY29sbGVjdGlvbi5maW5kT25lKHRoaXMudXJsUGFyYW1zLmlkKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcbiAgICAgICAgICAgICAgICBkYXRhOiBlbnRpdHlcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogNDA0LFxuICAgICAgICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgICAgICAgIHN0YXR1czogJ2ZhaWwnLFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0l0ZW0gbm90IGZvdW5kJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcbiAgICBcImRlbGV0ZVwiOiBmdW5jdGlvbihjb2xsZWN0aW9uKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBcImRlbGV0ZVwiOiB7XG4gICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBzZWxlY3RvcjtcbiAgICAgICAgICAgIHNlbGVjdG9yID0ge1xuICAgICAgICAgICAgICBfaWQ6IHRoaXMudXJsUGFyYW1zLmlkXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKHRoaXMuc3BhY2VJZCkge1xuICAgICAgICAgICAgICBzZWxlY3Rvci5zcGFjZSA9IHRoaXMuc3BhY2VJZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjb2xsZWN0aW9uLnJlbW92ZShzZWxlY3RvcikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcbiAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnSXRlbSByZW1vdmVkJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogNDA0LFxuICAgICAgICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgICAgICAgIHN0YXR1czogJ2ZhaWwnLFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0l0ZW0gbm90IGZvdW5kJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcbiAgICBwb3N0OiBmdW5jdGlvbihjb2xsZWN0aW9uKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBwb3N0OiB7XG4gICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBlbnRpdHksIGVudGl0eUlkO1xuICAgICAgICAgICAgaWYgKHRoaXMuc3BhY2VJZCkge1xuICAgICAgICAgICAgICB0aGlzLmJvZHlQYXJhbXMuc3BhY2UgPSB0aGlzLnNwYWNlSWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbnRpdHlJZCA9IGNvbGxlY3Rpb24uaW5zZXJ0KHRoaXMuYm9keVBhcmFtcyk7XG4gICAgICAgICAgICBlbnRpdHkgPSBjb2xsZWN0aW9uLmZpbmRPbmUoZW50aXR5SWQpO1xuICAgICAgICAgICAgaWYgKGVudGl0eSkge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDIwMSxcbiAgICAgICAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICAgICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcbiAgICAgICAgICAgICAgICAgIGRhdGE6IGVudGl0eVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogNDAwLFxuICAgICAgICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgICAgICAgIHN0YXR1czogJ2ZhaWwnLFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ05vIGl0ZW0gYWRkZWQnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuICAgIGdldEFsbDogZnVuY3Rpb24oY29sbGVjdGlvbikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0OiB7XG4gICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBlbnRpdGllcywgc2VsZWN0b3I7XG4gICAgICAgICAgICBzZWxlY3RvciA9IHt9O1xuICAgICAgICAgICAgaWYgKHRoaXMuc3BhY2VJZCkge1xuICAgICAgICAgICAgICBzZWxlY3Rvci5zcGFjZSA9IHRoaXMuc3BhY2VJZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVudGl0aWVzID0gY29sbGVjdGlvbi5maW5kKHNlbGVjdG9yKS5mZXRjaCgpO1xuICAgICAgICAgICAgaWYgKGVudGl0aWVzKSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzOiAnc3VjY2VzcycsXG4gICAgICAgICAgICAgICAgZGF0YTogZW50aXRpZXNcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogNDA0LFxuICAgICAgICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgICAgICAgIHN0YXR1czogJ2ZhaWwnLFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ1VuYWJsZSB0byByZXRyaWV2ZSBpdGVtcyBmcm9tIGNvbGxlY3Rpb24nXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gIH07XG5cblxuICAvKipcbiAgXHRcdEEgc2V0IG9mIGVuZHBvaW50cyB0aGF0IGNhbiBiZSBhcHBsaWVkIHRvIGEgTWV0ZW9yLnVzZXJzIENvbGxlY3Rpb24gUm91dGVcbiAgICovXG5cbiAgT2RhdGFSZXN0aXZ1cy5wcm90b3R5cGUuX3VzZXJDb2xsZWN0aW9uRW5kcG9pbnRzID0ge1xuICAgIGdldDogZnVuY3Rpb24oY29sbGVjdGlvbikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0OiB7XG4gICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBlbnRpdHk7XG4gICAgICAgICAgICBlbnRpdHkgPSBjb2xsZWN0aW9uLmZpbmRPbmUodGhpcy51cmxQYXJhbXMuaWQsIHtcbiAgICAgICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICAgICAgcHJvZmlsZTogMVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChlbnRpdHkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcbiAgICAgICAgICAgICAgICBkYXRhOiBlbnRpdHlcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogNDA0LFxuICAgICAgICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgICAgICAgIHN0YXR1czogJ2ZhaWwnLFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ1VzZXIgbm90IGZvdW5kJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcbiAgICBwdXQ6IGZ1bmN0aW9uKGNvbGxlY3Rpb24pIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHB1dDoge1xuICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZW50aXR5LCBlbnRpdHlJc1VwZGF0ZWQ7XG4gICAgICAgICAgICBlbnRpdHlJc1VwZGF0ZWQgPSBjb2xsZWN0aW9uLnVwZGF0ZSh0aGlzLnVybFBhcmFtcy5pZCwge1xuICAgICAgICAgICAgICAkc2V0OiB7XG4gICAgICAgICAgICAgICAgcHJvZmlsZTogdGhpcy5ib2R5UGFyYW1zXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGVudGl0eUlzVXBkYXRlZCkge1xuICAgICAgICAgICAgICBlbnRpdHkgPSBjb2xsZWN0aW9uLmZpbmRPbmUodGhpcy51cmxQYXJhbXMuaWQsIHtcbiAgICAgICAgICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgICAgICAgIHByb2ZpbGU6IDFcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXR1czogXCJzdWNjZXNzXCIsXG4gICAgICAgICAgICAgICAgZGF0YTogZW50aXR5XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDQwNCxcbiAgICAgICAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICAgICAgICBzdGF0dXM6ICdmYWlsJyxcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdVc2VyIG5vdCBmb3VuZCdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG4gICAgXCJkZWxldGVcIjogZnVuY3Rpb24oY29sbGVjdGlvbikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgXCJkZWxldGVcIjoge1xuICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoY29sbGVjdGlvbi5yZW1vdmUodGhpcy51cmxQYXJhbXMuaWQpKSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzOiAnc3VjY2VzcycsXG4gICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ1VzZXIgcmVtb3ZlZCdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDQwNCxcbiAgICAgICAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICAgICAgICBzdGF0dXM6ICdmYWlsJyxcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdVc2VyIG5vdCBmb3VuZCdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG4gICAgcG9zdDogZnVuY3Rpb24oY29sbGVjdGlvbikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcG9zdDoge1xuICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZW50aXR5LCBlbnRpdHlJZDtcbiAgICAgICAgICAgIGVudGl0eUlkID0gQWNjb3VudHMuY3JlYXRlVXNlcih0aGlzLmJvZHlQYXJhbXMpO1xuICAgICAgICAgICAgZW50aXR5ID0gY29sbGVjdGlvbi5maW5kT25lKGVudGl0eUlkLCB7XG4gICAgICAgICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgICAgIHByb2ZpbGU6IDFcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoZW50aXR5KSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogMjAxLFxuICAgICAgICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgICAgICAgIHN0YXR1czogJ3N1Y2Nlc3MnLFxuICAgICAgICAgICAgICAgICAgZGF0YTogZW50aXR5XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgKHtcbiAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiA0MDBcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzOiAnZmFpbCcsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ05vIHVzZXIgYWRkZWQnXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG4gICAgZ2V0QWxsOiBmdW5jdGlvbihjb2xsZWN0aW9uKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBnZXQ6IHtcbiAgICAgICAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGVudGl0aWVzO1xuICAgICAgICAgICAgZW50aXRpZXMgPSBjb2xsZWN0aW9uLmZpbmQoe30sIHtcbiAgICAgICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICAgICAgcHJvZmlsZTogMVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS5mZXRjaCgpO1xuICAgICAgICAgICAgaWYgKGVudGl0aWVzKSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzOiAnc3VjY2VzcycsXG4gICAgICAgICAgICAgICAgZGF0YTogZW50aXRpZXNcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogNDA0LFxuICAgICAgICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgICAgICAgIHN0YXR1czogJ2ZhaWwnLFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ1VuYWJsZSB0byByZXRyaWV2ZSB1c2VycydcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgfTtcblxuXG4gIC8qXG4gIFx0XHRBZGQgL2xvZ2luIGFuZCAvbG9nb3V0IGVuZHBvaW50cyB0byB0aGUgQVBJXG4gICAqL1xuXG4gIE9kYXRhUmVzdGl2dXMucHJvdG90eXBlLl9pbml0QXV0aCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsb2dvdXQsIHNlbGY7XG4gICAgc2VsZiA9IHRoaXM7XG5cbiAgICAvKlxuICAgIFx0XHRcdEFkZCBhIGxvZ2luIGVuZHBvaW50IHRvIHRoZSBBUElcbiAgICBcbiAgICBcdFx0XHRBZnRlciB0aGUgdXNlciBpcyBsb2dnZWQgaW4sIHRoZSBvbkxvZ2dlZEluIGhvb2sgaXMgY2FsbGVkIChzZWUgUmVzdGZ1bGx5LmNvbmZpZ3VyZSgpIGZvclxuICAgIFx0XHRcdGFkZGluZyBob29rKS5cbiAgICAgKi9cbiAgICB0aGlzLmFkZFJvdXRlKCdsb2dpbicsIHtcbiAgICAgIGF1dGhSZXF1aXJlZDogZmFsc2VcbiAgICB9LCB7XG4gICAgICBwb3N0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGF1dGgsIGUsIGV4dHJhRGF0YSwgcmVmLCByZWYxLCByZXNwb25zZSwgc2VhcmNoUXVlcnksIHVzZXI7XG4gICAgICAgIHVzZXIgPSB7fTtcbiAgICAgICAgaWYgKHRoaXMuYm9keVBhcmFtcy51c2VyKSB7XG4gICAgICAgICAgaWYgKHRoaXMuYm9keVBhcmFtcy51c2VyLmluZGV4T2YoJ0AnKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHVzZXIudXNlcm5hbWUgPSB0aGlzLmJvZHlQYXJhbXMudXNlcjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXNlci5lbWFpbCA9IHRoaXMuYm9keVBhcmFtcy51c2VyO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmJvZHlQYXJhbXMudXNlcm5hbWUpIHtcbiAgICAgICAgICB1c2VyLnVzZXJuYW1lID0gdGhpcy5ib2R5UGFyYW1zLnVzZXJuYW1lO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuYm9keVBhcmFtcy5lbWFpbCkge1xuICAgICAgICAgIHVzZXIuZW1haWwgPSB0aGlzLmJvZHlQYXJhbXMuZW1haWw7XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhdXRoID0gQXV0aC5sb2dpbldpdGhQYXNzd29yZCh1c2VyLCB0aGlzLmJvZHlQYXJhbXMucGFzc3dvcmQpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGUgPSBlcnJvcjtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGF0dXNDb2RlOiBlLmVycm9yLFxuICAgICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgICBzdGF0dXM6ICdlcnJvcicsXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGUucmVhc29uXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXV0aC51c2VySWQgJiYgYXV0aC5hdXRoVG9rZW4pIHtcbiAgICAgICAgICBzZWFyY2hRdWVyeSA9IHt9O1xuICAgICAgICAgIHNlYXJjaFF1ZXJ5W3NlbGYuX2NvbmZpZy5hdXRoLnRva2VuXSA9IEFjY291bnRzLl9oYXNoTG9naW5Ub2tlbihhdXRoLmF1dGhUb2tlbik7XG4gICAgICAgICAgdGhpcy51c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUoe1xuICAgICAgICAgICAgJ19pZCc6IGF1dGgudXNlcklkXG4gICAgICAgICAgfSwgc2VhcmNoUXVlcnkpO1xuICAgICAgICAgIHRoaXMudXNlcklkID0gKHJlZiA9IHRoaXMudXNlcikgIT0gbnVsbCA/IHJlZi5faWQgOiB2b2lkIDA7XG4gICAgICAgIH1cbiAgICAgICAgcmVzcG9uc2UgPSB7XG4gICAgICAgICAgc3RhdHVzOiAnc3VjY2VzcycsXG4gICAgICAgICAgZGF0YTogYXV0aFxuICAgICAgICB9O1xuICAgICAgICBleHRyYURhdGEgPSAocmVmMSA9IHNlbGYuX2NvbmZpZy5vbkxvZ2dlZEluKSAhPSBudWxsID8gcmVmMS5jYWxsKHRoaXMpIDogdm9pZCAwO1xuICAgICAgICBpZiAoZXh0cmFEYXRhICE9IG51bGwpIHtcbiAgICAgICAgICBfLmV4dGVuZChyZXNwb25zZS5kYXRhLCB7XG4gICAgICAgICAgICBleHRyYTogZXh0cmFEYXRhXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGxvZ291dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGF1dGhUb2tlbiwgZXh0cmFEYXRhLCBoYXNoZWRUb2tlbiwgaW5kZXgsIHJlZiwgcmVzcG9uc2UsIHRva2VuRmllbGROYW1lLCB0b2tlbkxvY2F0aW9uLCB0b2tlblBhdGgsIHRva2VuUmVtb3ZhbFF1ZXJ5LCB0b2tlblRvUmVtb3ZlO1xuICAgICAgYXV0aFRva2VuID0gdGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ3gtYXV0aC10b2tlbiddO1xuICAgICAgaGFzaGVkVG9rZW4gPSBBY2NvdW50cy5faGFzaExvZ2luVG9rZW4oYXV0aFRva2VuKTtcbiAgICAgIHRva2VuTG9jYXRpb24gPSBzZWxmLl9jb25maWcuYXV0aC50b2tlbjtcbiAgICAgIGluZGV4ID0gdG9rZW5Mb2NhdGlvbi5sYXN0SW5kZXhPZignLicpO1xuICAgICAgdG9rZW5QYXRoID0gdG9rZW5Mb2NhdGlvbi5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuICAgICAgdG9rZW5GaWVsZE5hbWUgPSB0b2tlbkxvY2F0aW9uLnN1YnN0cmluZyhpbmRleCArIDEpO1xuICAgICAgdG9rZW5Ub1JlbW92ZSA9IHt9O1xuICAgICAgdG9rZW5Ub1JlbW92ZVt0b2tlbkZpZWxkTmFtZV0gPSBoYXNoZWRUb2tlbjtcbiAgICAgIHRva2VuUmVtb3ZhbFF1ZXJ5ID0ge307XG4gICAgICB0b2tlblJlbW92YWxRdWVyeVt0b2tlblBhdGhdID0gdG9rZW5Ub1JlbW92ZTtcbiAgICAgIE1ldGVvci51c2Vycy51cGRhdGUodGhpcy51c2VyLl9pZCwge1xuICAgICAgICAkcHVsbDogdG9rZW5SZW1vdmFsUXVlcnlcbiAgICAgIH0pO1xuICAgICAgcmVzcG9uc2UgPSB7XG4gICAgICAgIHN0YXR1czogJ3N1Y2Nlc3MnLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgbWVzc2FnZTogJ1lvdVxcJ3ZlIGJlZW4gbG9nZ2VkIG91dCEnXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBleHRyYURhdGEgPSAocmVmID0gc2VsZi5fY29uZmlnLm9uTG9nZ2VkT3V0KSAhPSBudWxsID8gcmVmLmNhbGwodGhpcykgOiB2b2lkIDA7XG4gICAgICBpZiAoZXh0cmFEYXRhICE9IG51bGwpIHtcbiAgICAgICAgXy5leHRlbmQocmVzcG9uc2UuZGF0YSwge1xuICAgICAgICAgIGV4dHJhOiBleHRyYURhdGFcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfTtcblxuICAgIC8qXG4gICAgXHRcdFx0QWRkIGEgbG9nb3V0IGVuZHBvaW50IHRvIHRoZSBBUElcbiAgICBcbiAgICBcdFx0XHRBZnRlciB0aGUgdXNlciBpcyBsb2dnZWQgb3V0LCB0aGUgb25Mb2dnZWRPdXQgaG9vayBpcyBjYWxsZWQgKHNlZSBSZXN0ZnVsbHkuY29uZmlndXJlKCkgZm9yXG4gICAgXHRcdFx0YWRkaW5nIGhvb2spLlxuICAgICAqL1xuICAgIHJldHVybiB0aGlzLmFkZFJvdXRlKCdsb2dvdXQnLCB7XG4gICAgICBhdXRoUmVxdWlyZWQ6IHRydWVcbiAgICB9LCB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJXYXJuaW5nOiBEZWZhdWx0IGxvZ291dCB2aWEgR0VUIHdpbGwgYmUgcmVtb3ZlZCBpbiBSZXN0aXZ1cyB2MS4wLiBVc2UgUE9TVCBpbnN0ZWFkLlwiKTtcbiAgICAgICAgY29uc29sZS53YXJuKFwiICAgIFNlZSBodHRwczovL2dpdGh1Yi5jb20va2FobWFsaS9tZXRlb3ItcmVzdGl2dXMvaXNzdWVzLzEwMFwiKTtcbiAgICAgICAgcmV0dXJuIGxvZ291dC5jYWxsKHRoaXMpO1xuICAgICAgfSxcbiAgICAgIHBvc3Q6IGxvZ291dFxuICAgIH0pO1xuICB9O1xuXG4gIHJldHVybiBPZGF0YVJlc3RpdnVzO1xuXG59KSgpO1xuXG5PZGF0YVJlc3RpdnVzID0gdGhpcy5PZGF0YVJlc3RpdnVzO1xuIiwiTWV0ZW9yLnN0YXJ0dXAgLT5cclxuXHJcblx0Z2V0T2JqZWN0cyA9IChzcGFjZUlkLCB1c2VySWQsIG9iamVjdF9uYW1lcyktPlxyXG5cdFx0ZGF0YSA9IHt9XHJcblx0XHRvYmplY3RfbmFtZXMuc3BsaXQoJywnKS5mb3JFYWNoIChvYmplY3RfbmFtZSktPlxyXG5cdFx0XHRvYmplY3QgPSBnZXRPYmplY3Qoc3BhY2VJZCwgdXNlcklkLCBvYmplY3RfbmFtZSlcclxuXHRcdFx0ZGF0YVtvYmplY3QubmFtZV0gPSBvYmplY3RcclxuXHRcdHJldHVybiBkYXRhO1xyXG5cclxuXHRnZXRPYmplY3QgPSAoc3BhY2VJZCwgdXNlcklkLCBvYmplY3RfbmFtZSktPlxyXG5cdFx0ZGF0YSA9IF8uY2xvbmUoQ3JlYXRvci5PYmplY3RzW0NyZWF0b3IuZ2V0T2JqZWN0TmFtZShDcmVhdG9yLmdldE9iamVjdChvYmplY3RfbmFtZSwgc3BhY2VJZCkpXSlcclxuXHRcdGlmICFkYXRhXHJcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIuaXoOaViOeahGlkICN7b2JqZWN0X25hbWV9XCIpXHJcblxyXG5cdFx0cHNldHNBZG1pbiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInBlcm1pc3Npb25fc2V0XCIpLmZpbmRPbmUoe3NwYWNlOiBzcGFjZUlkLCBuYW1lOiAnYWRtaW4nfSwge2ZpZWxkczp7X2lkOjEsIGFzc2lnbmVkX2FwcHM6MX19KVxyXG5cdFx0cHNldHNVc2VyID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwicGVybWlzc2lvbl9zZXRcIikuZmluZE9uZSh7c3BhY2U6IHNwYWNlSWQsIG5hbWU6ICd1c2VyJ30sIHtmaWVsZHM6e19pZDoxLCBhc3NpZ25lZF9hcHBzOjF9fSlcclxuXHRcdHBzZXRzQ3VycmVudCA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInBlcm1pc3Npb25fc2V0XCIpLmZpbmQoe3VzZXJzOiB1c2VySWQsIHNwYWNlOiBzcGFjZUlkfSwge2ZpZWxkczp7X2lkOjEsIGFzc2lnbmVkX2FwcHM6MX19KS5mZXRjaCgpXHJcblx0XHRwc2V0cyA9IHsgcHNldHNBZG1pbiwgcHNldHNVc2VyLCBwc2V0c0N1cnJlbnQgfVxyXG5cclxuXHRcdG9iamVjdF9wZXJtaXNzaW9ucyA9IENyZWF0b3IuZ2V0T2JqZWN0UGVybWlzc2lvbnMuYmluZChwc2V0cykoc3BhY2VJZCwgdXNlcklkLCBvYmplY3RfbmFtZSlcclxuXHJcblx0XHRkZWxldGUgZGF0YS5saXN0X3ZpZXdzXHJcblx0XHRkZWxldGUgZGF0YS5wZXJtaXNzaW9uX3NldFxyXG5cclxuXHRcdGlmIG9iamVjdF9wZXJtaXNzaW9ucy5hbGxvd1JlYWRcclxuXHRcdFx0ZGF0YS5hbGxvd1JlYWQgPSB0cnVlXHJcblx0XHRcdGRhdGEuYWxsb3dFZGl0ID0gb2JqZWN0X3Blcm1pc3Npb25zLmFsbG93RWRpdFxyXG5cdFx0XHRkYXRhLmFsbG93RGVsZXRlID0gb2JqZWN0X3Blcm1pc3Npb25zLmFsbG93RGVsZXRlXHJcblx0XHRcdGRhdGEuYWxsb3dDcmVhdGUgPSBvYmplY3RfcGVybWlzc2lvbnMuYWxsb3dDcmVhdGVcclxuXHRcdFx0ZGF0YS5tb2RpZnlBbGxSZWNvcmRzID0gb2JqZWN0X3Blcm1pc3Npb25zLm1vZGlmeUFsbFJlY29yZHNcclxuXHJcblx0XHRcdGZpZWxkcyA9IHt9XHJcblx0XHRcdF8uZm9yRWFjaCBkYXRhLmZpZWxkcywgKGZpZWxkLCBrZXkpLT5cclxuXHRcdFx0XHRfZmllbGQgPSBfLmNsb25lKGZpZWxkKVxyXG5cclxuXHRcdFx0XHRpZiAhX2ZpZWxkLm5hbWVcclxuXHRcdFx0XHRcdF9maWVsZC5uYW1lID0ga2V5XHJcblxyXG5cdFx0XHRcdCPlsIbkuI3lj6/nvJbovpHnmoTlrZfmrrXorr7nva7kuLpyZWFkb25seSA9IHRydWVcclxuXHRcdFx0XHRpZiAoXy5pbmRleE9mKG9iamVjdF9wZXJtaXNzaW9ucy51bmVkaXRhYmxlX2ZpZWxkcywgX2ZpZWxkLm5hbWUpID4gLTEpXHJcblx0XHRcdFx0XHRfZmllbGQucmVhZG9ubHkgPSB0cnVlXHJcblxyXG5cdFx0XHRcdCPkuI3ov5Tlm57kuI3lj6/op4HlrZfmrrVcclxuXHRcdFx0XHRpZiAoXy5pbmRleE9mKG9iamVjdF9wZXJtaXNzaW9ucy51bnJlYWRhYmxlX2ZpZWxkcywgX2ZpZWxkLm5hbWUpIDwgMClcclxuXHRcdFx0XHRcdGZpZWxkc1trZXldID0gX2ZpZWxkXHJcblxyXG5cdFx0XHRkYXRhLmZpZWxkcyA9IGZpZWxkc1xyXG5cclxuXHRcdGVsc2VcclxuXHRcdFx0ZGF0YS5hbGxvd1JlYWQgPSBmYWxzZVxyXG5cclxuXHRcdHJldHVybiBkYXRhXHJcblxyXG5cdEpzb25Sb3V0ZXMuYWRkICdnZXQnLCBTdGVlZG9zT0RhdGEuQVBJX1BBVEggKyAnL29iamVjdHMvOmlkJywgKHJlcSwgcmVzLCBuZXh0KSAtPlxyXG5cdFx0dHJ5XHJcblx0XHRcdHVzZXJJZCA9IFN0ZWVkb3MuZ2V0VXNlcklkRnJvbUF1dGhUb2tlbihyZXEsIHJlcyk7XHJcblx0XHRcdGlmICF1c2VySWRcclxuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCJObyBwZXJtaXNzaW9uXCIpXHJcblxyXG5cdFx0XHRzcGFjZUlkID0gcmVxLnBhcmFtcz8uc3BhY2VJZFxyXG5cdFx0XHRpZiAhc3BhY2VJZFxyXG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIk1pc3Mgc3BhY2VJZFwiKVxyXG5cclxuXHRcdFx0b2JqZWN0X25hbWUgPSByZXEucGFyYW1zPy5pZFxyXG5cdFx0XHRpZiAhb2JqZWN0X25hbWVcclxuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCJNaXNzIGlkXCIpXHJcblxyXG5cdFx0XHRfb2JqID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwib2JqZWN0c1wiKS5maW5kT25lKHtfaWQ6IG9iamVjdF9uYW1lfSlcclxuXHJcblx0XHRcdGlmIF9vYmogJiYgX29iai5uYW1lXHJcblx0XHRcdFx0b2JqZWN0X25hbWUgPSBfb2JqLm5hbWVcclxuXHJcblx0XHRcdGlmIG9iamVjdF9uYW1lLnNwbGl0KCcsJykubGVuZ3RoID4gMVxyXG5cdFx0XHRcdGRhdGEgPSBnZXRPYmplY3RzKHNwYWNlSWQsIHVzZXJJZCwgb2JqZWN0X25hbWUpXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHRkYXRhID0gZ2V0T2JqZWN0KHNwYWNlSWQsIHVzZXJJZCwgb2JqZWN0X25hbWUpXHJcblxyXG5cdFx0XHRKc29uUm91dGVzLnNlbmRSZXN1bHQgcmVzLCB7XHJcblx0XHRcdFx0Y29kZTogMjAwLFxyXG5cdFx0XHRcdGRhdGE6IGRhdGEgfHwge31cclxuXHRcdFx0fVxyXG5cdFx0Y2F0Y2ggZVxyXG5cdFx0XHRjb25zb2xlLmVycm9yIGUuc3RhY2tcclxuXHRcdFx0SnNvblJvdXRlcy5zZW5kUmVzdWx0IHJlcywge1xyXG5cdFx0XHRcdGNvZGU6IGUuZXJyb3IgfHwgNTAwXHJcblx0XHRcdFx0ZGF0YToge2Vycm9yczogZS5yZWFzb24gfHwgZS5tZXNzYWdlfVxyXG5cdFx0XHR9IiwiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG4gIHZhciBnZXRPYmplY3QsIGdldE9iamVjdHM7XG4gIGdldE9iamVjdHMgPSBmdW5jdGlvbihzcGFjZUlkLCB1c2VySWQsIG9iamVjdF9uYW1lcykge1xuICAgIHZhciBkYXRhO1xuICAgIGRhdGEgPSB7fTtcbiAgICBvYmplY3RfbmFtZXMuc3BsaXQoJywnKS5mb3JFYWNoKGZ1bmN0aW9uKG9iamVjdF9uYW1lKSB7XG4gICAgICB2YXIgb2JqZWN0O1xuICAgICAgb2JqZWN0ID0gZ2V0T2JqZWN0KHNwYWNlSWQsIHVzZXJJZCwgb2JqZWN0X25hbWUpO1xuICAgICAgcmV0dXJuIGRhdGFbb2JqZWN0Lm5hbWVdID0gb2JqZWN0O1xuICAgIH0pO1xuICAgIHJldHVybiBkYXRhO1xuICB9O1xuICBnZXRPYmplY3QgPSBmdW5jdGlvbihzcGFjZUlkLCB1c2VySWQsIG9iamVjdF9uYW1lKSB7XG4gICAgdmFyIGRhdGEsIGZpZWxkcywgb2JqZWN0X3Blcm1pc3Npb25zLCBwc2V0cywgcHNldHNBZG1pbiwgcHNldHNDdXJyZW50LCBwc2V0c1VzZXI7XG4gICAgZGF0YSA9IF8uY2xvbmUoQ3JlYXRvci5PYmplY3RzW0NyZWF0b3IuZ2V0T2JqZWN0TmFtZShDcmVhdG9yLmdldE9iamVjdChvYmplY3RfbmFtZSwgc3BhY2VJZCkpXSk7XG4gICAgaWYgKCFkYXRhKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCLml6DmlYjnmoRpZCBcIiArIG9iamVjdF9uYW1lKTtcbiAgICB9XG4gICAgcHNldHNBZG1pbiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInBlcm1pc3Npb25fc2V0XCIpLmZpbmRPbmUoe1xuICAgICAgc3BhY2U6IHNwYWNlSWQsXG4gICAgICBuYW1lOiAnYWRtaW4nXG4gICAgfSwge1xuICAgICAgZmllbGRzOiB7XG4gICAgICAgIF9pZDogMSxcbiAgICAgICAgYXNzaWduZWRfYXBwczogMVxuICAgICAgfVxuICAgIH0pO1xuICAgIHBzZXRzVXNlciA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInBlcm1pc3Npb25fc2V0XCIpLmZpbmRPbmUoe1xuICAgICAgc3BhY2U6IHNwYWNlSWQsXG4gICAgICBuYW1lOiAndXNlcidcbiAgICB9LCB7XG4gICAgICBmaWVsZHM6IHtcbiAgICAgICAgX2lkOiAxLFxuICAgICAgICBhc3NpZ25lZF9hcHBzOiAxXG4gICAgICB9XG4gICAgfSk7XG4gICAgcHNldHNDdXJyZW50ID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwicGVybWlzc2lvbl9zZXRcIikuZmluZCh7XG4gICAgICB1c2VyczogdXNlcklkLFxuICAgICAgc3BhY2U6IHNwYWNlSWRcbiAgICB9LCB7XG4gICAgICBmaWVsZHM6IHtcbiAgICAgICAgX2lkOiAxLFxuICAgICAgICBhc3NpZ25lZF9hcHBzOiAxXG4gICAgICB9XG4gICAgfSkuZmV0Y2goKTtcbiAgICBwc2V0cyA9IHtcbiAgICAgIHBzZXRzQWRtaW46IHBzZXRzQWRtaW4sXG4gICAgICBwc2V0c1VzZXI6IHBzZXRzVXNlcixcbiAgICAgIHBzZXRzQ3VycmVudDogcHNldHNDdXJyZW50XG4gICAgfTtcbiAgICBvYmplY3RfcGVybWlzc2lvbnMgPSBDcmVhdG9yLmdldE9iamVjdFBlcm1pc3Npb25zLmJpbmQocHNldHMpKHNwYWNlSWQsIHVzZXJJZCwgb2JqZWN0X25hbWUpO1xuICAgIGRlbGV0ZSBkYXRhLmxpc3Rfdmlld3M7XG4gICAgZGVsZXRlIGRhdGEucGVybWlzc2lvbl9zZXQ7XG4gICAgaWYgKG9iamVjdF9wZXJtaXNzaW9ucy5hbGxvd1JlYWQpIHtcbiAgICAgIGRhdGEuYWxsb3dSZWFkID0gdHJ1ZTtcbiAgICAgIGRhdGEuYWxsb3dFZGl0ID0gb2JqZWN0X3Blcm1pc3Npb25zLmFsbG93RWRpdDtcbiAgICAgIGRhdGEuYWxsb3dEZWxldGUgPSBvYmplY3RfcGVybWlzc2lvbnMuYWxsb3dEZWxldGU7XG4gICAgICBkYXRhLmFsbG93Q3JlYXRlID0gb2JqZWN0X3Blcm1pc3Npb25zLmFsbG93Q3JlYXRlO1xuICAgICAgZGF0YS5tb2RpZnlBbGxSZWNvcmRzID0gb2JqZWN0X3Blcm1pc3Npb25zLm1vZGlmeUFsbFJlY29yZHM7XG4gICAgICBmaWVsZHMgPSB7fTtcbiAgICAgIF8uZm9yRWFjaChkYXRhLmZpZWxkcywgZnVuY3Rpb24oZmllbGQsIGtleSkge1xuICAgICAgICB2YXIgX2ZpZWxkO1xuICAgICAgICBfZmllbGQgPSBfLmNsb25lKGZpZWxkKTtcbiAgICAgICAgaWYgKCFfZmllbGQubmFtZSkge1xuICAgICAgICAgIF9maWVsZC5uYW1lID0ga2V5O1xuICAgICAgICB9XG4gICAgICAgIGlmIChfLmluZGV4T2Yob2JqZWN0X3Blcm1pc3Npb25zLnVuZWRpdGFibGVfZmllbGRzLCBfZmllbGQubmFtZSkgPiAtMSkge1xuICAgICAgICAgIF9maWVsZC5yZWFkb25seSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKF8uaW5kZXhPZihvYmplY3RfcGVybWlzc2lvbnMudW5yZWFkYWJsZV9maWVsZHMsIF9maWVsZC5uYW1lKSA8IDApIHtcbiAgICAgICAgICByZXR1cm4gZmllbGRzW2tleV0gPSBfZmllbGQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgZGF0YS5maWVsZHMgPSBmaWVsZHM7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRhdGEuYWxsb3dSZWFkID0gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBkYXRhO1xuICB9O1xuICByZXR1cm4gSnNvblJvdXRlcy5hZGQoJ2dldCcsIFN0ZWVkb3NPRGF0YS5BUElfUEFUSCArICcvb2JqZWN0cy86aWQnLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICAgIHZhciBfb2JqLCBkYXRhLCBlLCBvYmplY3RfbmFtZSwgcmVmLCByZWYxLCBzcGFjZUlkLCB1c2VySWQ7XG4gICAgdHJ5IHtcbiAgICAgIHVzZXJJZCA9IFN0ZWVkb3MuZ2V0VXNlcklkRnJvbUF1dGhUb2tlbihyZXEsIHJlcyk7XG4gICAgICBpZiAoIXVzZXJJZCkge1xuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCJObyBwZXJtaXNzaW9uXCIpO1xuICAgICAgfVxuICAgICAgc3BhY2VJZCA9IChyZWYgPSByZXEucGFyYW1zKSAhPSBudWxsID8gcmVmLnNwYWNlSWQgOiB2b2lkIDA7XG4gICAgICBpZiAoIXNwYWNlSWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwiTWlzcyBzcGFjZUlkXCIpO1xuICAgICAgfVxuICAgICAgb2JqZWN0X25hbWUgPSAocmVmMSA9IHJlcS5wYXJhbXMpICE9IG51bGwgPyByZWYxLmlkIDogdm9pZCAwO1xuICAgICAgaWYgKCFvYmplY3RfbmFtZSkge1xuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCJNaXNzIGlkXCIpO1xuICAgICAgfVxuICAgICAgX29iaiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdHNcIikuZmluZE9uZSh7XG4gICAgICAgIF9pZDogb2JqZWN0X25hbWVcbiAgICAgIH0pO1xuICAgICAgaWYgKF9vYmogJiYgX29iai5uYW1lKSB7XG4gICAgICAgIG9iamVjdF9uYW1lID0gX29iai5uYW1lO1xuICAgICAgfVxuICAgICAgaWYgKG9iamVjdF9uYW1lLnNwbGl0KCcsJykubGVuZ3RoID4gMSkge1xuICAgICAgICBkYXRhID0gZ2V0T2JqZWN0cyhzcGFjZUlkLCB1c2VySWQsIG9iamVjdF9uYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRhdGEgPSBnZXRPYmplY3Qoc3BhY2VJZCwgdXNlcklkLCBvYmplY3RfbmFtZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gSnNvblJvdXRlcy5zZW5kUmVzdWx0KHJlcywge1xuICAgICAgICBjb2RlOiAyMDAsXG4gICAgICAgIGRhdGE6IGRhdGEgfHwge31cbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBlID0gZXJyb3I7XG4gICAgICBjb25zb2xlLmVycm9yKGUuc3RhY2spO1xuICAgICAgcmV0dXJuIEpzb25Sb3V0ZXMuc2VuZFJlc3VsdChyZXMsIHtcbiAgICAgICAgY29kZTogZS5lcnJvciB8fCA1MDAsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBlcnJvcnM6IGUucmVhc29uIHx8IGUubWVzc2FnZVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xufSk7XG4iLCJNZXRlb3Iuc3RhcnR1cCAtPlxyXG5cdE1ldGVvck9EYXRhUm91dGVyID0gcmVxdWlyZSgnQHN0ZWVkb3MvY29yZScpLk1ldGVvck9EYXRhUm91dGVyO1xyXG5cdE9EYXRhUm91dGVyID0gcmVxdWlyZSgnQHN0ZWVkb3MvY29yZScpLk9EYXRhUm91dGVyXHJcblx0ZXhwcmVzcyA9IHJlcXVpcmUoJ2V4cHJlc3MnKTtcclxuXHRhcHAgPSBleHByZXNzKCk7XHJcblx0YXBwLnVzZSgnL2FwaS9vZGF0YS92NCcsIE1ldGVvck9EYXRhUm91dGVyKTtcclxuXHRNZXRlb3JPRGF0YUFQSVY0Um91dGVyID0gcmVxdWlyZSgnQHN0ZWVkb3MvY29yZScpLk1ldGVvck9EYXRhQVBJVjRSb3V0ZXI7XHJcblx0aWYgTWV0ZW9yT0RhdGFBUElWNFJvdXRlclxyXG5cdFx0YXBwLnVzZSgnL2FwaS92NCcsIE1ldGVvck9EYXRhQVBJVjRSb3V0ZXIpXHJcblx0V2ViQXBwLmNvbm5lY3RIYW5kbGVycy51c2UoYXBwKTtcclxuXHRfLmVhY2ggQ3JlYXRvci5zdGVlZG9zU2NoZW1hLmdldERhdGFTb3VyY2VzKCksIChkYXRhc291cmNlLCBuYW1lKS0+XHJcblx0XHRpZihuYW1lICE9ICdkZWZhdWx0JylcclxuXHRcdFx0b3RoZXJBcHAgPSBleHByZXNzKCk7XHJcblx0XHRcdG90aGVyQXBwLnVzZShcIi9hcGkvb2RhdGEvI3tuYW1lfVwiLCBPRGF0YVJvdXRlcik7XHJcblx0XHRcdFdlYkFwcC5jb25uZWN0SGFuZGxlcnMudXNlKG90aGVyQXBwKTtcclxuXHJcbiMgXHRvZGF0YVY0TW9uZ29kYiA9IHJlcXVpcmUgJ29kYXRhLXY0LW1vbmdvZGInXHJcbiMgXHRxdWVyeXN0cmluZyA9IHJlcXVpcmUgJ3F1ZXJ5c3RyaW5nJ1xyXG5cclxuIyBcdGhhbmRsZUVycm9yID0gKGUpLT5cclxuIyBcdFx0Y29uc29sZS5lcnJvciBlLnN0YWNrXHJcbiMgXHRcdGJvZHkgPSB7fVxyXG4jIFx0XHRlcnJvciA9IHt9XHJcbiMgXHRcdGVycm9yWydtZXNzYWdlJ10gPSBlLm1lc3NhZ2VcclxuIyBcdFx0c3RhdHVzQ29kZSA9IDUwMFxyXG4jIFx0XHRpZiBlLmVycm9yIGFuZCBfLmlzTnVtYmVyKGUuZXJyb3IpXHJcbiMgXHRcdFx0c3RhdHVzQ29kZSA9IGUuZXJyb3JcclxuIyBcdFx0ZXJyb3JbJ2NvZGUnXSA9IHN0YXR1c0NvZGVcclxuIyBcdFx0ZXJyb3JbJ2Vycm9yJ10gPSBzdGF0dXNDb2RlXHJcbiMgXHRcdGVycm9yWydkZXRhaWxzJ10gPSBlLmRldGFpbHNcclxuIyBcdFx0ZXJyb3JbJ3JlYXNvbiddID0gZS5yZWFzb25cclxuIyBcdFx0Ym9keVsnZXJyb3InXSA9IGVycm9yXHJcbiMgXHRcdHJldHVybiB7XHJcbiMgXHRcdFx0c3RhdHVzQ29kZTogc3RhdHVzQ29kZVxyXG4jIFx0XHRcdGJvZHk6Ym9keVxyXG4jIFx0XHR9XHJcblxyXG4jIFx0dmlzaXRvclBhcnNlciA9ICh2aXNpdG9yKS0+XHJcbiMgXHRcdHBhcnNlZE9wdCA9IHt9XHJcbiMgXHRcdGlmIHZpc2l0b3IucHJvamVjdGlvblxyXG4jIFx0XHRcdHBhcnNlZE9wdC5maWVsZHMgPSB2aXNpdG9yLnByb2plY3Rpb25cclxuIyBcdFx0aWYgdmlzaXRvci5oYXNPd25Qcm9wZXJ0eSgnbGltaXQnKVxyXG4jIFx0XHRcdHBhcnNlZE9wdC5saW1pdCA9IHZpc2l0b3IubGltaXRcclxuXHJcbiMgXHRcdGlmIHZpc2l0b3IuaGFzT3duUHJvcGVydHkoJ3NraXAnKVxyXG4jIFx0XHRcdHBhcnNlZE9wdC5za2lwID0gdmlzaXRvci5za2lwXHJcblxyXG4jIFx0XHRpZiB2aXNpdG9yLnNvcnRcclxuIyBcdFx0XHRwYXJzZWRPcHQuc29ydCA9IHZpc2l0b3Iuc29ydFxyXG5cclxuIyBcdFx0cGFyc2VkT3B0XHJcbiMgXHRkZWFsV2l0aEV4cGFuZCA9IChjcmVhdGVRdWVyeSwgZW50aXRpZXMsIGtleSwgc3BhY2VJZCktPlxyXG4jIFx0XHRpZiBfLmlzRW1wdHkgY3JlYXRlUXVlcnkuaW5jbHVkZXNcclxuIyBcdFx0XHRyZXR1cm5cclxuXHJcbiMgXHRcdG9iaiA9IENyZWF0b3IuZ2V0T2JqZWN0KGtleSwgc3BhY2VJZClcclxuIyBcdFx0Xy5lYWNoIGNyZWF0ZVF1ZXJ5LmluY2x1ZGVzLCAoaW5jbHVkZSktPlxyXG4jIFx0XHRcdCMgY29uc29sZS5sb2cgJ2luY2x1ZGU6ICcsIGluY2x1ZGVcclxuIyBcdFx0XHRuYXZpZ2F0aW9uUHJvcGVydHkgPSBpbmNsdWRlLm5hdmlnYXRpb25Qcm9wZXJ0eVxyXG4jIFx0XHRcdCMgY29uc29sZS5sb2cgJ25hdmlnYXRpb25Qcm9wZXJ0eTogJywgbmF2aWdhdGlvblByb3BlcnR5XHJcbiMgXHRcdFx0ZmllbGQgPSBvYmouZmllbGRzW25hdmlnYXRpb25Qcm9wZXJ0eV1cclxuIyBcdFx0XHRpZiBmaWVsZCBhbmQgKGZpZWxkLnR5cGUgaXMgJ2xvb2t1cCcgb3IgZmllbGQudHlwZSBpcyAnbWFzdGVyX2RldGFpbCcpXHJcbiMgXHRcdFx0XHRpZiBfLmlzRnVuY3Rpb24oZmllbGQucmVmZXJlbmNlX3RvKVxyXG4jIFx0XHRcdFx0XHRmaWVsZC5yZWZlcmVuY2VfdG8gPSBmaWVsZC5yZWZlcmVuY2VfdG8oKVxyXG4jIFx0XHRcdFx0aWYgZmllbGQucmVmZXJlbmNlX3RvXHJcbiMgXHRcdFx0XHRcdHF1ZXJ5T3B0aW9ucyA9IHZpc2l0b3JQYXJzZXIoaW5jbHVkZSlcclxuIyBcdFx0XHRcdFx0aWYgXy5pc1N0cmluZyBmaWVsZC5yZWZlcmVuY2VfdG9cclxuIyBcdFx0XHRcdFx0XHRyZWZlcmVuY2VUb0NvbGxlY3Rpb24gPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oZmllbGQucmVmZXJlbmNlX3RvLCBzcGFjZUlkKVxyXG4jIFx0XHRcdFx0XHRcdF9yb19OQU1FX0ZJRUxEX0tFWSA9IENyZWF0b3IuZ2V0T2JqZWN0KGZpZWxkLnJlZmVyZW5jZV90bywgc3BhY2VJZCk/Lk5BTUVfRklFTERfS0VZXHJcbiMgXHRcdFx0XHRcdFx0Xy5lYWNoIGVudGl0aWVzLCAoZW50aXR5LCBpZHgpLT5cclxuIyBcdFx0XHRcdFx0XHRcdGlmIGVudGl0eVtuYXZpZ2F0aW9uUHJvcGVydHldXHJcbiMgXHRcdFx0XHRcdFx0XHRcdGlmIGZpZWxkLm11bHRpcGxlXHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0b3JpZ2luYWxEYXRhID0gXy5jbG9uZShlbnRpdHlbbmF2aWdhdGlvblByb3BlcnR5XSlcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRtdWx0aVF1ZXJ5ID0gXy5leHRlbmQge19pZDogeyRpbjogZW50aXR5W25hdmlnYXRpb25Qcm9wZXJ0eV19fSwgaW5jbHVkZS5xdWVyeVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGVudGl0aWVzW2lkeF1bbmF2aWdhdGlvblByb3BlcnR5XSA9IHJlZmVyZW5jZVRvQ29sbGVjdGlvbi5maW5kKG11bHRpUXVlcnksIHF1ZXJ5T3B0aW9ucykuZmV0Y2goKVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGlmICFlbnRpdGllc1tpZHhdW25hdmlnYXRpb25Qcm9wZXJ0eV0ubGVuZ3RoXHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRlbnRpdGllc1tpZHhdW25hdmlnYXRpb25Qcm9wZXJ0eV0gPSBvcmlnaW5hbERhdGFcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHQj5o6S5bqPXHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0ZW50aXRpZXNbaWR4XVtuYXZpZ2F0aW9uUHJvcGVydHldID0gQ3JlYXRvci5nZXRPcmRlcmx5U2V0QnlJZHMoZW50aXRpZXNbaWR4XVtuYXZpZ2F0aW9uUHJvcGVydHldLCBvcmlnaW5hbERhdGEpXHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0ZW50aXRpZXNbaWR4XVtuYXZpZ2F0aW9uUHJvcGVydHldID0gXy5tYXAgZW50aXRpZXNbaWR4XVtuYXZpZ2F0aW9uUHJvcGVydHldLCAobyktPlxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0b1sncmVmZXJlbmNlX3RvLm8nXSA9IHJlZmVyZW5jZVRvQ29sbGVjdGlvbi5fbmFtZVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0b1sncmVmZXJlbmNlX3RvLl9vJ10gPSBmaWVsZC5yZWZlcmVuY2VfdG9cclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdG9bJ19OQU1FX0ZJRUxEX1ZBTFVFJ10gPSBvW19yb19OQU1FX0ZJRUxEX0tFWV1cclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBvXHJcbiMgXHRcdFx0XHRcdFx0XHRcdGVsc2VcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRzaW5nbGVRdWVyeSA9IF8uZXh0ZW5kIHtfaWQ6IGVudGl0eVtuYXZpZ2F0aW9uUHJvcGVydHldfSwgaW5jbHVkZS5xdWVyeVxyXG5cclxuIyBcdFx0XHRcdFx0XHRcdFx0XHQjIOeJueauiuWkhOeQhuWcqOebuOWFs+ihqOS4reayoeacieaJvuWIsOaVsOaNrueahOaDheWGte+8jOi/lOWbnuWOn+aVsOaNrlxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGVudGl0aWVzW2lkeF1bbmF2aWdhdGlvblByb3BlcnR5XSA9IHJlZmVyZW5jZVRvQ29sbGVjdGlvbi5maW5kT25lKHNpbmdsZVF1ZXJ5LCBxdWVyeU9wdGlvbnMpIHx8IGVudGl0aWVzW2lkeF1bbmF2aWdhdGlvblByb3BlcnR5XVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGlmIGVudGl0aWVzW2lkeF1bbmF2aWdhdGlvblByb3BlcnR5XVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0ZW50aXRpZXNbaWR4XVtuYXZpZ2F0aW9uUHJvcGVydHldWydyZWZlcmVuY2VfdG8ubyddID0gcmVmZXJlbmNlVG9Db2xsZWN0aW9uLl9uYW1lXHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRlbnRpdGllc1tpZHhdW25hdmlnYXRpb25Qcm9wZXJ0eV1bJ3JlZmVyZW5jZV90by5fbyddID0gZmllbGQucmVmZXJlbmNlX3RvXHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRlbnRpdGllc1tpZHhdW25hdmlnYXRpb25Qcm9wZXJ0eV1bJ19OQU1FX0ZJRUxEX1ZBTFVFJ10gPSBlbnRpdGllc1tpZHhdW25hdmlnYXRpb25Qcm9wZXJ0eV1bX3JvX05BTUVfRklFTERfS0VZXVxyXG4jIFx0XHRcdFx0XHRpZiBfLmlzQXJyYXkgZmllbGQucmVmZXJlbmNlX3RvXHJcbiMgXHRcdFx0XHRcdFx0Xy5lYWNoIGVudGl0aWVzLCAoZW50aXR5LCBpZHgpLT5cclxuIyBcdFx0XHRcdFx0XHRcdGlmIGVudGl0eVtuYXZpZ2F0aW9uUHJvcGVydHldPy5pZHNcclxuIyBcdFx0XHRcdFx0XHRcdFx0X28gPSBlbnRpdHlbbmF2aWdhdGlvblByb3BlcnR5XS5vXHJcbiMgXHRcdFx0XHRcdFx0XHRcdF9yb19OQU1FX0ZJRUxEX0tFWSA9IENyZWF0b3IuZ2V0T2JqZWN0KF9vLCBzcGFjZUlkKT8uTkFNRV9GSUVMRF9LRVlcclxuIyBcdFx0XHRcdFx0XHRcdFx0aWYgcXVlcnlPcHRpb25zPy5maWVsZHMgJiYgX3JvX05BTUVfRklFTERfS0VZXHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0cXVlcnlPcHRpb25zLmZpZWxkc1tfcm9fTkFNRV9GSUVMRF9LRVldID0gMVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRyZWZlcmVuY2VUb0NvbGxlY3Rpb24gPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oZW50aXR5W25hdmlnYXRpb25Qcm9wZXJ0eV0ubywgc3BhY2VJZClcclxuIyBcdFx0XHRcdFx0XHRcdFx0aWYgcmVmZXJlbmNlVG9Db2xsZWN0aW9uXHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0aWYgZmllbGQubXVsdGlwbGVcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdF9pZHMgPSBfLmNsb25lKGVudGl0eVtuYXZpZ2F0aW9uUHJvcGVydHldLmlkcylcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdG11bHRpUXVlcnkgPSBfLmV4dGVuZCB7X2lkOiB7JGluOiBlbnRpdHlbbmF2aWdhdGlvblByb3BlcnR5XS5pZHN9fSwgaW5jbHVkZS5xdWVyeVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0ZW50aXRpZXNbaWR4XVtuYXZpZ2F0aW9uUHJvcGVydHldID0gXy5tYXAgcmVmZXJlbmNlVG9Db2xsZWN0aW9uLmZpbmQobXVsdGlRdWVyeSwgcXVlcnlPcHRpb25zKS5mZXRjaCgpLCAobyktPlxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRvWydyZWZlcmVuY2VfdG8ubyddID0gcmVmZXJlbmNlVG9Db2xsZWN0aW9uLl9uYW1lXHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRcdG9bJ3JlZmVyZW5jZV90by5fbyddID0gX29cclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdFx0b1snX05BTUVfRklFTERfVkFMVUUnXSA9IG9bX3JvX05BTUVfRklFTERfS0VZXVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gb1xyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0I+aOkuW6j1xyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0ZW50aXRpZXNbaWR4XVtuYXZpZ2F0aW9uUHJvcGVydHldID0gQ3JlYXRvci5nZXRPcmRlcmx5U2V0QnlJZHMoZW50aXRpZXNbaWR4XVtuYXZpZ2F0aW9uUHJvcGVydHldLCBfaWRzKVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGVsc2VcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdHNpbmdsZVF1ZXJ5ID0gXy5leHRlbmQge19pZDogZW50aXR5W25hdmlnYXRpb25Qcm9wZXJ0eV0uaWRzWzBdfSwgaW5jbHVkZS5xdWVyeVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0ZW50aXRpZXNbaWR4XVtuYXZpZ2F0aW9uUHJvcGVydHldID0gcmVmZXJlbmNlVG9Db2xsZWN0aW9uLmZpbmRPbmUoc2luZ2xlUXVlcnksIHF1ZXJ5T3B0aW9ucylcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdGlmIGVudGl0aWVzW2lkeF1bbmF2aWdhdGlvblByb3BlcnR5XVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRlbnRpdGllc1tpZHhdW25hdmlnYXRpb25Qcm9wZXJ0eV1bJ3JlZmVyZW5jZV90by5vJ10gPSByZWZlcmVuY2VUb0NvbGxlY3Rpb24uX25hbWVcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZW50aXRpZXNbaWR4XVtuYXZpZ2F0aW9uUHJvcGVydHldWydyZWZlcmVuY2VfdG8uX28nXSA9IF9vXHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGVudGl0aWVzW2lkeF1bbmF2aWdhdGlvblByb3BlcnR5XVsnX05BTUVfRklFTERfVkFMVUUnXSA9IGVudGl0aWVzW2lkeF1bbmF2aWdhdGlvblByb3BlcnR5XVtfcm9fTkFNRV9GSUVMRF9LRVldXHJcblxyXG4jIFx0XHRcdFx0ZWxzZVxyXG4jIFx0XHRcdFx0IyBUT0RPXHJcblxyXG5cclxuIyBcdFx0cmV0dXJuXHJcblxyXG4jIFx0c2V0T2RhdGFQcm9wZXJ0eT0oZW50aXRpZXMsc3BhY2Usa2V5KS0+XHJcbiMgXHRcdGVudGl0aWVzX09kYXRhUHJvcGVydGllcyA9IFtdXHJcbiMgXHRcdF8uZWFjaCBlbnRpdGllcywgKGVudGl0eSwgaWR4KS0+XHJcbiMgXHRcdFx0ZW50aXR5X09kYXRhUHJvcGVydGllcyA9IHt9XHJcbiMgXHRcdFx0aWQgPSBlbnRpdGllc1tpZHhdW1wiX2lkXCJdXHJcbiMgXHRcdFx0ZW50aXR5X09kYXRhUHJvcGVydGllc1snQG9kYXRhLmlkJ10gPSBTdGVlZG9zT0RhdGEuZ2V0T0RhdGFOZXh0TGlua1BhdGgoc3BhY2Usa2V5KSsgJyhcXCcnICsgXCIje2lkfVwiICsgJ1xcJyknXHJcbiMgXHRcdFx0ZW50aXR5X09kYXRhUHJvcGVydGllc1snQG9kYXRhLmV0YWcnXSA9IFwiVy9cXFwiMDhENTg5NzIwQkJCM0RCMVxcXCJcIlxyXG4jIFx0XHRcdGVudGl0eV9PZGF0YVByb3BlcnRpZXNbJ0BvZGF0YS5lZGl0TGluayddID0gZW50aXR5X09kYXRhUHJvcGVydGllc1snQG9kYXRhLmlkJ11cclxuIyBcdFx0XHRfLmV4dGVuZCBlbnRpdHlfT2RhdGFQcm9wZXJ0aWVzLGVudGl0eVxyXG4jIFx0XHRcdGVudGl0aWVzX09kYXRhUHJvcGVydGllcy5wdXNoIGVudGl0eV9PZGF0YVByb3BlcnRpZXNcclxuIyBcdFx0cmV0dXJuIGVudGl0aWVzX09kYXRhUHJvcGVydGllc1xyXG5cclxuIyBcdHNldEVycm9yTWVzc2FnZSA9IChzdGF0dXNDb2RlLGNvbGxlY3Rpb24sa2V5LGFjdGlvbiktPlxyXG4jIFx0XHRib2R5ID0ge31cclxuIyBcdFx0ZXJyb3IgPSB7fVxyXG4jIFx0XHRpbm5lcmVycm9yID0ge31cclxuIyBcdFx0aWYgc3RhdHVzQ29kZSA9PSA0MDRcclxuIyBcdFx0XHRpZiBjb2xsZWN0aW9uXHJcbiMgXHRcdFx0XHRpZiBhY3Rpb24gPT0gJ3Bvc3QnXHJcbiMgXHRcdFx0XHRcdGlubmVyZXJyb3JbJ21lc3NhZ2UnXSA9IHQoXCJjcmVhdG9yX29kYXRhX3Bvc3RfZmFpbFwiKVxyXG4jIFx0XHRcdFx0XHRpbm5lcmVycm9yWyd0eXBlJ10gPSAnTWljcm9zb2Z0Lk9EYXRhLkNvcmUuVXJpUGFyc2VyLk9EYXRhVW5yZWNvZ25pemVkUGF0aEV4Y2VwdGlvbidcclxuIyBcdFx0XHRcdFx0ZXJyb3JbJ2NvZGUnXSA9IDQwNFxyXG4jIFx0XHRcdFx0XHRlcnJvclsnbWVzc2FnZSddID0gXCJjcmVhdG9yX29kYXRhX3Bvc3RfZmFpbFwiXHJcbiMgXHRcdFx0XHRlbHNlXHJcbiMgXHRcdFx0XHRcdGlubmVyZXJyb3JbJ21lc3NhZ2UnXSA9IHQoXCJjcmVhdG9yX29kYXRhX3JlY29yZF9xdWVyeV9mYWlsXCIpXHJcbiMgXHRcdFx0XHRcdGlubmVyZXJyb3JbJ3R5cGUnXSA9ICdNaWNyb3NvZnQuT0RhdGEuQ29yZS5VcmlQYXJzZXIuT0RhdGFVbnJlY29nbml6ZWRQYXRoRXhjZXB0aW9uJ1xyXG4jIFx0XHRcdFx0XHRlcnJvclsnY29kZSddID0gNDA0XHJcbiMgXHRcdFx0XHRcdGVycm9yWydtZXNzYWdlJ10gPSBcImNyZWF0b3Jfb2RhdGFfcmVjb3JkX3F1ZXJ5X2ZhaWxcIlxyXG4jIFx0XHRcdGVsc2VcclxuIyBcdFx0XHRcdGlubmVyZXJyb3JbJ21lc3NhZ2UnXSA9IHQoXCJjcmVhdG9yX29kYXRhX2NvbGxlY3Rpb25fcXVlcnlfZmFpbFwiKSsga2V5XHJcbiMgXHRcdFx0XHRpbm5lcmVycm9yWyd0eXBlJ10gPSAnTWljcm9zb2Z0Lk9EYXRhLkNvcmUuVXJpUGFyc2VyLk9EYXRhVW5yZWNvZ25pemVkUGF0aEV4Y2VwdGlvbidcclxuIyBcdFx0XHRcdGVycm9yWydjb2RlJ10gPSA0MDRcclxuIyBcdFx0XHRcdGVycm9yWydtZXNzYWdlJ10gPSBcImNyZWF0b3Jfb2RhdGFfY29sbGVjdGlvbl9xdWVyeV9mYWlsXCJcclxuIyBcdFx0aWYgIHN0YXR1c0NvZGUgPT0gNDAxXHJcbiMgXHRcdFx0aW5uZXJlcnJvclsnbWVzc2FnZSddID0gdChcImNyZWF0b3Jfb2RhdGFfYXV0aGVudGljYXRpb25fcmVxdWlyZWRcIilcclxuIyBcdFx0XHRpbm5lcmVycm9yWyd0eXBlJ10gPSAnTWljcm9zb2Z0Lk9EYXRhLkNvcmUuVXJpUGFyc2VyLk9EYXRhVW5yZWNvZ25pemVkUGF0aEV4Y2VwdGlvbidcclxuIyBcdFx0XHRlcnJvclsnY29kZSddID0gNDAxXHJcbiMgXHRcdFx0ZXJyb3JbJ21lc3NhZ2UnXSA9IFwiY3JlYXRvcl9vZGF0YV9hdXRoZW50aWNhdGlvbl9yZXF1aXJlZFwiXHJcbiMgXHRcdGlmIHN0YXR1c0NvZGUgPT0gNDAzXHJcbiMgXHRcdFx0c3dpdGNoIGFjdGlvblxyXG4jIFx0XHRcdFx0d2hlbiAnZ2V0JyB0aGVuIGlubmVyZXJyb3JbJ21lc3NhZ2UnXSA9IHQoXCJjcmVhdG9yX29kYXRhX3VzZXJfYWNjZXNzX2ZhaWxcIilcclxuIyBcdFx0XHRcdHdoZW4gJ3Bvc3QnIHRoZW4gaW5uZXJlcnJvclsnbWVzc2FnZSddID0gdChcImNyZWF0b3Jfb2RhdGFfdXNlcl9jcmVhdGVfZmFpbFwiKVxyXG4jIFx0XHRcdFx0d2hlbiAncHV0JyB0aGVuIGlubmVyZXJyb3JbJ21lc3NhZ2UnXSA9IHQoXCJjcmVhdG9yX29kYXRhX3VzZXJfdXBkYXRlX2ZhaWxcIilcclxuIyBcdFx0XHRcdHdoZW4gJ2RlbGV0ZScgdGhlbiBpbm5lcmVycm9yWydtZXNzYWdlJ10gPSB0KFwiY3JlYXRvcl9vZGF0YV91c2VyX3JlbW92ZV9mYWlsXCIpXHJcbiMgXHRcdFx0aW5uZXJlcnJvclsnbWVzc2FnZSddID0gdChcImNyZWF0b3Jfb2RhdGFfdXNlcl9hY2Nlc3NfZmFpbFwiKVxyXG4jIFx0XHRcdGlubmVyZXJyb3JbJ3R5cGUnXSA9ICdNaWNyb3NvZnQuT0RhdGEuQ29yZS5VcmlQYXJzZXIuT0RhdGFVbnJlY29nbml6ZWRQYXRoRXhjZXB0aW9uJ1xyXG4jIFx0XHRcdGVycm9yWydjb2RlJ10gPSA0MDNcclxuIyBcdFx0XHRlcnJvclsnbWVzc2FnZSddID0gXCJjcmVhdG9yX29kYXRhX3VzZXJfYWNjZXNzX2ZhaWxcIlxyXG4jIFx0XHRlcnJvclsnaW5uZXJlcnJvciddID0gaW5uZXJlcnJvclxyXG4jIFx0XHRib2R5WydlcnJvciddID0gZXJyb3JcclxuIyBcdFx0cmV0dXJuIGJvZHlcclxuXHJcbiMgXHRyZW1vdmVJbnZhbGlkTWV0aG9kID0gKHF1ZXJ5UGFyYW1zKS0+XHJcbiMgXHRcdGlmIHF1ZXJ5UGFyYW1zLiRmaWx0ZXIgJiYgcXVlcnlQYXJhbXMuJGZpbHRlci5pbmRleE9mKCd0b2xvd2VyKCcpID4gLTFcclxuIyBcdFx0XHRyZW1vdmVNZXRob2QgPSAoJDEpLT5cclxuIyBcdFx0XHRcdHJldHVybiAkMS5yZXBsYWNlKCd0b2xvd2VyKCcsICcnKS5yZXBsYWNlKCcpJywgJycpXHJcbiMgXHRcdFx0cXVlcnlQYXJhbXMuJGZpbHRlciA9IHF1ZXJ5UGFyYW1zLiRmaWx0ZXIucmVwbGFjZSgvdG9sb3dlclxcKChbXlxcKV0rKVxcKS9nLCByZW1vdmVNZXRob2QpXHJcblxyXG4jIFx0aXNTYW1lQ29tcGFueSA9IChzcGFjZUlkLCB1c2VySWQsIGNvbXBhbnlJZCwgcXVlcnkpLT5cclxuIyBcdFx0c3UgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJzcGFjZV91c2Vyc1wiKS5maW5kT25lKHsgc3BhY2U6IHNwYWNlSWQsIHVzZXI6IHVzZXJJZCB9LCB7IGZpZWxkczogeyBjb21wYW55X2lkOiAxLCBjb21wYW55X2lkczogMSB9IH0pXHJcbiMgXHRcdGlmICFjb21wYW55SWQgJiYgcXVlcnlcclxuIyBcdFx0XHRjb21wYW55SWQgPSBzdS5jb21wYW55X2lkXHJcbiMgXHRcdFx0cXVlcnkuY29tcGFueV9pZCA9IHsgJGluOiBzdS5jb21wYW55X2lkcyB9XHJcbiMgXHRcdHJldHVybiBzdS5jb21wYW55X2lkcy5pbmNsdWRlcyhjb21wYW55SWQpXHJcblxyXG4jIFx0IyDkuI3ov5Tlm57lt7LlgYfliKDpmaTnmoTmlbDmja5cclxuIyBcdGV4Y2x1ZGVEZWxldGVkID0gKHF1ZXJ5KS0+XHJcbiMgXHRcdHF1ZXJ5LmlzX2RlbGV0ZWQgPSB7ICRuZTogdHJ1ZSB9XHJcblxyXG4jIFx0IyDkv67mlLnjgIHliKDpmaTml7bvvIzlpoLmnpwgZG9jLnNwYWNlID0gXCJnbG9iYWxcIu+8jOaKpemUmVxyXG4jIFx0Y2hlY2tHbG9iYWxSZWNvcmQgPSAoY29sbGVjdGlvbiwgaWQsIG9iamVjdCktPlxyXG4jIFx0XHRpZiBvYmplY3QuZW5hYmxlX3NwYWNlX2dsb2JhbCAmJiBjb2xsZWN0aW9uLmZpbmQoeyBfaWQ6IGlkLCBzcGFjZTogJ2dsb2JhbCd9KS5jb3VudCgpXHJcbiMgXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDAsIFwi5LiN6IO95L+u5pS55oiW6ICF5Yig6Zmk5qCH5YeG5a+56LGhXCIpXHJcblxyXG5cclxuIyBcdFN0ZWVkb3NPZGF0YUFQSS5hZGRSb3V0ZSgnOm9iamVjdF9uYW1lJywge2F1dGhSZXF1aXJlZDogdHJ1ZSwgc3BhY2VSZXF1aXJlZDogZmFsc2V9LCB7XHJcbiMgXHRcdGdldDogKCktPlxyXG4jIFx0XHRcdHRyeVxyXG4jIFx0XHRcdFx0a2V5ID0gQHVybFBhcmFtcy5vYmplY3RfbmFtZVxyXG4jIFx0XHRcdFx0c3BhY2VJZCA9IEB1cmxQYXJhbXMuc3BhY2VJZFxyXG4jIFx0XHRcdFx0b2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3Qoa2V5LCBzcGFjZUlkKVxyXG4jIFx0XHRcdFx0aWYgbm90IG9iamVjdD8uZW5hYmxlX2FwaVxyXG4jIFx0XHRcdFx0XHRyZXR1cm4ge1xyXG4jIFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwMVxyXG4jIFx0XHRcdFx0XHRcdGJvZHk6c2V0RXJyb3JNZXNzYWdlKDQwMSlcclxuIyBcdFx0XHRcdFx0fVxyXG4jIFx0XHRcdFx0Y29sbGVjdGlvbiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihrZXksIHNwYWNlSWQpXHJcbiMgXHRcdFx0XHRpZiBub3QgY29sbGVjdGlvblxyXG4jIFx0XHRcdFx0XHRyZXR1cm4ge1xyXG4jIFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxyXG4jIFx0XHRcdFx0XHRcdGJvZHk6c2V0RXJyb3JNZXNzYWdlKDQwNCxjb2xsZWN0aW9uLGtleSlcclxuIyBcdFx0XHRcdFx0fVxyXG5cclxuIyBcdFx0XHRcdHJlbW92ZUludmFsaWRNZXRob2QoQHF1ZXJ5UGFyYW1zKVxyXG4jIFx0XHRcdFx0cXMgPSBkZWNvZGVVUklDb21wb25lbnQocXVlcnlzdHJpbmcuc3RyaW5naWZ5KEBxdWVyeVBhcmFtcykpXHJcbiMgXHRcdFx0XHRjcmVhdGVRdWVyeSA9IGlmIHFzIHRoZW4gb2RhdGFWNE1vbmdvZGIuY3JlYXRlUXVlcnkocXMpIGVsc2Ugb2RhdGFWNE1vbmdvZGIuY3JlYXRlUXVlcnkoKVxyXG4jIFx0XHRcdFx0cGVybWlzc2lvbnMgPSBDcmVhdG9yLmdldE9iamVjdFBlcm1pc3Npb25zKHNwYWNlSWQsIEB1c2VySWQsIGtleSlcclxuIyBcdFx0XHRcdGlmIHBlcm1pc3Npb25zLnZpZXdBbGxSZWNvcmRzIG9yIChwZXJtaXNzaW9ucy52aWV3Q29tcGFueVJlY29yZHMgJiYgaXNTYW1lQ29tcGFueShzcGFjZUlkLCBAdXNlcklkLCBjcmVhdGVRdWVyeS5xdWVyeS5jb21wYW55X2lkLCBjcmVhdGVRdWVyeS5xdWVyeSkpIG9yIChwZXJtaXNzaW9ucy5hbGxvd1JlYWQgYW5kIEB1c2VySWQpXHJcblxyXG4jIFx0XHRcdFx0XHRpZiBrZXkgaXMgJ2Nmcy5maWxlcy5maWxlcmVjb3JkJ1xyXG4jIFx0XHRcdFx0XHRcdGNyZWF0ZVF1ZXJ5LnF1ZXJ5WydtZXRhZGF0YS5zcGFjZSddID0gc3BhY2VJZFxyXG4jIFx0XHRcdFx0XHRlbHNlIGlmIGtleSBpcyAnc3BhY2VzJ1xyXG4jIFx0XHRcdFx0XHRcdGlmIHNwYWNlSWQgaXNudCAnZ3Vlc3QnXHJcbiMgXHRcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5xdWVyeS5faWQgPSBzcGFjZUlkXHJcbiMgXHRcdFx0XHRcdGVsc2VcclxuIyBcdFx0XHRcdFx0XHRpZiBzcGFjZUlkIGlzbnQgJ2d1ZXN0JyBhbmQga2V5ICE9IFwidXNlcnNcIiBhbmQgY3JlYXRlUXVlcnkucXVlcnkuc3BhY2UgaXNudCAnZ2xvYmFsJ1xyXG4jIFx0XHRcdFx0XHRcdFx0Y3JlYXRlUXVlcnkucXVlcnkuc3BhY2UgPSBzcGFjZUlkXHJcblxyXG4jIFx0XHRcdFx0XHRpZiBDcmVhdG9yLmlzQ29tbW9uU3BhY2Uoc3BhY2VJZClcclxuIyBcdFx0XHRcdFx0XHRpZiBDcmVhdG9yLmlzU3BhY2VBZG1pbihzcGFjZUlkLCBAdXNlcklkKVxyXG4jIFx0XHRcdFx0XHRcdFx0aWYga2V5IGlzICdzcGFjZXMnXHJcbiMgXHRcdFx0XHRcdFx0XHRcdGRlbGV0ZSBjcmVhdGVRdWVyeS5xdWVyeS5faWRcclxuIyBcdFx0XHRcdFx0XHRcdGVsc2VcclxuIyBcdFx0XHRcdFx0XHRcdFx0ZGVsZXRlIGNyZWF0ZVF1ZXJ5LnF1ZXJ5LnNwYWNlXHJcbiMgXHRcdFx0XHRcdFx0ZWxzZVxyXG4jIFx0XHRcdFx0XHRcdFx0dXNlcl9zcGFjZXMgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJzcGFjZV91c2Vyc1wiKS5maW5kKHt1c2VyOiBAdXNlcklkfSwge2ZpZWxkczoge3NwYWNlOiAxfX0pLmZldGNoKClcclxuIyBcdFx0XHRcdFx0XHRcdGlmIGtleSBpcyAnc3BhY2VzJ1xyXG4jIFx0XHRcdFx0XHRcdFx0XHQjIHNwYWNlIOWvueaJgOacieeUqOaIt+iusOW9leS4uuWPquivu1xyXG4jIFx0XHRcdFx0XHRcdFx0XHRkZWxldGUgY3JlYXRlUXVlcnkucXVlcnkuX2lkXHJcbiMgXHRcdFx0XHRcdFx0XHRcdCMgY3JlYXRlUXVlcnkucXVlcnkuX2lkID0geyRpbjogXy5wbHVjayh1c2VyX3NwYWNlcywgJ3NwYWNlJyl9XHJcbiMgXHRcdFx0XHRcdFx0XHRlbHNlXHJcbiMgXHRcdFx0XHRcdFx0XHRcdGNyZWF0ZVF1ZXJ5LnF1ZXJ5LnNwYWNlID0geyRpbjogXy5wbHVjayh1c2VyX3NwYWNlcywgJ3NwYWNlJyl9XHJcblxyXG4jIFx0XHRcdFx0XHRpZiBub3QgY3JlYXRlUXVlcnkuc29ydCBvciAhXy5zaXplKGNyZWF0ZVF1ZXJ5LnNvcnQpXHJcbiMgXHRcdFx0XHRcdFx0Y3JlYXRlUXVlcnkuc29ydCA9IHsgbW9kaWZpZWQ6IC0xIH1cclxuIyBcdFx0XHRcdFx0aXNfZW50ZXJwcmlzZSA9IFN0ZWVkb3MuaXNMZWdhbFZlcnNpb24oc3BhY2VJZCxcIndvcmtmbG93LmVudGVycHJpc2VcIilcclxuIyBcdFx0XHRcdFx0aXNfcHJvZmVzc2lvbmFsID0gU3RlZWRvcy5pc0xlZ2FsVmVyc2lvbihzcGFjZUlkLFwid29ya2Zsb3cucHJvZmVzc2lvbmFsXCIpXHJcbiMgXHRcdFx0XHRcdGlzX3N0YW5kYXJkID0gU3RlZWRvcy5pc0xlZ2FsVmVyc2lvbihzcGFjZUlkLFwid29ya2Zsb3cuc3RhbmRhcmRcIilcclxuIyBcdFx0XHRcdFx0aWYgY3JlYXRlUXVlcnkubGltaXRcclxuIyBcdFx0XHRcdFx0XHRsaW1pdCA9IGNyZWF0ZVF1ZXJ5LmxpbWl0XHJcbiMgXHRcdFx0XHRcdFx0aWYgaXNfZW50ZXJwcmlzZSBhbmQgbGltaXQ+MTAwMDAwXHJcbiMgXHRcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5saW1pdCA9IDEwMDAwMFxyXG4jIFx0XHRcdFx0XHRcdGVsc2UgaWYgaXNfcHJvZmVzc2lvbmFsIGFuZCBsaW1pdD4xMDAwMCBhbmQgIWlzX2VudGVycHJpc2VcclxuIyBcdFx0XHRcdFx0XHRcdGNyZWF0ZVF1ZXJ5LmxpbWl0ID0gMTAwMDBcclxuIyBcdFx0XHRcdFx0XHRlbHNlIGlmIGlzX3N0YW5kYXJkIGFuZCBsaW1pdD4xMDAwIGFuZCAhaXNfcHJvZmVzc2lvbmFsIGFuZCAhaXNfZW50ZXJwcmlzZVxyXG4jIFx0XHRcdFx0XHRcdFx0Y3JlYXRlUXVlcnkubGltaXQgPSAxMDAwXHJcbiMgXHRcdFx0XHRcdGVsc2VcclxuIyBcdFx0XHRcdFx0XHRpZiBpc19lbnRlcnByaXNlXHJcbiMgXHRcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5saW1pdCA9IDEwMDAwMFxyXG4jIFx0XHRcdFx0XHRcdGVsc2UgaWYgaXNfcHJvZmVzc2lvbmFsIGFuZCAhaXNfZW50ZXJwcmlzZVxyXG4jIFx0XHRcdFx0XHRcdFx0Y3JlYXRlUXVlcnkubGltaXQgPSAxMDAwMFxyXG4jIFx0XHRcdFx0XHRcdGVsc2UgaWYgaXNfc3RhbmRhcmQgYW5kICFpc19lbnRlcnByaXNlIGFuZCAhaXNfcHJvZmVzc2lvbmFsXHJcbiMgXHRcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5saW1pdCA9IDEwMDBcclxuIyBcdFx0XHRcdFx0dW5yZWFkYWJsZV9maWVsZHMgPSBwZXJtaXNzaW9ucy51bnJlYWRhYmxlX2ZpZWxkcyB8fCBbXVxyXG4jIFx0XHRcdFx0XHRpZiBjcmVhdGVRdWVyeS5wcm9qZWN0aW9uXHJcbiMgXHRcdFx0XHRcdFx0cHJvamVjdGlvbiA9IHt9XHJcbiMgXHRcdFx0XHRcdFx0Xy5rZXlzKGNyZWF0ZVF1ZXJ5LnByb2plY3Rpb24pLmZvckVhY2ggKGtleSktPlxyXG4jIFx0XHRcdFx0XHRcdFx0aWYgXy5pbmRleE9mKHVucmVhZGFibGVfZmllbGRzLCBrZXkpIDwgMFxyXG4jIFx0XHRcdFx0XHRcdFx0XHQjaWYgbm90ICgoZmllbGRzW2tleV0/LnR5cGUgPT0gJ2xvb2t1cCcgb3IgZmllbGRzW2tleV0/LnR5cGUgPT0gJ21hc3Rlcl9kZXRhaWwnKSBhbmQgZmllbGRzW2tleV0ubXVsdGlwbGUpXHJcbiMgXHRcdFx0XHRcdFx0XHRcdHByb2plY3Rpb25ba2V5XSA9IDFcclxuIyBcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5wcm9qZWN0aW9uID0gcHJvamVjdGlvblxyXG4jIFx0XHRcdFx0XHRpZiBub3QgY3JlYXRlUXVlcnkucHJvamVjdGlvbiBvciAhXy5zaXplKGNyZWF0ZVF1ZXJ5LnByb2plY3Rpb24pXHJcbiMgXHRcdFx0XHRcdFx0cmVhZGFibGVfZmllbGRzID0gQ3JlYXRvci5nZXRGaWVsZHMoa2V5LCBzcGFjZUlkLCBAdXNlcklkKVxyXG4jIFx0XHRcdFx0XHRcdGZpZWxkcyA9IENyZWF0b3IuZ2V0T2JqZWN0KGtleSwgc3BhY2VJZCkuZmllbGRzXHJcbiMgXHRcdFx0XHRcdFx0Xy5lYWNoIHJlYWRhYmxlX2ZpZWxkcywgKGZpZWxkKS0+XHJcbiMgXHRcdFx0XHRcdFx0XHRpZiBmaWVsZC5pbmRleE9mKCckJykgPCAwXHJcbiMgXHRcdFx0XHRcdFx0XHRcdCNpZiBmaWVsZHNbZmllbGRdPy5tdWx0aXBsZSE9IHRydWVcclxuIyBcdFx0XHRcdFx0XHRcdFx0Y3JlYXRlUXVlcnkucHJvamVjdGlvbltmaWVsZF0gPSAxXHJcbiMgXHRcdFx0XHRcdGlmIG5vdCBwZXJtaXNzaW9ucy52aWV3QWxsUmVjb3JkcyAmJiAhcGVybWlzc2lvbnMudmlld0NvbXBhbnlSZWNvcmRzXHJcbiMgXHRcdFx0XHRcdFx0aWYgb2JqZWN0LmVuYWJsZV9zaGFyZVxyXG4jIFx0XHRcdFx0XHRcdFx0IyDmu6HotrPlhbHkuqvop4TliJnkuK3nmoTorrDlvZXkuZ/opoHmkJzntKLlh7rmnaVcclxuIyBcdFx0XHRcdFx0XHRcdGRlbGV0ZSBjcmVhdGVRdWVyeS5xdWVyeS5vd25lclxyXG4jIFx0XHRcdFx0XHRcdFx0c2hhcmVzID0gW11cclxuIyBcdFx0XHRcdFx0XHRcdG9yZ3MgPSBTdGVlZG9zLmdldFVzZXJPcmdhbml6YXRpb25zKHNwYWNlSWQsIEB1c2VySWQsIHRydWUpXHJcbiMgXHRcdFx0XHRcdFx0XHRzaGFyZXMucHVzaCB7XCJvd25lclwiOiBAdXNlcklkfVxyXG4jIFx0XHRcdFx0XHRcdFx0c2hhcmVzLnB1c2ggeyBcInNoYXJpbmcudVwiOiBAdXNlcklkIH1cclxuIyBcdFx0XHRcdFx0XHRcdHNoYXJlcy5wdXNoIHsgXCJzaGFyaW5nLm9cIjogeyAkaW46IG9yZ3MgfSB9XHJcbiMgXHRcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5xdWVyeVtcIiRvclwiXSA9IHNoYXJlc1xyXG4jIFx0XHRcdFx0XHRcdGVsc2VcclxuIyBcdFx0XHRcdFx0XHRcdGNyZWF0ZVF1ZXJ5LnF1ZXJ5Lm93bmVyID0gQHVzZXJJZFxyXG4jIFx0XHRcdFx0XHRlbnRpdGllcyA9IFtdXHJcblxyXG4jIFx0XHRcdFx0XHRleGNsdWRlRGVsZXRlZChjcmVhdGVRdWVyeS5xdWVyeSlcclxuXHJcbiMgXHRcdFx0XHRcdGlmIEBxdWVyeVBhcmFtcy4kdG9wIGlzbnQgJzAnXHJcbiMgXHRcdFx0XHRcdFx0ZW50aXRpZXMgPSBjb2xsZWN0aW9uLmZpbmQoY3JlYXRlUXVlcnkucXVlcnksIHZpc2l0b3JQYXJzZXIoY3JlYXRlUXVlcnkpKS5mZXRjaCgpXHJcbiMgXHRcdFx0XHRcdHNjYW5uZWRDb3VudCA9IGNvbGxlY3Rpb24uZmluZChjcmVhdGVRdWVyeS5xdWVyeSx7ZmllbGRzOntfaWQ6IDF9fSkuY291bnQoKVxyXG4jIFx0XHRcdFx0XHRpZiBlbnRpdGllc1xyXG4jIFx0XHRcdFx0XHRcdGRlYWxXaXRoRXhwYW5kKGNyZWF0ZVF1ZXJ5LCBlbnRpdGllcywga2V5LCBzcGFjZUlkKVxyXG4jIFx0XHRcdFx0XHRcdCNzY2FubmVkQ291bnQgPSBlbnRpdGllcy5sZW5ndGhcclxuIyBcdFx0XHRcdFx0XHRib2R5ID0ge31cclxuIyBcdFx0XHRcdFx0XHRoZWFkZXJzID0ge31cclxuIyBcdFx0XHRcdFx0XHRib2R5WydAb2RhdGEuY29udGV4dCddID0gU3RlZWRvc09EYXRhLmdldE9EYXRhQ29udGV4dFBhdGgoc3BhY2VJZCwga2V5KVxyXG4jIFx0XHRcdFx0XHQjXHRib2R5WydAb2RhdGEubmV4dExpbmsnXSA9IFN0ZWVkb3NPRGF0YS5nZXRPRGF0YU5leHRMaW5rUGF0aChzcGFjZUlkLGtleSkrXCI/JTI0c2tpcD1cIisgMTBcclxuIyBcdFx0XHRcdFx0XHRib2R5WydAb2RhdGEuY291bnQnXSA9IHNjYW5uZWRDb3VudFxyXG4jIFx0XHRcdFx0XHRcdGVudGl0aWVzX09kYXRhUHJvcGVydGllcyA9IHNldE9kYXRhUHJvcGVydHkoZW50aXRpZXMsc3BhY2VJZCwga2V5KVxyXG4jIFx0XHRcdFx0XHRcdGJvZHlbJ3ZhbHVlJ10gPSBlbnRpdGllc19PZGF0YVByb3BlcnRpZXNcclxuIyBcdFx0XHRcdFx0XHRoZWFkZXJzWydDb250ZW50LXR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uO29kYXRhLm1ldGFkYXRhPW1pbmltYWw7Y2hhcnNldD11dGYtOCdcclxuIyBcdFx0XHRcdFx0XHRoZWFkZXJzWydPRGF0YS1WZXJzaW9uJ10gPSBTdGVlZG9zT0RhdGEuVkVSU0lPTlxyXG4jIFx0XHRcdFx0XHRcdHtib2R5OiBib2R5LCBoZWFkZXJzOiBoZWFkZXJzfVxyXG4jIFx0XHRcdFx0XHRlbHNlXHJcbiMgXHRcdFx0XHRcdFx0cmV0dXJue1xyXG4jIFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XHJcbiMgXHRcdFx0XHRcdFx0XHRib2R5OiBzZXRFcnJvck1lc3NhZ2UoNDA0LGNvbGxlY3Rpb24sa2V5KVxyXG4jIFx0XHRcdFx0XHRcdH1cclxuIyBcdFx0XHRcdGVsc2VcclxuIyBcdFx0XHRcdFx0cmV0dXJue1xyXG4jIFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwM1xyXG4jIFx0XHRcdFx0XHRcdGJvZHk6IHNldEVycm9yTWVzc2FnZSg0MDMsY29sbGVjdGlvbixrZXksXCJnZXRcIilcclxuIyBcdFx0XHRcdFx0fVxyXG4jIFx0XHRcdGNhdGNoIGVcclxuIyBcdFx0XHRcdHJldHVybiBoYW5kbGVFcnJvciBlXHJcblxyXG4jIFx0XHRwb3N0OiAoKS0+XHJcbiMgXHRcdFx0dHJ5XHJcbiMgXHRcdFx0XHRrZXkgPSBAdXJsUGFyYW1zLm9iamVjdF9uYW1lXHJcbiMgXHRcdFx0XHRzcGFjZUlkID0gQHVybFBhcmFtcy5zcGFjZUlkXHJcbiMgXHRcdFx0XHRpZiBub3QgQ3JlYXRvci5nZXRPYmplY3Qoa2V5LCBzcGFjZUlkKT8uZW5hYmxlX2FwaVxyXG4jIFx0XHRcdFx0XHRyZXR1cm4ge1xyXG4jIFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwMVxyXG4jIFx0XHRcdFx0XHRcdGJvZHk6c2V0RXJyb3JNZXNzYWdlKDQwMSlcclxuIyBcdFx0XHRcdH1cclxuXHJcbiMgXHRcdFx0XHRjb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKGtleSwgc3BhY2VJZClcclxuIyBcdFx0XHRcdGlmIG5vdCBjb2xsZWN0aW9uXHJcbiMgXHRcdFx0XHRcdHJldHVybiB7XHJcbiMgXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XHJcbiMgXHRcdFx0XHRcdFx0Ym9keTpzZXRFcnJvck1lc3NhZ2UoNDA0LGNvbGxlY3Rpb24sa2V5KVxyXG4jIFx0XHRcdFx0XHR9XHJcbiMgXHRcdFx0XHRwZXJtaXNzaW9ucyA9IENyZWF0b3IuZ2V0T2JqZWN0UGVybWlzc2lvbnMoc3BhY2VJZCwgQHVzZXJJZCwga2V5KVxyXG4jIFx0XHRcdFx0aWYgcGVybWlzc2lvbnMuYWxsb3dDcmVhdGVcclxuIyBcdFx0XHRcdFx0QGJvZHlQYXJhbXMuc3BhY2UgPSBzcGFjZUlkXHJcbiMgXHRcdFx0XHRcdGlmIHNwYWNlSWQgaXMgJ2d1ZXN0J1xyXG4jIFx0XHRcdFx0XHRcdGRlbGV0ZSBAYm9keVBhcmFtcy5zcGFjZVxyXG4jIFx0XHRcdFx0XHRlbnRpdHlJZCA9IGNvbGxlY3Rpb24uaW5zZXJ0IEBib2R5UGFyYW1zXHJcbiMgXHRcdFx0XHRcdGVudGl0eSA9IGNvbGxlY3Rpb24uZmluZE9uZSBlbnRpdHlJZFxyXG4jIFx0XHRcdFx0XHRlbnRpdGllcyA9IFtdXHJcbiMgXHRcdFx0XHRcdGlmIGVudGl0eVxyXG4jIFx0XHRcdFx0XHRcdGJvZHkgPSB7fVxyXG4jIFx0XHRcdFx0XHRcdGhlYWRlcnMgPSB7fVxyXG4jIFx0XHRcdFx0XHRcdGVudGl0aWVzLnB1c2ggZW50aXR5XHJcbiMgXHRcdFx0XHRcdFx0Ym9keVsnQG9kYXRhLmNvbnRleHQnXSA9IFN0ZWVkb3NPRGF0YS5nZXRPRGF0YUNvbnRleHRQYXRoKHNwYWNlSWQsIGtleSkgKyAnLyRlbnRpdHknXHJcbiMgXHRcdFx0XHRcdFx0ZW50aXR5X09kYXRhUHJvcGVydGllcyA9IHNldE9kYXRhUHJvcGVydHkoZW50aXRpZXMsc3BhY2VJZCwga2V5KVxyXG4jIFx0XHRcdFx0XHRcdGJvZHlbJ3ZhbHVlJ10gPSBlbnRpdHlfT2RhdGFQcm9wZXJ0aWVzXHJcbiMgXHRcdFx0XHRcdFx0aGVhZGVyc1snQ29udGVudC10eXBlJ10gPSAnYXBwbGljYXRpb24vanNvbjtvZGF0YS5tZXRhZGF0YT1taW5pbWFsO2NoYXJzZXQ9dXRmLTgnXHJcbiMgXHRcdFx0XHRcdFx0aGVhZGVyc1snT0RhdGEtVmVyc2lvbiddID0gU3RlZWRvc09EYXRhLlZFUlNJT05cclxuIyBcdFx0XHRcdFx0XHR7Ym9keTogYm9keSwgaGVhZGVyczogaGVhZGVyc31cclxuIyBcdFx0XHRcdFx0ZWxzZVxyXG4jIFx0XHRcdFx0XHRcdHJldHVybntcclxuIyBcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxyXG4jIFx0XHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwNCxjb2xsZWN0aW9uLGtleSwncG9zdCcpXHJcbiMgXHRcdFx0XHRcdFx0fVxyXG4jIFx0XHRcdFx0ZWxzZVxyXG4jIFx0XHRcdFx0XHRyZXR1cm57XHJcbiMgXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDAzXHJcbiMgXHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwMyxjb2xsZWN0aW9uLGtleSwncG9zdCcpXHJcbiMgXHRcdFx0XHRcdH1cclxuIyBcdFx0XHRjYXRjaCBlXHJcbiMgXHRcdFx0XHRyZXR1cm4gaGFuZGxlRXJyb3IgZVxyXG5cclxuIyBcdH0pXHJcbiMgXHRTdGVlZG9zT2RhdGFBUEkuYWRkUm91dGUoJzpvYmplY3RfbmFtZS9yZWNlbnQnLCB7YXV0aFJlcXVpcmVkOiB0cnVlLCBzcGFjZVJlcXVpcmVkOiBmYWxzZX0sIHtcclxuIyBcdFx0Z2V0OigpLT5cclxuIyBcdFx0XHR0cnlcclxuIyBcdFx0XHRcdGtleSA9IEB1cmxQYXJhbXMub2JqZWN0X25hbWVcclxuIyBcdFx0XHRcdG9iamVjdCA9IENyZWF0b3IuZ2V0T2JqZWN0KGtleSwgQHVybFBhcmFtcy5zcGFjZUlkKVxyXG4jIFx0XHRcdFx0aWYgbm90IG9iamVjdD8uZW5hYmxlX2FwaVxyXG4jIFx0XHRcdFx0XHRyZXR1cm57XHJcbiMgXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDAxXHJcbiMgXHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwMSlcclxuIyBcdFx0XHRcdFx0fVxyXG4jIFx0XHRcdFx0Y29sbGVjdGlvbiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihrZXksIEB1cmxQYXJhbXMuc3BhY2VJZClcclxuIyBcdFx0XHRcdGlmIG5vdCBjb2xsZWN0aW9uXHJcbiMgXHRcdFx0XHRcdHJldHVybiB7XHJcbiMgXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XHJcbiMgXHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwNCxjb2xsZWN0aW9uLGtleSlcclxuIyBcdFx0XHRcdFx0fVxyXG4jIFx0XHRcdFx0cGVybWlzc2lvbnMgPSBDcmVhdG9yLmdldE9iamVjdFBlcm1pc3Npb25zKEB1cmxQYXJhbXMuc3BhY2VJZCwgQHVzZXJJZCwga2V5KVxyXG4jIFx0XHRcdFx0aWYgcGVybWlzc2lvbnMuYWxsb3dSZWFkXHJcbiMgXHRcdFx0XHRcdHJlY2VudF92aWV3X2NvbGxlY3Rpb24gPSBDcmVhdG9yLkNvbGxlY3Rpb25zW1wib2JqZWN0X3JlY2VudF92aWV3ZWRcIl1cclxuIyBcdFx0XHRcdFx0cmVjZW50X3ZpZXdfc2VsZWN0b3IgPSB7XCJyZWNvcmQub1wiOmtleSxjcmVhdGVkX2J5OkB1c2VySWR9XHJcbiMgXHRcdFx0XHRcdHJlY2VudF92aWV3X29wdGlvbnMgPSB7fVxyXG4jIFx0XHRcdFx0XHRyZWNlbnRfdmlld19vcHRpb25zLnNvcnQgPSB7Y3JlYXRlZDogLTF9XHJcbiMgXHRcdFx0XHRcdHJlY2VudF92aWV3X29wdGlvbnMuZmllbGRzID0ge3JlY29yZDoxfVxyXG4jIFx0XHRcdFx0XHRyZWNlbnRfdmlld19yZWNvcmRzID0gcmVjZW50X3ZpZXdfY29sbGVjdGlvbi5maW5kKHJlY2VudF92aWV3X3NlbGVjdG9yLHJlY2VudF92aWV3X29wdGlvbnMpLmZldGNoKClcclxuIyBcdFx0XHRcdFx0cmVjZW50X3ZpZXdfcmVjb3Jkc19pZHMgPSBfLnBsdWNrKHJlY2VudF92aWV3X3JlY29yZHMsJ3JlY29yZCcpXHJcbiMgXHRcdFx0XHRcdHJlY2VudF92aWV3X3JlY29yZHNfaWRzID0gcmVjZW50X3ZpZXdfcmVjb3Jkc19pZHMuZ2V0UHJvcGVydHkoXCJpZHNcIilcclxuIyBcdFx0XHRcdFx0cmVjZW50X3ZpZXdfcmVjb3Jkc19pZHMgPSBfLmZsYXR0ZW4ocmVjZW50X3ZpZXdfcmVjb3Jkc19pZHMpXHJcbiMgXHRcdFx0XHRcdHJlY2VudF92aWV3X3JlY29yZHNfaWRzID0gXy51bmlxKHJlY2VudF92aWV3X3JlY29yZHNfaWRzKVxyXG4jIFx0XHRcdFx0XHRyZW1vdmVJbnZhbGlkTWV0aG9kKEBxdWVyeVBhcmFtcylcclxuIyBcdFx0XHRcdFx0cXMgPSBkZWNvZGVVUklDb21wb25lbnQocXVlcnlzdHJpbmcuc3RyaW5naWZ5KEBxdWVyeVBhcmFtcykpXHJcbiMgXHRcdFx0XHRcdGNyZWF0ZVF1ZXJ5ID0gaWYgcXMgdGhlbiBvZGF0YVY0TW9uZ29kYi5jcmVhdGVRdWVyeShxcykgZWxzZSBvZGF0YVY0TW9uZ29kYi5jcmVhdGVRdWVyeSgpXHJcbiMgXHRcdFx0XHRcdGlmIGtleSBpcyAnY2ZzLmZpbGVzLmZpbGVyZWNvcmQnXHJcbiMgXHRcdFx0XHRcdFx0Y3JlYXRlUXVlcnkucXVlcnlbJ21ldGFkYXRhLnNwYWNlJ10gPSBAdXJsUGFyYW1zLnNwYWNlSWRcclxuIyBcdFx0XHRcdFx0ZWxzZVxyXG4jIFx0XHRcdFx0XHRcdGNyZWF0ZVF1ZXJ5LnF1ZXJ5LnNwYWNlID0gQHVybFBhcmFtcy5zcGFjZUlkXHJcbiMgXHRcdFx0XHRcdGlmIG5vdCBjcmVhdGVRdWVyeS5saW1pdFxyXG4jIFx0XHRcdFx0XHRcdGNyZWF0ZVF1ZXJ5LmxpbWl0ID0gMTAwXHJcbiMgXHRcdFx0XHRcdGlmIGNyZWF0ZVF1ZXJ5LmxpbWl0IGFuZCByZWNlbnRfdmlld19yZWNvcmRzX2lkcy5sZW5ndGg+Y3JlYXRlUXVlcnkubGltaXRcclxuIyBcdFx0XHRcdFx0XHRyZWNlbnRfdmlld19yZWNvcmRzX2lkcyA9IF8uZmlyc3QocmVjZW50X3ZpZXdfcmVjb3Jkc19pZHMsY3JlYXRlUXVlcnkubGltaXQpXHJcbiMgXHRcdFx0XHRcdGNyZWF0ZVF1ZXJ5LnF1ZXJ5Ll9pZCA9IHskaW46cmVjZW50X3ZpZXdfcmVjb3Jkc19pZHN9XHJcbiMgXHRcdFx0XHRcdHVucmVhZGFibGVfZmllbGRzID0gcGVybWlzc2lvbnMudW5yZWFkYWJsZV9maWVsZHMgfHwgW11cclxuIyBcdFx0XHRcdFx0aWYgY3JlYXRlUXVlcnkucHJvamVjdGlvblxyXG4jIFx0XHRcdFx0XHRcdHByb2plY3Rpb24gPSB7fVxyXG4jIFx0XHRcdFx0XHRcdF8ua2V5cyhjcmVhdGVRdWVyeS5wcm9qZWN0aW9uKS5mb3JFYWNoIChrZXkpLT5cclxuIyBcdFx0XHRcdFx0XHRcdGlmIF8uaW5kZXhPZih1bnJlYWRhYmxlX2ZpZWxkcywga2V5KSA8IDBcclxuIyBcdFx0XHRcdFx0XHRcdFx0IyBpZiBub3QgKChmaWVsZHNba2V5XT8udHlwZSA9PSAnbG9va3VwJyBvciBmaWVsZHNba2V5XT8udHlwZSA9PSAnbWFzdGVyX2RldGFpbCcpIGFuZCBmaWVsZHNba2V5XS5tdWx0aXBsZSlcclxuIyBcdFx0XHRcdFx0XHRcdFx0cHJvamVjdGlvbltrZXldID0gMVxyXG4jIFx0XHRcdFx0XHRcdGNyZWF0ZVF1ZXJ5LnByb2plY3Rpb24gPSBwcm9qZWN0aW9uXHJcbiMgXHRcdFx0XHRcdGlmIG5vdCBjcmVhdGVRdWVyeS5wcm9qZWN0aW9uIG9yICFfLnNpemUoY3JlYXRlUXVlcnkucHJvamVjdGlvbilcclxuIyBcdFx0XHRcdFx0XHRyZWFkYWJsZV9maWVsZHMgPSBDcmVhdG9yLmdldEZpZWxkcyhrZXksIEB1cmxQYXJhbXMuc3BhY2VJZCwgQHVzZXJJZClcclxuIyBcdFx0XHRcdFx0XHRmaWVsZHMgPSBDcmVhdG9yLmdldE9iamVjdChrZXksIEB1cmxQYXJhbXMuc3BhY2VJZCkuZmllbGRzXHJcbiMgXHRcdFx0XHRcdFx0Xy5lYWNoIHJlYWRhYmxlX2ZpZWxkcywgKGZpZWxkKS0+XHJcbiMgXHRcdFx0XHRcdFx0XHRpZiBmaWVsZC5pbmRleE9mKCckJykgPCAwXHJcbiMgXHRcdFx0XHRcdFx0XHRcdCNpZiBmaWVsZHNbZmllbGRdPy5tdWx0aXBsZSE9IHRydWVcclxuIyBcdFx0XHRcdFx0XHRcdFx0Y3JlYXRlUXVlcnkucHJvamVjdGlvbltmaWVsZF0gPSAxXHJcblxyXG4jIFx0XHRcdFx0XHRleGNsdWRlRGVsZXRlZChjcmVhdGVRdWVyeS5xdWVyeSlcclxuXHJcbiMgXHRcdFx0XHRcdGlmIEBxdWVyeVBhcmFtcy4kdG9wIGlzbnQgJzAnXHJcbiMgXHRcdFx0XHRcdFx0ZW50aXRpZXMgPSBjb2xsZWN0aW9uLmZpbmQoY3JlYXRlUXVlcnkucXVlcnksIHZpc2l0b3JQYXJzZXIoY3JlYXRlUXVlcnkpKS5mZXRjaCgpXHJcbiMgXHRcdFx0XHRcdGVudGl0aWVzX2luZGV4ID0gW11cclxuIyBcdFx0XHRcdFx0ZW50aXRpZXNfaWRzID0gXy5wbHVjayhlbnRpdGllcywnX2lkJylcclxuIyBcdFx0XHRcdFx0c29ydF9lbnRpdGllcyA9IFtdXHJcbiMgXHRcdFx0XHRcdGlmIG5vdCBjcmVhdGVRdWVyeS5zb3J0IG9yICFfLnNpemUoY3JlYXRlUXVlcnkuc29ydClcclxuIyBcdFx0XHRcdFx0XHRfLmVhY2ggcmVjZW50X3ZpZXdfcmVjb3Jkc19pZHMgLChyZWNlbnRfdmlld19yZWNvcmRzX2lkKS0+XHJcbiMgXHRcdFx0XHRcdFx0XHRpbmRleCA9IF8uaW5kZXhPZihlbnRpdGllc19pZHMscmVjZW50X3ZpZXdfcmVjb3Jkc19pZClcclxuIyBcdFx0XHRcdFx0XHRcdGlmIGluZGV4Pi0xXHJcbiMgXHRcdFx0XHRcdFx0XHRcdHNvcnRfZW50aXRpZXMucHVzaCBlbnRpdGllc1tpbmRleF1cclxuIyBcdFx0XHRcdFx0ZWxzZVxyXG4jIFx0XHRcdFx0XHRcdHNvcnRfZW50aXRpZXMgPSBlbnRpdGllc1xyXG4jIFx0XHRcdFx0XHRpZiBzb3J0X2VudGl0aWVzXHJcbiMgXHRcdFx0XHRcdFx0ZGVhbFdpdGhFeHBhbmQoY3JlYXRlUXVlcnksIHNvcnRfZW50aXRpZXMsIGtleSwgQHVybFBhcmFtcy5zcGFjZUlkKVxyXG4jIFx0XHRcdFx0XHRcdGJvZHkgPSB7fVxyXG4jIFx0XHRcdFx0XHRcdGhlYWRlcnMgPSB7fVxyXG4jIFx0XHRcdFx0XHRcdGJvZHlbJ0BvZGF0YS5jb250ZXh0J10gPSBTdGVlZG9zT0RhdGEuZ2V0T0RhdGFDb250ZXh0UGF0aChAdXJsUGFyYW1zLnNwYWNlSWQsIGtleSlcclxuIyBcdFx0XHRcdFx0I1x0Ym9keVsnQG9kYXRhLm5leHRMaW5rJ10gPSBTdGVlZG9zT0RhdGEuZ2V0T0RhdGFOZXh0TGlua1BhdGgoQHVybFBhcmFtcy5zcGFjZUlkLGtleSkrXCI/JTI0c2tpcD1cIisgMTBcclxuIyBcdFx0XHRcdFx0XHRib2R5WydAb2RhdGEuY291bnQnXSA9IHNvcnRfZW50aXRpZXMubGVuZ3RoXHJcbiMgXHRcdFx0XHRcdFx0ZW50aXRpZXNfT2RhdGFQcm9wZXJ0aWVzID0gc2V0T2RhdGFQcm9wZXJ0eShzb3J0X2VudGl0aWVzLEB1cmxQYXJhbXMuc3BhY2VJZCwga2V5KVxyXG4jIFx0XHRcdFx0XHRcdGJvZHlbJ3ZhbHVlJ10gPSBlbnRpdGllc19PZGF0YVByb3BlcnRpZXNcclxuIyBcdFx0XHRcdFx0XHRoZWFkZXJzWydDb250ZW50LXR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uO29kYXRhLm1ldGFkYXRhPW1pbmltYWw7Y2hhcnNldD11dGYtOCdcclxuIyBcdFx0XHRcdFx0XHRoZWFkZXJzWydPRGF0YS1WZXJzaW9uJ10gPSBTdGVlZG9zT0RhdGEuVkVSU0lPTlxyXG4jIFx0XHRcdFx0XHRcdHtib2R5OiBib2R5LCBoZWFkZXJzOiBoZWFkZXJzfVxyXG4jIFx0XHRcdFx0XHRlbHNlXHJcbiMgXHRcdFx0XHRcdFx0cmV0dXJue1xyXG4jIFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XHJcbiMgXHRcdFx0XHRcdFx0XHRib2R5OiBzZXRFcnJvck1lc3NhZ2UoNDA0LGNvbGxlY3Rpb24sa2V5LCdnZXQnKVxyXG4jIFx0XHRcdFx0XHRcdH1cclxuIyBcdFx0XHRcdGVsc2VcclxuIyBcdFx0XHRcdFx0cmV0dXJue1xyXG4jIFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwM1xyXG4jIFx0XHRcdFx0XHRcdGJvZHk6IHNldEVycm9yTWVzc2FnZSg0MDMsY29sbGVjdGlvbixrZXksJ2dldCcpXHJcbiMgXHRcdFx0XHRcdH1cclxuIyBcdFx0XHRjYXRjaCBlXHJcbiMgXHRcdFx0XHRyZXR1cm4gaGFuZGxlRXJyb3IgZVxyXG4jIH0pXHJcblxyXG4jIFx0U3RlZWRvc09kYXRhQVBJLmFkZFJvdXRlKCc6b2JqZWN0X25hbWUvOl9pZCcsIHthdXRoUmVxdWlyZWQ6IHRydWUsIHNwYWNlUmVxdWlyZWQ6IGZhbHNlfSwge1xyXG4jIFx0XHRwb3N0OiAoKS0+XHJcbiMgXHRcdFx0dHJ5XHJcbiMgXHRcdFx0XHRrZXkgPSBAdXJsUGFyYW1zLm9iamVjdF9uYW1lXHJcbiMgXHRcdFx0XHRpZiBub3QgQ3JlYXRvci5nZXRPYmplY3Qoa2V5LCBAdXJsUGFyYW1zLnNwYWNlSWQpPy5lbmFibGVfYXBpXHJcbiMgXHRcdFx0XHRcdHJldHVybntcclxuIyBcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDFcclxuIyBcdFx0XHRcdFx0XHRib2R5OiBzZXRFcnJvck1lc3NhZ2UoNDAxKVxyXG4jIFx0XHRcdFx0XHR9XHJcbiMgXHRcdFx0XHRjb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKGtleSwgQHVybFBhcmFtcy5zcGFjZUlkKVxyXG4jIFx0XHRcdFx0aWYgbm90IGNvbGxlY3Rpb25cclxuIyBcdFx0XHRcdFx0cmV0dXJue1xyXG4jIFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxyXG4jIFx0XHRcdFx0XHRcdGJvZHk6IHNldEVycm9yTWVzc2FnZSg0MDQsY29sbGVjdGlvbixrZXkpXHJcbiMgXHRcdFx0XHRcdH1cclxuIyBcdFx0XHRcdHBlcm1pc3Npb25zID0gQ3JlYXRvci5nZXRPYmplY3RQZXJtaXNzaW9ucyhAdXJsUGFyYW1zLnNwYWNlSWQsIEB1c2VySWQsIGtleSlcclxuIyBcdFx0XHRcdGlmIHBlcm1pc3Npb25zLmFsbG93Q3JlYXRlXHJcbiMgXHRcdFx0XHRcdEBib2R5UGFyYW1zLnNwYWNlID0gQHVybFBhcmFtcy5zcGFjZUlkXHJcbiMgXHRcdFx0XHRcdGVudGl0eUlkID0gY29sbGVjdGlvbi5pbnNlcnQgQGJvZHlQYXJhbXNcclxuIyBcdFx0XHRcdFx0ZW50aXR5ID0gY29sbGVjdGlvbi5maW5kT25lIGVudGl0eUlkXHJcbiMgXHRcdFx0XHRcdGVudGl0aWVzID0gW11cclxuIyBcdFx0XHRcdFx0aWYgZW50aXR5XHJcbiMgXHRcdFx0XHRcdFx0Ym9keSA9IHt9XHJcbiMgXHRcdFx0XHRcdFx0aGVhZGVycyA9IHt9XHJcbiMgXHRcdFx0XHRcdFx0ZW50aXRpZXMucHVzaCBlbnRpdHlcclxuIyBcdFx0XHRcdFx0XHRib2R5WydAb2RhdGEuY29udGV4dCddID0gU3RlZWRvc09EYXRhLmdldE9EYXRhQ29udGV4dFBhdGgoQHVybFBhcmFtcy5zcGFjZUlkLCBrZXkpICsgJy8kZW50aXR5J1xyXG4jIFx0XHRcdFx0XHRcdGVudGl0eV9PZGF0YVByb3BlcnRpZXMgPSBzZXRPZGF0YVByb3BlcnR5KGVudGl0aWVzLEB1cmxQYXJhbXMuc3BhY2VJZCwga2V5KVxyXG4jIFx0XHRcdFx0XHRcdGJvZHlbJ3ZhbHVlJ10gPSBlbnRpdHlfT2RhdGFQcm9wZXJ0aWVzXHJcbiMgXHRcdFx0XHRcdFx0aGVhZGVyc1snQ29udGVudC10eXBlJ10gPSAnYXBwbGljYXRpb24vanNvbjtvZGF0YS5tZXRhZGF0YT1taW5pbWFsO2NoYXJzZXQ9dXRmLTgnXHJcbiMgXHRcdFx0XHRcdFx0aGVhZGVyc1snT0RhdGEtVmVyc2lvbiddID0gU3RlZWRvc09EYXRhLlZFUlNJT05cclxuIyBcdFx0XHRcdFx0XHR7Ym9keTogYm9keSwgaGVhZGVyczogaGVhZGVyc31cclxuIyBcdFx0XHRcdFx0ZWxzZVxyXG4jIFx0XHRcdFx0XHRcdHJldHVybntcclxuIyBcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxyXG4jIFx0XHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwNCxjb2xsZWN0aW9uLGtleSwncG9zdCcpXHJcbiMgXHRcdFx0XHRcdFx0fVxyXG4jIFx0XHRcdFx0ZWxzZVxyXG4jIFx0XHRcdFx0XHRyZXR1cm57XHJcbiMgXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDAzXHJcbiMgXHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwMyxjb2xsZWN0aW9uLGtleSwncG9zdCcpXHJcbiMgXHRcdFx0XHRcdH1cclxuIyBcdFx0XHRjYXRjaCBlXHJcbiMgXHRcdFx0XHRyZXR1cm4gaGFuZGxlRXJyb3IgZVxyXG4jIFx0XHRnZXQ6KCktPlxyXG4jIFx0XHRcdGtleSA9IEB1cmxQYXJhbXMub2JqZWN0X25hbWVcclxuIyBcdFx0XHRpZiBrZXkuaW5kZXhPZihcIihcIikgPiAtMVxyXG4jIFx0XHRcdFx0Ym9keSA9IHt9XHJcbiMgXHRcdFx0XHRoZWFkZXJzID0ge31cclxuIyBcdFx0XHRcdGNvbGxlY3Rpb25JbmZvID0ga2V5XHJcbiMgXHRcdFx0XHRmaWVsZE5hbWUgPSBAdXJsUGFyYW1zLl9pZC5zcGxpdCgnX2V4cGFuZCcpWzBdXHJcbiMgXHRcdFx0XHRjb2xsZWN0aW9uSW5mb1NwbGl0ID0gY29sbGVjdGlvbkluZm8uc3BsaXQoJygnKVxyXG4jIFx0XHRcdFx0Y29sbGVjdGlvbk5hbWUgPSBjb2xsZWN0aW9uSW5mb1NwbGl0WzBdXHJcbiMgXHRcdFx0XHRpZCA9IGNvbGxlY3Rpb25JbmZvU3BsaXRbMV0uc3BsaXQoJ1xcJycpWzFdXHJcblxyXG4jIFx0XHRcdFx0Y29sbGVjdGlvbiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihjb2xsZWN0aW9uTmFtZSwgQHVybFBhcmFtcy5zcGFjZUlkKVxyXG4jIFx0XHRcdFx0ZmllbGRzT3B0aW9ucyA9IHt9XHJcbiMgXHRcdFx0XHRmaWVsZHNPcHRpb25zW2ZpZWxkTmFtZV0gPSAxXHJcbiMgXHRcdFx0XHRlbnRpdHkgPSBjb2xsZWN0aW9uLmZpbmRPbmUoe19pZDogaWR9LCB7ZmllbGRzOiBmaWVsZHNPcHRpb25zfSlcclxuXHJcbiMgXHRcdFx0XHRmaWVsZFZhbHVlID0gbnVsbFxyXG4jIFx0XHRcdFx0aWYgZW50aXR5XHJcbiMgXHRcdFx0XHRcdGZpZWxkVmFsdWUgPSBlbnRpdHlbZmllbGROYW1lXVxyXG5cclxuIyBcdFx0XHRcdG9iaiA9IENyZWF0b3IuZ2V0T2JqZWN0KGNvbGxlY3Rpb25OYW1lLCBAdXJsUGFyYW1zLnNwYWNlSWQpXHJcbiMgXHRcdFx0XHRmaWVsZCA9IG9iai5maWVsZHNbZmllbGROYW1lXVxyXG5cclxuIyBcdFx0XHRcdGlmIGZpZWxkIGFuZCBmaWVsZFZhbHVlIGFuZCAoZmllbGQudHlwZSBpcyAnbG9va3VwJyBvciBmaWVsZC50eXBlIGlzICdtYXN0ZXJfZGV0YWlsJylcclxuIyBcdFx0XHRcdFx0bG9va3VwQ29sbGVjdGlvbiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihmaWVsZC5yZWZlcmVuY2VfdG8sIEB1cmxQYXJhbXMuc3BhY2VJZClcclxuIyBcdFx0XHRcdFx0cXVlcnlPcHRpb25zID0ge2ZpZWxkczoge319XHJcbiMgXHRcdFx0XHRcdHJlYWRhYmxlX2ZpZWxkcyA9IENyZWF0b3IuZ2V0RmllbGRzKGZpZWxkLnJlZmVyZW5jZV90bywgQHVybFBhcmFtcy5zcGFjZUlkLCBAdXNlcklkKVxyXG4jIFx0XHRcdFx0XHRfLmVhY2ggcmVhZGFibGVfZmllbGRzLCAoZiktPlxyXG4jIFx0XHRcdFx0XHRcdGlmIGYuaW5kZXhPZignJCcpIDwgMFxyXG4jIFx0XHRcdFx0XHRcdFx0cXVlcnlPcHRpb25zLmZpZWxkc1tmXSA9IDFcclxuXHJcbiMgXHRcdFx0XHRcdGlmIGZpZWxkLm11bHRpcGxlXHJcbiMgXHRcdFx0XHRcdFx0dmFsdWVzID0gW11cclxuIyBcdFx0XHRcdFx0XHRsb29rdXBDb2xsZWN0aW9uLmZpbmQoe19pZDogeyRpbjogZmllbGRWYWx1ZX19LCBxdWVyeU9wdGlvbnMpLmZvckVhY2ggKG9iaiktPlxyXG4jIFx0XHRcdFx0XHRcdFx0Xy5lYWNoIG9iaiwgKHYsIGspLT5cclxuIyBcdFx0XHRcdFx0XHRcdFx0aWYgXy5pc0FycmF5KHYpIHx8IChfLmlzT2JqZWN0KHYpICYmICFfLmlzRGF0ZSh2KSlcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRvYmpba10gPSBKU09OLnN0cmluZ2lmeSh2KVxyXG4jIFx0XHRcdFx0XHRcdFx0dmFsdWVzLnB1c2gob2JqKVxyXG4jIFx0XHRcdFx0XHRcdGJvZHlbJ3ZhbHVlJ10gPSB2YWx1ZXNcclxuIyBcdFx0XHRcdFx0XHRib2R5WydAb2RhdGEuY29udGV4dCddID0gU3RlZWRvc09EYXRhLmdldE1ldGFEYXRhUGF0aChAdXJsUGFyYW1zLnNwYWNlSWQpICsgXCIjI3tjb2xsZWN0aW9uSW5mb30vI3tAdXJsUGFyYW1zLl9pZH1cIlxyXG4jIFx0XHRcdFx0XHRlbHNlXHJcbiMgXHRcdFx0XHRcdFx0Ym9keSA9IGxvb2t1cENvbGxlY3Rpb24uZmluZE9uZSh7X2lkOiBmaWVsZFZhbHVlfSwgcXVlcnlPcHRpb25zKSB8fCB7fVxyXG4jIFx0XHRcdFx0XHRcdF8uZWFjaCBib2R5LCAodiwgayktPlxyXG4jIFx0XHRcdFx0XHRcdFx0aWYgXy5pc0FycmF5KHYpIHx8IChfLmlzT2JqZWN0KHYpICYmICFfLmlzRGF0ZSh2KSlcclxuIyBcdFx0XHRcdFx0XHRcdFx0Ym9keVtrXSA9IEpTT04uc3RyaW5naWZ5KHYpXHJcbiMgXHRcdFx0XHRcdFx0Ym9keVsnQG9kYXRhLmNvbnRleHQnXSA9IFN0ZWVkb3NPRGF0YS5nZXRNZXRhRGF0YVBhdGgoQHVybFBhcmFtcy5zcGFjZUlkKSArIFwiIyN7ZmllbGQucmVmZXJlbmNlX3RvfS8kZW50aXR5XCJcclxuXHJcbiMgXHRcdFx0XHRlbHNlXHJcbiMgXHRcdFx0XHRcdGJvZHlbJ0BvZGF0YS5jb250ZXh0J10gPSBTdGVlZG9zT0RhdGEuZ2V0TWV0YURhdGFQYXRoKEB1cmxQYXJhbXMuc3BhY2VJZCkgKyBcIiMje2NvbGxlY3Rpb25JbmZvfS8je0B1cmxQYXJhbXMuX2lkfVwiXHJcbiMgXHRcdFx0XHRcdGJvZHlbJ3ZhbHVlJ10gPSBmaWVsZFZhbHVlXHJcblxyXG4jIFx0XHRcdFx0aGVhZGVyc1snQ29udGVudC10eXBlJ10gPSAnYXBwbGljYXRpb24vanNvbjtvZGF0YS5tZXRhZGF0YT1taW5pbWFsO2NoYXJzZXQ9dXRmLTgnXHJcbiMgXHRcdFx0XHRoZWFkZXJzWydPRGF0YS1WZXJzaW9uJ10gPSBTdGVlZG9zT0RhdGEuVkVSU0lPTlxyXG5cclxuIyBcdFx0XHRcdHtib2R5OiBib2R5LCBoZWFkZXJzOiBoZWFkZXJzfVxyXG4jIFx0XHRcdGVsc2VcclxuIyBcdFx0XHRcdHRyeVxyXG4jIFx0XHRcdFx0XHRvYmplY3QgPSBDcmVhdG9yLmdldE9iamVjdChrZXksIEB1cmxQYXJhbXMuc3BhY2VJZClcclxuIyBcdFx0XHRcdFx0aWYgbm90IG9iamVjdD8uZW5hYmxlX2FwaVxyXG4jIFx0XHRcdFx0XHRcdHJldHVybiB7XHJcbiMgXHRcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDFcclxuIyBcdFx0XHRcdFx0XHRcdGJvZHk6IHNldEVycm9yTWVzc2FnZSg0MDEpXHJcbiMgXHRcdFx0XHRcdFx0fVxyXG4jIFx0XHRcdFx0XHRjb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKGtleSwgQHVybFBhcmFtcy5zcGFjZUlkKVxyXG4jIFx0XHRcdFx0XHRpZiBub3QgY29sbGVjdGlvblxyXG4jIFx0XHRcdFx0XHRcdHJldHVybntcclxuIyBcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxyXG4jIFx0XHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwNCxjb2xsZWN0aW9uLGtleSlcclxuIyBcdFx0XHRcdFx0XHR9XHJcblxyXG4jIFx0XHRcdFx0XHRwZXJtaXNzaW9ucyA9IENyZWF0b3IuZ2V0T2JqZWN0UGVybWlzc2lvbnMoQHVybFBhcmFtcy5zcGFjZUlkLCBAdXNlcklkLCBrZXkpXHJcbiMgXHRcdFx0XHRcdGlmIHBlcm1pc3Npb25zLmFsbG93UmVhZFxyXG4jIFx0XHRcdFx0XHRcdHVucmVhZGFibGVfZmllbGRzID0gcGVybWlzc2lvbnMudW5yZWFkYWJsZV9maWVsZHMgfHwgW11cclxuIyBcdFx0XHRcdFx0XHRyZW1vdmVJbnZhbGlkTWV0aG9kKEBxdWVyeVBhcmFtcylcclxuIyBcdFx0XHRcdFx0XHRxcyA9IGRlY29kZVVSSUNvbXBvbmVudChxdWVyeXN0cmluZy5zdHJpbmdpZnkoQHF1ZXJ5UGFyYW1zKSlcclxuIyBcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeSA9IGlmIHFzIHRoZW4gb2RhdGFWNE1vbmdvZGIuY3JlYXRlUXVlcnkocXMpIGVsc2Ugb2RhdGFWNE1vbmdvZGIuY3JlYXRlUXVlcnkoKVxyXG4jIFx0XHRcdFx0XHRcdGNyZWF0ZVF1ZXJ5LnF1ZXJ5Ll9pZCA9ICBAdXJsUGFyYW1zLl9pZFxyXG4jIFx0XHRcdFx0XHRcdGlmIGtleSBpcyAnY2ZzLmZpbGVzLmZpbGVyZWNvcmQnXHJcbiMgXHRcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5xdWVyeVsnbWV0YWRhdGEuc3BhY2UnXSA9IEB1cmxQYXJhbXMuc3BhY2VJZFxyXG4jIFx0XHRcdFx0XHRcdGVsc2UgaWYga2V5ICE9ICdzcGFjZXMnXHJcbiMgXHRcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5xdWVyeS5zcGFjZSA9ICBAdXJsUGFyYW1zLnNwYWNlSWRcclxuIyBcdFx0XHRcdFx0XHR1bnJlYWRhYmxlX2ZpZWxkcyA9IHBlcm1pc3Npb25zLnVucmVhZGFibGVfZmllbGRzIHx8IFtdXHJcbiMgXHRcdFx0XHRcdFx0aWYgY3JlYXRlUXVlcnkucHJvamVjdGlvblxyXG4jIFx0XHRcdFx0XHRcdFx0cHJvamVjdGlvbiA9IHt9XHJcbiMgXHRcdFx0XHRcdFx0XHRfLmtleXMoY3JlYXRlUXVlcnkucHJvamVjdGlvbikuZm9yRWFjaCAoa2V5KS0+XHJcbiMgXHRcdFx0XHRcdFx0XHRcdGlmIF8uaW5kZXhPZih1bnJlYWRhYmxlX2ZpZWxkcywga2V5KSA8IDBcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHQjIGlmIG5vdCAoKGZpZWxkc1trZXldPy50eXBlID09ICdsb29rdXAnIG9yIGZpZWxkc1trZXldPy50eXBlID09ICdtYXN0ZXJfZGV0YWlsJykgYW5kIGZpZWxkc1trZXldLm11bHRpcGxlKVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdHByb2plY3Rpb25ba2V5XSA9IDFcclxuIyBcdFx0XHRcdFx0XHRcdGNyZWF0ZVF1ZXJ5LnByb2plY3Rpb24gPSBwcm9qZWN0aW9uXHJcbiMgXHRcdFx0XHRcdFx0aWYgbm90IGNyZWF0ZVF1ZXJ5LnByb2plY3Rpb24gb3IgIV8uc2l6ZShjcmVhdGVRdWVyeS5wcm9qZWN0aW9uKVxyXG4jIFx0XHRcdFx0XHRcdFx0cmVhZGFibGVfZmllbGRzID0gQ3JlYXRvci5nZXRGaWVsZHMoa2V5LCBAdXJsUGFyYW1zLnNwYWNlSWQsIEB1c2VySWQpXHJcbiMgXHRcdFx0XHRcdFx0XHRmaWVsZHMgPSBvYmplY3QuZmllbGRzXHJcbiMgXHRcdFx0XHRcdFx0XHRfLmVhY2ggcmVhZGFibGVfZmllbGRzLCAoZmllbGQpIC0+XHJcbiMgXHRcdFx0XHRcdFx0XHRcdGlmIGZpZWxkLmluZGV4T2YoJyQnKSA8IDBcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5wcm9qZWN0aW9uW2ZpZWxkXSA9IDFcclxuIyBcdFx0XHRcdFx0XHRlbnRpdHkgPSBjb2xsZWN0aW9uLmZpbmRPbmUoY3JlYXRlUXVlcnkucXVlcnksdmlzaXRvclBhcnNlcihjcmVhdGVRdWVyeSkpXHJcbiMgXHRcdFx0XHRcdFx0ZW50aXRpZXMgPSBbXVxyXG4jIFx0XHRcdFx0XHRcdGlmIGVudGl0eVxyXG4jIFx0XHRcdFx0XHRcdFx0aXNBbGxvd2VkID0gZW50aXR5Lm93bmVyID09IEB1c2VySWQgb3IgcGVybWlzc2lvbnMudmlld0FsbFJlY29yZHMgb3IgKHBlcm1pc3Npb25zLnZpZXdDb21wYW55UmVjb3JkcyAmJiBpc1NhbWVDb21wYW55KEB1cmxQYXJhbXMuc3BhY2VJZCwgQHVzZXJJZCwgZW50aXR5LmNvbXBhbnlfaWQpKVxyXG4jIFx0XHRcdFx0XHRcdFx0aWYgb2JqZWN0LmVuYWJsZV9zaGFyZSBhbmQgIWlzQWxsb3dlZFxyXG4jIFx0XHRcdFx0XHRcdFx0XHRzaGFyZXMgPSBbXVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRvcmdzID0gU3RlZWRvcy5nZXRVc2VyT3JnYW5pemF0aW9ucyhAdXJsUGFyYW1zLnNwYWNlSWQsIEB1c2VySWQsIHRydWUpXHJcbiMgXHRcdFx0XHRcdFx0XHRcdHNoYXJlcy5wdXNoIHsgXCJzaGFyaW5nLnVcIjogQHVzZXJJZCB9XHJcbiMgXHRcdFx0XHRcdFx0XHRcdHNoYXJlcy5wdXNoIHsgXCJzaGFyaW5nLm9cIjogeyAkaW46IG9yZ3MgfSB9XHJcbiMgXHRcdFx0XHRcdFx0XHRcdGlzQWxsb3dlZCA9IGNvbGxlY3Rpb24uZmluZE9uZSh7IF9pZDogQHVybFBhcmFtcy5faWQsIFwiJG9yXCI6IHNoYXJlcyB9LCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KVxyXG4jIFx0XHRcdFx0XHRcdFx0aWYgaXNBbGxvd2VkXHJcbiMgXHRcdFx0XHRcdFx0XHRcdGJvZHkgPSB7fVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRoZWFkZXJzID0ge31cclxuIyBcdFx0XHRcdFx0XHRcdFx0ZW50aXRpZXMucHVzaCBlbnRpdHlcclxuIyBcdFx0XHRcdFx0XHRcdFx0ZGVhbFdpdGhFeHBhbmQoY3JlYXRlUXVlcnksIGVudGl0aWVzLCBrZXksIEB1cmxQYXJhbXMuc3BhY2VJZClcclxuIyBcdFx0XHRcdFx0XHRcdFx0Ym9keVsnQG9kYXRhLmNvbnRleHQnXSA9IFN0ZWVkb3NPRGF0YS5nZXRPRGF0YUNvbnRleHRQYXRoKEB1cmxQYXJhbXMuc3BhY2VJZCwga2V5KSArICcvJGVudGl0eSdcclxuIyBcdFx0XHRcdFx0XHRcdFx0ZW50aXR5X09kYXRhUHJvcGVydGllcyA9IHNldE9kYXRhUHJvcGVydHkoZW50aXRpZXMsQHVybFBhcmFtcy5zcGFjZUlkLCBrZXkpXHJcbiMgXHRcdFx0XHRcdFx0XHRcdF8uZXh0ZW5kIGJvZHksZW50aXR5X09kYXRhUHJvcGVydGllc1swXVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRoZWFkZXJzWydDb250ZW50LXR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uO29kYXRhLm1ldGFkYXRhPW1pbmltYWw7Y2hhcnNldD11dGYtOCdcclxuIyBcdFx0XHRcdFx0XHRcdFx0aGVhZGVyc1snT0RhdGEtVmVyc2lvbiddID0gU3RlZWRvc09EYXRhLlZFUlNJT05cclxuIyBcdFx0XHRcdFx0XHRcdFx0e2JvZHk6IGJvZHksIGhlYWRlcnM6IGhlYWRlcnN9XHJcbiMgXHRcdFx0XHRcdFx0XHRlbHNlXHJcbiMgXHRcdFx0XHRcdFx0XHRcdHJldHVybntcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDNcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRib2R5OiBzZXRFcnJvck1lc3NhZ2UoNDAzLGNvbGxlY3Rpb24sa2V5LCdnZXQnKVxyXG4jIFx0XHRcdFx0XHRcdFx0XHR9XHJcbiMgXHRcdFx0XHRcdFx0ZWxzZVxyXG4jIFx0XHRcdFx0XHRcdFx0cmV0dXJue1xyXG4jIFx0XHRcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDRcclxuIyBcdFx0XHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwNCxjb2xsZWN0aW9uLGtleSwnZ2V0JylcclxuIyBcdFx0XHRcdFx0XHRcdH1cclxuIyBcdFx0XHRcdFx0ZWxzZVxyXG4jIFx0XHRcdFx0XHRcdHJldHVybntcclxuIyBcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwM1xyXG4jIFx0XHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwMyxjb2xsZWN0aW9uLGtleSwnZ2V0JylcclxuIyBcdFx0XHRcdFx0XHR9XHJcbiMgXHRcdFx0XHRjYXRjaCBlXHJcbiMgXHRcdFx0XHRcdHJldHVybiBoYW5kbGVFcnJvciBlXHJcblxyXG4jIFx0XHRwdXQ6KCktPlxyXG4jIFx0XHRcdHRyeVxyXG4jIFx0XHRcdFx0a2V5ID0gQHVybFBhcmFtcy5vYmplY3RfbmFtZVxyXG4jIFx0XHRcdFx0b2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3Qoa2V5LCBAdXJsUGFyYW1zLnNwYWNlSWQpXHJcbiMgXHRcdFx0XHRpZiBub3Qgb2JqZWN0Py5lbmFibGVfYXBpXHJcbiMgXHRcdFx0XHRcdHJldHVybntcclxuIyBcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDFcclxuIyBcdFx0XHRcdFx0XHRib2R5OiBzZXRFcnJvck1lc3NhZ2UoNDAxKVxyXG4jIFx0XHRcdFx0XHR9XHJcblxyXG4jIFx0XHRcdFx0Y29sbGVjdGlvbiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihrZXksIEB1cmxQYXJhbXMuc3BhY2VJZClcclxuIyBcdFx0XHRcdGlmIG5vdCBjb2xsZWN0aW9uXHJcbiMgXHRcdFx0XHRcdHJldHVybntcclxuIyBcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDRcclxuIyBcdFx0XHRcdFx0XHRib2R5OiBzZXRFcnJvck1lc3NhZ2UoNDA0LGNvbGxlY3Rpb24sa2V5KVxyXG4jIFx0XHRcdFx0XHR9XHJcbiMgXHRcdFx0XHRzcGFjZUlkID0gQHVybFBhcmFtcy5zcGFjZUlkXHJcbiMgXHRcdFx0XHRwZXJtaXNzaW9ucyA9IENyZWF0b3IuZ2V0T2JqZWN0UGVybWlzc2lvbnMoc3BhY2VJZCwgQHVzZXJJZCwga2V5KVxyXG4jIFx0XHRcdFx0aWYga2V5ID09IFwidXNlcnNcIlxyXG4jIFx0XHRcdFx0XHRyZWNvcmRfb3duZXIgPSBAdXJsUGFyYW1zLl9pZFxyXG4jIFx0XHRcdFx0ZWxzZVxyXG4jIFx0XHRcdFx0XHRyZWNvcmRfb3duZXIgPSBjb2xsZWN0aW9uLmZpbmRPbmUoeyBfaWQ6IEB1cmxQYXJhbXMuX2lkIH0sIHsgZmllbGRzOiB7IG93bmVyOiAxIH0gfSk/Lm93bmVyXHJcblxyXG4jIFx0XHRcdFx0Y29tcGFueUlkID0gY29sbGVjdGlvbi5maW5kT25lKHsgX2lkOiBAdXJsUGFyYW1zLl9pZCB9LCB7IGZpZWxkczogeyBjb21wYW55X2lkOiAxIH0gfSk/LmNvbXBhbnlfaWRcclxuXHJcbiMgXHRcdFx0XHRpc0FsbG93ZWQgPSBwZXJtaXNzaW9ucy5tb2RpZnlBbGxSZWNvcmRzIG9yIChwZXJtaXNzaW9ucy5hbGxvd0VkaXQgYW5kIHJlY29yZF9vd25lciA9PSBAdXNlcklkICkgb3IgKHBlcm1pc3Npb25zLm1vZGlmeUNvbXBhbnlSZWNvcmRzICYmIGlzU2FtZUNvbXBhbnkoc3BhY2VJZCwgQHVzZXJJZCwgY29tcGFueUlkKSlcclxuIyBcdFx0XHRcdGlmIGlzQWxsb3dlZFxyXG4jIFx0XHRcdFx0XHRjaGVja0dsb2JhbFJlY29yZChjb2xsZWN0aW9uLCBAdXJsUGFyYW1zLl9pZCwgb2JqZWN0KVxyXG4jIFx0XHRcdFx0XHRzZWxlY3RvciA9IHtfaWQ6IEB1cmxQYXJhbXMuX2lkLCBzcGFjZTogc3BhY2VJZH1cclxuIyBcdFx0XHRcdFx0aWYgc3BhY2VJZCBpcyAnZ3Vlc3QnIG9yIHNwYWNlSWQgaXMgJ2NvbW1vbicgb3Iga2V5ID09IFwidXNlcnNcIlxyXG4jIFx0XHRcdFx0XHRcdGRlbGV0ZSBzZWxlY3Rvci5zcGFjZVxyXG4jIFx0XHRcdFx0XHRmaWVsZHNfZWRpdGFibGUgPSB0cnVlXHJcbiMgXHRcdFx0XHRcdF8ua2V5cyhAYm9keVBhcmFtcy4kc2V0KS5mb3JFYWNoIChrZXkpLT5cclxuIyBcdFx0XHRcdFx0XHRpZiBfLmluZGV4T2YocGVybWlzc2lvbnMudW5lZGl0YWJsZV9maWVsZHMsIGtleSkgPiAtMVxyXG4jIFx0XHRcdFx0XHRcdFx0ZmllbGRzX2VkaXRhYmxlID0gZmFsc2VcclxuIyBcdFx0XHRcdFx0aWYgZmllbGRzX2VkaXRhYmxlXHJcbiMgXHRcdFx0XHRcdFx0aWYga2V5IGlzICdzcGFjZXMnXHJcbiMgXHRcdFx0XHRcdFx0XHRkZWxldGUgc2VsZWN0b3Iuc3BhY2VcclxuIyBcdFx0XHRcdFx0XHRlbnRpdHlJc1VwZGF0ZWQgPSBjb2xsZWN0aW9uLnVwZGF0ZSBzZWxlY3RvciwgQGJvZHlQYXJhbXNcclxuIyBcdFx0XHRcdFx0XHRpZiBlbnRpdHlJc1VwZGF0ZWRcclxuIyBcdFx0XHRcdFx0XHRcdCNzdGF0dXNDb2RlOiAyMDFcclxuIyBcdFx0XHRcdFx0XHRcdCMgZW50aXR5ID0gY29sbGVjdGlvbi5maW5kT25lIEB1cmxQYXJhbXMuX2lkXHJcbiMgXHRcdFx0XHRcdFx0XHQjIGVudGl0aWVzID0gW11cclxuIyBcdFx0XHRcdFx0XHRcdCMgYm9keSA9IHt9XHJcbiMgXHRcdFx0XHRcdFx0XHRoZWFkZXJzID0ge31cclxuIyBcdFx0XHRcdFx0XHRcdGJvZHkgPSB7fVxyXG4jIFx0XHRcdFx0XHRcdFx0IyBlbnRpdGllcy5wdXNoIGVudGl0eVxyXG4jIFx0XHRcdFx0XHRcdFx0IyBib2R5WydAb2RhdGEuY29udGV4dCddID0gU3RlZWRvc09EYXRhLmdldE9EYXRhQ29udGV4dFBhdGgoc3BhY2VJZCwga2V5KSArICcvJGVudGl0eSdcclxuIyBcdFx0XHRcdFx0XHRcdCMgZW50aXR5X09kYXRhUHJvcGVydGllcyA9IHNldE9kYXRhUHJvcGVydHkoZW50aXRpZXMsc3BhY2VJZCwga2V5KVxyXG4jIFx0XHRcdFx0XHRcdFx0IyBfLmV4dGVuZCBib2R5LGVudGl0eV9PZGF0YVByb3BlcnRpZXNbMF1cclxuIyBcdFx0XHRcdFx0XHRcdGhlYWRlcnNbJ0NvbnRlbnQtdHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb247b2RhdGEubWV0YWRhdGE9bWluaW1hbDtjaGFyc2V0PXV0Zi04J1xyXG4jIFx0XHRcdFx0XHRcdFx0aGVhZGVyc1snT0RhdGEtVmVyc2lvbiddID0gU3RlZWRvc09EYXRhLlZFUlNJT05cclxuIyBcdFx0XHRcdFx0XHRcdHtoZWFkZXJzOiBoZWFkZXJzLGJvZHk6Ym9keX1cclxuIyBcdFx0XHRcdFx0XHRlbHNlXHJcbiMgXHRcdFx0XHRcdFx0XHRyZXR1cm57XHJcbiMgXHRcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxyXG4jIFx0XHRcdFx0XHRcdFx0XHRib2R5OiBzZXRFcnJvck1lc3NhZ2UoNDA0LGNvbGxlY3Rpb24sa2V5KVxyXG4jIFx0XHRcdFx0XHRcdFx0fVxyXG4jIFx0XHRcdFx0XHRlbHNlXHJcbiMgXHRcdFx0XHRcdFx0cmV0dXJue1xyXG4jIFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDAzXHJcbiMgXHRcdFx0XHRcdFx0XHRib2R5OiBzZXRFcnJvck1lc3NhZ2UoNDAzLGNvbGxlY3Rpb24sa2V5LCdwdXQnKVxyXG4jIFx0XHRcdFx0XHRcdH1cclxuIyBcdFx0XHRcdGVsc2VcclxuIyBcdFx0XHRcdFx0cmV0dXJue1xyXG4jIFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwM1xyXG4jIFx0XHRcdFx0XHRcdGJvZHk6IHNldEVycm9yTWVzc2FnZSg0MDMsY29sbGVjdGlvbixrZXksJ3B1dCcpXHJcbiMgXHRcdFx0XHRcdH1cclxuIyBcdFx0XHRjYXRjaCBlXHJcbiMgXHRcdFx0XHRyZXR1cm4gaGFuZGxlRXJyb3IgZVxyXG4jIFx0XHRkZWxldGU6KCktPlxyXG4jIFx0XHRcdHRyeVxyXG4jIFx0XHRcdFx0a2V5ID0gQHVybFBhcmFtcy5vYmplY3RfbmFtZVxyXG4jIFx0XHRcdFx0b2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3Qoa2V5LCBAdXJsUGFyYW1zLnNwYWNlSWQpXHJcbiMgXHRcdFx0XHRpZiBub3Qgb2JqZWN0Py5lbmFibGVfYXBpXHJcbiMgXHRcdFx0XHRcdHJldHVybntcclxuIyBcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDFcclxuIyBcdFx0XHRcdFx0XHRib2R5OiBzZXRFcnJvck1lc3NhZ2UoNDAxKVxyXG4jIFx0XHRcdFx0XHRcdH1cclxuXHJcbiMgXHRcdFx0XHRjb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKGtleSwgQHVybFBhcmFtcy5zcGFjZUlkKVxyXG4jIFx0XHRcdFx0aWYgbm90IGNvbGxlY3Rpb25cclxuIyBcdFx0XHRcdFx0cmV0dXJue1xyXG4jIFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxyXG4jIFx0XHRcdFx0XHRcdGJvZHk6IHNldEVycm9yTWVzc2FnZSg0MDQsY29sbGVjdGlvbixrZXkpXHJcbiMgXHRcdFx0XHRcdH1cclxuIyBcdFx0XHRcdHNwYWNlSWQgPSBAdXJsUGFyYW1zLnNwYWNlSWRcclxuIyBcdFx0XHRcdHBlcm1pc3Npb25zID0gQ3JlYXRvci5nZXRPYmplY3RQZXJtaXNzaW9ucyhAdXJsUGFyYW1zLnNwYWNlSWQsIEB1c2VySWQsIGtleSlcclxuIyBcdFx0XHRcdHJlY29yZERhdGEgPSBjb2xsZWN0aW9uLmZpbmRPbmUoe19pZDogQHVybFBhcmFtcy5faWR9LCB7IGZpZWxkczogeyBvd25lcjogMSwgY29tcGFueV9pZDogMSB9IH0pXHJcbiMgXHRcdFx0XHRyZWNvcmRfb3duZXIgPSByZWNvcmREYXRhPy5vd25lclxyXG4jIFx0XHRcdFx0Y29tcGFueUlkID0gcmVjb3JkRGF0YT8uY29tcGFueV9pZFxyXG4jIFx0XHRcdFx0aXNBbGxvd2VkID0gKHBlcm1pc3Npb25zLm1vZGlmeUFsbFJlY29yZHMgYW5kIHBlcm1pc3Npb25zLmFsbG93RGVsZXRlKSBvciAocGVybWlzc2lvbnMubW9kaWZ5Q29tcGFueVJlY29yZHMgYW5kIHBlcm1pc3Npb25zLmFsbG93RGVsZXRlIGFuZCBpc1NhbWVDb21wYW55KHNwYWNlSWQsIEB1c2VySWQsIGNvbXBhbnlJZCkpIG9yIChwZXJtaXNzaW9ucy5hbGxvd0RlbGV0ZSBhbmQgcmVjb3JkX293bmVyPT1AdXNlcklkIClcclxuIyBcdFx0XHRcdGlmIGlzQWxsb3dlZFxyXG4jIFx0XHRcdFx0XHRjaGVja0dsb2JhbFJlY29yZChjb2xsZWN0aW9uLCBAdXJsUGFyYW1zLl9pZCwgb2JqZWN0KVxyXG4jIFx0XHRcdFx0XHRzZWxlY3RvciA9IHtfaWQ6IEB1cmxQYXJhbXMuX2lkLCBzcGFjZTogc3BhY2VJZH1cclxuIyBcdFx0XHRcdFx0aWYgc3BhY2VJZCBpcyAnZ3Vlc3QnXHJcbiMgXHRcdFx0XHRcdFx0ZGVsZXRlIHNlbGVjdG9yLnNwYWNlXHJcblxyXG4jIFx0XHRcdFx0XHRpZiBvYmplY3Q/LmVuYWJsZV90cmFzaFxyXG4jIFx0XHRcdFx0XHRcdGVudGl0eUlzVXBkYXRlZCA9IGNvbGxlY3Rpb24udXBkYXRlKHNlbGVjdG9yLCB7XHJcbiMgXHRcdFx0XHRcdFx0XHQkc2V0OiB7XHJcbiMgXHRcdFx0XHRcdFx0XHRcdGlzX2RlbGV0ZWQ6IHRydWUsXHJcbiMgXHRcdFx0XHRcdFx0XHRcdGRlbGV0ZWQ6IG5ldyBEYXRlKCksXHJcbiMgXHRcdFx0XHRcdFx0XHRcdGRlbGV0ZWRfYnk6IEB1c2VySWRcclxuIyBcdFx0XHRcdFx0XHRcdH1cclxuIyBcdFx0XHRcdFx0XHR9KVxyXG4jIFx0XHRcdFx0XHRcdGlmIGVudGl0eUlzVXBkYXRlZFxyXG4jIFx0XHRcdFx0XHRcdFx0aGVhZGVycyA9IHt9XHJcbiMgXHRcdFx0XHRcdFx0XHRib2R5ID0ge31cclxuIyBcdFx0XHRcdFx0XHRcdGhlYWRlcnNbJ0NvbnRlbnQtdHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb247b2RhdGEubWV0YWRhdGE9bWluaW1hbDtjaGFyc2V0PXV0Zi04J1xyXG4jIFx0XHRcdFx0XHRcdFx0aGVhZGVyc1snT0RhdGEtVmVyc2lvbiddID0gU3RlZWRvc09EYXRhLlZFUlNJT05cclxuIyBcdFx0XHRcdFx0XHRcdHtoZWFkZXJzOiBoZWFkZXJzLGJvZHk6Ym9keX1cclxuIyBcdFx0XHRcdFx0XHRlbHNlXHJcbiMgXHRcdFx0XHRcdFx0XHRyZXR1cm57XHJcbiMgXHRcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxyXG4jIFx0XHRcdFx0XHRcdFx0XHRib2R5OiBzZXRFcnJvck1lc3NhZ2UoNDA0LGNvbGxlY3Rpb24sa2V5KVxyXG4jIFx0XHRcdFx0XHRcdFx0fVxyXG4jIFx0XHRcdFx0XHRlbHNlXHJcbiMgXHRcdFx0XHRcdFx0aWYgY29sbGVjdGlvbi5yZW1vdmUgc2VsZWN0b3JcclxuIyBcdFx0XHRcdFx0XHRcdGhlYWRlcnMgPSB7fVxyXG4jIFx0XHRcdFx0XHRcdFx0Ym9keSA9IHt9XHJcbiMgXHRcdFx0XHRcdFx0XHQjIGVudGl0aWVzLnB1c2ggZW50aXR5XHJcbiMgXHRcdFx0XHRcdFx0XHQjIGJvZHlbJ0BvZGF0YS5jb250ZXh0J10gPSBTdGVlZG9zT0RhdGEuZ2V0T0RhdGFDb250ZXh0UGF0aChzcGFjZUlkLCBrZXkpICsgJy8kZW50aXR5J1xyXG4jIFx0XHRcdFx0XHRcdFx0IyBlbnRpdHlfT2RhdGFQcm9wZXJ0aWVzID0gc2V0T2RhdGFQcm9wZXJ0eShlbnRpdGllcyxzcGFjZUlkLCBrZXkpXHJcbiMgXHRcdFx0XHRcdFx0XHQjIF8uZXh0ZW5kIGJvZHksZW50aXR5X09kYXRhUHJvcGVydGllc1swXVxyXG4jIFx0XHRcdFx0XHRcdFx0aGVhZGVyc1snQ29udGVudC10eXBlJ10gPSAnYXBwbGljYXRpb24vanNvbjtvZGF0YS5tZXRhZGF0YT1taW5pbWFsO2NoYXJzZXQ9dXRmLTgnXHJcbiMgXHRcdFx0XHRcdFx0XHRoZWFkZXJzWydPRGF0YS1WZXJzaW9uJ10gPSBTdGVlZG9zT0RhdGEuVkVSU0lPTlxyXG4jIFx0XHRcdFx0XHRcdFx0e2hlYWRlcnM6IGhlYWRlcnMsYm9keTpib2R5fVxyXG4jIFx0XHRcdFx0XHRcdGVsc2VcclxuIyBcdFx0XHRcdFx0XHRcdHJldHVybntcclxuIyBcdFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XHJcbiMgXHRcdFx0XHRcdFx0XHRcdGJvZHk6IHNldEVycm9yTWVzc2FnZSg0MDQsY29sbGVjdGlvbixrZXkpXHJcbiMgXHRcdFx0XHRcdFx0XHR9XHJcbiMgXHRcdFx0XHRlbHNlXHJcbiMgXHRcdFx0XHRcdHJldHVybiB7XHJcbiMgXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDAzXHJcbiMgXHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwMyxjb2xsZWN0aW9uLGtleSlcclxuIyBcdFx0XHRcdFx0fVxyXG4jIFx0XHRcdGNhdGNoIGVcclxuIyBcdFx0XHRcdHJldHVybiBoYW5kbGVFcnJvciBlXHJcbiMgXHR9KVxyXG5cclxuIyBcdCMgX2lk5Y+v5LygYWxsXHJcbiMgXHRTdGVlZG9zT2RhdGFBUEkuYWRkUm91dGUoJzpvYmplY3RfbmFtZS86X2lkLzptZXRob2ROYW1lJywge2F1dGhSZXF1aXJlZDogdHJ1ZSwgc3BhY2VSZXF1aXJlZDogZmFsc2V9LCB7XHJcbiMgXHRcdHBvc3Q6ICgpLT5cclxuIyBcdFx0XHR0cnlcclxuIyBcdFx0XHRcdGtleSA9IEB1cmxQYXJhbXMub2JqZWN0X25hbWVcclxuIyBcdFx0XHRcdGlmIG5vdCBDcmVhdG9yLmdldE9iamVjdChrZXksIEB1cmxQYXJhbXMuc3BhY2VJZCk/LmVuYWJsZV9hcGlcclxuIyBcdFx0XHRcdFx0cmV0dXJue1xyXG4jIFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwMVxyXG4jIFx0XHRcdFx0XHRcdGJvZHk6IHNldEVycm9yTWVzc2FnZSg0MDEpXHJcbiMgXHRcdFx0XHRcdH1cclxuIyBcdFx0XHRcdGNvbGxlY3Rpb24gPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oa2V5LCBAdXJsUGFyYW1zLnNwYWNlSWQpXHJcbiMgXHRcdFx0XHRpZiBub3QgY29sbGVjdGlvblxyXG4jIFx0XHRcdFx0XHRyZXR1cm57XHJcbiMgXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XHJcbiMgXHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwNCxjb2xsZWN0aW9uLGtleSlcclxuIyBcdFx0XHRcdFx0fVxyXG5cclxuIyBcdFx0XHRcdHBlcm1pc3Npb25zID0gQ3JlYXRvci5nZXRPYmplY3RQZXJtaXNzaW9ucyhAdXJsUGFyYW1zLnNwYWNlSWQsIEB1c2VySWQsIGtleSlcclxuIyBcdFx0XHRcdGlmIHBlcm1pc3Npb25zLmFsbG93UmVhZFxyXG4jIFx0XHRcdFx0XHRtZXRob2ROYW1lID0gQHVybFBhcmFtcy5tZXRob2ROYW1lXHJcbiMgXHRcdFx0XHRcdG1ldGhvZHMgPSBDcmVhdG9yLk9iamVjdHNba2V5XT8ubWV0aG9kcyB8fCB7fVxyXG4jIFx0XHRcdFx0XHRpZiBtZXRob2RzLmhhc093blByb3BlcnR5KG1ldGhvZE5hbWUpXHJcbiMgXHRcdFx0XHRcdFx0dGhpc09iaiA9IHtcclxuIyBcdFx0XHRcdFx0XHRcdG9iamVjdF9uYW1lOiBrZXlcclxuIyBcdFx0XHRcdFx0XHRcdHJlY29yZF9pZDogQHVybFBhcmFtcy5faWRcclxuIyBcdFx0XHRcdFx0XHRcdHNwYWNlX2lkOiBAdXJsUGFyYW1zLnNwYWNlSWRcclxuIyBcdFx0XHRcdFx0XHRcdHVzZXJfaWQ6IEB1c2VySWRcclxuIyBcdFx0XHRcdFx0XHRcdHBlcm1pc3Npb25zOiBwZXJtaXNzaW9uc1xyXG4jIFx0XHRcdFx0XHRcdH1cclxuIyBcdFx0XHRcdFx0XHRyZXR1cm4gbWV0aG9kc1ttZXRob2ROYW1lXS5hcHBseSh0aGlzT2JqLCBbQGJvZHlQYXJhbXNdKSB8fCB7fVxyXG4jIFx0XHRcdFx0XHRlbHNlXHJcbiMgXHRcdFx0XHRcdFx0cmV0dXJuIHtcclxuIyBcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxyXG4jIFx0XHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwNCxjb2xsZWN0aW9uLGtleSlcclxuIyBcdFx0XHRcdFx0XHR9XHJcbiMgXHRcdFx0XHRlbHNlXHJcbiMgXHRcdFx0XHRcdHJldHVybiB7XHJcbiMgXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDAzXHJcbiMgXHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwMyxjb2xsZWN0aW9uLGtleSlcclxuIyBcdFx0XHRcdFx0fVxyXG4jIFx0XHRcdGNhdGNoIGVcclxuIyBcdFx0XHRcdHJldHVybiBoYW5kbGVFcnJvciBlXHJcblxyXG4jIFx0fSlcclxuXHJcbiMgXHQjVE9ETyByZW1vdmVcclxuIyBcdF8uZWFjaCBbXSwgKHZhbHVlLCBrZXksIGxpc3QpLT4gI0NyZWF0b3IuQ29sbGVjdGlvbnNcclxuIyBcdFx0aWYgbm90IENyZWF0b3IuZ2V0T2JqZWN0KGtleSk/LmVuYWJsZV9hcGlcclxuIyBcdFx0XHRyZXR1cm5cclxuXHJcbiMgXHRcdGlmIFN0ZWVkb3NPZGF0YUFQSVxyXG5cclxuIyBcdFx0XHRTdGVlZG9zT2RhdGFBUEkuYWRkQ29sbGVjdGlvbiBDcmVhdG9yLmdldENvbGxlY3Rpb24oa2V5KSxcclxuIyBcdFx0XHRcdGV4Y2x1ZGVkRW5kcG9pbnRzOiBbXVxyXG4jIFx0XHRcdFx0cm91dGVPcHRpb25zOlxyXG4jIFx0XHRcdFx0XHRhdXRoUmVxdWlyZWQ6IHRydWVcclxuIyBcdFx0XHRcdFx0c3BhY2VSZXF1aXJlZDogZmFsc2VcclxuIyBcdFx0XHRcdGVuZHBvaW50czpcclxuIyBcdFx0XHRcdFx0Z2V0QWxsOlxyXG4jIFx0XHRcdFx0XHRcdGFjdGlvbjogLT5cclxuIyBcdFx0XHRcdFx0XHRcdGNvbGxlY3Rpb24gPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oa2V5KVxyXG4jIFx0XHRcdFx0XHRcdFx0aWYgbm90IGNvbGxlY3Rpb25cclxuIyBcdFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XHJcbiMgXHRcdFx0XHRcdFx0XHRcdGJvZHk6IHtzdGF0dXM6ICdmYWlsJywgbWVzc2FnZTogJ0NvbGxlY3Rpb24gbm90IGZvdW5kJ31cclxuXHJcbiMgXHRcdFx0XHRcdFx0XHRwZXJtaXNzaW9ucyA9IENyZWF0b3IuZ2V0T2JqZWN0UGVybWlzc2lvbnMoQHVybFBhcmFtcy5zcGFjZUlkLCBAdXNlcklkLCBrZXkpXHJcbiMgXHRcdFx0XHRcdFx0XHRpZiBwZXJtaXNzaW9ucy52aWV3QWxsUmVjb3JkcyBvciAocGVybWlzc2lvbnMuYWxsb3dSZWFkIGFuZCBAdXNlcklkKVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdHJlbW92ZUludmFsaWRNZXRob2QoQHF1ZXJ5UGFyYW1zKVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdHFzID0gZGVjb2RlVVJJQ29tcG9uZW50KHF1ZXJ5c3RyaW5nLnN0cmluZ2lmeShAcXVlcnlQYXJhbXMpKVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGNyZWF0ZVF1ZXJ5ID0gaWYgcXMgdGhlbiBvZGF0YVY0TW9uZ29kYi5jcmVhdGVRdWVyeShxcykgZWxzZSBvZGF0YVY0TW9uZ29kYi5jcmVhdGVRdWVyeSgpXHJcblxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGlmIGtleSBpcyAnY2ZzLmZpbGVzLmZpbGVyZWNvcmQnXHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5xdWVyeVsnbWV0YWRhdGEuc3BhY2UnXSA9IEB1cmxQYXJhbXMuc3BhY2VJZFxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGVsc2VcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdGNyZWF0ZVF1ZXJ5LnF1ZXJ5LnNwYWNlID0gQHVybFBhcmFtcy5zcGFjZUlkXHJcblxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGlmIG5vdCBwZXJtaXNzaW9ucy52aWV3QWxsUmVjb3Jkc1xyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0Y3JlYXRlUXVlcnkucXVlcnkub3duZXIgPSBAdXNlcklkXHJcblxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGVudGl0aWVzID0gW11cclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRpZiBAcXVlcnlQYXJhbXMuJHRvcCBpc250ICcwJ1xyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0ZW50aXRpZXMgPSBjb2xsZWN0aW9uLmZpbmQoY3JlYXRlUXVlcnkucXVlcnksIHZpc2l0b3JQYXJzZXIoY3JlYXRlUXVlcnkpKS5mZXRjaCgpXHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0c2Nhbm5lZENvdW50ID0gY29sbGVjdGlvbi5maW5kKGNyZWF0ZVF1ZXJ5LnF1ZXJ5KS5jb3VudCgpXHJcblxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGlmIGVudGl0aWVzXHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRkZWFsV2l0aEV4cGFuZChjcmVhdGVRdWVyeSwgZW50aXRpZXMsIGtleSwgQHVybFBhcmFtcy5zcGFjZUlkKVxyXG5cclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdGJvZHkgPSB7fVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0aGVhZGVycyA9IHt9XHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRib2R5WydAb2RhdGEuY29udGV4dCddID0gU3RlZWRvc09EYXRhLmdldE9EYXRhQ29udGV4dFBhdGgoQHVybFBhcmFtcy5zcGFjZUlkLCBrZXkpXHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRib2R5WydAb2RhdGEuY291bnQnXSA9IHNjYW5uZWRDb3VudFxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0Ym9keVsndmFsdWUnXSA9IGVudGl0aWVzXHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRoZWFkZXJzWydDb250ZW50LXR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uO29kYXRhLm1ldGFkYXRhPW1pbmltYWw7Y2hhcnNldD11dGYtOCdcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdGhlYWRlcnNbJ09EYXRhLVZlcnNpb24nXSA9IFN0ZWVkb3NPRGF0YS5WRVJTSU9OXHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHR7Ym9keTogYm9keSwgaGVhZGVyczogaGVhZGVyc31cclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRlbHNlXHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDRcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdGJvZHk6IHtzdGF0dXM6ICdmYWlsJywgbWVzc2FnZTogJ1VuYWJsZSB0byByZXRyaWV2ZSBpdGVtcyBmcm9tIGNvbGxlY3Rpb24nfVxyXG4jIFx0XHRcdFx0XHRcdFx0ZWxzZVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDBcclxuIyBcdFx0XHRcdFx0XHRcdFx0Ym9keToge3N0YXR1czogJ2ZhaWwnLCBtZXNzYWdlOiAnQWN0aW9uIG5vdCBwZXJtaXR0ZWQnfVxyXG4jIFx0XHRcdFx0XHRwb3N0OlxyXG4jIFx0XHRcdFx0XHRcdGFjdGlvbjogLT5cclxuIyBcdFx0XHRcdFx0XHRcdGNvbGxlY3Rpb24gPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oa2V5KVxyXG4jIFx0XHRcdFx0XHRcdFx0aWYgbm90IGNvbGxlY3Rpb25cclxuIyBcdFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XHJcbiMgXHRcdFx0XHRcdFx0XHRcdGJvZHk6IHtzdGF0dXM6ICdmYWlsJywgbWVzc2FnZTogJ0NvbGxlY3Rpb24gbm90IGZvdW5kJ31cclxuXHJcbiMgXHRcdFx0XHRcdFx0XHRwZXJtaXNzaW9ucyA9IENyZWF0b3IuZ2V0T2JqZWN0UGVybWlzc2lvbnMoQHNwYWNlSWQsIEB1c2VySWQsIGtleSlcclxuIyBcdFx0XHRcdFx0XHRcdGlmIHBlcm1pc3Npb25zLmFsbG93Q3JlYXRlXHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0QGJvZHlQYXJhbXMuc3BhY2UgPSBAc3BhY2VJZFxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGVudGl0eUlkID0gY29sbGVjdGlvbi5pbnNlcnQgQGJvZHlQYXJhbXNcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRlbnRpdHkgPSBjb2xsZWN0aW9uLmZpbmRPbmUgZW50aXR5SWRcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRpZiBlbnRpdHlcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDIwMVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0e3N0YXR1czogJ3N1Y2Nlc3MnLCB2YWx1ZTogZW50aXR5fVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGVsc2VcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0Ym9keToge3N0YXR1czogJ2ZhaWwnLCBtZXNzYWdlOiAnTm8gaXRlbSBhZGRlZCd9XHJcbiMgXHRcdFx0XHRcdFx0XHRlbHNlXHJcbiMgXHRcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwMFxyXG4jIFx0XHRcdFx0XHRcdFx0XHRib2R5OiB7c3RhdHVzOiAnZmFpbCcsIG1lc3NhZ2U6ICdBY3Rpb24gbm90IHBlcm1pdHRlZCd9XHJcbiMgXHRcdFx0XHRcdGdldDpcclxuIyBcdFx0XHRcdFx0XHRhY3Rpb246IC0+XHJcbiMgXHRcdFx0XHRcdFx0XHRjb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKGtleSlcclxuIyBcdFx0XHRcdFx0XHRcdGlmIG5vdCBjb2xsZWN0aW9uXHJcbiMgXHRcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxyXG4jIFx0XHRcdFx0XHRcdFx0XHRib2R5OiB7c3RhdHVzOiAnZmFpbCcsIG1lc3NhZ2U6ICdDb2xsZWN0aW9uIG5vdCBmb3VuZCd9XHJcblxyXG4jIFx0XHRcdFx0XHRcdFx0cGVybWlzc2lvbnMgPSBDcmVhdG9yLmdldE9iamVjdFBlcm1pc3Npb25zKEBzcGFjZUlkLCBAdXNlcklkLCBrZXkpXHJcbiMgXHRcdFx0XHRcdFx0XHRpZiBwZXJtaXNzaW9ucy5hbGxvd1JlYWRcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRzZWxlY3RvciA9IHtfaWQ6IEB1cmxQYXJhbXMuaWQsIHNwYWNlOiBAc3BhY2VJZH1cclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRlbnRpdHkgPSBjb2xsZWN0aW9uLmZpbmRPbmUgc2VsZWN0b3JcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRpZiBlbnRpdHlcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdHtzdGF0dXM6ICdzdWNjZXNzJywgdmFsdWU6IGVudGl0eX1cclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRlbHNlXHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDRcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdGJvZHk6IHtzdGF0dXM6ICdmYWlsJywgbWVzc2FnZTogJ0l0ZW0gbm90IGZvdW5kJ31cclxuIyBcdFx0XHRcdFx0XHRcdGVsc2VcclxuIyBcdFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDAwXHJcbiMgXHRcdFx0XHRcdFx0XHRcdGJvZHk6IHtzdGF0dXM6ICdmYWlsJywgbWVzc2FnZTogJ0FjdGlvbiBub3QgcGVybWl0dGVkJ31cclxuIyBcdFx0XHRcdFx0cHV0OlxyXG4jIFx0XHRcdFx0XHRcdGFjdGlvbjogLT5cclxuIyBcdFx0XHRcdFx0XHRcdGNvbGxlY3Rpb24gPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oa2V5KVxyXG4jIFx0XHRcdFx0XHRcdFx0aWYgbm90IGNvbGxlY3Rpb25cclxuIyBcdFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XHJcbiMgXHRcdFx0XHRcdFx0XHRcdGJvZHk6IHtzdGF0dXM6ICdmYWlsJywgbWVzc2FnZTogJ0NvbGxlY3Rpb24gbm90IGZvdW5kJ31cclxuXHJcbiMgXHRcdFx0XHRcdFx0XHRwZXJtaXNzaW9ucyA9IENyZWF0b3IuZ2V0T2JqZWN0UGVybWlzc2lvbnMoQHNwYWNlSWQsIEB1c2VySWQsIGtleSlcclxuIyBcdFx0XHRcdFx0XHRcdGlmIHBlcm1pc3Npb25zLmFsbG93RWRpdFxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdHNlbGVjdG9yID0ge19pZDogQHVybFBhcmFtcy5pZCwgc3BhY2U6IEBzcGFjZUlkfVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGVudGl0eUlzVXBkYXRlZCA9IGNvbGxlY3Rpb24udXBkYXRlIHNlbGVjdG9yLCAkc2V0OiBAYm9keVBhcmFtc1xyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGlmIGVudGl0eUlzVXBkYXRlZFxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0ZW50aXR5ID0gY29sbGVjdGlvbi5maW5kT25lIEB1cmxQYXJhbXMuaWRcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdHtzdGF0dXM6ICdzdWNjZXNzJywgdmFsdWU6IGVudGl0eX1cclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRlbHNlXHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDRcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdGJvZHk6IHtzdGF0dXM6ICdmYWlsJywgbWVzc2FnZTogJ0l0ZW0gbm90IGZvdW5kJ31cclxuIyBcdFx0XHRcdFx0XHRcdGVsc2VcclxuIyBcdFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDAwXHJcbiMgXHRcdFx0XHRcdFx0XHRcdGJvZHk6IHtzdGF0dXM6ICdmYWlsJywgbWVzc2FnZTogJ0FjdGlvbiBub3QgcGVybWl0dGVkJ31cclxuIyBcdFx0XHRcdFx0ZGVsZXRlOlxyXG4jIFx0XHRcdFx0XHRcdGFjdGlvbjogLT5cclxuIyBcdFx0XHRcdFx0XHRcdGNvbGxlY3Rpb24gPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oa2V5KVxyXG4jIFx0XHRcdFx0XHRcdFx0aWYgbm90IGNvbGxlY3Rpb25cclxuIyBcdFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XHJcbiMgXHRcdFx0XHRcdFx0XHRcdGJvZHk6IHtzdGF0dXM6ICdmYWlsJywgbWVzc2FnZTogJ0NvbGxlY3Rpb24gbm90IGZvdW5kJ31cclxuXHJcbiMgXHRcdFx0XHRcdFx0XHRwZXJtaXNzaW9ucyA9IENyZWF0b3IuZ2V0T2JqZWN0UGVybWlzc2lvbnMoQHNwYWNlSWQsIEB1c2VySWQsIGtleSlcclxuIyBcdFx0XHRcdFx0XHRcdGlmIHBlcm1pc3Npb25zLmFsbG93RGVsZXRlXHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0c2VsZWN0b3IgPSB7X2lkOiBAdXJsUGFyYW1zLmlkLCBzcGFjZTogQHNwYWNlSWR9XHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0aWYgY29sbGVjdGlvbi5yZW1vdmUgc2VsZWN0b3JcclxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdHtzdGF0dXM6ICdzdWNjZXNzJywgbWVzc2FnZTogJ0l0ZW0gcmVtb3ZlZCd9XHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0ZWxzZVxyXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XHJcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRib2R5OiB7c3RhdHVzOiAnZmFpbCcsIG1lc3NhZ2U6ICdJdGVtIG5vdCBmb3VuZCd9XHJcbiMgXHRcdFx0XHRcdFx0XHRlbHNlXHJcbiMgXHRcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwMFxyXG4jIFx0XHRcdFx0XHRcdFx0XHRib2R5OiB7c3RhdHVzOiAnZmFpbCcsIG1lc3NhZ2U6ICdBY3Rpb24gbm90IHBlcm1pdHRlZCd9XHJcbiIsIk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuICB2YXIgTWV0ZW9yT0RhdGFBUElWNFJvdXRlciwgTWV0ZW9yT0RhdGFSb3V0ZXIsIE9EYXRhUm91dGVyLCBhcHAsIGV4cHJlc3M7XG4gIE1ldGVvck9EYXRhUm91dGVyID0gcmVxdWlyZSgnQHN0ZWVkb3MvY29yZScpLk1ldGVvck9EYXRhUm91dGVyO1xuICBPRGF0YVJvdXRlciA9IHJlcXVpcmUoJ0BzdGVlZG9zL2NvcmUnKS5PRGF0YVJvdXRlcjtcbiAgZXhwcmVzcyA9IHJlcXVpcmUoJ2V4cHJlc3MnKTtcbiAgYXBwID0gZXhwcmVzcygpO1xuICBhcHAudXNlKCcvYXBpL29kYXRhL3Y0JywgTWV0ZW9yT0RhdGFSb3V0ZXIpO1xuICBNZXRlb3JPRGF0YUFQSVY0Um91dGVyID0gcmVxdWlyZSgnQHN0ZWVkb3MvY29yZScpLk1ldGVvck9EYXRhQVBJVjRSb3V0ZXI7XG4gIGlmIChNZXRlb3JPRGF0YUFQSVY0Um91dGVyKSB7XG4gICAgYXBwLnVzZSgnL2FwaS92NCcsIE1ldGVvck9EYXRhQVBJVjRSb3V0ZXIpO1xuICB9XG4gIFdlYkFwcC5jb25uZWN0SGFuZGxlcnMudXNlKGFwcCk7XG4gIHJldHVybiBfLmVhY2goQ3JlYXRvci5zdGVlZG9zU2NoZW1hLmdldERhdGFTb3VyY2VzKCksIGZ1bmN0aW9uKGRhdGFzb3VyY2UsIG5hbWUpIHtcbiAgICB2YXIgb3RoZXJBcHA7XG4gICAgaWYgKG5hbWUgIT09ICdkZWZhdWx0Jykge1xuICAgICAgb3RoZXJBcHAgPSBleHByZXNzKCk7XG4gICAgICBvdGhlckFwcC51c2UoXCIvYXBpL29kYXRhL1wiICsgbmFtZSwgT0RhdGFSb3V0ZXIpO1xuICAgICAgcmV0dXJuIFdlYkFwcC5jb25uZWN0SGFuZGxlcnMudXNlKG90aGVyQXBwKTtcbiAgICB9XG4gIH0pO1xufSk7XG4iLCJGaWJlciA9IHJlcXVpcmUoJ2ZpYmVycycpXHJcblxyXG5iYXNpY0F1dGggPSByZXF1aXJlKCdiYXNpYy1hdXRoJylcclxuXHJcbmF1dGhvcml6YXRpb25DYWNoZSA9IHt9XHJcblxyXG5Kc29uUm91dGVzLk1pZGRsZXdhcmUudXNlICcvYXBpL29kYXRhL3Y0LycsIChyZXEsIHJlcywgbmV4dCktPlxyXG5cclxuXHRGaWJlcigoKS0+XHJcblx0XHRpZiAhcmVxLnVzZXJJZFxyXG5cdFx0XHRpc0F1dGhlZCA9IGZhbHNlXHJcblx0XHRcdCMgb2F1dGgy6aqM6K+BXHJcblx0XHRcdGlmIHJlcT8ucXVlcnk/LmFjY2Vzc190b2tlblxyXG5cdFx0XHRcdGNvbnNvbGUubG9nICdPQXV0aDI6ICcsIHJlcS5xdWVyeS5hY2Nlc3NfdG9rZW5cclxuXHRcdFx0XHR1c2VySWQgPSBTdGVlZG9zLmdldFVzZXJJZEZyb21BY2Nlc3NUb2tlbihyZXEucXVlcnkuYWNjZXNzX3Rva2VuKVxyXG5cdFx0XHRcdGlmIHVzZXJJZFxyXG5cdFx0XHRcdFx0dXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHtfaWQ6IHVzZXJJZH0pXHJcblx0XHRcdFx0XHRpZiB1c2VyXHJcblx0XHRcdFx0XHRcdGlzQXV0aGVkID0gdHJ1ZVxyXG5cdFx0XHQjIGJhc2lj6aqM6K+BXHJcblx0XHRcdGlmIHJlcS5oZWFkZXJzWydhdXRob3JpemF0aW9uJ11cclxuXHRcdFx0XHRhdXRoID0gYmFzaWNBdXRoLnBhcnNlKHJlcS5oZWFkZXJzWydhdXRob3JpemF0aW9uJ10pXHJcblx0XHRcdFx0aWYgYXV0aFxyXG5cdFx0XHRcdFx0dXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHt1c2VybmFtZTogYXV0aC5uYW1lfSwgeyBmaWVsZHM6IHsgJ3NlcnZpY2VzJzogMSB9IH0pXHJcblx0XHRcdFx0XHRpZiB1c2VyXHJcblx0XHRcdFx0XHRcdGlmIGF1dGhvcml6YXRpb25DYWNoZVthdXRoLm5hbWVdID09IGF1dGgucGFzc1xyXG5cdFx0XHRcdFx0XHRcdGlzQXV0aGVkID0gdHJ1ZVxyXG5cdFx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdFx0cmVzdWx0ID0gQWNjb3VudHMuX2NoZWNrUGFzc3dvcmQgdXNlciwgYXV0aC5wYXNzXHJcblx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdFx0aWYgIXJlc3VsdC5lcnJvclxyXG5cdFx0XHRcdFx0XHRcdFx0aXNBdXRoZWQgPSB0cnVlXHJcblx0XHRcdFx0XHRcdFx0XHRpZiBfLmtleXMoYXV0aG9yaXphdGlvbkNhY2hlKS5sZW5ndGggPiAxMDBcclxuXHRcdFx0XHRcdFx0XHRcdFx0YXV0aG9yaXphdGlvbkNhY2hlID0ge31cclxuXHRcdFx0XHRcdFx0XHRcdGF1dGhvcml6YXRpb25DYWNoZVthdXRoLm5hbWVdID0gYXV0aC5wYXNzXHJcblx0XHRcdGlmIGlzQXV0aGVkXHJcblx0XHRcdFx0cmVxLmhlYWRlcnNbJ3gtdXNlci1pZCddID0gdXNlci5faWRcclxuXHRcdFx0XHR0b2tlbiA9IG51bGxcclxuXHRcdFx0XHRhcHBfaWQgPSBcImNyZWF0b3JcIlxyXG5cdFx0XHRcdGNsaWVudF9pZCA9IFwicGNcIlxyXG5cdFx0XHRcdGxvZ2luVG9rZW5zID0gdXNlci5zZXJ2aWNlcz8ucmVzdW1lPy5sb2dpblRva2Vuc1xyXG5cdFx0XHRcdGlmIGxvZ2luVG9rZW5zXHJcblx0XHRcdFx0XHRhcHBfbG9naW5fdG9rZW4gPSBfLmZpbmQobG9naW5Ub2tlbnMsICh0KS0+XHJcblx0XHRcdFx0XHRcdHJldHVybiB0LmFwcF9pZCBpcyBhcHBfaWQgYW5kIHQuY2xpZW50X2lkIGlzIGNsaWVudF9pZFxyXG5cdFx0XHRcdFx0KVxyXG5cdFx0XHRcdFx0dG9rZW4gPSBhcHBfbG9naW5fdG9rZW4udG9rZW4gaWYgYXBwX2xvZ2luX3Rva2VuXHJcblxyXG5cdFx0XHRcdGlmIG5vdCB0b2tlblxyXG5cdFx0XHRcdFx0YXV0aFRva2VuID0gQWNjb3VudHMuX2dlbmVyYXRlU3RhbXBlZExvZ2luVG9rZW4oKVxyXG5cdFx0XHRcdFx0dG9rZW4gPSBhdXRoVG9rZW4udG9rZW5cclxuXHRcdFx0XHRcdGhhc2hlZFRva2VuID0gQWNjb3VudHMuX2hhc2hTdGFtcGVkVG9rZW4gYXV0aFRva2VuXHJcblx0XHRcdFx0XHRoYXNoZWRUb2tlbi5hcHBfaWQgPSBhcHBfaWRcclxuXHRcdFx0XHRcdGhhc2hlZFRva2VuLmNsaWVudF9pZCA9IGNsaWVudF9pZFxyXG5cdFx0XHRcdFx0aGFzaGVkVG9rZW4udG9rZW4gPSB0b2tlblxyXG5cdFx0XHRcdFx0QWNjb3VudHMuX2luc2VydEhhc2hlZExvZ2luVG9rZW4gdXNlci5faWQsIGhhc2hlZFRva2VuXHJcblxyXG5cdFx0XHRcdGlmIHRva2VuXHJcblx0XHRcdFx0XHRyZXEuaGVhZGVyc1sneC1hdXRoLXRva2VuJ10gPSB0b2tlblxyXG5cdFx0bmV4dCgpXHJcblx0KS5ydW4oKVxyXG4iLCJ2YXIgRmliZXIsIGF1dGhvcml6YXRpb25DYWNoZSwgYmFzaWNBdXRoO1xuXG5GaWJlciA9IHJlcXVpcmUoJ2ZpYmVycycpO1xuXG5iYXNpY0F1dGggPSByZXF1aXJlKCdiYXNpYy1hdXRoJyk7XG5cbmF1dGhvcml6YXRpb25DYWNoZSA9IHt9O1xuXG5Kc29uUm91dGVzLk1pZGRsZXdhcmUudXNlKCcvYXBpL29kYXRhL3Y0LycsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIHJldHVybiBGaWJlcihmdW5jdGlvbigpIHtcbiAgICB2YXIgYXBwX2lkLCBhcHBfbG9naW5fdG9rZW4sIGF1dGgsIGF1dGhUb2tlbiwgY2xpZW50X2lkLCBoYXNoZWRUb2tlbiwgaXNBdXRoZWQsIGxvZ2luVG9rZW5zLCByZWYsIHJlZjEsIHJlZjIsIHJlc3VsdCwgdG9rZW4sIHVzZXIsIHVzZXJJZDtcbiAgICBpZiAoIXJlcS51c2VySWQpIHtcbiAgICAgIGlzQXV0aGVkID0gZmFsc2U7XG4gICAgICBpZiAocmVxICE9IG51bGwgPyAocmVmID0gcmVxLnF1ZXJ5KSAhPSBudWxsID8gcmVmLmFjY2Vzc190b2tlbiA6IHZvaWQgMCA6IHZvaWQgMCkge1xuICAgICAgICBjb25zb2xlLmxvZygnT0F1dGgyOiAnLCByZXEucXVlcnkuYWNjZXNzX3Rva2VuKTtcbiAgICAgICAgdXNlcklkID0gU3RlZWRvcy5nZXRVc2VySWRGcm9tQWNjZXNzVG9rZW4ocmVxLnF1ZXJ5LmFjY2Vzc190b2tlbik7XG4gICAgICAgIGlmICh1c2VySWQpIHtcbiAgICAgICAgICB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUoe1xuICAgICAgICAgICAgX2lkOiB1c2VySWRcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgaXNBdXRoZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHJlcS5oZWFkZXJzWydhdXRob3JpemF0aW9uJ10pIHtcbiAgICAgICAgYXV0aCA9IGJhc2ljQXV0aC5wYXJzZShyZXEuaGVhZGVyc1snYXV0aG9yaXphdGlvbiddKTtcbiAgICAgICAgaWYgKGF1dGgpIHtcbiAgICAgICAgICB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUoe1xuICAgICAgICAgICAgdXNlcm5hbWU6IGF1dGgubmFtZVxuICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgICAnc2VydmljZXMnOiAxXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgIGlmIChhdXRob3JpemF0aW9uQ2FjaGVbYXV0aC5uYW1lXSA9PT0gYXV0aC5wYXNzKSB7XG4gICAgICAgICAgICAgIGlzQXV0aGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlc3VsdCA9IEFjY291bnRzLl9jaGVja1Bhc3N3b3JkKHVzZXIsIGF1dGgucGFzcyk7XG4gICAgICAgICAgICAgIGlmICghcmVzdWx0LmVycm9yKSB7XG4gICAgICAgICAgICAgICAgaXNBdXRoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmIChfLmtleXMoYXV0aG9yaXphdGlvbkNhY2hlKS5sZW5ndGggPiAxMDApIHtcbiAgICAgICAgICAgICAgICAgIGF1dGhvcml6YXRpb25DYWNoZSA9IHt9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhdXRob3JpemF0aW9uQ2FjaGVbYXV0aC5uYW1lXSA9IGF1dGgucGFzcztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGlzQXV0aGVkKSB7XG4gICAgICAgIHJlcS5oZWFkZXJzWyd4LXVzZXItaWQnXSA9IHVzZXIuX2lkO1xuICAgICAgICB0b2tlbiA9IG51bGw7XG4gICAgICAgIGFwcF9pZCA9IFwiY3JlYXRvclwiO1xuICAgICAgICBjbGllbnRfaWQgPSBcInBjXCI7XG4gICAgICAgIGxvZ2luVG9rZW5zID0gKHJlZjEgPSB1c2VyLnNlcnZpY2VzKSAhPSBudWxsID8gKHJlZjIgPSByZWYxLnJlc3VtZSkgIT0gbnVsbCA/IHJlZjIubG9naW5Ub2tlbnMgOiB2b2lkIDAgOiB2b2lkIDA7XG4gICAgICAgIGlmIChsb2dpblRva2Vucykge1xuICAgICAgICAgIGFwcF9sb2dpbl90b2tlbiA9IF8uZmluZChsb2dpblRva2VucywgZnVuY3Rpb24odCkge1xuICAgICAgICAgICAgcmV0dXJuIHQuYXBwX2lkID09PSBhcHBfaWQgJiYgdC5jbGllbnRfaWQgPT09IGNsaWVudF9pZDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAoYXBwX2xvZ2luX3Rva2VuKSB7XG4gICAgICAgICAgICB0b2tlbiA9IGFwcF9sb2dpbl90b2tlbi50b2tlbjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0b2tlbikge1xuICAgICAgICAgIGF1dGhUb2tlbiA9IEFjY291bnRzLl9nZW5lcmF0ZVN0YW1wZWRMb2dpblRva2VuKCk7XG4gICAgICAgICAgdG9rZW4gPSBhdXRoVG9rZW4udG9rZW47XG4gICAgICAgICAgaGFzaGVkVG9rZW4gPSBBY2NvdW50cy5faGFzaFN0YW1wZWRUb2tlbihhdXRoVG9rZW4pO1xuICAgICAgICAgIGhhc2hlZFRva2VuLmFwcF9pZCA9IGFwcF9pZDtcbiAgICAgICAgICBoYXNoZWRUb2tlbi5jbGllbnRfaWQgPSBjbGllbnRfaWQ7XG4gICAgICAgICAgaGFzaGVkVG9rZW4udG9rZW4gPSB0b2tlbjtcbiAgICAgICAgICBBY2NvdW50cy5faW5zZXJ0SGFzaGVkTG9naW5Ub2tlbih1c2VyLl9pZCwgaGFzaGVkVG9rZW4pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0b2tlbikge1xuICAgICAgICAgIHJlcS5oZWFkZXJzWyd4LWF1dGgtdG9rZW4nXSA9IHRva2VuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBuZXh0KCk7XG4gIH0pLnJ1bigpO1xufSk7XG4iLCJNZXRlb3Iuc3RhcnR1cCAtPlxyXG5cdFNlcnZpY2VNZXRhZGF0YSA9IHJlcXVpcmUoJ29kYXRhLXY0LXNlcnZpY2UtbWV0YWRhdGEnKS5TZXJ2aWNlTWV0YWRhdGE7XHJcblx0U2VydmljZURvY3VtZW50ID0gcmVxdWlyZSgnb2RhdGEtdjQtc2VydmljZS1kb2N1bWVudCcpLlNlcnZpY2VEb2N1bWVudDtcclxuXHRfTlVNQkVSX1RZUEVTID0gW1wibnVtYmVyXCIsIFwiY3VycmVuY3lcIl1cclxuXHJcblx0X0JPT0xFQU5fVFlQRVMgPSBbXCJib29sZWFuXCJdXHJcblxyXG5cdF9EQVRFVElNRV9PRkZTRVRfVFlQRVMgPSBbJ2RhdGV0aW1lJ11cclxuXHJcblx0X05BTUVTUEFDRSA9IFwiQ3JlYXRvckVudGl0aWVzXCJcclxuXHJcblx0Z2V0T2JqZWN0c09kYXRhU2NoZW1hID0gKHNwYWNlSWQpLT5cclxuXHRcdHNjaGVtYSA9IHt2ZXJzaW9uOiBTdGVlZG9zT0RhdGEuVkVSU0lPTiwgZGF0YVNlcnZpY2VzOiB7c2NoZW1hOiBbXX19XHJcblxyXG5cdFx0ZW50aXRpZXNfc2NoZW1hID0ge31cclxuXHJcblx0XHRlbnRpdGllc19zY2hlbWEubmFtZXNwYWNlID0gX05BTUVTUEFDRVxyXG5cclxuXHRcdGVudGl0aWVzX3NjaGVtYS5lbnRpdHlUeXBlID0gW11cclxuXHJcblx0XHRlbnRpdGllc19zY2hlbWEuYW5ub3RhdGlvbnMgPSBbXVxyXG5cclxuXHRcdF8uZWFjaCBDcmVhdG9yLkNvbGxlY3Rpb25zLCAodmFsdWUsIGtleSwgbGlzdCktPlxyXG5cdFx0XHRfb2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3Qoa2V5LCBzcGFjZUlkKVxyXG5cdFx0XHRpZiBub3QgX29iamVjdD8uZW5hYmxlX2FwaVxyXG5cdFx0XHRcdHJldHVyblxyXG5cclxuXHRcdFx0IyDkuLvplK5cclxuXHRcdFx0a2V5cyA9IFt7cHJvcGVydHlSZWY6IHtuYW1lOiBcIl9pZFwiLCBjb21wdXRlZEtleTogdHJ1ZX19XVxyXG5cclxuXHRcdFx0ZW50aXRpZSA9IHtcclxuXHRcdFx0XHRuYW1lOiBfb2JqZWN0Lm5hbWVcclxuXHRcdFx0XHRrZXk6a2V5c1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRrZXlzLmZvckVhY2ggKF9rZXkpLT5cclxuXHRcdFx0XHRlbnRpdGllc19zY2hlbWEuYW5ub3RhdGlvbnMucHVzaCB7XHJcblx0XHRcdFx0XHR0YXJnZXQ6IF9OQU1FU1BBQ0UgKyBcIi5cIiArIF9vYmplY3QubmFtZSArIFwiL1wiICsgX2tleS5wcm9wZXJ0eVJlZi5uYW1lLFxyXG5cdFx0XHRcdFx0YW5ub3RhdGlvbjogW3tcclxuXHRcdFx0XHRcdFx0XCJ0ZXJtXCI6IFwiT3JnLk9EYXRhLkNvcmUuVjEuQ29tcHV0ZWRcIixcclxuXHRcdFx0XHRcdFx0XCJib29sXCI6IFwidHJ1ZVwiXHJcblx0XHRcdFx0XHR9XVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdCMgRW50aXR5VHlwZVxyXG5cdFx0XHRwcm9wZXJ0eSA9IFtdXHJcblx0XHRcdHByb3BlcnR5LnB1c2gge25hbWU6IFwiX2lkXCIsIHR5cGU6IFwiRWRtLlN0cmluZ1wiLCBudWxsYWJsZTogZmFsc2V9XHJcblxyXG5cdFx0XHRuYXZpZ2F0aW9uUHJvcGVydHkgPSBbXVxyXG5cclxuXHRcdFx0Xy5mb3JFYWNoIF9vYmplY3QuZmllbGRzLCAoZmllbGQsIGZpZWxkX25hbWUpLT5cclxuXHJcblx0XHRcdFx0X3Byb3BlcnR5ID0ge25hbWU6IGZpZWxkX25hbWUsIHR5cGU6IFwiRWRtLlN0cmluZ1wifVxyXG5cclxuXHRcdFx0XHRpZiBfLmNvbnRhaW5zIF9OVU1CRVJfVFlQRVMsIGZpZWxkLnR5cGVcclxuXHRcdFx0XHRcdF9wcm9wZXJ0eS50eXBlID0gXCJFZG0uRG91YmxlXCJcclxuXHRcdFx0XHRlbHNlIGlmIF8uY29udGFpbnMgX0JPT0xFQU5fVFlQRVMsIGZpZWxkLnR5cGVcclxuXHRcdFx0XHRcdF9wcm9wZXJ0eS50eXBlID0gXCJFZG0uQm9vbGVhblwiXHJcblx0XHRcdFx0ZWxzZSBpZiBfLmNvbnRhaW5zIF9EQVRFVElNRV9PRkZTRVRfVFlQRVMsIGZpZWxkLnR5cGVcclxuXHRcdFx0XHRcdF9wcm9wZXJ0eS50eXBlID0gXCJFZG0uRGF0ZVRpbWVPZmZzZXRcIlxyXG5cdFx0XHRcdFx0X3Byb3BlcnR5LnByZWNpc2lvbiA9IFwiOFwiXHJcblxyXG5cdFx0XHRcdGlmIGZpZWxkLnJlcXVpcmVkXHJcblx0XHRcdFx0XHRfcHJvcGVydHkubnVsbGFibGUgPSBmYWxzZVxyXG5cclxuXHRcdFx0XHRwcm9wZXJ0eS5wdXNoIF9wcm9wZXJ0eVxyXG5cclxuXHRcdFx0XHRyZWZlcmVuY2VfdG8gPSBmaWVsZC5yZWZlcmVuY2VfdG9cclxuXHJcblx0XHRcdFx0aWYgcmVmZXJlbmNlX3RvXHJcblx0XHRcdFx0XHRpZiAhXy5pc0FycmF5KHJlZmVyZW5jZV90bylcclxuXHRcdFx0XHRcdFx0cmVmZXJlbmNlX3RvID0gW3JlZmVyZW5jZV90b11cclxuXHJcblx0XHRcdFx0XHRyZWZlcmVuY2VfdG8uZm9yRWFjaCAociktPlxyXG5cdFx0XHRcdFx0XHRyZWZlcmVuY2Vfb2JqID0gQ3JlYXRvci5nZXRPYmplY3Qociwgc3BhY2VJZClcclxuXHRcdFx0XHRcdFx0aWYgcmVmZXJlbmNlX29ialxyXG5cdFx0XHRcdFx0XHRcdF9uYW1lID0gZmllbGRfbmFtZSArIFN0ZWVkb3NPRGF0YS5FWFBBTkRfRklFTERfU1VGRklYXHJcblx0XHRcdFx0XHRcdFx0aWYgXy5pc0FycmF5KGZpZWxkLnJlZmVyZW5jZV90bylcclxuXHRcdFx0XHRcdFx0XHRcdF9uYW1lID0gZmllbGRfbmFtZSArIFN0ZWVkb3NPRGF0YS5FWFBBTkRfRklFTERfU1VGRklYICsgXCIuXCIgKyByZWZlcmVuY2Vfb2JqLm5hbWVcclxuXHRcdFx0XHRcdFx0XHRuYXZpZ2F0aW9uUHJvcGVydHkucHVzaCB7XHJcblx0XHRcdFx0XHRcdFx0XHRuYW1lOiBfbmFtZSxcclxuXHQjXHRcdFx0XHRcdFx0XHR0eXBlOiBcIkNvbGxlY3Rpb24oXCIgKyBfTkFNRVNQQUNFICsgXCIuXCIgKyByZWZlcmVuY2Vfb2JqLm5hbWUgKyBcIilcIixcclxuXHRcdFx0XHRcdFx0XHRcdHR5cGU6IF9OQU1FU1BBQ0UgKyBcIi5cIiArIHJlZmVyZW5jZV9vYmoubmFtZVxyXG5cdFx0XHRcdFx0XHRcdFx0cGFydG5lcjogX29iamVjdC5uYW1lICNUT0RPXHJcblx0XHRcdFx0XHRcdFx0XHRfcmVfbmFtZTogcmVmZXJlbmNlX29iai5uYW1lXHJcblx0XHRcdFx0XHRcdFx0XHRyZWZlcmVudGlhbENvbnN0cmFpbnQ6IFtcclxuXHRcdFx0XHRcdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHByb3BlcnR5OiBmaWVsZF9uYW1lLFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJlZmVyZW5jZWRQcm9wZXJ0eTogXCJfaWRcIlxyXG5cdFx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0XHRdXHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdFx0Y29uc29sZS53YXJuIFwicmVmZXJlbmNlIHRvICcje3J9JyBpbnZhbGlkLlwiXHJcblxyXG5cdFx0XHRlbnRpdGllLnByb3BlcnR5ID0gcHJvcGVydHlcclxuXHRcdFx0ZW50aXRpZS5uYXZpZ2F0aW9uUHJvcGVydHkgPSBuYXZpZ2F0aW9uUHJvcGVydHlcclxuXHJcblx0XHRcdGVudGl0aWVzX3NjaGVtYS5lbnRpdHlUeXBlLnB1c2ggZW50aXRpZVxyXG5cclxuXHRcdHNjaGVtYS5kYXRhU2VydmljZXMuc2NoZW1hLnB1c2ggZW50aXRpZXNfc2NoZW1hXHJcblxyXG5cclxuXHRcdGNvbnRhaW5lcl9zY2hlbWEgPSB7fVxyXG5cdFx0Y29udGFpbmVyX3NjaGVtYS5lbnRpdHlDb250YWluZXIgPSB7bmFtZTogXCJjb250YWluZXJcIn1cclxuXHRcdGNvbnRhaW5lcl9zY2hlbWEuZW50aXR5Q29udGFpbmVyLmVudGl0eVNldCA9IFtdXHJcblxyXG5cdFx0Xy5mb3JFYWNoIGVudGl0aWVzX3NjaGVtYS5lbnRpdHlUeXBlLCAoX2V0LCBrKS0+XHJcblx0XHRcdGNvbnRhaW5lcl9zY2hlbWEuZW50aXR5Q29udGFpbmVyLmVudGl0eVNldC5wdXNoIHtcclxuXHRcdFx0XHRcIm5hbWVcIjogX2V0Lm5hbWUsXHJcblx0XHRcdFx0XCJlbnRpdHlUeXBlXCI6IF9OQU1FU1BBQ0UgKyBcIi5cIiArIF9ldC5uYW1lLFxyXG5cdFx0XHRcdFwibmF2aWdhdGlvblByb3BlcnR5QmluZGluZ1wiOiBbXVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0IyBUT0RPIFNlcnZpY2VNZXRhZGF0YeS4jeaUr+aMgW5hdmlnYXRpb25Qcm9wZXJ0eUJpbmRpbmflsZ7mgKdcclxuI1x0XHRfLmZvckVhY2ggZW50aXRpZXNfc2NoZW1hLmVudGl0eVR5cGUsIChfZXQsIGspLT5cclxuI1x0XHRcdF8uZm9yRWFjaCBfZXQubmF2aWdhdGlvblByb3BlcnR5LCAoX2V0X25wLCBucF9rKS0+XHJcbiNcdFx0XHRcdF9lcyA9IF8uZmluZCBjb250YWluZXJfc2NoZW1hLmVudGl0eUNvbnRhaW5lci5lbnRpdHlTZXQsIChfZXMpLT5cclxuI1x0XHRcdFx0XHRcdFx0cmV0dXJuIF9lcy5uYW1lID09IF9ldF9ucC5wYXJ0bmVyXHJcbiNcclxuI1x0XHRcdFx0X2VzPy5uYXZpZ2F0aW9uUHJvcGVydHlCaW5kaW5nLnB1c2gge1wicGF0aFwiOiBfZXRfbnAuX3JlX25hbWUsIFwidGFyZ2V0XCI6IF9ldF9ucC5fcmVfbmFtZX1cclxuI1x0XHRcdFx0Y29uc29sZS5sb2coXCJfZXNcIiwgX2VzKVxyXG4jXHJcbiNcdFx0Y29uc29sZS5sb2coXCJjb250YWluZXJfc2NoZW1hXCIsIEpTT04uc3RyaW5naWZ5KGNvbnRhaW5lcl9zY2hlbWEpKVxyXG5cclxuXHRcdHNjaGVtYS5kYXRhU2VydmljZXMuc2NoZW1hLnB1c2ggY29udGFpbmVyX3NjaGVtYVxyXG5cclxuXHRcdHJldHVybiBzY2hlbWFcclxuXHJcblx0U3RlZWRvc09kYXRhQVBJLmFkZFJvdXRlKCcnLCB7YXV0aFJlcXVpcmVkOiBTdGVlZG9zT0RhdGEuQVVUSFJFUVVJUkVEfSwge1xyXG5cdFx0Z2V0OiAoKS0+XHJcblx0XHRcdGNvbnRleHQgPSBTdGVlZG9zT0RhdGEuZ2V0TWV0YURhdGFQYXRoKEB1cmxQYXJhbXM/LnNwYWNlSWQpXHJcblx0XHRcdHNlcnZpY2VEb2N1bWVudCAgPSBTZXJ2aWNlRG9jdW1lbnQucHJvY2Vzc01ldGFkYXRhSnNvbihnZXRPYmplY3RzT2RhdGFTY2hlbWEoQHVybFBhcmFtcz8uc3BhY2VJZCksIHtjb250ZXh0OiBjb250ZXh0fSk7XHJcblx0XHRcdGJvZHkgPSBzZXJ2aWNlRG9jdW1lbnQuZG9jdW1lbnQoKVxyXG5cdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdGhlYWRlcnM6IHtcclxuXHRcdFx0XHRcdCdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCcsXHJcblx0XHRcdFx0XHQnT0RhdGEtVmVyc2lvbic6IFN0ZWVkb3NPRGF0YS5WRVJTSU9OXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRib2R5OiBzZXJ2aWNlRG9jdW1lbnQuZG9jdW1lbnQoKVxyXG5cdFx0XHR9O1xyXG5cdH0pXHJcblxyXG5cdFN0ZWVkb3NPZGF0YUFQSS5hZGRSb3V0ZShTdGVlZG9zT0RhdGEuTUVUQURBVEFfUEFUSCwge2F1dGhSZXF1aXJlZDogU3RlZWRvc09EYXRhLkFVVEhSRVFVSVJFRH0sIHtcclxuXHRcdGdldDogKCktPlxyXG5cdFx0XHRzZXJ2aWNlTWV0YWRhdGEgPSBTZXJ2aWNlTWV0YWRhdGEucHJvY2Vzc01ldGFkYXRhSnNvbihnZXRPYmplY3RzT2RhdGFTY2hlbWEoQHVybFBhcmFtcz8uc3BhY2VJZCkpXHJcblx0XHRcdGJvZHkgPSBzZXJ2aWNlTWV0YWRhdGEuZG9jdW1lbnQoKVxyXG5cdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdGhlYWRlcnM6IHtcclxuXHRcdFx0XHRcdCdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veG1sOyBjaGFyc2V0PXV0Zi04JyxcclxuXHRcdFx0XHRcdCdPRGF0YS1WZXJzaW9uJzogU3RlZWRvc09EYXRhLlZFUlNJT05cclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdGJvZHk6IGJvZHlcclxuXHRcdFx0fTtcclxuXHR9KSIsIk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuICB2YXIgU2VydmljZURvY3VtZW50LCBTZXJ2aWNlTWV0YWRhdGEsIF9CT09MRUFOX1RZUEVTLCBfREFURVRJTUVfT0ZGU0VUX1RZUEVTLCBfTkFNRVNQQUNFLCBfTlVNQkVSX1RZUEVTLCBnZXRPYmplY3RzT2RhdGFTY2hlbWE7XG4gIFNlcnZpY2VNZXRhZGF0YSA9IHJlcXVpcmUoJ29kYXRhLXY0LXNlcnZpY2UtbWV0YWRhdGEnKS5TZXJ2aWNlTWV0YWRhdGE7XG4gIFNlcnZpY2VEb2N1bWVudCA9IHJlcXVpcmUoJ29kYXRhLXY0LXNlcnZpY2UtZG9jdW1lbnQnKS5TZXJ2aWNlRG9jdW1lbnQ7XG4gIF9OVU1CRVJfVFlQRVMgPSBbXCJudW1iZXJcIiwgXCJjdXJyZW5jeVwiXTtcbiAgX0JPT0xFQU5fVFlQRVMgPSBbXCJib29sZWFuXCJdO1xuICBfREFURVRJTUVfT0ZGU0VUX1RZUEVTID0gWydkYXRldGltZSddO1xuICBfTkFNRVNQQUNFID0gXCJDcmVhdG9yRW50aXRpZXNcIjtcbiAgZ2V0T2JqZWN0c09kYXRhU2NoZW1hID0gZnVuY3Rpb24oc3BhY2VJZCkge1xuICAgIHZhciBjb250YWluZXJfc2NoZW1hLCBlbnRpdGllc19zY2hlbWEsIHNjaGVtYTtcbiAgICBzY2hlbWEgPSB7XG4gICAgICB2ZXJzaW9uOiBTdGVlZG9zT0RhdGEuVkVSU0lPTixcbiAgICAgIGRhdGFTZXJ2aWNlczoge1xuICAgICAgICBzY2hlbWE6IFtdXG4gICAgICB9XG4gICAgfTtcbiAgICBlbnRpdGllc19zY2hlbWEgPSB7fTtcbiAgICBlbnRpdGllc19zY2hlbWEubmFtZXNwYWNlID0gX05BTUVTUEFDRTtcbiAgICBlbnRpdGllc19zY2hlbWEuZW50aXR5VHlwZSA9IFtdO1xuICAgIGVudGl0aWVzX3NjaGVtYS5hbm5vdGF0aW9ucyA9IFtdO1xuICAgIF8uZWFjaChDcmVhdG9yLkNvbGxlY3Rpb25zLCBmdW5jdGlvbih2YWx1ZSwga2V5LCBsaXN0KSB7XG4gICAgICB2YXIgX29iamVjdCwgZW50aXRpZSwga2V5cywgbmF2aWdhdGlvblByb3BlcnR5LCBwcm9wZXJ0eTtcbiAgICAgIF9vYmplY3QgPSBDcmVhdG9yLmdldE9iamVjdChrZXksIHNwYWNlSWQpO1xuICAgICAgaWYgKCEoX29iamVjdCAhPSBudWxsID8gX29iamVjdC5lbmFibGVfYXBpIDogdm9pZCAwKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBrZXlzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgcHJvcGVydHlSZWY6IHtcbiAgICAgICAgICAgIG5hbWU6IFwiX2lkXCIsXG4gICAgICAgICAgICBjb21wdXRlZEtleTogdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgXTtcbiAgICAgIGVudGl0aWUgPSB7XG4gICAgICAgIG5hbWU6IF9vYmplY3QubmFtZSxcbiAgICAgICAga2V5OiBrZXlzXG4gICAgICB9O1xuICAgICAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKF9rZXkpIHtcbiAgICAgICAgcmV0dXJuIGVudGl0aWVzX3NjaGVtYS5hbm5vdGF0aW9ucy5wdXNoKHtcbiAgICAgICAgICB0YXJnZXQ6IF9OQU1FU1BBQ0UgKyBcIi5cIiArIF9vYmplY3QubmFtZSArIFwiL1wiICsgX2tleS5wcm9wZXJ0eVJlZi5uYW1lLFxuICAgICAgICAgIGFubm90YXRpb246IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCJ0ZXJtXCI6IFwiT3JnLk9EYXRhLkNvcmUuVjEuQ29tcHV0ZWRcIixcbiAgICAgICAgICAgICAgXCJib29sXCI6IFwidHJ1ZVwiXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgcHJvcGVydHkgPSBbXTtcbiAgICAgIHByb3BlcnR5LnB1c2goe1xuICAgICAgICBuYW1lOiBcIl9pZFwiLFxuICAgICAgICB0eXBlOiBcIkVkbS5TdHJpbmdcIixcbiAgICAgICAgbnVsbGFibGU6IGZhbHNlXG4gICAgICB9KTtcbiAgICAgIG5hdmlnYXRpb25Qcm9wZXJ0eSA9IFtdO1xuICAgICAgXy5mb3JFYWNoKF9vYmplY3QuZmllbGRzLCBmdW5jdGlvbihmaWVsZCwgZmllbGRfbmFtZSkge1xuICAgICAgICB2YXIgX3Byb3BlcnR5LCByZWZlcmVuY2VfdG87XG4gICAgICAgIF9wcm9wZXJ0eSA9IHtcbiAgICAgICAgICBuYW1lOiBmaWVsZF9uYW1lLFxuICAgICAgICAgIHR5cGU6IFwiRWRtLlN0cmluZ1wiXG4gICAgICAgIH07XG4gICAgICAgIGlmIChfLmNvbnRhaW5zKF9OVU1CRVJfVFlQRVMsIGZpZWxkLnR5cGUpKSB7XG4gICAgICAgICAgX3Byb3BlcnR5LnR5cGUgPSBcIkVkbS5Eb3VibGVcIjtcbiAgICAgICAgfSBlbHNlIGlmIChfLmNvbnRhaW5zKF9CT09MRUFOX1RZUEVTLCBmaWVsZC50eXBlKSkge1xuICAgICAgICAgIF9wcm9wZXJ0eS50eXBlID0gXCJFZG0uQm9vbGVhblwiO1xuICAgICAgICB9IGVsc2UgaWYgKF8uY29udGFpbnMoX0RBVEVUSU1FX09GRlNFVF9UWVBFUywgZmllbGQudHlwZSkpIHtcbiAgICAgICAgICBfcHJvcGVydHkudHlwZSA9IFwiRWRtLkRhdGVUaW1lT2Zmc2V0XCI7XG4gICAgICAgICAgX3Byb3BlcnR5LnByZWNpc2lvbiA9IFwiOFwiO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaWVsZC5yZXF1aXJlZCkge1xuICAgICAgICAgIF9wcm9wZXJ0eS5udWxsYWJsZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHByb3BlcnR5LnB1c2goX3Byb3BlcnR5KTtcbiAgICAgICAgcmVmZXJlbmNlX3RvID0gZmllbGQucmVmZXJlbmNlX3RvO1xuICAgICAgICBpZiAocmVmZXJlbmNlX3RvKSB7XG4gICAgICAgICAgaWYgKCFfLmlzQXJyYXkocmVmZXJlbmNlX3RvKSkge1xuICAgICAgICAgICAgcmVmZXJlbmNlX3RvID0gW3JlZmVyZW5jZV90b107XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZWZlcmVuY2VfdG8uZm9yRWFjaChmdW5jdGlvbihyKSB7XG4gICAgICAgICAgICB2YXIgX25hbWUsIHJlZmVyZW5jZV9vYmo7XG4gICAgICAgICAgICByZWZlcmVuY2Vfb2JqID0gQ3JlYXRvci5nZXRPYmplY3Qociwgc3BhY2VJZCk7XG4gICAgICAgICAgICBpZiAocmVmZXJlbmNlX29iaikge1xuICAgICAgICAgICAgICBfbmFtZSA9IGZpZWxkX25hbWUgKyBTdGVlZG9zT0RhdGEuRVhQQU5EX0ZJRUxEX1NVRkZJWDtcbiAgICAgICAgICAgICAgaWYgKF8uaXNBcnJheShmaWVsZC5yZWZlcmVuY2VfdG8pKSB7XG4gICAgICAgICAgICAgICAgX25hbWUgPSBmaWVsZF9uYW1lICsgU3RlZWRvc09EYXRhLkVYUEFORF9GSUVMRF9TVUZGSVggKyBcIi5cIiArIHJlZmVyZW5jZV9vYmoubmFtZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gbmF2aWdhdGlvblByb3BlcnR5LnB1c2goe1xuICAgICAgICAgICAgICAgIG5hbWU6IF9uYW1lLFxuICAgICAgICAgICAgICAgIHR5cGU6IF9OQU1FU1BBQ0UgKyBcIi5cIiArIHJlZmVyZW5jZV9vYmoubmFtZSxcbiAgICAgICAgICAgICAgICBwYXJ0bmVyOiBfb2JqZWN0Lm5hbWUsXG4gICAgICAgICAgICAgICAgX3JlX25hbWU6IHJlZmVyZW5jZV9vYmoubmFtZSxcbiAgICAgICAgICAgICAgICByZWZlcmVudGlhbENvbnN0cmFpbnQ6IFtcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHk6IGZpZWxkX25hbWUsXG4gICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jZWRQcm9wZXJ0eTogXCJfaWRcIlxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gY29uc29sZS53YXJuKFwicmVmZXJlbmNlIHRvICdcIiArIHIgKyBcIicgaW52YWxpZC5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgZW50aXRpZS5wcm9wZXJ0eSA9IHByb3BlcnR5O1xuICAgICAgZW50aXRpZS5uYXZpZ2F0aW9uUHJvcGVydHkgPSBuYXZpZ2F0aW9uUHJvcGVydHk7XG4gICAgICByZXR1cm4gZW50aXRpZXNfc2NoZW1hLmVudGl0eVR5cGUucHVzaChlbnRpdGllKTtcbiAgICB9KTtcbiAgICBzY2hlbWEuZGF0YVNlcnZpY2VzLnNjaGVtYS5wdXNoKGVudGl0aWVzX3NjaGVtYSk7XG4gICAgY29udGFpbmVyX3NjaGVtYSA9IHt9O1xuICAgIGNvbnRhaW5lcl9zY2hlbWEuZW50aXR5Q29udGFpbmVyID0ge1xuICAgICAgbmFtZTogXCJjb250YWluZXJcIlxuICAgIH07XG4gICAgY29udGFpbmVyX3NjaGVtYS5lbnRpdHlDb250YWluZXIuZW50aXR5U2V0ID0gW107XG4gICAgXy5mb3JFYWNoKGVudGl0aWVzX3NjaGVtYS5lbnRpdHlUeXBlLCBmdW5jdGlvbihfZXQsIGspIHtcbiAgICAgIHJldHVybiBjb250YWluZXJfc2NoZW1hLmVudGl0eUNvbnRhaW5lci5lbnRpdHlTZXQucHVzaCh7XG4gICAgICAgIFwibmFtZVwiOiBfZXQubmFtZSxcbiAgICAgICAgXCJlbnRpdHlUeXBlXCI6IF9OQU1FU1BBQ0UgKyBcIi5cIiArIF9ldC5uYW1lLFxuICAgICAgICBcIm5hdmlnYXRpb25Qcm9wZXJ0eUJpbmRpbmdcIjogW11cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHNjaGVtYS5kYXRhU2VydmljZXMuc2NoZW1hLnB1c2goY29udGFpbmVyX3NjaGVtYSk7XG4gICAgcmV0dXJuIHNjaGVtYTtcbiAgfTtcbiAgU3RlZWRvc09kYXRhQVBJLmFkZFJvdXRlKCcnLCB7XG4gICAgYXV0aFJlcXVpcmVkOiBTdGVlZG9zT0RhdGEuQVVUSFJFUVVJUkVEXG4gIH0sIHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGJvZHksIGNvbnRleHQsIHJlZiwgcmVmMSwgc2VydmljZURvY3VtZW50O1xuICAgICAgY29udGV4dCA9IFN0ZWVkb3NPRGF0YS5nZXRNZXRhRGF0YVBhdGgoKHJlZiA9IHRoaXMudXJsUGFyYW1zKSAhPSBudWxsID8gcmVmLnNwYWNlSWQgOiB2b2lkIDApO1xuICAgICAgc2VydmljZURvY3VtZW50ID0gU2VydmljZURvY3VtZW50LnByb2Nlc3NNZXRhZGF0YUpzb24oZ2V0T2JqZWN0c09kYXRhU2NoZW1hKChyZWYxID0gdGhpcy51cmxQYXJhbXMpICE9IG51bGwgPyByZWYxLnNwYWNlSWQgOiB2b2lkIDApLCB7XG4gICAgICAgIGNvbnRleHQ6IGNvbnRleHRcbiAgICAgIH0pO1xuICAgICAgYm9keSA9IHNlcnZpY2VEb2N1bWVudC5kb2N1bWVudCgpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCcsXG4gICAgICAgICAgJ09EYXRhLVZlcnNpb24nOiBTdGVlZG9zT0RhdGEuVkVSU0lPTlxuICAgICAgICB9LFxuICAgICAgICBib2R5OiBzZXJ2aWNlRG9jdW1lbnQuZG9jdW1lbnQoKVxuICAgICAgfTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gU3RlZWRvc09kYXRhQVBJLmFkZFJvdXRlKFN0ZWVkb3NPRGF0YS5NRVRBREFUQV9QQVRILCB7XG4gICAgYXV0aFJlcXVpcmVkOiBTdGVlZG9zT0RhdGEuQVVUSFJFUVVJUkVEXG4gIH0sIHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGJvZHksIHJlZiwgc2VydmljZU1ldGFkYXRhO1xuICAgICAgc2VydmljZU1ldGFkYXRhID0gU2VydmljZU1ldGFkYXRhLnByb2Nlc3NNZXRhZGF0YUpzb24oZ2V0T2JqZWN0c09kYXRhU2NoZW1hKChyZWYgPSB0aGlzLnVybFBhcmFtcykgIT0gbnVsbCA/IHJlZi5zcGFjZUlkIDogdm9pZCAwKSk7XG4gICAgICBib2R5ID0gc2VydmljZU1ldGFkYXRhLmRvY3VtZW50KCk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94bWw7IGNoYXJzZXQ9dXRmLTgnLFxuICAgICAgICAgICdPRGF0YS1WZXJzaW9uJzogU3RlZWRvc09EYXRhLlZFUlNJT05cbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogYm9keVxuICAgICAgfTtcbiAgICB9XG4gIH0pO1xufSk7XG4iLCJAU3RlZWRvc09EYXRhID0ge31cclxuU3RlZWRvc09EYXRhLlZFUlNJT04gPSAnNC4wJ1xyXG5TdGVlZG9zT0RhdGEuQVVUSFJFUVVJUkVEID0gdHJ1ZVxyXG5TdGVlZG9zT0RhdGEuQVBJX1BBVEggPSAnL2FwaS9vZGF0YS92NC86c3BhY2VJZCdcclxuU3RlZWRvc09EYXRhLk1FVEFEQVRBX1BBVEggPSAnJG1ldGFkYXRhJ1xyXG5TdGVlZG9zT0RhdGEuRVhQQU5EX0ZJRUxEX1NVRkZJWCA9IFwiX2V4cGFuZFwiXHJcblN0ZWVkb3NPRGF0YS5nZXRSb290UGF0aCA9IChzcGFjZUlkKS0+XHJcblx0cmV0dXJuIE1ldGVvci5hYnNvbHV0ZVVybCgnYXBpL29kYXRhL3Y0LycgKyBzcGFjZUlkKVxyXG5cclxuU3RlZWRvc09EYXRhLmdldE9EYXRhUGF0aCA9IChzcGFjZUlkLG9iamVjdF9uYW1lKS0+XHJcblx0cmV0dXJuIFN0ZWVkb3NPRGF0YS5nZXRSb290UGF0aChzcGFjZUlkKSArIFwiLyN7b2JqZWN0X25hbWV9XCJcclxuXHJcbmlmIE1ldGVvci5pc1NlcnZlclxyXG5cdFN0ZWVkb3NPRGF0YS5nZXRNZXRhRGF0YVBhdGggPSAoc3BhY2VJZCktPlxyXG5cdFx0cmV0dXJuIFN0ZWVkb3NPRGF0YS5nZXRSb290UGF0aChzcGFjZUlkKSArIFwiLyN7U3RlZWRvc09EYXRhLk1FVEFEQVRBX1BBVEh9XCJcclxuXHJcblx0U3RlZWRvc09EYXRhLmdldE9EYXRhQ29udGV4dFBhdGggPSAoc3BhY2VJZCwgb2JqZWN0X25hbWUpLT5cclxuXHRcdHJldHVybiBTdGVlZG9zT0RhdGEuZ2V0TWV0YURhdGFQYXRoKHNwYWNlSWQpICsgXCIjI3tvYmplY3RfbmFtZX1cIlxyXG5cdFN0ZWVkb3NPRGF0YS5nZXRPRGF0YU5leHRMaW5rUGF0aCA9IChzcGFjZUlkLG9iamVjdF9uYW1lKS0+XHJcblx0XHRyZXR1cm4gU3RlZWRvc09EYXRhLmdldFJvb3RQYXRoKHNwYWNlSWQpICsgXCIvI3tvYmplY3RfbmFtZX1cIlxyXG5cclxuXHJcblx0QFN0ZWVkb3NPZGF0YUFQSSA9IG5ldyBPZGF0YVJlc3RpdnVzXHJcblx0XHRhcGlQYXRoOiBTdGVlZG9zT0RhdGEuQVBJX1BBVEgsXHJcblx0XHR1c2VEZWZhdWx0QXV0aDogdHJ1ZVxyXG5cdFx0cHJldHR5SnNvbjogdHJ1ZVxyXG5cdFx0ZW5hYmxlQ29yczogdHJ1ZVxyXG5cdFx0ZGVmYXVsdEhlYWRlcnM6XHJcblx0XHRcdCdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcclxuIiwidGhpcy5TdGVlZG9zT0RhdGEgPSB7fTtcblxuU3RlZWRvc09EYXRhLlZFUlNJT04gPSAnNC4wJztcblxuU3RlZWRvc09EYXRhLkFVVEhSRVFVSVJFRCA9IHRydWU7XG5cblN0ZWVkb3NPRGF0YS5BUElfUEFUSCA9ICcvYXBpL29kYXRhL3Y0LzpzcGFjZUlkJztcblxuU3RlZWRvc09EYXRhLk1FVEFEQVRBX1BBVEggPSAnJG1ldGFkYXRhJztcblxuU3RlZWRvc09EYXRhLkVYUEFORF9GSUVMRF9TVUZGSVggPSBcIl9leHBhbmRcIjtcblxuU3RlZWRvc09EYXRhLmdldFJvb3RQYXRoID0gZnVuY3Rpb24oc3BhY2VJZCkge1xuICByZXR1cm4gTWV0ZW9yLmFic29sdXRlVXJsKCdhcGkvb2RhdGEvdjQvJyArIHNwYWNlSWQpO1xufTtcblxuU3RlZWRvc09EYXRhLmdldE9EYXRhUGF0aCA9IGZ1bmN0aW9uKHNwYWNlSWQsIG9iamVjdF9uYW1lKSB7XG4gIHJldHVybiBTdGVlZG9zT0RhdGEuZ2V0Um9vdFBhdGgoc3BhY2VJZCkgKyAoXCIvXCIgKyBvYmplY3RfbmFtZSk7XG59O1xuXG5pZiAoTWV0ZW9yLmlzU2VydmVyKSB7XG4gIFN0ZWVkb3NPRGF0YS5nZXRNZXRhRGF0YVBhdGggPSBmdW5jdGlvbihzcGFjZUlkKSB7XG4gICAgcmV0dXJuIFN0ZWVkb3NPRGF0YS5nZXRSb290UGF0aChzcGFjZUlkKSArIChcIi9cIiArIFN0ZWVkb3NPRGF0YS5NRVRBREFUQV9QQVRIKTtcbiAgfTtcbiAgU3RlZWRvc09EYXRhLmdldE9EYXRhQ29udGV4dFBhdGggPSBmdW5jdGlvbihzcGFjZUlkLCBvYmplY3RfbmFtZSkge1xuICAgIHJldHVybiBTdGVlZG9zT0RhdGEuZ2V0TWV0YURhdGFQYXRoKHNwYWNlSWQpICsgKFwiI1wiICsgb2JqZWN0X25hbWUpO1xuICB9O1xuICBTdGVlZG9zT0RhdGEuZ2V0T0RhdGFOZXh0TGlua1BhdGggPSBmdW5jdGlvbihzcGFjZUlkLCBvYmplY3RfbmFtZSkge1xuICAgIHJldHVybiBTdGVlZG9zT0RhdGEuZ2V0Um9vdFBhdGgoc3BhY2VJZCkgKyAoXCIvXCIgKyBvYmplY3RfbmFtZSk7XG4gIH07XG4gIHRoaXMuU3RlZWRvc09kYXRhQVBJID0gbmV3IE9kYXRhUmVzdGl2dXMoe1xuICAgIGFwaVBhdGg6IFN0ZWVkb3NPRGF0YS5BUElfUEFUSCxcbiAgICB1c2VEZWZhdWx0QXV0aDogdHJ1ZSxcbiAgICBwcmV0dHlKc29uOiB0cnVlLFxuICAgIGVuYWJsZUNvcnM6IHRydWUsXG4gICAgZGVmYXVsdEhlYWRlcnM6IHtcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICB9XG4gIH0pO1xufVxuIl19
