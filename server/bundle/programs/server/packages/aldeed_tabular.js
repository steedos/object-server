(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var check = Package.check.check;
var Match = Package.check.Match;
var _ = Package.underscore._;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var Tabular;

(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/aldeed_tabular/common.js                                                                                //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
/* global Tabular:true, Mongo, _, Meteor, Template */

Tabular = {}; //exported

Tabular.tablesByName = {};

if (Meteor.isClient) {
  Template.registerHelper('TabularTables', Tabular.tablesByName);
}

Tabular.Table = function (options) {
  var self = this;

  if (!options) {
    throw new Error('Tabular.Table options argument is required');
  }

  if (!options.name) {
    throw new Error('Tabular.Table options must specify name');
  }
  self.name = options.name;

  if (!(options.collection instanceof Mongo.Collection)) {
    throw new Error('Tabular.Table options must specify collection');
  }
  self.collection = options.collection;

  self.pub = options.pub || 'tabular_genericPub';

  // By default we use core `Meteor.subscribe`, but you can pass
  // a subscription manager like `sub: new SubsManager({cacheLimit: 20, expireIn: 3})`
  self.sub = options.sub || Meteor;

  self.onUnload = options.onUnload;
  self.allow = options.allow;
  self.allowFields = options.allowFields;
  self.changeSelector = options.changeSelector;
  self.throttleRefresh = options.throttleRefresh;
  self.filteredRecordIds = options.filteredRecordIds;

  if (_.isArray(options.extraFields)) {
    var fields = {};
    _.each(options.extraFields, function (fieldName) {
      fields[fieldName] = 1;
    });
    self.extraFields = fields;
  }

  self.selector = options.selector;

  if (!options.columns) {
    throw new Error('Tabular.Table options must specify columns');
  }

  self.options = _.omit(options, 'collection', 'pub', 'sub', 'onUnload', 'allow', 'allowFields', 'extraFields', 'name', 'selector');

  Tabular.tablesByName[self.name] = self;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/aldeed_tabular/server/tabular.js                                                                        //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
/* global check, Match, Meteor, _, Tabular */

/*
 * These are the two publications used by TabularTable.
 *
 * The genericPub one can be overridden by supplying a `pub`
 * property with a different publication name. This publication
 * is given only the list of ids and requested fields. You may
 * want to override it if you need to publish documents from
 * related collections along with the table collection documents.
 *
 * The getInfo one runs first and handles all the complex logic
 * required by this package, so that you don't have to duplicate
 * this logic when overriding the genericPub function.
 *
 * Having two publications also allows fine-grained control of
 * reactivity on the client.
 */

var clone = Npm.require('clone');

Meteor.publish("tabular_genericPub", function (tableName, ids, fields) {
	var self = this;

	check(tableName, String);
	check(ids, Array);
	check(fields, Match.Optional(Object));

	var table = Tabular.tablesByName[tableName];
	if (!table) {
		// We throw an error in the other pub, so no need to throw one here
		self.ready();
		return;
	}

	// Check security. We call this in both publications.
	if (typeof table.allow === 'function' && !table.allow(self.userId, fields)) {
		self.ready();
		return;
	}

	// Check security for fields. We call this only in this publication
	if (typeof table.allowFields === 'function' && !table.allowFields(self.userId, fields)) {
		self.ready();
		return;
	}

	return table.collection.find({_id: {$in: ids}}, {fields: fields});
});

Meteor.publish("tabular_getInfo", function (tableName, selector, sort, skip, limit, search_text) {
	var self = this;

	check(tableName, String);
	check(selector, Match.Optional(Match.OneOf(Object, null)));
	check(sort, Match.Optional(Match.OneOf(Array, null)));
	check(skip, Number);
	check(limit, Match.Optional(Match.OneOf(Number, null)));

	var table = Tabular.tablesByName[tableName];
	if (!table) {
		throw new Error('No TabularTable defined with the name "' + tableName + '". Make sure you are defining your TabularTable in common code.');
	}

	// Check security. We call this in both publications.
	// Even though we're only publishing _ids and counts
	// from this function, with sensitive data, there is
	// a chance someone could do a query and learn something
	// just based on whether a result is found or not.
	if (typeof table.allow === 'function' && !table.allow(self.userId)) {
		self.ready();
		return;
	}

	selector = selector || {};

	// Allow the user to modify the selector before we use it
	if (typeof table.changeSelector === 'function') {
		selector = table.changeSelector(selector, self.userId);
	}

	// Apply the server side selector specified in the tabular
	// table constructor. Both must be met, so we join
	// them using $and, allowing both selectors to have
	// the same keys.
	if (typeof table.selector === 'function') {
		var tableSelector = table.selector(self.userId);
		if (_.isEmpty(selector)) {
			selector = tableSelector;
		} else {
			selector = {$and: [tableSelector, selector]};
		}
	}

	var findOptions = {
		skip: skip,
		fields: {_id: 1}
	};

	// `limit` may be `null`
	if (limit > 0) {
		findOptions.limit = limit;
	}

	// `sort` may be `null`
	if (_.isArray(sort)) {
		findOptions.sort = sort;
	}

	var filteredRecordIds;

	if(table.collection && table.collection._simpleSchema && table.collection._simpleSchema._schema){

		// console.time("tabular_schema_search");

		var _schema = table.collection._simpleSchema._schema;

		var old_selector = clone(selector)

		_.keys(_schema).forEach(function (key) {
			var _schema_child = _schema[key];
			if (_schema_child.foreign_key) {
				if(old_selector["$and"] && old_selector["$and"].length > 1){

					var subQuery =  clone(old_selector);

					var references = _schema_child.references

					var find_fields = {};

					find_fields[references.key || "_id"] = 1;

					var search_keys = references.search_keys || ["name"];

					var or = [];

					search_keys.forEach(function(search_key){
						var fine_where = {};
						var texts = search_text.split(" ")
						texts.forEach(function (text) {
							if(text && text.trim()){
								fine_where[search_key] = {"$regex":text,"$options":"i"};
							}
						})
						or.push(fine_where);
					})


					subQuery["$and"][1]["$or"] = or;

					if(!_.has(db[references.collection]._simpleSchema._schema, "space")){
						subQuery = {"$or": or}
					}

					// console.log("subQuery" + key, JSON.stringify(subQuery));
					//
					// console.log("references.collection", references.collection);
					//
					// console.log("find_fields", find_fields);

					var _ids = db[references.collection].find(subQuery, find_fields).fetch().getProperty(references.key || "_id");

					var c_selector = {}
					c_selector[key] = {$in: _ids};
					selector["$and"][1]["$or"].push(c_selector);
				}

			}
		});

		// console.timeEnd("tabular_schema_search");
	}

	if (table.filteredRecordIds) {
		filteredRecordIds = table.filteredRecordIds(table, selector, sort, skip, limit, filteredRecordIds, self.userId, findOptions);
	}

	var filteredCursor = table.collection.find(selector, findOptions);

	if (!filteredRecordIds) {
		filteredRecordIds = filteredCursor.map(function (doc) {
			return doc._id;
		});
	}

	var countCursor = table.collection.find(selector, {fields: {_id: 1}});

	var recordReady = false;
	var updateRecords = function updateRecords() {
		var currentCount = countCursor.count();

		// From https://datatables.net/manual/server-side
		// recordsTotal: Total records, before filtering (i.e. the total number of records in the database)
		// recordsFiltered: Total records, after filtering (i.e. the total number of records after filtering has been applied - not just the number of records being returned for this page of data).

		var record = {
			ids: filteredRecordIds,
			// count() will give us the updated total count
			// every time. It does not take the find options
			// limit into account.
			recordsTotal: currentCount,
			recordsFiltered: currentCount
		};

		if (recordReady) {
			//console.log("changed", tableName, record);
			self.changed('tabular_records', tableName, record);
		} else {
			//console.log("added", tableName, record);
			self.added("tabular_records", tableName, record);
			recordReady = true;
		}
	};

	if (table.throttleRefresh) {
		updateRecords = _.throttle(updateRecords, table.throttleRefresh);
	}

	updateRecords();

	self.ready();

	// var error_ids = [];

	// Handle docs being added or removed from the result set.
	var initializing = true;
	var handle = filteredCursor.observeChanges({
		added: function (id) {
			if (initializing) return;
			// console.log("ADDED");

			if(table.filteredRecordIds){
				if(!filteredRecordIds.includes(id) ){
					filteredRecordIds.push(id);
					updateRecords();
				}else{
					if(table.filteredRecordIds){
						//异常情况下，重新计算ids集合
						filteredRecordIds = table.filteredRecordIds(table, selector, sort, skip, limit, filteredRecordIds, self.userId, findOptions);

						updateRecords();
					}
				}
			}else{
				filteredRecordIds.push(id);
				updateRecords();
			}

		},
		removed: function (id) {
			//console.log("REMOVED");
			// _.findWhere is used to support Mongo ObjectIDs
			filteredRecordIds = _.without(filteredRecordIds, _.findWhere(filteredRecordIds, id));
			updateRecords();
		}
	});
	initializing = false;

	// It is too inefficient to use an observe without any limits to track count perfectly
	// accurately when, for example, the selector is {} and there are a million documents.
	// Instead we will update the count every 10 seconds, in addition to whenever the limited
	// result set changes.
	var interval = Meteor.setInterval(updateRecords, 10000);

	// Stop observing the cursors when client unsubs.
	// Stopping a subscription automatically takes
	// care of sending the client any removed messages.
	self.onStop(function () {
		Meteor.clearInterval(interval);
		handle.stop();
	});
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("aldeed:tabular", {
  Tabular: Tabular
});

})();
