import React, { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Search, ChevronRight, ShoppingCart, CreditCard, User,
  MessageSquare, Smartphone, AlertCircle, Clock, CheckCircle,
  Zap, Globe2, Phone, ArrowLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Article {
  id: string;
  title: string;
  desc: string;
  readTime: string;
}

interface Category {
  id: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  title: string;
  desc: string;
  count: number;
  articles: Article[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const CATEGORIES: Category[] = [
  {
    id: "demarrer",
    icon: <Zap className="w-6 h-6" />,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10 border-yellow-400/20",
    title: "Démarrer avec ZyNum",
    desc: "Tout ce qu'il faut savoir pour bien commencer.",
    count: 5,
    articles: [
      { id: "a1", title: "Comment créer un compte ZyNum", desc: "Créez votre compte en moins de 2 minutes.", readTime: "2 min" },
      { id: "a2", title: "Qu'est-ce qu'un numéro virtuel ?", desc: "Comprendre comment fonctionnent les numéros virtuels OTP.", readTime: "3 min" },
      { id: "a3", title: "Comment recevoir votre premier SMS", desc: "Guide pas à pas pour votre première vérification.", readTime: "4 min" },
      { id: "a4", title: "Changer la devise (USD / FCFA)", desc: "Afficher les prix dans votre devise préférée.", readTime: "1 min" },
      { id: "a5", title: "Comprendre votre tableau de bord", desc: "Vue d'ensemble de toutes les fonctionnalités.", readTime: "3 min" },
    ],
  },
  {
    id: "acheter",
    icon: <ShoppingCart className="w-6 h-6" />,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10 border-blue-400/20",
    title: "Acheter un numéro",
    desc: "Comment acheter et utiliser vos numéros virtuels.",
    count: 6,
    articles: [
      { id: "b1", title: "Choisir le bon service (Telegram, WhatsApp…)", desc: "Comment sélectionner le bon service pour votre besoin.", readTime: "2 min" },
      { id: "b2", title: "Choisir un pays et un opérateur", desc: "Comprendre les différences entre pays et opérateurs.", readTime: "3 min" },
      { id: "b3", title: "Aperçu du numéro avant confirmation", desc: "Voir et confirmer votre numéro avant de l'utiliser.", readTime: "2 min" },
      { id: "b4", title: "Obtenir un autre numéro (changer de numéro)", desc: "Comment changer de numéro si le premier ne fonctionne pas.", readTime: "2 min" },
      { id: "b5", title: "Annuler une commande et être remboursé", desc: "Comment annuler et obtenir votre remboursement.", readTime: "2 min" },
      { id: "b6", title: "Je n'ai pas reçu mon SMS — que faire ?", desc: "Solutions si le code OTP n'arrive pas.", readTime: "4 min" },
    ],
  },
  {
    id: "paiements",
    icon: <CreditCard className="w-6 h-6" />,
    color: "text-green-400",
    bgColor: "bg-green-400/10 border-green-400/20",
    title: "Paiements et solde",
    desc: "Rechargez votre solde et gérez vos paiements.",
    count: 4,
    articles: [
      { id: "c1", title: "Comment recharger mon solde ZyNum", desc: "Méthodes disponibles pour ajouter du crédit.", readTime: "3 min" },
      { id: "c2", title: "Prix en FCFA — comment ça marche ?", desc: "Conversion automatique USD ↔ FCFA sur ZyNum.", readTime: "2 min" },
      { id: "c3", title: "Comprendre mon historique de commandes", desc: "Retrouver toutes vos transactions passées.", readTime: "2 min" },
      { id: "c4", title: "Pourquoi mon paiement a-t-il échoué ?", desc: "Raisons courantes d'échec et solutions.", readTime: "3 min" },
    ],
  },
  {
    id: "compte",
    icon: <User className="w-6 h-6" />,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10 border-purple-400/20",
    title: "Mon compte",
    desc: "Gérez votre profil et vos paramètres.",
    count: 4,
    articles: [
      { id: "d1", title: "Modifier mon profil", desc: "Changer votre nom et vos informations.", readTime: "2 min" },
      { id: "d2", title: "Changer mon mot de passe", desc: "Sécuriser votre compte avec un nouveau mot de passe.", readTime: "2 min" },
      { id: "d3", title: "Supprimer mon compte", desc: "Comment supprimer définitivement votre compte ZyNum.", readTime: "3 min" },
      { id: "d4", title: "Récupérer l'accès à mon compte", desc: "Mot de passe oublié ou compte bloqué.", readTime: "3 min" },
    ],
  },
  {
    id: "services",
    icon: <Smartphone className="w-6 h-6" />,
    color: "text-pink-400",
    bgColor: "bg-pink-400/10 border-pink-400/20",
    title: "Services compatibles",
    desc: "Telegram, WhatsApp, Google et 200+ autres apps.",
    count: 5,
    articles: [
      { id: "e1", title: "Vérification Telegram — guide complet", desc: "Créer ou vérifier un compte Telegram avec un numéro virtuel.", readTime: "4 min" },
      { id: "e2", title: "Vérification WhatsApp", desc: "Activer WhatsApp avec un numéro ZyNum.", readTime: "3 min" },
      { id: "e3", title: "Vérification Gmail / Google", desc: "Créer un compte Google avec un numéro virtuel.", readTime: "4 min" },
      { id: "e4", title: "Vérification TikTok et Instagram", desc: "Créer des comptes sur les réseaux sociaux.", readTime: "3 min" },
      { id: "e5", title: "Quel pays choisir pour quel service ?", desc: "Recommandations de pays par service.", readTime: "5 min" },
    ],
  },
  {
    id: "problemes",
    icon: <AlertCircle className="w-6 h-6" />,
    color: "text-red-400",
    bgColor: "bg-red-400/10 border-red-400/20",
    title: "Résoudre un problème",
    desc: "Solutions aux problèmes les plus courants.",
    count: 4,
    articles: [
      { id: "f1", title: "Le numéro est déjà utilisé par quelqu'un", desc: "Que faire si le service refuse votre numéro virtuel.", readTime: "3 min" },
      { id: "f2", title: "Le SMS n'arrive pas après 5 minutes", desc: "Étapes à suivre si le code OTP est en retard.", readTime: "4 min" },
      { id: "f3", title: "Numéro en rupture de stock dans mon pays", desc: "Trouver des alternatives quand un pays n'est pas disponible.", readTime: "2 min" },
      { id: "f4", title: "Erreur lors de l'achat du numéro", desc: "Diagnostiquer et résoudre les erreurs d'achat.", readTime: "3 min" },
    ],
  },
];

const POPULAR = [
  { cat: "Acheter un numéro", title: "Je n'ai pas reçu mon SMS — que faire ?", readTime: "4 min" },
  { cat: "Démarrer", title: "Qu'est-ce qu'un numéro virtuel ?", readTime: "3 min" },
  { cat: "Paiements", title: "Comment recharger mon solde ZyNum", readTime: "3 min" },
  { cat: "Services", title: "Vérification Telegram — guide complet", readTime: "4 min" },
  { cat: "Problèmes", title: "Le numéro est déjà utilisé par quelqu'un", readTime: "3 min" },
];

// ─── Article Modal (inline) ────────────────────────────────────────────────────
function ArticleView({ article, category, onBack }: { article: Article; category: Category; onBack: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour à {category.title}
      </button>

      <div className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full border mb-5 ${category.color} ${category.bgColor}`}>
        {category.icon}
        <span>{category.title}</span>
      </div>

      <h1 className="text-3xl font-display font-bold text-white mb-3">{article.title}</h1>
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-8">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.readTime} de lecture</span>
        <span>·</span>
        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400" /> À jour</span>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 space-y-5 text-muted-foreground leading-relaxed">
        <p>
          Cet article vous explique en détail comment <strong className="text-white">{article.title.toLowerCase()}</strong>.
          Suivez les étapes ci-dessous pour résoudre votre problème ou accomplir l'action souhaitée.
        </p>

        <div>
          <h3 className="text-white font-bold text-lg mb-3">Étape 1 — Vérifiez les prérequis</h3>
          <ul className="space-y-2 list-none">
            {["Assurez-vous d'être connecté à votre compte ZyNum.", "Vérifiez que votre solde ZyNum est suffisant.", "Utilisez un navigateur récent (Chrome, Firefox, Safari)."].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-white font-bold text-lg mb-3">Étape 2 — Suivez la procédure</h3>
          <p>{article.desc} Pour toute question supplémentaire, n'hésitez pas à contacter notre support via le bouton ci-dessous.</p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-primary font-semibold mb-1">💡 Astuce</p>
          <p className="text-sm">Si le problème persiste après avoir suivi ces étapes, contactez notre équipe support. Nous répondons généralement en moins de 2 heures.</p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
        <div>
          <p className="text-white font-semibold mb-1">Cet article vous a-t-il aidé ?</p>
          <p className="text-sm text-muted-foreground">Votre retour nous aide à améliorer notre aide.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-green-500/30 text-green-400 hover:bg-green-500/10">👍 Oui</Button>
          <Button variant="outline" size="sm" className="border-white/20 text-muted-foreground hover:bg-white/5">👎 Non</Button>
        </div>
      </div>

      <div className="mt-6 p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <MessageSquare className="w-10 h-10 text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-white font-semibold">Besoin d'aide supplémentaire ?</p>
          <p className="text-sm text-muted-foreground">Notre équipe répond sous 2 heures.</p>
        </div>
        <Link href="/contact">
          <Button className="bg-primary hover:bg-primary/90 text-white font-semibold shrink-0">Contacter le support</Button>
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Category View ─────────────────────────────────────────────────────────────
function CategoryView({ category, onBack, onArticle }: { category: Category; onBack: () => void; onArticle: (a: Article) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Centre d'aide
      </button>

      <div className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full border mb-6 ${category.color} ${category.bgColor}`}>
        {category.icon}
        <span>{category.title}</span>
      </div>

      <h1 className="text-3xl font-display font-bold text-white mb-2">{category.title}</h1>
      <p className="text-muted-foreground mb-8">{category.desc}</p>

      <div className="space-y-2">
        {category.articles.map((article, i) => (
          <motion.button
            key={article.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => onArticle(article)}
            className="w-full flex items-center justify-between gap-4 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 text-left transition-all group"
          >
            <div>
              <p className="font-semibold text-white mb-1 group-hover:text-primary transition-colors">{article.title}</p>
              <p className="text-sm text-muted-foreground">{article.desc}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTime}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Help Center ──────────────────────────────────────────────────────────
export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Search filtering
  const filteredCategories = CATEGORIES.map((cat) => ({
    ...cat,
    articles: cat.articles.filter(
      (a) =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.desc.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => !search || cat.articles.length > 0);

  const searchResults = search
    ? CATEGORIES.flatMap((cat) =>
        cat.articles
          .filter(
            (a) =>
              a.title.toLowerCase().includes(search.toLowerCase()) ||
              a.desc.toLowerCase().includes(search.toLowerCase())
          )
          .map((a) => ({ ...a, category: cat }))
      )
    : [];

  if (selectedArticle && selectedCategory) {
    return (
      <div className="w-full py-10">
        <div className="container max-w-4xl mx-auto px-4">
          <ArticleView article={selectedArticle} category={selectedCategory} onBack={() => setSelectedArticle(null)} />
        </div>
      </div>
    );
  }

  if (selectedCategory) {
    return (
      <div className="w-full py-10">
        <div className="container max-w-4xl mx-auto px-4">
          <CategoryView
            category={selectedCategory}
            onBack={() => setSelectedCategory(null)}
            onArticle={(a) => setSelectedArticle(a)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[100px] rounded-full" />
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
        </div>
        <div className="container max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">Centre d'aide</p>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-5">
              Comment pouvons-nous<br />vous aider ?
            </h1>
            <p className="text-muted-foreground mb-10">Trouvez rapidement une réponse à votre question.</p>

            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un article… ex: SMS, remboursement, Telegram"
                className="h-14 pl-12 pr-5 text-base rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container max-w-6xl mx-auto px-4 pb-24">
        {/* Search results */}
        {search && searchResults.length > 0 && (
          <div className="mb-12">
            <p className="text-sm text-muted-foreground mb-4">{searchResults.length} résultat(s) pour "{search}"</p>
            <div className="space-y-2">
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setSelectedCategory(r.category); setSelectedArticle(r); }}
                  className="w-full flex items-center justify-between gap-4 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-left transition-all group"
                >
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{r.category.title}</p>
                    <p className="font-semibold text-white group-hover:text-primary transition-colors">{r.title}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {search && searchResults.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-2">Aucun résultat pour "{search}"</p>
            <Link href="/contact"><Button variant="outline" className="border-white/20 text-white hover:bg-white/10 mt-4">Contacter le support</Button></Link>
          </div>
        )}

        {/* Categories */}
        {!search && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
              {CATEGORIES.map((cat, i) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => setSelectedCategory(cat)}
                  className="flex flex-col items-start p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 text-left transition-all group"
                >
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${cat.bgColor} ${cat.color} group-hover:scale-110 transition-transform`}>
                    {cat.icon}
                  </div>
                  <h3 className="font-bold text-white text-lg mb-1.5 group-hover:text-primary transition-colors">{cat.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{cat.desc}</p>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-auto">
                    <CheckCircle className="w-3 h-3" /> {cat.count} articles
                    <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Popular articles */}
            <div className="mb-16">
              <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" /> Articles populaires
              </h2>
              <div className="space-y-2">
                {POPULAR.map((art, i) => {
                  const cat = CATEGORIES.find((c) => c.title === art.cat) ?? CATEGORIES[0];
                  const article = cat.articles.find((a) => a.title === art.title) ?? cat.articles[0];
                  return (
                    <button
                      key={i}
                      onClick={() => { setSelectedCategory(cat); setSelectedArticle(article); }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-left transition-all group"
                    >
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${cat.bgColor} ${cat.color}`}>
                        {cat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">{art.cat}</p>
                        <p className="font-medium text-white truncate group-hover:text-primary transition-colors">{art.title}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />{art.readTime}
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact CTA */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0d1a35] to-[#060d1f] p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />
              <div className="relative z-10">
                <MessageSquare className="w-12 h-12 text-primary mx-auto mb-5" />
                <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">
                  Vous n'avez pas trouvé de réponse ?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                  Notre équipe de support est disponible 24h/24. Réponse garantie en moins de 2 heures pour les problèmes urgents.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/contact">
                    <Button size="lg" className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-xl shadow-primary/25">
                      <MessageSquare className="w-4 h-4 mr-2" /> Contacter le support
                    </Button>
                  </Link>
                  <a href="https://t.me/ZyNumSupport" target="_blank" rel="noopener noreferrer">
                    <Button size="lg" variant="outline" className="h-12 px-8 border-white/20 text-white hover:bg-white/10 rounded-xl">
                      <Globe2 className="w-4 h-4 mr-2" /> Telegram Support
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
