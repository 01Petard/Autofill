import { validateEndpoint } from "../shared/origin";
import type { ModelConfig } from "../shared/types";
import { buildUserPrompt, SYSTEM_PROMPT, type ModelRequest } from "./prompt";

export type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface ApiErrorShape {
  error?: { message?: string };
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`Model endpoint returned an invalid response (HTTP ${response.status})`);
  }
  if (!response.ok) {
    const message = typeof body === "object" && body !== null
      ? (body as ApiErrorShape).error?.message
      : undefined;
    throw new Error(message || `Model request failed (HTTP ${response.status})`);
  }
  return body;
}

function extractOpenAiText(body: unknown): string {
  if (typeof body !== "object" || body === null) throw new Error("Model returned an unrecognized response");
  const choices = (body as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) throw new Error("Model returned no usable result");
  const first = choices[0] as { message?: { content?: unknown } } | undefined;
  if (typeof first?.message?.content !== "string") throw new Error("Model response was not text");
  return first.message.content.trim();
}

function extractAnthropicText(body: unknown): string {
  if (typeof body !== "object" || body === null) throw new Error("Model returned an unrecognized response");
  const content = (body as { content?: unknown }).content;
  if (!Array.isArray(content)) throw new Error("Model returned no usable result");
  const text = content
    .filter((item): item is { type: "text"; text: string } => {
      return typeof item === "object"
        && item !== null
        && (item as { type?: unknown }).type === "text"
        && typeof (item as { text?: unknown }).text === "string";
    })
    .map((item) => item.text)
    .join("")
    .trim();
  if (!text) throw new Error("Model response was not text");
  return text;
}

function openAiBody(config: ModelConfig, request: ModelRequest, jsonMode: boolean): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: config.name,
    temperature: 0.2,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(request) }
    ]
  };
  if (jsonMode) body.response_format = { type: "json_object" };
  return body;
}

async function callOpenAi(
  config: ModelConfig,
  request: ModelRequest,
  fetcher: Fetcher
): Promise<string> {
  const endpoint = validateEndpoint(config.endpoint);
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`
  };
  const send = (jsonMode: boolean) => fetcher(endpoint.href, {
    method: "POST",
    headers,
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify(openAiBody(config, request, jsonMode))
  });

  let response = await send(true);
  if (response.status === 400) response = await send(false);
  return extractOpenAiText(await readJson(response));
}

function anthropicEndpoint(value: string): URL {
  const endpoint = validateEndpoint(value);
  const path = endpoint.pathname.replace(/\/+$/, "");
  endpoint.pathname = path.endsWith("/messages") ? path : `${path}/messages`;
  return endpoint;
}

async function callAnthropic(
  config: ModelConfig,
  request: ModelRequest,
  fetcher: Fetcher
): Promise<string> {
  const endpoint = anthropicEndpoint(config.endpoint);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01"
  };
  if (endpoint.hostname.toLowerCase() === "apihub.agnes-ai.com") {
    headers.Authorization = `Bearer ${config.apiKey}`;
  } else {
    headers["x-api-key"] = config.apiKey;
  }
  const response = await fetcher(endpoint.href, {
    method: "POST",
    headers,
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({
      model: config.name,
      max_tokens: 4096,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(request) }]
    })
  });
  return extractAnthropicText(await readJson(response));
}

export function callModel(
  config: ModelConfig,
  request: ModelRequest,
  fetcher: Fetcher = fetch
): Promise<string> {
  return config.protocol === "anthropic"
    ? callAnthropic(config, request, fetcher)
    : callOpenAi(config, request, fetcher);
}
