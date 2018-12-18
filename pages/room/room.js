/**
 * @fileOverview 聊天室综合 Demo 示例
 */


// 引入 QCloud 小程序增强 SDK
var qcloud = require('../../vendor/wafer2-client-sdk/index');

// 引入配置
var config = require('../../config');
var BASE_URL = config.service.host;
var commonUtil = require('../../utils/commonUtil');
const { $Toast } = require('../../vendor/iview/base/index');

/**
 * 生成一条聊天室的消息的唯一 ID
 */
function msgUuid() {
  if (!msgUuid.next) {
    msgUuid.next = 0;
  }
  return 'msg-' + (++msgUuid.next);
}
/**
 * 生成聊天室的系统消息
 */
function createSystemMessage(content) {
  return { id: msgUuid(), type: 'system', content };
}

/**
 * 生成聊天室的聊天消息
 */
function createUserMessage(content, user, isMe,distance) {
  return { id: msgUuid(), type: 'speak', content, user, isMe ,distance};
}

// 声明聊天室页面
Page({

  /**
   * 聊天室使用到的数据，主要是消息集合以及当前输入框的文本
   */
  data: {
    messages: [],
    inputContent: '',
    lastMessageId: 'none',
    latitude: 0,
    longitude: 0,
    socketOpen: false,
    socketMsgQueue: [],
    roomId: 0,
    roomName: '',
      disabled: false,
      pageReady:false,
      forbiddenPercent: 100,
      forbiddenStatus: 'success',
      voteOpenId:'',
      visible: false
  },

  onLoad: function (options) { 
    var that = this;
    that.setData({
      roomId: options.roomId,
      roomName: options.roomName,
        pageReady: true
    });
  },

  /**
   * 页面渲染完成后，启动聊天室
   * */
  onReady() {
    // var that = this;
    // that.enter();
  },


  /**
   * 后续后台切换回前台的时候，也要重新启动聊天室
   */
  onShow() {
    //   let that = this;
    // if (that.data.pageReady) {
      this.enter();
    // }
  },

  /**
   * 页面卸载时，退出聊天室
   */
  onUnload() {
    this.quit();
  },

  /**
   * 页面切换到后台运行时，退出聊天室
   */
  onHide() {
    this.quit();
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {
      return {
          title: this.data.roomName,
          imageUrl: 'https://file.iviewui.com/iview-weapp-logo.png'
      };
  },

  /**
   * 启动聊天室
   */
  enter() {
    this.pushMessage(createSystemMessage('正在登录...'));
    // 如果登录过，会记录当前用户在 this.me 上
      this.me = getApp().globalData.session;
      this.connect();
      this.getUserForbidden();
  },

    /**
     * 查询用户的禁言程度
     */
  getUserForbidden(){
    let that = this;
      wx.request({
          url: BASE_URL + '/jinlailiao/user/getUserForbidden?openId=' + this.me.openId,
          method: 'GET',
          success: function (res) {
              // that.setProcessPerCentAndStatus();
              if(res.data.forbidden){
                  that.setSendButtonDisabled();
                  that.amendMessage(createSystemMessage(res.data.msg));
              }
          },
          fail: function (err) {

          },
          complete: function () {

          }
      });
  },

    setVoteOpenId(e) {
      let that = this;
      console.log(e);
      let voteOpenId = e.currentTarget.id;
      //自己不能给自己投票
      if(that.me.openId != voteOpenId){
        this.setData({visible: !that.data.visible});
        this.setData({ voteOpenId: voteOpenId });
      }
    },

    /**
     * 投票禁言
     */
    voteForbidden(){
      let that = this;
        wx.request({
            url: BASE_URL + '/jinlailiao/user/voteUseForbidden?openId=' + that.me.openId + '&voteOpenId=' + that.data.voteOpenId,
            method: 'POST',
            header: {
                "Content-Type":"application/json"
            },
            success: function (result) {
                console.log(result);
                if(result.statusCode == 200){
                    $Toast({
                        content: '投票禁言成功',
                        type: 'success'
                    });
                }else {
                    $Toast({
                        content: result.data.message,
                        type: 'warning'
                    });
                }
                //隐藏modal模块
                that.setData({
                    visible: !that.data.visible
                });
            },
            fail: function (err) {
                $Toast({
                    content: '投票禁言失败',
                    type: 'error'
                });

            }
        });

    },

    // /**
    //  * 设置禁言条及颜色
    //  * @param forbiddenPercent
    //  */
    // setProcessPerCentAndStatus(forbiddenPercent){
    //     let that = this;
    //     let pecent = forbiddenPercent * 100;
    //     if(pecent > 90){
    //         that.setData({forbiddenStatus: 'sucess'})
    //     }else if(pecent < 90 && pecent > 30){
    //       that.setData({forbiddenStatus: 'normal'})
    //     }else if(pecent < 30){
    //         that.setData({forbiddenStatus: 'wrong'})
    //     }
    //     that.setData({forbiddenPercent: pecent});
    // },

  /**
   * 连接到聊天室信道服务
   */
  connect() {
      let that = this;
      // 避免重复创建信道
    // if (this.tunnel && this.tunnel.isActive()) return;

    this.amendMessage(createSystemMessage('正在加入...'));
        
    let url = config.service.tunnelUrl + '/' + this.me.openId + '/' + this.data.roomId;
    wx.connectSocket({
      url: url,
      success: (response) => {
          that.popMessage();
      }
    });
    wx.onSocketOpen((res) => {
      that.setData({ socketOpen: true });
      var socketMsgQueue = this.data.socketMsgQueue;
      for (let i = 0; i < socketMsgQueue.length; i++) {
        sendSocketMessage(socketMsgQueue[i])
      }
      that.setData({ socketMsgQueue: [] });
    });

    wx.onSocketMessage((res) => {
      console.log("===========服务端返回数据为================");
      console.log(res);
      var user = JSON.parse(res.data);
      if(user.forbidden && user.openId == this.me.openId){//自己被禁言后，禁用发送按钮
          that.pushMessage(createSystemMessage(user.msg));
          that.setSendButtonDisabled();
      }else if(user.peopleCount != null){//有成员加入离开房间，更新房间人数
          wx.setNavigationBarTitle({ title: that.data.roomName + ' （' + user.peopleCount + '）' });
      }else{
          // if(user.openId != this.me.openId){
          //TODO 修改为==
          let distance = commonUtil.getDistance(user.latitude,user.longitude,getApp().globalData.latitude,getApp().globalData.longitude);
          // console.log("发言人距离我" + distance);
          that.pushMessage(createUserMessage(user.msg, user, user.openId == this.me.openId,distance));
          // }
      }
      // this.pushMessage(createSystemMessage(res.data));
    });

    wx.onSocketClose(function (res) {
      console.log('WebSocket 已关闭！')
    });

    function sendSocketMessage(msg) {
      var socketMsgQueue = this.data.socketMsgQueue;
      var socketOpen = this.data.socketOpen;
      if (socketOpen) {
        wx.sendSocketMessage({
          data: msg
        })
      } else {
        socketMsgQueue.push(msg)
      }
    }


  },

  setSendButtonDisabled(){
      this.setData({ disabled: true });
  },

  /**
   * 退出聊天室
   */
  quit() {
    wx.closeSocket();
      // wx.navigateTo({
      //     url: '../index/index'
      // })
  },

  /**
   * 通用更新当前消息集合的方法
   */
  updateMessages(updater) {
    var messages = this.data.messages;
    // console.log("messages =====");
    // console.log(messages);
    updater(messages);

    this.setData({ messages });

    // 需要先更新 messagess 数据后再设置滚动位置，否则不能生效
    var lastMessageId = messages.length ? messages[messages.length - 1].id : 'none';
    this.setData({ lastMessageId });
  },

  /**
   * 追加一条消息
   */
  pushMessage(message) {
    this.updateMessages(messages => messages.push(message));
  },

  /**
   * 替换上一条消息
   */
  amendMessage(message) {
    this.updateMessages(messages => messages.splice(-1, 1, message));
  },

  /**
   * 删除上一条消息
   */
  popMessage() {
    console.log("popMessage");
    this.updateMessages(messages => messages.pop());
  },

  /**
   * 用户输入的内容改变之后
   */
  changeInputContent(e) {
    this.setData({ inputContent: e.detail.value });
  },

  /**
   * 点击「发送」按钮，通过信道推送消息到服务器
   **/
  sendMessage(e) {
    let that = this;
    let who = that.me;
    if(that.data.inputContent != ''){
      who["msg"] = that.data.inputContent;
      //发送当前发言人的地理位置，用于计算距离
      who["latitude"] = getApp().globalData.latitude;
      who["longitude"] = getApp().globalData.longitude;
      console.log(who);
      wx.sendSocketMessage({
          data: JSON.stringify(who)
      })

      // this.pushMessage(createUserMessage(that.data.inputContent, who, who.openId === that.me.openId));
      this.setData({ inputContent: '' });
    }
  },
});
