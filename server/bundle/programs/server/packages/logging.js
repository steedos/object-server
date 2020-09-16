(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var EJSON = Package.ejson.EJSON;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Log;

var require = meteorInstall({"node_modules":{"meteor":{"logging":{"logging.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/logging/logging.js                                                                                 //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

module.export({
  Log: () => Log
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const hasOwn = Object.prototype.hasOwnProperty;

function Log(...args) {
  Log.info(...args);
} /// FOR TESTING


let intercept = 0;
let interceptedLines = [];
let suppress = 0; // Intercept the next 'count' calls to a Log function. The actual
// lines printed to the console can be cleared and read by calling
// Log._intercepted().

Log._intercept = count => {
  intercept += count;
}; // Suppress the next 'count' calls to a Log function. Use this to stop
// tests from spamming the console, especially with red errors that
// might look like a failing test.


Log._suppress = count => {
  suppress += count;
}; // Returns intercepted lines and resets the intercept counter.


Log._intercepted = () => {
  const lines = interceptedLines;
  interceptedLines = [];
  intercept = 0;
  return lines;
}; // Either 'json' or 'colored-text'.
//
// When this is set to 'json', print JSON documents that are parsed by another
// process ('satellite' or 'meteor run'). This other process should call
// 'Log.format' for nice output.
//
// When this is set to 'colored-text', call 'Log.format' before printing.
// This should be used for logging from within satellite, since there is no
// other process that will be reading its standard output.


Log.outputFormat = 'json';
const LEVEL_COLORS = {
  debug: 'green',
  // leave info as the default color
  warn: 'magenta',
  error: 'red'
};
const META_COLOR = 'blue'; // Default colors cause readability problems on Windows Powershell,
// switch to bright variants. While still capable of millions of
// operations per second, the benchmark showed a 25%+ increase in
// ops per second (on Node 8) by caching "process.platform".

const isWin32 = typeof process === 'object' && process.platform === 'win32';

const platformColor = color => {
  if (isWin32 && typeof color === 'string' && !color.endsWith('Bright')) {
    return `${color}Bright`;
  }

  return color;
}; // XXX package


const RESTRICTED_KEYS = ['time', 'timeInexact', 'level', 'file', 'line', 'program', 'originApp', 'satellite', 'stderr'];
const FORMATTED_KEYS = [...RESTRICTED_KEYS, 'app', 'message'];

const logInBrowser = obj => {
  const str = Log.format(obj); // XXX Some levels should be probably be sent to the server

  const level = obj.level;

  if (typeof console !== 'undefined' && console[level]) {
    console[level](str);
  } else {
    // XXX Uses of Meteor._debug should probably be replaced by Log.debug or
    //     Log.info, and we should have another name for "do your best to
    //     call call console.log".
    Meteor._debug(str);
  }
}; // @returns {Object: { line: Number, file: String }}


Log._getCallerDetails = () => {
  const getStack = () => {
    // We do NOT use Error.prepareStackTrace here (a V8 extension that gets us a
    // pre-parsed stack) since it's impossible to compose it with the use of
    // Error.prepareStackTrace used on the server for source maps.
    const err = new Error();
    const stack = err.stack;
    return stack;
  };

  const stack = getStack();

  if (!stack) {
    return {};
  } // looking for the first line outside the logging package (or an
  // eval if we find that first)


  let line;
  const lines = stack.split('\n').slice(1);

  for (line of lines) {
    if (line.match(/^\s*at eval \(eval/)) {
      return {
        file: "eval"
      };
    }

    if (!line.match(/packages\/(?:local-test[:_])?logging(?:\/|\.js)/)) {
      break;
    }
  }

  const details = {}; // The format for FF is 'functionName@filePath:lineNumber'
  // The format for V8 is 'functionName (packages/logging/logging.js:81)' or
  //                      'packages/logging/logging.js:81'

  const match = /(?:[@(]| at )([^(]+?):([0-9:]+)(?:\)|$)/.exec(line);

  if (!match) {
    return details;
  } // in case the matched block here is line:column


  details.line = match[2].split(':')[0]; // Possible format: https://foo.bar.com/scripts/file.js?random=foobar
  // XXX: if you can write the following in better way, please do it
  // XXX: what about evals?

  details.file = match[1].split('/').slice(-1)[0].split('?')[0];
  return details;
};

['debug', 'info', 'warn', 'error'].forEach(level => {
  // @param arg {String|Object}
  Log[level] = arg => {
    if (suppress) {
      suppress--;
      return;
    }

    let intercepted = false;

    if (intercept) {
      intercept--;
      intercepted = true;
    }

    let obj = arg === Object(arg) && !(arg instanceof RegExp) && !(arg instanceof Date) ? arg : {
      message: new String(arg).toString()
    };
    RESTRICTED_KEYS.forEach(key => {
      if (obj[key]) {
        throw new Error(`Can't set '${key}' in log message`);
      }
    });

    if (hasOwn.call(obj, 'message') && typeof obj.message !== 'string') {
      throw new Error("The 'message' field in log objects must be a string");
    }

    if (!obj.omitCallerDetails) {
      obj = (0, _objectSpread2.default)({}, Log._getCallerDetails(), obj);
    }

    obj.time = new Date();
    obj.level = level; // XXX allow you to enable 'debug', probably per-package

    if (level === 'debug') {
      return;
    }

    if (intercepted) {
      interceptedLines.push(EJSON.stringify(obj));
    } else if (Meteor.isServer) {
      if (Log.outputFormat === 'colored-text') {
        console.log(Log.format(obj, {
          color: true
        }));
      } else if (Log.outputFormat === 'json') {
        console.log(EJSON.stringify(obj));
      } else {
        throw new Error(`Unknown logging output format: ${Log.outputFormat}`);
      }
    } else {
      logInBrowser(obj);
    }
  };
}); // tries to parse line as EJSON. returns object if parse is successful, or null if not

Log.parse = line => {
  let obj = null;

  if (line && line.startsWith('{')) {
    // might be json generated from calling 'Log'
    try {
      obj = EJSON.parse(line);
    } catch (e) {}
  } // XXX should probably check fields other than 'time'


  if (obj && obj.time && obj.time instanceof Date) {
    return obj;
  } else {
    return null;
  }
}; // formats a log object into colored human and machine-readable text


Log.format = (obj, options = {}) => {
  obj = (0, _objectSpread2.default)({}, obj); // don't mutate the argument

  let {
    time,
    timeInexact,
    level = 'info',
    file,
    line: lineNumber,
    app: appName = '',
    originApp,
    message = '',
    program = '',
    satellite = '',
    stderr = ''
  } = obj;

  if (!(time instanceof Date)) {
    throw new Error("'time' must be a Date object");
  }

  FORMATTED_KEYS.forEach(key => {
    delete obj[key];
  });

  if (Object.keys(obj).length > 0) {
    if (message) {
      message += ' ';
    }

    message += EJSON.stringify(obj);
  }

  const pad2 = n => n.toString().padStart(2, '0');

  const pad3 = n => n.toString().padStart(3, '0');

  const dateStamp = time.getFullYear().toString() + pad2(time.getMonth() + 1
  /*0-based*/
  ) + pad2(time.getDate());
  const timeStamp = pad2(time.getHours()) + ':' + pad2(time.getMinutes()) + ':' + pad2(time.getSeconds()) + '.' + pad3(time.getMilliseconds()); // eg in San Francisco in June this will be '(-7)'

  const utcOffsetStr = `(${-(new Date().getTimezoneOffset() / 60)})`;
  let appInfo = '';

  if (appName) {
    appInfo += appName;
  }

  if (originApp && originApp !== appName) {
    appInfo += ` via ${originApp}`;
  }

  if (appInfo) {
    appInfo = `[${appInfo}] `;
  }

  const sourceInfoParts = [];

  if (program) {
    sourceInfoParts.push(program);
  }

  if (file) {
    sourceInfoParts.push(file);
  }

  if (lineNumber) {
    sourceInfoParts.push(lineNumber);
  }

  let sourceInfo = !sourceInfoParts.length ? '' : `(${sourceInfoParts.join(':')}) `;
  if (satellite) sourceInfo += `[${satellite}]`;
  const stderrIndicator = stderr ? '(STDERR) ' : '';
  const metaPrefix = [level.charAt(0).toUpperCase(), dateStamp, '-', timeStamp, utcOffsetStr, timeInexact ? '? ' : ' ', appInfo, sourceInfo, stderrIndicator].join('');

  const prettify = function (line, color) {
    return options.color && Meteor.isServer && color ? require('cli-color')[color](line) : line;
  };

  return prettify(metaPrefix, platformColor(options.metaColor || META_COLOR)) + prettify(message, platformColor(LEVEL_COLORS[level]));
}; // Turn a line of text into a loggable object.
// @param line {String}
// @param override {Object}


Log.objFromText = (line, override) => {
  return (0, _objectSpread2.default)({
    message: line,
    level: 'info',
    time: new Date(),
    timeInexact: true
  }, override);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"cli-color":{"package.json":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// node_modules/meteor/logging/node_modules/cli-color/package.json                                             //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
module.exports = {
  "name": "cli-color",
  "version": "0.2.3",
  "main": "lib"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// node_modules/meteor/logging/node_modules/cli-color/lib/index.js                                             //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/logging/logging.js");

/* Exports */
Package._define("logging", exports, {
  Log: Log
});

})();

//# sourceURL=meteor://💻app/packages/logging.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbG9nZ2luZy9sb2dnaW5nLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydCIsIkxvZyIsIk1ldGVvciIsImxpbmsiLCJ2IiwiaGFzT3duIiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJhcmdzIiwiaW5mbyIsImludGVyY2VwdCIsImludGVyY2VwdGVkTGluZXMiLCJzdXBwcmVzcyIsIl9pbnRlcmNlcHQiLCJjb3VudCIsIl9zdXBwcmVzcyIsIl9pbnRlcmNlcHRlZCIsImxpbmVzIiwib3V0cHV0Rm9ybWF0IiwiTEVWRUxfQ09MT1JTIiwiZGVidWciLCJ3YXJuIiwiZXJyb3IiLCJNRVRBX0NPTE9SIiwiaXNXaW4zMiIsInByb2Nlc3MiLCJwbGF0Zm9ybSIsInBsYXRmb3JtQ29sb3IiLCJjb2xvciIsImVuZHNXaXRoIiwiUkVTVFJJQ1RFRF9LRVlTIiwiRk9STUFUVEVEX0tFWVMiLCJsb2dJbkJyb3dzZXIiLCJvYmoiLCJzdHIiLCJmb3JtYXQiLCJsZXZlbCIsImNvbnNvbGUiLCJfZGVidWciLCJfZ2V0Q2FsbGVyRGV0YWlscyIsImdldFN0YWNrIiwiZXJyIiwiRXJyb3IiLCJzdGFjayIsImxpbmUiLCJzcGxpdCIsInNsaWNlIiwibWF0Y2giLCJmaWxlIiwiZGV0YWlscyIsImV4ZWMiLCJmb3JFYWNoIiwiYXJnIiwiaW50ZXJjZXB0ZWQiLCJSZWdFeHAiLCJEYXRlIiwibWVzc2FnZSIsIlN0cmluZyIsInRvU3RyaW5nIiwia2V5IiwiY2FsbCIsIm9taXRDYWxsZXJEZXRhaWxzIiwidGltZSIsInB1c2giLCJFSlNPTiIsInN0cmluZ2lmeSIsImlzU2VydmVyIiwibG9nIiwicGFyc2UiLCJzdGFydHNXaXRoIiwiZSIsIm9wdGlvbnMiLCJ0aW1lSW5leGFjdCIsImxpbmVOdW1iZXIiLCJhcHAiLCJhcHBOYW1lIiwib3JpZ2luQXBwIiwicHJvZ3JhbSIsInNhdGVsbGl0ZSIsInN0ZGVyciIsImtleXMiLCJsZW5ndGgiLCJwYWQyIiwibiIsInBhZFN0YXJ0IiwicGFkMyIsImRhdGVTdGFtcCIsImdldEZ1bGxZZWFyIiwiZ2V0TW9udGgiLCJnZXREYXRlIiwidGltZVN0YW1wIiwiZ2V0SG91cnMiLCJnZXRNaW51dGVzIiwiZ2V0U2Vjb25kcyIsImdldE1pbGxpc2Vjb25kcyIsInV0Y09mZnNldFN0ciIsImdldFRpbWV6b25lT2Zmc2V0IiwiYXBwSW5mbyIsInNvdXJjZUluZm9QYXJ0cyIsInNvdXJjZUluZm8iLCJqb2luIiwic3RkZXJySW5kaWNhdG9yIiwibWV0YVByZWZpeCIsImNoYXJBdCIsInRvVXBwZXJDYXNlIiwicHJldHRpZnkiLCJyZXF1aXJlIiwibWV0YUNvbG9yIiwib2JqRnJvbVRleHQiLCJvdmVycmlkZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjO0FBQUNDLEtBQUcsRUFBQyxNQUFJQTtBQUFULENBQWQ7QUFBNkIsSUFBSUMsTUFBSjtBQUFXSCxNQUFNLENBQUNJLElBQVAsQ0FBWSxlQUFaLEVBQTRCO0FBQUNELFFBQU0sQ0FBQ0UsQ0FBRCxFQUFHO0FBQUNGLFVBQU0sR0FBQ0UsQ0FBUDtBQUFTOztBQUFwQixDQUE1QixFQUFrRCxDQUFsRDtBQUV4QyxNQUFNQyxNQUFNLEdBQUdDLE1BQU0sQ0FBQ0MsU0FBUCxDQUFpQkMsY0FBaEM7O0FBRUEsU0FBU1AsR0FBVCxDQUFhLEdBQUdRLElBQWhCLEVBQXNCO0FBQ3BCUixLQUFHLENBQUNTLElBQUosQ0FBUyxHQUFHRCxJQUFaO0FBQ0QsQyxDQUVEOzs7QUFDQSxJQUFJRSxTQUFTLEdBQUcsQ0FBaEI7QUFDQSxJQUFJQyxnQkFBZ0IsR0FBRyxFQUF2QjtBQUNBLElBQUlDLFFBQVEsR0FBRyxDQUFmLEMsQ0FFQTtBQUNBO0FBQ0E7O0FBQ0FaLEdBQUcsQ0FBQ2EsVUFBSixHQUFrQkMsS0FBRCxJQUFXO0FBQzFCSixXQUFTLElBQUlJLEtBQWI7QUFD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LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5cbmNvbnN0IGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbmZ1bmN0aW9uIExvZyguLi5hcmdzKSB7XG4gIExvZy5pbmZvKC4uLmFyZ3MpO1xufVxuXG4vLy8gRk9SIFRFU1RJTkdcbmxldCBpbnRlcmNlcHQgPSAwO1xubGV0IGludGVyY2VwdGVkTGluZXMgPSBbXTtcbmxldCBzdXBwcmVzcyA9IDA7XG5cbi8vIEludGVyY2VwdCB0aGUgbmV4dCAnY291bnQnIGNhbGxzIHRvIGEgTG9nIGZ1bmN0aW9uLiBUaGUgYWN0dWFsXG4vLyBsaW5lcyBwcmludGVkIHRvIHRoZSBjb25zb2xlIGNhbiBiZSBjbGVhcmVkIGFuZCByZWFkIGJ5IGNhbGxpbmdcbi8vIExvZy5faW50ZXJjZXB0ZWQoKS5cbkxvZy5faW50ZXJjZXB0ID0gKGNvdW50KSA9PiB7XG4gIGludGVyY2VwdCArPSBjb3VudDtcbn07XG5cbi8vIFN1cHByZXNzIHRoZSBuZXh0ICdjb3VudCcgY2FsbHMgdG8gYSBMb2cgZnVuY3Rpb24uIFVzZSB0aGlzIHRvIHN0b3Bcbi8vIHRlc3RzIGZyb20gc3BhbW1pbmcgdGhlIGNvbnNvbGUsIGVzcGVjaWFsbHkgd2l0aCByZWQgZXJyb3JzIHRoYXRcbi8vIG1pZ2h0IGxvb2sgbGlrZSBhIGZhaWxpbmcgdGVzdC5cbkxvZy5fc3VwcHJlc3MgPSAoY291bnQpID0+IHtcbiAgc3VwcHJlc3MgKz0gY291bnQ7XG59O1xuXG4vLyBSZXR1cm5zIGludGVyY2VwdGVkIGxpbmVzIGFuZCByZXNldHMgdGhlIGludGVyY2VwdCBjb3VudGVyLlxuTG9nLl9pbnRlcmNlcHRlZCA9ICgpID0+IHtcbiAgY29uc3QgbGluZXMgPSBpbnRlcmNlcHRlZExpbmVzO1xuICBpbnRlcmNlcHRlZExpbmVzID0gW107XG4gIGludGVyY2VwdCA9IDA7XG4gIHJldHVybiBsaW5lcztcbn07XG5cbi8vIEVpdGhlciAnanNvbicgb3IgJ2NvbG9yZWQtdGV4dCcuXG4vL1xuLy8gV2hlbiB0aGlzIGlzIHNldCB0byAnanNvbicsIHByaW50IEpTT04gZG9jdW1lbnRzIHRoYXQgYXJlIHBhcnNlZCBieSBhbm90aGVyXG4vLyBwcm9jZXNzICgnc2F0ZWxsaXRlJyBvciAnbWV0ZW9yIHJ1bicpLiBUaGlzIG90aGVyIHByb2Nlc3Mgc2hvdWxkIGNhbGxcbi8vICdMb2cuZm9ybWF0JyBmb3IgbmljZSBvdXRwdXQuXG4vL1xuLy8gV2hlbiB0aGlzIGlzIHNldCB0byAnY29sb3JlZC10ZXh0JywgY2FsbCAnTG9nLmZvcm1hdCcgYmVmb3JlIHByaW50aW5nLlxuLy8gVGhpcyBzaG91bGQgYmUgdXNlZCBmb3IgbG9nZ2luZyBmcm9tIHdpdGhpbiBzYXRlbGxpdGUsIHNpbmNlIHRoZXJlIGlzIG5vXG4vLyBvdGhlciBwcm9jZXNzIHRoYXQgd2lsbCBiZSByZWFkaW5nIGl0cyBzdGFuZGFyZCBvdXRwdXQuXG5Mb2cub3V0cHV0Rm9ybWF0ID0gJ2pzb24nO1xuXG5jb25zdCBMRVZFTF9DT0xPUlMgPSB7XG4gIGRlYnVnOiAnZ3JlZW4nLFxuICAvLyBsZWF2ZSBpbmZvIGFzIHRoZSBkZWZhdWx0IGNvbG9yXG4gIHdhcm46ICdtYWdlbnRhJyxcbiAgZXJyb3I6ICdyZWQnXG59O1xuXG5jb25zdCBNRVRBX0NPTE9SID0gJ2JsdWUnO1xuXG4vLyBEZWZhdWx0IGNvbG9ycyBjYXVzZSByZWFkYWJpbGl0eSBwcm9ibGVtcyBvbiBXaW5kb3dzIFBvd2Vyc2hlbGwsXG4vLyBzd2l0Y2ggdG8gYnJpZ2h0IHZhcmlhbnRzLiBXaGlsZSBzdGlsbCBjYXBhYmxlIG9mIG1pbGxpb25zIG9mXG4vLyBvcGVyYXRpb25zIHBlciBzZWNvbmQsIHRoZSBiZW5jaG1hcmsgc2hvd2VkIGEgMjUlKyBpbmNyZWFzZSBpblxuLy8gb3BzIHBlciBzZWNvbmQgKG9uIE5vZGUgOCkgYnkgY2FjaGluZyBcInByb2Nlc3MucGxhdGZvcm1cIi5cbmNvbnN0IGlzV2luMzIgPSB0eXBlb2YgcHJvY2VzcyA9PT0gJ29iamVjdCcgJiYgcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJztcbmNvbnN0IHBsYXRmb3JtQ29sb3IgPSAoY29sb3IpID0+IHtcbiAgaWYgKGlzV2luMzIgJiYgdHlwZW9mIGNvbG9yID09PSAnc3RyaW5nJyAmJiAhY29sb3IuZW5kc1dpdGgoJ0JyaWdodCcpKSB7XG4gICAgcmV0dXJuIGAke2NvbG9yfUJyaWdodGA7XG4gIH1cbiAgcmV0dXJuIGNvbG9yO1xufTtcblxuLy8gWFhYIHBhY2thZ2VcbmNvbnN0IFJFU1RSSUNURURfS0VZUyA9IFsndGltZScsICd0aW1lSW5leGFjdCcsICdsZXZlbCcsICdmaWxlJywgJ2xpbmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3Byb2dyYW0nLCAnb3JpZ2luQXBwJywgJ3NhdGVsbGl0ZScsICdzdGRlcnInXTtcblxuY29uc3QgRk9STUFUVEVEX0tFWVMgPSBbLi4uUkVTVFJJQ1RFRF9LRVlTLCAnYXBwJywgJ21lc3NhZ2UnXTtcblxuY29uc3QgbG9nSW5Ccm93c2VyID0gb2JqID0+IHtcbiAgY29uc3Qgc3RyID0gTG9nLmZvcm1hdChvYmopO1xuXG4gIC8vIFhYWCBTb21lIGxldmVscyBzaG91bGQgYmUgcHJvYmFibHkgYmUgc2VudCB0byB0aGUgc2VydmVyXG4gIGNvbnN0IGxldmVsID0gb2JqLmxldmVsO1xuXG4gIGlmICgodHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnKSAmJiBjb25zb2xlW2xldmVsXSkge1xuICAgIGNvbnNvbGVbbGV2ZWxdKHN0cik7XG4gIH0gZWxzZSB7XG4gICAgLy8gWFhYIFVzZXMgb2YgTWV0ZW9yLl9kZWJ1ZyBzaG91bGQgcHJvYmFibHkgYmUgcmVwbGFjZWQgYnkgTG9nLmRlYnVnIG9yXG4gICAgLy8gICAgIExvZy5pbmZvLCBhbmQgd2Ugc2hvdWxkIGhhdmUgYW5vdGhlciBuYW1lIGZvciBcImRvIHlvdXIgYmVzdCB0b1xuICAgIC8vICAgICBjYWxsIGNhbGwgY29uc29sZS5sb2dcIi5cbiAgICBNZXRlb3IuX2RlYnVnKHN0cik7XG4gIH1cbn07XG5cbi8vIEByZXR1cm5zIHtPYmplY3Q6IHsgbGluZTogTnVtYmVyLCBmaWxlOiBTdHJpbmcgfX1cbkxvZy5fZ2V0Q2FsbGVyRGV0YWlscyA9ICgpID0+IHtcbiAgY29uc3QgZ2V0U3RhY2sgPSAoKSA9PiB7XG4gICAgLy8gV2UgZG8gTk9UIHVzZSBFcnJvci5wcmVwYXJlU3RhY2tUcmFjZSBoZXJlIChhIFY4IGV4dGVuc2lvbiB0aGF0IGdldHMgdXMgYVxuICAgIC8vIHByZS1wYXJzZWQgc3RhY2spIHNpbmNlIGl0J3MgaW1wb3NzaWJsZSB0byBjb21wb3NlIGl0IHdpdGggdGhlIHVzZSBvZlxuICAgIC8vIEVycm9yLnByZXBhcmVTdGFja1RyYWNlIHVzZWQgb24gdGhlIHNlcnZlciBmb3Igc291cmNlIG1hcHMuXG4gICAgY29uc3QgZXJyID0gbmV3IEVycm9yO1xuICAgIGNvbnN0IHN0YWNrID0gZXJyLnN0YWNrO1xuICAgIHJldHVybiBzdGFjaztcbiAgfTtcblxuICBjb25zdCBzdGFjayA9IGdldFN0YWNrKCk7XG5cbiAgaWYgKCFzdGFjaykge1xuICAgIHJldHVybiB7fTtcbiAgfVxuXG4gIC8vIGxvb2tpbmcgZm9yIHRoZSBmaXJzdCBsaW5lIG91dHNpZGUgdGhlIGxvZ2dpbmcgcGFja2FnZSAob3IgYW5cbiAgLy8gZXZhbCBpZiB3ZSBmaW5kIHRoYXQgZmlyc3QpXG4gIGxldCBsaW5lO1xuICBjb25zdCBsaW5lcyA9IHN0YWNrLnNwbGl0KCdcXG4nKS5zbGljZSgxKTtcbiAgZm9yIChsaW5lIG9mIGxpbmVzKSB7XG4gICAgaWYgKGxpbmUubWF0Y2goL15cXHMqYXQgZXZhbCBcXChldmFsLykpIHtcbiAgICAgIHJldHVybiB7ZmlsZTogXCJldmFsXCJ9O1xuICAgIH1cblxuICAgIGlmICghbGluZS5tYXRjaCgvcGFja2FnZXNcXC8oPzpsb2NhbC10ZXN0WzpfXSk/bG9nZ2luZyg/OlxcL3xcXC5qcykvKSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgZGV0YWlscyA9IHt9O1xuXG4gIC8vIFRoZSBmb3JtYXQgZm9yIEZGIGlzICdmdW5jdGlvbk5hbWVAZmlsZVBhdGg6bGluZU51bWJlcidcbiAgLy8gVGhlIGZvcm1hdCBmb3IgVjggaXMgJ2Z1bmN0aW9uTmFtZSAocGFja2FnZXMvbG9nZ2luZy9sb2dnaW5nLmpzOjgxKScgb3JcbiAgLy8gICAgICAgICAgICAgICAgICAgICAgJ3BhY2thZ2VzL2xvZ2dpbmcvbG9nZ2luZy5qczo4MSdcbiAgY29uc3QgbWF0Y2ggPSAvKD86W0AoXXwgYXQgKShbXihdKz8pOihbMC05Ol0rKSg/OlxcKXwkKS8uZXhlYyhsaW5lKTtcbiAgaWYgKCFtYXRjaCkge1xuICAgIHJldHVybiBkZXRhaWxzO1xuICB9XG5cbiAgLy8gaW4gY2FzZSB0aGUgbWF0Y2hlZCBibG9jayBoZXJlIGlzIGxpbmU6Y29sdW1uXG4gIGRldGFpbHMubGluZSA9IG1hdGNoWzJdLnNwbGl0KCc6JylbMF07XG5cbiAgLy8gUG9zc2libGUgZm9ybWF0OiBodHRwczovL2Zvby5iYXIuY29tL3NjcmlwdHMvZmlsZS5qcz9yYW5kb209Zm9vYmFyXG4gIC8vIFhYWDogaWYgeW91IGNhbiB3cml0ZSB0aGUgZm9sbG93aW5nIGluIGJldHRlciB3YXksIHBsZWFzZSBkbyBpdFxuICAvLyBYWFg6IHdoYXQgYWJvdXQgZXZhbHM/XG4gIGRldGFpbHMuZmlsZSA9IG1hdGNoWzFdLnNwbGl0KCcvJykuc2xpY2UoLTEpWzBdLnNwbGl0KCc/JylbMF07XG5cbiAgcmV0dXJuIGRldGFpbHM7XG59O1xuXG5bJ2RlYnVnJywgJ2luZm8nLCAnd2FybicsICdlcnJvciddLmZvckVhY2goKGxldmVsKSA9PiB7XG4gLy8gQHBhcmFtIGFyZyB7U3RyaW5nfE9iamVjdH1cbiBMb2dbbGV2ZWxdID0gKGFyZykgPT4ge1xuICBpZiAoc3VwcHJlc3MpIHtcbiAgICBzdXBwcmVzcy0tO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGxldCBpbnRlcmNlcHRlZCA9IGZhbHNlO1xuICBpZiAoaW50ZXJjZXB0KSB7XG4gICAgaW50ZXJjZXB0LS07XG4gICAgaW50ZXJjZXB0ZWQgPSB0cnVlO1xuICB9XG5cbiAgbGV0IG9iaiA9IChhcmcgPT09IE9iamVjdChhcmcpXG4gICAgJiYgIShhcmcgaW5zdGFuY2VvZiBSZWdFeHApXG4gICAgJiYgIShhcmcgaW5zdGFuY2VvZiBEYXRlKSlcbiAgICA/IGFyZ1xuICAgIDogeyBtZXNzYWdlOiBuZXcgU3RyaW5nKGFyZykudG9TdHJpbmcoKSB9O1xuXG4gIFJFU1RSSUNURURfS0VZUy5mb3JFYWNoKGtleSA9PiB7XG4gICAgaWYgKG9ialtrZXldKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbid0IHNldCAnJHtrZXl9JyBpbiBsb2cgbWVzc2FnZWApO1xuICAgIH1cbiAgfSk7XG5cbiAgaWYgKGhhc093bi5jYWxsKG9iaiwgJ21lc3NhZ2UnKSAmJiB0eXBlb2Ygb2JqLm1lc3NhZ2UgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlICdtZXNzYWdlJyBmaWVsZCBpbiBsb2cgb2JqZWN0cyBtdXN0IGJlIGEgc3RyaW5nXCIpO1xuICB9XG5cbiAgaWYgKCFvYmoub21pdENhbGxlckRldGFpbHMpIHtcbiAgICBvYmogPSB7IC4uLkxvZy5fZ2V0Q2FsbGVyRGV0YWlscygpLCAuLi5vYmogfTtcbiAgfVxuXG4gIG9iai50aW1lID0gbmV3IERhdGUoKTtcbiAgb2JqLmxldmVsID0gbGV2ZWw7XG5cbiAgLy8gWFhYIGFsbG93IHlvdSB0byBlbmFibGUgJ2RlYnVnJywgcHJvYmFibHkgcGVyLXBhY2thZ2VcbiAgaWYgKGxldmVsID09PSAnZGVidWcnKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKGludGVyY2VwdGVkKSB7XG4gICAgaW50ZXJjZXB0ZWRMaW5lcy5wdXNoKEVKU09OLnN0cmluZ2lmeShvYmopKTtcbiAgfSBlbHNlIGlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcbiAgICBpZiAoTG9nLm91dHB1dEZvcm1hdCA9PT0gJ2NvbG9yZWQtdGV4dCcpIHtcbiAgICAgIGNvbnNvbGUubG9nKExvZy5mb3JtYXQob2JqLCB7Y29sb3I6IHRydWV9KSk7XG4gICAgfSBlbHNlIGlmIChMb2cub3V0cHV0Rm9ybWF0ID09PSAnanNvbicpIHtcbiAgICAgIGNvbnNvbGUubG9nKEVKU09OLnN0cmluZ2lmeShvYmopKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGxvZ2dpbmcgb3V0cHV0IGZvcm1hdDogJHtMb2cub3V0cHV0Rm9ybWF0fWApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBsb2dJbkJyb3dzZXIob2JqKTtcbiAgfVxufTtcbn0pO1xuXG5cbi8vIHRyaWVzIHRvIHBhcnNlIGxpbmUgYXMgRUpTT04uIHJldHVybnMgb2JqZWN0IGlmIHBhcnNlIGlzIHN1Y2Nlc3NmdWwsIG9yIG51bGwgaWYgbm90XG5Mb2cucGFyc2UgPSAobGluZSkgPT4ge1xuICBsZXQgb2JqID0gbnVsbDtcbiAgaWYgKGxpbmUgJiYgbGluZS5zdGFydHNXaXRoKCd7JykpIHsgLy8gbWlnaHQgYmUganNvbiBnZW5lcmF0ZWQgZnJvbSBjYWxsaW5nICdMb2cnXG4gICAgdHJ5IHsgb2JqID0gRUpTT04ucGFyc2UobGluZSk7IH0gY2F0Y2ggKGUpIHt9XG4gIH1cblxuICAvLyBYWFggc2hvdWxkIHByb2JhYmx5IGNoZWNrIGZpZWxkcyBvdGhlciB0aGFuICd0aW1lJ1xuICBpZiAob2JqICYmIG9iai50aW1lICYmIChvYmoudGltZSBpbnN0YW5jZW9mIERhdGUpKSB7XG4gICAgcmV0dXJuIG9iajtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufTtcblxuLy8gZm9ybWF0cyBhIGxvZyBvYmplY3QgaW50byBjb2xvcmVkIGh1bWFuIGFuZCBtYWNoaW5lLXJlYWRhYmxlIHRleHRcbkxvZy5mb3JtYXQgPSAob2JqLCBvcHRpb25zID0ge30pID0+IHtcbiAgb2JqID0geyAuLi5vYmogfTsgLy8gZG9uJ3QgbXV0YXRlIHRoZSBhcmd1bWVudFxuICBsZXQge1xuICAgIHRpbWUsXG4gICAgdGltZUluZXhhY3QsXG4gICAgbGV2ZWwgPSAnaW5mbycsXG4gICAgZmlsZSxcbiAgICBsaW5lOiBsaW5lTnVtYmVyLFxuICAgIGFwcDogYXBwTmFtZSA9ICcnLFxuICAgIG9yaWdpbkFwcCxcbiAgICBtZXNzYWdlID0gJycsXG4gICAgcHJvZ3JhbSA9ICcnLFxuICAgIHNhdGVsbGl0ZSA9ICcnLFxuICAgIHN0ZGVyciA9ICcnLFxuICB9ID0gb2JqO1xuXG4gIGlmICghKHRpbWUgaW5zdGFuY2VvZiBEYXRlKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIid0aW1lJyBtdXN0IGJlIGEgRGF0ZSBvYmplY3RcIik7XG4gIH1cblxuICBGT1JNQVRURURfS0VZUy5mb3JFYWNoKChrZXkpID0+IHsgZGVsZXRlIG9ialtrZXldOyB9KTtcblxuICBpZiAoT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPiAwKSB7XG4gICAgaWYgKG1lc3NhZ2UpIHtcbiAgICAgIG1lc3NhZ2UgKz0gJyAnO1xuICAgIH1cbiAgICBtZXNzYWdlICs9IEVKU09OLnN0cmluZ2lmeShvYmopO1xuICB9XG5cbiAgY29uc3QgcGFkMiA9IG4gPT4gbi50b1N0cmluZygpLnBhZFN0YXJ0KDIsICcwJyk7XG4gIGNvbnN0IHBhZDMgPSBuID0+IG4udG9TdHJpbmcoKS5wYWRTdGFydCgzLCAnMCcpO1xuXG4gIGNvbnN0IGRhdGVTdGFtcCA9IHRpbWUuZ2V0RnVsbFllYXIoKS50b1N0cmluZygpICtcbiAgICBwYWQyKHRpbWUuZ2V0TW9udGgoKSArIDEgLyowLWJhc2VkKi8pICtcbiAgICBwYWQyKHRpbWUuZ2V0RGF0ZSgpKTtcbiAgY29uc3QgdGltZVN0YW1wID0gcGFkMih0aW1lLmdldEhvdXJzKCkpICtcbiAgICAgICAgJzonICtcbiAgICAgICAgcGFkMih0aW1lLmdldE1pbnV0ZXMoKSkgK1xuICAgICAgICAnOicgK1xuICAgICAgICBwYWQyKHRpbWUuZ2V0U2Vjb25kcygpKSArXG4gICAgICAgICcuJyArXG4gICAgICAgIHBhZDModGltZS5nZXRNaWxsaXNlY29uZHMoKSk7XG5cbiAgLy8gZWcgaW4gU2FuIEZyYW5jaXNjbyBpbiBKdW5lIHRoaXMgd2lsbCBiZSAnKC03KSdcbiAgY29uc3QgdXRjT2Zmc2V0U3RyID0gYCgkeygtKG5ldyBEYXRlKCkuZ2V0VGltZXpvbmVPZmZzZXQoKSAvIDYwKSl9KWA7XG5cbiAgbGV0IGFwcEluZm8gPSAnJztcbiAgaWYgKGFwcE5hbWUpIHtcbiAgICBhcHBJbmZvICs9IGFwcE5hbWU7XG4gIH1cbiAgaWYgKG9yaWdpbkFwcCAmJiBvcmlnaW5BcHAgIT09IGFwcE5hbWUpIHtcbiAgICBhcHBJbmZvICs9IGAgdmlhICR7b3JpZ2luQXBwfWA7XG4gIH1cbiAgaWYgKGFwcEluZm8pIHtcbiAgICBhcHBJbmZvID0gYFske2FwcEluZm99XSBgO1xuICB9XG5cbiAgY29uc3Qgc291cmNlSW5mb1BhcnRzID0gW107XG4gIGlmIChwcm9ncmFtKSB7XG4gICAgc291cmNlSW5mb1BhcnRzLnB1c2gocHJvZ3JhbSk7XG4gIH1cbiAgaWYgKGZpbGUpIHtcbiAgICBzb3VyY2VJbmZvUGFydHMucHVzaChmaWxlKTtcbiAgfVxuICBpZiAobGluZU51bWJlcikge1xuICAgIHNvdXJjZUluZm9QYXJ0cy5wdXNoKGxpbmVOdW1iZXIpO1xuICB9XG5cbiAgbGV0IHNvdXJjZUluZm8gPSAhc291cmNlSW5mb1BhcnRzLmxlbmd0aCA/XG4gICAgJycgOiBgKCR7c291cmNlSW5mb1BhcnRzLmpvaW4oJzonKX0pIGA7XG5cbiAgaWYgKHNhdGVsbGl0ZSlcbiAgICBzb3VyY2VJbmZvICs9IGBbJHtzYXRlbGxpdGV9XWA7XG5cbiAgY29uc3Qgc3RkZXJySW5kaWNhdG9yID0gc3RkZXJyID8gJyhTVERFUlIpICcgOiAnJztcblxuICBjb25zdCBtZXRhUHJlZml4ID0gW1xuICAgIGxldmVsLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpLFxuICAgIGRhdGVTdGFtcCxcbiAgICAnLScsXG4gICAgdGltZVN0YW1wLFxuICAgIHV0Y09mZnNldFN0cixcbiAgICB0aW1lSW5leGFjdCA/ICc/ICcgOiAnICcsXG4gICAgYXBwSW5mbyxcbiAgICBzb3VyY2VJbmZvLFxuICAgIHN0ZGVyckluZGljYXRvcl0uam9pbignJyk7XG5cbiAgY29uc3QgcHJldHRpZnkgPSBmdW5jdGlvbiAobGluZSwgY29sb3IpIHtcbiAgICByZXR1cm4gKG9wdGlvbnMuY29sb3IgJiYgTWV0ZW9yLmlzU2VydmVyICYmIGNvbG9yKSA/XG4gICAgICByZXF1aXJlKCdjbGktY29sb3InKVtjb2xvcl0obGluZSkgOiBsaW5lO1xuICB9O1xuXG4gIHJldHVybiBwcmV0dGlmeShtZXRhUHJlZml4LCBwbGF0Zm9ybUNvbG9yKG9wdGlvbnMubWV0YUNvbG9yIHx8IE1FVEFfQ09MT1IpKSArXG4gICAgcHJldHRpZnkobWVzc2FnZSwgcGxhdGZvcm1Db2xvcihMRVZFTF9DT0xPUlNbbGV2ZWxdKSk7XG59O1xuXG4vLyBUdXJuIGEgbGluZSBvZiB0ZXh0IGludG8gYSBsb2dnYWJsZSBvYmplY3QuXG4vLyBAcGFyYW0gbGluZSB7U3RyaW5nfVxuLy8gQHBhcmFtIG92ZXJyaWRlIHtPYmplY3R9XG5Mb2cub2JqRnJvbVRleHQgPSAobGluZSwgb3ZlcnJpZGUpID0+IHtcbiAgcmV0dXJuIHtcbiAgICBtZXNzYWdlOiBsaW5lLFxuICAgIGxldmVsOiAnaW5mbycsXG4gICAgdGltZTogbmV3IERhdGUoKSxcbiAgICB0aW1lSW5leGFjdDogdHJ1ZSxcbiAgICAuLi5vdmVycmlkZVxuICB9O1xufTtcblxuZXhwb3J0IHsgTG9nIH07XG4iXX0=
