import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Loader2, CheckCircle2, AlertCircle,
  ExternalLink, Copy, RefreshCw, Bitcoin,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface OxapayModalProps {
  open: boolean;
  onClose: () => void;
  amountUsd: number;
  userId: string | number;
  onSuccess: () => void;
}

type PayState = "idle" | "creating" | "waiting" | "confirming" | "success" | "error";

const CRYPTO_COINS = [
  { symbol: "USDT", name: "Tether",      color: "#26A17B", icon: "₮" },
  { symbol: "BTC",  name: "Bitcoin",     color: "#F7931A", icon: "₿" },
  { symbol: "ETH",  name: "Ethereum",    color: "#627EEA", icon: "Ξ" },
  { symbol: "BNB",  name: "BNB",         color: "#F0B90B", icon: "Ƀ" },
  { symbol: "TRX",  name: "Tron",        color: "#EF0027", icon: "T" },
  { symbol: "LTC",  name: "Litecoin",    color: "#BFBBBB", icon: "Ł" },
];

export function OxapayModal({ open, onClose, amountUsd, userId, onSuccess }: OxapayModalProps) {
  const [state, setState]       = useState<PayState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [payLink, setPayLink]   = useState("");
  const [trackId, setTrackId]   = useState("");
  const [orderId, setOrderId]   = useState("");
  const [copied, setCopied]     = useState(false);

  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCount = useRef(0);
  const apiBase   = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    pollCount.current = 0;
  }, []);

  function reset() {
    stopPolling();
    setState("idle");
    setErrorMsg("");
    setPayLink("");
    setTrackId("");
    setOrderId("");
    setCopied(false);
  }

  function handleClose() { reset(); onClose(); }

  useEffect(() => { if (open) reset(); }, [open]);
  useEffect(() => () => stopPolling(), [stopPolling]);

  const pollStatus = useCallback(async (tid: string, oid: string) => {
    pollCount.current += 1;
    if (pollCount.current > 180) { stopPolling(); return; }

    try {
      const res = await fetch(`${apiBase}/api/v1/payments/oxapay/status`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ trackId: tid, orderId: oid, userId: String(userId) }),
      });
      const json = (await res.json()) as Record<string, unknown>;

      if (json.credited) {
        stopPolling();
        setState("success");
        onSuccess();
        setTimeout(() => { reset(); onClose(); }, 3000);
      } else if (json.status === "confirming") {
        setState("confirming");
      } else if (json.failed) {
        stopPolling();
        setState("error");
        setErrorMsg(String(json.message ?? "Transaction expirée ou échouée."));
      }
    } catch { /* réseau — on réessaie */ }
  }, [apiBase, userId, stopPolling, onSuccess, onClose]);

  function startPolling(tid: string, oid: string) {
    stopPolling();
    pollCount.current = 0;
    pollRef.current = setInterval(() => pollStatus(tid, oid), 5000);
  }

  async function createInvoice() {
    setState("creating");
    setErrorMsg("");

    try {
      const res = await fetch(`${apiBase}/api/v1/payments/oxapay/create`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ amountUsd, userId: String(userId) }),
      });
      const json = (await res.json()) as Record<string, unknown>;

      if (!res.ok || !json.success) {
        setState("error");
        setErrorMsg(String(json.error ?? "Impossible de créer la facture crypto."));
        return;
      }

      const tid = String(json.trackId ?? "");
      const oid = String(json.orderId ?? "");
      const link = String(json.payLink ?? "");

      setTrackId(tid);
      setOrderId(oid);
      setPayLink(link);
      setState("waiting");
      if (tid) startPolling(tid, oid);
    } catch {
      setState("error");
      setErrorMsg("Erreur de connexion. Veuillez réessayer.");
    }
  }

  function copyLink() {
    if (!payLink) return;
    navigator.clipboard.writeText(payLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
                  <Bitcoin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Paiement Crypto</h2>
                  <p className="text-xs text-gray-400">Via OxaPay · Sécurisé</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-5 space-y-5">

              {/* Montant */}
              <div className="rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200/60 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Montant à payer</p>
                  <p className="text-2xl font-extrabold text-gray-900">${amountUsd.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">≈ {Math.round(amountUsd * 620).toLocaleString("fr-FR")} FCFA</p>
                </div>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {CRYPTO_COINS.slice(0, 4).map(c => (
                    <div
                      key={c.symbol}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                      style={{ background: c.color }}
                      title={c.name}
                    >
                      {c.icon}
                    </div>
                  ))}
                </div>
              </div>

              {/* État : idle */}
              {state === "idle" && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700 space-y-1.5">
                    <p className="font-semibold">Comment ça marche ?</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-600">
                      <li>Cliquez sur "Payer en crypto"</li>
                      <li>Choisissez votre cryptomonnaie (USDT, BTC, ETH…)</li>
                      <li>Scannez le QR code ou copiez l'adresse</li>
                      <li>Votre solde est crédité automatiquement</li>
                    </ol>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {CRYPTO_COINS.map(c => (
                      <div
                        key={c.symbol}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-100 bg-gray-50"
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                          style={{ background: c.color }}
                        >
                          {c.icon}
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{c.symbol}</span>
                      </div>
                    ))}
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

              {/* État : création en cours */}
              {state === "creating" && (
                <div className="flex flex-col items-center py-8 gap-4">
                  <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
                  <p className="text-gray-600 font-medium">Création de la facture…</p>
                  <p className="text-xs text-gray-400">Connexion à OxaPay en cours</p>
                </div>
              )}

              {/* État : attente paiement */}
              {(state === "waiting" || state === "confirming") && payLink && (
                <div className="space-y-4">
                  <div className={`rounded-xl border p-4 text-center ${
                    state === "confirming"
                      ? "bg-blue-50 border-blue-200"
                      : "bg-amber-50 border-amber-200"
                  }`}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Loader2 className={`w-4 h-4 animate-spin ${state === "confirming" ? "text-blue-500" : "text-amber-500"}`} />
                      <p className={`text-sm font-semibold ${state === "confirming" ? "text-blue-700" : "text-amber-700"}`}>
                        {state === "confirming" ? "Confirmation en cours…" : "En attente de paiement…"}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {state === "confirming"
                        ? "Transaction détectée, confirmation blockchain en cours."
                        : "Effectuez votre paiement sur la page OxaPay."}
                    </p>
                  </div>

                  <a
                    href={payLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold shadow-lg hover:from-yellow-600 hover:to-orange-600 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ouvrir la page de paiement
                  </a>

                  <button
                    onClick={copyLink}
                    className="flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Lien copié !" : "Copier le lien de paiement"}
                  </button>

                  <p className="text-center text-xs text-gray-400">
                    La page se rafraîchit automatiquement · Validité : 60 min
                  </p>

                  <button
                    onClick={() => { stopPolling(); if (trackId) startPolling(trackId, orderId); }}
                    className="flex items-center justify-center gap-1.5 mx-auto text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Vérifier manuellement
                  </button>
                </div>
              )}

              {/* État : succès */}
              {state === "success" && (
                <div className="flex flex-col items-center py-8 gap-3">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-9 h-9 text-green-500" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">Paiement reçu !</p>
                  <p className="text-sm text-gray-500 text-center">
                    Votre solde a été crédité de <span className="font-semibold text-gray-900">${amountUsd.toFixed(2)}</span>.
                  </p>
                </div>
              )}

              {/* État : erreur */}
              {state === "error" && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">Erreur</p>
                      <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl"
                    onClick={() => { setState("idle"); setErrorMsg(""); }}
                  >
                    Réessayer
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
