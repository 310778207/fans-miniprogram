/**
 * 收货地址簿（本地存储）。
 * 订单创建时会把地址快照写进订单，所以地址簿放本地即可满足 v1 需求。
 */
const KEY = 'addresses_local'

function getList() {
  return wx.getStorageSync(KEY) || []
}

function save(list) {
  wx.setStorageSync(KEY, list)
}

function getById(id) {
  return getList().find((a) => a.id === id) || null
}

function getDefault() {
  const list = getList()
  return list.find((a) => a.isDefault) || list[0] || null
}

/** 新增或更新（传 id 为更新）。设为默认时清除其它默认。 */
function upsert(form) {
  const list = getList()
  if (form.isDefault) {
    list.forEach((a) => {
      a.isDefault = false
    })
  }
  if (form.id) {
    const idx = list.findIndex((a) => a.id === form.id)
    if (idx > -1) list[idx] = Object.assign({}, list[idx], form)
    save(list)
    return form.id
  }
  const id = 'a' + Date.now()
  const record = Object.assign({ id, createdAt: Date.now() }, form)
  // 第一条地址自动设为默认
  if (list.length === 0) record.isDefault = true
  list.push(record)
  save(list)
  return id
}

function removeById(id) {
  const list = getList().filter((a) => a.id !== id)
  save(list)
  // 删掉默认地址后，把第一条顶上
  if (list.length && !list.some((a) => a.isDefault)) {
    list[0].isDefault = true
    save(list)
  }
}

function validate(form) {
  if (!form.name || !form.name.trim()) return '请填写收货人姓名'
  if (!/^1[3-9]\d{9}$/.test(String(form.phone).trim())) return '请填写正确的手机号'
  if (!form.region) return '请选择所在地区'
  if (!form.detail || !form.detail.trim()) return '请填写详细地址'
  return ''
}

module.exports = { getList, getById, getDefault, upsert, removeById, validate }
