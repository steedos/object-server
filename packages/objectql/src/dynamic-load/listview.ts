import { getSteedosSchema, SteedosObjectListViewTypeConfig } from '../types'
import { Dictionary } from '@salesforce/ts-types';
import { getObjectConfig } from '../types';
import { overrideOriginalObject } from './originalObject';
import _ = require('lodash');
var util = require('../util');
var clone = require('clone');

const _lazyLoadListViews: Dictionary<any> = {};

const addLazyLoadListViews = function(objectName: string, json: SteedosObjectListViewTypeConfig){
    if(!_lazyLoadListViews[objectName]){
        _lazyLoadListViews[objectName] = []
    }
    _lazyLoadListViews[objectName].push(json)
}

const getLazyLoadListViews = function(objectName: string){
    return _lazyLoadListViews[objectName]
}

export const loadObjectLazyListViews = function(objectName: string){
    let listViews = getLazyLoadListViews(objectName);
    _.each(listViews, function(listView){
        addObjectListViewConfig(objectName, clone(listView));
    })
}

export const addObjectListViewConfig = (objectName: string, json: SteedosObjectListViewTypeConfig) => {
    if (!json.name) {
        throw new Error('missing attribute name')
    }

    let object = getObjectConfig(objectName);
    if (object) {
        if(!object.list_views){
            object.list_views = {}
        }
        util.extend(object.list_views, {[json.name]: json});
        overrideOriginalObject(objectName, {list_views: {[json.name]: json}});
    } else {
        addLazyLoadListViews(objectName, json);
    }
}

export const loadObjectListViews = async function (filePath: string, serviceName?: string){
    let listViewJsons = util.loadListViews(filePath);
    listViewJsons.forEach(element => {
        addObjectListViewConfig(element.object_name, element);
    });
    if(serviceName)
        for await (const listViewJson of listViewJsons) {
            await getSteedosSchema().metadataRegister.addObjectConfig(serviceName, Object.assign({extend: listViewJson.object_name}, {list_views: {
                [listViewJson.name]: listViewJson
            }}));
        }
}
