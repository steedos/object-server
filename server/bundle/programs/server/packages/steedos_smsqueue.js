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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpzbXNxdWV1ZS9jaGVja05wbS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpzbXNxdWV1ZS9saWIvY29tbW9uL21haW4uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3M6c21zcXVldWUvbGliL2NvbW1vbi9zbXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3M6c21zcXVldWUvbGliL3NlcnZlci9hcGkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3M6c21zcXVldWUvbGliL3NlcnZlci93ZWJzZXJ2aWNlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX3Ntc3F1ZXVlL3NlcnZlci9zdGFydHVwLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL3N0YXJ0dXAuY29mZmVlIl0sIm5hbWVzIjpbImNoZWNrTnBtVmVyc2lvbnMiLCJtb2R1bGUiLCJsaW5rIiwidiIsIk1ldGVvciIsInNldHRpbmdzIiwic21zIiwiYWxpeXVuIiwiU01TUXVldWUiLCJFdmVudFN0YXRlIiwiV2ViU2VydmljZVNNU1F1ZXVlIiwiY29sbGVjdGlvbiIsIkNvbGxlY3Rpb24iLCJfdmFsaWRhdGVEb2N1bWVudCIsImNoZWNrIiwiT2JqZWN0Iiwic2VudCIsIk1hdGNoIiwiT3B0aW9uYWwiLCJCb29sZWFuIiwic2VuZGluZyIsIkludGVnZXIiLCJjcmVhdGVkQXQiLCJEYXRlIiwiY3JlYXRlZEJ5IiwiT25lT2YiLCJTdHJpbmciLCJzZW5kIiwib3B0aW9ucyIsInNwYWNlSWQiLCJjdXJyZW50VXNlciIsImlzQ2xpZW50IiwidXNlcklkIiwiaXNTZXJ2ZXIiLCJfIiwiZXh0ZW5kIiwidGVzdCIsInBpY2siLCJvd25lciIsInNwYWNlIiwiaW5zZXJ0IiwiaXNDb25maWd1cmVkIiwic2VuZFdvcmtlciIsInRhc2siLCJpbnRlcnZhbCIsImRlYnVnIiwiY29uc29sZSIsImxvZyIsInNldEludGVydmFsIiwiZXJyb3IiLCJtZXNzYWdlIiwiQ29uZmlndXJlIiwic2VsZiIsInNlbmRUaW1lb3V0IiwiRXJyb3IiLCJTTVMiLCJyZXF1aXJlIiwic21zU2VuZGVyIiwiQWNjZXNzS2V5SWQiLCJhY2Nlc3NLZXlJZCIsIkFjY2Vzc0tleVNlY3JldCIsImFjY2Vzc0tleVNlY3JldCIsInNlbmRTTVMiLCJjYXRjaCIsImVyciIsIl9xdWVyeVNlbmQiLCJfaWQiLCJzZXJ2ZXJTZW5kIiwiaXNTZW5kaW5nIiwic2VuZEludGVydmFsIiwiX2Vuc3VyZUluZGV4Iiwibm93IiwidGltZW91dEF0IiwicmVzZXJ2ZWQiLCJ1cGRhdGUiLCIkbHQiLCIkc2V0IiwicmVzdWx0Iiwia2VlcFNNUyIsInJlbW92ZSIsInNlbnRBdCIsImVtaXQiLCJiYXRjaFNpemUiLCJzZW5kQmF0Y2hTaXplIiwicGVuZGluZ1NNUyIsImZpbmQiLCIkYW5kIiwic29ydCIsImxpbWl0IiwiZm9yRWFjaCIsInJlcXVlc3QiLCJzZW5kVG9XZWJTZXJ2aWNlIiwiZG9jIiwidXJsIiwic3BhY2VUb2tlbiIsInNpZ25uYW1lIiwiY2xvbmUiLCJwb3N0Iiwic2V0IiwiZW5kIiwicmVzIiwic3RhcnR1cCIsInJlZiIsInJlZjEiLCJyZWYyIiwicmVmMyIsInJlZjQiLCJyZWY1IiwicmVmNiIsInJlZjciLCJyZWY4IiwicmVmOSIsIndlYnNlcnZpY2UiLCJzbXNxdWV1ZV9pbnRlcnZhbCIsInFjbG91ZCIsInNwYWNlX3Rva2VuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSUEsZ0JBQUo7QUFBcUJDLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZLG9DQUFaLEVBQWlEO0FBQUNGLGtCQUFnQixDQUFDRyxDQUFELEVBQUc7QUFBQ0gsb0JBQWdCLEdBQUNHLENBQWpCO0FBQW1COztBQUF4QyxDQUFqRCxFQUEyRixDQUEzRjs7QUFJ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T0FBT0MsUUFBUCxDQUFnQkMsR0FBaEIsQ0FBb0JDLE1BQXBCLENBQTJCc0Q7QUFKNUMsS0FERDtBQ1FDOztBRERGLE9BQUFpRCxPQUFBMUcsT0FBQUMsUUFBQSxDQUFBQyxHQUFBLGFBQUF5RyxPQUFBRCxLQUFBRSxVQUFBLFlBQUFELEtBQW9DRSxpQkFBcEMsR0FBb0MsTUFBcEMsR0FBb0MsTUFBcEM7QUNHRyxXREZGdkcsbUJBQW1CeUMsU0FBbkIsQ0FDQztBQUFBa0Isb0JBQWNqRSxPQUFPQyxRQUFQLENBQWdCQyxHQUFoQixDQUFvQjBHLFVBQXBCLENBQStCQyxpQkFBN0M7QUFDQXBCLFdBQUt6RixPQUFPQyxRQUFQLENBQWdCQyxHQUFoQixDQUFvQjBHLFVBQXBCLENBQStCbkIsR0FEcEM7QUFFQUMsa0JBQVkxRixPQUFPQyxRQUFQLENBQWdCQyxHQUFoQixDQUFvQjBHLFVBQXBCLENBQStCRyxXQUYzQztBQUdBcEIsZ0JBQVUzRixPQUFPQyxRQUFQLENBQWdCQyxHQUFoQixDQUFvQjBHLFVBQXBCLENBQStCakIsUUFIekM7QUFJQVoscUJBQWUsRUFKZjtBQUtBTCxlQUFTO0FBTFQsS0FERCxDQ0VFO0FBUUQ7QUR2QkgsRyIsImZpbGUiOiIvcGFja2FnZXMvc3RlZWRvc19zbXNxdWV1ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG5cdGNoZWNrTnBtVmVyc2lvbnNcbn0gZnJvbSAnbWV0ZW9yL3RtZWFzZGF5OmNoZWNrLW5wbS12ZXJzaW9ucyc7XG5cbmlmIChNZXRlb3Iuc2V0dGluZ3MgJiYgTWV0ZW9yLnNldHRpbmdzLnNtcyAmJiBNZXRlb3Iuc2V0dGluZ3Muc21zLmFsaXl1bikge1xuXHRjaGVja05wbVZlcnNpb25zKHtcblx0XHRcImFsaXl1bi1zbXMtbm9kZVwiOiBcIl4xLjEuMlwiXG5cdH0sICdzdGVlZG9zOnNtc3F1ZXVlJyk7XG59IiwiU01TUXVldWUgPSBuZXcgRXZlbnRTdGF0ZSgpO1xuV2ViU2VydmljZVNNU1F1ZXVlID0gbmV3IEV2ZW50U3RhdGUoKTsiLCJTTVNRdWV1ZS5jb2xsZWN0aW9uID0gbmV3IE1ldGVvci5Db2xsZWN0aW9uKCdfc21zX3F1ZXVlJyk7XG5XZWJTZXJ2aWNlU01TUXVldWUuY29sbGVjdGlvbiA9IFNNU1F1ZXVlLmNvbGxlY3Rpb247XG52YXIgX3ZhbGlkYXRlRG9jdW1lbnQgPSBmdW5jdGlvbihzbXMpIHtcblxuXHRjaGVjayhzbXMsIHtcblx0XHRzbXM6IE9iamVjdCxcblx0XHRzZW50OiBNYXRjaC5PcHRpb25hbChCb29sZWFuKSxcblx0XHRzZW5kaW5nOiBNYXRjaC5PcHRpb25hbChNYXRjaC5JbnRlZ2VyKSxcblx0XHRjcmVhdGVkQXQ6IERhdGUsXG5cdFx0Y3JlYXRlZEJ5OiBNYXRjaC5PbmVPZihTdHJpbmcsIG51bGwpXG5cdH0pO1xuXG59O1xuXG5TTVNRdWV1ZS5zZW5kID0gZnVuY3Rpb24ob3B0aW9ucywgc3BhY2VJZCkge1xuXHR2YXIgY3VycmVudFVzZXIgPSBNZXRlb3IuaXNDbGllbnQgJiYgTWV0ZW9yLnVzZXJJZCAmJiBNZXRlb3IudXNlcklkKCkgfHwgTWV0ZW9yLmlzU2VydmVyICYmIChvcHRpb25zLmNyZWF0ZWRCeSB8fCAnPFNFUlZFUj4nKSB8fCBudWxsXG5cdHZhciBzbXMgPSBfLmV4dGVuZCh7XG5cdFx0Y3JlYXRlZEF0OiBuZXcgRGF0ZSgpLFxuXHRcdGNyZWF0ZWRCeTogY3VycmVudFVzZXJcblx0fSk7XG5cblx0aWYgKE1hdGNoLnRlc3Qob3B0aW9ucywgT2JqZWN0KSkge1xuXHRcdHNtcy5zbXMgPSBfLnBpY2sob3B0aW9ucywgJ0Zvcm1hdCcsICdBY3Rpb24nLCAnUGFyYW1TdHJpbmcnLCAnUmVjTnVtJywgJ1NpZ25OYW1lJywgJ1RlbXBsYXRlQ29kZScsICdtc2cnKTtcblx0fVxuXG5cdHNtcy5zZW50ID0gZmFsc2U7XG5cdHNtcy5zZW5kaW5nID0gMDtcblxuXHRfdmFsaWRhdGVEb2N1bWVudChzbXMpO1xuXG5cdGlmKG9wdGlvbnMuY3JlYXRlZEJ5KXtcblx0XHRzbXMub3duZXIgPSBvcHRpb25zLmNyZWF0ZWRCeVxuXHR9XG5cblx0aWYoc3BhY2VJZCl7XG5cdFx0c21zLnNwYWNlID0gc3BhY2VJZFxuXHR9XG5cblx0cmV0dXJuIFNNU1F1ZXVlLmNvbGxlY3Rpb24uaW5zZXJ0KHNtcyk7XG59OyIsInZhciBpc0NvbmZpZ3VyZWQgPSBmYWxzZTtcbnZhciBzZW5kV29ya2VyID0gZnVuY3Rpb24odGFzaywgaW50ZXJ2YWwpIHtcblxuXHRpZiAoU01TUXVldWUuZGVidWcpIHtcblx0XHRjb25zb2xlLmxvZygnU01TUXVldWU6IFNlbmQgd29ya2VyIHN0YXJ0ZWQsIHVzaW5nIGludGVydmFsOiAnICsgaW50ZXJ2YWwpO1xuXHR9XG5cblx0cmV0dXJuIE1ldGVvci5zZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcblx0XHR0cnkge1xuXHRcdFx0dGFzaygpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRpZiAoU01TUXVldWUuZGVidWcpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ1NNU1F1ZXVlOiBFcnJvciB3aGlsZSBzZW5kaW5nOiAnICsgZXJyb3IubWVzc2FnZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LCBpbnRlcnZhbCk7XG59O1xuXG5cblxuLypcblx0b3B0aW9uczoge1xuXHRcdC8vIENvbnRyb2xzIHRoZSBzZW5kaW5nIGludGVydmFsXG5cdFx0c2VuZEludGVydmFsOiBNYXRjaC5PcHRpb25hbChOdW1iZXIpLFxuXHRcdC8vIENvbnRyb2xzIHRoZSBzZW5kaW5nIGJhdGNoIHNpemUgcGVyIGludGVydmFsXG5cdFx0c2VuZEJhdGNoU2l6ZTogTWF0Y2guT3B0aW9uYWwoTnVtYmVyKSxcblx0XHQvLyBBbGxvdyBvcHRpb25hbCBrZWVwaW5nIG5vdGlmaWNhdGlvbnMgaW4gY29sbGVjdGlvblxuXHRcdGtlZXBTTVM6IE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pXG5cdH1cbiovXG5TTVNRdWV1ZS5Db25maWd1cmUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblx0b3B0aW9ucyA9IF8uZXh0ZW5kKHtcblx0XHRzZW5kVGltZW91dDogNjAwMDAsIC8vIFRpbWVvdXQgcGVyaW9kIGZvciBzbXMgc2VuZFxuXHR9LCBvcHRpb25zKTtcblxuXHQvLyBCbG9jayBtdWx0aXBsZSBjYWxsc1xuXHRpZiAoaXNDb25maWd1cmVkKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdTTVNRdWV1ZS5Db25maWd1cmUgc2hvdWxkIG5vdCBiZSBjYWxsZWQgbW9yZSB0aGFuIG9uY2UhJyk7XG5cdH1cblxuXHRpc0NvbmZpZ3VyZWQgPSB0cnVlO1xuXG5cdC8vIEFkZCBkZWJ1ZyBpbmZvXG5cdGlmIChTTVNRdWV1ZS5kZWJ1Zykge1xuXHRcdGNvbnNvbGUubG9nKCdTTVNRdWV1ZS5Db25maWd1cmUnLCBvcHRpb25zKTtcblx0fVxuXG5cdHZhciBTTVMgPSByZXF1aXJlKCdhbGl5dW4tc21zLW5vZGUnKSxcblx0c21zU2VuZGVyO1xuXG5cdHNtc1NlbmRlciA9IG5ldyBTTVMoe1xuXHRcdEFjY2Vzc0tleUlkOiBvcHRpb25zLmFjY2Vzc0tleUlkLFxuXHRcdEFjY2Vzc0tleVNlY3JldDogb3B0aW9ucy5hY2Nlc3NLZXlTZWNyZXRcblx0fSk7XG5cblx0c2VsZi5zZW5kU01TID0gZnVuY3Rpb24oc21zKSB7XG5cdFx0aWYgKFNNU1F1ZXVlLmRlYnVnKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcInNlbmRTTVNcIik7XG5cdFx0XHRjb25zb2xlLmxvZyhzbXMpO1xuXHRcdH1cblxuXHRcdHNtc1NlbmRlci5zZW5kKHNtcy5zbXMpLmNhdGNoKGVyciA9PiB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGVycilcblx0XHR9KTtcblx0fVxuXG5cdC8vIFVuaXZlcnNhbCBzZW5kIGZ1bmN0aW9uXG5cdHZhciBfcXVlcnlTZW5kID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXG5cdFx0aWYgKHNlbGYuc2VuZFNNUykge1xuXHRcdFx0c2VsZi5zZW5kU01TKG9wdGlvbnMpO1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRzbXM6IFtvcHRpb25zLl9pZF1cblx0XHR9O1xuXHR9O1xuXG5cdHNlbGYuc2VydmVyU2VuZCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblx0XHRyZXR1cm4gX3F1ZXJ5U2VuZChvcHRpb25zKTtcblx0fTtcblxuXG5cdC8vIFRoaXMgaW50ZXJ2YWwgd2lsbCBhbGxvdyBvbmx5IG9uZSBzbXMgdG8gYmUgc2VudCBhdCBhIHRpbWUsIGl0XG5cdC8vIHdpbGwgY2hlY2sgZm9yIG5ldyBzbXMgYXQgZXZlcnkgYG9wdGlvbnMuc2VuZEludGVydmFsYFxuXHQvLyAoZGVmYXVsdCBpbnRlcnZhbCBpcyAxNTAwMCBtcylcblx0Ly9cblx0Ly8gSXQgbG9va3MgaW4gc21zIGNvbGxlY3Rpb24gdG8gc2VlIGlmIHRoZXJlcyBhbnkgcGVuZGluZ1xuXHQvLyBzbXMsIGlmIHNvIGl0IHdpbGwgdHJ5IHRvIHJlc2VydmUgdGhlIHBlbmRpbmcgc21zLlxuXHQvLyBJZiBzdWNjZXNzZnVsbHkgcmVzZXJ2ZWQgdGhlIHNlbmQgaXMgc3RhcnRlZC5cblx0Ly9cblx0Ly8gSWYgc21zLnF1ZXJ5IGlzIHR5cGUgc3RyaW5nLCBpdCdzIGFzc3VtZWQgdG8gYmUgYSBqc29uIHN0cmluZ1xuXHQvLyB2ZXJzaW9uIG9mIHRoZSBxdWVyeSBzZWxlY3Rvci4gTWFraW5nIGl0IGFibGUgdG8gY2FycnkgYCRgIHByb3BlcnRpZXMgaW5cblx0Ly8gdGhlIG1vbmdvIGNvbGxlY3Rpb24uXG5cdC8vXG5cdC8vIFByLiBkZWZhdWx0IHNtcyBhcmUgcmVtb3ZlZCBmcm9tIHRoZSBjb2xsZWN0aW9uIGFmdGVyIHNlbmQgaGF2ZVxuXHQvLyBjb21wbGV0ZWQuIFNldHRpbmcgYG9wdGlvbnMua2VlcFNNU2Agd2lsbCB1cGRhdGUgYW5kIGtlZXAgdGhlXG5cdC8vIHNtcyBlZy4gaWYgbmVlZGVkIGZvciBoaXN0b3JpY2FsIHJlYXNvbnMuXG5cdC8vXG5cdC8vIEFmdGVyIHRoZSBzZW5kIGhhdmUgY29tcGxldGVkIGEgXCJzZW5kXCIgZXZlbnQgd2lsbCBiZSBlbWl0dGVkIHdpdGggYVxuXHQvLyBzdGF0dXMgb2JqZWN0IGNvbnRhaW5pbmcgc21zIGlkIGFuZCB0aGUgc2VuZCByZXN1bHQgb2JqZWN0LlxuXHQvL1xuXHR2YXIgaXNTZW5kaW5nID0gZmFsc2U7XG5cblx0aWYgKG9wdGlvbnMuc2VuZEludGVydmFsICE9PSBudWxsKSB7XG5cblx0XHQvLyBUaGlzIHdpbGwgcmVxdWlyZSBpbmRleCBzaW5jZSB3ZSBzb3J0IHNtcyBieSBjcmVhdGVkQXRcblx0XHRTTVNRdWV1ZS5jb2xsZWN0aW9uLl9lbnN1cmVJbmRleCh7XG5cdFx0XHRjcmVhdGVkQXQ6IDFcblx0XHR9KTtcblx0XHRTTVNRdWV1ZS5jb2xsZWN0aW9uLl9lbnN1cmVJbmRleCh7XG5cdFx0XHRzZW50OiAxXG5cdFx0fSk7XG5cdFx0U01TUXVldWUuY29sbGVjdGlvbi5fZW5zdXJlSW5kZXgoe1xuXHRcdFx0c2VuZGluZzogMVxuXHRcdH0pO1xuXG5cblx0XHR2YXIgc2VuZFNNUyA9IGZ1bmN0aW9uKHNtcykge1xuXHRcdFx0Ly8gUmVzZXJ2ZSBzbXNcblx0XHRcdHZhciBub3cgPSArbmV3IERhdGUoKTtcblx0XHRcdHZhciB0aW1lb3V0QXQgPSBub3cgKyBvcHRpb25zLnNlbmRUaW1lb3V0O1xuXHRcdFx0dmFyIHJlc2VydmVkID0gU01TUXVldWUuY29sbGVjdGlvbi51cGRhdGUoe1xuXHRcdFx0XHRfaWQ6IHNtcy5faWQsXG5cdFx0XHRcdHNlbnQ6IGZhbHNlLCAvLyB4eHg6IG5lZWQgdG8gbWFrZSBzdXJlIHRoaXMgaXMgc2V0IG9uIGNyZWF0ZVxuXHRcdFx0XHRzZW5kaW5nOiB7XG5cdFx0XHRcdFx0JGx0OiBub3dcblx0XHRcdFx0fVxuXHRcdFx0fSwge1xuXHRcdFx0XHQkc2V0OiB7XG5cdFx0XHRcdFx0c2VuZGluZzogdGltZW91dEF0LFxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gTWFrZSBzdXJlIHdlIG9ubHkgaGFuZGxlIHNtcyByZXNlcnZlZCBieSB0aGlzXG5cdFx0XHQvLyBpbnN0YW5jZVxuXHRcdFx0aWYgKHJlc2VydmVkKSB7XG5cblx0XHRcdFx0Ly8gU2VuZCB0aGUgc21zXG5cdFx0XHRcdHZhciByZXN1bHQgPSBTTVNRdWV1ZS5zZXJ2ZXJTZW5kKHNtcyk7XG5cblx0XHRcdFx0aWYgKCFvcHRpb25zLmtlZXBTTVMpIHtcblx0XHRcdFx0XHQvLyBQci4gRGVmYXVsdCB3ZSB3aWxsIHJlbW92ZSBzbXNcblx0XHRcdFx0XHRTTVNRdWV1ZS5jb2xsZWN0aW9uLnJlbW92ZSh7XG5cdFx0XHRcdFx0XHRfaWQ6IHNtcy5faWRcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHRcdC8vIFVwZGF0ZSB0aGUgc21zXG5cdFx0XHRcdFx0U01TUXVldWUuY29sbGVjdGlvbi51cGRhdGUoe1xuXHRcdFx0XHRcdFx0X2lkOiBzbXMuX2lkXG5cdFx0XHRcdFx0fSwge1xuXHRcdFx0XHRcdFx0JHNldDoge1xuXHRcdFx0XHRcdFx0XHQvLyBNYXJrIGFzIHNlbnRcblx0XHRcdFx0XHRcdFx0c2VudDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0Ly8gU2V0IHRoZSBzZW50IGRhdGVcblx0XHRcdFx0XHRcdFx0c2VudEF0OiBuZXcgRGF0ZSgpLFxuXHRcdFx0XHRcdFx0XHQvLyBOb3QgYmVpbmcgc2VudCBhbnltb3JlXG5cdFx0XHRcdFx0XHRcdHNlbmRpbmc6IDBcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gRW1pdCB0aGUgc2VuZFxuXHRcdFx0XHRzZWxmLmVtaXQoJ3NlbmQnLCB7XG5cdFx0XHRcdFx0c21zOiBzbXMuX2lkLFxuXHRcdFx0XHRcdHJlc3VsdDogcmVzdWx0XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHR9IC8vIEVsc2UgY291bGQgbm90IHJlc2VydmVcblx0XHR9OyAvLyBFTyBzZW5kU01TXG5cblx0XHRzZW5kV29ya2VyKGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRpZiAoaXNTZW5kaW5nKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdC8vIFNldCBzZW5kIGZlbmNlXG5cdFx0XHRpc1NlbmRpbmcgPSB0cnVlO1xuXG5cdFx0XHR2YXIgYmF0Y2hTaXplID0gb3B0aW9ucy5zZW5kQmF0Y2hTaXplIHx8IDE7XG5cblx0XHRcdHZhciBub3cgPSArbmV3IERhdGUoKTtcblxuXHRcdFx0Ly8gRmluZCBzbXMgdGhhdCBhcmUgbm90IGJlaW5nIG9yIGFscmVhZHkgc2VudFxuXHRcdFx0dmFyIHBlbmRpbmdTTVMgPSBTTVNRdWV1ZS5jb2xsZWN0aW9uLmZpbmQoe1xuXHRcdFx0XHQkYW5kOiBbXG5cdFx0XHRcdFx0Ly8gTWVzc2FnZSBpcyBub3Qgc2VudFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHNlbnQ6IGZhbHNlXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHQvLyBBbmQgbm90IGJlaW5nIHNlbnQgYnkgb3RoZXIgaW5zdGFuY2VzXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0c2VuZGluZzoge1xuXHRcdFx0XHRcdFx0XHQkbHQ6IG5vd1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XVxuXHRcdFx0fSwge1xuXHRcdFx0XHQvLyBTb3J0IGJ5IGNyZWF0ZWQgZGF0ZVxuXHRcdFx0XHRzb3J0OiB7XG5cdFx0XHRcdFx0Y3JlYXRlZEF0OiAxXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGxpbWl0OiBiYXRjaFNpemVcblx0XHRcdH0pO1xuXG5cdFx0XHRwZW5kaW5nU01TLmZvckVhY2goZnVuY3Rpb24oc21zKSB7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0c2VuZFNNUyhzbXMpO1xuXHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXG5cdFx0XHRcdFx0aWYgKFNNU1F1ZXVlLmRlYnVnKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnU01TUXVldWU6IENvdWxkIG5vdCBzZW5kIHNtcyBpZDogXCInICsgc21zLl9pZCArICdcIiwgRXJyb3I6ICcgKyBlcnJvci5tZXNzYWdlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pOyAvLyBFTyBmb3JFYWNoXG5cblx0XHRcdC8vIFJlbW92ZSB0aGUgc2VuZCBmZW5jZVxuXHRcdFx0aXNTZW5kaW5nID0gZmFsc2U7XG5cdFx0fSwgb3B0aW9ucy5zZW5kSW50ZXJ2YWwgfHwgMTUwMDApOyAvLyBEZWZhdWx0IGV2ZXJ5IDE1dGggc2VjXG5cblx0fSBlbHNlIHtcblx0XHRpZiAoU01TUXVldWUuZGVidWcpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdTTVNRdWV1ZTogU2VuZCBzZXJ2ZXIgaXMgZGlzYWJsZWQnKTtcblx0XHR9XG5cdH1cblxufTsiLCJ2YXIgaXNDb25maWd1cmVkID0gZmFsc2U7XG52YXIgcmVxdWVzdCA9IHJlcXVpcmUoJ3N1cGVyYWdlbnQnKTtcblxudmFyIHNlbmRXb3JrZXIgPSBmdW5jdGlvbih0YXNrLCBpbnRlcnZhbCkge1xuXG5cdGlmIChXZWJTZXJ2aWNlU01TUXVldWUuZGVidWcpIHtcblx0XHRjb25zb2xlLmxvZygnV2ViU2VydmljZVNNU1F1ZXVlOiBTZW5kIHdvcmtlciBzdGFydGVkLCB1c2luZyBpbnRlcnZhbDogJyArIGludGVydmFsKTtcblx0fVxuXG5cdHJldHVybiBNZXRlb3Iuc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG5cdFx0dHJ5IHtcblx0XHRcdHRhc2soKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0aWYgKFdlYlNlcnZpY2VTTVNRdWV1ZS5kZWJ1Zykge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnV2ViU2VydmljZVNNU1F1ZXVlOiBFcnJvciB3aGlsZSBzZW5kaW5nOiAnICsgZXJyb3IubWVzc2FnZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LCBpbnRlcnZhbCk7XG59O1xuXG5cbnZhciBzZW5kVG9XZWJTZXJ2aWNlID0gZnVuY3Rpb24oZG9jLCB1cmwsIHNwYWNlVG9rZW4sIHNpZ25uYW1lKXtcblx0dmFyIG1lc3NhZ2UgPSBfLmNsb25lKGRvYyk7XG5cdG1lc3NhZ2Uuc2lnbm5hbWUgPSBzaWdubmFtZTtcblx0ZGVsZXRlIG1lc3NhZ2UuX2lkO1xuXHRyZXF1ZXN0XG5cdFx0LnBvc3QodXJsKVxuXHRcdC5zZW5kKG1lc3NhZ2UpXG5cdFx0LnNldCgnQXV0aG9yaXphdGlvbicsICdCZWFyZXIgJyArIHNwYWNlVG9rZW4pXG5cdFx0LmVuZChmdW5jdGlvbihlcnIsIHJlcykge1xuXHRcdFx0aWYgKGVycikge1xuXHRcdFx0XHRyZXR1cm4gY29uc29sZS5lcnJvcihlcnIpO1xuXHRcdFx0fVxuXHRcdH0pO1xufVxuXG4vKlxuXHRvcHRpb25zOiB7XG5cdFx0Ly8gQ29udHJvbHMgdGhlIHNlbmRpbmcgaW50ZXJ2YWxcblx0XHRzZW5kSW50ZXJ2YWw6IE1hdGNoLk9wdGlvbmFsKE51bWJlciksXG5cdFx0Ly8gQ29udHJvbHMgdGhlIHNlbmRpbmcgYmF0Y2ggc2l6ZSBwZXIgaW50ZXJ2YWxcblx0XHRzZW5kQmF0Y2hTaXplOiBNYXRjaC5PcHRpb25hbChOdW1iZXIpLFxuXHRcdC8vIEFsbG93IG9wdGlvbmFsIGtlZXBpbmcgbm90aWZpY2F0aW9ucyBpbiBjb2xsZWN0aW9uXG5cdFx0a2VlcFNNUzogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbilcblx0fVxuKi9cbldlYlNlcnZpY2VTTVNRdWV1ZS5Db25maWd1cmUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblx0b3B0aW9ucyA9IF8uZXh0ZW5kKHtcblx0XHRzZW5kVGltZW91dDogNjAwMDAsIC8vIFRpbWVvdXQgcGVyaW9kIGZvciBzbXMgc2VuZFxuXHR9LCBvcHRpb25zKTtcblxuXHQvLyBCbG9jayBtdWx0aXBsZSBjYWxsc1xuXHRpZiAoaXNDb25maWd1cmVkKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdXZWJTZXJ2aWNlU01TUXVldWUuQ29uZmlndXJlIHNob3VsZCBub3QgYmUgY2FsbGVkIG1vcmUgdGhhbiBvbmNlIScpO1xuXHR9XG5cblx0aXNDb25maWd1cmVkID0gdHJ1ZTtcblxuXHQvLyBBZGQgZGVidWcgaW5mb1xuXHRpZiAoV2ViU2VydmljZVNNU1F1ZXVlLmRlYnVnKSB7XG5cdFx0Y29uc29sZS5sb2coJ1dlYlNlcnZpY2VTTVNRdWV1ZS5Db25maWd1cmUnLCBvcHRpb25zKTtcblx0fVxuXG5cdHZhciB1cmwgPSBvcHRpb25zLnVybDtcblx0dmFyIHNwYWNlVG9rZW4gPSBvcHRpb25zLnNwYWNlVG9rZW47XG5cdHZhciBzaWdubmFtZSA9IG9wdGlvbnMuc2lnbm5hbWU7XG5cblx0c2VsZi5zZW5kU01TID0gZnVuY3Rpb24oc21zKSB7XG5cdFx0aWYgKFdlYlNlcnZpY2VTTVNRdWV1ZS5kZWJ1Zykge1xuXHRcdFx0Y29uc29sZS5sb2coXCJzZW5kU01TXCIpO1xuXHRcdFx0Y29uc29sZS5sb2coc21zKTtcblx0XHR9XG5cdFx0c2VuZFRvV2ViU2VydmljZShzbXMsIHVybCwgc3BhY2VUb2tlbiwgc2lnbm5hbWUpXG5cdH1cblxuXHQvLyBVbml2ZXJzYWwgc2VuZCBmdW5jdGlvblxuXHR2YXIgX3F1ZXJ5U2VuZCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuXHRcdGlmIChzZWxmLnNlbmRTTVMpIHtcblx0XHRcdHNlbGYuc2VuZFNNUyhvcHRpb25zKTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0c21zOiBbb3B0aW9ucy5faWRdXG5cdFx0fTtcblx0fTtcblxuXHRzZWxmLnNlcnZlclNlbmQgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdFx0cmV0dXJuIF9xdWVyeVNlbmQob3B0aW9ucyk7XG5cdH07XG5cblxuXHQvLyBUaGlzIGludGVydmFsIHdpbGwgYWxsb3cgb25seSBvbmUgc21zIHRvIGJlIHNlbnQgYXQgYSB0aW1lLCBpdFxuXHQvLyB3aWxsIGNoZWNrIGZvciBuZXcgc21zIGF0IGV2ZXJ5IGBvcHRpb25zLnNlbmRJbnRlcnZhbGBcblx0Ly8gKGRlZmF1bHQgaW50ZXJ2YWwgaXMgMTUwMDAgbXMpXG5cdC8vXG5cdC8vIEl0IGxvb2tzIGluIHNtcyBjb2xsZWN0aW9uIHRvIHNlZSBpZiB0aGVyZXMgYW55IHBlbmRpbmdcblx0Ly8gc21zLCBpZiBzbyBpdCB3aWxsIHRyeSB0byByZXNlcnZlIHRoZSBwZW5kaW5nIHNtcy5cblx0Ly8gSWYgc3VjY2Vzc2Z1bGx5IHJlc2VydmVkIHRoZSBzZW5kIGlzIHN0YXJ0ZWQuXG5cdC8vXG5cdC8vIElmIHNtcy5xdWVyeSBpcyB0eXBlIHN0cmluZywgaXQncyBhc3N1bWVkIHRvIGJlIGEganNvbiBzdHJpbmdcblx0Ly8gdmVyc2lvbiBvZiB0aGUgcXVlcnkgc2VsZWN0b3IuIE1ha2luZyBpdCBhYmxlIHRvIGNhcnJ5IGAkYCBwcm9wZXJ0aWVzIGluXG5cdC8vIHRoZSBtb25nbyBjb2xsZWN0aW9uLlxuXHQvL1xuXHQvLyBQci4gZGVmYXVsdCBzbXMgYXJlIHJlbW92ZWQgZnJvbSB0aGUgY29sbGVjdGlvbiBhZnRlciBzZW5kIGhhdmVcblx0Ly8gY29tcGxldGVkLiBTZXR0aW5nIGBvcHRpb25zLmtlZXBTTVNgIHdpbGwgdXBkYXRlIGFuZCBrZWVwIHRoZVxuXHQvLyBzbXMgZWcuIGlmIG5lZWRlZCBmb3IgaGlzdG9yaWNhbCByZWFzb25zLlxuXHQvL1xuXHQvLyBBZnRlciB0aGUgc2VuZCBoYXZlIGNvbXBsZXRlZCBhIFwic2VuZFwiIGV2ZW50IHdpbGwgYmUgZW1pdHRlZCB3aXRoIGFcblx0Ly8gc3RhdHVzIG9iamVjdCBjb250YWluaW5nIHNtcyBpZCBhbmQgdGhlIHNlbmQgcmVzdWx0IG9iamVjdC5cblx0Ly9cblx0dmFyIGlzU2VuZGluZyA9IGZhbHNlO1xuXG5cdGlmIChvcHRpb25zLnNlbmRJbnRlcnZhbCAhPT0gbnVsbCkge1xuXG5cdFx0Ly8gVGhpcyB3aWxsIHJlcXVpcmUgaW5kZXggc2luY2Ugd2Ugc29ydCBzbXMgYnkgY3JlYXRlZEF0XG5cdFx0V2ViU2VydmljZVNNU1F1ZXVlLmNvbGxlY3Rpb24uX2Vuc3VyZUluZGV4KHtcblx0XHRcdGNyZWF0ZWRBdDogMVxuXHRcdH0pO1xuXHRcdFdlYlNlcnZpY2VTTVNRdWV1ZS5jb2xsZWN0aW9uLl9lbnN1cmVJbmRleCh7XG5cdFx0XHRzZW50OiAxXG5cdFx0fSk7XG5cdFx0V2ViU2VydmljZVNNU1F1ZXVlLmNvbGxlY3Rpb24uX2Vuc3VyZUluZGV4KHtcblx0XHRcdHNlbmRpbmc6IDFcblx0XHR9KTtcblxuXG5cdFx0dmFyIHNlbmRTTVMgPSBmdW5jdGlvbihzbXMpIHtcblx0XHRcdC8vIFJlc2VydmUgc21zXG5cdFx0XHR2YXIgbm93ID0gK25ldyBEYXRlKCk7XG5cdFx0XHR2YXIgdGltZW91dEF0ID0gbm93ICsgb3B0aW9ucy5zZW5kVGltZW91dDtcblx0XHRcdHZhciByZXNlcnZlZCA9IFdlYlNlcnZpY2VTTVNRdWV1ZS5jb2xsZWN0aW9uLnVwZGF0ZSh7XG5cdFx0XHRcdF9pZDogc21zLl9pZCxcblx0XHRcdFx0c2VudDogZmFsc2UsIC8vIHh4eDogbmVlZCB0byBtYWtlIHN1cmUgdGhpcyBpcyBzZXQgb24gY3JlYXRlXG5cdFx0XHRcdHNlbmRpbmc6IHtcblx0XHRcdFx0XHQkbHQ6IG5vd1xuXHRcdFx0XHR9XG5cdFx0XHR9LCB7XG5cdFx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0XHRzZW5kaW5nOiB0aW1lb3V0QXQsXG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBNYWtlIHN1cmUgd2Ugb25seSBoYW5kbGUgc21zIHJlc2VydmVkIGJ5IHRoaXNcblx0XHRcdC8vIGluc3RhbmNlXG5cdFx0XHRpZiAocmVzZXJ2ZWQpIHtcblxuXHRcdFx0XHQvLyBTZW5kIHRoZSBzbXNcblx0XHRcdFx0dmFyIHJlc3VsdCA9IFdlYlNlcnZpY2VTTVNRdWV1ZS5zZXJ2ZXJTZW5kKHNtcyk7XG5cblx0XHRcdFx0aWYgKCFvcHRpb25zLmtlZXBTTVMpIHtcblx0XHRcdFx0XHQvLyBQci4gRGVmYXVsdCB3ZSB3aWxsIHJlbW92ZSBzbXNcblx0XHRcdFx0XHRXZWJTZXJ2aWNlU01TUXVldWUuY29sbGVjdGlvbi5yZW1vdmUoe1xuXHRcdFx0XHRcdFx0X2lkOiBzbXMuX2lkXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0XHQvLyBVcGRhdGUgdGhlIHNtc1xuXHRcdFx0XHRcdFdlYlNlcnZpY2VTTVNRdWV1ZS5jb2xsZWN0aW9uLnVwZGF0ZSh7XG5cdFx0XHRcdFx0XHRfaWQ6IHNtcy5faWRcblx0XHRcdFx0XHR9LCB7XG5cdFx0XHRcdFx0XHQkc2V0OiB7XG5cdFx0XHRcdFx0XHRcdC8vIE1hcmsgYXMgc2VudFxuXHRcdFx0XHRcdFx0XHRzZW50OiB0cnVlLFxuXHRcdFx0XHRcdFx0XHQvLyBTZXQgdGhlIHNlbnQgZGF0ZVxuXHRcdFx0XHRcdFx0XHRzZW50QXQ6IG5ldyBEYXRlKCksXG5cdFx0XHRcdFx0XHRcdC8vIE5vdCBiZWluZyBzZW50IGFueW1vcmVcblx0XHRcdFx0XHRcdFx0c2VuZGluZzogMFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBFbWl0IHRoZSBzZW5kXG5cdFx0XHRcdHNlbGYuZW1pdCgnc2VuZCcsIHtcblx0XHRcdFx0XHRzbXM6IHNtcy5faWQsXG5cdFx0XHRcdFx0cmVzdWx0OiByZXN1bHRcblx0XHRcdFx0fSk7XG5cblx0XHRcdH0gLy8gRWxzZSBjb3VsZCBub3QgcmVzZXJ2ZVxuXHRcdH07IC8vIEVPIHNlbmRTTVNcblxuXHRcdHNlbmRXb3JrZXIoZnVuY3Rpb24oKSB7XG5cblx0XHRcdGlmIChpc1NlbmRpbmcpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0Ly8gU2V0IHNlbmQgZmVuY2Vcblx0XHRcdGlzU2VuZGluZyA9IHRydWU7XG5cblx0XHRcdHZhciBiYXRjaFNpemUgPSBvcHRpb25zLnNlbmRCYXRjaFNpemUgfHwgMTtcblxuXHRcdFx0dmFyIG5vdyA9ICtuZXcgRGF0ZSgpO1xuXG5cdFx0XHQvLyBGaW5kIHNtcyB0aGF0IGFyZSBub3QgYmVpbmcgb3IgYWxyZWFkeSBzZW50XG5cdFx0XHR2YXIgcGVuZGluZ1NNUyA9IFdlYlNlcnZpY2VTTVNRdWV1ZS5jb2xsZWN0aW9uLmZpbmQoe1xuXHRcdFx0XHQkYW5kOiBbXG5cdFx0XHRcdFx0Ly8gTWVzc2FnZSBpcyBub3Qgc2VudFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHNlbnQ6IGZhbHNlXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHQvLyBBbmQgbm90IGJlaW5nIHNlbnQgYnkgb3RoZXIgaW5zdGFuY2VzXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0c2VuZGluZzoge1xuXHRcdFx0XHRcdFx0XHQkbHQ6IG5vd1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XVxuXHRcdFx0fSwge1xuXHRcdFx0XHQvLyBTb3J0IGJ5IGNyZWF0ZWQgZGF0ZVxuXHRcdFx0XHRzb3J0OiB7XG5cdFx0XHRcdFx0Y3JlYXRlZEF0OiAxXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGxpbWl0OiBiYXRjaFNpemVcblx0XHRcdH0pO1xuXG5cdFx0XHRwZW5kaW5nU01TLmZvckVhY2goZnVuY3Rpb24oc21zKSB7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0c2VuZFNNUyhzbXMpO1xuXHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXG5cdFx0XHRcdFx0aWYgKFdlYlNlcnZpY2VTTVNRdWV1ZS5kZWJ1Zykge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ1dlYlNlcnZpY2VTTVNRdWV1ZTogQ291bGQgbm90IHNlbmQgc21zIGlkOiBcIicgKyBzbXMuX2lkICsgJ1wiLCBFcnJvcjogJyArIGVycm9yLm1lc3NhZ2UpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSk7IC8vIEVPIGZvckVhY2hcblxuXHRcdFx0Ly8gUmVtb3ZlIHRoZSBzZW5kIGZlbmNlXG5cdFx0XHRpc1NlbmRpbmcgPSBmYWxzZTtcblx0XHR9LCBvcHRpb25zLnNlbmRJbnRlcnZhbCB8fCAxNTAwMCk7IC8vIERlZmF1bHQgZXZlcnkgMTV0aCBzZWNcblxuXHR9IGVsc2Uge1xuXHRcdGlmIChXZWJTZXJ2aWNlU01TUXVldWUuZGVidWcpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdXZWJTZXJ2aWNlU01TUXVldWU6IFNlbmQgc2VydmVyIGlzIGRpc2FibGVkJyk7XG5cdFx0fVxuXHR9XG5cbn07IiwiTWV0ZW9yLnN0YXJ0dXAgLT5cblx0aWYgTWV0ZW9yLnNldHRpbmdzLnNtcz8ud2Vic2VydmljZT8uc21zcXVldWVfaW50ZXJ2YWwgJiYgKE1ldGVvci5zZXR0aW5ncy5zbXM/LmFsaXl1bj8uc21zcXVldWVfaW50ZXJ2YWwgfHwgTWV0ZW9yLnNldHRpbmdzLnNtcz8ucWNsb3VkPy5zbXNxdWV1ZV9pbnRlcnZhbClcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdzbXMud2Vic2VydmljZSBjYW5ub3QgYmUgY29uZmlndXJlZCB3aXRoIHNtcy5hbGl5dW4gb3Igc21zLnFjbG91ZCcpO1xuXG5cdGlmIE1ldGVvci5zZXR0aW5ncy5zbXM/LmFsaXl1bj8uc21zcXVldWVfaW50ZXJ2YWxcblx0XHRTTVNRdWV1ZS5Db25maWd1cmVcblx0XHRcdHNlbmRJbnRlcnZhbDogTWV0ZW9yLnNldHRpbmdzLnNtcy5hbGl5dW4uc21zcXVldWVfaW50ZXJ2YWxcblx0XHRcdHNlbmRCYXRjaFNpemU6IDEwXG5cdFx0XHRrZWVwU01TOiB0cnVlXG5cdFx0XHRhY2Nlc3NLZXlJZDogTWV0ZW9yLnNldHRpbmdzLnNtcy5hbGl5dW4uYWNjZXNzS2V5SWRcblx0XHRcdGFjY2Vzc0tleVNlY3JldDogTWV0ZW9yLnNldHRpbmdzLnNtcy5hbGl5dW4uYWNjZXNzS2V5U2VjcmV0XG5cblx0aWYgTWV0ZW9yLnNldHRpbmdzLnNtcz8ud2Vic2VydmljZT8uc21zcXVldWVfaW50ZXJ2YWxcblx0XHRXZWJTZXJ2aWNlU01TUXVldWUuQ29uZmlndXJlXG5cdFx0XHRzZW5kSW50ZXJ2YWw6IE1ldGVvci5zZXR0aW5ncy5zbXMud2Vic2VydmljZS5zbXNxdWV1ZV9pbnRlcnZhbFxuXHRcdFx0dXJsOiBNZXRlb3Iuc2V0dGluZ3Muc21zLndlYnNlcnZpY2UudXJsXG5cdFx0XHRzcGFjZVRva2VuOiBNZXRlb3Iuc2V0dGluZ3Muc21zLndlYnNlcnZpY2Uuc3BhY2VfdG9rZW5cblx0XHRcdHNpZ25uYW1lOiBNZXRlb3Iuc2V0dGluZ3Muc21zLndlYnNlcnZpY2Uuc2lnbm5hbWVcblx0XHRcdHNlbmRCYXRjaFNpemU6IDEwXG5cdFx0XHRrZWVwU01TOiB0cnVlXG5cblxuXG4iLCJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcbiAgdmFyIHJlZiwgcmVmMSwgcmVmMiwgcmVmMywgcmVmNCwgcmVmNSwgcmVmNiwgcmVmNywgcmVmOCwgcmVmOTtcbiAgaWYgKCgocmVmID0gTWV0ZW9yLnNldHRpbmdzLnNtcykgIT0gbnVsbCA/IChyZWYxID0gcmVmLndlYnNlcnZpY2UpICE9IG51bGwgPyByZWYxLnNtc3F1ZXVlX2ludGVydmFsIDogdm9pZCAwIDogdm9pZCAwKSAmJiAoKChyZWYyID0gTWV0ZW9yLnNldHRpbmdzLnNtcykgIT0gbnVsbCA/IChyZWYzID0gcmVmMi5hbGl5dW4pICE9IG51bGwgPyByZWYzLnNtc3F1ZXVlX2ludGVydmFsIDogdm9pZCAwIDogdm9pZCAwKSB8fCAoKHJlZjQgPSBNZXRlb3Iuc2V0dGluZ3Muc21zKSAhPSBudWxsID8gKHJlZjUgPSByZWY0LnFjbG91ZCkgIT0gbnVsbCA/IHJlZjUuc21zcXVldWVfaW50ZXJ2YWwgOiB2b2lkIDAgOiB2b2lkIDApKSkge1xuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ3Ntcy53ZWJzZXJ2aWNlIGNhbm5vdCBiZSBjb25maWd1cmVkIHdpdGggc21zLmFsaXl1biBvciBzbXMucWNsb3VkJyk7XG4gIH1cbiAgaWYgKChyZWY2ID0gTWV0ZW9yLnNldHRpbmdzLnNtcykgIT0gbnVsbCA/IChyZWY3ID0gcmVmNi5hbGl5dW4pICE9IG51bGwgPyByZWY3LnNtc3F1ZXVlX2ludGVydmFsIDogdm9pZCAwIDogdm9pZCAwKSB7XG4gICAgU01TUXVldWUuQ29uZmlndXJlKHtcbiAgICAgIHNlbmRJbnRlcnZhbDogTWV0ZW9yLnNldHRpbmdzLnNtcy5hbGl5dW4uc21zcXVldWVfaW50ZXJ2YWwsXG4gICAgICBzZW5kQmF0Y2hTaXplOiAxMCxcbiAgICAgIGtlZXBTTVM6IHRydWUsXG4gICAgICBhY2Nlc3NLZXlJZDogTWV0ZW9yLnNldHRpbmdzLnNtcy5hbGl5dW4uYWNjZXNzS2V5SWQsXG4gICAgICBhY2Nlc3NLZXlTZWNyZXQ6IE1ldGVvci5zZXR0aW5ncy5zbXMuYWxpeXVuLmFjY2Vzc0tleVNlY3JldFxuICAgIH0pO1xuICB9XG4gIGlmICgocmVmOCA9IE1ldGVvci5zZXR0aW5ncy5zbXMpICE9IG51bGwgPyAocmVmOSA9IHJlZjgud2Vic2VydmljZSkgIT0gbnVsbCA/IHJlZjkuc21zcXVldWVfaW50ZXJ2YWwgOiB2b2lkIDAgOiB2b2lkIDApIHtcbiAgICByZXR1cm4gV2ViU2VydmljZVNNU1F1ZXVlLkNvbmZpZ3VyZSh7XG4gICAgICBzZW5kSW50ZXJ2YWw6IE1ldGVvci5zZXR0aW5ncy5zbXMud2Vic2VydmljZS5zbXNxdWV1ZV9pbnRlcnZhbCxcbiAgICAgIHVybDogTWV0ZW9yLnNldHRpbmdzLnNtcy53ZWJzZXJ2aWNlLnVybCxcbiAgICAgIHNwYWNlVG9rZW46IE1ldGVvci5zZXR0aW5ncy5zbXMud2Vic2VydmljZS5zcGFjZV90b2tlbixcbiAgICAgIHNpZ25uYW1lOiBNZXRlb3Iuc2V0dGluZ3Muc21zLndlYnNlcnZpY2Uuc2lnbm5hbWUsXG4gICAgICBzZW5kQmF0Y2hTaXplOiAxMCxcbiAgICAgIGtlZXBTTVM6IHRydWVcbiAgICB9KTtcbiAgfVxufSk7XG4iXX0=
