import { getIndustry } from './industry-taxonomy.js';
import { labelFor, labelsFor } from './schema.js';

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));
const hasAny = (values, candidates) => candidates.some((item) => values.includes(item));
const isClear = (values, unclear) => values.length > 0 && !values.includes(unclear);

function pushReason(reasons, type, title, explanation) {
  if (!reasons.some((item) => item.title === title)) reasons.push({ type, title, explanation });
}

function calculateScores(a, tags) {
  const b2b = a.businessModel === 'b2b' || a.businessModel === 'mixed';
  const b2c = a.businessModel === 'b2c' || a.businessModel === 'mixed';
  const marketClear = isClear(a.targetMarkets, 'unsure');
  const customerClear = isClear(a.customerTypes, 'unclear');
  const hasTeam = !['none', 'recruiting'].includes(a.teamStatus);
  const hasEnglish = hasAny(a.contentAssets, ['english-product', 'english-company']);
  const hasTech = hasAny(a.contentAssets, ['datasheet', 'certificates', 'applications', 'technical-articles']);
  const hasFactory = hasAny(a.contentAssets, ['factory-photos', 'factory-video']);
  const hasVideo = hasAny(a.contentAssets, ['factory-video', 'product-video']);
  const highValue = ['10k-100k', '100k-500k', 'over-500k', 'varies'].includes(a.orderValue);
  const longCycle = ['1-3m', '3-6m', 'over-6m'].includes(a.decisionCycle);
  const technicalProduct = ['standard-industrial', 'machinery', 'components', 'custom', 'project'].includes(a.productType)
    || tags.includes('technical');
  const certificationReady = ['complete', 'core-markets', 'not-required'].includes(a.certificationStatus);

  let readiness = 14;
  readiness += a.productName ? 10 : 2;
  readiness += a.productType && a.productType !== 'other' ? 7 : 2;
  readiness += marketClear ? 12 : 0;
  readiness += a.targetCountries ? 4 : 0;
  readiness += customerClear ? 12 : 0;
  readiness += certificationReady ? 10 : a.certificationStatus === 'partial' ? 5 : 0;
  readiness += a.contentAssets.includes('none') ? 0 : Math.min(23, a.contentAssets.length * 3);
  readiness += hasTeam ? 8 : a.teamStatus === 'recruiting' ? 3 : 0;
  readiness += a.responseAbility === 'yes' ? 7 : a.responseAbility === 'mostly' ? 5 : a.responseAbility === 'unstable' ? 2 : 0;

  let overseasFit = 31;
  overseasFit += a.productName ? 7 : 0;
  overseasFit += marketClear ? 12 : -8;
  overseasFit += customerClear ? 12 : -8;
  overseasFit += certificationReady ? 9 : a.certificationStatus === 'partial' ? 3 : -5;
  overseasFit += hasTeam ? 9 : -7;
  overseasFit += a.responseAbility === 'yes' || a.responseAbility === 'mostly' ? 7 : -4;
  overseasFit += highValue ? 6 : 2;
  overseasFit += hasEnglish ? 6 : 0;
  overseasFit += a.launchTimeline === 'now' ? 5 : a.launchTimeline === 'research' ? -2 : 2;

  let siteFit = 18;
  siteFit += b2b ? 17 : 5;
  siteFit += technicalProduct ? 13 : 3;
  siteFit += ['oem-odm', 'custom', 'project'].includes(a.productType) ? 11 : 0;
  siteFit += highValue ? 9 : 0;
  siteFit += longCycle ? 7 : 0;
  siteFit += marketClear ? 7 : -10;
  siteFit += customerClear ? 7 : -10;
  siteFit += hasTech ? 5 : 0;
  siteFit += hasFactory ? 4 : 0;
  siteFit += certificationReady ? 5 : a.certificationStatus === 'none' ? -5 : 0;
  siteFit += hasTeam ? 5 : -8;
  siteFit += tags.includes('search-friendly') ? 6 : 0;
  if (b2c && a.orderValue === 'under-1k' && !marketClear) siteFit -= 10;

  let searchFit = 20;
  searchFit += tags.includes('search-friendly') ? 17 : 0;
  searchFit += b2b ? 13 : 5;
  searchFit += technicalProduct ? 11 : 0;
  searchFit += a.productName ? 8 : 0;
  searchFit += highValue ? 8 : 2;
  searchFit += marketClear ? 8 : -8;
  searchFit += hasEnglish ? 7 : -3;
  searchFit += hasTech ? 5 : 0;

  let outboundFit = 17;
  outboundFit += b2b ? 22 : -6;
  outboundFit += tags.includes('outbound-friendly') ? 13 : 0;
  outboundFit += customerClear ? 15 : -10;
  outboundFit += highValue ? 9 : 0;
  outboundFit += longCycle ? 7 : 0;
  outboundFit += hasTeam ? 8 : -7;
  outboundFit += marketClear ? 7 : -5;

  let socialFit = 20;
  socialFit += b2c ? 19 : 4;
  socialFit += tags.includes('social-friendly') ? 15 : 0;
  socialFit += tags.includes('visual-product') ? 12 : 0;
  socialFit += hasVideo ? 11 : 0;
  socialFit += a.contentAssets.includes('applications') ? 7 : 0;
  socialFit += longCycle && b2b ? 7 : 0;
  socialFit += hasFactory ? 5 : 0;
  socialFit += marketClear ? 5 : -4;

  return {
    overseasFit: clamp(overseasFit),
    siteFit: clamp(siteFit),
    readiness: clamp(readiness),
    searchFit: clamp(searchFit),
    outboundFit: clamp(outboundFit),
    socialFit: clamp(socialFit),
  };
}

function overseasVerdict(score) {
  if (score >= 70) return '适合启动海外推广';
  if (score >= 45) return '适合小步验证';
  return '建议先补基础条件';
}

function siteVerdict(score) {
  if (score >= 72) return 'A：建议优先建设';
  if (score >= 52) return 'B：适合建设，但要先明确定位';
  if (score >= 35) return 'C：建议先做轻量 Landing Page 验证';
  return 'D：当前暂不建议优先投入完整独立站';
}

function buildMissing(a) {
  const missing = [];
  if (!a.productName) missing.push('明确 1—3 个主推产品及其优先级');
  if (!isClear(a.targetMarkets, 'unsure')) missing.push('确定首个重点市场或 1—3 个验证国家');
  if (!isClear(a.customerTypes, 'unclear')) missing.push('明确目标客户类型与采购角色');
  if (['none', 'unclear'].includes(a.certificationStatus)) missing.push('核对目标市场所需的出口与认证条件');
  if (!hasAny(a.contentAssets, ['english-product', 'english-company'])) missing.push('补齐英文产品资料与公司介绍');
  if (!a.contentAssets.includes('datasheet') && ['standard-industrial', 'machinery', 'components', 'custom', 'project'].includes(a.productType)) {
    missing.push('整理产品参数、选型信息或 Datasheet');
  }
  if (!hasAny(a.contentAssets, ['factory-photos', 'factory-video'])) missing.push('补充可公开的工厂、产线与生产能力素材');
  if (a.teamStatus === 'none') missing.push('明确海外询盘的接收、回复与持续跟进负责人');
  if (['unstable', 'no'].includes(a.responseAbility)) missing.push('建立海外询盘 24—48 小时内响应机制');
  return missing;
}

function buildReasons(a, tags, scores) {
  const reasons = [];
  const b2b = a.businessModel === 'b2b' || a.businessModel === 'mixed';
  const marketClear = isClear(a.targetMarkets, 'unsure');
  const customerClear = isClear(a.customerTypes, 'unclear');

  if (a.productName) {
    pushReason(reasons, 'positive', '主推产品已有明确方向', `你填写了“${a.productName}”，后续可以围绕具体产品验证市场需求，而不是泛泛宣传整个工厂。`);
  } else {
    pushReason(reasons, 'warning', '主推产品还不够明确', '海外推广应先选择 1—3 个最有竞争力的产品，否则网站、广告和开发名单都会失去焦点。');
  }

  if (marketClear) {
    pushReason(reasons, 'positive', '目标市场已有范围', `当前重点考虑${labelsFor('targetMarkets', a.targetMarkets).join('、')}，可以继续细化国家、语言和合规要求。`);
  } else {
    pushReason(reasons, 'warning', '首个验证市场尚未确定', '建议先选一个重点市场验证，不要在第一阶段同时覆盖全球。');
  }

  if (customerClear) {
    pushReason(reasons, 'positive', '客户画像可以继续落地', `目标客户包含${labelsFor('customerTypes', a.customerTypes).join('、')}，适合据此设计页面、关键词与主动开发名单。`);
  } else {
    pushReason(reasons, 'warning', '目标客户仍然模糊', '需要先说清楚谁会采购、谁会使用、谁会影响决策，才能选择正确渠道。');
  }

  if (b2b && (scores.searchFit >= 60 || scores.outboundFit >= 60)) {
    pushReason(reasons, 'positive', 'B2B 产品适合建立长期获客资产', '搜索承接与精准主动开发可以互相补充，独立站负责证明专业度并接住多个来源的访问。');
  }

  if (['complete', 'core-markets', 'not-required'].includes(a.certificationStatus)) {
    pushReason(reasons, 'positive', '出口基础条件相对清晰', '可以把认证、质量控制和适用市场作为信任证明，但具体合规仍需按国家和产品核验。');
  } else if (['none', 'unclear'].includes(a.certificationStatus)) {
    pushReason(reasons, 'warning', '出口条件需要优先核对', '这不会直接否定出海，但应在广告或大规模建站投入前确认目标市场要求。');
  }

  if (a.contentAssets.includes('none')) {
    pushReason(reasons, 'warning', '英文内容资产准备不足', '网站不是先搭一个空壳；产品参数、英文资料、工厂素材和应用场景应先形成最小可用内容包。');
  } else if (a.contentAssets.length >= 6) {
    pushReason(reasons, 'positive', '内容资产具备较好基础', '现有资料可以支撑产品页、实力页和信任内容，下一步重点是按客户决策过程重新组织。');
  } else {
    pushReason(reasons, 'info', '已有部分素材，但仍需补齐', '建议优先补客户判断供应商时最关心的参数、场景、认证、生产能力和交付信息。');
  }

  if (a.teamStatus === 'none' || a.responseAbility === 'no') {
    pushReason(reasons, 'warning', '客户承接机制暂时偏弱', '引流前要先明确由谁回复、如何记录和如何二次跟进，否则流量很难沉淀为有效机会。');
  } else {
    pushReason(reasons, 'positive', '具备基础客户承接能力', `当前由“${labelFor('teamStatuses', a.teamStatus)}”承接，可同步建立询盘分层与持续跟进流程。`);
  }

  if (tags.includes('certification-sensitive')) {
    pushReason(reasons, 'info', '所在行业对合规信任较敏感', '建议在目标市场确认后核验认证边界，并在网站中清晰展示已获得且可公开的资质。');
  }
  return reasons.slice(0, 8);
}

const ISSUE_MAP = {
  'dont-know-start': ['路径定位问题', '先排清产品、市场和客户', '当前不要急着铺渠道。先选主推产品、重点市场和目标客户，再判断建站与推广顺序。'],
  'no-traffic': ['流量问题', '网站缺少稳定的精准访问', '重点检查搜索曝光、广告、SEO 与主动开发的数量和精准度。'],
  'traffic-no-leads': ['信任与转化问题', '访问没有转化成询盘', '应检查价值表达、产品参数、应用场景、认证、案例、页面速度和询盘入口。'],
  'low-quality-leads': ['客户匹配问题', '询盘数量不等于客户质量', '应收紧关键词和客户画像，并通过页面信息与表单问题提前筛选。'],
  'leads-no-sales': ['筛选与跟进问题', '有询盘但成交链路不顺', '需要检查客户匹配、报价逻辑、信任证据、响应速度与持续跟进，不能简单归因于销售能力。'],
  unstable: ['获客系统问题', '客户来源没有形成稳定组合', '应建立渠道组合、CRM、客户分层、二次开发和内容资产沉淀。'],
  'ads-unclear': ['投放归因问题', '广告投入缺少清晰判断标准', '先统一转化目标、关键词意图、线索质量与跟进结果，再决定是否放大预算。'],
  'seo-no-client': ['搜索意图与转化问题', '排名没有对应有效客户', '检查关键词是否接近采购需求，以及页面是否能证明能力并引导询盘。'],
  'social-no-client': ['内容承接问题', '社媒曝光没有进入客户链路', '应让内容指向明确的产品、应用或资料，并由网站与跟进机制承接。'],
  'expo-no-follow': ['客户沉淀问题', '展会线索没有持续跟进', '需按客户优先级整理资料、记录沟通节点，并建立二次触达节奏。'],
  'new-market': ['市场验证问题', '新市场需要小步验证', '先核验需求、竞争、认证与客户名单，再用轻量页面和小规模渠道测试。'],
  'build-brand': ['品牌资产问题', '海外品牌需要长期信任建设', '品牌官网、搜索内容、社媒表达与客户体验需要围绕统一价值主张持续积累。'],
};

function primaryIssue(problem) {
  const [type, title, explanation] = ISSUE_MAP[problem] || ISSUE_MAP['dont-know-start'];
  return { type, title, explanation };
}

function websiteRecommendation(a, scores) {
  const b2b = a.businessModel === 'b2b' || a.businessModel === 'mixed';
  const b2c = a.businessModel === 'b2c' || a.businessModel === 'mixed';
  let type = '单市场 Landing Page';

  if (scores.siteFit >= 35) {
    if (a.productType === 'oem-odm') type = 'OEM / ODM获客型网站';
    else if (b2c && ['branded-consumer', 'consumer'].includes(a.productType)) {
      type = a.businessModel === 'b2c' ? '品牌内容 + 商城混合站' : '品牌官网';
    } else if (['project', 'custom'].includes(a.productType)) type = 'B2B解决方案型网站';
    else if (a.targetMarkets.includes('global') || a.targetMarkets.length >= 3) type = '多市场多语言官网';
    else if (a.productType === 'components' || a.productType === 'standard-industrial') type = '产品目录型工业网站';
    else if (b2b) type = 'B2B营销型独立站';
    else type = '品牌官网';
  }

  const modules = new Set(['品牌价值主张', '产品分类', '核心产品', '应用场景', '生产能力', '工厂实力', '质量控制', 'FAQ', '联系我们', 'RFQ / 询盘']);
  if (['standard-industrial', 'machinery', 'components', 'custom', 'project'].includes(a.productType)) {
    ['产品参数', '解决方案', '认证资质', '资料下载'].forEach((item) => modules.add(item));
  }
  if (a.productType === 'machinery') ['选型', '售后支持', '安装', '行业解决方案'].forEach((item) => modules.add(item));
  if (a.productType === 'oem-odm') ['定制流程', '研发能力', '打样', 'MOQ', '产能', '交付流程'].forEach((item) => modules.add(item));
  if (hasAny(a.customerTypes, ['distributor', 'agent'])) ['经销商政策', '市场支持', '合作流程'].forEach((item) => modules.add(item));
  if (b2c) ['产品详情', '价格', '支付', '物流', '退换', '评价', '品牌内容'].forEach((item) => modules.add(item));
  if (hasAny(a.contentAssets, ['customer-cases', 'project-cases'])) modules.add('项目 / 客户案例');

  const reason = scores.siteFit >= 72
    ? '你的产品、客户和采购过程需要较强的信息承接与信任证明，网站应成为搜索、主动开发、社媒和展会流量的统一落点。'
    : scores.siteFit >= 52
      ? '网站具有承接价值，但应先收紧产品、市场或客户定位，再确定栏目和语言范围。'
      : '现阶段先用单市场、单产品的轻量页面验证需求，确认方向后再扩展完整网站。';
  return { type, reason, modules: [...modules] };
}

function buildChannels(a, scores) {
  const b2b = a.businessModel === 'b2b' || a.businessModel === 'mixed';
  const b2c = a.businessModel === 'b2c' || a.businessModel === 'mixed';
  const items = [
    {
      key: 'search', channel: '搜索获客', score: scores.searchFit,
      reason: scores.searchFit >= 60
        ? '产品具备被海外客户主动搜索和比较的条件，适合用页面承接明确采购意图。'
        : '搜索仍可作为验证渠道，但需要先明确产品词、市场和英文内容。',
      firstActions: ['围绕 1—3 个主推产品建立英文承接页', '整理采购意图明确的核心关键词', '用小规模 Google Ads 验证关键词与市场', '同步积累可长期复用的 SEO 内容'],
      avoidForNow: ['一开始铺大量泛关键词', '在页面内容不足时追求大量流量', '把排名或询盘数量当作保证结果'],
    },
    {
      key: 'outbound', channel: '主动开发', score: scores.outboundFit,
      reason: scores.outboundFit >= 60
        ? '目标客户可被定义和筛选，适合通过 LinkedIn、行业数据库、名单和邮件开展针对性触达。'
        : '主动开发要等客户画像和承接人员更清晰后再放量。',
      firstActions: ['定义 ICP 与采购角色', '建立首批 50—100 家目标客户名单', '准备针对不同客户类型的开发信息', '用 CRM 记录分层、沟通与二次跟进'],
      avoidForNow: ['购买名单后无差别群发', '只追求发送数量', '没有网站或资料承接就高频触达'],
    },
    {
      key: 'social', channel: b2c ? '海外社媒与内容' : '社媒与信任培育', score: scores.socialFit,
      reason: b2c
        ? '视觉内容可帮助产品触达消费者并建立品牌认知，应根据市场选择 TikTok、Instagram、Facebook 或 YouTube。'
        : 'B2B 社媒更适合展示专业能力、制造过程与应用价值，为长决策客户提供持续信任。',
      firstActions: b2c
        ? ['确定一个核心平台与内容形式', '围绕场景、差异和使用价值制作素材', '用落地页或商城承接流量']
        : ['优先建设 LinkedIn 企业与核心人员形象', '用 YouTube / Facebook 沉淀工厂、产品和应用内容', '让内容指向明确产品页或资料入口'],
      avoidForNow: ['同时运营所有平台', '只看播放和粉丝，不看客户质量', '把 B2B 社媒简单理解为涨粉'],
    },
  ];

  return items
    .sort((x, y) => y.score - x.score || ['search', 'outbound', 'social'].indexOf(x.key) - ['search', 'outbound', 'social'].indexOf(y.key))
    .map((item, index) => ({
      channel: item.channel,
      priority: index + 1,
      score: item.score,
      reason: item.reason,
      firstActions: item.firstActions,
      avoidForNow: item.avoidForNow,
    }));
}

function buildPlan(a, channels, missing) {
  const day1to30 = [];
  if (!a.productName) day1to30.push('确定 1—3 个主推产品，并明确各自优先级');
  else day1to30.push(`围绕“${a.productName}”整理核心卖点、参数与差异`);
  if (!isClear(a.targetMarkets, 'unsure')) day1to30.push('选择首个重点市场并完成基础需求、竞争和合规核验');
  else day1to30.push(`从${labelsFor('targetMarkets', a.targetMarkets).join('、')}中确定首个验证市场`);
  if (!isClear(a.customerTypes, 'unclear')) day1to30.push('明确 ICP、采购角色、使用者与决策者');
  else day1to30.push(`围绕${labelsFor('customerTypes', a.customerTypes).join('、')}形成客户画像与采购问题清单`);
  day1to30.push('整理英文产品资料、产品参数、认证与可公开的工厂素材');
  day1to30.push('研究 5—10 家重点市场同行并确定网站或 Landing Page 结构');

  const day31to60 = [];
  for (const channel of channels.slice(0, 2)) {
    if (channel.channel === '搜索获客') day31to60.push('上线核心产品承接页，并用小规模 Google Ads 验证高意图关键词');
    else if (channel.channel === '主动开发') day31to60.push('建立首批目标客户名单，开展分层 LinkedIn / 邮件触达并记录反馈');
    else day31to60.push('围绕产品、场景与制造实力发布首批海外社媒内容并连接承接页');
  }
  day31to60.push('统一线索来源、客户类型、回复时效和跟进状态的记录方式');
  day31to60.push('根据访问与沟通反馈调整页面价值表达和资料内容');

  const day61to90 = [
    '比较不同市场、关键词和客户类型的有效线索质量',
    '优化核心产品页、询盘入口与客户筛选信息',
    '建立 CRM 客户分层、二次跟进与内容触达节奏',
    '持续积累 SEO 内容、案例和常见问题资产',
    '放大已验证渠道，暂停低效且无法解释的投入',
  ];
  if (missing.length >= 5) day61to90.unshift('复核第一阶段缺失条件是否补齐，再决定是否扩大预算');
  return { day1to30: [...new Set(day1to30)], day31to60: [...new Set(day31to60)], day61to90: [...new Set(day61to90)] };
}

export function diagnose(answers) {
  const industry = getIndustry(answers.industryMain, answers.industrySub);
  const tags = industry.tags;
  const scores = calculateScores(answers, tags);
  const verdicts = { overseas: overseasVerdict(scores.overseasFit), website: siteVerdict(scores.siteFit) };
  const reasons = buildReasons(answers, tags, scores);
  const website = websiteRecommendation(answers, scores);
  const channels = buildChannels(answers, scores);
  const missingConditions = buildMissing(answers);
  const plan90Days = buildPlan(answers, channels, missingConditions);
  const industryName = answers.industryCustom || industry.sub?.name || industry.main?.name || '制造业';
  const conclusion = verdicts.overseas === '适合启动海外推广'
    ? `${industryName}具备启动海外推广的基础，建议先以“产品 + 市场 + 客户”定位为核心，按渠道优先级小步验证。`
    : verdicts.overseas === '适合小步验证'
      ? `${industryName}可以开始小步验证，但在放大投入前应先补齐关键定位与承接条件。`
      : `当前不是否定出海，而是建议先完成产品、市场、客户三项定位，再投入大规模推广。`;

  return {
    scores,
    verdicts,
    conclusion,
    primaryIssue: primaryIssue(answers.currentProblem),
    reasons,
    website,
    channels,
    plan90Days,
    missingConditions,
    meta: {
      industryName,
      industryMain: industry.main?.name || answers.industryCustom,
      industrySub: industry.sub?.name || '',
      productName: answers.productName || labelFor('productTypes', answers.productType),
      markets: labelsFor('targetMarkets', answers.targetMarkets),
      generatedBy: 'deterministic-rule-engine-v1',
    },
  };
}

export function recommendLeadGrade(answers, result) {
  let score = result.scores.readiness * 0.45 + result.scores.overseasFit * 0.25 + result.scores.siteFit * 0.15;
  if (answers.launchTimeline === 'now') score += 12;
  else if (answers.launchTimeline === '1-3m') score += 8;
  else if (answers.launchTimeline === '3-6m') score += 3;
  if (['mature', 'small'].includes(answers.teamStatus)) score += 6;
  if (answers.productName) score += 4;
  if (score >= 72) return 'A';
  if (score >= 48) return 'B';
  return 'C';
}
