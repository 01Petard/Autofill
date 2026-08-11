# Autofill Source Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the lost Autofill source as a maintainable, tested, localized Chrome/Edge MV3 extension that preserves the current safe form-fill behavior and can be packaged for stores.

**Architecture:** TypeScript modules isolate storage, permissions, model adapters, form analysis, deterministic DOM execution, and UI entrypoints. Vite emits the popup, settings page, service worker, and on-demand content script into a clean `dist` directory.

**Tech Stack:** TypeScript, Vite, Vitest, jsdom, ESLint, Chrome Extensions Manifest V3

## Global Constraints

- Chinese product name is `智填`; English product name is `Autofill`; package code is `axiom-autofill`
- The extension never submits forms or acts on submit, delete, payment, approval, or publish controls
- Existing field values, password/file/hidden inputs, and URL query parameters never enter model payloads
- API keys remain in `chrome.storage.local` and are sent only to the user-configured endpoint
- Site access and model endpoint access use runtime, origin-scoped optional permissions
- UI is fully localized in Simplified Chinese and English

---

### Task 1: Project shell and build contract

**Files:** Create package/build/type/lint configuration, `public/manifest.json`, localized messages, HTML entrypoints, and a manifest integrity test.

- [ ] Write a failing test that requires MV3, `storage`/`scripting`/`activeTab`, optional HTTPS/localhost origins, localized names, and all referenced entry files.
- [ ] Run the test and confirm failure because the source manifest does not exist.
- [ ] Add the minimal Vite multi-entry build and localized manifest to pass.
- [ ] Run type checking, the manifest test, and a production build.

### Task 2: Shared contracts, storage, migration, and origin permissions

**Files:** Create shared types, storage repository, origin normalization, and permission helpers with focused unit tests.

- [ ] Write failing tests for model CRUD data, active model fallback, old Agnes protocol migration, per-origin enablement, HTTPS validation, and exact origin patterns.
- [ ] Confirm failures are caused by missing implementations.
- [ ] Implement typed storage keys and pure migration/origin functions; wrap Chrome calls behind narrow adapters.
- [ ] Run the focused tests and full suite.

### Task 3: Form scanner and deterministic executor

**Files:** Create form field scanner, label resolver, action validator, value writer, and jsdom tests.

- [ ] Write failing tests that exclude sensitive/hidden/disabled/read-only/invisible controls and never expose current values.
- [ ] Write failing tests for input, textarea, select, multi-select, checkbox, contenteditable, and radio-group execution with `input`/`change` events.
- [ ] Confirm the radio regression test fails when a boolean would select an entire group.
- [ ] Implement the minimal scanner and executor, then refactor shared DOM helpers.
- [ ] Run DOM tests and the full suite.

### Task 4: Model clients and background orchestration

**Files:** Create prompt/payload builder, OpenAI and Anthropic clients, response parser/validator, rate limiter, and service-worker message entrypoint.

- [ ] Write failing tests for sanitized page context, safety prompt, protocol-specific request shape, OpenAI 400 fallback, timeout/error parsing, and unknown field removal.
- [ ] Implement fetch-injected clients and a background orchestrator that returns localized structured responses.
- [ ] Run adapter/orchestrator tests and the full suite.

### Task 5: Content script, popup, and settings UI

**Files:** Create localized popup/settings pages, per-site toggle flow, Shadow DOM launcher, model editor, and corresponding UI tests.

- [ ] Write failing tests for current-origin enable/disable, permission denial, model CRUD/selection, protocol selection, HTTPS feedback, and launcher teardown.
- [ ] Implement the screenshot-aligned settings layout and compact popup using the shared modules.
- [ ] Implement on-demand injection and persisted per-origin launcher placement without page-global CSS leakage.
- [ ] Run UI tests, accessibility assertions, type checking, and the full suite.

### Task 6: Branding, store documentation, and release packaging

**Files:** Create extension icons, README, privacy policy, bilingual store copy, release validation script, and release ZIP script.

- [ ] Write a failing release validation test for required icon sizes, prohibited artifacts, secrets, manifest references, and ZIP contents.
- [ ] Add a restrained blue “填/A” brand mark, documentation that accurately describes current capabilities, and reproducible packaging commands.
- [ ] Build and validate the unpacked Chrome/Edge extension, then create the versioned store ZIP.
- [ ] Run lint, typecheck, all tests, production build, release validation, and inspect the final archive listing.
