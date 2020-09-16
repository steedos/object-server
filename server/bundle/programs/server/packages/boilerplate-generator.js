(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var _ = Package.underscore._;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Boilerplate;

var require = meteorInstall({"node_modules":{"meteor":{"boilerplate-generator":{"generator.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/boilerplate-generator/generator.js                                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

module.export({
  Boilerplate: () => Boilerplate
});
let readFile;
module.link("fs", {
  readFile(v) {
    readFile = v;
  }

}, 0);
let createStream;
module.link("combined-stream2", {
  create(v) {
    createStream = v;
  }

}, 1);
let WebBrowserTemplate;
module.link("./template-web.browser", {
  default(v) {
    WebBrowserTemplate = v;
  }

}, 2);
let WebCordovaTemplate;
module.link("./template-web.cordova", {
  default(v) {
    WebCordovaTemplate = v;
  }

}, 3);

// Copied from webapp_server
const readUtf8FileSync = filename => Meteor.wrapAsync(readFile)(filename, 'utf8');

const identity = value => value;

function appendToStream(chunk, stream) {
  if (typeof chunk === "string") {
    stream.append(Buffer.from(chunk, "utf8"));
  } else if (Buffer.isBuffer(chunk) || typeof chunk.read === "function") {
    stream.append(chunk);
  }
}

let shouldWarnAboutToHTMLDeprecation = !Meteor.isProduction;

class Boilerplate {
  constructor(arch, manifest, options = {}) {
    const {
      headTemplate,
      closeTemplate
    } = getTemplate(arch);
    this.headTemplate = headTemplate;
    this.closeTemplate = closeTemplate;
    this.baseData = null;

    this._generateBoilerplateFromManifest(manifest, options);
  }

  toHTML(extraData) {
    if (shouldWarnAboutToHTMLDeprecation) {
      shouldWarnAboutToHTMLDeprecation = false;
      console.error("The Boilerplate#toHTML method has been deprecated. " + "Please use Boilerplate#toHTMLStream instead.");
      console.trace();
    } // Calling .await() requires a Fiber.


    return this.toHTMLAsync(extraData).await();
  } // Returns a Promise that resolves to a string of HTML.


  toHTMLAsync(extraData) {
    return new Promise((resolve, reject) => {
      const stream = this.toHTMLStream(extraData);
      const chunks = [];
      stream.on("data", chunk => chunks.push(chunk));
      stream.on("end", () => {
        resolve(Buffer.concat(chunks).toString("utf8"));
      });
      stream.on("error", reject);
    });
  } // The 'extraData' argument can be used to extend 'self.baseData'. Its
  // purpose is to allow you to specify data that you might not know at
  // the time that you construct the Boilerplate object. (e.g. it is used
  // by 'webapp' to specify data that is only known at request-time).
  // this returns a stream


  toHTMLStream(extraData) {
    if (!this.baseData || !this.headTemplate || !this.closeTemplate) {
      throw new Error('Boilerplate did not instantiate correctly.');
    }

    const data = (0, _objectSpread2.default)({}, this.baseData, extraData);
    const start = "<!DOCTYPE html>\n" + this.headTemplate(data);
    const {
      body,
      dynamicBody
    } = data;
    const end = this.closeTemplate(data);
    const response = createStream();
    appendToStream(start, response);

    if (body) {
      appendToStream(body, response);
    }

    if (dynamicBody) {
      appendToStream(dynamicBody, response);
    }

    appendToStream(end, response);
    return response;
  } // XXX Exported to allow client-side only changes to rebuild the boilerplate
  // without requiring a full server restart.
  // Produces an HTML string with given manifest and boilerplateSource.
  // Optionally takes urlMapper in case urls from manifest need to be prefixed
  // or rewritten.
  // Optionally takes pathMapper for resolving relative file system paths.
  // Optionally allows to override fields of the data context.


  _generateBoilerplateFromManifest(manifest, {
    urlMapper = identity,
    pathMapper = identity,
    baseDataExtension,
    inline
  } = {}) {
    const boilerplateBaseData = (0, _objectSpread2.default)({
      css: [],
      js: [],
      head: '',
      body: '',
      meteorManifest: JSON.stringify(manifest)
    }, baseDataExtension);
    manifest.forEach(item => {
      const urlPath = urlMapper(item.url);
      const itemObj = {
        url: urlPath
      };

      if (inline) {
        itemObj.scriptContent = readUtf8FileSync(pathMapper(item.path));
        itemObj.inline = true;
      } else if (item.sri) {
        itemObj.sri = item.sri;
      }

      if (item.type === 'css' && item.where === 'client') {
        boilerplateBaseData.css.push(itemObj);
      }

      if (item.type === 'js' && item.where === 'client' && // Dynamic JS modules should not be loaded eagerly in the
      // initial HTML of the app.
      !item.path.startsWith('dynamic/')) {
        boilerplateBaseData.js.push(itemObj);
      }

      if (item.type === 'head') {
        boilerplateBaseData.head = readUtf8FileSync(pathMapper(item.path));
      }

      if (item.type === 'body') {
        boilerplateBaseData.body = readUtf8FileSync(pathMapper(item.path));
      }
    });
    this.baseData = boilerplateBaseData;
  }

}

; // Returns a template function that, when called, produces the boilerplate
// html as a string.

function getTemplate(arch) {
  const prefix = arch.split(".", 2).join(".");

  if (prefix === "web.browser") {
    return WebBrowserTemplate;
  }

  if (prefix === "web.cordova") {
    return WebCordovaTemplate;
  }

  throw new Error("Unsupported arch: " + arch);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"template-web.browser.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/boilerplate-generator/template-web.browser.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  headTemplate: () => headTemplate,
  closeTemplate: () => closeTemplate
});
let template;
module.link("./template", {
  default(v) {
    template = v;
  }

}, 0);

const sri = (sri, mode) => sri && mode ? ` integrity="sha512-${sri}" crossorigin="${mode}"` : '';

const headTemplate = ({
  css,
  htmlAttributes,
  bundledJsCssUrlRewriteHook,
  sriMode,
  head,
  dynamicHead
}) => {
  var headSections = head.split(/<meteor-bundled-css[^<>]*>/, 2);
  var cssBundle = [...(css || []).map(file => template('  <link rel="stylesheet" type="text/css" class="__meteor-css__" href="<%- href %>"<%= sri %>>')({
    href: bundledJsCssUrlRewriteHook(file.url),
    sri: sri(file.sri, sriMode)
  }))].join('\n');
  return ['<html' + Object.keys(htmlAttributes || {}).map(key => template(' <%= attrName %>="<%- attrValue %>"')({
    attrName: key,
    attrValue: htmlAttributes[key]
  })).join('') + '>', '<head>', headSections.length === 1 ? [cssBundle, headSections[0]].join('\n') : [headSections[0], cssBundle, headSections[1]].join('\n'), dynamicHead, '</head>', '<body>'].join('\n');
};

const closeTemplate = ({
  meteorRuntimeConfig,
  rootUrlPathPrefix,
  inlineScriptsAllowed,
  js,
  additionalStaticJs,
  bundledJsCssUrlRewriteHook,
  sriMode
}) => ['', inlineScriptsAllowed ? template('  <script type="text/javascript">__meteor_runtime_config__ = JSON.parse(decodeURIComponent(<%= conf %>))</script>')({
  conf: meteorRuntimeConfig
}) : template('  <script type="text/javascript" src="<%- src %>/meteor_runtime_config.js"></script>')({
  src: rootUrlPathPrefix
}), '', ...(js || []).map(file => template('  <script type="text/javascript" src="<%- src %>"<%= sri %>></script>')({
  src: bundledJsCssUrlRewriteHook(file.url),
  sri: sri(file.sri, sriMode)
})), ...(additionalStaticJs || []).map(({
  contents,
  pathname
}) => inlineScriptsAllowed ? template('  <script><%= contents %></script>')({
  contents
}) : template('  <script type="text/javascript" src="<%- src %>"></script>')({
  src: rootUrlPathPrefix + pathname
})), '', '', '</body>', '</html>'].join('\n');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"template-web.cordova.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/boilerplate-generator/template-web.cordova.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  headTemplate: () => headTemplate,
  closeTemplate: () => closeTemplate
});
let template;
module.link("./template", {
  default(v) {
    template = v;
  }

}, 0);

const headTemplate = ({
  meteorRuntimeConfig,
  rootUrlPathPrefix,
  inlineScriptsAllowed,
  css,
  js,
  additionalStaticJs,
  htmlAttributes,
  bundledJsCssUrlRewriteHook,
  head,
  dynamicHead
}) => {
  var headSections = head.split(/<meteor-bundled-css[^<>]*>/, 2);
  var cssBundle = [// We are explicitly not using bundledJsCssUrlRewriteHook: in cordova we serve assets up directly from disk, so rewriting the URL does not make sense
  ...(css || []).map(file => template('  <link rel="stylesheet" type="text/css" class="__meteor-css__" href="<%- href %>">')({
    href: file.url
  }))].join('\n');
  return ['<html>', '<head>', '  <meta charset="utf-8">', '  <meta name="format-detection" content="telephone=no">', '  <meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, height=device-height, viewport-fit=cover">', '  <meta name="msapplication-tap-highlight" content="no">', '  <meta http-equiv="Content-Security-Policy" content="default-src * gap: data: blob: \'unsafe-inline\' \'unsafe-eval\' ws: wss:;">', headSections.length === 1 ? [cssBundle, headSections[0]].join('\n') : [headSections[0], cssBundle, headSections[1]].join('\n'), '  <script type="text/javascript">', template('    __meteor_runtime_config__ = JSON.parse(decodeURIComponent(<%= conf %>));')({
    conf: meteorRuntimeConfig
  }), '    if (/Android/i.test(navigator.userAgent)) {', // When Android app is emulated, it cannot connect to localhost,
  // instead it should connect to 10.0.2.2
  // (unless we\'re using an http proxy; then it works!)
  '      if (!__meteor_runtime_config__.httpProxyPort) {', '        __meteor_runtime_config__.ROOT_URL = (__meteor_runtime_config__.ROOT_URL || \'\').replace(/localhost/i, \'10.0.2.2\');', '        __meteor_runtime_config__.DDP_DEFAULT_CONNECTION_URL = (__meteor_runtime_config__.DDP_DEFAULT_CONNECTION_URL || \'\').replace(/localhost/i, \'10.0.2.2\');', '      }', '    }', '  </script>', '', '  <script type="text/javascript" src="/cordova.js"></script>', ...(js || []).map(file => template('  <script type="text/javascript" src="<%- src %>"></script>')({
    src: file.url
  })), ...(additionalStaticJs || []).map(({
    contents,
    pathname
  }) => inlineScriptsAllowed ? template('  <script><%= contents %></script>')({
    contents
  }) : template('  <script type="text/javascript" src="<%- src %>"></script>')({
    src: Meteor.absoluteUrl(pathname)
  })), '', '</head>', '', '<body>'].join('\n');
};

function closeTemplate() {
  return "</body>\n</html>";
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"template.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/boilerplate-generator/template.js                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  default: () => template
});

let _;

module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }

}, 0);

function template(text) {
  return _.template(text, null, {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g
  });
}

;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"combined-stream2":{"package.json":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/boilerplate-generator/node_modules/combined-stream2/package.json                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.exports = {
  "name": "combined-stream2",
  "version": "1.1.2",
  "main": "index.js"
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/boilerplate-generator/node_modules/combined-stream2/index.js                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.useNode();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/boilerplate-generator/generator.js");

/* Exports */
Package._define("boilerplate-generator", exports, {
  Boilerplate: Boilerplate
});

})();

//# sourceURL=meteor://💻app/packages/boilerplate-generator.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYm9pbGVycGxhdGUtZ2VuZXJhdG9yL2dlbmVyYXRvci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYm9pbGVycGxhdGUtZ2VuZXJhdG9yL3RlbXBsYXRlLXdlYi5icm93c2VyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9ib2lsZXJwbGF0ZS1nZW5lcmF0b3IvdGVtcGxhdGUtd2ViLmNvcmRvdmEuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2JvaWxlcnBsYXRlLWdlbmVyYXRvci90ZW1wbGF0ZS5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJCb2lsZXJwbGF0ZSIsInJlYWRGaWxlIiwibGluayIsInYiLCJjcmVhdGVTdHJlYW0iLCJjcmVhdGUiLCJXZWJCcm93c2VyVGVtcGxhdGUiLCJkZWZhdWx0IiwiV2ViQ29yZG92YVRlbXBsYXRlIiwicmVhZFV0ZjhGaWxlU3luYyIsImZpbGVuYW1lIiwiTWV0ZW9yIiwid3JhcEFzeW5jIiwiaWRlbnRpdHkiLCJ2YWx1ZSIsImFwcGVuZFRvU3RyZWFtIiwiY2h1bmsiLCJzdHJlYW0iLCJhcHBlbmQiLCJCdWZmZXIiLCJmcm9tIiwiaXNCdWZmZXIiLCJyZWFkIiwic2hvdWxkV2FybkFib3V0VG9IVE1MRGVwcmVjYXRpb24iLCJpc1Byb2R1Y3Rpb24iLCJjb25zdHJ1Y3RvciIsImFyY2giLCJtYW5pZmVzdCIsIm9wdGlvbnMiLCJoZWFkVGVtcGxhdGUiLCJjbG9zZVRlbXBsYXRlIiwiZ2V0VGVtcGxhdGUiLCJiYXNlRGF0YSIsIl9nZW5lcmF0ZUJvaWxlcnBsYXRlRnJvbU1hbmlmZXN0IiwidG9IVE1MIiwiZXh0cmFEYXRhIiwiY29uc29sZSIsImVycm9yIiwidHJhY2UiLCJ0b0hUTUxBc3luYyIsImF3YWl0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJ0b0hUTUxTdHJlYW0iLCJjaHVua3MiLCJvbiIsInB1c2giLCJjb25jYXQiLCJ0b1N0cmluZyIsIkVycm9yIiwiZGF0YSIsInN0YXJ0IiwiYm9keSIsImR5bmFtaWNCb2R5IiwiZW5kIiwicmVzcG9uc2UiLCJ1cmxNYXBwZXIiLCJwYXRoTWFwcGVyIiwiYmFzZURhdGFFeHRlbnNpb24iLCJpbmxpbmUiLCJib2lsZXJwbGF0ZUJhc2VEYXRhIiwiY3NzIiwianMiLCJoZWFkIiwibWV0ZW9yTWFuaWZlc3QiLCJKU09OIiwic3RyaW5naWZ5IiwiZm9yRWFjaCIsIml0ZW0iLCJ1cmxQYXRoIiwidXJsIiwiaXRlbU9iaiIsInNjcmlwdENvbnRlbnQiLCJwYXRoIiwic3JpIiwidHlwZSIsIndoZXJlIiwic3RhcnRzV2l0aCIsInByZWZpeCIsInNwbGl0Iiwiam9pbiIsInRlbXBsYXRlIiwibW9kZSIsImh0bWxBdHRyaWJ1dGVzIiwiYnVuZGxlZEpzQ3NzVXJsUmV3cml0ZUhvb2siLCJzcmlNb2RlIiwiZHluYW1pY0hlYWQiLCJoZWFkU2VjdGlvbnMiLCJjc3NCdW5kbGUiLCJtYXAiLCJmaWxlIiwiaHJlZiIsIk9iamVjdCIsImtleXMiLCJrZXkiLCJhdHRyTmFtZSIsImF0dHJWYWx1ZSIsImxlbmd0aCIsIm1ldGVvclJ1bnRpbWVDb25maWciLCJyb290VXJsUGF0aFByZWZpeCIsImlubGluZVNjcmlwdHNBbGxvd2VkIiwiYWRkaXRpb25hbFN0YXRpY0pzIiwiY29uZiIsInNyYyIsImNvbnRlbnRzIiwicGF0aG5hbWUiLCJhYnNvbHV0ZVVybCIsIl8iLCJ0ZXh0IiwiZXZhbHVhdGUiLCJpbnRlcnBvbGF0ZSIsImVzY2FwZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjO0FBQUNDLGFBQVcsRUFBQyxNQUFJQTtBQUFqQixDQUFkO0FBQTZDLElBQUlDLFFBQUo7QUFBYUgsTUFBTSxDQUFDSSxJQUFQLENBQVksSUFBWixFQUFpQjtBQUFDRCxVQUFRLENBQUNFLENBQUQsRUFBRztBQUFDRixZQUFRLEdB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QUFuQjtBQURtRSxHQUF4RSxDQUxILENBcENFLEVBNkNMLEVBN0NLLEVBOENMLFNBOUNLLEVBK0NMLEVBL0NLLEVBZ0RMLFFBaERLLEVBaURMekIsSUFqREssQ0FpREEsSUFqREEsQ0FBUDtBQWtERCxDQXZFTTs7QUF5RUEsU0FBU25ELGFBQVQsR0FBeUI7QUFDOUIsU0FBTyxrQkFBUDtBQUNELEM7Ozs7Ozs7Ozs7O0FDOUVEaEMsTUFBTSxDQUFDQyxNQUFQLENBQWM7QUFBQ1EsU0FBTyxFQUFDLE1BQUkyRTtBQUFiLENBQWQ7O0FBQXNDLElBQUkwQixDQUFKOztBQUFNOUcsTUFBTSxDQUFDSSxJQUFQLENBQVksbUJBQVosRUFBZ0M7QUFBQzBHLEdBQUMsQ0FBQ3pHLENBQUQsRUFBRztBQUFDeUcsS0FBQyxHQUFDekcsQ0FBRjtBQUFJOztBQUFWLENBQWhDLEVBQTRDLENBQTVDOztBQU83QixTQUFTK0UsUUFBVCxDQUFrQjJCLElBQWxCLEVBQXdCO0FBQ3JDLFNBQU9ELENBQUMsQ0FBQzFCLFFBQUYsQ0FBVzJCLElBQVgsRUFBaUIsSUFBakIsRUFBdUI7QUFDNUJDLFlBQVEsRUFBTSxpQkFEYztBQUU1QkMsZUFBVyxFQUFHLGtCQUZjO0FBRzVCQyxVQUFNLEVBQVE7QUFIYyxHQUF2QixDQUFQO0FBS0Q7O0FBQUEsQyIsImZpbGUiOiIvcGFja2FnZXMvYm9pbGVycGxhdGUtZ2VuZXJhdG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVhZEZpbGUgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBjcmVhdGUgYXMgY3JlYXRlU3RyZWFtIH0gZnJvbSBcImNvbWJpbmVkLXN0cmVhbTJcIjtcblxuaW1wb3J0IFdlYkJyb3dzZXJUZW1wbGF0ZSBmcm9tICcuL3RlbXBsYXRlLXdlYi5icm93c2VyJztcbmltcG9ydCBXZWJDb3Jkb3ZhVGVtcGxhdGUgZnJvbSAnLi90ZW1wbGF0ZS13ZWIuY29yZG92YSc7XG5cbi8vIENvcGllZCBmcm9tIHdlYmFwcF9zZXJ2ZXJcbmNvbnN0IHJlYWRVdGY4RmlsZVN5bmMgPSBmaWxlbmFtZSA9PiBNZXRlb3Iud3JhcEFzeW5jKHJlYWRGaWxlKShmaWxlbmFtZSwgJ3V0ZjgnKTtcblxuY29uc3QgaWRlbnRpdHkgPSB2YWx1ZSA9PiB2YWx1ZTtcblxuZnVuY3Rpb24gYXBwZW5kVG9TdHJlYW0oY2h1bmssIHN0cmVhbSkge1xuICBpZiAodHlwZW9mIGNodW5rID09PSBcInN0cmluZ1wiKSB7XG4gICAgc3RyZWFtLmFwcGVuZChCdWZmZXIuZnJvbShjaHVuaywgXCJ1dGY4XCIpKTtcbiAgfSBlbHNlIGlmIChCdWZmZXIuaXNCdWZmZXIoY2h1bmspIHx8XG4gICAgICAgICAgICAgdHlwZW9mIGNodW5rLnJlYWQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHN0cmVhbS5hcHBlbmQoY2h1bmspO1xuICB9XG59XG5cbmxldCBzaG91bGRXYXJuQWJvdXRUb0hUTUxEZXByZWNhdGlvbiA9ICEgTWV0ZW9yLmlzUHJvZHVjdGlvbjtcblxuZXhwb3J0IGNsYXNzIEJvaWxlcnBsYXRlIHtcbiAgY29uc3RydWN0b3IoYXJjaCwgbWFuaWZlc3QsIG9wdGlvbnMgPSB7fSkge1xuICAgIGNvbnN0IHsgaGVhZFRlbXBsYXRlLCBjbG9zZVRlbXBsYXRlIH0gPSBnZXRUZW1wbGF0ZShhcmNoKTtcbiAgICB0aGlzLmhlYWRUZW1wbGF0ZSA9IGhlYWRUZW1wbGF0ZTtcbiAgICB0aGlzLmNsb3NlVGVtcGxhdGUgPSBjbG9zZVRlbXBsYXRlO1xuICAgIHRoaXMuYmFzZURhdGEgPSBudWxsO1xuXG4gICAgdGhpcy5fZ2VuZXJhdGVCb2lsZXJwbGF0ZUZyb21NYW5pZmVzdChcbiAgICAgIG1hbmlmZXN0LFxuICAgICAgb3B0aW9uc1xuICAgICk7XG4gIH1cblxuICB0b0hUTUwoZXh0cmFEYXRhKSB7XG4gICAgaWYgKHNob3VsZFdhcm5BYm91dFRvSFRNTERlcHJlY2F0aW9uKSB7XG4gICAgICBzaG91bGRXYXJuQWJvdXRUb0hUTUxEZXByZWNhdGlvbiA9IGZhbHNlO1xuICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgXCJUaGUgQm9pbGVycGxhdGUjdG9IVE1MIG1ldGhvZCBoYXMgYmVlbiBkZXByZWNhdGVkLiBcIiArXG4gICAgICAgICAgXCJQbGVhc2UgdXNlIEJvaWxlcnBsYXRlI3RvSFRNTFN0cmVhbSBpbnN0ZWFkLlwiXG4gICAgICApO1xuICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgIH1cblxuICAgIC8vIENhbGxpbmcgLmF3YWl0KCkgcmVxdWlyZXMgYSBGaWJlci5cbiAgICByZXR1cm4gdGhpcy50b0hUTUxBc3luYyhleHRyYURhdGEpLmF3YWl0KCk7XG4gIH1cblxuICAvLyBSZXR1cm5zIGEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGEgc3RyaW5nIG9mIEhUTUwuXG4gIHRvSFRNTEFzeW5jKGV4dHJhRGF0YSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCBzdHJlYW0gPSB0aGlzLnRvSFRNTFN0cmVhbShleHRyYURhdGEpO1xuICAgICAgY29uc3QgY2h1bmtzID0gW107XG4gICAgICBzdHJlYW0ub24oXCJkYXRhXCIsIGNodW5rID0+IGNodW5rcy5wdXNoKGNodW5rKSk7XG4gICAgICBzdHJlYW0ub24oXCJlbmRcIiwgKCkgPT4ge1xuICAgICAgICByZXNvbHZlKEJ1ZmZlci5jb25jYXQoY2h1bmtzKS50b1N0cmluZyhcInV0ZjhcIikpO1xuICAgICAgfSk7XG4gICAgICBzdHJlYW0ub24oXCJlcnJvclwiLCByZWplY3QpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gVGhlICdleHRyYURhdGEnIGFyZ3VtZW50IGNhbiBiZSB1c2VkIHRvIGV4dGVuZCAnc2VsZi5iYXNlRGF0YScuIEl0c1xuICAvLyBwdXJwb3NlIGlzIHRvIGFsbG93IHlvdSB0byBzcGVjaWZ5IGRhdGEgdGhhdCB5b3UgbWlnaHQgbm90IGtub3cgYXRcbiAgLy8gdGhlIHRpbWUgdGhhdCB5b3UgY29uc3RydWN0IHRoZSBCb2lsZXJwbGF0ZSBvYmplY3QuIChlLmcuIGl0IGlzIHVzZWRcbiAgLy8gYnkgJ3dlYmFwcCcgdG8gc3BlY2lmeSBkYXRhIHRoYXQgaXMgb25seSBrbm93biBhdCByZXF1ZXN0LXRpbWUpLlxuICAvLyB0aGlzIHJldHVybnMgYSBzdHJlYW1cbiAgdG9IVE1MU3RyZWFtKGV4dHJhRGF0YSkge1xuICAgIGlmICghdGhpcy5iYXNlRGF0YSB8fCAhdGhpcy5oZWFkVGVtcGxhdGUgfHwgIXRoaXMuY2xvc2VUZW1wbGF0ZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdCb2lsZXJwbGF0ZSBkaWQgbm90IGluc3RhbnRpYXRlIGNvcnJlY3RseS4nKTtcbiAgICB9XG5cbiAgICBjb25zdCBkYXRhID0gey4uLnRoaXMuYmFzZURhdGEsIC4uLmV4dHJhRGF0YX07XG4gICAgY29uc3Qgc3RhcnQgPSBcIjwhRE9DVFlQRSBodG1sPlxcblwiICsgdGhpcy5oZWFkVGVtcGxhdGUoZGF0YSk7XG5cbiAgICBjb25zdCB7IGJvZHksIGR5bmFtaWNCb2R5IH0gPSBkYXRhO1xuXG4gICAgY29uc3QgZW5kID0gdGhpcy5jbG9zZVRlbXBsYXRlKGRhdGEpO1xuICAgIGNvbnN0IHJlc3BvbnNlID0gY3JlYXRlU3RyZWFtKCk7XG5cbiAgICBhcHBlbmRUb1N0cmVhbShzdGFydCwgcmVzcG9uc2UpO1xuXG4gICAgaWYgKGJvZHkpIHtcbiAgICAgIGFwcGVuZFRvU3RyZWFtKGJvZHksIHJlc3BvbnNlKTtcbiAgICB9XG5cbiAgICBpZiAoZHluYW1pY0JvZHkpIHtcbiAgICAgIGFwcGVuZFRvU3RyZWFtKGR5bmFtaWNCb2R5LCByZXNwb25zZSk7XG4gICAgfVxuXG4gICAgYXBwZW5kVG9TdHJlYW0oZW5kLCByZXNwb25zZSk7XG5cbiAgICByZXR1cm4gcmVzcG9uc2U7XG4gIH1cblxuICAvLyBYWFggRXhwb3J0ZWQgdG8gYWxsb3cgY2xpZW50LXNpZGUgb25seSBjaGFuZ2VzIHRvIHJlYnVpbGQgdGhlIGJvaWxlcnBsYXRlXG4gIC8vIHdpdGhvdXQgcmVxdWlyaW5nIGEgZnVsbCBzZXJ2ZXIgcmVzdGFydC5cbiAgLy8gUHJvZHVjZXMgYW4gSFRNTCBzdHJpbmcgd2l0aCBnaXZlbiBtYW5pZmVzdCBhbmQgYm9pbGVycGxhdGVTb3VyY2UuXG4gIC8vIE9wdGlvbmFsbHkgdGFrZXMgdXJsTWFwcGVyIGluIGNhc2UgdXJscyBmcm9tIG1hbmlmZXN0IG5lZWQgdG8gYmUgcHJlZml4ZWRcbiAgLy8gb3IgcmV3cml0dGVuLlxuICAvLyBPcHRpb25hbGx5IHRha2VzIHBhdGhNYXBwZXIgZm9yIHJlc29sdmluZyByZWxhdGl2ZSBmaWxlIHN5c3RlbSBwYXRocy5cbiAgLy8gT3B0aW9uYWxseSBhbGxvd3MgdG8gb3ZlcnJpZGUgZmllbGRzIG9mIHRoZSBkYXRhIGNvbnRleHQuXG4gIF9nZW5lcmF0ZUJvaWxlcnBsYXRlRnJvbU1hbmlmZXN0KG1hbmlmZXN0LCB7XG4gICAgdXJsTWFwcGVyID0gaWRlbnRpdHksXG4gICAgcGF0aE1hcHBlciA9IGlkZW50aXR5LFxuICAgIGJhc2VEYXRhRXh0ZW5zaW9uLFxuICAgIGlubGluZSxcbiAgfSA9IHt9KSB7XG5cbiAgICBjb25zdCBib2lsZXJwbGF0ZUJhc2VEYXRhID0ge1xuICAgICAgY3NzOiBbXSxcbiAgICAgIGpzOiBbXSxcbiAgICAgIGhlYWQ6ICcnLFxuICAgICAgYm9keTogJycsXG4gICAgICBtZXRlb3JNYW5pZmVzdDogSlNPTi5zdHJpbmdpZnkobWFuaWZlc3QpLFxuICAgICAgLi4uYmFzZURhdGFFeHRlbnNpb24sXG4gICAgfTtcblxuICAgIG1hbmlmZXN0LmZvckVhY2goaXRlbSA9PiB7XG4gICAgICBjb25zdCB1cmxQYXRoID0gdXJsTWFwcGVyKGl0ZW0udXJsKTtcbiAgICAgIGNvbnN0IGl0ZW1PYmogPSB7IHVybDogdXJsUGF0aCB9O1xuXG4gICAgICBpZiAoaW5saW5lKSB7XG4gICAgICAgIGl0ZW1PYmouc2NyaXB0Q29udGVudCA9IHJlYWRVdGY4RmlsZVN5bmMoXG4gICAgICAgICAgcGF0aE1hcHBlcihpdGVtLnBhdGgpKTtcbiAgICAgICAgaXRlbU9iai5pbmxpbmUgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChpdGVtLnNyaSkge1xuICAgICAgICBpdGVtT2JqLnNyaSA9IGl0ZW0uc3JpO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXRlbS50eXBlID09PSAnY3NzJyAmJiBpdGVtLndoZXJlID09PSAnY2xpZW50Jykge1xuICAgICAgICBib2lsZXJwbGF0ZUJhc2VEYXRhLmNzcy5wdXNoKGl0ZW1PYmopO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXRlbS50eXBlID09PSAnanMnICYmIGl0ZW0ud2hlcmUgPT09ICdjbGllbnQnICYmXG4gICAgICAgIC8vIER5bmFtaWMgSlMgbW9kdWxlcyBzaG91bGQgbm90IGJlIGxvYWRlZCBlYWdlcmx5IGluIHRoZVxuICAgICAgICAvLyBpbml0aWFsIEhUTUwgb2YgdGhlIGFwcC5cbiAgICAgICAgIWl0ZW0ucGF0aC5zdGFydHNXaXRoKCdkeW5hbWljLycpKSB7XG4gICAgICAgIGJvaWxlcnBsYXRlQmFzZURhdGEuanMucHVzaChpdGVtT2JqKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGl0ZW0udHlwZSA9PT0gJ2hlYWQnKSB7XG4gICAgICAgIGJvaWxlcnBsYXRlQmFzZURhdGEuaGVhZCA9XG4gICAgICAgICAgcmVhZFV0ZjhGaWxlU3luYyhwYXRoTWFwcGVyKGl0ZW0ucGF0aCkpO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXRlbS50eXBlID09PSAnYm9keScpIHtcbiAgICAgICAgYm9pbGVycGxhdGVCYXNlRGF0YS5ib2R5ID1cbiAgICAgICAgICByZWFkVXRmOEZpbGVTeW5jKHBhdGhNYXBwZXIoaXRlbS5wYXRoKSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLmJhc2VEYXRhID0gYm9pbGVycGxhdGVCYXNlRGF0YTtcbiAgfVxufTtcblxuLy8gUmV0dXJucyBhIHRlbXBsYXRlIGZ1bmN0aW9uIHRoYXQsIHdoZW4gY2FsbGVkLCBwcm9kdWNlcyB0aGUgYm9pbGVycGxhdGVcbi8vIGh0bWwgYXMgYSBzdHJpbmcuXG5mdW5jdGlvbiBnZXRUZW1wbGF0ZShhcmNoKSB7XG4gIGNvbnN0IHByZWZpeCA9IGFyY2guc3BsaXQoXCIuXCIsIDIpLmpvaW4oXCIuXCIpO1xuXG4gIGlmIChwcmVmaXggPT09IFwid2ViLmJyb3dzZXJcIikge1xuICAgIHJldHVybiBXZWJCcm93c2VyVGVtcGxhdGU7XG4gIH1cblxuICBpZiAocHJlZml4ID09PSBcIndlYi5jb3Jkb3ZhXCIpIHtcbiAgICByZXR1cm4gV2ViQ29yZG92YVRlbXBsYXRlO1xuICB9XG5cbiAgdGhyb3cgbmV3IEVycm9yKFwiVW5zdXBwb3J0ZWQgYXJjaDogXCIgKyBhcmNoKTtcbn1cbiIsImltcG9ydCB0ZW1wbGF0ZSBmcm9tICcuL3RlbXBsYXRlJztcblxuY29uc3Qgc3JpID0gKHNyaSwgbW9kZSkgPT5cbiAgKHNyaSAmJiBtb2RlKSA/IGAgaW50ZWdyaXR5PVwic2hhNTEyLSR7c3JpfVwiIGNyb3Nzb3JpZ2luPVwiJHttb2RlfVwiYCA6ICcnO1xuXG5leHBvcnQgY29uc3QgaGVhZFRlbXBsYXRlID0gKHtcbiAgY3NzLFxuICBodG1sQXR0cmlidXRlcyxcbiAgYnVuZGxlZEpzQ3NzVXJsUmV3cml0ZUhvb2ssXG4gIHNyaU1vZGUsXG4gIGhlYWQsXG4gIGR5bmFtaWNIZWFkLFxufSkgPT4ge1xuICB2YXIgaGVhZFNlY3Rpb25zID0gaGVhZC5zcGxpdCgvPG1ldGVvci1idW5kbGVkLWNzc1tePD5dKj4vLCAyKTtcbiAgdmFyIGNzc0J1bmRsZSA9IFsuLi4oY3NzIHx8IFtdKS5tYXAoZmlsZSA9PlxuICAgIHRlbXBsYXRlKCcgIDxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiB0eXBlPVwidGV4dC9jc3NcIiBjbGFzcz1cIl9fbWV0ZW9yLWNzc19fXCIgaHJlZj1cIjwlLSBocmVmICU+XCI8JT0gc3JpICU+PicpKHtcbiAgICAgIGhyZWY6IGJ1bmRsZWRKc0Nzc1VybFJld3JpdGVIb29rKGZpbGUudXJsKSxcbiAgICAgIHNyaTogc3JpKGZpbGUuc3JpLCBzcmlNb2RlKSxcbiAgICB9KVxuICApXS5qb2luKCdcXG4nKTtcblxuICByZXR1cm4gW1xuICAgICc8aHRtbCcgKyBPYmplY3Qua2V5cyhodG1sQXR0cmlidXRlcyB8fCB7fSkubWFwKFxuICAgICAga2V5ID0+IHRlbXBsYXRlKCcgPCU9IGF0dHJOYW1lICU+PVwiPCUtIGF0dHJWYWx1ZSAlPlwiJykoe1xuICAgICAgICBhdHRyTmFtZToga2V5LFxuICAgICAgICBhdHRyVmFsdWU6IGh0bWxBdHRyaWJ1dGVzW2tleV0sXG4gICAgICB9KVxuICAgICkuam9pbignJykgKyAnPicsXG5cbiAgICAnPGhlYWQ+JyxcblxuICAgIChoZWFkU2VjdGlvbnMubGVuZ3RoID09PSAxKVxuICAgICAgPyBbY3NzQnVuZGxlLCBoZWFkU2VjdGlvbnNbMF1dLmpvaW4oJ1xcbicpXG4gICAgICA6IFtoZWFkU2VjdGlvbnNbMF0sIGNzc0J1bmRsZSwgaGVhZFNlY3Rpb25zWzFdXS5qb2luKCdcXG4nKSxcblxuICAgIGR5bmFtaWNIZWFkLFxuICAgICc8L2hlYWQ+JyxcbiAgICAnPGJvZHk+JyxcbiAgXS5qb2luKCdcXG4nKTtcbn07XG5cbi8vIFRlbXBsYXRlIGZ1bmN0aW9uIGZvciByZW5kZXJpbmcgdGhlIGJvaWxlcnBsYXRlIGh0bWwgZm9yIGJyb3dzZXJzXG5leHBvcnQgY29uc3QgY2xvc2VUZW1wbGF0ZSA9ICh7XG4gIG1ldGVvclJ1bnRpbWVDb25maWcsXG4gIHJvb3RVcmxQYXRoUHJlZml4LFxuICBpbmxpbmVTY3JpcHRzQWxsb3dlZCxcbiAganMsXG4gIGFkZGl0aW9uYWxTdGF0aWNKcyxcbiAgYnVuZGxlZEpzQ3NzVXJsUmV3cml0ZUhvb2ssXG4gIHNyaU1vZGUsXG59KSA9PiBbXG4gICcnLFxuICBpbmxpbmVTY3JpcHRzQWxsb3dlZFxuICAgID8gdGVtcGxhdGUoJyAgPHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCI+X19tZXRlb3JfcnVudGltZV9jb25maWdfXyA9IEpTT04ucGFyc2UoZGVjb2RlVVJJQ29tcG9uZW50KDwlPSBjb25mICU+KSk8L3NjcmlwdD4nKSh7XG4gICAgICBjb25mOiBtZXRlb3JSdW50aW1lQ29uZmlnLFxuICAgIH0pXG4gICAgOiB0ZW1wbGF0ZSgnICA8c2NyaXB0IHR5cGU9XCJ0ZXh0L2phdmFzY3JpcHRcIiBzcmM9XCI8JS0gc3JjICU+L21ldGVvcl9ydW50aW1lX2NvbmZpZy5qc1wiPjwvc2NyaXB0PicpKHtcbiAgICAgIHNyYzogcm9vdFVybFBhdGhQcmVmaXgsXG4gICAgfSksXG4gICcnLFxuXG4gIC4uLihqcyB8fCBbXSkubWFwKGZpbGUgPT5cbiAgICB0ZW1wbGF0ZSgnICA8c2NyaXB0IHR5cGU9XCJ0ZXh0L2phdmFzY3JpcHRcIiBzcmM9XCI8JS0gc3JjICU+XCI8JT0gc3JpICU+Pjwvc2NyaXB0PicpKHtcbiAgICAgIHNyYzogYnVuZGxlZEpzQ3NzVXJsUmV3cml0ZUhvb2soZmlsZS51cmwpLFxuICAgICAgc3JpOiBzcmkoZmlsZS5zcmksIHNyaU1vZGUpLFxuICAgIH0pXG4gICksXG5cbiAgLi4uKGFkZGl0aW9uYWxTdGF0aWNKcyB8fCBbXSkubWFwKCh7IGNvbnRlbnRzLCBwYXRobmFtZSB9KSA9PiAoXG4gICAgaW5saW5lU2NyaXB0c0FsbG93ZWRcbiAgICAgID8gdGVtcGxhdGUoJyAgPHNjcmlwdD48JT0gY29udGVudHMgJT48L3NjcmlwdD4nKSh7XG4gICAgICAgIGNvbnRlbnRzLFxuICAgICAgfSlcbiAgICAgIDogdGVtcGxhdGUoJyAgPHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCIgc3JjPVwiPCUtIHNyYyAlPlwiPjwvc2NyaXB0PicpKHtcbiAgICAgICAgc3JjOiByb290VXJsUGF0aFByZWZpeCArIHBhdGhuYW1lLFxuICAgICAgfSlcbiAgKSksXG5cbiAgJycsXG4gICcnLFxuICAnPC9ib2R5PicsXG4gICc8L2h0bWw+J1xuXS5qb2luKCdcXG4nKTtcbiIsImltcG9ydCB0ZW1wbGF0ZSBmcm9tICcuL3RlbXBsYXRlJztcblxuLy8gVGVtcGxhdGUgZnVuY3Rpb24gZm9yIHJlbmRlcmluZyB0aGUgYm9pbGVycGxhdGUgaHRtbCBmb3IgY29yZG92YVxuZXhwb3J0IGNvbnN0IGhlYWRUZW1wbGF0ZSA9ICh7XG4gIG1ldGVvclJ1bnRpbWVDb25maWcsXG4gIHJvb3RVcmxQYXRoUHJlZml4LFxuICBpbmxpbmVTY3JpcHRzQWxsb3dlZCxcbiAgY3NzLFxuICBqcyxcbiAgYWRkaXRpb25hbFN0YXRpY0pzLFxuICBodG1sQXR0cmlidXRlcyxcbiAgYnVuZGxlZEpzQ3NzVXJsUmV3cml0ZUhvb2ssXG4gIGhlYWQsXG4gIGR5bmFtaWNIZWFkLFxufSkgPT4ge1xuICB2YXIgaGVhZFNlY3Rpb25zID0gaGVhZC5zcGxpdCgvPG1ldGVvci1idW5kbGVkLWNzc1tePD5dKj4vLCAyKTtcbiAgdmFyIGNzc0J1bmRsZSA9IFtcbiAgICAvLyBXZSBhcmUgZXhwbGljaXRseSBub3QgdXNpbmcgYnVuZGxlZEpzQ3NzVXJsUmV3cml0ZUhvb2s6IGluIGNvcmRvdmEgd2Ugc2VydmUgYXNzZXRzIHVwIGRpcmVjdGx5IGZyb20gZGlzaywgc28gcmV3cml0aW5nIHRoZSBVUkwgZG9lcyBub3QgbWFrZSBzZW5zZVxuICAgIC4uLihjc3MgfHwgW10pLm1hcChmaWxlID0+XG4gICAgICB0ZW1wbGF0ZSgnICA8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgdHlwZT1cInRleHQvY3NzXCIgY2xhc3M9XCJfX21ldGVvci1jc3NfX1wiIGhyZWY9XCI8JS0gaHJlZiAlPlwiPicpKHtcbiAgICAgICAgaHJlZjogZmlsZS51cmwsXG4gICAgICB9KVxuICApXS5qb2luKCdcXG4nKTtcblxuICByZXR1cm4gW1xuICAgICc8aHRtbD4nLFxuICAgICc8aGVhZD4nLFxuICAgICcgIDxtZXRhIGNoYXJzZXQ9XCJ1dGYtOFwiPicsXG4gICAgJyAgPG1ldGEgbmFtZT1cImZvcm1hdC1kZXRlY3Rpb25cIiBjb250ZW50PVwidGVsZXBob25lPW5vXCI+JyxcbiAgICAnICA8bWV0YSBuYW1lPVwidmlld3BvcnRcIiBjb250ZW50PVwidXNlci1zY2FsYWJsZT1ubywgaW5pdGlhbC1zY2FsZT0xLCBtYXhpbXVtLXNjYWxlPTEsIG1pbmltdW0tc2NhbGU9MSwgd2lkdGg9ZGV2aWNlLXdpZHRoLCBoZWlnaHQ9ZGV2aWNlLWhlaWdodCwgdmlld3BvcnQtZml0PWNvdmVyXCI+JyxcbiAgICAnICA8bWV0YSBuYW1lPVwibXNhcHBsaWNhdGlvbi10YXAtaGlnaGxpZ2h0XCIgY29udGVudD1cIm5vXCI+JyxcbiAgICAnICA8bWV0YSBodHRwLWVxdWl2PVwiQ29udGVudC1TZWN1cml0eS1Qb2xpY3lcIiBjb250ZW50PVwiZGVmYXVsdC1zcmMgKiBnYXA6IGRhdGE6IGJsb2I6IFxcJ3Vuc2FmZS1pbmxpbmVcXCcgXFwndW5zYWZlLWV2YWxcXCcgd3M6IHdzczo7XCI+JyxcblxuICAoaGVhZFNlY3Rpb25zLmxlbmd0aCA9PT0gMSlcbiAgICA/IFtjc3NCdW5kbGUsIGhlYWRTZWN0aW9uc1swXV0uam9pbignXFxuJylcbiAgICA6IFtoZWFkU2VjdGlvbnNbMF0sIGNzc0J1bmRsZSwgaGVhZFNlY3Rpb25zWzFdXS5qb2luKCdcXG4nKSxcblxuICAgICcgIDxzY3JpcHQgdHlwZT1cInRleHQvamF2YXNjcmlwdFwiPicsXG4gICAgdGVtcGxhdGUoJyAgICBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fID0gSlNPTi5wYXJzZShkZWNvZGVVUklDb21wb25lbnQoPCU9IGNvbmYgJT4pKTsnKSh7XG4gICAgICBjb25mOiBtZXRlb3JSdW50aW1lQ29uZmlnLFxuICAgIH0pLFxuICAgICcgICAgaWYgKC9BbmRyb2lkL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkgeycsXG4gICAgLy8gV2hlbiBBbmRyb2lkIGFwcCBpcyBlbXVsYXRlZCwgaXQgY2Fubm90IGNvbm5lY3QgdG8gbG9jYWxob3N0LFxuICAgIC8vIGluc3RlYWQgaXQgc2hvdWxkIGNvbm5lY3QgdG8gMTAuMC4yLjJcbiAgICAvLyAodW5sZXNzIHdlXFwncmUgdXNpbmcgYW4gaHR0cCBwcm94eTsgdGhlbiBpdCB3b3JrcyEpXG4gICAgJyAgICAgIGlmICghX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5odHRwUHJveHlQb3J0KSB7JyxcbiAgICAnICAgICAgICBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLlJPT1RfVVJMID0gKF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uUk9PVF9VUkwgfHwgXFwnXFwnKS5yZXBsYWNlKC9sb2NhbGhvc3QvaSwgXFwnMTAuMC4yLjJcXCcpOycsXG4gICAgJyAgICAgICAgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ERFBfREVGQVVMVF9DT05ORUNUSU9OX1VSTCA9IChfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLkREUF9ERUZBVUxUX0NPTk5FQ1RJT05fVVJMIHx8IFxcJ1xcJykucmVwbGFjZSgvbG9jYWxob3N0L2ksIFxcJzEwLjAuMi4yXFwnKTsnLFxuICAgICcgICAgICB9JyxcbiAgICAnICAgIH0nLFxuICAgICcgIDwvc2NyaXB0PicsXG4gICAgJycsXG4gICAgJyAgPHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCIgc3JjPVwiL2NvcmRvdmEuanNcIj48L3NjcmlwdD4nLFxuXG4gICAgLi4uKGpzIHx8IFtdKS5tYXAoZmlsZSA9PlxuICAgICAgdGVtcGxhdGUoJyAgPHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCIgc3JjPVwiPCUtIHNyYyAlPlwiPjwvc2NyaXB0PicpKHtcbiAgICAgICAgc3JjOiBmaWxlLnVybCxcbiAgICAgIH0pXG4gICAgKSxcblxuICAgIC4uLihhZGRpdGlvbmFsU3RhdGljSnMgfHwgW10pLm1hcCgoeyBjb250ZW50cywgcGF0aG5hbWUgfSkgPT4gKFxuICAgICAgaW5saW5lU2NyaXB0c0FsbG93ZWRcbiAgICAgICAgPyB0ZW1wbGF0ZSgnICA8c2NyaXB0PjwlPSBjb250ZW50cyAlPjwvc2NyaXB0PicpKHtcbiAgICAgICAgICBjb250ZW50cyxcbiAgICAgICAgfSlcbiAgICAgICAgOiB0ZW1wbGF0ZSgnICA8c2NyaXB0IHR5cGU9XCJ0ZXh0L2phdmFzY3JpcHRcIiBzcmM9XCI8JS0gc3JjICU+XCI+PC9zY3JpcHQ+Jykoe1xuICAgICAgICAgIHNyYzogTWV0ZW9yLmFic29sdXRlVXJsKHBhdGhuYW1lKVxuICAgICAgICB9KVxuICAgICkpLFxuICAgICcnLFxuICAgICc8L2hlYWQ+JyxcbiAgICAnJyxcbiAgICAnPGJvZHk+JyxcbiAgXS5qb2luKCdcXG4nKTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBjbG9zZVRlbXBsYXRlKCkge1xuICByZXR1cm4gXCI8L2JvZHk+XFxuPC9odG1sPlwiO1xufVxuIiwiaW1wb3J0IHsgXyB9IGZyb20gJ21ldGVvci91bmRlcnNjb3JlJztcblxuLy8gQXMgaWRlbnRpZmllZCBpbiBpc3N1ZSAjOTE0OSwgd2hlbiBhbiBhcHBsaWNhdGlvbiBvdmVycmlkZXMgdGhlIGRlZmF1bHRcbi8vIF8udGVtcGxhdGUgc2V0dGluZ3MgdXNpbmcgXy50ZW1wbGF0ZVNldHRpbmdzLCB0aG9zZSBuZXcgc2V0dGluZ3MgYXJlXG4vLyB1c2VkIGFueXdoZXJlIF8udGVtcGxhdGUgaXMgdXNlZCwgaW5jbHVkaW5nIHdpdGhpbiB0aGVcbi8vIGJvaWxlcnBsYXRlLWdlbmVyYXRvci4gVG8gaGFuZGxlIHRoaXMsIF8udGVtcGxhdGUgc2V0dGluZ3MgdGhhdCBoYXZlXG4vLyBiZWVuIHZlcmlmaWVkIHRvIHdvcmsgYXJlIG92ZXJyaWRkZW4gaGVyZSBvbiBlYWNoIF8udGVtcGxhdGUgY2FsbC5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHRlbXBsYXRlKHRleHQpIHtcbiAgcmV0dXJuIF8udGVtcGxhdGUodGV4dCwgbnVsbCwge1xuICAgIGV2YWx1YXRlICAgIDogLzwlKFtcXHNcXFNdKz8pJT4vZyxcbiAgICBpbnRlcnBvbGF0ZSA6IC88JT0oW1xcc1xcU10rPyklPi9nLFxuICAgIGVzY2FwZSAgICAgIDogLzwlLShbXFxzXFxTXSs/KSU+L2csXG4gIH0pO1xufTtcbiJdfQ==
