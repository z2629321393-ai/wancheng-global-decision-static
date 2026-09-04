import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeAnswers, validateAnswers } from '../assets/schema.js';
import { diagnose } from '../assets/rule-engine.js';
import { INDUSTRIES } from '../assets/industry-taxonomy.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const app = readFileSync(resolve(root, 'assets/app.js'), 'utf8');
const ruleEngine = readFileSync(resolve(root, 'assets/rule-engine.js'), 'utf8');
const pdfExport = readFileSync(resolve(root, 'assets/pdf-export.js'), 'utf8');
const html2canvas = readFileSync(resolve(root, 'assets/vendor/html2canvas.min.js'), 'utf8');
const pdfLib = readFileSync(resolve(root, 'assets/vendor/pdf-lib.min.js'), 'utf8');
const ciciServiceLink = 'https://work.weixin.qq.com/ca/cawcde6c7b8beeca06';
const accountVersions = [
  ['wancheng', '万成云商｜中国制造出海', 'Cici｜企业出海顾问', '../assets/qr-3.png', 'https://work.weixin.qq.com/ca/cawcdeaf2900451dbe', ciciServiceLink],
  ['factory', '工厂出海实战团', 'Cici｜企业出海顾问', '../assets/qr-2.png', 'https://work.weixin.qq.com/ca/cawcde676802711a9b', ciciServiceLink],
  ['cici', 'Cici的外贸日记', 'Cici｜企业出海顾问', '../assets/qr-1.png', 'https://work.weixin.qq.com/ca/cawcde6c7b8beeca06', ciciServiceLink],
].map(([directory, accountName, consultantName, qrImage, wechatLink, serviceWechatLink]) => ({
  directory,
  accountName,
  consultantName,
  qrImage,
  wechatLink,
  serviceWechatLink,
  page: readFileSync(resolve(root, directory, 'index.html'), 'utf8'),
  config: readFileSync(resolve(root, directory, 'sales-config.js'), 'utf8'),
}));

assert.equal(/fetch\s*\(/.test(app), false, 'static app must not call a backend');
assert.equal(/\/api\//.test(app), false, 'static app must not contain API routes');
assert.match(app, /查看并保存完整报告/);
assert.match(app, /一键保存完整报告/);
assert.doesNotMatch(app, /联系电话|微信号|专属版/);
assert.match(app, /你想要出海的产品\/服务属于哪个行业/);
assert.match(app, /你的产品\/服务特征有哪些/);
assert.match(app, /你现在主要利用哪些渠道获客/);
assert.match(app, /你的团队配置/);
assert.doesNotMatch(app, /key: 'assets'/, 'content-assets question should be removed');
assert.match(app, /免费 · 1次顾问复核/);
assert.match(app, /每家企业的产品、市场和获客基础都不一样/);
assert.match(app, /进一步梳理更适合你的出海方向和获客重点/);
assert.match(app, /独立站/);
assert.match(app, /Google运营/);
assert.match(app, /Facebook运营/);
assert.match(app, /LinkedIn运营/);
assert.match(app, /专业团队持续代运营/);
assert.match(app, /const consultantLabel = 'Cici'/);
assert.match(app, /添加 \$\{escapeHtml\(consultantLabel\)\}/);
assert.match(app, /备注「出海诊断」/);
assert.match(app, /点击添加企业微信/);
assert.match(app, /咨询 Cici/);
assert.match(app, /有出海疑问/);
assert.match(app, /work\.weixin\.qq\.com/);
assert.doesNotMatch(app, /免费人工复核|领取对应行业的出海资料|定制出海方案建议/);
assert.doesNotMatch(`${app}\n${ruleEngine}`, /主动开发/);
assert.match(ruleEngine, /独立站 \+ Google搜索代运营/);
assert.match(ruleEngine, /Facebook \/ LinkedIn内容运营/);
assert.doesNotMatch(app, /window\.print\s*\(/, 'PDF button must not open the browser print dialog');
assert.doesNotMatch(app, /data-print/, 'legacy print controls must be removed');
assert.match(app, /data-download-pdf/, 'full report must expose a real PDF download control');
assert.match(pdfExport, /\.\/vendor\/html2canvas\.min\.js/);
assert.match(pdfExport, /\.\/vendor\/pdf-lib\.min\.js/);
assert.match(pdfExport, /navigator\.share/, 'mobile PDF flow should use the system save/share sheet when supported');
assert.match(pdfExport, /link\.download = fileName/, 'desktop and fallback flow should download a PDF file');
assert.ok(html2canvas.length > 100_000, 'local html2canvas vendor file is incomplete');
assert.ok(pdfLib.length > 400_000, 'local pdf-lib vendor file is incomplete');
for (const version of accountVersions) {
  assert.match(version.page, /sales-config\.js/);
  assert.ok(version.config.includes(`accountName: '${version.accountName}'`));
  assert.ok(version.config.includes(`consultantName: '${version.consultantName}'`));
  assert.ok(version.config.includes(`qrImage: '${version.qrImage}'`));
  assert.ok(version.config.includes(`wechatLink: '${version.wechatLink}'`));
  assert.ok(version.config.includes(`serviceWechatLink: '${version.serviceWechatLink}'`));
  assert.doesNotMatch(version.config, /phone:/);
  const qrAsset = readFileSync(resolve(root, version.qrImage.replace('../', '')));
  assert.ok(qrAsset.length > 500_000, `QR asset is incomplete for ${version.directory}`);
}

const sample = normalizeAnswers({
  industryMain: 'machinery',
  industrySub: 'machinery-cnc',
  productTypes: ['standard-industrial', 'custom'],
  productName: '五轴 CNC 加工中心',
  businessModel: 'b2b',
  targetMarkets: ['europe'],
  targetCountries: '德国',
  customerTypes: ['distributor', 'overseas-manufacturer'],
  orderValue: 'over-500k',
  decisionCycle: '3-6m',
  certificationStatus: 'partial',
  currentChannels: ['b2b-platform'],
  currentProblem: 'new-market',
  teamStatus: 'small',
  responseAbility: 'mostly',
  launchTimeline: '1-3m',
});
const validation = validateAnswers(sample);
assert.equal(validation.valid, true, JSON.stringify(validation.errors));
assert.deepEqual(sample.productTypes, ['standard-industrial', 'custom']);
const result = diagnose(sample);
assert.ok(result.conclusion.length > 10);
assert.equal(result.channels.length, 3);
assert.ok(result.serviceMode.title.includes('代运营'));
assert.ok(result.serviceMode.scope.length >= 4);
assert.ok(['search', 'social'].includes(result.channels[0].key));
assert.equal(result.channels[2].key, 'outbound');
assert.ok(result.channels.every((item) => !item.channel.includes('主动开发')));
assert.ok(result.website.modules.length >= 8);
assert.ok(result.plan90Days.day1to30.length >= 3);

for (const industry of INDUSTRIES) {
  if (industry.id !== 'other-manufacturing') {
    assert.equal(industry.children.at(-1)?.name, '其他', `missing sub-industry other option for ${industry.id}`);
  }
  const industrySample = { ...sample, industryMain: industry.id, industrySub: industry.children[0]?.id || '' };
  const industryResult = diagnose(industrySample);
  assert.ok(industryResult.meta.industryName, `missing result for ${industry.id}`);
  assert.equal(industryResult.channels.length, 3);
}

const legacy = normalizeAnswers({ ...sample, productTypes: undefined, productType: 'machinery' });
assert.deepEqual(legacy.productTypes, ['standard-industrial']);
console.log('Static website smoke tests passed.');
