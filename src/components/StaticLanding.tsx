"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const HERO_ITEMS_EN = [
  "Reservations, room inventory, and rate plans in real time.",
  "Front desk workflows: check-in, check-out, and guest profiles.",
  "Housekeeping status, tasks, and room readiness.",
  "Basic reporting on occupancy, revenue, and performance.",
];
const HERO_ITEMS_FR = [
  "Réservations, inventaire des chambres et grilles tarifaires en temps réel.",
  "Réception : check-in, check-out et profils clients.",
  "État du housekeeping, tâches et préparation des chambres.",
  "Rapports essentiels sur l’occupation, le revenu et la performance.",
];

const FEATURES_EN = [
  { title: "Unified activity view", text: "See reservations, arrivals, departures, and housekeeping status in one place, updated in real time." },
  { title: "Configurable to your property", text: "Adapt SunuHotel to your room types, rate plans, and workflows without complex IT projects." },
  { title: "Cloud-first and secure", text: "Access SunuHotel from any device with role-based permissions and secure data handling." },
];
const FEATURES_FR = [
  { title: "Vue unifiée des activités", text: "Visualisez réservations, arrivées, départs et statut du housekeeping au même endroit, en temps réel." },
  { title: "Configuré pour votre établissement", text: "Adaptez SunuHotel à vos types de chambres, grilles tarifaires et processus, sans projet informatique lourd." },
  { title: "Cloud et sécurisé", text: "Accédez à SunuHotel depuis n’importe quel appareil avec des droits par rôle et une gestion sécurisée des données." },
];

const BENEFITS_EN = [
  { title: "Operational clarity", text: "Reduce manual spreadsheets and scattered tools. SunuHotel becomes your single source of truth for daily activity." },
  { title: "Better guest experience", text: "With clear information at the front desk, your team can respond faster and more personally to every guest." },
  { title: "Scales with your growth", text: "Start with one property and expand to multiple hotels on the same platform as your portfolio grows." },
];
const BENEFITS_FR = [
  { title: "Clarté opérationnelle", text: "Réduisez les fichiers Excel et les outils dispersés. SunuHotel devient votre référentiel unique pour l’activité quotidienne." },
  { title: "Meilleure expérience client", text: "Avec une information claire à la réception, vos équipes répondent plus vite et de manière plus personnalisée à chaque client." },
  { title: "Évolutif avec votre croissance", text: "Commencez avec un établissement et étendez-vous à plusieurs hôtels sur la même plateforme à mesure que votre portefeuille grandit." },
];

export function StaticLanding() {
  const { locale } = useLocale();
  const isFr = locale === "fr";
  const heroItems = isFr ? HERO_ITEMS_FR : HERO_ITEMS_EN;
  const features = isFr ? FEATURES_FR : FEATURES_EN;
  const benefits = isFr ? BENEFITS_FR : BENEFITS_EN;

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-balance text-3xl font-bold tracking-tight text-amber-700 sm:text-5xl">
              {isFr ? "Une plateforme moderne de gestion des activités quotidiennes de votre hôtel." : "A modern platform for hotels to orchestrate their daily activities."}
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              {isFr
                ? "SunuHotel centralise les réservations, les opérations et l’expérience client dans un espace de travail intuitif—pensé pour les hôtels indépendants, les boutiques-hôtels et les groupes en croissance."
                : "SunuHotel centralizes reservations, operations, and guest experience into one intuitive workspace—built for independent hotels, boutique properties, and growing groups."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/hotel-owners"
                className="rounded-lg bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-800"
              >
                {isFr ? "Créer mon hôtel" : "Create my Hotel"}
              </a>
              {!isFr && (
                <a
                  href="/SunuHotel-Product-Overview.pdf"
                  download
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Download product overview (PDF)
                </a>
              )}
            </div>
            <p className="mt-4 text-sm text-slate-500">
              {isFr ? "Sans installation ni matériel. SunuHotel est une plateforme cloud accessible partout." : "No installation, no hardware. SunuHotel is a cloud-based platform accessible from anywhere."}
            </p>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              {isFr ? "Conçu pour les équipes hôtelières" : "Built for hotel teams"}
            </span>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">
              {isFr ? "Ce que SunuHotel vous aide à piloter" : "What SunuHotel helps you manage"}
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {heroItems.map((it) => (
                <li key={it} className="flex gap-2">
                  <span className="text-amber-700">•</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {isFr ? "Fonctionnalités clés pour les hôtels modernes" : "Key features for modern hotels"}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            {isFr ? "SunuHotel est conçu pour être simple pour les petits établissements et puissant pour les équipes multi-sites." : "SunuHotel is designed to be simple enough for small properties and powerful enough for multi-property teams."}
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{f.text}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">Front desk</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">Operations</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {isFr ? "Pourquoi les hôtels choisissent SunuHotel" : "Why hotels choose SunuHotel"}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            {isFr ? "Au-delà des fonctionnalités, SunuHotel aide les équipes hôtelières à travailler avec clarté, rapidité et sérénité." : "Beyond features, SunuHotel focuses on helping hotel teams work with clarity, speed, and confidence."}
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900">{b.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl bg-slate-900 p-8 text-white shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {isFr ? "Prêt à découvrir SunuHotel ?" : "Ready to explore SunuHotel?"}
              </h2>
              <p className="mt-2 text-slate-300">
                {isFr ? "Donnez-nous quelques informations sur votre hôtel et nous organiserons une démonstration personnalisée de la plateforme." : "Share a few details about your hotel and we’ll schedule a tailored walkthrough of the platform."}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Contact us: hello@sunuhotel.com · www.SunuHotel.com
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <a
                href="/hotel-owners"
                className="rounded-lg bg-amber-700 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-amber-800"
              >
                {isFr ? "Créer mon hôtel" : "Create my Hotel"}
              </a>
              <p className="text-xs text-slate-400">
                {isFr ? "Durée moyenne de mise en place : 1 à 2 journées selon la taille et la configuration de l’hôtel." : "Typical onboarding time: 2–4 weeks depending on property size and configuration."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
