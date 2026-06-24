import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Loader2, CheckCircle2, AlertCircle,
  Bitcoin, Clock, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface OxapayModalProps {
  open: boolean;
  onClose: () => void;
  amountUsd: number;
  userId: string | number;
  onSuccess: () => void;
}

type Step = "idle" | "creating" | "pay" | "confirming" | "success" | "error";

function useCountdown(expiredAt: number | null) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!expiredAt) return;
    const tick = () => setRemaining(Math.max(0, expiredAt * 1000 - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiredAt]);
  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return remaining > 0 ? `${m}:${s.toString().padStart(2, "0")}` : "00:00";
}

export function OxapayModal({ open, onClose, amountUsd, userId, onSuccess }: OxapayModalProps) {
  const [step, setStep]         = useState<Step>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [payLink, setPayLink]   = useState("");
  const [trackId, setTrackId]   = useState("");
  const [orderId, setOrderId]   = useState("");
  const [expiredAt, setExpiredAt] = useState<number | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCount = useRef(0);
  const apiBase   = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
  const countdown = useCountdown(expiredAt);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    pollCount.current = 0;
  }, []);

  function reset() {
    stopPolling();
    setStep("idle");
    setErrorMsg("");
    setPayLink("");
    setTrackId("");
    setOrderId("");
    setExpiredAt(null);
    setIframeLoaded(false);
  }

  function handleClose() { reset(); onClose(); }
  useEffect(() => { if (open) reset(); }, [open]);
  useEffect(() => () => stopPolling(), [stopPolling]);

  const pollStatus = useCallback(async (tid: string, oid: string) => {
    pollCount.current += 1;
    if (pollCount.current > 200) { stopPolling(); return; }
    try {
      const token = localStorage.getItem("zynum_token") ?? "";
      const res  = await fetch(`${apiBase}/api/v1/payments/oxapay/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ trackId: tid, orderId: oid, userId: String(userId) }),
      });
      const json = (await res.json()) as Record<string, unknown>;

      if (json.credited) {
        stopPolling();
        setStep("success");
        onSuccess();
        setTimeout(() => { reset(); onClose(); }, 3500);
      } else if (json.status === "confirming") {
        setStep("confirming");
      } else if (json.failed) {
        stopPolling();
        setStep("error");
        setErrorMsg(String(json.message ?? "Transaction expirée ou échouée."));
      }
    } catch { /* réseau */ }
  }, [apiBase, userId, stopPolling, onSuccess, onClose]);

  function startPolling(tid: string, oid: string) {
    stopPolling(); pollCount.current = 0;
    void pollStatus(tid, oid);
    pollRef.current = setInterval(() => pollStatus(tid, oid), 5000);
  }

  async function createInvoice() {
    setStep("creating");
    setErrorMsg("");
    try {
      const token = localStorage.getItem("zynum_token") ?? "";
      const res  = await fetch(`${apiBase}/api/v1/payments/oxapay/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ amountUsd, userId: String(userId) }),
      });
      const json = (await res.json()) as Record<string, unknown>;

      if (!res.ok || !json.success) {
        setStep("error");
        setErrorMsg(String(json.error ?? "Impossible de créer la facture crypto."));
        return;
      }

      setTrackId(String(json.trackId ?? ""));
      setOrderId(String(json.orderId ?? ""));
      setPayLink(String(json.payLink  ?? ""));
      setExpiredAt(json.expiredAt ? Number(json.expiredAt) : null);
      setStep("pay");

      const tid = String(json.trackId ?? "");
      const oid = String(json.orderId ?? "");
      if (tid) startPolling(tid, oid);
    } catch {
      setStep("error");
      setErrorMsg("Erreur de connexion. Veuillez réessayer.");
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "92vh" }}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow">
                  <Bitcoin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Paiement Crypto</h2>
                  <p className="text-[11px] text-gray-400">OxaPay · Sécurisé</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-5 py-5 space-y-4">

                {/* ── Montant ── */}
                <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200/70 px-4 py-3">
                  <div>
                    <p className="text-[11px] text-gray-400">Montant à payer</p>
                    <p className="text-2xl font-extrabold text-gray-900">${amountUsd.toFixed(2)}</p>
                    <p className="text-[11px] text-gray-400">≈ {Math.round(amountUsd * 620).toLocaleString("fr-FR")} FCFA</p>
                  </div>
                  {expiredAt && (step === "pay" || step === "confirming") && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                      <Clock className="w-3.5 h-3.5" /> {countdown}
                    </div>
                  )}
                </div>

                {/* ── IDLE : bouton démarrer ── */}
                {step === "idle" && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700 space-y-1.5">
                      <p className="font-semibold">Comment ça marche ?</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-600 text-xs">
                        <li>Cliquez sur "Payer en crypto"</li>
                        <li>Choisissez votre cryptomonnaie (USDT, BTC, ETH…)</li>
                        <li>Scannez le QR code ou copiez l'adresse</li>
                        <li>Votre solde est crédité automatiquement</li>
                      </ol>
                    </div>
                    <Button
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold shadow-lg"
                      onClick={createInvoice}
                    >
                      <Bitcoin className="w-4 h-4 mr-2" />
                      Payer en crypto — ${amountUsd.toFixed(2)}
                    </Button>
                  </div>
                )}

                {/* ── CREATING : spinner ── */}
                {step === "creating" && (
                  <div className="flex flex-col items-center py-10 gap-3">
                    <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
                    <p className="text-gray-600 font-medium text-sm">Génération de la facture…</p>
                    <p className="text-xs text-gray-400">Connexion à OxaPay en cours</p>
                  </div>
                )}

                {/* ── PAY / CONFIRMING : iframe OxaPay ── */}
                {(step === "pay" || step === "confirming") && payLink && (
                  <div className="space-y-3">
                    {/* Statut */}
                    <div className={`rounded-xl border px-4 py-3 flex items-center gap-2 ${
                      step === "confirming"
                        ? "bg-blue-50 border-blue-200"
                        : "bg-amber-50 border-amber-200"
                    }`}>
                      <Loader2 className={`w-4 h-4 animate-spin shrink-0 ${step === "confirming" ? "text-blue-500" : "text-amber-500"}`} />
                      <p className={`text-xs font-semibold ${step === "confirming" ? "text-blue-700" : "text-amber-700"}`}>
                        {step === "confirming"
                          ? "Transaction détectée — confirmation blockchain en cours…"
                          : "Choisissez votre crypto et effectuez le paiement ci-dessous"}
                      </p>
                    </div>

                    {/* iframe OxaPay */}
                    <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50" style={{ height: 520 }}>
                      {!iframeLoaded && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-gray-50">
                          <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                          <p className="text-xs text-gray-400">Chargement de la page de paiement…</p>
                        </div>
                      )}
                      <iframe
                        src={payLink}
                        title="OxaPay – Paiement Crypto"
                        className="w-full h-full border-0"
                        onLoad={() => setIframeLoaded(true)}
                        allow="clipboard-write"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      />
                    </div>

                    <button
                      onClick={() => { stopPolling(); if (trackId) startPolling(trackId, orderId); }}
                      className="flex items-center justify-center gap-1.5 mx-auto text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Vérifier le statut manuellement
                    </button>
                  </div>
                )}

                {/* ── SUCCESS ── */}
                {step === "success" && (
                  <div className="flex flex-col items-center py-10 gap-3">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-9 h-9 text-green-500" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">Paiement confirmé !</p>
                    <p className="text-sm text-gray-500 text-center">
                      Votre solde a été crédité de{" "}
                      <span className="font-semibold text-gray-900">${amountUsd.toFixed(2)}</span>.
                    </p>
                  </div>
                )}

                {/* ── ERROR ── */}
                {step === "error" && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-700">Erreur</p>
                        <p className="text-xs text-red-500 mt-0.5">{errorMsg}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full h-11 rounded-xl" onClick={reset}>
                      Réessayer
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
