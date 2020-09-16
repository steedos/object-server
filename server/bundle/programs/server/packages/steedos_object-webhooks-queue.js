(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var EventState = Package['raix:eventstate'].EventState;
var check = Package.check.check;
var Match = Package.check.Match;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var _ = Package.underscore._;
var EJSON = Package.ejson.EJSON;
var Random = Package.random.Random;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var ObjectWebhooksQueue, __coffeescriptShare;

(function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/steedos_object-webhooks-queue/lib/common/main.js                                                         //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
ObjectWebhooksQueue = new EventState();
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/steedos_object-webhooks-queue/lib/common/webhooks.js                                                     //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
ObjectWebhooksQueue.collection = new Mongo.Collection('object_webhooks_queue');

var _validateDocument = function (webhook) {

	check(webhook, {
		webhook: Object,
		sent: Match.Optional(Boolean),
		sending: Match.Optional(Match.Integer),
		createdAt: Date,
		createdBy: Match.OneOf(String, null)
	});

};

ObjectWebhooksQueue.send = function (options) {
	var currentUser = Meteor.isClient && Meteor.userId && Meteor.userId() || Meteor.isServer && (options.createdBy || '<SERVER>') || null
	var webhook = _.extend({
		createdAt: new Date(),
		createdBy: currentUser
	});

	if (Match.test(options, Object)) {
		webhook.webhook = _.pick(options, 'data', 'payload_url', 'content_type', 'action', 'actionUserInfo', 'objectName', 'objectDisplayName', 'nameFieldKey', 'redirectUrl');
	}

	webhook.sent = false;
	webhook.sending = 0;

	_validateDocument(webhook);

	return ObjectWebhooksQueue.collection.insert(webhook);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/steedos_object-webhooks-queue/lib/server/api.js                                                          //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
var isConfigured = false;
var sendWorker = function (task, interval) {

	if (ObjectWebhooksQueue.debug) {
		console.log('ObjectWebhooksQueue: Send worker started, using interval: ' + interval);
	}

	return Meteor.setInterval(function () {
		try {
			task();
		} catch (error) {
			if (ObjectWebhooksQueue.debug) {
				console.log('ObjectWebhooksQueue: Error while sending: ' + error.message);
			}
		}
	}, interval);
};

/*
	options: {
		// Controls the sending interval
		sendInterval: Match.Optional(Number),
		// Controls the sending batch size per interval
		sendBatchSize: Match.Optional(Number),
		// Allow optional keeping notifications in collection
		keepWebhooks: Match.Optional(Boolean)
	}
*/
ObjectWebhooksQueue.Configure = function (options) {
	var self = this;
	options = _.extend({
		sendTimeout: 60000, // Timeout period for webhook send
	}, options);

	// Block multiple calls
	if (isConfigured) {
		throw new Error('ObjectWebhooksQueue.Configure should not be called more than once!');
	}

	isConfigured = true;

	// Add debug info
	if (ObjectWebhooksQueue.debug) {
		console.log('ObjectWebhooksQueue.Configure', options);
	}

	self.sendWebhook = function (webhook) {
		if (ObjectWebhooksQueue.debug) {
			console.log("sendWebhook");
			console.log(webhook);
		}

		HTTP.call('POST', webhook.webhook.payload_url, {
			headers: {
				"Content-Type": webhook.webhook.content_type
			},
			data: {
				data: webhook.webhook.data,
				action: webhook.webhook.action,
				actionUserInfo: webhook.webhook.actionUserInfo,
				objectName: webhook.webhook.objectName,
				objectDisplayName: webhook.webhook.objectDisplayName,
				nameFieldKey: webhook.webhook.nameFieldKey,
				redirectUrl: webhook.webhook.redirectUrl
			}
		}, function (error, result) {
			if (error) {
				console.error(error);
				ObjectWebhooksQueue.collection.update({
					_id: webhook._id
				}, {
					$set: {
						// error message
						errMsg: error
					}
				});
				return
			}

			if (!options.keepWebhooks) {
				// Pr. Default we will remove webhooks
				ObjectWebhooksQueue.collection.remove({
					_id: webhook._id,
					errMsg: {
						$exists: false
					}
				});
			} else {
				// Update the webhook
				ObjectWebhooksQueue.collection.update({
					_id: webhook._id
				}, {
					$set: {
						// Mark as sent
						sent: true,
						// Set the sent date
						sentAt: new Date(),
						// Not being sent anymore
						sending: 0
					}
				});

			}
		});

	}

	// Universal send function
	var _querySend = function (options) {

		if (self.sendWebhook) {
			self.sendWebhook(options);
		}

		return {
			webhook: [options._id]
		};
	};

	self.serverSend = function (options) {
		options = options || {};
		return _querySend(options);
	};


	// This interval will allow only one webhook to be sent at a time, it
	// will check for new webhooks at every `options.sendInterval`
	// (default interval is 15000 ms)
	//
	// It looks in webhooks collection to see if theres any pending
	// webhooks, if so it will try to reserve the pending webhook.
	// If successfully reserved the send is started.
	//
	// If webhook.query is type string, it's assumed to be a json string
	// version of the query selector. Making it able to carry `$` properties in
	// the mongo collection.
	//
	// Pr. default webhooks are removed from the collection after send have
	// completed. Setting `options.keepWebhooks` will update and keep the
	// webhook eg. if needed for historical reasons.
	//
	// After the send have completed a "send" event will be emitted with a
	// status object containing webhook id and the send result object.
	//
	var isSendingWebhook = false;

	if (options.sendInterval !== null) {

		// This will require index since we sort webhooks by createdAt
		ObjectWebhooksQueue.collection._ensureIndex({
			createdAt: 1
		});
		ObjectWebhooksQueue.collection._ensureIndex({
			sent: 1
		});
		ObjectWebhooksQueue.collection._ensureIndex({
			sending: 1
		});


		var sendWebhook = function (webhook) {
			// Reserve webhook
			var now = +new Date();
			var timeoutAt = now + options.sendTimeout;
			var reserved = ObjectWebhooksQueue.collection.update({
				_id: webhook._id,
				sent: false, // xxx: need to make sure this is set on create
				sending: {
					$lt: now
				}
			}, {
				$set: {
					sending: timeoutAt,
				}
			});

			// Make sure we only handle webhooks reserved by this
			// instance
			if (reserved) {

				// Send the webhook
				var result = ObjectWebhooksQueue.serverSend(webhook);



				// // Emit the send
				// self.emit('send', {
				// 	webhook: webhook._id,
				// 	result: result
				// });

			} // Else could not reserve
		}; // EO sendWebhook

		sendWorker(function () {

			if (isSendingWebhook) {
				return;
			}
			// Set send fence
			isSendingWebhook = true;

			var batchSize = options.sendBatchSize || 1;

			var now = +new Date();

			// Find webhooks that are not being or already sent
			var pendingWebhooks = ObjectWebhooksQueue.collection.find({
				$and: [
					// Message is not sent
					{
						sent: false
					},
					// And not being sent by other instances
					{
						sending: {
							$lt: now
						}
					},
					// And no error
					{
						errMsg: {
							$exists: false
						}
					}
				]
			}, {
				// Sort by created date
				sort: {
					createdAt: 1
				},
				limit: batchSize
			});

			pendingWebhooks.forEach(function (webhook) {
				try {
					sendWebhook(webhook);
				} catch (error) {

					if (ObjectWebhooksQueue.debug) {
						console.log('ObjectWebhooksQueue: Could not send webhook id: "' + webhook._id + '", Error: ' + error.message);
					}

					console.error(error.stack);
					console.log('ObjectWebhooksQueue: Could not send webhook id: "' + webhook._id + '", Error: ' + error.message);
					ObjectWebhooksQueue.collection.update({
						_id: webhook._id
					}, {
						$set: {
							// error message
							errMsg: error.message
						}
					});
				}
			}); // EO forEach

			// Remove the send fence
			isSendingWebhook = false;
		}, options.sendInterval || 15000); // Default every 15th sec

	} else {
		if (ObjectWebhooksQueue.debug) {
			console.log('ObjectWebhooksQueue: Send server is disabled');
		}
	}

};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/steedos_object-webhooks-queue/server/startup.coffee                                                      //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.startup(function () {
  var ref;

  if ((ref = Meteor.settings.cron) != null ? ref.objectwebhooksqueue_interval : void 0) {
    return ObjectWebhooksQueue.Configure({
      sendInterval: Meteor.settings.cron.objectwebhooksqueue_interval,
      sendBatchSize: 10,
      keepWebhooks: false
    });
  }
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("steedos:object-webhooks-queue", {
  ObjectWebhooksQueue: ObjectWebhooksQueue
});

})();

//# sourceURL=meteor://💻app/packages/steedos_object-webhooks-queue.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19vYmplY3Qtd2ViaG9va3MtcXVldWUvc2VydmVyL3N0YXJ0dXAuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvc3RhcnR1cC5jb2ZmZWUiXSwibmFtZXMiOlsiTWV0ZW9yIiwic3RhcnR1cCIsInJlZiIsInNldHRpbmdzIiwiY3JvbiIsIm9iamVjdHdlYmhvb2tzcXVldWVfaW50ZXJ2YWwiLCJPYmplY3RXZWJob29rc1F1ZXVlIiwiQ29uZmlndXJlIiwic2VuZEludGVydmFsIiwic2VuZEJhdGNoU2l6ZSIsImtlZXBXZWJob29rcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsT0FBT0MsT0FBUCxDQUFlO0FBQ2QsTUFBQUMsR0FBQTs7QUFBQSxPQUFBQSxNQUFBRixPQUFBRyxRQUFBLENBQUFDLElBQUEsWUFBQUYsSUFBeUJHLDRCQUF6QixHQUF5QixNQUF6QjtBQ0VHLFdEREZDLG9CQUFvQkMsU0FBcEIsQ0FDQztBQUFBQyxvQkFBY1IsT0FBT0csUUFBUCxDQUFnQkMsSUFBaEIsQ0FBcUJDLDRCQUFuQztBQUNBSSxxQkFBZSxFQURmO0FBRUFDLG9CQUFjO0FBRmQsS0FERCxDQ0NFO0FBS0Q7QURSSCxHIiwiZmlsZSI6Ii9wYWNrYWdlcy9zdGVlZG9zX29iamVjdC13ZWJob29rcy1xdWV1ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIk1ldGVvci5zdGFydHVwIC0+XG5cdGlmIE1ldGVvci5zZXR0aW5ncy5jcm9uPy5vYmplY3R3ZWJob29rc3F1ZXVlX2ludGVydmFsXG5cdFx0T2JqZWN0V2ViaG9va3NRdWV1ZS5Db25maWd1cmVcblx0XHRcdHNlbmRJbnRlcnZhbDogTWV0ZW9yLnNldHRpbmdzLmNyb24ub2JqZWN0d2ViaG9va3NxdWV1ZV9pbnRlcnZhbFxuXHRcdFx0c2VuZEJhdGNoU2l6ZTogMTBcblx0XHRcdGtlZXBXZWJob29rczogZmFsc2VcbiIsIk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuICB2YXIgcmVmO1xuICBpZiAoKHJlZiA9IE1ldGVvci5zZXR0aW5ncy5jcm9uKSAhPSBudWxsID8gcmVmLm9iamVjdHdlYmhvb2tzcXVldWVfaW50ZXJ2YWwgOiB2b2lkIDApIHtcbiAgICByZXR1cm4gT2JqZWN0V2ViaG9va3NRdWV1ZS5Db25maWd1cmUoe1xuICAgICAgc2VuZEludGVydmFsOiBNZXRlb3Iuc2V0dGluZ3MuY3Jvbi5vYmplY3R3ZWJob29rc3F1ZXVlX2ludGVydmFsLFxuICAgICAgc2VuZEJhdGNoU2l6ZTogMTAsXG4gICAgICBrZWVwV2ViaG9va3M6IGZhbHNlXG4gICAgfSk7XG4gIH1cbn0pO1xuIl19
