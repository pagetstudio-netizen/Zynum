import { ShieldAlert, Globe2 } from "lucide-react";

export default function CountryUnavailable() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <section className="w-full rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl shadow-black/20 backdrop-blur">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
            <ShieldAlert className="h-8 w-8" aria-hidden="true" />
          </div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-red-300">Accès indisponible</p>
          <h1 className="text-3xl font-black tracking-tight">Cette plateforme n’est pas disponible pour votre pays</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-300">
            L’accès a été bloqué pour des raisons de sécurité ou parce qu’un VPN, un proxy ou Tor a été détecté.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-slate-300">
            <Globe2 className="h-4 w-4" aria-hidden="true" />
            Si vous pensez qu’il s’agit d’une erreur, désactivez votre VPN et contactez le support.
          </div>
        </section>
      </div>
    </main>
  );
}