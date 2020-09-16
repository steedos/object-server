(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var _ = Package.underscore._;

/* Package-scope variables */
var DocumentRefCounter, Publication, Subscription, debugLog;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/reywood_publish-composite/packages/reywood_publish-composite.js                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/reywood:publish-composite/lib/doc_ref_counter.js                                                        //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
DocumentRefCounter = function(observer) {                                                                           // 1
    this.heap = {};                                                                                                 // 2
    this.observer = observer;                                                                                       // 3
};                                                                                                                  // 4
                                                                                                                    // 5
DocumentRefCounter.prototype.increment = function(collectionName, docId) {                                          // 6
    var key = collectionName + ":" + docId.valueOf();                                                               // 7
    if (!this.heap[key]) {                                                                                          // 8
        this.heap[key] = 0;                                                                                         // 9
    }                                                                                                               // 10
    this.heap[key]++;                                                                                               // 11
};                                                                                                                  // 12
                                                                                                                    // 13
DocumentRefCounter.prototype.decrement = function(collectionName, docId) {                                          // 14
    var key = collectionName + ":" + docId.valueOf();                                                               // 15
    if (this.heap[key]) {                                                                                           // 16
        this.heap[key]--;                                                                                           // 17
                                                                                                                    // 18
        this.observer.onChange(collectionName, docId, this.heap[key]);                                              // 19
    }                                                                                                               // 20
};                                                                                                                  // 21
                                                                                                                    // 22
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/reywood:publish-composite/lib/publication.js                                                            //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
Publication = function Publication(subscription, options, args) {                                                   // 1
    this.subscription = subscription;                                                                               // 2
    this.options = options;                                                                                         // 3
    this.args = args || [];                                                                                         // 4
    this.childrenOptions = options.children || [];                                                                  // 5
    this.publishedDocs = new PublishedDocumentList();                                                               // 6
    this.collectionName = options.collectionName;                                                                   // 7
};                                                                                                                  // 8
                                                                                                                    // 9
Publication.prototype.publish = function publish() {                                                                // 10
    this.cursor = this._getCursor();                                                                                // 11
                                                                                                                    // 12
    if (!this.cursor) { return; }                                                                                   // 13
                                                                                                                    // 14
    var collectionName = this._getCollectionName();                                                                 // 15
    var self = this;                                                                                                // 16
                                                                                                                    // 17
    this.observeHandle = this.cursor.observe({                                                                      // 18
        added: function added(doc) {                                                                                // 19
            var alreadyPublished = self.publishedDocs.has(doc._id);                                                 // 20
                                                                                                                    // 21
            if (alreadyPublished) {                                                                                 // 22
                debugLog('Publication.observeHandle.added', collectionName + ':' + doc._id + ' already published'); // 23
                self.publishedDocs.unflagForRemoval(doc._id);                                                       // 24
                self.subscription.changed(collectionName, doc._id, doc);                                            // 25
                self._republishChildrenOf(doc);                                                                     // 26
            } else {                                                                                                // 27
                self.publishedDocs.add(collectionName, doc._id);                                                    // 28
                self.subscription.added(collectionName, doc);                                                       // 29
                self._publishChildrenOf(doc);                                                                       // 30
            }                                                                                                       // 31
        },                                                                                                          // 32
        changed: function changed(newDoc) {                                                                         // 33
            debugLog('Publication.observeHandle.changed', collectionName + ':' + newDoc._id);                       // 34
            self._republishChildrenOf(newDoc);                                                                      // 35
        },                                                                                                          // 36
        removed: function removed(doc) {                                                                            // 37
            debugLog('Publication.observeHandle.removed', collectionName + ':' + doc._id);                          // 38
            self._removeDoc(collectionName, doc._id);                                                               // 39
        }                                                                                                           // 40
    });                                                                                                             // 41
                                                                                                                    // 42
    this.observeChangesHandle = this.cursor.observeChanges({                                                        // 43
        changed: function changed(id, fields) {                                                                     // 44
            debugLog('Publication.observeChangesHandle.changed', collectionName + ':' + id);                        // 45
            self.subscription.changed(collectionName, id, fields);                                                  // 46
        }                                                                                                           // 47
    });                                                                                                             // 48
};                                                                                                                  // 49
                                                                                                                    // 50
Publication.prototype.unpublish = function unpublish() {                                                            // 51
    debugLog('Publication.unpublish', this._getCollectionName());                                                   // 52
    this._stopObservingCursor();                                                                                    // 53
    this._unpublishAllDocuments();                                                                                  // 54
};                                                                                                                  // 55
                                                                                                                    // 56
Publication.prototype._republish = function _republish() {                                                          // 57
    this._stopObservingCursor();                                                                                    // 58
                                                                                                                    // 59
    this.publishedDocs.flagAllForRemoval();                                                                         // 60
                                                                                                                    // 61
    debugLog('Publication._republish', 'run .publish again');                                                       // 62
    this.publish();                                                                                                 // 63
                                                                                                                    // 64
    debugLog('Publication._republish', 'unpublish docs from old cursor');                                           // 65
    this._removeFlaggedDocs();                                                                                      // 66
};                                                                                                                  // 67
                                                                                                                    // 68
Publication.prototype._getCursor = function _getCursor() {                                                          // 69
    return this.options.find.apply(this.subscription.meteorSub, this.args);                                         // 70
};                                                                                                                  // 71
                                                                                                                    // 72
Publication.prototype._getCollectionName = function _getCollectionName() {                                          // 73
    return this.collectionName || (this.cursor && this.cursor._getCollectionName());                                // 74
};                                                                                                                  // 75
                                                                                                                    // 76
Publication.prototype._publishChildrenOf = function _publishChildrenOf(doc) {                                       // 77
    _.each(this.childrenOptions, function createChildPublication(options) {                                         // 78
        var pub = new Publication(this.subscription, options, [ doc ].concat(this.args));                           // 79
        this.publishedDocs.addChildPub(doc._id, pub);                                                               // 80
        pub.publish();                                                                                              // 81
    }, this);                                                                                                       // 82
};                                                                                                                  // 83
                                                                                                                    // 84
Publication.prototype._republishChildrenOf = function _republishChildrenOf(doc) {                                   // 85
    this.publishedDocs.eachChildPub(doc._id, function(publication) {                                                // 86
        publication.args[0] = doc;                                                                                  // 87
        publication._republish();                                                                                   // 88
    });                                                                                                             // 89
};                                                                                                                  // 90
                                                                                                                    // 91
Publication.prototype._unpublishAllDocuments = function _unpublishAllDocuments() {                                  // 92
    this.publishedDocs.eachDocument(function(doc) {                                                                 // 93
        this._removeDoc(doc.collectionName, doc.docId);                                                             // 94
    }, this);                                                                                                       // 95
};                                                                                                                  // 96
                                                                                                                    // 97
Publication.prototype._stopObservingCursor = function _stopObservingCursor() {                                      // 98
    debugLog('Publication._stopObservingCursor', 'stop observing cursor');                                          // 99
                                                                                                                    // 100
    if (this.observeHandle) {                                                                                       // 101
        this.observeHandle.stop();                                                                                  // 102
        delete this.observeHandle;                                                                                  // 103
    }                                                                                                               // 104
                                                                                                                    // 105
    if (this.observeChangesHandle) {                                                                                // 106
        this.observeChangesHandle.stop();                                                                           // 107
        delete this.observeChangesHandle;                                                                           // 108
    }                                                                                                               // 109
};                                                                                                                  // 110
                                                                                                                    // 111
Publication.prototype._removeFlaggedDocs = function _removeFlaggedDocs() {                                          // 112
    this.publishedDocs.eachDocument(function(doc) {                                                                 // 113
        if (doc.isFlaggedForRemoval()) {                                                                            // 114
            this._removeDoc(doc.collectionName, doc.docId);                                                         // 115
        }                                                                                                           // 116
    }, this);                                                                                                       // 117
};                                                                                                                  // 118
                                                                                                                    // 119
Publication.prototype._removeDoc = function _removeDoc(collectionName, docId) {                                     // 120
    this.subscription.removed(collectionName, docId);                                                               // 121
    this._unpublishChildrenOf(docId);                                                                               // 122
    this.publishedDocs.remove(docId);                                                                               // 123
};                                                                                                                  // 124
                                                                                                                    // 125
Publication.prototype._unpublishChildrenOf = function _unpublishChildrenOf(docId) {                                 // 126
    debugLog('Publication._unpublishChildrenOf', 'unpublishing children of ' + this._getCollectionName() + ':' + docId);
                                                                                                                    // 128
    this.publishedDocs.eachChildPub(docId, function(publication) {                                                  // 129
        publication.unpublish();                                                                                    // 130
    });                                                                                                             // 131
};                                                                                                                  // 132
                                                                                                                    // 133
                                                                                                                    // 134
var PublishedDocumentList = function() {                                                                            // 135
    this.documents = {};                                                                                            // 136
};                                                                                                                  // 137
                                                                                                                    // 138
PublishedDocumentList.prototype.add = function add(collectionName, docId) {                                         // 139
    var key = docId.valueOf();                                                                                      // 140
                                                                                                                    // 141
    if (!this.documents[key]) {                                                                                     // 142
        this.documents[key] = new PublishedDocument(collectionName, docId);                                         // 143
    }                                                                                                               // 144
};                                                                                                                  // 145
                                                                                                                    // 146
PublishedDocumentList.prototype.addChildPub = function addChildPub(docId, publication) {                            // 147
    if (!publication) { return; }                                                                                   // 148
                                                                                                                    // 149
    var key = docId.valueOf();                                                                                      // 150
    var doc = this.documents[key];                                                                                  // 151
                                                                                                                    // 152
    if (typeof doc === 'undefined') {                                                                               // 153
        throw new Error('Doc not found in list: ' + key);                                                           // 154
    }                                                                                                               // 155
                                                                                                                    // 156
    this.documents[key].addChildPub(publication);                                                                   // 157
};                                                                                                                  // 158
                                                                                                                    // 159
PublishedDocumentList.prototype.get = function get(docId) {                                                         // 160
    var key = docId.valueOf();                                                                                      // 161
    return this.documents[key];                                                                                     // 162
};                                                                                                                  // 163
                                                                                                                    // 164
PublishedDocumentList.prototype.remove = function remove(docId) {                                                   // 165
    var key = docId.valueOf();                                                                                      // 166
    delete this.documents[key];                                                                                     // 167
};                                                                                                                  // 168
                                                                                                                    // 169
PublishedDocumentList.prototype.has = function has(docId) {                                                         // 170
    return !!this.get(docId);                                                                                       // 171
};                                                                                                                  // 172
                                                                                                                    // 173
PublishedDocumentList.prototype.eachDocument = function eachDocument(callback, context) {                           // 174
    _.each(this.documents, function execCallbackOnDoc(doc) {                                                        // 175
        callback.call(this, doc);                                                                                   // 176
    }, context || this);                                                                                            // 177
};                                                                                                                  // 178
                                                                                                                    // 179
PublishedDocumentList.prototype.eachChildPub = function eachChildPub(docId, callback) {                             // 180
    var doc = this.get(docId);                                                                                      // 181
                                                                                                                    // 182
    if (doc) {                                                                                                      // 183
        doc.eachChildPub(callback);                                                                                 // 184
    }                                                                                                               // 185
};                                                                                                                  // 186
                                                                                                                    // 187
PublishedDocumentList.prototype.getIds = function getIds() {                                                        // 188
    var docIds = [];                                                                                                // 189
                                                                                                                    // 190
    this.eachDocument(function(doc) {                                                                               // 191
        docIds.push(doc.docId);                                                                                     // 192
    });                                                                                                             // 193
                                                                                                                    // 194
    return docIds;                                                                                                  // 195
};                                                                                                                  // 196
                                                                                                                    // 197
PublishedDocumentList.prototype.unflagForRemoval = function unflagForRemoval(docId) {                               // 198
    var doc = this.get(docId);                                                                                      // 199
                                                                                                                    // 200
    if (doc) {                                                                                                      // 201
        doc.unflagForRemoval();                                                                                     // 202
    }                                                                                                               // 203
};                                                                                                                  // 204
                                                                                                                    // 205
PublishedDocumentList.prototype.flagAllForRemoval = function flagAllForRemoval() {                                  // 206
    this.eachDocument(function flag(doc) {                                                                          // 207
        doc.flagForRemoval();                                                                                       // 208
    });                                                                                                             // 209
};                                                                                                                  // 210
                                                                                                                    // 211
                                                                                                                    // 212
var PublishedDocument = function(collectionName, docId) {                                                           // 213
    this.collectionName = collectionName;                                                                           // 214
    this.docId = docId;                                                                                             // 215
    this.childPublications = [];                                                                                    // 216
    this._isFlaggedForRemoval = false;                                                                              // 217
};                                                                                                                  // 218
                                                                                                                    // 219
PublishedDocument.prototype.addChildPub = function addChildPub(childPublication) {                                  // 220
    this.childPublications.push(childPublication);                                                                  // 221
};                                                                                                                  // 222
                                                                                                                    // 223
PublishedDocument.prototype.eachChildPub = function eachChildPub(callback) {                                        // 224
    for (var i = 0; i < this.childPublications.length; i++) {                                                       // 225
        callback(this.childPublications[i]);                                                                        // 226
    }                                                                                                               // 227
};                                                                                                                  // 228
                                                                                                                    // 229
PublishedDocument.prototype.isFlaggedForRemoval = function isFlaggedForRemoval() {                                  // 230
    return this._isFlaggedForRemoval;                                                                               // 231
};                                                                                                                  // 232
                                                                                                                    // 233
PublishedDocument.prototype.unflagForRemoval = function unflagForRemoval() {                                        // 234
    this._isFlaggedForRemoval = false;                                                                              // 235
};                                                                                                                  // 236
                                                                                                                    // 237
PublishedDocument.prototype.flagForRemoval = function flagForRemoval() {                                            // 238
    this._isFlaggedForRemoval = true;                                                                               // 239
};                                                                                                                  // 240
                                                                                                                    // 241
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/reywood:publish-composite/lib/subscription.js                                                           //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
Subscription = function(meteorSub) {                                                                                // 1
    var self = this;                                                                                                // 2
    this.meteorSub = meteorSub;                                                                                     // 3
    this.docHash = {};                                                                                              // 4
    this.refCounter = new DocumentRefCounter({                                                                      // 5
        onChange: function(collectionName, docId, refCount) {                                                       // 6
            debugLog("Subscription.refCounter.onChange", collectionName + ":" + docId.valueOf() + " " + refCount);  // 7
            if (refCount <= 0) {                                                                                    // 8
                meteorSub.removed(collectionName, docId);                                                           // 9
                self._removeDocHash(collectionName, docId);                                                         // 10
            }                                                                                                       // 11
        }                                                                                                           // 12
    });                                                                                                             // 13
};                                                                                                                  // 14
                                                                                                                    // 15
Subscription.prototype.added = function(collectionName, doc) {                                                      // 16
    this.refCounter.increment(collectionName, doc._id);                                                             // 17
                                                                                                                    // 18
    if (this._hasDocChanged(collectionName, doc._id, doc)) {                                                        // 19
        debugLog("Subscription.added", collectionName + ":" + doc._id);                                             // 20
        this.meteorSub.added(collectionName, doc._id, doc);                                                         // 21
        this._addDocHash(collectionName, doc);                                                                      // 22
    }                                                                                                               // 23
};                                                                                                                  // 24
                                                                                                                    // 25
Subscription.prototype.changed = function(collectionName, id, changes) {                                            // 26
    if (this._shouldSendChanges(collectionName, id, changes)) {                                                     // 27
        debugLog("Subscription.changed", collectionName + ":" + id);                                                // 28
        this.meteorSub.changed(collectionName, id, changes);                                                        // 29
        this._updateDocHash(collectionName, id, changes);                                                           // 30
    }                                                                                                               // 31
};                                                                                                                  // 32
                                                                                                                    // 33
Subscription.prototype.removed = function(collectionName, id) {                                                     // 34
    debugLog("Subscription.removed", collectionName + ":" + id.valueOf());                                          // 35
    this.refCounter.decrement(collectionName, id);                                                                  // 36
};                                                                                                                  // 37
                                                                                                                    // 38
Subscription.prototype._addDocHash = function(collectionName, doc) {                                                // 39
    this.docHash[this._buildHashKey(collectionName, doc._id)] = doc;                                                // 40
};                                                                                                                  // 41
                                                                                                                    // 42
Subscription.prototype._updateDocHash = function(collectionName, id, changes) {                                     // 43
    var key = this._buildHashKey(collectionName, id);                                                               // 44
    var existingDoc = this.docHash[key] || {};                                                                      // 45
    this.docHash[key] = _.extend(existingDoc, changes);                                                             // 46
};                                                                                                                  // 47
                                                                                                                    // 48
Subscription.prototype._shouldSendChanges = function(collectionName, id, changes) {                                 // 49
    return this._isDocPublished(collectionName, id) &&                                                              // 50
        this._hasDocChanged(collectionName, id, changes);                                                           // 51
};                                                                                                                  // 52
                                                                                                                    // 53
Subscription.prototype._isDocPublished = function(collectionName, id) {                                             // 54
    var key = this._buildHashKey(collectionName, id);                                                               // 55
    return !!this.docHash[key];                                                                                     // 56
};                                                                                                                  // 57
                                                                                                                    // 58
Subscription.prototype._hasDocChanged = function(collectionName, id, doc) {                                         // 59
    var existingDoc = this.docHash[this._buildHashKey(collectionName, id)];                                         // 60
                                                                                                                    // 61
    if (!existingDoc) { return true; }                                                                              // 62
                                                                                                                    // 63
    for (var i in doc) {                                                                                            // 64
        if (doc.hasOwnProperty(i) && !_.isEqual(doc[i], existingDoc[i])) {                                          // 65
            return true;                                                                                            // 66
        }                                                                                                           // 67
    }                                                                                                               // 68
                                                                                                                    // 69
    return false;                                                                                                   // 70
};                                                                                                                  // 71
                                                                                                                    // 72
Subscription.prototype._removeDocHash = function(collectionName, id) {                                              // 73
    var key = this._buildHashKey(collectionName, id);                                                               // 74
    delete this.docHash[key];                                                                                       // 75
};                                                                                                                  // 76
                                                                                                                    // 77
Subscription.prototype._buildHashKey = function(collectionName, id) {                                               // 78
    return collectionName + "::" + id.valueOf();                                                                    // 79
};                                                                                                                  // 80
                                                                                                                    // 81
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/reywood:publish-composite/lib/publish_composite.js                                                      //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
Meteor.publishComposite = function(name, options) {                                                                 // 1
    return Meteor.publish(name, function() {                                                                        // 2
        var subscription = new Subscription(this);                                                                  // 3
        var args = Array.prototype.slice.apply(arguments);                                                          // 4
        var instanceOptions = prepareOptions.call(this, options, args);                                             // 5
        var pubs = [];                                                                                              // 6
                                                                                                                    // 7
        _.each(instanceOptions, function(opt) {                                                                     // 8
            var pub = new Publication(subscription, opt);                                                           // 9
            pub.publish();                                                                                          // 10
            pubs.push(pub);                                                                                         // 11
        });                                                                                                         // 12
                                                                                                                    // 13
        this.onStop(function() {                                                                                    // 14
            _.each(pubs, function(pub) {                                                                            // 15
                pub.unpublish();                                                                                    // 16
            });                                                                                                     // 17
        });                                                                                                         // 18
                                                                                                                    // 19
        this.ready();                                                                                               // 20
    });                                                                                                             // 21
};                                                                                                                  // 22
                                                                                                                    // 23
debugLog = function() { };                                                                                          // 24
                                                                                                                    // 25
Meteor.publishComposite.enableDebugLogging = function() {                                                           // 26
    debugLog = function(source, message) {                                                                          // 27
        while (source.length < 35) { source += ' '; }                                                               // 28
        console.log('[' + source + '] ' + message);                                                                 // 29
    };                                                                                                              // 30
};                                                                                                                  // 31
                                                                                                                    // 32
var prepareOptions = function(options, args) {                                                                      // 33
    var preparedOptions = options;                                                                                  // 34
                                                                                                                    // 35
    if (typeof preparedOptions === 'function') {                                                                    // 36
        preparedOptions = preparedOptions.apply(this, args);                                                        // 37
    }                                                                                                               // 38
                                                                                                                    // 39
    if (!preparedOptions) {                                                                                         // 40
        return [];                                                                                                  // 41
    }                                                                                                               // 42
                                                                                                                    // 43
    if (!_.isArray(preparedOptions)) {                                                                              // 44
        preparedOptions = [ preparedOptions ];                                                                      // 45
    }                                                                                                               // 46
                                                                                                                    // 47
    return preparedOptions;                                                                                         // 48
};                                                                                                                  // 49
                                                                                                                    // 50
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("reywood:publish-composite");

})();
