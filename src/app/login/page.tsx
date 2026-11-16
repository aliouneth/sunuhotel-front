"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { api, setGuestToken } from "@/lib/api";
import { Button, Card, Input } from "@/components/ui";
import { useLocale } from "@/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  hasErrors,
  validateEmailField,
  validatePasswordField,
  type FieldErrors,
} from "@/lib/validation";

type LoginErrors = FieldErrors<"email" | "password">;

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: LoginErrors = {
      email: validateEmailField(email) ?? undefined,
      password: validatePasswordField(password) ?? undefined,
    };
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;
    const normalizedEmail = email.trim().toLowerCase();
    setBusy(true);
    setError("");
    try {
      const user = await login(normalizedEmail, password);
      if (!user.hotel_id) {
        router.replace("/platform/hotels");
      } else if (user.hotel?.status && user.hotel.status !== "active") {
        router.replace("/pending");
      } else {
        router.push("/dashboard");
      }
      return;
    } catch {
      // Fall through to guest login for public (guest) accounts.
    }
    try {
      const res = await api<{ data: { token: string; guest?: { first_name?: string; last_name?: string } } }>("/guest/login", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      setGuestToken(res.data.token);
      if (res.data.guest) {
        const name = [res.data.guest.first_name, res.data.guest.last_name].filter(Boolean).join(" ").trim();
        if (name) window.localStorage.setItem("sunuhotel_guest_name", name);
      }
      router.push("/my-reservations");
    } catch (err) {
      setError((err as { message?: string }).message ?? t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Sunuhotel" width={195} height={140} className="h-[50px] w-auto rounded-md" />
        </Link>
        <LanguageSwitcher />
      </header>
      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <Card className="w-full max-w-md p-8">
          <h1 className="text-xl font-semibold text-slate-900">{t("login_title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("brand")}</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Input
              label={t("email")}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
              }}
              required
              autoComplete="email"
              inputMode="email"
              error={errors.email ? t(errors.email) : undefined}
            />
            <Input
              label={t("password")}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
              }}
              required
              autoComplete="current-password"
              error={errors.password ? t(errors.password) : undefined}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={busy} className="w-full">
              {t("login_action")}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            {t("no_account")}{" "}
            <Link href="/register" className="font-medium text-amber-700 hover:text-amber-700">
              {t("register_title")}
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}