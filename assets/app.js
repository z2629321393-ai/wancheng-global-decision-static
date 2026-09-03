import { INDUSTRIES } from './industry-taxonomy.js';
import { QUESTION_OPTIONS, normalizeAnswers, validateAnswers } from './schema.js';
import { diagnose } from './rule-engine.js';
import { createPdfObjectUrl, prepareReportPdf, releasePdfObjectUrl, savePreparedPdf } from './pdf-export.js';

const main = document.querySelector('#main');
const sales = Object.freeze({
  id: String(window.WC_SALES?.id || 'default'),
  accountName: String(window.WC_SALES?.accountName || '万成云商｜中国制造出海'),
  consultantName: String(window.WC_SALES?.consultantName || 'Cici｜企业出海顾问'),
  qrImage: String(window.WC_SALES?.qrImage || '').trim(),
});

const storagePrefix = `wc_static_${sales.id}`;
const storageKeys = {
  answers: `${storagePrefix}_answers`,
  step: `${storagePrefix}_step`,
  report: `${storagePrefix}_report`,
};

const questions = [
  { key: 'industry', stage: 0, title: '你的企业属于哪个行业？', description: '先确定行业与细分方向，系统会结合行业特征调整判断。' },
  { key: 'product', stage: 0, title: '你准备重点推广什么产品？', description: '海外推广最怕产品过多、重点不清。主推产品名称可以先写一个。' },
  { key: 'business', stage: 0, title: '你的主要商业模式是什么？', description: 'B2B 与 B2C 的网站、渠道和客户决策方式差别很大。' },
  { key: 'markets', stage: 1, title: '你优先考虑哪些海外市场？', description: '可以多选；如果尚未确定，也请如实选择。' },
  { key: 'customers', stage: 1, title: '你希望找到哪类海外客户？', description: '可以多选。越能说清目标客户，后续渠道判断越准确。' },
  { key: 'order', stage: 1, title: '典型单笔订单或客单价大约是多少？', description: 'B2B 请按典型订单或项目金额，B2C 请按典型客单价。' },
  { key: 'cycle', stage: 1, title: '客户通常需要多久作出采购决定？', description: '采购周期会影响网站内容、主动开发和信任培育的优先级。' },
  { key: 'certification', stage: 2, title: '认证与出口条件准备到哪一步？', description: '这里只判断准备度，不替代目标市场的专业合规核验。' },
  { key: 'assets', stage: 2, title: '你目前已经有哪些企业与产品资料？', description: '可以多选。请按目前真正可用于海外推广的资料填写。' },
  { key: 'channels', stage: 3, title: '你现在正在使用哪些海外推广方式？', description: '可以多选；如果还没有开始，选择“还没有开始”。' },
  { key: 'problem', stage: 3, title: '你当前最想解决的问题是什么？', description: '系统会据此判断问题更偏流量、转化、成交还是客户沉淀。' },
  { key: 'team', stage: 3, title: '你的团队能否承接海外客户？', description: '引流前先确认由谁接收、回复和持续跟进客户。' },
  { key: 'timeline', stage: 4, title: '你计划什么时候开始？', description: '最后一步。结果将在当前设备直接生成，无需提交联系方式。' },
];

const stageNames = ['企业基础', '产品与客户', '市场准备', '当前推广', '启动计划'];
let diagnosisSession = null;
let preparedPdf = null;
let preparedPdfUrl = '';
let pdfPreparation = null;
let pdfGenerationToken = 0;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}

function safeParse(value, fallback = {}) {
  try {
    return JSON.parse(value) || fallback;
  } catch {
    return fallback;
  }
}

function saveSession() {
  if (!diagnosisSession) return;
  localStorage.setItem(storageKeys.answers, JSON.stringify(diagnosisSession.answers));
  localStorage.setItem(storageKeys.step, String(diagnosisSession.step));
}

function setRoute(route) {
  const next = `#${route}`;
  if (location.hash === next) renderRoute();
  else location.hash = next;
}

function resetDiagnosis() {
  clearPreparedPdf();
  localStorage.removeItem(storageKeys.answers);
  localStorage.removeItem(storageKeys.step);
  localStorage.removeItem(storageKeys.report);
  diagnosisSession = null;
}

function clearPreparedPdf() {
  pdfGenerationToken += 1;
  releasePdfObjectUrl(preparedPdfUrl);
  preparedPdf = null;
  preparedPdfUrl = '';
  pdfPreparation = null;
}

function renderHome() {
  document.title = `${sales.accountName}｜企业出海决策系统`;
  main.innerHTML = `
    <section class="hero">
      <div class="shell hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">WANCHENG GLOBAL DECISION</p>
          <h1>你的企业，到底适不适合做<span>海外推广？</span></h1>
          <p class="hero-subtitle">3分钟判断独立站、Google、主动开发和海外社媒应该怎么排顺序。</p>
          <div class="hero-actions">
            <button class="button button-primary" data-go="diagnosis" type="button">开始免费诊断 <span aria-hidden="true">→</span></button>
            <a class="button button-secondary" href="#how-it-works">先看判断逻辑</a>
          </div>
          <div class="trust-line" aria-label="诊断说明">
            <span>结果直接免费展示</span><span>无需提交联系方式</span><span>给出具体判断依据</span>
          </div>
        </div>
        <aside class="decision-panel" aria-label="诊断输出预览">
          <p class="panel-kicker">不是简单打分，而是回答四个决策问题</p>
          <div class="decision-list">
            <div class="decision-row"><span class="decision-number">01</span><div><strong>现在是否适合启动海外推广</strong><small>结合产品、市场、客户与承接能力</small></div></div>
            <div class="decision-row"><span class="decision-number">02</span><div><strong>独立站应该优先、延后还是轻量验证</strong><small>不默认所有工厂都必须先建站</small></div></div>
            <div class="decision-row"><span class="decision-number">03</span><div><strong>搜索、主动开发、社媒怎么排顺序</strong><small>每条路径都说明原因与首个动作</small></div></div>
            <div class="decision-row"><span class="decision-number">04</span><div><strong>未来90天应该先做哪些动作</strong><small>按基础、验证、优化三个阶段执行</small></div></div>
          </div>
          <p class="panel-note">相同输入会得到相同结果；全部运算在当前设备完成，不会上传你填写的诊断内容。</p>
        </aside>
      </div>
    </section>

    <section id="how-it-works" class="content-section white">
      <div class="shell principle-grid">
        <div class="principle-copy">
          <p class="eyebrow">先定位，再选工具</p>
          <h2 class="section-title">不是所有工厂，<br>都应该先建网站。</h2>
          <p>独立站是承接工具，不是“做了就有客户”。只有先确定产品、市场和客户，才能继续判断 SEO、Google 广告、LinkedIn、主动开发和海外社媒应该怎么组合。</p>
        </div>
        <div class="question-stack">
          <article class="question-card"><span class="number">01</span><h3>你的产品卖什么？</h3><p>先选 1—3 个真正有竞争力、能被客户理解和比较的主推产品。</p></article>
          <article class="question-card"><span class="number">02</span><h3>你先做哪个市场？</h3><p>不同国家的需求、竞争、认证、语言和采购方式不同，第一阶段不必同时做全球。</p></article>
          <article class="question-card"><span class="number">03</span><h3>你的客户到底是谁？</h3><p>经销商、品牌商、海外工厂、工程公司和消费者的决策链完全不同。</p></article>
        </div>
      </div>
    </section>

    <section class="content-section">
      <div class="shell">
        <div class="section-heading">
          <p class="eyebrow">免费诊断结果</p>
          <h2 class="section-title">做完以后，你会得到什么？</h2>
          <p class="section-lead">先看到简版方向，再自行打开并保存完整报告；不会弹出信息收集表单。</p>
        </div>
        <div class="result-preview-grid">
          <article class="preview-card"><span class="preview-icon">✓</span><h3>海外推广判断</h3><p>适合启动、小步验证，或先补基础条件，并说明具体原因。</p></article>
          <article class="preview-card"><span class="preview-icon">站</span><h3>独立站判断</h3><p>优先建设、先定位、轻量 Landing Page，或暂缓完整投入。</p></article>
          <article class="preview-card"><span class="preview-icon">序</span><h3>渠道优先级</h3><p>搜索获客、主动开发与社媒信任培育的先后顺序和首个动作。</p></article>
          <article class="preview-card"><span class="preview-icon">90</span><h3>90天路线</h3><p>前30天搭基础、31—60天做验证、61—90天按数据优化。</p></article>
        </div>
      </div>
    </section>

    <section class="closing-cta">
      <div class="shell">
        <h2>先花3分钟，把出海顺序排清楚。</h2>
        <p>诊断结果在浏览器中直接生成，不收集个人联系方式。</p>
        <button class="button button-primary" data-go="diagnosis" type="button">开始免费诊断 <span aria-hidden="true">→</span></button>
      </div>
    </section>`;

  main.querySelectorAll('[data-go="diagnosis"]').forEach((button) => {
    button.addEventListener('click', () => setRoute('diagnosis'));
  });
}

function optionCards(field, group, { multiple = false, three = false, exclusive = [] } = {}) {
  const selected = multiple ? (diagnosisSession.answers[field] || []) : diagnosisSession.answers[field];
  const type = multiple ? 'checkbox' : 'radio';
  return `<div class="choice-grid${three ? ' three' : ''}">${QUESTION_OPTIONS[group].map((item) => `
    <label class="choice">
      <input type="${type}" name="${escapeAttribute(field)}" data-field="${escapeAttribute(field)}" value="${escapeAttribute(item.value)}"
        ${multiple ? (selected.includes(item.value) ? 'checked' : '') : (selected === item.value ? 'checked' : '')}
        ${exclusive.includes(item.value) ? 'data-exclusive="true"' : ''}>
      <span>${escapeHtml(item.label)}</span>
    </label>`).join('')}</div>`;
}

function inputField(field, label, placeholder) {
  return `<div class="field-group"><label class="field-label" for="${field}">${escapeHtml(label)}</label><input class="input" id="${field}" data-field="${field}" type="text" value="${escapeAttribute(diagnosisSession.answers[field] || '')}" placeholder="${escapeAttribute(placeholder)}" maxlength="160"></div>`;
}

function selectField(field, label, options, required = true) {
  const selected = diagnosisSession.answers[field] || '';
  return `<div class="field-group"><label class="field-label${required ? ' required' : ''}" for="${field}">${escapeHtml(label)}</label><select class="select" id="${field}" data-field="${field}"><option value="">请选择</option>${options.map((item) => `<option value="${escapeAttribute(item.value)}" ${selected === item.value ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('')}</select></div>`;
}

function questionBody(key) {
  const answers = diagnosisSession.answers;
  if (key === 'industry') {
    const mainOptions = INDUSTRIES.map((item) => ({ value: item.id, label: item.name }));
    const selectedIndustry = INDUSTRIES.find((item) => item.id === answers.industryMain);
    const subOptions = (selectedIndustry?.children || []).map((item) => ({ value: item.id, label: item.name }));
    return `<div class="field-row">${selectField('industryMain', '一级行业', mainOptions)}${selectField('industrySub', '细分行业', subOptions, false)}</div>
      ${inputField('industryCustom', '找不到你的行业？可以填写', '例如：特种陶瓷加工、船舶配件')}
      <p class="help-text">选择“其他制造业”时，请填写具体细分行业。</p>`;
  }
  if (key === 'product') return `${optionCards('productType', 'productTypes')}${inputField('productName', '主推产品名称（建议填写）', '例如：五轴 CNC 加工中心')}`;
  if (key === 'business') return optionCards('businessModel', 'businessModels');
  if (key === 'markets') return `${optionCards('targetMarkets', 'targetMarkets', { multiple: true, three: true, exclusive: ['unsure'] })}${inputField('targetCountries', '具体国家（选填）', '例如：德国、美国、阿联酋')}`;
  if (key === 'customers') return optionCards('customerTypes', 'customerTypes', { multiple: true, three: true, exclusive: ['unclear'] });
  if (key === 'order') return optionCards('orderValue', 'orderValues');
  if (key === 'cycle') return optionCards('decisionCycle', 'decisionCycles');
  if (key === 'certification') return optionCards('certificationStatus', 'certificationStatuses');
  if (key === 'assets') return optionCards('contentAssets', 'contentAssets', { multiple: true, three: true, exclusive: ['none'] });
  if (key === 'channels') return optionCards('currentChannels', 'currentChannels', { multiple: true, three: true, exclusive: ['none'] });
  if (key === 'problem') return optionCards('currentProblem', 'currentProblems');
  if (key === 'team') return `<div class="field-group"><span class="field-label required">谁负责海外客户</span>${optionCards('teamStatus', 'teamStatuses')}</div><div class="field-group"><span class="field-label required">询盘是否能及时响应</span>${optionCards('responseAbility', 'responseAbilities')}</div>`;
  if (key === 'timeline') return optionCards('launchTimeline', 'launchTimelines');
  return '';
}

function currentValidationMessage() {
  const key = questions[diagnosisSession.step].key;
  const answers = diagnosisSession.answers;
  if (key === 'industry' && !answers.industryMain) return '请选择所属行业';
  if (key === 'industry' && answers.industryMain === 'other-manufacturing' && !String(answers.industryCustom || '').trim()) return '请填写具体细分行业';
  if (key === 'product' && !answers.productType) return '请选择产品类型';
  if (key === 'business' && !answers.businessModel) return '请选择商业模式';
  if (key === 'markets' && !(answers.targetMarkets || []).length) return '请至少选择一个目标市场状态';
  if (key === 'customers' && !(answers.customerTypes || []).length) return '请至少选择一种目标客户';
  if (key === 'order' && !answers.orderValue) return '请选择典型订单金额';
  if (key === 'cycle' && !answers.decisionCycle) return '请选择采购决策周期';
  if (key === 'certification' && !answers.certificationStatus) return '请选择认证与出口条件状态';
  if (key === 'assets' && !(answers.contentAssets || []).length) return '请至少选择一项资料准备情况';
  if (key === 'channels' && !(answers.currentChannels || []).length) return '请至少选择一项当前推广情况';
  if (key === 'problem' && !answers.currentProblem) return '请选择当前最大问题';
  if (key === 'team' && (!answers.teamStatus || !answers.responseAbility)) return '请完成团队与响应能力两项选择';
  if (key === 'timeline' && !answers.launchTimeline) return '请选择计划启动时间';
  return '';
}

function bindQuestionFields() {
  main.querySelectorAll('[data-field]').forEach((control) => {
    const eventName = control.matches('input[type="text"], textarea') ? 'input' : 'change';
    control.addEventListener(eventName, () => {
      const field = control.dataset.field;
      if (control.type === 'checkbox') {
        const group = [...main.querySelectorAll(`input[type="checkbox"][data-field="${field}"]`)];
        if (control.checked && control.dataset.exclusive === 'true') {
          group.filter((item) => item !== control).forEach((item) => { item.checked = false; });
        } else if (control.checked) {
          group.filter((item) => item.dataset.exclusive === 'true').forEach((item) => { item.checked = false; });
        }
        diagnosisSession.answers[field] = group.filter((item) => item.checked).map((item) => item.value);
      } else {
        diagnosisSession.answers[field] = control.value;
      }
      if (field === 'industryMain') {
        diagnosisSession.answers.industrySub = '';
        saveSession();
        renderQuestion();
        return;
      }
      const error = main.querySelector('#question-error');
      if (error) error.textContent = '';
      saveSession();
    });
  });
}

function finishDiagnosis() {
  const validation = validateAnswers(diagnosisSession.answers);
  if (!validation.valid) {
    main.querySelector('#question-error').textContent = Object.values(validation.errors)[0] || '请完成所有必填问题';
    return;
  }
  const record = {
    createdAt: new Date().toISOString(),
    answers: normalizeAnswers(validation.answers),
    result: diagnose(normalizeAnswers(validation.answers)),
  };
  localStorage.setItem(storageKeys.report, JSON.stringify(record));
  localStorage.removeItem(storageKeys.step);
  setRoute('result');
}

function renderQuestion() {
  const step = diagnosisSession.step;
  const question = questions[step];
  document.title = `${step + 1}/${questions.length} ${question.title}｜万成云商`;
  main.innerHTML = `<section class="diagnosis-page"><div class="diagnosis-shell">
    <div class="diagnosis-top">
      <div class="diagnosis-meta"><span>${escapeHtml(stageNames[question.stage])}</span><span>${step + 1} / ${questions.length}</span></div>
      <progress class="progress-track" value="${step + 1}" max="${questions.length}" aria-label="诊断进度"></progress>
      <div class="stage-list">${stageNames.map((name, index) => `<span class="${index === question.stage ? 'active' : ''}">${escapeHtml(name)}</span>`).join('')}</div>
    </div>
    <article class="question-panel">
      <h1>${escapeHtml(question.title)}</h1>
      <p class="question-description">${escapeHtml(question.description)}</p>
      ${questionBody(question.key)}
      <div id="question-error" class="question-error" role="alert"></div>
      <div class="question-actions">
        <button id="previous-question" class="button button-secondary" type="button" ${step === 0 ? 'disabled' : ''}>← 上一题</button>
        <button id="next-question" class="button button-primary" type="button">${step === questions.length - 1 ? '生成诊断结果' : '下一题 →'}</button>
      </div>
      <p class="save-note">当前选择只保存在这台设备的浏览器中，刷新后可以继续。</p>
    </article>
  </div></section>`;
  bindQuestionFields();
  main.querySelector('#previous-question').addEventListener('click', () => {
    diagnosisSession.step = Math.max(0, diagnosisSession.step - 1);
    saveSession();
    renderQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  main.querySelector('#next-question').addEventListener('click', () => {
    const message = currentValidationMessage();
    if (message) {
      main.querySelector('#question-error').textContent = message;
      main.querySelector('[data-field]')?.focus();
      return;
    }
    if (diagnosisSession.step === questions.length - 1) {
      finishDiagnosis();
      return;
    }
    diagnosisSession.step += 1;
    saveSession();
    renderQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function renderDiagnosis() {
  const savedStep = Number(localStorage.getItem(storageKeys.step) || 0);
  diagnosisSession = diagnosisSession || {
    step: Number.isInteger(savedStep) ? Math.max(0, Math.min(questions.length - 1, savedStep)) : 0,
    answers: safeParse(localStorage.getItem(storageKeys.answers) || '{}', {}),
  };
  renderQuestion();
}

function resultSection(index, title, subtitle, content, extraClass = '') {
  return `<section class="result-section ${extraClass}"><div class="result-section-header"><span class="section-index">${String(index).padStart(2, '0')}</span><div class="result-section-title"><h2>${escapeHtml(title)}</h2>${subtitle ? `<p class="result-section-subtitle">${escapeHtml(subtitle)}</p>` : ''}</div></div>${content}</section>`;
}

function listMarkup(items, extraClass = '') {
  return `<ul class="clean-list ${extraClass}">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function reportRecord() {
  return safeParse(localStorage.getItem(storageKeys.report) || 'null', null);
}

function shortPlanMarkup(record) {
  const result = record.result;
  const firstChannel = result.channels[0];
  return `<section class="result-section summary-plan">
    <div class="result-section-header"><span class="section-index">简</span><div class="result-section-title"><h2>你的简版出海方案</h2><p class="result-section-subtitle">先看方向摘要，再决定是否打开完整报告。</p></div></div>
    <div class="summary-plan-grid">
      <article><span>当前首要问题</span><strong>${escapeHtml(result.primaryIssue.title)}</strong><p>${escapeHtml(result.primaryIssue.explanation)}</p></article>
      <article><span>推荐网站类型</span><strong>${escapeHtml(result.website.type)}</strong><p>${escapeHtml(result.website.reason)}</p></article>
      <article><span>渠道第一优先级</span><strong>${escapeHtml(firstChannel.channel)}</strong><p>${escapeHtml(firstChannel.firstActions[0])}</p></article>
    </div>
    <div class="first-actions"><h3>建议你先完成这3件事</h3>${listMarkup(result.plan90Days.day1to30.slice(0, 3))}</div>
  </section>`;
}

function resultHero(record) {
  const result = record.result;
  return `<section class="result-hero">
    <p class="eyebrow">YOUR GLOBAL DECISION REPORT</p>
    <h1>${escapeHtml(result.conclusion)}</h1>
    <p class="result-hero-note">这是基于你当前填写信息的结构化判断，重点是帮助你排清先后顺序。</p>
    <div class="verdict-grid">
      <article class="verdict-card"><span>海外推广判断</span><strong>${escapeHtml(result.verdicts.overseas)}</strong></article>
      <article class="verdict-card"><span>独立站判断</span><strong>${escapeHtml(result.verdicts.website)}</strong></article>
      <article class="verdict-card"><span>建议最先关注</span><strong>${escapeHtml(result.channels[0].channel)}</strong></article>
    </div>
  </section>`;
}

function bindCommonResultActions() {
  main.querySelector('[data-restart]')?.addEventListener('click', () => {
    resetDiagnosis();
    setRoute('diagnosis');
  });
}

function renderShortResult() {
  const record = reportRecord();
  if (!record?.result) {
    setRoute('diagnosis');
    return;
  }
  const date = new Date(record.createdAt).toLocaleString('zh-CN', { hour12: false });
  document.title = `简版出海方案｜${record.result.meta.industryName}｜${sales.accountName}`;
  main.innerHTML = `<div class="result-page"><div class="result-shell">
    <div class="result-toolbar"><p>诊断生成于 ${escapeHtml(date)}</p><button class="button button-small button-ghost" data-restart type="button">重新诊断</button></div>
    ${resultHero(record)}
    ${shortPlanMarkup(record)}
    <section class="report-gate no-print">
      <p class="eyebrow">完整报告已经生成</p>
      <h2>继续查看网站结构、渠道顺序与90天计划</h2>
      <p>完整报告无需填写任何联系方式；打开后会同时显示顾问姓名和二维码。</p>
      <button id="open-full-report" class="button button-primary button-wide button-hero" type="button">查看并保存完整报告 →</button>
    </section>
    <p class="result-disclaimer">本诊断仅用于企业海外推广决策参考，不对询盘数量、搜索排名、成交结果或投资回报作保证。</p>
  </div></div>`;
  bindCommonResultActions();
  main.querySelector('#open-full-report').addEventListener('click', () => setRoute('report'));
}

function consultantCard() {
  const qr = sales.qrImage
    ? `<img class="consultant-qr" src="${escapeAttribute(sales.qrImage)}" alt="${escapeAttribute(sales.consultantName)}的二维码">`
    : `<div class="qr-placeholder" aria-label="顾问二维码待补充"><span>二维码待补充</span><small>此处将展示 Cici 的二维码</small></div>`;
  const qrPrompt = sales.qrImage ? '扫码添加顾问' : '二维码补充后即可扫码添加顾问';
  return `<section class="consultant-card" id="consultant">
    <div class="consultant-copy">
      <p class="eyebrow">免费 · 1次顾问复核</p>
      <h2>${escapeHtml(sales.consultantName)}</h2>
      <div class="consultant-intro">
        <p>每家企业的产品、市场和获客基础都不一样。</p>
        <p>如果你对诊断结果还有疑问，可以让 Cici 帮你结合实际情况再看一遍，进一步梳理更适合你的出海方向和获客重点。</p>
      </div>
      <p class="consultant-topics" aria-label="可沟通方向"><span>独立站</span><span>Google获客</span><span>LinkedIn开发</span><span>海外社媒</span></p>
    </div>
    <div class="consultant-qr-wrap">
      <h3>添加 Cici</h3>
      ${qr}
      <p>${qrPrompt}</p>
      <small>备注「出海诊断」，方便快速了解你的情况</small>
    </div>
  </section>`;
}

function updatePdfControls({ busy = false, message = '', retry = false } = {}) {
  main.querySelectorAll('[data-download-pdf]').forEach((button) => {
    button.disabled = busy;
    button.textContent = busy ? '正在准备 PDF…' : retry ? '重新生成 PDF' : button.dataset.readyLabel;
  });
  main.querySelectorAll('[data-pdf-status]').forEach((status) => {
    status.textContent = message;
    status.classList.toggle('error', retry);
  });
}

function configurePdfFallback() {
  main.querySelectorAll('[data-pdf-fallback]').forEach((link) => {
    link.href = preparedPdfUrl;
    link.download = preparedPdf.fileName;
  });
}

function showPdfFallback() {
  main.querySelectorAll('[data-pdf-fallback]').forEach((link) => { link.hidden = false; });
}

async function startPdfPreparation(reportContainer) {
  clearPreparedPdf();
  const token = pdfGenerationToken;
  updatePdfControls({ busy: true, message: '正在生成可下载的 PDF，请稍候…' });
  const task = prepareReportPdf({ container: reportContainer, accountName: sales.accountName });
  pdfPreparation = task;
  try {
    const result = await task;
    if (token !== pdfGenerationToken) return null;
    preparedPdf = result;
    preparedPdfUrl = createPdfObjectUrl(result.blob);
    configurePdfFallback();
    updatePdfControls({ message: 'PDF 已准备好，点击即可保存到手机或电脑。' });
    return result;
  } catch (error) {
    if (token !== pdfGenerationToken) return null;
    updatePdfControls({ message: 'PDF 准备失败，请点击按钮重新生成。', retry: true });
    return null;
  } finally {
    if (token === pdfGenerationToken) pdfPreparation = null;
  }
}

async function handlePdfDownload(reportContainer) {
  if (!preparedPdf) {
    const result = pdfPreparation ? await pdfPreparation.catch(() => null) : await startPdfPreparation(reportContainer);
    if (!result && !preparedPdf) return;
  }
  updatePdfControls({ busy: true, message: '正在打开保存窗口…' });
  try {
    const outcome = await savePreparedPdf(preparedPdf);
    showPdfFallback();
    if (outcome === 'shared') {
      updatePdfControls({ message: '系统保存窗口已打开，请选择“存储到文件”或发送给自己。' });
    } else if (outcome === 'cancelled') {
      updatePdfControls({ message: '已取消保存，可以再次点击下载。' });
    } else {
      updatePdfControls({ message: 'PDF 下载已开始；如果没有反应，请点击下方备用入口。' });
    }
  } catch {
    showPdfFallback();
    updatePdfControls({ message: '自动保存没有启动，请点击下方备用入口打开 PDF。' });
  }
}

function renderFullReport() {
  const record = reportRecord();
  if (!record?.result) {
    setRoute('diagnosis');
    return;
  }
  const result = record.result;
  const readinessText = result.scores.readiness >= 75
    ? '准备度较高，可以在补齐少量关键资料的同时启动渠道验证。'
    : result.scores.readiness >= 50
      ? '已经具备一部分基础，建议先补齐高优先级条件，再逐步放大投入。'
      : '当前仍处于基础准备阶段，应先完成产品、市场、客户和承接机制。';
  const reasons = result.reasons.map((item) => `<article class="reason-card ${escapeAttribute(item.type)}"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.explanation)}</p></article>`).join('');
  const channels = result.channels.map((channel) => `<article class="channel-card">
    <div class="channel-head"><span class="priority-badge">P${channel.priority}</span><div><h3>${escapeHtml(channel.channel)}</h3><p>${escapeHtml(channel.reason)}</p></div></div>
    <div class="channel-body"><div><h4>先做什么</h4>${listMarkup(channel.firstActions)}</div><div><h4>暂时不要做什么</h4>${listMarkup(channel.avoidForNow, 'avoid')}</div></div>
  </article>`).join('');
  const timelineGroups = [
    ['1—30天', '基础搭建', result.plan90Days.day1to30],
    ['31—60天', '渠道验证', result.plan90Days.day31to60],
    ['61—90天', '数据优化', result.plan90Days.day61to90],
  ];
  const timeline = timelineGroups.map(([range, title, items]) => `<article class="timeline-card"><span>${range}</span><h3>${title}</h3>${listMarkup(items)}</article>`).join('');
  const missing = result.missingConditions.length
    ? `<div class="missing-list">${result.missingConditions.map((item) => `<div class="missing-item">${escapeHtml(item)}</div>`).join('')}</div>`
    : '<div class="all-ready">当前关键基础条件相对齐全，下一步重点是小步验证并根据真实数据优化。</div>';
  const date = new Date(record.createdAt).toLocaleString('zh-CN', { hour12: false });

  document.title = `完整出海方案｜${result.meta.industryName}｜${sales.accountName}`;
  main.innerHTML = `<div class="result-page full-report-page"><div class="result-shell">
    <div class="result-toolbar no-print"><p>诊断生成于 ${escapeHtml(date)}</p><div><button class="button button-small button-secondary" data-download-pdf data-ready-label="下载 PDF" type="button" disabled>正在准备 PDF…</button> <button class="button button-small button-ghost" data-restart type="button">重新诊断</button></div></div>
    <div class="report-cover-note">${escapeHtml(sales.accountName)} · 企业出海诊断报告</div>
    ${resultHero(record)}
    ${resultSection(1, '海外推广判断', '不是判断“能不能出海”，而是判断现在应该怎么启动。', `<div class="issue-banner"><span>${escapeHtml(result.primaryIssue.type)}</span><h3>${escapeHtml(result.primaryIssue.title)}</h3><p>${escapeHtml(result.primaryIssue.explanation)}</p></div>`)}
    ${resultSection(2, '为什么这样判断', `系统从你的产品、市场、客户、内容与团队回答中生成了 ${result.reasons.length} 条依据。`, `<div class="reason-list">${reasons}</div>`)}
    ${resultSection(3, '企业准备度', '分数只用于辅助查看，更需要关注判断依据与缺失条件。', `<div class="readiness-layout"><div class="readiness-score"><strong>${result.scores.readiness}</strong><span>/ 100</span><progress value="${result.scores.readiness}" max="100" aria-label="企业准备度 ${result.scores.readiness} 分"></progress></div><div class="readiness-copy"><h3>${escapeHtml(readinessText)}</h3><p>准备度综合考虑主推产品、目标市场、客户画像、出口条件、英文资料、工厂素材、团队和响应能力。</p></div></div>`)}
    ${resultSection(4, '推荐网站类型', '网站结构应该跟产品与客户的采购决策相匹配。', `<div class="website-type"><span>推荐类型</span><h3>${escapeHtml(result.website.type)}</h3><p>${escapeHtml(result.website.reason)}</p></div><h3>网站必须展示的内容</h3><div class="module-tags">${result.website.modules.map((item) => `<span class="module-tag">${escapeHtml(item)}</span>`).join('')}</div>`)}
    ${resultSection(5, '渠道优先级', '每条路径都说明为什么、先做什么，以及暂时不要做什么。', `<div class="channel-list">${channels}</div>`)}
    ${resultSection(6, '90天执行顺序', '先搭基础，再验证渠道，最后根据线索质量放大有效动作。', `<div class="timeline-grid">${timeline}</div>`)}
    ${resultSection(7, '当前缺失条件', '这些条件不代表你不能出海，而是决定下一阶段投入效率。', missing)}
    ${consultantCard()}
    <section class="download-panel no-print">
      <h2>把完整方案保存到手机或电脑</h2>
      <p>报告会直接生成 PDF。电脑点击后自动下载；手机点击后会打开系统保存窗口，顾问姓名和二维码会一同保存。</p>
      <button class="button button-primary button-wide button-hero" data-download-pdf data-ready-label="一键保存完整报告（PDF）" type="button" disabled>正在准备 PDF…</button>
      <p class="download-status" data-pdf-status role="status" aria-live="polite">正在生成可下载的 PDF，请稍候…</p>
      <a class="pdf-fallback-link" data-pdf-fallback href="#" target="_blank" rel="noopener" hidden>下载没反应？点击这里打开 PDF</a>
    </section>
    <p class="result-disclaimer">本诊断根据企业当前填写的信息进行结构化判断，仅用于企业海外推广决策参考。实际结果会受到产品竞争力、市场变化、执行质量、预算与团队等因素影响；不对询盘数量、搜索排名、成交结果或投资回报作保证。</p>
  </div></div>`;

  bindCommonResultActions();
  const reportContainer = main.querySelector('.full-report-page .result-shell');
  main.querySelectorAll('[data-download-pdf]').forEach((button) => {
    button.addEventListener('click', () => handlePdfDownload(reportContainer));
  });
  window.requestAnimationFrame(() => { void startPdfPreparation(reportContainer); });
}

function renderRoute() {
  const route = location.hash.replace(/^#/, '').split('?')[0] || 'home';
  window.scrollTo(0, 0);
  if (route === 'diagnosis') renderDiagnosis();
  else if (route === 'result') renderShortResult();
  else if (route === 'report') renderFullReport();
  else if (route === 'how-it-works') {
    renderHome();
    window.requestAnimationFrame(() => document.querySelector('#how-it-works')?.scrollIntoView());
  }
  else renderHome();
}

document.querySelector('#sales-version').textContent = sales.accountName;
document.querySelectorAll('[data-home]').forEach((link) => link.addEventListener('click', (event) => {
  event.preventDefault();
  setRoute('home');
}));
document.querySelectorAll('[data-start]').forEach((button) => button.addEventListener('click', (event) => {
  event.preventDefault();
  setRoute('diagnosis');
}));
window.addEventListener('hashchange', renderRoute);
renderRoute();
