import React, { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Globe2, CheckCircle,
  Zap,
} from "lucide-react";
import { useGetServices } from "@workspace/api-client-react";
import { useLanguage } from "@/hooks/use-language";

import appDouble from "@assets/20260701_162442_1782923584243.png";
import appHand from "@assets/20260701_161314_1782923584332.png";
import mobileMoney from "@assets/20260701_160702_1782923584360.jpg";
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
import icon3dMoney    from "@assets/money@2x.00-zzbht3am0n_1782931480959.png";
import icon3dPartners from "@assets/partners@2x.07xoz5yxyff0b_1782931480890.png";
import icon3dClients  from "@assets/clients@2x.0ijun8_o5qiat_1782931481090.png";
import icon3dIncome   from "@assets/income-image@3x.0-d1di3zb~-f__1782931481119.png";
import icon3dSupport  from "@assets/support@2x.0delawx1ppnnt_1782933694962.png";

const ICON_ORANGE = "brightness(0) saturate(100%) invert(58%) sepia(97%) saturate(2476%) hue-rotate(346deg) brightness(1.1) contrast(1)";

const O = "#f97316";

function CountUp({ to, suffix = "", duration = 1800 }: { to: number; suffix?: string; duration?: number }) {
  const [count, setCount] = React.useState(0);
  const ref = React.useRef<HTMLSpanElement>(null);
  const [started, setStarted] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  React.useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * to));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, to, duration]);

  const display = to >= 1000 ? count.toLocaleString("fr-FR") : count;
  return <span ref={ref}>{display}{suffix}</span>;
}

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
  const { t } = useLanguage();
  const { data: servicesData } = useGetServices();
  const FEATURED_IDS = ["whatsapp", "telegram", "facebook", "tiktok", "instagram", "google", "twitter", "discord", "snapchat", "netflix"];
  const all = servicesData?.services ?? [];
  const featured = FEATURED_IDS.map(id => all.find(s => s.id === id)).filter(Boolean) as typeof all;

  const FAQS = [
    { q: t("home_faq_q1"), a: t("home_faq_a1") },
    { q: t("home_faq_q2"), a: t("home_faq_a2") },
    { q: t("home_faq_q3"), a: t("home_faq_a3") },
    { q: t("home_faq_q4"), a: t("home_faq_a4") },
    { q: t("home_faq_q5"), a: t("home_faq_a5") },
    { q: t("home_faq_q6"), a: t("home_faq_a6") },
  ];

  const STEPS = [
    { num: "01", img: icon3dClients,  title: t("home_steps_a_title"), desc: t("home_steps_a_desc"), accent: "#fff7ed", border: "#fed7aa" },
    { num: "02", img: icon3dMoney,    title: t("home_steps_b_title"), desc: t("home_steps_b_desc"), accent: "#f0fdf4", border: "#bbf7d0" },
    { num: "03", img: icon3dIncome,   title: t("home_steps_c_title"), desc: t("home_steps_c_desc"), accent: "#eff6ff", border: "#bfdbfe" },
    { num: "04", img: icon3dPartners, title: t("home_steps_d_title"), desc: t("home_steps_d_desc"), accent: "#fdf4ff", border: "#e9d5ff" },
  ];

  return (
    <div style={{ background: "#f9fafb", color: "#111827", overflowX: "hidden" }}>
      <style>{`
        @media (max-width: 768px) {
          .hero-inner { flex-direction: column !important; gap: 40px !important; padding-top: 80px !important; padding-bottom: 60px !important; }
          .hero-left { text-align: center !important; align-items: center !important; display: flex !important; flex-direction: column !important; }
          .hero-left h1 { text-align: center !important; }
          .hero-left p { text-align: center !important; margin-left: auto !important; margin-right: auto !important; }
          .hero-btns { justify-content: center !important; }
          .hero-dl { justify-content: center !important; }
          .hero-trust { justify-content: center !important; }
          .hero-pill { align-self: center !important; }
          .hero-right { order: -1 !important; max-width: 320px !important; margin: 0 auto !important; }
          .hero-right .hero-badge-left { left: 0 !important; font-size: 12px !important; padding: 8px 12px !important; }
          .hero-right .hero-badge-right { right: 0 !important; padding: 10px 12px !important; }
        }
      `}</style>

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

        <div className="hero-inner" style={{ maxWidth: 1280, margin: "0 auto", padding: "120px 24px 80px", position: "relative", zIndex: 1, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 64, width: "100%" }}>
          {/* Left */}
          <div className="hero-left" style={{ flex: "1 1 480px", minWidth: 0 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="hero-pill"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(249,115,22,0.10)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 999, padding: "6px 16px", marginBottom: 28 }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: O, display: "inline-block" }} />
              <span style={{ color: O, fontSize: 13, fontWeight: 600 }}>{t("home_badge")}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-1.5px", marginBottom: 24, color: "#111827" }}
            >
              {t("home_hero_title1")}<br />
              <span style={{ color: O }}>{t("home_hero_accent")}</span><br />
              {t("home_hero_title2")}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              style={{ color: "#6b7280", fontSize: 17, lineHeight: 1.7, maxWidth: 480, marginBottom: 40 }}
            >
              {t("home_hero_sub")}
            </motion.p>

            <motion.div
              className="hero-btns"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 40 }}
            >
              <Link href="/register">
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: O, color: "#fff", padding: "16px 28px", borderRadius: 14, fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 4px 20px rgba(249,115,22,0.35)" }}>
                  {t("home_start_free")} <ArrowRight size={18} />
                </div>
              </Link>
              <Link href="/buy">
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e5e7eb", color: "#374151", padding: "16px 28px", borderRadius: 14, fontWeight: 600, fontSize: 16, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  {t("home_buy_number")}
                </div>
              </Link>
            </motion.div>

            {/* Download buttons */}
            <motion.div
              className="hero-dl"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
              style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 48 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#111827", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "11px 18px", opacity: 0.55, cursor: "not-allowed", userSelect: "none" }}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.32.07 2.22.72 2.98.75.98-.16 1.93-.82 2.97-.77 1.27.07 2.22.55 2.83 1.44-2.59 1.55-1.98 4.95.34 5.94-.52 1.28-1.1 2.54-2.12 3.5zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, lineHeight: 1, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{t("home_dl_on")}</div>
                  <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, lineHeight: 1.4 }}>{t("home_app_store")}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#111827", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "11px 18px", opacity: 0.55, cursor: "not-allowed", userSelect: "none" }}>
                <svg viewBox="0 0 512 512" width="22" height="22">
                  <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.6 225.6l-58.9-34-65.7 64.5 65.7 64.5 60.1-34.3c17.1-9.8 17.1-34.4-1.2-60.7zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" fill="white"/>
                </svg>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, lineHeight: 1, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{t("home_avail_on")}</div>
                  <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, lineHeight: 1.4 }}>{t("home_google_play")}</div>
                </div>
              </div>
            </motion.div>

            {/* Trust pills */}
            <motion.div className="hero-trust" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {[t("home_trust1"), t("home_trust2"), t("home_trust3"), t("home_trust4")].map((label) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 14px", fontSize: 13, color: "#6b7280", fontWeight: 500 }}>
                  <CheckCircle size={12} color={O} /> {label}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: app mockup */}
          <motion.div
            className="hero-right"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            style={{ flex: "1 1 380px", display: "flex", justifyContent: "center", position: "relative" }}
          >
            <div style={{ maxWidth: 480, width: "100%" }}>
              <img src={appDouble} alt="ZyNum App" style={{ width: "100%", objectFit: "contain", filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.18))" }} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px", display: "flex", flexWrap: "wrap", justifyContent: "space-around", gap: 24 }}>
          {[
            { to: 50000, suffix: "+", label: t("home_stat_users") },
            { to: 180,   suffix: "+", label: t("home_stats_countries") },
            { to: 200,   suffix: "+", label: t("home_stats_services") },
            { to: 30,    suffix: " sec", label: t("home_stat_delivery") },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: O, letterSpacing: "-1px" }}>
                <CountUp to={s.to} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CARROUSEL HORIZONTAL ───────────────────────────────────────────── */}
      <section style={{ padding: "80px 0 80px 24px", overflow: "hidden" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto 0 0", paddingLeft: 0 }}>
          <motion.div {...fadeUp()} style={{ textAlign: "center", marginBottom: 48, paddingRight: 24 }}>
            <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>{t("home_carousel_badge")}</p>
            <h2 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 800, letterSpacing: "-1px", color: "#111827" }}>
              {t("home_carousel_title")}
            </h2>
          </motion.div>

          {/* Scroll container */}
          <div style={{
            display: "flex",
            gap: 20,
            overflowX: "auto",
            paddingBottom: 16,
            paddingRight: 24,
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}>
            {[
              { num: "01", title: t("home_card1_title"), desc: t("home_card1_desc"), bg: "linear-gradient(145deg, #fff7ed 0%, #fed7aa 100%)", icon: icon3dMoney },
              { num: "02", title: t("home_card2_title"), desc: t("home_card2_desc"), bg: "linear-gradient(145deg, #fef9c3 0%, #fde68a 100%)", icon: icon3dIncome },
              { num: "03", title: t("home_card3_title"), desc: t("home_card3_desc"), bg: "linear-gradient(145deg, #f0fdf4 0%, #bbf7d0 100%)", icon: icon3dClients },
              { num: "04", title: t("home_card4_title"), desc: t("home_card4_desc"), bg: "linear-gradient(145deg, #fdf4ff 0%, #e9d5ff 100%)", icon: icon3dPartners },
              { num: "05", title: t("home_card5_title"), desc: t("home_card5_desc"), bg: "linear-gradient(145deg, #f0f9ff 0%, #bae6fd 100%)", icon: icon3dSupport },
            ].map((card) => (
              <div
                key={card.num}
                style={{
                  flex: "0 0 300px",
                  minWidth: 300,
                  height: 400,
                  borderRadius: 28,
                  background: card.bg,
                  padding: "32px 28px 24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  scrollSnapAlign: "start",
                  position: "relative",
                  overflow: "hidden",
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
                }}
              >
                <div style={{ position: "absolute", top: 24, right: 24, fontSize: 28, color: "rgba(0,0,0,0.08)", fontWeight: 800, lineHeight: 1 }}>×</div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", lineHeight: 1.3, marginBottom: 12, paddingRight: 32 }}>{card.title}</div>
                  <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65 }}>{card.desc}</div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "rgba(0,0,0,0.18)", letterSpacing: "-1px" }}>{card.num}</div>
                  <img src={card.icon} alt={card.title} style={{ width: 160, height: 160, objectFit: "contain", marginBottom: -8, marginRight: -12 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CARTES PROMO ───────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <motion.div {...fadeUp()} style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>{t("home_aff_badge")}</p>
            <h2 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 800, letterSpacing: "-1px", color: "#111827" }}>
              {t("home_carousel_title")}
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {/* Carte 1 – Identité */}
            <motion.div {...fadeUp(0.0)} whileHover={{ y: -6 } as any} style={{ borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.10)", background: "#fff", cursor: "pointer", border: "1px solid #e5e7eb" }}>
              <div style={{ position: "relative", height: 280, overflow: "hidden" }}>
                <img src={promoIdentite} alt={t("home_promo1_title")} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                />
              </div>
              <div style={{ padding: "24px 28px 28px" }}>
                <div style={{ display: "inline-block", background: "rgba(249,115,22,0.10)", color: O, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: 6, padding: "4px 10px", marginBottom: 12 }}>
                  {t("home_promo1_badge")}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 8, lineHeight: 1.3 }}>
                  {t("home_promo1_title")}
                </h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65, marginBottom: 20 }}>
                  {t("home_promo1_desc")}
                </p>
                <Link href="/register">
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: O, color: "#fff", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    {t("home_promo1_btn")} <ArrowRight size={14} />
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
                  +10% <span style={{ color: O }}>{t("home_commission_label")}</span>
                </div>
              </div>
              <div style={{ padding: "24px 28px 28px" }}>
                <div style={{ display: "inline-block", background: "rgba(34,197,94,0.10)", color: "#16a34a", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: 6, padding: "4px 10px", marginBottom: 12 }}>
                  {t("home_aff_badge")}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 8, lineHeight: 1.3 }}>
                  {t("home_promo2_title")}
                </h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65, marginBottom: 20 }}>
                  {t("home_promo2_desc")}
                </p>
                <Link href="/register">
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#16a34a", color: "#fff", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    {t("home_promo2_btn")} <ArrowRight size={14} />
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
                  {t("home_promo3_badge")}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 8, lineHeight: 1.3 }}>
                  {t("home_promo3_title")}
                </h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65, marginBottom: 20 }}>
                  {t("home_promo3_desc")}
                </p>
                <Link href="/buy">
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#2563eb", color: "#fff", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    {t("home_promo3_btn")} <ArrowRight size={14} />
                  </div>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px 100px", background: "#fff" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          {/* Header */}
          <motion.div {...fadeUp()} style={{ textAlign: "center", marginBottom: 72 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 50, padding: "6px 16px", marginBottom: 20 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: O }} />
              <span style={{ color: O, fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.15em" }}>{t("home_steps_badge")}</span>
            </div>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 900, letterSpacing: "-1.5px", color: "#111827", lineHeight: 1.1 }}>
              {t("home_steps_heading")}<br />
              <span style={{ color: O }}>{t("home_steps_heading2")}</span>
            </h2>
            <p style={{ color: "#6b7280", fontSize: 17, marginTop: 16, maxWidth: 480, margin: "16px auto 0" }}>
              {t("home_steps_sub")}
            </p>
          </motion.div>

          {/* Steps grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: "relative" }}
              >
                <div
                  style={{
                    background: step.accent,
                    border: `1px solid ${step.border}`,
                    borderRadius: 28,
                    padding: "32px 28px 0",
                    overflow: "hidden",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column" as const,
                    minHeight: 320,
                  }}
                >
                  {/* Step badge */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                    <div style={{ background: "#fff", border: `1px solid ${step.border}`, borderRadius: 50, padding: "4px 14px", fontSize: 12, fontWeight: 800, color: "#374151", letterSpacing: "0.05em" }}>
                      {t("home_step_word")} {step.num}
                    </div>
                    <div style={{ fontSize: 48, fontWeight: 900, color: `${step.border}`, opacity: 0.4, lineHeight: 1, userSelect: "none" as const }}>{step.num}</div>
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 10, letterSpacing: "-0.3px" }}>{step.title}</h3>
                    <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>{step.desc}</p>
                  </div>

                  {/* 3D icon */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                    <motion.img
                      src={step.img}
                      alt={step.title}
                      style={{ width: 130, height: 130, objectFit: "contain", filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.15))" }}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: i * 0.12 + 0.2, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ y: -8, scale: 1.05 }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA below */}
          <motion.div {...fadeUp(0.3)} style={{ textAlign: "center", marginTop: 52 }}>
            <Link href="/register">
              <button style={{ background: O, color: "#fff", border: "none", borderRadius: 50, padding: "14px 36px", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 0 32px rgba(249,115,22,0.35)", display: "inline-flex", alignItems: "center", gap: 10 }}>
                {t("home_start_free")} <ArrowRight size={18} />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── SERVICES POPULAIRES ────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 100px", background: "#f9fafb" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <motion.div {...fadeUp()} style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 12, color: "#111827" }}>{t("home_svc_count")}</h2>
            <p style={{ color: "#6b7280", fontSize: 16 }}>{t("home_svc_list")}</p>
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
                {t("home_see_all")} <ArrowRight size={16} />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── APP SCREENSHOT SECTION ─────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 100px", background: "#fff" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ background: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)", border: "1px solid #fed7aa", borderRadius: 32, padding: "60px 48px 0", display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 48, overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", top: "50%", right: "30%", transform: "translateY(-50%)", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />

            <div style={{ flex: "1 1 320px", position: "relative", zIndex: 1, paddingBottom: 60 }}>
              <motion.div {...fadeUp()}>
                <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16 }}>{t("home_app_badge")}</p>
                <h2 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 20, lineHeight: 1.15, color: "#111827" }}>
                  {t("home_app_title1")}<br />{t("home_app_title2")}
                </h2>
                <p style={{ color: "#6b7280", fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>
                  {t("home_app_desc")}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
                  {[t("home_app_f1"), t("home_app_f2"), t("home_app_f3"), t("home_app_f4")].map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CheckCircle size={12} color={O} />
                      </div>
                      <span style={{ fontSize: 15, color: "#374151" }}>{f}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#111827", color: "#fff", borderRadius: 12, padding: "12px 20px", fontWeight: 700, fontSize: 14, opacity: 0.55, cursor: "not-allowed", userSelect: "none" }}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.32.07 2.22.72 2.98.75.98-.16 1.93-.82 2.97-.77 1.27.07 2.22.55 2.83 1.44-2.59 1.55-1.98 4.95.34 5.94-.52 1.28-1.1 2.54-2.12 3.5zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                    {t("home_app_store")}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: O, color: "#fff", borderRadius: 12, padding: "12px 20px", fontWeight: 700, fontSize: 14, opacity: 0.55, cursor: "not-allowed", userSelect: "none" }}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                      <path d="M3 20.5v-17c0-.83 1-1.3 1.6-.75l14 8.5c.54.33.54 1.17 0 1.5l-14 8.5c-.6.55-1.6.08-1.6-.75z" fill="white"/>
                    </svg>
                    {t("home_google_play")}
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} style={{ flex: "1 1 280px", display: "flex", justifyContent: "center" }}>
              <img src={appHand} alt="ZyNum" style={{ maxWidth: 340, width: "100%", objectFit: "contain", filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.15))" }} />
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
              <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16 }}>{t("home_mm_badge")}</p>
              <h2 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 20, lineHeight: 1.15, color: "#111827" }}>
                {t("home_mm_title1")}<br />{t("home_mm_title2")}
              </h2>
              <p style={{ color: "#6b7280", fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
                {t("home_mm_desc")}
              </p>
              <div>
                <img src={mobileMoneyLogos} alt="TM Money, Wave, Airtel" style={{ maxWidth: 160, width: "100%", objectFit: "contain", filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.12))" }} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CRYPTO ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 100px", background: "#fff" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)", border: "1px solid #e5e7eb", borderRadius: 32, padding: "60px 48px", textAlign: "center", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
            <motion.div {...fadeUp()} style={{ maxWidth: 520, margin: "0 auto" }}>
              <div style={{ margin: "0 auto 24px", width: 72, height: 72 }}>
                <img src={cryptoIcon} alt="Crypto" style={{ width: 72, height: 72, objectFit: "contain", filter: "drop-shadow(0 8px 24px rgba(249,115,22,0.25))" }} />
              </div>
              <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16 }}>{t("home_crypto_badge")}</p>
              <h2 style={{ fontSize: "clamp(26px, 3vw, 42px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 16, color: "#111827" }}>
                {t("home_crypto_title")}
              </h2>
              <p style={{ color: "#6b7280", fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>
                {t("home_crypto_desc")}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
                {["USDT", "BTC", "ETH", "USDC", "BNB", "TRX"].map((sym) => (
                  <span key={sym} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 16px", fontSize: 13, fontWeight: 700, color: "#374151", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>{sym}</span>
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
            <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>{t("home_aff_badge")}</p>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 16, color: "#111827" }}>
              {t("home_aff_earn_title")}
            </h2>
            <p style={{ color: "#6b7280", fontSize: 18, maxWidth: 560, margin: "0 auto" }}>
              {t("home_aff_earn_sub")}
            </p>
          </motion.div>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <motion.div {...fadeUp(0.05)}
              style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 28, padding: 40, position: "relative", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", maxWidth: 480, width: "100%" }}
            >
              <div style={{ width: 60, height: 60, borderRadius: "50%", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28, background: "#f9fafb" }}>
                <Globe2 size={26} color="#6b7280" />
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: "#111827" }}>{t("home_aff_badge")}</div>
              <div style={{ color: "#6b7280", fontSize: 16, lineHeight: 1.7, marginBottom: 28 }}>
                {t("home_aff_card_desc").split("10%")[0]}<strong style={{ color: O, fontSize: 20 }}>10%</strong>{t("home_aff_card_desc").split("10%")[1]}
              </div>
              <Link href="/register">
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: O, color: "#fff", borderRadius: 10, padding: "12px 24px", fontWeight: 700, cursor: "pointer", fontSize: 15, boxShadow: "0 4px 16px rgba(249,115,22,0.3)" }}>
                  {t("home_aff_join_btn")} <ArrowRight size={15} />
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 100px", background: "#fff" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <motion.div {...fadeUp()} style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>{t("home_feat_badge")}</p>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-1px", color: "#111827" }}>
              {t("home_feat_title")}
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {[
              { icon: <Zap size={24} color={O} />,                                                                              title: t("home_feat1_title"), desc: t("home_feat1_desc") },
              { icon: <Globe2 size={24} color={O} />,                                                                           title: t("home_feat2_title"), desc: t("home_feat2_desc") },
              { icon: <img src={iconLock}     alt="" style={{ width: 24, height: 24, filter: ICON_ORANGE }} />,                 title: t("home_feat3_title"), desc: t("home_feat3_desc") },
              { icon: <img src={iconCard}     alt="" style={{ width: 24, height: 24, filter: ICON_ORANGE }} />,                 title: t("home_feat4_title"), desc: t("home_feat4_desc") },
              { icon: <img src={cryptoIcon}   alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />,               title: t("home_feat5_title"), desc: t("home_feat5_desc") },
              { icon: <img src={iconGift}     alt="" style={{ width: 24, height: 24, filter: ICON_ORANGE }} />,                 title: t("home_feat6_title"), desc: t("home_feat6_desc") },
              { icon: <img src={iconSupport}  alt="" style={{ width: 24, height: 24, filter: ICON_ORANGE }} />,                 title: t("home_feat7_title"), desc: t("home_feat7_desc") },
              { icon: <img src={iconWithdraw} alt="" style={{ width: 24, height: 24, filter: ICON_ORANGE }} />,                 title: t("home_feat8_title"), desc: t("home_feat8_desc") },
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
            <p style={{ color: O, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>{t("home_faq_badge")}</p>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-1px", color: "#111827" }}>{t("home_faq_title")}</h2>
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
                {t("home_cta_ready")}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 18, maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.7 }}>
                {t("home_cta_sub2")}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
                <Link href="/register">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", color: O, padding: "16px 36px", borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
                    {t("home_cta_create")} <ArrowRight size={18} />
                  </div>
                </Link>
                <Link href="/buy">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", padding: "16px 36px", borderRadius: 14, fontWeight: 600, fontSize: 16, cursor: "pointer" }}>
                    {t("home_cta_see_services")}
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
