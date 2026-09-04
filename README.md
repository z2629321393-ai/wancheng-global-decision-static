# 万成云商企业出海决策网站（静态版）

这是用于 GitHub Pages 的纯静态版本。问答、规则判断和报告生成均在访问者浏览器中完成，不依赖后台接口，也不收集访问者联系方式。

当前版本以万成云商的海外代运营服务为承接：诊断会判断企业更适合优先投入独立站与 Google、Facebook / LinkedIn 海外社媒，还是先做轻量验证；90 天路线用于说明代运营项目的合理推进顺序，不是要求企业照着清单独自操作。

完整报告会在浏览器中直接生成真正的 PDF 文件，不再调用“打印网页”：

- 电脑端点击后直接下载 `.pdf` 文件；
- 手机端优先打开系统保存/分享窗口；
- 不支持系统窗口的浏览器会启动普通下载，并显示“打开 PDF”的备用入口。

PDF 组件已经保存在 `assets/vendor/`，运行时不依赖境外 CDN。

## 三个账号版本

- `wancheng/`：万成云商｜中国制造出海（二维码 3）
- `factory/`：工厂出海实战团（二维码 2）
- `cici/`：Cici的外贸日记（二维码 1）

三个版本共用 `assets/` 内的问答与规则。访客看到的接待顾问统一为“Cici｜企业出海顾问”；三张二维码保持各自版本的对应关系。页面中的通用咨询入口统一使用 Cici 的企业微信链接。

## 后续修改二维码或企业微信链接

编辑对应目录的 `sales-config.js`：

```js
window.WC_SALES = Object.freeze({
  id: 'wancheng',
  accountName: '万成云商｜中国制造出海',
  consultantName: 'Cici｜企业出海顾问',
  qrImage: '../assets/qr-3.png',
  wechatLink: 'https://work.weixin.qq.com/ca/与二维码对应的链接',
  serviceWechatLink: 'https://work.weixin.qq.com/ca/Cici的通用咨询链接',
});
```

二维码图片统一保存在 `assets/`。`wechatLink` 与当前二维码对应；`serviceWechatLink` 用于页面其他位置的“咨询 Cici”入口。

## 本地测试

```bash
npm test
python3 -m http.server 8080
```

打开：

- `http://127.0.0.1:8080/wancheng/`
- `http://127.0.0.1:8080/factory/`
- `http://127.0.0.1:8080/cici/`
