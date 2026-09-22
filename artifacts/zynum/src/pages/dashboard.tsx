import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  LogOut, ShoppingCart, HelpCircle,
  User, PlusCircle,
  Package, ChevronRight,
  Check, Menu, X, Shield,
  Eye, EyeOff, Lock, KeyRound, Globe2,
  LayoutDashboard, History, WalletCards, UsersRound, MessageSquare,
} from "lucide-react";
import iconCardSolde   from "@assets/internet_15229770_1774888657109.png";
import iconAchat       from "@assets/freepik__icônes_produits_ou_achat_1774888657188.png";
import iconProfile   from "@assets/avatar.227e595e234f4d53f478_1774828482017.png";
import iconEmpty     from "@assets/no_1774828481941.png";
import iconAffiliateStats from "@assets/statss_1790062014731.png";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/use-currency";
import {
  useGetCurrentUser, useLogoutUser, useGetBalance,
  useGetOrderHistory,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  usePublicSettings,
  WHATSAPP_SUPPORT_NUMBER,
  openWhatsAppSupport,
} from "@/hooks/use-public-settings";
import BuyNumber from "./buy";
import OrderHistory from "./history";
import Recharge from "./recharge";
import AdminPanel from "./admin";
import AffiliatePage from "./affiliate";
import ProfilePage from "./profile";
import "./dashboard-reference.css";

type Tab = "overview" | "buy" | "history" | "recharge" | "profile" | "affiliate" | "admin";
type UserWithAdmin = { id: number; name: string; email: string; isAdmin?: boolean; isBanned?: boolean; createdAt: string };
type DashboardNavItem = {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  RECEIVED: "bg-green-500/20 text-green-400 border-green-500/30",
  FINISHED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  TIMEOUT:  "bg-gray-500/20 text-gray-400 border-gray-500/30",
  BANNED:   "bg-red-500/20 text-red-400 border-red-500/30",
  CANCELED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};


function Overview({ currency }: { currency: string }) {
  const { data: balanceData } = useGetBalance({ query: { retry: false } });
  const { data: history } = useGetOrderHistory(
    { page: 1, limit: 5 },
    { query: { retry: false } }
  );
  const { t } = useLanguage();

  const balance = balanceData?.balance ?? 0;
  const orders = history?.orders ?? [];

  return (
    <div className="zynum-overview">
      <div className="zynum-stats">
        <div className="zynum-stat-card">
          <h2>{t("dash_balance")}</h2>
          <div className="zynum-stat-value-row">
            <div className="zynum-stat-icon">
              <img src={iconCardSolde} alt="Solde" />
            </div>
            <p>{currency === "FCFA" ? `${Math.round(balance * 620).toLocaleString()} FCFA` : `$${balance.toFixed(2)}`}</p>
          </div>
        </div>

        <div className="zynum-stat-card">
          <h2>{t("dash_orders_total")}</h2>
          <div className="zynum-stat-value-row zynum-orders-row">
            <div className="zynum-stat-icon">
              <img src={iconAchat} alt="Commandes" />
            </div>
            <p>{history?.total ?? 0}</p>
            <button
              type="button"
              className="zynum-buy-number-button"
              onClick={() => window.dispatchEvent(new CustomEvent("zynum:tab", { detail: "buy" }))}
            >
              obtenez un numéro
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="zynum-affiliate-banner"
        onClick={() => window.dispatchEvent(new CustomEvent("zynum:tab", { detail: "affiliate" }))}
      >
        <span className="zynum-affiliate-icon">
          <img src={iconAffiliateStats} alt="" />
        </span>
        <span className="zynum-affiliate-copy">
          Partagez votre lien unique<br />
          et obtenez 10% sur chaque<br />
          dépôt de vos filleuls.
        </span>
        <span className="zynum-affiliate-button">allez</span>
      </button>

      <div className="zynum-recent-card">
        <div className="zynum-recent-header">
          <h3>{t("dash_recent_orders")}</h3>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("zynum:tab", { detail: "history" }))}
          >
            {t("dash_view_all")} <ChevronRight />
          </button>
        </div>
        {orders.length === 0 ? (
          <div className="zynum-recent-empty">
            <img src={iconEmpty} alt="Aucune commande" />
            <p className="text-gray-500">{t("dash_no_orders")}</p>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("zynum:tab", { detail: "buy" }))}
              className="mt-4 inline-flex items-center gap-1.5 text-primary text-sm font-semibold bg-primary/5 px-4 py-2 rounded-xl"
            >
              <ShoppingCart className="w-4 h-4" /> {t("dash_buy_action")}
            </button>
          </div>
        ) : (
          <div className="zynum-recent-list">
            {orders.map((order) => {
              const STATUS_LIGHT: Record<string, string> = {
                PENDING:  "bg-yellow-50 text-yellow-700 border-yellow-200",
                RECEIVED: "bg-green-50 text-green-700 border-green-200",
                FINISHED: "bg-green-50 text-green-700 border-green-200",
                TIMEOUT:  "bg-gray-100 text-gray-500 border-gray-200",
                BANNED:   "bg-red-50 text-red-700 border-red-200",
                CANCELED: "bg-gray-100 text-gray-500 border-gray-200",
              };
              return (
                <div key={order.id} className="zynum-recent-row">
                  <div className="zynum-order-meta">
                    <div className="zynum-order-icon">
                      <Package />
                    </div>
                    <div className="min-w-0">
                      <p>{order.serviceName}</p>
                      <span>{order.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {order.smsCode && (
                      <span className="text-xs font-mono font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-lg">
                        {order.smsCode}
                      </span>
                    )}
                    <span className={`zynum-status-badge ${STATUS_LIGHT[order.status] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-4 pr-12 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition shadow-sm"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function Profile({ user }: { user: { id: number; name: string; email: string; createdAt: string } }) {
  const { toast } = useToast();
  const { lang, setLang, t } = useLanguage();
  const { settings: publicSettings } = usePublicSettings();
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd]         = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 8) {
      toast({ variant: "destructive", title: "Mot de passe trop court", description: "Au moins 8 caractères requis." });
      return;
    }
    if (newPwd !== confirmPwd) {
      toast({ variant: "destructive", title: "Mots de passe différents", description: "Le nouveau mot de passe et la confirmation ne correspondent pas." });
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("zynum_token");
      const res = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur inconnue");
      setSuccess(true);
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      toast({ title: "Mot de passe modifié !", description: "Votre mot de passe a été mis à jour avec succès." });
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Échec", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{t("profile_title")}</h2>
        <p className="text-gray-500 text-sm">{t("profile_sub")}</p>
      </div>

      {/* User Info */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-primary flex items-center justify-center text-2xl font-bold text-white">
            {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{user.name}</p>
            <p className="text-gray-500 text-sm">{user.email}</p>
            <p className="text-xs text-gray-400 mt-1">
              {t("profile_member_since")} {format(new Date(user.createdAt), "MMMM yyyy")}
            </p>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 mb-1">{t("profile_full_name")}</p>
            <p className="text-gray-900 font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">{t("profile_email")}</p>
            <p className="text-gray-900 font-medium">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <KeyRound className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{t("profile_change_pwd")}</h3>
            <p className="text-xs text-gray-500">{t("profile_change_pwd_sub")}</p>
          </div>
        </div>

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-3"
          >
            <Check className="w-4 h-4 shrink-0" />
            {t("profile_pwd_updated")}
          </motion.div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 font-semibold mb-1.5 block">{t("profile_current_pwd")}</label>
            <PasswordInput value={currentPwd} onChange={setCurrentPwd} placeholder="••••••••" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-semibold mb-1.5 block">{t("profile_new_pwd")}</label>
            <PasswordInput value={newPwd} onChange={setNewPwd} placeholder={t("profile_min_chars")} />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-semibold mb-1.5 block">{t("profile_confirm_pwd")}</label>
            <PasswordInput value={confirmPwd} onChange={setConfirmPwd} placeholder={t("profile_repeat_pwd")} />
          </div>

          {/* Password strength indicator */}
          {newPwd.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => {
                  const strength = Math.min(4, Math.floor(
                    (newPwd.length >= 8 ? 1 : 0) +
                    (/[A-Z]/.test(newPwd) ? 1 : 0) +
                    (/[0-9]/.test(newPwd) ? 1 : 0) +
                    (/[^A-Za-z0-9]/.test(newPwd) ? 1 : 0)
                  ));
                  return (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i < strength
                        ? strength <= 1 ? "bg-red-500"
                        : strength <= 2 ? "bg-yellow-500"
                        : strength <= 3 ? "bg-blue-500"
                        : "bg-green-500"
                        : "bg-gray-200"
                    }`} />
                  );
                })}
              </div>
              <p className="text-[11px] text-gray-400">
                {newPwd.length < 8 ? t("profile_pwd_short") :
                 !/[A-Z]/.test(newPwd) ? t("profile_pwd_uppercase") :
                 !/[0-9]/.test(newPwd) ? t("profile_pwd_number") :
                 t("profile_pwd_strong")}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !currentPwd || !newPwd || !confirmPwd}
            className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t("profile_updating")}</span>
            ) : (
              <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> {t("profile_update_pwd")}</span>
            )}
          </Button>
        </form>
      </div>

      {/* Security info */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 flex items-center gap-4 shadow-sm">
        <Shield className="w-8 h-8 text-green-500 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 mb-0.5">{t("profile_secure")}</p>
          <p className="text-xs text-gray-500">{t("profile_secure_desc")}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-3 py-1 shrink-0">
          <Check className="w-3 h-3" /> {t("profile_active")}
        </div>
      </div>

      {/* Language selector */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Globe2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{t("profile_language")}</p>
            <p className="text-xs text-gray-500">{t("profile_language_sub")}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {(["fr", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                lang === l
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                  : "text-gray-500 border-gray-200 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {l === "fr" ? "🇫🇷 Français" : "🇬🇧 English"}
            </button>
          ))}
        </div>
      </div>

      {/* Help */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-gray-900">{t("profile_need_help")}</h3>
        </div>
        <p className="text-sm text-gray-500">{t("profile_help_desc")}</p>
        <div className="flex gap-3">
          <Link href="/aide">
            <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50">
              <HelpCircle className="w-4 h-4 mr-2" /> {t("profile_help_center")}
            </Button>
          </Link>
          <Button
            size="sm"
            className="bg-[#25D366] hover:bg-[#1da851] text-white gap-2"
            onClick={() => openWhatsAppSupport(WHATSAPP_SUPPORT_NUMBER)}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── User widget (top-right header) ───────────────────────────────────────────
function UserWidget({
  user,
  onProfileClick,
  onLogout,
}: {
  user: { name: string; email: string };
  onProfileClick: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all ${
          open ? "bg-gray-100" : "hover:bg-gray-100"
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/20 to-primary/15 border border-red-200 flex items-center justify-center shrink-0 overflow-hidden">
          <img src={iconProfile} alt="Profil" className="w-5 h-5 object-contain" />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-semibold text-gray-900 leading-none">{user.name}</p>
          <p className="text-[10px] text-gray-400 leading-none mt-0.5 truncate max-w-[100px]">{user.email}</p>
        </div>
        <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform hidden sm:block ${open ? "rotate-90" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-gray-200 bg-white shadow-xl shadow-black/10 overflow-hidden z-50"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                  {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1.5 px-1.5 space-y-0.5">
              <button
                onClick={() => { onProfileClick(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                <User className="w-4 h-4 text-gray-400" /> {t("widget_my_profile")}
              </button>
              <button
                onClick={() => { window.dispatchEvent(new CustomEvent("zynum:tab", { detail: "recharge" })); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                <PlusCircle className="w-4 h-4 text-gray-400" /> {t("widget_recharge")}
              </button>
            </div>

            <div className="px-1.5 pb-1.5 border-t border-gray-100 pt-1.5">
              <button
                onClick={() => { onLogout(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" /> {t("widget_logout")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

  const { t } = useLanguage();
  const { data: rawUser, isLoading } = useGetCurrentUser({ query: { retry: false } });
  const user = rawUser as UserWithAdmin | undefined;
  const adminReloadHandled = React.useRef(false);
  const logoutMutation = useLogoutUser({
    mutation: {
      onSuccess: () => {
        localStorage.removeItem("zynum_token");
        queryClient.clear();
        setLocation("/");
        toast({ title: t("nav_logout") });
      },
    },
  });

  React.useEffect(() => {
    const legacyParams = new URLSearchParams(window.location.search);
    const fragmentParams = new URLSearchParams(window.location.hash.slice(1));
    const authToken = fragmentParams.get("auth_token") ?? legacyParams.get("auth_token");
    if (authToken) {
      localStorage.setItem("zynum_token", authToken);
      queryClient.invalidateQueries();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [queryClient]);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent).detail as Tab;
      setActiveTab(tab);
    };
    window.addEventListener("zynum:tab", handler);
    return () => window.removeEventListener("zynum:tab", handler);
  }, []);

  // Handle redirect from public /buy page — auto-switch to buy tab and pre-fill service+country
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "buy") {
      setActiveTab("buy");
      // Replace URL to remove query params without reloading
      window.history.replaceState({}, "", window.location.pathname);
      // Dispatch intent to BuyNumber after it mounts
      const intent = sessionStorage.getItem("zynum_buy_intent");
      if (intent) {
        sessionStorage.removeItem("zynum_buy_intent");
        try {
          const parsed = JSON.parse(intent);
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("zynum:buy-intent", { detail: parsed }));
          }, 150);
        } catch {}
      }
    }
  }, []);

  React.useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [isLoading, user, setLocation]);

  React.useEffect(() => {
    if (isLoading || !user?.isAdmin || adminReloadHandled.current) return;
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (navigation?.type !== "reload") return;

    adminReloadHandled.current = true;
    const token = localStorage.getItem("zynum_token");
    void (async () => {
      try {
        if (token) {
          await fetch("/api/v1/auth/logout", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } finally {
        localStorage.removeItem("zynum_token");
        queryClient.clear();
        setLocation("/login");
      }
    })();
  }, [isLoading, user, queryClient, setLocation]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const NAV: DashboardNavItem[] = [
    { id: "overview",   label: t("dash_tab_overview"), icon: LayoutDashboard },
    { id: "buy",        label: t("dash_tab_buy"),      icon: ShoppingCart },
    { id: "history",    label: t("dash_tab_history"),  icon: History },
    { id: "recharge",   label: t("dash_tab_recharge"), icon: WalletCards },
    { id: "affiliate",  label: "Affiliation",          icon: UsersRound },
    { id: "profile",    label: t("dash_tab_profile"),  icon: User },
    ...(user?.isAdmin ? [{ id: "admin" as Tab, label: "Administration", icon: Shield }] : []),
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(3px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar
        fixed inset-y-0 left-0 z-30 w-72 border-r border-white/10
        flex flex-col transition-transform duration-300
        lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `} style={{ background: "linear-gradient(180deg, #15171c 0%, #101216 100%)", color: "#ffffff", boxShadow: "12px 0 40px rgba(0,0,0,0.16)" }}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-orange-500/20 ring-1 ring-white/15">
              <img src="/logo.jpg" alt="ZyNum" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="block font-bold text-lg leading-tight" style={{ color: "#ffffff" }}>ZyNum</span>
              <span className="block text-[10px] uppercase tracking-[0.16em] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Dashboard</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Fermer le menu"
            className="lg:hidden p-2 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3 rounded-2xl px-3 py-3 border border-white/10 bg-white/[0.06]">
            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-orange-500/20"
              style={{ color: "#ffffff" }}
            >
              {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "#ffffff" }}>{user.name}</p>
              <p className="text-xs truncate mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{user.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-5 px-3 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.35)" }}>Navigation</p>
          <div className="space-y-1">
          {NAV.map((item) => {
            const active = activeTab === item.id;
            const ItemIcon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`
                  group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all
                  ${active ? "shadow-lg shadow-orange-950/20" : "hover:bg-white/[0.07]"}
                `}
                style={{
                  color: active ? "#ffffff" : "rgba(255,255,255,0.58)",
                  background: active ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" : "transparent",
                }}
              >
                <ItemIcon className={`w-[18px] h-[18px] shrink-0 transition-transform ${active ? "" : "group-hover:scale-110"}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />}
              </button>
            );
          })}
          </div>

          {/* Separator */}
          <div className="pt-5 mt-5 border-t border-white/10 space-y-1">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.35)" }}>Aide & support</p>
            <Link
              href="/aide"
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/[0.07]"
              style={{ color: "rgba(255,255,255,0.58)" }}
              onClick={() => setSidebarOpen(false)}
            >
              <HelpCircle className="w-[18px] h-[18px] shrink-0" />
              {t("dash_help_center")}
            </Link>
            <button
              onClick={() => openWhatsAppSupport(WHATSAPP_SUPPORT_NUMBER)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all hover:bg-[#25D366]/10"
              style={{ color: "rgba(255,255,255,0.58)" }}
            >
              <MessageSquare className="w-[18px] h-[18px] shrink-0" />
              WhatsApp
            </button>
          </div>
        </nav>

        {/* Currency toggle */}
        <div className="px-4 py-4 border-t border-white/10">
          <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.35)" }}>Devise</p>
          <div className="flex bg-white/[0.06] border border-white/10 rounded-xl p-1 gap-1">
            {(["USD", "FCFA"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${
                  currency === c ? "bg-orange-500 shadow-md shadow-orange-950/20" : "hover:bg-white/[0.07]"
                }`}
                style={{ color: currency === c ? "#ffffff" : "rgba(255,255,255,0.45)" }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-white/10">
          <button
            onClick={() => logoutMutation.mutate()}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors font-medium hover:bg-red-500/10"
            style={{ color: "rgba(248,113,113,0.9)" }}
          >
            <LogOut className="w-4 h-4" />
            {logoutMutation.isPending ? t("loading") : t("nav_logout")}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="dashboard-topbar sticky top-0 z-10 flex items-center gap-3 px-4 py-3 backdrop-blur-md border-b border-gray-200 bg-white/90">
          <button className="lg:hidden text-muted-foreground hover:text-gray-700 p-1" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-gray-900">
              {NAV.find((n) => n.id === activeTab)?.label ?? "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/aide" className="p-2 rounded-lg text-muted-foreground hover:text-gray-700 hover:bg-gray-100 transition-colors" title="Centre d'aide">
              <HelpCircle className="w-4 h-4" />
            </Link>
            {/* User widget */}
            <UserWidget user={user} onProfileClick={() => setActiveTab("profile")} onLogout={() => logoutMutation.mutate()} />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="dashboard-content p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "overview"   && <Overview currency={currency} />}
              {activeTab === "buy"        && <BuyNumber isEmbedded={true} />}
              {activeTab === "history"    && <OrderHistory />}
              {activeTab === "recharge"   && <Recharge />}
              {activeTab === "affiliate"  && <AffiliatePage />}
              {activeTab === "profile"    && <ProfilePage user={user} />}
              {activeTab === "admin"      && user?.isAdmin && <AdminPanel />}
            </motion.div>
          </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
