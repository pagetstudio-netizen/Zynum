import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { buildWebhookTestRequest, normalizeWebhookUrl } from "./webhooks.js";

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

test("builds a signed webhook test without real order or SMS data", () => {
  const apiKey = "zynum-test-key";
  const delivery = buildWebhookTestRequest(apiKey, "test-delivery-1", "2026-09-25T12:00:00.000Z");
  const payload = JSON.parse(delivery.body) as { type: string; test: boolean; createdAt: string; data: { message: string } };
  const expectedSignature = createHmac("sha256", apiKey).update(delivery.body).digest("hex");

  assert.deepEqual(payload, {
    type: "webhook.test",
    test: true,
    createdAt: "2026-09-25T12:00:00.000Z",
    data: { message: "Test de connexion ZyNum. Aucun SMS ni aucune commande réelle ne sont inclus." },
  });
  assert.equal(delivery.headers["X-ZyNum-Event"], "webhook.test");
  assert.equal(delivery.headers["X-ZyNum-Delivery"], "test-delivery-1");
  assert.equal(delivery.headers["X-ZyNum-Signature"], `sha256=${expectedSignature}`);
  assert.equal(delivery.headers["X-ZyNum-Test"], "true");
});