import { Dictionary, JsonMap } from "@salesforce/ts-types";
import { SteedosTriggerType, SteedosFieldType, SteedosFieldTypeConfig, SteedosSchema, SteedosListenerConfig, SteedosObjectListViewTypeConfig, SteedosObjectListViewType, SteedosIDType, SteedosObjectPermissionTypeConfig, SteedosActionType, SteedosActionTypeConfig, SteedosUserSession, getSteedosSchema } from ".";
import { getUserObjectSharesFilters, isTemplateSpace, isCloudAdminSpace, generateActionParams, absoluteUrl } from '../util'
import _ = require("underscore");
import { SteedosTriggerTypeConfig, SteedosTriggerContextConfig } from "./trigger";
import { SteedosQueryOptions, SteedosQueryFilters } from "./query";
import { SteedosDataSourceType, SteedosDatabaseDriverType } from "./datasource";
import { SteedosFieldDBType } from '../driver/fieldDBType';
import { runCurrentObjectFieldFormulas, runQuotedByObjectFieldFormulas } from '../formula';
import { runQuotedByObjectFieldSummaries, runCurrentObjectFieldSummaries } from '../summary';
import { formatFiltersToODataQuery } from "@steedos/filters";
import { WorkflowRulesRunner } from '../actions';
import { runValidationRules } from './validation_rules';
import { brokeEmitEvents } from "./object_events";
import { translationObject } from "@steedos/i18n";
import { getObjectLayouts } from "./object_layouts";
const clone = require('clone')

// 主子表有层级限制，超过3层就报错，该函数判断当前对象作为主表对象往下的层级最多不越过3层，
// 其3层指的是A-B-C-D，它们都有父子关系，A作为最顶层，该对象上不可以再创建主表子表关系字段，但是B、C、D上可以；
// 或者如果当前对象上创建的主表子表关系字段指向的对象是D，那么也会超过3层的层级限制；
// 又或者中间加一层M先连接B再连接C，形成A-B-M-C-D，也会超过3层的层级限制；
export const MAX_MASTER_DETAIL_LEAVE = 3;

/**
 * 判断传入的paths中每条path下是否有重复对象名称，返回第一个重复的对象名称
 * 有可能传入的paths有多个链条，只要其中任何一个链条上有同名对象名说明异常，返回第一个异常的同名对象名即可
 * 比如传入下面示例中的paths，表示当前对象b向下有4条主子关系链，将返回第三条链中的重复对象名b
 * @param paths 对象上getDetailPaths或getMasterPaths函数返回的当前对象向下或向上取主表子表关联对象名称列表链条
 * [
    [ 'b', 't1', 't2' ],
    [ 'b', 't1', 'm1', 'm2' ],
    [ 'b', 't1', 'm2', 'b' ],
    [ 'b', 'c', 'd' ]
 * ]
 */
export const getRepeatObjectNameFromPaths = (paths: string[]) => {
    let repeatItem: string;
    for (let p of paths) {
        if (repeatItem) {
            break;
        }
        let g = _.groupBy(p);
        for (let k in g) {
            if (g[k].length > 1) {
                repeatItem = k;
                break;
            }
        }
    }
    return repeatItem;
}

abstract class SteedosObjectProperties {
    _id?: string
    name?: string
    extend?: string
    table_name?: string
    label?: string
    icon?: string
    enable_search?: boolean
    is_enable?: boolean
    enable_files?: boolean
    enable_tasks?: boolean
    enable_notes?: boolean
    enable_events?: boolean
    enable_api?: boolean  //TODO 未开放功能
    enable_share?: boolean
    enable_instances?: boolean
    enable_chatter?: boolean
    enable_audit?: boolean
    enable_trash?: boolean
    enable_space_global?: boolean
    enable_tree?: boolean
    enable_enhanced_lookup?: boolean
    enable_inline_edit?: boolean
    enable_approvals?: boolean
    is_view?: boolean
    hidden?: boolean
    description?: string
    custom?: boolean
    owner?: string
    // triggers?: object
    sidebar?: object //TODO
    calendar?: object //TODO
    actions?: Dictionary<SteedosActionTypeConfig>
    fields?: Dictionary<SteedosFieldTypeConfig>
    listeners?: Dictionary<SteedosListenerConfig>
    list_views?: Dictionary<SteedosObjectListViewTypeConfig>
    permissions?: Dictionary<SteedosObjectPermissionTypeConfig>
    methods?: Dictionary<Function>
    fields_serial_number?: number
}



export interface SteedosObjectTypeConfig extends SteedosObjectProperties {
    __filename?: string
    __serviceName?: string
    name?: string
    datasource?: string
    fields: Dictionary<SteedosFieldTypeConfig>
    actions?: Dictionary<SteedosActionTypeConfig>
    listeners?: Dictionary<SteedosListenerConfig>
    permission_set?: Dictionary<SteedosObjectPermissionTypeConfig> //TODO remove ; 目前为了兼容现有object的定义保留
}

const _TRIGGERKEYS = ['beforeFind', 'beforeInsert', 'beforeUpdate', 'beforeDelete', 'afterFind', 'afterCount', 'afterFindOne', 'afterInsert', 'afterUpdate', 'afterDelete', 'beforeAggregate', 'afterAggregate']

const properties = ['label', 'icon', 'enable_search', 'sidebar', 'is_enable', 'enable_files', 'enable_tasks', 'enable_notes', 'enable_events', 'enable_api', 'enable_share', 'enable_instances', 'enable_chatter', 'enable_audit', 'enable_web_forms', 'enable_inline_edit', 'enable_approvals', 'enable_trash', 'enable_space_global', 'enable_tree', 'enable_enhanced_lookup', 'enable_workflow', 'is_view', 'hidden', 'description', 'custom', 'owner', 'methods', '_id', 'relatedList', 'fields_serial_number']

export class SteedosObjectType extends SteedosObjectProperties {

    private _schema: SteedosSchema;
    private _datasource: SteedosDataSourceType;
    public get datasource(): SteedosDataSourceType {
        return this._datasource;
    }
    private _name: string;
    private _fields: Dictionary<SteedosFieldType> = {};
    private _actions: Dictionary<SteedosActionType> = {};
    private _listeners: Dictionary<SteedosListenerConfig> = {};
    private _triggers: Dictionary<SteedosTriggerType> = {};
    private _list_views: Dictionary<SteedosObjectListViewType> = {};
    private _table_name: string;
    private _triggersQueue: Dictionary<Dictionary<SteedosTriggerType>> = {}
    private _idFieldName: string;
    private _idFieldNames: string[] = [];
    private _NAME_FIELD_KEY: string;
    private _masters: string[] = [];
    private _details: string[] = [];

    private _enable_audit: boolean;
    public get enable_audit(): boolean {
        return this._enable_audit;
    }
    public set enable_audit(value: boolean) {
        if (value && !this._datasource.enable_space) {
            throw new Error(`not support, please set ${this._name}.enable_audit to false or remove the enable_audit attribute`)
        }
        this._enable_audit = value;
    }

    private _enable_instances: boolean;
    public get enable_instances(): boolean {
        return this._enable_instances;
    }
    public set enable_instances(value: boolean) {
        if (value && !this._datasource.enable_space) {
            throw new Error(`not support, please set ${this._name}.enable_instances to false or remove the enable_instances attribute`)
        }
        this._enable_instances = value;
    }

    private _enable_trash: boolean;
    public get enable_trash(): boolean {
        return this._enable_trash;
    }
    public set enable_trash(value: boolean) {
        if (value && !this._datasource.enable_space) {
            throw new Error(`not support, please set ${this._name}.enable_trash to false or remove the enable_trash attribute`)
        }
        this._enable_trash = value;
    }

    private _enable_share;
    public get enable_share(): boolean {
        return this._enable_share;
    }
    public set enable_share(value: boolean) {
        if (value && !this._datasource.enable_space) {
            throw new Error(`not support, please set ${this._name}.enable_share to false or remove the enable_share attribute`)
        }
        this._enable_share = value;
    }

    public get NAME_FIELD_KEY(): string {
        return this._NAME_FIELD_KEY;
    }

    getMethod(method_name: string) {
        return this.methods[method_name]
    }

    public get idFieldName(): string {
        return this._idFieldName;
    }

    public get idFieldNames(): string[] {
        return this._idFieldNames;
    }

    public get masters(): string[] {
        return this._masters;
    }

    public get details(): string[] {
        return this._details;
    }

    private async callMetadataObjectServiceAction(action, params?){
        const actionFullName = `objects.${action}`
        const result = await this.schema.metadataBroker.call(actionFullName, params);
        return result;
    }

    private checkField() {
        let driverSupportedColumnTypes = this._datasource.adapter.getSupportedColumnTypes()
        _.each(this.fields, (field: SteedosFieldType, key: string) => {
            if (SteedosFieldDBType[field.fieldDBType] && !driverSupportedColumnTypes.includes(field.fieldDBType)) {
                throw new Error(`driver ${this._datasource.driver} can not support field ${key} config`)
            }
        })
    }

    constructor(object_name: string, datasource: SteedosDataSourceType, config: SteedosObjectTypeConfig) {
        super();
        this._name = object_name
        this._datasource = datasource
        this._schema = datasource.schema
        if (this._datasource.driver != SteedosDatabaseDriverType.MeteorMongo)
            this._enable_share = false

        if (/^[_a-zA-Z][_a-zA-Z0-9]*$/.test(object_name) != true) {
            throw new Error('invalid character, object_name can only be start with _ or a-zA-Z and contain only _ or _a-zA-Z0-9. you can set table_name');
        }

        if (config.table_name) {
            this._table_name = config.table_name
        } else {
            this._table_name = this._name
        }

        _.each(properties, (property) => {
            if (_.has(config, property)) {
                this[property] = config[property]
            }
        })

        _.each(config.fields, (field, field_name) => {
            this.setField(field_name, field)
        })

        this.checkField()

        _.each(config.actions, (action, action_name) => {
            this.setAction(action_name, action)
        })

        _.each(config.listeners, (listener, listener_name) => {
            this.setListener(listener_name, listener)
        })

        _.each(config.list_views, (list_view, name) => {
            this.setListView(name, list_view)
        })

        _.each(config.permissions, (permission, name) => {
            permission.name = name
            this.setPermission(permission)
        })

        //TODO remove ; 目前为了兼容现有object的定义保留
        _.each(config.permission_set, (permission, name) => {
            permission.name = name
            this.setPermission(permission)
        })

        if (this._datasource.driver == SteedosDatabaseDriverType.Mongo || this._datasource.driver == SteedosDatabaseDriverType.MeteorMongo) {
            this._idFieldName = '_id'
        }

        this.schema.setObjectMap(this.name, { datasourceName: this.datasource.name, _id: config._id })
    }

    getConfig(){
        return this.datasource.getObjectConfig(this.name);
    }

    setPermission(config: SteedosObjectPermissionTypeConfig) {
        this._datasource.setObjectPermission(this._name, config)
    }

    setListener(listener_name: string, config: SteedosListenerConfig) {
        this.listeners[listener_name] = config
        _TRIGGERKEYS.forEach((key) => {
            let event = config[key];
            if (_.isFunction(event)) {
                this.setTrigger(`${listener_name}_${event.name}`, key, event);
            }
        })
    }

    private setTrigger(name: string, when: string, todo: Function, on = 'server') {
        let triggerConfig: SteedosTriggerTypeConfig = {
            name: name,
            on: on,
            when: when,
            todo: todo,
        }
        let trigger = new SteedosTriggerType(triggerConfig)
        this.triggers[name] = trigger
        this.registerTrigger(trigger)
    }

    registerTrigger(trigger: SteedosTriggerType) {
        //如果是meteor mongo 则不做任何处理
        if (!_.isString(this._datasource.driver) || this._datasource.driver != SteedosDatabaseDriverType.MeteorMongo || trigger.when === 'beforeFind' || trigger.when === 'afterFind' || trigger.when === 'afterFindOne' || trigger.when === 'afterCount' || trigger.when === 'beforeAggregate' || trigger.when === 'afterAggregate') {
            if (!trigger.todo) {
                return;
            }
            if (!this._triggersQueue[trigger.when]) {
                this._triggersQueue[trigger.when] = {}
            }
            this._triggersQueue[trigger.when][trigger.name] = trigger
        }
    }

    unregisterTrigger(trigger: SteedosTriggerType) {
        delete this._triggersQueue[trigger.when][trigger.name]
    }

    private async runTirgger(trigger: SteedosTriggerType, context: SteedosTriggerContextConfig) {
        let object_name = this.name
        let event = trigger.todo
        let todoWrapper = async function (...args) {
            // Object.setPrototypeOf(thisArg, Object.getPrototypeOf(trigger))
            return await event.apply(thisArg, args)
        }
        let thisArg = {
            ...context,
            object_name: object_name,
            datasource_name: this._datasource.name,
            getObject: (object_name: string) => {
                return this._schema.getObject(object_name)
            }
        }

        return await todoWrapper.call(thisArg)
    }

    async runTriggers(when: string, context: SteedosTriggerContextConfig) {
        let triggers = this._triggersQueue[when]
        if (!triggers) {
            return;
        }

        let triggerKeys = _.keys(triggers)

        for (let index = 0; index < triggerKeys.length; index++) {
            let trigger = triggers[triggerKeys[index]];
            await this.runTirgger(trigger, context)
        }
    }

    async runTriggerActions(when: string, context: SteedosTriggerContextConfig) {
        let triggers = await this._schema.metadataBroker.call('triggers.filter', { objectApiName: this.name, when: when })
        if (_.isEmpty(triggers)) {
            return;
        }

        for (const trigger of triggers) {
            let params = generateActionParams(when, context); //参考sf
            try {
                await this._schema.metadataBroker.call(`${trigger.service.name}.${trigger.metadata.action}`, params)
            } catch (error) {
                console.error(error)
            }
        }

    }

    toConfig() {
        let config: JsonMap = {
            name: this.name,
            fields: {}
        }

        _.each(properties, (property) => {
            if (this[property] != null && this[property] != undefined) {
                config[property] = this[property]
            }
        })

        if (this.fields) {
            config.fields = {}
            _.each(this.fields, (field: SteedosFieldType, key: string) => {
                config.fields[key] = field.toConfig();
            })
        }

        if (this.list_views) {
            config.list_views = {}
            _.each(this.list_views, (list_view: SteedosObjectListViewType, key: string) => {
                config.list_views[key] = list_view.toConfig()
            })
        }

        if (this.actions) {
            config.actions = {}
            _.each(this.actions, (action: SteedosActionType, key: string) => {
                config.actions[key] = action.toConfig()
            })
        }

        if (this.triggers) {
            config.triggers = {}
            _.each(this.triggers, (trigger: SteedosTriggerType, key: string) => {
                config.triggers[key] = trigger.toConfig();
            })
        }

        let rolePermission = this.getObjectRolesPermission()
        if (rolePermission) {
            config.permission_set = {}
            _.each(rolePermission, (v, k) => {
                config.permission_set[k] = v
            })
        }

        return config
    }

    setField(field_name: string, fieldConfig: SteedosFieldTypeConfig) {
        let field = new SteedosFieldType(field_name, this, fieldConfig)
        this.fields[field_name] = field

        if (field.primary && this._datasource.driver != SteedosDatabaseDriverType.Mongo && this._datasource.driver != SteedosDatabaseDriverType.MeteorMongo) {
            this._idFieldName = field.name
            if (this._idFieldNames.indexOf(field.name) < 0) {
                this._idFieldNames.push(field.name);
            }
        }

        if (field.is_name) {
            this._NAME_FIELD_KEY = field_name
        } else if (field_name == 'name' && !this._NAME_FIELD_KEY) {
            this._NAME_FIELD_KEY = field_name
        }
    }

    getField(field_name: string) {
        return this.fields[field_name]
    }

    getFields(){
        return this.toConfig().fields
    }

    getNameFieldKey(){
        return this.NAME_FIELD_KEY;
    }

    async getDetailPaths(){
        return await this.callMetadataObjectServiceAction(`getDetailPaths`, {objectApiName: this.name});
    }

    async getMasterPaths(){
        return await this.callMetadataObjectServiceAction(`getMasterPaths`, {objectApiName: this.name});
    }

    async getMaxDetailsLeave(paths?){
        return await this.callMetadataObjectServiceAction(`getMaxDetailsLeave`, {objectApiName: this.name, paths});
    }

    async getMaxMastersLeave(paths?){
        return await this.callMetadataObjectServiceAction(`getMaxMastersLeave`, {objectApiName: this.name, paths});
    }

    addMaster(object_name: string) {
        let index = this._masters.indexOf(object_name);
        if (index < 0) {
            this._masters.push(object_name);
            return true;
        }
        return false;
    }

    removeMaster(object_name: string) {
        let index = this._masters.indexOf(object_name);
        if (index >= 0) {
            this._masters.splice(index, 1);
        }
    }

    addDetail(object_name: string) {
        let index = this._details.indexOf(object_name);
        if (index < 0) {
            this._details.push(object_name);
            return true;
        }
        return false;
    }

    removeDetail(object_name: string) {
        let index = this._details.indexOf(object_name);
        if (index >= 0) {
            this._details.splice(index, 1);
        }
    }

    setListView(list_view_name: string, config: SteedosObjectListViewTypeConfig) {
        this.list_views[list_view_name] = new SteedosObjectListViewType(list_view_name, this, config)
    }

    setAction(action_name: string, actionConfig: SteedosActionTypeConfig) {
        this._actions[action_name] = new SteedosActionType(action_name, this, actionConfig)
    }

    getAction(action_name: string) {
        return this._actions[action_name]
    }

    //TODO 处理对象继承
    extend_TODO(config: SteedosObjectTypeConfig) {
        if (this.name != config.name)
            throw new Error("You can not extend on different object");

        // override each fields
        _.each(config.fields, (field, field_name) => {
            this.setField(field_name, field)
        })

        // override each actions
        // if (config.actions) {
        //     _.each(config.actions, (action) => {
        //         this.actions[action.name] = action
        //     })
        // }

        // override each triggers
        // if (config.triggers) {
        //     _.each(config.triggers, (trigger) => {
        //         this.triggers[trigger.name] = trigger
        //     })
        // }
    }

    getObjectRolesPermission(spaceId?: string) {
        let globalPermission = this._datasource.getObjectRolesPermission(this._name)
        if (spaceId) {
            let permission = this._datasource.getObjectSpaceRolesPermission(this._name, spaceId);
            if (!_.isEmpty(permission)) {
                return Object.assign({}, globalPermission || {}, permission);
            }
        }
        return globalPermission
    }

    async getUserObjectPermission(userSession: SteedosUserSession) {

        if (!userSession) {
            throw new Error('userSession is required')
        }

        let roles = userSession.roles
        let objectRolesPermission = this.getObjectRolesPermission(userSession.spaceId)

        let userObjectPermission = {
            allowRead: false,
            allowCreate: false,
            allowEdit: false,
            allowDelete: false,
            viewAllRecords: false,
            modifyAllRecords: false,
            viewCompanyRecords: false,
            modifyCompanyRecords: false,
            disabled_list_views: null,
            disabled_actions: null,
            unreadable_fields: null,
            uneditable_fields: null,
            unrelated_objects: null
        }

        if (_.isEmpty(roles)) {
            throw new Error('not find user permission');
        }

        roles.forEach((role) => {
            let rolePermission = objectRolesPermission[role]
            if (rolePermission) {
                _.each(userObjectPermission, (v, k) => {
                    let _v = rolePermission[k]
                    if (_.isBoolean(v)) {
                        if (v === false && _v === true) {
                            userObjectPermission[k] = _v
                        }
                    } else if ((_.isArray(v) || _.isNull(v))) {
                        if (!_.isArray(_v)) {
                            _v = []
                        }
                        if (_.isNull(v)) {
                            userObjectPermission[k] = _v
                        } else {
                            userObjectPermission[k] = _.intersection(v, _v)
                        }
                    }
                })
            }
        })


        userObjectPermission.disabled_list_views = userObjectPermission.disabled_list_views || []
        userObjectPermission.disabled_actions = userObjectPermission.disabled_actions || []
        userObjectPermission.unreadable_fields = userObjectPermission.unreadable_fields || []
        userObjectPermission.uneditable_fields = userObjectPermission.uneditable_fields || []
        userObjectPermission.unrelated_objects = userObjectPermission.unrelated_objects || []

        let spaceId = userSession.spaceId
        if (isTemplateSpace(spaceId)) {
            return Object.assign({}, userObjectPermission, { allowRead: true, viewAllRecords: true, viewCompanyRecords: true })
        }

        return userObjectPermission;
    }

    private async allowFind(userSession: SteedosUserSession) {
        if (!userSession)
            return true
        let userObjectPermission = await this.getUserObjectPermission(userSession)
        if (userObjectPermission.allowRead) {
            return true
        } else {
            return false
        }
    }

    private async allowInsert(userSession: SteedosUserSession) {
        if (!userSession)
            return true
        let userObjectPermission = await this.getUserObjectPermission(userSession)
        if (userObjectPermission.allowCreate) {
            return true
        } else {
            return false
        }
    }

    private async allowUpdate(userSession: SteedosUserSession) {
        if (!userSession)
            return true
        let userObjectPermission = await this.getUserObjectPermission(userSession)
        if (userObjectPermission.allowEdit) {
            return true
        } else {
            return false
        }
    }

    private async allowDelete(userSession: SteedosUserSession) {
        if (!userSession)
            return true
        let userObjectPermission = await this.getUserObjectPermission(userSession)
        if (userObjectPermission.allowDelete) {
            return true
        } else {
            return false
        }
    }

    async find(query: SteedosQueryOptions, userSession?: SteedosUserSession) {
        let clonedQuery = Object.assign({}, query);
        await this.processUnreadableField(userSession, clonedQuery);
        return await this.callAdapter('find', this.table_name, clonedQuery, userSession)
    }

    // 此函数支持driver: MeteorMongo
    async aggregate(query: SteedosQueryOptions, externalPipeline, userSession?: SteedosUserSession) {
        let clonedQuery = Object.assign({}, query);
        await this.processUnreadableField(userSession, clonedQuery);
        return await this.callAdapter('aggregate', this.table_name, clonedQuery, externalPipeline, userSession)
    }

    // 此函数支持driver: MeteorMongo
    async directAggregate(query: SteedosQueryOptions, externalPipeline: any[], userSession?: SteedosUserSession) {
        let clonedQuery = Object.assign({}, query);
        await this.processUnreadableField(userSession, clonedQuery);
        return await this.callAdapter('directAggregate', this.table_name, clonedQuery, externalPipeline, userSession)
    }

    // 此函数支持driver: MeteorMongo，类似于aggregate，其参数externalPipeline放在最前面而已
    async directAggregatePrefixalPipeline(query: SteedosQueryOptions, prefixalPipeline: any[], userSession?: SteedosUserSession) {
        let clonedQuery = Object.assign({}, query);
        await this.processUnreadableField(userSession, clonedQuery);
        return await this.callAdapter('directAggregatePrefixalPipeline', this.table_name, clonedQuery, prefixalPipeline, userSession)
    }

    async findOne(id: SteedosIDType, query: SteedosQueryOptions, userSession?: SteedosUserSession) {
        let clonedQuery = Object.assign({}, query);
        await this.processUnreadableField(userSession, clonedQuery);
        return await this.callAdapter('findOne', this.table_name, id, clonedQuery, userSession)
    }

    async insert(doc: Dictionary<any>, userSession?: SteedosUserSession) {
        return await this.callAdapter('insert', this.table_name, doc, userSession)
    }

    async update(id: SteedosIDType, doc: Dictionary<any>, userSession?: SteedosUserSession) {
        await this.processUneditableFields(userSession, doc)
        let clonedId = id;
        return await this.callAdapter('update', this.table_name, clonedId, doc, userSession)
    }

    async updateOne(id: SteedosIDType, doc: Dictionary<any>, userSession?: SteedosUserSession) {
        await this.processUneditableFields(userSession, doc)
        let clonedId = id;
        return await this.callAdapter('updateOne', this.table_name, clonedId, doc, userSession)
    }
    // 此函数支持driver: MeteorMongo、Mongo
    async updateMany(queryFilters: SteedosQueryFilters, doc: Dictionary<any>, userSession?: SteedosUserSession) {
        await this.processUneditableFields(userSession, doc)
        let clonedQueryFilters = queryFilters;
        return await this.callAdapter('updateMany', this.table_name, clonedQueryFilters, doc, userSession)
    }

    async delete(id: SteedosIDType, userSession?: SteedosUserSession) {
        let clonedId = id;
        return await this.callAdapter('delete', this.table_name, clonedId, userSession)
    }

    async directFind(query: SteedosQueryOptions, userSession?: SteedosUserSession) {
        let clonedQuery = Object.assign({}, query);
        await this.processUnreadableField(userSession, clonedQuery);
        return await this.callAdapter('directFind', this.table_name, clonedQuery, userSession)
    }

    async directInsert(doc: Dictionary<any>, userSession?: SteedosUserSession) {
        return await this.callAdapter('directInsert', this.table_name, doc, userSession)
    }

    async directUpdate(id: SteedosIDType, doc: Dictionary<any>, userSession?: SteedosUserSession) {
        await this.processUneditableFields(userSession, doc)
        let clonedId = id;
        return await this.callAdapter('directUpdate', this.table_name, clonedId, doc, userSession)
    }

    async directDelete(id: SteedosIDType, userSession?: SteedosUserSession) {
        let clonedId = id;
        return await this.callAdapter('directDelete', this.table_name, clonedId, userSession)
    }

    async _makeNewID(){
        return await this._datasource._makeNewID(this.table_name);
    }

    async getFirstListView(){
        return this.list_views[0];
    }

    async getAbsoluteUrl(app_id, record_id?){
        const object_name = this.name;
        const list_view:any = await this.getFirstListView();
        const list_view_id = list_view ? list_view._id || list_view.name : 'all'
        if(record_id)
            return absoluteUrl("/app/" + app_id + "/" + object_name + "/view/" + record_id)
        else{
            if(object_name === 'meeting'){
                return absoluteUrl("/app/" + app_id + "/" + object_name + "/calendar/")
            }else{
                return absoluteUrl("/app/" + app_id + "/" + object_name + "/grid/" + list_view_id)
            }
        }
    }

    async getRecordAbsoluteUrl(app_id, record_id){
        return await this.getAbsoluteUrl(app_id, record_id)
    }

    async getGridAbsoluteUrl(app_id){
        return await this.getAbsoluteUrl(app_id)
    }

    async isEnableAudit(){
        return this.enable_audit;
    }

    async getDetails(){
        return await this.callMetadataObjectServiceAction(`getDetails`, {objectApiName: this.name});
    }

    async getMasters(){
        return await this.callMetadataObjectServiceAction(`getMasters`, {objectApiName: this.name});
    }

    async getLookupDetails(){
        return await this.callMetadataObjectServiceAction(`getLookupDetails`, {objectApiName: this.name});
    }

    async getDetailsInfo(){
        return await this.callMetadataObjectServiceAction(`getDetailsInfo`, {objectApiName: this.name});
    }

    async getMastersInfo(){
        return await this.callMetadataObjectServiceAction(`getMastersInfo`, {objectApiName: this.name});
    }

    async getLookupDetailsInfo(){
        return await this.callMetadataObjectServiceAction(`getLookupDetailsInfo`, {objectApiName: this.name});
    }

    async getRecordPermissions(record, userSession){
        const permissions = await this.getUserObjectPermission(userSession);
        const { userId, company_ids: user_company_ids } = userSession;
        if(record){
            if(record.record_permissions){
                return record.record_permissions
            }
            let recordOwnerId = record.owner;
            if(_.isObject(recordOwnerId)){
                recordOwnerId = recordOwnerId._id;
            }
            const isOwner = recordOwnerId == userId;
            let record_company_id = record.company_id;
            if(record_company_id && _.isObject(record_company_id) && record_company_id._id){
                record_company_id = record_company_id._id;
            }
            let record_company_ids = record.company_ids;
            if(record_company_ids && record_company_ids.length && _.isObject(record_company_ids[0])){
                record_company_ids = record_company_ids.map((n)=> n._id)
            }
            record_company_ids = _.union(record_company_ids, [record_company_id]);
            record_company_ids = _.compact(record_company_ids);
            if(!permissions.modifyAllRecords && !isOwner && !permissions.modifyCompanyRecords){
                permissions.allowEdit = false
			    permissions.allowDelete = false
            }else if(!permissions.modifyAllRecords && permissions.modifyCompanyRecords){
                if(record_company_ids && record_company_ids.length){
                    if(user_company_ids && user_company_ids.length){
                        if(!_.intersection(user_company_ids, record_company_ids).length){
                            permissions.allowEdit = false
						    permissions.allowDelete = false
                        }
                    }else{
                        permissions.allowEdit = false
                        permissions.allowDelete = false
                    }
                }
            }
            if(record.locked && !permissions.modifyAllRecords){
                permissions.allowEdit = false
			    permissions.allowDelete = false
            }
            if(!permissions.viewAllRecords && !isOwner && !permissions.viewCompanyRecords){
                permissions.allowRead = false
            }else{
                if(record_company_ids && record_company_ids.length){
                    if(user_company_ids && user_company_ids.length){
                        if(!_.intersection(user_company_ids, record_company_ids).length){
                            permissions.allowRead = false
                        }
                    }else{
                        permissions.allowRead = false
                    }
                }
            }
        }
        return permissions
    }

    async getRecordView(userSession){
        const lng = userSession.language;
        const objectMetadataConfig: any = await this.callMetadataObjectServiceAction('get', {objectApiName: this.name});
        let objectConfig = objectMetadataConfig.metadata;
        objectConfig.name = this.name
        objectConfig.datasource = this.datasource.name;
        objectConfig.permissions = await this.getUserObjectPermission(userSession);
        objectConfig.details = await this.getDetailsInfo();
        objectConfig.masters = await this.getMastersInfo();
        objectConfig.lookup_details = await this.getLookupDetailsInfo();

        delete objectConfig.db

        translationObject(lng, objectConfig.name, objectConfig);

        const layouts = await getObjectLayouts(userSession.profile, userSession.spaceId, this.name)
        if(layouts && layouts.length > 0){
            const layout = layouts[0];
            let _fields = {};
            _.each(layout.fields, function(_item){
                _fields[_item.field_name] = objectConfig.fields[_item.field_name]
                if(_fields[_item.field_name]){
                    if(_.has(_item, 'group')){
                        _fields[_item.field_name].group = _item.group
                    }

                    if(_item.is_required){
                        _fields[_item.field_name].readonly = false
                        _fields[_item.field_name].disabled = false
                        _fields[_item.field_name].required = true
                    }else if(_item.is_readonly){
                        _fields[_item.field_name].readonly = true
                        _fields[_item.field_name].disabled = true
                        _fields[_item.field_name].required = false
                    }

                    if(_item.visible_on){
                        _fields[_item.field_name].visible_on = _item.visible_on
                    }
                }
            })

            const layoutFieldKeys = _.keys(_fields);
            const objectFieldKeys = _.keys(objectConfig.fields);

            const difference = _.difference(objectFieldKeys, layoutFieldKeys);

            _.each(layoutFieldKeys, function(fieldApiName){
                objectConfig.fields[fieldApiName] = _fields[fieldApiName];
            })

            _.each(difference, function(fieldApiName){
                objectConfig.fields[fieldApiName].hidden = true;
            })

            let _buttons = {};
            _.each(layout.buttons, function(button){
                const action = objectConfig.actions[button.button_name];
                if(action){
                    if(button.visible_on){
                        action.visible = button.visible_on;
                    }
                    _buttons[button.button_name] = action
                }
            })
            objectConfig.actions = _buttons;
            // _object.allow_customActions = userObjectLayout.custom_actions || []
            // _object.exclude_actions = userObjectLayout.exclude_actions || []
            objectConfig.related_lists = layout.related_lists || []
        }

        // TODO object layout 是否需要控制审批记录显示？
        let spaceProcessDefinition = await getObject("process_definition").directFind({ filters: [['space', '=', userSession.spaceId], ['object_name', '=', this.name], ['active', '=', true]] })
        if (spaceProcessDefinition.length > 0) {
            objectConfig.enable_process = true
        }

        //清理数据

        _.each(objectConfig.triggers, function(trigger, key){
            if(trigger?.on != 'client'){
                delete objectConfig.triggers[key];
            }
        })

        const dbListViews = await getObject("object_listviews").find({ filters: [['space', '=', userSession.spaceId], ['object_name', '=', this.name], [['owner', '=', userSession.userId], 'or', ['shared', '=', true]]] })
        objectConfig.list_views = Object.assign({}, objectConfig.list_views)
        _.each(dbListViews, function(dbListView){
            delete dbListView.created;
            delete dbListView.created_by;
            delete dbListView.modified;
            delete dbListView.modified_by;
            objectConfig.list_views[dbListView.name] = dbListView;
        })
        delete objectConfig.listeners
        delete objectConfig.__filename
        delete objectConfig.extend
        return objectConfig;
    }

    async createDefaulRecordView(userSession){
        const name = 'default';
        const label = 'Default';
        const object_name = this.name;
        const type = 'record';
        const profiles = ['user'];
        const buttons = null;
        const fields = [];
        const related_lists = [];

        const objectConfig: any = await this.callMetadataObjectServiceAction('getOriginalObject', {objectApiName: this.name});
        _.each(objectConfig.fields, function(field){
            const layoutField: any = {};
            layoutField.field_name = field.name;
            layoutField.is_readonly = field.readonly;
            layoutField.is_required = field.required;
            layoutField.group = field.group;
            layoutField.visible_on = `${!field.hidden}`;
            fields.push(layoutField);
        });

        // const details = await this.getDetailsInfo();
        // for await (const detail of details) {
        //     const relatedList: any = {}
        //     if(detail){
        //         relatedList.related_field_fullname = detail;
        //     }
        // }

        try {
            return await getObject('object_layouts').insert({
                name, label, object_name, type, profiles, buttons, fields, related_lists,
                space: userSession.spaceId
            }, userSession)
        } catch (error) {
            return {error: error.message}
        }
    }

    private isDirectCRUD(methodName: string) {
        return methodName.startsWith("direct");
    }


    async count(query: SteedosQueryOptions, userSession?: SteedosUserSession) {
        let clonedQuery = Object.assign({}, query);
        return await this.callAdapter('count', this.table_name, clonedQuery, userSession)
    }

    private async allow(method: string, userSession: SteedosUserSession) {
        if (_.isNull(userSession) || _.isUndefined(userSession)) {
            return true
        }
        if (method === 'find' || method === 'findOne' || method === 'count' || method === 'aggregate' || method === 'aggregatePrefixalPipeline') {
            return await this.allowFind(userSession)
        } else if (method === 'insert') {
            return await this.allowInsert(userSession)
        } else if (method === 'update' || method === 'updateOne' || method === 'updateMany') {
            return await this.allowUpdate(userSession)
        } else if (method === 'delete') {
            return await this.allowDelete(userSession)
        }
    }

    private async runBeforeTriggers(method: string, context: SteedosTriggerContextConfig) {
        if (method === 'count') {
            method = 'find';
        }
        let meteorWhen = `before${method.charAt(0).toLocaleUpperCase()}${_.rest([...method]).join('')}`
        let when = `before.${method}`;
        await this.runTriggers(meteorWhen, context);
        return await this.runTriggerActions(when, context)
    }

    private async runAfterTriggers(method: string, context: SteedosTriggerContextConfig) {
        let meteorWhen = `after${method.charAt(0).toLocaleUpperCase()}${_.rest([...method]).join('')}`
        let when = `after.${method}`;
        await this.runTriggers(meteorWhen, context);
        return await this.runTriggerActions(when, context)
    }

    private async getTriggerContext(when: string, method: string, args: any[]) {

        let userSession = args[args.length - 1]

        let context: SteedosTriggerContextConfig = { userId: userSession ? userSession.userId : undefined, spaceId: userSession ? userSession.spaceId : undefined }

        if (method === 'find' || method === 'findOne' || method === 'count') {
            context.query = args[args.length - 2]
        }

        if (method === 'aggregate' || method === 'aggregatePrefixalPipeline') {
            context.query = args[args.length - 3]
        }

        if (method === 'findOne' || method === 'update' || method === 'delete') {
            context.id = args[1]
        }

        if (method === 'insert' || method === 'update') {
            context.doc = args[args.length - 2]
        }

        if (when === 'after' && (method === 'update' || method === 'delete')) {
            context.previousDoc = await this.findOne(context.id, {}, userSession)
        }

        return context
    }

    private async processUnreadableField(userSession: SteedosUserSession, query: SteedosQueryOptions) {
        if (!userSession) {
            return
        }
        let userObjectPermission = await this.getUserObjectPermission(userSession)
        let userObjectUnreadableFields = userObjectPermission.unreadable_fields
        if (userObjectUnreadableFields.length > 0) {
            let queryFields = [];

            if (_.isArray(query.fields)) {
                queryFields = query.fields
            } else if (_.isString(query.fields)) {
                queryFields = query.fields.split(',')
            }

            if (!(query.fields && query.fields.length)) {
                queryFields = _.keys(this.toConfig().fields)
                _.each(queryFields, function (fieldName, index) {
                    if (fieldName && fieldName.indexOf("$") > -1) {
                        delete queryFields[index];
                    }
                })
                queryFields = _.compact(queryFields)
            }
            queryFields = _.difference(queryFields, userObjectUnreadableFields)

            if (queryFields.length < 1) {
                queryFields.push()
            }

            if (this.idFieldName) {
                queryFields.unshift(this.idFieldName)
                queryFields = _.compact(_.uniq(queryFields))
            }

            query.fields = queryFields.join(',')
        }
    }

    private async processUneditableFields(userSession: SteedosUserSession, doc: JsonMap) {
        // 后台直接去掉uneditable_fields相关判断逻辑
        // [签约对象同时配置了company_ids必填及uneditable_fields造成部分用户新建签约对象时报错 #192](https://github.com/steedos/steedos-project-dzug/issues/192)
        // if (!userSession) {
        //     return
        // }

        // let userObjectPermission = await this.getUserObjectPermission(userSession)
        // let userObjectUneditableFields = userObjectPermission.uneditable_fields

        // let intersection = _.intersection(userObjectUneditableFields, _.keys(doc))
        // if (intersection.length > 0) {
        //     throw new Error(`no permissions to edit fields ${intersection.join(', ')}`)
        // }

        // // _.each(userObjectUneditableFields, (name: string)=>{
        // //     delete doc[name]
        // // })
    }

    private async callAdapter(method: string, ...args: any[]) {

        const adapterMethod = this._datasource[method];
        if (typeof adapterMethod !== 'function') {
            throw new Error('Adapted does not support "' + method + '" method');
        }
        let allow = await this.allow(method, args[args.length - 1])
        if (!allow) {
            throw new Error('not find permission')
        }

        let objectName = args[0], recordId: string, doc: JsonMap;
        if (["insert", "update", "updateMany", "delete"].indexOf(method) > -1) {
            // 因下面的代码，比如函数dealWithMethodPermission可能改写args变量，所以需要提前从args取出对应变量值。
            if (method === "insert") {
                // 此处doc不带_id值，得执行完adapterMethod.apply后，doc中才有_id属性，所以这里的doc及recordId都不准确
                doc = args[1];
                recordId = <string>doc._id;
            }
            else {
                recordId = args[1];
                doc = args[2];
            }
        }

        // 判断处理工作区权限，公司级权限，owner权限
        if (this._datasource.enable_space) {
            this.dealWithFilters(method, args);
            await this.dealWithMethodPermission(method, args);
        }

        let returnValue: any;
        let userSession: SteedosUserSession;
        if (this.isDirectCRUD(method)) {
            userSession = args[args.length - 1]
            args.splice(args.length - 1, 1, userSession ? userSession.userId : undefined)
            returnValue = await adapterMethod.apply(this._datasource, args);
        } else {
            userSession = args[args.length - 1]
            let beforeTriggerContext = await this.getTriggerContext('before', method, args)
            await this.runBeforeTriggers(method, beforeTriggerContext)
            await runValidationRules(method, beforeTriggerContext, args[0], userSession)

            let afterTriggerContext = await this.getTriggerContext('after', method, args)
            let previousDoc = clone(afterTriggerContext.previousDoc);
            args.splice(args.length - 1, 1, userSession ? userSession.userId : undefined)
            returnValue = await adapterMethod.apply(this._datasource, args);
            if (method === 'find' || method == 'findOne' || method == 'count' || method == 'aggregate' || method == 'aggregatePrefixalPipeline') {
                let values = returnValue || {}
                if (method === 'count') {
                    values = returnValue || 0
                }
                Object.assign(afterTriggerContext, { data: { values: values } })
            }
            // console.log("==returnValue==", returnValue);
            if (method == "update") {
                if (returnValue) {
                    await this.runAfterTriggers(method, afterTriggerContext)
                }
            }
            else {
                await this.runAfterTriggers(method, afterTriggerContext)
            }
            await brokeEmitEvents(objectName, method, afterTriggerContext);
            if (method === 'find' || method == 'findOne' || method == 'count' || method == 'aggregate' || method == 'aggregatePrefixalPipeline') {
                if (_.isEmpty(afterTriggerContext.data) || (_.isEmpty(afterTriggerContext.data.values) && !_.isNumber(afterTriggerContext.data.values))) {
                    return returnValue
                } else {
                    return afterTriggerContext.data.values
                }
            }
            await new WorkflowRulesRunner({
                object_name: this.name,
                event: method,
                record: returnValue,
                user_session: userSession,
                previous_record: afterTriggerContext.previousDoc
            }).run();
            if (returnValue) {
                if (method === "insert") {
                    // 当为insert时，上面代码执行后的doc不带_id，只能从returnValue中取
                    doc = returnValue;
                    recordId = <string>doc._id;
                }
                // 一定要先运行公式再运行汇总，以下两个函数顺序不能反
                await this.runRecordFormula(method, objectName, recordId, doc, userSession);
                await this.runRecordSummaries(method, objectName, recordId, doc, previousDoc, userSession);
            }
        }
        return returnValue
    };

    private async runRecordFormula(method: string, objectName: string, recordId: string, doc: any, userSession: any) {
        if (["insert", "update", "updateMany"].indexOf(method) > -1) {
            if (method === "updateMany") {
                // TODO:暂时不支持updateMany公式计算，因为拿不到修改了哪些数据
                // let filters: SteedosQueryFilters = args[1];
                // await runManyCurrentObjectFieldFormulas(objectName, filters, userSession);
            }
            else {
                let currentUserId = userSession ? userSession.userId : undefined;
                await runCurrentObjectFieldFormulas(objectName, recordId, doc, currentUserId, true);
                if (method === "update") {
                    // 新建记录时肯定不会有字段被引用，不需要重算被引用的公式字段值
                    await runQuotedByObjectFieldFormulas(objectName, recordId, userSession);
                }
            }
        }
    }

    private async runRecordSummaries(method: string, objectName: string, recordId: string, doc: any, previousDoc: any, userSession: any) {
        if (["insert", "update", "updateMany", "delete"].indexOf(method) > -1) {
            if (method === "updateMany") {
                // TODO:暂时不支持updateMany汇总计算，因为拿不到修改了哪些数据
            }
            else {
                if (method === "insert") {
                    await runCurrentObjectFieldSummaries(objectName, recordId);
                }
                await runQuotedByObjectFieldSummaries(objectName, recordId, previousDoc, userSession);
            }
        }
    }

    /**
     * 把query.filters用formatFiltersToODataQuery转为odata query
     * 主要是为了把userSession中的utcOffset逻辑传入formatFiltersToODataQuery函数处理
     */
    private dealWithFilters(method: string, args: any[]) {
        let userSession = args[args.length - 1];
        if (userSession) {
            if (method === 'find' || method === 'count' || method === 'aggregate' || method === 'aggregatePrefixalPipeline') {
                let query = args[args.length - 2];
                if (method === 'aggregate' || method === 'aggregatePrefixalPipeline') {
                    query = args[args.length - 3];
                }
                if (query.filters && !_.isString(query.filters)) {
                    query.filters = formatFiltersToODataQuery(query.filters, userSession);
                }
            }
        }
    }

    private async dealWithMethodPermission(method: string, args: any[]) {
        let userSession = args[args.length - 1];
        if (userSession) {
            let spaceId = userSession.spaceId;
            let userId = userSession.userId;
            let objPm = await this.getUserObjectPermission(userSession);
            if (method === 'find' || method === 'count' || method === 'findOne' || method === 'aggregate' || method === 'aggregatePrefixalPipeline') {
                let query = args[args.length - 2];
                if (method === 'aggregate' || method === 'aggregatePrefixalPipeline') {
                    query = args[args.length - 3];
                }

                if (query.filters && !_.isString(query.filters)) {
                    query.filters = formatFiltersToODataQuery(query.filters);
                }

                if (this.table_name == 'cfs.files.filerecord' || this.table_name == 'cfs.instances.filerecord') {
                    return;
                }

                if (isCloudAdminSpace(spaceId)) {
                    return
                }

                let spaceFilter, companyFilter, ownerFilter, sharesFilter, clientFilter = query.filters, filters, permissionFilters = [], userFilters = [];

                if (spaceId) {
                    spaceFilter = `(space eq '${spaceId}')`;
                }

                if (spaceId && !objPm.viewAllRecords && objPm.viewCompanyRecords) { // 公司级
                    if (_.isEmpty(userSession.companies)) {
                        console.log('objPm', objPm);
                        throw new Error("user not belong any company!");
                    }
                    companyFilter = _.map(userSession.companies, function (comp: any) {
                        return `(company_id eq '${comp._id}') or (company_ids eq '${comp._id}')`
                    });
                }

                if (!objPm.viewAllRecords && !objPm.viewCompanyRecords && objPm.allowRead) { // owner
                    ownerFilter = `(owner eq '${userId}')`;
                }

                if (!objPm.viewAllRecords) {
                    sharesFilter = getUserObjectSharesFilters(this.name, userSession);
                }

                if (!_.isEmpty(companyFilter)) {
                    permissionFilters.push(`(${companyFilter.join(' or ')})`);
                }

                if (ownerFilter) {
                    permissionFilters.push(ownerFilter);
                }

                if (!_.isEmpty(sharesFilter)) {
                    permissionFilters.push(`(${sharesFilter.join(' or ')})`);
                }

                if (clientFilter) {
                    userFilters.push(clientFilter);
                }

                if (spaceFilter) {
                    userFilters.push(spaceFilter);
                }

                if (!userSession.is_space_admin && !_.isEmpty(permissionFilters)) {
                    filters = permissionFilters.join(' or ');
                }

                if (!_.isEmpty(userFilters)) {
                    filters = filters ? `(${filters}) and (${userFilters.join(' and ')})` : userFilters.join(' and ')
                }

                query.filters = filters;
            }
            else if (method === 'insert') {
                if (!objPm.allowCreate) {
                    throw new Error(`no ${method} permission!`);
                }
            }
            else if (method === 'update' || method === 'updateOne') {
                if (!objPm.allowEdit) {
                    throw new Error(`no ${method} permission!`);
                }
                let id = args[args.length - 3];
                if (!objPm.modifyAllRecords && objPm.modifyCompanyRecords) {
                    let companyFilters = _.map(userSession.companies, function (comp: any) {
                        return `(company_id eq '${comp._id}') or (company_ids eq '${comp._id}')`
                    }).join(' or ')
                    if (companyFilters) {
                        if (_.isString(id)) {
                            id = { filters: `(_id eq \'${id}\') and (${companyFilters})` }
                        }
                        else if (_.isObject(id)) {
                            if (id.filters && !_.isString(id.filters)) {
                                id.filters = formatFiltersToODataQuery(id.filters);
                            }
                            id.filters = id.filters ? `(${id.filters}) and (${companyFilters})` : `(${companyFilters})`;
                        }
                    }
                }
                else if (!objPm.modifyAllRecords && !objPm.modifyCompanyRecords && objPm.allowEdit) {
                    if (_.isString(id)) {
                        id = { filters: `(_id eq \'${id}\') and (owner eq \'${userId}\')` }
                    }
                    else if (_.isObject(id)) {
                        if (id.filters && !_.isString(id.filters)) {
                            id.filters = formatFiltersToODataQuery(id.filters);
                        }
                        id.filters = id.filters ? `(${id.filters}) and (owner eq \'${userId}\')` : `(owner eq \'${userId}\')`;
                    }
                }
                args[args.length - 3] = id;
            }
            else if (method === 'updateMany') {
                if (!objPm.modifyAllRecords && !objPm.modifyCompanyRecords) {
                    throw new Error(`no ${method} permission!`);
                }
                if (!objPm.modifyAllRecords && objPm.modifyCompanyRecords) {
                    let queryFilters = args[args.length - 3];
                    let companyFilters = _.map(userSession.companies, function (comp: any) {
                        return `(company_id eq '${comp._id}') or (company_ids eq '${comp._id}')`
                    }).join(' or ')
                    if (companyFilters) {
                        if (queryFilters && !_.isString(queryFilters)) {
                            queryFilters = formatFiltersToODataQuery(queryFilters);
                        }
                        queryFilters = queryFilters ? `(${queryFilters}) and (${companyFilters})` : `(${companyFilters})`;
                        args[args.length - 3] = queryFilters;
                    }
                }
            }
            else if (method === 'delete') {
                if (!objPm.allowDelete) {
                    throw new Error(`no ${method} permission!`);
                }
                let id = args[args.length - 2];
                if (!objPm.modifyAllRecords && objPm.modifyCompanyRecords) {
                    let companyFilters = _.map(userSession.companies, function (comp: any) {
                        return `(company_id eq '${comp._id}') or (company_ids eq '${comp._id}')`
                    }).join(' or ')
                    if (companyFilters) {
                        id = { filters: `(_id eq \'${id}\') and (${companyFilters})` };
                    }
                }
                else if (!objPm.modifyAllRecords && !objPm.modifyCompanyRecords) {
                    id = { filters: `(_id eq \'${id}\') and (owner eq \'${userId}\')` };
                }
                args[args.length - 2] = id;
            }

        }

    }

    /***** get/set *****/
    public get schema(): SteedosSchema {
        return this._schema;
    }

    public get name(): string {
        return this._name;
    }

    public get fields(): Dictionary<SteedosFieldType> {
        return this._fields;
    }

    public get actions(): Dictionary<SteedosActionType> {
        return this._actions;
    }

    public get triggers(): Dictionary<SteedosTriggerType> {
        return this._triggers;
    }

    public get listeners(): Dictionary<SteedosListenerConfig> {
        return this._listeners;
    }
    public set listeners(value: Dictionary<SteedosListenerConfig>) {
        this._listeners = value;
    }

    public get list_views(): Dictionary<SteedosObjectListViewType> {
        return this._list_views;
    }

    public get table_name(): string {
        return this._table_name;
    }

    public get primaryField(): SteedosFieldType {
        return this._fields[this._idFieldName];
    }

    public get primaryFields(): SteedosFieldType[] {
        return this._idFieldNames.map((fieldName) => {
            return this._fields[fieldName]
        });
    }
}

export function getObject(objectName: string, schema?: SteedosSchema) {
    return (schema ? schema : getSteedosSchema()).getObject(objectName);
}
export function getLocalObject(objectName: string, schema?: SteedosSchema) {
    return (schema ? schema : getSteedosSchema()).getLocalObject(objectName);
}
