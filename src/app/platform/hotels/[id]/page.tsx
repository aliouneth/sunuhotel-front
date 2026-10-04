"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleProvider";
import { Badge, Button, Card, CardHeader, ErrorBox, Input, Spinner } from "@/components/ui";
import {
  HotelFields,
  hotelToForm,
  statusLabelKey,
  type HotelFormErrors,
  type HotelFormState,
} from "@/components/platform/HotelFields";
import { RoomsPanel } from "@/components/platform/RoomsPanel";
import { UsersPanel } from "@/components/platform/UsersPanel";
import type { HotelStatus, PlatformHotel } from "@/types/dto";

const toneByStatus: Record<HotelStatus, string> = {
  pending: "amber",
  active: "green",
  suspended: "slate",
  rejected: "red",
  trial: "blue",
};

type Tab = "info" | "rooms" | "users";

/** The editable field set, derived from the mapper so it can never drift. */
const FORM_FIELDS = Object.keys(hotelToForm({})) as (keyof HotelFormState)[];

export default function PlatformHotelEditPage() {
  const { t } = useLocale();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>("info");

  const { data, error, isLoading, isFetching, refetch } = useQuery<{ data: PlatformHotel }>({
    queryKey: ["platform-hotel", id],
    queryFn: () => api<{ data: PlatformHotel }>(`/platform/hotels/${id}`),
    enabled: Boolean(id),
  });

  const hotel = data?.data;

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorBox
          message={(error as { message?: string } | undefined)?.message ?? t("error_generic")}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-12 flex-none items-center justify-center overflow-hidden rounded-xl bg-amber-600 text-sm font-bold text-white ring-1 ring-slate-200">
            {hotel.logo_url ? (
              <Image
                src={hotel.logo_url}
                alt=""
                width={48}
                height={48}
                className="size-full bg-white object-contain"
              />
            ) : (
              hotel.name.charAt(0)
            )}
          </span>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              {hotel.name}
              <Badge tone={toneByStatus[hotel.status]}>{t(statusLabelKey[hotel.status])}</Badge>
            </h1>
            <p className="text-sm text-slate-500">
              /{hotel.slug} · #{hotel.id}
            </p>
          </div>
        </div>
        <span className="text-xs text-slate-400">
          {isFetching ? t("loading") : null}
        </span>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {([
          { key: "info" as const, label: t("info_tab") },
          { key: "rooms" as const, label: t("rooms_tab") },
          { key: "users" as const, label: t("users_tab") },
        ]).map((btn) => (
          <button
            key={btn.key}
            onClick={() => setTab(btn.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
              tab === btn.key
                ? "border-amber-600 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {tab === "rooms" ? (
        <Card>
          <RoomsPanel hotelId={hotel.id} currency={hotel.currency} />
        </Card>
      ) : tab === "users" ? (
        <Card>
          <UsersPanel hotelId={hotel.id} />
        </Card>
      ) : (
        // Keyed on the hotel id so the form always starts from the fetched
        // record. Re-seeding after a save is handled in-place below, so a
        // remount here would throw away the "saved" confirmation.
        <HotelForm
          key={hotel.id}
          hotel={hotel}
          onSaved={async (fresh) => {
            qc.setQueryData(["platform-hotel", id], { data: fresh });
            await Promise.all([
              qc.invalidateQueries({ queryKey: ["platform-hotels"] }),
              qc.invalidateQueries({ queryKey: ["platform-summary"] }),
            ]);
          }}
        />
      )}

      <p className="text-xs text-slate-400">
        <button onClick={() => router.push("/platform/hotels")} className="underline">
          {t("back")}
        </button>
      </p>
    </div>
  );
}

function BackLink() {
  const { t } = useLocale();
  return (
    <Link href="/platform/hotels" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
      ← {t("platform_hotels")}
    </Link>
  );
}

function HotelForm({
  hotel,
  onSaved,
}: {
  hotel: PlatformHotel;
  onSaved: (hotel: PlatformHotel) => Promise<void>;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState<HotelFormState>(() => hotelToForm(hotel));
  const [baseline, setBaseline] = useState<HotelFormState>(() => hotelToForm(hotel));
  const [errors, setErrors] = useState<HotelFormErrors>({});
  const [banner, setBanner] = useState("");
  const [busy, setBusy] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);

  // Text edits only: a chosen file or a queued deletion also makes the form
  // dirty, but those are tracked separately so Save can report them.
  const dirty = useMemo(() => FORM_FIELDS.some((k) => form[k] !== baseline[k]), [form, baseline]);
  const pendingFiles = logo !== null || images.length > 0 || imagesToDelete.length > 0;
  const canSave = (dirty || pendingFiles) && form.name.trim() !== "" && !busy;

  // Guard against losing in-progress edits to a tab close or reload.
  useEffect(() => {
    if (!dirty && !pendingFiles) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, pendingFiles]);

  function set<K extends keyof HotelFormState>(key: K, value: HotelFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setBanner("");
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }

  function onLogoChange(file: File | undefined) {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogo(file ?? null);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
    setBanner("");
  }

  function onImagesChange(files: FileList | null | undefined) {
    const arr = files ? Array.from(files) : [];
    setImages(arr);
    setImagePreviews((prev) => [
      ...prev,
      ...arr.map((f) => URL.createObjectURL(f)),
    ]);
    setBanner("");
  }

  function toggleDeleteImage(imageId: number) {
    setImagesToDelete((prev) =>
      prev.includes(imageId) ? prev.filter((x) => x !== imageId) : [...prev, imageId]
    );
    setBanner("");
  }

  function reset() {
    setForm(hotelToForm(hotel));
    setBaseline(hotelToForm(hotel));
    setErrors({});
    setBanner("");
    setLogo(null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(null);
    setImages([]);
    setImagePreviews([]);
    setImagesToDelete([]);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setBanner("");
    try {
      const fd = new FormData();
      // Method spoofing keeps this a real multipart POST so PHP populates
      // $_FILES; Laravel re-dispatches it as PUT.
      fd.append("_method", "PUT");
      // Send only what actually changed, so the API never re-writes a field the
      // admin left alone (and so a rejected payload can't silently normalise
      // untouched values).
      for (const key of FORM_FIELDS) {
        if (form[key] !== baseline[key]) fd.append(key, `${form[key]}`);
      }
      if (logo) fd.append("logo", logo);
      images.forEach((img) => fd.append("images[]", img));
      imagesToDelete.forEach((id) => fd.append("images_to_delete[]", `${id}`));

      const res = await api<{ data: PlatformHotel }>(`/platform/hotels/${hotel.id}`, {
        method: "POST",
        body: fd,
      });

      const fresh = res.data;
      // Re-seed from the server's response: it is the post-save truth, and it
      // normalises anything the API trimmed or defaulted.
      const seeded = hotelToForm(fresh);
      setForm(seeded);
      setBaseline(seeded);
      setLogo(null);
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      setLogoPreview(null);
      setImages([]);
      setImagePreviews([]);
      setImagesToDelete([]);
      setBanner(t("hotel_saved"));
      await onSaved(fresh);
    } catch (err) {
      const detail = (err as ApiError).detail as
        | { errors?: Record<string, string[] | string> }
        | undefined;
      const fieldErrors = detail?.errors;
      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        // Errors on the text fields render inline. Anything else - a rejected
        // logo, too many photos, a bad _method - belongs to no input, so it has
        // to reach the banner or the admin just sees "save failed" with no
        // reason and no idea which change was dropped.
        const inline: HotelFormErrors = {};
        const elsewhere: string[] = [];
        for (const [field, value] of Object.entries(fieldErrors)) {
          const message = Array.isArray(value) ? value[0] : String(value);
          if (FORM_FIELDS.includes(field as keyof HotelFormState)) {
            inline[field as keyof HotelFormState] = message;
          } else {
            elsewhere.push(message);
          }
        }
        setErrors(inline);
        setBanner(elsewhere.length > 0 ? elsewhere.join(" ") : t("hotel_save_failed"));
      } else {
        setBanner((err as ApiError).message ?? t("error_generic"));
      }
    } finally {
      setBusy(false);
    }
  }

  const remainingImages = (hotel.images ?? []).filter((img) => !imagesToDelete.includes(img.id));

  return (
    <form onSubmit={save} className="space-y-4">
      <Card>
        <CardHeader title={t("hotel_logo")} subtitle={t("hotel_logo_hint")} />
        <div className="flex flex-wrap items-center gap-5 px-5 py-4">
          <div className="flex size-20 flex-none items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
            {logoPreview || hotel.logo_url ? (
              <Image
                src={(logoPreview || hotel.logo_url) as string}
                alt=""
                width={160}
                height={160}
                className="size-full object-contain"
              />
            ) : (
              <span className="text-xl font-bold text-slate-300">
                {hotel.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-[16rem] flex-1">
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="cursor-pointer file:cursor-pointer"
              onChange={(e) => onLogoChange(e.target.files?.[0])}
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title={t("hotel_photos")}
          subtitle={t("hotel_photos_replace_hint")}
        />
        <div className="space-y-4 px-5 py-4">
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            className="cursor-pointer file:cursor-pointer"
            onChange={(e) => onImagesChange(e.target.files)}
          />
          <p className="text-xs text-slate-500">{t("hotel_photos_hint")}</p>

          {imagePreviews.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-600">{t("hotel_photos_new")}</p>
              <div className="flex flex-wrap gap-2">
                {imagePreviews.map((src) => (
                  <Image
                    key={src}
                    src={src}
                    alt=""
                    width={64}
                    height={64}
                    className="size-16 rounded-lg border border-emerald-300 object-cover"
                  />
                ))}
              </div>
            </div>
          )}

          {(hotel.images ?? []).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-600">{t("hotel_photos_current")}</p>
              <div className="flex flex-wrap gap-2">
                {remainingImages.map((img) => (
                  <label
                    key={img.id}
                    className="flex items-center gap-1 text-xs text-slate-600"
                    title={t("hotel_photos_delete")}
                  >
                    <input
                      type="checkbox"
                      checked={imagesToDelete.includes(img.id)}
                      onChange={() => toggleDeleteImage(img.id)}
                      className="rounded"
                    />
                    <Image
                      src={img.image_url}
                      alt=""
                      width={48}
                      height={48}
                      className="size-12 rounded border border-slate-200 object-cover"
                    />
                  </label>
                ))}
                {remainingImages.length === 0 && (
                  <p className="text-xs text-red-600">{t("hotel_photos_all_removed")}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title={t("info_tab")} />
        <div className="px-5 py-4">
          <HotelFields form={form} set={set} errors={errors} idPrefix="edit" />
        </div>
      </Card>

      {banner && (
        <p
          className={`rounded-lg border px-4 py-2.5 text-sm ${
            banner === t("hotel_saved")
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {banner}
        </p>
      )}

      <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white/95 py-3 backdrop-blur">
        <span className="mr-auto text-xs text-slate-500">
          {pendingFiles ? t("hotel_unsaved_files") : dirty ? t("hotel_unsaved") : t("hotel_no_changes")}
        </span>
        <Button
          type="button"
          variant="ghost"
          onClick={reset}
          disabled={busy || (!dirty && !pendingFiles)}
        >
          {t("hotel_discard")}
        </Button>
        <Button type="submit" loading={busy} disabled={!canSave}>
          {t("save_changes")}
        </Button>
      </div>
    </form>
  );
}
