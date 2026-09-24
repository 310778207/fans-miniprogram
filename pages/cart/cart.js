const cart = require('../../utils/cart')

Page({
  data: {
    items: [], // 每项带 key = productId|color，便于 WXML 定位
    allSelected: false,
    selectedCount: 0,
    totalText: '0.00'
  },

  onShow() {
    cart.syncBadge()
    this.refresh()
  },

  decorate() {
    return cart.getItems().map((i) =>
      Object.assign({}, i, { key: i.productId + '|' + i.color })
    )
  },

  refresh() {
    const items = this.decorate()
    const selected = items.filter((i) => i.selected)
    this.setData({
      items,
      allSelected: items.length > 0 && selected.length === items.length,
      selectedCount: selected.reduce((s, i) => s + i.quantity, 0),
      totalText: (cart.selectedTotalCents() / 100).toFixed(2)
    })
  },

  toggleSel(e) {
    const { key } = e.currentTarget.dataset
    const [productId, color] = key.split('|')
    const item = this.data.items.find((i) => i.key === key)
    cart.setSelected(productId, color, !item.selected)
    this.refresh()
  },

  toggleAll() {
    cart.setAllSelected(!this.data.allSelected)
    this.refresh()
  },

  onMinus(e) {
    this.changeQty(e, -1)
  },

  onPlus(e) {
    this.changeQty(e, 1)
  },

  changeQty(e, delta) {
    const { key } = e.currentTarget.dataset
    const [productId, color] = key.split('|')
    const item = this.data.items.find((i) => i.key === key)
    if (!item) return
    const next = item.quantity + delta
    if (next < 1) return
    cart.setQuantity(productId, color, next)
    this.refresh()
  },

  onQty(e) {
    const { key } = e.currentTarget.dataset
    const [productId, color] = key.split('|')
    const v = parseInt(e.detail.value, 10)
    if (isNaN(v) || v < 1) {
      this.refresh()
      return
    }
    cart.setQuantity(productId, color, v)
    this.refresh()
  },

  onDelete(e) {
    const { key } = e.currentTarget.dataset
    const [productId, color] = key.split('|')
    wx.showModal({
      title: '移除商品',
      content: '确定把该商品移出购物车吗？',
      success: (res) => {
        if (res.confirm) {
          cart.remove(productId, color)
          this.refresh()
        }
      }
    })
  },

  goCheckout() {
    const selected = cart.selectedItems()
    if (!selected.length) {
      wx.showToast({ title: '请先选择商品', icon: 'none' })
      return
    }
    getApp().globalData.checkoutItems = selected.map((i) => ({
      productId: i.productId,
      name: i.name,
      cover: i.cover,
      color: i.color,
      price: i.price,
      quantity: i.quantity
    }))
    getApp().globalData.checkoutFrom = 'cart'
    wx.navigateTo({ url: '/pages/checkout/checkout' })
  },

  goShopping() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
