import React from "react";
import { ArrowUpRight, ChevronDown, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import {
  privacyPolicyContent,
  type PrivacySectionCopy,
} from "@/lib/privacy-policy";

const WHATSAPP_URL = "https://wa.me/22892299772";

function PolicySection({ section }: { section: PrivacySectionCopy }) {
  return (
    <section
      id={`privacy-${section.id}`}
      aria-labelledby={`privacy-heading-${section.id}`}
      className="scroll-mt-28 border-b border-border py-7 first:pt-0 last:border-b-0"
    >
      <h2
        id={`privacy-heading-${section.id}`}
        className="mb-4 text-xl font-bold tracking-tight text-foreground md:text-2xl"
      >
        {section.title}
      </h2>
      <div className="space-y-4 text-[15px] leading-7 text-muted-foreground">
        {section.blocks.map((block, index) =>
          block.type === "paragraph" ? (
            <p key={`${section.id}-p-${index}`}>{block.text}</p>
          ) : (
            <ul
              key={`${section.id}-list-${index}`}
              className="list-disc space-y-2 pl-5 marker:text-primary"
            >
              {block.items.map((item) => (
                <li key={item} className="pl-1">
                  {item}
                </li>
              ))}
            </ul>
          ),
        )}
      </div>
    </section>
  );
}

function SectionIndex({
  sections,
  label,
  className = "",
}: {
  sections: PrivacySectionCopy[];
  label: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={className}>
      <p className="mb-3 px-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <ol className="space-y-1">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#privacy-${section.id}`}
              className="block rounded-lg px-3 py-2 text-sm leading-5 text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function Privacy() {
  const { lang } = useLanguage();
  const copy = privacyPolicyContent[lang];

  return (
    <main className="w-full py-10 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mb-8 md:mb-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold tracking-[0.08em] text-primary">
            <ShieldCheck aria-hidden="true" className="h-4 w-4" />
            {copy.badge}
          </div>
          <h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
            {copy.introduction}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted-foreground">
            <span>{copy.updated}</span>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {copy.contactAction}
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
        </header>

        <aside
          aria-label={copy.disclaimerTitle}
          className="mb-8 flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-foreground md:p-5"
        >
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
          />
          <div>
            <h2 className="mb-1 font-bold">{copy.disclaimerTitle}</h2>
            <p className="text-muted-foreground">{copy.disclaimer}</p>
          </div>
        </aside>

        <details className="mb-6 rounded-xl border border-border bg-card p-4 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-foreground [&::-webkit-details-marker]:hidden">
            {copy.indexLabel}
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 text-muted-foreground"
            />
          </summary>
          <SectionIndex
            sections={copy.sections}
            label={copy.indexLabel}
            className="mt-4 border-t border-border pt-4"
          />
        </details>

        <div className="grid items-start gap-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-12">
          <SectionIndex
            sections={copy.sections}
            label={copy.indexLabel}
            className="sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-border bg-card p-3 lg:block"
          />

          <article className="min-w-0 rounded-2xl border border-border bg-card px-5 py-7 shadow-sm sm:px-8 md:py-9">
            {copy.sections.map((section) => (
              <PolicySection key={section.id} section={section} />
            ))}

            <div className="mt-7 flex flex-col gap-4 rounded-xl border border-primary/20 bg-primary/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-foreground">{copy.contactLabel}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {copy.contactNumber}
                </p>
              </div>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {copy.contactAction}
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
              </a>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}