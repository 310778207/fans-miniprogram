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
    this.setupDatabase()
  },

  // 临时：首次初始化云数据库（建集合 + 导入产品/分类/轮播），
  // 循环调用 setupDB 云函数直到导入完成。数据库建好后把 config.runDbSetup 改为 false 即可跳过。
  async setupDatabase() {
    if (!config.runDbSetup || !wx.cloud) return
    try {
      let last = null
      for (let i = 0; i < 20; i++) {
        const res = await wx.cloud.callFunction({ name: 'setupDB' })
        last = res.result
        console.log('[setupDB] 进度：', last)
        if (last && last.finished) break
      }
      const done = last && last.finished
      const brief = last
        ? Object.keys(last.progress || {})
            .map((k) => k + ' ' + last.progress[k].total + '/' + last.progress[k].imported)
            .join('，')
        : '无返回'
      wx.showModal({
        title: done ? '数据库初始化完成' : '初始化未完成，请再编译一次',
        content: (done ? '已就绪：' : '') + brief + '（详情见控制台日志）',
        showCancel: false
      })
    } catch (err) {
      console.error('[setupDB] 失败：', err)
      wx.showModal({
        title: '数据库初始化失败',
        content:
          (err.errMsg || err.message || String(err)) +
          '。多半是 setupDB 云函数还没部署：右键 cloudfunctions/setupDB → 上传并部署：云端安装依赖。',
        showCancel: false
      })
    }
  }
})
