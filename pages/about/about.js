Page({
  data: {
    config: require('../../config/index'),
    stats: require('../../data/mock').stats,
    advantages: require('../../data/mock').advantages
  },

  callPhone() {
    wx.makePhoneCall({ phoneNumber: this.data.config.phone })
  },

  copyWechat() {
    wx.setClipboardData({
      data: this.data.config.wechatId,
      success: () => wx.showToast({ title: '微信号已复制', icon: 'success' })
    })
  },

  copyEmail() {
    wx.setClipboardData({
      data: this.data.config.email,
      success: () => wx.showToast({ title: '邮箱已复制', icon: 'success' })
    })
  },

  onShareAppMessage() {
    return {
      title: this.data.config.brand + ' - ' + this.data.config.slogan,
      path: '/pages/index/index'
    }
  }
})
