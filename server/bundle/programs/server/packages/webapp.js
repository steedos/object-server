(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Log = Package.logging.Log;
var _ = Package.underscore._;
var RoutePolicy = Package.routepolicy.RoutePolicy;
var Boilerplate = Package['boilerplate-generator'].Boilerplate;
var WebAppHashing = Package['webapp-hashing'].WebAppHashing;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var WebApp, WebAppInternals, main;

var require = meteorInstall({"node_modules":{"meteor":{"webapp":{"webapp_server.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/webapp/webapp_server.js                                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

const module1 = module;
module1.export({
  WebApp: () => WebApp,
  WebAppInternals: () => WebAppInternals
});
let assert;
module1.link("assert", {
  default(v) {
    assert = v;
  }

}, 0);
let readFileSync;
module1.link("fs", {
  readFileSync(v) {
    readFileSync = v;
  }

}, 1);
let createServer;
module1.link("http", {
  createServer(v) {
    createServer = v;
  }

}, 2);
let pathJoin, pathDirname;
module1.link("path", {
  join(v) {
    pathJoin = v;
  },

  dirname(v) {
    pathDirname = v;
  }

}, 3);
let parseUrl;
module1.link("url", {
  parse(v) {
    parseUrl = v;
  }

}, 4);
let createHash;
module1.link("crypto", {
  createHash(v) {
    createHash = v;
  }

}, 5);
let connect;
module1.link("./connect.js", {
  connect(v) {
    connect = v;
  }

}, 6);
let compress;
module1.link("compression", {
  default(v) {
    compress = v;
  }

}, 7);
let cookieParser;
module1.link("cookie-parser", {
  default(v) {
    cookieParser = v;
  }

}, 8);
let query;
module1.link("qs-middleware", {
  default(v) {
    query = v;
  }

}, 9);
let parseRequest;
module1.link("parseurl", {
  default(v) {
    parseRequest = v;
  }

}, 10);
let basicAuth;
module1.link("basic-auth-connect", {
  default(v) {
    basicAuth = v;
  }

}, 11);
let lookupUserAgent;
module1.link("useragent", {
  lookup(v) {
    lookupUserAgent = v;
  }

}, 12);
let isModern, calculateHashOfMinimumVersions;
module1.link("meteor/modern-browsers", {
  isModern(v) {
    isModern = v;
  },

  calculateHashOfMinimumVersions(v) {
    calculateHashOfMinimumVersions = v;
  }

}, 13);
let send;
module1.link("send", {
  default(v) {
    send = v;
  }

}, 14);
let removeExistingSocketFile, registerSocketFileCleanup;
module1.link("./socket_file.js", {
  removeExistingSocketFile(v) {
    removeExistingSocketFile = v;
  },

  registerSocketFileCleanup(v) {
    registerSocketFileCleanup = v;
  }

}, 15);
let onMessage;
module1.link("meteor/inter-process-messaging", {
  onMessage(v) {
    onMessage = v;
  }

}, 16);
var SHORT_SOCKET_TIMEOUT = 5 * 1000;
var LONG_SOCKET_TIMEOUT = 120 * 1000;
const WebApp = {};
const WebAppInternals = {};
const hasOwn = Object.prototype.hasOwnProperty; // backwards compat to 2.0 of connect

connect.basicAuth = basicAuth;
WebAppInternals.NpmModules = {
  connect: {
    version: Npm.require('connect/package.json').version,
    module: connect
  }
}; // Though we might prefer to use web.browser (modern) as the default
// architecture, safety requires a more compatible defaultArch.

WebApp.defaultArch = 'web.browser.legacy'; // XXX maps archs to manifests

WebApp.clientPrograms = {}; // XXX maps archs to program path on filesystem

var archPath = {};

var bundledJsCssUrlRewriteHook = function (url) {
  var bundledPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
  return bundledPrefix + url;
};

var sha1 = function (contents) {
  var hash = createHash('sha1');
  hash.update(contents);
  return hash.digest('hex');
}; // #BrowserIdentification
//
// We have multiple places that want to identify the browser: the
// unsupported browser page, the appcache package, and, eventually
// delivering browser polyfills only as needed.
//
// To avoid detecting the browser in multiple places ad-hoc, we create a
// Meteor "browser" object. It uses but does not expose the npm
// useragent module (we could choose a different mechanism to identify
// the browser in the future if we wanted to).  The browser object
// contains
//
// * `name`: the name of the browser in camel case
// * `major`, `minor`, `patch`: integers describing the browser version
//
// Also here is an early version of a Meteor `request` object, intended
// to be a high-level description of the request without exposing
// details of connect's low-level `req`.  Currently it contains:
//
// * `browser`: browser identification object described above
// * `url`: parsed url, including parsed query params
//
// As a temporary hack there is a `categorizeRequest` function on WebApp which
// converts a connect `req` to a Meteor `request`. This can go away once smart
// packages such as appcache are being passed a `request` object directly when
// they serve content.
//
// This allows `request` to be used uniformly: it is passed to the html
// attributes hook, and the appcache package can use it when deciding
// whether to generate a 404 for the manifest.
//
// Real routing / server side rendering will probably refactor this
// heavily.
// e.g. "Mobile Safari" => "mobileSafari"


var camelCase = function (name) {
  var parts = name.split(' ');
  parts[0] = parts[0].toLowerCase();

  for (var i = 1; i < parts.length; ++i) {
    parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].substr(1);
  }

  return parts.join('');
};

var identifyBrowser = function (userAgentString) {
  var userAgent = lookupUserAgent(userAgentString);
  return {
    name: camelCase(userAgent.family),
    major: +userAgent.major,
    minor: +userAgent.minor,
    patch: +userAgent.patch
  };
}; // XXX Refactor as part of implementing real routing.


WebAppInternals.identifyBrowser = identifyBrowser;

WebApp.categorizeRequest = function (req) {
  return _.extend({
    browser: identifyBrowser(req.headers['user-agent']),
    url: parseUrl(req.url, true)
  }, _.pick(req, 'dynamicHead', 'dynamicBody', 'headers', 'cookies'));
}; // HTML attribute hooks: functions to be called to determine any attributes to
// be added to the '<html>' tag. Each function is passed a 'request' object (see
// #BrowserIdentification) and should return null or object.


var htmlAttributeHooks = [];

var getHtmlAttributes = function (request) {
  var combinedAttributes = {};

  _.each(htmlAttributeHooks || [], function (hook) {
    var attributes = hook(request);
    if (attributes === null) return;
    if (typeof attributes !== 'object') throw Error("HTML attribute hook must return null or object");

    _.extend(combinedAttributes, attributes);
  });

  return combinedAttributes;
};

WebApp.addHtmlAttributeHook = function (hook) {
  htmlAttributeHooks.push(hook);
}; // Serve app HTML for this URL?


var appUrl = function (url) {
  if (url === '/favicon.ico' || url === '/robots.txt') return false; // NOTE: app.manifest is not a web standard like favicon.ico and
  // robots.txt. It is a file name we have chosen to use for HTML5
  // appcache URLs. It is included here to prevent using an appcache
  // then removing it from poisoning an app permanently. Eventually,
  // once we have server side routing, this won't be needed as
  // unknown URLs with return a 404 automatically.

  if (url === '/app.manifest') return false; // Avoid serving app HTML for declared routes such as /sockjs/.

  if (RoutePolicy.classify(url)) return false; // we currently return app HTML on all URLs by default

  return true;
}; // We need to calculate the client hash after all packages have loaded
// to give them a chance to populate __meteor_runtime_config__.
//
// Calculating the hash during startup means that packages can only
// populate __meteor_runtime_config__ during load, not during startup.
//
// Calculating instead it at the beginning of main after all startup
// hooks had run would allow packages to also populate
// __meteor_runtime_config__ during startup, but that's too late for
// autoupdate because it needs to have the client hash at startup to
// insert the auto update version itself into
// __meteor_runtime_config__ to get it to the client.
//
// An alternative would be to give autoupdate a "post-start,
// pre-listen" hook to allow it to insert the auto update version at
// the right moment.


Meteor.startup(function () {
  function getter(key) {
    return function (arch) {
      arch = arch || WebApp.defaultArch;
      const program = WebApp.clientPrograms[arch];
      const value = program && program[key]; // If this is the first time we have calculated this hash,
      // program[key] will be a thunk (lazy function with no parameters)
      // that we should call to do the actual computation.

      return typeof value === "function" ? program[key] = value() : value;
    };
  }

  WebApp.calculateClientHash = WebApp.clientHash = getter("version");
  WebApp.calculateClientHashRefreshable = getter("versionRefreshable");
  WebApp.calculateClientHashNonRefreshable = getter("versionNonRefreshable");
  WebApp.getRefreshableAssets = getter("refreshableAssets");
}); // When we have a request pending, we want the socket timeout to be long, to
// give ourselves a while to serve it, and to allow sockjs long polls to
// complete.  On the other hand, we want to close idle sockets relatively
// quickly, so that we can shut down relatively promptly but cleanly, without
// cutting off anyone's response.

WebApp._timeoutAdjustmentRequestCallback = function (req, res) {
  // this is really just req.socket.setTimeout(LONG_SOCKET_TIMEOUT);
  req.setTimeout(LONG_SOCKET_TIMEOUT); // Insert our new finish listener to run BEFORE the existing one which removes
  // the response from the socket.

  var finishListeners = res.listeners('finish'); // XXX Apparently in Node 0.12 this event was called 'prefinish'.
  // https://github.com/joyent/node/commit/7c9b6070
  // But it has switched back to 'finish' in Node v4:
  // https://github.com/nodejs/node/pull/1411

  res.removeAllListeners('finish');
  res.on('finish', function () {
    res.setTimeout(SHORT_SOCKET_TIMEOUT);
  });

  _.each(finishListeners, function (l) {
    res.on('finish', l);
  });
}; // Will be updated by main before we listen.
// Map from client arch to boilerplate object.
// Boilerplate object has:
//   - func: XXX
//   - baseData: XXX


var boilerplateByArch = {}; // Register a callback function that can selectively modify boilerplate
// data given arguments (request, data, arch). The key should be a unique
// identifier, to prevent accumulating duplicate callbacks from the same
// call site over time. Callbacks will be called in the order they were
// registered. A callback should return false if it did not make any
// changes affecting the boilerplate. Passing null deletes the callback.
// Any previous callback registered for this key will be returned.

const boilerplateDataCallbacks = Object.create(null);

WebAppInternals.registerBoilerplateDataCallback = function (key, callback) {
  const previousCallback = boilerplateDataCallbacks[key];

  if (typeof callback === "function") {
    boilerplateDataCallbacks[key] = callback;
  } else {
    assert.strictEqual(callback, null);
    delete boilerplateDataCallbacks[key];
  } // Return the previous callback in case the new callback needs to call
  // it; for example, when the new callback is a wrapper for the old.


  return previousCallback || null;
}; // Given a request (as returned from `categorizeRequest`), return the
// boilerplate HTML to serve for that request.
//
// If a previous connect middleware has rendered content for the head or body,
// returns the boilerplate with that content patched in otherwise
// memoizes on HTML attributes (used by, eg, appcache) and whether inline
// scripts are currently allowed.
// XXX so far this function is always called with arch === 'web.browser'


function getBoilerplate(request, arch) {
  return getBoilerplateAsync(request, arch).await();
}

function getBoilerplateAsync(request, arch) {
  const boilerplate = boilerplateByArch[arch];
  const data = Object.assign({}, boilerplate.baseData, {
    htmlAttributes: getHtmlAttributes(request)
  }, _.pick(request, "dynamicHead", "dynamicBody"));
  let madeChanges = false;
  let promise = Promise.resolve();
  Object.keys(boilerplateDataCallbacks).forEach(key => {
    promise = promise.then(() => {
      const callback = boilerplateDataCallbacks[key];
      return callback(request, data, arch);
    }).then(result => {
      // Callbacks should return false if they did not make any changes.
      if (result !== false) {
        madeChanges = true;
      }
    });
  });
  return promise.then(() => ({
    stream: boilerplate.toHTMLStream(data),
    statusCode: data.statusCode,
    headers: data.headers
  }));
}

WebAppInternals.generateBoilerplateInstance = function (arch, manifest, additionalOptions) {
  additionalOptions = additionalOptions || {};

  var runtimeConfig = _.extend(_.clone(__meteor_runtime_config__), additionalOptions.runtimeConfigOverrides || {});

  return new Boilerplate(arch, manifest, _.extend({
    pathMapper(itemPath) {
      return pathJoin(archPath[arch], itemPath);
    },

    baseDataExtension: {
      additionalStaticJs: _.map(additionalStaticJs || [], function (contents, pathname) {
        return {
          pathname: pathname,
          contents: contents
        };
      }),
      // Convert to a JSON string, then get rid of most weird characters, then
      // wrap in double quotes. (The outermost JSON.stringify really ought to
      // just be "wrap in double quotes" but we use it to be safe.) This might
      // end up inside a <script> tag so we need to be careful to not include
      // "</script>", but normal {{spacebars}} escaping escapes too much! See
      // https://github.com/meteor/meteor/issues/3730
      meteorRuntimeConfig: JSON.stringify(encodeURIComponent(JSON.stringify(runtimeConfig))),
      rootUrlPathPrefix: __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '',
      bundledJsCssUrlRewriteHook: bundledJsCssUrlRewriteHook,
      sriMode: sriMode,
      inlineScriptsAllowed: WebAppInternals.inlineScriptsAllowed(),
      inline: additionalOptions.inline
    }
  }, additionalOptions));
}; // A mapping from url path to architecture (e.g. "web.browser") to static
// file information with the following fields:
// - type: the type of file to be served
// - cacheable: optionally, whether the file should be cached or not
// - sourceMapUrl: optionally, the url of the source map
//
// Info also contains one of the following:
// - content: the stringified content that should be served at this path
// - absolutePath: the absolute path on disk to the file


var staticFilesByArch; // Serve static files from the manifest or added with
// `addStaticJs`. Exported for tests.

WebAppInternals.staticFilesMiddleware = function (staticFilesByArch, req, res, next) {
  return Promise.asyncApply(() => {
    if ('GET' != req.method && 'HEAD' != req.method && 'OPTIONS' != req.method) {
      next();
      return;
    }

    var pathname = parseRequest(req).pathname;

    try {
      pathname = decodeURIComponent(pathname);
    } catch (e) {
      next();
      return;
    }

    var serveStaticJs = function (s) {
      res.writeHead(200, {
        'Content-type': 'application/javascript; charset=UTF-8'
      });
      res.write(s);
      res.end();
    };

    if (_.has(additionalStaticJs, pathname) && !WebAppInternals.inlineScriptsAllowed()) {
      serveStaticJs(additionalStaticJs[pathname]);
      return;
    }

    const {
      arch,
      path
    } = getArchAndPath(pathname, identifyBrowser(req.headers["user-agent"])); // If pauseClient(arch) has been called, program.paused will be a
    // Promise that will be resolved when the program is unpaused.

    const program = WebApp.clientPrograms[arch];
    Promise.await(program.paused);

    if (path === "/meteor_runtime_config.js" && !WebAppInternals.inlineScriptsAllowed()) {
      serveStaticJs(`__meteor_runtime_config__ = ${program.meteorRuntimeConfig};`);
      return;
    }

    const info = getStaticFileInfo(pathname, path, arch);

    if (!info) {
      next();
      return;
    } // We don't need to call pause because, unlike 'static', once we call into
    // 'send' and yield to the event loop, we never call another handler with
    // 'next'.
    // Cacheable files are files that should never change. Typically
    // named by their hash (eg meteor bundled js and css files).
    // We cache them ~forever (1yr).


    const maxAge = info.cacheable ? 1000 * 60 * 60 * 24 * 365 : 0;

    if (info.cacheable) {
      // Since we use req.headers["user-agent"] to determine whether the
      // client should receive modern or legacy resources, tell the client
      // to invalidate cached resources when/if its user agent string
      // changes in the future.
      res.setHeader("Vary", "User-Agent");
    } // Set the X-SourceMap header, which current Chrome, FireFox, and Safari
    // understand.  (The SourceMap header is slightly more spec-correct but FF
    // doesn't understand it.)
    //
    // You may also need to enable source maps in Chrome: open dev tools, click
    // the gear in the bottom right corner, and select "enable source maps".


    if (info.sourceMapUrl) {
      res.setHeader('X-SourceMap', __meteor_runtime_config__.ROOT_URL_PATH_PREFIX + info.sourceMapUrl);
    }

    if (info.type === "js" || info.type === "dynamic js") {
      res.setHeader("Content-Type", "application/javascript; charset=UTF-8");
    } else if (info.type === "css") {
      res.setHeader("Content-Type", "text/css; charset=UTF-8");
    } else if (info.type === "json") {
      res.setHeader("Content-Type", "application/json; charset=UTF-8");
    }

    if (info.hash) {
      res.setHeader('ETag', '"' + info.hash + '"');
    }

    if (info.content) {
      res.write(info.content);
      res.end();
    } else {
      send(req, info.absolutePath, {
        maxage: maxAge,
        dotfiles: 'allow',
        // if we specified a dotfile in the manifest, serve it
        lastModified: false // don't set last-modified based on the file date

      }).on('error', function (err) {
        Log.error("Error serving static file " + err);
        res.writeHead(500);
        res.end();
      }).on('directory', function () {
        Log.error("Unexpected directory " + info.absolutePath);
        res.writeHead(500);
        res.end();
      }).pipe(res);
    }
  });
};

function getStaticFileInfo(originalPath, path, arch) {
  if (!hasOwn.call(WebApp.clientPrograms, arch)) {
    return null;
  } // Get a list of all available static file architectures, with arch
  // first in the list if it exists.


  const staticArchList = Object.keys(staticFilesByArch);
  const archIndex = staticArchList.indexOf(arch);

  if (archIndex > 0) {
    staticArchList.unshift(staticArchList.splice(archIndex, 1)[0]);
  }

  let info = null;
  staticArchList.some(arch => {
    const staticFiles = staticFilesByArch[arch];

    function finalize(path) {
      info = staticFiles[path]; // Sometimes we register a lazy function instead of actual data in
      // the staticFiles manifest.

      if (typeof info === "function") {
        info = staticFiles[path] = info();
      }

      return info;
    } // If staticFiles contains originalPath with the arch inferred above,
    // use that information.


    if (hasOwn.call(staticFiles, originalPath)) {
      return finalize(originalPath);
    } // If getArchAndPath returned an alternate path, try that instead.


    if (path !== originalPath && hasOwn.call(staticFiles, path)) {
      return finalize(path);
    }
  });
  return info;
}

function getArchAndPath(path, browser) {
  const pathParts = path.split("/");
  const archKey = pathParts[1];

  if (archKey.startsWith("__")) {
    const archCleaned = "web." + archKey.slice(2);

    if (hasOwn.call(WebApp.clientPrograms, archCleaned)) {
      pathParts.splice(1, 1); // Remove the archKey part.

      return {
        arch: archCleaned,
        path: pathParts.join("/")
      };
    }
  } // TODO Perhaps one day we could infer Cordova clients here, so that we
  // wouldn't have to use prefixed "/__cordova/..." URLs.


  const arch = isModern(browser) ? "web.browser" : "web.browser.legacy";

  if (hasOwn.call(WebApp.clientPrograms, arch)) {
    return {
      arch,
      path
    };
  }

  return {
    arch: WebApp.defaultArch,
    path
  };
} // Parse the passed in port value. Return the port as-is if it's a String
// (e.g. a Windows Server style named pipe), otherwise return the port as an
// integer.
//
// DEPRECATED: Direct use of this function is not recommended; it is no
// longer used internally, and will be removed in a future release.


WebAppInternals.parsePort = port => {
  let parsedPort = parseInt(port);

  if (Number.isNaN(parsedPort)) {
    parsedPort = port;
  }

  return parsedPort;
};

onMessage("webapp-pause-client", ({
  arch
}) => Promise.asyncApply(() => {
  WebAppInternals.pauseClient(arch);
}));
onMessage("webapp-reload-client", ({
  arch
}) => Promise.asyncApply(() => {
  WebAppInternals.generateClientProgram(arch);
}));

function runWebAppServer() {
  var shuttingDown = false;
  var syncQueue = new Meteor._SynchronousQueue();

  var getItemPathname = function (itemUrl) {
    return decodeURIComponent(parseUrl(itemUrl).pathname);
  };

  WebAppInternals.reloadClientPrograms = function () {
    syncQueue.runTask(function () {
      staticFilesByArch = Object.create(null);
      const {
        configJson
      } = __meteor_bootstrap__;
      const clientArchs = configJson.clientArchs || Object.keys(configJson.clientPaths);

      try {
        clientArchs.forEach(generateClientProgram);
        WebAppInternals.staticFilesByArch = staticFilesByArch;
      } catch (e) {
        Log.error("Error reloading the client program: " + e.stack);
        process.exit(1);
      }
    });
  }; // Pause any incoming requests and make them wait for the program to be
  // unpaused the next time generateClientProgram(arch) is called.


  WebAppInternals.pauseClient = function (arch) {
    syncQueue.runTask(() => {
      const program = WebApp.clientPrograms[arch];
      const {
        unpause
      } = program;
      program.paused = new Promise(resolve => {
        if (typeof unpause === "function") {
          // If there happens to be an existing program.unpause function,
          // compose it with the resolve function.
          program.unpause = function () {
            unpause();
            resolve();
          };
        } else {
          program.unpause = resolve;
        }
      });
    });
  };

  WebAppInternals.generateClientProgram = function (arch) {
    syncQueue.runTask(() => generateClientProgram(arch));
  };

  function generateClientProgram(arch) {
    const clientDir = pathJoin(pathDirname(__meteor_bootstrap__.serverDir), arch); // read the control for the client we'll be serving up

    const programJsonPath = pathJoin(clientDir, "program.json");
    let programJson;

    try {
      programJson = JSON.parse(readFileSync(programJsonPath));
    } catch (e) {
      if (e.code === "ENOENT") return;
      throw e;
    }

    if (programJson.format !== "web-program-pre1") {
      throw new Error("Unsupported format for client assets: " + JSON.stringify(programJson.format));
    }

    if (!programJsonPath || !clientDir || !programJson) {
      throw new Error("Client config file not parsed.");
    }

    archPath[arch] = clientDir;
    const staticFiles = staticFilesByArch[arch] = Object.create(null);
    const {
      manifest
    } = programJson;
    manifest.forEach(item => {
      if (item.url && item.where === "client") {
        staticFiles[getItemPathname(item.url)] = {
          absolutePath: pathJoin(clientDir, item.path),
          cacheable: item.cacheable,
          hash: item.hash,
          // Link from source to its map
          sourceMapUrl: item.sourceMapUrl,
          type: item.type
        };

        if (item.sourceMap) {
          // Serve the source map too, under the specified URL. We assume
          // all source maps are cacheable.
          staticFiles[getItemPathname(item.sourceMapUrl)] = {
            absolutePath: pathJoin(clientDir, item.sourceMap),
            cacheable: true
          };
        }
      }
    });
    const {
      PUBLIC_SETTINGS
    } = __meteor_runtime_config__;
    const configOverrides = {
      PUBLIC_SETTINGS,
      // Since the minimum modern versions defined in the modern-versions
      // package affect which bundle a given client receives, any changes
      // in those versions should trigger a corresponding change in the
      // versions calculated below.
      minimumModernVersionsHash: calculateHashOfMinimumVersions()
    };
    const oldProgram = WebApp.clientPrograms[arch];
    const newProgram = WebApp.clientPrograms[arch] = {
      format: "web-program-pre1",
      manifest: manifest,
      // Use arrow functions so that these versions can be lazily
      // calculated later, and so that they will not be included in the
      // staticFiles[manifestUrl].content string below.
      version: () => WebAppHashing.calculateClientHash(manifest, null, configOverrides),
      versionRefreshable: () => WebAppHashing.calculateClientHash(manifest, type => type === "css", configOverrides),
      versionNonRefreshable: () => WebAppHashing.calculateClientHash(manifest, type => type !== "css", configOverrides),
      cordovaCompatibilityVersions: programJson.cordovaCompatibilityVersions,
      PUBLIC_SETTINGS
    }; // Expose program details as a string reachable via the following URL.

    const manifestUrlPrefix = "/__" + arch.replace(/^web\./, "");
    const manifestUrl = manifestUrlPrefix + getItemPathname("/manifest.json");

    staticFiles[manifestUrl] = () => {
      if (Package.autoupdate) {
        const {
          AUTOUPDATE_VERSION = Package.autoupdate.Autoupdate.autoupdateVersion
        } = process.env;

        if (AUTOUPDATE_VERSION) {
          newProgram.version = AUTOUPDATE_VERSION;
        }
      }

      if (typeof newProgram.version === "function") {
        newProgram.version = newProgram.version();
      }

      return {
        content: JSON.stringify(newProgram),
        cacheable: false,
        hash: newProgram.version,
        type: "json"
      };
    };

    generateBoilerplateForArch(arch); // If there are any requests waiting on oldProgram.paused, let them
    // continue now (using the new program).

    if (oldProgram && oldProgram.paused) {
      oldProgram.unpause();
    }
  }

  ;
  const defaultOptionsForArch = {
    'web.cordova': {
      runtimeConfigOverrides: {
        // XXX We use absoluteUrl() here so that we serve https://
        // URLs to cordova clients if force-ssl is in use. If we were
        // to use __meteor_runtime_config__.ROOT_URL instead of
        // absoluteUrl(), then Cordova clients would immediately get a
        // HCP setting their DDP_DEFAULT_CONNECTION_URL to
        // http://example.meteor.com. This breaks the app, because
        // force-ssl doesn't serve CORS headers on 302
        // redirects. (Plus it's undesirable to have clients
        // connecting to http://example.meteor.com when force-ssl is
        // in use.)
        DDP_DEFAULT_CONNECTION_URL: process.env.MOBILE_DDP_URL || Meteor.absoluteUrl(),
        ROOT_URL: process.env.MOBILE_ROOT_URL || Meteor.absoluteUrl()
      }
    },
    "web.browser": {
      runtimeConfigOverrides: {
        isModern: true
      }
    },
    "web.browser.legacy": {
      runtimeConfigOverrides: {
        isModern: false
      }
    }
  };

  WebAppInternals.generateBoilerplate = function () {
    // This boilerplate will be served to the mobile devices when used with
    // Meteor/Cordova for the Hot-Code Push and since the file will be served by
    // the device's server, it is important to set the DDP url to the actual
    // Meteor server accepting DDP connections and not the device's file server.
    syncQueue.runTask(function () {
      Object.keys(WebApp.clientPrograms).forEach(generateBoilerplateForArch);
    });
  };

  function generateBoilerplateForArch(arch) {
    const program = WebApp.clientPrograms[arch];
    const additionalOptions = defaultOptionsForArch[arch] || {};
    const {
      baseData
    } = boilerplateByArch[arch] = WebAppInternals.generateBoilerplateInstance(arch, program.manifest, additionalOptions); // We need the runtime config with overrides for meteor_runtime_config.js:

    program.meteorRuntimeConfig = JSON.stringify((0, _objectSpread2.default)({}, __meteor_runtime_config__, additionalOptions.runtimeConfigOverrides || null));
    program.refreshableAssets = baseData.css.map(file => ({
      url: bundledJsCssUrlRewriteHook(file.url)
    }));
  }

  WebAppInternals.reloadClientPrograms(); // webserver

  var app = connect(); // Packages and apps can add handlers that run before any other Meteor
  // handlers via WebApp.rawConnectHandlers.

  var rawConnectHandlers = connect();
  app.use(rawConnectHandlers); // Auto-compress any json, javascript, or text.

  app.use(compress()); // parse cookies into an object

  app.use(cookieParser()); // We're not a proxy; reject (without crashing) attempts to treat us like
  // one. (See #1212.)

  app.use(function (req, res, next) {
    if (RoutePolicy.isValidUrl(req.url)) {
      next();
      return;
    }

    res.writeHead(400);
    res.write("Not a proxy");
    res.end();
  }); // Parse the query string into res.query. Used by oauth_server, but it's
  // generally pretty handy..
  //
  // Do this before the next middleware destroys req.url if a path prefix
  // is set to close #10111.

  app.use(query());

  function getPathParts(path) {
    const parts = path.split("/");

    while (parts[0] === "") parts.shift();

    return parts;
  }

  function isPrefixOf(prefix, array) {
    return prefix.length <= array.length && prefix.every((part, i) => part === array[i]);
  } // Strip off the path prefix, if it exists.


  app.use(function (request, response, next) {
    const pathPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
    const {
      pathname
    } = parseUrl(request.url); // check if the path in the url starts with the path prefix

    if (pathPrefix) {
      const prefixParts = getPathParts(pathPrefix);
      const pathParts = getPathParts(pathname);

      if (isPrefixOf(prefixParts, pathParts)) {
        request.url = "/" + pathParts.slice(prefixParts.length).join("/");
        return next();
      }
    }

    if (pathname === "/favicon.ico" || pathname === "/robots.txt") {
      return next();
    }

    if (pathPrefix) {
      response.writeHead(404);
      response.write("Unknown path");
      response.end();
      return;
    }

    next();
  }); // Serve static files from the manifest.
  // This is inspired by the 'static' middleware.

  app.use(function (req, res, next) {
    WebAppInternals.staticFilesMiddleware(staticFilesByArch, req, res, next);
  }); // Core Meteor packages like dynamic-import can add handlers before
  // other handlers added by package and application code.

  app.use(WebAppInternals.meteorInternalHandlers = connect()); // Packages and apps can add handlers to this via WebApp.connectHandlers.
  // They are inserted before our default handler.

  var packageAndAppHandlers = connect();
  app.use(packageAndAppHandlers);
  var suppressConnectErrors = false; // connect knows it is an error handler because it has 4 arguments instead of
  // 3. go figure.  (It is not smart enough to find such a thing if it's hidden
  // inside packageAndAppHandlers.)

  app.use(function (err, req, res, next) {
    if (!err || !suppressConnectErrors || !req.headers['x-suppress-error']) {
      next(err);
      return;
    }

    res.writeHead(err.status, {
      'Content-Type': 'text/plain'
    });
    res.end("An error message");
  });
  app.use(function (req, res, next) {
    return Promise.asyncApply(() => {
      if (!appUrl(req.url)) {
        return next();
      } else {
        var headers = {
          'Content-Type': 'text/html; charset=utf-8'
        };

        if (shuttingDown) {
          headers['Connection'] = 'Close';
        }

        var request = WebApp.categorizeRequest(req);

        if (request.url.query && request.url.query['meteor_css_resource']) {
          // In this case, we're requesting a CSS resource in the meteor-specific
          // way, but we don't have it.  Serve a static css file that indicates that
          // we didn't have it, so we can detect that and refresh.  Make sure
          // that any proxies or CDNs don't cache this error!  (Normally proxies
          // or CDNs are smart enough not to cache error pages, but in order to
          // make this hack work, we need to return the CSS file as a 200, which
          // would otherwise be cached.)
          headers['Content-Type'] = 'text/css; charset=utf-8';
          headers['Cache-Control'] = 'no-cache';
          res.writeHead(200, headers);
          res.write(".meteor-css-not-found-error { width: 0px;}");
          res.end();
          return;
        }

        if (request.url.query && request.url.query['meteor_js_resource']) {
          // Similarly, we're requesting a JS resource that we don't have.
          // Serve an uncached 404. (We can't use the same hack we use for CSS,
          // because actually acting on that hack requires us to have the JS
          // already!)
          headers['Cache-Control'] = 'no-cache';
          res.writeHead(404, headers);
          res.end("404 Not Found");
          return;
        }

        if (request.url.query && request.url.query['meteor_dont_serve_index']) {
          // When downloading files during a Cordova hot code push, we need
          // to detect if a file is not available instead of inadvertently
          // downloading the default index page.
          // So similar to the situation above, we serve an uncached 404.
          headers['Cache-Control'] = 'no-cache';
          res.writeHead(404, headers);
          res.end("404 Not Found");
          return;
        }

        const {
          arch
        } = getArchAndPath(parseRequest(req).pathname, request.browser); // If pauseClient(arch) has been called, program.paused will be a
        // Promise that will be resolved when the program is unpaused.

        Promise.await(WebApp.clientPrograms[arch].paused);
        return getBoilerplateAsync(request, arch).then(({
          stream,
          statusCode,
          headers: newHeaders
        }) => {
          if (!statusCode) {
            statusCode = res.statusCode ? res.statusCode : 200;
          }

          if (newHeaders) {
            Object.assign(headers, newHeaders);
          }

          res.writeHead(statusCode, headers);
          stream.pipe(res, {
            // End the response when the stream ends.
            end: true
          });
        }).catch(error => {
          Log.error("Error running template: " + error.stack);
          res.writeHead(500, headers);
          res.end();
        });
      }
    });
  }); // Return 404 by default, if no other handlers serve this URL.

  app.use(function (req, res) {
    res.writeHead(404);
    res.end();
  });
  var httpServer = createServer(app);
  var onListeningCallbacks = []; // After 5 seconds w/o data on a socket, kill it.  On the other hand, if
  // there's an outstanding request, give it a higher timeout instead (to avoid
  // killing long-polling requests)

  httpServer.setTimeout(SHORT_SOCKET_TIMEOUT); // Do this here, and then also in livedata/stream_server.js, because
  // stream_server.js kills all the current request handlers when installing its
  // own.

  httpServer.on('request', WebApp._timeoutAdjustmentRequestCallback); // If the client gave us a bad request, tell it instead of just closing the
  // socket. This lets load balancers in front of us differentiate between "a
  // server is randomly closing sockets for no reason" and "client sent a bad
  // request".
  //
  // This will only work on Node 6; Node 4 destroys the socket before calling
  // this event. See https://github.com/nodejs/node/pull/4557/ for details.

  httpServer.on('clientError', (err, socket) => {
    // Pre-Node-6, do nothing.
    if (socket.destroyed) {
      return;
    }

    if (err.message === 'Parse Error') {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    } else {
      // For other errors, use the default behavior as if we had no clientError
      // handler.
      socket.destroy(err);
    }
  }); // start up app

  _.extend(WebApp, {
    connectHandlers: packageAndAppHandlers,
    rawConnectHandlers: rawConnectHandlers,
    httpServer: httpServer,
    connectApp: app,
    // For testing.
    suppressConnectErrors: function () {
      suppressConnectErrors = true;
    },
    onListening: function (f) {
      if (onListeningCallbacks) onListeningCallbacks.push(f);else f();
    },
    // This can be overridden by users who want to modify how listening works
    // (eg, to run a proxy like Apollo Engine Proxy in front of the server).
    startListening: function (httpServer, listenOptions, cb) {
      httpServer.listen(listenOptions, cb);
    }
  }); // Let the rest of the packages (and Meteor.startup hooks) insert connect
  // middlewares and update __meteor_runtime_config__, then keep going to set up
  // actually serving HTML.


  exports.main = argv => {
    WebAppInternals.generateBoilerplate();

    const startHttpServer = listenOptions => {
      WebApp.startListening(httpServer, listenOptions, Meteor.bindEnvironment(() => {
        if (process.env.METEOR_PRINT_ON_LISTEN) {
          console.log("LISTENING");
        }

        const callbacks = onListeningCallbacks;
        onListeningCallbacks = null;
        callbacks.forEach(callback => {
          callback();
        });
      }, e => {
        console.error("Error listening:", e);
        console.error(e && e.stack);
      }));
    };

    let localPort = process.env.PORT || 0;
    const unixSocketPath = process.env.UNIX_SOCKET_PATH;

    if (unixSocketPath) {
      // Start the HTTP server using a socket file.
      removeExistingSocketFile(unixSocketPath);
      startHttpServer({
        path: unixSocketPath
      });
      registerSocketFileCleanup(unixSocketPath);
    } else {
      localPort = isNaN(Number(localPort)) ? localPort : Number(localPort);

      if (/\\\\?.+\\pipe\\?.+/.test(localPort)) {
        // Start the HTTP server using Windows Server style named pipe.
        startHttpServer({
          path: localPort
        });
      } else if (typeof localPort === "number") {
        // Start the HTTP server using TCP.
        startHttpServer({
          port: localPort,
          host: process.env.BIND_IP || "0.0.0.0"
        });
      } else {
        throw new Error("Invalid PORT specified");
      }
    }

    return "DAEMON";
  };
}

var inlineScriptsAllowed = true;

WebAppInternals.inlineScriptsAllowed = function () {
  return inlineScriptsAllowed;
};

WebAppInternals.setInlineScriptsAllowed = function (value) {
  inlineScriptsAllowed = value;
  WebAppInternals.generateBoilerplate();
};

var sriMode;

WebAppInternals.enableSubresourceIntegrity = function (use_credentials = false) {
  sriMode = use_credentials ? 'use-credentials' : 'anonymous';
  WebAppInternals.generateBoilerplate();
};

WebAppInternals.setBundledJsCssUrlRewriteHook = function (hookFn) {
  bundledJsCssUrlRewriteHook = hookFn;
  WebAppInternals.generateBoilerplate();
};

WebAppInternals.setBundledJsCssPrefix = function (prefix) {
  var self = this;
  self.setBundledJsCssUrlRewriteHook(function (url) {
    return prefix + url;
  });
}; // Packages can call `WebAppInternals.addStaticJs` to specify static
// JavaScript to be included in the app. This static JS will be inlined,
// unless inline scripts have been disabled, in which case it will be
// served under `/<sha1 of contents>`.


var additionalStaticJs = {};

WebAppInternals.addStaticJs = function (contents) {
  additionalStaticJs["/" + sha1(contents) + ".js"] = contents;
}; // Exported for tests


WebAppInternals.getBoilerplate = getBoilerplate;
WebAppInternals.additionalStaticJs = additionalStaticJs; // Start the server!

runWebAppServer();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"connect.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/webapp/connect.js                                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  connect: () => connect
});
let npmConnect;
module.link("connect", {
  default(v) {
    npmConnect = v;
  }

}, 0);

function connect(...connectArgs) {
  const handlers = npmConnect.apply(this, connectArgs);
  const originalUse = handlers.use; // Wrap the handlers.use method so that any provided handler functions
  // alway run in a Fiber.

  handlers.use = function use(...useArgs) {
    const {
      stack
    } = this;
    const originalLength = stack.length;
    const result = originalUse.apply(this, useArgs); // If we just added anything to the stack, wrap each new entry.handle
    // with a function that calls Promise.asyncApply to ensure the
    // original handler runs in a Fiber.

    for (let i = originalLength; i < stack.length; ++i) {
      const entry = stack[i];
      const originalHandle = entry.handle;

      if (originalHandle.length >= 4) {
        // If the original handle had four (or more) parameters, the
        // wrapper must also have four parameters, since connect uses
        // handle.length to dermine whether to pass the error as the first
        // argument to the handle function.
        entry.handle = function handle(err, req, res, next) {
          return Promise.asyncApply(originalHandle, this, arguments);
        };
      } else {
        entry.handle = function handle(req, res, next) {
          return Promise.asyncApply(originalHandle, this, arguments);
        };
      }
    }

    return result;
  };

  return handlers;
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"socket_file.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/webapp/socket_file.js                                                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  removeExistingSocketFile: () => removeExistingSocketFile,
  registerSocketFileCleanup: () => registerSocketFileCleanup
});
let statSync, unlinkSync, existsSync;
module.link("fs", {
  statSync(v) {
    statSync = v;
  },

  unlinkSync(v) {
    unlinkSync = v;
  },

  existsSync(v) {
    existsSync = v;
  }

}, 0);

const removeExistingSocketFile = socketPath => {
  try {
    if (statSync(socketPath).isSocket()) {
      // Since a new socket file will be created, remove the existing
      // file.
      unlinkSync(socketPath);
    } else {
      throw new Error(`An existing file was found at "${socketPath}" and it is not ` + 'a socket file. Please confirm PORT is pointing to valid and ' + 'un-used socket file path.');
    }
  } catch (error) {
    // If there is no existing socket file to cleanup, great, we'll
    // continue normally. If the caught exception represents any other
    // issue, re-throw.
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
};

const registerSocketFileCleanup = (socketPath, eventEmitter = process) => {
  ['exit', 'SIGINT', 'SIGHUP', 'SIGTERM'].forEach(signal => {
    eventEmitter.on(signal, Meteor.bindEnvironment(() => {
      if (existsSync(socketPath)) {
        unlinkSync(socketPath);
      }
    }));
  });
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"connect":{"package.json":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/connect/package.json                                                       //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.exports = {
  "name": "connect",
  "version": "3.6.5"
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/connect/index.js                                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.useNode();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"compression":{"package.json":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/compression/package.json                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.exports = {
  "name": "compression",
  "version": "1.7.1"
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/compression/index.js                                                       //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.useNode();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"cookie-parser":{"package.json":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/cookie-parser/package.json                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.exports = {
  "name": "cookie-parser",
  "version": "1.4.3"
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/cookie-parser/index.js                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.useNode();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"qs-middleware":{"package.json":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/qs-middleware/package.json                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.exports = {
  "name": "qs-middleware",
  "version": "1.0.3",
  "main": "./lib/qs-middleware.js"
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"qs-middleware.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/qs-middleware/lib/qs-middleware.js                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.useNode();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"parseurl":{"package.json":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/parseurl/package.json                                                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.exports = {
  "name": "parseurl",
  "version": "1.3.2"
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/parseurl/index.js                                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.useNode();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"basic-auth-connect":{"package.json":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/basic-auth-connect/package.json                                            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.exports = {
  "name": "basic-auth-connect",
  "version": "1.0.0"
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/basic-auth-connect/index.js                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.useNode();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"useragent":{"package.json":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/useragent/package.json                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.exports = {
  "name": "useragent",
  "version": "2.3.0",
  "main": "./index.js"
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/useragent/index.js                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.useNode();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"send":{"package.json":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/send/package.json                                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.exports = {
  "name": "send",
  "version": "0.16.1"
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/webapp/node_modules/send/index.js                                                              //
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

var exports = require("/node_modules/meteor/webapp/webapp_server.js");

/* Exports */
Package._define("webapp", exports, {
  WebApp: WebApp,
  WebAppInternals: WebAppInternals,
  main: main
});

})();

//# sourceURL=meteor://💻app/packages/webapp.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvd2ViYXBwL3dlYmFwcF9zZXJ2ZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3dlYmFwcC9jb25uZWN0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy93ZWJhcHAvc29ja2V0X2ZpbGUuanMiXSwibmFtZXMiOlsibW9kdWxlMSIsIm1vZHVsZSIsImV4cG9ydCIsIldlYkFwcCIsIldlYkFwcEludGVybmFscyIsImFzc2VydCIsImxpbmsiLCJkZWZhdWx0IiwidiIsInJlYWRGaWxlU3luYyIsImNyZWF0ZVNlcnZlciIsInBhdGhKb2luIiwicGF0aERpcm5hbWUiLCJqb2luIiwiZGlybmFtZSIsInBhcnNlVXJsIiwicGFyc2UiLCJjcmVhdGVIYXNoIiwiY29ubmVjdCIsImNvbXByZXNzIiwiY29va2llUGFyc2VyIiwicXVlcnkiLCJwYXJzZVJlcXVlc3QiLCJiYXNpY0F1dGgiLCJsb29rdXBVc2VyQWdlbnQiLCJsb29rdXAiLCJpc01vZGVybiIsImNhbGN1bGF0ZUhhc2hPZk1pbmltdW1WZXJzaW9ucyIsInNlbmQiLCJyZW1vdmVFeGlzdGluZ1NvY2tldEZpbGUiLCJyZWdpc3RlclNvY2tldEZpbGVDbGVhbnVwIiwib25NZXNzYWdlIiwiU0hPUlRfU09DS0VUX1RJTUVPVVQiLCJMT05HX1NPQ0tFVF9USU1FT1VUIiwiaGFzT3duIiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJOcG1Nb2R1bGVzIiwidmVyc2lvbiIsIk5wbSIsInJlcXVpcmUiLCJkZWZhdWx0QXJjaCIsImNsaWVudFByb2dyYW1zIiwiYXJjaFBhdGgiLCJidW5kbGVkSnNDc3NVcmxSZXdyaXRlSG9vayIsInVybCIsImJ1bmRsZWRQcmVmaXgiLCJfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fIiwiUk9PVF9VUkxfUEFUSF9QUkVGSVgiLCJzaGExIiwiY29udGVudHMiLCJoYXNoIiwidXBkYXRlIiwiZGlnZXN0IiwiY2FtZWxDYXNlIiwibmFtZSIsInBhcnRzIiwic3BsaXQiLCJ0b0xvd2VyQ2FzZSIsImkiLCJsZW5ndGgiLCJjaGFyQXQiLCJ0b1VwcGVyQ2FzZSIsInN1YnN0ciIsImlkZW50aWZ5QnJvd3NlciIsInVzZXJBZ2VudFN0cmluZyIsInVzZXJBZ2VudCIsImZhbWlseSIsIm1ham9yIiwibWlub3IiLCJwYXRjaCIsImNhdGVnb3JpemVSZXF1ZXN0IiwicmVxIiwiXyIsImV4dGVuZCIsImJyb3dzZXIiLCJoZWFkZXJzIiwicGljayIsImh0bWxBdHRyaWJ1dGVIb29rcyIsImdldEh0bWxBdHRyaWJ1dGVzIiwicmVxdWVzdCIsImNvbWJpbmVkQXR0cmlidXRlcyIsImVhY2giLCJob29rIiwiYXR0cmlidXRlcyIsIkVycm9yIiwiYWRkSHRtbEF0dHJpYnV0ZUhvb2siLCJwdXNoIiwiYXBwVXJsIiwiUm91dGVQb2xpY3kiLCJjbGFzc2lmeSIsIk1ldGVvciIsInN0YXJ0dXAiLCJnZXR0ZXIiLCJrZXkiLCJhcmNoIiwicHJvZ3JhbSIsInZhbHVlIiwiY2FsY3VsYXRlQ2xpZW50SGFzaCIsImNsaWVudEhhc2giLCJjYWxjdWxhdGVDbGllbnRIYXNoUmVmcmVzaGFibGUiLCJjYWxjdWxhdGVDbGllbnRIYXNoTm9uUmVmcmVzaGFibGUiLCJnZXRSZWZyZXNoYWJsZUFzc2V0cyIsIl90aW1lb3V0QWRqdXN0bWVudFJlcXVlc3RDYWxsYmFjayIsInJlcyIsInNldFRpbWVvdXQiLCJmaW5pc2hMaXN0ZW5lcnMiLCJsaXN0ZW5lcnMiLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJvbiIsImwiLCJib2lsZXJwbGF0ZUJ5QXJjaCIsImJvaWxlcnBsYXRlRGF0YUNhbGxiYWNrcyIsImNyZWF0ZSIsInJlZ2lzdGVyQm9pbGVycGxhdGVEYXRhQ2FsbGJhY2siLCJjYWxsYmFjayIsInByZXZpb3VzQ2FsbGJhY2siLCJzdHJpY3RFcXVhbCIsImdldEJvaWxlcnBsYXRlIiwiZ2V0Qm9pbGVycGxhdGVBc3luYyIsImF3YWl0IiwiYm9pbGVycGxhdGUiLCJkYXRhIiwiYXNzaWduIiwiYmFzZURhdGEiLCJodG1sQXR0cmlidXRlcyIsIm1hZGVDaGFuZ2VzIiwicHJvbWlzZSIsIlByb21pc2UiLCJyZXNvbHZlIiwia2V5cyIsImZvckVhY2giLCJ0aGVuIiwicmVzdWx0Iiwic3RyZWFtIiwidG9IVE1MU3RyZWFtIiwic3RhdHVzQ29kZSIsImdlbmVyYXRlQm9pbGVycGxhdGVJbnN0YW5jZSIsIm1hbmlmZXN0IiwiYWRkaXRpb25hbE9wdGlvbnMiLCJydW50aW1lQ29uZmlnIiwiY2xvbmUiLCJydW50aW1lQ29uZmlnT3ZlcnJpZGVzIiwiQm9pbGVycGxhdGUiLCJwYXRoTWFwcGVyIiwiaXRlbVBhdGgiLCJiYXNlRGF0YUV4dGVuc2lvbiIsImFkZGl0aW9uYWxTdGF0aWNKcyIsIm1hcCIsInBhdGhuYW1lIiwibWV0ZW9yUnVudGltZUNvbmZpZyIsIkpTT04iLCJzdHJpbmdpZnkiLCJlbmNvZGVVUklDb21wb25lbnQiLCJyb290VXJsUGF0aFByZWZpeCIsInNyaU1vZGUiLCJpbmxpbmVTY3JpcHRzQWxsb3dlZCIsImlubGluZSIsInN0YXRpY0ZpbGVzQnlBcmNoIiwic3RhdGljRmlsZXNNaWRkbGV3YXJlIiwibmV4dCIsIm1ldGhvZCIsImRlY29kZVVSSUNvbXBvbmVudCIsImUiLCJzZXJ2ZVN0YXRpY0pzIiwicyIsIndyaXRlSGVhZCIsIndyaXRlIiwiZW5kIiwiaGFzIiwicGF0aCIsImdldEFyY2hBbmRQYXRoIiwicGF1c2VkIiwiaW5mbyIsImdldFN0YXRpY0ZpbGVJbmZvIiwibWF4QWdlIiwiY2FjaGVhYmxlIiwic2V0SGVhZGVyIiwic291cmNlTWFwVXJsIiwidHlwZSIsImNvbnRlbnQiLCJhYnNvbHV0ZVBhdGgiLCJtYXhhZ2UiLCJkb3RmaWxlcyIsImxhc3RNb2RpZmllZCIsImVyciIsIkxvZyIsImVycm9yIiwicGlwZSIsIm9yaWdpbmFsUGF0aCIsImNhbGwiLCJzdGF0aWNBcmNoTGlzdCIsImFyY2hJbmRleCIsImluZGV4T2YiLCJ1bnNoaWZ0Iiwic3BsaWNlIiwic29tZSIsInN0YXRpY0ZpbGVzIiwiZmluYWxpemUiLCJwYXRoUGFydHMiLCJhcmNoS2V5Iiwic3RhcnRzV2l0aCIsImFyY2hDbGVhbmVkIiwic2xpY2UiLCJwYXJzZVBvcnQiLCJwb3J0IiwicGFyc2VkUG9ydCIsInBhcnNlSW50IiwiTnVtYmVyIiwiaXNOYU4iLCJwYXVzZUNsaWVudCIsImdlbmVyYXRlQ2xpZW50UHJvZ3JhbSIsInJ1bldlYkFwcFNlcnZlciIsInNodXR0aW5nRG93biIsInN5bmNRdWV1ZSIsIl9TeW5jaHJvbm91c1F1ZXVlIiwiZ2V0SXRlbVBhdGhuYW1lIiwiaXRlbVVybCIsInJlbG9hZENsaWVudFByb2dyYW1zIiwicnVuVGFzayIsImNvbmZpZ0pzb24iLCJfX21ldGVvcl9ib290c3RyYXBfXyIsImNsaWVudEFyY2hzIiwiY2xpZW50UGF0aHMiLCJzdGFjayIsInByb2Nlc3MiLCJleGl0IiwidW5wYXVzZSIsImNsaWVudERpciIsInNlcnZlckRpciIsInByb2dyYW1Kc29uUGF0aCIsInByb2dyYW1Kc29uIiwiY29kZSIsImZvcm1hdCIsIml0ZW0iLCJ3aGVyZSIsInNvdXJjZU1hcCIsIlBVQkxJQ19TRVRUSU5HUyIsImNvbmZpZ092ZXJyaWRlcyIsIm1pbmltdW1Nb2Rlcm5WZXJzaW9uc0hhc2giLCJvbGRQcm9ncmFtIiwibmV3UHJvZ3JhbSIsIldlYkFwcEhhc2hpbmciLCJ2ZXJzaW9uUmVmcmVzaGFibGUiLCJ2ZXJzaW9uTm9uUmVmcmVzaGFibGUiLCJjb3Jkb3ZhQ29tcGF0aWJpbGl0eVZlcnNpb25zIiwibWFuaWZlc3RVcmxQcmVmaXgiLCJyZXBsYWNlIiwibWFuaWZlc3RVcmwiLCJQYWNrYWdlIiwiYXV0b3VwZGF0ZSIsIkFVVE9VUERBVEVfVkVSU0lPTiIsIkF1dG91cGRhdGUiLCJhdXRvdXBkYXRlVmVyc2lvbiIsImVudiIsImdlbmVyYXRlQm9pbGVycGxhdGVGb3JBcmNoIiwiZGVmYXVsdE9wdGlvbnNGb3JBcmNoIiwiRERQX0RFRkFVTFRfQ09OTkVDVElPTl9VUkwiLCJNT0JJTEVfRERQX1VSTCIsImFic29sdXRlVXJsIiwiUk9PVF9VUkwiLCJNT0JJTEVfUk9PVF9VUkwiLCJnZW5lcmF0ZUJvaWxlcnBsYXRlIiwicmVmcmVzaGFibGVBc3NldHMiLCJjc3MiLCJmaWxlIiwiYXBwIiwicmF3Q29ubmVjdEhhbmRsZXJzIiwidXNlIiwiaXNWYWxpZFVybCIsImdldFBhdGhQYXJ0cyIsInNoaWZ0IiwiaXNQcmVmaXhPZiIsInByZWZpeCIsImFycmF5IiwiZXZlcnkiLCJwYXJ0IiwicmVzcG9uc2UiLCJwYXRoUHJlZml4IiwicHJlZml4UGFydHMiLCJtZXRlb3JJbnRlcm5hbEhhbmRsZXJzIiwicGFja2FnZUFuZEFwcEhhbmRsZXJzIiwic3VwcHJlc3NDb25uZWN0RXJyb3JzIiwic3RhdHVzIiwibmV3SGVhZGVycyIsImNhdGNoIiwiaHR0cFNlcnZlciIsIm9uTGlzdGVuaW5nQ2FsbGJhY2tzIiwic29ja2V0IiwiZGVzdHJveWVkIiwibWVzc2FnZSIsImRlc3Ryb3kiLCJjb25uZWN0SGFuZGxlcnMiLCJjb25uZWN0QXBwIiwib25MaXN0ZW5pbmciLCJmIiwic3RhcnRMaXN0ZW5pbmciLCJsaXN0ZW5PcHRpb25zIiwiY2IiLCJsaXN0ZW4iLCJleHBvcnRzIiwibWFpbiIsImFyZ3YiLCJzdGFydEh0dHBTZXJ2ZXIiLCJiaW5kRW52aXJvbm1lbnQiLCJNRVRFT1JfUFJJTlRfT05fTElTVEVOIiwiY29uc29sZSIsImxvZyIsImNhbGxiYWNrcyIsImxvY2FsUG9ydCIsIlBPUlQiLCJ1bml4U29ja2V0UGF0aCIsIlVOSVhfU09DS0VUX1BBVEgiLCJ0ZXN0IiwiaG9zdCIsIkJJTkRfSVAiLCJzZXRJbmxpbmVTY3JpcHRzQWxsb3dlZCIsImVuYWJsZVN1YnJlc291cmNlSW50ZWdyaXR5IiwidXNlX2NyZWRlbnRpYWxzIiwic2V0QnVuZGxlZEpzQ3NzVXJsUmV3cml0ZUhvb2siLCJob29rRm4iLCJzZXRCdW5kbGVkSnNDc3NQcmVmaXgiLCJzZWxmIiwiYWRkU3RhdGljSnMiLCJucG1Db25uZWN0IiwiY29ubmVjdEFyZ3MiLCJoYW5kbGVycyIsImFwcGx5Iiwib3JpZ2luYWxVc2UiLCJ1c2VBcmdzIiwib3JpZ2luYWxMZW5ndGgiLCJlbnRyeSIsIm9yaWdpbmFsSGFuZGxlIiwiaGFuZGxlIiwiYXN5bmNBcHBseSIsImFyZ3VtZW50cyIsInN0YXRTeW5jIiwidW5saW5rU3luYyIsImV4aXN0c1N5bmMiLCJzb2NrZXRQYXRoIiwiaXNTb2NrZXQiLCJldmVudEVtaXR0ZXIiLCJzaWduYWwiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxNQUFNQSxPQUFPLEdBQUNDLE1BQWQ7QUFBcUJELE9BQU8sQ0FBQ0UsTUFBUixDQUFlO0FBQUNDLFFBQU0sRUFBQyxNQUFJQSxNQUFaO0FBQW1CQyxpQkFBZSxFQUFDLE1BQUlBO0FBQXZDLENBQWY7QUFBd0UsSUFBSUMsTUFBSjtBQUFXTCxPQUFPLENBQUNNLElBQVIsQ0FBYSxRQUFiLEVBQXNCO0FBQUNDLFNBQU8sQ0FBQ0MsQ0FBRCxFQUFHO0FBQUNILFVBQU0sR0FBQ0csQ0FBUDtBQUFTOztBQUFyQixDQUF0QixFQUE2QyxDQUE3QztBQUFnRCxJQUFJQyxZQUFKO0FBQWlCVCxPQUFPLENBQUNNLElBQVIsQ0FBYSxJQUFiLEVBQWtCO0FBQUNHLGNBQVksQ0FBQ0QsQ0FBRCxFQUFHO0FBQUNDLGdCQUFZLEdBQUNELENBQWI7QUFBZTs7QUFBaEMsQ0FBbEIsRUFBb0QsQ0FBcEQ7QUFBdUQsSUFBSUUsWUFBSjtBQUFpQlYsT0FBTyxDQUFDTSxJQUFSLENBQWEsTUFBYixFQUFvQjtBQUFDSSxjQUFZLENBQUNGLENBQUQsRUFBRztBQUFDRSxnQkFBWSxHQUFDRixDQUFiO0FBQWU7O0FBQWhDLENBQXBCLEVBQXNELENBQXREO0FBQXlELElBQUlHLFFBQUosRUFBYUMsV0FBYjtBQUF5QlosT0FBTyxDQUFDTSxJQUFSLENBQWEsTUFBYixFQUFvQjtBQUFDTyxNQUFJLENBQUNMLENB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QUFVLENBQUNDLFVBQUQsQ0FBZCxFQUE0QjtBQUMxQkYsa0JBQVUsQ0FBQ0UsVUFBRCxDQUFWO0FBQ0Q7QUFDRixLQUp1QixDQUF4QjtBQUtELEdBTkQ7QUFPRCxDQVRJLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3dlYmFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBjcmVhdGVTZXJ2ZXIgfSBmcm9tIFwiaHR0cFwiO1xuaW1wb3J0IHtcbiAgam9pbiBhcyBwYXRoSm9pbixcbiAgZGlybmFtZSBhcyBwYXRoRGlybmFtZSxcbn0gZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IHBhcnNlIGFzIHBhcnNlVXJsIH0gZnJvbSBcInVybFwiO1xuaW1wb3J0IHsgY3JlYXRlSGFzaCB9IGZyb20gXCJjcnlwdG9cIjtcbmltcG9ydCB7IGNvbm5lY3QgfSBmcm9tIFwiLi9jb25uZWN0LmpzXCI7XG5pbXBvcnQgY29tcHJlc3MgZnJvbSBcImNvbXByZXNzaW9uXCI7XG5pbXBvcnQgY29va2llUGFyc2VyIGZyb20gXCJjb29raWUtcGFyc2VyXCI7XG5pbXBvcnQgcXVlcnkgZnJvbSBcInFzLW1pZGRsZXdhcmVcIjtcbmltcG9ydCBwYXJzZVJlcXVlc3QgZnJvbSBcInBhcnNldXJsXCI7XG5pbXBvcnQgYmFzaWNBdXRoIGZyb20gXCJiYXNpYy1hdXRoLWNvbm5lY3RcIjtcbmltcG9ydCB7IGxvb2t1cCBhcyBsb29rdXBVc2VyQWdlbnQgfSBmcm9tIFwidXNlcmFnZW50XCI7XG5pbXBvcnQge1xuICBpc01vZGVybixcbiAgY2FsY3VsYXRlSGFzaE9mTWluaW11bVZlcnNpb25zLFxufSBmcm9tIFwibWV0ZW9yL21vZGVybi1icm93c2Vyc1wiO1xuaW1wb3J0IHNlbmQgZnJvbSBcInNlbmRcIjtcbmltcG9ydCB7XG4gIHJlbW92ZUV4aXN0aW5nU29ja2V0RmlsZSxcbiAgcmVnaXN0ZXJTb2NrZXRGaWxlQ2xlYW51cCxcbn0gZnJvbSAnLi9zb2NrZXRfZmlsZS5qcyc7XG5cbnZhciBTSE9SVF9TT0NLRVRfVElNRU9VVCA9IDUqMTAwMDtcbnZhciBMT05HX1NPQ0tFVF9USU1FT1VUID0gMTIwKjEwMDA7XG5cbmV4cG9ydCBjb25zdCBXZWJBcHAgPSB7fTtcbmV4cG9ydCBjb25zdCBXZWJBcHBJbnRlcm5hbHMgPSB7fTtcblxuY29uc3QgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLy8gYmFja3dhcmRzIGNvbXBhdCB0byAyLjAgb2YgY29ubmVjdFxuY29ubmVjdC5iYXNpY0F1dGggPSBiYXNpY0F1dGg7XG5cbldlYkFwcEludGVybmFscy5OcG1Nb2R1bGVzID0ge1xuICBjb25uZWN0OiB7XG4gICAgdmVyc2lvbjogTnBtLnJlcXVpcmUoJ2Nvbm5lY3QvcGFja2FnZS5qc29uJykudmVyc2lvbixcbiAgICBtb2R1bGU6IGNvbm5lY3QsXG4gIH1cbn07XG5cbi8vIFRob3VnaCB3ZSBtaWdodCBwcmVmZXIgdG8gdXNlIHdlYi5icm93c2VyIChtb2Rlcm4pIGFzIHRoZSBkZWZhdWx0XG4vLyBhcmNoaXRlY3R1cmUsIHNhZmV0eSByZXF1aXJlcyBhIG1vcmUgY29tcGF0aWJsZSBkZWZhdWx0QXJjaC5cbldlYkFwcC5kZWZhdWx0QXJjaCA9ICd3ZWIuYnJvd3Nlci5sZWdhY3knO1xuXG4vLyBYWFggbWFwcyBhcmNocyB0byBtYW5pZmVzdHNcbldlYkFwcC5jbGllbnRQcm9ncmFtcyA9IHt9O1xuXG4vLyBYWFggbWFwcyBhcmNocyB0byBwcm9ncmFtIHBhdGggb24gZmlsZXN5c3RlbVxudmFyIGFyY2hQYXRoID0ge307XG5cbnZhciBidW5kbGVkSnNDc3NVcmxSZXdyaXRlSG9vayA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgdmFyIGJ1bmRsZWRQcmVmaXggPVxuICAgICBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLlJPT1RfVVJMX1BBVEhfUFJFRklYIHx8ICcnO1xuICByZXR1cm4gYnVuZGxlZFByZWZpeCArIHVybDtcbn07XG5cbnZhciBzaGExID0gZnVuY3Rpb24gKGNvbnRlbnRzKSB7XG4gIHZhciBoYXNoID0gY3JlYXRlSGFzaCgnc2hhMScpO1xuICBoYXNoLnVwZGF0ZShjb250ZW50cyk7XG4gIHJldHVybiBoYXNoLmRpZ2VzdCgnaGV4Jyk7XG59O1xuXG4vLyAjQnJvd3NlcklkZW50aWZpY2F0aW9uXG4vL1xuLy8gV2UgaGF2ZSBtdWx0aXBsZSBwbGFjZXMgdGhhdCB3YW50IHRvIGlkZW50aWZ5IHRoZSBicm93c2VyOiB0aGVcbi8vIHVuc3VwcG9ydGVkIGJyb3dzZXIgcGFnZSwgdGhlIGFwcGNhY2hlIHBhY2thZ2UsIGFuZCwgZXZlbnR1YWxseVxuLy8gZGVsaXZlcmluZyBicm93c2VyIHBvbHlmaWxscyBvbmx5IGFzIG5lZWRlZC5cbi8vXG4vLyBUbyBhdm9pZCBkZXRlY3RpbmcgdGhlIGJyb3dzZXIgaW4gbXVsdGlwbGUgcGxhY2VzIGFkLWhvYywgd2UgY3JlYXRlIGFcbi8vIE1ldGVvciBcImJyb3dzZXJcIiBvYmplY3QuIEl0IHVzZXMgYnV0IGRvZXMgbm90IGV4cG9zZSB0aGUgbnBtXG4vLyB1c2VyYWdlbnQgbW9kdWxlICh3ZSBjb3VsZCBjaG9vc2UgYSBkaWZmZXJlbnQgbWVjaGFuaXNtIHRvIGlkZW50aWZ5XG4vLyB0aGUgYnJvd3NlciBpbiB0aGUgZnV0dXJlIGlmIHdlIHdhbnRlZCB0bykuICBUaGUgYnJvd3NlciBvYmplY3Rcbi8vIGNvbnRhaW5zXG4vL1xuLy8gKiBgbmFtZWA6IHRoZSBuYW1lIG9mIHRoZSBicm93c2VyIGluIGNhbWVsIGNhc2Vcbi8vICogYG1ham9yYCwgYG1pbm9yYCwgYHBhdGNoYDogaW50ZWdlcnMgZGVzY3JpYmluZyB0aGUgYnJvd3NlciB2ZXJzaW9uXG4vL1xuLy8gQWxzbyBoZXJlIGlzIGFuIGVhcmx5IHZlcnNpb24gb2YgYSBNZXRlb3IgYHJlcXVlc3RgIG9iamVjdCwgaW50ZW5kZWRcbi8vIHRvIGJlIGEgaGlnaC1sZXZlbCBkZXNjcmlwdGlvbiBvZiB0aGUgcmVxdWVzdCB3aXRob3V0IGV4cG9zaW5nXG4vLyBkZXRhaWxzIG9mIGNvbm5lY3QncyBsb3ctbGV2ZWwgYHJlcWAuICBDdXJyZW50bHkgaXQgY29udGFpbnM6XG4vL1xuLy8gKiBgYnJvd3NlcmA6IGJyb3dzZXIgaWRlbnRpZmljYXRpb24gb2JqZWN0IGRlc2NyaWJlZCBhYm92ZVxuLy8gKiBgdXJsYDogcGFyc2VkIHVybCwgaW5jbHVkaW5nIHBhcnNlZCBxdWVyeSBwYXJhbXNcbi8vXG4vLyBBcyBhIHRlbXBvcmFyeSBoYWNrIHRoZXJlIGlzIGEgYGNhdGVnb3JpemVSZXF1ZXN0YCBmdW5jdGlvbiBvbiBXZWJBcHAgd2hpY2hcbi8vIGNvbnZlcnRzIGEgY29ubmVjdCBgcmVxYCB0byBhIE1ldGVvciBgcmVxdWVzdGAuIFRoaXMgY2FuIGdvIGF3YXkgb25jZSBzbWFydFxuLy8gcGFja2FnZXMgc3VjaCBhcyBhcHBjYWNoZSBhcmUgYmVpbmcgcGFzc2VkIGEgYHJlcXVlc3RgIG9iamVjdCBkaXJlY3RseSB3aGVuXG4vLyB0aGV5IHNlcnZlIGNvbnRlbnQuXG4vL1xuLy8gVGhpcyBhbGxvd3MgYHJlcXVlc3RgIHRvIGJlIHVzZWQgdW5pZm9ybWx5OiBpdCBpcyBwYXNzZWQgdG8gdGhlIGh0bWxcbi8vIGF0dHJpYnV0ZXMgaG9vaywgYW5kIHRoZSBhcHBjYWNoZSBwYWNrYWdlIGNhbiB1c2UgaXQgd2hlbiBkZWNpZGluZ1xuLy8gd2hldGhlciB0byBnZW5lcmF0ZSBhIDQwNCBmb3IgdGhlIG1hbmlmZXN0LlxuLy9cbi8vIFJlYWwgcm91dGluZyAvIHNlcnZlciBzaWRlIHJlbmRlcmluZyB3aWxsIHByb2JhYmx5IHJlZmFjdG9yIHRoaXNcbi8vIGhlYXZpbHkuXG5cblxuLy8gZS5nLiBcIk1vYmlsZSBTYWZhcmlcIiA9PiBcIm1vYmlsZVNhZmFyaVwiXG52YXIgY2FtZWxDYXNlID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgdmFyIHBhcnRzID0gbmFtZS5zcGxpdCgnICcpO1xuICBwYXJ0c1swXSA9IHBhcnRzWzBdLnRvTG93ZXJDYXNlKCk7XG4gIGZvciAodmFyIGkgPSAxOyAgaSA8IHBhcnRzLmxlbmd0aDsgICsraSkge1xuICAgIHBhcnRzW2ldID0gcGFydHNbaV0uY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwYXJ0c1tpXS5zdWJzdHIoMSk7XG4gIH1cbiAgcmV0dXJuIHBhcnRzLmpvaW4oJycpO1xufTtcblxudmFyIGlkZW50aWZ5QnJvd3NlciA9IGZ1bmN0aW9uICh1c2VyQWdlbnRTdHJpbmcpIHtcbiAgdmFyIHVzZXJBZ2VudCA9IGxvb2t1cFVzZXJBZ2VudCh1c2VyQWdlbnRTdHJpbmcpO1xuICByZXR1cm4ge1xuICAgIG5hbWU6IGNhbWVsQ2FzZSh1c2VyQWdlbnQuZmFtaWx5KSxcbiAgICBtYWpvcjogK3VzZXJBZ2VudC5tYWpvcixcbiAgICBtaW5vcjogK3VzZXJBZ2VudC5taW5vcixcbiAgICBwYXRjaDogK3VzZXJBZ2VudC5wYXRjaFxuICB9O1xufTtcblxuLy8gWFhYIFJlZmFjdG9yIGFzIHBhcnQgb2YgaW1wbGVtZW50aW5nIHJlYWwgcm91dGluZy5cbldlYkFwcEludGVybmFscy5pZGVudGlmeUJyb3dzZXIgPSBpZGVudGlmeUJyb3dzZXI7XG5cbldlYkFwcC5jYXRlZ29yaXplUmVxdWVzdCA9IGZ1bmN0aW9uIChyZXEpIHtcbiAgcmV0dXJuIF8uZXh0ZW5kKHtcbiAgICBicm93c2VyOiBpZGVudGlmeUJyb3dzZXIocmVxLmhlYWRlcnNbJ3VzZXItYWdlbnQnXSksXG4gICAgdXJsOiBwYXJzZVVybChyZXEudXJsLCB0cnVlKVxuICB9LCBfLnBpY2socmVxLCAnZHluYW1pY0hlYWQnLCAnZHluYW1pY0JvZHknLCAnaGVhZGVycycsICdjb29raWVzJykpO1xufTtcblxuLy8gSFRNTCBhdHRyaWJ1dGUgaG9va3M6IGZ1bmN0aW9ucyB0byBiZSBjYWxsZWQgdG8gZGV0ZXJtaW5lIGFueSBhdHRyaWJ1dGVzIHRvXG4vLyBiZSBhZGRlZCB0byB0aGUgJzxodG1sPicgdGFnLiBFYWNoIGZ1bmN0aW9uIGlzIHBhc3NlZCBhICdyZXF1ZXN0JyBvYmplY3QgKHNlZVxuLy8gI0Jyb3dzZXJJZGVudGlmaWNhdGlvbikgYW5kIHNob3VsZCByZXR1cm4gbnVsbCBvciBvYmplY3QuXG52YXIgaHRtbEF0dHJpYnV0ZUhvb2tzID0gW107XG52YXIgZ2V0SHRtbEF0dHJpYnV0ZXMgPSBmdW5jdGlvbiAocmVxdWVzdCkge1xuICB2YXIgY29tYmluZWRBdHRyaWJ1dGVzICA9IHt9O1xuICBfLmVhY2goaHRtbEF0dHJpYnV0ZUhvb2tzIHx8IFtdLCBmdW5jdGlvbiAoaG9vaykge1xuICAgIHZhciBhdHRyaWJ1dGVzID0gaG9vayhyZXF1ZXN0KTtcbiAgICBpZiAoYXR0cmlidXRlcyA9PT0gbnVsbClcbiAgICAgIHJldHVybjtcbiAgICBpZiAodHlwZW9mIGF0dHJpYnV0ZXMgIT09ICdvYmplY3QnKVxuICAgICAgdGhyb3cgRXJyb3IoXCJIVE1MIGF0dHJpYnV0ZSBob29rIG11c3QgcmV0dXJuIG51bGwgb3Igb2JqZWN0XCIpO1xuICAgIF8uZXh0ZW5kKGNvbWJpbmVkQXR0cmlidXRlcywgYXR0cmlidXRlcyk7XG4gIH0pO1xuICByZXR1cm4gY29tYmluZWRBdHRyaWJ1dGVzO1xufTtcbldlYkFwcC5hZGRIdG1sQXR0cmlidXRlSG9vayA9IGZ1bmN0aW9uIChob29rKSB7XG4gIGh0bWxBdHRyaWJ1dGVIb29rcy5wdXNoKGhvb2spO1xufTtcblxuLy8gU2VydmUgYXBwIEhUTUwgZm9yIHRoaXMgVVJMP1xudmFyIGFwcFVybCA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgaWYgKHVybCA9PT0gJy9mYXZpY29uLmljbycgfHwgdXJsID09PSAnL3JvYm90cy50eHQnKVxuICAgIHJldHVybiBmYWxzZTtcblxuICAvLyBOT1RFOiBhcHAubWFuaWZlc3QgaXMgbm90IGEgd2ViIHN0YW5kYXJkIGxpa2UgZmF2aWNvbi5pY28gYW5kXG4gIC8vIHJvYm90cy50eHQuIEl0IGlzIGEgZmlsZSBuYW1lIHdlIGhhdmUgY2hvc2VuIHRvIHVzZSBmb3IgSFRNTDVcbiAgLy8gYXBwY2FjaGUgVVJMcy4gSXQgaXMgaW5jbHVkZWQgaGVyZSB0byBwcmV2ZW50IHVzaW5nIGFuIGFwcGNhY2hlXG4gIC8vIHRoZW4gcmVtb3ZpbmcgaXQgZnJvbSBwb2lzb25pbmcgYW4gYXBwIHBlcm1hbmVudGx5LiBFdmVudHVhbGx5LFxuICAvLyBvbmNlIHdlIGhhdmUgc2VydmVyIHNpZGUgcm91dGluZywgdGhpcyB3b24ndCBiZSBuZWVkZWQgYXNcbiAgLy8gdW5rbm93biBVUkxzIHdpdGggcmV0dXJuIGEgNDA0IGF1dG9tYXRpY2FsbHkuXG4gIGlmICh1cmwgPT09ICcvYXBwLm1hbmlmZXN0JylcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgLy8gQXZvaWQgc2VydmluZyBhcHAgSFRNTCBmb3IgZGVjbGFyZWQgcm91dGVzIHN1Y2ggYXMgL3NvY2tqcy8uXG4gIGlmIChSb3V0ZVBvbGljeS5jbGFzc2lmeSh1cmwpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICAvLyB3ZSBjdXJyZW50bHkgcmV0dXJuIGFwcCBIVE1MIG9uIGFsbCBVUkxzIGJ5IGRlZmF1bHRcbiAgcmV0dXJuIHRydWU7XG59O1xuXG5cbi8vIFdlIG5lZWQgdG8gY2FsY3VsYXRlIHRoZSBjbGllbnQgaGFzaCBhZnRlciBhbGwgcGFja2FnZXMgaGF2ZSBsb2FkZWRcbi8vIHRvIGdpdmUgdGhlbSBhIGNoYW5jZSB0byBwb3B1bGF0ZSBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLlxuLy9cbi8vIENhbGN1bGF0aW5nIHRoZSBoYXNoIGR1cmluZyBzdGFydHVwIG1lYW5zIHRoYXQgcGFja2FnZXMgY2FuIG9ubHlcbi8vIHBvcHVsYXRlIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18gZHVyaW5nIGxvYWQsIG5vdCBkdXJpbmcgc3RhcnR1cC5cbi8vXG4vLyBDYWxjdWxhdGluZyBpbnN0ZWFkIGl0IGF0IHRoZSBiZWdpbm5pbmcgb2YgbWFpbiBhZnRlciBhbGwgc3RhcnR1cFxuLy8gaG9va3MgaGFkIHJ1biB3b3VsZCBhbGxvdyBwYWNrYWdlcyB0byBhbHNvIHBvcHVsYXRlXG4vLyBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fIGR1cmluZyBzdGFydHVwLCBidXQgdGhhdCdzIHRvbyBsYXRlIGZvclxuLy8gYXV0b3VwZGF0ZSBiZWNhdXNlIGl0IG5lZWRzIHRvIGhhdmUgdGhlIGNsaWVudCBoYXNoIGF0IHN0YXJ0dXAgdG9cbi8vIGluc2VydCB0aGUgYXV0byB1cGRhdGUgdmVyc2lvbiBpdHNlbGYgaW50b1xuLy8gX19tZXRlb3JfcnVudGltZV9jb25maWdfXyB0byBnZXQgaXQgdG8gdGhlIGNsaWVudC5cbi8vXG4vLyBBbiBhbHRlcm5hdGl2ZSB3b3VsZCBiZSB0byBnaXZlIGF1dG91cGRhdGUgYSBcInBvc3Qtc3RhcnQsXG4vLyBwcmUtbGlzdGVuXCIgaG9vayB0byBhbGxvdyBpdCB0byBpbnNlcnQgdGhlIGF1dG8gdXBkYXRlIHZlcnNpb24gYXRcbi8vIHRoZSByaWdodCBtb21lbnQuXG5cbk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gZ2V0dGVyKGtleSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoYXJjaCkge1xuICAgICAgYXJjaCA9IGFyY2ggfHwgV2ViQXBwLmRlZmF1bHRBcmNoO1xuICAgICAgY29uc3QgcHJvZ3JhbSA9IFdlYkFwcC5jbGllbnRQcm9ncmFtc1thcmNoXTtcbiAgICAgIGNvbnN0IHZhbHVlID0gcHJvZ3JhbSAmJiBwcm9ncmFtW2tleV07XG4gICAgICAvLyBJZiB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lIHdlIGhhdmUgY2FsY3VsYXRlZCB0aGlzIGhhc2gsXG4gICAgICAvLyBwcm9ncmFtW2tleV0gd2lsbCBiZSBhIHRodW5rIChsYXp5IGZ1bmN0aW9uIHdpdGggbm8gcGFyYW1ldGVycylcbiAgICAgIC8vIHRoYXQgd2Ugc2hvdWxkIGNhbGwgdG8gZG8gdGhlIGFjdHVhbCBjb21wdXRhdGlvbi5cbiAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICA/IHByb2dyYW1ba2V5XSA9IHZhbHVlKClcbiAgICAgICAgOiB2YWx1ZTtcbiAgICB9O1xuICB9XG5cbiAgV2ViQXBwLmNhbGN1bGF0ZUNsaWVudEhhc2ggPSBXZWJBcHAuY2xpZW50SGFzaCA9IGdldHRlcihcInZlcnNpb25cIik7XG4gIFdlYkFwcC5jYWxjdWxhdGVDbGllbnRIYXNoUmVmcmVzaGFibGUgPSBnZXR0ZXIoXCJ2ZXJzaW9uUmVmcmVzaGFibGVcIik7XG4gIFdlYkFwcC5jYWxjdWxhdGVDbGllbnRIYXNoTm9uUmVmcmVzaGFibGUgPSBnZXR0ZXIoXCJ2ZXJzaW9uTm9uUmVmcmVzaGFibGVcIik7XG4gIFdlYkFwcC5nZXRSZWZyZXNoYWJsZUFzc2V0cyA9IGdldHRlcihcInJlZnJlc2hhYmxlQXNzZXRzXCIpO1xufSk7XG5cblxuXG4vLyBXaGVuIHdlIGhhdmUgYSByZXF1ZXN0IHBlbmRpbmcsIHdlIHdhbnQgdGhlIHNvY2tldCB0aW1lb3V0IHRvIGJlIGxvbmcsIHRvXG4vLyBnaXZlIG91cnNlbHZlcyBhIHdoaWxlIHRvIHNlcnZlIGl0LCBhbmQgdG8gYWxsb3cgc29ja2pzIGxvbmcgcG9sbHMgdG9cbi8vIGNvbXBsZXRlLiAgT24gdGhlIG90aGVyIGhhbmQsIHdlIHdhbnQgdG8gY2xvc2UgaWRsZSBzb2NrZXRzIHJlbGF0aXZlbHlcbi8vIHF1aWNrbHksIHNvIHRoYXQgd2UgY2FuIHNodXQgZG93biByZWxhdGl2ZWx5IHByb21wdGx5IGJ1dCBjbGVhbmx5LCB3aXRob3V0XG4vLyBjdXR0aW5nIG9mZiBhbnlvbmUncyByZXNwb25zZS5cbldlYkFwcC5fdGltZW91dEFkanVzdG1lbnRSZXF1ZXN0Q2FsbGJhY2sgPSBmdW5jdGlvbiAocmVxLCByZXMpIHtcbiAgLy8gdGhpcyBpcyByZWFsbHkganVzdCByZXEuc29ja2V0LnNldFRpbWVvdXQoTE9OR19TT0NLRVRfVElNRU9VVCk7XG4gIHJlcS5zZXRUaW1lb3V0KExPTkdfU09DS0VUX1RJTUVPVVQpO1xuICAvLyBJbnNlcnQgb3VyIG5ldyBmaW5pc2ggbGlzdGVuZXIgdG8gcnVuIEJFRk9SRSB0aGUgZXhpc3Rpbmcgb25lIHdoaWNoIHJlbW92ZXNcbiAgLy8gdGhlIHJlc3BvbnNlIGZyb20gdGhlIHNvY2tldC5cbiAgdmFyIGZpbmlzaExpc3RlbmVycyA9IHJlcy5saXN0ZW5lcnMoJ2ZpbmlzaCcpO1xuICAvLyBYWFggQXBwYXJlbnRseSBpbiBOb2RlIDAuMTIgdGhpcyBldmVudCB3YXMgY2FsbGVkICdwcmVmaW5pc2gnLlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vam95ZW50L25vZGUvY29tbWl0LzdjOWI2MDcwXG4gIC8vIEJ1dCBpdCBoYXMgc3dpdGNoZWQgYmFjayB0byAnZmluaXNoJyBpbiBOb2RlIHY0OlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vbm9kZWpzL25vZGUvcHVsbC8xNDExXG4gIHJlcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ2ZpbmlzaCcpO1xuICByZXMub24oJ2ZpbmlzaCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXMuc2V0VGltZW91dChTSE9SVF9TT0NLRVRfVElNRU9VVCk7XG4gIH0pO1xuICBfLmVhY2goZmluaXNoTGlzdGVuZXJzLCBmdW5jdGlvbiAobCkgeyByZXMub24oJ2ZpbmlzaCcsIGwpOyB9KTtcbn07XG5cblxuLy8gV2lsbCBiZSB1cGRhdGVkIGJ5IG1haW4gYmVmb3JlIHdlIGxpc3Rlbi5cbi8vIE1hcCBmcm9tIGNsaWVudCBhcmNoIHRvIGJvaWxlcnBsYXRlIG9iamVjdC5cbi8vIEJvaWxlcnBsYXRlIG9iamVjdCBoYXM6XG4vLyAgIC0gZnVuYzogWFhYXG4vLyAgIC0gYmFzZURhdGE6IFhYWFxudmFyIGJvaWxlcnBsYXRlQnlBcmNoID0ge307XG5cbi8vIFJlZ2lzdGVyIGEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBjYW4gc2VsZWN0aXZlbHkgbW9kaWZ5IGJvaWxlcnBsYXRlXG4vLyBkYXRhIGdpdmVuIGFyZ3VtZW50cyAocmVxdWVzdCwgZGF0YSwgYXJjaCkuIFRoZSBrZXkgc2hvdWxkIGJlIGEgdW5pcXVlXG4vLyBpZGVudGlmaWVyLCB0byBwcmV2ZW50IGFjY3VtdWxhdGluZyBkdXBsaWNhdGUgY2FsbGJhY2tzIGZyb20gdGhlIHNhbWVcbi8vIGNhbGwgc2l0ZSBvdmVyIHRpbWUuIENhbGxiYWNrcyB3aWxsIGJlIGNhbGxlZCBpbiB0aGUgb3JkZXIgdGhleSB3ZXJlXG4vLyByZWdpc3RlcmVkLiBBIGNhbGxiYWNrIHNob3VsZCByZXR1cm4gZmFsc2UgaWYgaXQgZGlkIG5vdCBtYWtlIGFueVxuLy8gY2hhbmdlcyBhZmZlY3RpbmcgdGhlIGJvaWxlcnBsYXRlLiBQYXNzaW5nIG51bGwgZGVsZXRlcyB0aGUgY2FsbGJhY2suXG4vLyBBbnkgcHJldmlvdXMgY2FsbGJhY2sgcmVnaXN0ZXJlZCBmb3IgdGhpcyBrZXkgd2lsbCBiZSByZXR1cm5lZC5cbmNvbnN0IGJvaWxlcnBsYXRlRGF0YUNhbGxiYWNrcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5XZWJBcHBJbnRlcm5hbHMucmVnaXN0ZXJCb2lsZXJwbGF0ZURhdGFDYWxsYmFjayA9IGZ1bmN0aW9uIChrZXksIGNhbGxiYWNrKSB7XG4gIGNvbnN0IHByZXZpb3VzQ2FsbGJhY2sgPSBib2lsZXJwbGF0ZURhdGFDYWxsYmFja3Nba2V5XTtcblxuICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBib2lsZXJwbGF0ZURhdGFDYWxsYmFja3Nba2V5XSA9IGNhbGxiYWNrO1xuICB9IGVsc2Uge1xuICAgIGFzc2VydC5zdHJpY3RFcXVhbChjYWxsYmFjaywgbnVsbCk7XG4gICAgZGVsZXRlIGJvaWxlcnBsYXRlRGF0YUNhbGxiYWNrc1trZXldO1xuICB9XG5cbiAgLy8gUmV0dXJuIHRoZSBwcmV2aW91cyBjYWxsYmFjayBpbiBjYXNlIHRoZSBuZXcgY2FsbGJhY2sgbmVlZHMgdG8gY2FsbFxuICAvLyBpdDsgZm9yIGV4YW1wbGUsIHdoZW4gdGhlIG5ldyBjYWxsYmFjayBpcyBhIHdyYXBwZXIgZm9yIHRoZSBvbGQuXG4gIHJldHVybiBwcmV2aW91c0NhbGxiYWNrIHx8IG51bGw7XG59O1xuXG4vLyBHaXZlbiBhIHJlcXVlc3QgKGFzIHJldHVybmVkIGZyb20gYGNhdGVnb3JpemVSZXF1ZXN0YCksIHJldHVybiB0aGVcbi8vIGJvaWxlcnBsYXRlIEhUTUwgdG8gc2VydmUgZm9yIHRoYXQgcmVxdWVzdC5cbi8vXG4vLyBJZiBhIHByZXZpb3VzIGNvbm5lY3QgbWlkZGxld2FyZSBoYXMgcmVuZGVyZWQgY29udGVudCBmb3IgdGhlIGhlYWQgb3IgYm9keSxcbi8vIHJldHVybnMgdGhlIGJvaWxlcnBsYXRlIHdpdGggdGhhdCBjb250ZW50IHBhdGNoZWQgaW4gb3RoZXJ3aXNlXG4vLyBtZW1vaXplcyBvbiBIVE1MIGF0dHJpYnV0ZXMgKHVzZWQgYnksIGVnLCBhcHBjYWNoZSkgYW5kIHdoZXRoZXIgaW5saW5lXG4vLyBzY3JpcHRzIGFyZSBjdXJyZW50bHkgYWxsb3dlZC5cbi8vIFhYWCBzbyBmYXIgdGhpcyBmdW5jdGlvbiBpcyBhbHdheXMgY2FsbGVkIHdpdGggYXJjaCA9PT0gJ3dlYi5icm93c2VyJ1xuZnVuY3Rpb24gZ2V0Qm9pbGVycGxhdGUocmVxdWVzdCwgYXJjaCkge1xuICByZXR1cm4gZ2V0Qm9pbGVycGxhdGVBc3luYyhyZXF1ZXN0LCBhcmNoKS5hd2FpdCgpO1xufVxuXG5mdW5jdGlvbiBnZXRCb2lsZXJwbGF0ZUFzeW5jKHJlcXVlc3QsIGFyY2gpIHtcbiAgY29uc3QgYm9pbGVycGxhdGUgPSBib2lsZXJwbGF0ZUJ5QXJjaFthcmNoXTtcbiAgY29uc3QgZGF0YSA9IE9iamVjdC5hc3NpZ24oe30sIGJvaWxlcnBsYXRlLmJhc2VEYXRhLCB7XG4gICAgaHRtbEF0dHJpYnV0ZXM6IGdldEh0bWxBdHRyaWJ1dGVzKHJlcXVlc3QpLFxuICB9LCBfLnBpY2socmVxdWVzdCwgXCJkeW5hbWljSGVhZFwiLCBcImR5bmFtaWNCb2R5XCIpKTtcblxuICBsZXQgbWFkZUNoYW5nZXMgPSBmYWxzZTtcbiAgbGV0IHByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcblxuICBPYmplY3Qua2V5cyhib2lsZXJwbGF0ZURhdGFDYWxsYmFja3MpLmZvckVhY2goa2V5ID0+IHtcbiAgICBwcm9taXNlID0gcHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IGNhbGxiYWNrID0gYm9pbGVycGxhdGVEYXRhQ2FsbGJhY2tzW2tleV07XG4gICAgICByZXR1cm4gY2FsbGJhY2socmVxdWVzdCwgZGF0YSwgYXJjaCk7XG4gICAgfSkudGhlbihyZXN1bHQgPT4ge1xuICAgICAgLy8gQ2FsbGJhY2tzIHNob3VsZCByZXR1cm4gZmFsc2UgaWYgdGhleSBkaWQgbm90IG1ha2UgYW55IGNoYW5nZXMuXG4gICAgICBpZiAocmVzdWx0ICE9PSBmYWxzZSkge1xuICAgICAgICBtYWRlQ2hhbmdlcyA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiBwcm9taXNlLnRoZW4oKCkgPT4gKHtcbiAgICBzdHJlYW06IGJvaWxlcnBsYXRlLnRvSFRNTFN0cmVhbShkYXRhKSxcbiAgICBzdGF0dXNDb2RlOiBkYXRhLnN0YXR1c0NvZGUsXG4gICAgaGVhZGVyczogZGF0YS5oZWFkZXJzLFxuICB9KSk7XG59XG5cbldlYkFwcEludGVybmFscy5nZW5lcmF0ZUJvaWxlcnBsYXRlSW5zdGFuY2UgPSBmdW5jdGlvbiAoYXJjaCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFuaWZlc3QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZGl0aW9uYWxPcHRpb25zKSB7XG4gIGFkZGl0aW9uYWxPcHRpb25zID0gYWRkaXRpb25hbE9wdGlvbnMgfHwge307XG5cbiAgdmFyIHJ1bnRpbWVDb25maWcgPSBfLmV4dGVuZChcbiAgICBfLmNsb25lKF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18pLFxuICAgIGFkZGl0aW9uYWxPcHRpb25zLnJ1bnRpbWVDb25maWdPdmVycmlkZXMgfHwge31cbiAgKTtcblxuICByZXR1cm4gbmV3IEJvaWxlcnBsYXRlKGFyY2gsIG1hbmlmZXN0LCBfLmV4dGVuZCh7XG4gICAgcGF0aE1hcHBlcihpdGVtUGF0aCkge1xuICAgICAgcmV0dXJuIHBhdGhKb2luKGFyY2hQYXRoW2FyY2hdLCBpdGVtUGF0aCk7XG4gICAgfSxcbiAgICBiYXNlRGF0YUV4dGVuc2lvbjoge1xuICAgICAgYWRkaXRpb25hbFN0YXRpY0pzOiBfLm1hcChcbiAgICAgICAgYWRkaXRpb25hbFN0YXRpY0pzIHx8IFtdLFxuICAgICAgICBmdW5jdGlvbiAoY29udGVudHMsIHBhdGhuYW1lKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBhdGhuYW1lOiBwYXRobmFtZSxcbiAgICAgICAgICAgIGNvbnRlbnRzOiBjb250ZW50c1xuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICksXG4gICAgICAvLyBDb252ZXJ0IHRvIGEgSlNPTiBzdHJpbmcsIHRoZW4gZ2V0IHJpZCBvZiBtb3N0IHdlaXJkIGNoYXJhY3RlcnMsIHRoZW5cbiAgICAgIC8vIHdyYXAgaW4gZG91YmxlIHF1b3Rlcy4gKFRoZSBvdXRlcm1vc3QgSlNPTi5zdHJpbmdpZnkgcmVhbGx5IG91Z2h0IHRvXG4gICAgICAvLyBqdXN0IGJlIFwid3JhcCBpbiBkb3VibGUgcXVvdGVzXCIgYnV0IHdlIHVzZSBpdCB0byBiZSBzYWZlLikgVGhpcyBtaWdodFxuICAgICAgLy8gZW5kIHVwIGluc2lkZSBhIDxzY3JpcHQ+IHRhZyBzbyB3ZSBuZWVkIHRvIGJlIGNhcmVmdWwgdG8gbm90IGluY2x1ZGVcbiAgICAgIC8vIFwiPC9zY3JpcHQ+XCIsIGJ1dCBub3JtYWwge3tzcGFjZWJhcnN9fSBlc2NhcGluZyBlc2NhcGVzIHRvbyBtdWNoISBTZWVcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tZXRlb3IvbWV0ZW9yL2lzc3Vlcy8zNzMwXG4gICAgICBtZXRlb3JSdW50aW1lQ29uZmlnOiBKU09OLnN0cmluZ2lmeShcbiAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KHJ1bnRpbWVDb25maWcpKSksXG4gICAgICByb290VXJsUGF0aFByZWZpeDogX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ST09UX1VSTF9QQVRIX1BSRUZJWCB8fCAnJyxcbiAgICAgIGJ1bmRsZWRKc0Nzc1VybFJld3JpdGVIb29rOiBidW5kbGVkSnNDc3NVcmxSZXdyaXRlSG9vayxcbiAgICAgIHNyaU1vZGU6IHNyaU1vZGUsXG4gICAgICBpbmxpbmVTY3JpcHRzQWxsb3dlZDogV2ViQXBwSW50ZXJuYWxzLmlubGluZVNjcmlwdHNBbGxvd2VkKCksXG4gICAgICBpbmxpbmU6IGFkZGl0aW9uYWxPcHRpb25zLmlubGluZVxuICAgIH1cbiAgfSwgYWRkaXRpb25hbE9wdGlvbnMpKTtcbn07XG5cbi8vIEEgbWFwcGluZyBmcm9tIHVybCBwYXRoIHRvIGFyY2hpdGVjdHVyZSAoZS5nLiBcIndlYi5icm93c2VyXCIpIHRvIHN0YXRpY1xuLy8gZmlsZSBpbmZvcm1hdGlvbiB3aXRoIHRoZSBmb2xsb3dpbmcgZmllbGRzOlxuLy8gLSB0eXBlOiB0aGUgdHlwZSBvZiBmaWxlIHRvIGJlIHNlcnZlZFxuLy8gLSBjYWNoZWFibGU6IG9wdGlvbmFsbHksIHdoZXRoZXIgdGhlIGZpbGUgc2hvdWxkIGJlIGNhY2hlZCBvciBub3Rcbi8vIC0gc291cmNlTWFwVXJsOiBvcHRpb25hbGx5LCB0aGUgdXJsIG9mIHRoZSBzb3VyY2UgbWFwXG4vL1xuLy8gSW5mbyBhbHNvIGNvbnRhaW5zIG9uZSBvZiB0aGUgZm9sbG93aW5nOlxuLy8gLSBjb250ZW50OiB0aGUgc3RyaW5naWZpZWQgY29udGVudCB0aGF0IHNob3VsZCBiZSBzZXJ2ZWQgYXQgdGhpcyBwYXRoXG4vLyAtIGFic29sdXRlUGF0aDogdGhlIGFic29sdXRlIHBhdGggb24gZGlzayB0byB0aGUgZmlsZVxuXG52YXIgc3RhdGljRmlsZXNCeUFyY2g7XG5cbi8vIFNlcnZlIHN0YXRpYyBmaWxlcyBmcm9tIHRoZSBtYW5pZmVzdCBvciBhZGRlZCB3aXRoXG4vLyBgYWRkU3RhdGljSnNgLiBFeHBvcnRlZCBmb3IgdGVzdHMuXG5XZWJBcHBJbnRlcm5hbHMuc3RhdGljRmlsZXNNaWRkbGV3YXJlID0gYXN5bmMgZnVuY3Rpb24gKFxuICBzdGF0aWNGaWxlc0J5QXJjaCxcbiAgcmVxLFxuICByZXMsXG4gIG5leHQsXG4pIHtcbiAgaWYgKCdHRVQnICE9IHJlcS5tZXRob2QgJiYgJ0hFQUQnICE9IHJlcS5tZXRob2QgJiYgJ09QVElPTlMnICE9IHJlcS5tZXRob2QpIHtcbiAgICBuZXh0KCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBwYXRobmFtZSA9IHBhcnNlUmVxdWVzdChyZXEpLnBhdGhuYW1lO1xuICB0cnkge1xuICAgIHBhdGhuYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhdGhuYW1lKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIG5leHQoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgc2VydmVTdGF0aWNKcyA9IGZ1bmN0aW9uIChzKSB7XG4gICAgcmVzLndyaXRlSGVhZCgyMDAsIHtcbiAgICAgICdDb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24vamF2YXNjcmlwdDsgY2hhcnNldD1VVEYtOCdcbiAgICB9KTtcbiAgICByZXMud3JpdGUocyk7XG4gICAgcmVzLmVuZCgpO1xuICB9O1xuXG4gIGlmIChfLmhhcyhhZGRpdGlvbmFsU3RhdGljSnMsIHBhdGhuYW1lKSAmJlxuICAgICAgICAgICAgICAhIFdlYkFwcEludGVybmFscy5pbmxpbmVTY3JpcHRzQWxsb3dlZCgpKSB7XG4gICAgc2VydmVTdGF0aWNKcyhhZGRpdGlvbmFsU3RhdGljSnNbcGF0aG5hbWVdKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCB7IGFyY2gsIHBhdGggfSA9IGdldEFyY2hBbmRQYXRoKFxuICAgIHBhdGhuYW1lLFxuICAgIGlkZW50aWZ5QnJvd3NlcihyZXEuaGVhZGVyc1tcInVzZXItYWdlbnRcIl0pLFxuICApO1xuXG4gIC8vIElmIHBhdXNlQ2xpZW50KGFyY2gpIGhhcyBiZWVuIGNhbGxlZCwgcHJvZ3JhbS5wYXVzZWQgd2lsbCBiZSBhXG4gIC8vIFByb21pc2UgdGhhdCB3aWxsIGJlIHJlc29sdmVkIHdoZW4gdGhlIHByb2dyYW0gaXMgdW5wYXVzZWQuXG4gIGNvbnN0IHByb2dyYW0gPSBXZWJBcHAuY2xpZW50UHJvZ3JhbXNbYXJjaF07XG4gIGF3YWl0IHByb2dyYW0ucGF1c2VkO1xuXG4gIGlmIChwYXRoID09PSBcIi9tZXRlb3JfcnVudGltZV9jb25maWcuanNcIiAmJlxuICAgICAgISBXZWJBcHBJbnRlcm5hbHMuaW5saW5lU2NyaXB0c0FsbG93ZWQoKSkge1xuICAgIHNlcnZlU3RhdGljSnMoYF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18gPSAke3Byb2dyYW0ubWV0ZW9yUnVudGltZUNvbmZpZ307YCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgaW5mbyA9IGdldFN0YXRpY0ZpbGVJbmZvKHBhdGhuYW1lLCBwYXRoLCBhcmNoKTtcbiAgaWYgKCEgaW5mbykge1xuICAgIG5leHQoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBXZSBkb24ndCBuZWVkIHRvIGNhbGwgcGF1c2UgYmVjYXVzZSwgdW5saWtlICdzdGF0aWMnLCBvbmNlIHdlIGNhbGwgaW50b1xuICAvLyAnc2VuZCcgYW5kIHlpZWxkIHRvIHRoZSBldmVudCBsb29wLCB3ZSBuZXZlciBjYWxsIGFub3RoZXIgaGFuZGxlciB3aXRoXG4gIC8vICduZXh0Jy5cblxuICAvLyBDYWNoZWFibGUgZmlsZXMgYXJlIGZpbGVzIHRoYXQgc2hvdWxkIG5ldmVyIGNoYW5nZS4gVHlwaWNhbGx5XG4gIC8vIG5hbWVkIGJ5IHRoZWlyIGhhc2ggKGVnIG1ldGVvciBidW5kbGVkIGpzIGFuZCBjc3MgZmlsZXMpLlxuICAvLyBXZSBjYWNoZSB0aGVtIH5mb3JldmVyICgxeXIpLlxuICBjb25zdCBtYXhBZ2UgPSBpbmZvLmNhY2hlYWJsZVxuICAgID8gMTAwMCAqIDYwICogNjAgKiAyNCAqIDM2NVxuICAgIDogMDtcblxuICBpZiAoaW5mby5jYWNoZWFibGUpIHtcbiAgICAvLyBTaW5jZSB3ZSB1c2UgcmVxLmhlYWRlcnNbXCJ1c2VyLWFnZW50XCJdIHRvIGRldGVybWluZSB3aGV0aGVyIHRoZVxuICAgIC8vIGNsaWVudCBzaG91bGQgcmVjZWl2ZSBtb2Rlcm4gb3IgbGVnYWN5IHJlc291cmNlcywgdGVsbCB0aGUgY2xpZW50XG4gICAgLy8gdG8gaW52YWxpZGF0ZSBjYWNoZWQgcmVzb3VyY2VzIHdoZW4vaWYgaXRzIHVzZXIgYWdlbnQgc3RyaW5nXG4gICAgLy8gY2hhbmdlcyBpbiB0aGUgZnV0dXJlLlxuICAgIHJlcy5zZXRIZWFkZXIoXCJWYXJ5XCIsIFwiVXNlci1BZ2VudFwiKTtcbiAgfVxuXG4gIC8vIFNldCB0aGUgWC1Tb3VyY2VNYXAgaGVhZGVyLCB3aGljaCBjdXJyZW50IENocm9tZSwgRmlyZUZveCwgYW5kIFNhZmFyaVxuICAvLyB1bmRlcnN0YW5kLiAgKFRoZSBTb3VyY2VNYXAgaGVhZGVyIGlzIHNsaWdodGx5IG1vcmUgc3BlYy1jb3JyZWN0IGJ1dCBGRlxuICAvLyBkb2Vzbid0IHVuZGVyc3RhbmQgaXQuKVxuICAvL1xuICAvLyBZb3UgbWF5IGFsc28gbmVlZCB0byBlbmFibGUgc291cmNlIG1hcHMgaW4gQ2hyb21lOiBvcGVuIGRldiB0b29scywgY2xpY2tcbiAgLy8gdGhlIGdlYXIgaW4gdGhlIGJvdHRvbSByaWdodCBjb3JuZXIsIGFuZCBzZWxlY3QgXCJlbmFibGUgc291cmNlIG1hcHNcIi5cbiAgaWYgKGluZm8uc291cmNlTWFwVXJsKSB7XG4gICAgcmVzLnNldEhlYWRlcignWC1Tb3VyY2VNYXAnLFxuICAgICAgICAgICAgICAgICAgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ST09UX1VSTF9QQVRIX1BSRUZJWCArXG4gICAgICAgICAgICAgICAgICBpbmZvLnNvdXJjZU1hcFVybCk7XG4gIH1cblxuICBpZiAoaW5mby50eXBlID09PSBcImpzXCIgfHxcbiAgICAgIGluZm8udHlwZSA9PT0gXCJkeW5hbWljIGpzXCIpIHtcbiAgICByZXMuc2V0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vamF2YXNjcmlwdDsgY2hhcnNldD1VVEYtOFwiKTtcbiAgfSBlbHNlIGlmIChpbmZvLnR5cGUgPT09IFwiY3NzXCIpIHtcbiAgICByZXMuc2V0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwidGV4dC9jc3M7IGNoYXJzZXQ9VVRGLThcIik7XG4gIH0gZWxzZSBpZiAoaW5mby50eXBlID09PSBcImpzb25cIikge1xuICAgIHJlcy5zZXRIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PVVURi04XCIpO1xuICB9XG5cbiAgaWYgKGluZm8uaGFzaCkge1xuICAgIHJlcy5zZXRIZWFkZXIoJ0VUYWcnLCAnXCInICsgaW5mby5oYXNoICsgJ1wiJyk7XG4gIH1cblxuICBpZiAoaW5mby5jb250ZW50KSB7XG4gICAgcmVzLndyaXRlKGluZm8uY29udGVudCk7XG4gICAgcmVzLmVuZCgpO1xuICB9IGVsc2Uge1xuICAgIHNlbmQocmVxLCBpbmZvLmFic29sdXRlUGF0aCwge1xuICAgICAgbWF4YWdlOiBtYXhBZ2UsXG4gICAgICBkb3RmaWxlczogJ2FsbG93JywgLy8gaWYgd2Ugc3BlY2lmaWVkIGEgZG90ZmlsZSBpbiB0aGUgbWFuaWZlc3QsIHNlcnZlIGl0XG4gICAgICBsYXN0TW9kaWZpZWQ6IGZhbHNlIC8vIGRvbid0IHNldCBsYXN0LW1vZGlmaWVkIGJhc2VkIG9uIHRoZSBmaWxlIGRhdGVcbiAgICB9KS5vbignZXJyb3InLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBMb2cuZXJyb3IoXCJFcnJvciBzZXJ2aW5nIHN0YXRpYyBmaWxlIFwiICsgZXJyKTtcbiAgICAgIHJlcy53cml0ZUhlYWQoNTAwKTtcbiAgICAgIHJlcy5lbmQoKTtcbiAgICB9KS5vbignZGlyZWN0b3J5JywgZnVuY3Rpb24gKCkge1xuICAgICAgTG9nLmVycm9yKFwiVW5leHBlY3RlZCBkaXJlY3RvcnkgXCIgKyBpbmZvLmFic29sdXRlUGF0aCk7XG4gICAgICByZXMud3JpdGVIZWFkKDUwMCk7XG4gICAgICByZXMuZW5kKCk7XG4gICAgfSkucGlwZShyZXMpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBnZXRTdGF0aWNGaWxlSW5mbyhvcmlnaW5hbFBhdGgsIHBhdGgsIGFyY2gpIHtcbiAgaWYgKCEgaGFzT3duLmNhbGwoV2ViQXBwLmNsaWVudFByb2dyYW1zLCBhcmNoKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gR2V0IGEgbGlzdCBvZiBhbGwgYXZhaWxhYmxlIHN0YXRpYyBmaWxlIGFyY2hpdGVjdHVyZXMsIHdpdGggYXJjaFxuICAvLyBmaXJzdCBpbiB0aGUgbGlzdCBpZiBpdCBleGlzdHMuXG4gIGNvbnN0IHN0YXRpY0FyY2hMaXN0ID0gT2JqZWN0LmtleXMoc3RhdGljRmlsZXNCeUFyY2gpO1xuICBjb25zdCBhcmNoSW5kZXggPSBzdGF0aWNBcmNoTGlzdC5pbmRleE9mKGFyY2gpO1xuICBpZiAoYXJjaEluZGV4ID4gMCkge1xuICAgIHN0YXRpY0FyY2hMaXN0LnVuc2hpZnQoc3RhdGljQXJjaExpc3Quc3BsaWNlKGFyY2hJbmRleCwgMSlbMF0pO1xuICB9XG5cbiAgbGV0IGluZm8gPSBudWxsO1xuXG4gIHN0YXRpY0FyY2hMaXN0LnNvbWUoYXJjaCA9PiB7XG4gICAgY29uc3Qgc3RhdGljRmlsZXMgPSBzdGF0aWNGaWxlc0J5QXJjaFthcmNoXTtcblxuICAgIGZ1bmN0aW9uIGZpbmFsaXplKHBhdGgpIHtcbiAgICAgIGluZm8gPSBzdGF0aWNGaWxlc1twYXRoXTtcbiAgICAgIC8vIFNvbWV0aW1lcyB3ZSByZWdpc3RlciBhIGxhenkgZnVuY3Rpb24gaW5zdGVhZCBvZiBhY3R1YWwgZGF0YSBpblxuICAgICAgLy8gdGhlIHN0YXRpY0ZpbGVzIG1hbmlmZXN0LlxuICAgICAgaWYgKHR5cGVvZiBpbmZvID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgaW5mbyA9IHN0YXRpY0ZpbGVzW3BhdGhdID0gaW5mbygpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGluZm87XG4gICAgfVxuXG4gICAgLy8gSWYgc3RhdGljRmlsZXMgY29udGFpbnMgb3JpZ2luYWxQYXRoIHdpdGggdGhlIGFyY2ggaW5mZXJyZWQgYWJvdmUsXG4gICAgLy8gdXNlIHRoYXQgaW5mb3JtYXRpb24uXG4gICAgaWYgKGhhc093bi5jYWxsKHN0YXRpY0ZpbGVzLCBvcmlnaW5hbFBhdGgpKSB7XG4gICAgICByZXR1cm4gZmluYWxpemUob3JpZ2luYWxQYXRoKTtcbiAgICB9XG5cbiAgICAvLyBJZiBnZXRBcmNoQW5kUGF0aCByZXR1cm5lZCBhbiBhbHRlcm5hdGUgcGF0aCwgdHJ5IHRoYXQgaW5zdGVhZC5cbiAgICBpZiAocGF0aCAhPT0gb3JpZ2luYWxQYXRoICYmXG4gICAgICAgIGhhc093bi5jYWxsKHN0YXRpY0ZpbGVzLCBwYXRoKSkge1xuICAgICAgcmV0dXJuIGZpbmFsaXplKHBhdGgpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGluZm87XG59XG5cbmZ1bmN0aW9uIGdldEFyY2hBbmRQYXRoKHBhdGgsIGJyb3dzZXIpIHtcbiAgY29uc3QgcGF0aFBhcnRzID0gcGF0aC5zcGxpdChcIi9cIik7XG4gIGNvbnN0IGFyY2hLZXkgPSBwYXRoUGFydHNbMV07XG5cbiAgaWYgKGFyY2hLZXkuc3RhcnRzV2l0aChcIl9fXCIpKSB7XG4gICAgY29uc3QgYXJjaENsZWFuZWQgPSBcIndlYi5cIiArIGFyY2hLZXkuc2xpY2UoMik7XG4gICAgaWYgKGhhc093bi5jYWxsKFdlYkFwcC5jbGllbnRQcm9ncmFtcywgYXJjaENsZWFuZWQpKSB7XG4gICAgICBwYXRoUGFydHMuc3BsaWNlKDEsIDEpOyAvLyBSZW1vdmUgdGhlIGFyY2hLZXkgcGFydC5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGFyY2g6IGFyY2hDbGVhbmVkLFxuICAgICAgICBwYXRoOiBwYXRoUGFydHMuam9pbihcIi9cIiksXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8vIFRPRE8gUGVyaGFwcyBvbmUgZGF5IHdlIGNvdWxkIGluZmVyIENvcmRvdmEgY2xpZW50cyBoZXJlLCBzbyB0aGF0IHdlXG4gIC8vIHdvdWxkbid0IGhhdmUgdG8gdXNlIHByZWZpeGVkIFwiL19fY29yZG92YS8uLi5cIiBVUkxzLlxuICBjb25zdCBhcmNoID0gaXNNb2Rlcm4oYnJvd3NlcilcbiAgICA/IFwid2ViLmJyb3dzZXJcIlxuICAgIDogXCJ3ZWIuYnJvd3Nlci5sZWdhY3lcIjtcblxuICBpZiAoaGFzT3duLmNhbGwoV2ViQXBwLmNsaWVudFByb2dyYW1zLCBhcmNoKSkge1xuICAgIHJldHVybiB7IGFyY2gsIHBhdGggfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYXJjaDogV2ViQXBwLmRlZmF1bHRBcmNoLFxuICAgIHBhdGgsXG4gIH07XG59XG5cbi8vIFBhcnNlIHRoZSBwYXNzZWQgaW4gcG9ydCB2YWx1ZS4gUmV0dXJuIHRoZSBwb3J0IGFzLWlzIGlmIGl0J3MgYSBTdHJpbmdcbi8vIChlLmcuIGEgV2luZG93cyBTZXJ2ZXIgc3R5bGUgbmFtZWQgcGlwZSksIG90aGVyd2lzZSByZXR1cm4gdGhlIHBvcnQgYXMgYW5cbi8vIGludGVnZXIuXG4vL1xuLy8gREVQUkVDQVRFRDogRGlyZWN0IHVzZSBvZiB0aGlzIGZ1bmN0aW9uIGlzIG5vdCByZWNvbW1lbmRlZDsgaXQgaXMgbm9cbi8vIGxvbmdlciB1c2VkIGludGVybmFsbHksIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gYSBmdXR1cmUgcmVsZWFzZS5cbldlYkFwcEludGVybmFscy5wYXJzZVBvcnQgPSBwb3J0ID0+IHtcbiAgbGV0IHBhcnNlZFBvcnQgPSBwYXJzZUludChwb3J0KTtcbiAgaWYgKE51bWJlci5pc05hTihwYXJzZWRQb3J0KSkge1xuICAgIHBhcnNlZFBvcnQgPSBwb3J0O1xuICB9XG4gIHJldHVybiBwYXJzZWRQb3J0O1xufVxuXG5pbXBvcnQgeyBvbk1lc3NhZ2UgfSBmcm9tIFwibWV0ZW9yL2ludGVyLXByb2Nlc3MtbWVzc2FnaW5nXCI7XG5cbm9uTWVzc2FnZShcIndlYmFwcC1wYXVzZS1jbGllbnRcIiwgYXN5bmMgKHsgYXJjaCB9KSA9PiB7XG4gIFdlYkFwcEludGVybmFscy5wYXVzZUNsaWVudChhcmNoKTtcbn0pO1xuXG5vbk1lc3NhZ2UoXCJ3ZWJhcHAtcmVsb2FkLWNsaWVudFwiLCBhc3luYyAoeyBhcmNoIH0pID0+IHtcbiAgV2ViQXBwSW50ZXJuYWxzLmdlbmVyYXRlQ2xpZW50UHJvZ3JhbShhcmNoKTtcbn0pO1xuXG5mdW5jdGlvbiBydW5XZWJBcHBTZXJ2ZXIoKSB7XG4gIHZhciBzaHV0dGluZ0Rvd24gPSBmYWxzZTtcbiAgdmFyIHN5bmNRdWV1ZSA9IG5ldyBNZXRlb3IuX1N5bmNocm9ub3VzUXVldWUoKTtcblxuICB2YXIgZ2V0SXRlbVBhdGhuYW1lID0gZnVuY3Rpb24gKGl0ZW1VcmwpIHtcbiAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHBhcnNlVXJsKGl0ZW1VcmwpLnBhdGhuYW1lKTtcbiAgfTtcblxuICBXZWJBcHBJbnRlcm5hbHMucmVsb2FkQ2xpZW50UHJvZ3JhbXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgc3luY1F1ZXVlLnJ1blRhc2soZnVuY3Rpb24oKSB7XG4gICAgICBzdGF0aWNGaWxlc0J5QXJjaCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgICAgIGNvbnN0IHsgY29uZmlnSnNvbiB9ID0gX19tZXRlb3JfYm9vdHN0cmFwX187XG4gICAgICBjb25zdCBjbGllbnRBcmNocyA9IGNvbmZpZ0pzb24uY2xpZW50QXJjaHMgfHxcbiAgICAgICAgT2JqZWN0LmtleXMoY29uZmlnSnNvbi5jbGllbnRQYXRocyk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNsaWVudEFyY2hzLmZvckVhY2goZ2VuZXJhdGVDbGllbnRQcm9ncmFtKTtcbiAgICAgICAgV2ViQXBwSW50ZXJuYWxzLnN0YXRpY0ZpbGVzQnlBcmNoID0gc3RhdGljRmlsZXNCeUFyY2g7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIExvZy5lcnJvcihcIkVycm9yIHJlbG9hZGluZyB0aGUgY2xpZW50IHByb2dyYW06IFwiICsgZS5zdGFjayk7XG4gICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICAvLyBQYXVzZSBhbnkgaW5jb21pbmcgcmVxdWVzdHMgYW5kIG1ha2UgdGhlbSB3YWl0IGZvciB0aGUgcHJvZ3JhbSB0byBiZVxuICAvLyB1bnBhdXNlZCB0aGUgbmV4dCB0aW1lIGdlbmVyYXRlQ2xpZW50UHJvZ3JhbShhcmNoKSBpcyBjYWxsZWQuXG4gIFdlYkFwcEludGVybmFscy5wYXVzZUNsaWVudCA9IGZ1bmN0aW9uIChhcmNoKSB7XG4gICAgc3luY1F1ZXVlLnJ1blRhc2soKCkgPT4ge1xuICAgICAgY29uc3QgcHJvZ3JhbSA9IFdlYkFwcC5jbGllbnRQcm9ncmFtc1thcmNoXTtcbiAgICAgIGNvbnN0IHsgdW5wYXVzZSB9ID0gcHJvZ3JhbTtcbiAgICAgIHByb2dyYW0ucGF1c2VkID0gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgdW5wYXVzZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgLy8gSWYgdGhlcmUgaGFwcGVucyB0byBiZSBhbiBleGlzdGluZyBwcm9ncmFtLnVucGF1c2UgZnVuY3Rpb24sXG4gICAgICAgICAgLy8gY29tcG9zZSBpdCB3aXRoIHRoZSByZXNvbHZlIGZ1bmN0aW9uLlxuICAgICAgICAgIHByb2dyYW0udW5wYXVzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHVucGF1c2UoKTtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHByb2dyYW0udW5wYXVzZSA9IHJlc29sdmU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIFdlYkFwcEludGVybmFscy5nZW5lcmF0ZUNsaWVudFByb2dyYW0gPSBmdW5jdGlvbiAoYXJjaCkge1xuICAgIHN5bmNRdWV1ZS5ydW5UYXNrKCgpID0+IGdlbmVyYXRlQ2xpZW50UHJvZ3JhbShhcmNoKSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2VuZXJhdGVDbGllbnRQcm9ncmFtKGFyY2gpIHtcbiAgICBjb25zdCBjbGllbnREaXIgPSBwYXRoSm9pbihcbiAgICAgIHBhdGhEaXJuYW1lKF9fbWV0ZW9yX2Jvb3RzdHJhcF9fLnNlcnZlckRpciksXG4gICAgICBhcmNoLFxuICAgICk7XG5cbiAgICAvLyByZWFkIHRoZSBjb250cm9sIGZvciB0aGUgY2xpZW50IHdlJ2xsIGJlIHNlcnZpbmcgdXBcbiAgICBjb25zdCBwcm9ncmFtSnNvblBhdGggPSBwYXRoSm9pbihjbGllbnREaXIsIFwicHJvZ3JhbS5qc29uXCIpO1xuXG4gICAgbGV0IHByb2dyYW1Kc29uO1xuICAgIHRyeSB7XG4gICAgICBwcm9ncmFtSnNvbiA9IEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKHByb2dyYW1Kc29uUGF0aCkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlLmNvZGUgPT09IFwiRU5PRU5UXCIpIHJldHVybjtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuXG4gICAgaWYgKHByb2dyYW1Kc29uLmZvcm1hdCAhPT0gXCJ3ZWItcHJvZ3JhbS1wcmUxXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuc3VwcG9ydGVkIGZvcm1hdCBmb3IgY2xpZW50IGFzc2V0czogXCIgK1xuICAgICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHByb2dyYW1Kc29uLmZvcm1hdCkpO1xuICAgIH1cblxuICAgIGlmICghIHByb2dyYW1Kc29uUGF0aCB8fCAhIGNsaWVudERpciB8fCAhIHByb2dyYW1Kc29uKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDbGllbnQgY29uZmlnIGZpbGUgbm90IHBhcnNlZC5cIik7XG4gICAgfVxuXG4gICAgYXJjaFBhdGhbYXJjaF0gPSBjbGllbnREaXI7XG4gICAgY29uc3Qgc3RhdGljRmlsZXMgPSBzdGF0aWNGaWxlc0J5QXJjaFthcmNoXSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgICBjb25zdCB7IG1hbmlmZXN0IH0gPSBwcm9ncmFtSnNvbjtcbiAgICBtYW5pZmVzdC5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgaWYgKGl0ZW0udXJsICYmIGl0ZW0ud2hlcmUgPT09IFwiY2xpZW50XCIpIHtcbiAgICAgICAgc3RhdGljRmlsZXNbZ2V0SXRlbVBhdGhuYW1lKGl0ZW0udXJsKV0gPSB7XG4gICAgICAgICAgYWJzb2x1dGVQYXRoOiBwYXRoSm9pbihjbGllbnREaXIsIGl0ZW0ucGF0aCksXG4gICAgICAgICAgY2FjaGVhYmxlOiBpdGVtLmNhY2hlYWJsZSxcbiAgICAgICAgICBoYXNoOiBpdGVtLmhhc2gsXG4gICAgICAgICAgLy8gTGluayBmcm9tIHNvdXJjZSB0byBpdHMgbWFwXG4gICAgICAgICAgc291cmNlTWFwVXJsOiBpdGVtLnNvdXJjZU1hcFVybCxcbiAgICAgICAgICB0eXBlOiBpdGVtLnR5cGVcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoaXRlbS5zb3VyY2VNYXApIHtcbiAgICAgICAgICAvLyBTZXJ2ZSB0aGUgc291cmNlIG1hcCB0b28sIHVuZGVyIHRoZSBzcGVjaWZpZWQgVVJMLiBXZSBhc3N1bWVcbiAgICAgICAgICAvLyBhbGwgc291cmNlIG1hcHMgYXJlIGNhY2hlYWJsZS5cbiAgICAgICAgICBzdGF0aWNGaWxlc1tnZXRJdGVtUGF0aG5hbWUoaXRlbS5zb3VyY2VNYXBVcmwpXSA9IHtcbiAgICAgICAgICAgIGFic29sdXRlUGF0aDogcGF0aEpvaW4oY2xpZW50RGlyLCBpdGVtLnNvdXJjZU1hcCksXG4gICAgICAgICAgICBjYWNoZWFibGU6IHRydWVcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCB7IFBVQkxJQ19TRVRUSU5HUyB9ID0gX19tZXRlb3JfcnVudGltZV9jb25maWdfXztcbiAgICBjb25zdCBjb25maWdPdmVycmlkZXMgPSB7XG4gICAgICBQVUJMSUNfU0VUVElOR1MsXG4gICAgICAvLyBTaW5jZSB0aGUgbWluaW11bSBtb2Rlcm4gdmVyc2lvbnMgZGVmaW5lZCBpbiB0aGUgbW9kZXJuLXZlcnNpb25zXG4gICAgICAvLyBwYWNrYWdlIGFmZmVjdCB3aGljaCBidW5kbGUgYSBnaXZlbiBjbGllbnQgcmVjZWl2ZXMsIGFueSBjaGFuZ2VzXG4gICAgICAvLyBpbiB0aG9zZSB2ZXJzaW9ucyBzaG91bGQgdHJpZ2dlciBhIGNvcnJlc3BvbmRpbmcgY2hhbmdlIGluIHRoZVxuICAgICAgLy8gdmVyc2lvbnMgY2FsY3VsYXRlZCBiZWxvdy5cbiAgICAgIG1pbmltdW1Nb2Rlcm5WZXJzaW9uc0hhc2g6IGNhbGN1bGF0ZUhhc2hPZk1pbmltdW1WZXJzaW9ucygpLFxuICAgIH07XG5cbiAgICBjb25zdCBvbGRQcm9ncmFtID0gV2ViQXBwLmNsaWVudFByb2dyYW1zW2FyY2hdO1xuICAgIGNvbnN0IG5ld1Byb2dyYW0gPSBXZWJBcHAuY2xpZW50UHJvZ3JhbXNbYXJjaF0gPSB7XG4gICAgICBmb3JtYXQ6IFwid2ViLXByb2dyYW0tcHJlMVwiLFxuICAgICAgbWFuaWZlc3Q6IG1hbmlmZXN0LFxuICAgICAgLy8gVXNlIGFycm93IGZ1bmN0aW9ucyBzbyB0aGF0IHRoZXNlIHZlcnNpb25zIGNhbiBiZSBsYXppbHlcbiAgICAgIC8vIGNhbGN1bGF0ZWQgbGF0ZXIsIGFuZCBzbyB0aGF0IHRoZXkgd2lsbCBub3QgYmUgaW5jbHVkZWQgaW4gdGhlXG4gICAgICAvLyBzdGF0aWNGaWxlc1ttYW5pZmVzdFVybF0uY29udGVudCBzdHJpbmcgYmVsb3cuXG4gICAgICB2ZXJzaW9uOiAoKSA9PiBXZWJBcHBIYXNoaW5nLmNhbGN1bGF0ZUNsaWVudEhhc2goXG4gICAgICAgIG1hbmlmZXN0LCBudWxsLCBjb25maWdPdmVycmlkZXMpLFxuICAgICAgdmVyc2lvblJlZnJlc2hhYmxlOiAoKSA9PiBXZWJBcHBIYXNoaW5nLmNhbGN1bGF0ZUNsaWVudEhhc2goXG4gICAgICAgIG1hbmlmZXN0LCB0eXBlID0+IHR5cGUgPT09IFwiY3NzXCIsIGNvbmZpZ092ZXJyaWRlcyksXG4gICAgICB2ZXJzaW9uTm9uUmVmcmVzaGFibGU6ICgpID0+IFdlYkFwcEhhc2hpbmcuY2FsY3VsYXRlQ2xpZW50SGFzaChcbiAgICAgICAgbWFuaWZlc3QsIHR5cGUgPT4gdHlwZSAhPT0gXCJjc3NcIiwgY29uZmlnT3ZlcnJpZGVzKSxcbiAgICAgIGNvcmRvdmFDb21wYXRpYmlsaXR5VmVyc2lvbnM6IHByb2dyYW1Kc29uLmNvcmRvdmFDb21wYXRpYmlsaXR5VmVyc2lvbnMsXG4gICAgICBQVUJMSUNfU0VUVElOR1MsXG4gICAgfTtcblxuICAgIC8vIEV4cG9zZSBwcm9ncmFtIGRldGFpbHMgYXMgYSBzdHJpbmcgcmVhY2hhYmxlIHZpYSB0aGUgZm9sbG93aW5nIFVSTC5cbiAgICBjb25zdCBtYW5pZmVzdFVybFByZWZpeCA9IFwiL19fXCIgKyBhcmNoLnJlcGxhY2UoL153ZWJcXC4vLCBcIlwiKTtcbiAgICBjb25zdCBtYW5pZmVzdFVybCA9IG1hbmlmZXN0VXJsUHJlZml4ICsgZ2V0SXRlbVBhdGhuYW1lKFwiL21hbmlmZXN0Lmpzb25cIik7XG5cbiAgICBzdGF0aWNGaWxlc1ttYW5pZmVzdFVybF0gPSAoKSA9PiB7XG4gICAgICBpZiAoUGFja2FnZS5hdXRvdXBkYXRlKSB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICBBVVRPVVBEQVRFX1ZFUlNJT04gPVxuICAgICAgICAgICAgUGFja2FnZS5hdXRvdXBkYXRlLkF1dG91cGRhdGUuYXV0b3VwZGF0ZVZlcnNpb25cbiAgICAgICAgfSA9IHByb2Nlc3MuZW52O1xuXG4gICAgICAgIGlmIChBVVRPVVBEQVRFX1ZFUlNJT04pIHtcbiAgICAgICAgICBuZXdQcm9ncmFtLnZlcnNpb24gPSBBVVRPVVBEQVRFX1ZFUlNJT047XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBuZXdQcm9ncmFtLnZlcnNpb24gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBuZXdQcm9ncmFtLnZlcnNpb24gPSBuZXdQcm9ncmFtLnZlcnNpb24oKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29udGVudDogSlNPTi5zdHJpbmdpZnkobmV3UHJvZ3JhbSksXG4gICAgICAgIGNhY2hlYWJsZTogZmFsc2UsXG4gICAgICAgIGhhc2g6IG5ld1Byb2dyYW0udmVyc2lvbixcbiAgICAgICAgdHlwZTogXCJqc29uXCJcbiAgICAgIH07XG4gICAgfTtcblxuICAgIGdlbmVyYXRlQm9pbGVycGxhdGVGb3JBcmNoKGFyY2gpO1xuXG4gICAgLy8gSWYgdGhlcmUgYXJlIGFueSByZXF1ZXN0cyB3YWl0aW5nIG9uIG9sZFByb2dyYW0ucGF1c2VkLCBsZXQgdGhlbVxuICAgIC8vIGNvbnRpbnVlIG5vdyAodXNpbmcgdGhlIG5ldyBwcm9ncmFtKS5cbiAgICBpZiAob2xkUHJvZ3JhbSAmJlxuICAgICAgICBvbGRQcm9ncmFtLnBhdXNlZCkge1xuICAgICAgb2xkUHJvZ3JhbS51bnBhdXNlKCk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGRlZmF1bHRPcHRpb25zRm9yQXJjaCA9IHtcbiAgICAnd2ViLmNvcmRvdmEnOiB7XG4gICAgICBydW50aW1lQ29uZmlnT3ZlcnJpZGVzOiB7XG4gICAgICAgIC8vIFhYWCBXZSB1c2UgYWJzb2x1dGVVcmwoKSBoZXJlIHNvIHRoYXQgd2Ugc2VydmUgaHR0cHM6Ly9cbiAgICAgICAgLy8gVVJMcyB0byBjb3Jkb3ZhIGNsaWVudHMgaWYgZm9yY2Utc3NsIGlzIGluIHVzZS4gSWYgd2Ugd2VyZVxuICAgICAgICAvLyB0byB1c2UgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ST09UX1VSTCBpbnN0ZWFkIG9mXG4gICAgICAgIC8vIGFic29sdXRlVXJsKCksIHRoZW4gQ29yZG92YSBjbGllbnRzIHdvdWxkIGltbWVkaWF0ZWx5IGdldCBhXG4gICAgICAgIC8vIEhDUCBzZXR0aW5nIHRoZWlyIEREUF9ERUZBVUxUX0NPTk5FQ1RJT05fVVJMIHRvXG4gICAgICAgIC8vIGh0dHA6Ly9leGFtcGxlLm1ldGVvci5jb20uIFRoaXMgYnJlYWtzIHRoZSBhcHAsIGJlY2F1c2VcbiAgICAgICAgLy8gZm9yY2Utc3NsIGRvZXNuJ3Qgc2VydmUgQ09SUyBoZWFkZXJzIG9uIDMwMlxuICAgICAgICAvLyByZWRpcmVjdHMuIChQbHVzIGl0J3MgdW5kZXNpcmFibGUgdG8gaGF2ZSBjbGllbnRzXG4gICAgICAgIC8vIGNvbm5lY3RpbmcgdG8gaHR0cDovL2V4YW1wbGUubWV0ZW9yLmNvbSB3aGVuIGZvcmNlLXNzbCBpc1xuICAgICAgICAvLyBpbiB1c2UuKVxuICAgICAgICBERFBfREVGQVVMVF9DT05ORUNUSU9OX1VSTDogcHJvY2Vzcy5lbnYuTU9CSUxFX0REUF9VUkwgfHxcbiAgICAgICAgICBNZXRlb3IuYWJzb2x1dGVVcmwoKSxcbiAgICAgICAgUk9PVF9VUkw6IHByb2Nlc3MuZW52Lk1PQklMRV9ST09UX1VSTCB8fFxuICAgICAgICAgIE1ldGVvci5hYnNvbHV0ZVVybCgpXG4gICAgICB9XG4gICAgfSxcblxuICAgIFwid2ViLmJyb3dzZXJcIjoge1xuICAgICAgcnVudGltZUNvbmZpZ092ZXJyaWRlczoge1xuICAgICAgICBpc01vZGVybjogdHJ1ZSxcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgXCJ3ZWIuYnJvd3Nlci5sZWdhY3lcIjoge1xuICAgICAgcnVudGltZUNvbmZpZ092ZXJyaWRlczoge1xuICAgICAgICBpc01vZGVybjogZmFsc2UsXG4gICAgICB9XG4gICAgfSxcbiAgfTtcblxuICBXZWJBcHBJbnRlcm5hbHMuZ2VuZXJhdGVCb2lsZXJwbGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBUaGlzIGJvaWxlcnBsYXRlIHdpbGwgYmUgc2VydmVkIHRvIHRoZSBtb2JpbGUgZGV2aWNlcyB3aGVuIHVzZWQgd2l0aFxuICAgIC8vIE1ldGVvci9Db3Jkb3ZhIGZvciB0aGUgSG90LUNvZGUgUHVzaCBhbmQgc2luY2UgdGhlIGZpbGUgd2lsbCBiZSBzZXJ2ZWQgYnlcbiAgICAvLyB0aGUgZGV2aWNlJ3Mgc2VydmVyLCBpdCBpcyBpbXBvcnRhbnQgdG8gc2V0IHRoZSBERFAgdXJsIHRvIHRoZSBhY3R1YWxcbiAgICAvLyBNZXRlb3Igc2VydmVyIGFjY2VwdGluZyBERFAgY29ubmVjdGlvbnMgYW5kIG5vdCB0aGUgZGV2aWNlJ3MgZmlsZSBzZXJ2ZXIuXG4gICAgc3luY1F1ZXVlLnJ1blRhc2soZnVuY3Rpb24oKSB7XG4gICAgICBPYmplY3Qua2V5cyhXZWJBcHAuY2xpZW50UHJvZ3JhbXMpXG4gICAgICAgIC5mb3JFYWNoKGdlbmVyYXRlQm9pbGVycGxhdGVGb3JBcmNoKTtcbiAgICB9KTtcbiAgfTtcblxuICBmdW5jdGlvbiBnZW5lcmF0ZUJvaWxlcnBsYXRlRm9yQXJjaChhcmNoKSB7XG4gICAgY29uc3QgcHJvZ3JhbSA9IFdlYkFwcC5jbGllbnRQcm9ncmFtc1thcmNoXTtcbiAgICBjb25zdCBhZGRpdGlvbmFsT3B0aW9ucyA9IGRlZmF1bHRPcHRpb25zRm9yQXJjaFthcmNoXSB8fCB7fTtcbiAgICBjb25zdCB7IGJhc2VEYXRhIH0gPSBib2lsZXJwbGF0ZUJ5QXJjaFthcmNoXSA9XG4gICAgICBXZWJBcHBJbnRlcm5hbHMuZ2VuZXJhdGVCb2lsZXJwbGF0ZUluc3RhbmNlKFxuICAgICAgICBhcmNoLFxuICAgICAgICBwcm9ncmFtLm1hbmlmZXN0LFxuICAgICAgICBhZGRpdGlvbmFsT3B0aW9ucyxcbiAgICAgICk7XG4gICAgLy8gV2UgbmVlZCB0aGUgcnVudGltZSBjb25maWcgd2l0aCBvdmVycmlkZXMgZm9yIG1ldGVvcl9ydW50aW1lX2NvbmZpZy5qczpcbiAgICBwcm9ncmFtLm1ldGVvclJ1bnRpbWVDb25maWcgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAuLi5fX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLFxuICAgICAgLi4uKGFkZGl0aW9uYWxPcHRpb25zLnJ1bnRpbWVDb25maWdPdmVycmlkZXMgfHwgbnVsbCksXG4gICAgfSk7XG4gICAgcHJvZ3JhbS5yZWZyZXNoYWJsZUFzc2V0cyA9IGJhc2VEYXRhLmNzcy5tYXAoZmlsZSA9PiAoe1xuICAgICAgdXJsOiBidW5kbGVkSnNDc3NVcmxSZXdyaXRlSG9vayhmaWxlLnVybCksXG4gICAgfSkpO1xuICB9XG5cbiAgV2ViQXBwSW50ZXJuYWxzLnJlbG9hZENsaWVudFByb2dyYW1zKCk7XG5cbiAgLy8gd2Vic2VydmVyXG4gIHZhciBhcHAgPSBjb25uZWN0KCk7XG5cbiAgLy8gUGFja2FnZXMgYW5kIGFwcHMgY2FuIGFkZCBoYW5kbGVycyB0aGF0IHJ1biBiZWZvcmUgYW55IG90aGVyIE1ldGVvclxuICAvLyBoYW5kbGVycyB2aWEgV2ViQXBwLnJhd0Nvbm5lY3RIYW5kbGVycy5cbiAgdmFyIHJhd0Nvbm5lY3RIYW5kbGVycyA9IGNvbm5lY3QoKTtcbiAgYXBwLnVzZShyYXdDb25uZWN0SGFuZGxlcnMpO1xuXG4gIC8vIEF1dG8tY29tcHJlc3MgYW55IGpzb24sIGphdmFzY3JpcHQsIG9yIHRleHQuXG4gIGFwcC51c2UoY29tcHJlc3MoKSk7XG5cbiAgLy8gcGFyc2UgY29va2llcyBpbnRvIGFuIG9iamVjdFxuICBhcHAudXNlKGNvb2tpZVBhcnNlcigpKTtcblxuICAvLyBXZSdyZSBub3QgYSBwcm94eTsgcmVqZWN0ICh3aXRob3V0IGNyYXNoaW5nKSBhdHRlbXB0cyB0byB0cmVhdCB1cyBsaWtlXG4gIC8vIG9uZS4gKFNlZSAjMTIxMi4pXG4gIGFwcC51c2UoZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgICBpZiAoUm91dGVQb2xpY3kuaXNWYWxpZFVybChyZXEudXJsKSkge1xuICAgICAgbmV4dCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXMud3JpdGVIZWFkKDQwMCk7XG4gICAgcmVzLndyaXRlKFwiTm90IGEgcHJveHlcIik7XG4gICAgcmVzLmVuZCgpO1xuICB9KTtcblxuICAvLyBQYXJzZSB0aGUgcXVlcnkgc3RyaW5nIGludG8gcmVzLnF1ZXJ5LiBVc2VkIGJ5IG9hdXRoX3NlcnZlciwgYnV0IGl0J3NcbiAgLy8gZ2VuZXJhbGx5IHByZXR0eSBoYW5keS4uXG4gIC8vXG4gIC8vIERvIHRoaXMgYmVmb3JlIHRoZSBuZXh0IG1pZGRsZXdhcmUgZGVzdHJveXMgcmVxLnVybCBpZiBhIHBhdGggcHJlZml4XG4gIC8vIGlzIHNldCB0byBjbG9zZSAjMTAxMTEuXG4gIGFwcC51c2UocXVlcnkoKSk7XG5cbiAgZnVuY3Rpb24gZ2V0UGF0aFBhcnRzKHBhdGgpIHtcbiAgICBjb25zdCBwYXJ0cyA9IHBhdGguc3BsaXQoXCIvXCIpO1xuICAgIHdoaWxlIChwYXJ0c1swXSA9PT0gXCJcIikgcGFydHMuc2hpZnQoKTtcbiAgICByZXR1cm4gcGFydHM7XG4gIH1cblxuICBmdW5jdGlvbiBpc1ByZWZpeE9mKHByZWZpeCwgYXJyYXkpIHtcbiAgICByZXR1cm4gcHJlZml4Lmxlbmd0aCA8PSBhcnJheS5sZW5ndGggJiZcbiAgICAgIHByZWZpeC5ldmVyeSgocGFydCwgaSkgPT4gcGFydCA9PT0gYXJyYXlbaV0pO1xuICB9XG5cbiAgLy8gU3RyaXAgb2ZmIHRoZSBwYXRoIHByZWZpeCwgaWYgaXQgZXhpc3RzLlxuICBhcHAudXNlKGZ1bmN0aW9uIChyZXF1ZXN0LCByZXNwb25zZSwgbmV4dCkge1xuICAgIGNvbnN0IHBhdGhQcmVmaXggPSBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLlJPT1RfVVJMX1BBVEhfUFJFRklYO1xuICAgIGNvbnN0IHsgcGF0aG5hbWUgfSA9IHBhcnNlVXJsKHJlcXVlc3QudXJsKTtcblxuICAgIC8vIGNoZWNrIGlmIHRoZSBwYXRoIGluIHRoZSB1cmwgc3RhcnRzIHdpdGggdGhlIHBhdGggcHJlZml4XG4gICAgaWYgKHBhdGhQcmVmaXgpIHtcbiAgICAgIGNvbnN0IHByZWZpeFBhcnRzID0gZ2V0UGF0aFBhcnRzKHBhdGhQcmVmaXgpO1xuICAgICAgY29uc3QgcGF0aFBhcnRzID0gZ2V0UGF0aFBhcnRzKHBhdGhuYW1lKTtcbiAgICAgIGlmIChpc1ByZWZpeE9mKHByZWZpeFBhcnRzLCBwYXRoUGFydHMpKSB7XG4gICAgICAgIHJlcXVlc3QudXJsID0gXCIvXCIgKyBwYXRoUGFydHMuc2xpY2UocHJlZml4UGFydHMubGVuZ3RoKS5qb2luKFwiL1wiKTtcbiAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocGF0aG5hbWUgPT09IFwiL2Zhdmljb24uaWNvXCIgfHxcbiAgICAgICAgcGF0aG5hbWUgPT09IFwiL3JvYm90cy50eHRcIikge1xuICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICB9XG5cbiAgICBpZiAocGF0aFByZWZpeCkge1xuICAgICAgcmVzcG9uc2Uud3JpdGVIZWFkKDQwNCk7XG4gICAgICByZXNwb25zZS53cml0ZShcIlVua25vd24gcGF0aFwiKTtcbiAgICAgIHJlc3BvbnNlLmVuZCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG5leHQoKTtcbiAgfSk7XG5cbiAgLy8gU2VydmUgc3RhdGljIGZpbGVzIGZyb20gdGhlIG1hbmlmZXN0LlxuICAvLyBUaGlzIGlzIGluc3BpcmVkIGJ5IHRoZSAnc3RhdGljJyBtaWRkbGV3YXJlLlxuICBhcHAudXNlKGZ1bmN0aW9uIChyZXEsIHJlcywgbmV4dCkge1xuICAgIFdlYkFwcEludGVybmFscy5zdGF0aWNGaWxlc01pZGRsZXdhcmUoc3RhdGljRmlsZXNCeUFyY2gsIHJlcSwgcmVzLCBuZXh0KTtcbiAgfSk7XG5cbiAgLy8gQ29yZSBNZXRlb3IgcGFja2FnZXMgbGlrZSBkeW5hbWljLWltcG9ydCBjYW4gYWRkIGhhbmRsZXJzIGJlZm9yZVxuICAvLyBvdGhlciBoYW5kbGVycyBhZGRlZCBieSBwYWNrYWdlIGFuZCBhcHBsaWNhdGlvbiBjb2RlLlxuICBhcHAudXNlKFdlYkFwcEludGVybmFscy5tZXRlb3JJbnRlcm5hbEhhbmRsZXJzID0gY29ubmVjdCgpKTtcblxuICAvLyBQYWNrYWdlcyBhbmQgYXBwcyBjYW4gYWRkIGhhbmRsZXJzIHRvIHRoaXMgdmlhIFdlYkFwcC5jb25uZWN0SGFuZGxlcnMuXG4gIC8vIFRoZXkgYXJlIGluc2VydGVkIGJlZm9yZSBvdXIgZGVmYXVsdCBoYW5kbGVyLlxuICB2YXIgcGFja2FnZUFuZEFwcEhhbmRsZXJzID0gY29ubmVjdCgpO1xuICBhcHAudXNlKHBhY2thZ2VBbmRBcHBIYW5kbGVycyk7XG5cbiAgdmFyIHN1cHByZXNzQ29ubmVjdEVycm9ycyA9IGZhbHNlO1xuICAvLyBjb25uZWN0IGtub3dzIGl0IGlzIGFuIGVycm9yIGhhbmRsZXIgYmVjYXVzZSBpdCBoYXMgNCBhcmd1bWVudHMgaW5zdGVhZCBvZlxuICAvLyAzLiBnbyBmaWd1cmUuICAoSXQgaXMgbm90IHNtYXJ0IGVub3VnaCB0byBmaW5kIHN1Y2ggYSB0aGluZyBpZiBpdCdzIGhpZGRlblxuICAvLyBpbnNpZGUgcGFja2FnZUFuZEFwcEhhbmRsZXJzLilcbiAgYXBwLnVzZShmdW5jdGlvbiAoZXJyLCByZXEsIHJlcywgbmV4dCkge1xuICAgIGlmICghZXJyIHx8ICFzdXBwcmVzc0Nvbm5lY3RFcnJvcnMgfHwgIXJlcS5oZWFkZXJzWyd4LXN1cHByZXNzLWVycm9yJ10pIHtcbiAgICAgIG5leHQoZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmVzLndyaXRlSGVhZChlcnIuc3RhdHVzLCB7ICdDb250ZW50LVR5cGUnOiAndGV4dC9wbGFpbicgfSk7XG4gICAgcmVzLmVuZChcIkFuIGVycm9yIG1lc3NhZ2VcIik7XG4gIH0pO1xuXG4gIGFwcC51c2UoYXN5bmMgZnVuY3Rpb24gKHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgaWYgKCEgYXBwVXJsKHJlcS51cmwpKSB7XG4gICAgICByZXR1cm4gbmV4dCgpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBoZWFkZXJzID0ge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ3RleHQvaHRtbDsgY2hhcnNldD11dGYtOCdcbiAgICAgIH07XG5cbiAgICAgIGlmIChzaHV0dGluZ0Rvd24pIHtcbiAgICAgICAgaGVhZGVyc1snQ29ubmVjdGlvbiddID0gJ0Nsb3NlJztcbiAgICAgIH1cblxuICAgICAgdmFyIHJlcXVlc3QgPSBXZWJBcHAuY2F0ZWdvcml6ZVJlcXVlc3QocmVxKTtcblxuICAgICAgaWYgKHJlcXVlc3QudXJsLnF1ZXJ5ICYmIHJlcXVlc3QudXJsLnF1ZXJ5WydtZXRlb3JfY3NzX3Jlc291cmNlJ10pIHtcbiAgICAgICAgLy8gSW4gdGhpcyBjYXNlLCB3ZSdyZSByZXF1ZXN0aW5nIGEgQ1NTIHJlc291cmNlIGluIHRoZSBtZXRlb3Itc3BlY2lmaWNcbiAgICAgICAgLy8gd2F5LCBidXQgd2UgZG9uJ3QgaGF2ZSBpdC4gIFNlcnZlIGEgc3RhdGljIGNzcyBmaWxlIHRoYXQgaW5kaWNhdGVzIHRoYXRcbiAgICAgICAgLy8gd2UgZGlkbid0IGhhdmUgaXQsIHNvIHdlIGNhbiBkZXRlY3QgdGhhdCBhbmQgcmVmcmVzaC4gIE1ha2Ugc3VyZVxuICAgICAgICAvLyB0aGF0IGFueSBwcm94aWVzIG9yIENETnMgZG9uJ3QgY2FjaGUgdGhpcyBlcnJvciEgIChOb3JtYWxseSBwcm94aWVzXG4gICAgICAgIC8vIG9yIENETnMgYXJlIHNtYXJ0IGVub3VnaCBub3QgdG8gY2FjaGUgZXJyb3IgcGFnZXMsIGJ1dCBpbiBvcmRlciB0b1xuICAgICAgICAvLyBtYWtlIHRoaXMgaGFjayB3b3JrLCB3ZSBuZWVkIHRvIHJldHVybiB0aGUgQ1NTIGZpbGUgYXMgYSAyMDAsIHdoaWNoXG4gICAgICAgIC8vIHdvdWxkIG90aGVyd2lzZSBiZSBjYWNoZWQuKVxuICAgICAgICBoZWFkZXJzWydDb250ZW50LVR5cGUnXSA9ICd0ZXh0L2NzczsgY2hhcnNldD11dGYtOCc7XG4gICAgICAgIGhlYWRlcnNbJ0NhY2hlLUNvbnRyb2wnXSA9ICduby1jYWNoZSc7XG4gICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCBoZWFkZXJzKTtcbiAgICAgICAgcmVzLndyaXRlKFwiLm1ldGVvci1jc3Mtbm90LWZvdW5kLWVycm9yIHsgd2lkdGg6IDBweDt9XCIpO1xuICAgICAgICByZXMuZW5kKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlcXVlc3QudXJsLnF1ZXJ5ICYmIHJlcXVlc3QudXJsLnF1ZXJ5WydtZXRlb3JfanNfcmVzb3VyY2UnXSkge1xuICAgICAgICAvLyBTaW1pbGFybHksIHdlJ3JlIHJlcXVlc3RpbmcgYSBKUyByZXNvdXJjZSB0aGF0IHdlIGRvbid0IGhhdmUuXG4gICAgICAgIC8vIFNlcnZlIGFuIHVuY2FjaGVkIDQwNC4gKFdlIGNhbid0IHVzZSB0aGUgc2FtZSBoYWNrIHdlIHVzZSBmb3IgQ1NTLFxuICAgICAgICAvLyBiZWNhdXNlIGFjdHVhbGx5IGFjdGluZyBvbiB0aGF0IGhhY2sgcmVxdWlyZXMgdXMgdG8gaGF2ZSB0aGUgSlNcbiAgICAgICAgLy8gYWxyZWFkeSEpXG4gICAgICAgIGhlYWRlcnNbJ0NhY2hlLUNvbnRyb2wnXSA9ICduby1jYWNoZSc7XG4gICAgICAgIHJlcy53cml0ZUhlYWQoNDA0LCBoZWFkZXJzKTtcbiAgICAgICAgcmVzLmVuZChcIjQwNCBOb3QgRm91bmRcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlcXVlc3QudXJsLnF1ZXJ5ICYmIHJlcXVlc3QudXJsLnF1ZXJ5WydtZXRlb3JfZG9udF9zZXJ2ZV9pbmRleCddKSB7XG4gICAgICAgIC8vIFdoZW4gZG93bmxvYWRpbmcgZmlsZXMgZHVyaW5nIGEgQ29yZG92YSBob3QgY29kZSBwdXNoLCB3ZSBuZWVkXG4gICAgICAgIC8vIHRvIGRldGVjdCBpZiBhIGZpbGUgaXMgbm90IGF2YWlsYWJsZSBpbnN0ZWFkIG9mIGluYWR2ZXJ0ZW50bHlcbiAgICAgICAgLy8gZG93bmxvYWRpbmcgdGhlIGRlZmF1bHQgaW5kZXggcGFnZS5cbiAgICAgICAgLy8gU28gc2ltaWxhciB0byB0aGUgc2l0dWF0aW9uIGFib3ZlLCB3ZSBzZXJ2ZSBhbiB1bmNhY2hlZCA0MDQuXG4gICAgICAgIGhlYWRlcnNbJ0NhY2hlLUNvbnRyb2wnXSA9ICduby1jYWNoZSc7XG4gICAgICAgIHJlcy53cml0ZUhlYWQoNDA0LCBoZWFkZXJzKTtcbiAgICAgICAgcmVzLmVuZChcIjQwNCBOb3QgRm91bmRcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgeyBhcmNoIH0gPSBnZXRBcmNoQW5kUGF0aChcbiAgICAgICAgcGFyc2VSZXF1ZXN0KHJlcSkucGF0aG5hbWUsXG4gICAgICAgIHJlcXVlc3QuYnJvd3NlcixcbiAgICAgICk7XG5cbiAgICAgIC8vIElmIHBhdXNlQ2xpZW50KGFyY2gpIGhhcyBiZWVuIGNhbGxlZCwgcHJvZ3JhbS5wYXVzZWQgd2lsbCBiZSBhXG4gICAgICAvLyBQcm9taXNlIHRoYXQgd2lsbCBiZSByZXNvbHZlZCB3aGVuIHRoZSBwcm9ncmFtIGlzIHVucGF1c2VkLlxuICAgICAgYXdhaXQgV2ViQXBwLmNsaWVudFByb2dyYW1zW2FyY2hdLnBhdXNlZDtcblxuICAgICAgcmV0dXJuIGdldEJvaWxlcnBsYXRlQXN5bmMocmVxdWVzdCwgYXJjaCkudGhlbigoe1xuICAgICAgICBzdHJlYW0sXG4gICAgICAgIHN0YXR1c0NvZGUsXG4gICAgICAgIGhlYWRlcnM6IG5ld0hlYWRlcnMsXG4gICAgICB9KSA9PiB7XG4gICAgICAgIGlmICghc3RhdHVzQ29kZSkge1xuICAgICAgICAgIHN0YXR1c0NvZGUgPSByZXMuc3RhdHVzQ29kZSA/IHJlcy5zdGF0dXNDb2RlIDogMjAwO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5ld0hlYWRlcnMpIHtcbiAgICAgICAgICBPYmplY3QuYXNzaWduKGhlYWRlcnMsIG5ld0hlYWRlcnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzLndyaXRlSGVhZChzdGF0dXNDb2RlLCBoZWFkZXJzKTtcblxuICAgICAgICBzdHJlYW0ucGlwZShyZXMsIHtcbiAgICAgICAgICAvLyBFbmQgdGhlIHJlc3BvbnNlIHdoZW4gdGhlIHN0cmVhbSBlbmRzLlxuICAgICAgICAgIGVuZDogdHJ1ZSxcbiAgICAgICAgfSk7XG5cbiAgICAgIH0pLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgTG9nLmVycm9yKFwiRXJyb3IgcnVubmluZyB0ZW1wbGF0ZTogXCIgKyBlcnJvci5zdGFjayk7XG4gICAgICAgIHJlcy53cml0ZUhlYWQoNTAwLCBoZWFkZXJzKTtcbiAgICAgICAgcmVzLmVuZCgpO1xuICAgICAgfSk7XG4gICAgfVxuICB9KTtcblxuICAvLyBSZXR1cm4gNDA0IGJ5IGRlZmF1bHQsIGlmIG5vIG90aGVyIGhhbmRsZXJzIHNlcnZlIHRoaXMgVVJMLlxuICBhcHAudXNlKGZ1bmN0aW9uIChyZXEsIHJlcykge1xuICAgIHJlcy53cml0ZUhlYWQoNDA0KTtcbiAgICByZXMuZW5kKCk7XG4gIH0pO1xuXG5cbiAgdmFyIGh0dHBTZXJ2ZXIgPSBjcmVhdGVTZXJ2ZXIoYXBwKTtcbiAgdmFyIG9uTGlzdGVuaW5nQ2FsbGJhY2tzID0gW107XG5cbiAgLy8gQWZ0ZXIgNSBzZWNvbmRzIHcvbyBkYXRhIG9uIGEgc29ja2V0LCBraWxsIGl0LiAgT24gdGhlIG90aGVyIGhhbmQsIGlmXG4gIC8vIHRoZXJlJ3MgYW4gb3V0c3RhbmRpbmcgcmVxdWVzdCwgZ2l2ZSBpdCBhIGhpZ2hlciB0aW1lb3V0IGluc3RlYWQgKHRvIGF2b2lkXG4gIC8vIGtpbGxpbmcgbG9uZy1wb2xsaW5nIHJlcXVlc3RzKVxuICBodHRwU2VydmVyLnNldFRpbWVvdXQoU0hPUlRfU09DS0VUX1RJTUVPVVQpO1xuXG4gIC8vIERvIHRoaXMgaGVyZSwgYW5kIHRoZW4gYWxzbyBpbiBsaXZlZGF0YS9zdHJlYW1fc2VydmVyLmpzLCBiZWNhdXNlXG4gIC8vIHN0cmVhbV9zZXJ2ZXIuanMga2lsbHMgYWxsIHRoZSBjdXJyZW50IHJlcXVlc3QgaGFuZGxlcnMgd2hlbiBpbnN0YWxsaW5nIGl0c1xuICAvLyBvd24uXG4gIGh0dHBTZXJ2ZXIub24oJ3JlcXVlc3QnLCBXZWJBcHAuX3RpbWVvdXRBZGp1c3RtZW50UmVxdWVzdENhbGxiYWNrKTtcblxuICAvLyBJZiB0aGUgY2xpZW50IGdhdmUgdXMgYSBiYWQgcmVxdWVzdCwgdGVsbCBpdCBpbnN0ZWFkIG9mIGp1c3QgY2xvc2luZyB0aGVcbiAgLy8gc29ja2V0LiBUaGlzIGxldHMgbG9hZCBiYWxhbmNlcnMgaW4gZnJvbnQgb2YgdXMgZGlmZmVyZW50aWF0ZSBiZXR3ZWVuIFwiYVxuICAvLyBzZXJ2ZXIgaXMgcmFuZG9tbHkgY2xvc2luZyBzb2NrZXRzIGZvciBubyByZWFzb25cIiBhbmQgXCJjbGllbnQgc2VudCBhIGJhZFxuICAvLyByZXF1ZXN0XCIuXG4gIC8vXG4gIC8vIFRoaXMgd2lsbCBvbmx5IHdvcmsgb24gTm9kZSA2OyBOb2RlIDQgZGVzdHJveXMgdGhlIHNvY2tldCBiZWZvcmUgY2FsbGluZ1xuICAvLyB0aGlzIGV2ZW50LiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL25vZGVqcy9ub2RlL3B1bGwvNDU1Ny8gZm9yIGRldGFpbHMuXG4gIGh0dHBTZXJ2ZXIub24oJ2NsaWVudEVycm9yJywgKGVyciwgc29ja2V0KSA9PiB7XG4gICAgLy8gUHJlLU5vZGUtNiwgZG8gbm90aGluZy5cbiAgICBpZiAoc29ja2V0LmRlc3Ryb3llZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChlcnIubWVzc2FnZSA9PT0gJ1BhcnNlIEVycm9yJykge1xuICAgICAgc29ja2V0LmVuZCgnSFRUUC8xLjEgNDAwIEJhZCBSZXF1ZXN0XFxyXFxuXFxyXFxuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEZvciBvdGhlciBlcnJvcnMsIHVzZSB0aGUgZGVmYXVsdCBiZWhhdmlvciBhcyBpZiB3ZSBoYWQgbm8gY2xpZW50RXJyb3JcbiAgICAgIC8vIGhhbmRsZXIuXG4gICAgICBzb2NrZXQuZGVzdHJveShlcnIpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gc3RhcnQgdXAgYXBwXG4gIF8uZXh0ZW5kKFdlYkFwcCwge1xuICAgIGNvbm5lY3RIYW5kbGVyczogcGFja2FnZUFuZEFwcEhhbmRsZXJzLFxuICAgIHJhd0Nvbm5lY3RIYW5kbGVyczogcmF3Q29ubmVjdEhhbmRsZXJzLFxuICAgIGh0dHBTZXJ2ZXI6IGh0dHBTZXJ2ZXIsXG4gICAgY29ubmVjdEFwcDogYXBwLFxuICAgIC8vIEZvciB0ZXN0aW5nLlxuICAgIHN1cHByZXNzQ29ubmVjdEVycm9yczogZnVuY3Rpb24gKCkge1xuICAgICAgc3VwcHJlc3NDb25uZWN0RXJyb3JzID0gdHJ1ZTtcbiAgICB9LFxuICAgIG9uTGlzdGVuaW5nOiBmdW5jdGlvbiAoZikge1xuICAgICAgaWYgKG9uTGlzdGVuaW5nQ2FsbGJhY2tzKVxuICAgICAgICBvbkxpc3RlbmluZ0NhbGxiYWNrcy5wdXNoKGYpO1xuICAgICAgZWxzZVxuICAgICAgICBmKCk7XG4gICAgfSxcbiAgICAvLyBUaGlzIGNhbiBiZSBvdmVycmlkZGVuIGJ5IHVzZXJzIHdobyB3YW50IHRvIG1vZGlmeSBob3cgbGlzdGVuaW5nIHdvcmtzXG4gICAgLy8gKGVnLCB0byBydW4gYSBwcm94eSBsaWtlIEFwb2xsbyBFbmdpbmUgUHJveHkgaW4gZnJvbnQgb2YgdGhlIHNlcnZlcikuXG4gICAgc3RhcnRMaXN0ZW5pbmc6IGZ1bmN0aW9uIChodHRwU2VydmVyLCBsaXN0ZW5PcHRpb25zLCBjYikge1xuICAgICAgaHR0cFNlcnZlci5saXN0ZW4obGlzdGVuT3B0aW9ucywgY2IpO1xuICAgIH0sXG4gIH0pO1xuXG4gIC8vIExldCB0aGUgcmVzdCBvZiB0aGUgcGFja2FnZXMgKGFuZCBNZXRlb3Iuc3RhcnR1cCBob29rcykgaW5zZXJ0IGNvbm5lY3RcbiAgLy8gbWlkZGxld2FyZXMgYW5kIHVwZGF0ZSBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLCB0aGVuIGtlZXAgZ29pbmcgdG8gc2V0IHVwXG4gIC8vIGFjdHVhbGx5IHNlcnZpbmcgSFRNTC5cbiAgZXhwb3J0cy5tYWluID0gYXJndiA9PiB7XG4gICAgV2ViQXBwSW50ZXJuYWxzLmdlbmVyYXRlQm9pbGVycGxhdGUoKTtcblxuICAgIGNvbnN0IHN0YXJ0SHR0cFNlcnZlciA9IGxpc3Rlbk9wdGlvbnMgPT4ge1xuICAgICAgV2ViQXBwLnN0YXJ0TGlzdGVuaW5nKGh0dHBTZXJ2ZXIsIGxpc3Rlbk9wdGlvbnMsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4ge1xuICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTUVURU9SX1BSSU5UX09OX0xJU1RFTikge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiTElTVEVOSU5HXCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IG9uTGlzdGVuaW5nQ2FsbGJhY2tzO1xuICAgICAgICBvbkxpc3RlbmluZ0NhbGxiYWNrcyA9IG51bGw7XG4gICAgICAgIGNhbGxiYWNrcy5mb3JFYWNoKGNhbGxiYWNrID0+IHsgY2FsbGJhY2soKTsgfSk7XG4gICAgICB9LCBlID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGxpc3RlbmluZzpcIiwgZSk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZSAmJiBlLnN0YWNrKTtcbiAgICAgIH0pKTtcbiAgICB9O1xuXG4gICAgbGV0IGxvY2FsUG9ydCA9IHByb2Nlc3MuZW52LlBPUlQgfHwgMDtcbiAgICBjb25zdCB1bml4U29ja2V0UGF0aCA9IHByb2Nlc3MuZW52LlVOSVhfU09DS0VUX1BBVEg7XG5cbiAgICBpZiAodW5peFNvY2tldFBhdGgpIHtcbiAgICAgIC8vIFN0YXJ0IHRoZSBIVFRQIHNlcnZlciB1c2luZyBhIHNvY2tldCBmaWxlLlxuICAgICAgcmVtb3ZlRXhpc3RpbmdTb2NrZXRGaWxlKHVuaXhTb2NrZXRQYXRoKTtcbiAgICAgIHN0YXJ0SHR0cFNlcnZlcih7IHBhdGg6IHVuaXhTb2NrZXRQYXRoIH0pO1xuICAgICAgcmVnaXN0ZXJTb2NrZXRGaWxlQ2xlYW51cCh1bml4U29ja2V0UGF0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvY2FsUG9ydCA9IGlzTmFOKE51bWJlcihsb2NhbFBvcnQpKSA/IGxvY2FsUG9ydCA6IE51bWJlcihsb2NhbFBvcnQpO1xuICAgICAgaWYgKC9cXFxcXFxcXD8uK1xcXFxwaXBlXFxcXD8uKy8udGVzdChsb2NhbFBvcnQpKSB7XG4gICAgICAgIC8vIFN0YXJ0IHRoZSBIVFRQIHNlcnZlciB1c2luZyBXaW5kb3dzIFNlcnZlciBzdHlsZSBuYW1lZCBwaXBlLlxuICAgICAgICBzdGFydEh0dHBTZXJ2ZXIoeyBwYXRoOiBsb2NhbFBvcnQgfSk7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBsb2NhbFBvcnQgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgLy8gU3RhcnQgdGhlIEhUVFAgc2VydmVyIHVzaW5nIFRDUC5cbiAgICAgICAgc3RhcnRIdHRwU2VydmVyKHtcbiAgICAgICAgICBwb3J0OiBsb2NhbFBvcnQsXG4gICAgICAgICAgaG9zdDogcHJvY2Vzcy5lbnYuQklORF9JUCB8fCBcIjAuMC4wLjBcIlxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgUE9SVCBzcGVjaWZpZWRcIik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFwiREFFTU9OXCI7XG4gIH07XG59XG5cbnZhciBpbmxpbmVTY3JpcHRzQWxsb3dlZCA9IHRydWU7XG5cbldlYkFwcEludGVybmFscy5pbmxpbmVTY3JpcHRzQWxsb3dlZCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGlubGluZVNjcmlwdHNBbGxvd2VkO1xufTtcblxuV2ViQXBwSW50ZXJuYWxzLnNldElubGluZVNjcmlwdHNBbGxvd2VkID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIGlubGluZVNjcmlwdHNBbGxvd2VkID0gdmFsdWU7XG4gIFdlYkFwcEludGVybmFscy5nZW5lcmF0ZUJvaWxlcnBsYXRlKCk7XG59O1xuXG52YXIgc3JpTW9kZTtcblxuV2ViQXBwSW50ZXJuYWxzLmVuYWJsZVN1YnJlc291cmNlSW50ZWdyaXR5ID0gZnVuY3Rpb24odXNlX2NyZWRlbnRpYWxzID0gZmFsc2UpIHtcbiAgc3JpTW9kZSA9IHVzZV9jcmVkZW50aWFscyA/ICd1c2UtY3JlZGVudGlhbHMnIDogJ2Fub255bW91cyc7XG4gIFdlYkFwcEludGVybmFscy5nZW5lcmF0ZUJvaWxlcnBsYXRlKCk7XG59O1xuXG5XZWJBcHBJbnRlcm5hbHMuc2V0QnVuZGxlZEpzQ3NzVXJsUmV3cml0ZUhvb2sgPSBmdW5jdGlvbiAoaG9va0ZuKSB7XG4gIGJ1bmRsZWRKc0Nzc1VybFJld3JpdGVIb29rID0gaG9va0ZuO1xuICBXZWJBcHBJbnRlcm5hbHMuZ2VuZXJhdGVCb2lsZXJwbGF0ZSgpO1xufTtcblxuV2ViQXBwSW50ZXJuYWxzLnNldEJ1bmRsZWRKc0Nzc1ByZWZpeCA9IGZ1bmN0aW9uIChwcmVmaXgpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLnNldEJ1bmRsZWRKc0Nzc1VybFJld3JpdGVIb29rKFxuICAgIGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgIHJldHVybiBwcmVmaXggKyB1cmw7XG4gIH0pO1xufTtcblxuLy8gUGFja2FnZXMgY2FuIGNhbGwgYFdlYkFwcEludGVybmFscy5hZGRTdGF0aWNKc2AgdG8gc3BlY2lmeSBzdGF0aWNcbi8vIEphdmFTY3JpcHQgdG8gYmUgaW5jbHVkZWQgaW4gdGhlIGFwcC4gVGhpcyBzdGF0aWMgSlMgd2lsbCBiZSBpbmxpbmVkLFxuLy8gdW5sZXNzIGlubGluZSBzY3JpcHRzIGhhdmUgYmVlbiBkaXNhYmxlZCwgaW4gd2hpY2ggY2FzZSBpdCB3aWxsIGJlXG4vLyBzZXJ2ZWQgdW5kZXIgYC88c2hhMSBvZiBjb250ZW50cz5gLlxudmFyIGFkZGl0aW9uYWxTdGF0aWNKcyA9IHt9O1xuV2ViQXBwSW50ZXJuYWxzLmFkZFN0YXRpY0pzID0gZnVuY3Rpb24gKGNvbnRlbnRzKSB7XG4gIGFkZGl0aW9uYWxTdGF0aWNKc1tcIi9cIiArIHNoYTEoY29udGVudHMpICsgXCIuanNcIl0gPSBjb250ZW50cztcbn07XG5cbi8vIEV4cG9ydGVkIGZvciB0ZXN0c1xuV2ViQXBwSW50ZXJuYWxzLmdldEJvaWxlcnBsYXRlID0gZ2V0Qm9pbGVycGxhdGU7XG5XZWJBcHBJbnRlcm5hbHMuYWRkaXRpb25hbFN0YXRpY0pzID0gYWRkaXRpb25hbFN0YXRpY0pzO1xuXG4vLyBTdGFydCB0aGUgc2VydmVyIVxucnVuV2ViQXBwU2VydmVyKCk7XG4iLCJpbXBvcnQgbnBtQ29ubmVjdCBmcm9tIFwiY29ubmVjdFwiO1xuXG5leHBvcnQgZnVuY3Rpb24gY29ubmVjdCguLi5jb25uZWN0QXJncykge1xuICBjb25zdCBoYW5kbGVycyA9IG5wbUNvbm5lY3QuYXBwbHkodGhpcywgY29ubmVjdEFyZ3MpO1xuICBjb25zdCBvcmlnaW5hbFVzZSA9IGhhbmRsZXJzLnVzZTtcblxuICAvLyBXcmFwIHRoZSBoYW5kbGVycy51c2UgbWV0aG9kIHNvIHRoYXQgYW55IHByb3ZpZGVkIGhhbmRsZXIgZnVuY3Rpb25zXG4gIC8vIGFsd2F5IHJ1biBpbiBhIEZpYmVyLlxuICBoYW5kbGVycy51c2UgPSBmdW5jdGlvbiB1c2UoLi4udXNlQXJncykge1xuICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRoaXM7XG4gICAgY29uc3Qgb3JpZ2luYWxMZW5ndGggPSBzdGFjay5sZW5ndGg7XG4gICAgY29uc3QgcmVzdWx0ID0gb3JpZ2luYWxVc2UuYXBwbHkodGhpcywgdXNlQXJncyk7XG5cbiAgICAvLyBJZiB3ZSBqdXN0IGFkZGVkIGFueXRoaW5nIHRvIHRoZSBzdGFjaywgd3JhcCBlYWNoIG5ldyBlbnRyeS5oYW5kbGVcbiAgICAvLyB3aXRoIGEgZnVuY3Rpb24gdGhhdCBjYWxscyBQcm9taXNlLmFzeW5jQXBwbHkgdG8gZW5zdXJlIHRoZVxuICAgIC8vIG9yaWdpbmFsIGhhbmRsZXIgcnVucyBpbiBhIEZpYmVyLlxuICAgIGZvciAobGV0IGkgPSBvcmlnaW5hbExlbmd0aDsgaSA8IHN0YWNrLmxlbmd0aDsgKytpKSB7XG4gICAgICBjb25zdCBlbnRyeSA9IHN0YWNrW2ldO1xuICAgICAgY29uc3Qgb3JpZ2luYWxIYW5kbGUgPSBlbnRyeS5oYW5kbGU7XG5cbiAgICAgIGlmIChvcmlnaW5hbEhhbmRsZS5sZW5ndGggPj0gNCkge1xuICAgICAgICAvLyBJZiB0aGUgb3JpZ2luYWwgaGFuZGxlIGhhZCBmb3VyIChvciBtb3JlKSBwYXJhbWV0ZXJzLCB0aGVcbiAgICAgICAgLy8gd3JhcHBlciBtdXN0IGFsc28gaGF2ZSBmb3VyIHBhcmFtZXRlcnMsIHNpbmNlIGNvbm5lY3QgdXNlc1xuICAgICAgICAvLyBoYW5kbGUubGVuZ3RoIHRvIGRlcm1pbmUgd2hldGhlciB0byBwYXNzIHRoZSBlcnJvciBhcyB0aGUgZmlyc3RcbiAgICAgICAgLy8gYXJndW1lbnQgdG8gdGhlIGhhbmRsZSBmdW5jdGlvbi5cbiAgICAgICAgZW50cnkuaGFuZGxlID0gZnVuY3Rpb24gaGFuZGxlKGVyciwgcmVxLCByZXMsIG5leHQpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hc3luY0FwcGx5KG9yaWdpbmFsSGFuZGxlLCB0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZW50cnkuaGFuZGxlID0gZnVuY3Rpb24gaGFuZGxlKHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UuYXN5bmNBcHBseShvcmlnaW5hbEhhbmRsZSwgdGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIHJldHVybiBoYW5kbGVycztcbn1cbiIsImltcG9ydCB7IHN0YXRTeW5jLCB1bmxpbmtTeW5jLCBleGlzdHNTeW5jIH0gZnJvbSAnZnMnO1xuXG4vLyBTaW5jZSBhIG5ldyBzb2NrZXQgZmlsZSB3aWxsIGJlIGNyZWF0ZWQgd2hlbiB0aGUgSFRUUCBzZXJ2ZXJcbi8vIHN0YXJ0cyB1cCwgaWYgZm91bmQgcmVtb3ZlIHRoZSBleGlzdGluZyBmaWxlLlxuLy9cbi8vIFdBUk5JTkc6XG4vLyBUaGlzIHdpbGwgcmVtb3ZlIHRoZSBjb25maWd1cmVkIHNvY2tldCBmaWxlIHdpdGhvdXQgd2FybmluZy4gSWZcbi8vIHRoZSBjb25maWd1cmVkIHNvY2tldCBmaWxlIGlzIGFscmVhZHkgaW4gdXNlIGJ5IGFub3RoZXIgYXBwbGljYXRpb24sXG4vLyBpdCB3aWxsIHN0aWxsIGJlIHJlbW92ZWQuIE5vZGUgZG9lcyBub3QgcHJvdmlkZSBhIHJlbGlhYmxlIHdheSB0b1xuLy8gZGlmZmVyZW50aWF0ZSBiZXR3ZWVuIGEgc29ja2V0IGZpbGUgdGhhdCBpcyBhbHJlYWR5IGluIHVzZSBieVxuLy8gYW5vdGhlciBhcHBsaWNhdGlvbiBvciBhIHN0YWxlIHNvY2tldCBmaWxlIHRoYXQgaGFzIGJlZW5cbi8vIGxlZnQgb3ZlciBhZnRlciBhIFNJR0tJTEwuIFNpbmNlIHdlIGhhdmUgbm8gcmVsaWFibGUgd2F5IHRvXG4vLyBkaWZmZXJlbnRpYXRlIGJldHdlZW4gdGhlc2UgdHdvIHNjZW5hcmlvcywgdGhlIGJlc3QgY291cnNlIG9mXG4vLyBhY3Rpb24gZHVyaW5nIHN0YXJ0dXAgaXMgdG8gcmVtb3ZlIGFueSBleGlzdGluZyBzb2NrZXQgZmlsZS4gVGhpc1xuLy8gaXMgbm90IHRoZSBzYWZlc3QgY291cnNlIG9mIGFjdGlvbiBhcyByZW1vdmluZyB0aGUgZXhpc3Rpbmcgc29ja2V0XG4vLyBmaWxlIGNvdWxkIGltcGFjdCBhbiBhcHBsaWNhdGlvbiB1c2luZyBpdCwgYnV0IHRoaXMgYXBwcm9hY2ggaGVscHNcbi8vIGVuc3VyZSB0aGUgSFRUUCBzZXJ2ZXIgY2FuIHN0YXJ0dXAgd2l0aG91dCBtYW51YWxcbi8vIGludGVydmVudGlvbiAoZS5nLiBhc2tpbmcgZm9yIHRoZSB2ZXJpZmljYXRpb24gYW5kIGNsZWFudXAgb2Ygc29ja2V0XG4vLyBmaWxlcyBiZWZvcmUgYWxsb3dpbmcgdGhlIEhUVFAgc2VydmVyIHRvIGJlIHN0YXJ0ZWQpLlxuLy9cbi8vIFRoZSBhYm92ZSBiZWluZyBzYWlkLCBhcyBsb25nIGFzIHRoZSBzb2NrZXQgZmlsZSBwYXRoIGlzXG4vLyBjb25maWd1cmVkIGNhcmVmdWxseSB3aGVuIHRoZSBhcHBsaWNhdGlvbiBpcyBkZXBsb3llZCAoYW5kIGV4dHJhXG4vLyBjYXJlIGlzIHRha2VuIHRvIG1ha2Ugc3VyZSB0aGUgY29uZmlndXJlZCBwYXRoIGlzIHVuaXF1ZSBhbmQgZG9lc24ndFxuLy8gY29uZmxpY3Qgd2l0aCBhbm90aGVyIHNvY2tldCBmaWxlIHBhdGgpLCB0aGVuIHRoZXJlIHNob3VsZCBub3QgYmVcbi8vIGFueSBpc3N1ZXMgd2l0aCB0aGlzIGFwcHJvYWNoLlxuZXhwb3J0IGNvbnN0IHJlbW92ZUV4aXN0aW5nU29ja2V0RmlsZSA9IChzb2NrZXRQYXRoKSA9PiB7XG4gIHRyeSB7XG4gICAgaWYgKHN0YXRTeW5jKHNvY2tldFBhdGgpLmlzU29ja2V0KCkpIHtcbiAgICAgIC8vIFNpbmNlIGEgbmV3IHNvY2tldCBmaWxlIHdpbGwgYmUgY3JlYXRlZCwgcmVtb3ZlIHRoZSBleGlzdGluZ1xuICAgICAgLy8gZmlsZS5cbiAgICAgIHVubGlua1N5bmMoc29ja2V0UGF0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYEFuIGV4aXN0aW5nIGZpbGUgd2FzIGZvdW5kIGF0IFwiJHtzb2NrZXRQYXRofVwiIGFuZCBpdCBpcyBub3QgYCArXG4gICAgICAgICdhIHNvY2tldCBmaWxlLiBQbGVhc2UgY29uZmlybSBQT1JUIGlzIHBvaW50aW5nIHRvIHZhbGlkIGFuZCAnICtcbiAgICAgICAgJ3VuLXVzZWQgc29ja2V0IGZpbGUgcGF0aC4nXG4gICAgICApO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBleGlzdGluZyBzb2NrZXQgZmlsZSB0byBjbGVhbnVwLCBncmVhdCwgd2UnbGxcbiAgICAvLyBjb250aW51ZSBub3JtYWxseS4gSWYgdGhlIGNhdWdodCBleGNlcHRpb24gcmVwcmVzZW50cyBhbnkgb3RoZXJcbiAgICAvLyBpc3N1ZSwgcmUtdGhyb3cuXG4gICAgaWYgKGVycm9yLmNvZGUgIT09ICdFTk9FTlQnKSB7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cbn07XG5cbi8vIFJlbW92ZSB0aGUgc29ja2V0IGZpbGUgd2hlbiBkb25lIHRvIGF2b2lkIGxlYXZpbmcgYmVoaW5kIGEgc3RhbGUgb25lLlxuLy8gTm90ZSAtIGEgc3RhbGUgc29ja2V0IGZpbGUgaXMgc3RpbGwgbGVmdCBiZWhpbmQgaWYgdGhlIHJ1bm5pbmcgbm9kZVxuLy8gcHJvY2VzcyBpcyBraWxsZWQgdmlhIHNpZ25hbCA5IC0gU0lHS0lMTC5cbmV4cG9ydCBjb25zdCByZWdpc3RlclNvY2tldEZpbGVDbGVhbnVwID1cbiAgKHNvY2tldFBhdGgsIGV2ZW50RW1pdHRlciA9IHByb2Nlc3MpID0+IHtcbiAgICBbJ2V4aXQnLCAnU0lHSU5UJywgJ1NJR0hVUCcsICdTSUdURVJNJ10uZm9yRWFjaChzaWduYWwgPT4ge1xuICAgICAgZXZlbnRFbWl0dGVyLm9uKHNpZ25hbCwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiB7XG4gICAgICAgIGlmIChleGlzdHNTeW5jKHNvY2tldFBhdGgpKSB7XG4gICAgICAgICAgdW5saW5rU3luYyhzb2NrZXRQYXRoKTtcbiAgICAgICAgfVxuICAgICAgfSkpO1xuICAgIH0pO1xuICB9O1xuIl19
