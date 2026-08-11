# 模型连接测试设计

## 目标

在模型设置页为当前未保存配置提供“测试连接”能力，通过一次最小真实模型请求验证接口协议、请求地址、模型名称和 API Key 是否可用。测试不保存配置、不切换默认模型、不记录密钥或响应内容。

## 用户流程

1. 用户填写接口协议、模型名称、请求地址和 API Key
2. 用户点击“测试连接”
3. 设置页执行必填校验，并继续沿用 HTTPS/loopback HTTP 安全规则
4. 扩展请求当前模型接口源站的可选访问权限
5. 设置页把临时配置发送给 service worker，不写入 `chrome.storage.local`
6. service worker 发送一次最小真实请求并返回结构化结果
7. 页面显示成功或准确的失败原因

## UI 行为

- “测试连接”位于“保存配置”旁，使用次级按钮样式
- 请求期间文案变为“测试中…”，测试按钮和保存按钮暂时禁用
- 成功显示“连接成功，API Key 和模型可用”
- 失败显示“测试失败：<服务商错误>”，保留鉴权失败、模型不存在、限流、超时和响应格式错误等可诊断信息
- 切换模型、新增模型或编辑表单后，旧测试结果不代表新值，不作为保存前置条件
- 中英文界面提供等价文案

## 后台接口与安全

新增内部消息：

```ts
interface TestModelConnectionRequest {
  type: "TEST_MODEL_CONNECTION";
  config: ModelConfig;
  locale: string;
}

type TestModelConnectionResponse =
  | { ok: true }
  | { ok: false; message: string };
```

- 消息中的配置只存在于当前请求内，不进入存储和日志
- service worker 只接受扩展设置页发出的测试消息；带 `sender.tab` 的内容脚本请求直接拒绝
- 请求地址继续使用 `validateEndpoint()`：公共地址必须 HTTPS，localhost/127.0.0.1/[::1] 可用 HTTP
- API Key 只发送到用户填写并授权的模型接口

## 模型请求

- OpenAI 兼容：Chat Completions，`temperature: 0`，极小 `max_tokens`，用户消息为 `Reply with OK`
- Anthropic 兼容：Messages，`temperature: 0`，极小 `max_tokens`，用户消息为 `Reply with OK`
- 沿用正式调用的鉴权规则：OpenAI 使用 Bearer；标准 Anthropic 使用 `x-api-key`；Agnes 使用 Bearer
- 30 秒超时；HTTP 非 2xx 时提取服务商 `error.message`，无结构化错误时回退到 HTTP 状态
- HTTP 2xx 且返回协议可识别的非空文本即视为成功，不要求文本必须等于 `OK`

## 测试与验收

- 单元测试覆盖两种协议的 URL、鉴权头、最小请求体和成功响应
- 覆盖 401、模型不存在、无效 JSON、空响应和超时错误
- 覆盖测试消息只允许设置页调用
- 覆盖点击测试不会调用任何存储写方法
- 覆盖测试按钮 loading 状态与中英文成功/失败文案
- 全量执行 lint、TypeScript、Vitest、生产构建和发布包校验

