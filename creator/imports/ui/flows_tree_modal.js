import './flows_tree_modal.html';
import FlowsTreeModalContainer from './containers/FlowsTreeModal'
import {
	getNodeItemLabel,
	getMyFavoriteNode,
	getModalHeader,
	getAllFlowNode
} from './flows_tree'

const { store, viewStateSelector, createModalAction, createTreeAction } = ReactSteedos;
var _ = require("underscore");
var appElement = "body";
var modalId = "chooseFlow";
var treeId = "chooseFlowTree";
var modalProp = new ReactiveVar({heading: "选择流程"});
var treeProp = new ReactiveVar({treeId: treeId, nodes: [], rootNodes: []});
// console.log('Template.flowsTreeModal....');

// window.createTreeAction = createTreeAction;

Template.flowsTreeModal.helpers({
	component: function(){
		return FlowsTreeModalContainer;
	},
	modalId: function(){
		return modalId;
	},
	appElement: function(){
		return appElement;
	},
	modalProp: function(){
		return modalProp.get();
	},
	treeProp: function(){
		return treeProp.get();
	}
});

Template.flowsTreeModal.show = function(options){
	if(options){
		if(options.onConfirm){
			var gridProp = options.gridProp;
			var onConfirm = options.onConfirm;
			options.onConfirm = function(){
				if(_.isFunction(onConfirm)){
					onConfirm(viewStateSelector(store.getState(), gridProp.id).selection);
				}
			}
		}
		var nodes = getNodes(options, function(args){
			// console.log('cb options', options, args);
			if( options.flowLabelClick && _.isFunction(options.flowLabelClick)){
				options.flowLabelClick(args)
			}
			Meteor.defer(function(){
				store.dispatch(createModalAction('isOpen', false, {id: modalId}))
			});
		});
		var _modalProp = Object.assign({}, modalProp.get(), options.modalProp);
		if(options.modalProp.heading && options.modalProp.helpUrl){
			_modalProp.header = getModalHeader(modalId, options.modalProp.heading, options.modalProp.helpUrl);
		}
		modalProp.set(_modalProp);
		treeProp.set(Object.assign({}, treeProp.get(), {nodes: nodes.nodes, rootNodes: nodes.rootNodes}, options.treeProp));
	}

	Meteor.defer(function(){
		store.dispatch(createModalAction('isOpen', true, {id: modalId}))
	});
};

function getNodes(options, flowLabelClick){
	var showType = options.showType;
	var myStartFlows = getStartFlow(showType);
	var nodes = {
		rootNodes: [],
		nodes: {}
	};

	if(options.clearable){
		var allFlowId = 'all_flows';
		nodes.rootNodes.push(allFlowId);
		nodes.nodes[allFlowId] = getAllFlowNode(allFlowId, flowLabelClick)
	}


	var data = getFlowListData(showType);
	if(data.distribute_optional_flows){
		_.each(data.distribute_optional_flows, function(flow){
			nodes.rootNodes.push(flow._id);
			var flowNode = getFlowNodeItem(flow, {}, flowLabelClick, options);
			nodes.nodes[flow._id] =flowNode;
		})
	}else{
		nodes.rootNodes.push("myFavorite");
		nodes.nodes["myFavorite"] = getMyFavoriteNode(myStartFlows);
		_.each(data.categories, function(category){
			nodes.rootNodes.push(category._id);
			var nodeItems = getNodeItems(options, category, flowLabelClick);
			var categoryNode = {
				id: category._id,
				label: category.name,
				type: "branch",
				nodes: _.keys(nodeItems)
			};
			if(options.categorie && options.categorie == category._id){
				categoryNode.expanded = true;
			}
			nodes.nodes[category._id] = categoryNode;
			nodes.nodes = Object.assign({}, nodes.nodes, nodeItems);
		});
	}

	return nodes
}

// window.getNodes = getNodes;

function getFlowNodeItem(flow, category, flowLabelClick, options){
	var favorite = isStartFlow(flow._id);
	var _category = category._id;
	var labelItem = getNodeItemLabel(Object.assign({favorite: favorite, _category: _category}, flow), flowLabelClick);
	var flowNode = {id: flow._id, label: labelItem, type: "item", assistiveText: flow.name};
	if(options.flow && options.flow === flow._id){
		flowNode.selected = true;
	}
	return flowNode;
}

function getNodeItems(options, category, flowLabelClick){
	var items = {};
	_.each(category.forms, function(form){
		_.each(form.flows, function(flow){
			var flowNode = getFlowNodeItem(flow, category, flowLabelClick, options);
			items[flow._id] =flowNode
		})
	});
	return items;
}

function getStartFlow(showType){
	var listData = WorkflowManager.getFlowListData(showType);
	var all_flows = [];
	//分发时不显示星标流程
	if(listData.distribute_optional_flows){
		return []
	}else{
		//把流程分类的数据结构转成流程id值列表
		all_flows = _.pluck(_.flatten(_.pluck(_.flatten(_.pluck(listData.categories,"forms"), true),"flows"),true),"_id");
		if(_.isEmpty(all_flows)){
			return []
		}
	}
	var start_flows = getStartFlows();
	var flows = db.flows.find({_id: {$in: _.intersection(start_flows, all_flows)}}).fetch()
	return flows
}

function getStartFlows(){
	var startFlows = db.steedos_keyvalues.findOne({space: Session.get("spaceId"), user: Meteor.userId(), key: 'start_flows'});
	if(startFlows && startFlows.value){
		return startFlows.value
	}
	return []
}

function isStartFlow(flowId){
	var start_flows = getStartFlows();
	return start_flows.includes(flowId)
}

function showStartFlows(start_flows){
	return !_.isEmpty(start_flows)
}

function getFlowListData(showType){
	return WorkflowManager.getFlowListData(showType);
}