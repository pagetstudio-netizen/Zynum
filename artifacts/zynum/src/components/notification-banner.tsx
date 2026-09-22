import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ExternalLink, X } from "lucide-react";

const API = "/api";
const DISMISS_KEY = "zynum_dismissed_popups";
const POLL_INTERVAL_MS = 30_000;

type Popup = {
  id: number;
  subject: string | null;
  content: string;
  color: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  imageUrl: string | null;
};

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-600",
  red: "bg-red-600",
  green: "bg-green-600",
  yellow: "bg-yellow-500",
  purple: "bg-purple-600",
  orange: "bg-orange-500",
};

function getDismissed(): number[] {
  try {
    const value = JSON.parse(sessionStorage.getItem(DISMISS_KEY) || "[]");
    return Array.isArray(value) ? value.filter((id): id is number => typeof id === "number") : [];
  } catch {
    return [];
  }
}

function saveDismissed(id: number) {
  const dismissed = getDismissed();
  if (!dismissed.includes(id)) {
    sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...dismissed, id]));
  }
}

export function NotificationBanner() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setDismissed(getDismissed());

    let cancelled = false;
    const loadPopups = async () => {
      try {
        const response = await fetch(`${API}/v1/popup-notifications`);
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled && Array.isArray(data.notifications)) {
          setPopups(data.notifications);
        }
      } catch {
        // A notification must never prevent the rest of the app from loading.
      }
    };

    loadPopups();
    const interval = window.setInterval(loadPopups, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const visible = popups.filter((popup) => !dismissed.includes(popup.id));
  const popup = visible[currentIndex];

  useEffect(() => {
    if (currentIndex >= visible.length && visible.length > 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, visible.length]);

  const handleDismiss = () => {
    if (!popup) return;
    saveDismissed(popup.id);
    setDismissed((previous) => [...previous, popup.id]);
    setCurrentIndex((previous) => (previous + 1 >= visible.length ? 0 : previous + 1));
  };

  useEffect(() => {
    if (!popup) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleDismiss();
    };
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [popup?.id]);

  return (
    <AnimatePresence>
      {popup && (
        <motion.div
          key={popup.id}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleDismiss}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`popup-title-${popup.id}`}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-950/30"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`${COLOR_MAP[popup.color ?? "blue"] ?? COLOR_MAP.blue} relative px-6 pb-7 pt-6 text-white`}>
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Fermer la notification"
                className="absolute right-4 top-4 rounded-full p-2 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/25">
                <Bell className="h-6 w-6" />
              </div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-white/75">
                Notification ZyNum
              </p>
              <h2 id={`popup-title-${popup.id}`} className="pr-8 text-2xl font-bold leading-tight text-white">
                {popup.subject || "Information importante"}
              </h2>
            </div>

            {popup.imageUrl && (
              <img
                src={popup.imageUrl}
                alt=""
                className="max-h-52 w-full object-cover"
              />
            )}

            <div className="space-y-6 p-6">
              <p className="whitespace-pre-line text-[15px] leading-7 text-slate-600">
                {popup.content}
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                {popup.linkUrl && (
                  <a
                    href={popup.linkUrl}
                    target={popup.linkUrl.startsWith("http") ? "_blank" : undefined}
                    rel={popup.linkUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white no-underline shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02]"
                  >
                    {popup.linkLabel || "En savoir plus"}
                    {popup.linkUrl.startsWith("http") && <ExternalLink className="h-4 w-4" />}
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                  Compris
                </button>
              </div>

              {visible.length > 1 && (
                <p className="text-center text-xs text-slate-400">
                  Notification {currentIndex + 1} sur {visible.length}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}