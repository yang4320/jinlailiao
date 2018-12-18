/**
 * @fileOverview 聊天室综合 Demo 示例
 */


// 引入 QCloud 小程序增强 SDK
var qcloud = require('../../vendor/wafer2-client-sdk/index');

// 引入配置
var config = require('../../config');

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
function createUserMessage(content, user, isMe) {
    return { id: msgUuid(), type: 'speak', content, user, isMe };
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

        socketOpen: false,
        socketMsgQueue: [],
        roomId: 0,
        roomName: ''
    },

  onLoad: function (options) {
    var that = this;
    console.log(options);
    that.setData({
      roomId: options.id,
      roomName: options.roomName
    });

  },

    /**
     * 页面渲染完成后，启动聊天室
     * */
    onReady() {
      var that = this;
      wx.setNavigationBarTitle({ title: that.roomName });

        // if (!this.pageReady) {
        //     this.pageReady = true;
        //     this.enter();
        // };

      // wx.setEnableDebug({
      //   enableDebug: true
      // });
    },

    
    /**
     * 后续后台切换回前台的时候，也要重新启动聊天室
     */
    onShow() {
        // if (this.pageReady) {
        //     this.enter();
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
     * 启动聊天室
     */
    enter() {
        this.pushMessage(createSystemMessage('正在登录...'));
        // 如果登录过，会记录当前用户在 this.me 上
        if (!this.me) {
          qcloud.login({
                success: (response) => {
                    console.log('me ====' );
                  console.log(response);
                    this.me = response;
                    this.connect();
                }
            });
        } else {
            this.connect();
        }
    },

    /**
     * 连接到聊天室信道服务
     */
    connect() {
        // 避免重复创建信道
        // if (this.tunnel && this.tunnel.isActive()) return;

        this.amendMessage(createSystemMessage('正在加入群聊...'));
        wx.connectSocket({
          url: 'ws://ourmemory.online:9990/websocket/' + this.me.openId + '/' + this.me.avatarUrl + '/' + this.me.nickName + '/' + this.data.latitude + '/' + this.data.longitude,
          success: (response) => {
            this.popMessage();
            // this.pushMessage(createSystemMessage(`${enter.nickName}已加入群聊，当前共 ${total} 人`));
          }
        });
        wx.onSocketOpen((res) => {
          this.setData({ socketOpen: true});
          var socketMsgQueue = this.data.socketMsgQueue;
          for (let i = 0; i < socketMsgQueue.length; i++) {
            sendSocketMessage(socketMsgQueue[i])
          }
          this.setData({ socketMsgQueue: [] });          
        });

        wx.onSocketMessage((res) => {
          console.log('收到服务器消息');
          console.log(res);
          this.pushMessage(createUserMessage(res.data, this.me, false));          
          // this.pushMessage(createSystemMessage(res.data));          
        });

        wx.onSocketClose(function (res) {
          console.log('WebSocket 已关闭！')
        })

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


    /**
     * 退出聊天室
     */
    quit() {
      wx.onSocketClose(function (res) {
        console.log('WebSocket 已关闭！')
      })
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
      wx.sendSocketMessage({
        data: this.data.inputContent
      })
      var who = this.me;
      this.pushMessage(createUserMessage(this.data.inputContent, who, who.openId === this.me.openId));
      this.setData({ inputContent: '' });
        // // 信道当前不可用
        // if (!this.tunnel || !this.tunnel.isActive()) {
        //     this.pushMessage(createSystemMessage('您还没有加入群聊，请稍后重试'));
        //     if (!this.tunnel || this.tunnel.isClosed()) {
        //         this.enter();
        //     }
        //     return;
        // }

        // setTimeout(() => {
        //     if (this.data.inputContent && this.tunnel) {
        //         this.tunnel.emit('speak', { word: this.data.inputContent });
        //         this.setData({ inputContent: '' });
        //     }
        // });
    },
});
