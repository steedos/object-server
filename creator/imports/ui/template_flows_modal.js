import './template_flows_modal.html';
const { store, viewStateSelector, createFlowsModalAction } = ReactSteedos;
import FlowsModalContainer from './containers/FlowsModal'
var _ = require("underscore");

var gridId = "templateFlowsModalGridId";
var modalId = "templateFlowsModal";
var onConfirm = '';
var gridProp = ReactiveVar({});

Template.templateFlowsModal.helpers({
	component: function(){
		return FlowsModalContainer;
	},
	spaceId: function () {
		return Creator.getTemplateSpaceId();
	},
	multiple: function(){
		return false;
	},
	gridId: function(){
		return gridId;
	},
	modalId: function () {
		return modalId;
	},
	onConfirm: function(){
		return function(){
			if(_.isFunction(onConfirm)){
				onConfirm(viewStateSelector(store.getState(), gridId).selection);
			}
		}
	},
	gridProp: function(){
		return gridProp.get();
	}
});


Template.templateFlowsModal.show = function(options){
	if(options && _.isFunction(options.onConfirm)){
		onConfirm = options.onConfirm;
	}
	if(options && options.gridProp){
		gridProp.set(options.gridProp);
	}

	store.dispatch(createFlowsModalAction('isOpen', true, {id: modalId}))
};