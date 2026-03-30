import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Clock, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { SocialBar } from "@/components/social-bar";

const API = "/api";

export default function Contact() {
  const { t } = useLanguage();
  const { toast } = useToast();
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

  const INFO = [
    { icon: <Mail className="w-6 h-6 text-primary" />, title: t("contact_email_title"), val: t("contact_email_val"), desc: t("contact_email_desc") },
    { icon: <MessageSquare className="w-6 h-6 text-green-500" />, title: t("contact_telegram_title"), val: t("contact_telegram_val"), desc: t("contact_telegram_desc") },
    { icon: <Clock className="w-6 h-6 text-yellow-500" />, title: t("contact_avail_title"), val: t("contact_avail_val"), desc: t("contact_avail_desc") },
  ];

  return (
    <div className="w-full py-16">
      <section className="text-center pb-16 relative bg-gradient-to-b from-blue-50 to-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="container max-w-3xl mx-auto px-4 relative z-10 pt-12">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">{t("contact_badge")}</p>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-gray-900 mb-5">{t("contact_title")}</h1>
          <p className="text-lg text-gray-500">{t("contact_sub")}</p>
        </div>
      </section>

      <div className="container max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            {INFO.map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-5 flex gap-4 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">{item.title}</p>
                  <p className="font-bold text-gray-900 text-sm">{item.val}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <p className="text-sm text-primary font-semibold mb-1">{t("contact_fast_title")}</p>
              <p className="text-xs text-gray-500">{t("contact_fast_desc")}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <SocialBar label="Suivez-nous" size="sm" />
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
