import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeWebhookUrl } from "./webhooks.js";

test("normalizes a public HTTPS webhook URL", () => {
  assert.equal(
    normalizeWebhookUrl("  https://hooks.example.com/zynum/events  "),
    "https://hooks.example.com/zynum/events",
  );
});

test("rejects webhook URLs that are not public HTTPS destinations", () => {
  for (const url of [
    "http://hooks.example.com/events",
    "https://localhost/events",
    "https://service.internal/events",
    "https://127.0.0.1/events",
    "https://[::1]/events",
    "https://user:password@hooks.example.com/events",
    "https://hooks.example.com/events#fragment",
  ]) {
    assert.throws(() => normalizeWebhookUrl(url), url);
  }
});

test("rejects missing and overlong webhook URLs", () => {
  assert.throws(() => normalizeWebhookUrl(null));
  assert.throws(() => normalizeWebhookUrl(`https://hooks.example.com/${"a".repeat(2048)}`));
});