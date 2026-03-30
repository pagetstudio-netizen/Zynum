import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
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

  const inputClass =
    "w-full h-13 pl-12 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-[15px] outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-500/15 focus:bg-white placeholder:text-gray-400";

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[42%] bg-gradient-to-br from-red-500 to-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-black/20">
              <img src="/logo.jpg" alt="ZyNum" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">ZyNum</span>
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Numéros virtuels<br />pour le monde entier
          </h2>
          <p className="text-white/70 text-lg leading-relaxed max-w-sm">
            Recevez vos codes OTP en quelques secondes. 180+ pays, 200+ services.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">50K</div>
          <p className="text-white/70 text-sm">utilisateurs nous font confiance</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md">
              <img src="/logo.jpg" alt="ZyNum" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-lg text-gray-900 tracking-tight">ZyNum</span>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">
              Bon retour 👋
            </h1>
            <p className="text-[15px] text-gray-500">
              Pas encore de compte ?{" "}
              <Link href="/register" className="text-red-500 font-semibold hover:text-red-600 transition-colors">
                Créer un compte
              </Link>
            </p>
          </div>

          {/* Error */}
          {loginMutation.isError && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              {(loginMutation.error as any)?.response?.data?.message || "Email ou mot de passe incorrect."}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-2">
                Adresse email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                  style={{ paddingTop: "0.875rem", paddingBottom: "0.875rem" }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[13px] font-semibold text-gray-700">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <a href="#" className="text-[12px] text-red-500 font-semibold hover:text-red-600 transition-colors">
                  Mot de passe oublié ?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-[15px] outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-500/15 focus:bg-white placeholder:text-gray-400"
                  style={{ paddingTop: "0.875rem", paddingBottom: "0.875rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={loginMutation.isPending || !email || !password}
              className="w-full py-4 rounded-xl font-bold text-white text-[16px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] bg-gradient-to-r from-red-500 to-primary hover:from-red-600 hover:to-primary/90 shadow-lg shadow-red-500/30"
            >
              {loginMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Se connecter <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[13px] text-gray-400 mt-8 leading-relaxed">
            Avez-vous précédemment acheté sur ZyNum ?{" "}
            <Link href="/register" className="text-red-500 font-semibold hover:text-red-600 transition-colors">
              Accéder à votre compte ici
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
