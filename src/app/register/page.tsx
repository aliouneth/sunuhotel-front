"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { Button, Card, Input } from "@/components/ui";
import { useLocale } from "@/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    hotel_name: "",
    hotel_slug: "",
    hotel_country: "",
    hotel_currency: "EUR",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onLogoChange(file: File | undefined) {
    setLogo(file ?? null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
        locale: "fr",
        hotel: {
          name: form.hotel_name,
          slug: form.hotel_slug || undefined,
          country: form.hotel_country || undefined,
          currency: form.hotel_currency,
        },
        logo,
      });
      router.replace("/pending");
    } catch (err) {
      const e2 = err as { message?: string; detail?: { errors?: Record<string, string[]> } };
      const first = e2.detail?.errors ? Object.values(e2.detail.errors)[0]?.[0] : undefined;
      setError(first ?? e2.message ?? t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Sunuhotel" width={195} height={140} className="h-[50px] w-auto rounded-md" />
        </Link>
        <LanguageSwitcher />
      </header>
      <div className="flex flex-1 items-start justify-center px-6 pb-16 pt-4">
        <Card className="w-full max-w-lg p-8">
          <h1 className="text-xl font-semibold text-slate-900">{t("register_title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("register_sub")}</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t("name")}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                autoComplete="name"
              />
              <Input
                label={t("email")}
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t("password")}
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
                minLength={10}
              />
              <Input
                label={t("confirm_password")}
                type="password"
                value={form.password_confirmation}
                onChange={(e) => set("password_confirmation", e.target.value)}
                required
              />
            </div>
            <Input
              label={t("hotel_name")}
              value={form.hotel_name}
              onChange={(e) => set("hotel_name", e.target.value)}
              required
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label={`${t("hotel_country")}`}
                value={form.hotel_country}
                onChange={(e) => set("hotel_country", e.target.value)}
                maxLength={2}
                placeholder="SN"
              />
              <Input
                label={`${t("hotel_currency")}`}
                value={form.hotel_currency}
                onChange={(e) => set("hotel_currency", e.target.value)}
                maxLength={3}
              />
<Input
              label="Code"
              value={form.hotel_slug}
              onChange={(e) => set("hotel_slug", e.target.value)}
              placeholder={t("slug_hint")}
            />
            </div>
            <div className="flex items-center gap-4">
              <Input
                label={t("hotel_logo")}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="cursor-pointer file:cursor-pointer"
                onChange={(e) => onLogoChange(e.target.files?.[0])}
              />
              {logoPreview && (
                <div className="flex-none">
                  <div className="flex size-16 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoPreview} alt="" className="size-full object-contain" />
                  </div>
                </div>
              )}
            </div>
            {logo && <p className="text-xs text-slate-500">{t("hotel_logo_hint")}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={busy} className="w-full">
              {t("register_action")}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            {t("have_account")}{" "}
            <Link href="/login" className="font-medium text-amber-600 hover:text-amber-700">
              {t("login_title")}
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}