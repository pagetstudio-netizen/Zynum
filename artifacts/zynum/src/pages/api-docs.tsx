import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  Clipboard,
  Code2,
  ExternalLink,
  FileJson,
  Globe2,
  KeyRound,
  Menu,
  Moon,
  Search,
  Server,
  ShieldCheck,
  Sun,
  Terminal,
  X,
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

type Lang = "fr" | "en";
type Method = "GET" | "POST";
type Localized = { en: string; fr: string };

const BASE_URL = "https://zynum.net/api";

const copyText = async (value: string) => {
  if (navigator.clipboard) await navigator.clipboard.writeText(value);
};

const ACTION_LABELS: Record<Lang, { copy: string; copied: string; copyPath: string; copySample: string; copySection: string }> = {
  en: { copy: "Copy", copied: "Copied", copyPath: "Copy endpoint URL", copySample: "Copy code sample", copySection: "Copy section URL" },
  fr: { copy: "Copier", copied: "Copié", copyPath: "Copier l’URL de l’endpoint", copySample: "Copier l’exemple de code", copySection: "Copier l’URL de la section" },
};

const CODE_LABELS: Record<Lang, Record<string, string>> = {
  en: {
    authentication: "Authentication",
    "server-side-request": "Server-side request",
    "request-body": "Request body",
    response: "Response example",
    "ai-skill": "Agent skill",
  },
  fr: {
    authentication: "Authentification",
    "server-side-request": "Requête côté serveur",
    "request-body": "Corps de la requête",
    response: "Exemple de réponse",
    "ai-skill": "Compétence agent",
  },
};

const ENDPOINT_UI: Record<Lang, { endpoint: string; authentication: string; request: string; response: string; errors: string; linkTo: string }> = {
  en: { endpoint: "Endpoint", authentication: "Authentication", request: "Request", response: "Response", errors: "Errors", linkTo: "Link to" },
  fr: { endpoint: "Endpoint", authentication: "Authentification", request: "Requête", response: "Réponse", errors: "Erreurs", linkTo: "Lien vers" },
};

type EndpointTranslation = {
  title: string;
  description: string;
  auth: string;
  request: string;
  errors: string[];
};

const ENDPOINT_COPY: Record<string, Record<Lang, EndpointTranslation>> = {
  services: {
    en: {
      title: "List services",
      description: "Discover the services currently available for number purchases. This route is public.",
      auth: "Public. No Authorization header is required.",
      request: "No query parameters or request body.",
      errors: ["Non-2xx responses indicate that the catalog could not be returned."],
    },
    fr: {
      title: "Lister les services",
      description: "Découvrez les services actuellement proposés pour les achats de numéros. Cette route est publique.",
      auth: "Publique. Aucun header Authorization n’est requis.",
      request: "Aucun paramètre de requête ni corps de requête.",
      errors: ["Une réponse hors 2xx indique que le catalogue n’a pas pu être retourné."],
    },
  },
  countries: {
    en: {
      title: "List countries",
      description: "Return countries and an illustrative availability value for a service. The service query is optional and defaults to telegram.",
      auth: "Public. No Authorization header is required.",
      request: "Query: service (optional, string). Defaults to telegram.",
      errors: ["Non-2xx responses indicate that the country catalog could not be returned."],
    },
    fr: {
      title: "Lister les pays",
      description: "Retourne les pays et une valeur de disponibilité illustrative pour un service. La requête service est optionnelle et vaut telegram par défaut.",
      auth: "Publique. Aucun header Authorization n’est requis.",
      request: "Requête : service (optionnel, string). Vaut telegram par défaut.",
      errors: ["Une réponse hors 2xx indique que le catalogue des pays n’a pas pu être retourné."],
    },
  },
  operators: {
    en: {
      title: "List operators",
      description: "Return operators, prices, and an illustrative availability value for one service/country combination.",
      auth: "Bearer API key required.",
      request: "Query: service (required, string), country (required, string).",
      errors: ["400 — a required service or country query field is missing.", "401 — the Bearer API key is missing or invalid."],
    },
    fr: {
      title: "Lister les opérateurs",
      description: "Retourne les opérateurs, les prix et une valeur de disponibilité illustrative pour une combinaison service/pays.",
      auth: "Clé API Bearer requise.",
      request: "Requête : service (requis, string), country (requis, string).",
      errors: ["400 — un champ service ou country requis est manquant.", "401 — la clé API Bearer est absente ou invalide."],
    },
  },
  balance: {
    en: {
      title: "Get balance",
      description: "Read the current ZyNum balance for the authenticated account.",
      auth: "Bearer API key required.",
      request: "No query parameters or request body.",
      errors: ["401 — the Bearer API key is missing or invalid."],
    },
    fr: {
      title: "Consulter le solde",
      description: "Consultez le solde ZyNum actuel du compte authentifié.",
      auth: "Clé API Bearer requise.",
      request: "Aucun paramètre de requête ni corps de requête.",
      errors: ["401 — la clé API Bearer est absente ou invalide."],
    },
  },
  buy: {
    en: {
      title: "Buy a number",
      description: "Spend the account balance on a virtual-number purchase. The returned order.id is the id used by subsequent order routes.",
      auth: "Bearer API key required.",
      request: "JSON body: service (string, required), country (string, required), currency (USD or FCFA, optional, defaults to USD), operator (string, optional), discountCode (string, optional).",
      errors: ["400 — validation, purchase, or balance error.", "401 — the Bearer API key is missing or invalid.", "409 — NUMBER_UNAVAILABLE."],
    },
    fr: {
      title: "Acheter un numéro",
      description: "Dépensez le solde du compte pour acheter un numéro virtuel. Le order.id retourné est l’identifiant utilisé par les routes de commande suivantes.",
      auth: "Clé API Bearer requise.",
      request: "Corps JSON : service (string, requis), country (string, requis), currency (USD ou FCFA, optionnel, USD par défaut), operator (string, optionnel), discountCode (string, optionnel).",
      errors: ["400 — erreur de validation, d’achat ou de solde.", "401 — la clé API Bearer est absente ou invalide.", "409 — NUMBER_UNAVAILABLE."],
    },
  },
  check: {
    en: {
      title: "Check an order",
      description: "Read the current state and SMS data for an order owned by the authenticated account.",
      auth: "Bearer API key required. Only the current account’s orders are visible.",
      request: "Path: orderId (required, the order.id returned by ZyNum). No request body.",
      errors: ["401 — the Bearer API key is missing or invalid.", "404 — the order is not available to the current account.", "503 — refund is pending."],
    },
    fr: {
      title: "Vérifier une commande",
      description: "Consultez l’état actuel et les données SMS d’une commande appartenant au compte authentifié.",
      auth: "Clé API Bearer requise. Seules les commandes du compte courant sont visibles.",
      request: "Chemin : orderId (requis, le order.id retourné par ZyNum). Aucun corps de requête.",
      errors: ["401 — la clé API Bearer est absente ou invalide.", "404 — la commande n’est pas disponible pour le compte courant.", "503 — le remboursement est en attente."],
    },
  },
  orders: {
    en: {
      title: "List orders",
      description: "Return the authenticated account’s orders, newest first.",
      auth: "Bearer API key required.",
      request: "Query: page (optional, number, defaults to 1), limit (optional, number, defaults to 20).",
      errors: ["401 — the Bearer API key is missing or invalid."],
    },
    fr: {
      title: "Lister les commandes",
      description: "Retourne les commandes du compte authentifié, de la plus récente à la plus ancienne.",
      auth: "Clé API Bearer requise.",
      request: "Requête : page (optionnel, number, 1 par défaut), limit (optionnel, number, 20 par défaut).",
      errors: ["401 — la clé API Bearer est absente ou invalide."],
    },
  },
  cancel: {
    en: {
      title: "Cancel an order",
      description: "Request cancellation of an order and the associated balance refund when the order state allows it.",
      auth: "Bearer API key required.",
      request: "Path: orderId (required, the order.id returned by ZyNum). No request body.",
      errors: ["400 — the request is invalid for the order state.", "401 — the Bearer API key is missing or invalid.", "404 — the order is not found for the current account.", "409 — the order cannot be canceled in its current state.", "503 — refund is pending."],
    },
    fr: {
      title: "Annuler une commande",
      description: "Demande l’annulation d’une commande et le remboursement associé lorsque son état le permet.",
      auth: "Clé API Bearer requise.",
      request: "Chemin : orderId (requis, le order.id retourné par ZyNum). Aucun corps de requête.",
      errors: ["400 — la requête n’est pas valide pour l’état de la commande.", "401 — la clé API Bearer est absente ou invalide.", "404 — la commande est introuvable pour le compte courant.", "409 — la commande ne peut pas être annulée dans son état actuel.", "503 — le remboursement est en attente."],
    },
  },
  finish: {
    en: {
      title: "Finish an order",
      description: "Finish an order after an SMS code has been received. This action is only valid for an order in RECEIVED status.",
      auth: "Bearer API key required.",
      request: "Path: orderId (required, the order.id returned by ZyNum). No request body.",
      errors: ["401 — the Bearer API key is missing or invalid.", "404 — the order is not found for the current account.", "409 — the order is not RECEIVED or cannot be finished.", "502 — the order could not be finished."],
    },
    fr: {
      title: "Terminer une commande",
      description: "Termine une commande après réception d’un code SMS. Cette action est valide uniquement pour une commande au statut RECEIVED.",
      auth: "Clé API Bearer requise.",
      request: "Chemin : orderId (requis, le order.id retourné par ZyNum). Aucun corps de requête.",
      errors: ["401 — la clé API Bearer est absente ou invalide.", "404 — la commande est introuvable pour le compte courant.", "409 — la commande n’est pas RECEIVED ou ne peut pas être terminée.", "502 — la commande n’a pas pu être terminée."],
    },
  },
};

function CopyButton({
  value,
  label,
  lang,
  ariaTarget,
}: {
  value: string;
  label: string;
  lang: Lang;
  ariaTarget?: string;
}) {
  const [copied, setCopied] = useState(false);
  const actions = ACTION_LABELS[lang];

  const handleCopy = async () => {
    await copyText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      data-testid={`button-copy-${label}`}
      aria-label={copied ? actions.copied : ariaTarget ?? `${actions.copy} ${label}`}
      className="docs-copy-button"
      onClick={handleCopy}
    >
      {copied ? <Check size={14} aria-hidden="true" /> : <Clipboard size={14} aria-hidden="true" />}
      <span>{copied ? actions.copied : actions.copy}</span>
    </button>
  );
}

function CodeBlock({ code, label, lang, sampleKey = label }: { code: string; label: string; lang: Lang; sampleKey?: string }) {
  return (
    <div className="docs-code-wrap" data-testid={`code-sample-${sampleKey}`}>
      <div className="docs-code-toolbar">
        <span className="docs-code-label">
          <Terminal size={13} aria-hidden="true" />
          {CODE_LABELS[lang][label] ?? label}
        </span>
        <CopyButton value={code} label={`sample-${sampleKey}`} lang={lang} ariaTarget={ACTION_LABELS[lang].copySample} />
      </div>
      <pre className="docs-code"><code>{code}</code></pre>
    </div>
  );
}

function MethodBadge({ method }: { method: Method }) {
  return <span className={`docs-method docs-method-${method.toLowerCase()}`}>{method}</span>;
}

function Endpoint({
  id,
  title,
  method,
  path,
  description,
  auth,
  request,
  response,
  errors,
  children,
  lang,
}: {
  id: string;
  title: string;
  method: Method;
  path: string;
  description: string;
  auth: string;
  request: string;
  response: string;
  errors: string[];
  children?: ReactNode;
  lang: Lang;
}) {
  const ui = ENDPOINT_UI[lang];
  const localized = ENDPOINT_COPY[id]?.[lang];
  return (
    <section id={id} className="docs-section docs-endpoint" data-testid={`section-${id}`}>
      <div className="docs-endpoint-heading">
        <div>
          <p className="docs-kicker">{ui.endpoint}</p>
          <h2>{localized?.title ?? title}</h2>
        </div>
        <a className="docs-anchor" href={`/api-docs#${id}`} aria-label={`${ui.linkTo} ${localized?.title ?? title}`}>#</a>
      </div>
      <p className="docs-lede">{localized?.description ?? description}</p>
      <div className="docs-path-row" data-testid={`path-${id}`}>
        <MethodBadge method={method} />
        <code>{path}</code>
        <CopyButton value={`${BASE_URL}${path}`} label={`path-${id}`} lang={lang} ariaTarget={ACTION_LABELS[lang].copyPath} />
      </div>
      <div className="docs-detail-grid">
        <div className="docs-detail-card">
          <div className="docs-detail-label"><ShieldCheck size={14} aria-hidden="true" /> {ui.authentication}</div>
          <p>{localized?.auth ?? auth}</p>
        </div>
        <div className="docs-detail-card">
          <div className="docs-detail-label"><FileJson size={14} aria-hidden="true" /> {ui.request}</div>
          <p>{localized?.request ?? request}</p>
        </div>
      </div>
      {children}
      <div className="docs-example-grid">
        <div>
          <div className="docs-subheading"><ChevronRight size={15} aria-hidden="true" /> {ui.response}</div>
          <CodeBlock code={response} label="response" sampleKey={`${id}-response`} lang={lang} />
        </div>
        <div>
          <div className="docs-subheading docs-error-heading"><CircleAlert size={15} aria-hidden="true" /> {ui.errors}</div>
          <ul className="docs-error-list">
            {(localized?.errors ?? errors).map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

const NAV_GROUPS = [
  {
    label: { en: "Getting started", fr: "Premiers pas" },
    items: [
      { id: "introduction", label: { en: "Introduction", fr: "Introduction" } },
      { id: "authentication", label: { en: "Authentication", fr: "Authentification" } },
      { id: "quickstart", label: { en: "Quickstart", fr: "Démarrage rapide" } },
    ],
  },
  {
    label: { en: "Catalog", fr: "Catalogue" },
    items: [
      { id: "services", label: { en: "List services", fr: "Lister les services" } },
      { id: "countries", label: { en: "List countries", fr: "Lister les pays" } },
      { id: "operators", label: { en: "List operators", fr: "Lister les opérateurs" } },
    ],
  },
  {
    label: { en: "Account & orders", fr: "Compte et commandes" },
    items: [
      { id: "balance", label: { en: "Get balance", fr: "Consulter le solde" } },
      { id: "buy", label: { en: "Buy a number", fr: "Acheter un numéro" } },
      { id: "check", label: { en: "Check an order", fr: "Vérifier une commande" } },
      { id: "orders", label: { en: "List orders", fr: "Lister les commandes" } },
      { id: "cancel", label: { en: "Cancel an order", fr: "Annuler une commande" } },
      { id: "finish", label: { en: "Finish an order", fr: "Terminer une commande" } },
    ],
  },
  {
    label: { en: "Reference", fr: "Référence" },
    items: [
      { id: "ai-agents", label: { en: "AI agents", fr: "Agents IA" } },
      { id: "errors", label: { en: "Errors & statuses", fr: "Erreurs et statuts" } },
    ],
  },
];

const labels = {
  en: {
    docs: "API documentation",
    current: "Current",
    menu: "Open documentation menu",
    close: "Close documentation menu",
    theme: "Toggle color theme",
    version: "API version",
    language: "Language",
    upcoming: "Not available yet",
    search: "Search documentation",
    baseUrl: "Base URL",
    introKicker: "BUILD WITH ZYNUM",
    introTitle: "A clear path from balance to SMS",
    introBody: "The ZyNum API gives your automation a small, predictable surface for discovering services and countries, purchasing virtual-number orders, and reading their SMS state.",
    introNote: "v1 is the documented and current version. v2 is not available yet.",
    keyArea: "Manage your key in the developer area of your ZyNum account.",
    authTitle: "Authentication",
    authBody: "Private endpoints use a Bearer API key. Send it on every authenticated request; never expose it in browser code, logs, or support messages.",
    quickTitle: "Quickstart",
    quickBody: "The shortest safe integration is: inspect the catalog, buy with an authenticated server-side request, then poll the order endpoint from your backend.",
    parameters: "Parameters",
    body: "JSON body",
    query: "Query parameters",
    path: "Path parameter",
    required: "required",
    optional: "optional",
    noBody: "No request body.",
    onlyCurrent: "Only orders belonging to the current account are visible.",
    statusTitle: "Order statuses",
    statusBody: "Use the status returned in the order object to drive your integration. Timestamps are ISO 8601 strings.",
    errorsTitle: "Errors & status codes",
    errorsBody: "Treat non-2xx responses as actionable. The endpoint sections above list the documented cases for each route.",
    security: "Security",
    integration: "Integration",
    catalog: "CATALOG",
    accountOrders: "ACCOUNT & ORDERS",
    reference: "REFERENCE",
    aiTitle: "AI agents & skills",
    aiBody: "Give an AI coding agent a stable starting point for ZyNum integrations. The skill file summarizes the documented v1 surface and can be downloaded or referenced from your agent workflow.",
    aiDownload: "Download the ZyNum API skill",
    aiUrl: "Section URL",
    statusHeader: "Status",
    meaningHeader: "Meaning",
    statusMeanings: {
      PENDING: "Purchase accepted; the order is not finished.",
      RECEIVED: "The order has entered the received state; inspect smsCode before using or finishing it.",
      FINISHED: "The order was completed.",
      TIMEOUT: "The order timed out.",
      BANNED: "The number was banned.",
      CANCELED: "The order was canceled.",
    },
    footer: "ZyNum API reference · v1",
  },
  fr: {
    docs: "Documentation API",
    current: "Actuelle",
    menu: "Ouvrir le menu de documentation",
    close: "Fermer le menu de documentation",
    theme: "Changer le thème",
    version: "Version de l’API",
    language: "Langue",
    upcoming: "Pas encore disponible",
    search: "Rechercher dans la documentation",
    baseUrl: "URL de base",
    introKicker: "CONSTRUIRE AVEC ZYNUM",
    introTitle: "Du solde au SMS, sans détour",
    introBody: "L’API ZyNum offre une surface simple et prévisible pour découvrir les services et pays, acheter des commandes de numéros virtuels et suivre leurs SMS.",
    introNote: "v1 est la version documentée et actuelle. v2 n’est pas encore disponible.",
    keyArea: "Gérez votre clé dans l’espace développeur de votre compte ZyNum.",
    authTitle: "Authentification",
    authBody: "Les endpoints privés utilisent une clé API Bearer. Envoyez-la pour chaque requête authentifiée ; ne l’exposez jamais dans le navigateur, les logs ou un message de support.",
    quickTitle: "Démarrage rapide",
    quickBody: "L’intégration la plus sûre consiste à consulter le catalogue, acheter depuis votre serveur, puis interroger la commande depuis votre backend.",
    parameters: "Paramètres",
    body: "Corps JSON",
    query: "Paramètres de requête",
    path: "Paramètre de chemin",
    required: "requis",
    optional: "optionnel",
    noBody: "Aucun corps de requête.",
    onlyCurrent: "Seules les commandes du compte courant sont visibles.",
    statusTitle: "Statuts des commandes",
    statusBody: "Utilisez le statut retourné dans l’objet order pour piloter votre intégration. Les dates sont au format ISO 8601.",
    errorsTitle: "Erreurs et codes de statut",
    errorsBody: "Traitez les réponses hors 2xx. Chaque endpoint détaille les cas documentés pour sa route.",
    security: "Sécurité",
    integration: "Intégration",
    catalog: "CATALOGUE",
    accountOrders: "COMPTE ET COMMANDES",
    reference: "RÉFÉRENCE",
    aiTitle: "Agents IA et compétences",
    aiBody: "Donnez à un agent de code IA un point de départ stable pour les intégrations ZyNum. Le fichier de compétence résume la surface v1 documentée et peut être téléchargé ou référencé dans votre workflow agent.",
    aiDownload: "Télécharger la compétence API ZyNum",
    aiUrl: "URL de la section",
    statusHeader: "Statut",
    meaningHeader: "Signification",
    statusMeanings: {
      PENDING: "Achat accepté ; la commande n’est pas terminée.",
      RECEIVED: "La commande est au statut reçu ; vérifiez smsCode avant de l’utiliser ou de la terminer.",
      FINISHED: "La commande est terminée.",
      TIMEOUT: "La commande a expiré.",
      BANNED: "Le numéro a été banni.",
      CANCELED: "La commande a été annulée.",
    },
    footer: "Référence API ZyNum · v1",
  },
} as const;

export default function ApiDocs() {
  const { lang, setLang } = useLanguage();
  const copy = labels[lang] ?? labels.fr;
  const [isDark, setIsDark] = useState(() => localStorage.getItem("zynum-docs-theme") === "dark");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState("introduction");
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("light", !isDark);
    localStorage.setItem("zynum-docs-theme", isDark ? "dark" : "light");
    return () => {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    };
  }, [isDark]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const scrollToCurrentHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const section = document.getElementById(id);
      if (!section) return;
      section.scrollIntoView({ behavior: "auto", block: "start" });
      setActiveId(id);
    };

    const timeout = window.setTimeout(scrollToCurrentHash, 0);
    window.addEventListener("hashchange", scrollToCurrentHash);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("hashchange", scrollToCurrentHash);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const sections = NAV_GROUPS.flatMap((group) => group.items)
        .map((item) => document.getElementById(item.id))
        .filter(Boolean) as HTMLElement[];
      const active = [...sections].reverse().find((section) => section.getBoundingClientRect().top <= 120);
      setActiveId(active?.id ?? sections[0]?.id ?? "introduction");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return NAV_GROUPS;
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => `${item.label.en} ${item.label.fr}`.toLowerCase().includes(normalized)),
    })).filter((group) => group.items.length);
  }, [query]);

  const authHeader = "Authorization: Bearer zyn_<secret>";
  const response = (body: string) => body;

  return (
    <div className="docs-shell" data-testid="api-docs-page">
      <header className="docs-topbar">
        <div className="docs-topbar-inner">
          <button
            type="button"
            className="docs-icon-button docs-mobile-only"
            onClick={() => setIsMenuOpen(true)}
            aria-label={copy.menu}
            aria-expanded={isMenuOpen}
            data-testid="button-open-docs-menu"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <a href="/api-docs" className="docs-brand" data-testid="link-docs-home">
            <span className="docs-logo" aria-hidden="true"><Code2 size={18} /></span>
            <span className="docs-brand-name">ZyNum</span>
            <span className="docs-brand-divider" />
            <span className="docs-brand-section">{copy.docs}</span>
          </a>
          <div className="docs-top-actions">
            <div className="docs-language-toggle" role="group" aria-label={copy.language}>
              {(["fr", "en"] as Lang[]).map((option) => (
                    <button
                  type="button"
                  key={option}
                  onClick={() => setLang(option)}
                  className={lang === option ? "is-selected" : ""}
                  data-testid={`button-language-${option}`}
                  aria-pressed={lang === option}
                >
                  {option.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="docs-icon-button"
              onClick={() => setIsDark((value) => !value)}
              aria-label={copy.theme}
              data-testid="button-toggle-docs-theme"
            >
              {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
            </button>
            <div className="docs-version-picker" role="group" aria-label={copy.version}>
              <button type="button" className="is-selected" data-testid="button-version-v1">{copy.current} v1</button>
              <button type="button" disabled title={copy.upcoming} data-testid="button-version-v2">v2</button>
            </div>
          </div>
        </div>
      </header>

      <div className="docs-layout">
        <aside className={`docs-sidebar ${isMenuOpen ? "is-open" : ""}`} aria-label={copy.docs}>
          <div className="docs-sidebar-top">
            <div className="docs-sidebar-title"><BookOpen size={16} aria-hidden="true" /> {copy.docs}</div>
            <button type="button" className="docs-icon-button docs-mobile-only" onClick={() => setIsMenuOpen(false)} aria-label={copy.close} data-testid="button-close-docs-menu">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <label className="docs-search">
            <Search size={15} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.search}
              aria-label={copy.search}
              data-testid="input-docs-search"
            />
          </label>
          <nav className="docs-nav">
            {filteredGroups.map((group) => (
              <div className="docs-nav-group" key={group.label.en}>
                <p className="docs-nav-group-title">{group.label[lang]}</p>
                {group.items.map((item) => (
                  <a
                    key={item.id}
                    href={`/api-docs#${item.id}`}
                    className={activeId === item.id ? "is-active" : ""}
                    onClick={() => {
                      setActiveId(item.id);
                      setIsMenuOpen(false);
                    }}
                    data-testid={`link-docs-${item.id}`}
                  >
                    <span>{item.label[lang]}</span>
                    {activeId === item.id && <ChevronRight size={14} aria-hidden="true" />}
                  </a>
                ))}
              </div>
            ))}
          </nav>
          <div className="docs-sidebar-footer">
            <div className="docs-sidebar-status"><span className="docs-status-dot" /> v1 {copy.current}</div>
            <span>© {new Date().getFullYear()} ZyNum</span>
          </div>
        </aside>
        {isMenuOpen && <button type="button" className="docs-backdrop docs-mobile-only" onClick={() => setIsMenuOpen(false)} aria-label={copy.close} data-testid="button-close-docs-backdrop" />}

        <main className="docs-content">
          <div className="docs-content-inner">
            <section id="introduction" className="docs-section docs-intro" data-testid="section-introduction">
              <div className="docs-eyebrow"><span /> {copy.introKicker}</div>
              <h1>{copy.introTitle}</h1>
              <p className="docs-intro-lede">{copy.introBody}</p>
              <div className="docs-notice"><CircleAlert size={17} aria-hidden="true" /><span>{copy.introNote}</span></div>
              <div className="docs-base-url">
                <span><Globe2 size={15} aria-hidden="true" /> {copy.baseUrl}</span>
                <code>{BASE_URL}</code>
                <CopyButton value={BASE_URL} label="base-url" lang={lang} ariaTarget={ACTION_LABELS[lang].copyPath} />
              </div>
            </section>

            <section id="authentication" className="docs-section" data-testid="section-authentication">
              <div className="docs-section-heading">
                <div className="docs-section-icon"><KeyRound size={18} aria-hidden="true" /></div>
                <div><p className="docs-kicker">01 · {copy.security}</p><h2>{copy.authTitle}</h2></div>
                <a className="docs-anchor" href="/api-docs#authentication" aria-label={`${ENDPOINT_UI[lang].linkTo} ${copy.authTitle}`}>#</a>
              </div>
              <p className="docs-lede">{copy.authBody}</p>
              <CodeBlock code={`curl ${BASE_URL}/v1/balance \\\n  -H "Authorization: ${authHeader}"`} label="authentication" lang={lang} />
              <p className="docs-footnote"><Server size={14} aria-hidden="true" /> {copy.keyArea}</p>
            </section>

            <section id="quickstart" className="docs-section" data-testid="section-quickstart">
              <div className="docs-section-heading">
                <div className="docs-section-icon docs-section-icon-orange"><Terminal size={18} aria-hidden="true" /></div>
                <div><p className="docs-kicker">02 · {copy.integration}</p><h2>{copy.quickTitle}</h2></div>
                <a className="docs-anchor" href="/api-docs#quickstart" aria-label={`${ENDPOINT_UI[lang].linkTo} ${copy.quickTitle}`}>#</a>
              </div>
              <p className="docs-lede">{copy.quickBody}</p>
              <CodeBlock label="server-side-request" lang={lang} code={`const response = await fetch("${BASE_URL}/v1/buy", {\n  method: "POST",\n  headers: {\n    "Authorization": "Bearer zyn_<secret>",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({ service: "telegram", country: "senegal" })\n});\n\nconst { order } = await response.json();`} />
            </section>

            <div className="docs-divider"><span>{copy.catalog}</span></div>

            <Endpoint
              id="services"
              lang={lang}
              title="List services"
              method="GET"
              path="/v1/services"
              description="Discover the services currently available for number purchases. This route is public."
              auth="Public. No Authorization header is required."
              request="No query parameters or request body."
              response={response(`{\n  "services": [\n    {\n      "id": "<service-id>",\n      "name": "<service-name>",\n      "icon": "<icon>",\n      "category": "<category>"\n    }\n  ]\n}`)}
              errors={["Non-2xx responses indicate that the catalog could not be returned."]}
            />

            <Endpoint
              id="countries"
              lang={lang}
              title="List countries"
              method="GET"
              path="/v1/countries?service=telegram"
              description="Return countries and current availability for a service. The service query is optional and defaults to telegram."
              auth="Public. No Authorization header is required."
              request="Query: service (optional, string). Defaults to telegram."
              response={response(`{\n  "countries": [\n    {\n      "code": "<country-code>",\n      "name": "<country-name>",\n      "flag": "<flag>",\n      "priceUsd": 0.42,\n      "priceFcfa": 260,\n      "available": 0\n    }\n  ]\n}`)}
              errors={["Non-2xx responses indicate that the country catalog could not be returned."]}
            />

            <Endpoint
              id="operators"
              lang={lang}
              title="List operators"
              method="GET"
              path="/v1/operators?service={service}&country={country}"
              description="Return available operators and prices for one service/country combination."
              auth="Bearer API key required."
              request="Query: service (required, string), country (required, string)."
              response={response(`{\n  "operators": [\n    {\n      "name": "<operator-id>",\n      "label": "<operator-label>",\n      "priceUsd": 0.42,\n      "priceFcfa": 260,\n      "available": 0\n    }\n  ]\n}`)}
              errors={["400 — a required service or country query field is missing.", "401 — the Bearer API key is missing or invalid."]}
            />

            <div className="docs-divider"><span>{copy.accountOrders}</span></div>

            <Endpoint
              id="balance"
              lang={lang}
              title="Get balance"
              method="GET"
              path="/v1/balance"
              description="Read the current ZyNum balance for the authenticated account."
              auth="Bearer API key required."
              request="No query parameters or request body."
              response={response(`{\n  "balance": 12.75,\n  "currency": "USD"\n}`)}
              errors={["401 — the Bearer API key is missing or invalid."]}
            />

            <Endpoint
              id="buy"
              lang={lang}
              title="Buy a number"
              method="POST"
              path="/v1/buy"
              description="Spend the account balance on a virtual-number purchase. The returned order id is used by subsequent order endpoints."
              auth="Bearer API key required."
              request="JSON body: service (string, required), country (string, required), currency (USD or FCFA, optional, defaults to USD), operator (string, optional), discountCode (string, optional)."
              response={response(`{\n  "order": {\n    "id": "<orderId>",\n    "status": "PENDING",\n    "createdAt": "2025-01-15T10:30:00.000Z"\n  }\n}`)}
              errors={["400 — validation, purchase, or balance error.", "401 — the Bearer API key is missing or invalid.", "409 — NUMBER_UNAVAILABLE."]}
            >
              <CodeBlock label="request-body" lang={lang} code={`{\n  "service": "telegram",\n  "country": "senegal",\n  "currency": "USD",\n  "operator": "operator-id",\n  "discountCode": "WELCOME"\n}`} />
            </Endpoint>

            <Endpoint
              id="check"
              lang={lang}
              title="Check an order"
              method="GET"
              path="/v1/check/{orderId}"
              description="Read the current state and SMS data for an order owned by the authenticated account."
              auth="Bearer API key required. Only the current account’s orders are visible."
              request="Path: orderId (required, the id returned by ZyNum). No request body."
              response={response(`{\n  "order": {\n    "id": "<orderId>",\n    "status": "RECEIVED",\n    "createdAt": "2025-01-15T10:30:00.000Z",\n    "smsCode": "<sms-code>",\n    "smsText": "<sms-text>"\n  },\n  "autocanceled": false,\n  "refundPending": false\n}`)}
              errors={["401 — the Bearer API key is missing or invalid.", "404 — the order is not available to the current account.", "503 — refund is pending."]}
            />

            <Endpoint
              id="orders"
              lang={lang}
              title="List orders"
              method="GET"
              path="/v1/orders?page=1&limit=20"
              description="Return the authenticated account’s orders, newest first."
              auth="Bearer API key required."
              request="Query: page (optional, number, defaults to 1), limit (optional, number, defaults to 20)."
              response={response(`{\n  "orders": [\n    { "id": "<orderId>", "status": "FINISHED", "createdAt": "2025-01-15T10:30:00.000Z" }\n  ],\n  "total": 1,\n  "page": 1,\n  "limit": 20\n}`)}
              errors={["401 — the Bearer API key is missing or invalid."]}
            />

            <Endpoint
              id="cancel"
              lang={lang}
              title="Cancel an order"
              method="POST"
              path="/v1/cancel/{orderId}"
              description="Request cancellation of an order and the associated balance refund when the order state allows it."
              auth="Bearer API key required."
              request="Path: orderId (required, the id returned by ZyNum). No request body."
              response={response(`{\n  "order": { "id": "<orderId>", "status": "CANCELED" },\n  "refundPending": false\n}`)}
              errors={["400 — the request is invalid for the order state.", "401 — the Bearer API key is missing or invalid.", "404 — the order is not found for the current account.", "409 — the order cannot be canceled in its current state.", "503 — refund is pending."]}
            />

            <Endpoint
              id="finish"
              lang={lang}
              title="Finish an order"
              method="POST"
              path="/v1/finish/{orderId}"
              description="Finish an order after an SMS code has been received. This action is only valid for an order in RECEIVED status."
              auth="Bearer API key required."
              request="Path: orderId (required, the id returned by ZyNum). No request body."
              response={response(`{\n  "order": { "id": "<orderId>", "status": "FINISHED" }\n}`)}
              errors={["401 — the Bearer API key is missing or invalid.", "404 — the order is not found for the current account.", "409 — the order is not RECEIVED or cannot be finished.", "502 — the order could not be finished."]}
            />

            <section id="ai-agents" className="docs-section" data-testid="section-ai-agents">
              <div className="docs-section-heading">
                <div className="docs-section-icon docs-section-icon-orange"><Code2 size={18} aria-hidden="true" /></div>
                <div><p className="docs-kicker">04 · {copy.reference}</p><h2>{copy.aiTitle}</h2></div>
                <a className="docs-anchor" href="/api-docs#ai-agents" aria-label={`${ENDPOINT_UI[lang].linkTo} ${copy.aiTitle}`}>#</a>
              </div>
              <p className="docs-lede">{copy.aiBody}</p>
              <div className="docs-ai-actions">
                <a
                  className="docs-ai-download"
                  href="/agent-skills/zynum-api/SKILL.md"
                  download
                  data-testid="link-download-ai-skill"
                >
                  <FileJson size={15} aria-hidden="true" />
                  {copy.aiDownload}
                  <ExternalLink size={13} aria-hidden="true" />
                </a>
                <div className="docs-ai-url">
                  <span>{copy.aiUrl}</span>
                  <code>/api-docs#ai-agents</code>
                  <CopyButton value="/api-docs#ai-agents" label="ai-agents-section" lang={lang} ariaTarget={ACTION_LABELS[lang].copySection} />
                </div>
              </div>
            </section>

            <section id="errors" className="docs-section" data-testid="section-errors">
              <div className="docs-section-heading">
                <div className="docs-section-icon docs-section-icon-red"><CircleAlert size={18} aria-hidden="true" /></div>
                <div><p className="docs-kicker">05 · {copy.reference}</p><h2>{copy.errorsTitle}</h2></div>
                <a className="docs-anchor" href="/api-docs#errors" aria-label={`${ENDPOINT_UI[lang].linkTo} ${copy.errorsTitle}`}>#</a>
              </div>
              <p className="docs-lede">{copy.errorsBody}</p>
              <div className="docs-status-table" role="table" aria-label={copy.statusTitle}>
                <div className="docs-status-row docs-status-header" role="row"><span>{copy.statusHeader}</span><span>{copy.meaningHeader}</span></div>
                {(Object.entries(copy.statusMeanings) as [string, string][]).map(([status, meaning]) => (
                  <div className="docs-status-row" role="row" key={status}><code>{status}</code><span>{meaning}</span></div>
                ))}
              </div>
              <h3 className="docs-mini-heading">{copy.statusTitle}</h3>
              <p className="docs-footnote">{copy.statusBody}</p>
            </section>

            <footer className="docs-footer">
              <span>{copy.footer}</span>
              <a href="https://zynum.net" target="_blank" rel="noreferrer" data-testid="link-zynum-home">zynum.net <ExternalLink size={13} aria-hidden="true" /></a>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}