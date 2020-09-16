(function () {

/* Imports */
var _ = Package.underscore._;
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var EventEmitter = Package['raix:eventemitter'].EventEmitter;
var Util = Package['meteorspark:util'].Util;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var HTTP = Package['cfs:http-methods'].HTTP;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var globals, TAPi18next, __coffeescriptShare, TAPi18n;

(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/tap_i18n/lib/globals.js                                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// The globals object will be accessible to the build plugin, the server and
// the client

globals = {
  fallback_language: "en",
  langauges_tags_regex: "([a-z]{2})(-[A-Z]{2})?",
  project_translations_domain: "project",
  browser_path: "/tap-i18n",
  debug: false
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/tap_i18n/lib/tap_i18next/tap_i18next-1.7.3.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// tap_i18next is a copy of i18next that expose i18next to the global namespace
// under the name name TAPi18next instead of i18n to (1) avoid interfering with other
// Meteor packages that might use i18n with different configurations than we do
// or worse - (2) using a different version of i18next
//
// setJqueryExt is disabled by default in TAPi18next
// sprintf is a default postProcess in TAPi18next
//
// TAPi18next is set outside of the singleton builder to make it available in the
// package level

// i18next, v1.7.3
// Copyright (c)2014 Jan Mühlemann (jamuhl).
// Distributed under MIT license
// http://i18next.com

// set TAPi18next outside of the singleton builder to make it available in the package level
TAPi18next = {};
(function() {

    // add indexOf to non ECMA-262 standard compliant browsers
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
            "use strict";
            if (this == null) {
                throw new TypeError();
            }
            var t = Object(this);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = 0;
            if (arguments.length > 0) {
                n = Number(arguments[1]);
                if (n != n) { // shortcut for verifying if it's NaN
                    n = 0;
                } else if (n != 0 && n != Infinity && n != -Infinity) {
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
            }
            if (n >= len) {
                return -1;
            }
            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
            for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        }
    }
    
    // add lastIndexOf to non ECMA-262 standard compliant browsers
    if (!Array.prototype.lastIndexOf) {
        Array.prototype.lastIndexOf = function(searchElement /*, fromIndex*/) {
            "use strict";
            if (this == null) {
                throw new TypeError();
            }
            var t = Object(this);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = len;
            if (arguments.length > 1) {
                n = Number(arguments[1]);
                if (n != n) {
                    n = 0;
                } else if (n != 0 && n != (1 / 0) && n != -(1 / 0)) {
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
            }
            var k = n >= 0 ? Math.min(n, len - 1) : len - Math.abs(n);
            for (; k >= 0; k--) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        };
    }
    
    // Add string trim for IE8.
    if (typeof String.prototype.trim !== 'function') {
        String.prototype.trim = function() {
            return this.replace(/^\s+|\s+$/g, ''); 
        }
    }

    var root = this
      , $ = root.jQuery || root.Zepto
      , resStore = {}
      , currentLng
      , replacementCounter = 0
      , languages = []
      , initialized = false;


    // Export the i18next object for **CommonJS**. 
    // If we're not in CommonJS, add `i18n` to the
    // global object or to jquery.
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = TAPi18next;
    } else {
        if ($) {
            $.TAPi18next = $.TAPi18next || TAPi18next;
        }
        
        root.TAPi18next = root.TAPi18next || TAPi18next;
    }
    // defaults
    var o = {
        lng: undefined,
        load: 'all',
        preload: [],
        lowerCaseLng: false,
        returnObjectTrees: false,
        fallbackLng: ['dev'],
        fallbackNS: [],
        detectLngQS: 'setLng',
        ns: 'translation',
        fallbackOnNull: true,
        fallbackOnEmpty: false,
        fallbackToDefaultNS: false,
        nsseparator: ':',
        keyseparator: '.',
        selectorAttr: 'data-i18n',
        debug: false,
        
        resGetPath: 'locales/__lng__/__ns__.json',
        resPostPath: 'locales/add/__lng__/__ns__',
    
        getAsync: true,
        postAsync: true,
    
        resStore: undefined,
        useLocalStorage: false,
        localStorageExpirationTime: 7*24*60*60*1000,
    
        dynamicLoad: false,
        sendMissing: false,
        sendMissingTo: 'fallback', // current | all
        sendType: 'POST',
    
        interpolationPrefix: '__',
        interpolationSuffix: '__',
        reusePrefix: '$t(',
        reuseSuffix: ')',
        pluralSuffix: '_plural',
        pluralNotFound: ['plural_not_found', Math.random()].join(''),
        contextNotFound: ['context_not_found', Math.random()].join(''),
        escapeInterpolation: false,
    
        setJqueryExt: false,
        defaultValueFromContent: true,
        useDataAttrOptions: false,
        cookieExpirationTime: undefined,
        useCookie: true,
        cookieName: 'TAPi18next',
        cookieDomain: undefined,
    
        objectTreeKeyHandler: undefined,
        postProcess: ["sprintf"],
        parseMissingKey: undefined,
    
        shortcutFunction: 'sprintf' // or: defaultValue
    };
    function _extend(target, source) {
        if (!source || typeof source === 'function') {
            return target;
        }
    
        for (var attr in source) { target[attr] = source[attr]; }
        return target;
    }
    
    function _each(object, callback, args) {
        var name, i = 0,
            length = object.length,
            isObj = length === undefined || Object.prototype.toString.apply(object) !== '[object Array]' || typeof object === "function";
    
        if (args) {
            if (isObj) {
                for (name in object) {
                    if (callback.apply(object[name], args) === false) {
                        break;
                    }
                }
            } else {
                for ( ; i < length; ) {
                    if (callback.apply(object[i++], args) === false) {
                        break;
                    }
                }
            }
    
        // A special, fast, case for the most common use of each
        } else {
            if (isObj) {
                for (name in object) {
                    if (callback.call(object[name], name, object[name]) === false) {
                        break;
                    }
                }
            } else {
                for ( ; i < length; ) {
                    if (callback.call(object[i], i, object[i++]) === false) {
                        break;
                    }
                }
            }
        }
    
        return object;
    }
    
    var _entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };
    
    function _escape(data) {
        if (typeof data === 'string') {
            return data.replace(/[&<>"'\/]/g, function (s) {
                return _entityMap[s];
            });
        }else{
            return data;
        }
    }
    
    function _ajax(options) {
    
        // v0.5.0 of https://github.com/goloroden/http.js
        var getXhr = function (callback) {
            // Use the native XHR object if the browser supports it.
            if (window.XMLHttpRequest) {
                return callback(null, new XMLHttpRequest());
            } else if (window.ActiveXObject) {
                // In Internet Explorer check for ActiveX versions of the XHR object.
                try {
                    return callback(null, new ActiveXObject("Msxml2.XMLHTTP"));
                } catch (e) {
                    return callback(null, new ActiveXObject("Microsoft.XMLHTTP"));
                }
            }
    
            // If no XHR support was found, throw an error.
            return callback(new Error());
        };
    
        var encodeUsingUrlEncoding = function (data) {
            if(typeof data === 'string') {
                return data;
            }
    
            var result = [];
            for(var dataItem in data) {
                if(data.hasOwnProperty(dataItem)) {
                    result.push(encodeURIComponent(dataItem) + '=' + encodeURIComponent(data[dataItem]));
                }
            }
    
            return result.join('&');
        };
    
        var utf8 = function (text) {
            text = text.replace(/\r\n/g, '\n');
            var result = '';
    
            for(var i = 0; i < text.length; i++) {
                var c = text.charCodeAt(i);
    
                if(c < 128) {
                        result += String.fromCharCode(c);
                } else if((c > 127) && (c < 2048)) {
                        result += String.fromCharCode((c >> 6) | 192);
                        result += String.fromCharCode((c & 63) | 128);
                } else {
                        result += String.fromCharCode((c >> 12) | 224);
                        result += String.fromCharCode(((c >> 6) & 63) | 128);
                        result += String.fromCharCode((c & 63) | 128);
                }
            }
    
            return result;
        };
    
        var base64 = function (text) {
            var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    
            text = utf8(text);
            var result = '',
                    chr1, chr2, chr3,
                    enc1, enc2, enc3, enc4,
                    i = 0;
    
            do {
                chr1 = text.charCodeAt(i++);
                chr2 = text.charCodeAt(i++);
                chr3 = text.charCodeAt(i++);
    
                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;
    
                if(isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if(isNaN(chr3)) {
                    enc4 = 64;
                }
    
                result +=
                    keyStr.charAt(enc1) +
                    keyStr.charAt(enc2) +
                    keyStr.charAt(enc3) +
                    keyStr.charAt(enc4);
                chr1 = chr2 = chr3 = '';
                enc1 = enc2 = enc3 = enc4 = '';
            } while(i < text.length);
    
            return result;
        };
    
        var mergeHeaders = function () {
            // Use the first header object as base.
            var result = arguments[0];
    
            // Iterate through the remaining header objects and add them.
            for(var i = 1; i < arguments.length; i++) {
                var currentHeaders = arguments[i];
                for(var header in currentHeaders) {
                    if(currentHeaders.hasOwnProperty(header)) {
                        result[header] = currentHeaders[header];
                    }
                }
            }
    
            // Return the merged headers.
            return result;
        };
    
        var ajax = function (method, url, options, callback) {
            // Adjust parameters.
            if(typeof options === 'function') {
                callback = options;
                options = {};
            }
    
            // Set default parameter values.
            options.cache = options.cache || false;
            options.data = options.data || {};
            options.headers = options.headers || {};
            options.jsonp = options.jsonp || false;
            options.async = options.async === undefined ? true : options.async;
    
            // Merge the various header objects.
            var headers = mergeHeaders({
                'accept': '*/*',
                'content-type': 'application/x-www-form-urlencoded;charset=UTF-8'
            }, ajax.headers, options.headers);
    
            // Encode the data according to the content-type.
            var payload;
            if (headers['content-type'] === 'application/json') {
                payload = JSON.stringify(options.data);
            } else {
                payload = encodeUsingUrlEncoding(options.data);
            }
    
            // Specially prepare GET requests: Setup the query string, handle caching and make a JSONP call
            // if neccessary.
            if(method === 'GET') {
                // Setup the query string.
                var queryString = [];
                if(payload) {
                    queryString.push(payload);
                    payload = null;
                }
    
                // Handle caching.
                if(!options.cache) {
                    queryString.push('_=' + (new Date()).getTime());
                }
    
                // If neccessary prepare the query string for a JSONP call.
                if(options.jsonp) {
                    queryString.push('callback=' + options.jsonp);
                    queryString.push('jsonp=' + options.jsonp);
                }
    
                // Merge the query string and attach it to the url.
                queryString = queryString.join('&');
                if (queryString.length > 1) {
                    if (url.indexOf('?') > -1) {
                        url += '&' + queryString;
                    } else {
                        url += '?' + queryString;
                    }
                }
    
                // Make a JSONP call if neccessary.
                if(options.jsonp) {
                    var head = document.getElementsByTagName('head')[0];
                    var script = document.createElement('script');
                    script.type = 'text/javascript';
                    script.src = url;
                    head.appendChild(script);
                    return;
                }
            }
    
            // Since we got here, it is no JSONP request, so make a normal XHR request.
            getXhr(function (err, xhr) {
                if(err) return callback(err);
    
                // Open the request.
                xhr.open(method, url, options.async);
    
                // Set the request headers.
                for(var header in headers) {
                    if(headers.hasOwnProperty(header)) {
                        xhr.setRequestHeader(header, headers[header]);
                    }
                }
    
                // Handle the request events.
                xhr.onreadystatechange = function () {
                    if(xhr.readyState === 4) {
                        var data = xhr.responseText || '';
    
                        // If no callback is given, return.
                        if(!callback) {
                            return;
                        }
    
                        // Return an object that provides access to the data as text and JSON.
                        callback(xhr.status, {
                            text: function () {
                                return data;
                            },
    
                            json: function () {
                                return JSON.parse(data);
                            }
                        });
                    }
                };
    
                // Actually send the XHR request.
                xhr.send(payload);
            });
        };
    
        // Define the external interface.
        var http = {
            authBasic: function (username, password) {
                ajax.headers['Authorization'] = 'Basic ' + base64(username + ':' + password);
            },
    
            connect: function (url, options, callback) {
                return ajax('CONNECT', url, options, callback);
            },
    
            del: function (url, options, callback) {
                return ajax('DELETE', url, options, callback);
            },
    
            get: function (url, options, callback) {
                return ajax('GET', url, options, callback);
            },
    
            head: function (url, options, callback) {
                return ajax('HEAD', url, options, callback);
            },
    
            headers: function (headers) {
                ajax.headers = headers || {};
            },
    
            isAllowed: function (url, verb, callback) {
                this.options(url, function (status, data) {
                    callback(data.text().indexOf(verb) !== -1);
                });
            },
    
            options: function (url, options, callback) {
                return ajax('OPTIONS', url, options, callback);
            },
    
            patch: function (url, options, callback) {
                return ajax('PATCH', url, options, callback);
            },
    
            post: function (url, options, callback) {
                return ajax('POST', url, options, callback);
            },
    
            put: function (url, options, callback) {
                return ajax('PUT', url, options, callback);
            },
    
            trace: function (url, options, callback) {
                return ajax('TRACE', url, options, callback);
            }
        };
    
    
        var methode = options.type ? options.type.toLowerCase() : 'get';
    
        http[methode](options.url, options, function (status, data) {
            if (status === 200) {
                options.success(data.json(), status, null);
            } else {
                options.error(data.text(), status, null);
            }
        });
    }
    
    var _cookie = {
        create: function(name,value,minutes,domain) {
            var expires;
            if (minutes) {
                var date = new Date();
                date.setTime(date.getTime()+(minutes*60*1000));
                expires = "; expires="+date.toGMTString();
            }
            else expires = "";
            domain = (domain)? "domain="+domain+";" : "";
            document.cookie = name+"="+value+expires+";"+domain+"path=/";
        },
    
        read: function(name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for(var i=0;i < ca.length;i++) {
                var c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1,c.length);
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
            }
            return null;
        },
    
        remove: function(name) {
            this.create(name,"",-1);
        }
    };
    
    var cookie_noop = {
        create: function(name,value,minutes,domain) {},
        read: function(name) { return null; },
        remove: function(name) {}
    };
    
    
    
    // move dependent functions to a container so that
    // they can be overriden easier in no jquery environment (node.js)
    var f = {
        extend: $ ? $.extend : _extend,
        each: $ ? $.each : _each,
        ajax: $ ? $.ajax : (typeof document !== 'undefined' ? _ajax : function() {}),
        cookie: typeof document !== 'undefined' ? _cookie : cookie_noop,
        detectLanguage: detectLanguage,
        escape: _escape,
        log: function(str) {
            if (o.debug && typeof console !== "undefined") console.log(str);
        },
        toLanguages: function(lng) {
            var languages = [];
            if (typeof lng === 'string' && lng.indexOf('-') > -1) {
                var parts = lng.split('-');
    
                lng = o.lowerCaseLng ?
                    parts[0].toLowerCase() +  '-' + parts[1].toLowerCase() :
                    parts[0].toLowerCase() +  '-' + parts[1].toUpperCase();
    
                if (o.load !== 'unspecific') languages.push(lng);
                if (o.load !== 'current') languages.push(parts[0]);
            } else {
                languages.push(lng);
            }
    
            for (var i = 0; i < o.fallbackLng.length; i++) {
                if (languages.indexOf(o.fallbackLng[i]) === -1 && o.fallbackLng[i]) languages.push(o.fallbackLng[i]);
            }
    
            return languages;
        },
        regexEscape: function(str) {
            return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        }
    };
    function init(options, cb) {
        
        if (typeof options === 'function') {
            cb = options;
            options = {};
        }
        options = options || {};
        
        // override defaults with passed in options
        f.extend(o, options);
        delete o.fixLng; /* passed in each time */
    
        // create namespace object if namespace is passed in as string
        if (typeof o.ns == 'string') {
            o.ns = { namespaces: [o.ns], defaultNs: o.ns};
        }
    
        // fallback namespaces
        if (typeof o.fallbackNS == 'string') {
            o.fallbackNS = [o.fallbackNS];
        }
    
        // fallback languages
        if (typeof o.fallbackLng == 'string' || typeof o.fallbackLng == 'boolean') {
            o.fallbackLng = [o.fallbackLng];
        }
    
        // escape prefix/suffix
        o.interpolationPrefixEscaped = f.regexEscape(o.interpolationPrefix);
        o.interpolationSuffixEscaped = f.regexEscape(o.interpolationSuffix);
    
        if (!o.lng) o.lng = f.detectLanguage(); 
        if (o.lng) {
            // set cookie with lng set (as detectLanguage will set cookie on need)
            if (o.useCookie) f.cookie.create(o.cookieName, o.lng, o.cookieExpirationTime, o.cookieDomain);
        } else {
            o.lng =  o.fallbackLng[0];
            if (o.useCookie) f.cookie.remove(o.cookieName);
        }
    
        languages = f.toLanguages(o.lng);
        currentLng = languages[0];
        f.log('currentLng set to: ' + currentLng);
    
        var lngTranslate = translate;
        if (options.fixLng) {
            lngTranslate = function(key, options) {
                options = options || {};
                options.lng = options.lng || lngTranslate.lng;
                return translate(key, options);
            };
            lngTranslate.lng = currentLng;
        }
    
        pluralExtensions.setCurrentLng(currentLng);
    
        // add JQuery extensions
        if ($ && o.setJqueryExt) addJqueryFunct();
    
        // jQuery deferred
        var deferred;
        if ($ && $.Deferred) {
            deferred = $.Deferred();
        }
    
        // return immidiatly if res are passed in
        if (o.resStore) {
            resStore = o.resStore;
            initialized = true;
            if (cb) cb(lngTranslate);
            if (deferred) deferred.resolve(lngTranslate);
            if (deferred) return deferred.promise();
            return;
        }
    
        // languages to load
        var lngsToLoad = f.toLanguages(o.lng);
        if (typeof o.preload === 'string') o.preload = [o.preload];
        for (var i = 0, l = o.preload.length; i < l; i++) {
            var pres = f.toLanguages(o.preload[i]);
            for (var y = 0, len = pres.length; y < len; y++) {
                if (lngsToLoad.indexOf(pres[y]) < 0) {
                    lngsToLoad.push(pres[y]);
                }
            }
        }
    
        // else load them
        TAPi18next.sync.load(lngsToLoad, o, function(err, store) {
            resStore = store;
            initialized = true;
    
            if (cb) cb(lngTranslate);
            if (deferred) deferred.resolve(lngTranslate);
        });
    
        if (deferred) return deferred.promise();
    }
    function preload(lngs, cb) {
        if (typeof lngs === 'string') lngs = [lngs];
        for (var i = 0, l = lngs.length; i < l; i++) {
            if (o.preload.indexOf(lngs[i]) < 0) {
                o.preload.push(lngs[i]);
            }
        }
        return init(cb);
    }
    
    function addResourceBundle(lng, ns, resources) {
        if (typeof ns !== 'string') {
            resources = ns;
            ns = o.ns.defaultNs;
        } else if (o.ns.namespaces.indexOf(ns) < 0) {
            o.ns.namespaces.push(ns);
        }
    
        resStore[lng] = resStore[lng] || {};
        resStore[lng][ns] = resStore[lng][ns] || {};
    
        f.extend(resStore[lng][ns], resources);
    }
    
    function removeResourceBundle(lng, ns) {
        if (typeof ns !== 'string') {
            ns = o.ns.defaultNs;
        }
    
        resStore[lng] = resStore[lng] || {};
        resStore[lng][ns] = {};
    }
    
    function setDefaultNamespace(ns) {
        o.ns.defaultNs = ns;
    }
    
    function loadNamespace(namespace, cb) {
        loadNamespaces([namespace], cb);
    }
    
    function loadNamespaces(namespaces, cb) {
        var opts = {
            dynamicLoad: o.dynamicLoad,
            resGetPath: o.resGetPath,
            getAsync: o.getAsync,
            customLoad: o.customLoad,
            ns: { namespaces: namespaces, defaultNs: ''} /* new namespaces to load */
        };
    
        // languages to load
        var lngsToLoad = f.toLanguages(o.lng);
        if (typeof o.preload === 'string') o.preload = [o.preload];
        for (var i = 0, l = o.preload.length; i < l; i++) {
            var pres = f.toLanguages(o.preload[i]);
            for (var y = 0, len = pres.length; y < len; y++) {
                if (lngsToLoad.indexOf(pres[y]) < 0) {
                    lngsToLoad.push(pres[y]);
                }
            }
        }
    
        // check if we have to load
        var lngNeedLoad = [];
        for (var a = 0, lenA = lngsToLoad.length; a < lenA; a++) {
            var needLoad = false;
            var resSet = resStore[lngsToLoad[a]];
            if (resSet) {
                for (var b = 0, lenB = namespaces.length; b < lenB; b++) {
                    if (!resSet[namespaces[b]]) needLoad = true;
                }
            } else {
                needLoad = true;
            }
    
            if (needLoad) lngNeedLoad.push(lngsToLoad[a]);
        }
    
        if (lngNeedLoad.length) {
            TAPi18next.sync._fetch(lngNeedLoad, opts, function(err, store) {
                var todo = namespaces.length * lngNeedLoad.length;
    
                // load each file individual
                f.each(namespaces, function(nsIndex, nsValue) {
    
                    // append namespace to namespace array
                    if (o.ns.namespaces.indexOf(nsValue) < 0) {
                        o.ns.namespaces.push(nsValue);
                    }
    
                    f.each(lngNeedLoad, function(lngIndex, lngValue) {
                        resStore[lngValue] = resStore[lngValue] || {};
                        resStore[lngValue][nsValue] = store[lngValue][nsValue];
    
                        todo--; // wait for all done befor callback
                        if (todo === 0 && cb) {
                            if (o.useLocalStorage) TAPi18next.sync._storeLocal(resStore);
                            cb();
                        }
                    });
                });
            });
        } else {
            if (cb) cb();
        }
    }
    
    function setLng(lng, options, cb) {
        if (typeof options === 'function') {
            cb = options;
            options = {};
        } else if (!options) {
            options = {};
        }
    
        options.lng = lng;
        return init(options, cb);
    }
    
    function lng() {
        return currentLng;
    }
    function addJqueryFunct() {
        // $.t shortcut
        $.t = $.t || translate;
    
        function parse(ele, key, options) {
            if (key.length === 0) return;
    
            var attr = 'text';
    
            if (key.indexOf('[') === 0) {
                var parts = key.split(']');
                key = parts[1];
                attr = parts[0].substr(1, parts[0].length-1);
            }
    
            if (key.indexOf(';') === key.length-1) {
                key = key.substr(0, key.length-2);
            }
    
            var optionsToUse;
            if (attr === 'html') {
                optionsToUse = o.defaultValueFromContent ? $.extend({ defaultValue: ele.html() }, options) : options;
                ele.html($.t(key, optionsToUse));
            } else if (attr === 'text') {
                optionsToUse = o.defaultValueFromContent ? $.extend({ defaultValue: ele.text() }, options) : options;
                ele.text($.t(key, optionsToUse));
            } else if (attr === 'prepend') {
                optionsToUse = o.defaultValueFromContent ? $.extend({ defaultValue: ele.html() }, options) : options;
                ele.prepend($.t(key, optionsToUse));
            } else if (attr === 'append') {
                optionsToUse = o.defaultValueFromContent ? $.extend({ defaultValue: ele.html() }, options) : options;
                ele.append($.t(key, optionsToUse));
            } else if (attr.indexOf("data-") === 0) {
                var dataAttr = attr.substr(("data-").length);
                optionsToUse = o.defaultValueFromContent ? $.extend({ defaultValue: ele.data(dataAttr) }, options) : options;
                var translated = $.t(key, optionsToUse);
                //we change into the data cache
                ele.data(dataAttr, translated);
                //we change into the dom
                ele.attr(attr, translated);
            } else {
                optionsToUse = o.defaultValueFromContent ? $.extend({ defaultValue: ele.attr(attr) }, options) : options;
                ele.attr(attr, $.t(key, optionsToUse));
            }
        }
    
        function localize(ele, options) {
            var key = ele.attr(o.selectorAttr);
            if (!key && typeof key !== 'undefined' && key !== false) key = ele.text() || ele.val();
            if (!key) return;
    
            var target = ele
              , targetSelector = ele.data("i18n-target");
            if (targetSelector) {
                target = ele.find(targetSelector) || ele;
            }
    
            if (!options && o.useDataAttrOptions === true) {
                options = ele.data("i18n-options");
            }
            options = options || {};
    
            if (key.indexOf(';') >= 0) {
                var keys = key.split(';');
    
                $.each(keys, function(m, k) {
                    if (k !== '') parse(target, k, options);
                });
    
            } else {
                parse(target, key, options);
            }
    
            if (o.useDataAttrOptions === true) ele.data("i18n-options", options);
        }
    
        // fn
        $.fn.TAPi18next = function (options) {
            return this.each(function() {
                // localize element itself
                localize($(this), options);
    
                // localize childs
                var elements =  $(this).find('[' + o.selectorAttr + ']');
                elements.each(function() { 
                    localize($(this), options);
                });
            });
        };
    }
    function applyReplacement(str, replacementHash, nestedKey, options) {
        if (!str) return str;
    
        options = options || replacementHash; // first call uses replacement hash combined with options
        if (str.indexOf(options.interpolationPrefix || o.interpolationPrefix) < 0) return str;
    
        var prefix = options.interpolationPrefix ? f.regexEscape(options.interpolationPrefix) : o.interpolationPrefixEscaped
          , suffix = options.interpolationSuffix ? f.regexEscape(options.interpolationSuffix) : o.interpolationSuffixEscaped
          , unEscapingSuffix = 'HTML'+suffix;
    
        f.each(replacementHash, function(key, value) {
            var nextKey = nestedKey ? nestedKey + o.keyseparator + key : key;
            if (typeof value === 'object' && value !== null) {
                str = applyReplacement(str, value, nextKey, options);
            } else {
                if (options.escapeInterpolation || o.escapeInterpolation) {
                    str = str.replace(new RegExp([prefix, nextKey, unEscapingSuffix].join(''), 'g'), value);
                    str = str.replace(new RegExp([prefix, nextKey, suffix].join(''), 'g'), f.escape(value));
                } else {
                    str = str.replace(new RegExp([prefix, nextKey, suffix].join(''), 'g'), value);
                }
                // str = options.escapeInterpolation;
            }
        });
        return str;
    }
    
    // append it to functions
    f.applyReplacement = applyReplacement;
    
    function applyReuse(translated, options) {
        var comma = ',';
        var options_open = '{';
        var options_close = '}';
    
        var opts = f.extend({}, options);
        delete opts.postProcess;
    
        while (translated.indexOf(o.reusePrefix) != -1) {
            replacementCounter++;
            if (replacementCounter > o.maxRecursion) { break; } // safety net for too much recursion
            var index_of_opening = translated.lastIndexOf(o.reusePrefix);
            var index_of_end_of_closing = translated.indexOf(o.reuseSuffix, index_of_opening) + o.reuseSuffix.length;
            var token = translated.substring(index_of_opening, index_of_end_of_closing);
            var token_without_symbols = token.replace(o.reusePrefix, '').replace(o.reuseSuffix, '');
    
    
            if (token_without_symbols.indexOf(comma) != -1) {
                var index_of_token_end_of_closing = token_without_symbols.indexOf(comma);
                if (token_without_symbols.indexOf(options_open, index_of_token_end_of_closing) != -1 && token_without_symbols.indexOf(options_close, index_of_token_end_of_closing) != -1) {
                    var index_of_opts_opening = token_without_symbols.indexOf(options_open, index_of_token_end_of_closing);
                    var index_of_opts_end_of_closing = token_without_symbols.indexOf(options_close, index_of_opts_opening) + options_close.length;
                    try {
                        opts = f.extend(opts, JSON.parse(token_without_symbols.substring(index_of_opts_opening, index_of_opts_end_of_closing)));
                        token_without_symbols = token_without_symbols.substring(0, index_of_token_end_of_closing);
                    } catch (e) {
                    }
                }
            }
    
            var translated_token = _translate(token_without_symbols, opts);
            translated = translated.replace(token, translated_token);
        }
        return translated;
    }
    
    function hasContext(options) {
        return (options.context && (typeof options.context == 'string' || typeof options.context == 'number'));
    }
    
    function needsPlural(options) {
        return (options.count !== undefined && typeof options.count != 'string' && options.count !== 1);
    }
    
    function exists(key, options) {
        options = options || {};
    
        var notFound = _getDefaultValue(key, options)
            , found = _find(key, options);
    
        return found !== undefined || found === notFound;
    }
    
    function translate(key, options) {
        if (typeof options === 'undefined') {
          options = {};
        }
    
        if (!initialized) {
            f.log('i18next not finished initialization. you might have called t function before loading resources finished.')
            return options.defaultValue || '';
        };
        replacementCounter = 0;
        return _translate.apply(null, arguments);
    }
    
    function _getDefaultValue(key, options) {
        return (options.defaultValue !== undefined) ? options.defaultValue : key;
    }
    
    function _injectSprintfProcessor() {
    
        var values = [];
    
        // mh: build array from second argument onwards
        for (var i = 1; i < arguments.length; i++) {
            values.push(arguments[i]);
        }
    
        return {
            postProcess: 'sprintf',
            sprintf:     values
        };
    }
    
    function _translate(potentialKeys, options) {
        if (typeof options !== "undefined" && options !== null && typeof options !== 'object') {
            if (o.shortcutFunction === 'sprintf') {
                // mh: gettext like sprintf syntax found, automatically create sprintf processor
                options = _injectSprintfProcessor.apply(null, arguments);
            } else if (o.shortcutFunction === 'defaultValue') {
                options = {
                    defaultValue: options
                }
            }
        } else {
            options = options || {};
        }
    
        if (potentialKeys === undefined || potentialKeys === null) return '';
    
        if (typeof potentialKeys == 'string') {
            potentialKeys = [potentialKeys];
        }
    
        var key = potentialKeys[0];
    
        if (potentialKeys.length > 1) {
            for (var i = 0; i < potentialKeys.length; i++) {
                key = potentialKeys[i];
                if (exists(key, options)) {
                    break;
                }
            }
        }
    
        var notFound = _getDefaultValue(key, options)
            , found = _find(key, options)
            , lngs = options.lng ? f.toLanguages(options.lng) : languages
            , ns = options.ns || o.ns.defaultNs
            , parts;
    
        // split ns and key
        if (key.indexOf(o.nsseparator) > -1) {
            parts = key.split(o.nsseparator);
            ns = parts[0];
            key = parts[1];
        }
    
        if (found === undefined && o.sendMissing) {
            if (options.lng) {
                sync.postMissing(lngs[0], ns, key, notFound, lngs);
            } else {
                sync.postMissing(o.lng, ns, key, notFound, lngs);
            }
        }
    
        var postProcessor = options.postProcess || o.postProcess;
        if (found !== undefined && postProcessor) {
            if (postProcessors[postProcessor]) {
                found = postProcessors[postProcessor](found, key, options);
            }
        }
    
        // process notFound if function exists
        var splitNotFound = notFound;
        if (notFound.indexOf(o.nsseparator) > -1) {
            parts = notFound.split(o.nsseparator);
            splitNotFound = parts[1];
        }
        if (splitNotFound === key && o.parseMissingKey) {
            notFound = o.parseMissingKey(notFound);
        }
    
        if (found === undefined) {
            notFound = applyReplacement(notFound, options);
            notFound = applyReuse(notFound, options);
    
            if (postProcessor && postProcessors[postProcessor]) {
                var val = _getDefaultValue(key, options);
                found = postProcessors[postProcessor](val, key, options);
            }
        }
    
        return (found !== undefined) ? found : notFound;
    }
    
    function _find(key, options) {
        options = options || {};
    
        var optionWithoutCount, translated
            , notFound = _getDefaultValue(key, options)
            , lngs = languages;
    
        if (!resStore) { return notFound; } // no resStore to translate from
    
        // CI mode
        if (lngs[0].toLowerCase() === 'cimode') return notFound;
    
        // passed in lng
        if (options.lng) {
            lngs = f.toLanguages(options.lng);
    
            if (!resStore[lngs[0]]) {
                var oldAsync = o.getAsync;
                o.getAsync = false;
    
                TAPi18next.sync.load(lngs, o, function(err, store) {
                    f.extend(resStore, store);
                    o.getAsync = oldAsync;
                });
            }
        }
    
        var ns = options.ns || o.ns.defaultNs;
        if (key.indexOf(o.nsseparator) > -1) {
            var parts = key.split(o.nsseparator);
            ns = parts[0];
            key = parts[1];
        }
    
        if (hasContext(options)) {
            optionWithoutCount = f.extend({}, options);
            delete optionWithoutCount.context;
            optionWithoutCount.defaultValue = o.contextNotFound;
    
            var contextKey = ns + o.nsseparator + key + '_' + options.context;
    
            translated = translate(contextKey, optionWithoutCount);
            if (translated != o.contextNotFound) {
                return applyReplacement(translated, { context: options.context }); // apply replacement for context only
            } // else continue translation with original/nonContext key
        }
    
        if (needsPlural(options)) {
            optionWithoutCount = f.extend({}, options);
            delete optionWithoutCount.count;
            optionWithoutCount.defaultValue = o.pluralNotFound;
    
            var pluralKey = ns + o.nsseparator + key + o.pluralSuffix;
            var pluralExtension = pluralExtensions.get(lngs[0], options.count);
            if (pluralExtension >= 0) {
                pluralKey = pluralKey + '_' + pluralExtension;
            } else if (pluralExtension === 1) {
                pluralKey = ns + o.nsseparator + key; // singular
            }
    
            translated = translate(pluralKey, optionWithoutCount);
            if (translated != o.pluralNotFound) {
                return applyReplacement(translated, {
                    count: options.count,
                    interpolationPrefix: options.interpolationPrefix,
                    interpolationSuffix: options.interpolationSuffix
                }); // apply replacement for count only
            } // else continue translation with original/singular key
        }
    
        var found;
        var keys = key.split(o.keyseparator);
        for (var i = 0, len = lngs.length; i < len; i++ ) {
            if (found !== undefined) break;
    
            var l = lngs[i];
    
            var x = 0;
            var value = resStore[l] && resStore[l][ns];
            while (keys[x]) {
                value = value && value[keys[x]];
                x++;
            }
            if (value !== undefined) {
                var valueType = Object.prototype.toString.apply(value);
                if (typeof value === 'string') {
                    value = applyReplacement(value, options);
                    value = applyReuse(value, options);
                } else if (valueType === '[object Array]' && !o.returnObjectTrees && !options.returnObjectTrees) {
                    value = value.join('\n');
                    value = applyReplacement(value, options);
                    value = applyReuse(value, options);
                } else if (value === null && o.fallbackOnNull === true) {
                    value = undefined;
                } else if (value !== null) {
                    if (!o.returnObjectTrees && !options.returnObjectTrees) {
                        if (o.objectTreeKeyHandler && typeof o.objectTreeKeyHandler == 'function') {
                            value = o.objectTreeKeyHandler(key, value, l, ns, options);
                        } else {
                            value = 'key \'' + ns + ':' + key + ' (' + l + ')\' ' +
                                'returned an object instead of string.';
                            f.log(value);
                        }
                    } else if (valueType !== '[object Number]' && valueType !== '[object Function]' && valueType !== '[object RegExp]') {
                        var copy = (valueType === '[object Array]') ? [] : {}; // apply child translation on a copy
                        f.each(value, function(m) {
                            copy[m] = _translate(ns + o.nsseparator + key + o.keyseparator + m, options);
                        });
                        value = copy;
                    }
                }
    
                if (typeof value === 'string' && value.trim() === '' && o.fallbackOnEmpty === true)
                    value = undefined;
    
                found = value;
            }
        }
    
        if (found === undefined && !options.isFallbackLookup && (o.fallbackToDefaultNS === true || (o.fallbackNS && o.fallbackNS.length > 0))) {
            // set flag for fallback lookup - avoid recursion
            options.isFallbackLookup = true;
    
            if (o.fallbackNS.length) {
    
                for (var y = 0, lenY = o.fallbackNS.length; y < lenY; y++) {
                    found = _find(o.fallbackNS[y] + o.nsseparator + key, options);
    
                    if (found) {
                        /* compare value without namespace */
                        var foundValue = found.indexOf(o.nsseparator) > -1 ? found.split(o.nsseparator)[1] : found
                          , notFoundValue = notFound.indexOf(o.nsseparator) > -1 ? notFound.split(o.nsseparator)[1] : notFound;
    
                        if (foundValue !== notFoundValue) break;
                    }
                }
            } else {
                found = _find(key, options); // fallback to default NS
            }
        }
    
        return found;
    }
    function detectLanguage() {
        var detectedLng;
    
        // get from qs
        var qsParm = [];
        if (typeof window !== 'undefined') {
            (function() {
                var query = window.location.search.substring(1);
                var parms = query.split('&');
                for (var i=0; i<parms.length; i++) {
                    var pos = parms[i].indexOf('=');
                    if (pos > 0) {
                        var key = parms[i].substring(0,pos);
                        var val = parms[i].substring(pos+1);
                        qsParm[key] = val;
                    }
                }
            })();
            if (qsParm[o.detectLngQS]) {
                detectedLng = qsParm[o.detectLngQS];
            }
        }
    
        // get from cookie
        if (!detectedLng && typeof document !== 'undefined' && o.useCookie ) {
            var c = f.cookie.read(o.cookieName);
            if (c) detectedLng = c;
        }
    
        // get from navigator
        if (!detectedLng && typeof navigator !== 'undefined') {
            detectedLng =  (navigator.language) ? navigator.language : navigator.userLanguage;
        }
        
        return detectedLng;
    }
    var sync = {
    
        load: function(lngs, options, cb) {
            if (options.useLocalStorage) {
                sync._loadLocal(lngs, options, function(err, store) {
                    var missingLngs = [];
                    for (var i = 0, len = lngs.length; i < len; i++) {
                        if (!store[lngs[i]]) missingLngs.push(lngs[i]);
                    }
    
                    if (missingLngs.length > 0) {
                        sync._fetch(missingLngs, options, function(err, fetched) {
                            f.extend(store, fetched);
                            sync._storeLocal(fetched);
    
                            cb(null, store);
                        });
                    } else {
                        cb(null, store);
                    }
                });
            } else {
                sync._fetch(lngs, options, function(err, store){
                    cb(null, store);
                });
            }
        },
    
        _loadLocal: function(lngs, options, cb) {
            var store = {}
              , nowMS = new Date().getTime();
    
            if(window.localStorage) {
    
                var todo = lngs.length;
    
                f.each(lngs, function(key, lng) {
                    var local = window.localStorage.getItem('res_' + lng);
    
                    if (local) {
                        local = JSON.parse(local);
    
                        if (local.i18nStamp && local.i18nStamp + options.localStorageExpirationTime > nowMS) {
                            store[lng] = local;
                        }
                    }
    
                    todo--; // wait for all done befor callback
                    if (todo === 0) cb(null, store);
                });
            }
        },
    
        _storeLocal: function(store) {
            if(window.localStorage) {
                for (var m in store) {
                    store[m].i18nStamp = new Date().getTime();
                    window.localStorage.setItem('res_' + m, JSON.stringify(store[m]));
                }
            }
            return;
        },
    
        _fetch: function(lngs, options, cb) {
            var ns = options.ns
              , store = {};
            
            if (!options.dynamicLoad) {
                var todo = ns.namespaces.length * lngs.length
                  , errors;
    
                // load each file individual
                f.each(ns.namespaces, function(nsIndex, nsValue) {
                    f.each(lngs, function(lngIndex, lngValue) {
                        
                        // Call this once our translation has returned.
                        var loadComplete = function(err, data) {
                            if (err) {
                                errors = errors || [];
                                errors.push(err);
                            }
                            store[lngValue] = store[lngValue] || {};
                            store[lngValue][nsValue] = data;
    
                            todo--; // wait for all done befor callback
                            if (todo === 0) cb(errors, store);
                        };
                        
                        if(typeof options.customLoad == 'function'){
                            // Use the specified custom callback.
                            options.customLoad(lngValue, nsValue, options, loadComplete);
                        } else {
                            //~ // Use our inbuilt sync.
                            sync._fetchOne(lngValue, nsValue, options, loadComplete);
                        }
                    });
                });
            } else {
                // Call this once our translation has returned.
                var loadComplete = function(err, data) {
                    cb(null, data);
                };
    
                if(typeof options.customLoad == 'function'){
                    // Use the specified custom callback.
                    options.customLoad(lngs, ns.namespaces, options, loadComplete);
                } else {
                    var url = applyReplacement(options.resGetPath, { lng: lngs.join('+'), ns: ns.namespaces.join('+') });
                    // load all needed stuff once
                    f.ajax({
                        url: url,
                        success: function(data, status, xhr) {
                            f.log('loaded: ' + url);
                            loadComplete(null, data);
                        },
                        error : function(xhr, status, error) {
                            f.log('failed loading: ' + url);
                            loadComplete('failed loading resource.json error: ' + error);
                        },
                        dataType: "json",
                        async : options.getAsync
                    });
                }    
            }
        },
    
        _fetchOne: function(lng, ns, options, done) {
            var url = applyReplacement(options.resGetPath, { lng: lng, ns: ns });
            f.ajax({
                url: url,
                success: function(data, status, xhr) {
                    f.log('loaded: ' + url);
                    done(null, data);
                },
                error : function(xhr, status, error) {
                    if ((status && status == 200) || (xhr && xhr.status && xhr.status == 200)) {
                        // file loaded but invalid json, stop waste time !
                        f.log('There is a typo in: ' + url);
                    } else if ((status && status == 404) || (xhr && xhr.status && xhr.status == 404)) {
                        f.log('Does not exist: ' + url);
                    } else {
                        var theStatus = status ? status : ((xhr && xhr.status) ? xhr.status : null);
                        f.log(theStatus + ' when loading ' + url);
                    }
                    
                    done(error, {});
                },
                dataType: "json",
                async : options.getAsync
            });
        },
    
        postMissing: function(lng, ns, key, defaultValue, lngs) {
            var payload = {};
            payload[key] = defaultValue;
    
            var urls = [];
    
            if (o.sendMissingTo === 'fallback' && o.fallbackLng[0] !== false) {
                for (var i = 0; i < o.fallbackLng.length; i++) {
                    urls.push({lng: o.fallbackLng[i], url: applyReplacement(o.resPostPath, { lng: o.fallbackLng[i], ns: ns })});
                }
            } else if (o.sendMissingTo === 'current' || (o.sendMissingTo === 'fallback' && o.fallbackLng[0] === false) ) {
                urls.push({lng: lng, url: applyReplacement(o.resPostPath, { lng: lng, ns: ns })});
            } else if (o.sendMissingTo === 'all') {
                for (var i = 0, l = lngs.length; i < l; i++) {
                    urls.push({lng: lngs[i], url: applyReplacement(o.resPostPath, { lng: lngs[i], ns: ns })});
                }
            }
    
            for (var y = 0, len = urls.length; y < len; y++) {
                var item = urls[y];
                f.ajax({
                    url: item.url,
                    type: o.sendType,
                    data: payload,
                    success: function(data, status, xhr) {
                        f.log('posted missing key \'' + key + '\' to: ' + item.url);
    
                        // add key to resStore
                        var keys = key.split('.');
                        var x = 0;
                        var value = resStore[item.lng][ns];
                        while (keys[x]) {
                            if (x === keys.length - 1) {
                                value = value[keys[x]] = defaultValue;
                            } else {
                                value = value[keys[x]] = value[keys[x]] || {};
                            }
                            x++;
                        }
                    },
                    error : function(xhr, status, error) {
                        f.log('failed posting missing key \'' + key + '\' to: ' + item.url);
                    },
                    dataType: "json",
                    async : o.postAsync
                });
            }
        }
    };
    // definition http://translate.sourceforge.net/wiki/l10n/pluralforms
    var pluralExtensions = {
    
        rules: {
            "ach": {
                "name": "Acholi", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n > 1); }
            }, 
            "af": {
                "name": "Afrikaans", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "ak": {
                "name": "Akan", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n > 1); }
            }, 
            "am": {
                "name": "Amharic", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n > 1); }
            }, 
            "an": {
                "name": "Aragonese", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "ar": {
                "name": "Arabic", 
                "numbers": [
                    0, 
                    1, 
                    2, 
                    3, 
                    11, 
                    100
                ], 
                "plurals": function(n) { return Number(n===0 ? 0 : n==1 ? 1 : n==2 ? 2 : n%100>=3 && n%100<=10 ? 3 : n%100>=11 ? 4 : 5); }
            }, 
            "arn": {
                "name": "Mapudungun", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n > 1); }
            }, 
            "ast": {
                "name": "Asturian", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "ay": {
                "name": "Aymar\u00e1", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }, 
            "az": {
                "name": "Azerbaijani", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "be": {
                "name": "Belarusian", 
                "numbers": [
                    1, 
                    2, 
                    5
                ], 
                "plurals": function(n) { return Number(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2); }
            }, 
            "bg": {
                "name": "Bulgarian", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "bn": {
                "name": "Bengali", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "bo": {
                "name": "Tibetan", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }, 
            "br": {
                "name": "Breton", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n > 1); }
            }, 
            "bs": {
                "name": "Bosnian", 
                "numbers": [
                    1, 
                    2, 
                    5
                ], 
                "plurals": function(n) { return Number(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2); }
            }, 
            "ca": {
                "name": "Catalan", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "cgg": {
                "name": "Chiga", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }, 
            "cs": {
                "name": "Czech", 
                "numbers": [
                    1, 
                    2, 
                    5
                ], 
                "plurals": function(n) { return Number((n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2); }
            }, 
            "csb": {
                "name": "Kashubian", 
                "numbers": [
                    1, 
                    2, 
                    5
                ], 
                "plurals": function(n) { return Number(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2); }
            }, 
            "cy": {
                "name": "Welsh", 
                "numbers": [
                    1, 
                    2, 
                    3, 
                    8
                ], 
                "plurals": function(n) { return Number((n==1) ? 0 : (n==2) ? 1 : (n != 8 && n != 11) ? 2 : 3); }
            }, 
            "da": {
                "name": "Danish", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "de": {
                "name": "German", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "dz": {
                "name": "Dzongkha", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }, 
            "el": {
                "name": "Greek", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "en": {
                "name": "English", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "eo": {
                "name": "Esperanto", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "es": {
                "name": "Spanish", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "es_ar": {
                "name": "Argentinean Spanish", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "et": {
                "name": "Estonian", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "eu": {
                "name": "Basque", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "fa": {
                "name": "Persian", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }, 
            "fi": {
                "name": "Finnish", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "fil": {
                "name": "Filipino", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n > 1); }
            }, 
            "fo": {
                "name": "Faroese", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "fr": {
                "name": "French", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n > 1); }
            }, 
            "fur": {
                "name": "Friulian", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "fy": {
                "name": "Frisian", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "ga": {
                "name": "Irish", 
                "numbers": [
                    1, 
                    2,
                    3,
                    7, 
                    11
                ], 
                "plurals": function(n) { return Number(n==1 ? 0 : n==2 ? 1 : n<7 ? 2 : n<11 ? 3 : 4) ;}
            }, 
            "gd": {
                "name": "Scottish Gaelic", 
                "numbers": [
                    1, 
                    2, 
                    3,
                    20
                ], 
                "plurals": function(n) { return Number((n==1 || n==11) ? 0 : (n==2 || n==12) ? 1 : (n > 2 && n < 20) ? 2 : 3); }
            }, 
            "gl": {
                "name": "Galician", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "gu": {
                "name": "Gujarati", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "gun": {
                "name": "Gun", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n > 1); }
            }, 
            "ha": {
                "name": "Hausa", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "he": {
                "name": "Hebrew", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "hi": {
                "name": "Hindi", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "hr": {
                "name": "Croatian", 
                "numbers": [
                    1, 
                    2,
                    5
                ], 
                "plurals": function(n) { return Number(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2); }
            }, 
            "hu": {
                "name": "Hungarian", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "hy": {
                "name": "Armenian", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "ia": {
                "name": "Interlingua", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "id": {
                "name": "Indonesian", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }, 
            "is": {
                "name": "Icelandic", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n%10!=1 || n%100==11); }
            }, 
            "it": {
                "name": "Italian", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "ja": {
                "name": "Japanese", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }, 
            "jbo": {
                "name": "Lojban", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }, 
            "jv": {
                "name": "Javanese", 
                "numbers": [
                    0, 
                    1
                ], 
                "plurals": function(n) { return Number(n !== 0); }
            }, 
            "ka": {
                "name": "Georgian", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }, 
            "kk": {
                "name": "Kazakh", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }, 
            "km": {
                "name": "Khmer", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }, 
            "kn": {
                "name": "Kannada", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "ko": {
                "name": "Korean", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }, 
            "ku": {
                "name": "Kurdish", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "kw": {
                "name": "Cornish", 
                "numbers": [
                    1, 
                    2, 
                    3,
                    4
                ], 
                "plurals": function(n) { return Number((n==1) ? 0 : (n==2) ? 1 : (n == 3) ? 2 : 3); }
            }, 
            "ky": {
                "name": "Kyrgyz", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }, 
            "lb": {
                "name": "Letzeburgesch", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "ln": {
                "name": "Lingala", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n > 1); }
            }, 
            "lo": {
                "name": "Lao", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }, 
            "lt": {
                "name": "Lithuanian", 
                "numbers": [
                    1, 
                    2,
                    10
                ], 
                "plurals": function(n) { return Number(n%10==1 && n%100!=11 ? 0 : n%10>=2 && (n%100<10 || n%100>=20) ? 1 : 2); }
            }, 
            "lv": {
                "name": "Latvian", 
                "numbers": [
                    1, 
                    2, 
                    0
                ], 
                "plurals": function(n) { return Number(n%10==1 && n%100!=11 ? 0 : n !== 0 ? 1 : 2); }
            }, 
            "mai": {
                "name": "Maithili", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "mfe": {
                "name": "Mauritian Creole", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n > 1); }
            }, 
            "mg": {
                "name": "Malagasy", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n > 1); }
            }, 
            "mi": {
                "name": "Maori", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n > 1); }
            }, 
            "mk": {
                "name": "Macedonian", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n==1 || n%10==1 ? 0 : 1); }
            }, 
            "ml": {
                "name": "Malayalam", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "mn": {
                "name": "Mongolian", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "mnk": {
                "name": "Mandinka", 
                "numbers": [
                    0, 
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n == 0 ? 0 : n==1 ? 1 : 2); }
            }, 
            "mr": {
                "name": "Marathi", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "ms": {
                "name": "Malay", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }, 
            "mt": {
                "name": "Maltese", 
                "numbers": [
                    1, 
                    2, 
                    11, 
                    20
                ], 
                "plurals": function(n) { return Number(n==1 ? 0 : n===0 || ( n%100>1 && n%100<11) ? 1 : (n%100>10 && n%100<20 ) ? 2 : 3); }
            }, 
            "nah": {
                "name": "Nahuatl", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "nap": {
                "name": "Neapolitan", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "nb": {
                "name": "Norwegian Bokmal", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "ne": {
                "name": "Nepali", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "nl": {
                "name": "Dutch", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "nn": {
                "name": "Norwegian Nynorsk", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "no": {
                "name": "Norwegian", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "nso": {
                "name": "Northern Sotho", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "oc": {
                "name": "Occitan", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n > 1); }
            }, 
            "or": {
                "name": "Oriya", 
                "numbers": [
                    2, 
                    1
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "pa": {
                "name": "Punjabi", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "pap": {
                "name": "Papiamento", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "pl": {
                "name": "Polish", 
                "numbers": [
                    1, 
                    2,
                    5
                ], 
                "plurals": function(n) { return Number(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2); }
            }, 
            "pms": {
                "name": "Piemontese", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "ps": {
                "name": "Pashto", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "pt": {
                "name": "Portuguese", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "pt_br": {
                "name": "Brazilian Portuguese", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "rm": {
                "name": "Romansh", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "ro": {
                "name": "Romanian", 
                "numbers": [
                    1, 
                    2,
                    20
                ], 
                "plurals": function(n) { return Number(n==1 ? 0 : (n===0 || (n%100 > 0 && n%100 < 20)) ? 1 : 2); }
            }, 
            "ru": {
                "name": "Russian", 
                "numbers": [
                    1, 
                    2, 
                    5
                ], 
                "plurals": function(n) { return Number(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2); }
            }, 
            "sah": {
                "name": "Yakut", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }, 
            "sco": {
                "name": "Scots", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "se": {
                "name": "Northern Sami", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "si": {
                "name": "Sinhala", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "sk": {
                "name": "Slovak", 
                "numbers": [
                    1, 
                    2, 
                    5
                ], 
                "plurals": function(n) { return Number((n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2); }
            }, 
            "sl": {
                "name": "Slovenian", 
                "numbers": [
                    5, 
                    1, 
                    2, 
                    3
                ], 
                "plurals": function(n) { return Number(n%100==1 ? 1 : n%100==2 ? 2 : n%100==3 || n%100==4 ? 3 : 0); }
            }, 
            "so": {
                "name": "Somali", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "son": {
                "name": "Songhay", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "sq": {
                "name": "Albanian", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "sr": {
                "name": "Serbian", 
                "numbers": [
                    1, 
                    2,
                    5
                ], 
                "plurals": function(n) { return Number(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2); }
            }, 
            "su": {
                "name": "Sundanese", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }, 
            "sv": {
                "name": "Swedish", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "sw": {
                "name": "Swahili", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "ta": {
                "name": "Tamil", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "te": {
                "name": "Telugu", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "tg": {
                "name": "Tajik", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n > 1); }
            }, 
            "th": {
                "name": "Thai", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }, 
            "ti": {
                "name": "Tigrinya", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n > 1); }
            }, 
            "tk": {
                "name": "Turkmen", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "tr": {
                "name": "Turkish", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n > 1); }
            }, 
            "tt": {
                "name": "Tatar", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }, 
            "ug": {
                "name": "Uyghur", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }, 
            "uk": {
                "name": "Ukrainian", 
                "numbers": [
                    1, 
                    2,
                    5
                ], 
                "plurals": function(n) { return Number(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2); }
            }, 
            "ur": {
                "name": "Urdu", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "uz": {
                "name": "Uzbek", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n > 1); }
            }, 
            "vi": {
                "name": "Vietnamese", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }, 
            "wa": {
                "name": "Walloon", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n > 1); }
            }, 
            "wo": {
                "name": "Wolof", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }, 
            "yo": {
                "name": "Yoruba", 
                "numbers": [
                    1, 
                    2
                ], 
                "plurals": function(n) { return Number(n != 1); }
            }, 
            "zh": {
                "name": "Chinese", 
                "numbers": [
                    1
                ], 
                "plurals": function(n) { return 0; }
            }
        },
    
        // for demonstration only sl and ar is added but you can add your own pluralExtensions
        addRule: function(lng, obj) {
            pluralExtensions.rules[lng] = obj;    
        },
    
        setCurrentLng: function(lng) {
            if (!pluralExtensions.currentRule || pluralExtensions.currentRule.lng !== lng) {
                var parts = lng.split('-');
    
                pluralExtensions.currentRule = {
                    lng: lng,
                    rule: pluralExtensions.rules[parts[0]]
                };
            }
        },
    
        get: function(lng, count) {
            var parts = lng.split('-');
    
            function getResult(l, c) {
                var ext;
                if (pluralExtensions.currentRule && pluralExtensions.currentRule.lng === lng) {
                    ext = pluralExtensions.currentRule.rule; 
                } else {
                    ext = pluralExtensions.rules[l];
                }
                if (ext) {
                    var i = ext.plurals(c);
                    var number = ext.numbers[i];
                    if (ext.numbers.length === 2 && ext.numbers[0] === 1) {
                        if (number === 2) { 
                            number = -1; // regular plural
                        } else if (number === 1) {
                            number = 1; // singular
                        }
                    }//console.log(count + '-' + number);
                    return number;
                } else {
                    return c === 1 ? '1' : '-1';
                }
            }
                        
            return getResult(parts[0], count);
        }
    
    };
    var postProcessors = {};
    var addPostProcessor = function(name, fc) {
        postProcessors[name] = fc;
    };
    // sprintf support
    var sprintf = (function() {
        function get_type(variable) {
            return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
        }
        function str_repeat(input, multiplier) {
            for (var output = []; multiplier > 0; output[--multiplier] = input) {/* do nothing */}
            return output.join('');
        }
    
        var str_format = function() {
            if (!str_format.cache.hasOwnProperty(arguments[0])) {
                str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
            }
            return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
        };
    
        str_format.format = function(parse_tree, argv) {
            var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
            for (i = 0; i < tree_length; i++) {
                node_type = get_type(parse_tree[i]);
                if (node_type === 'string') {
                    output.push(parse_tree[i]);
                }
                else if (node_type === 'array') {
                    match = parse_tree[i]; // convenience purposes only
                    if (match[2]) { // keyword argument
                        arg = argv[cursor];
                        for (k = 0; k < match[2].length; k++) {
                            if (!arg.hasOwnProperty(match[2][k])) {
                                throw(sprintf('[sprintf] property "%s" does not exist', match[2][k]));
                            }
                            arg = arg[match[2][k]];
                        }
                    }
                    else if (match[1]) { // positional argument (explicit)
                        arg = argv[match[1]];
                    }
                    else { // positional argument (implicit)
                        arg = argv[cursor++];
                    }
    
                    if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
                        throw(sprintf('[sprintf] expecting number but found %s', get_type(arg)));
                    }
                    switch (match[8]) {
                        case 'b': arg = arg.toString(2); break;
                        case 'c': arg = String.fromCharCode(arg); break;
                        case 'd': arg = parseInt(arg, 10); break;
                        case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
                        case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
                        case 'o': arg = arg.toString(8); break;
                        case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
                        case 'u': arg = Math.abs(arg); break;
                        case 'x': arg = arg.toString(16); break;
                        case 'X': arg = arg.toString(16).toUpperCase(); break;
                    }
                    arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
                    pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
                    pad_length = match[6] - String(arg).length;
                    pad = match[6] ? str_repeat(pad_character, pad_length) : '';
                    output.push(match[5] ? arg + pad : pad + arg);
                }
            }
            return output.join('');
        };
    
        str_format.cache = {};
    
        str_format.parse = function(fmt) {
            var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
            while (_fmt) {
                if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
                    parse_tree.push(match[0]);
                }
                else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
                    parse_tree.push('%');
                }
                else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
                    if (match[2]) {
                        arg_names |= 1;
                        var field_list = [], replacement_field = match[2], field_match = [];
                        if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                            field_list.push(field_match[1]);
                            while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                                if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                                    field_list.push(field_match[1]);
                                }
                                else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
                                    field_list.push(field_match[1]);
                                }
                                else {
                                    throw('[sprintf] huh?');
                                }
                            }
                        }
                        else {
                            throw('[sprintf] huh?');
                        }
                        match[2] = field_list;
                    }
                    else {
                        arg_names |= 2;
                    }
                    if (arg_names === 3) {
                        throw('[sprintf] mixing positional and named placeholders is not (yet) supported');
                    }
                    parse_tree.push(match);
                }
                else {
                    throw('[sprintf] huh?');
                }
                _fmt = _fmt.substring(match[0].length);
            }
            return parse_tree;
        };
    
        return str_format;
    })();
    
    var vsprintf = function(fmt, argv) {
        argv.unshift(fmt);
        return sprintf.apply(null, argv);
    };
    
    addPostProcessor("sprintf", function(val, key, opts) {
        if (!opts.sprintf) return val;
    
        if (Object.prototype.toString.apply(opts.sprintf) === '[object Array]') {
            return vsprintf(val, opts.sprintf);
        } else if (typeof opts.sprintf === 'object') {
            return sprintf(val, opts.sprintf);
        }
    
        return val;
    });
    // public api interface
    TAPi18next.init = init;
    TAPi18next.setLng = setLng;
    TAPi18next.preload = preload;
    TAPi18next.addResourceBundle = addResourceBundle;
    TAPi18next.removeResourceBundle = removeResourceBundle;
    TAPi18next.loadNamespace = loadNamespace;
    TAPi18next.loadNamespaces = loadNamespaces;
    TAPi18next.setDefaultNamespace = setDefaultNamespace;
    TAPi18next.t = translate;
    TAPi18next.translate = translate;
    TAPi18next.exists = exists;
    TAPi18next.detectLanguage = f.detectLanguage;
    TAPi18next.pluralExtensions = pluralExtensions;
    TAPi18next.sync = sync;
    TAPi18next.functions = f;
    TAPi18next.lng = lng;
    TAPi18next.addPostProcessor = addPostProcessor;
    TAPi18next.options = o;
})();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/tap_i18n/lib/tap_i18next/tap_i18next_init.js                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
TAPi18next.init({resStore: {}, fallbackLng: globals.fallback_language, useCookie: false});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/tap_i18n/lib/tap_i18n/tap_i18n-helpers.coffee                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
share.helpers = {};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/tap_i18n/lib/tap_i18n/tap_i18n-common.coffee                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var fallback_language;         

fallback_language = globals.fallback_language;

TAPi18n = function() {
  EventEmitter.call(this);
  this._fallback_language = fallback_language;
  this._language_changed_tracker = new Tracker.Dependency;
  this._loaded_languages = [fallback_language];
  this.conf = null;
  this.packages = {};
  this.languages_names = {};
  this.translations = {};
  if (Meteor.isClient) {
    Session.set(this._loaded_lang_session_key, null);
    this._languageSpecificTranslators = {};
    this._languageSpecificTranslatorsTrackers = {};
  }
  if (Meteor.isServer) {
    this.server_translators = {};
    Meteor.startup((function(_this) {
      return function() {
        if (_this._enabled()) {
          return _this._registerHTTPMethod();
        }
      };
    })(this));
  }
  this.__ = this._getPackageI18nextProxy(globals.project_translations_domain);
  TAPi18next.setLng(fallback_language);
  return this;
};

Util.inherits(TAPi18n, EventEmitter);

_.extend(TAPi18n.prototype, {
  _loaded_lang_session_key: "TAPi18n::loaded_lang",
  _enable: function(conf) {
    this.conf = conf;
    return this._onceEnabled();
  },
  _onceEnabled: function() {},
  _enabled: function() {
    return this.conf != null;
  },
  _getPackageDomain: function(package_name) {
    return package_name.replace(/:/g, "-");
  },
  addResourceBundle: function(lang_tag, package_name, translations) {
    return TAPi18next.addResourceBundle(lang_tag, this._getPackageDomain(package_name), translations);
  },
  _getSpecificLangTranslator: function(lang) {
    var current_lang, translator;
    current_lang = TAPi18next.lng();
    translator = null;
    TAPi18next.setLng(lang, {
      fixLng: true
    }, (function(_this) {
      return function(lang_translator) {
        return translator = lang_translator;
      };
    })(this));
    TAPi18next.setLng(current_lang);
    return translator;
  },
  _getProjectLanguages: function() {
    if (this._enabled()) {
      if (_.isArray(this.conf.supported_languages)) {
        return _.union([this._fallback_language], this.conf.supported_languages);
      } else {
        return _.keys(this.languages_names);
      }
    } else {
      return [this._fallback_language];
    }
  },
  getLanguages: function() {
    var i, lang_tag, languages, len, ref;
    if (!this._enabled()) {
      return null;
    }
    languages = {};
    ref = this._getProjectLanguages();
    for (i = 0, len = ref.length; i < len; i++) {
      lang_tag = ref[i];
      languages[lang_tag] = {
        name: this.languages_names[lang_tag][1],
        en: this.languages_names[lang_tag][0]
      };
    }
    return languages;
  },
  _loadLangFileObject: function(language_tag, data) {
    var package_keys, package_name, ref, results;
    results = [];
    for (package_name in data) {
      package_keys = data[package_name];
      package_keys = _.extend({}, package_keys, ((ref = this._loadTranslations_cache[language_tag]) != null ? ref[package_name] : void 0) || {});
      results.push(this.addResourceBundle(language_tag, package_name, package_keys));
    }
    return results;
  },
  _loadTranslations_cache: {},
  loadTranslations: function(translations, namespace) {
    var language_tag, project_languages, results, translation_keys;
    project_languages = this._getProjectLanguages();
    results = [];
    for (language_tag in translations) {
      translation_keys = translations[language_tag];
      if (this._loadTranslations_cache[language_tag] == null) {
        this._loadTranslations_cache[language_tag] = {};
      }
      if (this._loadTranslations_cache[language_tag][namespace] == null) {
        this._loadTranslations_cache[language_tag][namespace] = {};
      }
      _.extend(this._loadTranslations_cache[language_tag][namespace], translation_keys);
      this.addResourceBundle(language_tag, namespace, translation_keys);
      if (Meteor.isClient && this.getLanguage() === language_tag) {
        results.push(this._language_changed_tracker.changed());
      } else {
        results.push(void 0);
      }
    }
    return results;
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/tap_i18n/lib/tap_i18n/tap_i18n-server.coffee                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var indexOf = [].indexOf || function (item) {
  for (var i = 0, l = this.length; i < l; i++) {
    if (i in this && this[i] === item) return i;
  }

  return -1;
};

_.extend(TAPi18n.prototype, {
  server_translators: null,
  _registerServerTranslator: function (lang_tag, package_name) {
    if (this._enabled()) {
      if (!(lang_tag in this.server_translators)) {
        this.server_translators[lang_tag] = this._getSpecificLangTranslator(lang_tag);
      }

      if (lang_tag !== this._fallback_language) {
        this.addResourceBundle(lang_tag, package_name, this.translations[lang_tag][package_name]);
      }
    }

    if (!(this._fallback_language in this.server_translators)) {
      return this.server_translators[this._fallback_language] = this._getSpecificLangTranslator(this._fallback_language);
    }
  },
  _registerAllServerTranslators: function () {
    var i, lang_tag, len, package_name, ref, results;
    ref = this._getProjectLanguages();
    results = [];

    for (i = 0, len = ref.length; i < len; i++) {
      lang_tag = ref[i];
      results.push(function () {
        var results1;
        results1 = [];

        for (package_name in meteorBabelHelpers.sanitizeForInObject(this.translations[lang_tag])) {
          results1.push(this._registerServerTranslator(lang_tag, package_name));
        }

        return results1;
      }.call(this));
    }

    return results;
  },
  _getPackageI18nextProxy: function (package_name) {
    return function (_this) {
      return function (key, options, lang_tag) {
        if (lang_tag == null) {
          lang_tag = null;
        }

        if (lang_tag == null) {
          return _this.server_translators[_this._fallback_language](_this._getPackageDomain(package_name) + ":" + key, options);
        } else if (!(lang_tag in _this.server_translators)) {
          console.log("Warning: language " + lang_tag + " is not supported in this project, fallback language (" + _this._fallback_language + ")");
          return _this.server_translators[_this._fallback_language](_this._getPackageDomain(package_name) + ":" + key, options);
        } else {
          return _this.server_translators[lang_tag](_this._getPackageDomain(package_name) + ":" + key, options);
        }
      };
    }(this);
  },
  _registerHTTPMethod: function () {
    var methods, self;
    self = this;
    methods = {};

    if (!self._enabled()) {
      throw new Meteor.Error(500, "tap-i18n has to be enabled in order to register the HTTP method");
    }

    methods[self.conf.i18n_files_route.replace(/\/$/, "") + "/multi/:langs"] = {
      get: function () {
        var i, lang_tag, langs, language_translations, len, output;

        if (!RegExp("^((" + globals.langauges_tags_regex + ",)*" + globals.langauges_tags_regex + "|all).json$").test(this.params.langs)) {
          return this.setStatusCode(401);
        }

        langs = this.params.langs.replace(".json", "");

        if (langs === "all") {
          output = self.translations;
        } else {
          output = {};
          langs = langs.split(",");

          for (i = 0, len = langs.length; i < len; i++) {
            lang_tag = langs[i];

            if (indexOf.call(self._getProjectLanguages(), lang_tag) >= 0 && lang_tag !== self._fallback_language) {
              language_translations = self.translations[lang_tag];

              if (language_translations != null) {
                output[lang_tag] = language_translations;
              }
            }
          }
        }

        return JSON.stringify(output);
      }
    };
    methods[self.conf.i18n_files_route.replace(/\/$/, "") + "/:lang"] = {
      get: function () {
        var lang_tag, language_translations;

        if (!RegExp("^" + globals.langauges_tags_regex + ".json$").test(this.params.lang)) {
          return this.setStatusCode(401);
        }

        lang_tag = this.params.lang.replace(".json", "");

        if (indexOf.call(self._getProjectLanguages(), lang_tag) < 0 || lang_tag === self._fallback_language) {
          return this.setStatusCode(404);
        }

        language_translations = self.translations[lang_tag];
        return JSON.stringify(language_translations != null ? language_translations : {});
      }
    };
    return HTTP.methods(methods);
  },
  _onceEnabled: function () {
    return this._registerAllServerTranslators();
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/tap_i18n/lib/tap_i18n/tap_i18n-init.coffee                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
            

TAPi18n = new TAPi18n();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("tap:i18n", {
  TAPi18next: TAPi18next,
  TAPi18n: TAPi18n
});

})();

//# sourceURL=meteor://💻app/packages/tap_i18n.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvdGFwX2kxOG4vbGliL3RhcF9pMThuL3RhcF9pMThuLWhlbHBlcnMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy90YXBfaTE4bi9saWIvdGFwX2kxOG4vdGFwX2kxOG4tY29tbW9uLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvdGFwX2kxOG4vbGliL3RhcF9pMThuL3RhcF9pMThuLXNlcnZlci5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL2xpYi90YXBfaTE4bi90YXBfaTE4bi1zZXJ2ZXIuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy90YXBfaTE4bi9saWIvdGFwX2kxOG4vdGFwX2kxOG4taW5pdC5jb2ZmZWUiXSwibmFtZXMiOlsic2hhcmUiLCJoZWxwZXJzIiwiaW5kZXhPZiIsIml0ZW0iLCJpIiwibCIsImxlbmd0aCIsIl8iLCJleHRlbmQiLCJUQVBpMThuIiwicHJvdG90eXBlIiwic2VydmVyX3RyYW5zbGF0b3JzIiwiX3JlZ2lzdGVyU2VydmVyVHJhbnNsYXRvciIsImxhbmdfdGFnIiwicGFja2FnZV9uYW1lIiwiX2VuYWJsZWQiLCJfZ2V0U3BlY2lmaWNMYW5nVHJhbnNsYXRvciIsIl9mYWxsYmFja19sYW5ndWFnZSIsImFkZFJlc291cmNlQnVuZGxlIiwidHJhbnNsYXRpb25zIiwiX3JlZ2lzdGVyQWxsU2VydmVyVHJhbnNsYXRvcnMiLCJsZW4iLCJyZWYiLCJyZXN1bHRzIiwiX2dldFByb2plY3RMYW5ndWFnZXMiLCJwdXNoIiwicmVzdWx0czEiLCJjYWxsIiwiX2dldFBhY2thZ2VJMThuZXh0UHJveHkiLCJfdGhpcyIsImtleSIsIm9wdGlvbnMiLCJfZ2V0UGFja2FnZURvbWFpbiIsImNvbnNvbGUiLCJsb2ciLCJfcmVnaXN0ZXJIVFRQTWV0aG9kIiwibWV0aG9kcyIsInNlbGYiLCJNZXRlb3IiLCJFcnJvciIsImNvbmYiLCJpMThuX2ZpbGVzX3JvdXRlIiwicmVwbGFjZSIsImdldCIsImxhbmdzIiwibGFuZ3VhZ2VfdHJhbnNsYXRpb25zIiwib3V0cHV0IiwiUmVnRXhwIiwiZ2xvYmFscyIsImxhbmdhdWdlc190YWdzX3JlZ2V4IiwidGVzdCIsInBhcmFtcyIsInNldFN0YXR1c0NvZGUiLCJzcGxpdCIsIkpTT04iLCJzdHJpbmdpZnkiLCJsYW5nIiwiSFRUUCIsIl9vbmNlRW5hYmxlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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bUMsYUFBRCxDQUFlLEdBQWYsQ0FBUDtBQ29CRDs7QURsQkRQLGdDQUF3QlIsS0FBS2xCLFlBQUwsQ0FBa0JOLFFBQWxCLENBQXhCO0FBS0EsZUFBT3lDLEtBQUtDLFNBQUwsQ0FBa0JWLHlCQUFBLE9BQTRCQSxxQkFBNUIsR0FBdUQsRUFBekUsQ0FBUDtBQWZGO0FBQUEsS0FERjtBQ2tDQSxXRGhCQVksS0FBS3JCLE9BQUwsQ0FBYUEsT0FBYixDQ2dCQTtBRGhHRjtBQWtGQXNCLGdCQUFjO0FDaUJaLFdEaEJBLEtBQUN0Qyw2QkFBRCxFQ2dCQTtBRG5HRjtBQUFBLENBREYsRTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBRUFBOztBQUFBLFVBQVUsSUFBSSxPQUFKIiwiZmlsZSI6Ii9wYWNrYWdlcy90YXBfaTE4bi5qcyIsInNvdXJjZXNDb250ZW50IjpbInNoYXJlLmhlbHBlcnMgPSB7fSIsImZhbGxiYWNrX2xhbmd1YWdlID0gZ2xvYmFscy5mYWxsYmFja19sYW5ndWFnZVxuXG5UQVBpMThuID0gLT5cbiAgRXZlbnRFbWl0dGVyLmNhbGwgQFxuXG4gIEBfZmFsbGJhY2tfbGFuZ3VhZ2UgPSBmYWxsYmFja19sYW5ndWFnZVxuXG4gIEBfbGFuZ3VhZ2VfY2hhbmdlZF90cmFja2VyID0gbmV3IFRyYWNrZXIuRGVwZW5kZW5jeVxuXG4gIEBfbG9hZGVkX2xhbmd1YWdlcyA9IFtmYWxsYmFja19sYW5ndWFnZV0gIyBzdG9yZXMgdGhlIGxvYWRlZCBsYW5ndWFnZXMsIHRoZSBmYWxsYmFjayBsYW5ndWFnZSBpcyBsb2FkZWQgYXV0b21hdGljYWxseVxuXG4gIEBjb25mID0gbnVsbCAjIElmIGNvbmYgaXNuJ3QgbnVsbCB3ZSBhc3N1bWUgdGhhdCB0YXA6aTE4biBpcyBlbmFibGVkIGZvciB0aGUgcHJvamVjdC5cbiAgICAgICAgICAgICAjIFdlIGFzc3VtZSBjb25mIGlzIHZhbGlkLCB3ZSBzdGVyaWxpemUgYW5kIHZhbGlkYXRlIGl0IGR1cmluZyB0aGUgYnVpbGQgcHJvY2Vzcy5cblxuICBAcGFja2FnZXMgPSB7fSAjIFN0b3JlcyB0aGUgcGFja2FnZXMnIHBhY2thZ2UtdGFwLmkxOG4ganNvbnNcblxuICBAbGFuZ3VhZ2VzX25hbWVzID0ge30gIyBTdG9yZXMgbGFuZ3VhZ2VzIHRoYXQgd2UndmUgZm91bmQgbGFuZ3VhZ2VzIGZpbGVzIGZvciBpbiB0aGUgcHJvamVjdCBkaXIuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgZm9ybWF0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAgICBsYW5nX3RhZzogW2xhbmdfbmFtZV9pbl9lbmdsaXNoLCBsYW5nX25hbWVfaW5fbG9jYWxfbGFuZ3VhZ2VdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgfVxuXG4gIEB0cmFuc2xhdGlvbnMgPSB7fSAjIFN0b3JlcyB0aGUgcGFja2FnZXMvcHJvamVjdCB0cmFuc2xhdGlvbnMgLSBTZXJ2ZXIgc2lkZSBvbmx5XG4gICAgICAgICAgICAgICAgICAgIyBmYWxsYmFja19sYW5ndWFnZSB0cmFuc2xhdGlvbnMgYXJlIG5vdCBzdG9yZWQgaGVyZVxuXG5cbiAgaWYgTWV0ZW9yLmlzQ2xpZW50XG4gICAgU2Vzc2lvbi5zZXQgQF9sb2FkZWRfbGFuZ19zZXNzaW9uX2tleSwgbnVsbFxuXG4gICAgQF9sYW5ndWFnZVNwZWNpZmljVHJhbnNsYXRvcnMgPSB7fVxuICAgIEBfbGFuZ3VhZ2VTcGVjaWZpY1RyYW5zbGF0b3JzVHJhY2tlcnMgPSB7fVxuXG4gIGlmIE1ldGVvci5pc1NlcnZlclxuICAgIEBzZXJ2ZXJfdHJhbnNsYXRvcnMgPSB7fVxuXG4gICAgTWV0ZW9yLnN0YXJ0dXAgPT5cbiAgICAgICMgSWYgdGFwLWkxOG4gaXMgZW5hYmxlZCBmb3IgdGhhdCBwcm9qZWN0XG4gICAgICBpZiBAX2VuYWJsZWQoKVxuICAgICAgICBAX3JlZ2lzdGVySFRUUE1ldGhvZCgpXG5cbiAgQF9fID0gQF9nZXRQYWNrYWdlSTE4bmV4dFByb3h5KGdsb2JhbHMucHJvamVjdF90cmFuc2xhdGlvbnNfZG9tYWluKVxuXG4gIFRBUGkxOG5leHQuc2V0TG5nIGZhbGxiYWNrX2xhbmd1YWdlXG5cbiAgcmV0dXJuIEBcblxuVXRpbC5pbmhlcml0cyBUQVBpMThuLCBFdmVudEVtaXR0ZXJcblxuXy5leHRlbmQgVEFQaTE4bi5wcm90b3R5cGUsXG4gIF9sb2FkZWRfbGFuZ19zZXNzaW9uX2tleTogXCJUQVBpMThuOjpsb2FkZWRfbGFuZ1wiXG5cbiAgX2VuYWJsZTogKGNvbmYpIC0+XG4gICAgIyB0YXA6aTE4biBnZXRzIGVuYWJsZWQgZm9yIGEgcHJvamVjdCBvbmNlIGEgY29uZiBmaWxlIGlzIHNldCBmb3IgaXQuXG4gICAgIyBJdCBjYW4gYmUgZWl0aGVyIGEgY29uZiBvYmplY3QgdGhhdCB3YXMgc2V0IGJ5IHByb2plY3QtdGFwLmkxOG4gZmlsZSBvclxuICAgICMgYSBkZWZhdWx0IGNvbmYsIHdoaWNoIGlzIGJlaW5nIGFkZGVkIGlmIHRoZSBwcm9qZWN0IGhhcyBsYW5nIGZpbGVzXG4gICAgIyAoKi5pMThuLmpzb24pIGJ1dCBub3QgcHJvamVjdC10YXAuaTE4blxuICAgIEBjb25mID0gY29uZlxuXG4gICAgQC5fb25jZUVuYWJsZWQoKVxuXG4gIF9vbmNlRW5hYmxlZDogKCkgLT5cbiAgICAjIFRoZSBhcmNoIHNwZWNpZmljIGNvZGUgY2FuIHVzZSB0aGlzIGZvciBwcm9jZWR1cmVzIHRoYXQgc2hvdWxkIGJlIHBlcmZvcm1lZCBvbmNlXG4gICAgIyB0YXA6aTE4biBnZXRzIGVuYWJsZWQgKHByb2plY3QgY29uZiBmaWxlIGlzIGJlaW5nIHNldClcbiAgICByZXR1cm5cblxuICBfZW5hYmxlZDogLT5cbiAgICAjIHJlYWQgdGhlIGNvbW1lbnQgb2YgQGNvbmZcbiAgICBAY29uZj9cblxuICBfZ2V0UGFja2FnZURvbWFpbjogKHBhY2thZ2VfbmFtZSkgLT5cbiAgICBwYWNrYWdlX25hbWUucmVwbGFjZSgvOi9nLCBcIi1cIilcblxuICBhZGRSZXNvdXJjZUJ1bmRsZTogKGxhbmdfdGFnLCBwYWNrYWdlX25hbWUsIHRyYW5zbGF0aW9ucykgLT5cbiAgICBUQVBpMThuZXh0LmFkZFJlc291cmNlQnVuZGxlKGxhbmdfdGFnLCBAX2dldFBhY2thZ2VEb21haW4ocGFja2FnZV9uYW1lKSwgdHJhbnNsYXRpb25zKVxuXG4gIF9nZXRTcGVjaWZpY0xhbmdUcmFuc2xhdG9yOiAobGFuZykgLT5cbiAgICBjdXJyZW50X2xhbmcgPSBUQVBpMThuZXh0LmxuZygpXG5cbiAgICB0cmFuc2xhdG9yID0gbnVsbFxuICAgIFRBUGkxOG5leHQuc2V0TG5nIGxhbmcsIHtmaXhMbmc6IHRydWV9LCAobGFuZ190cmFuc2xhdG9yKSA9PlxuICAgICAgdHJhbnNsYXRvciA9IGxhbmdfdHJhbnNsYXRvclxuXG4gICAgIyBSZXN0b3JlIGkxOG5leHQgbGFuZyB0aGF0IGhhZCBiZWVuIGNoYW5nZWQgaW4gdGhlIHByb2Nlc3Mgb2YgZ2VuZXJhdGluZ1xuICAgICMgbGFuZyBzcGVjaWZpYyB0cmFuc2xhdG9yXG4gICAgVEFQaTE4bmV4dC5zZXRMbmcgY3VycmVudF9sYW5nXG5cbiAgICByZXR1cm4gdHJhbnNsYXRvclxuXG4gIF9nZXRQcm9qZWN0TGFuZ3VhZ2VzOiAoKSAtPlxuICAgICMgUmV0dXJuIGFuIGFycmF5IG9mIGxhbmd1YWdlcyBhdmFpbGFibGUgZm9yIHRoZSBjdXJyZW50IHByb2plY3RcbiAgICBpZiBALl9lbmFibGVkKClcbiAgICAgIGlmIF8uaXNBcnJheSBALmNvbmYuc3VwcG9ydGVkX2xhbmd1YWdlc1xuICAgICAgICByZXR1cm4gXy51bmlvbihbQC5fZmFsbGJhY2tfbGFuZ3VhZ2VdLCBALmNvbmYuc3VwcG9ydGVkX2xhbmd1YWdlcylcbiAgICAgIGVsc2VcbiAgICAgICAgIyBJZiBzdXBwb3J0ZWRfbGFuZ3VhZ2VzIGlzIG51bGwsIGFsbCB0aGUgbGFuZ3VhZ2VzIHdlIGZvdW5kXG4gICAgICAgICMgdHJhbnNsYXRpb25zIGZpbGVzIHRvIGluIHRoZSBwcm9qZWN0IGxldmVsIGFyZSBjb25zaWRlcmVkIHN1cHBvcnRlZC5cbiAgICAgICAgIyBXZSB1c2UgdGhlIEAubGFuZ3VhZ2VzX25hbWVzIGFycmF5IHRvIHRlbGwgd2hpY2ggbGFuZ3VhZ2VzIHdlIGZvdW5kXG4gICAgICAgICMgc2luY2UgZm9yIGV2ZXJ5IGkxOG4uanNvbiBmaWxlIHdlIGZvdW5kIGluIHRoZSBwcm9qZWN0IGxldmVsIHdlIGFkZFxuICAgICAgICAjIGFuIGVudHJ5IGZvciBpdHMgbGFuZ3VhZ2UgdG8gQC5sYW5ndWFnZXNfbmFtZXMgaW4gdGhlIGJ1aWxkIHByb2Nlc3MuXG4gICAgICAgICNcbiAgICAgICAgIyBXZSBhbHNvIGtub3cgZm9yIGNlcnRhaW4gdGhhdCB3aGVuIHRhcC1pMThuIGlzIGVuYWJsZWQgdGhlIGZhbGxiYWNrXG4gICAgICAgICMgbGFuZyBpcyBpbiBALmxhbmd1YWdlc19uYW1lc1xuICAgICAgICByZXR1cm4gXy5rZXlzIEAubGFuZ3VhZ2VzX25hbWVzXG4gICAgZWxzZVxuICAgICAgcmV0dXJuIFtALl9mYWxsYmFja19sYW5ndWFnZV1cblxuICBnZXRMYW5ndWFnZXM6IC0+XG4gICAgaWYgbm90IEAuX2VuYWJsZWQoKVxuICAgICAgcmV0dXJuIG51bGxcblxuICAgIGxhbmd1YWdlcyA9IHt9XG4gICAgZm9yIGxhbmdfdGFnIGluIEAuX2dldFByb2plY3RMYW5ndWFnZXMoKVxuICAgICAgbGFuZ3VhZ2VzW2xhbmdfdGFnXSA9XG4gICAgICAgIG5hbWU6IEAubGFuZ3VhZ2VzX25hbWVzW2xhbmdfdGFnXVsxXVxuICAgICAgICBlbjogQC5sYW5ndWFnZXNfbmFtZXNbbGFuZ190YWddWzBdXG5cbiAgICBsYW5ndWFnZXNcblxuICBfbG9hZExhbmdGaWxlT2JqZWN0OiAobGFuZ3VhZ2VfdGFnLCBkYXRhKSAtPlxuICAgIGZvciBwYWNrYWdlX25hbWUsIHBhY2thZ2Vfa2V5cyBvZiBkYXRhXG4gICAgICAjIFRyYW5zbGF0aW9ucyB0aGF0IGFyZSBhZGRlZCBieSBsb2FkVHJhbnNsYXRpb25zKCkgaGF2ZSBoaWdoZXIgcHJpb3JpdHlcbiAgICAgIHBhY2thZ2Vfa2V5cyA9IF8uZXh0ZW5kKHt9LCBwYWNrYWdlX2tleXMsIEBfbG9hZFRyYW5zbGF0aW9uc19jYWNoZVtsYW5ndWFnZV90YWddP1twYWNrYWdlX25hbWVdIG9yIHt9KVxuXG4gICAgICBAYWRkUmVzb3VyY2VCdW5kbGUobGFuZ3VhZ2VfdGFnLCBwYWNrYWdlX25hbWUsIHBhY2thZ2Vfa2V5cylcblxuICBfbG9hZFRyYW5zbGF0aW9uc19jYWNoZToge31cbiAgbG9hZFRyYW5zbGF0aW9uczogKHRyYW5zbGF0aW9ucywgbmFtZXNwYWNlKSAtPlxuICAgIHByb2plY3RfbGFuZ3VhZ2VzID0gQF9nZXRQcm9qZWN0TGFuZ3VhZ2VzKClcblxuICAgIGZvciBsYW5ndWFnZV90YWcsIHRyYW5zbGF0aW9uX2tleXMgb2YgdHJhbnNsYXRpb25zXG4gICAgICBpZiBub3QgQF9sb2FkVHJhbnNsYXRpb25zX2NhY2hlW2xhbmd1YWdlX3RhZ10/XG4gICAgICAgIEBfbG9hZFRyYW5zbGF0aW9uc19jYWNoZVtsYW5ndWFnZV90YWddID0ge31cblxuICAgICAgaWYgbm90IEBfbG9hZFRyYW5zbGF0aW9uc19jYWNoZVtsYW5ndWFnZV90YWddW25hbWVzcGFjZV0/XG4gICAgICAgIEBfbG9hZFRyYW5zbGF0aW9uc19jYWNoZVtsYW5ndWFnZV90YWddW25hbWVzcGFjZV0gPSB7fVxuXG4gICAgICBfLmV4dGVuZChAX2xvYWRUcmFuc2xhdGlvbnNfY2FjaGVbbGFuZ3VhZ2VfdGFnXVtuYW1lc3BhY2VdLCB0cmFuc2xhdGlvbl9rZXlzKVxuXG4gICAgICBAYWRkUmVzb3VyY2VCdW5kbGUobGFuZ3VhZ2VfdGFnLCBuYW1lc3BhY2UsIHRyYW5zbGF0aW9uX2tleXMpXG5cbiAgICAgIGlmIE1ldGVvci5pc0NsaWVudCBhbmQgQGdldExhbmd1YWdlKCkgPT0gbGFuZ3VhZ2VfdGFnXG4gICAgICAgICMgUmV0cmFuc2xhdGUgaWYgc2Vzc2lvbiBsYW5ndWFnZSB1cGRhdGVkXG4gICAgICAgIEBfbGFuZ3VhZ2VfY2hhbmdlZF90cmFja2VyLmNoYW5nZWQoKSIsIl8uZXh0ZW5kIFRBUGkxOG4ucHJvdG90eXBlLFxuICBzZXJ2ZXJfdHJhbnNsYXRvcnM6IG51bGxcblxuICBfcmVnaXN0ZXJTZXJ2ZXJUcmFuc2xhdG9yOiAobGFuZ190YWcsIHBhY2thZ2VfbmFtZSkgLT5cbiAgICBpZiBAX2VuYWJsZWQoKVxuICAgICAgaWYgbm90KGxhbmdfdGFnIG9mIEBzZXJ2ZXJfdHJhbnNsYXRvcnMpXG4gICAgICAgIEBzZXJ2ZXJfdHJhbnNsYXRvcnNbbGFuZ190YWddID0gQF9nZXRTcGVjaWZpY0xhbmdUcmFuc2xhdG9yKGxhbmdfdGFnKVxuXG4gICAgICAjIGZhbGxiYWNrIGxhbmd1YWdlIGlzIGludGVncmF0ZWQsIGFuZCBpc24ndCBwYXJ0IG9mIEB0cmFuc2xhdGlvbnMgXG4gICAgICBpZiBsYW5nX3RhZyAhPSBAX2ZhbGxiYWNrX2xhbmd1YWdlXG4gICAgICAgIEBhZGRSZXNvdXJjZUJ1bmRsZShsYW5nX3RhZywgcGFja2FnZV9uYW1lLCBAdHJhbnNsYXRpb25zW2xhbmdfdGFnXVtwYWNrYWdlX25hbWVdKVxuXG4gICAgaWYgbm90KEBfZmFsbGJhY2tfbGFuZ3VhZ2Ugb2YgQHNlcnZlcl90cmFuc2xhdG9ycylcbiAgICAgIEBzZXJ2ZXJfdHJhbnNsYXRvcnNbQF9mYWxsYmFja19sYW5ndWFnZV0gPSBAX2dldFNwZWNpZmljTGFuZ1RyYW5zbGF0b3IoQF9mYWxsYmFja19sYW5ndWFnZSlcblxuICBfcmVnaXN0ZXJBbGxTZXJ2ZXJUcmFuc2xhdG9yczogKCkgLT5cbiAgICBmb3IgbGFuZ190YWcgaW4gQF9nZXRQcm9qZWN0TGFuZ3VhZ2VzKClcbiAgICAgIGZvciBwYWNrYWdlX25hbWUgb2YgQHRyYW5zbGF0aW9uc1tsYW5nX3RhZ11cbiAgICAgICAgQF9yZWdpc3RlclNlcnZlclRyYW5zbGF0b3IobGFuZ190YWcsIHBhY2thZ2VfbmFtZSlcblxuICBfZ2V0UGFja2FnZUkxOG5leHRQcm94eTogKHBhY2thZ2VfbmFtZSkgLT5cbiAgICAjIEEgcHJveHkgdG8gVEFQaTE4bmV4dC50IHdoZXJlIHRoZSBuYW1lc3BhY2UgaXMgcHJlc2V0IHRvIHRoZSBwYWNrYWdlJ3NcbiAgICAoa2V5LCBvcHRpb25zLCBsYW5nX3RhZz1udWxsKSA9PlxuICAgICAgaWYgbm90IGxhbmdfdGFnP1xuICAgICAgICAjIHRyYW5zbGF0ZSB0byBmYWxsYmFja19sYW5ndWFnZVxuICAgICAgICByZXR1cm4gQHNlcnZlcl90cmFuc2xhdG9yc1tAX2ZhbGxiYWNrX2xhbmd1YWdlXSBcIiN7QF9nZXRQYWNrYWdlRG9tYWluKHBhY2thZ2VfbmFtZSl9OiN7a2V5fVwiLCBvcHRpb25zXG4gICAgICBlbHNlIGlmIG5vdChsYW5nX3RhZyBvZiBAc2VydmVyX3RyYW5zbGF0b3JzKVxuICAgICAgICBjb25zb2xlLmxvZyBcIldhcm5pbmc6IGxhbmd1YWdlICN7bGFuZ190YWd9IGlzIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBwcm9qZWN0LCBmYWxsYmFjayBsYW5ndWFnZSAoI3tAX2ZhbGxiYWNrX2xhbmd1YWdlfSlcIlxuICAgICAgICByZXR1cm4gQHNlcnZlcl90cmFuc2xhdG9yc1tAX2ZhbGxiYWNrX2xhbmd1YWdlXSBcIiN7QF9nZXRQYWNrYWdlRG9tYWluKHBhY2thZ2VfbmFtZSl9OiN7a2V5fVwiLCBvcHRpb25zXG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiBAc2VydmVyX3RyYW5zbGF0b3JzW2xhbmdfdGFnXSBcIiN7QF9nZXRQYWNrYWdlRG9tYWluKHBhY2thZ2VfbmFtZSl9OiN7a2V5fVwiLCBvcHRpb25zXG5cbiAgX3JlZ2lzdGVySFRUUE1ldGhvZDogLT5cbiAgICBzZWxmID0gQFxuXG4gICAgbWV0aG9kcyA9IHt9XG5cbiAgICBpZiBub3Qgc2VsZi5fZW5hYmxlZCgpXG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yIDUwMCwgXCJ0YXAtaTE4biBoYXMgdG8gYmUgZW5hYmxlZCBpbiBvcmRlciB0byByZWdpc3RlciB0aGUgSFRUUCBtZXRob2RcIlxuXG4gICAgbWV0aG9kc1tcIiN7c2VsZi5jb25mLmkxOG5fZmlsZXNfcm91dGUucmVwbGFjZSgvXFwvJC8sIFwiXCIpfS9tdWx0aS86bGFuZ3NcIl0gPVxuICAgICAgZ2V0OiAoKSAtPlxuICAgICAgICBpZiBub3QgUmVnRXhwKFwiXigoI3tnbG9iYWxzLmxhbmdhdWdlc190YWdzX3JlZ2V4fSwpKiN7Z2xvYmFscy5sYW5nYXVnZXNfdGFnc19yZWdleH18YWxsKS5qc29uJFwiKS50ZXN0KEBwYXJhbXMubGFuZ3MpXG4gICAgICAgICAgcmV0dXJuIEBzZXRTdGF0dXNDb2RlKDQwMSlcblxuICAgICAgICBsYW5ncyA9IEBwYXJhbXMubGFuZ3MucmVwbGFjZSBcIi5qc29uXCIsIFwiXCJcblxuICAgICAgICBpZiBsYW5ncyA9PSBcImFsbFwiXG4gICAgICAgICAgb3V0cHV0ID0gc2VsZi50cmFuc2xhdGlvbnNcbiAgICAgICAgZWxzZVxuICAgICAgICAgIG91dHB1dCA9IHt9XG5cbiAgICAgICAgICBsYW5ncyA9IGxhbmdzLnNwbGl0KFwiLFwiKVxuICAgICAgICAgIGZvciBsYW5nX3RhZyBpbiBsYW5nc1xuICAgICAgICAgICAgaWYgbGFuZ190YWcgaW4gc2VsZi5fZ2V0UHJvamVjdExhbmd1YWdlcygpIGFuZCBcXFxuICAgICAgICAgICAgICAgbGFuZ190YWcgIT0gc2VsZi5fZmFsbGJhY2tfbGFuZ3VhZ2UgIyBmYWxsYmFjayBsYW5ndWFnZSBpcyBpbnRlZ3JhdGVkIHRvIHRoZSBidW5kbGVcbiAgICAgICAgICAgICAgbGFuZ3VhZ2VfdHJhbnNsYXRpb25zID0gc2VsZi50cmFuc2xhdGlvbnNbbGFuZ190YWddXG5cbiAgICAgICAgICAgICAgaWYgbGFuZ3VhZ2VfdHJhbnNsYXRpb25zP1xuICAgICAgICAgICAgICAgIG91dHB1dFtsYW5nX3RhZ10gPSBsYW5ndWFnZV90cmFuc2xhdGlvbnNcblxuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkob3V0cHV0KVxuXG4gICAgbWV0aG9kc1tcIiN7c2VsZi5jb25mLmkxOG5fZmlsZXNfcm91dGUucmVwbGFjZSgvXFwvJC8sIFwiXCIpfS86bGFuZ1wiXSA9XG4gICAgICBnZXQ6ICgpIC0+XG4gICAgICAgIGlmIG5vdCBSZWdFeHAoXCJeI3tnbG9iYWxzLmxhbmdhdWdlc190YWdzX3JlZ2V4fS5qc29uJFwiKS50ZXN0KEBwYXJhbXMubGFuZylcbiAgICAgICAgICByZXR1cm4gQHNldFN0YXR1c0NvZGUoNDAxKVxuXG4gICAgICAgIGxhbmdfdGFnID0gQHBhcmFtcy5sYW5nLnJlcGxhY2UgXCIuanNvblwiLCBcIlwiXG5cbiAgICAgICAgaWYgbGFuZ190YWcgbm90IGluIHNlbGYuX2dldFByb2plY3RMYW5ndWFnZXMoKSBvciBcXFxuICAgICAgICAgICBsYW5nX3RhZyA9PSBzZWxmLl9mYWxsYmFja19sYW5ndWFnZSAjIGZhbGxiYWNrIGxhbmd1YWdlIGlzIGludGVncmF0ZWQgdG8gdGhlIGJ1bmRsZVxuICAgICAgICAgIHJldHVybiBAc2V0U3RhdHVzQ29kZSg0MDQpICMgbm90IGZvdW5kXG5cbiAgICAgICAgbGFuZ3VhZ2VfdHJhbnNsYXRpb25zID0gc2VsZi50cmFuc2xhdGlvbnNbbGFuZ190YWddXG4gICAgICAgICMgcmV0dXJuaW5nIHt9IGlmIGxhbmdfdGFnIGlzIG5vdCBpbiB0cmFuc2xhdGlvbnMgYWxsb3dzIHRoZSBwcm9qZWN0XG4gICAgICAgICMgZGV2ZWxvcGVyIHRvIGZvcmNlIGEgbGFuZ3VhZ2Ugc3VwcG9ydGUgd2l0aCBwcm9qZWN0LXRhcC5pMThuJ3NcbiAgICAgICAgIyBzdXBwb3J0ZWRfbGFuZ3VhZ2VzIHByb3BlcnR5LCBldmVuIGlmIHRoYXQgbGFuZ3VhZ2UgaGFzIG5vIGxhbmdcbiAgICAgICAgIyBmaWxlcy5cbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGlmIGxhbmd1YWdlX3RyYW5zbGF0aW9ucz8gdGhlbiBsYW5ndWFnZV90cmFuc2xhdGlvbnMgZWxzZSB7fSlcblxuICAgIEhUVFAubWV0aG9kcyBtZXRob2RzXG5cbiAgX29uY2VFbmFibGVkOiAtPlxuICAgIEBfcmVnaXN0ZXJBbGxTZXJ2ZXJUcmFuc2xhdG9ycygpIiwidmFyIGluZGV4T2YgPSBbXS5pbmRleE9mIHx8IGZ1bmN0aW9uKGl0ZW0pIHsgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkrKykgeyBpZiAoaSBpbiB0aGlzICYmIHRoaXNbaV0gPT09IGl0ZW0pIHJldHVybiBpOyB9IHJldHVybiAtMTsgfTtcblxuXy5leHRlbmQoVEFQaTE4bi5wcm90b3R5cGUsIHtcbiAgc2VydmVyX3RyYW5zbGF0b3JzOiBudWxsLFxuICBfcmVnaXN0ZXJTZXJ2ZXJUcmFuc2xhdG9yOiBmdW5jdGlvbihsYW5nX3RhZywgcGFja2FnZV9uYW1lKSB7XG4gICAgaWYgKHRoaXMuX2VuYWJsZWQoKSkge1xuICAgICAgaWYgKCEobGFuZ190YWcgaW4gdGhpcy5zZXJ2ZXJfdHJhbnNsYXRvcnMpKSB7XG4gICAgICAgIHRoaXMuc2VydmVyX3RyYW5zbGF0b3JzW2xhbmdfdGFnXSA9IHRoaXMuX2dldFNwZWNpZmljTGFuZ1RyYW5zbGF0b3IobGFuZ190YWcpO1xuICAgICAgfVxuICAgICAgaWYgKGxhbmdfdGFnICE9PSB0aGlzLl9mYWxsYmFja19sYW5ndWFnZSkge1xuICAgICAgICB0aGlzLmFkZFJlc291cmNlQnVuZGxlKGxhbmdfdGFnLCBwYWNrYWdlX25hbWUsIHRoaXMudHJhbnNsYXRpb25zW2xhbmdfdGFnXVtwYWNrYWdlX25hbWVdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCEodGhpcy5fZmFsbGJhY2tfbGFuZ3VhZ2UgaW4gdGhpcy5zZXJ2ZXJfdHJhbnNsYXRvcnMpKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZXJ2ZXJfdHJhbnNsYXRvcnNbdGhpcy5fZmFsbGJhY2tfbGFuZ3VhZ2VdID0gdGhpcy5fZ2V0U3BlY2lmaWNMYW5nVHJhbnNsYXRvcih0aGlzLl9mYWxsYmFja19sYW5ndWFnZSk7XG4gICAgfVxuICB9LFxuICBfcmVnaXN0ZXJBbGxTZXJ2ZXJUcmFuc2xhdG9yczogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGksIGxhbmdfdGFnLCBsZW4sIHBhY2thZ2VfbmFtZSwgcmVmLCByZXN1bHRzO1xuICAgIHJlZiA9IHRoaXMuX2dldFByb2plY3RMYW5ndWFnZXMoKTtcbiAgICByZXN1bHRzID0gW107XG4gICAgZm9yIChpID0gMCwgbGVuID0gcmVmLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBsYW5nX3RhZyA9IHJlZltpXTtcbiAgICAgIHJlc3VsdHMucHVzaCgoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciByZXN1bHRzMTtcbiAgICAgICAgcmVzdWx0czEgPSBbXTtcbiAgICAgICAgZm9yIChwYWNrYWdlX25hbWUgaW4gdGhpcy50cmFuc2xhdGlvbnNbbGFuZ190YWddKSB7XG4gICAgICAgICAgcmVzdWx0czEucHVzaCh0aGlzLl9yZWdpc3RlclNlcnZlclRyYW5zbGF0b3IobGFuZ190YWcsIHBhY2thZ2VfbmFtZSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHRzMTtcbiAgICAgIH0pLmNhbGwodGhpcykpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfSxcbiAgX2dldFBhY2thZ2VJMThuZXh0UHJveHk6IGZ1bmN0aW9uKHBhY2thZ2VfbmFtZSkge1xuICAgIHJldHVybiAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihrZXksIG9wdGlvbnMsIGxhbmdfdGFnKSB7XG4gICAgICAgIGlmIChsYW5nX3RhZyA9PSBudWxsKSB7XG4gICAgICAgICAgbGFuZ190YWcgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsYW5nX3RhZyA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLnNlcnZlcl90cmFuc2xhdG9yc1tfdGhpcy5fZmFsbGJhY2tfbGFuZ3VhZ2VdKChfdGhpcy5fZ2V0UGFja2FnZURvbWFpbihwYWNrYWdlX25hbWUpKSArIFwiOlwiICsga2V5LCBvcHRpb25zKTtcbiAgICAgICAgfSBlbHNlIGlmICghKGxhbmdfdGFnIGluIF90aGlzLnNlcnZlcl90cmFuc2xhdG9ycykpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIldhcm5pbmc6IGxhbmd1YWdlIFwiICsgbGFuZ190YWcgKyBcIiBpcyBub3Qgc3VwcG9ydGVkIGluIHRoaXMgcHJvamVjdCwgZmFsbGJhY2sgbGFuZ3VhZ2UgKFwiICsgX3RoaXMuX2ZhbGxiYWNrX2xhbmd1YWdlICsgXCIpXCIpO1xuICAgICAgICAgIHJldHVybiBfdGhpcy5zZXJ2ZXJfdHJhbnNsYXRvcnNbX3RoaXMuX2ZhbGxiYWNrX2xhbmd1YWdlXSgoX3RoaXMuX2dldFBhY2thZ2VEb21haW4ocGFja2FnZV9uYW1lKSkgKyBcIjpcIiArIGtleSwgb3B0aW9ucyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLnNlcnZlcl90cmFuc2xhdG9yc1tsYW5nX3RhZ10oKF90aGlzLl9nZXRQYWNrYWdlRG9tYWluKHBhY2thZ2VfbmFtZSkpICsgXCI6XCIgKyBrZXksIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pKHRoaXMpO1xuICB9LFxuICBfcmVnaXN0ZXJIVFRQTWV0aG9kOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbWV0aG9kcywgc2VsZjtcbiAgICBzZWxmID0gdGhpcztcbiAgICBtZXRob2RzID0ge307XG4gICAgaWYgKCFzZWxmLl9lbmFibGVkKCkpIHtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcInRhcC1pMThuIGhhcyB0byBiZSBlbmFibGVkIGluIG9yZGVyIHRvIHJlZ2lzdGVyIHRoZSBIVFRQIG1ldGhvZFwiKTtcbiAgICB9XG4gICAgbWV0aG9kc1soc2VsZi5jb25mLmkxOG5fZmlsZXNfcm91dGUucmVwbGFjZSgvXFwvJC8sIFwiXCIpKSArIFwiL211bHRpLzpsYW5nc1wiXSA9IHtcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpLCBsYW5nX3RhZywgbGFuZ3MsIGxhbmd1YWdlX3RyYW5zbGF0aW9ucywgbGVuLCBvdXRwdXQ7XG4gICAgICAgIGlmICghUmVnRXhwKFwiXigoXCIgKyBnbG9iYWxzLmxhbmdhdWdlc190YWdzX3JlZ2V4ICsgXCIsKSpcIiArIGdsb2JhbHMubGFuZ2F1Z2VzX3RhZ3NfcmVnZXggKyBcInxhbGwpLmpzb24kXCIpLnRlc3QodGhpcy5wYXJhbXMubGFuZ3MpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuc2V0U3RhdHVzQ29kZSg0MDEpO1xuICAgICAgICB9XG4gICAgICAgIGxhbmdzID0gdGhpcy5wYXJhbXMubGFuZ3MucmVwbGFjZShcIi5qc29uXCIsIFwiXCIpO1xuICAgICAgICBpZiAobGFuZ3MgPT09IFwiYWxsXCIpIHtcbiAgICAgICAgICBvdXRwdXQgPSBzZWxmLnRyYW5zbGF0aW9ucztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvdXRwdXQgPSB7fTtcbiAgICAgICAgICBsYW5ncyA9IGxhbmdzLnNwbGl0KFwiLFwiKTtcbiAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBsYW5ncy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgbGFuZ190YWcgPSBsYW5nc1tpXTtcbiAgICAgICAgICAgIGlmIChpbmRleE9mLmNhbGwoc2VsZi5fZ2V0UHJvamVjdExhbmd1YWdlcygpLCBsYW5nX3RhZykgPj0gMCAmJiBsYW5nX3RhZyAhPT0gc2VsZi5fZmFsbGJhY2tfbGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgICAgbGFuZ3VhZ2VfdHJhbnNsYXRpb25zID0gc2VsZi50cmFuc2xhdGlvbnNbbGFuZ190YWddO1xuICAgICAgICAgICAgICBpZiAobGFuZ3VhZ2VfdHJhbnNsYXRpb25zICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRbbGFuZ190YWddID0gbGFuZ3VhZ2VfdHJhbnNsYXRpb25zO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShvdXRwdXQpO1xuICAgICAgfVxuICAgIH07XG4gICAgbWV0aG9kc1soc2VsZi5jb25mLmkxOG5fZmlsZXNfcm91dGUucmVwbGFjZSgvXFwvJC8sIFwiXCIpKSArIFwiLzpsYW5nXCJdID0ge1xuICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGxhbmdfdGFnLCBsYW5ndWFnZV90cmFuc2xhdGlvbnM7XG4gICAgICAgIGlmICghUmVnRXhwKFwiXlwiICsgZ2xvYmFscy5sYW5nYXVnZXNfdGFnc19yZWdleCArIFwiLmpzb24kXCIpLnRlc3QodGhpcy5wYXJhbXMubGFuZykpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5zZXRTdGF0dXNDb2RlKDQwMSk7XG4gICAgICAgIH1cbiAgICAgICAgbGFuZ190YWcgPSB0aGlzLnBhcmFtcy5sYW5nLnJlcGxhY2UoXCIuanNvblwiLCBcIlwiKTtcbiAgICAgICAgaWYgKGluZGV4T2YuY2FsbChzZWxmLl9nZXRQcm9qZWN0TGFuZ3VhZ2VzKCksIGxhbmdfdGFnKSA8IDAgfHwgbGFuZ190YWcgPT09IHNlbGYuX2ZhbGxiYWNrX2xhbmd1YWdlKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuc2V0U3RhdHVzQ29kZSg0MDQpO1xuICAgICAgICB9XG4gICAgICAgIGxhbmd1YWdlX3RyYW5zbGF0aW9ucyA9IHNlbGYudHJhbnNsYXRpb25zW2xhbmdfdGFnXTtcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGxhbmd1YWdlX3RyYW5zbGF0aW9ucyAhPSBudWxsID8gbGFuZ3VhZ2VfdHJhbnNsYXRpb25zIDoge30pO1xuICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIEhUVFAubWV0aG9kcyhtZXRob2RzKTtcbiAgfSxcbiAgX29uY2VFbmFibGVkOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fcmVnaXN0ZXJBbGxTZXJ2ZXJUcmFuc2xhdG9ycygpO1xuICB9XG59KTtcbiIsIlRBUGkxOG4gPSBuZXcgVEFQaTE4bigpIl19
