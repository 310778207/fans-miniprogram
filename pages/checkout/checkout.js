const api = require('../../utils/api')
const cart = require('../../utils/cart')
const address = require('../../utils/address')
const pay = require('../../utils/pay')

Page({
  data: {
    address: null,
    items: [],
    remark: '',
    goodsText: '0.00',
    totalText: '0.00',
    isMockPay: true,
    submitting: false
  },

  onLoad() {
    const g = getApp().globalData
    const items = g.checkoutItems || []
    if (!items.length) {
      wx.showToast({ title: '没有待结算的商品', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1000)
      return
    }
    const totalCents = items.reduce((s, i) => s + Math.round(i.price * 100) * i.quantity, 0)
    this.setData({
      items,
      goodsText: (totalCents / 100).toFixed(2),
      totalText: (totalCents / 100).toFixed(2),
      isMockPay: pay.isMock()
    })
  },

  onShow() {
    // 从地址列表选完回来，刷新选中地址
    const g = getApp().globalData
    if (g.selectedAddressId) {
      this.setData({ address: address.getById(g.selectedAddressId) })
    } else if (!this.data.address) {
      this.setData({ address: address.getDefault() })
    }
  },

  chooseAddress() {
    wx.navigateTo({ url: '/pages/address/list?mode=select' })
  },

  onRemark(e) {
    this.setData({ remark: e.detail.value })
  },

  async onSubmit() {
    if (this.data.submitting) return
    if (!this.data.address) {
      wx.showToast({ title: '请先选择收货地址', icon: 'none' })
      return
    }
    const from = getApp().globalData.checkoutFrom
    const payloadItems = this.data.items.map((i) => ({
      productId: i.productId,
      color: i.color,
      quantity: i.quantity
    }))
    this.setData({ submitting: true })
    let order
    try {
      order = await api.createOrder({
        items: payloadItems,
        address: this.data.address,
        remark: this.data.remark
      })
    } catch (e) {
      this.setData({ submitting: false })
      wx.showModal({ title: '下单失败', content: e.message || '请稍后重试', showCancel: false })
      return
    }

    // 下单成功：购物车模式清掉已结算商品
    if (from === 'cart') cart.clearSelected()

    // 发起支付
    try {
      await pay.pay(order.id)
      wx.showToast({ title: '支付成功', icon: 'success' })
      setTimeout(() => wx.redirectTo({ url: '/pages/orders/orders' }), 800)
    } catch (e) {
      // mock 模式一般不会走到这里；云支付用户取消时订单保留待付款
      wx.showModal({
        title: '支付未完成',
        content: '订单已保留，可在「我的-全部订单」中继续支付',
        showCancel: false,
        success: () => wx.redirectTo({ url: '/pages/orders/orders?status=pending_payment' })
      })
    } finally {
      this.setData({ submitting: false })
      getApp().globalData.checkoutItems = []
      getApp().globalData.checkoutFrom = ''
    }
  }
})
