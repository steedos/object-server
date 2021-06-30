import { getSteedosSchema, SteedosActionTypeConfig } from '../types'
import { Dictionary } from '@salesforce/ts-types';
import { getObjectConfig } from '../types'
import _ = require('lodash');
import { overrideOriginalObject } from './originalObject';
var util = require('../util');
var clone = require('clone');

const _lazyLoadButtons: Dictionary<any> = {};

const addLazyLoadButtons = function(objectName: string, json: SteedosActionTypeConfig){
    if(!_lazyLoadButtons[objectName]){
        _lazyLoadButtons[objectName] = []
    }
    _lazyLoadButtons[objectName].push(json)
}

export const getLazyLoadButtons = function(objectName: string){
    return _lazyLoadButtons[objectName]
}

export const loadObjectLazyButtons = function(objectName: string){
    let buttons = getLazyLoadButtons(objectName);
    _.each(buttons, function(button){
        addObjectButtonsConfig(objectName, clone(button));
    })
}


export const addObjectButtonsConfig = (objectName: string, json: SteedosActionTypeConfig) => {
    if (!json.name) {
        throw new Error('missing attribute name')
    }

    let object = getObjectConfig(objectName);
    if (object) {
        if(!object.actions){
            object.actions = {}
        }
        util.extend(object.actions, {[json.name]: json});
        overrideOriginalObject(objectName, {actions: {[json.name]: json}});
    } else {
        addLazyLoadButtons(objectName, json);
    }
}

export const removeObjectButtonsConfig = (objectName: string, json: SteedosActionTypeConfig)=>{
    if (!json.name) {
        throw new Error('missing attribute name')
    }
    let object = getObjectConfig(objectName);
    if(object.actions){
        delete object.actions[json.name]
    }
}

export const loadObjectButtons = async function (filePath: string, serviceName?: string){
    let buttonJsons = util.loadButtons(filePath);
    buttonJsons.forEach(element => {
        addObjectButtonsConfig(element.object_name, element);
    });
    if(serviceName)
        for await (const buttonJson of buttonJsons) {
            await getSteedosSchema().metadataRegister.addObjectConfig(serviceName, Object.assign({extend: buttonJson.object_name}, {actions: {[buttonJson.name]: buttonJson}}));
        }
}
