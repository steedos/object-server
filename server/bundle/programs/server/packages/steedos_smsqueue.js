(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var EventState = Package['raix:eventstate'].EventState;
var check = Package.check.check;
var Match = Package.check.Match;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var _ = Package.underscore._;
var EJSON = Package.ejson.EJSON;
var Random = Package.random.Random;
var CollectionHooks = Package['matb33:collection-hooks'].CollectionHooks;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var SMSQueue, WebServiceSMSQueue, __coffeescriptShare;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:smsqueue":{"checkNpm.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/steedos_smsqueue/checkNpm.js                                                                          //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
let checkNpmVersions;
module.link("meteor/tmeasday:check-npm-versions", {
  checkNpmVersions(v) {
    checkNpmVersions = v;
  }

}, 0);

if (Meteor.settings && Meteor.settings.sms && Meteor.settings.sms.aliyun) {
  checkNpmVersions({
    "aliyun-sms-node": "^1.1.2"
  }, 'steedos:smsqueue');
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"common":{"main.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/steedos_smsqueue/lib/common/main.js                                                                   //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
SMSQueue = new EventState();
WebServiceSMSQueue = new EventState();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sms.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/steedos_smsqueue/lib/common/sms.js                                                                    //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
SMSQueue.collection = new Meteor.Collection('_sms_queue');
WebServiceSMSQueue.collection = SMSQueue.collection;

var _validateDocument = function (sms) {
  check(sms, {
    sms: Object,
    sent: Match.Optional(Boolean),
    sending: Match.Optional(Match.Integer),
    createdAt: Date,
    createdBy: Match.OneOf(String, null)
  });
};

SMSQueue.send = function (options, spaceId) {
  var currentUser = Meteor.isClient && Meteor.userId && Meteor.userId() || Meteor.isServer && (options.createdBy || '<SERVER>') || null;

  var sms = _.extend({
    createdAt: new Date(),
    createdBy: currentUser
  });

  if (Match.test(options, Object)) {
    sms.sms = _.pick(options, 'Format', 'Action', 'ParamString', 'RecNum', 'SignName', 'TemplateCode', 'msg');
  }

  sms.sent = false;
  sms.sending = 0;

  _validateDocument(sms);

  if (options.createdBy) {
    sms.owner = options.createdBy;
  }

  if (spaceId) {
    sms.space = spaceId;
  }

  return SMSQueue.collection.insert(sms);
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"api.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/steedos_smsqueue/lib/server/api.js                                                                    //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
var isConfigured = false;

var sendWorker = function (task, interval) {
  if (SMSQueue.debug) {
    console.log('SMSQueue: Send worker started, using interval: ' + interval);
  }

  return Meteor.setInterval(function () {
    try {
      task();
    } catch (error) {
      if (SMSQueue.debug) {
        console.log('SMSQueue: Error while sending: ' + error.message);
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
		keepSMS: Match.Optional(Boolean)
	}
*/


SMSQueue.Configure = function (options) {
  var self = this;
  options = _.extend({
    sendTimeout: 60000 // Timeout period for sms send

  }, options); // Block multiple calls

  if (isConfigured) {
    throw new Error('SMSQueue.Configure should not be called more than once!');
  }

  isConfigured = true; // Add debug info

  if (SMSQueue.debug) {
    console.log('SMSQueue.Configure', options);
  }

  var SMS = require('aliyun-sms-node'),
      smsSender;

  smsSender = new SMS({
    AccessKeyId: options.accessKeyId,
    AccessKeySecret: options.accessKeySecret
  });

  self.sendSMS = function (sms) {
    if (SMSQueue.debug) {
      console.log("sendSMS");
      console.log(sms);
    }

    smsSender.send(sms.sms).catch(err => {
      console.error(err);
    });
  }; // Universal send function


  var _querySend = function (options) {
    if (self.sendSMS) {
      self.sendSMS(options);
    }

    return {
      sms: [options._id]
    };
  };

  self.serverSend = function (options) {
    options = options || {};
    return _querySend(options);
  }; // This interval will allow only one sms to be sent at a time, it
  // will check for new sms at every `options.sendInterval`
  // (default interval is 15000 ms)
  //
  // It looks in sms collection to see if theres any pending
  // sms, if so it will try to reserve the pending sms.
  // If successfully reserved the send is started.
  //
  // If sms.query is type string, it's assumed to be a json string
  // version of the query selector. Making it able to carry `$` properties in
  // the mongo collection.
  //
  // Pr. default sms are removed from the collection after send have
  // completed. Setting `options.keepSMS` will update and keep the
  // sms eg. if needed for historical reasons.
  //
  // After the send have completed a "send" event will be emitted with a
  // status object containing sms id and the send result object.
  //


  var isSending = false;

  if (options.sendInterval !== null) {
    // This will require index since we sort sms by createdAt
    SMSQueue.collection._ensureIndex({
      createdAt: 1
    });

    SMSQueue.collection._ensureIndex({
      sent: 1
    });

    SMSQueue.collection._ensureIndex({
      sending: 1
    });

    var sendSMS = function (sms) {
      // Reserve sms
      var now = +new Date();
      var timeoutAt = now + options.sendTimeout;
      var reserved = SMSQueue.collection.update({
        _id: sms._id,
        sent: false,
        // xxx: need to make sure this is set on create
        sending: {
          $lt: now
        }
      }, {
        $set: {
          sending: timeoutAt
        }
      }); // Make sure we only handle sms reserved by this
      // instance

      if (reserved) {
        // Send the sms
        var result = SMSQueue.serverSend(sms);

        if (!options.keepSMS) {
          // Pr. Default we will remove sms
          SMSQueue.collection.remove({
            _id: sms._id
          });
        } else {
          // Update the sms
          SMSQueue.collection.update({
            _id: sms._id
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
        } // Emit the send


        self.emit('send', {
          sms: sms._id,
          result: result
        });
      } // Else could not reserve

    }; // EO sendSMS


    sendWorker(function () {
      if (isSending) {
        return;
      } // Set send fence


      isSending = true;
      var batchSize = options.sendBatchSize || 1;
      var now = +new Date(); // Find sms that are not being or already sent

      var pendingSMS = SMSQueue.collection.find({
        $and: [// Message is not sent
        {
          sent: false
        }, // And not being sent by other instances
        {
          sending: {
            $lt: now
          }
        }]
      }, {
        // Sort by created date
        sort: {
          createdAt: 1
        },
        limit: batchSize
      });
      pendingSMS.forEach(function (sms) {
        try {
          sendSMS(sms);
        } catch (error) {
          if (SMSQueue.debug) {
            console.log('SMSQueue: Could not send sms id: "' + sms._id + '", Error: ' + error.message);
          }
        }
      }); // EO forEach
      // Remove the send fence

      isSending = false;
    }, options.sendInterval || 15000); // Default every 15th sec
  } else {
    if (SMSQueue.debug) {
      console.log('SMSQueue: Send server is disabled');
    }
  }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"webservice.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/steedos_smsqueue/lib/server/webservice.js                                                             //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
var isConfigured = false;

var request = require('superagent');

var sendWorker = function (task, interval) {
  if (WebServiceSMSQueue.debug) {
    console.log('WebServiceSMSQueue: Send worker started, using interval: ' + interval);
  }

  return Meteor.setInterval(function () {
    try {
      task();
    } catch (error) {
      if (WebServiceSMSQueue.debug) {
        console.log('WebServiceSMSQueue: Error while sending: ' + error.message);
      }
    }
  }, interval);
};

var sendToWebService = function (doc, url, spaceToken, signname) {
  var message = _.clone(doc);

  message.signname = signname;
  delete message._id;
  request.post(url).send(message).set('Authorization', 'Bearer ' + spaceToken).end(function (err, res) {
    if (err) {
      return console.error(err);
    }
  });
};
/*
	options: {
		// Controls the sending interval
		sendInterval: Match.Optional(Number),
		// Controls the sending batch size per interval
		sendBatchSize: Match.Optional(Number),
		// Allow optional keeping notifications in collection
		keepSMS: Match.Optional(Boolean)
	}
*/


WebServiceSMSQueue.Configure = function (options) {
  var self = this;
  options = _.extend({
    sendTimeout: 60000 // Timeout period for sms send

  }, options); // Block multiple calls

  if (isConfigured) {
    throw new Error('WebServiceSMSQueue.Configure should not be called more than once!');
  }

  isConfigured = true; // Add debug info

  if (WebServiceSMSQueue.debug) {
    console.log('WebServiceSMSQueue.Configure', options);
  }

  var url = options.url;
  var spaceToken = options.spaceToken;
  var signname = options.signname;

  self.sendSMS = function (sms) {
    if (WebServiceSMSQueue.debug) {
      console.log("sendSMS");
      console.log(sms);
    }

    sendToWebService(sms, url, spaceToken, signname);
  }; // Universal send function


  var _querySend = function (options) {
    if (self.sendSMS) {
      self.sendSMS(options);
    }

    return {
      sms: [options._id]
    };
  };

  self.serverSend = function (options) {
    options = options || {};
    return _querySend(options);
  }; // This interval will allow only one sms to be sent at a time, it
  // will check for new sms at every `options.sendInterval`
  // (default interval is 15000 ms)
  //
  // It looks in sms collection to see if theres any pending
  // sms, if so it will try to reserve the pending sms.
  // If successfully reserved the send is started.
  //
  // If sms.query is type string, it's assumed to be a json string
  // version of the query selector. Making it able to carry `$` properties in
  // the mongo collection.
  //
  // Pr. default sms are removed from the collection after send have
  // completed. Setting `options.keepSMS` will update and keep the
  // sms eg. if needed for historical reasons.
  //
  // After the send have completed a "send" event will be emitted with a
  // status object containing sms id and the send result object.
  //


  var isSending = false;

  if (options.sendInterval !== null) {
    // This will require index since we sort sms by createdAt
    WebServiceSMSQueue.collection._ensureIndex({
      createdAt: 1
    });

    WebServiceSMSQueue.collection._ensureIndex({
      sent: 1
    });

    WebServiceSMSQueue.collection._ensureIndex({
      sending: 1
    });

    var sendSMS = function (sms) {
      // Reserve sms
      var now = +new Date();
      var timeoutAt = now + options.sendTimeout;
      var reserved = WebServiceSMSQueue.collection.update({
        _id: sms._id,
        sent: false,
        // xxx: need to make sure this is set on create
        sending: {
          $lt: now
        }
      }, {
        $set: {
          sending: timeoutAt
        }
      }); // Make sure we only handle sms reserved by this
      // instance

      if (reserved) {
        // Send the sms
        var result = WebServiceSMSQueue.serverSend(sms);

        if (!options.keepSMS) {
          // Pr. Default we will remove sms
          WebServiceSMSQueue.collection.remove({
            _id: sms._id
          });
        } else {
          // Update the sms
          WebServiceSMSQueue.collection.update({
            _id: sms._id
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
        } // Emit the send


        self.emit('send', {
          sms: sms._id,
          result: result
        });
      } // Else could not reserve

    }; // EO sendSMS


    sendWorker(function () {
      if (isSending) {
        return;
      } // Set send fence


      isSending = true;
      var batchSize = options.sendBatchSize || 1;
      var now = +new Date(); // Find sms that are not being or already sent

      var pendingSMS = WebServiceSMSQueue.collection.find({
        $and: [// Message is not sent
        {
          sent: false
        }, // And not being sent by other instances
        {
          sending: {
            $lt: now
          }
        }]
      }, {
        // Sort by created date
        sort: {
          createdAt: 1
        },
        limit: batchSize
      });
      pendingSMS.forEach(function (sms) {
        try {
          sendSMS(sms);
        } catch (error) {
          if (WebServiceSMSQueue.debug) {
            console.log('WebServiceSMSQueue: Could not send sms id: "' + sms._id + '", Error: ' + error.message);
          }
        }
      }); // EO forEach
      // Remove the send fence

      isSending = false;
    }, options.sendInterval || 15000); // Default every 15th sec
  } else {
    if (WebServiceSMSQueue.debug) {
      console.log('WebServiceSMSQueue: Send server is disabled');
    }
  }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"server":{"startup.coffee":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/steedos_smsqueue/server/startup.coffee                                                                //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.startup(function () {
  var ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;

  if (((ref = Meteor.settings.sms) != null ? (ref1 = ref.webservice) != null ? ref1.smsqueue_interval : void 0 : void 0) && (((ref2 = Meteor.settings.sms) != null ? (ref3 = ref2.aliyun) != null ? ref3.smsqueue_interval : void 0 : void 0) || ((ref4 = Meteor.settings.sms) != null ? (ref5 = ref4.qcloud) != null ? ref5.smsqueue_interval : void 0 : void 0))) {
    throw new Meteor.Error('sms.webservice cannot be configured with sms.aliyun or sms.qcloud');
  }

  if ((ref6 = Meteor.settings.sms) != null ? (ref7 = ref6.aliyun) != null ? ref7.smsqueue_interval : void 0 : void 0) {
    SMSQueue.Configure({
      sendInterval: Meteor.settings.sms.aliyun.smsqueue_interval,
      sendBatchSize: 10,
      keepSMS: true,
      accessKeyId: Meteor.settings.sms.aliyun.accessKeyId,
      accessKeySecret: Meteor.settings.sms.aliyun.accessKeySecret
    });
  }

  if ((ref8 = Meteor.settings.sms) != null ? (ref9 = ref8.webservice) != null ? ref9.smsqueue_interval : void 0 : void 0) {
    return WebServiceSMSQueue.Configure({
      sendInterval: Meteor.settings.sms.webservice.smsqueue_interval,
      url: Meteor.settings.sms.webservice.url,
      spaceToken: Meteor.settings.sms.webservice.space_token,
      signname: Meteor.settings.sms.webservice.signname,
      sendBatchSize: 10,
      keepSMS: true
    });
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".coffee"
  ]
});

require("/node_modules/meteor/steedos:smsqueue/checkNpm.js");
require("/node_modules/meteor/steedos:smsqueue/lib/common/main.js");
require("/node_modules/meteor/steedos:smsqueue/lib/common/sms.js");
require("/node_modules/meteor/steedos:smsqueue/lib/server/api.js");
require("/node_modules/meteor/steedos:smsqueue/lib/server/webservice.js");
require("/node_modules/meteor/steedos:smsqueue/server/startup.coffee");

/* Exports */
Package._define("steedos:smsqueue", {
  SMSQueue: SMSQueue
});

})();

//# sourceURL=meteor://💻app/packages/steedos_smsqueue.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpzbXNxdWV1ZS9jaGVja05wbS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpzbXNxdWV1ZS9saWIvY29tbW9uL21haW4uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3M6c21zcXVldWUvbGliL2NvbW1vbi9zbXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3M6c21zcXVldWUvbGliL3NlcnZlci9hcGkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3M6c21zcXVldWUvbGliL3NlcnZlci93ZWJzZXJ2aWNlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX3Ntc3F1ZXVlL3NlcnZlci9zdGFydHVwLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL3N0YXJ0dXAuY29mZmVlIl0sIm5hbWVzIjpbImNoZWNrTnBtVmVyc2lvbnMiLCJtb2R1bGUiLCJsaW5rIiwidiIsIk1ldGVvciIsInNldHRpbmdzIiwic21zIiwiYWxpeXVuIiwiU01TUXVldWUiLCJFdmVudFN0YXRlIiwiV2ViU2VydmljZVNNU1F1ZXVlIiwiY29sbGVjdGlvbiIsIkNvbGxlY3Rpb24iLCJfdmFsaWRhdGVEb2N1bWVudCIsImNoZWNrIiwiT2JqZWN0Iiwic2VudCIsIk1hdGNoIiwiT3B0aW9uYWwiLCJCb29sZWFuIiwic2VuZGluZyIsIkludGVnZXIiLCJjcmVhdGVkQXQiLCJEYXRlIiwiY3JlYXRlZEJ5IiwiT25lT2YiLCJTdHJpbmciLCJzZW5kIiwib3B0aW9ucyIsInNwYWNlSWQiLCJjdXJyZW50VXNlciIsImlzQ2xpZW50IiwidXNlcklkIiwiaXNTZXJ2ZXIiLCJfIiwiZXh0ZW5kIiwidGVzdCIsInBpY2siLCJvd25lciIsInNwYWNlIiwiaW5zZXJ0IiwiaXNDb25maWd1cmVkIiwic2VuZFdvcmtlciIsInRhc2siLCJpbnRlcnZhbCIsImRlYnVnIiwiY29uc29sZSIsImxvZyIsInNldEludGVydmFsIiwiZXJyb3IiLCJtZXNzYWdlIiwiQ29uZmlndXJlIiwic2VsZiIsInNlbmRUaW1lb3V0IiwiRXJyb3IiLCJTTVMiLCJyZXF1aXJlIiwic21zU2VuZGVyIiwiQWNjZXNzS2V5SWQiLCJhY2Nlc3NLZXlJZCIsIkFjY2Vzc0tleVNlY3JldCIsImFjY2Vzc0tleVNlY3JldCIsInNlbmRTTVMiLCJjYXRjaCIsImVyciIsIl9xdWVyeVNlbmQiLCJfaWQiLCJzZXJ2ZXJTZW5kIiwiaXNTZW5kaW5nIiwic2VuZEludGVydmFsIiwiX2Vuc3VyZUluZGV4Iiwibm93IiwidGltZW91dEF0IiwicmVzZXJ2ZWQiLCJ1cGRhdGUiLCIkbHQiLCIkc2V0IiwicmVzdWx0Iiwia2VlcFNNUyIsInJlbW92ZSIsInNlbnRBdCIsImVtaXQiLCJiYXRjaFNpemUiLCJzZW5kQmF0Y2hTaXplIiwicGVuZGluZ1NNUyIsImZpbmQiLCIkYW5kIiwic29ydCIsImxpbWl0IiwiZm9yRWFjaCIsInJlcXVlc3QiLCJzZW5kVG9XZWJTZXJ2aWNlIiwiZG9jIiwidXJsIiwic3BhY2VUb2tlbiIsInNpZ25uYW1lIiwiY2xvbmUiLCJwb3N0Iiwic2V0IiwiZW5kIiwicmVzIiwic3RhcnR1cCIsInJlZiIsInJlZjEiLCJyZWYyIiwicmVmMyIsInJlZjQiLCJyZWY1IiwicmVmNiIsInJlZjciLCJyZWY4IiwicmVmOSIsIndlYnNlcnZpY2UiLCJzbXNxdWV1ZV9pbnRlcnZhbCIsInFjbG91ZCIsInNwYWNlX3Rva2VuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSUEsZ0JBQUo7QUFBcUJDLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZLG9DQUFaLEVBQWlEO0FBQUNGLGtCQUFnQixDQUFDRyxDQUFELEVBQUc7QUFBQ0gsb0JBQWdCLEdBQUNHLENBQWpCO0FBQW1COztBQUF4QyxDQUFqRCxFQUEyRixDQUEzRjs7QUFJ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T0FBT0MsUUFBUCxDQUFnQkMsR0FBaEIsQ0FBb0JDLE1BQXBCLENBQTJCc0Q7QUFKNUMsS0FERDtBQ1FDOztBRERGLE9BQUFpRCxPQUFBMUcsT0FBQUMsUUFBQSxDQUFBQyxHQUFBLGFBQUF5RyxPQUFBRCxLQUFBRSxVQUFBLFlBQUFELEtBQW9DRSxpQkFBcEMsR0FBb0MsTUFBcEMsR0FBb0MsTUFBcEM7QUNHRyxXREZGdkcsbUJBQW1CeUMsU0FBbkIsQ0FDQztBQUFBa0Isb0JBQWNqRSxPQUFPQyxRQUFQLENBQWdCQyxHQUFoQixDQUFvQjBHLFVBQXBCLENBQStCQyxpQkFBN0M7QUFDQXBCLFdBQUt6RixPQUFPQyxRQUFQLENBQWdCQyxHQUFoQixDQUFvQjBHLFVBQXBCLENBQStCbkIsR0FEcEM7QUFFQUMsa0JBQVkxRixPQUFPQyxRQUFQLENBQWdCQyxHQUFoQixDQUFvQjBHLFVBQXBCLENBQStCRyxXQUYzQztBQUdBcEIsZ0JBQVUzRixPQUFPQyxRQUFQLENBQWdCQyxHQUFoQixDQUFvQjBHLFVBQXBCLENBQStCakIsUUFIekM7QUFJQVoscUJBQWUsRUFKZjtBQUtBTCxlQUFTO0FBTFQsS0FERCxDQ0VFO0FBUUQ7QUR2QkgsRyIsImZpbGUiOiIvcGFja2FnZXMvc3RlZWRvc19zbXNxdWV1ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XHJcblx0Y2hlY2tOcG1WZXJzaW9uc1xyXG59IGZyb20gJ21ldGVvci90bWVhc2RheTpjaGVjay1ucG0tdmVyc2lvbnMnO1xyXG5cclxuaWYgKE1ldGVvci5zZXR0aW5ncyAmJiBNZXRlb3Iuc2V0dGluZ3Muc21zICYmIE1ldGVvci5zZXR0aW5ncy5zbXMuYWxpeXVuKSB7XHJcblx0Y2hlY2tOcG1WZXJzaW9ucyh7XHJcblx0XHRcImFsaXl1bi1zbXMtbm9kZVwiOiBcIl4xLjEuMlwiXHJcblx0fSwgJ3N0ZWVkb3M6c21zcXVldWUnKTtcclxufSIsIlNNU1F1ZXVlID0gbmV3IEV2ZW50U3RhdGUoKTtcclxuV2ViU2VydmljZVNNU1F1ZXVlID0gbmV3IEV2ZW50U3RhdGUoKTsiLCJTTVNRdWV1ZS5jb2xsZWN0aW9uID0gbmV3IE1ldGVvci5Db2xsZWN0aW9uKCdfc21zX3F1ZXVlJyk7XHJcbldlYlNlcnZpY2VTTVNRdWV1ZS5jb2xsZWN0aW9uID0gU01TUXVldWUuY29sbGVjdGlvbjtcclxudmFyIF92YWxpZGF0ZURvY3VtZW50ID0gZnVuY3Rpb24oc21zKSB7XHJcblxyXG5cdGNoZWNrKHNtcywge1xyXG5cdFx0c21zOiBPYmplY3QsXHJcblx0XHRzZW50OiBNYXRjaC5PcHRpb25hbChCb29sZWFuKSxcclxuXHRcdHNlbmRpbmc6IE1hdGNoLk9wdGlvbmFsKE1hdGNoLkludGVnZXIpLFxyXG5cdFx0Y3JlYXRlZEF0OiBEYXRlLFxyXG5cdFx0Y3JlYXRlZEJ5OiBNYXRjaC5PbmVPZihTdHJpbmcsIG51bGwpXHJcblx0fSk7XHJcblxyXG59O1xyXG5cclxuU01TUXVldWUuc2VuZCA9IGZ1bmN0aW9uKG9wdGlvbnMsIHNwYWNlSWQpIHtcclxuXHR2YXIgY3VycmVudFVzZXIgPSBNZXRlb3IuaXNDbGllbnQgJiYgTWV0ZW9yLnVzZXJJZCAmJiBNZXRlb3IudXNlcklkKCkgfHwgTWV0ZW9yLmlzU2VydmVyICYmIChvcHRpb25zLmNyZWF0ZWRCeSB8fCAnPFNFUlZFUj4nKSB8fCBudWxsXHJcblx0dmFyIHNtcyA9IF8uZXh0ZW5kKHtcclxuXHRcdGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcclxuXHRcdGNyZWF0ZWRCeTogY3VycmVudFVzZXJcclxuXHR9KTtcclxuXHJcblx0aWYgKE1hdGNoLnRlc3Qob3B0aW9ucywgT2JqZWN0KSkge1xyXG5cdFx0c21zLnNtcyA9IF8ucGljayhvcHRpb25zLCAnRm9ybWF0JywgJ0FjdGlvbicsICdQYXJhbVN0cmluZycsICdSZWNOdW0nLCAnU2lnbk5hbWUnLCAnVGVtcGxhdGVDb2RlJywgJ21zZycpO1xyXG5cdH1cclxuXHJcblx0c21zLnNlbnQgPSBmYWxzZTtcclxuXHRzbXMuc2VuZGluZyA9IDA7XHJcblxyXG5cdF92YWxpZGF0ZURvY3VtZW50KHNtcyk7XHJcblxyXG5cdGlmKG9wdGlvbnMuY3JlYXRlZEJ5KXtcclxuXHRcdHNtcy5vd25lciA9IG9wdGlvbnMuY3JlYXRlZEJ5XHJcblx0fVxyXG5cclxuXHRpZihzcGFjZUlkKXtcclxuXHRcdHNtcy5zcGFjZSA9IHNwYWNlSWRcclxuXHR9XHJcblxyXG5cdHJldHVybiBTTVNRdWV1ZS5jb2xsZWN0aW9uLmluc2VydChzbXMpO1xyXG59OyIsInZhciBpc0NvbmZpZ3VyZWQgPSBmYWxzZTtcclxudmFyIHNlbmRXb3JrZXIgPSBmdW5jdGlvbih0YXNrLCBpbnRlcnZhbCkge1xyXG5cclxuXHRpZiAoU01TUXVldWUuZGVidWcpIHtcclxuXHRcdGNvbnNvbGUubG9nKCdTTVNRdWV1ZTogU2VuZCB3b3JrZXIgc3RhcnRlZCwgdXNpbmcgaW50ZXJ2YWw6ICcgKyBpbnRlcnZhbCk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gTWV0ZW9yLnNldEludGVydmFsKGZ1bmN0aW9uKCkge1xyXG5cdFx0dHJ5IHtcclxuXHRcdFx0dGFzaygpO1xyXG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcclxuXHRcdFx0aWYgKFNNU1F1ZXVlLmRlYnVnKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ1NNU1F1ZXVlOiBFcnJvciB3aGlsZSBzZW5kaW5nOiAnICsgZXJyb3IubWVzc2FnZSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9LCBpbnRlcnZhbCk7XHJcbn07XHJcblxyXG5cclxuXHJcbi8qXHJcblx0b3B0aW9uczoge1xyXG5cdFx0Ly8gQ29udHJvbHMgdGhlIHNlbmRpbmcgaW50ZXJ2YWxcclxuXHRcdHNlbmRJbnRlcnZhbDogTWF0Y2guT3B0aW9uYWwoTnVtYmVyKSxcclxuXHRcdC8vIENvbnRyb2xzIHRoZSBzZW5kaW5nIGJhdGNoIHNpemUgcGVyIGludGVydmFsXHJcblx0XHRzZW5kQmF0Y2hTaXplOiBNYXRjaC5PcHRpb25hbChOdW1iZXIpLFxyXG5cdFx0Ly8gQWxsb3cgb3B0aW9uYWwga2VlcGluZyBub3RpZmljYXRpb25zIGluIGNvbGxlY3Rpb25cclxuXHRcdGtlZXBTTVM6IE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pXHJcblx0fVxyXG4qL1xyXG5TTVNRdWV1ZS5Db25maWd1cmUgPSBmdW5jdGlvbihvcHRpb25zKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cdG9wdGlvbnMgPSBfLmV4dGVuZCh7XHJcblx0XHRzZW5kVGltZW91dDogNjAwMDAsIC8vIFRpbWVvdXQgcGVyaW9kIGZvciBzbXMgc2VuZFxyXG5cdH0sIG9wdGlvbnMpO1xyXG5cclxuXHQvLyBCbG9jayBtdWx0aXBsZSBjYWxsc1xyXG5cdGlmIChpc0NvbmZpZ3VyZWQpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignU01TUXVldWUuQ29uZmlndXJlIHNob3VsZCBub3QgYmUgY2FsbGVkIG1vcmUgdGhhbiBvbmNlIScpO1xyXG5cdH1cclxuXHJcblx0aXNDb25maWd1cmVkID0gdHJ1ZTtcclxuXHJcblx0Ly8gQWRkIGRlYnVnIGluZm9cclxuXHRpZiAoU01TUXVldWUuZGVidWcpIHtcclxuXHRcdGNvbnNvbGUubG9nKCdTTVNRdWV1ZS5Db25maWd1cmUnLCBvcHRpb25zKTtcclxuXHR9XHJcblxyXG5cdHZhciBTTVMgPSByZXF1aXJlKCdhbGl5dW4tc21zLW5vZGUnKSxcclxuXHRzbXNTZW5kZXI7XHJcblxyXG5cdHNtc1NlbmRlciA9IG5ldyBTTVMoe1xyXG5cdFx0QWNjZXNzS2V5SWQ6IG9wdGlvbnMuYWNjZXNzS2V5SWQsXHJcblx0XHRBY2Nlc3NLZXlTZWNyZXQ6IG9wdGlvbnMuYWNjZXNzS2V5U2VjcmV0XHJcblx0fSk7XHJcblxyXG5cdHNlbGYuc2VuZFNNUyA9IGZ1bmN0aW9uKHNtcykge1xyXG5cdFx0aWYgKFNNU1F1ZXVlLmRlYnVnKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKFwic2VuZFNNU1wiKTtcclxuXHRcdFx0Y29uc29sZS5sb2coc21zKTtcclxuXHRcdH1cclxuXHJcblx0XHRzbXNTZW5kZXIuc2VuZChzbXMuc21zKS5jYXRjaChlcnIgPT4ge1xyXG5cdFx0XHRjb25zb2xlLmVycm9yKGVycilcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0Ly8gVW5pdmVyc2FsIHNlbmQgZnVuY3Rpb25cclxuXHR2YXIgX3F1ZXJ5U2VuZCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuXHJcblx0XHRpZiAoc2VsZi5zZW5kU01TKSB7XHJcblx0XHRcdHNlbGYuc2VuZFNNUyhvcHRpb25zKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4ge1xyXG5cdFx0XHRzbXM6IFtvcHRpb25zLl9pZF1cclxuXHRcdH07XHJcblx0fTtcclxuXHJcblx0c2VsZi5zZXJ2ZXJTZW5kID0gZnVuY3Rpb24ob3B0aW9ucykge1xyXG5cdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblx0XHRyZXR1cm4gX3F1ZXJ5U2VuZChvcHRpb25zKTtcclxuXHR9O1xyXG5cclxuXHJcblx0Ly8gVGhpcyBpbnRlcnZhbCB3aWxsIGFsbG93IG9ubHkgb25lIHNtcyB0byBiZSBzZW50IGF0IGEgdGltZSwgaXRcclxuXHQvLyB3aWxsIGNoZWNrIGZvciBuZXcgc21zIGF0IGV2ZXJ5IGBvcHRpb25zLnNlbmRJbnRlcnZhbGBcclxuXHQvLyAoZGVmYXVsdCBpbnRlcnZhbCBpcyAxNTAwMCBtcylcclxuXHQvL1xyXG5cdC8vIEl0IGxvb2tzIGluIHNtcyBjb2xsZWN0aW9uIHRvIHNlZSBpZiB0aGVyZXMgYW55IHBlbmRpbmdcclxuXHQvLyBzbXMsIGlmIHNvIGl0IHdpbGwgdHJ5IHRvIHJlc2VydmUgdGhlIHBlbmRpbmcgc21zLlxyXG5cdC8vIElmIHN1Y2Nlc3NmdWxseSByZXNlcnZlZCB0aGUgc2VuZCBpcyBzdGFydGVkLlxyXG5cdC8vXHJcblx0Ly8gSWYgc21zLnF1ZXJ5IGlzIHR5cGUgc3RyaW5nLCBpdCdzIGFzc3VtZWQgdG8gYmUgYSBqc29uIHN0cmluZ1xyXG5cdC8vIHZlcnNpb24gb2YgdGhlIHF1ZXJ5IHNlbGVjdG9yLiBNYWtpbmcgaXQgYWJsZSB0byBjYXJyeSBgJGAgcHJvcGVydGllcyBpblxyXG5cdC8vIHRoZSBtb25nbyBjb2xsZWN0aW9uLlxyXG5cdC8vXHJcblx0Ly8gUHIuIGRlZmF1bHQgc21zIGFyZSByZW1vdmVkIGZyb20gdGhlIGNvbGxlY3Rpb24gYWZ0ZXIgc2VuZCBoYXZlXHJcblx0Ly8gY29tcGxldGVkLiBTZXR0aW5nIGBvcHRpb25zLmtlZXBTTVNgIHdpbGwgdXBkYXRlIGFuZCBrZWVwIHRoZVxyXG5cdC8vIHNtcyBlZy4gaWYgbmVlZGVkIGZvciBoaXN0b3JpY2FsIHJlYXNvbnMuXHJcblx0Ly9cclxuXHQvLyBBZnRlciB0aGUgc2VuZCBoYXZlIGNvbXBsZXRlZCBhIFwic2VuZFwiIGV2ZW50IHdpbGwgYmUgZW1pdHRlZCB3aXRoIGFcclxuXHQvLyBzdGF0dXMgb2JqZWN0IGNvbnRhaW5pbmcgc21zIGlkIGFuZCB0aGUgc2VuZCByZXN1bHQgb2JqZWN0LlxyXG5cdC8vXHJcblx0dmFyIGlzU2VuZGluZyA9IGZhbHNlO1xyXG5cclxuXHRpZiAob3B0aW9ucy5zZW5kSW50ZXJ2YWwgIT09IG51bGwpIHtcclxuXHJcblx0XHQvLyBUaGlzIHdpbGwgcmVxdWlyZSBpbmRleCBzaW5jZSB3ZSBzb3J0IHNtcyBieSBjcmVhdGVkQXRcclxuXHRcdFNNU1F1ZXVlLmNvbGxlY3Rpb24uX2Vuc3VyZUluZGV4KHtcclxuXHRcdFx0Y3JlYXRlZEF0OiAxXHJcblx0XHR9KTtcclxuXHRcdFNNU1F1ZXVlLmNvbGxlY3Rpb24uX2Vuc3VyZUluZGV4KHtcclxuXHRcdFx0c2VudDogMVxyXG5cdFx0fSk7XHJcblx0XHRTTVNRdWV1ZS5jb2xsZWN0aW9uLl9lbnN1cmVJbmRleCh7XHJcblx0XHRcdHNlbmRpbmc6IDFcclxuXHRcdH0pO1xyXG5cclxuXHJcblx0XHR2YXIgc2VuZFNNUyA9IGZ1bmN0aW9uKHNtcykge1xyXG5cdFx0XHQvLyBSZXNlcnZlIHNtc1xyXG5cdFx0XHR2YXIgbm93ID0gK25ldyBEYXRlKCk7XHJcblx0XHRcdHZhciB0aW1lb3V0QXQgPSBub3cgKyBvcHRpb25zLnNlbmRUaW1lb3V0O1xyXG5cdFx0XHR2YXIgcmVzZXJ2ZWQgPSBTTVNRdWV1ZS5jb2xsZWN0aW9uLnVwZGF0ZSh7XHJcblx0XHRcdFx0X2lkOiBzbXMuX2lkLFxyXG5cdFx0XHRcdHNlbnQ6IGZhbHNlLCAvLyB4eHg6IG5lZWQgdG8gbWFrZSBzdXJlIHRoaXMgaXMgc2V0IG9uIGNyZWF0ZVxyXG5cdFx0XHRcdHNlbmRpbmc6IHtcclxuXHRcdFx0XHRcdCRsdDogbm93XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9LCB7XHJcblx0XHRcdFx0JHNldDoge1xyXG5cdFx0XHRcdFx0c2VuZGluZzogdGltZW91dEF0LFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHQvLyBNYWtlIHN1cmUgd2Ugb25seSBoYW5kbGUgc21zIHJlc2VydmVkIGJ5IHRoaXNcclxuXHRcdFx0Ly8gaW5zdGFuY2VcclxuXHRcdFx0aWYgKHJlc2VydmVkKSB7XHJcblxyXG5cdFx0XHRcdC8vIFNlbmQgdGhlIHNtc1xyXG5cdFx0XHRcdHZhciByZXN1bHQgPSBTTVNRdWV1ZS5zZXJ2ZXJTZW5kKHNtcyk7XHJcblxyXG5cdFx0XHRcdGlmICghb3B0aW9ucy5rZWVwU01TKSB7XHJcblx0XHRcdFx0XHQvLyBQci4gRGVmYXVsdCB3ZSB3aWxsIHJlbW92ZSBzbXNcclxuXHRcdFx0XHRcdFNNU1F1ZXVlLmNvbGxlY3Rpb24ucmVtb3ZlKHtcclxuXHRcdFx0XHRcdFx0X2lkOiBzbXMuX2lkXHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cclxuXHRcdFx0XHRcdC8vIFVwZGF0ZSB0aGUgc21zXHJcblx0XHRcdFx0XHRTTVNRdWV1ZS5jb2xsZWN0aW9uLnVwZGF0ZSh7XHJcblx0XHRcdFx0XHRcdF9pZDogc21zLl9pZFxyXG5cdFx0XHRcdFx0fSwge1xyXG5cdFx0XHRcdFx0XHQkc2V0OiB7XHJcblx0XHRcdFx0XHRcdFx0Ly8gTWFyayBhcyBzZW50XHJcblx0XHRcdFx0XHRcdFx0c2VudDogdHJ1ZSxcclxuXHRcdFx0XHRcdFx0XHQvLyBTZXQgdGhlIHNlbnQgZGF0ZVxyXG5cdFx0XHRcdFx0XHRcdHNlbnRBdDogbmV3IERhdGUoKSxcclxuXHRcdFx0XHRcdFx0XHQvLyBOb3QgYmVpbmcgc2VudCBhbnltb3JlXHJcblx0XHRcdFx0XHRcdFx0c2VuZGluZzogMFxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHQvLyBFbWl0IHRoZSBzZW5kXHJcblx0XHRcdFx0c2VsZi5lbWl0KCdzZW5kJywge1xyXG5cdFx0XHRcdFx0c21zOiBzbXMuX2lkLFxyXG5cdFx0XHRcdFx0cmVzdWx0OiByZXN1bHRcclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdH0gLy8gRWxzZSBjb3VsZCBub3QgcmVzZXJ2ZVxyXG5cdFx0fTsgLy8gRU8gc2VuZFNNU1xyXG5cclxuXHRcdHNlbmRXb3JrZXIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0XHRpZiAoaXNTZW5kaW5nKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIFNldCBzZW5kIGZlbmNlXHJcblx0XHRcdGlzU2VuZGluZyA9IHRydWU7XHJcblxyXG5cdFx0XHR2YXIgYmF0Y2hTaXplID0gb3B0aW9ucy5zZW5kQmF0Y2hTaXplIHx8IDE7XHJcblxyXG5cdFx0XHR2YXIgbm93ID0gK25ldyBEYXRlKCk7XHJcblxyXG5cdFx0XHQvLyBGaW5kIHNtcyB0aGF0IGFyZSBub3QgYmVpbmcgb3IgYWxyZWFkeSBzZW50XHJcblx0XHRcdHZhciBwZW5kaW5nU01TID0gU01TUXVldWUuY29sbGVjdGlvbi5maW5kKHtcclxuXHRcdFx0XHQkYW5kOiBbXHJcblx0XHRcdFx0XHQvLyBNZXNzYWdlIGlzIG5vdCBzZW50XHJcblx0XHRcdFx0XHR7XHJcblx0XHRcdFx0XHRcdHNlbnQ6IGZhbHNlXHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0Ly8gQW5kIG5vdCBiZWluZyBzZW50IGJ5IG90aGVyIGluc3RhbmNlc1xyXG5cdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHRzZW5kaW5nOiB7XHJcblx0XHRcdFx0XHRcdFx0JGx0OiBub3dcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdF1cclxuXHRcdFx0fSwge1xyXG5cdFx0XHRcdC8vIFNvcnQgYnkgY3JlYXRlZCBkYXRlXHJcblx0XHRcdFx0c29ydDoge1xyXG5cdFx0XHRcdFx0Y3JlYXRlZEF0OiAxXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRsaW1pdDogYmF0Y2hTaXplXHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdFx0cGVuZGluZ1NNUy5mb3JFYWNoKGZ1bmN0aW9uKHNtcykge1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHRzZW5kU01TKHNtcyk7XHJcblx0XHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcclxuXHJcblx0XHRcdFx0XHRpZiAoU01TUXVldWUuZGVidWcpIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ1NNU1F1ZXVlOiBDb3VsZCBub3Qgc2VuZCBzbXMgaWQ6IFwiJyArIHNtcy5faWQgKyAnXCIsIEVycm9yOiAnICsgZXJyb3IubWVzc2FnZSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTsgLy8gRU8gZm9yRWFjaFxyXG5cclxuXHRcdFx0Ly8gUmVtb3ZlIHRoZSBzZW5kIGZlbmNlXHJcblx0XHRcdGlzU2VuZGluZyA9IGZhbHNlO1xyXG5cdFx0fSwgb3B0aW9ucy5zZW5kSW50ZXJ2YWwgfHwgMTUwMDApOyAvLyBEZWZhdWx0IGV2ZXJ5IDE1dGggc2VjXHJcblxyXG5cdH0gZWxzZSB7XHJcblx0XHRpZiAoU01TUXVldWUuZGVidWcpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1NNU1F1ZXVlOiBTZW5kIHNlcnZlciBpcyBkaXNhYmxlZCcpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn07IiwidmFyIGlzQ29uZmlndXJlZCA9IGZhbHNlO1xyXG52YXIgcmVxdWVzdCA9IHJlcXVpcmUoJ3N1cGVyYWdlbnQnKTtcclxuXHJcbnZhciBzZW5kV29ya2VyID0gZnVuY3Rpb24odGFzaywgaW50ZXJ2YWwpIHtcclxuXHJcblx0aWYgKFdlYlNlcnZpY2VTTVNRdWV1ZS5kZWJ1Zykge1xyXG5cdFx0Y29uc29sZS5sb2coJ1dlYlNlcnZpY2VTTVNRdWV1ZTogU2VuZCB3b3JrZXIgc3RhcnRlZCwgdXNpbmcgaW50ZXJ2YWw6ICcgKyBpbnRlcnZhbCk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gTWV0ZW9yLnNldEludGVydmFsKGZ1bmN0aW9uKCkge1xyXG5cdFx0dHJ5IHtcclxuXHRcdFx0dGFzaygpO1xyXG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcclxuXHRcdFx0aWYgKFdlYlNlcnZpY2VTTVNRdWV1ZS5kZWJ1Zykge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdXZWJTZXJ2aWNlU01TUXVldWU6IEVycm9yIHdoaWxlIHNlbmRpbmc6ICcgKyBlcnJvci5tZXNzYWdlKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0sIGludGVydmFsKTtcclxufTtcclxuXHJcblxyXG52YXIgc2VuZFRvV2ViU2VydmljZSA9IGZ1bmN0aW9uKGRvYywgdXJsLCBzcGFjZVRva2VuLCBzaWdubmFtZSl7XHJcblx0dmFyIG1lc3NhZ2UgPSBfLmNsb25lKGRvYyk7XHJcblx0bWVzc2FnZS5zaWdubmFtZSA9IHNpZ25uYW1lO1xyXG5cdGRlbGV0ZSBtZXNzYWdlLl9pZDtcclxuXHRyZXF1ZXN0XHJcblx0XHQucG9zdCh1cmwpXHJcblx0XHQuc2VuZChtZXNzYWdlKVxyXG5cdFx0LnNldCgnQXV0aG9yaXphdGlvbicsICdCZWFyZXIgJyArIHNwYWNlVG9rZW4pXHJcblx0XHQuZW5kKGZ1bmN0aW9uKGVyciwgcmVzKSB7XHJcblx0XHRcdGlmIChlcnIpIHtcclxuXHRcdFx0XHRyZXR1cm4gY29uc29sZS5lcnJvcihlcnIpO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxufVxyXG5cclxuLypcclxuXHRvcHRpb25zOiB7XHJcblx0XHQvLyBDb250cm9scyB0aGUgc2VuZGluZyBpbnRlcnZhbFxyXG5cdFx0c2VuZEludGVydmFsOiBNYXRjaC5PcHRpb25hbChOdW1iZXIpLFxyXG5cdFx0Ly8gQ29udHJvbHMgdGhlIHNlbmRpbmcgYmF0Y2ggc2l6ZSBwZXIgaW50ZXJ2YWxcclxuXHRcdHNlbmRCYXRjaFNpemU6IE1hdGNoLk9wdGlvbmFsKE51bWJlciksXHJcblx0XHQvLyBBbGxvdyBvcHRpb25hbCBrZWVwaW5nIG5vdGlmaWNhdGlvbnMgaW4gY29sbGVjdGlvblxyXG5cdFx0a2VlcFNNUzogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbilcclxuXHR9XHJcbiovXHJcbldlYlNlcnZpY2VTTVNRdWV1ZS5Db25maWd1cmUgPSBmdW5jdGlvbihvcHRpb25zKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cdG9wdGlvbnMgPSBfLmV4dGVuZCh7XHJcblx0XHRzZW5kVGltZW91dDogNjAwMDAsIC8vIFRpbWVvdXQgcGVyaW9kIGZvciBzbXMgc2VuZFxyXG5cdH0sIG9wdGlvbnMpO1xyXG5cclxuXHQvLyBCbG9jayBtdWx0aXBsZSBjYWxsc1xyXG5cdGlmIChpc0NvbmZpZ3VyZWQpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignV2ViU2VydmljZVNNU1F1ZXVlLkNvbmZpZ3VyZSBzaG91bGQgbm90IGJlIGNhbGxlZCBtb3JlIHRoYW4gb25jZSEnKTtcclxuXHR9XHJcblxyXG5cdGlzQ29uZmlndXJlZCA9IHRydWU7XHJcblxyXG5cdC8vIEFkZCBkZWJ1ZyBpbmZvXHJcblx0aWYgKFdlYlNlcnZpY2VTTVNRdWV1ZS5kZWJ1Zykge1xyXG5cdFx0Y29uc29sZS5sb2coJ1dlYlNlcnZpY2VTTVNRdWV1ZS5Db25maWd1cmUnLCBvcHRpb25zKTtcclxuXHR9XHJcblxyXG5cdHZhciB1cmwgPSBvcHRpb25zLnVybDtcclxuXHR2YXIgc3BhY2VUb2tlbiA9IG9wdGlvbnMuc3BhY2VUb2tlbjtcclxuXHR2YXIgc2lnbm5hbWUgPSBvcHRpb25zLnNpZ25uYW1lO1xyXG5cclxuXHRzZWxmLnNlbmRTTVMgPSBmdW5jdGlvbihzbXMpIHtcclxuXHRcdGlmIChXZWJTZXJ2aWNlU01TUXVldWUuZGVidWcpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coXCJzZW5kU01TXCIpO1xyXG5cdFx0XHRjb25zb2xlLmxvZyhzbXMpO1xyXG5cdFx0fVxyXG5cdFx0c2VuZFRvV2ViU2VydmljZShzbXMsIHVybCwgc3BhY2VUb2tlbiwgc2lnbm5hbWUpXHJcblx0fVxyXG5cclxuXHQvLyBVbml2ZXJzYWwgc2VuZCBmdW5jdGlvblxyXG5cdHZhciBfcXVlcnlTZW5kID0gZnVuY3Rpb24ob3B0aW9ucykge1xyXG5cclxuXHRcdGlmIChzZWxmLnNlbmRTTVMpIHtcclxuXHRcdFx0c2VsZi5zZW5kU01TKG9wdGlvbnMpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB7XHJcblx0XHRcdHNtczogW29wdGlvbnMuX2lkXVxyXG5cdFx0fTtcclxuXHR9O1xyXG5cclxuXHRzZWxmLnNlcnZlclNlbmQgPSBmdW5jdGlvbihvcHRpb25zKSB7XHJcblx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHRcdHJldHVybiBfcXVlcnlTZW5kKG9wdGlvbnMpO1xyXG5cdH07XHJcblxyXG5cclxuXHQvLyBUaGlzIGludGVydmFsIHdpbGwgYWxsb3cgb25seSBvbmUgc21zIHRvIGJlIHNlbnQgYXQgYSB0aW1lLCBpdFxyXG5cdC8vIHdpbGwgY2hlY2sgZm9yIG5ldyBzbXMgYXQgZXZlcnkgYG9wdGlvbnMuc2VuZEludGVydmFsYFxyXG5cdC8vIChkZWZhdWx0IGludGVydmFsIGlzIDE1MDAwIG1zKVxyXG5cdC8vXHJcblx0Ly8gSXQgbG9va3MgaW4gc21zIGNvbGxlY3Rpb24gdG8gc2VlIGlmIHRoZXJlcyBhbnkgcGVuZGluZ1xyXG5cdC8vIHNtcywgaWYgc28gaXQgd2lsbCB0cnkgdG8gcmVzZXJ2ZSB0aGUgcGVuZGluZyBzbXMuXHJcblx0Ly8gSWYgc3VjY2Vzc2Z1bGx5IHJlc2VydmVkIHRoZSBzZW5kIGlzIHN0YXJ0ZWQuXHJcblx0Ly9cclxuXHQvLyBJZiBzbXMucXVlcnkgaXMgdHlwZSBzdHJpbmcsIGl0J3MgYXNzdW1lZCB0byBiZSBhIGpzb24gc3RyaW5nXHJcblx0Ly8gdmVyc2lvbiBvZiB0aGUgcXVlcnkgc2VsZWN0b3IuIE1ha2luZyBpdCBhYmxlIHRvIGNhcnJ5IGAkYCBwcm9wZXJ0aWVzIGluXHJcblx0Ly8gdGhlIG1vbmdvIGNvbGxlY3Rpb24uXHJcblx0Ly9cclxuXHQvLyBQci4gZGVmYXVsdCBzbXMgYXJlIHJlbW92ZWQgZnJvbSB0aGUgY29sbGVjdGlvbiBhZnRlciBzZW5kIGhhdmVcclxuXHQvLyBjb21wbGV0ZWQuIFNldHRpbmcgYG9wdGlvbnMua2VlcFNNU2Agd2lsbCB1cGRhdGUgYW5kIGtlZXAgdGhlXHJcblx0Ly8gc21zIGVnLiBpZiBuZWVkZWQgZm9yIGhpc3RvcmljYWwgcmVhc29ucy5cclxuXHQvL1xyXG5cdC8vIEFmdGVyIHRoZSBzZW5kIGhhdmUgY29tcGxldGVkIGEgXCJzZW5kXCIgZXZlbnQgd2lsbCBiZSBlbWl0dGVkIHdpdGggYVxyXG5cdC8vIHN0YXR1cyBvYmplY3QgY29udGFpbmluZyBzbXMgaWQgYW5kIHRoZSBzZW5kIHJlc3VsdCBvYmplY3QuXHJcblx0Ly9cclxuXHR2YXIgaXNTZW5kaW5nID0gZmFsc2U7XHJcblxyXG5cdGlmIChvcHRpb25zLnNlbmRJbnRlcnZhbCAhPT0gbnVsbCkge1xyXG5cclxuXHRcdC8vIFRoaXMgd2lsbCByZXF1aXJlIGluZGV4IHNpbmNlIHdlIHNvcnQgc21zIGJ5IGNyZWF0ZWRBdFxyXG5cdFx0V2ViU2VydmljZVNNU1F1ZXVlLmNvbGxlY3Rpb24uX2Vuc3VyZUluZGV4KHtcclxuXHRcdFx0Y3JlYXRlZEF0OiAxXHJcblx0XHR9KTtcclxuXHRcdFdlYlNlcnZpY2VTTVNRdWV1ZS5jb2xsZWN0aW9uLl9lbnN1cmVJbmRleCh7XHJcblx0XHRcdHNlbnQ6IDFcclxuXHRcdH0pO1xyXG5cdFx0V2ViU2VydmljZVNNU1F1ZXVlLmNvbGxlY3Rpb24uX2Vuc3VyZUluZGV4KHtcclxuXHRcdFx0c2VuZGluZzogMVxyXG5cdFx0fSk7XHJcblxyXG5cclxuXHRcdHZhciBzZW5kU01TID0gZnVuY3Rpb24oc21zKSB7XHJcblx0XHRcdC8vIFJlc2VydmUgc21zXHJcblx0XHRcdHZhciBub3cgPSArbmV3IERhdGUoKTtcclxuXHRcdFx0dmFyIHRpbWVvdXRBdCA9IG5vdyArIG9wdGlvbnMuc2VuZFRpbWVvdXQ7XHJcblx0XHRcdHZhciByZXNlcnZlZCA9IFdlYlNlcnZpY2VTTVNRdWV1ZS5jb2xsZWN0aW9uLnVwZGF0ZSh7XHJcblx0XHRcdFx0X2lkOiBzbXMuX2lkLFxyXG5cdFx0XHRcdHNlbnQ6IGZhbHNlLCAvLyB4eHg6IG5lZWQgdG8gbWFrZSBzdXJlIHRoaXMgaXMgc2V0IG9uIGNyZWF0ZVxyXG5cdFx0XHRcdHNlbmRpbmc6IHtcclxuXHRcdFx0XHRcdCRsdDogbm93XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9LCB7XHJcblx0XHRcdFx0JHNldDoge1xyXG5cdFx0XHRcdFx0c2VuZGluZzogdGltZW91dEF0LFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHQvLyBNYWtlIHN1cmUgd2Ugb25seSBoYW5kbGUgc21zIHJlc2VydmVkIGJ5IHRoaXNcclxuXHRcdFx0Ly8gaW5zdGFuY2VcclxuXHRcdFx0aWYgKHJlc2VydmVkKSB7XHJcblxyXG5cdFx0XHRcdC8vIFNlbmQgdGhlIHNtc1xyXG5cdFx0XHRcdHZhciByZXN1bHQgPSBXZWJTZXJ2aWNlU01TUXVldWUuc2VydmVyU2VuZChzbXMpO1xyXG5cclxuXHRcdFx0XHRpZiAoIW9wdGlvbnMua2VlcFNNUykge1xyXG5cdFx0XHRcdFx0Ly8gUHIuIERlZmF1bHQgd2Ugd2lsbCByZW1vdmUgc21zXHJcblx0XHRcdFx0XHRXZWJTZXJ2aWNlU01TUXVldWUuY29sbGVjdGlvbi5yZW1vdmUoe1xyXG5cdFx0XHRcdFx0XHRfaWQ6IHNtcy5faWRcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblxyXG5cdFx0XHRcdFx0Ly8gVXBkYXRlIHRoZSBzbXNcclxuXHRcdFx0XHRcdFdlYlNlcnZpY2VTTVNRdWV1ZS5jb2xsZWN0aW9uLnVwZGF0ZSh7XHJcblx0XHRcdFx0XHRcdF9pZDogc21zLl9pZFxyXG5cdFx0XHRcdFx0fSwge1xyXG5cdFx0XHRcdFx0XHQkc2V0OiB7XHJcblx0XHRcdFx0XHRcdFx0Ly8gTWFyayBhcyBzZW50XHJcblx0XHRcdFx0XHRcdFx0c2VudDogdHJ1ZSxcclxuXHRcdFx0XHRcdFx0XHQvLyBTZXQgdGhlIHNlbnQgZGF0ZVxyXG5cdFx0XHRcdFx0XHRcdHNlbnRBdDogbmV3IERhdGUoKSxcclxuXHRcdFx0XHRcdFx0XHQvLyBOb3QgYmVpbmcgc2VudCBhbnltb3JlXHJcblx0XHRcdFx0XHRcdFx0c2VuZGluZzogMFxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHQvLyBFbWl0IHRoZSBzZW5kXHJcblx0XHRcdFx0c2VsZi5lbWl0KCdzZW5kJywge1xyXG5cdFx0XHRcdFx0c21zOiBzbXMuX2lkLFxyXG5cdFx0XHRcdFx0cmVzdWx0OiByZXN1bHRcclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdH0gLy8gRWxzZSBjb3VsZCBub3QgcmVzZXJ2ZVxyXG5cdFx0fTsgLy8gRU8gc2VuZFNNU1xyXG5cclxuXHRcdHNlbmRXb3JrZXIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0XHRpZiAoaXNTZW5kaW5nKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIFNldCBzZW5kIGZlbmNlXHJcblx0XHRcdGlzU2VuZGluZyA9IHRydWU7XHJcblxyXG5cdFx0XHR2YXIgYmF0Y2hTaXplID0gb3B0aW9ucy5zZW5kQmF0Y2hTaXplIHx8IDE7XHJcblxyXG5cdFx0XHR2YXIgbm93ID0gK25ldyBEYXRlKCk7XHJcblxyXG5cdFx0XHQvLyBGaW5kIHNtcyB0aGF0IGFyZSBub3QgYmVpbmcgb3IgYWxyZWFkeSBzZW50XHJcblx0XHRcdHZhciBwZW5kaW5nU01TID0gV2ViU2VydmljZVNNU1F1ZXVlLmNvbGxlY3Rpb24uZmluZCh7XHJcblx0XHRcdFx0JGFuZDogW1xyXG5cdFx0XHRcdFx0Ly8gTWVzc2FnZSBpcyBub3Qgc2VudFxyXG5cdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHRzZW50OiBmYWxzZVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdC8vIEFuZCBub3QgYmVpbmcgc2VudCBieSBvdGhlciBpbnN0YW5jZXNcclxuXHRcdFx0XHRcdHtcclxuXHRcdFx0XHRcdFx0c2VuZGluZzoge1xyXG5cdFx0XHRcdFx0XHRcdCRsdDogbm93XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRdXHJcblx0XHRcdH0sIHtcclxuXHRcdFx0XHQvLyBTb3J0IGJ5IGNyZWF0ZWQgZGF0ZVxyXG5cdFx0XHRcdHNvcnQ6IHtcclxuXHRcdFx0XHRcdGNyZWF0ZWRBdDogMVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0bGltaXQ6IGJhdGNoU2l6ZVxyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdHBlbmRpbmdTTVMuZm9yRWFjaChmdW5jdGlvbihzbXMpIHtcclxuXHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0c2VuZFNNUyhzbXMpO1xyXG5cdFx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XHJcblxyXG5cdFx0XHRcdFx0aWYgKFdlYlNlcnZpY2VTTVNRdWV1ZS5kZWJ1Zykge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnV2ViU2VydmljZVNNU1F1ZXVlOiBDb3VsZCBub3Qgc2VuZCBzbXMgaWQ6IFwiJyArIHNtcy5faWQgKyAnXCIsIEVycm9yOiAnICsgZXJyb3IubWVzc2FnZSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTsgLy8gRU8gZm9yRWFjaFxyXG5cclxuXHRcdFx0Ly8gUmVtb3ZlIHRoZSBzZW5kIGZlbmNlXHJcblx0XHRcdGlzU2VuZGluZyA9IGZhbHNlO1xyXG5cdFx0fSwgb3B0aW9ucy5zZW5kSW50ZXJ2YWwgfHwgMTUwMDApOyAvLyBEZWZhdWx0IGV2ZXJ5IDE1dGggc2VjXHJcblxyXG5cdH0gZWxzZSB7XHJcblx0XHRpZiAoV2ViU2VydmljZVNNU1F1ZXVlLmRlYnVnKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdXZWJTZXJ2aWNlU01TUXVldWU6IFNlbmQgc2VydmVyIGlzIGRpc2FibGVkJyk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxufTsiLCJNZXRlb3Iuc3RhcnR1cCAtPlxyXG5cdGlmIE1ldGVvci5zZXR0aW5ncy5zbXM/LndlYnNlcnZpY2U/LnNtc3F1ZXVlX2ludGVydmFsICYmIChNZXRlb3Iuc2V0dGluZ3Muc21zPy5hbGl5dW4/LnNtc3F1ZXVlX2ludGVydmFsIHx8IE1ldGVvci5zZXR0aW5ncy5zbXM/LnFjbG91ZD8uc21zcXVldWVfaW50ZXJ2YWwpXHJcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdzbXMud2Vic2VydmljZSBjYW5ub3QgYmUgY29uZmlndXJlZCB3aXRoIHNtcy5hbGl5dW4gb3Igc21zLnFjbG91ZCcpO1xyXG5cclxuXHRpZiBNZXRlb3Iuc2V0dGluZ3Muc21zPy5hbGl5dW4/LnNtc3F1ZXVlX2ludGVydmFsXHJcblx0XHRTTVNRdWV1ZS5Db25maWd1cmVcclxuXHRcdFx0c2VuZEludGVydmFsOiBNZXRlb3Iuc2V0dGluZ3Muc21zLmFsaXl1bi5zbXNxdWV1ZV9pbnRlcnZhbFxyXG5cdFx0XHRzZW5kQmF0Y2hTaXplOiAxMFxyXG5cdFx0XHRrZWVwU01TOiB0cnVlXHJcblx0XHRcdGFjY2Vzc0tleUlkOiBNZXRlb3Iuc2V0dGluZ3Muc21zLmFsaXl1bi5hY2Nlc3NLZXlJZFxyXG5cdFx0XHRhY2Nlc3NLZXlTZWNyZXQ6IE1ldGVvci5zZXR0aW5ncy5zbXMuYWxpeXVuLmFjY2Vzc0tleVNlY3JldFxyXG5cclxuXHRpZiBNZXRlb3Iuc2V0dGluZ3Muc21zPy53ZWJzZXJ2aWNlPy5zbXNxdWV1ZV9pbnRlcnZhbFxyXG5cdFx0V2ViU2VydmljZVNNU1F1ZXVlLkNvbmZpZ3VyZVxyXG5cdFx0XHRzZW5kSW50ZXJ2YWw6IE1ldGVvci5zZXR0aW5ncy5zbXMud2Vic2VydmljZS5zbXNxdWV1ZV9pbnRlcnZhbFxyXG5cdFx0XHR1cmw6IE1ldGVvci5zZXR0aW5ncy5zbXMud2Vic2VydmljZS51cmxcclxuXHRcdFx0c3BhY2VUb2tlbjogTWV0ZW9yLnNldHRpbmdzLnNtcy53ZWJzZXJ2aWNlLnNwYWNlX3Rva2VuXHJcblx0XHRcdHNpZ25uYW1lOiBNZXRlb3Iuc2V0dGluZ3Muc21zLndlYnNlcnZpY2Uuc2lnbm5hbWVcclxuXHRcdFx0c2VuZEJhdGNoU2l6ZTogMTBcclxuXHRcdFx0a2VlcFNNUzogdHJ1ZVxyXG5cclxuXHJcblxyXG4iLCJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcbiAgdmFyIHJlZiwgcmVmMSwgcmVmMiwgcmVmMywgcmVmNCwgcmVmNSwgcmVmNiwgcmVmNywgcmVmOCwgcmVmOTtcbiAgaWYgKCgocmVmID0gTWV0ZW9yLnNldHRpbmdzLnNtcykgIT0gbnVsbCA/IChyZWYxID0gcmVmLndlYnNlcnZpY2UpICE9IG51bGwgPyByZWYxLnNtc3F1ZXVlX2ludGVydmFsIDogdm9pZCAwIDogdm9pZCAwKSAmJiAoKChyZWYyID0gTWV0ZW9yLnNldHRpbmdzLnNtcykgIT0gbnVsbCA/IChyZWYzID0gcmVmMi5hbGl5dW4pICE9IG51bGwgPyByZWYzLnNtc3F1ZXVlX2ludGVydmFsIDogdm9pZCAwIDogdm9pZCAwKSB8fCAoKHJlZjQgPSBNZXRlb3Iuc2V0dGluZ3Muc21zKSAhPSBudWxsID8gKHJlZjUgPSByZWY0LnFjbG91ZCkgIT0gbnVsbCA/IHJlZjUuc21zcXVldWVfaW50ZXJ2YWwgOiB2b2lkIDAgOiB2b2lkIDApKSkge1xuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ3Ntcy53ZWJzZXJ2aWNlIGNhbm5vdCBiZSBjb25maWd1cmVkIHdpdGggc21zLmFsaXl1biBvciBzbXMucWNsb3VkJyk7XG4gIH1cbiAgaWYgKChyZWY2ID0gTWV0ZW9yLnNldHRpbmdzLnNtcykgIT0gbnVsbCA/IChyZWY3ID0gcmVmNi5hbGl5dW4pICE9IG51bGwgPyByZWY3LnNtc3F1ZXVlX2ludGVydmFsIDogdm9pZCAwIDogdm9pZCAwKSB7XG4gICAgU01TUXVldWUuQ29uZmlndXJlKHtcbiAgICAgIHNlbmRJbnRlcnZhbDogTWV0ZW9yLnNldHRpbmdzLnNtcy5hbGl5dW4uc21zcXVldWVfaW50ZXJ2YWwsXG4gICAgICBzZW5kQmF0Y2hTaXplOiAxMCxcbiAgICAgIGtlZXBTTVM6IHRydWUsXG4gICAgICBhY2Nlc3NLZXlJZDogTWV0ZW9yLnNldHRpbmdzLnNtcy5hbGl5dW4uYWNjZXNzS2V5SWQsXG4gICAgICBhY2Nlc3NLZXlTZWNyZXQ6IE1ldGVvci5zZXR0aW5ncy5zbXMuYWxpeXVuLmFjY2Vzc0tleVNlY3JldFxuICAgIH0pO1xuICB9XG4gIGlmICgocmVmOCA9IE1ldGVvci5zZXR0aW5ncy5zbXMpICE9IG51bGwgPyAocmVmOSA9IHJlZjgud2Vic2VydmljZSkgIT0gbnVsbCA/IHJlZjkuc21zcXVldWVfaW50ZXJ2YWwgOiB2b2lkIDAgOiB2b2lkIDApIHtcbiAgICByZXR1cm4gV2ViU2VydmljZVNNU1F1ZXVlLkNvbmZpZ3VyZSh7XG4gICAgICBzZW5kSW50ZXJ2YWw6IE1ldGVvci5zZXR0aW5ncy5zbXMud2Vic2VydmljZS5zbXNxdWV1ZV9pbnRlcnZhbCxcbiAgICAgIHVybDogTWV0ZW9yLnNldHRpbmdzLnNtcy53ZWJzZXJ2aWNlLnVybCxcbiAgICAgIHNwYWNlVG9rZW46IE1ldGVvci5zZXR0aW5ncy5zbXMud2Vic2VydmljZS5zcGFjZV90b2tlbixcbiAgICAgIHNpZ25uYW1lOiBNZXRlb3Iuc2V0dGluZ3Muc21zLndlYnNlcnZpY2Uuc2lnbm5hbWUsXG4gICAgICBzZW5kQmF0Y2hTaXplOiAxMCxcbiAgICAgIGtlZXBTTVM6IHRydWVcbiAgICB9KTtcbiAgfVxufSk7XG4iXX0=
