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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYm9pbGVycGxhdGUtZ2VuZXJhdG9yL2dlbmVyYXRvci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYm9pbGVycGxhdGUtZ2VuZXJhdG9yL3RlbXBsYXRlLXdlYi5icm93c2VyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9ib2lsZXJwbGF0ZS1nZW5lcmF0b3IvdGVtcGxhdGUtd2ViLmNvcmRvdmEuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2JvaWxlcnBsYXRlLWdlbmVyYXRvci90ZW1wbGF0ZS5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJCb2lsZXJwbGF0ZSIsInJlYWRGaWxlIiwibGluayIsInYiLCJjcmVhdGVTdHJlYW0iLCJjcmVhdGUiLCJXZWJCcm93c2VyVGVtcGxhdGUiLCJkZWZhdWx0IiwiV2ViQ29yZG92YVRlbXBsYXRlIiwicmVhZFV0ZjhGaWxlU3luYyIsImZpbGVuYW1lIiwiTWV0ZW9yIiwid3JhcEFzeW5jIiwiaWRlbnRpdHkiLCJ2YWx1ZSIsImFwcGVuZFRvU3RyZWFtIiwiY2h1bmsiLCJzdHJlYW0iLCJhcHBlbmQiLCJCdWZmZXIiLCJmcm9tIiwiaXNCdWZmZXIiLCJyZWFkIiwic2hvdWxkV2FybkFib3V0VG9IVE1MRGVwcmVjYXRpb24iLCJpc1Byb2R1Y3Rpb24iLCJjb25zdHJ1Y3RvciIsImFyY2giLCJtYW5pZmVzdCIsIm9wdGlvbnMiLCJoZWFkVGVtcGxhdGUiLCJjbG9zZVRlbXBsYXRlIiwiZ2V0VGVtcGxhdGUiLCJiYXNlRGF0YSIsIl9nZW5lcmF0ZUJvaWxlcnBsYXRlRnJvbU1hbmlmZXN0IiwidG9IVE1MIiwiZXh0cmFEYXRhIiwiY29uc29sZSIsImVycm9yIiwidHJhY2UiLCJ0b0hUTUxBc3luYyIsImF3YWl0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJ0b0hUTUxTdHJlYW0iLCJjaHVua3MiLCJvbiIsInB1c2giLCJjb25jYXQiLCJ0b1N0cmluZyIsIkVycm9yIiwiZGF0YSIsInN0YXJ0IiwiYm9keSIsImR5bmFtaWNCb2R5IiwiZW5kIiwicmVzcG9uc2UiLCJ1cmxNYXBwZXIiLCJwYXRoTWFwcGVyIiwiYmFzZURhdGFFeHRlbnNpb24iLCJpbmxpbmUiLCJib2lsZXJwbGF0ZUJhc2VEYXRhIiwiY3NzIiwianMiLCJoZWFkIiwibWV0ZW9yTWFuaWZlc3QiLCJKU09OIiwic3RyaW5naWZ5IiwiZm9yRWFjaCIsIml0ZW0iLCJ1cmxQYXRoIiwidXJsIiwiaXRlbU9iaiIsInNjcmlwdENvbnRlbnQiLCJwYXRoIiwic3JpIiwidHlwZSIsIndoZXJlIiwic3RhcnRzV2l0aCIsInByZWZpeCIsInNwbGl0Iiwiam9pbiIsInRlbXBsYXRlIiwibW9kZSIsImh0bWxBdHRyaWJ1dGVzIiwiYnVuZGxlZEpzQ3NzVXJsUmV3cml0ZUhvb2siLCJzcmlNb2RlIiwiZHluYW1pY0hlYWQiLCJoZWFkU2VjdGlvbnMiLCJjc3NCdW5kbGUiLCJtYXAiLCJmaWxlIiwiaHJlZiIsIk9iamVjdCIsImtleXMiLCJrZXkiLCJhdHRyTmFtZSIsImF0dHJWYWx1ZSIsImxlbmd0aCIsIm1ldGVvclJ1bnRpbWVDb25maWciLCJyb290VXJsUGF0aFByZWZpeCIsImlubGluZVNjcmlwdHNBbGxvd2VkIiwiYWRkaXRpb25hbFN0YXRpY0pzIiwiY29uZiIsInNyYyIsImNvbnRlbnRzIiwicGF0aG5hbWUiLCJhYnNvbHV0ZVVybCIsIl8iLCJ0ZXh0IiwiZXZhbHVhdGUiLCJpbnRlcnBvbGF0ZSIsImVzY2FwZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjO0FBQUNDLGFBQVcsRUFBQyxNQUFJQTtBQUFqQixDQUFkO0FBQTZDLElBQUlDLFFBQUo7QUFBYUgsTUFBTSxDQUFDSSxJQUFQLENBQVksSUFBWixFQUFpQjtBQUFDRCxVQUFRLENBQUNFLENBQUQsRUFBRztBQUFDRixZQUFRLEdB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QUFuQjtBQURtRSxHQUF4RSxDQUxILENBcENFLEVBNkNMLEVBN0NLLEVBOENMLFNBOUNLLEVBK0NMLEVBL0NLLEVBZ0RMLFFBaERLLEVBaURMekIsSUFqREssQ0FpREEsSUFqREEsQ0FBUDtBQWtERCxDQXZFTTs7QUF5RUEsU0FBU25ELGFBQVQsR0FBeUI7QUFDOUIsU0FBTyxrQkFBUDtBQUNELEM7Ozs7Ozs7Ozs7O0FDOUVEaEMsTUFBTSxDQUFDQyxNQUFQLENBQWM7QUFBQ1EsU0FBTyxFQUFDLE1BQUkyRTtBQUFiLENBQWQ7O0FBQXNDLElBQUkwQixDQUFKOztBQUFNOUcsTUFBTSxDQUFDSSxJQUFQLENBQVksbUJBQVosRUFBZ0M7QUFBQzBHLEdBQUMsQ0FBQ3pHLENBQUQsRUFBRztBQUFDeUcsS0FBQyxHQUFDekcsQ0FBRjtBQUFJOztBQUFWLENBQWhDLEVBQTRDLENBQTVDOztBQU83QixTQUFTK0UsUUFBVCxDQUFrQjJCLElBQWxCLEVBQXdCO0FBQ3JDLFNBQU9ELENBQUMsQ0FBQzFCLFFBQUYsQ0FBVzJCLElBQVgsRUFBaUIsSUFBakIsRUFBdUI7QUFDNUJDLFlBQVEsRUFBTSxpQkFEYztBQUU1QkMsZUFBVyxFQUFHLGtCQUZjO0FBRzVCQyxVQUFNLEVBQVE7QUFIYyxHQUF2QixDQUFQO0FBS0Q7O0FBQUEsQyIsImZpbGUiOiIvcGFja2FnZXMvYm9pbGVycGxhdGUtZ2VuZXJhdG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVhZEZpbGUgfSBmcm9tICdmcyc7XHJcbmltcG9ydCB7IGNyZWF0ZSBhcyBjcmVhdGVTdHJlYW0gfSBmcm9tIFwiY29tYmluZWQtc3RyZWFtMlwiO1xyXG5cclxuaW1wb3J0IFdlYkJyb3dzZXJUZW1wbGF0ZSBmcm9tICcuL3RlbXBsYXRlLXdlYi5icm93c2VyJztcclxuaW1wb3J0IFdlYkNvcmRvdmFUZW1wbGF0ZSBmcm9tICcuL3RlbXBsYXRlLXdlYi5jb3Jkb3ZhJztcclxuXHJcbi8vIENvcGllZCBmcm9tIHdlYmFwcF9zZXJ2ZXJcclxuY29uc3QgcmVhZFV0ZjhGaWxlU3luYyA9IGZpbGVuYW1lID0+IE1ldGVvci53cmFwQXN5bmMocmVhZEZpbGUpKGZpbGVuYW1lLCAndXRmOCcpO1xyXG5cclxuY29uc3QgaWRlbnRpdHkgPSB2YWx1ZSA9PiB2YWx1ZTtcclxuXHJcbmZ1bmN0aW9uIGFwcGVuZFRvU3RyZWFtKGNodW5rLCBzdHJlYW0pIHtcclxuICBpZiAodHlwZW9mIGNodW5rID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICBzdHJlYW0uYXBwZW5kKEJ1ZmZlci5mcm9tKGNodW5rLCBcInV0ZjhcIikpO1xyXG4gIH0gZWxzZSBpZiAoQnVmZmVyLmlzQnVmZmVyKGNodW5rKSB8fFxyXG4gICAgICAgICAgICAgdHlwZW9mIGNodW5rLnJlYWQgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgc3RyZWFtLmFwcGVuZChjaHVuayk7XHJcbiAgfVxyXG59XHJcblxyXG5sZXQgc2hvdWxkV2FybkFib3V0VG9IVE1MRGVwcmVjYXRpb24gPSAhIE1ldGVvci5pc1Byb2R1Y3Rpb247XHJcblxyXG5leHBvcnQgY2xhc3MgQm9pbGVycGxhdGUge1xyXG4gIGNvbnN0cnVjdG9yKGFyY2gsIG1hbmlmZXN0LCBvcHRpb25zID0ge30pIHtcclxuICAgIGNvbnN0IHsgaGVhZFRlbXBsYXRlLCBjbG9zZVRlbXBsYXRlIH0gPSBnZXRUZW1wbGF0ZShhcmNoKTtcclxuICAgIHRoaXMuaGVhZFRlbXBsYXRlID0gaGVhZFRlbXBsYXRlO1xyXG4gICAgdGhpcy5jbG9zZVRlbXBsYXRlID0gY2xvc2VUZW1wbGF0ZTtcclxuICAgIHRoaXMuYmFzZURhdGEgPSBudWxsO1xyXG5cclxuICAgIHRoaXMuX2dlbmVyYXRlQm9pbGVycGxhdGVGcm9tTWFuaWZlc3QoXHJcbiAgICAgIG1hbmlmZXN0LFxyXG4gICAgICBvcHRpb25zXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgdG9IVE1MKGV4dHJhRGF0YSkge1xyXG4gICAgaWYgKHNob3VsZFdhcm5BYm91dFRvSFRNTERlcHJlY2F0aW9uKSB7XHJcbiAgICAgIHNob3VsZFdhcm5BYm91dFRvSFRNTERlcHJlY2F0aW9uID0gZmFsc2U7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgICAgXCJUaGUgQm9pbGVycGxhdGUjdG9IVE1MIG1ldGhvZCBoYXMgYmVlbiBkZXByZWNhdGVkLiBcIiArXHJcbiAgICAgICAgICBcIlBsZWFzZSB1c2UgQm9pbGVycGxhdGUjdG9IVE1MU3RyZWFtIGluc3RlYWQuXCJcclxuICAgICAgKTtcclxuICAgICAgY29uc29sZS50cmFjZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENhbGxpbmcgLmF3YWl0KCkgcmVxdWlyZXMgYSBGaWJlci5cclxuICAgIHJldHVybiB0aGlzLnRvSFRNTEFzeW5jKGV4dHJhRGF0YSkuYXdhaXQoKTtcclxuICB9XHJcblxyXG4gIC8vIFJldHVybnMgYSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYSBzdHJpbmcgb2YgSFRNTC5cclxuICB0b0hUTUxBc3luYyhleHRyYURhdGEpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0cmVhbSA9IHRoaXMudG9IVE1MU3RyZWFtKGV4dHJhRGF0YSk7XHJcbiAgICAgIGNvbnN0IGNodW5rcyA9IFtdO1xyXG4gICAgICBzdHJlYW0ub24oXCJkYXRhXCIsIGNodW5rID0+IGNodW5rcy5wdXNoKGNodW5rKSk7XHJcbiAgICAgIHN0cmVhbS5vbihcImVuZFwiLCAoKSA9PiB7XHJcbiAgICAgICAgcmVzb2x2ZShCdWZmZXIuY29uY2F0KGNodW5rcykudG9TdHJpbmcoXCJ1dGY4XCIpKTtcclxuICAgICAgfSk7XHJcbiAgICAgIHN0cmVhbS5vbihcImVycm9yXCIsIHJlamVjdCk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8vIFRoZSAnZXh0cmFEYXRhJyBhcmd1bWVudCBjYW4gYmUgdXNlZCB0byBleHRlbmQgJ3NlbGYuYmFzZURhdGEnLiBJdHNcclxuICAvLyBwdXJwb3NlIGlzIHRvIGFsbG93IHlvdSB0byBzcGVjaWZ5IGRhdGEgdGhhdCB5b3UgbWlnaHQgbm90IGtub3cgYXRcclxuICAvLyB0aGUgdGltZSB0aGF0IHlvdSBjb25zdHJ1Y3QgdGhlIEJvaWxlcnBsYXRlIG9iamVjdC4gKGUuZy4gaXQgaXMgdXNlZFxyXG4gIC8vIGJ5ICd3ZWJhcHAnIHRvIHNwZWNpZnkgZGF0YSB0aGF0IGlzIG9ubHkga25vd24gYXQgcmVxdWVzdC10aW1lKS5cclxuICAvLyB0aGlzIHJldHVybnMgYSBzdHJlYW1cclxuICB0b0hUTUxTdHJlYW0oZXh0cmFEYXRhKSB7XHJcbiAgICBpZiAoIXRoaXMuYmFzZURhdGEgfHwgIXRoaXMuaGVhZFRlbXBsYXRlIHx8ICF0aGlzLmNsb3NlVGVtcGxhdGUpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdCb2lsZXJwbGF0ZSBkaWQgbm90IGluc3RhbnRpYXRlIGNvcnJlY3RseS4nKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkYXRhID0gey4uLnRoaXMuYmFzZURhdGEsIC4uLmV4dHJhRGF0YX07XHJcbiAgICBjb25zdCBzdGFydCA9IFwiPCFET0NUWVBFIGh0bWw+XFxuXCIgKyB0aGlzLmhlYWRUZW1wbGF0ZShkYXRhKTtcclxuXHJcbiAgICBjb25zdCB7IGJvZHksIGR5bmFtaWNCb2R5IH0gPSBkYXRhO1xyXG5cclxuICAgIGNvbnN0IGVuZCA9IHRoaXMuY2xvc2VUZW1wbGF0ZShkYXRhKTtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gY3JlYXRlU3RyZWFtKCk7XHJcblxyXG4gICAgYXBwZW5kVG9TdHJlYW0oc3RhcnQsIHJlc3BvbnNlKTtcclxuXHJcbiAgICBpZiAoYm9keSkge1xyXG4gICAgICBhcHBlbmRUb1N0cmVhbShib2R5LCByZXNwb25zZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGR5bmFtaWNCb2R5KSB7XHJcbiAgICAgIGFwcGVuZFRvU3RyZWFtKGR5bmFtaWNCb2R5LCByZXNwb25zZSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXBwZW5kVG9TdHJlYW0oZW5kLCByZXNwb25zZSk7XHJcblxyXG4gICAgcmV0dXJuIHJlc3BvbnNlO1xyXG4gIH1cclxuXHJcbiAgLy8gWFhYIEV4cG9ydGVkIHRvIGFsbG93IGNsaWVudC1zaWRlIG9ubHkgY2hhbmdlcyB0byByZWJ1aWxkIHRoZSBib2lsZXJwbGF0ZVxyXG4gIC8vIHdpdGhvdXQgcmVxdWlyaW5nIGEgZnVsbCBzZXJ2ZXIgcmVzdGFydC5cclxuICAvLyBQcm9kdWNlcyBhbiBIVE1MIHN0cmluZyB3aXRoIGdpdmVuIG1hbmlmZXN0IGFuZCBib2lsZXJwbGF0ZVNvdXJjZS5cclxuICAvLyBPcHRpb25hbGx5IHRha2VzIHVybE1hcHBlciBpbiBjYXNlIHVybHMgZnJvbSBtYW5pZmVzdCBuZWVkIHRvIGJlIHByZWZpeGVkXHJcbiAgLy8gb3IgcmV3cml0dGVuLlxyXG4gIC8vIE9wdGlvbmFsbHkgdGFrZXMgcGF0aE1hcHBlciBmb3IgcmVzb2x2aW5nIHJlbGF0aXZlIGZpbGUgc3lzdGVtIHBhdGhzLlxyXG4gIC8vIE9wdGlvbmFsbHkgYWxsb3dzIHRvIG92ZXJyaWRlIGZpZWxkcyBvZiB0aGUgZGF0YSBjb250ZXh0LlxyXG4gIF9nZW5lcmF0ZUJvaWxlcnBsYXRlRnJvbU1hbmlmZXN0KG1hbmlmZXN0LCB7XHJcbiAgICB1cmxNYXBwZXIgPSBpZGVudGl0eSxcclxuICAgIHBhdGhNYXBwZXIgPSBpZGVudGl0eSxcclxuICAgIGJhc2VEYXRhRXh0ZW5zaW9uLFxyXG4gICAgaW5saW5lLFxyXG4gIH0gPSB7fSkge1xyXG5cclxuICAgIGNvbnN0IGJvaWxlcnBsYXRlQmFzZURhdGEgPSB7XHJcbiAgICAgIGNzczogW10sXHJcbiAgICAgIGpzOiBbXSxcclxuICAgICAgaGVhZDogJycsXHJcbiAgICAgIGJvZHk6ICcnLFxyXG4gICAgICBtZXRlb3JNYW5pZmVzdDogSlNPTi5zdHJpbmdpZnkobWFuaWZlc3QpLFxyXG4gICAgICAuLi5iYXNlRGF0YUV4dGVuc2lvbixcclxuICAgIH07XHJcblxyXG4gICAgbWFuaWZlc3QuZm9yRWFjaChpdGVtID0+IHtcclxuICAgICAgY29uc3QgdXJsUGF0aCA9IHVybE1hcHBlcihpdGVtLnVybCk7XHJcbiAgICAgIGNvbnN0IGl0ZW1PYmogPSB7IHVybDogdXJsUGF0aCB9O1xyXG5cclxuICAgICAgaWYgKGlubGluZSkge1xyXG4gICAgICAgIGl0ZW1PYmouc2NyaXB0Q29udGVudCA9IHJlYWRVdGY4RmlsZVN5bmMoXHJcbiAgICAgICAgICBwYXRoTWFwcGVyKGl0ZW0ucGF0aCkpO1xyXG4gICAgICAgIGl0ZW1PYmouaW5saW5lID0gdHJ1ZTtcclxuICAgICAgfSBlbHNlIGlmIChpdGVtLnNyaSkge1xyXG4gICAgICAgIGl0ZW1PYmouc3JpID0gaXRlbS5zcmk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChpdGVtLnR5cGUgPT09ICdjc3MnICYmIGl0ZW0ud2hlcmUgPT09ICdjbGllbnQnKSB7XHJcbiAgICAgICAgYm9pbGVycGxhdGVCYXNlRGF0YS5jc3MucHVzaChpdGVtT2JqKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGl0ZW0udHlwZSA9PT0gJ2pzJyAmJiBpdGVtLndoZXJlID09PSAnY2xpZW50JyAmJlxyXG4gICAgICAgIC8vIER5bmFtaWMgSlMgbW9kdWxlcyBzaG91bGQgbm90IGJlIGxvYWRlZCBlYWdlcmx5IGluIHRoZVxyXG4gICAgICAgIC8vIGluaXRpYWwgSFRNTCBvZiB0aGUgYXBwLlxyXG4gICAgICAgICFpdGVtLnBhdGguc3RhcnRzV2l0aCgnZHluYW1pYy8nKSkge1xyXG4gICAgICAgIGJvaWxlcnBsYXRlQmFzZURhdGEuanMucHVzaChpdGVtT2JqKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGl0ZW0udHlwZSA9PT0gJ2hlYWQnKSB7XHJcbiAgICAgICAgYm9pbGVycGxhdGVCYXNlRGF0YS5oZWFkID1cclxuICAgICAgICAgIHJlYWRVdGY4RmlsZVN5bmMocGF0aE1hcHBlcihpdGVtLnBhdGgpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGl0ZW0udHlwZSA9PT0gJ2JvZHknKSB7XHJcbiAgICAgICAgYm9pbGVycGxhdGVCYXNlRGF0YS5ib2R5ID1cclxuICAgICAgICAgIHJlYWRVdGY4RmlsZVN5bmMocGF0aE1hcHBlcihpdGVtLnBhdGgpKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5iYXNlRGF0YSA9IGJvaWxlcnBsYXRlQmFzZURhdGE7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gUmV0dXJucyBhIHRlbXBsYXRlIGZ1bmN0aW9uIHRoYXQsIHdoZW4gY2FsbGVkLCBwcm9kdWNlcyB0aGUgYm9pbGVycGxhdGVcclxuLy8gaHRtbCBhcyBhIHN0cmluZy5cclxuZnVuY3Rpb24gZ2V0VGVtcGxhdGUoYXJjaCkge1xyXG4gIGNvbnN0IHByZWZpeCA9IGFyY2guc3BsaXQoXCIuXCIsIDIpLmpvaW4oXCIuXCIpO1xyXG5cclxuICBpZiAocHJlZml4ID09PSBcIndlYi5icm93c2VyXCIpIHtcclxuICAgIHJldHVybiBXZWJCcm93c2VyVGVtcGxhdGU7XHJcbiAgfVxyXG5cclxuICBpZiAocHJlZml4ID09PSBcIndlYi5jb3Jkb3ZhXCIpIHtcclxuICAgIHJldHVybiBXZWJDb3Jkb3ZhVGVtcGxhdGU7XHJcbiAgfVxyXG5cclxuICB0aHJvdyBuZXcgRXJyb3IoXCJVbnN1cHBvcnRlZCBhcmNoOiBcIiArIGFyY2gpO1xyXG59XHJcbiIsImltcG9ydCB0ZW1wbGF0ZSBmcm9tICcuL3RlbXBsYXRlJztcclxuXHJcbmNvbnN0IHNyaSA9IChzcmksIG1vZGUpID0+XHJcbiAgKHNyaSAmJiBtb2RlKSA/IGAgaW50ZWdyaXR5PVwic2hhNTEyLSR7c3JpfVwiIGNyb3Nzb3JpZ2luPVwiJHttb2RlfVwiYCA6ICcnO1xyXG5cclxuZXhwb3J0IGNvbnN0IGhlYWRUZW1wbGF0ZSA9ICh7XHJcbiAgY3NzLFxyXG4gIGh0bWxBdHRyaWJ1dGVzLFxyXG4gIGJ1bmRsZWRKc0Nzc1VybFJld3JpdGVIb29rLFxyXG4gIHNyaU1vZGUsXHJcbiAgaGVhZCxcclxuICBkeW5hbWljSGVhZCxcclxufSkgPT4ge1xyXG4gIHZhciBoZWFkU2VjdGlvbnMgPSBoZWFkLnNwbGl0KC88bWV0ZW9yLWJ1bmRsZWQtY3NzW148Pl0qPi8sIDIpO1xyXG4gIHZhciBjc3NCdW5kbGUgPSBbLi4uKGNzcyB8fCBbXSkubWFwKGZpbGUgPT5cclxuICAgIHRlbXBsYXRlKCcgIDxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiB0eXBlPVwidGV4dC9jc3NcIiBjbGFzcz1cIl9fbWV0ZW9yLWNzc19fXCIgaHJlZj1cIjwlLSBocmVmICU+XCI8JT0gc3JpICU+PicpKHtcclxuICAgICAgaHJlZjogYnVuZGxlZEpzQ3NzVXJsUmV3cml0ZUhvb2soZmlsZS51cmwpLFxyXG4gICAgICBzcmk6IHNyaShmaWxlLnNyaSwgc3JpTW9kZSksXHJcbiAgICB9KVxyXG4gICldLmpvaW4oJ1xcbicpO1xyXG5cclxuICByZXR1cm4gW1xyXG4gICAgJzxodG1sJyArIE9iamVjdC5rZXlzKGh0bWxBdHRyaWJ1dGVzIHx8IHt9KS5tYXAoXHJcbiAgICAgIGtleSA9PiB0ZW1wbGF0ZSgnIDwlPSBhdHRyTmFtZSAlPj1cIjwlLSBhdHRyVmFsdWUgJT5cIicpKHtcclxuICAgICAgICBhdHRyTmFtZToga2V5LFxyXG4gICAgICAgIGF0dHJWYWx1ZTogaHRtbEF0dHJpYnV0ZXNba2V5XSxcclxuICAgICAgfSlcclxuICAgICkuam9pbignJykgKyAnPicsXHJcblxyXG4gICAgJzxoZWFkPicsXHJcblxyXG4gICAgKGhlYWRTZWN0aW9ucy5sZW5ndGggPT09IDEpXHJcbiAgICAgID8gW2Nzc0J1bmRsZSwgaGVhZFNlY3Rpb25zWzBdXS5qb2luKCdcXG4nKVxyXG4gICAgICA6IFtoZWFkU2VjdGlvbnNbMF0sIGNzc0J1bmRsZSwgaGVhZFNlY3Rpb25zWzFdXS5qb2luKCdcXG4nKSxcclxuXHJcbiAgICBkeW5hbWljSGVhZCxcclxuICAgICc8L2hlYWQ+JyxcclxuICAgICc8Ym9keT4nLFxyXG4gIF0uam9pbignXFxuJyk7XHJcbn07XHJcblxyXG4vLyBUZW1wbGF0ZSBmdW5jdGlvbiBmb3IgcmVuZGVyaW5nIHRoZSBib2lsZXJwbGF0ZSBodG1sIGZvciBicm93c2Vyc1xyXG5leHBvcnQgY29uc3QgY2xvc2VUZW1wbGF0ZSA9ICh7XHJcbiAgbWV0ZW9yUnVudGltZUNvbmZpZyxcclxuICByb290VXJsUGF0aFByZWZpeCxcclxuICBpbmxpbmVTY3JpcHRzQWxsb3dlZCxcclxuICBqcyxcclxuICBhZGRpdGlvbmFsU3RhdGljSnMsXHJcbiAgYnVuZGxlZEpzQ3NzVXJsUmV3cml0ZUhvb2ssXHJcbiAgc3JpTW9kZSxcclxufSkgPT4gW1xyXG4gICcnLFxyXG4gIGlubGluZVNjcmlwdHNBbGxvd2VkXHJcbiAgICA/IHRlbXBsYXRlKCcgIDxzY3JpcHQgdHlwZT1cInRleHQvamF2YXNjcmlwdFwiPl9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18gPSBKU09OLnBhcnNlKGRlY29kZVVSSUNvbXBvbmVudCg8JT0gY29uZiAlPikpPC9zY3JpcHQ+Jykoe1xyXG4gICAgICBjb25mOiBtZXRlb3JSdW50aW1lQ29uZmlnLFxyXG4gICAgfSlcclxuICAgIDogdGVtcGxhdGUoJyAgPHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCIgc3JjPVwiPCUtIHNyYyAlPi9tZXRlb3JfcnVudGltZV9jb25maWcuanNcIj48L3NjcmlwdD4nKSh7XHJcbiAgICAgIHNyYzogcm9vdFVybFBhdGhQcmVmaXgsXHJcbiAgICB9KSxcclxuICAnJyxcclxuXHJcbiAgLi4uKGpzIHx8IFtdKS5tYXAoZmlsZSA9PlxyXG4gICAgdGVtcGxhdGUoJyAgPHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCIgc3JjPVwiPCUtIHNyYyAlPlwiPCU9IHNyaSAlPj48L3NjcmlwdD4nKSh7XHJcbiAgICAgIHNyYzogYnVuZGxlZEpzQ3NzVXJsUmV3cml0ZUhvb2soZmlsZS51cmwpLFxyXG4gICAgICBzcmk6IHNyaShmaWxlLnNyaSwgc3JpTW9kZSksXHJcbiAgICB9KVxyXG4gICksXHJcblxyXG4gIC4uLihhZGRpdGlvbmFsU3RhdGljSnMgfHwgW10pLm1hcCgoeyBjb250ZW50cywgcGF0aG5hbWUgfSkgPT4gKFxyXG4gICAgaW5saW5lU2NyaXB0c0FsbG93ZWRcclxuICAgICAgPyB0ZW1wbGF0ZSgnICA8c2NyaXB0PjwlPSBjb250ZW50cyAlPjwvc2NyaXB0PicpKHtcclxuICAgICAgICBjb250ZW50cyxcclxuICAgICAgfSlcclxuICAgICAgOiB0ZW1wbGF0ZSgnICA8c2NyaXB0IHR5cGU9XCJ0ZXh0L2phdmFzY3JpcHRcIiBzcmM9XCI8JS0gc3JjICU+XCI+PC9zY3JpcHQ+Jykoe1xyXG4gICAgICAgIHNyYzogcm9vdFVybFBhdGhQcmVmaXggKyBwYXRobmFtZSxcclxuICAgICAgfSlcclxuICApKSxcclxuXHJcbiAgJycsXHJcbiAgJycsXHJcbiAgJzwvYm9keT4nLFxyXG4gICc8L2h0bWw+J1xyXG5dLmpvaW4oJ1xcbicpO1xyXG4iLCJpbXBvcnQgdGVtcGxhdGUgZnJvbSAnLi90ZW1wbGF0ZSc7XHJcblxyXG4vLyBUZW1wbGF0ZSBmdW5jdGlvbiBmb3IgcmVuZGVyaW5nIHRoZSBib2lsZXJwbGF0ZSBodG1sIGZvciBjb3Jkb3ZhXHJcbmV4cG9ydCBjb25zdCBoZWFkVGVtcGxhdGUgPSAoe1xyXG4gIG1ldGVvclJ1bnRpbWVDb25maWcsXHJcbiAgcm9vdFVybFBhdGhQcmVmaXgsXHJcbiAgaW5saW5lU2NyaXB0c0FsbG93ZWQsXHJcbiAgY3NzLFxyXG4gIGpzLFxyXG4gIGFkZGl0aW9uYWxTdGF0aWNKcyxcclxuICBodG1sQXR0cmlidXRlcyxcclxuICBidW5kbGVkSnNDc3NVcmxSZXdyaXRlSG9vayxcclxuICBoZWFkLFxyXG4gIGR5bmFtaWNIZWFkLFxyXG59KSA9PiB7XHJcbiAgdmFyIGhlYWRTZWN0aW9ucyA9IGhlYWQuc3BsaXQoLzxtZXRlb3ItYnVuZGxlZC1jc3NbXjw+XSo+LywgMik7XHJcbiAgdmFyIGNzc0J1bmRsZSA9IFtcclxuICAgIC8vIFdlIGFyZSBleHBsaWNpdGx5IG5vdCB1c2luZyBidW5kbGVkSnNDc3NVcmxSZXdyaXRlSG9vazogaW4gY29yZG92YSB3ZSBzZXJ2ZSBhc3NldHMgdXAgZGlyZWN0bHkgZnJvbSBkaXNrLCBzbyByZXdyaXRpbmcgdGhlIFVSTCBkb2VzIG5vdCBtYWtlIHNlbnNlXHJcbiAgICAuLi4oY3NzIHx8IFtdKS5tYXAoZmlsZSA9PlxyXG4gICAgICB0ZW1wbGF0ZSgnICA8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgdHlwZT1cInRleHQvY3NzXCIgY2xhc3M9XCJfX21ldGVvci1jc3NfX1wiIGhyZWY9XCI8JS0gaHJlZiAlPlwiPicpKHtcclxuICAgICAgICBocmVmOiBmaWxlLnVybCxcclxuICAgICAgfSlcclxuICApXS5qb2luKCdcXG4nKTtcclxuXHJcbiAgcmV0dXJuIFtcclxuICAgICc8aHRtbD4nLFxyXG4gICAgJzxoZWFkPicsXHJcbiAgICAnICA8bWV0YSBjaGFyc2V0PVwidXRmLThcIj4nLFxyXG4gICAgJyAgPG1ldGEgbmFtZT1cImZvcm1hdC1kZXRlY3Rpb25cIiBjb250ZW50PVwidGVsZXBob25lPW5vXCI+JyxcclxuICAgICcgIDxtZXRhIG5hbWU9XCJ2aWV3cG9ydFwiIGNvbnRlbnQ9XCJ1c2VyLXNjYWxhYmxlPW5vLCBpbml0aWFsLXNjYWxlPTEsIG1heGltdW0tc2NhbGU9MSwgbWluaW11bS1zY2FsZT0xLCB3aWR0aD1kZXZpY2Utd2lkdGgsIGhlaWdodD1kZXZpY2UtaGVpZ2h0LCB2aWV3cG9ydC1maXQ9Y292ZXJcIj4nLFxyXG4gICAgJyAgPG1ldGEgbmFtZT1cIm1zYXBwbGljYXRpb24tdGFwLWhpZ2hsaWdodFwiIGNvbnRlbnQ9XCJub1wiPicsXHJcbiAgICAnICA8bWV0YSBodHRwLWVxdWl2PVwiQ29udGVudC1TZWN1cml0eS1Qb2xpY3lcIiBjb250ZW50PVwiZGVmYXVsdC1zcmMgKiBnYXA6IGRhdGE6IGJsb2I6IFxcJ3Vuc2FmZS1pbmxpbmVcXCcgXFwndW5zYWZlLWV2YWxcXCcgd3M6IHdzczo7XCI+JyxcclxuXHJcbiAgKGhlYWRTZWN0aW9ucy5sZW5ndGggPT09IDEpXHJcbiAgICA/IFtjc3NCdW5kbGUsIGhlYWRTZWN0aW9uc1swXV0uam9pbignXFxuJylcclxuICAgIDogW2hlYWRTZWN0aW9uc1swXSwgY3NzQnVuZGxlLCBoZWFkU2VjdGlvbnNbMV1dLmpvaW4oJ1xcbicpLFxyXG5cclxuICAgICcgIDxzY3JpcHQgdHlwZT1cInRleHQvamF2YXNjcmlwdFwiPicsXHJcbiAgICB0ZW1wbGF0ZSgnICAgIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18gPSBKU09OLnBhcnNlKGRlY29kZVVSSUNvbXBvbmVudCg8JT0gY29uZiAlPikpOycpKHtcclxuICAgICAgY29uZjogbWV0ZW9yUnVudGltZUNvbmZpZyxcclxuICAgIH0pLFxyXG4gICAgJyAgICBpZiAoL0FuZHJvaWQvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7JyxcclxuICAgIC8vIFdoZW4gQW5kcm9pZCBhcHAgaXMgZW11bGF0ZWQsIGl0IGNhbm5vdCBjb25uZWN0IHRvIGxvY2FsaG9zdCxcclxuICAgIC8vIGluc3RlYWQgaXQgc2hvdWxkIGNvbm5lY3QgdG8gMTAuMC4yLjJcclxuICAgIC8vICh1bmxlc3Mgd2VcXCdyZSB1c2luZyBhbiBodHRwIHByb3h5OyB0aGVuIGl0IHdvcmtzISlcclxuICAgICcgICAgICBpZiAoIV9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uaHR0cFByb3h5UG9ydCkgeycsXHJcbiAgICAnICAgICAgICBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLlJPT1RfVVJMID0gKF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uUk9PVF9VUkwgfHwgXFwnXFwnKS5yZXBsYWNlKC9sb2NhbGhvc3QvaSwgXFwnMTAuMC4yLjJcXCcpOycsXHJcbiAgICAnICAgICAgICBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLkREUF9ERUZBVUxUX0NPTk5FQ1RJT05fVVJMID0gKF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uRERQX0RFRkFVTFRfQ09OTkVDVElPTl9VUkwgfHwgXFwnXFwnKS5yZXBsYWNlKC9sb2NhbGhvc3QvaSwgXFwnMTAuMC4yLjJcXCcpOycsXHJcbiAgICAnICAgICAgfScsXHJcbiAgICAnICAgIH0nLFxyXG4gICAgJyAgPC9zY3JpcHQ+JyxcclxuICAgICcnLFxyXG4gICAgJyAgPHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCIgc3JjPVwiL2NvcmRvdmEuanNcIj48L3NjcmlwdD4nLFxyXG5cclxuICAgIC4uLihqcyB8fCBbXSkubWFwKGZpbGUgPT5cclxuICAgICAgdGVtcGxhdGUoJyAgPHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCIgc3JjPVwiPCUtIHNyYyAlPlwiPjwvc2NyaXB0PicpKHtcclxuICAgICAgICBzcmM6IGZpbGUudXJsLFxyXG4gICAgICB9KVxyXG4gICAgKSxcclxuXHJcbiAgICAuLi4oYWRkaXRpb25hbFN0YXRpY0pzIHx8IFtdKS5tYXAoKHsgY29udGVudHMsIHBhdGhuYW1lIH0pID0+IChcclxuICAgICAgaW5saW5lU2NyaXB0c0FsbG93ZWRcclxuICAgICAgICA/IHRlbXBsYXRlKCcgIDxzY3JpcHQ+PCU9IGNvbnRlbnRzICU+PC9zY3JpcHQ+Jykoe1xyXG4gICAgICAgICAgY29udGVudHMsXHJcbiAgICAgICAgfSlcclxuICAgICAgICA6IHRlbXBsYXRlKCcgIDxzY3JpcHQgdHlwZT1cInRleHQvamF2YXNjcmlwdFwiIHNyYz1cIjwlLSBzcmMgJT5cIj48L3NjcmlwdD4nKSh7XHJcbiAgICAgICAgICBzcmM6IE1ldGVvci5hYnNvbHV0ZVVybChwYXRobmFtZSlcclxuICAgICAgICB9KVxyXG4gICAgKSksXHJcbiAgICAnJyxcclxuICAgICc8L2hlYWQ+JyxcclxuICAgICcnLFxyXG4gICAgJzxib2R5PicsXHJcbiAgXS5qb2luKCdcXG4nKTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjbG9zZVRlbXBsYXRlKCkge1xyXG4gIHJldHVybiBcIjwvYm9keT5cXG48L2h0bWw+XCI7XHJcbn1cclxuIiwiaW1wb3J0IHsgXyB9IGZyb20gJ21ldGVvci91bmRlcnNjb3JlJztcclxuXHJcbi8vIEFzIGlkZW50aWZpZWQgaW4gaXNzdWUgIzkxNDksIHdoZW4gYW4gYXBwbGljYXRpb24gb3ZlcnJpZGVzIHRoZSBkZWZhdWx0XHJcbi8vIF8udGVtcGxhdGUgc2V0dGluZ3MgdXNpbmcgXy50ZW1wbGF0ZVNldHRpbmdzLCB0aG9zZSBuZXcgc2V0dGluZ3MgYXJlXHJcbi8vIHVzZWQgYW55d2hlcmUgXy50ZW1wbGF0ZSBpcyB1c2VkLCBpbmNsdWRpbmcgd2l0aGluIHRoZVxyXG4vLyBib2lsZXJwbGF0ZS1nZW5lcmF0b3IuIFRvIGhhbmRsZSB0aGlzLCBfLnRlbXBsYXRlIHNldHRpbmdzIHRoYXQgaGF2ZVxyXG4vLyBiZWVuIHZlcmlmaWVkIHRvIHdvcmsgYXJlIG92ZXJyaWRkZW4gaGVyZSBvbiBlYWNoIF8udGVtcGxhdGUgY2FsbC5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gdGVtcGxhdGUodGV4dCkge1xyXG4gIHJldHVybiBfLnRlbXBsYXRlKHRleHQsIG51bGwsIHtcclxuICAgIGV2YWx1YXRlICAgIDogLzwlKFtcXHNcXFNdKz8pJT4vZyxcclxuICAgIGludGVycG9sYXRlIDogLzwlPShbXFxzXFxTXSs/KSU+L2csXHJcbiAgICBlc2NhcGUgICAgICA6IC88JS0oW1xcc1xcU10rPyklPi9nLFxyXG4gIH0pO1xyXG59O1xyXG4iXX0=
