/**
 * 小程序配置文件
 */

// 此处主机域名修改成腾讯云解决方案分配的域名
//var host = 'https://xz1bmulf.qcloud.la';
var host = 'http://dev.ourmemory.online:9990';
var config = {
  APP_ID:'',

    // 下面的地址配合云端 Demo 工作
    service: {
        host,

        // 登录地址，用于建立会话
        loginUrl: `${host}/jinlailiao/user/login`,

        // 测试的请求地址，用于测试会话
        requestUrl: `${host}/jinlailiao/user/check`,

        // 测试的信道服务地址
      tunnelUrl: `ws://dev.ourmemory.online:9990/websocket`,

        // 上传图片接口
      uploadUrl: `${host}/jinlailiao/upload`
    }
};

module.exports = config;