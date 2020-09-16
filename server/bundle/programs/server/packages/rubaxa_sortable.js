(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;

/* Package-scope variables */
var Sortable;

(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// packages/rubaxa_sortable/packages/rubaxa_sortable.js                                               //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                      //
(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                              //
// packages/rubaxa:sortable/methods-server.js                                                   //
//                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                //
'use strict';                                                                                   // 1
                                                                                                // 2
Sortable = {};                                                                                  // 3
Sortable.collections = [];  // array of collection names that the client is allowed to reorder  // 4
                                                                                                // 5
Meteor.methods({                                                                                // 6
	/**                                                                                            // 7
	 * Update the sortField of documents with given ids in a collection, incrementing it by incDec // 8
	 * @param {String} collectionName - name of the collection to update                           // 9
	 * @param {String[]} ids - array of document ids                                               // 10
	 * @param {String} orderField - the name of the order field, usually "order"                   // 11
	 * @param {Number} incDec - pass 1 or -1                                                       // 12
	 */                                                                                            // 13
	'rubaxa:sortable/collection-update': function (collectionName, ids, sortField, incDec) {       // 14
		check(collectionName, String);                                                                // 15
		// don't allow the client to modify just any collection                                       // 16
		if (!Sortable || !Array.isArray(Sortable.collections)) {                                      // 17
			throw new Meteor.Error(500, 'Please define Sortable.collections');                           // 18
		}                                                                                             // 19
		if (Sortable.collections.indexOf(collectionName) === -1) {                                    // 20
			throw new Meteor.Error(403, 'Collection <' + collectionName + '> is not Sortable. Please add it to Sortable.collections in server code.');
		}                                                                                             // 22
                                                                                                // 23
		check(ids, [String]);                                                                         // 24
		check(sortField, String);                                                                     // 25
		check(incDec, Number);                                                                        // 26
		var selector = {_id: {$in: ids}}, modifier = {$inc: {}};                                      // 27
		modifier.$inc[sortField] = incDec;                                                            // 28
		Mongo.Collection.get(collectionName).update(selector, modifier, {multi: true});               // 29
	}                                                                                              // 30
});                                                                                             // 31
                                                                                                // 32
//////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);

////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("rubaxa:sortable", {
  Sortable: Sortable
});

})();
