import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
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

  const inputBase =
    "w-full pl-11 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-[15px] outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-500/15 focus:bg-white placeholder:text-gray-400";

  const pwdMatch = confirmPassword ? password === confirmPassword : true;

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[40%] bg-gradient-to-br from-red-500 to-primary flex-col justify-between p-12 relative overflow-hidden">
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
            Rejoignez<br />50 000+ utilisateurs
          </h2>
          <p className="text-white/70 text-lg leading-relaxed max-w-sm mb-8">
            Obtenez votre premier numéro virtuel en moins de 30 secondes.
          </p>
          <div className="space-y-3">
            {["Inscription gratuite, sans carte bancaire", "180+ pays disponibles", "OTP reçu en moins de 30 secondes"].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-white/80 shrink-0" />
                <span className="text-white/80 text-[15px]">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-white/50 text-xs">© 2025 ZyNum. Tous droits réservés.</div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 bg-white overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md">
              <img src="/logo.jpg" alt="ZyNum" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-lg text-gray-900 tracking-tight">ZyNum</span>
          </div>

          {/* Title */}
          <div className="mb-7">
            <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">
              Créer un compte
            </h1>
            <p className="text-[15px] text-gray-500">
              Déjà utilisateur ?{" "}
              <Link href="/login" className="text-red-500 font-semibold hover:text-red-600 transition-colors">
                Connectez-vous ici
              </Link>
            </p>
          </div>

          {/* Error */}
          {registerMutation.isError && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              {(registerMutation.error as any)?.response?.data?.message || "Impossible de créer le compte."}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* First + Last name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Jean"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className={inputBase}
                    style={{ paddingTop: "0.8rem", paddingBottom: "0.8rem" }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Nom <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Dupont"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className={inputBase}
                    style={{ paddingTop: "0.8rem", paddingBottom: "0.8rem" }}
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Adresse email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputBase}
                  style={{ paddingTop: "0.8rem", paddingBottom: "0.8rem" }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-11 pr-11 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-[15px] outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-500/15 focus:bg-white placeholder:text-gray-400"
                  style={{ paddingTop: "0.8rem", paddingBottom: "0.8rem" }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Confirmer le mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`w-full pl-11 pr-11 rounded-xl text-gray-900 text-[15px] outline-none transition-all placeholder:text-gray-400 ${
                    !pwdMatch
                      ? "bg-red-50 border border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-500/15"
                      : "bg-gray-50 border border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-500/15 focus:bg-white"
                  }`}
                  style={{ paddingTop: "0.8rem", paddingBottom: "0.8rem" }}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!pwdMatch && (
                <p className="text-xs text-red-600 mt-1.5 font-medium">Les mots de passe ne correspondent pas.</p>
              )}
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
              <div className="relative mt-0.5 shrink-0" onClick={() => setAcceptTerms(!acceptTerms)}>
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${acceptTerms ? "bg-red-500 border-red-500" : "border-gray-300 bg-white hover:border-red-400"}`}>
                  {acceptTerms && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-[14px] text-gray-500 leading-snug">
                J'accepte les{" "}
                <Link href="/terms" className="text-red-500 font-semibold hover:text-red-600 transition-colors">
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
              className="w-full py-4 rounded-xl font-bold text-white text-[16px] transition-all mt-1 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] bg-gradient-to-r from-red-500 to-primary hover:from-red-600 hover:to-primary/90 shadow-lg shadow-red-500/30"
            >
              {registerMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Créer mon compte <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[13px] text-gray-400 mt-8 leading-relaxed">
            Avez-vous précédemment acheté sur ZyNum ?{" "}
            <Link href="/login" className="text-red-500 font-semibold hover:text-red-600 transition-colors">
              Accéder à vos achats ici
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
