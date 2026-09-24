const api = require('../../utils/api')

Page({
  data: {
    categories: [],
    activeId: '',
    products: []
  },

  async onLoad() {
    const categories = await api.getCategories()
    this.setData({ categories })
    // 默认选中第一个分类；若首页带来了指定分类则优先
    const pending = getApp().globalData.pendingCategoryId
    const activeId = pending || (categories[0] && categories[0].id) || ''
    getApp().globalData.pendingCategoryId = ''
    this.setData({ activeId })
    this.loadProducts(activeId)
  },

  onShow() {
    // 从首页「分类宫格」切过来时，选中指定分类
    const pending = getApp().globalData.pendingCategoryId
    if (pending && pending !== this.data.activeId) {
      this.setData({ activeId: pending })
      this.loadProducts(pending)
      getApp().globalData.pendingCategoryId = ''
    }
  },

  async loadProducts(categoryId) {
    const products = await api.getProducts({ categoryId })
    this.setData({ products })
  },

  onSideTap(e) {
    const id = e.currentTarget.dataset.id
    if (id === this.data.activeId) return
    this.setData({ activeId: id })
    this.loadProducts(id)
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/list/list' })
  }
})
