/**
 * 支付封装：统一处理 mock / 云支付 两种模式。
 * 返回 true = 支付成功（mock 模式为直接置为已支付）。
 */
const api = require('./api')
const config = require('../config/index')

function pay(id) {
  return api.payOrder(id).then((res) => {
    if (!res.payment) return true // mock 模式：已在数据层置为已支付
    const p = res.payment
    return new Promise((resolve, reject) => {
      wx.requestPayment({
        timeStamp: p.timeStamp,
        nonceStr: p.nonceStr,
        package: p.package,
        signType: p.signType || 'RSA',
        paySign: p.paySign,
        success: () => resolve(true),
        fail: () => reject(new Error('支付未完成'))
      })
    })
  })
}

function isMock() {
  return !config.payment || config.payment.mode !== 'cloud' || !api.cloudReady()
}

module.exports = { pay, isMock }
