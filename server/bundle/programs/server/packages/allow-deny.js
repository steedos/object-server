(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var LocalCollection = Package.minimongo.LocalCollection;
var Minimongo = Package.minimongo.Minimongo;
var check = Package.check.check;
var Match = Package.check.Match;
var EJSON = Package.ejson.EJSON;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var AllowDeny;

var require = meteorInstall({"node_modules":{"meteor":{"allow-deny":{"allow-deny.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/allow-deny/allow-deny.js                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
///
/// Remote methods and access control.
///
const hasOwn = Object.prototype.hasOwnProperty; // Restrict default mutators on collection. allow() and deny() take the
// same options:
//
// options.insert {Function(userId, doc)}
//   return true to allow/deny adding this document
//
// options.update {Function(userId, docs, fields, modifier)}
//   return true to allow/deny updating these documents.
//   `fields` is passed as an array of fields that are to be modified
//
// options.remove {Function(userId, docs)}
//   return true to allow/deny removing these documents
//
// options.fetch {Array}
//   Fields to fetch for these validators. If any call to allow or deny
//   does not have this option then all fields are loaded.
//
// allow and deny can be called multiple times. The validators are
// evaluated as follows:
// - If neither deny() nor allow() has been called on the collection,
//   then the request is allowed if and only if the "insecure" smart
//   package is in use.
// - Otherwise, if any deny() function returns true, the request is denied.
// - Otherwise, if any allow() function returns true, the request is allowed.
// - Otherwise, the request is denied.
//
// Meteor may call your deny() and allow() functions in any order, and may not
// call all of them if it is able to make a decision without calling them all
// (so don't include side effects).

AllowDeny = {
  CollectionPrototype: {}
}; // In the `mongo` package, we will extend Mongo.Collection.prototype with these
// methods

const CollectionPrototype = AllowDeny.CollectionPrototype;
/**
 * @summary Allow users to write directly to this collection from client code, subject to limitations you define.
 * @locus Server
 * @method allow
 * @memberOf Mongo.Collection
 * @instance
 * @param {Object} options
 * @param {Function} options.insert,update,remove Functions that look at a proposed modification to the database and return true if it should be allowed.
 * @param {String[]} options.fetch Optional performance enhancement. Limits the fields that will be fetched from the database for inspection by your `update` and `remove` functions.
 * @param {Function} options.transform Overrides `transform` on the  [`Collection`](#collections).  Pass `null` to disable transformation.
 */

CollectionPrototype.allow = function (options) {
  addValidator(this, 'allow', options);
};
/**
 * @summary Override `allow` rules.
 * @locus Server
 * @method deny
 * @memberOf Mongo.Collection
 * @instance
 * @param {Object} options
 * @param {Function} options.insert,update,remove Functions that look at a proposed modification to the database and return true if it should be denied, even if an [allow](#allow) rule says otherwise.
 * @param {String[]} options.fetch Optional performance enhancement. Limits the fields that will be fetched from the database for inspection by your `update` and `remove` functions.
 * @param {Function} options.transform Overrides `transform` on the  [`Collection`](#collections).  Pass `null` to disable transformation.
 */


CollectionPrototype.deny = function (options) {
  addValidator(this, 'deny', options);
};

CollectionPrototype._defineMutationMethods = function (options) {
  const self = this;
  options = options || {}; // set to true once we call any allow or deny methods. If true, use
  // allow/deny semantics. If false, use insecure mode semantics.

  self._restricted = false; // Insecure mode (default to allowing writes). Defaults to 'undefined' which
  // means insecure iff the insecure package is loaded. This property can be
  // overriden by tests or packages wishing to change insecure mode behavior of
  // their collections.

  self._insecure = undefined;
  self._validators = {
    insert: {
      allow: [],
      deny: []
    },
    update: {
      allow: [],
      deny: []
    },
    remove: {
      allow: [],
      deny: []
    },
    upsert: {
      allow: [],
      deny: []
    },
    // dummy arrays; can't set these!
    fetch: [],
    fetchAllFields: false
  };
  if (!self._name) return; // anonymous collection
  // XXX Think about method namespacing. Maybe methods should be
  // "Meteor:Mongo:insert/NAME"?

  self._prefix = '/' + self._name + '/'; // Mutation Methods
  // Minimongo on the server gets no stubs; instead, by default
  // it wait()s until its result is ready, yielding.
  // This matches the behavior of macromongo on the server better.
  // XXX see #MeteorServerNull

  if (self._connection && (self._connection === Meteor.server || Meteor.isClient)) {
    const m = {};
    ['insert', 'update', 'remove'].forEach(method => {
      const methodName = self._prefix + method;

      if (options.useExisting) {
        const handlerPropName = Meteor.isClient ? '_methodHandlers' : 'method_handlers'; // Do not try to create additional methods if this has already been called.
        // (Otherwise the .methods() call below will throw an error.)

        if (self._connection[handlerPropName] && typeof self._connection[handlerPropName][methodName] === 'function') return;
      }

      m[methodName] = function ()
      /* ... */
      {
        // All the methods do their own validation, instead of using check().
        check(arguments, [Match.Any]);
        const args = Array.from(arguments);

        try {
          // For an insert, if the client didn't specify an _id, generate one
          // now; because this uses DDP.randomStream, it will be consistent with
          // what the client generated. We generate it now rather than later so
          // that if (eg) an allow/deny rule does an insert to the same
          // collection (not that it really should), the generated _id will
          // still be the first use of the stream and will be consistent.
          //
          // However, we don't actually stick the _id onto the document yet,
          // because we want allow/deny rules to be able to differentiate
          // between arbitrary client-specified _id fields and merely
          // client-controlled-via-randomSeed fields.
          let generatedId = null;

          if (method === "insert" && !hasOwn.call(args[0], '_id')) {
            generatedId = self._makeNewID();
          }

          if (this.isSimulation) {
            // In a client simulation, you can do any mutation (even with a
            // complex selector).
            if (generatedId !== null) args[0]._id = generatedId;
            return self._collection[method].apply(self._collection, args);
          } // This is the server receiving a method call from the client.
          // We don't allow arbitrary selectors in mutations from the client: only
          // single-ID selectors.


          if (method !== 'insert') throwIfSelectorIsNotId(args[0], method);

          if (self._restricted) {
            // short circuit if there is no way it will pass.
            if (self._validators[method].allow.length === 0) {
              throw new Meteor.Error(403, "Access denied. No allow validators set on restricted " + "collection for method '" + method + "'.");
            }

            const validatedMethodName = '_validated' + method.charAt(0).toUpperCase() + method.slice(1);
            args.unshift(this.userId);
            method === 'insert' && args.push(generatedId);
            return self[validatedMethodName].apply(self, args);
          } else if (self._isInsecure()) {
            if (generatedId !== null) args[0]._id = generatedId; // In insecure mode, allow any mutation (with a simple selector).
            // XXX This is kind of bogus.  Instead of blindly passing whatever
            //     we get from the network to this function, we should actually
            //     know the correct arguments for the function and pass just
            //     them.  For example, if you have an extraneous extra null
            //     argument and this is Mongo on the server, the .wrapAsync'd
            //     functions like update will get confused and pass the
            //     "fut.resolver()" in the wrong slot, where _update will never
            //     invoke it. Bam, broken DDP connection.  Probably should just
            //     take this whole method and write it three times, invoking
            //     helpers for the common code.

            return self._collection[method].apply(self._collection, args);
          } else {
            // In secure mode, if we haven't called allow or deny, then nothing
            // is permitted.
            throw new Meteor.Error(403, "Access denied");
          }
        } catch (e) {
          if (e.name === 'MongoError' || e.name === 'MinimongoError') {
            throw new Meteor.Error(409, e.toString());
          } else {
            throw e;
          }
        }
      };
    });

    self._connection.methods(m);
  }
};

CollectionPrototype._updateFetch = function (fields) {
  const self = this;

  if (!self._validators.fetchAllFields) {
    if (fields) {
      const union = Object.create(null);

      const add = names => names && names.forEach(name => union[name] = 1);

      add(self._validators.fetch);
      add(fields);
      self._validators.fetch = Object.keys(union);
    } else {
      self._validators.fetchAllFields = true; // clear fetch just to make sure we don't accidentally read it

      self._validators.fetch = null;
    }
  }
};

CollectionPrototype._isInsecure = function () {
  const self = this;
  if (self._insecure === undefined) return !!Package.insecure;
  return self._insecure;
};

CollectionPrototype._validatedInsert = function (userId, doc, generatedId) {
  const self = this; // call user validators.
  // Any deny returns true means denied.

  if (self._validators.insert.deny.some(validator => {
    return validator(userId, docToValidate(validator, doc, generatedId));
  })) {
    throw new Meteor.Error(403, "Access denied");
  } // Any allow returns true means proceed. Throw error if they all fail.


  if (self._validators.insert.allow.every(validator => {
    return !validator(userId, docToValidate(validator, doc, generatedId));
  })) {
    throw new Meteor.Error(403, "Access denied");
  } // If we generated an ID above, insert it now: after the validation, but
  // before actually inserting.


  if (generatedId !== null) doc._id = generatedId;

  self._collection.insert.call(self._collection, doc);
}; // Simulate a mongo `update` operation while validating that the access
// control rules set by calls to `allow/deny` are satisfied. If all
// pass, rewrite the mongo operation to use $in to set the list of
// document ids to change ##ValidatedChange


CollectionPrototype._validatedUpdate = function (userId, selector, mutator, options) {
  const self = this;
  check(mutator, Object);
  options = Object.assign(Object.create(null), options);
  if (!LocalCollection._selectorIsIdPerhapsAsObject(selector)) throw new Error("validated update should be of a single ID"); // We don't support upserts because they don't fit nicely into allow/deny
  // rules.

  if (options.upsert) throw new Meteor.Error(403, "Access denied. Upserts not " + "allowed in a restricted collection.");
  const noReplaceError = "Access denied. In a restricted collection you can only" + " update documents, not replace them. Use a Mongo update operator, such " + "as '$set'.";
  const mutatorKeys = Object.keys(mutator); // compute modified fields

  const modifiedFields = {};

  if (mutatorKeys.length === 0) {
    throw new Meteor.Error(403, noReplaceError);
  }

  mutatorKeys.forEach(op => {
    const params = mutator[op];

    if (op.charAt(0) !== '$') {
      throw new Meteor.Error(403, noReplaceError);
    } else if (!hasOwn.call(ALLOWED_UPDATE_OPERATIONS, op)) {
      throw new Meteor.Error(403, "Access denied. Operator " + op + " not allowed in a restricted collection.");
    } else {
      Object.keys(params).forEach(field => {
        // treat dotted fields as if they are replacing their
        // top-level part
        if (field.indexOf('.') !== -1) field = field.substring(0, field.indexOf('.')); // record the field we are trying to change

        modifiedFields[field] = true;
      });
    }
  });
  const fields = Object.keys(modifiedFields);
  const findOptions = {
    transform: null
  };

  if (!self._validators.fetchAllFields) {
    findOptions.fields = {};

    self._validators.fetch.forEach(fieldName => {
      findOptions.fields[fieldName] = 1;
    });
  }

  const doc = self._collection.findOne(selector, findOptions);

  if (!doc) // none satisfied!
    return 0; // call user validators.
  // Any deny returns true means denied.

  if (self._validators.update.deny.some(validator => {
    const factoriedDoc = transformDoc(validator, doc);
    return validator(userId, factoriedDoc, fields, mutator);
  })) {
    throw new Meteor.Error(403, "Access denied");
  } // Any allow returns true means proceed. Throw error if they all fail.


  if (self._validators.update.allow.every(validator => {
    const factoriedDoc = transformDoc(validator, doc);
    return !validator(userId, factoriedDoc, fields, mutator);
  })) {
    throw new Meteor.Error(403, "Access denied");
  }

  options._forbidReplace = true; // Back when we supported arbitrary client-provided selectors, we actually
  // rewrote the selector to include an _id clause before passing to Mongo to
  // avoid races, but since selector is guaranteed to already just be an ID, we
  // don't have to any more.

  return self._collection.update.call(self._collection, selector, mutator, options);
}; // Only allow these operations in validated updates. Specifically
// whitelist operations, rather than blacklist, so new complex
// operations that are added aren't automatically allowed. A complex
// operation is one that does more than just modify its target
// field. For now this contains all update operations except '$rename'.
// http://docs.mongodb.org/manual/reference/operators/#update


const ALLOWED_UPDATE_OPERATIONS = {
  $inc: 1,
  $set: 1,
  $unset: 1,
  $addToSet: 1,
  $pop: 1,
  $pullAll: 1,
  $pull: 1,
  $pushAll: 1,
  $push: 1,
  $bit: 1
}; // Simulate a mongo `remove` operation while validating access control
// rules. See #ValidatedChange

CollectionPrototype._validatedRemove = function (userId, selector) {
  const self = this;
  const findOptions = {
    transform: null
  };

  if (!self._validators.fetchAllFields) {
    findOptions.fields = {};

    self._validators.fetch.forEach(fieldName => {
      findOptions.fields[fieldName] = 1;
    });
  }

  const doc = self._collection.findOne(selector, findOptions);

  if (!doc) return 0; // call user validators.
  // Any deny returns true means denied.

  if (self._validators.remove.deny.some(validator => {
    return validator(userId, transformDoc(validator, doc));
  })) {
    throw new Meteor.Error(403, "Access denied");
  } // Any allow returns true means proceed. Throw error if they all fail.


  if (self._validators.remove.allow.every(validator => {
    return !validator(userId, transformDoc(validator, doc));
  })) {
    throw new Meteor.Error(403, "Access denied");
  } // Back when we supported arbitrary client-provided selectors, we actually
  // rewrote the selector to {_id: {$in: [ids that we found]}} before passing to
  // Mongo to avoid races, but since selector is guaranteed to already just be
  // an ID, we don't have to any more.


  return self._collection.remove.call(self._collection, selector);
};

CollectionPrototype._callMutatorMethod = function _callMutatorMethod(name, args, callback) {
  if (Meteor.isClient && !callback && !alreadyInSimulation()) {
    // Client can't block, so it can't report errors by exception,
    // only by callback. If they forget the callback, give them a
    // default one that logs the error, so they aren't totally
    // baffled if their writes don't work because their database is
    // down.
    // Don't give a default callback in simulation, because inside stubs we
    // want to return the results from the local collection immediately and
    // not force a callback.
    callback = function (err) {
      if (err) Meteor._debug(name + " failed: " + (err.reason || err.stack));
    };
  } // For two out of three mutator methods, the first argument is a selector


  const firstArgIsSelector = name === "update" || name === "remove";

  if (firstArgIsSelector && !alreadyInSimulation()) {
    // If we're about to actually send an RPC, we should throw an error if
    // this is a non-ID selector, because the mutation methods only allow
    // single-ID selectors. (If we don't throw here, we'll see flicker.)
    throwIfSelectorIsNotId(args[0], name);
  }

  const mutatorMethodName = this._prefix + name;
  return this._connection.apply(mutatorMethodName, args, {
    returnStubValue: true
  }, callback);
};

function transformDoc(validator, doc) {
  if (validator.transform) return validator.transform(doc);
  return doc;
}

function docToValidate(validator, doc, generatedId) {
  let ret = doc;

  if (validator.transform) {
    ret = EJSON.clone(doc); // If you set a server-side transform on your collection, then you don't get
    // to tell the difference between "client specified the ID" and "server
    // generated the ID", because transforms expect to get _id.  If you want to
    // do that check, you can do it with a specific
    // `C.allow({insert: f, transform: null})` validator.

    if (generatedId !== null) {
      ret._id = generatedId;
    }

    ret = validator.transform(ret);
  }

  return ret;
}

function addValidator(collection, allowOrDeny, options) {
  // validate keys
  const validKeysRegEx = /^(?:insert|update|remove|fetch|transform)$/;
  Object.keys(options).forEach(key => {
    if (!validKeysRegEx.test(key)) throw new Error(allowOrDeny + ": Invalid key: " + key);
  });
  collection._restricted = true;
  ['insert', 'update', 'remove'].forEach(name => {
    if (hasOwn.call(options, name)) {
      if (!(options[name] instanceof Function)) {
        throw new Error(allowOrDeny + ": Value for `" + name + "` must be a function");
      } // If the transform is specified at all (including as 'null') in this
      // call, then take that; otherwise, take the transform from the
      // collection.


      if (options.transform === undefined) {
        options[name].transform = collection._transform; // already wrapped
      } else {
        options[name].transform = LocalCollection.wrapTransform(options.transform);
      }

      collection._validators[name][allowOrDeny].push(options[name]);
    }
  }); // Only update the fetch fields if we're passed things that affect
  // fetching. This way allow({}) and allow({insert: f}) don't result in
  // setting fetchAllFields

  if (options.update || options.remove || options.fetch) {
    if (options.fetch && !(options.fetch instanceof Array)) {
      throw new Error(allowOrDeny + ": Value for `fetch` must be an array");
    }

    collection._updateFetch(options.fetch);
  }
}

function throwIfSelectorIsNotId(selector, methodName) {
  if (!LocalCollection._selectorIsIdPerhapsAsObject(selector)) {
    throw new Meteor.Error(403, "Not permitted. Untrusted code may only " + methodName + " documents by ID.");
  }
}

; // Determine if we are in a DDP method simulation

function alreadyInSimulation() {
  var CurrentInvocation = DDP._CurrentMethodInvocation || // For backwards compatibility, as explained in this issue:
  // https://github.com/meteor/meteor/issues/8947
  DDP._CurrentInvocation;
  const enclosing = CurrentInvocation.get();
  return enclosing && enclosing.isSimulation;
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/allow-deny/allow-deny.js");

/* Exports */
Package._define("allow-deny", {
  AllowDeny: AllowDeny
});

})();

//# sourceURL=meteor://💻app/packages/allow-deny.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWxsb3ctZGVueS9hbGxvdy1kZW55LmpzIl0sIm5hbWVzIjpbImhhc093biIsIk9iamVjdCIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiQWxsb3dEZW55IiwiQ29sbGVjdGlvblByb3RvdHlwZSIsImFsbG93Iiwib3B0aW9ucyIsImFkZFZhbGlkYXRvciIsImRlbnkiLCJfZGVmaW5lTXV0YXRpb25NZXRob2RzIiwic2VsZiIsIl9yZXN0cmljdGVkIiwiX2luc2VjdXJlIiwidW5kZWZpbmVkIiwiX3ZhbGlkYXRvcnMiLCJpbnNlcnQiLCJ1cGRhdGUiLCJyZW1vdmUiLCJ1cHNlcnQiLCJmZXRjaCIsImZldGNoQWxsRmllbGRzIiwiX25hbWUiLCJfcHJlZml4IiwiX2Nvbm5lY3Rpb24iLCJNZXRlb3IiLCJzZXJ2ZXIiLCJpc0NsaWVudCIsIm0iLCJmb3JFYWNoIiwibWV0aG9kIiwibWV0aG9kTmFtZSIsInVzZUV4aXN0aW5nIiwiaGFuZGxlclByb3BOYW1lIiwiY2hlY2siLCJhcmd1bWVudHMiLCJNYXRjaCIsIkFueSIsImFyZ3MiLCJBcnJheSIsImZyb20iLCJnZW5lcmF0ZWRJZCIsImNhbGwiLCJfbWFrZU5ld0lEIiwiaXNTaW11bGF0aW9uIiwiX2lkIiwiX2NvbGxlY3Rpb24iLCJhcHBseSIsInRocm93SWZTZWxlY3RvcklzTm90SWQiLCJsZW5ndGgiLCJFcnJvciIsInZhbGlkYXRlZE1ldGhvZE5hbWUiLCJjaGFyQXQiLCJ0b1VwcGVyQ2FzZSIsInNsaWNlIiwidW5zaGlmdCIsInVzZXJJZCIsInB1c2giLCJfaXNJbnNlY3VyZSIsImUiLCJuYW1lIiwidG9TdHJpbmciLCJtZXRob2RzIiwiX3VwZGF0ZUZldGNoIiwiZmllbGRzIiwidW5pb24iLCJjcmVhdGUiLCJhZGQiLCJuYW1lcyIsImtleXMiLCJQYWNrYWdlIiwiaW5zZWN1cmUiLCJfdmFsaWRhdGVkSW5zZXJ0IiwiZG9jIiwic29tZSIsInZhbGlkYXRvciIsImRvY1RvVmFsaWRhdGUiLCJldmVyeSIsIl92YWxpZGF0ZWRVcGRhdGUiLCJzZWxlY3RvciIsIm11dGF0b3IiLCJhc3NpZ24iLCJMb2NhbENvbGxlY3Rpb24iLCJfc2VsZWN0b3JJc0lkUGVyaGFwc0FzT2JqZWN0Iiwibm9SZXBsYWNlRXJyb3IiLCJtdXRhdG9yS2V5cyIsIm1vZGlmaWVkRmllbGRzIiwib3AiLCJwYXJhbXMiLCJBTExPV0VEX1VQREFURV9PUEVSQVRJT05TIiwiZmllbGQiLCJpbmRleE9mIiwic3Vic3RyaW5nIiwiZmluZE9wdGlvbnMiLCJ0cmFuc2Zvcm0iLCJmaWVsZE5hbWUiLCJmaW5kT25lIiwiZmFjdG9yaWVkRG9jIiwidHJhbnNmb3JtRG9jIiwiX2ZvcmJpZFJlcGxhY2UiLCIkaW5jIiwiJHNldCIsIiR1bnNldCIsIiRhZGRUb1NldCIsIiRwb3AiLCIkcHVsbEFsbCIsIiRwdWxsIiwiJHB1c2hBbGwiLCIkcHVzaCIsIiRiaXQiLCJfdmFsaWRhdGVkUmVtb3ZlIiwiX2NhbGxNdXRhdG9yTWV0aG9kIiwiY2FsbGJhY2siLCJhbHJlYWR5SW5TaW11bGF0aW9uIiwiZXJyIiwiX2RlYnVnIiwicmVhc29uIiwic3RhY2siLCJmaXJzdEFyZ0lzU2VsZWN0b3IiLCJtdXRhdG9yTWV0aG9kTmFtZSIsInJldHVyblN0dWJWYWx1ZSIsInJldCIsIkVKU09OIiwiY2xvbmUiLCJjb2xsZWN0aW9uIiwiYWxsb3dPckRlbnkiLCJ2YWxpZEtleXNSZWdFeCIsImtleSIsInRlc3QiLCJGdW5jdGlvbiIsIl90cmFuc2Zvcm0iLCJ3cmFwVHJhbnNmb3JtIiwiQ3VycmVudEludm9jYXRpb24iLCJERFAiLCJfQ3VycmVudE1ldGhvZEludm9jYXRpb24iLCJfQ3VycmVudEludm9jYXRpb24iLCJlbmNsb3NpbmciLCJnZXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBRUEsTUFBTUEsTUFBTSxHQUFHQyxNQUFNLENBQUNDLFNB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bGUiOiIvcGFja2FnZXMvYWxsb3ctZGVueS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vL1xuLy8vIFJlbW90ZSBtZXRob2RzIGFuZCBhY2Nlc3MgY29udHJvbC5cbi8vL1xuXG5jb25zdCBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vLyBSZXN0cmljdCBkZWZhdWx0IG11dGF0b3JzIG9uIGNvbGxlY3Rpb24uIGFsbG93KCkgYW5kIGRlbnkoKSB0YWtlIHRoZVxuLy8gc2FtZSBvcHRpb25zOlxuLy9cbi8vIG9wdGlvbnMuaW5zZXJ0IHtGdW5jdGlvbih1c2VySWQsIGRvYyl9XG4vLyAgIHJldHVybiB0cnVlIHRvIGFsbG93L2RlbnkgYWRkaW5nIHRoaXMgZG9jdW1lbnRcbi8vXG4vLyBvcHRpb25zLnVwZGF0ZSB7RnVuY3Rpb24odXNlcklkLCBkb2NzLCBmaWVsZHMsIG1vZGlmaWVyKX1cbi8vICAgcmV0dXJuIHRydWUgdG8gYWxsb3cvZGVueSB1cGRhdGluZyB0aGVzZSBkb2N1bWVudHMuXG4vLyAgIGBmaWVsZHNgIGlzIHBhc3NlZCBhcyBhbiBhcnJheSBvZiBmaWVsZHMgdGhhdCBhcmUgdG8gYmUgbW9kaWZpZWRcbi8vXG4vLyBvcHRpb25zLnJlbW92ZSB7RnVuY3Rpb24odXNlcklkLCBkb2NzKX1cbi8vICAgcmV0dXJuIHRydWUgdG8gYWxsb3cvZGVueSByZW1vdmluZyB0aGVzZSBkb2N1bWVudHNcbi8vXG4vLyBvcHRpb25zLmZldGNoIHtBcnJheX1cbi8vICAgRmllbGRzIHRvIGZldGNoIGZvciB0aGVzZSB2YWxpZGF0b3JzLiBJZiBhbnkgY2FsbCB0byBhbGxvdyBvciBkZW55XG4vLyAgIGRvZXMgbm90IGhhdmUgdGhpcyBvcHRpb24gdGhlbiBhbGwgZmllbGRzIGFyZSBsb2FkZWQuXG4vL1xuLy8gYWxsb3cgYW5kIGRlbnkgY2FuIGJlIGNhbGxlZCBtdWx0aXBsZSB0aW1lcy4gVGhlIHZhbGlkYXRvcnMgYXJlXG4vLyBldmFsdWF0ZWQgYXMgZm9sbG93czpcbi8vIC0gSWYgbmVpdGhlciBkZW55KCkgbm9yIGFsbG93KCkgaGFzIGJlZW4gY2FsbGVkIG9uIHRoZSBjb2xsZWN0aW9uLFxuLy8gICB0aGVuIHRoZSByZXF1ZXN0IGlzIGFsbG93ZWQgaWYgYW5kIG9ubHkgaWYgdGhlIFwiaW5zZWN1cmVcIiBzbWFydFxuLy8gICBwYWNrYWdlIGlzIGluIHVzZS5cbi8vIC0gT3RoZXJ3aXNlLCBpZiBhbnkgZGVueSgpIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSwgdGhlIHJlcXVlc3QgaXMgZGVuaWVkLlxuLy8gLSBPdGhlcndpc2UsIGlmIGFueSBhbGxvdygpIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSwgdGhlIHJlcXVlc3QgaXMgYWxsb3dlZC5cbi8vIC0gT3RoZXJ3aXNlLCB0aGUgcmVxdWVzdCBpcyBkZW5pZWQuXG4vL1xuLy8gTWV0ZW9yIG1heSBjYWxsIHlvdXIgZGVueSgpIGFuZCBhbGxvdygpIGZ1bmN0aW9ucyBpbiBhbnkgb3JkZXIsIGFuZCBtYXkgbm90XG4vLyBjYWxsIGFsbCBvZiB0aGVtIGlmIGl0IGlzIGFibGUgdG8gbWFrZSBhIGRlY2lzaW9uIHdpdGhvdXQgY2FsbGluZyB0aGVtIGFsbFxuLy8gKHNvIGRvbid0IGluY2x1ZGUgc2lkZSBlZmZlY3RzKS5cblxuQWxsb3dEZW55ID0ge1xuICBDb2xsZWN0aW9uUHJvdG90eXBlOiB7fVxufTtcblxuLy8gSW4gdGhlIGBtb25nb2AgcGFja2FnZSwgd2Ugd2lsbCBleHRlbmQgTW9uZ28uQ29sbGVjdGlvbi5wcm90b3R5cGUgd2l0aCB0aGVzZVxuLy8gbWV0aG9kc1xuY29uc3QgQ29sbGVjdGlvblByb3RvdHlwZSA9IEFsbG93RGVueS5Db2xsZWN0aW9uUHJvdG90eXBlO1xuXG4vKipcbiAqIEBzdW1tYXJ5IEFsbG93IHVzZXJzIHRvIHdyaXRlIGRpcmVjdGx5IHRvIHRoaXMgY29sbGVjdGlvbiBmcm9tIGNsaWVudCBjb2RlLCBzdWJqZWN0IHRvIGxpbWl0YXRpb25zIHlvdSBkZWZpbmUuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAbWV0aG9kIGFsbG93XG4gKiBAbWVtYmVyT2YgTW9uZ28uQ29sbGVjdGlvblxuICogQGluc3RhbmNlXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gb3B0aW9ucy5pbnNlcnQsdXBkYXRlLHJlbW92ZSBGdW5jdGlvbnMgdGhhdCBsb29rIGF0IGEgcHJvcG9zZWQgbW9kaWZpY2F0aW9uIHRvIHRoZSBkYXRhYmFzZSBhbmQgcmV0dXJuIHRydWUgaWYgaXQgc2hvdWxkIGJlIGFsbG93ZWQuXG4gKiBAcGFyYW0ge1N0cmluZ1tdfSBvcHRpb25zLmZldGNoIE9wdGlvbmFsIHBlcmZvcm1hbmNlIGVuaGFuY2VtZW50LiBMaW1pdHMgdGhlIGZpZWxkcyB0aGF0IHdpbGwgYmUgZmV0Y2hlZCBmcm9tIHRoZSBkYXRhYmFzZSBmb3IgaW5zcGVjdGlvbiBieSB5b3VyIGB1cGRhdGVgIGFuZCBgcmVtb3ZlYCBmdW5jdGlvbnMuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBvcHRpb25zLnRyYW5zZm9ybSBPdmVycmlkZXMgYHRyYW5zZm9ybWAgb24gdGhlICBbYENvbGxlY3Rpb25gXSgjY29sbGVjdGlvbnMpLiAgUGFzcyBgbnVsbGAgdG8gZGlzYWJsZSB0cmFuc2Zvcm1hdGlvbi5cbiAqL1xuQ29sbGVjdGlvblByb3RvdHlwZS5hbGxvdyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgYWRkVmFsaWRhdG9yKHRoaXMsICdhbGxvdycsIG9wdGlvbnMpO1xufTtcblxuLyoqXG4gKiBAc3VtbWFyeSBPdmVycmlkZSBgYWxsb3dgIHJ1bGVzLlxuICogQGxvY3VzIFNlcnZlclxuICogQG1ldGhvZCBkZW55XG4gKiBAbWVtYmVyT2YgTW9uZ28uQ29sbGVjdGlvblxuICogQGluc3RhbmNlXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gb3B0aW9ucy5pbnNlcnQsdXBkYXRlLHJlbW92ZSBGdW5jdGlvbnMgdGhhdCBsb29rIGF0IGEgcHJvcG9zZWQgbW9kaWZpY2F0aW9uIHRvIHRoZSBkYXRhYmFzZSBhbmQgcmV0dXJuIHRydWUgaWYgaXQgc2hvdWxkIGJlIGRlbmllZCwgZXZlbiBpZiBhbiBbYWxsb3ddKCNhbGxvdykgcnVsZSBzYXlzIG90aGVyd2lzZS5cbiAqIEBwYXJhbSB7U3RyaW5nW119IG9wdGlvbnMuZmV0Y2ggT3B0aW9uYWwgcGVyZm9ybWFuY2UgZW5oYW5jZW1lbnQuIExpbWl0cyB0aGUgZmllbGRzIHRoYXQgd2lsbCBiZSBmZXRjaGVkIGZyb20gdGhlIGRhdGFiYXNlIGZvciBpbnNwZWN0aW9uIGJ5IHlvdXIgYHVwZGF0ZWAgYW5kIGByZW1vdmVgIGZ1bmN0aW9ucy5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IG9wdGlvbnMudHJhbnNmb3JtIE92ZXJyaWRlcyBgdHJhbnNmb3JtYCBvbiB0aGUgIFtgQ29sbGVjdGlvbmBdKCNjb2xsZWN0aW9ucykuICBQYXNzIGBudWxsYCB0byBkaXNhYmxlIHRyYW5zZm9ybWF0aW9uLlxuICovXG5Db2xsZWN0aW9uUHJvdG90eXBlLmRlbnkgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIGFkZFZhbGlkYXRvcih0aGlzLCAnZGVueScsIG9wdGlvbnMpO1xufTtcblxuQ29sbGVjdGlvblByb3RvdHlwZS5fZGVmaW5lTXV0YXRpb25NZXRob2RzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICBjb25zdCBzZWxmID0gdGhpcztcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgLy8gc2V0IHRvIHRydWUgb25jZSB3ZSBjYWxsIGFueSBhbGxvdyBvciBkZW55IG1ldGhvZHMuIElmIHRydWUsIHVzZVxuICAvLyBhbGxvdy9kZW55IHNlbWFudGljcy4gSWYgZmFsc2UsIHVzZSBpbnNlY3VyZSBtb2RlIHNlbWFudGljcy5cbiAgc2VsZi5fcmVzdHJpY3RlZCA9IGZhbHNlO1xuXG4gIC8vIEluc2VjdXJlIG1vZGUgKGRlZmF1bHQgdG8gYWxsb3dpbmcgd3JpdGVzKS4gRGVmYXVsdHMgdG8gJ3VuZGVmaW5lZCcgd2hpY2hcbiAgLy8gbWVhbnMgaW5zZWN1cmUgaWZmIHRoZSBpbnNlY3VyZSBwYWNrYWdlIGlzIGxvYWRlZC4gVGhpcyBwcm9wZXJ0eSBjYW4gYmVcbiAgLy8gb3ZlcnJpZGVuIGJ5IHRlc3RzIG9yIHBhY2thZ2VzIHdpc2hpbmcgdG8gY2hhbmdlIGluc2VjdXJlIG1vZGUgYmVoYXZpb3Igb2ZcbiAgLy8gdGhlaXIgY29sbGVjdGlvbnMuXG4gIHNlbGYuX2luc2VjdXJlID0gdW5kZWZpbmVkO1xuXG4gIHNlbGYuX3ZhbGlkYXRvcnMgPSB7XG4gICAgaW5zZXJ0OiB7YWxsb3c6IFtdLCBkZW55OiBbXX0sXG4gICAgdXBkYXRlOiB7YWxsb3c6IFtdLCBkZW55OiBbXX0sXG4gICAgcmVtb3ZlOiB7YWxsb3c6IFtdLCBkZW55OiBbXX0sXG4gICAgdXBzZXJ0OiB7YWxsb3c6IFtdLCBkZW55OiBbXX0sIC8vIGR1bW15IGFycmF5czsgY2FuJ3Qgc2V0IHRoZXNlIVxuICAgIGZldGNoOiBbXSxcbiAgICBmZXRjaEFsbEZpZWxkczogZmFsc2VcbiAgfTtcblxuICBpZiAoIXNlbGYuX25hbWUpXG4gICAgcmV0dXJuOyAvLyBhbm9ueW1vdXMgY29sbGVjdGlvblxuXG4gIC8vIFhYWCBUaGluayBhYm91dCBtZXRob2QgbmFtZXNwYWNpbmcuIE1heWJlIG1ldGhvZHMgc2hvdWxkIGJlXG4gIC8vIFwiTWV0ZW9yOk1vbmdvOmluc2VydC9OQU1FXCI/XG4gIHNlbGYuX3ByZWZpeCA9ICcvJyArIHNlbGYuX25hbWUgKyAnLyc7XG5cbiAgLy8gTXV0YXRpb24gTWV0aG9kc1xuICAvLyBNaW5pbW9uZ28gb24gdGhlIHNlcnZlciBnZXRzIG5vIHN0dWJzOyBpbnN0ZWFkLCBieSBkZWZhdWx0XG4gIC8vIGl0IHdhaXQoKXMgdW50aWwgaXRzIHJlc3VsdCBpcyByZWFkeSwgeWllbGRpbmcuXG4gIC8vIFRoaXMgbWF0Y2hlcyB0aGUgYmVoYXZpb3Igb2YgbWFjcm9tb25nbyBvbiB0aGUgc2VydmVyIGJldHRlci5cbiAgLy8gWFhYIHNlZSAjTWV0ZW9yU2VydmVyTnVsbFxuICBpZiAoc2VsZi5fY29ubmVjdGlvbiAmJiAoc2VsZi5fY29ubmVjdGlvbiA9PT0gTWV0ZW9yLnNlcnZlciB8fCBNZXRlb3IuaXNDbGllbnQpKSB7XG4gICAgY29uc3QgbSA9IHt9O1xuXG4gICAgWydpbnNlcnQnLCAndXBkYXRlJywgJ3JlbW92ZSddLmZvckVhY2goKG1ldGhvZCkgPT4ge1xuICAgICAgY29uc3QgbWV0aG9kTmFtZSA9IHNlbGYuX3ByZWZpeCArIG1ldGhvZDtcblxuICAgICAgaWYgKG9wdGlvbnMudXNlRXhpc3RpbmcpIHtcbiAgICAgICAgY29uc3QgaGFuZGxlclByb3BOYW1lID0gTWV0ZW9yLmlzQ2xpZW50ID8gJ19tZXRob2RIYW5kbGVycycgOiAnbWV0aG9kX2hhbmRsZXJzJztcbiAgICAgICAgLy8gRG8gbm90IHRyeSB0byBjcmVhdGUgYWRkaXRpb25hbCBtZXRob2RzIGlmIHRoaXMgaGFzIGFscmVhZHkgYmVlbiBjYWxsZWQuXG4gICAgICAgIC8vIChPdGhlcndpc2UgdGhlIC5tZXRob2RzKCkgY2FsbCBiZWxvdyB3aWxsIHRocm93IGFuIGVycm9yLilcbiAgICAgICAgaWYgKHNlbGYuX2Nvbm5lY3Rpb25baGFuZGxlclByb3BOYW1lXSAmJlxuICAgICAgICAgIHR5cGVvZiBzZWxmLl9jb25uZWN0aW9uW2hhbmRsZXJQcm9wTmFtZV1bbWV0aG9kTmFtZV0gPT09ICdmdW5jdGlvbicpIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgbVttZXRob2ROYW1lXSA9IGZ1bmN0aW9uICgvKiAuLi4gKi8pIHtcbiAgICAgICAgLy8gQWxsIHRoZSBtZXRob2RzIGRvIHRoZWlyIG93biB2YWxpZGF0aW9uLCBpbnN0ZWFkIG9mIHVzaW5nIGNoZWNrKCkuXG4gICAgICAgIGNoZWNrKGFyZ3VtZW50cywgW01hdGNoLkFueV0pO1xuICAgICAgICBjb25zdCBhcmdzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIEZvciBhbiBpbnNlcnQsIGlmIHRoZSBjbGllbnQgZGlkbid0IHNwZWNpZnkgYW4gX2lkLCBnZW5lcmF0ZSBvbmVcbiAgICAgICAgICAvLyBub3c7IGJlY2F1c2UgdGhpcyB1c2VzIEREUC5yYW5kb21TdHJlYW0sIGl0IHdpbGwgYmUgY29uc2lzdGVudCB3aXRoXG4gICAgICAgICAgLy8gd2hhdCB0aGUgY2xpZW50IGdlbmVyYXRlZC4gV2UgZ2VuZXJhdGUgaXQgbm93IHJhdGhlciB0aGFuIGxhdGVyIHNvXG4gICAgICAgICAgLy8gdGhhdCBpZiAoZWcpIGFuIGFsbG93L2RlbnkgcnVsZSBkb2VzIGFuIGluc2VydCB0byB0aGUgc2FtZVxuICAgICAgICAgIC8vIGNvbGxlY3Rpb24gKG5vdCB0aGF0IGl0IHJlYWxseSBzaG91bGQpLCB0aGUgZ2VuZXJhdGVkIF9pZCB3aWxsXG4gICAgICAgICAgLy8gc3RpbGwgYmUgdGhlIGZpcnN0IHVzZSBvZiB0aGUgc3RyZWFtIGFuZCB3aWxsIGJlIGNvbnNpc3RlbnQuXG4gICAgICAgICAgLy9cbiAgICAgICAgICAvLyBIb3dldmVyLCB3ZSBkb24ndCBhY3R1YWxseSBzdGljayB0aGUgX2lkIG9udG8gdGhlIGRvY3VtZW50IHlldCxcbiAgICAgICAgICAvLyBiZWNhdXNlIHdlIHdhbnQgYWxsb3cvZGVueSBydWxlcyB0byBiZSBhYmxlIHRvIGRpZmZlcmVudGlhdGVcbiAgICAgICAgICAvLyBiZXR3ZWVuIGFyYml0cmFyeSBjbGllbnQtc3BlY2lmaWVkIF9pZCBmaWVsZHMgYW5kIG1lcmVseVxuICAgICAgICAgIC8vIGNsaWVudC1jb250cm9sbGVkLXZpYS1yYW5kb21TZWVkIGZpZWxkcy5cbiAgICAgICAgICBsZXQgZ2VuZXJhdGVkSWQgPSBudWxsO1xuICAgICAgICAgIGlmIChtZXRob2QgPT09IFwiaW5zZXJ0XCIgJiYgIWhhc093bi5jYWxsKGFyZ3NbMF0sICdfaWQnKSkge1xuICAgICAgICAgICAgZ2VuZXJhdGVkSWQgPSBzZWxmLl9tYWtlTmV3SUQoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodGhpcy5pc1NpbXVsYXRpb24pIHtcbiAgICAgICAgICAgIC8vIEluIGEgY2xpZW50IHNpbXVsYXRpb24sIHlvdSBjYW4gZG8gYW55IG11dGF0aW9uIChldmVuIHdpdGggYVxuICAgICAgICAgICAgLy8gY29tcGxleCBzZWxlY3RvcikuXG4gICAgICAgICAgICBpZiAoZ2VuZXJhdGVkSWQgIT09IG51bGwpXG4gICAgICAgICAgICAgIGFyZ3NbMF0uX2lkID0gZ2VuZXJhdGVkSWQ7XG4gICAgICAgICAgICByZXR1cm4gc2VsZi5fY29sbGVjdGlvblttZXRob2RdLmFwcGx5KFxuICAgICAgICAgICAgICBzZWxmLl9jb2xsZWN0aW9uLCBhcmdzKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBzZXJ2ZXIgcmVjZWl2aW5nIGEgbWV0aG9kIGNhbGwgZnJvbSB0aGUgY2xpZW50LlxuXG4gICAgICAgICAgLy8gV2UgZG9uJ3QgYWxsb3cgYXJiaXRyYXJ5IHNlbGVjdG9ycyBpbiBtdXRhdGlvbnMgZnJvbSB0aGUgY2xpZW50OiBvbmx5XG4gICAgICAgICAgLy8gc2luZ2xlLUlEIHNlbGVjdG9ycy5cbiAgICAgICAgICBpZiAobWV0aG9kICE9PSAnaW5zZXJ0JylcbiAgICAgICAgICAgIHRocm93SWZTZWxlY3RvcklzTm90SWQoYXJnc1swXSwgbWV0aG9kKTtcblxuICAgICAgICAgIGlmIChzZWxmLl9yZXN0cmljdGVkKSB7XG4gICAgICAgICAgICAvLyBzaG9ydCBjaXJjdWl0IGlmIHRoZXJlIGlzIG5vIHdheSBpdCB3aWxsIHBhc3MuXG4gICAgICAgICAgICBpZiAoc2VsZi5fdmFsaWRhdG9yc1ttZXRob2RdLmFsbG93Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFxuICAgICAgICAgICAgICAgIDQwMywgXCJBY2Nlc3MgZGVuaWVkLiBObyBhbGxvdyB2YWxpZGF0b3JzIHNldCBvbiByZXN0cmljdGVkIFwiICtcbiAgICAgICAgICAgICAgICAgIFwiY29sbGVjdGlvbiBmb3IgbWV0aG9kICdcIiArIG1ldGhvZCArIFwiJy5cIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHZhbGlkYXRlZE1ldGhvZE5hbWUgPVxuICAgICAgICAgICAgICAgICAgJ192YWxpZGF0ZWQnICsgbWV0aG9kLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgbWV0aG9kLnNsaWNlKDEpO1xuICAgICAgICAgICAgYXJncy51bnNoaWZ0KHRoaXMudXNlcklkKTtcbiAgICAgICAgICAgIG1ldGhvZCA9PT0gJ2luc2VydCcgJiYgYXJncy5wdXNoKGdlbmVyYXRlZElkKTtcbiAgICAgICAgICAgIHJldHVybiBzZWxmW3ZhbGlkYXRlZE1ldGhvZE5hbWVdLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc2VsZi5faXNJbnNlY3VyZSgpKSB7XG4gICAgICAgICAgICBpZiAoZ2VuZXJhdGVkSWQgIT09IG51bGwpXG4gICAgICAgICAgICAgIGFyZ3NbMF0uX2lkID0gZ2VuZXJhdGVkSWQ7XG4gICAgICAgICAgICAvLyBJbiBpbnNlY3VyZSBtb2RlLCBhbGxvdyBhbnkgbXV0YXRpb24gKHdpdGggYSBzaW1wbGUgc2VsZWN0b3IpLlxuICAgICAgICAgICAgLy8gWFhYIFRoaXMgaXMga2luZCBvZiBib2d1cy4gIEluc3RlYWQgb2YgYmxpbmRseSBwYXNzaW5nIHdoYXRldmVyXG4gICAgICAgICAgICAvLyAgICAgd2UgZ2V0IGZyb20gdGhlIG5ldHdvcmsgdG8gdGhpcyBmdW5jdGlvbiwgd2Ugc2hvdWxkIGFjdHVhbGx5XG4gICAgICAgICAgICAvLyAgICAga25vdyB0aGUgY29ycmVjdCBhcmd1bWVudHMgZm9yIHRoZSBmdW5jdGlvbiBhbmQgcGFzcyBqdXN0XG4gICAgICAgICAgICAvLyAgICAgdGhlbS4gIEZvciBleGFtcGxlLCBpZiB5b3UgaGF2ZSBhbiBleHRyYW5lb3VzIGV4dHJhIG51bGxcbiAgICAgICAgICAgIC8vICAgICBhcmd1bWVudCBhbmQgdGhpcyBpcyBNb25nbyBvbiB0aGUgc2VydmVyLCB0aGUgLndyYXBBc3luYydkXG4gICAgICAgICAgICAvLyAgICAgZnVuY3Rpb25zIGxpa2UgdXBkYXRlIHdpbGwgZ2V0IGNvbmZ1c2VkIGFuZCBwYXNzIHRoZVxuICAgICAgICAgICAgLy8gICAgIFwiZnV0LnJlc29sdmVyKClcIiBpbiB0aGUgd3Jvbmcgc2xvdCwgd2hlcmUgX3VwZGF0ZSB3aWxsIG5ldmVyXG4gICAgICAgICAgICAvLyAgICAgaW52b2tlIGl0LiBCYW0sIGJyb2tlbiBERFAgY29ubmVjdGlvbi4gIFByb2JhYmx5IHNob3VsZCBqdXN0XG4gICAgICAgICAgICAvLyAgICAgdGFrZSB0aGlzIHdob2xlIG1ldGhvZCBhbmQgd3JpdGUgaXQgdGhyZWUgdGltZXMsIGludm9raW5nXG4gICAgICAgICAgICAvLyAgICAgaGVscGVycyBmb3IgdGhlIGNvbW1vbiBjb2RlLlxuICAgICAgICAgICAgcmV0dXJuIHNlbGYuX2NvbGxlY3Rpb25bbWV0aG9kXS5hcHBseShzZWxmLl9jb2xsZWN0aW9uLCBhcmdzKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gSW4gc2VjdXJlIG1vZGUsIGlmIHdlIGhhdmVuJ3QgY2FsbGVkIGFsbG93IG9yIGRlbnksIHRoZW4gbm90aGluZ1xuICAgICAgICAgICAgLy8gaXMgcGVybWl0dGVkLlxuICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiQWNjZXNzIGRlbmllZFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBpZiAoZS5uYW1lID09PSAnTW9uZ29FcnJvcicgfHwgZS5uYW1lID09PSAnTWluaW1vbmdvRXJyb3InKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwOSwgZS50b1N0cmluZygpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBzZWxmLl9jb25uZWN0aW9uLm1ldGhvZHMobSk7XG4gIH1cbn07XG5cbkNvbGxlY3Rpb25Qcm90b3R5cGUuX3VwZGF0ZUZldGNoID0gZnVuY3Rpb24gKGZpZWxkcykge1xuICBjb25zdCBzZWxmID0gdGhpcztcblxuICBpZiAoIXNlbGYuX3ZhbGlkYXRvcnMuZmV0Y2hBbGxGaWVsZHMpIHtcbiAgICBpZiAoZmllbGRzKSB7XG4gICAgICBjb25zdCB1bmlvbiA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICBjb25zdCBhZGQgPSBuYW1lcyA9PiBuYW1lcyAmJiBuYW1lcy5mb3JFYWNoKG5hbWUgPT4gdW5pb25bbmFtZV0gPSAxKTtcbiAgICAgIGFkZChzZWxmLl92YWxpZGF0b3JzLmZldGNoKTtcbiAgICAgIGFkZChmaWVsZHMpO1xuICAgICAgc2VsZi5fdmFsaWRhdG9ycy5mZXRjaCA9IE9iamVjdC5rZXlzKHVuaW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZi5fdmFsaWRhdG9ycy5mZXRjaEFsbEZpZWxkcyA9IHRydWU7XG4gICAgICAvLyBjbGVhciBmZXRjaCBqdXN0IHRvIG1ha2Ugc3VyZSB3ZSBkb24ndCBhY2NpZGVudGFsbHkgcmVhZCBpdFxuICAgICAgc2VsZi5fdmFsaWRhdG9ycy5mZXRjaCA9IG51bGw7XG4gICAgfVxuICB9XG59O1xuXG5Db2xsZWN0aW9uUHJvdG90eXBlLl9pc0luc2VjdXJlID0gZnVuY3Rpb24gKCkge1xuICBjb25zdCBzZWxmID0gdGhpcztcbiAgaWYgKHNlbGYuX2luc2VjdXJlID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuICEhUGFja2FnZS5pbnNlY3VyZTtcbiAgcmV0dXJuIHNlbGYuX2luc2VjdXJlO1xufTtcblxuQ29sbGVjdGlvblByb3RvdHlwZS5fdmFsaWRhdGVkSW5zZXJ0ID0gZnVuY3Rpb24gKHVzZXJJZCwgZG9jLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVkSWQpIHtcbiAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgLy8gY2FsbCB1c2VyIHZhbGlkYXRvcnMuXG4gIC8vIEFueSBkZW55IHJldHVybnMgdHJ1ZSBtZWFucyBkZW5pZWQuXG4gIGlmIChzZWxmLl92YWxpZGF0b3JzLmluc2VydC5kZW55LnNvbWUoKHZhbGlkYXRvcikgPT4ge1xuICAgIHJldHVybiB2YWxpZGF0b3IodXNlcklkLCBkb2NUb1ZhbGlkYXRlKHZhbGlkYXRvciwgZG9jLCBnZW5lcmF0ZWRJZCkpO1xuICB9KSkge1xuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIkFjY2VzcyBkZW5pZWRcIik7XG4gIH1cbiAgLy8gQW55IGFsbG93IHJldHVybnMgdHJ1ZSBtZWFucyBwcm9jZWVkLiBUaHJvdyBlcnJvciBpZiB0aGV5IGFsbCBmYWlsLlxuICBpZiAoc2VsZi5fdmFsaWRhdG9ycy5pbnNlcnQuYWxsb3cuZXZlcnkoKHZhbGlkYXRvcikgPT4ge1xuICAgIHJldHVybiAhdmFsaWRhdG9yKHVzZXJJZCwgZG9jVG9WYWxpZGF0ZSh2YWxpZGF0b3IsIGRvYywgZ2VuZXJhdGVkSWQpKTtcbiAgfSkpIHtcbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJBY2Nlc3MgZGVuaWVkXCIpO1xuICB9XG5cbiAgLy8gSWYgd2UgZ2VuZXJhdGVkIGFuIElEIGFib3ZlLCBpbnNlcnQgaXQgbm93OiBhZnRlciB0aGUgdmFsaWRhdGlvbiwgYnV0XG4gIC8vIGJlZm9yZSBhY3R1YWxseSBpbnNlcnRpbmcuXG4gIGlmIChnZW5lcmF0ZWRJZCAhPT0gbnVsbClcbiAgICBkb2MuX2lkID0gZ2VuZXJhdGVkSWQ7XG5cbiAgc2VsZi5fY29sbGVjdGlvbi5pbnNlcnQuY2FsbChzZWxmLl9jb2xsZWN0aW9uLCBkb2MpO1xufTtcblxuLy8gU2ltdWxhdGUgYSBtb25nbyBgdXBkYXRlYCBvcGVyYXRpb24gd2hpbGUgdmFsaWRhdGluZyB0aGF0IHRoZSBhY2Nlc3Ncbi8vIGNvbnRyb2wgcnVsZXMgc2V0IGJ5IGNhbGxzIHRvIGBhbGxvdy9kZW55YCBhcmUgc2F0aXNmaWVkLiBJZiBhbGxcbi8vIHBhc3MsIHJld3JpdGUgdGhlIG1vbmdvIG9wZXJhdGlvbiB0byB1c2UgJGluIHRvIHNldCB0aGUgbGlzdCBvZlxuLy8gZG9jdW1lbnQgaWRzIHRvIGNoYW5nZSAjI1ZhbGlkYXRlZENoYW5nZVxuQ29sbGVjdGlvblByb3RvdHlwZS5fdmFsaWRhdGVkVXBkYXRlID0gZnVuY3Rpb24oXG4gICAgdXNlcklkLCBzZWxlY3RvciwgbXV0YXRvciwgb3B0aW9ucykge1xuICBjb25zdCBzZWxmID0gdGhpcztcblxuICBjaGVjayhtdXRhdG9yLCBPYmplY3QpO1xuXG4gIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKE9iamVjdC5jcmVhdGUobnVsbCksIG9wdGlvbnMpO1xuXG4gIGlmICghTG9jYWxDb2xsZWN0aW9uLl9zZWxlY3RvcklzSWRQZXJoYXBzQXNPYmplY3Qoc2VsZWN0b3IpKVxuICAgIHRocm93IG5ldyBFcnJvcihcInZhbGlkYXRlZCB1cGRhdGUgc2hvdWxkIGJlIG9mIGEgc2luZ2xlIElEXCIpO1xuXG4gIC8vIFdlIGRvbid0IHN1cHBvcnQgdXBzZXJ0cyBiZWNhdXNlIHRoZXkgZG9uJ3QgZml0IG5pY2VseSBpbnRvIGFsbG93L2RlbnlcbiAgLy8gcnVsZXMuXG4gIGlmIChvcHRpb25zLnVwc2VydClcbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJBY2Nlc3MgZGVuaWVkLiBVcHNlcnRzIG5vdCBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBcImFsbG93ZWQgaW4gYSByZXN0cmljdGVkIGNvbGxlY3Rpb24uXCIpO1xuXG4gIGNvbnN0IG5vUmVwbGFjZUVycm9yID0gXCJBY2Nlc3MgZGVuaWVkLiBJbiBhIHJlc3RyaWN0ZWQgY29sbGVjdGlvbiB5b3UgY2FuIG9ubHlcIiArXG4gICAgICAgIFwiIHVwZGF0ZSBkb2N1bWVudHMsIG5vdCByZXBsYWNlIHRoZW0uIFVzZSBhIE1vbmdvIHVwZGF0ZSBvcGVyYXRvciwgc3VjaCBcIiArXG4gICAgICAgIFwiYXMgJyRzZXQnLlwiO1xuXG4gIGNvbnN0IG11dGF0b3JLZXlzID0gT2JqZWN0LmtleXMobXV0YXRvcik7XG5cbiAgLy8gY29tcHV0ZSBtb2RpZmllZCBmaWVsZHNcbiAgY29uc3QgbW9kaWZpZWRGaWVsZHMgPSB7fTtcblxuICBpZiAobXV0YXRvcktleXMubGVuZ3RoID09PSAwKSB7XG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIG5vUmVwbGFjZUVycm9yKTtcbiAgfVxuICBtdXRhdG9yS2V5cy5mb3JFYWNoKChvcCkgPT4ge1xuICAgIGNvbnN0IHBhcmFtcyA9IG11dGF0b3Jbb3BdO1xuICAgIGlmIChvcC5jaGFyQXQoMCkgIT09ICckJykge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIG5vUmVwbGFjZUVycm9yKTtcbiAgICB9IGVsc2UgaWYgKCFoYXNPd24uY2FsbChBTExPV0VEX1VQREFURV9PUEVSQVRJT05TLCBvcCkpIHtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXG4gICAgICAgIDQwMywgXCJBY2Nlc3MgZGVuaWVkLiBPcGVyYXRvciBcIiArIG9wICsgXCIgbm90IGFsbG93ZWQgaW4gYSByZXN0cmljdGVkIGNvbGxlY3Rpb24uXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBPYmplY3Qua2V5cyhwYXJhbXMpLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgIC8vIHRyZWF0IGRvdHRlZCBmaWVsZHMgYXMgaWYgdGhleSBhcmUgcmVwbGFjaW5nIHRoZWlyXG4gICAgICAgIC8vIHRvcC1sZXZlbCBwYXJ0XG4gICAgICAgIGlmIChmaWVsZC5pbmRleE9mKCcuJykgIT09IC0xKVxuICAgICAgICAgIGZpZWxkID0gZmllbGQuc3Vic3RyaW5nKDAsIGZpZWxkLmluZGV4T2YoJy4nKSk7XG5cbiAgICAgICAgLy8gcmVjb3JkIHRoZSBmaWVsZCB3ZSBhcmUgdHJ5aW5nIHRvIGNoYW5nZVxuICAgICAgICBtb2RpZmllZEZpZWxkc1tmaWVsZF0gPSB0cnVlO1xuICAgICAgfSk7XG4gICAgfVxuICB9KTtcblxuICBjb25zdCBmaWVsZHMgPSBPYmplY3Qua2V5cyhtb2RpZmllZEZpZWxkcyk7XG5cbiAgY29uc3QgZmluZE9wdGlvbnMgPSB7dHJhbnNmb3JtOiBudWxsfTtcbiAgaWYgKCFzZWxmLl92YWxpZGF0b3JzLmZldGNoQWxsRmllbGRzKSB7XG4gICAgZmluZE9wdGlvbnMuZmllbGRzID0ge307XG4gICAgc2VsZi5fdmFsaWRhdG9ycy5mZXRjaC5mb3JFYWNoKChmaWVsZE5hbWUpID0+IHtcbiAgICAgIGZpbmRPcHRpb25zLmZpZWxkc1tmaWVsZE5hbWVdID0gMTtcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IGRvYyA9IHNlbGYuX2NvbGxlY3Rpb24uZmluZE9uZShzZWxlY3RvciwgZmluZE9wdGlvbnMpO1xuICBpZiAoIWRvYykgIC8vIG5vbmUgc2F0aXNmaWVkIVxuICAgIHJldHVybiAwO1xuXG4gIC8vIGNhbGwgdXNlciB2YWxpZGF0b3JzLlxuICAvLyBBbnkgZGVueSByZXR1cm5zIHRydWUgbWVhbnMgZGVuaWVkLlxuICBpZiAoc2VsZi5fdmFsaWRhdG9ycy51cGRhdGUuZGVueS5zb21lKCh2YWxpZGF0b3IpID0+IHtcbiAgICBjb25zdCBmYWN0b3JpZWREb2MgPSB0cmFuc2Zvcm1Eb2ModmFsaWRhdG9yLCBkb2MpO1xuICAgIHJldHVybiB2YWxpZGF0b3IodXNlcklkLFxuICAgICAgICAgICAgICAgICAgICAgZmFjdG9yaWVkRG9jLFxuICAgICAgICAgICAgICAgICAgICAgZmllbGRzLFxuICAgICAgICAgICAgICAgICAgICAgbXV0YXRvcik7XG4gIH0pKSB7XG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiQWNjZXNzIGRlbmllZFwiKTtcbiAgfVxuICAvLyBBbnkgYWxsb3cgcmV0dXJucyB0cnVlIG1lYW5zIHByb2NlZWQuIFRocm93IGVycm9yIGlmIHRoZXkgYWxsIGZhaWwuXG4gIGlmIChzZWxmLl92YWxpZGF0b3JzLnVwZGF0ZS5hbGxvdy5ldmVyeSgodmFsaWRhdG9yKSA9PiB7XG4gICAgY29uc3QgZmFjdG9yaWVkRG9jID0gdHJhbnNmb3JtRG9jKHZhbGlkYXRvciwgZG9jKTtcbiAgICByZXR1cm4gIXZhbGlkYXRvcih1c2VySWQsXG4gICAgICAgICAgICAgICAgICAgICAgZmFjdG9yaWVkRG9jLFxuICAgICAgICAgICAgICAgICAgICAgIGZpZWxkcyxcbiAgICAgICAgICAgICAgICAgICAgICBtdXRhdG9yKTtcbiAgfSkpIHtcbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJBY2Nlc3MgZGVuaWVkXCIpO1xuICB9XG5cbiAgb3B0aW9ucy5fZm9yYmlkUmVwbGFjZSA9IHRydWU7XG5cbiAgLy8gQmFjayB3aGVuIHdlIHN1cHBvcnRlZCBhcmJpdHJhcnkgY2xpZW50LXByb3ZpZGVkIHNlbGVjdG9ycywgd2UgYWN0dWFsbHlcbiAgLy8gcmV3cm90ZSB0aGUgc2VsZWN0b3IgdG8gaW5jbHVkZSBhbiBfaWQgY2xhdXNlIGJlZm9yZSBwYXNzaW5nIHRvIE1vbmdvIHRvXG4gIC8vIGF2b2lkIHJhY2VzLCBidXQgc2luY2Ugc2VsZWN0b3IgaXMgZ3VhcmFudGVlZCB0byBhbHJlYWR5IGp1c3QgYmUgYW4gSUQsIHdlXG4gIC8vIGRvbid0IGhhdmUgdG8gYW55IG1vcmUuXG5cbiAgcmV0dXJuIHNlbGYuX2NvbGxlY3Rpb24udXBkYXRlLmNhbGwoXG4gICAgc2VsZi5fY29sbGVjdGlvbiwgc2VsZWN0b3IsIG11dGF0b3IsIG9wdGlvbnMpO1xufTtcblxuLy8gT25seSBhbGxvdyB0aGVzZSBvcGVyYXRpb25zIGluIHZhbGlkYXRlZCB1cGRhdGVzLiBTcGVjaWZpY2FsbHlcbi8vIHdoaXRlbGlzdCBvcGVyYXRpb25zLCByYXRoZXIgdGhhbiBibGFja2xpc3QsIHNvIG5ldyBjb21wbGV4XG4vLyBvcGVyYXRpb25zIHRoYXQgYXJlIGFkZGVkIGFyZW4ndCBhdXRvbWF0aWNhbGx5IGFsbG93ZWQuIEEgY29tcGxleFxuLy8gb3BlcmF0aW9uIGlzIG9uZSB0aGF0IGRvZXMgbW9yZSB0aGFuIGp1c3QgbW9kaWZ5IGl0cyB0YXJnZXRcbi8vIGZpZWxkLiBGb3Igbm93IHRoaXMgY29udGFpbnMgYWxsIHVwZGF0ZSBvcGVyYXRpb25zIGV4Y2VwdCAnJHJlbmFtZScuXG4vLyBodHRwOi8vZG9jcy5tb25nb2RiLm9yZy9tYW51YWwvcmVmZXJlbmNlL29wZXJhdG9ycy8jdXBkYXRlXG5jb25zdCBBTExPV0VEX1VQREFURV9PUEVSQVRJT05TID0ge1xuICAkaW5jOjEsICRzZXQ6MSwgJHVuc2V0OjEsICRhZGRUb1NldDoxLCAkcG9wOjEsICRwdWxsQWxsOjEsICRwdWxsOjEsXG4gICRwdXNoQWxsOjEsICRwdXNoOjEsICRiaXQ6MVxufTtcblxuLy8gU2ltdWxhdGUgYSBtb25nbyBgcmVtb3ZlYCBvcGVyYXRpb24gd2hpbGUgdmFsaWRhdGluZyBhY2Nlc3MgY29udHJvbFxuLy8gcnVsZXMuIFNlZSAjVmFsaWRhdGVkQ2hhbmdlXG5Db2xsZWN0aW9uUHJvdG90eXBlLl92YWxpZGF0ZWRSZW1vdmUgPSBmdW5jdGlvbih1c2VySWQsIHNlbGVjdG9yKSB7XG4gIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gIGNvbnN0IGZpbmRPcHRpb25zID0ge3RyYW5zZm9ybTogbnVsbH07XG4gIGlmICghc2VsZi5fdmFsaWRhdG9ycy5mZXRjaEFsbEZpZWxkcykge1xuICAgIGZpbmRPcHRpb25zLmZpZWxkcyA9IHt9O1xuICAgIHNlbGYuX3ZhbGlkYXRvcnMuZmV0Y2guZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgICBmaW5kT3B0aW9ucy5maWVsZHNbZmllbGROYW1lXSA9IDE7XG4gICAgfSk7XG4gIH1cblxuICBjb25zdCBkb2MgPSBzZWxmLl9jb2xsZWN0aW9uLmZpbmRPbmUoc2VsZWN0b3IsIGZpbmRPcHRpb25zKTtcbiAgaWYgKCFkb2MpXG4gICAgcmV0dXJuIDA7XG5cbiAgLy8gY2FsbCB1c2VyIHZhbGlkYXRvcnMuXG4gIC8vIEFueSBkZW55IHJldHVybnMgdHJ1ZSBtZWFucyBkZW5pZWQuXG4gIGlmIChzZWxmLl92YWxpZGF0b3JzLnJlbW92ZS5kZW55LnNvbWUoKHZhbGlkYXRvcikgPT4ge1xuICAgIHJldHVybiB2YWxpZGF0b3IodXNlcklkLCB0cmFuc2Zvcm1Eb2ModmFsaWRhdG9yLCBkb2MpKTtcbiAgfSkpIHtcbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJBY2Nlc3MgZGVuaWVkXCIpO1xuICB9XG4gIC8vIEFueSBhbGxvdyByZXR1cm5zIHRydWUgbWVhbnMgcHJvY2VlZC4gVGhyb3cgZXJyb3IgaWYgdGhleSBhbGwgZmFpbC5cbiAgaWYgKHNlbGYuX3ZhbGlkYXRvcnMucmVtb3ZlLmFsbG93LmV2ZXJ5KCh2YWxpZGF0b3IpID0+IHtcbiAgICByZXR1cm4gIXZhbGlkYXRvcih1c2VySWQsIHRyYW5zZm9ybURvYyh2YWxpZGF0b3IsIGRvYykpO1xuICB9KSkge1xuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIkFjY2VzcyBkZW5pZWRcIik7XG4gIH1cblxuICAvLyBCYWNrIHdoZW4gd2Ugc3VwcG9ydGVkIGFyYml0cmFyeSBjbGllbnQtcHJvdmlkZWQgc2VsZWN0b3JzLCB3ZSBhY3R1YWxseVxuICAvLyByZXdyb3RlIHRoZSBzZWxlY3RvciB0byB7X2lkOiB7JGluOiBbaWRzIHRoYXQgd2UgZm91bmRdfX0gYmVmb3JlIHBhc3NpbmcgdG9cbiAgLy8gTW9uZ28gdG8gYXZvaWQgcmFjZXMsIGJ1dCBzaW5jZSBzZWxlY3RvciBpcyBndWFyYW50ZWVkIHRvIGFscmVhZHkganVzdCBiZVxuICAvLyBhbiBJRCwgd2UgZG9uJ3QgaGF2ZSB0byBhbnkgbW9yZS5cblxuICByZXR1cm4gc2VsZi5fY29sbGVjdGlvbi5yZW1vdmUuY2FsbChzZWxmLl9jb2xsZWN0aW9uLCBzZWxlY3Rvcik7XG59O1xuXG5Db2xsZWN0aW9uUHJvdG90eXBlLl9jYWxsTXV0YXRvck1ldGhvZCA9IGZ1bmN0aW9uIF9jYWxsTXV0YXRvck1ldGhvZChuYW1lLCBhcmdzLCBjYWxsYmFjaykge1xuICBpZiAoTWV0ZW9yLmlzQ2xpZW50ICYmICFjYWxsYmFjayAmJiAhYWxyZWFkeUluU2ltdWxhdGlvbigpKSB7XG4gICAgLy8gQ2xpZW50IGNhbid0IGJsb2NrLCBzbyBpdCBjYW4ndCByZXBvcnQgZXJyb3JzIGJ5IGV4Y2VwdGlvbixcbiAgICAvLyBvbmx5IGJ5IGNhbGxiYWNrLiBJZiB0aGV5IGZvcmdldCB0aGUgY2FsbGJhY2ssIGdpdmUgdGhlbSBhXG4gICAgLy8gZGVmYXVsdCBvbmUgdGhhdCBsb2dzIHRoZSBlcnJvciwgc28gdGhleSBhcmVuJ3QgdG90YWxseVxuICAgIC8vIGJhZmZsZWQgaWYgdGhlaXIgd3JpdGVzIGRvbid0IHdvcmsgYmVjYXVzZSB0aGVpciBkYXRhYmFzZSBpc1xuICAgIC8vIGRvd24uXG4gICAgLy8gRG9uJ3QgZ2l2ZSBhIGRlZmF1bHQgY2FsbGJhY2sgaW4gc2ltdWxhdGlvbiwgYmVjYXVzZSBpbnNpZGUgc3R1YnMgd2VcbiAgICAvLyB3YW50IHRvIHJldHVybiB0aGUgcmVzdWx0cyBmcm9tIHRoZSBsb2NhbCBjb2xsZWN0aW9uIGltbWVkaWF0ZWx5IGFuZFxuICAgIC8vIG5vdCBmb3JjZSBhIGNhbGxiYWNrLlxuICAgIGNhbGxiYWNrID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgaWYgKGVycilcbiAgICAgICAgTWV0ZW9yLl9kZWJ1ZyhuYW1lICsgXCIgZmFpbGVkOiBcIiArIChlcnIucmVhc29uIHx8IGVyci5zdGFjaykpO1xuICAgIH07XG4gIH1cblxuICAvLyBGb3IgdHdvIG91dCBvZiB0aHJlZSBtdXRhdG9yIG1ldGhvZHMsIHRoZSBmaXJzdCBhcmd1bWVudCBpcyBhIHNlbGVjdG9yXG4gIGNvbnN0IGZpcnN0QXJnSXNTZWxlY3RvciA9IG5hbWUgPT09IFwidXBkYXRlXCIgfHwgbmFtZSA9PT0gXCJyZW1vdmVcIjtcbiAgaWYgKGZpcnN0QXJnSXNTZWxlY3RvciAmJiAhYWxyZWFkeUluU2ltdWxhdGlvbigpKSB7XG4gICAgLy8gSWYgd2UncmUgYWJvdXQgdG8gYWN0dWFsbHkgc2VuZCBhbiBSUEMsIHdlIHNob3VsZCB0aHJvdyBhbiBlcnJvciBpZlxuICAgIC8vIHRoaXMgaXMgYSBub24tSUQgc2VsZWN0b3IsIGJlY2F1c2UgdGhlIG11dGF0aW9uIG1ldGhvZHMgb25seSBhbGxvd1xuICAgIC8vIHNpbmdsZS1JRCBzZWxlY3RvcnMuIChJZiB3ZSBkb24ndCB0aHJvdyBoZXJlLCB3ZSdsbCBzZWUgZmxpY2tlci4pXG4gICAgdGhyb3dJZlNlbGVjdG9ySXNOb3RJZChhcmdzWzBdLCBuYW1lKTtcbiAgfVxuXG4gIGNvbnN0IG11dGF0b3JNZXRob2ROYW1lID0gdGhpcy5fcHJlZml4ICsgbmFtZTtcbiAgcmV0dXJuIHRoaXMuX2Nvbm5lY3Rpb24uYXBwbHkoXG4gICAgbXV0YXRvck1ldGhvZE5hbWUsIGFyZ3MsIHsgcmV0dXJuU3R1YlZhbHVlOiB0cnVlIH0sIGNhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gdHJhbnNmb3JtRG9jKHZhbGlkYXRvciwgZG9jKSB7XG4gIGlmICh2YWxpZGF0b3IudHJhbnNmb3JtKVxuICAgIHJldHVybiB2YWxpZGF0b3IudHJhbnNmb3JtKGRvYyk7XG4gIHJldHVybiBkb2M7XG59XG5cbmZ1bmN0aW9uIGRvY1RvVmFsaWRhdGUodmFsaWRhdG9yLCBkb2MsIGdlbmVyYXRlZElkKSB7XG4gIGxldCByZXQgPSBkb2M7XG4gIGlmICh2YWxpZGF0b3IudHJhbnNmb3JtKSB7XG4gICAgcmV0ID0gRUpTT04uY2xvbmUoZG9jKTtcbiAgICAvLyBJZiB5b3Ugc2V0IGEgc2VydmVyLXNpZGUgdHJhbnNmb3JtIG9uIHlvdXIgY29sbGVjdGlvbiwgdGhlbiB5b3UgZG9uJ3QgZ2V0XG4gICAgLy8gdG8gdGVsbCB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIFwiY2xpZW50IHNwZWNpZmllZCB0aGUgSURcIiBhbmQgXCJzZXJ2ZXJcbiAgICAvLyBnZW5lcmF0ZWQgdGhlIElEXCIsIGJlY2F1c2UgdHJhbnNmb3JtcyBleHBlY3QgdG8gZ2V0IF9pZC4gIElmIHlvdSB3YW50IHRvXG4gICAgLy8gZG8gdGhhdCBjaGVjaywgeW91IGNhbiBkbyBpdCB3aXRoIGEgc3BlY2lmaWNcbiAgICAvLyBgQy5hbGxvdyh7aW5zZXJ0OiBmLCB0cmFuc2Zvcm06IG51bGx9KWAgdmFsaWRhdG9yLlxuICAgIGlmIChnZW5lcmF0ZWRJZCAhPT0gbnVsbCkge1xuICAgICAgcmV0Ll9pZCA9IGdlbmVyYXRlZElkO1xuICAgIH1cbiAgICByZXQgPSB2YWxpZGF0b3IudHJhbnNmb3JtKHJldCk7XG4gIH1cbiAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gYWRkVmFsaWRhdG9yKGNvbGxlY3Rpb24sIGFsbG93T3JEZW55LCBvcHRpb25zKSB7XG4gIC8vIHZhbGlkYXRlIGtleXNcbiAgY29uc3QgdmFsaWRLZXlzUmVnRXggPSAvXig/Omluc2VydHx1cGRhdGV8cmVtb3ZlfGZldGNofHRyYW5zZm9ybSkkLztcbiAgT2JqZWN0LmtleXMob3B0aW9ucykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgaWYgKCF2YWxpZEtleXNSZWdFeC50ZXN0KGtleSkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYWxsb3dPckRlbnkgKyBcIjogSW52YWxpZCBrZXk6IFwiICsga2V5KTtcbiAgfSk7XG5cbiAgY29sbGVjdGlvbi5fcmVzdHJpY3RlZCA9IHRydWU7XG5cbiAgWydpbnNlcnQnLCAndXBkYXRlJywgJ3JlbW92ZSddLmZvckVhY2goKG5hbWUpID0+IHtcbiAgICBpZiAoaGFzT3duLmNhbGwob3B0aW9ucywgbmFtZSkpIHtcbiAgICAgIGlmICghKG9wdGlvbnNbbmFtZV0gaW5zdGFuY2VvZiBGdW5jdGlvbikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGFsbG93T3JEZW55ICsgXCI6IFZhbHVlIGZvciBgXCIgKyBuYW1lICsgXCJgIG11c3QgYmUgYSBmdW5jdGlvblwiKTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlIHRyYW5zZm9ybSBpcyBzcGVjaWZpZWQgYXQgYWxsIChpbmNsdWRpbmcgYXMgJ251bGwnKSBpbiB0aGlzXG4gICAgICAvLyBjYWxsLCB0aGVuIHRha2UgdGhhdDsgb3RoZXJ3aXNlLCB0YWtlIHRoZSB0cmFuc2Zvcm0gZnJvbSB0aGVcbiAgICAgIC8vIGNvbGxlY3Rpb24uXG4gICAgICBpZiAob3B0aW9ucy50cmFuc2Zvcm0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBvcHRpb25zW25hbWVdLnRyYW5zZm9ybSA9IGNvbGxlY3Rpb24uX3RyYW5zZm9ybTsgIC8vIGFscmVhZHkgd3JhcHBlZFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3B0aW9uc1tuYW1lXS50cmFuc2Zvcm0gPSBMb2NhbENvbGxlY3Rpb24ud3JhcFRyYW5zZm9ybShcbiAgICAgICAgICBvcHRpb25zLnRyYW5zZm9ybSk7XG4gICAgICB9XG5cbiAgICAgIGNvbGxlY3Rpb24uX3ZhbGlkYXRvcnNbbmFtZV1bYWxsb3dPckRlbnldLnB1c2gob3B0aW9uc1tuYW1lXSk7XG4gICAgfVxuICB9KTtcblxuICAvLyBPbmx5IHVwZGF0ZSB0aGUgZmV0Y2ggZmllbGRzIGlmIHdlJ3JlIHBhc3NlZCB0aGluZ3MgdGhhdCBhZmZlY3RcbiAgLy8gZmV0Y2hpbmcuIFRoaXMgd2F5IGFsbG93KHt9KSBhbmQgYWxsb3coe2luc2VydDogZn0pIGRvbid0IHJlc3VsdCBpblxuICAvLyBzZXR0aW5nIGZldGNoQWxsRmllbGRzXG4gIGlmIChvcHRpb25zLnVwZGF0ZSB8fCBvcHRpb25zLnJlbW92ZSB8fCBvcHRpb25zLmZldGNoKSB7XG4gICAgaWYgKG9wdGlvbnMuZmV0Y2ggJiYgIShvcHRpb25zLmZldGNoIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYWxsb3dPckRlbnkgKyBcIjogVmFsdWUgZm9yIGBmZXRjaGAgbXVzdCBiZSBhbiBhcnJheVwiKTtcbiAgICB9XG4gICAgY29sbGVjdGlvbi5fdXBkYXRlRmV0Y2gob3B0aW9ucy5mZXRjaCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdGhyb3dJZlNlbGVjdG9ySXNOb3RJZChzZWxlY3RvciwgbWV0aG9kTmFtZSkge1xuICBpZiAoIUxvY2FsQ29sbGVjdGlvbi5fc2VsZWN0b3JJc0lkUGVyaGFwc0FzT2JqZWN0KHNlbGVjdG9yKSkge1xuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXG4gICAgICA0MDMsIFwiTm90IHBlcm1pdHRlZC4gVW50cnVzdGVkIGNvZGUgbWF5IG9ubHkgXCIgKyBtZXRob2ROYW1lICtcbiAgICAgICAgXCIgZG9jdW1lbnRzIGJ5IElELlwiKTtcbiAgfVxufTtcblxuLy8gRGV0ZXJtaW5lIGlmIHdlIGFyZSBpbiBhIEREUCBtZXRob2Qgc2ltdWxhdGlvblxuZnVuY3Rpb24gYWxyZWFkeUluU2ltdWxhdGlvbigpIHtcbiAgdmFyIEN1cnJlbnRJbnZvY2F0aW9uID1cbiAgICBERFAuX0N1cnJlbnRNZXRob2RJbnZvY2F0aW9uIHx8XG4gICAgLy8gRm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LCBhcyBleHBsYWluZWQgaW4gdGhpcyBpc3N1ZTpcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbWV0ZW9yL21ldGVvci9pc3N1ZXMvODk0N1xuICAgIEREUC5fQ3VycmVudEludm9jYXRpb247XG5cbiAgY29uc3QgZW5jbG9zaW5nID0gQ3VycmVudEludm9jYXRpb24uZ2V0KCk7XG4gIHJldHVybiBlbmNsb3NpbmcgJiYgZW5jbG9zaW5nLmlzU2ltdWxhdGlvbjtcbn1cbiJdfQ==
