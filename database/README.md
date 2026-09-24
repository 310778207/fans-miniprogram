# 云数据库集合设计（开通云开发后创建）

在开发者工具「云开发 → 数据库」里创建以下 5 个集合，字段与 `data/mock.js` 保持一致。
`banners/categories/products` 由控制台维护；`inquiries/orders` 分别由云函数写入，
权限都设为「仅创建者可读写」即可（读写走云函数管理员权限，普通用户看不到别人的数据）。

| 集合 | 用途 | 权限 |
|---|---|---|
| banners | 首页轮播 | 仅创建者可读写 |
| categories | 产品分类 | 仅创建者可读写 |
| products | 产品 | 仅创建者可读写 |
| inquiries | 询盘留言（submitInquiry 写入） | 仅创建者可读写 |
| orders | 零售订单（createOrder 写入） | 仅创建者可读写 |

> 购物车和收货地址簿保存在客户端本地存储，不需要建集合；
> 订单创建时会把地址快照写进订单，所以地址簿放本地即可。

## 1. banners — 首页轮播

```json
{
  "_id": "b1",
  "image": "https://<你的CDN>/banner1.png",
  "link": "",            // 可选，点击跳转的小程序页面路径
  "sort": 1
}
```

## 2. categories — 产品分类

```json
{
  "_id": "c01",
  "id": "c01",
  "name": "木扇",
  "cover": "https://<你的CDN>/c01.png",
  "sort": 1
}
```

## 3. products — 产品

```json
{
  "_id": "doc自动生成",
  "id": "p01",                       // 与 mock.js 中一致，详情页按它查询
  "name": "大红婚礼折扇 10寸绸布扇",
  "categoryId": "c01",
  "priceMin": 3.5,
  "priceMax": 6.8,
  "cover": "https://<你的CDN>/p01_1.png",
  "gallery": ["https://<你的CDN>/p01_1.png", "https://<你的CDN>/p01_2.png"],
  "colors": ["大红", "玫红", "金色", "黑色"],
  "specs": [
    { "label": "尺寸", "value": "10寸（约33cm）" },
    { "label": "材质", "value": "竹骨 + 绸布扇面" },
    { "label": "起订量", "value": "现货 1 件起批" }
  ],
  "sales": 326,
  "isHot": true,
  "isNew": false,
  "desc": "……"
}
```

> 注意：`起订量` 的 spec 里第一个数字会被详情页解析为最小起订数量。

## 4. inquiries — 询盘（由云函数写入，控制台查看/跟进）

```json
{
  "_id": "doc自动生成",
  "name": "张先生",
  "phone": "13800000000",
  "wechat": "",
  "email": "",
  "message": "需要定制木扇 1000 把，印 LOGO",
  "productName": "复古木质香木扇（颜色：原木色，数量：500）",
  "from": "miniprogram",
  "status": "new",                    // new / followed / closed
  "createdAt": "serverDate"
}
```

## 5. orders — 零售订单（createOrder 云函数写入，权限「仅创建者可读写」）

```json
{
  "_id": "doc自动生成",
  "_openid": "买家openid（createOrder 写入）",
  "id": "O1690000000000123",          // 订单号 = 微信支付 outTradeNo
  "status": "pending_payment",        // pending_payment/paid/shipped/completed/cancelled
  "items": [
    { "productId": "p01", "name": "…", "cover": "…", "color": "大红", "price": 3.5, "quantity": 20 }
  ],
  "totalAmount": 70,                  // 服务端按 products.priceMin 重算
  "shippingFee": 0,
  "address": { "name": "…", "phone": "…", "region": "…", "detail": "…" },
  "remark": "",
  "createdAt": "serverDate",
  "paidAt": "payCallback 写入",
  "shippedAt": "商家发货时在控制台补充",
  "completedAt": "确认收货写入"
}
```

发货操作（云模式）：商家在云开发控制台把订单 `status` 改为 `shipped` 并填 `shippedAt`；
后续可以做一个商家发货面板，需要时告诉我。

## 快速导入

也可以直接在控制台「导入」下面 3 个 JSON 文件快速建好演示数据（每行一个 JSON 对象）：

- `database/banners.json`
- `database/categories.json`
- `database/products.json`

（导入后记得把 `config/index.js` 的 `useCloud` 改为 `true`，并填上 `cloudEnv` 环境 ID）
