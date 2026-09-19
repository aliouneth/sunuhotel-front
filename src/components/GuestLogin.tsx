"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError, setGuestToken } from "@/lib/api";
import { Button, ErrorBox, Input } from "@/components/ui";
import type { GuestLoginResult } from "@/types/dto";

export default function GuestLoginPage({ slug }: { slug: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [loginError, setLoginError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setLoginError("");
    try {
      const result = await api<{ data: GuestLoginResult }>("/guests/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setGuestToken(result.data.token);
      router.push(`/guest/${slug}/my-reservations`);
    } catch (err) {
      if (err instanceof ApiError) {
        setLoginError(err.message);
      } else {
        setLoginError("Impossible de se connecter. Réessayez.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <div className="mx-auto max-w-md px-6 pt-14">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Mes réservations</h1>
          <p className="mt-1 text-sm text-slate-500">
            Connectez-vous avec l’adresse e-mail et le mot de passe définis lors de votre réservation pour retrouver
            vos séjours.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Input label="Adresse e-mail" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Mot de passe" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {loginError && <ErrorBox message={loginError} />}
            <Button type="submit" className="w-full" loading={busy}>
              Se connecter
            </Button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          Pas encore de compte ? Vous pouvez en créer un en définissant un mot de passe lors de votre prochaine
          réservation. <Link href={`/guest/${slug}`} className="font-medium text-amber-700 underline">Retour à l’hôtel</Link>
        </p>
      </div>
    </main>
  );
}
