import './header_profile.html';
import HeaderProfileContainer from './containers/HeaderProfile.jsx'

Template.headerProfile.helpers({
	component: function(){
		return HeaderProfileContainer
	},
	avatarURL: function(){
		var userId = Meteor.userId();
		var user = Creator.getCollection("users").findOne({_id: userId});
		var avatar = null;
		if(user){
			avatar = user.avatar;
		}
		if(avatar){
			return Steedos.absoluteUrl(`avatar/${Meteor.userId()}?w=220&h=200&fs=160&avatar=${avatar}`);
		}else{
			return Creator.getRelativeUrl("/packages/steedos_lightning-design-system/client/images/themes/oneSalesforce/lightning_lite_profile_avatar_96.png");
		}
	},
	logoutAccountClick: function(){
		return function(){
			Steedos.logout();
		}
	},
	settingsAccountClick: function(){
		return function(){
			var url = Steedos.getUserRouter();
			FlowRouter.go(url);
		}
	},
	footers: function(){
		let urls = Meteor.settings.public && Meteor.settings.public.urls;
		let helpUrl = "https://www.steedos.com/help";
		let downloadUrl = "https://www.steedos.com/help/download";
		if(urls && urls.help){
			helpUrl = urls.help;
		}
		if(urls && urls.download){
			downloadUrl = urls.download;
		}
		return [
			{label: t("Online Help"), onClick: function(){return Steedos.openWindow(helpUrl)}},
			{label: t("Client download"), onClick: function(){return Steedos.openWindow(downloadUrl)}},
			{label: t("About"), onClick: function(){return FlowRouter.go("/app/admin/page/creator_about");}}
		]
	},
	assistiveText: function(){
		return {
			settings: window.t("webapp_header_profile_settings"),
			logout: window.t("webapp_header_profile_logout"),
		}
	}
});