import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { useLoginUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useLoginUser({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem("zynum_token", data.token);
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        toast({ title: "Connecté avec succès !", description: "Bienvenue sur ZyNum." });
        const hasPendingBuy = !!sessionStorage.getItem("zynum_buy_intent");
        setLocation(hasPendingBuy ? "/dashboard?tab=buy" : "/dashboard");
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Échec de connexion",
          description: error?.response?.data?.message || "Email ou mot de passe incorrect.",
        });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    loginMutation.mutate({ data: { email, password } });
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-5 py-12"
      style={{
        background: "#080d17",
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      {/* Glow orbs */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] rounded-full" />
      <div className="pointer-events-none fixed bottom-0 right-0 w-[400px] h-[300px] bg-primary/5 blur-[100px] rounded-full" />

      <div className="w-full max-w-sm relative z-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xl shadow-primary/30 mb-3">
            <img src="/logo.jpg" alt="ZyNum" className="w-full h-full object-cover" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            Zy<span className="text-primary">Num</span>
          </span>
        </div>

        {/* Headline */}
        <div className="text-center mb-10">
          <h1 className="text-[2rem] leading-tight font-extrabold text-white mb-3">
            Recevez vos codes{" "}
            <span className="text-primary">OTP</span>{" "}
            instantanément
          </h1>
          {/* Blue underline accent */}
          <div className="mx-auto w-32 h-[3px] rounded-full bg-gradient-to-r from-primary to-primary/30 mb-6" />
          <p className="text-sm font-semibold text-white mb-1">Connexion / Inscription</p>
          <p className="text-sm text-white/50">
            Connectez-vous ou créez un compte automatiquement.
          </p>
        </div>

        {/* Error banner */}
        {loginMutation.isError && (
          <div className="mb-5 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">
              {loginMutation.error?.response?.data?.message || "Email ou mot de passe incorrect."}
            </p>
          </div>
        )}

        {/* Form card */}
        <div className="rounded-3xl p-6 space-y-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Email</label>
              <input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-13 px-4 py-3.5 rounded-2xl text-white text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white">Mot de passe</label>
                <a href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">
                  Oublié ?
                </a>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-13 px-4 py-3.5 rounded-2xl text-white text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={loginMutation.isPending || !email || !password}
              className="w-full h-13 rounded-2xl font-bold text-white text-base transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                boxShadow: "0 8px 32px rgba(59,130,246,0.35)",
              }}
            >
              {loginMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-white/40 mt-6">
          Pas de compte ?{" "}
          <Link href="/register" className="text-white/70 font-semibold hover:text-white transition-colors underline underline-offset-4">
            Créez-en un gratuitement
          </Link>
        </p>
      </div>
    </div>
  );
}
