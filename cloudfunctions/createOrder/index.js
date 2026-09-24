const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 创建订单云函数。
 * 安全要点：金额在这里按 products 集合重新计算，绝不信任前端传入的价格；
 * 订单写入 _openid，配合「仅创建者可读写」权限，用户只能看到自己的订单。
 *
 * 入参：{ items: [{ productId, color, quantity }], address: {name,phone,region,detail}, remark }
 * 返回：{ code: 0, order: { id, totalAmount } } 或 { code: 1, msg }
 */
function genOrderId() {
  return 'O' + Date.now() + Math.floor(Math.random() * 900 + 100)
}

exports.main = async (event) => {
  const { items = [], address, remark } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) return { code: 1, msg: '用户身份获取失败' }
  if (!address || !address.name || !address.phone || !address.region || !address.detail) {
    return { code: 1, msg: '缺少收货地址' }
  }
  if (!items.length) return { code: 1, msg: '订单不能为空' }
  if (!/^1[3-9]\d{9}$/.test(String(address.phone))) {
    return { code: 1, msg: '收货人手机号不正确' }
  }

  const db = cloud.database()
  const _ = db.command

  // 服务端重算价格：按 id 批量取商品
  const ids = [...new Set(items.map((i) => i.productId))]
  const prodRes = await db.collection('products').where({ id: _.in(ids) }).get()
  const byId = {}
  prodRes.data.forEach((p) => {
    byId[p.id] = p
  })

  const detailed = []
  for (const it of items) {
    const p = byId[it.productId]
    if (!p) return { code: 1, msg: '商品不存在或已下架：' + it.productId }
    const qty = parseInt(it.quantity, 10)
    if (!qty || qty < 1 || qty > 10000) return { code: 1, msg: '购买数量不合法' }
    // 零售价 = 价格区间下限（与前端购物车快照口径一致）
    detailed.push({
      productId: p.id,
      name: p.name,
      cover: p.cover,
      color: String(it.color || '').slice(0, 50),
      price: p.priceMin,
      quantity: qty
    })
  }

  const totalCents = detailed.reduce((s, i) => s + Math.round(i.price * 100) * i.quantity, 0)
  const id = genOrderId()

  await db.collection('orders').add({
    data: {
      _openid: openid,
      id,
      status: 'pending_payment',
      items: detailed,
      totalAmount: totalCents / 100,
      shippingFee: 0,
      address: {
        name: String(address.name).slice(0, 50),
        phone: String(address.phone),
        region: String(address.region).slice(0, 100),
        detail: String(address.detail).slice(0, 200)
      },
      remark: String(remark || '').slice(0, 200),
      createdAt: db.serverDate()
    }
  })

  return { code: 0, order: { id, totalAmount: totalCents / 100 } }
}
