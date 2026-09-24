const api = require('../../utils/api')
const pay = require('../../utils/pay')

const STATUS_LABELS = {
  pending_payment: '待付款',
  paid: '待发货',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消'
}

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending_payment', label: '待付款' },
  { key: 'paid', label: '待发货' },
  { key: 'shipped', label: '已发货' },
  { key: 'completed', label: '已完成' }
]

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

Page({
  data: {
    tabs: TABS,
    filter: 'all',
    list: [],
    loading: false
  },

  onLoad(options) {
    const filter = options && options.status ? options.status : 'all'
    this.setData({ filter })
  },

  onShow() {
    // 支付/收货等操作后返回此页都要刷新
    this.refresh()
  },

  onPullDownRefresh() {
    this.refresh().then(() => wx.stopPullDownRefresh())
  },

  decorate(list) {
    return list.map((o) =>
      Object.assign({}, o, {
        statusLabel: STATUS_LABELS[o.status] || o.status,
        totalText: (Math.round(o.totalAmount * 100) / 100).toFixed(2),
        totalQty: o.items.reduce((s, i) => s + i.quantity, 0),
        timeText: fmtTime(o.createdAt)
      })
    )
  },

  async refresh() {
    this.setData({ loading: true })
    try {
      const status = this.data.filter === 'all' ? '' : this.data.filter
      const list = await api.getOrders({ status })
      this.setData({ list: this.decorate(list) })
    } catch (e) {
      console.error('订单加载失败', e)
      wx.showToast({ title: '订单加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onFilter(e) {
    const key = e.currentTarget.dataset.key
    if (key === this.data.filter) return
    this.setData({ filter: key })
    this.refresh()
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/order-detail/order-detail?id=' + e.currentTarget.dataset.id })
  },

  async onPay(e) {
    const id = e.currentTarget.dataset.id
    try {
      await pay.pay(id)
      wx.showToast({ title: '支付成功', icon: 'success' })
      this.refresh()
    } catch (err) {
      wx.showToast({ title: err.message || '支付未完成', icon: 'none' })
    }
  },

  onCancel(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '取消订单',
      content: '确定取消该订单吗？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await api.cancelOrder(id)
          wx.showToast({ title: '已取消', icon: 'success' })
          this.refresh()
        } catch (err) {
          wx.showToast({ title: err.message || '取消失败', icon: 'none' })
        }
      }
    })
  },

  async onReceive(e) {
    const id = e.currentTarget.dataset.id
    try {
      await api.confirmReceive(id)
      wx.showToast({ title: '已确认收货', icon: 'success' })
      this.refresh()
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' })
    }
  }
})
