import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Eye, EyeOff, RefreshCw, Send, X } from "lucide-react";
import linkMark from "@assets/20260710_225432_1790349955510.png";
import { useLanguage } from "@/hooks/use-language";
import { DEVELOPER_DOCS_URL } from "@/lib/urls";
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
  webhook: string;
  endpoint: string;
  endpointPlaceholder: string;
  save: string;
  test: string;
  testing: string;
  apiKey: string;
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
  copyFailure: string;
  keyRotationFailure: string;
  integrationTitle: string;
  integrationDescription: string;
  eventsTitle: string;
  orderCreated: string;
  orderUpdated: string;
  requestHeaders: string;
  and: string;
  signatureVerification: string;
  persistentDelivery: string;
  docsLink: string;
};

const copyFor = (lang: string): RequestCopy =>
  lang === "fr"
    ? {
        webhook: "paramètres du webhook",
        endpoint: "URL de réception",
        endpointPlaceholder: "entrez votre url de webhook",
        save: "Enregistrer",
        test: "Tester",
        testing: "Test…",
        apiKey: "Clé API ZyNum",
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
        copyFailure: "Impossible de copier la clé dans le presse-papiers.",
        keyRotationFailure: "Impossible de régénérer la clé API.",
        integrationTitle: "Intégration développeur",
        integrationDescription: "Configurez le webhook de votre compte et gérez votre clé API unique.",
        eventsTitle: "Événements envoyés",
        orderCreated: "Nouvelle commande créée",
        orderUpdated: "Statut ou données SMS modifiés",
        requestHeaders: "Chaque requête inclut",
        and: "et",
        signatureVerification: "Vérifiez le HMAC-SHA256 du corps brut avec votre clé API.",
        persistentDelivery: "Livraison persistante : reprise automatique avec délai progressif, jusqu’à 12 tentatives. Répondez avec un statut HTTP 2xx pour confirmer la réception.",
        docsLink: "Voir le contrat webhook dans la documentation API",
      }
    : {
        webhook: "webhook settings",
        endpoint: "Destination URL",
        endpointPlaceholder: "enter your webhook url",
        save: "Save",
        test: "Test",
        testing: "Testing…",
        apiKey: "ZyNum API key",
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
        copyFailure: "Could not copy the key to the clipboard.",
        keyRotationFailure: "Could not regenerate the API key.",
        integrationTitle: "Developer integration",
        integrationDescription: "Configure your account webhook and manage your unique API key.",
        eventsTitle: "Events sent",
        orderCreated: "New order created",
        orderUpdated: "Status or SMS data changed",
        requestHeaders: "Each request includes",
        and: "and",
        signatureVerification: "Verify the HMAC-SHA256 of the raw body with your API key.",
        persistentDelivery: "Persistent delivery: automatic retries with progressive backoff, up to 12 attempts. Respond with an HTTP 2xx status to acknowledge receipt.",
        docsLink: "View the webhook contract in the API documentation",
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
            <h2 className="zynum-developer-card-title">{labels.webhook}</h2>
          </div>

          <form onSubmit={handleWebhookAction} data-testid="form-developer-webhook">
            <div className="zynum-developer-input-shell">
              <input
                id="developer-webhook-url"
                aria-label={labels.endpoint}
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
              <button
                type="submit"
                className="zynum-developer-primary"
                disabled={savingWebhook || testingWebhook || (!webhookUrl && !webhookInput.trim())}
                data-testid={primaryWebhookAction === "save" ? "button-save-webhook" : "button-test-webhook"}
              >
                {primaryWebhookAction === "test" ? <Send aria-hidden="true" /> : null}
                {savingWebhook ? "…" : testingWebhook ? labels.testing : primaryWebhookAction === "save" ? labels.save : labels.test}
              </button>
            </div>
          </form>
        </section>

        <section className="zynum-developer-card" data-testid="card-developer-api-key">
          <div className="zynum-developer-card-header">
            <h2 className="zynum-developer-card-title zynum-developer-card-title-api-key">{labels.apiKey}</h2>
          </div>

          <div className="zynum-developer-input-shell" data-testid="text-developer-api-key">
            <code>{showApiKey ? apiKey : maskedApiKey}</code>
            <button
              type="button"
              className="zynum-developer-key-action is-visibility"
              onClick={() => setShowApiKey((current) => !current)}
              aria-label={showApiKey ? labels.hide : labels.show}
              data-testid="button-toggle-api-key"
            >
              {showApiKey ? <EyeOff /> : <Eye />}
            </button>
            <button
              type="button"
              className="zynum-developer-key-action is-copy"
              onClick={() => void handleCopy()}
              disabled={!apiKey}
              aria-label={labels.copy}
              data-testid="button-copy-api-key"
            >
              <img src={linkMark} alt="" aria-hidden="true" />
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
        </section>

        <section
          className="zynum-developer-details"
          aria-labelledby="developer-integration-title"
          data-testid="developer-integration-info"
        >
          <h2 id="developer-integration-title">{labels.integrationTitle}</h2>
          <p className="zynum-developer-details-intro">{labels.integrationDescription}</p>

          <h3>{labels.eventsTitle}</h3>
          <ul>
            <li><code>order.created</code> — {labels.orderCreated}</li>
            <li><code>order.updated</code> — {labels.orderUpdated}</li>
          </ul>

          <p className="zynum-developer-details-note">
            {labels.requestHeaders}{" "}
            <code>X-ZyNum-Event</code>, <code>X-ZyNum-Delivery</code> {labels.and}{" "}
            <code>X-ZyNum-Signature</code>. {labels.signatureVerification}
          </p>
          <p className="zynum-developer-details-note">{labels.persistentDelivery}</p>

          <a
            className="zynum-developer-details-link"
            href={`${DEVELOPER_DOCS_URL}#webhooks`}
            target="_blank"
            rel="noreferrer"
          >
            {labels.docsLink}
          </a>
        </section>
      </div>
    </main>
  );
}