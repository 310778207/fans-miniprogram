const address = require('../../utils/address')

Page({
  data: {
    list: [],
    mode: 'manage', // manage=管理地址 / select=结算页选地址
    selectedId: ''
  },

  onLoad(options) {
    this.setData({ mode: options.mode || 'manage' })
    if (options.mode === 'select') {
      this.setData({ selectedId: getApp().globalData.selectedAddressId || '' })
    }
  },

  onShow() {
    this.setData({ list: address.getList() })
  },

  onTap(e) {
    if (this.data.mode !== 'select') return
    const id = e.currentTarget.dataset.id
    getApp().globalData.selectedAddressId = id
    wx.navigateBack()
  },

  goEdit(e) {
    wx.navigateTo({ url: '/pages/address/edit?id=' + e.currentTarget.dataset.id })
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/address/edit' })
  }
})
