const objectConfigCache = {};

export function addObjectConfig(apiName, config){
    objectConfigCache[apiName] = config
}

export function getObjectConfig(apiName){
    return objectConfigCache[apiName];
}