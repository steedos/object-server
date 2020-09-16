(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Random = Package.random.Random;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var BlazeLayout = Package['kadira:blaze-layout'].BlazeLayout;
var FlowRouter = Package['kadira:flow-router'].FlowRouter;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var check = Package.check.check;
var Match = Package.check.Match;
var Async = Package['meteorhacks:async'].Async;
var JsonRoutes = Package['simple:json-routes'].JsonRoutes;
var RestMiddleware = Package['simple:json-routes'].RestMiddleware;
var SubsManager = Package['meteorhacks:subs-manager'].SubsManager;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var Selector = Package['steedos:base'].Selector;
var Steedos = Package['steedos:base'].Steedos;
var AjaxCollection = Package['steedos:base'].AjaxCollection;
var SteedosDataManager = Package['steedos:base'].SteedosDataManager;
var SteedosOffice = Package['steedos:base'].SteedosOffice;
var billingManager = Package['steedos:base'].billingManager;
var _i18n = Package['universe:i18n']._i18n;
var i18n = Package['universe:i18n'].i18n;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var refreshTokensCollection, authCodesCollection, spaceId, oAuth2Server, MeteorModel, client, __coffeescriptShare;

(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/steedos_oauth2-server/lib/common.js                                                                 //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
db.OAuth2Clients = new Meteor.Collection('OAuth2Clients');
db.OAuth2Clients.allow({
    insert: function(userId, doc) {
        return true;
    },
    update: function(userId, doc, fieldNames, modifier) {
        return true;
    },
    remove: function(userId, doc) {
        return true;
    }
});

refreshTokensCollection = new Meteor.Collection('OAuth2RefreshTokens');
refreshTokensCollection.allow({
    insert: function(userId, doc) {
        return Meteor.isServer && userId && userId === doc.userId;
    },
    update: function(userId, doc, fieldNames, modifier) {
        return false;
    },
    remove: function(userId, doc) {
        return userId && userId === doc.userId;
    }
});

authCodesCollection = new Meteor.Collection('OAuth2AuthCodes');
authCodesCollection.allow({
    insert: function(userId, doc) {
        return Meteor.isServer && userId && userId === doc.userId;
    },
    update: function(userId, doc, fieldNames, modifier) {
        return false;
    },
    remove: function(userId, doc) {
        return userId && userId === doc.userId;
    }
});

if(Meteor.isServer){
    authCodesCollection.before.insert(function(userId, doc){
        spaceId = db.space_users.findOne({user: doc.userId}).space;
        doc.spaceId = spaceId;
    });
}


oAuth2Server = {
    pubSubNames: {
        authCodes: 'oauth2/authCodes',
        refreshTokens: 'oauth2/refreshTokens'
    },
    methodNames: {
        authCodeGrant: 'oauth2/authCodeGrant'
    },
    collections: {
        refreshToken: refreshTokensCollection,
        authCode: authCodesCollection,
        clients: db.OAuth2Clients
    }
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/steedos_oauth2-server/lib/meteor-model.js                                                           //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
/**
 * A oauth2-server model for dealing with the meteor collections. Original code
 * from: https://github.com/RocketChat/rocketchat-oauth2-server/blob/master/model.coffee
 * Modifications and improvements have been made.
 * This class is used a callback model for oauth2-server. oauth2-server runs it's calls
 * in a different context and fiber. Doing so can get really messy when attempting to
 * run Meteor code, like Collection calls. We work-around this problem by creating
 * instance methods are runtime that are proxied through Meteor.bindEnvironment.
 * This strategy allows us to specify the this context.
 * Defining the class with prototype methods defined by Meteor.bindEnvironment
 * would ensure we lose our this context when the method executes.
 */
MeteorModel = (function() {
    function MeteorModel(accessTokenCollection,
                         refreshTokenCollection,
                         authCodeCollection,
                         clientsCollection,
                         debug) {
        this.accessTokenCollection = accessTokenCollection;
        this.refreshTokenCollection = refreshTokenCollection;
        this.authCodeCollection = authCodeCollection;
        this.clientsCollection = clientsCollection;
        this.debug = debug;

        ///////////////////
        // Defining the methods.
        ///////////////////

        this.getAccessToken = Meteor.bindEnvironment(
                function (bearerToken, callback) {
                if (this.debug === true) {
                    console.log('[OAuth2Server]', 'in getAccessToken (bearerToken:', bearerToken, ')');
                }

                try {
                    var token = this.accessTokenCollection.findOne({
                        accessToken: bearerToken
                    });

                    callback(null, token);

                } catch (e) {
                    callback(e);
                }
            },
            null, // exception handler
            this // this context.
        );

        this.getClient = Meteor.bindEnvironment(
            function (clientId, clientSecret, callback) {
                if (this.debug === true) {
                    console.log('[OAuth2Server]', 'in getClient (clientId:', clientId, ', clientSecret:', clientSecret, ')');
                }

                try {
                    var collection = this.clientsCollection;
                    if (clientSecret == null) {
                        client = collection.findOne({
                            active: true,
                            clientId: clientId
                        });
                    } else {
                        client = collection.findOne({
                            active: true,
                            clientId: clientId,
                            clientSecret: clientSecret
                        });
                    }
                    callback(null, client);
                } catch (e) {
                    callback(e);
                }
            },
            null, // exception handler
            this // this context.
        );


        this.grantTypeAllowed = Meteor.bindEnvironment(
            function (clientId, grantType, callback) {
                if (this.debug === true) {
                    console.log('[OAuth2Server]', 'in grantTypeAllowed (clientId:', clientId, ', grantType:', grantType + ')');
                }

                callback(false, grantType === 'authorization_code');
            },
            null, // exception handler
            this // this context.
        );

        this.saveAccessToken = Meteor.bindEnvironment(
            function (token, clientId, expires, user, callback) {
                if (this.debug === true) {
                    console.log('[OAuth2Server]', 'in saveAccessToken (token:', token, ', clientId:', clientId, ', user:', user, ', expires:', expires, ')');
                }
                
                try {
                    // 有效期（默认一小时）
                    var collection = this.clientsCollection;
                    var clientObj = collection.findOne({clientId: clientId});
                    if(clientObj && clientObj.expires && clientObj.expires>1){
                        expires.setHours(expires.getHours()+clientObj.expires-1);
                    }
                    var tokenId = this.accessTokenCollection.insert({
                        accessToken: token,
                        clientId: clientId,
                        userId: user.id,
                        expires: expires
                    });

                    callback(null, tokenId);

                } catch (e) {
                    callback(e);
                }
            },
            null, // exception handler
            this // this context.
        );

        this.getAuthCode = Meteor.bindEnvironment(
            function (authCode, callback) {
                if (this.debug === true) {
                    console.log('[OAuth2Server]', 'in getAuthCode (authCode: ' + authCode + ')');
                }

                try {
                    var code = this.authCodeCollection.findOne({
                        authCode: authCode
                    });

                    callback(null, code);

                } catch (e) {
                    callback(e);
                }
            },
            null, // exception handler
            this // this context.
        );

        this.saveAuthCode = Meteor.bindEnvironment(
            function (code, clientId, expires, user, callback) {
                Meteor.bindEnvironment(code, clientId, expires, user, callback)
                if (this.debug === true) {
                    console.log('[OAuth2Server]', 'in saveAuthCode (code:', code, ', clientId:', clientId, ', expires:', expires, ', user:', user, ')');
                }

                try {
                    this.authCodeCollection.remove({authCode: code});
                    var codeId = this.authCodeCollection.insert({
                        authCode: code,
                        clientId: clientId,
                        userId: user.id,
                        expires: expires
                    });

                    callback(null, codeId);

                } catch (e) {
                    callback(e);
                }
            },
            null, // exception handler
            this // this context.
        );

        this.saveRefreshToken = Meteor.bindEnvironment(
            function (token, clientId, expires, user, callback) {
                if (this.debug === true) {
                    console.log('[OAuth2Server]', 'in saveRefreshToken (token:', token, ', clientId:', clientId, ', user:', user, ', expires:', expires, ')');
                }

                try {
                    this.refreshTokenCollection.remove({refreshToken: token});
                    var tokenId = this.refreshTokenCollection.insert({
                        refreshToken: token,
                        clientId: clientId,
                        userId: user.id,
                        expires: expires
                    });

                    callback(null, tokenId);

                } catch (e) {
                    callback(e);
                }
            },
            null, // exception handler
            this // this context.
        );

        this.getRefreshToken = Meteor.bindEnvironment(
            function (refreshToken, callback) {
                if (this.debug === true) {
                    console.log('[OAuth2Server]', 'in getRefreshToken (refreshToken: ' + refreshToken + ')');
                }

                try {
                    var token = this.refreshTokenCollection.findOne({
                        refreshToken: refreshToken
                    });

                    callback(null, token);

                } catch (e) {
                    callback(e);
                }
            },
            null, // exception handler
            this // this context.
        );
    };

    return MeteorModel;
})();

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/steedos_oauth2-server/lib/server.js                                                                 //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
// get the node modules.
var express = Npm.require('express'),
    bodyParser = Npm.require('body-parser'),
    oauthserver = Npm.require('oauth2-server');


// configure the server-side collections. The rest of the collections
// exist in common.js and are for both client and server.
db.OAuth2AccessTokens = new Meteor.Collection('OAuth2AccessTokens');

if(Meteor.isServer){
    db.OAuth2AccessTokens.before.insert(function(userId, doc){
        spaceId = db.space_users.findOne({user: doc.userId}).space;
        doc.spaceId = spaceId;
    });
}

// setup the node oauth2 model.
var meteorModel = new MeteorModel(
    db.OAuth2AccessTokens,
    refreshTokensCollection,
    authCodesCollection,
    db.OAuth2Clients,
    true
);


// setup the exported object.
oAuth2Server.oauthserver = oauthserver({
    model: meteorModel,
    grants: ['authorization_code'],
    debug: true
});

oAuth2Server.collections.accessToken = db.OAuth2AccessTokens;

// configure a url handler for the /steedos/oauth2/token path.
var app = express();

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
// app.all('/oauth2/token', oAuth2Server.oauthserver.grant());
// 不应该给整个app设置全局的bodyParser，会影响cms正文字段summernote控件中的图片上传控件保存报错：request entity too large
app.all('/oauth2/token', bodyParser.urlencoded({ extended: true }), bodyParser.json(), oAuth2Server.oauthserver.grant());

WebApp.rawConnectHandlers.use(app);


/////////////////////
// Configure really basic identity service
////////////////////
JsonRoutes.Middleware.use(
    '/oauth2/getIdentity',
    oAuth2Server.oauthserver.authorise()
);

JsonRoutes.add('get', '/oauth2/getIdentity', function(req, res, next) {
    var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
    
    var accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});

    var user = Meteor.users.findOne(accessToken.userId);

    JsonRoutes.sendResult(
        res,
        {
            data: {
                id: user._id,
                name: user.name,
                username: user.username
            }
        }
    );
});



////////////////////
// Meteor publish.
///////////////////
Meteor.publish(oAuth2Server.pubSubNames.authCodes, function() {
    if (!this.userId) {
        return this.ready();
    }

    return oAuth2Server.collections.authCode.find({
        userId: this.userId,
        expires: {
            $gt: new Date()
        }
    });
});

Meteor.publish(oAuth2Server.pubSubNames.refreshTokens, function() {
    if (!this.userId) {
        return this.ready();
    }

    return oAuth2Server.collections.refreshToken.find({
        userId: this.userId,
        expires: {
            $gt: new Date()
        }
    });
});

////////////
// configure the meteor methods.
//////////////
var methods = {};
methods[oAuth2Server.methodNames.authCodeGrant] = function(clientId, redirectUri, responseType, scope, state) {
    // validate parameters.
    check(clientId, String);
    check(redirectUri, String);
    check(responseType, String);
    check(scope, Match.Optional(Match.OneOf(null, [String])));
    check(state, Match.Optional(Match.OneOf(null, String)));

    if (!scope) {
        scope = [];
    }

    // validate the user is authenticated.
    var userId = this.userId;
    if (!userId) {
        return {
            success: false,
            error: 'User not authenticated.'
        };
    }

    // The oauth2-server project relies heavily on express to validate and
    // manipulate the oauth2 grant. A forthcoming version will abstract this
    // behaviour into promises.
    // That being the case, we need to get run an authorization grant as if
    // it were a promise. Warning, the following code is difficult to follow.
    // What we are doing is mocking and express app but never attaching it to
    // Meteor. This allows oauth2-server to behave as it would as if it was
    // natively attached to the webapp. The following code mocks express,
    // request, response, check and next in order to retrive the data we need.
    // Further, we are also running this in a synchronous manner. Enjoy! :)

    // create check callback that returns the user.
    var checkCallback = function (req, callback) {
        callback(
            null, // error.
            true, // user authorizes the code creation.
            {
                id: userId
            }
        );
    };

    // retrieve the grant function from oauth2-server. This method setups up the
    // this context and such. The returned method is what express would normally
    // expect when handling a URL. eg. function(req, res, next)
    var authCodeGrantFn = oAuth2Server.oauthserver.authCodeGrant(checkCallback);

    // make the grant function run synchronously.
    var authCodeGrantFnSync = Async.wrap(function (done) {
        // the return object.
        var response = {
            success: false,
            error: null,
            authorizationCode: null,
            redirectToUri: null
        };

        // create mock express app.
        var mockApp = express();
        var req = mockApp.request;

        // set the request body values. In a typical express setup, the body
        // would be parsed by the body-parser package. We are cutting out
        // the middle man, so to speak.
        req.body = {
            client_id: clientId,
            response_type: responseType,
            redirect_uri: redirectUri
        };
        req.query = {};

        // listen for redirect calls.
        var res = mockApp.response;
        res.redirect = function (uri) {
            response.redirectToUri = uri;

            // we have what we need, trigger the done function with the response data.
            done(null, response);
        };

        // listen for errors.
        var next = function (err) {
            response.error = err;

            // we have what we need, trigger the done function with the response data.
            done(null, response);
        };

        // call the async function with the mocked params.
        authCodeGrantFn(req, res, next);
    });

    // run the auth code grant function in a synchronous manner.
    var result = authCodeGrantFnSync();


    // update the success flag.
    result.success = !result.error && !(/[?&]error=/g).test(result.redirectToUri);

    // set the authorization code.
    if (result.redirectToUri) {
        var match = result.redirectToUri.match(/[?&]code=([0-9a-f]+)/);
        if (match.length > 1) {
            result.authorizationCode = match[1];
        }

        // add the state to the url.
        if (state) {
            result.redirectToUri += '&state=' + state;
        }
    }
//console.log(result);

    return result;
};

Meteor.methods(methods);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/steedos_oauth2-server/client/subscribe.coffee                                                       //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var subClients;
subClients = new SubsManager();
Meteor.startup(function () {
  return Tracker.autorun(function (c) {
    var client_id;

    if (subClients.ready()) {
      client_id = FlowRouter.getQueryParam("client_id");

      if (client_id) {
        return subClients.subscribe("OAuth2Clients", client_id);
      }
    }
  });
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/steedos_oauth2-server/server/rest.coffee                                                            //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var Cookies, Setup;
Cookies = Npm.require("cookies");
Setup = {};

Setup.clearAuthCookies = function (req, res) {
  var cookies, uri;
  cookies = new Cookies(req, res);
  cookies.set("X-User-Id");
  cookies.set("X-Auth-Token");
  cookies.set("X-Space-Id");
  cookies.set("X-Space-Token");

  if (req.headers.origin) {
    uri = new URI(req.headers.origin);
  } else if (req.headers.referer) {
    uri = new URI(req.headers.referer);
  }

  cookies.set("X-User-Id", "", {
    domain: uri != null ? uri.domain() : void 0,
    overwrite: true
  });
  cookies.set("X-Auth-Token", "", {
    domain: uri != null ? uri.domain() : void 0,
    overwrite: true
  });
  cookies.set("X-Space-Id", "", {
    domain: uri != null ? uri.domain() : void 0,
    overwrite: true
  });
  return cookies.set("X-Space-Token", "", {
    domain: uri != null ? uri.domain() : void 0,
    overwrite: true
  });
};

Setup.setAuthCookies = function (req, res, userId, authToken) {
  var cookies;
  cookies = new Cookies(req, res);
  cookies.set("X-User-Id", userId, {
    maxAge: 90 * 60 * 60 * 24 * 1000,
    httpOnly: false,
    overwrite: true
  });
  return cookies.set("X-Auth-Token", authToken, {
    maxAge: 90 * 60 * 60 * 24 * 1000,
    httpOnly: false,
    overwrite: true
  });
};

JsonRoutes.Middleware.use('/oauth2/sso', oAuth2Server.oauthserver.authorise());
JsonRoutes.add('get', '/oauth2/sso', function (req, res, next) {
  var accessToken, accessTokenStr, authToken, cookies, hashedToken, redirectUrl, ref, ref1, ref2, ref3, userId;
  redirectUrl = (req != null ? (ref = req.params) != null ? ref.redirect_url : void 0 : void 0) || (req != null ? (ref1 = req.query) != null ? ref1.redirect_url : void 0 : void 0) || '/';
  accessTokenStr = (req != null ? (ref2 = req.params) != null ? ref2.access_token : void 0 : void 0) || (req != null ? (ref3 = req.query) != null ? ref3.access_token : void 0 : void 0);
  accessToken = oAuth2Server.collections.accessToken.findOne({
    accessToken: accessTokenStr
  });
  cookies = new Cookies(req, res);
  userId = cookies.get("X-User-Id");
  authToken = cookies.get("X-Auth-Token");

  if (userId && authToken) {
    if (accessToken.userId !== userId) {
      Setup.clearAuthCookies(req, res);
      hashedToken = Accounts._hashLoginToken(authToken);
      Accounts.destroyToken(userId, hashedToken);
    } else {
      res.writeHead(301, {
        'Location': redirectUrl
      });
      return res.end('');
    }
  }

  authToken = Accounts._generateStampedLoginToken();
  hashedToken = Accounts._hashStampedToken(authToken);

  Accounts._insertHashedLoginToken(accessToken.userId, hashedToken);

  Setup.setAuthCookies(req, res, accessToken.userId, authToken.token);
  res.writeHead(301, {
    'Location': redirectUrl
  });
  return res.end('');
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/steedos_oauth2-server/server/publications/oauth2clients.coffee                                      //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.publish("OAuth2Clients", function (clientId) {
  var collection;
  collection = oAuth2Server.collections.client;
  return collection.find({
    'clientId': clientId
  }, {
    fields: {
      clientName: 1
    }
  });
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/steedos_oauth2-server/server/methods/oauth2authcodes.coffee                                         //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.methods({
  isAuthorized: function (userId, clientId) {
    var count;
    count = authCodesCollection.find({
      'userId': userId,
      'clientId': clientId
    }).count();

    if (count > 0) {
      return true;
    } else {
      return false;
    }
  }
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("steedos:oauth2-server", {
  oAuth2Server: oAuth2Server,
  Random: Random
});

})();

//# sourceURL=meteor://💻app/packages/steedos_oauth2-server.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19vYXV0aDItc2VydmVyL2NsaWVudC9zdWJzY3JpYmUuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9jbGllbnQvc3Vic2NyaWJlLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19vYXV0aDItc2VydmVyL3NlcnZlci9yZXN0LmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL3Jlc3QuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX29hdXRoMi1zZXJ2ZXIvc2VydmVyL3B1YmxpY2F0aW9ucy9vYXV0aDJjbGllbnRzLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19vYXV0aDItc2VydmVyL3NlcnZlci9tZXRob2RzL29hdXRoMmF1dGhjb2Rlcy5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9tZXRob2RzL29hdXRoMmF1dGhjb2Rlcy5jb2ZmZWUiXSwibmFtZXMiOlsic3ViQ2xpZW50cyIsIlN1YnNNYW5hZ2VyIiwiTWV0ZW9yIiwic3RhcnR1cCIsIlRyYWNrZXIiLCJhdXRvcnVuIiwiYyIsImNsaWVudF9pZCIsInJlYWR5IiwiRmxvd1JvdXRlciIsImdldFF1ZXJ5UGFyYW0iLCJzdWJzY3JpYmUiLCJDb29raWVzIiwiU2V0dXAiLCJOcG0iLCJyZXF1aXJlIiwiY2xlYXJBdXRoQ29va2llcyIsInJlcSIsInJlcyIsImNvb2tpZXMiLCJ1cmkiLCJzZXQiLCJoZWFkZXJzIiwib3JpZ2luIiwiVVJJIiwicmVmZXJlciIsImRvbWFpbiIsIm92ZXJ3cml0ZSIsInNldEF1dGhDb29raWVzIiwidXNlcklkIiwiYXV0aFRva2VuIiwibWF4QWdlIiwiaHR0cE9ubHkiLCJKc29uUm91dGVzIiwiTWlkZGxld2FyZSIsInVzZSIsIm9BdXRoMlNlcnZlciIsIm9hdXRoc2VydmVyIiwiYXV0aG9yaXNlIiwiYWRkIiwibmV4dCIsImFjY2Vzc1Rva2VuIiwiYWNjZXNzVG9rZW5TdHIiLCJoYXNoZWRUb2tlbiIsInJlZGlyZWN0VXJsIiwicmVmIiwicmVmMSIsInJlZjIiLCJyZWYzIiwicGFyYW1zIiwicmVkaXJlY3RfdXJsIiwicXVlcnkiLCJhY2Nlc3NfdG9rZW4iLCJjb2xsZWN0aW9ucyIsImZpbmRPbmUiLCJnZXQiLCJBY2NvdW50cyIsIl9oYXNoTG9naW5Ub2tlbiIsImRlc3Ryb3lUb2tlbiIsIndyaXRlSGVhZCIsImVuZCIsIl9nZW5lcmF0ZVN0YW1wZWRMb2dpblRva2VuIiwiX2hhc2hTdGFtcGVkVG9rZW4iLCJfaW5zZXJ0SGFzaGVkTG9naW5Ub2tlbiIsInRva2VuIiwicHVibGlzaCIsImNsaWVudElkIiwiY29sbGVjdGlvbiIsImNsaWVudCIsImZpbmQiLCJmaWVsZHMiLCJjbGllbnROYW1lIiwibWV0aG9kcyIsImlzQXV0aG9yaXplZCIsImNvdW50IiwiYXV0aENvZGVzQ29sbGVjdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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Ozs7Ozs7Ozs7Ozs7Ozs7QUNBQXJFLE9BQU9zRSxPQUFQLENBQ0M7QUFBQUMsZ0JBQWMsVUFBQzVDLE1BQUQsRUFBUXFDLFFBQVI7QUFDUCxRQUFBUSxLQUFBO0FBQUFBLFlBQVFDLG9CQUFvQk4sSUFBcEIsQ0FBeUI7QUFBQyxnQkFBU3hDLE1BQVY7QUFBaUIsa0JBQVdxQztBQUE1QixLQUF6QixFQUFnRVEsS0FBaEUsRUFBUjs7QUFDQSxRQUFHQSxRQUFRLENBQVg7QUFDSSxhQUFPLElBQVA7QUFESjtBQUdJLGFBQU8sS0FBUDtBQ0tQO0FEVko7QUFBQSxDQURELEUiLCJmaWxlIjoiL3BhY2thZ2VzL3N0ZWVkb3Nfb2F1dGgyLXNlcnZlci5qcyIsInNvdXJjZXNDb250ZW50IjpbInN1YkNsaWVudHMgPSBuZXcgU3Vic01hbmFnZXIoKVxuXG5NZXRlb3Iuc3RhcnR1cCAtPlxuXHRUcmFja2VyLmF1dG9ydW4gKGMpLT5cbiAgICAgICAgaWYgc3ViQ2xpZW50cy5yZWFkeSgpXG4gICAgICAgICAgICBjbGllbnRfaWQgPSBGbG93Um91dGVyLmdldFF1ZXJ5UGFyYW0oXCJjbGllbnRfaWRcIilcbiAgICAgICAgICAgIGlmIGNsaWVudF9pZFxuICAgICAgICAgICAgICAgIHN1YkNsaWVudHMuc3Vic2NyaWJlIFwiT0F1dGgyQ2xpZW50c1wiLGNsaWVudF9pZCIsInZhciBzdWJDbGllbnRzO1xuXG5zdWJDbGllbnRzID0gbmV3IFN1YnNNYW5hZ2VyKCk7XG5cbk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuICByZXR1cm4gVHJhY2tlci5hdXRvcnVuKGZ1bmN0aW9uKGMpIHtcbiAgICB2YXIgY2xpZW50X2lkO1xuICAgIGlmIChzdWJDbGllbnRzLnJlYWR5KCkpIHtcbiAgICAgIGNsaWVudF9pZCA9IEZsb3dSb3V0ZXIuZ2V0UXVlcnlQYXJhbShcImNsaWVudF9pZFwiKTtcbiAgICAgIGlmIChjbGllbnRfaWQpIHtcbiAgICAgICAgcmV0dXJuIHN1YkNsaWVudHMuc3Vic2NyaWJlKFwiT0F1dGgyQ2xpZW50c1wiLCBjbGllbnRfaWQpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59KTtcbiIsIkNvb2tpZXMgPSBOcG0ucmVxdWlyZShcImNvb2tpZXNcIilcblxuU2V0dXAgPSB7fVxuXG5TZXR1cC5jbGVhckF1dGhDb29raWVzID0gKHJlcSwgcmVzKSAtPlxuXHRjb29raWVzID0gbmV3IENvb2tpZXMoIHJlcSwgcmVzIClcblx0Y29va2llcy5zZXQoXCJYLVVzZXItSWRcIilcblx0Y29va2llcy5zZXQoXCJYLUF1dGgtVG9rZW5cIilcblx0Y29va2llcy5zZXQoXCJYLVNwYWNlLUlkXCIpXG5cdGNvb2tpZXMuc2V0KFwiWC1TcGFjZS1Ub2tlblwiKVxuXG5cdCMg6aKd5aSW5riF6Zmk6ICB55qEZG9tYWlu5LiL55qEY29va2llXG5cdGlmIHJlcS5oZWFkZXJzLm9yaWdpblxuXHRcdHVyaSA9IG5ldyBVUkkocmVxLmhlYWRlcnMub3JpZ2luKVxuXHRlbHNlIGlmIHJlcS5oZWFkZXJzLnJlZmVyZXJcblx0XHR1cmkgPSBuZXcgVVJJKHJlcS5oZWFkZXJzLnJlZmVyZXIpXG5cblx0Y29va2llcy5zZXQgXCJYLVVzZXItSWRcIiwgXCJcIixcblx0XHRkb21haW46IHVyaT8uZG9tYWluKCksXG5cdFx0b3ZlcndyaXRlOiB0cnVlXG5cdGNvb2tpZXMuc2V0IFwiWC1BdXRoLVRva2VuXCIsIFwiXCIsXG5cdFx0ZG9tYWluOiB1cmk/LmRvbWFpbigpLFxuXHRcdG92ZXJ3cml0ZTogdHJ1ZVxuXHRjb29raWVzLnNldCBcIlgtU3BhY2UtSWRcIiwgXCJcIixcblx0XHRkb21haW46IHVyaT8uZG9tYWluKCksXG5cdFx0b3ZlcndyaXRlOiB0cnVlXG5cdGNvb2tpZXMuc2V0IFwiWC1TcGFjZS1Ub2tlblwiLCBcIlwiLFxuXHRcdGRvbWFpbjogdXJpPy5kb21haW4oKSxcblx0XHRvdmVyd3JpdGU6IHRydWVcblxuU2V0dXAuc2V0QXV0aENvb2tpZXMgPSAocmVxLCByZXMsIHVzZXJJZCwgYXV0aFRva2VuKSAtPlxuXHRjb29raWVzID0gbmV3IENvb2tpZXMoIHJlcSwgcmVzIClcblx0IyBzZXQgY29va2llIHRvIHJlc3BvbnNlXG5cdCMgbWF4QWdlIDMgbW9udGhcblx0IyB1cmkgPSBuZXcgVVJJKHJlcS5oZWFkZXJzLm9yaWdpbik7XG5cdGNvb2tpZXMuc2V0IFwiWC1Vc2VyLUlkXCIsIHVzZXJJZCxcblx0XHQjIGRvbWFpbjogdXJpLmRvbWFpbigpLFxuXHRcdG1heEFnZTogOTAqNjAqNjAqMjQqMTAwMCxcblx0XHRodHRwT25seTogZmFsc2Vcblx0XHRvdmVyd3JpdGU6IHRydWVcblx0Y29va2llcy5zZXQgXCJYLUF1dGgtVG9rZW5cIiwgYXV0aFRva2VuLFxuXHRcdCMgZG9tYWluOiB1cmkuZG9tYWluKCksXG5cdFx0bWF4QWdlOiA5MCo2MCo2MCoyNCoxMDAwLFxuXHRcdGh0dHBPbmx5OiBmYWxzZVxuXHRcdG92ZXJ3cml0ZTogdHJ1ZVxuXG5Kc29uUm91dGVzLk1pZGRsZXdhcmUudXNlKFxuXHQnL29hdXRoMi9zc28nLFxuXHRvQXV0aDJTZXJ2ZXIub2F1dGhzZXJ2ZXIuYXV0aG9yaXNlKClcbilcblxuSnNvblJvdXRlcy5hZGQgJ2dldCcsICcvb2F1dGgyL3NzbycsIChyZXEsIHJlcywgbmV4dCktPlxuXG5cdHJlZGlyZWN0VXJsID0gcmVxPy5wYXJhbXM/LnJlZGlyZWN0X3VybCB8fCByZXE/LnF1ZXJ5Py5yZWRpcmVjdF91cmwgfHwgJy8nXG5cdFxuXHRhY2Nlc3NUb2tlblN0ciA9IHJlcT8ucGFyYW1zPy5hY2Nlc3NfdG9rZW4gfHwgcmVxPy5xdWVyeT8uYWNjZXNzX3Rva2VuXG5cdFxuXHRhY2Nlc3NUb2tlbiA9IG9BdXRoMlNlcnZlci5jb2xsZWN0aW9ucy5hY2Nlc3NUb2tlbi5maW5kT25lKFxuXHRcdHthY2Nlc3NUb2tlbjogYWNjZXNzVG9rZW5TdHJ9XG5cdClcblx0XG5cdGNvb2tpZXMgPSBuZXcgQ29va2llcyggcmVxLCByZXMgKTtcblx0dXNlcklkID0gY29va2llcy5nZXQoXCJYLVVzZXItSWRcIilcblx0YXV0aFRva2VuID0gY29va2llcy5nZXQoXCJYLUF1dGgtVG9rZW5cIilcblxuXHQjIOWmguaenOacrOWcsOW3sue7j+aciWNvb2tpZXNcblx0aWYgdXNlcklkIGFuZCBhdXRoVG9rZW5cblx0XHQjIOavlOi+g+acrOWcsOaVsOaNruWSjOW9k+WJjeeUqOaIt+aYr+WQpuS4gOiHtFxuXHRcdGlmIGFjY2Vzc1Rva2VuLnVzZXJJZCE9dXNlcklkXG5cdFx0XHQjIOS4jeS4gOiHtO+8jOa4hemZpOS/oeaBr1xuXHRcdFx0U2V0dXAuY2xlYXJBdXRoQ29va2llcyhyZXEsIHJlcylcblx0XHRcdGhhc2hlZFRva2VuID0gQWNjb3VudHMuX2hhc2hMb2dpblRva2VuKGF1dGhUb2tlbilcblx0XHRcdEFjY291bnRzLmRlc3Ryb3lUb2tlbih1c2VySWQsIGhhc2hlZFRva2VuKVxuXHRcdGVsc2Vcblx0XHRcdHJlcy53cml0ZUhlYWQgMzAxLCB7J0xvY2F0aW9uJzogcmVkaXJlY3RVcmwgfVxuXHRcdFx0cmV0dXJuIHJlcy5lbmQgJydcblx0IyDpqozor4HmiJDlip/vvIznmbvlvZVcblx0YXV0aFRva2VuID0gQWNjb3VudHMuX2dlbmVyYXRlU3RhbXBlZExvZ2luVG9rZW4oKVxuXHRoYXNoZWRUb2tlbiA9IEFjY291bnRzLl9oYXNoU3RhbXBlZFRva2VuIGF1dGhUb2tlblxuXHRBY2NvdW50cy5faW5zZXJ0SGFzaGVkTG9naW5Ub2tlbiBhY2Nlc3NUb2tlbi51c2VySWQsaGFzaGVkVG9rZW5cblx0U2V0dXAuc2V0QXV0aENvb2tpZXMgcmVxLHJlcyxhY2Nlc3NUb2tlbi51c2VySWQsYXV0aFRva2VuLnRva2VuXG5cdHJlcy53cml0ZUhlYWQgMzAxLCB7J0xvY2F0aW9uJzogcmVkaXJlY3RVcmwgfVxuXHRyZXR1cm4gcmVzLmVuZCAnJ1xuXG5cblxuIiwidmFyIENvb2tpZXMsIFNldHVwO1xuXG5Db29raWVzID0gTnBtLnJlcXVpcmUoXCJjb29raWVzXCIpO1xuXG5TZXR1cCA9IHt9O1xuXG5TZXR1cC5jbGVhckF1dGhDb29raWVzID0gZnVuY3Rpb24ocmVxLCByZXMpIHtcbiAgdmFyIGNvb2tpZXMsIHVyaTtcbiAgY29va2llcyA9IG5ldyBDb29raWVzKHJlcSwgcmVzKTtcbiAgY29va2llcy5zZXQoXCJYLVVzZXItSWRcIik7XG4gIGNvb2tpZXMuc2V0KFwiWC1BdXRoLVRva2VuXCIpO1xuICBjb29raWVzLnNldChcIlgtU3BhY2UtSWRcIik7XG4gIGNvb2tpZXMuc2V0KFwiWC1TcGFjZS1Ub2tlblwiKTtcbiAgaWYgKHJlcS5oZWFkZXJzLm9yaWdpbikge1xuICAgIHVyaSA9IG5ldyBVUkkocmVxLmhlYWRlcnMub3JpZ2luKTtcbiAgfSBlbHNlIGlmIChyZXEuaGVhZGVycy5yZWZlcmVyKSB7XG4gICAgdXJpID0gbmV3IFVSSShyZXEuaGVhZGVycy5yZWZlcmVyKTtcbiAgfVxuICBjb29raWVzLnNldChcIlgtVXNlci1JZFwiLCBcIlwiLCB7XG4gICAgZG9tYWluOiB1cmkgIT0gbnVsbCA/IHVyaS5kb21haW4oKSA6IHZvaWQgMCxcbiAgICBvdmVyd3JpdGU6IHRydWVcbiAgfSk7XG4gIGNvb2tpZXMuc2V0KFwiWC1BdXRoLVRva2VuXCIsIFwiXCIsIHtcbiAgICBkb21haW46IHVyaSAhPSBudWxsID8gdXJpLmRvbWFpbigpIDogdm9pZCAwLFxuICAgIG92ZXJ3cml0ZTogdHJ1ZVxuICB9KTtcbiAgY29va2llcy5zZXQoXCJYLVNwYWNlLUlkXCIsIFwiXCIsIHtcbiAgICBkb21haW46IHVyaSAhPSBudWxsID8gdXJpLmRvbWFpbigpIDogdm9pZCAwLFxuICAgIG92ZXJ3cml0ZTogdHJ1ZVxuICB9KTtcbiAgcmV0dXJuIGNvb2tpZXMuc2V0KFwiWC1TcGFjZS1Ub2tlblwiLCBcIlwiLCB7XG4gICAgZG9tYWluOiB1cmkgIT0gbnVsbCA/IHVyaS5kb21haW4oKSA6IHZvaWQgMCxcbiAgICBvdmVyd3JpdGU6IHRydWVcbiAgfSk7XG59O1xuXG5TZXR1cC5zZXRBdXRoQ29va2llcyA9IGZ1bmN0aW9uKHJlcSwgcmVzLCB1c2VySWQsIGF1dGhUb2tlbikge1xuICB2YXIgY29va2llcztcbiAgY29va2llcyA9IG5ldyBDb29raWVzKHJlcSwgcmVzKTtcbiAgY29va2llcy5zZXQoXCJYLVVzZXItSWRcIiwgdXNlcklkLCB7XG4gICAgbWF4QWdlOiA5MCAqIDYwICogNjAgKiAyNCAqIDEwMDAsXG4gICAgaHR0cE9ubHk6IGZhbHNlLFxuICAgIG92ZXJ3cml0ZTogdHJ1ZVxuICB9KTtcbiAgcmV0dXJuIGNvb2tpZXMuc2V0KFwiWC1BdXRoLVRva2VuXCIsIGF1dGhUb2tlbiwge1xuICAgIG1heEFnZTogOTAgKiA2MCAqIDYwICogMjQgKiAxMDAwLFxuICAgIGh0dHBPbmx5OiBmYWxzZSxcbiAgICBvdmVyd3JpdGU6IHRydWVcbiAgfSk7XG59O1xuXG5Kc29uUm91dGVzLk1pZGRsZXdhcmUudXNlKCcvb2F1dGgyL3NzbycsIG9BdXRoMlNlcnZlci5vYXV0aHNlcnZlci5hdXRob3Jpc2UoKSk7XG5cbkpzb25Sb3V0ZXMuYWRkKCdnZXQnLCAnL29hdXRoMi9zc28nLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICB2YXIgYWNjZXNzVG9rZW4sIGFjY2Vzc1Rva2VuU3RyLCBhdXRoVG9rZW4sIGNvb2tpZXMsIGhhc2hlZFRva2VuLCByZWRpcmVjdFVybCwgcmVmLCByZWYxLCByZWYyLCByZWYzLCB1c2VySWQ7XG4gIHJlZGlyZWN0VXJsID0gKHJlcSAhPSBudWxsID8gKHJlZiA9IHJlcS5wYXJhbXMpICE9IG51bGwgPyByZWYucmVkaXJlY3RfdXJsIDogdm9pZCAwIDogdm9pZCAwKSB8fCAocmVxICE9IG51bGwgPyAocmVmMSA9IHJlcS5xdWVyeSkgIT0gbnVsbCA/IHJlZjEucmVkaXJlY3RfdXJsIDogdm9pZCAwIDogdm9pZCAwKSB8fCAnLyc7XG4gIGFjY2Vzc1Rva2VuU3RyID0gKHJlcSAhPSBudWxsID8gKHJlZjIgPSByZXEucGFyYW1zKSAhPSBudWxsID8gcmVmMi5hY2Nlc3NfdG9rZW4gOiB2b2lkIDAgOiB2b2lkIDApIHx8IChyZXEgIT0gbnVsbCA/IChyZWYzID0gcmVxLnF1ZXJ5KSAhPSBudWxsID8gcmVmMy5hY2Nlc3NfdG9rZW4gOiB2b2lkIDAgOiB2b2lkIDApO1xuICBhY2Nlc3NUb2tlbiA9IG9BdXRoMlNlcnZlci5jb2xsZWN0aW9ucy5hY2Nlc3NUb2tlbi5maW5kT25lKHtcbiAgICBhY2Nlc3NUb2tlbjogYWNjZXNzVG9rZW5TdHJcbiAgfSk7XG4gIGNvb2tpZXMgPSBuZXcgQ29va2llcyhyZXEsIHJlcyk7XG4gIHVzZXJJZCA9IGNvb2tpZXMuZ2V0KFwiWC1Vc2VyLUlkXCIpO1xuICBhdXRoVG9rZW4gPSBjb29raWVzLmdldChcIlgtQXV0aC1Ub2tlblwiKTtcbiAgaWYgKHVzZXJJZCAmJiBhdXRoVG9rZW4pIHtcbiAgICBpZiAoYWNjZXNzVG9rZW4udXNlcklkICE9PSB1c2VySWQpIHtcbiAgICAgIFNldHVwLmNsZWFyQXV0aENvb2tpZXMocmVxLCByZXMpO1xuICAgICAgaGFzaGVkVG9rZW4gPSBBY2NvdW50cy5faGFzaExvZ2luVG9rZW4oYXV0aFRva2VuKTtcbiAgICAgIEFjY291bnRzLmRlc3Ryb3lUb2tlbih1c2VySWQsIGhhc2hlZFRva2VuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzLndyaXRlSGVhZCgzMDEsIHtcbiAgICAgICAgJ0xvY2F0aW9uJzogcmVkaXJlY3RVcmxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlcy5lbmQoJycpO1xuICAgIH1cbiAgfVxuICBhdXRoVG9rZW4gPSBBY2NvdW50cy5fZ2VuZXJhdGVTdGFtcGVkTG9naW5Ub2tlbigpO1xuICBoYXNoZWRUb2tlbiA9IEFjY291bnRzLl9oYXNoU3RhbXBlZFRva2VuKGF1dGhUb2tlbik7XG4gIEFjY291bnRzLl9pbnNlcnRIYXNoZWRMb2dpblRva2VuKGFjY2Vzc1Rva2VuLnVzZXJJZCwgaGFzaGVkVG9rZW4pO1xuICBTZXR1cC5zZXRBdXRoQ29va2llcyhyZXEsIHJlcywgYWNjZXNzVG9rZW4udXNlcklkLCBhdXRoVG9rZW4udG9rZW4pO1xuICByZXMud3JpdGVIZWFkKDMwMSwge1xuICAgICdMb2NhdGlvbic6IHJlZGlyZWN0VXJsXG4gIH0pO1xuICByZXR1cm4gcmVzLmVuZCgnJyk7XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoIFwiT0F1dGgyQ2xpZW50c1wiLCAoY2xpZW50SWQpLT5cblx0Y29sbGVjdGlvbiA9IG9BdXRoMlNlcnZlci5jb2xsZWN0aW9ucy5jbGllbnRcblx0cmV0dXJuIGNvbGxlY3Rpb24uZmluZCh7J2NsaWVudElkJzogY2xpZW50SWR9LCB7ZmllbGRzOntjbGllbnROYW1lOjF9fSkiLCJNZXRlb3IubWV0aG9kc1xuXHRpc0F1dGhvcml6ZWQ6ICh1c2VySWQsY2xpZW50SWQpIC0+XG4gICAgICAgIGNvdW50ID0gYXV0aENvZGVzQ29sbGVjdGlvbi5maW5kKHsndXNlcklkJzp1c2VySWQsJ2NsaWVudElkJzpjbGllbnRJZH0pLmNvdW50KClcbiAgICAgICAgaWYgY291bnQgPiAwXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2UiLCJNZXRlb3IubWV0aG9kcyh7XG4gIGlzQXV0aG9yaXplZDogZnVuY3Rpb24odXNlcklkLCBjbGllbnRJZCkge1xuICAgIHZhciBjb3VudDtcbiAgICBjb3VudCA9IGF1dGhDb2Rlc0NvbGxlY3Rpb24uZmluZCh7XG4gICAgICAndXNlcklkJzogdXNlcklkLFxuICAgICAgJ2NsaWVudElkJzogY2xpZW50SWRcbiAgICB9KS5jb3VudCgpO1xuICAgIGlmIChjb3VudCA+IDApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG59KTtcbiJdfQ==
