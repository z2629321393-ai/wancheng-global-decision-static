# 万成云商企业出海决策网站（静态版）

这是用于 GitHub Pages 的纯静态版本。问答、规则判断和报告生成均在访问者浏览器中完成，不依赖后台接口，也不收集访问者电话号码。

## 两个销售版本

- `zhangsan/`：张三专属版
- `lisi/`：李四专属版

两个版本共用 `assets/` 内的问答与规则，只在各自目录的 `sales-config.js` 中保存顾问信息。

## 后续填写联系方式

编辑对应目录的 `sales-config.js`：

```js
window.WC_SALES = Object.freeze({
  id: 'zhangsan',
  name: '张三',
  phone: '填写电话号码',
  wechat: '填写微信号',
  qrImage: 'qr.png',
});
```

二维码图片放到同一销售目录，例如 `zhangsan/qr.png`。李四版本同理。

## 本地测试

```bash
npm test
python3 -m http.server 8080
```

打开 `http://127.0.0.1:8080/zhangsan/` 或 `http://127.0.0.1:8080/lisi/`。
