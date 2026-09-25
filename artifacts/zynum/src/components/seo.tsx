import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { DEVELOPER_DOCS_URL } from "@/lib/urls";

type SeoPage = {
  title: string;
  description: string;
  type?: "website" | "article";
};

const seoPages: Record<"fr" | "en", Record<string, SeoPage>> = {
  fr: {
    "/": {
      title: "Numéros virtuels SMS & OTP en Afrique | ZyNum",
      description:
        "Achetez un numéro virtuel temporaire pour recevoir vos codes SMS et OTP. ZyNum propose des numéros dans 180+ pays pour WhatsApp, Telegram, Google et plus de 200 services.",
    },
    "/buy": {
      title: "Acheter un numéro virtuel pour recevoir un SMS | ZyNum",
      description:
        "Choisissez un service, un pays et un numéro virtuel temporaire. Recevez votre code de vérification SMS rapidement avec ZyNum.",
    },
    "/aide": {
      title: "Centre d'aide : numéros virtuels et codes SMS | ZyNum",
      description:
        "Trouvez les réponses à vos questions sur l'achat d'un numéro virtuel, la réception des SMS, les commandes et les remboursements ZyNum.",
    },
    "/about": {
      title: "À propos de ZyNum : plateforme de numéros virtuels",
      description:
        "Découvrez ZyNum, une plateforme de numéros virtuels temporaires pour recevoir des codes SMS et OTP dans plus de 180 pays.",
    },
    "/faq": {
      title: "FAQ numéros virtuels, SMS et remboursements | ZyNum",
      description:
        "Consultez les réponses aux questions fréquentes sur les numéros virtuels, les codes OTP, les commandes, les délais et les remboursements ZyNum.",
    },
    "/terms": {
      title: "Conditions d'utilisation et remboursements | ZyNum",
      description:
        "Consultez les conditions d'utilisation de ZyNum, les règles d'achat, d'annulation et de remboursement des numéros virtuels temporaires.",
      type: "article",
    },
    "/privacy": {
      title: "Politique de confidentialité et données | ZyNum",
      description:
        "Découvrez comment ZyNum collecte, utilise, protège et conserve les données nécessaires au fonctionnement de la plateforme.",
      type: "article",
    },
    "/contact": {
      title: "Contacter ZyNum : support numéros virtuels",
      description:
        "Contactez l'équipe ZyNum pour une question sur une commande, un code SMS, un remboursement ou votre compte.",
    },
    "/api-docs": {
      title: "API de numéros virtuels et codes SMS | ZyNum",
      description:
        "Consultez la documentation de l'API ZyNum pour intégrer l'achat de numéros virtuels et la réception de codes SMS dans vos applications.",
    },
  },
  en: {
    "/": {
      title: "Virtual Phone Numbers for SMS & OTP | ZyNum",
      description:
        "Buy a temporary virtual number to receive SMS and OTP verification codes. ZyNum supports 180+ countries, WhatsApp, Telegram, Google, and 200+ services.",
    },
    "/buy": {
      title: "Buy a Virtual Number to Receive SMS | ZyNum",
      description:
        "Choose a service, country, and temporary virtual number. Receive your SMS verification code quickly with ZyNum.",
    },
    "/aide": {
      title: "Help Center: Virtual Numbers and SMS Codes | ZyNum",
      description:
        "Find answers about buying virtual numbers, receiving SMS messages, orders, and ZyNum refunds.",
    },
    "/about": {
      title: "About ZyNum: Virtual Number Platform",
      description:
        "Learn about ZyNum, a platform for temporary virtual numbers and SMS or OTP verification codes in 180+ countries.",
    },
    "/faq": {
      title: "FAQ: Virtual Numbers, SMS, and Refunds | ZyNum",
      description:
        "Read answers to common questions about virtual numbers, OTP codes, orders, delivery times, and ZyNum refunds.",
    },
    "/terms": {
      title: "Terms of Service and Refund Rules | ZyNum",
      description:
        "Read ZyNum's terms of service and the rules for purchasing, canceling, and refunding temporary virtual numbers.",
      type: "article",
    },
    "/privacy": {
      title: "Privacy Policy and Data Protection | ZyNum",
      description:
        "Learn how ZyNum collects, uses, protects, and retains the data required to operate the platform.",
      type: "article",
    },
    "/contact": {
      title: "Contact ZyNum: Virtual Number Support",
      description:
        "Contact ZyNum about an order, SMS code, refund, or account question.",
    },
    "/api-docs": {
      title: "Virtual Number and SMS Code API | ZyNum",
      description:
        "Read the ZyNum API documentation to integrate virtual number purchases and SMS code delivery into your applications.",
    },
  },
};

const noIndexPaths = new Set([
  "/dashboard",
  "/login",
  "/register",
  "/reset-password",
  "/country-unavailable",
  "/history",
  "/admin",
]);

function upsertMeta(selector: string, attributes: Record<string, string>, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    Object.entries(attributes).forEach(([key, value]) => element!.setAttribute(key, value));
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

export function RouteSeo({ path }: { path: string }) {
  const { lang } = useLanguage();

  useEffect(() => {
    const normalizedPath = path.split("?")[0].split("#")[0] || "/";
    const page = seoPages[lang][normalizedPath] ?? seoPages.fr["/"];
    const siteUrl = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, "");
    const canonicalUrl = normalizedPath === "/api-docs"
      ? DEVELOPER_DOCS_URL
      : `${siteUrl}${normalizedPath === "/" ? "" : normalizedPath}`;
    const robots = noIndexPaths.has(normalizedPath) ? "noindex, nofollow" : "index, follow";
    const imageUrl = `${siteUrl}/opengraph.jpg`;

    document.documentElement.lang = lang;
    document.title = page.title;
    upsertMeta('meta[name="description"]', { name: "description" }, page.description);
    upsertMeta('meta[name="robots"]', { name: "robots" }, robots);
    upsertMeta('meta[property="og:type"]', { property: "og:type" }, page.type ?? "website");
    upsertMeta('meta[property="og:url"]', { property: "og:url" }, canonicalUrl);
    upsertMeta('meta[property="og:title"]', { property: "og:title" }, page.title);
    upsertMeta('meta[property="og:description"]', { property: "og:description" }, page.description);
    upsertMeta('meta[property="og:image"]', { property: "og:image" }, imageUrl);
    upsertMeta('meta[property="og:locale"]', { property: "og:locale" }, lang === "fr" ? "fr_FR" : "en_US");
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title" }, page.title);
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description" }, page.description);
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image" }, imageUrl);
    upsertMeta('meta[name="twitter:image:alt"]', { name: "twitter:image:alt" }, page.title);
    upsertLink("canonical", canonicalUrl);

    let structuredData = document.head.querySelector<HTMLScriptElement>("#zynum-page-structured-data");
    if (!structuredData) {
      structuredData = document.createElement("script");
      structuredData.id = "zynum-page-structured-data";
      structuredData.type = "application/ld+json";
      document.head.appendChild(structuredData);
    }

    const graph = normalizedPath === "/"
      ? [
          {
            "@type": "Organization",
            "@id": `${siteUrl}/#organization`,
            name: "ZyNum",
            url: siteUrl,
            logo: `${siteUrl}/logo.jpg`,
          },
          {
            "@type": "WebSite",
            "@id": `${siteUrl}/#website`,
            name: "ZyNum",
            url: siteUrl,
            publisher: { "@id": `${siteUrl}/#organization` },
            inLanguage: lang,
          },
          {
            "@type": "WebApplication",
            name: "ZyNum",
            url: siteUrl,
            description: page.description,
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Web",
            inLanguage: lang,
          },
        ]
      : [
          {
            "@type": page.type === "article" ? "Article" : "WebPage",
            name: page.title,
            description: page.description,
            url: canonicalUrl,
            isPartOf: { "@id": `${siteUrl}/#website` },
            inLanguage: lang,
          },
        ];

    structuredData.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": graph,
    });
  }, [lang, path]);

  return null;
}