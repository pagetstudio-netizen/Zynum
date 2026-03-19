import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, CreditCard, ChevronRight, Loader2, CheckCircle2,
  AlertCircle, Phone, ExternalLink, RefreshCw, QrCode,
  Smartphone, Search, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PaxityModalProps {
  open: boolean;
  onClose: () => void;
  amountXof: number;
  userId: string | number;
  onSuccess: () => void;
  initialTab?: Tab;
}

type Tab = "mobile" | "card";
type View = "form" | "country-picker";
type PayState = "idle" | "loading" | "qr" | "push" | "success" | "error";

interface OperatorDef {
  id: string;
  label: string;
  logo: string;
  type: "CODE_QR" | "PUSH" | "CODE_OTP";
}

interface CountryDef {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  operators: OperatorDef[];
}

interface PaxityTxData {
  transactionId?: string;
  link?: string;
  qrCode?: string;
  status?: string;
  amount?: number;
  realAmount?: number;
  currency?: string;
}

const MTN_LOGO  = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/New-mtn-logo.jpg/120px-New-mtn-logo.jpg";
const OM_LOGO   = "https://i.imgur.com/ctVnv9i.png";
const WAVE_LOGO = "https://i.imgur.com/zOMoVcU.png";
const MOOV_LOGO = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Moov_Africa_logo.svg/120px-Moov_Africa_logo.svg.png";
const MPESA_LOGO= "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/120px-M-PESA_LOGO-01.svg.png";

const COUNTRIES: CountryDef[] = [
  {
    code: "SN", name: "Sénégal",       flag: "🇸🇳", currency: "XOF", currencySymbol: "FCFA",
    operators: [
      { id: "WAVESN", label: "Wave",         logo: WAVE_LOGO, type: "CODE_QR" },
      { id: "OMSN",   label: "Orange Money", logo: OM_LOGO,   type: "CODE_QR" },
    ],
  },
  {
    code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF", currencySymbol: "FCFA",
    operators: [
      { id: "MTNCI",  label: "MTN Mobile Money", logo: MTN_LOGO,  type: "PUSH"    },
      { id: "WAVECI", label: "Wave",              logo: WAVE_LOGO, type: "CODE_QR" },
      { id: "OMCI",   label: "Orange Money",      logo: OM_LOGO,   type: "CODE_QR" },
    ],
  },
  {
    code: "CM", name: "Cameroun",      flag: "🇨🇲", currency: "XAF", currencySymbol: "FCFA",
    operators: [
      { id: "MTNCM", label: "MTN Mobile Money", logo: MTN_LOGO, type: "PUSH" },
      { id: "OMCM",  label: "Orange Money",     logo: OM_LOGO,  type: "PUSH" },
    ],
  },
  {
    code: "BJ", name: "Bénin",         flag: "🇧🇯", currency: "XOF", currencySymbol: "FCFA",
    operators: [
      { id: "MOOVBJ", label: "Moov Money",      logo: MOOV_LOGO, type: "PUSH" },
      { id: "MTNBJ",  label: "MTN Mobile Money", logo: MTN_LOGO,  type: "PUSH" },
    ],
  },
  {
    code: "BF", name: "Burkina Faso",  flag: "🇧🇫", currency: "XOF", currencySymbol: "FCFA",
    operators: [
      { id: "MOOVBF", label: "Moov Money",   logo: MOOV_LOGO, type: "PUSH"     },
      { id: "OMBF",   label: "Orange Money", logo: OM_LOGO,   type: "CODE_OTP" },
    ],
  },
  {
    code: "GH", name: "Ghana",         flag: "🇬🇭", currency: "GHS", currencySymbol: "GHS",
    operators: [
      { id: "ATGH",  label: "AirtelTigo", logo: MTN_LOGO, type: "PUSH" },
      { id: "MTNGH", label: "MTN",        logo: MTN_LOGO, type: "PUSH" },
      { id: "TLGH",  label: "Telecel",    logo: MTN_LOGO, type: "PUSH" },
    ],
  },
  {
    code: "GN", name: "Guinée",        flag: "🇬🇳", currency: "GNF", currencySymbol: "GNF",
    operators: [
      { id: "MTNGN", label: "MTN Mobile Money", logo: MTN_LOGO, type: "PUSH"    },
      { id: "OMGN",  label: "Orange Money",     logo: OM_LOGO,  type: "CODE_QR" },
    ],
  },
  {
    code: "KE", name: "Kenya",         flag: "🇰🇪", currency: "KES", currencySymbol: "KES",
    operators: [
      { id: "MPESAKE", label: "M-Pesa", logo: MPESA_LOGO, type: "PUSH" },
    ],
  },
  {
    code: "ML", name: "Mali",          flag: "🇲🇱", currency: "XOF", currencySymbol: "FCFA",
    operators: [
      { id: "MOOVML", label: "Moov Money",   logo: MOOV_LOGO, type: "PUSH" },
      { id: "OMML",   label: "Orange Money", logo: OM_LOGO,   type: "PUSH" },
    ],
  },
  {
    code: "NG", name: "Nigeria",       flag: "🇳🇬", currency: "NGN", currencySymbol: "₦",
    operators: [
      { id: "MTNNG", label: "MTN MoMo", logo: MTN_LOGO, type: "PUSH"    },
      { id: "OPNG",  label: "OPay",     logo: MTN_LOGO, type: "CODE_QR" },
    ],
  },
  {
    code: "TG", name: "Togo",          flag: "🇹🇬", currency: "XOF", currencySymbol: "FCFA",
    operators: [
      { id: "TMONEYTG", label: "T-Money",    logo: MTN_LOGO,  type: "PUSH" },
      { id: "MOOVTG",   label: "Moov Money", logo: MOOV_LOGO, type: "PUSH" },
    ],
  },
].sort((a, b) => a.name.localeCompare(b.name, "fr"));

/* ── Country Picker View ────────────────────────────────────────── */
function CountryPicker({
  current,
  onSelect,
  onBack,
}: {
  current: CountryDef;
  onSelect: (c: CountryDef) => void;
  onBack: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 120);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.currency.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <motion.div
      key="country-picker"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.22 }}
      className="absolute inset-0 flex flex-col bg-[#0d0e1b] z-10"
      style={{ borderRadius: "inherit" }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-5"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Retour</span>
        </button>
        <h2 className="text-2xl font-extrabold text-white leading-tight">Quel pays ?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sélectionnez le pays pour votre paiement Mobile Money.
        </p>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Rechercher un pays…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-white/30 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
          />
        </div>
      </div>

      {/* Country list */}
      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2 overscroll-contain">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-10">Aucun pays trouvé</p>
        )}
        {filtered.map((c) => {
          const isActive = c.code === current.code;
          return (
            <button
              key={c.code}
              onClick={() => onSelect(c)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all text-left ${
                isActive
                  ? "border-primary/40 bg-primary/8"
                  : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/10"
              }`}
            >
              {/* Flag */}
              <span className="text-3xl leading-none shrink-0">{c.flag}</span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-[15px] leading-tight ${isActive ? "text-white" : "text-white/90"}`}>
                  {c.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {c.operators.length} opérateur{c.operators.length > 1 ? "s" : ""} disponible{c.operators.length > 1 ? "s" : ""}
                  {" · "}{c.currencySymbol}
                </p>
              </div>

              {/* Operators mini logos */}
              <div className="flex items-center -space-x-1.5 shrink-0">
                {c.operators.slice(0, 3).map((op) => (
                  <div
                    key={op.id}
                    className="w-6 h-6 rounded-full bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center"
                  >
                    <img
                      src={op.logo}
                      alt={op.label}
                      className="w-full h-full object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                ))}
              </div>

              <ChevronRight className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : "text-white/30"}`} />
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ── Main modal ─────────────────────────────────────────────────── */
export function PaxityModal({ open, onClose, amountXof, userId, onSuccess, initialTab = "mobile" }: PaxityModalProps) {
  const [tab, setTab]               = useState<Tab>(initialTab);
  const [view, setView]             = useState<View>("form");
  const [state, setState]           = useState<PayState>("idle");

  useEffect(() => { if (open) { setTab(initialTab); setView("form"); reset(); } }, [open, initialTab]);
  const [errorMsg, setErrorMsg]     = useState("");
  const [txData, setTxData]         = useState<PaxityTxData | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<CountryDef>(COUNTRIES.find(c => c.code === "SN")!);
  const [operator,        setOperator]         = useState<OperatorDef>(COUNTRIES.find(c => c.code === "SN")!.operators[0]);
  const [phone,           setPhone]            = useState("");

  const [holderName, setHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry,     setExpiry]     = useState("");
  const [cvv,        setCvv]        = useState("");

  const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  function selectCountry(c: CountryDef) {
    setSelectedCountry(c);
    setOperator(c.operators[0]);
    setPhone("");
    reset();
    setView("form");
  }

  function reset() {
    setState("idle");
    setErrorMsg("");
    setTxData(null);
  }

  function handleClose() {
    reset();
    setView("form");
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
          currency: selectedCountry.currency,
          userId:   String(userId),
          phone:    phone.replace(/\D/g, ""),
          operator: operator.id,
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
        setState("error");
        setErrorMsg(String((json?.message as string) ?? (json?.error as string) ?? "Paiement refusé."));
        return;
      }

      const tx = (json?.data ?? json) as PaxityTxData;
      setTxData(tx);

      if (tab === "card") {
        setState("success");
        setTimeout(handleDone, 2500);
      } else if (tx.qrCode || tx.link) {
        setState("qr");
      } else {
        setState("push");
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
    return digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  }

  // Phone prefix per country (Togo has two)
  const phonePrefix: Record<string, string> = {
    SN:"221", CI:"225", CM:"237", BJ:"229", BF:"226",
    GH:"233", GN:"224", KE:"254", ML:"223", NG:"234",
    TG: operator.id === "TMONEYTG" ? "228" : "226",
  };

  const isForm = state === "idle" || state === "loading" || state === "error";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1,    opacity: 1, y: 0 }}
            exit={{   scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="relative w-full max-w-md bg-[#1a1a2e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            style={{ maxHeight: "88vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Country picker overlay (slides in from right) ── */}
            <AnimatePresence>
              {view === "country-picker" && (
                <CountryPicker
                  current={selectedCountry}
                  onSelect={selectCountry}
                  onBack={() => setView("form")}
                />
              )}
            </AnimatePresence>

            {/* ── Main form area ── */}
            <div className="flex flex-col" style={{ maxHeight: "88vh" }}>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
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

              <div className="overflow-y-auto flex-1">

                {/* ── QR Code screen ── */}
                {state === "qr" && txData && (
                  <div className="p-6 space-y-5">
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <QrCode className="w-4 h-4 text-primary" />
                        Scannez ou cliquez pour payer
                      </div>
                      {txData.qrCode && (
                        <div className="bg-white p-3 rounded-2xl shadow-xl">
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
                          Ouvrir dans {operator.label}
                        </a>
                      )}
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                      <RefreshCw className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" style={{ animation: "spin 3s linear infinite" }} />
                      <p className="text-xs text-yellow-300">
                        Votre solde sera crédité automatiquement après confirmation. Cela peut prendre quelques secondes.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" onClick={handleClose} className="rounded-xl border-white/20 text-white hover:bg-white/10">
                        Fermer
                      </Button>
                      <Button onClick={handleDone} className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        J'ai payé
                      </Button>
                    </div>
                    {txData.transactionId && (
                      <p className="text-center text-xs text-muted-foreground">Réf : {txData.transactionId}</p>
                    )}
                  </div>
                )}

                {/* ── PUSH screen ── */}
                {state === "push" && (
                  <div className="flex flex-col items-center justify-center py-10 px-6 gap-5">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <Smartphone className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-white font-bold text-lg">Confirmez sur votre téléphone</p>
                      <p className="text-muted-foreground text-sm">
                        Une notification a été envoyée sur le numéro{" "}
                        <span className="text-white font-semibold">{phone}</span>.<br />
                        Acceptez la demande dans votre application {operator.label}.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "2s" }} />
                      En attente de confirmation…
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <Button variant="outline" onClick={handleClose} className="rounded-xl border-white/20 text-white hover:bg-white/10">
                        Fermer
                      </Button>
                      <Button onClick={handleDone} className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        J'ai confirmé
                      </Button>
                    </div>
                    {txData?.transactionId && (
                      <p className="text-center text-xs text-muted-foreground">Réf : {txData.transactionId}</p>
                    )}
                  </div>
                )}

                {/* ── Success screen ── */}
                {state === "success" && (
                  <div className="flex flex-col items-center justify-center py-16 px-6 gap-4">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-green-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold text-xl">Paiement initié !</p>
                      <p className="text-muted-foreground text-sm mt-1">Votre solde sera mis à jour automatiquement.</p>
                    </div>
                  </div>
                )}

                {/* ── Payment form ── */}
                {isForm && (
                  <div className="p-5 space-y-4">

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
                            tab === t.id ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
                          }`}
                        >
                          {t.icon}{t.label}
                        </button>
                      ))}
                    </div>

                    {/* ── Mobile Money form ── */}
                    {tab === "mobile" && (
                      <div className="space-y-4">

                        {/* Country button — triggers full-screen picker */}
                        <div>
                          <label className="text-xs text-muted-foreground block mb-2">Pays</label>
                          <button
                            onClick={() => setView("country-picker")}
                            className="w-full flex items-center gap-3 h-14 px-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] hover:border-white/20 transition-all text-left group"
                          >
                            <span className="text-2xl leading-none">{selectedCountry.flag}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold text-sm leading-tight">{selectedCountry.name}</p>
                              <p className="text-muted-foreground text-xs">{selectedCountry.operators.length} opérateur{selectedCountry.operators.length > 1 ? "s" : ""} · {selectedCountry.currencySymbol}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors shrink-0" />
                          </button>
                        </div>

                        {/* Operator selector */}
                        <div>
                          <label className="text-xs text-muted-foreground block mb-2">Opérateur</label>
                          <div className={`grid gap-2 ${selectedCountry.operators.length <= 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                            {selectedCountry.operators.map((op) => (
                              <button
                                key={op.id}
                                onClick={() => setOperator(op)}
                                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all ${
                                  operator.id === op.id
                                    ? "border-primary/60 bg-primary/10 text-white shadow-lg shadow-primary/10"
                                    : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.06] hover:text-white"
                                }`}
                              >
                                <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                                  <img
                                    src={op.logo}
                                    alt={op.label}
                                    className="w-full h-full object-contain"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                  />
                                </div>
                                <span className="text-center leading-tight">{op.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Phone input */}
                        <div>
                          <label className="text-xs text-muted-foreground block mb-2">Numéro de téléphone</label>
                          <div className="flex gap-2">
                            <div className="flex items-center gap-1.5 h-12 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm shrink-0 select-none">
                              <span>{selectedCountry.flag}</span>
                              <span className="text-muted-foreground text-xs">+{phonePrefix[selectedCountry.code]}</span>
                            </div>
                            <div className="relative flex-1">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                              <input
                                type="tel"
                                placeholder="77 123 45 67"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full h-12 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                              />
                            </div>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1.5">Saisissez le numéro sans l'indicatif du pays</p>
                        </div>
                      </div>
                    )}

                    {/* ── Card form ── */}
                    {tab === "card" && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-muted-foreground block mb-2">Nom du titulaire</label>
                          <input type="text" placeholder="JEAN DUPONT" value={holderName}
                            onChange={(e) => setHolderName(e.target.value.toUpperCase())}
                            className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-2">Numéro de carte</label>
                          <input type="text" placeholder="1234 5678 9012 3456" value={cardNumber} maxLength={19}
                            onChange={(e) => setCardNumber(formatCard(e.target.value))}
                            className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 text-sm font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground block mb-2">Expiration</label>
                            <input type="text" placeholder="MM/AAAA" value={expiry} maxLength={7}
                              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                              className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 text-sm font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-2">CVV</label>
                            <input type="text" placeholder="123" value={cvv} maxLength={3}
                              onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                              className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 text-sm font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition" />
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
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Traitement en cours…</>
                      ) : (
                        <>Payer {Math.round(amountXof).toLocaleString("fr-FR")} FCFA<ChevronRight className="w-4 h-4 ml-2" /></>
                      )}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground pb-1">
                      Paiement sécurisé · Powered by <span className="text-white font-semibold">Paxity</span>
                    </p>
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
