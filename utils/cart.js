/**
 * 购物车数据层（客户端本地存储，天然按设备隔离）。
 * 商品以「商品id + 颜色」为唯一键；价格为加购时的快照，
 * 真实成交金额在创建订单时统一重算（本地模式按 mock 重算，云模式由 createOrder 云函数重算）。
 */
const TAB_CART_INDEX = 3 // 购物车在 tabBar 中的位置
const KEY = 'cart_local'

function getItems() {
  return wx.getStorageSync(KEY) || []
}

function save(items) {
  wx.setStorageSync(KEY, items)
  syncBadge()
}

function add(product, color, quantity) {
  const items = getItems()
  const found = items.find((i) => i.productId === product.id && i.color === color)
  if (found) {
    found.quantity += quantity
  } else {
    items.unshift({
      productId: product.id,
      name: product.name,
      cover: product.cover,
      price: product.priceMin, // 零售价取价格区间下限
      color: color || '',
      quantity,
      selected: true
    })
  }
  save(items)
}

function setQuantity(productId, color, quantity) {
  const items = getItems()
  const found = items.find((i) => i.productId === productId && i.color === color)
  if (found) {
    found.quantity = Math.max(1, quantity | 0)
    save(items)
  }
}

function remove(productId, color) {
  save(getItems().filter((i) => !(i.productId === productId && i.color === color)))
}

function setSelected(productId, color, selected) {
  const items = getItems()
  const found = items.find((i) => i.productId === productId && i.color === color)
  if (found) {
    found.selected = !!selected
    save(items)
  }
}

function setAllSelected(selected) {
  save(getItems().map((i) => Object.assign({}, i, { selected: !!selected })))
}

function selectedItems() {
  return getItems().filter((i) => i.selected)
}

/** 下单成功后移除已结算的商品 */
function clearSelected() {
  save(getItems().filter((i) => !i.selected))
}

function totalCount() {
  return getItems().reduce((s, i) => s + i.quantity, 0)
}

/** 选中商品合计（单位：分），避免浮点误差 */
function selectedTotalCents() {
  return selectedItems().reduce((s, i) => s + Math.round(i.price * 100) * i.quantity, 0)
}

function syncBadge() {
  const n = totalCount()
  try {
    if (n > 0) {
      wx.setTabBarBadge({ index: TAB_CART_INDEX, text: n > 99 ? '99+' : String(n), fail: () => {} })
    } else {
      wx.removeTabBarBadge({ index: TAB_CART_INDEX, fail: () => {} })
    }
  } catch (e) {
    // 非 tabBar 页面场景下静默失败即可
  }
}

module.exports = {
  getItems,
  add,
  setQuantity,
  remove,
  setSelected,
  setAllSelected,
  selectedItems,
  clearSelected,
  totalCount,
  selectedTotalCents,
  syncBadge
}
