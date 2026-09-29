# 匠心扇坊 · 微信小程序

参照 fareafans.com（领动建站的外贸独立站）的功能架构，做的**面向国内客户**的
原生微信小程序。零后台依赖、开箱即跑，开通云开发后可无缝切到云数据库管理产品与询盘。

## 功能清单（对照原站）

| 原站模块 | 小程序对应 |
|---|---|
| 首页 Banner / Hot Products / New Products | 首页轮播、热销推荐宫格、新品横滑 |
| 产品分类（6 类）+ 列表（分页） | 「产品」tab 左侧分类 + 右侧产品流，搜索走列表页 |
| 产品详情（图集 / 价格区间 / 颜色 SKU） | 详情页图集轮播（可预览大图）、颜色选择、数量步进、规格参数 |
| 询盘表单 + WhatsApp / tel / mailto | 询盘表单（云函数落库）+ 在线客服（小程序客服会话）+ 拨打电话 + 复制微信/邮箱 |
| About Us / Trusted Clients | 「关于」tab：简介、实力数据、优势、联系方式 |
| —（原站没有） | 详情页「猜你喜欢」：同分类产品推荐，兜底热销款 |
| —（原站用邮箱看询盘） | **商家询盘管理页**（我的页「商家入口」，密码在 `config.adminCode`）：筛选待跟进/已跟进/已关闭、一键回电、复制买家微信、改跟进状态 |
| —（原站没有，线上零售） | **完整零售链路**：购物车（tabBar 角标）→ 收货地址簿 → 结算页 → 微信支付（mock/云双模式）→ 订单列表/详情（待付款/待发货/已发货/已完成，取消订单、确认收货） |
| SEO（Google 自然流量） | 小程序内搜流量：页面配置了分享卡片（onShareAppMessage） |

> 原站靠 WhatsApp 获客；微信内不能跳转 WhatsApp，转化入口改为
> **在线客服（open-type=contact）+ 电话 + 复制微信号**，这是国内小程序的标准做法。

## 目录结构

```
fans-miniprogram/
├── app.js / app.json / app.wxss     # 全局：tabBar 五栏(首页/产品/询盘/购物车/我的)、主题色 #B9432F
├── config/index.js                  # ★ 你的品牌、电话、微信号、地址、云开发开关、支付模式
├── data/mock.js                     # 本地示例数据（12 个产品 / 6 个分类 / 3 张 Banner）
├── utils/api.js                     # 数据访问层：本地模式 ⇄ 云开发模式 自动切换
├── utils/cart.js                    # 购物车（本地存储 + tabBar 角标同步）
├── utils/address.js                 # 收货地址簿（本地存储，下单时快照进订单）
├── utils/pay.js                     # 支付封装：mock / 云支付自动切换
├── components/product-card/         # 产品卡片组件（列表/首页复用）
├── pages/
│   ├── index/                       # 首页
│   ├── category/                    # 产品分类（tab）
│   ├── list/                        # 搜索/热销/新品 列表
│   ├── detail/                      # 产品详情（图集/SKU/加购/立即购买/询盘入口/分享）
│   ├── contact/                     # 询盘表单 + 联系方式（tab）
│   ├── cart/                        # 购物车（tab，勾选/数量/全选/结算）
│   ├── profile/                     # 我的（tab：订单入口/地址/品牌介绍/客服/商家入口）
│   ├── checkout/                    # 结算页（地址/清单/留言/提交并支付）
│   ├── orders/                      # 订单列表（状态筛选/去支付/取消/确认收货）
│   ├── order-detail/                # 订单详情（状态/地址/金额/时间线，演示模式可模拟发货）
│   ├── address/list|edit            # 收货地址管理（增删改/默认地址/结算选地址）
│   ├── about/                       # 品牌介绍（简介、实力数据、优势、联系方式）
│   └── admin/                       # 商家询盘管理（密码门 + 状态筛选 + 回电/复制微信）
├── cloudfunctions/
│   ├── submitInquiry/               # 询盘落库（含企业微信通知示例代码）
│   ├── adminInquiries/              # 询盘列表/改状态（管理员权限，绕过集合权限规则）
│   ├── createOrder/                 # 创建订单：服务端按 products 重算金额（不信任前端价格）
│   ├── payOrder/                    # 微信支付下单（cloudPay.unifiedOrder，需填商户号）
│   ├── payCallback/                 # 支付结果回调：置订单为已支付（幂等）
│   └── orderAction/                 # 取消订单 / 确认收货（校验订单归属与状态）
├── database/                        # 云数据库集合设计说明 + 可导入的示例 JSON
├── images/                          # 生成的 tabBar 图标与占位图
└── tools/gen_images.py              # 占位图生成脚本（Pillow），可重跑
```

## 快速开始（3 步）

1. **打开项目**：微信开发者工具 → 导入 `fans-miniprogram` 目录 → AppID 先选「测试号」。
   项目默认 `useCloud: false`，产品数据来自 `data/mock.js`，询盘提交存本地缓存，**直接能跑**。
2. **改成你的信息**：编辑 `config/index.js`（品牌、电话、微信号、邮箱、地址、简介、
   `adminCode` 管理密码），并替换 `images/` 里的占位图为真实商品图（或改为云存储/CDN 地址，写在数据里）。
3. **体验完整流程**：
   - 询盘闭环：提交几条询盘 → 「我的」→「商家入口 · 询盘管理」，输入 `adminCode`（默认 888888）查看并跟进；
   - 零售闭环：详情页选颜色「加入购物车」→ 购物车勾选结算 → 添加收货地址 → 提交订单 →
     **模拟支付成功** → 订单出现「待发货」→ 订单详情「模拟发货」→「确认收货」完成。
     （默认 `payment.mode: 'mock'`，不真扣款即可跑通全部流程）
4. **上线前开通云开发**（可选但推荐）：
   - 开发者工具 → 云开发 → 开通，记下环境 ID；
   - `config/index.js` 里 `useCloud: true`，填 `cloudEnv`；
   - 按 `database/README.md` 创建 5 个集合并导入示例 JSON，再把真实产品录进去（控制台即可维护，无需开发后台）；
   - 右键 `cloudfunctions/` 下 **6 个云函数** → 分别「上传并部署」。
     （若编辑器左侧没显示 cloudfunctions 目录：`project.config.json` 的根级加上
     `"cloudfunctionRoot": "cloudfunctions/"` 后重新打开项目即可）
   - 集合权限（见 `database/README.md` 权限表）：`banners/categories/products` 设
     「所有用户可读，仅创建者可读写」（首页/列表是客户端直查，设成仅创建者可读会空白）；
     `orders` 设「仅创建者可读写」（createOrder 写入 _openid，用户只能看自己的单）；
     `inquiries` 设「仅管理端可读写」（读写都走云函数，普通用户看不到别人的询盘）。

## 发布检查清单

- [ ] `config/index.js` 全部信息已替换（含 `adminCode` 管理密码）
- [ ] 占位图已换成真实商品图（建议 750×750 以上）
- [ ] 小程序后台 → 客服 → 添加客服人员（「在线客服」按钮才有效）
- [ ] 云开发环境已建，6 个云函数（submitInquiry / adminInquiries / createOrder /
      payOrder / payCallback / orderAction）均已部署
- [ ] 5 个集合已创建且权限正确（按 `database/README.md` 的权限表逐个核对）
- [ ] 小程序类目建议：**商家自营 > 工艺品**（按你的实际资质选择）
- [ ] 真机预览：iOS/Android 各过一遍详情页与询盘提交

## 微信支付上线步骤（需要商户号时再做）

当前 `payment.mode: 'mock'` 是模拟支付，只用于开发演示。要真实收款：

1. 小程序主体完成微信认证，开通**微信支付商户号**（mchid）；
2. 云开发控制台 → 设置 → 微信支付 → **绑定商户号**；
3. `cloudfunctions/payOrder/index.js` 里把 `SUB_MCH_ID` 换成你的商户号，
   `body` 参数换成你的品牌名；部署 payOrder 和 payCallback；
4. `config/index.js` 改为 `payment: { mode: 'cloud' }`；
5. 真机用 0.01 元商品实测一单：支付 → payCallback 把订单置为「待发货」→ 商户平台可退款。
   （云支付走微信服务商户通道，个人主体小程序无法开通支付，需要企业/个体工商户资质）

## 常见问题

- **「在线客服」没反应？** 后台未添加客服，或用测试号（测试号不支持客服会话）。
- **提交订单报「支付下单失败」？** `payment.mode` 是 `cloud` 但还没绑定商户号/填 `SUB_MCH_ID`，
  先切回 `mock` 模式开发调试。
- **云支付后订单一直是「待付款」？** 检查 `payCallback` 是否已部署（支付结果靠它落库）。
- **想改回纯询盘批发模式？** 把详情页「立即购买/加入购物车」按钮去掉即可，询盘链路是独立的。
- **改了产品图不显示？** 云开发模式记得检查图片域名在 mp 后台「downloadFile 合法域名」或直接用云存储。
