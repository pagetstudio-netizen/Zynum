import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, Loader2, CheckCircle2, Copy, AlertCircle,
  RefreshCw, Lock, Phone, ArrowLeft, Wallet, ChevronRight
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
  useGetCurrentUser,
  useGetBalance,
  type Order,
} from "@workspace/api-client-react";

// ─── Service Logo component ───────────────────────────────────────────────────
function ServiceLogo({
  icon, color, name, size = 40,
}: { icon: string; color: string; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const dim = `${size}px`;
  const bg = color || "#1e293b";

  // Pick text color: snapchat/binance have light bg → dark text
  const lightBg = ["#FFFC00", "#F0B90B"].includes(color.toUpperCase());
  const textColor = lightBg ? "#000" : "#fff";

  return (
    <div
      style={{
        width: dim, height: dim, background: bg,
        borderRadius: size * 0.22, display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0, overflow: "hidden",
      }}
    >
      {!failed ? (
        <img
          src={icon}
          alt={name}
          style={{ width: size * 0.6, height: size * 0.6, objectFit: "contain" }}
          onError={() => setFailed(true)}
        />
      ) : (
        <span style={{ fontWeight: 700, fontSize: size * 0.38, color: textColor }}>
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

// ─── Status badge colors ──────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  PENDING:  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  RECEIVED: "bg-green-500/20 text-green-400 border-green-500/30",
  FINISHED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  TIMEOUT:  "bg-red-500/20 text-red-400 border-red-500/30",
  BANNED:   "bg-red-500/20 text-red-400 border-red-500/30",
  CANCELED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function BuyNumber() {
  const { currency, formatPrice } = useCurrency();
  const { toast } = useToast();

  const { data: user, isLoading: isUserLoading } = useGetCurrentUser({ query: { retry: false } });
  const { data: balanceData } = useGetBalance({ query: { enabled: !!user, retry: false } });

  const [searchService, setSearchService] = useState("");
  const [searchCountry, setSearchCountry] = useState("");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { data: servicesData, isLoading: isLoadingServices } = useGetServices();

  const { data: countriesData, isLoading: isLoadingCountries } = useGetCountries(
    { service: selectedService || undefined },
    { query: { enabled: !!selectedService } }
  );

  const buyMutation = useBuyNumber({
    mutation: {
      onSuccess: (data) => {
        setActiveOrder(data.order);
        toast({ title: "✅ Numéro obtenu !", description: "En attente du SMS…" });
      },
      onError: (error: any) => {
        const msg = error?.response?.data?.message || "";
        const isBalance = msg.toLowerCase().includes("balance") || msg.toLowerCase().includes("no free");
        toast({
          variant: "destructive",
          title: isBalance ? "Solde insuffisant" : "Achat échoué",
          description: isBalance
            ? "Votre solde 5SIM est insuffisant. Rechargez votre compte sur 5sim.net."
            : msg || "Impossible d'acheter le numéro. Réessayez.",
        });
      },
    },
  });

  const { data: smsData, refetch: refetchSms } = useCheckSms(activeOrder?.id || "", {
    query: {
      enabled: !!activeOrder && activeOrder.status === "PENDING",
      refetchInterval: (q) => {
        if (q.state.data?.order.status !== "PENDING") return false;
        return 5000;
      },
    },
  });

  useEffect(() => {
    if (!smsData?.order) return;
    setActiveOrder(smsData.order);
    if (smsData.order.status === "RECEIVED" || smsData.order.status === "FINISHED") {
      toast({ title: "📨 SMS reçu !", description: `Code : ${smsData.order.smsCode}` });
    } else if (smsData.order.status === "TIMEOUT" || smsData.order.status === "BANNED") {
      toast({ variant: "destructive", title: "Expiré", description: "Le numéro n'a pas reçu de SMS à temps." });
    }
  }, [smsData, toast]);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-card/60 border border-white/10 rounded-2xl flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Connexion requise</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Connectez-vous pour acheter des numéros virtuels.
        </p>
        <div className="flex gap-3">
          <Link href="/login"><Button className="bg-primary text-white">Se connecter</Button></Link>
          <Link href="/register"><Button variant="outline" className="border-white/20 text-white">Créer un compte</Button></Link>
        </div>
      </div>
    );
  }

  // ── Data prep ──────────────────────────────────────────────────────────────
  const balance = balanceData?.balance ?? 0;
  const balanceFcfa = Math.round(balance * 620);

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

  const handleBuy = () => {
    if (!selectedService || !selectedCountry) return;
    buyMutation.mutate({ data: { service: selectedService, country: selectedCountry, currency: currency as "USD" | "FCFA" } });
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copié !` });
  };

  // ── Active Order view ──────────────────────────────────────────────────────
  if (activeOrder) {
    const statusColor = STATUS_COLORS[activeOrder.status] ?? STATUS_COLORS.PENDING;
    const isPending = activeOrder.status === "PENDING";
    const isSuccess = activeOrder.status === "RECEIVED" || activeOrder.status === "FINISHED";
    const isFailed = ["TIMEOUT", "BANNED", "CANCELED"].includes(activeOrder.status);

    // Find service info for the logo
    const svc = servicesData?.services.find((s) => s.id === activeOrder.service);

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto"
      >
        <button
          onClick={() => { setActiveOrder(null); setSelectedCountry(null); }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Acheter un autre numéro
        </button>

        <div className="rounded-3xl border border-white/10 bg-card/60 backdrop-blur-xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div
            className="p-6 flex items-center gap-4 border-b border-white/10"
            style={{ background: svc ? `${svc.color}18` : "transparent" }}
          >
            {svc && (
              <ServiceLogo icon={svc.icon} color={svc.color} name={svc.name} size={48} />
            )}
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Service</p>
              <p className="font-bold text-white text-lg">{activeOrder.serviceName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Pays</p>
              <p className="font-semibold text-white">{activeOrder.countryName}</p>
            </div>
            <span className={`ml-4 text-xs px-2.5 py-1 rounded-full border font-semibold ${statusColor}`}>
              {activeOrder.status}
            </span>
          </div>

          {/* Phone number */}
          <div className="px-6 py-8 text-center border-b border-white/10">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Votre numéro virtuel</p>
            <div className="inline-flex items-center gap-4 bg-black/40 border border-white/10 px-6 py-4 rounded-2xl">
              <Phone className="w-5 h-5 text-primary shrink-0" />
              <span className="text-3xl font-bold text-white font-mono tracking-wider">
                {activeOrder.phone}
              </span>
              <button
                onClick={() => copy(activeOrder.phone, "Numéro")}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Prix payé : <strong className="text-white">{formatPrice(activeOrder.priceUsd, activeOrder.priceFcfa)}</strong>
            </p>
          </div>

          {/* SMS area */}
          <div className="p-6">
            {isPending && (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="relative w-14 h-14 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
                <p className="font-semibold text-white mb-1">En attente du SMS…</p>
                <p className="text-sm text-muted-foreground">Vérification automatique toutes les 5 secondes.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 border-white/20 text-white hover:bg-white/10"
                  onClick={() => refetchSms()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Vérifier maintenant
                </Button>
              </div>
            )}

            {isSuccess && (
              <div className="flex flex-col items-center py-4 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-400 mb-3" />
                <p className="font-bold text-white text-lg mb-3">SMS reçu !</p>
                <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 px-6 py-3 rounded-xl mb-3">
                  <span className="text-3xl font-bold text-green-400 font-mono tracking-widest">
                    {activeOrder.smsCode}
                  </span>
                  <button
                    onClick={() => copy(activeOrder.smsCode || "", "Code")}
                    className="p-1.5 hover:bg-green-500/20 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4 text-green-400" />
                  </button>
                </div>
                {activeOrder.smsText && (
                  <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-left w-full">
                    <p className="text-xs text-muted-foreground mb-1">Message complet :</p>
                    <p className="text-sm text-white font-mono">{activeOrder.smsText}</p>
                  </div>
                )}
              </div>
            )}

            {isFailed && (
              <div className="flex flex-col items-center py-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                <p className="font-bold text-white text-lg mb-1">
                  Commande {activeOrder.status.toLowerCase()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Le numéro n'a pas reçu de code. Essayez un autre pays.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Selection wizard ───────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Balance info bar */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
        balance === 0
          ? "bg-red-500/10 border-red-500/20 text-red-300"
          : balance < 1
          ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-300"
          : "bg-green-500/10 border-green-500/20 text-green-300"
      }`}>
        <Wallet className="w-4 h-4 shrink-0" />
        <span>
          Solde 5SIM :&nbsp;
          <strong>
            {currency === "FCFA"
              ? `${balanceFcfa.toLocaleString("fr-FR")} FCFA`
              : `$${balance.toFixed(2)}`}
          </strong>
          {balance === 0 && (
            <span className="ml-2">
              — Solde insuffisant.{" "}
              <a
                href="https://5sim.net"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                Recharger sur 5sim.net →
              </a>
            </span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ── Services column ─── */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-md p-4 flex flex-col h-[580px]">
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">1</span>
              Choisir un service
            </h2>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher… (ex : Telegram)"
                className="pl-9 bg-black/20 border-white/10 text-white h-10 text-sm"
                value={searchService}
                onChange={(e) => setSearchService(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {isLoadingServices ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Aucun service trouvé.</div>
              ) : (
                filteredServices.map((svc) => {
                  const active = selectedService === svc.id;
                  return (
                    <button
                      key={svc.id}
                      onClick={() => { setSelectedService(svc.id); setSelectedCountry(null); setShowAll(false); }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                        active
                          ? "border-primary bg-primary/10 text-white shadow-sm"
                          : "border-transparent bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <ServiceLogo icon={svc.icon} color={svc.color} name={svc.name} size={38} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{svc.name}</p>
                        <p className="text-xs opacity-60 truncate">{svc.category}</p>
                      </div>
                      {active && <ChevronRight className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Countries column ─── */}
        <div className="lg:col-span-7">
          <div
            className={`rounded-2xl border border-white/10 bg-card/40 backdrop-blur-md p-4 flex flex-col h-[580px] transition-opacity ${
              !selectedService ? "opacity-40 pointer-events-none" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-3 gap-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">2</span>
                Choisir un pays
              </h2>
              {selectedService && selectedServiceInfo && (
                <div className="flex items-center gap-2 bg-black/20 rounded-lg px-2 py-1 border border-white/5 text-xs text-muted-foreground">
                  <ServiceLogo icon={selectedServiceInfo.icon} color={selectedServiceInfo.color} name={selectedServiceInfo.name} size={18} />
                  {selectedServiceInfo.name}
                </div>
              )}
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un pays…"
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
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : displayedCountries.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Aucun pays disponible.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {displayedCountries.map((country) => {
                    const isSelected = selectedCountry === country.code;
                    const hasAvail = country.available > 0;
                    return (
                      <button
                        key={country.code}
                        onClick={() => setSelectedCountry(country.code)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                          isSelected
                            ? "border-primary bg-primary/10 text-white"
                            : hasAvail
                            ? "border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                            : "border-white/5 bg-black/10 text-muted-foreground/50 opacity-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-xl leading-none">{country.flag}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{country.name}</p>
                            <p className="text-[10px] opacity-60">
                              {hasAvail ? `${country.available.toLocaleString()} dispo` : "Rupture"}
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

            {/* Toggle show all */}
            {selectedService && !isLoadingCountries && availableCountries.length > 0 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="mt-2 text-xs text-muted-foreground hover:text-white transition-colors text-center"
              >
                {showAll
                  ? `Masquer les pays en rupture`
                  : `+ Afficher tous les pays (${allCountries.length - availableCountries.length} en rupture)`}
              </button>
            )}

            {/* Buy footer */}
            <AnimatePresence>
              {selectedCountry && selectedCountryInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-3 pt-3 border-t border-white/10"
                >
                  <div className="flex items-center justify-between gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Résumé</p>
                      <p className="text-sm font-semibold text-white">
                        {selectedServiceInfo?.name} — {selectedCountryInfo.flag} {selectedCountryInfo.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Prix</p>
                        <p className="text-lg font-bold text-white">
                          {currency === "FCFA"
                            ? `${selectedCountryInfo.priceFcfa.toLocaleString("fr-FR")} FCFA`
                            : `$${selectedCountryInfo.priceUsd.toFixed(2)}`}
                        </p>
                      </div>
                      <Button
                        className="bg-primary hover:bg-primary/90 text-white font-bold px-5 h-11 rounded-xl shadow-lg shadow-primary/20"
                        onClick={handleBuy}
                        disabled={buyMutation.isPending || balance === 0}
                      >
                        {buyMutation.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          "Acheter"
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
