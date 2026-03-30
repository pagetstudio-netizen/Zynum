import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronRight, Loader2, CheckCircle2,
  AlertCircle, Phone, ExternalLink,
  ArrowLeft, Search, KeyRound, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import imgMTN         from "@assets/mtn_(1)_1763835082904-BVdEqpuz-1_1774832430292.png";
import imgOrangeMoney from "@assets/images_1774832430265.png";
import imgWave        from "@assets/wave_(1)_1763835083242-BDJmxeWc_(1)_1774832430315.png";
import imgMoov        from "@assets/moov_(1)_1763835082986-GKkwwfPK_1774832019539.png";
import imgAirtel      from "@assets/Airtel_logo-01_1774832430216.png";
import imgTMoney      from "@assets/images_(1)_1774832430242.png";

export interface OmnipayModalProps {
  open: boolean;
  onClose: () => void;
  amountXof: number;
  userId: string | number;
  onSuccess: () => void;
  userFirstName?: string;
  userLastName?: string;
}

type View      = "form" | "country-picker";
type PayState  = "idle" | "loading" | "wave" | "push" | "success" | "error";

interface OmniOperatorDef {
  id: string;
  label: string;
  logo: string;
  needsOtp: boolean;
  needsReturnUrl: boolean;
  otpHint?: string;
  validationHint?: string; // Instructions push (sans saisie de code)
}

interface OmniCountryDef {
  code: string;
  name: string;
  flag: string;
  prefix: string;
  currency: string;
  currencySymbol: string;
  operators: OmniOperatorDef[];
}

const OM_LOGO    = imgOrangeMoney;
const MTN_LOGO   = imgMTN;
const WAVE_LOGO  = imgWave;
const MOOV_LOGO  = imgMoov;
const AT_LOGO    = imgAirtel;
const TM_LOGO    = imgTMoney;
const FREE_LOGO  = "https://upload.wikimedia.org/wikipedia/fr/thumb/8/8d/Free_logo.svg/120px-Free_logo.svg.png";

const OMNIPAY_COUNTRIES: OmniCountryDef[] = [
  {
    code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", prefix: "225", currency: "XOF", currencySymbol: "FCFA",
    operators: [
      { id: "ORANGE_CI", label: "Orange Money", logo: OM_LOGO,   needsOtp: true,  needsReturnUrl: false, otpHint: "Composez #144*82# sur votre téléphone pour générer votre code OTP, puis saisissez-le ci-dessous." },
      { id: "MTN_CI",    label: "MTN MoMo",     logo: MTN_LOGO,  needsOtp: false, needsReturnUrl: false },
      { id: "MOOV_CI",   label: "Moov Money",   logo: MOOV_LOGO, needsOtp: false, needsReturnUrl: false },
      { id: "WAVE_CI",   label: "Wave",          logo: WAVE_LOGO, needsOtp: false, needsReturnUrl: true  },
    ],
  },
  {
    code: "SN", name: "Sénégal", flag: "🇸🇳", prefix: "221", currency: "XOF", currencySymbol: "FCFA",
    operators: [
      { id: "WAVE_SN",   label: "Wave",          logo: WAVE_LOGO, needsOtp: false, needsReturnUrl: true  },
      { id: "ORANGE_SN", label: "Orange Money",  logo: OM_LOGO,   needsOtp: false, needsReturnUrl: false },
      { id: "FREE_SN",   label: "Free Money",    logo: FREE_LOGO, needsOtp: false, needsReturnUrl: false },
    ],
  },
  {
    code: "BF", name: "Burkina Faso", flag: "🇧🇫", prefix: "226", currency: "XOF", currencySymbol: "FCFA",
    operators: [
      { id: "ORANGE_BF", label: "Orange Money", logo: OM_LOGO,   needsOtp: true,  needsReturnUrl: false, otpHint: "Composez *144*4*6*montant# sur votre téléphone pour générer votre code OTP, puis saisissez-le ci-dessous." },
      { id: "MOOV_BF",   label: "Moov Money",   logo: MOOV_LOGO, needsOtp: false, needsReturnUrl: false },
    ],
  },
  {
    code: "ML", name: "Mali", flag: "🇲🇱", prefix: "223", currency: "XOF", currencySymbol: "FCFA",
    operators: [
      { id: "ORANGE_ML", label: "Orange Money", logo: OM_LOGO,   needsOtp: false, needsReturnUrl: false, validationHint: "Veuillez valider le paiement sur votre téléphone Orange Money.\n\nSi vous ne recevez pas de notification, composez #144# sur votre téléphone, puis accédez au menu Paiement marchand (option 2).\n\nValidez l'opération en entrant votre code secret." },
      { id: "MOOV_ML",   label: "Moov Money",   logo: MOOV_LOGO, needsOtp: false, needsReturnUrl: false },
    ],
  },
  {
    code: "GN", name: "Guinée", flag: "🇬🇳", prefix: "224", currency: "GNF", currencySymbol: "GNF",
    operators: [
      { id: "ORANGE_GN", label: "Orange Money", logo: OM_LOGO,  needsOtp: false, needsReturnUrl: false },
      { id: "MTN_GN",    label: "MTN MoMo",     logo: MTN_LOGO, needsOtp: false, needsReturnUrl: false },
    ],
  },
  {
    code: "CM", name: "Cameroun", flag: "🇨🇲", prefix: "237", currency: "XAF", currencySymbol: "FCFA",
    operators: [
      { id: "MTN_CM",    label: "MTN MoMo",     logo: MTN_LOGO, needsOtp: false, needsReturnUrl: false },
      { id: "ORANGE_CM", label: "Orange Money", logo: OM_LOGO,  needsOtp: false, needsReturnUrl: false },
    ],
  },
  {
    code: "BJ", name: "Bénin", flag: "🇧🇯", prefix: "229", currency: "XOF", currencySymbol: "FCFA",
    operators: [
      { id: "MTN_BJ",  label: "MTN MoMo",   logo: MTN_LOGO,  needsOtp: false, needsReturnUrl: false },
      { id: "MOOV_BJ", label: "Moov Money", logo: MOOV_LOGO, needsOtp: false, needsReturnUrl: false },
    ],
  },
  {
    code: "TG", name: "Togo", flag: "🇹🇬", prefix: "228", currency: "XOF", currencySymbol: "FCFA",
    operators: [
      { id: "MOOV_TG",    label: "Moov Money", logo: MOOV_LOGO, needsOtp: false, needsReturnUrl: false },
      { id: "TOGOCEL_TG", label: "T-Money",    logo: TM_LOGO,   needsOtp: false, needsReturnUrl: false },
    ],
  },
  {
    code: "GH", name: "Ghana", flag: "🇬🇭", prefix: "233", currency: "GHS", currencySymbol: "GHS",
    operators: [
      { id: "MTN_GH",    label: "MTN MoMo",    logo: MTN_LOGO, needsOtp: false, needsReturnUrl: false },
      { id: "AIRTEL_GH", label: "AirtelTigo",  logo: AT_LOGO,  needsOtp: false, needsReturnUrl: false },
    ],
  },
  {
    code: "NE", name: "Niger", flag: "🇳🇪", prefix: "227", currency: "XOF", currencySymbol: "FCFA",
    operators: [
      { id: "MOOV_NE", label: "Moov Money", logo: MOOV_LOGO, needsOtp: false, needsReturnUrl: false },
    ],
  },
].sort((a, b) => a.name.localeCompare(b.name, "fr"));

/* ── Country Picker ─────────────────────────────────────────────── */
function CountryPicker({
  current,
  onSelect,
  onBack,
}: { current: OmniCountryDef; onSelect: (c: OmniCountryDef) => void; onBack: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 120); }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return OMNIPAY_COUNTRIES;
    return OMNIPAY_COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <motion.div
      key="cp"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.22 }}
      className="absolute inset-0 flex flex-col bg-white z-10"
      style={{ borderRadius: "inherit" }}
    >
      <div className="px-5 pt-5 pb-4 shrink-0 border-b border-gray-100">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /><span className="text-sm font-medium">Retour</span>
        </button>
        <h2 className="text-xl font-extrabold text-gray-900">Quel pays ?</h2>
        <p className="text-sm text-gray-500 mt-1">Sélectionnez votre pays Mobile Money.</p>
        <div className="relative mt-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Rechercher un pays…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-sm placeholder:text-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/15 transition"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        {filtered.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Aucun pays trouvé</p>}
        {filtered.map(c => {
          const isActive = c.code === current.code;
          return (
            <button
              key={c.code}
              onClick={() => onSelect(c)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border transition-all text-left ${
                isActive ? "border-orange-200 bg-orange-50/60" : "border-gray-100 bg-white hover:bg-gray-50"
              }`}
            >
              <span className="text-2xl shrink-0">{c.flag}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-[15px] ${isActive ? "text-orange-600" : "text-gray-900"}`}>{c.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {c.operators.length} opérateur{c.operators.length > 1 ? "s" : ""} · {c.currencySymbol}
                </p>
              </div>
              <div className="flex items-center -space-x-1.5 shrink-0">
                {c.operators.slice(0, 3).map(op => (
                  <div key={op.id} className="w-6 h-6 rounded-full bg-gray-100 border border-white overflow-hidden shadow-sm">
                    <img src={op.logo} alt={op.label} className="w-full h-full object-contain"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                ))}
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 ${isActive ? "text-orange-400" : "text-gray-300"}`} />
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ── Main modal ─────────────────────────────────────────────────── */
export function OmnipayModal({
  open, onClose, amountXof, userId, onSuccess,
  userFirstName, userLastName,
}: OmnipayModalProps) {
  const [view, setView]     = useState<View>("form");
  const [state, setState]   = useState<PayState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [txReference, setTxReference] = useState("");

  const defaultCountry = OMNIPAY_COUNTRIES.find(c => c.code === "CI")!;
  const [country, setCountry]   = useState<OmniCountryDef>(defaultCountry);
  const [operator, setOperator] = useState<OmniOperatorDef>(defaultCountry.operators[0]);
  const [phone, setPhone]       = useState("");
  const [otp, setOtp]           = useState("");

  const apiBase      = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCount    = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    pollCount.current = 0;
  }, []);

  function reset() {
    stopPolling();
    setState("idle");
    setErrorMsg("");
    setPaymentUrl("");
    setTxReference("");
    setOtp("");
  }

  function handleClose() { reset(); setView("form"); onClose(); }

  function selectCountry(c: OmniCountryDef) {
    setCountry(c);
    setOperator(c.operators[0]);
    setPhone("");
    reset();
    setView("form");
  }

  useEffect(() => { if (open) { reset(); setView("form"); } }, [open]);
  useEffect(() => () => stopPolling(), [stopPolling]);

  const pollStatus = useCallback(async (reference: string) => {
    pollCount.current += 1;
    if (pollCount.current > 120) { stopPolling(); return; }
    try {
      const res  = await fetch(`${apiBase}/api/v1/payments/omnipay/confirm`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ reference, userId: String(userId) }),
      });
      const json = (await res.json()) as Record<string, unknown>;
      if (json.credited) {
        stopPolling();
        setState("success");
        onSuccess();
        setTimeout(() => { reset(); setView("form"); onClose(); }, 2800);
      } else if (json.failed) {
        stopPolling();
        setState("error");
        setErrorMsg(String(json.message ?? "Transaction échouée. Veuillez réessayer."));
      }
    } catch { /* réseau — on réessaie */ }
  }, [apiBase, userId, stopPolling, onSuccess, onClose]);

  function startPolling(reference: string) {
    stopPolling();
    pollCount.current = 0;
    void pollStatus(reference);
    pollRef.current = setInterval(() => pollStatus(reference), 2000);
  }

  async function submit() {
    if (!phone.trim()) {
      setState("error");
      setErrorMsg("Veuillez entrer votre numéro de téléphone.");
      return;
    }
    if (operator.needsOtp && !otp.trim()) {
      setState("error");
      setErrorMsg("Veuillez entrer votre code OTP Orange Money.");
      return;
    }

    setState("loading");
    setErrorMsg("");

    try {
      const body: Record<string, unknown> = {
        amount:     Math.round(amountXof),
        userId:     String(userId),
        phone:      phone.replace(/\D/g, ""),
        operatorId: operator.id,
        firstName:  userFirstName ?? "ZyNum",
        lastName:   userLastName  ?? `User${userId}`,
      };
      if (operator.needsOtp) body.otp = otp.trim();

      const res  = await fetch(`${apiBase}/api/v1/payments/omnipay/initiate`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify(body),
      });
      const json = (await res.json()) as Record<string, unknown>;

      if (!res.ok || String(json.success) !== "1") {
        setState("error");
        const msg = String(json.message ?? json.error ?? "Paiement refusé. Vérifiez vos informations.");
        setErrorMsg(msg);
        return;
      }

      const reference = String(json.reference ?? "");
      setTxReference(reference);

      if (json.payment_url) {
        setPaymentUrl(String(json.payment_url));
        setState("wave");
        if (reference) startPolling(reference);
      } else {
        setState("push");
        if (reference) startPolling(reference);
      }

    } catch {
      setState("error");
      setErrorMsg("Erreur de connexion. Veuillez réessayer.");
    }
  }

  const isForm = state === "idle" || state === "loading" || state === "error";
  const inputCls = "w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/15 transition";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1,    opacity: 1, y: 0 }}
            exit={{   scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="relative w-full max-w-md bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden"
            style={{ maxHeight: "90vh" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Country picker slide-over */}
            <AnimatePresence>
              {view === "country-picker" && (
                <CountryPicker current={country} onSelect={selectCountry} onBack={() => setView("form")} />
              )}
            </AnimatePresence>

            <div className="flex flex-col" style={{ maxHeight: "90vh" }}>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
                <div>
                  <h2 className="text-gray-900 font-bold text-lg leading-tight">Mobile Money</h2>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Montant :{" "}
                    <span className="text-orange-500 font-bold">
                      {Math.round(amountXof).toLocaleString("fr-FR")} FCFA
                    </span>
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1">

                {/* ── Wave redirect screen ── */}
                {state === "wave" && (
                  <div className="p-6 space-y-5">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
                        <img src={WAVE_LOGO} alt="Wave" className="w-14 h-14 object-contain"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-gray-900 font-bold text-lg">Paiement Wave</p>
                        <p className="text-gray-500 text-sm">Cliquez sur le bouton ci-dessous pour valider votre paiement dans l'application Wave.</p>
                      </div>
                      {paymentUrl && (
                        <a
                          href={paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Payer avec Wave
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-2 py-2">
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map(i => (
                          <span key={i} className="w-2 h-2 rounded-full bg-orange-400/60"
                            style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-400">Détection automatique du paiement…</p>
                    </div>
                    <Button variant="outline" onClick={handleClose} className="w-full rounded-xl">Annuler</Button>
                    {txReference && <p className="text-center text-xs text-gray-300">Réf : {txReference}</p>}
                  </div>
                )}

                {/* ── Push waiting screen ── */}
                {state === "push" && (
                  <div className="flex flex-col items-center justify-center py-10 px-6 gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-orange-50 border-2 border-orange-100 flex items-center justify-center shadow-lg">
                        <img src={operator.logo} alt={operator.label} className="w-12 h-12 object-contain rounded-full"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                      <span className="absolute inset-0 rounded-full border-2 border-orange-300/40 animate-ping" />
                    </div>
                    <div className="text-center space-y-1.5">
                      <p className="text-gray-900 font-bold text-lg">Confirmez sur votre téléphone</p>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        Une demande a été envoyée à votre numéro{" "}
                        <span className="text-gray-900 font-semibold">{phone}</span>.<br />
                        Validez dans votre app <span className="font-semibold text-gray-700">{operator.label}</span>.
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2">
                        {[0, 1, 2].map(i => (
                          <span key={i} className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-orange-400 to-red-400"
                            style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 font-medium">En attente de confirmation…</p>
                    </div>
                    <div className="w-full bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3">
                      {[
                        { n: 1, text: "Ouvrez votre application " + operator.label, done: true },
                        { n: 2, text: "Acceptez la demande de paiement",             done: false },
                        { n: 3, text: "Votre solde est crédité automatiquement",     done: false },
                      ].map(s => (
                        <div key={s.n} className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${s.done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                            {s.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.n}
                          </div>
                          <p className={`text-xs ${s.done ? "text-gray-700 font-medium" : "text-gray-500"}`}>{s.text}</p>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" onClick={handleClose} className="w-full rounded-xl">Annuler</Button>
                    {txReference && <p className="text-center text-xs text-gray-300">Réf : {txReference}</p>}
                  </div>
                )}

                {/* ── Success screen ── */}
                {state === "success" && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center justify-center py-14 px-6 gap-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30"
                    >
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </motion.div>
                    <div className="text-center space-y-1">
                      <p className="text-gray-900 font-bold text-xl">Paiement confirmé !</p>
                      <p className="text-gray-500 text-sm">Votre solde a été crédité avec succès.</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />Solde mis à jour
                    </div>
                  </motion.div>
                )}

                {/* ── Payment form ── */}
                {isForm && (
                  <div className="p-5 space-y-4">

                    {/* Country selector */}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-2">Pays</label>
                      <button
                        onClick={() => setView("country-picker")}
                        className="w-full flex items-center gap-3 h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all text-left group"
                      >
                        <span className="text-2xl leading-none">{country.flag}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-semibold text-sm leading-tight">{country.name}</p>
                          <p className="text-gray-400 text-xs">{country.operators.length} opérateur{country.operators.length > 1 ? "s" : ""} · {country.currencySymbol}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                      </button>
                    </div>

                    {/* Operator selector */}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-2">Opérateur</label>
                      <div className={`grid gap-2 ${country.operators.length <= 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
                        {country.operators.map(op => (
                          <button
                            key={op.id}
                            onClick={() => { setOperator(op); setOtp(""); }}
                            className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border text-xs font-semibold transition-all ${
                              operator.id === op.id
                                ? "border-orange-200 bg-orange-50/60 text-gray-900 shadow-sm"
                                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
                              <img src={op.logo} alt={op.label} className="w-full h-full object-contain"
                                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            </div>
                            <span className="text-center leading-tight">{op.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Phone input */}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-2">Numéro de téléphone</label>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1.5 h-11 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm shrink-0 select-none">
                          <span>{country.flag}</span>
                          <span className="text-gray-400 text-xs">+{country.prefix}</span>
                        </div>
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="tel"
                            placeholder="07 07 00 00 01"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="w-full h-11 pl-9 pr-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/15 transition"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1.5">Saisissez le numéro sans l'indicatif du pays</p>
                    </div>

                    {/* OTP input — only for operators that need it */}
                    {operator.needsOtp && (
                      <div className="space-y-2">
                        {operator.otpHint && (
                          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-orange-50 border border-orange-200">
                            <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                            <p className={`${operator.otpHint.length > 80 ? "text-[10px]" : "text-xs"} text-orange-700 leading-relaxed`}>
                              {operator.otpHint}
                            </p>
                          </div>
                        )}
                        <div>
                          <label className="text-xs font-semibold text-gray-600 block mb-2">
                            Code OTP <span className="text-orange-500">*</span>
                          </label>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="Ex : 1234"
                              maxLength={8}
                              value={otp}
                              onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                              className={`${inputCls} pl-9 font-mono tracking-widest`}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Validation push — operators without OTP code input (ex: Orange Mali) */}
                    {!operator.needsOtp && operator.validationHint && (
                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-orange-50 border border-orange-200">
                        <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                        <div className="space-y-1.5">
                          {operator.validationHint.split("\n\n").map((para, i) => (
                            <p key={i} className={`${operator.validationHint!.length > 150 ? "text-[10px]" : "text-xs"} text-orange-700 leading-relaxed`}>
                              {para}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Wave info */}
                    {operator.needsReturnUrl && (
                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-100">
                        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700 leading-relaxed">
                          Vous serez redirigé vers l'application <strong>Wave</strong> pour valider le paiement.
                        </p>
                      </div>
                    )}

                    {/* Error */}
                    {state === "error" && (
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{errorMsg}</p>
                      </div>
                    )}

                    {/* Submit */}
                    <Button
                      onClick={submit}
                      disabled={state === "loading"}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold shadow-lg shadow-orange-500/25 disabled:opacity-60"
                    >
                      {state === "loading" ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Traitement en cours…</>
                      ) : (
                        <>Payer {Math.round(amountXof).toLocaleString("fr-FR")} FCFA<ChevronRight className="w-4 h-4 ml-2" /></>
                      )}
                    </Button>

                    <p className="text-center text-xs text-gray-400 pb-1">
                      Paiement sécurisé · Powered by <span className="text-gray-700 font-semibold">OmniPay</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
