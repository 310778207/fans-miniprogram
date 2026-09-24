Component({
  properties: {
    product: { type: Object, value: {} }
  },
  methods: {
    goDetail() {
      const id = this.data.product.id
      if (!id) return
      const pages = getCurrentPages()
      const cur = pages[pages.length - 1]
      // 详情页内的「猜你喜欢」：用 redirectTo 替换当前页，避免页面栈越叠越深
      if (cur && cur.route && cur.route.indexOf('pages/detail/detail') > -1) {
        wx.redirectTo({ url: '/pages/detail/detail?id=' + id })
      } else {
        wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
      }
    }
  }
})
