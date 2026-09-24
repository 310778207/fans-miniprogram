const api = require('../../utils/api')
const config = require('../../config/index')

const EMPTY_FORM = {
  productName: '',
  name: '',
  phone: '',
  wechat: '',
  email: '',
  message: ''
}

Page({
  data: {
    config,
    form: Object.assign({}, EMPTY_FORM),
    submitting: false
  },

  onShow() {
    // 从产品详情「立即询盘」切过来时，带上产品信息
    const pending = getApp().globalData.pendingInquiryProduct
    if (pending) {
      getApp().globalData.pendingInquiryProduct = ''
      this.setData({ 'form.productName': pending })
    }
  },

  clearProduct() {
    this.setData({ 'form.productName': '' })
  },

  onField(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail.value })
  },

  validate() {
    const f = this.data.form
    if (!f.name.trim()) return '请填写联系人'
    if (!/^1[3-9]\d{9}$/.test(f.phone.trim())) return '请填写正确的手机号'
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return '邮箱格式不正确'
    if (f.message.trim().length < 5) return '请简单描述一下需求（至少 5 个字）'
    return ''
  },

  async onSubmit() {
    if (this.data.submitting) return
    const err = this.validate()
    if (err) {
      wx.showToast({ title: err, icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    try {
      await api.submitInquiry(this.data.form)
      wx.showModal({
        title: '提交成功',
        content: '已收到您的询盘，我们会尽快与您联系。也可直接电话联系：' + config.phone,
        showCancel: false,
        confirmText: '知道了'
      })
      this.setData({ form: Object.assign({}, EMPTY_FORM) })
    } catch (e) {
      console.error('询盘提交失败', e)
      wx.showModal({
        title: '提交失败',
        content: '网络开小差了，您可以直接拨打 ' + config.phone + ' 联系我们',
        showCancel: false
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  callPhone() {
    wx.makePhoneCall({ phoneNumber: config.phone })
  },

  copyWechat() {
    wx.setClipboardData({
      data: config.wechatId,
      success: () => wx.showToast({ title: '微信号已复制', icon: 'success' })
    })
  },

  copyEmail() {
    wx.setClipboardData({
      data: config.email,
      success: () => wx.showToast({ title: '邮箱已复制', icon: 'success' })
    })
  },

  onShareAppMessage() {
    return {
      title: config.brand + ' - ' + config.slogan,
      path: '/pages/contact/contact'
    }
  }
})
