import { originPattern } from "../shared/origin";

interface OriginStateRepository {
  setOriginEnabled(origin: string, enabled: boolean): Promise<void>;
}

export interface SiteAccessBrowser {
  requestOrigin(pattern: string): Promise<boolean>;
  register(id: string, pattern: string): Promise<void>;
  inject(tabId: number): Promise<void>;
  unregister(id: string): Promise<void>;
}

export function siteScriptId(origin: string): string {
  let hash = 0x811c9dc5;
  for (const character of origin) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return `autofill-site-${(hash >>> 0).toString(36)}`;
}

export async function enableSite(
  origin: string,
  tabId: number,
  repository: OriginStateRepository,
  browser: SiteAccessBrowser
): Promise<"enabled" | "denied"> {
  const pattern = originPattern(origin);
  if (!await browser.requestOrigin(pattern)) return "denied";
  const scriptId = siteScriptId(origin);
  await browser.register(scriptId, pattern);
  try {
    await repository.setOriginEnabled(origin, true);
    await browser.inject(tabId);
  } catch (error) {
    await repository.setOriginEnabled(origin, false);
    try {
      await browser.unregister(scriptId);
    } catch {
      // Persisted disablement still prevents the injected script from mounting
    }
    throw error;
  }
  return "enabled";
}

export async function disableSite(
  origin: string,
  repository: OriginStateRepository,
  browser: SiteAccessBrowser
): Promise<void> {
  await repository.setOriginEnabled(origin, false);
  await browser.unregister(siteScriptId(origin));
}
