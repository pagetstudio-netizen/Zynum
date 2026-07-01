import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Menu, X, Phone,
  MessageSquare, Globe2, Shield, HelpCircle,
} from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage } from "@/hooks/use-language";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { SocialBar } from "@/components/social-bar";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const { lang, setLang, t } = useLanguage();
  const { data: user, isLoading: isLoadingUser } = useGetCurrentUser({
    query: { retry: false, staleTime: 5 * 60 * 1000 },
  });

  const navLinks = [
    { href: "/login",   label: t("nav_services"), icon: <Phone         className="w-4 h-4 mr-2" /> },
    { href: "/login",   label: t("nav_pricing"),  icon: <HelpCircle    className="w-4 h-4 mr-2" /> },
    { href: "/aide",    label: t("nav_help"),     icon: <HelpCircle    className="w-4 h-4 mr-2" /> },
    { href: "/about",   label: t("nav_about"),    icon: <MessageSquare className="w-4 h-4 mr-2" /> },
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

  const isHome = false;

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* ── Navbar flottante style CardsPro ───────────────────────────────── */}
      <div className="sticky top-0 z-50 w-full" style={{ padding: "12px 16px" }}>
        <header
          style={{
            background: "#1c1f26",
            borderRadius: 18,
            boxShadow: "0 4px 32px rgba(0,0,0,0.28)",
            border: "1px solid rgba(255,255,255,0.08)",
            maxWidth: 1280,
            margin: "0 auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px" }}>

            {/* Logo */}
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                <img src="/logo.jpg" alt="ZyNum" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#ffffff", letterSpacing: "-0.3px" }}>
                ZyNum
              </span>
            </Link>

            {/* Desktop nav links (hidden on mobile) */}
            <nav className="hidden md:flex" style={{ gap: 4 }}>
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 500,
                    color: location === link.href ? "#fff" : "rgba(255,255,255,0.5)",
                    textDecoration: "none",
                    transition: "color 0.15s",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

              {/* Currency toggle — desktop only */}
              <div className="hidden md:flex" style={{ alignItems: "center", background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "3px" }}>
                {(["USD", "FCFA"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      background: currency === c ? "#f97316" : "transparent",
                      color: currency === c ? "#fff" : "rgba(255,255,255,0.45)",
                    }}
                  >{c}</button>
                ))}
              </div>

              {/* Language toggle — desktop only */}
              <div className="hidden md:flex" style={{ alignItems: "center", background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "3px" }}>
                {(["fr", "en"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      textTransform: "uppercase" as const,
                      background: lang === l ? "#f97316" : "transparent",
                      color: lang === l ? "#fff" : "rgba(255,255,255,0.45)",
                    }}
                  >{l}</button>
                ))}
              </div>

              {/* User pill or register button */}
              {isLoadingUser ? (
                <div style={{ width: 80, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.08)", animation: "pulse 1.5s infinite" }} />
              ) : user ? (
                <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 50, padding: "6px 14px 6px 6px", textDecoration: "none" }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, #f97316, #fb923c)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800 }}>
                    {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</span>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="hidden md:block" style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.5)", textDecoration: "none", padding: "7px 12px" }}>
                    {t("nav_login")}
                  </Link>
                  <Link href="/register" style={{ textDecoration: "none" }}>
                    <button style={{ background: "#f97316", color: "#fff", border: "none", borderRadius: 50, padding: "9px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 0 20px rgba(249,115,22,0.35)", whiteSpace: "nowrap" as const }}>
                      {t("nav_register")}
                    </button>
                  </Link>
                </>
              )}

              {/* Hamburger — mobile */}
              <button
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
                style={{ background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 10px", cursor: "pointer", color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Menu style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* ── Mobile menu — dark sidebar overlay ─────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Dark sidebar */}
          <div
            className="fixed top-0 right-0 bottom-0 z-50 w-72 flex flex-col overflow-hidden"
            style={{ background: "#2b2d32", color: "#ffffff" }}
          >
            {/* Close button */}
            <div className="flex items-center justify-end px-5 py-4">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ color: "rgba(255,255,255,0.7)" }}
                className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto">
              {[
                { href: "/", label: t("nav_home") },
                ...navLinks,
                ...(!user ? [
                  { href: "/login", label: t("nav_login") },
                  { href: "/register", label: t("nav_start_free") },
                ] : [
                  { href: "/dashboard", label: t("nav_dashboard") },
                ]),
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "16px 28px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    textDecoration: "none",
                  }}
                >
                  {link.label}
                </Link>
              ))}

              {/* Language & Currency */}
              <div style={{ padding: "32px 28px 16px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <button
                  onClick={() => setLang(lang === "fr" ? "en" : "fr")}
                  style={{ display: "flex", alignItems: "center", gap: "12px", color: "rgba(255,255,255,0.7)", background: "none", border: "none", cursor: "pointer" }}
                >
                  <span style={{ fontSize: "20px" }}>{lang === "fr" ? "🇫🇷" : "🇬🇧"}</span>
                  <span style={{ fontSize: "14px", fontWeight: 500 }}>{lang === "fr" ? "Français" : "English"}</span>
                </button>
                <button
                  onClick={() => setCurrency(currency === "USD" ? "FCFA" : "USD")}
                  style={{ display: "flex", alignItems: "center", gap: "12px", color: "rgba(255,255,255,0.7)", background: "none", border: "none", cursor: "pointer" }}
                >
                  <span style={{ fontSize: "20px" }}>🇺🇸</span>
                  <span style={{ fontSize: "14px", fontWeight: 500 }}>{currency}</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 relative z-10 flex flex-col">
        {children}
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer
        className="relative z-10"
        style={{
          borderTop: isHome ? "1px solid rgba(255,255,255,0.07)" : "1px solid #e5e7eb",
          background: isHome ? "#111" : "#f9fafb",
        }}
      >
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Main footer grid */}
          <div className="pt-10 pb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

            {/* Brand column */}
            <div className="lg:col-span-2 space-y-5">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-primary/20 group-hover:shadow-primary/40 transition-all">
                  <img src="/logo.jpg" alt="ZyNum" className="w-full h-full object-cover" />
                </div>
                <span
                  className="font-display font-bold text-xl transition-colors"
                  style={{ color: isHome ? "#fff" : "#111827" }}
                >ZyNum</span>
              </Link>
              <p className="text-sm leading-relaxed max-w-xs" style={{ color: isHome ? "rgba(255,255,255,0.45)" : "#6b7280" }}>
                {t("footer_desc")}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { icon: <Shield className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />, label: t("footer_ssl") },
                  { icon: <Globe2 className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />, label: t("footer_countries") },
                ].map((b) => (
                  <div
                    key={b.label}
                    className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg"
                    style={{ color: isHome ? "rgba(255,255,255,0.5)" : "#6b7280", border: isHome ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb", background: isHome ? "rgba(255,255,255,0.04)" : "#fff" }}
                  >
                    {b.icon} {b.label}
                  </div>
                ))}
              </div>
              <SocialBar label="Suivez-nous" className="pt-1" size="sm" />
            </div>

            {/* Nav columns */}
            {Object.entries(footerLinks).map(([section, links]) => (
              <div key={section}>
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ color: isHome ? "rgba(255,255,255,0.6)" : "#111827" }}
                >{section}</p>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm transition-colors"
                        style={{ color: isHome ? "rgba(255,255,255,0.4)" : "#6b7280" }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div
            className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
            style={{ borderTop: isHome ? "1px solid rgba(255,255,255,0.07)" : "1px solid #e5e7eb", color: isHome ? "rgba(255,255,255,0.3)" : "#9ca3af" }}
          >
            <p>© {new Date().getFullYear()} ZyNum. {t("footer_rights")}</p>
            <div className="flex items-center gap-5">
              <Link href="/terms" className="hover:opacity-80 transition-opacity">{t("footer_cgu")}</Link>
              <Link href="/privacy" className="hover:opacity-80 transition-opacity">{t("footer_confidentiality")}</Link>
              <Link href="/faq" className="hover:opacity-80 transition-opacity">
                <span className="flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5" /> FAQ</span>
              </Link>
              <Link href="/contact" className="hover:opacity-80 transition-opacity">{t("nav_contact")}</Link>
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
