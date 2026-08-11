function isLoopback(hostname: string): boolean {
  return ["localhost", "127.0.0.1", "[::1]"].includes(hostname.toLowerCase());
}

function assertAllowedHttpUrl(url: URL): URL {
  if (url.protocol === "https:") return url;
  if (url.protocol === "http:" && isLoopback(url.hostname)) return url;
  throw new Error("Only HTTPS endpoints and loopback HTTP endpoints are allowed");
}

function assertWebPageUrl(url: URL): URL {
  if (url.protocol === "https:" || url.protocol === "http:") return url;
  throw new Error("Only HTTP and HTTPS pages are supported");
}

export function validateEndpoint(value: string): URL {
  return assertAllowedHttpUrl(new URL(value.trim()));
}

export function endpointOriginPattern(value: string): string {
  const url = validateEndpoint(value);
  return `${url.origin}/*`;
}

export function pageOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return assertWebPageUrl(new URL(value)).origin;
  } catch {
    return null;
  }
}

export function originPattern(origin: string): string {
  return `${assertWebPageUrl(new URL(origin)).origin}/*`;
}
