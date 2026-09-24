const api = require('../../utils/api')
const pay = require('../../utils/pay')

const STATUS_LABELS = {
  pending_payment: '待付款',
  paid: '待发货',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消'
}

const STATUS_TIPS = {
  pending_payment: '请尽快完成支付，超时未支付订单可能被取消',
  paid: '商家备货中，发货后可回到本页查看物流状态',
  shipped: '商品已发出，请注意查收',
  completed: '交易完成，感谢您的信任',
  cancelled: '订单已取消'
}

function pad(n) {
  return (n < 10 ? '0' : '') + n
}

function fmtTime(t) {
  if (!t) return ''
  if (t && typeof t === 'object' && t.$date) t = t.$date
  const d = t instanceof Date ? t : typeof t === 'string' ? new Date(t) : new Date(Number(t))
  if (isNaN(d.getTime())) return ''
  return (
    d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
    ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
  )
}

function moneyText(v) {
  return (Math.round((v || 0) * 100) / 100).toFixed(2)
}

Page({
  data: {
    order: null,
    statusTip: '',
    canPay: false,
    canCancel: false,
    canReceive: false,
    canMockShip: false,
    paying: false,
    isMockPay: true
  },

  onLoad(options) {
    this.orderId = options.id
    this.setData({ isMockPay: pay.isMock() })
  },

  onShow() {
    this.refresh()
  },

  async refresh() {
    const o = await api.getOrder(this.orderId)
    if (!o) {
      wx.showToast({ title: '订单不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1000)
      return
    }
    const status = o.status
    this.setData({
      order: Object.assign({}, o, {
        statusLabel: STATUS_LABELS[status] || status,
        totalText: moneyText(o.totalAmount),
        shippingText: moneyText(o.shippingFee),
        timeText: fmtTime(o.createdAt),
        paidText: fmtTime(o.paidAt),
        shippedText: fmtTime(o.shippedAt),
        completedText: fmtTime(o.completedAt)
      }),
      statusTip: STATUS_TIPS[status] || '',
      canPay: status === 'pending_payment',
      canCancel: status === 'pending_payment',
      canReceive: status === 'shipped',
      // 演示模式提供「模拟发货」，跑通已发货→确认收货
      canMockShip: this.data.isMockPay && status === 'paid'
    })
  },

  copyNo() {
    wx.setClipboardData({
      data: this.data.order.id,
      success: () => wx.showToast({ title: '订单号已复制', icon: 'success' })
    })
  },

  async onPay() {
    if (this.data.paying) return
    this.setData({ paying: true })
    try {
      await pay.pay(this.data.order.id)
      wx.showToast({ title: '支付成功', icon: 'success' })
      this.refresh()
    } catch (e) {
      wx.showToast({ title: e.message || '支付未完成', icon: 'none' })
    } finally {
      this.setData({ paying: false })
    }
  },

  onCancel() {
    wx.showModal({
      title: '取消订单',
      content: '确定取消该订单吗？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await api.cancelOrder(this.data.order.id)
          wx.showToast({ title: '已取消', icon: 'success' })
          this.refresh()
        } catch (e) {
          wx.showToast({ title: e.message || '取消失败', icon: 'none' })
        }
      }
    })
  },

  async onMockShip() {
    try {
      api.mockShip(this.data.order.id)
      wx.showToast({ title: '已模拟发货', icon: 'success' })
      this.refresh()
    } catch (e) {
      wx.showToast({ title: e.message || '操作失败', icon: 'none' })
    }
  },

  async onReceive() {
    try {
      await api.confirmReceive(this.data.order.id)
      wx.showToast({ title: '已确认收货', icon: 'success' })
      this.refresh()
    } catch (e) {
      wx.showToast({ title: e.message || '操作失败', icon: 'none' })
    }
  }
})
