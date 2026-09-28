const api = require('../../utils/api')
const config = require('../../config/index')
const cart = require('../../utils/cart')

Page({
  data: {
    product: null,
    related: [],
    currentIndex: 0,
    viewerVisible: false,
    viewerIndex: 0,
    selectedColor: '',
    quantity: 1,
    minQtyTip: '',
    phone: config.phone
  },

  onLoad(options) {
    this.productId = options.id
  },

  async onShow() {
    const product = await api.getProduct(this.productId)
    if (!product) {
      wx.showToast({ title: '产品不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1200)
      return
    }
    // 起订量：从规格里解析「起订量」，没有则默认 1
    const moq = product.specs && product.specs.find((s) => s.label === '起订量')
    const numMatch = moq ? String(moq.value).match(/(\d+)/) : null
    const minQty = numMatch ? parseInt(numMatch[1], 10) : 1
    this.setData({
      product,
      quantity: minQty,
      minQtyTip: moq ? moq.value : '1 把起',
      selectedColor: (product.colors && product.colors[0]) || ''
    })
    wx.setNavigationBarTitle({ title: product.name.slice(0, 20) || '产品详情' })
    // 相关推荐不阻塞主内容
    api.getRelatedProducts(product).then((related) => this.setData({ related }))
  },

  onSwiperChange(e) {
    this.setData({ currentIndex: e.detail.current })
  },

  // 源站 CDN 有 Referer 防盗链，wx.previewImage 无法带 no-referrer，改用自建查看器
  openViewer() {
    this.setData({ viewerVisible: true, viewerIndex: this.data.currentIndex })
  },

  closeViewer() {
    this.setData({ viewerVisible: false })
  },

  onViewerChange(e) {
    this.setData({ viewerIndex: e.detail.current })
  },

  onColorTap(e) {
    this.setData({ selectedColor: e.currentTarget.dataset.color })
  },

  onQtyMinus() {
    this.setData({ quantity: Math.max(1, this.data.quantity - 1) })
  },

  onQtyPlus() {
    this.setData({ quantity: this.data.quantity + 1 })
  },

  onQtyInput(e) {
    const v = parseInt(e.detail.value, 10)
    this.setData({ quantity: isNaN(v) || v < 1 ? 1 : v })
  },

  callPhone() {
    wx.makePhoneCall({ phoneNumber: this.data.phone })
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  addToCart() {
    const { product, selectedColor, quantity } = this.data
    // 只有产品带颜色 SKU 时才必选（源站产品无颜色规格）
    if (product.colors && product.colors.length && !selectedColor) {
      wx.showToast({ title: '请先选择颜色', icon: 'none' })
      return
    }
    cart.add(product, selectedColor, quantity)
    wx.showToast({ title: '已加入购物车', icon: 'success' })
  },

  buyNow() {
    const { product, selectedColor, quantity } = this.data
    if (product.colors && product.colors.length && !selectedColor) {
      wx.showToast({ title: '请先选择颜色', icon: 'none' })
      return
    }
    getApp().globalData.checkoutItems = [
      {
        productId: product.id,
        name: product.name,
        cover: product.cover,
        color: selectedColor,
        price: product.priceMin,
        quantity
      }
    ]
    getApp().globalData.checkoutFrom = 'buy'
    wx.navigateTo({ url: '/pages/checkout/checkout' })
  },

  goInquiry() {
    const { product, selectedColor, quantity } = this.data
    const extra = selectedColor ? '（颜色：' + selectedColor + '，数量：' + quantity + '）' : ''
    // 询盘页是 tabBar 页面，通过 globalData 带上产品信息
    getApp().globalData.pendingInquiryProduct = product.name + extra
    wx.switchTab({ url: '/pages/contact/contact' })
  },

  onShareAppMessage() {
    const p = this.data.product
    return {
      title: p.name,
      path: '/pages/detail/detail?id=' + p.id,
      imageUrl: p.cover
    }
  }
})
