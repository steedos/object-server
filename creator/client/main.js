import("./browser");
require("./theme.less");
import 'core-js/proposals/url';
// IE11支持SVG图标
svg4everybody();

import("./main.html");

// 把组件导入才能在creator中正常使用

Meteor.startup(function(){
    import * as UI from '../imports/ui';
})

window.React = require('react');
window.ReactDOM = require('react-dom');
window.Redux = require('redux');
window.ReactRedux = require('react-redux');

// 全局变量导入
import { registerWindowLibraries, registerDefaultPlugins } from '@steedos/react';
registerWindowLibraries();
registerDefaultPlugins();

Template.preloadAssets.helpers({
    absoluteUrl(url){
        return Steedos.absoluteUrl(url)
    }
});

Meteor.startup(function(){
    if (Steedos.isMobile() && Meteor.settings.public && Meteor.settings.public.tenant && Meteor.settings.public.tenant.enable_mobile == false) {
        $('head meta[name=viewport]').remove();
        $('head').append('<meta name="viewport" content="">');
    } else if (screen.width>360){
        // 手机上自动放大停用，iPad也有问题
        // $('head meta[name=viewport]').remove();
        // $('head').append('<meta name="viewport" content="user-scalable=no, initial-scale=1.1, maximum-scale=1.1, minimum-scale=1.1">');        
    }
});
