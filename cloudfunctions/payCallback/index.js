const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 微信支付结果回调（由 cloudPay.unifiedOrder 的 functionName 指定）。
 * 支付成功后把订单置为已支付。此函数由微信支付系统调用，小程序端不会直接调它。
 * 必须返回 { errcode: 0 } 表示已接收，否则微信会重试通知。
 */
exports.main = async (event) => {
  const { outTradeNo, returnCode, resultCode } = event

  if (returnCode === 'SUCCESS' && resultCode === 'SUCCESS' && outTradeNo) {
    const db = cloud.database()
    // 幂等：只有待付款订单会被更新为已支付
    await db.collection('orders')
      .where({ id: outTradeNo, status: 'pending_payment' })
      .update({
        data: { status: 'paid', paidAt: db.serverDate() }
      })
  }

  return { errcode: 0, errmsg: 'OK' }
}
