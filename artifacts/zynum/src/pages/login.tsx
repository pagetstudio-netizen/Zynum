import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { useLoginUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { AuthShell, authBlue, authButtonClass, authInputClass, authLinkClass } from "@/components/auth/auth-shell";

const API = "/api";

type Step = "credentials" | "verify_2fa" | "verify_admin_2fa" | "verify_email";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const loginMutation = useLoginUser({
    mutation: {
      onSuccess: (data: any) => {
        if (data.requires2FA) {
          setStep("verify_2fa");
          setErrorMsg("");
          setTimeout(() => codeRefs.current[0]?.focus(), 100);
          return;
        }
        if (data.requiresAdmin2FA) {
          setStep("verify_admin_2fa");
          setErrorMsg("");
          setTimeout(() => codeRefs.current[0]?.focus(), 100);
          return;
        }
        if (data.requiresVerification) {
          setStep("verify_email");
          setErrorMsg("");
          setTimeout(() => codeRefs.current[0]?.focus(), 100);
          return;
        }
        localStorage.setItem("zynum_token", data.token);
        sessionStorage.removeItem("zynum_dismissed_popups");
        sessionStorage.setItem("zynum_login_at", String(Date.now()));
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        toast({ title: "Connecté avec succès !", description: "Bienvenue sur ZyNum." });
        const hasPendingBuy = !!sessionStorage.getItem("zynum_buy_intent");
        setLocation(hasPendingBuy ? "/dashboard?tab=buy" : "/dashboard");
      },
      onError: (error: any) => {
        const errorData = error?.data ?? error?.response?.data ?? {};
        const msg = errorData?.message || t("login_error_default");
        setErrorMsg(msg);
      },
    },
  });

  const handleCodeChange = (idx: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...codeDigits];
    next[idx] = digit;
    setCodeDigits(next);
    if (digit && idx < 5) codeRefs.current[idx + 1]?.focus();
  };

  const handleCodeKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !codeDigits[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCodeDigits(pasted.split(""));
      codeRefs.current[5]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setErrorMsg("");
    loginMutation.mutate({ data: { email, password } });
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = codeDigits.join("");
    if (code.length < 6) return;
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("zynum_token") ?? "";
      const r = await fetch(`${API}/v1/auth/verify-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, code }),
      });
      const data = await r.json();
      if (!r.ok) { setErrorMsg(data.message || "Code invalide ou expiré"); return; }
      localStorage.setItem("zynum_token", data.token);
      sessionStorage.removeItem("zynum_dismissed_popups");
      sessionStorage.setItem("zynum_login_at", String(Date.now()));
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      toast({ title: "Connecté avec succès !", description: "Bienvenue sur ZyNum." });
      const hasPendingBuy = !!sessionStorage.getItem("zynum_buy_intent");
      setLocation(hasPendingBuy ? "/dashboard?tab=buy" : "/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAdmin2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = codeDigits.join("");
    if (code.length < 6) return;
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const r = await fetch(`${API}/v1/auth/verify-admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await r.json();
      if (!r.ok) { setErrorMsg(data.message || "Code invalide ou expiré"); return; }
      localStorage.setItem("zynum_token", data.token);
      sessionStorage.removeItem("zynum_dismissed_popups");
      sessionStorage.setItem("zynum_login_at", String(Date.now()));
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      toast({ title: "Connecté avec succès !", description: "Bienvenue sur ZyNum." });
      const hasPendingBuy = !!sessionStorage.getItem("zynum_buy_intent");
      setLocation(hasPendingBuy ? "/dashboard?tab=buy" : "/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = codeDigits.join("");
    if (code.length < 6) return;
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const r = await fetch(`${API}/v1/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await r.json();
      if (!r.ok) { setErrorMsg(data.message || "Code invalide ou expiré"); return; }
      localStorage.setItem("zynum_token", data.token);
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      toast({ title: "Email vérifié !", description: "Bienvenue sur ZyNum." });
      const hasPendingBuy = !!sessionStorage.getItem("zynum_buy_intent");
      setLocation(hasPendingBuy ? "/dashboard?tab=buy" : "/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    const endpoint = step === "verify_email" ? "/v1/auth/resend-verification" : "/v1/auth/login";
    if (step === "verify_admin_2fa") {
      loginMutation.mutate({ data: { email, password } });
      setCodeDigits(["", "", "", "", "", ""]);
      return;
    }
    if (step === "verify_2fa") {
      loginMutation.mutate({ data: { email, password } });
      return;
    }
    await fetch(`${API}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setCodeDigits(["", "", "", "", "", ""]);
    toast({ title: "Code renvoyé", description: "Vérifiez votre boîte email." });
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      await fetch(`${API}/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotSent(true);
    } finally {
      setForgotLoading(false);
    }
  };

  const inputClass = `${authInputClass} pl-12 pr-4`;

  return (
    <AuthShell>
      <div className="w-full max-w-md">

          {/* ── Step: credentials ── */}
          {step === "credentials" && !showForgot && (
            <>
              <div className="mb-8">
                <h1 className="text-center text-3xl font-extrabold leading-tight text-[#111827] mb-2">Content de te revoir</h1>
                <p className="text-center text-[15px] text-[#687386]">
                  Pas encore de compte ?{" "}
                  <Link href="/register" className={authLinkClass}>Créer un compte</Link>
                </p>
              </div>

              {errorMsg && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                   <label className="block text-[13px] font-semibold text-[#30394d] mb-2">Adresse email <span className="text-[#3157d5]">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                    <input type="email" autoComplete="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} style={{ paddingTop: "0.875rem", paddingBottom: "0.875rem" }} />
                  </div>
                </div>

                <div>
                   <div className="flex items-center justify-between mb-2">
                     <label className="text-[13px] font-semibold text-[#30394d]">Mot de passe <span className="text-[#3157d5]">*</span></label>
                     <button type="button" onClick={() => { setShowForgot(true); setForgotEmail(email); }} className="text-[12px] font-semibold text-[#3157d5] transition-colors hover:text-[#203da7]">
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                       autoComplete="current-password"
                       className={`${authInputClass} pl-12 pr-12`}
                      style={{ paddingTop: "0.875rem", paddingBottom: "0.875rem" }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                   <button
                  type="submit"
                  disabled={loginMutation.isPending || !email || !password}
                     className={`${authButtonClass} flex items-center justify-center gap-2`}
                >
                  {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Se connecter <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <p className="text-center text-[13px] text-[#8a94a6] mt-8 leading-relaxed">
                Avez-vous précédemment acheté sur ZyNum ?{" "}
                 <Link href="/register" className={authLinkClass}>Accéder à votre compte ici</Link>
              </p>
            </>
          )}

          {/* ── Step: forgot password ── */}
          {step === "credentials" && showForgot && (
            <>
               <button onClick={() => { setShowForgot(false); setForgotSent(false); }} className="flex items-center gap-1.5 text-sm text-[#687386] hover:text-[#3157d5] mb-6 transition-colors">
                <ArrowRight className="w-4 h-4 rotate-180" /> Retour
              </button>

              {!forgotSent ? (
                <>
                  <div className="mb-8">
                     <h1 className="text-center text-3xl font-extrabold text-[#111827] leading-tight mb-2">Mot de passe oublié ?</h1>
                     <p className="text-center text-[15px] text-[#687386]">Entrez votre email pour recevoir un lien de réinitialisation.</p>
                  </div>
                  <form onSubmit={handleForgot} className="space-y-5">
                    <div>
                       <label className="block text-[13px] font-semibold text-[#30394d] mb-2">Adresse email <span className="text-[#3157d5]">*</span></label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                        <input type="email" autoComplete="email" placeholder="votre@email.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required className={inputClass} style={{ paddingTop: "0.875rem", paddingBottom: "0.875rem" }} />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={forgotLoading || !forgotEmail}
                       className={`${authButtonClass} flex items-center justify-center gap-2`}
                    >
                      {forgotLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Envoyer le lien <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </form>
                </>
              ) : (
                 <div className="text-center py-8">
                   <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#d6e1ff] bg-[#eef2ff]">
                     <ShieldCheck className="h-8 w-8 text-[#3157d5]" />
                  </div>
                   <h2 className="text-2xl font-extrabold text-[#111827] mb-3">Email envoyé !</h2>
                   <p className="text-[15px] text-[#687386] max-w-xs mx-auto">
                    Si cet email correspond à un compte, vous recevrez un lien de réinitialisation dans quelques minutes.
                  </p>
                   <p className="mt-4 text-[13px] text-[#6f5b1d] bg-[#fff9e8] border border-[#f2e4ae] rounded-xl px-3 py-2 max-w-xs mx-auto text-left">
                    📩 Si vous ne trouvez pas l'email, vérifiez votre dossier <strong>spam / courrier indésirable</strong>.
                  </p>
                   <button onClick={() => { setShowForgot(false); setForgotSent(false); }} className={`mt-6 text-sm ${authLinkClass}`}>
                    Retour à la connexion
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── Step: 2FA or email verify code ── */}
          {(step === "verify_2fa" || step === "verify_admin_2fa" || step === "verify_email") && (
            <>
               <div className="mb-8">
                 <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d6e1ff] bg-[#eef2ff]">
                   <ShieldCheck className="h-7 w-7 text-[#3157d5]" />
                </div>
                 <h1 className="text-center text-3xl font-extrabold text-[#111827] leading-tight mb-2">
                    {step === "verify_email" ? "Vérifiez votre email ✉️" : "Vérification 🔑"}
                </h1>
                 <p className="text-center text-[15px] text-[#687386]">
                  {step === "verify_2fa"
                    ? "Vous n'avez pas utilisé ZyNum depuis plus de 3 jours. Entrez le code envoyé à :"
                    : step === "verify_admin_2fa"
                      ? "Entrez le code de sécurité à usage unique pour continuer :"
                      : "Entrez le code envoyé à :"}
                  <br />
                   {step !== "verify_admin_2fa" && <span className="font-semibold text-[#172033]">{email}</span>}
                </p>
                {step !== "verify_admin_2fa" && <p className="mt-3 text-[13px] text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  📩 Si vous ne trouvez pas l'email, vérifiez votre dossier <strong>spam / courrier indésirable</strong>.
                </p>}
              </div>

              {errorMsg && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  {errorMsg}
                </div>
              )}

               <form onSubmit={step === "verify_2fa" ? handleVerify2FA : step === "verify_admin_2fa" ? handleVerifyAdmin2FA : handleVerifyEmail}>
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
                  disabled={isSubmitting || codeDigits.join("").length < 6}
                   className={`${authButtonClass} flex items-center justify-center gap-2`}
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Confirmer <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

               <div className="flex items-center justify-between mt-5">
                 <button onClick={() => { setStep("credentials"); setErrorMsg(""); setCodeDigits(["", "", "", "", "", ""]); }} className="text-sm text-[#687386] hover:text-[#3157d5] transition-colors">
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
