import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Smartphone, CreditCard, ChevronRight, Loader2,
  CheckCircle2, AlertCircle, Phone,
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

const OPERATORS = [
  { id: "WAVE",        label: "Wave",        color: "bg-blue-500" },
  { id: "ORANGE",      label: "Orange Money", color: "bg-orange-500" },
  { id: "FREE",        label: "Free Money",   color: "bg-red-500" },
  { id: "MTN",         label: "MTN Money",    color: "bg-yellow-500" },
  { id: "MOOV",        label: "Moov Money",   color: "bg-purple-500" },
  { id: "EXPRESSO",    label: "Expresso",     color: "bg-teal-500" },
];

type PayState = "idle" | "loading" | "success" | "error";

export function PaxityModal({ open, onClose, amountXof, userId, onSuccess }: PaxityModalProps) {
  const [tab, setTab]           = useState<Tab>("mobile");
  const [state, setState]       = useState<PayState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [phone,    setPhone]    = useState("");
  const [operator, setOperator] = useState("");

  const [holderName,  setHolderName]  = useState("");
  const [cardNumber,  setCardNumber]  = useState("");
  const [expiry,      setExpiry]      = useState("");
  const [cvv,         setCvv]         = useState("");

  const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  function reset() {
    setState("idle");
    setErrorMsg("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function submit() {
    setState("loading");
    setErrorMsg("");

    try {
      let body: Record<string, unknown>;
      if (tab === "mobile") {
        if (!phone || !operator) {
          setState("error");
          setErrorMsg("Veuillez entrer votre numéro et sélectionner l'opérateur.");
          return;
        }
        body = {
          method: "mobile",
          amount: Math.round(amountXof),
          country: "SN",
          currency: "XOF",
          userId: String(userId),
          phone: phone.startsWith("+") ? phone : `+221${phone}`,
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
          method: "card",
          amount: Math.round(amountXof),
          country: "SN",
          currency: "XOF",
          userId: String(userId),
          holderName,
          cardNumber: cardNumber.replace(/\s/g, ""),
          expMonth: mm,
          expYear: yyyy,
          cvv,
        };
      }

      const res  = await fetch(`${apiBase}/api/v1/payments/paxity/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as Record<string, unknown>;

      if (!res.ok) {
        const msg = String(data?.message ?? data?.error ?? "Paiement refusé.");
        setState("error");
        setErrorMsg(msg);
        return;
      }

      setState("success");
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2500);
    } catch (err) {
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
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
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">Paiement sécurisé</h2>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Montant : <span className="text-white font-semibold">{Math.round(amountXof).toLocaleString("fr-FR")} FCFA</span>
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {state === "success" ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 gap-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-xl">Paiement initié !</p>
                  <p className="text-muted-foreground text-sm mt-1">Confirmez sur votre téléphone ou carte.</p>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-5">
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

                {tab === "mobile" ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-2">Numéro de téléphone</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
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
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-2">Opérateur</label>
                      <div className="grid grid-cols-3 gap-2">
                        {OPERATORS.map((op) => (
                          <button
                            key={op.id}
                            onClick={() => setOperator(op.id)}
                            className={`py-2.5 px-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                              operator === op.id
                                ? "border-primary/60 bg-primary/10 text-white"
                                : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.06] hover:text-white"
                            }`}
                          >
                            {op.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
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

                {state === "error" && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{errorMsg}</p>
                  </div>
                )}

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
                  Paiement sécurisé · Powered by Paxity
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
