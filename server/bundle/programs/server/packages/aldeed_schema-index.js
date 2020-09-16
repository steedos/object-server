(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Collection2 = Package['aldeed:collection2-core'].Collection2;
var _ = Package.underscore._;
var LocalCollection = Package.minimongo.LocalCollection;
var Minimongo = Package.minimongo.Minimongo;
var check = Package.check.check;
var Match = Package.check.Match;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema;
var MongoObject = Package['aldeed:simple-schema'].MongoObject;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;

var require = meteorInstall({"node_modules":{"meteor":{"aldeed:schema-index":{"lib":{"indexing.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/aldeed_schema-index/lib/indexing.js                                                                     //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
// Extend the schema options allowed by SimpleSchema
SimpleSchema.extendOptions({
  index: Match.Optional(Match.OneOf(Number, String, Boolean)),
  unique: Match.Optional(Boolean),
  sparse: Match.Optional(Boolean)
}); // Define validation error messages (legacy)

if (!SimpleSchema.version || SimpleSchema.version < 2) {
  SimpleSchema.messages({
    notUnique: '[label] must be unique'
  });
}

if (Meteor.isServer) {
  Collection2.on('schema.attached', function (collection, ss) {
    // Define validation error messages
    if (ss.version >= 2) {
      ss.messageBox.messages({
        notUnique: '{{label}} must be unique'
      });
    }

    function ensureIndex(index, indexName, unique, sparse) {
      Meteor.startup(function () {
        collection._collection._ensureIndex(index, {
          background: true,
          name: indexName,
          unique: unique,
          sparse: sparse
        });
      });
    }

    function dropIndex(indexName) {
      Meteor.startup(function () {
        try {
          collection._collection._dropIndex(indexName);
        } catch (err) {// no index with that name, which is what we want
        }
      });
    }

    const propName = ss.version === 2 ? 'mergedSchema' : 'schema'; // Loop over fields definitions and ensure collection indexes (server side only)

    _.each(ss[propName](), function (definition, fieldName) {
      if ('index' in definition || definition.unique === true) {
        var index = {},
            indexValue; // If they specified `unique: true` but not `index`,
        // we assume `index: 1` to set up the unique index in mongo

        if ('index' in definition) {
          indexValue = definition.index;
          if (indexValue === true) indexValue = 1;
        } else {
          indexValue = 1;
        }

        var indexName = 'c2_' + fieldName; // In the index object, we want object array keys without the ".$" piece

        var idxFieldName = fieldName.replace(/\.\$\./g, ".");
        index[idxFieldName] = indexValue;
        var unique = !!definition.unique && (indexValue === 1 || indexValue === -1);
        var sparse = definition.sparse || false; // If unique and optional, force sparse to prevent errors

        if (!sparse && unique && definition.optional) sparse = true;

        if (indexValue === false) {
          dropIndex(indexName);
        } else {
          ensureIndex(index, indexName, unique, sparse);
        }
      }
    });
  });
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/aldeed:schema-index/lib/indexing.js");

/* Exports */
Package._define("aldeed:schema-index");

})();

//# sourceURL=meteor://💻app/packages/aldeed_schema-index.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWxkZWVkOnNjaGVtYS1pbmRleC9saWIvaW5kZXhpbmcuanMiXSwibmFtZXMiOlsiU2ltcGxlU2NoZW1hIiwiZXh0ZW5kT3B0aW9ucyIsImluZGV4IiwiTWF0Y2giLCJPcHRpb25hbCIsIk9uZU9mIiwiTnVtYmVyIiwiU3RyaW5nIiwiQm9vbGVhbiIsInVuaXF1ZSIsInNwYXJzZSIsInZlcnNpb24iLCJtZXNzYWdlcyIsIm5vdFVuaXF1ZSIsIk1ldGVvciIsImlzU2VydmVyIiwiQ29sbGVjdGlvbjIiLCJvbiIsImNvbGxlY3Rpb24iLCJzcyIsIm1lc3NhZ2VCb3giLCJlbnN1cmVJbmRleCIsImluZGV4TmFtZSIsInN0YXJ0dXAiLCJfY29sbGVjdGlvbiIsIl9lbnN1cmVJbmRleCIsImJhY2tncm91bmQiLCJuYW1lIiwiZHJvcEluZGV4IiwiX2Ryb3BJbmRleCIsImVyciIsInByb3BOYW1lIiwiXyIsImVhY2giLCJkZWZpbml0aW9uIiwiZmllbGROYW1lIiwiaW5kZXhWYWx1ZSIsImlkeEZpZWxkTmFtZSIsInJlcGxhY2UiLCJvcHRpb25hbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUNBQSxZQUFZLENBQUNDLGFBQWIsQ0FBMkI7QUFDekJDLE9BQUssRUFBRUMsS0FBSyxDQUFDQyxRQUFOLENBQWVELEtBQUssQ0FBQ0UsS0FBTixDQUFZQyxNQUFaLEVBQW9CQyxNQUFwQixFQUE0QkMsT0FBNUIsQ0FBZixDQURrQjtBQUV6QkMsUUFBTSxFQUFFTixLQUFLLENBQUNDLFFBQU4sQ0FBZUksT0FBZixDQUZpQjtBQUd6QkUsUUFBTSxFQUFFUCxLQUFLLENBQUNDLFFBQU4sQ0FBZUksT0FBZjtBQUhpQixDQUEzQixFLENBTUE7O0FBQ0EsSUFBSSxDQUFDUixZQUFZLENBQUNXLE9BQWQsSUFBeUJYLFlBQVksQ0FBQ1csT0FBYixHQUF1QixDQUFwRCxFQUF1RDtBQUNyRFgs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QTRCRCxHQTVERDtBQTZERCxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9hbGRlZWRfc2NoZW1hLWluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gRXh0ZW5kIHRoZSBzY2hlbWEgb3B0aW9ucyBhbGxvd2VkIGJ5IFNpbXBsZVNjaGVtYVxuU2ltcGxlU2NoZW1hLmV4dGVuZE9wdGlvbnMoe1xuICBpbmRleDogTWF0Y2guT3B0aW9uYWwoTWF0Y2guT25lT2YoTnVtYmVyLCBTdHJpbmcsIEJvb2xlYW4pKSxcbiAgdW5pcXVlOiBNYXRjaC5PcHRpb25hbChCb29sZWFuKSxcbiAgc3BhcnNlOiBNYXRjaC5PcHRpb25hbChCb29sZWFuKSxcbn0pO1xuXG4vLyBEZWZpbmUgdmFsaWRhdGlvbiBlcnJvciBtZXNzYWdlcyAobGVnYWN5KVxuaWYgKCFTaW1wbGVTY2hlbWEudmVyc2lvbiB8fCBTaW1wbGVTY2hlbWEudmVyc2lvbiA8IDIpIHtcbiAgU2ltcGxlU2NoZW1hLm1lc3NhZ2VzKHtcbiAgICBub3RVbmlxdWU6ICdbbGFiZWxdIG11c3QgYmUgdW5pcXVlJyxcbiAgfSk7XG59XG5cbmlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcbiAgQ29sbGVjdGlvbjIub24oJ3NjaGVtYS5hdHRhY2hlZCcsIGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBzcykge1xuICAgIC8vIERlZmluZSB2YWxpZGF0aW9uIGVycm9yIG1lc3NhZ2VzXG4gICAgaWYgKHNzLnZlcnNpb24gPj0gMikge1xuICAgICAgc3MubWVzc2FnZUJveC5tZXNzYWdlcyh7XG4gICAgICAgIG5vdFVuaXF1ZTogJ3t7bGFiZWx9fSBtdXN0IGJlIHVuaXF1ZScsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlbnN1cmVJbmRleChpbmRleCwgaW5kZXhOYW1lLCB1bmlxdWUsIHNwYXJzZSkge1xuICAgICAgTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24gKCkge1xuICAgICAgICBjb2xsZWN0aW9uLl9jb2xsZWN0aW9uLl9lbnN1cmVJbmRleChpbmRleCwge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHRydWUsXG4gICAgICAgICAgbmFtZTogaW5kZXhOYW1lLFxuICAgICAgICAgIHVuaXF1ZTogdW5pcXVlLFxuICAgICAgICAgIHNwYXJzZTogc3BhcnNlXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZHJvcEluZGV4KGluZGV4TmFtZSkge1xuICAgICAgTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24gKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbGxlY3Rpb24uX2NvbGxlY3Rpb24uX2Ryb3BJbmRleChpbmRleE5hbWUpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAvLyBubyBpbmRleCB3aXRoIHRoYXQgbmFtZSwgd2hpY2ggaXMgd2hhdCB3ZSB3YW50XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHByb3BOYW1lID0gc3MudmVyc2lvbiA9PT0gMiA/ICdtZXJnZWRTY2hlbWEnIDogJ3NjaGVtYSc7XG5cbiAgICAvLyBMb29wIG92ZXIgZmllbGRzIGRlZmluaXRpb25zIGFuZCBlbnN1cmUgY29sbGVjdGlvbiBpbmRleGVzIChzZXJ2ZXIgc2lkZSBvbmx5KVxuICAgIF8uZWFjaChzc1twcm9wTmFtZV0oKSwgZnVuY3Rpb24oZGVmaW5pdGlvbiwgZmllbGROYW1lKSB7XG4gICAgICBpZiAoJ2luZGV4JyBpbiBkZWZpbml0aW9uIHx8IGRlZmluaXRpb24udW5pcXVlID09PSB0cnVlKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHt9LCBpbmRleFZhbHVlO1xuICAgICAgICAvLyBJZiB0aGV5IHNwZWNpZmllZCBgdW5pcXVlOiB0cnVlYCBidXQgbm90IGBpbmRleGAsXG4gICAgICAgIC8vIHdlIGFzc3VtZSBgaW5kZXg6IDFgIHRvIHNldCB1cCB0aGUgdW5pcXVlIGluZGV4IGluIG1vbmdvXG4gICAgICAgIGlmICgnaW5kZXgnIGluIGRlZmluaXRpb24pIHtcbiAgICAgICAgICBpbmRleFZhbHVlID0gZGVmaW5pdGlvbi5pbmRleDtcbiAgICAgICAgICBpZiAoaW5kZXhWYWx1ZSA9PT0gdHJ1ZSkgaW5kZXhWYWx1ZSA9IDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW5kZXhWYWx1ZSA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGluZGV4TmFtZSA9ICdjMl8nICsgZmllbGROYW1lO1xuICAgICAgICAvLyBJbiB0aGUgaW5kZXggb2JqZWN0LCB3ZSB3YW50IG9iamVjdCBhcnJheSBrZXlzIHdpdGhvdXQgdGhlIFwiLiRcIiBwaWVjZVxuICAgICAgICB2YXIgaWR4RmllbGROYW1lID0gZmllbGROYW1lLnJlcGxhY2UoL1xcLlxcJFxcLi9nLCBcIi5cIik7XG4gICAgICAgIGluZGV4W2lkeEZpZWxkTmFtZV0gPSBpbmRleFZhbHVlO1xuICAgICAgICB2YXIgdW5pcXVlID0gISFkZWZpbml0aW9uLnVuaXF1ZSAmJiAoaW5kZXhWYWx1ZSA9PT0gMSB8fCBpbmRleFZhbHVlID09PSAtMSk7XG4gICAgICAgIHZhciBzcGFyc2UgPSBkZWZpbml0aW9uLnNwYXJzZSB8fCBmYWxzZTtcblxuICAgICAgICAvLyBJZiB1bmlxdWUgYW5kIG9wdGlvbmFsLCBmb3JjZSBzcGFyc2UgdG8gcHJldmVudCBlcnJvcnNcbiAgICAgICAgaWYgKCFzcGFyc2UgJiYgdW5pcXVlICYmIGRlZmluaXRpb24ub3B0aW9uYWwpIHNwYXJzZSA9IHRydWU7XG5cbiAgICAgICAgaWYgKGluZGV4VmFsdWUgPT09IGZhbHNlKSB7XG4gICAgICAgICAgZHJvcEluZGV4KGluZGV4TmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZW5zdXJlSW5kZXgoaW5kZXgsIGluZGV4TmFtZSwgdW5pcXVlLCBzcGFyc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufSJdfQ==
