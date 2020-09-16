(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var _ = Package.underscore._;
var Random = Package.random.Random;
var Log = Package.logging.Log;
var EventEmitter = Package['raix:eventemitter'].EventEmitter;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var meteorInstall = Package.modules.meteorInstall;

/* Package-scope variables */
var __coffeescriptShare, Logger;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:logger":{"checkNpm.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/steedos_logger/checkNpm.js                                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let checkNpmVersions;
module.link("meteor/tmeasday:check-npm-versions", {
  checkNpmVersions(v) {
    checkNpmVersions = v;
  }

}, 0);

// fix warning: xxx not installed
require("chalk/package.json");

checkNpmVersions({
  'chalk': '^2.4.2'
}, 'steedos:logger');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server.coffee":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/steedos_logger/server.coffee                                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var StdOut,
    chalk,
    processString,
    extend = function (child, parent) {
  for (var key in meteorBabelHelpers.sanitizeForInObject(parent)) {
    if (hasProp.call(parent, key)) child[key] = parent[key];
  }

  function ctor() {
    this.constructor = child;
  }

  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
  child.__super__ = parent.prototype;
  return child;
},
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

chalk = require("chalk");
chalk.enabled = true;
this.LoggerManager = new (function (superClass) {
  extend(_Class, superClass);

  function _Class() {
    this.enabled = false;
    this.loggers = {};
    this.queue = [];
    this.showPackage = false;
    this.showFileAndLine = false;
    this.logLevel = 0;
  }

  _Class.prototype.register = function (logger) {
    if (!logger instanceof Logger) {
      return;
    }

    this.loggers[logger.name] = logger;
    return this.emit('register', logger);
  };

  _Class.prototype.addToQueue = function (logger, args) {
    return this.queue.push({
      logger: logger,
      args: args
    });
  };

  _Class.prototype.dispatchQueue = function () {
    var i, item, len1, ref;
    ref = this.queue;

    for (i = 0, len1 = ref.length; i < len1; i++) {
      item = ref[i];

      item.logger._log.apply(item.logger, item.args);
    }

    return this.clearQueue();
  };

  _Class.prototype.clearQueue = function () {
    return this.queue = [];
  };

  _Class.prototype.disable = function () {
    return this.enabled = false;
  };

  _Class.prototype.enable = function (dispatchQueue) {
    if (dispatchQueue == null) {
      dispatchQueue = false;
    }

    this.enabled = true;

    if (dispatchQueue === true) {
      return this.dispatchQueue();
    } else {
      return this.clearQueue();
    }
  };

  return _Class;
}(EventEmitter))();

this.Logger = Logger = function () {
  Logger.prototype.defaultTypes = {
    debug: {
      name: 'debug',
      color: 'blue',
      level: 2
    },
    log: {
      name: 'info',
      color: 'blue',
      level: 1
    },
    info: {
      name: 'info',
      color: 'blue',
      level: 1
    },
    success: {
      name: 'info',
      color: 'green',
      level: 1
    },
    warn: {
      name: 'warn',
      color: 'magenta',
      level: 1
    },
    error: {
      name: 'error',
      color: 'red',
      level: 0
    }
  };

  function Logger(name1, config) {
    var fn, fn1, fn2, method, name, ref, ref1, ref2, section, self, type, typeConfig;
    this.name = name1;

    if (config == null) {
      config = {};
    }

    self = this;
    this.config = {};

    _.extend(this.config, config);

    if (LoggerManager.loggers[this.name] != null) {
      LoggerManager.loggers[this.name].warn('Duplicated instance');
      return LoggerManager.loggers[this.name];
    }

    ref = this.defaultTypes;

    fn = function (type, typeConfig) {
      self[type] = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return self._log.call(self, {
          section: this.__section,
          type: type,
          level: typeConfig.level,
          method: typeConfig.name,
          "arguments": args
        });
      };

      return self[type + "_box"] = function () {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return self._log.call(self, {
          section: this.__section,
          type: type,
          box: true,
          level: typeConfig.level,
          method: typeConfig.name,
          "arguments": args
        });
      };
    };

    for (type in meteorBabelHelpers.sanitizeForInObject(ref)) {
      typeConfig = ref[type];
      fn(type, typeConfig);
    }

    if (this.config.methods != null) {
      ref1 = this.config.methods;

      fn1 = function (method, typeConfig) {
        if (self[method] != null) {
          self.warn("Method", method, "already exists");
        }

        if (self.defaultTypes[typeConfig.type] == null) {
          self.warn("Method type", typeConfig.type, "does not exist");
        }

        self[method] = function () {
          var args, ref2;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          return self._log.call(self, {
            section: this.__section,
            type: typeConfig.type,
            level: typeConfig.level != null ? typeConfig.level : (ref2 = self.defaultTypes[typeConfig.type]) != null ? ref2.level : void 0,
            method: method,
            "arguments": args
          });
        };

        return self[method + "_box"] = function () {
          var args, ref2;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          return self._log.call(self, {
            section: this.__section,
            type: typeConfig.type,
            box: true,
            level: typeConfig.level != null ? typeConfig.level : (ref2 = self.defaultTypes[typeConfig.type]) != null ? ref2.level : void 0,
            method: method,
            "arguments": args
          });
        };
      };

      for (method in meteorBabelHelpers.sanitizeForInObject(ref1)) {
        typeConfig = ref1[method];
        fn1(method, typeConfig);
      }
    }

    if (this.config.sections != null) {
      ref2 = this.config.sections;

      fn2 = function (section, name) {
        var fn3, ref3, ref4, results;
        self[section] = {};
        ref3 = self.defaultTypes;

        fn3 = function (_this) {
          return function (type, typeConfig) {
            self[section][type] = function () {
              return self[type].apply({
                __section: name
              }, arguments);
            };

            return self[section][type + "_box"] = function () {
              return self[type + "_box"].apply({
                __section: name
              }, arguments);
            };
          };
        }(this);

        for (type in meteorBabelHelpers.sanitizeForInObject(ref3)) {
          typeConfig = ref3[type];
          fn3(type, typeConfig);
        }

        ref4 = self.config.methods;
        results = [];

        for (method in meteorBabelHelpers.sanitizeForInObject(ref4)) {
          typeConfig = ref4[method];
          results.push(function (_this) {
            return function (method, typeConfig) {
              self[section][method] = function () {
                return self[method].apply({
                  __section: name
                }, arguments);
              };

              return self[section][method + "_box"] = function () {
                return self[method + "_box"].apply({
                  __section: name
                }, arguments);
              };
            };
          }(this)(method, typeConfig));
        }

        return results;
      };

      for (section in meteorBabelHelpers.sanitizeForInObject(ref2)) {
        name = ref2[section];
        fn2(section, name);
      }
    }

    LoggerManager.register(this);
    return this;
  }

  Logger.prototype.getPrefix = function (options) {
    var detailParts, details, prefix;

    if (options.section != null) {
      prefix = this.name + " ➔ " + options.section + "." + options.method;
    } else {
      prefix = this.name + " ➔ " + options.method;
    }

    details = this._getCallerDetails();
    detailParts = [];

    if (details["package"] != null && (LoggerManager.showPackage === true || options.type === 'error')) {
      detailParts.push(details["package"]);
    }

    if (LoggerManager.showFileAndLine === true || options.type === 'error') {
      if (details.file != null && details.line != null) {
        detailParts.push(details.file + ":" + details.line);
      } else {
        if (details.file != null) {
          detailParts.push(details.file);
        }

        if (details.line != null) {
          detailParts.push(details.line);
        }
      }
    }

    if (this.defaultTypes[options.type] != null) {
      prefix = chalk[this.defaultTypes[options.type].color](prefix);
    }

    if (detailParts.length > 0) {
      prefix = detailParts.join(' ') + " " + prefix;
    }

    return prefix;
  };

  Logger.prototype._getCallerDetails = function () {
    var details, getStack, i, index, item, len1, line, lines, match, packageMatch, stack;

    getStack = function () {
      var err, stack;
      err = new Error();
      stack = err.stack;
      return stack;
    };

    stack = getStack();

    if (!stack) {
      return {};
    }

    lines = stack.split('\n');
    line = void 0;

    for (index = i = 0, len1 = lines.length; i < len1; index = ++i) {
      item = lines[index];

      if (!(index > 0)) {
        continue;
      }

      line = item;

      if (line.match(/^\s*at eval \(eval/)) {
        return {
          file: "eval"
        };
      }

      if (!line.match(/packages\/rocketchat_logger(?:\/|\.js)/)) {
        break;
      }
    }

    details = {};
    match = /(?:[@(]| at )([^(]+?):([0-9:]+)(?:\)|$)/.exec(line);

    if (!match) {
      return details;
    }

    details.line = match[2].split(':')[0];
    details.file = match[1].split('/').slice(-1)[0].split('?')[0];
    packageMatch = match[1].match(/packages\/([^\.\/]+)(?:\/|\.)/);

    if (packageMatch != null) {
      details["package"] = packageMatch[1];
    }

    return details;
  };

  Logger.prototype.makeABox = function (message, title) {
    var i, j, len, len1, len2, line, lines, separator, topLine;

    if (!_.isArray(message)) {
      message = message.split("\n");
    }

    len = 0;

    for (i = 0, len1 = message.length; i < len1; i++) {
      line = message[i];
      len = Math.max(len, line.length);
    }

    topLine = "+--" + s.pad('', len, '-') + "--+";
    separator = "|  " + s.pad('', len, '') + "  |";
    lines = [];
    lines.push(topLine);

    if (title != null) {
      lines.push("|  " + s.lrpad(title, len) + "  |");
      lines.push(topLine);
    }

    lines.push(separator);

    for (j = 0, len2 = message.length; j < len2; j++) {
      line = message[j];
      lines.push("|  " + s.rpad(line, len) + "  |");
    }

    lines.push(separator);
    lines.push(topLine);
    return lines;
  };

  Logger.prototype._log = function (options) {
    var box, color, i, len1, line, prefix, subPrefix;

    if (LoggerManager.enabled === false) {
      LoggerManager.addToQueue(this, arguments);
      return;
    }

    if (options.level == null) {
      options.level = 1;
    }

    if (LoggerManager.logLevel < options.level) {
      return;
    }

    prefix = this.getPrefix(options);

    if (options.box === true && _.isString(options["arguments"][0])) {
      color = void 0;

      if (this.defaultTypes[options.type] != null) {
        color = this.defaultTypes[options.type].color;
      }

      box = this.makeABox(options["arguments"][0], options["arguments"][1]);
      subPrefix = '➔';

      if (color != null) {
        subPrefix = subPrefix[color];
      }

      console.log(subPrefix, prefix);

      for (i = 0, len1 = box.length; i < len1; i++) {
        line = box[i];

        if (color != null) {
          console.log(subPrefix, line[color]);
        } else {
          console.log(subPrefix, line);
        }
      }
    } else {
      options["arguments"].unshift(prefix);
      console.log.apply(console, options["arguments"]);
    }
  };

  return Logger;
}();

this.SystemLogger = new Logger('System', {
  methods: {
    startup: {
      type: 'success',
      level: 0
    }
  }
});

processString = function (string, date) {
  if (string[0] === '{') {
    try {
      return Log.format(EJSON.parse(string), {
        color: true
      });
    } catch (error) {}
  }

  try {
    return Log.format({
      message: string,
      time: date,
      level: 'info'
    }, {
      color: true
    });
  } catch (error) {}

  return string;
};

StdOut = new (function (superClass) {
  extend(_Class, superClass);

  function _Class() {
    var write;
    this.queue = [];
    write = process.stdout.write;

    process.stdout.write = function (_this) {
      return function (string, encoding, fd) {
        var date, item, ref, ref1, viewLimit;
        write.apply(process.stdout, arguments);
        date = new Date();
        string = processString(string, date);
        item = {
          id: Random.id(),
          string: string,
          ts: date
        };

        _this.queue.push(item);

        viewLimit = (ref = Meteor.settings) != null ? (ref1 = ref.logger) != null ? ref1.viewLimit : void 0 : void 0;

        if (!viewLimit) {
          viewLimit = 1000;
        }

        if (_this.queue.length > viewLimit) {
          _this.queue.shift();
        }

        return _this.emit('write', string, item);
      };
    }(this);
  }

  return _Class;
}(EventEmitter))();
Meteor.publish('stdout', function () {
  var i, item, len1, ref, user;

  if (!this.userId) {
    return this.ready();
  }

  if (!this.userId) {
    return this.ready();
  }

  user = db.users.findOne(this.userId, {
    fields: {
      is_cloudadmin: 1
    }
  });

  if (!user) {
    return this.ready();
  }

  ref = StdOut.queue;

  for (i = 0, len1 = ref.length; i < len1; i++) {
    item = ref[i];
    this.added('stdout', item.id, {
      string: item.string,
      ts: item.ts
    });
  }

  this.ready();
  StdOut.on('write', function (_this) {
    return function (string, item) {
      return _this.added('stdout', item.id, {
        string: item.string,
        ts: item.ts
      });
    };
  }(this));
});
Meteor.startup(function () {
  var ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7;

  if ((ref = Meteor.settings) != null ? (ref1 = ref.logger) != null ? ref1.enabled : void 0 : void 0) {
    if ((ref2 = Meteor.settings) != null ? (ref3 = ref2.logger) != null ? ref3.showPackage : void 0 : void 0) {
      LoggerManager.showPackage = true;
    }

    if ((ref4 = Meteor.settings) != null ? (ref5 = ref4.logger) != null ? ref5.showFileAndLine : void 0 : void 0) {
      LoggerManager.showFileAndLine = true;
    }

    if ((ref6 = Meteor.settings) != null ? (ref7 = ref6.logger) != null ? ref7.logLevel : void 0 : void 0) {
      LoggerManager.logLevel = Meteor.settings.logger.logLevel;
    }

    return LoggerManager.enable(true);
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".coffee"
  ]
});

require("/node_modules/meteor/steedos:logger/checkNpm.js");
require("/node_modules/meteor/steedos:logger/server.coffee");

/* Exports */
Package._define("steedos:logger", {
  Logger: Logger
});

})();

//# sourceURL=meteor://💻app/packages/steedos_logger.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpsb2dnZXIvY2hlY2tOcG0uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3NfbG9nZ2VyL3NlcnZlci5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci5jb2ZmZWUiXSwibmFtZXMiOlsiY2hlY2tOcG1WZXJzaW9ucyIsIm1vZHVsZSIsImxpbmsiLCJ2IiwicmVxdWlyZSIsIlN0ZE91dCIsImNoYWxrIiwicHJvY2Vzc1N0cmluZyIsImV4dGVuZCIsImNoaWxkIiwicGFyZW50Iiwia2V5IiwiaGFzUHJvcCIsImNhbGwiLCJjdG9yIiwiY29uc3RydWN0b3IiLCJwcm90b3R5cGUiLCJfX3N1cGVyX18iLCJoYXNPd25Qcm9wZXJ0eSIsInNsaWNlIiwiZW5hYmxlZCIsIkxvZ2dlck1hbmFnZXIiLCJzdXBlckNsYXNzIiwiX0NsYXNzIiwibG9nZ2VycyIsInF1ZXVlIiwic2hvd1BhY2thZ2UiLCJzaG93RmlsZUFuZExpbmUiLCJsb2dMZXZlbCIsInJlZ2lzdGVyIiwibG9nZ2VyIiwiTG9nZ2VyIiwibmFtZSIsImVtaXQiLCJhZGRUb1F1ZXVlIiwiYXJncyIsInB1c2giLCJkaXNwYXRjaFF1ZXVlIiwiaSIsIml0ZW0iLCJsZW4xIiwicmVmIiwibGVuZ3RoIiwiX2xvZyIsImFwcGx5IiwiY2xlYXJRdWV1ZSIsImRpc2FibGUiLCJlbmFibGUiLCJFdmVudEVtaXR0ZXIiLCJkZWZhdWx0VHlwZXMiLCJkZWJ1ZyIsImNvbG9yIiwibGV2ZWwiLCJsb2ciLCJpbmZvIiwic3VjY2VzcyIsIndhcm4iLCJlcnJvciIsIm5hbWUxIiwiY29uZmlnIiwiZm4iLCJmbjEiLCJmbjIiLCJtZXRob2QiLCJyZWYxIiwicmVmMiIsInNlY3Rpb24iLCJzZWxmIiwidHlwZSIsInR5cGVDb25maWciLCJfIiwiYXJndW1lbnRzIiwiX19zZWN0aW9uIiwiYm94IiwibWV0aG9kcyIsInNlY3Rpb25zIiwiZm4zIiwicmVmMyIsInJlZjQiLCJyZXN1bHRzIiwiX3RoaXMiLCJnZXRQcmVmaXgiLCJvcHRpb25zIiwiZGV0YWlsUGFydHMiLCJkZXRhaWxzIiwicHJlZml4IiwiX2dldENhbGxlckRldGFpbHMiLCJmaWxlIiwibGluZSIsImpvaW4iLCJnZXRTdGFjayIsImluZGV4IiwibGluZXMiLCJtYXRjaCIsInBhY2thZ2VNYXRjaCIsInN0YWNrIiwiZXJyIiwiRXJyb3IiLCJzcGxpdCIsImV4ZWMiLCJtYWtlQUJveCIsIm1lc3NhZ2UiLCJ0aXRsZSIsImoiLCJsZW4iLCJsZW4yIiwic2VwYXJhdG9yIiwidG9wTGluZSIsImlzQXJyYXkiLCJNYXRoIiwibWF4IiwicyIsInBhZCIsImxycGFkIiwicnBhZCIsInN1YlByZWZpeCIsImlzU3RyaW5nIiwiY29uc29sZSIsInVuc2hpZnQiLCJTeXN0ZW1Mb2dnZXIiLCJzdGFydHVwIiwic3RyaW5nIiwiZGF0ZSIsIkxvZyIsImZvcm1hdCIsIkVKU09OIiwicGFyc2UiLCJ0aW1lIiwid3JpdGUiLCJwcm9jZXNzIiwic3Rkb3V0IiwiZW5jb2RpbmciLCJmZCIsInZpZXdMaW1pdCIsIkRhdGUiLCJpZCIsIlJhbmRvbSIsInRzIiwiTWV0ZW9yIiwic2V0dGluZ3MiLCJzaGlmdCIsInB1Ymxpc2giLCJ1c2VyIiwidXNlcklkIiwicmVhZHkiLCJkYiIsInVzZXJzIiwiZmluZE9uZSIsImZpZWxkcyIsImlzX2Nsb3VkYWRtaW4iLCJhZGRlZCIsIm9uIiwicmVmNSIsInJlZjYiLCJyZWY3Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLGdCQUFKO0FBQXFCQyxNQUFNLENBQUNDLElBQVAsQ0FBWSxvQ0FBWixFQUFpRDtBQUFDRixrQkFBZ0IsQ0FBQ0csQ0FBRCxFQUFHO0FBQUNILG9CQUFnQixHQUFDRyxDQUFqQjtBQUFtQjs7QUFBeEMsQ0FBakQsRUFBMkYsQ0FBM0Y7O0FBQXJCO0FBQ0FDLE9BQU8sQ0FBQyxvQkFBRCxDQUFQOztBQUdB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LEdBQTRCLE1BQTVCLEdBQTRCLE1BQTVCO0FBQ0MsU0FBQTZDLE9BQUF5RSxPQUFBQyxRQUFBLGFBQUE5RCxPQUFBWixLQUFBbkMsTUFBQSxZQUFBK0MsS0FBNEJuRCxXQUE1QixHQUE0QixNQUE1QixHQUE0QixNQUE1QjtBQUNDTCxvQkFBY0ssV0FBZCxHQUE0QixJQUE1QjtBQ29IRTs7QURuSEgsU0FBQW9ELE9BQUE0RCxPQUFBQyxRQUFBLGFBQUFhLE9BQUExRSxLQUFBaEQsTUFBQSxZQUFBMEgsS0FBNEI3SCxlQUE1QixHQUE0QixNQUE1QixHQUE0QixNQUE1QjtBQUNDTixvQkFBY00sZUFBZCxHQUFnQyxJQUFoQztBQ3FIRTs7QURwSEgsU0FBQThILE9BQUFmLE9BQUFDLFFBQUEsYUFBQWUsT0FBQUQsS0FBQTNILE1BQUEsWUFBQTRILEtBQTRCOUgsUUFBNUIsR0FBNEIsTUFBNUIsR0FBNEIsTUFBNUI7QUFDQ1Asb0JBQWNPLFFBQWQsR0FBeUI4RyxPQUFPQyxRQUFQLENBQWdCN0csTUFBaEIsQ0FBdUJGLFFBQWhEO0FDc0hFOztBQUNELFdEckhGUCxjQUFjMEIsTUFBZCxDQUFxQixJQUFyQixDQ3FIRTtBQUNEO0FEL0hILEciLCJmaWxlIjoiL3BhY2thZ2VzL3N0ZWVkb3NfbG9nZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gZml4IHdhcm5pbmc6IHh4eCBub3QgaW5zdGFsbGVkXG5yZXF1aXJlKFwiY2hhbGsvcGFja2FnZS5qc29uXCIpO1xuXG5pbXBvcnQgeyBjaGVja05wbVZlcnNpb25zIH0gZnJvbSAnbWV0ZW9yL3RtZWFzZGF5OmNoZWNrLW5wbS12ZXJzaW9ucyc7XG5jaGVja05wbVZlcnNpb25zKHtcblx0J2NoYWxrJzogJ14yLjQuMidcbn0sICdzdGVlZG9zOmxvZ2dlcicpOyIsImNoYWxrID0gcmVxdWlyZShcImNoYWxrXCIpXG5jaGFsay5lbmFibGVkID0gdHJ1ZTtcblxuQExvZ2dlck1hbmFnZXIgPSBuZXcgY2xhc3MgZXh0ZW5kcyBFdmVudEVtaXR0ZXJcblx0Y29uc3RydWN0b3I6IC0+XG5cdFx0QGVuYWJsZWQgPSBmYWxzZVxuXHRcdEBsb2dnZXJzID0ge31cblx0XHRAcXVldWUgPSBbXVxuXG5cdFx0QHNob3dQYWNrYWdlID0gZmFsc2Vcblx0XHRAc2hvd0ZpbGVBbmRMaW5lID0gZmFsc2Vcblx0XHRAbG9nTGV2ZWwgPSAwXG5cblx0cmVnaXN0ZXI6IChsb2dnZXIpIC0+XG5cdFx0aWYgbm90IGxvZ2dlciBpbnN0YW5jZW9mIExvZ2dlclxuXHRcdFx0cmV0dXJuXG5cblx0XHRAbG9nZ2Vyc1tsb2dnZXIubmFtZV0gPSBsb2dnZXJcblxuXHRcdEBlbWl0ICdyZWdpc3RlcicsIGxvZ2dlclxuXG5cdGFkZFRvUXVldWU6IChsb2dnZXIsIGFyZ3MpLT5cblx0XHRAcXVldWUucHVzaFxuXHRcdFx0bG9nZ2VyOiBsb2dnZXJcblx0XHRcdGFyZ3M6IGFyZ3NcblxuXHRkaXNwYXRjaFF1ZXVlOiAtPlxuXHRcdGZvciBpdGVtIGluIEBxdWV1ZVxuXHRcdFx0aXRlbS5sb2dnZXIuX2xvZy5hcHBseSBpdGVtLmxvZ2dlciwgaXRlbS5hcmdzXG5cblx0XHRAY2xlYXJRdWV1ZSgpXG5cblx0Y2xlYXJRdWV1ZTogLT5cblx0XHRAcXVldWUgPSBbXVxuXG5cdGRpc2FibGU6IC0+XG5cdFx0QGVuYWJsZWQgPSBmYWxzZVxuXG5cdGVuYWJsZTogKGRpc3BhdGNoUXVldWU9ZmFsc2UpIC0+XG5cdFx0QGVuYWJsZWQgPSB0cnVlXG5cdFx0aWYgZGlzcGF0Y2hRdWV1ZSBpcyB0cnVlXG5cdFx0XHRAZGlzcGF0Y2hRdWV1ZSgpXG5cdFx0ZWxzZVxuXHRcdFx0QGNsZWFyUXVldWUoKVxuXG5cbiMgQExvZ2dlck1hbmFnZXIub24gJ3JlZ2lzdGVyJywgLT5cbiMgXHRjb25zb2xlLmxvZygnb24gcmVnaXN0ZXInLCBhcmd1bWVudHMpXG5cblxuQExvZ2dlciA9IGNsYXNzIExvZ2dlclxuXHRkZWZhdWx0VHlwZXM6XG5cdFx0ZGVidWc6XG5cdFx0XHRuYW1lOiAnZGVidWcnXG5cdFx0XHRjb2xvcjogJ2JsdWUnXG5cdFx0XHRsZXZlbDogMlxuXHRcdGxvZzpcblx0XHRcdG5hbWU6ICdpbmZvJ1xuXHRcdFx0Y29sb3I6ICdibHVlJ1xuXHRcdFx0bGV2ZWw6IDFcblx0XHRpbmZvOlxuXHRcdFx0bmFtZTogJ2luZm8nXG5cdFx0XHRjb2xvcjogJ2JsdWUnXG5cdFx0XHRsZXZlbDogMVxuXHRcdHN1Y2Nlc3M6XG5cdFx0XHRuYW1lOiAnaW5mbydcblx0XHRcdGNvbG9yOiAnZ3JlZW4nXG5cdFx0XHRsZXZlbDogMVxuXHRcdHdhcm46XG5cdFx0XHRuYW1lOiAnd2Fybidcblx0XHRcdGNvbG9yOiAnbWFnZW50YSdcblx0XHRcdGxldmVsOiAxXG5cdFx0ZXJyb3I6XG5cdFx0XHRuYW1lOiAnZXJyb3InXG5cdFx0XHRjb2xvcjogJ3JlZCdcblx0XHRcdGxldmVsOiAwXG5cblx0Y29uc3RydWN0b3I6IChAbmFtZSwgY29uZmlnPXt9KSAtPlxuXHRcdHNlbGYgPSBAXG5cdFx0QGNvbmZpZyA9IHt9XG5cblx0XHRfLmV4dGVuZCBAY29uZmlnLCBjb25maWdcblxuXHRcdGlmIExvZ2dlck1hbmFnZXIubG9nZ2Vyc1tAbmFtZV0/XG5cdFx0XHRMb2dnZXJNYW5hZ2VyLmxvZ2dlcnNbQG5hbWVdLndhcm4gJ0R1cGxpY2F0ZWQgaW5zdGFuY2UnXG5cdFx0XHRyZXR1cm4gTG9nZ2VyTWFuYWdlci5sb2dnZXJzW0BuYW1lXVxuXG5cdFx0Zm9yIHR5cGUsIHR5cGVDb25maWcgb2YgQGRlZmF1bHRUeXBlc1xuXHRcdFx0ZG8gKHR5cGUsIHR5cGVDb25maWcpIC0+XG5cdFx0XHRcdHNlbGZbdHlwZV0gPSAoYXJncy4uLikgLT5cblx0XHRcdFx0XHRzZWxmLl9sb2cuY2FsbCBzZWxmLFxuXHRcdFx0XHRcdFx0c2VjdGlvbjogdGhpcy5fX3NlY3Rpb25cblx0XHRcdFx0XHRcdHR5cGU6IHR5cGVcblx0XHRcdFx0XHRcdGxldmVsOiB0eXBlQ29uZmlnLmxldmVsXG5cdFx0XHRcdFx0XHRtZXRob2Q6IHR5cGVDb25maWcubmFtZVxuXHRcdFx0XHRcdFx0YXJndW1lbnRzOiBhcmdzXG5cblx0XHRcdFx0c2VsZlt0eXBlK1wiX2JveFwiXSA9IChhcmdzLi4uKSAtPlxuXHRcdFx0XHRcdHNlbGYuX2xvZy5jYWxsIHNlbGYsXG5cdFx0XHRcdFx0XHRzZWN0aW9uOiB0aGlzLl9fc2VjdGlvblxuXHRcdFx0XHRcdFx0dHlwZTogdHlwZVxuXHRcdFx0XHRcdFx0Ym94OiB0cnVlXG5cdFx0XHRcdFx0XHRsZXZlbDogdHlwZUNvbmZpZy5sZXZlbFxuXHRcdFx0XHRcdFx0bWV0aG9kOiB0eXBlQ29uZmlnLm5hbWVcblx0XHRcdFx0XHRcdGFyZ3VtZW50czogYXJnc1xuXG5cdFx0aWYgQGNvbmZpZy5tZXRob2RzP1xuXHRcdFx0Zm9yIG1ldGhvZCwgdHlwZUNvbmZpZyBvZiBAY29uZmlnLm1ldGhvZHNcblx0XHRcdFx0ZG8gKG1ldGhvZCwgdHlwZUNvbmZpZykgLT5cblx0XHRcdFx0XHRpZiBzZWxmW21ldGhvZF0/XG5cdFx0XHRcdFx0XHRzZWxmLndhcm4gXCJNZXRob2RcIiwgbWV0aG9kLCBcImFscmVhZHkgZXhpc3RzXCJcblxuXHRcdFx0XHRcdGlmIG5vdCBzZWxmLmRlZmF1bHRUeXBlc1t0eXBlQ29uZmlnLnR5cGVdP1xuXHRcdFx0XHRcdFx0c2VsZi53YXJuIFwiTWV0aG9kIHR5cGVcIiwgdHlwZUNvbmZpZy50eXBlLCBcImRvZXMgbm90IGV4aXN0XCJcblxuXHRcdFx0XHRcdHNlbGZbbWV0aG9kXSA9IChhcmdzLi4uKSAtPlxuXHRcdFx0XHRcdFx0c2VsZi5fbG9nLmNhbGwgc2VsZixcblx0XHRcdFx0XHRcdFx0c2VjdGlvbjogdGhpcy5fX3NlY3Rpb25cblx0XHRcdFx0XHRcdFx0dHlwZTogdHlwZUNvbmZpZy50eXBlXG5cdFx0XHRcdFx0XHRcdGxldmVsOiBpZiB0eXBlQ29uZmlnLmxldmVsPyB0aGVuIHR5cGVDb25maWcubGV2ZWwgZWxzZSBzZWxmLmRlZmF1bHRUeXBlc1t0eXBlQ29uZmlnLnR5cGVdPy5sZXZlbFxuXHRcdFx0XHRcdFx0XHRtZXRob2Q6IG1ldGhvZFxuXHRcdFx0XHRcdFx0XHRhcmd1bWVudHM6IGFyZ3NcblxuXHRcdFx0XHRcdHNlbGZbbWV0aG9kK1wiX2JveFwiXSA9IChhcmdzLi4uKSAtPlxuXHRcdFx0XHRcdFx0c2VsZi5fbG9nLmNhbGwgc2VsZixcblx0XHRcdFx0XHRcdFx0c2VjdGlvbjogdGhpcy5fX3NlY3Rpb25cblx0XHRcdFx0XHRcdFx0dHlwZTogdHlwZUNvbmZpZy50eXBlXG5cdFx0XHRcdFx0XHRcdGJveDogdHJ1ZVxuXHRcdFx0XHRcdFx0XHRsZXZlbDogaWYgdHlwZUNvbmZpZy5sZXZlbD8gdGhlbiB0eXBlQ29uZmlnLmxldmVsIGVsc2Ugc2VsZi5kZWZhdWx0VHlwZXNbdHlwZUNvbmZpZy50eXBlXT8ubGV2ZWxcblx0XHRcdFx0XHRcdFx0bWV0aG9kOiBtZXRob2Rcblx0XHRcdFx0XHRcdFx0YXJndW1lbnRzOiBhcmdzXG5cblx0XHRpZiBAY29uZmlnLnNlY3Rpb25zP1xuXHRcdFx0Zm9yIHNlY3Rpb24sIG5hbWUgb2YgQGNvbmZpZy5zZWN0aW9uc1xuXHRcdFx0XHRkbyAoc2VjdGlvbiwgbmFtZSkgLT5cblx0XHRcdFx0XHRzZWxmW3NlY3Rpb25dID0ge31cblx0XHRcdFx0XHRmb3IgdHlwZSwgdHlwZUNvbmZpZyBvZiBzZWxmLmRlZmF1bHRUeXBlc1xuXHRcdFx0XHRcdFx0ZG8gKHR5cGUsIHR5cGVDb25maWcpID0+XG5cdFx0XHRcdFx0XHRcdHNlbGZbc2VjdGlvbl1bdHlwZV0gPSA9PlxuXHRcdFx0XHRcdFx0XHRcdHNlbGZbdHlwZV0uYXBwbHkge19fc2VjdGlvbjogbmFtZX0sIGFyZ3VtZW50c1xuXG5cdFx0XHRcdFx0XHRcdHNlbGZbc2VjdGlvbl1bdHlwZStcIl9ib3hcIl0gPSA9PlxuXHRcdFx0XHRcdFx0XHRcdHNlbGZbdHlwZStcIl9ib3hcIl0uYXBwbHkge19fc2VjdGlvbjogbmFtZX0sIGFyZ3VtZW50c1xuXG5cdFx0XHRcdFx0Zm9yIG1ldGhvZCwgdHlwZUNvbmZpZyBvZiBzZWxmLmNvbmZpZy5tZXRob2RzXG5cdFx0XHRcdFx0XHRkbyAobWV0aG9kLCB0eXBlQ29uZmlnKSA9PlxuXHRcdFx0XHRcdFx0XHRzZWxmW3NlY3Rpb25dW21ldGhvZF0gPSA9PlxuXHRcdFx0XHRcdFx0XHRcdHNlbGZbbWV0aG9kXS5hcHBseSB7X19zZWN0aW9uOiBuYW1lfSwgYXJndW1lbnRzXG5cblx0XHRcdFx0XHRcdFx0c2VsZltzZWN0aW9uXVttZXRob2QrXCJfYm94XCJdID0gPT5cblx0XHRcdFx0XHRcdFx0XHRzZWxmW21ldGhvZCtcIl9ib3hcIl0uYXBwbHkge19fc2VjdGlvbjogbmFtZX0sIGFyZ3VtZW50c1xuXG5cdFx0TG9nZ2VyTWFuYWdlci5yZWdpc3RlciBAXG5cdFx0cmV0dXJuIEBcblxuXHRnZXRQcmVmaXg6IChvcHRpb25zKSAtPlxuXHRcdGlmIG9wdGlvbnMuc2VjdGlvbj9cblx0XHRcdHByZWZpeCA9IFwiI3tAbmFtZX0g4p6UICN7b3B0aW9ucy5zZWN0aW9ufS4je29wdGlvbnMubWV0aG9kfVwiXG5cdFx0ZWxzZVxuXHRcdFx0cHJlZml4ID0gXCIje0BuYW1lfSDinpQgI3tvcHRpb25zLm1ldGhvZH1cIlxuXG5cdFx0ZGV0YWlscyA9IEBfZ2V0Q2FsbGVyRGV0YWlscygpXG5cblx0XHRkZXRhaWxQYXJ0cyA9IFtdXG5cdFx0aWYgZGV0YWlscy5wYWNrYWdlPyBhbmQgKExvZ2dlck1hbmFnZXIuc2hvd1BhY2thZ2UgaXMgdHJ1ZSBvciBvcHRpb25zLnR5cGUgaXMgJ2Vycm9yJylcblx0XHRcdGRldGFpbFBhcnRzLnB1c2ggZGV0YWlscy5wYWNrYWdlXG5cblx0XHRpZiBMb2dnZXJNYW5hZ2VyLnNob3dGaWxlQW5kTGluZSBpcyB0cnVlIG9yIG9wdGlvbnMudHlwZSBpcyAnZXJyb3InXG5cdFx0XHRpZiBkZXRhaWxzLmZpbGU/IGFuZCBkZXRhaWxzLmxpbmU/XG5cdFx0XHRcdGRldGFpbFBhcnRzLnB1c2ggXCIje2RldGFpbHMuZmlsZX06I3tkZXRhaWxzLmxpbmV9XCJcblx0XHRcdGVsc2Vcblx0XHRcdFx0aWYgZGV0YWlscy5maWxlP1xuXHRcdFx0XHRcdGRldGFpbFBhcnRzLnB1c2ggZGV0YWlscy5maWxlXG5cdFx0XHRcdGlmIGRldGFpbHMubGluZT9cblx0XHRcdFx0XHRkZXRhaWxQYXJ0cy5wdXNoIGRldGFpbHMubGluZVxuXG5cdFx0aWYgQGRlZmF1bHRUeXBlc1tvcHRpb25zLnR5cGVdP1xuI1x0XHRcdHByZWZpeCA9IHByZWZpeFtAZGVmYXVsdFR5cGVzW29wdGlvbnMudHlwZV0uY29sb3JdIOeUseS6jmNvbG9ycyDljIXnmoTpl67popjvvIzmnI3liqHnq6/mmoLml7bkuI3mlK/mjIFsb2cgY29sb3Ig5pi+56S6XG5cdFx0XHRwcmVmaXggPSBjaGFsa1tAZGVmYXVsdFR5cGVzW29wdGlvbnMudHlwZV0uY29sb3JdKHByZWZpeClcblxuXHRcdGlmIGRldGFpbFBhcnRzLmxlbmd0aCA+IDBcblx0XHRcdHByZWZpeCA9IFwiI3tkZXRhaWxQYXJ0cy5qb2luKCcgJyl9ICN7cHJlZml4fVwiXG5cblx0XHRyZXR1cm4gcHJlZml4XG5cblx0IyBAcmV0dXJucyB7T2JqZWN0OiB7IGxpbmU6IE51bWJlciwgZmlsZTogU3RyaW5nIH19XG5cdF9nZXRDYWxsZXJEZXRhaWxzOiAtPlxuXHRcdGdldFN0YWNrID0gKCkgLT5cblx0XHRcdCMgV2UgZG8gTk9UIHVzZSBFcnJvci5wcmVwYXJlU3RhY2tUcmFjZSBoZXJlIChhIFY4IGV4dGVuc2lvbiB0aGF0IGdldHMgdXMgYVxuXHRcdFx0IyBwcmUtcGFyc2VkIHN0YWNrKSBzaW5jZSBpdCdzIGltcG9zc2libGUgdG8gY29tcG9zZSBpdCB3aXRoIHRoZSB1c2Ugb2Zcblx0XHRcdCMgRXJyb3IucHJlcGFyZVN0YWNrVHJhY2UgdXNlZCBvbiB0aGUgc2VydmVyIGZvciBzb3VyY2UgbWFwcy5cblx0XHRcdGVyciA9IG5ldyBFcnJvclxuXHRcdFx0c3RhY2sgPSBlcnIuc3RhY2tcblx0XHRcdHJldHVybiBzdGFja1xuXG5cdFx0c3RhY2sgPSBnZXRTdGFjaygpXG5cblx0XHRpZiBub3Qgc3RhY2tcblx0XHRcdHJldHVybiB7fVxuXG5cdFx0bGluZXMgPSBzdGFjay5zcGxpdCgnXFxuJylcblxuXHRcdCMgbG9va2luZyBmb3IgdGhlIGZpcnN0IGxpbmUgb3V0c2lkZSB0aGUgbG9nZ2luZyBwYWNrYWdlIChvciBhblxuXHRcdCMgZXZhbCBpZiB3ZSBmaW5kIHRoYXQgZmlyc3QpXG5cdFx0bGluZSA9IHVuZGVmaW5lZFxuXHRcdGZvciBpdGVtLCBpbmRleCBpbiBsaW5lcyB3aGVuIGluZGV4ID4gMFxuXHRcdFx0bGluZSA9IGl0ZW1cblx0XHRcdGlmIGxpbmUubWF0Y2goL15cXHMqYXQgZXZhbCBcXChldmFsLylcblx0XHRcdFx0cmV0dXJuIHtmaWxlOiBcImV2YWxcIn1cblxuXHRcdFx0aWYgbm90IGxpbmUubWF0Y2goL3BhY2thZ2VzXFwvcm9ja2V0Y2hhdF9sb2dnZXIoPzpcXC98XFwuanMpLylcblx0XHRcdFx0YnJlYWtcblxuXHRcdGRldGFpbHMgPSB7fVxuXG5cdFx0IyBUaGUgZm9ybWF0IGZvciBGRiBpcyAnZnVuY3Rpb25OYW1lQGZpbGVQYXRoOmxpbmVOdW1iZXInXG5cdFx0IyBUaGUgZm9ybWF0IGZvciBWOCBpcyAnZnVuY3Rpb25OYW1lIChwYWNrYWdlcy9sb2dnaW5nL2xvZ2dpbmcuanM6ODEpJyBvclxuXHRcdCMgICAgICAgICAgICAgICAgICAgICAgJ3BhY2thZ2VzL2xvZ2dpbmcvbG9nZ2luZy5qczo4MSdcblx0XHRtYXRjaCA9IC8oPzpbQChdfCBhdCApKFteKF0rPyk6KFswLTk6XSspKD86XFwpfCQpLy5leGVjKGxpbmUpXG5cdFx0aWYgbm90IG1hdGNoXG5cdFx0XHRyZXR1cm4gZGV0YWlsc1xuXHRcdCMgaW4gY2FzZSB0aGUgbWF0Y2hlZCBibG9jayBoZXJlIGlzIGxpbmU6Y29sdW1uXG5cdFx0ZGV0YWlscy5saW5lID0gbWF0Y2hbMl0uc3BsaXQoJzonKVswXVxuXG5cdFx0IyBQb3NzaWJsZSBmb3JtYXQ6IGh0dHBzOi8vZm9vLmJhci5jb20vc2NyaXB0cy9maWxlLmpzP3JhbmRvbT1mb29iYXJcblx0XHQjIFhYWDogaWYgeW91IGNhbiB3cml0ZSB0aGUgZm9sbG93aW5nIGluIGJldHRlciB3YXksIHBsZWFzZSBkbyBpdFxuXHRcdCMgWFhYOiB3aGF0IGFib3V0IGV2YWxzP1xuXHRcdGRldGFpbHMuZmlsZSA9IG1hdGNoWzFdLnNwbGl0KCcvJykuc2xpY2UoLTEpWzBdLnNwbGl0KCc/JylbMF1cblxuXHRcdHBhY2thZ2VNYXRjaCA9IG1hdGNoWzFdLm1hdGNoKC9wYWNrYWdlc1xcLyhbXlxcLlxcL10rKSg/OlxcL3xcXC4pLylcblx0XHRpZiBwYWNrYWdlTWF0Y2g/XG5cdFx0XHRkZXRhaWxzLnBhY2thZ2UgPSBwYWNrYWdlTWF0Y2hbMV1cblxuXHRcdHJldHVybiBkZXRhaWxzXG5cblx0bWFrZUFCb3g6IChtZXNzYWdlLCB0aXRsZSkgLT5cblx0XHRpZiBub3QgXy5pc0FycmF5KG1lc3NhZ2UpXG5cdFx0XHRtZXNzYWdlID0gbWVzc2FnZS5zcGxpdChcIlxcblwiKVxuXG5cdFx0bGVuID0gMFxuXHRcdGZvciBsaW5lIGluIG1lc3NhZ2Vcblx0XHRcdGxlbiA9IE1hdGgubWF4KGxlbiwgbGluZS5sZW5ndGgpXG5cblx0XHR0b3BMaW5lID0gXCIrLS1cIiArIHMucGFkKCcnLCBsZW4sICctJykgKyBcIi0tK1wiXG5cdFx0c2VwYXJhdG9yID0gXCJ8ICBcIiArIHMucGFkKCcnLCBsZW4sICcnKSArIFwiICB8XCJcblx0XHRsaW5lcyA9IFtdXG5cblx0XHRsaW5lcy5wdXNoIHRvcExpbmVcblx0XHRpZiB0aXRsZT9cblx0XHRcdGxpbmVzLnB1c2ggXCJ8ICBcIiArIHMubHJwYWQodGl0bGUsIGxlbikgKyBcIiAgfFwiXG5cdFx0XHRsaW5lcy5wdXNoIHRvcExpbmVcblxuXHRcdGxpbmVzLnB1c2ggc2VwYXJhdG9yXG5cblx0XHRmb3IgbGluZSBpbiBtZXNzYWdlXG5cdFx0XHRsaW5lcy5wdXNoIFwifCAgXCIgKyBzLnJwYWQobGluZSwgbGVuKSArIFwiICB8XCJcblxuXHRcdGxpbmVzLnB1c2ggc2VwYXJhdG9yXG5cdFx0bGluZXMucHVzaCB0b3BMaW5lXG5cdFx0cmV0dXJuIGxpbmVzXG5cblxuXHRfbG9nOiAob3B0aW9ucykgLT5cblx0XHRpZiBMb2dnZXJNYW5hZ2VyLmVuYWJsZWQgaXMgZmFsc2Vcblx0XHRcdExvZ2dlck1hbmFnZXIuYWRkVG9RdWV1ZSBALCBhcmd1bWVudHNcblx0XHRcdHJldHVyblxuXG5cdFx0b3B0aW9ucy5sZXZlbCA/PSAxXG5cblx0XHRpZiBMb2dnZXJNYW5hZ2VyLmxvZ0xldmVsIDwgb3B0aW9ucy5sZXZlbFxuXHRcdFx0cmV0dXJuXG5cblx0XHRwcmVmaXggPSBAZ2V0UHJlZml4KG9wdGlvbnMpXG5cblx0XHRpZiBvcHRpb25zLmJveCBpcyB0cnVlIGFuZCBfLmlzU3RyaW5nKG9wdGlvbnMuYXJndW1lbnRzWzBdKVxuXHRcdFx0Y29sb3IgPSB1bmRlZmluZWRcblx0XHRcdGlmIEBkZWZhdWx0VHlwZXNbb3B0aW9ucy50eXBlXT9cblx0XHRcdFx0Y29sb3IgPSBAZGVmYXVsdFR5cGVzW29wdGlvbnMudHlwZV0uY29sb3JcblxuXHRcdFx0Ym94ID0gQG1ha2VBQm94IG9wdGlvbnMuYXJndW1lbnRzWzBdLCBvcHRpb25zLmFyZ3VtZW50c1sxXVxuXHRcdFx0c3ViUHJlZml4ID0gJ+KelCdcblx0XHRcdGlmIGNvbG9yP1xuXHRcdFx0XHRzdWJQcmVmaXggPSBzdWJQcmVmaXhbY29sb3JdXG5cblx0XHRcdGNvbnNvbGUubG9nIHN1YlByZWZpeCwgcHJlZml4XG5cdFx0XHRmb3IgbGluZSBpbiBib3hcblx0XHRcdFx0aWYgY29sb3I/XG5cdFx0XHRcdFx0Y29uc29sZS5sb2cgc3ViUHJlZml4LCBsaW5lW2NvbG9yXVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0Y29uc29sZS5sb2cgc3ViUHJlZml4LCBsaW5lXG5cdFx0ZWxzZVxuXHRcdFx0b3B0aW9ucy5hcmd1bWVudHMudW5zaGlmdCBwcmVmaXhcblx0XHRcdGNvbnNvbGUubG9nLmFwcGx5IGNvbnNvbGUsIG9wdGlvbnMuYXJndW1lbnRzXG5cblx0XHRyZXR1cm5cblxuXG5AU3lzdGVtTG9nZ2VyID0gbmV3IExvZ2dlciAnU3lzdGVtJyxcblx0bWV0aG9kczpcblx0XHRzdGFydHVwOlxuXHRcdFx0dHlwZTogJ3N1Y2Nlc3MnXG5cdFx0XHRsZXZlbDogMFxuXG5wcm9jZXNzU3RyaW5nID0gKHN0cmluZywgZGF0ZSkgLT5cblx0aWYgc3RyaW5nWzBdIGlzICd7J1xuXHRcdHRyeVxuXHRcdFx0cmV0dXJuIExvZy5mb3JtYXQgRUpTT04ucGFyc2Uoc3RyaW5nKSwge2NvbG9yOiB0cnVlfVxuXG5cdHRyeVxuXHRcdHJldHVybiBMb2cuZm9ybWF0IHttZXNzYWdlOiBzdHJpbmcsIHRpbWU6IGRhdGUsIGxldmVsOiAnaW5mbyd9LCB7Y29sb3I6IHRydWV9XG5cblx0cmV0dXJuIHN0cmluZ1xuXG5TdGRPdXQgPSBuZXcgY2xhc3MgZXh0ZW5kcyBFdmVudEVtaXR0ZXJcblx0Y29uc3RydWN0b3I6IC0+XG5cdFx0QHF1ZXVlID0gW11cblx0XHR3cml0ZSA9IHByb2Nlc3Muc3Rkb3V0LndyaXRlXG5cdFx0cHJvY2Vzcy5zdGRvdXQud3JpdGUgPSAoc3RyaW5nLCBlbmNvZGluZywgZmQpID0+XG5cdFx0XHR3cml0ZS5hcHBseShwcm9jZXNzLnN0ZG91dCwgYXJndW1lbnRzKVxuXHRcdFx0ZGF0ZSA9IG5ldyBEYXRlXG5cdFx0XHRzdHJpbmcgPSBwcm9jZXNzU3RyaW5nIHN0cmluZywgZGF0ZVxuXG5cdFx0XHRpdGVtID1cblx0XHRcdFx0aWQ6IFJhbmRvbS5pZCgpXG5cdFx0XHRcdHN0cmluZzogc3RyaW5nXG5cdFx0XHRcdHRzOiBkYXRlXG5cblx0XHRcdEBxdWV1ZS5wdXNoIGl0ZW1cblxuXHRcdFx0IyBpZiBSb2NrZXRDaGF0Py5zZXR0aW5ncz8uZ2V0KCdMb2dfVmlld19MaW1pdCcpPyBhbmQgQHF1ZXVlLmxlbmd0aCA+IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMb2dfVmlld19MaW1pdCcpXG5cdFx0XHQjIFx0QHF1ZXVlLnNoaWZ0KClcblxuXHRcdFx0dmlld0xpbWl0ID0gTWV0ZW9yLnNldHRpbmdzPy5sb2dnZXI/LnZpZXdMaW1pdFxuXHRcdFx0dW5sZXNzIHZpZXdMaW1pdFxuXHRcdFx0XHR2aWV3TGltaXQgPSAxMDAwXG5cdFx0XHRpZiBAcXVldWUubGVuZ3RoID4gdmlld0xpbWl0XG5cdFx0XHRcdEBxdWV1ZS5zaGlmdCgpXG5cblx0XHRcdEBlbWl0ICd3cml0ZScsIHN0cmluZywgaXRlbVxuXG5cbk1ldGVvci5wdWJsaXNoICdzdGRvdXQnLCAtPlxuXHR1bmxlc3MgQHVzZXJJZFxuXHRcdHJldHVybiBAcmVhZHkoKVxuXG5cdCMgaWYgUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKEB1c2VySWQsICd2aWV3LWxvZ3MnKSBpc250IHRydWVcblx0IyBcdHJldHVybiBAcmVhZHkoKVxuXG5cdHVubGVzcyBAdXNlcklkXG5cdFx0cmV0dXJuIEByZWFkeSgpXG5cdFxuXHR1c2VyID0gZGIudXNlcnMuZmluZE9uZShAdXNlcklkLCB7ZmllbGRzOiB7aXNfY2xvdWRhZG1pbjogMX19KVxuXG5cdHVubGVzcyB1c2VyXG5cdFx0cmV0dXJuIEByZWFkeSgpXG5cblx0Zm9yIGl0ZW0gaW4gU3RkT3V0LnF1ZXVlXG5cdFx0QGFkZGVkICdzdGRvdXQnLCBpdGVtLmlkLFxuXHRcdFx0c3RyaW5nOiBpdGVtLnN0cmluZ1xuXHRcdFx0dHM6IGl0ZW0udHNcblxuXHRAcmVhZHkoKVxuXG5cdFN0ZE91dC5vbiAnd3JpdGUnLCAoc3RyaW5nLCBpdGVtKSA9PlxuXHRcdEBhZGRlZCAnc3Rkb3V0JywgaXRlbS5pZCxcblx0XHRcdHN0cmluZzogaXRlbS5zdHJpbmdcblx0XHRcdHRzOiBpdGVtLnRzXG5cblx0cmV0dXJuXG5cbk1ldGVvci5zdGFydHVwIC0+XG5cdGlmIE1ldGVvci5zZXR0aW5ncz8ubG9nZ2VyPy5lbmFibGVkXG5cdFx0aWYgTWV0ZW9yLnNldHRpbmdzPy5sb2dnZXI/LnNob3dQYWNrYWdlXG5cdFx0XHRMb2dnZXJNYW5hZ2VyLnNob3dQYWNrYWdlID0gdHJ1ZTtcblx0XHRpZiBNZXRlb3Iuc2V0dGluZ3M/LmxvZ2dlcj8uc2hvd0ZpbGVBbmRMaW5lXG5cdFx0XHRMb2dnZXJNYW5hZ2VyLnNob3dGaWxlQW5kTGluZSA9IHRydWU7XG5cdFx0aWYgTWV0ZW9yLnNldHRpbmdzPy5sb2dnZXI/LmxvZ0xldmVsXG5cdFx0XHRMb2dnZXJNYW5hZ2VyLmxvZ0xldmVsID0gTWV0ZW9yLnNldHRpbmdzLmxvZ2dlci5sb2dMZXZlbDtcblxuXHRcdExvZ2dlck1hbmFnZXIuZW5hYmxlKHRydWUpO1xuXG4iLCJ2YXIgU3RkT3V0LCBjaGFsaywgcHJvY2Vzc1N0cmluZywgICAgICAgIFxuICBleHRlbmQgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH0sXG4gIGhhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eSxcbiAgc2xpY2UgPSBbXS5zbGljZTtcblxuY2hhbGsgPSByZXF1aXJlKFwiY2hhbGtcIik7XG5cbmNoYWxrLmVuYWJsZWQgPSB0cnVlO1xuXG50aGlzLkxvZ2dlck1hbmFnZXIgPSBuZXcgKChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gIGV4dGVuZChfQ2xhc3MsIHN1cGVyQ2xhc3MpO1xuXG4gIGZ1bmN0aW9uIF9DbGFzcygpIHtcbiAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcbiAgICB0aGlzLmxvZ2dlcnMgPSB7fTtcbiAgICB0aGlzLnF1ZXVlID0gW107XG4gICAgdGhpcy5zaG93UGFja2FnZSA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd0ZpbGVBbmRMaW5lID0gZmFsc2U7XG4gICAgdGhpcy5sb2dMZXZlbCA9IDA7XG4gIH1cblxuICBfQ2xhc3MucHJvdG90eXBlLnJlZ2lzdGVyID0gZnVuY3Rpb24obG9nZ2VyKSB7XG4gICAgaWYgKCFsb2dnZXIgaW5zdGFuY2VvZiBMb2dnZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5sb2dnZXJzW2xvZ2dlci5uYW1lXSA9IGxvZ2dlcjtcbiAgICByZXR1cm4gdGhpcy5lbWl0KCdyZWdpc3RlcicsIGxvZ2dlcik7XG4gIH07XG5cbiAgX0NsYXNzLnByb3RvdHlwZS5hZGRUb1F1ZXVlID0gZnVuY3Rpb24obG9nZ2VyLCBhcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMucXVldWUucHVzaCh7XG4gICAgICBsb2dnZXI6IGxvZ2dlcixcbiAgICAgIGFyZ3M6IGFyZ3NcbiAgICB9KTtcbiAgfTtcblxuICBfQ2xhc3MucHJvdG90eXBlLmRpc3BhdGNoUXVldWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaSwgaXRlbSwgbGVuMSwgcmVmO1xuICAgIHJlZiA9IHRoaXMucXVldWU7XG4gICAgZm9yIChpID0gMCwgbGVuMSA9IHJlZi5sZW5ndGg7IGkgPCBsZW4xOyBpKyspIHtcbiAgICAgIGl0ZW0gPSByZWZbaV07XG4gICAgICBpdGVtLmxvZ2dlci5fbG9nLmFwcGx5KGl0ZW0ubG9nZ2VyLCBpdGVtLmFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5jbGVhclF1ZXVlKCk7XG4gIH07XG5cbiAgX0NsYXNzLnByb3RvdHlwZS5jbGVhclF1ZXVlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMucXVldWUgPSBbXTtcbiAgfTtcblxuICBfQ2xhc3MucHJvdG90eXBlLmRpc2FibGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5lbmFibGVkID0gZmFsc2U7XG4gIH07XG5cbiAgX0NsYXNzLnByb3RvdHlwZS5lbmFibGUgPSBmdW5jdGlvbihkaXNwYXRjaFF1ZXVlKSB7XG4gICAgaWYgKGRpc3BhdGNoUXVldWUgPT0gbnVsbCkge1xuICAgICAgZGlzcGF0Y2hRdWV1ZSA9IGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmVuYWJsZWQgPSB0cnVlO1xuICAgIGlmIChkaXNwYXRjaFF1ZXVlID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gdGhpcy5kaXNwYXRjaFF1ZXVlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLmNsZWFyUXVldWUoKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIF9DbGFzcztcblxufSkoRXZlbnRFbWl0dGVyKSk7XG5cbnRoaXMuTG9nZ2VyID0gTG9nZ2VyID0gKGZ1bmN0aW9uKCkge1xuICBMb2dnZXIucHJvdG90eXBlLmRlZmF1bHRUeXBlcyA9IHtcbiAgICBkZWJ1Zzoge1xuICAgICAgbmFtZTogJ2RlYnVnJyxcbiAgICAgIGNvbG9yOiAnYmx1ZScsXG4gICAgICBsZXZlbDogMlxuICAgIH0sXG4gICAgbG9nOiB7XG4gICAgICBuYW1lOiAnaW5mbycsXG4gICAgICBjb2xvcjogJ2JsdWUnLFxuICAgICAgbGV2ZWw6IDFcbiAgICB9LFxuICAgIGluZm86IHtcbiAgICAgIG5hbWU6ICdpbmZvJyxcbiAgICAgIGNvbG9yOiAnYmx1ZScsXG4gICAgICBsZXZlbDogMVxuICAgIH0sXG4gICAgc3VjY2Vzczoge1xuICAgICAgbmFtZTogJ2luZm8nLFxuICAgICAgY29sb3I6ICdncmVlbicsXG4gICAgICBsZXZlbDogMVxuICAgIH0sXG4gICAgd2Fybjoge1xuICAgICAgbmFtZTogJ3dhcm4nLFxuICAgICAgY29sb3I6ICdtYWdlbnRhJyxcbiAgICAgIGxldmVsOiAxXG4gICAgfSxcbiAgICBlcnJvcjoge1xuICAgICAgbmFtZTogJ2Vycm9yJyxcbiAgICAgIGNvbG9yOiAncmVkJyxcbiAgICAgIGxldmVsOiAwXG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIExvZ2dlcihuYW1lMSwgY29uZmlnKSB7XG4gICAgdmFyIGZuLCBmbjEsIGZuMiwgbWV0aG9kLCBuYW1lLCByZWYsIHJlZjEsIHJlZjIsIHNlY3Rpb24sIHNlbGYsIHR5cGUsIHR5cGVDb25maWc7XG4gICAgdGhpcy5uYW1lID0gbmFtZTE7XG4gICAgaWYgKGNvbmZpZyA9PSBudWxsKSB7XG4gICAgICBjb25maWcgPSB7fTtcbiAgICB9XG4gICAgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5jb25maWcgPSB7fTtcbiAgICBfLmV4dGVuZCh0aGlzLmNvbmZpZywgY29uZmlnKTtcbiAgICBpZiAoTG9nZ2VyTWFuYWdlci5sb2dnZXJzW3RoaXMubmFtZV0gIT0gbnVsbCkge1xuICAgICAgTG9nZ2VyTWFuYWdlci5sb2dnZXJzW3RoaXMubmFtZV0ud2FybignRHVwbGljYXRlZCBpbnN0YW5jZScpO1xuICAgICAgcmV0dXJuIExvZ2dlck1hbmFnZXIubG9nZ2Vyc1t0aGlzLm5hbWVdO1xuICAgIH1cbiAgICByZWYgPSB0aGlzLmRlZmF1bHRUeXBlcztcbiAgICBmbiA9IGZ1bmN0aW9uKHR5cGUsIHR5cGVDb25maWcpIHtcbiAgICAgIHNlbGZbdHlwZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3M7XG4gICAgICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBzbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICAgICAgcmV0dXJuIHNlbGYuX2xvZy5jYWxsKHNlbGYsIHtcbiAgICAgICAgICBzZWN0aW9uOiB0aGlzLl9fc2VjdGlvbixcbiAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgIGxldmVsOiB0eXBlQ29uZmlnLmxldmVsLFxuICAgICAgICAgIG1ldGhvZDogdHlwZUNvbmZpZy5uYW1lLFxuICAgICAgICAgIFwiYXJndW1lbnRzXCI6IGFyZ3NcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgcmV0dXJuIHNlbGZbdHlwZSArIFwiX2JveFwiXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYXJncztcbiAgICAgICAgYXJncyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgICByZXR1cm4gc2VsZi5fbG9nLmNhbGwoc2VsZiwge1xuICAgICAgICAgIHNlY3Rpb246IHRoaXMuX19zZWN0aW9uLFxuICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgYm94OiB0cnVlLFxuICAgICAgICAgIGxldmVsOiB0eXBlQ29uZmlnLmxldmVsLFxuICAgICAgICAgIG1ldGhvZDogdHlwZUNvbmZpZy5uYW1lLFxuICAgICAgICAgIFwiYXJndW1lbnRzXCI6IGFyZ3NcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH07XG4gICAgZm9yICh0eXBlIGluIHJlZikge1xuICAgICAgdHlwZUNvbmZpZyA9IHJlZlt0eXBlXTtcbiAgICAgIGZuKHR5cGUsIHR5cGVDb25maWcpO1xuICAgIH1cbiAgICBpZiAodGhpcy5jb25maWcubWV0aG9kcyAhPSBudWxsKSB7XG4gICAgICByZWYxID0gdGhpcy5jb25maWcubWV0aG9kcztcbiAgICAgIGZuMSA9IGZ1bmN0aW9uKG1ldGhvZCwgdHlwZUNvbmZpZykge1xuICAgICAgICBpZiAoc2VsZlttZXRob2RdICE9IG51bGwpIHtcbiAgICAgICAgICBzZWxmLndhcm4oXCJNZXRob2RcIiwgbWV0aG9kLCBcImFscmVhZHkgZXhpc3RzXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzZWxmLmRlZmF1bHRUeXBlc1t0eXBlQ29uZmlnLnR5cGVdID09IG51bGwpIHtcbiAgICAgICAgICBzZWxmLndhcm4oXCJNZXRob2QgdHlwZVwiLCB0eXBlQ29uZmlnLnR5cGUsIFwiZG9lcyBub3QgZXhpc3RcIik7XG4gICAgICAgIH1cbiAgICAgICAgc2VsZlttZXRob2RdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGFyZ3MsIHJlZjI7XG4gICAgICAgICAgYXJncyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgICAgIHJldHVybiBzZWxmLl9sb2cuY2FsbChzZWxmLCB7XG4gICAgICAgICAgICBzZWN0aW9uOiB0aGlzLl9fc2VjdGlvbixcbiAgICAgICAgICAgIHR5cGU6IHR5cGVDb25maWcudHlwZSxcbiAgICAgICAgICAgIGxldmVsOiB0eXBlQ29uZmlnLmxldmVsICE9IG51bGwgPyB0eXBlQ29uZmlnLmxldmVsIDogKHJlZjIgPSBzZWxmLmRlZmF1bHRUeXBlc1t0eXBlQ29uZmlnLnR5cGVdKSAhPSBudWxsID8gcmVmMi5sZXZlbCA6IHZvaWQgMCxcbiAgICAgICAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgICAgICAgXCJhcmd1bWVudHNcIjogYXJnc1xuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gc2VsZlttZXRob2QgKyBcIl9ib3hcIl0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgYXJncywgcmVmMjtcbiAgICAgICAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgICAgICAgcmV0dXJuIHNlbGYuX2xvZy5jYWxsKHNlbGYsIHtcbiAgICAgICAgICAgIHNlY3Rpb246IHRoaXMuX19zZWN0aW9uLFxuICAgICAgICAgICAgdHlwZTogdHlwZUNvbmZpZy50eXBlLFxuICAgICAgICAgICAgYm94OiB0cnVlLFxuICAgICAgICAgICAgbGV2ZWw6IHR5cGVDb25maWcubGV2ZWwgIT0gbnVsbCA/IHR5cGVDb25maWcubGV2ZWwgOiAocmVmMiA9IHNlbGYuZGVmYXVsdFR5cGVzW3R5cGVDb25maWcudHlwZV0pICE9IG51bGwgPyByZWYyLmxldmVsIDogdm9pZCAwLFxuICAgICAgICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICAgICAgICBcImFyZ3VtZW50c1wiOiBhcmdzXG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICB9O1xuICAgICAgZm9yIChtZXRob2QgaW4gcmVmMSkge1xuICAgICAgICB0eXBlQ29uZmlnID0gcmVmMVttZXRob2RdO1xuICAgICAgICBmbjEobWV0aG9kLCB0eXBlQ29uZmlnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMuY29uZmlnLnNlY3Rpb25zICE9IG51bGwpIHtcbiAgICAgIHJlZjIgPSB0aGlzLmNvbmZpZy5zZWN0aW9ucztcbiAgICAgIGZuMiA9IGZ1bmN0aW9uKHNlY3Rpb24sIG5hbWUpIHtcbiAgICAgICAgdmFyIGZuMywgcmVmMywgcmVmNCwgcmVzdWx0cztcbiAgICAgICAgc2VsZltzZWN0aW9uXSA9IHt9O1xuICAgICAgICByZWYzID0gc2VsZi5kZWZhdWx0VHlwZXM7XG4gICAgICAgIGZuMyA9IChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbih0eXBlLCB0eXBlQ29uZmlnKSB7XG4gICAgICAgICAgICBzZWxmW3NlY3Rpb25dW3R5cGVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZWxmW3R5cGVdLmFwcGx5KHtcbiAgICAgICAgICAgICAgICBfX3NlY3Rpb246IG5hbWVcbiAgICAgICAgICAgICAgfSwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gc2VsZltzZWN0aW9uXVt0eXBlICsgXCJfYm94XCJdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZWxmW3R5cGUgKyBcIl9ib3hcIl0uYXBwbHkoe1xuICAgICAgICAgICAgICAgIF9fc2VjdGlvbjogbmFtZVxuICAgICAgICAgICAgICB9LCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9O1xuICAgICAgICB9KSh0aGlzKTtcbiAgICAgICAgZm9yICh0eXBlIGluIHJlZjMpIHtcbiAgICAgICAgICB0eXBlQ29uZmlnID0gcmVmM1t0eXBlXTtcbiAgICAgICAgICBmbjModHlwZSwgdHlwZUNvbmZpZyk7XG4gICAgICAgIH1cbiAgICAgICAgcmVmNCA9IHNlbGYuY29uZmlnLm1ldGhvZHM7XG4gICAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgZm9yIChtZXRob2QgaW4gcmVmNCkge1xuICAgICAgICAgIHR5cGVDb25maWcgPSByZWY0W21ldGhvZF07XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG1ldGhvZCwgdHlwZUNvbmZpZykge1xuICAgICAgICAgICAgICBzZWxmW3NlY3Rpb25dW21ldGhvZF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZlttZXRob2RdLmFwcGx5KHtcbiAgICAgICAgICAgICAgICAgIF9fc2VjdGlvbjogbmFtZVxuICAgICAgICAgICAgICAgIH0sIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIHJldHVybiBzZWxmW3NlY3Rpb25dW21ldGhvZCArIFwiX2JveFwiXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZWxmW21ldGhvZCArIFwiX2JveFwiXS5hcHBseSh7XG4gICAgICAgICAgICAgICAgICBfX3NlY3Rpb246IG5hbWVcbiAgICAgICAgICAgICAgICB9LCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9KSh0aGlzKShtZXRob2QsIHR5cGVDb25maWcpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgIH07XG4gICAgICBmb3IgKHNlY3Rpb24gaW4gcmVmMikge1xuICAgICAgICBuYW1lID0gcmVmMltzZWN0aW9uXTtcbiAgICAgICAgZm4yKHNlY3Rpb24sIG5hbWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBMb2dnZXJNYW5hZ2VyLnJlZ2lzdGVyKHRoaXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgTG9nZ2VyLnByb3RvdHlwZS5nZXRQcmVmaXggPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyIGRldGFpbFBhcnRzLCBkZXRhaWxzLCBwcmVmaXg7XG4gICAgaWYgKG9wdGlvbnMuc2VjdGlvbiAhPSBudWxsKSB7XG4gICAgICBwcmVmaXggPSB0aGlzLm5hbWUgKyBcIiDinpQgXCIgKyBvcHRpb25zLnNlY3Rpb24gKyBcIi5cIiArIG9wdGlvbnMubWV0aG9kO1xuICAgIH0gZWxzZSB7XG4gICAgICBwcmVmaXggPSB0aGlzLm5hbWUgKyBcIiDinpQgXCIgKyBvcHRpb25zLm1ldGhvZDtcbiAgICB9XG4gICAgZGV0YWlscyA9IHRoaXMuX2dldENhbGxlckRldGFpbHMoKTtcbiAgICBkZXRhaWxQYXJ0cyA9IFtdO1xuICAgIGlmICgoZGV0YWlsc1tcInBhY2thZ2VcIl0gIT0gbnVsbCkgJiYgKExvZ2dlck1hbmFnZXIuc2hvd1BhY2thZ2UgPT09IHRydWUgfHwgb3B0aW9ucy50eXBlID09PSAnZXJyb3InKSkge1xuICAgICAgZGV0YWlsUGFydHMucHVzaChkZXRhaWxzW1wicGFja2FnZVwiXSk7XG4gICAgfVxuICAgIGlmIChMb2dnZXJNYW5hZ2VyLnNob3dGaWxlQW5kTGluZSA9PT0gdHJ1ZSB8fCBvcHRpb25zLnR5cGUgPT09ICdlcnJvcicpIHtcbiAgICAgIGlmICgoZGV0YWlscy5maWxlICE9IG51bGwpICYmIChkZXRhaWxzLmxpbmUgIT0gbnVsbCkpIHtcbiAgICAgICAgZGV0YWlsUGFydHMucHVzaChkZXRhaWxzLmZpbGUgKyBcIjpcIiArIGRldGFpbHMubGluZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZGV0YWlscy5maWxlICE9IG51bGwpIHtcbiAgICAgICAgICBkZXRhaWxQYXJ0cy5wdXNoKGRldGFpbHMuZmlsZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRldGFpbHMubGluZSAhPSBudWxsKSB7XG4gICAgICAgICAgZGV0YWlsUGFydHMucHVzaChkZXRhaWxzLmxpbmUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLmRlZmF1bHRUeXBlc1tvcHRpb25zLnR5cGVdICE9IG51bGwpIHtcbiAgICAgIHByZWZpeCA9IGNoYWxrW3RoaXMuZGVmYXVsdFR5cGVzW29wdGlvbnMudHlwZV0uY29sb3JdKHByZWZpeCk7XG4gICAgfVxuICAgIGlmIChkZXRhaWxQYXJ0cy5sZW5ndGggPiAwKSB7XG4gICAgICBwcmVmaXggPSAoZGV0YWlsUGFydHMuam9pbignICcpKSArIFwiIFwiICsgcHJlZml4O1xuICAgIH1cbiAgICByZXR1cm4gcHJlZml4O1xuICB9O1xuXG4gIExvZ2dlci5wcm90b3R5cGUuX2dldENhbGxlckRldGFpbHMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZGV0YWlscywgZ2V0U3RhY2ssIGksIGluZGV4LCBpdGVtLCBsZW4xLCBsaW5lLCBsaW5lcywgbWF0Y2gsIHBhY2thZ2VNYXRjaCwgc3RhY2s7XG4gICAgZ2V0U3RhY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBlcnIsIHN0YWNrO1xuICAgICAgZXJyID0gbmV3IEVycm9yO1xuICAgICAgc3RhY2sgPSBlcnIuc3RhY2s7XG4gICAgICByZXR1cm4gc3RhY2s7XG4gICAgfTtcbiAgICBzdGFjayA9IGdldFN0YWNrKCk7XG4gICAgaWYgKCFzdGFjaykge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cbiAgICBsaW5lcyA9IHN0YWNrLnNwbGl0KCdcXG4nKTtcbiAgICBsaW5lID0gdm9pZCAwO1xuICAgIGZvciAoaW5kZXggPSBpID0gMCwgbGVuMSA9IGxpbmVzLmxlbmd0aDsgaSA8IGxlbjE7IGluZGV4ID0gKytpKSB7XG4gICAgICBpdGVtID0gbGluZXNbaW5kZXhdO1xuICAgICAgaWYgKCEoaW5kZXggPiAwKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGxpbmUgPSBpdGVtO1xuICAgICAgaWYgKGxpbmUubWF0Y2goL15cXHMqYXQgZXZhbCBcXChldmFsLykpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBmaWxlOiBcImV2YWxcIlxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgaWYgKCFsaW5lLm1hdGNoKC9wYWNrYWdlc1xcL3JvY2tldGNoYXRfbG9nZ2VyKD86XFwvfFxcLmpzKS8pKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBkZXRhaWxzID0ge307XG4gICAgbWF0Y2ggPSAvKD86W0AoXXwgYXQgKShbXihdKz8pOihbMC05Ol0rKSg/OlxcKXwkKS8uZXhlYyhsaW5lKTtcbiAgICBpZiAoIW1hdGNoKSB7XG4gICAgICByZXR1cm4gZGV0YWlscztcbiAgICB9XG4gICAgZGV0YWlscy5saW5lID0gbWF0Y2hbMl0uc3BsaXQoJzonKVswXTtcbiAgICBkZXRhaWxzLmZpbGUgPSBtYXRjaFsxXS5zcGxpdCgnLycpLnNsaWNlKC0xKVswXS5zcGxpdCgnPycpWzBdO1xuICAgIHBhY2thZ2VNYXRjaCA9IG1hdGNoWzFdLm1hdGNoKC9wYWNrYWdlc1xcLyhbXlxcLlxcL10rKSg/OlxcL3xcXC4pLyk7XG4gICAgaWYgKHBhY2thZ2VNYXRjaCAhPSBudWxsKSB7XG4gICAgICBkZXRhaWxzW1wicGFja2FnZVwiXSA9IHBhY2thZ2VNYXRjaFsxXTtcbiAgICB9XG4gICAgcmV0dXJuIGRldGFpbHM7XG4gIH07XG5cbiAgTG9nZ2VyLnByb3RvdHlwZS5tYWtlQUJveCA9IGZ1bmN0aW9uKG1lc3NhZ2UsIHRpdGxlKSB7XG4gICAgdmFyIGksIGosIGxlbiwgbGVuMSwgbGVuMiwgbGluZSwgbGluZXMsIHNlcGFyYXRvciwgdG9wTGluZTtcbiAgICBpZiAoIV8uaXNBcnJheShtZXNzYWdlKSkge1xuICAgICAgbWVzc2FnZSA9IG1lc3NhZ2Uuc3BsaXQoXCJcXG5cIik7XG4gICAgfVxuICAgIGxlbiA9IDA7XG4gICAgZm9yIChpID0gMCwgbGVuMSA9IG1lc3NhZ2UubGVuZ3RoOyBpIDwgbGVuMTsgaSsrKSB7XG4gICAgICBsaW5lID0gbWVzc2FnZVtpXTtcbiAgICAgIGxlbiA9IE1hdGgubWF4KGxlbiwgbGluZS5sZW5ndGgpO1xuICAgIH1cbiAgICB0b3BMaW5lID0gXCIrLS1cIiArIHMucGFkKCcnLCBsZW4sICctJykgKyBcIi0tK1wiO1xuICAgIHNlcGFyYXRvciA9IFwifCAgXCIgKyBzLnBhZCgnJywgbGVuLCAnJykgKyBcIiAgfFwiO1xuICAgIGxpbmVzID0gW107XG4gICAgbGluZXMucHVzaCh0b3BMaW5lKTtcbiAgICBpZiAodGl0bGUgIT0gbnVsbCkge1xuICAgICAgbGluZXMucHVzaChcInwgIFwiICsgcy5scnBhZCh0aXRsZSwgbGVuKSArIFwiICB8XCIpO1xuICAgICAgbGluZXMucHVzaCh0b3BMaW5lKTtcbiAgICB9XG4gICAgbGluZXMucHVzaChzZXBhcmF0b3IpO1xuICAgIGZvciAoaiA9IDAsIGxlbjIgPSBtZXNzYWdlLmxlbmd0aDsgaiA8IGxlbjI7IGorKykge1xuICAgICAgbGluZSA9IG1lc3NhZ2Vbal07XG4gICAgICBsaW5lcy5wdXNoKFwifCAgXCIgKyBzLnJwYWQobGluZSwgbGVuKSArIFwiICB8XCIpO1xuICAgIH1cbiAgICBsaW5lcy5wdXNoKHNlcGFyYXRvcik7XG4gICAgbGluZXMucHVzaCh0b3BMaW5lKTtcbiAgICByZXR1cm4gbGluZXM7XG4gIH07XG5cbiAgTG9nZ2VyLnByb3RvdHlwZS5fbG9nID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHZhciBib3gsIGNvbG9yLCBpLCBsZW4xLCBsaW5lLCBwcmVmaXgsIHN1YlByZWZpeDtcbiAgICBpZiAoTG9nZ2VyTWFuYWdlci5lbmFibGVkID09PSBmYWxzZSkge1xuICAgICAgTG9nZ2VyTWFuYWdlci5hZGRUb1F1ZXVlKHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChvcHRpb25zLmxldmVsID09IG51bGwpIHtcbiAgICAgIG9wdGlvbnMubGV2ZWwgPSAxO1xuICAgIH1cbiAgICBpZiAoTG9nZ2VyTWFuYWdlci5sb2dMZXZlbCA8IG9wdGlvbnMubGV2ZWwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcHJlZml4ID0gdGhpcy5nZXRQcmVmaXgob3B0aW9ucyk7XG4gICAgaWYgKG9wdGlvbnMuYm94ID09PSB0cnVlICYmIF8uaXNTdHJpbmcob3B0aW9uc1tcImFyZ3VtZW50c1wiXVswXSkpIHtcbiAgICAgIGNvbG9yID0gdm9pZCAwO1xuICAgICAgaWYgKHRoaXMuZGVmYXVsdFR5cGVzW29wdGlvbnMudHlwZV0gIT0gbnVsbCkge1xuICAgICAgICBjb2xvciA9IHRoaXMuZGVmYXVsdFR5cGVzW29wdGlvbnMudHlwZV0uY29sb3I7XG4gICAgICB9XG4gICAgICBib3ggPSB0aGlzLm1ha2VBQm94KG9wdGlvbnNbXCJhcmd1bWVudHNcIl1bMF0sIG9wdGlvbnNbXCJhcmd1bWVudHNcIl1bMV0pO1xuICAgICAgc3ViUHJlZml4ID0gJ+KelCc7XG4gICAgICBpZiAoY29sb3IgIT0gbnVsbCkge1xuICAgICAgICBzdWJQcmVmaXggPSBzdWJQcmVmaXhbY29sb3JdO1xuICAgICAgfVxuICAgICAgY29uc29sZS5sb2coc3ViUHJlZml4LCBwcmVmaXgpO1xuICAgICAgZm9yIChpID0gMCwgbGVuMSA9IGJveC5sZW5ndGg7IGkgPCBsZW4xOyBpKyspIHtcbiAgICAgICAgbGluZSA9IGJveFtpXTtcbiAgICAgICAgaWYgKGNvbG9yICE9IG51bGwpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhzdWJQcmVmaXgsIGxpbmVbY29sb3JdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhzdWJQcmVmaXgsIGxpbmUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdGlvbnNbXCJhcmd1bWVudHNcIl0udW5zaGlmdChwcmVmaXgpO1xuICAgICAgY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgb3B0aW9uc1tcImFyZ3VtZW50c1wiXSk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBMb2dnZXI7XG5cbn0pKCk7XG5cbnRoaXMuU3lzdGVtTG9nZ2VyID0gbmV3IExvZ2dlcignU3lzdGVtJywge1xuICBtZXRob2RzOiB7XG4gICAgc3RhcnR1cDoge1xuICAgICAgdHlwZTogJ3N1Y2Nlc3MnLFxuICAgICAgbGV2ZWw6IDBcbiAgICB9XG4gIH1cbn0pO1xuXG5wcm9jZXNzU3RyaW5nID0gZnVuY3Rpb24oc3RyaW5nLCBkYXRlKSB7XG4gIGlmIChzdHJpbmdbMF0gPT09ICd7Jykge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gTG9nLmZvcm1hdChFSlNPTi5wYXJzZShzdHJpbmcpLCB7XG4gICAgICAgIGNvbG9yOiB0cnVlXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge31cbiAgfVxuICB0cnkge1xuICAgIHJldHVybiBMb2cuZm9ybWF0KHtcbiAgICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgICAgIHRpbWU6IGRhdGUsXG4gICAgICBsZXZlbDogJ2luZm8nXG4gICAgfSwge1xuICAgICAgY29sb3I6IHRydWVcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHt9XG4gIHJldHVybiBzdHJpbmc7XG59O1xuXG5TdGRPdXQgPSBuZXcgKChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gIGV4dGVuZChfQ2xhc3MsIHN1cGVyQ2xhc3MpO1xuXG4gIGZ1bmN0aW9uIF9DbGFzcygpIHtcbiAgICB2YXIgd3JpdGU7XG4gICAgdGhpcy5xdWV1ZSA9IFtdO1xuICAgIHdyaXRlID0gcHJvY2Vzcy5zdGRvdXQud3JpdGU7XG4gICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUgPSAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihzdHJpbmcsIGVuY29kaW5nLCBmZCkge1xuICAgICAgICB2YXIgZGF0ZSwgaXRlbSwgcmVmLCByZWYxLCB2aWV3TGltaXQ7XG4gICAgICAgIHdyaXRlLmFwcGx5KHByb2Nlc3Muc3Rkb3V0LCBhcmd1bWVudHMpO1xuICAgICAgICBkYXRlID0gbmV3IERhdGU7XG4gICAgICAgIHN0cmluZyA9IHByb2Nlc3NTdHJpbmcoc3RyaW5nLCBkYXRlKTtcbiAgICAgICAgaXRlbSA9IHtcbiAgICAgICAgICBpZDogUmFuZG9tLmlkKCksXG4gICAgICAgICAgc3RyaW5nOiBzdHJpbmcsXG4gICAgICAgICAgdHM6IGRhdGVcbiAgICAgICAgfTtcbiAgICAgICAgX3RoaXMucXVldWUucHVzaChpdGVtKTtcbiAgICAgICAgdmlld0xpbWl0ID0gKHJlZiA9IE1ldGVvci5zZXR0aW5ncykgIT0gbnVsbCA/IChyZWYxID0gcmVmLmxvZ2dlcikgIT0gbnVsbCA/IHJlZjEudmlld0xpbWl0IDogdm9pZCAwIDogdm9pZCAwO1xuICAgICAgICBpZiAoIXZpZXdMaW1pdCkge1xuICAgICAgICAgIHZpZXdMaW1pdCA9IDEwMDA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKF90aGlzLnF1ZXVlLmxlbmd0aCA+IHZpZXdMaW1pdCkge1xuICAgICAgICAgIF90aGlzLnF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF90aGlzLmVtaXQoJ3dyaXRlJywgc3RyaW5nLCBpdGVtKTtcbiAgICAgIH07XG4gICAgfSkodGhpcyk7XG4gIH1cblxuICByZXR1cm4gX0NsYXNzO1xuXG59KShFdmVudEVtaXR0ZXIpKTtcblxuTWV0ZW9yLnB1Ymxpc2goJ3N0ZG91dCcsIGZ1bmN0aW9uKCkge1xuICB2YXIgaSwgaXRlbSwgbGVuMSwgcmVmLCB1c2VyO1xuICBpZiAoIXRoaXMudXNlcklkKSB7XG4gICAgcmV0dXJuIHRoaXMucmVhZHkoKTtcbiAgfVxuICBpZiAoIXRoaXMudXNlcklkKSB7XG4gICAgcmV0dXJuIHRoaXMucmVhZHkoKTtcbiAgfVxuICB1c2VyID0gZGIudXNlcnMuZmluZE9uZSh0aGlzLnVzZXJJZCwge1xuICAgIGZpZWxkczoge1xuICAgICAgaXNfY2xvdWRhZG1pbjogMVxuICAgIH1cbiAgfSk7XG4gIGlmICghdXNlcikge1xuICAgIHJldHVybiB0aGlzLnJlYWR5KCk7XG4gIH1cbiAgcmVmID0gU3RkT3V0LnF1ZXVlO1xuICBmb3IgKGkgPSAwLCBsZW4xID0gcmVmLmxlbmd0aDsgaSA8IGxlbjE7IGkrKykge1xuICAgIGl0ZW0gPSByZWZbaV07XG4gICAgdGhpcy5hZGRlZCgnc3Rkb3V0JywgaXRlbS5pZCwge1xuICAgICAgc3RyaW5nOiBpdGVtLnN0cmluZyxcbiAgICAgIHRzOiBpdGVtLnRzXG4gICAgfSk7XG4gIH1cbiAgdGhpcy5yZWFkeSgpO1xuICBTdGRPdXQub24oJ3dyaXRlJywgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHN0cmluZywgaXRlbSkge1xuICAgICAgcmV0dXJuIF90aGlzLmFkZGVkKCdzdGRvdXQnLCBpdGVtLmlkLCB7XG4gICAgICAgIHN0cmluZzogaXRlbS5zdHJpbmcsXG4gICAgICAgIHRzOiBpdGVtLnRzXG4gICAgICB9KTtcbiAgICB9O1xuICB9KSh0aGlzKSk7XG59KTtcblxuTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG4gIHZhciByZWYsIHJlZjEsIHJlZjIsIHJlZjMsIHJlZjQsIHJlZjUsIHJlZjYsIHJlZjc7XG4gIGlmICgocmVmID0gTWV0ZW9yLnNldHRpbmdzKSAhPSBudWxsID8gKHJlZjEgPSByZWYubG9nZ2VyKSAhPSBudWxsID8gcmVmMS5lbmFibGVkIDogdm9pZCAwIDogdm9pZCAwKSB7XG4gICAgaWYgKChyZWYyID0gTWV0ZW9yLnNldHRpbmdzKSAhPSBudWxsID8gKHJlZjMgPSByZWYyLmxvZ2dlcikgIT0gbnVsbCA/IHJlZjMuc2hvd1BhY2thZ2UgOiB2b2lkIDAgOiB2b2lkIDApIHtcbiAgICAgIExvZ2dlck1hbmFnZXIuc2hvd1BhY2thZ2UgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoKHJlZjQgPSBNZXRlb3Iuc2V0dGluZ3MpICE9IG51bGwgPyAocmVmNSA9IHJlZjQubG9nZ2VyKSAhPSBudWxsID8gcmVmNS5zaG93RmlsZUFuZExpbmUgOiB2b2lkIDAgOiB2b2lkIDApIHtcbiAgICAgIExvZ2dlck1hbmFnZXIuc2hvd0ZpbGVBbmRMaW5lID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKChyZWY2ID0gTWV0ZW9yLnNldHRpbmdzKSAhPSBudWxsID8gKHJlZjcgPSByZWY2LmxvZ2dlcikgIT0gbnVsbCA/IHJlZjcubG9nTGV2ZWwgOiB2b2lkIDAgOiB2b2lkIDApIHtcbiAgICAgIExvZ2dlck1hbmFnZXIubG9nTGV2ZWwgPSBNZXRlb3Iuc2V0dGluZ3MubG9nZ2VyLmxvZ0xldmVsO1xuICAgIH1cbiAgICByZXR1cm4gTG9nZ2VyTWFuYWdlci5lbmFibGUodHJ1ZSk7XG4gIH1cbn0pO1xuIl19
