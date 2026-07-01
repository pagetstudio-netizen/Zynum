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
import iconInfo from "@assets/mine-mod-aboutus-xnaBhqOq_1782924013928.png";

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
      style={{ background: "#161616", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", display: "block" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", gap: 16 }}>
        <span style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{q}</span>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          transition: "all 0.3s", transform: open ? "rotate(45deg)" : "rotate(0deg)",
          color: open ? O : "rgba(255,255,255,0.5)"
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
            <div style={{ padding: "0 24px 20px", color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.7, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
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
    <div style={{ background: "#0a0a0a", color: "#fff", overflowX: "hidden" }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        {/* grid bg */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
        {/* orange glow */}
        <div style={{ position: "absolute", top: "20%", right: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)", zIndex: 0, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)", zIndex: 0, pointerEvents: "none" }} />

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "120px 24px 80px", position: "relative", zIndex: 1, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 64, width: "100%" }}>
          {/* Left */}
          <div style={{ flex: "1 1 480px", minWidth: 0 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 999, padding: "6px 16px", marginBottom: 28 }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: O, display: "inline-block" }} />
              <span style={{ color: O, fontSize: 13, fontWeight: 600 }}>Numéros virtuels · Livraison instantanée</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-1.5px", marginBottom: 24 }}
            >
              Recevez vos<br />
              <span style={{ color: O }}>codes OTP</span><br />
              partout dans le monde
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              style={{ color: "rgba(255,255,255,0.55)", fontSize: 18, lineHeight: 1.7, maxWidth: 480, marginBottom: 40 }}
            >
              Numéros virtuels temporaires pour Telegram, WhatsApp, Google et 200+ services.
              Payez par Mobile Money ou crypto. Livré en moins de 30 secondes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 40 }}
            >
              <Link href="/register">
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: O, color: "#fff", padding: "16px 28px", borderRadius: 14, fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 0 40px rgba(249,115,22,0.4)" }}>
                  Commencer gratuitement <ArrowRight size={18} />
                </div>
              </Link>
              <Link href="/buy">
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", padding: "16px 28px", borderRadius: 14, fontWeight: 600, fontSize: 16, cursor: "pointer" }}>
                  Acheter un numéro
                </div>
              </Link>
            </motion.div>

            {/* Download buttons */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
              style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 48 }}
            >
              <a href="#" style={{ display: "flex", alignItems: "center", gap: 12, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 20px", textDecoration: "none", cursor: "pointer" }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.32.07 2.22.72 2.98.75.98-.16 1.93-.82 2.97-.77 1.27.07 2.22.55 2.83 1.44-2.59 1.55-1.98 4.95.34 5.94-.52 1.28-1.1 2.54-2.12 3.5zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, lineHeight: 1 }}>Télécharger sur</div>
                  <div style={{ color: "#fff", fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>App Store</div>
                </div>
              </a>
              <a href="https://play.google.com" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 20px", textDecoration: "none", cursor: "pointer" }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                  <path d="M3 20.5v-17c0-.83 1-1.3 1.6-.75l14 8.5c.54.33.54 1.17 0 1.5l-14 8.5c-.6.55-1.6.08-1.6-.75z" fill="#34A853"/>
                  <path d="M3 3.5l8.5 8.5L3 20.5V3.5z" fill="#EA4335"/>
                  <path d="M3 3.5l8.5 8.5 5-5L3 3.5z" fill="#FBBC04"/>
                  <path d="M3 20.5l8.5-8.5 5 5L3 20.5z" fill="#0F9D58"/>
                </svg>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, lineHeight: 1 }}>Disponible sur</div>
                  <div style={{ color: "#fff", fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>Google Play</div>
                </div>
              </a>
            </motion.div>

            {/* Trust pills */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {["50K+ utilisateurs", "180+ pays", "200+ services", "99.9% uptime"].map((t) => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 14px", fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
                  <CheckCircle size={12} color={O} /> {t}
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
              <img src={appDouble} alt="ZyNum App" style={{ width: "100%", objectFit: "contain", filter: "drop-shadow(0 40px 80px rgba(0,0,0,0.8))" }} />
              {/* floating badge */}
              <div style={{ position: "absolute", top: "8%", left: "-5%", background: O, borderRadius: 14, padding: "10px 18px", boxShadow: "0 8px 32px rgba(249,115,22,0.5)", display: "flex", alignItems: "center", gap: 8 }}>
                <Zap size={16} color="#fff" />
                <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>Livraison instantanée</span>
              </div>
              <div style={{ position: "absolute", bottom: "12%", right: "-5%", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "12px 18px", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(249,115,22,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Star size={16} color={O} fill={O} />
                </div>
                <div>
                  <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>4.9 / 5 étoiles</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>50K+ avis</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#111" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px", display: "flex", flexWrap: "wrap", justifyContent: "space-around", gap: 24 }}>
          {[
            { val: "50 000+", label: "Clients actifs" },
            { val: "180+", label: "Pays disponibles" },
            { val: "200+", label: "Services supportés" },
            { val: "30 sec", label: "Délai de livraison" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: O, letterSpacing: "-1px" }}>{s.val}</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section style={{ padding: "120px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <motion.div {...fadeUp()} style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>Comment ça marche</p>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-1px" }}>
              3 étapes, c'est tout
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {STEPS.map((step, i) => (
              <motion.div key={step.num} {...fadeUp(i * 0.1)}
                style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 24, padding: 36, position: "relative", overflow: "hidden" }}
              >
                <div style={{ position: "absolute", top: 24, right: 28, fontSize: 56, fontWeight: 900, color: "rgba(255,255,255,0.04)", lineHeight: 1, userSelect: "none" }}>{step.num}</div>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: O, marginBottom: 24 }}>
                  {step.icon}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: O, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>{step.num}</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{step.title}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>{step.desc}</div>
                {/* bottom wire mesh accent */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, backgroundImage: "linear-gradient(rgba(249,115,22,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.05) 1px, transparent 1px)", backgroundSize: "20px 20px", maskImage: "linear-gradient(to top, black 0%, transparent 100%)" }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES POPULAIRES ────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 120px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <motion.div {...fadeUp()} style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 12 }}>200+ services disponibles</h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 16 }}>WhatsApp, Telegram, Google, TikTok, Instagram et bien plus</p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 }}>
            {featured.map((svc, i) => (
              <Link key={svc.id} href={`/buy?service=${svc.id}`}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                  style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "20px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, cursor: "pointer", transition: "all 0.2s" }}
                  whileHover={{ borderColor: `${svc.color}50`, y: -2 }}
                >
                  <SvcLogo icon={svc.icon} color={svc.color} name={svc.name} size={48} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", textAlign: "center" }}>{svc.name}</span>
                </motion.div>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Link href="/buy">
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${O}`, color: O, borderRadius: 12, padding: "12px 28px", fontWeight: 600, cursor: "pointer", fontSize: 15 }}>
                Voir tous les services <ArrowRight size={16} />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── APP SCREENSHOT SECTION ─────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 120px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 32, padding: "60px 48px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 48, overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", top: "50%", right: "30%", transform: "translateY(-50%)", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

            <div style={{ flex: "1 1 320px", position: "relative", zIndex: 1 }}>
              <motion.div {...fadeUp()}>
                <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16 }}>Application mobile</p>
                <h2 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 20, lineHeight: 1.15 }}>
                  Gérez vos numéros<br />depuis votre poche
                </h2>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>
                  Achetez, suivez et gérez tous vos numéros virtuels en temps réel. Interface simple et rapide.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
                  {["Tableau de bord en temps réel", "Historique de toutes vos commandes", "Recharge Mobile Money intégrée", "Notifications SMS instantanées"].map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CheckCircle size={12} color={O} />
                      </div>
                      <span style={{ fontSize: 15, color: "rgba(255,255,255,0.7)" }}>{f}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", color: "#000", borderRadius: 12, padding: "12px 20px", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="black"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.32.07 2.22.72 2.98.75.98-.16 1.93-.82 2.97-.77 1.27.07 2.22.55 2.83 1.44-2.59 1.55-1.98 4.95.34 5.94-.52 1.28-1.1 2.54-2.12 3.5zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
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
              <img src={appHand} alt="ZyNum dans la main" style={{ maxWidth: 340, width: "100%", objectFit: "contain", filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.8))" }} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PAIEMENT MOBILE MONEY ──────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 120px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 64 }}>
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} style={{ flex: "1 1 320px" }}>
            <img src={mobileMoney} alt="Mobile Money" style={{ width: "100%", borderRadius: 24, objectFit: "cover", maxHeight: 420 }} />
          </motion.div>

          <div style={{ flex: "1 1 400px" }}>
            <motion.div {...fadeUp()}>
              <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16 }}>Recharge facile</p>
              <h2 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 20, lineHeight: 1.15 }}>
                Payez par<br />Mobile Money
              </h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
                Rechargez votre solde ZyNum directement depuis votre téléphone avec les services Mobile Money disponibles en Afrique.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                {[
                  { name: "Orange Money", bg: "#FF6600", letter: "O", textColor: "#fff" },
                  { name: "MTN MoMo",     bg: "#FFCC00", letter: "M", textColor: "#000" },
                  { name: "Wave",         bg: "#1A73E8", letter: "W", textColor: "#fff" },
                  { name: "Moov Money",  bg: "#00B5E2", letter: "M", textColor: "#fff" },
                  { name: "T-Money",     bg: "#E8C100", letter: "T", textColor: "#C0392B" },
                  { name: "Free Money",  bg: "#E30613", letter: "F", textColor: "#fff" },
                  { name: "Celtiis Cash",bg: "#2C3E80", letter: "C", textColor: "#fff" },
                  { name: "Airtel Money",bg: "#FF0000", letter: "A", textColor: "#fff" },
                ].map((p) => (
                  <div key={p.name} style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: p.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 900, fontSize: 15, color: p.textColor, fontFamily: "sans-serif" }}>
                      {p.letter}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)", lineHeight: 1.3 }}>{p.name}</span>
                  </div>
                ))}
              </div>

              {/* Logos image */}
              <div style={{ marginTop: 28 }}>
                <img src={mobileMoneyLogos} alt="TM Money, Wave, Airtel" style={{ maxWidth: 280, width: "100%", objectFit: "contain", borderRadius: 12, filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.5))" }} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CRYPTO ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 120px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 32, padding: "60px 48px", textAlign: "center" }}>
            <motion.div {...fadeUp()}>
              <div style={{ margin: "0 auto 24px", width: 90, height: 90 }}>
                <img src={cryptoIcon} alt="Crypto" style={{ width: 90, height: 90, objectFit: "contain", filter: "drop-shadow(0 8px 24px rgba(249,115,22,0.35))" }} />
              </div>
              <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16 }}>Cryptomonnaies</p>
              <h2 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 16 }}>
                Payez en crypto
              </h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.7 }}>
                Rechargez votre compte avec USDT, Bitcoin, Ethereum, ou d'autres cryptos. Transactions rapides et sécurisées.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
                {[
                  { symbol: "USDT", name: "Tether", color: "#26A17B", icon: "₮" },
                  { symbol: "BTC", name: "Bitcoin", color: "#F7931A", icon: "₿" },
                  { symbol: "ETH", name: "Ethereum", color: "#627EEA", icon: "Ξ" },
                  { symbol: "BNB", name: "BNB Chain", color: "#F3BA2F", icon: "⬡" },
                  { symbol: "LTC", name: "Litecoin", color: "#BFBBBB", icon: "Ł" },
                  { symbol: "TRX", name: "TRON", color: "#EF0027", icon: "T" },
                ].map((c) => (
                  <div key={c.symbol} style={{ display: "flex", alignItems: "center", gap: 10, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 20px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: c.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 800 }}>{c.icon}</div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{c.symbol}</div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{c.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PROGRAMME DE PARRAINAGE ────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 120px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <motion.div {...fadeUp()} style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>Programme de parrainage</p>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 16 }}>
              Gagnez en parrainant
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 18, maxWidth: 560, margin: "0 auto" }}>
              Les récompenses sont créditées automatiquement dès qu'un filleul effectue un achat.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 24 }}>
            {/* Card 1 - Numéro virtuel */}
            <motion.div {...fadeUp(0.05)}
              style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 28, padding: 36, position: "relative", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", top: 24, right: 28, fontSize: 13, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>01</div>
              <div style={{ width: 60, height: 60, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
                <Globe2 size={26} color="rgba(255,255,255,0.7)" />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Numéro virtuel :</div>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
                <strong style={{ color: "#fff" }}>10%</strong> de commission sur chaque achat de votre filleul (niveau 1)<br />
                <strong style={{ color: "#fff" }}>5%</strong> sur les achats de vos filleuls de niveau 2
              </div>
              <Link href="/register">
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)", borderRadius: 10, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
                  Participer <ArrowRight size={14} />
                </div>
              </Link>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 100, backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "20px 20px", maskImage: "linear-gradient(to top, black 0%, transparent 100%)" }} />
            </motion.div>

            {/* Card 2 - Premium (orange gradient) */}
            <motion.div {...fadeUp(0.1)}
              style={{ background: "linear-gradient(135deg, #7c2d00 0%, #9a3800 50%, #c04f00 100%)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 28, padding: 36, position: "relative", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", top: 24, right: 28, fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>02</div>
              <div style={{ width: 60, height: 60, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
                <Wallet size={26} color="rgba(255,255,255,0.9)" />
              </div>
              <div style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "3px 12px", fontSize: 12, fontWeight: 700, color: O, marginBottom: 16 }}>best seller</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, color: "#fff" }}>Pack Premium :</div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
                <strong style={{ color: "#fff" }}>15%</strong> de commission niveau 1<br />
                <strong style={{ color: "#fff" }}>7%</strong> de commission niveau 2<br />
                + Accès aux statistiques avancées
              </div>
              <Link href="/register">
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 10, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14, border: "1px solid rgba(255,255,255,0.2)" }}>
                  Participer <ArrowRight size={14} />
                </div>
              </Link>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 100, backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "20px 20px", maskImage: "linear-gradient(to top, black 0%, transparent 100%)" }} />
            </motion.div>
          </div>

          {/* Cards stack image */}
          <motion.div {...fadeUp(0.15)} style={{ textAlign: "center" }}>
            <img src={cardsStack} alt="Cartes ZyNum" style={{ maxWidth: 380, width: "100%", objectFit: "contain", filter: "drop-shadow(0 20px 60px rgba(0,0,0,0.6))" }} />
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 120px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <motion.div {...fadeUp()} style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>Pourquoi ZyNum</p>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-1px" }}>
              Tout ce dont vous avez besoin
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {[
              { icon: <Zap size={24} color={O} />,                                                                           title: "Ultra rapide",     desc: "Recevez votre numéro et votre SMS en moins de 30 secondes." },
              { icon: <Globe2 size={24} color={O} />,                                                                        title: "180+ pays",        desc: "Des numéros dans presque tous les pays du monde." },
              { icon: <img src={iconLock}    alt="" style={{ width: 24, height: 24, filter: ICON_ORANGE }} />,               title: "Confidentiel",     desc: "Aucune information personnelle requise. 100% anonyme." },
              { icon: <img src={iconCard}    alt="" style={{ width: 24, height: 24, filter: ICON_ORANGE }} />,               title: "Mobile Money",     desc: "Payez avec Orange Money, Wave, MTN et plus." },
              { icon: <img src={cryptoIcon}  alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />,             title: "Crypto acceptée",  desc: "USDT, BTC, ETH — toutes les cryptos majeures." },
              { icon: <img src={iconGift}    alt="" style={{ width: 24, height: 24, filter: ICON_ORANGE }} />,               title: "Parrainage",       desc: "Gagnez des commissions en invitant vos amis." },
              { icon: <img src={iconSupport} alt="" style={{ width: 24, height: 24, filter: ICON_ORANGE }} />,               title: "Support 24/7",     desc: "Une équipe disponible à tout moment pour vous aider." },
              { icon: <img src={iconWithdraw}alt="" style={{ width: 24, height: 24, filter: ICON_ORANGE }} />,               title: "Sans abonnement",  desc: "Payez uniquement ce que vous utilisez. Pas d'engagement." },
            ].map((f, i) => (
              <motion.div key={f.title} {...fadeUp(i * 0.05)}
                style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "28px 24px" }}
                whileHover={{ borderColor: "rgba(249,115,22,0.3)", y: -2 } as any}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(249,115,22,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                  {f.icon}
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 120px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <motion.div {...fadeUp()} style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>FAQ</p>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-1px" }}>Questions fréquentes</h2>
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
      <section style={{ padding: "0 24px 120px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <motion.div {...fadeUp()}
            style={{ background: "linear-gradient(135deg, #1a0a00 0%, #2d1200 50%, #1a0a00 100%)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 32, padding: "80px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}
          >
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 20 }}>Commencez maintenant</p>
              <h2 style={{ fontSize: "clamp(32px, 4.5vw, 60px)", fontWeight: 800, letterSpacing: "-1.5px", marginBottom: 20, lineHeight: 1.1 }}>
                Votre premier numéro<br />
                <span style={{ color: O }}>en 30 secondes</span>
              </h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 17, maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.7 }}>
                Rejoignez 50 000+ utilisateurs qui font confiance à ZyNum pour leurs numéros virtuels.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", marginBottom: 36 }}>
                <Link href="/register">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: O, color: "#fff", padding: "18px 36px", borderRadius: 14, fontWeight: 700, fontSize: 17, cursor: "pointer", boxShadow: "0 0 60px rgba(249,115,22,0.4)" }}>
                    Créer un compte gratuit <ArrowRight size={18} />
                  </div>
                </Link>
                <Link href="/buy">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", padding: "18px 36px", borderRadius: 14, fontWeight: 600, fontSize: 17, cursor: "pointer" }}>
                    Acheter un numéro
                  </div>
                </Link>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
                <a href="https://play.google.com" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "12px 22px", textDecoration: "none" }}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                    <path d="M3 20.5v-17c0-.83 1-1.3 1.6-.75l14 8.5c.54.33.54 1.17 0 1.5l-14 8.5c-.6.55-1.6.08-1.6-.75z" fill="white"/>
                  </svg>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, lineHeight: 1 }}>Disponible sur</div>
                    <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>Google Play</div>
                  </div>
                </a>
                <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "12px 22px", textDecoration: "none" }}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.32.07 2.22.72 2.98.75.98-.16 1.93-.82 2.97-.77 1.27.07 2.22.55 2.83 1.44-2.59 1.55-1.98 4.95.34 5.94-.52 1.28-1.1 2.54-2.12 3.5zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, lineHeight: 1 }}>Télécharger sur</div>
                    <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>App Store</div>
                  </div>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
