var require = meteorInstall({"app":{"cors":{"server":{"cors.coffee":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                        //
// app/cors/server/cors.coffee                                                                            //
//                                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                          //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var cors;
cors = require("cors");
WebApp.rawConnectHandlers.use(function (req, res, next) {
  var buf, ref;

  if (req._body) {
    return next();
  }

  if (req.headers['transfer-encoding'] === void 0 && isNaN(req.headers['content-length'])) {
    return next();
  }

  if ((ref = req.headers['content-type']) !== '' && ref !== void 0) {
    return next();
  }

  buf = '';
  req.setEncoding('utf8');
  req.on('data', function (chunk) {
    return buf += chunk;
  });
  return req.on('end', function () {
    var err;

    if ((typeof Steedos !== "undefined" && Steedos !== null ? Steedos.debugLevel : void 0) != null && Steedos.debugLevel === 'debug') {
      console.log('[request]'.green, req.method, req.url, '\nheaders ->', req.headers, '\nbody ->', buf);
    }

    try {
      req.body = JSON.parse(buf);
    } catch (error) {
      err = error;
      req.body = buf;
    }

    req._body = true;
    return next();
  });
});
WebApp.rawConnectHandlers.use(cors({
  origin: true,
  credentials: true
}));
WebApp.rawConnectHandlers.use(function (req, res, next) {
  var method, setHeader;
  method = req.method && req.method.toUpperCase && req.method.toUpperCase();
  setHeader = res.setHeader;

  res.setHeader = function (key, val) {
    if (key.toLowerCase() === 'access-control-allow-origin' && val === 'http://meteor.local') {
      return;
    }

    return setHeader.apply(this, arguments);
  };

  return next();
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"project-i18n.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                        //
// project-i18n.js                                                                                        //
//                                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                          //
TAPi18n._enable({"supported_languages":["zh-CN","en"],"i18n_files_route":"/tap-i18n","preloaded_langs":[],"helper_name":"_","cdn_path":null});
TAPi18n.languages_names["en"] = ["English","English"];
TAPi18n.languages_names["zh-CN"] = ["Chinese (China)","简体中文"];
TAPi18n.languages_names["en"] = ["English","English"];

////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},{
  "extensions": [
    ".js",
    ".json",
    ".jsx",
    ".coffee"
  ]
});

require("/app/cors/server/cors.coffee");
require("/project-i18n.js");
//# sourceURL=meteor://💻app/app/app.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvYXBwL2NvcnMvc2VydmVyL2NvcnMuY29mZmVlIl0sIm5hbWVzIjpbImNvcnMiLCJyZXF1aXJlIiwiV2ViQXBwIiwicmF3Q29ubmVjdEhhbmRsZXJzIiwidXNlIiwicmVxIiwicmVzIiwibmV4dCIsImJ1ZiIsInJlZiIsIl9ib2R5IiwiaGVhZGVycyIsImlzTmFOIiwic2V0RW5jb2RpbmciLCJvbiIsImNodW5rIiwiZXJyIiwiU3RlZWRvcyIsImRlYnVnTGV2ZWwiLCJjb25zb2xlIiwibG9nIiwiZ3JlZW4iLCJtZXRob2QiLCJ1cmwiLCJib2R5IiwiSlNPTiIsInBhcnNlIiwiZXJyb3IiLCJvcmlnaW4iLCJjcmVkZW50aWFscyIsInNldEhlYWRlciIsInRvVXBwZXJDYXNlIiwia2V5IiwidmFsIiwidG9Mb3dlckNhc2UiLCJhcHBseSIsImFyZ3VtZW50cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0EsSUFBQUEsSUFBQTtBQUFBQSxPQUFPQyxRQUFRLE1BQVIsQ0FBUDtBQUdBQyxPQUFPQyxrQkFBUCxDQUEwQkMsR0FBMUIsQ0FBOEIsVUFBQ0MsR0FBRCxFQUFNQyxHQUFOLEVBQVdDLElBQVg7QUFDN0IsTUFBQUMsR0FBQSxFQUFBQyxHQUFBOztBQUFBLE1BQUdKLElBQUlLLEtBQVA7QUFDQyxXQUFPSCxNQUFQO0FBRUM7O0FBQUYsTUFBR0YsSUFBSU0sT0FBSixDQUFZLG1CQUFaLE1BQW9DLE1BQXBDLElBQWtEQyxNQUFNUCxJQUFJTSxPQUFKLENBQVksZ0JBQVosQ0FBTixDQUFyRDtBQUNDLFdBQU9KLE1BQVA7QUFFQzs7QUFBRixPQUFBRSxNQUFHSixJQUFJTSxPQUFKLENBQVksY0FBWixDQUFILE1BQXVDLEVBQXZDLElBQUdGLFFBQXdDLE1BQTNDO0FBQ0MsV0FBT0YsTUFBUDtBQUVDOztBQUFGQyxRQUFNLEVBQU47QUFDQUgsTUFBSVEsV0FBSixDQUFnQixNQUFoQjtBQUNBUixNQUFJUyxFQUFKLENBQU8sTUFBUCxFQUFlLFVBQUNDLEtBQUQ7QUFFWixXQUZ1QlAsT0FBT08sS0FFOUI7QUFGSDtBQUlDLFNBSERWLElBQUlTLEVBQUosQ0FBTyxLQUFQLEVBQWM7QUFDYixRQUFBRSxHQUFBOztBQUFBLFFBQUcsUUFBQUMsT0FBQSxvQkFBQUEsWUFBQSxPQUFBQSxRQUFBQyxVQUFBLHNCQUF5QkQsUUFBUUMsVUFBUixLQUFzQixPQUFsRDtBQUNDQyxjQUFRQyxHQUFSLENBQVksWUFBWUMsS0FBeEIsRUFBK0JoQixJQUFJaUIsTUFBbkMsRUFBMkNqQixJQUFJa0IsR0FBL0MsRUFBb0QsY0FBcEQsRUFBb0VsQixJQUFJTSxPQUF4RSxFQUFpRixXQUFqRixFQUE4RkgsR0FBOUY7QUFLRTs7QUFISDtBQUNDSCxVQUFJbUIsSUFBSixHQUFXQyxLQUFLQyxLQUFMLENBQVdsQixHQUFYLENBQVg7QUFERCxhQUFBbUIsS0FBQTtBQUVNWCxZQUFBVyxLQUFBO0FBQ0x0QixVQUFJbUIsSUFBSixHQUFXaEIsR0FBWDtBQU1FOztBQUpISCxRQUFJSyxLQUFKLEdBQVksSUFBWjtBQU1FLFdBTEZILE1BS0U7QUFmSCxJQUdDO0FBaEJGO0FBeUJBTCxPQUFPQyxrQkFBUCxDQUEwQkMsR0FBMUIsQ0FBOEJKLEtBQUs7QUFBQzRCLFVBQVEsSUFBVDtBQUFlQyxlQUFhO0FBQTVCLENBQUwsQ0FBOUI7QUFFQTNCLE9BQU9DLGtCQUFQLENBQTBCQyxHQUExQixDQUE4QixVQUFDQyxHQUFELEVBQU1DLEdBQU4sRUFBV0MsSUFBWDtBQUU3QixNQUFBZSxNQUFBLEVBQUFRLFNBQUE7QUFBQVIsV0FBU2pCLElBQUlpQixNQUFKLElBQWNqQixJQUFJaUIsTUFBSixDQUFXUyxXQUF6QixJQUF3QzFCLElBQUlpQixNQUFKLENBQVdTLFdBQVgsRUFBakQ7QUFHQUQsY0FBWXhCLElBQUl3QixTQUFoQjs7QUFDQXhCLE1BQUl3QixTQUFKLEdBQWdCLFVBQUNFLEdBQUQsRUFBTUMsR0FBTjtBQUNmLFFBQUdELElBQUlFLFdBQUosT0FBcUIsNkJBQXJCLElBQXVERCxRQUFPLHFCQUFqRTtBQUNDO0FBU0U7O0FBUkgsV0FBT0gsVUFBVUssS0FBVixDQUFnQixJQUFoQixFQUFtQkMsU0FBbkIsQ0FBUDtBQUhlLEdBQWhCOztBQUtBLFNBQU83QixNQUFQO0FBWEQsRyIsImZpbGUiOiIvYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIyBBZGRpbmcgQ09SUyBoZWFkZXJzIHNvIHdlIGNhbiB1c2UgQ0ROcyBmb3Igc3RhdGljIGNvbnRlbnRcclxuY29ycyA9IHJlcXVpcmUoXCJjb3JzXCIpO1xyXG5cclxuIyBUcnkgdG8gcGFyc2UgYWxsIHJlcXVlc3QgYm9kaWVzIGFzIEpTT05cclxuV2ViQXBwLnJhd0Nvbm5lY3RIYW5kbGVycy51c2UgKHJlcSwgcmVzLCBuZXh0KSAtPlxyXG5cdGlmIHJlcS5fYm9keVxyXG5cdFx0cmV0dXJuIG5leHQoKVxyXG5cclxuXHRpZiByZXEuaGVhZGVyc1sndHJhbnNmZXItZW5jb2RpbmcnXSBpcyB1bmRlZmluZWQgYW5kIGlzTmFOKHJlcS5oZWFkZXJzWydjb250ZW50LWxlbmd0aCddKVxyXG5cdFx0cmV0dXJuIG5leHQoKVxyXG5cclxuXHRpZiByZXEuaGVhZGVyc1snY29udGVudC10eXBlJ10gbm90IGluIFsnJywgdW5kZWZpbmVkXVxyXG5cdFx0cmV0dXJuIG5leHQoKVxyXG5cclxuXHRidWYgPSAnJ1xyXG5cdHJlcS5zZXRFbmNvZGluZygndXRmOCcpXHJcblx0cmVxLm9uICdkYXRhJywgKGNodW5rKSAtPiBidWYgKz0gY2h1bmtcclxuXHRyZXEub24gJ2VuZCcsIC0+XHJcblx0XHRpZiBTdGVlZG9zPy5kZWJ1Z0xldmVsPyBhbmQgU3RlZWRvcy5kZWJ1Z0xldmVsIGlzICdkZWJ1ZydcclxuXHRcdFx0Y29uc29sZS5sb2cgJ1tyZXF1ZXN0XScuZ3JlZW4sIHJlcS5tZXRob2QsIHJlcS51cmwsICdcXG5oZWFkZXJzIC0+JywgcmVxLmhlYWRlcnMsICdcXG5ib2R5IC0+JywgYnVmXHJcblxyXG5cdFx0dHJ5XHJcblx0XHRcdHJlcS5ib2R5ID0gSlNPTi5wYXJzZShidWYpXHJcblx0XHRjYXRjaCBlcnJcclxuXHRcdFx0cmVxLmJvZHkgPSBidWZcclxuXHJcblx0XHRyZXEuX2JvZHkgPSB0cnVlXHJcblx0XHRuZXh0KClcclxuXHJcbldlYkFwcC5yYXdDb25uZWN0SGFuZGxlcnMudXNlKGNvcnMoe29yaWdpbjogdHJ1ZSwgY3JlZGVudGlhbHM6IHRydWV9KSk7XHJcblxyXG5XZWJBcHAucmF3Q29ubmVjdEhhbmRsZXJzLnVzZSAocmVxLCByZXMsIG5leHQpIC0+XHJcblx0I2lmIC9eXFwvKGFwaXxfdGltZXN5bmN8c29ja2pzfHRhcC1pMThuKShcXC98JCkvLnRlc3QgcmVxLnVybFxyXG5cdG1ldGhvZCA9IHJlcS5tZXRob2QgJiYgcmVxLm1ldGhvZC50b1VwcGVyQ2FzZSAmJiByZXEubWV0aG9kLnRvVXBwZXJDYXNlKCk7XHJcblxyXG5cdCMgQmxvY2sgbmV4dCBoYW5kbGVycyB0byBvdmVycmlkZSBDT1JTIHdpdGggdmFsdWUgaHR0cDovL21ldGVvci5sb2NhbFxyXG5cdHNldEhlYWRlciA9IHJlcy5zZXRIZWFkZXJcclxuXHRyZXMuc2V0SGVhZGVyID0gKGtleSwgdmFsKSAtPlxyXG5cdFx0aWYga2V5LnRvTG93ZXJDYXNlKCkgaXMgJ2FjY2Vzcy1jb250cm9sLWFsbG93LW9yaWdpbicgYW5kIHZhbCBpcyAnaHR0cDovL21ldGVvci5sb2NhbCdcclxuXHRcdFx0cmV0dXJuXHJcblx0XHRyZXR1cm4gc2V0SGVhZGVyLmFwcGx5IEAsIGFyZ3VtZW50c1xyXG5cclxuXHRyZXR1cm4gbmV4dCgpXHJcblxyXG4jIF9zdGF0aWNGaWxlc01pZGRsZXdhcmUgPSBXZWJBcHBJbnRlcm5hbHMuc3RhdGljRmlsZXNNaWRkbGV3YXJlXHJcbiMgV2ViQXBwSW50ZXJuYWxzLl9zdGF0aWNGaWxlc01pZGRsZXdhcmUgPSAoc3RhdGljRmlsZXMsIHJlcSwgcmVzLCBuZXh0KSAtPlxyXG4jIFx0cmVzLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiLCBcIipcIilcclxuIyBcdF9zdGF0aWNGaWxlc01pZGRsZXdhcmUoc3RhdGljRmlsZXMsIHJlcSwgcmVzLCBuZXh0KVxyXG5cclxuXHJcbiJdfQ==
