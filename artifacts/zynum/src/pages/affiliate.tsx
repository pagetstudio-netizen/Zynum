import React, { useState, useEffect, useCallback } from "react";
import {
  Copy, Check, Users, WalletCards, Clock,
  ArrowDownToLine, Share2, X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/use-currency";
import "./affiliate-reference.css";

const API = "/api";
const RATE = 620;

function authHeaders() {
  const token = localStorage.getItem("zynum_token") ?? "";
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function apiFetch(url: string) {
  const r = await fetch(`${API}${url}`, { headers: authHeaders() });
  return r.json();
}

async function apiPost(url: string, body: unknown) {
  const r = await fetch(`${API}${url}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return r.json();
}

type Stats = {
  referralCode: string | null;
  affiliateBalance: number;
  filleulCount: number;
  totalEarned: number;
  pendingWithdrawal: number;
};

type Referral = { id: number; name: string; email: string; createdAt: string };

const COUNTRIES = [
  "Sénégal", "Côte d'Ivoire", "Cameroun", "Mali", "Burkina Faso",
  "Guinée", "Bénin", "Togo", "Niger", "Congo", "Gabon",
  "Mauritanie", "Madagascar", "Rwanda", "Burundi", "Ghana",
  "Nigeria", "Kenya", "France", "Belgique", "Suisse", "Canada",
  "Autre",
];

export default function AffiliatePage() {
  const { toast } = useToast();
  const { currency } = useCurrency();
  const [stats, setStats] = useState<Stats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [withdrawCountry, setWithdrawCountry] = useState("Sénégal");
  const [submitting, setSubmitting] = useState(false);

  const fmt = (usd: number) =>
    currency === "FCFA"
      ? `${Math.round(usd * RATE).toLocaleString("fr-FR")} FCFA`
      : `$${usd.toFixed(2)}`;

  const statAmount = (usd: number) =>
    currency === "FCFA"
      ? `${Math.round(usd * RATE).toLocaleString("fr-FR")} FCFA`
      : `${usd.toFixed(0)}$`;

  const toUsd = (val: string) => {
    const n = parseFloat(val);
    if (!n || n <= 0) return 0;
    return currency === "FCFA" ? n / RATE : n;
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        apiFetch("/v1/affiliate/stats"),
        apiFetch("/v1/affiliate/referrals"),
      ]);
      setStats(s);
      setReferrals(r.referrals ?? []);
    } catch {
      toast({ variant: "destructive", title: "Erreur de chargement" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const referralLink = stats?.referralCode
    ? `${window.location.origin}/register?ref=${stats.referralCode}`
    : null;

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Lien copié !", description: "Partagez-le avec vos contacts." });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Mon lien ZyNum",
          text: "Partagez mon lien et profitez de ZyNum.",
          url: referralLink,
        });
      } catch {
        // La fermeture de la feuille de partage ne doit pas afficher d'erreur.
      }
      return;
    }
    copyLink();
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountUsd = toUsd(withdrawAmount);
    if (!amountUsd || amountUsd <= 0) {
      toast({ variant: "destructive", title: "Montant invalide" });
      return;
    }
    if (stats && amountUsd > stats.affiliateBalance) {
      toast({ variant: "destructive", title: "Solde insuffisant" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiPost("/v1/affiliate/withdraw", {
        amountUsd,
        phone: withdrawPhone,
        country: withdrawCountry,
      });
      if (res.withdrawal) {
        toast({ title: "Demande soumise !", description: "Traitement sous 48h." });
        setShowWithdrawForm(false);
        setWithdrawAmount("");
        setWithdrawPhone("");
        await load();
      } else {
        toast({ variant: "destructive", title: "Erreur", description: res.message ?? "Impossible de soumettre" });
      }
    } catch {
      toast({ variant: "destructive", title: "Erreur réseau" });
    } finally {
      setSubmitting(false);
    }
  };

  const maxInput = stats
    ? (currency === "FCFA" ? Math.round(stats.affiliateBalance * RATE) : stats.affiliateBalance)
    : 0;

  if (loading) {
    return (
      <div className="affiliate-reference affiliate-reference-loading">
        <div className="affiliate-reference-loader" />
      </div>
    );
  }

  return (
    <div className="affiliate-reference">
      <section className="affiliate-reference-intro">
        <p>Partagez votre lien pour obtenir un bonus de 10%<br />sur chaque achat de vos filleuls.</p>
      </section>

      <section className="affiliate-reference-link-card">
        <div className="affiliate-reference-link-row">
          <span className="affiliate-reference-link" title={referralLink ?? undefined}>
            {referralLink ?? "Lien de parrainage indisponible"}
          </span>
          <button
            type="button"
            onClick={copyLink}
            disabled={!referralLink}
            className="affiliate-reference-copy"
          >
            {copied ? <Check /> : <Copy />}
            <span>{copied ? "Copié" : "Copier"}</span>
          </button>
        </div>
      </section>

      <div className="affiliate-reference-actions">
        <button
          type="button"
          onClick={shareLink}
          disabled={!referralLink}
          className="affiliate-reference-share"
        >
          <Share2 />
          Partager
        </button>
        <button
          type="button"
          onClick={() => setShowWithdrawForm(true)}
          disabled={(stats?.affiliateBalance ?? 0) <= 0}
          className="affiliate-reference-withdraw"
        >
          <ArrowDownToLine />
          {stats?.affiliateBalance ? "Retirer les gains" : "Aucun gain à encaisser"}
        </button>
      </div>

      {showWithdrawForm && (
        <section className="affiliate-reference-withdraw-panel">
          <div className="affiliate-reference-panel-heading">
            <h3>Retirer les gains</h3>
            <button type="button" onClick={() => setShowWithdrawForm(false)} aria-label="Fermer">
              <X />
            </button>
          </div>
          <form onSubmit={handleWithdraw} className="affiliate-reference-form">
            <label>
              Montant ({currency})
              <input
                type="number"
                step={currency === "FCFA" ? "1" : "0.01"}
                min={currency === "FCFA" ? "620" : "1"}
                max={maxInput}
                placeholder={currency === "FCFA" ? "Ex : 3100" : "Ex : 5.00"}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                required
              />
            </label>
            <label>
              Pays
              <select value={withdrawCountry} onChange={(e) => setWithdrawCountry(e.target.value)} required>
                {COUNTRIES.map((country) => <option key={country}>{country}</option>)}
              </select>
            </label>
            <label className="affiliate-reference-form-wide">
              Numéro Mobile Money / Téléphone
              <input
                type="tel"
                placeholder="Ex : +221 77 123 45 67"
                value={withdrawPhone}
                onChange={(e) => setWithdrawPhone(e.target.value)}
                required
              />
            </label>
            <p className="affiliate-reference-withdraw-note">
              <Clock /> Les retraits sont traités sous 48h ouvrables.
            </p>
            <div className="affiliate-reference-form-actions">
              <button type="button" onClick={() => setShowWithdrawForm(false)}>Annuler</button>
              <button type="submit" disabled={submitting}>
                {submitting ? "Envoi..." : "Confirmer le retrait"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="affiliate-reference-stats">
        <div className="affiliate-reference-stat-card">
          <div className="affiliate-reference-stat-icon affiliate-reference-stat-icon-users">
            <Users />
          </div>
          <p>Affiliés</p>
          <strong>{stats?.filleulCount ?? 0}</strong>
        </div>
        <div className="affiliate-reference-stat-card">
          <div className="affiliate-reference-stat-icon affiliate-reference-stat-icon-money">
            <WalletCards />
          </div>
          <p>Mes Gains</p>
          <strong>{statAmount(stats?.affiliateBalance ?? 0)}</strong>
        </div>
      </section>

      <section className="affiliate-reference-referrals">
        <h2>Mes affiliés</h2>
        {referrals.length === 0 ? (
          <div className="affiliate-reference-empty">
            <Users />
            <p>Aucun affilié pour l'instant</p>
          </div>
        ) : (
          <div className="affiliate-reference-referral-list">
            {referrals.map((referral) => (
              <div key={referral.id} className="affiliate-reference-referral-row">
                <div className="affiliate-reference-referral-avatar">
                  {referral.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong>{referral.name}</strong>
                  <span>{new Date(referral.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}