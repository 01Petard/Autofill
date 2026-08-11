import { applyGeneratedValues } from "../form/executor";
import appIconUrl from "../assets/app-icon-ui.png?inline";
import { scanFormFields } from "../form/scanner";
import type { FormField, GeneratedValues } from "../form/types";
import type { FillPageResponse } from "../shared/messages";
import type { LauncherPosition } from "../shared/types";
import { launcherPixels, launcherPosition } from "./position";

const ROOT_ID = "smart-form-fill-root";

interface LauncherOptions {
  document: Document;
  locale: string;
  fill(request: {
    page: { title: string; url: string };
    fields: FormField[];
    locale: string;
  }): Promise<FillPageResponse>;
  scan?: (root: ParentNode) => FormField[];
  apply?: (values: GeneratedValues, fields: FormField[], root: ParentNode) => number;
  shadowMode?: ShadowRootMode;
  initialPosition?: LauncherPosition;
  onPositionChange?: (position: LauncherPosition) => void | Promise<void>;
}

export interface LauncherHandle {
  destroy(): void;
}

const labels = {
  en: {
    button: "Fill form with AI test data. Drag to move",
    analyzing: "Analyzing form…",
    noFields: "No fillable form fields found",
    filled: (model: string, count: number) => `${model} filled ${count} fields`
  },
  zh: {
    button: "使用 AI 测试数据填写表单，可拖动位置",
    analyzing: "正在分析表单…",
    noFields: "当前页面没有可填写的表单项",
    filled: (model: string, count: number) => `已使用${model}填写 ${count} 项`
  }
} as const;

export function mountLauncher(options: LauncherOptions): LauncherHandle {
  const existing = options.document.getElementById(ROOT_ID);
  if (existing) return { destroy: () => undefined };

  const text = options.locale.toLowerCase().startsWith("zh") ? labels.zh : labels.en;
  const host = options.document.createElement("div");
  host.id = ROOT_ID;
  const shadow = host.attachShadow({ mode: options.shadowMode ?? "closed" });
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      .wrap { position: fixed; z-index: 2147483647; display: flex; align-items: center; gap: 10px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .wrap.left { flex-direction: row-reverse; }
      button { position: relative; width: 56px; height: 56px; border: 0; border-radius: 15px; padding: 0; background: transparent; box-shadow: 0 12px 28px rgba(24,39,63,.2); cursor: pointer; font: 800 18px/1 inherit; }
      button:hover { transform: translateY(-1px); }
      button:focus-visible { outline: 3px solid rgba(55,141,255,.42); outline-offset: 3px; }
      button:disabled { opacity: .72; cursor: wait; }
      .launcher-icon { display: block; width: 56px; height: 56px; border-radius: 15px; }
      .busy-mark { display: none; position: absolute; inset: 0; place-items: center; border-radius: 15px; color: #fff; background: #1633ac; }
      button.busy .launcher-icon { visibility: hidden; }
      button.busy .busy-mark { display: grid; }
      .status { max-width: min(280px, calc(100vw - 92px)); padding: 9px 12px; border: 1px solid rgba(24,36,56,.1); border-radius: 8px; color: #243047; background: #fff; box-shadow: 0 8px 24px rgba(15,23,42,.15); font-size: 12px; line-height: 1.4; }
      .hidden { display: none; }
    </style>
    <div class="wrap">
      <span class="status hidden" role="status" aria-live="polite"></span>
      <button type="button" aria-label="${text.button}" title="${text.button}"><img class="launcher-icon" src="${appIconUrl}" alt="" /><span class="busy-mark" aria-hidden="true">…</span></button>
    </div>
  `;
  options.document.documentElement.appendChild(host);

  const button = shadow.querySelector("button") as HTMLButtonElement;
  const status = shadow.querySelector(".status") as HTMLSpanElement;
  const wrap = shadow.querySelector(".wrap") as HTMLDivElement;
  let statusTimer: number | undefined;
  let currentPosition = options.initialPosition ?? { side: "right", yRatio: 0.82 };
  let drag: { pointerId: number; x: number; y: number; left: number; top: number; moved: boolean } | null = null;
  let suppressClickUntil = 0;

  const place = (): void => {
    const pixels = launcherPixels(currentPosition, window.innerWidth, window.innerHeight);
    wrap.style.left = `${pixels.left}px`;
    wrap.style.top = `${pixels.top}px`;
    wrap.classList.toggle("left", currentPosition.side === "left");
  };
  place();
  window.addEventListener("resize", place);

  const showStatus = (message: string, busy = false): void => {
    if (statusTimer !== undefined) window.clearTimeout(statusTimer);
    button.disabled = busy;
    button.classList.toggle("busy", busy);
    status.textContent = message;
    status.classList.remove("hidden");
    if (!busy) {
      statusTimer = window.setTimeout(() => status.classList.add("hidden"), 5_000);
    }
  };

  button.addEventListener("pointerdown", (event) => {
    if (button.disabled || event.button !== 0) return;
    const bounds = wrap.getBoundingClientRect();
    drag = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: bounds.left,
      top: bounds.top,
      moved: false
    };
    button.setPointerCapture(event.pointerId);
  });
  button.addEventListener("pointermove", (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < 5) return;
    drag.moved = true;
    wrap.style.left = `${Math.min(Math.max(drag.left + deltaX, 0), Math.max(0, window.innerWidth - 56))}px`;
    wrap.style.top = `${Math.min(Math.max(drag.top + deltaY, 12), Math.max(12, window.innerHeight - 68))}px`;
  });
  const finishDrag = (event: PointerEvent): void => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const moved = drag.moved;
    drag = null;
    if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
    if (!moved) return;
    const bounds = wrap.getBoundingClientRect();
    currentPosition = launcherPosition(bounds.left, bounds.top, window.innerWidth, window.innerHeight);
    place();
    suppressClickUntil = Date.now() + 300;
    void options.onPositionChange?.(currentPosition);
  };
  button.addEventListener("pointerup", finishDrag);
  button.addEventListener("pointercancel", finishDrag);

  button.addEventListener("click", async () => {
    if (Date.now() < suppressClickUntil) return;
    const fields = (options.scan ?? scanFormFields)(options.document);
    if (fields.length === 0) {
      showStatus(text.noFields);
      return;
    }
    showStatus(text.analyzing, true);
    try {
      const response = await options.fill({
        page: { title: options.document.title, url: options.document.location.href },
        fields,
        locale: options.locale
      });
      if (!response.ok) {
        showStatus(response.message);
        return;
      }
      const count = (options.apply ?? applyGeneratedValues)(response.values, fields, options.document);
      showStatus(text.filled(response.modelName, count));
    } catch (error) {
      showStatus(error instanceof Error ? error.message : "Autofill failed");
    }
  });

  return {
    destroy(): void {
      if (statusTimer !== undefined) window.clearTimeout(statusTimer);
      window.removeEventListener("resize", place);
      host.remove();
    }
  };
}
