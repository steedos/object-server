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
var SMSQueue = Package['steedos:smsqueue'].SMSQueue;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var QcloudSMSQueue, signname, __coffeescriptShare;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:qcloud-smsqueue":{"checkNpm.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/steedos_qcloud-smsqueue/checkNpm.js                                                                       //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let checkNpmVersions;
module.link("meteor/tmeasday:check-npm-versions", {
  checkNpmVersions(v) {
    checkNpmVersions = v;
  }

}, 0);
checkNpmVersions({
  "superagent": "^3.5.2",
  "sha256": "^0.2.0"
}, 'steedos:qcloud-smsqueue');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"common":{"main.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/steedos_qcloud-smsqueue/lib/common/main.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
QcloudSMSQueue = new EventState();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sms.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/steedos_qcloud-smsqueue/lib/common/sms.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
QcloudSMSQueue.collection = SMSQueue.collection;

var _validateDocument = function (sms) {
  check(sms, {
    sms: Object,
    sent: Match.Optional(Boolean),
    sending: Match.Optional(Match.Integer),
    createdAt: Date,
    createdBy: Match.OneOf(String, null)
  });
};

QcloudSMSQueue.send = function (options) {
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

  return QcloudSMSQueue.collection.insert(sms);
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"api.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/steedos_qcloud-smsqueue/lib/server/api.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var isConfigured = false;

var sendWorker = function (task, interval) {
  if (QcloudSMSQueue.debug) {
    console.log('QcloudSMSQueue: Send worker started, using interval: ' + interval);
  }

  return Meteor.setInterval(function () {
    try {
      task();
    } catch (error) {
      if (QcloudSMSQueue.debug) {
        console.log('QcloudSMSQueue: Error while sending: ' + error.message);
      }
    }
  }, interval);
}; // var SMS = require('aliyun-sms-node'),
// 	smsSender;


var sdkappid, appkey;

var request = require('superagent'),
    sha256 = require('sha256');

function getRand(bit) {
  bit = bit || 10000000;
  return Math.round(Math.random() * bit);
}

; //send text message

function sendTextMsg(sdkappid, appkey, phone, msg) {
  if (!phone || /1\d{12}/.test(phone)) {
    return console.log('invalid phone number');
  }

  var url = 'https://yun.tim.qq.com/v5/tlssmssvr/sendsms?sdkappid={sdkappid}&random={random}';
  var rand = getRand(),
      time = Math.round(+new Date() / 1000),
      sig = sha256('appkey=' + appkey + '&random=' + rand + '&time=' + time + '&mobile=' + phone);
  var content = {
    "tel": {
      //如需使用国际电话号码通用格式，如："+8613788888888" ，请使用sendisms接口见下注
      "nationcode": "86",
      //国家码
      "mobile": phone //手机号码

    },
    "type": 0,
    //0:普通短信;1:营销短信（强调：要按需填值，不然会影响到业务的正常使用）
    "msg": msg,
    //utf8编码 
    "sig": sig,
    //app凭证，具体计算方式见下注
    "time": time,
    //unix时间戳，请求发起时间，如果和系统时间相差超过10分钟则会返回失败
    "extend": "",
    //通道扩展码，可选字段，默认没有开通(需要填空)。
    //在短信回复场景中，腾讯server会原样返回，开发者可依此区分是哪种类型的回复
    "ext": "" //用户的session内容，腾讯server回包中会原样返回，可选字段，不需要就填空。

  };
  url = url.replace('{sdkappid}', sdkappid).replace('{random}', rand);
  request.post(url).send(content).end(function (err, res) {
    if (err) {
      return console.error(err);
    }
  });
}

;
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

QcloudSMSQueue.Configure = function (options) {
  var self = this;
  options = _.extend({
    sendTimeout: 60000 // Timeout period for sms send

  }, options); // Block multiple calls

  if (isConfigured) {
    throw new Error('QcloudSMSQueue.Configure should not be called more than once!');
  }

  isConfigured = true; // Add debug info

  if (QcloudSMSQueue.debug) {
    console.log('QcloudSMSQueue.Configure', options);
  } // smsSender = new SMS({
  // 	AccessKeyId: options.accessKeyId,
  // 	AccessKeySecret: options.accessKeySecret
  // });


  sdkappid = options.sdkappid;
  appkey = options.appkey;
  signname = options.signname || "";

  self.sendSMS = function (sms) {
    if (QcloudSMSQueue.debug) {
      console.log("sendSMS");
      console.log(sms);
    } // smsSender.send(sms.sms).catch(err => {
    // 	console.error(err)
    // });


    sendTextMsg(sdkappid, appkey, sms.sms.RecNum, (sms.signname || signname) + sms.sms.msg);
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
    QcloudSMSQueue.collection._ensureIndex({
      createdAt: 1
    });

    QcloudSMSQueue.collection._ensureIndex({
      sent: 1
    });

    QcloudSMSQueue.collection._ensureIndex({
      sending: 1
    });

    var sendSMS = function (sms) {
      // Reserve sms
      var now = +new Date();
      var timeoutAt = now + options.sendTimeout;
      var reserved = QcloudSMSQueue.collection.update({
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
        var result = QcloudSMSQueue.serverSend(sms);

        if (!options.keepSMS) {
          // Pr. Default we will remove sms
          QcloudSMSQueue.collection.remove({
            _id: sms._id
          });
        } else {
          // Update the sms
          QcloudSMSQueue.collection.update({
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

      var pendingSMS = QcloudSMSQueue.collection.find({
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
          if (QcloudSMSQueue.debug) {
            console.log('QcloudSMSQueue: Could not send sms id: "' + sms._id + '", Error: ' + error.message);
          }
        }
      }); // EO forEach
      // Remove the send fence

      isSending = false;
    }, options.sendInterval || 15000); // Default every 15th sec
  } else {
    if (QcloudSMSQueue.debug) {
      console.log('QcloudSMSQueue: Send server is disabled');
    }
  }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"server":{"startup.coffee":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/steedos_qcloud-smsqueue/server/startup.coffee                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.startup(function () {
  var ref, ref1;

  if ((ref = Meteor.settings.sms) != null ? (ref1 = ref.qcloud) != null ? ref1.smsqueue_interval : void 0 : void 0) {
    return QcloudSMSQueue.Configure({
      sendInterval: Meteor.settings.sms.qcloud.smsqueue_interval,
      sendBatchSize: 10,
      keepSMS: true,
      sdkappid: Meteor.settings.sms.qcloud.sdkappid,
      appkey: Meteor.settings.sms.qcloud.appkey,
      signname: Meteor.settings.sms.qcloud.signname
    });
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".coffee"
  ]
});

require("/node_modules/meteor/steedos:qcloud-smsqueue/checkNpm.js");
require("/node_modules/meteor/steedos:qcloud-smsqueue/lib/common/main.js");
require("/node_modules/meteor/steedos:qcloud-smsqueue/lib/common/sms.js");
require("/node_modules/meteor/steedos:qcloud-smsqueue/lib/server/api.js");
require("/node_modules/meteor/steedos:qcloud-smsqueue/server/startup.coffee");

/* Exports */
Package._define("steedos:qcloud-smsqueue");

})();

//# sourceURL=meteor://💻app/packages/steedos_qcloud-smsqueue.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpxY2xvdWQtc21zcXVldWUvY2hlY2tOcG0uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3M6cWNsb3VkLXNtc3F1ZXVlL2xpYi9jb21tb24vbWFpbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpxY2xvdWQtc21zcXVldWUvbGliL2NvbW1vbi9zbXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3M6cWNsb3VkLXNtc3F1ZXVlL2xpYi9zZXJ2ZXIvYXBpLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX3FjbG91ZC1zbXNxdWV1ZS9zZXJ2ZXIvc3RhcnR1cC5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9zdGFydHVwLmNvZmZlZSJdLCJuYW1lcyI6WyJjaGVja05wbVZlcnNpb25zIiwibW9kdWxlIiwibGluayIsInYiLCJRY2xvdWRTTVNRdWV1ZSIsIkV2ZW50U3RhdGUiLCJjb2xsZWN0aW9uIiwiU01TUXVldWUiLCJfdmFsaWRhdGVEb2N1bWVudCIsInNtcyIsImNoZWNrIiwiT2JqZWN0Iiwic2VudCIsIk1hdGNoIiwiT3B0aW9uYWwiLCJCb29sZWFuIiwic2VuZGluZyIsIkludGVnZXIiLCJjcmVhdGVkQXQiLCJEYXRlIiwiY3JlYXRlZEJ5IiwiT25lT2YiLCJTdHJpbmciLCJzZW5kIiwib3B0aW9ucyIsImN1cnJlbnRVc2VyIiwiTWV0ZW9yIiwiaXNDbGllbnQiLCJ1c2VySWQiLCJpc1NlcnZlciIsIl8iLCJleHRlbmQiLCJ0ZXN0IiwicGljayIsImluc2VydCIsImlzQ29uZmlndXJlZCIsInNlbmRXb3JrZXIiLCJ0YXNrIiwiaW50ZXJ2YWwiLCJkZWJ1ZyIsImNvbnNvbGUiLCJsb2ciLCJzZXRJbnRlcnZhbCIsImVycm9yIiwibWVzc2FnZSIsInNka2FwcGlkIiwiYXBwa2V5IiwicmVxdWVzdCIsInJlcXVpcmUiLCJzaGEyNTYiLCJnZXRSYW5kIiwiYml0IiwiTWF0aCIsInJvdW5kIiwicmFuZG9tIiwic2VuZFRleHRNc2ciLCJwaG9uZSIsIm1zZyIsInVybCIsInJhbmQiLCJ0aW1lIiwic2lnIiwiY29udGVudCIsInJlcGxhY2UiLCJwb3N0IiwiZW5kIiwiZXJyIiwicmVzIiwiQ29uZmlndXJlIiwic2VsZiIsInNlbmRUaW1lb3V0IiwiRXJyb3IiLCJzaWdubmFtZSIsInNlbmRTTVMiLCJSZWNOdW0iLCJfcXVlcnlTZW5kIiwiX2lkIiwic2VydmVyU2VuZCIsImlzU2VuZGluZyIsInNlbmRJbnRlcnZhbCIsIl9lbnN1cmVJbmRleCIsIm5vdyIsInRpbWVvdXRBdCIsInJlc2VydmVkIiwidXBkYXRlIiwiJGx0IiwiJHNldCIsInJlc3VsdCIsImtlZXBTTVMiLCJyZW1vdmUiLCJzZW50QXQiLCJlbWl0IiwiYmF0Y2hTaXplIiwic2VuZEJhdGNoU2l6ZSIsInBlbmRpbmdTTVMiLCJmaW5kIiwiJGFuZCIsInNvcnQiLCJsaW1pdCIsImZvckVhY2giLCJzdGFydHVwIiwicmVmIiwicmVmMSIsInNldHRpbmdzIiwicWNsb3VkIiwic21zcXVldWVfaW50ZXJ2YWwiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxnQkFBSjtBQUFxQkMsTUFBTSxDQUFDQyxJQUFQLENBQVksb0NBQVosRUFBaUQ7QUFBQ0Ysa0JBQWdCLENBQUNHLENBQUQsRUFBRztBQUFDSCxvQkFBZ0IsR0FBQ0csQ0FBakI7QUFBbUI7O0FBQXhDLENBQWpELEVBQTJGLENBQTNGO0FBQ3JCSCxnQkFBZ0IsQ0FBQztBQUNoQixnQkFBYyxRQURFO0FBRWhCLFlBQVU7QUFGTSxDQUFELEVBR2IseUJBSGEsQ0FBaEIsQzs7Ozs7Ozs7Ozs7QUNEQUksY0FBYyxHQUFHLElBQUlDLFVBQUosRUFBakIsQzs7Ozs7Ozs7Ozs7QUNBQUQsY0FBYyxDQUFDRSxVQUFmLEdBQTRCQyxRQUFRLENBQUNE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Q2pGQWYsT0FBTzBFLE9BQVAsQ0FBZTtBQUNkLE1BQUFDLEdBQUEsRUFBQUMsSUFBQTs7QUFBQSxPQUFBRCxNQUFBM0UsT0FBQTZFLFFBQUEsQ0FBQTlGLEdBQUEsYUFBQTZGLE9BQUFELElBQUFHLE1BQUEsWUFBQUYsS0FBZ0NHLGlCQUFoQyxHQUFnQyxNQUFoQyxHQUFnQyxNQUFoQztBQ0VHLFdEREZyRyxlQUFlZ0UsU0FBZixDQUNDO0FBQUFXLG9CQUFjckQsT0FBTzZFLFFBQVAsQ0FBZ0I5RixHQUFoQixDQUFvQitGLE1BQXBCLENBQTJCQyxpQkFBekM7QUFDQVoscUJBQWUsRUFEZjtBQUVBTCxlQUFTLElBRlQ7QUFHQTNDLGdCQUFVbkIsT0FBTzZFLFFBQVAsQ0FBZ0I5RixHQUFoQixDQUFvQitGLE1BQXBCLENBQTJCM0QsUUFIckM7QUFJQUMsY0FBUXBCLE9BQU82RSxRQUFQLENBQWdCOUYsR0FBaEIsQ0FBb0IrRixNQUFwQixDQUEyQjFELE1BSm5DO0FBS0EwQixnQkFBVTlDLE9BQU82RSxRQUFQLENBQWdCOUYsR0FBaEIsQ0FBb0IrRixNQUFwQixDQUEyQmhDO0FBTHJDLEtBREQsQ0NDRTtBQVFEO0FEWEgsRyIsImZpbGUiOiIvcGFja2FnZXMvc3RlZWRvc19xY2xvdWQtc21zcXVldWUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjaGVja05wbVZlcnNpb25zIH0gZnJvbSAnbWV0ZW9yL3RtZWFzZGF5OmNoZWNrLW5wbS12ZXJzaW9ucyc7XG5jaGVja05wbVZlcnNpb25zKHtcblx0XCJzdXBlcmFnZW50XCI6IFwiXjMuNS4yXCIsXG5cdFwic2hhMjU2XCI6IFwiXjAuMi4wXCJcbn0sICdzdGVlZG9zOnFjbG91ZC1zbXNxdWV1ZScpOyIsIlFjbG91ZFNNU1F1ZXVlID0gbmV3IEV2ZW50U3RhdGUoKTsiLCJRY2xvdWRTTVNRdWV1ZS5jb2xsZWN0aW9uID0gU01TUXVldWUuY29sbGVjdGlvbjtcblxudmFyIF92YWxpZGF0ZURvY3VtZW50ID0gZnVuY3Rpb24oc21zKSB7XG5cblx0Y2hlY2soc21zLCB7XG5cdFx0c21zOiBPYmplY3QsXG5cdFx0c2VudDogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG5cdFx0c2VuZGluZzogTWF0Y2guT3B0aW9uYWwoTWF0Y2guSW50ZWdlciksXG5cdFx0Y3JlYXRlZEF0OiBEYXRlLFxuXHRcdGNyZWF0ZWRCeTogTWF0Y2guT25lT2YoU3RyaW5nLCBudWxsKVxuXHR9KTtcblxufTtcblxuUWNsb3VkU01TUXVldWUuc2VuZCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0dmFyIGN1cnJlbnRVc2VyID0gTWV0ZW9yLmlzQ2xpZW50ICYmIE1ldGVvci51c2VySWQgJiYgTWV0ZW9yLnVzZXJJZCgpIHx8IE1ldGVvci5pc1NlcnZlciAmJiAob3B0aW9ucy5jcmVhdGVkQnkgfHwgJzxTRVJWRVI+JykgfHwgbnVsbFxuXHR2YXIgc21zID0gXy5leHRlbmQoe1xuXHRcdGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcblx0XHRjcmVhdGVkQnk6IGN1cnJlbnRVc2VyXG5cdH0pO1xuXG5cdGlmIChNYXRjaC50ZXN0KG9wdGlvbnMsIE9iamVjdCkpIHtcblx0XHRzbXMuc21zID0gXy5waWNrKG9wdGlvbnMsICdGb3JtYXQnLCAnQWN0aW9uJywgJ1BhcmFtU3RyaW5nJywgJ1JlY051bScsICdTaWduTmFtZScsICdUZW1wbGF0ZUNvZGUnLCAnbXNnJyk7XG5cdH1cblxuXHRzbXMuc2VudCA9IGZhbHNlO1xuXHRzbXMuc2VuZGluZyA9IDA7XG5cblx0X3ZhbGlkYXRlRG9jdW1lbnQoc21zKTtcblxuXHRyZXR1cm4gUWNsb3VkU01TUXVldWUuY29sbGVjdGlvbi5pbnNlcnQoc21zKTtcbn07IiwidmFyIGlzQ29uZmlndXJlZCA9IGZhbHNlO1xudmFyIHNlbmRXb3JrZXIgPSBmdW5jdGlvbih0YXNrLCBpbnRlcnZhbCkge1xuXG5cdGlmIChRY2xvdWRTTVNRdWV1ZS5kZWJ1Zykge1xuXHRcdGNvbnNvbGUubG9nKCdRY2xvdWRTTVNRdWV1ZTogU2VuZCB3b3JrZXIgc3RhcnRlZCwgdXNpbmcgaW50ZXJ2YWw6ICcgKyBpbnRlcnZhbCk7XG5cdH1cblxuXHRyZXR1cm4gTWV0ZW9yLnNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuXHRcdHRyeSB7XG5cdFx0XHR0YXNrKCk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGlmIChRY2xvdWRTTVNRdWV1ZS5kZWJ1Zykge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnUWNsb3VkU01TUXVldWU6IEVycm9yIHdoaWxlIHNlbmRpbmc6ICcgKyBlcnJvci5tZXNzYWdlKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sIGludGVydmFsKTtcbn07XG5cbi8vIHZhciBTTVMgPSByZXF1aXJlKCdhbGl5dW4tc21zLW5vZGUnKSxcbi8vIFx0c21zU2VuZGVyO1xuXG52YXIgc2RrYXBwaWQsIGFwcGtleTtcblxudmFyIHJlcXVlc3QgPSByZXF1aXJlKCdzdXBlcmFnZW50JyksXG5cdHNoYTI1NiA9IHJlcXVpcmUoJ3NoYTI1NicpO1xuXG5mdW5jdGlvbiBnZXRSYW5kKGJpdCkge1xuXG5cdGJpdCA9IGJpdCB8fCAxMDAwMDAwMDtcblxuXHRyZXR1cm4gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogYml0KTtcbn07XG5cbi8vc2VuZCB0ZXh0IG1lc3NhZ2VcbmZ1bmN0aW9uIHNlbmRUZXh0TXNnKHNka2FwcGlkLCBhcHBrZXksIHBob25lLCBtc2cpIHtcblxuXHRpZiAoIXBob25lIHx8IC8xXFxkezEyfS8udGVzdChwaG9uZSkpIHtcblx0XHRyZXR1cm4gY29uc29sZS5sb2coJ2ludmFsaWQgcGhvbmUgbnVtYmVyJyk7XG5cdH1cblxuXHR2YXIgdXJsID0gJ2h0dHBzOi8veXVuLnRpbS5xcS5jb20vdjUvdGxzc21zc3ZyL3NlbmRzbXM/c2RrYXBwaWQ9e3Nka2FwcGlkfSZyYW5kb209e3JhbmRvbX0nO1xuXG5cdHZhciByYW5kID0gZ2V0UmFuZCgpLFxuXHRcdHRpbWUgPSBNYXRoLnJvdW5kKCtuZXcgRGF0ZSgpIC8gMTAwMCksXG5cdFx0c2lnID0gc2hhMjU2KCdhcHBrZXk9JyArIGFwcGtleSArICcmcmFuZG9tPScgKyByYW5kICsgJyZ0aW1lPScgKyB0aW1lICsgJyZtb2JpbGU9JyArIHBob25lKTtcblxuXHR2YXIgY29udGVudCA9IHtcblx0XHRcInRlbFwiOiB7IC8v5aaC6ZyA5L2/55So5Zu96ZmF55S16K+d5Y+356CB6YCa55So5qC85byP77yM5aaC77yaXCIrODYxMzc4ODg4ODg4OFwiIO+8jOivt+S9v+eUqHNlbmRpc21z5o6l5Y+j6KeB5LiL5rOoXG5cdFx0XHRcIm5hdGlvbmNvZGVcIjogXCI4NlwiLCAvL+WbveWutueggVxuXHRcdFx0XCJtb2JpbGVcIjogcGhvbmUgLy/miYvmnLrlj7fnoIFcblx0XHR9LFxuXHRcdFwidHlwZVwiOiAwLCAvLzA65pmu6YCa55+t5L+hOzE66JCl6ZSA55+t5L+h77yI5by66LCD77ya6KaB5oyJ6ZyA5aGr5YC877yM5LiN54S25Lya5b2x5ZON5Yiw5Lia5Yqh55qE5q2j5bi45L2/55So77yJXG5cdFx0XCJtc2dcIjogbXNnLCAvL3V0ZjjnvJbnoIEgXG5cdFx0XCJzaWdcIjogc2lnLCAvL2FwcOWHreivge+8jOWFt+S9k+iuoeeul+aWueW8j+ingeS4i+azqFxuXHRcdFwidGltZVwiOiB0aW1lLCAvL3VuaXjml7bpl7TmiLPvvIzor7fmsYLlj5Hotbfml7bpl7TvvIzlpoLmnpzlkozns7vnu5/ml7bpl7Tnm7jlt67otoXov4cxMOWIhumSn+WImeS8mui/lOWbnuWksei0pVxuXHRcdFwiZXh0ZW5kXCI6IFwiXCIsIC8v6YCa6YGT5omp5bGV56CB77yM5Y+v6YCJ5a2X5q6177yM6buY6K6k5rKh5pyJ5byA6YCaKOmcgOimgeWhq+epuinjgIJcblx0XHQvL+WcqOefreS/oeWbnuWkjeWcuuaZr+S4re+8jOiFvuiur3NlcnZlcuS8muWOn+agt+i/lOWbnu+8jOW8gOWPkeiAheWPr+S+neatpOWMuuWIhuaYr+WTquenjeexu+Wei+eahOWbnuWkjVxuXHRcdFwiZXh0XCI6IFwiXCIgLy/nlKjmiLfnmoRzZXNzaW9u5YaF5a6577yM6IW+6K6vc2VydmVy5Zue5YyF5Lit5Lya5Y6f5qC36L+U5Zue77yM5Y+v6YCJ5a2X5q6177yM5LiN6ZyA6KaB5bCx5aGr56m644CCXG5cdH07XG5cdHVybCA9IHVybC5yZXBsYWNlKCd7c2RrYXBwaWR9Jywgc2RrYXBwaWQpXG5cdFx0LnJlcGxhY2UoJ3tyYW5kb219JywgcmFuZCk7XG5cdHJlcXVlc3Rcblx0XHQucG9zdCh1cmwpXG5cdFx0LnNlbmQoY29udGVudClcblx0XHQuZW5kKGZ1bmN0aW9uKGVyciwgcmVzKSB7XG5cdFx0XHRpZiAoZXJyKSB7XG5cdFx0XHRcdHJldHVybiBjb25zb2xlLmVycm9yKGVycik7XG5cdFx0XHR9XG5cdFx0fSk7XG59O1xuXG4vKlxuXHRvcHRpb25zOiB7XG5cdFx0Ly8gQ29udHJvbHMgdGhlIHNlbmRpbmcgaW50ZXJ2YWxcblx0XHRzZW5kSW50ZXJ2YWw6IE1hdGNoLk9wdGlvbmFsKE51bWJlciksXG5cdFx0Ly8gQ29udHJvbHMgdGhlIHNlbmRpbmcgYmF0Y2ggc2l6ZSBwZXIgaW50ZXJ2YWxcblx0XHRzZW5kQmF0Y2hTaXplOiBNYXRjaC5PcHRpb25hbChOdW1iZXIpLFxuXHRcdC8vIEFsbG93IG9wdGlvbmFsIGtlZXBpbmcgbm90aWZpY2F0aW9ucyBpbiBjb2xsZWN0aW9uXG5cdFx0a2VlcFNNUzogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbilcblx0fVxuKi9cblFjbG91ZFNNU1F1ZXVlLkNvbmZpZ3VyZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXHRvcHRpb25zID0gXy5leHRlbmQoe1xuXHRcdHNlbmRUaW1lb3V0OiA2MDAwMCwgLy8gVGltZW91dCBwZXJpb2QgZm9yIHNtcyBzZW5kXG5cdH0sIG9wdGlvbnMpO1xuXG5cdC8vIEJsb2NrIG11bHRpcGxlIGNhbGxzXG5cdGlmIChpc0NvbmZpZ3VyZWQpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ1FjbG91ZFNNU1F1ZXVlLkNvbmZpZ3VyZSBzaG91bGQgbm90IGJlIGNhbGxlZCBtb3JlIHRoYW4gb25jZSEnKTtcblx0fVxuXG5cdGlzQ29uZmlndXJlZCA9IHRydWU7XG5cblx0Ly8gQWRkIGRlYnVnIGluZm9cblx0aWYgKFFjbG91ZFNNU1F1ZXVlLmRlYnVnKSB7XG5cdFx0Y29uc29sZS5sb2coJ1FjbG91ZFNNU1F1ZXVlLkNvbmZpZ3VyZScsIG9wdGlvbnMpO1xuXHR9XG5cblx0Ly8gc21zU2VuZGVyID0gbmV3IFNNUyh7XG5cdC8vIFx0QWNjZXNzS2V5SWQ6IG9wdGlvbnMuYWNjZXNzS2V5SWQsXG5cdC8vIFx0QWNjZXNzS2V5U2VjcmV0OiBvcHRpb25zLmFjY2Vzc0tleVNlY3JldFxuXHQvLyB9KTtcblxuXHRzZGthcHBpZCA9IG9wdGlvbnMuc2RrYXBwaWQ7XG5cdGFwcGtleSA9IG9wdGlvbnMuYXBwa2V5O1xuXHRzaWdubmFtZSA9IG9wdGlvbnMuc2lnbm5hbWUgfHwgXCJcIjtcblxuXHRzZWxmLnNlbmRTTVMgPSBmdW5jdGlvbihzbXMpIHtcblx0XHRpZiAoUWNsb3VkU01TUXVldWUuZGVidWcpIHtcblx0XHRcdGNvbnNvbGUubG9nKFwic2VuZFNNU1wiKTtcblx0XHRcdGNvbnNvbGUubG9nKHNtcyk7XG5cdFx0fVxuXG5cdFx0Ly8gc21zU2VuZGVyLnNlbmQoc21zLnNtcykuY2F0Y2goZXJyID0+IHtcblx0XHQvLyBcdGNvbnNvbGUuZXJyb3IoZXJyKVxuXHRcdC8vIH0pO1xuXG5cdFx0c2VuZFRleHRNc2coc2RrYXBwaWQsIGFwcGtleSwgc21zLnNtcy5SZWNOdW0sIChzbXMuc2lnbm5hbWUgfHwgc2lnbm5hbWUpICsgc21zLnNtcy5tc2cpO1xuXHR9XG5cblx0Ly8gVW5pdmVyc2FsIHNlbmQgZnVuY3Rpb25cblx0dmFyIF9xdWVyeVNlbmQgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cblx0XHRpZiAoc2VsZi5zZW5kU01TKSB7XG5cdFx0XHRzZWxmLnNlbmRTTVMob3B0aW9ucyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHNtczogW29wdGlvbnMuX2lkXVxuXHRcdH07XG5cdH07XG5cblx0c2VsZi5zZXJ2ZXJTZW5kID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXHRcdHJldHVybiBfcXVlcnlTZW5kKG9wdGlvbnMpO1xuXHR9O1xuXG5cblx0Ly8gVGhpcyBpbnRlcnZhbCB3aWxsIGFsbG93IG9ubHkgb25lIHNtcyB0byBiZSBzZW50IGF0IGEgdGltZSwgaXRcblx0Ly8gd2lsbCBjaGVjayBmb3IgbmV3IHNtcyBhdCBldmVyeSBgb3B0aW9ucy5zZW5kSW50ZXJ2YWxgXG5cdC8vIChkZWZhdWx0IGludGVydmFsIGlzIDE1MDAwIG1zKVxuXHQvL1xuXHQvLyBJdCBsb29rcyBpbiBzbXMgY29sbGVjdGlvbiB0byBzZWUgaWYgdGhlcmVzIGFueSBwZW5kaW5nXG5cdC8vIHNtcywgaWYgc28gaXQgd2lsbCB0cnkgdG8gcmVzZXJ2ZSB0aGUgcGVuZGluZyBzbXMuXG5cdC8vIElmIHN1Y2Nlc3NmdWxseSByZXNlcnZlZCB0aGUgc2VuZCBpcyBzdGFydGVkLlxuXHQvL1xuXHQvLyBJZiBzbXMucXVlcnkgaXMgdHlwZSBzdHJpbmcsIGl0J3MgYXNzdW1lZCB0byBiZSBhIGpzb24gc3RyaW5nXG5cdC8vIHZlcnNpb24gb2YgdGhlIHF1ZXJ5IHNlbGVjdG9yLiBNYWtpbmcgaXQgYWJsZSB0byBjYXJyeSBgJGAgcHJvcGVydGllcyBpblxuXHQvLyB0aGUgbW9uZ28gY29sbGVjdGlvbi5cblx0Ly9cblx0Ly8gUHIuIGRlZmF1bHQgc21zIGFyZSByZW1vdmVkIGZyb20gdGhlIGNvbGxlY3Rpb24gYWZ0ZXIgc2VuZCBoYXZlXG5cdC8vIGNvbXBsZXRlZC4gU2V0dGluZyBgb3B0aW9ucy5rZWVwU01TYCB3aWxsIHVwZGF0ZSBhbmQga2VlcCB0aGVcblx0Ly8gc21zIGVnLiBpZiBuZWVkZWQgZm9yIGhpc3RvcmljYWwgcmVhc29ucy5cblx0Ly9cblx0Ly8gQWZ0ZXIgdGhlIHNlbmQgaGF2ZSBjb21wbGV0ZWQgYSBcInNlbmRcIiBldmVudCB3aWxsIGJlIGVtaXR0ZWQgd2l0aCBhXG5cdC8vIHN0YXR1cyBvYmplY3QgY29udGFpbmluZyBzbXMgaWQgYW5kIHRoZSBzZW5kIHJlc3VsdCBvYmplY3QuXG5cdC8vXG5cdHZhciBpc1NlbmRpbmcgPSBmYWxzZTtcblxuXHRpZiAob3B0aW9ucy5zZW5kSW50ZXJ2YWwgIT09IG51bGwpIHtcblxuXHRcdC8vIFRoaXMgd2lsbCByZXF1aXJlIGluZGV4IHNpbmNlIHdlIHNvcnQgc21zIGJ5IGNyZWF0ZWRBdFxuXHRcdFFjbG91ZFNNU1F1ZXVlLmNvbGxlY3Rpb24uX2Vuc3VyZUluZGV4KHtcblx0XHRcdGNyZWF0ZWRBdDogMVxuXHRcdH0pO1xuXHRcdFFjbG91ZFNNU1F1ZXVlLmNvbGxlY3Rpb24uX2Vuc3VyZUluZGV4KHtcblx0XHRcdHNlbnQ6IDFcblx0XHR9KTtcblx0XHRRY2xvdWRTTVNRdWV1ZS5jb2xsZWN0aW9uLl9lbnN1cmVJbmRleCh7XG5cdFx0XHRzZW5kaW5nOiAxXG5cdFx0fSk7XG5cblxuXHRcdHZhciBzZW5kU01TID0gZnVuY3Rpb24oc21zKSB7XG5cdFx0XHQvLyBSZXNlcnZlIHNtc1xuXHRcdFx0dmFyIG5vdyA9ICtuZXcgRGF0ZSgpO1xuXHRcdFx0dmFyIHRpbWVvdXRBdCA9IG5vdyArIG9wdGlvbnMuc2VuZFRpbWVvdXQ7XG5cdFx0XHR2YXIgcmVzZXJ2ZWQgPSBRY2xvdWRTTVNRdWV1ZS5jb2xsZWN0aW9uLnVwZGF0ZSh7XG5cdFx0XHRcdF9pZDogc21zLl9pZCxcblx0XHRcdFx0c2VudDogZmFsc2UsIC8vIHh4eDogbmVlZCB0byBtYWtlIHN1cmUgdGhpcyBpcyBzZXQgb24gY3JlYXRlXG5cdFx0XHRcdHNlbmRpbmc6IHtcblx0XHRcdFx0XHQkbHQ6IG5vd1xuXHRcdFx0XHR9XG5cdFx0XHR9LCB7XG5cdFx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0XHRzZW5kaW5nOiB0aW1lb3V0QXQsXG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBNYWtlIHN1cmUgd2Ugb25seSBoYW5kbGUgc21zIHJlc2VydmVkIGJ5IHRoaXNcblx0XHRcdC8vIGluc3RhbmNlXG5cdFx0XHRpZiAocmVzZXJ2ZWQpIHtcblxuXHRcdFx0XHQvLyBTZW5kIHRoZSBzbXNcblx0XHRcdFx0dmFyIHJlc3VsdCA9IFFjbG91ZFNNU1F1ZXVlLnNlcnZlclNlbmQoc21zKTtcblxuXHRcdFx0XHRpZiAoIW9wdGlvbnMua2VlcFNNUykge1xuXHRcdFx0XHRcdC8vIFByLiBEZWZhdWx0IHdlIHdpbGwgcmVtb3ZlIHNtc1xuXHRcdFx0XHRcdFFjbG91ZFNNU1F1ZXVlLmNvbGxlY3Rpb24ucmVtb3ZlKHtcblx0XHRcdFx0XHRcdF9pZDogc21zLl9pZFxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdFx0Ly8gVXBkYXRlIHRoZSBzbXNcblx0XHRcdFx0XHRRY2xvdWRTTVNRdWV1ZS5jb2xsZWN0aW9uLnVwZGF0ZSh7XG5cdFx0XHRcdFx0XHRfaWQ6IHNtcy5faWRcblx0XHRcdFx0XHR9LCB7XG5cdFx0XHRcdFx0XHQkc2V0OiB7XG5cdFx0XHRcdFx0XHRcdC8vIE1hcmsgYXMgc2VudFxuXHRcdFx0XHRcdFx0XHRzZW50OiB0cnVlLFxuXHRcdFx0XHRcdFx0XHQvLyBTZXQgdGhlIHNlbnQgZGF0ZVxuXHRcdFx0XHRcdFx0XHRzZW50QXQ6IG5ldyBEYXRlKCksXG5cdFx0XHRcdFx0XHRcdC8vIE5vdCBiZWluZyBzZW50IGFueW1vcmVcblx0XHRcdFx0XHRcdFx0c2VuZGluZzogMFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBFbWl0IHRoZSBzZW5kXG5cdFx0XHRcdHNlbGYuZW1pdCgnc2VuZCcsIHtcblx0XHRcdFx0XHRzbXM6IHNtcy5faWQsXG5cdFx0XHRcdFx0cmVzdWx0OiByZXN1bHRcblx0XHRcdFx0fSk7XG5cblx0XHRcdH0gLy8gRWxzZSBjb3VsZCBub3QgcmVzZXJ2ZVxuXHRcdH07IC8vIEVPIHNlbmRTTVNcblxuXHRcdHNlbmRXb3JrZXIoZnVuY3Rpb24oKSB7XG5cblx0XHRcdGlmIChpc1NlbmRpbmcpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0Ly8gU2V0IHNlbmQgZmVuY2Vcblx0XHRcdGlzU2VuZGluZyA9IHRydWU7XG5cblx0XHRcdHZhciBiYXRjaFNpemUgPSBvcHRpb25zLnNlbmRCYXRjaFNpemUgfHwgMTtcblxuXHRcdFx0dmFyIG5vdyA9ICtuZXcgRGF0ZSgpO1xuXG5cdFx0XHQvLyBGaW5kIHNtcyB0aGF0IGFyZSBub3QgYmVpbmcgb3IgYWxyZWFkeSBzZW50XG5cdFx0XHR2YXIgcGVuZGluZ1NNUyA9IFFjbG91ZFNNU1F1ZXVlLmNvbGxlY3Rpb24uZmluZCh7XG5cdFx0XHRcdCRhbmQ6IFtcblx0XHRcdFx0XHQvLyBNZXNzYWdlIGlzIG5vdCBzZW50XG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0c2VudDogZmFsc2Vcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdC8vIEFuZCBub3QgYmVpbmcgc2VudCBieSBvdGhlciBpbnN0YW5jZXNcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRzZW5kaW5nOiB7XG5cdFx0XHRcdFx0XHRcdCRsdDogbm93XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRdXG5cdFx0XHR9LCB7XG5cdFx0XHRcdC8vIFNvcnQgYnkgY3JlYXRlZCBkYXRlXG5cdFx0XHRcdHNvcnQ6IHtcblx0XHRcdFx0XHRjcmVhdGVkQXQ6IDFcblx0XHRcdFx0fSxcblx0XHRcdFx0bGltaXQ6IGJhdGNoU2l6ZVxuXHRcdFx0fSk7XG5cblx0XHRcdHBlbmRpbmdTTVMuZm9yRWFjaChmdW5jdGlvbihzbXMpIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRzZW5kU01TKHNtcyk7XG5cdFx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cblx0XHRcdFx0XHRpZiAoUWNsb3VkU01TUXVldWUuZGVidWcpIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdRY2xvdWRTTVNRdWV1ZTogQ291bGQgbm90IHNlbmQgc21zIGlkOiBcIicgKyBzbXMuX2lkICsgJ1wiLCBFcnJvcjogJyArIGVycm9yLm1lc3NhZ2UpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSk7IC8vIEVPIGZvckVhY2hcblxuXHRcdFx0Ly8gUmVtb3ZlIHRoZSBzZW5kIGZlbmNlXG5cdFx0XHRpc1NlbmRpbmcgPSBmYWxzZTtcblx0XHR9LCBvcHRpb25zLnNlbmRJbnRlcnZhbCB8fCAxNTAwMCk7IC8vIERlZmF1bHQgZXZlcnkgMTV0aCBzZWNcblxuXHR9IGVsc2Uge1xuXHRcdGlmIChRY2xvdWRTTVNRdWV1ZS5kZWJ1Zykge1xuXHRcdFx0Y29uc29sZS5sb2coJ1FjbG91ZFNNU1F1ZXVlOiBTZW5kIHNlcnZlciBpcyBkaXNhYmxlZCcpO1xuXHRcdH1cblx0fVxuXG59OyIsIk1ldGVvci5zdGFydHVwIC0+XG5cdGlmIE1ldGVvci5zZXR0aW5ncy5zbXM/LnFjbG91ZD8uc21zcXVldWVfaW50ZXJ2YWxcblx0XHRRY2xvdWRTTVNRdWV1ZS5Db25maWd1cmVcblx0XHRcdHNlbmRJbnRlcnZhbDogTWV0ZW9yLnNldHRpbmdzLnNtcy5xY2xvdWQuc21zcXVldWVfaW50ZXJ2YWxcblx0XHRcdHNlbmRCYXRjaFNpemU6IDEwXG5cdFx0XHRrZWVwU01TOiB0cnVlXG5cdFx0XHRzZGthcHBpZDogTWV0ZW9yLnNldHRpbmdzLnNtcy5xY2xvdWQuc2RrYXBwaWRcblx0XHRcdGFwcGtleTogTWV0ZW9yLnNldHRpbmdzLnNtcy5xY2xvdWQuYXBwa2V5XG5cdFx0XHRzaWdubmFtZTogTWV0ZW9yLnNldHRpbmdzLnNtcy5xY2xvdWQuc2lnbm5hbWVcbiIsIk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuICB2YXIgcmVmLCByZWYxO1xuICBpZiAoKHJlZiA9IE1ldGVvci5zZXR0aW5ncy5zbXMpICE9IG51bGwgPyAocmVmMSA9IHJlZi5xY2xvdWQpICE9IG51bGwgPyByZWYxLnNtc3F1ZXVlX2ludGVydmFsIDogdm9pZCAwIDogdm9pZCAwKSB7XG4gICAgcmV0dXJuIFFjbG91ZFNNU1F1ZXVlLkNvbmZpZ3VyZSh7XG4gICAgICBzZW5kSW50ZXJ2YWw6IE1ldGVvci5zZXR0aW5ncy5zbXMucWNsb3VkLnNtc3F1ZXVlX2ludGVydmFsLFxuICAgICAgc2VuZEJhdGNoU2l6ZTogMTAsXG4gICAgICBrZWVwU01TOiB0cnVlLFxuICAgICAgc2RrYXBwaWQ6IE1ldGVvci5zZXR0aW5ncy5zbXMucWNsb3VkLnNka2FwcGlkLFxuICAgICAgYXBwa2V5OiBNZXRlb3Iuc2V0dGluZ3Muc21zLnFjbG91ZC5hcHBrZXksXG4gICAgICBzaWdubmFtZTogTWV0ZW9yLnNldHRpbmdzLnNtcy5xY2xvdWQuc2lnbm5hbWVcbiAgICB9KTtcbiAgfVxufSk7XG4iXX0=
