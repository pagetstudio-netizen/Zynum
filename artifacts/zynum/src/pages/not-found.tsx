import { Home } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/hooks/use-language";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <main className="relative flex w-full flex-1 items-center justify-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid w-full max-w-6xl items-center gap-6 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8 md:grid-cols-[0.9fr_1.1fr] md:gap-10 md:p-10 lg:p-12">
        <div className="order-2 px-1 pb-3 text-center md:order-1 md:px-2 md:py-6 md:text-left">
          <p className="mb-5 inline-flex items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
            {t("not_found_eyebrow")}
          </p>
          <p className="mb-1 text-6xl font-black leading-none tracking-tight text-orange-500 sm:text-7xl">
            404
          </p>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            {t("not_found_title")}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-600 md:mx-0">
            {t("not_found_description")}
          </p>
          <Link
            href="/"
            data-testid="link-not-found-home"
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            {t("not_found_home")}
          </Link>
        </div>

        <div className="order-1 flex items-center justify-center md:order-2">
          <img
            src="/images/404-support.webp"
            alt={t("not_found_image_alt")}
            className="block h-auto w-full max-w-[560px] object-contain"
          />
        </div>
      </section>
    </main>
  );
}
