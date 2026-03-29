import React, { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight, ShieldCheck, Zap, Globe2, MessageSquare,
  Code, CheckCircle, Star, ChevronRight, Smartphone,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { useGetServices } from "@workspace/api-client-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: "easeOut" },
});

function HomeSvcLogo({ icon, color, name, size = 48 }: { icon: string; color: string; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const lightBg = ["#FFFC00", "#F0B90B", "#FAE100", "#FFC629"].some(c => color.toUpperCase() === c);
  const showFallback = failed || !icon;
  return (
    <div style={{ width: size, height: size, background: color, borderRadius: size * 0.22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {!showFallback ? (
        <img src={icon} alt={name} style={{ width: size * 0.58, height: size * 0.58, objectFit: "contain" }} onError={() => setFailed(true)} />
      ) : (
        <span style={{ fontWeight: 700, fontSize: size * 0.36, color: lightBg ? "#000" : "#fff", lineHeight: 1, userSelect: "none" }}>
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();
  const { data: servicesData } = useGetServices();

  const STATS = [
    { value: "50K+",  label: t("home_stats_numbers") },
    { value: "180+",  label: t("home_stats_countries") },
    { value: "200+",  label: t("home_stats_services") },
    { value: "99.9%", label: t("home_stats_uptime") },
  ];

  const STEPS = [
    {
      num: "01",
      icon: <Smartphone className="w-7 h-7" />,
      title: t("home_step1_title"),
      desc: t("home_step1_desc"),
    },
    {
      num: "02",
      icon: <Globe2 className="w-7 h-7" />,
      title: t("home_step2_title"),
      desc: t("home_step2_desc"),
    },
    {
      num: "03",
      icon: <CheckCircle className="w-7 h-7" />,
      title: t("home_step3_title"),
      desc: t("home_step3_desc"),
    },
  ];

  const FEATURES = [
    { icon: <Zap className="w-6 h-6 text-yellow-400" />, bg: "bg-yellow-400/10 border-yellow-400/20", title: t("home_feat_instant"), desc: t("home_feat_instant_desc") },
    { icon: <Globe2 className="w-6 h-6 text-blue-400" />, bg: "bg-blue-400/10 border-blue-400/20", title: t("home_feat_global"), desc: t("home_feat_global_desc") },
    { icon: <ShieldCheck className="w-6 h-6 text-green-400" />, bg: "bg-green-400/10 border-green-400/20", title: t("home_feat_secure"), desc: t("home_feat_secure_desc") },
    { icon: <Headphones className="w-6 h-6 text-purple-400" />, bg: "bg-purple-400/10 border-purple-400/20", title: t("home_feat_support"), desc: t("home_feat_support_desc") },
  ];

  return (
    <div className="w-full flex flex-col items-center overflow-x-hidden">

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="w-full relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute bottom-0 right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/15 blur-[100px]" />
          <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[80px]" />
          <div className="absolute inset-0 grid-overlay-60" />
        </div>

        <div className="container max-w-7xl mx-auto px-4 relative z-10 py-24 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left">
            <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 mb-8 text-sm font-medium text-primary">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {t("home_badge")}
            </motion.div>

            <motion.h1 {...fadeUp(0.1)} className="text-5xl md:text-6xl xl:text-7xl font-display font-extrabold text-white leading-[1.08] tracking-tight mb-6">
              {t("home_hero_title1")}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-primary to-cyan-400">
                {t("home_hero_accent")}
              </span>{" "}
              {t("home_hero_title2")}
            </motion.h1>

            <motion.p {...fadeUp(0.2)} className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              {t("home_hero_sub")}
            </motion.p>

            <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/register">
                <Button size="lg" className="h-14 px-8 rounded-xl text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/30 transition-all hover:-translate-y-1">
                  {t("home_start_free")} <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/buy">
                <Button size="lg" variant="outline" className="h-14 px-8 rounded-xl text-base font-semibold border-white/20 bg-white/5 hover:bg-white/10 text-white transition-all">
                  {t("nav_buy")}
                </Button>
              </Link>
            </motion.div>

            <motion.div {...fadeUp(0.4)} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-10 max-w-sm lg:max-w-none mx-auto lg:mx-0 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] px-3 py-2 rounded-lg"><CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> {t("home_cta_no_card")}</span>
              <span className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] px-3 py-2 rounded-lg"><CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> {t("footer_countries")}</span>
              <span className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] px-3 py-2 rounded-lg"><CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> {t("home_feat_instant")}</span>
            </motion.div>
          </div>

          {/* Right: floating card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex-shrink-0 w-full max-w-sm lg:max-w-md relative"
          >
            <div className="relative rounded-3xl border border-white/10 bg-[#0d1526]/90 backdrop-blur-xl p-6 shadow-2xl shadow-black/50">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                  <img src="https://cdn.simpleicons.org/telegram/ffffff" className="w-6 h-6" alt="Telegram" />
                </div>
                <div>
                  <p className="text-white font-bold">Telegram</p>
                  <p className="text-muted-foreground text-xs">{t("login_subtitle").split("/")[0].trim()}</p>
                </div>
                <span className="ml-auto text-xs font-semibold text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">ACTIF</span>
              </div>

              <div className="bg-black/40 rounded-2xl p-4 mb-4 border border-white/5">
                <p className="text-xs text-muted-foreground mb-1">{t("buy_phone")}</p>
                <p className="text-2xl font-bold text-white font-mono tracking-wider">+63 912 345 6789</p>
                <p className="text-xs text-muted-foreground mt-1">🇵🇭 Philippines · virtual2</p>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">SMS reçu il y a 3 sec</p>
                  <p className="text-sm text-white font-medium">Telegram code: <span className="text-green-400 font-bold text-lg">84 271</span></p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <div className="flex-1 bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">{t("buy_price")}</p>
                  <p className="font-bold text-white">62 FCFA</p>
                </div>
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">{t("buy_time_left")}</p>
                  <p className="font-bold text-white">3 sec</p>
                </div>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 bg-primary rounded-2xl px-4 py-3 shadow-xl shadow-primary/30 flex items-center gap-2">
              <Zap className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-bold">{t("home_feat_instant")}</span>
            </div>

            <Link href="/register">
              <div className="absolute -bottom-4 -left-4 bg-[#0d1526] border border-white/10 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2 cursor-pointer hover:bg-[#111d38] hover:border-white/20 transition-all group">
                <div className="relative">
                  <div className="flex -space-x-2">
                    {["/avatar1.jpeg", "/avatar2.jpeg", "/avatar3.jpeg"].map((src, i) => (
                      <img key={i} src={src} alt="user" className="w-6 h-6 rounded-full border-2 border-[#0d1526] object-cover" style={{ zIndex: 3 - i }} />
                    ))}
                  </div>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#0d1526] animate-pulse" />
                </div>
                <div>
                  <p className="text-white text-xs font-bold group-hover:text-primary transition-colors">50K+ utilisateurs</p>
                  <p className="text-[10px] text-muted-foreground leading-none">Rejoindre →</p>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <section className="w-full border-y border-white/5 bg-white/[0.02]">
        <div className="container max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-1">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ───────────────────────────────────────────────── */}
      <section className="w-full py-24">
        <div className="container max-w-7xl mx-auto px-4">
          <motion.div {...fadeUp()} className="text-center mb-14">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">200+ {t("home_stats_services").toLowerCase()}</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">{t("home_services_title")}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t("home_services_sub")}</p>
          </motion.div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {(servicesData?.services ?? []).slice(0, 24).map((svc, i) => (
              <Link key={svc.id} href={`/buy?service=${svc.id}`}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03 }}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/10 transition-all cursor-pointer group"
                >
                  <div className="group-hover:scale-110 transition-transform">
                    <HomeSvcLogo icon={svc.icon} color={svc.color} name={svc.name} size={48} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-white transition-colors text-center leading-tight">{svc.name}</span>
                </motion.div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/buy">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white">
                {t("home_see_prices")} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────── */}
      <section className="w-full py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent pointer-events-none" />
        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">{t("home_how_title")}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t("home_how_sub")}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center p-8 rounded-3xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5">{step.icon}</div>
                <span className="absolute top-6 right-6 text-4xl font-black text-white/5 leading-none select-none">{step.num}</span>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-xl shadow-primary/25">
                {t("home_start_free")} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section className="w-full py-24 border-t border-white/5">
        <div className="container max-w-7xl mx-auto px-4">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">{t("home_why_title")}</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 ${feat.bg} group-hover:scale-110 transition-transform`}>{feat.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── API CTA ────────────────────────────────────────────────── */}
      <section className="w-full py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        </div>
        <div className="container max-w-6xl mx-auto px-4">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0d1a35] to-[#060d1f] p-8 md:p-16 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 blur-[60px] rounded-full pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
                <Code className="w-4 h-4" /> {t("footer_api")}
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-5">
                Intégrez ZyNum<br />dans votre application
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                API REST simple et puissante. Documentation complète, uptime garanti à 99.9%.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/api-docs">
                  <Button size="lg" className="h-12 px-8 rounded-xl bg-white text-black hover:bg-gray-100 font-bold shadow-xl transition-all hover:-translate-y-1">
                    <Code className="mr-2 w-5 h-5" /> Voir la documentation
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="h-12 px-8 rounded-xl border-white/20 text-white hover:bg-white/10">
                    {t("home_start_free")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────── */}
      <section className="w-full py-24 border-t border-white/5">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <motion.div {...fadeUp()}>
            <div className="flex justify-center mb-6 gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-extrabold text-white mb-5">
              {t("home_cta_title")} <span className="text-primary">{t("home_cta_accent")}</span> {t("home_cta_title2")}
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              {t("home_cta_sub")}
            </p>
            <Link href="/register">
              <Button size="lg" className="h-14 px-10 rounded-xl text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/30 transition-all hover:-translate-y-1">
                {t("home_cta_btn")} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-4">{t("home_cta_no_card")}</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
