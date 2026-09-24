const api = require('../../utils/api')

const TYPE_TITLES = { hot: '热销推荐', new: '新品上架' }

Page({
  data: {
    keyword: '',
    products: [],
    tip: '',
    autoFocus: false
  },

  options: null,

  onLoad(options) {
    this.options = options || {}
    const type = this.options.type
    if (type) {
      wx.setNavigationBarTitle({ title: TYPE_TITLES[type] || '产品列表' })
      this.search({ hot: type === 'hot', isNew: type === 'new' })
    } else if (this.options.categoryId) {
      this.search({ categoryId: this.options.categoryId })
    } else {
      this.setData({ autoFocus: true })
    }
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  onClear() {
    this.setData({ keyword: '' })
    this.search()
  },

  onSearch() {
    this.search({ keyword: this.data.keyword.trim() })
  },

  async search(opt) {
    opt = opt || {}
    const products = await api.getProducts(opt)
    let tip = ''
    if (opt.keyword) tip = '关键词「' + opt.keyword + '」共 ' + products.length + ' 个结果'
    this.setData({ products, tip })
  }
})
