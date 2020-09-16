(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var DDPRateLimiter = Package['ddp-rate-limiter'].DDPRateLimiter;
var check = Package.check.check;
var Match = Package.check.Match;
var Random = Package.random.Random;
var EJSON = Package.ejson.EJSON;
var Hook = Package['callback-hook'].Hook;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Accounts, options, stampedLoginToken, handler, name, query, oldestValidDate, user;

var require = meteorInstall({"node_modules":{"meteor":{"accounts-base":{"server_main.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/accounts-base/server_main.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const module1 = module;
module1.export({
  AccountsServer: () => AccountsServer
});
let AccountsServer;
module1.link("./accounts_server.js", {
  AccountsServer(v) {
    AccountsServer = v;
  }

}, 0);

/**
 * @namespace Accounts
 * @summary The namespace for all server-side accounts-related methods.
 */
Accounts = new AccountsServer(Meteor.server); // Users table. Don't use the normal autopublish, since we want to hide
// some fields. Code to autopublish this is in accounts_server.js.
// XXX Allow users to configure this collection name.

/**
 * @summary A [Mongo.Collection](#collections) containing user documents.
 * @locus Anywhere
 * @type {Mongo.Collection}
 * @importFromPackage meteor
*/

Meteor.users = Accounts.users;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"accounts_common.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/accounts-base/accounts_common.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

module.export({
  AccountsCommon: () => AccountsCommon,
  EXPIRE_TOKENS_INTERVAL_MS: () => EXPIRE_TOKENS_INTERVAL_MS,
  CONNECTION_CLOSE_DELAY_MS: () => CONNECTION_CLOSE_DELAY_MS
});

class AccountsCommon {
  constructor(options) {
    // Currently this is read directly by packages like accounts-password
    // and accounts-ui-unstyled.
    this._options = {}; // Note that setting this.connection = null causes this.users to be a
    // LocalCollection, which is not what we want.

    this.connection = undefined;

    this._initConnection(options || {}); // There is an allow call in accounts_server.js that restricts writes to
    // this collection.


    this.users = new Mongo.Collection("users", {
      _preventAutopublish: true,
      connection: this.connection
    }); // Callback exceptions are printed with Meteor._debug and ignored.

    this._onLoginHook = new Hook({
      bindEnvironment: false,
      debugPrintExceptions: "onLogin callback"
    });
    this._onLoginFailureHook = new Hook({
      bindEnvironment: false,
      debugPrintExceptions: "onLoginFailure callback"
    });
    this._onLogoutHook = new Hook({
      bindEnvironment: false,
      debugPrintExceptions: "onLogout callback"
    }); // Expose for testing.

    this.DEFAULT_LOGIN_EXPIRATION_DAYS = DEFAULT_LOGIN_EXPIRATION_DAYS;
    this.LOGIN_UNEXPIRING_TOKEN_DAYS = LOGIN_UNEXPIRING_TOKEN_DAYS; // Thrown when the user cancels the login process (eg, closes an oauth
    // popup, declines retina scan, etc)

    const lceName = 'Accounts.LoginCancelledError';
    this.LoginCancelledError = Meteor.makeErrorType(lceName, function (description) {
      this.message = description;
    });
    this.LoginCancelledError.prototype.name = lceName; // This is used to transmit specific subclass errors over the wire. We
    // should come up with a more generic way to do this (eg, with some sort of
    // symbolic error code rather than a number).

    this.LoginCancelledError.numericError = 0x8acdc2f; // loginServiceConfiguration and ConfigError are maintained for backwards compatibility

    Meteor.startup(() => {
      const {
        ServiceConfiguration
      } = Package['service-configuration'];
      this.loginServiceConfiguration = ServiceConfiguration.configurations;
      this.ConfigError = ServiceConfiguration.ConfigError;
    });
  }
  /**
   * @summary Get the current user id, or `null` if no user is logged in. A reactive data source.
   * @locus Anywhere
   */


  userId() {
    throw new Error("userId method not implemented");
  }
  /**
   * @summary Get the current user record, or `null` if no user is logged in. A reactive data source.
   * @locus Anywhere
   */


  user() {
    const userId = this.userId();
    return userId ? this.users.findOne(userId) : null;
  } // Set up config for the accounts system. Call this on both the client
  // and the server.
  //
  // Note that this method gets overridden on AccountsServer.prototype, but
  // the overriding method calls the overridden method.
  //
  // XXX we should add some enforcement that this is called on both the
  // client and the server. Otherwise, a user can
  // 'forbidClientAccountCreation' only on the client and while it looks
  // like their app is secure, the server will still accept createUser
  // calls. https://github.com/meteor/meteor/issues/828
  //
  // @param options {Object} an object with fields:
  // - sendVerificationEmail {Boolean}
  //     Send email address verification emails to new users created from
  //     client signups.
  // - forbidClientAccountCreation {Boolean}
  //     Do not allow clients to create accounts directly.
  // - restrictCreationByEmailDomain {Function or String}
  //     Require created users to have an email matching the function or
  //     having the string as domain.
  // - loginExpirationInDays {Number}
  //     Number of days since login until a user is logged out (login token
  //     expires).
  // - passwordResetTokenExpirationInDays {Number}
  //     Number of days since password reset token creation until the
  //     token cannt be used any longer (password reset token expires).
  // - ambiguousErrorMessages {Boolean}
  //     Return ambiguous error messages from login failures to prevent
  //     user enumeration.
  // - bcryptRounds {Number}
  //     Allows override of number of bcrypt rounds (aka work factor) used
  //     to store passwords.

  /**
   * @summary Set global accounts options.
   * @locus Anywhere
   * @param {Object} options
   * @param {Boolean} options.sendVerificationEmail New users with an email address will receive an address verification email.
   * @param {Boolean} options.forbidClientAccountCreation Calls to [`createUser`](#accounts_createuser) from the client will be rejected. In addition, if you are using [accounts-ui](#accountsui), the "Create account" link will not be available.
   * @param {String | Function} options.restrictCreationByEmailDomain If set to a string, only allows new users if the domain part of their email address matches the string. If set to a function, only allows new users if the function returns true.  The function is passed the full email address of the proposed new user.  Works with password-based sign-in and external services that expose email addresses (Google, Facebook, GitHub). All existing users still can log in after enabling this option. Example: `Accounts.config({ restrictCreationByEmailDomain: 'school.edu' })`.
   * @param {Number} options.loginExpirationInDays The number of days from when a user logs in until their token expires and they are logged out. Defaults to 90. Set to `null` to disable login expiration.
   * @param {String} options.oauthSecretKey When using the `oauth-encryption` package, the 16 byte key using to encrypt sensitive account credentials in the database, encoded in base64.  This option may only be specifed on the server.  See packages/oauth-encryption/README.md for details.
   * @param {Number} options.passwordResetTokenExpirationInDays The number of days from when a link to reset password is sent until token expires and user can't reset password with the link anymore. Defaults to 3.
   * @param {Number} options.passwordEnrollTokenExpirationInDays The number of days from when a link to set inital password is sent until token expires and user can't set password with the link anymore. Defaults to 30.
   * @param {Boolean} options.ambiguousErrorMessages Return ambiguous error messages from login failures to prevent user enumeration. Defaults to false.
   */


  config(options) {
    // We don't want users to accidentally only call Accounts.config on the
    // client, where some of the options will have partial effects (eg removing
    // the "create account" button from accounts-ui if forbidClientAccountCreation
    // is set, or redirecting Google login to a specific-domain page) without
    // having their full effects.
    if (Meteor.isServer) {
      __meteor_runtime_config__.accountsConfigCalled = true;
    } else if (!__meteor_runtime_config__.accountsConfigCalled) {
      // XXX would be nice to "crash" the client and replace the UI with an error
      // message, but there's no trivial way to do this.
      Meteor._debug("Accounts.config was called on the client but not on the " + "server; some configuration options may not take effect.");
    } // We need to validate the oauthSecretKey option at the time
    // Accounts.config is called. We also deliberately don't store the
    // oauthSecretKey in Accounts._options.


    if (Object.prototype.hasOwnProperty.call(options, 'oauthSecretKey')) {
      if (Meteor.isClient) {
        throw new Error("The oauthSecretKey option may only be specified on the server");
      }

      if (!Package["oauth-encryption"]) {
        throw new Error("The oauth-encryption package must be loaded to set oauthSecretKey");
      }

      Package["oauth-encryption"].OAuthEncryption.loadKey(options.oauthSecretKey);
      options = (0, _objectSpread2.default)({}, options);
      delete options.oauthSecretKey;
    } // validate option keys


    const VALID_KEYS = ["sendVerificationEmail", "forbidClientAccountCreation", "passwordEnrollTokenExpirationInDays", "restrictCreationByEmailDomain", "loginExpirationInDays", "passwordResetTokenExpirationInDays", "ambiguousErrorMessages", "bcryptRounds"];
    Object.keys(options).forEach(key => {
      if (!VALID_KEYS.includes(key)) {
        throw new Error(`Accounts.config: Invalid key: ${key}`);
      }
    }); // set values in Accounts._options

    VALID_KEYS.forEach(key => {
      if (key in options) {
        if (key in this._options) {
          throw new Error(`Can't set \`${key}\` more than once`);
        }

        this._options[key] = options[key];
      }
    });
  }
  /**
   * @summary Register a callback to be called after a login attempt succeeds.
   * @locus Anywhere
   * @param {Function} func The callback to be called when login is successful.
   *                        The callback receives a single object that
   *                        holds login details. This object contains the login
   *                        result type (password, resume, etc.) on both the
   *                        client and server. `onLogin` callbacks registered
   *                        on the server also receive extra data, such
   *                        as user details, connection information, etc.
   */


  onLogin(func) {
    return this._onLoginHook.register(func);
  }
  /**
   * @summary Register a callback to be called after a login attempt fails.
   * @locus Anywhere
   * @param {Function} func The callback to be called after the login has failed.
   */


  onLoginFailure(func) {
    return this._onLoginFailureHook.register(func);
  }
  /**
   * @summary Register a callback to be called after a logout attempt succeeds.
   * @locus Anywhere
   * @param {Function} func The callback to be called when logout is successful.
   */


  onLogout(func) {
    return this._onLogoutHook.register(func);
  }

  _initConnection(options) {
    if (!Meteor.isClient) {
      return;
    } // The connection used by the Accounts system. This is the connection
    // that will get logged in by Meteor.login(), and this is the
    // connection whose login state will be reflected by Meteor.userId().
    //
    // It would be much preferable for this to be in accounts_client.js,
    // but it has to be here because it's needed to create the
    // Meteor.users collection.


    if (options.connection) {
      this.connection = options.connection;
    } else if (options.ddpUrl) {
      this.connection = DDP.connect(options.ddpUrl);
    } else if (typeof __meteor_runtime_config__ !== "undefined" && __meteor_runtime_config__.ACCOUNTS_CONNECTION_URL) {
      // Temporary, internal hook to allow the server to point the client
      // to a different authentication server. This is for a very
      // particular use case that comes up when implementing a oauth
      // server. Unsupported and may go away at any point in time.
      //
      // We will eventually provide a general way to use account-base
      // against any DDP connection, not just one special one.
      this.connection = DDP.connect(__meteor_runtime_config__.ACCOUNTS_CONNECTION_URL);
    } else {
      this.connection = Meteor.connection;
    }
  }

  _getTokenLifetimeMs() {
    // When loginExpirationInDays is set to null, we'll use a really high
    // number of days (LOGIN_UNEXPIRABLE_TOKEN_DAYS) to simulate an
    // unexpiring token.
    const loginExpirationInDays = this._options.loginExpirationInDays === null ? LOGIN_UNEXPIRING_TOKEN_DAYS : this._options.loginExpirationInDays;
    return (loginExpirationInDays || DEFAULT_LOGIN_EXPIRATION_DAYS) * 24 * 60 * 60 * 1000;
  }

  _getPasswordResetTokenLifetimeMs() {
    return (this._options.passwordResetTokenExpirationInDays || DEFAULT_PASSWORD_RESET_TOKEN_EXPIRATION_DAYS) * 24 * 60 * 60 * 1000;
  }

  _getPasswordEnrollTokenLifetimeMs() {
    return (this._options.passwordEnrollTokenExpirationInDays || DEFAULT_PASSWORD_ENROLL_TOKEN_EXPIRATION_DAYS) * 24 * 60 * 60 * 1000;
  }

  _tokenExpiration(when) {
    // We pass when through the Date constructor for backwards compatibility;
    // `when` used to be a number.
    return new Date(new Date(when).getTime() + this._getTokenLifetimeMs());
  }

  _tokenExpiresSoon(when) {
    let minLifetimeMs = .1 * this._getTokenLifetimeMs();

    const minLifetimeCapMs = MIN_TOKEN_LIFETIME_CAP_SECS * 1000;

    if (minLifetimeMs > minLifetimeCapMs) {
      minLifetimeMs = minLifetimeCapMs;
    }

    return new Date() > new Date(when) - minLifetimeMs;
  }

}

// Note that Accounts is defined separately in accounts_client.js and
// accounts_server.js.

/**
 * @summary Get the current user id, or `null` if no user is logged in. A reactive data source.
 * @locus Anywhere but publish functions
 * @importFromPackage meteor
 */
Meteor.userId = () => Accounts.userId();
/**
 * @summary Get the current user record, or `null` if no user is logged in. A reactive data source.
 * @locus Anywhere but publish functions
 * @importFromPackage meteor
 */


Meteor.user = () => Accounts.user(); // how long (in days) until a login token expires


const DEFAULT_LOGIN_EXPIRATION_DAYS = 90; // how long (in days) until reset password token expires

const DEFAULT_PASSWORD_RESET_TOKEN_EXPIRATION_DAYS = 3; // how long (in days) until enrol password token expires

const DEFAULT_PASSWORD_ENROLL_TOKEN_EXPIRATION_DAYS = 30; // Clients don't try to auto-login with a token that is going to expire within
// .1 * DEFAULT_LOGIN_EXPIRATION_DAYS, capped at MIN_TOKEN_LIFETIME_CAP_SECS.
// Tries to avoid abrupt disconnects from expiring tokens.

const MIN_TOKEN_LIFETIME_CAP_SECS = 3600; // one hour
// how often (in milliseconds) we check for expired tokens

const EXPIRE_TOKENS_INTERVAL_MS = 600 * 1000;
const CONNECTION_CLOSE_DELAY_MS = 10 * 1000;
// A large number of expiration days (approximately 100 years worth) that is
// used when creating unexpiring tokens.
const LOGIN_UNEXPIRING_TOKEN_DAYS = 365 * 100;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"accounts_server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/accounts-base/accounts_server.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

module.export({
  AccountsServer: () => AccountsServer
});
let crypto;
module.link("crypto", {
  default(v) {
    crypto = v;
  }

}, 0);
let AccountsCommon, EXPIRE_TOKENS_INTERVAL_MS, CONNECTION_CLOSE_DELAY_MS;
module.link("./accounts_common.js", {
  AccountsCommon(v) {
    AccountsCommon = v;
  },

  EXPIRE_TOKENS_INTERVAL_MS(v) {
    EXPIRE_TOKENS_INTERVAL_MS = v;
  },

  CONNECTION_CLOSE_DELAY_MS(v) {
    CONNECTION_CLOSE_DELAY_MS = v;
  }

}, 1);
const hasOwn = Object.prototype.hasOwnProperty;
/**
 * @summary Constructor for the `Accounts` namespace on the server.
 * @locus Server
 * @class AccountsServer
 * @extends AccountsCommon
 * @instancename accountsServer
 * @param {Object} server A server object such as `Meteor.server`.
 */

class AccountsServer extends AccountsCommon {
  // Note that this constructor is less likely to be instantiated multiple
  // times than the `AccountsClient` constructor, because a single server
  // can provide only one set of methods.
  constructor(server) {
    super();
    this._server = server || Meteor.server; // Set up the server's methods, as if by calling Meteor.methods.

    this._initServerMethods();

    this._initAccountDataHooks(); // If autopublish is on, publish these user fields. Login service
    // packages (eg accounts-google) add to these by calling
    // addAutopublishFields.  Notably, this isn't implemented with multiple
    // publishes since DDP only merges only across top-level fields, not
    // subfields (such as 'services.facebook.accessToken')


    this._autopublishFields = {
      loggedInUser: ['profile', 'username', 'emails'],
      otherUsers: ['profile', 'username']
    };

    this._initServerPublications(); // connectionId -> {connection, loginToken}


    this._accountData = {}; // connection id -> observe handle for the login token that this connection is
    // currently associated with, or a number. The number indicates that we are in
    // the process of setting up the observe (using a number instead of a single
    // sentinel allows multiple attempts to set up the observe to identify which
    // one was theirs).

    this._userObservesForConnections = {};
    this._nextUserObserveNumber = 1; // for the number described above.
    // list of all registered handlers.

    this._loginHandlers = [];
    setupUsersCollection(this.users);
    setupDefaultLoginHandlers(this);
    setExpireTokensInterval(this);
    this._validateLoginHook = new Hook({
      bindEnvironment: false
    });
    this._validateNewUserHooks = [defaultValidateNewUserHook.bind(this)];

    this._deleteSavedTokensForAllUsersOnStartup();

    this._skipCaseInsensitiveChecksForTest = {}; // XXX These should probably not actually be public?

    this.urls = {
      resetPassword: token => Meteor.absoluteUrl(`#/reset-password/${token}`),
      verifyEmail: token => Meteor.absoluteUrl(`#/verify-email/${token}`),
      enrollAccount: token => Meteor.absoluteUrl(`#/enroll-account/${token}`)
    };
    this.addDefaultRateLimit();
  } ///
  /// CURRENT USER
  ///
  // @override of "abstract" non-implementation in accounts_common.js


  userId() {
    // This function only works if called inside a method or a pubication.
    // Using any of the infomation from Meteor.user() in a method or
    // publish function will always use the value from when the function first
    // runs. This is likely not what the user expects. The way to make this work
    // in a method or publish function is to do Meteor.find(this.userId).observe
    // and recompute when the user record changes.
    const currentInvocation = DDP._CurrentMethodInvocation.get() || DDP._CurrentPublicationInvocation.get();

    if (!currentInvocation) throw new Error("Meteor.userId can only be invoked in method calls or publications.");
    return currentInvocation.userId;
  } ///
  /// LOGIN HOOKS
  ///

  /**
   * @summary Validate login attempts.
   * @locus Server
   * @param {Function} func Called whenever a login is attempted (either successful or unsuccessful).  A login can be aborted by returning a falsy value or throwing an exception.
   */


  validateLoginAttempt(func) {
    // Exceptions inside the hook callback are passed up to us.
    return this._validateLoginHook.register(func);
  }
  /**
   * @summary Set restrictions on new user creation.
   * @locus Server
   * @param {Function} func Called whenever a new user is created. Takes the new user object, and returns true to allow the creation or false to abort.
   */


  validateNewUser(func) {
    this._validateNewUserHooks.push(func);
  } ///
  /// CREATE USER HOOKS
  ///

  /**
   * @summary Customize new user creation.
   * @locus Server
   * @param {Function} func Called whenever a new user is created. Return the new user object, or throw an `Error` to abort the creation.
   */


  onCreateUser(func) {
    if (this._onCreateUserHook) {
      throw new Error("Can only call onCreateUser once");
    }

    this._onCreateUserHook = func;
  }
  /**
   * @summary Customize oauth user profile updates
   * @locus Server
   * @param {Function} func Called whenever a user is logged in via oauth. Return the profile object to be merged, or throw an `Error` to abort the creation.
   */


  onExternalLogin(func) {
    if (this._onExternalLoginHook) {
      throw new Error("Can only call onExternalLogin once");
    }

    this._onExternalLoginHook = func;
  }

  _validateLogin(connection, attempt) {
    this._validateLoginHook.each(callback => {
      let ret;

      try {
        ret = callback(cloneAttemptWithConnection(connection, attempt));
      } catch (e) {
        attempt.allowed = false; // XXX this means the last thrown error overrides previous error
        // messages. Maybe this is surprising to users and we should make
        // overriding errors more explicit. (see
        // https://github.com/meteor/meteor/issues/1960)

        attempt.error = e;
        return true;
      }

      if (!ret) {
        attempt.allowed = false; // don't override a specific error provided by a previous
        // validator or the initial attempt (eg "incorrect password").

        if (!attempt.error) attempt.error = new Meteor.Error(403, "Login forbidden");
      }

      return true;
    });
  }

  _successfulLogin(connection, attempt) {
    this._onLoginHook.each(callback => {
      callback(cloneAttemptWithConnection(connection, attempt));
      return true;
    });
  }

  _failedLogin(connection, attempt) {
    this._onLoginFailureHook.each(callback => {
      callback(cloneAttemptWithConnection(connection, attempt));
      return true;
    });
  }

  _successfulLogout(connection, userId) {
    const user = userId && this.users.findOne(userId);

    this._onLogoutHook.each(callback => {
      callback({
        user,
        connection
      });
      return true;
    });
  }

  ///
  /// LOGIN METHODS
  ///
  // Login methods return to the client an object containing these
  // fields when the user was logged in successfully:
  //
  //   id: userId
  //   token: *
  //   tokenExpires: *
  //
  // tokenExpires is optional and intends to provide a hint to the
  // client as to when the token will expire. If not provided, the
  // client will call Accounts._tokenExpiration, passing it the date
  // that it received the token.
  //
  // The login method will throw an error back to the client if the user
  // failed to log in.
  //
  //
  // Login handlers and service specific login methods such as
  // `createUser` internally return a `result` object containing these
  // fields:
  //
  //   type:
  //     optional string; the service name, overrides the handler
  //     default if present.
  //
  //   error:
  //     exception; if the user is not allowed to login, the reason why.
  //
  //   userId:
  //     string; the user id of the user attempting to login (if
  //     known), required for an allowed login.
  //
  //   options:
  //     optional object merged into the result returned by the login
  //     method; used by HAMK from SRP.
  //
  //   stampedLoginToken:
  //     optional object with `token` and `when` indicating the login
  //     token is already present in the database, returned by the
  //     "resume" login handler.
  //
  // For convenience, login methods can also throw an exception, which
  // is converted into an {error} result.  However, if the id of the
  // user attempting the login is known, a {userId, error} result should
  // be returned instead since the user id is not captured when an
  // exception is thrown.
  //
  // This internal `result` object is automatically converted into the
  // public {id, token, tokenExpires} object returned to the client.
  // Try a login method, converting thrown exceptions into an {error}
  // result.  The `type` argument is a default, inserted into the result
  // object if not explicitly returned.
  //
  // Log in a user on a connection.
  //
  // We use the method invocation to set the user id on the connection,
  // not the connection object directly. setUserId is tied to methods to
  // enforce clear ordering of method application (using wait methods on
  // the client, and a no setUserId after unblock restriction on the
  // server)
  //
  // The `stampedLoginToken` parameter is optional.  When present, it
  // indicates that the login token has already been inserted into the
  // database and doesn't need to be inserted again.  (It's used by the
  // "resume" login handler).
  _loginUser(methodInvocation, userId, stampedLoginToken) {
    if (!stampedLoginToken) {
      stampedLoginToken = this._generateStampedLoginToken();

      this._insertLoginToken(userId, stampedLoginToken);
    } // This order (and the avoidance of yields) is important to make
    // sure that when publish functions are rerun, they see a
    // consistent view of the world: the userId is set and matches
    // the login token on the connection (not that there is
    // currently a public API for reading the login token on a
    // connection).


    Meteor._noYieldsAllowed(() => this._setLoginToken(userId, methodInvocation.connection, this._hashLoginToken(stampedLoginToken.token)));

    methodInvocation.setUserId(userId);
    return {
      id: userId,
      token: stampedLoginToken.token,
      tokenExpires: this._tokenExpiration(stampedLoginToken.when)
    };
  }

  // After a login method has completed, call the login hooks.  Note
  // that `attemptLogin` is called for *all* login attempts, even ones
  // which aren't successful (such as an invalid password, etc).
  //
  // If the login is allowed and isn't aborted by a validate login hook
  // callback, log in the user.
  //
  _attemptLogin(methodInvocation, methodName, methodArgs, result) {
    if (!result) throw new Error("result is required"); // XXX A programming error in a login handler can lead to this occuring, and
    // then we don't call onLogin or onLoginFailure callbacks. Should
    // tryLoginMethod catch this case and turn it into an error?

    if (!result.userId && !result.error) throw new Error("A login method must specify a userId or an error");
    let user;
    if (result.userId) user = this.users.findOne(result.userId);
    const attempt = {
      type: result.type || "unknown",
      allowed: !!(result.userId && !result.error),
      methodName: methodName,
      methodArguments: Array.from(methodArgs)
    };

    if (result.error) {
      attempt.error = result.error;
    }

    if (user) {
      attempt.user = user;
    } // _validateLogin may mutate `attempt` by adding an error and changing allowed
    // to false, but that's the only change it can make (and the user's callbacks
    // only get a clone of `attempt`).


    this._validateLogin(methodInvocation.connection, attempt);

    if (attempt.allowed) {
      const ret = (0, _objectSpread2.default)({}, this._loginUser(methodInvocation, result.userId, result.stampedLoginToken), result.options);
      ret.type = attempt.type;

      this._successfulLogin(methodInvocation.connection, attempt);

      return ret;
    } else {
      this._failedLogin(methodInvocation.connection, attempt);

      throw attempt.error;
    }
  }

  // All service specific login methods should go through this function.
  // Ensure that thrown exceptions are caught and that login hook
  // callbacks are still called.
  //
  _loginMethod(methodInvocation, methodName, methodArgs, type, fn) {
    return this._attemptLogin(methodInvocation, methodName, methodArgs, tryLoginMethod(type, fn));
  }

  // Report a login attempt failed outside the context of a normal login
  // method. This is for use in the case where there is a multi-step login
  // procedure (eg SRP based password login). If a method early in the
  // chain fails, it should call this function to report a failure. There
  // is no corresponding method for a successful login; methods that can
  // succeed at logging a user in should always be actual login methods
  // (using either Accounts._loginMethod or Accounts.registerLoginHandler).
  _reportLoginFailure(methodInvocation, methodName, methodArgs, result) {
    const attempt = {
      type: result.type || "unknown",
      allowed: false,
      error: result.error,
      methodName: methodName,
      methodArguments: Array.from(methodArgs)
    };

    if (result.userId) {
      attempt.user = this.users.findOne(result.userId);
    }

    this._validateLogin(methodInvocation.connection, attempt);

    this._failedLogin(methodInvocation.connection, attempt); // _validateLogin may mutate attempt to set a new error message. Return
    // the modified version.


    return attempt;
  }

  ///
  /// LOGIN HANDLERS
  ///
  // The main entry point for auth packages to hook in to login.
  //
  // A login handler is a login method which can return `undefined` to
  // indicate that the login request is not handled by this handler.
  //
  // @param name {String} Optional.  The service name, used by default
  // if a specific service name isn't returned in the result.
  //
  // @param handler {Function} A function that receives an options object
  // (as passed as an argument to the `login` method) and returns one of:
  // - `undefined`, meaning don't handle;
  // - a login method result object
  registerLoginHandler(name, handler) {
    if (!handler) {
      handler = name;
      name = null;
    }

    this._loginHandlers.push({
      name: name,
      handler: handler
    });
  }

  // Checks a user's credentials against all the registered login
  // handlers, and returns a login token if the credentials are valid. It
  // is like the login method, except that it doesn't set the logged-in
  // user on the connection. Throws a Meteor.Error if logging in fails,
  // including the case where none of the login handlers handled the login
  // request. Otherwise, returns {id: userId, token: *, tokenExpires: *}.
  //
  // For example, if you want to login with a plaintext password, `options` could be
  //   { user: { username: <username> }, password: <password> }, or
  //   { user: { email: <email> }, password: <password> }.
  // Try all of the registered login handlers until one of them doesn't
  // return `undefined`, meaning it handled this call to `login`. Return
  // that return value.
  _runLoginHandlers(methodInvocation, options) {
    for (let handler of this._loginHandlers) {
      const result = tryLoginMethod(handler.name, () => handler.handler.call(methodInvocation, options));

      if (result) {
        return result;
      }

      if (result !== undefined) {
        throw new Meteor.Error(400, "A login handler should return a result or undefined");
      }
    }

    return {
      type: null,
      error: new Meteor.Error(400, "Unrecognized options for login request")
    };
  }

  // Deletes the given loginToken from the database.
  //
  // For new-style hashed token, this will cause all connections
  // associated with the token to be closed.
  //
  // Any connections associated with old-style unhashed tokens will be
  // in the process of becoming associated with hashed tokens and then
  // they'll get closed.
  destroyToken(userId, loginToken) {
    this.users.update(userId, {
      $pull: {
        "services.resume.loginTokens": {
          $or: [{
            hashedToken: loginToken
          }, {
            token: loginToken
          }]
        }
      }
    });
  }

  _initServerMethods() {
    // The methods created in this function need to be created here so that
    // this variable is available in their scope.
    const accounts = this; // This object will be populated with methods and then passed to
    // accounts._server.methods further below.

    const methods = {}; // @returns {Object|null}
    //   If successful, returns {token: reconnectToken, id: userId}
    //   If unsuccessful (for example, if the user closed the oauth login popup),
    //     throws an error describing the reason

    methods.login = function (options) {
      // Login handlers should really also check whatever field they look at in
      // options, but we don't enforce it.
      check(options, Object);

      const result = accounts._runLoginHandlers(this, options);

      return accounts._attemptLogin(this, "login", arguments, result);
    };

    methods.logout = function () {
      const token = accounts._getLoginToken(this.connection.id);

      accounts._setLoginToken(this.userId, this.connection, null);

      if (token && this.userId) {
        accounts.destroyToken(this.userId, token);
      }

      accounts._successfulLogout(this.connection, this.userId);

      this.setUserId(null);
    }; // Delete all the current user's tokens and close all open connections logged
    // in as this user. Returns a fresh new login token that this client can
    // use. Tests set Accounts._noConnectionCloseDelayForTest to delete tokens
    // immediately instead of using a delay.
    //
    // XXX COMPAT WITH 0.7.2
    // This single `logoutOtherClients` method has been replaced with two
    // methods, one that you call to get a new token, and another that you
    // call to remove all tokens except your own. The new design allows
    // clients to know when other clients have actually been logged
    // out. (The `logoutOtherClients` method guarantees the caller that
    // the other clients will be logged out at some point, but makes no
    // guarantees about when.) This method is left in for backwards
    // compatibility, especially since application code might be calling
    // this method directly.
    //
    // @returns {Object} Object with token and tokenExpires keys.


    methods.logoutOtherClients = function () {
      const user = accounts.users.findOne(this.userId, {
        fields: {
          "services.resume.loginTokens": true
        }
      });

      if (user) {
        // Save the current tokens in the database to be deleted in
        // CONNECTION_CLOSE_DELAY_MS ms. This gives other connections in the
        // caller's browser time to find the fresh token in localStorage. We save
        // the tokens in the database in case we crash before actually deleting
        // them.
        const tokens = user.services.resume.loginTokens;

        const newToken = accounts._generateStampedLoginToken();

        accounts.users.update(this.userId, {
          $set: {
            "services.resume.loginTokensToDelete": tokens,
            "services.resume.haveLoginTokensToDelete": true
          },
          $push: {
            "services.resume.loginTokens": accounts._hashStampedToken(newToken)
          }
        });
        Meteor.setTimeout(() => {
          // The observe on Meteor.users will take care of closing the connections
          // associated with `tokens`.
          accounts._deleteSavedTokensForUser(this.userId, tokens);
        }, accounts._noConnectionCloseDelayForTest ? 0 : CONNECTION_CLOSE_DELAY_MS); // We do not set the login token on this connection, but instead the
        // observe closes the connection and the client will reconnect with the
        // new token.

        return {
          token: newToken.token,
          tokenExpires: accounts._tokenExpiration(newToken.when)
        };
      } else {
        throw new Meteor.Error("You are not logged in.");
      }
    }; // Generates a new login token with the same expiration as the
    // connection's current token and saves it to the database. Associates
    // the connection with this new token and returns it. Throws an error
    // if called on a connection that isn't logged in.
    //
    // @returns Object
    //   If successful, returns { token: <new token>, id: <user id>,
    //   tokenExpires: <expiration date> }.


    methods.getNewToken = function () {
      const user = accounts.users.findOne(this.userId, {
        fields: {
          "services.resume.loginTokens": 1
        }
      });

      if (!this.userId || !user) {
        throw new Meteor.Error("You are not logged in.");
      } // Be careful not to generate a new token that has a later
      // expiration than the curren token. Otherwise, a bad guy with a
      // stolen token could use this method to stop his stolen token from
      // ever expiring.


      const currentHashedToken = accounts._getLoginToken(this.connection.id);

      const currentStampedToken = user.services.resume.loginTokens.find(stampedToken => stampedToken.hashedToken === currentHashedToken);

      if (!currentStampedToken) {
        // safety belt: this should never happen
        throw new Meteor.Error("Invalid login token");
      }

      const newStampedToken = accounts._generateStampedLoginToken();

      newStampedToken.when = currentStampedToken.when;

      accounts._insertLoginToken(this.userId, newStampedToken);

      return accounts._loginUser(this, this.userId, newStampedToken);
    }; // Removes all tokens except the token associated with the current
    // connection. Throws an error if the connection is not logged
    // in. Returns nothing on success.


    methods.removeOtherTokens = function () {
      if (!this.userId) {
        throw new Meteor.Error("You are not logged in.");
      }

      const currentToken = accounts._getLoginToken(this.connection.id);

      accounts.users.update(this.userId, {
        $pull: {
          "services.resume.loginTokens": {
            hashedToken: {
              $ne: currentToken
            }
          }
        }
      });
    }; // Allow a one-time configuration for a login service. Modifications
    // to this collection are also allowed in insecure mode.


    methods.configureLoginService = options => {
      check(options, Match.ObjectIncluding({
        service: String
      })); // Don't let random users configure a service we haven't added yet (so
      // that when we do later add it, it's set up with their configuration
      // instead of ours).
      // XXX if service configuration is oauth-specific then this code should
      //     be in accounts-oauth; if it's not then the registry should be
      //     in this package

      if (!(accounts.oauth && accounts.oauth.serviceNames().includes(options.service))) {
        throw new Meteor.Error(403, "Service unknown");
      }

      const {
        ServiceConfiguration
      } = Package['service-configuration'];
      if (ServiceConfiguration.configurations.findOne({
        service: options.service
      })) throw new Meteor.Error(403, `Service ${options.service} already configured`);
      if (hasOwn.call(options, 'secret') && usingOAuthEncryption()) options.secret = OAuthEncryption.seal(options.secret);
      ServiceConfiguration.configurations.insert(options);
    };

    accounts._server.methods(methods);
  }

  _initAccountDataHooks() {
    this._server.onConnection(connection => {
      this._accountData[connection.id] = {
        connection: connection
      };
      connection.onClose(() => {
        this._removeTokenFromConnection(connection.id);

        delete this._accountData[connection.id];
      });
    });
  }

  _initServerPublications() {
    // Bring into lexical scope for publish callbacks that need `this`
    const {
      users,
      _autopublishFields
    } = this; // Publish all login service configuration fields other than secret.

    this._server.publish("meteor.loginServiceConfiguration", () => {
      const {
        ServiceConfiguration
      } = Package['service-configuration'];
      return ServiceConfiguration.configurations.find({}, {
        fields: {
          secret: 0
        }
      });
    }, {
      is_auto: true
    }); // not techincally autopublish, but stops the warning.
    // Publish the current user's record to the client.


    this._server.publish(null, function () {
      if (this.userId) {
        return users.find({
          _id: this.userId
        }, {
          fields: {
            profile: 1,
            username: 1,
            emails: 1
          }
        });
      } else {
        return null;
      }
    },
    /*suppress autopublish warning*/
    {
      is_auto: true
    }); // Use Meteor.startup to give other packages a chance to call
    // addAutopublishFields.


    Package.autopublish && Meteor.startup(() => {
      // ['profile', 'username'] -> {profile: 1, username: 1}
      const toFieldSelector = fields => fields.reduce((prev, field) => (0, _objectSpread2.default)({}, prev, {
        [field]: 1
      }), {});

      this._server.publish(null, function () {
        if (this.userId) {
          return users.find({
            _id: this.userId
          }, {
            fields: toFieldSelector(_autopublishFields.loggedInUser)
          });
        } else {
          return null;
        }
      },
      /*suppress autopublish warning*/
      {
        is_auto: true
      }); // XXX this publish is neither dedup-able nor is it optimized by our special
      // treatment of queries on a specific _id. Therefore this will have O(n^2)
      // run-time performance every time a user document is changed (eg someone
      // logging in). If this is a problem, we can instead write a manual publish
      // function which filters out fields based on 'this.userId'.


      this._server.publish(null, function () {
        const selector = this.userId ? {
          _id: {
            $ne: this.userId
          }
        } : {};
        return users.find(selector, {
          fields: toFieldSelector(_autopublishFields.otherUsers)
        });
      },
      /*suppress autopublish warning*/
      {
        is_auto: true
      });
    });
  }

  // Add to the list of fields or subfields to be automatically
  // published if autopublish is on. Must be called from top-level
  // code (ie, before Meteor.startup hooks run).
  //
  // @param opts {Object} with:
  //   - forLoggedInUser {Array} Array of fields published to the logged-in user
  //   - forOtherUsers {Array} Array of fields published to users that aren't logged in
  addAutopublishFields(opts) {
    this._autopublishFields.loggedInUser.push.apply(this._autopublishFields.loggedInUser, opts.forLoggedInUser);

    this._autopublishFields.otherUsers.push.apply(this._autopublishFields.otherUsers, opts.forOtherUsers);
  }

  ///
  /// ACCOUNT DATA
  ///
  // HACK: This is used by 'meteor-accounts' to get the loginToken for a
  // connection. Maybe there should be a public way to do that.
  _getAccountData(connectionId, field) {
    const data = this._accountData[connectionId];
    return data && data[field];
  }

  _setAccountData(connectionId, field, value) {
    const data = this._accountData[connectionId]; // safety belt. shouldn't happen. accountData is set in onConnection,
    // we don't have a connectionId until it is set.

    if (!data) return;
    if (value === undefined) delete data[field];else data[field] = value;
  }

  ///
  /// RECONNECT TOKENS
  ///
  /// support reconnecting using a meteor login token
  _hashLoginToken(loginToken) {
    const hash = crypto.createHash('sha256');
    hash.update(loginToken);
    return hash.digest('base64');
  }

  // {token, when} => {hashedToken, when}
  _hashStampedToken(stampedToken) {
    const hashedStampedToken = Object.keys(stampedToken).reduce((prev, key) => key === 'token' ? prev : (0, _objectSpread2.default)({}, prev, {
      [key]: stampedToken[key]
    }), {});
    return (0, _objectSpread2.default)({}, hashedStampedToken, {
      hashedToken: this._hashLoginToken(stampedToken.token)
    });
  }

  // Using $addToSet avoids getting an index error if another client
  // logging in simultaneously has already inserted the new hashed
  // token.
  _insertHashedLoginToken(userId, hashedToken, query) {
    query = query ? (0, _objectSpread2.default)({}, query) : {};
    query._id = userId;
    this.users.update(query, {
      $addToSet: {
        "services.resume.loginTokens": hashedToken
      }
    });
  }

  // Exported for tests.
  _insertLoginToken(userId, stampedToken, query) {
    this._insertHashedLoginToken(userId, this._hashStampedToken(stampedToken), query);
  }

  _clearAllLoginTokens(userId) {
    this.users.update(userId, {
      $set: {
        'services.resume.loginTokens': []
      }
    });
  }

  // test hook
  _getUserObserve(connectionId) {
    return this._userObservesForConnections[connectionId];
  }

  // Clean up this connection's association with the token: that is, stop
  // the observe that we started when we associated the connection with
  // this token.
  _removeTokenFromConnection(connectionId) {
    if (hasOwn.call(this._userObservesForConnections, connectionId)) {
      const observe = this._userObservesForConnections[connectionId];

      if (typeof observe === 'number') {
        // We're in the process of setting up an observe for this connection. We
        // can't clean up that observe yet, but if we delete the placeholder for
        // this connection, then the observe will get cleaned up as soon as it has
        // been set up.
        delete this._userObservesForConnections[connectionId];
      } else {
        delete this._userObservesForConnections[connectionId];
        observe.stop();
      }
    }
  }

  _getLoginToken(connectionId) {
    return this._getAccountData(connectionId, 'loginToken');
  }

  // newToken is a hashed token.
  _setLoginToken(userId, connection, newToken) {
    this._removeTokenFromConnection(connection.id);

    this._setAccountData(connection.id, 'loginToken', newToken);

    if (newToken) {
      // Set up an observe for this token. If the token goes away, we need
      // to close the connection.  We defer the observe because there's
      // no need for it to be on the critical path for login; we just need
      // to ensure that the connection will get closed at some point if
      // the token gets deleted.
      //
      // Initially, we set the observe for this connection to a number; this
      // signifies to other code (which might run while we yield) that we are in
      // the process of setting up an observe for this connection. Once the
      // observe is ready to go, we replace the number with the real observe
      // handle (unless the placeholder has been deleted or replaced by a
      // different placehold number, signifying that the connection was closed
      // already -- in this case we just clean up the observe that we started).
      const myObserveNumber = ++this._nextUserObserveNumber;
      this._userObservesForConnections[connection.id] = myObserveNumber;
      Meteor.defer(() => {
        // If something else happened on this connection in the meantime (it got
        // closed, or another call to _setLoginToken happened), just do
        // nothing. We don't need to start an observe for an old connection or old
        // token.
        if (this._userObservesForConnections[connection.id] !== myObserveNumber) {
          return;
        }

        let foundMatchingUser; // Because we upgrade unhashed login tokens to hashed tokens at
        // login time, sessions will only be logged in with a hashed
        // token. Thus we only need to observe hashed tokens here.

        const observe = this.users.find({
          _id: userId,
          'services.resume.loginTokens.hashedToken': newToken
        }, {
          fields: {
            _id: 1
          }
        }).observeChanges({
          added: () => {
            foundMatchingUser = true;
          },
          removed: connection.close // The onClose callback for the connection takes care of
          // cleaning up the observe handle and any other state we have
          // lying around.

        }); // If the user ran another login or logout command we were waiting for the
        // defer or added to fire (ie, another call to _setLoginToken occurred),
        // then we let the later one win (start an observe, etc) and just stop our
        // observe now.
        //
        // Similarly, if the connection was already closed, then the onClose
        // callback would have called _removeTokenFromConnection and there won't
        // be an entry in _userObservesForConnections. We can stop the observe.

        if (this._userObservesForConnections[connection.id] !== myObserveNumber) {
          observe.stop();
          return;
        }

        this._userObservesForConnections[connection.id] = observe;

        if (!foundMatchingUser) {
          // We've set up an observe on the user associated with `newToken`,
          // so if the new token is removed from the database, we'll close
          // the connection. But the token might have already been deleted
          // before we set up the observe, which wouldn't have closed the
          // connection because the observe wasn't running yet.
          connection.close();
        }
      });
    }
  }

  // (Also used by Meteor Accounts server and tests).
  //
  _generateStampedLoginToken() {
    return {
      token: Random.secret(),
      when: new Date()
    };
  }

  ///
  /// TOKEN EXPIRATION
  ///
  // Deletes expired password reset tokens from the database.
  //
  // Exported for tests. Also, the arguments are only used by
  // tests. oldestValidDate is simulate expiring tokens without waiting
  // for them to actually expire. userId is used by tests to only expire
  // tokens for the test user.
  _expirePasswordResetTokens(oldestValidDate, userId) {
    const tokenLifetimeMs = this._getPasswordResetTokenLifetimeMs(); // when calling from a test with extra arguments, you must specify both!


    if (oldestValidDate && !userId || !oldestValidDate && userId) {
      throw new Error("Bad test. Must specify both oldestValidDate and userId.");
    }

    oldestValidDate = oldestValidDate || new Date(new Date() - tokenLifetimeMs);
    const tokenFilter = {
      $or: [{
        "services.password.reset.reason": "reset"
      }, {
        "services.password.reset.reason": {
          $exists: false
        }
      }]
    };
    expirePasswordToken(this, oldestValidDate, tokenFilter, userId);
  } // Deletes expired password enroll tokens from the database.
  //
  // Exported for tests. Also, the arguments are only used by
  // tests. oldestValidDate is simulate expiring tokens without waiting
  // for them to actually expire. userId is used by tests to only expire
  // tokens for the test user.


  _expirePasswordEnrollTokens(oldestValidDate, userId) {
    const tokenLifetimeMs = this._getPasswordEnrollTokenLifetimeMs(); // when calling from a test with extra arguments, you must specify both!


    if (oldestValidDate && !userId || !oldestValidDate && userId) {
      throw new Error("Bad test. Must specify both oldestValidDate and userId.");
    }

    oldestValidDate = oldestValidDate || new Date(new Date() - tokenLifetimeMs);
    const tokenFilter = {
      "services.password.reset.reason": "enroll"
    };
    expirePasswordToken(this, oldestValidDate, tokenFilter, userId);
  } // Deletes expired tokens from the database and closes all open connections
  // associated with these tokens.
  //
  // Exported for tests. Also, the arguments are only used by
  // tests. oldestValidDate is simulate expiring tokens without waiting
  // for them to actually expire. userId is used by tests to only expire
  // tokens for the test user.


  _expireTokens(oldestValidDate, userId) {
    const tokenLifetimeMs = this._getTokenLifetimeMs(); // when calling from a test with extra arguments, you must specify both!


    if (oldestValidDate && !userId || !oldestValidDate && userId) {
      throw new Error("Bad test. Must specify both oldestValidDate and userId.");
    }

    oldestValidDate = oldestValidDate || new Date(new Date() - tokenLifetimeMs);
    const userFilter = userId ? {
      _id: userId
    } : {}; // Backwards compatible with older versions of meteor that stored login token
    // timestamps as numbers.

    this.users.update((0, _objectSpread2.default)({}, userFilter, {
      $or: [{
        "services.resume.loginTokens.when": {
          $lt: oldestValidDate
        }
      }, {
        "services.resume.loginTokens.when": {
          $lt: +oldestValidDate
        }
      }]
    }), {
      $pull: {
        "services.resume.loginTokens": {
          $or: [{
            when: {
              $lt: oldestValidDate
            }
          }, {
            when: {
              $lt: +oldestValidDate
            }
          }]
        }
      }
    }, {
      multi: true
    }); // The observe on Meteor.users will take care of closing connections for
    // expired tokens.
  }

  // @override from accounts_common.js
  config(options) {
    // Call the overridden implementation of the method.
    const superResult = AccountsCommon.prototype.config.apply(this, arguments); // If the user set loginExpirationInDays to null, then we need to clear the
    // timer that periodically expires tokens.

    if (hasOwn.call(this._options, 'loginExpirationInDays') && this._options.loginExpirationInDays === null && this.expireTokenInterval) {
      Meteor.clearInterval(this.expireTokenInterval);
      this.expireTokenInterval = null;
    }

    return superResult;
  }

  // Called by accounts-password
  insertUserDoc(options, user) {
    // - clone user document, to protect from modification
    // - add createdAt timestamp
    // - prepare an _id, so that you can modify other collections (eg
    // create a first task for every new user)
    //
    // XXX If the onCreateUser or validateNewUser hooks fail, we might
    // end up having modified some other collection
    // inappropriately. The solution is probably to have onCreateUser
    // accept two callbacks - one that gets called before inserting
    // the user document (in which you can modify its contents), and
    // one that gets called after (in which you should change other
    // collections)
    user = (0, _objectSpread2.default)({
      createdAt: new Date(),
      _id: Random.id()
    }, user);

    if (user.services) {
      Object.keys(user.services).forEach(service => pinEncryptedFieldsToUser(user.services[service], user._id));
    }

    let fullUser;

    if (this._onCreateUserHook) {
      fullUser = this._onCreateUserHook(options, user); // This is *not* part of the API. We need this because we can't isolate
      // the global server environment between tests, meaning we can't test
      // both having a create user hook set and not having one set.

      if (fullUser === 'TEST DEFAULT HOOK') fullUser = defaultCreateUserHook(options, user);
    } else {
      fullUser = defaultCreateUserHook(options, user);
    }

    this._validateNewUserHooks.forEach(hook => {
      if (!hook(fullUser)) throw new Meteor.Error(403, "User validation failed");
    });

    let userId;

    try {
      userId = this.users.insert(fullUser);
    } catch (e) {
      // XXX string parsing sucks, maybe
      // https://jira.mongodb.org/browse/SERVER-3069 will get fixed one day
      if (!e.errmsg) throw e;
      if (e.errmsg.includes('emails.address')) throw new Meteor.Error(403, "Email already exists.");
      if (e.errmsg.includes('username')) throw new Meteor.Error(403, "Username already exists.");
      throw e;
    }

    return userId;
  }

  // Helper function: returns false if email does not match company domain from
  // the configuration.
  _testEmailDomain(email) {
    const domain = this._options.restrictCreationByEmailDomain;
    return !domain || typeof domain === 'function' && domain(email) || typeof domain === 'string' && new RegExp(`@${Meteor._escapeRegExp(domain)}$`, 'i').test(email);
  }

  ///
  /// CLEAN UP FOR `logoutOtherClients`
  ///
  _deleteSavedTokensForUser(userId, tokensToDelete) {
    if (tokensToDelete) {
      this.users.update(userId, {
        $unset: {
          "services.resume.haveLoginTokensToDelete": 1,
          "services.resume.loginTokensToDelete": 1
        },
        $pullAll: {
          "services.resume.loginTokens": tokensToDelete
        }
      });
    }
  }

  _deleteSavedTokensForAllUsersOnStartup() {
    // If we find users who have saved tokens to delete on startup, delete
    // them now. It's possible that the server could have crashed and come
    // back up before new tokens are found in localStorage, but this
    // shouldn't happen very often. We shouldn't put a delay here because
    // that would give a lot of power to an attacker with a stolen login
    // token and the ability to crash the server.
    Meteor.startup(() => {
      this.users.find({
        "services.resume.haveLoginTokensToDelete": true
      }, {
        "services.resume.loginTokensToDelete": 1
      }).forEach(user => {
        this._deleteSavedTokensForUser(user._id, user.services.resume.loginTokensToDelete);
      });
    });
  }

  ///
  /// MANAGING USER OBJECTS
  ///
  // Updates or creates a user after we authenticate with a 3rd party.
  //
  // @param serviceName {String} Service name (eg, twitter).
  // @param serviceData {Object} Data to store in the user's record
  //        under services[serviceName]. Must include an "id" field
  //        which is a unique identifier for the user in the service.
  // @param options {Object, optional} Other options to pass to insertUserDoc
  //        (eg, profile)
  // @returns {Object} Object with token and id keys, like the result
  //        of the "login" method.
  //
  updateOrCreateUserFromExternalService(serviceName, serviceData, options) {
    options = (0, _objectSpread2.default)({}, options);

    if (serviceName === "password" || serviceName === "resume") {
      throw new Error("Can't use updateOrCreateUserFromExternalService with internal service " + serviceName);
    }

    if (!hasOwn.call(serviceData, 'id')) {
      throw new Error(`Service data for service ${serviceName} must include id`);
    } // Look for a user with the appropriate service user id.


    const selector = {};
    const serviceIdKey = `services.${serviceName}.id`; // XXX Temporary special case for Twitter. (Issue #629)
    //   The serviceData.id will be a string representation of an integer.
    //   We want it to match either a stored string or int representation.
    //   This is to cater to earlier versions of Meteor storing twitter
    //   user IDs in number form, and recent versions storing them as strings.
    //   This can be removed once migration technology is in place, and twitter
    //   users stored with integer IDs have been migrated to string IDs.

    if (serviceName === "twitter" && !isNaN(serviceData.id)) {
      selector["$or"] = [{}, {}];
      selector["$or"][0][serviceIdKey] = serviceData.id;
      selector["$or"][1][serviceIdKey] = parseInt(serviceData.id, 10);
    } else {
      selector[serviceIdKey] = serviceData.id;
    }

    let user = this.users.findOne(selector); // When creating a new user we pass through all options. When updating an
    // existing user, by default we only process/pass through the serviceData
    // (eg, so that we keep an unexpired access token and don't cache old email
    // addresses in serviceData.email). The onExternalLogin hook can be used when
    // creating or updating a user, to modify or pass through more options as
    // needed.

    let opts = user ? {} : options;

    if (this._onExternalLoginHook) {
      opts = this._onExternalLoginHook(options, user);
    }

    if (user) {
      pinEncryptedFieldsToUser(serviceData, user._id);
      let setAttrs = {};
      Object.keys(serviceData).forEach(key => setAttrs[`services.${serviceName}.${key}`] = serviceData[key]); // XXX Maybe we should re-use the selector above and notice if the update
      //     touches nothing?

      setAttrs = (0, _objectSpread2.default)({}, setAttrs, opts);
      this.users.update(user._id, {
        $set: setAttrs
      });
      return {
        type: serviceName,
        userId: user._id
      };
    } else {
      // Create a new user with the service data.
      user = {
        services: {}
      };
      user.services[serviceName] = serviceData;
      return {
        type: serviceName,
        userId: this.insertUserDoc(opts, user)
      };
    }
  }

  // Removes default rate limiting rule
  removeDefaultRateLimit() {
    const resp = DDPRateLimiter.removeRule(this.defaultRateLimiterRuleId);
    this.defaultRateLimiterRuleId = null;
    return resp;
  }

  // Add a default rule of limiting logins, creating new users and password reset
  // to 5 times every 10 seconds per connection.
  addDefaultRateLimit() {
    if (!this.defaultRateLimiterRuleId) {
      this.defaultRateLimiterRuleId = DDPRateLimiter.addRule({
        userId: null,
        clientAddress: null,
        type: 'method',
        name: name => ['login', 'createUser', 'resetPassword', 'forgotPassword'].includes(name),
        connectionId: connectionId => true
      }, 5, 10000);
    }
  }

}

// Give each login hook callback a fresh cloned copy of the attempt
// object, but don't clone the connection.
//
const cloneAttemptWithConnection = (connection, attempt) => {
  const clonedAttempt = EJSON.clone(attempt);
  clonedAttempt.connection = connection;
  return clonedAttempt;
};

const tryLoginMethod = (type, fn) => {
  let result;

  try {
    result = fn();
  } catch (e) {
    result = {
      error: e
    };
  }

  if (result && !result.type && type) result.type = type;
  return result;
};

const setupDefaultLoginHandlers = accounts => {
  accounts.registerLoginHandler("resume", function (options) {
    return defaultResumeLoginHandler.call(this, accounts, options);
  });
}; // Login handler for resume tokens.


const defaultResumeLoginHandler = (accounts, options) => {
  if (!options.resume) return undefined;
  check(options.resume, String);

  const hashedToken = accounts._hashLoginToken(options.resume); // First look for just the new-style hashed login token, to avoid
  // sending the unhashed token to the database in a query if we don't
  // need to.


  let user = accounts.users.findOne({
    "services.resume.loginTokens.hashedToken": hashedToken
  });

  if (!user) {
    // If we didn't find the hashed login token, try also looking for
    // the old-style unhashed token.  But we need to look for either
    // the old-style token OR the new-style token, because another
    // client connection logging in simultaneously might have already
    // converted the token.
    user = accounts.users.findOne({
      $or: [{
        "services.resume.loginTokens.hashedToken": hashedToken
      }, {
        "services.resume.loginTokens.token": options.resume
      }]
    });
  }

  if (!user) return {
    error: new Meteor.Error(403, "You've been logged out by the server. Please log in again.")
  }; // Find the token, which will either be an object with fields
  // {hashedToken, when} for a hashed token or {token, when} for an
  // unhashed token.

  let oldUnhashedStyleToken;
  let token = user.services.resume.loginTokens.find(token => token.hashedToken === hashedToken);

  if (token) {
    oldUnhashedStyleToken = false;
  } else {
    token = user.services.resume.loginTokens.find(token => token.token === options.resume);
    oldUnhashedStyleToken = true;
  }

  const tokenExpires = accounts._tokenExpiration(token.when);

  if (new Date() >= tokenExpires) return {
    userId: user._id,
    error: new Meteor.Error(403, "Your session has expired. Please log in again.")
  }; // Update to a hashed token when an unhashed token is encountered.

  if (oldUnhashedStyleToken) {
    // Only add the new hashed token if the old unhashed token still
    // exists (this avoids resurrecting the token if it was deleted
    // after we read it).  Using $addToSet avoids getting an index
    // error if another client logging in simultaneously has already
    // inserted the new hashed token.
    accounts.users.update({
      _id: user._id,
      "services.resume.loginTokens.token": options.resume
    }, {
      $addToSet: {
        "services.resume.loginTokens": {
          "hashedToken": hashedToken,
          "when": token.when
        }
      }
    }); // Remove the old token *after* adding the new, since otherwise
    // another client trying to login between our removing the old and
    // adding the new wouldn't find a token to login with.

    accounts.users.update(user._id, {
      $pull: {
        "services.resume.loginTokens": {
          "token": options.resume
        }
      }
    });
  }

  return {
    userId: user._id,
    stampedLoginToken: {
      token: options.resume,
      when: token.when
    }
  };
};

const expirePasswordToken = (accounts, oldestValidDate, tokenFilter, userId) => {
  const userFilter = userId ? {
    _id: userId
  } : {};
  const resetRangeOr = {
    $or: [{
      "services.password.reset.when": {
        $lt: oldestValidDate
      }
    }, {
      "services.password.reset.when": {
        $lt: +oldestValidDate
      }
    }]
  };
  const expireFilter = {
    $and: [tokenFilter, resetRangeOr]
  };
  accounts.users.update((0, _objectSpread2.default)({}, userFilter, expireFilter), {
    $unset: {
      "services.password.reset": ""
    }
  }, {
    multi: true
  });
};

const setExpireTokensInterval = accounts => {
  accounts.expireTokenInterval = Meteor.setInterval(() => {
    accounts._expireTokens();

    accounts._expirePasswordResetTokens();

    accounts._expirePasswordEnrollTokens();
  }, EXPIRE_TOKENS_INTERVAL_MS);
}; ///
/// OAuth Encryption Support
///


const OAuthEncryption = Package["oauth-encryption"] && Package["oauth-encryption"].OAuthEncryption;

const usingOAuthEncryption = () => {
  return OAuthEncryption && OAuthEncryption.keyIsLoaded();
}; // OAuth service data is temporarily stored in the pending credentials
// collection during the oauth authentication process.  Sensitive data
// such as access tokens are encrypted without the user id because
// we don't know the user id yet.  We re-encrypt these fields with the
// user id included when storing the service data permanently in
// the users collection.
//


const pinEncryptedFieldsToUser = (serviceData, userId) => {
  Object.keys(serviceData).forEach(key => {
    let value = serviceData[key];
    if (OAuthEncryption && OAuthEncryption.isSealed(value)) value = OAuthEncryption.seal(OAuthEncryption.open(value), userId);
    serviceData[key] = value;
  });
}; // Encrypt unencrypted login service secrets when oauth-encryption is
// added.
//
// XXX For the oauthSecretKey to be available here at startup, the
// developer must call Accounts.config({oauthSecretKey: ...}) at load
// time, instead of in a Meteor.startup block, because the startup
// block in the app code will run after this accounts-base startup
// block.  Perhaps we need a post-startup callback?


Meteor.startup(() => {
  if (!usingOAuthEncryption()) {
    return;
  }

  const {
    ServiceConfiguration
  } = Package['service-configuration'];
  ServiceConfiguration.configurations.find({
    $and: [{
      secret: {
        $exists: true
      }
    }, {
      "secret.algorithm": {
        $exists: false
      }
    }]
  }).forEach(config => {
    ServiceConfiguration.configurations.update(config._id, {
      $set: {
        secret: OAuthEncryption.seal(config.secret)
      }
    });
  });
}); // XXX see comment on Accounts.createUser in passwords_server about adding a
// second "server options" argument.

const defaultCreateUserHook = (options, user) => {
  if (options.profile) user.profile = options.profile;
  return user;
}; // Validate new user's email or Google/Facebook/GitHub account's email


function defaultValidateNewUserHook(user) {
  const domain = this._options.restrictCreationByEmailDomain;

  if (!domain) {
    return true;
  }

  let emailIsGood = false;

  if (user.emails && user.emails.length > 0) {
    emailIsGood = user.emails.reduce((prev, email) => prev || this._testEmailDomain(email.address), false);
  } else if (user.services && user.services.length > 0) {
    // Find any email of any service and check it
    emailIsGood = user.services.reduce((prev, service) => service.email && this._testEmailDomain(service.email), false);
  }

  if (emailIsGood) {
    return true;
  }

  if (typeof domain === 'string') {
    throw new Meteor.Error(403, `@${domain} email required`);
  } else {
    throw new Meteor.Error(403, "Email doesn't match the criteria.");
  }
}

const setupUsersCollection = users => {
  ///
  /// RESTRICTING WRITES TO USER OBJECTS
  ///
  users.allow({
    // clients can modify the profile field of their own document, and
    // nothing else.
    update: (userId, user, fields, modifier) => {
      // make sure it is our record
      if (user._id !== userId) {
        return false;
      } // user can only modify the 'profile' field. sets to multiple
      // sub-keys (eg profile.foo and profile.bar) are merged into entry
      // in the fields list.


      if (fields.length !== 1 || fields[0] !== 'profile') {
        return false;
      }

      return true;
    },
    fetch: ['_id'] // we only look at _id.

  }); /// DEFAULT INDEXES ON USERS

  users._ensureIndex('username', {
    unique: 1,
    sparse: 1
  });

  users._ensureIndex('emails.address', {
    unique: 1,
    sparse: 1
  });

  users._ensureIndex('services.resume.loginTokens.hashedToken', {
    unique: 1,
    sparse: 1
  });

  users._ensureIndex('services.resume.loginTokens.token', {
    unique: 1,
    sparse: 1
  }); // For taking care of logoutOtherClients calls that crashed before the
  // tokens were deleted.


  users._ensureIndex('services.resume.haveLoginTokensToDelete', {
    sparse: 1
  }); // For expiring login tokens


  users._ensureIndex("services.resume.loginTokens.when", {
    sparse: 1
  }); // For expiring password tokens


  users._ensureIndex('services.password.reset.when', {
    sparse: 1
  });
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/accounts-base/server_main.js");

/* Exports */
Package._define("accounts-base", exports, {
  Accounts: Accounts
});

})();

//# sourceURL=meteor://💻app/packages/accounts-base.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWNjb3VudHMtYmFzZS9zZXJ2ZXJfbWFpbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWNjb3VudHMtYmFzZS9hY2NvdW50c19jb21tb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2FjY291bnRzLWJhc2UvYWNjb3VudHNfc2VydmVyLmpzIl0sIm5hbWVzIjpbIm1vZHVsZTEiLCJtb2R1bGUiLCJleHBvcnQiLCJBY2NvdW50c1NlcnZlciIsImxpbmsiLCJ2IiwiQWNjb3VudHMiLCJNZXRlb3IiLCJzZXJ2ZXIiLCJ1c2VycyIsIkFjY291bnRzQ29tbW9uIiwiRVhQSVJFX1RPS0VOU19JTlRFUlZBTF9NUyIsIkNPTk5FQ1RJT05fQ0xPU0VfREVMQVlfTVMiLCJjb25zdHJ1Y3RvciIsIm9wdGlvbnMiLCJfb3B0aW9ucyIsImNvbm5lY3Rpb24iLCJ1bmRlZmluZWQiLCJfaW5pdENvbm5lY3Rpb24iLCJNb25nbyIsIkNvbGxlY3Rpb24iLCJfcHJldmVudEF1dG9wdWJsaXNoIiwiX29uTG9naW5Ib29rIiwiSG9vayIsImJpbmRFbnZpcm9ubWVudCIsImRlYnVnUHJpbnRFeGNlcHRpb25zIiwiX29uTG9naW5GYWlsdXJlSG9vayIsIl9vbkxvZ291dEhvb2siLCJERUZBVUxUX0xPR0lOX0VYUElSQVRJT05fREFZUyIsIkxPR0lOX1VORVhQSVJJTkdfVE9LRU5fREFZUyIsImxjZU5hbWUiLCJMb2dpbkNhbmNlbGxlZEVycm9yIiwibWFrZUVycm9yVHlwZSIsImRlc2NyaXB0aW9uIiwibWVzc2FnZSIsInByb3RvdHlwZSIsIm5hbWUiLCJudW1lcmljRXJyb3IiLCJzdGFydHVwIiwiU2VydmljZUNvbmZpZ3VyYXRpb24iLCJQYWNrYWdlIiwibG9naW5TZXJ2aWNlQ29uZmlndXJhdGlvbiIsImNvbmZpZ3VyYXRpb25zIiwiQ29uZmlnRXJyb3IiLCJ1c2VySWQiLCJFcnJvciIsInVzZXIiLCJmaW5kT25lIiwiY29uZmlnIiwiaXNTZXJ2ZXIiLCJfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fIiwiYWNjb3VudHNDb25maWdDYWxsZWQiLCJfZGVidWciLCJPYmplY3QiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJpc0NsaWVudCIsIk9BdXRoRW5jcnlwdGlvbiIsImxvYWRLZXkiLCJvYXV0aFNlY3JldEtleSIsIlZBTElEX0tFWVMiLCJrZXlzIiwiZm9yRWFjaCIsImtleSIsImluY2x1ZGVzIiwib25Mb2dpbiIsImZ1bmMiLCJyZWdpc3RlciIsIm9uTG9naW5GYWlsdXJlIiwib25Mb2dvdXQiLCJkZHBVcmwiLCJERFAiLCJjb25uZWN0IiwiQUNDT1VOVFNfQ09OTkVDVElPTl9VUkwiLCJfZ2V0VG9rZW5MaWZldGltZU1zIiwibG9naW5FeHBpcmF0aW9uSW5EYXlzIiwiX2dldFBhc3N3b3JkUmVzZXRUb2tlbkxpZmV0aW1lTXMiLCJwYXNzd29yZFJlc2V0VG9rZW5FeHBpcmF0aW9uSW5EYXlzIiwiREVGQVVMVF9QQVNTV09SRF9SRVNFVF9UT0tFTl9FWFBJUkFUSU9OX0RBWVMiLCJfZ2V0UGFzc3dvcmRFbnJvbGxUb2tlbkxpZmV0aW1lTXMiLCJwYXNzd29yZEVucm9sbFRva2VuRXhwaXJhdGlvbkluRGF5cyIsIkRFRkFVTFRfUEFTU1dPUkRfRU5ST0xMX1RPS0VOX0VYUElSQVRJT05fREFZUyIsIl90b2tlbkV4cGlyYXRpb24iLCJ3aGVuIiwiRGF0ZSIsImdldFRpbWUiLCJfdG9rZW5FeHBpcmVzU29vbiIsIm1pbkxpZmV0aW1lTXMiLCJtaW5MaWZldGltZUNhcE1zIiwiTUlOX1RPS0VOX0xJRkVUSU1FX0NBUF9TRUNTIiwiY3J5cHRvIiwiZGVmYXVsdCIsImhhc093biIsIl9zZXJ2ZXIiLCJfaW5pdFNlcnZlck1ldGhvZHMiLCJfaW5pdEFjY291bnREYXRhSG9va3MiLCJfYXV0b3B1Ymxpc2hGaWVsZHMiLCJsb2dnZWRJblVzZXIiLCJvdGhlclVzZXJzIiwiX2luaXRTZXJ2ZXJQdWJsaWNhdGlvbnMiLCJfYWNjb3VudERhdGEiLCJfdXNlck9ic2VydmVzRm9yQ29ubmVjdGlvbnMiLCJfbmV4dFVzZXJPYnNlcnZlTnVtYmVyIiwiX2xvZ2luSGFuZGxlcnMiLCJzZXR1cFVzZXJzQ29sbGVjdGlvbiIsInNldHVwRGVmYXVsdExvZ2luSGFuZGxlcnMiLCJzZXRFeHBpcmVUb2tlbnNJbnRlcnZhbCIsIl92YWxpZGF0ZUxvZ2luSG9vayIsIl92YWxpZGF0ZU5ld1VzZXJIb29rcyIsImRlZmF1bHRWYWxpZGF0ZU5ld1VzZXJIb29rIiwiYmluZCIsIl9kZWxldGVTYXZlZFRva2Vuc0ZvckFsbFVzZXJzT25TdGFydHVwIiwiX3NraXBDYXNlSW5zZW5zaXRpdmVDaGVja3NGb3JUZXN0IiwidXJscyIsInJlc2V0UGFzc3dvcmQiLCJ0b2tlbiIsImFic29sdXRlVXJsIiwidmVyaWZ5RW1haWwiLCJlbnJvbGxBY2NvdW50IiwiYWRkRGVmYXVsdFJhdGVMaW1pdCIsImN1cnJlbnRJbnZvY2F0aW9uIiwiX0N1cnJlbnRNZXRob2RJbnZvY2F0aW9uIiwiZ2V0IiwiX0N1cnJlbnRQdWJsaWNhdGlvbkludm9jYXRpb24iLCJ2YWxpZGF0ZUxvZ2luQXR0ZW1wdCIsInZhbGlkYXRlTmV3VXNlciIsInB1c2giLCJvbkNyZWF0ZVVzZXIiLCJfb25DcmVhdGVVc2VySG9vayIsIm9uRXh0ZXJuYWxMb2dpbiIsIl9vbkV4dGVybmFsTG9naW5Ib29rIiwiX3ZhbGlkYXRlTG9naW4iLCJhdHRlbXB0IiwiZWFjaCIsImNhbGxiYWNrIiwicmV0IiwiY2xvbmVBdHRlbXB0V2l0aENvbm5lY3Rpb24iLCJlIiwiYWxsb3dlZCIsImVycm9yIiwiX3N1Y2Nlc3NmdWxMb2dpbiIsIl9mYWlsZWRMb2dpbiIsIl9zdWNjZXNzZnVsTG9nb3V0IiwiX2xvZ2luVXNlciIsIm1ldGhvZEludm9jYXRpb24iLCJzdGFtcGVkTG9naW5Ub2tlbiIsIl9nZW5lcmF0ZVN0YW1wZWRMb2dpblRva2VuIiwiX2luc2VydExvZ2luVG9rZW4iLCJfbm9ZaWVsZHNBbGxvd2VkIiwiX3NldExvZ2luVG9rZW4iLCJfaGFzaExvZ2luVG9rZW4iLCJzZXRVc2VySWQiLCJpZCIsInRva2VuRXhwaXJlcyIsIl9hdHRlbXB0TG9naW4iLCJtZXRob2ROYW1lIiwibWV0aG9kQXJncyIsInJlc3VsdCIsInR5cGUiLCJtZXRob2RBcmd1bWVudHMiLCJBcnJheSIsImZyb20iLCJfbG9naW5NZXRob2QiLCJmbiIsInRyeUxvZ2luTWV0aG9kIiwiX3JlcG9ydExvZ2luRmFpbHVyZSIsInJlZ2lzdGVyTG9naW5IYW5kbGVyIiwiaGFuZGxlciIsIl9ydW5Mb2dpbkhhbmRsZXJzIiwiZGVzdHJveVRva2VuIiwibG9naW5Ub2tlbiIsInVwZGF0ZSIsIiRwdWxsIiwiJG9yIiwiaGFzaGVkVG9rZW4iLCJhY2NvdW50cyIsIm1ldGhvZHMiLCJsb2dpbiIsImNoZWNrIiwiYXJndW1lbnRzIiwibG9nb3V0IiwiX2dldExvZ2luVG9rZW4iLCJsb2dvdXRPdGhlckNsaWVudHMiLCJmaWVsZHMiLCJ0b2tlbnMiLCJzZXJ2aWNlcyIsInJlc3VtZSIsImxvZ2luVG9rZW5zIiwibmV3VG9rZW4iLCIkc2V0IiwiJHB1c2giLCJfaGFzaFN0YW1wZWRUb2tlbiIsInNldFRpbWVvdXQiLCJfZGVsZXRlU2F2ZWRUb2tlbnNGb3JVc2VyIiwiX25vQ29ubmVjdGlvbkNsb3NlRGVsYXlGb3JUZXN0IiwiZ2V0TmV3VG9rZW4iLCJjdXJyZW50SGFzaGVkVG9rZW4iLCJjdXJyZW50U3RhbXBlZFRva2VuIiwiZmluZCIsInN0YW1wZWRUb2tlbiIsIm5ld1N0YW1wZWRUb2tlbiIsInJlbW92ZU90aGVyVG9rZW5zIiwiY3VycmVudFRva2VuIiwiJG5lIiwiY29uZmlndXJlTG9naW5TZXJ2aWNlIiwiTWF0Y2giLCJPYmplY3RJbmNsdWRpbmciLCJzZXJ2aWNlIiwiU3RyaW5nIiwib2F1dGgiLCJzZXJ2aWNlTmFtZXMiLCJ1c2luZ09BdXRoRW5jcnlwdGlvbiIsInNlY3JldCIsInNlYWwiLCJpbnNlcnQiLCJvbkNvbm5lY3Rpb24iLCJvbkNsb3NlIiwiX3JlbW92ZVRva2VuRnJvbUNvbm5lY3Rpb24iLCJwdWJsaXNoIiwiaXNfYXV0byIsIl9pZCIsInByb2ZpbGUiLCJ1c2VybmFtZSIsImVtYWlscyIsImF1dG9wdWJsaXNoIiwidG9GaWVsZFNlbGVjdG9yIiwicmVkdWNlIiwicHJldiIsImZpZWxkIiwic2VsZWN0b3IiLCJhZGRBdXRvcHVibGlzaEZpZWxkcyIsIm9wdHMiLCJhcHBseSIsImZvckxvZ2dlZEluVXNlciIsImZvck90aGVyVXNlcnMiLCJfZ2V0QWNjb3VudERhdGEiLCJjb25uZWN0aW9uSWQiLCJkYXRhIiwiX3NldEFjY291bnREYXRhIiwidmFsdWUiLCJoYXNoIiwiY3JlYXRlSGFzaCIsImRpZ2VzdCIsImhhc2hlZFN0YW1wZWRUb2tlbiIsIl9pbnNlcnRIYXNoZWRMb2dpblRva2VuIiwicXVlcnkiLCIkYWRkVG9TZXQiLCJfY2xlYXJBbGxMb2dpblRva2VucyIsIl9nZXRVc2VyT2JzZXJ2ZSIsIm9ic2VydmUiLCJzdG9wIiwibXlPYnNlcnZlTnVtYmVyIiwiZGVmZXIiLCJmb3VuZE1hdGNoaW5nVXNlciIsIm9ic2VydmVDaGFuZ2VzIiwiYWRkZWQiLCJyZW1vdmVkIiwiY2xvc2UiLCJSYW5kb20iLCJfZXhwaXJlUGFzc3dvcmRSZXNldFRva2VucyIsIm9sZGVzdFZhbGlkRGF0ZSIsInRva2VuTGlmZXRpbWVNcyIsInRva2VuRmlsdGVyIiwiJGV4aXN0cyIsImV4cGlyZVBhc3N3b3JkVG9rZW4iLCJfZXhwaXJlUGFzc3dvcmRFbnJvbGxUb2tlbnMiLCJfZXhwaXJlVG9rZW5zIiwidXNlckZpbHRlciIsIiRsdCIsIm11bHRpIiwic3VwZXJSZXN1bHQiLCJleHBpcmVUb2tlbkludGVydmFsIiwiY2xlYXJJbnRlcnZhbCIsImluc2VydFVzZXJEb2MiLCJjcmVhdGVkQXQiLCJwaW5FbmNyeXB0ZWRGaWVsZHNUb1VzZXIiLCJmdWxsVXNlciIsImRlZmF1bHRDcmVhdGVVc2VySG9vayIsImhvb2siLCJlcnJtc2ciLCJfdGVzdEVtYWlsRG9tYWluIiwiZW1haWwiLCJkb21haW4iLCJyZXN0cmljdENyZWF0aW9uQnlFbWFpbERvbWFpbiIsIlJlZ0V4cCIsIl9lc2NhcGVSZWdFeHAiLCJ0ZXN0IiwidG9rZW5zVG9EZWxldGUiLCIkdW5zZXQiLCIkcHVsbEFsbCIsImxvZ2luVG9rZW5zVG9EZWxldGUiLCJ1cGRhdGVPckNyZWF0ZVVzZXJGcm9tRXh0ZXJuYWxTZXJ2aWNlIiwic2VydmljZU5hbWUiLCJzZXJ2aWNlRGF0YSIsInNlcnZpY2VJZEtleSIsImlzTmFOIiwicGFyc2VJbnQiLCJzZXRBdHRycyIsInJlbW92ZURlZmF1bHRSYXRlTGltaXQiLCJyZXNwIiwiRERQUmF0ZUxpbWl0ZXIiLCJyZW1vdmVSdWxlIiwiZGVmYXVsdFJhdGVMaW1pdGVyUnVsZUlkIiwiYWRkUnVsZSIsImNsaWVudEFkZHJlc3MiLCJjbG9uZWRBdHRlbXB0IiwiRUpTT04iLCJjbG9uZSIsImRlZmF1bHRSZXN1bWVMb2dpbkhhbmRsZXIiLCJvbGRVbmhhc2hlZFN0eWxlVG9rZW4iLCJyZXNldFJhbmdlT3IiLCJleHBpcmVGaWx0ZXIiLCIkYW5kIiwic2V0SW50ZXJ2YWwiLCJrZXlJc0xvYWRlZCIsImlzU2VhbGVkIiwib3BlbiIsImVtYWlsSXNHb29kIiwibGVuZ3RoIiwiYWRkcmVzcyIsImFsbG93IiwibW9kaWZpZXIiLCJmZXRjaCIsIl9lbnN1cmVJbmRleCIsInVuaXF1ZSIsInNwYXJzZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxNQUFNQSxPQUFPLEdBQUNDLE1BQWQ7QUFBcUJELE9BQU8sQ0FBQ0UsTUFBUixDQUFlO0FBQUNDLGdCQUFjLEVBQUMsTUFBSUE7QUFBcEIsQ0FBZjtBQUFvRCxJQUFJQSxjQUFKO0FBQW1CSCxPQUFPLENBQUNJLElBQVIsQ0FBYSxzQkFBYixFQUFvQztBQUFDRCxnQkFBYyxDQUFDRSxDQUFELEVBQUc7QUFBQ0Ysa0JBQWMsR0FBQ0UsQ0FBZjtBQUFpQjs7QUFBcEMsQ0FB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QUFUO0FBQVlDLFVBQU0sRUFBRTtBQUFwQixHQURGOztBQUVBNVQsT0FBSyxDQUFDMFQsWUFBTixDQUFtQixtQ0FBbkIsRUFDRTtBQUFDQyxVQUFNLEVBQUUsQ0FBVDtBQUFZQyxVQUFNLEVBQUU7QUFBcEIsR0FERixFQTlCb0MsQ0FnQ3BDO0FBQ0E7OztBQUNBNVQsT0FBSyxDQUFDMFQsWUFBTixDQUFtQix5Q0FBbkIsRUFDRTtBQUFFRSxVQUFNLEVBQUU7QUFBVixHQURGLEVBbENvQyxDQW9DcEM7OztBQUNBNVQsT0FBSyxDQUFDMFQsWUFBTixDQUFtQixrQ0FBbkIsRUFBdUQ7QUFBRUUsVUFBTSxFQUFFO0FBQVYsR0FBdkQsRUFyQ29DLENBc0NwQzs7O0FBQ0E1VCxPQUFLLENBQUMwVCxZQUFOLENBQW1CLDhCQUFuQixFQUFtRDtBQUFFRSxVQUFNLEVBQUU7QUFBVixHQUFuRDtBQUNELENBeENELEMiLCJmaWxlIjoiL3BhY2thZ2VzL2FjY291bnRzLWJhc2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBY2NvdW50c1NlcnZlciB9IGZyb20gXCIuL2FjY291bnRzX3NlcnZlci5qc1wiO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgQWNjb3VudHNcbiAqIEBzdW1tYXJ5IFRoZSBuYW1lc3BhY2UgZm9yIGFsbCBzZXJ2ZXItc2lkZSBhY2NvdW50cy1yZWxhdGVkIG1ldGhvZHMuXG4gKi9cbkFjY291bnRzID0gbmV3IEFjY291bnRzU2VydmVyKE1ldGVvci5zZXJ2ZXIpO1xuXG4vLyBVc2VycyB0YWJsZS4gRG9uJ3QgdXNlIHRoZSBub3JtYWwgYXV0b3B1Ymxpc2gsIHNpbmNlIHdlIHdhbnQgdG8gaGlkZVxuLy8gc29tZSBmaWVsZHMuIENvZGUgdG8gYXV0b3B1Ymxpc2ggdGhpcyBpcyBpbiBhY2NvdW50c19zZXJ2ZXIuanMuXG4vLyBYWFggQWxsb3cgdXNlcnMgdG8gY29uZmlndXJlIHRoaXMgY29sbGVjdGlvbiBuYW1lLlxuXG4vKipcbiAqIEBzdW1tYXJ5IEEgW01vbmdvLkNvbGxlY3Rpb25dKCNjb2xsZWN0aW9ucykgY29udGFpbmluZyB1c2VyIGRvY3VtZW50cy5cbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQHR5cGUge01vbmdvLkNvbGxlY3Rpb259XG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgbWV0ZW9yXG4qL1xuTWV0ZW9yLnVzZXJzID0gQWNjb3VudHMudXNlcnM7XG5cbmV4cG9ydCB7XG4gIC8vIFNpbmNlIHRoaXMgZmlsZSBpcyB0aGUgbWFpbiBtb2R1bGUgZm9yIHRoZSBzZXJ2ZXIgdmVyc2lvbiBvZiB0aGVcbiAgLy8gYWNjb3VudHMtYmFzZSBwYWNrYWdlLCBwcm9wZXJ0aWVzIG9mIG5vbi1lbnRyeS1wb2ludCBtb2R1bGVzIG5lZWQgdG9cbiAgLy8gYmUgcmUtZXhwb3J0ZWQgaW4gb3JkZXIgdG8gYmUgYWNjZXNzaWJsZSB0byBtb2R1bGVzIHRoYXQgaW1wb3J0IHRoZVxuICAvLyBhY2NvdW50cy1iYXNlIHBhY2thZ2UuXG4gIEFjY291bnRzU2VydmVyXG59O1xuIiwiLyoqXG4gKiBAc3VtbWFyeSBTdXBlci1jb25zdHJ1Y3RvciBmb3IgQWNjb3VudHNDbGllbnQgYW5kIEFjY291bnRzU2VydmVyLlxuICogQGxvY3VzIEFueXdoZXJlXG4gKiBAY2xhc3MgQWNjb3VudHNDb21tb25cbiAqIEBpbnN0YW5jZW5hbWUgYWNjb3VudHNDbGllbnRPclNlcnZlclxuICogQHBhcmFtIG9wdGlvbnMge09iamVjdH0gYW4gb2JqZWN0IHdpdGggZmllbGRzOlxuICogLSBjb25uZWN0aW9uIHtPYmplY3R9IE9wdGlvbmFsIEREUCBjb25uZWN0aW9uIHRvIHJldXNlLlxuICogLSBkZHBVcmwge1N0cmluZ30gT3B0aW9uYWwgVVJMIGZvciBjcmVhdGluZyBhIG5ldyBERFAgY29ubmVjdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEFjY291bnRzQ29tbW9uIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgIC8vIEN1cnJlbnRseSB0aGlzIGlzIHJlYWQgZGlyZWN0bHkgYnkgcGFja2FnZXMgbGlrZSBhY2NvdW50cy1wYXNzd29yZFxuICAgIC8vIGFuZCBhY2NvdW50cy11aS11bnN0eWxlZC5cbiAgICB0aGlzLl9vcHRpb25zID0ge307XG5cbiAgICAvLyBOb3RlIHRoYXQgc2V0dGluZyB0aGlzLmNvbm5lY3Rpb24gPSBudWxsIGNhdXNlcyB0aGlzLnVzZXJzIHRvIGJlIGFcbiAgICAvLyBMb2NhbENvbGxlY3Rpb24sIHdoaWNoIGlzIG5vdCB3aGF0IHdlIHdhbnQuXG4gICAgdGhpcy5jb25uZWN0aW9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX2luaXRDb25uZWN0aW9uKG9wdGlvbnMgfHwge30pO1xuXG4gICAgLy8gVGhlcmUgaXMgYW4gYWxsb3cgY2FsbCBpbiBhY2NvdW50c19zZXJ2ZXIuanMgdGhhdCByZXN0cmljdHMgd3JpdGVzIHRvXG4gICAgLy8gdGhpcyBjb2xsZWN0aW9uLlxuICAgIHRoaXMudXNlcnMgPSBuZXcgTW9uZ28uQ29sbGVjdGlvbihcInVzZXJzXCIsIHtcbiAgICAgIF9wcmV2ZW50QXV0b3B1Ymxpc2g6IHRydWUsXG4gICAgICBjb25uZWN0aW9uOiB0aGlzLmNvbm5lY3Rpb25cbiAgICB9KTtcblxuICAgIC8vIENhbGxiYWNrIGV4Y2VwdGlvbnMgYXJlIHByaW50ZWQgd2l0aCBNZXRlb3IuX2RlYnVnIGFuZCBpZ25vcmVkLlxuICAgIHRoaXMuX29uTG9naW5Ib29rID0gbmV3IEhvb2soe1xuICAgICAgYmluZEVudmlyb25tZW50OiBmYWxzZSxcbiAgICAgIGRlYnVnUHJpbnRFeGNlcHRpb25zOiBcIm9uTG9naW4gY2FsbGJhY2tcIlxuICAgIH0pO1xuXG4gICAgdGhpcy5fb25Mb2dpbkZhaWx1cmVIb29rID0gbmV3IEhvb2soe1xuICAgICAgYmluZEVudmlyb25tZW50OiBmYWxzZSxcbiAgICAgIGRlYnVnUHJpbnRFeGNlcHRpb25zOiBcIm9uTG9naW5GYWlsdXJlIGNhbGxiYWNrXCJcbiAgICB9KTtcblxuICAgIHRoaXMuX29uTG9nb3V0SG9vayA9IG5ldyBIb29rKHtcbiAgICAgIGJpbmRFbnZpcm9ubWVudDogZmFsc2UsXG4gICAgICBkZWJ1Z1ByaW50RXhjZXB0aW9uczogXCJvbkxvZ291dCBjYWxsYmFja1wiXG4gICAgfSk7XG5cbiAgICAvLyBFeHBvc2UgZm9yIHRlc3RpbmcuXG4gICAgdGhpcy5ERUZBVUxUX0xPR0lOX0VYUElSQVRJT05fREFZUyA9IERFRkFVTFRfTE9HSU5fRVhQSVJBVElPTl9EQVlTO1xuICAgIHRoaXMuTE9HSU5fVU5FWFBJUklOR19UT0tFTl9EQVlTID0gTE9HSU5fVU5FWFBJUklOR19UT0tFTl9EQVlTO1xuXG4gICAgLy8gVGhyb3duIHdoZW4gdGhlIHVzZXIgY2FuY2VscyB0aGUgbG9naW4gcHJvY2VzcyAoZWcsIGNsb3NlcyBhbiBvYXV0aFxuICAgIC8vIHBvcHVwLCBkZWNsaW5lcyByZXRpbmEgc2NhbiwgZXRjKVxuICAgIGNvbnN0IGxjZU5hbWUgPSAnQWNjb3VudHMuTG9naW5DYW5jZWxsZWRFcnJvcic7XG4gICAgdGhpcy5Mb2dpbkNhbmNlbGxlZEVycm9yID0gTWV0ZW9yLm1ha2VFcnJvclR5cGUoXG4gICAgICBsY2VOYW1lLFxuICAgICAgZnVuY3Rpb24gKGRlc2NyaXB0aW9uKSB7XG4gICAgICAgIHRoaXMubWVzc2FnZSA9IGRlc2NyaXB0aW9uO1xuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5Mb2dpbkNhbmNlbGxlZEVycm9yLnByb3RvdHlwZS5uYW1lID0gbGNlTmFtZTtcblxuICAgIC8vIFRoaXMgaXMgdXNlZCB0byB0cmFuc21pdCBzcGVjaWZpYyBzdWJjbGFzcyBlcnJvcnMgb3ZlciB0aGUgd2lyZS4gV2VcbiAgICAvLyBzaG91bGQgY29tZSB1cCB3aXRoIGEgbW9yZSBnZW5lcmljIHdheSB0byBkbyB0aGlzIChlZywgd2l0aCBzb21lIHNvcnQgb2ZcbiAgICAvLyBzeW1ib2xpYyBlcnJvciBjb2RlIHJhdGhlciB0aGFuIGEgbnVtYmVyKS5cbiAgICB0aGlzLkxvZ2luQ2FuY2VsbGVkRXJyb3IubnVtZXJpY0Vycm9yID0gMHg4YWNkYzJmO1xuXG4gICAgLy8gbG9naW5TZXJ2aWNlQ29uZmlndXJhdGlvbiBhbmQgQ29uZmlnRXJyb3IgYXJlIG1haW50YWluZWQgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gICAgTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuICAgICAgY29uc3QgeyBTZXJ2aWNlQ29uZmlndXJhdGlvbiB9ID0gUGFja2FnZVsnc2VydmljZS1jb25maWd1cmF0aW9uJ107XG4gICAgICB0aGlzLmxvZ2luU2VydmljZUNvbmZpZ3VyYXRpb24gPSBTZXJ2aWNlQ29uZmlndXJhdGlvbi5jb25maWd1cmF0aW9ucztcbiAgICAgIHRoaXMuQ29uZmlnRXJyb3IgPSBTZXJ2aWNlQ29uZmlndXJhdGlvbi5Db25maWdFcnJvcjtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBHZXQgdGhlIGN1cnJlbnQgdXNlciBpZCwgb3IgYG51bGxgIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLiBBIHJlYWN0aXZlIGRhdGEgc291cmNlLlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICovXG4gIHVzZXJJZCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1c2VySWQgbWV0aG9kIG5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBHZXQgdGhlIGN1cnJlbnQgdXNlciByZWNvcmQsIG9yIGBudWxsYCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbi4gQSByZWFjdGl2ZSBkYXRhIHNvdXJjZS5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqL1xuICB1c2VyKCkge1xuICAgIGNvbnN0IHVzZXJJZCA9IHRoaXMudXNlcklkKCk7XG4gICAgcmV0dXJuIHVzZXJJZCA/IHRoaXMudXNlcnMuZmluZE9uZSh1c2VySWQpIDogbnVsbDtcbiAgfVxuXG4gIC8vIFNldCB1cCBjb25maWcgZm9yIHRoZSBhY2NvdW50cyBzeXN0ZW0uIENhbGwgdGhpcyBvbiBib3RoIHRoZSBjbGllbnRcbiAgLy8gYW5kIHRoZSBzZXJ2ZXIuXG4gIC8vXG4gIC8vIE5vdGUgdGhhdCB0aGlzIG1ldGhvZCBnZXRzIG92ZXJyaWRkZW4gb24gQWNjb3VudHNTZXJ2ZXIucHJvdG90eXBlLCBidXRcbiAgLy8gdGhlIG92ZXJyaWRpbmcgbWV0aG9kIGNhbGxzIHRoZSBvdmVycmlkZGVuIG1ldGhvZC5cbiAgLy9cbiAgLy8gWFhYIHdlIHNob3VsZCBhZGQgc29tZSBlbmZvcmNlbWVudCB0aGF0IHRoaXMgaXMgY2FsbGVkIG9uIGJvdGggdGhlXG4gIC8vIGNsaWVudCBhbmQgdGhlIHNlcnZlci4gT3RoZXJ3aXNlLCBhIHVzZXIgY2FuXG4gIC8vICdmb3JiaWRDbGllbnRBY2NvdW50Q3JlYXRpb24nIG9ubHkgb24gdGhlIGNsaWVudCBhbmQgd2hpbGUgaXQgbG9va3NcbiAgLy8gbGlrZSB0aGVpciBhcHAgaXMgc2VjdXJlLCB0aGUgc2VydmVyIHdpbGwgc3RpbGwgYWNjZXB0IGNyZWF0ZVVzZXJcbiAgLy8gY2FsbHMuIGh0dHBzOi8vZ2l0aHViLmNvbS9tZXRlb3IvbWV0ZW9yL2lzc3Vlcy84MjhcbiAgLy9cbiAgLy8gQHBhcmFtIG9wdGlvbnMge09iamVjdH0gYW4gb2JqZWN0IHdpdGggZmllbGRzOlxuICAvLyAtIHNlbmRWZXJpZmljYXRpb25FbWFpbCB7Qm9vbGVhbn1cbiAgLy8gICAgIFNlbmQgZW1haWwgYWRkcmVzcyB2ZXJpZmljYXRpb24gZW1haWxzIHRvIG5ldyB1c2VycyBjcmVhdGVkIGZyb21cbiAgLy8gICAgIGNsaWVudCBzaWdudXBzLlxuICAvLyAtIGZvcmJpZENsaWVudEFjY291bnRDcmVhdGlvbiB7Qm9vbGVhbn1cbiAgLy8gICAgIERvIG5vdCBhbGxvdyBjbGllbnRzIHRvIGNyZWF0ZSBhY2NvdW50cyBkaXJlY3RseS5cbiAgLy8gLSByZXN0cmljdENyZWF0aW9uQnlFbWFpbERvbWFpbiB7RnVuY3Rpb24gb3IgU3RyaW5nfVxuICAvLyAgICAgUmVxdWlyZSBjcmVhdGVkIHVzZXJzIHRvIGhhdmUgYW4gZW1haWwgbWF0Y2hpbmcgdGhlIGZ1bmN0aW9uIG9yXG4gIC8vICAgICBoYXZpbmcgdGhlIHN0cmluZyBhcyBkb21haW4uXG4gIC8vIC0gbG9naW5FeHBpcmF0aW9uSW5EYXlzIHtOdW1iZXJ9XG4gIC8vICAgICBOdW1iZXIgb2YgZGF5cyBzaW5jZSBsb2dpbiB1bnRpbCBhIHVzZXIgaXMgbG9nZ2VkIG91dCAobG9naW4gdG9rZW5cbiAgLy8gICAgIGV4cGlyZXMpLlxuICAvLyAtIHBhc3N3b3JkUmVzZXRUb2tlbkV4cGlyYXRpb25JbkRheXMge051bWJlcn1cbiAgLy8gICAgIE51bWJlciBvZiBkYXlzIHNpbmNlIHBhc3N3b3JkIHJlc2V0IHRva2VuIGNyZWF0aW9uIHVudGlsIHRoZVxuICAvLyAgICAgdG9rZW4gY2FubnQgYmUgdXNlZCBhbnkgbG9uZ2VyIChwYXNzd29yZCByZXNldCB0b2tlbiBleHBpcmVzKS5cbiAgLy8gLSBhbWJpZ3VvdXNFcnJvck1lc3NhZ2VzIHtCb29sZWFufVxuICAvLyAgICAgUmV0dXJuIGFtYmlndW91cyBlcnJvciBtZXNzYWdlcyBmcm9tIGxvZ2luIGZhaWx1cmVzIHRvIHByZXZlbnRcbiAgLy8gICAgIHVzZXIgZW51bWVyYXRpb24uXG4gIC8vIC0gYmNyeXB0Um91bmRzIHtOdW1iZXJ9XG4gIC8vICAgICBBbGxvd3Mgb3ZlcnJpZGUgb2YgbnVtYmVyIG9mIGJjcnlwdCByb3VuZHMgKGFrYSB3b3JrIGZhY3RvcikgdXNlZFxuICAvLyAgICAgdG8gc3RvcmUgcGFzc3dvcmRzLlxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBTZXQgZ2xvYmFsIGFjY291bnRzIG9wdGlvbnMuXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgKiBAcGFyYW0ge0Jvb2xlYW59IG9wdGlvbnMuc2VuZFZlcmlmaWNhdGlvbkVtYWlsIE5ldyB1c2VycyB3aXRoIGFuIGVtYWlsIGFkZHJlc3Mgd2lsbCByZWNlaXZlIGFuIGFkZHJlc3MgdmVyaWZpY2F0aW9uIGVtYWlsLlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IG9wdGlvbnMuZm9yYmlkQ2xpZW50QWNjb3VudENyZWF0aW9uIENhbGxzIHRvIFtgY3JlYXRlVXNlcmBdKCNhY2NvdW50c19jcmVhdGV1c2VyKSBmcm9tIHRoZSBjbGllbnQgd2lsbCBiZSByZWplY3RlZC4gSW4gYWRkaXRpb24sIGlmIHlvdSBhcmUgdXNpbmcgW2FjY291bnRzLXVpXSgjYWNjb3VudHN1aSksIHRoZSBcIkNyZWF0ZSBhY2NvdW50XCIgbGluayB3aWxsIG5vdCBiZSBhdmFpbGFibGUuXG4gICAqIEBwYXJhbSB7U3RyaW5nIHwgRnVuY3Rpb259IG9wdGlvbnMucmVzdHJpY3RDcmVhdGlvbkJ5RW1haWxEb21haW4gSWYgc2V0IHRvIGEgc3RyaW5nLCBvbmx5IGFsbG93cyBuZXcgdXNlcnMgaWYgdGhlIGRvbWFpbiBwYXJ0IG9mIHRoZWlyIGVtYWlsIGFkZHJlc3MgbWF0Y2hlcyB0aGUgc3RyaW5nLiBJZiBzZXQgdG8gYSBmdW5jdGlvbiwgb25seSBhbGxvd3MgbmV3IHVzZXJzIGlmIHRoZSBmdW5jdGlvbiByZXR1cm5zIHRydWUuICBUaGUgZnVuY3Rpb24gaXMgcGFzc2VkIHRoZSBmdWxsIGVtYWlsIGFkZHJlc3Mgb2YgdGhlIHByb3Bvc2VkIG5ldyB1c2VyLiAgV29ya3Mgd2l0aCBwYXNzd29yZC1iYXNlZCBzaWduLWluIGFuZCBleHRlcm5hbCBzZXJ2aWNlcyB0aGF0IGV4cG9zZSBlbWFpbCBhZGRyZXNzZXMgKEdvb2dsZSwgRmFjZWJvb2ssIEdpdEh1YikuIEFsbCBleGlzdGluZyB1c2VycyBzdGlsbCBjYW4gbG9nIGluIGFmdGVyIGVuYWJsaW5nIHRoaXMgb3B0aW9uLiBFeGFtcGxlOiBgQWNjb3VudHMuY29uZmlnKHsgcmVzdHJpY3RDcmVhdGlvbkJ5RW1haWxEb21haW46ICdzY2hvb2wuZWR1JyB9KWAuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBvcHRpb25zLmxvZ2luRXhwaXJhdGlvbkluRGF5cyBUaGUgbnVtYmVyIG9mIGRheXMgZnJvbSB3aGVuIGEgdXNlciBsb2dzIGluIHVudGlsIHRoZWlyIHRva2VuIGV4cGlyZXMgYW5kIHRoZXkgYXJlIGxvZ2dlZCBvdXQuIERlZmF1bHRzIHRvIDkwLiBTZXQgdG8gYG51bGxgIHRvIGRpc2FibGUgbG9naW4gZXhwaXJhdGlvbi5cbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdGlvbnMub2F1dGhTZWNyZXRLZXkgV2hlbiB1c2luZyB0aGUgYG9hdXRoLWVuY3J5cHRpb25gIHBhY2thZ2UsIHRoZSAxNiBieXRlIGtleSB1c2luZyB0byBlbmNyeXB0IHNlbnNpdGl2ZSBhY2NvdW50IGNyZWRlbnRpYWxzIGluIHRoZSBkYXRhYmFzZSwgZW5jb2RlZCBpbiBiYXNlNjQuICBUaGlzIG9wdGlvbiBtYXkgb25seSBiZSBzcGVjaWZlZCBvbiB0aGUgc2VydmVyLiAgU2VlIHBhY2thZ2VzL29hdXRoLWVuY3J5cHRpb24vUkVBRE1FLm1kIGZvciBkZXRhaWxzLlxuICAgKiBAcGFyYW0ge051bWJlcn0gb3B0aW9ucy5wYXNzd29yZFJlc2V0VG9rZW5FeHBpcmF0aW9uSW5EYXlzIFRoZSBudW1iZXIgb2YgZGF5cyBmcm9tIHdoZW4gYSBsaW5rIHRvIHJlc2V0IHBhc3N3b3JkIGlzIHNlbnQgdW50aWwgdG9rZW4gZXhwaXJlcyBhbmQgdXNlciBjYW4ndCByZXNldCBwYXNzd29yZCB3aXRoIHRoZSBsaW5rIGFueW1vcmUuIERlZmF1bHRzIHRvIDMuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBvcHRpb25zLnBhc3N3b3JkRW5yb2xsVG9rZW5FeHBpcmF0aW9uSW5EYXlzIFRoZSBudW1iZXIgb2YgZGF5cyBmcm9tIHdoZW4gYSBsaW5rIHRvIHNldCBpbml0YWwgcGFzc3dvcmQgaXMgc2VudCB1bnRpbCB0b2tlbiBleHBpcmVzIGFuZCB1c2VyIGNhbid0IHNldCBwYXNzd29yZCB3aXRoIHRoZSBsaW5rIGFueW1vcmUuIERlZmF1bHRzIHRvIDMwLlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IG9wdGlvbnMuYW1iaWd1b3VzRXJyb3JNZXNzYWdlcyBSZXR1cm4gYW1iaWd1b3VzIGVycm9yIG1lc3NhZ2VzIGZyb20gbG9naW4gZmFpbHVyZXMgdG8gcHJldmVudCB1c2VyIGVudW1lcmF0aW9uLiBEZWZhdWx0cyB0byBmYWxzZS5cbiAgICovXG4gIGNvbmZpZyhvcHRpb25zKSB7XG4gICAgLy8gV2UgZG9uJ3Qgd2FudCB1c2VycyB0byBhY2NpZGVudGFsbHkgb25seSBjYWxsIEFjY291bnRzLmNvbmZpZyBvbiB0aGVcbiAgICAvLyBjbGllbnQsIHdoZXJlIHNvbWUgb2YgdGhlIG9wdGlvbnMgd2lsbCBoYXZlIHBhcnRpYWwgZWZmZWN0cyAoZWcgcmVtb3ZpbmdcbiAgICAvLyB0aGUgXCJjcmVhdGUgYWNjb3VudFwiIGJ1dHRvbiBmcm9tIGFjY291bnRzLXVpIGlmIGZvcmJpZENsaWVudEFjY291bnRDcmVhdGlvblxuICAgIC8vIGlzIHNldCwgb3IgcmVkaXJlY3RpbmcgR29vZ2xlIGxvZ2luIHRvIGEgc3BlY2lmaWMtZG9tYWluIHBhZ2UpIHdpdGhvdXRcbiAgICAvLyBoYXZpbmcgdGhlaXIgZnVsbCBlZmZlY3RzLlxuICAgIGlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcbiAgICAgIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uYWNjb3VudHNDb25maWdDYWxsZWQgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAoIV9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uYWNjb3VudHNDb25maWdDYWxsZWQpIHtcbiAgICAgIC8vIFhYWCB3b3VsZCBiZSBuaWNlIHRvIFwiY3Jhc2hcIiB0aGUgY2xpZW50IGFuZCByZXBsYWNlIHRoZSBVSSB3aXRoIGFuIGVycm9yXG4gICAgICAvLyBtZXNzYWdlLCBidXQgdGhlcmUncyBubyB0cml2aWFsIHdheSB0byBkbyB0aGlzLlxuICAgICAgTWV0ZW9yLl9kZWJ1ZyhcIkFjY291bnRzLmNvbmZpZyB3YXMgY2FsbGVkIG9uIHRoZSBjbGllbnQgYnV0IG5vdCBvbiB0aGUgXCIgK1xuICAgICAgICAgICAgICAgICAgICBcInNlcnZlcjsgc29tZSBjb25maWd1cmF0aW9uIG9wdGlvbnMgbWF5IG5vdCB0YWtlIGVmZmVjdC5cIik7XG4gICAgfVxuXG4gICAgLy8gV2UgbmVlZCB0byB2YWxpZGF0ZSB0aGUgb2F1dGhTZWNyZXRLZXkgb3B0aW9uIGF0IHRoZSB0aW1lXG4gICAgLy8gQWNjb3VudHMuY29uZmlnIGlzIGNhbGxlZC4gV2UgYWxzbyBkZWxpYmVyYXRlbHkgZG9uJ3Qgc3RvcmUgdGhlXG4gICAgLy8gb2F1dGhTZWNyZXRLZXkgaW4gQWNjb3VudHMuX29wdGlvbnMuXG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvcHRpb25zLCAnb2F1dGhTZWNyZXRLZXknKSkge1xuICAgICAgaWYgKE1ldGVvci5pc0NsaWVudCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgb2F1dGhTZWNyZXRLZXkgb3B0aW9uIG1heSBvbmx5IGJlIHNwZWNpZmllZCBvbiB0aGUgc2VydmVyXCIpO1xuICAgICAgfVxuICAgICAgaWYgKCEgUGFja2FnZVtcIm9hdXRoLWVuY3J5cHRpb25cIl0pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIG9hdXRoLWVuY3J5cHRpb24gcGFja2FnZSBtdXN0IGJlIGxvYWRlZCB0byBzZXQgb2F1dGhTZWNyZXRLZXlcIik7XG4gICAgICB9XG4gICAgICBQYWNrYWdlW1wib2F1dGgtZW5jcnlwdGlvblwiXS5PQXV0aEVuY3J5cHRpb24ubG9hZEtleShvcHRpb25zLm9hdXRoU2VjcmV0S2V5KTtcbiAgICAgIG9wdGlvbnMgPSB7IC4uLm9wdGlvbnMgfTtcbiAgICAgIGRlbGV0ZSBvcHRpb25zLm9hdXRoU2VjcmV0S2V5O1xuICAgIH1cblxuICAgIC8vIHZhbGlkYXRlIG9wdGlvbiBrZXlzXG4gICAgY29uc3QgVkFMSURfS0VZUyA9IFtcInNlbmRWZXJpZmljYXRpb25FbWFpbFwiLCBcImZvcmJpZENsaWVudEFjY291bnRDcmVhdGlvblwiLCBcInBhc3N3b3JkRW5yb2xsVG9rZW5FeHBpcmF0aW9uSW5EYXlzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgXCJyZXN0cmljdENyZWF0aW9uQnlFbWFpbERvbWFpblwiLCBcImxvZ2luRXhwaXJhdGlvbkluRGF5c1wiLCBcInBhc3N3b3JkUmVzZXRUb2tlbkV4cGlyYXRpb25JbkRheXNcIixcbiAgICAgICAgICAgICAgICAgICAgICBcImFtYmlndW91c0Vycm9yTWVzc2FnZXNcIiwgXCJiY3J5cHRSb3VuZHNcIl07XG4gICAgT2JqZWN0LmtleXMob3B0aW9ucykuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgaWYgKCFWQUxJRF9LRVlTLmluY2x1ZGVzKGtleSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBY2NvdW50cy5jb25maWc6IEludmFsaWQga2V5OiAke2tleX1gKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIHNldCB2YWx1ZXMgaW4gQWNjb3VudHMuX29wdGlvbnNcbiAgICBWQUxJRF9LRVlTLmZvckVhY2goa2V5ID0+IHtcbiAgICAgIGlmIChrZXkgaW4gb3B0aW9ucykge1xuICAgICAgICBpZiAoa2V5IGluIHRoaXMuX29wdGlvbnMpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbid0IHNldCBcXGAke2tleX1cXGAgbW9yZSB0aGFuIG9uY2VgKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9vcHRpb25zW2tleV0gPSBvcHRpb25zW2tleV07XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQHN1bW1hcnkgUmVnaXN0ZXIgYSBjYWxsYmFjayB0byBiZSBjYWxsZWQgYWZ0ZXIgYSBsb2dpbiBhdHRlbXB0IHN1Y2NlZWRzLlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gbG9naW4gaXMgc3VjY2Vzc2Z1bC5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICBUaGUgY2FsbGJhY2sgcmVjZWl2ZXMgYSBzaW5nbGUgb2JqZWN0IHRoYXRcbiAgICogICAgICAgICAgICAgICAgICAgICAgICBob2xkcyBsb2dpbiBkZXRhaWxzLiBUaGlzIG9iamVjdCBjb250YWlucyB0aGUgbG9naW5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgdHlwZSAocGFzc3dvcmQsIHJlc3VtZSwgZXRjLikgb24gYm90aCB0aGVcbiAgICogICAgICAgICAgICAgICAgICAgICAgICBjbGllbnQgYW5kIHNlcnZlci4gYG9uTG9naW5gIGNhbGxiYWNrcyByZWdpc3RlcmVkXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgb24gdGhlIHNlcnZlciBhbHNvIHJlY2VpdmUgZXh0cmEgZGF0YSwgc3VjaFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgIGFzIHVzZXIgZGV0YWlscywgY29ubmVjdGlvbiBpbmZvcm1hdGlvbiwgZXRjLlxuICAgKi9cbiAgb25Mb2dpbihmdW5jKSB7XG4gICAgcmV0dXJuIHRoaXMuX29uTG9naW5Ib29rLnJlZ2lzdGVyKGZ1bmMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIGFmdGVyIGEgbG9naW4gYXR0ZW1wdCBmYWlscy5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCBhZnRlciB0aGUgbG9naW4gaGFzIGZhaWxlZC5cbiAgICovXG4gIG9uTG9naW5GYWlsdXJlKGZ1bmMpIHtcbiAgICByZXR1cm4gdGhpcy5fb25Mb2dpbkZhaWx1cmVIb29rLnJlZ2lzdGVyKGZ1bmMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIGFmdGVyIGEgbG9nb3V0IGF0dGVtcHQgc3VjY2VlZHMuXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBjYWxsYmFjayB0byBiZSBjYWxsZWQgd2hlbiBsb2dvdXQgaXMgc3VjY2Vzc2Z1bC5cbiAgICovXG4gIG9uTG9nb3V0KGZ1bmMpIHtcbiAgICByZXR1cm4gdGhpcy5fb25Mb2dvdXRIb29rLnJlZ2lzdGVyKGZ1bmMpO1xuICB9XG5cbiAgX2luaXRDb25uZWN0aW9uKG9wdGlvbnMpIHtcbiAgICBpZiAoISBNZXRlb3IuaXNDbGllbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBUaGUgY29ubmVjdGlvbiB1c2VkIGJ5IHRoZSBBY2NvdW50cyBzeXN0ZW0uIFRoaXMgaXMgdGhlIGNvbm5lY3Rpb25cbiAgICAvLyB0aGF0IHdpbGwgZ2V0IGxvZ2dlZCBpbiBieSBNZXRlb3IubG9naW4oKSwgYW5kIHRoaXMgaXMgdGhlXG4gICAgLy8gY29ubmVjdGlvbiB3aG9zZSBsb2dpbiBzdGF0ZSB3aWxsIGJlIHJlZmxlY3RlZCBieSBNZXRlb3IudXNlcklkKCkuXG4gICAgLy9cbiAgICAvLyBJdCB3b3VsZCBiZSBtdWNoIHByZWZlcmFibGUgZm9yIHRoaXMgdG8gYmUgaW4gYWNjb3VudHNfY2xpZW50LmpzLFxuICAgIC8vIGJ1dCBpdCBoYXMgdG8gYmUgaGVyZSBiZWNhdXNlIGl0J3MgbmVlZGVkIHRvIGNyZWF0ZSB0aGVcbiAgICAvLyBNZXRlb3IudXNlcnMgY29sbGVjdGlvbi5cbiAgICBpZiAob3B0aW9ucy5jb25uZWN0aW9uKSB7XG4gICAgICB0aGlzLmNvbm5lY3Rpb24gPSBvcHRpb25zLmNvbm5lY3Rpb247XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLmRkcFVybCkge1xuICAgICAgdGhpcy5jb25uZWN0aW9uID0gRERQLmNvbm5lY3Qob3B0aW9ucy5kZHBVcmwpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18gIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgICAgICAgIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uQUNDT1VOVFNfQ09OTkVDVElPTl9VUkwpIHtcbiAgICAgIC8vIFRlbXBvcmFyeSwgaW50ZXJuYWwgaG9vayB0byBhbGxvdyB0aGUgc2VydmVyIHRvIHBvaW50IHRoZSBjbGllbnRcbiAgICAgIC8vIHRvIGEgZGlmZmVyZW50IGF1dGhlbnRpY2F0aW9uIHNlcnZlci4gVGhpcyBpcyBmb3IgYSB2ZXJ5XG4gICAgICAvLyBwYXJ0aWN1bGFyIHVzZSBjYXNlIHRoYXQgY29tZXMgdXAgd2hlbiBpbXBsZW1lbnRpbmcgYSBvYXV0aFxuICAgICAgLy8gc2VydmVyLiBVbnN1cHBvcnRlZCBhbmQgbWF5IGdvIGF3YXkgYXQgYW55IHBvaW50IGluIHRpbWUuXG4gICAgICAvL1xuICAgICAgLy8gV2Ugd2lsbCBldmVudHVhbGx5IHByb3ZpZGUgYSBnZW5lcmFsIHdheSB0byB1c2UgYWNjb3VudC1iYXNlXG4gICAgICAvLyBhZ2FpbnN0IGFueSBERFAgY29ubmVjdGlvbiwgbm90IGp1c3Qgb25lIHNwZWNpYWwgb25lLlxuICAgICAgdGhpcy5jb25uZWN0aW9uID1cbiAgICAgICAgRERQLmNvbm5lY3QoX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5BQ0NPVU5UU19DT05ORUNUSU9OX1VSTCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY29ubmVjdGlvbiA9IE1ldGVvci5jb25uZWN0aW9uO1xuICAgIH1cbiAgfVxuXG4gIF9nZXRUb2tlbkxpZmV0aW1lTXMoKSB7XG4gICAgLy8gV2hlbiBsb2dpbkV4cGlyYXRpb25JbkRheXMgaXMgc2V0IHRvIG51bGwsIHdlJ2xsIHVzZSBhIHJlYWxseSBoaWdoXG4gICAgLy8gbnVtYmVyIG9mIGRheXMgKExPR0lOX1VORVhQSVJBQkxFX1RPS0VOX0RBWVMpIHRvIHNpbXVsYXRlIGFuXG4gICAgLy8gdW5leHBpcmluZyB0b2tlbi5cbiAgICBjb25zdCBsb2dpbkV4cGlyYXRpb25JbkRheXMgPVxuICAgICAgKHRoaXMuX29wdGlvbnMubG9naW5FeHBpcmF0aW9uSW5EYXlzID09PSBudWxsKVxuICAgICAgICA/IExPR0lOX1VORVhQSVJJTkdfVE9LRU5fREFZU1xuICAgICAgICA6IHRoaXMuX29wdGlvbnMubG9naW5FeHBpcmF0aW9uSW5EYXlzO1xuICAgIHJldHVybiAobG9naW5FeHBpcmF0aW9uSW5EYXlzXG4gICAgICAgIHx8IERFRkFVTFRfTE9HSU5fRVhQSVJBVElPTl9EQVlTKSAqIDI0ICogNjAgKiA2MCAqIDEwMDA7XG4gIH1cblxuICBfZ2V0UGFzc3dvcmRSZXNldFRva2VuTGlmZXRpbWVNcygpIHtcbiAgICByZXR1cm4gKHRoaXMuX29wdGlvbnMucGFzc3dvcmRSZXNldFRva2VuRXhwaXJhdGlvbkluRGF5cyB8fFxuICAgICAgICAgICAgREVGQVVMVF9QQVNTV09SRF9SRVNFVF9UT0tFTl9FWFBJUkFUSU9OX0RBWVMpICogMjQgKiA2MCAqIDYwICogMTAwMDtcbiAgfVxuXG4gIF9nZXRQYXNzd29yZEVucm9sbFRva2VuTGlmZXRpbWVNcygpIHtcbiAgICByZXR1cm4gKHRoaXMuX29wdGlvbnMucGFzc3dvcmRFbnJvbGxUb2tlbkV4cGlyYXRpb25JbkRheXMgfHxcbiAgICAgICAgREVGQVVMVF9QQVNTV09SRF9FTlJPTExfVE9LRU5fRVhQSVJBVElPTl9EQVlTKSAqIDI0ICogNjAgKiA2MCAqIDEwMDA7XG4gIH1cblxuICBfdG9rZW5FeHBpcmF0aW9uKHdoZW4pIHtcbiAgICAvLyBXZSBwYXNzIHdoZW4gdGhyb3VnaCB0aGUgRGF0ZSBjb25zdHJ1Y3RvciBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHk7XG4gICAgLy8gYHdoZW5gIHVzZWQgdG8gYmUgYSBudW1iZXIuXG4gICAgcmV0dXJuIG5ldyBEYXRlKChuZXcgRGF0ZSh3aGVuKSkuZ2V0VGltZSgpICsgdGhpcy5fZ2V0VG9rZW5MaWZldGltZU1zKCkpO1xuICB9XG5cbiAgX3Rva2VuRXhwaXJlc1Nvb24od2hlbikge1xuICAgIGxldCBtaW5MaWZldGltZU1zID0gLjEgKiB0aGlzLl9nZXRUb2tlbkxpZmV0aW1lTXMoKTtcbiAgICBjb25zdCBtaW5MaWZldGltZUNhcE1zID0gTUlOX1RPS0VOX0xJRkVUSU1FX0NBUF9TRUNTICogMTAwMDtcbiAgICBpZiAobWluTGlmZXRpbWVNcyA+IG1pbkxpZmV0aW1lQ2FwTXMpIHtcbiAgICAgIG1pbkxpZmV0aW1lTXMgPSBtaW5MaWZldGltZUNhcE1zO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IERhdGUoKSA+IChuZXcgRGF0ZSh3aGVuKSAtIG1pbkxpZmV0aW1lTXMpO1xuICB9XG59XG5cbi8vIE5vdGUgdGhhdCBBY2NvdW50cyBpcyBkZWZpbmVkIHNlcGFyYXRlbHkgaW4gYWNjb3VudHNfY2xpZW50LmpzIGFuZFxuLy8gYWNjb3VudHNfc2VydmVyLmpzLlxuXG4vKipcbiAqIEBzdW1tYXJ5IEdldCB0aGUgY3VycmVudCB1c2VyIGlkLCBvciBgbnVsbGAgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4uIEEgcmVhY3RpdmUgZGF0YSBzb3VyY2UuXG4gKiBAbG9jdXMgQW55d2hlcmUgYnV0IHB1Ymxpc2ggZnVuY3Rpb25zXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgbWV0ZW9yXG4gKi9cbk1ldGVvci51c2VySWQgPSAoKSA9PiBBY2NvdW50cy51c2VySWQoKTtcblxuLyoqXG4gKiBAc3VtbWFyeSBHZXQgdGhlIGN1cnJlbnQgdXNlciByZWNvcmQsIG9yIGBudWxsYCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbi4gQSByZWFjdGl2ZSBkYXRhIHNvdXJjZS5cbiAqIEBsb2N1cyBBbnl3aGVyZSBidXQgcHVibGlzaCBmdW5jdGlvbnNcbiAqIEBpbXBvcnRGcm9tUGFja2FnZSBtZXRlb3JcbiAqL1xuTWV0ZW9yLnVzZXIgPSAoKSA9PiBBY2NvdW50cy51c2VyKCk7XG5cbi8vIGhvdyBsb25nIChpbiBkYXlzKSB1bnRpbCBhIGxvZ2luIHRva2VuIGV4cGlyZXNcbmNvbnN0IERFRkFVTFRfTE9HSU5fRVhQSVJBVElPTl9EQVlTID0gOTA7XG4vLyBob3cgbG9uZyAoaW4gZGF5cykgdW50aWwgcmVzZXQgcGFzc3dvcmQgdG9rZW4gZXhwaXJlc1xuY29uc3QgREVGQVVMVF9QQVNTV09SRF9SRVNFVF9UT0tFTl9FWFBJUkFUSU9OX0RBWVMgPSAzO1xuLy8gaG93IGxvbmcgKGluIGRheXMpIHVudGlsIGVucm9sIHBhc3N3b3JkIHRva2VuIGV4cGlyZXNcbmNvbnN0IERFRkFVTFRfUEFTU1dPUkRfRU5ST0xMX1RPS0VOX0VYUElSQVRJT05fREFZUyA9IDMwO1xuLy8gQ2xpZW50cyBkb24ndCB0cnkgdG8gYXV0by1sb2dpbiB3aXRoIGEgdG9rZW4gdGhhdCBpcyBnb2luZyB0byBleHBpcmUgd2l0aGluXG4vLyAuMSAqIERFRkFVTFRfTE9HSU5fRVhQSVJBVElPTl9EQVlTLCBjYXBwZWQgYXQgTUlOX1RPS0VOX0xJRkVUSU1FX0NBUF9TRUNTLlxuLy8gVHJpZXMgdG8gYXZvaWQgYWJydXB0IGRpc2Nvbm5lY3RzIGZyb20gZXhwaXJpbmcgdG9rZW5zLlxuY29uc3QgTUlOX1RPS0VOX0xJRkVUSU1FX0NBUF9TRUNTID0gMzYwMDsgLy8gb25lIGhvdXJcbi8vIGhvdyBvZnRlbiAoaW4gbWlsbGlzZWNvbmRzKSB3ZSBjaGVjayBmb3IgZXhwaXJlZCB0b2tlbnNcbmV4cG9ydCBjb25zdCBFWFBJUkVfVE9LRU5TX0lOVEVSVkFMX01TID0gNjAwICogMTAwMDsgLy8gMTAgbWludXRlc1xuLy8gaG93IGxvbmcgd2Ugd2FpdCBiZWZvcmUgbG9nZ2luZyBvdXQgY2xpZW50cyB3aGVuIE1ldGVvci5sb2dvdXRPdGhlckNsaWVudHMgaXNcbi8vIGNhbGxlZFxuZXhwb3J0IGNvbnN0IENPTk5FQ1RJT05fQ0xPU0VfREVMQVlfTVMgPSAxMCAqIDEwMDA7XG4vLyBBIGxhcmdlIG51bWJlciBvZiBleHBpcmF0aW9uIGRheXMgKGFwcHJveGltYXRlbHkgMTAwIHllYXJzIHdvcnRoKSB0aGF0IGlzXG4vLyB1c2VkIHdoZW4gY3JlYXRpbmcgdW5leHBpcmluZyB0b2tlbnMuXG5jb25zdCBMT0dJTl9VTkVYUElSSU5HX1RPS0VOX0RBWVMgPSAzNjUgKiAxMDA7XG4iLCJpbXBvcnQgY3J5cHRvIGZyb20gJ2NyeXB0byc7XG5pbXBvcnQge1xuICBBY2NvdW50c0NvbW1vbixcbiAgRVhQSVJFX1RPS0VOU19JTlRFUlZBTF9NUyxcbiAgQ09OTkVDVElPTl9DTE9TRV9ERUxBWV9NU1xufSBmcm9tICcuL2FjY291bnRzX2NvbW1vbi5qcyc7XG5cbmNvbnN0IGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogQHN1bW1hcnkgQ29uc3RydWN0b3IgZm9yIHRoZSBgQWNjb3VudHNgIG5hbWVzcGFjZSBvbiB0aGUgc2VydmVyLlxuICogQGxvY3VzIFNlcnZlclxuICogQGNsYXNzIEFjY291bnRzU2VydmVyXG4gKiBAZXh0ZW5kcyBBY2NvdW50c0NvbW1vblxuICogQGluc3RhbmNlbmFtZSBhY2NvdW50c1NlcnZlclxuICogQHBhcmFtIHtPYmplY3R9IHNlcnZlciBBIHNlcnZlciBvYmplY3Qgc3VjaCBhcyBgTWV0ZW9yLnNlcnZlcmAuXG4gKi9cbmV4cG9ydCBjbGFzcyBBY2NvdW50c1NlcnZlciBleHRlbmRzIEFjY291bnRzQ29tbW9uIHtcbiAgLy8gTm90ZSB0aGF0IHRoaXMgY29uc3RydWN0b3IgaXMgbGVzcyBsaWtlbHkgdG8gYmUgaW5zdGFudGlhdGVkIG11bHRpcGxlXG4gIC8vIHRpbWVzIHRoYW4gdGhlIGBBY2NvdW50c0NsaWVudGAgY29uc3RydWN0b3IsIGJlY2F1c2UgYSBzaW5nbGUgc2VydmVyXG4gIC8vIGNhbiBwcm92aWRlIG9ubHkgb25lIHNldCBvZiBtZXRob2RzLlxuICBjb25zdHJ1Y3RvcihzZXJ2ZXIpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5fc2VydmVyID0gc2VydmVyIHx8IE1ldGVvci5zZXJ2ZXI7XG4gICAgLy8gU2V0IHVwIHRoZSBzZXJ2ZXIncyBtZXRob2RzLCBhcyBpZiBieSBjYWxsaW5nIE1ldGVvci5tZXRob2RzLlxuICAgIHRoaXMuX2luaXRTZXJ2ZXJNZXRob2RzKCk7XG5cbiAgICB0aGlzLl9pbml0QWNjb3VudERhdGFIb29rcygpO1xuXG4gICAgLy8gSWYgYXV0b3B1Ymxpc2ggaXMgb24sIHB1Ymxpc2ggdGhlc2UgdXNlciBmaWVsZHMuIExvZ2luIHNlcnZpY2VcbiAgICAvLyBwYWNrYWdlcyAoZWcgYWNjb3VudHMtZ29vZ2xlKSBhZGQgdG8gdGhlc2UgYnkgY2FsbGluZ1xuICAgIC8vIGFkZEF1dG9wdWJsaXNoRmllbGRzLiAgTm90YWJseSwgdGhpcyBpc24ndCBpbXBsZW1lbnRlZCB3aXRoIG11bHRpcGxlXG4gICAgLy8gcHVibGlzaGVzIHNpbmNlIEREUCBvbmx5IG1lcmdlcyBvbmx5IGFjcm9zcyB0b3AtbGV2ZWwgZmllbGRzLCBub3RcbiAgICAvLyBzdWJmaWVsZHMgKHN1Y2ggYXMgJ3NlcnZpY2VzLmZhY2Vib29rLmFjY2Vzc1Rva2VuJylcbiAgICB0aGlzLl9hdXRvcHVibGlzaEZpZWxkcyA9IHtcbiAgICAgIGxvZ2dlZEluVXNlcjogWydwcm9maWxlJywgJ3VzZXJuYW1lJywgJ2VtYWlscyddLFxuICAgICAgb3RoZXJVc2VyczogWydwcm9maWxlJywgJ3VzZXJuYW1lJ11cbiAgICB9O1xuICAgIHRoaXMuX2luaXRTZXJ2ZXJQdWJsaWNhdGlvbnMoKTtcblxuICAgIC8vIGNvbm5lY3Rpb25JZCAtPiB7Y29ubmVjdGlvbiwgbG9naW5Ub2tlbn1cbiAgICB0aGlzLl9hY2NvdW50RGF0YSA9IHt9O1xuXG4gICAgLy8gY29ubmVjdGlvbiBpZCAtPiBvYnNlcnZlIGhhbmRsZSBmb3IgdGhlIGxvZ2luIHRva2VuIHRoYXQgdGhpcyBjb25uZWN0aW9uIGlzXG4gICAgLy8gY3VycmVudGx5IGFzc29jaWF0ZWQgd2l0aCwgb3IgYSBudW1iZXIuIFRoZSBudW1iZXIgaW5kaWNhdGVzIHRoYXQgd2UgYXJlIGluXG4gICAgLy8gdGhlIHByb2Nlc3Mgb2Ygc2V0dGluZyB1cCB0aGUgb2JzZXJ2ZSAodXNpbmcgYSBudW1iZXIgaW5zdGVhZCBvZiBhIHNpbmdsZVxuICAgIC8vIHNlbnRpbmVsIGFsbG93cyBtdWx0aXBsZSBhdHRlbXB0cyB0byBzZXQgdXAgdGhlIG9ic2VydmUgdG8gaWRlbnRpZnkgd2hpY2hcbiAgICAvLyBvbmUgd2FzIHRoZWlycykuXG4gICAgdGhpcy5fdXNlck9ic2VydmVzRm9yQ29ubmVjdGlvbnMgPSB7fTtcbiAgICB0aGlzLl9uZXh0VXNlck9ic2VydmVOdW1iZXIgPSAxOyAgLy8gZm9yIHRoZSBudW1iZXIgZGVzY3JpYmVkIGFib3ZlLlxuXG4gICAgLy8gbGlzdCBvZiBhbGwgcmVnaXN0ZXJlZCBoYW5kbGVycy5cbiAgICB0aGlzLl9sb2dpbkhhbmRsZXJzID0gW107XG5cbiAgICBzZXR1cFVzZXJzQ29sbGVjdGlvbih0aGlzLnVzZXJzKTtcbiAgICBzZXR1cERlZmF1bHRMb2dpbkhhbmRsZXJzKHRoaXMpO1xuICAgIHNldEV4cGlyZVRva2Vuc0ludGVydmFsKHRoaXMpO1xuXG4gICAgdGhpcy5fdmFsaWRhdGVMb2dpbkhvb2sgPSBuZXcgSG9vayh7IGJpbmRFbnZpcm9ubWVudDogZmFsc2UgfSk7XG4gICAgdGhpcy5fdmFsaWRhdGVOZXdVc2VySG9va3MgPSBbXG4gICAgICBkZWZhdWx0VmFsaWRhdGVOZXdVc2VySG9vay5iaW5kKHRoaXMpXG4gICAgXTtcblxuICAgIHRoaXMuX2RlbGV0ZVNhdmVkVG9rZW5zRm9yQWxsVXNlcnNPblN0YXJ0dXAoKTtcblxuICAgIHRoaXMuX3NraXBDYXNlSW5zZW5zaXRpdmVDaGVja3NGb3JUZXN0ID0ge307XG5cbiAgICAvLyBYWFggVGhlc2Ugc2hvdWxkIHByb2JhYmx5IG5vdCBhY3R1YWxseSBiZSBwdWJsaWM/XG4gICAgdGhpcy51cmxzID0ge1xuICAgICAgcmVzZXRQYXNzd29yZDogdG9rZW4gPT4gTWV0ZW9yLmFic29sdXRlVXJsKGAjL3Jlc2V0LXBhc3N3b3JkLyR7dG9rZW59YCksXG4gICAgICB2ZXJpZnlFbWFpbDogdG9rZW4gPT4gTWV0ZW9yLmFic29sdXRlVXJsKGAjL3ZlcmlmeS1lbWFpbC8ke3Rva2VufWApLFxuICAgICAgZW5yb2xsQWNjb3VudDogdG9rZW4gPT4gTWV0ZW9yLmFic29sdXRlVXJsKGAjL2Vucm9sbC1hY2NvdW50LyR7dG9rZW59YCksXG4gICAgfVxuXG4gICAgdGhpcy5hZGREZWZhdWx0UmF0ZUxpbWl0KClcbiAgfVxuXG4gIC8vL1xuICAvLy8gQ1VSUkVOVCBVU0VSXG4gIC8vL1xuXG4gIC8vIEBvdmVycmlkZSBvZiBcImFic3RyYWN0XCIgbm9uLWltcGxlbWVudGF0aW9uIGluIGFjY291bnRzX2NvbW1vbi5qc1xuICB1c2VySWQoKSB7XG4gICAgLy8gVGhpcyBmdW5jdGlvbiBvbmx5IHdvcmtzIGlmIGNhbGxlZCBpbnNpZGUgYSBtZXRob2Qgb3IgYSBwdWJpY2F0aW9uLlxuICAgIC8vIFVzaW5nIGFueSBvZiB0aGUgaW5mb21hdGlvbiBmcm9tIE1ldGVvci51c2VyKCkgaW4gYSBtZXRob2Qgb3JcbiAgICAvLyBwdWJsaXNoIGZ1bmN0aW9uIHdpbGwgYWx3YXlzIHVzZSB0aGUgdmFsdWUgZnJvbSB3aGVuIHRoZSBmdW5jdGlvbiBmaXJzdFxuICAgIC8vIHJ1bnMuIFRoaXMgaXMgbGlrZWx5IG5vdCB3aGF0IHRoZSB1c2VyIGV4cGVjdHMuIFRoZSB3YXkgdG8gbWFrZSB0aGlzIHdvcmtcbiAgICAvLyBpbiBhIG1ldGhvZCBvciBwdWJsaXNoIGZ1bmN0aW9uIGlzIHRvIGRvIE1ldGVvci5maW5kKHRoaXMudXNlcklkKS5vYnNlcnZlXG4gICAgLy8gYW5kIHJlY29tcHV0ZSB3aGVuIHRoZSB1c2VyIHJlY29yZCBjaGFuZ2VzLlxuICAgIGNvbnN0IGN1cnJlbnRJbnZvY2F0aW9uID0gRERQLl9DdXJyZW50TWV0aG9kSW52b2NhdGlvbi5nZXQoKSB8fCBERFAuX0N1cnJlbnRQdWJsaWNhdGlvbkludm9jYXRpb24uZ2V0KCk7XG4gICAgaWYgKCFjdXJyZW50SW52b2NhdGlvbilcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk1ldGVvci51c2VySWQgY2FuIG9ubHkgYmUgaW52b2tlZCBpbiBtZXRob2QgY2FsbHMgb3IgcHVibGljYXRpb25zLlwiKTtcbiAgICByZXR1cm4gY3VycmVudEludm9jYXRpb24udXNlcklkO1xuICB9XG5cbiAgLy8vXG4gIC8vLyBMT0dJTiBIT09LU1xuICAvLy9cblxuICAvKipcbiAgICogQHN1bW1hcnkgVmFsaWRhdGUgbG9naW4gYXR0ZW1wdHMuXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBDYWxsZWQgd2hlbmV2ZXIgYSBsb2dpbiBpcyBhdHRlbXB0ZWQgKGVpdGhlciBzdWNjZXNzZnVsIG9yIHVuc3VjY2Vzc2Z1bCkuICBBIGxvZ2luIGNhbiBiZSBhYm9ydGVkIGJ5IHJldHVybmluZyBhIGZhbHN5IHZhbHVlIG9yIHRocm93aW5nIGFuIGV4Y2VwdGlvbi5cbiAgICovXG4gIHZhbGlkYXRlTG9naW5BdHRlbXB0KGZ1bmMpIHtcbiAgICAvLyBFeGNlcHRpb25zIGluc2lkZSB0aGUgaG9vayBjYWxsYmFjayBhcmUgcGFzc2VkIHVwIHRvIHVzLlxuICAgIHJldHVybiB0aGlzLl92YWxpZGF0ZUxvZ2luSG9vay5yZWdpc3RlcihmdW5jKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBTZXQgcmVzdHJpY3Rpb25zIG9uIG5ldyB1c2VyIGNyZWF0aW9uLlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgQ2FsbGVkIHdoZW5ldmVyIGEgbmV3IHVzZXIgaXMgY3JlYXRlZC4gVGFrZXMgdGhlIG5ldyB1c2VyIG9iamVjdCwgYW5kIHJldHVybnMgdHJ1ZSB0byBhbGxvdyB0aGUgY3JlYXRpb24gb3IgZmFsc2UgdG8gYWJvcnQuXG4gICAqL1xuICB2YWxpZGF0ZU5ld1VzZXIoZnVuYykge1xuICAgIHRoaXMuX3ZhbGlkYXRlTmV3VXNlckhvb2tzLnB1c2goZnVuYyk7XG4gIH1cblxuICAvLy9cbiAgLy8vIENSRUFURSBVU0VSIEhPT0tTXG4gIC8vL1xuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBDdXN0b21pemUgbmV3IHVzZXIgY3JlYXRpb24uXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBDYWxsZWQgd2hlbmV2ZXIgYSBuZXcgdXNlciBpcyBjcmVhdGVkLiBSZXR1cm4gdGhlIG5ldyB1c2VyIG9iamVjdCwgb3IgdGhyb3cgYW4gYEVycm9yYCB0byBhYm9ydCB0aGUgY3JlYXRpb24uXG4gICAqL1xuICBvbkNyZWF0ZVVzZXIoZnVuYykge1xuICAgIGlmICh0aGlzLl9vbkNyZWF0ZVVzZXJIb29rKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4gb25seSBjYWxsIG9uQ3JlYXRlVXNlciBvbmNlXCIpO1xuICAgIH1cblxuICAgIHRoaXMuX29uQ3JlYXRlVXNlckhvb2sgPSBmdW5jO1xuICB9XG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IEN1c3RvbWl6ZSBvYXV0aCB1c2VyIHByb2ZpbGUgdXBkYXRlc1xuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgQ2FsbGVkIHdoZW5ldmVyIGEgdXNlciBpcyBsb2dnZWQgaW4gdmlhIG9hdXRoLiBSZXR1cm4gdGhlIHByb2ZpbGUgb2JqZWN0IHRvIGJlIG1lcmdlZCwgb3IgdGhyb3cgYW4gYEVycm9yYCB0byBhYm9ydCB0aGUgY3JlYXRpb24uXG4gICAqL1xuICBvbkV4dGVybmFsTG9naW4oZnVuYykge1xuICAgIGlmICh0aGlzLl9vbkV4dGVybmFsTG9naW5Ib29rKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4gb25seSBjYWxsIG9uRXh0ZXJuYWxMb2dpbiBvbmNlXCIpO1xuICAgIH1cblxuICAgIHRoaXMuX29uRXh0ZXJuYWxMb2dpbkhvb2sgPSBmdW5jO1xuICB9XG5cbiAgX3ZhbGlkYXRlTG9naW4oY29ubmVjdGlvbiwgYXR0ZW1wdCkge1xuICAgIHRoaXMuX3ZhbGlkYXRlTG9naW5Ib29rLmVhY2goY2FsbGJhY2sgPT4ge1xuICAgICAgbGV0IHJldDtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldCA9IGNhbGxiYWNrKGNsb25lQXR0ZW1wdFdpdGhDb25uZWN0aW9uKGNvbm5lY3Rpb24sIGF0dGVtcHQpKTtcbiAgICAgIH1cbiAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgIGF0dGVtcHQuYWxsb3dlZCA9IGZhbHNlO1xuICAgICAgICAvLyBYWFggdGhpcyBtZWFucyB0aGUgbGFzdCB0aHJvd24gZXJyb3Igb3ZlcnJpZGVzIHByZXZpb3VzIGVycm9yXG4gICAgICAgIC8vIG1lc3NhZ2VzLiBNYXliZSB0aGlzIGlzIHN1cnByaXNpbmcgdG8gdXNlcnMgYW5kIHdlIHNob3VsZCBtYWtlXG4gICAgICAgIC8vIG92ZXJyaWRpbmcgZXJyb3JzIG1vcmUgZXhwbGljaXQuIChzZWVcbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21ldGVvci9tZXRlb3IvaXNzdWVzLzE5NjApXG4gICAgICAgIGF0dGVtcHQuZXJyb3IgPSBlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmICghIHJldCkge1xuICAgICAgICBhdHRlbXB0LmFsbG93ZWQgPSBmYWxzZTtcbiAgICAgICAgLy8gZG9uJ3Qgb3ZlcnJpZGUgYSBzcGVjaWZpYyBlcnJvciBwcm92aWRlZCBieSBhIHByZXZpb3VzXG4gICAgICAgIC8vIHZhbGlkYXRvciBvciB0aGUgaW5pdGlhbCBhdHRlbXB0IChlZyBcImluY29ycmVjdCBwYXNzd29yZFwiKS5cbiAgICAgICAgaWYgKCFhdHRlbXB0LmVycm9yKVxuICAgICAgICAgIGF0dGVtcHQuZXJyb3IgPSBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJMb2dpbiBmb3JiaWRkZW5cIik7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfTtcblxuICBfc3VjY2Vzc2Z1bExvZ2luKGNvbm5lY3Rpb24sIGF0dGVtcHQpIHtcbiAgICB0aGlzLl9vbkxvZ2luSG9vay5lYWNoKGNhbGxiYWNrID0+IHtcbiAgICAgIGNhbGxiYWNrKGNsb25lQXR0ZW1wdFdpdGhDb25uZWN0aW9uKGNvbm5lY3Rpb24sIGF0dGVtcHQpKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICB9O1xuXG4gIF9mYWlsZWRMb2dpbihjb25uZWN0aW9uLCBhdHRlbXB0KSB7XG4gICAgdGhpcy5fb25Mb2dpbkZhaWx1cmVIb29rLmVhY2goY2FsbGJhY2sgPT4ge1xuICAgICAgY2FsbGJhY2soY2xvbmVBdHRlbXB0V2l0aENvbm5lY3Rpb24oY29ubmVjdGlvbiwgYXR0ZW1wdCkpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gIH07XG5cbiAgX3N1Y2Nlc3NmdWxMb2dvdXQoY29ubmVjdGlvbiwgdXNlcklkKSB7XG4gICAgY29uc3QgdXNlciA9IHVzZXJJZCAmJiB0aGlzLnVzZXJzLmZpbmRPbmUodXNlcklkKTtcbiAgICB0aGlzLl9vbkxvZ291dEhvb2suZWFjaChjYWxsYmFjayA9PiB7XG4gICAgICBjYWxsYmFjayh7IHVzZXIsIGNvbm5lY3Rpb24gfSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfTtcblxuICAvLy9cbiAgLy8vIExPR0lOIE1FVEhPRFNcbiAgLy8vXG5cbiAgLy8gTG9naW4gbWV0aG9kcyByZXR1cm4gdG8gdGhlIGNsaWVudCBhbiBvYmplY3QgY29udGFpbmluZyB0aGVzZVxuICAvLyBmaWVsZHMgd2hlbiB0aGUgdXNlciB3YXMgbG9nZ2VkIGluIHN1Y2Nlc3NmdWxseTpcbiAgLy9cbiAgLy8gICBpZDogdXNlcklkXG4gIC8vICAgdG9rZW46ICpcbiAgLy8gICB0b2tlbkV4cGlyZXM6ICpcbiAgLy9cbiAgLy8gdG9rZW5FeHBpcmVzIGlzIG9wdGlvbmFsIGFuZCBpbnRlbmRzIHRvIHByb3ZpZGUgYSBoaW50IHRvIHRoZVxuICAvLyBjbGllbnQgYXMgdG8gd2hlbiB0aGUgdG9rZW4gd2lsbCBleHBpcmUuIElmIG5vdCBwcm92aWRlZCwgdGhlXG4gIC8vIGNsaWVudCB3aWxsIGNhbGwgQWNjb3VudHMuX3Rva2VuRXhwaXJhdGlvbiwgcGFzc2luZyBpdCB0aGUgZGF0ZVxuICAvLyB0aGF0IGl0IHJlY2VpdmVkIHRoZSB0b2tlbi5cbiAgLy9cbiAgLy8gVGhlIGxvZ2luIG1ldGhvZCB3aWxsIHRocm93IGFuIGVycm9yIGJhY2sgdG8gdGhlIGNsaWVudCBpZiB0aGUgdXNlclxuICAvLyBmYWlsZWQgdG8gbG9nIGluLlxuICAvL1xuICAvL1xuICAvLyBMb2dpbiBoYW5kbGVycyBhbmQgc2VydmljZSBzcGVjaWZpYyBsb2dpbiBtZXRob2RzIHN1Y2ggYXNcbiAgLy8gYGNyZWF0ZVVzZXJgIGludGVybmFsbHkgcmV0dXJuIGEgYHJlc3VsdGAgb2JqZWN0IGNvbnRhaW5pbmcgdGhlc2VcbiAgLy8gZmllbGRzOlxuICAvL1xuICAvLyAgIHR5cGU6XG4gIC8vICAgICBvcHRpb25hbCBzdHJpbmc7IHRoZSBzZXJ2aWNlIG5hbWUsIG92ZXJyaWRlcyB0aGUgaGFuZGxlclxuICAvLyAgICAgZGVmYXVsdCBpZiBwcmVzZW50LlxuICAvL1xuICAvLyAgIGVycm9yOlxuICAvLyAgICAgZXhjZXB0aW9uOyBpZiB0aGUgdXNlciBpcyBub3QgYWxsb3dlZCB0byBsb2dpbiwgdGhlIHJlYXNvbiB3aHkuXG4gIC8vXG4gIC8vICAgdXNlcklkOlxuICAvLyAgICAgc3RyaW5nOyB0aGUgdXNlciBpZCBvZiB0aGUgdXNlciBhdHRlbXB0aW5nIHRvIGxvZ2luIChpZlxuICAvLyAgICAga25vd24pLCByZXF1aXJlZCBmb3IgYW4gYWxsb3dlZCBsb2dpbi5cbiAgLy9cbiAgLy8gICBvcHRpb25zOlxuICAvLyAgICAgb3B0aW9uYWwgb2JqZWN0IG1lcmdlZCBpbnRvIHRoZSByZXN1bHQgcmV0dXJuZWQgYnkgdGhlIGxvZ2luXG4gIC8vICAgICBtZXRob2Q7IHVzZWQgYnkgSEFNSyBmcm9tIFNSUC5cbiAgLy9cbiAgLy8gICBzdGFtcGVkTG9naW5Ub2tlbjpcbiAgLy8gICAgIG9wdGlvbmFsIG9iamVjdCB3aXRoIGB0b2tlbmAgYW5kIGB3aGVuYCBpbmRpY2F0aW5nIHRoZSBsb2dpblxuICAvLyAgICAgdG9rZW4gaXMgYWxyZWFkeSBwcmVzZW50IGluIHRoZSBkYXRhYmFzZSwgcmV0dXJuZWQgYnkgdGhlXG4gIC8vICAgICBcInJlc3VtZVwiIGxvZ2luIGhhbmRsZXIuXG4gIC8vXG4gIC8vIEZvciBjb252ZW5pZW5jZSwgbG9naW4gbWV0aG9kcyBjYW4gYWxzbyB0aHJvdyBhbiBleGNlcHRpb24sIHdoaWNoXG4gIC8vIGlzIGNvbnZlcnRlZCBpbnRvIGFuIHtlcnJvcn0gcmVzdWx0LiAgSG93ZXZlciwgaWYgdGhlIGlkIG9mIHRoZVxuICAvLyB1c2VyIGF0dGVtcHRpbmcgdGhlIGxvZ2luIGlzIGtub3duLCBhIHt1c2VySWQsIGVycm9yfSByZXN1bHQgc2hvdWxkXG4gIC8vIGJlIHJldHVybmVkIGluc3RlYWQgc2luY2UgdGhlIHVzZXIgaWQgaXMgbm90IGNhcHR1cmVkIHdoZW4gYW5cbiAgLy8gZXhjZXB0aW9uIGlzIHRocm93bi5cbiAgLy9cbiAgLy8gVGhpcyBpbnRlcm5hbCBgcmVzdWx0YCBvYmplY3QgaXMgYXV0b21hdGljYWxseSBjb252ZXJ0ZWQgaW50byB0aGVcbiAgLy8gcHVibGljIHtpZCwgdG9rZW4sIHRva2VuRXhwaXJlc30gb2JqZWN0IHJldHVybmVkIHRvIHRoZSBjbGllbnQuXG5cbiAgLy8gVHJ5IGEgbG9naW4gbWV0aG9kLCBjb252ZXJ0aW5nIHRocm93biBleGNlcHRpb25zIGludG8gYW4ge2Vycm9yfVxuICAvLyByZXN1bHQuICBUaGUgYHR5cGVgIGFyZ3VtZW50IGlzIGEgZGVmYXVsdCwgaW5zZXJ0ZWQgaW50byB0aGUgcmVzdWx0XG4gIC8vIG9iamVjdCBpZiBub3QgZXhwbGljaXRseSByZXR1cm5lZC5cbiAgLy9cbiAgLy8gTG9nIGluIGEgdXNlciBvbiBhIGNvbm5lY3Rpb24uXG4gIC8vXG4gIC8vIFdlIHVzZSB0aGUgbWV0aG9kIGludm9jYXRpb24gdG8gc2V0IHRoZSB1c2VyIGlkIG9uIHRoZSBjb25uZWN0aW9uLFxuICAvLyBub3QgdGhlIGNvbm5lY3Rpb24gb2JqZWN0IGRpcmVjdGx5LiBzZXRVc2VySWQgaXMgdGllZCB0byBtZXRob2RzIHRvXG4gIC8vIGVuZm9yY2UgY2xlYXIgb3JkZXJpbmcgb2YgbWV0aG9kIGFwcGxpY2F0aW9uICh1c2luZyB3YWl0IG1ldGhvZHMgb25cbiAgLy8gdGhlIGNsaWVudCwgYW5kIGEgbm8gc2V0VXNlcklkIGFmdGVyIHVuYmxvY2sgcmVzdHJpY3Rpb24gb24gdGhlXG4gIC8vIHNlcnZlcilcbiAgLy9cbiAgLy8gVGhlIGBzdGFtcGVkTG9naW5Ub2tlbmAgcGFyYW1ldGVyIGlzIG9wdGlvbmFsLiAgV2hlbiBwcmVzZW50LCBpdFxuICAvLyBpbmRpY2F0ZXMgdGhhdCB0aGUgbG9naW4gdG9rZW4gaGFzIGFscmVhZHkgYmVlbiBpbnNlcnRlZCBpbnRvIHRoZVxuICAvLyBkYXRhYmFzZSBhbmQgZG9lc24ndCBuZWVkIHRvIGJlIGluc2VydGVkIGFnYWluLiAgKEl0J3MgdXNlZCBieSB0aGVcbiAgLy8gXCJyZXN1bWVcIiBsb2dpbiBoYW5kbGVyKS5cbiAgX2xvZ2luVXNlcihtZXRob2RJbnZvY2F0aW9uLCB1c2VySWQsIHN0YW1wZWRMb2dpblRva2VuKSB7XG4gICAgaWYgKCEgc3RhbXBlZExvZ2luVG9rZW4pIHtcbiAgICAgIHN0YW1wZWRMb2dpblRva2VuID0gdGhpcy5fZ2VuZXJhdGVTdGFtcGVkTG9naW5Ub2tlbigpO1xuICAgICAgdGhpcy5faW5zZXJ0TG9naW5Ub2tlbih1c2VySWQsIHN0YW1wZWRMb2dpblRva2VuKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIG9yZGVyIChhbmQgdGhlIGF2b2lkYW5jZSBvZiB5aWVsZHMpIGlzIGltcG9ydGFudCB0byBtYWtlXG4gICAgLy8gc3VyZSB0aGF0IHdoZW4gcHVibGlzaCBmdW5jdGlvbnMgYXJlIHJlcnVuLCB0aGV5IHNlZSBhXG4gICAgLy8gY29uc2lzdGVudCB2aWV3IG9mIHRoZSB3b3JsZDogdGhlIHVzZXJJZCBpcyBzZXQgYW5kIG1hdGNoZXNcbiAgICAvLyB0aGUgbG9naW4gdG9rZW4gb24gdGhlIGNvbm5lY3Rpb24gKG5vdCB0aGF0IHRoZXJlIGlzXG4gICAgLy8gY3VycmVudGx5IGEgcHVibGljIEFQSSBmb3IgcmVhZGluZyB0aGUgbG9naW4gdG9rZW4gb24gYVxuICAgIC8vIGNvbm5lY3Rpb24pLlxuICAgIE1ldGVvci5fbm9ZaWVsZHNBbGxvd2VkKCgpID0+XG4gICAgICB0aGlzLl9zZXRMb2dpblRva2VuKFxuICAgICAgICB1c2VySWQsXG4gICAgICAgIG1ldGhvZEludm9jYXRpb24uY29ubmVjdGlvbixcbiAgICAgICAgdGhpcy5faGFzaExvZ2luVG9rZW4oc3RhbXBlZExvZ2luVG9rZW4udG9rZW4pXG4gICAgICApXG4gICAgKTtcblxuICAgIG1ldGhvZEludm9jYXRpb24uc2V0VXNlcklkKHVzZXJJZCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IHVzZXJJZCxcbiAgICAgIHRva2VuOiBzdGFtcGVkTG9naW5Ub2tlbi50b2tlbixcbiAgICAgIHRva2VuRXhwaXJlczogdGhpcy5fdG9rZW5FeHBpcmF0aW9uKHN0YW1wZWRMb2dpblRva2VuLndoZW4pXG4gICAgfTtcbiAgfTtcblxuICAvLyBBZnRlciBhIGxvZ2luIG1ldGhvZCBoYXMgY29tcGxldGVkLCBjYWxsIHRoZSBsb2dpbiBob29rcy4gIE5vdGVcbiAgLy8gdGhhdCBgYXR0ZW1wdExvZ2luYCBpcyBjYWxsZWQgZm9yICphbGwqIGxvZ2luIGF0dGVtcHRzLCBldmVuIG9uZXNcbiAgLy8gd2hpY2ggYXJlbid0IHN1Y2Nlc3NmdWwgKHN1Y2ggYXMgYW4gaW52YWxpZCBwYXNzd29yZCwgZXRjKS5cbiAgLy9cbiAgLy8gSWYgdGhlIGxvZ2luIGlzIGFsbG93ZWQgYW5kIGlzbid0IGFib3J0ZWQgYnkgYSB2YWxpZGF0ZSBsb2dpbiBob29rXG4gIC8vIGNhbGxiYWNrLCBsb2cgaW4gdGhlIHVzZXIuXG4gIC8vXG4gIF9hdHRlbXB0TG9naW4oXG4gICAgbWV0aG9kSW52b2NhdGlvbixcbiAgICBtZXRob2ROYW1lLFxuICAgIG1ldGhvZEFyZ3MsXG4gICAgcmVzdWx0XG4gICkge1xuICAgIGlmICghcmVzdWx0KVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwicmVzdWx0IGlzIHJlcXVpcmVkXCIpO1xuXG4gICAgLy8gWFhYIEEgcHJvZ3JhbW1pbmcgZXJyb3IgaW4gYSBsb2dpbiBoYW5kbGVyIGNhbiBsZWFkIHRvIHRoaXMgb2NjdXJpbmcsIGFuZFxuICAgIC8vIHRoZW4gd2UgZG9uJ3QgY2FsbCBvbkxvZ2luIG9yIG9uTG9naW5GYWlsdXJlIGNhbGxiYWNrcy4gU2hvdWxkXG4gICAgLy8gdHJ5TG9naW5NZXRob2QgY2F0Y2ggdGhpcyBjYXNlIGFuZCB0dXJuIGl0IGludG8gYW4gZXJyb3I/XG4gICAgaWYgKCFyZXN1bHQudXNlcklkICYmICFyZXN1bHQuZXJyb3IpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBIGxvZ2luIG1ldGhvZCBtdXN0IHNwZWNpZnkgYSB1c2VySWQgb3IgYW4gZXJyb3JcIik7XG5cbiAgICBsZXQgdXNlcjtcbiAgICBpZiAocmVzdWx0LnVzZXJJZClcbiAgICAgIHVzZXIgPSB0aGlzLnVzZXJzLmZpbmRPbmUocmVzdWx0LnVzZXJJZCk7XG5cbiAgICBjb25zdCBhdHRlbXB0ID0ge1xuICAgICAgdHlwZTogcmVzdWx0LnR5cGUgfHwgXCJ1bmtub3duXCIsXG4gICAgICBhbGxvd2VkOiAhISAocmVzdWx0LnVzZXJJZCAmJiAhcmVzdWx0LmVycm9yKSxcbiAgICAgIG1ldGhvZE5hbWU6IG1ldGhvZE5hbWUsXG4gICAgICBtZXRob2RBcmd1bWVudHM6IEFycmF5LmZyb20obWV0aG9kQXJncylcbiAgICB9O1xuICAgIGlmIChyZXN1bHQuZXJyb3IpIHtcbiAgICAgIGF0dGVtcHQuZXJyb3IgPSByZXN1bHQuZXJyb3I7XG4gICAgfVxuICAgIGlmICh1c2VyKSB7XG4gICAgICBhdHRlbXB0LnVzZXIgPSB1c2VyO1xuICAgIH1cblxuICAgIC8vIF92YWxpZGF0ZUxvZ2luIG1heSBtdXRhdGUgYGF0dGVtcHRgIGJ5IGFkZGluZyBhbiBlcnJvciBhbmQgY2hhbmdpbmcgYWxsb3dlZFxuICAgIC8vIHRvIGZhbHNlLCBidXQgdGhhdCdzIHRoZSBvbmx5IGNoYW5nZSBpdCBjYW4gbWFrZSAoYW5kIHRoZSB1c2VyJ3MgY2FsbGJhY2tzXG4gICAgLy8gb25seSBnZXQgYSBjbG9uZSBvZiBgYXR0ZW1wdGApLlxuICAgIHRoaXMuX3ZhbGlkYXRlTG9naW4obWV0aG9kSW52b2NhdGlvbi5jb25uZWN0aW9uLCBhdHRlbXB0KTtcblxuICAgIGlmIChhdHRlbXB0LmFsbG93ZWQpIHtcbiAgICAgIGNvbnN0IHJldCA9IHtcbiAgICAgICAgLi4udGhpcy5fbG9naW5Vc2VyKFxuICAgICAgICAgIG1ldGhvZEludm9jYXRpb24sXG4gICAgICAgICAgcmVzdWx0LnVzZXJJZCxcbiAgICAgICAgICByZXN1bHQuc3RhbXBlZExvZ2luVG9rZW5cbiAgICAgICAgKSxcbiAgICAgICAgLi4ucmVzdWx0Lm9wdGlvbnNcbiAgICAgIH07XG4gICAgICByZXQudHlwZSA9IGF0dGVtcHQudHlwZTtcbiAgICAgIHRoaXMuX3N1Y2Nlc3NmdWxMb2dpbihtZXRob2RJbnZvY2F0aW9uLmNvbm5lY3Rpb24sIGF0dGVtcHQpO1xuICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLl9mYWlsZWRMb2dpbihtZXRob2RJbnZvY2F0aW9uLmNvbm5lY3Rpb24sIGF0dGVtcHQpO1xuICAgICAgdGhyb3cgYXR0ZW1wdC5lcnJvcjtcbiAgICB9XG4gIH07XG5cbiAgLy8gQWxsIHNlcnZpY2Ugc3BlY2lmaWMgbG9naW4gbWV0aG9kcyBzaG91bGQgZ28gdGhyb3VnaCB0aGlzIGZ1bmN0aW9uLlxuICAvLyBFbnN1cmUgdGhhdCB0aHJvd24gZXhjZXB0aW9ucyBhcmUgY2F1Z2h0IGFuZCB0aGF0IGxvZ2luIGhvb2tcbiAgLy8gY2FsbGJhY2tzIGFyZSBzdGlsbCBjYWxsZWQuXG4gIC8vXG4gIF9sb2dpbk1ldGhvZChcbiAgICBtZXRob2RJbnZvY2F0aW9uLFxuICAgIG1ldGhvZE5hbWUsXG4gICAgbWV0aG9kQXJncyxcbiAgICB0eXBlLFxuICAgIGZuXG4gICkge1xuICAgIHJldHVybiB0aGlzLl9hdHRlbXB0TG9naW4oXG4gICAgICBtZXRob2RJbnZvY2F0aW9uLFxuICAgICAgbWV0aG9kTmFtZSxcbiAgICAgIG1ldGhvZEFyZ3MsXG4gICAgICB0cnlMb2dpbk1ldGhvZCh0eXBlLCBmbilcbiAgICApO1xuICB9O1xuXG5cbiAgLy8gUmVwb3J0IGEgbG9naW4gYXR0ZW1wdCBmYWlsZWQgb3V0c2lkZSB0aGUgY29udGV4dCBvZiBhIG5vcm1hbCBsb2dpblxuICAvLyBtZXRob2QuIFRoaXMgaXMgZm9yIHVzZSBpbiB0aGUgY2FzZSB3aGVyZSB0aGVyZSBpcyBhIG11bHRpLXN0ZXAgbG9naW5cbiAgLy8gcHJvY2VkdXJlIChlZyBTUlAgYmFzZWQgcGFzc3dvcmQgbG9naW4pLiBJZiBhIG1ldGhvZCBlYXJseSBpbiB0aGVcbiAgLy8gY2hhaW4gZmFpbHMsIGl0IHNob3VsZCBjYWxsIHRoaXMgZnVuY3Rpb24gdG8gcmVwb3J0IGEgZmFpbHVyZS4gVGhlcmVcbiAgLy8gaXMgbm8gY29ycmVzcG9uZGluZyBtZXRob2QgZm9yIGEgc3VjY2Vzc2Z1bCBsb2dpbjsgbWV0aG9kcyB0aGF0IGNhblxuICAvLyBzdWNjZWVkIGF0IGxvZ2dpbmcgYSB1c2VyIGluIHNob3VsZCBhbHdheXMgYmUgYWN0dWFsIGxvZ2luIG1ldGhvZHNcbiAgLy8gKHVzaW5nIGVpdGhlciBBY2NvdW50cy5fbG9naW5NZXRob2Qgb3IgQWNjb3VudHMucmVnaXN0ZXJMb2dpbkhhbmRsZXIpLlxuICBfcmVwb3J0TG9naW5GYWlsdXJlKFxuICAgIG1ldGhvZEludm9jYXRpb24sXG4gICAgbWV0aG9kTmFtZSxcbiAgICBtZXRob2RBcmdzLFxuICAgIHJlc3VsdFxuICApIHtcbiAgICBjb25zdCBhdHRlbXB0ID0ge1xuICAgICAgdHlwZTogcmVzdWx0LnR5cGUgfHwgXCJ1bmtub3duXCIsXG4gICAgICBhbGxvd2VkOiBmYWxzZSxcbiAgICAgIGVycm9yOiByZXN1bHQuZXJyb3IsXG4gICAgICBtZXRob2ROYW1lOiBtZXRob2ROYW1lLFxuICAgICAgbWV0aG9kQXJndW1lbnRzOiBBcnJheS5mcm9tKG1ldGhvZEFyZ3MpXG4gICAgfTtcblxuICAgIGlmIChyZXN1bHQudXNlcklkKSB7XG4gICAgICBhdHRlbXB0LnVzZXIgPSB0aGlzLnVzZXJzLmZpbmRPbmUocmVzdWx0LnVzZXJJZCk7XG4gICAgfVxuXG4gICAgdGhpcy5fdmFsaWRhdGVMb2dpbihtZXRob2RJbnZvY2F0aW9uLmNvbm5lY3Rpb24sIGF0dGVtcHQpO1xuICAgIHRoaXMuX2ZhaWxlZExvZ2luKG1ldGhvZEludm9jYXRpb24uY29ubmVjdGlvbiwgYXR0ZW1wdCk7XG5cbiAgICAvLyBfdmFsaWRhdGVMb2dpbiBtYXkgbXV0YXRlIGF0dGVtcHQgdG8gc2V0IGEgbmV3IGVycm9yIG1lc3NhZ2UuIFJldHVyblxuICAgIC8vIHRoZSBtb2RpZmllZCB2ZXJzaW9uLlxuICAgIHJldHVybiBhdHRlbXB0O1xuICB9O1xuXG4gIC8vL1xuICAvLy8gTE9HSU4gSEFORExFUlNcbiAgLy8vXG5cbiAgLy8gVGhlIG1haW4gZW50cnkgcG9pbnQgZm9yIGF1dGggcGFja2FnZXMgdG8gaG9vayBpbiB0byBsb2dpbi5cbiAgLy9cbiAgLy8gQSBsb2dpbiBoYW5kbGVyIGlzIGEgbG9naW4gbWV0aG9kIHdoaWNoIGNhbiByZXR1cm4gYHVuZGVmaW5lZGAgdG9cbiAgLy8gaW5kaWNhdGUgdGhhdCB0aGUgbG9naW4gcmVxdWVzdCBpcyBub3QgaGFuZGxlZCBieSB0aGlzIGhhbmRsZXIuXG4gIC8vXG4gIC8vIEBwYXJhbSBuYW1lIHtTdHJpbmd9IE9wdGlvbmFsLiAgVGhlIHNlcnZpY2UgbmFtZSwgdXNlZCBieSBkZWZhdWx0XG4gIC8vIGlmIGEgc3BlY2lmaWMgc2VydmljZSBuYW1lIGlzbid0IHJldHVybmVkIGluIHRoZSByZXN1bHQuXG4gIC8vXG4gIC8vIEBwYXJhbSBoYW5kbGVyIHtGdW5jdGlvbn0gQSBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGFuIG9wdGlvbnMgb2JqZWN0XG4gIC8vIChhcyBwYXNzZWQgYXMgYW4gYXJndW1lbnQgdG8gdGhlIGBsb2dpbmAgbWV0aG9kKSBhbmQgcmV0dXJucyBvbmUgb2Y6XG4gIC8vIC0gYHVuZGVmaW5lZGAsIG1lYW5pbmcgZG9uJ3QgaGFuZGxlO1xuICAvLyAtIGEgbG9naW4gbWV0aG9kIHJlc3VsdCBvYmplY3RcblxuICByZWdpc3RlckxvZ2luSGFuZGxlcihuYW1lLCBoYW5kbGVyKSB7XG4gICAgaWYgKCEgaGFuZGxlcikge1xuICAgICAgaGFuZGxlciA9IG5hbWU7XG4gICAgICBuYW1lID0gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLl9sb2dpbkhhbmRsZXJzLnB1c2goe1xuICAgICAgbmFtZTogbmFtZSxcbiAgICAgIGhhbmRsZXI6IGhhbmRsZXJcbiAgICB9KTtcbiAgfTtcblxuXG4gIC8vIENoZWNrcyBhIHVzZXIncyBjcmVkZW50aWFscyBhZ2FpbnN0IGFsbCB0aGUgcmVnaXN0ZXJlZCBsb2dpblxuICAvLyBoYW5kbGVycywgYW5kIHJldHVybnMgYSBsb2dpbiB0b2tlbiBpZiB0aGUgY3JlZGVudGlhbHMgYXJlIHZhbGlkLiBJdFxuICAvLyBpcyBsaWtlIHRoZSBsb2dpbiBtZXRob2QsIGV4Y2VwdCB0aGF0IGl0IGRvZXNuJ3Qgc2V0IHRoZSBsb2dnZWQtaW5cbiAgLy8gdXNlciBvbiB0aGUgY29ubmVjdGlvbi4gVGhyb3dzIGEgTWV0ZW9yLkVycm9yIGlmIGxvZ2dpbmcgaW4gZmFpbHMsXG4gIC8vIGluY2x1ZGluZyB0aGUgY2FzZSB3aGVyZSBub25lIG9mIHRoZSBsb2dpbiBoYW5kbGVycyBoYW5kbGVkIHRoZSBsb2dpblxuICAvLyByZXF1ZXN0LiBPdGhlcndpc2UsIHJldHVybnMge2lkOiB1c2VySWQsIHRva2VuOiAqLCB0b2tlbkV4cGlyZXM6ICp9LlxuICAvL1xuICAvLyBGb3IgZXhhbXBsZSwgaWYgeW91IHdhbnQgdG8gbG9naW4gd2l0aCBhIHBsYWludGV4dCBwYXNzd29yZCwgYG9wdGlvbnNgIGNvdWxkIGJlXG4gIC8vICAgeyB1c2VyOiB7IHVzZXJuYW1lOiA8dXNlcm5hbWU+IH0sIHBhc3N3b3JkOiA8cGFzc3dvcmQ+IH0sIG9yXG4gIC8vICAgeyB1c2VyOiB7IGVtYWlsOiA8ZW1haWw+IH0sIHBhc3N3b3JkOiA8cGFzc3dvcmQ+IH0uXG5cbiAgLy8gVHJ5IGFsbCBvZiB0aGUgcmVnaXN0ZXJlZCBsb2dpbiBoYW5kbGVycyB1bnRpbCBvbmUgb2YgdGhlbSBkb2Vzbid0XG4gIC8vIHJldHVybiBgdW5kZWZpbmVkYCwgbWVhbmluZyBpdCBoYW5kbGVkIHRoaXMgY2FsbCB0byBgbG9naW5gLiBSZXR1cm5cbiAgLy8gdGhhdCByZXR1cm4gdmFsdWUuXG4gIF9ydW5Mb2dpbkhhbmRsZXJzKG1ldGhvZEludm9jYXRpb24sIG9wdGlvbnMpIHtcbiAgICBmb3IgKGxldCBoYW5kbGVyIG9mIHRoaXMuX2xvZ2luSGFuZGxlcnMpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHRyeUxvZ2luTWV0aG9kKFxuICAgICAgICBoYW5kbGVyLm5hbWUsXG4gICAgICAgICgpID0+IGhhbmRsZXIuaGFuZGxlci5jYWxsKG1ldGhvZEludm9jYXRpb24sIG9wdGlvbnMpXG4gICAgICApO1xuXG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXN1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMCwgXCJBIGxvZ2luIGhhbmRsZXIgc2hvdWxkIHJldHVybiBhIHJlc3VsdCBvciB1bmRlZmluZWRcIik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IG51bGwsXG4gICAgICBlcnJvcjogbmV3IE1ldGVvci5FcnJvcig0MDAsIFwiVW5yZWNvZ25pemVkIG9wdGlvbnMgZm9yIGxvZ2luIHJlcXVlc3RcIilcbiAgICB9O1xuICB9O1xuXG4gIC8vIERlbGV0ZXMgdGhlIGdpdmVuIGxvZ2luVG9rZW4gZnJvbSB0aGUgZGF0YWJhc2UuXG4gIC8vXG4gIC8vIEZvciBuZXctc3R5bGUgaGFzaGVkIHRva2VuLCB0aGlzIHdpbGwgY2F1c2UgYWxsIGNvbm5lY3Rpb25zXG4gIC8vIGFzc29jaWF0ZWQgd2l0aCB0aGUgdG9rZW4gdG8gYmUgY2xvc2VkLlxuICAvL1xuICAvLyBBbnkgY29ubmVjdGlvbnMgYXNzb2NpYXRlZCB3aXRoIG9sZC1zdHlsZSB1bmhhc2hlZCB0b2tlbnMgd2lsbCBiZVxuICAvLyBpbiB0aGUgcHJvY2VzcyBvZiBiZWNvbWluZyBhc3NvY2lhdGVkIHdpdGggaGFzaGVkIHRva2VucyBhbmQgdGhlblxuICAvLyB0aGV5J2xsIGdldCBjbG9zZWQuXG4gIGRlc3Ryb3lUb2tlbih1c2VySWQsIGxvZ2luVG9rZW4pIHtcbiAgICB0aGlzLnVzZXJzLnVwZGF0ZSh1c2VySWQsIHtcbiAgICAgICRwdWxsOiB7XG4gICAgICAgIFwic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zXCI6IHtcbiAgICAgICAgICAkb3I6IFtcbiAgICAgICAgICAgIHsgaGFzaGVkVG9rZW46IGxvZ2luVG9rZW4gfSxcbiAgICAgICAgICAgIHsgdG9rZW46IGxvZ2luVG9rZW4gfVxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIF9pbml0U2VydmVyTWV0aG9kcygpIHtcbiAgICAvLyBUaGUgbWV0aG9kcyBjcmVhdGVkIGluIHRoaXMgZnVuY3Rpb24gbmVlZCB0byBiZSBjcmVhdGVkIGhlcmUgc28gdGhhdFxuICAgIC8vIHRoaXMgdmFyaWFibGUgaXMgYXZhaWxhYmxlIGluIHRoZWlyIHNjb3BlLlxuICAgIGNvbnN0IGFjY291bnRzID0gdGhpcztcblxuXG4gICAgLy8gVGhpcyBvYmplY3Qgd2lsbCBiZSBwb3B1bGF0ZWQgd2l0aCBtZXRob2RzIGFuZCB0aGVuIHBhc3NlZCB0b1xuICAgIC8vIGFjY291bnRzLl9zZXJ2ZXIubWV0aG9kcyBmdXJ0aGVyIGJlbG93LlxuICAgIGNvbnN0IG1ldGhvZHMgPSB7fTtcblxuICAgIC8vIEByZXR1cm5zIHtPYmplY3R8bnVsbH1cbiAgICAvLyAgIElmIHN1Y2Nlc3NmdWwsIHJldHVybnMge3Rva2VuOiByZWNvbm5lY3RUb2tlbiwgaWQ6IHVzZXJJZH1cbiAgICAvLyAgIElmIHVuc3VjY2Vzc2Z1bCAoZm9yIGV4YW1wbGUsIGlmIHRoZSB1c2VyIGNsb3NlZCB0aGUgb2F1dGggbG9naW4gcG9wdXApLFxuICAgIC8vICAgICB0aHJvd3MgYW4gZXJyb3IgZGVzY3JpYmluZyB0aGUgcmVhc29uXG4gICAgbWV0aG9kcy5sb2dpbiA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAvLyBMb2dpbiBoYW5kbGVycyBzaG91bGQgcmVhbGx5IGFsc28gY2hlY2sgd2hhdGV2ZXIgZmllbGQgdGhleSBsb29rIGF0IGluXG4gICAgICAvLyBvcHRpb25zLCBidXQgd2UgZG9uJ3QgZW5mb3JjZSBpdC5cbiAgICAgIGNoZWNrKG9wdGlvbnMsIE9iamVjdCk7XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGFjY291bnRzLl9ydW5Mb2dpbkhhbmRsZXJzKHRoaXMsIG9wdGlvbnMpO1xuXG4gICAgICByZXR1cm4gYWNjb3VudHMuX2F0dGVtcHRMb2dpbih0aGlzLCBcImxvZ2luXCIsIGFyZ3VtZW50cywgcmVzdWx0KTtcbiAgICB9O1xuXG4gICAgbWV0aG9kcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCB0b2tlbiA9IGFjY291bnRzLl9nZXRMb2dpblRva2VuKHRoaXMuY29ubmVjdGlvbi5pZCk7XG4gICAgICBhY2NvdW50cy5fc2V0TG9naW5Ub2tlbih0aGlzLnVzZXJJZCwgdGhpcy5jb25uZWN0aW9uLCBudWxsKTtcbiAgICAgIGlmICh0b2tlbiAmJiB0aGlzLnVzZXJJZCkge1xuICAgICAgICBhY2NvdW50cy5kZXN0cm95VG9rZW4odGhpcy51c2VySWQsIHRva2VuKTtcbiAgICAgIH1cbiAgICAgIGFjY291bnRzLl9zdWNjZXNzZnVsTG9nb3V0KHRoaXMuY29ubmVjdGlvbiwgdGhpcy51c2VySWQpO1xuICAgICAgdGhpcy5zZXRVc2VySWQobnVsbCk7XG4gICAgfTtcblxuICAgIC8vIERlbGV0ZSBhbGwgdGhlIGN1cnJlbnQgdXNlcidzIHRva2VucyBhbmQgY2xvc2UgYWxsIG9wZW4gY29ubmVjdGlvbnMgbG9nZ2VkXG4gICAgLy8gaW4gYXMgdGhpcyB1c2VyLiBSZXR1cm5zIGEgZnJlc2ggbmV3IGxvZ2luIHRva2VuIHRoYXQgdGhpcyBjbGllbnQgY2FuXG4gICAgLy8gdXNlLiBUZXN0cyBzZXQgQWNjb3VudHMuX25vQ29ubmVjdGlvbkNsb3NlRGVsYXlGb3JUZXN0IHRvIGRlbGV0ZSB0b2tlbnNcbiAgICAvLyBpbW1lZGlhdGVseSBpbnN0ZWFkIG9mIHVzaW5nIGEgZGVsYXkuXG4gICAgLy9cbiAgICAvLyBYWFggQ09NUEFUIFdJVEggMC43LjJcbiAgICAvLyBUaGlzIHNpbmdsZSBgbG9nb3V0T3RoZXJDbGllbnRzYCBtZXRob2QgaGFzIGJlZW4gcmVwbGFjZWQgd2l0aCB0d29cbiAgICAvLyBtZXRob2RzLCBvbmUgdGhhdCB5b3UgY2FsbCB0byBnZXQgYSBuZXcgdG9rZW4sIGFuZCBhbm90aGVyIHRoYXQgeW91XG4gICAgLy8gY2FsbCB0byByZW1vdmUgYWxsIHRva2VucyBleGNlcHQgeW91ciBvd24uIFRoZSBuZXcgZGVzaWduIGFsbG93c1xuICAgIC8vIGNsaWVudHMgdG8ga25vdyB3aGVuIG90aGVyIGNsaWVudHMgaGF2ZSBhY3R1YWxseSBiZWVuIGxvZ2dlZFxuICAgIC8vIG91dC4gKFRoZSBgbG9nb3V0T3RoZXJDbGllbnRzYCBtZXRob2QgZ3VhcmFudGVlcyB0aGUgY2FsbGVyIHRoYXRcbiAgICAvLyB0aGUgb3RoZXIgY2xpZW50cyB3aWxsIGJlIGxvZ2dlZCBvdXQgYXQgc29tZSBwb2ludCwgYnV0IG1ha2VzIG5vXG4gICAgLy8gZ3VhcmFudGVlcyBhYm91dCB3aGVuLikgVGhpcyBtZXRob2QgaXMgbGVmdCBpbiBmb3IgYmFja3dhcmRzXG4gICAgLy8gY29tcGF0aWJpbGl0eSwgZXNwZWNpYWxseSBzaW5jZSBhcHBsaWNhdGlvbiBjb2RlIG1pZ2h0IGJlIGNhbGxpbmdcbiAgICAvLyB0aGlzIG1ldGhvZCBkaXJlY3RseS5cbiAgICAvL1xuICAgIC8vIEByZXR1cm5zIHtPYmplY3R9IE9iamVjdCB3aXRoIHRva2VuIGFuZCB0b2tlbkV4cGlyZXMga2V5cy5cbiAgICBtZXRob2RzLmxvZ291dE90aGVyQ2xpZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IHVzZXIgPSBhY2NvdW50cy51c2Vycy5maW5kT25lKHRoaXMudXNlcklkLCB7XG4gICAgICAgIGZpZWxkczoge1xuICAgICAgICAgIFwic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zXCI6IHRydWVcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBpZiAodXNlcikge1xuICAgICAgICAvLyBTYXZlIHRoZSBjdXJyZW50IHRva2VucyBpbiB0aGUgZGF0YWJhc2UgdG8gYmUgZGVsZXRlZCBpblxuICAgICAgICAvLyBDT05ORUNUSU9OX0NMT1NFX0RFTEFZX01TIG1zLiBUaGlzIGdpdmVzIG90aGVyIGNvbm5lY3Rpb25zIGluIHRoZVxuICAgICAgICAvLyBjYWxsZXIncyBicm93c2VyIHRpbWUgdG8gZmluZCB0aGUgZnJlc2ggdG9rZW4gaW4gbG9jYWxTdG9yYWdlLiBXZSBzYXZlXG4gICAgICAgIC8vIHRoZSB0b2tlbnMgaW4gdGhlIGRhdGFiYXNlIGluIGNhc2Ugd2UgY3Jhc2ggYmVmb3JlIGFjdHVhbGx5IGRlbGV0aW5nXG4gICAgICAgIC8vIHRoZW0uXG4gICAgICAgIGNvbnN0IHRva2VucyA9IHVzZXIuc2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zO1xuICAgICAgICBjb25zdCBuZXdUb2tlbiA9IGFjY291bnRzLl9nZW5lcmF0ZVN0YW1wZWRMb2dpblRva2VuKCk7XG4gICAgICAgIGFjY291bnRzLnVzZXJzLnVwZGF0ZSh0aGlzLnVzZXJJZCwge1xuICAgICAgICAgICRzZXQ6IHtcbiAgICAgICAgICAgIFwic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zVG9EZWxldGVcIjogdG9rZW5zLFxuICAgICAgICAgICAgXCJzZXJ2aWNlcy5yZXN1bWUuaGF2ZUxvZ2luVG9rZW5zVG9EZWxldGVcIjogdHJ1ZVxuICAgICAgICAgIH0sXG4gICAgICAgICAgJHB1c2g6IHsgXCJzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnNcIjogYWNjb3VudHMuX2hhc2hTdGFtcGVkVG9rZW4obmV3VG9rZW4pIH1cbiAgICAgICAgfSk7XG4gICAgICAgIE1ldGVvci5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAvLyBUaGUgb2JzZXJ2ZSBvbiBNZXRlb3IudXNlcnMgd2lsbCB0YWtlIGNhcmUgb2YgY2xvc2luZyB0aGUgY29ubmVjdGlvbnNcbiAgICAgICAgICAvLyBhc3NvY2lhdGVkIHdpdGggYHRva2Vuc2AuXG4gICAgICAgICAgYWNjb3VudHMuX2RlbGV0ZVNhdmVkVG9rZW5zRm9yVXNlcih0aGlzLnVzZXJJZCwgdG9rZW5zKTtcbiAgICAgICAgfSwgYWNjb3VudHMuX25vQ29ubmVjdGlvbkNsb3NlRGVsYXlGb3JUZXN0ID8gMCA6XG4gICAgICAgICAgQ09OTkVDVElPTl9DTE9TRV9ERUxBWV9NUyk7XG4gICAgICAgIC8vIFdlIGRvIG5vdCBzZXQgdGhlIGxvZ2luIHRva2VuIG9uIHRoaXMgY29ubmVjdGlvbiwgYnV0IGluc3RlYWQgdGhlXG4gICAgICAgIC8vIG9ic2VydmUgY2xvc2VzIHRoZSBjb25uZWN0aW9uIGFuZCB0aGUgY2xpZW50IHdpbGwgcmVjb25uZWN0IHdpdGggdGhlXG4gICAgICAgIC8vIG5ldyB0b2tlbi5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0b2tlbjogbmV3VG9rZW4udG9rZW4sXG4gICAgICAgICAgdG9rZW5FeHBpcmVzOiBhY2NvdW50cy5fdG9rZW5FeHBpcmF0aW9uKG5ld1Rva2VuLndoZW4pXG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiWW91IGFyZSBub3QgbG9nZ2VkIGluLlwiKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gR2VuZXJhdGVzIGEgbmV3IGxvZ2luIHRva2VuIHdpdGggdGhlIHNhbWUgZXhwaXJhdGlvbiBhcyB0aGVcbiAgICAvLyBjb25uZWN0aW9uJ3MgY3VycmVudCB0b2tlbiBhbmQgc2F2ZXMgaXQgdG8gdGhlIGRhdGFiYXNlLiBBc3NvY2lhdGVzXG4gICAgLy8gdGhlIGNvbm5lY3Rpb24gd2l0aCB0aGlzIG5ldyB0b2tlbiBhbmQgcmV0dXJucyBpdC4gVGhyb3dzIGFuIGVycm9yXG4gICAgLy8gaWYgY2FsbGVkIG9uIGEgY29ubmVjdGlvbiB0aGF0IGlzbid0IGxvZ2dlZCBpbi5cbiAgICAvL1xuICAgIC8vIEByZXR1cm5zIE9iamVjdFxuICAgIC8vICAgSWYgc3VjY2Vzc2Z1bCwgcmV0dXJucyB7IHRva2VuOiA8bmV3IHRva2VuPiwgaWQ6IDx1c2VyIGlkPixcbiAgICAvLyAgIHRva2VuRXhwaXJlczogPGV4cGlyYXRpb24gZGF0ZT4gfS5cbiAgICBtZXRob2RzLmdldE5ld1Rva2VuID0gZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgdXNlciA9IGFjY291bnRzLnVzZXJzLmZpbmRPbmUodGhpcy51c2VySWQsIHtcbiAgICAgICAgZmllbGRzOiB7IFwic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zXCI6IDEgfVxuICAgICAgfSk7XG4gICAgICBpZiAoISB0aGlzLnVzZXJJZCB8fCAhIHVzZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIllvdSBhcmUgbm90IGxvZ2dlZCBpbi5cIik7XG4gICAgICB9XG4gICAgICAvLyBCZSBjYXJlZnVsIG5vdCB0byBnZW5lcmF0ZSBhIG5ldyB0b2tlbiB0aGF0IGhhcyBhIGxhdGVyXG4gICAgICAvLyBleHBpcmF0aW9uIHRoYW4gdGhlIGN1cnJlbiB0b2tlbi4gT3RoZXJ3aXNlLCBhIGJhZCBndXkgd2l0aCBhXG4gICAgICAvLyBzdG9sZW4gdG9rZW4gY291bGQgdXNlIHRoaXMgbWV0aG9kIHRvIHN0b3AgaGlzIHN0b2xlbiB0b2tlbiBmcm9tXG4gICAgICAvLyBldmVyIGV4cGlyaW5nLlxuICAgICAgY29uc3QgY3VycmVudEhhc2hlZFRva2VuID0gYWNjb3VudHMuX2dldExvZ2luVG9rZW4odGhpcy5jb25uZWN0aW9uLmlkKTtcbiAgICAgIGNvbnN0IGN1cnJlbnRTdGFtcGVkVG9rZW4gPSB1c2VyLnNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy5maW5kKFxuICAgICAgICBzdGFtcGVkVG9rZW4gPT4gc3RhbXBlZFRva2VuLmhhc2hlZFRva2VuID09PSBjdXJyZW50SGFzaGVkVG9rZW5cbiAgICAgICk7XG4gICAgICBpZiAoISBjdXJyZW50U3RhbXBlZFRva2VuKSB7IC8vIHNhZmV0eSBiZWx0OiB0aGlzIHNob3VsZCBuZXZlciBoYXBwZW5cbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIkludmFsaWQgbG9naW4gdG9rZW5cIik7XG4gICAgICB9XG4gICAgICBjb25zdCBuZXdTdGFtcGVkVG9rZW4gPSBhY2NvdW50cy5fZ2VuZXJhdGVTdGFtcGVkTG9naW5Ub2tlbigpO1xuICAgICAgbmV3U3RhbXBlZFRva2VuLndoZW4gPSBjdXJyZW50U3RhbXBlZFRva2VuLndoZW47XG4gICAgICBhY2NvdW50cy5faW5zZXJ0TG9naW5Ub2tlbih0aGlzLnVzZXJJZCwgbmV3U3RhbXBlZFRva2VuKTtcbiAgICAgIHJldHVybiBhY2NvdW50cy5fbG9naW5Vc2VyKHRoaXMsIHRoaXMudXNlcklkLCBuZXdTdGFtcGVkVG9rZW4pO1xuICAgIH07XG5cbiAgICAvLyBSZW1vdmVzIGFsbCB0b2tlbnMgZXhjZXB0IHRoZSB0b2tlbiBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnRcbiAgICAvLyBjb25uZWN0aW9uLiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIGNvbm5lY3Rpb24gaXMgbm90IGxvZ2dlZFxuICAgIC8vIGluLiBSZXR1cm5zIG5vdGhpbmcgb24gc3VjY2Vzcy5cbiAgICBtZXRob2RzLnJlbW92ZU90aGVyVG9rZW5zID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCEgdGhpcy51c2VySWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIllvdSBhcmUgbm90IGxvZ2dlZCBpbi5cIik7XG4gICAgICB9XG4gICAgICBjb25zdCBjdXJyZW50VG9rZW4gPSBhY2NvdW50cy5fZ2V0TG9naW5Ub2tlbih0aGlzLmNvbm5lY3Rpb24uaWQpO1xuICAgICAgYWNjb3VudHMudXNlcnMudXBkYXRlKHRoaXMudXNlcklkLCB7XG4gICAgICAgICRwdWxsOiB7XG4gICAgICAgICAgXCJzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnNcIjogeyBoYXNoZWRUb2tlbjogeyAkbmU6IGN1cnJlbnRUb2tlbiB9IH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8vIEFsbG93IGEgb25lLXRpbWUgY29uZmlndXJhdGlvbiBmb3IgYSBsb2dpbiBzZXJ2aWNlLiBNb2RpZmljYXRpb25zXG4gICAgLy8gdG8gdGhpcyBjb2xsZWN0aW9uIGFyZSBhbHNvIGFsbG93ZWQgaW4gaW5zZWN1cmUgbW9kZS5cbiAgICBtZXRob2RzLmNvbmZpZ3VyZUxvZ2luU2VydmljZSA9IChvcHRpb25zKSA9PiB7XG4gICAgICBjaGVjayhvcHRpb25zLCBNYXRjaC5PYmplY3RJbmNsdWRpbmcoe3NlcnZpY2U6IFN0cmluZ30pKTtcbiAgICAgIC8vIERvbid0IGxldCByYW5kb20gdXNlcnMgY29uZmlndXJlIGEgc2VydmljZSB3ZSBoYXZlbid0IGFkZGVkIHlldCAoc29cbiAgICAgIC8vIHRoYXQgd2hlbiB3ZSBkbyBsYXRlciBhZGQgaXQsIGl0J3Mgc2V0IHVwIHdpdGggdGhlaXIgY29uZmlndXJhdGlvblxuICAgICAgLy8gaW5zdGVhZCBvZiBvdXJzKS5cbiAgICAgIC8vIFhYWCBpZiBzZXJ2aWNlIGNvbmZpZ3VyYXRpb24gaXMgb2F1dGgtc3BlY2lmaWMgdGhlbiB0aGlzIGNvZGUgc2hvdWxkXG4gICAgICAvLyAgICAgYmUgaW4gYWNjb3VudHMtb2F1dGg7IGlmIGl0J3Mgbm90IHRoZW4gdGhlIHJlZ2lzdHJ5IHNob3VsZCBiZVxuICAgICAgLy8gICAgIGluIHRoaXMgcGFja2FnZVxuICAgICAgaWYgKCEoYWNjb3VudHMub2F1dGhcbiAgICAgICAgJiYgYWNjb3VudHMub2F1dGguc2VydmljZU5hbWVzKCkuaW5jbHVkZXMob3B0aW9ucy5zZXJ2aWNlKSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiU2VydmljZSB1bmtub3duXCIpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB7IFNlcnZpY2VDb25maWd1cmF0aW9uIH0gPSBQYWNrYWdlWydzZXJ2aWNlLWNvbmZpZ3VyYXRpb24nXTtcbiAgICAgIGlmIChTZXJ2aWNlQ29uZmlndXJhdGlvbi5jb25maWd1cmF0aW9ucy5maW5kT25lKHtzZXJ2aWNlOiBvcHRpb25zLnNlcnZpY2V9KSlcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIGBTZXJ2aWNlICR7b3B0aW9ucy5zZXJ2aWNlfSBhbHJlYWR5IGNvbmZpZ3VyZWRgKTtcblxuICAgICAgaWYgKGhhc093bi5jYWxsKG9wdGlvbnMsICdzZWNyZXQnKSAmJiB1c2luZ09BdXRoRW5jcnlwdGlvbigpKVxuICAgICAgICBvcHRpb25zLnNlY3JldCA9IE9BdXRoRW5jcnlwdGlvbi5zZWFsKG9wdGlvbnMuc2VjcmV0KTtcblxuICAgICAgU2VydmljZUNvbmZpZ3VyYXRpb24uY29uZmlndXJhdGlvbnMuaW5zZXJ0KG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICBhY2NvdW50cy5fc2VydmVyLm1ldGhvZHMobWV0aG9kcyk7XG4gIH07XG5cbiAgX2luaXRBY2NvdW50RGF0YUhvb2tzKCkge1xuICAgIHRoaXMuX3NlcnZlci5vbkNvbm5lY3Rpb24oY29ubmVjdGlvbiA9PiB7XG4gICAgICB0aGlzLl9hY2NvdW50RGF0YVtjb25uZWN0aW9uLmlkXSA9IHtcbiAgICAgICAgY29ubmVjdGlvbjogY29ubmVjdGlvblxuICAgICAgfTtcblxuICAgICAgY29ubmVjdGlvbi5vbkNsb3NlKCgpID0+IHtcbiAgICAgICAgdGhpcy5fcmVtb3ZlVG9rZW5Gcm9tQ29ubmVjdGlvbihjb25uZWN0aW9uLmlkKTtcbiAgICAgICAgZGVsZXRlIHRoaXMuX2FjY291bnREYXRhW2Nvbm5lY3Rpb24uaWRdO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgX2luaXRTZXJ2ZXJQdWJsaWNhdGlvbnMoKSB7XG4gICAgLy8gQnJpbmcgaW50byBsZXhpY2FsIHNjb3BlIGZvciBwdWJsaXNoIGNhbGxiYWNrcyB0aGF0IG5lZWQgYHRoaXNgXG4gICAgY29uc3QgeyB1c2VycywgX2F1dG9wdWJsaXNoRmllbGRzIH0gPSB0aGlzO1xuXG4gICAgLy8gUHVibGlzaCBhbGwgbG9naW4gc2VydmljZSBjb25maWd1cmF0aW9uIGZpZWxkcyBvdGhlciB0aGFuIHNlY3JldC5cbiAgICB0aGlzLl9zZXJ2ZXIucHVibGlzaChcIm1ldGVvci5sb2dpblNlcnZpY2VDb25maWd1cmF0aW9uXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IHsgU2VydmljZUNvbmZpZ3VyYXRpb24gfSA9IFBhY2thZ2VbJ3NlcnZpY2UtY29uZmlndXJhdGlvbiddO1xuICAgICAgcmV0dXJuIFNlcnZpY2VDb25maWd1cmF0aW9uLmNvbmZpZ3VyYXRpb25zLmZpbmQoe30sIHtmaWVsZHM6IHtzZWNyZXQ6IDB9fSk7XG4gICAgfSwge2lzX2F1dG86IHRydWV9KTsgLy8gbm90IHRlY2hpbmNhbGx5IGF1dG9wdWJsaXNoLCBidXQgc3RvcHMgdGhlIHdhcm5pbmcuXG5cbiAgICAvLyBQdWJsaXNoIHRoZSBjdXJyZW50IHVzZXIncyByZWNvcmQgdG8gdGhlIGNsaWVudC5cbiAgICB0aGlzLl9zZXJ2ZXIucHVibGlzaChudWxsLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy51c2VySWQpIHtcbiAgICAgICAgcmV0dXJuIHVzZXJzLmZpbmQoe1xuICAgICAgICAgIF9pZDogdGhpcy51c2VySWRcbiAgICAgICAgfSwge1xuICAgICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgcHJvZmlsZTogMSxcbiAgICAgICAgICAgIHVzZXJuYW1lOiAxLFxuICAgICAgICAgICAgZW1haWxzOiAxXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0sIC8qc3VwcHJlc3MgYXV0b3B1Ymxpc2ggd2FybmluZyove2lzX2F1dG86IHRydWV9KTtcblxuICAgIC8vIFVzZSBNZXRlb3Iuc3RhcnR1cCB0byBnaXZlIG90aGVyIHBhY2thZ2VzIGEgY2hhbmNlIHRvIGNhbGxcbiAgICAvLyBhZGRBdXRvcHVibGlzaEZpZWxkcy5cbiAgICBQYWNrYWdlLmF1dG9wdWJsaXNoICYmIE1ldGVvci5zdGFydHVwKCgpID0+IHtcbiAgICAgIC8vIFsncHJvZmlsZScsICd1c2VybmFtZSddIC0+IHtwcm9maWxlOiAxLCB1c2VybmFtZTogMX1cbiAgICAgIGNvbnN0IHRvRmllbGRTZWxlY3RvciA9IGZpZWxkcyA9PiBmaWVsZHMucmVkdWNlKChwcmV2LCBmaWVsZCkgPT4gKFxuICAgICAgICAgIHsgLi4ucHJldiwgW2ZpZWxkXTogMSB9KSxcbiAgICAgICAge31cbiAgICAgICk7XG4gICAgICB0aGlzLl9zZXJ2ZXIucHVibGlzaChudWxsLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnVzZXJJZCkge1xuICAgICAgICAgIHJldHVybiB1c2Vycy5maW5kKHsgX2lkOiB0aGlzLnVzZXJJZCB9LCB7XG4gICAgICAgICAgICBmaWVsZHM6IHRvRmllbGRTZWxlY3RvcihfYXV0b3B1Ymxpc2hGaWVsZHMubG9nZ2VkSW5Vc2VyKSxcbiAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9LCAvKnN1cHByZXNzIGF1dG9wdWJsaXNoIHdhcm5pbmcqL3tpc19hdXRvOiB0cnVlfSk7XG5cbiAgICAgIC8vIFhYWCB0aGlzIHB1Ymxpc2ggaXMgbmVpdGhlciBkZWR1cC1hYmxlIG5vciBpcyBpdCBvcHRpbWl6ZWQgYnkgb3VyIHNwZWNpYWxcbiAgICAgIC8vIHRyZWF0bWVudCBvZiBxdWVyaWVzIG9uIGEgc3BlY2lmaWMgX2lkLiBUaGVyZWZvcmUgdGhpcyB3aWxsIGhhdmUgTyhuXjIpXG4gICAgICAvLyBydW4tdGltZSBwZXJmb3JtYW5jZSBldmVyeSB0aW1lIGEgdXNlciBkb2N1bWVudCBpcyBjaGFuZ2VkIChlZyBzb21lb25lXG4gICAgICAvLyBsb2dnaW5nIGluKS4gSWYgdGhpcyBpcyBhIHByb2JsZW0sIHdlIGNhbiBpbnN0ZWFkIHdyaXRlIGEgbWFudWFsIHB1Ymxpc2hcbiAgICAgIC8vIGZ1bmN0aW9uIHdoaWNoIGZpbHRlcnMgb3V0IGZpZWxkcyBiYXNlZCBvbiAndGhpcy51c2VySWQnLlxuICAgICAgdGhpcy5fc2VydmVyLnB1Ymxpc2gobnVsbCwgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBzZWxlY3RvciA9IHRoaXMudXNlcklkID8geyBfaWQ6IHsgJG5lOiB0aGlzLnVzZXJJZCB9IH0gOiB7fTtcbiAgICAgICAgcmV0dXJuIHVzZXJzLmZpbmQoc2VsZWN0b3IsIHtcbiAgICAgICAgICBmaWVsZHM6IHRvRmllbGRTZWxlY3RvcihfYXV0b3B1Ymxpc2hGaWVsZHMub3RoZXJVc2VycyksXG4gICAgICAgIH0pXG4gICAgICB9LCAvKnN1cHByZXNzIGF1dG9wdWJsaXNoIHdhcm5pbmcqL3tpc19hdXRvOiB0cnVlfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQWRkIHRvIHRoZSBsaXN0IG9mIGZpZWxkcyBvciBzdWJmaWVsZHMgdG8gYmUgYXV0b21hdGljYWxseVxuICAvLyBwdWJsaXNoZWQgaWYgYXV0b3B1Ymxpc2ggaXMgb24uIE11c3QgYmUgY2FsbGVkIGZyb20gdG9wLWxldmVsXG4gIC8vIGNvZGUgKGllLCBiZWZvcmUgTWV0ZW9yLnN0YXJ0dXAgaG9va3MgcnVuKS5cbiAgLy9cbiAgLy8gQHBhcmFtIG9wdHMge09iamVjdH0gd2l0aDpcbiAgLy8gICAtIGZvckxvZ2dlZEluVXNlciB7QXJyYXl9IEFycmF5IG9mIGZpZWxkcyBwdWJsaXNoZWQgdG8gdGhlIGxvZ2dlZC1pbiB1c2VyXG4gIC8vICAgLSBmb3JPdGhlclVzZXJzIHtBcnJheX0gQXJyYXkgb2YgZmllbGRzIHB1Ymxpc2hlZCB0byB1c2VycyB0aGF0IGFyZW4ndCBsb2dnZWQgaW5cbiAgYWRkQXV0b3B1Ymxpc2hGaWVsZHMob3B0cykge1xuICAgIHRoaXMuX2F1dG9wdWJsaXNoRmllbGRzLmxvZ2dlZEluVXNlci5wdXNoLmFwcGx5KFxuICAgICAgdGhpcy5fYXV0b3B1Ymxpc2hGaWVsZHMubG9nZ2VkSW5Vc2VyLCBvcHRzLmZvckxvZ2dlZEluVXNlcik7XG4gICAgdGhpcy5fYXV0b3B1Ymxpc2hGaWVsZHMub3RoZXJVc2Vycy5wdXNoLmFwcGx5KFxuICAgICAgdGhpcy5fYXV0b3B1Ymxpc2hGaWVsZHMub3RoZXJVc2Vycywgb3B0cy5mb3JPdGhlclVzZXJzKTtcbiAgfTtcblxuICAvLy9cbiAgLy8vIEFDQ09VTlQgREFUQVxuICAvLy9cblxuICAvLyBIQUNLOiBUaGlzIGlzIHVzZWQgYnkgJ21ldGVvci1hY2NvdW50cycgdG8gZ2V0IHRoZSBsb2dpblRva2VuIGZvciBhXG4gIC8vIGNvbm5lY3Rpb24uIE1heWJlIHRoZXJlIHNob3VsZCBiZSBhIHB1YmxpYyB3YXkgdG8gZG8gdGhhdC5cbiAgX2dldEFjY291bnREYXRhKGNvbm5lY3Rpb25JZCwgZmllbGQpIHtcbiAgICBjb25zdCBkYXRhID0gdGhpcy5fYWNjb3VudERhdGFbY29ubmVjdGlvbklkXTtcbiAgICByZXR1cm4gZGF0YSAmJiBkYXRhW2ZpZWxkXTtcbiAgfTtcblxuICBfc2V0QWNjb3VudERhdGEoY29ubmVjdGlvbklkLCBmaWVsZCwgdmFsdWUpIHtcbiAgICBjb25zdCBkYXRhID0gdGhpcy5fYWNjb3VudERhdGFbY29ubmVjdGlvbklkXTtcblxuICAgIC8vIHNhZmV0eSBiZWx0LiBzaG91bGRuJ3QgaGFwcGVuLiBhY2NvdW50RGF0YSBpcyBzZXQgaW4gb25Db25uZWN0aW9uLFxuICAgIC8vIHdlIGRvbid0IGhhdmUgYSBjb25uZWN0aW9uSWQgdW50aWwgaXQgaXMgc2V0LlxuICAgIGlmICghZGF0YSlcbiAgICAgIHJldHVybjtcblxuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgZGVsZXRlIGRhdGFbZmllbGRdO1xuICAgIGVsc2VcbiAgICAgIGRhdGFbZmllbGRdID0gdmFsdWU7XG4gIH07XG5cbiAgLy8vXG4gIC8vLyBSRUNPTk5FQ1QgVE9LRU5TXG4gIC8vL1xuICAvLy8gc3VwcG9ydCByZWNvbm5lY3RpbmcgdXNpbmcgYSBtZXRlb3IgbG9naW4gdG9rZW5cblxuICBfaGFzaExvZ2luVG9rZW4obG9naW5Ub2tlbikge1xuICAgIGNvbnN0IGhhc2ggPSBjcnlwdG8uY3JlYXRlSGFzaCgnc2hhMjU2Jyk7XG4gICAgaGFzaC51cGRhdGUobG9naW5Ub2tlbik7XG4gICAgcmV0dXJuIGhhc2guZGlnZXN0KCdiYXNlNjQnKTtcbiAgfTtcblxuICAvLyB7dG9rZW4sIHdoZW59ID0+IHtoYXNoZWRUb2tlbiwgd2hlbn1cbiAgX2hhc2hTdGFtcGVkVG9rZW4oc3RhbXBlZFRva2VuKSB7XG4gICAgY29uc3QgaGFzaGVkU3RhbXBlZFRva2VuID0gT2JqZWN0LmtleXMoc3RhbXBlZFRva2VuKS5yZWR1Y2UoXG4gICAgICAocHJldiwga2V5KSA9PiBrZXkgPT09ICd0b2tlbicgP1xuICAgICAgICBwcmV2IDpcbiAgICAgICAgeyAuLi5wcmV2LCBba2V5XTogc3RhbXBlZFRva2VuW2tleV0gfSxcbiAgICAgIHt9LFxuICAgIClcbiAgICByZXR1cm4ge1xuICAgICAgLi4uaGFzaGVkU3RhbXBlZFRva2VuLFxuICAgICAgaGFzaGVkVG9rZW46IHRoaXMuX2hhc2hMb2dpblRva2VuKHN0YW1wZWRUb2tlbi50b2tlbilcbiAgICB9O1xuICB9O1xuXG4gIC8vIFVzaW5nICRhZGRUb1NldCBhdm9pZHMgZ2V0dGluZyBhbiBpbmRleCBlcnJvciBpZiBhbm90aGVyIGNsaWVudFxuICAvLyBsb2dnaW5nIGluIHNpbXVsdGFuZW91c2x5IGhhcyBhbHJlYWR5IGluc2VydGVkIHRoZSBuZXcgaGFzaGVkXG4gIC8vIHRva2VuLlxuICBfaW5zZXJ0SGFzaGVkTG9naW5Ub2tlbih1c2VySWQsIGhhc2hlZFRva2VuLCBxdWVyeSkge1xuICAgIHF1ZXJ5ID0gcXVlcnkgPyB7IC4uLnF1ZXJ5IH0gOiB7fTtcbiAgICBxdWVyeS5faWQgPSB1c2VySWQ7XG4gICAgdGhpcy51c2Vycy51cGRhdGUocXVlcnksIHtcbiAgICAgICRhZGRUb1NldDoge1xuICAgICAgICBcInNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vuc1wiOiBoYXNoZWRUb2tlblxuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIC8vIEV4cG9ydGVkIGZvciB0ZXN0cy5cbiAgX2luc2VydExvZ2luVG9rZW4odXNlcklkLCBzdGFtcGVkVG9rZW4sIHF1ZXJ5KSB7XG4gICAgdGhpcy5faW5zZXJ0SGFzaGVkTG9naW5Ub2tlbihcbiAgICAgIHVzZXJJZCxcbiAgICAgIHRoaXMuX2hhc2hTdGFtcGVkVG9rZW4oc3RhbXBlZFRva2VuKSxcbiAgICAgIHF1ZXJ5XG4gICAgKTtcbiAgfTtcblxuICBfY2xlYXJBbGxMb2dpblRva2Vucyh1c2VySWQpIHtcbiAgICB0aGlzLnVzZXJzLnVwZGF0ZSh1c2VySWQsIHtcbiAgICAgICRzZXQ6IHtcbiAgICAgICAgJ3NlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucyc6IFtdXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gdGVzdCBob29rXG4gIF9nZXRVc2VyT2JzZXJ2ZShjb25uZWN0aW9uSWQpIHtcbiAgICByZXR1cm4gdGhpcy5fdXNlck9ic2VydmVzRm9yQ29ubmVjdGlvbnNbY29ubmVjdGlvbklkXTtcbiAgfTtcblxuICAvLyBDbGVhbiB1cCB0aGlzIGNvbm5lY3Rpb24ncyBhc3NvY2lhdGlvbiB3aXRoIHRoZSB0b2tlbjogdGhhdCBpcywgc3RvcFxuICAvLyB0aGUgb2JzZXJ2ZSB0aGF0IHdlIHN0YXJ0ZWQgd2hlbiB3ZSBhc3NvY2lhdGVkIHRoZSBjb25uZWN0aW9uIHdpdGhcbiAgLy8gdGhpcyB0b2tlbi5cbiAgX3JlbW92ZVRva2VuRnJvbUNvbm5lY3Rpb24oY29ubmVjdGlvbklkKSB7XG4gICAgaWYgKGhhc093bi5jYWxsKHRoaXMuX3VzZXJPYnNlcnZlc0ZvckNvbm5lY3Rpb25zLCBjb25uZWN0aW9uSWQpKSB7XG4gICAgICBjb25zdCBvYnNlcnZlID0gdGhpcy5fdXNlck9ic2VydmVzRm9yQ29ubmVjdGlvbnNbY29ubmVjdGlvbklkXTtcbiAgICAgIGlmICh0eXBlb2Ygb2JzZXJ2ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgLy8gV2UncmUgaW4gdGhlIHByb2Nlc3Mgb2Ygc2V0dGluZyB1cCBhbiBvYnNlcnZlIGZvciB0aGlzIGNvbm5lY3Rpb24uIFdlXG4gICAgICAgIC8vIGNhbid0IGNsZWFuIHVwIHRoYXQgb2JzZXJ2ZSB5ZXQsIGJ1dCBpZiB3ZSBkZWxldGUgdGhlIHBsYWNlaG9sZGVyIGZvclxuICAgICAgICAvLyB0aGlzIGNvbm5lY3Rpb24sIHRoZW4gdGhlIG9ic2VydmUgd2lsbCBnZXQgY2xlYW5lZCB1cCBhcyBzb29uIGFzIGl0IGhhc1xuICAgICAgICAvLyBiZWVuIHNldCB1cC5cbiAgICAgICAgZGVsZXRlIHRoaXMuX3VzZXJPYnNlcnZlc0ZvckNvbm5lY3Rpb25zW2Nvbm5lY3Rpb25JZF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWxldGUgdGhpcy5fdXNlck9ic2VydmVzRm9yQ29ubmVjdGlvbnNbY29ubmVjdGlvbklkXTtcbiAgICAgICAgb2JzZXJ2ZS5zdG9wKCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIF9nZXRMb2dpblRva2VuKGNvbm5lY3Rpb25JZCkge1xuICAgIHJldHVybiB0aGlzLl9nZXRBY2NvdW50RGF0YShjb25uZWN0aW9uSWQsICdsb2dpblRva2VuJyk7XG4gIH07XG5cbiAgLy8gbmV3VG9rZW4gaXMgYSBoYXNoZWQgdG9rZW4uXG4gIF9zZXRMb2dpblRva2VuKHVzZXJJZCwgY29ubmVjdGlvbiwgbmV3VG9rZW4pIHtcbiAgICB0aGlzLl9yZW1vdmVUb2tlbkZyb21Db25uZWN0aW9uKGNvbm5lY3Rpb24uaWQpO1xuICAgIHRoaXMuX3NldEFjY291bnREYXRhKGNvbm5lY3Rpb24uaWQsICdsb2dpblRva2VuJywgbmV3VG9rZW4pO1xuXG4gICAgaWYgKG5ld1Rva2VuKSB7XG4gICAgICAvLyBTZXQgdXAgYW4gb2JzZXJ2ZSBmb3IgdGhpcyB0b2tlbi4gSWYgdGhlIHRva2VuIGdvZXMgYXdheSwgd2UgbmVlZFxuICAgICAgLy8gdG8gY2xvc2UgdGhlIGNvbm5lY3Rpb24uICBXZSBkZWZlciB0aGUgb2JzZXJ2ZSBiZWNhdXNlIHRoZXJlJ3NcbiAgICAgIC8vIG5vIG5lZWQgZm9yIGl0IHRvIGJlIG9uIHRoZSBjcml0aWNhbCBwYXRoIGZvciBsb2dpbjsgd2UganVzdCBuZWVkXG4gICAgICAvLyB0byBlbnN1cmUgdGhhdCB0aGUgY29ubmVjdGlvbiB3aWxsIGdldCBjbG9zZWQgYXQgc29tZSBwb2ludCBpZlxuICAgICAgLy8gdGhlIHRva2VuIGdldHMgZGVsZXRlZC5cbiAgICAgIC8vXG4gICAgICAvLyBJbml0aWFsbHksIHdlIHNldCB0aGUgb2JzZXJ2ZSBmb3IgdGhpcyBjb25uZWN0aW9uIHRvIGEgbnVtYmVyOyB0aGlzXG4gICAgICAvLyBzaWduaWZpZXMgdG8gb3RoZXIgY29kZSAod2hpY2ggbWlnaHQgcnVuIHdoaWxlIHdlIHlpZWxkKSB0aGF0IHdlIGFyZSBpblxuICAgICAgLy8gdGhlIHByb2Nlc3Mgb2Ygc2V0dGluZyB1cCBhbiBvYnNlcnZlIGZvciB0aGlzIGNvbm5lY3Rpb24uIE9uY2UgdGhlXG4gICAgICAvLyBvYnNlcnZlIGlzIHJlYWR5IHRvIGdvLCB3ZSByZXBsYWNlIHRoZSBudW1iZXIgd2l0aCB0aGUgcmVhbCBvYnNlcnZlXG4gICAgICAvLyBoYW5kbGUgKHVubGVzcyB0aGUgcGxhY2Vob2xkZXIgaGFzIGJlZW4gZGVsZXRlZCBvciByZXBsYWNlZCBieSBhXG4gICAgICAvLyBkaWZmZXJlbnQgcGxhY2Vob2xkIG51bWJlciwgc2lnbmlmeWluZyB0aGF0IHRoZSBjb25uZWN0aW9uIHdhcyBjbG9zZWRcbiAgICAgIC8vIGFscmVhZHkgLS0gaW4gdGhpcyBjYXNlIHdlIGp1c3QgY2xlYW4gdXAgdGhlIG9ic2VydmUgdGhhdCB3ZSBzdGFydGVkKS5cbiAgICAgIGNvbnN0IG15T2JzZXJ2ZU51bWJlciA9ICsrdGhpcy5fbmV4dFVzZXJPYnNlcnZlTnVtYmVyO1xuICAgICAgdGhpcy5fdXNlck9ic2VydmVzRm9yQ29ubmVjdGlvbnNbY29ubmVjdGlvbi5pZF0gPSBteU9ic2VydmVOdW1iZXI7XG4gICAgICBNZXRlb3IuZGVmZXIoKCkgPT4ge1xuICAgICAgICAvLyBJZiBzb21ldGhpbmcgZWxzZSBoYXBwZW5lZCBvbiB0aGlzIGNvbm5lY3Rpb24gaW4gdGhlIG1lYW50aW1lIChpdCBnb3RcbiAgICAgICAgLy8gY2xvc2VkLCBvciBhbm90aGVyIGNhbGwgdG8gX3NldExvZ2luVG9rZW4gaGFwcGVuZWQpLCBqdXN0IGRvXG4gICAgICAgIC8vIG5vdGhpbmcuIFdlIGRvbid0IG5lZWQgdG8gc3RhcnQgYW4gb2JzZXJ2ZSBmb3IgYW4gb2xkIGNvbm5lY3Rpb24gb3Igb2xkXG4gICAgICAgIC8vIHRva2VuLlxuICAgICAgICBpZiAodGhpcy5fdXNlck9ic2VydmVzRm9yQ29ubmVjdGlvbnNbY29ubmVjdGlvbi5pZF0gIT09IG15T2JzZXJ2ZU51bWJlcikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBmb3VuZE1hdGNoaW5nVXNlcjtcbiAgICAgICAgLy8gQmVjYXVzZSB3ZSB1cGdyYWRlIHVuaGFzaGVkIGxvZ2luIHRva2VucyB0byBoYXNoZWQgdG9rZW5zIGF0XG4gICAgICAgIC8vIGxvZ2luIHRpbWUsIHNlc3Npb25zIHdpbGwgb25seSBiZSBsb2dnZWQgaW4gd2l0aCBhIGhhc2hlZFxuICAgICAgICAvLyB0b2tlbi4gVGh1cyB3ZSBvbmx5IG5lZWQgdG8gb2JzZXJ2ZSBoYXNoZWQgdG9rZW5zIGhlcmUuXG4gICAgICAgIGNvbnN0IG9ic2VydmUgPSB0aGlzLnVzZXJzLmZpbmQoe1xuICAgICAgICAgIF9pZDogdXNlcklkLFxuICAgICAgICAgICdzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMuaGFzaGVkVG9rZW4nOiBuZXdUb2tlblxuICAgICAgICB9LCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KS5vYnNlcnZlQ2hhbmdlcyh7XG4gICAgICAgICAgYWRkZWQ6ICgpID0+IHtcbiAgICAgICAgICAgIGZvdW5kTWF0Y2hpbmdVc2VyID0gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlbW92ZWQ6IGNvbm5lY3Rpb24uY2xvc2UsXG4gICAgICAgICAgLy8gVGhlIG9uQ2xvc2UgY2FsbGJhY2sgZm9yIHRoZSBjb25uZWN0aW9uIHRha2VzIGNhcmUgb2ZcbiAgICAgICAgICAvLyBjbGVhbmluZyB1cCB0aGUgb2JzZXJ2ZSBoYW5kbGUgYW5kIGFueSBvdGhlciBzdGF0ZSB3ZSBoYXZlXG4gICAgICAgICAgLy8gbHlpbmcgYXJvdW5kLlxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBJZiB0aGUgdXNlciByYW4gYW5vdGhlciBsb2dpbiBvciBsb2dvdXQgY29tbWFuZCB3ZSB3ZXJlIHdhaXRpbmcgZm9yIHRoZVxuICAgICAgICAvLyBkZWZlciBvciBhZGRlZCB0byBmaXJlIChpZSwgYW5vdGhlciBjYWxsIHRvIF9zZXRMb2dpblRva2VuIG9jY3VycmVkKSxcbiAgICAgICAgLy8gdGhlbiB3ZSBsZXQgdGhlIGxhdGVyIG9uZSB3aW4gKHN0YXJ0IGFuIG9ic2VydmUsIGV0YykgYW5kIGp1c3Qgc3RvcCBvdXJcbiAgICAgICAgLy8gb2JzZXJ2ZSBub3cuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFNpbWlsYXJseSwgaWYgdGhlIGNvbm5lY3Rpb24gd2FzIGFscmVhZHkgY2xvc2VkLCB0aGVuIHRoZSBvbkNsb3NlXG4gICAgICAgIC8vIGNhbGxiYWNrIHdvdWxkIGhhdmUgY2FsbGVkIF9yZW1vdmVUb2tlbkZyb21Db25uZWN0aW9uIGFuZCB0aGVyZSB3b24ndFxuICAgICAgICAvLyBiZSBhbiBlbnRyeSBpbiBfdXNlck9ic2VydmVzRm9yQ29ubmVjdGlvbnMuIFdlIGNhbiBzdG9wIHRoZSBvYnNlcnZlLlxuICAgICAgICBpZiAodGhpcy5fdXNlck9ic2VydmVzRm9yQ29ubmVjdGlvbnNbY29ubmVjdGlvbi5pZF0gIT09IG15T2JzZXJ2ZU51bWJlcikge1xuICAgICAgICAgIG9ic2VydmUuc3RvcCgpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3VzZXJPYnNlcnZlc0ZvckNvbm5lY3Rpb25zW2Nvbm5lY3Rpb24uaWRdID0gb2JzZXJ2ZTtcblxuICAgICAgICBpZiAoISBmb3VuZE1hdGNoaW5nVXNlcikge1xuICAgICAgICAgIC8vIFdlJ3ZlIHNldCB1cCBhbiBvYnNlcnZlIG9uIHRoZSB1c2VyIGFzc29jaWF0ZWQgd2l0aCBgbmV3VG9rZW5gLFxuICAgICAgICAgIC8vIHNvIGlmIHRoZSBuZXcgdG9rZW4gaXMgcmVtb3ZlZCBmcm9tIHRoZSBkYXRhYmFzZSwgd2UnbGwgY2xvc2VcbiAgICAgICAgICAvLyB0aGUgY29ubmVjdGlvbi4gQnV0IHRoZSB0b2tlbiBtaWdodCBoYXZlIGFscmVhZHkgYmVlbiBkZWxldGVkXG4gICAgICAgICAgLy8gYmVmb3JlIHdlIHNldCB1cCB0aGUgb2JzZXJ2ZSwgd2hpY2ggd291bGRuJ3QgaGF2ZSBjbG9zZWQgdGhlXG4gICAgICAgICAgLy8gY29ubmVjdGlvbiBiZWNhdXNlIHRoZSBvYnNlcnZlIHdhc24ndCBydW5uaW5nIHlldC5cbiAgICAgICAgICBjb25uZWN0aW9uLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAvLyAoQWxzbyB1c2VkIGJ5IE1ldGVvciBBY2NvdW50cyBzZXJ2ZXIgYW5kIHRlc3RzKS5cbiAgLy9cbiAgX2dlbmVyYXRlU3RhbXBlZExvZ2luVG9rZW4oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRva2VuOiBSYW5kb20uc2VjcmV0KCksXG4gICAgICB3aGVuOiBuZXcgRGF0ZVxuICAgIH07XG4gIH07XG5cbiAgLy8vXG4gIC8vLyBUT0tFTiBFWFBJUkFUSU9OXG4gIC8vL1xuXG4gIC8vIERlbGV0ZXMgZXhwaXJlZCBwYXNzd29yZCByZXNldCB0b2tlbnMgZnJvbSB0aGUgZGF0YWJhc2UuXG4gIC8vXG4gIC8vIEV4cG9ydGVkIGZvciB0ZXN0cy4gQWxzbywgdGhlIGFyZ3VtZW50cyBhcmUgb25seSB1c2VkIGJ5XG4gIC8vIHRlc3RzLiBvbGRlc3RWYWxpZERhdGUgaXMgc2ltdWxhdGUgZXhwaXJpbmcgdG9rZW5zIHdpdGhvdXQgd2FpdGluZ1xuICAvLyBmb3IgdGhlbSB0byBhY3R1YWxseSBleHBpcmUuIHVzZXJJZCBpcyB1c2VkIGJ5IHRlc3RzIHRvIG9ubHkgZXhwaXJlXG4gIC8vIHRva2VucyBmb3IgdGhlIHRlc3QgdXNlci5cbiAgX2V4cGlyZVBhc3N3b3JkUmVzZXRUb2tlbnMob2xkZXN0VmFsaWREYXRlLCB1c2VySWQpIHtcbiAgICBjb25zdCB0b2tlbkxpZmV0aW1lTXMgPSB0aGlzLl9nZXRQYXNzd29yZFJlc2V0VG9rZW5MaWZldGltZU1zKCk7XG5cbiAgICAvLyB3aGVuIGNhbGxpbmcgZnJvbSBhIHRlc3Qgd2l0aCBleHRyYSBhcmd1bWVudHMsIHlvdSBtdXN0IHNwZWNpZnkgYm90aCFcbiAgICBpZiAoKG9sZGVzdFZhbGlkRGF0ZSAmJiAhdXNlcklkKSB8fCAoIW9sZGVzdFZhbGlkRGF0ZSAmJiB1c2VySWQpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCYWQgdGVzdC4gTXVzdCBzcGVjaWZ5IGJvdGggb2xkZXN0VmFsaWREYXRlIGFuZCB1c2VySWQuXCIpO1xuICAgIH1cblxuICAgIG9sZGVzdFZhbGlkRGF0ZSA9IG9sZGVzdFZhbGlkRGF0ZSB8fFxuICAgICAgKG5ldyBEYXRlKG5ldyBEYXRlKCkgLSB0b2tlbkxpZmV0aW1lTXMpKTtcblxuICAgIGNvbnN0IHRva2VuRmlsdGVyID0ge1xuICAgICAgJG9yOiBbXG4gICAgICAgIHsgXCJzZXJ2aWNlcy5wYXNzd29yZC5yZXNldC5yZWFzb25cIjogXCJyZXNldFwifSxcbiAgICAgICAgeyBcInNlcnZpY2VzLnBhc3N3b3JkLnJlc2V0LnJlYXNvblwiOiB7JGV4aXN0czogZmFsc2V9fVxuICAgICAgXVxuICAgIH07XG5cbiAgICBleHBpcmVQYXNzd29yZFRva2VuKHRoaXMsIG9sZGVzdFZhbGlkRGF0ZSwgdG9rZW5GaWx0ZXIsIHVzZXJJZCk7XG4gIH1cblxuICAvLyBEZWxldGVzIGV4cGlyZWQgcGFzc3dvcmQgZW5yb2xsIHRva2VucyBmcm9tIHRoZSBkYXRhYmFzZS5cbiAgLy9cbiAgLy8gRXhwb3J0ZWQgZm9yIHRlc3RzLiBBbHNvLCB0aGUgYXJndW1lbnRzIGFyZSBvbmx5IHVzZWQgYnlcbiAgLy8gdGVzdHMuIG9sZGVzdFZhbGlkRGF0ZSBpcyBzaW11bGF0ZSBleHBpcmluZyB0b2tlbnMgd2l0aG91dCB3YWl0aW5nXG4gIC8vIGZvciB0aGVtIHRvIGFjdHVhbGx5IGV4cGlyZS4gdXNlcklkIGlzIHVzZWQgYnkgdGVzdHMgdG8gb25seSBleHBpcmVcbiAgLy8gdG9rZW5zIGZvciB0aGUgdGVzdCB1c2VyLlxuICBfZXhwaXJlUGFzc3dvcmRFbnJvbGxUb2tlbnMob2xkZXN0VmFsaWREYXRlLCB1c2VySWQpIHtcbiAgICBjb25zdCB0b2tlbkxpZmV0aW1lTXMgPSB0aGlzLl9nZXRQYXNzd29yZEVucm9sbFRva2VuTGlmZXRpbWVNcygpO1xuXG4gICAgLy8gd2hlbiBjYWxsaW5nIGZyb20gYSB0ZXN0IHdpdGggZXh0cmEgYXJndW1lbnRzLCB5b3UgbXVzdCBzcGVjaWZ5IGJvdGghXG4gICAgaWYgKChvbGRlc3RWYWxpZERhdGUgJiYgIXVzZXJJZCkgfHwgKCFvbGRlc3RWYWxpZERhdGUgJiYgdXNlcklkKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmFkIHRlc3QuIE11c3Qgc3BlY2lmeSBib3RoIG9sZGVzdFZhbGlkRGF0ZSBhbmQgdXNlcklkLlwiKTtcbiAgICB9XG5cbiAgICBvbGRlc3RWYWxpZERhdGUgPSBvbGRlc3RWYWxpZERhdGUgfHxcbiAgICAgIChuZXcgRGF0ZShuZXcgRGF0ZSgpIC0gdG9rZW5MaWZldGltZU1zKSk7XG5cbiAgICBjb25zdCB0b2tlbkZpbHRlciA9IHtcbiAgICAgIFwic2VydmljZXMucGFzc3dvcmQucmVzZXQucmVhc29uXCI6IFwiZW5yb2xsXCJcbiAgICB9O1xuXG4gICAgZXhwaXJlUGFzc3dvcmRUb2tlbih0aGlzLCBvbGRlc3RWYWxpZERhdGUsIHRva2VuRmlsdGVyLCB1c2VySWQpO1xuICB9XG5cbiAgLy8gRGVsZXRlcyBleHBpcmVkIHRva2VucyBmcm9tIHRoZSBkYXRhYmFzZSBhbmQgY2xvc2VzIGFsbCBvcGVuIGNvbm5lY3Rpb25zXG4gIC8vIGFzc29jaWF0ZWQgd2l0aCB0aGVzZSB0b2tlbnMuXG4gIC8vXG4gIC8vIEV4cG9ydGVkIGZvciB0ZXN0cy4gQWxzbywgdGhlIGFyZ3VtZW50cyBhcmUgb25seSB1c2VkIGJ5XG4gIC8vIHRlc3RzLiBvbGRlc3RWYWxpZERhdGUgaXMgc2ltdWxhdGUgZXhwaXJpbmcgdG9rZW5zIHdpdGhvdXQgd2FpdGluZ1xuICAvLyBmb3IgdGhlbSB0byBhY3R1YWxseSBleHBpcmUuIHVzZXJJZCBpcyB1c2VkIGJ5IHRlc3RzIHRvIG9ubHkgZXhwaXJlXG4gIC8vIHRva2VucyBmb3IgdGhlIHRlc3QgdXNlci5cbiAgX2V4cGlyZVRva2VucyhvbGRlc3RWYWxpZERhdGUsIHVzZXJJZCkge1xuICAgIGNvbnN0IHRva2VuTGlmZXRpbWVNcyA9IHRoaXMuX2dldFRva2VuTGlmZXRpbWVNcygpO1xuXG4gICAgLy8gd2hlbiBjYWxsaW5nIGZyb20gYSB0ZXN0IHdpdGggZXh0cmEgYXJndW1lbnRzLCB5b3UgbXVzdCBzcGVjaWZ5IGJvdGghXG4gICAgaWYgKChvbGRlc3RWYWxpZERhdGUgJiYgIXVzZXJJZCkgfHwgKCFvbGRlc3RWYWxpZERhdGUgJiYgdXNlcklkKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmFkIHRlc3QuIE11c3Qgc3BlY2lmeSBib3RoIG9sZGVzdFZhbGlkRGF0ZSBhbmQgdXNlcklkLlwiKTtcbiAgICB9XG5cbiAgICBvbGRlc3RWYWxpZERhdGUgPSBvbGRlc3RWYWxpZERhdGUgfHxcbiAgICAgIChuZXcgRGF0ZShuZXcgRGF0ZSgpIC0gdG9rZW5MaWZldGltZU1zKSk7XG4gICAgY29uc3QgdXNlckZpbHRlciA9IHVzZXJJZCA/IHtfaWQ6IHVzZXJJZH0gOiB7fTtcblxuXG4gICAgLy8gQmFja3dhcmRzIGNvbXBhdGlibGUgd2l0aCBvbGRlciB2ZXJzaW9ucyBvZiBtZXRlb3IgdGhhdCBzdG9yZWQgbG9naW4gdG9rZW5cbiAgICAvLyB0aW1lc3RhbXBzIGFzIG51bWJlcnMuXG4gICAgdGhpcy51c2Vycy51cGRhdGUoeyAuLi51c2VyRmlsdGVyLFxuICAgICAgJG9yOiBbXG4gICAgICAgIHsgXCJzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMud2hlblwiOiB7ICRsdDogb2xkZXN0VmFsaWREYXRlIH0gfSxcbiAgICAgICAgeyBcInNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy53aGVuXCI6IHsgJGx0OiArb2xkZXN0VmFsaWREYXRlIH0gfVxuICAgICAgXVxuICAgIH0sIHtcbiAgICAgICRwdWxsOiB7XG4gICAgICAgIFwic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zXCI6IHtcbiAgICAgICAgICAkb3I6IFtcbiAgICAgICAgICAgIHsgd2hlbjogeyAkbHQ6IG9sZGVzdFZhbGlkRGF0ZSB9IH0sXG4gICAgICAgICAgICB7IHdoZW46IHsgJGx0OiArb2xkZXN0VmFsaWREYXRlIH0gfVxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIHsgbXVsdGk6IHRydWUgfSk7XG4gICAgLy8gVGhlIG9ic2VydmUgb24gTWV0ZW9yLnVzZXJzIHdpbGwgdGFrZSBjYXJlIG9mIGNsb3NpbmcgY29ubmVjdGlvbnMgZm9yXG4gICAgLy8gZXhwaXJlZCB0b2tlbnMuXG4gIH07XG5cbiAgLy8gQG92ZXJyaWRlIGZyb20gYWNjb3VudHNfY29tbW9uLmpzXG4gIGNvbmZpZyhvcHRpb25zKSB7XG4gICAgLy8gQ2FsbCB0aGUgb3ZlcnJpZGRlbiBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgbWV0aG9kLlxuICAgIGNvbnN0IHN1cGVyUmVzdWx0ID0gQWNjb3VudHNDb21tb24ucHJvdG90eXBlLmNvbmZpZy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgLy8gSWYgdGhlIHVzZXIgc2V0IGxvZ2luRXhwaXJhdGlvbkluRGF5cyB0byBudWxsLCB0aGVuIHdlIG5lZWQgdG8gY2xlYXIgdGhlXG4gICAgLy8gdGltZXIgdGhhdCBwZXJpb2RpY2FsbHkgZXhwaXJlcyB0b2tlbnMuXG4gICAgaWYgKGhhc093bi5jYWxsKHRoaXMuX29wdGlvbnMsICdsb2dpbkV4cGlyYXRpb25JbkRheXMnKSAmJlxuICAgICAgdGhpcy5fb3B0aW9ucy5sb2dpbkV4cGlyYXRpb25JbkRheXMgPT09IG51bGwgJiZcbiAgICAgIHRoaXMuZXhwaXJlVG9rZW5JbnRlcnZhbCkge1xuICAgICAgTWV0ZW9yLmNsZWFySW50ZXJ2YWwodGhpcy5leHBpcmVUb2tlbkludGVydmFsKTtcbiAgICAgIHRoaXMuZXhwaXJlVG9rZW5JbnRlcnZhbCA9IG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1cGVyUmVzdWx0O1xuICB9O1xuXG4gIC8vIENhbGxlZCBieSBhY2NvdW50cy1wYXNzd29yZFxuICBpbnNlcnRVc2VyRG9jKG9wdGlvbnMsIHVzZXIpIHtcbiAgICAvLyAtIGNsb25lIHVzZXIgZG9jdW1lbnQsIHRvIHByb3RlY3QgZnJvbSBtb2RpZmljYXRpb25cbiAgICAvLyAtIGFkZCBjcmVhdGVkQXQgdGltZXN0YW1wXG4gICAgLy8gLSBwcmVwYXJlIGFuIF9pZCwgc28gdGhhdCB5b3UgY2FuIG1vZGlmeSBvdGhlciBjb2xsZWN0aW9ucyAoZWdcbiAgICAvLyBjcmVhdGUgYSBmaXJzdCB0YXNrIGZvciBldmVyeSBuZXcgdXNlcilcbiAgICAvL1xuICAgIC8vIFhYWCBJZiB0aGUgb25DcmVhdGVVc2VyIG9yIHZhbGlkYXRlTmV3VXNlciBob29rcyBmYWlsLCB3ZSBtaWdodFxuICAgIC8vIGVuZCB1cCBoYXZpbmcgbW9kaWZpZWQgc29tZSBvdGhlciBjb2xsZWN0aW9uXG4gICAgLy8gaW5hcHByb3ByaWF0ZWx5LiBUaGUgc29sdXRpb24gaXMgcHJvYmFibHkgdG8gaGF2ZSBvbkNyZWF0ZVVzZXJcbiAgICAvLyBhY2NlcHQgdHdvIGNhbGxiYWNrcyAtIG9uZSB0aGF0IGdldHMgY2FsbGVkIGJlZm9yZSBpbnNlcnRpbmdcbiAgICAvLyB0aGUgdXNlciBkb2N1bWVudCAoaW4gd2hpY2ggeW91IGNhbiBtb2RpZnkgaXRzIGNvbnRlbnRzKSwgYW5kXG4gICAgLy8gb25lIHRoYXQgZ2V0cyBjYWxsZWQgYWZ0ZXIgKGluIHdoaWNoIHlvdSBzaG91bGQgY2hhbmdlIG90aGVyXG4gICAgLy8gY29sbGVjdGlvbnMpXG4gICAgdXNlciA9IHtcbiAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICAgIF9pZDogUmFuZG9tLmlkKCksXG4gICAgICAuLi51c2VyLFxuICAgIH07XG5cbiAgICBpZiAodXNlci5zZXJ2aWNlcykge1xuICAgICAgT2JqZWN0LmtleXModXNlci5zZXJ2aWNlcykuZm9yRWFjaChzZXJ2aWNlID0+XG4gICAgICAgIHBpbkVuY3J5cHRlZEZpZWxkc1RvVXNlcih1c2VyLnNlcnZpY2VzW3NlcnZpY2VdLCB1c2VyLl9pZClcbiAgICAgICk7XG4gICAgfVxuXG4gICAgbGV0IGZ1bGxVc2VyO1xuICAgIGlmICh0aGlzLl9vbkNyZWF0ZVVzZXJIb29rKSB7XG4gICAgICBmdWxsVXNlciA9IHRoaXMuX29uQ3JlYXRlVXNlckhvb2sob3B0aW9ucywgdXNlcik7XG5cbiAgICAgIC8vIFRoaXMgaXMgKm5vdCogcGFydCBvZiB0aGUgQVBJLiBXZSBuZWVkIHRoaXMgYmVjYXVzZSB3ZSBjYW4ndCBpc29sYXRlXG4gICAgICAvLyB0aGUgZ2xvYmFsIHNlcnZlciBlbnZpcm9ubWVudCBiZXR3ZWVuIHRlc3RzLCBtZWFuaW5nIHdlIGNhbid0IHRlc3RcbiAgICAgIC8vIGJvdGggaGF2aW5nIGEgY3JlYXRlIHVzZXIgaG9vayBzZXQgYW5kIG5vdCBoYXZpbmcgb25lIHNldC5cbiAgICAgIGlmIChmdWxsVXNlciA9PT0gJ1RFU1QgREVGQVVMVCBIT09LJylcbiAgICAgICAgZnVsbFVzZXIgPSBkZWZhdWx0Q3JlYXRlVXNlckhvb2sob3B0aW9ucywgdXNlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZ1bGxVc2VyID0gZGVmYXVsdENyZWF0ZVVzZXJIb29rKG9wdGlvbnMsIHVzZXIpO1xuICAgIH1cblxuICAgIHRoaXMuX3ZhbGlkYXRlTmV3VXNlckhvb2tzLmZvckVhY2goaG9vayA9PiB7XG4gICAgICBpZiAoISBob29rKGZ1bGxVc2VyKSlcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiVXNlciB2YWxpZGF0aW9uIGZhaWxlZFwiKTtcbiAgICB9KTtcblxuICAgIGxldCB1c2VySWQ7XG4gICAgdHJ5IHtcbiAgICAgIHVzZXJJZCA9IHRoaXMudXNlcnMuaW5zZXJ0KGZ1bGxVc2VyKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyBYWFggc3RyaW5nIHBhcnNpbmcgc3Vja3MsIG1heWJlXG4gICAgICAvLyBodHRwczovL2ppcmEubW9uZ29kYi5vcmcvYnJvd3NlL1NFUlZFUi0zMDY5IHdpbGwgZ2V0IGZpeGVkIG9uZSBkYXlcbiAgICAgIGlmICghZS5lcnJtc2cpIHRocm93IGU7XG4gICAgICBpZiAoZS5lcnJtc2cuaW5jbHVkZXMoJ2VtYWlscy5hZGRyZXNzJykpXG4gICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIkVtYWlsIGFscmVhZHkgZXhpc3RzLlwiKTtcbiAgICAgIGlmIChlLmVycm1zZy5pbmNsdWRlcygndXNlcm5hbWUnKSlcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiVXNlcm5hbWUgYWxyZWFkeSBleGlzdHMuXCIpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gICAgcmV0dXJuIHVzZXJJZDtcbiAgfTtcblxuICAvLyBIZWxwZXIgZnVuY3Rpb246IHJldHVybnMgZmFsc2UgaWYgZW1haWwgZG9lcyBub3QgbWF0Y2ggY29tcGFueSBkb21haW4gZnJvbVxuICAvLyB0aGUgY29uZmlndXJhdGlvbi5cbiAgX3Rlc3RFbWFpbERvbWFpbihlbWFpbCkge1xuICAgIGNvbnN0IGRvbWFpbiA9IHRoaXMuX29wdGlvbnMucmVzdHJpY3RDcmVhdGlvbkJ5RW1haWxEb21haW47XG5cbiAgICByZXR1cm4gIWRvbWFpbiB8fFxuICAgICAgKHR5cGVvZiBkb21haW4gPT09ICdmdW5jdGlvbicgJiYgZG9tYWluKGVtYWlsKSkgfHxcbiAgICAgICh0eXBlb2YgZG9tYWluID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAobmV3IFJlZ0V4cChgQCR7TWV0ZW9yLl9lc2NhcGVSZWdFeHAoZG9tYWluKX0kYCwgJ2knKSkudGVzdChlbWFpbCkpO1xuICB9O1xuXG4gIC8vL1xuICAvLy8gQ0xFQU4gVVAgRk9SIGBsb2dvdXRPdGhlckNsaWVudHNgXG4gIC8vL1xuXG4gIF9kZWxldGVTYXZlZFRva2Vuc0ZvclVzZXIodXNlcklkLCB0b2tlbnNUb0RlbGV0ZSkge1xuICAgIGlmICh0b2tlbnNUb0RlbGV0ZSkge1xuICAgICAgdGhpcy51c2Vycy51cGRhdGUodXNlcklkLCB7XG4gICAgICAgICR1bnNldDoge1xuICAgICAgICAgIFwic2VydmljZXMucmVzdW1lLmhhdmVMb2dpblRva2Vuc1RvRGVsZXRlXCI6IDEsXG4gICAgICAgICAgXCJzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnNUb0RlbGV0ZVwiOiAxXG4gICAgICAgIH0sXG4gICAgICAgICRwdWxsQWxsOiB7XG4gICAgICAgICAgXCJzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnNcIjogdG9rZW5zVG9EZWxldGVcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIF9kZWxldGVTYXZlZFRva2Vuc0ZvckFsbFVzZXJzT25TdGFydHVwKCkge1xuICAgIC8vIElmIHdlIGZpbmQgdXNlcnMgd2hvIGhhdmUgc2F2ZWQgdG9rZW5zIHRvIGRlbGV0ZSBvbiBzdGFydHVwLCBkZWxldGVcbiAgICAvLyB0aGVtIG5vdy4gSXQncyBwb3NzaWJsZSB0aGF0IHRoZSBzZXJ2ZXIgY291bGQgaGF2ZSBjcmFzaGVkIGFuZCBjb21lXG4gICAgLy8gYmFjayB1cCBiZWZvcmUgbmV3IHRva2VucyBhcmUgZm91bmQgaW4gbG9jYWxTdG9yYWdlLCBidXQgdGhpc1xuICAgIC8vIHNob3VsZG4ndCBoYXBwZW4gdmVyeSBvZnRlbi4gV2Ugc2hvdWxkbid0IHB1dCBhIGRlbGF5IGhlcmUgYmVjYXVzZVxuICAgIC8vIHRoYXQgd291bGQgZ2l2ZSBhIGxvdCBvZiBwb3dlciB0byBhbiBhdHRhY2tlciB3aXRoIGEgc3RvbGVuIGxvZ2luXG4gICAgLy8gdG9rZW4gYW5kIHRoZSBhYmlsaXR5IHRvIGNyYXNoIHRoZSBzZXJ2ZXIuXG4gICAgTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuICAgICAgdGhpcy51c2Vycy5maW5kKHtcbiAgICAgICAgXCJzZXJ2aWNlcy5yZXN1bWUuaGF2ZUxvZ2luVG9rZW5zVG9EZWxldGVcIjogdHJ1ZVxuICAgICAgfSwge1xuICAgICAgICBcInNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vuc1RvRGVsZXRlXCI6IDFcbiAgICAgIH0pLmZvckVhY2godXNlciA9PiB7XG4gICAgICAgIHRoaXMuX2RlbGV0ZVNhdmVkVG9rZW5zRm9yVXNlcihcbiAgICAgICAgICB1c2VyLl9pZCxcbiAgICAgICAgICB1c2VyLnNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vuc1RvRGVsZXRlXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICAvLy9cbiAgLy8vIE1BTkFHSU5HIFVTRVIgT0JKRUNUU1xuICAvLy9cblxuICAvLyBVcGRhdGVzIG9yIGNyZWF0ZXMgYSB1c2VyIGFmdGVyIHdlIGF1dGhlbnRpY2F0ZSB3aXRoIGEgM3JkIHBhcnR5LlxuICAvL1xuICAvLyBAcGFyYW0gc2VydmljZU5hbWUge1N0cmluZ30gU2VydmljZSBuYW1lIChlZywgdHdpdHRlcikuXG4gIC8vIEBwYXJhbSBzZXJ2aWNlRGF0YSB7T2JqZWN0fSBEYXRhIHRvIHN0b3JlIGluIHRoZSB1c2VyJ3MgcmVjb3JkXG4gIC8vICAgICAgICB1bmRlciBzZXJ2aWNlc1tzZXJ2aWNlTmFtZV0uIE11c3QgaW5jbHVkZSBhbiBcImlkXCIgZmllbGRcbiAgLy8gICAgICAgIHdoaWNoIGlzIGEgdW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB1c2VyIGluIHRoZSBzZXJ2aWNlLlxuICAvLyBAcGFyYW0gb3B0aW9ucyB7T2JqZWN0LCBvcHRpb25hbH0gT3RoZXIgb3B0aW9ucyB0byBwYXNzIHRvIGluc2VydFVzZXJEb2NcbiAgLy8gICAgICAgIChlZywgcHJvZmlsZSlcbiAgLy8gQHJldHVybnMge09iamVjdH0gT2JqZWN0IHdpdGggdG9rZW4gYW5kIGlkIGtleXMsIGxpa2UgdGhlIHJlc3VsdFxuICAvLyAgICAgICAgb2YgdGhlIFwibG9naW5cIiBtZXRob2QuXG4gIC8vXG4gIHVwZGF0ZU9yQ3JlYXRlVXNlckZyb21FeHRlcm5hbFNlcnZpY2UoXG4gICAgc2VydmljZU5hbWUsXG4gICAgc2VydmljZURhdGEsXG4gICAgb3B0aW9uc1xuICApIHtcbiAgICBvcHRpb25zID0geyAuLi5vcHRpb25zIH07XG5cbiAgICBpZiAoc2VydmljZU5hbWUgPT09IFwicGFzc3dvcmRcIiB8fCBzZXJ2aWNlTmFtZSA9PT0gXCJyZXN1bWVcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcIkNhbid0IHVzZSB1cGRhdGVPckNyZWF0ZVVzZXJGcm9tRXh0ZXJuYWxTZXJ2aWNlIHdpdGggaW50ZXJuYWwgc2VydmljZSBcIlxuICAgICAgICArIHNlcnZpY2VOYW1lKTtcbiAgICB9XG4gICAgaWYgKCFoYXNPd24uY2FsbChzZXJ2aWNlRGF0YSwgJ2lkJykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYFNlcnZpY2UgZGF0YSBmb3Igc2VydmljZSAke3NlcnZpY2VOYW1lfSBtdXN0IGluY2x1ZGUgaWRgKTtcbiAgICB9XG5cbiAgICAvLyBMb29rIGZvciBhIHVzZXIgd2l0aCB0aGUgYXBwcm9wcmlhdGUgc2VydmljZSB1c2VyIGlkLlxuICAgIGNvbnN0IHNlbGVjdG9yID0ge307XG4gICAgY29uc3Qgc2VydmljZUlkS2V5ID0gYHNlcnZpY2VzLiR7c2VydmljZU5hbWV9LmlkYDtcblxuICAgIC8vIFhYWCBUZW1wb3Jhcnkgc3BlY2lhbCBjYXNlIGZvciBUd2l0dGVyLiAoSXNzdWUgIzYyOSlcbiAgICAvLyAgIFRoZSBzZXJ2aWNlRGF0YS5pZCB3aWxsIGJlIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGFuIGludGVnZXIuXG4gICAgLy8gICBXZSB3YW50IGl0IHRvIG1hdGNoIGVpdGhlciBhIHN0b3JlZCBzdHJpbmcgb3IgaW50IHJlcHJlc2VudGF0aW9uLlxuICAgIC8vICAgVGhpcyBpcyB0byBjYXRlciB0byBlYXJsaWVyIHZlcnNpb25zIG9mIE1ldGVvciBzdG9yaW5nIHR3aXR0ZXJcbiAgICAvLyAgIHVzZXIgSURzIGluIG51bWJlciBmb3JtLCBhbmQgcmVjZW50IHZlcnNpb25zIHN0b3JpbmcgdGhlbSBhcyBzdHJpbmdzLlxuICAgIC8vICAgVGhpcyBjYW4gYmUgcmVtb3ZlZCBvbmNlIG1pZ3JhdGlvbiB0ZWNobm9sb2d5IGlzIGluIHBsYWNlLCBhbmQgdHdpdHRlclxuICAgIC8vICAgdXNlcnMgc3RvcmVkIHdpdGggaW50ZWdlciBJRHMgaGF2ZSBiZWVuIG1pZ3JhdGVkIHRvIHN0cmluZyBJRHMuXG4gICAgaWYgKHNlcnZpY2VOYW1lID09PSBcInR3aXR0ZXJcIiAmJiAhaXNOYU4oc2VydmljZURhdGEuaWQpKSB7XG4gICAgICBzZWxlY3RvcltcIiRvclwiXSA9IFt7fSx7fV07XG4gICAgICBzZWxlY3RvcltcIiRvclwiXVswXVtzZXJ2aWNlSWRLZXldID0gc2VydmljZURhdGEuaWQ7XG4gICAgICBzZWxlY3RvcltcIiRvclwiXVsxXVtzZXJ2aWNlSWRLZXldID0gcGFyc2VJbnQoc2VydmljZURhdGEuaWQsIDEwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZWN0b3Jbc2VydmljZUlkS2V5XSA9IHNlcnZpY2VEYXRhLmlkO1xuICAgIH1cblxuICAgIGxldCB1c2VyID0gdGhpcy51c2Vycy5maW5kT25lKHNlbGVjdG9yKTtcblxuICAgIC8vIFdoZW4gY3JlYXRpbmcgYSBuZXcgdXNlciB3ZSBwYXNzIHRocm91Z2ggYWxsIG9wdGlvbnMuIFdoZW4gdXBkYXRpbmcgYW5cbiAgICAvLyBleGlzdGluZyB1c2VyLCBieSBkZWZhdWx0IHdlIG9ubHkgcHJvY2Vzcy9wYXNzIHRocm91Z2ggdGhlIHNlcnZpY2VEYXRhXG4gICAgLy8gKGVnLCBzbyB0aGF0IHdlIGtlZXAgYW4gdW5leHBpcmVkIGFjY2VzcyB0b2tlbiBhbmQgZG9uJ3QgY2FjaGUgb2xkIGVtYWlsXG4gICAgLy8gYWRkcmVzc2VzIGluIHNlcnZpY2VEYXRhLmVtYWlsKS4gVGhlIG9uRXh0ZXJuYWxMb2dpbiBob29rIGNhbiBiZSB1c2VkIHdoZW5cbiAgICAvLyBjcmVhdGluZyBvciB1cGRhdGluZyBhIHVzZXIsIHRvIG1vZGlmeSBvciBwYXNzIHRocm91Z2ggbW9yZSBvcHRpb25zIGFzXG4gICAgLy8gbmVlZGVkLlxuICAgIGxldCBvcHRzID0gdXNlciA/IHt9IDogb3B0aW9ucztcbiAgICBpZiAodGhpcy5fb25FeHRlcm5hbExvZ2luSG9vaykge1xuICAgICAgb3B0cyA9IHRoaXMuX29uRXh0ZXJuYWxMb2dpbkhvb2sob3B0aW9ucywgdXNlcik7XG4gICAgfVxuXG4gICAgaWYgKHVzZXIpIHtcbiAgICAgIHBpbkVuY3J5cHRlZEZpZWxkc1RvVXNlcihzZXJ2aWNlRGF0YSwgdXNlci5faWQpO1xuXG4gICAgICBsZXQgc2V0QXR0cnMgPSB7fTtcbiAgICAgIE9iamVjdC5rZXlzKHNlcnZpY2VEYXRhKS5mb3JFYWNoKGtleSA9PlxuICAgICAgICBzZXRBdHRyc1tgc2VydmljZXMuJHtzZXJ2aWNlTmFtZX0uJHtrZXl9YF0gPSBzZXJ2aWNlRGF0YVtrZXldXG4gICAgICApO1xuXG4gICAgICAvLyBYWFggTWF5YmUgd2Ugc2hvdWxkIHJlLXVzZSB0aGUgc2VsZWN0b3IgYWJvdmUgYW5kIG5vdGljZSBpZiB0aGUgdXBkYXRlXG4gICAgICAvLyAgICAgdG91Y2hlcyBub3RoaW5nP1xuICAgICAgc2V0QXR0cnMgPSB7IC4uLnNldEF0dHJzLCAuLi5vcHRzIH07XG4gICAgICB0aGlzLnVzZXJzLnVwZGF0ZSh1c2VyLl9pZCwge1xuICAgICAgICAkc2V0OiBzZXRBdHRyc1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6IHNlcnZpY2VOYW1lLFxuICAgICAgICB1c2VySWQ6IHVzZXIuX2lkXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBDcmVhdGUgYSBuZXcgdXNlciB3aXRoIHRoZSBzZXJ2aWNlIGRhdGEuXG4gICAgICB1c2VyID0ge3NlcnZpY2VzOiB7fX07XG4gICAgICB1c2VyLnNlcnZpY2VzW3NlcnZpY2VOYW1lXSA9IHNlcnZpY2VEYXRhO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogc2VydmljZU5hbWUsXG4gICAgICAgIHVzZXJJZDogdGhpcy5pbnNlcnRVc2VyRG9jKG9wdHMsIHVzZXIpXG4gICAgICB9O1xuICAgIH1cbiAgfTtcblxuICAvLyBSZW1vdmVzIGRlZmF1bHQgcmF0ZSBsaW1pdGluZyBydWxlXG4gIHJlbW92ZURlZmF1bHRSYXRlTGltaXQoKSB7XG4gICAgY29uc3QgcmVzcCA9IEREUFJhdGVMaW1pdGVyLnJlbW92ZVJ1bGUodGhpcy5kZWZhdWx0UmF0ZUxpbWl0ZXJSdWxlSWQpO1xuICAgIHRoaXMuZGVmYXVsdFJhdGVMaW1pdGVyUnVsZUlkID0gbnVsbDtcbiAgICByZXR1cm4gcmVzcDtcbiAgfTtcblxuICAvLyBBZGQgYSBkZWZhdWx0IHJ1bGUgb2YgbGltaXRpbmcgbG9naW5zLCBjcmVhdGluZyBuZXcgdXNlcnMgYW5kIHBhc3N3b3JkIHJlc2V0XG4gIC8vIHRvIDUgdGltZXMgZXZlcnkgMTAgc2Vjb25kcyBwZXIgY29ubmVjdGlvbi5cbiAgYWRkRGVmYXVsdFJhdGVMaW1pdCgpIHtcbiAgICBpZiAoIXRoaXMuZGVmYXVsdFJhdGVMaW1pdGVyUnVsZUlkKSB7XG4gICAgICB0aGlzLmRlZmF1bHRSYXRlTGltaXRlclJ1bGVJZCA9IEREUFJhdGVMaW1pdGVyLmFkZFJ1bGUoe1xuICAgICAgICB1c2VySWQ6IG51bGwsXG4gICAgICAgIGNsaWVudEFkZHJlc3M6IG51bGwsXG4gICAgICAgIHR5cGU6ICdtZXRob2QnLFxuICAgICAgICBuYW1lOiBuYW1lID0+IFsnbG9naW4nLCAnY3JlYXRlVXNlcicsICdyZXNldFBhc3N3b3JkJywgJ2ZvcmdvdFBhc3N3b3JkJ11cbiAgICAgICAgICAuaW5jbHVkZXMobmFtZSksXG4gICAgICAgIGNvbm5lY3Rpb25JZDogKGNvbm5lY3Rpb25JZCkgPT4gdHJ1ZSxcbiAgICAgIH0sIDUsIDEwMDAwKTtcbiAgICB9XG4gIH07XG5cbn1cblxuLy8gR2l2ZSBlYWNoIGxvZ2luIGhvb2sgY2FsbGJhY2sgYSBmcmVzaCBjbG9uZWQgY29weSBvZiB0aGUgYXR0ZW1wdFxuLy8gb2JqZWN0LCBidXQgZG9uJ3QgY2xvbmUgdGhlIGNvbm5lY3Rpb24uXG4vL1xuY29uc3QgY2xvbmVBdHRlbXB0V2l0aENvbm5lY3Rpb24gPSAoY29ubmVjdGlvbiwgYXR0ZW1wdCkgPT4ge1xuICBjb25zdCBjbG9uZWRBdHRlbXB0ID0gRUpTT04uY2xvbmUoYXR0ZW1wdCk7XG4gIGNsb25lZEF0dGVtcHQuY29ubmVjdGlvbiA9IGNvbm5lY3Rpb247XG4gIHJldHVybiBjbG9uZWRBdHRlbXB0O1xufTtcblxuY29uc3QgdHJ5TG9naW5NZXRob2QgPSAodHlwZSwgZm4pID0+IHtcbiAgbGV0IHJlc3VsdDtcbiAgdHJ5IHtcbiAgICByZXN1bHQgPSBmbigpO1xuICB9XG4gIGNhdGNoIChlKSB7XG4gICAgcmVzdWx0ID0ge2Vycm9yOiBlfTtcbiAgfVxuXG4gIGlmIChyZXN1bHQgJiYgIXJlc3VsdC50eXBlICYmIHR5cGUpXG4gICAgcmVzdWx0LnR5cGUgPSB0eXBlO1xuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5jb25zdCBzZXR1cERlZmF1bHRMb2dpbkhhbmRsZXJzID0gYWNjb3VudHMgPT4ge1xuICBhY2NvdW50cy5yZWdpc3RlckxvZ2luSGFuZGxlcihcInJlc3VtZVwiLCBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHJldHVybiBkZWZhdWx0UmVzdW1lTG9naW5IYW5kbGVyLmNhbGwodGhpcywgYWNjb3VudHMsIG9wdGlvbnMpO1xuICB9KTtcbn07XG5cbi8vIExvZ2luIGhhbmRsZXIgZm9yIHJlc3VtZSB0b2tlbnMuXG5jb25zdCBkZWZhdWx0UmVzdW1lTG9naW5IYW5kbGVyID0gKGFjY291bnRzLCBvcHRpb25zKSA9PiB7XG4gIGlmICghb3B0aW9ucy5yZXN1bWUpXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcblxuICBjaGVjayhvcHRpb25zLnJlc3VtZSwgU3RyaW5nKTtcblxuICBjb25zdCBoYXNoZWRUb2tlbiA9IGFjY291bnRzLl9oYXNoTG9naW5Ub2tlbihvcHRpb25zLnJlc3VtZSk7XG5cbiAgLy8gRmlyc3QgbG9vayBmb3IganVzdCB0aGUgbmV3LXN0eWxlIGhhc2hlZCBsb2dpbiB0b2tlbiwgdG8gYXZvaWRcbiAgLy8gc2VuZGluZyB0aGUgdW5oYXNoZWQgdG9rZW4gdG8gdGhlIGRhdGFiYXNlIGluIGEgcXVlcnkgaWYgd2UgZG9uJ3RcbiAgLy8gbmVlZCB0by5cbiAgbGV0IHVzZXIgPSBhY2NvdW50cy51c2Vycy5maW5kT25lKFxuICAgIHtcInNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy5oYXNoZWRUb2tlblwiOiBoYXNoZWRUb2tlbn0pO1xuXG4gIGlmICghIHVzZXIpIHtcbiAgICAvLyBJZiB3ZSBkaWRuJ3QgZmluZCB0aGUgaGFzaGVkIGxvZ2luIHRva2VuLCB0cnkgYWxzbyBsb29raW5nIGZvclxuICAgIC8vIHRoZSBvbGQtc3R5bGUgdW5oYXNoZWQgdG9rZW4uICBCdXQgd2UgbmVlZCB0byBsb29rIGZvciBlaXRoZXJcbiAgICAvLyB0aGUgb2xkLXN0eWxlIHRva2VuIE9SIHRoZSBuZXctc3R5bGUgdG9rZW4sIGJlY2F1c2UgYW5vdGhlclxuICAgIC8vIGNsaWVudCBjb25uZWN0aW9uIGxvZ2dpbmcgaW4gc2ltdWx0YW5lb3VzbHkgbWlnaHQgaGF2ZSBhbHJlYWR5XG4gICAgLy8gY29udmVydGVkIHRoZSB0b2tlbi5cbiAgICB1c2VyID0gYWNjb3VudHMudXNlcnMuZmluZE9uZSh7XG4gICAgICAkb3I6IFtcbiAgICAgICAge1wic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zLmhhc2hlZFRva2VuXCI6IGhhc2hlZFRva2VufSxcbiAgICAgICAge1wic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zLnRva2VuXCI6IG9wdGlvbnMucmVzdW1lfVxuICAgICAgXVxuICAgIH0pO1xuICB9XG5cbiAgaWYgKCEgdXNlcilcbiAgICByZXR1cm4ge1xuICAgICAgZXJyb3I6IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIllvdSd2ZSBiZWVuIGxvZ2dlZCBvdXQgYnkgdGhlIHNlcnZlci4gUGxlYXNlIGxvZyBpbiBhZ2Fpbi5cIilcbiAgICB9O1xuXG4gIC8vIEZpbmQgdGhlIHRva2VuLCB3aGljaCB3aWxsIGVpdGhlciBiZSBhbiBvYmplY3Qgd2l0aCBmaWVsZHNcbiAgLy8ge2hhc2hlZFRva2VuLCB3aGVufSBmb3IgYSBoYXNoZWQgdG9rZW4gb3Ige3Rva2VuLCB3aGVufSBmb3IgYW5cbiAgLy8gdW5oYXNoZWQgdG9rZW4uXG4gIGxldCBvbGRVbmhhc2hlZFN0eWxlVG9rZW47XG4gIGxldCB0b2tlbiA9IHVzZXIuc2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zLmZpbmQodG9rZW4gPT5cbiAgICB0b2tlbi5oYXNoZWRUb2tlbiA9PT0gaGFzaGVkVG9rZW5cbiAgKTtcbiAgaWYgKHRva2VuKSB7XG4gICAgb2xkVW5oYXNoZWRTdHlsZVRva2VuID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgdG9rZW4gPSB1c2VyLnNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy5maW5kKHRva2VuID0+XG4gICAgICB0b2tlbi50b2tlbiA9PT0gb3B0aW9ucy5yZXN1bWVcbiAgICApO1xuICAgIG9sZFVuaGFzaGVkU3R5bGVUb2tlbiA9IHRydWU7XG4gIH1cblxuICBjb25zdCB0b2tlbkV4cGlyZXMgPSBhY2NvdW50cy5fdG9rZW5FeHBpcmF0aW9uKHRva2VuLndoZW4pO1xuICBpZiAobmV3IERhdGUoKSA+PSB0b2tlbkV4cGlyZXMpXG4gICAgcmV0dXJuIHtcbiAgICAgIHVzZXJJZDogdXNlci5faWQsXG4gICAgICBlcnJvcjogbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiWW91ciBzZXNzaW9uIGhhcyBleHBpcmVkLiBQbGVhc2UgbG9nIGluIGFnYWluLlwiKVxuICAgIH07XG5cbiAgLy8gVXBkYXRlIHRvIGEgaGFzaGVkIHRva2VuIHdoZW4gYW4gdW5oYXNoZWQgdG9rZW4gaXMgZW5jb3VudGVyZWQuXG4gIGlmIChvbGRVbmhhc2hlZFN0eWxlVG9rZW4pIHtcbiAgICAvLyBPbmx5IGFkZCB0aGUgbmV3IGhhc2hlZCB0b2tlbiBpZiB0aGUgb2xkIHVuaGFzaGVkIHRva2VuIHN0aWxsXG4gICAgLy8gZXhpc3RzICh0aGlzIGF2b2lkcyByZXN1cnJlY3RpbmcgdGhlIHRva2VuIGlmIGl0IHdhcyBkZWxldGVkXG4gICAgLy8gYWZ0ZXIgd2UgcmVhZCBpdCkuICBVc2luZyAkYWRkVG9TZXQgYXZvaWRzIGdldHRpbmcgYW4gaW5kZXhcbiAgICAvLyBlcnJvciBpZiBhbm90aGVyIGNsaWVudCBsb2dnaW5nIGluIHNpbXVsdGFuZW91c2x5IGhhcyBhbHJlYWR5XG4gICAgLy8gaW5zZXJ0ZWQgdGhlIG5ldyBoYXNoZWQgdG9rZW4uXG4gICAgYWNjb3VudHMudXNlcnMudXBkYXRlKFxuICAgICAge1xuICAgICAgICBfaWQ6IHVzZXIuX2lkLFxuICAgICAgICBcInNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy50b2tlblwiOiBvcHRpb25zLnJlc3VtZVxuICAgICAgfSxcbiAgICAgIHskYWRkVG9TZXQ6IHtcbiAgICAgICAgICBcInNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vuc1wiOiB7XG4gICAgICAgICAgICBcImhhc2hlZFRva2VuXCI6IGhhc2hlZFRva2VuLFxuICAgICAgICAgICAgXCJ3aGVuXCI6IHRva2VuLndoZW5cbiAgICAgICAgICB9XG4gICAgICAgIH19XG4gICAgKTtcblxuICAgIC8vIFJlbW92ZSB0aGUgb2xkIHRva2VuICphZnRlciogYWRkaW5nIHRoZSBuZXcsIHNpbmNlIG90aGVyd2lzZVxuICAgIC8vIGFub3RoZXIgY2xpZW50IHRyeWluZyB0byBsb2dpbiBiZXR3ZWVuIG91ciByZW1vdmluZyB0aGUgb2xkIGFuZFxuICAgIC8vIGFkZGluZyB0aGUgbmV3IHdvdWxkbid0IGZpbmQgYSB0b2tlbiB0byBsb2dpbiB3aXRoLlxuICAgIGFjY291bnRzLnVzZXJzLnVwZGF0ZSh1c2VyLl9pZCwge1xuICAgICAgJHB1bGw6IHtcbiAgICAgICAgXCJzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnNcIjogeyBcInRva2VuXCI6IG9wdGlvbnMucmVzdW1lIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgdXNlcklkOiB1c2VyLl9pZCxcbiAgICBzdGFtcGVkTG9naW5Ub2tlbjoge1xuICAgICAgdG9rZW46IG9wdGlvbnMucmVzdW1lLFxuICAgICAgd2hlbjogdG9rZW4ud2hlblxuICAgIH1cbiAgfTtcbn07XG5cbmNvbnN0IGV4cGlyZVBhc3N3b3JkVG9rZW4gPSAoXG4gIGFjY291bnRzLFxuICBvbGRlc3RWYWxpZERhdGUsXG4gIHRva2VuRmlsdGVyLFxuICB1c2VySWRcbikgPT4ge1xuICBjb25zdCB1c2VyRmlsdGVyID0gdXNlcklkID8ge19pZDogdXNlcklkfSA6IHt9O1xuICBjb25zdCByZXNldFJhbmdlT3IgPSB7XG4gICAgJG9yOiBbXG4gICAgICB7IFwic2VydmljZXMucGFzc3dvcmQucmVzZXQud2hlblwiOiB7ICRsdDogb2xkZXN0VmFsaWREYXRlIH0gfSxcbiAgICAgIHsgXCJzZXJ2aWNlcy5wYXNzd29yZC5yZXNldC53aGVuXCI6IHsgJGx0OiArb2xkZXN0VmFsaWREYXRlIH0gfVxuICAgIF1cbiAgfTtcbiAgY29uc3QgZXhwaXJlRmlsdGVyID0geyAkYW5kOiBbdG9rZW5GaWx0ZXIsIHJlc2V0UmFuZ2VPcl0gfTtcblxuICBhY2NvdW50cy51c2Vycy51cGRhdGUoey4uLnVzZXJGaWx0ZXIsIC4uLmV4cGlyZUZpbHRlcn0sIHtcbiAgICAkdW5zZXQ6IHtcbiAgICAgIFwic2VydmljZXMucGFzc3dvcmQucmVzZXRcIjogXCJcIlxuICAgIH1cbiAgfSwgeyBtdWx0aTogdHJ1ZSB9KTtcbn07XG5cbmNvbnN0IHNldEV4cGlyZVRva2Vuc0ludGVydmFsID0gYWNjb3VudHMgPT4ge1xuICBhY2NvdW50cy5leHBpcmVUb2tlbkludGVydmFsID0gTWV0ZW9yLnNldEludGVydmFsKCgpID0+IHtcbiAgICBhY2NvdW50cy5fZXhwaXJlVG9rZW5zKCk7XG4gICAgYWNjb3VudHMuX2V4cGlyZVBhc3N3b3JkUmVzZXRUb2tlbnMoKTtcbiAgICBhY2NvdW50cy5fZXhwaXJlUGFzc3dvcmRFbnJvbGxUb2tlbnMoKTtcbiAgfSwgRVhQSVJFX1RPS0VOU19JTlRFUlZBTF9NUyk7XG59O1xuXG4vLy9cbi8vLyBPQXV0aCBFbmNyeXB0aW9uIFN1cHBvcnRcbi8vL1xuXG5jb25zdCBPQXV0aEVuY3J5cHRpb24gPVxuICBQYWNrYWdlW1wib2F1dGgtZW5jcnlwdGlvblwiXSAmJlxuICBQYWNrYWdlW1wib2F1dGgtZW5jcnlwdGlvblwiXS5PQXV0aEVuY3J5cHRpb247XG5cbmNvbnN0IHVzaW5nT0F1dGhFbmNyeXB0aW9uID0gKCkgPT4ge1xuICByZXR1cm4gT0F1dGhFbmNyeXB0aW9uICYmIE9BdXRoRW5jcnlwdGlvbi5rZXlJc0xvYWRlZCgpO1xufTtcblxuLy8gT0F1dGggc2VydmljZSBkYXRhIGlzIHRlbXBvcmFyaWx5IHN0b3JlZCBpbiB0aGUgcGVuZGluZyBjcmVkZW50aWFsc1xuLy8gY29sbGVjdGlvbiBkdXJpbmcgdGhlIG9hdXRoIGF1dGhlbnRpY2F0aW9uIHByb2Nlc3MuICBTZW5zaXRpdmUgZGF0YVxuLy8gc3VjaCBhcyBhY2Nlc3MgdG9rZW5zIGFyZSBlbmNyeXB0ZWQgd2l0aG91dCB0aGUgdXNlciBpZCBiZWNhdXNlXG4vLyB3ZSBkb24ndCBrbm93IHRoZSB1c2VyIGlkIHlldC4gIFdlIHJlLWVuY3J5cHQgdGhlc2UgZmllbGRzIHdpdGggdGhlXG4vLyB1c2VyIGlkIGluY2x1ZGVkIHdoZW4gc3RvcmluZyB0aGUgc2VydmljZSBkYXRhIHBlcm1hbmVudGx5IGluXG4vLyB0aGUgdXNlcnMgY29sbGVjdGlvbi5cbi8vXG5jb25zdCBwaW5FbmNyeXB0ZWRGaWVsZHNUb1VzZXIgPSAoc2VydmljZURhdGEsIHVzZXJJZCkgPT4ge1xuICBPYmplY3Qua2V5cyhzZXJ2aWNlRGF0YSkuZm9yRWFjaChrZXkgPT4ge1xuICAgIGxldCB2YWx1ZSA9IHNlcnZpY2VEYXRhW2tleV07XG4gICAgaWYgKE9BdXRoRW5jcnlwdGlvbiAmJiBPQXV0aEVuY3J5cHRpb24uaXNTZWFsZWQodmFsdWUpKVxuICAgICAgdmFsdWUgPSBPQXV0aEVuY3J5cHRpb24uc2VhbChPQXV0aEVuY3J5cHRpb24ub3Blbih2YWx1ZSksIHVzZXJJZCk7XG4gICAgc2VydmljZURhdGFba2V5XSA9IHZhbHVlO1xuICB9KTtcbn07XG5cblxuLy8gRW5jcnlwdCB1bmVuY3J5cHRlZCBsb2dpbiBzZXJ2aWNlIHNlY3JldHMgd2hlbiBvYXV0aC1lbmNyeXB0aW9uIGlzXG4vLyBhZGRlZC5cbi8vXG4vLyBYWFggRm9yIHRoZSBvYXV0aFNlY3JldEtleSB0byBiZSBhdmFpbGFibGUgaGVyZSBhdCBzdGFydHVwLCB0aGVcbi8vIGRldmVsb3BlciBtdXN0IGNhbGwgQWNjb3VudHMuY29uZmlnKHtvYXV0aFNlY3JldEtleTogLi4ufSkgYXQgbG9hZFxuLy8gdGltZSwgaW5zdGVhZCBvZiBpbiBhIE1ldGVvci5zdGFydHVwIGJsb2NrLCBiZWNhdXNlIHRoZSBzdGFydHVwXG4vLyBibG9jayBpbiB0aGUgYXBwIGNvZGUgd2lsbCBydW4gYWZ0ZXIgdGhpcyBhY2NvdW50cy1iYXNlIHN0YXJ0dXBcbi8vIGJsb2NrLiAgUGVyaGFwcyB3ZSBuZWVkIGEgcG9zdC1zdGFydHVwIGNhbGxiYWNrP1xuXG5NZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG4gIGlmICghIHVzaW5nT0F1dGhFbmNyeXB0aW9uKCkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCB7IFNlcnZpY2VDb25maWd1cmF0aW9uIH0gPSBQYWNrYWdlWydzZXJ2aWNlLWNvbmZpZ3VyYXRpb24nXTtcblxuICBTZXJ2aWNlQ29uZmlndXJhdGlvbi5jb25maWd1cmF0aW9ucy5maW5kKHtcbiAgICAkYW5kOiBbe1xuICAgICAgc2VjcmV0OiB7ICRleGlzdHM6IHRydWUgfVxuICAgIH0sIHtcbiAgICAgIFwic2VjcmV0LmFsZ29yaXRobVwiOiB7ICRleGlzdHM6IGZhbHNlIH1cbiAgICB9XVxuICB9KS5mb3JFYWNoKGNvbmZpZyA9PiB7XG4gICAgU2VydmljZUNvbmZpZ3VyYXRpb24uY29uZmlndXJhdGlvbnMudXBkYXRlKGNvbmZpZy5faWQsIHtcbiAgICAgICRzZXQ6IHtcbiAgICAgICAgc2VjcmV0OiBPQXV0aEVuY3J5cHRpb24uc2VhbChjb25maWcuc2VjcmV0KVxuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbn0pO1xuXG4vLyBYWFggc2VlIGNvbW1lbnQgb24gQWNjb3VudHMuY3JlYXRlVXNlciBpbiBwYXNzd29yZHNfc2VydmVyIGFib3V0IGFkZGluZyBhXG4vLyBzZWNvbmQgXCJzZXJ2ZXIgb3B0aW9uc1wiIGFyZ3VtZW50LlxuY29uc3QgZGVmYXVsdENyZWF0ZVVzZXJIb29rID0gKG9wdGlvbnMsIHVzZXIpID0+IHtcbiAgaWYgKG9wdGlvbnMucHJvZmlsZSlcbiAgICB1c2VyLnByb2ZpbGUgPSBvcHRpb25zLnByb2ZpbGU7XG4gIHJldHVybiB1c2VyO1xufTtcblxuLy8gVmFsaWRhdGUgbmV3IHVzZXIncyBlbWFpbCBvciBHb29nbGUvRmFjZWJvb2svR2l0SHViIGFjY291bnQncyBlbWFpbFxuZnVuY3Rpb24gZGVmYXVsdFZhbGlkYXRlTmV3VXNlckhvb2sodXNlcikge1xuICBjb25zdCBkb21haW4gPSB0aGlzLl9vcHRpb25zLnJlc3RyaWN0Q3JlYXRpb25CeUVtYWlsRG9tYWluO1xuICBpZiAoIWRvbWFpbikge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgbGV0IGVtYWlsSXNHb29kID0gZmFsc2U7XG4gIGlmICh1c2VyLmVtYWlscyAmJiB1c2VyLmVtYWlscy5sZW5ndGggPiAwKSB7XG4gICAgZW1haWxJc0dvb2QgPSB1c2VyLmVtYWlscy5yZWR1Y2UoXG4gICAgICAocHJldiwgZW1haWwpID0+IHByZXYgfHwgdGhpcy5fdGVzdEVtYWlsRG9tYWluKGVtYWlsLmFkZHJlc3MpLCBmYWxzZVxuICAgICk7XG4gIH0gZWxzZSBpZiAodXNlci5zZXJ2aWNlcyAmJiB1c2VyLnNlcnZpY2VzLmxlbmd0aCA+IDApIHtcbiAgICAvLyBGaW5kIGFueSBlbWFpbCBvZiBhbnkgc2VydmljZSBhbmQgY2hlY2sgaXRcbiAgICBlbWFpbElzR29vZCA9IHVzZXIuc2VydmljZXMucmVkdWNlKFxuICAgICAgKHByZXYsIHNlcnZpY2UpID0+IHNlcnZpY2UuZW1haWwgJiYgdGhpcy5fdGVzdEVtYWlsRG9tYWluKHNlcnZpY2UuZW1haWwpLFxuICAgICAgZmFsc2UsXG4gICAgKTtcbiAgfVxuXG4gIGlmIChlbWFpbElzR29vZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBkb21haW4gPT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIGBAJHtkb21haW59IGVtYWlsIHJlcXVpcmVkYCk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiRW1haWwgZG9lc24ndCBtYXRjaCB0aGUgY3JpdGVyaWEuXCIpO1xuICB9XG59XG5cbmNvbnN0IHNldHVwVXNlcnNDb2xsZWN0aW9uID0gdXNlcnMgPT4ge1xuICAvLy9cbiAgLy8vIFJFU1RSSUNUSU5HIFdSSVRFUyBUTyBVU0VSIE9CSkVDVFNcbiAgLy8vXG4gIHVzZXJzLmFsbG93KHtcbiAgICAvLyBjbGllbnRzIGNhbiBtb2RpZnkgdGhlIHByb2ZpbGUgZmllbGQgb2YgdGhlaXIgb3duIGRvY3VtZW50LCBhbmRcbiAgICAvLyBub3RoaW5nIGVsc2UuXG4gICAgdXBkYXRlOiAodXNlcklkLCB1c2VyLCBmaWVsZHMsIG1vZGlmaWVyKSA9PiB7XG4gICAgICAvLyBtYWtlIHN1cmUgaXQgaXMgb3VyIHJlY29yZFxuICAgICAgaWYgKHVzZXIuX2lkICE9PSB1c2VySWQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyB1c2VyIGNhbiBvbmx5IG1vZGlmeSB0aGUgJ3Byb2ZpbGUnIGZpZWxkLiBzZXRzIHRvIG11bHRpcGxlXG4gICAgICAvLyBzdWIta2V5cyAoZWcgcHJvZmlsZS5mb28gYW5kIHByb2ZpbGUuYmFyKSBhcmUgbWVyZ2VkIGludG8gZW50cnlcbiAgICAgIC8vIGluIHRoZSBmaWVsZHMgbGlzdC5cbiAgICAgIGlmIChmaWVsZHMubGVuZ3RoICE9PSAxIHx8IGZpZWxkc1swXSAhPT0gJ3Byb2ZpbGUnKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICBmZXRjaDogWydfaWQnXSAvLyB3ZSBvbmx5IGxvb2sgYXQgX2lkLlxuICB9KTtcblxuICAvLy8gREVGQVVMVCBJTkRFWEVTIE9OIFVTRVJTXG4gIHVzZXJzLl9lbnN1cmVJbmRleCgndXNlcm5hbWUnLCB7dW5pcXVlOiAxLCBzcGFyc2U6IDF9KTtcbiAgdXNlcnMuX2Vuc3VyZUluZGV4KCdlbWFpbHMuYWRkcmVzcycsIHt1bmlxdWU6IDEsIHNwYXJzZTogMX0pO1xuICB1c2Vycy5fZW5zdXJlSW5kZXgoJ3NlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy5oYXNoZWRUb2tlbicsXG4gICAge3VuaXF1ZTogMSwgc3BhcnNlOiAxfSk7XG4gIHVzZXJzLl9lbnN1cmVJbmRleCgnc2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zLnRva2VuJyxcbiAgICB7dW5pcXVlOiAxLCBzcGFyc2U6IDF9KTtcbiAgLy8gRm9yIHRha2luZyBjYXJlIG9mIGxvZ291dE90aGVyQ2xpZW50cyBjYWxscyB0aGF0IGNyYXNoZWQgYmVmb3JlIHRoZVxuICAvLyB0b2tlbnMgd2VyZSBkZWxldGVkLlxuICB1c2Vycy5fZW5zdXJlSW5kZXgoJ3NlcnZpY2VzLnJlc3VtZS5oYXZlTG9naW5Ub2tlbnNUb0RlbGV0ZScsXG4gICAgeyBzcGFyc2U6IDEgfSk7XG4gIC8vIEZvciBleHBpcmluZyBsb2dpbiB0b2tlbnNcbiAgdXNlcnMuX2Vuc3VyZUluZGV4KFwic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zLndoZW5cIiwgeyBzcGFyc2U6IDEgfSk7XG4gIC8vIEZvciBleHBpcmluZyBwYXNzd29yZCB0b2tlbnNcbiAgdXNlcnMuX2Vuc3VyZUluZGV4KCdzZXJ2aWNlcy5wYXNzd29yZC5yZXNldC53aGVuJywgeyBzcGFyc2U6IDEgfSk7XG59O1xuIl19
