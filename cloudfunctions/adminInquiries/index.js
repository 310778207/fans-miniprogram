const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 商家询盘管理云函数（以管理员权限读写 inquiries 集合，绕过集合权限规则，
 * 因此 inquiries 集合可以安全地保持「仅创建者可读写」，普通用户无法拉取他人询盘）。
 *
 * 安全要点：入口先校验管理密码，避免任何用户绕过页面直接调云函数
 * 拉取客户手机号等资料。
 * ★ 修改密码时请同步修改：config/index.js 的 adminCode、
 *   本文件的 ADMIN_CODE、adminOrders 的 ADMIN_CODE，改完重新部署。
 *
 * 入参：
 *  - { action: 'list', adminCode, status, skip, limit } -> { code:0, list, total }
 *  - { action: 'updateStatus', adminCode, id, status }  -> { code:0 }
 */
const ADMIN_CODE = 'QYL1688'
const ALLOWED_STATUS = ['new', 'followed', 'closed']

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
      db.collection('inquiries')
        .where(where)
        .orderBy('createdAt', 'desc')
        .skip(event.skip || 0)
        .limit(Math.min(event.limit || 20, 50))
        .get(),
      db.collection('inquiries').where(where).count()
    ])
    return { code: 0, list: listRes.data, total: countRes.total }
  }

  if (action === 'updateStatus') {
    const { id, status } = event
    if (!id || ALLOWED_STATUS.indexOf(status) === -1) {
      return { code: 1, msg: '参数不合法' }
    }
    await db.collection('inquiries').doc(id).update({
      data: { status, updatedAt: db.serverDate() }
    })
    return { code: 0 }
  }

  return { code: 1, msg: '未知操作' }
}
