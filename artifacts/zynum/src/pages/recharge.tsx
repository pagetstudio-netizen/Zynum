import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Wallet, CreditCard, Smartphone, Bitcoin, Building2,
  ArrowRight, Check, Lock, Zap, Clock, MessageSquare,
  ChevronRight, AlertCircle, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage } from "@/hooks/use-language";
import { useGetBalance, useGetCurrentUser } from "@workspace/api-client-react";

const AMOUNTS_USD = [5, 10, 20, 50, 100, 200];

export default function Recharge() {
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const { toast } = useToast();
  const { data: user } = useGetCurrentUser({ query: { retry: false } });
  const { data: balanceData } = useGetBalance({ query: { enabled: !!user, retry: false } });

  const [selectedAmount, setSelectedAmount] = useState<number | null>(20);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [notified, setNotified] = useState(false);

  const METHODS = [
    { id: "card",   icon: <CreditCard className="w-6 h-6" />, label: t("recharge_card"),   sub: "Visa, Mastercard",            color: "text-blue-400",   bg: "bg-blue-400/10 border-blue-400/20",   available: false },
    { id: "mobile", icon: <Smartphone className="w-6 h-6" />, label: t("recharge_mobile"),  sub: "Wave, Orange Money, MTN…",    color: "text-green-400",  bg: "bg-green-400/10 border-green-400/20",  available: false },
    { id: "crypto", icon: <Bitcoin className="w-6 h-6" />,    label: t("recharge_crypto"),  sub: "USDT, BTC, ETH, BNB…",       color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20", available: false },
    { id: "bank",   icon: <Building2 className="w-6 h-6" />,  label: t("recharge_bank"),    sub: "Transfert SEPA / international", color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20", available: false },
  ];

  const balance = balanceData?.balance ?? 0;
  const formatBalance = (v: number) =>
    currency === "FCFA" ? `${Math.round(v * 620).toLocaleString("fr-FR")} FCFA` : `$${v.toFixed(2)}`;

  const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;

  const handleDeposit = () => {
    if (!selectedMethod) {
      toast({ variant: "destructive", title: t("recharge_choose_method") });
      return;
    }
    toast({ title: t("recharge_soon_toast_title"), description: t("recharge_soon_toast_desc") });
  };

  const handleNotify = () => {
    setNotified(true);
    toast({ title: t("recharge_notify_toast") });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">{t("recharge_header")}</h2>
        <p className="text-muted-foreground text-sm">{t("recharge_sub")}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-primary/10 to-blue-500/5 p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("recharge_balance_label")}</p>
            <p className="text-2xl font-bold text-white">{formatBalance(balance)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
          <ShieldCheck className="w-3.5 h-3.5" /> {t("recharge_verified")}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex items-start gap-4"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
          <Clock className="w-5 h-5 text-primary animate-pulse" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-white mb-1">{t("recharge_banner_title")}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("recharge_banner_desc")}</p>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            {!notified ? (
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-semibold" onClick={handleNotify}>
                <Zap className="w-4 h-4 mr-2" /> {t("recharge_notify_btn")}
              </Button>
            ) : (
              <span className="inline-flex items-center gap-2 text-green-400 text-sm font-semibold">
                <Check className="w-4 h-4" /> {t("recharge_notified")}
              </span>
            )}
            <Link href="/contact">
              <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <MessageSquare className="w-4 h-4 mr-2" /> {t("recharge_contact_support")}
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="rounded-2xl border border-white/10 bg-card/40 p-6 space-y-5">
        <h3 className="font-semibold text-white">{t("recharge_amount_title")}</h3>
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
                {currency === "FCFA" ? `${(amt * 620).toLocaleString("fr-FR")} FCFA` : `$${amt}`}
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

      <div className="rounded-2xl border border-white/10 bg-card/40 p-6 space-y-4">
        <h3 className="font-semibold text-white">{t("recharge_method_title")}</h3>
        <div className="space-y-2">
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMethod(m.id)}
              disabled={!m.available}
              className={`w-full flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border text-left transition-all ${
                selectedMethod === m.id ? "border-primary/50 bg-primary/10" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
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
                    {t("recharge_soon_badge")}
                  </span>
                ) : (
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedMethod === m.id ? "border-primary bg-primary" : "border-white/20"}`}>
                    {selectedMethod === m.id && <Check className="w-3 h-3 text-white" />}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card/40 p-6 space-y-4">
        <h3 className="font-semibold text-white">{t("recharge_summary")}</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>{t("recharge_deposited")}</span>
            <span className="text-white font-semibold">
              {finalAmount && finalAmount > 0
                ? currency === "FCFA"
                  ? `${Math.round(finalAmount * 620).toLocaleString("fr-FR")} FCFA`
                  : `$${finalAmount.toFixed(2)}`
                : "—"}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>{t("recharge_fees")}</span>
            <span className="text-green-400 font-semibold">{t("recharge_free_label")}</span>
          </div>
          <div className="h-px bg-white/10 my-2" />
          <div className="flex justify-between font-bold text-white text-base">
            <span>{t("recharge_new_balance")}</span>
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
            ? `${t("recharge_deposit_btn")} ${currency === "FCFA" ? `${Math.round(finalAmount * 620).toLocaleString("fr-FR")} FCFA` : `$${finalAmount}`}`
            : t("recharge_deposit_btn")}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
          {t("recharge_security_note")}
        </p>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 flex items-center gap-4">
        <AlertCircle className="w-8 h-8 text-muted-foreground shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-white mb-0.5">{t("recharge_manual_title")}</p>
          <p className="text-xs text-muted-foreground">{t("recharge_manual_desc")}</p>
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
