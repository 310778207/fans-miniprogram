const api = require('../../utils/api')
const config = require('../../config/index')

const STATUS_LABELS = { new: '待跟进', followed: '已跟进', closed: '已关闭' }
const TABS = [
  { key: 'all', label: '全部' },
  { key: 'new', label: '待跟进' },
  { key: 'followed', label: '已跟进' },
  { key: 'closed', label: '已关闭' }
]
const PAGE_SIZE = 20
const VERIFY_KEY = 'admin_verified'

function pad(n) {
  return (n < 10 ? '0' : '') + n
}

function fmtTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return (
    d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
    ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
  )
}

Page({
  data: {
    code: '',
    verified: false,
    tabs: TABS,
    filter: 'all',
    filterLabel: '',
    list: [],
    hasMore: false,
    loading: false
  },

  onLoad() {
    this.setData({
      verified: !!wx.getStorageSync(VERIFY_KEY),
      filterLabel: '全部'
    })
    if (this.data.verified) this.refresh()
  },

  onShow() {
    // 从其它页面回来时刷新（本地模式下询盘可能刚有新增）
    if (this.data.verified && this.data.filter === 'all' && !this.data.list.length) {
      this.refresh()
    }
  },

  onPullDownRefresh() {
    this.refresh().then(() => wx.stopPullDownRefresh())
  },

  /* -------- 密码门 -------- */
  onCodeInput(e) {
    this.setData({ code: e.detail.value })
  },

  onVerify() {
    if (this.data.code === config.adminCode) {
      wx.setStorageSync(VERIFY_KEY, true)
      this.setData({ verified: true })
      this.refresh()
    } else {
      wx.showToast({ title: '密码不正确', icon: 'none' })
    }
  },

  /* -------- 列表 -------- */
  decorate(list) {
    return list.map((x) =>
      Object.assign({}, x, {
        statusLabel: STATUS_LABELS[x.status || 'new'],
        timeText: fmtTime(x.ts)
      })
    )
  },

  async refresh() {
    this.setData({ loading: true })
    try {
      const res = await api.listInquiries({ status: this.data.filter, skip: 0, limit: PAGE_SIZE })
      this.setData({ list: this.decorate(res.list), hasMore: res.hasMore, filterLabel: this.labelOf(this.data.filter) })
    } catch (e) {
      console.error('询盘列表加载失败', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async loadMore() {
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
    this.refresh()
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
      wx.showToast({ title: '更新失败', icon: 'none' })
    }
  },

  callBack(e) {
    wx.makePhoneCall({ phoneNumber: e.currentTarget.dataset.phone })
  },

  copyWechat(e) {
    wx.setClipboardData({
      data: e.currentTarget.dataset.w,
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    })
  }
})
