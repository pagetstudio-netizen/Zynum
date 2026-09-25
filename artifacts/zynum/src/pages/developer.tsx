import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Copy, Eye, EyeOff, Link2, RefreshCw, Send, Server, X } from "lucide-react";
import apiMark from "@assets/2165004_1790349891082.png";
import linkMark from "@assets/20260710_225432_1790349955510.png";
import { useLanguage } from "@/hooks/use-language";
import "./developer-reference.css";

type WebhookResponse = {
  webhookUrl?: string | null;
  events?: string[];
};

type ApiKeyResponse = {
  apiKey: string;
  createdAt?: string;
};

type TestWebhookResponse = {
  ok: boolean;
  statusCode: number;
};

type RequestCopy = {
  title: string;
  subtitle: string;
  webhook: string;
  webhookHelp: string;
  endpoint: string;
  endpointPlaceholder: string;
  save: string;
  test: string;
  testing: string;
  disable: string;
  apiKey: string;
  apiKeyHelp: string;
  show: string;
  hide: string;
  copy: string;
  copied: string;
  rotate: string;
  rotateConfirm: string;
  loading: string;
  error: string;
  saved: string;
  disabled: string;
  testSuccess: (status: number) => string;
  testFailure: string;
  events: string;
  eventCreated: string;
  eventUpdated: string;
  deliveryNote: string;
  copyFailure: string;
  keyRotationFailure: string;
};

const copyFor = (lang: string): RequestCopy =>
  lang === "fr"
    ? {
        title: "console développeurs",
        subtitle: "Connectez ZyNum à vos outils en quelques secondes.",
        webhook: "paramètres du webhook",
        webhookHelp: "Recevez les événements de vos commandes sur une URL HTTPS publique.",
        endpoint: "URL de réception",
        endpointPlaceholder: "entrez votre url de webhook",
        save: "Enregistrer",
        test: "Tester",
        testing: "Test…",
        disable: "Désactiver",
        apiKey: "clé api zynum",
        apiKeyHelp: "Cette clé authentifie vos appels API et signe les livraisons webhook. Ne la partagez jamais.",
        show: "Afficher la clé API",
        hide: "Masquer la clé API",
        copy: "Copier la clé API",
        copied: "Clé API copiée",
        rotate: "régénérer",
        rotateConfirm: "Régénérer la clé API invalidera immédiatement l’ancienne. Continuer ?",
        loading: "Chargement des paramètres développeur…",
        error: "Impossible de charger les paramètres développeur.",
        saved: "Configuration webhook enregistrée.",
        disabled: "Webhook désactivé.",
        testSuccess: (status) => `Test envoyé avec succès — réponse HTTP ${status}.`,
        testFailure: "Le test webhook n’a pas été accepté par votre endpoint.",
        events: "Événements envoyés",
        eventCreated: "Une nouvelle commande est créée",
        eventUpdated: "Le statut ou les données SMS changent",
        deliveryNote: "Chaque livraison est signée avec votre clé API et réessayée automatiquement en cas d’échec.",
        copyFailure: "Impossible de copier la clé dans le presse-papiers.",
        keyRotationFailure: "Impossible de régénérer la clé API.",
      }
    : {
        title: "developer console",
        subtitle: "Connect ZyNum to your tools in a few seconds.",
        webhook: "webhook settings",
        webhookHelp: "Receive order events at a public HTTPS URL.",
        endpoint: "Destination URL",
        endpointPlaceholder: "enter your webhook url",
        save: "Save",
        test: "Test",
        testing: "Testing…",
        disable: "Disable",
        apiKey: "zynum api key",
        apiKeyHelp: "This key authenticates API calls and signs webhook deliveries. Never share it.",
        show: "Show API key",
        hide: "Hide API key",
        copy: "Copy API key",
        copied: "API key copied",
        rotate: "regenerate",
        rotateConfirm: "Regenerating the API key immediately invalidates the old one. Continue?",
        loading: "Loading developer settings…",
        error: "Could not load developer settings.",
        saved: "Webhook settings saved.",
        disabled: "Webhook disabled.",
        testSuccess: (status) => `Test delivered successfully — HTTP ${status} response.`,
        testFailure: "Your endpoint did not accept the webhook test.",
        events: "Events sent",
        eventCreated: "A new order is created",
        eventUpdated: "Order status or SMS data changes",
        deliveryNote: "Every delivery is signed with your API key and retried automatically if it fails.",
        copyFailure: "Could not copy the key to the clipboard.",
        keyRotationFailure: "Could not regenerate the API key.",
      };

function authHeaders(json = false): HeadersInit {
  const token = localStorage.getItem("zynum_token");
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function responseMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string; error?: string };
    return body.message ?? body.error ?? fallback;
  } catch {
    return fallback;
  }
}

export default function DeveloperPage() {
  const { lang } = useLanguage();
  const labels = useMemo(() => copyFor(lang), [lang]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookInput, setWebhookInput] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [rotatingApiKey, setRotatingApiKey] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const webhookIsChanged = webhookInput.trim() !== webhookUrl;
  const primaryWebhookAction = !webhookUrl || webhookIsChanged ? "save" : "test";
  const maskedApiKey = apiKey ? `${apiKey.slice(0, 4)}${"•".repeat(24)}${apiKey.slice(-4)}` : "";

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      fetch("/api/v1/developer/webhook", { headers: authHeaders() }),
      fetch("/api/v1/developer/apikey", { headers: authHeaders() }),
    ])
      .then(async ([webhookResponse, keyResponse]) => {
        if (!webhookResponse.ok || !keyResponse.ok) {
          const message = !webhookResponse.ok
            ? await responseMessage(webhookResponse, labels.error)
            : await responseMessage(keyResponse, labels.error);
          throw new Error(message);
        }
        const webhookData = (await webhookResponse.json()) as WebhookResponse;
        const keyData = (await keyResponse.json()) as ApiKeyResponse;
        if (!active) return;
        const savedUrl = webhookData.webhookUrl ?? "";
        setWebhookUrl(savedUrl);
        setWebhookInput(savedUrl);
        setApiKey(keyData.apiKey);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : labels.error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [labels.error]);

  const handleWebhookSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingWebhook(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/v1/developer/webhook", {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify({ url: webhookInput.trim() || null }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, labels.error));
      const data = (await response.json()) as WebhookResponse;
      const savedUrl = data.webhookUrl ?? "";
      setWebhookUrl(savedUrl);
      setWebhookInput(savedUrl);
      setNotice(savedUrl ? labels.saved : labels.disabled);
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : labels.error);
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleWebhookTest = async () => {
    setTestingWebhook(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/v1/developer/webhook/test", {
        method: "POST",
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error(await responseMessage(response, labels.testFailure));
      const data = (await response.json()) as TestWebhookResponse;
      if (!data.ok) throw new Error(labels.testFailure);
      setNotice(labels.testSuccess(data.statusCode));
    } catch (testError: unknown) {
      setError(testError instanceof Error ? testError.message : labels.testFailure);
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleWebhookAction = (event: FormEvent<HTMLFormElement>) => {
    if (primaryWebhookAction === "test") {
      event.preventDefault();
      void handleWebhookTest();
    } else {
      void handleWebhookSave(event);
    }
  };

  const handleDisable = async () => {
    setWebhookInput("");
    setSavingWebhook(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/v1/developer/webhook", {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify({ url: null }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, labels.error));
      setWebhookUrl("");
      setNotice(labels.disabled);
    } catch (disableError: unknown) {
      setError(disableError instanceof Error ? disableError.message : labels.error);
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setNotice(labels.copied);
    } catch {
      setError(labels.copyFailure);
    }
  };

  const handleRotate = async () => {
    if (!window.confirm(labels.rotateConfirm)) return;
    setRotatingApiKey(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/v1/developer/apikey", {
        method: "POST",
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error(await responseMessage(response, labels.keyRotationFailure));
      const data = (await response.json()) as ApiKeyResponse;
      setApiKey(data.apiKey);
      setShowApiKey(false);
      setNotice(labels.saved);
    } catch (rotateError: unknown) {
      setError(rotateError instanceof Error ? rotateError.message : labels.keyRotationFailure);
    } finally {
      setRotatingApiKey(false);
    }
  };

  if (loading) {
    return (
      <main className="zynum-developer-page" data-testid="page-developer">
        <div className="zynum-developer-skeleton" aria-label={labels.loading} data-testid="status-developer-loading">
          <div className="zynum-developer-skeleton-line" />
          <div className="zynum-developer-skeleton-block" />
          <div className="zynum-developer-skeleton-block" />
        </div>
      </main>
    );
  }

  return (
    <main className="zynum-developer-page" data-testid="page-developer">
      <div className="zynum-developer-frame">
        <header className="zynum-developer-topbar">
          <div className="zynum-developer-mark" aria-hidden="true">
            <img src={apiMark} alt="" />
          </div>
          <div>
            <p className="zynum-developer-kicker">zynum.net</p>
            <h1 className="zynum-developer-heading">{labels.title}</h1>
          </div>
        </header>

        {error && (
          <p className="zynum-developer-status is-error" role="alert" data-testid="status-developer-error">
            <X aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
        {notice && !error && (
          <p className="zynum-developer-status" role="status" data-testid="status-developer-success">
            <Check aria-hidden="true" />
            <span>{notice}</span>
          </p>
        )}

        <section className="zynum-developer-card" data-testid="card-developer-webhook">
          <div className="zynum-developer-card-header">
            <div>
              <h2 className="zynum-developer-card-title">{labels.webhook}</h2>
              <p className="zynum-developer-card-copy">{labels.webhookHelp}</p>
            </div>
            <span className="zynum-developer-section-icon" aria-hidden="true">
              <Server />
            </span>
          </div>

          <form onSubmit={handleWebhookAction} data-testid="form-developer-webhook">
            <label className="zynum-developer-field-label" htmlFor="developer-webhook-url">
              {labels.endpoint}
            </label>
            <div className="zynum-developer-input-shell">
              <input
                id="developer-webhook-url"
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder={labels.endpointPlaceholder}
                value={webhookInput}
                onChange={(event) => {
                  setWebhookInput(event.target.value);
                  setNotice("");
                  setError("");
                }}
                data-testid="input-developer-webhook-url"
              />
            </div>
            <div className="zynum-developer-card-actions">
              {webhookUrl && (
                <button
                  type="button"
                  className="zynum-developer-secondary"
                  onClick={() => void handleDisable()}
                  disabled={savingWebhook || testingWebhook}
                  data-testid="button-disable-webhook"
                >
                  {labels.disable}
                </button>
              )}
              <button
                type="submit"
                className="zynum-developer-primary"
                disabled={savingWebhook || testingWebhook || !webhookInput.trim()}
                data-testid={primaryWebhookAction === "save" ? "button-save-webhook" : "button-test-webhook"}
              >
                {primaryWebhookAction === "test" ? <Send aria-hidden="true" /> : null}
                {savingWebhook ? "…" : testingWebhook ? labels.testing : primaryWebhookAction === "save" ? labels.save : labels.test}
              </button>
            </div>
          </form>

          <div className="zynum-developer-details">
            <strong>{labels.events}</strong>
            <ul>
              <li><code>order.created</code> — {labels.eventCreated}</li>
              <li><code>order.updated</code> — {labels.eventUpdated}</li>
            </ul>
          </div>
        </section>

        <section className="zynum-developer-card" data-testid="card-developer-api-key">
          <div className="zynum-developer-card-header">
            <div>
              <h2 className="zynum-developer-card-title">{labels.apiKey}</h2>
              <p className="zynum-developer-card-copy">{labels.apiKeyHelp}</p>
            </div>
            <span className="zynum-developer-section-icon" aria-hidden="true">
              <Link2 />
            </span>
          </div>

          <span className="zynum-developer-field-label">{labels.apiKey}</span>
          <div className="zynum-developer-input-shell" data-testid="text-developer-api-key">
            <code>{showApiKey ? apiKey : maskedApiKey}</code>
            <button
              type="button"
              className="zynum-developer-key-action"
              onClick={() => setShowApiKey((current) => !current)}
              aria-label={showApiKey ? labels.hide : labels.show}
              data-testid="button-toggle-api-key"
            >
              {showApiKey ? <EyeOff /> : <img src={linkMark} alt="" />}
            </button>
            <button
              type="button"
              className="zynum-developer-key-action"
              onClick={() => void handleCopy()}
              disabled={!apiKey}
              aria-label={labels.copy}
              data-testid="button-copy-api-key"
            >
              <Copy aria-hidden="true" />
            </button>
          </div>
          <div className="zynum-developer-card-actions">
            <button
              type="button"
              className="zynum-developer-primary"
              onClick={() => void handleRotate()}
              disabled={rotatingApiKey}
              data-testid="button-rotate-api-key"
            >
              <RefreshCw aria-hidden="true" />
              {rotatingApiKey ? "…" : labels.rotate}
            </button>
          </div>
          <p className="zynum-developer-footer-note" data-testid="text-developer-delivery-note">{labels.deliveryNote}</p>
        </section>
      </div>
    </main>
  );
}