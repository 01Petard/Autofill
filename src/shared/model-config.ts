import type { ModelConfig, ModelProtocol } from "./types";

const DEFAULT_ENDPOINT = "https://api.deepseek.com/chat/completions";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function inferProtocol(endpoint: string): ModelProtocol {
  try {
    return new URL(endpoint).hostname.toLowerCase() === "apihub.agnes-ai.com"
      ? "anthropic"
      : "openai";
  } catch {
    return "openai";
  }
}

function migrateModelConfig(value: unknown): ModelConfig | null {
  if (!isRecord(value)) return null;
  const { id, name, endpoint, apiKey, createdAt, updatedAt } = value;
  if (
    typeof id !== "string" ||
    typeof name !== "string" ||
    typeof endpoint !== "string" ||
    typeof apiKey !== "string"
  ) {
    return null;
  }

  const protocol = value.protocol === "anthropic" || value.protocol === "openai"
    ? value.protocol
    : inferProtocol(endpoint);
  const now = Date.now();

  return {
    id,
    name,
    endpoint,
    apiKey,
    protocol,
    createdAt: typeof createdAt === "number" ? createdAt : now,
    updatedAt: typeof updatedAt === "number" ? updatedAt : now
  };
}

export function migrateModelConfigs(value: unknown): ModelConfig[] {
  if (!Array.isArray(value)) return [];
  return value.map(migrateModelConfig).filter((item): item is ModelConfig => item !== null);
}

export function createDefaultConfig(
  createId: () => string = () => crypto.randomUUID(),
  now = Date.now()
): ModelConfig {
  return {
    id: createId(),
    name: "deepseek-chat",
    endpoint: DEFAULT_ENDPOINT,
    apiKey: "",
    protocol: "openai",
    createdAt: now,
    updatedAt: now
  };
}

export function resolveActiveConfig(
  configs: ModelConfig[],
  activeId: string | null
): ModelConfig | null {
  if (configs.length === 0) return null;
  return configs.find((config) => config.id === activeId) ?? configs[0] ?? null;
}
