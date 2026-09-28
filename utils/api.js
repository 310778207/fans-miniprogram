/**
 * 数据访问层：统一封装产品/分类/询盘的读写。
 *
 * - config.useCloud === false：读写本地示例数据（询盘存本地缓存），零配置可跑通；
 * - config.useCloud === true ：读写云开发数据库（集合：banners/categories/products），
 *   询盘通过云函数 submitInquiry 落库。
 */
const config = require('../config/index')
const mock = require('../data/mock')

function cloudReady() {
  return !!(config.useCloud && wx.cloud)
}

function init() {
  if (cloudReady()) {
    wx.cloud.init({ env: config.cloudEnv || undefined, traceUser: true })
  }
}

function db() {
  return wx.cloud.database()
}

/* ---------------- 首页 ---------------- */
async function getHomeData() {
  if (cloudReady()) {
    const [bannersRes, catsRes, hotRes, newRes] = await Promise.all([
      db().collection('banners').orderBy('sort', 'asc').limit(5).get(),
      db().collection('categories').orderBy('sort', 'asc').limit(8).get(),
      db().collection('products').where({ isHot: true }).limit(4).get(),
      db().collection('products').where({ isNew: true }).limit(6).get()
    ])
    return {
      banners: bannersRes.data,
      categories: catsRes.data,
      hot: hotRes.data,
      fresh: newRes.data,
      intro: config.intro
    }
  }
  return {
    banners: mock.banners,
    categories: mock.categories,
    hot: mock.products.filter((p) => p.isHot),
    fresh: mock.products.filter((p) => p.isNew),
    intro: config.intro
  }
}

/* ---------------- 分类 ---------------- */
async function getCategories() {
  if (cloudReady()) {
    const res = await db().collection('categories').orderBy('sort', 'asc').get()
    return res.data
  }
  return mock.categories
}

/* ---------------- 产品 ---------------- */
function filterProducts(list, opt) {
  opt = opt || {}
  return list.filter((p) => {
    if (opt.categoryId && opt.categoryId !== 'all') {
      // 产品可属多个分类（与源站一致）：categoryIds 为准，categoryId 为首选分类
      const ids = p.categoryIds || (p.categoryId ? [p.categoryId] : [])
      if (ids.indexOf(opt.categoryId) === -1) return false
    }
    if (opt.hot && !p.isHot) return false
    if (opt.isNew && !p.isNew) return false
    if (opt.keyword) {
      const kw = String(opt.keyword).toLowerCase()
      const hay = (p.name + ' ' + (p.desc || '')).toLowerCase()
      if (hay.indexOf(kw) === -1) return false
    }
    return true
  })
}

async function getProducts(opt) {
  if (cloudReady()) {
    let q = db().collection('products')
    const where = {}
    if (opt && opt.categoryId && opt.categoryId !== 'all') where.categoryId = opt.categoryId
    if (opt && opt.hot) where.isHot = true
    if (opt && opt.isNew) where.isNew = true
    if (opt && opt.keyword) {
      // 云数据库关键字检索：用正则做模糊匹配（数据量大时建议换成搜索引擎）
      where.name = db().RegExp({ regexp: String(opt.keyword).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), options: 'i' })
    }
    q = q.where(where)
    const res = await q.limit(50).get()
    return res.data
  }
  return filterProducts(mock.products, opt)
}

async function getProduct(id) {
  if (cloudReady()) {
    const res = await db().collection('products').where({ id }).get()
    return res.data[0] || null
  }
  return mock.products.find((p) => p.id === id) || null
}

/* ---------------- 相关推荐（详情页「猜你喜欢」） ---------------- */
async function getRelatedProducts(product) {
  const LIMIT = 6
  if (cloudReady()) {
    const res = await db().collection('products')
      .where({ categoryId: product.categoryId })
      .limit(LIMIT + 1)
      .get()
    let list = res.data.filter((p) => p.id !== product.id)
    if (list.length < 3) {
      const hot = await db().collection('products').where({ isHot: true }).limit(LIMIT + 1).get()
      const seen = new Set(list.map((p) => p.id))
      seen.add(product.id)
      list = list.concat(hot.data.filter((p) => !seen.has(p.id)))
    }
    return list.slice(0, LIMIT)
  }
  // 本地模式：优先同首选分类，再按多分类交集补齐，最后兜底热销
  const catId = product.categoryId
  const inCat = (p) => (p.categoryIds || []).indexOf(catId) !== -1
  const same = catId
    ? mock.products.filter((p) => p.id !== product.id && inCat(p))
    : []
  if (same.length >= 3) return same.slice(0, LIMIT)
  const extra = mock.products.filter(
    (p) => p.isHot && p.id !== product.id && same.indexOf(p) === -1
  )
  return same.concat(extra).slice(0, LIMIT)
}

/* ---------------- 询盘 ---------------- */
async function submitInquiry(form) {
  const payload = {
    name: form.name,
    phone: form.phone,
    wechat: form.wechat || '',
    email: form.email || '',
    message: form.message,
    productName: form.productName || '',
    from: 'miniprogram'
  }
  if (cloudReady()) {
    const res = await wx.cloud.callFunction({
      name: 'submitInquiry',
      data: payload
    })
    if (res.result && res.result.code !== 0) {
      throw new Error(res.result.msg || '提交失败')
    }
    return res.result
  }
  // 本地演示模式：存到本地缓存（开发期间在【缓存-storage】里可查看）
  const key = 'inquiries_local'
  const list = wx.getStorageSync(key) || []
  const record = Object.assign(
    { id: 'local-' + Date.now(), status: 'new', createdAt: Date.now() },
    payload
  )
  list.unshift(record)
  wx.setStorageSync(key, list)
  return { code: 0, id: record.id }
}

/* ---------------- 询盘管理（商家端） ---------------- */
const INQUIRY_STATUSES = ['new', 'followed', 'closed']

function normalizeInquiry(item) {
  // createdAt 兼容：本地时间戳 / Date / ISO 字符串 / 云函数序列化后的 {$date}
  let t = item.createdAt
  if (t && typeof t === 'object' && t.$date) t = t.$date
  const ts = t instanceof Date ? t.getTime() : typeof t === 'string' ? new Date(t).getTime() : Number(t) || 0
  return Object.assign({}, item, { ts })
}

async function listInquiries(opt) {
  opt = opt || {}
  const status = opt.status || 'all'
  const skip = opt.skip || 0
  const limit = opt.limit || 20
  if (cloudReady()) {
    const res = await wx.cloud.callFunction({
      name: 'adminInquiries',
      data: { action: 'list', status, skip, limit }
    })
    if (res.result && res.result.code !== 0) throw new Error(res.result.msg || '读取失败')
    return {
      list: res.result.list.map(normalizeInquiry),
      total: res.result.total,
      hasMore: skip + res.result.list.length < res.result.total
    }
  }
  const all = (wx.getStorageSync('inquiries_local') || [])
    .map(normalizeInquiry)
    .sort((a, b) => b.ts - a.ts)
  const filtered = status === 'all' ? all : all.filter((x) => (x.status || 'new') === status)
  const list = filtered.slice(skip, skip + limit)
  return { list, total: filtered.length, hasMore: skip + list.length < filtered.length }
}

async function updateInquiryStatus(id, status) {
  if (INQUIRY_STATUSES.indexOf(status) === -1) throw new Error('非法状态')
  if (cloudReady()) {
    const res = await wx.cloud.callFunction({
      name: 'adminInquiries',
      data: { action: 'updateStatus', id, status }
    })
    if (res.result && res.result.code !== 0) throw new Error(res.result.msg || '更新失败')
    return res.result
  }
  const key = 'inquiries_local'
  const list = wx.getStorageSync(key) || []
  const item = list.find((x) => x.id === id)
  if (!item) throw new Error('记录不存在')
  item.status = status
  item.updatedAt = Date.now()
  wx.setStorageSync(key, list)
  return { code: 0 }
}

/* ---------------- 订单 / 在线零售 ---------------- */
const ORDER_KEY = 'orders_local'

function genOrderId() {
  return 'O' + Date.now() + Math.floor(Math.random() * 900 + 100)
}

/** 零售单价 = 价格区间下限 priceMin（与购物车快照一致） */
function buildOrderItems(items) {
  return items.map((it) => {
    const p = mock.products.find((x) => x.id === it.productId)
    if (!p) throw new Error('商品不存在或已下架：' + it.productId)
    const qty = parseInt(it.quantity, 10)
    if (!qty || qty < 1) throw new Error('购买数量不合法')
    return { productId: p.id, name: p.name, cover: p.cover, color: it.color || '', price: p.priceMin, quantity: qty }
  })
}

function updateLocalOrder(id, updater) {
  const list = wx.getStorageSync(ORDER_KEY) || []
  const order = list.find((o) => o.id === id)
  if (!order) throw new Error('订单不存在')
  updater(order)
  wx.setStorageSync(ORDER_KEY, list)
  return order
}

/**
 * 创建订单。金额一律重算，不信任前端传入的价格：
 * - 云模式：createOrder 云函数按 products 集合重算并落库；
 * - 本地模式：按 mock 数据重算，存本地缓存。
 * 返回 { id, totalAmount }
 */
async function createOrder(payload) {
  const { items, address, remark } = payload
  if (!address || !address.name || !address.phone || !address.detail) {
    throw new Error('请先填写收货地址')
  }
  if (!items || !items.length) throw new Error('请选择要购买的商品')
  if (cloudReady()) {
    const res = await wx.cloud.callFunction({
      name: 'createOrder',
      data: { items, address, remark }
    })
    if (res.result.code !== 0) throw new Error(res.result.msg || '下单失败')
    return res.result.order
  }
  const detailed = buildOrderItems(items)
  const totalCents = detailed.reduce((s, i) => s + Math.round(i.price * 100) * i.quantity, 0)
  const order = {
    id: genOrderId(),
    status: 'pending_payment',
    items: detailed,
    totalAmount: totalCents / 100,
    shippingFee: 0,
    address,
    remark: String(remark || '').slice(0, 200),
    createdAt: Date.now()
  }
  const list = wx.getStorageSync(ORDER_KEY) || []
  list.unshift(order)
  wx.setStorageSync(ORDER_KEY, list)
  return { id: order.id, totalAmount: order.totalAmount }
}

/**
 * 发起支付。返回值：
 * - { payment: null } = mock 模式，已直接置为已支付；
 * - { payment: {...} } = 传给 wx.requestPayment 拉起微信收银台。
 */
async function payOrder(id) {
  if (cloudReady()) {
    const res = await wx.cloud.callFunction({ name: 'payOrder', data: { id } })
    if (res.result.code !== 0) throw new Error(res.result.msg || '支付发起失败')
    return { payment: res.result.payment }
  }
  updateLocalOrder(id, (o) => {
    if (o.status !== 'pending_payment') throw new Error('订单状态已变化，请刷新')
    o.status = 'paid'
    o.paidAt = Date.now()
  })
  return { payment: null }
}

async function getOrders(opt) {
  opt = opt || {}
  if (cloudReady()) {
    let q = db().collection('orders')
    if (opt.status) q = q.where({ status: opt.status })
    const res = await q.orderBy('createdAt', 'desc').limit(100).get()
    return res.data
  }
  const all = (wx.getStorageSync(ORDER_KEY) || []).sort((a, b) => b.createdAt - a.createdAt)
  return opt.status ? all.filter((o) => o.status === opt.status) : all
}

async function getOrder(id) {
  if (cloudReady()) {
    const res = await db().collection('orders').where({ id }).get()
    return res.data[0] || null
  }
  return (wx.getStorageSync(ORDER_KEY) || []).find((o) => o.id === id) || null
}

/** 待付款订单取消 */
async function cancelOrder(id) {
  if (cloudReady()) {
    const res = await wx.cloud.callFunction({ name: 'orderAction', data: { action: 'cancel', id } })
    if (res.result.code !== 0) throw new Error(res.result.msg || '取消失败')
    return res.result
  }
  updateLocalOrder(id, (o) => {
    if (o.status !== 'pending_payment') throw new Error('当前状态不可取消')
    o.status = 'cancelled'
    o.cancelledAt = Date.now()
  })
  return { code: 0 }
}

/** 已发货订单确认收货 */
async function confirmReceive(id) {
  if (cloudReady()) {
    const res = await wx.cloud.callFunction({ name: 'orderAction', data: { action: 'confirmReceive', id } })
    if (res.result.code !== 0) throw new Error(res.result.msg || '操作失败')
    return res.result
  }
  updateLocalOrder(id, (o) => {
    if (o.status !== 'shipped') throw new Error('当前状态不可确认收货')
    o.status = 'completed'
    o.completedAt = Date.now()
  })
  return { code: 0 }
}

/** 模拟发货（仅本地/演示模式，用于跑通「已发货→确认收货」流程） */
function mockShip(id) {
  if (cloudReady()) throw new Error('云模式下请在商户后台/控制台执行发货')
  return updateLocalOrder(id, (o) => {
    if (o.status !== 'paid') throw new Error('当前状态不可发货')
    o.status = 'shipped'
    o.shippedAt = Date.now()
  })
}

module.exports = {
  init,
  cloudReady,
  getHomeData,
  getCategories,
  getProducts,
  getProduct,
  getRelatedProducts,
  submitInquiry,
  listInquiries,
  updateInquiryStatus,
  createOrder,
  payOrder,
  getOrders,
  getOrder,
  cancelOrder,
  confirmReceive,
  mockShip
}
