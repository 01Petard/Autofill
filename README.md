# 智填 / Autofill

智填是一个 Chrome / Edge Manifest V3 扩展。它扫描当前网页中可安全填写的表单字段，将字段语义发送到用户自行配置的 AI 模型，并按模型返回的结构化结果确定性填写控件。

当前版本只生成和填写测试数据，不导入用户业务数据，不点击提交、删除、支付、审批或发布按钮。

## 功能

- 按站点主动授权，不默认读取所有网页
- 识别 input、textarea、select、多选、checkbox、radio 与 contenteditable
- 支持 OpenAI Chat Completions 和 Anthropic Messages 兼容接口
- 多模型本地配置与默认模型切换
- 中英文界面
- 可拖动的页面悬浮球
- API Key 仅保存在 `chrome.storage.local`

## 本地开发

要求 Node.js 24+ 与 npm 11+。

```bash
npm install
npm test
npm run build
```

在 `chrome://extensions` 或 `edge://extensions` 开启开发者模式，选择“加载已解压的扩展”，然后选择项目中的 `dist` 目录。

## 发布包

```bash
npm run package
```

命令会执行 lint、类型检查、测试、生产构建和发布校验，并生成 `release/axiom-autofill-<version>.zip`。

## 数据边界

扩展发送给模型的内容仅包括页面标题、移除查询参数和片段后的页面 URL、字段标签/名称/占位符/类型/选项。它不会发送字段当前值、密码、文件、隐藏字段或 URL 查询参数。完整说明见 [PRIVACY.md](PRIVACY.md)。
