import { useState, useEffect, useRef, useCallback } from "react";
import {
  Wallet, ArrowRight, Check, Lock, ShieldCheck,
  Bitcoin, ChevronLeft, Loader2, CheckCircle2, AlertCircle,
  Copy, RefreshCw, Clock, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage } from "@/hooks/use-language";
import { useGetBalance, useGetCurrentUser, getGetBalanceQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { OmnipayModal } from "@/components/omnipay-modal";
import iconMobile from "@assets/icons8-argent-mobile-53_1774828244252.png";
import iconCrypto from "@assets/cryptocurrency-3d-illustration-png_1774828244226.png";
import iconCard   from "@assets/9242877_1774828244157.png";

const AMOUNTS_USD  = [5, 10, 20, 50, 100, 200];
const FCFA_PER_USD = 620;

/* ─────────────────────────────────────────────────────────────────────────
   Countdown hook
───────────────────────────────────────────────────────────────────────── */
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
  return { label: remaining > 0 ? `${m}:${s.toString().padStart(2, "0")}` : "00:00", expired: remaining === 0 };
}

/* ─────────────────────────────────────────────────────────────────────────
   Copy field
───────────────────────────────────────────────────────────────────────── */
function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
        <span className="flex-1 text-sm font-mono text-gray-800 break-all leading-relaxed">{value}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Page crypto complète (inline dans le tab, pas de modal)
───────────────────────────────────────────────────────────────────────── */
type CryptoStep = "creating" | "pay" | "confirming" | "success" | "error";

interface CryptoPageProps {
  amountUsd: number;
  userId: string | number;
  onBack: () => void;
  onSuccess: () => void;
}

function CryptoPage({ amountUsd, userId, onBack, onSuccess }: CryptoPageProps) {
  const [step, setStep]           = useState<CryptoStep>("creating");
  const [errorMsg, setErrorMsg]   = useState("");
  const [payLink, setPayLink]     = useState("");
  const [trackId, setTrackId]     = useState("");
  const [orderId, setOrderId]     = useState("");
  const [expiredAt, setExpiredAt] = useState<number | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCount = useRef(0);
  const { label: countdown, expired } = useCountdown(expiredAt);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    pollCount.current = 0;
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const pollStatus = useCallback(async (tid: string, oid: string) => {
    pollCount.current += 1;
    if (pollCount.current > 200) { stopPolling(); return; }
    try {
      const token = localStorage.getItem("zynum_token") ?? "";
      const res  = await fetch("/api/v1/payments/oxapay/status", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ trackId: tid, orderId: oid, userId: String(userId) }),
      });
      const json = (await res.json()) as Record<string, unknown>;
      if (json.credited) {
        stopPolling(); setStep("success"); onSuccess();
      } else if (json.status === "confirming") {
        setStep("confirming");
      } else if (json.failed) {
        stopPolling(); setStep("error");
        setErrorMsg(String(json.message ?? "Transaction expirée ou échouée."));
      }
    } catch { /* réseau */ }
  }, [userId, stopPolling, onSuccess]);

  function startPolling(tid: string, oid: string) {
    stopPolling(); pollCount.current = 0;
    void pollStatus(tid, oid);
    pollRef.current = setInterval(() => pollStatus(tid, oid), 5000);
  }

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("zynum_token") ?? "";
        const res  = await fetch("/api/v1/payments/oxapay/create", {
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
    })();
  }, []);

  const qrUrl = payLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payLink)}`
    : "";

  return (
    <div className="space-y-0">
      {/* ── Header navigation ── */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => { stopPolling(); onBack(); }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
        >
          <div className="w-8 h-8 rounded-xl border border-gray-200 bg-white flex items-center justify-center group-hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </div>
          Retour
        </button>
        <div className="h-px flex-1 bg-gray-100" />
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <Bitcoin className="w-4 h-4 text-white" />
          </div>
          Paiement Crypto
        </div>
      </div>

      {/* ── CRÉATION EN COURS ── */}
      {step === "creating" && (
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-8 py-16 flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">Génération de la facture…</p>
              <p className="text-sm text-gray-400 mt-1">Connexion à OxaPay en cours</p>
            </div>
          </div>
        </div>
      )}

      {/* ── PAGE DE PAIEMENT ── */}
      {(step === "pay" || step === "confirming") && payLink && (
        <div className="space-y-5">
          {/* Bloc montant + statut */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200/70 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Montant à payer</p>
              <p className="text-3xl font-extrabold text-gray-900">${amountUsd.toFixed(2)}</p>
              <p className="text-sm text-gray-400 mt-0.5">≈ {Math.round(amountUsd * FCFA_PER_USD).toLocaleString("fr-FR")} FCFA</p>
            </div>

            <div className={`rounded-2xl border p-5 flex flex-col justify-between ${
              step === "confirming"
                ? "bg-blue-50 border-blue-200"
                : "bg-amber-50 border-amber-200"
            }`}>
              <div className="flex items-center gap-2">
                <Loader2 className={`w-4 h-4 animate-spin shrink-0 ${step === "confirming" ? "text-blue-500" : "text-amber-500"}`} />
                <p className={`text-sm font-semibold ${step === "confirming" ? "text-blue-700" : "text-amber-700"}`}>
                  {step === "confirming" ? "Confirmation blockchain…" : "En attente de paiement"}
                </p>
              </div>
              <p className={`text-xs mt-2 ${step === "confirming" ? "text-blue-500" : "text-amber-500"}`}>
                {step === "confirming"
                  ? "Transaction détectée, confirmation en cours."
                  : "Choisissez votre crypto sur la page OxaPay."}
              </p>
              {expiredAt && (
                <div className="flex items-center gap-1.5 mt-3">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className={`text-xs font-mono font-bold ${expired ? "text-red-500" : "text-gray-600"}`}>
                    {expired ? "Expiré" : `Expire dans ${countdown}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-800 mb-3">Comment payer ?</p>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-yellow-100 text-yellow-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                Cliquez sur <strong>"Ouvrir OxaPay"</strong> ci-dessous
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-yellow-100 text-yellow-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                Choisissez votre cryptomonnaie (USDT, BTC, ETH, BNB, TRX, LTC…)
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-yellow-100 text-yellow-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                Scannez le QR code ou copiez l'adresse et envoyez le montant exact
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">✓</span>
                Votre solde est crédité automatiquement après confirmation
              </li>
            </ol>
          </div>

          {/* Boutons d'action */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={payLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-13 px-5 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold text-sm shadow-lg shadow-yellow-500/20 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Ouvrir OxaPay
            </a>
            <button
              onClick={() => { stopPolling(); if (trackId) startPolling(trackId, orderId); }}
              className="flex items-center justify-center gap-2 h-13 px-5 py-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Vérifier le statut
            </button>
          </div>

          {/* QR code + lien */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-800 mb-4">Ou scannez ce QR code</p>
            <div className="flex gap-5 items-start flex-wrap">
              <div className="w-[140px] h-[140px] shrink-0 bg-white border-2 border-gray-100 rounded-2xl overflow-hidden flex items-center justify-center shadow-sm">
                <img src={qrUrl} alt="QR" className="w-full h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <CopyField value={payLink} label="Lien de paiement OxaPay" />
                <p className="text-xs text-gray-400 leading-relaxed">
                  Scannez le QR code avec votre wallet crypto pour ouvrir directement la page de paiement.
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 pb-2">
            La vérification est automatique · Durée de validité : 60 minutes
          </p>
        </div>
      )}

      {/* ── SUCCÈS ── */}
      {step === "success" && (
        <div className="rounded-3xl border border-green-200 bg-green-50 overflow-hidden">
          <div className="px-8 py-16 flex flex-col items-center gap-5 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-11 h-11 text-green-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">Paiement confirmé !</p>
              <p className="text-sm text-gray-500 mt-2">
                Votre solde a été crédité de <span className="font-semibold text-gray-900">${amountUsd.toFixed(2)}</span>.
              </p>
            </div>
            <button
              onClick={onBack}
              className="mt-2 px-6 py-3 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-colors"
            >
              Retour à la recharge
            </button>
          </div>
        </div>
      )}

      {/* ── ERREUR ── */}
      {step === "error" && (
        <div className="rounded-3xl border border-red-200 bg-white overflow-hidden shadow-sm">
          <div className="px-8 py-12 flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-9 h-9 text-red-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">Erreur de paiement</p>
              <p className="text-sm text-red-500 mt-1">{errorMsg}</p>
            </div>
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Page principale recharge
───────────────────────────────────────────────────────────────────────── */
export default function Recharge() {
  const { t }        = useLanguage();
  const { currency } = useCurrency();
  const { toast }    = useToast();
  const queryClient  = useQueryClient();
  const { data: user }       = useGetCurrentUser({ query: { retry: false } });
  const { data: balanceData, refetch: refetchBalance } =
    useGetBalance({ query: { enabled: !!user, retry: false } });

  const [selectedAmount,  setSelectedAmount]  = useState<number | null>(20);
  const [customAmount,    setCustomAmount]    = useState("");
  const [selectedMethod,  setSelectedMethod]  = useState<string | null>("mobile");
  const [omnipayOpen,     setOmnipayOpen]     = useState(false);
  const [showCryptoPage,  setShowCryptoPage]  = useState(false);
  const [cryptoEnabled,   setCryptoEnabled]   = useState(true);

  useEffect(() => {
    fetch("/api/v1/settings")
      .then((r) => r.json())
      .then((d) => { if (d?.settings?.crypto_recharge_enabled === "false") setCryptoEnabled(false); })
      .catch(() => {});
  }, []);

  // ── Méthodes : Mobile → Crypto → Carte ──
  const METHODS: {
    id: string; label: string; sub: string; icon: React.ReactNode;
    available: boolean; soon?: boolean;
  }[] = [
    {
      id:        "mobile",
      icon:      <img src={iconMobile} alt="Mobile Money" className="w-8 h-8 object-contain" />,
      label:     "Mobile Money",
      sub:       "Wave, Orange Money, MTN, Moov… · 10 pays",
      available: true,
    },
    {
      id:        "crypto",
      icon:      <img src={iconCrypto} alt="Cryptomonnaie" className="w-9 h-9 object-contain" />,
      label:     "Cryptomonnaie",
      sub:       cryptoEnabled ? "USDT, BTC, ETH, BNB, TRX, LTC…" : "Temporairement indisponible",
      available: cryptoEnabled,
      soon:      !cryptoEnabled,
    },
    {
      id:        "card",
      icon:      <img src={iconCard} alt="Carte bancaire" className="w-9 h-9 object-contain" />,
      label:     "Carte bancaire",
      sub:       "Visa, Mastercard — paiement sécurisé",
      available: false,
      soon:      true,
    },
  ];

  const balance        = balanceData?.balance ?? 0;
  const formatBalance  = (v: number) =>
    currency === "FCFA"
      ? `${Math.round(v * FCFA_PER_USD).toLocaleString("fr-FR")} FCFA`
      : `$${v.toFixed(2)}`;

  const finalAmountUsd     = customAmount ? parseFloat(customAmount) : selectedAmount;
  const finalAmountXof     = finalAmountUsd
    ? currency === "FCFA" ? finalAmountUsd : Math.round(finalAmountUsd * FCFA_PER_USD)
    : 0;
  const finalAmountUsdNorm = currency === "FCFA"
    ? (finalAmountUsd ?? 0) / FCFA_PER_USD
    : (finalAmountUsd ?? 0);

  const handleDeposit = () => {
    if (!selectedMethod) {
      toast({ variant: "destructive", title: t("recharge_choose_method") });
      return;
    }
    const minFcfa = 300;
    const minUsd  = minFcfa / FCFA_PER_USD;
    const rawFcfa = currency === "FCFA"
      ? (finalAmountUsd ?? 0)
      : Math.round((finalAmountUsd ?? 0) * FCFA_PER_USD);
    if (!finalAmountUsd || finalAmountUsd <= 0 || rawFcfa < minFcfa) {
      toast({ variant: "destructive", title: "Montant trop faible", description: `Minimum : ${minFcfa.toLocaleString("fr-FR")} FCFA ($${minUsd.toFixed(2)}).` });
      return;
    }
    if (!user) {
      toast({ variant: "destructive", title: "Non connecté", description: "Veuillez vous connecter." });
      return;
    }
    if (selectedMethod === "mobile") { setOmnipayOpen(true); return; }
    if (selectedMethod === "crypto") { setShowCryptoPage(true); return; }
    toast({ title: t("recharge_soon_toast_title"), description: t("recharge_soon_toast_desc") });
  };

  const handlePaymentSuccess = () => {
    toast({ title: "Paiement initié !", description: "Votre solde sera mis à jour dans quelques instants." });
    setTimeout(() => {
      refetchBalance();
      queryClient.invalidateQueries({ queryKey: getGetBalanceQueryKey() });
    }, 3000);
  };

  // ── Vue page crypto ──
  if (showCryptoPage && user) {
    return (
      <CryptoPage
        amountUsd={finalAmountUsdNorm}
        userId={user.id}
        onBack={() => setShowCryptoPage(false)}
        onSuccess={() => {
          handlePaymentSuccess();
          setTimeout(() => setShowCryptoPage(false), 3500);
        }}
      />
    );
  }

  // ── Vue principale sélection ──
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{t("recharge_header")}</h2>
        <p className="text-muted-foreground text-sm">{t("recharge_sub")}</p>
      </div>

      {/* Solde actuel */}
      <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-500/10 via-primary/5 to-blue-500/5 p-5 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-primary/20 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("recharge_balance_label")}</p>
            <p className="text-2xl font-bold text-gray-900">{formatBalance(balance)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-600">
          <ShieldCheck className="w-3.5 h-3.5" /> {t("recharge_verified")}
        </div>
      </div>

      {/* Montant */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-5">
        <h3 className="font-semibold text-gray-900">{t("recharge_amount_title")}</h3>
        <div className="grid grid-cols-3 gap-2">
          {AMOUNTS_USD.map((amt) => {
            const displayAmt = currency === "FCFA" ? amt * FCFA_PER_USD : amt;
            const active     = selectedAmount === amt && !customAmount;
            return (
              <button
                key={amt}
                onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }}
                className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                  active
                    ? "border-primary/50 bg-primary/10 text-primary shadow-lg shadow-primary/10"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {currency === "FCFA" ? `${displayAmt.toLocaleString("fr-FR")} F` : `$${amt}`}
              </button>
            );
          })}
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">{t("recharge_custom_label")}</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">
              {currency === "FCFA" ? "FCFA" : "$"}
            </span>
            <input
              type="number" min="1" placeholder="0"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
              className="w-full h-12 pl-14 pr-4 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition shadow-sm"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {finalAmountUsd && finalAmountUsd > 0
              ? `≈ ${currency === "FCFA" ? `$${(finalAmountUsd / FCFA_PER_USD).toFixed(2)}` : `${Math.round(finalAmountUsd * FCFA_PER_USD).toLocaleString("fr-FR")} FCFA`}`
              : `Minimum : 300 FCFA ($${(300 / FCFA_PER_USD).toFixed(2)})`}
          </p>
        </div>
      </div>

      {/* Méthodes : Mobile → Crypto → Carte */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">{t("recharge_method_title")}</h3>
        <div className="space-y-2">
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => m.available && setSelectedMethod(m.id)}
              disabled={!m.available}
              className={`w-full flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border text-left transition-all ${
                selectedMethod === m.id
                  ? "border-primary/50 bg-primary/10"
                  : "border-gray-200 bg-gray-50 hover:bg-gray-100"
              } ${!m.available ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                  {m.icon}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm">{m.label}</p>
                    {m.soon && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-600">
                        {m.id === "crypto" ? "Désactivé" : "Bientôt"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{m.sub}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!m.available ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-muted-foreground">
                    {t("recharge_soon_badge")}
                  </span>
                ) : (
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedMethod === m.id ? "border-primary bg-primary" : "border-gray-300"}`}>
                    {selectedMethod === m.id && <Check className="w-3 h-3 text-white" />}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Récapitulatif + Déposer */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">{t("recharge_summary")}</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>{t("recharge_deposited")}</span>
            <span className="text-gray-900 font-semibold">
              {finalAmountUsd && finalAmountUsd > 0
                ? currency === "FCFA"
                  ? `${Math.round(finalAmountUsd).toLocaleString("fr-FR")} FCFA`
                  : `$${finalAmountUsd.toFixed(2)}`
                : "—"}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>{t("recharge_fees")}</span>
            <span className="text-green-600 font-semibold">{t("recharge_free_label")}</span>
          </div>
          <div className="h-px bg-gray-200 my-2" />
          <div className="flex justify-between font-bold text-gray-900 text-base">
            <span>{t("recharge_new_balance")}</span>
            <span className="text-primary">
              {finalAmountUsd && finalAmountUsd > 0
                ? formatBalance(balance + finalAmountUsdNorm)
                : formatBalance(balance)}
            </span>
          </div>
        </div>

        <Button
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-xl shadow-primary/20"
          onClick={handleDeposit}
          disabled={!finalAmountUsd || finalAmountUsd <= 0}
        >
          <Lock className="w-4 h-4 mr-2" />
          {finalAmountUsd && finalAmountUsd > 0
            ? `${t("recharge_deposit_btn")} ${currency === "FCFA" ? `${Math.round(finalAmountUsd).toLocaleString("fr-FR")} FCFA` : `$${finalAmountUsd}`}`
            : t("recharge_deposit_btn")}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
          {t("recharge_security_note")}
        </p>
      </div>

      {user && (
        <OmnipayModal
          open={omnipayOpen}
          onClose={() => setOmnipayOpen(false)}
          amountXof={finalAmountXof}
          userId={user.id}
          onSuccess={handlePaymentSuccess}
          userFirstName={user.name?.split(" ")[0] ?? "ZyNum"}
          userLastName={user.name?.split(" ").slice(1).join(" ") || `User${user.id}`}
        />
      )}
    </div>
  );
}
