/**
 * @fileOverview 微信小程序的入口文件
 */

var qcloud = require('./vendor/wafer2-client-sdk/index');
var config = require('./config');
var commonUtil = require('./utils/commonUtil');
// const { $Toast } = require('./vendor/iview/base/index');
// var https = require('./utils/https');
// import { postRequest, getRequest } from './utils/https';


App({
    /**
     * 小程序初始化时执行，我们初始化客户端的登录地址，以支持所有的会话操作
     */
    onLaunch() {
        qcloud.setLoginUrl(config.service.loginUrl);
    },
    globalData:{
        session: null,
        latitude: 0,
        longitude: 0
    }
});