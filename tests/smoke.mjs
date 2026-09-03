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
const zhangsan = readFileSync(resolve(root, 'zhangsan/index.html'), 'utf8');
const lisi = readFileSync(resolve(root, 'lisi/index.html'), 'utf8');
const zhangsanConfig = readFileSync(resolve(root, 'zhangsan/sales-config.js'), 'utf8');
const lisiConfig = readFileSync(resolve(root, 'lisi/sales-config.js'), 'utf8');

assert.equal(/fetch\s*\(/.test(app), false, 'static app must not call a backend');
assert.equal(/\/api\//.test(app), false, 'static app must not contain API routes');
assert.match(zhangsan, /sales-config\.js/);
assert.match(lisi, /sales-config\.js/);
assert.match(app, /查看并保存完整报告/);
assert.match(app, /一键保存完整报告/);
assert.match(zhangsanConfig, /name: '张三'/);
assert.match(lisiConfig, /name: '李四'/);
assert.match(zhangsanConfig, /phone: ''/);
assert.match(lisiConfig, /wechat: ''/);

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
