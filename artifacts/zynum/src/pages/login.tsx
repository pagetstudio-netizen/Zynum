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
    <div className="min-h-screen w-full flex flex-col px-6 py-10" style={{ background: "#FAFAF5" }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md">
          <img src="/logo.jpg" alt="ZyNum" className="w-full h-full object-cover" />
        </div>
        <span className="font-bold text-lg text-[#1A1A1A] tracking-tight">ZyNum</span>
      </div>

      <div className="w-full max-w-sm">

        {/* Title */}
        <h1 className="text-[2.1rem] font-extrabold text-[#1A1A1A] leading-tight mb-2">
          Se connecter
        </h1>
        <p className="text-[15px] text-[#555] mb-8">
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-[#E8A000] font-semibold hover:underline">
            Créer un compte
          </Link>
        </p>

        {/* SSO-style button */}
        <button
          type="button"
          onClick={() => toast({ title: "Bientôt disponible", description: "Cette option sera disponible prochainement." })}
          className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-white border border-[#E8E8E8] shadow-sm hover:shadow-md transition-all mb-6"
        >
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
            <img src="/logo.jpg" alt="ZyNum" className="w-full h-full object-cover" />
          </div>
          <span className="text-[15px] font-semibold text-[#1A1A1A]">Se connecter avec ZyNum SSO</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-[#E8E8E8]" />
          <span className="text-sm text-[#999] font-medium">Ou</span>
          <div className="flex-1 h-px bg-[#E8E8E8]" />
        </div>

        {/* Error */}
        {loginMutation.isError && (
          <div className="mb-5 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {loginMutation.error?.response?.data?.message || "Email ou mot de passe incorrect."}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div>
            <label className="block text-[13px] font-semibold text-[#333] mb-2">
              Adresse email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#BBBBC0]" />
              <input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border border-[#E8E8E8] text-[#1A1A1A] text-[15px] outline-none transition-all focus:border-[#FFC107] focus:ring-2 focus:ring-[#FFC107]/20 placeholder:text-[#BBBBC0]"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-semibold text-[#333]">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <a href="#" className="text-[12px] text-[#E8A000] font-semibold hover:underline">
                Mot de passe oublié ?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#BBBBC0]" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-14 pl-12 pr-12 rounded-2xl bg-white border border-[#E8E8E8] text-[#1A1A1A] text-[15px] outline-none transition-all focus:border-[#FFC107] focus:ring-2 focus:ring-[#FFC107]/20 placeholder:text-[#BBBBC0]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#BBBBC0] hover:text-[#888]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* CTA */}
          <button
            type="submit"
            disabled={loginMutation.isPending || !email || !password}
            className="w-full h-14 rounded-2xl font-extrabold text-[#1A1A1A] text-[16px] transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98]"
            style={{ background: "#FFC107", boxShadow: "0 4px 20px rgba(255,193,7,0.35)" }}
          >
            {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Se connecter"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[13px] text-[#999] mt-8 leading-relaxed">
          Avez-vous précédemment acheté sur ZyNum ?{" "}
          <Link href="/register" className="text-[#E8A000] font-semibold hover:underline">
            Accéder à votre compte ici
          </Link>
        </p>
      </div>
    </div>
  );
}
