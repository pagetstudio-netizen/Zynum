import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight, ShieldCheck, Zap, Globe2, MessageSquare,
  Code, Phone, CheckCircle, Star, ChevronRight, Smartphone,
  Clock, Users, Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: "easeOut" },
});

const SERVICES = [
  { name: "Telegram",  color: "#2AABEE", icon: "telegram" },
  { name: "WhatsApp",  color: "#25D366", icon: "whatsapp" },
  { name: "Google",    color: "#4285F4", icon: "google" },
  { name: "Facebook",  color: "#1877F2", icon: "facebook" },
  { name: "TikTok",    color: "#010101", icon: "tiktok" },
  { name: "Instagram", color: "#E1306C", icon: "instagram" },
  { name: "Twitter",   color: "#1DA1F2", icon: "x" },
  { name: "Snapchat",  color: "#FFFC00", icon: "snapchat" },
  { name: "Tinder",    color: "#FE3C72", icon: "tinder" },
  { name: "Uber",      color: "#000000", icon: "uber" },
  { name: "Amazon",    color: "#FF9900", icon: "amazon" },
  { name: "Microsoft", color: "#00A4EF", icon: "microsoft" },
];

const STATS = [
  { value: "50K+",  label: "Numéros vendus" },
  { value: "180+",  label: "Pays disponibles" },
  { value: "200+",  label: "Services supportés" },
  { value: "99.9%", label: "Disponibilité" },
];

const STEPS = [
  {
    num: "01",
    icon: <Smartphone className="w-7 h-7" />,
    title: "Choisissez un service",
    desc: "Sélectionnez l'application pour laquelle vous avez besoin d'un code OTP (Telegram, WhatsApp, Gmail…).",
  },
  {
    num: "02",
    icon: <Globe2 className="w-7 h-7" />,
    title: "Sélectionnez un pays",
    desc: "Choisissez parmi 180+ pays. Comparez les prix et la disponibilité en temps réel.",
  },
  {
    num: "03",
    icon: <CheckCircle className="w-7 h-7" />,
    title: "Recevez votre SMS",
    desc: "Obtenez un numéro virtuel instantanément et recevez votre code OTP en quelques secondes.",
  },
];

export default function Home() {
  return (
    <div className="w-full flex flex-col items-center overflow-x-hidden">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="w-full relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute bottom-0 right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/15 blur-[100px]" />
          <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[80px]" />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        <div className="container max-w-7xl mx-auto px-4 relative z-10 py-24 flex flex-col lg:flex-row items-center gap-16">
          {/* Left: text */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 mb-8 text-sm font-medium text-primary">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Numéros virtuels · OTP instantané
            </motion.div>

            <motion.h1 {...fadeUp(0.1)} className="text-5xl md:text-6xl xl:text-7xl font-display font-extrabold text-white leading-[1.08] tracking-tight mb-6">
              Recevez vos<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-primary to-cyan-400">
                codes OTP
              </span>{" "}
              sans<br />SIM physique
            </motion.h1>

            <motion.p {...fadeUp(0.2)} className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              Achetez un numéro virtuel dans 180+ pays, recevez vos SMS de vérification pour Telegram, WhatsApp, Google et des centaines d'autres services — sans carte SIM physique.
            </motion.p>

            <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/register">
                <Button size="lg" className="h-14 px-8 rounded-xl text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/30 transition-all hover:-translate-y-1">
                  Commencer gratuitement <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/buy">
                <Button size="lg" variant="outline" className="h-14 px-8 rounded-xl text-base font-semibold border-white/20 bg-white/5 hover:bg-white/10 text-white transition-all">
                  Acheter un numéro
                </Button>
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div {...fadeUp(0.4)} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-10 max-w-sm lg:max-w-none mx-auto lg:mx-0 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] px-3 py-2 rounded-lg"><CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> Aucune SIM requise</span>
              <span className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] px-3 py-2 rounded-lg"><CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> 180+ pays couverts</span>
              <span className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] px-3 py-2 rounded-lg"><CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> Livraison instantanée</span>
            </motion.div>
          </div>

          {/* Right: floating card mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex-shrink-0 w-full max-w-sm lg:max-w-md relative"
          >
            {/* Main card */}
            <div className="relative rounded-3xl border border-white/10 bg-[#0d1526]/90 backdrop-blur-xl p-6 shadow-2xl shadow-black/50">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                  <img src="https://cdn.simpleicons.org/telegram/ffffff" className="w-6 h-6" alt="Telegram" />
                </div>
                <div>
                  <p className="text-white font-bold">Telegram</p>
                  <p className="text-muted-foreground text-xs">Vérification de compte</p>
                </div>
                <span className="ml-auto text-xs font-semibold text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">ACTIF</span>
              </div>

              <div className="bg-black/40 rounded-2xl p-4 mb-4 border border-white/5">
                <p className="text-xs text-muted-foreground mb-1">Numéro virtuel</p>
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
                  <p className="text-xs text-muted-foreground">Prix</p>
                  <p className="font-bold text-white">62 FCFA</p>
                </div>
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Délai</p>
                  <p className="font-bold text-white">3 sec</p>
                </div>
              </div>
            </div>

            {/* Floating badge – top right */}
            <div className="absolute -top-4 -right-4 bg-primary rounded-2xl px-4 py-3 shadow-xl shadow-primary/30 flex items-center gap-2">
              <Zap className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-bold">Instantané</span>
            </div>
            {/* Floating badge – bottom left – clickable users widget */}
            <Link href="/register">
              <div className="absolute -bottom-4 -left-4 bg-[#0d1526] border border-white/10 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2 cursor-pointer hover:bg-[#111d38] hover:border-white/20 transition-all group">
                <div className="relative">
                  <div className="flex -space-x-2">
                    {["#3b82f6","#10b981","#f59e0b"].map((c, i) => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0d1526] flex items-center justify-center text-[9px] font-bold text-white" style={{ background: c, zIndex: 3 - i }} />
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

      {/* ── Stats ───────────────────────────────────────────────────────── */}
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

      {/* ── Services grid ───────────────────────────────────────────────── */}
      <section className="w-full py-24">
        <div className="container max-w-7xl mx-auto px-4">
          <motion.div {...fadeUp()} className="text-center mb-14">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">200+ services compatibles</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Compatible avec toutes vos applications
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Recevez des SMS de vérification pour n'importe quelle application, réseau social ou service en ligne.
            </p>
          </motion.div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {SERVICES.map((svc, i) => (
              <motion.div
                key={svc.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/10 transition-all cursor-pointer group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ background: svc.color }}
                >
                  <img
                    src={`https://cdn.simpleicons.org/${svc.icon}/ffffff`}
                    alt={svc.name}
                    className="w-7 h-7 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-white transition-colors">{svc.name}</span>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/buy">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white">
                Voir tous les services <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="w-full py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent pointer-events-none" />
        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">Simple & rapide</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Comment ça fonctionne ?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">En moins de 60 secondes, vous recevez votre code OTP.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
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
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5">
                  {step.icon}
                </div>
                <span className="absolute top-6 right-6 text-4xl font-black text-white/5 leading-none select-none">{step.num}</span>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-xl shadow-primary/25">
                Créer un compte gratuit <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="w-full py-24 border-t border-white/5">
        <div className="container max-w-7xl mx-auto px-4">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">Nos avantages</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
              Simple, rapide<br />et fiable
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Zap className="w-6 h-6 text-yellow-400" />, bg: "bg-yellow-400/10 border-yellow-400/20", title: "Livraison instantanée", desc: "Votre numéro est prêt en moins de 5 secondes. SMS reçu en temps réel." },
              { icon: <Globe2 className="w-6 h-6 text-blue-400" />, bg: "bg-blue-400/10 border-blue-400/20", title: "180+ pays", desc: "Philippines, Pologne, Indonésie, Nigeria, France et bien d'autres." },
              { icon: <ShieldCheck className="w-6 h-6 text-green-400" />, bg: "bg-green-400/10 border-green-400/20", title: "100% anonyme", desc: "Protégez votre identité. Aucune SIM physique, aucun abonnement." },
              { icon: <Headphones className="w-6 h-6 text-purple-400" />, bg: "bg-purple-400/10 border-purple-400/20", title: "Support 24/7", desc: "Une équipe disponible pour vous aider à tout moment." },
            ].map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 ${feat.bg} group-hover:scale-110 transition-transform`}>
                  {feat.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── API CTA ─────────────────────────────────────────────────────── */}
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
                <Code className="w-4 h-4" /> API Développeur
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-5">
                Intégrez ZyNum dans<br />votre application
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                API REST simple et puissante pour automatiser vos vérifications SMS. Documentation complète, SDKs disponibles, uptime garanti à 99.9%.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/api-docs">
                  <Button size="lg" className="h-12 px-8 rounded-xl bg-white text-black hover:bg-gray-100 font-bold shadow-xl transition-all hover:-translate-y-1">
                    <Code className="mr-2 w-5 h-5" /> Voir la documentation
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="h-12 px-8 rounded-xl border-white/20 text-white hover:bg-white/10">
                    Créer un compte API
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="w-full py-24 border-t border-white/5">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <motion.div {...fadeUp()}>
            <div className="flex justify-center mb-6 gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-extrabold text-white mb-5">
              Prêt à commencer ?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Rejoignez des milliers d'utilisateurs dans le monde entier qui font confiance à ZyNum pour leurs numéros virtuels.
            </p>
            <Link href="/register">
              <Button size="lg" className="h-14 px-10 rounded-xl text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/30 transition-all hover:-translate-y-1">
                Créer mon compte — C'est gratuit <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
