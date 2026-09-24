const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 订单状态操作（仅允许订单本人的合法状态流转）：
 *  - cancel          待付款 → 已取消
 *  - confirmReceive  已发货 → 已完成
 * 入参：{ action, id }
 */
exports.main = async (event) => {
  const { action, id } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!id || !openid) return { code: 1, msg: '参数不合法' }

  const db = cloud.database()

  if (action === 'cancel') {
    // where 同时限定 id 和本人，天然校验归属 + 状态
    const res = await db.collection('orders')
      .where({ id, _openid: openid, status: 'pending_payment' })
      .update({ data: { status: 'cancelled', cancelledAt: db.serverDate() } })
    if (!res.stats.updated) return { code: 1, msg: '订单不可取消（可能已支付或非本人订单）' }
    return { code: 0 }
  }

  if (action === 'confirmReceive') {
    const res = await db.collection('orders')
      .where({ id, _openid: openid, status: 'shipped' })
      .update({ data: { status: 'completed', completedAt: db.serverDate() } })
    if (!res.stats.updated) return { code: 1, msg: '当前状态不可确认收货' }
    return { code: 0 }
  }

  return { code: 1, msg: '未知操作' }
}
