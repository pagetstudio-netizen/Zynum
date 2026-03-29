import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useLoginUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
          title: t("login_error_title"),
          description: error?.response?.data?.message || t("login_error_default"),
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-10 bg-background relative overflow-hidden">

      {/* Decorative background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-10%] right-[-5%] w-[450px] h-[450px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-[20%] left-[-8%] w-[350px] h-[350px] rounded-full bg-rose-500/10 blur-[100px]" />
        <div className="absolute bottom-[-5%] left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full bg-primary/5 blur-[80px]" />
      </div>

      <div className="w-full max-w-sm relative z-10">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md">
            <img src="/logo.jpg" alt="ZyNum" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">ZyNum</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold text-white leading-tight mb-2">
          Se connecter
        </h1>
        <p className="text-[15px] text-muted-foreground mb-8">
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Créer un compte
          </Link>
        </p>

        {/* Error */}
        {loginMutation.isError && (
          <div className="mb-5 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {(loginMutation.error as any)?.response?.data?.message || "Email ou mot de passe incorrect."}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div>
            <label className="block text-[13px] font-semibold text-muted-foreground mb-2">
              Adresse email <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/5 border border-white/10 text-white text-[15px] outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20 placeholder:text-white/20"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-semibold text-muted-foreground">
                Mot de passe <span className="text-red-400">*</span>
              </label>
              <a href="#" className="text-[12px] text-primary font-semibold hover:underline">
                Mot de passe oublié ?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-14 pl-12 pr-12 rounded-2xl bg-white/5 border border-white/10 text-white text-[15px] outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20 placeholder:text-white/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* CTA */}
          <button
            type="submit"
            disabled={loginMutation.isPending || !email || !password}
            className="w-full h-14 rounded-2xl font-extrabold text-white text-[16px] transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] bg-gradient-to-r from-primary to-rose-500 hover:from-primary/90 hover:to-rose-500/90 shadow-lg shadow-primary/25 border-0"
          >
            {loginMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[13px] text-muted-foreground mt-8 leading-relaxed">
          Avez-vous précédemment acheté sur ZyNum ?{" "}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Accéder à votre compte ici
          </Link>
        </p>
      </div>
    </div>
  );
}
