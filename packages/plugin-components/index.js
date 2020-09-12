const express = require('express');
const fs = require('fs');

function init(context){
  console.log('hello 2 components')
  const router = express.Router()
  dsPath = __dirname + "/dist/";
  let routerPath = "/assets/js/"
  if (__meteor_runtime_config__ && __meteor_runtime_config__.ROOT_URL_PATH_PREFIX)
    routerPath = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX + "/assets/";
  const cacheTime = 86400000*1; // one day
  router.use(routerPath, express.static(dsPath, { maxAge: cacheTime }));
  WebApp.rawConnectHandlers.use(router);

  let code = fs.readFileSync(__dirname + "/dist/steedos-components.min.js", 'utf8');
  WebAppInternals.additionalStaticJs["/steedos-components.min.js"] = code;
}

exports.init = init;