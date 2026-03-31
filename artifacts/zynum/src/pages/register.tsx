import React, { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { useRegisterUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";

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
    registerMutation.mutate({ data: { name: fullName, email, password, confirmPassword } });
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

  const inputBase =
    "w-full pl-11 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-[15px] outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-500/15 focus:bg-white placeholder:text-gray-400";

  const pwdMatch = confirmPassword ? password === confirmPassword : true;

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">

      {/* Left panel */}
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

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 bg-white overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md">
              <img src="/logo.jpg" alt="ZyNum" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-lg text-gray-900 tracking-tight">ZyNum</span>
          </div>

          {/* ── Step: form ── */}
          {step === "form" && (
            <>
              <div className="mb-7">
                <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">Créer un compte</h1>
                <p className="text-[15px] text-gray-500">
                  Déjà utilisateur ?{" "}
                  <Link href="/login" className="text-red-500 font-semibold hover:text-red-600 transition-colors">Connectez-vous ici</Link>
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
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Prénom <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" placeholder="Jean" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className={inputBase} style={{ paddingTop: "0.8rem", paddingBottom: "0.8rem" }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Nom <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" placeholder="Dupont" value={lastName} onChange={(e) => setLastName(e.target.value)} required className={inputBase} style={{ paddingTop: "0.8rem", paddingBottom: "0.8rem" }} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Adresse email <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputBase} style={{ paddingTop: "0.8rem", paddingBottom: "0.8rem" }} />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Mot de passe <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                      className="w-full pl-11 pr-11 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-[15px] outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-500/15 focus:bg-white placeholder:text-gray-400"
                      style={{ paddingTop: "0.8rem", paddingBottom: "0.8rem" }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Confirmer le mot de passe <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={`w-full pl-11 pr-11 rounded-xl text-gray-900 text-[15px] outline-none transition-all placeholder:text-gray-400 ${
                        !pwdMatch ? "bg-red-50 border border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-500/15"
                          : "bg-gray-50 border border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-500/15 focus:bg-white"
                      }`}
                      style={{ paddingTop: "0.8rem", paddingBottom: "0.8rem" }}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {!pwdMatch && <p className="text-xs text-red-600 mt-1.5 font-medium">Les mots de passe ne correspondent pas.</p>}
                </div>

                <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
                  <div className="relative mt-0.5 shrink-0" onClick={() => setAcceptTerms(!acceptTerms)}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${acceptTerms ? "bg-red-500 border-red-500" : "border-gray-300 bg-white hover:border-red-400"}`}>
                      {acceptTerms && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </div>
                  <span className="text-[14px] text-gray-500 leading-snug">
                    J'accepte les{" "}
                    <Link href="/terms" className="text-red-500 font-semibold hover:text-red-600 transition-colors">termes et conditions</Link>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={registerMutation.isPending || !firstName || !email || !password || !confirmPassword || !acceptTerms || password !== confirmPassword}
                  className="w-full py-4 rounded-xl font-bold text-white text-[16px] transition-all mt-1 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] bg-gradient-to-r from-red-500 to-primary hover:from-red-600 hover:to-primary/90 shadow-lg shadow-red-500/30"
                >
                  {registerMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Créer mon compte <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <p className="text-center text-[13px] text-gray-400 mt-8 leading-relaxed">
                Avez-vous précédemment acheté sur ZyNum ?{" "}
                <Link href="/login" className="text-red-500 font-semibold hover:text-red-600 transition-colors">Accéder à vos achats ici</Link>
              </p>
            </>
          )}

          {/* ── Step: verify email ── */}
          {step === "verify" && (
            <>
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-5">
                  <ShieldCheck className="w-7 h-7 text-red-500" />
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">Vérifiez votre email ✉️</h1>
                <p className="text-[15px] text-gray-500">
                  Un code à 6 chiffres a été envoyé à :<br />
                  <span className="font-semibold text-gray-800">{pendingEmail}</span>
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

              <form onSubmit={handleVerify}>
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
                  disabled={isVerifying || codeDigits.join("").length < 6}
                  className="w-full py-4 rounded-xl font-bold text-white text-[16px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] bg-gradient-to-r from-red-500 to-primary hover:from-red-600 hover:to-primary/90 shadow-lg shadow-red-500/30"
                >
                  {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Activer mon compte <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <div className="flex items-center justify-between mt-5">
                <button onClick={() => { setStep("form"); setErrorMsg(""); setCodeDigits(["", "", "", "", "", ""]); }} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
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
