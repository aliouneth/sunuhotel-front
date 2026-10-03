"use client";

import { Input, Select, Textarea } from "@/components/ui";
import { useLocale } from "@/i18n/LocaleProvider";
import type { HotelStatus } from "@/types/dto";

/**
 * The editable hotel attribute set, shared by the create modal and the
 * dedicated edit page so the two forms can never drift apart.
 */
export interface HotelFormState {
  name: string;
  legal_name: string;
  slug: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  phone_2: string;
  email: string;
  website: string;
  description: string;
  other_services: string;
  comment: string;
  currency: string;
  tax_rate: number;
  stars: number;
  check_in_time: string;
  check_out_time: string;
  timezone: string;
  locale: string;
  status: HotelStatus;
}

export type HotelFormErrors = Partial<Record<keyof HotelFormState, string>>;

const TIMEZONES = [
  "UTC",
  "Africa/Dakar",
  "Africa/Abidjan",
  "Europe/Paris",
  "America/New_York",
  "Asia/Dubai",
];

const STATUSES: HotelStatus[] = ["pending", "active", "suspended", "rejected", "trial"];

export function HotelFields({
  form,
  set,
  errors = {},
  idPrefix,
}: {
  form: HotelFormState;
  set: <K extends keyof HotelFormState>(key: K, value: HotelFormState[K]) => void;
  errors?: HotelFormErrors;
  /** Disambiguates the timezone datalist id when two forms share the screen. */
  idPrefix: string;
}) {
  const { t } = useLocale();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Input
          label={t("hotel_name")}
          required
          value={form.name}
          error={errors.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </div>
      <Input
        label={t("legal_name_label")}
        value={form.legal_name}
        error={errors.legal_name}
        onChange={(e) => set("legal_name", e.target.value)}
      />
      <Input
        label={`${t("slug_label")} (${t("optional")})`}
        value={form.slug}
        error={errors.slug}
        onChange={(e) => set("slug", e.target.value)}
      />

      <div className="sm:col-span-2">
        <Input
          label={t("address")}
          value={form.address}
          error={errors.address}
          onChange={(e) => set("address", e.target.value)}
        />
      </div>
      <Input
        label={t("city_label")}
        value={form.city}
        error={errors.city}
        onChange={(e) => set("city", e.target.value)}
      />
      <Input
        label={t("country_code")}
        maxLength={2}
        value={form.country}
        error={errors.country}
        onChange={(e) => set("country", e.target.value.toUpperCase())}
      />
      <Input
        label={t("phone")}
        value={form.phone}
        error={errors.phone}
        onChange={(e) => set("phone", e.target.value)}
      />
      <Input
        label={t("phone_2")}
        value={form.phone_2}
        error={errors.phone_2}
        onChange={(e) => set("phone_2", e.target.value)}
      />
      <Input
        label={t("email")}
        type="email"
        value={form.email}
        error={errors.email}
        onChange={(e) => set("email", e.target.value)}
      />
      <Input
        label={t("website")}
        value={form.website}
        error={errors.website}
        onChange={(e) => set("website", e.target.value)}
      />

      <div className="sm:col-span-2">
        <Textarea
          label={t("hotel_description")}
          rows={3}
          value={form.description}
          error={errors.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <div className="sm:col-span-2">
        <Textarea
          label={t("hotel_other_services")}
          rows={3}
          value={form.other_services}
          error={errors.other_services}
          onChange={(e) => set("other_services", e.target.value)}
        />
        <p className="mt-1 text-xs text-slate-500">{t("hotel_other_services_hint")}</p>
      </div>
      <div className="sm:col-span-2">
        <Textarea
          label={t("hotel_comment")}
          rows={2}
          value={form.comment}
          error={errors.comment}
          onChange={(e) => set("comment", e.target.value)}
        />
        <p className="mt-1 text-xs text-slate-500">{t("hotel_comment_hint")}</p>
      </div>

      <Input
        label={t("currency")}
        maxLength={3}
        required
        value={form.currency}
        error={errors.currency}
        onChange={(e) => set("currency", e.target.value.toUpperCase())}
      />
      <Input
        label={t("tax_rate")}
        type="number"
        step="0.01"
        min={0}
        max={100}
        value={`${form.tax_rate}`}
        error={errors.tax_rate}
        onChange={(e) => set("tax_rate", e.target.value === "" ? 0 : Number(e.target.value))}
      />
      <Input
        label={t("stars_label")}
        type="number"
        min={1}
        max={5}
        value={`${form.stars}`}
        error={errors.stars}
        onChange={(e) => set("stars", e.target.value === "" ? 1 : Number(e.target.value))}
      />
      <Input
        label={t("check_in_time")}
        type="time"
        value={form.check_in_time}
        error={errors.check_in_time}
        onChange={(e) => set("check_in_time", e.target.value)}
      />
      <Input
        label={t("check_out_time")}
        type="time"
        value={form.check_out_time}
        error={errors.check_out_time}
        onChange={(e) => set("check_out_time", e.target.value)}
      />

      <Input
        label={t("timezone")}
        required
        list={`tz-${idPrefix}`}
        value={form.timezone}
        error={errors.timezone}
        onChange={(e) => set("timezone", e.target.value)}
      />
      <datalist id={`tz-${idPrefix}`}>
        {TIMEZONES.map((z) => (
          <option key={z} value={z} />
        ))}
      </datalist>
      <Select
        label={t("locale_label")}
        value={form.locale}
        error={errors.locale}
        onChange={(e) => set("locale", e.target.value)}
      >
        <option value="fr">Français</option>
        <option value="en">English</option>
      </Select>
      <Select
        label={t("status")}
        value={form.status}
        error={errors.status}
        onChange={(e) => set("status", e.target.value as HotelStatus)}
      >
        {STATUSES.map((st) => (
          <option key={st} value={st}>
            {t(statusLabelKey[st])}
          </option>
        ))}
      </Select>
    </div>
  );
}

/** Any subset of the form fields as an API payload may return them: nulls and
 *  omissions both mean "empty". */
export type HotelFormSource = Partial<{
  [K in keyof HotelFormState]: HotelFormState[K] | null;
}>;

/** Build the editable state from an API payload, normalising nulls to "". */
export function hotelToForm(source: HotelFormSource): HotelFormState {
  return {
    name: source.name ?? "",
    legal_name: source.legal_name ?? "",
    slug: source.slug ?? "",
    address: source.address ?? "",
    city: source.city ?? "",
    country: source.country ?? "",
    phone: source.phone ?? "",
    phone_2: source.phone_2 ?? "",
    email: source.email ?? "",
    website: source.website ?? "",
    description: source.description ?? "",
    other_services: source.other_services ?? "",
    comment: source.comment ?? "",
    currency: source.currency ?? "XOF",
    tax_rate: source.tax_rate ?? 0,
    stars: source.stars ?? 3,
    check_in_time: source.check_in_time ?? "15:00",
    check_out_time: source.check_out_time ?? "11:00",
    timezone: source.timezone ?? "Africa/Dakar",
    locale: source.locale ?? "en",
    status: (source.status ?? "pending") as HotelStatus,
  };
}

/**
 * The i18n key per hotel status. Kept here so the select, the list badges and
 * the edit page header all speak the same vocabulary.
 */
export const statusLabelKey: Record<HotelStatus, string> = {
  pending: "pending_status",
  active: "active_status",
  suspended: "suspended_status",
  rejected: "rejected_status",
  trial: "trial_status",
};
