import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    PaxityWidget?: {
      open: (options: PaxityWidgetOptions) => void;
    };
  }
}

interface PaxityWidgetOptions {
  amount: number;
  currency: string;
  country: string;
  ipn: string;
  idClient: string;
  credentials: {
    apikey: string;
    apiToken: string;
    isOpen?: boolean;
    setIsOpen?: (v: boolean) => void;
  };
}

const WIDGET_SCRIPT = "https://saas.paxity.io/widget/paxity-widget.iife.js";
const WIDGET_CSS    = "https://paxity.io/widget/style.css";

function getIpnUrl(): string {
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}/api/v1/webhooks/paxity`;
}

export function usePaxityWidget() {
  const [ready, setReady] = useState(false);
  const pendingCall = useRef<PaxityWidgetOptions | null>(null);

  useEffect(() => {
    if (!document.querySelector(`link[href="${WIDGET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = WIDGET_CSS;
      document.head.appendChild(link);
    }

    const existing = document.querySelector(`script[src="${WIDGET_SCRIPT}"]`);
    if (existing) {
      if (window.PaxityWidget) {
        setReady(true);
        if (pendingCall.current) {
          window.PaxityWidget.open(pendingCall.current);
          pendingCall.current = null;
        }
      }
      return;
    }

    const script = document.createElement("script");
    script.src = WIDGET_SCRIPT;
    script.async = true;

    script.onload = () => {
      setReady(true);
      if (pendingCall.current && window.PaxityWidget) {
        window.PaxityWidget.open(pendingCall.current);
        pendingCall.current = null;
      }
    };

    script.onerror = () => {
      console.error("[PaxityWidget] Failed to load script");
    };

    document.head.appendChild(script);
  }, []);

  const openWidget = useCallback((options: {
    amountXof: number;
    country?: string;
    userId: string | number;
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
  }) => {
    const apikey    = import.meta.env.VITE_PAXITY_API_KEY   ?? "";
    const apiToken  = import.meta.env.VITE_PAXITY_API_TOKEN ?? "";

    const widgetOptions: PaxityWidgetOptions = {
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
    };

    if (window.PaxityWidget) {
      window.PaxityWidget.open(widgetOptions);
      return "opened";
    }

    pendingCall.current = widgetOptions;
    return "queued";
  }, []);

  return { openWidget, ready };
}
