import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, Mail, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import {
  WHATSAPP_SUPPORT_NUMBER,
  openWhatsAppSupport,
} from "@/hooks/use-public-settings";

const API = "/api";

export default function Contact() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API}/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const data = await response.json();
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

  const info = [
    {
      icon: <Mail className="w-6 h-6 text-primary" />,
      title: t("contact_email_title"),
      value: t("contact_email_val"),
      description: t("contact_email_desc"),
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-[#25D366]" />,
      title: "WhatsApp",
      value: WHATSAPP_SUPPORT_NUMBER,
      description: "Service client via WhatsApp",
      onClick: () => openWhatsAppSupport(WHATSAPP_SUPPORT_NUMBER),
    },
    {
      icon: <Clock className="w-6 h-6 text-yellow-500" />,
      title: t("contact_avail_title"),
      value: t("contact_avail_val"),
      description: t("contact_avail_desc"),
    },
  ];

  return (
    <div className="w-full bg-[#f8fafc] py-16 text-gray-900">
      <section className="relative bg-gradient-to-b from-blue-50 to-white pb-16 text-center">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[200px] w-[400px] -translate-x-1/2 rounded-full bg-primary/10 blur-[80px]" />
        <div className="container relative z-10 mx-auto max-w-3xl px-4 pt-12">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">{t("contact_badge")}</p>
          <h1 className="mb-5 text-4xl font-display font-extrabold text-gray-900 md:text-5xl">{t("contact_title")}</h1>
          <p className="mb-8 text-lg text-gray-500">{t("contact_sub")}</p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <button
              type="button"
              onClick={() => openWhatsAppSupport(WHATSAPP_SUPPORT_NUMBER)}
              className="inline-flex items-center gap-3 rounded-2xl bg-[#25D366] px-7 py-4 text-base font-bold text-white shadow-lg shadow-[#25D366]/30 transition-all hover:scale-105 hover:bg-[#1da851] active:scale-95"
            >
              <MessageCircle className="h-6 w-6 shrink-0" />
              Contacter sur WhatsApp
            </button>
            <p className="mt-3 text-sm text-gray-400">Service client WhatsApp : {WHATSAPP_SUPPORT_NUMBER}</p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-4">
            {info.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={item.onClick}
                disabled={!item.onClick}
                className={`flex w-full gap-4 rounded-2xl border p-5 text-left shadow-sm transition-all ${
                  item.onClick
                    ? "cursor-pointer border-[#25D366]/30 bg-[#25D366]/5 hover:border-[#25D366]/50 hover:bg-[#25D366]/10"
                    : "cursor-default border-gray-200 bg-white"
                }`}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                  item.onClick ? "border-[#25D366]/20 bg-[#25D366]/10" : "border-gray-200 bg-gray-100"
                }`}>
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-0.5 text-xs text-gray-400">{item.title}</p>
                  <p className="truncate text-sm font-bold text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-400">{item.description}</p>
                </div>
                {item.onClick && <span className="self-center text-lg font-bold text-[#25D366]">→</span>}
              </button>
            ))}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <p className="mb-1 text-sm font-semibold text-primary">{t("contact_fast_title")}</p>
              <p className="text-xs text-gray-500">{t("contact_fast_desc")}</p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              {sent ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-12 text-center">
                  <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
                  <h2 className="mb-3 text-2xl font-bold text-gray-900">{t("contact_sent_title")}</h2>
                  <p className="text-gray-500">{t("contact_sent_desc")}</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="mb-6 text-xl font-bold text-gray-900">{t("contact_form_title")}</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-600">{t("contact_label_name")}</label>
                      <Input required placeholder={t("contact_placeholder_name")} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-11 border-gray-200 bg-white text-gray-900" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-600">{t("contact_label_email")}</label>
                      <Input required type="email" placeholder="votre@email.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="h-11 border-gray-200 bg-white text-gray-900" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-600">{t("contact_label_subject")}</label>
                    <Input required placeholder={t("contact_placeholder_subject")} value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} className="h-11 border-gray-200 bg-white text-gray-900" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-600">{t("contact_label_message")}</label>
                    <textarea required rows={5} placeholder={t("contact_placeholder_message")} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-primary text-base font-bold text-white shadow-xl shadow-primary/25 hover:bg-primary/90">
                    {loading ? (
                      <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Envoi...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Send className="h-4 w-4" /> {t("contact_send_btn")}</span>
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