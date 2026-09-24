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
  useCloud: false,
  cloudEnv: '',

  // 商家询盘管理入口的访问密码（关于页底部「商家入口」进入），上线前改成自己的
  adminCode: '888888',

  // 在线支付模式：
  // 'mock'  = 模拟支付（开发/演示用，不真扣款，可跑通完整下单流程）；
  // 'cloud' = 微信云开发支付（需：开通云开发 + 绑定微信支付商户号，
  //           并在 cloudfunctions/payOrder/index.js 里填 SUB_MCH_ID）
  payment: {
    mode: 'mock'
  }
}
