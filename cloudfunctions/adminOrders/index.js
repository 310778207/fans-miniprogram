const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 商家订单管理云函数（以管理员权限读写 orders 集合，绕过集合权限规则，
 * 商家可以看到全部买家的订单并执行发货）。
 *
 * 安全要点：入口先校验管理密码，避免任何用户绕过页面直接调云函数
 * 拖走买家姓名/电话/地址。
 *
 * ★ 修改密码时请同步修改：config/index.js 的 adminCode、
 *   本文件的 ADMIN_CODE、adminInquiries 的 ADMIN_CODE，改完重新部署。
 *
 * 入参：
 *  - { action: 'list', adminCode, status, skip, limit } -> { code:0, list, total }
 *  - { action: 'ship', adminCode, id, trackingNo }      -> { code:0 }
 *    「待发货」订单 → 「已发货」，trackingNo 为快递单号（≤64 字符，可空）
 */
const ADMIN_CODE = 'QYL1688'

exports.main = async (event) => {
  if (!event.adminCode || event.adminCode !== ADMIN_CODE) {
    return { code: 1, msg: '管理密码不正确' }
  }

  const db = cloud.database()
  const { action } = event

  if (action === 'list') {
    const where = {}
    if (event.status && event.status !== 'all') {
      where.status = event.status
    }
    const [listRes, countRes] = await Promise.all([
      db.collection('orders')
        .where(where)
        .orderBy('createdAt', 'desc')
        .skip(event.skip || 0)
        .limit(Math.min(event.limit || 20, 50))
        .get(),
      db.collection('orders').where(where).count()
    ])
    return { code: 0, list: listRes.data, total: countRes.total }
  }

  if (action === 'ship') {
    const { id } = event
    const trackingNo = String(event.trackingNo || '').trim().slice(0, 64)
    if (!id) return { code: 1, msg: '参数不合法' }
    // where 同时限定订单号与状态，天然防重复发货/误改非待发货订单
    const data = { status: 'shipped', shippedAt: db.serverDate() }
    if (trackingNo) data.trackingNo = trackingNo
    const res = await db.collection('orders')
      .where({ id, status: 'paid' })
      .update({ data })
    if (!res.stats.updated) return { code: 1, msg: '仅「待发货」订单可以发货' }
    return { code: 0 }
  }

  return { code: 1, msg: '未知操作' }
}
