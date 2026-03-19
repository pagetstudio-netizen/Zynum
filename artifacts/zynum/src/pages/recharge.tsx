import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Wallet, CreditCard, Smartphone, Bitcoin, Building2,
  ArrowRight, Check, Lock, Zap, Clock, MessageSquare,
  ChevronRight, AlertCircle, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/use-currency";
import { useGetBalance, useGetCurrentUser } from "@workspace/api-client-react";

// ─── Data ─────────────────────────────────────────────────────────────────────
const AMOUNTS_USD = [5, 10, 20, 50, 100, 200];

const METHODS = [
  {
    id: "card",
    icon: <CreditCard className="w-6 h-6" />,
    label: "Carte bancaire",
    sub: "Visa, Mastercard",
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/20",
    available: false,
  },
  {
    id: "mobile",
    icon: <Smartphone className="w-6 h-6" />,
    label: "Mobile Money",
    sub: "Wave, Orange Money, MTN…",
    color: "text-green-400",
    bg: "bg-green-400/10 border-green-400/20",
    available: false,
  },
  {
    id: "crypto",
    icon: <Bitcoin className="w-6 h-6" />,
    label: "Cryptomonnaie",
    sub: "USDT, BTC, ETH, BNB…",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10 border-yellow-400/20",
    available: false,
  },
  {
    id: "bank",
    icon: <Building2 className="w-6 h-6" />,
    label: "Virement bancaire",
    sub: "Transfert SEPA / international",
    color: "text-purple-400",
    bg: "bg-purple-400/10 border-purple-400/20",
    available: false,
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Recharge() {
  const { currency } = useCurrency();
  const { toast } = useToast();
  const { data: user } = useGetCurrentUser({ query: { retry: false } });
  const { data: balanceData } = useGetBalance({ query: { enabled: !!user, retry: false } });

  const [selectedAmount, setSelectedAmount] = useState<number | null>(20);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [notified, setNotified] = useState(false);

  const balance = balanceData?.balance ?? 0;
  const formatBalance = (v: number) =>
    currency === "FCFA" ? `${Math.round(v * 620).toLocaleString("fr-FR")} FCFA` : `$${v.toFixed(2)}`;

  const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;
  const finalAmountFcfa = finalAmount ? Math.round(finalAmount * 620) : null;

  const handleDeposit = () => {
    if (!selectedMethod) {
      toast({ variant: "destructive", title: "Choisissez un mode de paiement" });
      return;
    }
    toast({
      title: "Bientôt disponible",
      description: "Ce mode de paiement sera intégré très prochainement.",
    });
  };

  const handleNotify = () => {
    setNotified(true);
    toast({ title: "Vous serez notifié dès l'ouverture des dépôts !" });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Recharger mon solde</h2>
        <p className="text-muted-foreground text-sm">Déposez des fonds sur votre compte ZyNum pour acheter des numéros virtuels.</p>
      </div>

      {/* Current balance */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-primary/10 to-blue-500/5 p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Solde disponible</p>
            <p className="text-2xl font-bold text-white">{formatBalance(balance)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
          <ShieldCheck className="w-3.5 h-3.5" /> Compte vérifié
        </div>
      </div>

      {/* Coming soon banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex items-start gap-4"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
          <Clock className="w-5 h-5 text-primary animate-pulse" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-white mb-1">Système de recharge en cours d'intégration</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nous préparons activement notre propre système de paiement pour que vous puissiez déposer de l'argent directement sur ZyNum — sans passer par aucun intermédiaire externe.
            Carte bancaire, Mobile Money, crypto et virement seront disponibles très prochainement.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            {!notified ? (
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white font-semibold"
                onClick={handleNotify}
              >
                <Zap className="w-4 h-4 mr-2" /> M'avertir à l'ouverture
              </Button>
            ) : (
              <span className="inline-flex items-center gap-2 text-green-400 text-sm font-semibold">
                <Check className="w-4 h-4" /> Vous serez notifié !
              </span>
            )}
            <Link href="/contact">
              <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <MessageSquare className="w-4 h-4 mr-2" /> Contacter le support
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Amount selection */}
      <div className="rounded-2xl border border-white/10 bg-card/40 p-6 space-y-5">
        <h3 className="font-semibold text-white">Montant à déposer</h3>

        <div className="grid grid-cols-3 gap-2">
          {AMOUNTS_USD.map((amt) => {
            const active = selectedAmount === amt && !customAmount;
            return (
              <button
                key={amt}
                onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }}
                className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                  active
                    ? "border-primary/50 bg-primary/10 text-primary shadow-lg shadow-primary/10"
                    : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {currency === "FCFA"
                  ? `${(amt * 620).toLocaleString("fr-FR")} FCFA`
                  : `$${amt}`}
              </button>
            );
          })}
        </div>

        {/* Custom amount */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Montant personnalisé</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">
              {currency === "FCFA" ? "FCFA" : "$"}
            </span>
            <input
              type="number"
              min="1"
              placeholder="0"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
              className="w-full h-12 pl-14 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
            />
          </div>
          {finalAmount && finalAmount > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              ≈ {currency === "FCFA"
                ? `$${finalAmount.toFixed(2)}`
                : `${Math.round(finalAmount * 620).toLocaleString("fr-FR")} FCFA`}
            </p>
          )}
        </div>
      </div>

      {/* Payment method */}
      <div className="rounded-2xl border border-white/10 bg-card/40 p-6 space-y-4">
        <h3 className="font-semibold text-white">Mode de paiement</h3>
        <div className="space-y-2">
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMethod(m.id)}
              disabled={!m.available}
              className={`w-full flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border text-left transition-all ${
                selectedMethod === m.id
                  ? "border-primary/50 bg-primary/10"
                  : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
              } ${!m.available ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${m.bg} ${m.color}`}>
                  {m.icon}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white text-sm">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.sub}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!m.available ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                    Bientôt
                  </span>
                ) : (
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedMethod === m.id ? "border-primary bg-primary" : "border-white/20"
                  }`}>
                    {selectedMethod === m.id && <Check className="w-3 h-3 text-white" />}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary & CTA */}
      <div className="rounded-2xl border border-white/10 bg-card/40 p-6 space-y-4">
        <h3 className="font-semibold text-white">Récapitulatif</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Montant déposé</span>
            <span className="text-white font-semibold">
              {finalAmount && finalAmount > 0
                ? currency === "FCFA"
                  ? `${Math.round(finalAmount * 620).toLocaleString("fr-FR")} FCFA`
                  : `$${finalAmount.toFixed(2)}`
                : "—"}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Frais de dépôt</span>
            <span className="text-green-400 font-semibold">Gratuit</span>
          </div>
          <div className="h-px bg-white/10 my-2" />
          <div className="flex justify-between font-bold text-white text-base">
            <span>Nouveau solde</span>
            <span className="text-primary">
              {finalAmount && finalAmount > 0
                ? formatBalance(balance + (currency === "FCFA" ? finalAmount / 620 : finalAmount))
                : formatBalance(balance)}
            </span>
          </div>
        </div>

        <Button
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-xl shadow-primary/20"
          onClick={handleDeposit}
        >
          <Lock className="w-4 h-4 mr-2" />
          {finalAmount && finalAmount > 0
            ? `Déposer ${currency === "FCFA" ? `${Math.round(finalAmount * 620).toLocaleString("fr-FR")} FCFA` : `$${finalAmount}`}`
            : "Déposer"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
          Paiement sécurisé · Crédit instantané · Aucuns frais cachés
        </p>
      </div>

      {/* Manual contact option */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 flex items-center gap-4">
        <AlertCircle className="w-8 h-8 text-muted-foreground shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-white mb-0.5">Vous avez besoin de crédits maintenant ?</p>
          <p className="text-xs text-muted-foreground">Contactez notre équipe support pour un rechargement manuel en attendant l'intégration complète.</p>
        </div>
        <Link href="/contact">
          <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10 shrink-0">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
