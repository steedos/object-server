import { SteedosError } from '@steedos/objectql'
const objectql = require('@steedos/objectql');
const _ = require("underscore");

export const runProcessNodeAction = async (processNodeId: string, when: string, recordId: string, userSession: any)=>{
    const processNode = await objectql.getObject("process_node").findOne(processNodeId);
    const filters = [];
    const wnfilters = [];
    switch (when) {
        case 'approval':
            if(!_.isEmpty(processNode.approval_updates_field_actions) && _.isArray(processNode.approval_updates_field_actions)){
                filters.push(['name', 'in', processNode.approval_updates_field_actions])
            }
            if(!_.isEmpty(processNode.approval_workflow_notifications_actions) && _.isArray(processNode.approval_workflow_notifications_actions)){
                wnfilters.push(['name', 'in', processNode.approval_workflow_notifications_actions])
            }
            break;
        case 'rejection':
            if(!_.isEmpty(processNode.rejection_updates_field_actions) && _.isArray(processNode.rejection_updates_field_actions)){
                filters.push(['name', 'in', processNode.rejection_updates_field_actions])
            }
            if(!_.isEmpty(processNode.rejection_workflow_notifications_actions) && _.isArray(processNode.rejection_workflow_notifications_actions)){
                wnfilters.push(['name', 'in', processNode.rejection_workflow_notifications_actions])
            }
            break;
        default:
            throw new SteedosError(`无效的参数when: ${when}`, );
    }
    if(!_.isEmpty(filters)){
        const actions = await objectql.getObject("action_field_updates").find({filters: filters})
        for (const action of actions) {
            await objectql.runFieldUpdateAction(action, recordId, userSession)
        }
    }
    if(!_.isEmpty(wnfilters)){
        const notifications = await objectql.getObject("workflow_notifications").find({filters: wnfilters})
        for (const wn of notifications) {
            await objectql.runWorkflowNotifyAction(wn, recordId, userSession)
        }
    }
}

export const runProcessAction = async (processId: string, when: string, recordId: string, userSession: any)=>{
    const process = await objectql.getObject("process_definition").findOne(processId);
    const filters = [];
    const wnfilters = [];
    switch (when) {
        case 'initial_submission':
            if(!_.isEmpty(process.initial_submission_updates_field_actions) && _.isArray(process.initial_submission_updates_field_actions)){
                filters.push(['_id', 'in', process.initial_submission_updates_field_actions])
            }
            if(!_.isEmpty(process.initial_submission_workflow_notifications_actions) && _.isArray(process.initial_submission_workflow_notifications_actions)){
                wnfilters.push(['name', 'in', process.initial_submission_workflow_notifications_actions])
            }
            break;
        case 'final_approval':
            if(!_.isEmpty(process.final_approval_updates_field_actions) && _.isArray(process.final_approval_updates_field_actions)){
                filters.push(['_id', 'in', process.final_approval_updates_field_actions])
            }
            if(!_.isEmpty(process.final_approval_workflow_notifications_actions) && _.isArray(process.final_approval_workflow_notifications_actions)){
                wnfilters.push(['name', 'in', process.final_approval_workflow_notifications_actions])
            }
            break;
        case 'final_rejection':
            if(!_.isEmpty(process.final_rejection_updates_field_actions) && _.isArray(process.final_rejection_updates_field_actions)){
                filters.push(['_id', 'in', process.final_rejection_updates_field_actions])
            }
            if(!_.isEmpty(process.final_rejection_workflow_notifications_actions) && _.isArray(process.final_rejection_workflow_notifications_actions)){
                wnfilters.push(['name', 'in', process.final_rejection_workflow_notifications_actions])
            }
            break;
        case 'recall':
            if(!_.isEmpty(process.recall_updates_field_actions) && _.isArray(process.recall_updates_field_actions)){
                filters.push(['_id', 'in', process.recall_updates_field_actions])
            }
            if(!_.isEmpty(process.recall_workflow_notifications_actions) && _.isArray(process.recall_workflow_notifications_actions)){
                wnfilters.push(['name', 'in', process.recall_workflow_notifications_actions])
            }
            break;
        default:
            throw new SteedosError(`无效的参数when: ${when}`, );
    }
    if(!_.isEmpty(filters)){
        const actions = await objectql.getObject("action_field_updates").find({filters: filters})
        for (const action of actions) {
            await objectql.runFieldUpdateAction(action, recordId, userSession)
        }
    }
    if(!_.isEmpty(wnfilters)){
        const notifications = await objectql.getObject("workflow_notifications").find({filters: wnfilters})
        for (const wn of notifications) {
            await objectql.runWorkflowNotifyAction(wn, recordId, userSession)
        }
    }
}