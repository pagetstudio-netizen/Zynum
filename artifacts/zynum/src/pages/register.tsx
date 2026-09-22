import React, { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, User, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { useRegisterUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { AuthShell, authBlue, authButtonClass, authInputClass, authLinkClass } from "@/components/auth/auth-shell";

const API = "/api";

type Step = "form" | "verify";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [step, setStep] = useState<Step>("form");
  const [pendingEmail, setPendingEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Pre-fill referral code from URL param ?ref=
  const [referralCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("ref") ?? "";
  });

  const registerMutation = useRegisterUser({
    mutation: {
      onSuccess: (data: any) => {
        if (data.requiresVerification) {
          setPendingEmail(data.email || email);
          setStep("verify");
          setErrorMsg("");
          setTimeout(() => codeRefs.current[0]?.focus(), 100);
          return;
        }
        localStorage.setItem("zynum_token", data.token);
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        toast({ title: "Compte créé avec succès !", description: "Bienvenue sur ZyNum." });
        const hasPendingBuy = !!sessionStorage.getItem("zynum_buy_intent");
        setLocation(hasPendingBuy ? "/dashboard?tab=buy" : "/dashboard");
      },
      onError: (error: any) => {
        const msg = error?.response?.data?.message || t("register_error_default");
        toast({ variant: "destructive", title: t("register_error_title"), description: msg });
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
    registerMutation.mutate({ data: { name: fullName, email, password, confirmPassword, ...(referralCode ? { referralCode } : {}) } as any });
  };

  const handleCodeChange = (idx: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...codeDigits];
    next[idx] = digit;
    setCodeDigits(next);
    if (digit && idx < 5) codeRefs.current[idx + 1]?.focus();
  };

  const handleCodeKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !codeDigits[idx] && idx > 0) codeRefs.current[idx - 1]?.focus();
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCodeDigits(pasted.split(""));
      codeRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = codeDigits.join("");
    if (code.length < 6) return;
    setIsVerifying(true);
    setErrorMsg("");
    try {
      const r = await fetch(`${API}/v1/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, code }),
      });
      const data = await r.json();
      if (!r.ok) { setErrorMsg(data.message || "Code invalide ou expiré"); return; }
      localStorage.setItem("zynum_token", data.token);
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      toast({ title: "Compte activé !", description: "Bienvenue sur ZyNum 🎉" });
      const hasPendingBuy = !!sessionStorage.getItem("zynum_buy_intent");
      setLocation(hasPendingBuy ? "/dashboard?tab=buy" : "/dashboard");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    await fetch(`${API}/v1/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: pendingEmail }),
    });
    setCodeDigits(["", "", "", "", "", ""]);
    toast({ title: "Code renvoyé", description: "Vérifiez votre boîte email." });
  };

  const inputBase = `${authInputClass} pl-11 pr-4`;

  const pwdMatch = confirmPassword ? password === confirmPassword : true;

  return (
    <AuthShell>
      <div className="w-full max-w-md">

          {/* ── Step: form ── */}
          {step === "form" && (
            <>
              <div className="mb-7">
                <h1 className="text-center text-3xl font-extrabold leading-tight text-[#111827] mb-2">Créer un compte</h1>
                <p className="text-center text-[15px] text-[#687386]">
                  Déjà utilisateur ?{" "}
                  <Link href="/login" className={authLinkClass}>Connectez-vous ici</Link>
                </p>
              </div>

              {registerMutation.isError && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  {(registerMutation.error as any)?.response?.data?.message || "Impossible de créer le compte."}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                     <label className="block text-[13px] font-semibold text-[#30394d] mb-1.5">Prénom <span className="text-[#3157d5]">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" autoComplete="given-name" placeholder="Jean" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className={inputBase} style={{ paddingTop: "0.8rem", paddingBottom: "0.8rem" }} />
                    </div>
                  </div>
                  <div>
                     <label className="block text-[13px] font-semibold text-[#30394d] mb-1.5">Nom <span className="text-[#3157d5]">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" autoComplete="family-name" placeholder="Dupont" value={lastName} onChange={(e) => setLastName(e.target.value)} required className={inputBase} style={{ paddingTop: "0.8rem", paddingBottom: "0.8rem" }} />
                    </div>
                  </div>
                </div>

                <div>
                   <label className="block text-[13px] font-semibold text-[#30394d] mb-1.5">Adresse email <span className="text-[#3157d5]">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" autoComplete="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputBase} style={{ paddingTop: "0.8rem", paddingBottom: "0.8rem" }} />
                  </div>
                </div>

                <div>
                   <label className="block text-[13px] font-semibold text-[#30394d] mb-1.5">Mot de passe <span className="text-[#3157d5]">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                       className={`${authInputClass} pl-11 pr-11`}
                      style={{ paddingTop: "0.8rem", paddingBottom: "0.8rem" }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                   <label className="block text-[13px] font-semibold text-[#30394d] mb-1.5">Confirmer le mot de passe <span className="text-[#3157d5]">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className={`w-full pl-11 pr-11 rounded-xl text-gray-900 text-[15px] outline-none transition-all placeholder:text-gray-400 ${
                         !pwdMatch ? "border border-red-300 bg-red-50 focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                           : authInputClass
                      }`}
                      style={{ paddingTop: "0.8rem", paddingBottom: "0.8rem" }}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {!pwdMatch && <p className="text-xs text-red-600 mt-1.5 font-medium">Les mots de passe ne correspondent pas.</p>}
                </div>

                {referralCode && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200">
                    <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    <span className="text-sm text-green-700">
                      Code parrain appliqué : <span className="font-bold">{referralCode}</span>
                    </span>
                  </div>
                )}

                <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
                  <div className="relative mt-0.5 shrink-0" onClick={() => setAcceptTerms(!acceptTerms)}>
                     <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${acceptTerms ? "bg-[#3157d5] border-[#3157d5]" : "border-gray-300 bg-white hover:border-[#3157d5]"}`}>
                      {acceptTerms && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </div>
                  <span className="text-[14px] text-gray-500 leading-snug">
                     J'accepte les{" "}
                     <Link href="/terms" className={authLinkClass}>termes et conditions</Link>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={registerMutation.isPending || !firstName || !email || !password || !confirmPassword || !acceptTerms || password !== confirmPassword}
                   className={`${authButtonClass} mt-1 flex items-center justify-center gap-2`}
                >
                  {registerMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Créer mon compte <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

               <p className="text-center text-[13px] text-[#8a94a6] mt-8 leading-relaxed">
                Avez-vous précédemment acheté sur ZyNum ?{" "}
                 <Link href="/login" className={authLinkClass}>Accéder à vos achats ici</Link>
              </p>
            </>
          )}

          {/* ── Step: verify email ── */}
          {step === "verify" && (
            <>
               <div className="mb-8">
                 <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d6e1ff] bg-[#eef2ff]">
                   <ShieldCheck className="h-7 w-7 text-[#3157d5]" />
                </div>
                 <h1 className="text-center text-3xl font-extrabold text-[#111827] leading-tight mb-2">Vérifiez votre email</h1>
                 <p className="text-center text-[15px] text-[#687386]">
                  Un code à 6 chiffres a été envoyé à :<br />
                   <span className="font-semibold text-[#172033]">{pendingEmail}</span>
                </p>
                 <p className="mt-3 text-[13px] text-[#6f5b1d] bg-[#fff9e8] border border-[#f2e4ae] rounded-xl px-3 py-2">
                  📩 Si vous ne trouvez pas l'email, vérifiez votre dossier <strong>spam / courrier indésirable</strong>.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleVerify}>
                 <div className="flex justify-center gap-1.5 mb-6 sm:gap-2" onPaste={handleCodePaste}>
                  {codeDigits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => { codeRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                       autoComplete="one-time-code"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                       className="h-12 w-10 rounded-xl border-2 bg-[#f1f3f7] text-center text-xl font-bold text-[#172033] outline-none transition-all focus:border-[#3157d5] focus:bg-white focus:ring-4 focus:ring-[#3157d5]/10 sm:h-14 sm:w-12 sm:text-2xl"
                       style={{ borderColor: d ? authBlue : undefined }}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || codeDigits.join("").length < 6}
                   className={`${authButtonClass} flex items-center justify-center gap-2`}
                >
                  {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Activer mon compte <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

               <div className="flex items-center justify-between mt-5">
                 <button onClick={() => { setStep("form"); setErrorMsg(""); setCodeDigits(["", "", "", "", "", ""]); }} className="text-sm text-[#687386] hover:text-[#3157d5] transition-colors">
                  ← Retour
                </button>
                 <button onClick={handleResend} className={`text-sm ${authLinkClass}`}>
                  Renvoyer le code
                </button>
              </div>
            </>
          )}
      </div>
    </AuthShell>
  );
}
