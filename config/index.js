/**
 * 全局配置：上线前把这里替换成你自己的信息。
 */
module.exports = {
  brand: '匠心扇坊',
  slogan: '匠心手扇 · 厂家直供',
  phone: '400-000-0000', // 客服电话（小程序里展示并可直接拨打）
  email: 'hello@example.com', // 商务邮箱
  wechatId: 'your-wechat-id', // 微信号（展示给客户复制添加）
  address: 'XX省XX市XX区XX路XX号',
  workTime: '周一至周六 9:00 - 18:00',
  intro:
    '我们是一家专注手工扇研发与生产的源头厂家，主营木扇、竹扇、塑料扇、大扇、蕾丝扇等婚庆、舞台、节庆用品，支持来图来样定制，现货批发，欢迎合作。',

  // 数据源开关：
  // false（默认）= 使用 data/mock.js 本地示例数据，无需后台即可跑通；
  // true = 走微信云开发（需在开发者工具开通云开发，并填入环境 ID）。
  useCloud: true,
  cloudEnv: 'cloud1-d3gz1cddr77f01eea',

  // 商家管理入口的访问密码（品牌介绍页连点顶部品牌名 10 次唤出，界面上无可见入口）。
  // ★ 改密码须三处同步：本文件 + adminInquiries / adminOrders 云函数的 ADMIN_CODE，
  //   云函数改完要重新部署
  adminCode: 'QYL1688',

  // 临时开关：true = 启动时自动调用 setupDB 云函数（建集合+导入演示数据）。
  // 数据库建好后（弹窗提示初始化完成）改回 false。
  runDbSetup: true,

  // 在线支付模式：
  // 'mock'  = 模拟支付（开发/演示用，不真扣款，可跑通完整下单流程）；
  // 'cloud' = 微信云开发支付（需：开通云开发 + 绑定微信支付商户号，
  //           并在 cloudfunctions/payOrder/index.js 里填 SUB_MCH_ID）
  // ★ 云模式下支付实际由 payOrder 云函数控制：切换模式时需同步改该函数的
  //   MOCK_PAY（mock=true / cloud=false）并重新部署，否则支付链路对不上
  payment: {
    mode: 'mock'
  }
}
