const cloud = require('wx-server-sdk')
const fs = require('fs')
const path = require('path')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 一次性初始化云数据库：建集合 + 导入产品/分类/轮播种子数据。
 *
 * - 数据源：目录下的 banners.json / categories.json / products.json
 *   （与控制台导入格式一致，一行一条 JSON 记录，来源于 database/ 目录）；
 * - 幂等可续传：集合已存在则跳过创建；数据按「已有条数」断点续导，
 *   不会覆盖或重复插入已有记录，重复调用安全；
 * - 每次调用只建集合 + 导入一小批（约 50 条），避免云函数默认 3s 超时。
 *   客户端（app.js 的 setupDatabase 钩子）会循环调用直到返回 finished: true。
 *
 * 返回：{ created, existed, progress: { 集合: { total, imported, done } }, finished }
 */
const COLLECTIONS = ['banners', 'categories', 'products', 'inquiries', 'orders', 'users']
const BATCH = 50

function readJsonl(name) {
  const raw = fs.readFileSync(path.join(__dirname, name), 'utf8')
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line))
}

const SEED = {
  banners: readJsonl('banners.json'),
  categories: readJsonl('categories.json'),
  products: readJsonl('products.json')
}

exports.main = async () => {
  const db = cloud.database()
  const summary = { created: [], existed: [], progress: {}, finished: false }

  for (const name of COLLECTIONS) {
    try {
      await db.createCollection(name)
      summary.created.push(name)
    } catch (e) {
      summary.existed.push(name)
    }
  }

  for (const name of Object.keys(SEED)) {
    const docs = SEED[name]
    const countRes = await db.collection(name).count()
    const total = countRes.total
    if (total >= docs.length) {
      summary.progress[name] = { total, imported: docs.length, done: true }
      continue
    }
    const chunk = docs.slice(total, total + BATCH)
    await db.collection(name).add({ data: chunk })
    const done = total + chunk.length >= docs.length
    summary.progress[name] = { total: total + chunk.length, imported: docs.length, done }
  }

  summary.finished = COLLECTIONS.every((n) =>
    SEED[n] ? summary.progress[n] && summary.progress[n].done : true
  )
  return summary
}
