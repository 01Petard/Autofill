import "./settings.css";
import { createDefaultConfig, resolveActiveConfig } from "../shared/model-config";
import { chromeLocalStorage } from "../shared/chrome-storage";
import { localeFromLanguage, uiText } from "../shared/i18n";
import { endpointOriginPattern, validateEndpoint } from "../shared/origin";
import { StorageRepository } from "../shared/storage";
import type { ModelConfig, ModelProtocol } from "../shared/types";
import { removeModel, upsertModel } from "./model-editor";

const locale = localeFromLanguage(chrome.i18n.getUILanguage());
const text = uiText(locale);
const repository = new StorageRepository(chromeLocalStorage());
const app = document.querySelector("#app");
let configs: ModelConfig[] = [];
let activeId: string | null = null;

document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
document.title = `${text.appName} · ${text.settingsTitle}`;

if (app) {
  app.innerHTML = `
    <div class="page-shell">
      <header class="page-header">
        <div><p class="eyebrow">${text.settingsEyebrow}</p><h1>${text.settingsTitle}</h1><p class="subtitle">${text.settingsSubtitle}</p></div>
        <span class="status-dot"><i></i>${text.localConfig}</span>
      </header>
      <section class="content-grid">
        <section class="panel models-panel" aria-labelledby="models-title">
          <div class="panel-heading"><div><h2 id="models-title">${text.configuredModels}</h2><p>${text.modelListHint}</p></div><button class="button button-primary" id="new-model" type="button">${text.addModel}</button></div>
          <div class="model-list" id="model-list"></div>
          <div class="empty-state" id="empty-state" hidden><strong>${text.emptyTitle}</strong><span>${text.emptyHint}</span></div>
        </section>
        <section class="panel editor-panel" aria-labelledby="editor-title">
          <div class="panel-heading compact"><div><h2 id="editor-title">${text.modelDetails}</h2><p>${text.detailsHint}</p></div></div>
          <form id="model-form">
            <input id="model-id" type="hidden" />
            <label class="field-label" for="model-protocol">${text.protocol}<span>*</span></label>
            <select class="text-input" id="model-protocol" required><option value="openai">${text.openaiProtocol}</option><option value="anthropic">${text.anthropicProtocol}</option></select>
            <label class="field-label" for="model-name">${text.modelName}<span>*</span></label>
            <input class="text-input" id="model-name" required maxlength="100" placeholder="deepseek-chat" />
            <label class="field-label" for="model-endpoint">${text.endpoint}<span>*</span></label>
            <input class="text-input" id="model-endpoint" required type="url" placeholder="https://api.deepseek.com/chat/completions" />
            <p class="field-help">${text.endpointHelp}</p>
            <label class="field-label" for="model-api-key">${text.apiKey}<span>*</span></label>
            <div class="secret-input-wrap"><input class="text-input" id="model-api-key" required type="password" autocomplete="off" placeholder="sk-…" /><button class="icon-button" id="toggle-key" type="button">${text.show}</button></div>
            <p class="field-help">${text.keyHelp}</p>
            <div class="form-actions"><button class="button button-primary" type="submit">${text.save}</button><button class="button button-quiet" id="delete-model" type="button" hidden>${text.delete}</button><span class="save-feedback" id="save-feedback" role="status" aria-live="polite"></span></div>
          </form>
        </section>
      </section>
      <footer class="page-footer">${text.footer}</footer>
    </div>
  `;
}

const list = document.querySelector("#model-list") as HTMLDivElement;
const empty = document.querySelector("#empty-state") as HTMLDivElement;
const form = document.querySelector("#model-form") as HTMLFormElement;
const idInput = document.querySelector("#model-id") as HTMLInputElement;
const protocolInput = document.querySelector("#model-protocol") as HTMLSelectElement;
const nameInput = document.querySelector("#model-name") as HTMLInputElement;
const endpointInput = document.querySelector("#model-endpoint") as HTMLInputElement;
const keyInput = document.querySelector("#model-api-key") as HTMLInputElement;
const deleteButton = document.querySelector("#delete-model") as HTMLButtonElement;
const feedback = document.querySelector("#save-feedback") as HTMLSpanElement;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function maskKey(value: string): string {
  if (!value) return "••••";
  return value.length <= 8 ? `${value.slice(0, 2)}••••` : `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

function renderList(): void {
  empty.hidden = configs.length > 0;
  list.innerHTML = configs.map((config) => `
    <article class="model-card ${config.id === activeId ? "active" : ""}" data-id="${escapeHtml(config.id)}">
      <div class="model-main" data-action="edit" tabindex="0" role="button">
        <div class="model-name"><strong>${escapeHtml(config.name)}</strong>${config.id === activeId ? `<span class="model-badge">${text.activeNow}</span>` : ""}</div>
        <p class="model-meta" title="${escapeHtml(config.endpoint)}">${escapeHtml(config.endpoint)} · ${escapeHtml(maskKey(config.apiKey))}</p>
      </div>
      <div class="model-actions"><button class="text-button" data-action="use" type="button">${config.id === activeId ? text.active : text.use}</button><button class="text-button" data-action="edit" type="button">${text.edit}</button><button class="text-button danger" data-action="delete" type="button">${text.delete}</button></div>
    </article>
  `).join("");
}

function showConfig(config: ModelConfig): void {
  idInput.value = config.id;
  protocolInput.value = config.protocol;
  nameInput.value = config.name;
  endpointInput.value = config.endpoint;
  keyInput.value = config.apiKey;
  deleteButton.hidden = false;
  feedback.textContent = "";
}

function newConfig(): void {
  const config = createDefaultConfig();
  form.reset();
  idInput.value = config.id;
  protocolInput.value = config.protocol;
  nameInput.value = config.name;
  endpointInput.value = config.endpoint;
  keyInput.value = "";
  deleteButton.hidden = true;
  feedback.textContent = text.newConfig;
  nameInput.focus();
}

async function selectModel(id: string): Promise<void> {
  activeId = id;
  await repository.setActiveConfigId(id);
  renderList();
  feedback.textContent = text.switched;
}

async function deleteModel(id: string): Promise<void> {
  if (!window.confirm(text.confirmDelete)) return;
  configs = removeModel(configs, id);
  if (activeId === id) activeId = configs[0]?.id ?? null;
  await repository.saveConfigs(configs);
  await repository.setActiveConfigId(activeId);
  renderList();
  const next = resolveActiveConfig(configs, activeId);
  if (next) showConfig(next); else newConfig();
  feedback.textContent = text.deleted;
}

list.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  const card = target.closest<HTMLElement>("[data-id]");
  const action = target.closest<HTMLElement>("[data-action]")?.dataset.action;
  if (!card?.dataset.id || !action) return;
  const id = card.dataset.id;
  if (action === "edit") {
    const config = configs.find((item) => item.id === id);
    if (config) showConfig(config);
  } else if (action === "use") void selectModel(id);
  else if (action === "delete") void deleteModel(id);
});

document.querySelector("#new-model")?.addEventListener("click", newConfig);
document.querySelector("#toggle-key")?.addEventListener("click", (event) => {
  const button = event.currentTarget as HTMLButtonElement;
  const reveal = keyInput.type === "password";
  keyInput.type = reveal ? "text" : "password";
  button.textContent = reveal ? text.hide : text.show;
});
deleteButton.addEventListener("click", () => void deleteModel(idInput.value));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const endpoint = endpointInput.value.trim();
  try {
    validateEndpoint(endpoint);
  } catch {
    feedback.dataset.state = "error";
    feedback.textContent = text.invalidEndpoint;
    return;
  }
  if (!await chrome.permissions.request({ origins: [endpointOriginPattern(endpoint)] })) {
    feedback.dataset.state = "error";
    feedback.textContent = text.permissionDeniedEndpoint;
    return;
  }
  const previous = configs.find((config) => config.id === idInput.value);
  const now = Date.now();
  const config: ModelConfig = {
    id: previous?.id ?? (idInput.value || crypto.randomUUID()),
    name: nameInput.value.trim(),
    endpoint,
    apiKey: keyInput.value.trim(),
    protocol: protocolInput.value as ModelProtocol,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now
  };
  configs = upsertModel(configs, config);
  if (!activeId) activeId = config.id;
  await repository.saveConfigs(configs);
  await repository.setActiveConfigId(activeId);
  idInput.value = config.id;
  deleteButton.hidden = false;
  feedback.dataset.state = "success";
  feedback.textContent = text.saved;
  renderList();
});

async function initialize(): Promise<void> {
  configs = await repository.getConfigs();
  activeId = await repository.getActiveConfigId();
  if (configs.length === 0) {
    const initial = createDefaultConfig();
    configs = [initial];
    activeId = initial.id;
    await repository.saveConfigs(configs);
    await repository.setActiveConfigId(activeId);
  } else {
    const resolved = resolveActiveConfig(configs, activeId);
    if (resolved?.id !== activeId) {
      activeId = resolved?.id ?? null;
      await repository.setActiveConfigId(activeId);
    }
  }
  renderList();
  const active = resolveActiveConfig(configs, activeId);
  if (active) showConfig(active); else newConfig();
}

void initialize();
