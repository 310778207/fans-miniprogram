const api = require('../../utils/api')

Page({
  data: {
    config: getApp().globalData.config,
    banners: [],
    categories: [],
    hot: [],
    fresh: [],
    intro: ''
  },

  onLoad() {
    this.loadData()
  },

  async loadData() {
    try {
      const data = await api.getHomeData()
      this.setData(data)
    } catch (e) {
      console.error('首页数据加载失败', e)
      wx.showToast({ title: '数据加载失败', icon: 'none' })
    }
  },

  onBannerTap(e) {
    const link = e.currentTarget.dataset.link
    if (link) wx.navigateTo({ url: link })
  },

  goCategory(e) {
    // 通过 globalData 把要选中的分类带给 tab 页（tab 页 onShow 时消费）
    getApp().globalData.pendingCategoryId = e.currentTarget.dataset.id
    wx.switchTab({ url: '/pages/category/category' })
  },

  goMore(e) {
    const type = e.currentTarget.dataset.type
    wx.navigateTo({ url: '/pages/list/list?type=' + type })
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id })
  },

  goAbout() {
    // 关于页已不是 tab 页（tabBar 改为五栏：首页/产品/询盘/购物车/我的）
    wx.navigateTo({ url: '/pages/about/about' })
  },

  onShareAppMessage() {
    return {
      title: this.data.config.brand + ' - ' + this.data.config.slogan,
      path: '/pages/index/index'
    }
  }
})
