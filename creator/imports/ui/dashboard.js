import './dashboard.html';
import DashboardContainer from './containers/DashboardContainer.jsx';

const getWidgetObject = (widgetConfig) => {
	if(widgetConfig.objectName){
		return Creator.getObject(widgetConfig.objectName);
	}
	else{
		switch(widgetConfig.type){
			case "instances_pendings":
				return Creator.getObject("instances");
			case "announcements_week":
				return Creator.getObject("announcements");
			case "tasks_today":
				return Creator.getObject("tasks");
			case "events_today":
				return Creator.getObject("events");
		}
	}
}

const dealConfigColumnsLabel = (config) => {
	if(!config){
		return;
	}
	/* 
		该函数实现把门户config中的columns配置对应的label值转换为内核object中对应的字段label。
		config支持数组格式和json格式。
		数组格式如：[{type:"apps",...},{type:"tasks_today",...},...]
		json格式如：{apps:{type:"apps",...},tasks:{type:"tasks_today",...},...}
	*/
	_.each(config, (value, key) => {
		let columns = value.columns;
		let tempObject, tempObjectFields, tempField;
		let isObjectType = ["object", "instances_pendings", "announcements_week", "tasks_today", "events_today"].indexOf(value.type) > -1;
		if(isObjectType && columns && columns.length){
			tempObject = getWidgetObject(value);
			if(!tempObject){
				return;
			}
			tempObjectFields = tempObject.fields;
			columns.forEach(function(column){
				tempField = tempObjectFields[column.field];
				if(tempField){
					column.label = tempField.label || column.field;
				}
			});
		}
	});
};

const dealAssistiveTextColumnsLabel = (assistiveText) => {
	/* 
		该函数实现把Webapp包中门户内置几种object的widget组件配置的columns对应的label值转换为内核object中对应的字段label，
		并存储到assistiveText变量的对应位置。
		assistiveText中columns结构如下：{
			widgets: {
				...
				tasks_today: {
					...
					columns: {
						name: "Name",
						due_date: "Due Date"
					},
					...
				},
			}
		}
	*/
	let reductsConfig = ReactSteedos.getWidgetReductsConfig();
	_.each(reductsConfig, (value, key) => {
		let columns = value.columns;
		let tempObject, tempObjectFields, tempField, tempI18nColumns, tempAssistiveTextWidget;
		tempAssistiveTextWidget = assistiveText.widgets[key];
		if(tempAssistiveTextWidget && columns && columns.length){
			tempI18nColumns = {};
			tempObject = Creator.getObject(value.objectName);
			tempObjectFields = tempObject && tempObject.fields;
			if(tempObjectFields){
				columns.forEach(function(column){
					tempField = tempObjectFields[column.field];
					if(tempField){
						tempI18nColumns[column.field] = tempField.label || column.field;
					}
				});
				tempAssistiveTextWidget.columns = tempI18nColumns;
			}
		}
	});
}

Template.dashboard.helpers({
	Dashboard: function () {
		let dashboard = Creator.getAppDashboard()
		if (dashboard) {
			// 优先使用数据库或yml配置文件中配置的门户
			return DashboardContainer;
		}
		else {
			return Creator.getAppDashboardComponent();
		}
	},
	config: function () {
		let dashboard = Creator.getAppDashboard();
		let config = dashboard ? dashboard.widgets : {};
		dealConfigColumnsLabel(config);
		return config;
	},
	assistiveText: function () {
		let assistiveText = {
			widgets: {
				apps: {
					label: window.t("webapp_dashboard_widgets_type_apps"),
					tilesSectionLabel: window.t("webapp_dashboard_widgets_apps_tiles_section_label"),
					linksSectionLabel: window.t("webapp_dashboard_widgets_apps_links_section_label")
				},
				object: {
					label: window.t("webapp_dashboard_widgets_object_label"),
					allLinkLabel: window.t("webapp_dashboard_widgets_object_all_link_label"),
					illustrationMessageBody: window.t("webapp_dashboard_widgets_object_illustration_message_body")
				},
				instances_pendings: {
					label: window.t("webapp_dashboard_widgets_instances_pendings_label"),
					illustrationMessageBody: window.t("webapp_dashboard_widgets_instances_pendings_illustration_message_body")
				},
				announcements_week: {
					label: window.t("webapp_dashboard_widgets_announcements_week_label"),
					illustrationMessageBody: window.t("webapp_dashboard_widgets_announcements_week_illustration_message_body")
				},
				tasks_today: {
					label: window.t("webapp_dashboard_widgets_tasks_today_label"),
					illustrationMessageBody: window.t("webapp_dashboard_widgets_tasks_today_illustration_message_body")
				},
				events_today: {
					label: window.t("webapp_dashboard_widgets_events_today_label"),
					illustrationMessageBody: window.t("webapp_dashboard_widgets_events_today_illustration_message_body")
				}
			}
		};
		dealAssistiveTextColumnsLabel(assistiveText);
		return assistiveText;
	}
});

