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
var Selector = Package['steedos:base'].Selector;
var Steedos = Package['steedos:base'].Steedos;
var AjaxCollection = Package['steedos:base'].AjaxCollection;
var SteedosDataManager = Package['steedos:base'].SteedosDataManager;
var SteedosOffice = Package['steedos:base'].SteedosOffice;
var billingManager = Package['steedos:base'].billingManager;
var SMSQueue = Package['steedos:smsqueue'].SMSQueue;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var WebhookQueue, __coffeescriptShare;

(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                        //
// packages/steedos_webhookqueue/lib/common/main.js                                                       //
//                                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                          //
WebhookQueue = new EventState();
////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                        //
// packages/steedos_webhookqueue/lib/common/webhooks.js                                                   //
//                                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                          //
WebhookQueue.collection = new Mongo.Collection('_webhook_queue');

var _validateDocument = function(webhook) {

	check(webhook, {
		webhook: Object,
		sent: Match.Optional(Boolean),
		sending: Match.Optional(Match.Integer),
		createdAt: Date,
		createdBy: Match.OneOf(String, null)
	});

};

WebhookQueue.send = function(options) {
	var currentUser = Meteor.isClient && Meteor.userId && Meteor.userId() || Meteor.isServer && (options.createdBy || '<SERVER>') || null
	var webhook = _.extend({
		createdAt: new Date(),
		createdBy: currentUser
	});

	if (Match.test(options, Object)) {
		webhook.webhook = _.pick(options, 'instance', 'current_approve', 'payload_url', 'content_type', 'action', 'from_user', 'to_users');
	}

	webhook.sent = false;
	webhook.sending = 0;

	_validateDocument(webhook);

	return WebhookQueue.collection.insert(webhook);
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                        //
// packages/steedos_webhookqueue/lib/server/api.js                                                        //
//                                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                          //
var isConfigured = false;
var sendWorker = function(task, interval) {

	if (WebhookQueue.debug) {
		console.log('WebhookQueue: Send worker started, using interval: ' + interval);
	}

	return Meteor.setInterval(function() {
		try {
			task();
		} catch (error) {
			if (WebhookQueue.debug) {
				console.log('WebhookQueue: Error while sending: ' + error.message);
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
WebhookQueue.Configure = function(options) {
	var self = this;
	options = _.extend({
		sendTimeout: 60000, // Timeout period for webhook send
	}, options);

	// Block multiple calls
	if (isConfigured) {
		throw new Error('WebhookQueue.Configure should not be called more than once!');
	}

	isConfigured = true;

	// Add debug info
	if (WebhookQueue.debug) {
		console.log('WebhookQueue.Configure', options);
	}

	self.sendWebhook = function(webhook) {
		if (WebhookQueue.debug) {
			console.log("sendWebhook");
			console.log(webhook);
		}

		HTTP.call('POST', webhook.webhook.payload_url, {
			headers: {
				"Content-Type": webhook.webhook.content_type
			},
			data: {
				instance: webhook.webhook.instance,
				current_approve: webhook.webhook.current_approve,
				action: webhook.webhook.action,
				from_user: webhook.webhook.from_user,
				to_users: webhook.webhook.to_users
			}
		}, function(error, result) {
			if (error) {
				console.error(error);
				WebhookQueue.collection.update({
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
				WebhookQueue.collection.remove({
					_id: webhook._id,
					errMsg: {
						$exists: false
					}
				});
			} else {
				// Update the webhook
				WebhookQueue.collection.update({
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
	var _querySend = function(options) {

		if (self.sendWebhook) {
			self.sendWebhook(options);
		}

		return {
			webhook: [options._id]
		};
	};

	self.serverSend = function(options) {
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
		WebhookQueue.collection._ensureIndex({
			createdAt: 1
		});
		WebhookQueue.collection._ensureIndex({
			sent: 1
		});
		WebhookQueue.collection._ensureIndex({
			sending: 1
		});


		var sendWebhook = function(webhook) {
			// Reserve webhook
			var now = +new Date();
			var timeoutAt = now + options.sendTimeout;
			var reserved = WebhookQueue.collection.update({
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
				WebhookQueue.serverSend(webhook);

			} // Else could not reserve
		}; // EO sendWebhook

		sendWorker(function() {

			if (isSendingWebhook) {
				return;
			}
			// Set send fence
			isSendingWebhook = true;

			var batchSize = options.sendBatchSize || 1;

			var now = +new Date();

			// Find webhooks that are not being or already sent
			var pendingWebhooks = WebhookQueue.collection.find({
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

			pendingWebhooks.forEach(function(webhook) {
				try {
					sendWebhook(webhook);
				} catch (error) {
					console.error(error.stack);
					console.log('WebhookQueue: Could not send doc id: "' + webhook._id + '", Error: ' + error.message);
					WebhookQueue.collection.update({
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
		if (WebhookQueue.debug) {
			console.log('WebhookQueue: Send server is disabled');
		}
	}

};

////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                        //
// packages/steedos_webhookqueue/server/startup.coffee                                                    //
//                                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                          //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.startup(function () {
  var ref;

  if ((ref = Meteor.settings.cron) != null ? ref.webhookqueue_interval : void 0) {
    return WebhookQueue.Configure({
      sendInterval: Meteor.settings.cron.webhookqueue_interval,
      sendBatchSize: 10,
      keepWebhooks: false
    });
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("steedos:webhookqueue", {
  WebhookQueue: WebhookQueue
});

})();

//# sourceURL=meteor://💻app/packages/steedos_webhookqueue.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc193ZWJob29rcXVldWUvc2VydmVyL3N0YXJ0dXAuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvc3RhcnR1cC5jb2ZmZWUiXSwibmFtZXMiOlsiTWV0ZW9yIiwic3RhcnR1cCIsInJlZiIsInNldHRpbmdzIiwiY3JvbiIsIndlYmhvb2txdWV1ZV9pbnRlcnZhbCIsIldlYmhvb2tRdWV1ZSIsIkNvbmZpZ3VyZSIsInNlbmRJbnRlcnZhbCIsInNlbmRCYXRjaFNpemUiLCJrZWVwV2ViaG9va3MiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE9BQU9DLE9BQVAsQ0FBZTtBQUNkLE1BQUFDLEdBQUE7O0FBQUEsT0FBQUEsTUFBQUYsT0FBQUcsUUFBQSxDQUFBQyxJQUFBLFlBQUFGLElBQXlCRyxxQkFBekIsR0FBeUIsTUFBekI7QUNFRyxXRERGQyxhQUFhQyxTQUFiLENBQ0M7QUFBQUMsb0JBQWNSLE9BQU9HLFFBQVAsQ0FBZ0JDLElBQWhCLENBQXFCQyxxQkFBbkM7QUFDQUkscUJBQWUsRUFEZjtBQUVBQyxvQkFBYztBQUZkLEtBREQsQ0NDRTtBQUtEO0FEUkgsRyIsImZpbGUiOiIvcGFja2FnZXMvc3RlZWRvc193ZWJob29rcXVldWUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJNZXRlb3Iuc3RhcnR1cCAtPlxyXG5cdGlmIE1ldGVvci5zZXR0aW5ncy5jcm9uPy53ZWJob29rcXVldWVfaW50ZXJ2YWxcclxuXHRcdFdlYmhvb2tRdWV1ZS5Db25maWd1cmVcclxuXHRcdFx0c2VuZEludGVydmFsOiBNZXRlb3Iuc2V0dGluZ3MuY3Jvbi53ZWJob29rcXVldWVfaW50ZXJ2YWxcclxuXHRcdFx0c2VuZEJhdGNoU2l6ZTogMTBcclxuXHRcdFx0a2VlcFdlYmhvb2tzOiBmYWxzZVxyXG4iLCJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcbiAgdmFyIHJlZjtcbiAgaWYgKChyZWYgPSBNZXRlb3Iuc2V0dGluZ3MuY3JvbikgIT0gbnVsbCA/IHJlZi53ZWJob29rcXVldWVfaW50ZXJ2YWwgOiB2b2lkIDApIHtcbiAgICByZXR1cm4gV2ViaG9va1F1ZXVlLkNvbmZpZ3VyZSh7XG4gICAgICBzZW5kSW50ZXJ2YWw6IE1ldGVvci5zZXR0aW5ncy5jcm9uLndlYmhvb2txdWV1ZV9pbnRlcnZhbCxcbiAgICAgIHNlbmRCYXRjaFNpemU6IDEwLFxuICAgICAga2VlcFdlYmhvb2tzOiBmYWxzZVxuICAgIH0pO1xuICB9XG59KTtcbiJdfQ==
