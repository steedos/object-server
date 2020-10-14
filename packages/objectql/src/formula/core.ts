import { getSteedosSchema } from '../index';
import { SteedosFieldFormulaTypeConfig, SteedosFormulaVarTypeConfig, SteedosFormulaParamTypeConfig, SteedosFormulaVarPathTypeConfig, 
    FormulaUserKey, SteedosFormulaBlankValue, SteedosFormulaOptions, SteedosQuotedByFieldFormulasTypeConfig } from './type';
import { getObjectQuotedByFieldFormulaConfigs, getObjectFieldFormulaConfigs } from './field_formula';
import { runQuotedByObjectFieldSummaries, getObjectQuotedByFieldSummaryConfigs } from '../summary';
import { checkCurrentUserIdNotRequiredForFieldFormulas, getFormulaVarPathsAggregateLookups, isFieldFormulaConfigQuotingObjectAndFields } from './util';
import { wrapAsync } from '../util';
import { JsonMap } from "@salesforce/ts-types";
import { SteedosQueryFilters } from '../types';
import _ = require('lodash')
// import _eval = require('eval')
import { extract, parse } from 'formulon'
import { getFieldSubstitution } from './params'

/**
 * 根据公式内容，取出其中{}中的变量
 * @param formula 
 */
export const pickFormulaVars = (formula: string): Array<string> => {
    return extract(formula);
}

/**
 * 根据公式内容，取出其中{}中的变量，并进一步取出这些变量中引用了当前对象的哪些字段
 * @param fieldFormulaConfig 
 */
export const pickFieldFormulaVarFields = (fieldFormulaConfigs: SteedosFieldFormulaTypeConfig | Array<SteedosFieldFormulaTypeConfig>): Array<string> => {
    if (!_.isArray(fieldFormulaConfigs)) {
        fieldFormulaConfigs = [fieldFormulaConfigs];
    }
    let result = ["space"]; //space字段作为基础字段不能少
    fieldFormulaConfigs.forEach((fieldFormulaConfig: SteedosFieldFormulaTypeConfig) => {
        let { vars } = fieldFormulaConfig;
        result = _.union(result, pickFormulaVarFields(vars));
    });
    return _.uniq(result);
}

/**
 * 根据公式内容已取出的{}中的变量，进一步取出这些变量中引用了当前对象的哪些字段
 * @param vars 
 */
export const pickFormulaVarFields = (vars: Array<SteedosFormulaVarTypeConfig>): Array<string> => {
    let result = ["space"]; //space字段作为基础字段不能少
    vars.forEach((varItem: SteedosFormulaVarTypeConfig) => {
        if (varItem.paths.length) {
            // 如果是$user变量则paths肯定为空，所以取paths中第一个，第一个一定是当前对象中的字段
            let firstPath: SteedosFormulaVarPathTypeConfig = varItem.paths[0];
            let firstKey = firstPath.field_name;
            result.push(firstKey);
        }
    });
    return _.uniq(result);
}

/**
 * 根据公式中的变量值，计算出跨对象引用的记录对应的字段值，作为公式运算的参数返回
 * @param doc 
 * @param vars 
 * return Array<SteedosFormulaParamTypeConfig>
 */
export const computeFormulaParams = async (doc: JsonMap, vars: Array<SteedosFormulaVarTypeConfig>, currentUserId: string) => {
    let params: Array<SteedosFormulaParamTypeConfig> = [];
    const spaceId = doc.space;
    if (vars && vars.length) {
        for (let { key, paths, is_user_var: isUserVar } of vars) {
            key = key.trim();
            // 如果变量key以$user开头,则解析为userSession,此时paths为空
            let tempValue: any;
            if (isUserVar) {
                if (!currentUserId) {
                    throw new Error(`computeFormulaParams:The param 'currentUserId' is required for the formula var key ${key} while running`);
                }
                if (!spaceId) {
                    throw new Error(`computeFormulaParams:The 'space' property is required for the doc of the formula var key ${key} while running`);
                }
                // if (!currentUserId) {
                //     throw new Error(`computeFormulaParams:The param 'currentUserId' is required for the formula var key ${key}`);
                // }
                // let tempFormulaParams = {};
                // let tepmFormula = key.replace(FormulaUserKey, `__params["${FormulaUserKey}"]`);
                // tepmFormula = `return ${tepmFormula}`
                // tempFormulaParams[FormulaUserKey] = currentUserId;
                // tempValue = evalFieldFormula(tepmFormula, tempFormulaParams);
            }
            tempValue = _.reduce(paths, (reslut, next, index) => {
                if (index === 0) {
                    if (isUserVar) {
                        // $user变量也要按查相关表记录的方式取值，第一个path为根据id取出对应的space_users记录
                        const sus = wrapAsync(function () {
                            return getSteedosSchema().getObject("space_users").find({
                                filters: [["user", "=", currentUserId], ["space", "=", spaceId]],
                                fields: [next.field_name]
                            });
                        }, {});
                        reslut = sus && sus.length && sus[0];
                        if (reslut) {
                            return reslut[next.field_name]
                        }
                        else {
                            return null
                        }
                    }
                    else {
                        return <any>doc[next.field_name];
                    }
                }
                else {
                    if (!reslut) {
                        // 当上一轮返回空值或0时，直接返回
                        return reslut;
                    }
                    reslut = wrapAsync(function () {
                        return getSteedosSchema().getObject(next.reference_from).findOne(<any>reslut, { fields: [next.field_name] })
                    }, {});
                    if (reslut) {
                        return reslut[next.field_name]
                    }
                    else {
                        return null
                    }
                }
            }, null);
            params.push({
                key: key,
                path: _.last(paths),
                value: tempValue
            });
        }
    }
    return params;
}

export const computeFieldFormulaValue = async (doc: JsonMap, fieldFormulaConfig: SteedosFieldFormulaTypeConfig, currentUserId: string) => {
    if (!currentUserId) {
        checkCurrentUserIdNotRequiredForFieldFormulas(fieldFormulaConfig);
    }
    const { formula, vars, data_type, formula_blank_value } = fieldFormulaConfig;
    let params = await computeFormulaParams(doc, vars, currentUserId);
    return runFormula(formula, params, {
        returnType: data_type,
        blankValue: formula_blank_value
    });
}

export const evalFieldFormula = function (formula: string, formulaParams: object) {
    try {
        // let formulaFun = `module.exports = function (__params) { ${formula} }`;
        // console.log("==evalFieldFormula==formulaFun===", formulaFun);
        // console.log("==evalFieldFormula==formulaParams===", formulaParams);
        // return _eval(formulaFun)(formulaParams);
        return parse(formula, formulaParams)
    }
    catch (ex) {
        formulaParams[FormulaUserKey] = "{...}" //$user简化，打出的日志看得清楚点
        throw new Error(`evalFieldFormula:Catch an error "${ex}" while eval formula "${formula}" with params "${JSON.stringify(formulaParams)}"`);
    }
}

/**
 * 运行公式
 * @param formula 公式脚本内容
 * @param params 参数
 * @param formulaType 公式返回类型，如果空则不判断类型
 */
export const runFormula = function (formula: string, params: Array<SteedosFormulaParamTypeConfig>, options?: SteedosFormulaOptions) {
    if (!options) {
        options = {};
    }
    // console.log("===runFormula===formula====", formula);
    // console.log("===runFormula===params====", params);
    let { returnType, blankValue } = options;
    let formulaParams = {};
    params.forEach(({ key, path, value }) => {
        // formulaParams[key] = value;
        // 把{}括起来的变量替换为计算得到的变量值
        // formula = formula.replace(`{${key}}`, `__params["${key}"]`);
        formulaParams[key] = getFieldSubstitution(path.reference_from, path.field_name, value, blankValue);
    });
    
    let result = evalFieldFormula(formula, formulaParams);
    // console.log("===runFormula===result====", result);
    let formulaValue = result.value;
    let formulaValueType = result.dataType;
    if(result.type === 'error'){
        if(blankValue === SteedosFormulaBlankValue.blanks && result.errorType === "ArgumentError"){
            // 配置了空参数视为空值时会直接返回空值类型，这里就会报错，直接返回空值，而不是抛错
            // TODO:result.errorType === "ArgumentError"不够细化，下一版本应该视错误情况优化返回空值的条件
            formulaValue = null;
        }
        else{
            throw new Error(result.message);
        }
    }
    if (formulaValueType === "number" && _.isNaN(formulaValue)){
        // 数值类型计算结果为NaN时，保存为空值
        formulaValue = null;
    }

    if (returnType && formulaValueType && formulaValueType != "null") {
        switch (returnType) {
            case "boolean":
                if (formulaValueType !== "checkbox") {
                    throw new Error(`runFormula:The field formula "${formula}" with params "${JSON.stringify(formulaParams)}" should return a boolean type result but got a ${formulaValueType} type value '${formulaValue}'.`);
                }
                break;
            case "number":
                if (formulaValueType !== "number") {
                    throw new Error(`runFormula:The field formula "${formula}" with params "${JSON.stringify(formulaParams)}" should return a number type result but got a ${formulaValueType} type value '${formulaValue}'.`);
                }
                break;
            case "currency":
                if (formulaValueType !== "number") {
                    throw new Error(`runFormula:The field formula "${formula}" with params "${JSON.stringify(formulaParams)}" should return a number type result but got a ${formulaValueType} type value '${formulaValue}'.`);
                }
                break;
            case "text":
                if (formulaValueType !== "text") {
                    throw new Error(`runFormula:The field formula "${formula}" with params "${JSON.stringify(formulaParams)}" should return a string type result but got a ${formulaValueType} type value '${formulaValue}'.`);
                }
                break;
            case "date":
                if (formulaValueType !== "date") {
                    // 这里不可以直接用result.constructor == Date或result instanceof Date，因为eval后的同一个基础类型的构造函数指向的不是同一个
                    throw new Error(`runFormula:The field formula "${formula}" with params "${JSON.stringify(formulaParams)}" should return a date type result but got a ${formulaValueType} type value '${formulaValue}'.`);
                }
                break;
            case "datetime":
                if (formulaValueType !== "datetime") {
                    // 这里不可以直接用result.constructor == Date或result instanceof Date，因为eval后的同一个基础类型的构造函数指向的不是同一个
                    throw new Error(`runFormula:The field formula "${formula}" with params "${JSON.stringify(formulaParams)}" should return a date type result but got a ${formulaValueType} type value '${formulaValue}'.`);
                }
                break;
        }
    }
    // console.log("===runFormula===formulaValue====", formulaValue);
    return formulaValue;
}

const addToAggregatePaths = (varItemToAggregatePaths: Array<SteedosFormulaVarPathTypeConfig>, toAggregatePaths: Array<Array<SteedosFormulaVarPathTypeConfig>>) => {
    // 当引用了同一个对象的不同属性时，只需要记录其中一个，因为一个公式里面引用的字段变更后，只需要重算一次，比如以下两个都将只有第一条会加入到toAggregatePaths中
    // [{"key":"account.website","paths":[{"field_name":"account","reference_from":"contacts"},{"field_name":"website","reference_from":"accounts"}]}]
    // [{"key":"account.name","paths":[{"field_name":"account","reference_from":"contacts"},{"field_name":"name","reference_from":"accounts"}]}]
    const pathLength = varItemToAggregatePaths.length;
    let existPath = toAggregatePaths.find((item) => {
        return JSON.stringify(item.slice(0, pathLength)) === JSON.stringify(varItemToAggregatePaths.slice(0, pathLength))
    });
    if (!existPath) {
        toAggregatePaths.push(varItemToAggregatePaths);
    }
}

/**
 * 在所有字段引用关系（包括跨对象的字段引用关系）中找到引用了当前正在update的对象字段的公式字段并更新其字段值
 * 如果当前不是update而是insert则不需要调用该函数，因为这时这条记录不可能存在引用关系
 * @param objectName 
 * @param recordId 
 * @param currentUserId 
 * @param options.fieldNames 传入该参数时，只查找和处理引用了该对象中这些指定字段的公式字段
 * @param options.escapeConfigs 传入该参数时，将额外跳过这些公式字段配置的运算，提高性能
 * @param options.quotedByConfigs 如果已经根据objectName和fieldNames查过相关配置了，请直接传入，可以避免重复查找，提高性能
 */
export const runQuotedByObjectFieldFormulas = async function (objectName: string, recordId: string, userSession: any, options: {
    fieldNames?: Array<string>,
    escapeConfigs?: Array<SteedosFieldFormulaTypeConfig> | Array<string>,
    quotedByConfigs?: SteedosQuotedByFieldFormulasTypeConfig
} = {}) {
    let currentUserId = userSession ? userSession.userId : undefined;
    let { fieldNames, escapeConfigs, quotedByConfigs } = options;
    if (!quotedByConfigs) {
        quotedByConfigs = getObjectQuotedByFieldFormulaConfigs(objectName, fieldNames, escapeConfigs);
        // console.log("runQuotedByObjectFieldFormulas===objectName, fieldNames, escapeConfigs===", objectName, fieldNames, escapeConfigs);
        // console.log("runQuotedByObjectFieldFormulas===quotedByConfigs===", quotedByConfigs);
    }
    if (!quotedByConfigs.allConfigs.length) {
        return;
    }
    if (!currentUserId) {
        checkCurrentUserIdNotRequiredForFieldFormulas(quotedByConfigs.allConfigs);
    }
    // 要排除allConfigs中的ownConfigs，因为allConfigs中已经（按依赖关系先后次序）执行过的当前objectName引用自身的公式字段，不需要在下次级联调用runQuotedByObjectFieldFormulas时再次执行
    for (const config of quotedByConfigs.allConfigs) {
        await updateQuotedByObjectFieldFormulaValue(objectName, recordId, config, userSession, quotedByConfigs.ownConfigs);
    }
}

/**
 * 找到当前正在insert/update的对象中的公式字段并更新其字段值
 * @param objectName 
 * @param recordId 
 * @param doc 
 * @param currentUserId 
 * @param needRefetchDoc 当doc不可信赖时，需要从数据库中重新抓取doc，请传入true值
 * @param configs 如果已经根据objectName查过相关配置了，请直接传入，可以避免重复查找，提高性能
 */
export const runCurrentObjectFieldFormulas = async function (objectName: string, recordId: string, doc: JsonMap, currentUserId: string, needRefetchDoc?: boolean, configs?: Array<SteedosFieldFormulaTypeConfig>) {
    if (!configs) {
        configs = getObjectFieldFormulaConfigs(objectName);
    }
    if (!configs.length) {
        return;
    }
    if (!currentUserId) {
        checkCurrentUserIdNotRequiredForFieldFormulas(configs);
    }
    if (needRefetchDoc) {
        const formulaVarFields = pickFieldFormulaVarFields(configs);
        doc = await getSteedosSchema().getObject(objectName).findOne(recordId, { fields: formulaVarFields });
    }
    let setDoc = {};
    for (const config of configs) {
        doc = Object.assign({}, doc, setDoc);//setDoc中计算得到的结果应该重新并到doc中支持计算
        setDoc[config.field_name] = await computeFieldFormulaValue(doc, config, currentUserId);
    }
    await getSteedosSchema().getObject(objectName).directUpdate(recordId, setDoc);
}

/**
 * 找到当前正在update的对象多条记录的公式字段并更新其字段值
 * @param objectName 
 * @param filters 
 * @param currentUserId 
 */
export const runManyCurrentObjectFieldFormulas = async function (objectName: string, filters: SteedosQueryFilters, currentUserId: string) {
    const configs = getObjectFieldFormulaConfigs(objectName);
    if (!configs.length) {
        return;
    }
    if (!currentUserId) {
        checkCurrentUserIdNotRequiredForFieldFormulas(configs);
    }
    const formulaVarFields = pickFieldFormulaVarFields(configs);
    let docs = await getSteedosSchema().getObject(objectName).find({ filters: filters, fields: formulaVarFields });
    for (const doc of docs) {
        await runCurrentObjectFieldFormulas(objectName, doc._id, doc, currentUserId, false, configs);
    }
}

/**
 * 修改记录时，根据查到的引用了该记录相关字段公式配置，重新计算字段公式，并把计算结果更新到数据库相关记录中
 * @param objectName 当前修改的记录所属对象名称
 * @param recordId 当前修改的记录ID
 * @param fieldFormulaConfig 查到的引用了该记录所属对象的相关字段公式配置之一
 */
export const updateQuotedByObjectFieldFormulaValue = async (objectName: string, recordId: string, fieldFormulaConfig: SteedosFieldFormulaTypeConfig, userSession: any, escapeConfigs?: Array<SteedosFieldFormulaTypeConfig> | Array<string>) => {
    // console.log("===updateQuotedByObjectFieldFormulaValue===", objectName, recordId, JSON.stringify(fieldFormulaConfig));
    const { vars, object_name: fieldFormulaObjectName } = fieldFormulaConfig;
    let toAggregatePaths: Array<Array<SteedosFormulaVarPathTypeConfig>> = [];
    for (let varItem of vars) {
        // vars格式如：[{"key":"account.website","paths":[{"field_name":"account","reference_from":"contacts"},{"field_name":"website","reference_from":"accounts"}]}]
        const { paths } = varItem;
        let isInPaths = false;
        let varItemToAggregatePaths = [];
        for (let pathItem of paths) {
            varItemToAggregatePaths.push(pathItem);
            if (pathItem.reference_from === objectName) {
                isInPaths = true;
                break;
            }
        }
        if (isInPaths) {
            // 添加时去除重复项
            addToAggregatePaths(varItemToAggregatePaths, toAggregatePaths);
        }
    }
    // 只有一层引用关系时，vars格式如：[{"key":"account.website","paths":[{"field_name":"account","reference_from":"contacts"},{"field_name":"website","reference_from":"accounts"}]}]
    // 则toAggregatePaths为[[{"field_name":"account","reference_from":"contacts"},{"field_name":"website","reference_from":"accounts"}]]
    // 超过一层引用关系时，vars格式如：[{"key":"account.modified_by.name","paths":[{"field_name":"account","reference_from":"contacts"},{"field_name":"modified_by","reference_from":"accounts"},{"field_name":"name","reference_from":"users"}]}]
    // 则toAggregatePaths为[[{"field_name":"account","reference_from":"contacts"},{"field_name":"modified_by","reference_from":"accounts"},{"field_name":"name","reference_from":"users"}]]
    // toAggregatePaths只会添加到paths中reference_from为objectName的变量路径，多余的不需要加进来
    // 例如当前修改的是某条用户记录的内容，即objectName为users，vars可能为：
    // [{"key":"account.modified_by.company_id.name","paths":[{"field_name":"account","reference_from":"contacts"},{"field_name":"modified_by","reference_from":"accounts"},{"field_name":"company_id","reference_from":"users"},{"field_name":"name","reference_from":"company"}]}]
    // 则toAggregatePaths为[[{"field_name":"account","reference_from":"contacts"},{"field_name":"modified_by","reference_from":"accounts"},{"field_name":"company_id","reference_from":"users"}]]
    const formulaVarFields = pickFieldFormulaVarFields(fieldFormulaConfig);
    for (let toAggregatePathsItem of toAggregatePaths) {
        if (toAggregatePathsItem.length < 3) {
            // 引用关系只有一层时，可以直接查出哪些记录需要更新重算公式字段值
            let tempPath = toAggregatePathsItem[0];
            // if (tempPath.is_formula && fieldFormulaObjectName === objectName && tempPath.reference_from === objectName) {
            if (fieldFormulaObjectName === objectName && tempPath.reference_from === objectName) {
                // 如果修改的是当前对象本身的公式字段值时，只需要更新当前记录的公式字段值就行
                let doc = await getSteedosSchema().getObject(fieldFormulaObjectName).findOne(recordId, { fields: formulaVarFields })
                await updateDocsFieldFormulaValue(doc, fieldFormulaConfig, userSession, escapeConfigs);
            }
            else {
                // 修改的是其他对象上的字段值（包括修改的是其他对象上的公式字段值），则需要按recordId值查出哪些记录需要更新重算公式字段值
                let docs = await getSteedosSchema().getObject(fieldFormulaObjectName).find({ filters: [[tempPath.field_name, "=", recordId]], fields: formulaVarFields })
                await updateDocsFieldFormulaValue(docs, fieldFormulaConfig, userSession, escapeConfigs);
            }
        }
        else {
            // 引用关系超过一层时，需要使用aggregate来查出哪些记录需要更新重算公式字段值
            let aggregateLookups = getFormulaVarPathsAggregateLookups(toAggregatePathsItem);
            let lastLookupAs = aggregateLookups[aggregateLookups.length - 1]["$lookup"].as;
            let aggregateFilters = [[`${lastLookupAs}._id`, "=", recordId]];
            const docs = await getSteedosSchema().getObject(fieldFormulaObjectName).directAggregatePrefixalPipeline({
                filters: aggregateFilters,
                fields: formulaVarFields
            }, aggregateLookups);
            await updateDocsFieldFormulaValue(docs, fieldFormulaConfig, userSession, escapeConfigs);
        }
    }
}

export const updateDocsFieldFormulaValue = async (docs: any, fieldFormulaConfig: SteedosFieldFormulaTypeConfig, userSession: any, escapeConfigs?: Array<SteedosFieldFormulaTypeConfig> | Array<string>) => {
    const { object_name: fieldFormulaObjectName } = fieldFormulaConfig;
    if (!_.isArray(docs)) {
        docs = [docs];
    }
    let currentUserId = userSession ? userSession.userId : undefined;
    for (let doc of docs) {
        let value = await computeFieldFormulaValue(doc, fieldFormulaConfig, currentUserId);
        let setDoc = {};
        setDoc[fieldFormulaConfig.field_name] = value;
        await getSteedosSchema().getObject(fieldFormulaObjectName).directUpdate(doc._id, setDoc);
    }
    // 这里特意重新遍历一次docs而不是直接在当前函数中每次更新一条记录后立即处理被引用字段的级联变更，见：公式或汇总触发级联重算时，数据类型变更可能会造成无法重算 #965
    await updateQuotedByDocsForFormulaType(docs, fieldFormulaConfig, userSession, escapeConfigs);
}

export const updateQuotedByDocsForFormulaType = async (docs: any, fieldFormulaConfig: SteedosFieldFormulaTypeConfig, userSession: any, escapeConfigs?: Array<SteedosFieldFormulaTypeConfig> | Array<string>) => {
    const { object_name: fieldFormulaObjectName } = fieldFormulaConfig;
    if (!_.isArray(docs)) {
        docs = [docs];
    }
    const fieldNames = [fieldFormulaConfig.field_name];
    const formulaQuotedByConfigs = getObjectQuotedByFieldFormulaConfigs(fieldFormulaObjectName, fieldNames, escapeConfigs);
    const summaryQuotedByConfigs = getObjectQuotedByFieldSummaryConfigs(fieldFormulaObjectName, fieldNames);
    for (let doc of docs) {
        // 公式字段修改后，需要找到引用了该公式字段的其他公式字段并更新其值
        await runQuotedByObjectFieldFormulas(fieldFormulaObjectName, doc._id, userSession, {
            fieldNames, 
            quotedByConfigs: formulaQuotedByConfigs,
            escapeConfigs
        })
        // 公式字段修改后，需要找到引用了该公式字段的其他汇总字段并更新其值
        await runQuotedByObjectFieldSummaries(fieldFormulaObjectName, doc._id, null, userSession, {
            fieldNames, 
            quotedByConfigs: summaryQuotedByConfigs
        });
    }
}

/**
 * 某个对象上的公式字段是否引用了某个对象和字段
 * @param formulaObjectName 公式字段在所在对象名称
 * @param formulaFieldName 公式字段名称
 * @param object_name 是否引用了该对象
 * @param field_name 是否引用了该字段
 */
export const isFormulaFieldQuotingObjectAndFields = (formulaObjectName: string, formulaFieldName: string, objectName: string, fieldNames?: Array<string>): boolean => {
    const configs: Array<SteedosFieldFormulaTypeConfig> = getObjectFieldFormulaConfigs(formulaObjectName, formulaFieldName);
    if (configs && configs.length) {
        return isFieldFormulaConfigQuotingObjectAndFields(configs[0], objectName, fieldNames);
    }
    else {
        // 没找到公式字段配置说明传入的参数不是公式字段
        return false;
    }
}