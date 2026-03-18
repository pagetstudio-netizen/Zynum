import React, { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, Loader2, CheckCircle2, Copy, AlertCircle,
  RefreshCw, Lock, Phone, ArrowLeft, Wallet, ChevronRight,
  Check, X, RotateCcw, Smartphone, Zap, Users,
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
  type OperatorInfo,
} from "@workspace/api-client-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type BuyStep = "select" | "preview" | "active";

// ─── Service Logo ─────────────────────────────────────────────────────────────
function ServiceLogo({ icon, color, name, size = 40 }: { icon: string; color: string; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const lightBg = ["#FFFC00", "#F0B90B"].includes(color.toUpperCase());
  return (
    <div
      style={{
        width: size, height: size, background: color, borderRadius: size * 0.22,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}
    >
      {!failed ? (
        <img
          src={icon} alt={name}
          style={{ width: size * 0.58, height: size * 0.58, objectFit: "contain" }}
          onError={() => setFailed(true)}
        />
      ) : (
        <span style={{ fontWeight: 700, fontSize: size * 0.36, color: lightBg ? "#000" : "#fff" }}>
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BuyNumber() {
  const { currency, formatPrice } = useCurrency();
  const { toast } = useToast();

  const { data: user, isLoading: isUserLoading } = useGetCurrentUser({ query: { retry: false } });
  const { data: balanceData } = useGetBalance({ query: { enabled: !!user, retry: false } });

  const [step, setStep] = useState<BuyStep>("select");
  const [searchService, setSearchService] = useState("");
  const [searchCountry, setSearchCountry] = useState("");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [buyCount, setBuyCount] = useState(0); // how many times we've tried for this selection

  const { data: servicesData, isLoading: isLoadingServices } = useGetServices();
  const { data: countriesData, isLoading: isLoadingCountries } = useGetCountries(
    { service: selectedService || undefined },
    { query: { enabled: !!selectedService } }
  );
  const { data: operatorsData, isLoading: isLoadingOperators } = useGetOperators(
    selectedService,
    selectedCountry,
  );

  // Auto-select cheapest operator when operators load
  useEffect(() => {
    if (operatorsData?.operators && operatorsData.operators.length > 0) {
      setSelectedOperator(operatorsData.operators[0].name);
    }
  }, [operatorsData]);

  // Buy mutation → goes to "preview" step
  const buyMutation = useBuyNumber({
    mutation: {
      onSuccess: (data) => {
        setActiveOrder(data.order);
        setStep("preview");
      },
      onError: (error: any) => {
        const msg: string = error?.response?.data?.message ?? "";
        const isBalance = /balance|no free|insufficient/i.test(msg);
        toast({
          variant: "destructive",
          title: isBalance ? "Solde insuffisant" : "Erreur d'achat",
          description: isBalance
            ? "Rechargez votre solde sur 5sim.net et réessayez."
            : msg || "Impossible d'obtenir un numéro. Réessayez.",
        });
      },
    },
  });

  // Cancel mutation → go back to select or get another number
  const cancelMutation = useCancelOrder({
    mutation: {
      onSuccess: () => {
        setActiveOrder(null);
        setStep("select");
      },
      onError: () => {
        // Cancel failed on 5SIM side but we reset anyway
        setActiveOrder(null);
        setStep("select");
      },
    },
  });

  // SMS polling when in "active" step
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
    buyMutation.mutate({
      data: {
        service: selectedService,
        country: selectedCountry,
        currency: currency as "USD" | "FCFA",
        operator: selectedOperator ?? "any",
      },
    });
  }, [selectedService, selectedCountry, selectedOperator, currency, buyMutation]);

  const handleConfirmNumber = () => {
    setStep("active");
    toast({ title: "✅ Numéro confirmé", description: "En attente du SMS…" });
  };

  const handleChangeNumber = () => {
    if (!activeOrder) return;
    cancelMutation.mutate(activeOrder.id);
    // Immediately buy another after cancel
    if (selectedService && selectedCountry) {
      setTimeout(() => {
        setBuyCount((c) => c + 1);
        buyMutation.mutate({ data: { service: selectedService, country: selectedCountry, currency: currency as "USD" | "FCFA" } });
      }, 400);
    }
  };

  const handleCancelAndBack = () => {
    if (activeOrder && step === "preview") {
      cancelMutation.mutate(activeOrder.id);
    } else {
      setActiveOrder(null);
      setStep("select");
    }
  };

  // ── Auth guard ─────────────────────────────────────────────────────────────
  if (isUserLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
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

  const balance = balanceData?.balance ?? 0;
  const filteredServices = (servicesData?.services ?? []).filter((s) =>
    s.name.toLowerCase().includes(searchService.toLowerCase())
  );
  const allCountries = countriesData?.countries ?? [];
  const availableCountries = allCountries.filter((c) => c.available > 0);
  const displayedCountries = (showAll ? allCountries : availableCountries).filter((c) =>
    c.name.toLowerCase().includes(searchCountry.toLowerCase())
  );
  const selectedServiceInfo = servicesData?.services.find((s) => s.id === selectedService);
  const selectedCountryInfo = countriesData?.countries.find((c) => c.code === selectedCountry);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copié !` });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP: PREVIEW — user sees the assigned phone number, can confirm or change
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === "preview" && activeOrder) {
    const svc = selectedServiceInfo;
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
        {/* Back */}
        <button
          onClick={handleCancelAndBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-6 transition-colors"
          disabled={cancelMutation.isPending}
        >
          <ArrowLeft className="w-4 h-4" /> Changer de pays / service
        </button>

        <div className="rounded-3xl border border-white/10 bg-card/60 backdrop-blur-xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div
            className="px-6 pt-6 pb-4 border-b border-white/10 flex items-center gap-4"
            style={{ background: svc ? `${svc.color}15` : undefined }}
          >
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

          {/* The number — this is the key section */}
          <div className="px-6 py-8 text-center">
            <div className="mb-3 inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs px-3 py-1 rounded-full font-medium">
              <Smartphone className="w-3 h-3" />
              Votre numéro virtuel
            </div>
            <div className="flex items-center justify-center gap-4 bg-black/40 border border-white/10 rounded-2xl px-6 py-5 mb-3">
              <Phone className="w-6 h-6 text-primary shrink-0" />
              <span className="text-4xl font-bold text-white font-mono tracking-wider select-all">
                {activeOrder.phone}
              </span>
              <button
                onClick={() => copy(activeOrder.phone, "Numéro")}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <Copy className="w-5 h-5 text-muted-foreground hover:text-white" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Utilisez ce numéro dans l'application&nbsp;
              <span className="text-white font-medium">{activeOrder.serviceName}</span>
              &nbsp;pour recevoir le code OTP.
            </p>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 space-y-3">
            {/* Primary: confirm */}
            <Button
              className="w-full h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-base shadow-lg shadow-green-500/20"
              onClick={handleConfirmNumber}
            >
              <Check className="w-5 h-5 mr-2" />
              Utiliser ce numéro — attendre le SMS
            </Button>

            {/* Secondary: get another */}
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl border-white/20 text-white hover:bg-white/10 font-semibold"
              onClick={handleChangeNumber}
              disabled={buyMutation.isPending || cancelMutation.isPending}
            >
              {buyMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              Obtenir un autre numéro {buyCount > 1 && `(essai ${buyCount})`}
            </Button>

            {/* Cancel */}
            <Button
              variant="ghost"
              className="w-full h-10 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 text-sm"
              onClick={handleCancelAndBack}
              disabled={cancelMutation.isPending}
            >
              <X className="w-4 h-4 mr-2" />
              Annuler et rembourser
            </Button>

            <p className="text-center text-xs text-muted-foreground pt-1">
              💡 "Obtenir un autre numéro" annule le numéro actuel et en assigne un nouveau automatiquement.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP: ACTIVE — SMS polling
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === "active" && activeOrder) {
    const svc = selectedServiceInfo;
    const isPending = activeOrder.status === "PENDING";
    const isSuccess = activeOrder.status === "RECEIVED" || activeOrder.status === "FINISHED";
    const isFailed = ["TIMEOUT", "BANNED", "CANCELED"].includes(activeOrder.status);

    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
        <button
          onClick={() => { setActiveOrder(null); setStep("select"); setBuyCount(0); }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Acheter un autre numéro
        </button>

        <div className="rounded-3xl border border-white/10 bg-card/60 backdrop-blur-xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div
            className="px-6 pt-5 pb-4 border-b border-white/10 flex items-center gap-4"
            style={{ background: svc ? `${svc.color}15` : undefined }}
          >
            {svc && <ServiceLogo icon={svc.icon} color={svc.color} name={svc.name} size={44} />}
            <div className="flex-1">
              <p className="font-bold text-white">{activeOrder.serviceName}</p>
              <p className="text-sm text-muted-foreground">{activeOrder.countryName}</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              isPending ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" :
              isSuccess ? "bg-green-500/10 text-green-400 border-green-500/30" :
              "bg-red-500/10 text-red-400 border-red-500/30"
            }`}>
              {activeOrder.status}
            </span>
          </div>

          {/* Phone */}
          <div className="px-6 py-5 border-b border-white/10">
            <p className="text-xs text-muted-foreground mb-2">Numéro virtuel</p>
            <div className="flex items-center gap-3 bg-black/30 border border-white/5 rounded-xl px-4 py-3">
              <Phone className="w-5 h-5 text-primary shrink-0" />
              <span className="font-bold text-white font-mono text-2xl tracking-wider flex-1 select-all">
                {activeOrder.phone}
              </span>
              <button onClick={() => copy(activeOrder.phone, "Numéro")} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* SMS area */}
          <div className="px-6 py-6">
            {isPending && (
              <div className="flex flex-col items-center text-center">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  <Smartphone className="absolute inset-0 m-auto w-6 h-6 text-primary" />
                </div>
                <p className="font-bold text-white text-lg mb-1">En attente du SMS…</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Entrez le numéro dans {activeOrder.serviceName} pour recevoir le code.
                </p>
                <Button variant="outline" size="sm" onClick={() => refetchSms()} className="border-white/20 text-white hover:bg-white/10">
                  <RefreshCw className="w-4 h-4 mr-2" /> Vérifier maintenant
                </Button>
              </div>
            )}

            {isSuccess && (
              <div className="flex flex-col items-center text-center">
                <CheckCircle2 className="w-14 h-14 text-green-400 mb-3" />
                <p className="font-bold text-white text-xl mb-4">SMS reçu !</p>
                <div className="flex items-center gap-4 bg-green-500/10 border border-green-500/30 rounded-2xl px-8 py-4 mb-4">
                  <span className="text-4xl font-bold text-green-400 font-mono tracking-widest select-all">
                    {activeOrder.smsCode}
                  </span>
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
                <AlertCircle className="w-14 h-14 text-red-400 mb-3" />
                <p className="font-bold text-white text-lg mb-1">Numéro expiré</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Essayez un autre pays ou un autre service.
                </p>
                <Button
                  className="bg-primary text-white hover:bg-primary/90"
                  onClick={() => { setActiveOrder(null); setStep("select"); setBuyCount(0); }}
                >
                  Réessayer
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP: SELECT — choose service + country
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Balance bar */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
        balance === 0 ? "bg-red-500/10 border-red-500/20 text-red-300"
        : balance < 1   ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-300"
        :                  "bg-green-500/10 border-green-500/20 text-green-300"
      }`}>
        <Wallet className="w-4 h-4 shrink-0" />
        <span>
          Solde 5SIM :&nbsp;
          <strong>
            {currency === "FCFA"
              ? `${Math.round(balance * 620).toLocaleString("fr-FR")} FCFA`
              : `$${balance.toFixed(2)}`}
          </strong>
          {balance === 0 && (
            <span className="ml-2">
              — Rechargez sur&nbsp;
              <a href="https://5sim.net" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
                5sim.net →
              </a>
            </span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Services */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-md p-4 flex flex-col" style={{ height: 560 }}>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">1</span>
              Choisir un service
            </h2>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Telegram, WhatsApp, Gmail…"
                className="pl-9 bg-black/20 border-white/10 text-white h-10 text-sm"
                value={searchService}
                onChange={(e) => setSearchService(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {isLoadingServices ? (
                <div className="flex justify-center items-center h-32"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : filteredServices.map((svc) => {
                const active = selectedService === svc.id;
                return (
                  <button
                    key={svc.id}
                    onClick={() => { setSelectedService(svc.id); setSelectedCountry(null); setSelectedOperator(null); setShowAll(false); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                      active ? "border-primary bg-primary/10 text-white" : "border-transparent bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <ServiceLogo icon={svc.icon} color={svc.color} name={svc.name} size={38} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{svc.name}</p>
                      <p className="text-xs opacity-60">{svc.category}</p>
                    </div>
                    {active && <ChevronRight className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Countries */}
        <div className="lg:col-span-7">
          <div
            className={`rounded-2xl border border-white/10 bg-card/40 backdrop-blur-md p-4 flex flex-col transition-opacity ${!selectedService ? "opacity-40 pointer-events-none" : ""}`}
            style={{ height: 560 }}
          >
            <div className="flex items-center justify-between mb-3 gap-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">2</span>
                Choisir un pays
              </h2>
              {selectedServiceInfo && (
                <div className="flex items-center gap-1.5 bg-black/20 rounded-lg px-2 py-1 border border-white/5 text-xs text-muted-foreground">
                  <ServiceLogo icon={selectedServiceInfo.icon} color={selectedServiceInfo.color} name={selectedServiceInfo.name} size={18} />
                  {selectedServiceInfo.name}
                </div>
              )}
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="France, Indonésie, Philippines…"
                className="pl-9 bg-black/20 border-white/10 text-white h-10 text-sm"
                value={searchCountry}
                onChange={(e) => setSearchCountry(e.target.value)}
                disabled={!selectedService}
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {!selectedService ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MapPin className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm">Sélectionnez d'abord un service</p>
                </div>
              ) : isLoadingCountries ? (
                <div className="flex justify-center items-center h-32"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : displayedCountries.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">Aucun pays disponible.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {displayedCountries.map((country) => {
                    const isSelected = selectedCountry === country.code;
                    const hasAvail = country.available > 0;
                    return (
                      <button
                        key={country.code}
                        onClick={() => { if (hasAvail) { setSelectedCountry(country.code); setSelectedOperator(null); } }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                          isSelected ? "border-primary bg-primary/10 text-white"
                          : hasAvail  ? "border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white cursor-pointer"
                          :             "border-white/5 bg-black/10 opacity-40 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-xl leading-none">{country.flag}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{country.name}</p>
                            <p className="text-[10px] opacity-60">
                              {hasAvail ? `${country.available.toLocaleString()} disponibles` : "Rupture de stock"}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-bold bg-black/30 px-2 py-0.5 rounded border border-white/5 shrink-0 ml-2">
                          {currency === "FCFA"
                            ? `${country.priceFcfa.toLocaleString("fr-FR")} F`
                            : `$${country.priceUsd.toFixed(2)}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedService && !isLoadingCountries && allCountries.length > availableCountries.length && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="mt-2 text-xs text-muted-foreground hover:text-white transition-colors text-center"
              >
                {showAll ? "Masquer les pays en rupture" : `+ Voir tous les pays (${allCountries.length - availableCountries.length} en rupture)`}
              </button>
            )}

            {/* Operators + Buy footer */}
            <AnimatePresence>
              {selectedCountry && selectedCountryInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-3 pt-3 border-t border-white/10 space-y-3"
                >
                  {/* Operator cards */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Zap className="w-3 h-3" /> Opérateur disponibles
                    </p>
                    {isLoadingOperators ? (
                      <div className="flex justify-center py-3">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : !operatorsData?.operators?.length ? (
                      <p className="text-xs text-muted-foreground py-2">Aucun opérateur disponible.</p>
                    ) : (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {operatorsData.operators.map((op: OperatorInfo) => {
                          const isOpSelected = selectedOperator === op.name;
                          return (
                            <button
                              key={op.name}
                              onClick={() => setSelectedOperator(op.name)}
                              className={`flex-shrink-0 flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all ${
                                isOpSelected
                                  ? "border-primary bg-primary/15 text-white"
                                  : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 mb-0.5">
                                {isOpSelected && <Check className="w-3 h-3 text-primary" />}
                                <span className="text-xs font-semibold capitalize">{op.label}</span>
                              </div>
                              <span className="font-bold text-sm">
                                {currency === "FCFA"
                                  ? `${op.priceFcfa.toLocaleString("fr-FR")} F`
                                  : `$${op.priceUsd.toFixed(2)}`}
                              </span>
                              <span className="text-[10px] opacity-60 flex items-center gap-0.5 mt-0.5">
                                <Users className="w-2.5 h-2.5" />
                                {op.available.toLocaleString()} dispo
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Buy summary + button */}
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Récapitulatif</p>
                      <p className="text-sm font-semibold text-white truncate">
                        {selectedServiceInfo?.name} · {selectedCountryInfo.flag} {selectedCountryInfo.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {selectedOperator && operatorsData?.operators && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Prix</p>
                          <p className="text-lg font-bold text-white">
                            {currency === "FCFA"
                              ? `${(operatorsData.operators.find((o: OperatorInfo) => o.name === selectedOperator)?.priceFcfa ?? selectedCountryInfo.priceFcfa).toLocaleString("fr-FR")} FCFA`
                              : `$${(operatorsData.operators.find((o: OperatorInfo) => o.name === selectedOperator)?.priceUsd ?? selectedCountryInfo.priceUsd).toFixed(2)}`}
                          </p>
                        </div>
                      )}
                      <Button
                        className="bg-primary hover:bg-primary/90 text-white font-bold px-5 h-11 rounded-xl shadow-lg shadow-primary/20"
                        onClick={handleGetNumber}
                        disabled={buyMutation.isPending || balance === 0 || !selectedOperator}
                      >
                        {buyMutation.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Phone className="w-4 h-4 mr-2" />
                            Obtenir un numéro
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
