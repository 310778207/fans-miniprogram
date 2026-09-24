const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * ★★★ 上线前必填：微信支付商户号（服务商模式下的子商户号 subMchId）。
 * 在「微信支付商户平台」获取，并需在云开发控制台完成「云支付」绑定：
 * 云开发 → 设置 → 微信支付 → 添加商户号。
 */
const SUB_MCH_ID = '请填入你的商户号'

/**
 * 发起微信支付（云开发免鉴权支付通道）。
 * 入参：{ id: 订单号 }
 * 返回：{ code: 0, payment } 其中 payment 直接传给 wx.requestPayment
 */
exports.main = async (event) => {
  const { id } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!id) return { code: 1, msg: '缺少订单号' }
  if (!openid) return { code: 1, msg: '用户身份获取失败' }

  const db = cloud.database()
  const orderRes = await db.collection('orders').where({ id, _openid: openid }).get()
  const order = orderRes.data[0]
  if (!order) return { code: 1, msg: '订单不存在' }
  if (order.status !== 'pending_payment') return { code: 1, msg: '订单状态不支持支付' }

  const totalFee = Math.round(order.totalAmount * 100)
  if (totalFee <= 0) return { code: 1, msg: '订单金额异常' }

  const res = await cloud.cloudPay.unifiedOrder({
    body: '匠心扇坊-商品订单', // 上线前换成你的品牌名（会显示在微信支付收银台）
    outTradeNo: id,
    spbillCreateIp: '127.0.0.1',
    subMchId: SUB_MCH_ID,
    totalFee,
    envId: wxContext.ENV,
    functionName: 'payCallback'
  })

  if (!res || !res.payment) {
    return { code: 1, msg: '支付下单失败，请稍后重试' }
  }
  return { code: 0, payment: res.payment }
}
