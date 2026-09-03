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
const pdfExport = readFileSync(resolve(root, 'assets/pdf-export.js'), 'utf8');
const html2canvas = readFileSync(resolve(root, 'assets/vendor/html2canvas.min.js'), 'utf8');
const pdfLib = readFileSync(resolve(root, 'assets/vendor/pdf-lib.min.js'), 'utf8');
const accountVersions = [
  ['wancheng', '万成云商｜中国制造出海'],
  ['factory', '工厂出海实战团'],
  ['cici', 'Cici的外贸日记'],
].map(([directory, accountName]) => ({
  directory,
  accountName,
  page: readFileSync(resolve(root, directory, 'index.html'), 'utf8'),
  config: readFileSync(resolve(root, directory, 'sales-config.js'), 'utf8'),
}));

assert.equal(/fetch\s*\(/.test(app), false, 'static app must not call a backend');
assert.equal(/\/api\//.test(app), false, 'static app must not contain API routes');
assert.match(app, /查看并保存完整报告/);
assert.match(app, /一键保存完整报告/);
assert.doesNotMatch(app, /联系电话|微信号|专属版/);
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
  assert.match(version.config, /consultantName: 'Cici｜企业出海顾问'/);
  assert.match(version.config, /qrImage: ''/);
  assert.doesNotMatch(version.config, /phone|wechat/);
}

const sample = normalizeAnswers({
  industryMain: 'machinery',
  industrySub: 'machinery-cnc',
  productType: 'machinery',
  productName: '五轴 CNC 加工中心',
  businessModel: 'b2b',
  targetMarkets: ['europe'],
  targetCountries: '德国',
  customerTypes: ['distributor', 'overseas-manufacturer'],
  orderValue: 'over-500k',
  decisionCycle: '3-6m',
  certificationStatus: 'partial',
  contentAssets: ['product-images', 'datasheet', 'english-product', 'factory-photos'],
  currentChannels: ['b2b-platform'],
  currentProblem: 'new-market',
  teamStatus: 'small',
  responseAbility: 'mostly',
  launchTimeline: '1-3m',
});
const validation = validateAnswers(sample);
assert.equal(validation.valid, true, JSON.stringify(validation.errors));
const result = diagnose(sample);
assert.ok(result.conclusion.length > 10);
assert.equal(result.channels.length, 3);
assert.ok(result.website.modules.length >= 8);
assert.ok(result.plan90Days.day1to30.length >= 3);

for (const industry of INDUSTRIES) {
  const industrySample = { ...sample, industryMain: industry.id, industrySub: industry.children[0]?.id || '' };
  const industryResult = diagnose(industrySample);
  assert.ok(industryResult.meta.industryName, `missing result for ${industry.id}`);
  assert.equal(industryResult.channels.length, 3);
}
console.log('Static website smoke tests passed.');
