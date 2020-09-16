(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Babel = Package['babel-compiler'].Babel;
var BabelCompiler = Package['babel-compiler'].BabelCompiler;

/* Package-scope variables */
var ECMAScript;

(function(){

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/ecmascript/ecmascript.js                                 //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
ECMAScript = {
  compileForShell(command, cacheOptions) {
    const babelOptions = Babel.getDefaultOptions({
      nodeMajorVersion: parseInt(process.versions.node, 10)
    });
    delete babelOptions.sourceMap;
    delete babelOptions.sourceMaps;
    babelOptions.ast = false;
    return Babel.compile(command, babelOptions, cacheOptions).code;
  }

};
///////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("ecmascript", {
  ECMAScript: ECMAScript
});

})();

//# sourceURL=meteor://💻app/packages/ecmascript.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvZWNtYXNjcmlwdC9lY21hc2NyaXB0LmpzIl0sIm5hbWVzIjpbIkVDTUFTY3JpcHQiLCJjb21waWxlRm9yU2hlbGwiLCJjb21tYW5kIiwiY2FjaGVPcHRpb25zIiwiYmFiZWxPcHRpb25zIiwiQmFiZWwiLCJnZXREZWZhdWx0T3B0aW9ucyIsIm5vZGVNYWpvclZlcnNpb24iLCJwYXJzZUludCIsInByb2Nlc3MiLCJ2ZXJzaW9ucyIsIm5vZGUiLCJzb3VyY2VNYXAiLCJzb3VyY2VNYXBzIiwiYXN0IiwiY29tcGlsZSIsImNvZGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLFVBQVUsR0FBRztBQUNYQyxpQkFBZSxDQUFDQyxPQUFELEVBQVVDLFlBQVYsRUFBd0I7QUFDckMsVUFBTUMsWUFBWSxHQUFHQyxLQUFLLENBQUNDLGlCQUFOLENBQXdCO0FBQzNDQyxzQkFBZ0IsRUFBRUMsUUFBUSxDQUFDQyxPQUFPLENBQUNDLFFBQVIsQ0FBaUJDLElBQWxCLEVBQXdCLEVBQXhCO0FBRGlCLEtBQXhCLENBQXJCO0FBR0EsV0FBT1AsWUFBWSxDQUFDUSxTQUFwQjtBQUNBLFdBQU9SLFlBQVksQ0FBQ1MsVUFBcEI7QUFDQVQsZ0JBQVksQ0FBQ1UsR0FBYixHQUFtQixLQUFuQjtBQUNBLFdBQU9ULEtBQUssQ0FBQ1UsT0FBTixDQUFjYixPQUFkLEVBQXVCRSxZQUF2QixFQUFxQ0QsWUFBckMsRUFBbURhLElBQTFEO0FBQ0Q7O0FBVFUsQ0FBYixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9lY21hc2NyaXB0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiRUNNQVNjcmlwdCA9IHtcbiAgY29tcGlsZUZvclNoZWxsKGNvbW1hbmQsIGNhY2hlT3B0aW9ucykge1xuICAgIGNvbnN0IGJhYmVsT3B0aW9ucyA9IEJhYmVsLmdldERlZmF1bHRPcHRpb25zKHtcbiAgICAgIG5vZGVNYWpvclZlcnNpb246IHBhcnNlSW50KHByb2Nlc3MudmVyc2lvbnMubm9kZSwgMTApXG4gICAgfSk7XG4gICAgZGVsZXRlIGJhYmVsT3B0aW9ucy5zb3VyY2VNYXA7XG4gICAgZGVsZXRlIGJhYmVsT3B0aW9ucy5zb3VyY2VNYXBzO1xuICAgIGJhYmVsT3B0aW9ucy5hc3QgPSBmYWxzZTtcbiAgICByZXR1cm4gQmFiZWwuY29tcGlsZShjb21tYW5kLCBiYWJlbE9wdGlvbnMsIGNhY2hlT3B0aW9ucykuY29kZTtcbiAgfVxufTtcbiJdfQ==
