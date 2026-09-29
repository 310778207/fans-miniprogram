const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 用户登录与资料云函数（users 集合，openid 唯一标识一个用户）。
 * 所有读写都以云函数的管理员权限进行，users 集合可以安全地保持
 * 「仅创建者可读写」，用户之间无法互相读取资料。
 *
 * 登录采用微信官方「静默登录 + 资料填写」方案：
 * - openid 通过云函数上下文获取，前端无需维护 code2Session；
 * - 头像昵称由用户通过 button open-type="chooseAvatar" /
 *   input type="nickname" 主动填写（getUserProfile 已不再返回真实资料）。
 *
 * 入参：
 *  - { action: 'login' }                           -> { code:0, user }（首次自动注册）
 *  - { action: 'updateProfile', nickname?, avatar? } -> { code:0, user }
 */
const MAX_NICKNAME = 20

function cleanProfile(doc) {
  // 只返回安全字段，不暴露 _id / 创建时间等内部信息
  return {
    openid: doc.openid,
    nickname: doc.nickname || '',
    avatar: doc.avatar || ''
  }
}

async function findUser(db, openid) {
  const res = await db.collection('users').where({ openid }).limit(1).get()
  return res.data[0] || null
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) return { code: 1, msg: '用户身份获取失败' }

  const db = cloud.database()
  const { action } = event

  if (action === 'login') {
    const exist = await findUser(db, openid)
    if (exist) {
      await db.collection('users').doc(exist._id).update({
        data: { loginAt: db.serverDate() }
      })
      return { code: 0, user: cleanProfile(exist) }
    }
    // 首次登录自动注册（集合不存在则先创建，免去控制台手工建集合）
    try {
      await db.createCollection('users')
    } catch (e) {
      // 集合已存在时创建会报错，忽略即可
    }
    await db.collection('users').add({
      data: {
        openid,
        nickname: '',
        avatar: '',
        createdAt: db.serverDate(),
        loginAt: db.serverDate()
      }
    })
    return { code: 0, user: { openid, nickname: '', avatar: '' } }
  }

  if (action === 'updateProfile') {
    const data = {}
    if (typeof event.nickname === 'string') {
      const nickname = event.nickname.trim()
      if (!nickname) return { code: 1, msg: '昵称不能为空' }
      data.nickname = nickname.slice(0, MAX_NICKNAME)
    }
    if (typeof event.avatar === 'string' && event.avatar) {
      data.avatar = event.avatar.slice(0, 500)
    }
    if (!Object.keys(data).length) return { code: 1, msg: '没有需要更新的内容' }

    const exist = await findUser(db, openid)
    if (!exist) return { code: 1, msg: '请先登录' }
    await db.collection('users').doc(exist._id).update({
      data: Object.assign({ updatedAt: db.serverDate() }, data)
    })
    return { code: 0, user: cleanProfile(Object.assign({}, exist, data)) }
  }

  return { code: 1, msg: '未知操作' }
}
