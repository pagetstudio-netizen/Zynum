import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  LayoutDashboard, ShoppingCart, History, Code2, User, LogOut,
  Wallet, Package, TrendingUp, ChevronRight, Copy, RefreshCw,
  Check, Menu, X, Bell, Shield, Key
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/use-currency";
import {
  useGetCurrentUser, useLogoutUser, useGetBalance,
  useGetOrderHistory, useGetDeveloperApiKey, useRegenerateDeveloperApiKey,
  getGetDeveloperApiKeyQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import BuyNumber from "./buy";
import OrderHistory from "./history";
import ApiDocs from "./api-docs";

type Tab = "overview" | "buy" | "history" | "api" | "profile";

const STATUS_COLORS: Record<string, string> = {
  PENDING:  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  RECEIVED: "bg-green-500/20 text-green-400 border-green-500/30",
  FINISHED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  TIMEOUT:  "bg-gray-500/20 text-gray-400 border-gray-500/30",
  BANNED:   "bg-red-500/20 text-red-400 border-red-500/30",
  CANCELED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; color?: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/10 p-5 bg-card/40 backdrop-blur-md flex items-start gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color ?? "bg-primary/20"}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function Overview({ currency, formatPrice }: { currency: string; formatPrice: (v: number) => string }) {
  const { data: balanceData } = useGetBalance({ query: { retry: false } });
  const { data: history } = useGetOrderHistory(
    { page: 1, limit: 5 },
    { query: { retry: false } }
  );

  const balance = balanceData?.balance ?? 0;
  const orders = history?.orders ?? [];
  const total = history?.total ?? 0;
  const received = orders.filter(o => o.status === "RECEIVED" || o.status === "FINISHED").length;

  const balanceDisplay = currency === "FCFA"
    ? `${Math.round(balance * 620).toLocaleString("fr-FR")} FCFA`
    : `$${balance.toFixed(2)}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Vue d'ensemble</h2>
        <p className="text-muted-foreground text-sm">Tableau de bord de votre compte ZyNum</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<Wallet className="w-6 h-6 text-primary" />}
          label="Solde 5SIM"
          value={balanceDisplay}
          sub={balanceData?.isLow ? "⚠️ Solde faible — recharger" : "Actif"}
          color="bg-primary/10"
        />
        <StatCard
          icon={<Package className="w-6 h-6 text-green-400" />}
          label="Commandes totales"
          value={total}
          sub="Historique complet"
          color="bg-green-500/10"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-blue-400" />}
          label="SMS reçus (5 dern.)"
          value={received}
          sub={`sur ${orders.length} récentes`}
          color="bg-blue-500/10"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("zynum:tab", { detail: "buy" }))}
          className="rounded-xl border border-white/10 bg-card/40 p-4 text-left hover:bg-card/60 transition-colors group"
        >
          <ShoppingCart className="w-6 h-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
          <p className="font-semibold text-white text-sm">Acheter un numéro</p>
          <p className="text-xs text-muted-foreground mt-0.5">Telegram, WhatsApp, Gmail…</p>
        </button>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("zynum:tab", { detail: "history" }))}
          className="rounded-xl border border-white/10 bg-card/40 p-4 text-left hover:bg-card/60 transition-colors group"
        >
          <History className="w-6 h-6 text-accent mb-2 group-hover:scale-110 transition-transform" />
          <p className="font-semibold text-white text-sm">Voir l'historique</p>
          <p className="text-xs text-muted-foreground mt-0.5">Codes OTP reçus</p>
        </button>
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="font-semibold text-white">Commandes récentes</h3>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("zynum:tab", { detail: "history" }))}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Tout voir <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {orders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Aucune commande pour l'instant
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors">
                <div>
                  <p className="text-sm font-medium text-white">{order.serviceName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{order.phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  {order.smsCode && (
                    <span className="font-mono text-green-400 font-bold text-sm bg-green-500/10 px-2 py-0.5 rounded">
                      {order.smsCode}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[order.status] ?? STATUS_COLORS.PENDING}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Profile({ user }: { user: { id: number; name: string; email: string; createdAt: string } }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: apiData } = useGetDeveloperApiKey({ query: { retry: false } });
  const regenMutation = useRegenerateDeveloperApiKey({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDeveloperApiKeyQueryKey() });
        toast({ title: "Clé API régénérée avec succès" });
      },
    },
  });

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Clé API copiée !" });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Mon profil</h2>
        <p className="text-muted-foreground text-sm">Gérez votre compte et vos paramètres</p>
      </div>

      {/* User Info */}
      <div className="rounded-2xl border border-white/10 bg-card/40 p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-bold text-white">{user.name}</p>
            <p className="text-muted-foreground text-sm">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Membre depuis {format(new Date(user.createdAt), "MMMM yyyy")}
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 pt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Nom complet</p>
            <p className="text-white font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Email</p>
            <p className="text-white font-medium">{user.email}</p>
          </div>
        </div>
      </div>

      {/* API Key */}
      <div className="rounded-2xl border border-white/10 bg-card/40 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Key className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-white">Clé API développeur</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Utilisez cette clé pour intégrer ZyNum dans vos applications.
        </p>
        {apiData?.apiKey ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 font-mono text-xs text-muted-foreground truncate">
              {apiData.apiKey}
            </div>
            <Button size="sm" variant="outline" className="shrink-0" onClick={() => copyKey(apiData.apiKey)}>
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button size="sm" variant="outline" className="shrink-0" onClick={() => regenMutation.mutate({})}>
              <RefreshCw className={`w-4 h-4 ${regenMutation.isPending ? "animate-spin" : ""}`} />
            </Button>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Chargement…</div>
        )}
      </div>

      {/* Security */}
      <div className="rounded-2xl border border-white/10 bg-card/40 p-6 space-y-3">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-green-400" />
          <h3 className="font-semibold text-white">Sécurité</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Votre compte est protégé par un mot de passe chiffré. Ne partagez jamais votre clé API.
        </p>
        <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
          <Check className="w-3 h-3" /> Compte sécurisé
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  const { currency, setCurrency } = useCurrency();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useGetCurrentUser({ query: { retry: false } });
  const logoutMutation = useLogoutUser({
    mutation: {
      onSuccess: () => {
        localStorage.removeItem("zynum_token");
        queryClient.clear();
        setLocation("/");
        toast({ title: "Déconnecté avec succès" });
      },
    },
  });

  // Listen for tab changes from child components
  React.useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent).detail as Tab;
      setActiveTab(tab);
    };
    window.addEventListener("zynum:tab", handler);
    return () => window.removeEventListener("zynum:tab", handler);
  }, []);

  React.useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [isLoading, user, setLocation]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const NAV = [
    { id: "overview",  label: "Vue d'ensemble", icon: LayoutDashboard },
    { id: "buy",       label: "Acheter numéro",  icon: ShoppingCart },
    { id: "history",   label: "Historique",      icon: History },
    { id: "api",       label: "API Docs",         icon: Code2 },
    { id: "profile",   label: "Mon profil",       icon: User },
  ] as const;

  const formatPrice = (v: number) =>
    currency === "FCFA" ? `${Math.round(v * 620).toLocaleString()} FCFA` : `$${v.toFixed(2)}`;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-card/80 border-r border-white/10 backdrop-blur-xl
          flex flex-col transition-transform duration-300
          lg:static lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-white text-sm">Z</div>
            <span className="font-bold text-white text-lg">ZyNum</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center font-bold text-primary text-sm shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${active
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"}
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Currency toggle */}
        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex bg-black/30 rounded-lg p-1 gap-1">
            {(["USD", "FCFA"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${
                  currency === c ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-white/10">
          <button
            onClick={() => logoutMutation.mutate({})}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            {logoutMutation.isPending ? "Déconnexion…" : "Déconnexion"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-white/10">
          <button
            className="lg:hidden text-muted-foreground hover:text-white p-1"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-white capitalize">
              {NAV.find(n => n.id === activeTab)?.label ?? "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "overview" && <Overview currency={currency} formatPrice={formatPrice} />}
              {activeTab === "buy"      && <BuyNumber />}
              {activeTab === "history"  && <OrderHistory />}
              {activeTab === "api"      && <ApiDocs />}
              {activeTab === "profile"  && <Profile user={user} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
