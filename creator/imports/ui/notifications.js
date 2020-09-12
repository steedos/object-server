import './notifications.html';
const { pluginComponentSelector, store } = ReactSteedos;


Template.notifications.helpers({
	Component: function(){
		return pluginComponentSelector(store.getState(), "Notifications", "steedos-default-header-notifications");
	},
	assistiveText: function(){
		return {
			newNotificationsAfter: window.t("webapp_notifications_new_after"),
			newNotificationsBefore: window.t("webapp_notifications_new_before"),
			noNotifications: window.t("webapp_notifications_new_no"),
			markAllAsRead: window.t("webapp_notifications_mark_all_as_read"),
			emptyNotifications: window.t("webapp_notifications_empty"),
		}
	},
	title: function(){
		return window.t("notifications__object")
	}
});
