/**
 * 用户登录/资料模块（微信官方「静默登录 + 资料填写」方案）。
 *
 * - 身份标识：云开发下 openid 由云函数上下文获取（callFunction 自带身份），
 *   前端无需自己调 code2Session；
 * - 头像昵称：getUserProfile 已不再返回真实资料，改由用户在「我的」页通过
 *   button open-type="chooseAvatar" + input type="nickname" 主动填写。
 *
 * 与项目其它模块一致，双模式：
 * - config.useCloud = true ：user 云函数读写 users 集合，头像上传到云存储；
 * - config.useCloud = false：本地演示模式，会话存本地缓存（user_local），
 *   头像用 saveFile 持久化到本机。
 */
const config = require('../config/index')

const SESSION_KEY = 'user_local'
const OPENID_KEY = 'user_openid_local'

// 启动时的静默登录 Promise，页面用它等待「会话恢复完成」
let silentPromise = null

function cloudReady() {
  return !!(config.useCloud && wx.cloud)
}

/* ---------------- 会话缓存 ---------------- */

/** 当前登录资料 { openid, nickname, avatar }，未登录返回 null */
function getProfile() {
  return wx.getStorageSync(SESSION_KEY) || null
}

function isLoggedIn() {
  return !!getProfile()
}

function saveSession(session) {
  wx.setStorageSync(SESSION_KEY, session)
  return session
}

/** 本地模式的设备标识：首次生成后固定，演示里充当 openid */
function localOpenid() {
  let openid = wx.getStorageSync(OPENID_KEY)
  if (!openid) {
    openid = 'local-' + Math.random().toString(36).slice(2, 10)
    wx.setStorageSync(OPENID_KEY, openid)
  }
  return openid
}

/* ---------------- 登录 ---------------- */

/**
 * 登录：云模式调 user 云函数（首次自动注册进 users 集合）；
 * 本地模式直接建立/恢复会话。返回最新资料。
 */
async function login() {
  if (cloudReady()) {
    const res = await wx.cloud.callFunction({
      name: 'user',
      data: { action: 'login' }
    })
    if (res.result && res.result.code !== 0) {
      throw new Error(res.result.msg || '登录失败')
    }
    return saveSession(res.result.user)
  }
  const session = getProfile() || { openid: localOpenid(), nickname: '', avatar: '' }
  return saveSession(session)
}

/**
 * 静默登录：云模式下启动时后台执行，恢复/刷新会话，失败不打扰用户；
 * 本地模式只恢复已有会话（登录应留给用户主动触发）。
 */
function silentLogin() {
  if (silentPromise) return silentPromise
  if (!cloudReady()) {
    silentPromise = Promise.resolve(getProfile())
    return silentPromise
  }
  silentPromise = login().catch(() => getProfile())
  return silentPromise
}

/** 等待启动时的静默登录结束（无论成败），再读缓存即可拿到最新会话 */
function whenReady() {
  return silentPromise || silentLogin()
}

/* ---------------- 资料维护 ---------------- */

/**
 * 头像持久化：
 * - 云模式：上传到云存储 avatars/ 目录，返回 fileID（永久有效，image 可直接渲染）；
 * - 本地模式：chooseAvatar 给的是临时文件，saveFile 持久化，失败则退回临时路径。
 */
async function persistAvatar(tempFilePath) {
  if (!tempFilePath) return ''
  if (cloudReady()) {
    const ext = (String(tempFilePath).match(/\.[a-zA-Z0-9]+$/) || ['.png'])[0]
    const me = getProfile()
    const owner = me && me.openid ? me.openid : 'anonymous'
    const res = await wx.cloud.uploadFile({
      cloudPath: 'avatars/' + owner + '-' + Date.now() + ext,
      filePath: tempFilePath
    })
    return res.fileID
  }
  return new Promise((resolve) => {
    wx.getFileSystemManager().saveFile({
      tempFilePath,
      success: (r) => resolve(r.savedFilePath),
      fail: () => resolve(tempFilePath)
    })
  })
}

/** 更新昵称/头像（本地缓存 + 云端 users 集合），返回更新后的资料 */
async function updateProfile(patch) {
  const data = {}
  if (typeof patch.nickname === 'string') {
    const nickname = patch.nickname.trim().slice(0, 20)
    if (!nickname) throw new Error('昵称不能为空')
    data.nickname = nickname
  }
  if (typeof patch.avatar === 'string' && patch.avatar) {
    data.avatar = patch.avatar
  }
  if (!Object.keys(data).length) return getProfile()

  if (cloudReady()) {
    const res = await wx.cloud.callFunction({
      name: 'user',
      data: Object.assign({ action: 'updateProfile' }, data)
    })
    if (res.result && res.result.code !== 0) {
      throw new Error(res.result.msg || '保存失败')
    }
    return saveSession(res.result.user)
  }
  return saveSession(Object.assign({}, getProfile(), data))
}

/** 退出登录：只清本地会话，云端资料保留（下次登录自动找回） */
function logout() {
  try {
    wx.removeStorageSync(SESSION_KEY)
  } catch (e) {
    // 缓存清理失败不影响主流程
  }
}

module.exports = {
  getProfile,
  isLoggedIn,
  login,
  silentLogin,
  whenReady,
  persistAvatar,
  updateProfile,
  logout
}
