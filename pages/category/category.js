const api = require('../../utils/api')

const PAGE_SIZE = 30

Page({
  data: {
    categories: [],
    activeId: 'all',
    products: []
  },

  async onLoad() {
    const categories = await api.getCategories()
    // 「全部」对应源站 Products 页，包含未归入分类的新品
    this.setData({ categories: [{ id: 'all', name: '全部' }].concat(categories) })
    // 默认选中第一个分类；若首页带来了指定分类则优先
    const pending = getApp().globalData.pendingCategoryId
    const activeId = pending || 'all'
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
    const all = await api.getProducts({ categoryId })
    this._all = all
    this.setData({ products: all.slice(0, PAGE_SIZE) })
  },

  onLoadMore() {
    if (!this._all || this.data.products.length >= this._all.length) return
    this.setData({
      products: this._all.slice(0, this.data.products.length + PAGE_SIZE)
    })
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
