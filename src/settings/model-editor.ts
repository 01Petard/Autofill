import type { ModelConfig } from "../shared/types";

export function upsertModel(configs: ModelConfig[], next: ModelConfig): ModelConfig[] {
  const current = configs.find((config) => config.id === next.id);
  if (!current) return [...configs, next];
  return configs.map((config) => config.id === next.id
    ? { ...next, createdAt: current.createdAt }
    : config);
}

export function removeModel(configs: ModelConfig[], id: string): ModelConfig[] {
  return configs.filter((config) => config.id !== id);
}
