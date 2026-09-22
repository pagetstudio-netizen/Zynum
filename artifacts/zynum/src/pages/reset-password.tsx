import React, { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Loader2, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthShell, authBlue, authButtonClass, authInputClass, authLinkClass } from "@/components/auth/auth-shell";

const API = "/api";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const params = new URLSearchParams(window.location.search);
  const emailFromLink = params.get("email") || "";
  const verifiedFromLink = params.get("verified") === "1";

  const [email, setEmail] = useState(emailFromLink);
  const [code, setCode] = useState("");
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const pwdMatch = confirmPassword ? newPassword === confirmPassword : true;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !newPassword) return;
    if (newPassword !== confirmPassword) { setErrorMsg("Les mots de passe ne correspondent pas."); return; }
    if (newPassword.length < 8) { setErrorMsg("Le mot de passe doit contenir au moins 8 caractères."); return; }

    const finalCode = verifiedFromLink ? undefined : codeDigits.join("");
    if (!verifiedFromLink && finalCode!.length < 6) { setErrorMsg("Entrez le code à 6 chiffres."); return; }

    setIsLoading(true);
    setErrorMsg("");
    try {
      const r = await fetch(`${API}/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: finalCode, newPassword }),
      });
      const data = await r.json();
      if (!r.ok) { setErrorMsg(data.message || "Erreur lors de la réinitialisation."); return; }
      setSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = `${authInputClass} pl-12 pr-4`;

  return (
    <AuthShell>
      <div className="w-full max-w-md">

          {success ? (
            <div className="text-center py-8">
               <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#d6e1ff] bg-[#eef2ff]">
                 <CheckCircle2 className="h-8 w-8 text-[#3157d5]" />
              </div>
               <h2 className="text-2xl font-extrabold text-[#111827] mb-3">Mot de passe modifié !</h2>
               <p className="text-[15px] text-[#687386] mb-6">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
              <button
                onClick={() => setLocation("/login")}
                 className={`${authButtonClass} flex items-center justify-center gap-2`}
              >
                Se connecter <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
               <div className="mb-8">
                 <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d6e1ff] bg-[#eef2ff]">
                   <ShieldCheck className="h-7 w-7 text-[#3157d5]" />
                </div>
                 <h1 className="text-center text-3xl font-extrabold text-[#111827] leading-tight mb-2">Nouveau mot de passe</h1>
                 <p className="text-center text-[15px] text-[#687386]">
                  {verifiedFromLink ? "Votre identité a été confirmée. Créez votre nouveau mot de passe." : "Entrez le code reçu par email et créez votre nouveau mot de passe."}
                </p>
                {!verifiedFromLink && (
                  <p className="mt-3 text-[13px] text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    📩 Si vous ne trouvez pas l'email, vérifiez votre dossier <strong>spam / courrier indésirable</strong>.
                  </p>
                )}
              </div>

              {errorMsg && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {!emailFromLink && (
                  <div>
                   <label className="block text-[13px] font-semibold text-[#30394d] mb-2">Adresse email <span className="text-[#3157d5]">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                      <input type="email" autoComplete="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} style={{ paddingTop: "0.875rem", paddingBottom: "0.875rem" }} />
                    </div>
                  </div>
                )}

                {!verifiedFromLink && (
                  <div>
                    <label className="block text-[13px] font-semibold text-[#30394d] mb-2">Code de vérification <span className="text-[#3157d5]">*</span></label>
                     <div className="flex justify-center gap-1.5 sm:gap-2" onPaste={handleCodePaste}>
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
                  </div>
                )}

                <div>
                     <label className="block text-[13px] font-semibold text-[#30394d] mb-2">Nouveau mot de passe <span className="text-[#3157d5]">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                    <input
                      type={showNew ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                       autoComplete="new-password"
                       className={`${authInputClass} pl-12 pr-12`}
                      style={{ paddingTop: "0.875rem", paddingBottom: "0.875rem" }}
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                     <label className="block text-[13px] font-semibold text-[#30394d] mb-2">Confirmer <span className="text-[#3157d5]">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className={`w-full pl-12 pr-12 rounded-xl text-gray-900 text-[15px] outline-none transition-all placeholder:text-gray-400 ${
                         !pwdMatch ? "border border-red-300 bg-red-50 focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                           : authInputClass
                      }`}
                      style={{ paddingTop: "0.875rem", paddingBottom: "0.875rem" }}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {!pwdMatch && <p className="text-xs text-red-600 mt-1.5 font-medium">Les mots de passe ne correspondent pas.</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                   className={`${authButtonClass} flex items-center justify-center gap-2`}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Enregistrer le nouveau mot de passe <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            </>
          )}
      </div>
    </AuthShell>
  );
}
