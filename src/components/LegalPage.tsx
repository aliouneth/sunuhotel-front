"use client";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 pb-16 pt-10">
        <h1 className="text-3xl font-bold tracking-tight text-amber-700 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{updated}</p>
        <p className="mt-6 leading-relaxed text-slate-600">{intro}</p>
        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-2 text-sm leading-relaxed text-slate-600">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
