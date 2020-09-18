(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var check = Package.check.check;
var Match = Package.check.Match;
var _ = Package.underscore._;
var moment = Package['momentjs:moment'].moment;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var HuaweiPush;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:huaweipush":{"checkNpm.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// packages/steedos_huaweipush/checkNpm.js                                                           //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                     //
let checkNpmVersions;
module.link("meteor/tmeasday:check-npm-versions", {
  checkNpmVersions(v) {
    checkNpmVersions = v;
  }

}, 0);
checkNpmVersions({
  'requestretry': '^1.12.2'
}, 'steedos:huaweipush');
///////////////////////////////////////////////////////////////////////////////////////////////////////

},"server":{"huaweiProvider.js":function(require){

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// packages/steedos_huaweipush/server/huaweiProvider.js                                              //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                     //
const request = require('requestretry');

const tokenUrl = "https://login.vmall.com/oauth2/token";
const apiUrl = "https://api.push.hicloud.com/pushsend.do";
const timeout = 5000;
HuaweiPush = {
  authInfo: {},
  default_package_name: undefined
};

HuaweiPush.config = function (config) {
  config.forEach(val => {
    if (this.authInfo[val.package_name]) return;
    this.authInfo[val.package_name] = val;
    val.access_token_expire = 0;

    if (!this.default_package_name) {
      this.default_package_name = val.package_name;
      if (HuaweiPush.debug) console.info('huawei default package name ', this.default_package_name);
    }
  });
};

HuaweiPush.sendMany = function (notification, tokenDataList, timeToLive) {
  if (notification.android.title) {
    const mapTokenData = {};

    for (const tokenData of tokenDataList) {
      const package_name = tokenData.package_name || this.default_package_name;

      if (!this.authInfo[package_name]) {
        console.error('huawei package name not supported: ', package_name);
        continue;
      }

      const tokenList = mapTokenData[package_name] || [];
      tokenList.push(tokenData.token);
      mapTokenData[package_name] = tokenList;
    }

    for (const package_name in mapTokenData) {
      this.doSendMany(notification, package_name, mapTokenData[package_name], timeToLive);
    }
  }
};

HuaweiPush.doSendMany = function (notification, package_name, tokens, timeToLive) {
  this.checkToken(package_name, tokenError => {
    if (!tokenError) {
      if (HuaweiPush.debug) console.log("sendMany ", notification, timeToLive);
      const postData = this.getPostData(notification, package_name, tokens, timeToLive);
      request.post({
        url: apiUrl,
        qs: {
          nsp_ctx: `{"ver":1,"appId":"${this.authInfo[package_name].client_id}"}`
        },
        form: postData,
        timeout: timeout,
        maxAttempts: 2,
        retryDelay: 5000,
        time: true,
        retryStrategy: request.RetryStrategies.NetworkError
      }, (error, response, body) => {
        if (HuaweiPush.debug) console.log("sendMany result", error, body);

        if (!error && response && response.statusCode == 200) {
          if (HuaweiPush.debug) console.log("TODO: callback");
        } else {
          error = error || 'unknown error';
        }
      });
    }
  });
};

HuaweiPush.getPostData = function (notification, package_name, tokens, timeToLive) {
  const postData = {
    access_token: this.authInfo[package_name].access_token,
    nsp_svc: "openpush.message.api.send",
    nsp_ts: Math.floor(Date.now() / 1000)
  };
  postData.payload = {
    hps: {
      msg: {
        type: 3,
        body: {
          content: notification.android.message,
          title: notification.android.title
        },
        action: {
          type: 3,
          param: {
            appPkgName: package_name
          }
        }
      },
      ext: {
        customize: this.extras(notification.extras)
      }
    }
  };
  postData.payload = JSON.stringify(postData.payload);
  postData.device_token_list = JSON.stringify(tokens);

  if (timeToLive > 0) {
    postData.expire_time = this.formatHuaweiDate(new Date(Date.now() + timeToLive));
    if (HuaweiPush.debug) console.log("postData.expire_time ", postData.expire_time);
  }

  return postData;
};

HuaweiPush.sendAll = function (notification, timeToLive) {
  if (notification.android.title) {
    for (const package_name in this.authInfo) {
      console.log("TODO: sendAll");
    }
  }
};

HuaweiPush.checkToken = function (package_name, callback) {
  const authInfo = this.authInfo[package_name];

  if (authInfo.access_token && Date.now() < authInfo.access_token_expire) {
    callback();
  } else {
    if (HuaweiPush.debug) console.info("request token ", package_name, this.authInfo[package_name]);
    request.post({
      url: tokenUrl,
      form: {
        grant_type: "client_credentials",
        client_id: authInfo.client_id,
        client_secret: authInfo.client_secret
      },
      timeout: timeout,
      maxAttempts: 2,
      retryDelay: 5000,
      retryStrategy: request.RetryStrategies.NetworkError
    }, (error, response, body) => {
      if (!error) {
        const data = JSON.parse(body);
        authInfo.access_token = data.access_token;
        authInfo.access_token_expire = Date.now() + data.expires_in * 1000 - 60 * 1000;
        if (HuaweiPush.debug) console.info("get access token success", data);
        callback();
      } else {
        console.error("get access token error", body);
        callback(error);
      }
    });
  }
};

HuaweiPush.formatHuaweiDate = function (date) {
  return moment(date).format("YYYY-MM-DDTHH:mm");
};
/*
 * 用户自定义 dict
 * "extras":{"season":"Spring", "weather":"raining"}]
 */


HuaweiPush.extras = function (extras) {
  if (Array.isArray(extras)) return extras;
  var extraArray = [];

  if (extras) {
    var keys = Object.keys(extras);
    keys.forEach(function (key) {
      var v = {};
      v[key] = extras[key];
      extraArray.push(v);
    });
    extras = extraArray;
  }

  return extraArray;
};
///////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/steedos:huaweipush/checkNpm.js");
require("/node_modules/meteor/steedos:huaweipush/server/huaweiProvider.js");

/* Exports */
Package._define("steedos:huaweipush", {
  HuaweiPush: HuaweiPush
});

})();

//# sourceURL=meteor://💻app/packages/steedos_huaweipush.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpodWF3ZWlwdXNoL2NoZWNrTnBtLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zOmh1YXdlaXB1c2gvc2VydmVyL2h1YXdlaVByb3ZpZGVyLmpzIl0sIm5hbWVzIjpbImNoZWNrTnBtVmVyc2lvbnMiLCJtb2R1bGUiLCJsaW5rIiwidiIsInJlcXVlc3QiLCJyZXF1aXJlIiwidG9rZW5VcmwiLCJhcGlVcmwiLCJ0aW1lb3V0IiwiSHVhd2VpUHVzaCIsImF1dGhJbmZvIiwiZGVmYXVsdF9wYWNrYWdlX25hbWUiLCJ1bmRlZmluZWQiLCJjb25maWciLCJmb3JFYWNoIiwidmFsIiwicGFja2FnZV9uYW1lIiwiYWNjZXNzX3Rva2VuX2V4cGlyZSIsImRlYnVnIiwiY29uc29sZSIsImluZm8iLCJzZW5kTWFueSIsIm5vdGlmaWNhdGlvbiIsInRva2VuRGF0YUxpc3QiLCJ0aW1lVG9MaXZlIiwiYW5kcm9pZCIsInRpdGxlIiwibWFwVG9rZW5EYXRhIiwidG9rZW5EYXRhIiwiZXJyb3IiLCJ0b2tlbkxpc3QiLCJwdXNoIiwidG9rZW4iLCJkb1NlbmRNYW55IiwidG9rZW5zIiwiY2hlY2tUb2tlbiIsInRva2VuRXJyb3IiLCJsb2ciLCJwb3N0RGF0YSIsImdldFBvc3REYXRhIiwicG9zdCIsInVybCIsInFzIiwibnNwX2N0eCIsImNsaWVudF9pZCIsImZvcm0iLCJtYXhBdHRlbXB0cyIsInJldHJ5RGVsYXkiLCJ0aW1lIiwicmV0cnlTdHJhdGVneSIsIlJldHJ5U3RyYXRlZ2llcyIsIk5ldHdvcmtFcnJvciIsInJlc3BvbnNlIiwiYm9keSIsInN0YXR1c0NvZGUiLCJhY2Nlc3NfdG9rZW4iLCJuc3Bfc3ZjIiwibnNwX3RzIiwiTWF0aCIsImZsb29yIiwiRGF0ZSIsIm5vdyIsInBheWxvYWQiLCJocHMiLCJtc2ciLCJ0eXBlIiwiY29udGVudCIsIm1lc3NhZ2UiLCJhY3Rpb24iLCJwYXJhbSIsImFwcFBrZ05hbWUiLCJleHQiLCJjdXN0b21pemUiLCJleHRyYXMiLCJKU09OIiwic3RyaW5naWZ5IiwiZGV2aWNlX3Rva2VuX2xpc3QiLCJleHBpcmVfdGltZSIsImZvcm1hdEh1YXdlaURhdGUiLCJzZW5kQWxsIiwiY2FsbGJhY2siLCJncmFudF90eXBlIiwiY2xpZW50X3NlY3JldCIsImRhdGEiLCJwYXJzZSIsImV4cGlyZXNfaW4iLCJkYXRlIiwibW9tZW50IiwiZm9ybWF0IiwiQXJyYXkiLCJpc0FycmF5IiwiZXh0cmFBcnJheSIsImtleXMiLCJPYmplY3QiLCJrZXkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSUEsZ0JBQUo7QUFBcUJDLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZLG9DQUFaLEVBQWlEO0FBQUNGLGtCQUFnQixDQUFDRyxDQUFELEVBQUc7QUFBQ0gsb0JBQWdCLEdBQUNHLENBQWpCO0FBQW1COztBQUF4QyxDQUFqRCxFQUEyRixDQUEzRjtBQUNyQkgsZ0JBQWdCLENBQUM7QUFDaEIsa0JBQWdCO0FBREEsQ0FBRCxFQUViLG9CQUZhLENBQWhCLEM7Ozs7Ozs7Ozs7O0FDREEsTUFBTUksT0FBTyxHQUFHQyxPQUFPLENBQUMsY0FBRCxDQUF2Qjs7QUFDQSxNQUFNQyxRQUFRLEdBQUcsc0NBQWpCO0FBQ0EsTUFBTUMsTUFBTSxHQUFHLDBDQUFmO0FBQ0EsTUFBTUMsT0FBTyxHQUFHLElBQWhCO0FBRUFDLFVBQVUsR0FBRztBQUNaQyxVQUFRLEVBQUUsRUFERTtBQUVaQyxzQkFBb0IsRUFBRUM7QUFGVixDQUFiOztBQUtBSCxVQUFVLENBQUNJLE1BQVgsR0FBb0IsVUFBU0EsTUFBVCxFQUFpQjtBQUNwQ0EsUUFBTSxDQUFDQyxPQUFQLENBQWdCQyxHQUFELElBQVM7QUFDdkIsUUFBSSxLQUFLTCxRQUFMLENBQWNLLEdBQUcsQ0FBQ0MsWUFBbEIsQ0FBSixFQUNDO0FBQ0QsU0FBS04sUUFBTCxDQUFjSyxHQUFHLENBQUNDLFlBQWxCLElBQWtD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QWQsQ0FBSixFQUNDLE9BQU9BLE1BQVA7QUFFRCxNQUFJa0IsVUFBVSxHQUFHLEVBQWpCOztBQUNBLE1BQUlsQixNQUFKLEVBQVk7QUFDWCxRQUFJbUIsSUFBSSxHQUFHQyxNQUFNLENBQUNELElBQVAsQ0FBWW5CLE1BQVosQ0FBWDtBQUNBbUIsUUFBSSxDQUFDOUUsT0FBTCxDQUFhLFVBQVNnRixHQUFULEVBQWM7QUFDMUIsVUFBSTNGLENBQUMsR0FBRyxFQUFSO0FBQ0FBLE9BQUMsQ0FBQzJGLEdBQUQsQ0FBRCxHQUFTckIsTUFBTSxDQUFDcUIsR0FBRCxDQUFmO0FBQ0FILGdCQUFVLENBQUM1RCxJQUFYLENBQWdCNUIsQ0FBaEI7QUFDQSxLQUpEO0FBS0FzRSxVQUFNLEdBQUdrQixVQUFUO0FBQ0E7O0FBQ0QsU0FBT0EsVUFBUDtBQUNBLENBZkQsQyIsImZpbGUiOiIvcGFja2FnZXMvc3RlZWRvc19odWF3ZWlwdXNoLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY2hlY2tOcG1WZXJzaW9ucyB9IGZyb20gJ21ldGVvci90bWVhc2RheTpjaGVjay1ucG0tdmVyc2lvbnMnO1xyXG5jaGVja05wbVZlcnNpb25zKHtcclxuXHQncmVxdWVzdHJldHJ5JzogJ14xLjEyLjInXHJcbn0sICdzdGVlZG9zOmh1YXdlaXB1c2gnKTsiLCJjb25zdCByZXF1ZXN0ID0gcmVxdWlyZSgncmVxdWVzdHJldHJ5Jyk7XHJcbmNvbnN0IHRva2VuVXJsID0gXCJodHRwczovL2xvZ2luLnZtYWxsLmNvbS9vYXV0aDIvdG9rZW5cIjtcclxuY29uc3QgYXBpVXJsID0gXCJodHRwczovL2FwaS5wdXNoLmhpY2xvdWQuY29tL3B1c2hzZW5kLmRvXCI7XHJcbmNvbnN0IHRpbWVvdXQgPSA1MDAwO1xyXG5cclxuSHVhd2VpUHVzaCA9IHtcclxuXHRhdXRoSW5mbzoge30sXHJcblx0ZGVmYXVsdF9wYWNrYWdlX25hbWU6IHVuZGVmaW5lZFxyXG59O1xyXG5cclxuSHVhd2VpUHVzaC5jb25maWcgPSBmdW5jdGlvbihjb25maWcpIHtcclxuXHRjb25maWcuZm9yRWFjaCgodmFsKSA9PiB7XHJcblx0XHRpZiAodGhpcy5hdXRoSW5mb1t2YWwucGFja2FnZV9uYW1lXSlcclxuXHRcdFx0cmV0dXJuXHJcblx0XHR0aGlzLmF1dGhJbmZvW3ZhbC5wYWNrYWdlX25hbWVdID0gdmFsO1xyXG5cdFx0dmFsLmFjY2Vzc190b2tlbl9leHBpcmUgPSAwO1xyXG5cdFx0aWYgKCF0aGlzLmRlZmF1bHRfcGFja2FnZV9uYW1lKSB7XHJcblx0XHRcdHRoaXMuZGVmYXVsdF9wYWNrYWdlX25hbWUgPSB2YWwucGFja2FnZV9uYW1lO1xyXG5cdFx0XHRpZiAoSHVhd2VpUHVzaC5kZWJ1ZylcclxuXHRcdFx0XHRjb25zb2xlLmluZm8oJ2h1YXdlaSBkZWZhdWx0IHBhY2thZ2UgbmFtZSAnLCB0aGlzLmRlZmF1bHRfcGFja2FnZV9uYW1lKTtcclxuXHRcdH1cclxuXHR9KTtcclxufVxyXG5cclxuSHVhd2VpUHVzaC5zZW5kTWFueSA9IGZ1bmN0aW9uKG5vdGlmaWNhdGlvbiwgdG9rZW5EYXRhTGlzdCwgdGltZVRvTGl2ZSkge1xyXG5cdGlmIChub3RpZmljYXRpb24uYW5kcm9pZC50aXRsZSkge1xyXG5cdFx0Y29uc3QgbWFwVG9rZW5EYXRhID0ge307XHJcblx0XHRmb3IgKGNvbnN0IHRva2VuRGF0YSBvZiB0b2tlbkRhdGFMaXN0KSB7XHJcblx0XHRcdGNvbnN0IHBhY2thZ2VfbmFtZSA9IHRva2VuRGF0YS5wYWNrYWdlX25hbWUgfHwgdGhpcy5kZWZhdWx0X3BhY2thZ2VfbmFtZTtcclxuXHRcdFx0aWYgKCF0aGlzLmF1dGhJbmZvW3BhY2thZ2VfbmFtZV0pIHtcclxuXHRcdFx0XHRjb25zb2xlLmVycm9yKCdodWF3ZWkgcGFja2FnZSBuYW1lIG5vdCBzdXBwb3J0ZWQ6ICcsIHBhY2thZ2VfbmFtZSk7XHJcblx0XHRcdFx0Y29udGludWU7XHJcblx0XHRcdH1cclxuXHRcdFx0Y29uc3QgdG9rZW5MaXN0ID0gbWFwVG9rZW5EYXRhW3BhY2thZ2VfbmFtZV0gfHwgW107XHJcblx0XHRcdHRva2VuTGlzdC5wdXNoKHRva2VuRGF0YS50b2tlbik7XHJcblx0XHRcdG1hcFRva2VuRGF0YVtwYWNrYWdlX25hbWVdID0gdG9rZW5MaXN0O1xyXG5cdFx0fVxyXG5cclxuXHRcdGZvciAoY29uc3QgcGFja2FnZV9uYW1lIGluIG1hcFRva2VuRGF0YSkge1xyXG5cdFx0XHR0aGlzLmRvU2VuZE1hbnkobm90aWZpY2F0aW9uLCBwYWNrYWdlX25hbWUsIG1hcFRva2VuRGF0YVtwYWNrYWdlX25hbWVdLCB0aW1lVG9MaXZlKTtcclxuXHRcdH1cclxuXHR9XHJcbn1cclxuXHJcbkh1YXdlaVB1c2guZG9TZW5kTWFueSA9IGZ1bmN0aW9uKG5vdGlmaWNhdGlvbiwgcGFja2FnZV9uYW1lLCB0b2tlbnMsIHRpbWVUb0xpdmUpIHtcclxuXHR0aGlzLmNoZWNrVG9rZW4ocGFja2FnZV9uYW1lLCAodG9rZW5FcnJvcikgPT4ge1xyXG5cdFx0aWYgKCF0b2tlbkVycm9yKSB7XHJcblx0XHRcdGlmIChIdWF3ZWlQdXNoLmRlYnVnKVxyXG5cdFx0XHRcdGNvbnNvbGUubG9nKFwic2VuZE1hbnkgXCIsIG5vdGlmaWNhdGlvbiwgdGltZVRvTGl2ZSk7XHJcblx0XHRcdGNvbnN0IHBvc3REYXRhID0gdGhpcy5nZXRQb3N0RGF0YShub3RpZmljYXRpb24sIHBhY2thZ2VfbmFtZSwgdG9rZW5zLCB0aW1lVG9MaXZlKTtcclxuXHRcdFx0cmVxdWVzdC5wb3N0KHtcclxuXHRcdFx0XHR1cmw6IGFwaVVybCxcclxuXHRcdFx0XHRxczoge1xyXG5cdFx0XHRcdFx0bnNwX2N0eDogYHtcInZlclwiOjEsXCJhcHBJZFwiOlwiJHt0aGlzLmF1dGhJbmZvW3BhY2thZ2VfbmFtZV0uY2xpZW50X2lkfVwifWBcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdGZvcm06IHBvc3REYXRhLFxyXG5cdFx0XHRcdHRpbWVvdXQ6IHRpbWVvdXQsXHJcblx0XHRcdFx0bWF4QXR0ZW1wdHM6IDIsXHJcblx0XHRcdFx0cmV0cnlEZWxheTogNTAwMCxcclxuXHRcdFx0XHR0aW1lOiB0cnVlLFxyXG5cdFx0XHRcdHJldHJ5U3RyYXRlZ3k6IHJlcXVlc3QuUmV0cnlTdHJhdGVnaWVzLk5ldHdvcmtFcnJvclxyXG5cdFx0XHR9LCAoZXJyb3IsIHJlc3BvbnNlLCBib2R5KSA9PiB7XHJcblx0XHRcdFx0aWYgKEh1YXdlaVB1c2guZGVidWcpXHJcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhcInNlbmRNYW55IHJlc3VsdFwiLCBlcnJvciwgYm9keSk7XHJcblx0XHRcdFx0aWYgKCFlcnJvciAmJiByZXNwb25zZSAmJiByZXNwb25zZS5zdGF0dXNDb2RlID09IDIwMCkge1xyXG5cdFx0XHRcdFx0aWYgKEh1YXdlaVB1c2guZGVidWcpXHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiVE9ETzogY2FsbGJhY2tcIik7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGVycm9yID0gZXJyb3IgfHwgJ3Vua25vd24gZXJyb3InO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0fSk7XHJcbn1cclxuXHJcbkh1YXdlaVB1c2guZ2V0UG9zdERhdGEgPSBmdW5jdGlvbihub3RpZmljYXRpb24sIHBhY2thZ2VfbmFtZSwgdG9rZW5zLCB0aW1lVG9MaXZlKSB7XHJcblx0Y29uc3QgcG9zdERhdGEgPSB7XHJcblx0XHRhY2Nlc3NfdG9rZW46IHRoaXMuYXV0aEluZm9bcGFja2FnZV9uYW1lXS5hY2Nlc3NfdG9rZW4sXHJcblx0XHRuc3Bfc3ZjOiBcIm9wZW5wdXNoLm1lc3NhZ2UuYXBpLnNlbmRcIixcclxuXHRcdG5zcF90czogTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMClcclxuXHR9O1xyXG5cdHBvc3REYXRhLnBheWxvYWQgPSB7XHJcblx0XHRocHM6IHtcclxuXHRcdFx0bXNnOiB7XHJcblx0XHRcdFx0dHlwZTogMyxcclxuXHRcdFx0XHRib2R5OiB7XHJcblx0XHRcdFx0XHRjb250ZW50OiBub3RpZmljYXRpb24uYW5kcm9pZC5tZXNzYWdlLFxyXG5cdFx0XHRcdFx0dGl0bGU6IG5vdGlmaWNhdGlvbi5hbmRyb2lkLnRpdGxlXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRhY3Rpb246IHtcclxuXHRcdFx0XHRcdHR5cGU6IDMsXHJcblx0XHRcdFx0XHRwYXJhbToge1xyXG5cdFx0XHRcdFx0XHRhcHBQa2dOYW1lOiBwYWNrYWdlX25hbWVcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH0sXHJcblx0XHRcdGV4dDoge1xyXG5cdFx0XHRcdGN1c3RvbWl6ZTogdGhpcy5leHRyYXMobm90aWZpY2F0aW9uLmV4dHJhcylcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH07XHJcblx0cG9zdERhdGEucGF5bG9hZCA9IEpTT04uc3RyaW5naWZ5KHBvc3REYXRhLnBheWxvYWQpO1xyXG5cdHBvc3REYXRhLmRldmljZV90b2tlbl9saXN0ID0gSlNPTi5zdHJpbmdpZnkodG9rZW5zKTtcclxuXHJcblx0aWYgKHRpbWVUb0xpdmUgPiAwKSB7XHJcblx0XHRwb3N0RGF0YS5leHBpcmVfdGltZSA9IHRoaXMuZm9ybWF0SHVhd2VpRGF0ZShuZXcgRGF0ZShEYXRlLm5vdygpICsgdGltZVRvTGl2ZSkpO1xyXG5cdFx0aWYgKEh1YXdlaVB1c2guZGVidWcpXHJcblx0XHRcdGNvbnNvbGUubG9nKFwicG9zdERhdGEuZXhwaXJlX3RpbWUgXCIsIHBvc3REYXRhLmV4cGlyZV90aW1lKTtcclxuXHR9XHJcblx0cmV0dXJuIHBvc3REYXRhO1xyXG59XHJcblxyXG5IdWF3ZWlQdXNoLnNlbmRBbGwgPSBmdW5jdGlvbihub3RpZmljYXRpb24sIHRpbWVUb0xpdmUpIHtcclxuXHRpZiAobm90aWZpY2F0aW9uLmFuZHJvaWQudGl0bGUpIHtcclxuXHRcdGZvciAoY29uc3QgcGFja2FnZV9uYW1lIGluIHRoaXMuYXV0aEluZm8pIHtcclxuXHRcdFx0Y29uc29sZS5sb2coXCJUT0RPOiBzZW5kQWxsXCIpO1xyXG5cdFx0fVxyXG5cdH1cclxufVxyXG5cclxuSHVhd2VpUHVzaC5jaGVja1Rva2VuID0gZnVuY3Rpb24ocGFja2FnZV9uYW1lLCBjYWxsYmFjaykge1xyXG5cdGNvbnN0IGF1dGhJbmZvID0gdGhpcy5hdXRoSW5mb1twYWNrYWdlX25hbWVdO1xyXG5cdGlmIChhdXRoSW5mby5hY2Nlc3NfdG9rZW4gJiYgRGF0ZS5ub3coKSA8IGF1dGhJbmZvLmFjY2Vzc190b2tlbl9leHBpcmUpIHtcclxuXHRcdGNhbGxiYWNrKCk7XHJcblx0fSBlbHNlIHtcclxuXHRcdGlmIChIdWF3ZWlQdXNoLmRlYnVnKVxyXG5cdFx0XHRjb25zb2xlLmluZm8oXCJyZXF1ZXN0IHRva2VuIFwiLCBwYWNrYWdlX25hbWUsIHRoaXMuYXV0aEluZm9bcGFja2FnZV9uYW1lXSk7XHJcblx0XHRyZXF1ZXN0LnBvc3Qoe1xyXG5cdFx0XHR1cmw6IHRva2VuVXJsLFxyXG5cdFx0XHRmb3JtOiB7XHJcblx0XHRcdFx0Z3JhbnRfdHlwZTogXCJjbGllbnRfY3JlZGVudGlhbHNcIixcclxuXHRcdFx0XHRjbGllbnRfaWQ6IGF1dGhJbmZvLmNsaWVudF9pZCxcclxuXHRcdFx0XHRjbGllbnRfc2VjcmV0OiBhdXRoSW5mby5jbGllbnRfc2VjcmV0XHJcblx0XHRcdH0sXHJcblx0XHRcdHRpbWVvdXQ6IHRpbWVvdXQsXHJcblx0XHRcdG1heEF0dGVtcHRzOiAyLFxyXG5cdFx0XHRyZXRyeURlbGF5OiA1MDAwLFxyXG5cdFx0XHRyZXRyeVN0cmF0ZWd5OiByZXF1ZXN0LlJldHJ5U3RyYXRlZ2llcy5OZXR3b3JrRXJyb3JcclxuXHRcdH0sIChlcnJvciwgcmVzcG9uc2UsIGJvZHkpID0+IHtcclxuXHRcdFx0aWYgKCFlcnJvcikge1xyXG5cdFx0XHRcdGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKGJvZHkpO1xyXG5cdFx0XHRcdGF1dGhJbmZvLmFjY2Vzc190b2tlbiA9IGRhdGEuYWNjZXNzX3Rva2VuO1xyXG5cdFx0XHRcdGF1dGhJbmZvLmFjY2Vzc190b2tlbl9leHBpcmUgPSBEYXRlLm5vdygpICsgZGF0YS5leHBpcmVzX2luICogMTAwMCAtIDYwICogMTAwMDtcclxuXHRcdFx0XHRpZiAoSHVhd2VpUHVzaC5kZWJ1ZylcclxuXHRcdFx0XHRcdGNvbnNvbGUuaW5mbyhcImdldCBhY2Nlc3MgdG9rZW4gc3VjY2Vzc1wiLCBkYXRhKTtcclxuXHRcdFx0XHRjYWxsYmFjaygpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoXCJnZXQgYWNjZXNzIHRva2VuIGVycm9yXCIsIGJvZHkpO1xyXG5cdFx0XHRcdGNhbGxiYWNrKGVycm9yKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fVxyXG59XHJcblxyXG5IdWF3ZWlQdXNoLmZvcm1hdEh1YXdlaURhdGUgPSBmdW5jdGlvbihkYXRlKSB7XHJcblx0cmV0dXJuIG1vbWVudChkYXRlKS5mb3JtYXQoXCJZWVlZLU1NLUREVEhIOm1tXCIpO1xyXG59XHJcblxyXG4vKlxyXG4gKiDnlKjmiLfoh6rlrprkuYkgZGljdFxyXG4gKiBcImV4dHJhc1wiOntcInNlYXNvblwiOlwiU3ByaW5nXCIsIFwid2VhdGhlclwiOlwicmFpbmluZ1wifV1cclxuICovXHJcbkh1YXdlaVB1c2guZXh0cmFzID0gZnVuY3Rpb24oZXh0cmFzKSB7XHJcblx0aWYgKEFycmF5LmlzQXJyYXkoZXh0cmFzKSlcclxuXHRcdHJldHVybiBleHRyYXM7XHJcblxyXG5cdHZhciBleHRyYUFycmF5ID0gW107XHJcblx0aWYgKGV4dHJhcykge1xyXG5cdFx0dmFyIGtleXMgPSBPYmplY3Qua2V5cyhleHRyYXMpO1xyXG5cdFx0a2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xyXG5cdFx0XHR2YXIgdiA9IHt9O1xyXG5cdFx0XHR2W2tleV0gPSBleHRyYXNba2V5XTtcclxuXHRcdFx0ZXh0cmFBcnJheS5wdXNoKHYpXHJcblx0XHR9KVxyXG5cdFx0ZXh0cmFzID0gZXh0cmFBcnJheVxyXG5cdH1cclxuXHRyZXR1cm4gZXh0cmFBcnJheTtcclxufTsiXX0=
