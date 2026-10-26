Page({
  data: {
    config: require('../../config/index'),
    stats: require('../../data/mock').stats,
    advantages: require('../../data/mock').advantages
  },

  /**
   * 隐藏商家入口：每次点击间隔 1 秒内、累计点满 10 次才进入管理页。
   * 中途不做任何提示，普通用户不会感知；密码由 admin 页的门校验（通过后本地记住）。
   */
  onBrandTap() {
    const now = Date.now()
    this._taps = now - (this._lastTap || 0) < 1000 ? (this._taps || 0) + 1 : 1
    this._lastTap = now
    if (this._taps >= 10) {
      this._taps = 0
      wx.navigateTo({ url: '/pages/admin/admin' })
    }
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
