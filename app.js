const config = require('./config/index')
const api = require('./utils/api')
const cart = require('./utils/cart')
const user = require('./utils/user')

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
    // 云模式下后台静默登录/刷新会话；本地模式仅恢复缓存
    user.silentLogin()
  }
})
