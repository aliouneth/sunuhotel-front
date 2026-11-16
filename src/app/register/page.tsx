"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { Button, Card, Checkbox, Input } from "@/components/ui";
import { useLocale } from "@/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Honeypot, useSpamGuard } from "@/lib/anti-spam";
import {
  hasErrors,
  isBlank,
  isValidCountry,
  isValidCurrency,
  isValidLogo,
  isValidPhone,
  validateEmailField,
  validateNameField,
  validateNewPasswordField,
  type FieldErrors,
} from "@/lib/validation";
import { HotelFields, hotelToForm, type HotelFormState, type HotelFormErrors } from "@/components/platform/HotelFields";

type RegisterField =
  | "name"
  | "email"
  | "password"
  | "password_confirmation";

type RegisterErrors = FieldErrors<RegisterField>;

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [hotelForm, setHotelForm] = useState<HotelFormState>(() => ({
    ...hotelToForm({ name: "", status: "pending", locale: "fr" }),
    currency: "CFA",
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [hotelErrors, setHotelErrors] = useState<HotelFormErrors>({});
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { honeypot, setHoneypot, isSpam } = useSpamGuard(4);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key as RegisterField]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  }

  function setHotel<K extends keyof HotelFormState>(key: K, value: HotelFormState[K]) {
    setHotelForm((f) => ({ ...f, [key]: value }));
    if (hotelErrors[key]) {
      setHotelErrors((current) => ({ ...current, [key]: undefined }));
    }
  }

  function onLogoChange(file: File | undefined) {
    if (file && !isValidLogo(file)) {
      setLogo(null);
      setLogoPreview(null);
      setErrors((current) => ({ ...current, logo: undefined }));
      return;
    }
    setLogo(file ?? null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  }

  function validate(): { user: RegisterErrors; hotel: HotelFormErrors } {
    const userErrors: RegisterErrors = {
      name: validateNameField(form.name) ?? undefined,
      email: validateEmailField(form.email) ?? undefined,
      password: validateNewPasswordField(form.password) ?? undefined,
      password_confirmation: !form.password_confirmation
        ? "err_required"
        : form.password !== form.password_confirmation
          ? "err_password_mismatch"
          : undefined,
    };
    const hotelErrors: HotelFormErrors = {
      name: isBlank(hotelForm.name) ? "err_required" : undefined,
      country:
        hotelForm.country && !isValidCountry(hotelForm.country)
          ? "err_country_invalid"
          : undefined,
      currency: !isValidCurrency(hotelForm.currency) ? "err_currency_invalid" : undefined,
      phone:
        hotelForm.phone && !isValidPhone(hotelForm.phone)
          ? "err_phone_invalid"
          : undefined,
    };
    return { user: userErrors, hotel: hotelErrors };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { user: nextUserErrors, hotel: nextHotelErrors } = validate();
    setErrors(nextUserErrors);
    setHotelErrors(nextHotelErrors);
    if (hasErrors(nextUserErrors) || hasErrors(nextHotelErrors)) return;
    if (isSpam()) {
      setError(t("err_spam"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        password_confirmation: form.password_confirmation,
        locale: hotelForm.locale || "fr",
        hotel: {
          name: hotelForm.name.trim(),
          legal_name: hotelForm.legal_name.trim() || undefined,
          address: hotelForm.address.trim() || undefined,
          city: hotelForm.city.trim() || undefined,
          country: hotelForm.country.trim().toUpperCase() || undefined,
          phone: hotelForm.phone.trim() || undefined,
          phone_2: hotelForm.phone_2.trim() || undefined,
          email: hotelForm.email.trim() || undefined,
          website: hotelForm.website.trim() || undefined,
          description: hotelForm.description.trim() || undefined,
          other_services: hotelForm.other_services.trim() || undefined,
          currency: hotelForm.currency.trim().toUpperCase(),
          tax_rate: hotelForm.tax_rate,
          stars: hotelForm.stars,
          check_in_time: hotelForm.check_in_time || undefined,
          check_out_time: hotelForm.check_out_time || undefined,
          timezone: hotelForm.timezone || undefined,
          has_restaurant: hotelForm.has_restaurant,
          has_spa: hotelForm.has_spa,
          has_leisure: hotelForm.has_leisure,
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
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Sunuhotel" width={195} height={140} className="h-[50px] w-auto rounded-md" />
        </Link>
        <LanguageSwitcher />
      </header>
      <div className="flex flex-1 items-start justify-center px-4 pb-16 pt-4 sm:px-6">
        <Card className="w-full max-w-2xl p-5 sm:p-8">
          <h1 className="text-xl font-semibold text-slate-900">{t("register_title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("register_sub")}</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Honeypot value={honeypot} onChange={setHoneypot} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t("name")}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                autoComplete="name"
                error={errors.name ? t(errors.name) : undefined}
              />
              <Input
                label={t("email")}
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
                autoComplete="email"
                inputMode="email"
                error={errors.email ? t(errors.email) : undefined}
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
                autoComplete="new-password"
                error={errors.password ? t(errors.password) : undefined}
              />
              <Input
                label={t("confirm_password")}
                type="password"
                value={form.password_confirmation}
                onChange={(e) => set("password_confirmation", e.target.value)}
                required
                autoComplete="new-password"
                error={
                  errors.password_confirmation
                    ? t(errors.password_confirmation)
                    : undefined
                }
              />
            </div>
            <p className="text-xs text-slate-500">{t("password_hint")}</p>

            <div className="border-t border-slate-100 pt-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">{t("hotel_name")}</h2>
              <HotelFields
                form={hotelForm}
                set={setHotel}
                errors={hotelErrors}
                idPrefix="register"
                hiddenFields={["slug", "comment", "status"]}
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <Input
                  label={t("hotel_logo")}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="cursor-pointer file:cursor-pointer"
                  onChange={(e) => onLogoChange(e.target.files?.[0])}
                />
              </div>
              {logoPreview && (
                <div className="flex-none">
                  <div className="flex size-16 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoPreview} alt={t("hotel_logo")} className="size-full object-contain" />
                  </div>
                </div>
              )}
            </div>
            {logo && <p className="text-xs text-slate-500">{t("hotel_logo_hint")}</p>}
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <Button type="submit" loading={busy} className="w-full">
              {t("register_action")}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            {t("have_account")}{" "}
            <Link href="/login" className="font-medium text-amber-700 hover:text-amber-800">
              {t("login_title")}
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
