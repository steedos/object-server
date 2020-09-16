(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var Spacebars = Package.spacebars.Spacebars;
var SpacebarsCompiler = Package['spacebars-compiler'].SpacebarsCompiler;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var Random = Package.random.Random;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var Template, SSR;

(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/meteorhacks_ssr/lib/overrides.js                                                                    //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
// we don't need autorun to go through Tracker
Blaze.View.prototype.autorun = function(f) {
  var handler = {stop: function() {}};
  f.call(this, handler);
  return handler;
};

Spacebars.With = function (argFunc, contentFunc, elseFunc) {
  var argVar = new Blaze.ReactiveVar;
  var view = Blaze.View('Spacebars_with', function () {
    return Blaze.If(function () { return argVar.get(); },
                    function () { return Blaze.With(function () {
                      return argVar.get(); }, contentFunc); },
                    elseFunc);
  });

  view.onViewCreated(function () {
    this.autorun(function () {
      argVar.set(argFunc());
    });
  });

  return view;
};

// if we get a cursor from a templateHelper
// we need fetch the data
// observering us useless and throw errors
var originalLookup = Blaze.View.prototype.lookup;
Blaze.View.prototype.lookup = function(key) {
  var helper = originalLookup.apply(this, arguments);
  return wrapHelper(helper);
};

function wrapHelper(helper) {
  if(typeof helper != 'function') {
    return helper;
  }

  return function() {
    var res = helper.apply(this, arguments);
    if(res && typeof res.observeChanges == 'function') {
      return res.fetch();
    } else {
      return res;
    }
  }
}

var originalTemplateWith = Blaze._TemplateWith;
Blaze._TemplateWith = function(arg, contentFunc) {
  // data is available instantly and if we delayed
  // things won't work as expected

  if(typeof arg == 'function') {
    arg = arg();
  }
  return originalTemplateWith.call(this, arg, contentFunc);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/meteorhacks_ssr/lib/template.js                                                                     //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
// Packages and apps add templates on to this object.
Template = Blaze.Template;

// Check for duplicate template names and illegal names that won't work.
Template.__checkName = function (name) {
  if (name in Template) {
    if ((Template[name] instanceof Template) && name !== "body")
      throw new Error("There are multiple templates named '" + name + "'. Each template needs a unique name.");
    throw new Error("This template name is reserved: " + name);
  }
};

// Define a template `Template.body` that renders its
// `contentViews`.  `<body>` tags (of which there may be
// multiple) will have their contents added to it.
Template.body = new Template('body', function () {
  var parts = Template.body.contentViews;
  // enable lookup by setting `view.template`
  for (var i = 0; i < parts.length; i++)
    parts[i].template = Template.body;
  return parts;
});
Template.body.contentViews = []; // array of Blaze.Views
Template.body.view = null;

Template.body.addContent = function (renderFunc) {
  var kind = 'body_content_' + Template.body.contentViews.length;

  Template.body.contentViews.push(Blaze.View(kind, renderFunc));
};

// This function does not use `this` and so it may be called
// as `Meteor.startup(Template.body.renderIntoDocument)`.
Template.body.renderToDocument = function () {

};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/meteorhacks_ssr/lib/dynamic.js                                                                      //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Template.__dynamic = new Template("Template.__dynamic", function() {
  var view = this;
  var template = Spacebars.call(view.lookup("template"));
  if(!template) {
    throw new Error('you must specify template argument in UI.dynamic');
  } else if(!Template[template]) {
    throw new Error('there is no template defined to include with UI.dynamic: '  + template);
  }

  var data = Spacebars.call(view.lookup("data"));
  if(!data) {
    // get data from the parent
    data = Spacebars.call(view.lookup)
  }

  return Blaze._TemplateWith(data, function() {
    return Spacebars.include(Template[template]);
  });
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/meteorhacks_ssr/lib/api.js                                                                          //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
var format = Npm.require('util').format;
var Compilers = {};
Compilers.html = SpacebarsCompiler;
if(Package['mquandalle:jade-compiler']) {
  Compilers.jade = Package['mquandalle:jade-compiler'].JadeCompiler;
}

SSR = {};

SSR.render = function(templateName, data) {
  var renderFunc = (data)? Blaze.toHTMLWithData : Blaze.toHTML;
  var template = (typeof templateName == 'string')?
    Template[templateName] : templateName;

  return renderFunc(template, data);
};

SSR.compileTemplate = function(name, content, options) {
  var language = options && options.language || "html";
  var compiler = Compilers[language];
  if(!compiler) {
    throw Error("Unknown language: " + language);
  }

  var compiled = compiler.compile(content);
  var templateFmt = "new Template('%s', function() {var view=this; return %s()})";
  var template = format(templateFmt, name, compiled);

  return Template[name] = eval(template);
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("meteorhacks:ssr", {
  Template: Template,
  SSR: SSR
});

})();
