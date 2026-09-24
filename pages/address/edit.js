const address = require('../../utils/address')

const EMPTY = { id: '', name: '', phone: '', region: '', detail: '', isDefault: false }

Page({
  data: {
    form: Object.assign({}, EMPTY)
  },

  onLoad(options) {
    if (options.id) {
      const found = address.getById(options.id)
      if (found) this.setData({ form: Object.assign({}, EMPTY, found) })
    }
  },

  onField(e) {
    this.setData({ ['form.' + e.currentTarget.dataset.field]: e.detail.value })
  },

  onRegion(e) {
    this.setData({ 'form.region': e.detail.value.join(' ') })
  },

  onDefaultChange(e) {
    this.setData({ 'form.isDefault': e.detail.value })
  },

  onSave() {
    const err = address.validate(this.data.form)
    if (err) {
      wx.showToast({ title: err, icon: 'none' })
      return
    }
    address.upsert(this.data.form)
    wx.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 600)
  },

  onDelete() {
    wx.showModal({
      title: '删除地址',
      content: '确定删除该收货地址吗？',
      success: (res) => {
        if (res.confirm) {
          address.removeById(this.data.form.id)
          wx.navigateBack()
        }
      }
    })
  }
})
