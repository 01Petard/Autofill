# Autofill Chrome / Edge Store Listing

## Short description

Use your own AI model to understand form fields and generate safe test data. Site-scoped access and no automatic submission.

## Full description

Autofill is an AI form assistant for testing, development, and repetitive data-entry workflows. After the user grants access to the current site, the page launcher scans eligible fields. The extension sends field labels, types, and options to a user-configured OpenAI-compatible or Anthropic-compatible model, then deterministically writes the structured result into inputs, textareas, selects, checkboxes, radio groups, and editable regions.

This version does not import business datasets, read existing field values, or submit forms. Submit, delete, payment, approval, and publish actions always remain under user control.

## Permission justification

- `storage`: locally stores model configurations, enabled origins, and launcher positions
- `activeTab`: identifies the tab the user is actively operating
- `scripting`: injects the launcher and deterministic fill logic only on approved sites
- Optional host access: reaches sites explicitly enabled by the user and model endpoints explicitly configured by the user

## Pre-publish assets

Recommended screenshots: model settings, current-site permission popup, launcher analysis state, and a filled but unsubmitted form. Host `PRIVACY.md` at a public HTTPS URL before completing the store privacy form.
