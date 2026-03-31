import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { useLoginUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";

const API = "/api";

type Step = "credentials" | "verify_2fa" | "verify_email";

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
        const msg = error?.response?.data?.message || t("login_error_default");
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

  const inputClass =
    "w-full h-13 pl-12 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-[15px] outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-500/15 focus:bg-white placeholder:text-gray-400";

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">

      {/* Left panel */}
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

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md">
              <img src="/logo.jpg" alt="ZyNum" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-lg text-gray-900 tracking-tight">ZyNum</span>
          </div>

          {/* ── Step: credentials ── */}
          {step === "credentials" && !showForgot && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">Bon retour 👋</h1>
                <p className="text-[15px] text-gray-500">
                  Pas encore de compte ?{" "}
                  <Link href="/register" className="text-red-500 font-semibold hover:text-red-600 transition-colors">Créer un compte</Link>
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
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">Adresse email <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                    <input type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} style={{ paddingTop: "0.875rem", paddingBottom: "0.875rem" }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[13px] font-semibold text-gray-700">Mot de passe <span className="text-red-500">*</span></label>
                    <button type="button" onClick={() => { setShowForgot(true); setForgotEmail(email); }} className="text-[12px] text-red-500 font-semibold hover:text-red-600 transition-colors">
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
                      className="w-full pl-12 pr-12 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-[15px] outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-500/15 focus:bg-white placeholder:text-gray-400"
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
                  className="w-full py-4 rounded-xl font-bold text-white text-[16px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] bg-gradient-to-r from-red-500 to-primary hover:from-red-600 hover:to-primary/90 shadow-lg shadow-red-500/30"
                >
                  {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Se connecter <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <p className="text-center text-[13px] text-gray-400 mt-8 leading-relaxed">
                Avez-vous précédemment acheté sur ZyNum ?{" "}
                <Link href="/register" className="text-red-500 font-semibold hover:text-red-600 transition-colors">Accéder à votre compte ici</Link>
              </p>
            </>
          )}

          {/* ── Step: forgot password ── */}
          {step === "credentials" && showForgot && (
            <>
              <button onClick={() => { setShowForgot(false); setForgotSent(false); }} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
                <ArrowRight className="w-4 h-4 rotate-180" /> Retour
              </button>

              {!forgotSent ? (
                <>
                  <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">Mot de passe oublié 🔐</h1>
                    <p className="text-[15px] text-gray-500">Entrez votre email pour recevoir un lien de réinitialisation.</p>
                  </div>
                  <form onSubmit={handleForgot} className="space-y-5">
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-2">Adresse email <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                        <input type="email" placeholder="votre@email.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required className={inputClass} style={{ paddingTop: "0.875rem", paddingBottom: "0.875rem" }} />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={forgotLoading || !forgotEmail}
                      className="w-full py-4 rounded-xl font-bold text-white text-[16px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] bg-gradient-to-r from-red-500 to-primary hover:from-red-600 hover:to-primary/90 shadow-lg shadow-red-500/30"
                    >
                      {forgotLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Envoyer le lien <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-5">
                    <ShieldCheck className="w-8 h-8 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Email envoyé !</h2>
                  <p className="text-[15px] text-gray-500 max-w-xs mx-auto">
                    Si cet email correspond à un compte, vous recevrez un lien de réinitialisation dans quelques minutes.
                  </p>
                  <p className="mt-4 text-[13px] text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 max-w-xs mx-auto text-left">
                    📩 Si vous ne trouvez pas l'email, vérifiez votre dossier <strong>spam / courrier indésirable</strong>.
                  </p>
                  <button onClick={() => { setShowForgot(false); setForgotSent(false); }} className="mt-6 text-sm text-red-500 font-semibold hover:text-red-600 transition-colors">
                    Retour à la connexion
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── Step: 2FA or email verify code ── */}
          {(step === "verify_2fa" || step === "verify_email") && (
            <>
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-5">
                  <ShieldCheck className="w-7 h-7 text-red-500" />
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">
                  {step === "verify_2fa" ? "Vérification 🔑" : "Vérifiez votre email ✉️"}
                </h1>
                <p className="text-[15px] text-gray-500">
                  {step === "verify_2fa"
                    ? "Vous n'avez pas utilisé ZyNum depuis plus de 3 jours. Entrez le code envoyé à :"
                    : "Entrez le code envoyé à :"}
                  <br />
                  <span className="font-semibold text-gray-800">{email}</span>
                </p>
                <p className="mt-3 text-[13px] text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  📩 Si vous ne trouvez pas l'email, vérifiez votre dossier <strong>spam / courrier indésirable</strong>.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <form onSubmit={step === "verify_2fa" ? handleVerify2FA : handleVerifyEmail}>
                <div className="flex gap-2 justify-center mb-6" onPaste={handleCodePaste}>
                  {codeDigits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => { codeRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-gray-50 text-gray-900 outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-500/15 focus:bg-white"
                      style={{ borderColor: d ? "#f87171" : undefined }}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || codeDigits.join("").length < 6}
                  className="w-full py-4 rounded-xl font-bold text-white text-[16px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] bg-gradient-to-r from-red-500 to-primary hover:from-red-600 hover:to-primary/90 shadow-lg shadow-red-500/30"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Confirmer <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <div className="flex items-center justify-between mt-5">
                <button onClick={() => { setStep("credentials"); setErrorMsg(""); setCodeDigits(["", "", "", "", "", ""]); }} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  ← Retour
                </button>
                <button onClick={handleResend} className="text-sm text-red-500 font-semibold hover:text-red-600 transition-colors">
                  Renvoyer le code
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
