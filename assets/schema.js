import { INDUSTRIES } from './industry-taxonomy.js';

const option = (value, label) => ({ value, label });

export const QUESTION_OPTIONS = Object.freeze({
  productTypes: [
    option('standard-industrial', '标品'), option('custom', '非标定制'),
    option('oem-odm', 'OEM / ODM'), option('other', '其他'),
  ],
  businessModels: [
    option('b2b', 'B2B 企业客户'), option('b2c', 'B2C 消费者'),
    option('mixed', 'B2B + B2C 都有'), option('unsure', '暂时不确定'),
  ],
  targetMarkets: [
    option('north-america', '北美'), option('europe', '欧洲'), option('southeast-asia', '东南亚'),
    option('middle-east', '中东'), option('africa', '非洲'), option('latin-america', '拉丁美洲'),
    option('japan-korea', '日韩'), option('russia-nearby', '俄罗斯及周边'),
    option('australia', '澳洲'), option('global', '全球市场'), option('unsure', '暂时没有确定'),
  ],
  customerTypes: [
    option('distributor', '经销商'), option('agent', '代理商'), option('wholesaler', '批发商'),
    option('brand', '品牌商'), option('buyer', '采购商'), option('overseas-manufacturer', '海外制造企业'),
    option('epc', '工程公司 / EPC'), option('project-owner', '建筑 / 项目方'),
    option('retailer', '零售商'), option('ecommerce-seller', '电商卖家'),
    option('enterprise-user', '终端企业'), option('consumer', '终端消费者'),
    option('government', '政府 / 公共机构'), option('unclear', '暂时说不清'), option('other', '其他'),
  ],
  orderValues: [
    option('under-1k', '1000元以内'), option('1k-10k', '1000—1万元'),
    option('10k-100k', '1万—10万元'), option('100k-500k', '10万—50万元'),
    option('over-500k', '50万元以上'), option('varies', '金额差异很大'), option('unclear', '暂时不清楚'),
  ],
  decisionCycles: [
    option('0-7d', '当天—7天'), option('1w-1m', '1周—1个月'), option('1-3m', '1—3个月'),
    option('3-6m', '3—6个月'), option('over-6m', '6个月以上'), option('unclear', '不确定'),
  ],
  certificationStatuses: [
    option('complete', '基本齐全'), option('core-markets', '核心市场已经具备'),
    option('partial', '部分具备，还需要补'), option('none', '目前没有准备'),
    option('not-required', '我的产品通常不需要特殊认证'), option('unclear', '不清楚需要什么认证'),
  ],
  contentAssets: [
    option('product-images', '高清产品图片'), option('datasheet', '产品参数 / Datasheet'),
    option('english-product', '英文产品资料'), option('english-company', '英文公司介绍'),
    option('factory-photos', '工厂 / 产线照片'), option('factory-video', '工厂视频'),
    option('certificates', '认证证书'), option('applications', '应用场景'),
    option('customer-cases', '客户案例'), option('project-cases', '项目案例'), option('faq', 'FAQ'),
    option('technical-articles', '技术文章'), option('product-video', '产品视频'),
    option('none', '以上几乎都没有'),
  ],
  currentChannels: [
    option('none', '还没有开始'), option('b2b-platform', '阿里国际站等B2B平台'),
    option('website', '英文官网 / 独立站'), option('seo', 'SEO'), option('google-ads', 'Google Ads'),
    option('facebook', 'Facebook'), option('linkedin', 'LinkedIn'), option('youtube', 'YouTube'),
    option('tiktok', 'TikTok'), option('instagram', 'Instagram'), option('email', '邮件开发'),
    option('industry-database', '行业数据库'), option('customs-data', '海关数据'),
    option('expo', '展会'), option('distributor', '经销商渠道'), option('other', '其他'),
  ],
  currentProblems: [
    option('dont-know-start', '不知道从哪里开始'), option('no-traffic', '网站做了但没人访问'),
    option('traffic-no-leads', '有人访问但没有询盘'), option('low-quality-leads', '有询盘但质量不高'),
    option('leads-no-sales', '有询盘但成交少'), option('unstable', '客户来源不稳定'),
    option('ads-unclear', '广告花钱但不知道效果'), option('seo-no-client', 'SEO有排名但没什么客户'),
    option('social-no-client', '社媒有播放但没有客户'), option('expo-no-follow', '展会后客户跟不下来'),
    option('new-market', '想开发新的海外市场'), option('build-brand', '想建立自己的海外品牌'),
  ],
  teamStatuses: [
    option('mature', '有成熟外贸团队'), option('small', '有1—2名外贸人员'),
    option('owner', '老板本人负责'), option('domestic-sales', '国内销售兼任'),
    option('recruiting', '正在招聘'), option('none', '暂时没有人'),
  ],
  responseAbilities: [
    option('yes', '可以'), option('mostly', '大多数可以'), option('unstable', '不稳定'), option('no', '目前做不到'),
  ],
  launchTimelines: [
    option('now', '准备马上开始'), option('1-3m', '1—3个月内'),
    option('3-6m', '3—6个月内'), option('research', '先了解一下'),
  ],
});

export const SOURCE_LABELS = Object.freeze({
  douyin: '抖音',
  xiaohongshu: '小红书',
  channels: '视频号',
  moments: '朋友圈',
  expo: '展会',
  other: '其他',
  unknown: '未知',
});

export const FOLLOW_STATUSES = Object.freeze([
  '新线索', '待联系', '已联系', '跟进中', '待二次跟进', '已转交', '已成交', '暂不跟进', '无效',
]);

export const LEAD_GRADES = Object.freeze(['A', 'B', 'C']);

function values(key) {
  return new Set(QUESTION_OPTIONS[key].map((item) => item.value));
}

const ALLOWED = Object.fromEntries(Object.keys(QUESTION_OPTIONS).map((key) => [key, values(key)]));

const LEGACY_PRODUCT_TYPE_MAP = Object.freeze({
  'standard-industrial': 'standard-industrial',
  machinery: 'standard-industrial',
  components: 'standard-industrial',
  'raw-material': 'standard-industrial',
  'branded-consumer': 'standard-industrial',
  consumer: 'standard-industrial',
  custom: 'custom',
  project: 'custom',
  'oem-odm': 'oem-odm',
  other: 'other',
});

export function labelFor(group, value) {
  return QUESTION_OPTIONS[group]?.find((item) => item.value === value)?.label || value || '';
}

export function labelsFor(group, selected = []) {
  return selected.map((value) => labelFor(group, value));
}

function cleanText(value, max = 120) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : '';
}

function cleanArray(value, allowed, max = 20) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item) => typeof item === 'string' && allowed.has(item)))].slice(0, max);
}

export function normalizeSource(value) {
  return Object.hasOwn(SOURCE_LABELS, value) ? value : 'unknown';
}

export function normalizeAnswers(input = {}) {
  const main = INDUSTRIES.find((item) => item.id === input.industryMain);
  const sub = main?.children?.find((item) => item.id === input.industrySub);
  const rawProductTypes = Array.isArray(input.productTypes)
    ? input.productTypes
    : input.productType
      ? [LEGACY_PRODUCT_TYPE_MAP[input.productType] || input.productType]
      : [];
  const productTypes = cleanArray(rawProductTypes, ALLOWED.productTypes, 4);
  let contentAssets = cleanArray(input.contentAssets, ALLOWED.contentAssets);
  let currentChannels = cleanArray(input.currentChannels, ALLOWED.currentChannels);
  if (contentAssets.includes('none')) contentAssets = ['none'];
  if (currentChannels.includes('none')) currentChannels = ['none'];

  return {
    industryMain: main?.id || '',
    industrySub: sub?.id || '',
    industryCustom: cleanText(input.industryCustom, 80),
    productTypes,
    productName: cleanText(input.productName, 120),
    businessModel: ALLOWED.businessModels.has(input.businessModel) ? input.businessModel : '',
    targetMarkets: cleanArray(input.targetMarkets, ALLOWED.targetMarkets),
    targetCountries: cleanText(input.targetCountries, 160),
    customerTypes: cleanArray(input.customerTypes, ALLOWED.customerTypes),
    orderValue: ALLOWED.orderValues.has(input.orderValue) ? input.orderValue : '',
    decisionCycle: ALLOWED.decisionCycles.has(input.decisionCycle) ? input.decisionCycle : '',
    certificationStatus: ALLOWED.certificationStatuses.has(input.certificationStatus) ? input.certificationStatus : '',
    contentAssets,
    currentChannels,
    currentProblem: ALLOWED.currentProblems.has(input.currentProblem) ? input.currentProblem : '',
    teamStatus: ALLOWED.teamStatuses.has(input.teamStatus) ? input.teamStatus : '',
    responseAbility: ALLOWED.responseAbilities.has(input.responseAbility) ? input.responseAbility : '',
    launchTimeline: ALLOWED.launchTimelines.has(input.launchTimeline) ? input.launchTimeline : '',
    source: normalizeSource(input.source),
  };
}

export function validateAnswers(input) {
  const answers = normalizeAnswers(input);
  const errors = {};
  if (!answers.industryMain) errors.industryMain = '请选择所属行业';
  if ((answers.industryMain === 'other-manufacturing' || answers.industrySub.endsWith('-other')) && !answers.industryCustom) {
    errors.industryCustom = '请填写您的细分行业';
  }
  if (!answers.productTypes.length) errors.productTypes = '请至少选择一项产品/服务特征';
  if (!answers.businessModel) errors.businessModel = '请选择商业模式';
  if (!answers.targetMarkets.length) errors.targetMarkets = '请至少选择一个目标市场状态';
  if (!answers.customerTypes.length) errors.customerTypes = '请至少选择一种目标客户';
  if (!answers.orderValue) errors.orderValue = '请选择典型订单金额';
  if (!answers.decisionCycle) errors.decisionCycle = '请选择采购决策周期';
  if (!answers.certificationStatus) errors.certificationStatus = '请选择认证与出口条件状态';
  if (!answers.currentChannels.length) errors.currentChannels = '请至少选择一项当前推广情况';
  if (!answers.currentProblem) errors.currentProblem = '请选择当前最大问题';
  if (!answers.teamStatus) errors.teamStatus = '请选择团队承接情况';
  if (!answers.responseAbility) errors.responseAbility = '请选择询盘响应能力';
  if (!answers.launchTimeline) errors.launchTimeline = '请选择计划启动时间';
  return { answers, errors, valid: Object.keys(errors).length === 0 };
}

export function publicOptions() {
  return {
    ...QUESTION_OPTIONS,
    sourceLabels: SOURCE_LABELS,
    followStatuses: FOLLOW_STATUSES,
    leadGrades: LEAD_GRADES,
  };
}
