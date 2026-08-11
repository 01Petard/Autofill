# Privacy Policy / 隐私政策

Effective date / 生效日期：2026-08-11

## English

Autofill has no developer-operated backend, account system, analytics, advertising, or telemetry. Model configurations, enabled site origins, and launcher positions are stored locally with `chrome.storage.local`. API keys are not synced by the extension.

When the user clicks the page launcher, Autofill sends the page title, a URL stripped of credentials/query/fragment, and form field metadata to the model endpoint configured and authorized by the user. It does not send existing field values, password fields, file fields, hidden fields, cookies, or browsing history. The API key is sent only to that configured endpoint to authenticate the request.

Autofill writes generated values into eligible form controls. It does not submit forms and does not click submit, delete, payment, approval, or publish controls. Data handling by the selected model provider is governed by that provider's privacy policy.

Users can remove model configurations in settings, disable Autofill per site, revoke site permissions in browser extension settings, or uninstall the extension to remove extension-local data.

## 中文

智填不运营开发者后端、账号系统、分析统计、广告或遥测服务。模型配置、已启用站点和悬浮球位置通过 `chrome.storage.local` 保存在当前浏览器本地，扩展不会同步 API Key。

用户点击页面悬浮球后，智填会把页面标题、移除账号信息/查询参数/片段后的 URL，以及表单字段元数据发送到用户自行配置并授权的模型接口。扩展不会发送字段当前值、密码字段、文件字段、隐藏字段、Cookie 或浏览历史。API Key 只会发送到该模型接口用于请求鉴权。

智填只把生成结果写入符合条件的表单控件，不会自动提交表单，也不会点击提交、删除、支付、审批或发布控件。模型服务商如何处理数据，以该服务商的隐私政策为准。

用户可以在设置页删除模型配置、按站点关闭智填、在浏览器扩展权限中撤销站点授权，或卸载扩展以清除扩展本地数据。
