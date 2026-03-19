import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Loader2, CheckCircle2, Copy, AlertCircle,
  RefreshCw, Lock, Phone, ArrowLeft, Wallet,
  Check, X, RotateCcw, Smartphone, ChevronRight, Clock, History,
} from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  useGetServices,
  useGetCountries,
  useBuyNumber,
  useCheckSms,
  useCancelOrder,
  useGetOperators,
  useGetCurrentUser,
  useGetBalance,
  type Order,
} from "@workspace/api-client-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type BuyStep = "service" | "country" | "operator" | "preview" | "active";

// ─── Countdown hook (based on createdAt ISO string) ───────────────────────────
const DURATION = 360; // 6 minutes in seconds
function useCountdown(createdAt: string | undefined) {
  const [remaining, setRemaining] = useState<number>(DURATION);
  useEffect(() => {
    if (!createdAt) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
      setRemaining(Math.max(0, DURATION - elapsed));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [createdAt]);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const pct = remaining / DURATION; // 1 → 0
  const urgent = remaining <= 60;
  const expired = remaining === 0;
  return { remaining, mm, ss, pct, urgent, expired };
}

// ─── Countdown ring UI ────────────────────────────────────────────────────────
function CountdownRing({ createdAt, onExpired }: { createdAt: string; onExpired?: () => void }) {
  const { mm, ss, pct, urgent, expired } = useCountdown(createdAt);
  const prevExpired = useRef(false);
  useEffect(() => {
    if (expired && !prevExpired.current) { prevExpired.current = true; onExpired?.(); }
  }, [expired, onExpired]);

  const r = 38; const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const color = expired ? "#ef4444" : urgent ? "#f97316" : "#3b82f6";

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle
            cx="44" cy="44" r={r} fill="none"
            stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: "stroke-dasharray 1s linear, stroke 0.5s" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Clock className="w-4 h-4 mb-0.5" style={{ color }} />
          <span className="text-lg font-bold font-mono" style={{ color }}>
            {mm}:{ss}
          </span>
        </div>
      </div>
      <div className="text-center">
        {expired ? (
          <p className="text-sm font-semibold text-red-400">Délai expiré</p>
        ) : urgent ? (
          <p className="text-sm font-semibold text-orange-400">⚠️ Moins d'une minute !</p>
        ) : (
          <p className="text-xs text-muted-foreground">Temps restant pour recevoir le SMS</p>
        )}
      </div>
    </div>
  );
}

// ─── Service Logo ─────────────────────────────────────────────────────────────
function ServiceLogo({ icon, color, name, size = 40 }: { icon: string; color: string; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const lightBg = ["#FFFC00", "#F0B90B"].includes(color.toUpperCase());
  return (
    <div style={{ width: size, height: size, background: color, borderRadius: size * 0.22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {!failed ? (
        <img src={icon} alt={name} style={{ width: size * 0.58, height: size * 0.58, objectFit: "contain" }} onError={() => setFailed(true)} />
      ) : (
        <span style={{ fontWeight: 700, fontSize: size * 0.36, color: lightBg ? "#000" : "#fff" }}>
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
const STEPS_INFO = [
  { key: "service",  label: "Service" },
  { key: "country",  label: "Pays" },
  { key: "operator", label: "Opérateur" },
  { key: "preview",  label: "Numéro" },
  { key: "active",   label: "SMS" },
];

function StepIndicator({ current }: { current: BuyStep }) {
  const idx = STEPS_INFO.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-1 mb-8">
      {STEPS_INFO.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <React.Fragment key={s.key}>
            <div className="flex flex-col items-center gap-1 min-w-[40px]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done   ? "bg-green-500 text-white shadow-lg shadow-green-500/30" :
                active ? "bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary/30" :
                         "bg-white/5 border border-white/10 text-muted-foreground"
              }`}>
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block ${active ? "text-white" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS_INFO.length - 1 && (
              <div className={`flex-1 h-px mb-4 transition-all ${i < idx ? "bg-green-500/50" : "bg-white/10"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Page container with animation ───────────────────────────────────────────
function StepPage({ children, dir = 1 }: { children: React.ReactNode; dir?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: dir * 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: dir * -30 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BuyNumber() {
  const { currency } = useCurrency();
  const { toast } = useToast();

  const { data: user, isLoading: isUserLoading } = useGetCurrentUser({ query: { retry: false } });
  const { data: balanceData, refetch: refetchBalance } = useGetBalance({ query: { enabled: !!user, retry: false } });

  const [step, setStep] = useState<BuyStep>("service");
  const [dir, setDir] = useState(1); // animation direction
  const [searchService, setSearchService] = useState("");
  const [searchCountry, setSearchCountry] = useState("");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [buyCount, setBuyCount] = useState(0);

  const { data: servicesData, isLoading: isLoadingServices } = useGetServices();
  const { data: countriesData, isLoading: isLoadingCountries } = useGetCountries(
    { service: selectedService || undefined },
    { query: { enabled: !!selectedService } }
  );
  const { data: operatorsData, isLoading: isLoadingOperators } = useGetOperators(selectedService, selectedCountry);

  useEffect(() => {
    if (operatorsData?.operators?.length) {
      setSelectedOperator(operatorsData.operators[0].name);
    }
  }, [operatorsData]);

  const goTo = (next: BuyStep, forward = true) => { setDir(forward ? 1 : -1); setStep(next); };
  const goBack = (prev: BuyStep) => goTo(prev, false);

  const buyMutation = useBuyNumber({
    mutation: {
      onSuccess: (data) => {
        setActiveOrder(data.order);
        goTo("preview");
        refetchBalance();
      },
      onError: (error: any) => {
        const msg: string = error?.response?.data?.message ?? "";
        const isBalance = /balance|no free|insufficient|solde/i.test(msg);
        toast({
          variant: "destructive",
          title: isBalance ? "Solde insuffisant" : "Erreur d'achat",
          description: isBalance ? "Rechargez votre solde ZyNum depuis votre tableau de bord." : msg || "Impossible d'obtenir un numéro. Réessayez.",
        });
      },
    },
  });

  const cancelMutation = useCancelOrder({
    mutation: {
      onSuccess: () => {
        setActiveOrder(null);
        goTo("service", false);
        refetchBalance();
        toast({ title: "✅ Remboursé", description: "Le montant a été recrédité sur votre solde." });
      },
      onError: () => { setActiveOrder(null); goTo("service", false); },
    },
  });

  const { data: smsData, refetch: refetchSms } = useCheckSms(activeOrder?.id || "", {
    query: {
      enabled: !!activeOrder && step === "active" && activeOrder.status === "PENDING",
      refetchInterval: (q) => (q.state.data?.order.status !== "PENDING" ? false : 5000),
    },
  });

  useEffect(() => {
    if (!smsData?.order) return;
    setActiveOrder(smsData.order);
    if (smsData.order.status === "RECEIVED" || smsData.order.status === "FINISHED") {
      toast({ title: "📨 SMS reçu !", description: `Code OTP : ${smsData.order.smsCode}` });
    } else if (["TIMEOUT", "BANNED", "CANCELED"].includes(smsData.order.status)) {
      toast({ variant: "destructive", title: "Expiré", description: "Le numéro n'a pas reçu de SMS." });
    }
  }, [smsData, toast]);

  const handleGetNumber = useCallback(() => {
    if (!selectedService || !selectedCountry) return;
    setBuyCount((c) => c + 1);
    buyMutation.mutate({ data: { service: selectedService, country: selectedCountry, currency: currency as "USD" | "FCFA", operator: selectedOperator ?? "any" } });
  }, [selectedService, selectedCountry, selectedOperator, currency, buyMutation]);

  const handleChangeNumber = () => {
    if (!activeOrder) return;
    cancelMutation.mutate(activeOrder.id);
    if (selectedService && selectedCountry) {
      setTimeout(() => {
        setBuyCount((c) => c + 1);
        buyMutation.mutate({ data: { service: selectedService, country: selectedCountry, currency: currency as "USD" | "FCFA" } });
      }, 400);
    }
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copié !` });
  };

  const balance = balanceData?.balance ?? 0;
  const formatBalance = () => currency === "FCFA"
    ? `${Math.round(balance * 620).toLocaleString("fr-FR")} FCFA`
    : `$${balance.toFixed(2)}`;

  const selectedServiceInfo = servicesData?.services.find((s) => s.id === selectedService);
  const selectedCountryInfo  = countriesData?.countries.find((c) => c.code === selectedCountry);
  const operators = operatorsData?.operators ?? [];

  // ── Auth guard ──────────────────────────────────────────────────────────────
  if (isUserLoading) return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 bg-card/60 border border-white/10 rounded-2xl flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Connexion requise</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">Connectez-vous pour acheter des numéros virtuels.</p>
        <div className="flex gap-3">
          <Link href="/login"><Button className="bg-primary text-white">Se connecter</Button></Link>
          <Link href="/register"><Button variant="outline" className="border-white/20 text-white">Créer un compte</Button></Link>
        </div>
      </div>
    );
  }

  // ── Shared balance pill ─────────────────────────────────────────────────────
  const BalancePill = () => (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${
      balance === 0 ? "bg-red-500/10 border-red-500/20 text-red-300"
      : balance < 1 ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-300"
      :               "bg-green-500/10 border-green-500/20 text-green-300"
    }`}>
      <Wallet className="w-4 h-4 shrink-0" />
      Solde : {formatBalance()}
      {balance === 0 && <button onClick={() => window.dispatchEvent(new CustomEvent("zynum:tab", { detail: "recharge" }))} className="underline ml-1 hover:text-white">Recharger →</button>}
    </div>
  );

  // ── Breadcrumb trail ────────────────────────────────────────────────────────
  const Breadcrumb = () => (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 flex-wrap">
      {selectedServiceInfo && (
        <>
          <span className="flex items-center gap-1">
            <ServiceLogo icon={selectedServiceInfo.icon} color={selectedServiceInfo.color} name={selectedServiceInfo.name} size={16} />
            <span className="text-white font-medium">{selectedServiceInfo.name}</span>
          </span>
        </>
      )}
      {selectedCountryInfo && (
        <>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white font-medium">{selectedCountryInfo.name}</span>
        </>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 1 — SELECT SERVICE
  // ════════════════════════════════════════════════════════════════════════════
  if (step === "service") {
    const filtered = (servicesData?.services ?? []).filter((s) =>
      s.name.toLowerCase().includes(searchService.toLowerCase())
    );
    return (
      <div className="max-w-3xl mx-auto">
        <StepIndicator current="service" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Quel service voulez-vous vérifier ?</h1>
            <p className="text-muted-foreground text-sm mt-1">Choisissez l'application pour laquelle vous souhaitez recevoir un code OTP.</p>
          </div>
          <BalancePill />
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un service… Telegram, WhatsApp, Gmail…"
            className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-primary/50"
            value={searchService}
            onChange={(e) => setSearchService(e.target.value)}
          />
        </div>

        {/* Grid */}
        {isLoadingServices ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map((svc, i) => (
              <motion.button
                key={svc.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                onClick={() => {
                  setSelectedService(svc.id);
                  setSelectedCountry(null);
                  setSelectedOperator(null);
                  goTo("country");
                }}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 text-center transition-all hover:scale-[1.02]"
              >
                <ServiceLogo icon={svc.icon} color={svc.color} name={svc.name} size={48} />
                <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors leading-tight">{svc.name}</span>
              </motion.button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-16 text-center text-muted-foreground">
                Aucun service trouvé pour "<strong className="text-white">{searchService}</strong>"
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 2 — SELECT COUNTRY
  // ════════════════════════════════════════════════════════════════════════════
  if (step === "country") {
    const allCountries = countriesData?.countries ?? [];
    const filtered = allCountries
      .filter((c) => c.available > 0)
      .filter((c) => c.name.toLowerCase().includes(searchCountry.toLowerCase()));

    return (
      <AnimatePresence mode="wait">
        <StepPage key="country" dir={dir}>
          <div className="max-w-3xl mx-auto">
            <StepIndicator current="country" />

            <button onClick={() => goBack("service")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-5 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Changer de service
            </button>

            {selectedServiceInfo && (
              <div className="flex items-center gap-3 mb-5 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <ServiceLogo icon={selectedServiceInfo.icon} color={selectedServiceInfo.color} name={selectedServiceInfo.name} size={40} />
                <div>
                  <p className="text-xs text-muted-foreground">Service sélectionné</p>
                  <p className="font-bold text-white">{selectedServiceInfo.name}</p>
                </div>
                <BalancePill />
              </div>
            )}

            <div className="mb-5">
              <h2 className="text-2xl font-bold text-white mb-1">Dans quel pays ?</h2>
              <p className="text-muted-foreground text-sm">Sélectionnez le pays pour lequel vous souhaitez un numéro virtuel.</p>
            </div>

            <div className="relative mb-5">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un pays…"
                className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-primary/50"
                value={searchCountry}
                onChange={(e) => setSearchCountry(e.target.value)}
              />
            </div>

            {isLoadingCountries ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-2">
                {filtered.map((country, i) => {
                  const priceUsd = country.cost ?? 0;
                  const priceFcfa = Math.round(priceUsd * 620);
                  return (
                    <motion.button
                      key={country.code}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.025, 0.3) }}
                      onClick={() => { setSelectedCountry(country.code); goTo("operator"); }}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 text-left transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{country.flag ?? "🌐"}</span>
                        <div>
                          <p className="font-semibold text-white group-hover:text-primary transition-colors">{country.name}</p>
                          <p className="text-xs text-muted-foreground">{country.available} numéro{country.available > 1 ? "s" : ""} disponible{country.available > 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="font-bold text-white text-sm">
                            {currency === "FCFA" ? `${priceFcfa.toLocaleString("fr-FR")} FCFA` : `$${priceUsd.toFixed(2)}`}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </motion.button>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="py-16 text-center text-muted-foreground">
                    Aucun pays disponible pour ce service.
                  </div>
                )}
              </div>
            )}
          </div>
        </StepPage>
      </AnimatePresence>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 3 — SELECT OPERATOR & BUY
  // ════════════════════════════════════════════════════════════════════════════
  if (step === "operator") {
    return (
      <AnimatePresence mode="wait">
        <StepPage key="operator" dir={dir}>
          <div className="max-w-2xl mx-auto">
            <StepIndicator current="operator" />

            <button onClick={() => goBack("country")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-5 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Changer de pays
            </button>

            <Breadcrumb />

            {/* Summary card */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {selectedServiceInfo && <ServiceLogo icon={selectedServiceInfo.icon} color={selectedServiceInfo.color} name={selectedServiceInfo.name} size={48} />}
              <div className="flex-1">
                <p className="font-bold text-white text-lg">{selectedServiceInfo?.name}</p>
                <p className="text-muted-foreground text-sm">{selectedCountryInfo?.name}</p>
              </div>
              <BalancePill />
            </div>

            <div className="mb-5">
              <h2 className="text-2xl font-bold text-white mb-1">Choisir un opérateur</h2>
              <p className="text-muted-foreground text-sm">Sélectionnez l'opérateur réseau. Nous présélectionnons le moins cher.</p>
            </div>

            {isLoadingOperators ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : operators.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">Aucun opérateur disponible pour ce pays.</div>
            ) : (
              <div className="space-y-3 mb-8">
                {operators.map((op, i) => {
                  const active = selectedOperator === op.name;
                  return (
                    <motion.button
                      key={op.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      onClick={() => setSelectedOperator(op.name)}
                      className={`w-full flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border text-left transition-all ${
                        active
                          ? "border-primary/50 bg-primary/10 shadow-lg shadow-primary/10"
                          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold border ${
                          active ? "bg-primary/20 border-primary/30 text-primary" : "bg-white/5 border-white/10 text-muted-foreground"
                        }`}>
                          {op.label?.slice(0, 1).toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white">{op.label ?? op.name}</p>
                            {i === 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">Recommandé</span>}
                          </div>
                          <p className="text-xs text-muted-foreground">{op.available} numéro{op.available > 1 ? "s" : ""} dispo</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="font-bold text-white">
                            {currency === "FCFA"
                              ? `${op.priceFcfa?.toLocaleString("fr-FR")} FCFA`
                              : `$${op.priceUsd?.toFixed(2)}`}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          active ? "border-primary bg-primary" : "border-white/20"
                        }`}>
                          {active && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Buy button */}
            <Button
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-2xl shadow-primary/25"
              disabled={!selectedOperator || buyMutation.isPending || balance === 0}
              onClick={handleGetNumber}
            >
              {buyMutation.isPending ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Attribution en cours…</>
              ) : (
                <><Phone className="w-5 h-5 mr-2" /> Obtenir un numéro</>
              )}
            </Button>

            {balance === 0 && (
              <p className="text-center text-xs text-red-400 mt-3">
                Solde insuffisant.{" "}
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("zynum:tab", { detail: "recharge" }))}
                  className="underline hover:text-white"
                >
                  Recharger mon solde →
                </button>
              </p>
            )}
          </div>
        </StepPage>
      </AnimatePresence>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 4 — PREVIEW NUMBER
  // ════════════════════════════════════════════════════════════════════════════
  if (step === "preview" && activeOrder) {
    const svc = selectedServiceInfo;
    return (
      <AnimatePresence mode="wait">
        <StepPage key="preview" dir={dir}>
          <div className="max-w-lg mx-auto">
            <StepIndicator current="preview" />

            <button
              onClick={() => { cancelMutation.mutate(activeOrder.id); }}
              disabled={cancelMutation.isPending}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Changer de pays / service
            </button>

            <div className="rounded-3xl border border-white/10 bg-card/60 backdrop-blur-xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-center gap-4" style={{ background: svc ? `${svc.color}12` : undefined }}>
                {svc && <ServiceLogo icon={svc.icon} color={svc.color} name={svc.name} size={48} />}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Numéro assigné</p>
                  <p className="font-bold text-white text-lg">{activeOrder.serviceName}</p>
                  <p className="text-sm text-muted-foreground">{activeOrder.countryName}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-muted-foreground">Prix</p>
                  <p className="font-bold text-white text-lg">
                    {currency === "FCFA"
                      ? `${activeOrder.priceFcfa.toLocaleString("fr-FR")} FCFA`
                      : `$${activeOrder.priceUsd.toFixed(2)}`}
                  </p>
                </div>
              </div>

              {/* Number */}
              <div className="px-6 py-8 text-center">
                <div className="mb-3 inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs px-3 py-1 rounded-full font-medium">
                  <Smartphone className="w-3 h-3" /> Votre numéro virtuel
                </div>
                <div className="flex items-center justify-center gap-4 bg-black/40 border border-white/10 rounded-2xl px-6 py-5 mb-3">
                  <Phone className="w-6 h-6 text-primary shrink-0" />
                  <span className="text-3xl sm:text-4xl font-bold text-white font-mono tracking-wider select-all">{activeOrder.phone}</span>
                  <button onClick={() => copy(activeOrder.phone, "Numéro")} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <Copy className="w-5 h-5 text-muted-foreground hover:text-white" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Utilisez ce numéro dans <span className="text-white font-medium">{activeOrder.serviceName}</span> pour recevoir le code OTP.
                </p>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 space-y-3">
                <Button
                  className="w-full h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-base shadow-lg shadow-green-500/20"
                  onClick={() => { setStep("active"); toast({ title: "✅ Numéro confirmé", description: "En attente du SMS…" }); }}
                >
                  <Check className="w-5 h-5 mr-2" /> Utiliser ce numéro — attendre le SMS
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl border-white/20 text-white hover:bg-white/10 font-semibold"
                  onClick={handleChangeNumber}
                  disabled={buyMutation.isPending || cancelMutation.isPending}
                >
                  {buyMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                  Obtenir un autre numéro {buyCount > 1 && `(essai ${buyCount})`}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-10 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 text-sm"
                  onClick={() => cancelMutation.mutate(activeOrder.id)}
                  disabled={cancelMutation.isPending}
                >
                  <X className="w-4 h-4 mr-2" /> Annuler et rembourser
                </Button>
                <p className="text-center text-xs text-muted-foreground pt-1">
                  💡 "Obtenir un autre numéro" annule le numéro actuel et en assigne un nouveau automatiquement.
                </p>
              </div>
            </div>
          </div>
        </StepPage>
      </AnimatePresence>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 5 — ACTIVE / SMS POLLING
  // ════════════════════════════════════════════════════════════════════════════
  if (step === "active" && activeOrder) {
    const svc = selectedServiceInfo;
    const isPending = activeOrder.status === "PENDING";
    const isSuccess = activeOrder.status === "RECEIVED" || activeOrder.status === "FINISHED";
    const isFailed  = ["TIMEOUT", "BANNED", "CANCELED"].includes(activeOrder.status);

    return (
      <AnimatePresence mode="wait">
        <StepPage key="active" dir={dir}>
          <div className="max-w-lg mx-auto">
            <StepIndicator current="active" />

            <button
              onClick={() => { setActiveOrder(null); goTo("service", false); setBuyCount(0); }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Acheter un autre numéro
            </button>

            <div className="rounded-3xl border border-white/10 bg-card/60 backdrop-blur-xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="px-6 pt-5 pb-4 border-b border-white/10 flex items-center gap-4" style={{ background: svc ? `${svc.color}12` : undefined }}>
                {svc && <ServiceLogo icon={svc.icon} color={svc.color} name={svc.name} size={44} />}
                <div className="flex-1">
                  <p className="font-bold text-white">{activeOrder.serviceName}</p>
                  <p className="text-sm text-muted-foreground">{activeOrder.countryName}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  isPending ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" :
                  isSuccess ? "bg-green-500/10 text-green-400 border-green-500/30" :
                  "bg-red-500/10 text-red-400 border-red-500/30"
                }`}>{activeOrder.status}</span>
              </div>

              {/* Phone */}
              <div className="px-6 py-4 border-b border-white/10">
                <p className="text-xs text-muted-foreground mb-2">Numéro virtuel</p>
                <div className="flex items-center gap-3 bg-black/30 border border-white/5 rounded-xl px-4 py-3">
                  <Phone className="w-5 h-5 text-primary shrink-0" />
                  <span className="font-bold text-white font-mono text-2xl tracking-wider flex-1 select-all">{activeOrder.phone}</span>
                  <button onClick={() => copy(activeOrder.phone, "Numéro")} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* SMS area */}
              <div className="px-6 py-8">
                {isPending && (
                  <div className="flex flex-col items-center text-center gap-4">
                    {/* Spinner */}
                    <div className="relative w-14 h-14">
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                      <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                      <Smartphone className="absolute inset-0 m-auto w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg mb-1">En attente du SMS…</p>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        Entrez ce numéro dans <strong className="text-white">{activeOrder.serviceName}</strong> pour déclencher l'envoi du code.
                      </p>
                    </div>

                    {/* Countdown ring */}
                    <CountdownRing
                      createdAt={activeOrder.createdAt}
                      onExpired={() => {
                        toast({ title: "⏱ Délai expiré", description: "Le numéro n'a pas reçu de SMS. Vous pouvez annuler pour être remboursé.", variant: "destructive" });
                      }}
                    />

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 w-full mt-1">
                      <Button variant="outline" size="sm" onClick={() => refetchSms()} className="flex-1 border-white/20 text-white hover:bg-white/10">
                        <RefreshCw className="w-4 h-4 mr-2" /> Vérifier maintenant
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        className="flex-1 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => cancelMutation.mutate(activeOrder.id)}
                        disabled={cancelMutation.isPending}
                      >
                        {cancelMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                        Annuler &amp; rembourser
                      </Button>
                    </div>

                    {/* History tip */}
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2 w-full text-left">
                      <History className="w-3.5 h-3.5 shrink-0 text-primary" />
                      Si vous quittez cette page, vérifiez votre <strong className="text-white">Historique</strong> — vous pourrez y annuler la commande.
                    </p>
                  </div>
                )}

                {isSuccess && (
                  <div className="flex flex-col items-center text-center">
                    <CheckCircle2 className="w-16 h-16 text-green-400 mb-4" />
                    <p className="font-bold text-white text-2xl mb-5">SMS reçu !</p>
                    <div className="flex items-center gap-4 bg-green-500/10 border border-green-500/30 rounded-2xl px-8 py-5 mb-5">
                      <span className="text-4xl font-bold text-green-400 font-mono tracking-widest select-all">{activeOrder.smsCode}</span>
                      <button onClick={() => copy(activeOrder.smsCode || "", "Code OTP")} className="p-2 hover:bg-green-500/20 rounded-lg transition-colors">
                        <Copy className="w-5 h-5 text-green-400" />
                      </button>
                    </div>
                    {activeOrder.smsText && (
                      <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-left w-full">
                        <p className="text-xs text-muted-foreground mb-1">Message complet :</p>
                        <p className="text-sm text-white font-mono leading-relaxed">{activeOrder.smsText}</p>
                      </div>
                    )}
                  </div>
                )}

                {isFailed && (
                  <div className="flex flex-col items-center text-center">
                    <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                    <p className="font-bold text-white text-xl mb-2">Numéro expiré</p>
                    <p className="text-sm text-muted-foreground mb-6">Essayez un autre pays ou un autre service.</p>
                    <Button className="bg-primary text-white hover:bg-primary/90" onClick={() => { setActiveOrder(null); goTo("service", false); setBuyCount(0); }}>
                      Recommencer
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </StepPage>
      </AnimatePresence>
    );
  }

  return null;
}
