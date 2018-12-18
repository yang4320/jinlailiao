function showOpenSettinModal(){
    wx.showModal({
        title: '打开设置页面？',
        content: '需要获取用户信息权限，点击确认。前往设置或退出程序？',
        success (res) {
            if (res.confirm) {
                wx.openSetting({})
            } else if (res.cancel) {
                wx.showModal({
                    title: '',
                    content: '没有得到授权，您在使用过程中，某些功能会受限。点击右上角设置可以重新授权',
                    showCancel: false
                })
            }
        }
    })
}

//计算两个经纬度之间的距离
// 方法定义 lat,lng
function getDistance( lat1,  lng1,  lat2,  lng2){
    var radLat1 = lat1*Math.PI / 180.0;
    var radLat2 = lat2*Math.PI / 180.0;
    var a = radLat1 - radLat2;
    var  b = lng1*Math.PI / 180.0 - lng2*Math.PI / 180.0;
    var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a/2),2) +
        Math.cos(radLat1)*Math.cos(radLat2)*Math.pow(Math.sin(b/2),2)));
    s = s *6378.137 ;// EARTH_RADIUS;
    s = Math.round(s * 10000) / 10000;

    //单位转换
    let distance = Math.round(s);
    if(distance < 1000){
        return distance + '米';
    }else {
        return (distance / 1000).toFixed(1) + '千米';//保留一位小数
    }
}

module.exports = {
    showOpenSettinModal: showOpenSettinModal,
    getDistance: getDistance
};