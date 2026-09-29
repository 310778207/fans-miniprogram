const api = require('../../utils/api')
const config = require('../../config/index')
const user = require('../../utils/user')

Page({
  data: {
    config,
    user: null, // 登录后：{ openid, nickname, avatar }
    editingName: false,
    counts: { pending: 0, paid: 0, shipped: 0 }
  },

  onShow() {
    this.refreshUser()
    this.refreshCounts()
  },

  /** 等启动时的静默登录结束后读取会话，避免拿到旧缓存 */
  async refreshUser() {
    try {
      await user.whenReady()
    } catch (e) {
      // 静默登录失败不阻塞页面
    }
    this.setData({ user: user.getProfile() })
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

  /* ---------------- 登录 / 资料 ---------------- */

  onHeadTap() {
    if (!this.data.user) this.doLogin()
  },

  async doLogin() {
    wx.showLoading({ title: '登录中', mask: true })
    let profile
    try {
      profile = await user.login()
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: e.message || '登录失败，请重试', icon: 'none' })
      return
    }
    // 先收 loading 再弹 toast：部分机型 hideLoading 会连带关掉 toast
    wx.hideLoading()
    this.setData({ user: profile })
    wx.showToast({ title: '登录成功', icon: 'success' })
    // 首次登录引导完善昵称
    if (!profile.nickname) this.setData({ editingName: true })
  },

  /** 微信头像填写能力：chooseAvatar 返回临时文件，先持久化再保存资料 */
  async onChooseAvatar(e) {
    if (!this.data.user) return
    wx.showLoading({ title: '保存中', mask: true })
    try {
      const avatar = await user.persistAvatar(e.detail.avatarUrl)
      const profile = await user.updateProfile({ avatar })
      wx.hideLoading()
      this.setData({ user: profile })
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '头像保存失败', icon: 'none' })
    }
  },

  startEditName() {
    if (!this.data.user) return
    this.setData({ editingName: true })
  },

  onNameBlur(e) {
    this.commitName(e.detail.value)
  },

  onNameConfirm(e) {
    this.commitName(e.detail.value)
  },

  async commitName(raw) {
    if (this._nameCommiting) return
    const nickname = String(raw || '').trim()
    if (!nickname || nickname === this.data.user.nickname) {
      this.setData({ editingName: false })
      return
    }
    this._nameCommiting = true
    try {
      const profile = await user.updateProfile({ nickname })
      this.setData({ user: profile, editingName: false })
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (e) {
      wx.showToast({ title: e.message || '保存失败', icon: 'none' })
    } finally {
      this._nameCommiting = false
    }
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      success: (r) => {
        if (!r.confirm) return
        user.logout()
        this.setData({ user: null, editingName: false })
      }
    })
  },

  /* ---------------- 页面跳转 ---------------- */

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
