import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Clock, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app this would call an API
    setSent(true);
  };

  return (
    <div className="w-full py-16">
      {/* Header */}
      <section className="text-center pb-16 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="container max-w-3xl mx-auto px-4 relative z-10">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">Support</p>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-5">Contactez-nous</h1>
          <p className="text-lg text-muted-foreground">Notre équipe est là pour vous aider. Réponse garantie sous 24h.</p>
        </div>
      </section>

      <div className="container max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Info cards */}
          <div className="space-y-4">
            {[
              { icon: <Mail className="w-6 h-6 text-primary" />, title: "Email", val: "support@zynum.app", desc: "Réponse sous 24h" },
              { icon: <MessageSquare className="w-6 h-6 text-green-400" />, title: "Telegram", val: "@ZyNumSupport", desc: "Support en temps réel" },
              { icon: <Clock className="w-6 h-6 text-yellow-400" />, title: "Disponibilité", val: "24h/24 · 7j/7", desc: "Nous sommes toujours là" },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">{item.title}</p>
                  <p className="font-bold text-white text-sm">{item.val}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}

            {/* Response time note */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <p className="text-sm text-primary font-semibold mb-1">⚡ Réponse rapide garantie</p>
              <p className="text-xs text-muted-foreground">Pour les problèmes urgents (commande en cours, remboursement), nous répondons généralement en moins de 2 heures.</p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              {sent ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-3">Message envoyé !</h2>
                  <p className="text-muted-foreground">Notre équipe vous répondra dans les plus brefs délais.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-xl font-bold text-white mb-6">Envoyer un message</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">Nom complet</label>
                      <Input
                        required
                        placeholder="Votre nom"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="bg-black/20 border-white/10 text-white placeholder:text-white/30 h-11"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">Adresse email</label>
                      <Input
                        required
                        type="email"
                        placeholder="votre@email.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="bg-black/20 border-white/10 text-white placeholder:text-white/30 h-11"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Sujet</label>
                    <Input
                      required
                      placeholder="Ex: Problème de remboursement"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="bg-black/20 border-white/10 text-white placeholder:text-white/30 h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Message</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Décrivez votre problème ou question en détail…"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-white/30 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    />
                  </div>

                  <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-base shadow-xl shadow-primary/25">
                    <Send className="w-4 h-4 mr-2" /> Envoyer le message
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
