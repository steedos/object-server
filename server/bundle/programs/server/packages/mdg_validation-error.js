(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema;
var MongoObject = Package['aldeed:simple-schema'].MongoObject;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var ValidationError;

var require = meteorInstall({"node_modules":{"meteor":{"mdg:validation-error":{"validation-error.js":function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/mdg_validation-error/validation-error.js                   //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
/* global ValidationError:true */

/* global SimpleSchema */
// This is exactly what comes out of SS.
const errorSchema = new SimpleSchema({
  name: {
    type: String
  },
  type: {
    type: String
  },
  details: {
    type: Object,
    blackbox: true,
    optional: true
  }
});
const errorsSchema = new SimpleSchema({
  errors: {
    type: Array
  },
  'errors.$': {
    type: errorSchema
  }
});
ValidationError = class extends Meteor.Error {
  constructor(errors, message = 'Validation Failed') {
    errorsSchema.validate({
      errors
    });
    super(ValidationError.ERROR_CODE, message, errors);
    this.errors = errors;
  }

}; // If people use this to check for the error code, we can change it
// in future versions

ValidationError.ERROR_CODE = 'validation-error';
/////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/mdg:validation-error/validation-error.js");

/* Exports */
Package._define("mdg:validation-error", {
  ValidationError: ValidationError
});

})();

//# sourceURL=meteor://💻app/packages/mdg_validation-error.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbWRnOnZhbGlkYXRpb24tZXJyb3IvdmFsaWRhdGlvbi1lcnJvci5qcyJdLCJuYW1lcyI6WyJlcnJvclNjaGVtYSIsIlNpbXBsZVNjaGVtYSIsIm5hbWUiLCJ0eXBlIiwiU3RyaW5nIiwiZGV0YWlscyIsIk9iamVjdCIsImJsYWNrYm94Iiwib3B0aW9uYWwiLCJlcnJvcnNTY2hlbWEiLCJlcnJvcnMiLCJBcnJheSIsIlZhbGlkYXRpb25FcnJvciIsIk1ldGVvciIsIkVycm9yIiwiY29uc3RydWN0b3IiLCJtZXNzYWdlIiwidmFsaWRhdGUiLCJFUlJPUl9DT0RFIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTtBQUVBO0FBQ0EsTUFBTUEsV0FBVyxHQUFHLElBQUlDLFlBQUosQ0FBaUI7QUFDbkNDLE1BQUksRUFBRTtBQUFDQyxRQUFJLEVBQUVDO0FBQVAsR0FENkI7QUFFbkNELE1BQUksRUFBRTtBQUFDQSxRQUFJLEVBQUVDO0FBQVAsR0FGNkI7QUFHbkNDLFNBQU8sRUFBRTtBQUFDRixRQUFJLEVBQUVHLE1BQVA7QUFBZUMsWUFBUSxFQUFFLElBQXpCO0FBQStCQyxZQUFRLEVBQUU7QUFBekM7QUFIMEIsQ0FBakIsQ0FBcEI7QUFNQSxNQUFNQyxZQUFZLEdBQUcsSUFBSVIsWUFBSixDQUFpQjtBQUNwQ1MsUUFBTSxFQUFFO0FBQUNQLFFBQUksRUFBRVE7QUFBUCxHQUQ0QjtBQUVwQyxjQUFZO0FBQUNSLFFBQUksRUFBRUg7QUFBUDtBQUZ3QixDQUFqQixDQUFyQjtBQUtBWSxlQUFlLEdBQUcsY0FBY0MsTUFBTSxDQUFDQyxLQUFyQixDQUEyQjtBQUMzQ0MsYUFBVyxDQUFDTCxNQUFELEVBQVNNLE9BQU8sR0FBRyxtQkFBbkIsRUFBd0M7QUFDakRQLGdCQUFZLENBQUNRLFFBQWIsQ0FBc0I7QUFBQ1A7QUFBRCxLQUF0QjtBQUVBLFVBQU1FLGVBQWUsQ0FBQ00sVUFBdEIsRUFBa0NGLE9BQWxDLEVBQTJDTixNQUEzQztBQUVBLFNBQUtBLE1BQUwsR0FBY0EsTUFBZDtBQUNEOztBQVAwQyxDQUE3QyxDLENBVUE7QUFDQTs7QUFDQUUsZUFBZSxDQUFDTSxVQUFoQixHQUE2QixrQkFBN0IsQyIsImZpbGUiOiIvcGFja2FnZXMvbWRnX3ZhbGlkYXRpb24tZXJyb3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgVmFsaWRhdGlvbkVycm9yOnRydWUgKi9cbi8qIGdsb2JhbCBTaW1wbGVTY2hlbWEgKi9cblxuLy8gVGhpcyBpcyBleGFjdGx5IHdoYXQgY29tZXMgb3V0IG9mIFNTLlxuY29uc3QgZXJyb3JTY2hlbWEgPSBuZXcgU2ltcGxlU2NoZW1hKHtcbiAgbmFtZToge3R5cGU6IFN0cmluZ30sXG4gIHR5cGU6IHt0eXBlOiBTdHJpbmd9LFxuICBkZXRhaWxzOiB7dHlwZTogT2JqZWN0LCBibGFja2JveDogdHJ1ZSwgb3B0aW9uYWw6IHRydWV9XG59KTtcblxuY29uc3QgZXJyb3JzU2NoZW1hID0gbmV3IFNpbXBsZVNjaGVtYSh7XG4gIGVycm9yczoge3R5cGU6IEFycmF5fSxcbiAgJ2Vycm9ycy4kJzoge3R5cGU6IGVycm9yU2NoZW1hfVxufSk7XG5cblZhbGlkYXRpb25FcnJvciA9IGNsYXNzIGV4dGVuZHMgTWV0ZW9yLkVycm9yIHtcbiAgY29uc3RydWN0b3IoZXJyb3JzLCBtZXNzYWdlID0gJ1ZhbGlkYXRpb24gRmFpbGVkJykge1xuICAgIGVycm9yc1NjaGVtYS52YWxpZGF0ZSh7ZXJyb3JzfSk7XG5cbiAgICBzdXBlcihWYWxpZGF0aW9uRXJyb3IuRVJST1JfQ09ERSwgbWVzc2FnZSwgZXJyb3JzKTtcblxuICAgIHRoaXMuZXJyb3JzID0gZXJyb3JzO1xuICB9XG59O1xuXG4vLyBJZiBwZW9wbGUgdXNlIHRoaXMgdG8gY2hlY2sgZm9yIHRoZSBlcnJvciBjb2RlLCB3ZSBjYW4gY2hhbmdlIGl0XG4vLyBpbiBmdXR1cmUgdmVyc2lvbnNcblZhbGlkYXRpb25FcnJvci5FUlJPUl9DT0RFID0gJ3ZhbGlkYXRpb24tZXJyb3InO1xuIl19
