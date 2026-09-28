/**
 * 本地示例数据：结构与云数据库集合一一对应，
 * 开通云开发后把 useCloud 打开，字段保持一致即可无缝切换。
 *
 * 图片已替换为 fareafans.com（领动建站）的真实商品图，本地压缩为 500×500 JPG。
 * 每张图与源站的对应关系见 tools/image_sources.json，如需换图可照该文件重新抓取。
 */

const banners = [
  { id: 'b1', image: '/images/banner1.jpg', link: '' },
  { id: 'b2', image: '/images/banner2.jpg', link: '' },
  { id: 'b3', image: '/images/banner3.jpg', link: '' }
]

const categories = [
  { id: 'c01', name: '木扇', cover: '/images/p01_1.jpg' },
  { id: 'c02', name: '竹扇', cover: '/images/p03_1.jpg' },
  { id: 'c03', name: '塑料扇', cover: '/images/p05_1.jpg' },
  { id: 'c04', name: '大扇', cover: '/images/p07_1.jpg' },
  { id: 'c05', name: '蕾丝扇', cover: '/images/p09_1.jpg' },
  { id: 'c06', name: '定制礼扇', cover: '/images/p11_1.jpg' }
]

const products = [
  {
    id: 'p01',
    name: '大红婚礼折扇 10寸绸布扇 婚庆伴手礼',
    categoryId: 'c01',
    priceMin: 3.5,
    priceMax: 6.8,
    cover: '/images/p01_1.jpg',
    gallery: ['/images/p01_1.jpg', '/images/p01_2.jpg', '/images/p01_3.jpg'],
    colors: ['大红', '玫红', '金色', '黑色'],
    specs: [
      { label: '尺寸', value: '10寸（约33cm）' },
      { label: '材质', value: '竹骨 + 绸布扇面' },
      { label: '起订量', value: '现货 1 件起批，定制 500 把起' },
      { label: '定制', value: '支持印 LOGO / 礼盒包装' }
    ],
    sales: 326,
    isHot: true,
    isNew: false,
    desc: '婚庆热销款，绸布扇面色泽饱满，竹骨打磨光滑，适合婚礼伴手礼、节庆活动批量采购。'
  },
  {
    id: 'p02',
    name: '复古木质香木扇 雕花工艺扇 礼品扇',
    categoryId: 'c01',
    priceMin: 8.8,
    priceMax: 15.0,
    cover: '/images/p02_1.jpg',
    gallery: ['/images/p02_1.jpg', '/images/p02_2.jpg', '/images/p02_3.jpg'],
    colors: ['原木色', '深棕', '枣红'],
    specs: [
      { label: '尺寸', value: '8寸（约26cm）' },
      { label: '材质', value: '天然香木 / 激光雕花' },
      { label: '起订量', value: '2 把起批' },
      { label: '香味', value: '天然木质香，可加香' }
    ],
    sales: 158,
    isHot: true,
    isNew: false,
    desc: '整木雕刻，扇面镂空花纹，自带淡淡木香，适合高端礼品、文创伴手礼场景。'
  },
  {
    id: 'p03',
    name: '日式真丝竹扇 书画白坯扇 DIY空白扇',
    categoryId: 'c02',
    priceMin: 5.2,
    priceMax: 9.9,
    cover: '/images/p03_1.jpg',
    gallery: ['/images/p03_1.jpg', '/images/p03_2.jpg', '/images/p03_3.jpg'],
    colors: ['米白', '浅青', '绯红'],
    specs: [
      { label: '尺寸', value: '9寸（约30cm）' },
      { label: '材质', value: '竹骨 + 真丝/绢布' },
      { label: '起订量', value: '1 件起批（50把/件）' },
      { label: '用途', value: '书画创作 / 团建DIY / 汉服配饰' }
    ],
    sales: 212,
    isHot: false,
    isNew: true,
    desc: '白坯扇面可书可画，扇骨弹性和手感俱佳，书画爱好者与研学活动常用款。'
  },
  {
    id: 'p04',
    name: '和风竹扇 绢布印花折扇 动漫周边定制',
    categoryId: 'c02',
    priceMin: 4.5,
    priceMax: 8.0,
    cover: '/images/p04_1.jpg',
    gallery: ['/images/p04_1.jpg', '/images/p04_2.jpg', '/images/p04_3.jpg'],
    colors: ['A款', 'B款', 'C款', 'D款'],
    specs: [
      { label: '尺寸', value: '8寸 / 9寸' },
      { label: '材质', value: '竹骨 + 印花绢布' },
      { label: '起订量', value: '现货 1 件起批，来图定制 300 把起' },
      { label: '定制', value: '支持动漫 IP 授权图案' }
    ],
    sales: 187,
    isHot: false,
    isNew: true,
    desc: '漫展热销印花扇，图案清晰不易褪色，支持来图定制，交期稳定。'
  },
  {
    id: 'p05',
    name: '亮面塑料折扇 舞台演出扇 演唱会应援扇',
    categoryId: 'c03',
    priceMin: 2.8,
    priceMax: 5.5,
    cover: '/images/p05_1.jpg',
    gallery: ['/images/p05_1.jpg', '/images/p05_2.jpg', '/images/p05_3.jpg'],
    colors: ['幻彩', '银色', '金色', '黑色'],
    specs: [
      { label: '尺寸', value: '11寸（约36cm）' },
      { label: '材质', value: 'PP塑料扇骨 + 亮面扇页' },
      { label: '起订量', value: '1 件起批（100把/件）' },
      { label: '特点', value: '开合顺滑、耐摔不掉页' }
    ],
    sales: 456,
    isHot: true,
    isNew: false,
    desc: '演唱会、夜市应援爆款，亮面反光效果好，整把水洗不变形。'
  },
  {
    id: 'p06',
    name: '珠光塑料扇 婚庆手捧花扇 伴娘团扇',
    categoryId: 'c03',
    priceMin: 3.2,
    priceMax: 6.0,
    cover: '/images/p06_1.jpg',
    gallery: ['/images/p06_1.jpg', '/images/p06_2.jpg', '/images/p06_3.jpg'],
    colors: ['香槟金', '裸粉', '月光白'],
    specs: [
      { label: '尺寸', value: '10寸（约33cm）' },
      { label: '材质', value: '塑料骨 + 珠光扇面' },
      { label: '起订量', value: '1 件起批' },
      { label: '场景', value: '婚礼拍照 / 伴娘手捧 / 桌花布置' }
    ],
    sales: 233,
    isHot: false,
    isNew: true,
    desc: '珠光扇面温润细腻，婚礼布置出片率高，可搭配花艺做成手捧花扇。'
  },
  {
    id: 'p07',
    name: '1.5米超大舞蹈扇 舞台表演大扇 中国风',
    categoryId: 'c04',
    priceMin: 25.0,
    priceMax: 42.0,
    cover: '/images/p07_1.jpg',
    gallery: ['/images/p07_1.jpg', '/images/p07_2.jpg', '/images/p07_3.jpg'],
    colors: ['渐变红', '渐变蓝', '彩虹'],
    specs: [
      { label: '尺寸', value: '全长约1.5米' },
      { label: '材质', value: '加长竹骨 + 加厚绸布' },
      { label: '起订量', value: '2 把起批' },
      { label: '场景', value: '广场舞 / 舞台剧 / 开业庆典' }
    ],
    sales: 98,
    isHot: true,
    isNew: false,
    desc: '加长扇骨展开气势足，绸布垂感好，舞台表演和庆典造势首选。'
  },
  {
    id: 'p08',
    name: '双面渐变大扇 秧歌舞蹈扇 加厚绸布',
    categoryId: 'c04',
    priceMin: 18.0,
    priceMax: 30.0,
    cover: '/images/p08_1.jpg',
    gallery: ['/images/p08_1.jpg', '/images/p08_2.jpg', '/images/p08_3.jpg'],
    colors: ['红黄渐变', '蓝紫渐变', '绿金渐变'],
    specs: [
      { label: '尺寸', value: '全长约1.2米' },
      { label: '材质', value: '竹骨 + 双面渐变绸' },
      { label: '起订量', value: '2 把起批' },
      { label: '包装', value: 'OPP袋装，可加印包装' }
    ],
    sales: 76,
    isHot: false,
    isNew: true,
    desc: '双面渐变色，舞动时层次分明，加厚绸布久用不起毛边。'
  },
  {
    id: 'p09',
    name: '蕾丝折叠扇 婚纱拍照道具扇 复古洋伞扇',
    categoryId: 'c05',
    priceMin: 6.5,
    priceMax: 12.0,
    cover: '/images/p09_1.jpg',
    gallery: ['/images/p09_1.jpg', '/images/p09_2.jpg', '/images/p09_3.jpg'],
    colors: ['象牙白', '黑色', '咖啡'],
    specs: [
      { label: '尺寸', value: '9寸（约30cm）' },
      { label: '材质', value: '棉线蕾丝 + 塑料骨' },
      { label: '起订量', value: '1 件起批' },
      { label: '风格', value: '法式复古 / 旗袍拍照' }
    ],
    sales: 143,
    isHot: true,
    isNew: false,
    desc: '满版蕾丝花纹，拍照氛围感强，影楼、写真馆常用道具。'
  },
  {
    id: 'p10',
    name: '西班牙蕾丝舞扇 弗拉明戈演出扇',
    categoryId: 'c05',
    priceMin: 9.8,
    priceMax: 16.0,
    cover: '/images/p10_1.jpg',
    gallery: ['/images/p10_1.jpg', '/images/p10_2.jpg', '/images/p10_3.jpg'],
    colors: ['正红', '宝蓝', '紫色'],
    specs: [
      { label: '尺寸', value: '10寸（约33cm）' },
      { label: '材质', value: '蕾丝扇面 + 木质扇骨' },
      { label: '起订量', value: '2 把起批' },
      { label: '场景', value: '弗拉明戈舞 / 穿搭配饰' }
    ],
    sales: 87,
    isHot: false,
    isNew: true,
    desc: '扇骨韧性佳，开合利落有“啪”声，舞蹈演出与日常穿搭两相宜。'
  },
  {
    id: 'p11',
    name: '企业定制礼扇 LOGO印刷 广告宣传扇',
    categoryId: 'c06',
    priceMin: 2.2,
    priceMax: 4.8,
    cover: '/images/p11_1.jpg',
    gallery: ['/images/p11_1.jpg', '/images/p11_2.jpg', '/images/p11_3.jpg'],
    colors: ['Pantone色可调'],
    specs: [
      { label: '尺寸', value: '7寸 / 8寸 / 9寸' },
      { label: '定制', value: '单面/双面印 LOGO，1000 把起' },
      { label: '打样', value: '支持免费打样，3-5 天出样' },
      { label: '交期', value: '大货 10-15 天' }
    ],
    sales: 520,
    isHot: true,
    isNew: false,
    desc: '展会、开业、小区活动宣传利器，量大价优，免费设计排版。'
  },
  {
    id: 'p12',
    name: '高档礼盒定制扇 真丝礼品扇 商务伴手礼',
    categoryId: 'c06',
    priceMin: 28.0,
    priceMax: 58.0,
    cover: '/images/p12_1.jpg',
    gallery: ['/images/p12_1.jpg', '/images/p12_2.jpg', '/images/p12_3.jpg'],
    colors: ['缎面红', '藏蓝', '墨绿'],
    specs: [
      { label: '尺寸', value: '9寸 / 10寸' },
      { label: '材质', value: '真丝扇面 + 檀木扇骨' },
      { label: '定制', value: '礼盒烫金 LOGO，200 套起' },
      { label: '配套', value: '扇套 + 精装礼盒 + 手提袋' }
    ],
    sales: 64,
    isHot: false,
    isNew: true,
    desc: '真丝面配檀木骨，附精装礼盒，商务馈赠、节庆客户答谢体面之选。'
  }
]

const stats = [
  { num: '20年+', label: '制扇经验' },
  { num: '3000万+', label: '年产扇量' },
  { num: '500+', label: '长期合作客户' },
  { num: '48h', label: '打样出货' }
]

const advantages = [
  { icon: '🏭', title: '源头工厂', desc: '自有厂房产线，没有中间商差价' },
  { icon: '🎨', title: '来样定制', desc: '支持来图来样定制、免费打样' },
  { icon: '✅', title: '品控保障', desc: '全检出货，不良品无条件补发' },
  { icon: '🚚', title: '发货迅速', desc: '现货 48 小时内发出，定制按期交付' }
]

module.exports = { banners, categories, products, stats, advantages }
