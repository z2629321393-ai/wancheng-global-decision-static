import { getIndustry } from './industry-taxonomy.js';
import { labelFor, labelsFor } from './schema.js';

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));
const hasAny = (values, candidates) => candidates.some((item) => values.includes(item));
const isClear = (values, unclear) => values.length > 0 && !values.includes(unclear);
const hasProductType = (answers, ...types) => hasAny(answers.productTypes || [], types);

function pushReason(reasons, type, title, explanation) {
  if (!reasons.some((item) => item.title === title)) reasons.push({ type, title, explanation });
}

function calculateScores(a, tags) {
  const b2b = a.businessModel === 'b2b' || a.businessModel === 'mixed';
  const b2c = a.businessModel === 'b2c' || a.businessModel === 'mixed';
  const marketClear = isClear(a.targetMarkets, 'unsure');
  const customerClear = isClear(a.customerTypes, 'unclear');
  const hasTeam = !['none', 'recruiting'].includes(a.teamStatus);
  const productClear = (a.productTypes || []).length > 0 && !(a.productTypes.length === 1 && a.productTypes.includes('other'));
  const highValue = ['10k-100k', '100k-500k', 'over-500k', 'varies'].includes(a.orderValue);
  const longCycle = ['1-3m', '3-6m', 'over-6m'].includes(a.decisionCycle);
  const technicalProduct = tags.includes('technical') || tags.includes('B2B-heavy') || hasProductType(a, 'custom', 'oem-odm');
  const certificationReady = ['complete', 'core-markets', 'not-required'].includes(a.certificationStatus);
  const hasChannelExperience = !a.currentChannels.includes('none') && a.currentChannels.length > 0;

  let readiness = 18;
  readiness += a.productName ? 11 : 4;
  readiness += productClear ? 8 : 2;
  readiness += marketClear ? 15 : 0;
  readiness += a.targetCountries ? 4 : 0;
  readiness += customerClear ? 15 : 0;
  readiness += certificationReady ? 10 : a.certificationStatus === 'partial' ? 5 : 0;
  readiness += hasTeam ? 10 : a.teamStatus === 'recruiting' ? 4 : 0;
  readiness += a.responseAbility === 'yes' ? 9 : a.responseAbility === 'mostly' ? 6 : a.responseAbility === 'unstable' ? 2 : 0;
  readiness += hasChannelExperience ? 5 : 1;

  let overseasFit = 31;
  overseasFit += a.productName ? 7 : 0;
  overseasFit += productClear ? 5 : 0;
  overseasFit += marketClear ? 12 : -8;
  overseasFit += customerClear ? 12 : -8;
  overseasFit += certificationReady ? 9 : a.certificationStatus === 'partial' ? 3 : -5;
  overseasFit += hasTeam ? 9 : -7;
  overseasFit += a.responseAbility === 'yes' || a.responseAbility === 'mostly' ? 7 : -4;
  overseasFit += highValue ? 6 : 2;
  overseasFit += hasChannelExperience ? 4 : 0;
  overseasFit += a.launchTimeline === 'now' ? 5 : a.launchTimeline === 'research' ? -2 : 2;

  let siteFit = 18;
  siteFit += b2b ? 17 : 5;
  siteFit += technicalProduct ? 13 : 3;
  siteFit += hasProductType(a, 'oem-odm', 'custom') ? 11 : 0;
  siteFit += highValue ? 9 : 0;
  siteFit += longCycle ? 7 : 0;
  siteFit += marketClear ? 7 : -10;
  siteFit += customerClear ? 7 : -10;
  siteFit += productClear ? 6 : 0;
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
  searchFit += productClear ? 7 : -3;
  searchFit += a.currentChannels.includes('website') || a.currentChannels.includes('seo') || a.currentChannels.includes('google-ads') ? 5 : 0;

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
  socialFit += longCycle && b2b ? 7 : 0;
  socialFit += a.currentChannels.includes('facebook') || a.currentChannels.includes('linkedin') || a.currentChannels.includes('instagram') || a.currentChannels.includes('youtube') || a.currentChannels.includes('tiktok') ? 8 : 0;
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
  if (!a.productName) missing.push('确定主推产品优先级，并明确首阶段重点推广的产品 / 服务');
  if (!isClear(a.targetMarkets, 'unsure')) missing.push('确定首个重点市场或 1—3 个验证国家');
  if (!isClear(a.customerTypes, 'unclear')) missing.push('明确目标客户类型与采购角色');
  if (['none', 'unclear'].includes(a.certificationStatus)) missing.push('核对目标市场所需的出口与认证条件');
  if (a.teamStatus === 'none') missing.push('明确海外询盘的接收、回复与持续跟进负责人');
  if (['unstable', 'no'].includes(a.responseAbility)) missing.push('建立海外询盘 24—48 小时内响应机制');
  if (hasAny(a.currentChannels, ['website', 'seo', 'google-ads', 'facebook', 'linkedin']) && hasAny([a.currentProblem], ['unstable', 'ads-unclear', 'seo-no-client', 'social-no-client'])) {
    missing.push('把网站、广告、社媒与询盘数据放到同一套口径中复盘');
  }
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
    pushReason(reasons, 'warning', '主推产品还不够明确', '海外推广应先确定主推产品优先级，否则独立站、Google广告和海外社媒都会失去焦点。');
  }

  if (marketClear) {
    pushReason(reasons, 'positive', '目标市场已有范围', `当前重点考虑${labelsFor('targetMarkets', a.targetMarkets).join('、')}，可以继续细化国家、语言和合规要求。`);
  } else {
    pushReason(reasons, 'warning', '首个验证市场尚未确定', '建议先选一个重点市场验证，不要在第一阶段同时覆盖全球。');
  }

  if (customerClear) {
    pushReason(reasons, 'positive', '客户画像可以继续落地', `目标客户包含${labelsFor('customerTypes', a.customerTypes).join('、')}，适合据此设计页面、关键词，以及Facebook或LinkedIn的内容受众。`);
  } else {
    pushReason(reasons, 'warning', '目标客户仍然模糊', '需要先说清楚谁会采购、谁会使用、谁会影响决策，才能选择正确渠道。');
  }

  if (b2b && (scores.searchFit >= 60 || scores.outboundFit >= 60)) {
    pushReason(reasons, 'positive', 'B2B 产品适合建立长期获客资产', '独立站与Google搜索负责承接采购需求，LinkedIn和海外社媒持续建立专业信任，适合形成长期组合运营。');
  }

  if (['complete', 'core-markets', 'not-required'].includes(a.certificationStatus)) {
    pushReason(reasons, 'positive', '出口基础条件相对清晰', '可以把认证、质量控制和适用市场作为信任证明，但具体合规仍需按国家和产品核验。');
  } else if (['none', 'unclear'].includes(a.certificationStatus)) {
    pushReason(reasons, 'warning', '出口条件需要优先核对', '这不会直接否定出海，但应在广告或大规模建站投入前确认目标市场要求。');
  }

  const activeChannels = a.currentChannels.filter((item) => item !== 'none');
  if (!activeChannels.length) {
    pushReason(reasons, 'info', '还没有形成固定的海外获客渠道', '这反而适合先做方向判断，再选择一个主渠道验证，避免网站、广告和社媒同时开工却没有重点。');
  } else if (activeChannels.length >= 3 && hasAny([a.currentProblem], ['dont-know-start', 'unstable', 'ads-unclear', 'seo-no-client', 'social-no-client'])) {
    pushReason(reasons, 'warning', '渠道不少，但缺少统一主线', `你已经使用${labelsFor('currentChannels', activeChannels).join('、')}，当前更需要统一目标、承接页面与数据口径，而不是继续增加新平台。`);
  } else {
    pushReason(reasons, 'info', '已经积累了真实渠道反馈', `你正在使用${labelsFor('currentChannels', activeChannels).join('、')}，这些数据可用于判断哪条渠道值得继续代运营、哪条需要暂停或重做。`);
  }

  if (a.teamStatus === 'none' || a.responseAbility === 'no') {
    pushReason(reasons, 'warning', '客户承接机制暂时偏弱', '代运营可以负责获客与渠道执行，但企业内部仍要明确由谁接收、回复和推进商机，否则流量很难沉淀为有效机会。');
  } else {
    pushReason(reasons, 'positive', '具备基础客户承接能力', `当前由“${labelFor('teamStatuses', a.teamStatus)}”承接，适合与代运营团队建立线索交接、询盘分层和持续跟进机制。`);
  }

  if (tags.includes('certification-sensitive')) {
    pushReason(reasons, 'info', '所在行业对合规信任较敏感', '建议在目标市场确认后核验认证边界，并在网站中清晰展示已获得且可公开的资质。');
  }
  return reasons.slice(0, 8);
}

const ISSUE_MAP = {
  'dont-know-start': ['路径定位问题', '先排清产品、市场和客户', '先确定主推产品、重点市场和目标客户，再判断渠道的优先级，避免网站、广告和社媒同时投入却彼此脱节。'],
  'no-traffic': ['流量入口问题', '网站缺少稳定的精准访问', '网站本身不是流量来源，需要由Google搜索、SEO与海外社媒持续带来目标客户，再判断哪些访问真正接近采购需求。'],
  'traffic-no-leads': ['信任与转化问题', '访问没有转化成询盘', '此时继续加流量往往只会放大浪费，应先重做价值表达、产品证据、应用场景、案例与询盘路径。'],
  'low-quality-leads': ['客户匹配问题', '询盘数量不等于客户质量', '关键词、广告受众和页面表达可能过宽，需要围绕目标客户重新筛选，让渠道带来的访问更接近真实采购者。'],
  'leads-no-sales': ['筛选与跟进问题', '有询盘但成交链路不顺', '需要一起检查客户匹配、报价逻辑、信任证据、响应速度与持续跟进，不能简单归因于销售能力或继续加广告。'],
  unstable: ['渠道组合问题', '客户来源没有形成稳定系统', '单一平台偶尔来客户不等于稳定获客，需要让独立站、Google、海外社媒与线索跟进形成可复盘的组合。'],
  'ads-unclear': ['投放归因问题', '广告投入缺少清晰判断标准', '先把关键词、访问、询盘质量和销售反馈串起来，再判断是继续投、调整页面，还是更换市场与渠道。'],
  'seo-no-client': ['搜索意图与转化问题', '排名没有对应有效客户', '排名可能没有覆盖采购意图，也可能缺少承接与信任内容，应同时复核关键词、页面和询盘路径。'],
  'social-no-client': ['社媒承接问题', '有曝光，却没有进入客户链路', 'Facebook、LinkedIn等平台不能只看播放和粉丝，内容需要指向明确产品与场景，并由独立站和跟进机制接住。'],
  'expo-no-follow': ['客户沉淀问题', '展会线索没有持续转化', '展会后的客户需要分层、内容触达与持续跟进，线上渠道应承担会后信任补充，而不是让名片停在表格里。'],
  'new-market': ['市场验证问题', '新市场需要小步验证', '先核验需求、竞争与合规，再用轻量承接页配合Google或海外社媒验证，不宜一开始全面铺开。'],
  'build-brand': ['品牌资产问题', '海外品牌需要长期信任建设', '独立站、Google搜索、Facebook或LinkedIn内容与客户体验需要围绕统一价值主张持续运营。'],
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
    if (hasProductType(a, 'oem-odm')) type = 'B2B营销型网站';
    else if (b2c) {
      type = a.businessModel === 'b2c' ? '品牌内容 + 商城混合站' : '品牌官网';
    } else if (hasProductType(a, 'custom')) type = 'B2B解决方案营销型网站';
    else if (a.targetMarkets.includes('global') || a.targetMarkets.length >= 3) type = '多市场多语言官网';
    else if (hasProductType(a, 'standard-industrial')) type = '产品目录型工业营销站';
    else if (b2b) type = 'B2B营销型独立站';
    else type = '品牌官网';
  }

  const modules = new Set(['品牌价值主张', '产品分类', '核心产品', '应用场景', '生产能力', '工厂实力', '质量控制', 'FAQ', '联系我们', 'RFQ / 询盘']);
  if (hasProductType(a, 'standard-industrial', 'custom', 'oem-odm')) {
    ['产品参数', '解决方案', '认证资质', '资料下载'].forEach((item) => modules.add(item));
  }
  if (hasProductType(a, 'custom')) ['定制流程', '研发能力', '打样', '交付流程'].forEach((item) => modules.add(item));
  if (hasProductType(a, 'oem-odm')) ['定制流程', '研发能力', '打样', 'MOQ', '产能', '交付流程'].forEach((item) => modules.add(item));
  if (hasAny(a.customerTypes, ['distributor', 'agent'])) ['经销商政策', '市场支持', '合作流程'].forEach((item) => modules.add(item));
  if (b2c) ['产品详情', '价格', '支付', '物流', '退换', '评价', '品牌内容'].forEach((item) => modules.add(item));
  modules.add('项目 / 客户案例');

  const reason = scores.siteFit >= 72
    ? '你的产品、客户和采购过程需要较强的信息承接与信任证明，网站应成为Google搜索、Facebook或LinkedIn社媒及展会流量的统一落点。'
    : scores.siteFit >= 52
      ? '网站具有承接价值，但应先收紧产品、市场或客户定位，再确定栏目和语言范围。'
      : '现阶段先用单市场、单产品的轻量页面验证需求，确认方向后再扩展完整网站。';
  return { type, reason, modules: [...modules] };
}

function buildChannels(a, scores) {
  const b2b = a.businessModel === 'b2b' || a.businessModel === 'mixed';
  const b2c = a.businessModel === 'b2c' || a.businessModel === 'mixed';
  const search = {
    key: 'search', channel: '独立站 + Google搜索运营', score: scores.searchFit,
    reason: scores.searchFit >= 60
      ? '产品具备被海外客户搜索和比较的条件，适合用独立站承接明确采购意图，并通过Google广告与SEO持续验证。'
      : '搜索仍可作为验证渠道，但应先收紧主推产品、市场和客户，再决定建站与投放范围。',
    firstActions: ['完成主推产品关键词与竞争页面调研', '规划独立站或单产品承接页的转化结构', '用小规模Google Ads验证高意图关键词与目标市场', '根据真实搜索数据持续优化SEO内容与页面'],
    avoidForNow: ['一开始铺大量泛关键词', '页面内容不足时盲目加大广告预算', '只看点击和排名，不看有效询盘质量'],
  };
  const social = {
    key: 'social',
    channel: b2c ? 'Facebook / Instagram社媒运营' : 'LinkedIn / Facebook社媒运营',
    score: scores.socialFit,
    reason: b2c
      ? '视觉内容更容易帮助产品建立认知，可优先从Facebook或Instagram验证受众与内容，再由落地页承接。'
      : 'B2B社媒适合持续展示专业能力、制造过程与应用价值，为长决策客户补充信任，并给独立站带来有效触达。',
    firstActions: b2c
      ? ['确定Facebook或Instagram中的首个重点平台', '建立场景、差异与使用价值三类内容支柱', '让内容和广告统一指向同一落地页并追踪有效动作']
      : ['确定LinkedIn或Facebook的首个重点平台与目标受众', '建立产品、应用、工厂能力和行业判断四类内容支柱', '让社媒内容指向对应产品页、案例页或询盘入口'],
    avoidForNow: ['同时运营所有平台', '只看播放和粉丝，不看客户质量', '把B2B社媒简单理解为日常发帖'],
  };
  const customerDevelopment = {
    key: 'outbound', channel: 'LinkedIn客户开发与跟进运营', score: scores.outboundFit,
    reason: scores.outboundFit >= 60
      ? '目标客户可以被定义和筛选，适合把LinkedIn客户识别、沟通节奏与后续跟进作为搜索和社媒之外的补充路径。'
      : '这条路径应放在客户画像、网站承接和内部跟进人明确之后，再考虑扩大执行量。',
    firstActions: ['围绕目标客户建立筛选标准与优先级', '准备与不同采购角色匹配的沟通内容', '建立线索交接、分层记录与二次跟进机制'],
    avoidForNow: ['购买名单后无差别群发', '只追求触达数量', '没有网站或资料承接就高频联系'],
  };

  const primaryChannels = [search, social].sort((x, y) => y.score - x.score || (x.key === 'search' ? -1 : 1));
  return [...primaryChannels, customerDevelopment].map((item, index) => ({ ...item, priority: index + 1 }));
}

function buildServiceMode(a, scores, channels) {
  const b2c = a.businessModel === 'b2c' || a.businessModel === 'mixed';
  if (scores.overseasFit < 45 || scores.readiness < 42) {
    return {
      title: '出海定位 + 轻量渠道验证',
      reason: '现在不适合把网站、广告和社媒一次性全部铺开。更合适的方式是先完成市场与客户判断，再用一个承接页和一个主渠道验证。',
      scope: ['产品与市场定位', '竞争与渠道调研', '单产品承接页', '首个渠道小步验证'],
    };
  }

  const top = channels[0];
  const second = channels[1];
  if (top.key === 'search' && second.score >= 58) {
    return {
      title: '独立站承接 + Google / 海外社媒组合代运营',
      reason: '你的业务既需要承接明确采购搜索，也需要通过海外社媒持续建立信任。建议先统一网站与内容定位，再按数据分配渠道投入。',
      scope: ['独立站或落地页策划', 'Google广告与SEO运营', 'Facebook / LinkedIn内容运营', '询盘与渠道数据复盘'],
    };
  }
  if (top.key === 'social') {
    return {
      title: b2c ? 'Facebook / Instagram社媒代运营' : 'LinkedIn / Facebook社媒代运营',
      reason: '你的产品更依赖视觉展示、行业认知或持续信任，适合先用一个重点社媒平台验证内容与受众，再连接网站承接。',
      scope: ['平台与受众定位', '内容栏目与素材规划', '账号持续运营', '落地页与有效线索复盘'],
    };
  }
  return {
    title: '独立站 + Google搜索代运营',
    reason: '你的产品更适合被有明确需求的海外客户搜索和比较，应先把独立站承接与Google搜索验证做扎实，再逐步增加海外社媒。',
    scope: ['网站定位与结构', '高意图关键词调研', 'Google广告小步验证', 'SEO内容与询盘优化'],
  };
}

function buildPlan(a, channels, missing) {
  const day1to30 = [];
  if (!a.productName) day1to30.push('确定主推产品优先级');
  else day1to30.push(`确定“${a.productName}”的主推优先级，并梳理核心卖点与客户证据`);
  if (!isClear(a.targetMarkets, 'unsure')) day1to30.push('选择首个重点市场并完成基础需求、竞争和合规核验');
  else day1to30.push(`验证${labelsFor('targetMarkets', a.targetMarkets).join('、')}市场反响，进一步调整重点国家与渠道投入`);
  if (!isClear(a.customerTypes, 'unclear')) day1to30.push('明确目标客户、采购角色、使用者与决策者');
  else day1to30.push(`围绕${labelsFor('customerTypes', a.customerTypes).join('、')}梳理客户画像与采购问题`);
  day1to30.push('盘点现有网站、产品资料、案例、认证与可公开的工厂素材');
  day1to30.push('研究5—10家重点市场同行，确定承接页面与首个代运营渠道');

  const day31to60 = [];
  for (const channel of channels.slice(0, 2)) {
    if (channel.key === 'search') day31to60.push('上线核心产品承接页，由运营团队用小规模Google Ads验证高意图关键词');
    else if (channel.key === 'social') day31to60.push('按栏目持续运营Facebook / LinkedIn等重点平台，并让内容连接对应承接页');
    else day31to60.push('按客户优先级开展LinkedIn客户开发与跟进，并记录真实反馈');
  }
  day31to60.push('统一网站、广告、社媒、询盘和销售反馈的数据口径');
  day31to60.push('由运营团队根据访问与沟通反馈调整页面、内容和投放方向');

  const day61to90 = [
    '比较不同市场、关键词和客户类型的有效线索质量',
    '优化核心产品页、询盘入口与客户筛选信息',
    '建立运营团队与企业销售之间的线索交接和持续跟进节奏',
    '持续积累SEO内容、海外社媒内容、案例和常见问题资产',
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
  const serviceMode = buildServiceMode(answers, scores, channels);
  const missingConditions = buildMissing(answers);
  const plan90Days = buildPlan(answers, channels, missingConditions);
  const industryName = answers.industryCustom || industry.sub?.name || industry.main?.name || '制造业';
  const conclusion = verdicts.overseas === '适合启动海外推广'
    ? `${industryName}具备启动海外推广的基础，建议优先采用“${serviceMode.title}”，先跑通一个主渠道，再逐步形成稳定组合。`
    : verdicts.overseas === '适合小步验证'
      ? `${industryName}可以开始小步验证，建议先采用“${serviceMode.title}”，验证有效后再放大投入。`
      : `当前不是否定出海，而是建议先完成产品、市场、客户三项定位，再由专业团队进行轻量渠道验证。`;

  return {
    scores,
    verdicts,
    conclusion,
    primaryIssue: primaryIssue(answers.currentProblem),
    reasons,
    website,
    channels,
    serviceMode,
    plan90Days,
    missingConditions,
    meta: {
      industryName,
      industryMain: industry.main?.name || answers.industryCustom,
      industrySub: industry.sub?.name || '',
      productName: answers.productName || labelsFor('productTypes', answers.productTypes).join(' / '),
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
