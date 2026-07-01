import React, { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Phone, Wallet, Zap, Globe2,
  Smartphone, CheckCircle, Star,
} from "lucide-react";
import { useGetServices } from "@workspace/api-client-react";

import appDouble from "@assets/20260701_162442_1782923584243.png";
import appHand from "@assets/20260701_161314_1782923584332.png";
import mobileMoney from "@assets/20260701_160702_1782923584360.jpg";
import cardsStack from "@assets/45_1782923553826.png";
import cryptoIcon from "@assets/cryptocurrency-3d-icon-png-download-5701572_1782924013725.png";
import mobileMoneyLogos from "@assets/20260619_074037_1782924110611.png";
import iconGift from "@assets/téléchargement_(66)_1782924013839.png";
import iconWithdraw from "@assets/withdraw-icon-DFsum39V_(1)_1782924013862.png";
import iconSupport from "@assets/mine-mod-cs-DtBQ0Sp0_1782924013880.png";
import iconLock from "@assets/mine-mod-change-pwd-D4tL_Aft_1782924013897.png";
import iconCard from "@assets/mine-mod-bankcard-CLOhqwHj_1782924013913.png";
import promoIdentite from "@assets/IMG-20260701-WA0006_1782925117480.jpg";
import promoAffiliation from "@assets/ZyNum_pub1_1782925134917.jpg";
import promoMonde from "@assets/zynum_pub2_1782925134966.jpg";

const ICON_ORANGE = "brightness(0) saturate(100%) invert(58%) sepia(97%) saturate(2476%) hue-rotate(346deg) brightness(1.1) contrast(1)";

const O = "#f97316";
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: "easeOut" },
});

function SvcLogo({ icon, color, name, size = 44 }: { icon: string; color: string; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const light = ["#FFFC00", "#F0B90B", "#FAE100", "#FFC629"].some(c => color.toUpperCase() === c);
  return (
    <div style={{ width: size, height: size, background: color, borderRadius: size * 0.22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {!failed && icon ? (
        <img src={icon} alt={name} style={{ width: size * 0.58, height: size * 0.58, objectFit: "contain" }} onError={() => setFailed(true)} />
      ) : (
        <span style={{ fontWeight: 700, fontSize: size * 0.36, color: light ? "#000" : "#fff", lineHeight: 1 }}>{name.slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  );
}

const FAQS = [
  { q: "Comment obtenir un numéro virtuel ?", a: "Créez un compte, rechargez votre solde, puis choisissez le service et le pays. Votre numéro est livré en moins de 30 secondes." },
  { q: "Quels moyens de paiement acceptez-vous ?", a: "Nous acceptons Orange Money, MTN Mobile Money, Wave, Moov Money, ainsi que les cryptomonnaies (USDT, BTC, ETH) et d'autres méthodes." },
  { q: "Comment fonctionne le programme de parrainage ?", a: "Partagez votre lien de parrainage. Quand quelqu'un s'inscrit et recharge, vous gagnez 10% de commission sur chaque achat, automatiquement crédité sur votre solde." },
  { q: "Les numéros sont-ils réutilisables ?", a: "Non, les numéros sont à usage unique pour protéger votre confidentialité. Un nouveau numéro est assigné à chaque commande." },
  { q: "Y a-t-il une application mobile ?", a: "Oui ! Téléchargez l'application ZyNum sur Google Play et App Store pour accéder à vos numéros partout, à tout moment." },
  { q: "Mon solde expire-t-il ?", a: "Non, votre solde ne expire pas. Il reste disponible tant que votre compte est actif." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left"
      style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden", display: "block", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", gap: 16 }}>
        <span style={{ color: "#111827", fontWeight: 600, fontSize: 15 }}>{q}</span>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", border: "1px solid #e5e7eb",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          transition: "all 0.3s", transform: open ? "rotate(45deg)" : "rotate(0deg)",
          color: open ? O : "#9ca3af", background: open ? "rgba(249,115,22,0.08)" : "#f9fafb"
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
            <div style={{ padding: "0 24px 20px", color: "#6b7280", fontSize: 14, lineHeight: 1.7, borderTop: "1px solid #f3f4f6" }}>
              <div style={{ paddingTop: 16 }}>{a}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

export default function Home() {
  const { data: servicesData } = useGetServices();
  const FEATURED_IDS = ["whatsapp", "telegram", "facebook", "tiktok", "instagram", "google", "twitter", "discord", "snapchat", "netflix"];
  const all = servicesData?.services ?? [];
  const featured = FEATURED_IDS.map(id => all.find(s => s.id === id)).filter(Boolean) as typeof all;

  const STEPS = [
    { num: "01", icon: <Smartphone className="w-6 h-6" />, title: "Créez votre compte", desc: "Inscription gratuite en 30 secondes. Aucune carte bancaire requise pour commencer." },
    { num: "02", icon: <Wallet className="w-6 h-6" />, title: "Rechargez votre solde", desc: "Orange Money, Wave, MTN Mobile Money, USDT, BTC ou cartes crypto — vous choisissez." },
    { num: "03", icon: <Phone className="w-6 h-6" />, title: "Recevez votre SMS", desc: "Choisissez le service, le pays, et recevez votre code OTP en moins de 30 secondes." },
  ];

  return (
    <div style={{ background: "#f9fafb", color: "#111827", overflowX: "hidden" }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden", background: "#fff" }}>
        {/* subtle grid bg */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
        {/* orange glow */}
        <div style={{ position: "absolute", top: "20%", right: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)", zIndex: 0, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 70%)", zIndex: 0, pointerEvents: "none" }} />

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "120px 24px 80px", position: "relative", zIndex: 1, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 64, width: "100%" }}>
          {/* Left */}
          <div style={{ flex: "1 1 480px", minWidth: 0 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(249,115,22,0.10)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 999, padding: "6px 16px", marginBottom: 28 }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: O, display: "inline-block" }} />
              <span style={{ color: O, fontSize: 13, fontWeight: 600 }}>Numéros virtuels · Livraison instantanée</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-1.5px", marginBottom: 24, color: "#111827" }}
            >
              Recevez vos<br />
              <span style={{ color: O }}>codes OTP</span><br />
              partout dans le monde
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              style={{ color: "#6b7280", fontSize: 18, lineHeight: 1.7, maxWidth: 480, marginBottom: 40 }}
            >
              Numéros virtuels temporaires pour Telegram, WhatsApp, Google et 200+ services.
              Payez par Mobile Money ou crypto. Livré en moins de 30 secondes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 40 }}
            >
              <Link href="/register">
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: O, color: "#fff", padding: "16px 28px", borderRadius: 14, fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 4px 20px rgba(249,115,22,0.35)" }}>
                  Commencer gratuitement <ArrowRight size={18} />
                </div>
              </Link>
              <Link href="/buy">
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e5e7eb", color: "#374151", padding: "16px 28px", borderRadius: 14, fontWeight: 600, fontSize: 16, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  Acheter un numéro
                </div>
              </Link>
            </motion.div>

            {/* Download buttons */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
              style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 48 }}
            >
              <a href="#" style={{ display: "flex", alignItems: "center", gap: 12, background: "#111827", border: "none", borderRadius: 12, padding: "12px 20px", textDecoration: "none", cursor: "pointer" }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.32.07 2.22.72 2.98.75.98-.16 1.93-.82 2.97-.77 1.27.07 2.22.55 2.83 1.44-2.59 1.55-1.98 4.95.34 5.94-.52 1.28-1.1 2.54-2.12 3.5zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, lineHeight: 1 }}>Télécharger sur</div>
                  <div style={{ color: "#fff", fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>App Store</div>
                </div>
              </a>
              <a href="https://play.google.com" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, background: "#111827", borderRadius: 12, padding: "12px 20px", textDecoration: "none", cursor: "pointer" }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                  <path d="M3 20.5v-17c0-.83 1-1.3 1.6-.75l14 8.5c.54.33.54 1.17 0 1.5l-14 8.5c-.6.55-1.6.08-1.6-.75z" fill="#34A853"/>
                  <path d="M3 3.5l8.5 8.5L3 20.5V3.5z" fill="#EA4335"/>
                  <path d="M3 3.5l8.5 8.5 5-5L3 3.5z" fill="#FBBC04"/>
                  <path d="M3 20.5l8.5-8.5 5 5L3 20.5z" fill="#0F9D58"/>
                </svg>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, lineHeight: 1 }}>Disponible sur</div>
                  <div style={{ color: "#fff", fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>Google Play</div>
                </div>
              </a>
            </motion.div>

            {/* Trust pills */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {["50K+ utilisateurs", "180+ pays", "200+ services", "99.9% uptime"].map((label) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 14px", fontSize: 13, color: "#6b7280", fontWeight: 500 }}>
                  <CheckCircle size={12} color={O} /> {label}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: app mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            style={{ flex: "1 1 380px", display: "flex", justifyContent: "center", position: "relative" }}
          >
            <div style={{ position: "relative", maxWidth: 480, width: "100%" }}>
              <img src={appDouble} alt="ZyNum App" style={{ width: "100%", objectFit: "contain", filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.18))" }} />
              <div style={{ position: "absolute", top: "8%", left: "-5%", background: O, borderRadius: 14, padding: "10px 18px", boxShadow: "0 8px 24px rgba(249,115,22,0.4)", display: "flex", alignItems: "center", gap: 8 }}>
                <Zap size={16} color="#fff" />
                <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>Livraison instantanée</span>
              </div>
              <div style={{ position: "absolute", bottom: "12%", right: "-5%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "12px 18px", boxShadow: "0 8px 24px rgba(0,0,0,0.10)", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(249,115,22,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Star size={16} color={O} fill={O} />
                </div>
                <div>
                  <div style={{ color: "#111827", fontSize: 13, fontWeight: 700 }}>4.9 / 5 étoiles</div>
                  <div style={{ color: "#9ca3af", fontSize: 11 }}>50K+ avis</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px", display: "flex", flexWrap: "wrap", justifyContent: "space-around", gap: 24 }}>
          {[
            { val: "50 000+", label: "Clients actifs" },
            { val: "180+", label: "Pays disponibles" },
            { val: "200+", label: "Services supportés" },
            { val: "30 sec", label: "Délai de livraison" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: O, letterSpacing: "-1px" }}>{s.val}</div>
              <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CARTES PROMO ───────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <motion.div {...fadeUp()} style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>Nos offres</p>
            <h2 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 800, letterSpacing: "-1px", color: "#111827" }}>
              Tout ce que vous pouvez faire avec ZyNum
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {/* Carte 1 – Identité */}
            <motion.div {...fadeUp(0.0)} whileHover={{ y: -6 } as any} style={{ borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.10)", background: "#fff", cursor: "pointer", border: "1px solid #e5e7eb" }}>
              <div style={{ position: "relative", height: 280, overflow: "hidden" }}>
                <img src={promoIdentite} alt="Créer votre identité" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                />
              </div>
              <div style={{ padding: "24px 28px 28px" }}>
                <div style={{ display: "inline-block", background: "rgba(249,115,22,0.10)", color: O, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: 6, padding: "4px 10px", marginBottom: 12 }}>
                  Numéro virtuel
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 8, lineHeight: 1.3 }}>
                  Créez votre identité numérique
                </h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65, marginBottom: 20 }}>
                  Un compte, un numéro. Simplifiez vos validations sur tous vos services préférés, depuis n'importe où.
                </p>
                <Link href="/register">
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: O, color: "#fff", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    Commencer <ArrowRight size={14} />
                  </div>
                </Link>
              </div>
            </motion.div>

            {/* Carte 2 – Affiliation */}
            <motion.div {...fadeUp(0.08)} whileHover={{ y: -6 } as any} style={{ borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.10)", background: "#fff", cursor: "pointer", border: "1px solid #e5e7eb" }}>
              <div style={{ position: "relative", height: 280, overflow: "hidden" }}>
                <img src={promoAffiliation} alt="ZyNum Affiliation" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                />
                <div style={{ position: "absolute", top: 16, right: 16, background: "#fff", borderRadius: 10, padding: "6px 14px", fontWeight: 800, fontSize: 15, color: "#111827", boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
                  +10% <span style={{ color: O }}>commission</span>
                </div>
              </div>
              <div style={{ padding: "24px 28px 28px" }}>
                <div style={{ display: "inline-block", background: "rgba(34,197,94,0.10)", color: "#16a34a", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: 6, padding: "4px 10px", marginBottom: 12 }}>
                  Affiliation
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 8, lineHeight: 1.3 }}>
                  Gagnez en invitant vos amis
                </h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65, marginBottom: 20 }}>
                  Touchez plus de 10% de commission sur chaque achat de vos filleuls. Les gains sont crédités automatiquement.
                </p>
                <Link href="/register">
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#16a34a", color: "#fff", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    Rejoindre le programme <ArrowRight size={14} />
                  </div>
                </Link>
              </div>
            </motion.div>

            {/* Carte 3 – Monde entier */}
            <motion.div {...fadeUp(0.16)} whileHover={{ y: -6 } as any} style={{ borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.10)", background: "#fff", cursor: "pointer", border: "1px solid #e5e7eb" }}>
              <div style={{ position: "relative", height: 280, overflow: "hidden" }}>
                <img src={promoMonde} alt="ZyNum monde entier" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                />
              </div>
              <div style={{ padding: "24px 28px 28px" }}>
                <div style={{ display: "inline-block", background: "rgba(59,130,246,0.10)", color: "#2563eb", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: 6, padding: "4px 10px", marginBottom: 12 }}>
                  180+ pays
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 8, lineHeight: 1.3 }}>
                  Des numéros du monde entier
                </h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65, marginBottom: 20 }}>
                  WhatsApp, Facebook, TikTok, Instagram... Accédez à 200+ services depuis 180+ pays. L'identité mondiale entre vos mains.
                </p>
                <Link href="/buy">
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#2563eb", color: "#fff", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    Explorer les services <ArrowRight size={14} />
                  </div>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 100px", background: "#fff" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <motion.div {...fadeUp()} style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>Comment ça marche</p>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-1px", color: "#111827" }}>
              3 étapes, c'est tout
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {STEPS.map((step, i) => (
              <motion.div key={step.num} {...fadeUp(i * 0.1)}
                style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 24, padding: 36, position: "relative", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
              >
                <div style={{ position: "absolute", top: 24, right: 28, fontSize: 56, fontWeight: 900, color: "rgba(0,0,0,0.04)", lineHeight: 1, userSelect: "none" }}>{step.num}</div>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(249,115,22,0.10)", border: "1px solid rgba(249,115,22,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: O, marginBottom: 24 }}>
                  {step.icon}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: O, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>{step.num}</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, color: "#111827" }}>{step.title}</div>
                <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>{step.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES POPULAIRES ────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 100px", background: "#f9fafb" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <motion.div {...fadeUp()} style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 12, color: "#111827" }}>200+ services disponibles</h2>
            <p style={{ color: "#6b7280", fontSize: 16 }}>WhatsApp, Telegram, Google, TikTok, Instagram et bien plus</p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 }}>
            {featured.map((svc, i) => (
              <Link key={svc.id} href={`/buy?service=${svc.id}`}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                  style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: "20px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
                  whileHover={{ borderColor: `${svc.color}88`, y: -2, boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}
                >
                  <SvcLogo icon={svc.icon} color={svc.color} name={svc.name} size={48} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", textAlign: "center" }}>{svc.name}</span>
                </motion.div>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Link href="/buy">
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${O}`, color: O, borderRadius: 12, padding: "12px 28px", fontWeight: 600, cursor: "pointer", fontSize: 15, background: "#fff" }}>
                Voir tous les services <ArrowRight size={16} />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── APP SCREENSHOT SECTION ─────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 100px", background: "#fff" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ background: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)", border: "1px solid #fed7aa", borderRadius: 32, padding: "60px 48px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 48, overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", top: "50%", right: "30%", transform: "translateY(-50%)", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />

            <div style={{ flex: "1 1 320px", position: "relative", zIndex: 1 }}>
              <motion.div {...fadeUp()}>
                <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16 }}>Application mobile</p>
                <h2 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 20, lineHeight: 1.15, color: "#111827" }}>
                  Gérez vos numéros<br />depuis votre poche
                </h2>
                <p style={{ color: "#6b7280", fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>
                  Achetez, suivez et gérez tous vos numéros virtuels en temps réel. Interface simple et rapide.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
                  {["Tableau de bord en temps réel", "Historique de toutes vos commandes", "Recharge Mobile Money intégrée", "Notifications SMS instantanées"].map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CheckCircle size={12} color={O} />
                      </div>
                      <span style={{ fontSize: 15, color: "#374151" }}>{f}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, background: "#111827", color: "#fff", borderRadius: 12, padding: "12px 20px", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.32.07 2.22.72 2.98.75.98-.16 1.93-.82 2.97-.77 1.27.07 2.22.55 2.83 1.44-2.59 1.55-1.98 4.95.34 5.94-.52 1.28-1.1 2.54-2.12 3.5zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                    App Store
                  </a>
                  <a href="https://play.google.com" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, background: O, color: "#fff", borderRadius: 12, padding: "12px 20px", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                      <path d="M3 20.5v-17c0-.83 1-1.3 1.6-.75l14 8.5c.54.33.54 1.17 0 1.5l-14 8.5c-.6.55-1.6.08-1.6-.75z" fill="white"/>
                    </svg>
                    Google Play
                  </a>
                </div>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} style={{ flex: "1 1 280px", display: "flex", justifyContent: "center" }}>
              <img src={appHand} alt="ZyNum dans la main" style={{ maxWidth: 340, width: "100%", objectFit: "contain", filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.15))" }} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PAIEMENT MOBILE MONEY ──────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 100px", background: "#f9fafb" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 64 }}>
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} style={{ flex: "1 1 320px" }}>
            <img src={mobileMoney} alt="Mobile Money" style={{ width: "100%", borderRadius: 24, objectFit: "cover", maxHeight: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }} />
          </motion.div>

          <div style={{ flex: "1 1 400px" }}>
            <motion.div {...fadeUp()}>
              <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16 }}>Recharge facile</p>
              <h2 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 20, lineHeight: 1.15, color: "#111827" }}>
                Payez par<br />Mobile Money
              </h2>
              <p style={{ color: "#6b7280", fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
                Rechargez votre solde ZyNum directement depuis votre téléphone avec les services Mobile Money disponibles en Afrique.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                {[
                  { name: "Orange Money", bg: "#FF6600", letter: "O", textColor: "#fff" },
                  { name: "MTN MoMo",     bg: "#FFCC00", letter: "M", textColor: "#000" },
                  { name: "Wave",         bg: "#1A73E8", letter: "W", textColor: "#fff" },
                  { name: "Moov Money",   bg: "#00B5E2", letter: "M", textColor: "#fff" },
                  { name: "T-Money",      bg: "#E8C100", letter: "T", textColor: "#C0392B" },
                  { name: "Free Money",   bg: "#E30613", letter: "F", textColor: "#fff" },
                  { name: "Celtiis Cash", bg: "#2C3E80", letter: "C", textColor: "#fff" },
                  { name: "Airtel Money", bg: "#FF0000", letter: "A", textColor: "#fff" },
                ].map((p) => (
                  <div key={p.name} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: p.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 900, fontSize: 15, color: p.textColor, fontFamily: "sans-serif" }}>
                      {p.letter}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", lineHeight: 1.3 }}>{p.name}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 28 }}>
                <img src={mobileMoneyLogos} alt="TM Money, Wave, Airtel" style={{ maxWidth: 280, width: "100%", objectFit: "contain", borderRadius: 12, filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.12))" }} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CRYPTO ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 100px", background: "#fff" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)", border: "1px solid #e5e7eb", borderRadius: 32, padding: "60px 48px", textAlign: "center", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
            <motion.div {...fadeUp()}>
              <div style={{ margin: "0 auto 24px", width: 90, height: 90 }}>
                <img src={cryptoIcon} alt="Crypto" style={{ width: 90, height: 90, objectFit: "contain", filter: "drop-shadow(0 8px 24px rgba(249,115,22,0.25))" }} />
              </div>
              <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16 }}>Cryptomonnaies</p>
              <h2 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 16, color: "#111827" }}>
                Payez en crypto
              </h2>
              <p style={{ color: "#6b7280", fontSize: 16, maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.7 }}>
                Rechargez votre compte avec USDT, Bitcoin, Ethereum, ou d'autres cryptos. Transactions rapides et sécurisées.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
                {[
                  { symbol: "USDT", name: "Tether",   color: "#26A17B", icon: "₮" },
                  { symbol: "BTC",  name: "Bitcoin",  color: "#F7931A", icon: "₿" },
                  { symbol: "ETH",  name: "Ethereum", color: "#627EEA", icon: "Ξ" },
                  { symbol: "USDC", name: "USD Coin", color: "#2775CA", icon: "◎" },
                  { symbol: "BNB",  name: "BNB",      color: "#F3BA2F", icon: "B" },
                  { symbol: "TRX",  name: "TRON",     color: "#E50914", icon: "T" },
                ].map((c) => (
                  <div key={c.symbol} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "16px 24px", display: "flex", alignItems: "center", gap: 12, minWidth: 140, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: c.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 16, flexShrink: 0 }}>
                      {c.icon}
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{c.symbol}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>{c.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PROGRAMME DE PARRAINAGE ────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 100px", background: "#f9fafb" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <motion.div {...fadeUp()} style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>Programme de parrainage</p>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 16, color: "#111827" }}>
              Gagnez en parrainant
            </h2>
            <p style={{ color: "#6b7280", fontSize: 18, maxWidth: 560, margin: "0 auto" }}>
              Les récompenses sont créditées automatiquement dès qu'un filleul effectue un achat.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 24 }}>
            {/* Card 1 */}
            <motion.div {...fadeUp(0.05)}
              style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 28, padding: 36, position: "relative", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
            >
              <div style={{ position: "absolute", top: 24, right: 28, fontSize: 13, color: "rgba(0,0,0,0.12)", fontWeight: 600 }}>01</div>
              <div style={{ width: 60, height: 60, borderRadius: "50%", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32, background: "#f9fafb" }}>
                <Globe2 size={26} color="#6b7280" />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, color: "#111827" }}>Numéro virtuel :</div>
              <div style={{ color: "#6b7280", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
                <strong style={{ color: "#111827" }}>10%</strong> de commission sur chaque achat de votre filleul (niveau 1)<br />
                <strong style={{ color: "#111827" }}>5%</strong> sur les achats de vos filleuls de niveau 2
              </div>
              <Link href="/register">
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid #e5e7eb", color: "#374151", borderRadius: 10, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14, background: "#f9fafb" }}>
                  Participer <ArrowRight size={14} />
                </div>
              </Link>
            </motion.div>

            {/* Card 2 - Orange gradient */}
            <motion.div {...fadeUp(0.1)}
              style={{ background: "linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 28, padding: 36, position: "relative", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", top: 24, right: 28, fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>02</div>
              <div style={{ width: 60, height: 60, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
                <img src={iconGift} alt="gift" style={{ width: 28, height: 28, filter: "brightness(0) invert(1)" }} />
              </div>
              <div style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "3px 12px", fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 16 }}>best seller</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, color: "#fff" }}>Pack Premium :</div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
                <strong style={{ color: "#fff" }}>15%</strong> de commission niveau 1<br />
                <strong style={{ color: "#fff" }}>7%</strong> de commission niveau 2<br />
                + Accès aux statistiques avancées
              </div>
              <Link href="/register">
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.2)", color: "#fff", borderRadius: 10, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14, border: "1px solid rgba(255,255,255,0.3)" }}>
                  Participer <ArrowRight size={14} />
                </div>
              </Link>
            </motion.div>
          </div>

          <motion.div {...fadeUp(0.15)} style={{ textAlign: "center" }}>
            <img src={cardsStack} alt="Cartes ZyNum" style={{ maxWidth: 380, width: "100%", objectFit: "contain", filter: "drop-shadow(0 16px 40px rgba(0,0,0,0.12))" }} />
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 100px", background: "#fff" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <motion.div {...fadeUp()} style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>Pourquoi ZyNum</p>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-1px", color: "#111827" }}>
              Tout ce dont vous avez besoin
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {[
              { icon: <Zap size={24} color={O} />,                                                                              title: "Ultra rapide",    desc: "Recevez votre numéro et votre SMS en moins de 30 secondes." },
              { icon: <Globe2 size={24} color={O} />,                                                                           title: "180+ pays",       desc: "Des numéros dans presque tous les pays du monde." },
              { icon: <img src={iconLock}     alt="" style={{ width: 24, height: 24, filter: ICON_ORANGE }} />,                 title: "Confidentiel",    desc: "Aucune information personnelle requise. 100% anonyme." },
              { icon: <img src={iconCard}     alt="" style={{ width: 24, height: 24, filter: ICON_ORANGE }} />,                 title: "Mobile Money",    desc: "Payez avec Orange Money, Wave, MTN et plus." },
              { icon: <img src={cryptoIcon}   alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />,               title: "Crypto acceptée", desc: "USDT, BTC, ETH — toutes les cryptos majeures." },
              { icon: <img src={iconGift}     alt="" style={{ width: 24, height: 24, filter: ICON_ORANGE }} />,                 title: "Parrainage",      desc: "Gagnez des commissions en invitant vos amis." },
              { icon: <img src={iconSupport}  alt="" style={{ width: 24, height: 24, filter: ICON_ORANGE }} />,                 title: "Support 24/7",    desc: "Une équipe disponible à tout moment pour vous aider." },
              { icon: <img src={iconWithdraw} alt="" style={{ width: 24, height: 24, filter: ICON_ORANGE }} />,                 title: "Sans abonnement", desc: "Payez uniquement ce que vous utilisez. Pas d'engagement." },
            ].map((f, i) => (
              <motion.div key={f.title} {...fadeUp(i * 0.05)}
                style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 20, padding: "28px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                whileHover={{ borderColor: "rgba(249,115,22,0.4)", y: -2, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" } as any}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(249,115,22,0.10)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                  {f.icon}
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: "#111827" }}>{f.title}</div>
                <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65 }}>{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 100px", background: "#f9fafb" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <motion.div {...fadeUp()} style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>FAQ</p>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-1px", color: "#111827" }}>Questions fréquentes</h2>
          </motion.div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FAQS.map((faq, i) => (
              <motion.div key={i} {...fadeUp(i * 0.05)}>
                <FaqItem q={faq.q} a={faq.a} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 100px", background: "#fff" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <motion.div {...fadeUp()}
            style={{ background: "linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)", borderRadius: 32, padding: "80px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}
          >
            <div style={{ position: "absolute", top: "-20%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: "-30%", left: "-5%", width: 350, height: 350, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <h2 style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 800, letterSpacing: "-1px", color: "#fff", marginBottom: 20 }}>
                Prêt à commencer ?
              </h2>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 18, maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.7 }}>
                Rejoignez plus de 50 000 utilisateurs qui font confiance à ZyNum pour leurs numéros virtuels.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
                <Link href="/register">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", color: O, padding: "16px 36px", borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
                    Créer un compte gratuit <ArrowRight size={18} />
                  </div>
                </Link>
                <Link href="/buy">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", padding: "16px 36px", borderRadius: 14, fontWeight: 600, fontSize: 16, cursor: "pointer" }}>
                    Voir les services
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
