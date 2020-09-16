(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var NpmModuleBcrypt = Package['npm-bcrypt'].NpmModuleBcrypt;
var Accounts = Package['accounts-base'].Accounts;
var SRP = Package.srp.SRP;
var SHA256 = Package.sha.SHA256;
var EJSON = Package.ejson.EJSON;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var Email = Package.email.Email;
var EmailInternals = Package.email.EmailInternals;
var Random = Package.random.Random;
var check = Package.check.check;
var Match = Package.check.Match;
var _ = Package.underscore._;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"accounts-password":{"email_templates.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/accounts-password/email_templates.js                                                                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
function greet(welcomeMsg) {
  return function (user, url) {
    var greeting = user.profile && user.profile.name ? "Hello " + user.profile.name + "," : "Hello,";
    return `${greeting}

${welcomeMsg}, simply click the link below.

${url}

Thanks.
`;
  };
}
/**
 * @summary Options to customize emails sent from the Accounts system.
 * @locus Server
 * @importFromPackage accounts-base
 */


Accounts.emailTemplates = {
  from: "Accounts Example <no-reply@example.com>",
  siteName: Meteor.absoluteUrl().replace(/^https?:\/\//, '').replace(/\/$/, ''),
  resetPassword: {
    subject: function (user) {
      return "How to reset your password on " + Accounts.emailTemplates.siteName;
    },
    text: greet("To reset your password")
  },
  verifyEmail: {
    subject: function (user) {
      return "How to verify email address on " + Accounts.emailTemplates.siteName;
    },
    text: greet("To verify your account email")
  },
  enrollAccount: {
    subject: function (user) {
      return "An account has been created for you on " + Accounts.emailTemplates.siteName;
    },
    text: greet("To start using the service")
  }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"password_server.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/accounts-password/password_server.js                                                                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/// BCRYPT
var bcrypt = NpmModuleBcrypt;
var bcryptHash = Meteor.wrapAsync(bcrypt.hash);
var bcryptCompare = Meteor.wrapAsync(bcrypt.compare); // User records have a 'services.password.bcrypt' field on them to hold
// their hashed passwords (unless they have a 'services.password.srp'
// field, in which case they will be upgraded to bcrypt the next time
// they log in).
//
// When the client sends a password to the server, it can either be a
// string (the plaintext password) or an object with keys 'digest' and
// 'algorithm' (must be "sha-256" for now). The Meteor client always sends
// password objects { digest: *, algorithm: "sha-256" }, but DDP clients
// that don't have access to SHA can just send plaintext passwords as
// strings.
//
// When the server receives a plaintext password as a string, it always
// hashes it with SHA256 before passing it into bcrypt. When the server
// receives a password as an object, it asserts that the algorithm is
// "sha-256" and then passes the digest to bcrypt.

Accounts._bcryptRounds = () => Accounts._options.bcryptRounds || 10; // Given a 'password' from the client, extract the string that we should
// bcrypt. 'password' can be one of:
//  - String (the plaintext password)
//  - Object with 'digest' and 'algorithm' keys. 'algorithm' must be "sha-256".
//


var getPasswordString = function (password) {
  if (typeof password === "string") {
    password = SHA256(password);
  } else {
    // 'password' is an object
    if (password.algorithm !== "sha-256") {
      throw new Error("Invalid password hash algorithm. " + "Only 'sha-256' is allowed.");
    }

    password = password.digest;
  }

  return password;
}; // Use bcrypt to hash the password for storage in the database.
// `password` can be a string (in which case it will be run through
// SHA256 before bcrypt) or an object with properties `digest` and
// `algorithm` (in which case we bcrypt `password.digest`).
//


var hashPassword = function (password) {
  password = getPasswordString(password);
  return bcryptHash(password, Accounts._bcryptRounds());
}; // Extract the number of rounds used in the specified bcrypt hash.


const getRoundsFromBcryptHash = hash => {
  let rounds;

  if (hash) {
    const hashSegments = hash.split('$');

    if (hashSegments.length > 2) {
      rounds = parseInt(hashSegments[2], 10);
    }
  }

  return rounds;
}; // Check whether the provided password matches the bcrypt'ed password in
// the database user record. `password` can be a string (in which case
// it will be run through SHA256 before bcrypt) or an object with
// properties `digest` and `algorithm` (in which case we bcrypt
// `password.digest`).
//


Accounts._checkPassword = function (user, password) {
  var result = {
    userId: user._id
  };
  const formattedPassword = getPasswordString(password);
  const hash = user.services.password.bcrypt;
  const hashRounds = getRoundsFromBcryptHash(hash);

  if (!bcryptCompare(formattedPassword, hash)) {
    result.error = handleError("Incorrect password", false);
  } else if (hash && Accounts._bcryptRounds() != hashRounds) {
    // The password checks out, but the user's bcrypt hash needs to be updated.
    Meteor.defer(() => {
      Meteor.users.update({
        _id: user._id
      }, {
        $set: {
          'services.password.bcrypt': bcryptHash(formattedPassword, Accounts._bcryptRounds())
        }
      });
    });
  }

  return result;
};

var checkPassword = Accounts._checkPassword; ///
/// ERROR HANDLER
///

const handleError = (msg, throwError = true) => {
  const error = new Meteor.Error(403, Accounts._options.ambiguousErrorMessages ? "Something went wrong. Please check your credentials." : msg);

  if (throwError) {
    throw error;
  }

  return error;
}; ///
/// LOGIN
///


Accounts._findUserByQuery = function (query) {
  var user = null;

  if (query.id) {
    user = Meteor.users.findOne({
      _id: query.id
    });
  } else {
    var fieldName;
    var fieldValue;

    if (query.username) {
      fieldName = 'username';
      fieldValue = query.username;
    } else if (query.email) {
      fieldName = 'emails.address';
      fieldValue = query.email;
    } else {
      throw new Error("shouldn't happen (validation missed something)");
    }

    var selector = {};
    selector[fieldName] = fieldValue;
    user = Meteor.users.findOne(selector); // If user is not found, try a case insensitive lookup

    if (!user) {
      selector = selectorForFastCaseInsensitiveLookup(fieldName, fieldValue);
      var candidateUsers = Meteor.users.find(selector).fetch(); // No match if multiple candidates are found

      if (candidateUsers.length === 1) {
        user = candidateUsers[0];
      }
    }
  }

  return user;
};
/**
 * @summary Finds the user with the specified username.
 * First tries to match username case sensitively; if that fails, it
 * tries case insensitively; but if more than one user matches the case
 * insensitive search, it returns null.
 * @locus Server
 * @param {String} username The username to look for
 * @returns {Object} A user if found, else null
 * @importFromPackage accounts-base
 */


Accounts.findUserByUsername = function (username) {
  return Accounts._findUserByQuery({
    username: username
  });
};
/**
 * @summary Finds the user with the specified email.
 * First tries to match email case sensitively; if that fails, it
 * tries case insensitively; but if more than one user matches the case
 * insensitive search, it returns null.
 * @locus Server
 * @param {String} email The email address to look for
 * @returns {Object} A user if found, else null
 * @importFromPackage accounts-base
 */


Accounts.findUserByEmail = function (email) {
  return Accounts._findUserByQuery({
    email: email
  });
}; // Generates a MongoDB selector that can be used to perform a fast case
// insensitive lookup for the given fieldName and string. Since MongoDB does
// not support case insensitive indexes, and case insensitive regex queries
// are slow, we construct a set of prefix selectors for all permutations of
// the first 4 characters ourselves. We first attempt to matching against
// these, and because 'prefix expression' regex queries do use indexes (see
// http://docs.mongodb.org/v2.6/reference/operator/query/regex/#index-use),
// this has been found to greatly improve performance (from 1200ms to 5ms in a
// test with 1.000.000 users).


var selectorForFastCaseInsensitiveLookup = function (fieldName, string) {
  // Performance seems to improve up to 4 prefix characters
  var prefix = string.substring(0, Math.min(string.length, 4));

  var orClause = _.map(generateCasePermutationsForString(prefix), function (prefixPermutation) {
    var selector = {};
    selector[fieldName] = new RegExp('^' + Meteor._escapeRegExp(prefixPermutation));
    return selector;
  });

  var caseInsensitiveClause = {};
  caseInsensitiveClause[fieldName] = new RegExp('^' + Meteor._escapeRegExp(string) + '$', 'i');
  return {
    $and: [{
      $or: orClause
    }, caseInsensitiveClause]
  };
}; // Generates permutations of all case variations of a given string.


var generateCasePermutationsForString = function (string) {
  var permutations = [''];

  for (var i = 0; i < string.length; i++) {
    var ch = string.charAt(i);
    permutations = _.flatten(_.map(permutations, function (prefix) {
      var lowerCaseChar = ch.toLowerCase();
      var upperCaseChar = ch.toUpperCase(); // Don't add unneccesary permutations when ch is not a letter

      if (lowerCaseChar === upperCaseChar) {
        return [prefix + ch];
      } else {
        return [prefix + lowerCaseChar, prefix + upperCaseChar];
      }
    }));
  }

  return permutations;
};

var checkForCaseInsensitiveDuplicates = function (fieldName, displayName, fieldValue, ownUserId) {
  // Some tests need the ability to add users with the same case insensitive
  // value, hence the _skipCaseInsensitiveChecksForTest check
  var skipCheck = _.has(Accounts._skipCaseInsensitiveChecksForTest, fieldValue);

  if (fieldValue && !skipCheck) {
    var matchedUsers = Meteor.users.find(selectorForFastCaseInsensitiveLookup(fieldName, fieldValue)).fetch();

    if (matchedUsers.length > 0 && ( // If we don't have a userId yet, any match we find is a duplicate
    !ownUserId || // Otherwise, check to see if there are multiple matches or a match
    // that is not us
    matchedUsers.length > 1 || matchedUsers[0]._id !== ownUserId)) {
      handleError(displayName + " already exists.");
    }
  }
}; // XXX maybe this belongs in the check package


var NonEmptyString = Match.Where(function (x) {
  check(x, String);
  return x.length > 0;
});
var userQueryValidator = Match.Where(function (user) {
  check(user, {
    id: Match.Optional(NonEmptyString),
    username: Match.Optional(NonEmptyString),
    email: Match.Optional(NonEmptyString)
  });
  if (_.keys(user).length !== 1) throw new Match.Error("User property must have exactly one field");
  return true;
});
var passwordValidator = Match.OneOf(String, {
  digest: String,
  algorithm: String
}); // Handler to login with a password.
//
// The Meteor client sets options.password to an object with keys
// 'digest' (set to SHA256(password)) and 'algorithm' ("sha-256").
//
// For other DDP clients which don't have access to SHA, the handler
// also accepts the plaintext password in options.password as a string.
//
// (It might be nice if servers could turn the plaintext password
// option off. Or maybe it should be opt-in, not opt-out?
// Accounts.config option?)
//
// Note that neither password option is secure without SSL.
//

Accounts.registerLoginHandler("password", function (options) {
  if (!options.password || options.srp) return undefined; // don't handle

  check(options, {
    user: userQueryValidator,
    password: passwordValidator
  });

  var user = Accounts._findUserByQuery(options.user);

  if (!user) {
    handleError("User not found");
  }

  if (!user.services || !user.services.password || !(user.services.password.bcrypt || user.services.password.srp)) {
    handleError("User has no password set");
  }

  if (!user.services.password.bcrypt) {
    if (typeof options.password === "string") {
      // The client has presented a plaintext password, and the user is
      // not upgraded to bcrypt yet. We don't attempt to tell the client
      // to upgrade to bcrypt, because it might be a standalone DDP
      // client doesn't know how to do such a thing.
      var verifier = user.services.password.srp;
      var newVerifier = SRP.generateVerifier(options.password, {
        identity: verifier.identity,
        salt: verifier.salt
      });

      if (verifier.verifier !== newVerifier.verifier) {
        return {
          userId: Accounts._options.ambiguousErrorMessages ? null : user._id,
          error: handleError("Incorrect password", false)
        };
      }

      return {
        userId: user._id
      };
    } else {
      // Tell the client to use the SRP upgrade process.
      throw new Meteor.Error(400, "old password format", EJSON.stringify({
        format: 'srp',
        identity: user.services.password.srp.identity
      }));
    }
  }

  return checkPassword(user, options.password);
}); // Handler to login using the SRP upgrade path. To use this login
// handler, the client must provide:
//   - srp: H(identity + ":" + password)
//   - password: a string or an object with properties 'digest' and 'algorithm'
//
// We use `options.srp` to verify that the client knows the correct
// password without doing a full SRP flow. Once we've checked that, we
// upgrade the user to bcrypt and remove the SRP information from the
// user document.
//
// The client ends up using this login handler after trying the normal
// login handler (above), which throws an error telling the client to
// try the SRP upgrade path.
//
// XXX COMPAT WITH 0.8.1.3

Accounts.registerLoginHandler("password", function (options) {
  if (!options.srp || !options.password) {
    return undefined; // don't handle
  }

  check(options, {
    user: userQueryValidator,
    srp: String,
    password: passwordValidator
  });

  var user = Accounts._findUserByQuery(options.user);

  if (!user) {
    handleError("User not found");
  } // Check to see if another simultaneous login has already upgraded
  // the user record to bcrypt.


  if (user.services && user.services.password && user.services.password.bcrypt) {
    return checkPassword(user, options.password);
  }

  if (!(user.services && user.services.password && user.services.password.srp)) {
    handleError("User has no password set");
  }

  var v1 = user.services.password.srp.verifier;
  var v2 = SRP.generateVerifier(null, {
    hashedIdentityAndPassword: options.srp,
    salt: user.services.password.srp.salt
  }).verifier;

  if (v1 !== v2) {
    return {
      userId: Accounts._options.ambiguousErrorMessages ? null : user._id,
      error: handleError("Incorrect password", false)
    };
  } // Upgrade to bcrypt on successful login.


  var salted = hashPassword(options.password);
  Meteor.users.update(user._id, {
    $unset: {
      'services.password.srp': 1
    },
    $set: {
      'services.password.bcrypt': salted
    }
  });
  return {
    userId: user._id
  };
}); ///
/// CHANGING
///

/**
 * @summary Change a user's username. Use this instead of updating the
 * database directly. The operation will fail if there is an existing user
 * with a username only differing in case.
 * @locus Server
 * @param {String} userId The ID of the user to update.
 * @param {String} newUsername A new username for the user.
 * @importFromPackage accounts-base
 */

Accounts.setUsername = function (userId, newUsername) {
  check(userId, NonEmptyString);
  check(newUsername, NonEmptyString);
  var user = Meteor.users.findOne(userId);

  if (!user) {
    handleError("User not found");
  }

  var oldUsername = user.username; // Perform a case insensitive check for duplicates before update

  checkForCaseInsensitiveDuplicates('username', 'Username', newUsername, user._id);
  Meteor.users.update({
    _id: user._id
  }, {
    $set: {
      username: newUsername
    }
  }); // Perform another check after update, in case a matching user has been
  // inserted in the meantime

  try {
    checkForCaseInsensitiveDuplicates('username', 'Username', newUsername, user._id);
  } catch (ex) {
    // Undo update if the check fails
    Meteor.users.update({
      _id: user._id
    }, {
      $set: {
        username: oldUsername
      }
    });
    throw ex;
  }
}; // Let the user change their own password if they know the old
// password. `oldPassword` and `newPassword` should be objects with keys
// `digest` and `algorithm` (representing the SHA256 of the password).
//
// XXX COMPAT WITH 0.8.1.3
// Like the login method, if the user hasn't been upgraded from SRP to
// bcrypt yet, then this method will throw an 'old password format'
// error. The client should call the SRP upgrade login handler and then
// retry this method again.
//
// UNLIKE the login method, there is no way to avoid getting SRP upgrade
// errors thrown. The reasoning for this is that clients using this
// method directly will need to be updated anyway because we no longer
// support the SRP flow that they would have been doing to use this
// method previously.


Meteor.methods({
  changePassword: function (oldPassword, newPassword) {
    check(oldPassword, passwordValidator);
    check(newPassword, passwordValidator);

    if (!this.userId) {
      throw new Meteor.Error(401, "Must be logged in");
    }

    var user = Meteor.users.findOne(this.userId);

    if (!user) {
      handleError("User not found");
    }

    if (!user.services || !user.services.password || !user.services.password.bcrypt && !user.services.password.srp) {
      handleError("User has no password set");
    }

    if (!user.services.password.bcrypt) {
      throw new Meteor.Error(400, "old password format", EJSON.stringify({
        format: 'srp',
        identity: user.services.password.srp.identity
      }));
    }

    var result = checkPassword(user, oldPassword);

    if (result.error) {
      throw result.error;
    }

    var hashed = hashPassword(newPassword); // It would be better if this removed ALL existing tokens and replaced
    // the token for the current connection with a new one, but that would
    // be tricky, so we'll settle for just replacing all tokens other than
    // the one for the current connection.

    var currentToken = Accounts._getLoginToken(this.connection.id);

    Meteor.users.update({
      _id: this.userId
    }, {
      $set: {
        'services.password.bcrypt': hashed
      },
      $pull: {
        'services.resume.loginTokens': {
          hashedToken: {
            $ne: currentToken
          }
        }
      },
      $unset: {
        'services.password.reset': 1
      }
    });
    return {
      passwordChanged: true
    };
  }
}); // Force change the users password.

/**
 * @summary Forcibly change the password for a user.
 * @locus Server
 * @param {String} userId The id of the user to update.
 * @param {String} newPassword A new password for the user.
 * @param {Object} [options]
 * @param {Object} options.logout Logout all current connections with this userId (default: true)
 * @importFromPackage accounts-base
 */

Accounts.setPassword = function (userId, newPlaintextPassword, options) {
  options = _.extend({
    logout: true
  }, options);
  var user = Meteor.users.findOne(userId);

  if (!user) {
    throw new Meteor.Error(403, "User not found");
  }

  var update = {
    $unset: {
      'services.password.srp': 1,
      // XXX COMPAT WITH 0.8.1.3
      'services.password.reset': 1
    },
    $set: {
      'services.password.bcrypt': hashPassword(newPlaintextPassword)
    }
  };

  if (options.logout) {
    update.$unset['services.resume.loginTokens'] = 1;
  }

  Meteor.users.update({
    _id: user._id
  }, update);
}; ///
/// RESETTING VIA EMAIL
///
// Method called by a user to request a password reset email. This is
// the start of the reset process.


Meteor.methods({
  forgotPassword: function (options) {
    check(options, {
      email: String
    });
    var user = Accounts.findUserByEmail(options.email);

    if (!user) {
      handleError("User not found");
    }

    const emails = _.pluck(user.emails || [], 'address');

    const caseSensitiveEmail = _.find(emails, email => {
      return email.toLowerCase() === options.email.toLowerCase();
    });

    Accounts.sendResetPasswordEmail(user._id, caseSensitiveEmail);
  }
});
/**
 * @summary Generates a reset token and saves it into the database.
 * @locus Server
 * @param {String} userId The id of the user to generate the reset token for.
 * @param {String} email Which address of the user to generate the reset token for. This address must be in the user's `emails` list. If `null`, defaults to the first email in the list.
 * @param {String} reason `resetPassword` or `enrollAccount`.
 * @param {Object} [extraTokenData] Optional additional data to be added into the token record.
 * @returns {Object} Object with {email, user, token} values.
 * @importFromPackage accounts-base
 */

Accounts.generateResetToken = function (userId, email, reason, extraTokenData) {
  // Make sure the user exists, and email is one of their addresses.
  var user = Meteor.users.findOne(userId);

  if (!user) {
    handleError("Can't find user");
  } // pick the first email if we weren't passed an email.


  if (!email && user.emails && user.emails[0]) {
    email = user.emails[0].address;
  } // make sure we have a valid email


  if (!email || !_.contains(_.pluck(user.emails || [], 'address'), email)) {
    handleError("No such email for user.");
  }

  var token = Random.secret();
  var tokenRecord = {
    token: token,
    email: email,
    when: new Date()
  };

  if (reason === 'resetPassword') {
    tokenRecord.reason = 'reset';
  } else if (reason === 'enrollAccount') {
    tokenRecord.reason = 'enroll';
  } else if (reason) {
    // fallback so that this function can be used for unknown reasons as well
    tokenRecord.reason = reason;
  }

  if (extraTokenData) {
    _.extend(tokenRecord, extraTokenData);
  }

  Meteor.users.update({
    _id: user._id
  }, {
    $set: {
      'services.password.reset': tokenRecord
    }
  }); // before passing to template, update user object with new token

  Meteor._ensure(user, 'services', 'password').reset = tokenRecord;
  return {
    email,
    user,
    token
  };
};
/**
 * @summary Generates an e-mail verification token and saves it into the database.
 * @locus Server
 * @param {String} userId The id of the user to generate the  e-mail verification token for.
 * @param {String} email Which address of the user to generate the e-mail verification token for. This address must be in the user's `emails` list. If `null`, defaults to the first unverified email in the list.
 * @param {Object} [extraTokenData] Optional additional data to be added into the token record.
 * @returns {Object} Object with {email, user, token} values.
 * @importFromPackage accounts-base
 */


Accounts.generateVerificationToken = function (userId, email, extraTokenData) {
  // Make sure the user exists, and email is one of their addresses.
  var user = Meteor.users.findOne(userId);

  if (!user) {
    handleError("Can't find user");
  } // pick the first unverified email if we weren't passed an email.


  if (!email) {
    var emailRecord = _.find(user.emails || [], function (e) {
      return !e.verified;
    });

    email = (emailRecord || {}).address;

    if (!email) {
      handleError("That user has no unverified email addresses.");
    }
  } // make sure we have a valid email


  if (!email || !_.contains(_.pluck(user.emails || [], 'address'), email)) {
    handleError("No such email for user.");
  }

  var token = Random.secret();
  var tokenRecord = {
    token: token,
    // TODO: This should probably be renamed to "email" to match reset token record.
    address: email,
    when: new Date()
  };

  if (extraTokenData) {
    _.extend(tokenRecord, extraTokenData);
  }

  Meteor.users.update({
    _id: user._id
  }, {
    $push: {
      'services.email.verificationTokens': tokenRecord
    }
  }); // before passing to template, update user object with new token

  Meteor._ensure(user, 'services', 'email');

  if (!user.services.email.verificationTokens) {
    user.services.email.verificationTokens = [];
  }

  user.services.email.verificationTokens.push(tokenRecord);
  return {
    email,
    user,
    token
  };
};
/**
 * @summary Creates options for email sending for reset password and enroll account emails.
 * You can use this function when customizing a reset password or enroll account email sending.
 * @locus Server
 * @param {Object} email Which address of the user's to send the email to.
 * @param {Object} user The user object to generate options for.
 * @param {String} url URL to which user is directed to confirm the email.
 * @param {String} reason `resetPassword` or `enrollAccount`.
 * @returns {Object} Options which can be passed to `Email.send`.
 * @importFromPackage accounts-base
 */


Accounts.generateOptionsForEmail = function (email, user, url, reason) {
  var options = {
    to: email,
    from: Accounts.emailTemplates[reason].from ? Accounts.emailTemplates[reason].from(user) : Accounts.emailTemplates.from,
    subject: Accounts.emailTemplates[reason].subject(user)
  };

  if (typeof Accounts.emailTemplates[reason].text === 'function') {
    options.text = Accounts.emailTemplates[reason].text(user, url);
  }

  if (typeof Accounts.emailTemplates[reason].html === 'function') {
    options.html = Accounts.emailTemplates[reason].html(user, url);
  }

  if (typeof Accounts.emailTemplates.headers === 'object') {
    options.headers = Accounts.emailTemplates.headers;
  }

  return options;
}; // send the user an email with a link that when opened allows the user
// to set a new password, without the old password.

/**
 * @summary Send an email with a link the user can use to reset their password.
 * @locus Server
 * @param {String} userId The id of the user to send email to.
 * @param {String} [email] Optional. Which address of the user's to send the email to. This address must be in the user's `emails` list. Defaults to the first email in the list.
 * @param {Object} [extraTokenData] Optional additional data to be added into the token record.
 * @returns {Object} Object with {email, user, token, url, options} values.
 * @importFromPackage accounts-base
 */


Accounts.sendResetPasswordEmail = function (userId, email, extraTokenData) {
  const {
    email: realEmail,
    user,
    token
  } = Accounts.generateResetToken(userId, email, 'resetPassword', extraTokenData);
  const url = Accounts.urls.resetPassword(token);
  const options = Accounts.generateOptionsForEmail(realEmail, user, url, 'resetPassword');
  Email.send(options);
  return {
    email: realEmail,
    user,
    token,
    url,
    options
  };
}; // send the user an email informing them that their account was created, with
// a link that when opened both marks their email as verified and forces them
// to choose their password. The email must be one of the addresses in the
// user's emails field, or undefined to pick the first email automatically.
//
// This is not called automatically. It must be called manually if you
// want to use enrollment emails.

/**
 * @summary Send an email with a link the user can use to set their initial password.
 * @locus Server
 * @param {String} userId The id of the user to send email to.
 * @param {String} [email] Optional. Which address of the user's to send the email to. This address must be in the user's `emails` list. Defaults to the first email in the list.
 * @param {Object} [extraTokenData] Optional additional data to be added into the token record.
 * @returns {Object} Object with {email, user, token, url, options} values.
 * @importFromPackage accounts-base
 */


Accounts.sendEnrollmentEmail = function (userId, email, extraTokenData) {
  const {
    email: realEmail,
    user,
    token
  } = Accounts.generateResetToken(userId, email, 'enrollAccount', extraTokenData);
  const url = Accounts.urls.enrollAccount(token);
  const options = Accounts.generateOptionsForEmail(realEmail, user, url, 'enrollAccount');
  Email.send(options);
  return {
    email: realEmail,
    user,
    token,
    url,
    options
  };
}; // Take token from sendResetPasswordEmail or sendEnrollmentEmail, change
// the users password, and log them in.


Meteor.methods({
  resetPassword: function (token, newPassword) {
    var self = this;
    return Accounts._loginMethod(self, "resetPassword", arguments, "password", function () {
      check(token, String);
      check(newPassword, passwordValidator);
      var user = Meteor.users.findOne({
        "services.password.reset.token": token
      });

      if (!user) {
        throw new Meteor.Error(403, "Token expired");
      }

      var when = user.services.password.reset.when;
      var reason = user.services.password.reset.reason;

      var tokenLifetimeMs = Accounts._getPasswordResetTokenLifetimeMs();

      if (reason === "enroll") {
        tokenLifetimeMs = Accounts._getPasswordEnrollTokenLifetimeMs();
      }

      var currentTimeMs = Date.now();
      if (currentTimeMs - when > tokenLifetimeMs) throw new Meteor.Error(403, "Token expired");
      var email = user.services.password.reset.email;
      if (!_.include(_.pluck(user.emails || [], 'address'), email)) return {
        userId: user._id,
        error: new Meteor.Error(403, "Token has invalid email address")
      };
      var hashed = hashPassword(newPassword); // NOTE: We're about to invalidate tokens on the user, who we might be
      // logged in as. Make sure to avoid logging ourselves out if this
      // happens. But also make sure not to leave the connection in a state
      // of having a bad token set if things fail.

      var oldToken = Accounts._getLoginToken(self.connection.id);

      Accounts._setLoginToken(user._id, self.connection, null);

      var resetToOldToken = function () {
        Accounts._setLoginToken(user._id, self.connection, oldToken);
      };

      try {
        // Update the user record by:
        // - Changing the password to the new one
        // - Forgetting about the reset token that was just used
        // - Verifying their email, since they got the password reset via email.
        var affectedRecords = Meteor.users.update({
          _id: user._id,
          'emails.address': email,
          'services.password.reset.token': token
        }, {
          $set: {
            'services.password.bcrypt': hashed,
            'emails.$.verified': true
          },
          $unset: {
            'services.password.reset': 1,
            'services.password.srp': 1
          }
        });
        if (affectedRecords !== 1) return {
          userId: user._id,
          error: new Meteor.Error(403, "Invalid email")
        };
      } catch (err) {
        resetToOldToken();
        throw err;
      } // Replace all valid login tokens with new ones (changing
      // password should invalidate existing sessions).


      Accounts._clearAllLoginTokens(user._id);

      return {
        userId: user._id
      };
    });
  }
}); ///
/// EMAIL VERIFICATION
///
// send the user an email with a link that when opened marks that
// address as verified

/**
 * @summary Send an email with a link the user can use verify their email address.
 * @locus Server
 * @param {String} userId The id of the user to send email to.
 * @param {String} [email] Optional. Which address of the user's to send the email to. This address must be in the user's `emails` list. Defaults to the first unverified email in the list.
 * @param {Object} [extraTokenData] Optional additional data to be added into the token record.
 * @returns {Object} Object with {email, user, token, url, options} values.
 * @importFromPackage accounts-base
 */

Accounts.sendVerificationEmail = function (userId, email, extraTokenData) {
  // XXX Also generate a link using which someone can delete this
  // account if they own said address but weren't those who created
  // this account.
  const {
    email: realEmail,
    user,
    token
  } = Accounts.generateVerificationToken(userId, email, extraTokenData);
  const url = Accounts.urls.verifyEmail(token);
  const options = Accounts.generateOptionsForEmail(realEmail, user, url, 'verifyEmail');
  Email.send(options);
  return {
    email: realEmail,
    user,
    token,
    url,
    options
  };
}; // Take token from sendVerificationEmail, mark the email as verified,
// and log them in.


Meteor.methods({
  verifyEmail: function (token) {
    var self = this;
    return Accounts._loginMethod(self, "verifyEmail", arguments, "password", function () {
      check(token, String);
      var user = Meteor.users.findOne({
        'services.email.verificationTokens.token': token
      });
      if (!user) throw new Meteor.Error(403, "Verify email link expired");

      var tokenRecord = _.find(user.services.email.verificationTokens, function (t) {
        return t.token == token;
      });

      if (!tokenRecord) return {
        userId: user._id,
        error: new Meteor.Error(403, "Verify email link expired")
      };

      var emailsRecord = _.find(user.emails, function (e) {
        return e.address == tokenRecord.address;
      });

      if (!emailsRecord) return {
        userId: user._id,
        error: new Meteor.Error(403, "Verify email link is for unknown address")
      }; // By including the address in the query, we can use 'emails.$' in the
      // modifier to get a reference to the specific object in the emails
      // array. See
      // http://www.mongodb.org/display/DOCS/Updating/#Updating-The%24positionaloperator)
      // http://www.mongodb.org/display/DOCS/Updating#Updating-%24pull

      Meteor.users.update({
        _id: user._id,
        'emails.address': tokenRecord.address
      }, {
        $set: {
          'emails.$.verified': true
        },
        $pull: {
          'services.email.verificationTokens': {
            address: tokenRecord.address
          }
        }
      });
      return {
        userId: user._id
      };
    });
  }
});
/**
 * @summary Add an email address for a user. Use this instead of directly
 * updating the database. The operation will fail if there is a different user
 * with an email only differing in case. If the specified user has an existing
 * email only differing in case however, we replace it.
 * @locus Server
 * @param {String} userId The ID of the user to update.
 * @param {String} newEmail A new email address for the user.
 * @param {Boolean} [verified] Optional - whether the new email address should
 * be marked as verified. Defaults to false.
 * @importFromPackage accounts-base
 */

Accounts.addEmail = function (userId, newEmail, verified) {
  check(userId, NonEmptyString);
  check(newEmail, NonEmptyString);
  check(verified, Match.Optional(Boolean));

  if (_.isUndefined(verified)) {
    verified = false;
  }

  var user = Meteor.users.findOne(userId);
  if (!user) throw new Meteor.Error(403, "User not found"); // Allow users to change their own email to a version with a different case
  // We don't have to call checkForCaseInsensitiveDuplicates to do a case
  // insensitive check across all emails in the database here because: (1) if
  // there is no case-insensitive duplicate between this user and other users,
  // then we are OK and (2) if this would create a conflict with other users
  // then there would already be a case-insensitive duplicate and we can't fix
  // that in this code anyway.

  var caseInsensitiveRegExp = new RegExp('^' + Meteor._escapeRegExp(newEmail) + '$', 'i');

  var didUpdateOwnEmail = _.any(user.emails, function (email, index) {
    if (caseInsensitiveRegExp.test(email.address)) {
      Meteor.users.update({
        _id: user._id,
        'emails.address': email.address
      }, {
        $set: {
          'emails.$.address': newEmail,
          'emails.$.verified': verified
        }
      });
      return true;
    }

    return false;
  }); // In the other updates below, we have to do another call to
  // checkForCaseInsensitiveDuplicates to make sure that no conflicting values
  // were added to the database in the meantime. We don't have to do this for
  // the case where the user is updating their email address to one that is the
  // same as before, but only different because of capitalization. Read the
  // big comment above to understand why.


  if (didUpdateOwnEmail) {
    return;
  } // Perform a case insensitive check for duplicates before update


  checkForCaseInsensitiveDuplicates('emails.address', 'Email', newEmail, user._id);
  Meteor.users.update({
    _id: user._id
  }, {
    $addToSet: {
      emails: {
        address: newEmail,
        verified: verified
      }
    }
  }); // Perform another check after update, in case a matching user has been
  // inserted in the meantime

  try {
    checkForCaseInsensitiveDuplicates('emails.address', 'Email', newEmail, user._id);
  } catch (ex) {
    // Undo update if the check fails
    Meteor.users.update({
      _id: user._id
    }, {
      $pull: {
        emails: {
          address: newEmail
        }
      }
    });
    throw ex;
  }
};
/**
 * @summary Remove an email address for a user. Use this instead of updating
 * the database directly.
 * @locus Server
 * @param {String} userId The ID of the user to update.
 * @param {String} email The email address to remove.
 * @importFromPackage accounts-base
 */


Accounts.removeEmail = function (userId, email) {
  check(userId, NonEmptyString);
  check(email, NonEmptyString);
  var user = Meteor.users.findOne(userId);
  if (!user) throw new Meteor.Error(403, "User not found");
  Meteor.users.update({
    _id: user._id
  }, {
    $pull: {
      emails: {
        address: email
      }
    }
  });
}; ///
/// CREATING USERS
///
// Shared createUser function called from the createUser method, both
// if originates in client or server code. Calls user provided hooks,
// does the actual user insertion.
//
// returns the user id


var createUser = function (options) {
  // Unknown keys allowed, because a onCreateUserHook can take arbitrary
  // options.
  check(options, Match.ObjectIncluding({
    username: Match.Optional(String),
    email: Match.Optional(String),
    password: Match.Optional(passwordValidator)
  }));
  var username = options.username;
  var email = options.email;
  if (!username && !email) throw new Meteor.Error(400, "Need to set a username or email");
  var user = {
    services: {}
  };

  if (options.password) {
    var hashed = hashPassword(options.password);
    user.services.password = {
      bcrypt: hashed
    };
  }

  if (username) user.username = username;
  if (email) user.emails = [{
    address: email,
    verified: false
  }]; // Perform a case insensitive check before insert

  checkForCaseInsensitiveDuplicates('username', 'Username', username);
  checkForCaseInsensitiveDuplicates('emails.address', 'Email', email);
  var userId = Accounts.insertUserDoc(options, user); // Perform another check after insert, in case a matching user has been
  // inserted in the meantime

  try {
    checkForCaseInsensitiveDuplicates('username', 'Username', username, userId);
    checkForCaseInsensitiveDuplicates('emails.address', 'Email', email, userId);
  } catch (ex) {
    // Remove inserted user if the check fails
    Meteor.users.remove(userId);
    throw ex;
  }

  return userId;
}; // method for create user. Requests come from the client.


Meteor.methods({
  createUser: function (options) {
    var self = this;
    return Accounts._loginMethod(self, "createUser", arguments, "password", function () {
      // createUser() above does more checking.
      check(options, Object);
      if (Accounts._options.forbidClientAccountCreation) return {
        error: new Meteor.Error(403, "Signups forbidden")
      }; // Create user. result contains id and token.

      var userId = createUser(options); // safety belt. createUser is supposed to throw on error. send 500 error
      // instead of sending a verification email with empty userid.

      if (!userId) throw new Error("createUser failed to insert new user"); // If `Accounts._options.sendVerificationEmail` is set, register
      // a token to verify the user's primary email, and send it to
      // that address.

      if (options.email && Accounts._options.sendVerificationEmail) Accounts.sendVerificationEmail(userId, options.email); // client gets logged in as the new user afterwards.

      return {
        userId: userId
      };
    });
  }
}); // Create user directly on the server.
//
// Unlike the client version, this does not log you in as this user
// after creation.
//
// returns userId or throws an error if it can't create
//
// XXX add another argument ("server options") that gets sent to onCreateUser,
// which is always empty when called from the createUser method? eg, "admin:
// true", which we want to prevent the client from setting, but which a custom
// method calling Accounts.createUser could set?
//

Accounts.createUser = function (options, callback) {
  options = _.clone(options); // XXX allow an optional callback?

  if (callback) {
    throw new Error("Accounts.createUser with callback not supported on the server yet.");
  }

  return createUser(options);
}; ///
/// PASSWORD-SPECIFIC INDEXES ON USERS
///


Meteor.users._ensureIndex('services.email.verificationTokens.token', {
  unique: 1,
  sparse: 1
});

Meteor.users._ensureIndex('services.password.reset.token', {
  unique: 1,
  sparse: 1
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/accounts-password/email_templates.js");
require("/node_modules/meteor/accounts-password/password_server.js");

/* Exports */
Package._define("accounts-password");

})();

//# sourceURL=meteor://💻app/packages/accounts-password.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWNjb3VudHMtcGFzc3dvcmQvZW1haWxfdGVtcGxhdGVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9hY2NvdW50cy1wYXNzd29yZC9wYXNzd29yZF9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiZ3JlZXQiLCJ3ZWxjb21lTXNnIiwidXNlciIsInVybCIsImdyZWV0aW5nIiwicHJvZmlsZSIsIm5hbWUiLCJBY2NvdW50cyIsImVtYWlsVGVtcGxhdGVzIiwiZnJvbSIsInNpdGVOYW1lIiwiTWV0ZW9yIiwiYWJzb2x1dGVVcmwiLCJyZXBsYWNlIiwicmVzZXRQYXNzd29yZCIsInN1YmplY3QiLCJ0ZXh0IiwidmVyaWZ5RW1haWwiLCJlbnJvbGxBY2NvdW50IiwiYmNyeXB0IiwiTnBtTW9kdWxlQmNyeXB0IiwiYmNyeXB0SGFzaCIsIndyYXBBc3luYyIsImhhc2giLCJiY3J5cHRDb21wYXJlIiwiY29tcGFyZSIsIl9iY3J5cHRSb3VuZHMiLCJfb3B0aW9ucyIsImJjcnlwdFJvdW5kcyIsImdldFBhc3N3b3JkU3RyaW5nIiwicGFzc3dvcmQiLCJTSEEyNTYiLCJhbGdvcml0aG0iLCJFcnJvciIsImRpZ2VzdCIsImhhc2hQYXNzd29yZCIsImdldFJvdW5kc0Zyb21CY3J5cHRIYXNoIiwicm91bmRzIiwiaGFzaFNlZ21lbnRzIiwic3BsaXQiLCJsZW5ndGgiLCJwYXJzZUludCIsIl9jaGVja1Bhc3N3b3JkIiwicmVzdWx0IiwidXNlcklkIiwiX2lkIiwiZm9ybWF0dGVkUGFzc3dvcmQiLCJzZXJ2aWNlcyIsImhhc2hSb3VuZHMiLCJlcnJvciIsImhhbmRsZUVycm9yIiwiZGVmZXIiLCJ1c2VycyIsInVwZGF0ZSIsIiRzZXQiLCJjaGVja1Bhc3N3b3JkIiwibXNnIiwidGhyb3dFcnJvciIsImFtYmlndW91c0Vycm9yTWVzc2FnZXMiLCJfZmluZFVzZXJCeVF1ZXJ5IiwicXVlcnkiLCJpZCIsImZpbmRPbmUiLCJmaWVsZE5hbWUiLCJmaWVsZFZhbHVlIiwidXNlcm5hbWUiLCJlbWFpbCIsInNlbGVjdG9yIiwic2VsZWN0b3JGb3JGYXN0Q2FzZUluc2Vuc2l0aXZlTG9va3VwIiwiY2FuZGlkYXRlVXNlcnMiLCJmaW5kIiwiZmV0Y2giLCJmaW5kVXNlckJ5VXNlcm5hbWUiLCJmaW5kVXNlckJ5RW1haWwiLCJzdHJpbmciLCJwcmVmaXgiLCJzdWJzdHJpbmciLCJNYXRoIiwibWluIiwib3JDbGF1c2UiLCJfIiwibWFwIiwiZ2VuZXJhdGVDYXNlUGVybXV0YXRpb25zRm9yU3RyaW5nIiwicHJlZml4UGVybXV0YXRpb24iLCJSZWdFeHAiLCJfZXNjYXBlUmVnRXhwIiwiY2FzZUluc2Vuc2l0aXZlQ2xhdXNlIiwiJGFuZCIsIiRvciIsInBlcm11dGF0aW9ucyIsImkiLCJjaCIsImNoYXJBdCIsImZsYXR0ZW4iLCJsb3dlckNhc2VDaGFyIiwidG9Mb3dlckNhc2UiLCJ1cHBlckNhc2VDaGFyIiwidG9VcHBlckNhc2UiLCJjaGVja0ZvckNhc2VJbnNlbnNpdGl2ZUR1cGxpY2F0ZXMiLCJkaXNwbGF5TmFtZSIsIm93blVzZXJJZCIsInNraXBDaGVjayIsImhhcyIsIl9za2lwQ2FzZUluc2Vuc2l0aXZlQ2hlY2tzRm9yVGVzdCIsIm1hdGNoZWRVc2VycyIsIk5vbkVtcHR5U3RyaW5nIiwiTWF0Y2giLCJXaGVyZSIsIngiLCJjaGVjayIsIlN0cmluZyIsInVzZXJRdWVyeVZhbGlkYXRvciIsIk9wdGlvbmFsIiwia2V5cyIsInBhc3N3b3JkVmFsaWRhdG9yIiwiT25lT2YiLCJyZWdpc3RlckxvZ2luSGFuZGxlciIsIm9wdGlvbnMiLCJzcnAiLCJ1bmRlZmluZWQiLCJ2ZXJpZmllciIsIm5ld1ZlcmlmaWVyIiwiU1JQIiwiZ2VuZXJhdGVWZXJpZmllciIsImlkZW50aXR5Iiwic2FsdCIsIkVKU09OIiwic3RyaW5naWZ5IiwiZm9ybWF0IiwidjEiLCJ2MiIsImhhc2hlZElkZW50aXR5QW5kUGFzc3dvcmQiLCJzYWx0ZWQiLCIkdW5zZXQiLCJzZXRVc2VybmFtZSIsIm5ld1VzZXJuYW1lIiwib2xkVXNlcm5hbWUiLCJleCIsIm1ldGhvZHMiLCJjaGFuZ2VQYXNzd29yZCIsIm9sZFBhc3N3b3JkIiwibmV3UGFzc3dvcmQiLCJoYXNoZWQiLCJjdXJyZW50VG9rZW4iLCJfZ2V0TG9naW5Ub2tlbiIsImNvbm5lY3Rpb24iLCIkcHVsbCIsImhhc2hlZFRva2VuIiwiJG5lIiwicGFzc3dvcmRDaGFuZ2VkIiwic2V0UGFzc3dvcmQiLCJuZXdQbGFpbnRleHRQYXNzd29yZCIsImV4dGVuZCIsImxvZ291dCIsImZvcmdvdFBhc3N3b3JkIiwiZW1haWxzIiwicGx1Y2siLCJjYXNlU2Vuc2l0aXZlRW1haWwiLCJzZW5kUmVzZXRQYXNzd29yZEVtYWlsIiwiZ2VuZXJhdGVSZXNldFRva2VuIiwicmVhc29uIiwiZXh0cmFUb2tlbkRhdGEiLCJhZGRyZXNzIiwiY29udGFpbnMiLCJ0b2tlbiIsIlJhbmRvbSIsInNlY3JldCIsInRva2VuUmVjb3JkIiwid2hlbiIsIkRhdGUiLCJfZW5zdXJlIiwicmVzZXQiLCJnZW5lcmF0ZVZlcmlmaWNhdGlvblRva2VuIiwiZW1haWxSZWNvcmQiLCJlIiwidmVyaWZpZWQiLCIkcHVzaCIsInZlcmlmaWNhdGlvblRva2VucyIsInB1c2giLCJnZW5lcmF0ZU9wdGlvbnNGb3JFbWFpbCIsInRvIiwiaHRtbCIsImhlYWRlcnMiLCJyZWFsRW1haWwiLCJ1cmxzIiwiRW1haWwiLCJzZW5kIiwic2VuZEVucm9sbG1lbnRFbWFpbCIsInNlbGYiLCJfbG9naW5NZXRob2QiLCJhcmd1bWVudHMiLCJ0b2tlbkxpZmV0aW1lTXMiLCJfZ2V0UGFzc3dvcmRSZXNldFRva2VuTGlmZXRpbWVNcyIsIl9nZXRQYXNzd29yZEVucm9sbFRva2VuTGlmZXRpbWVNcyIsImN1cnJlbnRUaW1lTXMiLCJub3ciLCJpbmNsdWRlIiwib2xkVG9rZW4iLCJfc2V0TG9naW5Ub2tlbiIsInJlc2V0VG9PbGRUb2tlbiIsImFmZmVjdGVkUmVjb3JkcyIsImVyciIsIl9jbGVhckFsbExvZ2luVG9rZW5zIiwic2VuZFZlcmlmaWNhdGlvbkVtYWlsIiwidCIsImVtYWlsc1JlY29yZCIsImFkZEVtYWlsIiwibmV3RW1haWwiLCJCb29sZWFuIiwiaXNVbmRlZmluZWQiLCJjYXNlSW5zZW5zaXRpdmVSZWdFeHAiLCJkaWRVcGRhdGVPd25FbWFpbCIsImFueSIsImluZGV4IiwidGVzdCIsIiRhZGRUb1NldCIsInJlbW92ZUVtYWlsIiwiY3JlYXRlVXNlciIsIk9iamVjdEluY2x1ZGluZyIsImluc2VydFVzZXJEb2MiLCJyZW1vdmUiLCJPYmplY3QiLCJmb3JiaWRDbGllbnRBY2NvdW50Q3JlYXRpb24iLCJjYWxsYmFjayIsImNsb25lIiwiX2Vuc3VyZUluZGV4IiwidW5pcXVlIiwic3BhcnNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLFNBQVNBLEtBQVQsQ0FBZUMsVUFBZixFQUEyQjtBQUN6QixTQUFPLFVBQVNDLElBQVQsRUFBZUMsR0FBZixFQUFvQjtBQUN2QixRQUFJQyxRQUFRLEdBQUlGLElBQUksQ0FBQ0csT0FBTCxJQUFnQkgsSUFBSSxDQUFDRyxPQUFMLENBQWFDLElBQTlCLEdBQ1IsV0FBV0osSUFBSSxDQUFDRyxPQUFMLENBQWFDLElBQXhCLEdBQStCLEdBRHZCLEdBQzhCLFFBRDdDO0FBRUEsV0FBUSxHQUFFRixRQUFTOztFQUV2QkgsVUFBVzs7RUFFWEUsR0FBSTs7O0NBSkE7QUFRSCxHQVhEO0FBWUQ7QUFFRDs7Ozs7OztBQUtBSSxRQUFRLENBQUNDLGNBQVQsR0FBMEI7QUFDeEJDLE1BQUksRUFBRSx5Q0FEa0I7QUFFeEJDLFVBQVEsRUFBRUMsTUFBTSxDQUFDQyxXQUFQLEdBQXFCQyxPQUFyQixDQUE2QixjQUE3QixFQUE2QyxFQUE3QyxFQUFpREEsT0FBakQsQ0FBeUQsS0FBekQsRUFBZ0UsRUFBaEUsQ0FGYztBQUl4QkMsZUFBYSxFQUFFO0FBQ2JDLFdBQU8sRUFBRSxVQUFTYixJQUFULEVBQWU7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Q25ELEtBQS9DLEVBbkJRLENBcUJWOztBQUNBLGFBQU87QUFBQ3RCLGNBQU0sRUFBRUE7QUFBVCxPQUFQO0FBQ0QsS0E1QkksQ0FBUDtBQThCRDtBQWhDYyxDQUFmLEUsQ0FrQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBckMsUUFBUSxDQUFDa04sVUFBVCxHQUFzQixVQUFVcEcsT0FBVixFQUFtQjBHLFFBQW5CLEVBQTZCO0FBQ2pEMUcsU0FBTyxHQUFHckMsQ0FBQyxDQUFDZ0osS0FBRixDQUFRM0csT0FBUixDQUFWLENBRGlELENBR2pEOztBQUNBLE1BQUkwRyxRQUFKLEVBQWM7QUFDWixVQUFNLElBQUk5TCxLQUFKLENBQVUsb0VBQVYsQ0FBTjtBQUNEOztBQUVELFNBQU93TCxVQUFVLENBQUNwRyxPQUFELENBQWpCO0FBQ0QsQ0FURCxDLENBV0E7QUFDQTtBQUNBOzs7QUFDQTFHLE1BQU0sQ0FBQ3lDLEtBQVAsQ0FBYTZLLFlBQWIsQ0FBMEIseUNBQTFCLEVBQzBCO0FBQUNDLFFBQU0sRUFBRSxDQUFUO0FBQVlDLFFBQU0sRUFBRTtBQUFwQixDQUQxQjs7QUFFQXhOLE1BQU0sQ0FBQ3lDLEtBQVAsQ0FBYTZLLFlBQWIsQ0FBMEIsK0JBQTFCLEVBQzBCO0FBQUNDLFFBQU0sRUFBRSxDQUFUO0FBQVlDLFFBQU0sRUFBRTtBQUFwQixDQUQxQixFIiwiZmlsZSI6Ii9wYWNrYWdlcy9hY2NvdW50cy1wYXNzd29yZC5qcyIsInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIGdyZWV0KHdlbGNvbWVNc2cpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHVzZXIsIHVybCkge1xuICAgICAgdmFyIGdyZWV0aW5nID0gKHVzZXIucHJvZmlsZSAmJiB1c2VyLnByb2ZpbGUubmFtZSkgP1xuICAgICAgICAgICAgKFwiSGVsbG8gXCIgKyB1c2VyLnByb2ZpbGUubmFtZSArIFwiLFwiKSA6IFwiSGVsbG8sXCI7XG4gICAgICByZXR1cm4gYCR7Z3JlZXRpbmd9XG5cbiR7d2VsY29tZU1zZ30sIHNpbXBseSBjbGljayB0aGUgbGluayBiZWxvdy5cblxuJHt1cmx9XG5cblRoYW5rcy5cbmA7XG4gIH07XG59XG5cbi8qKlxuICogQHN1bW1hcnkgT3B0aW9ucyB0byBjdXN0b21pemUgZW1haWxzIHNlbnQgZnJvbSB0aGUgQWNjb3VudHMgc3lzdGVtLlxuICogQGxvY3VzIFNlcnZlclxuICogQGltcG9ydEZyb21QYWNrYWdlIGFjY291bnRzLWJhc2VcbiAqL1xuQWNjb3VudHMuZW1haWxUZW1wbGF0ZXMgPSB7XG4gIGZyb206IFwiQWNjb3VudHMgRXhhbXBsZSA8bm8tcmVwbHlAZXhhbXBsZS5jb20+XCIsXG4gIHNpdGVOYW1lOiBNZXRlb3IuYWJzb2x1dGVVcmwoKS5yZXBsYWNlKC9eaHR0cHM/OlxcL1xcLy8sICcnKS5yZXBsYWNlKC9cXC8kLywgJycpLFxuXG4gIHJlc2V0UGFzc3dvcmQ6IHtcbiAgICBzdWJqZWN0OiBmdW5jdGlvbih1c2VyKSB7XG4gICAgICByZXR1cm4gXCJIb3cgdG8gcmVzZXQgeW91ciBwYXNzd29yZCBvbiBcIiArIEFjY291bnRzLmVtYWlsVGVtcGxhdGVzLnNpdGVOYW1lO1xuICAgIH0sXG4gICAgdGV4dDogZ3JlZXQoXCJUbyByZXNldCB5b3VyIHBhc3N3b3JkXCIpXG4gIH0sXG4gIHZlcmlmeUVtYWlsOiB7XG4gICAgc3ViamVjdDogZnVuY3Rpb24odXNlcikge1xuICAgICAgcmV0dXJuIFwiSG93IHRvIHZlcmlmeSBlbWFpbCBhZGRyZXNzIG9uIFwiICsgQWNjb3VudHMuZW1haWxUZW1wbGF0ZXMuc2l0ZU5hbWU7XG4gICAgfSxcbiAgICB0ZXh0OiBncmVldChcIlRvIHZlcmlmeSB5b3VyIGFjY291bnQgZW1haWxcIilcbiAgfSxcbiAgZW5yb2xsQWNjb3VudDoge1xuICAgIHN1YmplY3Q6IGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgIHJldHVybiBcIkFuIGFjY291bnQgaGFzIGJlZW4gY3JlYXRlZCBmb3IgeW91IG9uIFwiICsgQWNjb3VudHMuZW1haWxUZW1wbGF0ZXMuc2l0ZU5hbWU7XG4gICAgfSxcbiAgICB0ZXh0OiBncmVldChcIlRvIHN0YXJ0IHVzaW5nIHRoZSBzZXJ2aWNlXCIpXG4gIH1cbn07XG4iLCIvLy8gQkNSWVBUXG5cbnZhciBiY3J5cHQgPSBOcG1Nb2R1bGVCY3J5cHQ7XG52YXIgYmNyeXB0SGFzaCA9IE1ldGVvci53cmFwQXN5bmMoYmNyeXB0Lmhhc2gpO1xudmFyIGJjcnlwdENvbXBhcmUgPSBNZXRlb3Iud3JhcEFzeW5jKGJjcnlwdC5jb21wYXJlKTtcblxuLy8gVXNlciByZWNvcmRzIGhhdmUgYSAnc2VydmljZXMucGFzc3dvcmQuYmNyeXB0JyBmaWVsZCBvbiB0aGVtIHRvIGhvbGRcbi8vIHRoZWlyIGhhc2hlZCBwYXNzd29yZHMgKHVubGVzcyB0aGV5IGhhdmUgYSAnc2VydmljZXMucGFzc3dvcmQuc3JwJ1xuLy8gZmllbGQsIGluIHdoaWNoIGNhc2UgdGhleSB3aWxsIGJlIHVwZ3JhZGVkIHRvIGJjcnlwdCB0aGUgbmV4dCB0aW1lXG4vLyB0aGV5IGxvZyBpbikuXG4vL1xuLy8gV2hlbiB0aGUgY2xpZW50IHNlbmRzIGEgcGFzc3dvcmQgdG8gdGhlIHNlcnZlciwgaXQgY2FuIGVpdGhlciBiZSBhXG4vLyBzdHJpbmcgKHRoZSBwbGFpbnRleHQgcGFzc3dvcmQpIG9yIGFuIG9iamVjdCB3aXRoIGtleXMgJ2RpZ2VzdCcgYW5kXG4vLyAnYWxnb3JpdGhtJyAobXVzdCBiZSBcInNoYS0yNTZcIiBmb3Igbm93KS4gVGhlIE1ldGVvciBjbGllbnQgYWx3YXlzIHNlbmRzXG4vLyBwYXNzd29yZCBvYmplY3RzIHsgZGlnZXN0OiAqLCBhbGdvcml0aG06IFwic2hhLTI1NlwiIH0sIGJ1dCBERFAgY2xpZW50c1xuLy8gdGhhdCBkb24ndCBoYXZlIGFjY2VzcyB0byBTSEEgY2FuIGp1c3Qgc2VuZCBwbGFpbnRleHQgcGFzc3dvcmRzIGFzXG4vLyBzdHJpbmdzLlxuLy9cbi8vIFdoZW4gdGhlIHNlcnZlciByZWNlaXZlcyBhIHBsYWludGV4dCBwYXNzd29yZCBhcyBhIHN0cmluZywgaXQgYWx3YXlzXG4vLyBoYXNoZXMgaXQgd2l0aCBTSEEyNTYgYmVmb3JlIHBhc3NpbmcgaXQgaW50byBiY3J5cHQuIFdoZW4gdGhlIHNlcnZlclxuLy8gcmVjZWl2ZXMgYSBwYXNzd29yZCBhcyBhbiBvYmplY3QsIGl0IGFzc2VydHMgdGhhdCB0aGUgYWxnb3JpdGhtIGlzXG4vLyBcInNoYS0yNTZcIiBhbmQgdGhlbiBwYXNzZXMgdGhlIGRpZ2VzdCB0byBiY3J5cHQuXG5cblxuQWNjb3VudHMuX2JjcnlwdFJvdW5kcyA9ICgpID0+IEFjY291bnRzLl9vcHRpb25zLmJjcnlwdFJvdW5kcyB8fCAxMDtcblxuLy8gR2l2ZW4gYSAncGFzc3dvcmQnIGZyb20gdGhlIGNsaWVudCwgZXh0cmFjdCB0aGUgc3RyaW5nIHRoYXQgd2Ugc2hvdWxkXG4vLyBiY3J5cHQuICdwYXNzd29yZCcgY2FuIGJlIG9uZSBvZjpcbi8vICAtIFN0cmluZyAodGhlIHBsYWludGV4dCBwYXNzd29yZClcbi8vICAtIE9iamVjdCB3aXRoICdkaWdlc3QnIGFuZCAnYWxnb3JpdGhtJyBrZXlzLiAnYWxnb3JpdGhtJyBtdXN0IGJlIFwic2hhLTI1NlwiLlxuLy9cbnZhciBnZXRQYXNzd29yZFN0cmluZyA9IGZ1bmN0aW9uIChwYXNzd29yZCkge1xuICBpZiAodHlwZW9mIHBhc3N3b3JkID09PSBcInN0cmluZ1wiKSB7XG4gICAgcGFzc3dvcmQgPSBTSEEyNTYocGFzc3dvcmQpO1xuICB9IGVsc2UgeyAvLyAncGFzc3dvcmQnIGlzIGFuIG9iamVjdFxuICAgIGlmIChwYXNzd29yZC5hbGdvcml0aG0gIT09IFwic2hhLTI1NlwiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHBhc3N3b3JkIGhhc2ggYWxnb3JpdGhtLiBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgXCJPbmx5ICdzaGEtMjU2JyBpcyBhbGxvd2VkLlwiKTtcbiAgICB9XG4gICAgcGFzc3dvcmQgPSBwYXNzd29yZC5kaWdlc3Q7XG4gIH1cbiAgcmV0dXJuIHBhc3N3b3JkO1xufTtcblxuLy8gVXNlIGJjcnlwdCB0byBoYXNoIHRoZSBwYXNzd29yZCBmb3Igc3RvcmFnZSBpbiB0aGUgZGF0YWJhc2UuXG4vLyBgcGFzc3dvcmRgIGNhbiBiZSBhIHN0cmluZyAoaW4gd2hpY2ggY2FzZSBpdCB3aWxsIGJlIHJ1biB0aHJvdWdoXG4vLyBTSEEyNTYgYmVmb3JlIGJjcnlwdCkgb3IgYW4gb2JqZWN0IHdpdGggcHJvcGVydGllcyBgZGlnZXN0YCBhbmRcbi8vIGBhbGdvcml0aG1gIChpbiB3aGljaCBjYXNlIHdlIGJjcnlwdCBgcGFzc3dvcmQuZGlnZXN0YCkuXG4vL1xudmFyIGhhc2hQYXNzd29yZCA9IGZ1bmN0aW9uIChwYXNzd29yZCkge1xuICBwYXNzd29yZCA9IGdldFBhc3N3b3JkU3RyaW5nKHBhc3N3b3JkKTtcbiAgcmV0dXJuIGJjcnlwdEhhc2gocGFzc3dvcmQsIEFjY291bnRzLl9iY3J5cHRSb3VuZHMoKSk7XG59O1xuXG4vLyBFeHRyYWN0IHRoZSBudW1iZXIgb2Ygcm91bmRzIHVzZWQgaW4gdGhlIHNwZWNpZmllZCBiY3J5cHQgaGFzaC5cbmNvbnN0IGdldFJvdW5kc0Zyb21CY3J5cHRIYXNoID0gaGFzaCA9PiB7XG4gIGxldCByb3VuZHM7XG4gIGlmIChoYXNoKSB7XG4gICAgY29uc3QgaGFzaFNlZ21lbnRzID0gaGFzaC5zcGxpdCgnJCcpO1xuICAgIGlmIChoYXNoU2VnbWVudHMubGVuZ3RoID4gMikge1xuICAgICAgcm91bmRzID0gcGFyc2VJbnQoaGFzaFNlZ21lbnRzWzJdLCAxMCk7XG4gICAgfVxuICB9XG4gIHJldHVybiByb3VuZHM7XG59O1xuXG4vLyBDaGVjayB3aGV0aGVyIHRoZSBwcm92aWRlZCBwYXNzd29yZCBtYXRjaGVzIHRoZSBiY3J5cHQnZWQgcGFzc3dvcmQgaW5cbi8vIHRoZSBkYXRhYmFzZSB1c2VyIHJlY29yZC4gYHBhc3N3b3JkYCBjYW4gYmUgYSBzdHJpbmcgKGluIHdoaWNoIGNhc2Vcbi8vIGl0IHdpbGwgYmUgcnVuIHRocm91Z2ggU0hBMjU2IGJlZm9yZSBiY3J5cHQpIG9yIGFuIG9iamVjdCB3aXRoXG4vLyBwcm9wZXJ0aWVzIGBkaWdlc3RgIGFuZCBgYWxnb3JpdGhtYCAoaW4gd2hpY2ggY2FzZSB3ZSBiY3J5cHRcbi8vIGBwYXNzd29yZC5kaWdlc3RgKS5cbi8vXG5BY2NvdW50cy5fY2hlY2tQYXNzd29yZCA9IGZ1bmN0aW9uICh1c2VyLCBwYXNzd29yZCkge1xuICB2YXIgcmVzdWx0ID0ge1xuICAgIHVzZXJJZDogdXNlci5faWRcbiAgfTtcblxuICBjb25zdCBmb3JtYXR0ZWRQYXNzd29yZCA9IGdldFBhc3N3b3JkU3RyaW5nKHBhc3N3b3JkKTtcbiAgY29uc3QgaGFzaCA9IHVzZXIuc2VydmljZXMucGFzc3dvcmQuYmNyeXB0O1xuICBjb25zdCBoYXNoUm91bmRzID0gZ2V0Um91bmRzRnJvbUJjcnlwdEhhc2goaGFzaCk7XG5cbiAgaWYgKCEgYmNyeXB0Q29tcGFyZShmb3JtYXR0ZWRQYXNzd29yZCwgaGFzaCkpIHtcbiAgICByZXN1bHQuZXJyb3IgPSBoYW5kbGVFcnJvcihcIkluY29ycmVjdCBwYXNzd29yZFwiLCBmYWxzZSk7XG4gIH0gZWxzZSBpZiAoaGFzaCAmJiBBY2NvdW50cy5fYmNyeXB0Um91bmRzKCkgIT0gaGFzaFJvdW5kcykge1xuICAgIC8vIFRoZSBwYXNzd29yZCBjaGVja3Mgb3V0LCBidXQgdGhlIHVzZXIncyBiY3J5cHQgaGFzaCBuZWVkcyB0byBiZSB1cGRhdGVkLlxuICAgIE1ldGVvci5kZWZlcigoKSA9PiB7XG4gICAgICBNZXRlb3IudXNlcnMudXBkYXRlKHsgX2lkOiB1c2VyLl9pZCB9LCB7XG4gICAgICAgICRzZXQ6IHtcbiAgICAgICAgICAnc2VydmljZXMucGFzc3dvcmQuYmNyeXB0JzpcbiAgICAgICAgICAgIGJjcnlwdEhhc2goZm9ybWF0dGVkUGFzc3dvcmQsIEFjY291bnRzLl9iY3J5cHRSb3VuZHMoKSlcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufTtcbnZhciBjaGVja1Bhc3N3b3JkID0gQWNjb3VudHMuX2NoZWNrUGFzc3dvcmQ7XG5cbi8vL1xuLy8vIEVSUk9SIEhBTkRMRVJcbi8vL1xuY29uc3QgaGFuZGxlRXJyb3IgPSAobXNnLCB0aHJvd0Vycm9yID0gdHJ1ZSkgPT4ge1xuICBjb25zdCBlcnJvciA9IG5ldyBNZXRlb3IuRXJyb3IoXG4gICAgNDAzLFxuICAgIEFjY291bnRzLl9vcHRpb25zLmFtYmlndW91c0Vycm9yTWVzc2FnZXNcbiAgICAgID8gXCJTb21ldGhpbmcgd2VudCB3cm9uZy4gUGxlYXNlIGNoZWNrIHlvdXIgY3JlZGVudGlhbHMuXCJcbiAgICAgIDogbXNnXG4gICk7XG4gIGlmICh0aHJvd0Vycm9yKSB7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbiAgcmV0dXJuIGVycm9yO1xufTtcblxuLy8vXG4vLy8gTE9HSU5cbi8vL1xuXG5BY2NvdW50cy5fZmluZFVzZXJCeVF1ZXJ5ID0gZnVuY3Rpb24gKHF1ZXJ5KSB7XG4gIHZhciB1c2VyID0gbnVsbDtcblxuICBpZiAocXVlcnkuaWQpIHtcbiAgICB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUoeyBfaWQ6IHF1ZXJ5LmlkIH0pO1xuICB9IGVsc2Uge1xuICAgIHZhciBmaWVsZE5hbWU7XG4gICAgdmFyIGZpZWxkVmFsdWU7XG4gICAgaWYgKHF1ZXJ5LnVzZXJuYW1lKSB7XG4gICAgICBmaWVsZE5hbWUgPSAndXNlcm5hbWUnO1xuICAgICAgZmllbGRWYWx1ZSA9IHF1ZXJ5LnVzZXJuYW1lO1xuICAgIH0gZWxzZSBpZiAocXVlcnkuZW1haWwpIHtcbiAgICAgIGZpZWxkTmFtZSA9ICdlbWFpbHMuYWRkcmVzcyc7XG4gICAgICBmaWVsZFZhbHVlID0gcXVlcnkuZW1haWw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcInNob3VsZG4ndCBoYXBwZW4gKHZhbGlkYXRpb24gbWlzc2VkIHNvbWV0aGluZylcIik7XG4gICAgfVxuICAgIHZhciBzZWxlY3RvciA9IHt9O1xuICAgIHNlbGVjdG9yW2ZpZWxkTmFtZV0gPSBmaWVsZFZhbHVlO1xuICAgIHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZShzZWxlY3Rvcik7XG4gICAgLy8gSWYgdXNlciBpcyBub3QgZm91bmQsIHRyeSBhIGNhc2UgaW5zZW5zaXRpdmUgbG9va3VwXG4gICAgaWYgKCF1c2VyKSB7XG4gICAgICBzZWxlY3RvciA9IHNlbGVjdG9yRm9yRmFzdENhc2VJbnNlbnNpdGl2ZUxvb2t1cChmaWVsZE5hbWUsIGZpZWxkVmFsdWUpO1xuICAgICAgdmFyIGNhbmRpZGF0ZVVzZXJzID0gTWV0ZW9yLnVzZXJzLmZpbmQoc2VsZWN0b3IpLmZldGNoKCk7XG4gICAgICAvLyBObyBtYXRjaCBpZiBtdWx0aXBsZSBjYW5kaWRhdGVzIGFyZSBmb3VuZFxuICAgICAgaWYgKGNhbmRpZGF0ZVVzZXJzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICB1c2VyID0gY2FuZGlkYXRlVXNlcnNbMF07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHVzZXI7XG59O1xuXG4vKipcbiAqIEBzdW1tYXJ5IEZpbmRzIHRoZSB1c2VyIHdpdGggdGhlIHNwZWNpZmllZCB1c2VybmFtZS5cbiAqIEZpcnN0IHRyaWVzIHRvIG1hdGNoIHVzZXJuYW1lIGNhc2Ugc2Vuc2l0aXZlbHk7IGlmIHRoYXQgZmFpbHMsIGl0XG4gKiB0cmllcyBjYXNlIGluc2Vuc2l0aXZlbHk7IGJ1dCBpZiBtb3JlIHRoYW4gb25lIHVzZXIgbWF0Y2hlcyB0aGUgY2FzZVxuICogaW5zZW5zaXRpdmUgc2VhcmNoLCBpdCByZXR1cm5zIG51bGwuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAcGFyYW0ge1N0cmluZ30gdXNlcm5hbWUgVGhlIHVzZXJuYW1lIHRvIGxvb2sgZm9yXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIHVzZXIgaWYgZm91bmQsIGVsc2UgbnVsbFxuICogQGltcG9ydEZyb21QYWNrYWdlIGFjY291bnRzLWJhc2VcbiAqL1xuQWNjb3VudHMuZmluZFVzZXJCeVVzZXJuYW1lID0gZnVuY3Rpb24gKHVzZXJuYW1lKSB7XG4gIHJldHVybiBBY2NvdW50cy5fZmluZFVzZXJCeVF1ZXJ5KHtcbiAgICB1c2VybmFtZTogdXNlcm5hbWVcbiAgfSk7XG59O1xuXG4vKipcbiAqIEBzdW1tYXJ5IEZpbmRzIHRoZSB1c2VyIHdpdGggdGhlIHNwZWNpZmllZCBlbWFpbC5cbiAqIEZpcnN0IHRyaWVzIHRvIG1hdGNoIGVtYWlsIGNhc2Ugc2Vuc2l0aXZlbHk7IGlmIHRoYXQgZmFpbHMsIGl0XG4gKiB0cmllcyBjYXNlIGluc2Vuc2l0aXZlbHk7IGJ1dCBpZiBtb3JlIHRoYW4gb25lIHVzZXIgbWF0Y2hlcyB0aGUgY2FzZVxuICogaW5zZW5zaXRpdmUgc2VhcmNoLCBpdCByZXR1cm5zIG51bGwuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAcGFyYW0ge1N0cmluZ30gZW1haWwgVGhlIGVtYWlsIGFkZHJlc3MgdG8gbG9vayBmb3JcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgdXNlciBpZiBmb3VuZCwgZWxzZSBudWxsXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgYWNjb3VudHMtYmFzZVxuICovXG5BY2NvdW50cy5maW5kVXNlckJ5RW1haWwgPSBmdW5jdGlvbiAoZW1haWwpIHtcbiAgcmV0dXJuIEFjY291bnRzLl9maW5kVXNlckJ5UXVlcnkoe1xuICAgIGVtYWlsOiBlbWFpbFxuICB9KTtcbn07XG5cbi8vIEdlbmVyYXRlcyBhIE1vbmdvREIgc2VsZWN0b3IgdGhhdCBjYW4gYmUgdXNlZCB0byBwZXJmb3JtIGEgZmFzdCBjYXNlXG4vLyBpbnNlbnNpdGl2ZSBsb29rdXAgZm9yIHRoZSBnaXZlbiBmaWVsZE5hbWUgYW5kIHN0cmluZy4gU2luY2UgTW9uZ29EQiBkb2VzXG4vLyBub3Qgc3VwcG9ydCBjYXNlIGluc2Vuc2l0aXZlIGluZGV4ZXMsIGFuZCBjYXNlIGluc2Vuc2l0aXZlIHJlZ2V4IHF1ZXJpZXNcbi8vIGFyZSBzbG93LCB3ZSBjb25zdHJ1Y3QgYSBzZXQgb2YgcHJlZml4IHNlbGVjdG9ycyBmb3IgYWxsIHBlcm11dGF0aW9ucyBvZlxuLy8gdGhlIGZpcnN0IDQgY2hhcmFjdGVycyBvdXJzZWx2ZXMuIFdlIGZpcnN0IGF0dGVtcHQgdG8gbWF0Y2hpbmcgYWdhaW5zdFxuLy8gdGhlc2UsIGFuZCBiZWNhdXNlICdwcmVmaXggZXhwcmVzc2lvbicgcmVnZXggcXVlcmllcyBkbyB1c2UgaW5kZXhlcyAoc2VlXG4vLyBodHRwOi8vZG9jcy5tb25nb2RiLm9yZy92Mi42L3JlZmVyZW5jZS9vcGVyYXRvci9xdWVyeS9yZWdleC8jaW5kZXgtdXNlKSxcbi8vIHRoaXMgaGFzIGJlZW4gZm91bmQgdG8gZ3JlYXRseSBpbXByb3ZlIHBlcmZvcm1hbmNlIChmcm9tIDEyMDBtcyB0byA1bXMgaW4gYVxuLy8gdGVzdCB3aXRoIDEuMDAwLjAwMCB1c2VycykuXG52YXIgc2VsZWN0b3JGb3JGYXN0Q2FzZUluc2Vuc2l0aXZlTG9va3VwID0gZnVuY3Rpb24gKGZpZWxkTmFtZSwgc3RyaW5nKSB7XG4gIC8vIFBlcmZvcm1hbmNlIHNlZW1zIHRvIGltcHJvdmUgdXAgdG8gNCBwcmVmaXggY2hhcmFjdGVyc1xuICB2YXIgcHJlZml4ID0gc3RyaW5nLnN1YnN0cmluZygwLCBNYXRoLm1pbihzdHJpbmcubGVuZ3RoLCA0KSk7XG4gIHZhciBvckNsYXVzZSA9IF8ubWFwKGdlbmVyYXRlQ2FzZVBlcm11dGF0aW9uc0ZvclN0cmluZyhwcmVmaXgpLFxuICAgIGZ1bmN0aW9uIChwcmVmaXhQZXJtdXRhdGlvbikge1xuICAgICAgdmFyIHNlbGVjdG9yID0ge307XG4gICAgICBzZWxlY3RvcltmaWVsZE5hbWVdID1cbiAgICAgICAgbmV3IFJlZ0V4cCgnXicgKyBNZXRlb3IuX2VzY2FwZVJlZ0V4cChwcmVmaXhQZXJtdXRhdGlvbikpO1xuICAgICAgcmV0dXJuIHNlbGVjdG9yO1xuICAgIH0pO1xuICB2YXIgY2FzZUluc2Vuc2l0aXZlQ2xhdXNlID0ge307XG4gIGNhc2VJbnNlbnNpdGl2ZUNsYXVzZVtmaWVsZE5hbWVdID1cbiAgICBuZXcgUmVnRXhwKCdeJyArIE1ldGVvci5fZXNjYXBlUmVnRXhwKHN0cmluZykgKyAnJCcsICdpJylcbiAgcmV0dXJuIHskYW5kOiBbeyRvcjogb3JDbGF1c2V9LCBjYXNlSW5zZW5zaXRpdmVDbGF1c2VdfTtcbn1cblxuLy8gR2VuZXJhdGVzIHBlcm11dGF0aW9ucyBvZiBhbGwgY2FzZSB2YXJpYXRpb25zIG9mIGEgZ2l2ZW4gc3RyaW5nLlxudmFyIGdlbmVyYXRlQ2FzZVBlcm11dGF0aW9uc0ZvclN0cmluZyA9IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgdmFyIHBlcm11dGF0aW9ucyA9IFsnJ107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyaW5nLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGNoID0gc3RyaW5nLmNoYXJBdChpKTtcbiAgICBwZXJtdXRhdGlvbnMgPSBfLmZsYXR0ZW4oXy5tYXAocGVybXV0YXRpb25zLCBmdW5jdGlvbiAocHJlZml4KSB7XG4gICAgICB2YXIgbG93ZXJDYXNlQ2hhciA9IGNoLnRvTG93ZXJDYXNlKCk7XG4gICAgICB2YXIgdXBwZXJDYXNlQ2hhciA9IGNoLnRvVXBwZXJDYXNlKCk7XG4gICAgICAvLyBEb24ndCBhZGQgdW5uZWNjZXNhcnkgcGVybXV0YXRpb25zIHdoZW4gY2ggaXMgbm90IGEgbGV0dGVyXG4gICAgICBpZiAobG93ZXJDYXNlQ2hhciA9PT0gdXBwZXJDYXNlQ2hhcikge1xuICAgICAgICByZXR1cm4gW3ByZWZpeCArIGNoXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBbcHJlZml4ICsgbG93ZXJDYXNlQ2hhciwgcHJlZml4ICsgdXBwZXJDYXNlQ2hhcl07XG4gICAgICB9XG4gICAgfSkpO1xuICB9XG4gIHJldHVybiBwZXJtdXRhdGlvbnM7XG59XG5cbnZhciBjaGVja0ZvckNhc2VJbnNlbnNpdGl2ZUR1cGxpY2F0ZXMgPSBmdW5jdGlvbiAoZmllbGROYW1lLCBkaXNwbGF5TmFtZSwgZmllbGRWYWx1ZSwgb3duVXNlcklkKSB7XG4gIC8vIFNvbWUgdGVzdHMgbmVlZCB0aGUgYWJpbGl0eSB0byBhZGQgdXNlcnMgd2l0aCB0aGUgc2FtZSBjYXNlIGluc2Vuc2l0aXZlXG4gIC8vIHZhbHVlLCBoZW5jZSB0aGUgX3NraXBDYXNlSW5zZW5zaXRpdmVDaGVja3NGb3JUZXN0IGNoZWNrXG4gIHZhciBza2lwQ2hlY2sgPSBfLmhhcyhBY2NvdW50cy5fc2tpcENhc2VJbnNlbnNpdGl2ZUNoZWNrc0ZvclRlc3QsIGZpZWxkVmFsdWUpO1xuXG4gIGlmIChmaWVsZFZhbHVlICYmICFza2lwQ2hlY2spIHtcbiAgICB2YXIgbWF0Y2hlZFVzZXJzID0gTWV0ZW9yLnVzZXJzLmZpbmQoXG4gICAgICBzZWxlY3RvckZvckZhc3RDYXNlSW5zZW5zaXRpdmVMb29rdXAoZmllbGROYW1lLCBmaWVsZFZhbHVlKSkuZmV0Y2goKTtcblxuICAgIGlmIChtYXRjaGVkVXNlcnMubGVuZ3RoID4gMCAmJlxuICAgICAgICAvLyBJZiB3ZSBkb24ndCBoYXZlIGEgdXNlcklkIHlldCwgYW55IG1hdGNoIHdlIGZpbmQgaXMgYSBkdXBsaWNhdGVcbiAgICAgICAgKCFvd25Vc2VySWQgfHxcbiAgICAgICAgLy8gT3RoZXJ3aXNlLCBjaGVjayB0byBzZWUgaWYgdGhlcmUgYXJlIG11bHRpcGxlIG1hdGNoZXMgb3IgYSBtYXRjaFxuICAgICAgICAvLyB0aGF0IGlzIG5vdCB1c1xuICAgICAgICAobWF0Y2hlZFVzZXJzLmxlbmd0aCA+IDEgfHwgbWF0Y2hlZFVzZXJzWzBdLl9pZCAhPT0gb3duVXNlcklkKSkpIHtcbiAgICAgIGhhbmRsZUVycm9yKGRpc3BsYXlOYW1lICsgXCIgYWxyZWFkeSBleGlzdHMuXCIpO1xuICAgIH1cbiAgfVxufTtcblxuLy8gWFhYIG1heWJlIHRoaXMgYmVsb25ncyBpbiB0aGUgY2hlY2sgcGFja2FnZVxudmFyIE5vbkVtcHR5U3RyaW5nID0gTWF0Y2guV2hlcmUoZnVuY3Rpb24gKHgpIHtcbiAgY2hlY2soeCwgU3RyaW5nKTtcbiAgcmV0dXJuIHgubGVuZ3RoID4gMDtcbn0pO1xuXG52YXIgdXNlclF1ZXJ5VmFsaWRhdG9yID0gTWF0Y2guV2hlcmUoZnVuY3Rpb24gKHVzZXIpIHtcbiAgY2hlY2sodXNlciwge1xuICAgIGlkOiBNYXRjaC5PcHRpb25hbChOb25FbXB0eVN0cmluZyksXG4gICAgdXNlcm5hbWU6IE1hdGNoLk9wdGlvbmFsKE5vbkVtcHR5U3RyaW5nKSxcbiAgICBlbWFpbDogTWF0Y2guT3B0aW9uYWwoTm9uRW1wdHlTdHJpbmcpXG4gIH0pO1xuICBpZiAoXy5rZXlzKHVzZXIpLmxlbmd0aCAhPT0gMSlcbiAgICB0aHJvdyBuZXcgTWF0Y2guRXJyb3IoXCJVc2VyIHByb3BlcnR5IG11c3QgaGF2ZSBleGFjdGx5IG9uZSBmaWVsZFwiKTtcbiAgcmV0dXJuIHRydWU7XG59KTtcblxudmFyIHBhc3N3b3JkVmFsaWRhdG9yID0gTWF0Y2guT25lT2YoXG4gIFN0cmluZyxcbiAgeyBkaWdlc3Q6IFN0cmluZywgYWxnb3JpdGhtOiBTdHJpbmcgfVxuKTtcblxuLy8gSGFuZGxlciB0byBsb2dpbiB3aXRoIGEgcGFzc3dvcmQuXG4vL1xuLy8gVGhlIE1ldGVvciBjbGllbnQgc2V0cyBvcHRpb25zLnBhc3N3b3JkIHRvIGFuIG9iamVjdCB3aXRoIGtleXNcbi8vICdkaWdlc3QnIChzZXQgdG8gU0hBMjU2KHBhc3N3b3JkKSkgYW5kICdhbGdvcml0aG0nIChcInNoYS0yNTZcIikuXG4vL1xuLy8gRm9yIG90aGVyIEREUCBjbGllbnRzIHdoaWNoIGRvbid0IGhhdmUgYWNjZXNzIHRvIFNIQSwgdGhlIGhhbmRsZXJcbi8vIGFsc28gYWNjZXB0cyB0aGUgcGxhaW50ZXh0IHBhc3N3b3JkIGluIG9wdGlvbnMucGFzc3dvcmQgYXMgYSBzdHJpbmcuXG4vL1xuLy8gKEl0IG1pZ2h0IGJlIG5pY2UgaWYgc2VydmVycyBjb3VsZCB0dXJuIHRoZSBwbGFpbnRleHQgcGFzc3dvcmRcbi8vIG9wdGlvbiBvZmYuIE9yIG1heWJlIGl0IHNob3VsZCBiZSBvcHQtaW4sIG5vdCBvcHQtb3V0P1xuLy8gQWNjb3VudHMuY29uZmlnIG9wdGlvbj8pXG4vL1xuLy8gTm90ZSB0aGF0IG5laXRoZXIgcGFzc3dvcmQgb3B0aW9uIGlzIHNlY3VyZSB3aXRob3V0IFNTTC5cbi8vXG5BY2NvdW50cy5yZWdpc3RlckxvZ2luSGFuZGxlcihcInBhc3N3b3JkXCIsIGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIGlmICghIG9wdGlvbnMucGFzc3dvcmQgfHwgb3B0aW9ucy5zcnApXG4gICAgcmV0dXJuIHVuZGVmaW5lZDsgLy8gZG9uJ3QgaGFuZGxlXG5cbiAgY2hlY2sob3B0aW9ucywge1xuICAgIHVzZXI6IHVzZXJRdWVyeVZhbGlkYXRvcixcbiAgICBwYXNzd29yZDogcGFzc3dvcmRWYWxpZGF0b3JcbiAgfSk7XG5cblxuICB2YXIgdXNlciA9IEFjY291bnRzLl9maW5kVXNlckJ5UXVlcnkob3B0aW9ucy51c2VyKTtcbiAgaWYgKCF1c2VyKSB7XG4gICAgaGFuZGxlRXJyb3IoXCJVc2VyIG5vdCBmb3VuZFwiKTtcbiAgfVxuXG4gIGlmICghdXNlci5zZXJ2aWNlcyB8fCAhdXNlci5zZXJ2aWNlcy5wYXNzd29yZCB8fFxuICAgICAgISh1c2VyLnNlcnZpY2VzLnBhc3N3b3JkLmJjcnlwdCB8fCB1c2VyLnNlcnZpY2VzLnBhc3N3b3JkLnNycCkpIHtcbiAgICBoYW5kbGVFcnJvcihcIlVzZXIgaGFzIG5vIHBhc3N3b3JkIHNldFwiKTtcbiAgfVxuXG4gIGlmICghdXNlci5zZXJ2aWNlcy5wYXNzd29yZC5iY3J5cHQpIHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMucGFzc3dvcmQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIC8vIFRoZSBjbGllbnQgaGFzIHByZXNlbnRlZCBhIHBsYWludGV4dCBwYXNzd29yZCwgYW5kIHRoZSB1c2VyIGlzXG4gICAgICAvLyBub3QgdXBncmFkZWQgdG8gYmNyeXB0IHlldC4gV2UgZG9uJ3QgYXR0ZW1wdCB0byB0ZWxsIHRoZSBjbGllbnRcbiAgICAgIC8vIHRvIHVwZ3JhZGUgdG8gYmNyeXB0LCBiZWNhdXNlIGl0IG1pZ2h0IGJlIGEgc3RhbmRhbG9uZSBERFBcbiAgICAgIC8vIGNsaWVudCBkb2Vzbid0IGtub3cgaG93IHRvIGRvIHN1Y2ggYSB0aGluZy5cbiAgICAgIHZhciB2ZXJpZmllciA9IHVzZXIuc2VydmljZXMucGFzc3dvcmQuc3JwO1xuICAgICAgdmFyIG5ld1ZlcmlmaWVyID0gU1JQLmdlbmVyYXRlVmVyaWZpZXIob3B0aW9ucy5wYXNzd29yZCwge1xuICAgICAgICBpZGVudGl0eTogdmVyaWZpZXIuaWRlbnRpdHksIHNhbHQ6IHZlcmlmaWVyLnNhbHR9KTtcblxuICAgICAgaWYgKHZlcmlmaWVyLnZlcmlmaWVyICE9PSBuZXdWZXJpZmllci52ZXJpZmllcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHVzZXJJZDogQWNjb3VudHMuX29wdGlvbnMuYW1iaWd1b3VzRXJyb3JNZXNzYWdlcyA/IG51bGwgOiB1c2VyLl9pZCxcbiAgICAgICAgICBlcnJvcjogaGFuZGxlRXJyb3IoXCJJbmNvcnJlY3QgcGFzc3dvcmRcIiwgZmFsc2UpXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7dXNlcklkOiB1c2VyLl9pZH07XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRlbGwgdGhlIGNsaWVudCB0byB1c2UgdGhlIFNSUCB1cGdyYWRlIHByb2Nlc3MuXG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMCwgXCJvbGQgcGFzc3dvcmQgZm9ybWF0XCIsIEVKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIGZvcm1hdDogJ3NycCcsXG4gICAgICAgIGlkZW50aXR5OiB1c2VyLnNlcnZpY2VzLnBhc3N3b3JkLnNycC5pZGVudGl0eVxuICAgICAgfSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjaGVja1Bhc3N3b3JkKFxuICAgIHVzZXIsXG4gICAgb3B0aW9ucy5wYXNzd29yZFxuICApO1xufSk7XG5cbi8vIEhhbmRsZXIgdG8gbG9naW4gdXNpbmcgdGhlIFNSUCB1cGdyYWRlIHBhdGguIFRvIHVzZSB0aGlzIGxvZ2luXG4vLyBoYW5kbGVyLCB0aGUgY2xpZW50IG11c3QgcHJvdmlkZTpcbi8vICAgLSBzcnA6IEgoaWRlbnRpdHkgKyBcIjpcIiArIHBhc3N3b3JkKVxuLy8gICAtIHBhc3N3b3JkOiBhIHN0cmluZyBvciBhbiBvYmplY3Qgd2l0aCBwcm9wZXJ0aWVzICdkaWdlc3QnIGFuZCAnYWxnb3JpdGhtJ1xuLy9cbi8vIFdlIHVzZSBgb3B0aW9ucy5zcnBgIHRvIHZlcmlmeSB0aGF0IHRoZSBjbGllbnQga25vd3MgdGhlIGNvcnJlY3Rcbi8vIHBhc3N3b3JkIHdpdGhvdXQgZG9pbmcgYSBmdWxsIFNSUCBmbG93LiBPbmNlIHdlJ3ZlIGNoZWNrZWQgdGhhdCwgd2Vcbi8vIHVwZ3JhZGUgdGhlIHVzZXIgdG8gYmNyeXB0IGFuZCByZW1vdmUgdGhlIFNSUCBpbmZvcm1hdGlvbiBmcm9tIHRoZVxuLy8gdXNlciBkb2N1bWVudC5cbi8vXG4vLyBUaGUgY2xpZW50IGVuZHMgdXAgdXNpbmcgdGhpcyBsb2dpbiBoYW5kbGVyIGFmdGVyIHRyeWluZyB0aGUgbm9ybWFsXG4vLyBsb2dpbiBoYW5kbGVyIChhYm92ZSksIHdoaWNoIHRocm93cyBhbiBlcnJvciB0ZWxsaW5nIHRoZSBjbGllbnQgdG9cbi8vIHRyeSB0aGUgU1JQIHVwZ3JhZGUgcGF0aC5cbi8vXG4vLyBYWFggQ09NUEFUIFdJVEggMC44LjEuM1xuQWNjb3VudHMucmVnaXN0ZXJMb2dpbkhhbmRsZXIoXCJwYXNzd29yZFwiLCBmdW5jdGlvbiAob3B0aW9ucykge1xuICBpZiAoIW9wdGlvbnMuc3JwIHx8ICFvcHRpb25zLnBhc3N3b3JkKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDsgLy8gZG9uJ3QgaGFuZGxlXG4gIH1cblxuICBjaGVjayhvcHRpb25zLCB7XG4gICAgdXNlcjogdXNlclF1ZXJ5VmFsaWRhdG9yLFxuICAgIHNycDogU3RyaW5nLFxuICAgIHBhc3N3b3JkOiBwYXNzd29yZFZhbGlkYXRvclxuICB9KTtcblxuICB2YXIgdXNlciA9IEFjY291bnRzLl9maW5kVXNlckJ5UXVlcnkob3B0aW9ucy51c2VyKTtcbiAgaWYgKCF1c2VyKSB7XG4gICAgaGFuZGxlRXJyb3IoXCJVc2VyIG5vdCBmb3VuZFwiKTtcbiAgfVxuXG4gIC8vIENoZWNrIHRvIHNlZSBpZiBhbm90aGVyIHNpbXVsdGFuZW91cyBsb2dpbiBoYXMgYWxyZWFkeSB1cGdyYWRlZFxuICAvLyB0aGUgdXNlciByZWNvcmQgdG8gYmNyeXB0LlxuICBpZiAodXNlci5zZXJ2aWNlcyAmJiB1c2VyLnNlcnZpY2VzLnBhc3N3b3JkICYmIHVzZXIuc2VydmljZXMucGFzc3dvcmQuYmNyeXB0KSB7XG4gICAgcmV0dXJuIGNoZWNrUGFzc3dvcmQodXNlciwgb3B0aW9ucy5wYXNzd29yZCk7XG4gIH1cblxuICBpZiAoISh1c2VyLnNlcnZpY2VzICYmIHVzZXIuc2VydmljZXMucGFzc3dvcmQgJiYgdXNlci5zZXJ2aWNlcy5wYXNzd29yZC5zcnApKSB7XG4gICAgaGFuZGxlRXJyb3IoXCJVc2VyIGhhcyBubyBwYXNzd29yZCBzZXRcIik7XG4gIH1cblxuICB2YXIgdjEgPSB1c2VyLnNlcnZpY2VzLnBhc3N3b3JkLnNycC52ZXJpZmllcjtcbiAgdmFyIHYyID0gU1JQLmdlbmVyYXRlVmVyaWZpZXIoXG4gICAgbnVsbCxcbiAgICB7XG4gICAgICBoYXNoZWRJZGVudGl0eUFuZFBhc3N3b3JkOiBvcHRpb25zLnNycCxcbiAgICAgIHNhbHQ6IHVzZXIuc2VydmljZXMucGFzc3dvcmQuc3JwLnNhbHRcbiAgICB9XG4gICkudmVyaWZpZXI7XG4gIGlmICh2MSAhPT0gdjIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXNlcklkOiBBY2NvdW50cy5fb3B0aW9ucy5hbWJpZ3VvdXNFcnJvck1lc3NhZ2VzID8gbnVsbCA6IHVzZXIuX2lkLFxuICAgICAgZXJyb3I6IGhhbmRsZUVycm9yKFwiSW5jb3JyZWN0IHBhc3N3b3JkXCIsIGZhbHNlKVxuICAgIH07XG4gIH1cblxuICAvLyBVcGdyYWRlIHRvIGJjcnlwdCBvbiBzdWNjZXNzZnVsIGxvZ2luLlxuICB2YXIgc2FsdGVkID0gaGFzaFBhc3N3b3JkKG9wdGlvbnMucGFzc3dvcmQpO1xuICBNZXRlb3IudXNlcnMudXBkYXRlKFxuICAgIHVzZXIuX2lkLFxuICAgIHtcbiAgICAgICR1bnNldDogeyAnc2VydmljZXMucGFzc3dvcmQuc3JwJzogMSB9LFxuICAgICAgJHNldDogeyAnc2VydmljZXMucGFzc3dvcmQuYmNyeXB0Jzogc2FsdGVkIH1cbiAgICB9XG4gICk7XG5cbiAgcmV0dXJuIHt1c2VySWQ6IHVzZXIuX2lkfTtcbn0pO1xuXG5cbi8vL1xuLy8vIENIQU5HSU5HXG4vLy9cblxuLyoqXG4gKiBAc3VtbWFyeSBDaGFuZ2UgYSB1c2VyJ3MgdXNlcm5hbWUuIFVzZSB0aGlzIGluc3RlYWQgb2YgdXBkYXRpbmcgdGhlXG4gKiBkYXRhYmFzZSBkaXJlY3RseS4gVGhlIG9wZXJhdGlvbiB3aWxsIGZhaWwgaWYgdGhlcmUgaXMgYW4gZXhpc3RpbmcgdXNlclxuICogd2l0aCBhIHVzZXJuYW1lIG9ubHkgZGlmZmVyaW5nIGluIGNhc2UuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAcGFyYW0ge1N0cmluZ30gdXNlcklkIFRoZSBJRCBvZiB0aGUgdXNlciB0byB1cGRhdGUuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmV3VXNlcm5hbWUgQSBuZXcgdXNlcm5hbWUgZm9yIHRoZSB1c2VyLlxuICogQGltcG9ydEZyb21QYWNrYWdlIGFjY291bnRzLWJhc2VcbiAqL1xuQWNjb3VudHMuc2V0VXNlcm5hbWUgPSBmdW5jdGlvbiAodXNlcklkLCBuZXdVc2VybmFtZSkge1xuICBjaGVjayh1c2VySWQsIE5vbkVtcHR5U3RyaW5nKTtcbiAgY2hlY2sobmV3VXNlcm5hbWUsIE5vbkVtcHR5U3RyaW5nKTtcblxuICB2YXIgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHVzZXJJZCk7XG4gIGlmICghdXNlcikge1xuICAgIGhhbmRsZUVycm9yKFwiVXNlciBub3QgZm91bmRcIik7XG4gIH1cblxuICB2YXIgb2xkVXNlcm5hbWUgPSB1c2VyLnVzZXJuYW1lO1xuXG4gIC8vIFBlcmZvcm0gYSBjYXNlIGluc2Vuc2l0aXZlIGNoZWNrIGZvciBkdXBsaWNhdGVzIGJlZm9yZSB1cGRhdGVcbiAgY2hlY2tGb3JDYXNlSW5zZW5zaXRpdmVEdXBsaWNhdGVzKCd1c2VybmFtZScsICdVc2VybmFtZScsIG5ld1VzZXJuYW1lLCB1c2VyLl9pZCk7XG5cbiAgTWV0ZW9yLnVzZXJzLnVwZGF0ZSh7X2lkOiB1c2VyLl9pZH0sIHskc2V0OiB7dXNlcm5hbWU6IG5ld1VzZXJuYW1lfX0pO1xuXG4gIC8vIFBlcmZvcm0gYW5vdGhlciBjaGVjayBhZnRlciB1cGRhdGUsIGluIGNhc2UgYSBtYXRjaGluZyB1c2VyIGhhcyBiZWVuXG4gIC8vIGluc2VydGVkIGluIHRoZSBtZWFudGltZVxuICB0cnkge1xuICAgIGNoZWNrRm9yQ2FzZUluc2Vuc2l0aXZlRHVwbGljYXRlcygndXNlcm5hbWUnLCAnVXNlcm5hbWUnLCBuZXdVc2VybmFtZSwgdXNlci5faWQpO1xuICB9IGNhdGNoIChleCkge1xuICAgIC8vIFVuZG8gdXBkYXRlIGlmIHRoZSBjaGVjayBmYWlsc1xuICAgIE1ldGVvci51c2Vycy51cGRhdGUoe19pZDogdXNlci5faWR9LCB7JHNldDoge3VzZXJuYW1lOiBvbGRVc2VybmFtZX19KTtcbiAgICB0aHJvdyBleDtcbiAgfVxufTtcblxuLy8gTGV0IHRoZSB1c2VyIGNoYW5nZSB0aGVpciBvd24gcGFzc3dvcmQgaWYgdGhleSBrbm93IHRoZSBvbGRcbi8vIHBhc3N3b3JkLiBgb2xkUGFzc3dvcmRgIGFuZCBgbmV3UGFzc3dvcmRgIHNob3VsZCBiZSBvYmplY3RzIHdpdGgga2V5c1xuLy8gYGRpZ2VzdGAgYW5kIGBhbGdvcml0aG1gIChyZXByZXNlbnRpbmcgdGhlIFNIQTI1NiBvZiB0aGUgcGFzc3dvcmQpLlxuLy9cbi8vIFhYWCBDT01QQVQgV0lUSCAwLjguMS4zXG4vLyBMaWtlIHRoZSBsb2dpbiBtZXRob2QsIGlmIHRoZSB1c2VyIGhhc24ndCBiZWVuIHVwZ3JhZGVkIGZyb20gU1JQIHRvXG4vLyBiY3J5cHQgeWV0LCB0aGVuIHRoaXMgbWV0aG9kIHdpbGwgdGhyb3cgYW4gJ29sZCBwYXNzd29yZCBmb3JtYXQnXG4vLyBlcnJvci4gVGhlIGNsaWVudCBzaG91bGQgY2FsbCB0aGUgU1JQIHVwZ3JhZGUgbG9naW4gaGFuZGxlciBhbmQgdGhlblxuLy8gcmV0cnkgdGhpcyBtZXRob2QgYWdhaW4uXG4vL1xuLy8gVU5MSUtFIHRoZSBsb2dpbiBtZXRob2QsIHRoZXJlIGlzIG5vIHdheSB0byBhdm9pZCBnZXR0aW5nIFNSUCB1cGdyYWRlXG4vLyBlcnJvcnMgdGhyb3duLiBUaGUgcmVhc29uaW5nIGZvciB0aGlzIGlzIHRoYXQgY2xpZW50cyB1c2luZyB0aGlzXG4vLyBtZXRob2QgZGlyZWN0bHkgd2lsbCBuZWVkIHRvIGJlIHVwZGF0ZWQgYW55d2F5IGJlY2F1c2Ugd2Ugbm8gbG9uZ2VyXG4vLyBzdXBwb3J0IHRoZSBTUlAgZmxvdyB0aGF0IHRoZXkgd291bGQgaGF2ZSBiZWVuIGRvaW5nIHRvIHVzZSB0aGlzXG4vLyBtZXRob2QgcHJldmlvdXNseS5cbk1ldGVvci5tZXRob2RzKHtjaGFuZ2VQYXNzd29yZDogZnVuY3Rpb24gKG9sZFBhc3N3b3JkLCBuZXdQYXNzd29yZCkge1xuICBjaGVjayhvbGRQYXNzd29yZCwgcGFzc3dvcmRWYWxpZGF0b3IpO1xuICBjaGVjayhuZXdQYXNzd29yZCwgcGFzc3dvcmRWYWxpZGF0b3IpO1xuXG4gIGlmICghdGhpcy51c2VySWQpIHtcbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMSwgXCJNdXN0IGJlIGxvZ2dlZCBpblwiKTtcbiAgfVxuXG4gIHZhciB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUodGhpcy51c2VySWQpO1xuICBpZiAoIXVzZXIpIHtcbiAgICBoYW5kbGVFcnJvcihcIlVzZXIgbm90IGZvdW5kXCIpO1xuICB9XG5cbiAgaWYgKCF1c2VyLnNlcnZpY2VzIHx8ICF1c2VyLnNlcnZpY2VzLnBhc3N3b3JkIHx8XG4gICAgICAoIXVzZXIuc2VydmljZXMucGFzc3dvcmQuYmNyeXB0ICYmICF1c2VyLnNlcnZpY2VzLnBhc3N3b3JkLnNycCkpIHtcbiAgICBoYW5kbGVFcnJvcihcIlVzZXIgaGFzIG5vIHBhc3N3b3JkIHNldFwiKTtcbiAgfVxuXG4gIGlmICghIHVzZXIuc2VydmljZXMucGFzc3dvcmQuYmNyeXB0KSB7XG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDAsIFwib2xkIHBhc3N3b3JkIGZvcm1hdFwiLCBFSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgZm9ybWF0OiAnc3JwJyxcbiAgICAgIGlkZW50aXR5OiB1c2VyLnNlcnZpY2VzLnBhc3N3b3JkLnNycC5pZGVudGl0eVxuICAgIH0pKTtcbiAgfVxuXG4gIHZhciByZXN1bHQgPSBjaGVja1Bhc3N3b3JkKHVzZXIsIG9sZFBhc3N3b3JkKTtcbiAgaWYgKHJlc3VsdC5lcnJvcikge1xuICAgIHRocm93IHJlc3VsdC5lcnJvcjtcbiAgfVxuXG4gIHZhciBoYXNoZWQgPSBoYXNoUGFzc3dvcmQobmV3UGFzc3dvcmQpO1xuXG4gIC8vIEl0IHdvdWxkIGJlIGJldHRlciBpZiB0aGlzIHJlbW92ZWQgQUxMIGV4aXN0aW5nIHRva2VucyBhbmQgcmVwbGFjZWRcbiAgLy8gdGhlIHRva2VuIGZvciB0aGUgY3VycmVudCBjb25uZWN0aW9uIHdpdGggYSBuZXcgb25lLCBidXQgdGhhdCB3b3VsZFxuICAvLyBiZSB0cmlja3ksIHNvIHdlJ2xsIHNldHRsZSBmb3IganVzdCByZXBsYWNpbmcgYWxsIHRva2VucyBvdGhlciB0aGFuXG4gIC8vIHRoZSBvbmUgZm9yIHRoZSBjdXJyZW50IGNvbm5lY3Rpb24uXG4gIHZhciBjdXJyZW50VG9rZW4gPSBBY2NvdW50cy5fZ2V0TG9naW5Ub2tlbih0aGlzLmNvbm5lY3Rpb24uaWQpO1xuICBNZXRlb3IudXNlcnMudXBkYXRlKFxuICAgIHsgX2lkOiB0aGlzLnVzZXJJZCB9LFxuICAgIHtcbiAgICAgICRzZXQ6IHsgJ3NlcnZpY2VzLnBhc3N3b3JkLmJjcnlwdCc6IGhhc2hlZCB9LFxuICAgICAgJHB1bGw6IHtcbiAgICAgICAgJ3NlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucyc6IHsgaGFzaGVkVG9rZW46IHsgJG5lOiBjdXJyZW50VG9rZW4gfSB9XG4gICAgICB9LFxuICAgICAgJHVuc2V0OiB7ICdzZXJ2aWNlcy5wYXNzd29yZC5yZXNldCc6IDEgfVxuICAgIH1cbiAgKTtcblxuICByZXR1cm4ge3Bhc3N3b3JkQ2hhbmdlZDogdHJ1ZX07XG59fSk7XG5cblxuLy8gRm9yY2UgY2hhbmdlIHRoZSB1c2VycyBwYXNzd29yZC5cblxuLyoqXG4gKiBAc3VtbWFyeSBGb3JjaWJseSBjaGFuZ2UgdGhlIHBhc3N3b3JkIGZvciBhIHVzZXIuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAcGFyYW0ge1N0cmluZ30gdXNlcklkIFRoZSBpZCBvZiB0aGUgdXNlciB0byB1cGRhdGUuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmV3UGFzc3dvcmQgQSBuZXcgcGFzc3dvcmQgZm9yIHRoZSB1c2VyLlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMubG9nb3V0IExvZ291dCBhbGwgY3VycmVudCBjb25uZWN0aW9ucyB3aXRoIHRoaXMgdXNlcklkIChkZWZhdWx0OiB0cnVlKVxuICogQGltcG9ydEZyb21QYWNrYWdlIGFjY291bnRzLWJhc2VcbiAqL1xuQWNjb3VudHMuc2V0UGFzc3dvcmQgPSBmdW5jdGlvbiAodXNlcklkLCBuZXdQbGFpbnRleHRQYXNzd29yZCwgb3B0aW9ucykge1xuICBvcHRpb25zID0gXy5leHRlbmQoe2xvZ291dDogdHJ1ZX0sIG9wdGlvbnMpO1xuXG4gIHZhciB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUodXNlcklkKTtcbiAgaWYgKCF1c2VyKSB7XG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiVXNlciBub3QgZm91bmRcIik7XG4gIH1cblxuICB2YXIgdXBkYXRlID0ge1xuICAgICR1bnNldDoge1xuICAgICAgJ3NlcnZpY2VzLnBhc3N3b3JkLnNycCc6IDEsIC8vIFhYWCBDT01QQVQgV0lUSCAwLjguMS4zXG4gICAgICAnc2VydmljZXMucGFzc3dvcmQucmVzZXQnOiAxXG4gICAgfSxcbiAgICAkc2V0OiB7J3NlcnZpY2VzLnBhc3N3b3JkLmJjcnlwdCc6IGhhc2hQYXNzd29yZChuZXdQbGFpbnRleHRQYXNzd29yZCl9XG4gIH07XG5cbiAgaWYgKG9wdGlvbnMubG9nb3V0KSB7XG4gICAgdXBkYXRlLiR1bnNldFsnc2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zJ10gPSAxO1xuICB9XG5cbiAgTWV0ZW9yLnVzZXJzLnVwZGF0ZSh7X2lkOiB1c2VyLl9pZH0sIHVwZGF0ZSk7XG59O1xuXG5cbi8vL1xuLy8vIFJFU0VUVElORyBWSUEgRU1BSUxcbi8vL1xuXG4vLyBNZXRob2QgY2FsbGVkIGJ5IGEgdXNlciB0byByZXF1ZXN0IGEgcGFzc3dvcmQgcmVzZXQgZW1haWwuIFRoaXMgaXNcbi8vIHRoZSBzdGFydCBvZiB0aGUgcmVzZXQgcHJvY2Vzcy5cbk1ldGVvci5tZXRob2RzKHtmb3Jnb3RQYXNzd29yZDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgY2hlY2sob3B0aW9ucywge2VtYWlsOiBTdHJpbmd9KTtcblxuICB2YXIgdXNlciA9IEFjY291bnRzLmZpbmRVc2VyQnlFbWFpbChvcHRpb25zLmVtYWlsKTtcbiAgaWYgKCF1c2VyKSB7XG4gICAgaGFuZGxlRXJyb3IoXCJVc2VyIG5vdCBmb3VuZFwiKTtcbiAgfVxuXG4gIGNvbnN0IGVtYWlscyA9IF8ucGx1Y2sodXNlci5lbWFpbHMgfHwgW10sICdhZGRyZXNzJyk7XG4gIGNvbnN0IGNhc2VTZW5zaXRpdmVFbWFpbCA9IF8uZmluZChlbWFpbHMsIGVtYWlsID0+IHtcbiAgICByZXR1cm4gZW1haWwudG9Mb3dlckNhc2UoKSA9PT0gb3B0aW9ucy5lbWFpbC50b0xvd2VyQ2FzZSgpO1xuICB9KTtcblxuICBBY2NvdW50cy5zZW5kUmVzZXRQYXNzd29yZEVtYWlsKHVzZXIuX2lkLCBjYXNlU2Vuc2l0aXZlRW1haWwpO1xufX0pO1xuXG4vKipcbiAqIEBzdW1tYXJ5IEdlbmVyYXRlcyBhIHJlc2V0IHRva2VuIGFuZCBzYXZlcyBpdCBpbnRvIHRoZSBkYXRhYmFzZS5cbiAqIEBsb2N1cyBTZXJ2ZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSB1c2VySWQgVGhlIGlkIG9mIHRoZSB1c2VyIHRvIGdlbmVyYXRlIHRoZSByZXNldCB0b2tlbiBmb3IuXG4gKiBAcGFyYW0ge1N0cmluZ30gZW1haWwgV2hpY2ggYWRkcmVzcyBvZiB0aGUgdXNlciB0byBnZW5lcmF0ZSB0aGUgcmVzZXQgdG9rZW4gZm9yLiBUaGlzIGFkZHJlc3MgbXVzdCBiZSBpbiB0aGUgdXNlcidzIGBlbWFpbHNgIGxpc3QuIElmIGBudWxsYCwgZGVmYXVsdHMgdG8gdGhlIGZpcnN0IGVtYWlsIGluIHRoZSBsaXN0LlxuICogQHBhcmFtIHtTdHJpbmd9IHJlYXNvbiBgcmVzZXRQYXNzd29yZGAgb3IgYGVucm9sbEFjY291bnRgLlxuICogQHBhcmFtIHtPYmplY3R9IFtleHRyYVRva2VuRGF0YV0gT3B0aW9uYWwgYWRkaXRpb25hbCBkYXRhIHRvIGJlIGFkZGVkIGludG8gdGhlIHRva2VuIHJlY29yZC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IE9iamVjdCB3aXRoIHtlbWFpbCwgdXNlciwgdG9rZW59IHZhbHVlcy5cbiAqIEBpbXBvcnRGcm9tUGFja2FnZSBhY2NvdW50cy1iYXNlXG4gKi9cbkFjY291bnRzLmdlbmVyYXRlUmVzZXRUb2tlbiA9IGZ1bmN0aW9uICh1c2VySWQsIGVtYWlsLCByZWFzb24sIGV4dHJhVG9rZW5EYXRhKSB7XG4gIC8vIE1ha2Ugc3VyZSB0aGUgdXNlciBleGlzdHMsIGFuZCBlbWFpbCBpcyBvbmUgb2YgdGhlaXIgYWRkcmVzc2VzLlxuICB2YXIgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHVzZXJJZCk7XG4gIGlmICghdXNlcikge1xuICAgIGhhbmRsZUVycm9yKFwiQ2FuJ3QgZmluZCB1c2VyXCIpO1xuICB9XG5cbiAgLy8gcGljayB0aGUgZmlyc3QgZW1haWwgaWYgd2Ugd2VyZW4ndCBwYXNzZWQgYW4gZW1haWwuXG4gIGlmICghZW1haWwgJiYgdXNlci5lbWFpbHMgJiYgdXNlci5lbWFpbHNbMF0pIHtcbiAgICBlbWFpbCA9IHVzZXIuZW1haWxzWzBdLmFkZHJlc3M7XG4gIH1cblxuICAvLyBtYWtlIHN1cmUgd2UgaGF2ZSBhIHZhbGlkIGVtYWlsXG4gIGlmICghZW1haWwgfHwgIV8uY29udGFpbnMoXy5wbHVjayh1c2VyLmVtYWlscyB8fCBbXSwgJ2FkZHJlc3MnKSwgZW1haWwpKSB7XG4gICAgaGFuZGxlRXJyb3IoXCJObyBzdWNoIGVtYWlsIGZvciB1c2VyLlwiKTtcbiAgfVxuXG4gIHZhciB0b2tlbiA9IFJhbmRvbS5zZWNyZXQoKTtcbiAgdmFyIHRva2VuUmVjb3JkID0ge1xuICAgIHRva2VuOiB0b2tlbixcbiAgICBlbWFpbDogZW1haWwsXG4gICAgd2hlbjogbmV3IERhdGUoKVxuICB9O1xuXG4gIGlmIChyZWFzb24gPT09ICdyZXNldFBhc3N3b3JkJykge1xuICAgIHRva2VuUmVjb3JkLnJlYXNvbiA9ICdyZXNldCc7XG4gIH0gZWxzZSBpZiAocmVhc29uID09PSAnZW5yb2xsQWNjb3VudCcpIHtcbiAgICB0b2tlblJlY29yZC5yZWFzb24gPSAnZW5yb2xsJztcbiAgfSBlbHNlIGlmIChyZWFzb24pIHtcbiAgICAvLyBmYWxsYmFjayBzbyB0aGF0IHRoaXMgZnVuY3Rpb24gY2FuIGJlIHVzZWQgZm9yIHVua25vd24gcmVhc29ucyBhcyB3ZWxsXG4gICAgdG9rZW5SZWNvcmQucmVhc29uID0gcmVhc29uO1xuICB9XG5cbiAgaWYgKGV4dHJhVG9rZW5EYXRhKSB7XG4gICAgXy5leHRlbmQodG9rZW5SZWNvcmQsIGV4dHJhVG9rZW5EYXRhKTtcbiAgfVxuXG4gIE1ldGVvci51c2Vycy51cGRhdGUoe19pZDogdXNlci5faWR9LCB7JHNldDoge1xuICAgICdzZXJ2aWNlcy5wYXNzd29yZC5yZXNldCc6IHRva2VuUmVjb3JkXG4gIH19KTtcblxuICAvLyBiZWZvcmUgcGFzc2luZyB0byB0ZW1wbGF0ZSwgdXBkYXRlIHVzZXIgb2JqZWN0IHdpdGggbmV3IHRva2VuXG4gIE1ldGVvci5fZW5zdXJlKHVzZXIsICdzZXJ2aWNlcycsICdwYXNzd29yZCcpLnJlc2V0ID0gdG9rZW5SZWNvcmQ7XG5cbiAgcmV0dXJuIHtlbWFpbCwgdXNlciwgdG9rZW59O1xufTtcblxuLyoqXG4gKiBAc3VtbWFyeSBHZW5lcmF0ZXMgYW4gZS1tYWlsIHZlcmlmaWNhdGlvbiB0b2tlbiBhbmQgc2F2ZXMgaXQgaW50byB0aGUgZGF0YWJhc2UuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAcGFyYW0ge1N0cmluZ30gdXNlcklkIFRoZSBpZCBvZiB0aGUgdXNlciB0byBnZW5lcmF0ZSB0aGUgIGUtbWFpbCB2ZXJpZmljYXRpb24gdG9rZW4gZm9yLlxuICogQHBhcmFtIHtTdHJpbmd9IGVtYWlsIFdoaWNoIGFkZHJlc3Mgb2YgdGhlIHVzZXIgdG8gZ2VuZXJhdGUgdGhlIGUtbWFpbCB2ZXJpZmljYXRpb24gdG9rZW4gZm9yLiBUaGlzIGFkZHJlc3MgbXVzdCBiZSBpbiB0aGUgdXNlcidzIGBlbWFpbHNgIGxpc3QuIElmIGBudWxsYCwgZGVmYXVsdHMgdG8gdGhlIGZpcnN0IHVudmVyaWZpZWQgZW1haWwgaW4gdGhlIGxpc3QuXG4gKiBAcGFyYW0ge09iamVjdH0gW2V4dHJhVG9rZW5EYXRhXSBPcHRpb25hbCBhZGRpdGlvbmFsIGRhdGEgdG8gYmUgYWRkZWQgaW50byB0aGUgdG9rZW4gcmVjb3JkLlxuICogQHJldHVybnMge09iamVjdH0gT2JqZWN0IHdpdGgge2VtYWlsLCB1c2VyLCB0b2tlbn0gdmFsdWVzLlxuICogQGltcG9ydEZyb21QYWNrYWdlIGFjY291bnRzLWJhc2VcbiAqL1xuQWNjb3VudHMuZ2VuZXJhdGVWZXJpZmljYXRpb25Ub2tlbiA9IGZ1bmN0aW9uICh1c2VySWQsIGVtYWlsLCBleHRyYVRva2VuRGF0YSkge1xuICAvLyBNYWtlIHN1cmUgdGhlIHVzZXIgZXhpc3RzLCBhbmQgZW1haWwgaXMgb25lIG9mIHRoZWlyIGFkZHJlc3Nlcy5cbiAgdmFyIHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh1c2VySWQpO1xuICBpZiAoIXVzZXIpIHtcbiAgICBoYW5kbGVFcnJvcihcIkNhbid0IGZpbmQgdXNlclwiKTtcbiAgfVxuXG4gIC8vIHBpY2sgdGhlIGZpcnN0IHVudmVyaWZpZWQgZW1haWwgaWYgd2Ugd2VyZW4ndCBwYXNzZWQgYW4gZW1haWwuXG4gIGlmICghZW1haWwpIHtcbiAgICB2YXIgZW1haWxSZWNvcmQgPSBfLmZpbmQodXNlci5lbWFpbHMgfHwgW10sIGZ1bmN0aW9uIChlKSB7IHJldHVybiAhZS52ZXJpZmllZDsgfSk7XG4gICAgZW1haWwgPSAoZW1haWxSZWNvcmQgfHwge30pLmFkZHJlc3M7XG5cbiAgICBpZiAoIWVtYWlsKSB7XG4gICAgICBoYW5kbGVFcnJvcihcIlRoYXQgdXNlciBoYXMgbm8gdW52ZXJpZmllZCBlbWFpbCBhZGRyZXNzZXMuXCIpO1xuICAgIH1cbiAgfVxuXG4gIC8vIG1ha2Ugc3VyZSB3ZSBoYXZlIGEgdmFsaWQgZW1haWxcbiAgaWYgKCFlbWFpbCB8fCAhXy5jb250YWlucyhfLnBsdWNrKHVzZXIuZW1haWxzIHx8IFtdLCAnYWRkcmVzcycpLCBlbWFpbCkpIHtcbiAgICBoYW5kbGVFcnJvcihcIk5vIHN1Y2ggZW1haWwgZm9yIHVzZXIuXCIpO1xuICB9XG5cbiAgdmFyIHRva2VuID0gUmFuZG9tLnNlY3JldCgpO1xuICB2YXIgdG9rZW5SZWNvcmQgPSB7XG4gICAgdG9rZW46IHRva2VuLFxuICAgIC8vIFRPRE86IFRoaXMgc2hvdWxkIHByb2JhYmx5IGJlIHJlbmFtZWQgdG8gXCJlbWFpbFwiIHRvIG1hdGNoIHJlc2V0IHRva2VuIHJlY29yZC5cbiAgICBhZGRyZXNzOiBlbWFpbCxcbiAgICB3aGVuOiBuZXcgRGF0ZSgpXG4gIH07XG5cbiAgaWYgKGV4dHJhVG9rZW5EYXRhKSB7XG4gICAgXy5leHRlbmQodG9rZW5SZWNvcmQsIGV4dHJhVG9rZW5EYXRhKTtcbiAgfVxuXG4gIE1ldGVvci51c2Vycy51cGRhdGUoe19pZDogdXNlci5faWR9LCB7JHB1c2g6IHtcbiAgICAnc2VydmljZXMuZW1haWwudmVyaWZpY2F0aW9uVG9rZW5zJzogdG9rZW5SZWNvcmRcbiAgfX0pO1xuXG4gIC8vIGJlZm9yZSBwYXNzaW5nIHRvIHRlbXBsYXRlLCB1cGRhdGUgdXNlciBvYmplY3Qgd2l0aCBuZXcgdG9rZW5cbiAgTWV0ZW9yLl9lbnN1cmUodXNlciwgJ3NlcnZpY2VzJywgJ2VtYWlsJyk7XG4gIGlmICghdXNlci5zZXJ2aWNlcy5lbWFpbC52ZXJpZmljYXRpb25Ub2tlbnMpIHtcbiAgICB1c2VyLnNlcnZpY2VzLmVtYWlsLnZlcmlmaWNhdGlvblRva2VucyA9IFtdO1xuICB9XG4gIHVzZXIuc2VydmljZXMuZW1haWwudmVyaWZpY2F0aW9uVG9rZW5zLnB1c2godG9rZW5SZWNvcmQpO1xuXG4gIHJldHVybiB7ZW1haWwsIHVzZXIsIHRva2VufTtcbn07XG5cbi8qKlxuICogQHN1bW1hcnkgQ3JlYXRlcyBvcHRpb25zIGZvciBlbWFpbCBzZW5kaW5nIGZvciByZXNldCBwYXNzd29yZCBhbmQgZW5yb2xsIGFjY291bnQgZW1haWxzLlxuICogWW91IGNhbiB1c2UgdGhpcyBmdW5jdGlvbiB3aGVuIGN1c3RvbWl6aW5nIGEgcmVzZXQgcGFzc3dvcmQgb3IgZW5yb2xsIGFjY291bnQgZW1haWwgc2VuZGluZy5cbiAqIEBsb2N1cyBTZXJ2ZXJcbiAqIEBwYXJhbSB7T2JqZWN0fSBlbWFpbCBXaGljaCBhZGRyZXNzIG9mIHRoZSB1c2VyJ3MgdG8gc2VuZCB0aGUgZW1haWwgdG8uXG4gKiBAcGFyYW0ge09iamVjdH0gdXNlciBUaGUgdXNlciBvYmplY3QgdG8gZ2VuZXJhdGUgb3B0aW9ucyBmb3IuXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsIFVSTCB0byB3aGljaCB1c2VyIGlzIGRpcmVjdGVkIHRvIGNvbmZpcm0gdGhlIGVtYWlsLlxuICogQHBhcmFtIHtTdHJpbmd9IHJlYXNvbiBgcmVzZXRQYXNzd29yZGAgb3IgYGVucm9sbEFjY291bnRgLlxuICogQHJldHVybnMge09iamVjdH0gT3B0aW9ucyB3aGljaCBjYW4gYmUgcGFzc2VkIHRvIGBFbWFpbC5zZW5kYC5cbiAqIEBpbXBvcnRGcm9tUGFja2FnZSBhY2NvdW50cy1iYXNlXG4gKi9cbkFjY291bnRzLmdlbmVyYXRlT3B0aW9uc0ZvckVtYWlsID0gZnVuY3Rpb24gKGVtYWlsLCB1c2VyLCB1cmwsIHJlYXNvbikge1xuICB2YXIgb3B0aW9ucyA9IHtcbiAgICB0bzogZW1haWwsXG4gICAgZnJvbTogQWNjb3VudHMuZW1haWxUZW1wbGF0ZXNbcmVhc29uXS5mcm9tXG4gICAgICA/IEFjY291bnRzLmVtYWlsVGVtcGxhdGVzW3JlYXNvbl0uZnJvbSh1c2VyKVxuICAgICAgOiBBY2NvdW50cy5lbWFpbFRlbXBsYXRlcy5mcm9tLFxuICAgIHN1YmplY3Q6IEFjY291bnRzLmVtYWlsVGVtcGxhdGVzW3JlYXNvbl0uc3ViamVjdCh1c2VyKVxuICB9O1xuXG4gIGlmICh0eXBlb2YgQWNjb3VudHMuZW1haWxUZW1wbGF0ZXNbcmVhc29uXS50ZXh0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgb3B0aW9ucy50ZXh0ID0gQWNjb3VudHMuZW1haWxUZW1wbGF0ZXNbcmVhc29uXS50ZXh0KHVzZXIsIHVybCk7XG4gIH1cblxuICBpZiAodHlwZW9mIEFjY291bnRzLmVtYWlsVGVtcGxhdGVzW3JlYXNvbl0uaHRtbCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIG9wdGlvbnMuaHRtbCA9IEFjY291bnRzLmVtYWlsVGVtcGxhdGVzW3JlYXNvbl0uaHRtbCh1c2VyLCB1cmwpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBBY2NvdW50cy5lbWFpbFRlbXBsYXRlcy5oZWFkZXJzID09PSAnb2JqZWN0Jykge1xuICAgIG9wdGlvbnMuaGVhZGVycyA9IEFjY291bnRzLmVtYWlsVGVtcGxhdGVzLmhlYWRlcnM7XG4gIH1cblxuICByZXR1cm4gb3B0aW9ucztcbn07XG5cbi8vIHNlbmQgdGhlIHVzZXIgYW4gZW1haWwgd2l0aCBhIGxpbmsgdGhhdCB3aGVuIG9wZW5lZCBhbGxvd3MgdGhlIHVzZXJcbi8vIHRvIHNldCBhIG5ldyBwYXNzd29yZCwgd2l0aG91dCB0aGUgb2xkIHBhc3N3b3JkLlxuXG4vKipcbiAqIEBzdW1tYXJ5IFNlbmQgYW4gZW1haWwgd2l0aCBhIGxpbmsgdGhlIHVzZXIgY2FuIHVzZSB0byByZXNldCB0aGVpciBwYXNzd29yZC5cbiAqIEBsb2N1cyBTZXJ2ZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSB1c2VySWQgVGhlIGlkIG9mIHRoZSB1c2VyIHRvIHNlbmQgZW1haWwgdG8uXG4gKiBAcGFyYW0ge1N0cmluZ30gW2VtYWlsXSBPcHRpb25hbC4gV2hpY2ggYWRkcmVzcyBvZiB0aGUgdXNlcidzIHRvIHNlbmQgdGhlIGVtYWlsIHRvLiBUaGlzIGFkZHJlc3MgbXVzdCBiZSBpbiB0aGUgdXNlcidzIGBlbWFpbHNgIGxpc3QuIERlZmF1bHRzIHRvIHRoZSBmaXJzdCBlbWFpbCBpbiB0aGUgbGlzdC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbZXh0cmFUb2tlbkRhdGFdIE9wdGlvbmFsIGFkZGl0aW9uYWwgZGF0YSB0byBiZSBhZGRlZCBpbnRvIHRoZSB0b2tlbiByZWNvcmQuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBPYmplY3Qgd2l0aCB7ZW1haWwsIHVzZXIsIHRva2VuLCB1cmwsIG9wdGlvbnN9IHZhbHVlcy5cbiAqIEBpbXBvcnRGcm9tUGFja2FnZSBhY2NvdW50cy1iYXNlXG4gKi9cbkFjY291bnRzLnNlbmRSZXNldFBhc3N3b3JkRW1haWwgPSBmdW5jdGlvbiAodXNlcklkLCBlbWFpbCwgZXh0cmFUb2tlbkRhdGEpIHtcbiAgY29uc3Qge2VtYWlsOiByZWFsRW1haWwsIHVzZXIsIHRva2VufSA9XG4gICAgQWNjb3VudHMuZ2VuZXJhdGVSZXNldFRva2VuKHVzZXJJZCwgZW1haWwsICdyZXNldFBhc3N3b3JkJywgZXh0cmFUb2tlbkRhdGEpO1xuICBjb25zdCB1cmwgPSBBY2NvdW50cy51cmxzLnJlc2V0UGFzc3dvcmQodG9rZW4pO1xuICBjb25zdCBvcHRpb25zID0gQWNjb3VudHMuZ2VuZXJhdGVPcHRpb25zRm9yRW1haWwocmVhbEVtYWlsLCB1c2VyLCB1cmwsICdyZXNldFBhc3N3b3JkJyk7XG4gIEVtYWlsLnNlbmQob3B0aW9ucyk7XG4gIHJldHVybiB7ZW1haWw6IHJlYWxFbWFpbCwgdXNlciwgdG9rZW4sIHVybCwgb3B0aW9uc307XG59O1xuXG4vLyBzZW5kIHRoZSB1c2VyIGFuIGVtYWlsIGluZm9ybWluZyB0aGVtIHRoYXQgdGhlaXIgYWNjb3VudCB3YXMgY3JlYXRlZCwgd2l0aFxuLy8gYSBsaW5rIHRoYXQgd2hlbiBvcGVuZWQgYm90aCBtYXJrcyB0aGVpciBlbWFpbCBhcyB2ZXJpZmllZCBhbmQgZm9yY2VzIHRoZW1cbi8vIHRvIGNob29zZSB0aGVpciBwYXNzd29yZC4gVGhlIGVtYWlsIG11c3QgYmUgb25lIG9mIHRoZSBhZGRyZXNzZXMgaW4gdGhlXG4vLyB1c2VyJ3MgZW1haWxzIGZpZWxkLCBvciB1bmRlZmluZWQgdG8gcGljayB0aGUgZmlyc3QgZW1haWwgYXV0b21hdGljYWxseS5cbi8vXG4vLyBUaGlzIGlzIG5vdCBjYWxsZWQgYXV0b21hdGljYWxseS4gSXQgbXVzdCBiZSBjYWxsZWQgbWFudWFsbHkgaWYgeW91XG4vLyB3YW50IHRvIHVzZSBlbnJvbGxtZW50IGVtYWlscy5cblxuLyoqXG4gKiBAc3VtbWFyeSBTZW5kIGFuIGVtYWlsIHdpdGggYSBsaW5rIHRoZSB1c2VyIGNhbiB1c2UgdG8gc2V0IHRoZWlyIGluaXRpYWwgcGFzc3dvcmQuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAcGFyYW0ge1N0cmluZ30gdXNlcklkIFRoZSBpZCBvZiB0aGUgdXNlciB0byBzZW5kIGVtYWlsIHRvLlxuICogQHBhcmFtIHtTdHJpbmd9IFtlbWFpbF0gT3B0aW9uYWwuIFdoaWNoIGFkZHJlc3Mgb2YgdGhlIHVzZXIncyB0byBzZW5kIHRoZSBlbWFpbCB0by4gVGhpcyBhZGRyZXNzIG11c3QgYmUgaW4gdGhlIHVzZXIncyBgZW1haWxzYCBsaXN0LiBEZWZhdWx0cyB0byB0aGUgZmlyc3QgZW1haWwgaW4gdGhlIGxpc3QuXG4gKiBAcGFyYW0ge09iamVjdH0gW2V4dHJhVG9rZW5EYXRhXSBPcHRpb25hbCBhZGRpdGlvbmFsIGRhdGEgdG8gYmUgYWRkZWQgaW50byB0aGUgdG9rZW4gcmVjb3JkLlxuICogQHJldHVybnMge09iamVjdH0gT2JqZWN0IHdpdGgge2VtYWlsLCB1c2VyLCB0b2tlbiwgdXJsLCBvcHRpb25zfSB2YWx1ZXMuXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgYWNjb3VudHMtYmFzZVxuICovXG5BY2NvdW50cy5zZW5kRW5yb2xsbWVudEVtYWlsID0gZnVuY3Rpb24gKHVzZXJJZCwgZW1haWwsIGV4dHJhVG9rZW5EYXRhKSB7XG4gIGNvbnN0IHtlbWFpbDogcmVhbEVtYWlsLCB1c2VyLCB0b2tlbn0gPVxuICAgIEFjY291bnRzLmdlbmVyYXRlUmVzZXRUb2tlbih1c2VySWQsIGVtYWlsLCAnZW5yb2xsQWNjb3VudCcsIGV4dHJhVG9rZW5EYXRhKTtcbiAgY29uc3QgdXJsID0gQWNjb3VudHMudXJscy5lbnJvbGxBY2NvdW50KHRva2VuKTtcbiAgY29uc3Qgb3B0aW9ucyA9IEFjY291bnRzLmdlbmVyYXRlT3B0aW9uc0ZvckVtYWlsKHJlYWxFbWFpbCwgdXNlciwgdXJsLCAnZW5yb2xsQWNjb3VudCcpO1xuICBFbWFpbC5zZW5kKG9wdGlvbnMpO1xuICByZXR1cm4ge2VtYWlsOiByZWFsRW1haWwsIHVzZXIsIHRva2VuLCB1cmwsIG9wdGlvbnN9O1xufTtcblxuXG4vLyBUYWtlIHRva2VuIGZyb20gc2VuZFJlc2V0UGFzc3dvcmRFbWFpbCBvciBzZW5kRW5yb2xsbWVudEVtYWlsLCBjaGFuZ2Vcbi8vIHRoZSB1c2VycyBwYXNzd29yZCwgYW5kIGxvZyB0aGVtIGluLlxuTWV0ZW9yLm1ldGhvZHMoe3Jlc2V0UGFzc3dvcmQ6IGZ1bmN0aW9uICh0b2tlbiwgbmV3UGFzc3dvcmQpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICByZXR1cm4gQWNjb3VudHMuX2xvZ2luTWV0aG9kKFxuICAgIHNlbGYsXG4gICAgXCJyZXNldFBhc3N3b3JkXCIsXG4gICAgYXJndW1lbnRzLFxuICAgIFwicGFzc3dvcmRcIixcbiAgICBmdW5jdGlvbiAoKSB7XG4gICAgICBjaGVjayh0b2tlbiwgU3RyaW5nKTtcbiAgICAgIGNoZWNrKG5ld1Bhc3N3b3JkLCBwYXNzd29yZFZhbGlkYXRvcik7XG5cbiAgICAgIHZhciB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUoe1xuICAgICAgICBcInNlcnZpY2VzLnBhc3N3b3JkLnJlc2V0LnRva2VuXCI6IHRva2VufSk7XG4gICAgICBpZiAoIXVzZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiVG9rZW4gZXhwaXJlZFwiKTtcbiAgICAgIH1cbiAgICAgIHZhciB3aGVuID0gdXNlci5zZXJ2aWNlcy5wYXNzd29yZC5yZXNldC53aGVuO1xuICAgICAgdmFyIHJlYXNvbiA9IHVzZXIuc2VydmljZXMucGFzc3dvcmQucmVzZXQucmVhc29uO1xuICAgICAgdmFyIHRva2VuTGlmZXRpbWVNcyA9IEFjY291bnRzLl9nZXRQYXNzd29yZFJlc2V0VG9rZW5MaWZldGltZU1zKCk7XG4gICAgICBpZiAocmVhc29uID09PSBcImVucm9sbFwiKSB7XG4gICAgICAgIHRva2VuTGlmZXRpbWVNcyA9IEFjY291bnRzLl9nZXRQYXNzd29yZEVucm9sbFRva2VuTGlmZXRpbWVNcygpO1xuICAgICAgfVxuICAgICAgdmFyIGN1cnJlbnRUaW1lTXMgPSBEYXRlLm5vdygpO1xuICAgICAgaWYgKChjdXJyZW50VGltZU1zIC0gd2hlbikgPiB0b2tlbkxpZmV0aW1lTXMpXG4gICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIlRva2VuIGV4cGlyZWRcIik7XG4gICAgICB2YXIgZW1haWwgPSB1c2VyLnNlcnZpY2VzLnBhc3N3b3JkLnJlc2V0LmVtYWlsO1xuICAgICAgaWYgKCFfLmluY2x1ZGUoXy5wbHVjayh1c2VyLmVtYWlscyB8fCBbXSwgJ2FkZHJlc3MnKSwgZW1haWwpKVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHVzZXJJZDogdXNlci5faWQsXG4gICAgICAgICAgZXJyb3I6IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIlRva2VuIGhhcyBpbnZhbGlkIGVtYWlsIGFkZHJlc3NcIilcbiAgICAgICAgfTtcblxuICAgICAgdmFyIGhhc2hlZCA9IGhhc2hQYXNzd29yZChuZXdQYXNzd29yZCk7XG5cbiAgICAgIC8vIE5PVEU6IFdlJ3JlIGFib3V0IHRvIGludmFsaWRhdGUgdG9rZW5zIG9uIHRoZSB1c2VyLCB3aG8gd2UgbWlnaHQgYmVcbiAgICAgIC8vIGxvZ2dlZCBpbiBhcy4gTWFrZSBzdXJlIHRvIGF2b2lkIGxvZ2dpbmcgb3Vyc2VsdmVzIG91dCBpZiB0aGlzXG4gICAgICAvLyBoYXBwZW5zLiBCdXQgYWxzbyBtYWtlIHN1cmUgbm90IHRvIGxlYXZlIHRoZSBjb25uZWN0aW9uIGluIGEgc3RhdGVcbiAgICAgIC8vIG9mIGhhdmluZyBhIGJhZCB0b2tlbiBzZXQgaWYgdGhpbmdzIGZhaWwuXG4gICAgICB2YXIgb2xkVG9rZW4gPSBBY2NvdW50cy5fZ2V0TG9naW5Ub2tlbihzZWxmLmNvbm5lY3Rpb24uaWQpO1xuICAgICAgQWNjb3VudHMuX3NldExvZ2luVG9rZW4odXNlci5faWQsIHNlbGYuY29ubmVjdGlvbiwgbnVsbCk7XG4gICAgICB2YXIgcmVzZXRUb09sZFRva2VuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBBY2NvdW50cy5fc2V0TG9naW5Ub2tlbih1c2VyLl9pZCwgc2VsZi5jb25uZWN0aW9uLCBvbGRUb2tlbik7XG4gICAgICB9O1xuXG4gICAgICB0cnkge1xuICAgICAgICAvLyBVcGRhdGUgdGhlIHVzZXIgcmVjb3JkIGJ5OlxuICAgICAgICAvLyAtIENoYW5naW5nIHRoZSBwYXNzd29yZCB0byB0aGUgbmV3IG9uZVxuICAgICAgICAvLyAtIEZvcmdldHRpbmcgYWJvdXQgdGhlIHJlc2V0IHRva2VuIHRoYXQgd2FzIGp1c3QgdXNlZFxuICAgICAgICAvLyAtIFZlcmlmeWluZyB0aGVpciBlbWFpbCwgc2luY2UgdGhleSBnb3QgdGhlIHBhc3N3b3JkIHJlc2V0IHZpYSBlbWFpbC5cbiAgICAgICAgdmFyIGFmZmVjdGVkUmVjb3JkcyA9IE1ldGVvci51c2Vycy51cGRhdGUoXG4gICAgICAgICAge1xuICAgICAgICAgICAgX2lkOiB1c2VyLl9pZCxcbiAgICAgICAgICAgICdlbWFpbHMuYWRkcmVzcyc6IGVtYWlsLFxuICAgICAgICAgICAgJ3NlcnZpY2VzLnBhc3N3b3JkLnJlc2V0LnRva2VuJzogdG9rZW5cbiAgICAgICAgICB9LFxuICAgICAgICAgIHskc2V0OiB7J3NlcnZpY2VzLnBhc3N3b3JkLmJjcnlwdCc6IGhhc2hlZCxcbiAgICAgICAgICAgICAgICAgICdlbWFpbHMuJC52ZXJpZmllZCc6IHRydWV9LFxuICAgICAgICAgICAkdW5zZXQ6IHsnc2VydmljZXMucGFzc3dvcmQucmVzZXQnOiAxLFxuICAgICAgICAgICAgICAgICAgICAnc2VydmljZXMucGFzc3dvcmQuc3JwJzogMX19KTtcbiAgICAgICAgaWYgKGFmZmVjdGVkUmVjb3JkcyAhPT0gMSlcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdXNlcklkOiB1c2VyLl9pZCxcbiAgICAgICAgICAgIGVycm9yOiBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJJbnZhbGlkIGVtYWlsXCIpXG4gICAgICAgICAgfTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZXNldFRvT2xkVG9rZW4oKTtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuXG4gICAgICAvLyBSZXBsYWNlIGFsbCB2YWxpZCBsb2dpbiB0b2tlbnMgd2l0aCBuZXcgb25lcyAoY2hhbmdpbmdcbiAgICAgIC8vIHBhc3N3b3JkIHNob3VsZCBpbnZhbGlkYXRlIGV4aXN0aW5nIHNlc3Npb25zKS5cbiAgICAgIEFjY291bnRzLl9jbGVhckFsbExvZ2luVG9rZW5zKHVzZXIuX2lkKTtcblxuICAgICAgcmV0dXJuIHt1c2VySWQ6IHVzZXIuX2lkfTtcbiAgICB9XG4gICk7XG59fSk7XG5cbi8vL1xuLy8vIEVNQUlMIFZFUklGSUNBVElPTlxuLy8vXG5cblxuLy8gc2VuZCB0aGUgdXNlciBhbiBlbWFpbCB3aXRoIGEgbGluayB0aGF0IHdoZW4gb3BlbmVkIG1hcmtzIHRoYXRcbi8vIGFkZHJlc3MgYXMgdmVyaWZpZWRcblxuLyoqXG4gKiBAc3VtbWFyeSBTZW5kIGFuIGVtYWlsIHdpdGggYSBsaW5rIHRoZSB1c2VyIGNhbiB1c2UgdmVyaWZ5IHRoZWlyIGVtYWlsIGFkZHJlc3MuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAcGFyYW0ge1N0cmluZ30gdXNlcklkIFRoZSBpZCBvZiB0aGUgdXNlciB0byBzZW5kIGVtYWlsIHRvLlxuICogQHBhcmFtIHtTdHJpbmd9IFtlbWFpbF0gT3B0aW9uYWwuIFdoaWNoIGFkZHJlc3Mgb2YgdGhlIHVzZXIncyB0byBzZW5kIHRoZSBlbWFpbCB0by4gVGhpcyBhZGRyZXNzIG11c3QgYmUgaW4gdGhlIHVzZXIncyBgZW1haWxzYCBsaXN0LiBEZWZhdWx0cyB0byB0aGUgZmlyc3QgdW52ZXJpZmllZCBlbWFpbCBpbiB0aGUgbGlzdC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbZXh0cmFUb2tlbkRhdGFdIE9wdGlvbmFsIGFkZGl0aW9uYWwgZGF0YSB0byBiZSBhZGRlZCBpbnRvIHRoZSB0b2tlbiByZWNvcmQuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBPYmplY3Qgd2l0aCB7ZW1haWwsIHVzZXIsIHRva2VuLCB1cmwsIG9wdGlvbnN9IHZhbHVlcy5cbiAqIEBpbXBvcnRGcm9tUGFja2FnZSBhY2NvdW50cy1iYXNlXG4gKi9cbkFjY291bnRzLnNlbmRWZXJpZmljYXRpb25FbWFpbCA9IGZ1bmN0aW9uICh1c2VySWQsIGVtYWlsLCBleHRyYVRva2VuRGF0YSkge1xuICAvLyBYWFggQWxzbyBnZW5lcmF0ZSBhIGxpbmsgdXNpbmcgd2hpY2ggc29tZW9uZSBjYW4gZGVsZXRlIHRoaXNcbiAgLy8gYWNjb3VudCBpZiB0aGV5IG93biBzYWlkIGFkZHJlc3MgYnV0IHdlcmVuJ3QgdGhvc2Ugd2hvIGNyZWF0ZWRcbiAgLy8gdGhpcyBhY2NvdW50LlxuXG4gIGNvbnN0IHtlbWFpbDogcmVhbEVtYWlsLCB1c2VyLCB0b2tlbn0gPVxuICAgIEFjY291bnRzLmdlbmVyYXRlVmVyaWZpY2F0aW9uVG9rZW4odXNlcklkLCBlbWFpbCwgZXh0cmFUb2tlbkRhdGEpO1xuICBjb25zdCB1cmwgPSBBY2NvdW50cy51cmxzLnZlcmlmeUVtYWlsKHRva2VuKTtcbiAgY29uc3Qgb3B0aW9ucyA9IEFjY291bnRzLmdlbmVyYXRlT3B0aW9uc0ZvckVtYWlsKHJlYWxFbWFpbCwgdXNlciwgdXJsLCAndmVyaWZ5RW1haWwnKTtcbiAgRW1haWwuc2VuZChvcHRpb25zKTtcbiAgcmV0dXJuIHtlbWFpbDogcmVhbEVtYWlsLCB1c2VyLCB0b2tlbiwgdXJsLCBvcHRpb25zfTtcbn07XG5cbi8vIFRha2UgdG9rZW4gZnJvbSBzZW5kVmVyaWZpY2F0aW9uRW1haWwsIG1hcmsgdGhlIGVtYWlsIGFzIHZlcmlmaWVkLFxuLy8gYW5kIGxvZyB0aGVtIGluLlxuTWV0ZW9yLm1ldGhvZHMoe3ZlcmlmeUVtYWlsOiBmdW5jdGlvbiAodG9rZW4pIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICByZXR1cm4gQWNjb3VudHMuX2xvZ2luTWV0aG9kKFxuICAgIHNlbGYsXG4gICAgXCJ2ZXJpZnlFbWFpbFwiLFxuICAgIGFyZ3VtZW50cyxcbiAgICBcInBhc3N3b3JkXCIsXG4gICAgZnVuY3Rpb24gKCkge1xuICAgICAgY2hlY2sodG9rZW4sIFN0cmluZyk7XG5cbiAgICAgIHZhciB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUoXG4gICAgICAgIHsnc2VydmljZXMuZW1haWwudmVyaWZpY2F0aW9uVG9rZW5zLnRva2VuJzogdG9rZW59KTtcbiAgICAgIGlmICghdXNlcilcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiVmVyaWZ5IGVtYWlsIGxpbmsgZXhwaXJlZFwiKTtcblxuICAgICAgdmFyIHRva2VuUmVjb3JkID0gXy5maW5kKHVzZXIuc2VydmljZXMuZW1haWwudmVyaWZpY2F0aW9uVG9rZW5zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdC50b2tlbiA9PSB0b2tlbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgIGlmICghdG9rZW5SZWNvcmQpXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdXNlcklkOiB1c2VyLl9pZCxcbiAgICAgICAgICBlcnJvcjogbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiVmVyaWZ5IGVtYWlsIGxpbmsgZXhwaXJlZFwiKVxuICAgICAgICB9O1xuXG4gICAgICB2YXIgZW1haWxzUmVjb3JkID0gXy5maW5kKHVzZXIuZW1haWxzLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICByZXR1cm4gZS5hZGRyZXNzID09IHRva2VuUmVjb3JkLmFkZHJlc3M7XG4gICAgICB9KTtcbiAgICAgIGlmICghZW1haWxzUmVjb3JkKVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHVzZXJJZDogdXNlci5faWQsXG4gICAgICAgICAgZXJyb3I6IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIlZlcmlmeSBlbWFpbCBsaW5rIGlzIGZvciB1bmtub3duIGFkZHJlc3NcIilcbiAgICAgICAgfTtcblxuICAgICAgLy8gQnkgaW5jbHVkaW5nIHRoZSBhZGRyZXNzIGluIHRoZSBxdWVyeSwgd2UgY2FuIHVzZSAnZW1haWxzLiQnIGluIHRoZVxuICAgICAgLy8gbW9kaWZpZXIgdG8gZ2V0IGEgcmVmZXJlbmNlIHRvIHRoZSBzcGVjaWZpYyBvYmplY3QgaW4gdGhlIGVtYWlsc1xuICAgICAgLy8gYXJyYXkuIFNlZVxuICAgICAgLy8gaHR0cDovL3d3dy5tb25nb2RiLm9yZy9kaXNwbGF5L0RPQ1MvVXBkYXRpbmcvI1VwZGF0aW5nLVRoZSUyNHBvc2l0aW9uYWxvcGVyYXRvcilcbiAgICAgIC8vIGh0dHA6Ly93d3cubW9uZ29kYi5vcmcvZGlzcGxheS9ET0NTL1VwZGF0aW5nI1VwZGF0aW5nLSUyNHB1bGxcbiAgICAgIE1ldGVvci51c2Vycy51cGRhdGUoXG4gICAgICAgIHtfaWQ6IHVzZXIuX2lkLFxuICAgICAgICAgJ2VtYWlscy5hZGRyZXNzJzogdG9rZW5SZWNvcmQuYWRkcmVzc30sXG4gICAgICAgIHskc2V0OiB7J2VtYWlscy4kLnZlcmlmaWVkJzogdHJ1ZX0sXG4gICAgICAgICAkcHVsbDogeydzZXJ2aWNlcy5lbWFpbC52ZXJpZmljYXRpb25Ub2tlbnMnOiB7YWRkcmVzczogdG9rZW5SZWNvcmQuYWRkcmVzc319fSk7XG5cbiAgICAgIHJldHVybiB7dXNlcklkOiB1c2VyLl9pZH07XG4gICAgfVxuICApO1xufX0pO1xuXG4vKipcbiAqIEBzdW1tYXJ5IEFkZCBhbiBlbWFpbCBhZGRyZXNzIGZvciBhIHVzZXIuIFVzZSB0aGlzIGluc3RlYWQgb2YgZGlyZWN0bHlcbiAqIHVwZGF0aW5nIHRoZSBkYXRhYmFzZS4gVGhlIG9wZXJhdGlvbiB3aWxsIGZhaWwgaWYgdGhlcmUgaXMgYSBkaWZmZXJlbnQgdXNlclxuICogd2l0aCBhbiBlbWFpbCBvbmx5IGRpZmZlcmluZyBpbiBjYXNlLiBJZiB0aGUgc3BlY2lmaWVkIHVzZXIgaGFzIGFuIGV4aXN0aW5nXG4gKiBlbWFpbCBvbmx5IGRpZmZlcmluZyBpbiBjYXNlIGhvd2V2ZXIsIHdlIHJlcGxhY2UgaXQuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAcGFyYW0ge1N0cmluZ30gdXNlcklkIFRoZSBJRCBvZiB0aGUgdXNlciB0byB1cGRhdGUuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmV3RW1haWwgQSBuZXcgZW1haWwgYWRkcmVzcyBmb3IgdGhlIHVzZXIuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFt2ZXJpZmllZF0gT3B0aW9uYWwgLSB3aGV0aGVyIHRoZSBuZXcgZW1haWwgYWRkcmVzcyBzaG91bGRcbiAqIGJlIG1hcmtlZCBhcyB2ZXJpZmllZC4gRGVmYXVsdHMgdG8gZmFsc2UuXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgYWNjb3VudHMtYmFzZVxuICovXG5BY2NvdW50cy5hZGRFbWFpbCA9IGZ1bmN0aW9uICh1c2VySWQsIG5ld0VtYWlsLCB2ZXJpZmllZCkge1xuICBjaGVjayh1c2VySWQsIE5vbkVtcHR5U3RyaW5nKTtcbiAgY2hlY2sobmV3RW1haWwsIE5vbkVtcHR5U3RyaW5nKTtcbiAgY2hlY2sodmVyaWZpZWQsIE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pKTtcblxuICBpZiAoXy5pc1VuZGVmaW5lZCh2ZXJpZmllZCkpIHtcbiAgICB2ZXJpZmllZCA9IGZhbHNlO1xuICB9XG5cbiAgdmFyIHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh1c2VySWQpO1xuICBpZiAoIXVzZXIpXG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiVXNlciBub3QgZm91bmRcIik7XG5cbiAgLy8gQWxsb3cgdXNlcnMgdG8gY2hhbmdlIHRoZWlyIG93biBlbWFpbCB0byBhIHZlcnNpb24gd2l0aCBhIGRpZmZlcmVudCBjYXNlXG5cbiAgLy8gV2UgZG9uJ3QgaGF2ZSB0byBjYWxsIGNoZWNrRm9yQ2FzZUluc2Vuc2l0aXZlRHVwbGljYXRlcyB0byBkbyBhIGNhc2VcbiAgLy8gaW5zZW5zaXRpdmUgY2hlY2sgYWNyb3NzIGFsbCBlbWFpbHMgaW4gdGhlIGRhdGFiYXNlIGhlcmUgYmVjYXVzZTogKDEpIGlmXG4gIC8vIHRoZXJlIGlzIG5vIGNhc2UtaW5zZW5zaXRpdmUgZHVwbGljYXRlIGJldHdlZW4gdGhpcyB1c2VyIGFuZCBvdGhlciB1c2VycyxcbiAgLy8gdGhlbiB3ZSBhcmUgT0sgYW5kICgyKSBpZiB0aGlzIHdvdWxkIGNyZWF0ZSBhIGNvbmZsaWN0IHdpdGggb3RoZXIgdXNlcnNcbiAgLy8gdGhlbiB0aGVyZSB3b3VsZCBhbHJlYWR5IGJlIGEgY2FzZS1pbnNlbnNpdGl2ZSBkdXBsaWNhdGUgYW5kIHdlIGNhbid0IGZpeFxuICAvLyB0aGF0IGluIHRoaXMgY29kZSBhbnl3YXkuXG4gIHZhciBjYXNlSW5zZW5zaXRpdmVSZWdFeHAgPVxuICAgIG5ldyBSZWdFeHAoJ14nICsgTWV0ZW9yLl9lc2NhcGVSZWdFeHAobmV3RW1haWwpICsgJyQnLCAnaScpO1xuXG4gIHZhciBkaWRVcGRhdGVPd25FbWFpbCA9IF8uYW55KHVzZXIuZW1haWxzLCBmdW5jdGlvbihlbWFpbCwgaW5kZXgpIHtcbiAgICBpZiAoY2FzZUluc2Vuc2l0aXZlUmVnRXhwLnRlc3QoZW1haWwuYWRkcmVzcykpIHtcbiAgICAgIE1ldGVvci51c2Vycy51cGRhdGUoe1xuICAgICAgICBfaWQ6IHVzZXIuX2lkLFxuICAgICAgICAnZW1haWxzLmFkZHJlc3MnOiBlbWFpbC5hZGRyZXNzXG4gICAgICB9LCB7JHNldDoge1xuICAgICAgICAnZW1haWxzLiQuYWRkcmVzcyc6IG5ld0VtYWlsLFxuICAgICAgICAnZW1haWxzLiQudmVyaWZpZWQnOiB2ZXJpZmllZFxuICAgICAgfX0pO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9KTtcblxuICAvLyBJbiB0aGUgb3RoZXIgdXBkYXRlcyBiZWxvdywgd2UgaGF2ZSB0byBkbyBhbm90aGVyIGNhbGwgdG9cbiAgLy8gY2hlY2tGb3JDYXNlSW5zZW5zaXRpdmVEdXBsaWNhdGVzIHRvIG1ha2Ugc3VyZSB0aGF0IG5vIGNvbmZsaWN0aW5nIHZhbHVlc1xuICAvLyB3ZXJlIGFkZGVkIHRvIHRoZSBkYXRhYmFzZSBpbiB0aGUgbWVhbnRpbWUuIFdlIGRvbid0IGhhdmUgdG8gZG8gdGhpcyBmb3JcbiAgLy8gdGhlIGNhc2Ugd2hlcmUgdGhlIHVzZXIgaXMgdXBkYXRpbmcgdGhlaXIgZW1haWwgYWRkcmVzcyB0byBvbmUgdGhhdCBpcyB0aGVcbiAgLy8gc2FtZSBhcyBiZWZvcmUsIGJ1dCBvbmx5IGRpZmZlcmVudCBiZWNhdXNlIG9mIGNhcGl0YWxpemF0aW9uLiBSZWFkIHRoZVxuICAvLyBiaWcgY29tbWVudCBhYm92ZSB0byB1bmRlcnN0YW5kIHdoeS5cblxuICBpZiAoZGlkVXBkYXRlT3duRW1haWwpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBQZXJmb3JtIGEgY2FzZSBpbnNlbnNpdGl2ZSBjaGVjayBmb3IgZHVwbGljYXRlcyBiZWZvcmUgdXBkYXRlXG4gIGNoZWNrRm9yQ2FzZUluc2Vuc2l0aXZlRHVwbGljYXRlcygnZW1haWxzLmFkZHJlc3MnLCAnRW1haWwnLCBuZXdFbWFpbCwgdXNlci5faWQpO1xuXG4gIE1ldGVvci51c2Vycy51cGRhdGUoe1xuICAgIF9pZDogdXNlci5faWRcbiAgfSwge1xuICAgICRhZGRUb1NldDoge1xuICAgICAgZW1haWxzOiB7XG4gICAgICAgIGFkZHJlc3M6IG5ld0VtYWlsLFxuICAgICAgICB2ZXJpZmllZDogdmVyaWZpZWRcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIC8vIFBlcmZvcm0gYW5vdGhlciBjaGVjayBhZnRlciB1cGRhdGUsIGluIGNhc2UgYSBtYXRjaGluZyB1c2VyIGhhcyBiZWVuXG4gIC8vIGluc2VydGVkIGluIHRoZSBtZWFudGltZVxuICB0cnkge1xuICAgIGNoZWNrRm9yQ2FzZUluc2Vuc2l0aXZlRHVwbGljYXRlcygnZW1haWxzLmFkZHJlc3MnLCAnRW1haWwnLCBuZXdFbWFpbCwgdXNlci5faWQpO1xuICB9IGNhdGNoIChleCkge1xuICAgIC8vIFVuZG8gdXBkYXRlIGlmIHRoZSBjaGVjayBmYWlsc1xuICAgIE1ldGVvci51c2Vycy51cGRhdGUoe19pZDogdXNlci5faWR9LFxuICAgICAgeyRwdWxsOiB7ZW1haWxzOiB7YWRkcmVzczogbmV3RW1haWx9fX0pO1xuICAgIHRocm93IGV4O1xuICB9XG59XG5cbi8qKlxuICogQHN1bW1hcnkgUmVtb3ZlIGFuIGVtYWlsIGFkZHJlc3MgZm9yIGEgdXNlci4gVXNlIHRoaXMgaW5zdGVhZCBvZiB1cGRhdGluZ1xuICogdGhlIGRhdGFiYXNlIGRpcmVjdGx5LlxuICogQGxvY3VzIFNlcnZlclxuICogQHBhcmFtIHtTdHJpbmd9IHVzZXJJZCBUaGUgSUQgb2YgdGhlIHVzZXIgdG8gdXBkYXRlLlxuICogQHBhcmFtIHtTdHJpbmd9IGVtYWlsIFRoZSBlbWFpbCBhZGRyZXNzIHRvIHJlbW92ZS5cbiAqIEBpbXBvcnRGcm9tUGFja2FnZSBhY2NvdW50cy1iYXNlXG4gKi9cbkFjY291bnRzLnJlbW92ZUVtYWlsID0gZnVuY3Rpb24gKHVzZXJJZCwgZW1haWwpIHtcbiAgY2hlY2sodXNlcklkLCBOb25FbXB0eVN0cmluZyk7XG4gIGNoZWNrKGVtYWlsLCBOb25FbXB0eVN0cmluZyk7XG5cbiAgdmFyIHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh1c2VySWQpO1xuICBpZiAoIXVzZXIpXG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiVXNlciBub3QgZm91bmRcIik7XG5cbiAgTWV0ZW9yLnVzZXJzLnVwZGF0ZSh7X2lkOiB1c2VyLl9pZH0sXG4gICAgeyRwdWxsOiB7ZW1haWxzOiB7YWRkcmVzczogZW1haWx9fX0pO1xufVxuXG4vLy9cbi8vLyBDUkVBVElORyBVU0VSU1xuLy8vXG5cbi8vIFNoYXJlZCBjcmVhdGVVc2VyIGZ1bmN0aW9uIGNhbGxlZCBmcm9tIHRoZSBjcmVhdGVVc2VyIG1ldGhvZCwgYm90aFxuLy8gaWYgb3JpZ2luYXRlcyBpbiBjbGllbnQgb3Igc2VydmVyIGNvZGUuIENhbGxzIHVzZXIgcHJvdmlkZWQgaG9va3MsXG4vLyBkb2VzIHRoZSBhY3R1YWwgdXNlciBpbnNlcnRpb24uXG4vL1xuLy8gcmV0dXJucyB0aGUgdXNlciBpZFxudmFyIGNyZWF0ZVVzZXIgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAvLyBVbmtub3duIGtleXMgYWxsb3dlZCwgYmVjYXVzZSBhIG9uQ3JlYXRlVXNlckhvb2sgY2FuIHRha2UgYXJiaXRyYXJ5XG4gIC8vIG9wdGlvbnMuXG4gIGNoZWNrKG9wdGlvbnMsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG4gICAgdXNlcm5hbWU6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gICAgZW1haWw6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gICAgcGFzc3dvcmQ6IE1hdGNoLk9wdGlvbmFsKHBhc3N3b3JkVmFsaWRhdG9yKVxuICB9KSk7XG5cbiAgdmFyIHVzZXJuYW1lID0gb3B0aW9ucy51c2VybmFtZTtcbiAgdmFyIGVtYWlsID0gb3B0aW9ucy5lbWFpbDtcbiAgaWYgKCF1c2VybmFtZSAmJiAhZW1haWwpXG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDAsIFwiTmVlZCB0byBzZXQgYSB1c2VybmFtZSBvciBlbWFpbFwiKTtcblxuICB2YXIgdXNlciA9IHtzZXJ2aWNlczoge319O1xuICBpZiAob3B0aW9ucy5wYXNzd29yZCkge1xuICAgIHZhciBoYXNoZWQgPSBoYXNoUGFzc3dvcmQob3B0aW9ucy5wYXNzd29yZCk7XG4gICAgdXNlci5zZXJ2aWNlcy5wYXNzd29yZCA9IHsgYmNyeXB0OiBoYXNoZWQgfTtcbiAgfVxuXG4gIGlmICh1c2VybmFtZSlcbiAgICB1c2VyLnVzZXJuYW1lID0gdXNlcm5hbWU7XG4gIGlmIChlbWFpbClcbiAgICB1c2VyLmVtYWlscyA9IFt7YWRkcmVzczogZW1haWwsIHZlcmlmaWVkOiBmYWxzZX1dO1xuXG4gIC8vIFBlcmZvcm0gYSBjYXNlIGluc2Vuc2l0aXZlIGNoZWNrIGJlZm9yZSBpbnNlcnRcbiAgY2hlY2tGb3JDYXNlSW5zZW5zaXRpdmVEdXBsaWNhdGVzKCd1c2VybmFtZScsICdVc2VybmFtZScsIHVzZXJuYW1lKTtcbiAgY2hlY2tGb3JDYXNlSW5zZW5zaXRpdmVEdXBsaWNhdGVzKCdlbWFpbHMuYWRkcmVzcycsICdFbWFpbCcsIGVtYWlsKTtcblxuICB2YXIgdXNlcklkID0gQWNjb3VudHMuaW5zZXJ0VXNlckRvYyhvcHRpb25zLCB1c2VyKTtcbiAgLy8gUGVyZm9ybSBhbm90aGVyIGNoZWNrIGFmdGVyIGluc2VydCwgaW4gY2FzZSBhIG1hdGNoaW5nIHVzZXIgaGFzIGJlZW5cbiAgLy8gaW5zZXJ0ZWQgaW4gdGhlIG1lYW50aW1lXG4gIHRyeSB7XG4gICAgY2hlY2tGb3JDYXNlSW5zZW5zaXRpdmVEdXBsaWNhdGVzKCd1c2VybmFtZScsICdVc2VybmFtZScsIHVzZXJuYW1lLCB1c2VySWQpO1xuICAgIGNoZWNrRm9yQ2FzZUluc2Vuc2l0aXZlRHVwbGljYXRlcygnZW1haWxzLmFkZHJlc3MnLCAnRW1haWwnLCBlbWFpbCwgdXNlcklkKTtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICAvLyBSZW1vdmUgaW5zZXJ0ZWQgdXNlciBpZiB0aGUgY2hlY2sgZmFpbHNcbiAgICBNZXRlb3IudXNlcnMucmVtb3ZlKHVzZXJJZCk7XG4gICAgdGhyb3cgZXg7XG4gIH1cbiAgcmV0dXJuIHVzZXJJZDtcbn07XG5cbi8vIG1ldGhvZCBmb3IgY3JlYXRlIHVzZXIuIFJlcXVlc3RzIGNvbWUgZnJvbSB0aGUgY2xpZW50LlxuTWV0ZW9yLm1ldGhvZHMoe2NyZWF0ZVVzZXI6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgcmV0dXJuIEFjY291bnRzLl9sb2dpbk1ldGhvZChcbiAgICBzZWxmLFxuICAgIFwiY3JlYXRlVXNlclwiLFxuICAgIGFyZ3VtZW50cyxcbiAgICBcInBhc3N3b3JkXCIsXG4gICAgZnVuY3Rpb24gKCkge1xuICAgICAgLy8gY3JlYXRlVXNlcigpIGFib3ZlIGRvZXMgbW9yZSBjaGVja2luZy5cbiAgICAgIGNoZWNrKG9wdGlvbnMsIE9iamVjdCk7XG4gICAgICBpZiAoQWNjb3VudHMuX29wdGlvbnMuZm9yYmlkQ2xpZW50QWNjb3VudENyZWF0aW9uKVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGVycm9yOiBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJTaWdudXBzIGZvcmJpZGRlblwiKVxuICAgICAgICB9O1xuXG4gICAgICAvLyBDcmVhdGUgdXNlci4gcmVzdWx0IGNvbnRhaW5zIGlkIGFuZCB0b2tlbi5cbiAgICAgIHZhciB1c2VySWQgPSBjcmVhdGVVc2VyKG9wdGlvbnMpO1xuICAgICAgLy8gc2FmZXR5IGJlbHQuIGNyZWF0ZVVzZXIgaXMgc3VwcG9zZWQgdG8gdGhyb3cgb24gZXJyb3IuIHNlbmQgNTAwIGVycm9yXG4gICAgICAvLyBpbnN0ZWFkIG9mIHNlbmRpbmcgYSB2ZXJpZmljYXRpb24gZW1haWwgd2l0aCBlbXB0eSB1c2VyaWQuXG4gICAgICBpZiAoISB1c2VySWQpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImNyZWF0ZVVzZXIgZmFpbGVkIHRvIGluc2VydCBuZXcgdXNlclwiKTtcblxuICAgICAgLy8gSWYgYEFjY291bnRzLl9vcHRpb25zLnNlbmRWZXJpZmljYXRpb25FbWFpbGAgaXMgc2V0LCByZWdpc3RlclxuICAgICAgLy8gYSB0b2tlbiB0byB2ZXJpZnkgdGhlIHVzZXIncyBwcmltYXJ5IGVtYWlsLCBhbmQgc2VuZCBpdCB0b1xuICAgICAgLy8gdGhhdCBhZGRyZXNzLlxuICAgICAgaWYgKG9wdGlvbnMuZW1haWwgJiYgQWNjb3VudHMuX29wdGlvbnMuc2VuZFZlcmlmaWNhdGlvbkVtYWlsKVxuICAgICAgICBBY2NvdW50cy5zZW5kVmVyaWZpY2F0aW9uRW1haWwodXNlcklkLCBvcHRpb25zLmVtYWlsKTtcblxuICAgICAgLy8gY2xpZW50IGdldHMgbG9nZ2VkIGluIGFzIHRoZSBuZXcgdXNlciBhZnRlcndhcmRzLlxuICAgICAgcmV0dXJuIHt1c2VySWQ6IHVzZXJJZH07XG4gICAgfVxuICApO1xufX0pO1xuXG4vLyBDcmVhdGUgdXNlciBkaXJlY3RseSBvbiB0aGUgc2VydmVyLlxuLy9cbi8vIFVubGlrZSB0aGUgY2xpZW50IHZlcnNpb24sIHRoaXMgZG9lcyBub3QgbG9nIHlvdSBpbiBhcyB0aGlzIHVzZXJcbi8vIGFmdGVyIGNyZWF0aW9uLlxuLy9cbi8vIHJldHVybnMgdXNlcklkIG9yIHRocm93cyBhbiBlcnJvciBpZiBpdCBjYW4ndCBjcmVhdGVcbi8vXG4vLyBYWFggYWRkIGFub3RoZXIgYXJndW1lbnQgKFwic2VydmVyIG9wdGlvbnNcIikgdGhhdCBnZXRzIHNlbnQgdG8gb25DcmVhdGVVc2VyLFxuLy8gd2hpY2ggaXMgYWx3YXlzIGVtcHR5IHdoZW4gY2FsbGVkIGZyb20gdGhlIGNyZWF0ZVVzZXIgbWV0aG9kPyBlZywgXCJhZG1pbjpcbi8vIHRydWVcIiwgd2hpY2ggd2Ugd2FudCB0byBwcmV2ZW50IHRoZSBjbGllbnQgZnJvbSBzZXR0aW5nLCBidXQgd2hpY2ggYSBjdXN0b21cbi8vIG1ldGhvZCBjYWxsaW5nIEFjY291bnRzLmNyZWF0ZVVzZXIgY291bGQgc2V0P1xuLy9cbkFjY291bnRzLmNyZWF0ZVVzZXIgPSBmdW5jdGlvbiAob3B0aW9ucywgY2FsbGJhY2spIHtcbiAgb3B0aW9ucyA9IF8uY2xvbmUob3B0aW9ucyk7XG5cbiAgLy8gWFhYIGFsbG93IGFuIG9wdGlvbmFsIGNhbGxiYWNrP1xuICBpZiAoY2FsbGJhY2spIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBY2NvdW50cy5jcmVhdGVVc2VyIHdpdGggY2FsbGJhY2sgbm90IHN1cHBvcnRlZCBvbiB0aGUgc2VydmVyIHlldC5cIik7XG4gIH1cblxuICByZXR1cm4gY3JlYXRlVXNlcihvcHRpb25zKTtcbn07XG5cbi8vL1xuLy8vIFBBU1NXT1JELVNQRUNJRklDIElOREVYRVMgT04gVVNFUlNcbi8vL1xuTWV0ZW9yLnVzZXJzLl9lbnN1cmVJbmRleCgnc2VydmljZXMuZW1haWwudmVyaWZpY2F0aW9uVG9rZW5zLnRva2VuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAge3VuaXF1ZTogMSwgc3BhcnNlOiAxfSk7XG5NZXRlb3IudXNlcnMuX2Vuc3VyZUluZGV4KCdzZXJ2aWNlcy5wYXNzd29yZC5yZXNldC50b2tlbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHt1bmlxdWU6IDEsIHNwYXJzZTogMX0pO1xuIl19
