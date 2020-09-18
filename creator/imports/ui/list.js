import './list.html';
import ListContainer from './containers/ListContainer.jsx'
import ListSelect from './containers/ListSelect.jsx'
import { store, createGridAction } from '@steedos/react';

let isListRendered = false;
let listInstances = {};

const defaultListId = "steedos-list";

const getListViewId = (is_related, related_object_name, listName) => {
	if (is_related) {
		list_view_id = Creator.getListView(related_object_name, "all")._id;
	} else {
		list_view_id = listName;
	}
	return list_view_id;
}

const getListProps = ({id, objectApiName, listName, recordId, related_object_name, is_related, recordsTotal, total, related_list_item_props}, withoutFilters) => {
	let object = Creator.getObject(objectApiName);
	if (!object) {
		return;
	}
	let list_view_id = getListViewId(is_related, related_object_name, listName);
	if (!list_view_id) {
		toastr.error(t("creator_list_view_permissions_lost"));
		return;
	}
	const listId = id ? id : defaultListId;
	let curObjectName;
	curObjectName = is_related ? related_object_name : objectApiName;
	let curObject = Creator.getObject(curObjectName);
	let mainColumns = Creator.getListviewColumns(curObject, objectApiName, is_related, list_view_id, related_list_item_props, true);
	let columns = Creator.unionSelectColumnsWithExtraAndDepandOn(mainColumns, curObject, objectApiName, is_related);
	columns = columns.map((item) => {
		let field = curObject.fields[item];
		if (field) {
			let column = {
				field: item,
				label: field.label,
				type: field.type,
				is_wide: field.is_wide,
				scale: field.scale,
				reference_to: field.reference_to,
				options: field.options,
				allOptions: field.allOptions,
				optionsFunction: field.optionsFunction,
				hidden: !mainColumns.contains(item)
			};
			if(field.type === "select"){
				column.format = (children, doc, options)=>{
					let cellData = Creator.getTableCellData({ field, doc, val: children, object_name: options.objectName, _id: doc._id });
					return ListSelect(cellData, {object_name:curObjectName, field});
				}
			}
			return column;
		}
		else {
			console.error(`The object ${curObject.name} don't exist field '${item}'`);
		}
	});
	let filters = [];
	if (!withoutFilters) {
		// 这里不可以用Tracker.nonreactive，因为当有过滤条件时，滚动翻页及滚动刷新需要传入这里的过滤条件
		filters = Creator.getListViewFilters(objectApiName, list_view_id, is_related, related_object_name, recordId);
	}
	columns = _.without(columns, undefined, null);
	let pageSize = 20;
	let pager = true;
	let showIllustration = true;
	if(is_related && recordsTotal){
		// 详细界面相关列表
		pageSize = 5;
		pager = false;
		showIllustration = false;
	}
	let endpoint = Creator.getODataEndpointUrl(objectApiName, list_view_id, is_related, related_object_name);
	let isFiltering = Creator.getIsFiltering();
	let filteringText = isFiltering ? "以下为过滤后结果" : null;
	const handleResetFiltering = ()=> {
		Session.set("filter_items", []);
	}
	let listView = Creator.getListView(curObjectName, list_view_id);
	let sort = listView.sort;
	return {
		id: listId,
		objectName: curObjectName,
		columns: columns,
		filters: filters,
		pageSize: pageSize,
		pager: pager,
		showMoreLink: true,
		endpoint: endpoint,
		sort: sort,
		resetFiltering: handleResetFiltering,
		filteringText: filteringText,
		moreLinkHref: (props)=> {
			return Creator.getRelatedObjectUrl(objectApiName, "-", recordId, related_object_name)
		},
		showIllustration: showIllustration
	}
}

Template.list.helpers({
	component: function () {
		return ListContainer;
	},
	listProps: function () {
		let props = getListProps(this.options)
		return props;
	}
});

Template.list.onCreated(function () {
	// 切换对象或视图时，会再进一次onCreated，所以object、listview、options不需要放到autorun中
	const { id, objectApiName, listName, recordId, related_object_name, is_related, recordsTotal, total } = this.data.options;
	const listId = id ? id : defaultListId;
	let curObjectName;
	curObjectName = is_related ? related_object_name : objectApiName;
	let list_view_id = getListViewId(is_related, related_object_name, listName);
	if (!list_view_id) {
		toastr.error(t("creator_list_view_permissions_lost"));
		return;
	}
	let props = getListProps(this.data.options, true);
	let newProps = {
		id: listId
	};
	if (props.pager || props.showMoreLink) {
		newProps.count = true;
	}
	this.refresh = ()=>{
		// 保持过滤条件不变，刷新到第一页数据
		let filters = Creator.getListViewFilters(objectApiName, list_view_id, is_related, related_object_name, recordId);
		newProps.filters = filters;
		store.dispatch(createGridAction('currentPage', 0, Object.assign({}, props, newProps)))
	}
	this.reload = ()=>{
		// 过滤条件变更时用新的过滤条件重新加载数据
		let filters = Creator.getListViewFilters(objectApiName, list_view_id, is_related, related_object_name, recordId);
		if(isListRendered){
			store.dispatch(createGridAction('filters', filters, Object.assign({}, props, newProps)))
		}
	}
	if(is_related){
		if(recordsTotal){
			// 详细界面相关列表，新建记录后刷新当前列表
			AutoForm.hooks({
				creatorAddRelatedForm: {
					onSuccess: (formType, result)=> {
						this.refresh();
					}
				}
			});
		}
		else if(total){
			// 主列表或独立的相关列表界面不需要新建记录后刷新当前列表，因为会跳转到详细界面
		}
	}
	listInstances[listId] = this;
	if(is_related){
		if(this.unsubscribe){
			this.unsubscribe();
		}
		this.unsubscribe = store.subscribe(()=>{
			// 订阅store中列表数量值
			let listState = ReactSteedos.viewStateSelector(store.getState(), listId);
			if(listState && !listState.loading){
				if(recordsTotal){
					// 详细界面相关列表
					let recordsTotalValue = Tracker.nonreactive(()=>{return recordsTotal.get()});
					recordsTotalValue[curObjectName] = listState.totalCount;
					recordsTotal.set(recordsTotalValue);
				}
				else if(total){
					// 主列表或独立的相关列表界面
					total.set(listState.totalCount);
				}
			}
		});
	}
	else{
		// 加Meteor.defer可以在刷新浏览器时少进一次
		// Meteor.defer(()=>{
		// 	this.autorun((c) => {
		// 		let currentObjectName = Tracker.nonreactive(()=>{return Session.get("object_name");});
		// 		let currentListViewId = Tracker.nonreactive(()=>{return Session.get("list_view_id");});
		// 		if(list_view_id !== currentListViewId || objectApiName !== currentObjectName){
		// 			// 合同、报表等对象视图中定义了filters，会造成切换视图时多请求一次odata接口
		// 			return;
		// 		}
		// 		if(Steedos.spaceId() && Creator.subs["CreatorListViews"].ready() && Creator.subs["TabularSetting"].ready()){
		// 			this.reload();
		// 			isListRendered = true;
		// 		}
		// 	});
		// });
		this.reload();
		isListRendered = true;
	}
})

Template.list.onDestroyed(function () {
	const { id } = this.data.options;
	const listId = id ? id : defaultListId;
	isListRendered = false;
	if(this.unsubscribe){
		this.unsubscribe();
	}
	listInstances[listId] = null;
});

Template.list.refresh = (id)=>{
	const listId = id ? id : defaultListId;
	listInstances[listId].refresh();
}

