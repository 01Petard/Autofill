import { describe, expect, it } from "vitest";
import {
  endpointOriginPattern,
  pageOrigin,
  validateEndpoint
} from "../src/shared/origin";

describe("origin policy", () => {
  it("accepts HTTPS model endpoints and removes credentials from permission patterns", () => {
    expect(validateEndpoint(" https://api.example.com/v1/chat ").href).toBe(
      "https://api.example.com/v1/chat"
    );
    expect(endpointOriginPattern("https://user:pass@api.example.com/v1")).toBe(
      "https://api.example.com/*"
    );
  });

  it.each([
    "http://localhost:11434/v1",
    "http://127.0.0.1:8080/v1",
    "http://[::1]:3000/v1"
  ])("allows loopback HTTP endpoint %s", (endpoint) => {
    expect(validateEndpoint(endpoint).protocol).toBe("http:");
  });

  it.each(["http://example.com/v1", "ftp://example.com/model", "not a url"])(
    "rejects unsafe endpoint %s",
    (endpoint) => {
      expect(() => validateEndpoint(endpoint)).toThrow();
    }
  );

  it("extracts only supported page origins", () => {
    expect(pageOrigin("https://example.com/path?q=secret")).toBe("https://example.com");
    expect(pageOrigin("http://localhost:5173/form")).toBe("http://localhost:5173");
    expect(pageOrigin("http://115.29.215.180:3000/form?token=secret")).toBe(
      "http://115.29.215.180:3000"
    );
    expect(pageOrigin("chrome://settings")).toBeNull();
  });
});
