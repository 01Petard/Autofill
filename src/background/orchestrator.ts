import type { ModelConfig } from "../shared/types";
import { parseGeneratedValues } from "../model/response";
import type { FillPageRequest, FillPageResponse } from "../shared/messages";
import type { ModelRequest } from "../model/prompt";

interface ActiveConfigProvider {
  getActiveConfig(): Promise<ModelConfig | null>;
}

type ModelCaller = (config: ModelConfig, request: ModelRequest) => Promise<string>;

const messages = {
  en: {
    rateLimited: "Please wait before trying again",
    noFields: "No fillable form fields were found on this page",
    noModel: "Add a model configuration in extension settings first",
    incompleteModel: "Complete the endpoint, API key, and model name in extension settings",
    failed: "Form filling failed. Try again"
  },
  zh: {
    rateLimited: "操作过于频繁，请稍后再试",
    noFields: "当前页面没有发现可填写的表单项",
    noModel: "请先在扩展设置中添加模型配置",
    incompleteModel: "请在扩展设置中补全请求地址、API Key 和模型名称",
    failed: "填充失败，请稍后重试"
  }
} as const;

function copy(request: FillPageRequest) {
  return request.locale.toLowerCase().startsWith("zh") ? messages.zh : messages.en;
}

export class FillOrchestrator {
  private readonly lastRequestByTab = new Map<number, number>();

  constructor(
    private readonly configs: ActiveConfigProvider,
    private readonly call: ModelCaller,
    private readonly now: () => number = Date.now
  ) {}

  async fill(request: FillPageRequest, tabId: number | undefined): Promise<FillPageResponse> {
    const text = copy(request);
    if (tabId !== undefined) {
      const current = this.now();
      const previous = this.lastRequestByTab.get(tabId) ?? Number.NEGATIVE_INFINITY;
      if (current - previous < 3_000) return { ok: false, message: text.rateLimited };
      this.lastRequestByTab.set(tabId, current);
    }
    if (request.fields.length === 0) return { ok: false, message: text.noFields };

    const config = await this.configs.getActiveConfig();
    if (!config) return { ok: false, message: text.noModel };
    if (!config.name.trim() || !config.endpoint.trim() || !config.apiKey.trim()) {
      return { ok: false, message: text.incompleteModel };
    }

    try {
      const response = await this.call(config, request);
      return {
        ok: true,
        values: parseGeneratedValues(response, request.fields),
        modelName: config.name
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : text.failed
      };
    }
  }
}
