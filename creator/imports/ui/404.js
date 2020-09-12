import './404.html';

Template.notFound.helpers({
	object: function() {
	  return Creator.getObject();
	},
	illustration: function() {
	  return ReactSteedos.Illustration;
	},
	notFoundPath: function() {
	  return Creator.getRelativeUrl("/assets/images/illustrations/empty-state-no-results.svg#no-results");
	},
	notFoundHeading: function() {
	  return t("creator_not_found_heading");
	},
	notFoundMessageBody: function() {
	  return t("creator_not_found_message_body");
	}
});
