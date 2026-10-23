const api = require('../../utils/api')
const config = require('../../config/index')

const STATUS_LABELS = { new: '待跟进', followed: '已跟进', closed: '已关闭' }
const TABS = [
  { key: 'all', label: '全部' },
  { key: 'new', label: '待跟进' },
  { key: 'followed', label: '已跟进' },
  { key: 'closed', label: '已关闭' }
]

const ORDER_STATUS_LABELS = {
  pending_payment: '待付款',
  paid: '待发货',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消'
}
const ORDER_STATUS_CLS = {
  pending_payment: 'os-pending',
  paid: 'os-paid',
  shipped: 'os-shipped',
  completed: 'os-completed',
  cancelled: 'os-cancelled'
}
const ORDER_TABS = [
  { key: 'paid', label: '待发货' },
  { key: 'shipped', label: '已发货' },
  { key: 'all', label: '全部' },
  { key: 'pending_payment', label: '待付款' },
  { key: 'completed', label: '已完成' }
]
const PAGE_SIZE = 20
const VERIFY_KEY = 'admin_verified'

function pad(n) {
  return (n < 10 ? '0' : '') + n
}

// 兼容本地时间戳 / Date / ISO 字符串 / 云函数序列化后的 {$date}
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
    code: '',
    verified: false,
    section: 'inquiry',
    // 询盘板块
    tabs: TABS,
    filter: 'all',
    filterLabel: '全部',
    list: [],
    hasMore: false,
    loading: false,
    // 订单板块（默认筛「待发货」，运营进来最常处理的就是它）
    orderTabs: ORDER_TABS,
    orderFilter: 'paid',
    orderFilterLabel: '待发货',
    orders: [],
    orderHasMore: false,
    orderLoading: false
  },

  onLoad() {
    this.setData({
      verified: !!wx.getStorageSync(VERIFY_KEY),
      filterLabel: '全部'
    })
    if (this.data.verified) this.refreshInquiries()
  },

  onShow() {
    if (!this.data.verified) return
    if (this.data.section === 'inquiry') {
      // 从其它页面回来时刷新（本地模式下询盘可能刚有新增）
      if (this.data.filter === 'all' && !this.data.list.length) this.refreshInquiries()
    } else if (!this.data.orders.length) {
      this.refreshOrders()
    }
  },

  onPullDownRefresh() {
    const p = this.data.section === 'inquiry' ? this.refreshInquiries() : this.refreshOrders()
    p.then(() => wx.stopPullDownRefresh())
  },

  /* -------- 密码门 -------- */
  onCodeInput(e) {
    this.setData({ code: e.detail.value })
  },

  onVerify() {
    if (this.data.code === config.adminCode) {
      wx.setStorageSync(VERIFY_KEY, true)
      this.setData({ verified: true })
      this.refreshInquiries()
    } else {
      wx.showToast({ title: '密码不正确', icon: 'none' })
    }
  },

  /* -------- 板块切换 -------- */
  onSection(e) {
    const section = e.currentTarget.dataset.section
    if (section === this.data.section) return
    this.setData({ section })
    if (section === 'order' && !this.data.orders.length) this.refreshOrders()
  },

  /* -------- 询盘列表 -------- */
  decorate(list) {
    return list.map((x) =>
      Object.assign({}, x, {
        statusLabel: STATUS_LABELS[x.status || 'new'],
        timeText: fmtTime(x.ts || x.createdAt)
      })
    )
  },

  async refreshInquiries() {
    this.setData({ loading: true })
    try {
      const res = await api.listInquiries({ status: this.data.filter, skip: 0, limit: PAGE_SIZE })
      this.setData({ list: this.decorate(res.list), hasMore: res.hasMore, filterLabel: this.labelOf(this.data.filter) })
    } catch (e) {
      console.error('询盘列表加载失败', e)
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async loadMoreInquiries() {
    if (this.data.loading || !this.data.hasMore) return
    this.setData({ loading: true })
    try {
      const res = await api.listInquiries({
        status: this.data.filter,
        skip: this.data.list.length,
        limit: PAGE_SIZE
      })
      this.setData({
        list: this.data.list.concat(this.decorate(res.list)),
        hasMore: res.hasMore
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  labelOf(key) {
    const t = TABS.find((x) => x.key === key)
    return t ? t.label : ''
  },

  onFilter(e) {
    const key = e.currentTarget.dataset.key
    if (key === this.data.filter) return
    this.setData({ filter: key })
    this.refreshInquiries()
  },

  /* -------- 订单列表 -------- */
  decorateOrders(list) {
    return list.map((o) => {
      const first = o.items && o.items[0]
      const name = first ? first.name : ''
      const brief = name.length > 16 ? name.slice(0, 16) + '…' : name
      const totalQty = (o.items || []).reduce((s, i) => s + i.quantity, 0)
      const itemsText = o.items.length === 1
        ? brief + ' ×' + first.quantity
        : brief + ' 等' + o.items.length + ' 种 · 共' + totalQty + ' 件'
      return Object.assign({}, o, {
        statusLabel: ORDER_STATUS_LABELS[o.status] || o.status,
        statusCls: ORDER_STATUS_CLS[o.status] || 'os-pending',
        totalText: (Math.round((o.totalAmount || 0) * 100) / 100).toFixed(2),
        itemsText,
        timeText: fmtTime(o.createdAt)
      })
    })
  },

  async refreshOrders() {
    this.setData({ orderLoading: true })
    try {
      const res = await api.adminListOrders({ status: this.data.orderFilter, skip: 0, limit: PAGE_SIZE })
      const labelItem = ORDER_TABS.find((x) => x.key === this.data.orderFilter)
      this.setData({
        orders: this.decorateOrders(res.list),
        orderHasMore: res.hasMore,
        orderFilterLabel: labelItem ? labelItem.label : ''
      })
    } catch (e) {
      console.error('订单列表加载失败', e)
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    } finally {
      this.setData({ orderLoading: false })
    }
  },

  async loadMoreOrders() {
    if (this.data.orderLoading || !this.data.orderHasMore) return
    this.setData({ orderLoading: true })
    try {
      const res = await api.adminListOrders({
        status: this.data.orderFilter,
        skip: this.data.orders.length,
        limit: PAGE_SIZE
      })
      this.setData({
        orders: this.data.orders.concat(this.decorateOrders(res.list)),
        orderHasMore: res.hasMore
      })
    } finally {
      this.setData({ orderLoading: false })
    }
  },

  onOrderFilter(e) {
    const key = e.currentTarget.dataset.key
    if (key === this.data.orderFilter) return
    this.setData({ orderFilter: key })
    this.refreshOrders()
  },

  /* -------- 操作 -------- */
  async setStatus(e) {
    const { id, status } = e.currentTarget.dataset
    try {
      await api.updateInquiryStatus(id, status)
      // 本地更新，避免整列表刷新跳动
      const list = this.data.list.map((x) =>
        x.id === id ? Object.assign({}, x, { status, statusLabel: STATUS_LABELS[status] }) : x
      )
      this.setData({ list })
      wx.showToast({ title: '已更新', icon: 'success' })
    } catch (err) {
      console.error('状态更新失败', err)
      wx.showToast({ title: err.message || '更新失败', icon: 'none' })
    }
  },

  /** 发货：弹窗录入快递单号（必填），把「待发货」置为「已发货」 */
  onShip(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '订单发货',
      editable: true,
      placeholderText: '请输入快递单号',
      confirmText: '发货',
      success: async (res) => {
        if (!res.confirm) return
        const trackingNo = String(res.content || '').trim()
        if (!trackingNo) {
          wx.showToast({ title: '请填写快递单号', icon: 'none' })
          return
        }
        try {
          await api.adminShipOrder(id, trackingNo)
          wx.showToast({ title: '已发货', icon: 'success' })
          if (this.data.orderFilter === 'paid') {
            // 「待发货」筛选下，发货后直接移出列表
            this.setData({ orders: this.data.orders.filter((o) => o.id !== id) })
          } else {
            this.setData({
              orders: this.data.orders.map((o) =>
                o.id === id
                  ? Object.assign({}, o, {
                      status: 'shipped',
                      statusLabel: '已发货',
                      statusCls: 'os-shipped',
                      trackingNo
                    })
                  : o
              )
            })
          }
        } catch (err) {
          console.error('发货失败', err)
          wx.showToast({ title: err.message || '发货失败', icon: 'none' })
        }
      }
    })
  },

  copyTracking(e) {
    wx.setClipboardData({
      data: e.currentTarget.dataset.no,
      success: () => wx.showToast({ title: '单号已复制', icon: 'success' })
    })
  },

  copyOrderNo(e) {
    wx.setClipboardData({
      data: e.currentTarget.dataset.no,
      success: () => wx.showToast({ title: '订单号已复制', icon: 'success' })
    })
  },

  callBack(e) {
    wx.makePhoneCall({ phoneNumber: e.currentTarget.dataset.phone })
  },

  callBuyer(e) {
    wx.makePhoneCall({ phoneNumber: e.currentTarget.dataset.phone })
  },

  copyWechat(e) {
    wx.setClipboardData({
      data: e.currentTarget.dataset.w,
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    })
  }
})
