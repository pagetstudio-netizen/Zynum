import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { usePublicSettings, openWhatsAppSupport } from "@/hooks/use-public-settings";

const FAQS = {
  fr: [
    { q: "Qu'est-ce qu'un numéro virtuel ?", a: "Un numéro virtuel est un numéro de téléphone temporaire qui vous permet de recevoir des SMS de vérification (codes OTP) sans utiliser votre vrai numéro. Parfait pour créer des comptes sur Telegram, WhatsApp, Google, etc." },
    { q: "Comment fonctionne ZyNum ?", a: "Vous choisissez un service (ex: Telegram), puis un pays, puis un opérateur. ZyNum vous assigne un numéro virtuel instantanément. Entrez ce numéro dans l'application souhaitée, le SMS arrive en quelques secondes, et votre code OTP s'affiche." },
    { q: "Quels modes de paiement sont acceptés ?", a: "Le paiement se fait via votre solde ZyNum. Vous rechargez votre compte directement sur la plateforme. Plusieurs méthodes seront disponibles : carte bancaire, Mobile Money, cryptomonnaie et virement." },
    { q: "Combien de temps mon numéro reste-t-il actif ?", a: "Un numéro reste actif pendant environ 20 minutes après l'achat. C'est largement suffisant pour recevoir votre code OTP. Si vous n'avez pas reçu de SMS, vous pouvez annuler et obtenir un remboursement automatique." },
    { q: "Puis-je annuler si je ne reçois pas le SMS ?", a: "Oui ! Depuis la page d'achat, si vous n'avez pas encore reçu de SMS, vous pouvez cliquer sur 'Annuler et rembourser'. Le montant est crédité automatiquement sur votre solde." },
    { q: "Puis-je utiliser le même numéro plusieurs fois ?", a: "Non. Les numéros virtuels ZyNum sont à usage unique pour garantir la sécurité. Chaque vérification nécessite l'achat d'un nouveau numéro." },
    { q: "Quels services sont compatibles ?", a: "Plus de 200 services : Telegram, WhatsApp, Gmail, Facebook, Instagram, TikTok, Snapchat, Twitter/X, Uber, Amazon, Microsoft et bien d'autres. La liste s'agrandit régulièrement." },
    { q: "Y a-t-il une API disponible pour les développeurs ?", a: "Oui ! ZyNum propose une API REST complète. Consultez notre page documentation API pour les endpoints, clés d'authentification et exemples de code." },
    { q: "Mes données personnelles sont-elles en sécurité ?", a: "Absolument. Nous ne collectons que les informations minimales nécessaires (email, nom). Vos activités sont chiffrées et nous ne revendons jamais vos données à des tiers." },
    { q: "Comment recharger mon solde ?", a: "Rendez-vous dans la section 'Recharger' de votre tableau de bord ZyNum. Plusieurs méthodes de paiement seront disponibles (carte, Mobile Money, crypto…). Une fois rechargé, votre solde est disponible instantanément." },
  ],
  en: [
    { q: "What is a virtual number?", a: "A virtual number is a temporary phone number that lets you receive verification SMS (OTP codes) without using your real number. Perfect for creating accounts on Telegram, WhatsApp, Google, etc." },
    { q: "How does ZyNum work?", a: "You choose a service (e.g. Telegram), then a country, then an operator. ZyNum instantly assigns you a virtual number. Enter that number in the target app, the SMS arrives in seconds, and your OTP code appears." },
    { q: "What payment methods are accepted?", a: "Payment is made via your ZyNum balance. You top up your account directly on the platform. Several methods will be available: bank card, Mobile Money, cryptocurrency and bank transfer." },
    { q: "How long does my number stay active?", a: "A number stays active for about 20 minutes after purchase. That's more than enough to receive your OTP code. If you haven't received an SMS, you can cancel and get an automatic refund." },
    { q: "Can I cancel if I don't receive the SMS?", a: "Yes! From the purchase page, if you haven't received an SMS yet, you can click 'Cancel and refund'. The amount is automatically credited to your balance." },
    { q: "Can I use the same number multiple times?", a: "No. ZyNum virtual numbers are single-use to guarantee security. Each verification requires purchasing a new number." },
    { q: "Which services are compatible?", a: "Over 200 services: Telegram, WhatsApp, Gmail, Facebook, Instagram, TikTok, Snapchat, Twitter/X, Uber, Amazon, Microsoft and many more. The list grows regularly." },
    { q: "Is there an API available for developers?", a: "Yes! ZyNum offers a complete REST API. See our API documentation page for endpoints, authentication keys and code examples." },
    { q: "Is my personal data secure?", a: "Absolutely. We only collect the minimum necessary information (email, name). Your activities are encrypted and we never resell your data to third parties." },
    { q: "How do I top up my balance?", a: "Go to the 'Top up' section of your ZyNum dashboard. Several payment methods will be available (card, Mobile Money, crypto…). Once topped up, your balance is available instantly." },
  ],
};

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors">
        <span className="font-semibold text-gray-900 pr-4">{q}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <p className="px-5 pb-5 text-gray-500 leading-relaxed text-sm border-t border-gray-100 pt-4">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const { t, lang } = useLanguage();
  const { settings } = usePublicSettings();
  const faqs = FAQS[lang] ?? FAQS.fr;

  return (
    <div className="w-full">
      <section className="py-20 text-center relative bg-gradient-to-b from-blue-50 to-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="container max-w-3xl mx-auto px-4 relative z-10">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">{t("faq_badge")}</p>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-gray-900 mb-5">{t("faq_title")}</h1>
          <p className="text-lg text-gray-500">{t("faq_sub")}</p>
        </div>
      </section>

      <section className="py-8 pb-24 bg-gray-50">
        <div className="container max-w-3xl mx-auto px-4 space-y-3">
          {faqs.map((faq) => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      <section className="py-16 border-t border-gray-200 bg-white">
        <div className="container max-w-3xl mx-auto px-4 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-10 text-center shadow-sm">
            <MessageSquare className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{t("faq_no_answer")}</h2>
            <p className="text-gray-500 mb-6">{t("faq_no_answer_desc")}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact">
                <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-8">{t("faq_contact_btn")}</Button>
              </Link>
              {settings.whatsapp_button_enabled === "true" && settings.whatsapp_button_link && (
                <button
                  onClick={() => openWhatsAppSupport(settings.whatsapp_button_link!)}
                  className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white font-semibold px-8 py-2 rounded-md shadow transition-all hover:scale-105 active:scale-95 text-sm"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Support WhatsApp
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
