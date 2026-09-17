import Link from "next/link";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { HotelFinder } from "@/components/HotelFinder";
import { AvailabilitySearch } from "@/components/AvailabilitySearch";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Sunuhotel" width={195} height={140} className="h-[60px] w-auto rounded-lg drop-shadow-md" />
        </div>
        <nav className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
          >
            Créer mon hôtel
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-12 pt-12">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Trouvez un Hotel et faites vos réservations
            </h1>
            <p className="mt-4 max-w-lg text-balance text-lg text-slate-600 lg:mx-0 mx-auto">
              Entrez le nom de l&apos;hôtel pour voir les chambres et la disponibilité en direct.
            </p>
            <div className="mt-8 mx-auto lg:mx-0 w-full max-w-md">
              <HotelFinder />
            </div>
          </div>
          <div className="hidden md:block">
            <Image
              src="/traveler.jpg"
              alt="Voyageur cherchant un hôtel"
              width={800}
              height={600}
              priority
              className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 object-cover shadow-lg"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Trouvez un hotel par ville et par dates
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Indiquez une ville et vos dates pour voir les hôtels disponibles.
          </p>
        </div>
        <AvailabilitySearch />
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Reservations", "Gérez arrivées, départs et calendrier des chambres."],
            ["Emploi & dépenses", "Masse salariale et suivi des dépenses en temps réel."],
            ["Tarifs & rapports", "ADR, RevPAR, occupation et export CSV."],
            ["Multilingue", "Interface français / anglais pour toute votre équipe."],
          ].map(([title, sub]) => (
            <div key={title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        Sunuhotel © {new Date().getFullYear()}
      </footer>
    </main>
  );
}
