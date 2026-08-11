import { migrateModelConfigs, resolveActiveConfig } from "./model-config";
import type { LauncherPosition, ModelConfig } from "./types";

export const STORAGE_KEYS = {
  configs: "smartFormFill.modelConfigs",
  activeConfigId: "smartFormFill.activeConfigId",
  enabledOrigins: "smartFormFill.enabledOrigins",
  launcherPositions: "smartFormFill.launcherPositions",
  schemaVersion: "smartFormFill.schemaVersion"
} as const;

export interface StorageArea {
  get(keys?: string | string[] | Record<string, unknown> | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
}

export class StorageRepository {
  constructor(private readonly area: StorageArea) {}

  async getConfigs(): Promise<ModelConfig[]> {
    const values = await this.area.get(STORAGE_KEYS.configs);
    return migrateModelConfigs(values[STORAGE_KEYS.configs]);
  }

  async saveConfigs(configs: ModelConfig[]): Promise<void> {
    await this.area.set({
      [STORAGE_KEYS.configs]: configs,
      [STORAGE_KEYS.schemaVersion]: 1
    });
  }

  async getActiveConfigId(): Promise<string | null> {
    const values = await this.area.get(STORAGE_KEYS.activeConfigId);
    const id = values[STORAGE_KEYS.activeConfigId];
    return typeof id === "string" ? id : null;
  }

  async setActiveConfigId(id: string | null): Promise<void> {
    if (id === null) {
      await this.area.remove(STORAGE_KEYS.activeConfigId);
      return;
    }
    await this.area.set({ [STORAGE_KEYS.activeConfigId]: id });
  }

  async getActiveConfig(): Promise<ModelConfig | null> {
    const [configs, activeId] = await Promise.all([
      this.getConfigs(),
      this.getActiveConfigId()
    ]);
    return resolveActiveConfig(configs, activeId);
  }

  async getEnabledOrigins(): Promise<string[]> {
    const values = await this.area.get(STORAGE_KEYS.enabledOrigins);
    const origins = values[STORAGE_KEYS.enabledOrigins];
    if (!Array.isArray(origins)) return [];
    return [...new Set(origins.filter((origin): origin is string => typeof origin === "string"))];
  }

  async isOriginEnabled(origin: string): Promise<boolean> {
    return (await this.getEnabledOrigins()).includes(origin);
  }

  async setOriginEnabled(origin: string, enabled: boolean): Promise<void> {
    const origins = new Set(await this.getEnabledOrigins());
    if (enabled) origins.add(origin);
    else origins.delete(origin);
    await this.area.set({ [STORAGE_KEYS.enabledOrigins]: [...origins] });
  }

  async getLauncherPosition(origin: string): Promise<LauncherPosition | null> {
    const values = await this.area.get(STORAGE_KEYS.launcherPositions);
    const positions = values[STORAGE_KEYS.launcherPositions];
    if (typeof positions !== "object" || positions === null || Array.isArray(positions)) return null;
    const position = (positions as Record<string, unknown>)[origin];
    if (typeof position !== "object" || position === null || Array.isArray(position)) return null;
    const candidate = position as Record<string, unknown>;
    if (
      (candidate.side !== "left" && candidate.side !== "right") ||
      typeof candidate.yRatio !== "number" ||
      !Number.isFinite(candidate.yRatio)
    ) {
      return null;
    }
    return { side: candidate.side, yRatio: Math.min(Math.max(candidate.yRatio, 0), 1) };
  }

  async setLauncherPosition(origin: string, position: LauncherPosition): Promise<void> {
    const values = await this.area.get(STORAGE_KEYS.launcherPositions);
    const current = values[STORAGE_KEYS.launcherPositions];
    const positions = typeof current === "object" && current !== null && !Array.isArray(current)
      ? current as Record<string, unknown>
      : {};
    await this.area.set({
      [STORAGE_KEYS.launcherPositions]: { ...positions, [origin]: position }
    });
  }
}
