(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Email = Package.email.Email;
var EmailInternals = Package.email.EmailInternals;
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
var MailQueue, __coffeescriptShare;

(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/steedos_mailqueue/lib/common/main.js                                                    //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
MailQueue = new EventState();
//////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/steedos_mailqueue/lib/common/mails.js                                                   //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
MailQueue.collection = new Mongo.Collection('_mail_queue');

var _validateDocument = function(mail) {

	check(mail, {
		mail: Object,
		sent: Match.Optional(Boolean),
		sending: Match.Optional(Match.Integer),
		createdAt: Date,
		createdBy: Match.OneOf(String, null)
	});

};

MailQueue.send = function(options) {
	var currentUser = Meteor.isClient && Meteor.userId && Meteor.userId() || Meteor.isServer && (options.createdBy || '<SERVER>') || null
	var mail = _.extend({
		createdAt: new Date(),
		createdBy: currentUser
	});

	if (Match.test(options, Object)) {
		mail.mail = _.pick(options, 'from', 'to', 'cc', 'bcc', 'replyTo', 'subject', 'text', 'html', 'headers', 'attachments', 'mailComposer');
	}

	mail.sent = false;
	mail.sending = 0;

	_validateDocument(mail);

	return MailQueue.collection.insert(mail);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/steedos_mailqueue/lib/server/api.js                                                     //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
var isConfigured = false;
var sendWorker = function(task, interval) {

	if (MailQueue.debug) {
		console.log('MailQueue: Send worker started, using interval: ' + interval);
	}

	return Meteor.setInterval(function() {
		try {
			task();
		} catch (error) {
			console.log('MailQueue: Error while sending: ' + error.message);
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
		keepMails: Match.Optional(Boolean)
	}
*/
MailQueue.Configure = function(options) {
	var self = this;
	options = _.extend({
		sendTimeout: 60000, // Timeout period for mail send
	}, options);

	// Block multiple calls
	if (isConfigured) {
		throw new Error('MailQueue.Configure should not be called more than once!');
	}

	isConfigured = true;

	// Add debug info
	if (MailQueue.debug) {
		console.log('MailQueue.Configure', options);
	}

	self.sendMail = function(mail) {
		if (MailQueue.debug) {
			console.log("sendMail");
			console.log(mail);
		}

		Email.send(mail.mail);
	}

	// Universal send function
	var _querySend = function(options) {

		if (self.sendMail) {
			self.sendMail(options);
		}

		return {
			mail: [options._id]
		};
	};

	self.serverSend = function(options) {
		options = options || {};
		return _querySend(options);
	};


	// This interval will allow only one mail to be sent at a time, it
	// will check for new mails at every `options.sendInterval`
	// (default interval is 15000 ms)
	//
	// It looks in mails collection to see if theres any pending
	// mails, if so it will try to reserve the pending mail.
	// If successfully reserved the send is started.
	//
	// If mail.query is type string, it's assumed to be a json string
	// version of the query selector. Making it able to carry `$` properties in
	// the mongo collection.
	//
	// Pr. default mails are removed from the collection after send have
	// completed. Setting `options.keepMails` will update and keep the
	// mail eg. if needed for historical reasons.
	//
	// After the send have completed a "send" event will be emitted with a
	// status object containing mail id and the send result object.
	//
	var isSendingMail = false;

	if (options.sendInterval !== null) {

		// This will require index since we sort mails by createdAt
		MailQueue.collection._ensureIndex({
			createdAt: 1
		});
		MailQueue.collection._ensureIndex({
			sent: 1
		});
		MailQueue.collection._ensureIndex({
			sending: 1
		});


		var sendMail = function(mail) {
			// Reserve mail
			var now = +new Date();
			var timeoutAt = now + options.sendTimeout;
			var reserved = MailQueue.collection.update({
				_id: mail._id,
				sent: false, // xxx: need to make sure this is set on create
				sending: {
					$lt: now
				}
			}, {
				$set: {
					sending: timeoutAt,
				}
			});

			// Make sure we only handle mails reserved by this
			// instance
			if (reserved) {

				// Send the mail
				var result = MailQueue.serverSend(mail);

				if (!options.keepMails) {
					// Pr. Default we will remove mails
					MailQueue.collection.remove({
						_id: mail._id
					});
				} else {

					// Update the mail
					MailQueue.collection.update({
						_id: mail._id
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

				// Emit the send
				self.emit('send', {
					mail: mail._id,
					result: result
				});

			} // Else could not reserve
		}; // EO sendMail

		sendWorker(function() {

			if (isSendingMail) {
				return;
			}
			// Set send fence
			isSendingMail = true;

			var batchSize = options.sendBatchSize || 1;

			var now = +new Date();

			// Find mails that are not being or already sent
			var pendingMails = MailQueue.collection.find({
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

			pendingMails.forEach(function(mail) {
				try {
					sendMail(mail);
				} catch (error) {
					console.log('MailQueue: Could not send mail id: "' + mail._id + '", Error: ' + error.message);
					MailQueue.collection.update({
						_id: mail._id
					}, {
						$set: {
							// error message
							errMsg: error.message
						}
					});
				}
			}); // EO forEach

			// Remove the send fence
			isSendingMail = false;
		}, options.sendInterval || 15000); // Default every 15th sec

	} else {
		if (MailQueue.debug) {
			console.log('MailQueue: Send server is disabled');
		}
	}

};

//////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/steedos_mailqueue/server/startup.coffee                                                 //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.startup(function () {
  var ref;

  if ((ref = Meteor.settings.cron) != null ? ref.mailqueue_interval : void 0) {
    return MailQueue.Configure({
      sendInterval: Meteor.settings.cron.mailqueue_interval,
      sendBatchSize: 10,
      keepMails: false
    });
  }
});
//////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("steedos:mailqueue", {
  MailQueue: MailQueue
});

})();

//# sourceURL=meteor://💻app/packages/steedos_mailqueue.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19tYWlscXVldWUvc2VydmVyL3N0YXJ0dXAuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvc3RhcnR1cC5jb2ZmZWUiXSwibmFtZXMiOlsiTWV0ZW9yIiwic3RhcnR1cCIsInJlZiIsInNldHRpbmdzIiwiY3JvbiIsIm1haWxxdWV1ZV9pbnRlcnZhbCIsIk1haWxRdWV1ZSIsIkNvbmZpZ3VyZSIsInNlbmRJbnRlcnZhbCIsInNlbmRCYXRjaFNpemUiLCJrZWVwTWFpbHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE9BQU9DLE9BQVAsQ0FBZTtBQUNkLE1BQUFDLEdBQUE7O0FBQUEsT0FBQUEsTUFBQUYsT0FBQUcsUUFBQSxDQUFBQyxJQUFBLFlBQUFGLElBQXlCRyxrQkFBekIsR0FBeUIsTUFBekI7QUNFRyxXRERGQyxVQUFVQyxTQUFWLENBQ0M7QUFBQUMsb0JBQWNSLE9BQU9HLFFBQVAsQ0FBZ0JDLElBQWhCLENBQXFCQyxrQkFBbkM7QUFDQUkscUJBQWUsRUFEZjtBQUVBQyxpQkFBVztBQUZYLEtBREQsQ0NDRTtBQUtEO0FEUkgsRyIsImZpbGUiOiIvcGFja2FnZXMvc3RlZWRvc19tYWlscXVldWUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJNZXRlb3Iuc3RhcnR1cCAtPlxuXHRpZiBNZXRlb3Iuc2V0dGluZ3MuY3Jvbj8ubWFpbHF1ZXVlX2ludGVydmFsXG5cdFx0TWFpbFF1ZXVlLkNvbmZpZ3VyZVxuXHRcdFx0c2VuZEludGVydmFsOiBNZXRlb3Iuc2V0dGluZ3MuY3Jvbi5tYWlscXVldWVfaW50ZXJ2YWxcblx0XHRcdHNlbmRCYXRjaFNpemU6IDEwXG5cdFx0XHRrZWVwTWFpbHM6IGZhbHNlXG4iLCJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcbiAgdmFyIHJlZjtcbiAgaWYgKChyZWYgPSBNZXRlb3Iuc2V0dGluZ3MuY3JvbikgIT0gbnVsbCA/IHJlZi5tYWlscXVldWVfaW50ZXJ2YWwgOiB2b2lkIDApIHtcbiAgICByZXR1cm4gTWFpbFF1ZXVlLkNvbmZpZ3VyZSh7XG4gICAgICBzZW5kSW50ZXJ2YWw6IE1ldGVvci5zZXR0aW5ncy5jcm9uLm1haWxxdWV1ZV9pbnRlcnZhbCxcbiAgICAgIHNlbmRCYXRjaFNpemU6IDEwLFxuICAgICAga2VlcE1haWxzOiBmYWxzZVxuICAgIH0pO1xuICB9XG59KTtcbiJdfQ==
