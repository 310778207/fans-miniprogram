const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 买家订单操作（仅允许订单本人的合法状态流转）：
 *  - list           本人订单列表（可按 status 过滤，按 createdAt 倒序）
 *  - cancel         待付款 → 已取消
 *  - confirmReceive 已发货 → 已完成
 * 入参：{ action: 'list', status } 或 { action, id }
 *
 * 订单列表走云函数而不是小程序端直查集合：小程序端单次 get 最多返回
 * 20 条（云函数端可取 100），直查会导致老订单被静默截断。
 */
exports.main = async (event) => {
  const { action } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) return { code: 1, msg: '参数不合法' }

  const db = cloud.database()

  if (action === 'list') {
    const where = { _openid: openid }
    if (event.status) where.status = event.status
    const res = await db.collection('orders')
      .where(where)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get()
    return { code: 0, list: res.data }
  }

  const { id } = event
  if (!id) return { code: 1, msg: '参数不合法' }

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
