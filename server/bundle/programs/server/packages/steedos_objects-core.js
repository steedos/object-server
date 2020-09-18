(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var ReactiveDict = Package['reactive-dict'].ReactiveDict;
var Random = Package.random.Random;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var check = Package.check.check;
var Match = Package.check.Match;
var DDPRateLimiter = Package['ddp-rate-limiter'].DDPRateLimiter;
var _ = Package.underscore._;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema;
var MongoObject = Package['aldeed:simple-schema'].MongoObject;
var moment = Package['momentjs:moment'].moment;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;
var _i18n = Package['universe:i18n']._i18n;
var i18n = Package['universe:i18n'].i18n;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var FS = Package['steedos:cfs-base-package'].FS;

/* Package-scope variables */
var __coffeescriptShare;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:objects-core":{"i18n.coffee":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/steedos_objects-core/i18n.coffee                                                                 //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var i18n = void 0;
module.watch(require("meteor/universe:i18n"), {
  "default": function (v) {
    i18n = v;
  }
}, 0);
var I18n, absoluteUrl, getBrowserLocale;
I18n = require('@steedos/i18n');
this.i18n = i18n;
this.t = I18n.t;
this.tr = t;
this.trl = t;

absoluteUrl = function (url) {
  var e, root_url;

  if (url) {
    url = url.replace(/^\//, "");
  }

  if (Meteor.isCordova) {
    return Meteor.absoluteUrl(url);
  } else {
    if (Meteor.isClient) {
      try {
        root_url = new URL(Meteor.absoluteUrl());

        if (url) {
          return root_url.pathname + url;
        } else {
          return root_url.pathname;
        }
      } catch (error) {
        e = error;
        return Meteor.absoluteUrl(url);
      }
    } else {
      return Meteor.absoluteUrl(url);
    }
  }
};

i18n.setOptions({
  purify: null,
  defaultLocale: 'zh-CN',
  hostUrl: absoluteUrl()
});

if (typeof TAPi18n !== "undefined" && TAPi18n !== null) {
  TAPi18n.__original = TAPi18n.__;

  TAPi18n.__ = function (key, options, locale) {
    var translated;
    translated = t(key, options, locale);

    if (translated !== key) {
      return translated;
    }

    return TAPi18n.__original(key, options, locale);
  };

  TAPi18n._getLanguageFilePath = function (lang_tag) {
    var path;
    path = this.conf.cdn_path != null ? this.conf.cdn_path : this.conf.i18n_files_route;
    path = path.replace(/\/$/, "");

    if (path[0] === "/") {
      path = absoluteUrl().replace(/\/+$/, "") + path;
    }

    return path + "/" + lang_tag + ".json";
  };
}

if (Meteor.isClient) {
  getBrowserLocale = function () {
    var l, locale;
    l = window.navigator.userLanguage || window.navigator.language || 'en';

    if (l.indexOf("zh") >= 0) {
      locale = "zh-cn";
    } else {
      locale = "en-us";
    }

    return locale;
  };

  SimpleSchema.prototype.i18n = function (prefix) {};

  Template.registerHelper('_', function (key, args) {
    return TAPi18n.__(key, args);
  });
  Meteor.startup(function () {
    var userLastLocale;
    Template.registerHelper('_', function (key, args) {
      return TAPi18n.__(key, args);
    });
    Session.set("steedos-locale", getBrowserLocale());
    Tracker.autorun(function () {
      if (Session.get("steedos-locale") !== "en-us") {
        if (typeof TAPi18n !== "undefined" && TAPi18n !== null) {
          TAPi18n.setLanguage("zh-CN");
        }

        I18n.changeLanguage("zh-CN", {
          rootUrl: Steedos.absoluteUrl()
        });
        i18n.setLocale("zh-CN");
        moment.locale("zh-cn");
        return require("moment").locale("zh-cn");
      } else {
        if (typeof TAPi18n !== "undefined" && TAPi18n !== null) {
          TAPi18n.setLanguage("en");
        }

        I18n.changeLanguage("en", {
          rootUrl: Steedos.absoluteUrl()
        });
        i18n.setLocale("en");
        moment.locale("en");
        return require("moment").locale("en");
      }
    });
    userLastLocale = null;
    Tracker.autorun(function () {
      Session.set("steedos-locale", "zh-CN");
      return userLastLocale = Meteor.user() ? Meteor.user().locale ? (Session.set("steedos-locale", Meteor.user().locale), userLastLocale && userLastLocale !== Meteor.user().locale ? window.location.reload(true) : void 0, userLastLocale = Meteor.user().locale) : void 0 : void 0;
    });
    return i18n.onChangeLocale(function (newLocale) {
      $.extend(true, $.fn.dataTable.defaults, {
        language: {
          "decimal": t("dataTables.decimal"),
          "emptyTable": t("dataTables.emptyTable"),
          "info": t("dataTables.info"),
          "infoEmpty": t("dataTables.infoEmpty"),
          "infoFiltered": t("dataTables.infoFiltered"),
          "infoPostFix": t("dataTables.infoPostFix"),
          "thousands": t("dataTables.thousands"),
          "lengthMenu": t("dataTables.lengthMenu"),
          "loadingRecords": t("dataTables.loadingRecords"),
          "processing": t("dataTables.processing"),
          "search": t("dataTables.search"),
          "zeroRecords": t("dataTables.zeroRecords"),
          "paginate": {
            "first": t("dataTables.paginate.first"),
            "last": t("dataTables.paginate.last"),
            "next": t("dataTables.paginate.next"),
            "previous": t("dataTables.paginate.previous")
          },
          "aria": {
            "sortAscending": t("dataTables.aria.sortAscending"),
            "sortDescending": t("dataTables.aria.sortDescending")
          }
        }
      });
      return _.each(Tabular.tablesByName, function (table) {
        return _.each(table.options.columns, function (column) {
          if (!column.data || column.data === "_id") {
            return;
          }

          column.sTitle = t("" + table.collection._name + "_" + column.data.replace(/\./g, "_"));

          if (!table.options.language) {
            table.options.language = {};
          }

          table.options.language.zeroRecords = t("dataTables.zero") + t(table.collection._name);
        });
      });
    });
  });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cfs":{"cfs.coffee":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/steedos_objects-core/cfs/cfs.coffee                                                              //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
this.cfs = {};
Meteor.startup(function () {
  return FS.HTTP.setBaseUrl("/api");
});

cfs.getContentType = function (filename) {
  var _exp;

  _exp = filename.split('.').pop().toLowerCase();

  if ('.' + _exp === '.au') {
    return 'audio/basic';
  } else if ('.' + _exp === '.avi') {
    return 'video/x-msvideo';
  } else if ('.' + _exp === '.bmp') {
    return 'image/bmp';
  } else if ('.' + _exp === '.bz2') {
    return 'application/x-bzip2';
  } else if ('.' + _exp === '.css') {
    return 'text/css';
  } else if ('.' + _exp === '.dtd') {
    return 'application/octet-stream';
  } else if ('.' + _exp === '.doc') {
    return 'application/msword';
  } else if ('.' + _exp === '.docx') {
    return 'application/msword';
  } else if ('.' + _exp === '.dotx') {
    return 'application/octet-stream';
  } else if ('.' + _exp === '.es') {
    return 'application/octet-stream';
  } else if ('.' + _exp === '.exe') {
    return 'application/octet-stream';
  } else if ('.' + _exp === '.gif') {
    return 'image/gif';
  } else if ('.' + _exp === '.gz') {
    return 'application/x-gzip';
  } else if ('.' + _exp === '.hqx') {
    return 'application/mac-binhex40';
  } else if ('.' + _exp === '.html') {
    return 'text/html';
  } else if ('.' + _exp === '.jar') {
    return 'application/x-java-archive';
  } else if ('.' + _exp === '.jpg' || '.' + _exp === '.jpeg') {
    return 'image/jpeg';
  } else if ('.' + _exp === '.js') {
    return 'application/x-javascript';
  } else if ('.' + _exp === '.jsp') {
    return 'application/octet-stream';
  } else if ('.' + _exp === '.midi') {
    return 'audio/midi';
  } else if ('.' + _exp === '.mp3') {
    return 'audio/mpeg';
  } else if ('.' + _exp === '.mpeg') {
    return 'video/mpeg';
  } else if ('.' + _exp === '.ogg') {
    return 'application/ogg';
  } else if ('.' + _exp === '.pdf') {
    return 'application/pdf';
  } else if ('.' + _exp === '.pl') {
    return 'application/octet-stream';
  } else if ('.' + _exp === '.png') {
    return 'image/png';
  } else if ('.' + _exp === '.potx') {
    return 'application/octet-stream';
  } else if ('.' + _exp === '.ppsx') {
    return 'application/octet-stream';
  } else if ('.' + _exp === '.ppt') {
    return 'application/vnd.ms-powerpoint';
  } else if ('.' + _exp === '.pptx') {
    return 'application/vnd.ms-powerpoint';
  } else if ('.' + _exp === '.ps') {
    return 'application/postscript';
  } else if ('.' + _exp === '.qt') {
    return 'video/quicktime';
  } else if ('.' + _exp === '.ra') {
    return 'audio/x-pn-realaudio';
  } else if ('.' + _exp === '.ram') {
    return 'audio/x-pn-realaudio';
  } else if ('.' + _exp === '.rdf') {
    return 'application/octet-stream';
  } else if ('.' + _exp === '.rtf') {
    return 'text/rtf';
  } else if ('.' + _exp === '.sgml') {
    return 'text/sgml';
  } else if ('.' + _exp === '.sit') {
    return 'application/x-stuffit';
  } else if ('.' + _exp === '.sldx') {
    return 'application/octet-stream';
  } else if ('.' + _exp === '.svg') {
    return 'image/svg+xml';
  } else if ('.' + _exp === '.swf') {
    return 'application/x-shockwave-flash';
  } else if ('.' + _exp === '.tar.gz') {
    return 'application/x-gzip';
  } else if ('.' + _exp === '.tgz') {
    return 'application/x-compressed';
  } else if ('.' + _exp === '.tiff') {
    return 'image/tiff';
  } else if ('.' + _exp === '.tsv') {
    return 'text/tab-separated-values';
  } else if ('.' + _exp === '.txt') {
    return 'text/plain';
  } else if ('.' + _exp === '.wav') {
    return 'audio/x-wav';
  } else if ('.' + _exp === '.xlam') {
    return 'application/octet-stream';
  } else if ('.' + _exp === '.xls') {
    return 'application/vnd.ms-excel';
  } else if ('.' + _exp === '.xlsb') {
    return 'application/octet-stream';
  } else if ('.' + _exp === '.xlsx') {
    return 'application/vnd.ms-excel';
  } else if ('.' + _exp === '.xltx') {
    return 'application/octet-stream';
  } else if ('.' + _exp === '.xml') {
    return 'text/xml';
  } else if ('.' + _exp === '.zip') {
    return 'application/zip';
  } else {
    return 'application/octet-stream';
  }
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cfs_fix.coffee":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/steedos_objects-core/cfs/cfs_fix.coffee                                                          //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
FS.StorageAdapter.prototype.on('error', function (storeName, error, fileObj) {
  console.error("FS.StorageAdapter emit error");
  console.error(error);
  console.error(fileObj);
  return console.error(storeName);
});
FS.Collection.prototype.on('error', function (error, fileObj, storeName) {
  console.error("FS.Collection emit error");
  console.error(error);
  console.error(fileObj);
  return console.error(storeName);
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"stores.coffee":function(require){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/steedos_objects-core/cfs/stores.coffee                                                           //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var stores;
stores = ['avatars', 'audios', 'images', 'videos', 'files'];

_.each(stores, function (store_name) {
  file_store;
  var file_store, ref, ref1;

  if (((ref = Meteor.settings["public"].cfs) != null ? ref.store : void 0) === "OSS") {
    if (Meteor.isClient) {
      file_store = new FS.Store.OSS(store_name);
    } else if (Meteor.isServer) {
      file_store = new FS.Store.OSS(store_name, {
        region: Meteor.settings.cfs.aliyun.region,
        internal: Meteor.settings.cfs.aliyun.internal,
        bucket: Meteor.settings.cfs.aliyun.bucket,
        folder: Meteor.settings.cfs.aliyun.folder,
        accessKeyId: Meteor.settings.cfs.aliyun.accessKeyId,
        secretAccessKey: Meteor.settings.cfs.aliyun.secretAccessKey
      });
    }
  } else if (((ref1 = Meteor.settings["public"].cfs) != null ? ref1.store : void 0) === "S3") {
    if (Meteor.isClient) {
      file_store = new FS.Store.S3(store_name);
    } else if (Meteor.isServer) {
      file_store = new FS.Store.S3(store_name, {
        region: Meteor.settings.cfs.aws.region,
        bucket: Meteor.settings.cfs.aws.bucket,
        folder: Meteor.settings.cfs.aws.folder,
        accessKeyId: Meteor.settings.cfs.aws.accessKeyId,
        secretAccessKey: Meteor.settings.cfs.aws.secretAccessKey
      });
    }
  } else {
    if (Meteor.isClient) {
      file_store = new FS.Store.FileSystem(store_name);
    } else if (Meteor.isServer) {
      file_store = new FS.Store.FileSystem(store_name, {
        path: require('path').join(Creator.steedosStorageDir, "files/" + store_name),
        fileKeyMaker: function (fileObj) {
          var absolutePath, filename, filenameInStore, mkdirp, month, now, path, pathname, store, year;
          store = fileObj && fileObj._getInfo(store_name);

          if (store && store.key) {
            return store.key;
          }

          filename = fileObj.name();
          filenameInStore = fileObj.name({
            store: store_name
          });
          now = new Date();
          year = now.getFullYear();
          month = now.getMonth() + 1;
          path = require('path');
          mkdirp = require('mkdirp');
          pathname = path.join(Creator.steedosStorageDir, "files/" + store_name + "/" + year + '/' + month);
          absolutePath = path.resolve(pathname);
          mkdirp.sync(absolutePath);
          return year + '/' + month + '/' + fileObj.collectionName + '-' + fileObj._id + '-' + (filenameInStore || filename);
        }
      });
    }
  }

  if (store_name === 'audios') {
    cfs[store_name] = new FS.Collection(store_name, {
      stores: [file_store],
      filter: {
        allow: {
          contentTypes: ['audio/*']
        }
      }
    });
  } else if (store_name === 'images' || store_name === 'avatars') {
    cfs[store_name] = new FS.Collection(store_name, {
      stores: [file_store],
      filter: {
        allow: {
          contentTypes: ['image/*']
        }
      }
    });
  } else if (store_name === 'videos') {
    cfs[store_name] = new FS.Collection(store_name, {
      stores: [file_store],
      filter: {
        allow: {
          contentTypes: ['video/*']
        }
      }
    });
  } else {
    cfs[store_name] = new FS.Collection(store_name, {
      stores: [file_store]
    });
  }

  cfs[store_name].allow({
    insert: function () {
      return true;
    },
    update: function () {
      return true;
    },
    remove: function () {
      return true;
    },
    download: function () {
      return true;
    }
  });

  if (store_name === 'avatars') {
    db[store_name] = cfs[store_name];
    db[store_name].files.before.insert(function (userId, doc) {
      return doc.userId = userId;
    });
  }

  if (store_name === 'files') {
    return db["cfs." + store_name + ".filerecord"] = cfs[store_name].files;
  }
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".coffee"
  ]
});

require("/node_modules/meteor/steedos:objects-core/i18n.coffee");
require("/node_modules/meteor/steedos:objects-core/cfs/cfs.coffee");
require("/node_modules/meteor/steedos:objects-core/cfs/cfs_fix.coffee");
require("/node_modules/meteor/steedos:objects-core/cfs/stores.coffee");

/* Exports */
Package._define("steedos:objects-core");

})();

//# sourceURL=meteor://💻app/packages/steedos_objects-core.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19vYmplY3RzLWNvcmUvaTE4bi5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL2kxOG4uY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX29iamVjdHMtY29yZS9jZnMvY2ZzLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvY2ZzL2Nmcy5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3Nfb2JqZWN0cy1jb3JlL2Nmcy9jZnNfZml4LmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvY2ZzL2Nmc19maXguY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX29iamVjdHMtY29yZS9jZnMvc3RvcmVzLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvY2ZzL3N0b3Jlcy5jb2ZmZWUiXSwibmFtZXMiOlsiaTE4biIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsInYiLCJJMThuIiwiYWJzb2x1dGVVcmwiLCJnZXRCcm93c2VyTG9jYWxlIiwidCIsInRyIiwidHJsIiwidXJsIiwiZSIsInJvb3RfdXJsIiwicmVwbGFjZSIsIk1ldGVvciIsImlzQ29yZG92YSIsImlzQ2xpZW50IiwiVVJMIiwicGF0aG5hbWUiLCJlcnJvciIsInNldE9wdGlvbnMiLCJwdXJpZnkiLCJkZWZhdWx0TG9jYWxlIiwiaG9zdFVybCIsIlRBUGkxOG4iLCJfX29yaWdpbmFsIiwiX18iLCJrZXkiLCJvcHRpb25zIiwibG9jYWxlIiwidHJhbnNsYXRlZCIsIl9nZXRMYW5ndWFnZUZpbGVQYXRoIiwibGFuZ190YWciLCJwYXRoIiwiY29uZiIsImNkbl9wYXRoIiwiaTE4bl9maWxlc19yb3V0ZSIsImwiLCJ3aW5kb3ciLCJuYXZpZ2F0b3IiLCJ1c2VyTGFuZ3VhZ2UiLCJsYW5ndWFnZSIsImluZGV4T2YiLCJTaW1wbGVTY2hlbWEiLCJwcm90b3R5cGUiLCJwcmVmaXgiLCJUZW1wbGF0ZSIsInJlZ2lzdGVySGVscGVyIiwiYXJncyIsInN0YXJ0dXAiLCJ1c2VyTGFzdExvY2FsZSIsIlNlc3Npb24iLCJzZXQiLCJUcmFja2VyIiwiYXV0b3J1biIsImdldCIsInNldExhbmd1YWdlIiwiY2hhbmdlTGFuZ3VhZ2UiLCJyb290VXJsIiwiU3RlZWRvcyIsInNldExvY2FsZSIsIm1vbWVudCIsInVzZXIiLCJsb2NhdGlvbiIsInJlbG9hZCIsIm9uQ2hhbmdlTG9jYWxlIiwibmV3TG9jYWxlIiwiJCIsImV4dGVuZCIsImZuIiwiZGF0YVRhYmxlIiwiZGVmYXVsdHMiLCJfIiwiZWFjaCIsIlRhYnVsYXIiLCJ0YWJsZXNCeU5hbWUiLCJ0YWJsZSIsImNvbHVtbnMiLCJjb2x1bW4iLCJkYXRhIiwic1RpdGxlIiwiY29sbGVjdGlvbiIsIl9uYW1lIiwiemVyb1JlY29yZHMiLCJjZnMiLCJGUyIsIkhUVFAiLCJzZXRCYXNlVXJsIiwiZ2V0Q29udGVudFR5cGUiLCJmaWxlbmFtZSIsIl9leHAiLCJzcGxpdCIsInBvcCIsInRvTG93ZXJDYXNlIiwiU3RvcmFnZUFkYXB0ZXIiLCJvbiIsInN0b3JlTmFtZSIsImZpbGVPYmoiLCJjb25zb2xlIiwiQ29sbGVjdGlvbiIsInN0b3JlcyIsInN0b3JlX25hbWUiLCJmaWxlX3N0b3JlIiwicmVmIiwicmVmMSIsInNldHRpbmdzIiwic3RvcmUiLCJTdG9yZSIsIk9TUyIsImlzU2VydmVyIiwicmVnaW9uIiwiYWxpeXVuIiwiaW50ZXJuYWwiLCJidWNrZXQiLCJmb2xkZXIiLCJhY2Nlc3NLZXlJZCIsInNlY3JldEFjY2Vzc0tleSIsIlMzIiwiYXdzIiwiRmlsZVN5c3RlbSIsImpvaW4iLCJDcmVhdG9yIiwic3RlZWRvc1N0b3JhZ2VEaXIiLCJmaWxlS2V5TWFrZXIiLCJhYnNvbHV0ZVBhdGgiLCJmaWxlbmFtZUluU3RvcmUiLCJta2RpcnAiLCJtb250aCIsIm5vdyIsInllYXIiLCJfZ2V0SW5mbyIsIm5hbWUiLCJEYXRlIiwiZ2V0RnVsbFllYXIiLCJnZXRNb250aCIsInJlc29sdmUiLCJzeW5jIiwiY29sbGVjdGlvbk5hbWUiLCJfaWQiLCJmaWx0ZXIiLCJhbGxvdyIsImNvbnRlbnRUeXBlcyIsImluc2VydCIsInVwZGF0ZSIsInJlbW92ZSIsImRvd25sb2FkIiwiZGIiLCJmaWxlcyIsImJlZm9yZSIsInVzZXJJZCIsImRvYyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBQUEsYUFBQTtBQUFBQyxPQUFBQyxLQUFBLENBQUFDLFFBQUE7QUFBQSx1QkFBQUMsQ0FBQTtBQUFBSixXQUFBSSxDQUFBO0FBQUE7QUFBQTtBQUFBLElBQUFDLElBQUEsRUFBQUMsV0FBQSxFQUFBQyxnQkFBQTtBQUNBRixPQUFPRixRQUFRLGVBQVIsQ0FBUDtBQUNBLEtBQUNILElBQUQsR0FBUUEsSUFBUjtBQUVBLEtBQUNRLENBQUQsR0FBS0gsS0FBS0csQ0FBVjtBQUVBLEtBQUNDLEVBQUQsR0FBTUQsQ0FBTjtBQUVBLEtBQUNFLEdBQUQsR0FBT0YsQ0FBUDs7QUFFQUYsY0FBYyxVQUFDSyxHQUFEO0FBQ2IsTUFBQUMsQ0FBQSxFQUFBQyxRQUFBOztBQUFBLE1BQUdGLEdBQUg7QUFFQ0EsVUFBTUEsSUFBSUcsT0FBSixDQUFZLEtBQVosRUFBa0IsRUFBbEIsQ0FBTjtBQ0tDOztBREpGLE1BQUlDLE9BQU9DLFNBQVg7QUFDQyxXQUFPRCxPQUFPVCxXQUFQLENBQW1CSyxHQUFuQixDQUFQO0FBREQ7QUFHQyxRQUFHSSxPQUFPRSxRQUFWO0FBQ0M7QUFDQ0osbUJBQVcsSUFBSUssR0FBSixDQUFRSCxPQUFPVCxXQUFQLEVBQVIsQ0FBWDs7QUFDQSxZQUFHSyxHQUFIO0FBQ0MsaUJBQU9FLFNBQVNNLFFBQVQsR0FBb0JSLEdBQTNCO0FBREQ7QUFHQyxpQkFBT0UsU0FBU00sUUFBaEI7QUFMRjtBQUFBLGVBQUFDLEtBQUE7QUFNTVIsWUFBQVEsS0FBQTtBQUNMLGVBQU9MLE9BQU9ULFdBQVAsQ0FBbUJLLEdB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UTtBQUNKLGFBQU8sSUFBUDtBQUxKO0FBTUFDLGNBQVU7QUFDTixhQUFPLElBQVA7QUFQSjtBQUFBLEdBREo7O0FBVUEsTUFBRzVDLGVBQWMsU0FBakI7QUFDSTZDLE9BQUc3QyxVQUFILElBQWlCakIsSUFBSWlCLFVBQUosQ0FBakI7QUFDQTZDLE9BQUc3QyxVQUFILEVBQWU4QyxLQUFmLENBQXFCQyxNQUFyQixDQUE0Qk4sTUFBNUIsQ0FBbUMsVUFBQ08sTUFBRCxFQUFTQyxHQUFUO0FDVXJDLGFEVE1BLElBQUlELE1BQUosR0FBYUEsTUNTbkI7QURWRTtBQ1lMOztBRFRDLE1BQUdoRCxlQUFjLE9BQWpCO0FDV0EsV0RWSTZDLEdBQUcsU0FBTzdDLFVBQVAsR0FBa0IsYUFBckIsSUFBcUNqQixJQUFJaUIsVUFBSixFQUFnQjhDLEtDVXpEO0FBQ0Q7QURqSEgsRyIsImZpbGUiOiIvcGFja2FnZXMvc3RlZWRvc19vYmplY3RzLWNvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgaTE4biBmcm9tICdtZXRlb3IvdW5pdmVyc2U6aTE4bic7XHJcbkkxOG4gPSByZXF1aXJlKCdAc3RlZWRvcy9pMThuJyk7XHJcbkBpMThuID0gaTE4bjtcclxuXHJcbkB0ID0gSTE4bi50XHJcblxyXG5AdHIgPSB0XHJcblxyXG5AdHJsID0gdFxyXG5cclxuYWJzb2x1dGVVcmwgPSAodXJsKS0+XHJcblx0aWYgdXJsXHJcblx0XHQjIHVybOS7pVwiL1wi5byA5aS055qE6K+d77yM5Y675o6J5byA5aS055qEXCIvXCJcclxuXHRcdHVybCA9IHVybC5yZXBsYWNlKC9eXFwvLyxcIlwiKVxyXG5cdGlmIChNZXRlb3IuaXNDb3Jkb3ZhKVxyXG5cdFx0cmV0dXJuIE1ldGVvci5hYnNvbHV0ZVVybCh1cmwpO1xyXG5cdGVsc2VcclxuXHRcdGlmIE1ldGVvci5pc0NsaWVudFxyXG5cdFx0XHR0cnlcclxuXHRcdFx0XHRyb290X3VybCA9IG5ldyBVUkwoTWV0ZW9yLmFic29sdXRlVXJsKCkpXHJcblx0XHRcdFx0aWYgdXJsXHJcblx0XHRcdFx0XHRyZXR1cm4gcm9vdF91cmwucGF0aG5hbWUgKyB1cmxcclxuXHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRyZXR1cm4gcm9vdF91cmwucGF0aG5hbWVcclxuXHRcdFx0Y2F0Y2ggZVxyXG5cdFx0XHRcdHJldHVybiBNZXRlb3IuYWJzb2x1dGVVcmwodXJsKVxyXG5cdFx0ZWxzZVxyXG5cdFx0XHRNZXRlb3IuYWJzb2x1dGVVcmwodXJsKVxyXG4jIOmHjeWGmXRhcDppMThu5Ye95pWw77yM5ZCR5ZCO5YW85a65XHJcbmkxOG4uc2V0T3B0aW9uc1xyXG5cdHB1cmlmeTogbnVsbFxyXG5cdGRlZmF1bHRMb2NhbGU6ICd6aC1DTidcclxuXHRob3N0VXJsOiBhYnNvbHV0ZVVybCgpXHJcblxyXG5pZiBUQVBpMThuP1xyXG5cdFRBUGkxOG4uX19vcmlnaW5hbCA9IFRBUGkxOG4uX19cclxuXHJcblx0VEFQaTE4bi5fXyA9IChrZXksIG9wdGlvbnMsIGxvY2FsZSktPlxyXG5cdFx0dHJhbnNsYXRlZCA9IHQoa2V5LCBvcHRpb25zLCBsb2NhbGUpO1xyXG5cdFx0aWYgdHJhbnNsYXRlZCAhPSBrZXlcclxuXHRcdFx0cmV0dXJuIHRyYW5zbGF0ZWRcclxuXHJcblx0XHQjIGkxOG4g57+76K+R5LiN5Ye65p2l77yM5bCd6K+V55SoIHRhcDppMThuIOe/u+ivkSBUT0RPIHJlbW92ZVxyXG5cdFx0cmV0dXJuIFRBUGkxOG4uX19vcmlnaW5hbCBrZXksIG9wdGlvbnMsIGxvY2FsZVxyXG5cclxuXHRUQVBpMThuLl9nZXRMYW5ndWFnZUZpbGVQYXRoID0gKGxhbmdfdGFnKSAtPlxyXG5cclxuXHRcdHBhdGggPSBpZiBALmNvbmYuY2RuX3BhdGg/IHRoZW4gQC5jb25mLmNkbl9wYXRoIGVsc2UgQC5jb25mLmkxOG5fZmlsZXNfcm91dGVcclxuXHRcdHBhdGggPSBwYXRoLnJlcGxhY2UgL1xcLyQvLCBcIlwiXHJcblx0XHRpZiBwYXRoWzBdID09IFwiL1wiXHJcblx0XHRcdHBhdGggPSBhYnNvbHV0ZVVybCgpLnJlcGxhY2UoL1xcLyskLywgXCJcIikgKyBwYXRoXHJcblxyXG5cdFx0cmV0dXJuIFwiI3twYXRofS8je2xhbmdfdGFnfS5qc29uXCJcclxuXHJcbmlmIE1ldGVvci5pc0NsaWVudFxyXG5cdGdldEJyb3dzZXJMb2NhbGUgPSAoKS0+XHJcblx0XHRsID0gd2luZG93Lm5hdmlnYXRvci51c2VyTGFuZ3VhZ2UgfHwgd2luZG93Lm5hdmlnYXRvci5sYW5ndWFnZSB8fCAnZW4nXHJcblx0XHRpZiBsLmluZGV4T2YoXCJ6aFwiKSA+PTBcclxuXHRcdFx0bG9jYWxlID0gXCJ6aC1jblwiXHJcblx0XHRlbHNlXHJcblx0XHRcdGxvY2FsZSA9IFwiZW4tdXNcIlxyXG5cdFx0cmV0dXJuIGxvY2FsZVxyXG5cclxuXHJcblx0IyDlgZznlKjkuJrliqHlr7nosaHnv7vor5Eg5q2k5Ye95pWw5bey5byD55SoXHJcblx0U2ltcGxlU2NoZW1hLnByb3RvdHlwZS5pMThuID0gKHByZWZpeCkgLT5cclxuXHRcdHJldHVyblxyXG5cclxuXHRUZW1wbGF0ZS5yZWdpc3RlckhlbHBlciAnXycsIChrZXksIGFyZ3MpLT5cclxuXHRcdHJldHVybiBUQVBpMThuLl9fKGtleSwgYXJncyk7XHJcblxyXG5cdE1ldGVvci5zdGFydHVwIC0+XHJcblxyXG5cdFx0VGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIgJ18nLCAoa2V5LCBhcmdzKS0+XHJcblx0XHRcdHJldHVybiBUQVBpMThuLl9fKGtleSwgYXJncyk7XHJcblxyXG5cdFx0U2Vzc2lvbi5zZXQoXCJzdGVlZG9zLWxvY2FsZVwiLCBnZXRCcm93c2VyTG9jYWxlKCkpXHJcblxyXG5cdFx0VHJhY2tlci5hdXRvcnVuICgpLT5cclxuXHRcdFx0aWYgU2Vzc2lvbi5nZXQoXCJzdGVlZG9zLWxvY2FsZVwiKSAhPSBcImVuLXVzXCJcclxuXHRcdFx0XHRpZiBUQVBpMThuP1xyXG5cdFx0XHRcdFx0VEFQaTE4bi5zZXRMYW5ndWFnZShcInpoLUNOXCIpXHJcblx0XHRcdFx0STE4bi5jaGFuZ2VMYW5ndWFnZShcInpoLUNOXCIsIHtyb290VXJsOiBTdGVlZG9zLmFic29sdXRlVXJsKCkgfSlcclxuXHRcdFx0XHRpMThuLnNldExvY2FsZShcInpoLUNOXCIpXHJcblx0XHRcdFx0bW9tZW50LmxvY2FsZShcInpoLWNuXCIpXHJcblx0XHRcdFx0cmVxdWlyZShcIm1vbWVudFwiKS5sb2NhbGUoXCJ6aC1jblwiKVxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0aWYgVEFQaTE4bj9cclxuXHRcdFx0XHRcdFRBUGkxOG4uc2V0TGFuZ3VhZ2UoXCJlblwiKVxyXG5cdFx0XHRcdEkxOG4uY2hhbmdlTGFuZ3VhZ2UoXCJlblwiLCB7cm9vdFVybDogU3RlZWRvcy5hYnNvbHV0ZVVybCgpIH0pXHJcblx0XHRcdFx0aTE4bi5zZXRMb2NhbGUoXCJlblwiKVxyXG5cdFx0XHRcdG1vbWVudC5sb2NhbGUoXCJlblwiKVxyXG5cdFx0XHRcdHJlcXVpcmUoXCJtb21lbnRcIikubG9jYWxlKFwiZW5cIilcclxuXHRcdHVzZXJMYXN0TG9jYWxlID0gbnVsbFxyXG5cdFx0VHJhY2tlci5hdXRvcnVuICgpLT5cclxuXHRcdFx0U2Vzc2lvbi5zZXQoXCJzdGVlZG9zLWxvY2FsZVwiLCBcInpoLUNOXCIpXHJcblx0XHRcdHVzZXJMYXN0TG9jYWxlID1cclxuXHRcdFx0aWYgTWV0ZW9yLnVzZXIoKVxyXG5cdFx0XHRcdGlmIE1ldGVvci51c2VyKCkubG9jYWxlXHJcblx0XHRcdFx0XHRTZXNzaW9uLnNldChcInN0ZWVkb3MtbG9jYWxlXCIsIE1ldGVvci51c2VyKCkubG9jYWxlKTtcclxuXHRcdFx0XHRcdGlmIHVzZXJMYXN0TG9jYWxlICYmIHVzZXJMYXN0TG9jYWxlICE9IE1ldGVvci51c2VyKCkubG9jYWxlXHJcblx0XHRcdFx0XHRcdHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQodHJ1ZSk7XHJcblx0XHRcdFx0XHR1c2VyTGFzdExvY2FsZSA9IE1ldGVvci51c2VyKCkubG9jYWxlXHJcblxyXG5cdFx0aTE4bi5vbkNoYW5nZUxvY2FsZSAobmV3TG9jYWxlKS0+XHJcblxyXG5cdFx0XHQkLmV4dGVuZCB0cnVlLCAkLmZuLmRhdGFUYWJsZS5kZWZhdWx0cyxcclxuXHRcdFx0XHRsYW5ndWFnZTpcclxuXHRcdFx0XHRcdFwiZGVjaW1hbFwiOiAgICAgICAgdChcImRhdGFUYWJsZXMuZGVjaW1hbFwiKSxcclxuXHRcdFx0XHRcdFwiZW1wdHlUYWJsZVwiOiAgICAgdChcImRhdGFUYWJsZXMuZW1wdHlUYWJsZVwiKSxcclxuXHRcdFx0XHRcdFwiaW5mb1wiOiAgICAgICAgICAgdChcImRhdGFUYWJsZXMuaW5mb1wiKSxcclxuXHRcdFx0XHRcdFwiaW5mb0VtcHR5XCI6ICAgICAgdChcImRhdGFUYWJsZXMuaW5mb0VtcHR5XCIpLFxyXG5cdFx0XHRcdFx0XCJpbmZvRmlsdGVyZWRcIjogICB0KFwiZGF0YVRhYmxlcy5pbmZvRmlsdGVyZWRcIiksXHJcblx0XHRcdFx0XHRcImluZm9Qb3N0Rml4XCI6ICAgIHQoXCJkYXRhVGFibGVzLmluZm9Qb3N0Rml4XCIpLFxyXG5cdFx0XHRcdFx0XCJ0aG91c2FuZHNcIjogICAgICB0KFwiZGF0YVRhYmxlcy50aG91c2FuZHNcIiksXHJcblx0XHRcdFx0XHRcImxlbmd0aE1lbnVcIjogICAgIHQoXCJkYXRhVGFibGVzLmxlbmd0aE1lbnVcIiksXHJcblx0XHRcdFx0XHRcImxvYWRpbmdSZWNvcmRzXCI6IHQoXCJkYXRhVGFibGVzLmxvYWRpbmdSZWNvcmRzXCIpLFxyXG5cdFx0XHRcdFx0XCJwcm9jZXNzaW5nXCI6ICAgICB0KFwiZGF0YVRhYmxlcy5wcm9jZXNzaW5nXCIpLFxyXG5cdFx0XHRcdFx0XCJzZWFyY2hcIjogICAgICAgICB0KFwiZGF0YVRhYmxlcy5zZWFyY2hcIiksXHJcblx0XHRcdFx0XHRcInplcm9SZWNvcmRzXCI6ICAgIHQoXCJkYXRhVGFibGVzLnplcm9SZWNvcmRzXCIpLFxyXG5cdFx0XHRcdFx0XCJwYWdpbmF0ZVwiOlxyXG5cdFx0XHRcdFx0XHRcImZpcnN0XCI6ICAgICAgdChcImRhdGFUYWJsZXMucGFnaW5hdGUuZmlyc3RcIiksXHJcblx0XHRcdFx0XHRcdFwibGFzdFwiOiAgICAgICB0KFwiZGF0YVRhYmxlcy5wYWdpbmF0ZS5sYXN0XCIpLFxyXG5cdFx0XHRcdFx0XHRcIm5leHRcIjogICAgICAgdChcImRhdGFUYWJsZXMucGFnaW5hdGUubmV4dFwiKSxcclxuXHRcdFx0XHRcdFx0XCJwcmV2aW91c1wiOiAgIHQoXCJkYXRhVGFibGVzLnBhZ2luYXRlLnByZXZpb3VzXCIpXHJcblx0XHRcdFx0XHRcImFyaWFcIjpcclxuXHRcdFx0XHRcdFx0XCJzb3J0QXNjZW5kaW5nXCI6ICB0KFwiZGF0YVRhYmxlcy5hcmlhLnNvcnRBc2NlbmRpbmdcIiksXHJcblx0XHRcdFx0XHRcdFwic29ydERlc2NlbmRpbmdcIjogdChcImRhdGFUYWJsZXMuYXJpYS5zb3J0RGVzY2VuZGluZ1wiKVxyXG5cclxuXHRcdFx0Xy5lYWNoIFRhYnVsYXIudGFibGVzQnlOYW1lLCAodGFibGUpIC0+XHJcblx0XHRcdFx0Xy5lYWNoIHRhYmxlLm9wdGlvbnMuY29sdW1ucywgKGNvbHVtbikgLT5cclxuXHRcdFx0XHRcdGlmICghY29sdW1uLmRhdGEgfHwgY29sdW1uLmRhdGEgPT0gXCJfaWRcIilcclxuXHRcdFx0XHRcdFx0cmV0dXJuXHJcblxyXG5cdFx0XHRcdFx0Y29sdW1uLnNUaXRsZSA9IHQoXCJcIiArIHRhYmxlLmNvbGxlY3Rpb24uX25hbWUgKyBcIl9cIiArIGNvbHVtbi5kYXRhLnJlcGxhY2UoL1xcLi9nLFwiX1wiKSk7XHJcblx0XHRcdFx0XHRpZiAhdGFibGUub3B0aW9ucy5sYW5ndWFnZVxyXG5cdFx0XHRcdFx0XHR0YWJsZS5vcHRpb25zLmxhbmd1YWdlID0ge31cclxuXHRcdFx0XHRcdHRhYmxlLm9wdGlvbnMubGFuZ3VhZ2UuemVyb1JlY29yZHMgPSB0KFwiZGF0YVRhYmxlcy56ZXJvXCIpICsgdCh0YWJsZS5jb2xsZWN0aW9uLl9uYW1lKVxyXG5cdFx0XHRcdFx0cmV0dXJuIFxyXG5cclxuXHJcbiIsInZhciBJMThuLCBhYnNvbHV0ZVVybCwgZ2V0QnJvd3NlckxvY2FsZTtcblxuaW1wb3J0IGkxOG4gZnJvbSAnbWV0ZW9yL3VuaXZlcnNlOmkxOG4nO1xuXG5JMThuID0gcmVxdWlyZSgnQHN0ZWVkb3MvaTE4bicpO1xuXG50aGlzLmkxOG4gPSBpMThuO1xuXG50aGlzLnQgPSBJMThuLnQ7XG5cbnRoaXMudHIgPSB0O1xuXG50aGlzLnRybCA9IHQ7XG5cbmFic29sdXRlVXJsID0gZnVuY3Rpb24odXJsKSB7XG4gIHZhciBlLCByb290X3VybDtcbiAgaWYgKHVybCkge1xuICAgIHVybCA9IHVybC5yZXBsYWNlKC9eXFwvLywgXCJcIik7XG4gIH1cbiAgaWYgKE1ldGVvci5pc0NvcmRvdmEpIHtcbiAgICByZXR1cm4gTWV0ZW9yLmFic29sdXRlVXJsKHVybCk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKE1ldGVvci5pc0NsaWVudCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcm9vdF91cmwgPSBuZXcgVVJMKE1ldGVvci5hYnNvbHV0ZVVybCgpKTtcbiAgICAgICAgaWYgKHVybCkge1xuICAgICAgICAgIHJldHVybiByb290X3VybC5wYXRobmFtZSArIHVybDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gcm9vdF91cmwucGF0aG5hbWU7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGUgPSBlcnJvcjtcbiAgICAgICAgcmV0dXJuIE1ldGVvci5hYnNvbHV0ZVVybCh1cmwpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gTWV0ZW9yLmFic29sdXRlVXJsKHVybCk7XG4gICAgfVxuICB9XG59O1xuXG5pMThuLnNldE9wdGlvbnMoe1xuICBwdXJpZnk6IG51bGwsXG4gIGRlZmF1bHRMb2NhbGU6ICd6aC1DTicsXG4gIGhvc3RVcmw6IGFic29sdXRlVXJsKClcbn0pO1xuXG5pZiAodHlwZW9mIFRBUGkxOG4gIT09IFwidW5kZWZpbmVkXCIgJiYgVEFQaTE4biAhPT0gbnVsbCkge1xuICBUQVBpMThuLl9fb3JpZ2luYWwgPSBUQVBpMThuLl9fO1xuICBUQVBpMThuLl9fID0gZnVuY3Rpb24oa2V5LCBvcHRpb25zLCBsb2NhbGUpIHtcbiAgICB2YXIgdHJhbnNsYXRlZDtcbiAgICB0cmFuc2xhdGVkID0gdChrZXksIG9wdGlvbnMsIGxvY2FsZSk7XG4gICAgaWYgKHRyYW5zbGF0ZWQgIT09IGtleSkge1xuICAgICAgcmV0dXJuIHRyYW5zbGF0ZWQ7XG4gICAgfVxuICAgIHJldHVybiBUQVBpMThuLl9fb3JpZ2luYWwoa2V5LCBvcHRpb25zLCBsb2NhbGUpO1xuICB9O1xuICBUQVBpMThuLl9nZXRMYW5ndWFnZUZpbGVQYXRoID0gZnVuY3Rpb24obGFuZ190YWcpIHtcbiAgICB2YXIgcGF0aDtcbiAgICBwYXRoID0gdGhpcy5jb25mLmNkbl9wYXRoICE9IG51bGwgPyB0aGlzLmNvbmYuY2RuX3BhdGggOiB0aGlzLmNvbmYuaTE4bl9maWxlc19yb3V0ZTtcbiAgICBwYXRoID0gcGF0aC5yZXBsYWNlKC9cXC8kLywgXCJcIik7XG4gICAgaWYgKHBhdGhbMF0gPT09IFwiL1wiKSB7XG4gICAgICBwYXRoID0gYWJzb2x1dGVVcmwoKS5yZXBsYWNlKC9cXC8rJC8sIFwiXCIpICsgcGF0aDtcbiAgICB9XG4gICAgcmV0dXJuIHBhdGggKyBcIi9cIiArIGxhbmdfdGFnICsgXCIuanNvblwiO1xuICB9O1xufVxuXG5pZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG4gIGdldEJyb3dzZXJMb2NhbGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbCwgbG9jYWxlO1xuICAgIGwgPSB3aW5kb3cubmF2aWdhdG9yLnVzZXJMYW5ndWFnZSB8fCB3aW5kb3cubmF2aWdhdG9yLmxhbmd1YWdlIHx8ICdlbic7XG4gICAgaWYgKGwuaW5kZXhPZihcInpoXCIpID49IDApIHtcbiAgICAgIGxvY2FsZSA9IFwiemgtY25cIjtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9jYWxlID0gXCJlbi11c1wiO1xuICAgIH1cbiAgICByZXR1cm4gbG9jYWxlO1xuICB9O1xuICBTaW1wbGVTY2hlbWEucHJvdG90eXBlLmkxOG4gPSBmdW5jdGlvbihwcmVmaXgpIHt9O1xuICBUZW1wbGF0ZS5yZWdpc3RlckhlbHBlcignXycsIGZ1bmN0aW9uKGtleSwgYXJncykge1xuICAgIHJldHVybiBUQVBpMThuLl9fKGtleSwgYXJncyk7XG4gIH0pO1xuICBNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcbiAgICB2YXIgdXNlckxhc3RMb2NhbGU7XG4gICAgVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ18nLCBmdW5jdGlvbihrZXksIGFyZ3MpIHtcbiAgICAgIHJldHVybiBUQVBpMThuLl9fKGtleSwgYXJncyk7XG4gICAgfSk7XG4gICAgU2Vzc2lvbi5zZXQoXCJzdGVlZG9zLWxvY2FsZVwiLCBnZXRCcm93c2VyTG9jYWxlKCkpO1xuICAgIFRyYWNrZXIuYXV0b3J1bihmdW5jdGlvbigpIHtcbiAgICAgIGlmIChTZXNzaW9uLmdldChcInN0ZWVkb3MtbG9jYWxlXCIpICE9PSBcImVuLXVzXCIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBUQVBpMThuICE9PSBcInVuZGVmaW5lZFwiICYmIFRBUGkxOG4gIT09IG51bGwpIHtcbiAgICAgICAgICBUQVBpMThuLnNldExhbmd1YWdlKFwiemgtQ05cIik7XG4gICAgICAgIH1cbiAgICAgICAgSTE4bi5jaGFuZ2VMYW5ndWFnZShcInpoLUNOXCIsIHtcbiAgICAgICAgICByb290VXJsOiBTdGVlZG9zLmFic29sdXRlVXJsKClcbiAgICAgICAgfSk7XG4gICAgICAgIGkxOG4uc2V0TG9jYWxlKFwiemgtQ05cIik7XG4gICAgICAgIG1vbWVudC5sb2NhbGUoXCJ6aC1jblwiKTtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUoXCJtb21lbnRcIikubG9jYWxlKFwiemgtY25cIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodHlwZW9mIFRBUGkxOG4gIT09IFwidW5kZWZpbmVkXCIgJiYgVEFQaTE4biAhPT0gbnVsbCkge1xuICAgICAgICAgIFRBUGkxOG4uc2V0TGFuZ3VhZ2UoXCJlblwiKTtcbiAgICAgICAgfVxuICAgICAgICBJMThuLmNoYW5nZUxhbmd1YWdlKFwiZW5cIiwge1xuICAgICAgICAgIHJvb3RVcmw6IFN0ZWVkb3MuYWJzb2x1dGVVcmwoKVxuICAgICAgICB9KTtcbiAgICAgICAgaTE4bi5zZXRMb2NhbGUoXCJlblwiKTtcbiAgICAgICAgbW9tZW50LmxvY2FsZShcImVuXCIpO1xuICAgICAgICByZXR1cm4gcmVxdWlyZShcIm1vbWVudFwiKS5sb2NhbGUoXCJlblwiKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB1c2VyTGFzdExvY2FsZSA9IG51bGw7XG4gICAgVHJhY2tlci5hdXRvcnVuKGZ1bmN0aW9uKCkge1xuICAgICAgU2Vzc2lvbi5zZXQoXCJzdGVlZG9zLWxvY2FsZVwiLCBcInpoLUNOXCIpO1xuICAgICAgcmV0dXJuIHVzZXJMYXN0TG9jYWxlID0gTWV0ZW9yLnVzZXIoKSA/IE1ldGVvci51c2VyKCkubG9jYWxlID8gKFNlc3Npb24uc2V0KFwic3RlZWRvcy1sb2NhbGVcIiwgTWV0ZW9yLnVzZXIoKS5sb2NhbGUpLCB1c2VyTGFzdExvY2FsZSAmJiB1c2VyTGFzdExvY2FsZSAhPT0gTWV0ZW9yLnVzZXIoKS5sb2NhbGUgPyB3aW5kb3cubG9jYXRpb24ucmVsb2FkKHRydWUpIDogdm9pZCAwLCB1c2VyTGFzdExvY2FsZSA9IE1ldGVvci51c2VyKCkubG9jYWxlKSA6IHZvaWQgMCA6IHZvaWQgMDtcbiAgICB9KTtcbiAgICByZXR1cm4gaTE4bi5vbkNoYW5nZUxvY2FsZShmdW5jdGlvbihuZXdMb2NhbGUpIHtcbiAgICAgICQuZXh0ZW5kKHRydWUsICQuZm4uZGF0YVRhYmxlLmRlZmF1bHRzLCB7XG4gICAgICAgIGxhbmd1YWdlOiB7XG4gICAgICAgICAgXCJkZWNpbWFsXCI6IHQoXCJkYXRhVGFibGVzLmRlY2ltYWxcIiksXG4gICAgICAgICAgXCJlbXB0eVRhYmxlXCI6IHQoXCJkYXRhVGFibGVzLmVtcHR5VGFibGVcIiksXG4gICAgICAgICAgXCJpbmZvXCI6IHQoXCJkYXRhVGFibGVzLmluZm9cIiksXG4gICAgICAgICAgXCJpbmZvRW1wdHlcIjogdChcImRhdGFUYWJsZXMuaW5mb0VtcHR5XCIpLFxuICAgICAgICAgIFwiaW5mb0ZpbHRlcmVkXCI6IHQoXCJkYXRhVGFibGVzLmluZm9GaWx0ZXJlZFwiKSxcbiAgICAgICAgICBcImluZm9Qb3N0Rml4XCI6IHQoXCJkYXRhVGFibGVzLmluZm9Qb3N0Rml4XCIpLFxuICAgICAgICAgIFwidGhvdXNhbmRzXCI6IHQoXCJkYXRhVGFibGVzLnRob3VzYW5kc1wiKSxcbiAgICAgICAgICBcImxlbmd0aE1lbnVcIjogdChcImRhdGFUYWJsZXMubGVuZ3RoTWVudVwiKSxcbiAgICAgICAgICBcImxvYWRpbmdSZWNvcmRzXCI6IHQoXCJkYXRhVGFibGVzLmxvYWRpbmdSZWNvcmRzXCIpLFxuICAgICAgICAgIFwicHJvY2Vzc2luZ1wiOiB0KFwiZGF0YVRhYmxlcy5wcm9jZXNzaW5nXCIpLFxuICAgICAgICAgIFwic2VhcmNoXCI6IHQoXCJkYXRhVGFibGVzLnNlYXJjaFwiKSxcbiAgICAgICAgICBcInplcm9SZWNvcmRzXCI6IHQoXCJkYXRhVGFibGVzLnplcm9SZWNvcmRzXCIpLFxuICAgICAgICAgIFwicGFnaW5hdGVcIjoge1xuICAgICAgICAgICAgXCJmaXJzdFwiOiB0KFwiZGF0YVRhYmxlcy5wYWdpbmF0ZS5maXJzdFwiKSxcbiAgICAgICAgICAgIFwibGFzdFwiOiB0KFwiZGF0YVRhYmxlcy5wYWdpbmF0ZS5sYXN0XCIpLFxuICAgICAgICAgICAgXCJuZXh0XCI6IHQoXCJkYXRhVGFibGVzLnBhZ2luYXRlLm5leHRcIiksXG4gICAgICAgICAgICBcInByZXZpb3VzXCI6IHQoXCJkYXRhVGFibGVzLnBhZ2luYXRlLnByZXZpb3VzXCIpXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImFyaWFcIjoge1xuICAgICAgICAgICAgXCJzb3J0QXNjZW5kaW5nXCI6IHQoXCJkYXRhVGFibGVzLmFyaWEuc29ydEFzY2VuZGluZ1wiKSxcbiAgICAgICAgICAgIFwic29ydERlc2NlbmRpbmdcIjogdChcImRhdGFUYWJsZXMuYXJpYS5zb3J0RGVzY2VuZGluZ1wiKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gXy5lYWNoKFRhYnVsYXIudGFibGVzQnlOYW1lLCBmdW5jdGlvbih0YWJsZSkge1xuICAgICAgICByZXR1cm4gXy5lYWNoKHRhYmxlLm9wdGlvbnMuY29sdW1ucywgZnVuY3Rpb24oY29sdW1uKSB7XG4gICAgICAgICAgaWYgKCFjb2x1bW4uZGF0YSB8fCBjb2x1bW4uZGF0YSA9PT0gXCJfaWRcIikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb2x1bW4uc1RpdGxlID0gdChcIlwiICsgdGFibGUuY29sbGVjdGlvbi5fbmFtZSArIFwiX1wiICsgY29sdW1uLmRhdGEucmVwbGFjZSgvXFwuL2csIFwiX1wiKSk7XG4gICAgICAgICAgaWYgKCF0YWJsZS5vcHRpb25zLmxhbmd1YWdlKSB7XG4gICAgICAgICAgICB0YWJsZS5vcHRpb25zLmxhbmd1YWdlID0ge307XG4gICAgICAgICAgfVxuICAgICAgICAgIHRhYmxlLm9wdGlvbnMubGFuZ3VhZ2UuemVyb1JlY29yZHMgPSB0KFwiZGF0YVRhYmxlcy56ZXJvXCIpICsgdCh0YWJsZS5jb2xsZWN0aW9uLl9uYW1lKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59XG4iLCJAY2ZzID0ge31cclxuXHJcbk1ldGVvci5zdGFydHVwIC0+XHJcbiAgRlMuSFRUUC5zZXRCYXNlVXJsKFwiL2FwaVwiKVxyXG5cclxuXHJcbiMg6YCa6L+H5paH5Lu25omp5bGV5ZCN6I635Y+W5paH5Lu2Y29udGVudFR5cGVcclxuIyBodHRwOi8vcmVmZXJlbmNlLnNpdGVwb2ludC5jb20vaHRtbC9taW1lLXR5cGVzXHJcbiMg5Y+C54WnczPkuIrkvKDpmYTku7blkI7nmoRjb250ZW50VHlwZVxyXG5jZnMuZ2V0Q29udGVudFR5cGUgPSAoZmlsZW5hbWUpIC0+XHJcbiAgICBfZXhwID0gZmlsZW5hbWUuc3BsaXQoJy4nKS5wb3AoKS50b0xvd2VyQ2FzZSgpXHJcbiAgICBpZiAoJy4nICsgX2V4cCA9PSAnLmF1JykgXHJcbiAgICAgIHJldHVybiAnYXVkaW8vYmFzaWMnXHJcbiAgICBlbHNlIGlmICgnLicgKyBfZXhwID09ICcuYXZpJykgXHJcbiAgICAgIHJldHVybiAndmlkZW8veC1tc3ZpZGVvJ1xyXG4gICAgZWxzZSBpZiAoJy4nICsgX2V4cCA9PSAnLmJtcCcpIFxyXG4gICAgICByZXR1cm4gJ2ltYWdlL2JtcCdcclxuICAgIGVsc2UgaWYgKCcuJyArIF9leHAgPT0gJy5iejInKSBcclxuICAgICAgcmV0dXJuICdhcHBsaWNhdGlvbi94LWJ6aXAyJ1xyXG4gICAgZWxzZSBpZiAoJy4nICsgX2V4cCA9PSAnLmNzcycpIFxyXG4gICAgICByZXR1cm4gJ3RleHQvY3NzJ1xyXG4gICAgZWxzZSBpZiAoJy4nICsgX2V4cCA9PSAnLmR0ZCcpIFxyXG4gICAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbSdcclxuICAgIGVsc2UgaWYgKCcuJyArIF9leHAgPT0gJy5kb2MnKSBcclxuICAgICAgcmV0dXJuICdhcHBsaWNhdGlvbi9tc3dvcmQnXHJcbiAgICBlbHNlIGlmICgnLicgKyBfZXhwID09ICcuZG9jeCcpIFxyXG4gICAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL21zd29yZCdcclxuICAgIGVsc2UgaWYgKCcuJyArIF9leHAgPT0gJy5kb3R4JykgXHJcbiAgICAgIHJldHVybiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJ1xyXG4gICAgZWxzZSBpZiAoJy4nICsgX2V4cCA9PSAnLmVzJykgXHJcbiAgICAgIHJldHVybiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJ1xyXG4gICAgZWxzZSBpZiAoJy4nICsgX2V4cCA9PSAnLmV4ZScpIFxyXG4gICAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbSdcclxuICAgIGVsc2UgaWYgKCcuJyArIF9leHAgPT0gJy5naWYnKSBcclxuICAgICAgcmV0dXJuICdpbWFnZS9naWYnXHJcbiAgICBlbHNlIGlmICgnLicgKyBfZXhwID09ICcuZ3onKSBcclxuICAgICAgcmV0dXJuICdhcHBsaWNhdGlvbi94LWd6aXAnXHJcbiAgICBlbHNlIGlmICgnLicgKyBfZXhwID09ICcuaHF4JykgXHJcbiAgICAgIHJldHVybiAnYXBwbGljYXRpb24vbWFjLWJpbmhleDQwJ1xyXG4gICAgZWxzZSBpZiAoJy4nICsgX2V4cCA9PSAnLmh0bWwnKSBcclxuICAgICAgcmV0dXJuICd0ZXh0L2h0bWwnXHJcbiAgICBlbHNlIGlmICgnLicgKyBfZXhwID09ICcuamFyJykgXHJcbiAgICAgIHJldHVybiAnYXBwbGljYXRpb24veC1qYXZhLWFyY2hpdmUnXHJcbiAgICBlbHNlIGlmICgoJy4nICsgX2V4cCA9PSAnLmpwZycpIHx8ICgnLicgKyBfZXhwID09ICcuanBlZycpKSBcclxuICAgICAgcmV0dXJuICdpbWFnZS9qcGVnJ1xyXG4gICAgZWxzZSBpZiAoJy4nICsgX2V4cCA9PSAnLmpzJykgXHJcbiAgICAgIHJldHVybiAnYXBwbGljYXRpb24veC1qYXZhc2NyaXB0J1xyXG4gICAgZWxzZSBpZiAoJy4nICsgX2V4cCA9PSAnLmpzcCcpIFxyXG4gICAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbSdcclxuICAgIGVsc2UgaWYgKCcuJyArIF9leHAgPT0gJy5taWRpJykgXHJcbiAgICAgIHJldHVybiAnYXVkaW8vbWlkaSdcclxuICAgIGVsc2UgaWYgKCcuJyArIF9leHAgPT0gJy5tcDMnKSBcclxuICAgICAgcmV0dXJuICdhdWRpby9tcGVnJ1xyXG4gICAgZWxzZSBpZiAoJy4nICsgX2V4cCA9PSAnLm1wZWcnKSBcclxuICAgICAgcmV0dXJuICd2aWRlby9tcGVnJ1xyXG4gICAgZWxzZSBpZiAoJy4nICsgX2V4cCA9PSAnLm9nZycpIFxyXG4gICAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL29nZydcclxuICAgIGVsc2UgaWYgKCcuJyArIF9leHAgPT0gJy5wZGYnKSBcclxuICAgICAgcmV0dXJuICdhcHBsaWNhdGlvbi9wZGYnXHJcbiAgICBlbHNlIGlmICgnLicgKyBfZXhwID09ICcucGwnKSBcclxuICAgICAgcmV0dXJuICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nXHJcbiAgICBlbHNlIGlmICgnLicgKyBfZXhwID09ICcucG5nJykgXHJcbiAgICAgIHJldHVybiAnaW1hZ2UvcG5nJ1xyXG4gICAgZWxzZSBpZiAoJy4nICsgX2V4cCA9PSAnLnBvdHgnKSBcclxuICAgICAgcmV0dXJuICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nXHJcbiAgICBlbHNlIGlmICgnLicgKyBfZXhwID09ICcucHBzeCcpIFxyXG4gICAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbSdcclxuICAgIGVsc2UgaWYgKCcuJyArIF9leHAgPT0gJy5wcHQnKSBcclxuICAgICAgcmV0dXJuICdhcHBsaWNhdGlvbi92bmQubXMtcG93ZXJwb2ludCdcclxuICAgIGVsc2UgaWYgKCcuJyArIF9leHAgPT0gJy5wcHR4JykgXHJcbiAgICAgIHJldHVybiAnYXBwbGljYXRpb24vdm5kLm1zLXBvd2VycG9pbnQnXHJcbiAgICBlbHNlIGlmICgnLicgKyBfZXhwID09ICcucHMnKSBcclxuICAgICAgcmV0dXJuICdhcHBsaWNhdGlvbi9wb3N0c2NyaXB0J1xyXG4gICAgZWxzZSBpZiAoJy4nICsgX2V4cCA9PSAnLnF0JykgXHJcbiAgICAgIHJldHVybiAndmlkZW8vcXVpY2t0aW1lJ1xyXG4gICAgZWxzZSBpZiAoJy4nICsgX2V4cCA9PSAnLnJhJykgXHJcbiAgICAgIHJldHVybiAnYXVkaW8veC1wbi1yZWFsYXVkaW8nXHJcbiAgICBlbHNlIGlmICgnLicgKyBfZXhwID09ICcucmFtJykgXHJcbiAgICAgIHJldHVybiAnYXVkaW8veC1wbi1yZWFsYXVkaW8nXHJcbiAgICBlbHNlIGlmICgnLicgKyBfZXhwID09ICcucmRmJykgXHJcbiAgICAgIHJldHVybiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJ1xyXG4gICAgZWxzZSBpZiAoJy4nICsgX2V4cCA9PSAnLnJ0ZicpIFxyXG4gICAgICByZXR1cm4gJ3RleHQvcnRmJ1xyXG4gICAgZWxzZSBpZiAoJy4nICsgX2V4cCA9PSAnLnNnbWwnKSBcclxuICAgICAgcmV0dXJuICd0ZXh0L3NnbWwnXHJcbiAgICBlbHNlIGlmICgnLicgKyBfZXhwID09ICcuc2l0JykgXHJcbiAgICAgIHJldHVybiAnYXBwbGljYXRpb24veC1zdHVmZml0J1xyXG4gICAgZWxzZSBpZiAoJy4nICsgX2V4cCA9PSAnLnNsZHgnKSBcclxuICAgICAgcmV0dXJuICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nXHJcbiAgICBlbHNlIGlmICgnLicgKyBfZXhwID09ICcuc3ZnJykgXHJcbiAgICAgIHJldHVybiAnaW1hZ2Uvc3ZnK3htbCdcclxuICAgIGVsc2UgaWYgKCcuJyArIF9leHAgPT0gJy5zd2YnKSBcclxuICAgICAgcmV0dXJuICdhcHBsaWNhdGlvbi94LXNob2Nrd2F2ZS1mbGFzaCdcclxuICAgIGVsc2UgaWYgKCcuJyArIF9leHAgPT0gJy50YXIuZ3onKSBcclxuICAgICAgcmV0dXJuICdhcHBsaWNhdGlvbi94LWd6aXAnXHJcbiAgICBlbHNlIGlmICgnLicgKyBfZXhwID09ICcudGd6JykgXHJcbiAgICAgIHJldHVybiAnYXBwbGljYXRpb24veC1jb21wcmVzc2VkJ1xyXG4gICAgZWxzZSBpZiAoJy4nICsgX2V4cCA9PSAnLnRpZmYnKSBcclxuICAgICAgcmV0dXJuICdpbWFnZS90aWZmJ1xyXG4gICAgZWxzZSBpZiAoJy4nICsgX2V4cCA9PSAnLnRzdicpIFxyXG4gICAgICByZXR1cm4gJ3RleHQvdGFiLXNlcGFyYXRlZC12YWx1ZXMnXHJcbiAgICBlbHNlIGlmICgnLicgKyBfZXhwID09ICcudHh0JykgXHJcbiAgICAgIHJldHVybiAndGV4dC9wbGFpbidcclxuICAgIGVsc2UgaWYgKCcuJyArIF9leHAgPT0gJy53YXYnKSBcclxuICAgICAgcmV0dXJuICdhdWRpby94LXdhdidcclxuICAgIGVsc2UgaWYgKCcuJyArIF9leHAgPT0gJy54bGFtJykgXHJcbiAgICAgIHJldHVybiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJ1xyXG4gICAgZWxzZSBpZiAoJy4nICsgX2V4cCA9PSAnLnhscycpIFxyXG4gICAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL3ZuZC5tcy1leGNlbCdcclxuICAgIGVsc2UgaWYgKCcuJyArIF9leHAgPT0gJy54bHNiJykgXHJcbiAgICAgIHJldHVybiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJ1xyXG4gICAgZWxzZSBpZiAoJy4nICsgX2V4cCA9PSAnLnhsc3gnKSBcclxuICAgICAgcmV0dXJuICdhcHBsaWNhdGlvbi92bmQubXMtZXhjZWwnXHJcbiAgICBlbHNlIGlmICgnLicgKyBfZXhwID09ICcueGx0eCcpIFxyXG4gICAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbSdcclxuICAgIGVsc2UgaWYgKCcuJyArIF9leHAgPT0gJy54bWwnKSBcclxuICAgICAgcmV0dXJuICd0ZXh0L3htbCdcclxuICAgIGVsc2UgaWYgKCcuJyArIF9leHAgPT0gJy56aXAnKSBcclxuICAgICAgcmV0dXJuICdhcHBsaWNhdGlvbi96aXAnXHJcbiAgICBlbHNlIFxyXG4gICAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbSdcclxuICAgIFxyXG5cclxuXHJcbiIsInRoaXMuY2ZzID0ge307XG5cbk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuICByZXR1cm4gRlMuSFRUUC5zZXRCYXNlVXJsKFwiL2FwaVwiKTtcbn0pO1xuXG5jZnMuZ2V0Q29udGVudFR5cGUgPSBmdW5jdGlvbihmaWxlbmFtZSkge1xuICB2YXIgX2V4cDtcbiAgX2V4cCA9IGZpbGVuYW1lLnNwbGl0KCcuJykucG9wKCkudG9Mb3dlckNhc2UoKTtcbiAgaWYgKCcuJyArIF9leHAgPT09ICcuYXUnKSB7XG4gICAgcmV0dXJuICdhdWRpby9iYXNpYyc7XG4gIH0gZWxzZSBpZiAoJy4nICsgX2V4cCA9PT0gJy5hdmknKSB7XG4gICAgcmV0dXJuICd2aWRlby94LW1zdmlkZW8nO1xuICB9IGVsc2UgaWYgKCcuJyArIF9leHAgPT09ICcuYm1wJykge1xuICAgIHJldHVybiAnaW1hZ2UvYm1wJztcbiAgfSBlbHNlIGlmICgnLicgKyBfZXhwID09PSAnLmJ6MicpIHtcbiAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL3gtYnppcDInO1xuICB9IGVsc2UgaWYgKCcuJyArIF9leHAgPT09ICcuY3NzJykge1xuICAgIHJldHVybiAndGV4dC9jc3MnO1xuICB9IGVsc2UgaWYgKCcuJyArIF9leHAgPT09ICcuZHRkJykge1xuICAgIHJldHVybiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJztcbiAgfSBlbHNlIGlmICgnLicgKyBfZXhwID09PSAnLmRvYycpIHtcbiAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL21zd29yZCc7XG4gIH0gZWxzZSBpZiAoJy4nICsgX2V4cCA9PT0gJy5kb2N4Jykge1xuICAgIHJldHVybiAnYXBwbGljYXRpb24vbXN3b3JkJztcbiAgfSBlbHNlIGlmICgnLicgKyBfZXhwID09PSAnLmRvdHgnKSB7XG4gICAgcmV0dXJuICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nO1xuICB9IGVsc2UgaWYgKCcuJyArIF9leHAgPT09ICcuZXMnKSB7XG4gICAgcmV0dXJuICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nO1xuICB9IGVsc2UgaWYgKCcuJyArIF9leHAgPT09ICcuZXhlJykge1xuICAgIHJldHVybiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJztcbiAgfSBlbHNlIGlmICgnLicgKyBfZXhwID09PSAnLmdpZicpIHtcbiAgICByZXR1cm4gJ2ltYWdlL2dpZic7XG4gIH0gZWxzZSBpZiAoJy4nICsgX2V4cCA9PT0gJy5neicpIHtcbiAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL3gtZ3ppcCc7XG4gIH0gZWxzZSBpZiAoJy4nICsgX2V4cCA9PT0gJy5ocXgnKSB7XG4gICAgcmV0dXJuICdhcHBsaWNhdGlvbi9tYWMtYmluaGV4NDAnO1xuICB9IGVsc2UgaWYgKCcuJyArIF9leHAgPT09ICcuaHRtbCcpIHtcbiAgICByZXR1cm4gJ3RleHQvaHRtbCc7XG4gIH0gZWxzZSBpZiAoJy4nICsgX2V4cCA9PT0gJy5qYXInKSB7XG4gICAgcmV0dXJuICdhcHBsaWNhdGlvbi94LWphdmEtYXJjaGl2ZSc7XG4gIH0gZWxzZSBpZiAoKCcuJyArIF9leHAgPT09ICcuanBnJykgfHwgKCcuJyArIF9leHAgPT09ICcuanBlZycpKSB7XG4gICAgcmV0dXJuICdpbWFnZS9qcGVnJztcbiAgfSBlbHNlIGlmICgnLicgKyBfZXhwID09PSAnLmpzJykge1xuICAgIHJldHVybiAnYXBwbGljYXRpb24veC1qYXZhc2NyaXB0JztcbiAgfSBlbHNlIGlmICgnLicgKyBfZXhwID09PSAnLmpzcCcpIHtcbiAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbSc7XG4gIH0gZWxzZSBpZiAoJy4nICsgX2V4cCA9PT0gJy5taWRpJykge1xuICAgIHJldHVybiAnYXVkaW8vbWlkaSc7XG4gIH0gZWxzZSBpZiAoJy4nICsgX2V4cCA9PT0gJy5tcDMnKSB7XG4gICAgcmV0dXJuICdhdWRpby9tcGVnJztcbiAgfSBlbHNlIGlmICgnLicgKyBfZXhwID09PSAnLm1wZWcnKSB7XG4gICAgcmV0dXJuICd2aWRlby9tcGVnJztcbiAgfSBlbHNlIGlmICgnLicgKyBfZXhwID09PSAnLm9nZycpIHtcbiAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL29nZyc7XG4gIH0gZWxzZSBpZiAoJy4nICsgX2V4cCA9PT0gJy5wZGYnKSB7XG4gICAgcmV0dXJuICdhcHBsaWNhdGlvbi9wZGYnO1xuICB9IGVsc2UgaWYgKCcuJyArIF9leHAgPT09ICcucGwnKSB7XG4gICAgcmV0dXJuICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nO1xuICB9IGVsc2UgaWYgKCcuJyArIF9leHAgPT09ICcucG5nJykge1xuICAgIHJldHVybiAnaW1hZ2UvcG5nJztcbiAgfSBlbHNlIGlmICgnLicgKyBfZXhwID09PSAnLnBvdHgnKSB7XG4gICAgcmV0dXJuICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nO1xuICB9IGVsc2UgaWYgKCcuJyArIF9leHAgPT09ICcucHBzeCcpIHtcbiAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbSc7XG4gIH0gZWxzZSBpZiAoJy4nICsgX2V4cCA9PT0gJy5wcHQnKSB7XG4gICAgcmV0dXJuICdhcHBsaWNhdGlvbi92bmQubXMtcG93ZXJwb2ludCc7XG4gIH0gZWxzZSBpZiAoJy4nICsgX2V4cCA9PT0gJy5wcHR4Jykge1xuICAgIHJldHVybiAnYXBwbGljYXRpb24vdm5kLm1zLXBvd2VycG9pbnQnO1xuICB9IGVsc2UgaWYgKCcuJyArIF9leHAgPT09ICcucHMnKSB7XG4gICAgcmV0dXJuICdhcHBsaWNhdGlvbi9wb3N0c2NyaXB0JztcbiAgfSBlbHNlIGlmICgnLicgKyBfZXhwID09PSAnLnF0Jykge1xuICAgIHJldHVybiAndmlkZW8vcXVpY2t0aW1lJztcbiAgfSBlbHNlIGlmICgnLicgKyBfZXhwID09PSAnLnJhJykge1xuICAgIHJldHVybiAnYXVkaW8veC1wbi1yZWFsYXVkaW8nO1xuICB9IGVsc2UgaWYgKCcuJyArIF9leHAgPT09ICcucmFtJykge1xuICAgIHJldHVybiAnYXVkaW8veC1wbi1yZWFsYXVkaW8nO1xuICB9IGVsc2UgaWYgKCcuJyArIF9leHAgPT09ICcucmRmJykge1xuICAgIHJldHVybiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJztcbiAgfSBlbHNlIGlmICgnLicgKyBfZXhwID09PSAnLnJ0ZicpIHtcbiAgICByZXR1cm4gJ3RleHQvcnRmJztcbiAgfSBlbHNlIGlmICgnLicgKyBfZXhwID09PSAnLnNnbWwnKSB7XG4gICAgcmV0dXJuICd0ZXh0L3NnbWwnO1xuICB9IGVsc2UgaWYgKCcuJyArIF9leHAgPT09ICcuc2l0Jykge1xuICAgIHJldHVybiAnYXBwbGljYXRpb24veC1zdHVmZml0JztcbiAgfSBlbHNlIGlmICgnLicgKyBfZXhwID09PSAnLnNsZHgnKSB7XG4gICAgcmV0dXJuICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nO1xuICB9IGVsc2UgaWYgKCcuJyArIF9leHAgPT09ICcuc3ZnJykge1xuICAgIHJldHVybiAnaW1hZ2Uvc3ZnK3htbCc7XG4gIH0gZWxzZSBpZiAoJy4nICsgX2V4cCA9PT0gJy5zd2YnKSB7XG4gICAgcmV0dXJuICdhcHBsaWNhdGlvbi94LXNob2Nrd2F2ZS1mbGFzaCc7XG4gIH0gZWxzZSBpZiAoJy4nICsgX2V4cCA9PT0gJy50YXIuZ3onKSB7XG4gICAgcmV0dXJuICdhcHBsaWNhdGlvbi94LWd6aXAnO1xuICB9IGVsc2UgaWYgKCcuJyArIF9leHAgPT09ICcudGd6Jykge1xuICAgIHJldHVybiAnYXBwbGljYXRpb24veC1jb21wcmVzc2VkJztcbiAgfSBlbHNlIGlmICgnLicgKyBfZXhwID09PSAnLnRpZmYnKSB7XG4gICAgcmV0dXJuICdpbWFnZS90aWZmJztcbiAgfSBlbHNlIGlmICgnLicgKyBfZXhwID09PSAnLnRzdicpIHtcbiAgICByZXR1cm4gJ3RleHQvdGFiLXNlcGFyYXRlZC12YWx1ZXMnO1xuICB9IGVsc2UgaWYgKCcuJyArIF9leHAgPT09ICcudHh0Jykge1xuICAgIHJldHVybiAndGV4dC9wbGFpbic7XG4gIH0gZWxzZSBpZiAoJy4nICsgX2V4cCA9PT0gJy53YXYnKSB7XG4gICAgcmV0dXJuICdhdWRpby94LXdhdic7XG4gIH0gZWxzZSBpZiAoJy4nICsgX2V4cCA9PT0gJy54bGFtJykge1xuICAgIHJldHVybiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJztcbiAgfSBlbHNlIGlmICgnLicgKyBfZXhwID09PSAnLnhscycpIHtcbiAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL3ZuZC5tcy1leGNlbCc7XG4gIH0gZWxzZSBpZiAoJy4nICsgX2V4cCA9PT0gJy54bHNiJykge1xuICAgIHJldHVybiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJztcbiAgfSBlbHNlIGlmICgnLicgKyBfZXhwID09PSAnLnhsc3gnKSB7XG4gICAgcmV0dXJuICdhcHBsaWNhdGlvbi92bmQubXMtZXhjZWwnO1xuICB9IGVsc2UgaWYgKCcuJyArIF9leHAgPT09ICcueGx0eCcpIHtcbiAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbSc7XG4gIH0gZWxzZSBpZiAoJy4nICsgX2V4cCA9PT0gJy54bWwnKSB7XG4gICAgcmV0dXJuICd0ZXh0L3htbCc7XG4gIH0gZWxzZSBpZiAoJy4nICsgX2V4cCA9PT0gJy56aXAnKSB7XG4gICAgcmV0dXJuICdhcHBsaWNhdGlvbi96aXAnO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJztcbiAgfVxufTtcbiIsIkZTLlN0b3JhZ2VBZGFwdGVyLnByb3RvdHlwZS5vbiAnZXJyb3InLCAoc3RvcmVOYW1lLCBlcnJvciwgZmlsZU9iaiktPlxyXG4gIGNvbnNvbGUuZXJyb3IoXCJGUy5TdG9yYWdlQWRhcHRlciBlbWl0IGVycm9yXCIpXHJcbiAgY29uc29sZS5lcnJvcihlcnJvcilcclxuICBjb25zb2xlLmVycm9yKGZpbGVPYmopXHJcbiAgY29uc29sZS5lcnJvcihzdG9yZU5hbWUpXHJcblxyXG5GUy5Db2xsZWN0aW9uLnByb3RvdHlwZS5vbiAnZXJyb3InLCAoZXJyb3IsIGZpbGVPYmosIHN0b3JlTmFtZSktPlxyXG4gIGNvbnNvbGUuZXJyb3IoXCJGUy5Db2xsZWN0aW9uIGVtaXQgZXJyb3JcIilcclxuICBjb25zb2xlLmVycm9yKGVycm9yKVxyXG4gIGNvbnNvbGUuZXJyb3IoZmlsZU9iailcclxuICBjb25zb2xlLmVycm9yKHN0b3JlTmFtZSkiLCJGUy5TdG9yYWdlQWRhcHRlci5wcm90b3R5cGUub24oJ2Vycm9yJywgZnVuY3Rpb24oc3RvcmVOYW1lLCBlcnJvciwgZmlsZU9iaikge1xuICBjb25zb2xlLmVycm9yKFwiRlMuU3RvcmFnZUFkYXB0ZXIgZW1pdCBlcnJvclwiKTtcbiAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gIGNvbnNvbGUuZXJyb3IoZmlsZU9iaik7XG4gIHJldHVybiBjb25zb2xlLmVycm9yKHN0b3JlTmFtZSk7XG59KTtcblxuRlMuQ29sbGVjdGlvbi5wcm90b3R5cGUub24oJ2Vycm9yJywgZnVuY3Rpb24oZXJyb3IsIGZpbGVPYmosIHN0b3JlTmFtZSkge1xuICBjb25zb2xlLmVycm9yKFwiRlMuQ29sbGVjdGlvbiBlbWl0IGVycm9yXCIpO1xuICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgY29uc29sZS5lcnJvcihmaWxlT2JqKTtcbiAgcmV0dXJuIGNvbnNvbGUuZXJyb3Ioc3RvcmVOYW1lKTtcbn0pO1xuIiwic3RvcmVzID0gWydhdmF0YXJzJywgJ2F1ZGlvcycsICdpbWFnZXMnLCAndmlkZW9zJywgJ2ZpbGVzJ11cclxuXHJcbl8uZWFjaCBzdG9yZXMsIChzdG9yZV9uYW1lKS0+XHJcbiAgICBmaWxlX3N0b3JlXHJcbiAgICBpZiBNZXRlb3Iuc2V0dGluZ3MucHVibGljLmNmcz8uc3RvcmUgPT0gXCJPU1NcIlxyXG4gICAgICAgIGlmIE1ldGVvci5pc0NsaWVudFxyXG4gICAgICAgICAgICBmaWxlX3N0b3JlID0gbmV3IEZTLlN0b3JlLk9TUyhzdG9yZV9uYW1lKVxyXG4gICAgICAgIGVsc2UgaWYgTWV0ZW9yLmlzU2VydmVyXHJcbiAgICAgICAgICAgIGZpbGVfc3RvcmUgPSBuZXcgRlMuU3RvcmUuT1NTIHN0b3JlX25hbWUsXHJcbiAgICAgICAgICAgICAgICByZWdpb246IE1ldGVvci5zZXR0aW5ncy5jZnMuYWxpeXVuLnJlZ2lvblxyXG4gICAgICAgICAgICAgICAgaW50ZXJuYWw6IE1ldGVvci5zZXR0aW5ncy5jZnMuYWxpeXVuLmludGVybmFsXHJcbiAgICAgICAgICAgICAgICBidWNrZXQ6IE1ldGVvci5zZXR0aW5ncy5jZnMuYWxpeXVuLmJ1Y2tldFxyXG4gICAgICAgICAgICAgICAgZm9sZGVyOiBNZXRlb3Iuc2V0dGluZ3MuY2ZzLmFsaXl1bi5mb2xkZXJcclxuICAgICAgICAgICAgICAgIGFjY2Vzc0tleUlkOiBNZXRlb3Iuc2V0dGluZ3MuY2ZzLmFsaXl1bi5hY2Nlc3NLZXlJZFxyXG4gICAgICAgICAgICAgICAgc2VjcmV0QWNjZXNzS2V5OiBNZXRlb3Iuc2V0dGluZ3MuY2ZzLmFsaXl1bi5zZWNyZXRBY2Nlc3NLZXlcclxuXHJcbiAgICBlbHNlIGlmIE1ldGVvci5zZXR0aW5ncy5wdWJsaWMuY2ZzPy5zdG9yZSA9PSBcIlMzXCJcclxuICAgICAgICBpZiBNZXRlb3IuaXNDbGllbnRcclxuICAgICAgICAgICAgZmlsZV9zdG9yZSA9IG5ldyBGUy5TdG9yZS5TMyhzdG9yZV9uYW1lKVxyXG4gICAgICAgIGVsc2UgaWYgTWV0ZW9yLmlzU2VydmVyXHJcbiAgICAgICAgICAgIGZpbGVfc3RvcmUgPSBuZXcgRlMuU3RvcmUuUzMgc3RvcmVfbmFtZSxcclxuICAgICAgICAgICAgICAgIHJlZ2lvbjogTWV0ZW9yLnNldHRpbmdzLmNmcy5hd3MucmVnaW9uXHJcbiAgICAgICAgICAgICAgICBidWNrZXQ6IE1ldGVvci5zZXR0aW5ncy5jZnMuYXdzLmJ1Y2tldFxyXG4gICAgICAgICAgICAgICAgZm9sZGVyOiBNZXRlb3Iuc2V0dGluZ3MuY2ZzLmF3cy5mb2xkZXJcclxuICAgICAgICAgICAgICAgIGFjY2Vzc0tleUlkOiBNZXRlb3Iuc2V0dGluZ3MuY2ZzLmF3cy5hY2Nlc3NLZXlJZFxyXG4gICAgICAgICAgICAgICAgc2VjcmV0QWNjZXNzS2V5OiBNZXRlb3Iuc2V0dGluZ3MuY2ZzLmF3cy5zZWNyZXRBY2Nlc3NLZXlcclxuICAgIGVsc2VcclxuICAgICAgICBpZiBNZXRlb3IuaXNDbGllbnRcclxuICAgICAgICAgICAgZmlsZV9zdG9yZSA9IG5ldyBGUy5TdG9yZS5GaWxlU3lzdGVtKHN0b3JlX25hbWUpXHJcbiAgICAgICAgZWxzZSBpZiBNZXRlb3IuaXNTZXJ2ZXJcclxuICAgICAgICAgICAgZmlsZV9zdG9yZSA9IG5ldyBGUy5TdG9yZS5GaWxlU3lzdGVtKHN0b3JlX25hbWUsIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXRoOiByZXF1aXJlKCdwYXRoJykuam9pbihDcmVhdG9yLnN0ZWVkb3NTdG9yYWdlRGlyLCBcImZpbGVzLyN7c3RvcmVfbmFtZX1cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsZUtleU1ha2VyOiAoZmlsZU9iaiktPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAjIExvb2t1cCB0aGUgY29weVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdG9yZSA9IGZpbGVPYmogYW5kIGZpbGVPYmouX2dldEluZm8oc3RvcmVfbmFtZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgIyBJZiB0aGUgc3RvcmUgYW5kIGtleSBpcyBmb3VuZCByZXR1cm4gdGhlIGtleVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBzdG9yZSBhbmQgc3RvcmUua2V5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RvcmUua2V5XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAjIFRPIENVU1RPTUlaRSwgUkVQTEFDRSBDT0RFIEFGVEVSIFRISVMgUE9JTlRcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lID0gZmlsZU9iai5uYW1lKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lSW5TdG9yZSA9IGZpbGVPYmoubmFtZSh7c3RvcmU6IHN0b3JlX25hbWV9KVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbm93ID0gbmV3IERhdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgeWVhciA9IG5vdy5nZXRGdWxsWWVhcigpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vbnRoID0gbm93LmdldE1vbnRoKCkgKyAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGggPSByZXF1aXJlKCdwYXRoJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWtkaXJwID0gcmVxdWlyZSgnbWtkaXJwJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aG5hbWUgPSBwYXRoLmpvaW4oQ3JlYXRvci5zdGVlZG9zU3RvcmFnZURpciwgXCJmaWxlcy8je3N0b3JlX25hbWV9L1wiICsgeWVhciArICcvJyArIG1vbnRoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAjIFNldCBhYnNvbHV0ZSBwYXRoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFic29sdXRlUGF0aCA9IHBhdGgucmVzb2x2ZShwYXRobmFtZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgIyBFbnN1cmUgdGhlIHBhdGggZXhpc3RzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1rZGlycC5zeW5jKGFic29sdXRlUGF0aClcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICMgSWYgbm8gc3RvcmUga2V5IGZvdW5kIHdlIHJlc29sdmUgLyBnZW5lcmF0ZSBhIGtleVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geWVhciArICcvJyArIG1vbnRoICsgJy8nICsgZmlsZU9iai5jb2xsZWN0aW9uTmFtZSArICctJyArIGZpbGVPYmouX2lkICsgJy0nICsgKGZpbGVuYW1lSW5TdG9yZSB8fCBmaWxlbmFtZSlcclxuXHJcbiAgICAgICAgICAgICAgICB9KVxyXG5cclxuICAgIGlmIHN0b3JlX25hbWUgPT0gJ2F1ZGlvcydcclxuICAgICAgICBjZnNbc3RvcmVfbmFtZV0gPSBuZXcgRlMuQ29sbGVjdGlvbiBzdG9yZV9uYW1lLFxyXG4gICAgICAgICAgICBzdG9yZXM6IFtmaWxlX3N0b3JlXSxcclxuICAgICAgICAgICAgZmlsdGVyOiB7XHJcbiAgICAgICAgICAgICAgICBhbGxvdzoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRUeXBlczogWydhdWRpby8qJ10gIyBhbGxvdyBvbmx5IGF1ZGlvcyBpbiB0aGlzIEZTLkNvbGxlY3Rpb25cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgZWxzZSBpZiBzdG9yZV9uYW1lID09ICdpbWFnZXMnIHx8IHN0b3JlX25hbWUgPT0gJ2F2YXRhcnMnXHJcbiAgICAgICAgY2ZzW3N0b3JlX25hbWVdID0gbmV3IEZTLkNvbGxlY3Rpb24gc3RvcmVfbmFtZSxcclxuICAgICAgICAgICAgc3RvcmVzOiBbZmlsZV9zdG9yZV0sXHJcbiAgICAgICAgICAgIGZpbHRlcjoge1xyXG4gICAgICAgICAgICAgICAgYWxsb3c6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50VHlwZXM6IFsnaW1hZ2UvKiddICMgYWxsb3cgb25seSBpbWFnZXMgaW4gdGhpcyBGUy5Db2xsZWN0aW9uXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgIGVsc2UgaWYgc3RvcmVfbmFtZSA9PSAndmlkZW9zJ1xyXG4gICAgICAgIGNmc1tzdG9yZV9uYW1lXSA9IG5ldyBGUy5Db2xsZWN0aW9uIHN0b3JlX25hbWUsXHJcbiAgICAgICAgICAgIHN0b3JlczogW2ZpbGVfc3RvcmVdLFxyXG4gICAgICAgICAgICBmaWx0ZXI6IHtcclxuICAgICAgICAgICAgICAgIGFsbG93OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudFR5cGVzOiBbJ3ZpZGVvLyonXSAjIGFsbG93IG9ubHkgdmlkZW9zIGluIHRoaXMgRlMuQ29sbGVjdGlvblxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICBlbHNlXHJcbiAgICAgICAgY2ZzW3N0b3JlX25hbWVdID0gbmV3IEZTLkNvbGxlY3Rpb24gc3RvcmVfbmFtZSxcclxuICAgICAgICAgICAgc3RvcmVzOiBbZmlsZV9zdG9yZV1cclxuXHJcbiAgICBjZnNbc3RvcmVfbmFtZV0uYWxsb3dcclxuICAgICAgICBpbnNlcnQ6IC0+XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlXHJcbiAgICAgICAgdXBkYXRlOiAtPlxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgICAgIHJlbW92ZTogLT5cclxuICAgICAgICAgICAgcmV0dXJuIHRydWVcclxuICAgICAgICBkb3dubG9hZDogLT5cclxuICAgICAgICAgICAgcmV0dXJuIHRydWVcclxuXHJcbiAgICBpZiBzdG9yZV9uYW1lID09ICdhdmF0YXJzJ1xyXG4gICAgICAgIGRiW3N0b3JlX25hbWVdID0gY2ZzW3N0b3JlX25hbWVdXHJcbiAgICAgICAgZGJbc3RvcmVfbmFtZV0uZmlsZXMuYmVmb3JlLmluc2VydCAodXNlcklkLCBkb2MpIC0+XHJcbiAgICAgICAgICAgIGRvYy51c2VySWQgPSB1c2VySWRcclxuXHJcbiAgICBpZiBzdG9yZV9uYW1lID09ICdmaWxlcydcclxuICAgICAgICBkYltcImNmcy4je3N0b3JlX25hbWV9LmZpbGVyZWNvcmRcIl0gPSBjZnNbc3RvcmVfbmFtZV0uZmlsZXMiLCJ2YXIgc3RvcmVzO1xuXG5zdG9yZXMgPSBbJ2F2YXRhcnMnLCAnYXVkaW9zJywgJ2ltYWdlcycsICd2aWRlb3MnLCAnZmlsZXMnXTtcblxuXy5lYWNoKHN0b3JlcywgZnVuY3Rpb24oc3RvcmVfbmFtZSkge1xuICBmaWxlX3N0b3JlO1xuICB2YXIgZmlsZV9zdG9yZSwgcmVmLCByZWYxO1xuICBpZiAoKChyZWYgPSBNZXRlb3Iuc2V0dGluZ3NbXCJwdWJsaWNcIl0uY2ZzKSAhPSBudWxsID8gcmVmLnN0b3JlIDogdm9pZCAwKSA9PT0gXCJPU1NcIikge1xuICAgIGlmIChNZXRlb3IuaXNDbGllbnQpIHtcbiAgICAgIGZpbGVfc3RvcmUgPSBuZXcgRlMuU3RvcmUuT1NTKHN0b3JlX25hbWUpO1xuICAgIH0gZWxzZSBpZiAoTWV0ZW9yLmlzU2VydmVyKSB7XG4gICAgICBmaWxlX3N0b3JlID0gbmV3IEZTLlN0b3JlLk9TUyhzdG9yZV9uYW1lLCB7XG4gICAgICAgIHJlZ2lvbjogTWV0ZW9yLnNldHRpbmdzLmNmcy5hbGl5dW4ucmVnaW9uLFxuICAgICAgICBpbnRlcm5hbDogTWV0ZW9yLnNldHRpbmdzLmNmcy5hbGl5dW4uaW50ZXJuYWwsXG4gICAgICAgIGJ1Y2tldDogTWV0ZW9yLnNldHRpbmdzLmNmcy5hbGl5dW4uYnVja2V0LFxuICAgICAgICBmb2xkZXI6IE1ldGVvci5zZXR0aW5ncy5jZnMuYWxpeXVuLmZvbGRlcixcbiAgICAgICAgYWNjZXNzS2V5SWQ6IE1ldGVvci5zZXR0aW5ncy5jZnMuYWxpeXVuLmFjY2Vzc0tleUlkLFxuICAgICAgICBzZWNyZXRBY2Nlc3NLZXk6IE1ldGVvci5zZXR0aW5ncy5jZnMuYWxpeXVuLnNlY3JldEFjY2Vzc0tleVxuICAgICAgfSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKCgocmVmMSA9IE1ldGVvci5zZXR0aW5nc1tcInB1YmxpY1wiXS5jZnMpICE9IG51bGwgPyByZWYxLnN0b3JlIDogdm9pZCAwKSA9PT0gXCJTM1wiKSB7XG4gICAgaWYgKE1ldGVvci5pc0NsaWVudCkge1xuICAgICAgZmlsZV9zdG9yZSA9IG5ldyBGUy5TdG9yZS5TMyhzdG9yZV9uYW1lKTtcbiAgICB9IGVsc2UgaWYgKE1ldGVvci5pc1NlcnZlcikge1xuICAgICAgZmlsZV9zdG9yZSA9IG5ldyBGUy5TdG9yZS5TMyhzdG9yZV9uYW1lLCB7XG4gICAgICAgIHJlZ2lvbjogTWV0ZW9yLnNldHRpbmdzLmNmcy5hd3MucmVnaW9uLFxuICAgICAgICBidWNrZXQ6IE1ldGVvci5zZXR0aW5ncy5jZnMuYXdzLmJ1Y2tldCxcbiAgICAgICAgZm9sZGVyOiBNZXRlb3Iuc2V0dGluZ3MuY2ZzLmF3cy5mb2xkZXIsXG4gICAgICAgIGFjY2Vzc0tleUlkOiBNZXRlb3Iuc2V0dGluZ3MuY2ZzLmF3cy5hY2Nlc3NLZXlJZCxcbiAgICAgICAgc2VjcmV0QWNjZXNzS2V5OiBNZXRlb3Iuc2V0dGluZ3MuY2ZzLmF3cy5zZWNyZXRBY2Nlc3NLZXlcbiAgICAgIH0pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG4gICAgICBmaWxlX3N0b3JlID0gbmV3IEZTLlN0b3JlLkZpbGVTeXN0ZW0oc3RvcmVfbmFtZSk7XG4gICAgfSBlbHNlIGlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcbiAgICAgIGZpbGVfc3RvcmUgPSBuZXcgRlMuU3RvcmUuRmlsZVN5c3RlbShzdG9yZV9uYW1lLCB7XG4gICAgICAgIHBhdGg6IHJlcXVpcmUoJ3BhdGgnKS5qb2luKENyZWF0b3Iuc3RlZWRvc1N0b3JhZ2VEaXIsIFwiZmlsZXMvXCIgKyBzdG9yZV9uYW1lKSxcbiAgICAgICAgZmlsZUtleU1ha2VyOiBmdW5jdGlvbihmaWxlT2JqKSB7XG4gICAgICAgICAgdmFyIGFic29sdXRlUGF0aCwgZmlsZW5hbWUsIGZpbGVuYW1lSW5TdG9yZSwgbWtkaXJwLCBtb250aCwgbm93LCBwYXRoLCBwYXRobmFtZSwgc3RvcmUsIHllYXI7XG4gICAgICAgICAgc3RvcmUgPSBmaWxlT2JqICYmIGZpbGVPYmouX2dldEluZm8oc3RvcmVfbmFtZSk7XG4gICAgICAgICAgaWYgKHN0b3JlICYmIHN0b3JlLmtleSkge1xuICAgICAgICAgICAgcmV0dXJuIHN0b3JlLmtleTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZmlsZW5hbWUgPSBmaWxlT2JqLm5hbWUoKTtcbiAgICAgICAgICBmaWxlbmFtZUluU3RvcmUgPSBmaWxlT2JqLm5hbWUoe1xuICAgICAgICAgICAgc3RvcmU6IHN0b3JlX25hbWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBub3cgPSBuZXcgRGF0ZTtcbiAgICAgICAgICB5ZWFyID0gbm93LmdldEZ1bGxZZWFyKCk7XG4gICAgICAgICAgbW9udGggPSBub3cuZ2V0TW9udGgoKSArIDE7XG4gICAgICAgICAgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbiAgICAgICAgICBta2RpcnAgPSByZXF1aXJlKCdta2RpcnAnKTtcbiAgICAgICAgICBwYXRobmFtZSA9IHBhdGguam9pbihDcmVhdG9yLnN0ZWVkb3NTdG9yYWdlRGlyLCAoXCJmaWxlcy9cIiArIHN0b3JlX25hbWUgKyBcIi9cIikgKyB5ZWFyICsgJy8nICsgbW9udGgpO1xuICAgICAgICAgIGFic29sdXRlUGF0aCA9IHBhdGgucmVzb2x2ZShwYXRobmFtZSk7XG4gICAgICAgICAgbWtkaXJwLnN5bmMoYWJzb2x1dGVQYXRoKTtcbiAgICAgICAgICByZXR1cm4geWVhciArICcvJyArIG1vbnRoICsgJy8nICsgZmlsZU9iai5jb2xsZWN0aW9uTmFtZSArICctJyArIGZpbGVPYmouX2lkICsgJy0nICsgKGZpbGVuYW1lSW5TdG9yZSB8fCBmaWxlbmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBpZiAoc3RvcmVfbmFtZSA9PT0gJ2F1ZGlvcycpIHtcbiAgICBjZnNbc3RvcmVfbmFtZV0gPSBuZXcgRlMuQ29sbGVjdGlvbihzdG9yZV9uYW1lLCB7XG4gICAgICBzdG9yZXM6IFtmaWxlX3N0b3JlXSxcbiAgICAgIGZpbHRlcjoge1xuICAgICAgICBhbGxvdzoge1xuICAgICAgICAgIGNvbnRlbnRUeXBlczogWydhdWRpby8qJ11cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9IGVsc2UgaWYgKHN0b3JlX25hbWUgPT09ICdpbWFnZXMnIHx8IHN0b3JlX25hbWUgPT09ICdhdmF0YXJzJykge1xuICAgIGNmc1tzdG9yZV9uYW1lXSA9IG5ldyBGUy5Db2xsZWN0aW9uKHN0b3JlX25hbWUsIHtcbiAgICAgIHN0b3JlczogW2ZpbGVfc3RvcmVdLFxuICAgICAgZmlsdGVyOiB7XG4gICAgICAgIGFsbG93OiB7XG4gICAgICAgICAgY29udGVudFR5cGVzOiBbJ2ltYWdlLyonXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoc3RvcmVfbmFtZSA9PT0gJ3ZpZGVvcycpIHtcbiAgICBjZnNbc3RvcmVfbmFtZV0gPSBuZXcgRlMuQ29sbGVjdGlvbihzdG9yZV9uYW1lLCB7XG4gICAgICBzdG9yZXM6IFtmaWxlX3N0b3JlXSxcbiAgICAgIGZpbHRlcjoge1xuICAgICAgICBhbGxvdzoge1xuICAgICAgICAgIGNvbnRlbnRUeXBlczogWyd2aWRlby8qJ11cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGNmc1tzdG9yZV9uYW1lXSA9IG5ldyBGUy5Db2xsZWN0aW9uKHN0b3JlX25hbWUsIHtcbiAgICAgIHN0b3JlczogW2ZpbGVfc3RvcmVdXG4gICAgfSk7XG4gIH1cbiAgY2ZzW3N0b3JlX25hbWVdLmFsbG93KHtcbiAgICBpbnNlcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICB1cGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICByZW1vdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICBkb3dubG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0pO1xuICBpZiAoc3RvcmVfbmFtZSA9PT0gJ2F2YXRhcnMnKSB7XG4gICAgZGJbc3RvcmVfbmFtZV0gPSBjZnNbc3RvcmVfbmFtZV07XG4gICAgZGJbc3RvcmVfbmFtZV0uZmlsZXMuYmVmb3JlLmluc2VydChmdW5jdGlvbih1c2VySWQsIGRvYykge1xuICAgICAgcmV0dXJuIGRvYy51c2VySWQgPSB1c2VySWQ7XG4gICAgfSk7XG4gIH1cbiAgaWYgKHN0b3JlX25hbWUgPT09ICdmaWxlcycpIHtcbiAgICByZXR1cm4gZGJbXCJjZnMuXCIgKyBzdG9yZV9uYW1lICsgXCIuZmlsZXJlY29yZFwiXSA9IGNmc1tzdG9yZV9uYW1lXS5maWxlcztcbiAgfVxufSk7XG4iXX0=
