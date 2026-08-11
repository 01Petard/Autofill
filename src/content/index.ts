import { mountLauncher, type LauncherHandle } from "./launcher";
import { chromeLocalStorage } from "../shared/chrome-storage";
import { StorageRepository, STORAGE_KEYS } from "../shared/storage";
import type { FillPageRequest, FillPageResponse } from "../shared/messages";

interface ContentRuntime {
  destroy(): void;
}

const runtimeKey = "__AUTOFILL_RUNTIME__";
const runtimeScope = globalThis as unknown as Record<string, ContentRuntime | undefined>;

async function start(): Promise<void> {
  runtimeScope[runtimeKey]?.destroy();
  const repository = new StorageRepository(chromeLocalStorage());
  const origin = location.origin;
  let launcher: LauncherHandle | null = null;

  const mount = async (): Promise<void> => {
    if (launcher || !await repository.isOriginEnabled(origin)) return;
    const position = await repository.getLauncherPosition(origin);
    launcher = mountLauncher({
      document,
      locale: chrome.i18n.getUILanguage(),
      initialPosition: position ?? undefined,
      onPositionChange: (next) => repository.setLauncherPosition(origin, next),
      fill: (request) => chrome.runtime.sendMessage<FillPageRequest, FillPageResponse>({
        type: "AUTOFILL_FILL_PAGE",
        ...request
      })
    });
  };

  const syncEnabledState = async (): Promise<void> => {
    if (await repository.isOriginEnabled(origin)) await mount();
    else {
      launcher?.destroy();
      launcher = null;
    }
  };

  const onStorageChanged = (changes: Record<string, chrome.storage.StorageChange>, areaName: string): void => {
    if (areaName === "local" && changes[STORAGE_KEYS.enabledOrigins]) void syncEnabledState();
  };
  chrome.storage.onChanged.addListener(onStorageChanged);
  await mount();

  runtimeScope[runtimeKey] = {
    destroy(): void {
      chrome.storage.onChanged.removeListener(onStorageChanged);
      launcher?.destroy();
      launcher = null;
    }
  };
}

void start();
