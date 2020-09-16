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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpvZGF0YS9jaGVja05wbS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19vZGF0YS9saWIvcmVzdGl2dXMvYXV0aC5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL2xpYi9yZXN0aXZ1cy9hdXRoLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpvZGF0YS9saWIvcmVzdGl2dXMvaXJvbi1yb3V0ZXItZXJyb3ItdG8tcmVzcG9uc2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3Nfb2RhdGEvbGliL3Jlc3RpdnVzL3JvdXRlLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvbGliL3Jlc3RpdnVzL3JvdXRlLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19vZGF0YS9saWIvcmVzdGl2dXMvcmVzdGl2dXMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9saWIvcmVzdGl2dXMvcmVzdGl2dXMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX29kYXRhL3NlcnZlci9vYmplY3RzLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL29iamVjdHMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX29kYXRhL3NlcnZlci9vZGF0YS5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9vZGF0YS5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3Nfb2RhdGEvc2VydmVyL21pZGRsZXdhcmUuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvbWlkZGxld2FyZS5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3Nfb2RhdGEvc2VydmVyL21ldGFkYXRhLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL21ldGFkYXRhLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19vZGF0YS9jb3JlLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvY29yZS5jb2ZmZWUiXSwibmFtZXMiOlsiY2hlY2tOcG1WZXJzaW9ucyIsIm1vZHVsZSIsImxpbmsiLCJ2IiwicmVxdWlyZSIsImNvb2tpZXMiLCJnZXRVc2VyUXVlcnlTZWxlY3RvciIsInVzZXJWYWxpZGF0b3IiLCJBdXRoIiwiTWF0Y2giLCJXaGVyZSIsInVzZXIiLCJjaGVjayIsImlkIiwiT3B0aW9uYWwiLCJTdHJpbmciLCJ1c2VybmFtZSIsImVtYWlsIiwiXyIsImtleXMiLCJsZW5ndGgiLCJFcnJvciIsImxvZ2luV2l0aFBhc3N3b3JkIiwicGFzc3dvcmQiLCJhdXRoVG9rZW4iLCJhdXRoZW50aWNhdGluZ1VzZXIiLCJhdXRoZW50aWNhdGluZ1VzZXJTZWxlY3RvciIsImhhc2hlZFRva2VuIiwicGFzc3dvcmRWZXJpZmljYXRpb24iLCJyZWYiLCJzcGFjZV91c2VycyIsInNwYWNlcyIsIk1ldGVvciIsInVzZXJzIiwiZmluZE9uZSIsInNlcnZpY2VzIiwiQWNjb3VudHMiLCJfY2hlY2tQYXNzd29yZCIsImVycm9yIiwiX2dlbmVyYXRlU3RhbXBlZExvZ2luVG9rZW4iLCJfaGFzaFN0YW1wZWRUb2tlbiIsIl9pbnNlcnRIYXNoZWRMb2dpblRva2VuIiwiX2lkIiwiZGIiLCJmaW5kIiwiZmV0Y2giLCJlYWNoIiwic3UiLCJzcGFjZSIsImlzX3BhaWQiLCJpbmRleE9mIiwiYWRtaW5zIiwicHVzaCIsIm5hbWUiLCJ0b2tlbiIsInVzZXJJZCIsImFkbWluU3BhY2VzIiwiZW52IiwicHJvY2VzcyIsIk5PREVfRU5WIiwiaXJvblJvdXRlclNlbmRFcnJvclRvUmVzcG9uc2UiLCJlcnIiLCJyZXEiLCJyZXMiLCJzdGF0dXNDb2RlIiwic3RhdHVzIiwibXNnIiwic3RhY2siLCJ0b1N0cmluZyIsImNvbnNvbGUiLCJoZWFkZXJzU2VudCIsInNvY2tldCIsImRlc3Ryb3kiLCJzZXRIZWFkZXIiLCJCdWZmZXIiLCJieXRlTGVuZ3RoIiwibWV0aG9kIiwiZW5kIiwic2hhcmUiLCJSb3V0ZSIsImFwaSIsInBhdGgiLCJvcHRpb25zIiwiZW5kcG9pbnRzMSIsImVuZHBvaW50cyIsInByb3RvdHlwZSIsImFkZFRvQXBpIiwiYXZhaWxhYmxlTWV0aG9kcyIsImFsbG93ZWRNZXRob2RzIiwiZnVsbFBhdGgiLCJyZWplY3RlZE1ldGhvZHMiLCJzZWxmIiwiY29udGFpbnMiLCJfY29uZmlnIiwicGF0aHMiLCJleHRlbmQiLCJkZWZhdWx0T3B0aW9uc0VuZHBvaW50IiwiX3Jlc29sdmVFbmRwb2ludHMiLCJfY29uZmlndXJlRW5kcG9pbnRzIiwiZmlsdGVyIiwicmVqZWN0IiwiYXBpUGF0aCIsImVuZHBvaW50IiwiSnNvblJvdXRlcyIsImFkZCIsImRvbmVGdW5jIiwiZW5kcG9pbnRDb250ZXh0IiwicmVzcG9uc2VEYXRhIiwicmVzcG9uc2VJbml0aWF0ZWQiLCJ1cmxQYXJhbXMiLCJwYXJhbXMiLCJxdWVyeVBhcmFtcyIsInF1ZXJ5IiwiYm9keVBhcmFtcyIsImJvZHkiLCJyZXF1ZXN0IiwicmVzcG9uc2UiLCJkb25lIiwiX2NhbGxFbmRwb2ludCIsImVycm9yMSIsImhlYWRlcnMiLCJfcmVzcG9uZCIsIm1lc3NhZ2UiLCJqb2luIiwidG9VcHBlckNhc2UiLCJpc0Z1bmN0aW9uIiwiYWN0aW9uIiwicmVmMSIsInJlZjIiLCJyb2xlUmVxdWlyZWQiLCJ1bmlvbiIsImlzRW1wdHkiLCJhdXRoUmVxdWlyZWQiLCJzcGFjZVJlcXVpcmVkIiwiaW52b2NhdGlvbiIsIl9hdXRoQWNjZXB0ZWQiLCJfcm9sZUFjY2VwdGVkIiwiX3NwYWNlQWNjZXB0ZWQiLCJERFBDb21tb24iLCJNZXRob2RJbnZvY2F0aW9uIiwiaXNTaW11bGF0aW9uIiwiY29ubmVjdGlvbiIsInJhbmRvbVNlZWQiLCJtYWtlUnBjU2VlZCIsIkREUCIsIl9DdXJyZW50SW52b2NhdGlvbiIsIndpdGhWYWx1ZSIsImNhbGwiLCJfYXV0aGVudGljYXRlIiwiYXV0aCIsInVzZXJTZWxlY3RvciIsInNwYWNlX3VzZXJzX2NvdW50Iiwic3BhY2VJZCIsImNvdW50IiwiaW50ZXJzZWN0aW9uIiwicm9sZXMiLCJkZWZhdWx0SGVhZGVycyIsImRlbGF5SW5NaWxsaXNlY29uZHMiLCJtaW5pbXVtRGVsYXlJbk1pbGxpc2Vjb25kcyIsInJhbmRvbU11bHRpcGxpZXJCZXR3ZWVuT25lQW5kVHdvIiwic2VuZFJlc3BvbnNlIiwiX2xvd2VyQ2FzZUtleXMiLCJtYXRjaCIsInByZXR0eUpzb24iLCJKU09OIiwic3RyaW5naWZ5Iiwid3JpdGVIZWFkIiwid3JpdGUiLCJNYXRoIiwicmFuZG9tIiwic2V0VGltZW91dCIsIm9iamVjdCIsImNoYWluIiwicGFpcnMiLCJtYXAiLCJhdHRyIiwidG9Mb3dlckNhc2UiLCJ2YWx1ZSIsIkNvb2tpZXMiLCJPZGF0YVJlc3RpdnVzIiwiYmFzaWNBdXRoIiwiaXRlbSIsImkiLCJsIiwiY29yc0hlYWRlcnMiLCJfcm91dGVzIiwidXNlRGVmYXVsdEF1dGgiLCJ2ZXJzaW9uIiwiX3VzZXIiLCJnZXQiLCJfaGFzaExvZ2luVG9rZW4iLCJlbmFibGVDb3JzIiwic2xpY2UiLCJsYXN0IiwiX2luaXRBdXRoIiwidXNlQXV0aCIsIndhcm4iLCJhZGRSb3V0ZSIsInJvdXRlIiwiYWRkQ29sbGVjdGlvbiIsImNvbGxlY3Rpb24iLCJjb2xsZWN0aW9uRW5kcG9pbnRzIiwiY29sbGVjdGlvblJvdXRlRW5kcG9pbnRzIiwiZW5kcG9pbnRzQXdhaXRpbmdDb25maWd1cmF0aW9uIiwiZW50aXR5Um91dGVFbmRwb2ludHMiLCJleGNsdWRlZEVuZHBvaW50cyIsIm1ldGhvZHMiLCJtZXRob2RzT25Db2xsZWN0aW9uIiwicm91dGVPcHRpb25zIiwiX3VzZXJDb2xsZWN0aW9uRW5kcG9pbnRzIiwiX2NvbGxlY3Rpb25FbmRwb2ludHMiLCJfbmFtZSIsImNvbmZpZ3VyZWRFbmRwb2ludCIsImVuZHBvaW50T3B0aW9ucyIsIm1ldGhvZFR5cGUiLCJjbG9uZSIsImVudGl0eSIsInNlbGVjdG9yIiwiZGF0YSIsInB1dCIsImVudGl0eUlzVXBkYXRlZCIsInVwZGF0ZSIsIiRzZXQiLCJyZW1vdmUiLCJwb3N0IiwiZW50aXR5SWQiLCJpbnNlcnQiLCJnZXRBbGwiLCJlbnRpdGllcyIsImZpZWxkcyIsInByb2ZpbGUiLCJjcmVhdGVVc2VyIiwibG9nb3V0IiwiZSIsImV4dHJhRGF0YSIsInNlYXJjaFF1ZXJ5IiwicmVhc29uIiwib25Mb2dnZWRJbiIsImV4dHJhIiwiaW5kZXgiLCJ0b2tlbkZpZWxkTmFtZSIsInRva2VuTG9jYXRpb24iLCJ0b2tlblBhdGgiLCJ0b2tlblJlbW92YWxRdWVyeSIsInRva2VuVG9SZW1vdmUiLCJsYXN0SW5kZXhPZiIsInN1YnN0cmluZyIsIiRwdWxsIiwib25Mb2dnZWRPdXQiLCJzdGFydHVwIiwiZ2V0T2JqZWN0IiwiZ2V0T2JqZWN0cyIsIm9iamVjdF9uYW1lcyIsInNwbGl0IiwiZm9yRWFjaCIsIm9iamVjdF9uYW1lIiwib2JqZWN0X3Blcm1pc3Npb25zIiwicHNldHMiLCJwc2V0c0FkbWluIiwicHNldHNDdXJyZW50IiwicHNldHNVc2VyIiwiQ3JlYXRvciIsIk9iamVjdHMiLCJnZXRPYmplY3ROYW1lIiwiZ2V0Q29sbGVjdGlvbiIsImFzc2lnbmVkX2FwcHMiLCJnZXRPYmplY3RQZXJtaXNzaW9ucyIsImJpbmQiLCJsaXN0X3ZpZXdzIiwicGVybWlzc2lvbl9zZXQiLCJhbGxvd1JlYWQiLCJhbGxvd0VkaXQiLCJhbGxvd0RlbGV0ZSIsImFsbG93Q3JlYXRlIiwibW9kaWZ5QWxsUmVjb3JkcyIsImZpZWxkIiwia2V5IiwiX2ZpZWxkIiwidW5lZGl0YWJsZV9maWVsZHMiLCJyZWFkb25seSIsInVucmVhZGFibGVfZmllbGRzIiwiU3RlZWRvc09EYXRhIiwiQVBJX1BBVEgiLCJuZXh0IiwiX29iaiIsIlN0ZWVkb3MiLCJnZXRVc2VySWRGcm9tQXV0aFRva2VuIiwic2VuZFJlc3VsdCIsImNvZGUiLCJlcnJvcnMiLCJNZXRlb3JPRGF0YUFQSVY0Um91dGVyIiwiTWV0ZW9yT0RhdGFSb3V0ZXIiLCJPRGF0YVJvdXRlciIsImFwcCIsImV4cHJlc3MiLCJ1c2UiLCJXZWJBcHAiLCJjb25uZWN0SGFuZGxlcnMiLCJzdGVlZG9zU2NoZW1hIiwiZ2V0RGF0YVNvdXJjZXMiLCJkYXRhc291cmNlIiwib3RoZXJBcHAiLCJGaWJlciIsImF1dGhvcml6YXRpb25DYWNoZSIsIk1pZGRsZXdhcmUiLCJhcHBfaWQiLCJhcHBfbG9naW5fdG9rZW4iLCJjbGllbnRfaWQiLCJpc0F1dGhlZCIsImxvZ2luVG9rZW5zIiwicmVzdWx0IiwiYWNjZXNzX3Rva2VuIiwibG9nIiwiZ2V0VXNlcklkRnJvbUFjY2Vzc1Rva2VuIiwicGFyc2UiLCJwYXNzIiwicmVzdW1lIiwidCIsInJ1biIsIlNlcnZpY2VEb2N1bWVudCIsIlNlcnZpY2VNZXRhZGF0YSIsIl9CT09MRUFOX1RZUEVTIiwiX0RBVEVUSU1FX09GRlNFVF9UWVBFUyIsIl9OQU1FU1BBQ0UiLCJfTlVNQkVSX1RZUEVTIiwiZ2V0T2JqZWN0c09kYXRhU2NoZW1hIiwiY29udGFpbmVyX3NjaGVtYSIsImVudGl0aWVzX3NjaGVtYSIsInNjaGVtYSIsIlZFUlNJT04iLCJkYXRhU2VydmljZXMiLCJuYW1lc3BhY2UiLCJlbnRpdHlUeXBlIiwiYW5ub3RhdGlvbnMiLCJDb2xsZWN0aW9ucyIsImxpc3QiLCJfb2JqZWN0IiwiZW50aXRpZSIsIm5hdmlnYXRpb25Qcm9wZXJ0eSIsInByb3BlcnR5IiwiZW5hYmxlX2FwaSIsInByb3BlcnR5UmVmIiwiY29tcHV0ZWRLZXkiLCJfa2V5IiwidGFyZ2V0IiwiYW5ub3RhdGlvbiIsInR5cGUiLCJudWxsYWJsZSIsImZpZWxkX25hbWUiLCJfcHJvcGVydHkiLCJyZWZlcmVuY2VfdG8iLCJwcmVjaXNpb24iLCJyZXF1aXJlZCIsImlzQXJyYXkiLCJyIiwicmVmZXJlbmNlX29iaiIsIkVYUEFORF9GSUVMRF9TVUZGSVgiLCJwYXJ0bmVyIiwiX3JlX25hbWUiLCJyZWZlcmVudGlhbENvbnN0cmFpbnQiLCJyZWZlcmVuY2VkUHJvcGVydHkiLCJlbnRpdHlDb250YWluZXIiLCJlbnRpdHlTZXQiLCJfZXQiLCJrIiwiU3RlZWRvc09kYXRhQVBJIiwiQVVUSFJFUVVJUkVEIiwiY29udGV4dCIsInNlcnZpY2VEb2N1bWVudCIsImdldE1ldGFEYXRhUGF0aCIsInByb2Nlc3NNZXRhZGF0YUpzb24iLCJkb2N1bWVudCIsIk1FVEFEQVRBX1BBVEgiLCJzZXJ2aWNlTWV0YWRhdGEiLCJnZXRSb290UGF0aCIsImFic29sdXRlVXJsIiwiZ2V0T0RhdGFQYXRoIiwiaXNTZXJ2ZXIiLCJnZXRPRGF0YUNvbnRleHRQYXRoIiwiZ2V0T0RhdGFOZXh0TGlua1BhdGgiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSUEsZ0JBQUo7QUFBcUJDLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZLG9DQUFaLEVBQWlEO0FBQUNGLGtCQUFnQixDQUFDRyxDQUFELEVBQUc7QUFBQ0gsb0JBQWdCLEdBQUNHLENBQWpCO0FBQW1COztBQUF4QyxDQUFqRCxFQUEyRixDQUEzRjs7QUFBckI7QUFDQUMsT0FBTyxDQUFDLHlCQUFELENBQVA7O0FBR0FKLGdCQUFnQixDQUFDO0FBQ2hCLGdCQUFjLFFBREU7QUFFaEIsK0JBQTZCLFFBRmI7QUFHaEIsK0JBQTZCLFFBSGI7QUFJaEJLLFNBQU8sRUFBRTtBQUpPLENBQUQsRUFLYixlQUxhLENBQWhCLEM7Ozs7Ozs7Ozs7OztBQ0pBLElBQUFDLG9CQUFBLEVBQUFDLGFBQUE7QUFBQSxLQUFDQyxJQUFELFVBQUNBLElBQUQsR0FBVSxFQUFWLEUsQ0FFQTs7O0FBR0FELGdCQUFnQkUsTUFBTUMsS0FBTixDQUFZLFVBQUNDLElBQUQ7QUFDM0JDLFFBQU1ELElBQU4sRUFDQztBQUFBRSxRQUFJSixNQUFNSyxRQUFOLENBQWVDLE1BQWYsQ0FBSjtBQUNBQyxjQUFVUCxNQUFNSyxRQUFOLENBQWVDLE1BQWYsQ0FEVjtBQUVBRSxXQUFPUixNQUFNSyxRQUFOLENBQWVDLE1BQWY7QUFGUCxHQUREOztBQUtBLE1BQUdHLEVBQUVDLElBQUYsQ0FBT1IsSUFBUCxFQUFhUyxNQUFiLEtBQXVCLENBQUksQ0FBOUI7QUFDQyxVQUFNLElBQUlYLE1BQU1ZLEtBQVYsQ0FBZ0IsNkNBQWhCLENBQU47QUNLQzs7QURIRixTQUFPLElBQVA7QUFUZSxFQUFoQixDLENBWUE7Ozs7QUFHQWYsdUJBQXVCLFVBQUNLLElBQUQ7QUFDdEIsTUFBR0EsS0FBS0UsRUFBUjtBQUNDLFdBQU87QUFBQyxhQUFPRixLQUFLRTtBQUFiLEtBQVA7QUFERCxTQUVLLElBQUdGLEtBQUtLLFFBQVI7QUFDSixXQUFPO0FBQUMsa0JBQVlMLEtBQUtLO0FBQWxCLEtBQVA7QUFESSxTQUVBLElBQUdMLEtBQUtNLEtBQVI7QUFDSixXQUFPO0FBQUMsd0JBQWtCTixLQUFLTTtBQUF4QixLQUFQO0FDYUM7O0FEVkYsUUFBTSxJQUFJSSxLQUFKLENBQVUsMENBQVYsQ0FBTjtBQVRzQixDQUF2QixDLENBWUE7Ozs7QUFHQSxLQUFDYixJQUFELENBQU1jLGlCQUFOLEdBQTBCLFVBQUNYLElBQUQsRUFBT1ksUUFBUDtBQUN6QixNQUFBQyxTQUFBLEVBQUFDLGtCQUFBLEVBQUFDLDBCQUFBLEVBQUFDLFdBQUEsRUFBQUMsb0JBQUEsRUFBQUMsR0FBQSxFQUFBQyxXQUFBLEVBQUFDLE1BQUE7O0FBQUEsTUFBRyxDQUFJcEIsSUFBSixJQUFZLENBQUlZLFFBQW5CO0FBQ0MsVUFBTSxJQUFJUyxPQUFPWCxLQUFYLENBQWlCLEdBQWpCLEVBQXNCLGNBQXRCLENBQU47QUNlQzs7QURaRlQsUUFBTUQsSUFBTixFQUFZSixhQUFaO0FBQ0FLLFFBQU1XLFFBQU4sRUFBZ0JSLE1BQWhCO0FBR0FXLCtCQUE2QnBCLHFCQUFxQkssSUFBckIsQ0FBN0I7QUFDQWMsdUJBQXFCTyxPQUFPQyxLQUFQLENBQWFDLE9BQWIsQ0FBcUJSLDBCQUFyQixDQUFyQjs7QUFFQSxNQUFHLENBQUlELGtCQUFQO0FBQ0MsVUFBTSxJQUFJTyxPQUFPWCxLQUFYLENBQWlCLEdBQWpCLEVBQXNCLGNBQXRCLENBQU47QUNXQzs7QURWRixNQUFHLEdBQUFRLE1BQUFKLG1CQUFBVSxRQUFBLFlBQUFOLElBQWlDTixRQUFqQyxHQUFpQyxNQUFqQyxDQUFIO0FBQ0MsVUFBTSxJQUFJUyxPQUFPWCxLQUFYLENBQWlCLEdBQWpCLEVBQXNCLGNBQXRCLENBQU47QUNZQzs7QURURk8seUJBQXVCUSxTQUFTQyxjQUFULENBQXdCWixrQkFBeEIsRUFBNENGLFFBQTVDLENBQXZCOztBQUNBLE1BQUdLLHFCQUFxQlUsS0FBeEI7QUFDQyxVQUFNLElBQUlOLE9BQU9YLEtBQVgsQ0FBaUIsR0FBakIsRUFBc0IsY0FBdEIsQ0FBTjtBQ1dDOztBRFJGRyxjQUFZWSxTQUFTRywwQkFBVCxFQUFaO0FBQ0FaLGdCQUFjUyxTQUFTSSxpQkFBVCxDQUEyQmhCLFNBQTNCLENBQWQ7O0FBQ0FZLFdBQVNLLHVCQUFULENBQWlDaEIsbUJBQW1CaUIsR0FBcEQsRUFBeURmLFdBQXpEOztBQUVBRyxnQkFBY2EsR0FBR2IsV0FBSCxDQUFlYyxJQUFmLENBQW9CO0FBQUNqQyxVQUFNYyxtQkFBbUJpQjtBQUExQixHQUFwQixFQUFvREcsS0FBcEQsRUFBZDtBQUNBZCxXQUFTLEVBQVQ7O0FBQ0FiLElBQUU0QixJQUFGLENBQU9oQixXQUFQLEVBQW9CLFVBQUNpQixFQUFEO0FBQ25CLFFBQUFDLEtBQUE7QUFBQUEsWUFBUUwsR0FBR1osTUFBSCxDQUFVRyxPQUFWLENBQWtCYSxHQUFHQyxLQUFyQixDQUFSOztBQUVBLFNBQUFBLFNBQUEsT0FBR0EsTUFBT0MsT0FBVixHQUFVLE1BQVYsS0FBc0IvQixFQUFFZ0MsT0FBRixDQUFVRixNQUFNRyxNQUFoQixFQUF3QkosR0FBR3BDLElBQTNCLEtBQWtDLENBQXhEO0FDV0ksYURWSG9CLE9BQU9xQixJQUFQLENBQ0M7QUFBQVYsYUFBS00sTUFBTU4sR0FBWDtBQUNBVyxjQUFNTCxNQUFNSztBQURaLE9BREQsQ0NVRztBQUlEO0FEbEJKOztBQU9BLFNBQU87QUFBQzdCLGVBQVdBLFVBQVU4QixLQUF0QjtBQUE2QkMsWUFBUTlCLG1CQUFtQmlCLEdBQXhEO0FBQTZEYyxpQkFBYXpCO0FBQTFFLEdBQVA7QUFwQ3lCLENBQTFCLEM7Ozs7Ozs7Ozs7O0FFbkNBO0FBQ0E7QUFFQTtBQUNBLElBQUkwQixHQUFHLEdBQUdDLE9BQU8sQ0FBQ0QsR0FBUixDQUFZRSxRQUFaLElBQXdCLGFBQWxDLEMsQ0FFQTs7QUFDQUMsNkJBQTZCLEdBQUcsVUFBU0MsR0FBVCxFQUFjQyxHQUFkLEVBQW1CQyxHQUFuQixFQUF3QjtBQUN2RCxNQUFJQSxHQUFHLENBQUNDLFVBQUosR0FBaUIsR0FBckIsRUFDQ0QsR0FBRyxDQUFDQyxVQUFKLEdBQWlCLEdBQWpCO0FBRUQsTUFBSUgsR0FBRyxDQUFDSSxNQUFSLEVBQ0NGLEdBQUcsQ0FBQ0MsVUFBSixHQUFpQkgsR0FBRyxDQUFDSSxNQUFyQjtBQUVELE1BQUlSLEdBQUcsS0FBSyxhQUFaLEVBQ0NTLEdBQUcsR0FBRyxDQUFDTCxHQUFHLENBQUNNLEtBQUosSUFBYU4sR0FBRyxDQUFDTyxRQUFKLEVBQWQsSUFBZ0MsSUFBdEMsQ0FERCxLQUdBO0FBQ0NGLE9BQUcsR0FBRyxlQUFOO0FBRURHLFNBQU8sQ0FBQy9CLEtBQVIsQ0FBY3VCLEdBQUcsQ0FBQ00sS0FBSixJQUFhTixHQUFHLENBQUNPLFFBQUosRUFBM0I7QUFFQSxNQUFJTCxHQUFHLENBQUNPLFdBQVIsRUFDQyxPQUFPUixHQUFHLENBQUNTLE1BQUosQ0FBV0MsT0FBWCxFQUFQO0FBRURULEtBQUcsQ0FBQ1UsU0FBSixDQUFjLGNBQWQsRUFBOEIsV0FBOUI7QUFDQVYsS0FBRyxDQUFDVSxTQUFKLENBQWMsZ0JBQWQsRUFBZ0NDLE1BQU0sQ0FBQ0MsVUFBUCxDQUFrQlQsR0FBbEIsQ0FBaEM7QUFDQSxNQUFJSixHQUFHLENBQUNjLE1BQUosS0FBZSxNQUFuQixFQUNDLE9BQU9iLEdBQUcsQ0FBQ2MsR0FBSixFQUFQO0FBQ0RkLEtBQUcsQ0FBQ2MsR0FBSixDQUFRWCxHQUFSO0FBQ0E7QUFDQSxDQXhCRCxDOzs7Ozs7Ozs7Ozs7QUNQTVksTUFBTUMsS0FBTixHQUFNO0FBRUUsV0FBQUEsS0FBQSxDQUFDQyxHQUFELEVBQU9DLElBQVAsRUFBY0MsT0FBZCxFQUF3QkMsVUFBeEI7QUFBQyxTQUFDSCxHQUFELEdBQUFBLEdBQUE7QUFBTSxTQUFDQyxJQUFELEdBQUFBLElBQUE7QUFBTyxTQUFDQyxPQUFELEdBQUFBLE9BQUE7QUFBVSxTQUFDRSxTQUFELEdBQUFELFVBQUE7O0FBRXBDLFFBQUcsQ0FBSSxLQUFDQyxTQUFSO0FBQ0MsV0FBQ0EsU0FBRCxHQUFhLEtBQUNGLE9BQWQ7QUFDQSxXQUFDQSxPQUFELEdBQVcsRUFBWDtBQ0dFO0FEUFM7O0FDVVpILFFBQU1NLFNBQU4sQ0RIREMsUUNHQyxHREhZO0FBQ1osUUFBQUMsZ0JBQUE7QUFBQUEsdUJBQW1CLENBQUMsS0FBRCxFQUFRLE1BQVIsRUFBZ0IsS0FBaEIsRUFBdUIsT0FBdkIsRUFBZ0MsUUFBaEMsRUFBMEMsU0FBMUMsQ0FBbkI7QUFFQSxXQUFPO0FBQ04sVUFBQUMsY0FBQSxFQUFBQyxRQUFBLEVBQUFDLGVBQUEsRUFBQUMsSUFBQTtBQUFBQSxhQUFPLElBQVA7O0FBSUEsVUFBR3pFLEVBQUUwRSxRQUFGLENBQVcsS0FBQ1osR0FBRCxDQUFLYSxPQUFMLENBQWFDLEtBQXhCLEVBQStCLEtBQUNiLElBQWhDLENBQUg7QUFDQyxjQUFNLElBQUk1RCxLQUFKLENBQVUsNkNBQTJDLEtBQUM0RCxJQUF0RCxDQUFOO0FDRUc7O0FEQ0osV0FBQ0csU0FBRCxHQUFhbEUsRUFBRTZFLE1BQUYsQ0FBUztBQUFBYixpQkFBUyxLQUFDRixHQUFELENBQUthLE9BQUwsQ0FBYUc7QUFBdEIsT0FBVCxFQUF1RCxLQUFDWixTQUF4RCxDQUFiOztBQUdBLFdBQUNhLGlCQUFEOztBQUNBLFdBQUNDLG1CQUFEOztBQUdBLFdBQUNsQixHQUFELENBQUthLE9BQUwsQ0FBYUMsS0FBYixDQUFtQjFDLElBQW5CLENBQXdCLEtBQUM2QixJQUF6Qjs7QUFFQU8sdUJBQWlCdEUsRUFBRWlGLE1BQUYsQ0FBU1osZ0JBQVQsRUFBMkIsVUFBQ1gsTUFBRDtBQ0Z2QyxlREdKMUQsRUFBRTBFLFFBQUYsQ0FBVzFFLEVBQUVDLElBQUYsQ0FBT3dFLEtBQUtQLFNBQVosQ0FBWCxFQUFtQ1IsTUFBbkMsQ0NISTtBREVZLFFBQWpCO0FBRUFjLHdCQUFrQnhFLEVBQUVrRixNQUFGLENBQVNiLGdCQUFULEVBQTJCLFVBQUNYLE1BQUQ7QUNEeEMsZURFSjFELEVBQUUwRSxRQUFGLENBQVcxRSxFQUFFQyxJQUFGLENBQU93RSxLQUFLUCxTQUFaLENBQVgsRUFBbUNSLE1BQW5DLENDRkk7QURDYSxRQUFsQjtBQUlBYSxpQkFBVyxLQUFDVCxHQUFELENBQUthLE9BQUwsQ0FBYVEsT0FBYixHQUF1QixLQUFDcEIsSUFBbkM7O0FBQ0EvRCxRQUFFNEIsSUFBRixDQUFPMEMsY0FBUCxFQUF1QixVQUFDWixNQUFEO0FBQ3RCLFlBQUEwQixRQUFBO0FBQUFBLG1CQUFXWCxLQUFLUCxTQUFMLENBQWVSLE1BQWYsQ0FBWDtBQ0RJLGVERUoyQixXQUFXQyxHQUFYLENBQWU1QixNQUFmLEVBQXVCYSxRQUF2QixFQUFpQyxVQUFDM0IsR0FBRCxFQUFNQyxHQUFOO0FBRWhDLGNBQUEwQyxRQUFBLEVBQUFDLGVBQUEsRUFBQXBFLEtBQUEsRUFBQXFFLFlBQUEsRUFBQUMsaUJBQUE7QUFBQUEsOEJBQW9CLEtBQXBCOztBQUNBSCxxQkFBVztBQ0RKLG1CREVORyxvQkFBb0IsSUNGZDtBRENJLFdBQVg7O0FBR0FGLDRCQUNDO0FBQUFHLHVCQUFXL0MsSUFBSWdELE1BQWY7QUFDQUMseUJBQWFqRCxJQUFJa0QsS0FEakI7QUFFQUMsd0JBQVluRCxJQUFJb0QsSUFGaEI7QUFHQUMscUJBQVNyRCxHQUhUO0FBSUFzRCxzQkFBVXJELEdBSlY7QUFLQXNELGtCQUFNWjtBQUxOLFdBREQ7O0FBUUF2RixZQUFFNkUsTUFBRixDQUFTVyxlQUFULEVBQTBCSixRQUExQjs7QUFHQUsseUJBQWUsSUFBZjs7QUFDQTtBQUNDQSwyQkFBZWhCLEtBQUsyQixhQUFMLENBQW1CWixlQUFuQixFQUFvQ0osUUFBcEMsQ0FBZjtBQURELG1CQUFBaUIsTUFBQTtBQUVNakYsb0JBQUFpRixNQUFBO0FBRUwzRCwwQ0FBOEJ0QixLQUE5QixFQUFxQ3dCLEdBQXJDLEVBQTBDQyxHQUExQztBQUNBO0FDSEs7O0FES04sY0FBRzZDLGlCQUFIO0FBRUM3QyxnQkFBSWMsR0FBSjtBQUNBO0FBSEQ7QUFLQyxnQkFBR2QsSUFBSU8sV0FBUDtBQUNDLG9CQUFNLElBQUlqRCxLQUFKLENBQVUsc0VBQW9FdUQsTUFBcEUsR0FBMkUsR0FBM0UsR0FBOEVhLFFBQXhGLENBQU47QUFERCxtQkFFSyxJQUFHa0IsaUJBQWdCLElBQWhCLElBQXdCQSxpQkFBZ0IsTUFBM0M7QUFDSixvQkFBTSxJQUFJdEYsS0FBSixDQUFVLHVEQUFxRHVELE1BQXJELEdBQTRELEdBQTVELEdBQStEYSxRQUF6RSxDQUFOO0FBUkY7QUNLTTs7QURNTixjQUFHa0IsYUFBYU8sSUFBYixLQUF1QlAsYUFBYTNDLFVBQWIsSUFBMkIyQyxhQUFhYSxPQUEvRCxDQUFIO0FDSk8sbUJES043QixLQUFLOEIsUUFBTCxDQUFjMUQsR0FBZCxFQUFtQjRDLGFBQWFPLElBQWhDLEVBQXNDUCxhQUFhM0MsVUFBbkQsRUFBK0QyQyxhQUFhYSxPQUE1RSxDQ0xNO0FESVA7QUNGTyxtQkRLTjdCLEtBQUs4QixRQUFMLENBQWMxRCxHQUFkLEVBQW1CNEMsWUFBbkIsQ0NMTTtBQUNEO0FEbkNQLFVDRkk7QURBTDs7QUN3Q0csYURHSHpGLEVBQUU0QixJQUFGLENBQU80QyxlQUFQLEVBQXdCLFVBQUNkLE1BQUQ7QUNGbkIsZURHSjJCLFdBQVdDLEdBQVgsQ0FBZTVCLE1BQWYsRUFBdUJhLFFBQXZCLEVBQWlDLFVBQUMzQixHQUFELEVBQU1DLEdBQU47QUFDaEMsY0FBQXlELE9BQUEsRUFBQWIsWUFBQTtBQUFBQSx5QkFBZTtBQUFBMUMsb0JBQVEsT0FBUjtBQUFpQnlELHFCQUFTO0FBQTFCLFdBQWY7QUFDQUYsb0JBQVU7QUFBQSxxQkFBU2hDLGVBQWVtQyxJQUFmLENBQW9CLElBQXBCLEVBQTBCQyxXQUExQjtBQUFULFdBQVY7QUNJSyxpQkRITGpDLEtBQUs4QixRQUFMLENBQWMxRCxHQUFkLEVBQW1CNEMsWUFBbkIsRUFBaUMsR0FBakMsRUFBc0NhLE9BQXRDLENDR0s7QUROTixVQ0hJO0FERUwsUUNIRztBRGpFRyxLQUFQO0FBSFksS0NHWixDRFpVLENBdUZYOzs7Ozs7O0FDY0N6QyxRQUFNTSxTQUFOLENEUkRZLGlCQ1FDLEdEUmtCO0FBQ2xCL0UsTUFBRTRCLElBQUYsQ0FBTyxLQUFDc0MsU0FBUixFQUFtQixVQUFDa0IsUUFBRCxFQUFXMUIsTUFBWCxFQUFtQlEsU0FBbkI7QUFDbEIsVUFBR2xFLEVBQUUyRyxVQUFGLENBQWF2QixRQUFiLENBQUg7QUNTSyxlRFJKbEIsVUFBVVIsTUFBVixJQUFvQjtBQUFDa0Qsa0JBQVF4QjtBQUFULFNDUWhCO0FBR0Q7QURiTDtBQURrQixHQ1FsQixDRHJHVSxDQW9HWDs7Ozs7Ozs7Ozs7Ozs7OztBQzRCQ3ZCLFFBQU1NLFNBQU4sQ0RiRGEsbUJDYUMsR0Rib0I7QUFDcEJoRixNQUFFNEIsSUFBRixDQUFPLEtBQUNzQyxTQUFSLEVBQW1CLFVBQUNrQixRQUFELEVBQVcxQixNQUFYO0FBQ2xCLFVBQUEvQyxHQUFBLEVBQUFrRyxJQUFBLEVBQUFDLElBQUE7O0FBQUEsVUFBR3BELFdBQVksU0FBZjtBQUVDLFlBQUcsR0FBQS9DLE1BQUEsS0FBQXFELE9BQUEsWUFBQXJELElBQWNvRyxZQUFkLEdBQWMsTUFBZCxDQUFIO0FBQ0MsZUFBQy9DLE9BQUQsQ0FBUytDLFlBQVQsR0FBd0IsRUFBeEI7QUNjSTs7QURiTCxZQUFHLENBQUkzQixTQUFTMkIsWUFBaEI7QUFDQzNCLG1CQUFTMkIsWUFBVCxHQUF3QixFQUF4QjtBQ2VJOztBRGRMM0IsaUJBQVMyQixZQUFULEdBQXdCL0csRUFBRWdILEtBQUYsQ0FBUTVCLFNBQVMyQixZQUFqQixFQUErQixLQUFDL0MsT0FBRCxDQUFTK0MsWUFBeEMsQ0FBeEI7O0FBRUEsWUFBRy9HLEVBQUVpSCxPQUFGLENBQVU3QixTQUFTMkIsWUFBbkIsQ0FBSDtBQUNDM0IsbUJBQVMyQixZQUFULEdBQXdCLEtBQXhCO0FDZUk7O0FEWkwsWUFBRzNCLFNBQVM4QixZQUFULEtBQXlCLE1BQTVCO0FBQ0MsZ0JBQUFMLE9BQUEsS0FBQTdDLE9BQUEsWUFBQTZDLEtBQWFLLFlBQWIsR0FBYSxNQUFiLEtBQTZCOUIsU0FBUzJCLFlBQXRDO0FBQ0MzQixxQkFBUzhCLFlBQVQsR0FBd0IsSUFBeEI7QUFERDtBQUdDOUIscUJBQVM4QixZQUFULEdBQXdCLEtBQXhCO0FBSkY7QUNtQks7O0FEYkwsYUFBQUosT0FBQSxLQUFBOUMsT0FBQSxZQUFBOEMsS0FBYUssYUFBYixHQUFhLE1BQWI7QUFDQy9CLG1CQUFTK0IsYUFBVCxHQUF5QixLQUFDbkQsT0FBRCxDQUFTbUQsYUFBbEM7QUFuQkY7QUNtQ0k7QURwQ0wsT0FzQkUsSUF0QkY7QUFEb0IsR0NhcEIsQ0RoSVUsQ0E4SVg7Ozs7OztBQ3FCQ3RELFFBQU1NLFNBQU4sQ0RoQkRpQyxhQ2dCQyxHRGhCYyxVQUFDWixlQUFELEVBQWtCSixRQUFsQjtBQUVkLFFBQUFnQyxVQUFBOztBQUFBLFFBQUcsS0FBQ0MsYUFBRCxDQUFlN0IsZUFBZixFQUFnQ0osUUFBaEMsQ0FBSDtBQUNDLFVBQUcsS0FBQ2tDLGFBQUQsQ0FBZTlCLGVBQWYsRUFBZ0NKLFFBQWhDLENBQUg7QUFDQyxZQUFHLEtBQUNtQyxjQUFELENBQWdCL0IsZUFBaEIsRUFBaUNKLFFBQWpDLENBQUg7QUFFQ2dDLHVCQUFhLElBQUlJLFVBQVVDLGdCQUFkLENBQ1o7QUFBQUMsMEJBQWMsSUFBZDtBQUNBckYsb0JBQVFtRCxnQkFBZ0JuRCxNQUR4QjtBQUVBc0Ysd0JBQVksSUFGWjtBQUdBQyx3QkFBWUosVUFBVUssV0FBVjtBQUhaLFdBRFksQ0FBYjtBQU1BLGlCQUFPQyxJQUFJQyxrQkFBSixDQUF1QkMsU0FBdkIsQ0FBaUNaLFVBQWpDLEVBQTZDO0FBQ25ELG1CQUFPaEMsU0FBU3dCLE1BQVQsQ0FBZ0JxQixJQUFoQixDQUFxQnpDLGVBQXJCLENBQVA7QUFETSxZQUFQO0FBUkQ7QUMyQk0saUJEaEJMO0FBQUExQyx3QkFBWSxHQUFaO0FBQ0FrRCxrQkFBTTtBQUFDakQsc0JBQVEsT0FBVDtBQUFrQnlELHVCQUFTO0FBQTNCO0FBRE4sV0NnQks7QUQ1QlA7QUFBQTtBQ3FDSyxlRHRCSjtBQUFBMUQsc0JBQVksR0FBWjtBQUNBa0QsZ0JBQU07QUFBQ2pELG9CQUFRLE9BQVQ7QUFBa0J5RCxxQkFBUztBQUEzQjtBQUROLFNDc0JJO0FEdENOO0FBQUE7QUMrQ0ksYUQ1Qkg7QUFBQTFELG9CQUFZLEdBQVo7QUFDQWtELGNBQU07QUFBQ2pELGtCQUFRLE9BQVQ7QUFBa0J5RCxtQkFBUztBQUEzQjtBQUROLE9DNEJHO0FBT0Q7QUR4RFcsR0NnQmQsQ0RuS1UsQ0E0S1g7Ozs7Ozs7Ozs7QUM2Q0MzQyxRQUFNTSxTQUFOLENEcENEa0QsYUNvQ0MsR0RwQ2MsVUFBQzdCLGVBQUQsRUFBa0JKLFFBQWxCO0FBQ2QsUUFBR0EsU0FBUzhCLFlBQVo7QUNxQ0ksYURwQ0gsS0FBQ2dCLGFBQUQsQ0FBZTFDLGVBQWYsQ0NvQ0c7QURyQ0o7QUN1Q0ksYURyQ0MsSUNxQ0Q7QUFDRDtBRHpDVyxHQ29DZCxDRHpOVSxDQTJMWDs7Ozs7Ozs7QUMrQ0MzQixRQUFNTSxTQUFOLENEeENEK0QsYUN3Q0MsR0R4Q2MsVUFBQzFDLGVBQUQ7QUFFZCxRQUFBMkMsSUFBQSxFQUFBQyxZQUFBO0FBQUFELFdBQU8sS0FBQ3JFLEdBQUQsQ0FBS2EsT0FBTCxDQUFhd0QsSUFBYixDQUFrQjFJLElBQWxCLENBQXVCd0ksSUFBdkIsQ0FBNEJ6QyxlQUE1QixDQUFQOztBQUdBLFNBQUEyQyxRQUFBLE9BQUdBLEtBQU05RixNQUFULEdBQVMsTUFBVCxNQUFHOEYsUUFBQSxPQUFpQkEsS0FBTS9GLEtBQXZCLEdBQXVCLE1BQTFCLEtBQW9DLEVBQUErRixRQUFBLE9BQUlBLEtBQU0xSSxJQUFWLEdBQVUsTUFBVixDQUFwQztBQUNDMkkscUJBQWUsRUFBZjtBQUNBQSxtQkFBYTVHLEdBQWIsR0FBbUIyRyxLQUFLOUYsTUFBeEI7QUFDQStGLG1CQUFhLEtBQUN0RSxHQUFELENBQUthLE9BQUwsQ0FBYXdELElBQWIsQ0FBa0IvRixLQUEvQixJQUF3QytGLEtBQUsvRixLQUE3QztBQUNBK0YsV0FBSzFJLElBQUwsR0FBWXFCLE9BQU9DLEtBQVAsQ0FBYUMsT0FBYixDQUFxQm9ILFlBQXJCLENBQVo7QUN1Q0U7O0FEcENILFFBQUFELFFBQUEsT0FBR0EsS0FBTTFJLElBQVQsR0FBUyxNQUFUO0FBQ0MrRixzQkFBZ0IvRixJQUFoQixHQUF1QjBJLEtBQUsxSSxJQUE1QjtBQUNBK0Ysc0JBQWdCbkQsTUFBaEIsR0FBeUI4RixLQUFLMUksSUFBTCxDQUFVK0IsR0FBbkM7QUNzQ0csYURyQ0gsSUNxQ0c7QUR4Q0o7QUMwQ0ksYUR0Q0MsS0NzQ0Q7QUFDRDtBRHZEVyxHQ3dDZCxDRDFPVSxDQW9OWDs7Ozs7Ozs7O0FDa0RDcUMsUUFBTU0sU0FBTixDRDFDRG9ELGNDMENDLEdEMUNlLFVBQUMvQixlQUFELEVBQWtCSixRQUFsQjtBQUNmLFFBQUErQyxJQUFBLEVBQUFyRyxLQUFBLEVBQUF1RyxpQkFBQTs7QUFBQSxRQUFHakQsU0FBUytCLGFBQVo7QUFDQ2dCLGFBQU8sS0FBQ3JFLEdBQUQsQ0FBS2EsT0FBTCxDQUFhd0QsSUFBYixDQUFrQjFJLElBQWxCLENBQXVCd0ksSUFBdkIsQ0FBNEJ6QyxlQUE1QixDQUFQOztBQUNBLFVBQUEyQyxRQUFBLE9BQUdBLEtBQU1HLE9BQVQsR0FBUyxNQUFUO0FBQ0NELDRCQUFvQjVHLEdBQUdiLFdBQUgsQ0FBZWMsSUFBZixDQUFvQjtBQUFDakMsZ0JBQU0wSSxLQUFLOUYsTUFBWjtBQUFvQlAsaUJBQU1xRyxLQUFLRztBQUEvQixTQUFwQixFQUE2REMsS0FBN0QsRUFBcEI7O0FBQ0EsWUFBR0YsaUJBQUg7QUFDQ3ZHLGtCQUFRTCxHQUFHWixNQUFILENBQVVHLE9BQVYsQ0FBa0JtSCxLQUFLRyxPQUF2QixDQUFSOztBQUVBLGVBQUF4RyxTQUFBLE9BQUdBLE1BQU9DLE9BQVYsR0FBVSxNQUFWLEtBQXNCL0IsRUFBRWdDLE9BQUYsQ0FBVUYsTUFBTUcsTUFBaEIsRUFBd0JrRyxLQUFLOUYsTUFBN0IsS0FBc0MsQ0FBNUQ7QUFDQ21ELDRCQUFnQjhDLE9BQWhCLEdBQTBCSCxLQUFLRyxPQUEvQjtBQUNBLG1CQUFPLElBQVA7QUFMRjtBQUZEO0FDdURJOztBRC9DSjlDLHNCQUFnQjhDLE9BQWhCLEdBQTBCLEtBQTFCO0FBQ0EsYUFBTyxLQUFQO0FDaURFOztBRGhESCxXQUFPLElBQVA7QUFiZSxHQzBDZixDRHRRVSxDQTJPWDs7Ozs7Ozs7O0FDNERDekUsUUFBTU0sU0FBTixDRHBERG1ELGFDb0RDLEdEcERjLFVBQUM5QixlQUFELEVBQWtCSixRQUFsQjtBQUNkLFFBQUdBLFNBQVMyQixZQUFaO0FBQ0MsVUFBRy9HLEVBQUVpSCxPQUFGLENBQVVqSCxFQUFFd0ksWUFBRixDQUFlcEQsU0FBUzJCLFlBQXhCLEVBQXNDdkIsZ0JBQWdCL0YsSUFBaEIsQ0FBcUJnSixLQUEzRCxDQUFWLENBQUg7QUFDQyxlQUFPLEtBQVA7QUFGRjtBQ3dERzs7QUFDRCxXRHRERixJQ3NERTtBRDFEWSxHQ29EZCxDRHZTVSxDQTBQWDs7OztBQzJEQzVFLFFBQU1NLFNBQU4sQ0R4RERvQyxRQ3dEQyxHRHhEUyxVQUFDTCxRQUFELEVBQVdGLElBQVgsRUFBaUJsRCxVQUFqQixFQUFpQ3dELE9BQWpDO0FBR1QsUUFBQW9DLGNBQUEsRUFBQUMsbUJBQUEsRUFBQUMsMEJBQUEsRUFBQUMsZ0NBQUEsRUFBQUMsWUFBQTs7QUN1REUsUUFBSWhHLGNBQWMsSUFBbEIsRUFBd0I7QUQxREFBLG1CQUFXLEdBQVg7QUM0RHZCOztBQUNELFFBQUl3RCxXQUFXLElBQWYsRUFBcUI7QUQ3RG1CQSxnQkFBUSxFQUFSO0FDK0R2Qzs7QUQ1REhvQyxxQkFBaUIsS0FBQ0ssY0FBRCxDQUFnQixLQUFDakYsR0FBRCxDQUFLYSxPQUFMLENBQWErRCxjQUE3QixDQUFqQjtBQUNBcEMsY0FBVSxLQUFDeUMsY0FBRCxDQUFnQnpDLE9BQWhCLENBQVY7QUFDQUEsY0FBVXRHLEVBQUU2RSxNQUFGLENBQVM2RCxjQUFULEVBQXlCcEMsT0FBekIsQ0FBVjs7QUFHQSxRQUFHQSxRQUFRLGNBQVIsRUFBd0IwQyxLQUF4QixDQUE4QixpQkFBOUIsTUFBc0QsSUFBekQ7QUFDQyxVQUFHLEtBQUNsRixHQUFELENBQUthLE9BQUwsQ0FBYXNFLFVBQWhCO0FBQ0NqRCxlQUFPa0QsS0FBS0MsU0FBTCxDQUFlbkQsSUFBZixFQUFxQixNQUFyQixFQUFnQyxDQUFoQyxDQUFQO0FBREQ7QUFHQ0EsZUFBT2tELEtBQUtDLFNBQUwsQ0FBZW5ELElBQWYsQ0FBUDtBQUpGO0FDaUVHOztBRDFESDhDLG1CQUFlO0FBQ2Q1QyxlQUFTa0QsU0FBVCxDQUFtQnRHLFVBQW5CLEVBQStCd0QsT0FBL0I7QUFDQUosZUFBU21ELEtBQVQsQ0FBZXJELElBQWY7QUM0REcsYUQzREhFLFNBQVN2QyxHQUFULEVDMkRHO0FEOURXLEtBQWY7O0FBSUEsUUFBR2IsZUFBZSxHQUFmLElBQUFBLGVBQW9CLEdBQXZCO0FBT0M4RixtQ0FBNkIsR0FBN0I7QUFDQUMseUNBQW1DLElBQUlTLEtBQUtDLE1BQUwsRUFBdkM7QUFDQVosNEJBQXNCQyw2QkFBNkJDLGdDQUFuRDtBQ3VERyxhRHRESC9ILE9BQU8wSSxVQUFQLENBQWtCVixZQUFsQixFQUFnQ0gsbUJBQWhDLENDc0RHO0FEaEVKO0FDa0VJLGFEdERIRyxjQ3NERztBQUNEO0FEdEZNLEdDd0RULENEclRVLENBOFJYOzs7O0FDNkRDakYsUUFBTU0sU0FBTixDRDFERDRFLGNDMERDLEdEMURlLFVBQUNVLE1BQUQ7QUMyRGIsV0QxREZ6SixFQUFFMEosS0FBRixDQUFRRCxNQUFSLEVBQ0NFLEtBREQsR0FFQ0MsR0FGRCxDQUVLLFVBQUNDLElBQUQ7QUN5REQsYUR4REgsQ0FBQ0EsS0FBSyxDQUFMLEVBQVFDLFdBQVIsRUFBRCxFQUF3QkQsS0FBSyxDQUFMLENBQXhCLENDd0RHO0FEM0RKLE9BSUNKLE1BSkQsR0FLQ00sS0FMRCxFQzBERTtBRDNEYSxHQzBEZjs7QUFNQSxTQUFPbEcsS0FBUDtBQUVELENEbldXLEVBQU4sQzs7Ozs7Ozs7Ozs7O0FFQU4sSUFBQW1HLE9BQUE7QUFBQSxJQUFBQyxhQUFBO0FBQUEsSUFBQUMsU0FBQTtBQUFBLElBQUFsSSxVQUFBLEdBQUFBLE9BQUEsY0FBQW1JLElBQUE7QUFBQSxXQUFBQyxJQUFBLEdBQUFDLElBQUEsS0FBQW5LLE1BQUEsRUFBQWtLLElBQUFDLENBQUEsRUFBQUQsR0FBQTtBQUFBLFFBQUFBLEtBQUEsYUFBQUEsQ0FBQSxNQUFBRCxJQUFBLFNBQUFDLENBQUE7QUFBQTs7QUFBQTtBQUFBOztBQUFBRixZQUFZaEwsUUFBUSxZQUFSLENBQVo7QUFDQThLLFVBQVU5SyxRQUFRLFNBQVIsQ0FBVjs7QUFFTSxLQUFDK0ssYUFBRCxHQUFDO0FBRU8sV0FBQUEsYUFBQSxDQUFDakcsT0FBRDtBQUNaLFFBQUFzRyxXQUFBO0FBQUEsU0FBQ0MsT0FBRCxHQUFXLEVBQVg7QUFDQSxTQUFDNUYsT0FBRCxHQUNDO0FBQUFDLGFBQU8sRUFBUDtBQUNBNEYsc0JBQWdCLEtBRGhCO0FBRUFyRixlQUFTLE1BRlQ7QUFHQXNGLGVBQVMsSUFIVDtBQUlBeEIsa0JBQVksS0FKWjtBQUtBZCxZQUNDO0FBQUEvRixlQUFPLHlDQUFQO0FBQ0EzQyxjQUFNO0FBQ0wsY0FBQWlMLEtBQUEsRUFBQXBLLFNBQUEsRUFBQW5CLE9BQUEsRUFBQW1KLE9BQUEsRUFBQWxHLEtBQUEsRUFBQUMsTUFBQTs7QUFBQWxELG9CQUFVLElBQUk2SyxPQUFKLENBQWEsS0FBQy9ELE9BQWQsRUFBdUIsS0FBQ0MsUUFBeEIsQ0FBVjtBQUNBN0QsbUJBQVMsS0FBQzRELE9BQUQsQ0FBU0ssT0FBVCxDQUFpQixXQUFqQixLQUFpQ25ILFFBQVF3TCxHQUFSLENBQVksV0FBWixDQUExQztBQUNBckssc0JBQVksS0FBQzJGLE9BQUQsQ0FBU0ssT0FBVCxDQUFpQixjQUFqQixLQUFvQ25ILFFBQVF3TCxHQUFSLENBQVksY0FBWixDQUFoRDtBQUNBckMsb0JBQVUsS0FBQ3JDLE9BQUQsQ0FBU0ssT0FBVCxDQUFpQixZQUFqQixLQUFrQyxLQUFDWCxTQUFELENBQVcsU0FBWCxDQUE1Qzs7QUFDQSxjQUFHckYsU0FBSDtBQUNDOEIsb0JBQVFsQixTQUFTMEosZUFBVCxDQUF5QnRLLFNBQXpCLENBQVI7QUNNSzs7QURMTixjQUFHLEtBQUMyRixPQUFELENBQVM1RCxNQUFaO0FBQ0NxSSxvQkFBUWpKLEdBQUdWLEtBQUgsQ0FBU0MsT0FBVCxDQUFpQjtBQUFDUSxtQkFBSyxLQUFDeUUsT0FBRCxDQUFTNUQ7QUFBZixhQUFqQixDQUFSO0FDU00sbUJEUk47QUFBQTVDLG9CQUFNaUwsS0FBTjtBQUNBckksc0JBQVFBLE1BRFI7QUFFQWlHLHVCQUFTQSxPQUZUO0FBR0FsRyxxQkFBT0E7QUFIUCxhQ1FNO0FEVlA7QUNpQk8sbUJEVk47QUFBQUMsc0JBQVFBLE1BQVI7QUFDQWlHLHVCQUFTQSxPQURUO0FBRUFsRyxxQkFBT0E7QUFGUCxhQ1VNO0FBS0Q7QUQ5QlA7QUFBQSxPQU5EO0FBd0JBc0csc0JBQ0M7QUFBQSx3QkFBZ0I7QUFBaEIsT0F6QkQ7QUEwQkFtQyxrQkFBWTtBQTFCWixLQUREOztBQThCQTdLLE1BQUU2RSxNQUFGLENBQVMsS0FBQ0YsT0FBVixFQUFtQlgsT0FBbkI7O0FBRUEsUUFBRyxLQUFDVyxPQUFELENBQVNrRyxVQUFaO0FBQ0NQLG9CQUNDO0FBQUEsdUNBQStCLEdBQS9CO0FBQ0Esd0NBQWdDO0FBRGhDLE9BREQ7O0FBSUEsVUFBRyxLQUFDM0YsT0FBRCxDQUFTNkYsY0FBWjtBQUNDRixvQkFBWSw4QkFBWixLQUErQyx1Q0FBL0M7QUNlRzs7QURaSnRLLFFBQUU2RSxNQUFGLENBQVMsS0FBQ0YsT0FBRCxDQUFTK0QsY0FBbEIsRUFBa0M0QixXQUFsQzs7QUFFQSxVQUFHLENBQUksS0FBQzNGLE9BQUQsQ0FBU0csc0JBQWhCO0FBQ0MsYUFBQ0gsT0FBRCxDQUFTRyxzQkFBVCxHQUFrQztBQUNqQyxlQUFDb0IsUUFBRCxDQUFVa0QsU0FBVixDQUFvQixHQUFwQixFQUF5QmtCLFdBQXpCO0FDYUssaUJEWkwsS0FBQ25FLElBQUQsRUNZSztBRGQ0QixTQUFsQztBQVpGO0FDNkJHOztBRFpILFFBQUcsS0FBQ3hCLE9BQUQsQ0FBU1EsT0FBVCxDQUFpQixDQUFqQixNQUF1QixHQUExQjtBQUNDLFdBQUNSLE9BQUQsQ0FBU1EsT0FBVCxHQUFtQixLQUFDUixPQUFELENBQVNRLE9BQVQsQ0FBaUIyRixLQUFqQixDQUF1QixDQUF2QixDQUFuQjtBQ2NFOztBRGJILFFBQUc5SyxFQUFFK0ssSUFBRixDQUFPLEtBQUNwRyxPQUFELENBQVNRLE9BQWhCLE1BQThCLEdBQWpDO0FBQ0MsV0FBQ1IsT0FBRCxDQUFTUSxPQUFULEdBQW1CLEtBQUNSLE9BQUQsQ0FBU1EsT0FBVCxHQUFtQixHQUF0QztBQ2VFOztBRFhILFFBQUcsS0FBQ1IsT0FBRCxDQUFTOEYsT0FBWjtBQUNDLFdBQUM5RixPQUFELENBQVNRLE9BQVQsSUFBb0IsS0FBQ1IsT0FBRCxDQUFTOEYsT0FBVCxHQUFtQixHQUF2QztBQ2FFOztBRFZILFFBQUcsS0FBQzlGLE9BQUQsQ0FBUzZGLGNBQVo7QUFDQyxXQUFDUSxTQUFEO0FBREQsV0FFSyxJQUFHLEtBQUNyRyxPQUFELENBQVNzRyxPQUFaO0FBQ0osV0FBQ0QsU0FBRDs7QUFDQTdILGNBQVErSCxJQUFSLENBQWEseUVBQ1gsNkNBREY7QUNZRTs7QURUSCxXQUFPLElBQVA7QUFyRVksR0FGUCxDQTBFTjs7Ozs7Ozs7Ozs7OztBQ3dCQ2pCLGdCQUFjOUYsU0FBZCxDRFpEZ0gsUUNZQyxHRFpTLFVBQUNwSCxJQUFELEVBQU9DLE9BQVAsRUFBZ0JFLFNBQWhCO0FBRVQsUUFBQWtILEtBQUE7QUFBQUEsWUFBUSxJQUFJeEgsTUFBTUMsS0FBVixDQUFnQixJQUFoQixFQUFzQkUsSUFBdEIsRUFBNEJDLE9BQTVCLEVBQXFDRSxTQUFyQyxDQUFSOztBQUNBLFNBQUNxRyxPQUFELENBQVNySSxJQUFULENBQWNrSixLQUFkOztBQUVBQSxVQUFNaEgsUUFBTjtBQUVBLFdBQU8sSUFBUDtBQVBTLEdDWVQsQ0RsR0ssQ0FnR047Ozs7QUNlQzZGLGdCQUFjOUYsU0FBZCxDRFpEa0gsYUNZQyxHRFpjLFVBQUNDLFVBQUQsRUFBYXRILE9BQWI7QUFDZCxRQUFBdUgsbUJBQUEsRUFBQUMsd0JBQUEsRUFBQUMsOEJBQUEsRUFBQUMsb0JBQUEsRUFBQUMsaUJBQUEsRUFBQUMsT0FBQSxFQUFBQyxtQkFBQSxFQUFBOUgsSUFBQSxFQUFBK0gsWUFBQTs7QUNhRSxRQUFJOUgsV0FBVyxJQUFmLEVBQXFCO0FEZElBLGdCQUFRLEVBQVI7QUNnQnhCOztBRGZINEgsY0FBVSxDQUFDLEtBQUQsRUFBUSxNQUFSLEVBQWdCLEtBQWhCLEVBQXVCLFFBQXZCLEVBQWlDLFFBQWpDLENBQVY7QUFDQUMsMEJBQXNCLENBQUMsTUFBRCxFQUFTLFFBQVQsQ0FBdEI7O0FBR0EsUUFBR1AsZUFBY3hLLE9BQU9DLEtBQXhCO0FBQ0N3Syw0QkFBc0IsS0FBQ1Esd0JBQXZCO0FBREQ7QUFHQ1IsNEJBQXNCLEtBQUNTLG9CQUF2QjtBQ2VFOztBRFpIUCxxQ0FBaUN6SCxRQUFRRSxTQUFSLElBQXFCLEVBQXREO0FBQ0E0SCxtQkFBZTlILFFBQVE4SCxZQUFSLElBQXdCLEVBQXZDO0FBQ0FILHdCQUFvQjNILFFBQVEySCxpQkFBUixJQUE2QixFQUFqRDtBQUVBNUgsV0FBT0MsUUFBUUQsSUFBUixJQUFnQnVILFdBQVdXLEtBQWxDO0FBSUFULCtCQUEyQixFQUEzQjtBQUNBRSwyQkFBdUIsRUFBdkI7O0FBQ0EsUUFBRzFMLEVBQUVpSCxPQUFGLENBQVV3RSw4QkFBVixLQUE4Q3pMLEVBQUVpSCxPQUFGLENBQVUwRSxpQkFBVixDQUFqRDtBQUVDM0wsUUFBRTRCLElBQUYsQ0FBT2dLLE9BQVAsRUFBZ0IsVUFBQ2xJLE1BQUQ7QUFFZixZQUFHMUIsUUFBQWlHLElBQUEsQ0FBVTRELG1CQUFWLEVBQUFuSSxNQUFBLE1BQUg7QUFDQzFELFlBQUU2RSxNQUFGLENBQVMyRyx3QkFBVCxFQUFtQ0Qsb0JBQW9CN0gsTUFBcEIsRUFBNEJ1RSxJQUE1QixDQUFpQyxJQUFqQyxFQUF1Q3FELFVBQXZDLENBQW5DO0FBREQ7QUFFS3RMLFlBQUU2RSxNQUFGLENBQVM2RyxvQkFBVCxFQUErQkgsb0JBQW9CN0gsTUFBcEIsRUFBNEJ1RSxJQUE1QixDQUFpQyxJQUFqQyxFQUF1Q3FELFVBQXZDLENBQS9CO0FDU0E7QURiTixTQU1FLElBTkY7QUFGRDtBQVdDdEwsUUFBRTRCLElBQUYsQ0FBT2dLLE9BQVAsRUFBZ0IsVUFBQ2xJLE1BQUQ7QUFDZixZQUFBd0ksa0JBQUEsRUFBQUMsZUFBQTs7QUFBQSxZQUFHbkssUUFBQWlHLElBQUEsQ0FBYzBELGlCQUFkLEVBQUFqSSxNQUFBLFNBQW9DK0gsK0JBQStCL0gsTUFBL0IsTUFBNEMsS0FBbkY7QUFHQ3lJLDRCQUFrQlYsK0JBQStCL0gsTUFBL0IsQ0FBbEI7QUFDQXdJLCtCQUFxQixFQUFyQjs7QUFDQWxNLFlBQUU0QixJQUFGLENBQU8ySixvQkFBb0I3SCxNQUFwQixFQUE0QnVFLElBQTVCLENBQWlDLElBQWpDLEVBQXVDcUQsVUFBdkMsQ0FBUCxFQUEyRCxVQUFDMUUsTUFBRCxFQUFTd0YsVUFBVDtBQ09wRCxtQkROTkYsbUJBQW1CRSxVQUFuQixJQUNDcE0sRUFBRTBKLEtBQUYsQ0FBUTlDLE1BQVIsRUFDQ3lGLEtBREQsR0FFQ3hILE1BRkQsQ0FFUXNILGVBRlIsRUFHQ3BDLEtBSEQsRUNLSztBRFBQOztBQU9BLGNBQUcvSCxRQUFBaUcsSUFBQSxDQUFVNEQsbUJBQVYsRUFBQW5JLE1BQUEsTUFBSDtBQUNDMUQsY0FBRTZFLE1BQUYsQ0FBUzJHLHdCQUFULEVBQW1DVSxrQkFBbkM7QUFERDtBQUVLbE0sY0FBRTZFLE1BQUYsQ0FBUzZHLG9CQUFULEVBQStCUSxrQkFBL0I7QUFkTjtBQ21CSztBRHBCTixTQWlCRSxJQWpCRjtBQ3NCRTs7QURGSCxTQUFDZixRQUFELENBQVVwSCxJQUFWLEVBQWdCK0gsWUFBaEIsRUFBOEJOLHdCQUE5QjtBQUNBLFNBQUNMLFFBQUQsQ0FBYXBILE9BQUssTUFBbEIsRUFBeUIrSCxZQUF6QixFQUF1Q0osb0JBQXZDO0FBRUEsV0FBTyxJQUFQO0FBdkRjLEdDWWQsQ0QvR0ssQ0E2Sk47Ozs7QUNPQ3pCLGdCQUFjOUYsU0FBZCxDREpENkgsb0JDSUMsR0RIQTtBQUFBckIsU0FBSyxVQUFDVyxVQUFEO0FDS0QsYURKSDtBQUFBWCxhQUNDO0FBQUEvRCxrQkFBUTtBQUNQLGdCQUFBMEYsTUFBQSxFQUFBQyxRQUFBO0FBQUFBLHVCQUFXO0FBQUMvSyxtQkFBSyxLQUFDbUUsU0FBRCxDQUFXaEc7QUFBakIsYUFBWDs7QUFDQSxnQkFBRyxLQUFLMkksT0FBUjtBQUNDaUUsdUJBQVN6SyxLQUFULEdBQWlCLEtBQUt3RyxPQUF0QjtBQ1NPOztBRFJSZ0UscUJBQVNoQixXQUFXdEssT0FBWCxDQUFtQnVMLFFBQW5CLENBQVQ7O0FBQ0EsZ0JBQUdELE1BQUg7QUNVUyxxQkRUUjtBQUFDdkosd0JBQVEsU0FBVDtBQUFvQnlKLHNCQUFNRjtBQUExQixlQ1NRO0FEVlQ7QUNlUyxxQkRaUjtBQUFBeEosNEJBQVksR0FBWjtBQUNBa0Qsc0JBQU07QUFBQ2pELDBCQUFRLE1BQVQ7QUFBaUJ5RCwyQkFBUztBQUExQjtBQUROLGVDWVE7QUFPRDtBRDNCVDtBQUFBO0FBREQsT0NJRztBRExKO0FBWUFpRyxTQUFLLFVBQUNuQixVQUFEO0FDdUJELGFEdEJIO0FBQUFtQixhQUNDO0FBQUE3RixrQkFBUTtBQUNQLGdCQUFBMEYsTUFBQSxFQUFBSSxlQUFBLEVBQUFILFFBQUE7QUFBQUEsdUJBQVc7QUFBQy9LLG1CQUFLLEtBQUNtRSxTQUFELENBQVdoRztBQUFqQixhQUFYOztBQUNBLGdCQUFHLEtBQUsySSxPQUFSO0FBQ0NpRSx1QkFBU3pLLEtBQVQsR0FBaUIsS0FBS3dHLE9BQXRCO0FDMkJPOztBRDFCUm9FLDhCQUFrQnBCLFdBQVdxQixNQUFYLENBQWtCSixRQUFsQixFQUE0QjtBQUFBSyxvQkFBTSxLQUFDN0c7QUFBUCxhQUE1QixDQUFsQjs7QUFDQSxnQkFBRzJHLGVBQUg7QUFDQ0osdUJBQVNoQixXQUFXdEssT0FBWCxDQUFtQixLQUFDMkUsU0FBRCxDQUFXaEcsRUFBOUIsQ0FBVDtBQzhCUSxxQkQ3QlI7QUFBQ29ELHdCQUFRLFNBQVQ7QUFBb0J5SixzQkFBTUY7QUFBMUIsZUM2QlE7QUQvQlQ7QUNvQ1MscUJEaENSO0FBQUF4Siw0QkFBWSxHQUFaO0FBQ0FrRCxzQkFBTTtBQUFDakQsMEJBQVEsTUFBVDtBQUFpQnlELDJCQUFTO0FBQTFCO0FBRE4sZUNnQ1E7QUFPRDtBRGhEVDtBQUFBO0FBREQsT0NzQkc7QURuQ0o7QUF5QkEsY0FBUSxVQUFDOEUsVUFBRDtBQzJDSixhRDFDSDtBQUFBLGtCQUNDO0FBQUExRSxrQkFBUTtBQUNQLGdCQUFBMkYsUUFBQTtBQUFBQSx1QkFBVztBQUFDL0ssbUJBQUssS0FBQ21FLFNBQUQsQ0FBV2hHO0FBQWpCLGFBQVg7O0FBQ0EsZ0JBQUcsS0FBSzJJLE9BQVI7QUFDQ2lFLHVCQUFTekssS0FBVCxHQUFpQixLQUFLd0csT0FBdEI7QUMrQ087O0FEOUNSLGdCQUFHZ0QsV0FBV3VCLE1BQVgsQ0FBa0JOLFFBQWxCLENBQUg7QUNnRFMscUJEL0NSO0FBQUN4Six3QkFBUSxTQUFUO0FBQW9CeUosc0JBQU07QUFBQWhHLDJCQUFTO0FBQVQ7QUFBMUIsZUMrQ1E7QURoRFQ7QUN1RFMscUJEcERSO0FBQUExRCw0QkFBWSxHQUFaO0FBQ0FrRCxzQkFBTTtBQUFDakQsMEJBQVEsTUFBVDtBQUFpQnlELDJCQUFTO0FBQTFCO0FBRE4sZUNvRFE7QUFPRDtBRGxFVDtBQUFBO0FBREQsT0MwQ0c7QURwRUo7QUFvQ0FzRyxVQUFNLFVBQUN4QixVQUFEO0FDK0RGLGFEOURIO0FBQUF3QixjQUNDO0FBQUFsRyxrQkFBUTtBQUNQLGdCQUFBMEYsTUFBQSxFQUFBUyxRQUFBOztBQUFBLGdCQUFHLEtBQUt6RSxPQUFSO0FBQ0MsbUJBQUN2QyxVQUFELENBQVlqRSxLQUFaLEdBQW9CLEtBQUt3RyxPQUF6QjtBQ2lFTzs7QURoRVJ5RSx1QkFBV3pCLFdBQVcwQixNQUFYLENBQWtCLEtBQUNqSCxVQUFuQixDQUFYO0FBQ0F1RyxxQkFBU2hCLFdBQVd0SyxPQUFYLENBQW1CK0wsUUFBbkIsQ0FBVDs7QUFDQSxnQkFBR1QsTUFBSDtBQ2tFUyxxQkRqRVI7QUFBQXhKLDRCQUFZLEdBQVo7QUFDQWtELHNCQUFNO0FBQUNqRCwwQkFBUSxTQUFUO0FBQW9CeUosd0JBQU1GO0FBQTFCO0FBRE4sZUNpRVE7QURsRVQ7QUMwRVMscUJEdEVSO0FBQUF4Siw0QkFBWSxHQUFaO0FBQ0FrRCxzQkFBTTtBQUFDakQsMEJBQVEsTUFBVDtBQUFpQnlELDJCQUFTO0FBQTFCO0FBRE4sZUNzRVE7QUFPRDtBRHRGVDtBQUFBO0FBREQsT0M4REc7QURuR0o7QUFpREF5RyxZQUFRLFVBQUMzQixVQUFEO0FDaUZKLGFEaEZIO0FBQUFYLGFBQ0M7QUFBQS9ELGtCQUFRO0FBQ1AsZ0JBQUFzRyxRQUFBLEVBQUFYLFFBQUE7QUFBQUEsdUJBQVcsRUFBWDs7QUFDQSxnQkFBRyxLQUFLakUsT0FBUjtBQUNDaUUsdUJBQVN6SyxLQUFULEdBQWlCLEtBQUt3RyxPQUF0QjtBQ21GTzs7QURsRlI0RSx1QkFBVzVCLFdBQVc1SixJQUFYLENBQWdCNkssUUFBaEIsRUFBMEI1SyxLQUExQixFQUFYOztBQUNBLGdCQUFHdUwsUUFBSDtBQ29GUyxxQkRuRlI7QUFBQ25LLHdCQUFRLFNBQVQ7QUFBb0J5SixzQkFBTVU7QUFBMUIsZUNtRlE7QURwRlQ7QUN5RlMscUJEdEZSO0FBQUFwSyw0QkFBWSxHQUFaO0FBQ0FrRCxzQkFBTTtBQUFDakQsMEJBQVEsTUFBVDtBQUFpQnlELDJCQUFTO0FBQTFCO0FBRE4sZUNzRlE7QUFPRDtBRHJHVDtBQUFBO0FBREQsT0NnRkc7QURsSUo7QUFBQSxHQ0dBLENEcEtLLENBZ09OOzs7QUNxR0N5RCxnQkFBYzlGLFNBQWQsQ0RsR0Q0SCx3QkNrR0MsR0RqR0E7QUFBQXBCLFNBQUssVUFBQ1csVUFBRDtBQ21HRCxhRGxHSDtBQUFBWCxhQUNDO0FBQUEvRCxrQkFBUTtBQUNQLGdCQUFBMEYsTUFBQTtBQUFBQSxxQkFBU2hCLFdBQVd0SyxPQUFYLENBQW1CLEtBQUMyRSxTQUFELENBQVdoRyxFQUE5QixFQUFrQztBQUFBd04sc0JBQVE7QUFBQUMseUJBQVM7QUFBVDtBQUFSLGFBQWxDLENBQVQ7O0FBQ0EsZ0JBQUdkLE1BQUg7QUN5R1MscUJEeEdSO0FBQUN2Six3QkFBUSxTQUFUO0FBQW9CeUosc0JBQU1GO0FBQTFCLGVDd0dRO0FEekdUO0FDOEdTLHFCRDNHUjtBQUFBeEosNEJBQVksR0FBWjtBQUNBa0Qsc0JBQU07QUFBQ2pELDBCQUFRLE1BQVQ7QUFBaUJ5RCwyQkFBUztBQUExQjtBQUROLGVDMkdRO0FBT0Q7QUR2SFQ7QUFBQTtBQURELE9Da0dHO0FEbkdKO0FBU0FpRyxTQUFLLFVBQUNuQixVQUFEO0FDc0hELGFEckhIO0FBQUFtQixhQUNDO0FBQUE3RixrQkFBUTtBQUNQLGdCQUFBMEYsTUFBQSxFQUFBSSxlQUFBO0FBQUFBLDhCQUFrQnBCLFdBQVdxQixNQUFYLENBQWtCLEtBQUNoSCxTQUFELENBQVdoRyxFQUE3QixFQUFpQztBQUFBaU4sb0JBQU07QUFBQVEseUJBQVMsS0FBQ3JIO0FBQVY7QUFBTixhQUFqQyxDQUFsQjs7QUFDQSxnQkFBRzJHLGVBQUg7QUFDQ0osdUJBQVNoQixXQUFXdEssT0FBWCxDQUFtQixLQUFDMkUsU0FBRCxDQUFXaEcsRUFBOUIsRUFBa0M7QUFBQXdOLHdCQUFRO0FBQUFDLDJCQUFTO0FBQVQ7QUFBUixlQUFsQyxDQUFUO0FDZ0lRLHFCRC9IUjtBQUFDckssd0JBQVEsU0FBVDtBQUFvQnlKLHNCQUFNRjtBQUExQixlQytIUTtBRGpJVDtBQ3NJUyxxQkRsSVI7QUFBQXhKLDRCQUFZLEdBQVo7QUFDQWtELHNCQUFNO0FBQUNqRCwwQkFBUSxNQUFUO0FBQWlCeUQsMkJBQVM7QUFBMUI7QUFETixlQ2tJUTtBQU9EO0FEL0lUO0FBQUE7QUFERCxPQ3FIRztBRC9ISjtBQW1CQSxjQUFRLFVBQUM4RSxVQUFEO0FDNklKLGFENUlIO0FBQUEsa0JBQ0M7QUFBQTFFLGtCQUFRO0FBQ1AsZ0JBQUcwRSxXQUFXdUIsTUFBWCxDQUFrQixLQUFDbEgsU0FBRCxDQUFXaEcsRUFBN0IsQ0FBSDtBQzhJUyxxQkQ3SVI7QUFBQ29ELHdCQUFRLFNBQVQ7QUFBb0J5SixzQkFBTTtBQUFBaEcsMkJBQVM7QUFBVDtBQUExQixlQzZJUTtBRDlJVDtBQ3FKUyxxQkRsSlI7QUFBQTFELDRCQUFZLEdBQVo7QUFDQWtELHNCQUFNO0FBQUNqRCwwQkFBUSxNQUFUO0FBQWlCeUQsMkJBQVM7QUFBMUI7QUFETixlQ2tKUTtBQU9EO0FEN0pUO0FBQUE7QUFERCxPQzRJRztBRGhLSjtBQTJCQXNHLFVBQU0sVUFBQ3hCLFVBQUQ7QUM2SkYsYUQ1Skg7QUFBQXdCLGNBQ0M7QUFBQWxHLGtCQUFRO0FBRVAsZ0JBQUEwRixNQUFBLEVBQUFTLFFBQUE7QUFBQUEsdUJBQVc3TCxTQUFTbU0sVUFBVCxDQUFvQixLQUFDdEgsVUFBckIsQ0FBWDtBQUNBdUcscUJBQVNoQixXQUFXdEssT0FBWCxDQUFtQitMLFFBQW5CLEVBQTZCO0FBQUFJLHNCQUFRO0FBQUFDLHlCQUFTO0FBQVQ7QUFBUixhQUE3QixDQUFUOztBQUNBLGdCQUFHZCxNQUFIO0FDa0tTLHFCRGpLUjtBQUFBeEosNEJBQVksR0FBWjtBQUNBa0Qsc0JBQU07QUFBQ2pELDBCQUFRLFNBQVQ7QUFBb0J5Six3QkFBTUY7QUFBMUI7QUFETixlQ2lLUTtBRGxLVDtBQUlDO0FBQUF4Siw0QkFBWTtBQUFaO0FDeUtRLHFCRHhLUjtBQUFDQyx3QkFBUSxNQUFUO0FBQWlCeUQseUJBQVM7QUFBMUIsZUN3S1E7QUFJRDtBRHJMVDtBQUFBO0FBREQsT0M0Skc7QUR4TEo7QUF1Q0F5RyxZQUFRLFVBQUMzQixVQUFEO0FDaUxKLGFEaExIO0FBQUFYLGFBQ0M7QUFBQS9ELGtCQUFRO0FBQ1AsZ0JBQUFzRyxRQUFBO0FBQUFBLHVCQUFXNUIsV0FBVzVKLElBQVgsQ0FBZ0IsRUFBaEIsRUFBb0I7QUFBQXlMLHNCQUFRO0FBQUFDLHlCQUFTO0FBQVQ7QUFBUixhQUFwQixFQUF3Q3pMLEtBQXhDLEVBQVg7O0FBQ0EsZ0JBQUd1TCxRQUFIO0FDdUxTLHFCRHRMUjtBQUFDbkssd0JBQVEsU0FBVDtBQUFvQnlKLHNCQUFNVTtBQUExQixlQ3NMUTtBRHZMVDtBQzRMUyxxQkR6TFI7QUFBQXBLLDRCQUFZLEdBQVo7QUFDQWtELHNCQUFNO0FBQUNqRCwwQkFBUSxNQUFUO0FBQWlCeUQsMkJBQVM7QUFBMUI7QUFETixlQ3lMUTtBQU9EO0FEck1UO0FBQUE7QUFERCxPQ2dMRztBRHhOSjtBQUFBLEdDaUdBLENEclVLLENBc1JOOzs7O0FDd01DeUQsZ0JBQWM5RixTQUFkLENEck1ENkcsU0NxTUMsR0RyTVU7QUFDVixRQUFBc0MsTUFBQSxFQUFBN0ksSUFBQTtBQUFBQSxXQUFPLElBQVAsQ0FEVSxDQUVWOzs7Ozs7QUFNQSxTQUFDMEcsUUFBRCxDQUFVLE9BQVYsRUFBbUI7QUFBQ2pFLG9CQUFjO0FBQWYsS0FBbkIsRUFDQztBQUFBNEYsWUFBTTtBQUVMLFlBQUEzRSxJQUFBLEVBQUFvRixDQUFBLEVBQUFDLFNBQUEsRUFBQTdNLEdBQUEsRUFBQWtHLElBQUEsRUFBQVgsUUFBQSxFQUFBdUgsV0FBQSxFQUFBaE8sSUFBQTtBQUFBQSxlQUFPLEVBQVA7O0FBQ0EsWUFBRyxLQUFDc0csVUFBRCxDQUFZdEcsSUFBZjtBQUNDLGNBQUcsS0FBQ3NHLFVBQUQsQ0FBWXRHLElBQVosQ0FBaUJ1QyxPQUFqQixDQUF5QixHQUF6QixNQUFpQyxDQUFDLENBQXJDO0FBQ0N2QyxpQkFBS0ssUUFBTCxHQUFnQixLQUFDaUcsVUFBRCxDQUFZdEcsSUFBNUI7QUFERDtBQUdDQSxpQkFBS00sS0FBTCxHQUFhLEtBQUNnRyxVQUFELENBQVl0RyxJQUF6QjtBQUpGO0FBQUEsZUFLSyxJQUFHLEtBQUNzRyxVQUFELENBQVlqRyxRQUFmO0FBQ0pMLGVBQUtLLFFBQUwsR0FBZ0IsS0FBQ2lHLFVBQUQsQ0FBWWpHLFFBQTVCO0FBREksZUFFQSxJQUFHLEtBQUNpRyxVQUFELENBQVloRyxLQUFmO0FBQ0pOLGVBQUtNLEtBQUwsR0FBYSxLQUFDZ0csVUFBRCxDQUFZaEcsS0FBekI7QUMyTUk7O0FEeE1MO0FBQ0NvSSxpQkFBTzdJLEtBQUtjLGlCQUFMLENBQXVCWCxJQUF2QixFQUE2QixLQUFDc0csVUFBRCxDQUFZMUYsUUFBekMsQ0FBUDtBQURELGlCQUFBZSxLQUFBO0FBRU1tTSxjQUFBbk0sS0FBQTtBQUNMK0Isa0JBQVEvQixLQUFSLENBQWNtTSxDQUFkO0FBQ0EsaUJBQ0M7QUFBQXpLLHdCQUFZeUssRUFBRW5NLEtBQWQ7QUFDQTRFLGtCQUFNO0FBQUFqRCxzQkFBUSxPQUFSO0FBQWlCeUQsdUJBQVMrRyxFQUFFRztBQUE1QjtBQUROLFdBREQ7QUNpTkk7O0FEM01MLFlBQUd2RixLQUFLOUYsTUFBTCxJQUFnQjhGLEtBQUs3SCxTQUF4QjtBQUNDbU4sd0JBQWMsRUFBZDtBQUNBQSxzQkFBWWhKLEtBQUtFLE9BQUwsQ0FBYXdELElBQWIsQ0FBa0IvRixLQUE5QixJQUF1Q2xCLFNBQVMwSixlQUFULENBQXlCekMsS0FBSzdILFNBQTlCLENBQXZDO0FBQ0EsZUFBQ2IsSUFBRCxHQUFRcUIsT0FBT0MsS0FBUCxDQUFhQyxPQUFiLENBQ1A7QUFBQSxtQkFBT21ILEtBQUs5RjtBQUFaLFdBRE8sRUFFUG9MLFdBRk8sQ0FBUjtBQUdBLGVBQUNwTCxNQUFELElBQUExQixNQUFBLEtBQUFsQixJQUFBLFlBQUFrQixJQUFpQmEsR0FBakIsR0FBaUIsTUFBakI7QUM2TUk7O0FEM01MMEUsbUJBQVc7QUFBQ25ELGtCQUFRLFNBQVQ7QUFBb0J5SixnQkFBTXJFO0FBQTFCLFNBQVg7QUFHQXFGLG9CQUFBLENBQUEzRyxPQUFBcEMsS0FBQUUsT0FBQSxDQUFBZ0osVUFBQSxZQUFBOUcsS0FBcUNvQixJQUFyQyxDQUEwQyxJQUExQyxJQUFZLE1BQVo7O0FBQ0EsWUFBR3VGLGFBQUEsSUFBSDtBQUNDeE4sWUFBRTZFLE1BQUYsQ0FBU3FCLFNBQVNzRyxJQUFsQixFQUF3QjtBQUFDb0IsbUJBQU9KO0FBQVIsV0FBeEI7QUNnTkk7O0FBQ0QsZUQvTUp0SCxRQytNSTtBRHRQTDtBQUFBLEtBREQ7O0FBMENBb0gsYUFBUztBQUVSLFVBQUFoTixTQUFBLEVBQUFrTixTQUFBLEVBQUEvTSxXQUFBLEVBQUFvTixLQUFBLEVBQUFsTixHQUFBLEVBQUF1RixRQUFBLEVBQUE0SCxjQUFBLEVBQUFDLGFBQUEsRUFBQUMsU0FBQSxFQUFBQyxpQkFBQSxFQUFBQyxhQUFBO0FBQUE1TixrQkFBWSxLQUFDMkYsT0FBRCxDQUFTSyxPQUFULENBQWlCLGNBQWpCLENBQVo7QUFDQTdGLG9CQUFjUyxTQUFTMEosZUFBVCxDQUF5QnRLLFNBQXpCLENBQWQ7QUFDQXlOLHNCQUFnQnRKLEtBQUtFLE9BQUwsQ0FBYXdELElBQWIsQ0FBa0IvRixLQUFsQztBQUNBeUwsY0FBUUUsY0FBY0ksV0FBZCxDQUEwQixHQUExQixDQUFSO0FBQ0FILGtCQUFZRCxjQUFjSyxTQUFkLENBQXdCLENBQXhCLEVBQTJCUCxLQUEzQixDQUFaO0FBQ0FDLHVCQUFpQkMsY0FBY0ssU0FBZCxDQUF3QlAsUUFBUSxDQUFoQyxDQUFqQjtBQUNBSyxzQkFBZ0IsRUFBaEI7QUFDQUEsb0JBQWNKLGNBQWQsSUFBZ0NyTixXQUFoQztBQUNBd04sMEJBQW9CLEVBQXBCO0FBQ0FBLHdCQUFrQkQsU0FBbEIsSUFBK0JFLGFBQS9CO0FBQ0FwTixhQUFPQyxLQUFQLENBQWE0TCxNQUFiLENBQW9CLEtBQUNsTixJQUFELENBQU0rQixHQUExQixFQUErQjtBQUFDNk0sZUFBT0o7QUFBUixPQUEvQjtBQUVBL0gsaUJBQVc7QUFBQ25ELGdCQUFRLFNBQVQ7QUFBb0J5SixjQUFNO0FBQUNoRyxtQkFBUztBQUFWO0FBQTFCLE9BQVg7QUFHQWdILGtCQUFBLENBQUE3TSxNQUFBOEQsS0FBQUUsT0FBQSxDQUFBMkosV0FBQSxZQUFBM04sSUFBc0NzSCxJQUF0QyxDQUEyQyxJQUEzQyxJQUFZLE1BQVo7O0FBQ0EsVUFBR3VGLGFBQUEsSUFBSDtBQUNDeE4sVUFBRTZFLE1BQUYsQ0FBU3FCLFNBQVNzRyxJQUFsQixFQUF3QjtBQUFDb0IsaUJBQU9KO0FBQVIsU0FBeEI7QUN1Tkc7O0FBQ0QsYUR0Tkh0SCxRQ3NORztBRDNPSyxLQUFULENBbERVLENBeUVWOzs7Ozs7O0FDNk5FLFdEdk5GLEtBQUNpRixRQUFELENBQVUsUUFBVixFQUFvQjtBQUFDakUsb0JBQWM7QUFBZixLQUFwQixFQUNDO0FBQUF5RCxXQUFLO0FBQ0p4SCxnQkFBUStILElBQVIsQ0FBYSxxRkFBYjtBQUNBL0gsZ0JBQVErSCxJQUFSLENBQWEsK0RBQWI7QUFDQSxlQUFPb0MsT0FBT3JGLElBQVAsQ0FBWSxJQUFaLENBQVA7QUFIRDtBQUlBNkUsWUFBTVE7QUFKTixLQURELENDdU5FO0FEdFNRLEdDcU1WOztBQTZHQSxTQUFPckQsYUFBUDtBQUVELENEN2tCTSxFQUFEOztBQStXTkEsZ0JBQWdCLEtBQUNBLGFBQWpCLEM7Ozs7Ozs7Ozs7OztBRWxYQW5KLE9BQU95TixPQUFQLENBQWU7QUFFZCxNQUFBQyxTQUFBLEVBQUFDLFVBQUE7O0FBQUFBLGVBQWEsVUFBQ25HLE9BQUQsRUFBVWpHLE1BQVYsRUFBa0JxTSxZQUFsQjtBQUNaLFFBQUFsQyxJQUFBO0FBQUFBLFdBQU8sRUFBUDtBQUNBa0MsaUJBQWFDLEtBQWIsQ0FBbUIsR0FBbkIsRUFBd0JDLE9BQXhCLENBQWdDLFVBQUNDLFdBQUQ7QUFDL0IsVUFBQXBGLE1BQUE7QUFBQUEsZUFBUytFLFVBQVVsRyxPQUFWLEVBQW1CakcsTUFBbkIsRUFBMkJ3TSxXQUEzQixDQUFUO0FDR0csYURGSHJDLEtBQUsvQyxPQUFPdEgsSUFBWixJQUFvQnNILE1DRWpCO0FESko7QUFHQSxXQUFPK0MsSUFBUDtBQUxZLEdBQWI7O0FBT0FnQyxjQUFZLFVBQUNsRyxPQUFELEVBQVVqRyxNQUFWLEVBQWtCd00sV0FBbEI7QUFDWCxRQUFBckMsSUFBQSxFQUFBVyxNQUFBLEVBQUEyQixrQkFBQSxFQUFBQyxLQUFBLEVBQUFDLFVBQUEsRUFBQUMsWUFBQSxFQUFBQyxTQUFBO0FBQUExQyxXQUFPeE0sRUFBRXFNLEtBQUYsQ0FBUThDLFFBQVFDLE9BQVIsQ0FBZ0JELFFBQVFFLGFBQVIsQ0FBc0JGLFFBQVFYLFNBQVIsQ0FBa0JLLFdBQWxCLEVBQStCdkcsT0FBL0IsQ0FBdEIsQ0FBaEIsQ0FBUixDQUFQOztBQUNBLFFBQUcsQ0FBQ2tFLElBQUo7QUFDQyxZQUFNLElBQUkxTCxPQUFPWCxLQUFYLENBQWlCLEdBQWpCLEVBQXNCLFdBQVMwTyxXQUEvQixDQUFOO0FDS0U7O0FESEhHLGlCQUFhRyxRQUFRRyxhQUFSLENBQXNCLGdCQUF0QixFQUF3Q3RPLE9BQXhDLENBQWdEO0FBQUNjLGFBQU93RyxPQUFSO0FBQWlCbkcsWUFBTTtBQUF2QixLQUFoRCxFQUFpRjtBQUFDZ0wsY0FBTztBQUFDM0wsYUFBSSxDQUFMO0FBQVErTix1QkFBYztBQUF0QjtBQUFSLEtBQWpGLENBQWI7QUFDQUwsZ0JBQVlDLFFBQVFHLGFBQVIsQ0FBc0IsZ0JBQXRCLEVBQXdDdE8sT0FBeEMsQ0FBZ0Q7QUFBQ2MsYUFBT3dHLE9BQVI7QUFBaUJuRyxZQUFNO0FBQXZCLEtBQWhELEVBQWdGO0FBQUNnTCxjQUFPO0FBQUMzTCxhQUFJLENBQUw7QUFBUStOLHVCQUFjO0FBQXRCO0FBQVIsS0FBaEYsQ0FBWjtBQUNBTixtQkFBZUUsUUFBUUcsYUFBUixDQUFzQixnQkFBdEIsRUFBd0M1TixJQUF4QyxDQUE2QztBQUFDWCxhQUFPc0IsTUFBUjtBQUFnQlAsYUFBT3dHO0FBQXZCLEtBQTdDLEVBQThFO0FBQUM2RSxjQUFPO0FBQUMzTCxhQUFJLENBQUw7QUFBUStOLHVCQUFjO0FBQXRCO0FBQVIsS0FBOUUsRUFBaUg1TixLQUFqSCxFQUFmO0FBQ0FvTixZQUFRO0FBQUVDLDRCQUFGO0FBQWNFLDBCQUFkO0FBQXlCRDtBQUF6QixLQUFSO0FBRUFILHlCQUFxQkssUUFBUUssb0JBQVIsQ0FBNkJDLElBQTdCLENBQWtDVixLQUFsQyxFQUF5Q3pHLE9BQXpDLEVBQWtEakcsTUFBbEQsRUFBMER3TSxXQUExRCxDQUFyQjtBQUVBLFdBQU9yQyxLQUFLa0QsVUFBWjtBQUNBLFdBQU9sRCxLQUFLbUQsY0FBWjs7QUFFQSxRQUFHYixtQkFBbUJjLFNBQXRCO0FBQ0NwRCxXQUFLb0QsU0FBTCxHQUFpQixJQUFqQjtBQUNBcEQsV0FBS3FELFNBQUwsR0FBaUJmLG1CQUFtQmUsU0FBcEM7QUFDQXJELFdBQUtzRCxXQUFMLEdBQW1CaEIsbUJBQW1CZ0IsV0FBdEM7QUFDQXRELFdBQUt1RCxXQUFMLEdBQW1CakIsbUJBQW1CaUIsV0FBdEM7QUFDQXZELFdBQUt3RCxnQkFBTCxHQUF3QmxCLG1CQUFtQmtCLGdCQUEzQztBQUVBN0MsZUFBUyxFQUFUOztBQUNBbk4sUUFBRTRPLE9BQUYsQ0FBVXBDLEtBQUtXLE1BQWYsRUFBdUIsVUFBQzhDLEtBQUQsRUFBUUMsR0FBUjtBQUN0QixZQUFBQyxNQUFBOztBQUFBQSxpQkFBU25RLEVBQUVxTSxLQUFGLENBQVE0RCxLQUFSLENBQVQ7O0FBRUEsWUFBRyxDQUFDRSxPQUFPaE8sSUFBWDtBQUNDZ08saUJBQU9oTyxJQUFQLEdBQWMrTixHQUFkO0FDNkJJOztBRDFCTCxZQUFJbFEsRUFBRWdDLE9BQUYsQ0FBVThNLG1CQUFtQnNCLGlCQUE3QixFQUFnREQsT0FBT2hPLElBQXZELElBQStELENBQUMsQ0FBcEU7QUFDQ2dPLGlCQUFPRSxRQUFQLEdBQWtCLElBQWxCO0FDNEJJOztBRHpCTCxZQUFJclEsRUFBRWdDLE9BQUYsQ0FBVThNLG1CQUFtQndCLGlCQUE3QixFQUFnREgsT0FBT2hPLElBQXZELElBQStELENBQW5FO0FDMkJNLGlCRDFCTGdMLE9BQU8rQyxHQUFQLElBQWNDLE1DMEJUO0FBQ0Q7QUR2Q047O0FBY0EzRCxXQUFLVyxNQUFMLEdBQWNBLE1BQWQ7QUF0QkQ7QUF5QkNYLFdBQUtvRCxTQUFMLEdBQWlCLEtBQWpCO0FDMkJFOztBRHpCSCxXQUFPcEQsSUFBUDtBQTFDVyxHQUFaOztBQ3NFQyxTRDFCRG5ILFdBQVdDLEdBQVgsQ0FBZSxLQUFmLEVBQXNCaUwsYUFBYUMsUUFBYixHQUF3QixjQUE5QyxFQUE4RCxVQUFDNU4sR0FBRCxFQUFNQyxHQUFOLEVBQVc0TixJQUFYO0FBQzdELFFBQUFDLElBQUEsRUFBQWxFLElBQUEsRUFBQWUsQ0FBQSxFQUFBc0IsV0FBQSxFQUFBbE8sR0FBQSxFQUFBa0csSUFBQSxFQUFBeUIsT0FBQSxFQUFBakcsTUFBQTs7QUFBQTtBQUNDQSxlQUFTc08sUUFBUUMsc0JBQVIsQ0FBK0JoTyxHQUEvQixFQUFvQ0MsR0FBcEMsQ0FBVDs7QUFDQSxVQUFHLENBQUNSLE1BQUo7QUFDQyxjQUFNLElBQUl2QixPQUFPWCxLQUFYLENBQWlCLEdBQWpCLEVBQXNCLGVBQXRCLENBQU47QUM0Qkc7O0FEMUJKbUksZ0JBQUEsQ0FBQTNILE1BQUFpQyxJQUFBZ0QsTUFBQSxZQUFBakYsSUFBc0IySCxPQUF0QixHQUFzQixNQUF0Qjs7QUFDQSxVQUFHLENBQUNBLE9BQUo7QUFDQyxjQUFNLElBQUl4SCxPQUFPWCxLQUFYLENBQWlCLEdBQWpCLEVBQXNCLGNBQXRCLENBQU47QUM0Qkc7O0FEMUJKME8sb0JBQUEsQ0FBQWhJLE9BQUFqRSxJQUFBZ0QsTUFBQSxZQUFBaUIsS0FBMEJsSCxFQUExQixHQUEwQixNQUExQjs7QUFDQSxVQUFHLENBQUNrUCxXQUFKO0FBQ0MsY0FBTSxJQUFJL04sT0FBT1gsS0FBWCxDQUFpQixHQUFqQixFQUFzQixTQUF0QixDQUFOO0FDNEJHOztBRDFCSnVRLGFBQU92QixRQUFRRyxhQUFSLENBQXNCLFNBQXRCLEVBQWlDdE8sT0FBakMsQ0FBeUM7QUFBQ1EsYUFBS3FOO0FBQU4sT0FBekMsQ0FBUDs7QUFFQSxVQUFHNkIsUUFBUUEsS0FBS3ZPLElBQWhCO0FBQ0MwTSxzQkFBYzZCLEtBQUt2TyxJQUFuQjtBQzZCRzs7QUQzQkosVUFBRzBNLFlBQVlGLEtBQVosQ0FBa0IsR0FBbEIsRUFBdUJ6TyxNQUF2QixHQUFnQyxDQUFuQztBQUNDc00sZUFBT2lDLFdBQVduRyxPQUFYLEVBQW9CakcsTUFBcEIsRUFBNEJ3TSxXQUE1QixDQUFQO0FBREQ7QUFHQ3JDLGVBQU9nQyxVQUFVbEcsT0FBVixFQUFtQmpHLE1BQW5CLEVBQTJCd00sV0FBM0IsQ0FBUDtBQzZCRzs7QUFDRCxhRDVCSHhKLFdBQVd3TCxVQUFYLENBQXNCaE8sR0FBdEIsRUFBMkI7QUFDMUJpTyxjQUFNLEdBRG9CO0FBRTFCdEUsY0FBTUEsUUFBUTtBQUZZLE9BQTNCLENDNEJHO0FEbkRKLGFBQUFwTCxLQUFBO0FBMkJNbU0sVUFBQW5NLEtBQUE7QUFDTCtCLGNBQVEvQixLQUFSLENBQWNtTSxFQUFFdEssS0FBaEI7QUM4QkcsYUQ3QkhvQyxXQUFXd0wsVUFBWCxDQUFzQmhPLEdBQXRCLEVBQTJCO0FBQzFCaU8sY0FBTXZELEVBQUVuTSxLQUFGLElBQVcsR0FEUztBQUUxQm9MLGNBQU07QUFBQ3VFLGtCQUFReEQsRUFBRUcsTUFBRixJQUFZSCxFQUFFL0c7QUFBdkI7QUFGb0IsT0FBM0IsQ0M2Qkc7QUFNRDtBRGpFSixJQzBCQztBRC9FRixHOzs7Ozs7Ozs7Ozs7QUVBQTFGLE9BQU95TixPQUFQLENBQWU7QUFDZCxNQUFBeUMsc0JBQUEsRUFBQUMsaUJBQUEsRUFBQUMsV0FBQSxFQUFBQyxHQUFBLEVBQUFDLE9BQUE7QUFBQUgsc0JBQW9CL1IsUUFBUSxlQUFSLEVBQXlCK1IsaUJBQTdDO0FBQ0FDLGdCQUFjaFMsUUFBUSxlQUFSLEVBQXlCZ1MsV0FBdkM7QUFDQUUsWUFBVWxTLFFBQVEsU0FBUixDQUFWO0FBQ0FpUyxRQUFNQyxTQUFOO0FBQ0FELE1BQUlFLEdBQUosQ0FBUSxlQUFSLEVBQXlCSixpQkFBekI7QUFDQUQsMkJBQXlCOVIsUUFBUSxlQUFSLEVBQXlCOFIsc0JBQWxEOztBQUNBLE1BQUdBLHNCQUFIO0FBQ0NHLFFBQUlFLEdBQUosQ0FBUSxTQUFSLEVBQW1CTCxzQkFBbkI7QUNFQzs7QURERk0sU0FBT0MsZUFBUCxDQUF1QkYsR0FBdkIsQ0FBMkJGLEdBQTNCO0FDR0MsU0RGRG5SLEVBQUU0QixJQUFGLENBQU91TixRQUFRcUMsYUFBUixDQUFzQkMsY0FBdEIsRUFBUCxFQUErQyxVQUFDQyxVQUFELEVBQWF2UCxJQUFiO0FBQzlDLFFBQUF3UCxRQUFBOztBQUFBLFFBQUd4UCxTQUFRLFNBQVg7QUFDQ3dQLGlCQUFXUCxTQUFYO0FBQ0FPLGVBQVNOLEdBQVQsQ0FBYSxnQkFBY2xQLElBQTNCLEVBQW1DK08sV0FBbkM7QUNJRyxhREhISSxPQUFPQyxlQUFQLENBQXVCRixHQUF2QixDQUEyQk0sUUFBM0IsQ0NHRztBQUNEO0FEUkosSUNFQztBRFpGLEc7Ozs7Ozs7Ozs7OztBRUFBLElBQUFDLEtBQUEsRUFBQUMsa0JBQUEsRUFBQTNILFNBQUE7QUFBQTBILFFBQVExUyxRQUFRLFFBQVIsQ0FBUjtBQUVBZ0wsWUFBWWhMLFFBQVEsWUFBUixDQUFaO0FBRUEyUyxxQkFBcUIsRUFBckI7QUFFQXhNLFdBQVd5TSxVQUFYLENBQXNCVCxHQUF0QixDQUEwQixnQkFBMUIsRUFBNEMsVUFBQ3pPLEdBQUQsRUFBTUMsR0FBTixFQUFXNE4sSUFBWDtBQ0cxQyxTREREbUIsTUFBTTtBQUNMLFFBQUFHLE1BQUEsRUFBQUMsZUFBQSxFQUFBN0osSUFBQSxFQUFBN0gsU0FBQSxFQUFBMlIsU0FBQSxFQUFBeFIsV0FBQSxFQUFBeVIsUUFBQSxFQUFBQyxXQUFBLEVBQUF4UixHQUFBLEVBQUFrRyxJQUFBLEVBQUFDLElBQUEsRUFBQXNMLE1BQUEsRUFBQWhRLEtBQUEsRUFBQTNDLElBQUEsRUFBQTRDLE1BQUE7O0FBQUEsUUFBRyxDQUFDTyxJQUFJUCxNQUFSO0FBQ0M2UCxpQkFBVyxLQUFYOztBQUVBLFVBQUF0UCxPQUFBLFFBQUFqQyxNQUFBaUMsSUFBQWtELEtBQUEsWUFBQW5GLElBQWUwUixZQUFmLEdBQWUsTUFBZixHQUFlLE1BQWY7QUFDQ2xQLGdCQUFRbVAsR0FBUixDQUFZLFVBQVosRUFBd0IxUCxJQUFJa0QsS0FBSixDQUFVdU0sWUFBbEM7QUFDQWhRLGlCQUFTc08sUUFBUTRCLHdCQUFSLENBQWlDM1AsSUFBSWtELEtBQUosQ0FBVXVNLFlBQTNDLENBQVQ7O0FBQ0EsWUFBR2hRLE1BQUg7QUFDQzVDLGlCQUFPcUIsT0FBT0MsS0FBUCxDQUFhQyxPQUFiLENBQXFCO0FBQUNRLGlCQUFLYTtBQUFOLFdBQXJCLENBQVA7O0FBQ0EsY0FBRzVDLElBQUg7QUFDQ3lTLHVCQUFXLElBQVg7QUFIRjtBQUhEO0FDWUk7O0FESkosVUFBR3RQLElBQUkwRCxPQUFKLENBQVksZUFBWixDQUFIO0FBQ0M2QixlQUFPK0IsVUFBVXNJLEtBQVYsQ0FBZ0I1UCxJQUFJMEQsT0FBSixDQUFZLGVBQVosQ0FBaEIsQ0FBUDs7QUFDQSxZQUFHNkIsSUFBSDtBQUNDMUksaUJBQU9xQixPQUFPQyxLQUFQLENBQWFDLE9BQWIsQ0FBcUI7QUFBQ2xCLHNCQUFVcUksS0FBS2hHO0FBQWhCLFdBQXJCLEVBQTRDO0FBQUVnTCxvQkFBUTtBQUFFLDBCQUFZO0FBQWQ7QUFBVixXQUE1QyxDQUFQOztBQUNBLGNBQUcxTixJQUFIO0FBQ0MsZ0JBQUdvUyxtQkFBbUIxSixLQUFLaEcsSUFBeEIsTUFBaUNnRyxLQUFLc0ssSUFBekM7QUFDQ1AseUJBQVcsSUFBWDtBQUREO0FBR0NFLHVCQUFTbFIsU0FBU0MsY0FBVCxDQUF3QjFCLElBQXhCLEVBQThCMEksS0FBS3NLLElBQW5DLENBQVQ7O0FBRUEsa0JBQUcsQ0FBQ0wsT0FBT2hSLEtBQVg7QUFDQzhRLDJCQUFXLElBQVg7O0FBQ0Esb0JBQUdsUyxFQUFFQyxJQUFGLENBQU80UixrQkFBUCxFQUEyQjNSLE1BQTNCLEdBQW9DLEdBQXZDO0FBQ0MyUix1Q0FBcUIsRUFBckI7QUNXUTs7QURWVEEsbUNBQW1CMUosS0FBS2hHLElBQXhCLElBQWdDZ0csS0FBS3NLLElBQXJDO0FBVEY7QUFERDtBQUZEO0FBRkQ7QUM4Qkk7O0FEZkosVUFBR1AsUUFBSDtBQUNDdFAsWUFBSTBELE9BQUosQ0FBWSxXQUFaLElBQTJCN0csS0FBSytCLEdBQWhDO0FBQ0FZLGdCQUFRLElBQVI7QUFDQTJQLGlCQUFTLFNBQVQ7QUFDQUUsb0JBQVksSUFBWjtBQUNBRSxzQkFBQSxDQUFBdEwsT0FBQXBILEtBQUF3QixRQUFBLGFBQUE2RixPQUFBRCxLQUFBNkwsTUFBQSxZQUFBNUwsS0FBcUNxTCxXQUFyQyxHQUFxQyxNQUFyQyxHQUFxQyxNQUFyQzs7QUFDQSxZQUFHQSxXQUFIO0FBQ0NILDRCQUFrQmhTLEVBQUUwQixJQUFGLENBQU95USxXQUFQLEVBQW9CLFVBQUNRLENBQUQ7QUFDckMsbUJBQU9BLEVBQUVaLE1BQUYsS0FBWUEsTUFBWixJQUF1QlksRUFBRVYsU0FBRixLQUFlQSxTQUE3QztBQURpQixZQUFsQjs7QUFHQSxjQUFpQ0QsZUFBakM7QUFBQTVQLG9CQUFRNFAsZ0JBQWdCNVAsS0FBeEI7QUFKRDtBQ3VCSzs7QURqQkwsWUFBRyxDQUFJQSxLQUFQO0FBQ0M5QixzQkFBWVksU0FBU0csMEJBQVQsRUFBWjtBQUNBZSxrQkFBUTlCLFVBQVU4QixLQUFsQjtBQUNBM0Isd0JBQWNTLFNBQVNJLGlCQUFULENBQTJCaEIsU0FBM0IsQ0FBZDtBQUNBRyxzQkFBWXNSLE1BQVosR0FBcUJBLE1BQXJCO0FBQ0F0UixzQkFBWXdSLFNBQVosR0FBd0JBLFNBQXhCO0FBQ0F4UixzQkFBWTJCLEtBQVosR0FBb0JBLEtBQXBCOztBQUNBbEIsbUJBQVNLLHVCQUFULENBQWlDOUIsS0FBSytCLEdBQXRDLEVBQTJDZixXQUEzQztBQ21CSTs7QURqQkwsWUFBRzJCLEtBQUg7QUFDQ1EsY0FBSTBELE9BQUosQ0FBWSxjQUFaLElBQThCbEUsS0FBOUI7QUF0QkY7QUExQkQ7QUNxRUc7O0FBQ0QsV0RyQkZxTyxNQ3FCRTtBRHZFSCxLQW1ERW1DLEdBbkRGLEVDQ0M7QURIRixHOzs7Ozs7Ozs7Ozs7QUVOQTlSLE9BQU95TixPQUFQLENBQWU7QUFDZCxNQUFBc0UsZUFBQSxFQUFBQyxlQUFBLEVBQUFDLGNBQUEsRUFBQUMsc0JBQUEsRUFBQUMsVUFBQSxFQUFBQyxhQUFBLEVBQUFDLHFCQUFBOztBQUFBTCxvQkFBa0I1VCxRQUFRLDJCQUFSLEVBQXFDNFQsZUFBdkQ7QUFDQUQsb0JBQWtCM1QsUUFBUSwyQkFBUixFQUFxQzJULGVBQXZEO0FBQ0FLLGtCQUFnQixDQUFDLFFBQUQsRUFBVyxVQUFYLENBQWhCO0FBRUFILG1CQUFpQixDQUFDLFNBQUQsQ0FBakI7QUFFQUMsMkJBQXlCLENBQUMsVUFBRCxDQUF6QjtBQUVBQyxlQUFhLGlCQUFiOztBQUVBRSwwQkFBd0IsVUFBQzdLLE9BQUQ7QUFDdkIsUUFBQThLLGdCQUFBLEVBQUFDLGVBQUEsRUFBQUMsTUFBQTtBQUFBQSxhQUFTO0FBQUM3SSxlQUFTOEYsYUFBYWdELE9BQXZCO0FBQWdDQyxvQkFBYztBQUFDRixnQkFBUTtBQUFUO0FBQTlDLEtBQVQ7QUFFQUQsc0JBQWtCLEVBQWxCO0FBRUFBLG9CQUFnQkksU0FBaEIsR0FBNEJSLFVBQTVCO0FBRUFJLG9CQUFnQkssVUFBaEIsR0FBNkIsRUFBN0I7QUFFQUwsb0JBQWdCTSxXQUFoQixHQUE4QixFQUE5Qjs7QUFFQTNULE1BQUU0QixJQUFGLENBQU91TixRQUFReUUsV0FBZixFQUE0QixVQUFDN0osS0FBRCxFQUFRbUcsR0FBUixFQUFhMkQsSUFBYjtBQUMzQixVQUFBQyxPQUFBLEVBQUFDLE9BQUEsRUFBQTlULElBQUEsRUFBQStULGtCQUFBLEVBQUFDLFFBQUE7O0FBQUFILGdCQUFVM0UsUUFBUVgsU0FBUixDQUFrQjBCLEdBQWxCLEVBQXVCNUgsT0FBdkIsQ0FBVjs7QUFDQSxVQUFHLEVBQUF3TCxXQUFBLE9BQUlBLFFBQVNJLFVBQWIsR0FBYSxNQUFiLENBQUg7QUFDQztBQ0FHOztBREdKalUsYUFBTyxDQUFDO0FBQUNrVSxxQkFBYTtBQUFDaFMsZ0JBQU0sS0FBUDtBQUFjaVMsdUJBQWE7QUFBM0I7QUFBZCxPQUFELENBQVA7QUFFQUwsZ0JBQVU7QUFDVDVSLGNBQU0yUixRQUFRM1IsSUFETDtBQUVUK04sYUFBSWpRO0FBRkssT0FBVjtBQUtBQSxXQUFLMk8sT0FBTCxDQUFhLFVBQUN5RixJQUFEO0FDSVIsZURISmhCLGdCQUFnQk0sV0FBaEIsQ0FBNEJ6UixJQUE1QixDQUFpQztBQUNoQ29TLGtCQUFRckIsYUFBYSxHQUFiLEdBQW1CYSxRQUFRM1IsSUFBM0IsR0FBa0MsR0FBbEMsR0FBd0NrUyxLQUFLRixXQUFMLENBQWlCaFMsSUFEakM7QUFFaENvUyxzQkFBWSxDQUFDO0FBQ1osb0JBQVEsNEJBREk7QUFFWixvQkFBUTtBQUZJLFdBQUQ7QUFGb0IsU0FBakMsQ0NHSTtBREpMO0FBVUFOLGlCQUFXLEVBQVg7QUFDQUEsZUFBUy9SLElBQVQsQ0FBYztBQUFDQyxjQUFNLEtBQVA7QUFBY3FTLGNBQU0sWUFBcEI7QUFBa0NDLGtCQUFVO0FBQTVDLE9BQWQ7QUFFQVQsMkJBQXFCLEVBQXJCOztBQUVBaFUsUUFBRTRPLE9BQUYsQ0FBVWtGLFFBQVEzRyxNQUFsQixFQUEwQixVQUFDOEMsS0FBRCxFQUFReUUsVUFBUjtBQUV6QixZQUFBQyxTQUFBLEVBQUFDLFlBQUE7O0FBQUFELG9CQUFZO0FBQUN4UyxnQkFBTXVTLFVBQVA7QUFBbUJGLGdCQUFNO0FBQXpCLFNBQVo7O0FBRUEsWUFBR3hVLEVBQUUwRSxRQUFGLENBQVd3TyxhQUFYLEVBQTBCakQsTUFBTXVFLElBQWhDLENBQUg7QUFDQ0csb0JBQVVILElBQVYsR0FBaUIsWUFBakI7QUFERCxlQUVLLElBQUd4VSxFQUFFMEUsUUFBRixDQUFXcU8sY0FBWCxFQUEyQjlDLE1BQU11RSxJQUFqQyxDQUFIO0FBQ0pHLG9CQUFVSCxJQUFWLEdBQWlCLGFBQWpCO0FBREksZUFFQSxJQUFHeFUsRUFBRTBFLFFBQUYsQ0FBV3NPLHNCQUFYLEVBQW1DL0MsTUFBTXVFLElBQXpDLENBQUg7QUFDSkcsb0JBQVVILElBQVYsR0FBaUIsb0JBQWpCO0FBQ0FHLG9CQUFVRSxTQUFWLEdBQXNCLEdBQXRCO0FDU0k7O0FEUEwsWUFBRzVFLE1BQU02RSxRQUFUO0FBQ0NILG9CQUFVRixRQUFWLEdBQXFCLEtBQXJCO0FDU0k7O0FEUExSLGlCQUFTL1IsSUFBVCxDQUFjeVMsU0FBZDtBQUVBQyx1QkFBZTNFLE1BQU0yRSxZQUFyQjs7QUFFQSxZQUFHQSxZQUFIO0FBQ0MsY0FBRyxDQUFDNVUsRUFBRStVLE9BQUYsQ0FBVUgsWUFBVixDQUFKO0FBQ0NBLDJCQUFlLENBQUNBLFlBQUQsQ0FBZjtBQ09LOztBQUNELGlCRE5MQSxhQUFhaEcsT0FBYixDQUFxQixVQUFDb0csQ0FBRDtBQUNwQixnQkFBQS9JLEtBQUEsRUFBQWdKLGFBQUE7O0FBQUFBLDRCQUFnQjlGLFFBQVFYLFNBQVIsQ0FBa0J3RyxDQUFsQixFQUFxQjFNLE9BQXJCLENBQWhCOztBQUNBLGdCQUFHMk0sYUFBSDtBQUNDaEosc0JBQVF5SSxhQUFhbkUsYUFBYTJFLG1CQUFsQzs7QUFDQSxrQkFBR2xWLEVBQUUrVSxPQUFGLENBQVU5RSxNQUFNMkUsWUFBaEIsQ0FBSDtBQUNDM0ksd0JBQVF5SSxhQUFhbkUsYUFBYTJFLG1CQUExQixHQUFnRCxHQUFoRCxHQUFzREQsY0FBYzlTLElBQTVFO0FDUU87O0FBQ0QscUJEUlA2UixtQkFBbUI5UixJQUFuQixDQUF3QjtBQUN2QkMsc0JBQU04SixLQURpQjtBQUd2QnVJLHNCQUFNdkIsYUFBYSxHQUFiLEdBQW1CZ0MsY0FBYzlTLElBSGhCO0FBSXZCZ1QseUJBQVNyQixRQUFRM1IsSUFKTTtBQUt2QmlULDBCQUFVSCxjQUFjOVMsSUFMRDtBQU12QmtULHVDQUF1QixDQUN0QjtBQUNDcEIsNEJBQVVTLFVBRFg7QUFFQ1ksc0NBQW9CO0FBRnJCLGlCQURzQjtBQU5BLGVBQXhCLENDUU87QURaUjtBQ3lCUSxxQkRQUG5TLFFBQVErSCxJQUFSLENBQWEsbUJBQWlCOEosQ0FBakIsR0FBbUIsWUFBaEMsQ0NPTztBQUNEO0FENUJSLFlDTUs7QUF3QkQ7QURyRE47O0FBNkNBakIsY0FBUUUsUUFBUixHQUFtQkEsUUFBbkI7QUFDQUYsY0FBUUMsa0JBQVIsR0FBNkJBLGtCQUE3QjtBQ1dHLGFEVEhYLGdCQUFnQkssVUFBaEIsQ0FBMkJ4UixJQUEzQixDQUFnQzZSLE9BQWhDLENDU0c7QURyRko7O0FBOEVBVCxXQUFPRSxZQUFQLENBQW9CRixNQUFwQixDQUEyQnBSLElBQTNCLENBQWdDbVIsZUFBaEM7QUFHQUQsdUJBQW1CLEVBQW5CO0FBQ0FBLHFCQUFpQm1DLGVBQWpCLEdBQW1DO0FBQUNwVCxZQUFNO0FBQVAsS0FBbkM7QUFDQWlSLHFCQUFpQm1DLGVBQWpCLENBQWlDQyxTQUFqQyxHQUE2QyxFQUE3Qzs7QUFFQXhWLE1BQUU0TyxPQUFGLENBQVV5RSxnQkFBZ0JLLFVBQTFCLEVBQXNDLFVBQUMrQixHQUFELEVBQU1DLENBQU47QUNTbEMsYURSSHRDLGlCQUFpQm1DLGVBQWpCLENBQWlDQyxTQUFqQyxDQUEyQ3RULElBQTNDLENBQWdEO0FBQy9DLGdCQUFRdVQsSUFBSXRULElBRG1DO0FBRS9DLHNCQUFjOFEsYUFBYSxHQUFiLEdBQW1Cd0MsSUFBSXRULElBRlU7QUFHL0MscUNBQTZCO0FBSGtCLE9BQWhELENDUUc7QURUSjs7QUFrQkFtUixXQUFPRSxZQUFQLENBQW9CRixNQUFwQixDQUEyQnBSLElBQTNCLENBQWdDa1IsZ0JBQWhDO0FBRUEsV0FBT0UsTUFBUDtBQXBIdUIsR0FBeEI7O0FBc0hBcUMsa0JBQWdCeEssUUFBaEIsQ0FBeUIsRUFBekIsRUFBNkI7QUFBQ2pFLGtCQUFjcUosYUFBYXFGO0FBQTVCLEdBQTdCLEVBQXdFO0FBQ3ZFakwsU0FBSztBQUNKLFVBQUEzRSxJQUFBLEVBQUE2UCxPQUFBLEVBQUFsVixHQUFBLEVBQUFrRyxJQUFBLEVBQUFpUCxlQUFBO0FBQUFELGdCQUFVdEYsYUFBYXdGLGVBQWIsRUFBQXBWLE1BQUEsS0FBQWdGLFNBQUEsWUFBQWhGLElBQXlDMkgsT0FBekMsR0FBeUMsTUFBekMsQ0FBVjtBQUNBd04sd0JBQW1CakQsZ0JBQWdCbUQsbUJBQWhCLENBQW9DN0Msc0JBQUEsQ0FBQXRNLE9BQUEsS0FBQWxCLFNBQUEsWUFBQWtCLEtBQWtDeUIsT0FBbEMsR0FBa0MsTUFBbEMsQ0FBcEMsRUFBZ0Y7QUFBQ3VOLGlCQUFTQTtBQUFWLE9BQWhGLENBQW5CO0FBQ0E3UCxhQUFPOFAsZ0JBQWdCRyxRQUFoQixFQUFQO0FBQ0EsYUFBTztBQUNOM1AsaUJBQVM7QUFDUiwwQkFBZ0IsaUNBRFI7QUFFUiwyQkFBaUJpSyxhQUFhZ0Q7QUFGdEIsU0FESDtBQUtOdk4sY0FBTThQLGdCQUFnQkcsUUFBaEI7QUFMQSxPQUFQO0FBTHNFO0FBQUEsR0FBeEU7QUNlQyxTRERETixnQkFBZ0J4SyxRQUFoQixDQUF5Qm9GLGFBQWEyRixhQUF0QyxFQUFxRDtBQUFDaFAsa0JBQWNxSixhQUFhcUY7QUFBNUIsR0FBckQsRUFBZ0c7QUFDL0ZqTCxTQUFLO0FBQ0osVUFBQTNFLElBQUEsRUFBQXJGLEdBQUEsRUFBQXdWLGVBQUE7QUFBQUEsd0JBQWtCckQsZ0JBQWdCa0QsbUJBQWhCLENBQW9DN0Msc0JBQUEsQ0FBQXhTLE1BQUEsS0FBQWdGLFNBQUEsWUFBQWhGLElBQWtDMkgsT0FBbEMsR0FBa0MsTUFBbEMsQ0FBcEMsQ0FBbEI7QUFDQXRDLGFBQU9tUSxnQkFBZ0JGLFFBQWhCLEVBQVA7QUFDQSxhQUFPO0FBQ04zUCxpQkFBUztBQUNSLDBCQUFnQixnQ0FEUjtBQUVSLDJCQUFpQmlLLGFBQWFnRDtBQUZ0QixTQURIO0FBS052TixjQUFNQTtBQUxBLE9BQVA7QUFKOEY7QUFBQSxHQUFoRyxDQ0NDO0FEaEpGLEc7Ozs7Ozs7Ozs7OztBRUFBLEtBQUN1SyxZQUFELEdBQWdCLEVBQWhCO0FBQ0FBLGFBQWFnRCxPQUFiLEdBQXVCLEtBQXZCO0FBQ0FoRCxhQUFhcUYsWUFBYixHQUE0QixJQUE1QjtBQUNBckYsYUFBYUMsUUFBYixHQUF3Qix3QkFBeEI7QUFDQUQsYUFBYTJGLGFBQWIsR0FBNkIsV0FBN0I7QUFDQTNGLGFBQWEyRSxtQkFBYixHQUFtQyxTQUFuQzs7QUFDQTNFLGFBQWE2RixXQUFiLEdBQTJCLFVBQUM5TixPQUFEO0FBQzFCLFNBQU94SCxPQUFPdVYsV0FBUCxDQUFtQixrQkFBa0IvTixPQUFyQyxDQUFQO0FBRDBCLENBQTNCOztBQUdBaUksYUFBYStGLFlBQWIsR0FBNEIsVUFBQ2hPLE9BQUQsRUFBU3VHLFdBQVQ7QUFDM0IsU0FBTzBCLGFBQWE2RixXQUFiLENBQXlCOU4sT0FBekIsS0FBb0MsTUFBSXVHLFdBQXhDLENBQVA7QUFEMkIsQ0FBNUI7O0FBR0EsSUFBRy9OLE9BQU95VixRQUFWO0FBQ0NoRyxlQUFhd0YsZUFBYixHQUErQixVQUFDek4sT0FBRDtBQUM5QixXQUFPaUksYUFBYTZGLFdBQWIsQ0FBeUI5TixPQUF6QixLQUFvQyxNQUFJaUksYUFBYTJGLGFBQXJELENBQVA7QUFEOEIsR0FBL0I7O0FBR0EzRixlQUFhaUcsbUJBQWIsR0FBbUMsVUFBQ2xPLE9BQUQsRUFBVXVHLFdBQVY7QUFDbEMsV0FBTzBCLGFBQWF3RixlQUFiLENBQTZCek4sT0FBN0IsS0FBd0MsTUFBSXVHLFdBQTVDLENBQVA7QUFEa0MsR0FBbkM7O0FBRUEwQixlQUFha0csb0JBQWIsR0FBb0MsVUFBQ25PLE9BQUQsRUFBU3VHLFdBQVQ7QUFDbkMsV0FBTzBCLGFBQWE2RixXQUFiLENBQXlCOU4sT0FBekIsS0FBb0MsTUFBSXVHLFdBQXhDLENBQVA7QUFEbUMsR0FBcEM7O0FBSUEsT0FBQzhHLGVBQUQsR0FBbUIsSUFBSTFMLGFBQUosQ0FDbEI7QUFBQTlFLGFBQVNvTCxhQUFhQyxRQUF0QjtBQUNBaEcsb0JBQWdCLElBRGhCO0FBRUF2QixnQkFBWSxJQUZaO0FBR0E0QixnQkFBWSxJQUhaO0FBSUFuQyxvQkFDQztBQUFBLHNCQUFnQjtBQUFoQjtBQUxELEdBRGtCLENBQW5CO0FDaUJBLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3N0ZWVkb3Nfb2RhdGEuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBmaXggd2FybmluZzogeHh4IG5vdCBpbnN0YWxsZWRcbnJlcXVpcmUoXCJiYXNpYy1hdXRoL3BhY2thZ2UuanNvblwiKTtcblxuaW1wb3J0IHsgY2hlY2tOcG1WZXJzaW9ucyB9IGZyb20gJ21ldGVvci90bWVhc2RheTpjaGVjay1ucG0tdmVyc2lvbnMnO1xuY2hlY2tOcG1WZXJzaW9ucyh7XG5cdCdiYXNpYy1hdXRoJzogJ14yLjAuMScsXG5cdCdvZGF0YS12NC1zZXJ2aWNlLW1ldGFkYXRhJzogXCJeMC4xLjZcIixcblx0XCJvZGF0YS12NC1zZXJ2aWNlLWRvY3VtZW50XCI6IFwiXjAuMC4zXCIsXG5cdGNvb2tpZXM6IFwiXjAuNi4xXCIsXG59LCAnc3RlZWRvczpvZGF0YScpO1xuIiwiQEF1dGggb3I9IHt9XG5cbiMjI1xuXHRBIHZhbGlkIHVzZXIgd2lsbCBoYXZlIGV4YWN0bHkgb25lIG9mIHRoZSBmb2xsb3dpbmcgaWRlbnRpZmljYXRpb24gZmllbGRzOiBpZCwgdXNlcm5hbWUsIG9yIGVtYWlsXG4jIyNcbnVzZXJWYWxpZGF0b3IgPSBNYXRjaC5XaGVyZSAodXNlcikgLT5cblx0Y2hlY2sgdXNlcixcblx0XHRpZDogTWF0Y2guT3B0aW9uYWwgU3RyaW5nXG5cdFx0dXNlcm5hbWU6IE1hdGNoLk9wdGlvbmFsIFN0cmluZ1xuXHRcdGVtYWlsOiBNYXRjaC5PcHRpb25hbCBTdHJpbmdcblxuXHRpZiBfLmtleXModXNlcikubGVuZ3RoIGlzIG5vdCAxXG5cdFx0dGhyb3cgbmV3IE1hdGNoLkVycm9yICdVc2VyIG11c3QgaGF2ZSBleGFjdGx5IG9uZSBpZGVudGlmaWVyIGZpZWxkJ1xuXG5cdHJldHVybiB0cnVlXG5cblxuIyMjXG5cdFJldHVybiBhIE1vbmdvREIgcXVlcnkgc2VsZWN0b3IgZm9yIGZpbmRpbmcgdGhlIGdpdmVuIHVzZXJcbiMjI1xuZ2V0VXNlclF1ZXJ5U2VsZWN0b3IgPSAodXNlcikgLT5cblx0aWYgdXNlci5pZFxuXHRcdHJldHVybiB7J19pZCc6IHVzZXIuaWR9XG5cdGVsc2UgaWYgdXNlci51c2VybmFtZVxuXHRcdHJldHVybiB7J3VzZXJuYW1lJzogdXNlci51c2VybmFtZX1cblx0ZWxzZSBpZiB1c2VyLmVtYWlsXG5cdFx0cmV0dXJuIHsnZW1haWxzLmFkZHJlc3MnOiB1c2VyLmVtYWlsfVxuXG5cdCMgV2Ugc2hvdWxkbid0IGJlIGhlcmUgaWYgdGhlIHVzZXIgb2JqZWN0IHdhcyBwcm9wZXJseSB2YWxpZGF0ZWRcblx0dGhyb3cgbmV3IEVycm9yICdDYW5ub3QgY3JlYXRlIHNlbGVjdG9yIGZyb20gaW52YWxpZCB1c2VyJ1xuXG5cbiMjI1xuXHRMb2cgYSB1c2VyIGluIHdpdGggdGhlaXIgcGFzc3dvcmRcbiMjI1xuQEF1dGgubG9naW5XaXRoUGFzc3dvcmQgPSAodXNlciwgcGFzc3dvcmQpIC0+XG5cdGlmIG5vdCB1c2VyIG9yIG5vdCBwYXNzd29yZFxuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IgNDAxLCAnVW5hdXRob3JpemVkJ1xuXG5cdCMgVmFsaWRhdGUgdGhlIGxvZ2luIGlucHV0IHR5cGVzXG5cdGNoZWNrIHVzZXIsIHVzZXJWYWxpZGF0b3Jcblx0Y2hlY2sgcGFzc3dvcmQsIFN0cmluZ1xuXG5cdCMgUmV0cmlldmUgdGhlIHVzZXIgZnJvbSB0aGUgZGF0YWJhc2Vcblx0YXV0aGVudGljYXRpbmdVc2VyU2VsZWN0b3IgPSBnZXRVc2VyUXVlcnlTZWxlY3Rvcih1c2VyKVxuXHRhdXRoZW50aWNhdGluZ1VzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZShhdXRoZW50aWNhdGluZ1VzZXJTZWxlY3RvcilcblxuXHRpZiBub3QgYXV0aGVudGljYXRpbmdVc2VyXG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvciA0MDEsICdVbmF1dGhvcml6ZWQnXG5cdGlmIG5vdCBhdXRoZW50aWNhdGluZ1VzZXIuc2VydmljZXM/LnBhc3N3b3JkXG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvciA0MDEsICdVbmF1dGhvcml6ZWQnXG5cblx0IyBBdXRoZW50aWNhdGUgdGhlIHVzZXIncyBwYXNzd29yZFxuXHRwYXNzd29yZFZlcmlmaWNhdGlvbiA9IEFjY291bnRzLl9jaGVja1Bhc3N3b3JkIGF1dGhlbnRpY2F0aW5nVXNlciwgcGFzc3dvcmRcblx0aWYgcGFzc3dvcmRWZXJpZmljYXRpb24uZXJyb3Jcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yIDQwMSwgJ1VuYXV0aG9yaXplZCdcblxuXHQjIEFkZCBhIG5ldyBhdXRoIHRva2VuIHRvIHRoZSB1c2VyJ3MgYWNjb3VudFxuXHRhdXRoVG9rZW4gPSBBY2NvdW50cy5fZ2VuZXJhdGVTdGFtcGVkTG9naW5Ub2tlbigpXG5cdGhhc2hlZFRva2VuID0gQWNjb3VudHMuX2hhc2hTdGFtcGVkVG9rZW4gYXV0aFRva2VuXG5cdEFjY291bnRzLl9pbnNlcnRIYXNoZWRMb2dpblRva2VuIGF1dGhlbnRpY2F0aW5nVXNlci5faWQsIGhhc2hlZFRva2VuXG5cblx0c3BhY2VfdXNlcnMgPSBkYi5zcGFjZV91c2Vycy5maW5kKHt1c2VyOiBhdXRoZW50aWNhdGluZ1VzZXIuX2lkfSkuZmV0Y2goKVxuXHRzcGFjZXMgPSBbXVxuXHRfLmVhY2ggc3BhY2VfdXNlcnMsIChzdSktPlxuXHRcdHNwYWNlID0gZGIuc3BhY2VzLmZpbmRPbmUoc3Uuc3BhY2UpXG5cdFx0IyBzcGFjZSBtdXN0IGJlIHBhaWQsIGFuZCB1c2VyIG11c3QgYmUgYWRtaW5zXG5cdFx0aWYgc3BhY2U/LmlzX3BhaWQgYW5kIF8uaW5kZXhPZihzcGFjZS5hZG1pbnMsIHN1LnVzZXIpPj0wXG5cdFx0XHRzcGFjZXMucHVzaFxuXHRcdFx0XHRfaWQ6IHNwYWNlLl9pZFxuXHRcdFx0XHRuYW1lOiBzcGFjZS5uYW1lXG5cdHJldHVybiB7YXV0aFRva2VuOiBhdXRoVG9rZW4udG9rZW4sIHVzZXJJZDogYXV0aGVudGljYXRpbmdVc2VyLl9pZCwgYWRtaW5TcGFjZXM6IHNwYWNlc31cbiIsInZhciBnZXRVc2VyUXVlcnlTZWxlY3RvciwgdXNlclZhbGlkYXRvcjtcblxudGhpcy5BdXRoIHx8ICh0aGlzLkF1dGggPSB7fSk7XG5cblxuLypcblx0QSB2YWxpZCB1c2VyIHdpbGwgaGF2ZSBleGFjdGx5IG9uZSBvZiB0aGUgZm9sbG93aW5nIGlkZW50aWZpY2F0aW9uIGZpZWxkczogaWQsIHVzZXJuYW1lLCBvciBlbWFpbFxuICovXG5cbnVzZXJWYWxpZGF0b3IgPSBNYXRjaC5XaGVyZShmdW5jdGlvbih1c2VyKSB7XG4gIGNoZWNrKHVzZXIsIHtcbiAgICBpZDogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgICB1c2VybmFtZTogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgICBlbWFpbDogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKVxuICB9KTtcbiAgaWYgKF8ua2V5cyh1c2VyKS5sZW5ndGggPT09ICExKSB7XG4gICAgdGhyb3cgbmV3IE1hdGNoLkVycm9yKCdVc2VyIG11c3QgaGF2ZSBleGFjdGx5IG9uZSBpZGVudGlmaWVyIGZpZWxkJyk7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59KTtcblxuXG4vKlxuXHRSZXR1cm4gYSBNb25nb0RCIHF1ZXJ5IHNlbGVjdG9yIGZvciBmaW5kaW5nIHRoZSBnaXZlbiB1c2VyXG4gKi9cblxuZ2V0VXNlclF1ZXJ5U2VsZWN0b3IgPSBmdW5jdGlvbih1c2VyKSB7XG4gIGlmICh1c2VyLmlkKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICdfaWQnOiB1c2VyLmlkXG4gICAgfTtcbiAgfSBlbHNlIGlmICh1c2VyLnVzZXJuYW1lKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICd1c2VybmFtZSc6IHVzZXIudXNlcm5hbWVcbiAgICB9O1xuICB9IGVsc2UgaWYgKHVzZXIuZW1haWwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgJ2VtYWlscy5hZGRyZXNzJzogdXNlci5lbWFpbFxuICAgIH07XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIHNlbGVjdG9yIGZyb20gaW52YWxpZCB1c2VyJyk7XG59O1xuXG5cbi8qXG5cdExvZyBhIHVzZXIgaW4gd2l0aCB0aGVpciBwYXNzd29yZFxuICovXG5cbnRoaXMuQXV0aC5sb2dpbldpdGhQYXNzd29yZCA9IGZ1bmN0aW9uKHVzZXIsIHBhc3N3b3JkKSB7XG4gIHZhciBhdXRoVG9rZW4sIGF1dGhlbnRpY2F0aW5nVXNlciwgYXV0aGVudGljYXRpbmdVc2VyU2VsZWN0b3IsIGhhc2hlZFRva2VuLCBwYXNzd29yZFZlcmlmaWNhdGlvbiwgcmVmLCBzcGFjZV91c2Vycywgc3BhY2VzO1xuICBpZiAoIXVzZXIgfHwgIXBhc3N3b3JkKSB7XG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDEsICdVbmF1dGhvcml6ZWQnKTtcbiAgfVxuICBjaGVjayh1c2VyLCB1c2VyVmFsaWRhdG9yKTtcbiAgY2hlY2socGFzc3dvcmQsIFN0cmluZyk7XG4gIGF1dGhlbnRpY2F0aW5nVXNlclNlbGVjdG9yID0gZ2V0VXNlclF1ZXJ5U2VsZWN0b3IodXNlcik7XG4gIGF1dGhlbnRpY2F0aW5nVXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKGF1dGhlbnRpY2F0aW5nVXNlclNlbGVjdG9yKTtcbiAgaWYgKCFhdXRoZW50aWNhdGluZ1VzZXIpIHtcbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMSwgJ1VuYXV0aG9yaXplZCcpO1xuICB9XG4gIGlmICghKChyZWYgPSBhdXRoZW50aWNhdGluZ1VzZXIuc2VydmljZXMpICE9IG51bGwgPyByZWYucGFzc3dvcmQgOiB2b2lkIDApKSB7XG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDEsICdVbmF1dGhvcml6ZWQnKTtcbiAgfVxuICBwYXNzd29yZFZlcmlmaWNhdGlvbiA9IEFjY291bnRzLl9jaGVja1Bhc3N3b3JkKGF1dGhlbnRpY2F0aW5nVXNlciwgcGFzc3dvcmQpO1xuICBpZiAocGFzc3dvcmRWZXJpZmljYXRpb24uZXJyb3IpIHtcbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMSwgJ1VuYXV0aG9yaXplZCcpO1xuICB9XG4gIGF1dGhUb2tlbiA9IEFjY291bnRzLl9nZW5lcmF0ZVN0YW1wZWRMb2dpblRva2VuKCk7XG4gIGhhc2hlZFRva2VuID0gQWNjb3VudHMuX2hhc2hTdGFtcGVkVG9rZW4oYXV0aFRva2VuKTtcbiAgQWNjb3VudHMuX2luc2VydEhhc2hlZExvZ2luVG9rZW4oYXV0aGVudGljYXRpbmdVc2VyLl9pZCwgaGFzaGVkVG9rZW4pO1xuICBzcGFjZV91c2VycyA9IGRiLnNwYWNlX3VzZXJzLmZpbmQoe1xuICAgIHVzZXI6IGF1dGhlbnRpY2F0aW5nVXNlci5faWRcbiAgfSkuZmV0Y2goKTtcbiAgc3BhY2VzID0gW107XG4gIF8uZWFjaChzcGFjZV91c2VycywgZnVuY3Rpb24oc3UpIHtcbiAgICB2YXIgc3BhY2U7XG4gICAgc3BhY2UgPSBkYi5zcGFjZXMuZmluZE9uZShzdS5zcGFjZSk7XG4gICAgaWYgKChzcGFjZSAhPSBudWxsID8gc3BhY2UuaXNfcGFpZCA6IHZvaWQgMCkgJiYgXy5pbmRleE9mKHNwYWNlLmFkbWlucywgc3UudXNlcikgPj0gMCkge1xuICAgICAgcmV0dXJuIHNwYWNlcy5wdXNoKHtcbiAgICAgICAgX2lkOiBzcGFjZS5faWQsXG4gICAgICAgIG5hbWU6IHNwYWNlLm5hbWVcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiB7XG4gICAgYXV0aFRva2VuOiBhdXRoVG9rZW4udG9rZW4sXG4gICAgdXNlcklkOiBhdXRoZW50aWNhdGluZ1VzZXIuX2lkLFxuICAgIGFkbWluU3BhY2VzOiBzcGFjZXNcbiAgfTtcbn07XG4iLCIvLyBXZSBuZWVkIGEgZnVuY3Rpb24gdGhhdCB0cmVhdHMgdGhyb3duIGVycm9ycyBleGFjdGx5IGxpa2UgSXJvbiBSb3V0ZXIgd291bGQuXG4vLyBUaGlzIGZpbGUgaXMgd3JpdHRlbiBpbiBKYXZhU2NyaXB0IHRvIGVuYWJsZSBjb3B5LXBhc3RpbmcgSXJvbiBSb3V0ZXIgY29kZS5cblxuLy8gVGFrZW4gZnJvbTogaHR0cHM6Ly9naXRodWIuY29tL2lyb24tbWV0ZW9yL2lyb24tcm91dGVyL2Jsb2IvOWMzNjk0OTljOThhZjlmZDEyZWY5ZTY4MzM4ZGVlM2IxYjEyNzZhYS9saWIvcm91dGVyX3NlcnZlci5qcyNMM1xudmFyIGVudiA9IHByb2Nlc3MuZW52Lk5PREVfRU5WIHx8ICdkZXZlbG9wbWVudCc7XG5cbi8vIFRha2VuIGZyb206IGh0dHBzOi8vZ2l0aHViLmNvbS9pcm9uLW1ldGVvci9pcm9uLXJvdXRlci9ibG9iLzljMzY5NDk5Yzk4YWY5ZmQxMmVmOWU2ODMzOGRlZTNiMWIxMjc2YWEvbGliL3JvdXRlcl9zZXJ2ZXIuanMjTDQ3XG5pcm9uUm91dGVyU2VuZEVycm9yVG9SZXNwb25zZSA9IGZ1bmN0aW9uKGVyciwgcmVxLCByZXMpIHtcblx0aWYgKHJlcy5zdGF0dXNDb2RlIDwgNDAwKVxuXHRcdHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuXG5cdGlmIChlcnIuc3RhdHVzKVxuXHRcdHJlcy5zdGF0dXNDb2RlID0gZXJyLnN0YXR1cztcblxuXHRpZiAoZW52ID09PSAnZGV2ZWxvcG1lbnQnKVxuXHRcdG1zZyA9IChlcnIuc3RhY2sgfHwgZXJyLnRvU3RyaW5nKCkpICsgJ1xcbic7XG5cdGVsc2Vcblx0Ly9YWFggZ2V0IHRoaXMgZnJvbSBzdGFuZGFyZCBkaWN0IG9mIGVycm9yIG1lc3NhZ2VzP1xuXHRcdG1zZyA9ICdTZXJ2ZXIgZXJyb3IuJztcblxuXHRjb25zb2xlLmVycm9yKGVyci5zdGFjayB8fCBlcnIudG9TdHJpbmcoKSk7XG5cblx0aWYgKHJlcy5oZWFkZXJzU2VudClcblx0XHRyZXR1cm4gcmVxLnNvY2tldC5kZXN0cm95KCk7XG5cblx0cmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ3RleHQvaHRtbCcpO1xuXHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LUxlbmd0aCcsIEJ1ZmZlci5ieXRlTGVuZ3RoKG1zZykpO1xuXHRpZiAocmVxLm1ldGhvZCA9PT0gJ0hFQUQnKVxuXHRcdHJldHVybiByZXMuZW5kKCk7XG5cdHJlcy5lbmQobXNnKTtcblx0cmV0dXJuO1xufVxuIiwiY2xhc3Mgc2hhcmUuUm91dGVcblxuXHRjb25zdHJ1Y3RvcjogKEBhcGksIEBwYXRoLCBAb3B0aW9ucywgQGVuZHBvaW50cykgLT5cblx0XHQjIENoZWNrIGlmIG9wdGlvbnMgd2VyZSBwcm92aWRlZFxuXHRcdGlmIG5vdCBAZW5kcG9pbnRzXG5cdFx0XHRAZW5kcG9pbnRzID0gQG9wdGlvbnNcblx0XHRcdEBvcHRpb25zID0ge31cblxuXG5cdGFkZFRvQXBpOiBkbyAtPlxuXHRcdGF2YWlsYWJsZU1ldGhvZHMgPSBbJ2dldCcsICdwb3N0JywgJ3B1dCcsICdwYXRjaCcsICdkZWxldGUnLCAnb3B0aW9ucyddXG5cblx0XHRyZXR1cm4gLT5cblx0XHRcdHNlbGYgPSB0aGlzXG5cblx0XHRcdCMgVGhyb3cgYW4gZXJyb3IgaWYgYSByb3V0ZSBoYXMgYWxyZWFkeSBiZWVuIGFkZGVkIGF0IHRoaXMgcGF0aFxuXHRcdFx0IyBUT0RPOiBDaGVjayBmb3IgY29sbGlzaW9ucyB3aXRoIHBhdGhzIHRoYXQgZm9sbG93IHNhbWUgcGF0dGVybiB3aXRoIGRpZmZlcmVudCBwYXJhbWV0ZXIgbmFtZXNcblx0XHRcdGlmIF8uY29udGFpbnMgQGFwaS5fY29uZmlnLnBhdGhzLCBAcGF0aFxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJDYW5ub3QgYWRkIGEgcm91dGUgYXQgYW4gZXhpc3RpbmcgcGF0aDogI3tAcGF0aH1cIlxuXG5cdFx0XHQjIE92ZXJyaWRlIHRoZSBkZWZhdWx0IE9QVElPTlMgZW5kcG9pbnQgd2l0aCBvdXIgb3duXG5cdFx0XHRAZW5kcG9pbnRzID0gXy5leHRlbmQgb3B0aW9uczogQGFwaS5fY29uZmlnLmRlZmF1bHRPcHRpb25zRW5kcG9pbnQsIEBlbmRwb2ludHNcblxuXHRcdFx0IyBDb25maWd1cmUgZWFjaCBlbmRwb2ludCBvbiB0aGlzIHJvdXRlXG5cdFx0XHRAX3Jlc29sdmVFbmRwb2ludHMoKVxuXHRcdFx0QF9jb25maWd1cmVFbmRwb2ludHMoKVxuXG5cdFx0XHQjIEFkZCB0byBvdXIgbGlzdCBvZiBleGlzdGluZyBwYXRoc1xuXHRcdFx0QGFwaS5fY29uZmlnLnBhdGhzLnB1c2ggQHBhdGhcblxuXHRcdFx0YWxsb3dlZE1ldGhvZHMgPSBfLmZpbHRlciBhdmFpbGFibGVNZXRob2RzLCAobWV0aG9kKSAtPlxuXHRcdFx0XHRfLmNvbnRhaW5zKF8ua2V5cyhzZWxmLmVuZHBvaW50cyksIG1ldGhvZClcblx0XHRcdHJlamVjdGVkTWV0aG9kcyA9IF8ucmVqZWN0IGF2YWlsYWJsZU1ldGhvZHMsIChtZXRob2QpIC0+XG5cdFx0XHRcdF8uY29udGFpbnMoXy5rZXlzKHNlbGYuZW5kcG9pbnRzKSwgbWV0aG9kKVxuXG5cdFx0XHQjIFNldHVwIGVuZHBvaW50cyBvbiByb3V0ZVxuXHRcdFx0ZnVsbFBhdGggPSBAYXBpLl9jb25maWcuYXBpUGF0aCArIEBwYXRoXG5cdFx0XHRfLmVhY2ggYWxsb3dlZE1ldGhvZHMsIChtZXRob2QpIC0+XG5cdFx0XHRcdGVuZHBvaW50ID0gc2VsZi5lbmRwb2ludHNbbWV0aG9kXVxuXHRcdFx0XHRKc29uUm91dGVzLmFkZCBtZXRob2QsIGZ1bGxQYXRoLCAocmVxLCByZXMpIC0+XG5cdFx0XHRcdFx0IyBBZGQgZnVuY3Rpb24gdG8gZW5kcG9pbnQgY29udGV4dCBmb3IgaW5kaWNhdGluZyBhIHJlc3BvbnNlIGhhcyBiZWVuIGluaXRpYXRlZCBtYW51YWxseVxuXHRcdFx0XHRcdHJlc3BvbnNlSW5pdGlhdGVkID0gZmFsc2Vcblx0XHRcdFx0XHRkb25lRnVuYyA9IC0+XG5cdFx0XHRcdFx0XHRyZXNwb25zZUluaXRpYXRlZCA9IHRydWVcblxuXHRcdFx0XHRcdGVuZHBvaW50Q29udGV4dCA9XG5cdFx0XHRcdFx0XHR1cmxQYXJhbXM6IHJlcS5wYXJhbXNcblx0XHRcdFx0XHRcdHF1ZXJ5UGFyYW1zOiByZXEucXVlcnlcblx0XHRcdFx0XHRcdGJvZHlQYXJhbXM6IHJlcS5ib2R5XG5cdFx0XHRcdFx0XHRyZXF1ZXN0OiByZXFcblx0XHRcdFx0XHRcdHJlc3BvbnNlOiByZXNcblx0XHRcdFx0XHRcdGRvbmU6IGRvbmVGdW5jXG5cdFx0XHRcdFx0IyBBZGQgZW5kcG9pbnQgY29uZmlnIG9wdGlvbnMgdG8gY29udGV4dFxuXHRcdFx0XHRcdF8uZXh0ZW5kIGVuZHBvaW50Q29udGV4dCwgZW5kcG9pbnRcblxuXHRcdFx0XHRcdCMgUnVuIHRoZSByZXF1ZXN0ZWQgZW5kcG9pbnRcblx0XHRcdFx0XHRyZXNwb25zZURhdGEgPSBudWxsXG5cdFx0XHRcdFx0dHJ5XG5cdFx0XHRcdFx0XHRyZXNwb25zZURhdGEgPSBzZWxmLl9jYWxsRW5kcG9pbnQgZW5kcG9pbnRDb250ZXh0LCBlbmRwb2ludFxuXHRcdFx0XHRcdGNhdGNoIGVycm9yXG5cdFx0XHRcdFx0XHQjIERvIGV4YWN0bHkgd2hhdCBJcm9uIFJvdXRlciB3b3VsZCBoYXZlIGRvbmUsIHRvIGF2b2lkIGNoYW5naW5nIHRoZSBBUElcblx0XHRcdFx0XHRcdGlyb25Sb3V0ZXJTZW5kRXJyb3JUb1Jlc3BvbnNlKGVycm9yLCByZXEsIHJlcyk7XG5cdFx0XHRcdFx0XHRyZXR1cm5cblxuXHRcdFx0XHRcdGlmIHJlc3BvbnNlSW5pdGlhdGVkXG5cdFx0XHRcdFx0XHQjIEVuc3VyZSB0aGUgcmVzcG9uc2UgaXMgcHJvcGVybHkgY29tcGxldGVkXG5cdFx0XHRcdFx0XHRyZXMuZW5kKClcblx0XHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdGlmIHJlcy5oZWFkZXJzU2VudFxuXHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IgXCJNdXN0IGNhbGwgdGhpcy5kb25lKCkgYWZ0ZXIgaGFuZGxpbmcgZW5kcG9pbnQgcmVzcG9uc2UgbWFudWFsbHk6ICN7bWV0aG9kfSAje2Z1bGxQYXRofVwiXG5cdFx0XHRcdFx0XHRlbHNlIGlmIHJlc3BvbnNlRGF0YSBpcyBudWxsIG9yIHJlc3BvbnNlRGF0YSBpcyB1bmRlZmluZWRcblx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yIFwiQ2Fubm90IHJldHVybiBudWxsIG9yIHVuZGVmaW5lZCBmcm9tIGFuIGVuZHBvaW50OiAje21ldGhvZH0gI3tmdWxsUGF0aH1cIlxuXG5cdFx0XHRcdFx0IyBHZW5lcmF0ZSBhbmQgcmV0dXJuIHRoZSBodHRwIHJlc3BvbnNlLCBoYW5kbGluZyB0aGUgZGlmZmVyZW50IGVuZHBvaW50IHJlc3BvbnNlIHR5cGVzXG5cdFx0XHRcdFx0aWYgcmVzcG9uc2VEYXRhLmJvZHkgYW5kIChyZXNwb25zZURhdGEuc3RhdHVzQ29kZSBvciByZXNwb25zZURhdGEuaGVhZGVycylcblx0XHRcdFx0XHRcdHNlbGYuX3Jlc3BvbmQgcmVzLCByZXNwb25zZURhdGEuYm9keSwgcmVzcG9uc2VEYXRhLnN0YXR1c0NvZGUsIHJlc3BvbnNlRGF0YS5oZWFkZXJzXG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0c2VsZi5fcmVzcG9uZCByZXMsIHJlc3BvbnNlRGF0YVxuXG5cdFx0XHRfLmVhY2ggcmVqZWN0ZWRNZXRob2RzLCAobWV0aG9kKSAtPlxuXHRcdFx0XHRKc29uUm91dGVzLmFkZCBtZXRob2QsIGZ1bGxQYXRoLCAocmVxLCByZXMpIC0+XG5cdFx0XHRcdFx0cmVzcG9uc2VEYXRhID0gc3RhdHVzOiAnZXJyb3InLCBtZXNzYWdlOiAnQVBJIGVuZHBvaW50IGRvZXMgbm90IGV4aXN0J1xuXHRcdFx0XHRcdGhlYWRlcnMgPSAnQWxsb3cnOiBhbGxvd2VkTWV0aG9kcy5qb2luKCcsICcpLnRvVXBwZXJDYXNlKClcblx0XHRcdFx0XHRzZWxmLl9yZXNwb25kIHJlcywgcmVzcG9uc2VEYXRhLCA0MDUsIGhlYWRlcnNcblxuXG5cdCMjI1xuXHRcdENvbnZlcnQgYWxsIGVuZHBvaW50cyBvbiB0aGUgZ2l2ZW4gcm91dGUgaW50byBvdXIgZXhwZWN0ZWQgZW5kcG9pbnQgb2JqZWN0IGlmIGl0IGlzIGEgYmFyZVxuXHRcdGZ1bmN0aW9uXG5cblx0XHRAcGFyYW0ge1JvdXRlfSByb3V0ZSBUaGUgcm91dGUgdGhlIGVuZHBvaW50cyBiZWxvbmcgdG9cblx0IyMjXG5cdF9yZXNvbHZlRW5kcG9pbnRzOiAtPlxuXHRcdF8uZWFjaCBAZW5kcG9pbnRzLCAoZW5kcG9pbnQsIG1ldGhvZCwgZW5kcG9pbnRzKSAtPlxuXHRcdFx0aWYgXy5pc0Z1bmN0aW9uKGVuZHBvaW50KVxuXHRcdFx0XHRlbmRwb2ludHNbbWV0aG9kXSA9IHthY3Rpb246IGVuZHBvaW50fVxuXHRcdHJldHVyblxuXG5cblx0IyMjXG5cdFx0Q29uZmlndXJlIHRoZSBhdXRoZW50aWNhdGlvbiBhbmQgcm9sZSByZXF1aXJlbWVudCBvbiBhbGwgZW5kcG9pbnRzIChleGNlcHQgT1BUSU9OUywgd2hpY2ggbXVzdFxuXHRcdGJlIGNvbmZpZ3VyZWQgZGlyZWN0bHkgb24gdGhlIGVuZHBvaW50KVxuXG5cdFx0QXV0aGVudGljYXRpb24gY2FuIGJlIHJlcXVpcmVkIG9uIGFuIGVudGlyZSByb3V0ZSBvciBpbmRpdmlkdWFsIGVuZHBvaW50cy4gSWYgcmVxdWlyZWQgb24gYW5cblx0XHRlbnRpcmUgcm91dGUsIHRoYXQgc2VydmVzIGFzIHRoZSBkZWZhdWx0LiBJZiByZXF1aXJlZCBpbiBhbnkgaW5kaXZpZHVhbCBlbmRwb2ludHMsIHRoYXQgd2lsbFxuXHRcdG92ZXJyaWRlIHRoZSBkZWZhdWx0LlxuXG5cdFx0QWZ0ZXIgdGhlIGVuZHBvaW50IGlzIGNvbmZpZ3VyZWQsIGFsbCBhdXRoZW50aWNhdGlvbiBhbmQgcm9sZSByZXF1aXJlbWVudHMgb2YgYW4gZW5kcG9pbnQgY2FuIGJlXG5cdFx0YWNjZXNzZWQgYXQgPGNvZGU+ZW5kcG9pbnQuYXV0aFJlcXVpcmVkPC9jb2RlPiBhbmQgPGNvZGU+ZW5kcG9pbnQucm9sZVJlcXVpcmVkPC9jb2RlPixcblx0XHRyZXNwZWN0aXZlbHkuXG5cblx0XHRAcGFyYW0ge1JvdXRlfSByb3V0ZSBUaGUgcm91dGUgdGhlIGVuZHBvaW50cyBiZWxvbmcgdG9cblx0XHRAcGFyYW0ge0VuZHBvaW50fSBlbmRwb2ludCBUaGUgZW5kcG9pbnQgdG8gY29uZmlndXJlXG5cdCMjI1xuXHRfY29uZmlndXJlRW5kcG9pbnRzOiAtPlxuXHRcdF8uZWFjaCBAZW5kcG9pbnRzLCAoZW5kcG9pbnQsIG1ldGhvZCkgLT5cblx0XHRcdGlmIG1ldGhvZCBpc250ICdvcHRpb25zJ1xuXHRcdFx0XHQjIENvbmZpZ3VyZSBhY2NlcHRhYmxlIHJvbGVzXG5cdFx0XHRcdGlmIG5vdCBAb3B0aW9ucz8ucm9sZVJlcXVpcmVkXG5cdFx0XHRcdFx0QG9wdGlvbnMucm9sZVJlcXVpcmVkID0gW11cblx0XHRcdFx0aWYgbm90IGVuZHBvaW50LnJvbGVSZXF1aXJlZFxuXHRcdFx0XHRcdGVuZHBvaW50LnJvbGVSZXF1aXJlZCA9IFtdXG5cdFx0XHRcdGVuZHBvaW50LnJvbGVSZXF1aXJlZCA9IF8udW5pb24gZW5kcG9pbnQucm9sZVJlcXVpcmVkLCBAb3B0aW9ucy5yb2xlUmVxdWlyZWRcblx0XHRcdFx0IyBNYWtlIGl0IGVhc2llciB0byBjaGVjayBpZiBubyByb2xlcyBhcmUgcmVxdWlyZWRcblx0XHRcdFx0aWYgXy5pc0VtcHR5IGVuZHBvaW50LnJvbGVSZXF1aXJlZFxuXHRcdFx0XHRcdGVuZHBvaW50LnJvbGVSZXF1aXJlZCA9IGZhbHNlXG5cblx0XHRcdFx0IyBDb25maWd1cmUgYXV0aCByZXF1aXJlbWVudFxuXHRcdFx0XHRpZiBlbmRwb2ludC5hdXRoUmVxdWlyZWQgaXMgdW5kZWZpbmVkXG5cdFx0XHRcdFx0aWYgQG9wdGlvbnM/LmF1dGhSZXF1aXJlZCBvciBlbmRwb2ludC5yb2xlUmVxdWlyZWRcblx0XHRcdFx0XHRcdGVuZHBvaW50LmF1dGhSZXF1aXJlZCA9IHRydWVcblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRlbmRwb2ludC5hdXRoUmVxdWlyZWQgPSBmYWxzZVxuXG5cdFx0XHRcdGlmIEBvcHRpb25zPy5zcGFjZVJlcXVpcmVkXG5cdFx0XHRcdFx0ZW5kcG9pbnQuc3BhY2VSZXF1aXJlZCA9IEBvcHRpb25zLnNwYWNlUmVxdWlyZWRcblx0XHRcdFx0cmV0dXJuXG5cdFx0LCB0aGlzXG5cdFx0cmV0dXJuXG5cblxuXHQjIyNcblx0XHRBdXRoZW50aWNhdGUgYW4gZW5kcG9pbnQgaWYgcmVxdWlyZWQsIGFuZCByZXR1cm4gdGhlIHJlc3VsdCBvZiBjYWxsaW5nIGl0XG5cblx0XHRAcmV0dXJucyBUaGUgZW5kcG9pbnQgcmVzcG9uc2Ugb3IgYSA0MDEgaWYgYXV0aGVudGljYXRpb24gZmFpbHNcblx0IyMjXG5cdF9jYWxsRW5kcG9pbnQ6IChlbmRwb2ludENvbnRleHQsIGVuZHBvaW50KSAtPlxuXHRcdCMgQ2FsbCB0aGUgZW5kcG9pbnQgaWYgYXV0aGVudGljYXRpb24gZG9lc24ndCBmYWlsXG5cdFx0aWYgQF9hdXRoQWNjZXB0ZWQgZW5kcG9pbnRDb250ZXh0LCBlbmRwb2ludFxuXHRcdFx0aWYgQF9yb2xlQWNjZXB0ZWQgZW5kcG9pbnRDb250ZXh0LCBlbmRwb2ludFxuXHRcdFx0XHRpZiBAX3NwYWNlQWNjZXB0ZWQgZW5kcG9pbnRDb250ZXh0LCBlbmRwb2ludFxuXHRcdFx0XHRcdCNlbmRwb2ludC5hY3Rpb24uY2FsbCBlbmRwb2ludENvbnRleHRcblx0XHRcdFx0XHRpbnZvY2F0aW9uID0gbmV3IEREUENvbW1vbi5NZXRob2RJbnZvY2F0aW9uXG5cdFx0XHRcdFx0XHRpc1NpbXVsYXRpb246IHRydWUsXG5cdFx0XHRcdFx0XHR1c2VySWQ6IGVuZHBvaW50Q29udGV4dC51c2VySWQsXG5cdFx0XHRcdFx0XHRjb25uZWN0aW9uOiBudWxsLFxuXHRcdFx0XHRcdFx0cmFuZG9tU2VlZDogRERQQ29tbW9uLm1ha2VScGNTZWVkKClcblxuXHRcdFx0XHRcdHJldHVybiBERFAuX0N1cnJlbnRJbnZvY2F0aW9uLndpdGhWYWx1ZSBpbnZvY2F0aW9uLCAtPlxuXHRcdFx0XHRcdFx0cmV0dXJuIGVuZHBvaW50LmFjdGlvbi5jYWxsKGVuZHBvaW50Q29udGV4dCk7XG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDNcblx0XHRcdFx0XHRib2R5OiB7c3RhdHVzOiAnZXJyb3InLCBtZXNzYWdlOiAnQmFkIFgtU3BhY2UtSWQsIE9ubHkgYWRtaW5zIG9mIHBhaWQgc3BhY2UgY2FuIGNhbGwgdGhpcyBhcGkuJ31cblx0XHRcdGVsc2Vcblx0XHRcdFx0c3RhdHVzQ29kZTogNDAzXG5cdFx0XHRcdGJvZHk6IHtzdGF0dXM6ICdlcnJvcicsIG1lc3NhZ2U6ICdZb3UgZG8gbm90IGhhdmUgcGVybWlzc2lvbiB0byBkbyB0aGlzLid9XG5cdFx0ZWxzZVxuXHRcdFx0c3RhdHVzQ29kZTogNDAxXG5cdFx0XHRib2R5OiB7c3RhdHVzOiAnZXJyb3InLCBtZXNzYWdlOiAnWW91IG11c3QgYmUgbG9nZ2VkIGluIHRvIGRvIHRoaXMuJ31cblxuXG5cdCMjI1xuXHRcdEF1dGhlbnRpY2F0ZSB0aGUgZ2l2ZW4gZW5kcG9pbnQgaWYgcmVxdWlyZWRcblxuXHRcdE9uY2UgaXQncyBnbG9iYWxseSBjb25maWd1cmVkIGluIHRoZSBBUEksIGF1dGhlbnRpY2F0aW9uIGNhbiBiZSByZXF1aXJlZCBvbiBhbiBlbnRpcmUgcm91dGUgb3Jcblx0XHRpbmRpdmlkdWFsIGVuZHBvaW50cy4gSWYgcmVxdWlyZWQgb24gYW4gZW50aXJlIGVuZHBvaW50LCB0aGF0IHNlcnZlcyBhcyB0aGUgZGVmYXVsdC4gSWYgcmVxdWlyZWRcblx0XHRpbiBhbnkgaW5kaXZpZHVhbCBlbmRwb2ludHMsIHRoYXQgd2lsbCBvdmVycmlkZSB0aGUgZGVmYXVsdC5cblxuXHRcdEByZXR1cm5zIEZhbHNlIGlmIGF1dGhlbnRpY2F0aW9uIGZhaWxzLCBhbmQgdHJ1ZSBvdGhlcndpc2Vcblx0IyMjXG5cdF9hdXRoQWNjZXB0ZWQ6IChlbmRwb2ludENvbnRleHQsIGVuZHBvaW50KSAtPlxuXHRcdGlmIGVuZHBvaW50LmF1dGhSZXF1aXJlZFxuXHRcdFx0QF9hdXRoZW50aWNhdGUgZW5kcG9pbnRDb250ZXh0XG5cdFx0ZWxzZSB0cnVlXG5cblxuXHQjIyNcblx0XHRWZXJpZnkgdGhlIHJlcXVlc3QgaXMgYmVpbmcgbWFkZSBieSBhbiBhY3RpdmVseSBsb2dnZWQgaW4gdXNlclxuXG5cdFx0SWYgdmVyaWZpZWQsIGF0dGFjaCB0aGUgYXV0aGVudGljYXRlZCB1c2VyIHRvIHRoZSBjb250ZXh0LlxuXG5cdFx0QHJldHVybnMge0Jvb2xlYW59IFRydWUgaWYgdGhlIGF1dGhlbnRpY2F0aW9uIHdhcyBzdWNjZXNzZnVsXG5cdCMjI1xuXHRfYXV0aGVudGljYXRlOiAoZW5kcG9pbnRDb250ZXh0KSAtPlxuXHRcdCMgR2V0IGF1dGggaW5mb1xuXHRcdGF1dGggPSBAYXBpLl9jb25maWcuYXV0aC51c2VyLmNhbGwoZW5kcG9pbnRDb250ZXh0KVxuXG5cdFx0IyBHZXQgdGhlIHVzZXIgZnJvbSB0aGUgZGF0YWJhc2Vcblx0XHRpZiBhdXRoPy51c2VySWQgYW5kIGF1dGg/LnRva2VuIGFuZCBub3QgYXV0aD8udXNlclxuXHRcdFx0dXNlclNlbGVjdG9yID0ge31cblx0XHRcdHVzZXJTZWxlY3Rvci5faWQgPSBhdXRoLnVzZXJJZFxuXHRcdFx0dXNlclNlbGVjdG9yW0BhcGkuX2NvbmZpZy5hdXRoLnRva2VuXSA9IGF1dGgudG9rZW5cblx0XHRcdGF1dGgudXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lIHVzZXJTZWxlY3RvclxuXG5cdFx0IyBBdHRhY2ggdGhlIHVzZXIgYW5kIHRoZWlyIElEIHRvIHRoZSBjb250ZXh0IGlmIHRoZSBhdXRoZW50aWNhdGlvbiB3YXMgc3VjY2Vzc2Z1bFxuXHRcdGlmIGF1dGg/LnVzZXJcblx0XHRcdGVuZHBvaW50Q29udGV4dC51c2VyID0gYXV0aC51c2VyXG5cdFx0XHRlbmRwb2ludENvbnRleHQudXNlcklkID0gYXV0aC51c2VyLl9pZFxuXHRcdFx0dHJ1ZVxuXHRcdGVsc2UgZmFsc2VcblxuXHQjIyNcblx0XHRBdXRoZW50aWNhdGUgdGhlIHVzZXIgcm9sZSBpZiByZXF1aXJlZFxuXG5cdFx0TXVzdCBiZSBjYWxsZWQgYWZ0ZXIgX2F1dGhBY2NlcHRlZCgpLlxuXG5cdFx0QHJldHVybnMgVHJ1ZSBpZiB0aGUgYXV0aGVudGljYXRlZCB1c2VyIGJlbG9uZ3MgdG8gPGk+YW55PC9pPiBvZiB0aGUgYWNjZXB0YWJsZSByb2xlcyBvbiB0aGVcblx0XHRcdFx0XHRcdCBlbmRwb2ludFxuXHQjIyNcblx0X3NwYWNlQWNjZXB0ZWQ6IChlbmRwb2ludENvbnRleHQsIGVuZHBvaW50KSAtPlxuXHRcdGlmIGVuZHBvaW50LnNwYWNlUmVxdWlyZWRcblx0XHRcdGF1dGggPSBAYXBpLl9jb25maWcuYXV0aC51c2VyLmNhbGwoZW5kcG9pbnRDb250ZXh0KVxuXHRcdFx0aWYgYXV0aD8uc3BhY2VJZFxuXHRcdFx0XHRzcGFjZV91c2Vyc19jb3VudCA9IGRiLnNwYWNlX3VzZXJzLmZpbmQoe3VzZXI6IGF1dGgudXNlcklkLCBzcGFjZTphdXRoLnNwYWNlSWR9KS5jb3VudCgpXG5cdFx0XHRcdGlmIHNwYWNlX3VzZXJzX2NvdW50XG5cdFx0XHRcdFx0c3BhY2UgPSBkYi5zcGFjZXMuZmluZE9uZShhdXRoLnNwYWNlSWQpXG5cdFx0XHRcdFx0IyBzcGFjZSBtdXN0IGJlIHBhaWQsIGFuZCB1c2VyIG11c3QgYmUgYWRtaW5zXG5cdFx0XHRcdFx0aWYgc3BhY2U/LmlzX3BhaWQgYW5kIF8uaW5kZXhPZihzcGFjZS5hZG1pbnMsIGF1dGgudXNlcklkKT49MFxuXHRcdFx0XHRcdFx0ZW5kcG9pbnRDb250ZXh0LnNwYWNlSWQgPSBhdXRoLnNwYWNlSWRcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlXG5cdFx0XHRlbmRwb2ludENvbnRleHQuc3BhY2VJZCA9IFwiYmFkXCJcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdHJldHVybiB0cnVlXG5cblx0IyMjXG5cdFx0QXV0aGVudGljYXRlIHRoZSB1c2VyIHJvbGUgaWYgcmVxdWlyZWRcblxuXHRcdE11c3QgYmUgY2FsbGVkIGFmdGVyIF9hdXRoQWNjZXB0ZWQoKS5cblxuXHRcdEByZXR1cm5zIFRydWUgaWYgdGhlIGF1dGhlbnRpY2F0ZWQgdXNlciBiZWxvbmdzIHRvIDxpPmFueTwvaT4gb2YgdGhlIGFjY2VwdGFibGUgcm9sZXMgb24gdGhlXG5cdFx0XHRcdFx0XHQgZW5kcG9pbnRcblx0IyMjXG5cdF9yb2xlQWNjZXB0ZWQ6IChlbmRwb2ludENvbnRleHQsIGVuZHBvaW50KSAtPlxuXHRcdGlmIGVuZHBvaW50LnJvbGVSZXF1aXJlZFxuXHRcdFx0aWYgXy5pc0VtcHR5IF8uaW50ZXJzZWN0aW9uKGVuZHBvaW50LnJvbGVSZXF1aXJlZCwgZW5kcG9pbnRDb250ZXh0LnVzZXIucm9sZXMpXG5cdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdHRydWVcblxuXG5cdCMjI1xuXHRcdFJlc3BvbmQgdG8gYW4gSFRUUCByZXF1ZXN0XG5cdCMjI1xuXHRfcmVzcG9uZDogKHJlc3BvbnNlLCBib2R5LCBzdGF0dXNDb2RlPTIwMCwgaGVhZGVycz17fSkgLT5cblx0XHQjIE92ZXJyaWRlIGFueSBkZWZhdWx0IGhlYWRlcnMgdGhhdCBoYXZlIGJlZW4gcHJvdmlkZWQgKGtleXMgYXJlIG5vcm1hbGl6ZWQgdG8gYmUgY2FzZSBpbnNlbnNpdGl2ZSlcblx0XHQjIFRPRE86IENvbnNpZGVyIG9ubHkgbG93ZXJjYXNpbmcgdGhlIGhlYWRlciBrZXlzIHdlIG5lZWQgbm9ybWFsaXplZCwgbGlrZSBDb250ZW50LVR5cGVcblx0XHRkZWZhdWx0SGVhZGVycyA9IEBfbG93ZXJDYXNlS2V5cyBAYXBpLl9jb25maWcuZGVmYXVsdEhlYWRlcnNcblx0XHRoZWFkZXJzID0gQF9sb3dlckNhc2VLZXlzIGhlYWRlcnNcblx0XHRoZWFkZXJzID0gXy5leHRlbmQgZGVmYXVsdEhlYWRlcnMsIGhlYWRlcnNcblxuXHRcdCMgUHJlcGFyZSBKU09OIGJvZHkgZm9yIHJlc3BvbnNlIHdoZW4gQ29udGVudC1UeXBlIGluZGljYXRlcyBKU09OIHR5cGVcblx0XHRpZiBoZWFkZXJzWydjb250ZW50LXR5cGUnXS5tYXRjaCgvanNvbnxqYXZhc2NyaXB0LykgaXNudCBudWxsXG5cdFx0XHRpZiBAYXBpLl9jb25maWcucHJldHR5SnNvblxuXHRcdFx0XHRib2R5ID0gSlNPTi5zdHJpbmdpZnkgYm9keSwgdW5kZWZpbmVkLCAyXG5cdFx0XHRlbHNlXG5cdFx0XHRcdGJvZHkgPSBKU09OLnN0cmluZ2lmeSBib2R5XG5cblx0XHQjIFNlbmQgcmVzcG9uc2Vcblx0XHRzZW5kUmVzcG9uc2UgPSAtPlxuXHRcdFx0cmVzcG9uc2Uud3JpdGVIZWFkIHN0YXR1c0NvZGUsIGhlYWRlcnNcblx0XHRcdHJlc3BvbnNlLndyaXRlIGJvZHlcblx0XHRcdHJlc3BvbnNlLmVuZCgpXG5cdFx0aWYgc3RhdHVzQ29kZSBpbiBbNDAxLCA0MDNdXG5cdFx0XHQjIEhhY2tlcnMgY2FuIG1lYXN1cmUgdGhlIHJlc3BvbnNlIHRpbWUgdG8gZGV0ZXJtaW5lIHRoaW5ncyBsaWtlIHdoZXRoZXIgdGhlIDQwMSByZXNwb25zZSB3YXNcblx0XHRcdCMgY2F1c2VkIGJ5IGJhZCB1c2VyIGlkIHZzIGJhZCBwYXNzd29yZC5cblx0XHRcdCMgSW4gZG9pbmcgc28sIHRoZXkgY2FuIGZpcnN0IHNjYW4gZm9yIHZhbGlkIHVzZXIgaWRzIHJlZ2FyZGxlc3Mgb2YgdmFsaWQgcGFzc3dvcmRzLlxuXHRcdFx0IyBEZWxheSBieSBhIHJhbmRvbSBhbW91bnQgdG8gcmVkdWNlIHRoZSBhYmlsaXR5IGZvciBhIGhhY2tlciB0byBkZXRlcm1pbmUgdGhlIHJlc3BvbnNlIHRpbWUuXG5cdFx0XHQjIFNlZSBodHRwczovL3d3dy5vd2FzcC5vcmcvaW5kZXgucGhwL0Jsb2NraW5nX0JydXRlX0ZvcmNlX0F0dGFja3MjRmluZGluZ19PdGhlcl9Db3VudGVybWVhc3VyZXNcblx0XHRcdCMgU2VlIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1RpbWluZ19hdHRhY2tcblx0XHRcdG1pbmltdW1EZWxheUluTWlsbGlzZWNvbmRzID0gNTAwXG5cdFx0XHRyYW5kb21NdWx0aXBsaWVyQmV0d2Vlbk9uZUFuZFR3byA9IDEgKyBNYXRoLnJhbmRvbSgpXG5cdFx0XHRkZWxheUluTWlsbGlzZWNvbmRzID0gbWluaW11bURlbGF5SW5NaWxsaXNlY29uZHMgKiByYW5kb21NdWx0aXBsaWVyQmV0d2Vlbk9uZUFuZFR3b1xuXHRcdFx0TWV0ZW9yLnNldFRpbWVvdXQgc2VuZFJlc3BvbnNlLCBkZWxheUluTWlsbGlzZWNvbmRzXG5cdFx0ZWxzZVxuXHRcdFx0c2VuZFJlc3BvbnNlKClcblxuXHQjIyNcblx0XHRSZXR1cm4gdGhlIG9iamVjdCB3aXRoIGFsbCBvZiB0aGUga2V5cyBjb252ZXJ0ZWQgdG8gbG93ZXJjYXNlXG5cdCMjI1xuXHRfbG93ZXJDYXNlS2V5czogKG9iamVjdCkgLT5cblx0XHRfLmNoYWluIG9iamVjdFxuXHRcdC5wYWlycygpXG5cdFx0Lm1hcCAoYXR0cikgLT5cblx0XHRcdFthdHRyWzBdLnRvTG93ZXJDYXNlKCksIGF0dHJbMV1dXG5cdFx0Lm9iamVjdCgpXG5cdFx0LnZhbHVlKClcbiIsInNoYXJlLlJvdXRlID0gKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBSb3V0ZShhcGksIHBhdGgsIG9wdGlvbnMsIGVuZHBvaW50czEpIHtcbiAgICB0aGlzLmFwaSA9IGFwaTtcbiAgICB0aGlzLnBhdGggPSBwYXRoO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5lbmRwb2ludHMgPSBlbmRwb2ludHMxO1xuICAgIGlmICghdGhpcy5lbmRwb2ludHMpIHtcbiAgICAgIHRoaXMuZW5kcG9pbnRzID0gdGhpcy5vcHRpb25zO1xuICAgICAgdGhpcy5vcHRpb25zID0ge307XG4gICAgfVxuICB9XG5cbiAgUm91dGUucHJvdG90eXBlLmFkZFRvQXBpID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBhdmFpbGFibGVNZXRob2RzO1xuICAgIGF2YWlsYWJsZU1ldGhvZHMgPSBbJ2dldCcsICdwb3N0JywgJ3B1dCcsICdwYXRjaCcsICdkZWxldGUnLCAnb3B0aW9ucyddO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhbGxvd2VkTWV0aG9kcywgZnVsbFBhdGgsIHJlamVjdGVkTWV0aG9kcywgc2VsZjtcbiAgICAgIHNlbGYgPSB0aGlzO1xuICAgICAgaWYgKF8uY29udGFpbnModGhpcy5hcGkuX2NvbmZpZy5wYXRocywgdGhpcy5wYXRoKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgYWRkIGEgcm91dGUgYXQgYW4gZXhpc3RpbmcgcGF0aDogXCIgKyB0aGlzLnBhdGgpO1xuICAgICAgfVxuICAgICAgdGhpcy5lbmRwb2ludHMgPSBfLmV4dGVuZCh7XG4gICAgICAgIG9wdGlvbnM6IHRoaXMuYXBpLl9jb25maWcuZGVmYXVsdE9wdGlvbnNFbmRwb2ludFxuICAgICAgfSwgdGhpcy5lbmRwb2ludHMpO1xuICAgICAgdGhpcy5fcmVzb2x2ZUVuZHBvaW50cygpO1xuICAgICAgdGhpcy5fY29uZmlndXJlRW5kcG9pbnRzKCk7XG4gICAgICB0aGlzLmFwaS5fY29uZmlnLnBhdGhzLnB1c2godGhpcy5wYXRoKTtcbiAgICAgIGFsbG93ZWRNZXRob2RzID0gXy5maWx0ZXIoYXZhaWxhYmxlTWV0aG9kcywgZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgICAgIHJldHVybiBfLmNvbnRhaW5zKF8ua2V5cyhzZWxmLmVuZHBvaW50cyksIG1ldGhvZCk7XG4gICAgICB9KTtcbiAgICAgIHJlamVjdGVkTWV0aG9kcyA9IF8ucmVqZWN0KGF2YWlsYWJsZU1ldGhvZHMsIGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgICAgICByZXR1cm4gXy5jb250YWlucyhfLmtleXMoc2VsZi5lbmRwb2ludHMpLCBtZXRob2QpO1xuICAgICAgfSk7XG4gICAgICBmdWxsUGF0aCA9IHRoaXMuYXBpLl9jb25maWcuYXBpUGF0aCArIHRoaXMucGF0aDtcbiAgICAgIF8uZWFjaChhbGxvd2VkTWV0aG9kcywgZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgICAgIHZhciBlbmRwb2ludDtcbiAgICAgICAgZW5kcG9pbnQgPSBzZWxmLmVuZHBvaW50c1ttZXRob2RdO1xuICAgICAgICByZXR1cm4gSnNvblJvdXRlcy5hZGQobWV0aG9kLCBmdWxsUGF0aCwgZnVuY3Rpb24ocmVxLCByZXMpIHtcbiAgICAgICAgICB2YXIgZG9uZUZ1bmMsIGVuZHBvaW50Q29udGV4dCwgZXJyb3IsIHJlc3BvbnNlRGF0YSwgcmVzcG9uc2VJbml0aWF0ZWQ7XG4gICAgICAgICAgcmVzcG9uc2VJbml0aWF0ZWQgPSBmYWxzZTtcbiAgICAgICAgICBkb25lRnVuYyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlSW5pdGlhdGVkID0gdHJ1ZTtcbiAgICAgICAgICB9O1xuICAgICAgICAgIGVuZHBvaW50Q29udGV4dCA9IHtcbiAgICAgICAgICAgIHVybFBhcmFtczogcmVxLnBhcmFtcyxcbiAgICAgICAgICAgIHF1ZXJ5UGFyYW1zOiByZXEucXVlcnksXG4gICAgICAgICAgICBib2R5UGFyYW1zOiByZXEuYm9keSxcbiAgICAgICAgICAgIHJlcXVlc3Q6IHJlcSxcbiAgICAgICAgICAgIHJlc3BvbnNlOiByZXMsXG4gICAgICAgICAgICBkb25lOiBkb25lRnVuY1xuICAgICAgICAgIH07XG4gICAgICAgICAgXy5leHRlbmQoZW5kcG9pbnRDb250ZXh0LCBlbmRwb2ludCk7XG4gICAgICAgICAgcmVzcG9uc2VEYXRhID0gbnVsbDtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzcG9uc2VEYXRhID0gc2VsZi5fY2FsbEVuZHBvaW50KGVuZHBvaW50Q29udGV4dCwgZW5kcG9pbnQpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yMSkge1xuICAgICAgICAgICAgZXJyb3IgPSBlcnJvcjE7XG4gICAgICAgICAgICBpcm9uUm91dGVyU2VuZEVycm9yVG9SZXNwb25zZShlcnJvciwgcmVxLCByZXMpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmVzcG9uc2VJbml0aWF0ZWQpIHtcbiAgICAgICAgICAgIHJlcy5lbmQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHJlcy5oZWFkZXJzU2VudCkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IGNhbGwgdGhpcy5kb25lKCkgYWZ0ZXIgaGFuZGxpbmcgZW5kcG9pbnQgcmVzcG9uc2UgbWFudWFsbHk6IFwiICsgbWV0aG9kICsgXCIgXCIgKyBmdWxsUGF0aCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlRGF0YSA9PT0gbnVsbCB8fCByZXNwb25zZURhdGEgPT09IHZvaWQgMCkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgcmV0dXJuIG51bGwgb3IgdW5kZWZpbmVkIGZyb20gYW4gZW5kcG9pbnQ6IFwiICsgbWV0aG9kICsgXCIgXCIgKyBmdWxsUGF0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChyZXNwb25zZURhdGEuYm9keSAmJiAocmVzcG9uc2VEYXRhLnN0YXR1c0NvZGUgfHwgcmVzcG9uc2VEYXRhLmhlYWRlcnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VsZi5fcmVzcG9uZChyZXMsIHJlc3BvbnNlRGF0YS5ib2R5LCByZXNwb25zZURhdGEuc3RhdHVzQ29kZSwgcmVzcG9uc2VEYXRhLmhlYWRlcnMpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gc2VsZi5fcmVzcG9uZChyZXMsIHJlc3BvbnNlRGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIF8uZWFjaChyZWplY3RlZE1ldGhvZHMsIGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgICAgICByZXR1cm4gSnNvblJvdXRlcy5hZGQobWV0aG9kLCBmdWxsUGF0aCwgZnVuY3Rpb24ocmVxLCByZXMpIHtcbiAgICAgICAgICB2YXIgaGVhZGVycywgcmVzcG9uc2VEYXRhO1xuICAgICAgICAgIHJlc3BvbnNlRGF0YSA9IHtcbiAgICAgICAgICAgIHN0YXR1czogJ2Vycm9yJyxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdBUEkgZW5kcG9pbnQgZG9lcyBub3QgZXhpc3QnXG4gICAgICAgICAgfTtcbiAgICAgICAgICBoZWFkZXJzID0ge1xuICAgICAgICAgICAgJ0FsbG93JzogYWxsb3dlZE1ldGhvZHMuam9pbignLCAnKS50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgfTtcbiAgICAgICAgICByZXR1cm4gc2VsZi5fcmVzcG9uZChyZXMsIHJlc3BvbnNlRGF0YSwgNDA1LCBoZWFkZXJzKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9KSgpO1xuXG5cbiAgLypcbiAgXHRcdENvbnZlcnQgYWxsIGVuZHBvaW50cyBvbiB0aGUgZ2l2ZW4gcm91dGUgaW50byBvdXIgZXhwZWN0ZWQgZW5kcG9pbnQgb2JqZWN0IGlmIGl0IGlzIGEgYmFyZVxuICBcdFx0ZnVuY3Rpb25cbiAgXG4gIFx0XHRAcGFyYW0ge1JvdXRlfSByb3V0ZSBUaGUgcm91dGUgdGhlIGVuZHBvaW50cyBiZWxvbmcgdG9cbiAgICovXG5cbiAgUm91dGUucHJvdG90eXBlLl9yZXNvbHZlRW5kcG9pbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgXy5lYWNoKHRoaXMuZW5kcG9pbnRzLCBmdW5jdGlvbihlbmRwb2ludCwgbWV0aG9kLCBlbmRwb2ludHMpIHtcbiAgICAgIGlmIChfLmlzRnVuY3Rpb24oZW5kcG9pbnQpKSB7XG4gICAgICAgIHJldHVybiBlbmRwb2ludHNbbWV0aG9kXSA9IHtcbiAgICAgICAgICBhY3Rpb246IGVuZHBvaW50XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cblxuICAvKlxuICBcdFx0Q29uZmlndXJlIHRoZSBhdXRoZW50aWNhdGlvbiBhbmQgcm9sZSByZXF1aXJlbWVudCBvbiBhbGwgZW5kcG9pbnRzIChleGNlcHQgT1BUSU9OUywgd2hpY2ggbXVzdFxuICBcdFx0YmUgY29uZmlndXJlZCBkaXJlY3RseSBvbiB0aGUgZW5kcG9pbnQpXG4gIFxuICBcdFx0QXV0aGVudGljYXRpb24gY2FuIGJlIHJlcXVpcmVkIG9uIGFuIGVudGlyZSByb3V0ZSBvciBpbmRpdmlkdWFsIGVuZHBvaW50cy4gSWYgcmVxdWlyZWQgb24gYW5cbiAgXHRcdGVudGlyZSByb3V0ZSwgdGhhdCBzZXJ2ZXMgYXMgdGhlIGRlZmF1bHQuIElmIHJlcXVpcmVkIGluIGFueSBpbmRpdmlkdWFsIGVuZHBvaW50cywgdGhhdCB3aWxsXG4gIFx0XHRvdmVycmlkZSB0aGUgZGVmYXVsdC5cbiAgXG4gIFx0XHRBZnRlciB0aGUgZW5kcG9pbnQgaXMgY29uZmlndXJlZCwgYWxsIGF1dGhlbnRpY2F0aW9uIGFuZCByb2xlIHJlcXVpcmVtZW50cyBvZiBhbiBlbmRwb2ludCBjYW4gYmVcbiAgXHRcdGFjY2Vzc2VkIGF0IDxjb2RlPmVuZHBvaW50LmF1dGhSZXF1aXJlZDwvY29kZT4gYW5kIDxjb2RlPmVuZHBvaW50LnJvbGVSZXF1aXJlZDwvY29kZT4sXG4gIFx0XHRyZXNwZWN0aXZlbHkuXG4gIFxuICBcdFx0QHBhcmFtIHtSb3V0ZX0gcm91dGUgVGhlIHJvdXRlIHRoZSBlbmRwb2ludHMgYmVsb25nIHRvXG4gIFx0XHRAcGFyYW0ge0VuZHBvaW50fSBlbmRwb2ludCBUaGUgZW5kcG9pbnQgdG8gY29uZmlndXJlXG4gICAqL1xuXG4gIFJvdXRlLnByb3RvdHlwZS5fY29uZmlndXJlRW5kcG9pbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgXy5lYWNoKHRoaXMuZW5kcG9pbnRzLCBmdW5jdGlvbihlbmRwb2ludCwgbWV0aG9kKSB7XG4gICAgICB2YXIgcmVmLCByZWYxLCByZWYyO1xuICAgICAgaWYgKG1ldGhvZCAhPT0gJ29wdGlvbnMnKSB7XG4gICAgICAgIGlmICghKChyZWYgPSB0aGlzLm9wdGlvbnMpICE9IG51bGwgPyByZWYucm9sZVJlcXVpcmVkIDogdm9pZCAwKSkge1xuICAgICAgICAgIHRoaXMub3B0aW9ucy5yb2xlUmVxdWlyZWQgPSBbXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWVuZHBvaW50LnJvbGVSZXF1aXJlZCkge1xuICAgICAgICAgIGVuZHBvaW50LnJvbGVSZXF1aXJlZCA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIGVuZHBvaW50LnJvbGVSZXF1aXJlZCA9IF8udW5pb24oZW5kcG9pbnQucm9sZVJlcXVpcmVkLCB0aGlzLm9wdGlvbnMucm9sZVJlcXVpcmVkKTtcbiAgICAgICAgaWYgKF8uaXNFbXB0eShlbmRwb2ludC5yb2xlUmVxdWlyZWQpKSB7XG4gICAgICAgICAgZW5kcG9pbnQucm9sZVJlcXVpcmVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVuZHBvaW50LmF1dGhSZXF1aXJlZCA9PT0gdm9pZCAwKSB7XG4gICAgICAgICAgaWYgKCgocmVmMSA9IHRoaXMub3B0aW9ucykgIT0gbnVsbCA/IHJlZjEuYXV0aFJlcXVpcmVkIDogdm9pZCAwKSB8fCBlbmRwb2ludC5yb2xlUmVxdWlyZWQpIHtcbiAgICAgICAgICAgIGVuZHBvaW50LmF1dGhSZXF1aXJlZCA9IHRydWU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVuZHBvaW50LmF1dGhSZXF1aXJlZCA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoKHJlZjIgPSB0aGlzLm9wdGlvbnMpICE9IG51bGwgPyByZWYyLnNwYWNlUmVxdWlyZWQgOiB2b2lkIDApIHtcbiAgICAgICAgICBlbmRwb2ludC5zcGFjZVJlcXVpcmVkID0gdGhpcy5vcHRpb25zLnNwYWNlUmVxdWlyZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCB0aGlzKTtcbiAgfTtcblxuXG4gIC8qXG4gIFx0XHRBdXRoZW50aWNhdGUgYW4gZW5kcG9pbnQgaWYgcmVxdWlyZWQsIGFuZCByZXR1cm4gdGhlIHJlc3VsdCBvZiBjYWxsaW5nIGl0XG4gIFxuICBcdFx0QHJldHVybnMgVGhlIGVuZHBvaW50IHJlc3BvbnNlIG9yIGEgNDAxIGlmIGF1dGhlbnRpY2F0aW9uIGZhaWxzXG4gICAqL1xuXG4gIFJvdXRlLnByb3RvdHlwZS5fY2FsbEVuZHBvaW50ID0gZnVuY3Rpb24oZW5kcG9pbnRDb250ZXh0LCBlbmRwb2ludCkge1xuICAgIHZhciBpbnZvY2F0aW9uO1xuICAgIGlmICh0aGlzLl9hdXRoQWNjZXB0ZWQoZW5kcG9pbnRDb250ZXh0LCBlbmRwb2ludCkpIHtcbiAgICAgIGlmICh0aGlzLl9yb2xlQWNjZXB0ZWQoZW5kcG9pbnRDb250ZXh0LCBlbmRwb2ludCkpIHtcbiAgICAgICAgaWYgKHRoaXMuX3NwYWNlQWNjZXB0ZWQoZW5kcG9pbnRDb250ZXh0LCBlbmRwb2ludCkpIHtcbiAgICAgICAgICBpbnZvY2F0aW9uID0gbmV3IEREUENvbW1vbi5NZXRob2RJbnZvY2F0aW9uKHtcbiAgICAgICAgICAgIGlzU2ltdWxhdGlvbjogdHJ1ZSxcbiAgICAgICAgICAgIHVzZXJJZDogZW5kcG9pbnRDb250ZXh0LnVzZXJJZCxcbiAgICAgICAgICAgIGNvbm5lY3Rpb246IG51bGwsXG4gICAgICAgICAgICByYW5kb21TZWVkOiBERFBDb21tb24ubWFrZVJwY1NlZWQoKVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBERFAuX0N1cnJlbnRJbnZvY2F0aW9uLndpdGhWYWx1ZShpbnZvY2F0aW9uLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBlbmRwb2ludC5hY3Rpb24uY2FsbChlbmRwb2ludENvbnRleHQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGF0dXNDb2RlOiA0MDMsXG4gICAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICAgIHN0YXR1czogJ2Vycm9yJyxcbiAgICAgICAgICAgICAgbWVzc2FnZTogJ0JhZCBYLVNwYWNlLUlkLCBPbmx5IGFkbWlucyBvZiBwYWlkIHNwYWNlIGNhbiBjYWxsIHRoaXMgYXBpLidcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN0YXR1c0NvZGU6IDQwMyxcbiAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICBzdGF0dXM6ICdlcnJvcicsXG4gICAgICAgICAgICBtZXNzYWdlOiAnWW91IGRvIG5vdCBoYXZlIHBlcm1pc3Npb24gdG8gZG8gdGhpcy4nXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGF0dXNDb2RlOiA0MDEsXG4gICAgICAgIGJvZHk6IHtcbiAgICAgICAgICBzdGF0dXM6ICdlcnJvcicsXG4gICAgICAgICAgbWVzc2FnZTogJ1lvdSBtdXN0IGJlIGxvZ2dlZCBpbiB0byBkbyB0aGlzLidcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gIH07XG5cblxuICAvKlxuICBcdFx0QXV0aGVudGljYXRlIHRoZSBnaXZlbiBlbmRwb2ludCBpZiByZXF1aXJlZFxuICBcbiAgXHRcdE9uY2UgaXQncyBnbG9iYWxseSBjb25maWd1cmVkIGluIHRoZSBBUEksIGF1dGhlbnRpY2F0aW9uIGNhbiBiZSByZXF1aXJlZCBvbiBhbiBlbnRpcmUgcm91dGUgb3JcbiAgXHRcdGluZGl2aWR1YWwgZW5kcG9pbnRzLiBJZiByZXF1aXJlZCBvbiBhbiBlbnRpcmUgZW5kcG9pbnQsIHRoYXQgc2VydmVzIGFzIHRoZSBkZWZhdWx0LiBJZiByZXF1aXJlZFxuICBcdFx0aW4gYW55IGluZGl2aWR1YWwgZW5kcG9pbnRzLCB0aGF0IHdpbGwgb3ZlcnJpZGUgdGhlIGRlZmF1bHQuXG4gIFxuICBcdFx0QHJldHVybnMgRmFsc2UgaWYgYXV0aGVudGljYXRpb24gZmFpbHMsIGFuZCB0cnVlIG90aGVyd2lzZVxuICAgKi9cblxuICBSb3V0ZS5wcm90b3R5cGUuX2F1dGhBY2NlcHRlZCA9IGZ1bmN0aW9uKGVuZHBvaW50Q29udGV4dCwgZW5kcG9pbnQpIHtcbiAgICBpZiAoZW5kcG9pbnQuYXV0aFJlcXVpcmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5fYXV0aGVudGljYXRlKGVuZHBvaW50Q29udGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfTtcblxuXG4gIC8qXG4gIFx0XHRWZXJpZnkgdGhlIHJlcXVlc3QgaXMgYmVpbmcgbWFkZSBieSBhbiBhY3RpdmVseSBsb2dnZWQgaW4gdXNlclxuICBcbiAgXHRcdElmIHZlcmlmaWVkLCBhdHRhY2ggdGhlIGF1dGhlbnRpY2F0ZWQgdXNlciB0byB0aGUgY29udGV4dC5cbiAgXG4gIFx0XHRAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgYXV0aGVudGljYXRpb24gd2FzIHN1Y2Nlc3NmdWxcbiAgICovXG5cbiAgUm91dGUucHJvdG90eXBlLl9hdXRoZW50aWNhdGUgPSBmdW5jdGlvbihlbmRwb2ludENvbnRleHQpIHtcbiAgICB2YXIgYXV0aCwgdXNlclNlbGVjdG9yO1xuICAgIGF1dGggPSB0aGlzLmFwaS5fY29uZmlnLmF1dGgudXNlci5jYWxsKGVuZHBvaW50Q29udGV4dCk7XG4gICAgaWYgKChhdXRoICE9IG51bGwgPyBhdXRoLnVzZXJJZCA6IHZvaWQgMCkgJiYgKGF1dGggIT0gbnVsbCA/IGF1dGgudG9rZW4gOiB2b2lkIDApICYmICEoYXV0aCAhPSBudWxsID8gYXV0aC51c2VyIDogdm9pZCAwKSkge1xuICAgICAgdXNlclNlbGVjdG9yID0ge307XG4gICAgICB1c2VyU2VsZWN0b3IuX2lkID0gYXV0aC51c2VySWQ7XG4gICAgICB1c2VyU2VsZWN0b3JbdGhpcy5hcGkuX2NvbmZpZy5hdXRoLnRva2VuXSA9IGF1dGgudG9rZW47XG4gICAgICBhdXRoLnVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh1c2VyU2VsZWN0b3IpO1xuICAgIH1cbiAgICBpZiAoYXV0aCAhPSBudWxsID8gYXV0aC51c2VyIDogdm9pZCAwKSB7XG4gICAgICBlbmRwb2ludENvbnRleHQudXNlciA9IGF1dGgudXNlcjtcbiAgICAgIGVuZHBvaW50Q29udGV4dC51c2VySWQgPSBhdXRoLnVzZXIuX2lkO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH07XG5cblxuICAvKlxuICBcdFx0QXV0aGVudGljYXRlIHRoZSB1c2VyIHJvbGUgaWYgcmVxdWlyZWRcbiAgXG4gIFx0XHRNdXN0IGJlIGNhbGxlZCBhZnRlciBfYXV0aEFjY2VwdGVkKCkuXG4gIFxuICBcdFx0QHJldHVybnMgVHJ1ZSBpZiB0aGUgYXV0aGVudGljYXRlZCB1c2VyIGJlbG9uZ3MgdG8gPGk+YW55PC9pPiBvZiB0aGUgYWNjZXB0YWJsZSByb2xlcyBvbiB0aGVcbiAgXHRcdFx0XHRcdFx0IGVuZHBvaW50XG4gICAqL1xuXG4gIFJvdXRlLnByb3RvdHlwZS5fc3BhY2VBY2NlcHRlZCA9IGZ1bmN0aW9uKGVuZHBvaW50Q29udGV4dCwgZW5kcG9pbnQpIHtcbiAgICB2YXIgYXV0aCwgc3BhY2UsIHNwYWNlX3VzZXJzX2NvdW50O1xuICAgIGlmIChlbmRwb2ludC5zcGFjZVJlcXVpcmVkKSB7XG4gICAgICBhdXRoID0gdGhpcy5hcGkuX2NvbmZpZy5hdXRoLnVzZXIuY2FsbChlbmRwb2ludENvbnRleHQpO1xuICAgICAgaWYgKGF1dGggIT0gbnVsbCA/IGF1dGguc3BhY2VJZCA6IHZvaWQgMCkge1xuICAgICAgICBzcGFjZV91c2Vyc19jb3VudCA9IGRiLnNwYWNlX3VzZXJzLmZpbmQoe1xuICAgICAgICAgIHVzZXI6IGF1dGgudXNlcklkLFxuICAgICAgICAgIHNwYWNlOiBhdXRoLnNwYWNlSWRcbiAgICAgICAgfSkuY291bnQoKTtcbiAgICAgICAgaWYgKHNwYWNlX3VzZXJzX2NvdW50KSB7XG4gICAgICAgICAgc3BhY2UgPSBkYi5zcGFjZXMuZmluZE9uZShhdXRoLnNwYWNlSWQpO1xuICAgICAgICAgIGlmICgoc3BhY2UgIT0gbnVsbCA/IHNwYWNlLmlzX3BhaWQgOiB2b2lkIDApICYmIF8uaW5kZXhPZihzcGFjZS5hZG1pbnMsIGF1dGgudXNlcklkKSA+PSAwKSB7XG4gICAgICAgICAgICBlbmRwb2ludENvbnRleHQuc3BhY2VJZCA9IGF1dGguc3BhY2VJZDtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZW5kcG9pbnRDb250ZXh0LnNwYWNlSWQgPSBcImJhZFwiO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuXG4gIC8qXG4gIFx0XHRBdXRoZW50aWNhdGUgdGhlIHVzZXIgcm9sZSBpZiByZXF1aXJlZFxuICBcbiAgXHRcdE11c3QgYmUgY2FsbGVkIGFmdGVyIF9hdXRoQWNjZXB0ZWQoKS5cbiAgXG4gIFx0XHRAcmV0dXJucyBUcnVlIGlmIHRoZSBhdXRoZW50aWNhdGVkIHVzZXIgYmVsb25ncyB0byA8aT5hbnk8L2k+IG9mIHRoZSBhY2NlcHRhYmxlIHJvbGVzIG9uIHRoZVxuICBcdFx0XHRcdFx0XHQgZW5kcG9pbnRcbiAgICovXG5cbiAgUm91dGUucHJvdG90eXBlLl9yb2xlQWNjZXB0ZWQgPSBmdW5jdGlvbihlbmRwb2ludENvbnRleHQsIGVuZHBvaW50KSB7XG4gICAgaWYgKGVuZHBvaW50LnJvbGVSZXF1aXJlZCkge1xuICAgICAgaWYgKF8uaXNFbXB0eShfLmludGVyc2VjdGlvbihlbmRwb2ludC5yb2xlUmVxdWlyZWQsIGVuZHBvaW50Q29udGV4dC51c2VyLnJvbGVzKSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuXG4gIC8qXG4gIFx0XHRSZXNwb25kIHRvIGFuIEhUVFAgcmVxdWVzdFxuICAgKi9cblxuICBSb3V0ZS5wcm90b3R5cGUuX3Jlc3BvbmQgPSBmdW5jdGlvbihyZXNwb25zZSwgYm9keSwgc3RhdHVzQ29kZSwgaGVhZGVycykge1xuICAgIHZhciBkZWZhdWx0SGVhZGVycywgZGVsYXlJbk1pbGxpc2Vjb25kcywgbWluaW11bURlbGF5SW5NaWxsaXNlY29uZHMsIHJhbmRvbU11bHRpcGxpZXJCZXR3ZWVuT25lQW5kVHdvLCBzZW5kUmVzcG9uc2U7XG4gICAgaWYgKHN0YXR1c0NvZGUgPT0gbnVsbCkge1xuICAgICAgc3RhdHVzQ29kZSA9IDIwMDtcbiAgICB9XG4gICAgaWYgKGhlYWRlcnMgPT0gbnVsbCkge1xuICAgICAgaGVhZGVycyA9IHt9O1xuICAgIH1cbiAgICBkZWZhdWx0SGVhZGVycyA9IHRoaXMuX2xvd2VyQ2FzZUtleXModGhpcy5hcGkuX2NvbmZpZy5kZWZhdWx0SGVhZGVycyk7XG4gICAgaGVhZGVycyA9IHRoaXMuX2xvd2VyQ2FzZUtleXMoaGVhZGVycyk7XG4gICAgaGVhZGVycyA9IF8uZXh0ZW5kKGRlZmF1bHRIZWFkZXJzLCBoZWFkZXJzKTtcbiAgICBpZiAoaGVhZGVyc1snY29udGVudC10eXBlJ10ubWF0Y2goL2pzb258amF2YXNjcmlwdC8pICE9PSBudWxsKSB7XG4gICAgICBpZiAodGhpcy5hcGkuX2NvbmZpZy5wcmV0dHlKc29uKSB7XG4gICAgICAgIGJvZHkgPSBKU09OLnN0cmluZ2lmeShib2R5LCB2b2lkIDAsIDIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYm9keSA9IEpTT04uc3RyaW5naWZ5KGJvZHkpO1xuICAgICAgfVxuICAgIH1cbiAgICBzZW5kUmVzcG9uc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJlc3BvbnNlLndyaXRlSGVhZChzdGF0dXNDb2RlLCBoZWFkZXJzKTtcbiAgICAgIHJlc3BvbnNlLndyaXRlKGJvZHkpO1xuICAgICAgcmV0dXJuIHJlc3BvbnNlLmVuZCgpO1xuICAgIH07XG4gICAgaWYgKHN0YXR1c0NvZGUgPT09IDQwMSB8fCBzdGF0dXNDb2RlID09PSA0MDMpIHtcbiAgICAgIG1pbmltdW1EZWxheUluTWlsbGlzZWNvbmRzID0gNTAwO1xuICAgICAgcmFuZG9tTXVsdGlwbGllckJldHdlZW5PbmVBbmRUd28gPSAxICsgTWF0aC5yYW5kb20oKTtcbiAgICAgIGRlbGF5SW5NaWxsaXNlY29uZHMgPSBtaW5pbXVtRGVsYXlJbk1pbGxpc2Vjb25kcyAqIHJhbmRvbU11bHRpcGxpZXJCZXR3ZWVuT25lQW5kVHdvO1xuICAgICAgcmV0dXJuIE1ldGVvci5zZXRUaW1lb3V0KHNlbmRSZXNwb25zZSwgZGVsYXlJbk1pbGxpc2Vjb25kcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzZW5kUmVzcG9uc2UoKTtcbiAgICB9XG4gIH07XG5cblxuICAvKlxuICBcdFx0UmV0dXJuIHRoZSBvYmplY3Qgd2l0aCBhbGwgb2YgdGhlIGtleXMgY29udmVydGVkIHRvIGxvd2VyY2FzZVxuICAgKi9cblxuICBSb3V0ZS5wcm90b3R5cGUuX2xvd2VyQ2FzZUtleXMgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgICByZXR1cm4gXy5jaGFpbihvYmplY3QpLnBhaXJzKCkubWFwKGZ1bmN0aW9uKGF0dHIpIHtcbiAgICAgIHJldHVybiBbYXR0clswXS50b0xvd2VyQ2FzZSgpLCBhdHRyWzFdXTtcbiAgICB9KS5vYmplY3QoKS52YWx1ZSgpO1xuICB9O1xuXG4gIHJldHVybiBSb3V0ZTtcblxufSkoKTtcbiIsImJhc2ljQXV0aCA9IHJlcXVpcmUoJ2Jhc2ljLWF1dGgnKVxuQ29va2llcyA9IHJlcXVpcmUoXCJjb29raWVzXCIpXG5cbmNsYXNzIEBPZGF0YVJlc3RpdnVzXG5cblx0Y29uc3RydWN0b3I6IChvcHRpb25zKSAtPlxuXHRcdEBfcm91dGVzID0gW11cblx0XHRAX2NvbmZpZyA9XG5cdFx0XHRwYXRoczogW11cblx0XHRcdHVzZURlZmF1bHRBdXRoOiBmYWxzZVxuXHRcdFx0YXBpUGF0aDogJ2FwaS8nXG5cdFx0XHR2ZXJzaW9uOiBudWxsXG5cdFx0XHRwcmV0dHlKc29uOiBmYWxzZVxuXHRcdFx0YXV0aDpcblx0XHRcdFx0dG9rZW46ICdzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMuaGFzaGVkVG9rZW4nXG5cdFx0XHRcdHVzZXI6IC0+XG5cdFx0XHRcdFx0Y29va2llcyA9IG5ldyBDb29raWVzKCBAcmVxdWVzdCwgQHJlc3BvbnNlIClcblx0XHRcdFx0XHR1c2VySWQgPSBAcmVxdWVzdC5oZWFkZXJzWyd4LXVzZXItaWQnXSB8fCBjb29raWVzLmdldChcIlgtVXNlci1JZFwiKVxuXHRcdFx0XHRcdGF1dGhUb2tlbiA9IEByZXF1ZXN0LmhlYWRlcnNbJ3gtYXV0aC10b2tlbiddIHx8IGNvb2tpZXMuZ2V0KFwiWC1BdXRoLVRva2VuXCIpXG5cdFx0XHRcdFx0c3BhY2VJZCA9IEByZXF1ZXN0LmhlYWRlcnNbJ3gtc3BhY2UtaWQnXSB8fCBAdXJsUGFyYW1zWydzcGFjZUlkJ11cblx0XHRcdFx0XHRpZiBhdXRoVG9rZW5cblx0XHRcdFx0XHRcdHRva2VuID0gQWNjb3VudHMuX2hhc2hMb2dpblRva2VuIGF1dGhUb2tlblxuXHRcdFx0XHRcdGlmIEByZXF1ZXN0LnVzZXJJZFxuXHRcdFx0XHRcdFx0X3VzZXIgPSBkYi51c2Vycy5maW5kT25lKHtfaWQ6IEByZXF1ZXN0LnVzZXJJZH0pXG5cdFx0XHRcdFx0XHR1c2VyOiBfdXNlclxuXHRcdFx0XHRcdFx0dXNlcklkOiB1c2VySWRcblx0XHRcdFx0XHRcdHNwYWNlSWQ6IHNwYWNlSWRcblx0XHRcdFx0XHRcdHRva2VuOiB0b2tlblxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdHVzZXJJZDogdXNlcklkXG5cdFx0XHRcdFx0XHRzcGFjZUlkOiBzcGFjZUlkXG5cdFx0XHRcdFx0XHR0b2tlbjogdG9rZW5cblx0XHRcdGRlZmF1bHRIZWFkZXJzOlxuXHRcdFx0XHQnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG5cdFx0XHRlbmFibGVDb3JzOiB0cnVlXG5cblx0XHQjIENvbmZpZ3VyZSBBUEkgd2l0aCB0aGUgZ2l2ZW4gb3B0aW9uc1xuXHRcdF8uZXh0ZW5kIEBfY29uZmlnLCBvcHRpb25zXG5cblx0XHRpZiBAX2NvbmZpZy5lbmFibGVDb3JzXG5cdFx0XHRjb3JzSGVhZGVycyA9XG5cdFx0XHRcdCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKidcblx0XHRcdFx0J0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnOiAnT3JpZ2luLCBYLVJlcXVlc3RlZC1XaXRoLCBDb250ZW50LVR5cGUsIEFjY2VwdCwgT0RhdGEtVmVyc2lvbidcblxuXHRcdFx0aWYgQF9jb25maWcudXNlRGVmYXVsdEF1dGhcblx0XHRcdFx0Y29yc0hlYWRlcnNbJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnXSArPSAnLCBYLVVzZXItSWQsIFgtQXV0aC1Ub2tlbiwgWC1TcGFjZS1JZCdcblxuXHRcdFx0IyBTZXQgZGVmYXVsdCBoZWFkZXIgdG8gZW5hYmxlIENPUlMgaWYgY29uZmlndXJlZFxuXHRcdFx0Xy5leHRlbmQgQF9jb25maWcuZGVmYXVsdEhlYWRlcnMsIGNvcnNIZWFkZXJzXG5cblx0XHRcdGlmIG5vdCBAX2NvbmZpZy5kZWZhdWx0T3B0aW9uc0VuZHBvaW50XG5cdFx0XHRcdEBfY29uZmlnLmRlZmF1bHRPcHRpb25zRW5kcG9pbnQgPSAtPlxuXHRcdFx0XHRcdEByZXNwb25zZS53cml0ZUhlYWQgMjAwLCBjb3JzSGVhZGVyc1xuXHRcdFx0XHRcdEBkb25lKClcblxuXHRcdCMgTm9ybWFsaXplIHRoZSBBUEkgcGF0aFxuXHRcdGlmIEBfY29uZmlnLmFwaVBhdGhbMF0gaXMgJy8nXG5cdFx0XHRAX2NvbmZpZy5hcGlQYXRoID0gQF9jb25maWcuYXBpUGF0aC5zbGljZSAxXG5cdFx0aWYgXy5sYXN0KEBfY29uZmlnLmFwaVBhdGgpIGlzbnQgJy8nXG5cdFx0XHRAX2NvbmZpZy5hcGlQYXRoID0gQF9jb25maWcuYXBpUGF0aCArICcvJ1xuXG5cdFx0IyBVUkwgcGF0aCB2ZXJzaW9uaW5nIGlzIHRoZSBvbmx5IHR5cGUgb2YgQVBJIHZlcnNpb25pbmcgY3VycmVudGx5IGF2YWlsYWJsZSwgc28gaWYgYSB2ZXJzaW9uIGlzXG5cdFx0IyBwcm92aWRlZCwgYXBwZW5kIGl0IHRvIHRoZSBiYXNlIHBhdGggb2YgdGhlIEFQSVxuXHRcdGlmIEBfY29uZmlnLnZlcnNpb25cblx0XHRcdEBfY29uZmlnLmFwaVBhdGggKz0gQF9jb25maWcudmVyc2lvbiArICcvJ1xuXG5cdFx0IyBBZGQgZGVmYXVsdCBsb2dpbiBhbmQgbG9nb3V0IGVuZHBvaW50cyBpZiBhdXRoIGlzIGNvbmZpZ3VyZWRcblx0XHRpZiBAX2NvbmZpZy51c2VEZWZhdWx0QXV0aFxuXHRcdFx0QF9pbml0QXV0aCgpXG5cdFx0ZWxzZSBpZiBAX2NvbmZpZy51c2VBdXRoXG5cdFx0XHRAX2luaXRBdXRoKClcblx0XHRcdGNvbnNvbGUud2FybiAnV2FybmluZzogdXNlQXV0aCBBUEkgY29uZmlnIG9wdGlvbiB3aWxsIGJlIHJlbW92ZWQgaW4gUmVzdGl2dXMgdjEuMCAnICtcblx0XHRcdFx0XHQnXFxuICAgIFVzZSB0aGUgdXNlRGVmYXVsdEF1dGggb3B0aW9uIGluc3RlYWQnXG5cblx0XHRyZXR1cm4gdGhpc1xuXG5cblx0IyMjKlxuXHRcdEFkZCBlbmRwb2ludHMgZm9yIHRoZSBnaXZlbiBIVFRQIG1ldGhvZHMgYXQgdGhlIGdpdmVuIHBhdGhcblxuXHRcdEBwYXJhbSBwYXRoIHtTdHJpbmd9IFRoZSBleHRlbmRlZCBVUkwgcGF0aCAod2lsbCBiZSBhcHBlbmRlZCB0byBiYXNlIHBhdGggb2YgdGhlIEFQSSlcblx0XHRAcGFyYW0gb3B0aW9ucyB7T2JqZWN0fSBSb3V0ZSBjb25maWd1cmF0aW9uIG9wdGlvbnNcblx0XHRAcGFyYW0gb3B0aW9ucy5hdXRoUmVxdWlyZWQge0Jvb2xlYW59IFRoZSBkZWZhdWx0IGF1dGggcmVxdWlyZW1lbnQgZm9yIGVhY2ggZW5kcG9pbnQgb24gdGhlIHJvdXRlXG5cdFx0QHBhcmFtIG9wdGlvbnMucm9sZVJlcXVpcmVkIHtTdHJpbmcgb3IgU3RyaW5nW119IFRoZSBkZWZhdWx0IHJvbGUgcmVxdWlyZWQgZm9yIGVhY2ggZW5kcG9pbnQgb24gdGhlIHJvdXRlXG5cdFx0QHBhcmFtIGVuZHBvaW50cyB7T2JqZWN0fSBBIHNldCBvZiBlbmRwb2ludHMgYXZhaWxhYmxlIG9uIHRoZSBuZXcgcm91dGUgKGdldCwgcG9zdCwgcHV0LCBwYXRjaCwgZGVsZXRlLCBvcHRpb25zKVxuXHRcdEBwYXJhbSBlbmRwb2ludHMuPG1ldGhvZD4ge0Z1bmN0aW9uIG9yIE9iamVjdH0gSWYgYSBmdW5jdGlvbiBpcyBwcm92aWRlZCwgYWxsIGRlZmF1bHQgcm91dGVcblx0XHRcdFx0Y29uZmlndXJhdGlvbiBvcHRpb25zIHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZW5kcG9pbnQuIE90aGVyd2lzZSBhbiBvYmplY3Qgd2l0aCBhbiBgYWN0aW9uYFxuXHRcdFx0XHRhbmQgYWxsIG90aGVyIHJvdXRlIGNvbmZpZyBvcHRpb25zIGF2YWlsYWJsZS4gQW4gYGFjdGlvbmAgbXVzdCBiZSBwcm92aWRlZCB3aXRoIHRoZSBvYmplY3QuXG5cdCMjI1xuXHRhZGRSb3V0ZTogKHBhdGgsIG9wdGlvbnMsIGVuZHBvaW50cykgLT5cblx0XHQjIENyZWF0ZSBhIG5ldyByb3V0ZSBhbmQgYWRkIGl0IHRvIG91ciBsaXN0IG9mIGV4aXN0aW5nIHJvdXRlc1xuXHRcdHJvdXRlID0gbmV3IHNoYXJlLlJvdXRlKHRoaXMsIHBhdGgsIG9wdGlvbnMsIGVuZHBvaW50cylcblx0XHRAX3JvdXRlcy5wdXNoKHJvdXRlKVxuXG5cdFx0cm91dGUuYWRkVG9BcGkoKVxuXG5cdFx0cmV0dXJuIHRoaXNcblxuXG5cdCMjIypcblx0XHRHZW5lcmF0ZSByb3V0ZXMgZm9yIHRoZSBNZXRlb3IgQ29sbGVjdGlvbiB3aXRoIHRoZSBnaXZlbiBuYW1lXG5cdCMjI1xuXHRhZGRDb2xsZWN0aW9uOiAoY29sbGVjdGlvbiwgb3B0aW9ucz17fSkgLT5cblx0XHRtZXRob2RzID0gWydnZXQnLCAncG9zdCcsICdwdXQnLCAnZGVsZXRlJywgJ2dldEFsbCddXG5cdFx0bWV0aG9kc09uQ29sbGVjdGlvbiA9IFsncG9zdCcsICdnZXRBbGwnXVxuXG5cdFx0IyBHcmFiIHRoZSBzZXQgb2YgZW5kcG9pbnRzXG5cdFx0aWYgY29sbGVjdGlvbiBpcyBNZXRlb3IudXNlcnNcblx0XHRcdGNvbGxlY3Rpb25FbmRwb2ludHMgPSBAX3VzZXJDb2xsZWN0aW9uRW5kcG9pbnRzXG5cdFx0ZWxzZVxuXHRcdFx0Y29sbGVjdGlvbkVuZHBvaW50cyA9IEBfY29sbGVjdGlvbkVuZHBvaW50c1xuXG5cdFx0IyBGbGF0dGVuIHRoZSBvcHRpb25zIGFuZCBzZXQgZGVmYXVsdHMgaWYgbmVjZXNzYXJ5XG5cdFx0ZW5kcG9pbnRzQXdhaXRpbmdDb25maWd1cmF0aW9uID0gb3B0aW9ucy5lbmRwb2ludHMgb3Ige31cblx0XHRyb3V0ZU9wdGlvbnMgPSBvcHRpb25zLnJvdXRlT3B0aW9ucyBvciB7fVxuXHRcdGV4Y2x1ZGVkRW5kcG9pbnRzID0gb3B0aW9ucy5leGNsdWRlZEVuZHBvaW50cyBvciBbXVxuXHRcdCMgVXNlIGNvbGxlY3Rpb24gbmFtZSBhcyBkZWZhdWx0IHBhdGhcblx0XHRwYXRoID0gb3B0aW9ucy5wYXRoIG9yIGNvbGxlY3Rpb24uX25hbWVcblxuXHRcdCMgU2VwYXJhdGUgdGhlIHJlcXVlc3RlZCBlbmRwb2ludHMgYnkgdGhlIHJvdXRlIHRoZXkgYmVsb25nIHRvIChvbmUgZm9yIG9wZXJhdGluZyBvbiB0aGUgZW50aXJlXG5cdFx0IyBjb2xsZWN0aW9uIGFuZCBvbmUgZm9yIG9wZXJhdGluZyBvbiBhIHNpbmdsZSBlbnRpdHkgd2l0aGluIHRoZSBjb2xsZWN0aW9uKVxuXHRcdGNvbGxlY3Rpb25Sb3V0ZUVuZHBvaW50cyA9IHt9XG5cdFx0ZW50aXR5Um91dGVFbmRwb2ludHMgPSB7fVxuXHRcdGlmIF8uaXNFbXB0eShlbmRwb2ludHNBd2FpdGluZ0NvbmZpZ3VyYXRpb24pIGFuZCBfLmlzRW1wdHkoZXhjbHVkZWRFbmRwb2ludHMpXG5cdFx0XHQjIEdlbmVyYXRlIGFsbCBlbmRwb2ludHMgb24gdGhpcyBjb2xsZWN0aW9uXG5cdFx0XHRfLmVhY2ggbWV0aG9kcywgKG1ldGhvZCkgLT5cblx0XHRcdFx0IyBQYXJ0aXRpb24gdGhlIGVuZHBvaW50cyBpbnRvIHRoZWlyIHJlc3BlY3RpdmUgcm91dGVzXG5cdFx0XHRcdGlmIG1ldGhvZCBpbiBtZXRob2RzT25Db2xsZWN0aW9uXG5cdFx0XHRcdFx0Xy5leHRlbmQgY29sbGVjdGlvblJvdXRlRW5kcG9pbnRzLCBjb2xsZWN0aW9uRW5kcG9pbnRzW21ldGhvZF0uY2FsbCh0aGlzLCBjb2xsZWN0aW9uKVxuXHRcdFx0XHRlbHNlIF8uZXh0ZW5kIGVudGl0eVJvdXRlRW5kcG9pbnRzLCBjb2xsZWN0aW9uRW5kcG9pbnRzW21ldGhvZF0uY2FsbCh0aGlzLCBjb2xsZWN0aW9uKVxuXHRcdFx0XHRyZXR1cm5cblx0XHRcdCwgdGhpc1xuXHRcdGVsc2Vcblx0XHRcdCMgR2VuZXJhdGUgYW55IGVuZHBvaW50cyB0aGF0IGhhdmVuJ3QgYmVlbiBleHBsaWNpdGx5IGV4Y2x1ZGVkXG5cdFx0XHRfLmVhY2ggbWV0aG9kcywgKG1ldGhvZCkgLT5cblx0XHRcdFx0aWYgbWV0aG9kIG5vdCBpbiBleGNsdWRlZEVuZHBvaW50cyBhbmQgZW5kcG9pbnRzQXdhaXRpbmdDb25maWd1cmF0aW9uW21ldGhvZF0gaXNudCBmYWxzZVxuXHRcdFx0XHRcdCMgQ29uZmlndXJlIGVuZHBvaW50IGFuZCBtYXAgdG8gaXQncyBodHRwIG1ldGhvZFxuXHRcdFx0XHRcdCMgVE9ETzogQ29uc2lkZXIgcHJlZGVmaW5pbmcgYSBtYXAgb2YgbWV0aG9kcyB0byB0aGVpciBodHRwIG1ldGhvZCB0eXBlIChlLmcuLCBnZXRBbGw6IGdldClcblx0XHRcdFx0XHRlbmRwb2ludE9wdGlvbnMgPSBlbmRwb2ludHNBd2FpdGluZ0NvbmZpZ3VyYXRpb25bbWV0aG9kXVxuXHRcdFx0XHRcdGNvbmZpZ3VyZWRFbmRwb2ludCA9IHt9XG5cdFx0XHRcdFx0Xy5lYWNoIGNvbGxlY3Rpb25FbmRwb2ludHNbbWV0aG9kXS5jYWxsKHRoaXMsIGNvbGxlY3Rpb24pLCAoYWN0aW9uLCBtZXRob2RUeXBlKSAtPlxuXHRcdFx0XHRcdFx0Y29uZmlndXJlZEVuZHBvaW50W21ldGhvZFR5cGVdID1cblx0XHRcdFx0XHRcdFx0Xy5jaGFpbiBhY3Rpb25cblx0XHRcdFx0XHRcdFx0LmNsb25lKClcblx0XHRcdFx0XHRcdFx0LmV4dGVuZCBlbmRwb2ludE9wdGlvbnNcblx0XHRcdFx0XHRcdFx0LnZhbHVlKClcblx0XHRcdFx0XHQjIFBhcnRpdGlvbiB0aGUgZW5kcG9pbnRzIGludG8gdGhlaXIgcmVzcGVjdGl2ZSByb3V0ZXNcblx0XHRcdFx0XHRpZiBtZXRob2QgaW4gbWV0aG9kc09uQ29sbGVjdGlvblxuXHRcdFx0XHRcdFx0Xy5leHRlbmQgY29sbGVjdGlvblJvdXRlRW5kcG9pbnRzLCBjb25maWd1cmVkRW5kcG9pbnRcblx0XHRcdFx0XHRlbHNlIF8uZXh0ZW5kIGVudGl0eVJvdXRlRW5kcG9pbnRzLCBjb25maWd1cmVkRW5kcG9pbnRcblx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdCwgdGhpc1xuXG5cdFx0IyBBZGQgdGhlIHJvdXRlcyB0byB0aGUgQVBJXG5cdFx0QGFkZFJvdXRlIHBhdGgsIHJvdXRlT3B0aW9ucywgY29sbGVjdGlvblJvdXRlRW5kcG9pbnRzXG5cdFx0QGFkZFJvdXRlIFwiI3twYXRofS86aWRcIiwgcm91dGVPcHRpb25zLCBlbnRpdHlSb3V0ZUVuZHBvaW50c1xuXG5cdFx0cmV0dXJuIHRoaXNcblxuXG5cdCMjIypcblx0XHRBIHNldCBvZiBlbmRwb2ludHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0byBhIENvbGxlY3Rpb24gUm91dGVcblx0IyMjXG5cdF9jb2xsZWN0aW9uRW5kcG9pbnRzOlxuXHRcdGdldDogKGNvbGxlY3Rpb24pIC0+XG5cdFx0XHRnZXQ6XG5cdFx0XHRcdGFjdGlvbjogLT5cblx0XHRcdFx0XHRzZWxlY3RvciA9IHtfaWQ6IEB1cmxQYXJhbXMuaWR9XG5cdFx0XHRcdFx0aWYgdGhpcy5zcGFjZUlkXG5cdFx0XHRcdFx0XHRzZWxlY3Rvci5zcGFjZSA9IHRoaXMuc3BhY2VJZFxuXHRcdFx0XHRcdGVudGl0eSA9IGNvbGxlY3Rpb24uZmluZE9uZSBzZWxlY3RvclxuXHRcdFx0XHRcdGlmIGVudGl0eVxuXHRcdFx0XHRcdFx0e3N0YXR1czogJ3N1Y2Nlc3MnLCBkYXRhOiBlbnRpdHl9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XG5cdFx0XHRcdFx0XHRib2R5OiB7c3RhdHVzOiAnZmFpbCcsIG1lc3NhZ2U6ICdJdGVtIG5vdCBmb3VuZCd9XG5cdFx0cHV0OiAoY29sbGVjdGlvbikgLT5cblx0XHRcdHB1dDpcblx0XHRcdFx0YWN0aW9uOiAtPlxuXHRcdFx0XHRcdHNlbGVjdG9yID0ge19pZDogQHVybFBhcmFtcy5pZH1cblx0XHRcdFx0XHRpZiB0aGlzLnNwYWNlSWRcblx0XHRcdFx0XHRcdHNlbGVjdG9yLnNwYWNlID0gdGhpcy5zcGFjZUlkXG5cdFx0XHRcdFx0ZW50aXR5SXNVcGRhdGVkID0gY29sbGVjdGlvbi51cGRhdGUgc2VsZWN0b3IsICRzZXQ6IEBib2R5UGFyYW1zXG5cdFx0XHRcdFx0aWYgZW50aXR5SXNVcGRhdGVkXG5cdFx0XHRcdFx0XHRlbnRpdHkgPSBjb2xsZWN0aW9uLmZpbmRPbmUgQHVybFBhcmFtcy5pZFxuXHRcdFx0XHRcdFx0e3N0YXR1czogJ3N1Y2Nlc3MnLCBkYXRhOiBlbnRpdHl9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XG5cdFx0XHRcdFx0XHRib2R5OiB7c3RhdHVzOiAnZmFpbCcsIG1lc3NhZ2U6ICdJdGVtIG5vdCBmb3VuZCd9XG5cdFx0ZGVsZXRlOiAoY29sbGVjdGlvbikgLT5cblx0XHRcdGRlbGV0ZTpcblx0XHRcdFx0YWN0aW9uOiAtPlxuXHRcdFx0XHRcdHNlbGVjdG9yID0ge19pZDogQHVybFBhcmFtcy5pZH1cblx0XHRcdFx0XHRpZiB0aGlzLnNwYWNlSWRcblx0XHRcdFx0XHRcdHNlbGVjdG9yLnNwYWNlID0gdGhpcy5zcGFjZUlkXG5cdFx0XHRcdFx0aWYgY29sbGVjdGlvbi5yZW1vdmUgc2VsZWN0b3Jcblx0XHRcdFx0XHRcdHtzdGF0dXM6ICdzdWNjZXNzJywgZGF0YTogbWVzc2FnZTogJ0l0ZW0gcmVtb3ZlZCd9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XG5cdFx0XHRcdFx0XHRib2R5OiB7c3RhdHVzOiAnZmFpbCcsIG1lc3NhZ2U6ICdJdGVtIG5vdCBmb3VuZCd9XG5cdFx0cG9zdDogKGNvbGxlY3Rpb24pIC0+XG5cdFx0XHRwb3N0OlxuXHRcdFx0XHRhY3Rpb246IC0+XG5cdFx0XHRcdFx0aWYgdGhpcy5zcGFjZUlkXG5cdFx0XHRcdFx0XHRAYm9keVBhcmFtcy5zcGFjZSA9IHRoaXMuc3BhY2VJZFxuXHRcdFx0XHRcdGVudGl0eUlkID0gY29sbGVjdGlvbi5pbnNlcnQgQGJvZHlQYXJhbXNcblx0XHRcdFx0XHRlbnRpdHkgPSBjb2xsZWN0aW9uLmZpbmRPbmUgZW50aXR5SWRcblx0XHRcdFx0XHRpZiBlbnRpdHlcblx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDIwMVxuXHRcdFx0XHRcdFx0Ym9keToge3N0YXR1czogJ3N1Y2Nlc3MnLCBkYXRhOiBlbnRpdHl9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDAwXG5cdFx0XHRcdFx0XHRib2R5OiB7c3RhdHVzOiAnZmFpbCcsIG1lc3NhZ2U6ICdObyBpdGVtIGFkZGVkJ31cblx0XHRnZXRBbGw6IChjb2xsZWN0aW9uKSAtPlxuXHRcdFx0Z2V0OlxuXHRcdFx0XHRhY3Rpb246IC0+XG5cdFx0XHRcdFx0c2VsZWN0b3IgPSB7fVxuXHRcdFx0XHRcdGlmIHRoaXMuc3BhY2VJZFxuXHRcdFx0XHRcdFx0c2VsZWN0b3Iuc3BhY2UgPSB0aGlzLnNwYWNlSWRcblx0XHRcdFx0XHRlbnRpdGllcyA9IGNvbGxlY3Rpb24uZmluZChzZWxlY3RvcikuZmV0Y2goKVxuXHRcdFx0XHRcdGlmIGVudGl0aWVzXG5cdFx0XHRcdFx0XHR7c3RhdHVzOiAnc3VjY2VzcycsIGRhdGE6IGVudGl0aWVzfVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxuXHRcdFx0XHRcdFx0Ym9keToge3N0YXR1czogJ2ZhaWwnLCBtZXNzYWdlOiAnVW5hYmxlIHRvIHJldHJpZXZlIGl0ZW1zIGZyb20gY29sbGVjdGlvbid9XG5cblxuXHQjIyMqXG5cdFx0QSBzZXQgb2YgZW5kcG9pbnRzIHRoYXQgY2FuIGJlIGFwcGxpZWQgdG8gYSBNZXRlb3IudXNlcnMgQ29sbGVjdGlvbiBSb3V0ZVxuXHQjIyNcblx0X3VzZXJDb2xsZWN0aW9uRW5kcG9pbnRzOlxuXHRcdGdldDogKGNvbGxlY3Rpb24pIC0+XG5cdFx0XHRnZXQ6XG5cdFx0XHRcdGFjdGlvbjogLT5cblx0XHRcdFx0XHRlbnRpdHkgPSBjb2xsZWN0aW9uLmZpbmRPbmUgQHVybFBhcmFtcy5pZCwgZmllbGRzOiBwcm9maWxlOiAxXG5cdFx0XHRcdFx0aWYgZW50aXR5XG5cdFx0XHRcdFx0XHR7c3RhdHVzOiAnc3VjY2VzcycsIGRhdGE6IGVudGl0eX1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDRcblx0XHRcdFx0XHRcdGJvZHk6IHtzdGF0dXM6ICdmYWlsJywgbWVzc2FnZTogJ1VzZXIgbm90IGZvdW5kJ31cblx0XHRwdXQ6IChjb2xsZWN0aW9uKSAtPlxuXHRcdFx0cHV0OlxuXHRcdFx0XHRhY3Rpb246IC0+XG5cdFx0XHRcdFx0ZW50aXR5SXNVcGRhdGVkID0gY29sbGVjdGlvbi51cGRhdGUgQHVybFBhcmFtcy5pZCwgJHNldDogcHJvZmlsZTogQGJvZHlQYXJhbXNcblx0XHRcdFx0XHRpZiBlbnRpdHlJc1VwZGF0ZWRcblx0XHRcdFx0XHRcdGVudGl0eSA9IGNvbGxlY3Rpb24uZmluZE9uZSBAdXJsUGFyYW1zLmlkLCBmaWVsZHM6IHByb2ZpbGU6IDFcblx0XHRcdFx0XHRcdHtzdGF0dXM6IFwic3VjY2Vzc1wiLCBkYXRhOiBlbnRpdHl9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XG5cdFx0XHRcdFx0XHRib2R5OiB7c3RhdHVzOiAnZmFpbCcsIG1lc3NhZ2U6ICdVc2VyIG5vdCBmb3VuZCd9XG5cdFx0ZGVsZXRlOiAoY29sbGVjdGlvbikgLT5cblx0XHRcdGRlbGV0ZTpcblx0XHRcdFx0YWN0aW9uOiAtPlxuXHRcdFx0XHRcdGlmIGNvbGxlY3Rpb24ucmVtb3ZlIEB1cmxQYXJhbXMuaWRcblx0XHRcdFx0XHRcdHtzdGF0dXM6ICdzdWNjZXNzJywgZGF0YTogbWVzc2FnZTogJ1VzZXIgcmVtb3ZlZCd9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XG5cdFx0XHRcdFx0XHRib2R5OiB7c3RhdHVzOiAnZmFpbCcsIG1lc3NhZ2U6ICdVc2VyIG5vdCBmb3VuZCd9XG5cdFx0cG9zdDogKGNvbGxlY3Rpb24pIC0+XG5cdFx0XHRwb3N0OlxuXHRcdFx0XHRhY3Rpb246IC0+XG5cdFx0XHRcdFx0IyBDcmVhdGUgYSBuZXcgdXNlciBhY2NvdW50XG5cdFx0XHRcdFx0ZW50aXR5SWQgPSBBY2NvdW50cy5jcmVhdGVVc2VyIEBib2R5UGFyYW1zXG5cdFx0XHRcdFx0ZW50aXR5ID0gY29sbGVjdGlvbi5maW5kT25lIGVudGl0eUlkLCBmaWVsZHM6IHByb2ZpbGU6IDFcblx0XHRcdFx0XHRpZiBlbnRpdHlcblx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDIwMVxuXHRcdFx0XHRcdFx0Ym9keToge3N0YXR1czogJ3N1Y2Nlc3MnLCBkYXRhOiBlbnRpdHl9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDAwXG5cdFx0XHRcdFx0XHR7c3RhdHVzOiAnZmFpbCcsIG1lc3NhZ2U6ICdObyB1c2VyIGFkZGVkJ31cblx0XHRnZXRBbGw6IChjb2xsZWN0aW9uKSAtPlxuXHRcdFx0Z2V0OlxuXHRcdFx0XHRhY3Rpb246IC0+XG5cdFx0XHRcdFx0ZW50aXRpZXMgPSBjb2xsZWN0aW9uLmZpbmQoe30sIGZpZWxkczogcHJvZmlsZTogMSkuZmV0Y2goKVxuXHRcdFx0XHRcdGlmIGVudGl0aWVzXG5cdFx0XHRcdFx0XHR7c3RhdHVzOiAnc3VjY2VzcycsIGRhdGE6IGVudGl0aWVzfVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxuXHRcdFx0XHRcdFx0Ym9keToge3N0YXR1czogJ2ZhaWwnLCBtZXNzYWdlOiAnVW5hYmxlIHRvIHJldHJpZXZlIHVzZXJzJ31cblxuXG5cdCMjI1xuXHRcdEFkZCAvbG9naW4gYW5kIC9sb2dvdXQgZW5kcG9pbnRzIHRvIHRoZSBBUElcblx0IyMjXG5cdF9pbml0QXV0aDogLT5cblx0XHRzZWxmID0gdGhpc1xuXHRcdCMjI1xuXHRcdFx0QWRkIGEgbG9naW4gZW5kcG9pbnQgdG8gdGhlIEFQSVxuXG5cdFx0XHRBZnRlciB0aGUgdXNlciBpcyBsb2dnZWQgaW4sIHRoZSBvbkxvZ2dlZEluIGhvb2sgaXMgY2FsbGVkIChzZWUgUmVzdGZ1bGx5LmNvbmZpZ3VyZSgpIGZvclxuXHRcdFx0YWRkaW5nIGhvb2spLlxuXHRcdCMjI1xuXHRcdEBhZGRSb3V0ZSAnbG9naW4nLCB7YXV0aFJlcXVpcmVkOiBmYWxzZX0sXG5cdFx0XHRwb3N0OiAtPlxuXHRcdFx0XHQjIEdyYWIgdGhlIHVzZXJuYW1lIG9yIGVtYWlsIHRoYXQgdGhlIHVzZXIgaXMgbG9nZ2luZyBpbiB3aXRoXG5cdFx0XHRcdHVzZXIgPSB7fVxuXHRcdFx0XHRpZiBAYm9keVBhcmFtcy51c2VyXG5cdFx0XHRcdFx0aWYgQGJvZHlQYXJhbXMudXNlci5pbmRleE9mKCdAJykgaXMgLTFcblx0XHRcdFx0XHRcdHVzZXIudXNlcm5hbWUgPSBAYm9keVBhcmFtcy51c2VyXG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0dXNlci5lbWFpbCA9IEBib2R5UGFyYW1zLnVzZXJcblx0XHRcdFx0ZWxzZSBpZiBAYm9keVBhcmFtcy51c2VybmFtZVxuXHRcdFx0XHRcdHVzZXIudXNlcm5hbWUgPSBAYm9keVBhcmFtcy51c2VybmFtZVxuXHRcdFx0XHRlbHNlIGlmIEBib2R5UGFyYW1zLmVtYWlsXG5cdFx0XHRcdFx0dXNlci5lbWFpbCA9IEBib2R5UGFyYW1zLmVtYWlsXG5cblx0XHRcdFx0IyBUcnkgdG8gbG9nIHRoZSB1c2VyIGludG8gdGhlIHVzZXIncyBhY2NvdW50IChpZiBzdWNjZXNzZnVsIHdlJ2xsIGdldCBhbiBhdXRoIHRva2VuIGJhY2spXG5cdFx0XHRcdHRyeVxuXHRcdFx0XHRcdGF1dGggPSBBdXRoLmxvZ2luV2l0aFBhc3N3b3JkIHVzZXIsIEBib2R5UGFyYW1zLnBhc3N3b3JkXG5cdFx0XHRcdGNhdGNoIGVcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yIGVcblx0XHRcdFx0XHRyZXR1cm4ge30gPVxuXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogZS5lcnJvclxuXHRcdFx0XHRcdFx0Ym9keTogc3RhdHVzOiAnZXJyb3InLCBtZXNzYWdlOiBlLnJlYXNvblxuXG5cdFx0XHRcdCMgR2V0IHRoZSBhdXRoZW50aWNhdGVkIHVzZXJcblx0XHRcdFx0IyBUT0RPOiBDb25zaWRlciByZXR1cm5pbmcgdGhlIHVzZXIgaW4gQXV0aC5sb2dpbldpdGhQYXNzd29yZCgpLCBpbnN0ZWFkIG9mIGZldGNoaW5nIGl0IGFnYWluIGhlcmVcblx0XHRcdFx0aWYgYXV0aC51c2VySWQgYW5kIGF1dGguYXV0aFRva2VuXG5cdFx0XHRcdFx0c2VhcmNoUXVlcnkgPSB7fVxuXHRcdFx0XHRcdHNlYXJjaFF1ZXJ5W3NlbGYuX2NvbmZpZy5hdXRoLnRva2VuXSA9IEFjY291bnRzLl9oYXNoTG9naW5Ub2tlbiBhdXRoLmF1dGhUb2tlblxuXHRcdFx0XHRcdEB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmVcblx0XHRcdFx0XHRcdCdfaWQnOiBhdXRoLnVzZXJJZFxuXHRcdFx0XHRcdFx0c2VhcmNoUXVlcnlcblx0XHRcdFx0XHRAdXNlcklkID0gQHVzZXI/Ll9pZFxuXG5cdFx0XHRcdHJlc3BvbnNlID0ge3N0YXR1czogJ3N1Y2Nlc3MnLCBkYXRhOiBhdXRofVxuXG5cdFx0XHRcdCMgQ2FsbCB0aGUgbG9naW4gaG9vayB3aXRoIHRoZSBhdXRoZW50aWNhdGVkIHVzZXIgYXR0YWNoZWRcblx0XHRcdFx0ZXh0cmFEYXRhID0gc2VsZi5fY29uZmlnLm9uTG9nZ2VkSW4/LmNhbGwodGhpcylcblx0XHRcdFx0aWYgZXh0cmFEYXRhP1xuXHRcdFx0XHRcdF8uZXh0ZW5kKHJlc3BvbnNlLmRhdGEsIHtleHRyYTogZXh0cmFEYXRhfSlcblxuXHRcdFx0XHRyZXNwb25zZVxuXG5cdFx0bG9nb3V0ID0gLT5cblx0XHRcdCMgUmVtb3ZlIHRoZSBnaXZlbiBhdXRoIHRva2VuIGZyb20gdGhlIHVzZXIncyBhY2NvdW50XG5cdFx0XHRhdXRoVG9rZW4gPSBAcmVxdWVzdC5oZWFkZXJzWyd4LWF1dGgtdG9rZW4nXVxuXHRcdFx0aGFzaGVkVG9rZW4gPSBBY2NvdW50cy5faGFzaExvZ2luVG9rZW4gYXV0aFRva2VuXG5cdFx0XHR0b2tlbkxvY2F0aW9uID0gc2VsZi5fY29uZmlnLmF1dGgudG9rZW5cblx0XHRcdGluZGV4ID0gdG9rZW5Mb2NhdGlvbi5sYXN0SW5kZXhPZiAnLidcblx0XHRcdHRva2VuUGF0aCA9IHRva2VuTG9jYXRpb24uc3Vic3RyaW5nIDAsIGluZGV4XG5cdFx0XHR0b2tlbkZpZWxkTmFtZSA9IHRva2VuTG9jYXRpb24uc3Vic3RyaW5nIGluZGV4ICsgMVxuXHRcdFx0dG9rZW5Ub1JlbW92ZSA9IHt9XG5cdFx0XHR0b2tlblRvUmVtb3ZlW3Rva2VuRmllbGROYW1lXSA9IGhhc2hlZFRva2VuXG5cdFx0XHR0b2tlblJlbW92YWxRdWVyeSA9IHt9XG5cdFx0XHR0b2tlblJlbW92YWxRdWVyeVt0b2tlblBhdGhdID0gdG9rZW5Ub1JlbW92ZVxuXHRcdFx0TWV0ZW9yLnVzZXJzLnVwZGF0ZSBAdXNlci5faWQsIHskcHVsbDogdG9rZW5SZW1vdmFsUXVlcnl9XG5cblx0XHRcdHJlc3BvbnNlID0ge3N0YXR1czogJ3N1Y2Nlc3MnLCBkYXRhOiB7bWVzc2FnZTogJ1lvdVxcJ3ZlIGJlZW4gbG9nZ2VkIG91dCEnfX1cblxuXHRcdFx0IyBDYWxsIHRoZSBsb2dvdXQgaG9vayB3aXRoIHRoZSBhdXRoZW50aWNhdGVkIHVzZXIgYXR0YWNoZWRcblx0XHRcdGV4dHJhRGF0YSA9IHNlbGYuX2NvbmZpZy5vbkxvZ2dlZE91dD8uY2FsbCh0aGlzKVxuXHRcdFx0aWYgZXh0cmFEYXRhP1xuXHRcdFx0XHRfLmV4dGVuZChyZXNwb25zZS5kYXRhLCB7ZXh0cmE6IGV4dHJhRGF0YX0pXG5cblx0XHRcdHJlc3BvbnNlXG5cblx0XHQjIyNcblx0XHRcdEFkZCBhIGxvZ291dCBlbmRwb2ludCB0byB0aGUgQVBJXG5cblx0XHRcdEFmdGVyIHRoZSB1c2VyIGlzIGxvZ2dlZCBvdXQsIHRoZSBvbkxvZ2dlZE91dCBob29rIGlzIGNhbGxlZCAoc2VlIFJlc3RmdWxseS5jb25maWd1cmUoKSBmb3Jcblx0XHRcdGFkZGluZyBob29rKS5cblx0XHQjIyNcblx0XHRAYWRkUm91dGUgJ2xvZ291dCcsIHthdXRoUmVxdWlyZWQ6IHRydWV9LFxuXHRcdFx0Z2V0OiAtPlxuXHRcdFx0XHRjb25zb2xlLndhcm4gXCJXYXJuaW5nOiBEZWZhdWx0IGxvZ291dCB2aWEgR0VUIHdpbGwgYmUgcmVtb3ZlZCBpbiBSZXN0aXZ1cyB2MS4wLiBVc2UgUE9TVCBpbnN0ZWFkLlwiXG5cdFx0XHRcdGNvbnNvbGUud2FybiBcIiAgICBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2thaG1hbGkvbWV0ZW9yLXJlc3RpdnVzL2lzc3Vlcy8xMDBcIlxuXHRcdFx0XHRyZXR1cm4gbG9nb3V0LmNhbGwodGhpcylcblx0XHRcdHBvc3Q6IGxvZ291dFxuXG5PZGF0YVJlc3RpdnVzID0gQE9kYXRhUmVzdGl2dXNcbiIsInZhciBDb29raWVzLCBPZGF0YVJlc3RpdnVzLCBiYXNpY0F1dGgsXG4gIGluZGV4T2YgPSBbXS5pbmRleE9mIHx8IGZ1bmN0aW9uKGl0ZW0pIHsgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkrKykgeyBpZiAoaSBpbiB0aGlzICYmIHRoaXNbaV0gPT09IGl0ZW0pIHJldHVybiBpOyB9IHJldHVybiAtMTsgfTtcblxuYmFzaWNBdXRoID0gcmVxdWlyZSgnYmFzaWMtYXV0aCcpO1xuXG5Db29raWVzID0gcmVxdWlyZShcImNvb2tpZXNcIik7XG5cbnRoaXMuT2RhdGFSZXN0aXZ1cyA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gT2RhdGFSZXN0aXZ1cyhvcHRpb25zKSB7XG4gICAgdmFyIGNvcnNIZWFkZXJzO1xuICAgIHRoaXMuX3JvdXRlcyA9IFtdO1xuICAgIHRoaXMuX2NvbmZpZyA9IHtcbiAgICAgIHBhdGhzOiBbXSxcbiAgICAgIHVzZURlZmF1bHRBdXRoOiBmYWxzZSxcbiAgICAgIGFwaVBhdGg6ICdhcGkvJyxcbiAgICAgIHZlcnNpb246IG51bGwsXG4gICAgICBwcmV0dHlKc29uOiBmYWxzZSxcbiAgICAgIGF1dGg6IHtcbiAgICAgICAgdG9rZW46ICdzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMuaGFzaGVkVG9rZW4nLFxuICAgICAgICB1c2VyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgX3VzZXIsIGF1dGhUb2tlbiwgY29va2llcywgc3BhY2VJZCwgdG9rZW4sIHVzZXJJZDtcbiAgICAgICAgICBjb29raWVzID0gbmV3IENvb2tpZXModGhpcy5yZXF1ZXN0LCB0aGlzLnJlc3BvbnNlKTtcbiAgICAgICAgICB1c2VySWQgPSB0aGlzLnJlcXVlc3QuaGVhZGVyc1sneC11c2VyLWlkJ10gfHwgY29va2llcy5nZXQoXCJYLVVzZXItSWRcIik7XG4gICAgICAgICAgYXV0aFRva2VuID0gdGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ3gtYXV0aC10b2tlbiddIHx8IGNvb2tpZXMuZ2V0KFwiWC1BdXRoLVRva2VuXCIpO1xuICAgICAgICAgIHNwYWNlSWQgPSB0aGlzLnJlcXVlc3QuaGVhZGVyc1sneC1zcGFjZS1pZCddIHx8IHRoaXMudXJsUGFyYW1zWydzcGFjZUlkJ107XG4gICAgICAgICAgaWYgKGF1dGhUb2tlbikge1xuICAgICAgICAgICAgdG9rZW4gPSBBY2NvdW50cy5faGFzaExvZ2luVG9rZW4oYXV0aFRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRoaXMucmVxdWVzdC51c2VySWQpIHtcbiAgICAgICAgICAgIF91c2VyID0gZGIudXNlcnMuZmluZE9uZSh7XG4gICAgICAgICAgICAgIF9pZDogdGhpcy5yZXF1ZXN0LnVzZXJJZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB1c2VyOiBfdXNlcixcbiAgICAgICAgICAgICAgdXNlcklkOiB1c2VySWQsXG4gICAgICAgICAgICAgIHNwYWNlSWQ6IHNwYWNlSWQsXG4gICAgICAgICAgICAgIHRva2VuOiB0b2tlblxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgdXNlcklkOiB1c2VySWQsXG4gICAgICAgICAgICAgIHNwYWNlSWQ6IHNwYWNlSWQsXG4gICAgICAgICAgICAgIHRva2VuOiB0b2tlblxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBkZWZhdWx0SGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICB9LFxuICAgICAgZW5hYmxlQ29yczogdHJ1ZVxuICAgIH07XG4gICAgXy5leHRlbmQodGhpcy5fY29uZmlnLCBvcHRpb25zKTtcbiAgICBpZiAodGhpcy5fY29uZmlnLmVuYWJsZUNvcnMpIHtcbiAgICAgIGNvcnNIZWFkZXJzID0ge1xuICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxuICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycyc6ICdPcmlnaW4sIFgtUmVxdWVzdGVkLVdpdGgsIENvbnRlbnQtVHlwZSwgQWNjZXB0LCBPRGF0YS1WZXJzaW9uJ1xuICAgICAgfTtcbiAgICAgIGlmICh0aGlzLl9jb25maWcudXNlRGVmYXVsdEF1dGgpIHtcbiAgICAgICAgY29yc0hlYWRlcnNbJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnXSArPSAnLCBYLVVzZXItSWQsIFgtQXV0aC1Ub2tlbiwgWC1TcGFjZS1JZCc7XG4gICAgICB9XG4gICAgICBfLmV4dGVuZCh0aGlzLl9jb25maWcuZGVmYXVsdEhlYWRlcnMsIGNvcnNIZWFkZXJzKTtcbiAgICAgIGlmICghdGhpcy5fY29uZmlnLmRlZmF1bHRPcHRpb25zRW5kcG9pbnQpIHtcbiAgICAgICAgdGhpcy5fY29uZmlnLmRlZmF1bHRPcHRpb25zRW5kcG9pbnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICB0aGlzLnJlc3BvbnNlLndyaXRlSGVhZCgyMDAsIGNvcnNIZWFkZXJzKTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5kb25lKCk7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLl9jb25maWcuYXBpUGF0aFswXSA9PT0gJy8nKSB7XG4gICAgICB0aGlzLl9jb25maWcuYXBpUGF0aCA9IHRoaXMuX2NvbmZpZy5hcGlQYXRoLnNsaWNlKDEpO1xuICAgIH1cbiAgICBpZiAoXy5sYXN0KHRoaXMuX2NvbmZpZy5hcGlQYXRoKSAhPT0gJy8nKSB7XG4gICAgICB0aGlzLl9jb25maWcuYXBpUGF0aCA9IHRoaXMuX2NvbmZpZy5hcGlQYXRoICsgJy8nO1xuICAgIH1cbiAgICBpZiAodGhpcy5fY29uZmlnLnZlcnNpb24pIHtcbiAgICAgIHRoaXMuX2NvbmZpZy5hcGlQYXRoICs9IHRoaXMuX2NvbmZpZy52ZXJzaW9uICsgJy8nO1xuICAgIH1cbiAgICBpZiAodGhpcy5fY29uZmlnLnVzZURlZmF1bHRBdXRoKSB7XG4gICAgICB0aGlzLl9pbml0QXV0aCgpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fY29uZmlnLnVzZUF1dGgpIHtcbiAgICAgIHRoaXMuX2luaXRBdXRoKCk7XG4gICAgICBjb25zb2xlLndhcm4oJ1dhcm5pbmc6IHVzZUF1dGggQVBJIGNvbmZpZyBvcHRpb24gd2lsbCBiZSByZW1vdmVkIGluIFJlc3RpdnVzIHYxLjAgJyArICdcXG4gICAgVXNlIHRoZSB1c2VEZWZhdWx0QXV0aCBvcHRpb24gaW5zdGVhZCcpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG5cbiAgLyoqXG4gIFx0XHRBZGQgZW5kcG9pbnRzIGZvciB0aGUgZ2l2ZW4gSFRUUCBtZXRob2RzIGF0IHRoZSBnaXZlbiBwYXRoXG4gIFxuICBcdFx0QHBhcmFtIHBhdGgge1N0cmluZ30gVGhlIGV4dGVuZGVkIFVSTCBwYXRoICh3aWxsIGJlIGFwcGVuZGVkIHRvIGJhc2UgcGF0aCBvZiB0aGUgQVBJKVxuICBcdFx0QHBhcmFtIG9wdGlvbnMge09iamVjdH0gUm91dGUgY29uZmlndXJhdGlvbiBvcHRpb25zXG4gIFx0XHRAcGFyYW0gb3B0aW9ucy5hdXRoUmVxdWlyZWQge0Jvb2xlYW59IFRoZSBkZWZhdWx0IGF1dGggcmVxdWlyZW1lbnQgZm9yIGVhY2ggZW5kcG9pbnQgb24gdGhlIHJvdXRlXG4gIFx0XHRAcGFyYW0gb3B0aW9ucy5yb2xlUmVxdWlyZWQge1N0cmluZyBvciBTdHJpbmdbXX0gVGhlIGRlZmF1bHQgcm9sZSByZXF1aXJlZCBmb3IgZWFjaCBlbmRwb2ludCBvbiB0aGUgcm91dGVcbiAgXHRcdEBwYXJhbSBlbmRwb2ludHMge09iamVjdH0gQSBzZXQgb2YgZW5kcG9pbnRzIGF2YWlsYWJsZSBvbiB0aGUgbmV3IHJvdXRlIChnZXQsIHBvc3QsIHB1dCwgcGF0Y2gsIGRlbGV0ZSwgb3B0aW9ucylcbiAgXHRcdEBwYXJhbSBlbmRwb2ludHMuPG1ldGhvZD4ge0Z1bmN0aW9uIG9yIE9iamVjdH0gSWYgYSBmdW5jdGlvbiBpcyBwcm92aWRlZCwgYWxsIGRlZmF1bHQgcm91dGVcbiAgXHRcdFx0XHRjb25maWd1cmF0aW9uIG9wdGlvbnMgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbmRwb2ludC4gT3RoZXJ3aXNlIGFuIG9iamVjdCB3aXRoIGFuIGBhY3Rpb25gXG4gIFx0XHRcdFx0YW5kIGFsbCBvdGhlciByb3V0ZSBjb25maWcgb3B0aW9ucyBhdmFpbGFibGUuIEFuIGBhY3Rpb25gIG11c3QgYmUgcHJvdmlkZWQgd2l0aCB0aGUgb2JqZWN0LlxuICAgKi9cblxuICBPZGF0YVJlc3RpdnVzLnByb3RvdHlwZS5hZGRSb3V0ZSA9IGZ1bmN0aW9uKHBhdGgsIG9wdGlvbnMsIGVuZHBvaW50cykge1xuICAgIHZhciByb3V0ZTtcbiAgICByb3V0ZSA9IG5ldyBzaGFyZS5Sb3V0ZSh0aGlzLCBwYXRoLCBvcHRpb25zLCBlbmRwb2ludHMpO1xuICAgIHRoaXMuX3JvdXRlcy5wdXNoKHJvdXRlKTtcbiAgICByb3V0ZS5hZGRUb0FwaSgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG5cbiAgLyoqXG4gIFx0XHRHZW5lcmF0ZSByb3V0ZXMgZm9yIHRoZSBNZXRlb3IgQ29sbGVjdGlvbiB3aXRoIHRoZSBnaXZlbiBuYW1lXG4gICAqL1xuXG4gIE9kYXRhUmVzdGl2dXMucHJvdG90eXBlLmFkZENvbGxlY3Rpb24gPSBmdW5jdGlvbihjb2xsZWN0aW9uLCBvcHRpb25zKSB7XG4gICAgdmFyIGNvbGxlY3Rpb25FbmRwb2ludHMsIGNvbGxlY3Rpb25Sb3V0ZUVuZHBvaW50cywgZW5kcG9pbnRzQXdhaXRpbmdDb25maWd1cmF0aW9uLCBlbnRpdHlSb3V0ZUVuZHBvaW50cywgZXhjbHVkZWRFbmRwb2ludHMsIG1ldGhvZHMsIG1ldGhvZHNPbkNvbGxlY3Rpb24sIHBhdGgsIHJvdXRlT3B0aW9ucztcbiAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XG4gICAgICBvcHRpb25zID0ge307XG4gICAgfVxuICAgIG1ldGhvZHMgPSBbJ2dldCcsICdwb3N0JywgJ3B1dCcsICdkZWxldGUnLCAnZ2V0QWxsJ107XG4gICAgbWV0aG9kc09uQ29sbGVjdGlvbiA9IFsncG9zdCcsICdnZXRBbGwnXTtcbiAgICBpZiAoY29sbGVjdGlvbiA9PT0gTWV0ZW9yLnVzZXJzKSB7XG4gICAgICBjb2xsZWN0aW9uRW5kcG9pbnRzID0gdGhpcy5fdXNlckNvbGxlY3Rpb25FbmRwb2ludHM7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbGxlY3Rpb25FbmRwb2ludHMgPSB0aGlzLl9jb2xsZWN0aW9uRW5kcG9pbnRzO1xuICAgIH1cbiAgICBlbmRwb2ludHNBd2FpdGluZ0NvbmZpZ3VyYXRpb24gPSBvcHRpb25zLmVuZHBvaW50cyB8fCB7fTtcbiAgICByb3V0ZU9wdGlvbnMgPSBvcHRpb25zLnJvdXRlT3B0aW9ucyB8fCB7fTtcbiAgICBleGNsdWRlZEVuZHBvaW50cyA9IG9wdGlvbnMuZXhjbHVkZWRFbmRwb2ludHMgfHwgW107XG4gICAgcGF0aCA9IG9wdGlvbnMucGF0aCB8fCBjb2xsZWN0aW9uLl9uYW1lO1xuICAgIGNvbGxlY3Rpb25Sb3V0ZUVuZHBvaW50cyA9IHt9O1xuICAgIGVudGl0eVJvdXRlRW5kcG9pbnRzID0ge307XG4gICAgaWYgKF8uaXNFbXB0eShlbmRwb2ludHNBd2FpdGluZ0NvbmZpZ3VyYXRpb24pICYmIF8uaXNFbXB0eShleGNsdWRlZEVuZHBvaW50cykpIHtcbiAgICAgIF8uZWFjaChtZXRob2RzLCBmdW5jdGlvbihtZXRob2QpIHtcbiAgICAgICAgaWYgKGluZGV4T2YuY2FsbChtZXRob2RzT25Db2xsZWN0aW9uLCBtZXRob2QpID49IDApIHtcbiAgICAgICAgICBfLmV4dGVuZChjb2xsZWN0aW9uUm91dGVFbmRwb2ludHMsIGNvbGxlY3Rpb25FbmRwb2ludHNbbWV0aG9kXS5jYWxsKHRoaXMsIGNvbGxlY3Rpb24pKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfLmV4dGVuZChlbnRpdHlSb3V0ZUVuZHBvaW50cywgY29sbGVjdGlvbkVuZHBvaW50c1ttZXRob2RdLmNhbGwodGhpcywgY29sbGVjdGlvbikpO1xuICAgICAgICB9XG4gICAgICB9LCB0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgXy5lYWNoKG1ldGhvZHMsIGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgICAgICB2YXIgY29uZmlndXJlZEVuZHBvaW50LCBlbmRwb2ludE9wdGlvbnM7XG4gICAgICAgIGlmIChpbmRleE9mLmNhbGwoZXhjbHVkZWRFbmRwb2ludHMsIG1ldGhvZCkgPCAwICYmIGVuZHBvaW50c0F3YWl0aW5nQ29uZmlndXJhdGlvblttZXRob2RdICE9PSBmYWxzZSkge1xuICAgICAgICAgIGVuZHBvaW50T3B0aW9ucyA9IGVuZHBvaW50c0F3YWl0aW5nQ29uZmlndXJhdGlvblttZXRob2RdO1xuICAgICAgICAgIGNvbmZpZ3VyZWRFbmRwb2ludCA9IHt9O1xuICAgICAgICAgIF8uZWFjaChjb2xsZWN0aW9uRW5kcG9pbnRzW21ldGhvZF0uY2FsbCh0aGlzLCBjb2xsZWN0aW9uKSwgZnVuY3Rpb24oYWN0aW9uLCBtZXRob2RUeXBlKSB7XG4gICAgICAgICAgICByZXR1cm4gY29uZmlndXJlZEVuZHBvaW50W21ldGhvZFR5cGVdID0gXy5jaGFpbihhY3Rpb24pLmNsb25lKCkuZXh0ZW5kKGVuZHBvaW50T3B0aW9ucykudmFsdWUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAoaW5kZXhPZi5jYWxsKG1ldGhvZHNPbkNvbGxlY3Rpb24sIG1ldGhvZCkgPj0gMCkge1xuICAgICAgICAgICAgXy5leHRlbmQoY29sbGVjdGlvblJvdXRlRW5kcG9pbnRzLCBjb25maWd1cmVkRW5kcG9pbnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfLmV4dGVuZChlbnRpdHlSb3V0ZUVuZHBvaW50cywgY29uZmlndXJlZEVuZHBvaW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sIHRoaXMpO1xuICAgIH1cbiAgICB0aGlzLmFkZFJvdXRlKHBhdGgsIHJvdXRlT3B0aW9ucywgY29sbGVjdGlvblJvdXRlRW5kcG9pbnRzKTtcbiAgICB0aGlzLmFkZFJvdXRlKHBhdGggKyBcIi86aWRcIiwgcm91dGVPcHRpb25zLCBlbnRpdHlSb3V0ZUVuZHBvaW50cyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cblxuICAvKipcbiAgXHRcdEEgc2V0IG9mIGVuZHBvaW50cyB0aGF0IGNhbiBiZSBhcHBsaWVkIHRvIGEgQ29sbGVjdGlvbiBSb3V0ZVxuICAgKi9cblxuICBPZGF0YVJlc3RpdnVzLnByb3RvdHlwZS5fY29sbGVjdGlvbkVuZHBvaW50cyA9IHtcbiAgICBnZXQ6IGZ1bmN0aW9uKGNvbGxlY3Rpb24pIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGdldDoge1xuICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZW50aXR5LCBzZWxlY3RvcjtcbiAgICAgICAgICAgIHNlbGVjdG9yID0ge1xuICAgICAgICAgICAgICBfaWQ6IHRoaXMudXJsUGFyYW1zLmlkXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKHRoaXMuc3BhY2VJZCkge1xuICAgICAgICAgICAgICBzZWxlY3Rvci5zcGFjZSA9IHRoaXMuc3BhY2VJZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVudGl0eSA9IGNvbGxlY3Rpb24uZmluZE9uZShzZWxlY3Rvcik7XG4gICAgICAgICAgICBpZiAoZW50aXR5KSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzOiAnc3VjY2VzcycsXG4gICAgICAgICAgICAgICAgZGF0YTogZW50aXR5XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDQwNCxcbiAgICAgICAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICAgICAgICBzdGF0dXM6ICdmYWlsJyxcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdJdGVtIG5vdCBmb3VuZCdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG4gICAgcHV0OiBmdW5jdGlvbihjb2xsZWN0aW9uKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBwdXQ6IHtcbiAgICAgICAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGVudGl0eSwgZW50aXR5SXNVcGRhdGVkLCBzZWxlY3RvcjtcbiAgICAgICAgICAgIHNlbGVjdG9yID0ge1xuICAgICAgICAgICAgICBfaWQ6IHRoaXMudXJsUGFyYW1zLmlkXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKHRoaXMuc3BhY2VJZCkge1xuICAgICAgICAgICAgICBzZWxlY3Rvci5zcGFjZSA9IHRoaXMuc3BhY2VJZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVudGl0eUlzVXBkYXRlZCA9IGNvbGxlY3Rpb24udXBkYXRlKHNlbGVjdG9yLCB7XG4gICAgICAgICAgICAgICRzZXQ6IHRoaXMuYm9keVBhcmFtc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoZW50aXR5SXNVcGRhdGVkKSB7XG4gICAgICAgICAgICAgIGVudGl0eSA9IGNvbGxlY3Rpb24uZmluZE9uZSh0aGlzLnVybFBhcmFtcy5pZCk7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzOiAnc3VjY2VzcycsXG4gICAgICAgICAgICAgICAgZGF0YTogZW50aXR5XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDQwNCxcbiAgICAgICAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICAgICAgICBzdGF0dXM6ICdmYWlsJyxcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdJdGVtIG5vdCBmb3VuZCdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG4gICAgXCJkZWxldGVcIjogZnVuY3Rpb24oY29sbGVjdGlvbikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgXCJkZWxldGVcIjoge1xuICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgc2VsZWN0b3I7XG4gICAgICAgICAgICBzZWxlY3RvciA9IHtcbiAgICAgICAgICAgICAgX2lkOiB0aGlzLnVybFBhcmFtcy5pZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmICh0aGlzLnNwYWNlSWQpIHtcbiAgICAgICAgICAgICAgc2VsZWN0b3Iuc3BhY2UgPSB0aGlzLnNwYWNlSWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY29sbGVjdGlvbi5yZW1vdmUoc2VsZWN0b3IpKSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzOiAnc3VjY2VzcycsXG4gICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0l0ZW0gcmVtb3ZlZCdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDQwNCxcbiAgICAgICAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICAgICAgICBzdGF0dXM6ICdmYWlsJyxcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdJdGVtIG5vdCBmb3VuZCdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG4gICAgcG9zdDogZnVuY3Rpb24oY29sbGVjdGlvbikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcG9zdDoge1xuICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZW50aXR5LCBlbnRpdHlJZDtcbiAgICAgICAgICAgIGlmICh0aGlzLnNwYWNlSWQpIHtcbiAgICAgICAgICAgICAgdGhpcy5ib2R5UGFyYW1zLnNwYWNlID0gdGhpcy5zcGFjZUlkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZW50aXR5SWQgPSBjb2xsZWN0aW9uLmluc2VydCh0aGlzLmJvZHlQYXJhbXMpO1xuICAgICAgICAgICAgZW50aXR5ID0gY29sbGVjdGlvbi5maW5kT25lKGVudGl0eUlkKTtcbiAgICAgICAgICAgIGlmIChlbnRpdHkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiAyMDEsXG4gICAgICAgICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgICAgICAgc3RhdHVzOiAnc3VjY2VzcycsXG4gICAgICAgICAgICAgICAgICBkYXRhOiBlbnRpdHlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDQwMCxcbiAgICAgICAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICAgICAgICBzdGF0dXM6ICdmYWlsJyxcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdObyBpdGVtIGFkZGVkJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcbiAgICBnZXRBbGw6IGZ1bmN0aW9uKGNvbGxlY3Rpb24pIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGdldDoge1xuICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZW50aXRpZXMsIHNlbGVjdG9yO1xuICAgICAgICAgICAgc2VsZWN0b3IgPSB7fTtcbiAgICAgICAgICAgIGlmICh0aGlzLnNwYWNlSWQpIHtcbiAgICAgICAgICAgICAgc2VsZWN0b3Iuc3BhY2UgPSB0aGlzLnNwYWNlSWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbnRpdGllcyA9IGNvbGxlY3Rpb24uZmluZChzZWxlY3RvcikuZmV0Y2goKTtcbiAgICAgICAgICAgIGlmIChlbnRpdGllcykge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXR1czogJ3N1Y2Nlc3MnLFxuICAgICAgICAgICAgICAgIGRhdGE6IGVudGl0aWVzXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDQwNCxcbiAgICAgICAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICAgICAgICBzdGF0dXM6ICdmYWlsJyxcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdVbmFibGUgdG8gcmV0cmlldmUgaXRlbXMgZnJvbSBjb2xsZWN0aW9uJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICB9O1xuXG5cbiAgLyoqXG4gIFx0XHRBIHNldCBvZiBlbmRwb2ludHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0byBhIE1ldGVvci51c2VycyBDb2xsZWN0aW9uIFJvdXRlXG4gICAqL1xuXG4gIE9kYXRhUmVzdGl2dXMucHJvdG90eXBlLl91c2VyQ29sbGVjdGlvbkVuZHBvaW50cyA9IHtcbiAgICBnZXQ6IGZ1bmN0aW9uKGNvbGxlY3Rpb24pIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGdldDoge1xuICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZW50aXR5O1xuICAgICAgICAgICAgZW50aXR5ID0gY29sbGVjdGlvbi5maW5kT25lKHRoaXMudXJsUGFyYW1zLmlkLCB7XG4gICAgICAgICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgICAgIHByb2ZpbGU6IDFcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoZW50aXR5KSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzOiAnc3VjY2VzcycsXG4gICAgICAgICAgICAgICAgZGF0YTogZW50aXR5XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDQwNCxcbiAgICAgICAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICAgICAgICBzdGF0dXM6ICdmYWlsJyxcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdVc2VyIG5vdCBmb3VuZCdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG4gICAgcHV0OiBmdW5jdGlvbihjb2xsZWN0aW9uKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBwdXQ6IHtcbiAgICAgICAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGVudGl0eSwgZW50aXR5SXNVcGRhdGVkO1xuICAgICAgICAgICAgZW50aXR5SXNVcGRhdGVkID0gY29sbGVjdGlvbi51cGRhdGUodGhpcy51cmxQYXJhbXMuaWQsIHtcbiAgICAgICAgICAgICAgJHNldDoge1xuICAgICAgICAgICAgICAgIHByb2ZpbGU6IHRoaXMuYm9keVBhcmFtc1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChlbnRpdHlJc1VwZGF0ZWQpIHtcbiAgICAgICAgICAgICAgZW50aXR5ID0gY29sbGVjdGlvbi5maW5kT25lKHRoaXMudXJsUGFyYW1zLmlkLCB7XG4gICAgICAgICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICAgICAgICBwcm9maWxlOiAxXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0dXM6IFwic3VjY2Vzc1wiLFxuICAgICAgICAgICAgICAgIGRhdGE6IGVudGl0eVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiA0MDQsXG4gICAgICAgICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgICAgICAgc3RhdHVzOiAnZmFpbCcsXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnVXNlciBub3QgZm91bmQnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuICAgIFwiZGVsZXRlXCI6IGZ1bmN0aW9uKGNvbGxlY3Rpb24pIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIFwiZGVsZXRlXCI6IHtcbiAgICAgICAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGNvbGxlY3Rpb24ucmVtb3ZlKHRoaXMudXJsUGFyYW1zLmlkKSkge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXR1czogJ3N1Y2Nlc3MnLFxuICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdVc2VyIHJlbW92ZWQnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiA0MDQsXG4gICAgICAgICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgICAgICAgc3RhdHVzOiAnZmFpbCcsXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnVXNlciBub3QgZm91bmQnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuICAgIHBvc3Q6IGZ1bmN0aW9uKGNvbGxlY3Rpb24pIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBvc3Q6IHtcbiAgICAgICAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGVudGl0eSwgZW50aXR5SWQ7XG4gICAgICAgICAgICBlbnRpdHlJZCA9IEFjY291bnRzLmNyZWF0ZVVzZXIodGhpcy5ib2R5UGFyYW1zKTtcbiAgICAgICAgICAgIGVudGl0eSA9IGNvbGxlY3Rpb24uZmluZE9uZShlbnRpdHlJZCwge1xuICAgICAgICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgICAgICBwcm9maWxlOiAxXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGVudGl0eSkge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDIwMSxcbiAgICAgICAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICAgICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcbiAgICAgICAgICAgICAgICAgIGRhdGE6IGVudGl0eVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICh7XG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogNDAwXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXR1czogJ2ZhaWwnLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdObyB1c2VyIGFkZGVkJ1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuICAgIGdldEFsbDogZnVuY3Rpb24oY29sbGVjdGlvbikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0OiB7XG4gICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBlbnRpdGllcztcbiAgICAgICAgICAgIGVudGl0aWVzID0gY29sbGVjdGlvbi5maW5kKHt9LCB7XG4gICAgICAgICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgICAgIHByb2ZpbGU6IDFcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuZmV0Y2goKTtcbiAgICAgICAgICAgIGlmIChlbnRpdGllcykge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXR1czogJ3N1Y2Nlc3MnLFxuICAgICAgICAgICAgICAgIGRhdGE6IGVudGl0aWVzXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDQwNCxcbiAgICAgICAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICAgICAgICBzdGF0dXM6ICdmYWlsJyxcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdVbmFibGUgdG8gcmV0cmlldmUgdXNlcnMnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gIH07XG5cblxuICAvKlxuICBcdFx0QWRkIC9sb2dpbiBhbmQgL2xvZ291dCBlbmRwb2ludHMgdG8gdGhlIEFQSVxuICAgKi9cblxuICBPZGF0YVJlc3RpdnVzLnByb3RvdHlwZS5faW5pdEF1dGggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbG9nb3V0LCBzZWxmO1xuICAgIHNlbGYgPSB0aGlzO1xuXG4gICAgLypcbiAgICBcdFx0XHRBZGQgYSBsb2dpbiBlbmRwb2ludCB0byB0aGUgQVBJXG4gICAgXG4gICAgXHRcdFx0QWZ0ZXIgdGhlIHVzZXIgaXMgbG9nZ2VkIGluLCB0aGUgb25Mb2dnZWRJbiBob29rIGlzIGNhbGxlZCAoc2VlIFJlc3RmdWxseS5jb25maWd1cmUoKSBmb3JcbiAgICBcdFx0XHRhZGRpbmcgaG9vaykuXG4gICAgICovXG4gICAgdGhpcy5hZGRSb3V0ZSgnbG9naW4nLCB7XG4gICAgICBhdXRoUmVxdWlyZWQ6IGZhbHNlXG4gICAgfSwge1xuICAgICAgcG9zdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhdXRoLCBlLCBleHRyYURhdGEsIHJlZiwgcmVmMSwgcmVzcG9uc2UsIHNlYXJjaFF1ZXJ5LCB1c2VyO1xuICAgICAgICB1c2VyID0ge307XG4gICAgICAgIGlmICh0aGlzLmJvZHlQYXJhbXMudXNlcikge1xuICAgICAgICAgIGlmICh0aGlzLmJvZHlQYXJhbXMudXNlci5pbmRleE9mKCdAJykgPT09IC0xKSB7XG4gICAgICAgICAgICB1c2VyLnVzZXJuYW1lID0gdGhpcy5ib2R5UGFyYW1zLnVzZXI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHVzZXIuZW1haWwgPSB0aGlzLmJvZHlQYXJhbXMudXNlcjtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5ib2R5UGFyYW1zLnVzZXJuYW1lKSB7XG4gICAgICAgICAgdXNlci51c2VybmFtZSA9IHRoaXMuYm9keVBhcmFtcy51c2VybmFtZTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmJvZHlQYXJhbXMuZW1haWwpIHtcbiAgICAgICAgICB1c2VyLmVtYWlsID0gdGhpcy5ib2R5UGFyYW1zLmVtYWlsO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXV0aCA9IEF1dGgubG9naW5XaXRoUGFzc3dvcmQodXNlciwgdGhpcy5ib2R5UGFyYW1zLnBhc3N3b3JkKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBlID0gZXJyb3I7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhdHVzQ29kZTogZS5lcnJvcixcbiAgICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgICAgc3RhdHVzOiAnZXJyb3InLFxuICAgICAgICAgICAgICBtZXNzYWdlOiBlLnJlYXNvblxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGF1dGgudXNlcklkICYmIGF1dGguYXV0aFRva2VuKSB7XG4gICAgICAgICAgc2VhcmNoUXVlcnkgPSB7fTtcbiAgICAgICAgICBzZWFyY2hRdWVyeVtzZWxmLl9jb25maWcuYXV0aC50b2tlbl0gPSBBY2NvdW50cy5faGFzaExvZ2luVG9rZW4oYXV0aC5hdXRoVG9rZW4pO1xuICAgICAgICAgIHRoaXMudXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHtcbiAgICAgICAgICAgICdfaWQnOiBhdXRoLnVzZXJJZFxuICAgICAgICAgIH0sIHNlYXJjaFF1ZXJ5KTtcbiAgICAgICAgICB0aGlzLnVzZXJJZCA9IChyZWYgPSB0aGlzLnVzZXIpICE9IG51bGwgPyByZWYuX2lkIDogdm9pZCAwO1xuICAgICAgICB9XG4gICAgICAgIHJlc3BvbnNlID0ge1xuICAgICAgICAgIHN0YXR1czogJ3N1Y2Nlc3MnLFxuICAgICAgICAgIGRhdGE6IGF1dGhcbiAgICAgICAgfTtcbiAgICAgICAgZXh0cmFEYXRhID0gKHJlZjEgPSBzZWxmLl9jb25maWcub25Mb2dnZWRJbikgIT0gbnVsbCA/IHJlZjEuY2FsbCh0aGlzKSA6IHZvaWQgMDtcbiAgICAgICAgaWYgKGV4dHJhRGF0YSAhPSBudWxsKSB7XG4gICAgICAgICAgXy5leHRlbmQocmVzcG9uc2UuZGF0YSwge1xuICAgICAgICAgICAgZXh0cmE6IGV4dHJhRGF0YVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBsb2dvdXQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhdXRoVG9rZW4sIGV4dHJhRGF0YSwgaGFzaGVkVG9rZW4sIGluZGV4LCByZWYsIHJlc3BvbnNlLCB0b2tlbkZpZWxkTmFtZSwgdG9rZW5Mb2NhdGlvbiwgdG9rZW5QYXRoLCB0b2tlblJlbW92YWxRdWVyeSwgdG9rZW5Ub1JlbW92ZTtcbiAgICAgIGF1dGhUb2tlbiA9IHRoaXMucmVxdWVzdC5oZWFkZXJzWyd4LWF1dGgtdG9rZW4nXTtcbiAgICAgIGhhc2hlZFRva2VuID0gQWNjb3VudHMuX2hhc2hMb2dpblRva2VuKGF1dGhUb2tlbik7XG4gICAgICB0b2tlbkxvY2F0aW9uID0gc2VsZi5fY29uZmlnLmF1dGgudG9rZW47XG4gICAgICBpbmRleCA9IHRva2VuTG9jYXRpb24ubGFzdEluZGV4T2YoJy4nKTtcbiAgICAgIHRva2VuUGF0aCA9IHRva2VuTG9jYXRpb24uc3Vic3RyaW5nKDAsIGluZGV4KTtcbiAgICAgIHRva2VuRmllbGROYW1lID0gdG9rZW5Mb2NhdGlvbi5zdWJzdHJpbmcoaW5kZXggKyAxKTtcbiAgICAgIHRva2VuVG9SZW1vdmUgPSB7fTtcbiAgICAgIHRva2VuVG9SZW1vdmVbdG9rZW5GaWVsZE5hbWVdID0gaGFzaGVkVG9rZW47XG4gICAgICB0b2tlblJlbW92YWxRdWVyeSA9IHt9O1xuICAgICAgdG9rZW5SZW1vdmFsUXVlcnlbdG9rZW5QYXRoXSA9IHRva2VuVG9SZW1vdmU7XG4gICAgICBNZXRlb3IudXNlcnMudXBkYXRlKHRoaXMudXNlci5faWQsIHtcbiAgICAgICAgJHB1bGw6IHRva2VuUmVtb3ZhbFF1ZXJ5XG4gICAgICB9KTtcbiAgICAgIHJlc3BvbnNlID0ge1xuICAgICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIG1lc3NhZ2U6ICdZb3VcXCd2ZSBiZWVuIGxvZ2dlZCBvdXQhJ1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgZXh0cmFEYXRhID0gKHJlZiA9IHNlbGYuX2NvbmZpZy5vbkxvZ2dlZE91dCkgIT0gbnVsbCA/IHJlZi5jYWxsKHRoaXMpIDogdm9pZCAwO1xuICAgICAgaWYgKGV4dHJhRGF0YSAhPSBudWxsKSB7XG4gICAgICAgIF8uZXh0ZW5kKHJlc3BvbnNlLmRhdGEsIHtcbiAgICAgICAgICBleHRyYTogZXh0cmFEYXRhXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH07XG5cbiAgICAvKlxuICAgIFx0XHRcdEFkZCBhIGxvZ291dCBlbmRwb2ludCB0byB0aGUgQVBJXG4gICAgXG4gICAgXHRcdFx0QWZ0ZXIgdGhlIHVzZXIgaXMgbG9nZ2VkIG91dCwgdGhlIG9uTG9nZ2VkT3V0IGhvb2sgaXMgY2FsbGVkIChzZWUgUmVzdGZ1bGx5LmNvbmZpZ3VyZSgpIGZvclxuICAgIFx0XHRcdGFkZGluZyBob29rKS5cbiAgICAgKi9cbiAgICByZXR1cm4gdGhpcy5hZGRSb3V0ZSgnbG9nb3V0Jywge1xuICAgICAgYXV0aFJlcXVpcmVkOiB0cnVlXG4gICAgfSwge1xuICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiV2FybmluZzogRGVmYXVsdCBsb2dvdXQgdmlhIEdFVCB3aWxsIGJlIHJlbW92ZWQgaW4gUmVzdGl2dXMgdjEuMC4gVXNlIFBPU1QgaW5zdGVhZC5cIik7XG4gICAgICAgIGNvbnNvbGUud2FybihcIiAgICBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2thaG1hbGkvbWV0ZW9yLXJlc3RpdnVzL2lzc3Vlcy8xMDBcIik7XG4gICAgICAgIHJldHVybiBsb2dvdXQuY2FsbCh0aGlzKTtcbiAgICAgIH0sXG4gICAgICBwb3N0OiBsb2dvdXRcbiAgICB9KTtcbiAgfTtcblxuICByZXR1cm4gT2RhdGFSZXN0aXZ1cztcblxufSkoKTtcblxuT2RhdGFSZXN0aXZ1cyA9IHRoaXMuT2RhdGFSZXN0aXZ1cztcbiIsIk1ldGVvci5zdGFydHVwIC0+XG5cblx0Z2V0T2JqZWN0cyA9IChzcGFjZUlkLCB1c2VySWQsIG9iamVjdF9uYW1lcyktPlxuXHRcdGRhdGEgPSB7fVxuXHRcdG9iamVjdF9uYW1lcy5zcGxpdCgnLCcpLmZvckVhY2ggKG9iamVjdF9uYW1lKS0+XG5cdFx0XHRvYmplY3QgPSBnZXRPYmplY3Qoc3BhY2VJZCwgdXNlcklkLCBvYmplY3RfbmFtZSlcblx0XHRcdGRhdGFbb2JqZWN0Lm5hbWVdID0gb2JqZWN0XG5cdFx0cmV0dXJuIGRhdGE7XG5cblx0Z2V0T2JqZWN0ID0gKHNwYWNlSWQsIHVzZXJJZCwgb2JqZWN0X25hbWUpLT5cblx0XHRkYXRhID0gXy5jbG9uZShDcmVhdG9yLk9iamVjdHNbQ3JlYXRvci5nZXRPYmplY3ROYW1lKENyZWF0b3IuZ2V0T2JqZWN0KG9iamVjdF9uYW1lLCBzcGFjZUlkKSldKVxuXHRcdGlmICFkYXRhXG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCLml6DmlYjnmoRpZCAje29iamVjdF9uYW1lfVwiKVxuXG5cdFx0cHNldHNBZG1pbiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInBlcm1pc3Npb25fc2V0XCIpLmZpbmRPbmUoe3NwYWNlOiBzcGFjZUlkLCBuYW1lOiAnYWRtaW4nfSwge2ZpZWxkczp7X2lkOjEsIGFzc2lnbmVkX2FwcHM6MX19KVxuXHRcdHBzZXRzVXNlciA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInBlcm1pc3Npb25fc2V0XCIpLmZpbmRPbmUoe3NwYWNlOiBzcGFjZUlkLCBuYW1lOiAndXNlcid9LCB7ZmllbGRzOntfaWQ6MSwgYXNzaWduZWRfYXBwczoxfX0pXG5cdFx0cHNldHNDdXJyZW50ID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwicGVybWlzc2lvbl9zZXRcIikuZmluZCh7dXNlcnM6IHVzZXJJZCwgc3BhY2U6IHNwYWNlSWR9LCB7ZmllbGRzOntfaWQ6MSwgYXNzaWduZWRfYXBwczoxfX0pLmZldGNoKClcblx0XHRwc2V0cyA9IHsgcHNldHNBZG1pbiwgcHNldHNVc2VyLCBwc2V0c0N1cnJlbnQgfVxuXG5cdFx0b2JqZWN0X3Blcm1pc3Npb25zID0gQ3JlYXRvci5nZXRPYmplY3RQZXJtaXNzaW9ucy5iaW5kKHBzZXRzKShzcGFjZUlkLCB1c2VySWQsIG9iamVjdF9uYW1lKVxuXG5cdFx0ZGVsZXRlIGRhdGEubGlzdF92aWV3c1xuXHRcdGRlbGV0ZSBkYXRhLnBlcm1pc3Npb25fc2V0XG5cblx0XHRpZiBvYmplY3RfcGVybWlzc2lvbnMuYWxsb3dSZWFkXG5cdFx0XHRkYXRhLmFsbG93UmVhZCA9IHRydWVcblx0XHRcdGRhdGEuYWxsb3dFZGl0ID0gb2JqZWN0X3Blcm1pc3Npb25zLmFsbG93RWRpdFxuXHRcdFx0ZGF0YS5hbGxvd0RlbGV0ZSA9IG9iamVjdF9wZXJtaXNzaW9ucy5hbGxvd0RlbGV0ZVxuXHRcdFx0ZGF0YS5hbGxvd0NyZWF0ZSA9IG9iamVjdF9wZXJtaXNzaW9ucy5hbGxvd0NyZWF0ZVxuXHRcdFx0ZGF0YS5tb2RpZnlBbGxSZWNvcmRzID0gb2JqZWN0X3Blcm1pc3Npb25zLm1vZGlmeUFsbFJlY29yZHNcblxuXHRcdFx0ZmllbGRzID0ge31cblx0XHRcdF8uZm9yRWFjaCBkYXRhLmZpZWxkcywgKGZpZWxkLCBrZXkpLT5cblx0XHRcdFx0X2ZpZWxkID0gXy5jbG9uZShmaWVsZClcblxuXHRcdFx0XHRpZiAhX2ZpZWxkLm5hbWVcblx0XHRcdFx0XHRfZmllbGQubmFtZSA9IGtleVxuXG5cdFx0XHRcdCPlsIbkuI3lj6/nvJbovpHnmoTlrZfmrrXorr7nva7kuLpyZWFkb25seSA9IHRydWVcblx0XHRcdFx0aWYgKF8uaW5kZXhPZihvYmplY3RfcGVybWlzc2lvbnMudW5lZGl0YWJsZV9maWVsZHMsIF9maWVsZC5uYW1lKSA+IC0xKVxuXHRcdFx0XHRcdF9maWVsZC5yZWFkb25seSA9IHRydWVcblxuXHRcdFx0XHQj5LiN6L+U5Zue5LiN5Y+v6KeB5a2X5q61XG5cdFx0XHRcdGlmIChfLmluZGV4T2Yob2JqZWN0X3Blcm1pc3Npb25zLnVucmVhZGFibGVfZmllbGRzLCBfZmllbGQubmFtZSkgPCAwKVxuXHRcdFx0XHRcdGZpZWxkc1trZXldID0gX2ZpZWxkXG5cblx0XHRcdGRhdGEuZmllbGRzID0gZmllbGRzXG5cblx0XHRlbHNlXG5cdFx0XHRkYXRhLmFsbG93UmVhZCA9IGZhbHNlXG5cblx0XHRyZXR1cm4gZGF0YVxuXG5cdEpzb25Sb3V0ZXMuYWRkICdnZXQnLCBTdGVlZG9zT0RhdGEuQVBJX1BBVEggKyAnL29iamVjdHMvOmlkJywgKHJlcSwgcmVzLCBuZXh0KSAtPlxuXHRcdHRyeVxuXHRcdFx0dXNlcklkID0gU3RlZWRvcy5nZXRVc2VySWRGcm9tQXV0aFRva2VuKHJlcSwgcmVzKTtcblx0XHRcdGlmICF1c2VySWRcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwiTm8gcGVybWlzc2lvblwiKVxuXG5cdFx0XHRzcGFjZUlkID0gcmVxLnBhcmFtcz8uc3BhY2VJZFxuXHRcdFx0aWYgIXNwYWNlSWRcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwiTWlzcyBzcGFjZUlkXCIpXG5cblx0XHRcdG9iamVjdF9uYW1lID0gcmVxLnBhcmFtcz8uaWRcblx0XHRcdGlmICFvYmplY3RfbmFtZVxuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCJNaXNzIGlkXCIpXG5cblx0XHRcdF9vYmogPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJvYmplY3RzXCIpLmZpbmRPbmUoe19pZDogb2JqZWN0X25hbWV9KVxuXG5cdFx0XHRpZiBfb2JqICYmIF9vYmoubmFtZVxuXHRcdFx0XHRvYmplY3RfbmFtZSA9IF9vYmoubmFtZVxuXG5cdFx0XHRpZiBvYmplY3RfbmFtZS5zcGxpdCgnLCcpLmxlbmd0aCA+IDFcblx0XHRcdFx0ZGF0YSA9IGdldE9iamVjdHMoc3BhY2VJZCwgdXNlcklkLCBvYmplY3RfbmFtZSlcblx0XHRcdGVsc2Vcblx0XHRcdFx0ZGF0YSA9IGdldE9iamVjdChzcGFjZUlkLCB1c2VySWQsIG9iamVjdF9uYW1lKVxuXG5cdFx0XHRKc29uUm91dGVzLnNlbmRSZXN1bHQgcmVzLCB7XG5cdFx0XHRcdGNvZGU6IDIwMCxcblx0XHRcdFx0ZGF0YTogZGF0YSB8fCB7fVxuXHRcdFx0fVxuXHRcdGNhdGNoIGVcblx0XHRcdGNvbnNvbGUuZXJyb3IgZS5zdGFja1xuXHRcdFx0SnNvblJvdXRlcy5zZW5kUmVzdWx0IHJlcywge1xuXHRcdFx0XHRjb2RlOiBlLmVycm9yIHx8IDUwMFxuXHRcdFx0XHRkYXRhOiB7ZXJyb3JzOiBlLnJlYXNvbiB8fCBlLm1lc3NhZ2V9XG5cdFx0XHR9IiwiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG4gIHZhciBnZXRPYmplY3QsIGdldE9iamVjdHM7XG4gIGdldE9iamVjdHMgPSBmdW5jdGlvbihzcGFjZUlkLCB1c2VySWQsIG9iamVjdF9uYW1lcykge1xuICAgIHZhciBkYXRhO1xuICAgIGRhdGEgPSB7fTtcbiAgICBvYmplY3RfbmFtZXMuc3BsaXQoJywnKS5mb3JFYWNoKGZ1bmN0aW9uKG9iamVjdF9uYW1lKSB7XG4gICAgICB2YXIgb2JqZWN0O1xuICAgICAgb2JqZWN0ID0gZ2V0T2JqZWN0KHNwYWNlSWQsIHVzZXJJZCwgb2JqZWN0X25hbWUpO1xuICAgICAgcmV0dXJuIGRhdGFbb2JqZWN0Lm5hbWVdID0gb2JqZWN0O1xuICAgIH0pO1xuICAgIHJldHVybiBkYXRhO1xuICB9O1xuICBnZXRPYmplY3QgPSBmdW5jdGlvbihzcGFjZUlkLCB1c2VySWQsIG9iamVjdF9uYW1lKSB7XG4gICAgdmFyIGRhdGEsIGZpZWxkcywgb2JqZWN0X3Blcm1pc3Npb25zLCBwc2V0cywgcHNldHNBZG1pbiwgcHNldHNDdXJyZW50LCBwc2V0c1VzZXI7XG4gICAgZGF0YSA9IF8uY2xvbmUoQ3JlYXRvci5PYmplY3RzW0NyZWF0b3IuZ2V0T2JqZWN0TmFtZShDcmVhdG9yLmdldE9iamVjdChvYmplY3RfbmFtZSwgc3BhY2VJZCkpXSk7XG4gICAgaWYgKCFkYXRhKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCLml6DmlYjnmoRpZCBcIiArIG9iamVjdF9uYW1lKTtcbiAgICB9XG4gICAgcHNldHNBZG1pbiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInBlcm1pc3Npb25fc2V0XCIpLmZpbmRPbmUoe1xuICAgICAgc3BhY2U6IHNwYWNlSWQsXG4gICAgICBuYW1lOiAnYWRtaW4nXG4gICAgfSwge1xuICAgICAgZmllbGRzOiB7XG4gICAgICAgIF9pZDogMSxcbiAgICAgICAgYXNzaWduZWRfYXBwczogMVxuICAgICAgfVxuICAgIH0pO1xuICAgIHBzZXRzVXNlciA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInBlcm1pc3Npb25fc2V0XCIpLmZpbmRPbmUoe1xuICAgICAgc3BhY2U6IHNwYWNlSWQsXG4gICAgICBuYW1lOiAndXNlcidcbiAgICB9LCB7XG4gICAgICBmaWVsZHM6IHtcbiAgICAgICAgX2lkOiAxLFxuICAgICAgICBhc3NpZ25lZF9hcHBzOiAxXG4gICAgICB9XG4gICAgfSk7XG4gICAgcHNldHNDdXJyZW50ID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwicGVybWlzc2lvbl9zZXRcIikuZmluZCh7XG4gICAgICB1c2VyczogdXNlcklkLFxuICAgICAgc3BhY2U6IHNwYWNlSWRcbiAgICB9LCB7XG4gICAgICBmaWVsZHM6IHtcbiAgICAgICAgX2lkOiAxLFxuICAgICAgICBhc3NpZ25lZF9hcHBzOiAxXG4gICAgICB9XG4gICAgfSkuZmV0Y2goKTtcbiAgICBwc2V0cyA9IHtcbiAgICAgIHBzZXRzQWRtaW46IHBzZXRzQWRtaW4sXG4gICAgICBwc2V0c1VzZXI6IHBzZXRzVXNlcixcbiAgICAgIHBzZXRzQ3VycmVudDogcHNldHNDdXJyZW50XG4gICAgfTtcbiAgICBvYmplY3RfcGVybWlzc2lvbnMgPSBDcmVhdG9yLmdldE9iamVjdFBlcm1pc3Npb25zLmJpbmQocHNldHMpKHNwYWNlSWQsIHVzZXJJZCwgb2JqZWN0X25hbWUpO1xuICAgIGRlbGV0ZSBkYXRhLmxpc3Rfdmlld3M7XG4gICAgZGVsZXRlIGRhdGEucGVybWlzc2lvbl9zZXQ7XG4gICAgaWYgKG9iamVjdF9wZXJtaXNzaW9ucy5hbGxvd1JlYWQpIHtcbiAgICAgIGRhdGEuYWxsb3dSZWFkID0gdHJ1ZTtcbiAgICAgIGRhdGEuYWxsb3dFZGl0ID0gb2JqZWN0X3Blcm1pc3Npb25zLmFsbG93RWRpdDtcbiAgICAgIGRhdGEuYWxsb3dEZWxldGUgPSBvYmplY3RfcGVybWlzc2lvbnMuYWxsb3dEZWxldGU7XG4gICAgICBkYXRhLmFsbG93Q3JlYXRlID0gb2JqZWN0X3Blcm1pc3Npb25zLmFsbG93Q3JlYXRlO1xuICAgICAgZGF0YS5tb2RpZnlBbGxSZWNvcmRzID0gb2JqZWN0X3Blcm1pc3Npb25zLm1vZGlmeUFsbFJlY29yZHM7XG4gICAgICBmaWVsZHMgPSB7fTtcbiAgICAgIF8uZm9yRWFjaChkYXRhLmZpZWxkcywgZnVuY3Rpb24oZmllbGQsIGtleSkge1xuICAgICAgICB2YXIgX2ZpZWxkO1xuICAgICAgICBfZmllbGQgPSBfLmNsb25lKGZpZWxkKTtcbiAgICAgICAgaWYgKCFfZmllbGQubmFtZSkge1xuICAgICAgICAgIF9maWVsZC5uYW1lID0ga2V5O1xuICAgICAgICB9XG4gICAgICAgIGlmIChfLmluZGV4T2Yob2JqZWN0X3Blcm1pc3Npb25zLnVuZWRpdGFibGVfZmllbGRzLCBfZmllbGQubmFtZSkgPiAtMSkge1xuICAgICAgICAgIF9maWVsZC5yZWFkb25seSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKF8uaW5kZXhPZihvYmplY3RfcGVybWlzc2lvbnMudW5yZWFkYWJsZV9maWVsZHMsIF9maWVsZC5uYW1lKSA8IDApIHtcbiAgICAgICAgICByZXR1cm4gZmllbGRzW2tleV0gPSBfZmllbGQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgZGF0YS5maWVsZHMgPSBmaWVsZHM7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRhdGEuYWxsb3dSZWFkID0gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBkYXRhO1xuICB9O1xuICByZXR1cm4gSnNvblJvdXRlcy5hZGQoJ2dldCcsIFN0ZWVkb3NPRGF0YS5BUElfUEFUSCArICcvb2JqZWN0cy86aWQnLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICAgIHZhciBfb2JqLCBkYXRhLCBlLCBvYmplY3RfbmFtZSwgcmVmLCByZWYxLCBzcGFjZUlkLCB1c2VySWQ7XG4gICAgdHJ5IHtcbiAgICAgIHVzZXJJZCA9IFN0ZWVkb3MuZ2V0VXNlcklkRnJvbUF1dGhUb2tlbihyZXEsIHJlcyk7XG4gICAgICBpZiAoIXVzZXJJZCkge1xuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCJObyBwZXJtaXNzaW9uXCIpO1xuICAgICAgfVxuICAgICAgc3BhY2VJZCA9IChyZWYgPSByZXEucGFyYW1zKSAhPSBudWxsID8gcmVmLnNwYWNlSWQgOiB2b2lkIDA7XG4gICAgICBpZiAoIXNwYWNlSWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwiTWlzcyBzcGFjZUlkXCIpO1xuICAgICAgfVxuICAgICAgb2JqZWN0X25hbWUgPSAocmVmMSA9IHJlcS5wYXJhbXMpICE9IG51bGwgPyByZWYxLmlkIDogdm9pZCAwO1xuICAgICAgaWYgKCFvYmplY3RfbmFtZSkge1xuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCJNaXNzIGlkXCIpO1xuICAgICAgfVxuICAgICAgX29iaiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdHNcIikuZmluZE9uZSh7XG4gICAgICAgIF9pZDogb2JqZWN0X25hbWVcbiAgICAgIH0pO1xuICAgICAgaWYgKF9vYmogJiYgX29iai5uYW1lKSB7XG4gICAgICAgIG9iamVjdF9uYW1lID0gX29iai5uYW1lO1xuICAgICAgfVxuICAgICAgaWYgKG9iamVjdF9uYW1lLnNwbGl0KCcsJykubGVuZ3RoID4gMSkge1xuICAgICAgICBkYXRhID0gZ2V0T2JqZWN0cyhzcGFjZUlkLCB1c2VySWQsIG9iamVjdF9uYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRhdGEgPSBnZXRPYmplY3Qoc3BhY2VJZCwgdXNlcklkLCBvYmplY3RfbmFtZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gSnNvblJvdXRlcy5zZW5kUmVzdWx0KHJlcywge1xuICAgICAgICBjb2RlOiAyMDAsXG4gICAgICAgIGRhdGE6IGRhdGEgfHwge31cbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBlID0gZXJyb3I7XG4gICAgICBjb25zb2xlLmVycm9yKGUuc3RhY2spO1xuICAgICAgcmV0dXJuIEpzb25Sb3V0ZXMuc2VuZFJlc3VsdChyZXMsIHtcbiAgICAgICAgY29kZTogZS5lcnJvciB8fCA1MDAsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBlcnJvcnM6IGUucmVhc29uIHx8IGUubWVzc2FnZVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xufSk7XG4iLCJNZXRlb3Iuc3RhcnR1cCAtPlxuXHRNZXRlb3JPRGF0YVJvdXRlciA9IHJlcXVpcmUoJ0BzdGVlZG9zL2NvcmUnKS5NZXRlb3JPRGF0YVJvdXRlcjtcblx0T0RhdGFSb3V0ZXIgPSByZXF1aXJlKCdAc3RlZWRvcy9jb3JlJykuT0RhdGFSb3V0ZXJcblx0ZXhwcmVzcyA9IHJlcXVpcmUoJ2V4cHJlc3MnKTtcblx0YXBwID0gZXhwcmVzcygpO1xuXHRhcHAudXNlKCcvYXBpL29kYXRhL3Y0JywgTWV0ZW9yT0RhdGFSb3V0ZXIpO1xuXHRNZXRlb3JPRGF0YUFQSVY0Um91dGVyID0gcmVxdWlyZSgnQHN0ZWVkb3MvY29yZScpLk1ldGVvck9EYXRhQVBJVjRSb3V0ZXI7XG5cdGlmIE1ldGVvck9EYXRhQVBJVjRSb3V0ZXJcblx0XHRhcHAudXNlKCcvYXBpL3Y0JywgTWV0ZW9yT0RhdGFBUElWNFJvdXRlcilcblx0V2ViQXBwLmNvbm5lY3RIYW5kbGVycy51c2UoYXBwKTtcblx0Xy5lYWNoIENyZWF0b3Iuc3RlZWRvc1NjaGVtYS5nZXREYXRhU291cmNlcygpLCAoZGF0YXNvdXJjZSwgbmFtZSktPlxuXHRcdGlmKG5hbWUgIT0gJ2RlZmF1bHQnKVxuXHRcdFx0b3RoZXJBcHAgPSBleHByZXNzKCk7XG5cdFx0XHRvdGhlckFwcC51c2UoXCIvYXBpL29kYXRhLyN7bmFtZX1cIiwgT0RhdGFSb3V0ZXIpO1xuXHRcdFx0V2ViQXBwLmNvbm5lY3RIYW5kbGVycy51c2Uob3RoZXJBcHApO1xuXG4jIFx0b2RhdGFWNE1vbmdvZGIgPSByZXF1aXJlICdvZGF0YS12NC1tb25nb2RiJ1xuIyBcdHF1ZXJ5c3RyaW5nID0gcmVxdWlyZSAncXVlcnlzdHJpbmcnXG5cbiMgXHRoYW5kbGVFcnJvciA9IChlKS0+XG4jIFx0XHRjb25zb2xlLmVycm9yIGUuc3RhY2tcbiMgXHRcdGJvZHkgPSB7fVxuIyBcdFx0ZXJyb3IgPSB7fVxuIyBcdFx0ZXJyb3JbJ21lc3NhZ2UnXSA9IGUubWVzc2FnZVxuIyBcdFx0c3RhdHVzQ29kZSA9IDUwMFxuIyBcdFx0aWYgZS5lcnJvciBhbmQgXy5pc051bWJlcihlLmVycm9yKVxuIyBcdFx0XHRzdGF0dXNDb2RlID0gZS5lcnJvclxuIyBcdFx0ZXJyb3JbJ2NvZGUnXSA9IHN0YXR1c0NvZGVcbiMgXHRcdGVycm9yWydlcnJvciddID0gc3RhdHVzQ29kZVxuIyBcdFx0ZXJyb3JbJ2RldGFpbHMnXSA9IGUuZGV0YWlsc1xuIyBcdFx0ZXJyb3JbJ3JlYXNvbiddID0gZS5yZWFzb25cbiMgXHRcdGJvZHlbJ2Vycm9yJ10gPSBlcnJvclxuIyBcdFx0cmV0dXJuIHtcbiMgXHRcdFx0c3RhdHVzQ29kZTogc3RhdHVzQ29kZVxuIyBcdFx0XHRib2R5OmJvZHlcbiMgXHRcdH1cblxuIyBcdHZpc2l0b3JQYXJzZXIgPSAodmlzaXRvciktPlxuIyBcdFx0cGFyc2VkT3B0ID0ge31cbiMgXHRcdGlmIHZpc2l0b3IucHJvamVjdGlvblxuIyBcdFx0XHRwYXJzZWRPcHQuZmllbGRzID0gdmlzaXRvci5wcm9qZWN0aW9uXG4jIFx0XHRpZiB2aXNpdG9yLmhhc093blByb3BlcnR5KCdsaW1pdCcpXG4jIFx0XHRcdHBhcnNlZE9wdC5saW1pdCA9IHZpc2l0b3IubGltaXRcblxuIyBcdFx0aWYgdmlzaXRvci5oYXNPd25Qcm9wZXJ0eSgnc2tpcCcpXG4jIFx0XHRcdHBhcnNlZE9wdC5za2lwID0gdmlzaXRvci5za2lwXG5cbiMgXHRcdGlmIHZpc2l0b3Iuc29ydFxuIyBcdFx0XHRwYXJzZWRPcHQuc29ydCA9IHZpc2l0b3Iuc29ydFxuXG4jIFx0XHRwYXJzZWRPcHRcbiMgXHRkZWFsV2l0aEV4cGFuZCA9IChjcmVhdGVRdWVyeSwgZW50aXRpZXMsIGtleSwgc3BhY2VJZCktPlxuIyBcdFx0aWYgXy5pc0VtcHR5IGNyZWF0ZVF1ZXJ5LmluY2x1ZGVzXG4jIFx0XHRcdHJldHVyblxuXG4jIFx0XHRvYmogPSBDcmVhdG9yLmdldE9iamVjdChrZXksIHNwYWNlSWQpXG4jIFx0XHRfLmVhY2ggY3JlYXRlUXVlcnkuaW5jbHVkZXMsIChpbmNsdWRlKS0+XG4jIFx0XHRcdCMgY29uc29sZS5sb2cgJ2luY2x1ZGU6ICcsIGluY2x1ZGVcbiMgXHRcdFx0bmF2aWdhdGlvblByb3BlcnR5ID0gaW5jbHVkZS5uYXZpZ2F0aW9uUHJvcGVydHlcbiMgXHRcdFx0IyBjb25zb2xlLmxvZyAnbmF2aWdhdGlvblByb3BlcnR5OiAnLCBuYXZpZ2F0aW9uUHJvcGVydHlcbiMgXHRcdFx0ZmllbGQgPSBvYmouZmllbGRzW25hdmlnYXRpb25Qcm9wZXJ0eV1cbiMgXHRcdFx0aWYgZmllbGQgYW5kIChmaWVsZC50eXBlIGlzICdsb29rdXAnIG9yIGZpZWxkLnR5cGUgaXMgJ21hc3Rlcl9kZXRhaWwnKVxuIyBcdFx0XHRcdGlmIF8uaXNGdW5jdGlvbihmaWVsZC5yZWZlcmVuY2VfdG8pXG4jIFx0XHRcdFx0XHRmaWVsZC5yZWZlcmVuY2VfdG8gPSBmaWVsZC5yZWZlcmVuY2VfdG8oKVxuIyBcdFx0XHRcdGlmIGZpZWxkLnJlZmVyZW5jZV90b1xuIyBcdFx0XHRcdFx0cXVlcnlPcHRpb25zID0gdmlzaXRvclBhcnNlcihpbmNsdWRlKVxuIyBcdFx0XHRcdFx0aWYgXy5pc1N0cmluZyBmaWVsZC5yZWZlcmVuY2VfdG9cbiMgXHRcdFx0XHRcdFx0cmVmZXJlbmNlVG9Db2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKGZpZWxkLnJlZmVyZW5jZV90bywgc3BhY2VJZClcbiMgXHRcdFx0XHRcdFx0X3JvX05BTUVfRklFTERfS0VZID0gQ3JlYXRvci5nZXRPYmplY3QoZmllbGQucmVmZXJlbmNlX3RvLCBzcGFjZUlkKT8uTkFNRV9GSUVMRF9LRVlcbiMgXHRcdFx0XHRcdFx0Xy5lYWNoIGVudGl0aWVzLCAoZW50aXR5LCBpZHgpLT5cbiMgXHRcdFx0XHRcdFx0XHRpZiBlbnRpdHlbbmF2aWdhdGlvblByb3BlcnR5XVxuIyBcdFx0XHRcdFx0XHRcdFx0aWYgZmllbGQubXVsdGlwbGVcbiMgXHRcdFx0XHRcdFx0XHRcdFx0b3JpZ2luYWxEYXRhID0gXy5jbG9uZShlbnRpdHlbbmF2aWdhdGlvblByb3BlcnR5XSlcbiMgXHRcdFx0XHRcdFx0XHRcdFx0bXVsdGlRdWVyeSA9IF8uZXh0ZW5kIHtfaWQ6IHskaW46IGVudGl0eVtuYXZpZ2F0aW9uUHJvcGVydHldfX0sIGluY2x1ZGUucXVlcnlcbiMgXHRcdFx0XHRcdFx0XHRcdFx0ZW50aXRpZXNbaWR4XVtuYXZpZ2F0aW9uUHJvcGVydHldID0gcmVmZXJlbmNlVG9Db2xsZWN0aW9uLmZpbmQobXVsdGlRdWVyeSwgcXVlcnlPcHRpb25zKS5mZXRjaCgpXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGlmICFlbnRpdGllc1tpZHhdW25hdmlnYXRpb25Qcm9wZXJ0eV0ubGVuZ3RoXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0ZW50aXRpZXNbaWR4XVtuYXZpZ2F0aW9uUHJvcGVydHldID0gb3JpZ2luYWxEYXRhXG4jIFx0XHRcdFx0XHRcdFx0XHRcdCPmjpLluo9cbiMgXHRcdFx0XHRcdFx0XHRcdFx0ZW50aXRpZXNbaWR4XVtuYXZpZ2F0aW9uUHJvcGVydHldID0gQ3JlYXRvci5nZXRPcmRlcmx5U2V0QnlJZHMoZW50aXRpZXNbaWR4XVtuYXZpZ2F0aW9uUHJvcGVydHldLCBvcmlnaW5hbERhdGEpXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGVudGl0aWVzW2lkeF1bbmF2aWdhdGlvblByb3BlcnR5XSA9IF8ubWFwIGVudGl0aWVzW2lkeF1bbmF2aWdhdGlvblByb3BlcnR5XSwgKG8pLT5cbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRvWydyZWZlcmVuY2VfdG8ubyddID0gcmVmZXJlbmNlVG9Db2xsZWN0aW9uLl9uYW1lXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0b1sncmVmZXJlbmNlX3RvLl9vJ10gPSBmaWVsZC5yZWZlcmVuY2VfdG9cbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRvWydfTkFNRV9GSUVMRF9WQUxVRSddID0gb1tfcm9fTkFNRV9GSUVMRF9LRVldXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG9cbiMgXHRcdFx0XHRcdFx0XHRcdGVsc2VcbiMgXHRcdFx0XHRcdFx0XHRcdFx0c2luZ2xlUXVlcnkgPSBfLmV4dGVuZCB7X2lkOiBlbnRpdHlbbmF2aWdhdGlvblByb3BlcnR5XX0sIGluY2x1ZGUucXVlcnlcblxuIyBcdFx0XHRcdFx0XHRcdFx0XHQjIOeJueauiuWkhOeQhuWcqOebuOWFs+ihqOS4reayoeacieaJvuWIsOaVsOaNrueahOaDheWGte+8jOi/lOWbnuWOn+aVsOaNrlxuIyBcdFx0XHRcdFx0XHRcdFx0XHRlbnRpdGllc1tpZHhdW25hdmlnYXRpb25Qcm9wZXJ0eV0gPSByZWZlcmVuY2VUb0NvbGxlY3Rpb24uZmluZE9uZShzaW5nbGVRdWVyeSwgcXVlcnlPcHRpb25zKSB8fCBlbnRpdGllc1tpZHhdW25hdmlnYXRpb25Qcm9wZXJ0eV1cbiMgXHRcdFx0XHRcdFx0XHRcdFx0aWYgZW50aXRpZXNbaWR4XVtuYXZpZ2F0aW9uUHJvcGVydHldXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0ZW50aXRpZXNbaWR4XVtuYXZpZ2F0aW9uUHJvcGVydHldWydyZWZlcmVuY2VfdG8ubyddID0gcmVmZXJlbmNlVG9Db2xsZWN0aW9uLl9uYW1lXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0ZW50aXRpZXNbaWR4XVtuYXZpZ2F0aW9uUHJvcGVydHldWydyZWZlcmVuY2VfdG8uX28nXSA9IGZpZWxkLnJlZmVyZW5jZV90b1xuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdGVudGl0aWVzW2lkeF1bbmF2aWdhdGlvblByb3BlcnR5XVsnX05BTUVfRklFTERfVkFMVUUnXSA9IGVudGl0aWVzW2lkeF1bbmF2aWdhdGlvblByb3BlcnR5XVtfcm9fTkFNRV9GSUVMRF9LRVldXG4jIFx0XHRcdFx0XHRpZiBfLmlzQXJyYXkgZmllbGQucmVmZXJlbmNlX3RvXG4jIFx0XHRcdFx0XHRcdF8uZWFjaCBlbnRpdGllcywgKGVudGl0eSwgaWR4KS0+XG4jIFx0XHRcdFx0XHRcdFx0aWYgZW50aXR5W25hdmlnYXRpb25Qcm9wZXJ0eV0/Lmlkc1xuIyBcdFx0XHRcdFx0XHRcdFx0X28gPSBlbnRpdHlbbmF2aWdhdGlvblByb3BlcnR5XS5vXG4jIFx0XHRcdFx0XHRcdFx0XHRfcm9fTkFNRV9GSUVMRF9LRVkgPSBDcmVhdG9yLmdldE9iamVjdChfbywgc3BhY2VJZCk/Lk5BTUVfRklFTERfS0VZXG4jIFx0XHRcdFx0XHRcdFx0XHRpZiBxdWVyeU9wdGlvbnM/LmZpZWxkcyAmJiBfcm9fTkFNRV9GSUVMRF9LRVlcbiMgXHRcdFx0XHRcdFx0XHRcdFx0cXVlcnlPcHRpb25zLmZpZWxkc1tfcm9fTkFNRV9GSUVMRF9LRVldID0gMVxuIyBcdFx0XHRcdFx0XHRcdFx0cmVmZXJlbmNlVG9Db2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKGVudGl0eVtuYXZpZ2F0aW9uUHJvcGVydHldLm8sIHNwYWNlSWQpXG4jIFx0XHRcdFx0XHRcdFx0XHRpZiByZWZlcmVuY2VUb0NvbGxlY3Rpb25cbiMgXHRcdFx0XHRcdFx0XHRcdFx0aWYgZmllbGQubXVsdGlwbGVcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRfaWRzID0gXy5jbG9uZShlbnRpdHlbbmF2aWdhdGlvblByb3BlcnR5XS5pZHMpXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0bXVsdGlRdWVyeSA9IF8uZXh0ZW5kIHtfaWQ6IHskaW46IGVudGl0eVtuYXZpZ2F0aW9uUHJvcGVydHldLmlkc319LCBpbmNsdWRlLnF1ZXJ5XG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0ZW50aXRpZXNbaWR4XVtuYXZpZ2F0aW9uUHJvcGVydHldID0gXy5tYXAgcmVmZXJlbmNlVG9Db2xsZWN0aW9uLmZpbmQobXVsdGlRdWVyeSwgcXVlcnlPcHRpb25zKS5mZXRjaCgpLCAobyktPlxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdFx0b1sncmVmZXJlbmNlX3RvLm8nXSA9IHJlZmVyZW5jZVRvQ29sbGVjdGlvbi5fbmFtZVxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdFx0b1sncmVmZXJlbmNlX3RvLl9vJ10gPSBfb1xuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdFx0b1snX05BTUVfRklFTERfVkFMVUUnXSA9IG9bX3JvX05BTUVfRklFTERfS0VZXVxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG9cbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHQj5o6S5bqPXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0ZW50aXRpZXNbaWR4XVtuYXZpZ2F0aW9uUHJvcGVydHldID0gQ3JlYXRvci5nZXRPcmRlcmx5U2V0QnlJZHMoZW50aXRpZXNbaWR4XVtuYXZpZ2F0aW9uUHJvcGVydHldLCBfaWRzKVxuIyBcdFx0XHRcdFx0XHRcdFx0XHRlbHNlXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0c2luZ2xlUXVlcnkgPSBfLmV4dGVuZCB7X2lkOiBlbnRpdHlbbmF2aWdhdGlvblByb3BlcnR5XS5pZHNbMF19LCBpbmNsdWRlLnF1ZXJ5XG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0ZW50aXRpZXNbaWR4XVtuYXZpZ2F0aW9uUHJvcGVydHldID0gcmVmZXJlbmNlVG9Db2xsZWN0aW9uLmZpbmRPbmUoc2luZ2xlUXVlcnksIHF1ZXJ5T3B0aW9ucylcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiBlbnRpdGllc1tpZHhdW25hdmlnYXRpb25Qcm9wZXJ0eV1cbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGVudGl0aWVzW2lkeF1bbmF2aWdhdGlvblByb3BlcnR5XVsncmVmZXJlbmNlX3RvLm8nXSA9IHJlZmVyZW5jZVRvQ29sbGVjdGlvbi5fbmFtZVxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZW50aXRpZXNbaWR4XVtuYXZpZ2F0aW9uUHJvcGVydHldWydyZWZlcmVuY2VfdG8uX28nXSA9IF9vXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRlbnRpdGllc1tpZHhdW25hdmlnYXRpb25Qcm9wZXJ0eV1bJ19OQU1FX0ZJRUxEX1ZBTFVFJ10gPSBlbnRpdGllc1tpZHhdW25hdmlnYXRpb25Qcm9wZXJ0eV1bX3JvX05BTUVfRklFTERfS0VZXVxuXG4jIFx0XHRcdFx0ZWxzZVxuIyBcdFx0XHRcdCMgVE9ET1xuXG5cbiMgXHRcdHJldHVyblxuXG4jIFx0c2V0T2RhdGFQcm9wZXJ0eT0oZW50aXRpZXMsc3BhY2Usa2V5KS0+XG4jIFx0XHRlbnRpdGllc19PZGF0YVByb3BlcnRpZXMgPSBbXVxuIyBcdFx0Xy5lYWNoIGVudGl0aWVzLCAoZW50aXR5LCBpZHgpLT5cbiMgXHRcdFx0ZW50aXR5X09kYXRhUHJvcGVydGllcyA9IHt9XG4jIFx0XHRcdGlkID0gZW50aXRpZXNbaWR4XVtcIl9pZFwiXVxuIyBcdFx0XHRlbnRpdHlfT2RhdGFQcm9wZXJ0aWVzWydAb2RhdGEuaWQnXSA9IFN0ZWVkb3NPRGF0YS5nZXRPRGF0YU5leHRMaW5rUGF0aChzcGFjZSxrZXkpKyAnKFxcJycgKyBcIiN7aWR9XCIgKyAnXFwnKSdcbiMgXHRcdFx0ZW50aXR5X09kYXRhUHJvcGVydGllc1snQG9kYXRhLmV0YWcnXSA9IFwiVy9cXFwiMDhENTg5NzIwQkJCM0RCMVxcXCJcIlxuIyBcdFx0XHRlbnRpdHlfT2RhdGFQcm9wZXJ0aWVzWydAb2RhdGEuZWRpdExpbmsnXSA9IGVudGl0eV9PZGF0YVByb3BlcnRpZXNbJ0BvZGF0YS5pZCddXG4jIFx0XHRcdF8uZXh0ZW5kIGVudGl0eV9PZGF0YVByb3BlcnRpZXMsZW50aXR5XG4jIFx0XHRcdGVudGl0aWVzX09kYXRhUHJvcGVydGllcy5wdXNoIGVudGl0eV9PZGF0YVByb3BlcnRpZXNcbiMgXHRcdHJldHVybiBlbnRpdGllc19PZGF0YVByb3BlcnRpZXNcblxuIyBcdHNldEVycm9yTWVzc2FnZSA9IChzdGF0dXNDb2RlLGNvbGxlY3Rpb24sa2V5LGFjdGlvbiktPlxuIyBcdFx0Ym9keSA9IHt9XG4jIFx0XHRlcnJvciA9IHt9XG4jIFx0XHRpbm5lcmVycm9yID0ge31cbiMgXHRcdGlmIHN0YXR1c0NvZGUgPT0gNDA0XG4jIFx0XHRcdGlmIGNvbGxlY3Rpb25cbiMgXHRcdFx0XHRpZiBhY3Rpb24gPT0gJ3Bvc3QnXG4jIFx0XHRcdFx0XHRpbm5lcmVycm9yWydtZXNzYWdlJ10gPSB0KFwiY3JlYXRvcl9vZGF0YV9wb3N0X2ZhaWxcIilcbiMgXHRcdFx0XHRcdGlubmVyZXJyb3JbJ3R5cGUnXSA9ICdNaWNyb3NvZnQuT0RhdGEuQ29yZS5VcmlQYXJzZXIuT0RhdGFVbnJlY29nbml6ZWRQYXRoRXhjZXB0aW9uJ1xuIyBcdFx0XHRcdFx0ZXJyb3JbJ2NvZGUnXSA9IDQwNFxuIyBcdFx0XHRcdFx0ZXJyb3JbJ21lc3NhZ2UnXSA9IFwiY3JlYXRvcl9vZGF0YV9wb3N0X2ZhaWxcIlxuIyBcdFx0XHRcdGVsc2VcbiMgXHRcdFx0XHRcdGlubmVyZXJyb3JbJ21lc3NhZ2UnXSA9IHQoXCJjcmVhdG9yX29kYXRhX3JlY29yZF9xdWVyeV9mYWlsXCIpXG4jIFx0XHRcdFx0XHRpbm5lcmVycm9yWyd0eXBlJ10gPSAnTWljcm9zb2Z0Lk9EYXRhLkNvcmUuVXJpUGFyc2VyLk9EYXRhVW5yZWNvZ25pemVkUGF0aEV4Y2VwdGlvbidcbiMgXHRcdFx0XHRcdGVycm9yWydjb2RlJ10gPSA0MDRcbiMgXHRcdFx0XHRcdGVycm9yWydtZXNzYWdlJ10gPSBcImNyZWF0b3Jfb2RhdGFfcmVjb3JkX3F1ZXJ5X2ZhaWxcIlxuIyBcdFx0XHRlbHNlXG4jIFx0XHRcdFx0aW5uZXJlcnJvclsnbWVzc2FnZSddID0gdChcImNyZWF0b3Jfb2RhdGFfY29sbGVjdGlvbl9xdWVyeV9mYWlsXCIpKyBrZXlcbiMgXHRcdFx0XHRpbm5lcmVycm9yWyd0eXBlJ10gPSAnTWljcm9zb2Z0Lk9EYXRhLkNvcmUuVXJpUGFyc2VyLk9EYXRhVW5yZWNvZ25pemVkUGF0aEV4Y2VwdGlvbidcbiMgXHRcdFx0XHRlcnJvclsnY29kZSddID0gNDA0XG4jIFx0XHRcdFx0ZXJyb3JbJ21lc3NhZ2UnXSA9IFwiY3JlYXRvcl9vZGF0YV9jb2xsZWN0aW9uX3F1ZXJ5X2ZhaWxcIlxuIyBcdFx0aWYgIHN0YXR1c0NvZGUgPT0gNDAxXG4jIFx0XHRcdGlubmVyZXJyb3JbJ21lc3NhZ2UnXSA9IHQoXCJjcmVhdG9yX29kYXRhX2F1dGhlbnRpY2F0aW9uX3JlcXVpcmVkXCIpXG4jIFx0XHRcdGlubmVyZXJyb3JbJ3R5cGUnXSA9ICdNaWNyb3NvZnQuT0RhdGEuQ29yZS5VcmlQYXJzZXIuT0RhdGFVbnJlY29nbml6ZWRQYXRoRXhjZXB0aW9uJ1xuIyBcdFx0XHRlcnJvclsnY29kZSddID0gNDAxXG4jIFx0XHRcdGVycm9yWydtZXNzYWdlJ10gPSBcImNyZWF0b3Jfb2RhdGFfYXV0aGVudGljYXRpb25fcmVxdWlyZWRcIlxuIyBcdFx0aWYgc3RhdHVzQ29kZSA9PSA0MDNcbiMgXHRcdFx0c3dpdGNoIGFjdGlvblxuIyBcdFx0XHRcdHdoZW4gJ2dldCcgdGhlbiBpbm5lcmVycm9yWydtZXNzYWdlJ10gPSB0KFwiY3JlYXRvcl9vZGF0YV91c2VyX2FjY2Vzc19mYWlsXCIpXG4jIFx0XHRcdFx0d2hlbiAncG9zdCcgdGhlbiBpbm5lcmVycm9yWydtZXNzYWdlJ10gPSB0KFwiY3JlYXRvcl9vZGF0YV91c2VyX2NyZWF0ZV9mYWlsXCIpXG4jIFx0XHRcdFx0d2hlbiAncHV0JyB0aGVuIGlubmVyZXJyb3JbJ21lc3NhZ2UnXSA9IHQoXCJjcmVhdG9yX29kYXRhX3VzZXJfdXBkYXRlX2ZhaWxcIilcbiMgXHRcdFx0XHR3aGVuICdkZWxldGUnIHRoZW4gaW5uZXJlcnJvclsnbWVzc2FnZSddID0gdChcImNyZWF0b3Jfb2RhdGFfdXNlcl9yZW1vdmVfZmFpbFwiKVxuIyBcdFx0XHRpbm5lcmVycm9yWydtZXNzYWdlJ10gPSB0KFwiY3JlYXRvcl9vZGF0YV91c2VyX2FjY2Vzc19mYWlsXCIpXG4jIFx0XHRcdGlubmVyZXJyb3JbJ3R5cGUnXSA9ICdNaWNyb3NvZnQuT0RhdGEuQ29yZS5VcmlQYXJzZXIuT0RhdGFVbnJlY29nbml6ZWRQYXRoRXhjZXB0aW9uJ1xuIyBcdFx0XHRlcnJvclsnY29kZSddID0gNDAzXG4jIFx0XHRcdGVycm9yWydtZXNzYWdlJ10gPSBcImNyZWF0b3Jfb2RhdGFfdXNlcl9hY2Nlc3NfZmFpbFwiXG4jIFx0XHRlcnJvclsnaW5uZXJlcnJvciddID0gaW5uZXJlcnJvclxuIyBcdFx0Ym9keVsnZXJyb3InXSA9IGVycm9yXG4jIFx0XHRyZXR1cm4gYm9keVxuXG4jIFx0cmVtb3ZlSW52YWxpZE1ldGhvZCA9IChxdWVyeVBhcmFtcyktPlxuIyBcdFx0aWYgcXVlcnlQYXJhbXMuJGZpbHRlciAmJiBxdWVyeVBhcmFtcy4kZmlsdGVyLmluZGV4T2YoJ3RvbG93ZXIoJykgPiAtMVxuIyBcdFx0XHRyZW1vdmVNZXRob2QgPSAoJDEpLT5cbiMgXHRcdFx0XHRyZXR1cm4gJDEucmVwbGFjZSgndG9sb3dlcignLCAnJykucmVwbGFjZSgnKScsICcnKVxuIyBcdFx0XHRxdWVyeVBhcmFtcy4kZmlsdGVyID0gcXVlcnlQYXJhbXMuJGZpbHRlci5yZXBsYWNlKC90b2xvd2VyXFwoKFteXFwpXSspXFwpL2csIHJlbW92ZU1ldGhvZClcblxuIyBcdGlzU2FtZUNvbXBhbnkgPSAoc3BhY2VJZCwgdXNlcklkLCBjb21wYW55SWQsIHF1ZXJ5KS0+XG4jIFx0XHRzdSA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInNwYWNlX3VzZXJzXCIpLmZpbmRPbmUoeyBzcGFjZTogc3BhY2VJZCwgdXNlcjogdXNlcklkIH0sIHsgZmllbGRzOiB7IGNvbXBhbnlfaWQ6IDEsIGNvbXBhbnlfaWRzOiAxIH0gfSlcbiMgXHRcdGlmICFjb21wYW55SWQgJiYgcXVlcnlcbiMgXHRcdFx0Y29tcGFueUlkID0gc3UuY29tcGFueV9pZFxuIyBcdFx0XHRxdWVyeS5jb21wYW55X2lkID0geyAkaW46IHN1LmNvbXBhbnlfaWRzIH1cbiMgXHRcdHJldHVybiBzdS5jb21wYW55X2lkcy5pbmNsdWRlcyhjb21wYW55SWQpXG5cbiMgXHQjIOS4jei/lOWbnuW3suWBh+WIoOmZpOeahOaVsOaNrlxuIyBcdGV4Y2x1ZGVEZWxldGVkID0gKHF1ZXJ5KS0+XG4jIFx0XHRxdWVyeS5pc19kZWxldGVkID0geyAkbmU6IHRydWUgfVxuXG4jIFx0IyDkv67mlLnjgIHliKDpmaTml7bvvIzlpoLmnpwgZG9jLnNwYWNlID0gXCJnbG9iYWxcIu+8jOaKpemUmVxuIyBcdGNoZWNrR2xvYmFsUmVjb3JkID0gKGNvbGxlY3Rpb24sIGlkLCBvYmplY3QpLT5cbiMgXHRcdGlmIG9iamVjdC5lbmFibGVfc3BhY2VfZ2xvYmFsICYmIGNvbGxlY3Rpb24uZmluZCh7IF9pZDogaWQsIHNwYWNlOiAnZ2xvYmFsJ30pLmNvdW50KClcbiMgXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDAsIFwi5LiN6IO95L+u5pS55oiW6ICF5Yig6Zmk5qCH5YeG5a+56LGhXCIpXG5cblxuIyBcdFN0ZWVkb3NPZGF0YUFQSS5hZGRSb3V0ZSgnOm9iamVjdF9uYW1lJywge2F1dGhSZXF1aXJlZDogdHJ1ZSwgc3BhY2VSZXF1aXJlZDogZmFsc2V9LCB7XG4jIFx0XHRnZXQ6ICgpLT5cbiMgXHRcdFx0dHJ5XG4jIFx0XHRcdFx0a2V5ID0gQHVybFBhcmFtcy5vYmplY3RfbmFtZVxuIyBcdFx0XHRcdHNwYWNlSWQgPSBAdXJsUGFyYW1zLnNwYWNlSWRcbiMgXHRcdFx0XHRvYmplY3QgPSBDcmVhdG9yLmdldE9iamVjdChrZXksIHNwYWNlSWQpXG4jIFx0XHRcdFx0aWYgbm90IG9iamVjdD8uZW5hYmxlX2FwaVxuIyBcdFx0XHRcdFx0cmV0dXJuIHtcbiMgXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDAxXG4jIFx0XHRcdFx0XHRcdGJvZHk6c2V0RXJyb3JNZXNzYWdlKDQwMSlcbiMgXHRcdFx0XHRcdH1cbiMgXHRcdFx0XHRjb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKGtleSwgc3BhY2VJZClcbiMgXHRcdFx0XHRpZiBub3QgY29sbGVjdGlvblxuIyBcdFx0XHRcdFx0cmV0dXJuIHtcbiMgXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XG4jIFx0XHRcdFx0XHRcdGJvZHk6c2V0RXJyb3JNZXNzYWdlKDQwNCxjb2xsZWN0aW9uLGtleSlcbiMgXHRcdFx0XHRcdH1cblxuIyBcdFx0XHRcdHJlbW92ZUludmFsaWRNZXRob2QoQHF1ZXJ5UGFyYW1zKVxuIyBcdFx0XHRcdHFzID0gZGVjb2RlVVJJQ29tcG9uZW50KHF1ZXJ5c3RyaW5nLnN0cmluZ2lmeShAcXVlcnlQYXJhbXMpKVxuIyBcdFx0XHRcdGNyZWF0ZVF1ZXJ5ID0gaWYgcXMgdGhlbiBvZGF0YVY0TW9uZ29kYi5jcmVhdGVRdWVyeShxcykgZWxzZSBvZGF0YVY0TW9uZ29kYi5jcmVhdGVRdWVyeSgpXG4jIFx0XHRcdFx0cGVybWlzc2lvbnMgPSBDcmVhdG9yLmdldE9iamVjdFBlcm1pc3Npb25zKHNwYWNlSWQsIEB1c2VySWQsIGtleSlcbiMgXHRcdFx0XHRpZiBwZXJtaXNzaW9ucy52aWV3QWxsUmVjb3JkcyBvciAocGVybWlzc2lvbnMudmlld0NvbXBhbnlSZWNvcmRzICYmIGlzU2FtZUNvbXBhbnkoc3BhY2VJZCwgQHVzZXJJZCwgY3JlYXRlUXVlcnkucXVlcnkuY29tcGFueV9pZCwgY3JlYXRlUXVlcnkucXVlcnkpKSBvciAocGVybWlzc2lvbnMuYWxsb3dSZWFkIGFuZCBAdXNlcklkKVxuXG4jIFx0XHRcdFx0XHRpZiBrZXkgaXMgJ2Nmcy5maWxlcy5maWxlcmVjb3JkJ1xuIyBcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5xdWVyeVsnbWV0YWRhdGEuc3BhY2UnXSA9IHNwYWNlSWRcbiMgXHRcdFx0XHRcdGVsc2UgaWYga2V5IGlzICdzcGFjZXMnXG4jIFx0XHRcdFx0XHRcdGlmIHNwYWNlSWQgaXNudCAnZ3Vlc3QnXG4jIFx0XHRcdFx0XHRcdFx0Y3JlYXRlUXVlcnkucXVlcnkuX2lkID0gc3BhY2VJZFxuIyBcdFx0XHRcdFx0ZWxzZVxuIyBcdFx0XHRcdFx0XHRpZiBzcGFjZUlkIGlzbnQgJ2d1ZXN0JyBhbmQga2V5ICE9IFwidXNlcnNcIiBhbmQgY3JlYXRlUXVlcnkucXVlcnkuc3BhY2UgaXNudCAnZ2xvYmFsJ1xuIyBcdFx0XHRcdFx0XHRcdGNyZWF0ZVF1ZXJ5LnF1ZXJ5LnNwYWNlID0gc3BhY2VJZFxuXG4jIFx0XHRcdFx0XHRpZiBDcmVhdG9yLmlzQ29tbW9uU3BhY2Uoc3BhY2VJZClcbiMgXHRcdFx0XHRcdFx0aWYgQ3JlYXRvci5pc1NwYWNlQWRtaW4oc3BhY2VJZCwgQHVzZXJJZClcbiMgXHRcdFx0XHRcdFx0XHRpZiBrZXkgaXMgJ3NwYWNlcydcbiMgXHRcdFx0XHRcdFx0XHRcdGRlbGV0ZSBjcmVhdGVRdWVyeS5xdWVyeS5faWRcbiMgXHRcdFx0XHRcdFx0XHRlbHNlXG4jIFx0XHRcdFx0XHRcdFx0XHRkZWxldGUgY3JlYXRlUXVlcnkucXVlcnkuc3BhY2VcbiMgXHRcdFx0XHRcdFx0ZWxzZVxuIyBcdFx0XHRcdFx0XHRcdHVzZXJfc3BhY2VzID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwic3BhY2VfdXNlcnNcIikuZmluZCh7dXNlcjogQHVzZXJJZH0sIHtmaWVsZHM6IHtzcGFjZTogMX19KS5mZXRjaCgpXG4jIFx0XHRcdFx0XHRcdFx0aWYga2V5IGlzICdzcGFjZXMnXG4jIFx0XHRcdFx0XHRcdFx0XHQjIHNwYWNlIOWvueaJgOacieeUqOaIt+iusOW9leS4uuWPquivu1xuIyBcdFx0XHRcdFx0XHRcdFx0ZGVsZXRlIGNyZWF0ZVF1ZXJ5LnF1ZXJ5Ll9pZFxuIyBcdFx0XHRcdFx0XHRcdFx0IyBjcmVhdGVRdWVyeS5xdWVyeS5faWQgPSB7JGluOiBfLnBsdWNrKHVzZXJfc3BhY2VzLCAnc3BhY2UnKX1cbiMgXHRcdFx0XHRcdFx0XHRlbHNlXG4jIFx0XHRcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5xdWVyeS5zcGFjZSA9IHskaW46IF8ucGx1Y2sodXNlcl9zcGFjZXMsICdzcGFjZScpfVxuXG4jIFx0XHRcdFx0XHRpZiBub3QgY3JlYXRlUXVlcnkuc29ydCBvciAhXy5zaXplKGNyZWF0ZVF1ZXJ5LnNvcnQpXG4jIFx0XHRcdFx0XHRcdGNyZWF0ZVF1ZXJ5LnNvcnQgPSB7IG1vZGlmaWVkOiAtMSB9XG4jIFx0XHRcdFx0XHRpc19lbnRlcnByaXNlID0gU3RlZWRvcy5pc0xlZ2FsVmVyc2lvbihzcGFjZUlkLFwid29ya2Zsb3cuZW50ZXJwcmlzZVwiKVxuIyBcdFx0XHRcdFx0aXNfcHJvZmVzc2lvbmFsID0gU3RlZWRvcy5pc0xlZ2FsVmVyc2lvbihzcGFjZUlkLFwid29ya2Zsb3cucHJvZmVzc2lvbmFsXCIpXG4jIFx0XHRcdFx0XHRpc19zdGFuZGFyZCA9IFN0ZWVkb3MuaXNMZWdhbFZlcnNpb24oc3BhY2VJZCxcIndvcmtmbG93LnN0YW5kYXJkXCIpXG4jIFx0XHRcdFx0XHRpZiBjcmVhdGVRdWVyeS5saW1pdFxuIyBcdFx0XHRcdFx0XHRsaW1pdCA9IGNyZWF0ZVF1ZXJ5LmxpbWl0XG4jIFx0XHRcdFx0XHRcdGlmIGlzX2VudGVycHJpc2UgYW5kIGxpbWl0PjEwMDAwMFxuIyBcdFx0XHRcdFx0XHRcdGNyZWF0ZVF1ZXJ5LmxpbWl0ID0gMTAwMDAwXG4jIFx0XHRcdFx0XHRcdGVsc2UgaWYgaXNfcHJvZmVzc2lvbmFsIGFuZCBsaW1pdD4xMDAwMCBhbmQgIWlzX2VudGVycHJpc2VcbiMgXHRcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5saW1pdCA9IDEwMDAwXG4jIFx0XHRcdFx0XHRcdGVsc2UgaWYgaXNfc3RhbmRhcmQgYW5kIGxpbWl0PjEwMDAgYW5kICFpc19wcm9mZXNzaW9uYWwgYW5kICFpc19lbnRlcnByaXNlXG4jIFx0XHRcdFx0XHRcdFx0Y3JlYXRlUXVlcnkubGltaXQgPSAxMDAwXG4jIFx0XHRcdFx0XHRlbHNlXG4jIFx0XHRcdFx0XHRcdGlmIGlzX2VudGVycHJpc2VcbiMgXHRcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5saW1pdCA9IDEwMDAwMFxuIyBcdFx0XHRcdFx0XHRlbHNlIGlmIGlzX3Byb2Zlc3Npb25hbCBhbmQgIWlzX2VudGVycHJpc2VcbiMgXHRcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5saW1pdCA9IDEwMDAwXG4jIFx0XHRcdFx0XHRcdGVsc2UgaWYgaXNfc3RhbmRhcmQgYW5kICFpc19lbnRlcnByaXNlIGFuZCAhaXNfcHJvZmVzc2lvbmFsXG4jIFx0XHRcdFx0XHRcdFx0Y3JlYXRlUXVlcnkubGltaXQgPSAxMDAwXG4jIFx0XHRcdFx0XHR1bnJlYWRhYmxlX2ZpZWxkcyA9IHBlcm1pc3Npb25zLnVucmVhZGFibGVfZmllbGRzIHx8IFtdXG4jIFx0XHRcdFx0XHRpZiBjcmVhdGVRdWVyeS5wcm9qZWN0aW9uXG4jIFx0XHRcdFx0XHRcdHByb2plY3Rpb24gPSB7fVxuIyBcdFx0XHRcdFx0XHRfLmtleXMoY3JlYXRlUXVlcnkucHJvamVjdGlvbikuZm9yRWFjaCAoa2V5KS0+XG4jIFx0XHRcdFx0XHRcdFx0aWYgXy5pbmRleE9mKHVucmVhZGFibGVfZmllbGRzLCBrZXkpIDwgMFxuIyBcdFx0XHRcdFx0XHRcdFx0I2lmIG5vdCAoKGZpZWxkc1trZXldPy50eXBlID09ICdsb29rdXAnIG9yIGZpZWxkc1trZXldPy50eXBlID09ICdtYXN0ZXJfZGV0YWlsJykgYW5kIGZpZWxkc1trZXldLm11bHRpcGxlKVxuIyBcdFx0XHRcdFx0XHRcdFx0cHJvamVjdGlvbltrZXldID0gMVxuIyBcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5wcm9qZWN0aW9uID0gcHJvamVjdGlvblxuIyBcdFx0XHRcdFx0aWYgbm90IGNyZWF0ZVF1ZXJ5LnByb2plY3Rpb24gb3IgIV8uc2l6ZShjcmVhdGVRdWVyeS5wcm9qZWN0aW9uKVxuIyBcdFx0XHRcdFx0XHRyZWFkYWJsZV9maWVsZHMgPSBDcmVhdG9yLmdldEZpZWxkcyhrZXksIHNwYWNlSWQsIEB1c2VySWQpXG4jIFx0XHRcdFx0XHRcdGZpZWxkcyA9IENyZWF0b3IuZ2V0T2JqZWN0KGtleSwgc3BhY2VJZCkuZmllbGRzXG4jIFx0XHRcdFx0XHRcdF8uZWFjaCByZWFkYWJsZV9maWVsZHMsIChmaWVsZCktPlxuIyBcdFx0XHRcdFx0XHRcdGlmIGZpZWxkLmluZGV4T2YoJyQnKSA8IDBcbiMgXHRcdFx0XHRcdFx0XHRcdCNpZiBmaWVsZHNbZmllbGRdPy5tdWx0aXBsZSE9IHRydWVcbiMgXHRcdFx0XHRcdFx0XHRcdGNyZWF0ZVF1ZXJ5LnByb2plY3Rpb25bZmllbGRdID0gMVxuIyBcdFx0XHRcdFx0aWYgbm90IHBlcm1pc3Npb25zLnZpZXdBbGxSZWNvcmRzICYmICFwZXJtaXNzaW9ucy52aWV3Q29tcGFueVJlY29yZHNcbiMgXHRcdFx0XHRcdFx0aWYgb2JqZWN0LmVuYWJsZV9zaGFyZVxuIyBcdFx0XHRcdFx0XHRcdCMg5ruh6Laz5YWx5Lqr6KeE5YiZ5Lit55qE6K6w5b2V5Lmf6KaB5pCc57Si5Ye65p2lXG4jIFx0XHRcdFx0XHRcdFx0ZGVsZXRlIGNyZWF0ZVF1ZXJ5LnF1ZXJ5Lm93bmVyXG4jIFx0XHRcdFx0XHRcdFx0c2hhcmVzID0gW11cbiMgXHRcdFx0XHRcdFx0XHRvcmdzID0gU3RlZWRvcy5nZXRVc2VyT3JnYW5pemF0aW9ucyhzcGFjZUlkLCBAdXNlcklkLCB0cnVlKVxuIyBcdFx0XHRcdFx0XHRcdHNoYXJlcy5wdXNoIHtcIm93bmVyXCI6IEB1c2VySWR9XG4jIFx0XHRcdFx0XHRcdFx0c2hhcmVzLnB1c2ggeyBcInNoYXJpbmcudVwiOiBAdXNlcklkIH1cbiMgXHRcdFx0XHRcdFx0XHRzaGFyZXMucHVzaCB7IFwic2hhcmluZy5vXCI6IHsgJGluOiBvcmdzIH0gfVxuIyBcdFx0XHRcdFx0XHRcdGNyZWF0ZVF1ZXJ5LnF1ZXJ5W1wiJG9yXCJdID0gc2hhcmVzXG4jIFx0XHRcdFx0XHRcdGVsc2VcbiMgXHRcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5xdWVyeS5vd25lciA9IEB1c2VySWRcbiMgXHRcdFx0XHRcdGVudGl0aWVzID0gW11cblxuIyBcdFx0XHRcdFx0ZXhjbHVkZURlbGV0ZWQoY3JlYXRlUXVlcnkucXVlcnkpXG5cbiMgXHRcdFx0XHRcdGlmIEBxdWVyeVBhcmFtcy4kdG9wIGlzbnQgJzAnXG4jIFx0XHRcdFx0XHRcdGVudGl0aWVzID0gY29sbGVjdGlvbi5maW5kKGNyZWF0ZVF1ZXJ5LnF1ZXJ5LCB2aXNpdG9yUGFyc2VyKGNyZWF0ZVF1ZXJ5KSkuZmV0Y2goKVxuIyBcdFx0XHRcdFx0c2Nhbm5lZENvdW50ID0gY29sbGVjdGlvbi5maW5kKGNyZWF0ZVF1ZXJ5LnF1ZXJ5LHtmaWVsZHM6e19pZDogMX19KS5jb3VudCgpXG4jIFx0XHRcdFx0XHRpZiBlbnRpdGllc1xuIyBcdFx0XHRcdFx0XHRkZWFsV2l0aEV4cGFuZChjcmVhdGVRdWVyeSwgZW50aXRpZXMsIGtleSwgc3BhY2VJZClcbiMgXHRcdFx0XHRcdFx0I3NjYW5uZWRDb3VudCA9IGVudGl0aWVzLmxlbmd0aFxuIyBcdFx0XHRcdFx0XHRib2R5ID0ge31cbiMgXHRcdFx0XHRcdFx0aGVhZGVycyA9IHt9XG4jIFx0XHRcdFx0XHRcdGJvZHlbJ0BvZGF0YS5jb250ZXh0J10gPSBTdGVlZG9zT0RhdGEuZ2V0T0RhdGFDb250ZXh0UGF0aChzcGFjZUlkLCBrZXkpXG4jIFx0XHRcdFx0XHQjXHRib2R5WydAb2RhdGEubmV4dExpbmsnXSA9IFN0ZWVkb3NPRGF0YS5nZXRPRGF0YU5leHRMaW5rUGF0aChzcGFjZUlkLGtleSkrXCI/JTI0c2tpcD1cIisgMTBcbiMgXHRcdFx0XHRcdFx0Ym9keVsnQG9kYXRhLmNvdW50J10gPSBzY2FubmVkQ291bnRcbiMgXHRcdFx0XHRcdFx0ZW50aXRpZXNfT2RhdGFQcm9wZXJ0aWVzID0gc2V0T2RhdGFQcm9wZXJ0eShlbnRpdGllcyxzcGFjZUlkLCBrZXkpXG4jIFx0XHRcdFx0XHRcdGJvZHlbJ3ZhbHVlJ10gPSBlbnRpdGllc19PZGF0YVByb3BlcnRpZXNcbiMgXHRcdFx0XHRcdFx0aGVhZGVyc1snQ29udGVudC10eXBlJ10gPSAnYXBwbGljYXRpb24vanNvbjtvZGF0YS5tZXRhZGF0YT1taW5pbWFsO2NoYXJzZXQ9dXRmLTgnXG4jIFx0XHRcdFx0XHRcdGhlYWRlcnNbJ09EYXRhLVZlcnNpb24nXSA9IFN0ZWVkb3NPRGF0YS5WRVJTSU9OXG4jIFx0XHRcdFx0XHRcdHtib2R5OiBib2R5LCBoZWFkZXJzOiBoZWFkZXJzfVxuIyBcdFx0XHRcdFx0ZWxzZVxuIyBcdFx0XHRcdFx0XHRyZXR1cm57XG4jIFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XG4jIFx0XHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwNCxjb2xsZWN0aW9uLGtleSlcbiMgXHRcdFx0XHRcdFx0fVxuIyBcdFx0XHRcdGVsc2VcbiMgXHRcdFx0XHRcdHJldHVybntcbiMgXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDAzXG4jIFx0XHRcdFx0XHRcdGJvZHk6IHNldEVycm9yTWVzc2FnZSg0MDMsY29sbGVjdGlvbixrZXksXCJnZXRcIilcbiMgXHRcdFx0XHRcdH1cbiMgXHRcdFx0Y2F0Y2ggZVxuIyBcdFx0XHRcdHJldHVybiBoYW5kbGVFcnJvciBlXG5cbiMgXHRcdHBvc3Q6ICgpLT5cbiMgXHRcdFx0dHJ5XG4jIFx0XHRcdFx0a2V5ID0gQHVybFBhcmFtcy5vYmplY3RfbmFtZVxuIyBcdFx0XHRcdHNwYWNlSWQgPSBAdXJsUGFyYW1zLnNwYWNlSWRcbiMgXHRcdFx0XHRpZiBub3QgQ3JlYXRvci5nZXRPYmplY3Qoa2V5LCBzcGFjZUlkKT8uZW5hYmxlX2FwaVxuIyBcdFx0XHRcdFx0cmV0dXJuIHtcbiMgXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDAxXG4jIFx0XHRcdFx0XHRcdGJvZHk6c2V0RXJyb3JNZXNzYWdlKDQwMSlcbiMgXHRcdFx0XHR9XG5cbiMgXHRcdFx0XHRjb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKGtleSwgc3BhY2VJZClcbiMgXHRcdFx0XHRpZiBub3QgY29sbGVjdGlvblxuIyBcdFx0XHRcdFx0cmV0dXJuIHtcbiMgXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XG4jIFx0XHRcdFx0XHRcdGJvZHk6c2V0RXJyb3JNZXNzYWdlKDQwNCxjb2xsZWN0aW9uLGtleSlcbiMgXHRcdFx0XHRcdH1cbiMgXHRcdFx0XHRwZXJtaXNzaW9ucyA9IENyZWF0b3IuZ2V0T2JqZWN0UGVybWlzc2lvbnMoc3BhY2VJZCwgQHVzZXJJZCwga2V5KVxuIyBcdFx0XHRcdGlmIHBlcm1pc3Npb25zLmFsbG93Q3JlYXRlXG4jIFx0XHRcdFx0XHRAYm9keVBhcmFtcy5zcGFjZSA9IHNwYWNlSWRcbiMgXHRcdFx0XHRcdGlmIHNwYWNlSWQgaXMgJ2d1ZXN0J1xuIyBcdFx0XHRcdFx0XHRkZWxldGUgQGJvZHlQYXJhbXMuc3BhY2VcbiMgXHRcdFx0XHRcdGVudGl0eUlkID0gY29sbGVjdGlvbi5pbnNlcnQgQGJvZHlQYXJhbXNcbiMgXHRcdFx0XHRcdGVudGl0eSA9IGNvbGxlY3Rpb24uZmluZE9uZSBlbnRpdHlJZFxuIyBcdFx0XHRcdFx0ZW50aXRpZXMgPSBbXVxuIyBcdFx0XHRcdFx0aWYgZW50aXR5XG4jIFx0XHRcdFx0XHRcdGJvZHkgPSB7fVxuIyBcdFx0XHRcdFx0XHRoZWFkZXJzID0ge31cbiMgXHRcdFx0XHRcdFx0ZW50aXRpZXMucHVzaCBlbnRpdHlcbiMgXHRcdFx0XHRcdFx0Ym9keVsnQG9kYXRhLmNvbnRleHQnXSA9IFN0ZWVkb3NPRGF0YS5nZXRPRGF0YUNvbnRleHRQYXRoKHNwYWNlSWQsIGtleSkgKyAnLyRlbnRpdHknXG4jIFx0XHRcdFx0XHRcdGVudGl0eV9PZGF0YVByb3BlcnRpZXMgPSBzZXRPZGF0YVByb3BlcnR5KGVudGl0aWVzLHNwYWNlSWQsIGtleSlcbiMgXHRcdFx0XHRcdFx0Ym9keVsndmFsdWUnXSA9IGVudGl0eV9PZGF0YVByb3BlcnRpZXNcbiMgXHRcdFx0XHRcdFx0aGVhZGVyc1snQ29udGVudC10eXBlJ10gPSAnYXBwbGljYXRpb24vanNvbjtvZGF0YS5tZXRhZGF0YT1taW5pbWFsO2NoYXJzZXQ9dXRmLTgnXG4jIFx0XHRcdFx0XHRcdGhlYWRlcnNbJ09EYXRhLVZlcnNpb24nXSA9IFN0ZWVkb3NPRGF0YS5WRVJTSU9OXG4jIFx0XHRcdFx0XHRcdHtib2R5OiBib2R5LCBoZWFkZXJzOiBoZWFkZXJzfVxuIyBcdFx0XHRcdFx0ZWxzZVxuIyBcdFx0XHRcdFx0XHRyZXR1cm57XG4jIFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XG4jIFx0XHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwNCxjb2xsZWN0aW9uLGtleSwncG9zdCcpXG4jIFx0XHRcdFx0XHRcdH1cbiMgXHRcdFx0XHRlbHNlXG4jIFx0XHRcdFx0XHRyZXR1cm57XG4jIFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwM1xuIyBcdFx0XHRcdFx0XHRib2R5OiBzZXRFcnJvck1lc3NhZ2UoNDAzLGNvbGxlY3Rpb24sa2V5LCdwb3N0JylcbiMgXHRcdFx0XHRcdH1cbiMgXHRcdFx0Y2F0Y2ggZVxuIyBcdFx0XHRcdHJldHVybiBoYW5kbGVFcnJvciBlXG5cbiMgXHR9KVxuIyBcdFN0ZWVkb3NPZGF0YUFQSS5hZGRSb3V0ZSgnOm9iamVjdF9uYW1lL3JlY2VudCcsIHthdXRoUmVxdWlyZWQ6IHRydWUsIHNwYWNlUmVxdWlyZWQ6IGZhbHNlfSwge1xuIyBcdFx0Z2V0OigpLT5cbiMgXHRcdFx0dHJ5XG4jIFx0XHRcdFx0a2V5ID0gQHVybFBhcmFtcy5vYmplY3RfbmFtZVxuIyBcdFx0XHRcdG9iamVjdCA9IENyZWF0b3IuZ2V0T2JqZWN0KGtleSwgQHVybFBhcmFtcy5zcGFjZUlkKVxuIyBcdFx0XHRcdGlmIG5vdCBvYmplY3Q/LmVuYWJsZV9hcGlcbiMgXHRcdFx0XHRcdHJldHVybntcbiMgXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDAxXG4jIFx0XHRcdFx0XHRcdGJvZHk6IHNldEVycm9yTWVzc2FnZSg0MDEpXG4jIFx0XHRcdFx0XHR9XG4jIFx0XHRcdFx0Y29sbGVjdGlvbiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihrZXksIEB1cmxQYXJhbXMuc3BhY2VJZClcbiMgXHRcdFx0XHRpZiBub3QgY29sbGVjdGlvblxuIyBcdFx0XHRcdFx0cmV0dXJuIHtcbiMgXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XG4jIFx0XHRcdFx0XHRcdGJvZHk6IHNldEVycm9yTWVzc2FnZSg0MDQsY29sbGVjdGlvbixrZXkpXG4jIFx0XHRcdFx0XHR9XG4jIFx0XHRcdFx0cGVybWlzc2lvbnMgPSBDcmVhdG9yLmdldE9iamVjdFBlcm1pc3Npb25zKEB1cmxQYXJhbXMuc3BhY2VJZCwgQHVzZXJJZCwga2V5KVxuIyBcdFx0XHRcdGlmIHBlcm1pc3Npb25zLmFsbG93UmVhZFxuIyBcdFx0XHRcdFx0cmVjZW50X3ZpZXdfY29sbGVjdGlvbiA9IENyZWF0b3IuQ29sbGVjdGlvbnNbXCJvYmplY3RfcmVjZW50X3ZpZXdlZFwiXVxuIyBcdFx0XHRcdFx0cmVjZW50X3ZpZXdfc2VsZWN0b3IgPSB7XCJyZWNvcmQub1wiOmtleSxjcmVhdGVkX2J5OkB1c2VySWR9XG4jIFx0XHRcdFx0XHRyZWNlbnRfdmlld19vcHRpb25zID0ge31cbiMgXHRcdFx0XHRcdHJlY2VudF92aWV3X29wdGlvbnMuc29ydCA9IHtjcmVhdGVkOiAtMX1cbiMgXHRcdFx0XHRcdHJlY2VudF92aWV3X29wdGlvbnMuZmllbGRzID0ge3JlY29yZDoxfVxuIyBcdFx0XHRcdFx0cmVjZW50X3ZpZXdfcmVjb3JkcyA9IHJlY2VudF92aWV3X2NvbGxlY3Rpb24uZmluZChyZWNlbnRfdmlld19zZWxlY3RvcixyZWNlbnRfdmlld19vcHRpb25zKS5mZXRjaCgpXG4jIFx0XHRcdFx0XHRyZWNlbnRfdmlld19yZWNvcmRzX2lkcyA9IF8ucGx1Y2socmVjZW50X3ZpZXdfcmVjb3JkcywncmVjb3JkJylcbiMgXHRcdFx0XHRcdHJlY2VudF92aWV3X3JlY29yZHNfaWRzID0gcmVjZW50X3ZpZXdfcmVjb3Jkc19pZHMuZ2V0UHJvcGVydHkoXCJpZHNcIilcbiMgXHRcdFx0XHRcdHJlY2VudF92aWV3X3JlY29yZHNfaWRzID0gXy5mbGF0dGVuKHJlY2VudF92aWV3X3JlY29yZHNfaWRzKVxuIyBcdFx0XHRcdFx0cmVjZW50X3ZpZXdfcmVjb3Jkc19pZHMgPSBfLnVuaXEocmVjZW50X3ZpZXdfcmVjb3Jkc19pZHMpXG4jIFx0XHRcdFx0XHRyZW1vdmVJbnZhbGlkTWV0aG9kKEBxdWVyeVBhcmFtcylcbiMgXHRcdFx0XHRcdHFzID0gZGVjb2RlVVJJQ29tcG9uZW50KHF1ZXJ5c3RyaW5nLnN0cmluZ2lmeShAcXVlcnlQYXJhbXMpKVxuIyBcdFx0XHRcdFx0Y3JlYXRlUXVlcnkgPSBpZiBxcyB0aGVuIG9kYXRhVjRNb25nb2RiLmNyZWF0ZVF1ZXJ5KHFzKSBlbHNlIG9kYXRhVjRNb25nb2RiLmNyZWF0ZVF1ZXJ5KClcbiMgXHRcdFx0XHRcdGlmIGtleSBpcyAnY2ZzLmZpbGVzLmZpbGVyZWNvcmQnXG4jIFx0XHRcdFx0XHRcdGNyZWF0ZVF1ZXJ5LnF1ZXJ5WydtZXRhZGF0YS5zcGFjZSddID0gQHVybFBhcmFtcy5zcGFjZUlkXG4jIFx0XHRcdFx0XHRlbHNlXG4jIFx0XHRcdFx0XHRcdGNyZWF0ZVF1ZXJ5LnF1ZXJ5LnNwYWNlID0gQHVybFBhcmFtcy5zcGFjZUlkXG4jIFx0XHRcdFx0XHRpZiBub3QgY3JlYXRlUXVlcnkubGltaXRcbiMgXHRcdFx0XHRcdFx0Y3JlYXRlUXVlcnkubGltaXQgPSAxMDBcbiMgXHRcdFx0XHRcdGlmIGNyZWF0ZVF1ZXJ5LmxpbWl0IGFuZCByZWNlbnRfdmlld19yZWNvcmRzX2lkcy5sZW5ndGg+Y3JlYXRlUXVlcnkubGltaXRcbiMgXHRcdFx0XHRcdFx0cmVjZW50X3ZpZXdfcmVjb3Jkc19pZHMgPSBfLmZpcnN0KHJlY2VudF92aWV3X3JlY29yZHNfaWRzLGNyZWF0ZVF1ZXJ5LmxpbWl0KVxuIyBcdFx0XHRcdFx0Y3JlYXRlUXVlcnkucXVlcnkuX2lkID0geyRpbjpyZWNlbnRfdmlld19yZWNvcmRzX2lkc31cbiMgXHRcdFx0XHRcdHVucmVhZGFibGVfZmllbGRzID0gcGVybWlzc2lvbnMudW5yZWFkYWJsZV9maWVsZHMgfHwgW11cbiMgXHRcdFx0XHRcdGlmIGNyZWF0ZVF1ZXJ5LnByb2plY3Rpb25cbiMgXHRcdFx0XHRcdFx0cHJvamVjdGlvbiA9IHt9XG4jIFx0XHRcdFx0XHRcdF8ua2V5cyhjcmVhdGVRdWVyeS5wcm9qZWN0aW9uKS5mb3JFYWNoIChrZXkpLT5cbiMgXHRcdFx0XHRcdFx0XHRpZiBfLmluZGV4T2YodW5yZWFkYWJsZV9maWVsZHMsIGtleSkgPCAwXG4jIFx0XHRcdFx0XHRcdFx0XHQjIGlmIG5vdCAoKGZpZWxkc1trZXldPy50eXBlID09ICdsb29rdXAnIG9yIGZpZWxkc1trZXldPy50eXBlID09ICdtYXN0ZXJfZGV0YWlsJykgYW5kIGZpZWxkc1trZXldLm11bHRpcGxlKVxuIyBcdFx0XHRcdFx0XHRcdFx0cHJvamVjdGlvbltrZXldID0gMVxuIyBcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5wcm9qZWN0aW9uID0gcHJvamVjdGlvblxuIyBcdFx0XHRcdFx0aWYgbm90IGNyZWF0ZVF1ZXJ5LnByb2plY3Rpb24gb3IgIV8uc2l6ZShjcmVhdGVRdWVyeS5wcm9qZWN0aW9uKVxuIyBcdFx0XHRcdFx0XHRyZWFkYWJsZV9maWVsZHMgPSBDcmVhdG9yLmdldEZpZWxkcyhrZXksIEB1cmxQYXJhbXMuc3BhY2VJZCwgQHVzZXJJZClcbiMgXHRcdFx0XHRcdFx0ZmllbGRzID0gQ3JlYXRvci5nZXRPYmplY3Qoa2V5LCBAdXJsUGFyYW1zLnNwYWNlSWQpLmZpZWxkc1xuIyBcdFx0XHRcdFx0XHRfLmVhY2ggcmVhZGFibGVfZmllbGRzLCAoZmllbGQpLT5cbiMgXHRcdFx0XHRcdFx0XHRpZiBmaWVsZC5pbmRleE9mKCckJykgPCAwXG4jIFx0XHRcdFx0XHRcdFx0XHQjaWYgZmllbGRzW2ZpZWxkXT8ubXVsdGlwbGUhPSB0cnVlXG4jIFx0XHRcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5wcm9qZWN0aW9uW2ZpZWxkXSA9IDFcblxuIyBcdFx0XHRcdFx0ZXhjbHVkZURlbGV0ZWQoY3JlYXRlUXVlcnkucXVlcnkpXG5cbiMgXHRcdFx0XHRcdGlmIEBxdWVyeVBhcmFtcy4kdG9wIGlzbnQgJzAnXG4jIFx0XHRcdFx0XHRcdGVudGl0aWVzID0gY29sbGVjdGlvbi5maW5kKGNyZWF0ZVF1ZXJ5LnF1ZXJ5LCB2aXNpdG9yUGFyc2VyKGNyZWF0ZVF1ZXJ5KSkuZmV0Y2goKVxuIyBcdFx0XHRcdFx0ZW50aXRpZXNfaW5kZXggPSBbXVxuIyBcdFx0XHRcdFx0ZW50aXRpZXNfaWRzID0gXy5wbHVjayhlbnRpdGllcywnX2lkJylcbiMgXHRcdFx0XHRcdHNvcnRfZW50aXRpZXMgPSBbXVxuIyBcdFx0XHRcdFx0aWYgbm90IGNyZWF0ZVF1ZXJ5LnNvcnQgb3IgIV8uc2l6ZShjcmVhdGVRdWVyeS5zb3J0KVxuIyBcdFx0XHRcdFx0XHRfLmVhY2ggcmVjZW50X3ZpZXdfcmVjb3Jkc19pZHMgLChyZWNlbnRfdmlld19yZWNvcmRzX2lkKS0+XG4jIFx0XHRcdFx0XHRcdFx0aW5kZXggPSBfLmluZGV4T2YoZW50aXRpZXNfaWRzLHJlY2VudF92aWV3X3JlY29yZHNfaWQpXG4jIFx0XHRcdFx0XHRcdFx0aWYgaW5kZXg+LTFcbiMgXHRcdFx0XHRcdFx0XHRcdHNvcnRfZW50aXRpZXMucHVzaCBlbnRpdGllc1tpbmRleF1cbiMgXHRcdFx0XHRcdGVsc2VcbiMgXHRcdFx0XHRcdFx0c29ydF9lbnRpdGllcyA9IGVudGl0aWVzXG4jIFx0XHRcdFx0XHRpZiBzb3J0X2VudGl0aWVzXG4jIFx0XHRcdFx0XHRcdGRlYWxXaXRoRXhwYW5kKGNyZWF0ZVF1ZXJ5LCBzb3J0X2VudGl0aWVzLCBrZXksIEB1cmxQYXJhbXMuc3BhY2VJZClcbiMgXHRcdFx0XHRcdFx0Ym9keSA9IHt9XG4jIFx0XHRcdFx0XHRcdGhlYWRlcnMgPSB7fVxuIyBcdFx0XHRcdFx0XHRib2R5WydAb2RhdGEuY29udGV4dCddID0gU3RlZWRvc09EYXRhLmdldE9EYXRhQ29udGV4dFBhdGgoQHVybFBhcmFtcy5zcGFjZUlkLCBrZXkpXG4jIFx0XHRcdFx0XHQjXHRib2R5WydAb2RhdGEubmV4dExpbmsnXSA9IFN0ZWVkb3NPRGF0YS5nZXRPRGF0YU5leHRMaW5rUGF0aChAdXJsUGFyYW1zLnNwYWNlSWQsa2V5KStcIj8lMjRza2lwPVwiKyAxMFxuIyBcdFx0XHRcdFx0XHRib2R5WydAb2RhdGEuY291bnQnXSA9IHNvcnRfZW50aXRpZXMubGVuZ3RoXG4jIFx0XHRcdFx0XHRcdGVudGl0aWVzX09kYXRhUHJvcGVydGllcyA9IHNldE9kYXRhUHJvcGVydHkoc29ydF9lbnRpdGllcyxAdXJsUGFyYW1zLnNwYWNlSWQsIGtleSlcbiMgXHRcdFx0XHRcdFx0Ym9keVsndmFsdWUnXSA9IGVudGl0aWVzX09kYXRhUHJvcGVydGllc1xuIyBcdFx0XHRcdFx0XHRoZWFkZXJzWydDb250ZW50LXR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uO29kYXRhLm1ldGFkYXRhPW1pbmltYWw7Y2hhcnNldD11dGYtOCdcbiMgXHRcdFx0XHRcdFx0aGVhZGVyc1snT0RhdGEtVmVyc2lvbiddID0gU3RlZWRvc09EYXRhLlZFUlNJT05cbiMgXHRcdFx0XHRcdFx0e2JvZHk6IGJvZHksIGhlYWRlcnM6IGhlYWRlcnN9XG4jIFx0XHRcdFx0XHRlbHNlXG4jIFx0XHRcdFx0XHRcdHJldHVybntcbiMgXHRcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDRcbiMgXHRcdFx0XHRcdFx0XHRib2R5OiBzZXRFcnJvck1lc3NhZ2UoNDA0LGNvbGxlY3Rpb24sa2V5LCdnZXQnKVxuIyBcdFx0XHRcdFx0XHR9XG4jIFx0XHRcdFx0ZWxzZVxuIyBcdFx0XHRcdFx0cmV0dXJue1xuIyBcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDNcbiMgXHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwMyxjb2xsZWN0aW9uLGtleSwnZ2V0JylcbiMgXHRcdFx0XHRcdH1cbiMgXHRcdFx0Y2F0Y2ggZVxuIyBcdFx0XHRcdHJldHVybiBoYW5kbGVFcnJvciBlXG4jIH0pXG5cbiMgXHRTdGVlZG9zT2RhdGFBUEkuYWRkUm91dGUoJzpvYmplY3RfbmFtZS86X2lkJywge2F1dGhSZXF1aXJlZDogdHJ1ZSwgc3BhY2VSZXF1aXJlZDogZmFsc2V9LCB7XG4jIFx0XHRwb3N0OiAoKS0+XG4jIFx0XHRcdHRyeVxuIyBcdFx0XHRcdGtleSA9IEB1cmxQYXJhbXMub2JqZWN0X25hbWVcbiMgXHRcdFx0XHRpZiBub3QgQ3JlYXRvci5nZXRPYmplY3Qoa2V5LCBAdXJsUGFyYW1zLnNwYWNlSWQpPy5lbmFibGVfYXBpXG4jIFx0XHRcdFx0XHRyZXR1cm57XG4jIFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwMVxuIyBcdFx0XHRcdFx0XHRib2R5OiBzZXRFcnJvck1lc3NhZ2UoNDAxKVxuIyBcdFx0XHRcdFx0fVxuIyBcdFx0XHRcdGNvbGxlY3Rpb24gPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oa2V5LCBAdXJsUGFyYW1zLnNwYWNlSWQpXG4jIFx0XHRcdFx0aWYgbm90IGNvbGxlY3Rpb25cbiMgXHRcdFx0XHRcdHJldHVybntcbiMgXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XG4jIFx0XHRcdFx0XHRcdGJvZHk6IHNldEVycm9yTWVzc2FnZSg0MDQsY29sbGVjdGlvbixrZXkpXG4jIFx0XHRcdFx0XHR9XG4jIFx0XHRcdFx0cGVybWlzc2lvbnMgPSBDcmVhdG9yLmdldE9iamVjdFBlcm1pc3Npb25zKEB1cmxQYXJhbXMuc3BhY2VJZCwgQHVzZXJJZCwga2V5KVxuIyBcdFx0XHRcdGlmIHBlcm1pc3Npb25zLmFsbG93Q3JlYXRlXG4jIFx0XHRcdFx0XHRAYm9keVBhcmFtcy5zcGFjZSA9IEB1cmxQYXJhbXMuc3BhY2VJZFxuIyBcdFx0XHRcdFx0ZW50aXR5SWQgPSBjb2xsZWN0aW9uLmluc2VydCBAYm9keVBhcmFtc1xuIyBcdFx0XHRcdFx0ZW50aXR5ID0gY29sbGVjdGlvbi5maW5kT25lIGVudGl0eUlkXG4jIFx0XHRcdFx0XHRlbnRpdGllcyA9IFtdXG4jIFx0XHRcdFx0XHRpZiBlbnRpdHlcbiMgXHRcdFx0XHRcdFx0Ym9keSA9IHt9XG4jIFx0XHRcdFx0XHRcdGhlYWRlcnMgPSB7fVxuIyBcdFx0XHRcdFx0XHRlbnRpdGllcy5wdXNoIGVudGl0eVxuIyBcdFx0XHRcdFx0XHRib2R5WydAb2RhdGEuY29udGV4dCddID0gU3RlZWRvc09EYXRhLmdldE9EYXRhQ29udGV4dFBhdGgoQHVybFBhcmFtcy5zcGFjZUlkLCBrZXkpICsgJy8kZW50aXR5J1xuIyBcdFx0XHRcdFx0XHRlbnRpdHlfT2RhdGFQcm9wZXJ0aWVzID0gc2V0T2RhdGFQcm9wZXJ0eShlbnRpdGllcyxAdXJsUGFyYW1zLnNwYWNlSWQsIGtleSlcbiMgXHRcdFx0XHRcdFx0Ym9keVsndmFsdWUnXSA9IGVudGl0eV9PZGF0YVByb3BlcnRpZXNcbiMgXHRcdFx0XHRcdFx0aGVhZGVyc1snQ29udGVudC10eXBlJ10gPSAnYXBwbGljYXRpb24vanNvbjtvZGF0YS5tZXRhZGF0YT1taW5pbWFsO2NoYXJzZXQ9dXRmLTgnXG4jIFx0XHRcdFx0XHRcdGhlYWRlcnNbJ09EYXRhLVZlcnNpb24nXSA9IFN0ZWVkb3NPRGF0YS5WRVJTSU9OXG4jIFx0XHRcdFx0XHRcdHtib2R5OiBib2R5LCBoZWFkZXJzOiBoZWFkZXJzfVxuIyBcdFx0XHRcdFx0ZWxzZVxuIyBcdFx0XHRcdFx0XHRyZXR1cm57XG4jIFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XG4jIFx0XHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwNCxjb2xsZWN0aW9uLGtleSwncG9zdCcpXG4jIFx0XHRcdFx0XHRcdH1cbiMgXHRcdFx0XHRlbHNlXG4jIFx0XHRcdFx0XHRyZXR1cm57XG4jIFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwM1xuIyBcdFx0XHRcdFx0XHRib2R5OiBzZXRFcnJvck1lc3NhZ2UoNDAzLGNvbGxlY3Rpb24sa2V5LCdwb3N0JylcbiMgXHRcdFx0XHRcdH1cbiMgXHRcdFx0Y2F0Y2ggZVxuIyBcdFx0XHRcdHJldHVybiBoYW5kbGVFcnJvciBlXG4jIFx0XHRnZXQ6KCktPlxuIyBcdFx0XHRrZXkgPSBAdXJsUGFyYW1zLm9iamVjdF9uYW1lXG4jIFx0XHRcdGlmIGtleS5pbmRleE9mKFwiKFwiKSA+IC0xXG4jIFx0XHRcdFx0Ym9keSA9IHt9XG4jIFx0XHRcdFx0aGVhZGVycyA9IHt9XG4jIFx0XHRcdFx0Y29sbGVjdGlvbkluZm8gPSBrZXlcbiMgXHRcdFx0XHRmaWVsZE5hbWUgPSBAdXJsUGFyYW1zLl9pZC5zcGxpdCgnX2V4cGFuZCcpWzBdXG4jIFx0XHRcdFx0Y29sbGVjdGlvbkluZm9TcGxpdCA9IGNvbGxlY3Rpb25JbmZvLnNwbGl0KCcoJylcbiMgXHRcdFx0XHRjb2xsZWN0aW9uTmFtZSA9IGNvbGxlY3Rpb25JbmZvU3BsaXRbMF1cbiMgXHRcdFx0XHRpZCA9IGNvbGxlY3Rpb25JbmZvU3BsaXRbMV0uc3BsaXQoJ1xcJycpWzFdXG5cbiMgXHRcdFx0XHRjb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKGNvbGxlY3Rpb25OYW1lLCBAdXJsUGFyYW1zLnNwYWNlSWQpXG4jIFx0XHRcdFx0ZmllbGRzT3B0aW9ucyA9IHt9XG4jIFx0XHRcdFx0ZmllbGRzT3B0aW9uc1tmaWVsZE5hbWVdID0gMVxuIyBcdFx0XHRcdGVudGl0eSA9IGNvbGxlY3Rpb24uZmluZE9uZSh7X2lkOiBpZH0sIHtmaWVsZHM6IGZpZWxkc09wdGlvbnN9KVxuXG4jIFx0XHRcdFx0ZmllbGRWYWx1ZSA9IG51bGxcbiMgXHRcdFx0XHRpZiBlbnRpdHlcbiMgXHRcdFx0XHRcdGZpZWxkVmFsdWUgPSBlbnRpdHlbZmllbGROYW1lXVxuXG4jIFx0XHRcdFx0b2JqID0gQ3JlYXRvci5nZXRPYmplY3QoY29sbGVjdGlvbk5hbWUsIEB1cmxQYXJhbXMuc3BhY2VJZClcbiMgXHRcdFx0XHRmaWVsZCA9IG9iai5maWVsZHNbZmllbGROYW1lXVxuXG4jIFx0XHRcdFx0aWYgZmllbGQgYW5kIGZpZWxkVmFsdWUgYW5kIChmaWVsZC50eXBlIGlzICdsb29rdXAnIG9yIGZpZWxkLnR5cGUgaXMgJ21hc3Rlcl9kZXRhaWwnKVxuIyBcdFx0XHRcdFx0bG9va3VwQ29sbGVjdGlvbiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihmaWVsZC5yZWZlcmVuY2VfdG8sIEB1cmxQYXJhbXMuc3BhY2VJZClcbiMgXHRcdFx0XHRcdHF1ZXJ5T3B0aW9ucyA9IHtmaWVsZHM6IHt9fVxuIyBcdFx0XHRcdFx0cmVhZGFibGVfZmllbGRzID0gQ3JlYXRvci5nZXRGaWVsZHMoZmllbGQucmVmZXJlbmNlX3RvLCBAdXJsUGFyYW1zLnNwYWNlSWQsIEB1c2VySWQpXG4jIFx0XHRcdFx0XHRfLmVhY2ggcmVhZGFibGVfZmllbGRzLCAoZiktPlxuIyBcdFx0XHRcdFx0XHRpZiBmLmluZGV4T2YoJyQnKSA8IDBcbiMgXHRcdFx0XHRcdFx0XHRxdWVyeU9wdGlvbnMuZmllbGRzW2ZdID0gMVxuXG4jIFx0XHRcdFx0XHRpZiBmaWVsZC5tdWx0aXBsZVxuIyBcdFx0XHRcdFx0XHR2YWx1ZXMgPSBbXVxuIyBcdFx0XHRcdFx0XHRsb29rdXBDb2xsZWN0aW9uLmZpbmQoe19pZDogeyRpbjogZmllbGRWYWx1ZX19LCBxdWVyeU9wdGlvbnMpLmZvckVhY2ggKG9iaiktPlxuIyBcdFx0XHRcdFx0XHRcdF8uZWFjaCBvYmosICh2LCBrKS0+XG4jIFx0XHRcdFx0XHRcdFx0XHRpZiBfLmlzQXJyYXkodikgfHwgKF8uaXNPYmplY3QodikgJiYgIV8uaXNEYXRlKHYpKVxuIyBcdFx0XHRcdFx0XHRcdFx0XHRvYmpba10gPSBKU09OLnN0cmluZ2lmeSh2KVxuIyBcdFx0XHRcdFx0XHRcdHZhbHVlcy5wdXNoKG9iailcbiMgXHRcdFx0XHRcdFx0Ym9keVsndmFsdWUnXSA9IHZhbHVlc1xuIyBcdFx0XHRcdFx0XHRib2R5WydAb2RhdGEuY29udGV4dCddID0gU3RlZWRvc09EYXRhLmdldE1ldGFEYXRhUGF0aChAdXJsUGFyYW1zLnNwYWNlSWQpICsgXCIjI3tjb2xsZWN0aW9uSW5mb30vI3tAdXJsUGFyYW1zLl9pZH1cIlxuIyBcdFx0XHRcdFx0ZWxzZVxuIyBcdFx0XHRcdFx0XHRib2R5ID0gbG9va3VwQ29sbGVjdGlvbi5maW5kT25lKHtfaWQ6IGZpZWxkVmFsdWV9LCBxdWVyeU9wdGlvbnMpIHx8IHt9XG4jIFx0XHRcdFx0XHRcdF8uZWFjaCBib2R5LCAodiwgayktPlxuIyBcdFx0XHRcdFx0XHRcdGlmIF8uaXNBcnJheSh2KSB8fCAoXy5pc09iamVjdCh2KSAmJiAhXy5pc0RhdGUodikpXG4jIFx0XHRcdFx0XHRcdFx0XHRib2R5W2tdID0gSlNPTi5zdHJpbmdpZnkodilcbiMgXHRcdFx0XHRcdFx0Ym9keVsnQG9kYXRhLmNvbnRleHQnXSA9IFN0ZWVkb3NPRGF0YS5nZXRNZXRhRGF0YVBhdGgoQHVybFBhcmFtcy5zcGFjZUlkKSArIFwiIyN7ZmllbGQucmVmZXJlbmNlX3RvfS8kZW50aXR5XCJcblxuIyBcdFx0XHRcdGVsc2VcbiMgXHRcdFx0XHRcdGJvZHlbJ0BvZGF0YS5jb250ZXh0J10gPSBTdGVlZG9zT0RhdGEuZ2V0TWV0YURhdGFQYXRoKEB1cmxQYXJhbXMuc3BhY2VJZCkgKyBcIiMje2NvbGxlY3Rpb25JbmZvfS8je0B1cmxQYXJhbXMuX2lkfVwiXG4jIFx0XHRcdFx0XHRib2R5Wyd2YWx1ZSddID0gZmllbGRWYWx1ZVxuXG4jIFx0XHRcdFx0aGVhZGVyc1snQ29udGVudC10eXBlJ10gPSAnYXBwbGljYXRpb24vanNvbjtvZGF0YS5tZXRhZGF0YT1taW5pbWFsO2NoYXJzZXQ9dXRmLTgnXG4jIFx0XHRcdFx0aGVhZGVyc1snT0RhdGEtVmVyc2lvbiddID0gU3RlZWRvc09EYXRhLlZFUlNJT05cblxuIyBcdFx0XHRcdHtib2R5OiBib2R5LCBoZWFkZXJzOiBoZWFkZXJzfVxuIyBcdFx0XHRlbHNlXG4jIFx0XHRcdFx0dHJ5XG4jIFx0XHRcdFx0XHRvYmplY3QgPSBDcmVhdG9yLmdldE9iamVjdChrZXksIEB1cmxQYXJhbXMuc3BhY2VJZClcbiMgXHRcdFx0XHRcdGlmIG5vdCBvYmplY3Q/LmVuYWJsZV9hcGlcbiMgXHRcdFx0XHRcdFx0cmV0dXJuIHtcbiMgXHRcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDFcbiMgXHRcdFx0XHRcdFx0XHRib2R5OiBzZXRFcnJvck1lc3NhZ2UoNDAxKVxuIyBcdFx0XHRcdFx0XHR9XG4jIFx0XHRcdFx0XHRjb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKGtleSwgQHVybFBhcmFtcy5zcGFjZUlkKVxuIyBcdFx0XHRcdFx0aWYgbm90IGNvbGxlY3Rpb25cbiMgXHRcdFx0XHRcdFx0cmV0dXJue1xuIyBcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxuIyBcdFx0XHRcdFx0XHRcdGJvZHk6IHNldEVycm9yTWVzc2FnZSg0MDQsY29sbGVjdGlvbixrZXkpXG4jIFx0XHRcdFx0XHRcdH1cblxuIyBcdFx0XHRcdFx0cGVybWlzc2lvbnMgPSBDcmVhdG9yLmdldE9iamVjdFBlcm1pc3Npb25zKEB1cmxQYXJhbXMuc3BhY2VJZCwgQHVzZXJJZCwga2V5KVxuIyBcdFx0XHRcdFx0aWYgcGVybWlzc2lvbnMuYWxsb3dSZWFkXG4jIFx0XHRcdFx0XHRcdHVucmVhZGFibGVfZmllbGRzID0gcGVybWlzc2lvbnMudW5yZWFkYWJsZV9maWVsZHMgfHwgW11cbiMgXHRcdFx0XHRcdFx0cmVtb3ZlSW52YWxpZE1ldGhvZChAcXVlcnlQYXJhbXMpXG4jIFx0XHRcdFx0XHRcdHFzID0gZGVjb2RlVVJJQ29tcG9uZW50KHF1ZXJ5c3RyaW5nLnN0cmluZ2lmeShAcXVlcnlQYXJhbXMpKVxuIyBcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeSA9IGlmIHFzIHRoZW4gb2RhdGFWNE1vbmdvZGIuY3JlYXRlUXVlcnkocXMpIGVsc2Ugb2RhdGFWNE1vbmdvZGIuY3JlYXRlUXVlcnkoKVxuIyBcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5xdWVyeS5faWQgPSAgQHVybFBhcmFtcy5faWRcbiMgXHRcdFx0XHRcdFx0aWYga2V5IGlzICdjZnMuZmlsZXMuZmlsZXJlY29yZCdcbiMgXHRcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5xdWVyeVsnbWV0YWRhdGEuc3BhY2UnXSA9IEB1cmxQYXJhbXMuc3BhY2VJZFxuIyBcdFx0XHRcdFx0XHRlbHNlIGlmIGtleSAhPSAnc3BhY2VzJ1xuIyBcdFx0XHRcdFx0XHRcdGNyZWF0ZVF1ZXJ5LnF1ZXJ5LnNwYWNlID0gIEB1cmxQYXJhbXMuc3BhY2VJZFxuIyBcdFx0XHRcdFx0XHR1bnJlYWRhYmxlX2ZpZWxkcyA9IHBlcm1pc3Npb25zLnVucmVhZGFibGVfZmllbGRzIHx8IFtdXG4jIFx0XHRcdFx0XHRcdGlmIGNyZWF0ZVF1ZXJ5LnByb2plY3Rpb25cbiMgXHRcdFx0XHRcdFx0XHRwcm9qZWN0aW9uID0ge31cbiMgXHRcdFx0XHRcdFx0XHRfLmtleXMoY3JlYXRlUXVlcnkucHJvamVjdGlvbikuZm9yRWFjaCAoa2V5KS0+XG4jIFx0XHRcdFx0XHRcdFx0XHRpZiBfLmluZGV4T2YodW5yZWFkYWJsZV9maWVsZHMsIGtleSkgPCAwXG4jIFx0XHRcdFx0XHRcdFx0XHRcdCMgaWYgbm90ICgoZmllbGRzW2tleV0/LnR5cGUgPT0gJ2xvb2t1cCcgb3IgZmllbGRzW2tleV0/LnR5cGUgPT0gJ21hc3Rlcl9kZXRhaWwnKSBhbmQgZmllbGRzW2tleV0ubXVsdGlwbGUpXG4jIFx0XHRcdFx0XHRcdFx0XHRcdHByb2plY3Rpb25ba2V5XSA9IDFcbiMgXHRcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5wcm9qZWN0aW9uID0gcHJvamVjdGlvblxuIyBcdFx0XHRcdFx0XHRpZiBub3QgY3JlYXRlUXVlcnkucHJvamVjdGlvbiBvciAhXy5zaXplKGNyZWF0ZVF1ZXJ5LnByb2plY3Rpb24pXG4jIFx0XHRcdFx0XHRcdFx0cmVhZGFibGVfZmllbGRzID0gQ3JlYXRvci5nZXRGaWVsZHMoa2V5LCBAdXJsUGFyYW1zLnNwYWNlSWQsIEB1c2VySWQpXG4jIFx0XHRcdFx0XHRcdFx0ZmllbGRzID0gb2JqZWN0LmZpZWxkc1xuIyBcdFx0XHRcdFx0XHRcdF8uZWFjaCByZWFkYWJsZV9maWVsZHMsIChmaWVsZCkgLT5cbiMgXHRcdFx0XHRcdFx0XHRcdGlmIGZpZWxkLmluZGV4T2YoJyQnKSA8IDBcbiMgXHRcdFx0XHRcdFx0XHRcdFx0Y3JlYXRlUXVlcnkucHJvamVjdGlvbltmaWVsZF0gPSAxXG4jIFx0XHRcdFx0XHRcdGVudGl0eSA9IGNvbGxlY3Rpb24uZmluZE9uZShjcmVhdGVRdWVyeS5xdWVyeSx2aXNpdG9yUGFyc2VyKGNyZWF0ZVF1ZXJ5KSlcbiMgXHRcdFx0XHRcdFx0ZW50aXRpZXMgPSBbXVxuIyBcdFx0XHRcdFx0XHRpZiBlbnRpdHlcbiMgXHRcdFx0XHRcdFx0XHRpc0FsbG93ZWQgPSBlbnRpdHkub3duZXIgPT0gQHVzZXJJZCBvciBwZXJtaXNzaW9ucy52aWV3QWxsUmVjb3JkcyBvciAocGVybWlzc2lvbnMudmlld0NvbXBhbnlSZWNvcmRzICYmIGlzU2FtZUNvbXBhbnkoQHVybFBhcmFtcy5zcGFjZUlkLCBAdXNlcklkLCBlbnRpdHkuY29tcGFueV9pZCkpXG4jIFx0XHRcdFx0XHRcdFx0aWYgb2JqZWN0LmVuYWJsZV9zaGFyZSBhbmQgIWlzQWxsb3dlZFxuIyBcdFx0XHRcdFx0XHRcdFx0c2hhcmVzID0gW11cbiMgXHRcdFx0XHRcdFx0XHRcdG9yZ3MgPSBTdGVlZG9zLmdldFVzZXJPcmdhbml6YXRpb25zKEB1cmxQYXJhbXMuc3BhY2VJZCwgQHVzZXJJZCwgdHJ1ZSlcbiMgXHRcdFx0XHRcdFx0XHRcdHNoYXJlcy5wdXNoIHsgXCJzaGFyaW5nLnVcIjogQHVzZXJJZCB9XG4jIFx0XHRcdFx0XHRcdFx0XHRzaGFyZXMucHVzaCB7IFwic2hhcmluZy5vXCI6IHsgJGluOiBvcmdzIH0gfVxuIyBcdFx0XHRcdFx0XHRcdFx0aXNBbGxvd2VkID0gY29sbGVjdGlvbi5maW5kT25lKHsgX2lkOiBAdXJsUGFyYW1zLl9pZCwgXCIkb3JcIjogc2hhcmVzIH0sIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pXG4jIFx0XHRcdFx0XHRcdFx0aWYgaXNBbGxvd2VkXG4jIFx0XHRcdFx0XHRcdFx0XHRib2R5ID0ge31cbiMgXHRcdFx0XHRcdFx0XHRcdGhlYWRlcnMgPSB7fVxuIyBcdFx0XHRcdFx0XHRcdFx0ZW50aXRpZXMucHVzaCBlbnRpdHlcbiMgXHRcdFx0XHRcdFx0XHRcdGRlYWxXaXRoRXhwYW5kKGNyZWF0ZVF1ZXJ5LCBlbnRpdGllcywga2V5LCBAdXJsUGFyYW1zLnNwYWNlSWQpXG4jIFx0XHRcdFx0XHRcdFx0XHRib2R5WydAb2RhdGEuY29udGV4dCddID0gU3RlZWRvc09EYXRhLmdldE9EYXRhQ29udGV4dFBhdGgoQHVybFBhcmFtcy5zcGFjZUlkLCBrZXkpICsgJy8kZW50aXR5J1xuIyBcdFx0XHRcdFx0XHRcdFx0ZW50aXR5X09kYXRhUHJvcGVydGllcyA9IHNldE9kYXRhUHJvcGVydHkoZW50aXRpZXMsQHVybFBhcmFtcy5zcGFjZUlkLCBrZXkpXG4jIFx0XHRcdFx0XHRcdFx0XHRfLmV4dGVuZCBib2R5LGVudGl0eV9PZGF0YVByb3BlcnRpZXNbMF1cbiMgXHRcdFx0XHRcdFx0XHRcdGhlYWRlcnNbJ0NvbnRlbnQtdHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb247b2RhdGEubWV0YWRhdGE9bWluaW1hbDtjaGFyc2V0PXV0Zi04J1xuIyBcdFx0XHRcdFx0XHRcdFx0aGVhZGVyc1snT0RhdGEtVmVyc2lvbiddID0gU3RlZWRvc09EYXRhLlZFUlNJT05cbiMgXHRcdFx0XHRcdFx0XHRcdHtib2R5OiBib2R5LCBoZWFkZXJzOiBoZWFkZXJzfVxuIyBcdFx0XHRcdFx0XHRcdGVsc2VcbiMgXHRcdFx0XHRcdFx0XHRcdHJldHVybntcbiMgXHRcdFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDAzXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGJvZHk6IHNldEVycm9yTWVzc2FnZSg0MDMsY29sbGVjdGlvbixrZXksJ2dldCcpXG4jIFx0XHRcdFx0XHRcdFx0XHR9XG4jIFx0XHRcdFx0XHRcdGVsc2VcbiMgXHRcdFx0XHRcdFx0XHRyZXR1cm57XG4jIFx0XHRcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDRcbiMgXHRcdFx0XHRcdFx0XHRcdGJvZHk6IHNldEVycm9yTWVzc2FnZSg0MDQsY29sbGVjdGlvbixrZXksJ2dldCcpXG4jIFx0XHRcdFx0XHRcdFx0fVxuIyBcdFx0XHRcdFx0ZWxzZVxuIyBcdFx0XHRcdFx0XHRyZXR1cm57XG4jIFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDAzXG4jIFx0XHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwMyxjb2xsZWN0aW9uLGtleSwnZ2V0JylcbiMgXHRcdFx0XHRcdFx0fVxuIyBcdFx0XHRcdGNhdGNoIGVcbiMgXHRcdFx0XHRcdHJldHVybiBoYW5kbGVFcnJvciBlXG5cbiMgXHRcdHB1dDooKS0+XG4jIFx0XHRcdHRyeVxuIyBcdFx0XHRcdGtleSA9IEB1cmxQYXJhbXMub2JqZWN0X25hbWVcbiMgXHRcdFx0XHRvYmplY3QgPSBDcmVhdG9yLmdldE9iamVjdChrZXksIEB1cmxQYXJhbXMuc3BhY2VJZClcbiMgXHRcdFx0XHRpZiBub3Qgb2JqZWN0Py5lbmFibGVfYXBpXG4jIFx0XHRcdFx0XHRyZXR1cm57XG4jIFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwMVxuIyBcdFx0XHRcdFx0XHRib2R5OiBzZXRFcnJvck1lc3NhZ2UoNDAxKVxuIyBcdFx0XHRcdFx0fVxuXG4jIFx0XHRcdFx0Y29sbGVjdGlvbiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihrZXksIEB1cmxQYXJhbXMuc3BhY2VJZClcbiMgXHRcdFx0XHRpZiBub3QgY29sbGVjdGlvblxuIyBcdFx0XHRcdFx0cmV0dXJue1xuIyBcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDRcbiMgXHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwNCxjb2xsZWN0aW9uLGtleSlcbiMgXHRcdFx0XHRcdH1cbiMgXHRcdFx0XHRzcGFjZUlkID0gQHVybFBhcmFtcy5zcGFjZUlkXG4jIFx0XHRcdFx0cGVybWlzc2lvbnMgPSBDcmVhdG9yLmdldE9iamVjdFBlcm1pc3Npb25zKHNwYWNlSWQsIEB1c2VySWQsIGtleSlcbiMgXHRcdFx0XHRpZiBrZXkgPT0gXCJ1c2Vyc1wiXG4jIFx0XHRcdFx0XHRyZWNvcmRfb3duZXIgPSBAdXJsUGFyYW1zLl9pZFxuIyBcdFx0XHRcdGVsc2VcbiMgXHRcdFx0XHRcdHJlY29yZF9vd25lciA9IGNvbGxlY3Rpb24uZmluZE9uZSh7IF9pZDogQHVybFBhcmFtcy5faWQgfSwgeyBmaWVsZHM6IHsgb3duZXI6IDEgfSB9KT8ub3duZXJcblxuIyBcdFx0XHRcdGNvbXBhbnlJZCA9IGNvbGxlY3Rpb24uZmluZE9uZSh7IF9pZDogQHVybFBhcmFtcy5faWQgfSwgeyBmaWVsZHM6IHsgY29tcGFueV9pZDogMSB9IH0pPy5jb21wYW55X2lkXG5cbiMgXHRcdFx0XHRpc0FsbG93ZWQgPSBwZXJtaXNzaW9ucy5tb2RpZnlBbGxSZWNvcmRzIG9yIChwZXJtaXNzaW9ucy5hbGxvd0VkaXQgYW5kIHJlY29yZF9vd25lciA9PSBAdXNlcklkICkgb3IgKHBlcm1pc3Npb25zLm1vZGlmeUNvbXBhbnlSZWNvcmRzICYmIGlzU2FtZUNvbXBhbnkoc3BhY2VJZCwgQHVzZXJJZCwgY29tcGFueUlkKSlcbiMgXHRcdFx0XHRpZiBpc0FsbG93ZWRcbiMgXHRcdFx0XHRcdGNoZWNrR2xvYmFsUmVjb3JkKGNvbGxlY3Rpb24sIEB1cmxQYXJhbXMuX2lkLCBvYmplY3QpXG4jIFx0XHRcdFx0XHRzZWxlY3RvciA9IHtfaWQ6IEB1cmxQYXJhbXMuX2lkLCBzcGFjZTogc3BhY2VJZH1cbiMgXHRcdFx0XHRcdGlmIHNwYWNlSWQgaXMgJ2d1ZXN0JyBvciBzcGFjZUlkIGlzICdjb21tb24nIG9yIGtleSA9PSBcInVzZXJzXCJcbiMgXHRcdFx0XHRcdFx0ZGVsZXRlIHNlbGVjdG9yLnNwYWNlXG4jIFx0XHRcdFx0XHRmaWVsZHNfZWRpdGFibGUgPSB0cnVlXG4jIFx0XHRcdFx0XHRfLmtleXMoQGJvZHlQYXJhbXMuJHNldCkuZm9yRWFjaCAoa2V5KS0+XG4jIFx0XHRcdFx0XHRcdGlmIF8uaW5kZXhPZihwZXJtaXNzaW9ucy51bmVkaXRhYmxlX2ZpZWxkcywga2V5KSA+IC0xXG4jIFx0XHRcdFx0XHRcdFx0ZmllbGRzX2VkaXRhYmxlID0gZmFsc2VcbiMgXHRcdFx0XHRcdGlmIGZpZWxkc19lZGl0YWJsZVxuIyBcdFx0XHRcdFx0XHRpZiBrZXkgaXMgJ3NwYWNlcydcbiMgXHRcdFx0XHRcdFx0XHRkZWxldGUgc2VsZWN0b3Iuc3BhY2VcbiMgXHRcdFx0XHRcdFx0ZW50aXR5SXNVcGRhdGVkID0gY29sbGVjdGlvbi51cGRhdGUgc2VsZWN0b3IsIEBib2R5UGFyYW1zXG4jIFx0XHRcdFx0XHRcdGlmIGVudGl0eUlzVXBkYXRlZFxuIyBcdFx0XHRcdFx0XHRcdCNzdGF0dXNDb2RlOiAyMDFcbiMgXHRcdFx0XHRcdFx0XHQjIGVudGl0eSA9IGNvbGxlY3Rpb24uZmluZE9uZSBAdXJsUGFyYW1zLl9pZFxuIyBcdFx0XHRcdFx0XHRcdCMgZW50aXRpZXMgPSBbXVxuIyBcdFx0XHRcdFx0XHRcdCMgYm9keSA9IHt9XG4jIFx0XHRcdFx0XHRcdFx0aGVhZGVycyA9IHt9XG4jIFx0XHRcdFx0XHRcdFx0Ym9keSA9IHt9XG4jIFx0XHRcdFx0XHRcdFx0IyBlbnRpdGllcy5wdXNoIGVudGl0eVxuIyBcdFx0XHRcdFx0XHRcdCMgYm9keVsnQG9kYXRhLmNvbnRleHQnXSA9IFN0ZWVkb3NPRGF0YS5nZXRPRGF0YUNvbnRleHRQYXRoKHNwYWNlSWQsIGtleSkgKyAnLyRlbnRpdHknXG4jIFx0XHRcdFx0XHRcdFx0IyBlbnRpdHlfT2RhdGFQcm9wZXJ0aWVzID0gc2V0T2RhdGFQcm9wZXJ0eShlbnRpdGllcyxzcGFjZUlkLCBrZXkpXG4jIFx0XHRcdFx0XHRcdFx0IyBfLmV4dGVuZCBib2R5LGVudGl0eV9PZGF0YVByb3BlcnRpZXNbMF1cbiMgXHRcdFx0XHRcdFx0XHRoZWFkZXJzWydDb250ZW50LXR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uO29kYXRhLm1ldGFkYXRhPW1pbmltYWw7Y2hhcnNldD11dGYtOCdcbiMgXHRcdFx0XHRcdFx0XHRoZWFkZXJzWydPRGF0YS1WZXJzaW9uJ10gPSBTdGVlZG9zT0RhdGEuVkVSU0lPTlxuIyBcdFx0XHRcdFx0XHRcdHtoZWFkZXJzOiBoZWFkZXJzLGJvZHk6Ym9keX1cbiMgXHRcdFx0XHRcdFx0ZWxzZVxuIyBcdFx0XHRcdFx0XHRcdHJldHVybntcbiMgXHRcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxuIyBcdFx0XHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwNCxjb2xsZWN0aW9uLGtleSlcbiMgXHRcdFx0XHRcdFx0XHR9XG4jIFx0XHRcdFx0XHRlbHNlXG4jIFx0XHRcdFx0XHRcdHJldHVybntcbiMgXHRcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDNcbiMgXHRcdFx0XHRcdFx0XHRib2R5OiBzZXRFcnJvck1lc3NhZ2UoNDAzLGNvbGxlY3Rpb24sa2V5LCdwdXQnKVxuIyBcdFx0XHRcdFx0XHR9XG4jIFx0XHRcdFx0ZWxzZVxuIyBcdFx0XHRcdFx0cmV0dXJue1xuIyBcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDNcbiMgXHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwMyxjb2xsZWN0aW9uLGtleSwncHV0JylcbiMgXHRcdFx0XHRcdH1cbiMgXHRcdFx0Y2F0Y2ggZVxuIyBcdFx0XHRcdHJldHVybiBoYW5kbGVFcnJvciBlXG4jIFx0XHRkZWxldGU6KCktPlxuIyBcdFx0XHR0cnlcbiMgXHRcdFx0XHRrZXkgPSBAdXJsUGFyYW1zLm9iamVjdF9uYW1lXG4jIFx0XHRcdFx0b2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3Qoa2V5LCBAdXJsUGFyYW1zLnNwYWNlSWQpXG4jIFx0XHRcdFx0aWYgbm90IG9iamVjdD8uZW5hYmxlX2FwaVxuIyBcdFx0XHRcdFx0cmV0dXJue1xuIyBcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDFcbiMgXHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwMSlcbiMgXHRcdFx0XHRcdFx0fVxuXG4jIFx0XHRcdFx0Y29sbGVjdGlvbiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihrZXksIEB1cmxQYXJhbXMuc3BhY2VJZClcbiMgXHRcdFx0XHRpZiBub3QgY29sbGVjdGlvblxuIyBcdFx0XHRcdFx0cmV0dXJue1xuIyBcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDRcbiMgXHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwNCxjb2xsZWN0aW9uLGtleSlcbiMgXHRcdFx0XHRcdH1cbiMgXHRcdFx0XHRzcGFjZUlkID0gQHVybFBhcmFtcy5zcGFjZUlkXG4jIFx0XHRcdFx0cGVybWlzc2lvbnMgPSBDcmVhdG9yLmdldE9iamVjdFBlcm1pc3Npb25zKEB1cmxQYXJhbXMuc3BhY2VJZCwgQHVzZXJJZCwga2V5KVxuIyBcdFx0XHRcdHJlY29yZERhdGEgPSBjb2xsZWN0aW9uLmZpbmRPbmUoe19pZDogQHVybFBhcmFtcy5faWR9LCB7IGZpZWxkczogeyBvd25lcjogMSwgY29tcGFueV9pZDogMSB9IH0pXG4jIFx0XHRcdFx0cmVjb3JkX293bmVyID0gcmVjb3JkRGF0YT8ub3duZXJcbiMgXHRcdFx0XHRjb21wYW55SWQgPSByZWNvcmREYXRhPy5jb21wYW55X2lkXG4jIFx0XHRcdFx0aXNBbGxvd2VkID0gKHBlcm1pc3Npb25zLm1vZGlmeUFsbFJlY29yZHMgYW5kIHBlcm1pc3Npb25zLmFsbG93RGVsZXRlKSBvciAocGVybWlzc2lvbnMubW9kaWZ5Q29tcGFueVJlY29yZHMgYW5kIHBlcm1pc3Npb25zLmFsbG93RGVsZXRlIGFuZCBpc1NhbWVDb21wYW55KHNwYWNlSWQsIEB1c2VySWQsIGNvbXBhbnlJZCkpIG9yIChwZXJtaXNzaW9ucy5hbGxvd0RlbGV0ZSBhbmQgcmVjb3JkX293bmVyPT1AdXNlcklkIClcbiMgXHRcdFx0XHRpZiBpc0FsbG93ZWRcbiMgXHRcdFx0XHRcdGNoZWNrR2xvYmFsUmVjb3JkKGNvbGxlY3Rpb24sIEB1cmxQYXJhbXMuX2lkLCBvYmplY3QpXG4jIFx0XHRcdFx0XHRzZWxlY3RvciA9IHtfaWQ6IEB1cmxQYXJhbXMuX2lkLCBzcGFjZTogc3BhY2VJZH1cbiMgXHRcdFx0XHRcdGlmIHNwYWNlSWQgaXMgJ2d1ZXN0J1xuIyBcdFx0XHRcdFx0XHRkZWxldGUgc2VsZWN0b3Iuc3BhY2VcblxuIyBcdFx0XHRcdFx0aWYgb2JqZWN0Py5lbmFibGVfdHJhc2hcbiMgXHRcdFx0XHRcdFx0ZW50aXR5SXNVcGRhdGVkID0gY29sbGVjdGlvbi51cGRhdGUoc2VsZWN0b3IsIHtcbiMgXHRcdFx0XHRcdFx0XHQkc2V0OiB7XG4jIFx0XHRcdFx0XHRcdFx0XHRpc19kZWxldGVkOiB0cnVlLFxuIyBcdFx0XHRcdFx0XHRcdFx0ZGVsZXRlZDogbmV3IERhdGUoKSxcbiMgXHRcdFx0XHRcdFx0XHRcdGRlbGV0ZWRfYnk6IEB1c2VySWRcbiMgXHRcdFx0XHRcdFx0XHR9XG4jIFx0XHRcdFx0XHRcdH0pXG4jIFx0XHRcdFx0XHRcdGlmIGVudGl0eUlzVXBkYXRlZFxuIyBcdFx0XHRcdFx0XHRcdGhlYWRlcnMgPSB7fVxuIyBcdFx0XHRcdFx0XHRcdGJvZHkgPSB7fVxuIyBcdFx0XHRcdFx0XHRcdGhlYWRlcnNbJ0NvbnRlbnQtdHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb247b2RhdGEubWV0YWRhdGE9bWluaW1hbDtjaGFyc2V0PXV0Zi04J1xuIyBcdFx0XHRcdFx0XHRcdGhlYWRlcnNbJ09EYXRhLVZlcnNpb24nXSA9IFN0ZWVkb3NPRGF0YS5WRVJTSU9OXG4jIFx0XHRcdFx0XHRcdFx0e2hlYWRlcnM6IGhlYWRlcnMsYm9keTpib2R5fVxuIyBcdFx0XHRcdFx0XHRlbHNlXG4jIFx0XHRcdFx0XHRcdFx0cmV0dXJue1xuIyBcdFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XG4jIFx0XHRcdFx0XHRcdFx0XHRib2R5OiBzZXRFcnJvck1lc3NhZ2UoNDA0LGNvbGxlY3Rpb24sa2V5KVxuIyBcdFx0XHRcdFx0XHRcdH1cbiMgXHRcdFx0XHRcdGVsc2VcbiMgXHRcdFx0XHRcdFx0aWYgY29sbGVjdGlvbi5yZW1vdmUgc2VsZWN0b3JcbiMgXHRcdFx0XHRcdFx0XHRoZWFkZXJzID0ge31cbiMgXHRcdFx0XHRcdFx0XHRib2R5ID0ge31cbiMgXHRcdFx0XHRcdFx0XHQjIGVudGl0aWVzLnB1c2ggZW50aXR5XG4jIFx0XHRcdFx0XHRcdFx0IyBib2R5WydAb2RhdGEuY29udGV4dCddID0gU3RlZWRvc09EYXRhLmdldE9EYXRhQ29udGV4dFBhdGgoc3BhY2VJZCwga2V5KSArICcvJGVudGl0eSdcbiMgXHRcdFx0XHRcdFx0XHQjIGVudGl0eV9PZGF0YVByb3BlcnRpZXMgPSBzZXRPZGF0YVByb3BlcnR5KGVudGl0aWVzLHNwYWNlSWQsIGtleSlcbiMgXHRcdFx0XHRcdFx0XHQjIF8uZXh0ZW5kIGJvZHksZW50aXR5X09kYXRhUHJvcGVydGllc1swXVxuIyBcdFx0XHRcdFx0XHRcdGhlYWRlcnNbJ0NvbnRlbnQtdHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb247b2RhdGEubWV0YWRhdGE9bWluaW1hbDtjaGFyc2V0PXV0Zi04J1xuIyBcdFx0XHRcdFx0XHRcdGhlYWRlcnNbJ09EYXRhLVZlcnNpb24nXSA9IFN0ZWVkb3NPRGF0YS5WRVJTSU9OXG4jIFx0XHRcdFx0XHRcdFx0e2hlYWRlcnM6IGhlYWRlcnMsYm9keTpib2R5fVxuIyBcdFx0XHRcdFx0XHRlbHNlXG4jIFx0XHRcdFx0XHRcdFx0cmV0dXJue1xuIyBcdFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XG4jIFx0XHRcdFx0XHRcdFx0XHRib2R5OiBzZXRFcnJvck1lc3NhZ2UoNDA0LGNvbGxlY3Rpb24sa2V5KVxuIyBcdFx0XHRcdFx0XHRcdH1cbiMgXHRcdFx0XHRlbHNlXG4jIFx0XHRcdFx0XHRyZXR1cm4ge1xuIyBcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDNcbiMgXHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwMyxjb2xsZWN0aW9uLGtleSlcbiMgXHRcdFx0XHRcdH1cbiMgXHRcdFx0Y2F0Y2ggZVxuIyBcdFx0XHRcdHJldHVybiBoYW5kbGVFcnJvciBlXG4jIFx0fSlcblxuIyBcdCMgX2lk5Y+v5LygYWxsXG4jIFx0U3RlZWRvc09kYXRhQVBJLmFkZFJvdXRlKCc6b2JqZWN0X25hbWUvOl9pZC86bWV0aG9kTmFtZScsIHthdXRoUmVxdWlyZWQ6IHRydWUsIHNwYWNlUmVxdWlyZWQ6IGZhbHNlfSwge1xuIyBcdFx0cG9zdDogKCktPlxuIyBcdFx0XHR0cnlcbiMgXHRcdFx0XHRrZXkgPSBAdXJsUGFyYW1zLm9iamVjdF9uYW1lXG4jIFx0XHRcdFx0aWYgbm90IENyZWF0b3IuZ2V0T2JqZWN0KGtleSwgQHVybFBhcmFtcy5zcGFjZUlkKT8uZW5hYmxlX2FwaVxuIyBcdFx0XHRcdFx0cmV0dXJue1xuIyBcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDFcbiMgXHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwMSlcbiMgXHRcdFx0XHRcdH1cbiMgXHRcdFx0XHRjb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKGtleSwgQHVybFBhcmFtcy5zcGFjZUlkKVxuIyBcdFx0XHRcdGlmIG5vdCBjb2xsZWN0aW9uXG4jIFx0XHRcdFx0XHRyZXR1cm57XG4jIFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxuIyBcdFx0XHRcdFx0XHRib2R5OiBzZXRFcnJvck1lc3NhZ2UoNDA0LGNvbGxlY3Rpb24sa2V5KVxuIyBcdFx0XHRcdFx0fVxuXG4jIFx0XHRcdFx0cGVybWlzc2lvbnMgPSBDcmVhdG9yLmdldE9iamVjdFBlcm1pc3Npb25zKEB1cmxQYXJhbXMuc3BhY2VJZCwgQHVzZXJJZCwga2V5KVxuIyBcdFx0XHRcdGlmIHBlcm1pc3Npb25zLmFsbG93UmVhZFxuIyBcdFx0XHRcdFx0bWV0aG9kTmFtZSA9IEB1cmxQYXJhbXMubWV0aG9kTmFtZVxuIyBcdFx0XHRcdFx0bWV0aG9kcyA9IENyZWF0b3IuT2JqZWN0c1trZXldPy5tZXRob2RzIHx8IHt9XG4jIFx0XHRcdFx0XHRpZiBtZXRob2RzLmhhc093blByb3BlcnR5KG1ldGhvZE5hbWUpXG4jIFx0XHRcdFx0XHRcdHRoaXNPYmogPSB7XG4jIFx0XHRcdFx0XHRcdFx0b2JqZWN0X25hbWU6IGtleVxuIyBcdFx0XHRcdFx0XHRcdHJlY29yZF9pZDogQHVybFBhcmFtcy5faWRcbiMgXHRcdFx0XHRcdFx0XHRzcGFjZV9pZDogQHVybFBhcmFtcy5zcGFjZUlkXG4jIFx0XHRcdFx0XHRcdFx0dXNlcl9pZDogQHVzZXJJZFxuIyBcdFx0XHRcdFx0XHRcdHBlcm1pc3Npb25zOiBwZXJtaXNzaW9uc1xuIyBcdFx0XHRcdFx0XHR9XG4jIFx0XHRcdFx0XHRcdHJldHVybiBtZXRob2RzW21ldGhvZE5hbWVdLmFwcGx5KHRoaXNPYmosIFtAYm9keVBhcmFtc10pIHx8IHt9XG4jIFx0XHRcdFx0XHRlbHNlXG4jIFx0XHRcdFx0XHRcdHJldHVybiB7XG4jIFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XG4jIFx0XHRcdFx0XHRcdFx0Ym9keTogc2V0RXJyb3JNZXNzYWdlKDQwNCxjb2xsZWN0aW9uLGtleSlcbiMgXHRcdFx0XHRcdFx0fVxuIyBcdFx0XHRcdGVsc2VcbiMgXHRcdFx0XHRcdHJldHVybiB7XG4jIFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwM1xuIyBcdFx0XHRcdFx0XHRib2R5OiBzZXRFcnJvck1lc3NhZ2UoNDAzLGNvbGxlY3Rpb24sa2V5KVxuIyBcdFx0XHRcdFx0fVxuIyBcdFx0XHRjYXRjaCBlXG4jIFx0XHRcdFx0cmV0dXJuIGhhbmRsZUVycm9yIGVcblxuIyBcdH0pXG5cbiMgXHQjVE9ETyByZW1vdmVcbiMgXHRfLmVhY2ggW10sICh2YWx1ZSwga2V5LCBsaXN0KS0+ICNDcmVhdG9yLkNvbGxlY3Rpb25zXG4jIFx0XHRpZiBub3QgQ3JlYXRvci5nZXRPYmplY3Qoa2V5KT8uZW5hYmxlX2FwaVxuIyBcdFx0XHRyZXR1cm5cblxuIyBcdFx0aWYgU3RlZWRvc09kYXRhQVBJXG5cbiMgXHRcdFx0U3RlZWRvc09kYXRhQVBJLmFkZENvbGxlY3Rpb24gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKGtleSksXG4jIFx0XHRcdFx0ZXhjbHVkZWRFbmRwb2ludHM6IFtdXG4jIFx0XHRcdFx0cm91dGVPcHRpb25zOlxuIyBcdFx0XHRcdFx0YXV0aFJlcXVpcmVkOiB0cnVlXG4jIFx0XHRcdFx0XHRzcGFjZVJlcXVpcmVkOiBmYWxzZVxuIyBcdFx0XHRcdGVuZHBvaW50czpcbiMgXHRcdFx0XHRcdGdldEFsbDpcbiMgXHRcdFx0XHRcdFx0YWN0aW9uOiAtPlxuIyBcdFx0XHRcdFx0XHRcdGNvbGxlY3Rpb24gPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oa2V5KVxuIyBcdFx0XHRcdFx0XHRcdGlmIG5vdCBjb2xsZWN0aW9uXG4jIFx0XHRcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDRcbiMgXHRcdFx0XHRcdFx0XHRcdGJvZHk6IHtzdGF0dXM6ICdmYWlsJywgbWVzc2FnZTogJ0NvbGxlY3Rpb24gbm90IGZvdW5kJ31cblxuIyBcdFx0XHRcdFx0XHRcdHBlcm1pc3Npb25zID0gQ3JlYXRvci5nZXRPYmplY3RQZXJtaXNzaW9ucyhAdXJsUGFyYW1zLnNwYWNlSWQsIEB1c2VySWQsIGtleSlcbiMgXHRcdFx0XHRcdFx0XHRpZiBwZXJtaXNzaW9ucy52aWV3QWxsUmVjb3JkcyBvciAocGVybWlzc2lvbnMuYWxsb3dSZWFkIGFuZCBAdXNlcklkKVxuIyBcdFx0XHRcdFx0XHRcdFx0XHRyZW1vdmVJbnZhbGlkTWV0aG9kKEBxdWVyeVBhcmFtcylcbiMgXHRcdFx0XHRcdFx0XHRcdFx0cXMgPSBkZWNvZGVVUklDb21wb25lbnQocXVlcnlzdHJpbmcuc3RyaW5naWZ5KEBxdWVyeVBhcmFtcykpXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGNyZWF0ZVF1ZXJ5ID0gaWYgcXMgdGhlbiBvZGF0YVY0TW9uZ29kYi5jcmVhdGVRdWVyeShxcykgZWxzZSBvZGF0YVY0TW9uZ29kYi5jcmVhdGVRdWVyeSgpXG5cbiMgXHRcdFx0XHRcdFx0XHRcdFx0aWYga2V5IGlzICdjZnMuZmlsZXMuZmlsZXJlY29yZCdcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5xdWVyeVsnbWV0YWRhdGEuc3BhY2UnXSA9IEB1cmxQYXJhbXMuc3BhY2VJZFxuIyBcdFx0XHRcdFx0XHRcdFx0XHRlbHNlXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0Y3JlYXRlUXVlcnkucXVlcnkuc3BhY2UgPSBAdXJsUGFyYW1zLnNwYWNlSWRcblxuIyBcdFx0XHRcdFx0XHRcdFx0XHRpZiBub3QgcGVybWlzc2lvbnMudmlld0FsbFJlY29yZHNcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRjcmVhdGVRdWVyeS5xdWVyeS5vd25lciA9IEB1c2VySWRcblxuIyBcdFx0XHRcdFx0XHRcdFx0XHRlbnRpdGllcyA9IFtdXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGlmIEBxdWVyeVBhcmFtcy4kdG9wIGlzbnQgJzAnXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0ZW50aXRpZXMgPSBjb2xsZWN0aW9uLmZpbmQoY3JlYXRlUXVlcnkucXVlcnksIHZpc2l0b3JQYXJzZXIoY3JlYXRlUXVlcnkpKS5mZXRjaCgpXG4jIFx0XHRcdFx0XHRcdFx0XHRcdHNjYW5uZWRDb3VudCA9IGNvbGxlY3Rpb24uZmluZChjcmVhdGVRdWVyeS5xdWVyeSkuY291bnQoKVxuXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGlmIGVudGl0aWVzXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGVhbFdpdGhFeHBhbmQoY3JlYXRlUXVlcnksIGVudGl0aWVzLCBrZXksIEB1cmxQYXJhbXMuc3BhY2VJZClcblxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdGJvZHkgPSB7fVxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdGhlYWRlcnMgPSB7fVxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdGJvZHlbJ0BvZGF0YS5jb250ZXh0J10gPSBTdGVlZG9zT0RhdGEuZ2V0T0RhdGFDb250ZXh0UGF0aChAdXJsUGFyYW1zLnNwYWNlSWQsIGtleSlcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRib2R5WydAb2RhdGEuY291bnQnXSA9IHNjYW5uZWRDb3VudFxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdGJvZHlbJ3ZhbHVlJ10gPSBlbnRpdGllc1xuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdGhlYWRlcnNbJ0NvbnRlbnQtdHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb247b2RhdGEubWV0YWRhdGE9bWluaW1hbDtjaGFyc2V0PXV0Zi04J1xuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdGhlYWRlcnNbJ09EYXRhLVZlcnNpb24nXSA9IFN0ZWVkb3NPRGF0YS5WRVJTSU9OXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0e2JvZHk6IGJvZHksIGhlYWRlcnM6IGhlYWRlcnN9XG4jIFx0XHRcdFx0XHRcdFx0XHRcdGVsc2VcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDRcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRib2R5OiB7c3RhdHVzOiAnZmFpbCcsIG1lc3NhZ2U6ICdVbmFibGUgdG8gcmV0cmlldmUgaXRlbXMgZnJvbSBjb2xsZWN0aW9uJ31cbiMgXHRcdFx0XHRcdFx0XHRlbHNlXG4jIFx0XHRcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDBcbiMgXHRcdFx0XHRcdFx0XHRcdGJvZHk6IHtzdGF0dXM6ICdmYWlsJywgbWVzc2FnZTogJ0FjdGlvbiBub3QgcGVybWl0dGVkJ31cbiMgXHRcdFx0XHRcdHBvc3Q6XG4jIFx0XHRcdFx0XHRcdGFjdGlvbjogLT5cbiMgXHRcdFx0XHRcdFx0XHRjb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKGtleSlcbiMgXHRcdFx0XHRcdFx0XHRpZiBub3QgY29sbGVjdGlvblxuIyBcdFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XG4jIFx0XHRcdFx0XHRcdFx0XHRib2R5OiB7c3RhdHVzOiAnZmFpbCcsIG1lc3NhZ2U6ICdDb2xsZWN0aW9uIG5vdCBmb3VuZCd9XG5cbiMgXHRcdFx0XHRcdFx0XHRwZXJtaXNzaW9ucyA9IENyZWF0b3IuZ2V0T2JqZWN0UGVybWlzc2lvbnMoQHNwYWNlSWQsIEB1c2VySWQsIGtleSlcbiMgXHRcdFx0XHRcdFx0XHRpZiBwZXJtaXNzaW9ucy5hbGxvd0NyZWF0ZVxuIyBcdFx0XHRcdFx0XHRcdFx0XHRAYm9keVBhcmFtcy5zcGFjZSA9IEBzcGFjZUlkXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGVudGl0eUlkID0gY29sbGVjdGlvbi5pbnNlcnQgQGJvZHlQYXJhbXNcbiMgXHRcdFx0XHRcdFx0XHRcdFx0ZW50aXR5ID0gY29sbGVjdGlvbi5maW5kT25lIGVudGl0eUlkXG4jIFx0XHRcdFx0XHRcdFx0XHRcdGlmIGVudGl0eVxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDIwMVxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdHtzdGF0dXM6ICdzdWNjZXNzJywgdmFsdWU6IGVudGl0eX1cbiMgXHRcdFx0XHRcdFx0XHRcdFx0ZWxzZVxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxuIyBcdFx0XHRcdFx0XHRcdFx0XHRcdGJvZHk6IHtzdGF0dXM6ICdmYWlsJywgbWVzc2FnZTogJ05vIGl0ZW0gYWRkZWQnfVxuIyBcdFx0XHRcdFx0XHRcdGVsc2VcbiMgXHRcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwMFxuIyBcdFx0XHRcdFx0XHRcdFx0Ym9keToge3N0YXR1czogJ2ZhaWwnLCBtZXNzYWdlOiAnQWN0aW9uIG5vdCBwZXJtaXR0ZWQnfVxuIyBcdFx0XHRcdFx0Z2V0OlxuIyBcdFx0XHRcdFx0XHRhY3Rpb246IC0+XG4jIFx0XHRcdFx0XHRcdFx0Y29sbGVjdGlvbiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihrZXkpXG4jIFx0XHRcdFx0XHRcdFx0aWYgbm90IGNvbGxlY3Rpb25cbiMgXHRcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxuIyBcdFx0XHRcdFx0XHRcdFx0Ym9keToge3N0YXR1czogJ2ZhaWwnLCBtZXNzYWdlOiAnQ29sbGVjdGlvbiBub3QgZm91bmQnfVxuXG4jIFx0XHRcdFx0XHRcdFx0cGVybWlzc2lvbnMgPSBDcmVhdG9yLmdldE9iamVjdFBlcm1pc3Npb25zKEBzcGFjZUlkLCBAdXNlcklkLCBrZXkpXG4jIFx0XHRcdFx0XHRcdFx0aWYgcGVybWlzc2lvbnMuYWxsb3dSZWFkXG4jIFx0XHRcdFx0XHRcdFx0XHRcdHNlbGVjdG9yID0ge19pZDogQHVybFBhcmFtcy5pZCwgc3BhY2U6IEBzcGFjZUlkfVxuIyBcdFx0XHRcdFx0XHRcdFx0XHRlbnRpdHkgPSBjb2xsZWN0aW9uLmZpbmRPbmUgc2VsZWN0b3JcbiMgXHRcdFx0XHRcdFx0XHRcdFx0aWYgZW50aXR5XG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0e3N0YXR1czogJ3N1Y2Nlc3MnLCB2YWx1ZTogZW50aXR5fVxuIyBcdFx0XHRcdFx0XHRcdFx0XHRlbHNlXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0Ym9keToge3N0YXR1czogJ2ZhaWwnLCBtZXNzYWdlOiAnSXRlbSBub3QgZm91bmQnfVxuIyBcdFx0XHRcdFx0XHRcdGVsc2VcbiMgXHRcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwMFxuIyBcdFx0XHRcdFx0XHRcdFx0Ym9keToge3N0YXR1czogJ2ZhaWwnLCBtZXNzYWdlOiAnQWN0aW9uIG5vdCBwZXJtaXR0ZWQnfVxuIyBcdFx0XHRcdFx0cHV0OlxuIyBcdFx0XHRcdFx0XHRhY3Rpb246IC0+XG4jIFx0XHRcdFx0XHRcdFx0Y29sbGVjdGlvbiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihrZXkpXG4jIFx0XHRcdFx0XHRcdFx0aWYgbm90IGNvbGxlY3Rpb25cbiMgXHRcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNFxuIyBcdFx0XHRcdFx0XHRcdFx0Ym9keToge3N0YXR1czogJ2ZhaWwnLCBtZXNzYWdlOiAnQ29sbGVjdGlvbiBub3QgZm91bmQnfVxuXG4jIFx0XHRcdFx0XHRcdFx0cGVybWlzc2lvbnMgPSBDcmVhdG9yLmdldE9iamVjdFBlcm1pc3Npb25zKEBzcGFjZUlkLCBAdXNlcklkLCBrZXkpXG4jIFx0XHRcdFx0XHRcdFx0aWYgcGVybWlzc2lvbnMuYWxsb3dFZGl0XG4jIFx0XHRcdFx0XHRcdFx0XHRcdHNlbGVjdG9yID0ge19pZDogQHVybFBhcmFtcy5pZCwgc3BhY2U6IEBzcGFjZUlkfVxuIyBcdFx0XHRcdFx0XHRcdFx0XHRlbnRpdHlJc1VwZGF0ZWQgPSBjb2xsZWN0aW9uLnVwZGF0ZSBzZWxlY3RvciwgJHNldDogQGJvZHlQYXJhbXNcbiMgXHRcdFx0XHRcdFx0XHRcdFx0aWYgZW50aXR5SXNVcGRhdGVkXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0ZW50aXR5ID0gY29sbGVjdGlvbi5maW5kT25lIEB1cmxQYXJhbXMuaWRcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHR7c3RhdHVzOiAnc3VjY2VzcycsIHZhbHVlOiBlbnRpdHl9XG4jIFx0XHRcdFx0XHRcdFx0XHRcdGVsc2VcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDRcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHRib2R5OiB7c3RhdHVzOiAnZmFpbCcsIG1lc3NhZ2U6ICdJdGVtIG5vdCBmb3VuZCd9XG4jIFx0XHRcdFx0XHRcdFx0ZWxzZVxuIyBcdFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDAwXG4jIFx0XHRcdFx0XHRcdFx0XHRib2R5OiB7c3RhdHVzOiAnZmFpbCcsIG1lc3NhZ2U6ICdBY3Rpb24gbm90IHBlcm1pdHRlZCd9XG4jIFx0XHRcdFx0XHRkZWxldGU6XG4jIFx0XHRcdFx0XHRcdGFjdGlvbjogLT5cbiMgXHRcdFx0XHRcdFx0XHRjb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKGtleSlcbiMgXHRcdFx0XHRcdFx0XHRpZiBub3QgY29sbGVjdGlvblxuIyBcdFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XG4jIFx0XHRcdFx0XHRcdFx0XHRib2R5OiB7c3RhdHVzOiAnZmFpbCcsIG1lc3NhZ2U6ICdDb2xsZWN0aW9uIG5vdCBmb3VuZCd9XG5cbiMgXHRcdFx0XHRcdFx0XHRwZXJtaXNzaW9ucyA9IENyZWF0b3IuZ2V0T2JqZWN0UGVybWlzc2lvbnMoQHNwYWNlSWQsIEB1c2VySWQsIGtleSlcbiMgXHRcdFx0XHRcdFx0XHRpZiBwZXJtaXNzaW9ucy5hbGxvd0RlbGV0ZVxuIyBcdFx0XHRcdFx0XHRcdFx0XHRzZWxlY3RvciA9IHtfaWQ6IEB1cmxQYXJhbXMuaWQsIHNwYWNlOiBAc3BhY2VJZH1cbiMgXHRcdFx0XHRcdFx0XHRcdFx0aWYgY29sbGVjdGlvbi5yZW1vdmUgc2VsZWN0b3JcbiMgXHRcdFx0XHRcdFx0XHRcdFx0XHR7c3RhdHVzOiAnc3VjY2VzcycsIG1lc3NhZ2U6ICdJdGVtIHJlbW92ZWQnfVxuIyBcdFx0XHRcdFx0XHRcdFx0XHRlbHNlXG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0XG4jIFx0XHRcdFx0XHRcdFx0XHRcdFx0Ym9keToge3N0YXR1czogJ2ZhaWwnLCBtZXNzYWdlOiAnSXRlbSBub3QgZm91bmQnfVxuIyBcdFx0XHRcdFx0XHRcdGVsc2VcbiMgXHRcdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwMFxuIyBcdFx0XHRcdFx0XHRcdFx0Ym9keToge3N0YXR1czogJ2ZhaWwnLCBtZXNzYWdlOiAnQWN0aW9uIG5vdCBwZXJtaXR0ZWQnfVxuIiwiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG4gIHZhciBNZXRlb3JPRGF0YUFQSVY0Um91dGVyLCBNZXRlb3JPRGF0YVJvdXRlciwgT0RhdGFSb3V0ZXIsIGFwcCwgZXhwcmVzcztcbiAgTWV0ZW9yT0RhdGFSb3V0ZXIgPSByZXF1aXJlKCdAc3RlZWRvcy9jb3JlJykuTWV0ZW9yT0RhdGFSb3V0ZXI7XG4gIE9EYXRhUm91dGVyID0gcmVxdWlyZSgnQHN0ZWVkb3MvY29yZScpLk9EYXRhUm91dGVyO1xuICBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpO1xuICBhcHAgPSBleHByZXNzKCk7XG4gIGFwcC51c2UoJy9hcGkvb2RhdGEvdjQnLCBNZXRlb3JPRGF0YVJvdXRlcik7XG4gIE1ldGVvck9EYXRhQVBJVjRSb3V0ZXIgPSByZXF1aXJlKCdAc3RlZWRvcy9jb3JlJykuTWV0ZW9yT0RhdGFBUElWNFJvdXRlcjtcbiAgaWYgKE1ldGVvck9EYXRhQVBJVjRSb3V0ZXIpIHtcbiAgICBhcHAudXNlKCcvYXBpL3Y0JywgTWV0ZW9yT0RhdGFBUElWNFJvdXRlcik7XG4gIH1cbiAgV2ViQXBwLmNvbm5lY3RIYW5kbGVycy51c2UoYXBwKTtcbiAgcmV0dXJuIF8uZWFjaChDcmVhdG9yLnN0ZWVkb3NTY2hlbWEuZ2V0RGF0YVNvdXJjZXMoKSwgZnVuY3Rpb24oZGF0YXNvdXJjZSwgbmFtZSkge1xuICAgIHZhciBvdGhlckFwcDtcbiAgICBpZiAobmFtZSAhPT0gJ2RlZmF1bHQnKSB7XG4gICAgICBvdGhlckFwcCA9IGV4cHJlc3MoKTtcbiAgICAgIG90aGVyQXBwLnVzZShcIi9hcGkvb2RhdGEvXCIgKyBuYW1lLCBPRGF0YVJvdXRlcik7XG4gICAgICByZXR1cm4gV2ViQXBwLmNvbm5lY3RIYW5kbGVycy51c2Uob3RoZXJBcHApO1xuICAgIH1cbiAgfSk7XG59KTtcbiIsIkZpYmVyID0gcmVxdWlyZSgnZmliZXJzJylcblxuYmFzaWNBdXRoID0gcmVxdWlyZSgnYmFzaWMtYXV0aCcpXG5cbmF1dGhvcml6YXRpb25DYWNoZSA9IHt9XG5cbkpzb25Sb3V0ZXMuTWlkZGxld2FyZS51c2UgJy9hcGkvb2RhdGEvdjQvJywgKHJlcSwgcmVzLCBuZXh0KS0+XG5cblx0RmliZXIoKCktPlxuXHRcdGlmICFyZXEudXNlcklkXG5cdFx0XHRpc0F1dGhlZCA9IGZhbHNlXG5cdFx0XHQjIG9hdXRoMumqjOivgVxuXHRcdFx0aWYgcmVxPy5xdWVyeT8uYWNjZXNzX3Rva2VuXG5cdFx0XHRcdGNvbnNvbGUubG9nICdPQXV0aDI6ICcsIHJlcS5xdWVyeS5hY2Nlc3NfdG9rZW5cblx0XHRcdFx0dXNlcklkID0gU3RlZWRvcy5nZXRVc2VySWRGcm9tQWNjZXNzVG9rZW4ocmVxLnF1ZXJ5LmFjY2Vzc190b2tlbilcblx0XHRcdFx0aWYgdXNlcklkXG5cdFx0XHRcdFx0dXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHtfaWQ6IHVzZXJJZH0pXG5cdFx0XHRcdFx0aWYgdXNlclxuXHRcdFx0XHRcdFx0aXNBdXRoZWQgPSB0cnVlXG5cdFx0XHQjIGJhc2lj6aqM6K+BXG5cdFx0XHRpZiByZXEuaGVhZGVyc1snYXV0aG9yaXphdGlvbiddXG5cdFx0XHRcdGF1dGggPSBiYXNpY0F1dGgucGFyc2UocmVxLmhlYWRlcnNbJ2F1dGhvcml6YXRpb24nXSlcblx0XHRcdFx0aWYgYXV0aFxuXHRcdFx0XHRcdHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh7dXNlcm5hbWU6IGF1dGgubmFtZX0sIHsgZmllbGRzOiB7ICdzZXJ2aWNlcyc6IDEgfSB9KVxuXHRcdFx0XHRcdGlmIHVzZXJcblx0XHRcdFx0XHRcdGlmIGF1dGhvcml6YXRpb25DYWNoZVthdXRoLm5hbWVdID09IGF1dGgucGFzc1xuXHRcdFx0XHRcdFx0XHRpc0F1dGhlZCA9IHRydWVcblx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0cmVzdWx0ID0gQWNjb3VudHMuX2NoZWNrUGFzc3dvcmQgdXNlciwgYXV0aC5wYXNzXG5cdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHRpZiAhcmVzdWx0LmVycm9yXG5cdFx0XHRcdFx0XHRcdFx0aXNBdXRoZWQgPSB0cnVlXG5cdFx0XHRcdFx0XHRcdFx0aWYgXy5rZXlzKGF1dGhvcml6YXRpb25DYWNoZSkubGVuZ3RoID4gMTAwXG5cdFx0XHRcdFx0XHRcdFx0XHRhdXRob3JpemF0aW9uQ2FjaGUgPSB7fVxuXHRcdFx0XHRcdFx0XHRcdGF1dGhvcml6YXRpb25DYWNoZVthdXRoLm5hbWVdID0gYXV0aC5wYXNzXG5cdFx0XHRpZiBpc0F1dGhlZFxuXHRcdFx0XHRyZXEuaGVhZGVyc1sneC11c2VyLWlkJ10gPSB1c2VyLl9pZFxuXHRcdFx0XHR0b2tlbiA9IG51bGxcblx0XHRcdFx0YXBwX2lkID0gXCJjcmVhdG9yXCJcblx0XHRcdFx0Y2xpZW50X2lkID0gXCJwY1wiXG5cdFx0XHRcdGxvZ2luVG9rZW5zID0gdXNlci5zZXJ2aWNlcz8ucmVzdW1lPy5sb2dpblRva2Vuc1xuXHRcdFx0XHRpZiBsb2dpblRva2Vuc1xuXHRcdFx0XHRcdGFwcF9sb2dpbl90b2tlbiA9IF8uZmluZChsb2dpblRva2VucywgKHQpLT5cblx0XHRcdFx0XHRcdHJldHVybiB0LmFwcF9pZCBpcyBhcHBfaWQgYW5kIHQuY2xpZW50X2lkIGlzIGNsaWVudF9pZFxuXHRcdFx0XHRcdClcblx0XHRcdFx0XHR0b2tlbiA9IGFwcF9sb2dpbl90b2tlbi50b2tlbiBpZiBhcHBfbG9naW5fdG9rZW5cblxuXHRcdFx0XHRpZiBub3QgdG9rZW5cblx0XHRcdFx0XHRhdXRoVG9rZW4gPSBBY2NvdW50cy5fZ2VuZXJhdGVTdGFtcGVkTG9naW5Ub2tlbigpXG5cdFx0XHRcdFx0dG9rZW4gPSBhdXRoVG9rZW4udG9rZW5cblx0XHRcdFx0XHRoYXNoZWRUb2tlbiA9IEFjY291bnRzLl9oYXNoU3RhbXBlZFRva2VuIGF1dGhUb2tlblxuXHRcdFx0XHRcdGhhc2hlZFRva2VuLmFwcF9pZCA9IGFwcF9pZFxuXHRcdFx0XHRcdGhhc2hlZFRva2VuLmNsaWVudF9pZCA9IGNsaWVudF9pZFxuXHRcdFx0XHRcdGhhc2hlZFRva2VuLnRva2VuID0gdG9rZW5cblx0XHRcdFx0XHRBY2NvdW50cy5faW5zZXJ0SGFzaGVkTG9naW5Ub2tlbiB1c2VyLl9pZCwgaGFzaGVkVG9rZW5cblxuXHRcdFx0XHRpZiB0b2tlblxuXHRcdFx0XHRcdHJlcS5oZWFkZXJzWyd4LWF1dGgtdG9rZW4nXSA9IHRva2VuXG5cdFx0bmV4dCgpXG5cdCkucnVuKClcbiIsInZhciBGaWJlciwgYXV0aG9yaXphdGlvbkNhY2hlLCBiYXNpY0F1dGg7XG5cbkZpYmVyID0gcmVxdWlyZSgnZmliZXJzJyk7XG5cbmJhc2ljQXV0aCA9IHJlcXVpcmUoJ2Jhc2ljLWF1dGgnKTtcblxuYXV0aG9yaXphdGlvbkNhY2hlID0ge307XG5cbkpzb25Sb3V0ZXMuTWlkZGxld2FyZS51c2UoJy9hcGkvb2RhdGEvdjQvJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgcmV0dXJuIEZpYmVyKGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcHBfaWQsIGFwcF9sb2dpbl90b2tlbiwgYXV0aCwgYXV0aFRva2VuLCBjbGllbnRfaWQsIGhhc2hlZFRva2VuLCBpc0F1dGhlZCwgbG9naW5Ub2tlbnMsIHJlZiwgcmVmMSwgcmVmMiwgcmVzdWx0LCB0b2tlbiwgdXNlciwgdXNlcklkO1xuICAgIGlmICghcmVxLnVzZXJJZCkge1xuICAgICAgaXNBdXRoZWQgPSBmYWxzZTtcbiAgICAgIGlmIChyZXEgIT0gbnVsbCA/IChyZWYgPSByZXEucXVlcnkpICE9IG51bGwgPyByZWYuYWNjZXNzX3Rva2VuIDogdm9pZCAwIDogdm9pZCAwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdPQXV0aDI6ICcsIHJlcS5xdWVyeS5hY2Nlc3NfdG9rZW4pO1xuICAgICAgICB1c2VySWQgPSBTdGVlZG9zLmdldFVzZXJJZEZyb21BY2Nlc3NUb2tlbihyZXEucXVlcnkuYWNjZXNzX3Rva2VuKTtcbiAgICAgICAgaWYgKHVzZXJJZCkge1xuICAgICAgICAgIHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh7XG4gICAgICAgICAgICBfaWQ6IHVzZXJJZFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICBpc0F1dGhlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAocmVxLmhlYWRlcnNbJ2F1dGhvcml6YXRpb24nXSkge1xuICAgICAgICBhdXRoID0gYmFzaWNBdXRoLnBhcnNlKHJlcS5oZWFkZXJzWydhdXRob3JpemF0aW9uJ10pO1xuICAgICAgICBpZiAoYXV0aCkge1xuICAgICAgICAgIHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh7XG4gICAgICAgICAgICB1c2VybmFtZTogYXV0aC5uYW1lXG4gICAgICAgICAgfSwge1xuICAgICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICAgICdzZXJ2aWNlcyc6IDFcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgaWYgKGF1dGhvcml6YXRpb25DYWNoZVthdXRoLm5hbWVdID09PSBhdXRoLnBhc3MpIHtcbiAgICAgICAgICAgICAgaXNBdXRoZWQgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVzdWx0ID0gQWNjb3VudHMuX2NoZWNrUGFzc3dvcmQodXNlciwgYXV0aC5wYXNzKTtcbiAgICAgICAgICAgICAgaWYgKCFyZXN1bHQuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBpc0F1dGhlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgaWYgKF8ua2V5cyhhdXRob3JpemF0aW9uQ2FjaGUpLmxlbmd0aCA+IDEwMCkge1xuICAgICAgICAgICAgICAgICAgYXV0aG9yaXphdGlvbkNhY2hlID0ge307XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGF1dGhvcml6YXRpb25DYWNoZVthdXRoLm5hbWVdID0gYXV0aC5wYXNzO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoaXNBdXRoZWQpIHtcbiAgICAgICAgcmVxLmhlYWRlcnNbJ3gtdXNlci1pZCddID0gdXNlci5faWQ7XG4gICAgICAgIHRva2VuID0gbnVsbDtcbiAgICAgICAgYXBwX2lkID0gXCJjcmVhdG9yXCI7XG4gICAgICAgIGNsaWVudF9pZCA9IFwicGNcIjtcbiAgICAgICAgbG9naW5Ub2tlbnMgPSAocmVmMSA9IHVzZXIuc2VydmljZXMpICE9IG51bGwgPyAocmVmMiA9IHJlZjEucmVzdW1lKSAhPSBudWxsID8gcmVmMi5sb2dpblRva2VucyA6IHZvaWQgMCA6IHZvaWQgMDtcbiAgICAgICAgaWYgKGxvZ2luVG9rZW5zKSB7XG4gICAgICAgICAgYXBwX2xvZ2luX3Rva2VuID0gXy5maW5kKGxvZ2luVG9rZW5zLCBmdW5jdGlvbih0KSB7XG4gICAgICAgICAgICByZXR1cm4gdC5hcHBfaWQgPT09IGFwcF9pZCAmJiB0LmNsaWVudF9pZCA9PT0gY2xpZW50X2lkO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmIChhcHBfbG9naW5fdG9rZW4pIHtcbiAgICAgICAgICAgIHRva2VuID0gYXBwX2xvZ2luX3Rva2VuLnRva2VuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRva2VuKSB7XG4gICAgICAgICAgYXV0aFRva2VuID0gQWNjb3VudHMuX2dlbmVyYXRlU3RhbXBlZExvZ2luVG9rZW4oKTtcbiAgICAgICAgICB0b2tlbiA9IGF1dGhUb2tlbi50b2tlbjtcbiAgICAgICAgICBoYXNoZWRUb2tlbiA9IEFjY291bnRzLl9oYXNoU3RhbXBlZFRva2VuKGF1dGhUb2tlbik7XG4gICAgICAgICAgaGFzaGVkVG9rZW4uYXBwX2lkID0gYXBwX2lkO1xuICAgICAgICAgIGhhc2hlZFRva2VuLmNsaWVudF9pZCA9IGNsaWVudF9pZDtcbiAgICAgICAgICBoYXNoZWRUb2tlbi50b2tlbiA9IHRva2VuO1xuICAgICAgICAgIEFjY291bnRzLl9pbnNlcnRIYXNoZWRMb2dpblRva2VuKHVzZXIuX2lkLCBoYXNoZWRUb2tlbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRva2VuKSB7XG4gICAgICAgICAgcmVxLmhlYWRlcnNbJ3gtYXV0aC10b2tlbiddID0gdG9rZW47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5leHQoKTtcbiAgfSkucnVuKCk7XG59KTtcbiIsIk1ldGVvci5zdGFydHVwIC0+XG5cdFNlcnZpY2VNZXRhZGF0YSA9IHJlcXVpcmUoJ29kYXRhLXY0LXNlcnZpY2UtbWV0YWRhdGEnKS5TZXJ2aWNlTWV0YWRhdGE7XG5cdFNlcnZpY2VEb2N1bWVudCA9IHJlcXVpcmUoJ29kYXRhLXY0LXNlcnZpY2UtZG9jdW1lbnQnKS5TZXJ2aWNlRG9jdW1lbnQ7XG5cdF9OVU1CRVJfVFlQRVMgPSBbXCJudW1iZXJcIiwgXCJjdXJyZW5jeVwiXVxuXG5cdF9CT09MRUFOX1RZUEVTID0gW1wiYm9vbGVhblwiXVxuXG5cdF9EQVRFVElNRV9PRkZTRVRfVFlQRVMgPSBbJ2RhdGV0aW1lJ11cblxuXHRfTkFNRVNQQUNFID0gXCJDcmVhdG9yRW50aXRpZXNcIlxuXG5cdGdldE9iamVjdHNPZGF0YVNjaGVtYSA9IChzcGFjZUlkKS0+XG5cdFx0c2NoZW1hID0ge3ZlcnNpb246IFN0ZWVkb3NPRGF0YS5WRVJTSU9OLCBkYXRhU2VydmljZXM6IHtzY2hlbWE6IFtdfX1cblxuXHRcdGVudGl0aWVzX3NjaGVtYSA9IHt9XG5cblx0XHRlbnRpdGllc19zY2hlbWEubmFtZXNwYWNlID0gX05BTUVTUEFDRVxuXG5cdFx0ZW50aXRpZXNfc2NoZW1hLmVudGl0eVR5cGUgPSBbXVxuXG5cdFx0ZW50aXRpZXNfc2NoZW1hLmFubm90YXRpb25zID0gW11cblxuXHRcdF8uZWFjaCBDcmVhdG9yLkNvbGxlY3Rpb25zLCAodmFsdWUsIGtleSwgbGlzdCktPlxuXHRcdFx0X29iamVjdCA9IENyZWF0b3IuZ2V0T2JqZWN0KGtleSwgc3BhY2VJZClcblx0XHRcdGlmIG5vdCBfb2JqZWN0Py5lbmFibGVfYXBpXG5cdFx0XHRcdHJldHVyblxuXG5cdFx0XHQjIOS4u+mUrlxuXHRcdFx0a2V5cyA9IFt7cHJvcGVydHlSZWY6IHtuYW1lOiBcIl9pZFwiLCBjb21wdXRlZEtleTogdHJ1ZX19XVxuXG5cdFx0XHRlbnRpdGllID0ge1xuXHRcdFx0XHRuYW1lOiBfb2JqZWN0Lm5hbWVcblx0XHRcdFx0a2V5OmtleXNcblx0XHRcdH1cblxuXHRcdFx0a2V5cy5mb3JFYWNoIChfa2V5KS0+XG5cdFx0XHRcdGVudGl0aWVzX3NjaGVtYS5hbm5vdGF0aW9ucy5wdXNoIHtcblx0XHRcdFx0XHR0YXJnZXQ6IF9OQU1FU1BBQ0UgKyBcIi5cIiArIF9vYmplY3QubmFtZSArIFwiL1wiICsgX2tleS5wcm9wZXJ0eVJlZi5uYW1lLFxuXHRcdFx0XHRcdGFubm90YXRpb246IFt7XG5cdFx0XHRcdFx0XHRcInRlcm1cIjogXCJPcmcuT0RhdGEuQ29yZS5WMS5Db21wdXRlZFwiLFxuXHRcdFx0XHRcdFx0XCJib29sXCI6IFwidHJ1ZVwiXG5cdFx0XHRcdFx0fV1cblx0XHRcdFx0fVxuXG5cdFx0XHQjIEVudGl0eVR5cGVcblx0XHRcdHByb3BlcnR5ID0gW11cblx0XHRcdHByb3BlcnR5LnB1c2gge25hbWU6IFwiX2lkXCIsIHR5cGU6IFwiRWRtLlN0cmluZ1wiLCBudWxsYWJsZTogZmFsc2V9XG5cblx0XHRcdG5hdmlnYXRpb25Qcm9wZXJ0eSA9IFtdXG5cblx0XHRcdF8uZm9yRWFjaCBfb2JqZWN0LmZpZWxkcywgKGZpZWxkLCBmaWVsZF9uYW1lKS0+XG5cblx0XHRcdFx0X3Byb3BlcnR5ID0ge25hbWU6IGZpZWxkX25hbWUsIHR5cGU6IFwiRWRtLlN0cmluZ1wifVxuXG5cdFx0XHRcdGlmIF8uY29udGFpbnMgX05VTUJFUl9UWVBFUywgZmllbGQudHlwZVxuXHRcdFx0XHRcdF9wcm9wZXJ0eS50eXBlID0gXCJFZG0uRG91YmxlXCJcblx0XHRcdFx0ZWxzZSBpZiBfLmNvbnRhaW5zIF9CT09MRUFOX1RZUEVTLCBmaWVsZC50eXBlXG5cdFx0XHRcdFx0X3Byb3BlcnR5LnR5cGUgPSBcIkVkbS5Cb29sZWFuXCJcblx0XHRcdFx0ZWxzZSBpZiBfLmNvbnRhaW5zIF9EQVRFVElNRV9PRkZTRVRfVFlQRVMsIGZpZWxkLnR5cGVcblx0XHRcdFx0XHRfcHJvcGVydHkudHlwZSA9IFwiRWRtLkRhdGVUaW1lT2Zmc2V0XCJcblx0XHRcdFx0XHRfcHJvcGVydHkucHJlY2lzaW9uID0gXCI4XCJcblxuXHRcdFx0XHRpZiBmaWVsZC5yZXF1aXJlZFxuXHRcdFx0XHRcdF9wcm9wZXJ0eS5udWxsYWJsZSA9IGZhbHNlXG5cblx0XHRcdFx0cHJvcGVydHkucHVzaCBfcHJvcGVydHlcblxuXHRcdFx0XHRyZWZlcmVuY2VfdG8gPSBmaWVsZC5yZWZlcmVuY2VfdG9cblxuXHRcdFx0XHRpZiByZWZlcmVuY2VfdG9cblx0XHRcdFx0XHRpZiAhXy5pc0FycmF5KHJlZmVyZW5jZV90bylcblx0XHRcdFx0XHRcdHJlZmVyZW5jZV90byA9IFtyZWZlcmVuY2VfdG9dXG5cblx0XHRcdFx0XHRyZWZlcmVuY2VfdG8uZm9yRWFjaCAociktPlxuXHRcdFx0XHRcdFx0cmVmZXJlbmNlX29iaiA9IENyZWF0b3IuZ2V0T2JqZWN0KHIsIHNwYWNlSWQpXG5cdFx0XHRcdFx0XHRpZiByZWZlcmVuY2Vfb2JqXG5cdFx0XHRcdFx0XHRcdF9uYW1lID0gZmllbGRfbmFtZSArIFN0ZWVkb3NPRGF0YS5FWFBBTkRfRklFTERfU1VGRklYXG5cdFx0XHRcdFx0XHRcdGlmIF8uaXNBcnJheShmaWVsZC5yZWZlcmVuY2VfdG8pXG5cdFx0XHRcdFx0XHRcdFx0X25hbWUgPSBmaWVsZF9uYW1lICsgU3RlZWRvc09EYXRhLkVYUEFORF9GSUVMRF9TVUZGSVggKyBcIi5cIiArIHJlZmVyZW5jZV9vYmoubmFtZVxuXHRcdFx0XHRcdFx0XHRuYXZpZ2F0aW9uUHJvcGVydHkucHVzaCB7XG5cdFx0XHRcdFx0XHRcdFx0bmFtZTogX25hbWUsXG5cdCNcdFx0XHRcdFx0XHRcdHR5cGU6IFwiQ29sbGVjdGlvbihcIiArIF9OQU1FU1BBQ0UgKyBcIi5cIiArIHJlZmVyZW5jZV9vYmoubmFtZSArIFwiKVwiLFxuXHRcdFx0XHRcdFx0XHRcdHR5cGU6IF9OQU1FU1BBQ0UgKyBcIi5cIiArIHJlZmVyZW5jZV9vYmoubmFtZVxuXHRcdFx0XHRcdFx0XHRcdHBhcnRuZXI6IF9vYmplY3QubmFtZSAjVE9ET1xuXHRcdFx0XHRcdFx0XHRcdF9yZV9uYW1lOiByZWZlcmVuY2Vfb2JqLm5hbWVcblx0XHRcdFx0XHRcdFx0XHRyZWZlcmVudGlhbENvbnN0cmFpbnQ6IFtcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0cHJvcGVydHk6IGZpZWxkX25hbWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJlZmVyZW5jZWRQcm9wZXJ0eTogXCJfaWRcIlxuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdF1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLndhcm4gXCJyZWZlcmVuY2UgdG8gJyN7cn0nIGludmFsaWQuXCJcblxuXHRcdFx0ZW50aXRpZS5wcm9wZXJ0eSA9IHByb3BlcnR5XG5cdFx0XHRlbnRpdGllLm5hdmlnYXRpb25Qcm9wZXJ0eSA9IG5hdmlnYXRpb25Qcm9wZXJ0eVxuXG5cdFx0XHRlbnRpdGllc19zY2hlbWEuZW50aXR5VHlwZS5wdXNoIGVudGl0aWVcblxuXHRcdHNjaGVtYS5kYXRhU2VydmljZXMuc2NoZW1hLnB1c2ggZW50aXRpZXNfc2NoZW1hXG5cblxuXHRcdGNvbnRhaW5lcl9zY2hlbWEgPSB7fVxuXHRcdGNvbnRhaW5lcl9zY2hlbWEuZW50aXR5Q29udGFpbmVyID0ge25hbWU6IFwiY29udGFpbmVyXCJ9XG5cdFx0Y29udGFpbmVyX3NjaGVtYS5lbnRpdHlDb250YWluZXIuZW50aXR5U2V0ID0gW11cblxuXHRcdF8uZm9yRWFjaCBlbnRpdGllc19zY2hlbWEuZW50aXR5VHlwZSwgKF9ldCwgayktPlxuXHRcdFx0Y29udGFpbmVyX3NjaGVtYS5lbnRpdHlDb250YWluZXIuZW50aXR5U2V0LnB1c2gge1xuXHRcdFx0XHRcIm5hbWVcIjogX2V0Lm5hbWUsXG5cdFx0XHRcdFwiZW50aXR5VHlwZVwiOiBfTkFNRVNQQUNFICsgXCIuXCIgKyBfZXQubmFtZSxcblx0XHRcdFx0XCJuYXZpZ2F0aW9uUHJvcGVydHlCaW5kaW5nXCI6IFtdXG5cdFx0XHR9XG5cblx0XHQjIFRPRE8gU2VydmljZU1ldGFkYXRh5LiN5pSv5oyBbmF2aWdhdGlvblByb3BlcnR5QmluZGluZ+WxnuaAp1xuI1x0XHRfLmZvckVhY2ggZW50aXRpZXNfc2NoZW1hLmVudGl0eVR5cGUsIChfZXQsIGspLT5cbiNcdFx0XHRfLmZvckVhY2ggX2V0Lm5hdmlnYXRpb25Qcm9wZXJ0eSwgKF9ldF9ucCwgbnBfayktPlxuI1x0XHRcdFx0X2VzID0gXy5maW5kIGNvbnRhaW5lcl9zY2hlbWEuZW50aXR5Q29udGFpbmVyLmVudGl0eVNldCwgKF9lcyktPlxuI1x0XHRcdFx0XHRcdFx0cmV0dXJuIF9lcy5uYW1lID09IF9ldF9ucC5wYXJ0bmVyXG4jXG4jXHRcdFx0XHRfZXM/Lm5hdmlnYXRpb25Qcm9wZXJ0eUJpbmRpbmcucHVzaCB7XCJwYXRoXCI6IF9ldF9ucC5fcmVfbmFtZSwgXCJ0YXJnZXRcIjogX2V0X25wLl9yZV9uYW1lfVxuI1x0XHRcdFx0Y29uc29sZS5sb2coXCJfZXNcIiwgX2VzKVxuI1xuI1x0XHRjb25zb2xlLmxvZyhcImNvbnRhaW5lcl9zY2hlbWFcIiwgSlNPTi5zdHJpbmdpZnkoY29udGFpbmVyX3NjaGVtYSkpXG5cblx0XHRzY2hlbWEuZGF0YVNlcnZpY2VzLnNjaGVtYS5wdXNoIGNvbnRhaW5lcl9zY2hlbWFcblxuXHRcdHJldHVybiBzY2hlbWFcblxuXHRTdGVlZG9zT2RhdGFBUEkuYWRkUm91dGUoJycsIHthdXRoUmVxdWlyZWQ6IFN0ZWVkb3NPRGF0YS5BVVRIUkVRVUlSRUR9LCB7XG5cdFx0Z2V0OiAoKS0+XG5cdFx0XHRjb250ZXh0ID0gU3RlZWRvc09EYXRhLmdldE1ldGFEYXRhUGF0aChAdXJsUGFyYW1zPy5zcGFjZUlkKVxuXHRcdFx0c2VydmljZURvY3VtZW50ICA9IFNlcnZpY2VEb2N1bWVudC5wcm9jZXNzTWV0YWRhdGFKc29uKGdldE9iamVjdHNPZGF0YVNjaGVtYShAdXJsUGFyYW1zPy5zcGFjZUlkKSwge2NvbnRleHQ6IGNvbnRleHR9KTtcblx0XHRcdGJvZHkgPSBzZXJ2aWNlRG9jdW1lbnQuZG9jdW1lbnQoKVxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHRcdCdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCcsXG5cdFx0XHRcdFx0J09EYXRhLVZlcnNpb24nOiBTdGVlZG9zT0RhdGEuVkVSU0lPTlxuXHRcdFx0XHR9LFxuXHRcdFx0XHRib2R5OiBzZXJ2aWNlRG9jdW1lbnQuZG9jdW1lbnQoKVxuXHRcdFx0fTtcblx0fSlcblxuXHRTdGVlZG9zT2RhdGFBUEkuYWRkUm91dGUoU3RlZWRvc09EYXRhLk1FVEFEQVRBX1BBVEgsIHthdXRoUmVxdWlyZWQ6IFN0ZWVkb3NPRGF0YS5BVVRIUkVRVUlSRUR9LCB7XG5cdFx0Z2V0OiAoKS0+XG5cdFx0XHRzZXJ2aWNlTWV0YWRhdGEgPSBTZXJ2aWNlTWV0YWRhdGEucHJvY2Vzc01ldGFkYXRhSnNvbihnZXRPYmplY3RzT2RhdGFTY2hlbWEoQHVybFBhcmFtcz8uc3BhY2VJZCkpXG5cdFx0XHRib2R5ID0gc2VydmljZU1ldGFkYXRhLmRvY3VtZW50KClcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0XHQnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3htbDsgY2hhcnNldD11dGYtOCcsXG5cdFx0XHRcdFx0J09EYXRhLVZlcnNpb24nOiBTdGVlZG9zT0RhdGEuVkVSU0lPTlxuXHRcdFx0XHR9LFxuXHRcdFx0XHRib2R5OiBib2R5XG5cdFx0XHR9O1xuXHR9KSIsIk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuICB2YXIgU2VydmljZURvY3VtZW50LCBTZXJ2aWNlTWV0YWRhdGEsIF9CT09MRUFOX1RZUEVTLCBfREFURVRJTUVfT0ZGU0VUX1RZUEVTLCBfTkFNRVNQQUNFLCBfTlVNQkVSX1RZUEVTLCBnZXRPYmplY3RzT2RhdGFTY2hlbWE7XG4gIFNlcnZpY2VNZXRhZGF0YSA9IHJlcXVpcmUoJ29kYXRhLXY0LXNlcnZpY2UtbWV0YWRhdGEnKS5TZXJ2aWNlTWV0YWRhdGE7XG4gIFNlcnZpY2VEb2N1bWVudCA9IHJlcXVpcmUoJ29kYXRhLXY0LXNlcnZpY2UtZG9jdW1lbnQnKS5TZXJ2aWNlRG9jdW1lbnQ7XG4gIF9OVU1CRVJfVFlQRVMgPSBbXCJudW1iZXJcIiwgXCJjdXJyZW5jeVwiXTtcbiAgX0JPT0xFQU5fVFlQRVMgPSBbXCJib29sZWFuXCJdO1xuICBfREFURVRJTUVfT0ZGU0VUX1RZUEVTID0gWydkYXRldGltZSddO1xuICBfTkFNRVNQQUNFID0gXCJDcmVhdG9yRW50aXRpZXNcIjtcbiAgZ2V0T2JqZWN0c09kYXRhU2NoZW1hID0gZnVuY3Rpb24oc3BhY2VJZCkge1xuICAgIHZhciBjb250YWluZXJfc2NoZW1hLCBlbnRpdGllc19zY2hlbWEsIHNjaGVtYTtcbiAgICBzY2hlbWEgPSB7XG4gICAgICB2ZXJzaW9uOiBTdGVlZG9zT0RhdGEuVkVSU0lPTixcbiAgICAgIGRhdGFTZXJ2aWNlczoge1xuICAgICAgICBzY2hlbWE6IFtdXG4gICAgICB9XG4gICAgfTtcbiAgICBlbnRpdGllc19zY2hlbWEgPSB7fTtcbiAgICBlbnRpdGllc19zY2hlbWEubmFtZXNwYWNlID0gX05BTUVTUEFDRTtcbiAgICBlbnRpdGllc19zY2hlbWEuZW50aXR5VHlwZSA9IFtdO1xuICAgIGVudGl0aWVzX3NjaGVtYS5hbm5vdGF0aW9ucyA9IFtdO1xuICAgIF8uZWFjaChDcmVhdG9yLkNvbGxlY3Rpb25zLCBmdW5jdGlvbih2YWx1ZSwga2V5LCBsaXN0KSB7XG4gICAgICB2YXIgX29iamVjdCwgZW50aXRpZSwga2V5cywgbmF2aWdhdGlvblByb3BlcnR5LCBwcm9wZXJ0eTtcbiAgICAgIF9vYmplY3QgPSBDcmVhdG9yLmdldE9iamVjdChrZXksIHNwYWNlSWQpO1xuICAgICAgaWYgKCEoX29iamVjdCAhPSBudWxsID8gX29iamVjdC5lbmFibGVfYXBpIDogdm9pZCAwKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBrZXlzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgcHJvcGVydHlSZWY6IHtcbiAgICAgICAgICAgIG5hbWU6IFwiX2lkXCIsXG4gICAgICAgICAgICBjb21wdXRlZEtleTogdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgXTtcbiAgICAgIGVudGl0aWUgPSB7XG4gICAgICAgIG5hbWU6IF9vYmplY3QubmFtZSxcbiAgICAgICAga2V5OiBrZXlzXG4gICAgICB9O1xuICAgICAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKF9rZXkpIHtcbiAgICAgICAgcmV0dXJuIGVudGl0aWVzX3NjaGVtYS5hbm5vdGF0aW9ucy5wdXNoKHtcbiAgICAgICAgICB0YXJnZXQ6IF9OQU1FU1BBQ0UgKyBcIi5cIiArIF9vYmplY3QubmFtZSArIFwiL1wiICsgX2tleS5wcm9wZXJ0eVJlZi5uYW1lLFxuICAgICAgICAgIGFubm90YXRpb246IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgXCJ0ZXJtXCI6IFwiT3JnLk9EYXRhLkNvcmUuVjEuQ29tcHV0ZWRcIixcbiAgICAgICAgICAgICAgXCJib29sXCI6IFwidHJ1ZVwiXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgcHJvcGVydHkgPSBbXTtcbiAgICAgIHByb3BlcnR5LnB1c2goe1xuICAgICAgICBuYW1lOiBcIl9pZFwiLFxuICAgICAgICB0eXBlOiBcIkVkbS5TdHJpbmdcIixcbiAgICAgICAgbnVsbGFibGU6IGZhbHNlXG4gICAgICB9KTtcbiAgICAgIG5hdmlnYXRpb25Qcm9wZXJ0eSA9IFtdO1xuICAgICAgXy5mb3JFYWNoKF9vYmplY3QuZmllbGRzLCBmdW5jdGlvbihmaWVsZCwgZmllbGRfbmFtZSkge1xuICAgICAgICB2YXIgX3Byb3BlcnR5LCByZWZlcmVuY2VfdG87XG4gICAgICAgIF9wcm9wZXJ0eSA9IHtcbiAgICAgICAgICBuYW1lOiBmaWVsZF9uYW1lLFxuICAgICAgICAgIHR5cGU6IFwiRWRtLlN0cmluZ1wiXG4gICAgICAgIH07XG4gICAgICAgIGlmIChfLmNvbnRhaW5zKF9OVU1CRVJfVFlQRVMsIGZpZWxkLnR5cGUpKSB7XG4gICAgICAgICAgX3Byb3BlcnR5LnR5cGUgPSBcIkVkbS5Eb3VibGVcIjtcbiAgICAgICAgfSBlbHNlIGlmIChfLmNvbnRhaW5zKF9CT09MRUFOX1RZUEVTLCBmaWVsZC50eXBlKSkge1xuICAgICAgICAgIF9wcm9wZXJ0eS50eXBlID0gXCJFZG0uQm9vbGVhblwiO1xuICAgICAgICB9IGVsc2UgaWYgKF8uY29udGFpbnMoX0RBVEVUSU1FX09GRlNFVF9UWVBFUywgZmllbGQudHlwZSkpIHtcbiAgICAgICAgICBfcHJvcGVydHkudHlwZSA9IFwiRWRtLkRhdGVUaW1lT2Zmc2V0XCI7XG4gICAgICAgICAgX3Byb3BlcnR5LnByZWNpc2lvbiA9IFwiOFwiO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaWVsZC5yZXF1aXJlZCkge1xuICAgICAgICAgIF9wcm9wZXJ0eS5udWxsYWJsZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHByb3BlcnR5LnB1c2goX3Byb3BlcnR5KTtcbiAgICAgICAgcmVmZXJlbmNlX3RvID0gZmllbGQucmVmZXJlbmNlX3RvO1xuICAgICAgICBpZiAocmVmZXJlbmNlX3RvKSB7XG4gICAgICAgICAgaWYgKCFfLmlzQXJyYXkocmVmZXJlbmNlX3RvKSkge1xuICAgICAgICAgICAgcmVmZXJlbmNlX3RvID0gW3JlZmVyZW5jZV90b107XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZWZlcmVuY2VfdG8uZm9yRWFjaChmdW5jdGlvbihyKSB7XG4gICAgICAgICAgICB2YXIgX25hbWUsIHJlZmVyZW5jZV9vYmo7XG4gICAgICAgICAgICByZWZlcmVuY2Vfb2JqID0gQ3JlYXRvci5nZXRPYmplY3Qociwgc3BhY2VJZCk7XG4gICAgICAgICAgICBpZiAocmVmZXJlbmNlX29iaikge1xuICAgICAgICAgICAgICBfbmFtZSA9IGZpZWxkX25hbWUgKyBTdGVlZG9zT0RhdGEuRVhQQU5EX0ZJRUxEX1NVRkZJWDtcbiAgICAgICAgICAgICAgaWYgKF8uaXNBcnJheShmaWVsZC5yZWZlcmVuY2VfdG8pKSB7XG4gICAgICAgICAgICAgICAgX25hbWUgPSBmaWVsZF9uYW1lICsgU3RlZWRvc09EYXRhLkVYUEFORF9GSUVMRF9TVUZGSVggKyBcIi5cIiArIHJlZmVyZW5jZV9vYmoubmFtZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gbmF2aWdhdGlvblByb3BlcnR5LnB1c2goe1xuICAgICAgICAgICAgICAgIG5hbWU6IF9uYW1lLFxuICAgICAgICAgICAgICAgIHR5cGU6IF9OQU1FU1BBQ0UgKyBcIi5cIiArIHJlZmVyZW5jZV9vYmoubmFtZSxcbiAgICAgICAgICAgICAgICBwYXJ0bmVyOiBfb2JqZWN0Lm5hbWUsXG4gICAgICAgICAgICAgICAgX3JlX25hbWU6IHJlZmVyZW5jZV9vYmoubmFtZSxcbiAgICAgICAgICAgICAgICByZWZlcmVudGlhbENvbnN0cmFpbnQ6IFtcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHk6IGZpZWxkX25hbWUsXG4gICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jZWRQcm9wZXJ0eTogXCJfaWRcIlxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gY29uc29sZS53YXJuKFwicmVmZXJlbmNlIHRvICdcIiArIHIgKyBcIicgaW52YWxpZC5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgZW50aXRpZS5wcm9wZXJ0eSA9IHByb3BlcnR5O1xuICAgICAgZW50aXRpZS5uYXZpZ2F0aW9uUHJvcGVydHkgPSBuYXZpZ2F0aW9uUHJvcGVydHk7XG4gICAgICByZXR1cm4gZW50aXRpZXNfc2NoZW1hLmVudGl0eVR5cGUucHVzaChlbnRpdGllKTtcbiAgICB9KTtcbiAgICBzY2hlbWEuZGF0YVNlcnZpY2VzLnNjaGVtYS5wdXNoKGVudGl0aWVzX3NjaGVtYSk7XG4gICAgY29udGFpbmVyX3NjaGVtYSA9IHt9O1xuICAgIGNvbnRhaW5lcl9zY2hlbWEuZW50aXR5Q29udGFpbmVyID0ge1xuICAgICAgbmFtZTogXCJjb250YWluZXJcIlxuICAgIH07XG4gICAgY29udGFpbmVyX3NjaGVtYS5lbnRpdHlDb250YWluZXIuZW50aXR5U2V0ID0gW107XG4gICAgXy5mb3JFYWNoKGVudGl0aWVzX3NjaGVtYS5lbnRpdHlUeXBlLCBmdW5jdGlvbihfZXQsIGspIHtcbiAgICAgIHJldHVybiBjb250YWluZXJfc2NoZW1hLmVudGl0eUNvbnRhaW5lci5lbnRpdHlTZXQucHVzaCh7XG4gICAgICAgIFwibmFtZVwiOiBfZXQubmFtZSxcbiAgICAgICAgXCJlbnRpdHlUeXBlXCI6IF9OQU1FU1BBQ0UgKyBcIi5cIiArIF9ldC5uYW1lLFxuICAgICAgICBcIm5hdmlnYXRpb25Qcm9wZXJ0eUJpbmRpbmdcIjogW11cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHNjaGVtYS5kYXRhU2VydmljZXMuc2NoZW1hLnB1c2goY29udGFpbmVyX3NjaGVtYSk7XG4gICAgcmV0dXJuIHNjaGVtYTtcbiAgfTtcbiAgU3RlZWRvc09kYXRhQVBJLmFkZFJvdXRlKCcnLCB7XG4gICAgYXV0aFJlcXVpcmVkOiBTdGVlZG9zT0RhdGEuQVVUSFJFUVVJUkVEXG4gIH0sIHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGJvZHksIGNvbnRleHQsIHJlZiwgcmVmMSwgc2VydmljZURvY3VtZW50O1xuICAgICAgY29udGV4dCA9IFN0ZWVkb3NPRGF0YS5nZXRNZXRhRGF0YVBhdGgoKHJlZiA9IHRoaXMudXJsUGFyYW1zKSAhPSBudWxsID8gcmVmLnNwYWNlSWQgOiB2b2lkIDApO1xuICAgICAgc2VydmljZURvY3VtZW50ID0gU2VydmljZURvY3VtZW50LnByb2Nlc3NNZXRhZGF0YUpzb24oZ2V0T2JqZWN0c09kYXRhU2NoZW1hKChyZWYxID0gdGhpcy51cmxQYXJhbXMpICE9IG51bGwgPyByZWYxLnNwYWNlSWQgOiB2b2lkIDApLCB7XG4gICAgICAgIGNvbnRleHQ6IGNvbnRleHRcbiAgICAgIH0pO1xuICAgICAgYm9keSA9IHNlcnZpY2VEb2N1bWVudC5kb2N1bWVudCgpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCcsXG4gICAgICAgICAgJ09EYXRhLVZlcnNpb24nOiBTdGVlZG9zT0RhdGEuVkVSU0lPTlxuICAgICAgICB9LFxuICAgICAgICBib2R5OiBzZXJ2aWNlRG9jdW1lbnQuZG9jdW1lbnQoKVxuICAgICAgfTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gU3RlZWRvc09kYXRhQVBJLmFkZFJvdXRlKFN0ZWVkb3NPRGF0YS5NRVRBREFUQV9QQVRILCB7XG4gICAgYXV0aFJlcXVpcmVkOiBTdGVlZG9zT0RhdGEuQVVUSFJFUVVJUkVEXG4gIH0sIHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGJvZHksIHJlZiwgc2VydmljZU1ldGFkYXRhO1xuICAgICAgc2VydmljZU1ldGFkYXRhID0gU2VydmljZU1ldGFkYXRhLnByb2Nlc3NNZXRhZGF0YUpzb24oZ2V0T2JqZWN0c09kYXRhU2NoZW1hKChyZWYgPSB0aGlzLnVybFBhcmFtcykgIT0gbnVsbCA/IHJlZi5zcGFjZUlkIDogdm9pZCAwKSk7XG4gICAgICBib2R5ID0gc2VydmljZU1ldGFkYXRhLmRvY3VtZW50KCk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94bWw7IGNoYXJzZXQ9dXRmLTgnLFxuICAgICAgICAgICdPRGF0YS1WZXJzaW9uJzogU3RlZWRvc09EYXRhLlZFUlNJT05cbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogYm9keVxuICAgICAgfTtcbiAgICB9XG4gIH0pO1xufSk7XG4iLCJAU3RlZWRvc09EYXRhID0ge31cblN0ZWVkb3NPRGF0YS5WRVJTSU9OID0gJzQuMCdcblN0ZWVkb3NPRGF0YS5BVVRIUkVRVUlSRUQgPSB0cnVlXG5TdGVlZG9zT0RhdGEuQVBJX1BBVEggPSAnL2FwaS9vZGF0YS92NC86c3BhY2VJZCdcblN0ZWVkb3NPRGF0YS5NRVRBREFUQV9QQVRIID0gJyRtZXRhZGF0YSdcblN0ZWVkb3NPRGF0YS5FWFBBTkRfRklFTERfU1VGRklYID0gXCJfZXhwYW5kXCJcblN0ZWVkb3NPRGF0YS5nZXRSb290UGF0aCA9IChzcGFjZUlkKS0+XG5cdHJldHVybiBNZXRlb3IuYWJzb2x1dGVVcmwoJ2FwaS9vZGF0YS92NC8nICsgc3BhY2VJZClcblxuU3RlZWRvc09EYXRhLmdldE9EYXRhUGF0aCA9IChzcGFjZUlkLG9iamVjdF9uYW1lKS0+XG5cdHJldHVybiBTdGVlZG9zT0RhdGEuZ2V0Um9vdFBhdGgoc3BhY2VJZCkgKyBcIi8je29iamVjdF9uYW1lfVwiXG5cbmlmIE1ldGVvci5pc1NlcnZlclxuXHRTdGVlZG9zT0RhdGEuZ2V0TWV0YURhdGFQYXRoID0gKHNwYWNlSWQpLT5cblx0XHRyZXR1cm4gU3RlZWRvc09EYXRhLmdldFJvb3RQYXRoKHNwYWNlSWQpICsgXCIvI3tTdGVlZG9zT0RhdGEuTUVUQURBVEFfUEFUSH1cIlxuXG5cdFN0ZWVkb3NPRGF0YS5nZXRPRGF0YUNvbnRleHRQYXRoID0gKHNwYWNlSWQsIG9iamVjdF9uYW1lKS0+XG5cdFx0cmV0dXJuIFN0ZWVkb3NPRGF0YS5nZXRNZXRhRGF0YVBhdGgoc3BhY2VJZCkgKyBcIiMje29iamVjdF9uYW1lfVwiXG5cdFN0ZWVkb3NPRGF0YS5nZXRPRGF0YU5leHRMaW5rUGF0aCA9IChzcGFjZUlkLG9iamVjdF9uYW1lKS0+XG5cdFx0cmV0dXJuIFN0ZWVkb3NPRGF0YS5nZXRSb290UGF0aChzcGFjZUlkKSArIFwiLyN7b2JqZWN0X25hbWV9XCJcblxuXG5cdEBTdGVlZG9zT2RhdGFBUEkgPSBuZXcgT2RhdGFSZXN0aXZ1c1xuXHRcdGFwaVBhdGg6IFN0ZWVkb3NPRGF0YS5BUElfUEFUSCxcblx0XHR1c2VEZWZhdWx0QXV0aDogdHJ1ZVxuXHRcdHByZXR0eUpzb246IHRydWVcblx0XHRlbmFibGVDb3JzOiB0cnVlXG5cdFx0ZGVmYXVsdEhlYWRlcnM6XG5cdFx0XHQnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4iLCJ0aGlzLlN0ZWVkb3NPRGF0YSA9IHt9O1xuXG5TdGVlZG9zT0RhdGEuVkVSU0lPTiA9ICc0LjAnO1xuXG5TdGVlZG9zT0RhdGEuQVVUSFJFUVVJUkVEID0gdHJ1ZTtcblxuU3RlZWRvc09EYXRhLkFQSV9QQVRIID0gJy9hcGkvb2RhdGEvdjQvOnNwYWNlSWQnO1xuXG5TdGVlZG9zT0RhdGEuTUVUQURBVEFfUEFUSCA9ICckbWV0YWRhdGEnO1xuXG5TdGVlZG9zT0RhdGEuRVhQQU5EX0ZJRUxEX1NVRkZJWCA9IFwiX2V4cGFuZFwiO1xuXG5TdGVlZG9zT0RhdGEuZ2V0Um9vdFBhdGggPSBmdW5jdGlvbihzcGFjZUlkKSB7XG4gIHJldHVybiBNZXRlb3IuYWJzb2x1dGVVcmwoJ2FwaS9vZGF0YS92NC8nICsgc3BhY2VJZCk7XG59O1xuXG5TdGVlZG9zT0RhdGEuZ2V0T0RhdGFQYXRoID0gZnVuY3Rpb24oc3BhY2VJZCwgb2JqZWN0X25hbWUpIHtcbiAgcmV0dXJuIFN0ZWVkb3NPRGF0YS5nZXRSb290UGF0aChzcGFjZUlkKSArIChcIi9cIiArIG9iamVjdF9uYW1lKTtcbn07XG5cbmlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcbiAgU3RlZWRvc09EYXRhLmdldE1ldGFEYXRhUGF0aCA9IGZ1bmN0aW9uKHNwYWNlSWQpIHtcbiAgICByZXR1cm4gU3RlZWRvc09EYXRhLmdldFJvb3RQYXRoKHNwYWNlSWQpICsgKFwiL1wiICsgU3RlZWRvc09EYXRhLk1FVEFEQVRBX1BBVEgpO1xuICB9O1xuICBTdGVlZG9zT0RhdGEuZ2V0T0RhdGFDb250ZXh0UGF0aCA9IGZ1bmN0aW9uKHNwYWNlSWQsIG9iamVjdF9uYW1lKSB7XG4gICAgcmV0dXJuIFN0ZWVkb3NPRGF0YS5nZXRNZXRhRGF0YVBhdGgoc3BhY2VJZCkgKyAoXCIjXCIgKyBvYmplY3RfbmFtZSk7XG4gIH07XG4gIFN0ZWVkb3NPRGF0YS5nZXRPRGF0YU5leHRMaW5rUGF0aCA9IGZ1bmN0aW9uKHNwYWNlSWQsIG9iamVjdF9uYW1lKSB7XG4gICAgcmV0dXJuIFN0ZWVkb3NPRGF0YS5nZXRSb290UGF0aChzcGFjZUlkKSArIChcIi9cIiArIG9iamVjdF9uYW1lKTtcbiAgfTtcbiAgdGhpcy5TdGVlZG9zT2RhdGFBUEkgPSBuZXcgT2RhdGFSZXN0aXZ1cyh7XG4gICAgYXBpUGF0aDogU3RlZWRvc09EYXRhLkFQSV9QQVRILFxuICAgIHVzZURlZmF1bHRBdXRoOiB0cnVlLFxuICAgIHByZXR0eUpzb246IHRydWUsXG4gICAgZW5hYmxlQ29yczogdHJ1ZSxcbiAgICBkZWZhdWx0SGVhZGVyczoge1xuICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgIH1cbiAgfSk7XG59XG4iXX0=
