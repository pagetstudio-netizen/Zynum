import React from "react";
import { motion } from "framer-motion";
import { Users, Globe2, Zap, ShieldCheck, Target, Heart } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="w-full py-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="container max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">Notre histoire</p>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-6">
              À propos de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">ZyNum</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              ZyNum est né d'un besoin simple : rendre les numéros virtuels accessibles à tous en Afrique de l'Ouest, avec des paiements en FCFA et une interface en français.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="w-full py-16 border-t border-white/5">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">Notre mission</p>
              <h2 className="text-3xl font-display font-bold text-white mb-5">
                Démocratiser l'accès aux numéros virtuels
              </h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Nous croyons que chaque personne a le droit de protéger sa vie privée en ligne. Avec ZyNum, vous pouvez créer des comptes sur n'importe quelle plateforme sans exposer votre vrai numéro de téléphone.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Notre infrastructure connectée à 5SIM vous donne accès à plus de 180 pays et 200 services, avec des prix transparents en FCFA.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Target className="w-6 h-6 text-primary" />, title: "Mission", val: "Accessibilité" },
                { icon: <Heart className="w-6 h-6 text-red-400" />, title: "Valeur", val: "Confiance" },
                { icon: <Zap className="w-6 h-6 text-yellow-400" />, title: "Vitesse", val: "< 5 secondes" },
                { icon: <Globe2 className="w-6 h-6 text-blue-400" />, title: "Couverture", val: "180+ pays" },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-3">{item.icon}</div>
                  <p className="text-xs text-muted-foreground mb-1">{item.title}</p>
                  <p className="font-bold text-white">{item.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="w-full py-16 border-t border-white/5">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-display font-bold text-white text-center mb-10">Nos valeurs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: <ShieldCheck className="w-8 h-8 text-green-400" />, title: "Sécurité", desc: "Vos données personnelles sont protégées. Nous ne revendons jamais vos informations." },
              { icon: <Zap className="w-8 h-8 text-yellow-400" />, title: "Rapidité", desc: "Numéros provisionnés instantanément. Code OTP reçu en quelques secondes." },
              { icon: <Users className="w-8 h-8 text-blue-400" />, title: "Communauté", desc: "Pensé pour les utilisateurs d'Afrique de l'Ouest avec support en français." },
            ].map((v) => (
              <div key={v.title} className="rounded-2xl border border-white/5 bg-white/[0.03] p-8 text-center">
                <div className="flex justify-center mb-4">{v.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-20 border-t border-white/5">
        <div className="container max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold text-white mb-5">Prêt à nous rejoindre ?</h2>
          <p className="text-muted-foreground mb-8">Créez votre compte gratuitement et obtenez votre premier numéro virtuel.</p>
          <Link href="/register">
            <Button size="lg" className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-xl shadow-primary/25">
              Créer un compte gratuit
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
