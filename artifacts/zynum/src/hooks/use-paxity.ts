import { useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    PaxityWidget?: {
      open: (options: PaxityWidgetOptions) => void;
    };
  }
}

interface PaxityCredentials {
  apikey: string;
  apiToken: string;
  isOpen?: boolean;
  setIsOpen?: (v: boolean) => void;
}

interface PaxityWidgetOptions {
  amount: number;
  currency: string;
  country: string;
  ipn: string;
  idClient: string;
  credentials: PaxityCredentials;
}

const WIDGET_SCRIPT = "https://saas.paxity.io/widget/paxity-widget.iife.js";
const WIDGET_CSS    = "https://paxity.io/widget/style.css";

function getIpnUrl(): string {
  const domain = window.location.hostname;
  const protocol = window.location.protocol;
  return `${protocol}//${domain}/api/v1/webhooks/paxity`;
}

export function usePaxityWidget() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    if (!document.querySelector(`link[href="${WIDGET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = WIDGET_CSS;
      document.head.appendChild(link);
    }

    if (!document.querySelector(`script[src="${WIDGET_SCRIPT}"]`)) {
      const script = document.createElement("script");
      script.src = WIDGET_SCRIPT;
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const openWidget = useCallback((options: {
    amountXof: number;
    country?: string;
    userId: string | number;
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
  }) => {
    const apikey    = import.meta.env.VITE_PAXITY_API_KEY    ?? "";
    const apiToken  = import.meta.env.VITE_PAXITY_API_TOKEN  ?? "";
    const merchantId = import.meta.env.VITE_PAXITY_MERCHANT_ID ?? String(options.userId);

    if (!apikey || !apiToken) {
      console.warn("[PaxityWidget] Missing credentials – set VITE_PAXITY_API_KEY and VITE_PAXITY_API_TOKEN");
      return false;
    }

    if (!window.PaxityWidget) {
      console.warn("[PaxityWidget] Script not yet loaded");
      return false;
    }

    window.PaxityWidget.open({
      amount: Math.round(options.amountXof),
      currency: "XOF",
      country: options.country ?? "SN",
      ipn: getIpnUrl(),
      idClient: String(options.userId),
      credentials: {
        apikey,
        apiToken,
        isOpen: options.isOpen,
        setIsOpen: options.setIsOpen,
      },
    });

    return true;
  }, []);

  return { openWidget };
}
