import _ = require("underscore");
import moment = require('moment');
import { getObjectServiceName } from "..";
import { SteedosObjectTypeConfig } from "../..";
const clone = require("clone");
// import { translationObject } from '@steedos/i18n';
const { moleculerGql: gql } = require("moleculer-apollo-server");
import { getSteedosSchema } from '../../';
import { getObjectConfig } from "./cache";
const BASIC_TYPE_MAPPING = {
    'text': 'String',
    'textarea': 'String',
    'html': 'String',
    'select': 'String',
    'url': 'String',
    'email': 'String',
    'date': 'String',
    'datetime': 'String',
    'number': 'Float',
    'currency': 'Float',
    'boolean': 'Boolean'
};
const EXPAND_SUFFIX = '__expand';
const DISPLAY_PREFIX = '_display';
export const RELATED_PREFIX = '_related';
const GRAPHQL_ACTION_PREFIX = 'graphql_';


export function generateActionGraphqlProp(actionName: string, objectConfig: SteedosObjectTypeConfig) {
    let gplObj: any = {};
    let objectName = objectConfig.name;
    switch (actionName) {
        case 'count':
            gplObj.query = gql`
                type Query {
                    ${objectName}__${actionName}(fields: JSON, filters: JSON, top: Int, skip: Int, sort: String): Int
                }
            `;
            break;
        case 'find':
            gplObj.query = gql`
                type Query {
                    ${objectName}(fields: JSON, filters: JSON, top: Int, skip: Int, sort: String): [${objectName}]
                }
            `;
            break;
        case 'insert':
            gplObj.mutation = gql`
                type Mutation {
                    ${objectName}__${actionName}(doc: JSON): ${objectName}
                }
            `;
            break;
        case 'update':
            gplObj.mutation = gql`
                type Mutation {
                    ${objectName}__${actionName}(id: JSON, doc: JSON): ${objectName}
                }
            `;
            break;
        case 'delete':
            gplObj.mutation = gql`
                type Mutation {
                    ${objectName}__${actionName}(id: JSON): JSON
                }
            `;
            break;
        default:
            // console.error(`need to handle action: ${actionName}`);
            break;
    }
    // console.log(gplObj);
    return gplObj;
}

export function generateSettingsGraphql(objectConfig: SteedosObjectTypeConfig) {
    let objectName = objectConfig.name;
    let fields = objectConfig.fields;
    let type = `type ${objectName} { _id: String `;
    let resolvers = {};
    resolvers[objectName] = {};
    _.each(fields, (field, name) => {
        if (name.indexOf('.') > -1) {
            return;
        }
        if (!field.type) {
            // console.error(`The field ${name} of ${objectName} has no type property.`);
            type += `${name}: JSON `;
            return;
        }
        if (BASIC_TYPE_MAPPING[field.type]) {
            type += `${name}: ${BASIC_TYPE_MAPPING[field.type]} `;
        }
        else if ((field.type == 'lookup' || field.type == 'master_detail') && field.reference_to && _.isString(field.reference_to)) {
            let refTo = field.reference_to;
            if (field.multiple) {
                type += `${name}: [String] `;
                type += `${name}${EXPAND_SUFFIX}: [${refTo}] `;
                resolvers[objectName][`${name}${EXPAND_SUFFIX}`] = {
                    action: `${getObjectServiceName(refTo)}.${GRAPHQL_ACTION_PREFIX}${EXPAND_SUFFIX}_multiple`,
                    rootParams: {
                        [name]: 'ids'
                    },
                    params: {
                        'objectName': refTo
                    }
                }
            } else {
                type += `${name}: String `;
                type += `${name}${EXPAND_SUFFIX}: ${refTo} `;
                resolvers[objectName][`${name}${EXPAND_SUFFIX}`] = {
                    action: `${getObjectServiceName(refTo)}.${GRAPHQL_ACTION_PREFIX}${EXPAND_SUFFIX}`,
                    rootParams: {
                        [name]: 'id'
                    },
                    params: {
                        'objectName': refTo
                    }
                }
            }
        }
        else {
            type += `${name}: JSON `;
        }
    })

    // _display
    let _display_type_name = `${DISPLAY_PREFIX}_${objectName}`;
    type += `${DISPLAY_PREFIX}(fields: [String]): ${_display_type_name} `;
    // resolvers[objectName][DISPLAY_PREFIX] = async function (parent, args, context, info) {
    //     let userSession = context.ctx.meta.user;
    //     return await translateToDisplay(objectName, parent, userSession);
    // }
    resolvers[objectName][DISPLAY_PREFIX] = {
        action: `${getObjectServiceName(objectName)}.${GRAPHQL_ACTION_PREFIX}${DISPLAY_PREFIX}`,
        rootParams: {
            '_id': '_id'
        },
        params: {
            'objectName': objectName
        }
    }
    // define _display type
    let _display_type = _getDisplayType(_display_type_name, fields);
    type = gql`
        ${_display_type}
        ${type}
    `;

    // _related
    if (objectConfig.enable_files) {
        let relatedObjName = 'cms_files';
        let relatedFieldName = `${RELATED_PREFIX}_files`;
        type += _getRelatedType(relatedFieldName, relatedObjName);
        resolvers[objectName][relatedFieldName] = _getRelatedResolverForEnableProperty(objectName, relatedObjName, 'parent');
    }
    if (objectConfig.enable_tasks) {
        let relatedObjName = 'tasks';
        let relatedFieldName = `${RELATED_PREFIX}_${relatedObjName}`;
        type += _getRelatedType(relatedFieldName, relatedObjName);
        resolvers[objectName][relatedFieldName] = _getRelatedResolverForEnableProperty(objectName, relatedObjName, 'related_to');
    }
    if (objectConfig.enable_notes) {
        let relatedObjName = 'notes';
        let relatedFieldName = `${RELATED_PREFIX}_${relatedObjName}`;
        type += _getRelatedType(relatedFieldName, relatedObjName);
        resolvers[objectName][relatedFieldName] = _getRelatedResolverForEnableProperty(objectName, relatedObjName, 'related_to');
    }
    if (objectConfig.enable_events) {
        let relatedObjName = 'events';
        let relatedFieldName = `${RELATED_PREFIX}_${relatedObjName}`;
        type += _getRelatedType(relatedFieldName, relatedObjName);
        resolvers[objectName][relatedFieldName] = _getRelatedResolverForEnableProperty(objectName, relatedObjName, 'related_to');
    }
    if (objectConfig.enable_audit) {
        let relatedObjName = 'audit_records';
        let relatedFieldName = `${RELATED_PREFIX}_${relatedObjName}`;
        type += _getRelatedType(relatedFieldName, relatedObjName);
        resolvers[objectName][relatedFieldName] = _getRelatedResolverForEnableProperty(objectName, relatedObjName, 'related_to');
    }
    if (objectConfig.enable_instances) {
        let relatedObjName = 'instances';
        let relatedFieldName = `${RELATED_PREFIX}_${relatedObjName}`;
        type += _getRelatedType(relatedFieldName, relatedObjName);
        resolvers[objectName][relatedFieldName] = _getRelatedResolverForEnableProperty(objectName, relatedObjName, 'record_ids');
    }
    if (objectConfig.enable_approvals) {
        let relatedObjName = 'approvals';
        let relatedFieldName = `${RELATED_PREFIX}_${relatedObjName}`;
        type += _getRelatedType(relatedFieldName, relatedObjName);
        resolvers[objectName][relatedFieldName] = _getRelatedResolverForEnableProperty(objectName, relatedObjName, 'related_to');
    }


    type += '}';
    return {
        type: type,
        resolvers: resolvers
    }
}

export async function dealWithRelatedFields(objectConfig: SteedosObjectTypeConfig, graphql) {
    let steedosSchema = getSteedosSchema();
    let objectName = objectConfig.name;
    let obj = steedosSchema.getObject(objectName);
    // 拆开 使用单独的promise处理
    let detailsInfo = await obj.getDetailsInfo();
    let lookupsInfo = await obj.getLookupDetailsInfo();
    let relatedInfos = detailsInfo.concat(lookupsInfo);
    for (const info of relatedInfos) {
        if (!info.startsWith('__')) {
            let infos = info.split('.');
            let detailObjectApiName = infos[0];
            let detailFieldName = infos[1];
            let relatedFieldName = correctName(`${RELATED_PREFIX}_${detailObjectApiName}_${detailFieldName}`);
            let relatedType = _getRelatedType(relatedFieldName, detailObjectApiName);
            if (graphql.type.indexOf(relatedType) > -1) { // 防止重复定义field
                continue;
            }
            graphql.type = graphql.type.substring(0, graphql.type.length - 1) + relatedType + '}';
            graphql.resolvers[objectName][relatedFieldName] = getRelatedResolver(objectName, detailObjectApiName, detailFieldName, '');

        }
    }
}

export function correctName(name: string) {
    return name.replace(/\./g, '_').replace(/\$/g, '_');
}

export function _getRelatedType(relatedFieldName, relatedObjName) {
    return `${relatedFieldName}(fields: [String], filters: JSON, top: Int, skip: Int, sort: String): [${relatedObjName}] `;
}

export function getGraphqlActions(objectConfig: SteedosObjectTypeConfig) {
    let actions = {};
    let objName = objectConfig.name;

    actions[`${GRAPHQL_ACTION_PREFIX}${EXPAND_SUFFIX}_multiple`] = {
        handler: async function (ctx) {
            let { ids, objectName } = ctx.params;
            if (_.isEmpty(ids)) {
                return null;
            }
            let filters = [['_id', 'in', ids]];
            let steedosSchema = getSteedosSchema();
            let obj = steedosSchema.getObject(objectName);
            return obj.directFind({ filters: filters });
        }
    }
    actions[`${GRAPHQL_ACTION_PREFIX}${EXPAND_SUFFIX}`] = {
        handler: async function (ctx) {
            let { id, objectName } = ctx.params;
            if (!id) {
                return;
            }
            let steedosSchema = getSteedosSchema();
            let obj = steedosSchema.getObject(objectName);
            const record = await obj.findOne(id);
            return record;
        }
    }

    if (['cms_files', 'tasks', 'notes', 'events', 'audit_records', 'instances', 'approvals'].includes(objName)) {
        actions[`${GRAPHQL_ACTION_PREFIX}${RELATED_PREFIX}_enabled`] = {
            handler: async function (ctx) {
                let params = ctx.params;
                let { _parentId, _related_params } = params;
                let { objectName, parentObjectName, foreignKey } = _related_params;
                let userSession = ctx.meta.user;
                let steedosSchema = getSteedosSchema();
                let object = steedosSchema.getObject(objectName);
                let filters = [];
                filters = [[`${foreignKey}.o`, "=", parentObjectName], [`${foreignKey}.ids`, "=", _parentId]];
                if (params.filters) {
                    filters.push(params.filters);
                }
                params.filters = filters;
                return await object.find(params, userSession);
            }
        }
    }

    actions[`${GRAPHQL_ACTION_PREFIX}${RELATED_PREFIX}`] = {
        handler: async function (ctx) {
            let params = ctx.params;
            let { _parentId, _related_params } = params;
            let { objectName, parentObjectName, fieldName, referenceToParentFieldName } = _related_params;
            let userSession = ctx.meta.user;
            let steedosSchema = getSteedosSchema();
            let object = steedosSchema.getObject(objectName);
            let parentObj = steedosSchema.getObject(parentObjectName);
            let parent = await parentObj.findOne(_parentId);
            let filters = [];
            let _idValue = parent._id;
            if (referenceToParentFieldName) {
                _idValue = parent[referenceToParentFieldName];
            }
            filters = [[fieldName, "=", _idValue]];
            if (params.filters) {
                filters.push(params.filters);
            }
            params.filters = filters;
            return await object.find(params, userSession);
        }
    }

    actions[`${GRAPHQL_ACTION_PREFIX}${DISPLAY_PREFIX}`] = {
        handler: async function (ctx) {
            let params = ctx.params;
            let { _id, objectName, fields } = params;
            let userSession = ctx.meta.user;
            let steedosSchema = getSteedosSchema();
            let obj = steedosSchema.getObject(objectName);
            let options: any = {};
            if (fields && fields.length > 0) {
                options.fields = fields;
            }
            let doc = await obj.findOne(_id, options)
            let result = await translateToDisplay(objectName, doc, userSession);
            return result;
        }
    }

    return actions;
}

function _getRelatedResolverForEnableProperty(parentObjectName, relatedObjName, foreignKey) {
    return {
        action: `${getObjectServiceName(relatedObjName)}.${GRAPHQL_ACTION_PREFIX}${RELATED_PREFIX}_enabled`,
        rootParams: {
            '_id': '_parentId'
        },
        params: {
            '_related_params': {
                'objectName': relatedObjName,
                'parentObjectName': parentObjectName,
                'foreignKey': foreignKey
            }
        }
    }
}

export function getRelatedResolver(objectApiName, detailObjectApiName, detailFieldName, detailFieldReferenceToFieldName) {
    return {
        action: `${getObjectServiceName(detailObjectApiName)}.${GRAPHQL_ACTION_PREFIX}${RELATED_PREFIX}`,
        rootParams: {
            '_id': '_parentId'
        },
        params: {
            '_related_params': {
                'objectName': detailObjectApiName,
                'parentObjectName': objectApiName,
                'fieldName': detailFieldName,
                'referenceToParentFieldName': detailFieldReferenceToFieldName
            }
        }
    }
}

function getTranslatedFieldConfig(translatedObject: any, name: string) {
    return translatedObject.fields[name.replace(/__label$/, "")];
}

async function translateToDisplay(objectName, doc, userSession: any) {
    // const lng = getUserLocale(userSession);
    let steedosSchema = getSteedosSchema();
    // let object = steedosSchema.getObject(objectName);
    let objConfigCache = getObjectConfig(objectName);
    let fields = objConfigCache.fields
    let objConfig = true ? objConfigCache : clone(objConfigCache);
    // translationObject(lng, objConfig.name, objConfig);
    let displayObj = { _id: doc._id };
    let utcOffset = userSession.utcOffset;
    for (const name of _.keys(doc)) {
        if (Object.prototype.hasOwnProperty.call(fields, name)) {
            const field = fields[name];
            if (_.has(doc, name)) {
                const fType = field.type;
                if (fType == 'text') {
                    displayObj[name] = doc[name] || '';
                }
                else if (fType == 'textarea') {
                    displayObj[name] = doc[name] || '';
                }
                else if (fType == 'html_text') {
                    displayObj[name] = doc[name] || '';
                }
                else if (fType == 'html') {
                    displayObj[name] = doc[name] || '';
                }
                else if (fType == 'select') {
                    let label = '';
                    let map = {};
                    let value = doc[name];
                    let translatedField = getTranslatedFieldConfig(objConfig, name);
                    let translatedFieldOptions = translatedField && translatedField.options;
                    _.forEach(translatedFieldOptions, function (o) {
                        map[o.value] = o.label;
                    });
                    if (field.multiple) {
                        let labels = [];
                        _.forEach(value, function (v) {
                            labels.push(map[v]);
                        })
                        label = labels.join(',');
                    } else {
                        label = map[value];
                    }
                    displayObj[name] = label;
                }
                else if (fType == 'boolean') {
                    if (doc[name]) {
                        displayObj[name] = '√';
                    } else {
                        displayObj[name] = '';
                    }
                }
                else if (fType == 'date') {
                    displayObj[name] = moment(doc[name]).utcOffset(utcOffset).format("YYYY-MM-DD")
                }
                else if (fType == 'datetime') {
                    displayObj[name] = moment(doc[name]).utcOffset(utcOffset).format("YYYY-MM-DD H:mm")
                }
                else if (fType == 'number') {
                    displayObj[name] = doc[name] || '';
                }
                else if (fType == 'currency') {
                    displayObj[name] = doc[name] || '';
                }
                else if (fType == 'percent') {
                    displayObj[name] = `${doc[name] * 100}%`;
                }
                else if (fType == 'password') {
                    displayObj[name] = '';
                    if (_.isString(doc[name])) {
                        for (let i = 0; i < doc[name].length; i++) {
                            displayObj[name] += '*';
                        }
                    }
                }
                else if (fType == 'lookup' && _.isString(field.reference_to)) {
                    let lookupLabel = '';
                    let refTo = field.reference_to;
                    let refValue = doc[name];
                    let refObj = steedosSchema.getObject(refTo);
                    let nameFieldKey = getObjectConfig(refTo).NAME_FIELD_KEY;
                    if (field.multiple) {
                        let refRecords = await refObj.directFind({ filters: [`_id`, 'in', refValue], fields: [nameFieldKey] });
                        lookupLabel = _.pluck(refRecords, nameFieldKey).join(',');
                    } else {
                        let refRecord = await refObj.findOne(refValue, {fields: [nameFieldKey]});
                        if (refRecord) {
                            lookupLabel = refRecord[nameFieldKey];
                        }
                    }
                    displayObj[name] = lookupLabel;
                }
                else if (fType == 'master_detail' && _.isString(field.reference_to)) {
                    let masterDetailLabel = '';
                    let refTo = field.reference_to;
                    let refValue = doc[name];
                    let refObj = steedosSchema.getObject(refTo);
                    let nameFieldKey = getObjectConfig(refTo).NAME_FIELD_KEY;
                    if (field.multiple) {
                        let refRecords = await refObj.directFind({ filters: [`_id`, 'in', refValue], fields: [nameFieldKey] });
                        masterDetailLabel = _.pluck(refRecords, nameFieldKey).join(',');
                    } else {
                        let refRecord = await refObj.findOne(refValue, {fields: [nameFieldKey]});
                        if (refRecord) {
                            masterDetailLabel = refRecord[nameFieldKey];
                        }
                    }
                    displayObj[name] = masterDetailLabel;
                }
                else if (fType == 'autonumber') {
                    displayObj[name] = doc[name] || '';
                }
                else if (fType == 'url') {
                    displayObj[name] = doc[name] || '';
                }
                else if (fType == 'email') {
                    displayObj[name] = doc[name] || '';
                }
                else if (fType == 'formula') {
                    displayObj[name] = doc[name] || '';
                }
                else if (fType == 'summary') {
                    displayObj[name] = doc[name] || '';
                }
                else if (fType == 'image') {
                    displayObj[name] = doc[name] || '';
                }
                else {
                    console.error(`Graphql Display: need to handle new field type ${field.type} for ${objectName}.`);
                    displayObj[name] = doc[name] || '';
                }
            } else {
                displayObj[name] = ''; // 如果值为空，均返回空字符串
            }
        }
    }
    return displayObj;
}

function _getDisplayType(typeName, fields) {
    let type = `type ${typeName} { _id: String `;
    _.each(fields, (field, name) => {
        if (name.indexOf('.') > -1) {
            return;
        }
        type += `${name}: JSON `
    })
    type += '}';
    return type;
}