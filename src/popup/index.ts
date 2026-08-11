import "./popup.css";
import { chromeLocalStorage } from "../shared/chrome-storage";
import { localeFromLanguage, uiText } from "../shared/i18n";
import { pageOrigin } from "../shared/origin";
import { StorageRepository } from "../shared/storage";
import { disableSite, enableSite, type SiteAccessBrowser } from "./site-access";

const locale = localeFromLanguage(chrome.i18n.getUILanguage());
const text = uiText(locale);
const repository = new StorageRepository(chromeLocalStorage());
const app = document.querySelector("#app");

document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
document.title = text.appName;

if (app) {
  app.innerHTML = `
    <section class="popup-shell">
      <header class="popup-header">
        <div class="brand-mark" aria-hidden="true">${locale === "zh" ? "填" : "A"}</div>
        <div><h1>${text.popupTitle}</h1><p id="model-name">${text.noModel}</p></div>
      </header>
      <div class="toggle-row">
        <div><strong>${text.siteAccess}</strong><span id="toggle-status">${text.disabled}</span></div>
        <label class="switch">
          <input id="enabled-toggle" type="checkbox" role="switch" aria-label="${text.toggleAria}" />
          <span class="switch-track" aria-hidden="true"><i></i></span>
        </label>
      </div>
      <p class="message" id="message" role="status" aria-live="polite"></p>
      <button class="settings-button" id="open-settings" type="button">${text.openSettings}</button>
    </section>
  `;
}

const toggle = document.querySelector("#enabled-toggle") as HTMLInputElement;
const toggleStatus = document.querySelector("#toggle-status") as HTMLSpanElement;
const modelName = document.querySelector("#model-name") as HTMLParagraphElement;
const message = document.querySelector("#message") as HTMLParagraphElement;

const browser: SiteAccessBrowser = {
  requestOrigin: (pattern) => chrome.permissions.request({ origins: [pattern] }),
  async register(id, pattern) {
    const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
    if (existing.length === 0) {
      await chrome.scripting.registerContentScripts([{
        id,
        js: ["content.js"],
        matches: [pattern],
        runAt: "document_idle",
        persistAcrossSessions: true
      }]);
    }
  },
  async inject(tabId) {
    await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
  },
  async unregister(id) {
    const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
    if (existing.length > 0) await chrome.scripting.unregisterContentScripts({ ids: [id] });
  }
};

function renderToggle(enabled: boolean): void {
  toggle.checked = enabled;
  toggleStatus.textContent = enabled ? text.enabled : text.disabled;
  toggleStatus.classList.toggle("enabled", enabled);
}

async function initialize(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const origin = pageOrigin(tab?.url);
  const model = await repository.getActiveConfig();
  modelName.textContent = model?.name || text.noModel;
  if (!origin || tab?.id === undefined) {
    toggle.disabled = true;
    message.textContent = text.unsupportedPage;
    return;
  }
  renderToggle(await repository.isOriginEnabled(origin));
  toggle.addEventListener("change", async () => {
    toggle.disabled = true;
    message.textContent = "";
    try {
      if (toggle.checked) {
        const result = await enableSite(origin, tab.id!, repository, browser);
        if (result === "denied") {
          renderToggle(false);
          message.textContent = text.permissionDenied;
        } else renderToggle(true);
      } else {
        await disableSite(origin, repository, browser);
        renderToggle(false);
      }
    } catch (error) {
      renderToggle(!toggle.checked);
      message.textContent = error instanceof Error ? error.message : text.permissionDenied;
    } finally {
      toggle.disabled = false;
    }
  });
}

document.querySelector("#open-settings")?.addEventListener("click", () => {
  void chrome.runtime.openOptionsPage();
  window.close();
});

void initialize();
