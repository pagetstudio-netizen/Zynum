import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  LayoutDashboard, ShoppingCart, History, User, LogOut,
  Wallet, Package, TrendingUp, ChevronRight,
  Check, Menu, X, Shield, HelpCircle, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/use-currency";
import {
  useGetCurrentUser, useLogoutUser, useGetBalance,
  useGetOrderHistory,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import BuyNumber from "./buy";
import OrderHistory from "./history";

type Tab = "overview" | "buy" | "history" | "profile";

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
    <div className="rounded-2xl border border-white/10 p-5 bg-card/40 backdrop-blur-md flex items-start gap-4">
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
  const received = orders.filter((o) => o.status === "RECEIVED" || o.status === "FINISHED").length;
  const spent = orders.reduce((sum, o) => sum + o.priceUsd, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          icon={<Wallet className="w-6 h-6 text-primary" />}
          label="Solde 5SIM"
          value={currency === "FCFA" ? `${Math.round(balance * 620).toLocaleString()} FCFA` : `$${balance.toFixed(2)}`}
          sub={balance === 0 ? "Rechargez sur 5sim.net" : "Disponible"}
          color="bg-primary/20"
        />
        <StatCard
          icon={<Package className="w-6 h-6 text-blue-400" />}
          label="Commandes totales"
          value={history?.total ?? 0}
          sub="Depuis votre inscription"
          color="bg-blue-500/20"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-green-400" />}
          label="SMS reçus"
          value={received}
          sub={`$${spent.toFixed(2)} dépensés au total`}
          color="bg-green-500/20"
        />
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="font-semibold text-white text-sm">Commandes récentes</h3>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("zynum:tab", { detail: "history" }))}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            Voir tout <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {orders.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
            Aucune commande pour le moment
            <div className="mt-4">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("zynum:tab", { detail: "buy" }))}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Acheter un numéro →
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{order.serviceName}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{order.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {order.smsCode && (
                    <span className="text-xs font-mono font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded">
                      {order.smsCode}
                    </span>
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${STATUS_COLORS[order.status] ?? STATUS_COLORS.CANCELED}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("zynum:tab", { detail: "buy" }))}
          className="rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 p-5 flex items-center gap-4 text-left transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-white">Acheter un numéro</p>
            <p className="text-xs text-muted-foreground">180+ pays disponibles</p>
          </div>
          <ChevronRight className="w-4 h-4 text-primary ml-auto group-hover:translate-x-1 transition-transform" />
        </button>

        <Link href="/aide" className="rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] p-5 flex items-center gap-4 text-left transition-all group">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-white">Centre d'aide</p>
            <p className="text-xs text-muted-foreground">Guides et tutoriels</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

function Profile({ user }: { user: { id: number; name: string; email: string; createdAt: string } }) {
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

      {/* Security */}
      <div className="rounded-2xl border border-white/10 bg-card/40 p-6 space-y-3">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-green-400" />
          <h3 className="font-semibold text-white">Sécurité</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Votre compte est protégé par un mot de passe chiffré (bcrypt). Ne partagez jamais vos identifiants.
        </p>
        <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
          <Check className="w-3 h-3" /> Compte sécurisé
        </div>
      </div>

      {/* Help */}
      <div className="rounded-2xl border border-white/10 bg-card/40 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-white">Besoin d'aide ?</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Consultez notre centre d'aide ou contactez notre support directement.
        </p>
        <div className="flex gap-3">
          <Link href="/aide">
            <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
              <HelpCircle className="w-4 h-4 mr-2" /> Centre d'aide
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">
              <MessageSquare className="w-4 h-4 mr-2" /> Contacter le support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(222, 47%, 5%)" }}>
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const NAV = [
    { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
    { id: "buy",      label: "Acheter numéro",  icon: ShoppingCart },
    { id: "history",  label: "Historique",      icon: History },
    { id: "profile",  label: "Mon profil",       icon: User },
  ] as const;

  const formatPrice = (v: number) =>
    currency === "FCFA" ? `${Math.round(v * 620).toLocaleString()} FCFA` : `$${v.toFixed(2)}`;

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(222, 47%, 5%)" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 border-r border-white/[0.06] backdrop-blur-xl
        flex flex-col transition-transform duration-300
        lg:static lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `} style={{ background: "hsl(222, 47%, 7%)" }}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-500 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-primary/30">Z</div>
            <span className="font-bold text-white text-lg">ZyNum</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-b border-white/[0.06]">
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

          {/* Separator */}
          <div className="pt-3 mt-3 border-t border-white/[0.06] space-y-1">
            <Link
              href="/aide"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-all"
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              Centre d'aide
            </Link>
            <Link
              href="/contact"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-all"
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              Contacter le support
            </Link>
          </div>
        </nav>

        {/* Currency toggle */}
        <div className="px-4 py-3 border-t border-white/[0.06]">
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
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <button
            onClick={() => logoutMutation.mutate({})}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            {logoutMutation.isPending ? "Déconnexion…" : "Déconnexion"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 backdrop-blur-md border-b border-white/[0.06]" style={{ background: "hsl(222, 47%, 5%)/80" }}>
          <button className="lg:hidden text-muted-foreground hover:text-white p-1" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-white">
              {NAV.find((n) => n.id === activeTab)?.label ?? "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/aide" className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors" title="Centre d'aide">
              <HelpCircle className="w-4 h-4" />
            </Link>
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
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
              {activeTab === "profile"  && <Profile user={user} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
