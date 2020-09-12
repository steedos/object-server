import {Icon, Button} from '@salesforce/design-system-react';

const {createTreeAction, store, viewStateSelector, createModalAction} = ReactSteedos;

var _ = require("underscore");
var treeId = "chooseFlowTree";

const labelClick = (event, data, flowLabelClick) => {
	// console.log('labelClick', data, flowLabelClick);
	event.stopPropagation();
	if (flowLabelClick && _.isFunction(flowLabelClick)) {
		let args = {
			flow: data._id,
			categorie: data._category,
			organization: null
		};
		flowLabelClick(args);
	}
};

const getNodeData = (treeId, nodeId) => {
	return viewStateSelector(store.getState(), treeId).nodes[nodeId];
}

const favoriteClick = (event, data, flowLabelClick) => {
	event.stopPropagation();
	// console.log('favoriteClick data', data);
	Meteor.call('start_flow', Session.get("spaceId"), data._id, !data.favorite);
	var currentNode = getNodeData(treeId, data._id);
	store.dispatch(createTreeAction('changeNode', {
		node: Object.assign({}, currentNode, {
			id: data._id,
			label: getNodeItemLabel(Object.assign({}, data, {favorite: !data.favorite}), flowLabelClick)
		})
	}, {id: treeId}));
	let myFavoriteNode = getNodeData(treeId, "myFavorite");
	let favoriteNodes = [];
	if (!data.favorite) {
		favoriteNodes = _.union(myFavoriteNode.nodes || [], [data._id]);
	} else {
		favoriteNodes = _.difference(myFavoriteNode.nodes || [], [data._id]);
	}
	store.dispatch(createTreeAction('changeNode', {
		node: Object.assign({}, myFavoriteNode, {
			id: "myFavorite",
			nodes: favoriteNodes
		})
	}, {id: treeId}));
};

export function getNodeItemLabel(item, flowLabelClick) {
	let colorVariant = "light";
	if (item.favorite) {
		colorVariant = "warning";
	}
	//此处必须用button控件，否则会导致搜索，默认展开后，第一次点击时，不触发click事件
	return (
		<div>
			<Button
				style={{display: "inline-block", width: "calc(100% - 4rem)"}}
				onClick={(e) => {
					labelClick(e, item, flowLabelClick)
				}}
				label={item.name}
				iconCategory="utility"
				iconName="pop_in"
				iconPosition="left"
				iconClassName="flow-label-icon"
			/>
			<Button style={{float: "right", cursor: 'pointer', marginRight: '3rem'}} onClick={(e) => {
				favoriteClick(e, item, flowLabelClick)
			}}>
				<Icon
					category="utility"
					name="favorite"
					size="x-small"
					colorVariant={colorVariant}
				/>
			</Button>
		</div>
	)
};

function getMyFavoriteNodeLabel() {
	return (
		<div>
			<a>{window.t("star_flows")}
				<span style={{marginLeft: "0.25rem", top: "-2px", position: "relative"}}>
					<Icon category="utility" name="favorite" size="x-small" colorVariant="warning"/>
				</span>
			</a>
		</div>
	)
}

export function getMyFavoriteNode(myStartFlows) {
	// console.log('getMyFavoriteLabel.....');
	return {
		id: "myFavorite",
		label: getMyFavoriteNodeLabel(),
		type: "branch",
		nodes: _.pluck(myStartFlows, '_id')
	}
}

export function getModalHeading(str, helpUrl) {
	return (<div>
			{str}
			<Button
				iconCategory="utility"
				iconName="question_mark"
				iconPosition="left"
				label={window.t("Help")}
				style={{float: "right", fontSize: "1rem"}}
				onClick={(e) => {
					if (helpUrl) {
						Steedos.openWindow(helpUrl)
					}
				}}
			/>
		</div>
	)
}

export function getModalHeader(modalId, heading, helpUrl){
	return (
		<div>
			<Button
				className="chooseFlow-header-close"
				label={window.t("Cancel")}
				style={{float: "left", display: "block"}}
				onClick={(e) => {
					store.dispatch(createModalAction('isOpen', false, {id: modalId}))
				}}
			/>
			<Button
				className="chooseFlow-header-help"
				// iconCategory="utility"
				// iconName="question_mark"
				// iconPosition="left"
				label={window.t("Help")}
				style={{float: "right", display: "block"}}
				onClick={(e) => {
					if (helpUrl) {
						Steedos.openWindow(helpUrl)
					}
				}}
			/>
			<h2 className="slds-text-heading_medium" id="chooseFlow-heading">{heading}</h2>
		</div>
	)
}

export function getAllFlowNode(id, flowLabelClick){
	return {
		id: id,
		label: (
			<Button
				style={{display: "inline-block", width: "100%"}}
				onClick={(e) => {
					labelClick(e, {}, flowLabelClick)
				}}
				label={window.t("All flows")}
				iconCategory="utility"
				iconName="rows"
				iconPosition="left"
				iconClassName="all-flow-label-icon"
				/>
		),
		type: "item"
	}
}
// return (<div>
// 		{str}
// 		<a style={{marginLeft: "0.25rem", top: "-2px", position: "relative"}} onClick={(e) => {
// 			if (helpUrl) {
// 				Steedos.openWindow(helpUrl)
// 			}
// 		}}><Icon category="utility"
// 				 name="question_mark"
// 				 size="x-small"/></a>
// 		<Button
// 			iconCategory="utility"
// 			iconName="question_mark"
// 			iconPosition="left"
// 			label="帮助"
// 		/>
// 	</div>
// )