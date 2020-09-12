const express = require('express');

function init(context){
  console.log('hello components')
  const router = express.Router()
  dsPath = __dirname + "/dist/";
  let routerPath = "/assets/js/"
  if (__meteor_runtime_config__ && __meteor_runtime_config__.ROOT_URL_PATH_PREFIX)
    routerPath = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX + "/assets/";
  const cacheTime = 86400000*1; // one day
  router.use(routerPath, express.static(dsPath, { maxAge: cacheTime }));
  WebApp.rawConnectHandlers.use(router);
}

exports.init = init;