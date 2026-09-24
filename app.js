const config = require('./config/index')
const api = require('./utils/api')
const cart = require('./utils/cart')

App({
  globalData: {
    config,
    // 跨页传递：待选分类 / 待询盘产品 / 待结算商品 / 已选地址
    pendingCategoryId: '',
    pendingInquiryProduct: '',
    checkoutItems: [],
    checkoutFrom: '',
    selectedAddressId: ''
  },
  onLaunch() {
    api.init()
    cart.syncBadge()
  }
})
