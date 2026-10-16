<div align="center">
  <img src="public/icons/icon-128.png" width="80" height="80" alt="Autofill · 智填 标志">
  <h1>Autofill · 智填</h1>
  <p><strong>少填几遍表单，多留一点时间。</strong></p>
  <p>Chrome / Edge 智能表单填充扩展。理解当前页面的字段语义，调用你配置的模型，生成并填入测试数据。</p>
  <p>
    <img src="https://img.shields.io/badge/version-1.0.0-7c3aed" alt="版本 1.0.0">
    <img src="https://img.shields.io/badge/Manifest-V3-4285f4" alt="Manifest V3">
    <img src="https://img.shields.io/badge/TypeScript-3178c6" alt="TypeScript">
    <img src="https://img.shields.io/badge/Chrome_/_Edge-extension-0ea5e9" alt="Chrome 和 Edge 扩展">
  </p>
  <p>
    <a href="#你可以用它做什么">功能</a> ·
    <a href="#安装">安装</a> ·
    <a href="#第一次填表">使用方法</a> ·
    <a href="#隐私与数据边界">隐私</a>
  </p>
</div>

## 你可以用它做什么

- **快速准备测试数据**：从标签、名称、占位符和选项理解字段，减少重复手工填写。
- **复用自己的模型服务**：支持 OpenAI Chat Completions 与 Anthropic Messages 兼容接口，可保存多个模型并切换默认项。
- **按网站启用**：主动授权当前站点，不默认读取所有网页。
- **在页面上直接操作**：通过可拖动的悬浮球触发填充，中英文界面可切换。

| 支持的控件 | 行为 |
| --- | --- |
| `input`、`textarea` | 为符合条件的字段生成并写入测试文本 |
| `select`、多选 | 从可用选项中选择 |
| `checkbox`、`radio` | 按结构化结果设置选中状态 |
| `contenteditable` | 填写可编辑区域 |

**当前只生成测试数据。** 不导入个人业务资料，也不会自动点击提交、删除、支付、审批或发布按钮。填充后请自行检查结果。

## 安装

需要 **Node.js 24+、npm 11+**，以及 Chrome 或 Edge。

```sh
npm install
npm run build
```

1. 打开 `chrome://extensions` 或 `edge://extensions`。
2. 开启 **开发者模式**。
3. 点击 **加载已解压的扩展**，选择项目的 **`dist`** 目录。
4. 将智填固定到浏览器工具栏，方便管理站点授权。

当前使用源码构建安装，本仓库没有在 README 中提供商店安装入口。

## 第一次填表

1. 从扩展进入设置，添加协议、模型名称（请求使用的模型标识）、接口地址和 API Key。
2. 将该配置设为默认模型，并确认对模型接口域名的授权。
3. 打开需要填写的普通 HTTP / HTTPS 网页，在扩展弹窗中启用该站点并确认授权。
4. 点击页面悬浮球，等待模型生成结果并填写可用字段。
5. 检查实际内容，再自行决定后续操作。

OpenAI 兼容配置应填写完整 Chat Completions 接口地址，例如：

```text
https://api.example.com/v1/chat/completions
```

Anthropic 兼容配置可填写服务地址；实现会在地址未以 `/messages` 结尾时追加该路径。请按你的服务商实际路径配置，不要把网页聊天地址当成 API 地址。

扩展没有内置免费模型额度。模型费用、可用性和数据处理规则取决于你选择的服务商。

## 隐私与数据边界

模型请求由用户点击悬浮球触发，发送范围如下：

| 会发送到配置的模型接口 | 不会发送 |
| --- | --- |
| 页面标题 | 表单现有字段值 |
| 去掉账号信息、查询参数、片段的页面 URL | 密码、文件、隐藏字段 |
| 字段标签、名称、占位符、类型和选项 | Cookie、浏览历史 |
| 用于接口鉴权的 API Key | 向其他无关接口发送 Key |

模型配置、站点授权记录与悬浮球位置保存在 **`chrome.storage.local`**，API Key 不通过扩展同步。项目没有开发者运营的后端、账号系统、广告、统计或遥测。

本地保存不代表请求全程离线：字段元数据会发往你授权的模型服务。完整约定见 [隐私政策](PRIVACY.md)。

## 更新与打包

更新源码后执行 `npm run build`，在扩展管理页点击 **重新加载**，再刷新需要填充的网页，以加载新的页面脚本。

生成发布包：

```sh
npm run package
```

命令依次执行 lint、类型检查、测试、生产构建和发布校验，再生成 **`release/autofill-1.0.0.zip`**。版本号来自扩展清单；命令不会自动上传商店。

## 本地开发

```sh
npm run lint
npm run typecheck
npm test
npm run verify   # 完整校验与构建
npm run dev      # Vite 页面开发
```

Vite 页面预览不能替代真实扩展环境中的站点权限、后台消息与表单填写验证。

| 目录 | 职责 |
| --- | --- |
| [src/form](src/form) | 字段扫描与确定性填充 |
| [src/model](src/model) | 提示词、接口请求与结果解析 |
| [src/background](src/background) | 扩展后台编排 |
| [src/content](src/content) | 网页悬浮球与页面侧行为 |
| [src/settings](src/settings) | 模型配置 |
| [tests](tests) | 扫描、填充、授权、存储和发布检查 |

## 常见问题

**页面没有出现悬浮球？** 确认已启用当前网站、授予权限，并在安装或更新后刷新页面。浏览器内部页面和扩展商店等受限制页面不能按普通网站注入。

**填充失败或模型无响应？** 检查默认模型、协议、完整接口路径、Key、接口授权和服务端错误；不同“兼容接口”的响应能力可能不同。

**可以拿它批量提交表单吗？** 当前功能只填写测试数据，不执行提交或批量业务操作。

## 反馈

欢迎通过 [Issues](https://github.com/01Petard/Autofill/issues) 提供可公开的表单示例、浏览器版本和复现步骤，不附带 API Key 或私人表单内容。当前仓库未提供 `LICENSE` 文件。
