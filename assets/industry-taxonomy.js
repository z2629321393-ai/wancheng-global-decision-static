export const INDUSTRY_TAGS = Object.freeze([
  'B2B-heavy',
  'B2C-heavy',
  'technical',
  'high-consideration',
  'search-friendly',
  'outbound-friendly',
  'social-friendly',
  'visual-product',
  'customization-heavy',
  'certification-sensitive',
]);

const b2bTechnical = ['B2B-heavy', 'technical', 'high-consideration', 'search-friendly', 'outbound-friendly'];
const b2bSearch = ['B2B-heavy', 'technical', 'search-friendly', 'outbound-friendly'];
const visualB2c = ['B2C-heavy', 'visual-product', 'social-friendly'];

function children(prefix, names, tags) {
  const items = names.map(([id, name, ownTags]) => ({
    id: `${prefix}-${id}`,
    name,
    tags: ownTags || tags,
  }));
  items.push({ id: `${prefix}-other`, name: '其他', tags });
  return items;
}

export const INDUSTRIES = Object.freeze([
  {
    id: 'machinery', name: '机械设备', tags: b2bTechnical,
    children: children('machinery', [
      ['cnc', 'CNC / 机床'], ['laser', '激光设备'], ['woodworking', '木工机械'],
      ['general', '通用机械'], ['special', '专用设备'],
    ], b2bTechnical),
  },
  {
    id: 'industrial-automation', name: '工业自动化', tags: b2bTechnical,
    children: children('automation', [
      ['robot', '工业机器人'], ['plc', 'PLC / 控制系统'], ['sensor', '传感器'],
      ['drive', '伺服 / 变频器'], ['line', '自动化产线'],
    ], b2bTechnical),
  },
  {
    id: 'auto-parts', name: '汽车及零部件', tags: [...b2bSearch, 'visual-product'],
    children: children('auto', [
      ['vehicle', '整车', ['technical', 'high-consideration', 'visual-product', 'social-friendly']],
      ['commercial', '商用车'], ['ev', '新能源汽车', ['technical', 'certification-sensitive', 'visual-product', 'social-friendly']],
      ['components', '汽车零部件'], ['motorcycle', '摩托车及零部件'],
    ], [...b2bSearch, 'visual-product']),
  },
  {
    id: 'electronics-electrical', name: '电子与电气', tags: [...b2bSearch, 'certification-sensitive'],
    children: children('electronics', [
      ['pcb', 'PCB / PCBA'], ['connector', '连接器 / 线束'], ['power', '电源 / 变压器'],
      ['switchgear', '开关设备'], ['components', '电子元器件'],
    ], [...b2bSearch, 'certification-sensitive']),
  },
  {
    id: 'new-energy', name: '新能源', tags: [...b2bSearch, 'certification-sensitive'],
    children: children('energy', [
      ['solar', '光伏'], ['storage', '储能'], ['battery', '电池'],
      ['charging', '充电设备'], ['wind', '风电设备'],
    ], [...b2bSearch, 'certification-sensitive']),
  },
  {
    id: 'hardware-tools', name: '五金工具', tags: ['B2B-heavy', 'search-friendly', 'outbound-friendly', 'visual-product'],
    children: children('hardware', [
      ['hand-tools', '手动工具'], ['power-tools', '电动工具'], ['fasteners', '紧固件'],
      ['locks', '锁具'], ['industrial', '工业五金'],
    ], ['B2B-heavy', 'search-friendly', 'outbound-friendly', 'visual-product']),
  },
  {
    id: 'metal-processing', name: '金属加工', tags: [...b2bSearch, 'customization-heavy'],
    children: children('metal', [
      ['cnc-service', 'CNC 加工'], ['casting', '铸造'], ['stamping', '冲压'],
      ['sheet', '钣金'], ['mould', '模具'],
    ], [...b2bSearch, 'customization-heavy']),
  },
  {
    id: 'fluid-equipment', name: '泵阀 / 压缩机 / 流体设备', tags: b2bTechnical,
    children: children('fluid', [
      ['pump', '工业泵'], ['valve', '工业阀门'], ['compressor', '压缩机'],
      ['pipe', '管件 / 法兰'], ['filtration', '过滤设备'],
    ], b2bTechnical),
  },
  {
    id: 'instruments', name: '仪器仪表', tags: [...b2bTechnical, 'certification-sensitive'],
    children: children('instrument', [
      ['measurement', '测量仪器'], ['laboratory', '实验室仪器'], ['environmental', '环境监测'],
      ['meter', '工业仪表'], ['testing', '检测设备'],
    ], [...b2bTechnical, 'certification-sensitive']),
  },
  {
    id: 'building-materials', name: '建筑材料', tags: ['B2B-heavy', 'search-friendly', 'outbound-friendly', 'visual-product'],
    children: children('building', [
      ['stone', '石材'], ['ceramic', '陶瓷'], ['doors', '门窗'],
      ['insulation', '保温材料'], ['decorative', '装饰材料'],
    ], ['B2B-heavy', 'search-friendly', 'outbound-friendly', 'visual-product']),
  },
  {
    id: 'construction-machinery', name: '工程机械', tags: b2bTechnical,
    children: children('construction', [
      ['excavator', '挖掘机械'], ['lifting', '起重设备'], ['road', '道路机械'],
      ['concrete', '混凝土设备'], ['parts', '工程机械配件'],
    ], b2bTechnical),
  },
  {
    id: 'agricultural-machinery', name: '农业机械', tags: b2bTechnical,
    children: children('agri', [
      ['tractor', '拖拉机'], ['harvester', '收获机械'], ['irrigation', '灌溉设备'],
      ['processing', '农产品加工设备'], ['parts', '农机配件'],
    ], b2bTechnical),
  },
  {
    id: 'packaging-machinery', name: '包装机械', tags: b2bTechnical,
    children: children('packaging-machine', [
      ['filling', '灌装设备'], ['sealing', '封口设备'], ['labeling', '贴标设备'],
      ['cartoning', '装盒 / 装箱设备'], ['line', '自动包装线'],
    ], b2bTechnical),
  },
  {
    id: 'printing-equipment', name: '印刷设备', tags: b2bTechnical,
    children: children('printing', [
      ['digital', '数码印刷'], ['flexo', '柔版印刷'], ['screen', '丝网印刷'],
      ['postpress', '印后设备'], ['parts', '印刷配件'],
    ], b2bTechnical),
  },
  {
    id: 'packaging-materials', name: '包装材料', tags: ['B2B-heavy', 'search-friendly', 'outbound-friendly', 'visual-product'],
    children: children('packaging-material', [
      ['paper', '纸质包装'], ['plastic', '塑料包装'], ['metal', '金属包装'],
      ['flexible', '软包装'], ['custom', '定制包装'],
    ], ['B2B-heavy', 'search-friendly', 'outbound-friendly', 'visual-product', 'customization-heavy']),
  },
  {
    id: 'plastic-rubber', name: '塑料与橡胶', tags: [...b2bSearch, 'customization-heavy'],
    children: children('plastic', [
      ['injection', '注塑制品'], ['rubber', '橡胶制品'], ['profiles', '塑料型材'],
      ['film', '薄膜'], ['moulding', '定制成型'],
    ], [...b2bSearch, 'customization-heavy']),
  },
  {
    id: 'chemical-materials', name: '化工材料', tags: ['B2B-heavy', 'technical', 'search-friendly', 'outbound-friendly', 'certification-sensitive'],
    children: children('chemical', [
      ['coating', '涂料 / 油墨'], ['adhesive', '胶粘剂'], ['additive', '添加剂'],
      ['polymer', '高分子材料'], ['fine', '精细化工'],
    ], ['B2B-heavy', 'technical', 'search-friendly', 'outbound-friendly', 'certification-sensitive']),
  },
  {
    id: 'textile-apparel', name: '纺织服装', tags: ['B2B-heavy', 'B2C-heavy', 'visual-product', 'social-friendly', 'customization-heavy'],
    children: children('textile', [
      ['fabric', '面料'], ['garment', '成衣'], ['home-textile', '家纺'],
      ['functional', '功能性纺织品'], ['accessories', '服装辅料'],
    ], ['B2B-heavy', 'B2C-heavy', 'visual-product', 'social-friendly', 'customization-heavy']),
  },
  {
    id: 'furniture-home', name: '家具与家居', tags: visualB2c,
    children: children('furniture', [
      ['residential', '民用家具'], ['office', '办公家具'], ['outdoor', '户外家具'],
      ['homeware', '家居用品'], ['custom', '定制家具'],
    ], [...visualB2c, 'search-friendly']),
  },
  {
    id: 'lighting', name: '照明', tags: ['B2B-heavy', 'B2C-heavy', 'visual-product', 'social-friendly', 'certification-sensitive'],
    children: children('lighting', [
      ['commercial', '商业照明'], ['industrial', '工业照明'], ['residential', '家居照明'],
      ['outdoor', '户外照明'], ['smart', '智能照明'],
    ], ['B2B-heavy', 'B2C-heavy', 'visual-product', 'social-friendly', 'certification-sensitive']),
  },
  {
    id: 'security', name: '安防', tags: [...b2bSearch, 'certification-sensitive'],
    children: children('security', [
      ['camera', '视频监控'], ['access', '门禁系统'], ['alarm', '报警设备'],
      ['fire', '消防安防'], ['smart', '智能安防'],
    ], [...b2bSearch, 'certification-sensitive']),
  },
  {
    id: 'medical-devices', name: '医疗器械', tags: [...b2bTechnical, 'certification-sensitive'],
    children: children('medical', [
      ['diagnostic', '诊断设备'], ['consumables', '医用耗材'], ['rehab', '康复设备'],
      ['dental', '口腔设备'], ['laboratory', '医学实验设备'],
    ], [...b2bTechnical, 'certification-sensitive']),
  },
  {
    id: 'consumer-electronics', name: '消费电子', tags: [...visualB2c, 'certification-sensitive', 'search-friendly'],
    children: children('consumer-electronics', [
      ['audio', '音频产品'], ['wearable', '智能穿戴'], ['smart-home', '智能家居'],
      ['mobile-accessory', '手机配件'], ['personal', '个人电子'],
    ], [...visualB2c, 'certification-sensitive', 'search-friendly']),
  },
  {
    id: 'daily-consumer', name: '日用消费品', tags: visualB2c,
    children: children('consumer', [
      ['beauty', '美妆个护'], ['kitchen', '厨具'], ['cleaning', '清洁用品'],
      ['outdoor', '户外用品'], ['pet', '宠物用品'],
    ], [...visualB2c, 'search-friendly']),
  },
  {
    id: 'food-processing-equipment', name: '食品加工设备', tags: b2bTechnical,
    children: children('food-equipment', [
      ['bakery', '烘焙设备'], ['beverage', '饮料设备'], ['meat', '肉类加工设备'],
      ['fruit', '果蔬加工设备'], ['kitchen', '商用厨房设备'],
    ], b2bTechnical),
  },
  {
    id: 'other-manufacturing', name: '其他', tags: [],
    children: [],
  },
]);

export function getIndustry(mainId, subId) {
  const main = INDUSTRIES.find((item) => item.id === mainId);
  const sub = main?.children?.find((item) => item.id === subId);
  return { main, sub, tags: [...new Set([...(main?.tags || []), ...(sub?.tags || [])])] };
}
