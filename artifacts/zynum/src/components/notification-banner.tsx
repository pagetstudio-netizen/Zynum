import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";

const API = "/api";
const DISMISS_KEY  = "zynum_dismissed_popups";
const LOGIN_AT_KEY = "zynum_login_at";

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
  blue:   "bg-blue-600",
  red:    "bg-red-600",
  green:  "bg-green-600",
  yellow: "bg-yellow-500",
  purple: "bg-purple-600",
  orange: "bg-orange-500",
};

function getDismissed(): number[] {
  try { return JSON.parse(sessionStorage.getItem(DISMISS_KEY) || "[]"); } catch { return []; }
}
function dismiss(id: number) {
  const dismissed = getDismissed();
  if (!dismissed.includes(id)) dismissed.push(id);
  sessionStorage.setItem(DISMISS_KEY, JSON.stringify(dismissed));
}

export function NotificationBanner() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [dismissed, setDismissed] = useState<number[]>([]);
  const loginAt = sessionStorage.getItem(LOGIN_AT_KEY) ?? "0";

  useEffect(() => {
    setDismissed(getDismissed());
    fetch(`${API}/v1/popup-notifications`)
      .then((r) => r.json())
      .then((d) => { if (d.notifications) setPopups(d.notifications); })
      .catch(() => {});
  }, [loginAt]);

  const visible = popups.filter((p) => !dismissed.includes(p.id));

  const handleDismiss = (id: number) => {
    dismiss(id);
    setDismissed((prev) => [...prev, id]);
  };

  if (visible.length === 0) return null;

  return (
    <AnimatePresence>
      {visible.map((popup) => {
        const bgClass = COLOR_MAP[popup.color ?? "green"] ?? COLOR_MAP.green;
        const text = popup.subject
          ? `${popup.subject} ${popup.content}`
          : popup.content;

        return (
          <motion.div
            key={popup.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden w-full"
          >
            <div className={`${bgClass} w-full flex items-center gap-3 px-4 py-3`}>
              {/* Text */}
              <p className="flex-1 text-sm font-medium text-white leading-snug">
                {text}
              </p>

              {/* CTA button */}
              {popup.linkUrl && (
                <a
                  href={popup.linkUrl}
                  target={popup.linkUrl.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-white border border-white/70 rounded-lg px-3 py-1.5 hover:bg-white/15 transition-colors whitespace-nowrap"
                >
                  {popup.linkLabel || "En savoir plus"}
                  {popup.linkUrl.startsWith("http") && <ExternalLink className="w-3.5 h-3.5" />}
                </a>
              )}

              {/* Dismiss */}
              <button
                onClick={() => handleDismiss(popup.id)}
                className="shrink-0 p-1 rounded-md text-white/70 hover:text-white hover:bg-white/15 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
