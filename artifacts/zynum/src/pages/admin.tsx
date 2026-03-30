import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Users, ShoppingBag, CreditCard, MessageSquare,
  Settings, HelpCircle, Share2, Globe2, TrendingUp, Wallet,
  Zap, Shield, Plus, Trash2, Edit3, Ban, CheckCircle,
  Search, ChevronLeft, ChevronRight, RefreshCw, Send,
  ToggleLeft, ToggleRight, DollarSign, Percent, Star,
  Package, AlertTriangle, Clock, Database, Bell, Eye, EyeOff, Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const API = "/api";

const n = (v: unknown): number => Number(v) || 0;

function useAdminFetch<T>(endpoint: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = () => {
    setLoading(true);
    const token = localStorage.getItem("zynum_token") ?? "";
    fetch(`${API}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Erreur de chargement"); setLoading(false); });
  };

  useEffect(refetch, deps);
  return { data, loading, error, refetch };
}

async function adminPost(endpoint: string, body: unknown) {
  const token = localStorage.getItem("zynum_token") ?? "";
  const r = await fetch(`${API}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function adminPatch(endpoint: string, body: unknown) {
  const token = localStorage.getItem("zynum_token") ?? "";
  const r = await fetch(`${API}${endpoint}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function adminDelete(endpoint: string) {
  const token = localStorage.getItem("zynum_token") ?? "";
  const r = await fetch(`${API}${endpoint}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.json();
}

/* ─── STAT CARD ────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card/40 p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold text-white truncate">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── TABLE WRAPPER ─────────────────────────────────────────────────────── */
function Table({ headers, children, empty }: { headers: string[]; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            {headers.map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {empty
            ? <tr><td colSpan={headers.length} className="text-center py-12 text-muted-foreground text-sm">Aucun résultat</td></tr>
            : children}
        </tbody>
      </table>
    </div>
  );
}

/* ─── PAGINATION ────────────────────────────────────────────────────────── */
function Pagination({ page, total, limit, onChange }: { page: number; total: number; limit: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
      <span>{total} résultats — page {page}/{pages}</span>
      <div className="flex gap-2">
        <button disabled={page === 1} onClick={() => onChange(page - 1)} className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
        <button disabled={page === pages} onClick={() => onChange(page + 1)} className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

/* ─── STATUS BADGE ──────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    RECEIVED: "bg-green-500/20 text-green-400 border-green-500/30",
    FINISHED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    TIMEOUT: "bg-gray-500/20 text-gray-400",
    BANNED: "bg-red-500/20 text-red-400",
    CANCELED: "bg-gray-500/20 text-gray-400",
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    pending: "bg-yellow-500/20 text-yellow-400",
    failed: "bg-red-500/20 text-red-400",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${map[status] ?? "bg-gray-500/20 text-gray-400"}`}>{status}</span>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: STATS DASHBOARD
══════════════════════════════════════════════════════════════════════════════ */
function AdminStats() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [queryStr, setQueryStr] = useState("");
  const { data, loading, refetch } = useAdminFetch<any>(`/v1/admin/stats${queryStr}`, [queryStr]);

  const applyDates = () => setQueryStr(from || to ? `?from=${from}&to=${to}` : "");
  const s = data ?? {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Du</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Au</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
        </div>
        <Button onClick={applyDates} className="bg-primary hover:bg-primary/90 text-white">Filtrer</Button>
        <Button variant="outline" onClick={() => { setFrom(""); setTo(""); setQueryStr(""); }} className="border-white/10 text-white hover:bg-white/5">Reset</Button>
        <button onClick={refetch} className="p-2 rounded-xl border border-white/10 text-muted-foreground hover:text-white hover:bg-white/5"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Utilisateurs total" value={s.users?.total ?? 0} sub={`${s.users?.newToday ?? 0} nouveaux aujourd'hui`} icon={<Users className="w-6 h-6 text-blue-400" />} color="bg-blue-500/20" />
            <StatCard label="Utilisateurs actifs" value={s.users?.active ?? 0} sub={`${s.users?.banned ?? 0} bannis`} icon={<Shield className="w-6 h-6 text-green-400" />} color="bg-green-500/20" />
            <StatCard label="Nouveaux ce mois" value={s.users?.newMonth ?? 0} icon={<TrendingUp className="w-6 h-6 text-cyan-400" />} color="bg-cyan-500/20" />
            <StatCard label="Soldes totaux" value={`$${n(s.revenue?.totalUsd).toFixed(2)}`} sub="Revenus totaux" icon={<Wallet className="w-6 h-6 text-primary" />} color="bg-primary/20" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Commandes total" value={s.orders?.total ?? 0} sub={`${s.orders?.completed ?? 0} complétées`} icon={<Package className="w-6 h-6 text-orange-400" />} color="bg-orange-500/20" />
            <StatCard label="Commandes aujourd'hui" value={s.orders?.today?.count ?? 0} sub={`$${n(s.orders?.today?.revenueUsd).toFixed(2)} générés`} icon={<Zap className="w-6 h-6 text-yellow-400" />} color="bg-yellow-500/20" />
            <StatCard label="Commandes ce mois" value={s.orders?.month?.count ?? 0} sub={`$${n(s.orders?.month?.revenueUsd).toFixed(2)} générés`} icon={<BarChart3 className="w-6 h-6 text-purple-400" />} color="bg-purple-500/20" />
            <StatCard label="Commandes cette année" value={s.orders?.year?.count ?? 0} sub={`$${n(s.orders?.year?.revenueUsd).toFixed(2)} générés`} icon={<Star className="w-6 h-6 text-pink-400" />} color="bg-pink-500/20" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Revenus USD total" value={`$${n(s.revenue?.totalUsd).toFixed(2)}`} icon={<DollarSign className="w-6 h-6 text-green-400" />} color="bg-green-500/20" />
            <StatCard label="Revenus FCFA total" value={`${Math.round(n(s.revenue?.totalFcfa)).toLocaleString()} F`} icon={<DollarSign className="w-6 h-6 text-green-400" />} color="bg-green-500/20" />
            <StatCard label="Rechargements total" value={`$${n(s.revenue?.totalRechargeUsd).toFixed(2)}`} icon={<CreditCard className="w-6 h-6 text-blue-400" />} color="bg-blue-500/20" />
            <StatCard label="Transactions" value={s.transactions?.total ?? 0} icon={<Database className="w-6 h-6 text-muted-foreground" />} color="bg-white/10" />
          </div>
          {queryStr && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard label="Commandes (période)" value={s.orders?.range?.count ?? 0} icon={<Clock className="w-6 h-6 text-cyan-400" />} color="bg-cyan-500/20" />
              <StatCard label="Revenus (période)" value={`$${n(s.orders?.range?.revenueUsd).toFixed(2)}`} icon={<TrendingUp className="w-6 h-6 text-primary" />} color="bg-primary/20" />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-card/40 p-5">
              <h3 className="font-semibold text-white mb-4">Top services</h3>
              <div className="space-y-2">
                {(s.topServices ?? []).map((sv: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-sm text-white">{sv.service || "?"}</span>
                    <span className="text-sm font-bold text-primary">{sv.c} commandes</span>
                  </div>
                ))}
                {!(s.topServices?.length) && <p className="text-sm text-muted-foreground">Aucune donnée</p>}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-card/40 p-5">
              <h3 className="font-semibold text-white mb-4">Top pays</h3>
              <div className="space-y-2">
                {(s.topCountries ?? []).map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-sm text-white">{c.country || "?"}</span>
                    <span className="text-sm font-bold text-primary">{c.c} commandes</span>
                  </div>
                ))}
                {!(s.topCountries?.length) && <p className="text-sm text-muted-foreground">Aucune donnée</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: USERS
══════════════════════════════════════════════════════════════════════════════ */
function AdminUsers() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState<any>({});

  const queryStr = `/v1/admin/users?q=${search}&page=${page}&limit=15`;
  const { data, loading, refetch } = useAdminFetch<any>(queryStr, [search, page]);

  const { data: userDetail, loading: detailLoading, refetch: refetchDetail } = useAdminFetch<any>(
    selectedUser ? `/v1/admin/users/${selectedUser.id}` : "",
    [selectedUser?.id]
  );

  const handleSearch = () => { setSearch(q); setPage(1); };
  const openEdit = (u: any) => { setEditData({ name: u.name, email: u.email, balanceUsd: u.balanceUsd, isAdmin: u.isAdmin, isBanned: u.isBanned, password: "" }); setShowEdit(true); };
  const saveEdit = async () => {
    const payload: any = { name: editData.name, email: editData.email, balanceUsd: parseFloat(editData.balanceUsd), isAdmin: editData.isAdmin, isBanned: editData.isBanned };
    if (editData.password) payload.password = editData.password;
    await adminPatch(`/v1/admin/users/${selectedUser.id}`, payload);
    toast({ title: "Utilisateur mis à jour" });
    setShowEdit(false);
    refetch();
    refetchDetail();
  };
  const toggleBan = async (u: any) => {
    await adminPatch(`/v1/admin/users/${u.id}`, { isBanned: !u.isBanned });
    toast({ title: u.isBanned ? "Compte réactivé" : "Compte banni" });
    refetch();
    if (selectedUser?.id === u.id) refetchDetail();
  };
  const toggleAdmin = async (u: any) => {
    await adminPatch(`/v1/admin/users/${u.id}`, { isAdmin: !u.isAdmin });
    toast({ title: u.isAdmin ? "Droits admin retirés" : `${u.name} est maintenant administrateur` });
    refetch();
    if (selectedUser?.id === u.id) refetchDetail();
  };

  if (selectedUser && userDetail) {
    const u = userDetail.user;
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedUser(null)} className="p-2 rounded-xl border border-white/10 hover:bg-white/5 text-muted-foreground hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
          <h2 className="text-lg font-bold text-white">Profil utilisateur</h2>
          <div className="ml-auto flex gap-2">
            <Button onClick={() => openEdit(u)} size="sm" className="bg-primary hover:bg-primary/90 text-white"><Edit3 className="w-3.5 h-3.5 mr-1" /> Modifier</Button>
            <Button onClick={() => toggleAdmin(u)} size="sm" variant="outline" className={`border-white/10 ${u.isAdmin ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-white/5"}`}>
              <Shield className="w-3.5 h-3.5 mr-1" /> {u.isAdmin ? "Retirer admin" : "Rendre admin"}
            </Button>
            <Button onClick={() => toggleBan(u)} size="sm" variant="outline" className={`border-white/10 ${u.isBanned ? "text-green-400 hover:bg-green-500/10" : "text-red-400 hover:bg-red-500/10"}`}>
              <Ban className="w-3.5 h-3.5 mr-1" /> {u.isBanned ? "Débannir" : "Bannir"}
            </Button>
          </div>
        </div>

        {showEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-card rounded-2xl border border-white/10 p-6 w-full max-w-md space-y-4">
              <h3 className="font-bold text-white text-lg">Modifier l'utilisateur</h3>
              {["name", "email"].map((f) => (
                <div key={f}>
                  <label className="text-xs text-muted-foreground block mb-1 capitalize">{f}</label>
                  <input value={editData[f] ?? ""} onChange={(e) => setEditData({ ...editData, [f]: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
                </div>
              ))}
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Solde (USD)</label>
                <input type="number" step="0.01" value={editData.balanceUsd ?? 0} onChange={(e) => setEditData({ ...editData, balanceUsd: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Nouveau mot de passe (laisser vide = pas de changement)</label>
                <input type="password" value={editData.password ?? ""} onChange={(e) => setEditData({ ...editData, password: e.target.value })} placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-white">
                  <input type="checkbox" checked={editData.isAdmin ?? false} onChange={(e) => setEditData({ ...editData, isAdmin: e.target.checked })} /> Admin
                </label>
                <label className="flex items-center gap-2 text-sm text-white">
                  <input type="checkbox" checked={editData.isBanned ?? false} onChange={(e) => setEditData({ ...editData, isBanned: e.target.checked })} /> Banni
                </label>
              </div>
              <div className="flex gap-3 mt-2">
                <Button onClick={saveEdit} className="flex-1 bg-primary hover:bg-primary/90 text-white">Sauvegarder</Button>
                <Button onClick={() => setShowEdit(false)} variant="outline" className="flex-1 border-white/10 text-white hover:bg-white/5">Annuler</Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-card/40 p-5 space-y-3">
            <h3 className="font-semibold text-white">Informations</h3>
            {[["ID", u.id], ["Nom", u.name], ["Email", u.email], ["Solde", `$${n(u.balanceUsd).toFixed(2)}`], ["Créé le", new Date(u.createdAt).toLocaleString("fr")]].map(([l, v]) => (
              <div key={l as string} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{l}</span>
                <span className="text-white font-medium">{v as string}</span>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              {u.isAdmin && <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold border border-primary/30">Admin</span>}
              {u.isBanned && <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30">Banni</span>}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-card/40 p-5 space-y-2">
            <h3 className="font-semibold text-white">Résumé activité</h3>
            <p className="text-sm text-muted-foreground">{userDetail.orders?.length ?? 0} commandes</p>
            <p className="text-sm text-muted-foreground">{userDetail.transactions?.length ?? 0} transactions</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-card/40 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10"><h3 className="font-semibold text-white">Historique des numéros</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/10 bg-white/5">{["Service", "Pays", "Numéro", "Statut", "Prix", "Date"].map((h) => <th key={h} className="text-left px-4 py-2 text-xs text-muted-foreground uppercase">{h}</th>)}</tr></thead>
              <tbody>
                {(userDetail.orders ?? []).map((o: any) => (
                  <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 text-white font-medium">{o.serviceName}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{o.countryName}</td>
                    <td className="px-4 py-2.5 text-white font-mono text-xs">{o.phone}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-2.5 text-white">${n(o.priceUsd).toFixed(3)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{new Date(o.createdAt).toLocaleString("fr")}</td>
                  </tr>
                ))}
                {!userDetail.orders?.length && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Aucune commande</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 flex gap-2 min-w-64">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="Rechercher nom, email..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-muted-foreground" />
          <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90 text-white px-3"><Search className="w-4 h-4" /></Button>
        </div>
        <button onClick={refetch} className="p-2 rounded-xl border border-white/10 text-muted-foreground hover:text-white hover:bg-white/5"><RefreshCw className="w-4 h-4" /></button>
      </div>
      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div> : (
        <>
          <Table headers={["ID", "Nom", "Email", "Solde", "Statut", "Date", "Actions"]} empty={!data?.users?.length}>
            {(data?.users ?? []).map((u: any) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-muted-foreground text-xs">#{u.id}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">{u.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <p className="text-white font-medium text-sm">{u.name}</p>
                      {u.isAdmin && <span className="text-[10px] text-primary font-bold">ADMIN</span>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-sm">{u.email}</td>
                <td className="px-4 py-3 text-white font-semibold text-sm">${n(u.balanceUsd).toFixed(2)}</td>
                <td className="px-4 py-3">{u.isBanned ? <StatusBadge status="BANNED" /> : <StatusBadge status="RECEIVED" />}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString("fr")}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => setSelectedUser(u)} className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10" title="Voir"><Search className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { setSelectedUser(u); openEdit(u); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" title="Modifier"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => toggleAdmin(u)} className={`p-1.5 rounded-lg ${u.isAdmin ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10"}`} title={u.isAdmin ? "Retirer admin" : "Rendre admin"}><Shield className="w-3.5 h-3.5" /></button>
                    <button onClick={() => toggleBan(u)} className={`p-1.5 rounded-lg ${u.isBanned ? "text-green-400 hover:bg-green-500/10" : "text-red-400 hover:bg-red-500/10"}`} title={u.isBanned ? "Débannir" : "Bannir"}><Ban className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination page={page} total={data?.total ?? 0} limit={15} onChange={setPage} />
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: ORDERS
══════════════════════════════════════════════════════════════════════════════ */
function AdminOrders() {
  const [page, setPage] = useState(1);
  const { data, loading, refetch } = useAdminFetch<any>(`/v1/admin/orders?page=${page}&limit=20`, [page]);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={refetch} className="p-2 rounded-xl border border-white/10 text-muted-foreground hover:text-white hover:bg-white/5"><RefreshCw className="w-4 h-4" /></button>
      </div>
      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div> : (
        <>
          <Table headers={["ID", "Utilisateur", "Service", "Pays", "Numéro", "Statut", "Prix", "Date"]} empty={!data?.orders?.length}>
            {(data?.orders ?? []).map((o: any) => (
              <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-muted-foreground text-xs">#{o.id}</td>
                <td className="px-4 py-3"><div><p className="text-white text-sm">{o.userName}</p><p className="text-xs text-muted-foreground">{o.userEmail}</p></div></td>
                <td className="px-4 py-3 text-white text-sm">{o.service}</td>
                <td className="px-4 py-3 text-muted-foreground text-sm">{o.country}</td>
                <td className="px-4 py-3 text-white font-mono text-xs">{o.phone}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3 text-white text-sm">${n(o.priceUsd).toFixed(3)}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(o.createdAt).toLocaleString("fr")}</td>
              </tr>
            ))}
          </Table>
          <Pagination page={page} total={data?.total ?? 0} limit={20} onChange={setPage} />
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: TRANSACTIONS
══════════════════════════════════════════════════════════════════════════════ */
const emptyDepositForm = { userId: "", amountUsd: "", method: "orange_money", provider: "", type: "recharge", status: "completed", reference: "", note: "" };

function AdminTransactions() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depositForm, setDepositForm] = useState({ ...emptyDepositForm });
  const [depositSaving, setDepositSaving] = useState(false);

  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (q) params.set("q", q);
  if (statusFilter) params.set("status", statusFilter);
  if (typeFilter) params.set("type", typeFilter);

  const { data: usersData } = useAdminFetch<any>("/v1/admin/users?limit=100", []);
  const { data, loading, refetch } = useAdminFetch<any>(`/v1/admin/transactions?${params}`, [page, q, statusFilter, typeFilter]);

  const applySearch = () => { setQ(qInput); setPage(1); };
  const clearFilters = () => { setQ(""); setQInput(""); setStatusFilter(""); setTypeFilter(""); setPage(1); };
  const hasFilters = q || statusFilter || typeFilter;

  const handleDeposit = async () => {
    if (!depositForm.userId || !depositForm.amountUsd) return;
    setDepositSaving(true);
    const res = await adminPost("/v1/admin/transactions", depositForm);
    if (res.success) {
      toast({ title: "Transaction créée avec succès" });
      setDepositForm({ ...emptyDepositForm });
      setShowDepositForm(false);
      refetch();
    } else {
      toast({ variant: "destructive", title: "Erreur", description: res.error });
    }
    setDepositSaving(false);
  };

  const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";
  const selClass = "bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50";

  return (
    <div className="space-y-5">
      {/* Stats row */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/10 bg-card/40 p-4 text-center">
            <p className="text-2xl font-bold text-white">{data.total ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Transactions{hasFilters ? " (filtrées)" : ""}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-card/40 p-4 text-center">
            <p className="text-2xl font-bold text-primary">${n(data.totalRevenue).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Volume USD</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-card/40 p-4 text-center col-span-2 sm:col-span-1">
            <p className="text-2xl font-bold text-white">{Math.round(n(data.totalRevenue) * 620).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Volume FCFA</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="rounded-2xl border border-white/10 bg-card/40 p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="flex flex-1 min-w-[200px] items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              placeholder="Email, nom, référence..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-muted-foreground focus:outline-none"
            />
            {qInput && (
              <button onClick={() => { setQInput(""); setQ(""); setPage(1); }} className="text-muted-foreground hover:text-white">
                <AlertTriangle className="w-3 h-3" />
              </button>
            )}
          </div>
          <button onClick={applySearch} className="px-4 py-2 bg-primary/20 border border-primary/30 rounded-xl text-sm text-primary font-medium hover:bg-primary/30 transition-colors">
            Rechercher
          </button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Status filter */}
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={selClass}>
            <option value="">Tous les statuts</option>
            <option value="completed">Complétées</option>
            <option value="pending">En attente</option>
            <option value="failed">Échouées</option>
          </select>

          {/* Type filter */}
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className={selClass}>
            <option value="">Tous les types</option>
            <option value="recharge">Recharge</option>
            <option value="debit">Débit</option>
          </select>

          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 px-3 py-2 rounded-xl border border-red-500/20 hover:bg-red-500/10 transition-colors">
              Réinitialiser
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowDepositForm(!showDepositForm)}
              className="flex items-center gap-2 px-3 py-2 bg-green-500/15 border border-green-500/30 rounded-xl text-sm text-green-400 font-medium hover:bg-green-500/25 transition-colors"
            >
              <Plus className="w-4 h-4" /> Dépôt manuel
            </button>
            <button onClick={refetch} className="p-2 rounded-xl border border-white/10 text-muted-foreground hover:text-white hover:bg-white/5">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Manual deposit form */}
      <AnimatePresence>
        {showDepositForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6 space-y-4"
          >
            <h3 className="font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" /> Créer un dépôt manuel
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Utilisateur *</label>
                <select value={depositForm.userId} onChange={(e) => setDepositForm({ ...depositForm, userId: e.target.value })} className={inp}>
                  <option value="">Sélectionner un utilisateur</option>
                  {(usersData?.users ?? []).map((u: any) => (
                    <option key={u.id} value={u.id}>{u.email} — ${n(u.balanceUsd).toFixed(2)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Montant USD *</label>
                <input type="number" step="0.01" value={depositForm.amountUsd} onChange={(e) => setDepositForm({ ...depositForm, amountUsd: e.target.value })} placeholder="ex: 5.00" className={inp} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Type</label>
                <select value={depositForm.type} onChange={(e) => setDepositForm({ ...depositForm, type: e.target.value })} className={inp}>
                  <option value="recharge">Recharge (crédit)</option>
                  <option value="debit">Débit</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Méthode *</label>
                <select value={depositForm.method} onChange={(e) => setDepositForm({ ...depositForm, method: e.target.value })} className={inp}>
                  <option value="orange_money">Orange Money</option>
                  <option value="moov_money">Moov Money</option>
                  <option value="wave">Wave</option>
                  <option value="mtn_momo">MTN MoMo</option>
                  <option value="paxity">Paxity</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Virement bancaire</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Statut</label>
                <select value={depositForm.status} onChange={(e) => setDepositForm({ ...depositForm, status: e.target.value })} className={inp}>
                  <option value="completed">Complétée</option>
                  <option value="pending">En attente</option>
                  <option value="failed">Échouée</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Référence</label>
                <input value={depositForm.reference} onChange={(e) => setDepositForm({ ...depositForm, reference: e.target.value })} placeholder="Ref. optionnelle" className={inp} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Note interne</label>
              <input value={depositForm.note} onChange={(e) => setDepositForm({ ...depositForm, note: e.target.value })} placeholder="Raison du dépôt..." className={inp} />
            </div>
            {depositForm.amountUsd && (
              <div className="text-sm text-green-400/80 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">
                ≈ {Math.round(parseFloat(depositForm.amountUsd || "0") * 620).toLocaleString()} FCFA
                {depositForm.type === "debit" ? " sera débité" : " sera crédité"} sur le solde
              </div>
            )}
            <div className="flex gap-3">
              <Button onClick={handleDeposit} disabled={depositSaving || !depositForm.userId || !depositForm.amountUsd} className="bg-green-600 hover:bg-green-500 text-white">
                <CheckCircle className="w-4 h-4 mr-2" /> {depositSaving ? "Traitement..." : "Valider le dépôt"}
              </Button>
              <Button variant="outline" onClick={() => setShowDepositForm(false)} className="border-white/10 text-white hover:bg-white/5">
                Annuler
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="rounded-2xl border border-white/10 bg-card/40 overflow-hidden">
            {!data?.transactions?.length ? (
              <div className="py-16 text-center">
                <Database className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {hasFilters ? "Aucune transaction ne correspond aux filtres" : "Aucune transaction enregistrée"}
                </p>
                {hasFilters && (
                  <button onClick={clearFilters} className="mt-3 text-xs text-primary hover:underline">Réinitialiser les filtres</button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      {["ID", "Utilisateur", "Type", "Méthode", "Montant", "Statut", "Référence", "Date"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.transactions ?? []).map((t: any) => (
                      <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-muted-foreground text-xs font-mono">#{t.id}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-white text-sm font-medium">{t.userName ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{t.userEmail ?? "—"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${t.type === "recharge" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                            {t.type === "recharge" ? "Recharge" : "Débit"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-sm capitalize">
                          {t.method}{t.provider && t.provider !== t.method ? <span className="text-muted-foreground/50"> • {t.provider}</span> : ""}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-white font-semibold text-sm">${n(t.amountUsd).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{Math.round(n(t.amountFcfa)).toLocaleString()} FCFA</p>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className="px-4 py-3 text-muted-foreground text-xs font-mono max-w-[120px] truncate" title={t.reference ?? ""}>{t.reference ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{new Date(t.createdAt).toLocaleString("fr")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {(data?.total ?? 0) > 20 && <Pagination page={page} total={data?.total ?? 0} limit={20} onChange={setPage} />}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: MESSAGES
══════════════════════════════════════════════════════════════════════════════ */
const POPUP_COLORS = [
  { value: "blue",   label: "Bleu",    dot: "bg-blue-500" },
  { value: "green",  label: "Vert",    dot: "bg-green-500" },
  { value: "red",    label: "Rouge",   dot: "bg-red-500" },
  { value: "yellow", label: "Jaune",   dot: "bg-yellow-400" },
  { value: "purple", label: "Violet",  dot: "bg-purple-500" },
  { value: "orange", label: "Orange",  dot: "bg-orange-500" },
];

const emptyForm = { type: "popup", target: "all", subject: "", content: "", color: "blue", linkUrl: "", linkLabel: "", imageUrl: "" };

function AdminMessages() {
  const { toast } = useToast();
  const { data, loading, refetch } = useAdminFetch<any>("/v1/admin/messages", []);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);

  const handleCreate = async () => {
    if (!form.content.trim()) return;
    setSaving(true);
    const res = await adminPost("/v1/admin/messages", {
      ...form,
      linkUrl: form.linkUrl || null,
      linkLabel: form.linkLabel || null,
      imageUrl: form.imageUrl || null,
      subject: form.subject || null,
    });
    if (res.success) {
      toast({ title: "Notification créée" });
      setForm({ ...emptyForm });
      refetch();
    } else {
      toast({ variant: "destructive", title: "Erreur", description: res.error });
    }
    setSaving(false);
  };

  const handleToggle = async (m: any) => {
    setToggling(m.id);
    await adminPatch(`/v1/admin/messages/${m.id}`, { isActive: !m.isActive });
    refetch();
    setToggling(null);
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    await adminDelete(`/v1/admin/messages/${id}`);
    toast({ title: "Notification supprimée" });
    refetch();
    setDeleting(null);
  };

  const popups = (data?.messages ?? []).filter((m: any) => m.type === "popup");
  const activeCount = popups.filter((m: any) => m.isActive).length;

  const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 bg-card/40 p-4 text-center">
          <p className="text-2xl font-bold text-white">{popups.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Notifications</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-card/40 p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{activeCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Actives</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-card/40 p-4 text-center">
          <p className="text-2xl font-bold text-muted-foreground">{popups.length - activeCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Inactives</p>
        </div>
      </div>

      {/* Create form */}
      <div className="rounded-2xl border border-white/10 bg-card/40 p-6 space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" /> Créer une notification popup
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Titre (optionnel)</label>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Titre de la notification" className={inp} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Couleur</label>
            <select value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className={inp}>
              {POPUP_COLORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">Message *</label>
          <textarea rows={3} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Contenu de la notification..." className={`${inp} resize-none`} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Lien URL (optionnel)</label>
            <input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://..." className={inp} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Texte du bouton lien</label>
            <input value={form.linkLabel} onChange={(e) => setForm({ ...form, linkLabel: e.target.value })} placeholder="En savoir plus" className={inp} />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">URL d'image (optionnel)</label>
          <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://exemple.com/image.jpg" className={inp} />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {POPUP_COLORS.find((c) => c.value === form.color) && (
              <span className={`w-3 h-3 rounded-full ${POPUP_COLORS.find((c) => c.value === form.color)!.dot}`} />
            )}
            <span className="text-xs text-muted-foreground">Aperçu couleur</span>
          </div>
          <Button onClick={handleCreate} disabled={saving || !form.content.trim()} className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="w-4 h-4 mr-2" /> {saving ? "Création..." : "Créer la notification"}
          </Button>
        </div>
      </div>

      {/* Notification list */}
      <div className="rounded-2xl border border-white/10 bg-card/40 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-semibold text-white">Toutes les notifications popup</h3>
          <button onClick={refetch} className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5"><RefreshCw className="w-4 h-4" /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : popups.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucune notification popup</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {popups.map((m: any) => {
              const colorDot = POPUP_COLORS.find((c) => c.value === m.color)?.dot ?? "bg-blue-500";
              return (
                <div key={m.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Color dot */}
                    <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${colorDot}`} />

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${m.isActive ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-white/5 text-muted-foreground border-white/10"}`}>
                          {m.isActive ? "Actif" : "Inactif"}
                        </span>
                        {m.subject && <span className="text-sm font-semibold text-white">{m.subject}</span>}
                        <span className="text-xs text-muted-foreground">{new Date(m.sentAt).toLocaleString("fr")}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{m.content}</p>
                      {(m.linkUrl || m.imageUrl) && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
                          {m.linkUrl && <span>🔗 {m.linkUrl}</span>}
                          {m.imageUrl && <span>🖼 Image</span>}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggle(m)}
                        disabled={toggling === m.id}
                        title={m.isActive ? "Désactiver" : "Activer"}
                        className={`p-1.5 rounded-lg transition-colors ${m.isActive ? "text-green-400 hover:bg-green-500/10" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
                      >
                        {toggling === m.id ? (
                          <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : m.isActive ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={deleting === m.id}
                        className="p-1.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        {deleting === m.id ? (
                          <div className="w-4 h-4 border border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: DISCOUNT CODES
══════════════════════════════════════════════════════════════════════════════ */
function AdminDiscountCodes() {
  const { toast } = useToast();
  const { data, loading, refetch } = useAdminFetch<any>("/v1/admin/discount-codes", []);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ code: "", percent: "", country: "", isActive: false });
  const [saving, setSaving] = useState(false);

  const codes: any[] = data?.codes ?? [];

  const reset = () => { setForm({ code: "", percent: "", country: "", isActive: false }); setEditId(null); setShowForm(false); };

  const save = async () => {
    if (!form.code || !form.percent) { toast({ title: "Code et pourcentage requis", variant: "destructive" }); return; }
    setSaving(true);
    const payload = { code: form.code.toUpperCase().trim(), percent: parseFloat(form.percent), country: form.country || null, isActive: form.isActive };
    const url = editId ? `/v1/admin/discount-codes/${editId}` : "/v1/admin/discount-codes";
    const method = editId ? "PATCH" : "POST";
    const r = await fetch(`${API}${url}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("zynum_token")}` }, body: JSON.stringify(payload) });
    setSaving(false);
    if (!r.ok) { const err = await r.json(); toast({ title: err.error || "Erreur", variant: "destructive" }); return; }
    toast({ title: editId ? "Code modifié" : "Code créé" });
    reset(); refetch();
  };

  const toggle = async (id: number, isActive: boolean) => {
    await fetch(`${API}/v1/admin/discount-codes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("zynum_token")}` }, body: JSON.stringify({ isActive: !isActive }) });
    refetch();
  };

  const remove = async (id: number) => {
    if (!confirm("Supprimer ce code ?")) return;
    await fetch(`${API}/v1/admin/discount-codes/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("zynum_token")}` } });
    refetch();
  };

  const startEdit = (c: any) => {
    setForm({ code: c.code, percent: String(c.percent), country: c.country ?? "", isActive: c.isActive });
    setEditId(c.id);
    setShowForm(true);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-5">
      {/* Stats totales */}
      {codes.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-card/40 p-4 text-center">
            <p className="text-2xl font-bold text-white">{codes.reduce((s: number, c: any) => s + c.usedCount, 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Utilisations totales</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-card/40 p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{codes.reduce((s: number, c: any) => s + Math.round(c.totalSavedFcfa), 0).toLocaleString("fr-FR")} F</p>
            <p className="text-xs text-muted-foreground mt-1">Total économisé FCFA</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-card/40 p-4 text-center">
            <p className="text-2xl font-bold text-primary">{codes.filter((c: any) => c.isActive).length}</p>
            <p className="text-xs text-muted-foreground mt-1">Codes actifs</p>
          </div>
        </div>
      )}

      {/* Bouton créer */}
      <Button onClick={() => { reset(); setShowForm(true); }} className="bg-primary hover:bg-primary/90 text-white w-full">
        <Plus className="w-4 h-4 mr-2" /> Nouveau code de réduction
      </Button>

      {/* Formulaire création / édition */}
      {showForm && (
        <div className="rounded-2xl border border-white/10 bg-card/40 p-5 space-y-4">
          <h4 className="font-bold text-white">{editId ? "Modifier le code" : "Créer un code de réduction"}</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Code promo</label>
              <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="EX: PROMO20" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm uppercase placeholder:normal-case" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Réduction (%)</label>
              <input type="number" min="1" max="100" step="0.5" value={form.percent} onChange={e => setForm({ ...form, percent: e.target.value })} placeholder="Ex: 20" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Pays (laisser vide = tous les pays)</label>
            <input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="Ex: cameroon, nigeria... (vide = tous)" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
          </div>
          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-sm text-white">Activer immédiatement</span>
            <button onClick={() => setForm({ ...form, isActive: !form.isActive })} className="transition-transform">
              {form.isActive ? <ToggleRight className="w-8 h-8 text-primary" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
            </button>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90 text-white">{saving ? "Sauvegarde..." : editId ? "Modifier" : "Créer le code"}</Button>
            <Button onClick={reset} variant="outline" className="border-white/10 text-muted-foreground hover:text-white">Annuler</Button>
          </div>
        </div>
      )}

      {/* Liste des codes */}
      {codes.length === 0 && !showForm && (
        <div className="text-center py-12 text-muted-foreground">
          <Percent className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Aucun code de réduction créé</p>
        </div>
      )}
      <div className="space-y-3">
        {codes.map((c: any) => (
          <div key={c.id} className="rounded-2xl border border-white/10 bg-card/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Percent className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm font-mono">{c.code}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.percent}% de réduction · {c.country ? `Pays: ${c.country}` : "Tous les pays"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(c.id, c.isActive)} className="transition-transform" title={c.isActive ? "Désactiver" : "Activer"}>
                  {c.isActive ? <ToggleRight className="w-7 h-7 text-primary" /> : <ToggleLeft className="w-7 h-7 text-muted-foreground" />}
                </button>
                <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => remove(c.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5">
              <div className="text-center">
                <p className="text-sm font-bold text-white">{c.usedCount}</p>
                <p className="text-[10px] text-muted-foreground">Utilisations</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-green-400">{Math.round(c.totalSavedFcfa).toLocaleString("fr-FR")} F</p>
                <p className="text-[10px] text-muted-foreground">Économisé FCFA</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-primary">${(c.totalSavedUsd ?? 0).toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">Économisé USD</p>
              </div>
            </div>
            {c.isActive && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />
                <span className="text-[11px] text-green-300 font-medium">Code actif — visible sur la page d'achat</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: PLATFORM SETTINGS
══════════════════════════════════════════════════════════════════════════════ */
function AdminSettings() {
  const { toast } = useToast();
  const { data, loading, refetch } = useAdminFetch<any>("/v1/admin/settings", []);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      setForm({
        platform_name: data.settings.platform_name ?? "ZyNum",
        support_email: data.settings.support_email ?? "",
        support_telegram: data.settings.support_telegram ?? "",
        support_whatsapp: data.settings.support_whatsapp ?? "",
        support_channel: data.settings.support_channel ?? "telegram",
        maintenance_mode: data.settings.maintenance_mode ?? "false",
        maintenance_buy: data.settings.maintenance_buy ?? "false",
        commission_type: data.settings.commission_type ?? "percent",
        commission_value: data.settings.commission_value ?? "0",
        currency_rate: data.settings.currency_rate ?? "620",
        global_discount: data.settings.global_discount ?? "0",
        fivesim_api_key: data.settings.fivesim_api_key ?? "",
      });
    }
  }, [data]);

  const save = async () => {
    setSaving(true);
    await adminPost("/v1/admin/settings/bulk", { settings: form });
    toast({ title: "Paramètres sauvegardés" });
    refetch();
    setSaving(false);
  };

  const Field = ({ k, label, type = "text" }: { k: string; label: string; type?: string }) => (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <input type={type} value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
    </div>
  );

  const Toggle = ({ k, label }: { k: string; label: string }) => (
    <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-muted-foreground">{form[k] === "true" ? "Activé" : "Désactivé"}</p>
      </div>
      <button onClick={() => setForm({ ...form, [k]: form[k] === "true" ? "false" : "true" })} className={`relative w-11 h-6 rounded-full transition-colors ${form[k] === "true" ? "bg-primary" : "bg-white/20"}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form[k] === "true" ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">

      {/* ── Clé API 5sim ── */}
      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-6 space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2"><Key className="w-5 h-5 text-yellow-400" /> Clé API 5sim</h3>
        <p className="text-xs text-muted-foreground">Cette clé est utilisée pour accéder à l'API 5sim (achat de numéros virtuels). Elle est chiffrée en base de données et jamais exposée aux utilisateurs.</p>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Clé API Bearer</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showApiKey ? "text" : "password"}
                value={form.fivesim_api_key ?? ""}
                onChange={(e) => setForm({ ...form, fivesim_api_key: e.target.value })}
                placeholder="Collez votre clé API 5sim ici"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {form.fivesim_api_key && (
            <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Clé configurée — sauvegardez pour appliquer
            </p>
          )}
          {!form.fivesim_api_key && (
            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Aucune clé configurée — le service est inopérant
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card/40 p-6 space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2"><Settings className="w-5 h-5 text-primary" /> Informations de la plateforme</h3>
        <Field k="platform_name" label="Nom de la plateforme" />
        <Field k="support_email" label="Email du support" type="email" />
        <Field k="currency_rate" label="Taux de change (1 USD = X FCFA)" type="number" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-card/40 p-6 space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /> Contacts & Support</h3>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Canal principal de support</label>
          <select value={form.support_channel ?? "telegram"} onChange={(e) => setForm({ ...form, support_channel: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
            <option value="telegram">Telegram</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="other">Autre</option>
          </select>
        </div>
        <Field k="support_telegram" label="Lien Telegram" />
        <Field k="support_whatsapp" label="Lien WhatsApp" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-card/40 p-6 space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> Tarification à paliers (1 USD = 620 FCFA)</h3>
        <p className="text-xs text-muted-foreground">Les prix affichés aux clients sont calculés automatiquement selon le prix brut 5sim.</p>
        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Palier 1</span>
              <span className="text-xs text-muted-foreground">— numéros économiques</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Prix 5sim</span>
              <span className="text-white font-medium">30F → 500F</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Prix ZyNum</span>
              <span className="text-green-400 font-semibold">1 100F → 2 200F</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">En USD</span>
              <span className="text-muted-foreground">$1.77 → $3.55</span>
            </div>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Palier 2</span>
              <span className="text-xs text-muted-foreground">— numéros premium</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Prix 5sim</span>
              <span className="text-white font-medium">1 000F → 3 000F</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Prix ZyNum</span>
              <span className="text-green-400 font-semibold">2 000F → 4 500F</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">En USD</span>
              <span className="text-muted-foreground">$3.23 → $7.26</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Plancher minimum : <span className="text-white font-medium">1 100 FCFA</span> · Au-delà de 3 000F : extrapolation palier 2</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card/40 p-6 space-y-3">
        <h3 className="font-bold text-white flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-400" /> Maintenance</h3>
        <Toggle k="maintenance_mode" label="Mode maintenance général" />
        <Toggle k="maintenance_buy" label="Achats de numéros désactivés" />
      </div>

      <Button onClick={save} disabled={saving} className="bg-primary hover:bg-primary/90 text-white w-full">
        {saving ? "Sauvegarde..." : "Sauvegarder les paramètres"}
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: PAYMENT PROVIDERS
══════════════════════════════════════════════════════════════════════════════ */
function AdminPayments() {
  const { toast } = useToast();
  const { data, loading, refetch } = useAdminFetch<any>("/v1/admin/payment-providers", []);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category: "card", name: "", slug: "" });

  const categories = [
    { id: "card", label: "Carte bancaire" },
    { id: "mobile_money", label: "Mobile Money" },
    { id: "crypto", label: "Crypto-monnaie" },
  ];

  const add = async () => {
    if (!form.name || !form.slug) return;
    await adminPost("/v1/admin/payment-providers", form);
    toast({ title: "Fournisseur ajouté" });
    setForm({ category: "card", name: "", slug: "" });
    setShowAdd(false);
    refetch();
  };
  const toggle = async (p: any, field: "isActive" | "isSelected") => {
    await adminPatch(`/v1/admin/payment-providers/${p.id}`, { [field]: !p[field] });
    refetch();
  };
  const remove = async (id: number) => {
    await adminDelete(`/v1/admin/payment-providers/${id}`);
    toast({ title: "Fournisseur supprimé" });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary/90 text-white"><Plus className="w-4 h-4 mr-2" /> Ajouter fournisseur</Button>
      </div>

      {showAdd && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4">
          <h3 className="font-bold text-white">Nouveau fournisseur</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Catégorie</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Nom</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Stripe, CinetPay..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Identifiant (slug)</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "_") })} placeholder="stripe" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-mono" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={add} className="bg-primary hover:bg-primary/90 text-white">Ajouter</Button>
            <Button onClick={() => setShowAdd(false)} variant="outline" className="border-white/10 text-white hover:bg-white/5">Annuler</Button>
          </div>
        </div>
      )}

      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div> : (
        categories.map((cat) => {
          const providers = (data?.providers ?? []).filter((p: any) => p.category === cat.id);
          return (
            <div key={cat.id} className="rounded-2xl border border-white/10 bg-card/40 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-white">{cat.label}</h3>
                <span className="text-xs text-muted-foreground ml-auto">{providers.length} fournisseur{providers.length !== 1 ? "s" : ""}</span>
              </div>
              {providers.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Aucun fournisseur configuré</p>}
              <div className="divide-y divide-white/5">
                {providers.map((p: any) => (
                  <div key={p.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{p.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.slug}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggle(p, "isActive")} className={`text-xs px-2 py-1 rounded-lg border font-medium ${p.isActive ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-white/5 text-muted-foreground border-white/10"}`}>
                        {p.isActive ? "Actif" : "Inactif"}
                      </button>
                      <button onClick={() => toggle(p, "isSelected")} className={`text-xs px-2 py-1 rounded-lg border font-medium ${p.isSelected ? "bg-primary/20 text-primary border-primary/30" : "bg-white/5 text-muted-foreground border-white/10"}`}>
                        {p.isSelected ? "✓ Sélectionné" : "Sélectionner"}
                      </button>
                      <button onClick={() => remove(p.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: FAQ / HELP CENTER
══════════════════════════════════════════════════════════════════════════════ */
function AdminFaq() {
  const { toast } = useToast();
  const { data, loading, refetch } = useAdminFetch<any>("/v1/admin/faq", []);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ type: "faq", category: "", question: "", answer: "", lang: "fr", isActive: true, sortOrder: 0 });

  const save = async () => {
    if (editItem) {
      await adminPatch(`/v1/admin/faq/${editItem.id}`, form);
      toast({ title: "Article mis à jour" });
      setEditItem(null);
    } else {
      await adminPost("/v1/admin/faq", form);
      toast({ title: "Article créé" });
      setShowAdd(false);
    }
    setForm({ type: "faq", category: "", question: "", answer: "", lang: "fr", isActive: true, sortOrder: 0 });
    refetch();
  };
  const remove = async (id: number) => { await adminDelete(`/v1/admin/faq/${id}`); toast({ title: "Supprimé" }); refetch(); };
  const toggleActive = async (a: any) => { await adminPatch(`/v1/admin/faq/${a.id}`, { isActive: !a.isActive }); refetch(); };
  const startEdit = (a: any) => { setForm({ type: a.type, category: a.category ?? "", question: a.question, answer: a.answer, lang: a.lang, isActive: a.isActive, sortOrder: a.sortOrder }); setEditItem(a); setShowAdd(false); };

  const FormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
            <option value="faq">FAQ</option>
            <option value="article">Article d'aide</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Langue</label>
          <select value={form.lang} onChange={(e) => setForm({ ...form, lang: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Catégorie</label>
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Général, Paiement..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Question / Titre</label>
        <input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Réponse / Contenu</label>
        <textarea rows={4} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none" />
      </div>
      <div className="flex gap-3">
        <Button onClick={save} className="bg-primary hover:bg-primary/90 text-white">Sauvegarder</Button>
        <Button onClick={() => { setShowAdd(false); setEditItem(null); }} variant="outline" className="border-white/10 text-white hover:bg-white/5">Annuler</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => { setShowAdd(true); setEditItem(null); }} className="bg-primary hover:bg-primary/90 text-white"><Plus className="w-4 h-4 mr-2" /> Ajouter</Button>
      </div>
      {(showAdd || editItem) && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <h3 className="font-bold text-white mb-4">{editItem ? "Modifier" : "Nouvel article"}</h3>
          <FormFields />
        </div>
      )}
      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="space-y-3">
          {(data?.articles ?? []).map((a: any) => (
            <div key={a.id} className={`rounded-2xl border ${a.isActive ? "border-white/10" : "border-white/5 opacity-60"} bg-card/40 p-4 flex gap-4`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${a.type === "faq" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-purple-500/20 text-purple-400 border-purple-500/30"}`}>{a.type}</span>
                  <span className="text-xs text-muted-foreground">{a.lang.toUpperCase()}</span>
                  {a.category && <span className="text-xs text-muted-foreground">• {a.category}</span>}
                </div>
                <p className="text-sm font-semibold text-white mb-1">{a.question}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{a.answer}</p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={() => startEdit(a)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"><Edit3 className="w-3.5 h-3.5" /></button>
                <button onClick={() => toggleActive(a)} className={`p-1.5 rounded-lg ${a.isActive ? "text-green-400 hover:bg-green-500/10" : "text-muted-foreground hover:bg-white/5"}`}><CheckCircle className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(a.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
          {!data?.articles?.length && <p className="text-sm text-muted-foreground text-center py-8">Aucun article</p>}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: SOCIAL LINKS
══════════════════════════════════════════════════════════════════════════════ */
function AdminSocialLinks() {
  const { toast } = useToast();
  const { data, loading, refetch } = useAdminFetch<any>("/v1/admin/social-links", []);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ platform: "", url: "", icon: "" });
  const [form, setForm] = useState({ platform: "", url: "", icon: "" });

  const add = async () => {
    if (!form.platform || !form.url) return;
    await adminPost("/v1/admin/social-links", form);
    toast({ title: "Lien ajouté" });
    setForm({ platform: "", url: "", icon: "" });
    setShowAdd(false);
    refetch();
  };

  const startEdit = (l: any) => {
    setEditId(l.id);
    setEditForm({ platform: l.platform, url: l.url, icon: l.icon ?? "" });
  };

  const saveEdit = async () => {
    if (!editId) return;
    await adminPatch(`/v1/admin/social-links/${editId}`, editForm);
    toast({ title: "Lien modifié" });
    setEditId(null);
    refetch();
  };

  const toggle = async (l: any) => { await adminPatch(`/v1/admin/social-links/${l.id}`, { isActive: !l.isActive }); refetch(); };
  const remove = async (id: number) => { await adminDelete(`/v1/admin/social-links/${id}`); toast({ title: "Supprimé" }); refetch(); };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary/90 text-white"><Plus className="w-4 h-4 mr-2" /> Ajouter lien</Button>
      </div>
      {showAdd && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4">
          <h3 className="font-bold text-white">Nouveau lien social</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Plateforme</label>
              <input value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} placeholder="Facebook, Twitter..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">URL</label>
              <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Icône (slug simpleicons)</label>
              <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="facebook" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={add} className="bg-primary hover:bg-primary/90 text-white">Ajouter</Button>
            <Button onClick={() => setShowAdd(false)} variant="outline" className="border-white/10 text-white hover:bg-white/5">Annuler</Button>
          </div>
        </div>
      )}
      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="space-y-3">
          {(data?.links ?? []).map((l: any) => (
            <div key={l.id} className={`rounded-2xl border bg-card/40 overflow-hidden ${l.isActive ? "border-white/10" : "border-white/5 opacity-60"}`}>
              {/* Row */}
              <div className="flex items-center gap-4 p-4">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  {l.icon
                    ? <img src={`https://cdn.simpleicons.org/${l.icon}/ffffff`} className="w-5 h-5" alt={l.platform} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    : <span className="text-xs font-bold text-muted-foreground">{l.platform.charAt(0)}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{l.platform}</p>
                  <p className="text-xs text-muted-foreground truncate">{l.url}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(l)} className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5" title="Modifier"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => toggle(l)} className={`p-1.5 rounded-lg ${l.isActive ? "text-green-400 hover:bg-green-500/10" : "text-muted-foreground hover:bg-white/5"}`} title={l.isActive ? "Désactiver" : "Activer"}>
                    {l.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => remove(l.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10" title="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {/* Inline edit form */}
              {editId === l.id && (
                <div className="px-4 pb-4 border-t border-white/[0.06] pt-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Plateforme</label>
                      <input value={editForm.platform} onChange={(e) => setEditForm({ ...editForm, platform: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">URL</label>
                      <input value={editForm.url} onChange={(e) => setEditForm({ ...editForm, url: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Icône (slug simpleicons)</label>
                      <input value={editForm.icon} onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })} placeholder="facebook" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveEdit} size="sm" className="bg-primary hover:bg-primary/90 text-white">Sauvegarder</Button>
                    <Button onClick={() => setEditId(null)} size="sm" variant="outline" className="border-white/10 text-white hover:bg-white/5">Annuler</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {!data?.links?.length && <p className="text-sm text-muted-foreground text-center py-8">Aucun lien social configuré</p>}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: COUNTRIES
══════════════════════════════════════════════════════════════════════════════ */
function AdminCountries() {
  const { toast } = useToast();
  const { data, loading, refetch } = useAdminFetch<any>("/v1/admin/countries", []);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ countrySlug: "", countryName: "", isDisabled: false, priceMultiplier: 1.0 });

  const add = async () => {
    if (!form.countrySlug || !form.countryName) return;
    await adminPost("/v1/admin/countries", form);
    toast({ title: "Pays configuré" });
    setForm({ countrySlug: "", countryName: "", isDisabled: false, priceMultiplier: 1.0 });
    setShowAdd(false);
    refetch();
  };
  const toggle = async (c: any) => { await adminPatch(`/v1/admin/countries/${c.id}`, { isDisabled: !c.isDisabled }); toast({ title: c.isDisabled ? "Pays activé" : "Pays désactivé" }); refetch(); };
  const updateMultiplier = async (c: any, value: string) => { await adminPatch(`/v1/admin/countries/${c.id}`, { priceMultiplier: parseFloat(value) }); refetch(); };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary/90 text-white"><Plus className="w-4 h-4 mr-2" /> Ajouter override</Button>
      </div>
      {showAdd && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4">
          <h3 className="font-bold text-white">Configurer un pays</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Slug pays (ex: france, russia)</label>
              <input value={form.countrySlug} onChange={(e) => setForm({ ...form, countrySlug: e.target.value.toLowerCase() })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-mono" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Nom du pays</label>
              <input value={form.countryName} onChange={(e) => setForm({ ...form, countryName: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Multiplicateur de prix (1.0 = aucun, 1.2 = +20%)</label>
              <input type="number" step="0.01" min="0.01" value={form.priceMultiplier} onChange={(e) => setForm({ ...form, priceMultiplier: parseFloat(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <input type="checkbox" checked={form.isDisabled} onChange={(e) => setForm({ ...form, isDisabled: e.target.checked })} className="w-4 h-4" id="disabled-check" />
              <label htmlFor="disabled-check" className="text-sm text-white">Désactiver ce pays</label>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={add} className="bg-primary hover:bg-primary/90 text-white">Sauvegarder</Button>
            <Button onClick={() => setShowAdd(false)} variant="outline" className="border-white/10 text-white hover:bg-white/5">Annuler</Button>
          </div>
        </div>
      )}
      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div> : (
        <Table headers={["Pays", "Slug", "Multiplicateur", "Statut", "Actions"]} empty={!data?.overrides?.length}>
          {(data?.overrides ?? []).map((c: any) => (
            <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
              <td className="px-4 py-3 text-white font-medium text-sm">{c.countryName}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{c.countrySlug}</td>
              <td className="px-4 py-3">
                <input type="number" step="0.01" defaultValue={c.priceMultiplier} onBlur={(e) => updateMultiplier(c, e.target.value)} className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs text-center" />
              </td>
              <td className="px-4 py-3">{c.isDisabled ? <StatusBadge status="BANNED" /> : <StatusBadge status="RECEIVED" />}</td>
              <td className="px-4 py-3">
                <button onClick={() => toggle(c)} className={`p-1.5 rounded-lg ${c.isDisabled ? "text-green-400 hover:bg-green-500/10" : "text-red-400 hover:bg-red-500/10"}`} title={c.isDisabled ? "Activer" : "Désactiver"}>
                  {c.isDisabled ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: CONTACT MESSAGES
══════════════════════════════════════════════════════════════════════════════ */
function AdminContactMessages() {
  const { data, loading, refetch } = useAdminFetch<any[]>("/v1/admin/contact");
  const { toast } = useToast();
  const [expanded, setExpanded] = useState<number | null>(null);

  const markRead = async (id: number, isRead: boolean) => {
    await adminPatch(`/v1/admin/contact/${id}`, { isRead });
    refetch();
  };

  const remove = async (id: number) => {
    await adminDelete(`/v1/admin/contact/${id}`);
    toast({ title: "Message supprimé" });
    refetch();
  };

  const msgs = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{msgs.length} message{msgs.length !== 1 ? "s" : ""} reçu{msgs.length !== 1 ? "s" : ""}</p>
        <button onClick={refetch} className="p-2 rounded-xl border border-white/10 text-muted-foreground hover:text-white hover:bg-white/5"><RefreshCw className="w-4 h-4" /></button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : msgs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Aucun message de contact pour l'instant</div>
      ) : (
        <div className="space-y-3">
          {msgs.map((msg: any) => (
            <div key={msg.id} className={`rounded-2xl border bg-card/40 overflow-hidden transition-all ${msg.isRead ? "border-white/[0.06]" : "border-primary/30 bg-primary/5"}`}>
              <div className="flex items-start gap-4 p-5 cursor-pointer" onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {!msg.isRead && <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold border border-primary/30">Nouveau</span>}
                    <p className="font-semibold text-white text-sm">{msg.name}</p>
                    <span className="text-muted-foreground text-xs">·</span>
                    <p className="text-xs text-muted-foreground">{msg.email}</p>
                  </div>
                  <p className="text-sm text-white/80 font-medium">{msg.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(msg.createdAt).toLocaleString("fr-FR")}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); markRead(msg.id, !msg.isRead); }} className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-muted-foreground hover:text-white" title={msg.isRead ? "Marquer non lu" : "Marquer lu"}>
                    <CheckCircle className={`w-4 h-4 ${msg.isRead ? "text-green-400" : ""}`} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); remove(msg.id); }} className="p-1.5 rounded-lg border border-white/10 hover:bg-red-500/10 text-muted-foreground hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {expanded === msg.id && (
                <div className="px-5 pb-5 border-t border-white/[0.06]">
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap pt-4">{msg.message}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: API WAITLIST
══════════════════════════════════════════════════════════════════════════════ */
function AdminWaitlist() {
  const { data, loading, refetch } = useAdminFetch<any[]>("/v1/admin/waitlist");
  const { toast } = useToast();

  const remove = async (id: number) => {
    await adminDelete(`/v1/admin/waitlist/${id}`);
    toast({ title: "Email supprimé" });
    refetch();
  };

  const list = data ?? [];

  const copyAll = () => {
    const text = list.map((e: any) => e.email).join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: `${list.length} adresse${list.length !== 1 ? "s" : ""} copiée${list.length !== 1 ? "s" : ""}` });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">{list.length} abonné{list.length !== 1 ? "s" : ""} à la liste d'attente API</p>
        <div className="flex gap-2">
          {list.length > 0 && (
            <Button onClick={copyAll} variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5 text-xs">
              Copier tous les emails
            </Button>
          )}
          <button onClick={refetch} className="p-2 rounded-xl border border-white/10 text-muted-foreground hover:text-white hover:bg-white/5"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Aucun abonné pour l'instant</div>
      ) : (
        <Table headers={["Email", "Date d'inscription", "Action"]} empty={false}>
          {list.map((entry: any) => (
            <tr key={entry.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-3 text-white text-sm font-medium">{entry.email}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(entry.createdAt).toLocaleString("fr-FR")}</td>
              <td className="px-4 py-3">
                <button onClick={() => remove(entry.id)} className="p-1.5 rounded-lg border border-white/10 hover:bg-red-500/10 text-muted-foreground hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN ADMIN PANEL COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
type AdminTab = "stats" | "users" | "orders" | "transactions" | "messages" | "settings" | "payments" | "faq" | "social" | "countries" | "contact" | "waitlist" | "promos";

const ADMIN_NAV: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: "stats",        label: "Statistiques",    icon: <BarChart3 className="w-4 h-4" /> },
  { id: "users",        label: "Utilisateurs",    icon: <Users className="w-4 h-4" /> },
  { id: "orders",       label: "Commandes",       icon: <ShoppingBag className="w-4 h-4" /> },
  { id: "transactions", label: "Transactions",    icon: <CreditCard className="w-4 h-4" /> },
  { id: "promos",       label: "Codes Promo",     icon: <Percent className="w-4 h-4" /> },
  { id: "messages",     label: "Messages",        icon: <MessageSquare className="w-4 h-4" /> },
  { id: "contact",      label: "Contacts",        icon: <Send className="w-4 h-4" /> },
  { id: "waitlist",     label: "Liste d'attente API", icon: <Bell className="w-4 h-4" /> },
  { id: "settings",     label: "Paramètres",      icon: <Settings className="w-4 h-4" /> },
  { id: "payments",     label: "Paiements",       icon: <Wallet className="w-4 h-4" /> },
  { id: "faq",          label: "Centre d'aide",   icon: <HelpCircle className="w-4 h-4" /> },
  { id: "social",       label: "Réseaux sociaux", icon: <Share2 className="w-4 h-4" /> },
  { id: "countries",    label: "Pays",            icon: <Globe2 className="w-4 h-4" /> },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>("stats");
  const current = ADMIN_NAV.find((n) => n.id === activeTab);

  return (
    <div className="space-y-0">
      {/* Admin header */}
      <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl border border-primary/20 bg-primary/5">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center"><Shield className="w-5 h-5 text-primary" /></div>
        <div>
          <h2 className="text-lg font-bold text-white">Panneau Administrateur</h2>
          <p className="text-xs text-muted-foreground">Gestion complète de la plateforme ZyNum</p>
        </div>
      </div>

      {/* Tab nav — horizontal scroll */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-none">
        {ADMIN_NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === item.id
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* Section title */}
      <div className="flex items-center gap-2 mb-5">
        <div className="text-primary">{current?.icon}</div>
        <h3 className="text-base font-bold text-white">{current?.label}</h3>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {activeTab === "stats"        && <AdminStats />}
          {activeTab === "users"        && <AdminUsers />}
          {activeTab === "orders"       && <AdminOrders />}
          {activeTab === "transactions" && <AdminTransactions />}
          {activeTab === "promos"       && <AdminDiscountCodes />}
          {activeTab === "messages"     && <AdminMessages />}
          {activeTab === "contact"      && <AdminContactMessages />}
          {activeTab === "waitlist"     && <AdminWaitlist />}
          {activeTab === "settings"     && <AdminSettings />}
          {activeTab === "payments"     && <AdminPayments />}
          {activeTab === "faq"          && <AdminFaq />}
          {activeTab === "social"       && <AdminSocialLinks />}
          {activeTab === "countries"    && <AdminCountries />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
