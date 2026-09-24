const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 询盘提交云函数
 * 入参：{ name, phone, wechat, email, message, productName, from }
 * 返回：{ code: 0, msg: 'ok', id } 或 { code: 1, msg: '错误原因' }
 */
exports.main = async (event) => {
  const { name, phone, wechat, email, message, productName, from } = event

  // 服务端二次校验（前端校验可被绕过）
  if (!name || !phone || !message) {
    return { code: 1, msg: '缺少必填字段' }
  }
  if (!/^1[3-9]\d{9}$/.test(String(phone))) {
    return { code: 1, msg: '手机号格式不正确' }
  }

  const db = cloud.database()
  const res = await db.collection('inquiries').add({
    data: {
      name: String(name).slice(0, 50),
      phone: String(phone),
      wechat: String(wechat || '').slice(0, 50),
      email: String(email || '').slice(0, 100),
      message: String(message).slice(0, 500),
      productName: String(productName || '').slice(0, 200),
      from: from || 'miniprogram',
      status: 'new', // new / followed / closed，方便后台跟进
      createdAt: db.serverDate()
    }
  })

  // ★ 可选：新询盘实时通知。
  // 最简单的做法是接一个企业微信群机器人（把 webhook 换成你的）：
  //
  // await cloud.callContainer  // 无需，直接用 https 模块即可：
  // const https = require('https')
  // const hook = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=你的KEY'
  // await new Promise((resolve) => {
  //   const req = https.request(hook, { method: 'POST' }, resolve)
  //   req.end(JSON.stringify({
  //     msgtype: 'text',
  //     text: { content: `新询盘：${name}（${phone}）${productName}：${message}` }
  //   }))
  // })

  return { code: 0, msg: 'ok', id: res._id }
}
