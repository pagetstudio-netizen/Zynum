import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Smartphone, CreditCard, ChevronRight, Loader2,
  CheckCircle2, AlertCircle, Phone, ExternalLink, RefreshCw, QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaxityModalProps {
  open: boolean;
  onClose: () => void;
  amountXof: number;
  userId: string | number;
  onSuccess: () => void;
}

type Tab = "mobile" | "card";

// Payment methods available via Paxity (based on /payment-method/country/SN response)
const MOBILE_METHODS = [
  { id: "WAVESN",  label: "Wave",         color: "bg-blue-500",   logo: "https://i.imgur.com/zOMoVcU.png" },
  { id: "OMSN",    label: "Orange Money", color: "bg-orange-500", logo: "https://i.imgur.com/ctVnv9i.png" },
];

type PayState = "idle" | "loading" | "qr" | "success" | "error";

interface PaxityTxData {
  transactionId?: string;
  link?: string;
  qrCode?: string;
  status?: string;
  amount?: number;
  realAmount?: number;
  currency?: string;
}

export function PaxityModal({ open, onClose, amountXof, userId, onSuccess }: PaxityModalProps) {
  const [tab, setTab]               = useState<Tab>("mobile");
  const [state, setState]           = useState<PayState>("idle");
  const [errorMsg, setErrorMsg]     = useState("");
  const [txData, setTxData]         = useState<PaxityTxData | null>(null);

  const [phone,    setPhone]    = useState("");
  const [operator, setOperator] = useState(MOBILE_METHODS[0].id);

  const [holderName, setHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry,     setExpiry]     = useState("");
  const [cvv,        setCvv]        = useState("");

  const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  function reset() {
    setState("idle");
    setErrorMsg("");
    setTxData(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleDone() {
    onSuccess();
    handleClose();
  }

  async function submit() {
    setState("loading");
    setErrorMsg("");

    try {
      let body: Record<string, unknown>;
      if (tab === "mobile") {
        if (!phone) {
          setState("error");
          setErrorMsg("Veuillez entrer votre numéro de téléphone.");
          return;
        }
        body = {
          method:   "mobile",
          amount:   Math.round(amountXof),
          country:  "SN",
          currency: "XOF",
          userId:   String(userId),
          phone:    phone.replace(/\D/g, ""),
          operator,
        };
      } else {
        const [mm, yyyy] = expiry.split("/").map((s) => s.trim());
        if (!holderName || !cardNumber || !mm || !yyyy || !cvv) {
          setState("error");
          setErrorMsg("Veuillez remplir tous les champs de la carte.");
          return;
        }
        body = {
          method:     "card",
          amount:     Math.round(amountXof),
          country:    "SN",
          currency:   "XOF",
          userId:     String(userId),
          holderName,
          cardNumber: cardNumber.replace(/\s/g, ""),
          expMonth:   mm,
          expYear:    yyyy,
          cvv,
        };
      }

      const res  = await fetch(`${apiBase}/api/v1/payments/paxity/initiate`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify(body),
      });
      const json = (await res.json()) as Record<string, unknown>;

      if (!res.ok) {
        const msg = String(
          (json?.message as string) ?? (json?.error as string) ?? "Paiement refusé."
        );
        setState("error");
        setErrorMsg(msg);
        return;
      }

      // Paxity wraps data inside a `data` key
      const tx = (json?.data ?? json) as PaxityTxData;
      setTxData(tx);

      if (tab === "card") {
        // Card payments may complete immediately or redirect
        setState("success");
        setTimeout(handleDone, 2500);
      } else {
        // Mobile = show QR code / link
        setState("qr");
      }
    } catch {
      setState("error");
      setErrorMsg("Erreur de connexion. Veuillez réessayer.");
    }
  }

  function formatCard(v: string) {
    return v.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
  }
  function formatExpiry(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 6);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  }

  const selectedMethod = MOBILE_METHODS.find((m) => m.id === operator);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1,    opacity: 1, y: 0 }}
            exit={{   scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="w-full max-w-md bg-[#1a1a2e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">Paiement sécurisé</h2>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Montant :{" "}
                  <span className="text-white font-semibold">
                    {Math.round(amountXof).toLocaleString("fr-FR")} FCFA
                  </span>
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* QR Code / Payment Link screen */}
            {state === "qr" && txData && (
              <div className="p-6 space-y-5">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <QrCode className="w-4 h-4 text-primary" />
                    Scannez ou cliquez pour payer
                  </div>

                  {txData.qrCode && (
                    <div className="bg-white p-3 rounded-2xl">
                      <img
                        src={`data:image/png;base64,${txData.qrCode}`}
                        alt="QR Code de paiement"
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                  )}

                  {txData.link && (
                    <a
                      href={txData.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ouvrir dans {selectedMethod?.label ?? "l'app"}
                    </a>
                  )}
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <RefreshCw className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5 animate-spin" style={{ animationDuration: "3s" }} />
                  <p className="text-xs text-yellow-300">
                    Votre solde sera crédité automatiquement après confirmation du paiement. Cela peut prendre quelques secondes.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="rounded-xl border-white/20 text-white hover:bg-white/10"
                  >
                    Fermer
                  </Button>
                  <Button
                    onClick={handleDone}
                    className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    J'ai payé
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  Réf : {txData.transactionId ?? "—"}
                </p>
              </div>
            )}

            {/* Success screen */}
            {state === "success" && (
              <div className="flex flex-col items-center justify-center py-16 px-6 gap-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-xl">Paiement initié !</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Votre solde sera mis à jour automatiquement.
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            {(state === "idle" || state === "loading" || state === "error") && (
              <div className="p-6 space-y-5">
                {/* Tabs */}
                <div className="flex gap-2 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                  {([
                    { id: "mobile", icon: <Smartphone className="w-4 h-4" />, label: "Mobile Money" },
                    { id: "card",   icon: <CreditCard  className="w-4 h-4" />, label: "Carte bancaire" },
                  ] as { id: Tab; icon: React.ReactNode; label: string }[]).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setTab(t.id); reset(); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        tab === t.id
                          ? "bg-primary text-white shadow-lg"
                          : "text-muted-foreground hover:text-white"
                      }`}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Mobile Money form */}
                {tab === "mobile" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-2">Opérateur</label>
                      <div className="grid grid-cols-2 gap-2">
                        {MOBILE_METHODS.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setOperator(m.id)}
                            className={`flex items-center gap-3 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                              operator === m.id
                                ? "border-primary/60 bg-primary/10 text-white"
                                : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.06] hover:text-white"
                            }`}
                          >
                            <img src={m.logo} alt={m.label} className="w-6 h-6 object-contain rounded" />
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-2">Numéro de téléphone</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">
                          <Phone className="w-4 h-4" />
                        </span>
                        <input
                          type="tel"
                          placeholder="77 123 45 67"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        Saisissez le numéro sans indicatif (+221 est ajouté automatiquement)
                      </p>
                    </div>
                  </div>
                )}

                {/* Card form */}
                {tab === "card" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-2">Nom du titulaire</label>
                      <input
                        type="text"
                        placeholder="JEAN DUPONT"
                        value={holderName}
                        onChange={(e) => setHolderName(e.target.value.toUpperCase())}
                        className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-2">Numéro de carte</label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCard(e.target.value))}
                        maxLength={19}
                        className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-2">Expiration (MM/AAAA)</label>
                        <input
                          type="text"
                          placeholder="01/2027"
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          maxLength={7}
                          className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-2">CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                          maxLength={3}
                          className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Error */}
                {state === "error" && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{errorMsg}</p>
                  </div>
                )}

                {/* Submit */}
                <Button
                  onClick={submit}
                  disabled={state === "loading"}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-xl shadow-primary/20 disabled:opacity-60"
                >
                  {state === "loading" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Traitement en cours…
                    </>
                  ) : (
                    <>
                      Payer {Math.round(amountXof).toLocaleString("fr-FR")} FCFA
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Paiement sécurisé · Powered by{" "}
                  <span className="text-white font-semibold">Paxity</span>
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
