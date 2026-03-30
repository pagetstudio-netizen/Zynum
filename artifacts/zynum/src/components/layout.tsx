import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  Menu, X, Phone, LogOut, Wallet,
  ArrowUpRight, MessageSquare, Globe2, Shield, HelpCircle, CreditCard, Link2, Code2, Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { useGetCurrentUser, useLogoutUser, getGetCurrentUserQueryKey, useGetBalance } from "@workspace/api-client-react";
import { SocialBar } from "@/components/social-bar";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const { lang, setLang, t } = useLanguage();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isLoadingUser } = useGetCurrentUser({
    query: { retry: false, staleTime: 5 * 60 * 1000 },
  });

  const { data: balanceData } = useGetBalance({
    query: { enabled: !!user, refetchInterval: 30000 },
  });

  const logoutMutation = useLogoutUser({
    mutation: {
      onSettled: () => {
        localStorage.removeItem("zynum_token");
        queryClient.clear();
        setLocation("/login");
      },
    },
  });

  const navLinks = [
    { href: "/buy",     label: t("nav_buy"),     icon: <Phone         className="w-4 h-4 mr-2" /> },
    { href: "/aide",    label: t("nav_help"),    icon: <HelpCircle    className="w-4 h-4 mr-2" /> },
    { href: "/contact", label: t("nav_contact"), icon: <MessageSquare className="w-4 h-4 mr-2" /> },
  ];

  const footerLinks = {
    [t("footer_product")]: [
      { label: t("footer_buy_number"), href: "/buy" },
      { label: t("footer_history"), href: "/history" },
      { label: "Dashboard", href: "/dashboard" },
      { label: t("footer_help"), href: "/aide" },
    ],
    [t("footer_services")]: [
      { label: "Telegram", href: "/buy" },
      { label: "WhatsApp", href: "/buy" },
      { label: "Gmail / Google", href: "/buy" },
      { label: "TikTok & Instagram", href: "/buy" },
    ],
    [t("footer_company")]: [
      { label: t("footer_about"), href: "/about" },
      { label: t("footer_faq"), href: "/faq" },
      { label: t("nav_contact"), href: "/contact" },
      { label: t("footer_api"), href: "/api-docs" },
    ],
    [t("footer_legal")]: [
      { label: t("footer_terms"), href: "/terms" },
      { label: t("footer_privacy"), href: "/privacy" },
      { label: t("footer_faq"), href: "/faq" },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-background">
      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-4">

            {/* Logo */}
            {location === "/" ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-primary/20">
                  <img src="/logo.jpg" alt="ZyNum" className="w-full h-full object-cover" />
                </div>
                <span className="font-display font-bold text-xl tracking-tight text-gray-900">ZyNum</span>
              </div>
            ) : (
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-primary/20 group-hover:shadow-primary/40 transition-all">
                  <img src="/logo.jpg" alt="ZyNum" className="w-full h-full object-cover" />
                </div>
                <span className="font-display font-bold text-xl tracking-tight text-gray-900 group-hover:text-primary transition-colors">ZyNum</span>
              </Link>
            )}

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center space-x-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    location === link.href
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">
              {/* Currency toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
                {(["USD", "FCFA"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      currency === c ? "bg-primary text-white shadow-sm" : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Language toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
                {(["fr", "en"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all uppercase ${
                      lang === l ? "bg-primary text-white shadow-sm" : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {isLoadingUser ? (
                <div className="w-24 h-9 animate-pulse bg-gray-100 rounded-lg" />
              ) : user ? (
                <div className="flex items-center gap-3">
                  {balanceData && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg">
                      <Wallet className="w-3.5 h-3.5 text-primary" />
                      <span className="text-gray-900">${balanceData.balance.toFixed(2)}</span>
                    </div>
                  )}
                  <Link href="/dashboard" className="flex items-center gap-2 bg-gray-100 border border-gray-200 pl-2 pr-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-blue-400 flex items-center justify-center text-white text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-900 max-w-[90px] truncate">{user.name}</span>
                  </Link>
                  <button
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 font-medium">
                      {t("nav_login")}
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md shadow-primary/20 rounded-lg">
                      {t("nav_register")}
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu btn */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile menu — full screen overlay ─────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="md:hidden fixed inset-0 z-50 flex flex-col bg-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-primary/20">
                  <img src="/logo.jpg" alt="ZyNum" className="w-full h-full object-cover" />
                </div>
                <span className="font-display font-bold text-xl text-gray-900">ZyNum</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto">
              {/* Accueil */}
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 text-base font-semibold transition-colors ${location === "/" ? "text-primary bg-primary/5" : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"}`}
              >
                <span>{t("nav_home")}</span>
                {location === "/" && <div className="w-2 h-2 rounded-full bg-primary" />}
              </Link>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 text-base font-semibold transition-colors ${
                    location === link.href ? "text-primary bg-primary/5" : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <span>{link.label}</span>
                  {location === link.href && <div className="w-2 h-2 rounded-full bg-primary" />}
                </Link>
              ))}

              {/* Language selector */}
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">{t("menu_language")}</p>
                <div className="flex items-center gap-2">
                  {(["fr", "en"] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all border uppercase ${
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

              {/* Logged in user info */}
              {user && (
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-blue-400 flex items-center justify-center text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold text-sm">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </nav>

            {/* Bottom CTA */}
            <div className="px-5 py-6 space-y-3 border-t border-gray-100">
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold text-base rounded-xl shadow-lg shadow-primary/25">
                      {t("nav_dashboard")}
                    </Button>
                  </Link>
                  <button
                    onClick={() => { logoutMutation.mutate(); setIsMobileMenuOpen(false); }}
                    className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 font-semibold text-base transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> {t("nav_logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold text-base rounded-xl shadow-lg shadow-primary/25">
                      {t("nav_start_free")}
                    </Button>
                  </Link>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full h-12 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-base rounded-xl">
                      {t("nav_login")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 relative z-10 flex flex-col">
        {children}
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-gray-200 bg-gray-50">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* SendavaPay — Nos Solutions banner */}
          <div className="pt-12 pb-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-primary" /> Nos Solutions
            </p>
            <a
              href="https://sendavapay.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-primary/30 transition-all px-6 py-5 shadow-sm"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/25">
                <CreditCard className="w-6 h-6 text-white" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors">
                    SendavaPay
                  </span>
                  <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full">
                    sendavapay.com
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-snug">
                  Plateforme tout-en-un pour recevoir vos paiements en ligne.
                </p>
                {/* Features chips */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {[
                    { icon: <Link2 className="w-3 h-3" />, label: "Liens de paiement" },
                    { icon: <Code2 className="w-3 h-3" />, label: "API de paiement" },
                    { icon: <CreditCard className="w-3 h-3" />, label: "Encaissements" },
                    { icon: <Zap className="w-3 h-3" />, label: "Instantané" },
                  ].map((f) => (
                    <span
                      key={f.label}
                      className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg"
                    >
                      {f.icon} {f.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="shrink-0 w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-primary/10 border border-gray-200 group-hover:border-primary/30 flex items-center justify-center transition-all">
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
              </div>
            </a>
          </div>

          {/* Main footer grid */}
          <div className="pt-10 pb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

            {/* Brand column */}
            <div className="lg:col-span-2 space-y-5">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-primary/20 group-hover:shadow-primary/40 transition-all">
                  <img src="/logo.jpg" alt="ZyNum" className="w-full h-full object-cover" />
                </div>
                <span className="font-display font-bold text-xl text-gray-900 group-hover:text-primary transition-colors">ZyNum</span>
              </Link>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                {t("footer_desc")}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 border border-gray-200 bg-white px-3 py-1.5 rounded-lg">
                  <Shield className="w-3.5 h-3.5 text-green-500" /> {t("footer_ssl")}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 border border-gray-200 bg-white px-3 py-1.5 rounded-lg">
                  <Globe2 className="w-3.5 h-3.5 text-blue-500" /> {t("footer_countries")}
                </div>
              </div>
              <SocialBar label="Suivez-nous" className="pt-1" size="sm" />
            </div>

            {/* Nav columns */}
            {Object.entries(footerLinks).map(([section, links]) => (
              <div key={section}>
                <p className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">{section}</p>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-200 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
            <p>© {new Date().getFullYear()} ZyNum. {t("footer_rights")}</p>
            <div className="flex items-center gap-5">
              <Link href="/terms" className="hover:text-gray-700 transition-colors">{t("footer_cgu")}</Link>
              <Link href="/privacy" className="hover:text-gray-700 transition-colors">{t("footer_confidentiality")}</Link>
              <Link href="/faq" className="hover:text-gray-700 transition-colors">
                <span className="flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5" /> FAQ</span>
              </Link>
              <Link href="/contact" className="hover:text-gray-700 transition-colors">{t("nav_contact")}</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating help button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <Link href="/contact">
          <button className="flex items-center gap-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-2xl shadow-primary/40 transition-all hover:scale-105 active:scale-95">
            <MessageSquare className="w-4 h-4" />
            {t("nav_contact")}
          </button>
        </Link>
        <Link href="/aide">
          <button className="w-12 h-12 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center" title={t("footer_help")}>
            <HelpCircle className="w-5 h-5" />
          </button>
        </Link>
      </div>
    </div>
  );
}
