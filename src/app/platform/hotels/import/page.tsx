"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, API_URL } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleProvider";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorBox,
  PageHeader,
  Select,
  Spinner,
  Table,
} from "@/components/ui";
import type {
  HotelImportDetection,
  HotelImportRecord,
  HotelImportSummary,
  ImportTarget,
} from "@/types/dto";
import { formatDate } from "@/lib/format";

/** i18n key per importable hotel field (reuses the hotel editor's labels). */
const targetLabelKey: Record<string, string> = {
  name: "hotel_name",
  legal_name: "legal_name_label",
  slug: "slug_label",
  address: "address",
  city: "city",
  country: "country_code",
  phone: "phone",
  phone_2: "phone_2",
  email: "email",
  website: "website",
  description: "hotel_description",
  other_services: "hotel_other_services",
  comment: "hotel_comment",
  stars: "stars_label",
  currency: "currency",
  timezone: "timezone",
  tax_rate: "tax_rate",
  check_in_time: "check_in_time",
  check_out_time: "check_out_time",
};

/**
 * `t()` in this project only resolves a key, so counts are substituted here.
 */
function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match
  );
}

export default function HotelImportPage() {
  const { t } = useLocale();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [detection, setDetection] = useState<HotelImportDetection | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [result, setResult] = useState<{ summary: HotelImportSummary; import: HotelImportRecord } | null>(null);

  const { data: history, isLoading: loadingHistory } = useQuery<{
    data: HotelImportRecord[];
    meta: { total: number };
  }>({
    queryKey: ["platform-hotel-imports"],
    queryFn: () => api("/platform/hotel-imports?per_page=10"),
  });

  function reset() {
    setDetection(null);
    setMapping({});
    setResult(null);
    setError(null);
    setFieldError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    setFieldError(null);
    setResult(null);

    const body = new FormData();
    body.append("file", file);

    try {
      const response = await api<{ data: HotelImportDetection }>("/platform/hotel-imports/upload", {
        method: "POST",
        body,
      });
      setDetection(response.data);
      setMapping({ ...response.data.suggested_mapping });
    } catch (e) {
      const message = e instanceof ApiError ? e.message : String(e);
      setError(message);
      setDetection(null);
    } finally {
      setUploading(false);
    }
  }

  async function runImport() {
    if (!detection) return;

    setImporting(true);
    setError(null);
    setFieldError(null);

    try {
      const response = await api<{
        data: { summary: HotelImportSummary; import: HotelImportRecord };
      }>("/platform/hotel-imports/run", {
        method: "POST",
        body: JSON.stringify({ token: detection.token, mapping }),
      });

      setResult(response.data);
      setDetection(null);
      qc.invalidateQueries({ queryKey: ["platform-hotels"] });
      qc.invalidateQueries({ queryKey: ["platform-summary"] });
      qc.invalidateQueries({ queryKey: ["platform-hotel-imports"] });
    } catch (e) {
      // A mapping error is reported field by field by the API ("mapping",
      // "mapping.3", ...), so surface every message rather than only the first.
      const apiError = e as {
        message?: string;
        detail?: { errors?: Record<string, string[] | string> };
      };
      const errors = apiError.detail?.errors;
      if (errors && Object.keys(errors).length > 0) {
        setFieldError(
          Object.values(errors)
            .flat()
            .map(String)
            .join(" ")
        );
      } else {
        setError(e instanceof ApiError ? e.message : String(e));
      }
    } finally {
      setImporting(false);
    }
  }

  const requiredMapped =
    detection?.required_targets.every((key) =>
      Object.values(mapping).includes(key)
    ) ?? false;

  const targetsInUse = new Set(Object.values(mapping).filter(Boolean));
  const rows = detection?.total_rows ?? 0;
  const mappedCount = Object.values(mapping).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("import_hotels_title")}
        subtitle={t("import_hotels_sub")}
        action={
          <div className="flex gap-2">
            <a href={`${API_URL}/platform/hotel-imports/template`} download>
              <Button type="button" variant="secondary">
                {t("import_template")}
              </Button>
            </a>
            <Link href="/platform/hotels">
              <Button type="button" variant="secondary">
                {t("back")}
              </Button>
            </Link>
          </div>
        }
      />

      {error && <ErrorBox message={error} />}

      {/* Step 1 - upload */}
      <Card>
        <CardHeader title={t("import_step_upload")} subtitle={t("import_step_upload_hint")} />
        <div className="space-y-3 p-4 pt-0">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-amber-600"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
            }}
            disabled={uploading}
          />
          {uploading && <Spinner label={t("import_detecting")} />}
          <p className="text-xs text-slate-500">{t("import_file_help")}</p>
        </div>
      </Card>

      {/* Step 2 - detection + mapping */}
      {detection && !result && (
        <>
          <Card>
            <CardHeader
              title={t("import_step_detected")}
              subtitle={`${detection.filename} · ${detection.sheet} · ${fill(t("import_rows_found"), { count: detection.total_rows })}`}
            />
            <div className="space-y-3 p-4 pt-0">
              <div className="flex flex-wrap gap-2">
                <Badge tone="blue">{fill(t("import_columns_found"), { count: detection.headers.length })}</Badge>
                <Badge tone="slate">
                  {fill(t("import_header_row"), { row: detection.header_row })}
                </Badge>
                {detection.truncated && (
                  <Badge tone="amber">
                    {fill(t("import_truncated"), { max: detection.max_rows })}
                  </Badge>
                )}
              </div>

              {/* Preview of the real data, so the mapping can be checked at a glance. */}
              {detection.preview.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <Table headers={detection.headers.map((h) => h.label)}>
                    {detection.preview.map((row) => (
                      <tr key={row.row_number}>
                        {detection.headers.map((h) => (
                          <td
                            key={h.index}
                            className="max-w-[220px] truncate px-3 py-2 text-sm text-slate-700"
                            title={row.values[String(h.index)] ?? ""}
                          >
                            {row.values[String(h.index)] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Table>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title={t("import_step_mapping")}
              subtitle={t("import_step_mapping_hint")}
            />
            <div className="space-y-3 p-4 pt-0">
              {fieldError && <ErrorBox message={fieldError} />}

              <div className="grid gap-3 md:grid-cols-2">
                {detection.headers.map((column) => {
                  const value = mapping[String(column.index)] ?? "";
                  return (
                    <div
                      key={column.index}
                      className="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
                    >
                      <div className="mb-1 flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium text-slate-800">
                          {column.label}
                        </span>
                        <span className="text-[11px] uppercase text-slate-400">
                          {String.fromCharCode(65 + column.index)}
                        </span>
                      </div>
                      {column.sample && (
                        <p
                          className="mb-2 truncate text-xs text-slate-500"
                          title={column.sample}
                        >
                          {column.sample}
                        </p>
                      )}
                      <Select
                        value={value}
                        onChange={(e) => {
                          const next = e.target.value;
                          setMapping((prev) => {
                            const copy = { ...prev };
                            // A hotel field can only come from one column, so
                            // claiming it here releases it everywhere else.
                            for (const [k, v] of Object.entries(copy)) {
                              if (next !== "" && v === next) delete copy[k];
                            }
                            if (next === "") delete copy[String(column.index)];
                            else copy[String(column.index)] = next;
                            return copy;
                          });
                        }}
                      >
                        <option value="">— {t("import_ignore_column")} —</option>
                        {detection.targets.map((target: ImportTarget) => (
                          <option
                            key={target.key}
                            value={target.key}
                            disabled={
                              target.key !== value && targetsInUse.has(target.key)
                            }
                          >
                            {t(targetLabelKey[target.key] ?? target.key)}
                            {target.required ? " *" : ""}
                          </option>
                        ))}
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Step 3 - confirmation */}
          <Card>
            <CardHeader title={t("import_step_confirm")} />
            <div className="space-y-3 p-4 pt-0">
              <ul className="space-y-1 text-sm text-slate-700">
                <li>
                  {fill(t("import_confirm_rows"), {
                    rows,
                    mapped: mappedCount,
                    columns: detection.headers.length,
                  })}
                </li>
                <li className="flex items-start gap-2">
                  <Badge tone="amber">pending</Badge>
                  <span>{t("import_confirm_pending")}</span>
                </li>
              </ul>

              {rows === 0 ? (
                <ErrorBox message={t("import_no_rows")} />
              ) : !requiredMapped ? (
                <ErrorBox message={t("import_missing_required")} />
              ) : null}

              <div className="flex gap-2">
                <Button
                  onClick={runImport}
                  disabled={importing || !requiredMapped || rows === 0}
                >
                  {importing
                    ? t("import_running")
                    : fill(t("import_start"), { count: rows })}
                </Button>
                <Button variant="secondary" onClick={reset} disabled={importing}>
                  {t("cancel")}
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Result */}
      {result && (
        <Card>
          <CardHeader title={t("import_result_title")} />
          <div className="space-y-3 p-4 pt-0">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { n: result.summary.created, label: t("import_created"), cls: "bg-emerald-100 text-emerald-800" },
                { n: result.summary.duplicates, label: t("import_duplicates"), cls: "bg-amber-100 text-amber-800" },
                { n: result.summary.skipped, label: t("import_skipped"), cls: "bg-red-100 text-red-800" },
                { n: result.summary.total_rows, label: t("import_total"), cls: "bg-slate-200 text-slate-800" },
              ].map((c) => (
                <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className={`inline-block rounded-full px-2.5 py-1 text-2xl font-bold ${c.cls}`}>{c.n}</p>
                  <p className="mt-2 text-xs font-medium text-slate-500">{c.label}</p>
                </div>
              ))}
            </div>

            <p className="text-sm text-slate-600">{t("import_result_pending_note")}</p>

            {result.summary.duplicate_samples.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-900">{t("import_duplicates_detail")}</p>
                <ul className="mt-1 space-y-0.5 text-xs text-amber-800">
                  {result.summary.duplicate_samples.map((d) => (
                    <li key={`${d.row}-${d.slug}`}>
                      {fill(t("import_row_label"), { row: d.row })} — {d.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.summary.error_samples.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-900">{t("import_errors_detail")}</p>
                <ul className="mt-1 space-y-0.5 text-xs text-red-800">
                  {result.summary.error_samples.map((e) => (
                    <li key={e.row}>
                      {fill(t("import_row_label"), { row: e.row })} — {e.reasons.join(" ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Link href="/platform/hotels?status=pending">
                <Button>{t("import_review_pending")}</Button>
              </Link>
              <Button variant="secondary" onClick={reset}>
                {t("import_another")}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Audit history */}
      <Card>
        <CardHeader title={t("import_history")} subtitle={t("import_history_hint")} />
        {loadingHistory ? (
          <div className="p-4 pt-0">
            <Spinner />
          </div>
        ) : !history || history.data.length === 0 ? (
          <div className="p-4 pt-0">
            <EmptyState>{t("import_history_empty")}</EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto p-4 pt-0">
            <Table
              headers={[
                t("import_history_file"),
                t("import_history_status"),
                t("import_history_result"),
                t("import_history_by"),
                t("import_history_date"),
              ]}
            >
              {history.data.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2 text-sm text-slate-800">{row.filename}</td>
                  <td className="px-3 py-2">
                    <Badge tone={row.status === "completed" ? "green" : row.status === "failed" ? "red" : "slate"}>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-600">
                    {fill(t("import_history_result_value"), {
                      created: row.created_count,
                      duplicates: row.duplicate_count,
                      skipped: row.skipped_count,
                    })}
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-600">{row.user?.email ?? "—"}</td>
                  <td className="px-3 py-2 text-sm text-slate-600">
                    {row.created_at ? formatDate(row.created_at) : "—"}
                  </td>
                </tr>
              ))}
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
