import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const FAQS = [
  {
    q: "Qu'est-ce qu'un numéro virtuel ?",
    a: "Un numéro virtuel est un numéro de téléphone temporaire qui vous permet de recevoir des SMS de vérification (codes OTP) sans utiliser votre vrai numéro. Parfait pour créer des comptes sur Telegram, WhatsApp, Google, etc.",
  },
  {
    q: "Comment fonctionne ZyNum ?",
    a: "Vous choisissez un service (ex: Telegram), puis un pays, puis un opérateur. ZyNum vous assigne un numéro virtuel instantanément. Entrez ce numéro dans l'application souhaitée, le SMS arrive en quelques secondes, et votre code OTP s'affiche.",
  },
  {
    q: "Quels modes de paiement sont acceptés ?",
    a: "ZyNum affiche les prix en FCFA pour votre confort. Le paiement se fait via votre solde 5SIM que vous rechargez directement sur 5sim.net. Plusieurs méthodes sont disponibles (cartes, crypto, Mobile Money selon votre région).",
  },
  {
    q: "Combien de temps mon numéro reste-t-il actif ?",
    a: "Un numéro reste actif pendant environ 20 minutes après l'achat. C'est largement suffisant pour recevoir votre code OTP. Si vous n'avez pas reçu de SMS, vous pouvez annuler et obtenir un remboursement automatique.",
  },
  {
    q: "Puis-je annuler si je ne reçois pas le SMS ?",
    a: "Oui ! Depuis la page d'achat, si vous n'avez pas encore reçu de SMS, vous pouvez cliquer sur 'Annuler et rembourser'. Le montant est crédité automatiquement sur votre solde.",
  },
  {
    q: "Puis-je utiliser le même numéro plusieurs fois ?",
    a: "Non. Les numéros virtuels ZyNum sont à usage unique pour garantir la sécurité. Chaque vérification nécessite l'achat d'un nouveau numéro.",
  },
  {
    q: "Quels services sont compatibles ?",
    a: "Plus de 200 services : Telegram, WhatsApp, Gmail, Facebook, Instagram, TikTok, Snapchat, Twitter/X, Uber, Amazon, Microsoft et bien d'autres. La liste s'agrandit régulièrement.",
  },
  {
    q: "Y a-t-il une API disponible pour les développeurs ?",
    a: "Oui ! ZyNum propose une API REST complète. Consultez notre page documentation API pour les endpoints, clés d'authentification et exemples de code.",
  },
  {
    q: "Mes données personnelles sont-elles en sécurité ?",
    a: "Absolument. Nous ne collectons que les informations minimales nécessaires (email, nom). Vos activités sont chiffrées et nous ne revendons jamais vos données à des tiers.",
  },
  {
    q: "Comment recharger mon solde ?",
    a: "Rendez-vous sur 5sim.net pour recharger votre solde 5SIM. Plusieurs méthodes sont disponibles. Une fois rechargé, votre solde est disponible instantanément sur ZyNum.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.03] transition-colors"
      >
        <span className="font-semibold text-white pr-4">{q}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="px-5 pb-5 text-muted-foreground leading-relaxed text-sm border-t border-white/5 pt-4">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="py-20 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="container max-w-3xl mx-auto px-4 relative z-10">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">Aide</p>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-5">Questions fréquentes</h1>
          <p className="text-lg text-muted-foreground">Tout ce que vous devez savoir sur ZyNum et les numéros virtuels.</p>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-8 pb-24">
        <div className="container max-w-3xl mx-auto px-4 space-y-3">
          {FAQS.map((faq) => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* Still need help */}
      <section className="py-16 border-t border-white/5">
        <div className="container max-w-3xl mx-auto px-4 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10">
            <MessageSquare className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">Vous n'avez pas trouvé votre réponse ?</h2>
            <p className="text-muted-foreground mb-6">Notre équipe est disponible pour vous aider.</p>
            <Link href="/contact">
              <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-8">Contacter le support</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
