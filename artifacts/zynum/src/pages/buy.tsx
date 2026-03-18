import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Smartphone, CreditCard, Loader2, CheckCircle2, Copy, AlertCircle, RefreshCw, Lock } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  useGetServices, 
  useGetCountries, 
  useBuyNumber, 
  useCheckSms,
  useGetCurrentUser,
  type Order
} from "@workspace/api-client-react";

export default function BuyNumber() {
  const [location, setLocation] = useLocation();
  const { currency, formatPrice } = useCurrency();
  const { toast } = useToast();

  const { data: user, isLoading: isUserLoading } = useGetCurrentUser({ query: { retry: false } });

  const [searchService, setSearchService] = useState("");
  const [searchCountry, setSearchCountry] = useState("");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const { data: servicesData, isLoading: isLoadingServices } = useGetServices();
  
  const { data: countriesData, isLoading: isLoadingCountries } = useGetCountries(
    { service: selectedService || undefined },
    { query: { enabled: !!selectedService } }
  );

  const buyMutation = useBuyNumber({
    mutation: {
      onSuccess: (data) => {
        setActiveOrder(data.order);
        toast({ title: "Number purchased successfully!", description: "Waiting for SMS..." });
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Purchase failed",
          description: error?.response?.data?.message || "Could not buy number. Please check your balance.",
        });
      }
    }
  });

  // Polling for SMS status
  const { data: smsData, refetch: refetchSms } = useCheckSms(activeOrder?.id || "", {
    query: {
      enabled: !!activeOrder && activeOrder.status === 'PENDING',
      refetchInterval: (query) => {
        // Stop polling if status changes from PENDING
        if (query.state.data && query.state.data.order.status !== 'PENDING') return false;
        return 5000; // Poll every 5 seconds
      }
    }
  });

  // Update active order when polling returns new data
  useEffect(() => {
    if (smsData && smsData.order) {
      setActiveOrder(smsData.order);
      if (smsData.order.status === 'RECEIVED' || smsData.order.status === 'FINISHED') {
        toast({
          title: "SMS Received!",
          description: `Code: ${smsData.order.smsCode}`,
        });
      } else if (smsData.order.status === 'TIMEOUT' || smsData.order.status === 'BANNED') {
        toast({
          variant: "destructive",
          title: "Order expired or banned",
          description: "The number did not receive an SMS in time.",
        });
      }
    }
  }, [smsData, toast]);


  if (isUserLoading) {
    return <div className="flex-1 flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mb-6 border border-white/10">
          <Lock className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-display font-bold text-white mb-4">Authentication Required</h2>
        <p className="text-muted-foreground max-w-md mb-8">You need to log in or create an account to purchase virtual numbers.</p>
        <div className="flex gap-4">
          <Link href="/login"><Button className="bg-primary hover:bg-primary/90 text-white">Log In</Button></Link>
          <Link href="/register"><Button variant="outline" className="border-white/20 text-white">Create Account</Button></Link>
        </div>
      </div>
    );
  }

  const filteredServices = servicesData?.services.filter(s => 
    s.name.toLowerCase().includes(searchService.toLowerCase())
  ) || [];

  const filteredCountries = countriesData?.countries.filter(c => 
    c.name.toLowerCase().includes(searchCountry.toLowerCase()) && c.available > 0
  ) || [];

  const handleBuy = () => {
    if (!selectedService || !selectedCountry) return;
    buyMutation.mutate({
      data: {
        service: selectedService,
        country: selectedCountry,
        currency: currency as "USD" | "FCFA"
      }
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">Buy Virtual Number</h1>
        <p className="text-muted-foreground mt-2">Select a service and country to get started instantly.</p>
      </div>

      <AnimatePresence mode="wait">
        {activeOrder ? (
          <motion.div 
            key="active-order"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-card border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl overflow-hidden relative">
              {/* Animated bg blob */}
              <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] pointer-events-none opacity-20 ${
                activeOrder.status === 'PENDING' ? 'bg-yellow-500' : 
                activeOrder.status === 'RECEIVED' ? 'bg-green-500' : 
                activeOrder.status === 'TIMEOUT' ? 'bg-red-500' : 'bg-primary'
              }`} />

              <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Service</h3>
                  <div className="flex items-center gap-2 text-white font-medium text-lg">
                    {activeOrder.serviceName}
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Country</h3>
                  <div className="flex items-center gap-2 text-white font-medium text-lg justify-end">
                    {activeOrder.countryName}
                  </div>
                </div>
              </div>

              <div className="text-center mb-10">
                <p className="text-sm text-muted-foreground mb-3">Your Virtual Number</p>
                <div className="inline-flex items-center gap-4 bg-black/40 border border-white/10 px-6 py-4 rounded-2xl">
                  <span className="text-3xl md:text-4xl font-display font-bold text-white tracking-wider">{activeOrder.phone}</span>
                  <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-full" onClick={() => copyToClipboard(activeOrder.phone, 'Phone number')}>
                    <Copy className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              <div className="bg-black/20 rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center min-h-[160px]">
                {activeOrder.status === 'PENDING' && (
                  <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
                    <div className="relative w-16 h-16 mb-4">
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                      <Smartphone className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-1">Waiting for SMS...</h4>
                    <p className="text-sm text-muted-foreground">We are polling automatically. Usually takes less than a minute.</p>
                  </div>
                )}

                {(activeOrder.status === 'RECEIVED' || activeOrder.status === 'FINISHED') && (
                  <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4 border border-green-500/30">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">SMS Code Received</h4>
                    <div className="bg-white/10 px-6 py-3 rounded-xl border border-white/20 flex items-center gap-4">
                      <span className="text-3xl font-display font-bold text-white tracking-widest">{activeOrder.smsCode}</span>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(activeOrder.smsCode || '', 'SMS Code')} className="h-8 hover:bg-white/10 text-white">
                        Copy
                      </Button>
                    </div>
                    {activeOrder.smsText && (
                      <p className="mt-4 text-sm text-muted-foreground bg-black/40 p-3 rounded-lg w-full text-left font-mono">
                        {activeOrder.smsText}
                      </p>
                    )}
                  </div>
                )}

                {(activeOrder.status === 'TIMEOUT' || activeOrder.status === 'BANNED' || activeOrder.status === 'CANCELED') && (
                  <div className="flex flex-col items-center text-center animate-in fade-in duration-500">
                    <div className="w-16 h-16 bg-destructive/20 text-destructive rounded-full flex items-center justify-center mb-4 border border-destructive/30">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-1">Order {activeOrder.status.toLowerCase()}</h4>
                    <p className="text-sm text-muted-foreground">The number did not receive a code. Your balance has been refunded.</p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-4">
                <Button 
                  variant="outline" 
                  className="w-full border-white/10 hover:bg-white/5 text-white"
                  onClick={() => {
                    setActiveOrder(null);
                    setSelectedCountry(null); // Reset to pick another
                  }}
                >
                  Buy Another Number
                </Button>
                {activeOrder.status === 'PENDING' && (
                  <Button 
                    variant="secondary" 
                    className="w-full bg-secondary hover:bg-secondary/80 text-white"
                    onClick={() => refetchSms()}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Force Check
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="selection-wizard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left Column: Services */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-card border border-white/10 rounded-2xl p-5 flex flex-col h-[600px] shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs">1</span>
                  Select Service
                </h2>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search services (e.g. Telegram)" 
                    className="pl-9 bg-black/20 border-white/10 text-white h-11"
                    value={searchService}
                    onChange={(e) => setSearchService(e.target.value)}
                  />
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {isLoadingServices ? (
                    <div className="flex justify-center items-center h-32"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                  ) : filteredServices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">No services found.</div>
                  ) : (
                    filteredServices.map(service => (
                      <button
                        key={service.id}
                        onClick={() => { setSelectedService(service.id); setSelectedCountry(null); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                          selectedService === service.id 
                            ? "bg-primary/10 border-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                            : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-black/30 flex items-center justify-center flex-shrink-0">
                          {service.icon ? (
                            <img src={service.icon} alt={service.name} className="w-6 h-6 object-contain opacity-80" onError={(e) => (e.currentTarget.style.display='none')} />
                          ) : (
                            <span className="font-bold text-sm">{service.name.substring(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="font-medium truncate">{service.name}</div>
                          <div className="text-xs opacity-60 truncate">{service.category}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Countries */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className={`bg-card border border-white/10 rounded-2xl p-5 flex flex-col h-[600px] shadow-lg transition-opacity duration-300 ${!selectedService ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs">2</span>
                    Select Country
                  </h2>
                  {selectedService && (
                    <div className="text-sm px-3 py-1.5 bg-black/30 rounded-lg border border-white/5 flex items-center text-muted-foreground">
                      Service: <strong className="text-white ml-1">{servicesData?.services.find(s => s.id === selectedService)?.name}</strong>
                    </div>
                  )}
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search countries..." 
                    className="pl-9 bg-black/20 border-white/10 text-white h-11"
                    value={searchCountry}
                    onChange={(e) => setSearchCountry(e.target.value)}
                    disabled={!selectedService}
                  />
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {!selectedService ? (
                    <div className="flex flex-col justify-center items-center h-full text-muted-foreground">
                      <MapPin className="w-12 h-12 mb-4 opacity-20" />
                      <p>Select a service first to see available countries.</p>
                    </div>
                  ) : isLoadingCountries ? (
                    <div className="flex justify-center items-center h-32"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                  ) : filteredCountries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">No countries available for this service.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredCountries.map(country => (
                        <button
                          key={country.code}
                          onClick={() => setSelectedCountry(country.code)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                            selectedCountry === country.code 
                              ? "bg-primary/10 border-primary text-white shadow-sm" 
                              : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/10 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <span className="text-2xl leading-none">{country.flag}</span>
                            <div className="flex flex-col items-start truncate">
                              <span className="font-medium text-sm truncate w-full text-left">{country.name}</span>
                              <span className="text-[10px] opacity-70">{country.available} available</span>
                            </div>
                          </div>
                          <div className="font-mono text-sm font-semibold bg-black/30 px-2 py-1 rounded border border-white/5 shrink-0">
                            {formatPrice(country.priceUsd, country.priceFcfa)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Buy Action Footer */}
                <div className={`mt-4 pt-4 border-t border-white/10 transition-all duration-300 ${selectedCountry ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-primary/5 rounded-xl p-4 border border-primary/20">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Order Summary</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{servicesData?.services.find(s => s.id === selectedService)?.name}</span>
                        <span className="text-muted-foreground text-sm">in</span>
                        <span className="text-white font-medium">{countriesData?.countries.find(c => c.code === selectedCountry)?.name}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="text-right flex-1 sm:flex-initial">
                        <div className="text-xs text-muted-foreground mb-1">Total Price</div>
                        <div className="text-2xl font-display font-bold text-white">
                          {selectedCountry && formatPrice(
                            countriesData?.countries.find(c => c.code === selectedCountry)?.priceUsd || 0,
                            countriesData?.countries.find(c => c.code === selectedCountry)?.priceFcfa || 0
                          )}
                        </div>
                      </div>
                      <Button 
                        size="lg"
                        className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 h-14 px-8 rounded-xl text-lg flex-shrink-0"
                        onClick={handleBuy}
                        disabled={buyMutation.isPending}
                      >
                        {buyMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buy Now'}
                      </Button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
