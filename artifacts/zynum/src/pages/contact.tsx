import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Clock, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { usePublicSettings, openTelegramSupport, openWhatsAppSupport } from "@/hooks/use-public-settings";

const API = "/api";

export default function Contact() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { settings } = usePublicSettings();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        toast({ title: data.message ?? "Erreur lors de l'envoi", variant: "destructive" });
        return;
      }
      setSent(true);
    } catch {
      toast({ title: "Erreur réseau. Réessayez.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const tgHandle = settings.support_telegram ?? t("contact_telegram_val");

  const INFO = [
    { icon: <Mail className="w-6 h-6 text-primary" />, title: t("contact_email_title"), val: t("contact_email_val"), desc: t("contact_email_desc"), onClick: undefined as (() => void) | undefined },
    { icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#26A5E4]" aria-hidden="true">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      ), title: t("contact_telegram_title"), val: tgHandle.startsWith("http") ? t("contact_telegram_title") : tgHandle, desc: t("contact_telegram_desc"), onClick: () => openTelegramSupport(tgHandle) },
    { icon: <Clock className="w-6 h-6 text-yellow-500" />, title: t("contact_avail_title"), val: t("contact_avail_val"), desc: t("contact_avail_desc"), onClick: undefined },
  ];

  return (
    <div className="w-full py-16">
      <section className="text-center pb-16 relative bg-gradient-to-b from-blue-50 to-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="container max-w-3xl mx-auto px-4 relative z-10 pt-12">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">{t("contact_badge")}</p>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-gray-900 mb-5">{t("contact_title")}</h1>
          <p className="text-lg text-gray-500 mb-8">{t("contact_sub")}</p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <button
              onClick={() => openTelegramSupport(tgHandle)}
              className="inline-flex items-center gap-3 bg-[#26A5E4] hover:bg-[#1a8fc7] text-white font-bold px-7 py-4 rounded-2xl shadow-lg shadow-[#26A5E4]/30 transition-all hover:scale-105 active:scale-95 text-base"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current shrink-0" aria-hidden="true">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span>{t("contact_telegram_cta")}</span>
              <span className="ml-1 bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">{t("contact_telegram_recommended")}</span>
            </button>
            <p className="text-sm text-gray-400 mt-3">{t("contact_telegram_cta_desc")}</p>
          </motion.div>

          {/* Bouton WhatsApp configurable par l'admin */}
          {settings.whatsapp_button_enabled === "true" && settings.whatsapp_button_link && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-4">
              <button
                onClick={() => openWhatsAppSupport(settings.whatsapp_button_link!)}
                className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#1da851] text-white font-bold px-7 py-4 rounded-2xl shadow-lg shadow-[#25D366]/30 transition-all hover:scale-105 active:scale-95 text-base"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current shrink-0" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>Support WhatsApp</span>
              </button>
            </motion.div>
          )}
        </div>
      </section>

      <div className="container max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            {INFO.map((item) => (
              <div
                key={item.title}
                onClick={item.onClick}
                className={`rounded-2xl border p-5 flex gap-4 shadow-sm transition-all ${
                  item.onClick
                    ? "border-[#26A5E4]/30 bg-[#26A5E4]/5 cursor-pointer hover:bg-[#26A5E4]/10 hover:border-[#26A5E4]/50 hover:shadow-md hover:shadow-[#26A5E4]/10"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                  item.onClick ? "bg-[#26A5E4]/10 border-[#26A5E4]/20" : "bg-gray-100 border-gray-200"
                }`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs text-gray-400">{item.title}</p>
                    {item.onClick && (
                      <span className="text-[10px] font-bold text-[#26A5E4] bg-[#26A5E4]/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                        {t("contact_telegram_recommended")}
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-gray-900 text-sm">{item.val}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                {item.onClick && (
                  <span className="self-center text-[#26A5E4] text-lg font-bold shrink-0">→</span>
                )}
              </div>
            ))}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <p className="text-sm text-primary font-semibold mb-1">{t("contact_fast_title")}</p>
              <p className="text-xs text-gray-500">{t("contact_fast_desc")}</p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              {sent ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{t("contact_sent_title")}</h2>
                  <p className="text-gray-500">{t("contact_sent_desc")}</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">{t("contact_form_title")}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">{t("contact_label_name")}</label>
                      <Input required placeholder={t("contact_placeholder_name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 h-11 focus:border-primary focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">{t("contact_label_email")}</label>
                      <Input required type="email" placeholder="votre@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 h-11 focus:border-primary focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">{t("contact_label_subject")}</label>
                    <Input required placeholder={t("contact_placeholder_subject")} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 h-11 focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">{t("contact_label_message")}</label>
                    <textarea required rows={5} placeholder={t("contact_placeholder_message")} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm" />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-base shadow-xl shadow-primary/25">
                    {loading ? (
                      <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Envoi...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Send className="w-4 h-4" /> {t("contact_send_btn")}</span>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
