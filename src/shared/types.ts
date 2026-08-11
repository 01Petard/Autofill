export type ModelProtocol = "openai" | "anthropic";

export interface ModelConfig {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  protocol: ModelProtocol;
  createdAt: number;
  updatedAt: number;
}

export interface LauncherPosition {
  side: "left" | "right";
  yRatio: number;
}
