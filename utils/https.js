var config = require('../config');
var BASE_URL = config.service.host;
var APP_ID = config.APP_ID
const https = [];

function defaultHeader() {
  let headers = {
    'appId': APP_ID,
  };
  return headers;
}
const request = (url, params, method = 'GET') => {
  // wx.showNavigationBarLoading();
  wx.request({
    url: BASE_URL + '/' + url,
    method: method,
    header: defaultHeader(),
    data: method === 'GET' ? Object.assign({}, params, {
      t: new Date().getTime()
    }) : params,
    success: function (result) {
      console.log('request:', BASE_URL + '/' + url, '\nresponse:', result);
      if (result.statusCode === 200) {
        // request success
        return result.data;
      } else {
        // request fail TODO 错误代码在页面单独处理 cause 错误代码不一定需要弹 toast
        // const error = result || {};
        // if (error && error.header) {
        //   const resMsg = error.header.msg ? error.header.msg : SERVICE_ERROR_STATUS[error.statusCode];
        //   error.msg = resMsg || '接口调用失败';
        //   if (error.statusCode === 852) {
        //     // TODO 登出
        //   }
        // }
      }
    },
    fail: function (err) {

    },
    complete: function () {

    }
  });
};

var getRequest = (url, params) => {
  return request(url, params, 'GET');
};
var postRequest = (url, params) => {
  return request(url, params, 'POST');
};

module.exports = {
  getRequest: getRequest,
  postRequest: postRequest,
};