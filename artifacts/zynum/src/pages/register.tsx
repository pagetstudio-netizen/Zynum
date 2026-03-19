import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useRegisterUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

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
    if (!acceptTerms) {
      toast({ variant: "destructive", title: "Termes requis", description: "Veuillez accepter les termes et conditions." });
      return;
    }
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: t("register_pwd_mismatch_title"), description: t("register_pwd_mismatch") });
      return;
    }
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || firstName;
    if (!fullName || !email || !password) return;
    registerMutation.mutate({ data: { name: fullName, email, password, confirmPassword } });
  };

  const inputClass =
    "w-full h-14 pl-12 pr-4 rounded-2xl bg-white/5 border border-white/10 text-white text-[15px] outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20 placeholder:text-white/20";

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-10 bg-background">

      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md">
            <img src="/logo.jpg" alt="ZyNum" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">ZyNum</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold text-white leading-tight mb-2">
          Créer un compte
        </h1>
        <p className="text-[15px] text-muted-foreground mb-8">
          Déjà utilisateur de ZyNum ?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Connectez-vous ici
          </Link>
        </p>

        {/* Error */}
        {registerMutation.isError && (
          <div className="mb-5 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {(registerMutation.error as any)?.response?.data?.message || "Impossible de créer le compte."}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* First + Last name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-muted-foreground mb-2">
                Prénom <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type="text"
                  placeholder="Jean"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-muted-foreground mb-2">
                Nom <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type="text"
                  placeholder="Dupont"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>
          </div>

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
                className={inputClass}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[13px] font-semibold text-muted-foreground mb-2">
              Mot de passe <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
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

          {/* Confirm password */}
          <div>
            <label className="block text-[13px] font-semibold text-muted-foreground mb-2">
              Confirmer le mot de passe <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full h-14 pl-12 pr-12 rounded-2xl bg-white/5 border border-white/10 text-white text-[15px] outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20 placeholder:text-white/20"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-400 mt-1.5">Les mots de passe ne correspondent pas.</p>
            )}
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-3 cursor-pointer mt-1 select-none">
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  acceptTerms
                    ? "bg-primary border-primary"
                    : "border-white/20 bg-white/5"
                }`}
              >
                {acceptTerms && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-[14px] text-muted-foreground leading-snug">
              J'accepte les{" "}
              <Link href="/terms" className="text-primary font-semibold hover:underline">
                termes et conditions
              </Link>
            </span>
          </label>

          {/* CTA */}
          <button
            type="submit"
            disabled={
              registerMutation.isPending ||
              !firstName ||
              !email ||
              !password ||
              !confirmPassword ||
              !acceptTerms ||
              password !== confirmPassword
            }
            className="w-full h-14 rounded-2xl font-extrabold text-white text-[16px] transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
          >
            {registerMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Créer un compte"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[13px] text-muted-foreground mt-8 leading-relaxed">
          Avez-vous précédemment acheté sur ZyNum ?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Accéder à vos achats ici
          </Link>
        </p>
      </div>
    </div>
  );
}
