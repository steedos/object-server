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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpxY2xvdWQtc21zcXVldWUvY2hlY2tOcG0uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3M6cWNsb3VkLXNtc3F1ZXVlL2xpYi9jb21tb24vbWFpbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpxY2xvdWQtc21zcXVldWUvbGliL2NvbW1vbi9zbXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3M6cWNsb3VkLXNtc3F1ZXVlL2xpYi9zZXJ2ZXIvYXBpLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX3FjbG91ZC1zbXNxdWV1ZS9zZXJ2ZXIvc3RhcnR1cC5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9zdGFydHVwLmNvZmZlZSJdLCJuYW1lcyI6WyJjaGVja05wbVZlcnNpb25zIiwibW9kdWxlIiwibGluayIsInYiLCJRY2xvdWRTTVNRdWV1ZSIsIkV2ZW50U3RhdGUiLCJjb2xsZWN0aW9uIiwiU01TUXVldWUiLCJfdmFsaWRhdGVEb2N1bWVudCIsInNtcyIsImNoZWNrIiwiT2JqZWN0Iiwic2VudCIsIk1hdGNoIiwiT3B0aW9uYWwiLCJCb29sZWFuIiwic2VuZGluZyIsIkludGVnZXIiLCJjcmVhdGVkQXQiLCJEYXRlIiwiY3JlYXRlZEJ5IiwiT25lT2YiLCJTdHJpbmciLCJzZW5kIiwib3B0aW9ucyIsImN1cnJlbnRVc2VyIiwiTWV0ZW9yIiwiaXNDbGllbnQiLCJ1c2VySWQiLCJpc1NlcnZlciIsIl8iLCJleHRlbmQiLCJ0ZXN0IiwicGljayIsImluc2VydCIsImlzQ29uZmlndXJlZCIsInNlbmRXb3JrZXIiLCJ0YXNrIiwiaW50ZXJ2YWwiLCJkZWJ1ZyIsImNvbnNvbGUiLCJsb2ciLCJzZXRJbnRlcnZhbCIsImVycm9yIiwibWVzc2FnZSIsInNka2FwcGlkIiwiYXBwa2V5IiwicmVxdWVzdCIsInJlcXVpcmUiLCJzaGEyNTYiLCJnZXRSYW5kIiwiYml0IiwiTWF0aCIsInJvdW5kIiwicmFuZG9tIiwic2VuZFRleHRNc2ciLCJwaG9uZSIsIm1zZyIsInVybCIsInJhbmQiLCJ0aW1lIiwic2lnIiwiY29udGVudCIsInJlcGxhY2UiLCJwb3N0IiwiZW5kIiwiZXJyIiwicmVzIiwiQ29uZmlndXJlIiwic2VsZiIsInNlbmRUaW1lb3V0IiwiRXJyb3IiLCJzaWdubmFtZSIsInNlbmRTTVMiLCJSZWNOdW0iLCJfcXVlcnlTZW5kIiwiX2lkIiwic2VydmVyU2VuZCIsImlzU2VuZGluZyIsInNlbmRJbnRlcnZhbCIsIl9lbnN1cmVJbmRleCIsIm5vdyIsInRpbWVvdXRBdCIsInJlc2VydmVkIiwidXBkYXRlIiwiJGx0IiwiJHNldCIsInJlc3VsdCIsImtlZXBTTVMiLCJyZW1vdmUiLCJzZW50QXQiLCJlbWl0IiwiYmF0Y2hTaXplIiwic2VuZEJhdGNoU2l6ZSIsInBlbmRpbmdTTVMiLCJmaW5kIiwiJGFuZCIsInNvcnQiLCJsaW1pdCIsImZvckVhY2giLCJzdGFydHVwIiwicmVmIiwicmVmMSIsInNldHRpbmdzIiwicWNsb3VkIiwic21zcXVldWVfaW50ZXJ2YWwiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxnQkFBSjtBQUFxQkMsTUFBTSxDQUFDQyxJQUFQLENBQVksb0NBQVosRUFBaUQ7QUFBQ0Ysa0JBQWdCLENBQUNHLENBQUQsRUFBRztBQUFDSCxvQkFBZ0IsR0FBQ0csQ0FBakI7QUFBbUI7O0FBQXhDLENBQWpELEVBQTJGLENBQTNGO0FBQ3JCSCxnQkFBZ0IsQ0FBQztBQUNoQixnQkFBYyxRQURFO0FBRWhCLFlBQVU7QUFGTSxDQUFELEVBR2IseUJBSGEsQ0FBaEIsQzs7Ozs7Ozs7Ozs7QUNEQUksY0FBYyxHQUFHLElBQUlDLFVBQUosRUFBakIsQzs7Ozs7Ozs7Ozs7QUNBQUQsY0FBYyxDQUFDRSxVQUFmLEdBQTRCQyxRQUFRLENBQUNE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Q2pGQWYsT0FBTzBFLE9BQVAsQ0FBZTtBQUNkLE1BQUFDLEdBQUEsRUFBQUMsSUFBQTs7QUFBQSxPQUFBRCxNQUFBM0UsT0FBQTZFLFFBQUEsQ0FBQTlGLEdBQUEsYUFBQTZGLE9BQUFELElBQUFHLE1BQUEsWUFBQUYsS0FBZ0NHLGlCQUFoQyxHQUFnQyxNQUFoQyxHQUFnQyxNQUFoQztBQ0VHLFdEREZyRyxlQUFlZ0UsU0FBZixDQUNDO0FBQUFXLG9CQUFjckQsT0FBTzZFLFFBQVAsQ0FBZ0I5RixHQUFoQixDQUFvQitGLE1BQXBCLENBQTJCQyxpQkFBekM7QUFDQVoscUJBQWUsRUFEZjtBQUVBTCxlQUFTLElBRlQ7QUFHQTNDLGdCQUFVbkIsT0FBTzZFLFFBQVAsQ0FBZ0I5RixHQUFoQixDQUFvQitGLE1BQXBCLENBQTJCM0QsUUFIckM7QUFJQUMsY0FBUXBCLE9BQU82RSxRQUFQLENBQWdCOUYsR0FBaEIsQ0FBb0IrRixNQUFwQixDQUEyQjFELE1BSm5DO0FBS0EwQixnQkFBVTlDLE9BQU82RSxRQUFQLENBQWdCOUYsR0FBaEIsQ0FBb0IrRixNQUFwQixDQUEyQmhDO0FBTHJDLEtBREQsQ0NDRTtBQVFEO0FEWEgsRyIsImZpbGUiOiIvcGFja2FnZXMvc3RlZWRvc19xY2xvdWQtc21zcXVldWUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjaGVja05wbVZlcnNpb25zIH0gZnJvbSAnbWV0ZW9yL3RtZWFzZGF5OmNoZWNrLW5wbS12ZXJzaW9ucyc7XHJcbmNoZWNrTnBtVmVyc2lvbnMoe1xyXG5cdFwic3VwZXJhZ2VudFwiOiBcIl4zLjUuMlwiLFxyXG5cdFwic2hhMjU2XCI6IFwiXjAuMi4wXCJcclxufSwgJ3N0ZWVkb3M6cWNsb3VkLXNtc3F1ZXVlJyk7IiwiUWNsb3VkU01TUXVldWUgPSBuZXcgRXZlbnRTdGF0ZSgpOyIsIlFjbG91ZFNNU1F1ZXVlLmNvbGxlY3Rpb24gPSBTTVNRdWV1ZS5jb2xsZWN0aW9uO1xyXG5cclxudmFyIF92YWxpZGF0ZURvY3VtZW50ID0gZnVuY3Rpb24oc21zKSB7XHJcblxyXG5cdGNoZWNrKHNtcywge1xyXG5cdFx0c21zOiBPYmplY3QsXHJcblx0XHRzZW50OiBNYXRjaC5PcHRpb25hbChCb29sZWFuKSxcclxuXHRcdHNlbmRpbmc6IE1hdGNoLk9wdGlvbmFsKE1hdGNoLkludGVnZXIpLFxyXG5cdFx0Y3JlYXRlZEF0OiBEYXRlLFxyXG5cdFx0Y3JlYXRlZEJ5OiBNYXRjaC5PbmVPZihTdHJpbmcsIG51bGwpXHJcblx0fSk7XHJcblxyXG59O1xyXG5cclxuUWNsb3VkU01TUXVldWUuc2VuZCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuXHR2YXIgY3VycmVudFVzZXIgPSBNZXRlb3IuaXNDbGllbnQgJiYgTWV0ZW9yLnVzZXJJZCAmJiBNZXRlb3IudXNlcklkKCkgfHwgTWV0ZW9yLmlzU2VydmVyICYmIChvcHRpb25zLmNyZWF0ZWRCeSB8fCAnPFNFUlZFUj4nKSB8fCBudWxsXHJcblx0dmFyIHNtcyA9IF8uZXh0ZW5kKHtcclxuXHRcdGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcclxuXHRcdGNyZWF0ZWRCeTogY3VycmVudFVzZXJcclxuXHR9KTtcclxuXHJcblx0aWYgKE1hdGNoLnRlc3Qob3B0aW9ucywgT2JqZWN0KSkge1xyXG5cdFx0c21zLnNtcyA9IF8ucGljayhvcHRpb25zLCAnRm9ybWF0JywgJ0FjdGlvbicsICdQYXJhbVN0cmluZycsICdSZWNOdW0nLCAnU2lnbk5hbWUnLCAnVGVtcGxhdGVDb2RlJywgJ21zZycpO1xyXG5cdH1cclxuXHJcblx0c21zLnNlbnQgPSBmYWxzZTtcclxuXHRzbXMuc2VuZGluZyA9IDA7XHJcblxyXG5cdF92YWxpZGF0ZURvY3VtZW50KHNtcyk7XHJcblxyXG5cdHJldHVybiBRY2xvdWRTTVNRdWV1ZS5jb2xsZWN0aW9uLmluc2VydChzbXMpO1xyXG59OyIsInZhciBpc0NvbmZpZ3VyZWQgPSBmYWxzZTtcclxudmFyIHNlbmRXb3JrZXIgPSBmdW5jdGlvbih0YXNrLCBpbnRlcnZhbCkge1xyXG5cclxuXHRpZiAoUWNsb3VkU01TUXVldWUuZGVidWcpIHtcclxuXHRcdGNvbnNvbGUubG9nKCdRY2xvdWRTTVNRdWV1ZTogU2VuZCB3b3JrZXIgc3RhcnRlZCwgdXNpbmcgaW50ZXJ2YWw6ICcgKyBpbnRlcnZhbCk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gTWV0ZW9yLnNldEludGVydmFsKGZ1bmN0aW9uKCkge1xyXG5cdFx0dHJ5IHtcclxuXHRcdFx0dGFzaygpO1xyXG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcclxuXHRcdFx0aWYgKFFjbG91ZFNNU1F1ZXVlLmRlYnVnKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ1FjbG91ZFNNU1F1ZXVlOiBFcnJvciB3aGlsZSBzZW5kaW5nOiAnICsgZXJyb3IubWVzc2FnZSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9LCBpbnRlcnZhbCk7XHJcbn07XHJcblxyXG4vLyB2YXIgU01TID0gcmVxdWlyZSgnYWxpeXVuLXNtcy1ub2RlJyksXHJcbi8vIFx0c21zU2VuZGVyO1xyXG5cclxudmFyIHNka2FwcGlkLCBhcHBrZXk7XHJcblxyXG52YXIgcmVxdWVzdCA9IHJlcXVpcmUoJ3N1cGVyYWdlbnQnKSxcclxuXHRzaGEyNTYgPSByZXF1aXJlKCdzaGEyNTYnKTtcclxuXHJcbmZ1bmN0aW9uIGdldFJhbmQoYml0KSB7XHJcblxyXG5cdGJpdCA9IGJpdCB8fCAxMDAwMDAwMDtcclxuXHJcblx0cmV0dXJuIE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIGJpdCk7XHJcbn07XHJcblxyXG4vL3NlbmQgdGV4dCBtZXNzYWdlXHJcbmZ1bmN0aW9uIHNlbmRUZXh0TXNnKHNka2FwcGlkLCBhcHBrZXksIHBob25lLCBtc2cpIHtcclxuXHJcblx0aWYgKCFwaG9uZSB8fCAvMVxcZHsxMn0vLnRlc3QocGhvbmUpKSB7XHJcblx0XHRyZXR1cm4gY29uc29sZS5sb2coJ2ludmFsaWQgcGhvbmUgbnVtYmVyJyk7XHJcblx0fVxyXG5cclxuXHR2YXIgdXJsID0gJ2h0dHBzOi8veXVuLnRpbS5xcS5jb20vdjUvdGxzc21zc3ZyL3NlbmRzbXM/c2RrYXBwaWQ9e3Nka2FwcGlkfSZyYW5kb209e3JhbmRvbX0nO1xyXG5cclxuXHR2YXIgcmFuZCA9IGdldFJhbmQoKSxcclxuXHRcdHRpbWUgPSBNYXRoLnJvdW5kKCtuZXcgRGF0ZSgpIC8gMTAwMCksXHJcblx0XHRzaWcgPSBzaGEyNTYoJ2FwcGtleT0nICsgYXBwa2V5ICsgJyZyYW5kb209JyArIHJhbmQgKyAnJnRpbWU9JyArIHRpbWUgKyAnJm1vYmlsZT0nICsgcGhvbmUpO1xyXG5cclxuXHR2YXIgY29udGVudCA9IHtcclxuXHRcdFwidGVsXCI6IHsgLy/lpoLpnIDkvb/nlKjlm73pmYXnlLXor53lj7fnoIHpgJrnlKjmoLzlvI/vvIzlpoLvvJpcIis4NjEzNzg4ODg4ODg4XCIg77yM6K+35L2/55Soc2VuZGlzbXPmjqXlj6Pop4HkuIvms6hcclxuXHRcdFx0XCJuYXRpb25jb2RlXCI6IFwiODZcIiwgLy/lm73lrrbnoIFcclxuXHRcdFx0XCJtb2JpbGVcIjogcGhvbmUgLy/miYvmnLrlj7fnoIFcclxuXHRcdH0sXHJcblx0XHRcInR5cGVcIjogMCwgLy8wOuaZrumAmuefreS/oTsxOuiQpemUgOefreS/oe+8iOW8uuiwg++8muimgeaMiemcgOWhq+WAvO+8jOS4jeeEtuS8muW9seWTjeWIsOS4muWKoeeahOato+W4uOS9v+eUqO+8iVxyXG5cdFx0XCJtc2dcIjogbXNnLCAvL3V0ZjjnvJbnoIEgXHJcblx0XHRcInNpZ1wiOiBzaWcsIC8vYXBw5Yet6K+B77yM5YW35L2T6K6h566X5pa55byP6KeB5LiL5rOoXHJcblx0XHRcInRpbWVcIjogdGltZSwgLy91bml45pe26Ze05oiz77yM6K+35rGC5Y+R6LW35pe26Ze077yM5aaC5p6c5ZKM57O757uf5pe26Ze055u45beu6LaF6L+HMTDliIbpkp/liJnkvJrov5Tlm57lpLHotKVcclxuXHRcdFwiZXh0ZW5kXCI6IFwiXCIsIC8v6YCa6YGT5omp5bGV56CB77yM5Y+v6YCJ5a2X5q6177yM6buY6K6k5rKh5pyJ5byA6YCaKOmcgOimgeWhq+epuinjgIJcclxuXHRcdC8v5Zyo55+t5L+h5Zue5aSN5Zy65pmv5Lit77yM6IW+6K6vc2VydmVy5Lya5Y6f5qC36L+U5Zue77yM5byA5Y+R6ICF5Y+v5L6d5q2k5Yy65YiG5piv5ZOq56eN57G75Z6L55qE5Zue5aSNXHJcblx0XHRcImV4dFwiOiBcIlwiIC8v55So5oi355qEc2Vzc2lvbuWGheWuue+8jOiFvuiur3NlcnZlcuWbnuWMheS4reS8muWOn+agt+i/lOWbnu+8jOWPr+mAieWtl+aute+8jOS4jemcgOimgeWwseWhq+epuuOAglxyXG5cdH07XHJcblx0dXJsID0gdXJsLnJlcGxhY2UoJ3tzZGthcHBpZH0nLCBzZGthcHBpZClcclxuXHRcdC5yZXBsYWNlKCd7cmFuZG9tfScsIHJhbmQpO1xyXG5cdHJlcXVlc3RcclxuXHRcdC5wb3N0KHVybClcclxuXHRcdC5zZW5kKGNvbnRlbnQpXHJcblx0XHQuZW5kKGZ1bmN0aW9uKGVyciwgcmVzKSB7XHJcblx0XHRcdGlmIChlcnIpIHtcclxuXHRcdFx0XHRyZXR1cm4gY29uc29sZS5lcnJvcihlcnIpO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxufTtcclxuXHJcbi8qXHJcblx0b3B0aW9uczoge1xyXG5cdFx0Ly8gQ29udHJvbHMgdGhlIHNlbmRpbmcgaW50ZXJ2YWxcclxuXHRcdHNlbmRJbnRlcnZhbDogTWF0Y2guT3B0aW9uYWwoTnVtYmVyKSxcclxuXHRcdC8vIENvbnRyb2xzIHRoZSBzZW5kaW5nIGJhdGNoIHNpemUgcGVyIGludGVydmFsXHJcblx0XHRzZW5kQmF0Y2hTaXplOiBNYXRjaC5PcHRpb25hbChOdW1iZXIpLFxyXG5cdFx0Ly8gQWxsb3cgb3B0aW9uYWwga2VlcGluZyBub3RpZmljYXRpb25zIGluIGNvbGxlY3Rpb25cclxuXHRcdGtlZXBTTVM6IE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pXHJcblx0fVxyXG4qL1xyXG5RY2xvdWRTTVNRdWV1ZS5Db25maWd1cmUgPSBmdW5jdGlvbihvcHRpb25zKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cdG9wdGlvbnMgPSBfLmV4dGVuZCh7XHJcblx0XHRzZW5kVGltZW91dDogNjAwMDAsIC8vIFRpbWVvdXQgcGVyaW9kIGZvciBzbXMgc2VuZFxyXG5cdH0sIG9wdGlvbnMpO1xyXG5cclxuXHQvLyBCbG9jayBtdWx0aXBsZSBjYWxsc1xyXG5cdGlmIChpc0NvbmZpZ3VyZWQpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignUWNsb3VkU01TUXVldWUuQ29uZmlndXJlIHNob3VsZCBub3QgYmUgY2FsbGVkIG1vcmUgdGhhbiBvbmNlIScpO1xyXG5cdH1cclxuXHJcblx0aXNDb25maWd1cmVkID0gdHJ1ZTtcclxuXHJcblx0Ly8gQWRkIGRlYnVnIGluZm9cclxuXHRpZiAoUWNsb3VkU01TUXVldWUuZGVidWcpIHtcclxuXHRcdGNvbnNvbGUubG9nKCdRY2xvdWRTTVNRdWV1ZS5Db25maWd1cmUnLCBvcHRpb25zKTtcclxuXHR9XHJcblxyXG5cdC8vIHNtc1NlbmRlciA9IG5ldyBTTVMoe1xyXG5cdC8vIFx0QWNjZXNzS2V5SWQ6IG9wdGlvbnMuYWNjZXNzS2V5SWQsXHJcblx0Ly8gXHRBY2Nlc3NLZXlTZWNyZXQ6IG9wdGlvbnMuYWNjZXNzS2V5U2VjcmV0XHJcblx0Ly8gfSk7XHJcblxyXG5cdHNka2FwcGlkID0gb3B0aW9ucy5zZGthcHBpZDtcclxuXHRhcHBrZXkgPSBvcHRpb25zLmFwcGtleTtcclxuXHRzaWdubmFtZSA9IG9wdGlvbnMuc2lnbm5hbWUgfHwgXCJcIjtcclxuXHJcblx0c2VsZi5zZW5kU01TID0gZnVuY3Rpb24oc21zKSB7XHJcblx0XHRpZiAoUWNsb3VkU01TUXVldWUuZGVidWcpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coXCJzZW5kU01TXCIpO1xyXG5cdFx0XHRjb25zb2xlLmxvZyhzbXMpO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIHNtc1NlbmRlci5zZW5kKHNtcy5zbXMpLmNhdGNoKGVyciA9PiB7XHJcblx0XHQvLyBcdGNvbnNvbGUuZXJyb3IoZXJyKVxyXG5cdFx0Ly8gfSk7XHJcblxyXG5cdFx0c2VuZFRleHRNc2coc2RrYXBwaWQsIGFwcGtleSwgc21zLnNtcy5SZWNOdW0sIChzbXMuc2lnbm5hbWUgfHwgc2lnbm5hbWUpICsgc21zLnNtcy5tc2cpO1xyXG5cdH1cclxuXHJcblx0Ly8gVW5pdmVyc2FsIHNlbmQgZnVuY3Rpb25cclxuXHR2YXIgX3F1ZXJ5U2VuZCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuXHJcblx0XHRpZiAoc2VsZi5zZW5kU01TKSB7XHJcblx0XHRcdHNlbGYuc2VuZFNNUyhvcHRpb25zKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4ge1xyXG5cdFx0XHRzbXM6IFtvcHRpb25zLl9pZF1cclxuXHRcdH07XHJcblx0fTtcclxuXHJcblx0c2VsZi5zZXJ2ZXJTZW5kID0gZnVuY3Rpb24ob3B0aW9ucykge1xyXG5cdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblx0XHRyZXR1cm4gX3F1ZXJ5U2VuZChvcHRpb25zKTtcclxuXHR9O1xyXG5cclxuXHJcblx0Ly8gVGhpcyBpbnRlcnZhbCB3aWxsIGFsbG93IG9ubHkgb25lIHNtcyB0byBiZSBzZW50IGF0IGEgdGltZSwgaXRcclxuXHQvLyB3aWxsIGNoZWNrIGZvciBuZXcgc21zIGF0IGV2ZXJ5IGBvcHRpb25zLnNlbmRJbnRlcnZhbGBcclxuXHQvLyAoZGVmYXVsdCBpbnRlcnZhbCBpcyAxNTAwMCBtcylcclxuXHQvL1xyXG5cdC8vIEl0IGxvb2tzIGluIHNtcyBjb2xsZWN0aW9uIHRvIHNlZSBpZiB0aGVyZXMgYW55IHBlbmRpbmdcclxuXHQvLyBzbXMsIGlmIHNvIGl0IHdpbGwgdHJ5IHRvIHJlc2VydmUgdGhlIHBlbmRpbmcgc21zLlxyXG5cdC8vIElmIHN1Y2Nlc3NmdWxseSByZXNlcnZlZCB0aGUgc2VuZCBpcyBzdGFydGVkLlxyXG5cdC8vXHJcblx0Ly8gSWYgc21zLnF1ZXJ5IGlzIHR5cGUgc3RyaW5nLCBpdCdzIGFzc3VtZWQgdG8gYmUgYSBqc29uIHN0cmluZ1xyXG5cdC8vIHZlcnNpb24gb2YgdGhlIHF1ZXJ5IHNlbGVjdG9yLiBNYWtpbmcgaXQgYWJsZSB0byBjYXJyeSBgJGAgcHJvcGVydGllcyBpblxyXG5cdC8vIHRoZSBtb25nbyBjb2xsZWN0aW9uLlxyXG5cdC8vXHJcblx0Ly8gUHIuIGRlZmF1bHQgc21zIGFyZSByZW1vdmVkIGZyb20gdGhlIGNvbGxlY3Rpb24gYWZ0ZXIgc2VuZCBoYXZlXHJcblx0Ly8gY29tcGxldGVkLiBTZXR0aW5nIGBvcHRpb25zLmtlZXBTTVNgIHdpbGwgdXBkYXRlIGFuZCBrZWVwIHRoZVxyXG5cdC8vIHNtcyBlZy4gaWYgbmVlZGVkIGZvciBoaXN0b3JpY2FsIHJlYXNvbnMuXHJcblx0Ly9cclxuXHQvLyBBZnRlciB0aGUgc2VuZCBoYXZlIGNvbXBsZXRlZCBhIFwic2VuZFwiIGV2ZW50IHdpbGwgYmUgZW1pdHRlZCB3aXRoIGFcclxuXHQvLyBzdGF0dXMgb2JqZWN0IGNvbnRhaW5pbmcgc21zIGlkIGFuZCB0aGUgc2VuZCByZXN1bHQgb2JqZWN0LlxyXG5cdC8vXHJcblx0dmFyIGlzU2VuZGluZyA9IGZhbHNlO1xyXG5cclxuXHRpZiAob3B0aW9ucy5zZW5kSW50ZXJ2YWwgIT09IG51bGwpIHtcclxuXHJcblx0XHQvLyBUaGlzIHdpbGwgcmVxdWlyZSBpbmRleCBzaW5jZSB3ZSBzb3J0IHNtcyBieSBjcmVhdGVkQXRcclxuXHRcdFFjbG91ZFNNU1F1ZXVlLmNvbGxlY3Rpb24uX2Vuc3VyZUluZGV4KHtcclxuXHRcdFx0Y3JlYXRlZEF0OiAxXHJcblx0XHR9KTtcclxuXHRcdFFjbG91ZFNNU1F1ZXVlLmNvbGxlY3Rpb24uX2Vuc3VyZUluZGV4KHtcclxuXHRcdFx0c2VudDogMVxyXG5cdFx0fSk7XHJcblx0XHRRY2xvdWRTTVNRdWV1ZS5jb2xsZWN0aW9uLl9lbnN1cmVJbmRleCh7XHJcblx0XHRcdHNlbmRpbmc6IDFcclxuXHRcdH0pO1xyXG5cclxuXHJcblx0XHR2YXIgc2VuZFNNUyA9IGZ1bmN0aW9uKHNtcykge1xyXG5cdFx0XHQvLyBSZXNlcnZlIHNtc1xyXG5cdFx0XHR2YXIgbm93ID0gK25ldyBEYXRlKCk7XHJcblx0XHRcdHZhciB0aW1lb3V0QXQgPSBub3cgKyBvcHRpb25zLnNlbmRUaW1lb3V0O1xyXG5cdFx0XHR2YXIgcmVzZXJ2ZWQgPSBRY2xvdWRTTVNRdWV1ZS5jb2xsZWN0aW9uLnVwZGF0ZSh7XHJcblx0XHRcdFx0X2lkOiBzbXMuX2lkLFxyXG5cdFx0XHRcdHNlbnQ6IGZhbHNlLCAvLyB4eHg6IG5lZWQgdG8gbWFrZSBzdXJlIHRoaXMgaXMgc2V0IG9uIGNyZWF0ZVxyXG5cdFx0XHRcdHNlbmRpbmc6IHtcclxuXHRcdFx0XHRcdCRsdDogbm93XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9LCB7XHJcblx0XHRcdFx0JHNldDoge1xyXG5cdFx0XHRcdFx0c2VuZGluZzogdGltZW91dEF0LFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHQvLyBNYWtlIHN1cmUgd2Ugb25seSBoYW5kbGUgc21zIHJlc2VydmVkIGJ5IHRoaXNcclxuXHRcdFx0Ly8gaW5zdGFuY2VcclxuXHRcdFx0aWYgKHJlc2VydmVkKSB7XHJcblxyXG5cdFx0XHRcdC8vIFNlbmQgdGhlIHNtc1xyXG5cdFx0XHRcdHZhciByZXN1bHQgPSBRY2xvdWRTTVNRdWV1ZS5zZXJ2ZXJTZW5kKHNtcyk7XHJcblxyXG5cdFx0XHRcdGlmICghb3B0aW9ucy5rZWVwU01TKSB7XHJcblx0XHRcdFx0XHQvLyBQci4gRGVmYXVsdCB3ZSB3aWxsIHJlbW92ZSBzbXNcclxuXHRcdFx0XHRcdFFjbG91ZFNNU1F1ZXVlLmNvbGxlY3Rpb24ucmVtb3ZlKHtcclxuXHRcdFx0XHRcdFx0X2lkOiBzbXMuX2lkXHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cclxuXHRcdFx0XHRcdC8vIFVwZGF0ZSB0aGUgc21zXHJcblx0XHRcdFx0XHRRY2xvdWRTTVNRdWV1ZS5jb2xsZWN0aW9uLnVwZGF0ZSh7XHJcblx0XHRcdFx0XHRcdF9pZDogc21zLl9pZFxyXG5cdFx0XHRcdFx0fSwge1xyXG5cdFx0XHRcdFx0XHQkc2V0OiB7XHJcblx0XHRcdFx0XHRcdFx0Ly8gTWFyayBhcyBzZW50XHJcblx0XHRcdFx0XHRcdFx0c2VudDogdHJ1ZSxcclxuXHRcdFx0XHRcdFx0XHQvLyBTZXQgdGhlIHNlbnQgZGF0ZVxyXG5cdFx0XHRcdFx0XHRcdHNlbnRBdDogbmV3IERhdGUoKSxcclxuXHRcdFx0XHRcdFx0XHQvLyBOb3QgYmVpbmcgc2VudCBhbnltb3JlXHJcblx0XHRcdFx0XHRcdFx0c2VuZGluZzogMFxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHQvLyBFbWl0IHRoZSBzZW5kXHJcblx0XHRcdFx0c2VsZi5lbWl0KCdzZW5kJywge1xyXG5cdFx0XHRcdFx0c21zOiBzbXMuX2lkLFxyXG5cdFx0XHRcdFx0cmVzdWx0OiByZXN1bHRcclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdH0gLy8gRWxzZSBjb3VsZCBub3QgcmVzZXJ2ZVxyXG5cdFx0fTsgLy8gRU8gc2VuZFNNU1xyXG5cclxuXHRcdHNlbmRXb3JrZXIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0XHRpZiAoaXNTZW5kaW5nKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIFNldCBzZW5kIGZlbmNlXHJcblx0XHRcdGlzU2VuZGluZyA9IHRydWU7XHJcblxyXG5cdFx0XHR2YXIgYmF0Y2hTaXplID0gb3B0aW9ucy5zZW5kQmF0Y2hTaXplIHx8IDE7XHJcblxyXG5cdFx0XHR2YXIgbm93ID0gK25ldyBEYXRlKCk7XHJcblxyXG5cdFx0XHQvLyBGaW5kIHNtcyB0aGF0IGFyZSBub3QgYmVpbmcgb3IgYWxyZWFkeSBzZW50XHJcblx0XHRcdHZhciBwZW5kaW5nU01TID0gUWNsb3VkU01TUXVldWUuY29sbGVjdGlvbi5maW5kKHtcclxuXHRcdFx0XHQkYW5kOiBbXHJcblx0XHRcdFx0XHQvLyBNZXNzYWdlIGlzIG5vdCBzZW50XHJcblx0XHRcdFx0XHR7XHJcblx0XHRcdFx0XHRcdHNlbnQ6IGZhbHNlXHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0Ly8gQW5kIG5vdCBiZWluZyBzZW50IGJ5IG90aGVyIGluc3RhbmNlc1xyXG5cdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHRzZW5kaW5nOiB7XHJcblx0XHRcdFx0XHRcdFx0JGx0OiBub3dcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdF1cclxuXHRcdFx0fSwge1xyXG5cdFx0XHRcdC8vIFNvcnQgYnkgY3JlYXRlZCBkYXRlXHJcblx0XHRcdFx0c29ydDoge1xyXG5cdFx0XHRcdFx0Y3JlYXRlZEF0OiAxXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRsaW1pdDogYmF0Y2hTaXplXHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdFx0cGVuZGluZ1NNUy5mb3JFYWNoKGZ1bmN0aW9uKHNtcykge1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHRzZW5kU01TKHNtcyk7XHJcblx0XHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcclxuXHJcblx0XHRcdFx0XHRpZiAoUWNsb3VkU01TUXVldWUuZGVidWcpIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ1FjbG91ZFNNU1F1ZXVlOiBDb3VsZCBub3Qgc2VuZCBzbXMgaWQ6IFwiJyArIHNtcy5faWQgKyAnXCIsIEVycm9yOiAnICsgZXJyb3IubWVzc2FnZSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTsgLy8gRU8gZm9yRWFjaFxyXG5cclxuXHRcdFx0Ly8gUmVtb3ZlIHRoZSBzZW5kIGZlbmNlXHJcblx0XHRcdGlzU2VuZGluZyA9IGZhbHNlO1xyXG5cdFx0fSwgb3B0aW9ucy5zZW5kSW50ZXJ2YWwgfHwgMTUwMDApOyAvLyBEZWZhdWx0IGV2ZXJ5IDE1dGggc2VjXHJcblxyXG5cdH0gZWxzZSB7XHJcblx0XHRpZiAoUWNsb3VkU01TUXVldWUuZGVidWcpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1FjbG91ZFNNU1F1ZXVlOiBTZW5kIHNlcnZlciBpcyBkaXNhYmxlZCcpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn07IiwiTWV0ZW9yLnN0YXJ0dXAgLT5cclxuXHRpZiBNZXRlb3Iuc2V0dGluZ3Muc21zPy5xY2xvdWQ/LnNtc3F1ZXVlX2ludGVydmFsXHJcblx0XHRRY2xvdWRTTVNRdWV1ZS5Db25maWd1cmVcclxuXHRcdFx0c2VuZEludGVydmFsOiBNZXRlb3Iuc2V0dGluZ3Muc21zLnFjbG91ZC5zbXNxdWV1ZV9pbnRlcnZhbFxyXG5cdFx0XHRzZW5kQmF0Y2hTaXplOiAxMFxyXG5cdFx0XHRrZWVwU01TOiB0cnVlXHJcblx0XHRcdHNka2FwcGlkOiBNZXRlb3Iuc2V0dGluZ3Muc21zLnFjbG91ZC5zZGthcHBpZFxyXG5cdFx0XHRhcHBrZXk6IE1ldGVvci5zZXR0aW5ncy5zbXMucWNsb3VkLmFwcGtleVxyXG5cdFx0XHRzaWdubmFtZTogTWV0ZW9yLnNldHRpbmdzLnNtcy5xY2xvdWQuc2lnbm5hbWVcclxuIiwiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG4gIHZhciByZWYsIHJlZjE7XG4gIGlmICgocmVmID0gTWV0ZW9yLnNldHRpbmdzLnNtcykgIT0gbnVsbCA/IChyZWYxID0gcmVmLnFjbG91ZCkgIT0gbnVsbCA/IHJlZjEuc21zcXVldWVfaW50ZXJ2YWwgOiB2b2lkIDAgOiB2b2lkIDApIHtcbiAgICByZXR1cm4gUWNsb3VkU01TUXVldWUuQ29uZmlndXJlKHtcbiAgICAgIHNlbmRJbnRlcnZhbDogTWV0ZW9yLnNldHRpbmdzLnNtcy5xY2xvdWQuc21zcXVldWVfaW50ZXJ2YWwsXG4gICAgICBzZW5kQmF0Y2hTaXplOiAxMCxcbiAgICAgIGtlZXBTTVM6IHRydWUsXG4gICAgICBzZGthcHBpZDogTWV0ZW9yLnNldHRpbmdzLnNtcy5xY2xvdWQuc2RrYXBwaWQsXG4gICAgICBhcHBrZXk6IE1ldGVvci5zZXR0aW5ncy5zbXMucWNsb3VkLmFwcGtleSxcbiAgICAgIHNpZ25uYW1lOiBNZXRlb3Iuc2V0dGluZ3Muc21zLnFjbG91ZC5zaWdubmFtZVxuICAgIH0pO1xuICB9XG59KTtcbiJdfQ==
