(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var permissionManagerForInitApproval = Package['steedos:creator'].permissionManagerForInitApproval;
var uuflowManagerForInitApproval = Package['steedos:creator'].uuflowManagerForInitApproval;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var Selector = Package['steedos:base'].Selector;
var Steedos = Package['steedos:base'].Steedos;
var AjaxCollection = Package['steedos:base'].AjaxCollection;
var SteedosDataManager = Package['steedos:base'].SteedosDataManager;
var SteedosOffice = Package['steedos:base'].SteedosOffice;
var billingManager = Package['steedos:base'].billingManager;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var __coffeescriptShare;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:app-chat":{"checkNpm.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/steedos_app-chat/checkNpm.js                                                                     //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
let checkNpmVersions;
module.link("meteor/tmeasday:check-npm-versions", {
  checkNpmVersions(v) {
    checkNpmVersions = v;
  }

}, 0);
checkNpmVersions({
  'socket.io': '>=1.4.8' // 'socket.io-client': "^1.4.8"

}, 'steedos:app-chat');
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"models":{"chat_subscriptions.coffee":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/steedos_app-chat/models/chat_subscriptions.coffee                                                //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"chat_messages.coffee":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/steedos_app-chat/models/chat_messages.coffee                                                     //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"chat_rooms.coffee":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/steedos_app-chat/models/chat_rooms.coffee                                                        //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"publications":{"chat_messages.coffee":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/steedos_app-chat/server/publications/chat_messages.coffee                                        //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.publishComposite('chat_messages', function (space_id, object_name, record_id, options) {
  var data, query, self;
  query = {
    'space': space_id,
    'related_to.o': object_name,
    'related_to.ids': record_id
  };
  self = this;
  self.unblock();
  data = {
    find: function () {
      self.unblock();
      return Creator.getCollection("chat_messages").find(query, options);
    }
  };
  data.children = [];
  data.children.push({
    find: function (parent) {
      var e;

      try {
        self.unblock();

        if (parent != null ? parent.owner : void 0) {
          return Creator.getCollection("users").find({
            _id: parent.owner
          }, {
            fields: {
              name: 1,
              avatarUrl: 1
            }
          });
        } else {
          return [];
        }
      } catch (error) {
        e = error;
        console.log(reference_to, parent, e);
        return [];
      }
    }
  });
  return data;
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"chat.socket.coffee":function(require){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/steedos_app-chat/server/chat.socket.coffee                                                       //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var Fiber, PORT, SOCKETEVENTNAMES, SOCKETS, checkAuthToken, checkAuthTokenFiber, getReceiveSocketKey, http, receiveMessageSockets, receiveSubscriptionSockets, sendUnreadBadge, sendUnreadBadgeFiber, socketEmit, socket_io;
http = require('http');
socket_io = require('socket.io');
Fiber = require('fibers');

if (!process.env.SOCKET_IO_PORT) {
  return;
}

PORT = process.env.SOCKET_IO_PORT || 8080;
SOCKETS = {};
receiveMessageSockets = {};
receiveSubscriptionSockets = {};
SOCKETEVENTNAMES = {
  NEWMESSAGE: 'new message',
  STOPNEWMESSAGE: 'stop message',
  RECEIVEMESSAGE: 'receive message',
  SUBSCRIPTIONS: 'subscriptions',
  STOPNEWSUBSCRIPTIONS: 'stop subscriptions',
  RECEIVESUBSCRIPTIONS: 'receive subscriptions',
  COUNTUNREAD: 'count unread'
};

checkAuthToken = function (userId, authToken) {
  var hashedToken, user;

  if (userId && authToken) {
    hashedToken = Accounts._hashLoginToken(authToken);
    user = wrapAsyncFindOne(db.users, {
      _id: userId,
      "services.resume.loginTokens.hashedToken": hashedToken
    });

    if (user) {
      return true;
    } else {
      return false;
    }
  }

  return false;
};

getReceiveSocketKey = function (object_name, record_id, userId) {
  return object_name + "_" + record_id + "_" + userId;
};

sendUnreadBadge = function (socket, space_id, owner) {
  var countUnread;
  countUnread = 0;
  Creator.getCollection("chat_subscriptions").find({
    owner: owner,
    unread: {
      $gt: 0
    }
  }, {
    fields: {
      unread: 1
    }
  }).forEach(function (_r) {
    return countUnread += _r.unread;
  });
  return socketEmit(socket, SOCKETEVENTNAMES.COUNTUNREAD, countUnread);
};

sendUnreadBadgeFiber = function (socket, space_id, owner) {
  return Fiber(function () {
    return sendUnreadBadge(socket, space_id, owner);
  }).run();
};

checkAuthTokenFiber = function (socket, userId, authToken) {
  return Fiber(function () {
    var check;
    check = Steedos.checkAuthToken(userId, authToken);

    if (!check) {
      SOCKETS[socket.id] = null;
      return socket.disconnect();
    }
  }).run();
};

socketEmit = function (socket, eventname, data) {
  if (socket && SOCKETS[socket.id]) {
    return socket.emit(eventname, data);
  }
};

Meteor.startup(function () {
  var chat_messages_init, chat_subscriptions_init, counter, e, io, sendNewMessage, sendSubscription, server;
  server = http.createServer();
  io = socket_io(server);
  counter = 0;
  io.on('connection', function (socket) {
    var authToken, query, userId;
    query = socket.request._query;
    userId = query["X-User-Id"];
    authToken = query["X-Auth-Token"];

    if (!userId || !authToken) {
      socket.disconnect();
      return;
    }

    checkAuthTokenFiber(socket, userId, authToken);
    SOCKETS[socket.id] = socket;
    socket.on('disconnect', function () {
      query = socket.request._query;
      userId = query["X-User-Id"];
      return SOCKETS[socket.id] = null;
    });
    socket.on(SOCKETEVENTNAMES.STOPNEWMESSAGE, function (res) {
      var key;
      key = getReceiveSocketKey(res.object_name, res.record_id, socket.request._query["X-User-Id"]);
      return receiveMessageSockets[key] = null;
    });
    socket.on(SOCKETEVENTNAMES.RECEIVEMESSAGE, function (res) {
      var key;
      key = getReceiveSocketKey(res.object_name, res.record_id, socket.request._query["X-User-Id"]);
      return receiveMessageSockets[key] = socket;
    });
    socket.on(SOCKETEVENTNAMES.STOPNEWSUBSCRIPTIONS, function (res) {
      var key;
      key = getReceiveSocketKey(res.object_name, '', socket.request._query["X-User-Id"]);
      return receiveSubscriptionSockets[key] = null;
    });
    return socket.on(SOCKETEVENTNAMES.RECEIVESUBSCRIPTIONS, function (res) {
      var key;
      key = getReceiveSocketKey(res.object_name, '', socket.request._query["X-User-Id"]);
      receiveSubscriptionSockets[key] = socket;
      return sendUnreadBadgeFiber(socket, '', socket.request._query["X-User-Id"]);
    });
  });

  try {
    server.listen(PORT);
    console.log('chat socket.io port', PORT);
  } catch (error) {
    e = error;
    console.error(e);
  }

  sendNewMessage = function (msg) {
    var object_name, participants, record_id, room;

    if (msg.related_to.o && msg.related_to.ids.length > 0) {
      object_name = msg.related_to.o;
      record_id = msg.related_to.ids[0];
      delete msg.related_to;
      msg.owner = Creator.getCollection("users").findOne({
        _id: msg.owner
      }, {
        fields: {
          _id: 1,
          name: 1,
          avatarUrl: 1
        }
      });

      if (object_name === 'chat_rooms') {
        room = Creator.getCollection(object_name).findOne({
          _id: record_id
        }, {
          fields: {
            members: 1
          }
        });

        if (room) {
          return _.forEach(room != null ? room.members : void 0, function (m) {
            var key;
            key = getReceiveSocketKey(object_name, record_id, m);
            return socketEmit(receiveMessageSockets[key], SOCKETEVENTNAMES.NEWMESSAGE, msg);
          });
        }
      } else {
        participants = Creator.getCollection("chat_subscriptions").find({
          'related_to.o': object_name,
          'related_to.ids': [record_id]
        }, {
          fields: {
            owner: 1
          }
        });
        return participants.forEach(function (p) {
          var key;
          key = getReceiveSocketKey(object_name, record_id, p.owner);
          return socketEmit(receiveMessageSockets[key], SOCKETEVENTNAMES.NEWMESSAGE, msg);
        });
      }
    }
  };

  chat_messages_init = false;
  Creator.getCollection("chat_messages").find({
    'created': {
      $gte: new Date()
    }
  }, {
    fields: {
      created_by: 0,
      modified: 0,
      modified_by: 0
    }
  }).observe({
    added: function (newDocument) {
      if (chat_messages_init) {
        return sendNewMessage(newDocument);
      }
    },
    changed: function (newDocument, oldDocument) {
      return sendNewMessage(newDocument);
    },
    removed: function (oldDocument) {
      return sendNewMessage(oldDocument);
    }
  });
  chat_messages_init = true;

  sendSubscription = function (sub) {
    var key, object_name, record_id, room;

    if (sub.related_to.o && sub.related_to.ids.length > 0) {
      object_name = sub.related_to.o;
      record_id = sub.related_to.ids[0];
      sub.modified_by = Creator.getCollection("users").findOne({
        _id: sub.modified_by
      }, {
        fields: {
          _id: 1,
          name: 1,
          avatarUrl: 1
        }
      });
      key = getReceiveSocketKey(object_name, '', sub.owner);

      if (receiveSubscriptionSockets[key]) {
        if (object_name === 'chat_rooms') {
          room = Creator.getCollection(object_name).findOne({
            _id: record_id
          }, {
            fields: {
              members: 1
            }
          });

          if (room) {
            sub._room = {
              _id: room._id,
              members: Creator.getCollection("users").find({
                _id: {
                  $in: room.members || []
                }
              }, {
                fields: {
                  _id: 1,
                  name: 1,
                  avatarUrl: 1
                }
              }).fetch()
            };
          }
        }

        socketEmit(receiveSubscriptionSockets[key], SOCKETEVENTNAMES.SUBSCRIPTIONS, sub);
        return sendUnreadBadge(receiveSubscriptionSockets[key], '', sub.owner);
      }
    }
  };

  chat_subscriptions_init = false;
  Creator.getCollection("chat_subscriptions").find({
    $or: [{
      'created': {
        $gte: new Date()
      }
    }, {
      'modified': {
        $gte: new Date()
      }
    }]
  }, {
    fields: {
      created_by: 0
    }
  }).observe({
    added: function (newDocument) {
      if (chat_subscriptions_init) {
        return sendSubscription(newDocument);
      }
    },
    changed: function (newDocument, oldDocument) {
      return sendSubscription(newDocument);
    },
    removed: function (oldDocument) {
      return sendSubscription(oldDocument);
    }
  });
  return chat_subscriptions_init = true;
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".coffee"
  ]
});

require("/node_modules/meteor/steedos:app-chat/checkNpm.js");
require("/node_modules/meteor/steedos:app-chat/models/chat_subscriptions.coffee");
require("/node_modules/meteor/steedos:app-chat/models/chat_messages.coffee");
require("/node_modules/meteor/steedos:app-chat/models/chat_rooms.coffee");
require("/node_modules/meteor/steedos:app-chat/server/publications/chat_messages.coffee");
require("/node_modules/meteor/steedos:app-chat/server/chat.socket.coffee");

/* Exports */
Package._define("steedos:app-chat");

})();

//# sourceURL=meteor://💻app/packages/steedos_app-chat.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczphcHAtY2hhdC9jaGVja05wbS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19hcHAtY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL2NoYXRfbWVzc2FnZXMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvcHVibGljYXRpb25zL2NoYXRfbWVzc2FnZXMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX2FwcC1jaGF0L3NlcnZlci9jaGF0LnNvY2tldC5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9jaGF0LnNvY2tldC5jb2ZmZWUiXSwibmFtZXMiOlsiY2hlY2tOcG1WZXJzaW9ucyIsIm1vZHVsZSIsImxpbmsiLCJ2IiwiTWV0ZW9yIiwicHVibGlzaENvbXBvc2l0ZSIsInNwYWNlX2lkIiwib2JqZWN0X25hbWUiLCJyZWNvcmRfaWQiLCJvcHRpb25zIiwiZGF0YSIsInF1ZXJ5Iiwic2VsZiIsInVuYmxvY2siLCJmaW5kIiwiQ3JlYXRvciIsImdldENvbGxlY3Rpb24iLCJjaGlsZHJlbiIsInB1c2giLCJwYXJlbnQiLCJlIiwib3duZXIiLCJfaWQiLCJmaWVsZHMiLCJuYW1lIiwiYXZhdGFyVXJsIiwiZXJyb3IiLCJjb25zb2xlIiwibG9nIiwicmVmZXJlbmNlX3RvIiwiRmliZXIiLCJQT1JUIiwiU09DS0VURVZFTlROQU1FUyIsIlNPQ0tFVFMiLCJjaGVja0F1dGhUb2tlbiIsImNoZWNrQXV0aFRva2VuRmliZXIiLCJnZXRSZWNlaXZlU29ja2V0S2V5IiwiaHR0cCIsInJlY2VpdmVNZXNzYWdlU29ja2V0cyIsInJlY2VpdmVTdWJzY3JpcHRpb25Tb2NrZXRzIiwic2VuZFVucmVhZEJhZGdlIiwic2VuZFVucmVhZEJhZGdlRmliZXIiLCJzb2NrZXRFbWl0Iiwic29ja2V0X2lvIiwicmVxdWlyZSIsInByb2Nlc3MiLCJlbnYiLCJTT0NLRVRfSU9fUE9SVCIsIk5FV01FU1NBR0UiLCJTVE9QTkVXTUVTU0FHRSIsIlJFQ0VJVkVNRVNTQUdFIiwiU1VCU0NSSVBUSU9OUyIsIlNUT1BORVdTVUJTQ1JJUFRJT05TIiwiUkVDRUlWRVNVQlNDUklQVElPTlMiLCJDT1VOVFVOUkVBRCIsInVzZXJJZCIsImF1dGhUb2tlbiIsImhhc2hlZFRva2VuIiwidXNlciIsIkFjY291bnRzIiwiX2hhc2hMb2dpblRva2VuIiwid3JhcEFzeW5jRmluZE9uZSIsImRiIiwidXNlcnMiLCJzb2NrZXQiLCJjb3VudFVucmVhZCIsInVucmVhZCIsIiRndCIsImZvckVhY2giLCJfciIsInJ1biIsImNoZWNrIiwiU3RlZWRvcyIsImlkIiwiZGlzY29ubmVjdCIsImV2ZW50bmFtZSIsImVtaXQiLCJzdGFydHVwIiwiY2hhdF9tZXNzYWdlc19pbml0IiwiY2hhdF9zdWJzY3JpcHRpb25zX2luaXQiLCJjb3VudGVyIiwiaW8iLCJzZW5kTmV3TWVzc2FnZSIsInNlbmRTdWJzY3JpcHRpb24iLCJzZXJ2ZXIiLCJjcmVhdGVTZXJ2ZXIiLCJvbiIsInJlcXVlc3QiLCJfcXVlcnkiLCJyZXMiLCJrZXkiLCJsaXN0ZW4iLCJtc2ciLCJwYXJ0aWNpcGFudHMiLCJyb29tIiwicmVsYXRlZF90byIsIm8iLCJpZHMiLCJsZW5ndGgiLCJmaW5kT25lIiwibWVtYmVycyIsIl8iLCJtIiwicCIsIiRndGUiLCJEYXRlIiwiY3JlYXRlZF9ieSIsIm1vZGlmaWVkIiwibW9kaWZpZWRfYnkiLCJvYnNlcnZlIiwiYWRkZWQiLCJuZXdEb2N1bWVudCIsImNoYW5nZWQiLCJvbGREb2N1bWVudCIsInJlbW92ZWQiLCJzdWIiLCJfcm9vbSIsIiRpbiIsImZldGNoIiwiJG9yIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSUEsZ0JBQUo7QUFBcUJDLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZLG9DQUFaLEVBQWlEO0FBQUNGLGtCQUFnQixDQUFD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LFdBQU8sVUFBQ0MsV0FBRDtBQUNOLFVBQUdoQyx1QkFBSDtBQ2dFSyxlRC9ESkksaUJBQWlCNEIsV0FBakIsQ0MrREk7QUFDRDtBRG5FSztBQUlWQyxhQUFTLFVBQUNELFdBQUQsRUFBY0UsV0FBZDtBQ2tFTCxhRGpFSDlCLGlCQUFpQjRCLFdBQWpCLENDaUVHO0FEdEVNO0FBTVZHLGFBQVMsVUFBQ0QsV0FBRDtBQ21FTCxhRGxFSDlCLGlCQUFpQjhCLFdBQWpCLENDa0VHO0FEekVNO0FBQUEsR0FOWDtBQ2tGQyxTRG5FRGxDLDBCQUEwQixJQ21FekI7QUR0TkYsRyIsImZpbGUiOiIvcGFja2FnZXMvc3RlZWRvc19hcHAtY2hhdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNoZWNrTnBtVmVyc2lvbnMgfSBmcm9tICdtZXRlb3IvdG1lYXNkYXk6Y2hlY2stbnBtLXZlcnNpb25zJztcbmNoZWNrTnBtVmVyc2lvbnMoe1xuXHQnc29ja2V0LmlvJzogJz49MS40LjgnLFxuXHQvLyAnc29ja2V0LmlvLWNsaWVudCc6IFwiXjEuNC44XCJcbn0sICdzdGVlZG9zOmFwcC1jaGF0Jyk7XG4iLCJNZXRlb3IucHVibGlzaENvbXBvc2l0ZSAnY2hhdF9tZXNzYWdlcycsIChzcGFjZV9pZCwgb2JqZWN0X25hbWUsIHJlY29yZF9pZCwgb3B0aW9ucyktPlxuXHRxdWVyeSA9IHsnc3BhY2UnOiBzcGFjZV9pZCwncmVsYXRlZF90by5vJzogb2JqZWN0X25hbWUsJ3JlbGF0ZWRfdG8uaWRzJzogcmVjb3JkX2lkfVxuXG5cdHNlbGYgPSB0aGlzXG5cblx0c2VsZi51bmJsb2NrKCk7XG5cblx0ZGF0YSA9IHtcblx0XHRmaW5kOiAoKS0+XG5cdFx0XHRzZWxmLnVuYmxvY2soKTtcblxuXHRcdFx0cmV0dXJuIENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcImNoYXRfbWVzc2FnZXNcIikuZmluZChxdWVyeSwgb3B0aW9ucyk7XG5cdH1cblxuXHRkYXRhLmNoaWxkcmVuID0gW11cblxuXHRkYXRhLmNoaWxkcmVuLnB1c2gge1xuXHRcdGZpbmQ6IChwYXJlbnQpIC0+XG5cdFx0XHR0cnlcblx0XHRcdFx0c2VsZi51bmJsb2NrKCk7XG5cdFx0XHRcdGlmIHBhcmVudD8ub3duZXJcblx0XHRcdFx0XHRyZXR1cm4gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwidXNlcnNcIikuZmluZCh7X2lkOiBwYXJlbnQub3duZXJ9LCB7XG5cdFx0XHRcdFx0XHRmaWVsZHM6IHtuYW1lOiAxLCBhdmF0YXJVcmw6IDF9XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRyZXR1cm4gW11cblx0XHRcdGNhdGNoIGVcblx0XHRcdFx0Y29uc29sZS5sb2cocmVmZXJlbmNlX3RvLCBwYXJlbnQsIGUpXG5cdFx0XHRcdHJldHVybiBbXVxuXHR9XG5cblx0cmV0dXJuIGRhdGEiLCJNZXRlb3IucHVibGlzaENvbXBvc2l0ZSgnY2hhdF9tZXNzYWdlcycsIGZ1bmN0aW9uKHNwYWNlX2lkLCBvYmplY3RfbmFtZSwgcmVjb3JkX2lkLCBvcHRpb25zKSB7XG4gIHZhciBkYXRhLCBxdWVyeSwgc2VsZjtcbiAgcXVlcnkgPSB7XG4gICAgJ3NwYWNlJzogc3BhY2VfaWQsXG4gICAgJ3JlbGF0ZWRfdG8ubyc6IG9iamVjdF9uYW1lLFxuICAgICdyZWxhdGVkX3RvLmlkcyc6IHJlY29yZF9pZFxuICB9O1xuICBzZWxmID0gdGhpcztcbiAgc2VsZi51bmJsb2NrKCk7XG4gIGRhdGEgPSB7XG4gICAgZmluZDogZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnVuYmxvY2soKTtcbiAgICAgIHJldHVybiBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJjaGF0X21lc3NhZ2VzXCIpLmZpbmQocXVlcnksIG9wdGlvbnMpO1xuICAgIH1cbiAgfTtcbiAgZGF0YS5jaGlsZHJlbiA9IFtdO1xuICBkYXRhLmNoaWxkcmVuLnB1c2goe1xuICAgIGZpbmQ6IGZ1bmN0aW9uKHBhcmVudCkge1xuICAgICAgdmFyIGU7XG4gICAgICB0cnkge1xuICAgICAgICBzZWxmLnVuYmxvY2soKTtcbiAgICAgICAgaWYgKHBhcmVudCAhPSBudWxsID8gcGFyZW50Lm93bmVyIDogdm9pZCAwKSB7XG4gICAgICAgICAgcmV0dXJuIENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInVzZXJzXCIpLmZpbmQoe1xuICAgICAgICAgICAgX2lkOiBwYXJlbnQub3duZXJcbiAgICAgICAgICB9LCB7XG4gICAgICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgICAgbmFtZTogMSxcbiAgICAgICAgICAgICAgYXZhdGFyVXJsOiAxXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBlID0gZXJyb3I7XG4gICAgICAgIGNvbnNvbGUubG9nKHJlZmVyZW5jZV90bywgcGFyZW50LCBlKTtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIHJldHVybiBkYXRhO1xufSk7XG4iLCJodHRwID0gcmVxdWlyZSAnaHR0cCc7XG5zb2NrZXRfaW8gPSByZXF1aXJlICdzb2NrZXQuaW8nO1xuRmliZXIgPSByZXF1aXJlKCdmaWJlcnMnKTtcblxuaWYgIXByb2Nlc3MuZW52LlNPQ0tFVF9JT19QT1JUXG5cdHJldHVybjtcblxuUE9SVCA9IHByb2Nlc3MuZW52LlNPQ0tFVF9JT19QT1JUIHx8IDgwODA7XG5cblNPQ0tFVFMgPSB7fVxuXG4j5o6l5pS25raI5oGv55qEc29ja2V06ZuG5ZCILGtleeeahOagvOW8j+S4ujoge29iamVjdF9uYW1lfV97cmVjb3JkX2lkfV97dXNlcklkfSwg5YC85Li6c29ja2V0IOWvueixoSwg55uu5YmN5LiN5pSv5oyB5LiA5Liq55So5oi35aSa5Liqc29ja2V05o6l5YWlXG5yZWNlaXZlTWVzc2FnZVNvY2tldHMgPSB7XG5cbn1cblxucmVjZWl2ZVN1YnNjcmlwdGlvblNvY2tldHMgPSB7XG5cbn1cblxuU09DS0VURVZFTlROQU1FUyA9IHtcblx0TkVXTUVTU0FHRTogJ25ldyBtZXNzYWdlJyxcblx0U1RPUE5FV01FU1NBR0U6ICdzdG9wIG1lc3NhZ2UnLFxuXHRSRUNFSVZFTUVTU0FHRTogJ3JlY2VpdmUgbWVzc2FnZScsXG5cdFNVQlNDUklQVElPTlM6ICdzdWJzY3JpcHRpb25zJyxcblx0U1RPUE5FV1NVQlNDUklQVElPTlM6ICdzdG9wIHN1YnNjcmlwdGlvbnMnLFxuXHRSRUNFSVZFU1VCU0NSSVBUSU9OUzogJ3JlY2VpdmUgc3Vic2NyaXB0aW9ucycsXG5cdENPVU5UVU5SRUFEOiAnY291bnQgdW5yZWFkJ1xufTtcblxuY2hlY2tBdXRoVG9rZW4gPSAodXNlcklkLCBhdXRoVG9rZW4pIC0+XG5cdGlmIHVzZXJJZCBhbmQgYXV0aFRva2VuXG5cdFx0aGFzaGVkVG9rZW4gPSBBY2NvdW50cy5faGFzaExvZ2luVG9rZW4oYXV0aFRva2VuKVxuXHRcdHVzZXIgPSB3cmFwQXN5bmNGaW5kT25lKGRiLnVzZXJzLCB7XG5cdFx0XHRcdF9pZDogdXNlcklkLFxuXHRcdFx0XHRcInNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy5oYXNoZWRUb2tlblwiOiBoYXNoZWRUb2tlblxuXHRcdFx0fVxuXHRcdClcblx0XHRpZiB1c2VyXG5cdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdGVsc2Vcblx0XHRcdHJldHVybiBmYWxzZVxuXHRyZXR1cm4gZmFsc2VcblxuXG5nZXRSZWNlaXZlU29ja2V0S2V5ID0gKG9iamVjdF9uYW1lLCByZWNvcmRfaWQsIHVzZXJJZCktPlxuXHRyZXR1cm4gXCIje29iamVjdF9uYW1lfV8je3JlY29yZF9pZH1fI3t1c2VySWR9XCJcblxuc2VuZFVucmVhZEJhZGdlID0gKHNvY2tldCwgc3BhY2VfaWQsIG93bmVyKS0+XG5cdGNvdW50VW5yZWFkID0gMFxuXHRDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJjaGF0X3N1YnNjcmlwdGlvbnNcIikuZmluZCh7XG5cdFx0b3duZXI6IG93bmVyLFxuXHRcdHVucmVhZDogeyRndDogMH1cblx0fSwge2ZpZWxkczoge3VucmVhZDogMX19KS5mb3JFYWNoIChfciktPlxuXHRcdGNvdW50VW5yZWFkICs9IF9yLnVucmVhZFxuXHRzb2NrZXRFbWl0KHNvY2tldCwgU09DS0VURVZFTlROQU1FUy5DT1VOVFVOUkVBRCwgY291bnRVbnJlYWQpO1xuXG4j5L2/55SoRmliZXLnlKjkuo7lpITnkIbplJnor686J01ldGVvciBjb2RlIG11c3QgYWx3YXlzIHJ1biB3aXRoaW4gYSBGaWJlcicgLiDlsJ3or5XkuoZNZXRlb3Ig5o+Q5L6b55qETWV0ZW9yLmJpbmRFbnZpcm9ubWVudFxcTWV0ZW9yLndyYXBBc3luY+mDveS4jeiDveWkhOeQhuatpOmUmeivry5cbnNlbmRVbnJlYWRCYWRnZUZpYmVyID0gKHNvY2tldCwgc3BhY2VfaWQsIG93bmVyKS0+XG5cdEZpYmVyKCgpLT5cblx0XHRzZW5kVW5yZWFkQmFkZ2Uoc29ja2V0LCBzcGFjZV9pZCwgb3duZXIpO1xuXHQpLnJ1bigpO1xuXG4jVE9ETzogRmliZXLov5Tlm57lgLzpl67popjlpITnkIZcbmNoZWNrQXV0aFRva2VuRmliZXIgPSAoc29ja2V0LCB1c2VySWQsIGF1dGhUb2tlbiktPlxuXHRGaWJlcigoKS0+XG5cdFx0Y2hlY2sgPSBTdGVlZG9zLmNoZWNrQXV0aFRva2VuKHVzZXJJZCwgYXV0aFRva2VuKTtcblx0XHRpZighY2hlY2spXG5cdFx0XHRTT0NLRVRTW3NvY2tldC5pZF0gPSBudWxsO1xuXHRcdFx0c29ja2V0LmRpc2Nvbm5lY3QoKTtcblx0KS5ydW4oKTtcblxuc29ja2V0RW1pdCA9IChzb2NrZXQsIGV2ZW50bmFtZSwgZGF0YSkgLT5cblx0aWYgc29ja2V0ICYmIFNPQ0tFVFNbc29ja2V0LmlkXVxuXHRcdHNvY2tldC5lbWl0KGV2ZW50bmFtZSwgZGF0YSlcblxuTWV0ZW9yLnN0YXJ0dXAgKCktPlxuXHRzZXJ2ZXIgPSBodHRwLmNyZWF0ZVNlcnZlcigpO1xuXG5cdGlvID0gc29ja2V0X2lvKHNlcnZlcik7XG5cblx0Y291bnRlciA9IDA7XG5cblx0aW8ub24oJ2Nvbm5lY3Rpb24nLCAoc29ja2V0KS0+XG5cdFx0cXVlcnkgPSBzb2NrZXQucmVxdWVzdC5fcXVlcnk7XG5cdFx0dXNlcklkID0gcXVlcnlbXCJYLVVzZXItSWRcIl1cblx0XHRhdXRoVG9rZW4gPSBxdWVyeVtcIlgtQXV0aC1Ub2tlblwiXVxuXG5cdFx0aWYgIXVzZXJJZCB8fCAhYXV0aFRva2VuXG5cdFx0XHRzb2NrZXQuZGlzY29ubmVjdCgpO1xuXHRcdFx0cmV0dXJuO1xuXG5cdFx0Y2hlY2tBdXRoVG9rZW5GaWJlcihzb2NrZXQsIHVzZXJJZCwgYXV0aFRva2VuKVxuXG5cdFx0U09DS0VUU1tzb2NrZXQuaWRdID0gc29ja2V0O1xuXG5cdFx0I+mUgOavgXNvY2tldFxuXHRcdHNvY2tldC5vbiAnZGlzY29ubmVjdCcsICgpLT5cblx0XHRcdHF1ZXJ5ID0gc29ja2V0LnJlcXVlc3QuX3F1ZXJ5O1xuXHRcdFx0dXNlcklkID0gcXVlcnlbXCJYLVVzZXItSWRcIl1cblx0XHRcdFNPQ0tFVFNbc29ja2V0LmlkXSA9IG51bGw7XG5cblx0XHQj5YGc5q2i5o6l5pS25raI5oGvXG5cdFx0c29ja2V0Lm9uIFNPQ0tFVEVWRU5UTkFNRVMuU1RPUE5FV01FU1NBR0UsIChyZXMpLT5cblx0XHRcdGtleSA9IGdldFJlY2VpdmVTb2NrZXRLZXkocmVzLm9iamVjdF9uYW1lLCByZXMucmVjb3JkX2lkLCBzb2NrZXQucmVxdWVzdC5fcXVlcnlbXCJYLVVzZXItSWRcIl0pXG5cdFx0XHRyZWNlaXZlTWVzc2FnZVNvY2tldHNba2V5XSA9IG51bGw7XG5cblx0XHQj5byA5aeL5o6l5pS25raI5oGvXG5cdFx0c29ja2V0Lm9uIFNPQ0tFVEVWRU5UTkFNRVMuUkVDRUlWRU1FU1NBR0UsIChyZXMpLT5cblx0XHRcdGtleSA9IGdldFJlY2VpdmVTb2NrZXRLZXkocmVzLm9iamVjdF9uYW1lLCByZXMucmVjb3JkX2lkLCBzb2NrZXQucmVxdWVzdC5fcXVlcnlbXCJYLVVzZXItSWRcIl0pXG5cdFx0XHRyZWNlaXZlTWVzc2FnZVNvY2tldHNba2V5XSA9IHNvY2tldDtcblxuXG5cdFx0I+WBnOatouaOpeaUtua2iOaBr1xuXHRcdHNvY2tldC5vbiBTT0NLRVRFVkVOVE5BTUVTLlNUT1BORVdTVUJTQ1JJUFRJT05TLCAocmVzKS0+XG5cdFx0XHRrZXkgPSBnZXRSZWNlaXZlU29ja2V0S2V5KHJlcy5vYmplY3RfbmFtZSwgJycsIHNvY2tldC5yZXF1ZXN0Ll9xdWVyeVtcIlgtVXNlci1JZFwiXSlcblx0XHRcdHJlY2VpdmVTdWJzY3JpcHRpb25Tb2NrZXRzW2tleV0gPSBudWxsO1xuXG5cdFx0I+W8gOWni+aOpeaUtua2iOaBr1xuXHRcdHNvY2tldC5vbiBTT0NLRVRFVkVOVE5BTUVTLlJFQ0VJVkVTVUJTQ1JJUFRJT05TLCAocmVzKS0+XG5cdFx0XHRrZXkgPSBnZXRSZWNlaXZlU29ja2V0S2V5KHJlcy5vYmplY3RfbmFtZSwgJycsIHNvY2tldC5yZXF1ZXN0Ll9xdWVyeVtcIlgtVXNlci1JZFwiXSlcblx0XHRcdHJlY2VpdmVTdWJzY3JpcHRpb25Tb2NrZXRzW2tleV0gPSBzb2NrZXQ7XG5cdFx0XHRzZW5kVW5yZWFkQmFkZ2VGaWJlcihzb2NrZXQsICcnLCBzb2NrZXQucmVxdWVzdC5fcXVlcnlbXCJYLVVzZXItSWRcIl0pO1xuXHQpXG5cblx0dHJ5XG5cdFx0c2VydmVyLmxpc3RlbihQT1JUKTtcblx0XHRjb25zb2xlLmxvZygnY2hhdCBzb2NrZXQuaW8gcG9ydCcsIFBPUlQpO1xuXHRjYXRjaCBlXG5cdFx0Y29uc29sZS5lcnJvcihlKVxuXG5cdCPlj5HpgIHmtojmga9cblx0c2VuZE5ld01lc3NhZ2UgPSAobXNnKSAtPlxuXHRcdGlmIG1zZy5yZWxhdGVkX3RvLm8gJiYgbXNnLnJlbGF0ZWRfdG8uaWRzLmxlbmd0aCA+IDBcblx0XHRcdG9iamVjdF9uYW1lID0gbXNnLnJlbGF0ZWRfdG8ubztcblx0XHRcdHJlY29yZF9pZCA9IG1zZy5yZWxhdGVkX3RvLmlkc1swXTtcblx0XHRcdGRlbGV0ZSBtc2cucmVsYXRlZF90b1xuXHRcdFx0bXNnLm93bmVyID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwidXNlcnNcIikuZmluZE9uZSh7X2lkOiBtc2cub3duZXJ9LCB7XG5cdFx0XHRcdGZpZWxkczoge1xuXHRcdFx0XHRcdF9pZDogMSxcblx0XHRcdFx0XHRuYW1lOiAxLFxuXHRcdFx0XHRcdGF2YXRhclVybDogMVxuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0aWYgb2JqZWN0X25hbWUgPT0gJ2NoYXRfcm9vbXMnXG5cdFx0XHRcdHJvb20gPSBDcmVhdG9yLmdldENvbGxlY3Rpb24ob2JqZWN0X25hbWUpLmZpbmRPbmUoe19pZDogcmVjb3JkX2lkfSwge2ZpZWxkczoge21lbWJlcnM6IDF9fSlcblx0XHRcdFx0aWYgcm9vbVxuXHRcdFx0XHRcdF8uZm9yRWFjaCByb29tPy5tZW1iZXJzLCAobSktPlxuXHRcdFx0XHRcdFx0a2V5ID0gZ2V0UmVjZWl2ZVNvY2tldEtleShvYmplY3RfbmFtZSwgcmVjb3JkX2lkLCBtKVxuXHRcdFx0XHRcdFx0c29ja2V0RW1pdChyZWNlaXZlTWVzc2FnZVNvY2tldHNba2V5XSwgU09DS0VURVZFTlROQU1FUy5ORVdNRVNTQUdFLCBtc2cpXG5cdFx0XHRlbHNlXG5cdFx0XHRcdHBhcnRpY2lwYW50cyA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcImNoYXRfc3Vic2NyaXB0aW9uc1wiKS5maW5kKHsncmVsYXRlZF90by5vJzogb2JqZWN0X25hbWUsICdyZWxhdGVkX3RvLmlkcyc6IFtyZWNvcmRfaWRdfSwge2ZpZWxkczoge293bmVyOiAxfX0pXG5cdFx0XHRcdHBhcnRpY2lwYW50cy5mb3JFYWNoIChwKS0+XG5cdFx0XHRcdFx0a2V5ID0gZ2V0UmVjZWl2ZVNvY2tldEtleShvYmplY3RfbmFtZSwgcmVjb3JkX2lkLCBwLm93bmVyKVxuXHRcdFx0XHRcdHNvY2tldEVtaXQocmVjZWl2ZU1lc3NhZ2VTb2NrZXRzW2tleV0sIFNPQ0tFVEVWRU5UTkFNRVMuTkVXTUVTU0FHRSwgbXNnKVxuXG5cblx0I+iuoumYhWNoYXRfbWVzc2FnZXNcblx0Y2hhdF9tZXNzYWdlc19pbml0ID0gZmFsc2Vcblx0Q3JlYXRvci5nZXRDb2xsZWN0aW9uKFwiY2hhdF9tZXNzYWdlc1wiKS5maW5kKHsnY3JlYXRlZCc6IHskZ3RlOiBuZXcgRGF0ZSgpfX0sIHtcblx0XHRmaWVsZHM6IHtcblx0XHRcdGNyZWF0ZWRfYnk6IDAsXG5cdFx0XHRtb2RpZmllZDogMCxcblx0XHRcdG1vZGlmaWVkX2J5OiAwXG5cdFx0fVxuXHR9KS5vYnNlcnZlIHtcblx0XHRhZGRlZDogKG5ld0RvY3VtZW50KS0+XG5cdFx0XHRpZiBjaGF0X21lc3NhZ2VzX2luaXRcblx0XHRcdFx0c2VuZE5ld01lc3NhZ2UgbmV3RG9jdW1lbnRcblx0XHRjaGFuZ2VkOiAobmV3RG9jdW1lbnQsIG9sZERvY3VtZW50KS0+XG5cdFx0XHRzZW5kTmV3TWVzc2FnZSBuZXdEb2N1bWVudFxuXHRcdHJlbW92ZWQ6IChvbGREb2N1bWVudCktPlxuXHRcdFx0c2VuZE5ld01lc3NhZ2Ugb2xkRG9jdW1lbnRcblx0fVxuXHRjaGF0X21lc3NhZ2VzX2luaXQgPSB0cnVlXG5cblxuXHRzZW5kU3Vic2NyaXB0aW9uID0gKHN1YiktPlxuXHRcdGlmIHN1Yi5yZWxhdGVkX3RvLm8gJiYgc3ViLnJlbGF0ZWRfdG8uaWRzLmxlbmd0aCA+IDBcblx0XHRcdG9iamVjdF9uYW1lID0gc3ViLnJlbGF0ZWRfdG8ubztcblx0XHRcdHJlY29yZF9pZCA9IHN1Yi5yZWxhdGVkX3RvLmlkc1swXTtcblx0XHRcdHN1Yi5tb2RpZmllZF9ieSA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInVzZXJzXCIpLmZpbmRPbmUoe19pZDogc3ViLm1vZGlmaWVkX2J5fSwge1xuXHRcdFx0XHRmaWVsZHM6IHtcblx0XHRcdFx0XHRfaWQ6IDEsXG5cdFx0XHRcdFx0bmFtZTogMSxcblx0XHRcdFx0XHRhdmF0YXJVcmw6IDFcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdGtleSA9IGdldFJlY2VpdmVTb2NrZXRLZXkob2JqZWN0X25hbWUsICcnLCBzdWIub3duZXIpXG5cdFx0XHRpZiByZWNlaXZlU3Vic2NyaXB0aW9uU29ja2V0c1trZXldXG5cdFx0XHRcdGlmIG9iamVjdF9uYW1lID09ICdjaGF0X3Jvb21zJ1xuXHRcdFx0XHRcdHJvb20gPSBDcmVhdG9yLmdldENvbGxlY3Rpb24ob2JqZWN0X25hbWUpLmZpbmRPbmUoe19pZDogcmVjb3JkX2lkfSwge2ZpZWxkczoge21lbWJlcnM6IDF9fSlcblx0XHRcdFx0XHRpZiByb29tXG5cdFx0XHRcdFx0XHRzdWIuX3Jvb20gPSB7XG5cdFx0XHRcdFx0XHRcdF9pZDogcm9vbS5faWQsXG5cdFx0XHRcdFx0XHRcdG1lbWJlcnM6IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInVzZXJzXCIpLmZpbmQoe19pZDogeyRpbjogcm9vbS5tZW1iZXJzIHx8IFtdfX0sIHtcblx0XHRcdFx0XHRcdFx0XHRmaWVsZHM6IHtcblx0XHRcdFx0XHRcdFx0XHRcdF9pZDogMSxcblx0XHRcdFx0XHRcdFx0XHRcdG5hbWU6IDEsXG5cdFx0XHRcdFx0XHRcdFx0XHRhdmF0YXJVcmw6IDFcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH0pLmZldGNoKClcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0c29ja2V0RW1pdChyZWNlaXZlU3Vic2NyaXB0aW9uU29ja2V0c1trZXldLCBTT0NLRVRFVkVOVE5BTUVTLlNVQlNDUklQVElPTlMsIHN1Yilcblx0XHRcdFx0c2VuZFVucmVhZEJhZGdlKHJlY2VpdmVTdWJzY3JpcHRpb25Tb2NrZXRzW2tleV0sICcnLCBzdWIub3duZXIpO1xuXG5cdCPorqLpmIVjaGF0X3N1YnNjcmlwdGlvbnNcblx0Y2hhdF9zdWJzY3JpcHRpb25zX2luaXQgPSBmYWxzZVxuXHRDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJjaGF0X3N1YnNjcmlwdGlvbnNcIikuZmluZCh7XG5cdFx0JG9yOiBbeydjcmVhdGVkJzogeyRndGU6IG5ldyBEYXRlKCl9fSwgJ21vZGlmaWVkJzogeyRndGU6IG5ldyBEYXRlKCl9XVxuXHR9LCB7XG5cdFx0ZmllbGRzOiB7XG5cdFx0XHRjcmVhdGVkX2J5OiAwXG5cdFx0fVxuXHR9KS5vYnNlcnZlIHtcblx0XHRhZGRlZDogKG5ld0RvY3VtZW50KS0+XG5cdFx0XHRpZiBjaGF0X3N1YnNjcmlwdGlvbnNfaW5pdFxuXHRcdFx0XHRzZW5kU3Vic2NyaXB0aW9uIG5ld0RvY3VtZW50XG5cdFx0Y2hhbmdlZDogKG5ld0RvY3VtZW50LCBvbGREb2N1bWVudCktPlxuXHRcdFx0c2VuZFN1YnNjcmlwdGlvbiBuZXdEb2N1bWVudFxuXHRcdHJlbW92ZWQ6IChvbGREb2N1bWVudCktPlxuXHRcdFx0c2VuZFN1YnNjcmlwdGlvbiBvbGREb2N1bWVudFxuXHR9XG5cdGNoYXRfc3Vic2NyaXB0aW9uc19pbml0ID0gdHJ1ZSIsInZhciBGaWJlciwgUE9SVCwgU09DS0VURVZFTlROQU1FUywgU09DS0VUUywgY2hlY2tBdXRoVG9rZW4sIGNoZWNrQXV0aFRva2VuRmliZXIsIGdldFJlY2VpdmVTb2NrZXRLZXksIGh0dHAsIHJlY2VpdmVNZXNzYWdlU29ja2V0cywgcmVjZWl2ZVN1YnNjcmlwdGlvblNvY2tldHMsIHNlbmRVbnJlYWRCYWRnZSwgc2VuZFVucmVhZEJhZGdlRmliZXIsIHNvY2tldEVtaXQsIHNvY2tldF9pbztcblxuaHR0cCA9IHJlcXVpcmUoJ2h0dHAnKTtcblxuc29ja2V0X2lvID0gcmVxdWlyZSgnc29ja2V0LmlvJyk7XG5cbkZpYmVyID0gcmVxdWlyZSgnZmliZXJzJyk7XG5cbmlmICghcHJvY2Vzcy5lbnYuU09DS0VUX0lPX1BPUlQpIHtcbiAgcmV0dXJuO1xufVxuXG5QT1JUID0gcHJvY2Vzcy5lbnYuU09DS0VUX0lPX1BPUlQgfHwgODA4MDtcblxuU09DS0VUUyA9IHt9O1xuXG5yZWNlaXZlTWVzc2FnZVNvY2tldHMgPSB7fTtcblxucmVjZWl2ZVN1YnNjcmlwdGlvblNvY2tldHMgPSB7fTtcblxuU09DS0VURVZFTlROQU1FUyA9IHtcbiAgTkVXTUVTU0FHRTogJ25ldyBtZXNzYWdlJyxcbiAgU1RPUE5FV01FU1NBR0U6ICdzdG9wIG1lc3NhZ2UnLFxuICBSRUNFSVZFTUVTU0FHRTogJ3JlY2VpdmUgbWVzc2FnZScsXG4gIFNVQlNDUklQVElPTlM6ICdzdWJzY3JpcHRpb25zJyxcbiAgU1RPUE5FV1NVQlNDUklQVElPTlM6ICdzdG9wIHN1YnNjcmlwdGlvbnMnLFxuICBSRUNFSVZFU1VCU0NSSVBUSU9OUzogJ3JlY2VpdmUgc3Vic2NyaXB0aW9ucycsXG4gIENPVU5UVU5SRUFEOiAnY291bnQgdW5yZWFkJ1xufTtcblxuY2hlY2tBdXRoVG9rZW4gPSBmdW5jdGlvbih1c2VySWQsIGF1dGhUb2tlbikge1xuICB2YXIgaGFzaGVkVG9rZW4sIHVzZXI7XG4gIGlmICh1c2VySWQgJiYgYXV0aFRva2VuKSB7XG4gICAgaGFzaGVkVG9rZW4gPSBBY2NvdW50cy5faGFzaExvZ2luVG9rZW4oYXV0aFRva2VuKTtcbiAgICB1c2VyID0gd3JhcEFzeW5jRmluZE9uZShkYi51c2Vycywge1xuICAgICAgX2lkOiB1c2VySWQsXG4gICAgICBcInNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy5oYXNoZWRUb2tlblwiOiBoYXNoZWRUb2tlblxuICAgIH0pO1xuICAgIGlmICh1c2VyKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59O1xuXG5nZXRSZWNlaXZlU29ja2V0S2V5ID0gZnVuY3Rpb24ob2JqZWN0X25hbWUsIHJlY29yZF9pZCwgdXNlcklkKSB7XG4gIHJldHVybiBvYmplY3RfbmFtZSArIFwiX1wiICsgcmVjb3JkX2lkICsgXCJfXCIgKyB1c2VySWQ7XG59O1xuXG5zZW5kVW5yZWFkQmFkZ2UgPSBmdW5jdGlvbihzb2NrZXQsIHNwYWNlX2lkLCBvd25lcikge1xuICB2YXIgY291bnRVbnJlYWQ7XG4gIGNvdW50VW5yZWFkID0gMDtcbiAgQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwiY2hhdF9zdWJzY3JpcHRpb25zXCIpLmZpbmQoe1xuICAgIG93bmVyOiBvd25lcixcbiAgICB1bnJlYWQ6IHtcbiAgICAgICRndDogMFxuICAgIH1cbiAgfSwge1xuICAgIGZpZWxkczoge1xuICAgICAgdW5yZWFkOiAxXG4gICAgfVxuICB9KS5mb3JFYWNoKGZ1bmN0aW9uKF9yKSB7XG4gICAgcmV0dXJuIGNvdW50VW5yZWFkICs9IF9yLnVucmVhZDtcbiAgfSk7XG4gIHJldHVybiBzb2NrZXRFbWl0KHNvY2tldCwgU09DS0VURVZFTlROQU1FUy5DT1VOVFVOUkVBRCwgY291bnRVbnJlYWQpO1xufTtcblxuc2VuZFVucmVhZEJhZGdlRmliZXIgPSBmdW5jdGlvbihzb2NrZXQsIHNwYWNlX2lkLCBvd25lcikge1xuICByZXR1cm4gRmliZXIoZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNlbmRVbnJlYWRCYWRnZShzb2NrZXQsIHNwYWNlX2lkLCBvd25lcik7XG4gIH0pLnJ1bigpO1xufTtcblxuY2hlY2tBdXRoVG9rZW5GaWJlciA9IGZ1bmN0aW9uKHNvY2tldCwgdXNlcklkLCBhdXRoVG9rZW4pIHtcbiAgcmV0dXJuIEZpYmVyKGZ1bmN0aW9uKCkge1xuICAgIHZhciBjaGVjaztcbiAgICBjaGVjayA9IFN0ZWVkb3MuY2hlY2tBdXRoVG9rZW4odXNlcklkLCBhdXRoVG9rZW4pO1xuICAgIGlmICghY2hlY2spIHtcbiAgICAgIFNPQ0tFVFNbc29ja2V0LmlkXSA9IG51bGw7XG4gICAgICByZXR1cm4gc29ja2V0LmRpc2Nvbm5lY3QoKTtcbiAgICB9XG4gIH0pLnJ1bigpO1xufTtcblxuc29ja2V0RW1pdCA9IGZ1bmN0aW9uKHNvY2tldCwgZXZlbnRuYW1lLCBkYXRhKSB7XG4gIGlmIChzb2NrZXQgJiYgU09DS0VUU1tzb2NrZXQuaWRdKSB7XG4gICAgcmV0dXJuIHNvY2tldC5lbWl0KGV2ZW50bmFtZSwgZGF0YSk7XG4gIH1cbn07XG5cbk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuICB2YXIgY2hhdF9tZXNzYWdlc19pbml0LCBjaGF0X3N1YnNjcmlwdGlvbnNfaW5pdCwgY291bnRlciwgZSwgaW8sIHNlbmROZXdNZXNzYWdlLCBzZW5kU3Vic2NyaXB0aW9uLCBzZXJ2ZXI7XG4gIHNlcnZlciA9IGh0dHAuY3JlYXRlU2VydmVyKCk7XG4gIGlvID0gc29ja2V0X2lvKHNlcnZlcik7XG4gIGNvdW50ZXIgPSAwO1xuICBpby5vbignY29ubmVjdGlvbicsIGZ1bmN0aW9uKHNvY2tldCkge1xuICAgIHZhciBhdXRoVG9rZW4sIHF1ZXJ5LCB1c2VySWQ7XG4gICAgcXVlcnkgPSBzb2NrZXQucmVxdWVzdC5fcXVlcnk7XG4gICAgdXNlcklkID0gcXVlcnlbXCJYLVVzZXItSWRcIl07XG4gICAgYXV0aFRva2VuID0gcXVlcnlbXCJYLUF1dGgtVG9rZW5cIl07XG4gICAgaWYgKCF1c2VySWQgfHwgIWF1dGhUb2tlbikge1xuICAgICAgc29ja2V0LmRpc2Nvbm5lY3QoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY2hlY2tBdXRoVG9rZW5GaWJlcihzb2NrZXQsIHVzZXJJZCwgYXV0aFRva2VuKTtcbiAgICBTT0NLRVRTW3NvY2tldC5pZF0gPSBzb2NrZXQ7XG4gICAgc29ja2V0Lm9uKCdkaXNjb25uZWN0JywgZnVuY3Rpb24oKSB7XG4gICAgICBxdWVyeSA9IHNvY2tldC5yZXF1ZXN0Ll9xdWVyeTtcbiAgICAgIHVzZXJJZCA9IHF1ZXJ5W1wiWC1Vc2VyLUlkXCJdO1xuICAgICAgcmV0dXJuIFNPQ0tFVFNbc29ja2V0LmlkXSA9IG51bGw7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKFNPQ0tFVEVWRU5UTkFNRVMuU1RPUE5FV01FU1NBR0UsIGZ1bmN0aW9uKHJlcykge1xuICAgICAgdmFyIGtleTtcbiAgICAgIGtleSA9IGdldFJlY2VpdmVTb2NrZXRLZXkocmVzLm9iamVjdF9uYW1lLCByZXMucmVjb3JkX2lkLCBzb2NrZXQucmVxdWVzdC5fcXVlcnlbXCJYLVVzZXItSWRcIl0pO1xuICAgICAgcmV0dXJuIHJlY2VpdmVNZXNzYWdlU29ja2V0c1trZXldID0gbnVsbDtcbiAgICB9KTtcbiAgICBzb2NrZXQub24oU09DS0VURVZFTlROQU1FUy5SRUNFSVZFTUVTU0FHRSwgZnVuY3Rpb24ocmVzKSB7XG4gICAgICB2YXIga2V5O1xuICAgICAga2V5ID0gZ2V0UmVjZWl2ZVNvY2tldEtleShyZXMub2JqZWN0X25hbWUsIHJlcy5yZWNvcmRfaWQsIHNvY2tldC5yZXF1ZXN0Ll9xdWVyeVtcIlgtVXNlci1JZFwiXSk7XG4gICAgICByZXR1cm4gcmVjZWl2ZU1lc3NhZ2VTb2NrZXRzW2tleV0gPSBzb2NrZXQ7XG4gICAgfSk7XG4gICAgc29ja2V0Lm9uKFNPQ0tFVEVWRU5UTkFNRVMuU1RPUE5FV1NVQlNDUklQVElPTlMsIGZ1bmN0aW9uKHJlcykge1xuICAgICAgdmFyIGtleTtcbiAgICAgIGtleSA9IGdldFJlY2VpdmVTb2NrZXRLZXkocmVzLm9iamVjdF9uYW1lLCAnJywgc29ja2V0LnJlcXVlc3QuX3F1ZXJ5W1wiWC1Vc2VyLUlkXCJdKTtcbiAgICAgIHJldHVybiByZWNlaXZlU3Vic2NyaXB0aW9uU29ja2V0c1trZXldID0gbnVsbDtcbiAgICB9KTtcbiAgICByZXR1cm4gc29ja2V0Lm9uKFNPQ0tFVEVWRU5UTkFNRVMuUkVDRUlWRVNVQlNDUklQVElPTlMsIGZ1bmN0aW9uKHJlcykge1xuICAgICAgdmFyIGtleTtcbiAgICAgIGtleSA9IGdldFJlY2VpdmVTb2NrZXRLZXkocmVzLm9iamVjdF9uYW1lLCAnJywgc29ja2V0LnJlcXVlc3QuX3F1ZXJ5W1wiWC1Vc2VyLUlkXCJdKTtcbiAgICAgIHJlY2VpdmVTdWJzY3JpcHRpb25Tb2NrZXRzW2tleV0gPSBzb2NrZXQ7XG4gICAgICByZXR1cm4gc2VuZFVucmVhZEJhZGdlRmliZXIoc29ja2V0LCAnJywgc29ja2V0LnJlcXVlc3QuX3F1ZXJ5W1wiWC1Vc2VyLUlkXCJdKTtcbiAgICB9KTtcbiAgfSk7XG4gIHRyeSB7XG4gICAgc2VydmVyLmxpc3RlbihQT1JUKTtcbiAgICBjb25zb2xlLmxvZygnY2hhdCBzb2NrZXQuaW8gcG9ydCcsIFBPUlQpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGUgPSBlcnJvcjtcbiAgICBjb25zb2xlLmVycm9yKGUpO1xuICB9XG4gIHNlbmROZXdNZXNzYWdlID0gZnVuY3Rpb24obXNnKSB7XG4gICAgdmFyIG9iamVjdF9uYW1lLCBwYXJ0aWNpcGFudHMsIHJlY29yZF9pZCwgcm9vbTtcbiAgICBpZiAobXNnLnJlbGF0ZWRfdG8ubyAmJiBtc2cucmVsYXRlZF90by5pZHMubGVuZ3RoID4gMCkge1xuICAgICAgb2JqZWN0X25hbWUgPSBtc2cucmVsYXRlZF90by5vO1xuICAgICAgcmVjb3JkX2lkID0gbXNnLnJlbGF0ZWRfdG8uaWRzWzBdO1xuICAgICAgZGVsZXRlIG1zZy5yZWxhdGVkX3RvO1xuICAgICAgbXNnLm93bmVyID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwidXNlcnNcIikuZmluZE9uZSh7XG4gICAgICAgIF9pZDogbXNnLm93bmVyXG4gICAgICB9LCB7XG4gICAgICAgIGZpZWxkczoge1xuICAgICAgICAgIF9pZDogMSxcbiAgICAgICAgICBuYW1lOiAxLFxuICAgICAgICAgIGF2YXRhclVybDogMVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGlmIChvYmplY3RfbmFtZSA9PT0gJ2NoYXRfcm9vbXMnKSB7XG4gICAgICAgIHJvb20gPSBDcmVhdG9yLmdldENvbGxlY3Rpb24ob2JqZWN0X25hbWUpLmZpbmRPbmUoe1xuICAgICAgICAgIF9pZDogcmVjb3JkX2lkXG4gICAgICAgIH0sIHtcbiAgICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgIG1lbWJlcnM6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAocm9vbSkge1xuICAgICAgICAgIHJldHVybiBfLmZvckVhY2gocm9vbSAhPSBudWxsID8gcm9vbS5tZW1iZXJzIDogdm9pZCAwLCBmdW5jdGlvbihtKSB7XG4gICAgICAgICAgICB2YXIga2V5O1xuICAgICAgICAgICAga2V5ID0gZ2V0UmVjZWl2ZVNvY2tldEtleShvYmplY3RfbmFtZSwgcmVjb3JkX2lkLCBtKTtcbiAgICAgICAgICAgIHJldHVybiBzb2NrZXRFbWl0KHJlY2VpdmVNZXNzYWdlU29ja2V0c1trZXldLCBTT0NLRVRFVkVOVE5BTUVTLk5FV01FU1NBR0UsIG1zZyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcnRpY2lwYW50cyA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcImNoYXRfc3Vic2NyaXB0aW9uc1wiKS5maW5kKHtcbiAgICAgICAgICAncmVsYXRlZF90by5vJzogb2JqZWN0X25hbWUsXG4gICAgICAgICAgJ3JlbGF0ZWRfdG8uaWRzJzogW3JlY29yZF9pZF1cbiAgICAgICAgfSwge1xuICAgICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgb3duZXI6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcGFydGljaXBhbnRzLmZvckVhY2goZnVuY3Rpb24ocCkge1xuICAgICAgICAgIHZhciBrZXk7XG4gICAgICAgICAga2V5ID0gZ2V0UmVjZWl2ZVNvY2tldEtleShvYmplY3RfbmFtZSwgcmVjb3JkX2lkLCBwLm93bmVyKTtcbiAgICAgICAgICByZXR1cm4gc29ja2V0RW1pdChyZWNlaXZlTWVzc2FnZVNvY2tldHNba2V5XSwgU09DS0VURVZFTlROQU1FUy5ORVdNRVNTQUdFLCBtc2cpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIGNoYXRfbWVzc2FnZXNfaW5pdCA9IGZhbHNlO1xuICBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJjaGF0X21lc3NhZ2VzXCIpLmZpbmQoe1xuICAgICdjcmVhdGVkJzoge1xuICAgICAgJGd0ZTogbmV3IERhdGUoKVxuICAgIH1cbiAgfSwge1xuICAgIGZpZWxkczoge1xuICAgICAgY3JlYXRlZF9ieTogMCxcbiAgICAgIG1vZGlmaWVkOiAwLFxuICAgICAgbW9kaWZpZWRfYnk6IDBcbiAgICB9XG4gIH0pLm9ic2VydmUoe1xuICAgIGFkZGVkOiBmdW5jdGlvbihuZXdEb2N1bWVudCkge1xuICAgICAgaWYgKGNoYXRfbWVzc2FnZXNfaW5pdCkge1xuICAgICAgICByZXR1cm4gc2VuZE5ld01lc3NhZ2UobmV3RG9jdW1lbnQpO1xuICAgICAgfVxuICAgIH0sXG4gICAgY2hhbmdlZDogZnVuY3Rpb24obmV3RG9jdW1lbnQsIG9sZERvY3VtZW50KSB7XG4gICAgICByZXR1cm4gc2VuZE5ld01lc3NhZ2UobmV3RG9jdW1lbnQpO1xuICAgIH0sXG4gICAgcmVtb3ZlZDogZnVuY3Rpb24ob2xkRG9jdW1lbnQpIHtcbiAgICAgIHJldHVybiBzZW5kTmV3TWVzc2FnZShvbGREb2N1bWVudCk7XG4gICAgfVxuICB9KTtcbiAgY2hhdF9tZXNzYWdlc19pbml0ID0gdHJ1ZTtcbiAgc2VuZFN1YnNjcmlwdGlvbiA9IGZ1bmN0aW9uKHN1Yikge1xuICAgIHZhciBrZXksIG9iamVjdF9uYW1lLCByZWNvcmRfaWQsIHJvb207XG4gICAgaWYgKHN1Yi5yZWxhdGVkX3RvLm8gJiYgc3ViLnJlbGF0ZWRfdG8uaWRzLmxlbmd0aCA+IDApIHtcbiAgICAgIG9iamVjdF9uYW1lID0gc3ViLnJlbGF0ZWRfdG8ubztcbiAgICAgIHJlY29yZF9pZCA9IHN1Yi5yZWxhdGVkX3RvLmlkc1swXTtcbiAgICAgIHN1Yi5tb2RpZmllZF9ieSA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInVzZXJzXCIpLmZpbmRPbmUoe1xuICAgICAgICBfaWQ6IHN1Yi5tb2RpZmllZF9ieVxuICAgICAgfSwge1xuICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICBfaWQ6IDEsXG4gICAgICAgICAgbmFtZTogMSxcbiAgICAgICAgICBhdmF0YXJVcmw6IDFcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBrZXkgPSBnZXRSZWNlaXZlU29ja2V0S2V5KG9iamVjdF9uYW1lLCAnJywgc3ViLm93bmVyKTtcbiAgICAgIGlmIChyZWNlaXZlU3Vic2NyaXB0aW9uU29ja2V0c1trZXldKSB7XG4gICAgICAgIGlmIChvYmplY3RfbmFtZSA9PT0gJ2NoYXRfcm9vbXMnKSB7XG4gICAgICAgICAgcm9vbSA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihvYmplY3RfbmFtZSkuZmluZE9uZSh7XG4gICAgICAgICAgICBfaWQ6IHJlY29yZF9pZFxuICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgICBtZW1iZXJzOiAxXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaWYgKHJvb20pIHtcbiAgICAgICAgICAgIHN1Yi5fcm9vbSA9IHtcbiAgICAgICAgICAgICAgX2lkOiByb29tLl9pZCxcbiAgICAgICAgICAgICAgbWVtYmVyczogQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwidXNlcnNcIikuZmluZCh7XG4gICAgICAgICAgICAgICAgX2lkOiB7XG4gICAgICAgICAgICAgICAgICAkaW46IHJvb20ubWVtYmVycyB8fCBbXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgICAgICAgX2lkOiAxLFxuICAgICAgICAgICAgICAgICAgbmFtZTogMSxcbiAgICAgICAgICAgICAgICAgIGF2YXRhclVybDogMVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSkuZmV0Y2goKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc29ja2V0RW1pdChyZWNlaXZlU3Vic2NyaXB0aW9uU29ja2V0c1trZXldLCBTT0NLRVRFVkVOVE5BTUVTLlNVQlNDUklQVElPTlMsIHN1Yik7XG4gICAgICAgIHJldHVybiBzZW5kVW5yZWFkQmFkZ2UocmVjZWl2ZVN1YnNjcmlwdGlvblNvY2tldHNba2V5XSwgJycsIHN1Yi5vd25lcik7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBjaGF0X3N1YnNjcmlwdGlvbnNfaW5pdCA9IGZhbHNlO1xuICBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJjaGF0X3N1YnNjcmlwdGlvbnNcIikuZmluZCh7XG4gICAgJG9yOiBbXG4gICAgICB7XG4gICAgICAgICdjcmVhdGVkJzoge1xuICAgICAgICAgICRndGU6IG5ldyBEYXRlKClcbiAgICAgICAgfVxuICAgICAgfSwge1xuICAgICAgICAnbW9kaWZpZWQnOiB7XG4gICAgICAgICAgJGd0ZTogbmV3IERhdGUoKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgXVxuICB9LCB7XG4gICAgZmllbGRzOiB7XG4gICAgICBjcmVhdGVkX2J5OiAwXG4gICAgfVxuICB9KS5vYnNlcnZlKHtcbiAgICBhZGRlZDogZnVuY3Rpb24obmV3RG9jdW1lbnQpIHtcbiAgICAgIGlmIChjaGF0X3N1YnNjcmlwdGlvbnNfaW5pdCkge1xuICAgICAgICByZXR1cm4gc2VuZFN1YnNjcmlwdGlvbihuZXdEb2N1bWVudCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBjaGFuZ2VkOiBmdW5jdGlvbihuZXdEb2N1bWVudCwgb2xkRG9jdW1lbnQpIHtcbiAgICAgIHJldHVybiBzZW5kU3Vic2NyaXB0aW9uKG5ld0RvY3VtZW50KTtcbiAgICB9LFxuICAgIHJlbW92ZWQ6IGZ1bmN0aW9uKG9sZERvY3VtZW50KSB7XG4gICAgICByZXR1cm4gc2VuZFN1YnNjcmlwdGlvbihvbGREb2N1bWVudCk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIGNoYXRfc3Vic2NyaXB0aW9uc19pbml0ID0gdHJ1ZTtcbn0pO1xuIl19
