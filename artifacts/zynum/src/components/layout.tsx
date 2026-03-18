import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  Menu, X, Phone, History, Code, LogOut, Wallet,
  ArrowUpRight, MessageSquare, Globe2, Shield, HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrency } from "@/hooks/use-currency";
import { Button } from "@/components/ui/button";
import { useGetCurrentUser, useLogoutUser, getGetCurrentUserQueryKey, useGetBalance } from "@workspace/api-client-react";

const FOOTER_LINKS = {
  Produit: [
    { label: "Acheter un numéro", href: "/buy" },
    { label: "Historique", href: "/history" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Documentation API", href: "/api-docs" },
  ],
  Services: [
    { label: "Telegram", href: "/buy" },
    { label: "WhatsApp", href: "/buy" },
    { label: "Gmail / Google", href: "/buy" },
    { label: "TikTok & Instagram", href: "/buy" },
  ],
  Entreprise: [
    { label: "À propos", href: "/about" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
    { label: "API Développeur", href: "/api-docs" },
  ],
  Légal: [
    { label: "Conditions d'utilisation", href: "/terms" },
    { label: "Politique de confidentialité", href: "/privacy" },
    { label: "FAQ", href: "/faq" },
  ],
};

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();
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
    { href: "/buy", label: "Acheter", icon: <Phone className="w-4 h-4 mr-2" /> },
    { href: "/history", label: "Historique", icon: <History className="w-4 h-4 mr-2" /> },
    { href: "/api-docs", label: "API", icon: <Code className="w-4 h-4 mr-2" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden" style={{ background: "hsl(222, 47%, 5%)" }}>
      {/* Ambient top glow */}
      <div className="absolute top-0 inset-x-0 h-[500px] pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute top-[-10%] right-[5%] w-[400px] h-[400px] rounded-full bg-blue-800/10 blur-[100px]" />
      </div>

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[hsl(222,47%,5%)]/80 backdrop-blur-xl">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all">
                <span className="text-white font-black text-sm">Z</span>
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-primary transition-colors">
                ZyNum
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${
                    location === link.href
                      ? "bg-white/10 text-white"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.icon}{link.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">
              {/* Currency toggle */}
              <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/[0.06]">
                {["USD", "FCFA"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c as "USD" | "FCFA")}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      currency === c ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {isLoadingUser ? (
                <div className="w-24 h-9 animate-pulse bg-white/5 rounded-lg" />
              ) : user ? (
                <div className="flex items-center gap-3">
                  {balanceData && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold bg-white/5 border border-white/[0.06] px-3 py-1.5 rounded-lg">
                      <Wallet className="w-3.5 h-3.5 text-primary" />
                      <span className="text-white">${balanceData.balance.toFixed(2)}</span>
                    </div>
                  )}
                  <Link href="/dashboard" className="flex items-center gap-2 bg-white/5 border border-white/[0.06] pl-2 pr-3 py-1.5 rounded-full hover:bg-white/10 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-blue-400 flex items-center justify-center text-white text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-white max-w-[90px] truncate">{user.name}</span>
                  </Link>
                  <button
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white hover:bg-white/5 font-medium">
                      Connexion
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/25 rounded-lg">
                      S'inscrire
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu btn */}
            <button
              className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="md:hidden fixed top-[73px] left-0 w-full bg-[hsl(222,47%,7%)]/95 backdrop-blur-xl border-b border-white/[0.06] z-40 shadow-2xl"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/[0.06] w-full">
                {["USD", "FCFA"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c as "USD" | "FCFA")}
                    className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${
                      currency === c ? "bg-primary text-white" : "text-muted-foreground"
                    }`}
                  >{c}</button>
                ))}
              </div>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium ${
                    location === link.href ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.icon}{link.label}
                </Link>
              ))}
              <div className="h-px w-full bg-white/[0.06]" />
              {user ? (
                <div className="space-y-2">
                  <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-blue-400 flex items-center justify-center text-white text-sm font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </Link>
                  <button onClick={() => { logoutMutation.mutate(); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-400/10 text-sm font-medium transition-colors">
                    <LogOut className="w-4 h-4" /> Déconnexion
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">Connexion</Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold">S'inscrire</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 relative z-10 flex flex-col">
        {children}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.06]" style={{ background: "hsl(222, 47%, 4%)" }}>
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Main footer grid */}
          <div className="pt-16 pb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

            {/* Brand column */}
            <div className="lg:col-span-2 space-y-5">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/30">
                  <span className="text-white font-black text-sm">Z</span>
                </div>
                <span className="font-display font-bold text-xl text-white">ZyNum</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                La plateforme de numéros virtuels pensée pour l'Afrique de l'Ouest. Recevez vos codes OTP en FCFA, instantanément.
              </p>
              {/* Social / trust links */}
              <div className="flex flex-wrap gap-3 pt-2">
                <a href="https://t.me/ZyNumSupport" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-white border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Telegram
                  <ArrowUpRight className="w-3 h-3" />
                </a>
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground border border-white/10 bg-white/5 px-3 py-1.5 rounded-lg">
                  <Shield className="w-3.5 h-3.5 text-green-400" /> SSL sécurisé
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground border border-white/10 bg-white/5 px-3 py-1.5 rounded-lg">
                  <Globe2 className="w-3.5 h-3.5 text-blue-400" /> 180+ pays
                </div>
              </div>
            </div>

            {/* Nav columns */}
            {Object.entries(FOOTER_LINKS).map(([section, links]) => (
              <div key={section}>
                <p className="text-xs font-bold text-white uppercase tracking-widest mb-4">{section}</p>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-white transition-colors"
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
          <div className="border-t border-white/[0.06] py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} ZyNum. Tous droits réservés.</p>
            <div className="flex items-center gap-5">
              <Link href="/terms" className="hover:text-white transition-colors">CGU</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
              <Link href="/faq" className="hover:text-white transition-colors">
                <span className="flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5" /> FAQ</span>
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
