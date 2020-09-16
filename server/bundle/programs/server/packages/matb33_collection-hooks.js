(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var _ = Package.underscore._;
var EJSON = Package.ejson.EJSON;
var LocalCollection = Package.minimongo.LocalCollection;
var Minimongo = Package.minimongo.Minimongo;

/* Package-scope variables */
var CollectionHooks;

(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/matb33_collection-hooks/collection-hooks.js                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/* global Package Meteor Mongo LocalCollection CollectionHooks _ EJSON */
/* eslint-disable no-proto, no-native-reassign, no-global-assign */

// Relevant AOP terminology:
// Aspect: User code that runs before/after (hook)
// Advice: Wrapper code that knows when to call user code (aspects)
// Pointcut: before/after

var advices = {}
var Tracker = (Package.tracker && Package.tracker.Tracker) || Package.deps.Deps
var publishUserId = Meteor.isServer && new Meteor.EnvironmentVariable()

CollectionHooks = {
  defaults: {
    before: {insert: {}, update: {}, remove: {}, upsert: {}, find: {}, findOne: {}, all: {}},
    after: {insert: {}, update: {}, remove: {}, find: {}, findOne: {}, all: {}},
    all: {insert: {}, update: {}, remove: {}, find: {}, findOne: {}, all: {}}
  },
  directEnv: new Meteor.EnvironmentVariable(),
  directOp: function directOp (func) {
    return this.directEnv.withValue(true, func)
  },
  hookedOp: function hookedOp (func) {
    return this.directEnv.withValue(false, func)
  }
}

CollectionHooks.getUserId = function getUserId () {
  var userId

  if (Meteor.isClient) {
    Tracker.nonreactive(function () {
      userId = Meteor.userId && Meteor.userId()
    })
  }

  if (Meteor.isServer) {
    try {
      // Will throw an error unless within method call.
      // Attempt to recover gracefully by catching:
      userId = Meteor.userId && Meteor.userId()
    } catch (e) {}

    if (userId == null) {
      // Get the userId if we are in a publish function.
      userId = publishUserId.get()
    }
  }

  if (userId == null) {
    userId = CollectionHooks.defaultUserId
  }

  return userId
}

CollectionHooks.extendCollectionInstance = function extendCollectionInstance (self, constructor) {
  // Offer a public API to allow the user to define aspects
  // Example: collection.before.insert(func);
  _.each(['before', 'after'], function (pointcut) {
    _.each(advices, function (advice, method) {
      if (advice === 'upsert' && pointcut === 'after') return

      Meteor._ensure(self, pointcut, method)
      Meteor._ensure(self, '_hookAspects', method)

      self._hookAspects[method][pointcut] = []
      self[pointcut][method] = function (aspect, options) {
        var len = self._hookAspects[method][pointcut].push({
          aspect: aspect,
          options: CollectionHooks.initOptions(options, pointcut, method)
        })

        return {
          replace: function (aspect, options) {
            self._hookAspects[method][pointcut].splice(len - 1, 1, {
              aspect: aspect,
              options: CollectionHooks.initOptions(options, pointcut, method)
            })
          },
          remove: function () {
            self._hookAspects[method][pointcut].splice(len - 1, 1)
          }
        }
      }
    })
  })

  // Offer a publicly accessible object to allow the user to define
  // collection-wide hook options.
  // Example: collection.hookOptions.after.update = {fetchPrevious: false};
  self.hookOptions = EJSON.clone(CollectionHooks.defaults)

  // Wrap mutator methods, letting the defined advice do the work
  _.each(advices, function (advice, method) {
    var collection = Meteor.isClient || method === 'upsert' ? self : self._collection

    // Store a reference to the original mutator method
    var _super = collection[method]

    Meteor._ensure(self, 'direct', method)
    self.direct[method] = function () {
      var args = arguments
      return CollectionHooks.directOp(function () {
        return constructor.prototype[method].apply(self, args)
      })
    }

    collection[method] = function () {
      if (CollectionHooks.directEnv.get() === true) {
        return _super.apply(collection, arguments)
      }

      // NOTE: should we decide to force `update` with `{upsert:true}` to use
      // the `upsert` hooks, this is what will accomplish it. It's important to
      // realize that Meteor won't distinguish between an `update` and an
      // `insert` though, so we'll end up with `after.update` getting called
      // even on an `insert`. That's why we've chosen to disable this for now.
      // if (method === "update" && _.isObject(arguments[2]) && arguments[2].upsert) {
      //   method = "upsert";
      //   advice = CollectionHooks.getAdvice(method);
      // }

      return advice.call(this,
        CollectionHooks.getUserId(),
        _super,
        self,
        method === 'upsert' ? {
          insert: self._hookAspects.insert || {},
          update: self._hookAspects.update || {},
          upsert: self._hookAspects.upsert || {}
        } : self._hookAspects[method] || {},
        function (doc) {
          return (
            _.isFunction(self._transform)
            ? function (d) { return self._transform(d || doc) }
            : function (d) { return d || doc }
          )
        },
        _.toArray(arguments),
        false
      )
    }
  })
}

CollectionHooks.defineAdvice = function defineAdvice (method, advice) {
  advices[method] = advice
}

CollectionHooks.getAdvice = function getAdvice (method) {
  return advices[method]
}

CollectionHooks.initOptions = function initOptions (options, pointcut, method) {
  return CollectionHooks.extendOptions(CollectionHooks.defaults, options, pointcut, method)
}

CollectionHooks.extendOptions = function extendOptions (source, options, pointcut, method) {
  options = _.extend(options || {}, source.all.all)
  options = _.extend(options, source[pointcut].all)
  options = _.extend(options, source.all[method])
  options = _.extend(options, source[pointcut][method])
  return options
}

CollectionHooks.getDocs = function getDocs (collection, selector, options) {
  var findOptions = {transform: null, reactive: false} // added reactive: false

  /*
  // No "fetch" support at this time.
  if (!this._validators.fetchAllFields) {
    findOptions.fields = {};
    _.each(this._validators.fetch, function(fieldName) {
      findOptions.fields[fieldName] = 1;
    });
  }
  */

  // Bit of a magic condition here... only "update" passes options, so this is
  // only relevant to when update calls getDocs:
  if (options) {
    // This was added because in our case, we are potentially iterating over
    // multiple docs. If multi isn't enabled, force a limit (almost like
    // findOne), as the default for update without multi enabled is to affect
    // only the first matched document:
    if (!options.multi) {
      findOptions.limit = 1
    }

    _.extend(findOptions, _.omit(options, 'multi', 'upsert'))
  }

  // Unlike validators, we iterate over multiple docs, so use
  // find instead of findOne:
  return collection.find(selector, findOptions)
}

// This function contains a snippet of code pulled and modified from:
// ~/.meteor/packages/mongo-livedata/collection.js
// It's contained in these utility functions to make updates easier for us in
// case this code changes.
CollectionHooks.getFields = function getFields (mutator) {
  // compute modified fields
  var fields = []
  // ====ADDED START=======================
  var operators = [
    '$addToSet',
    '$bit',
    '$currentDate',
    '$inc',
    '$max',
    '$min',
    '$pop',
    '$pull',
    '$pullAll',
    '$push',
    '$rename',
    '$set',
    '$unset'
  ]
  // ====ADDED END=========================

  _.each(mutator, function (params, op) {
    // ====ADDED START=======================
    if (_.contains(operators, op)) {
    // ====ADDED END=========================
      _.each(_.keys(params), function (field) {
        // treat dotted fields as if they are replacing their
        // top-level part
        if (field.indexOf('.') !== -1) {
          field = field.substring(0, field.indexOf('.'))
        }

        // record the field we are trying to change
        if (!_.contains(fields, field)) {
          fields.push(field)
        }
      })
      // ====ADDED START=======================
    } else {
      fields.push(op)
    }
    // ====ADDED END=========================
  })

  return fields
}

CollectionHooks.reassignPrototype = function reassignPrototype (instance, constr) {
  var hasSetPrototypeOf = typeof Object.setPrototypeOf === 'function'

  if (!constr) constr = typeof Mongo !== 'undefined' ? Mongo.Collection : Meteor.Collection

  // __proto__ is not available in < IE11
  // Note: Assigning a prototype dynamically has performance implications
  if (hasSetPrototypeOf) {
    Object.setPrototypeOf(instance, constr.prototype)
  } else if (instance.__proto__) {
    instance.__proto__ = constr.prototype
  }
}

CollectionHooks.wrapCollection = function wrapCollection (ns, as) {
  if (!as._CollectionConstructor) as._CollectionConstructor = as.Collection
  if (!as._CollectionPrototype) as._CollectionPrototype = new as.Collection(null)

  var constructor = ns._NewCollectionContructor || as._CollectionConstructor
  var proto = as._CollectionPrototype

  ns.Collection = function () {
    var ret = constructor.apply(this, arguments)
    CollectionHooks.extendCollectionInstance(this, constructor)
    return ret
  }
  ns._NewCollectionContructor = ns.Collection

  ns.Collection.prototype = proto
  ns.Collection.prototype.constructor = ns.Collection

  for (var prop in constructor) {
    if (constructor.hasOwnProperty(prop)) {
      ns.Collection[prop] = constructor[prop]
    }
  }
  ns.Collection.apply = Function.prototype.apply;
}

CollectionHooks.modify = LocalCollection._modify

if (typeof Mongo !== 'undefined') {
  CollectionHooks.wrapCollection(Meteor, Mongo)
  CollectionHooks.wrapCollection(Mongo, Mongo)
} else {
  CollectionHooks.wrapCollection(Meteor, Meteor)
}

if (Meteor.isServer) {
  var _publish = Meteor.publish
  Meteor.publish = function (name, handler, options) {
    return _publish.call(this, name, function () {
      // This function is called repeatedly in publications
      var ctx = this
      var args = arguments
      return publishUserId.withValue(ctx && ctx.userId, function () {
        return handler.apply(ctx, args)
      })
    }, options)
  }

  // Make the above available for packages with hooks that want to determine
  // whether they are running inside a publish function or not.
  CollectionHooks.isWithinPublish = function isWithinPublish () {
    return publishUserId.get() !== undefined
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/matb33_collection-hooks/insert.js                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/* global CollectionHooks _ EJSON Mongo */

CollectionHooks.defineAdvice('insert', function (userId, _super, instance, aspects, getTransform, args, suppressAspects) {
  var self = this
  var ctx = {context: self, _super: _super, args: args}
  var callback = _.last(args)
  var async = _.isFunction(callback)
  var abort, ret

  // args[0] : doc
  // args[1] : callback

  // before
  if (!suppressAspects) {
    try {
      _.each(aspects.before, function (o) {
        var r = o.aspect.call(_.extend({transform: getTransform(args[0])}, ctx), userId, args[0])
        if (r === false) abort = true
      })

      if (abort) return
    } catch (e) {
      if (async) return callback.call(self, e)
      throw e
    }
  }

  function after (id, err) {
    var doc = args[0]
    if (id) {
      // In some cases (namely Meteor.users on Meteor 1.4+), the _id property
      // is a raw mongo _id object. We need to extract the _id from this object
      if (_.isObject(id) && id.ops) {
        // If _str then collection is using Mongo.ObjectID as ids
        if (doc._id._str) {
          id = new Mongo.ObjectID(doc._id._str.toString())
        } else {
          id = id.ops && id.ops[0] && id.ops[0]._id
        }
      }
      doc = EJSON.clone(args[0])
      doc._id = id
    }
    if (!suppressAspects) {
      var lctx = _.extend({transform: getTransform(doc), _id: id, err: err}, ctx)
      _.each(aspects.after, function (o) {
        o.aspect.call(lctx, userId, doc)
      })
    }
    return id
  }

  if (async) {
    args[args.length - 1] = function (err, obj) {
      after((obj && obj[0] && obj[0]._id) || obj, err)
      return callback.apply(this, arguments)
    }
    return _super.apply(self, args)
  } else {
    ret = _super.apply(self, args)
    return after((ret && ret[0] && ret[0]._id) || ret)
  }
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/matb33_collection-hooks/update.js                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/* global CollectionHooks _ EJSON */

CollectionHooks.defineAdvice('update', function (userId, _super, instance, aspects, getTransform, args, suppressAspects) {
  var self = this
  var ctx = {context: self, _super: _super, args: args}
  var callback = _.last(args)
  var async = _.isFunction(callback)
  var docs
  var docIds
  var fields
  var abort
  var prev = {}

  // args[0] : selector
  // args[1] : mutator
  // args[2] : options (optional)
  // args[3] : callback

  if (_.isFunction(args[2])) {
    callback = args[2]
    args[2] = {}
  }

  if (!suppressAspects) {
    try {
      if (!_.isEmpty(aspects.before) || !_.isEmpty(aspects.after)) {
        fields = CollectionHooks.getFields(args[1])
        docs = CollectionHooks.getDocs.call(self, instance, args[0], args[2]).fetch()
        docIds = _.map(docs, function (doc) { return doc._id })
      }

      // copy originals for convenience for the 'after' pointcut
      if (!_.isEmpty(aspects.after)) {
        prev.mutator = EJSON.clone(args[1])
        prev.options = EJSON.clone(args[2])
        if (
          _.some(aspects.after, function (o) { return o.options.fetchPrevious !== false }) &&
          CollectionHooks.extendOptions(instance.hookOptions, {}, 'after', 'update').fetchPrevious !== false
        ) {
          prev.docs = {}
          _.each(docs, function (doc) {
            prev.docs[doc._id] = EJSON.clone(doc)
          })
        }
      }

      // before
      _.each(aspects.before, function (o) {
        _.each(docs, function (doc) {
          var r = o.aspect.call(_.extend({transform: getTransform(doc)}, ctx), userId, doc, fields, args[1], args[2])
          if (r === false) abort = true
        })
      })

      if (abort) return 0
    } catch (e) {
      if (async) return callback.call(self, e)
      throw e
    }
  }

  function after (affected, err) {
    if (!suppressAspects) {
      if (!_.isEmpty(aspects.after)) {
        var fields = CollectionHooks.getFields(args[1])
        var docs = CollectionHooks.getDocs.call(self, instance, {_id: {$in: docIds}}, args[2]).fetch()
      }

      _.each(aspects.after, function (o) {
        _.each(docs, function (doc) {
          o.aspect.call(_.extend({
            transform: getTransform(doc),
            previous: prev.docs && prev.docs[doc._id],
            affected: affected,
            err: err
          }, ctx), userId, doc, fields, prev.mutator, prev.options)
        })
      })
    }
  }

  if (async) {
    args[args.length - 1] = function (err, affected) {
      after(affected, err)
      return callback.apply(this, arguments)
    }
    return _super.apply(this, args)
  } else {
    var affected = _super.apply(self, args)
    after(affected)
    return affected
  }
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/matb33_collection-hooks/remove.js                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/* global CollectionHooks _ EJSON */

CollectionHooks.defineAdvice('remove', function (userId, _super, instance, aspects, getTransform, args, suppressAspects) {
  var self = this
  var ctx = {context: self, _super: _super, args: args}
  var callback = _.last(args)
  var async = _.isFunction(callback)
  var docs
  var abort
  var prev = []

  // args[0] : selector
  // args[1] : callback

  if (!suppressAspects) {
    try {
      if (!_.isEmpty(aspects.before) || !_.isEmpty(aspects.after)) {
        docs = CollectionHooks.getDocs.call(self, instance, args[0]).fetch()
      }

      // copy originals for convenience for the 'after' pointcut
      if (!_.isEmpty(aspects.after)) {
        _.each(docs, function (doc) {
          prev.push(EJSON.clone(doc))
        })
      }

      // before
      _.each(aspects.before, function (o) {
        _.each(docs, function (doc) {
          var r = o.aspect.call(_.extend({transform: getTransform(doc)}, ctx), userId, doc)
          if (r === false) abort = true
        })
      })

      if (abort) return 0
    } catch (e) {
      if (async) return callback.call(self, e)
      throw e
    }
  }

  function after (err) {
    if (!suppressAspects) {
      _.each(aspects.after, function (o) {
        _.each(prev, function (doc) {
          o.aspect.call(_.extend({transform: getTransform(doc), err: err}, ctx), userId, doc)
        })
      })
    }
  }

  if (async) {
    args[args.length - 1] = function (err) {
      after(err)
      return callback.apply(this, arguments)
    }
    return _super.apply(self, args)
  } else {
    var result = _super.apply(self, args)
    after()
    return result
  }
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/matb33_collection-hooks/upsert.js                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/* global CollectionHooks _ EJSON */

CollectionHooks.defineAdvice('upsert', function (userId, _super, instance, aspectGroup, getTransform, args, suppressAspects) {
  var self = this
  var ctx = {context: self, _super: _super, args: args}
  var callback = _.last(args)
  var async = _.isFunction(callback)
  var docs
  var docIds
  var abort
  var prev = {}

  // args[0] : selector
  // args[1] : mutator
  // args[2] : options (optional)
  // args[3] : callback

  if (_.isFunction(args[2])) {
    callback = args[2]
    args[2] = {}
  }

  if (!suppressAspects) {
    if (!_.isEmpty(aspectGroup.upsert.before)) {
      docs = CollectionHooks.getDocs.call(self, instance, args[0], args[2]).fetch()
      docIds = _.map(docs, function (doc) { return doc._id })
    }

    // copy originals for convenience for the 'after' pointcut
    if (!_.isEmpty(aspectGroup.update.after)) {
      if (_.some(aspectGroup.update.after, function (o) { return o.options.fetchPrevious !== false }) &&
          CollectionHooks.extendOptions(instance.hookOptions, {}, 'after', 'update').fetchPrevious !== false) {
        prev.mutator = EJSON.clone(args[1])
        prev.options = EJSON.clone(args[2])
        prev.docs = {}
        _.each(docs, function (doc) {
          prev.docs[doc._id] = EJSON.clone(doc)
        })
      }
    }

    // before
    _.each(aspectGroup.upsert.before, function (o) {
      var r = o.aspect.call(ctx, userId, args[0], args[1], args[2])
      if (r === false) abort = true
    })

    if (abort) return { numberAffected: 0 }
  }

  function afterUpdate (affected, err) {
    if (!suppressAspects) {
      if (!_.isEmpty(aspectGroup.update.after)) {
        var fields = CollectionHooks.getFields(args[1])
        var docs = CollectionHooks.getDocs.call(self, instance, {_id: {$in: docIds}}, args[2]).fetch()
      }

      _.each(aspectGroup.update.after, function (o) {
        _.each(docs, function (doc) {
          o.aspect.call(_.extend({
            transform: getTransform(doc),
            previous: prev.docs && prev.docs[doc._id],
            affected: affected,
            err: err
          }, ctx), userId, doc, fields, prev.mutator, prev.options)
        })
      })
    }
  }

  function afterInsert (id, err) {
    if (!suppressAspects) {
      if (!_.isEmpty(aspectGroup.insert.after)) {
        var doc = CollectionHooks.getDocs.call(self, instance, {_id: id}, args[0], {}).fetch()[0] // 3rd argument passes empty object which causes magic logic to imply limit:1
        var lctx = _.extend({transform: getTransform(doc), _id: id, err: err}, ctx)
      }

      _.each(aspectGroup.insert.after, function (o) {
        o.aspect.call(lctx, userId, doc)
      })
    }
  }

  if (async) {
    args[args.length - 1] = function (err, ret) {
      if (err || (ret && ret.insertedId)) {
        // Send any errors to afterInsert
        afterInsert(ret.insertedId, err)
      } else {
        afterUpdate(ret && ret.numberAffected, err) // Note that err can never reach here
      }

      return CollectionHooks.hookedOp(function () {
        return callback.call(this, err, ret)
      })
    }

    return CollectionHooks.directOp(function () {
      return _super.apply(self, args)
    })
  } else {
    var ret = CollectionHooks.directOp(function () {
      return _super.apply(self, args)
    })

    if (ret && ret.insertedId) {
      afterInsert(ret.insertedId)
    } else {
      afterUpdate(ret && ret.numberAffected)
    }

    return ret
  }
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/matb33_collection-hooks/find.js                                                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/* global CollectionHooks _ */

CollectionHooks.defineAdvice('find', function (userId, _super, instance, aspects, getTransform, args, suppressAspects) {
  var self = this
  var ctx = {context: self, _super: _super, args: args}
  var ret, abort

  // args[0] : selector
  // args[1] : options

  args[0] = instance._getFindSelector(args)
  args[1] = instance._getFindOptions(args)

  // before
  if (!suppressAspects) {
    _.each(aspects.before, function (o) {
      var r = o.aspect.call(ctx, userId, args[0], args[1])
      if (r === false) abort = true
    })

    if (abort) return instance.find(undefined)
  }

  function after (cursor) {
    if (!suppressAspects) {
      _.each(aspects.after, function (o) {
        o.aspect.call(ctx, userId, args[0], args[1], cursor)
      })
    }
  }

  ret = _super.apply(self, args)
  after(ret)

  return ret
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/matb33_collection-hooks/findone.js                                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/* global CollectionHooks _ */

CollectionHooks.defineAdvice('findOne', function (userId, _super, instance, aspects, getTransform, args, suppressAspects) {
  var self = this
  var ctx = {context: self, _super: _super, args: args}
  var ret, abort

  // args[0] : selector
  // args[1] : options

  args[0] = instance._getFindSelector(args)
  args[1] = instance._getFindOptions(args)

  // before
  if (!suppressAspects) {
    _.each(aspects.before, function (o) {
      var r = o.aspect.call(ctx, userId, args[0], args[1])
      if (r === false) abort = true
    })

    if (abort) return
  }

  function after (doc) {
    if (!suppressAspects) {
      _.each(aspects.after, function (o) {
        o.aspect.call(ctx, userId, args[0], args[1], doc)
      })
    }
  }

  ret = _super.apply(self, args)
  after(ret)

  return ret
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/matb33_collection-hooks/users-compat.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/* global CollectionHooks Meteor Mongo */

if (Meteor.users) {
  // If Meteor.users has been instantiated, attempt to re-assign its prototype:
  CollectionHooks.reassignPrototype(Meteor.users)

  // Next, give it the hook aspects:
  var Collection = typeof Mongo !== 'undefined' && typeof Mongo.Collection !== 'undefined' ? Mongo.Collection : Meteor.Collection
  CollectionHooks.extendCollectionInstance(Meteor.users, Collection)
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("matb33:collection-hooks", {
  CollectionHooks: CollectionHooks
});

})();
