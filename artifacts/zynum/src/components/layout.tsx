import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, X, Phone, History, Code, LogOut, User, DollarSign, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrency } from "@/hooks/use-currency";
import { Button } from "@/components/ui/button";
import { useGetCurrentUser, useLogoutUser, getGetCurrentUserQueryKey, useGetBalance } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currency, setCurrency, formatPrice } = useCurrency();
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
    { href: "/buy", label: "Buy Number", icon: <Phone className="w-4 h-4 mr-2" /> },
    { href: "/history", label: "History", icon: <History className="w-4 h-4 mr-2" /> },
    { href: "/api-docs", label: "API", icon: <Code className="w-4 h-4 mr-2" /> },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-0 inset-x-0 h-[500px] pointer-events-none bg-gradient-to-b from-primary/10 to-transparent opacity-50 blur-3xl -z-10" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent p-[1px] shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300">
                  <div className="w-full h-full bg-background rounded-[11px] flex items-center justify-center">
                    <img 
                      src={`${import.meta.env.BASE_URL}images/logo.png`} 
                      alt="ZyNum Logo" 
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                </div>
                <span className="font-display font-bold text-2xl tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-primary/80 transition-all duration-300">
                  ZyNum
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                    location === link.href
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="hidden md:flex items-center space-x-4">
              
              {/* Currency Toggle */}
              <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/5">
                <button
                  onClick={() => setCurrency("USD")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    currency === "USD" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-white"
                  }`}
                >
                  USD
                </button>
                <button
                  onClick={() => setCurrency("FCFA")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    currency === "FCFA" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-white"
                  }`}
                >
                  FCFA
                </button>
              </div>

              <div className="h-6 w-px bg-white/10 mx-2" />

              {isLoadingUser ? (
                <div className="w-24 h-10 animate-pulse bg-white/5 rounded-lg" />
              ) : user ? (
                <div className="flex items-center gap-4">
                  {balanceData && (
                    <div className="flex items-center gap-2 text-sm font-medium bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg shadow-inner">
                      <Wallet className="w-4 h-4 text-accent" />
                      <span className="text-white">{balanceData.balance.toFixed(2)} ₽</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-secondary/50 border border-white/5 pl-2 pr-4 py-1.5 rounded-full">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-white max-w-[100px] truncate">{user.name}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/login">
                    <Button variant="ghost" className="text-white hover:bg-white/10">Log in</Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 border border-primary/50">
                      Sign up
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-20 left-0 w-full bg-card/95 backdrop-blur-xl border-b border-white/10 z-40 shadow-2xl"
          >
            <div className="p-4 flex flex-col space-y-4">
              {/* Currency Toggle Mobile */}
              <div className="flex items-center justify-center bg-black/40 rounded-lg p-1 border border-white/5 w-full">
                <button
                  onClick={() => setCurrency("USD")}
                  className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                    currency === "USD" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-white"
                  }`}
                >
                  USD
                </button>
                <button
                  onClick={() => setCurrency("FCFA")}
                  className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                    currency === "FCFA" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-white"
                  }`}
                >
                  FCFA
                </button>
              </div>

              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-base font-medium flex items-center ${
                    location === link.href
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              
              <div className="h-px w-full bg-white/10 my-2" />
              
              {user ? (
                <>
                  <div className="px-4 py-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start border border-destructive/50" 
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </Button>
                </>
              ) : (
                <div className="flex flex-col space-y-3 pt-2">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-white/20 hover:bg-white/10">Log in</Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">
                      Sign up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10 bg-background/50 backdrop-blur-sm mt-auto z-10 relative">
        <div className="container max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ZyNum. Virtual Numbers Made Simple.
          </p>
        </div>
      </footer>
    </div>
  );
}
