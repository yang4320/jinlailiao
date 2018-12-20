/**
 * @fileOverview 演示会话服务和 WebSocket 信道服务的使用方式
 */

var config = require('../../config');
var qcloud = require('../../vendor/wafer2-client-sdk/index');
var BASE_URL = config.service.host;
var interval;
const { $Toast } = require('../../vendor/iview/base/index');
var commonUtil = require('../../utils/commonUtil');

// import { postRequest, getRequest } from '../../utils/https';

/**
 * 使用 Page 初始化页面
 */
Page({

    /**
   * 初始数据，
   */
  data: {
      rooms: [],
      // latitude: 0,
      // longitude: 0,
      visible: false,
      roomName: '',
      openId:'',
      pageNumber: 1,
      lastPage: false,
      showPrivilege: false,
        firstShow: true,//页面第一次加载
        okButton: false,
        cancelButton: false,
        focus:false
  },
    getLocationAndMyNearbyRoom: function(){
      let that = this;
        wx.getLocation({
            // type: 'gcj02',
            success: (res) => {
                getApp().globalData.latitude = res.latitude,
                getApp().globalData.longitude =  res.longitude
                that.getMyNearbyRoom();
            },
            fail: () => {
                commonUtil.showOpenSettinModal();
            }
        })
    },

    toCreateNew: function(e) {
        // if(getApp().globalData.session == undefined){
        //     this.setData({ visible: false });
        //     this.setData({ showPrivilege: true });
        // }else{
            // getApp().globalData.session = e.detail.userInfo;
            this.setData({
                visible: !this.data.visible,
                focus: !this.data.focus
            });
        // }
    },
    // closeCreateNewModal: function(){
    //     this.setData({ visible: false });
    // },

    onGotUserInfo: function(e) {
        let that = this;
        if(e.detail.userInfo == undefined){
            commonUtil.showOpenSettinModal();
        }else{
            that.getUserInfoHandle();
            this.setData({ showPrivilege: false });
            that.getLocationAndMyNearbyRoom();
        }
    },

    getUserInfoHandle: function (){
      let that = this;
        wx.getUserInfo({
            success(res){
                console.log(res);
                qcloud.login({
                    success(result) {
                        getApp().globalData.session = result;
                        that.setData({openId: result.openId});
                    }
                });
            }
        });
    },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    that.getSettingsAndGetUserInfo();
    that.getLocationAndMyNearbyRoom();
  },

    getSettingsAndGetUserInfo: function(){
        let that = this
        wx.getSetting({
            success (res) {
                if(res.authSetting['scope.userInfo']){//已经拿到用户授权获取用户信息
                    that.getUserInfoHandle();
                    // that.getLocationAndMyNearbyRoom();
                }else{
                    that.setData({ showPrivilege: true });//显示授权按钮
                }
            }
        })
    },

    getMyNearbyRoom: function(){
      let that = this;
        wx.request({
            url: BASE_URL + '/jinlailiao/room/' + getApp().globalData.longitude + '/' + getApp().globalData.latitude + '/' + that.data.pageNumber,
            method: 'GET',
            success: function (result) {
                let rooms = that.data.rooms;
                // 分页数据增加
                let roomList = rooms.concat(result.data.roomList);
                that.setData({
                    rooms: roomList,
                    pageNumber: parseInt(that.data.pageNumber) + 1,
                    lastPage: result.data.lastPage
                });
            },
            fail: function (err) {
                $Toast({
                    content: '查询失败',
                    type: 'error'
                });
            }
        });
    },

  /**
 * 生命周期函数--监听页面显示
 */
  onShow: function () {
      let that = this;
      if(that.data.firstShow){
          that.setData({firstShow: false})
      }else{
          that.getLocationAndMyNearbyRoom();
          console.log(getApp().globalData.session);
          if(getApp().globalData.session == null) {
              that.setData({ showPrivilege: false });
              that.getSettingsAndGetUserInfo();
          }
      }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    let that = this;
      that.setData({
        pageNumber: 1,
        lastPage: false
    })
      that.getMyNearbyRoom();
      wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
      let that = this;
    if(!that.data.lastPage){
        that.getMyNearbyRoom();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {
      return {
          title: '近来聊',
          imageUrl: 'https://file.iviewui.com/iview-weapp-logo.png'
      };
  },
    changeInputContent(e) {
        this.setData({ roomName: e.detail.value });
    },
    createNew: function(e) {
      let that = this;
      let roomName = this.data.roomName;
      if(roomName.trim() == ''){
          $Toast({
              content: '请输入聊天主题',
              type: 'warning'
          });
          return;
      }
      wx.request({
          url: BASE_URL + '/jinlailiao/room/create',
          data: {
              roomName:roomName.trim(),
              openId: that.data.openId,
              longitude: getApp().globalData.longitude,
              latitude: getApp().globalData.latitude
          },
          method: 'POST',
          header: {
              "Content-Type":"application/json"
          },
          success: function (result) {
              console.log(result);
              if(result.statusCode == 200){
                  interval = setInterval(function(){
                      let navUrl = '../room/room?roomId=' + result.data.id + '&roomName=' +result.data.roomName;

                      if(result.data.roomName != undefined && result.data.id != undefined){
                          clearInterval(interval);
                          wx.navigateTo({
                              url: navUrl
                          })
                      }
                  },200);
              }else {
                  $Toast({
                      content: result.data.message,
                      type: 'warning'
                  });
              }
              //隐藏创建模块
              that.setData({
                  roomName: '',
                  visible: !that.data.visible
              });
          },
          fail: function (err) {
              $Toast({
                  content: '查询失败',
                  type: 'error'
              });

          }
      });
    },


});