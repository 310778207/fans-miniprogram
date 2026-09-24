const api = require('../../utils/api')
const config = require('../../config/index')

Page({
  data: {
    config,
    counts: { pending: 0, paid: 0, shipped: 0 }
  },

  onShow() {
    this.refreshCounts()
  },

  async refreshCounts() {
    try {
      const orders = await api.getOrders({})
      const counts = { pending: 0, paid: 0, shipped: 0 }
      orders.forEach((o) => {
        if (o.status === 'pending_payment') counts.pending += 1
        else if (o.status === 'paid') counts.paid += 1
        else if (o.status === 'shipped') counts.shipped += 1
      })
      this.setData({ counts })
    } catch (e) {
      // 计数失败不打扰用户，静默即可
    }
  },

  goOrders(e) {
    const status = e.currentTarget.dataset.status || ''
    wx.navigateTo({
      url: status ? '/pages/orders/orders?status=' + status : '/pages/orders/orders'
    })
  },

  goAddress() {
    wx.navigateTo({ url: '/pages/address/list' })
  },

  goAbout() {
    wx.navigateTo({ url: '/pages/about/about' })
  },

  goAdmin() {
    wx.navigateTo({ url: '/pages/admin/admin' })
  },

  callPhone() {
    wx.makePhoneCall({ phoneNumber: config.phone })
  },

  onShareAppMessage() {
    return {
      title: config.brand + ' - ' + config.slogan,
      path: '/pages/index/index'
    }
  }
})
