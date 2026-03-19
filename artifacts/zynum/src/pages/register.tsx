import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { useRegisterUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const registerMutation = useRegisterUser({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem("zynum_token", data.token);
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        toast({ title: "Compte créé avec succès !", description: "Bienvenue sur ZyNum." });
        const hasPendingBuy = !!sessionStorage.getItem("zynum_buy_intent");
        setLocation(hasPendingBuy ? "/dashboard?tab=buy" : "/dashboard");
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: t("register_error_title"),
          description: error?.response?.data?.message || t("register_error_default"),
        });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: t("register_pwd_mismatch_title"), description: t("register_pwd_mismatch") });
      return;
    }
    if (!name || !email || !password) return;
    registerMutation.mutate({ data: { name, email, password, confirmPassword } });
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
  };
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
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
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xl shadow-primary/30 mb-3">
            <img src="/logo.jpg" alt="ZyNum" className="w-full h-full object-cover" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            Zy<span className="text-primary">Num</span>
          </span>
        </div>

        {/* Headline */}
        <div className="text-center mb-8">
          <h1 className="text-[1.85rem] leading-tight font-extrabold text-white mb-3">
            {t("register_headline1")}{" "}
            <span className="text-primary">{t("register_headline_accent")}</span>
          </h1>
          <div className="mx-auto w-28 h-[3px] rounded-full bg-gradient-to-r from-primary to-primary/30 mb-5" />
          <p className="text-sm font-semibold text-white mb-1">{t("register_subtitle")}</p>
          <p className="text-sm text-white/50">{t("register_desc")}</p>
        </div>

        {/* Error banner */}
        {registerMutation.isError && (
          <div className="mb-5 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">
              {registerMutation.error?.response?.data?.message || "Impossible de créer le compte."}
            </p>
          </div>
        )}

        {/* Form card */}
        <div
          className="rounded-3xl p-6 space-y-4"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">{t("register_name")}</label>
              <input
                type="text"
                placeholder="Jean Dupont"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                className="w-full px-4 py-3.5 rounded-2xl text-white text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">{t("register_email")}</label>
              <input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-2xl text-white text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">{t("register_password")}</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3.5 rounded-2xl text-white text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">{t("register_confirm")}</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-2xl text-white text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={registerMutation.isPending || !name || !email || !password || !confirmPassword}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-base transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                boxShadow: "0 8px 32px rgba(59,130,246,0.35)",
              }}
            >
              {registerMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : t("register_btn")}
            </button>
          </form>
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-white/40 mt-6">
          {t("register_has_account")}{" "}
          <Link href="/login" className="text-white/70 font-semibold hover:text-white transition-colors underline underline-offset-4">
            {t("register_login_link")}
          </Link>
        </p>
      </div>
    </div>
  );
}
