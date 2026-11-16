const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

export type FieldErrors<K extends string = string> = Partial<Record<K, string>>;

export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

export function isEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length <= 191 && EMAIL_PATTERN.test(trimmed);
}

export function isStrongPassword(value: string, minLength = 10): boolean {
  return (
    value.length >= minLength &&
    /[A-Za-z]/.test(value) &&
    /\d/.test(value)
  );
}

export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!/^\+?[\d\s().-]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 15;
}

export function isValidName(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 2 && trimmed.length <= 120;
}

export function isValidSlug(value: string): boolean {
  return value.length <= 60 && SLUG_PATTERN.test(value);
}

export function isValidCountry(value: string): boolean {
  return /^[A-Za-z]{2}$/.test(value.trim());
}

export function isValidCurrency(value: string): boolean {
  return /^[A-Za-z]{3}$/.test(value.trim());
}

export function isDateAfter(checkOut: string, checkIn: string): boolean {
  return Boolean(checkOut) && Boolean(checkIn) && checkOut > checkIn;
}

export function isValidLogo(file: { type: string; size: number }): boolean {
  return LOGO_TYPES.includes(file.type) && file.size > 0 && file.size <= MAX_LOGO_BYTES;
}

export function validateEmailField(value: string): string | null {
  if (isBlank(value)) return "err_required";
  if (!isEmail(value)) return "err_email_invalid";
  return null;
}

export function validatePasswordField(value: string): string | null {
  if (!value) return "err_required";
  return null;
}

export function validateNewPasswordField(value: string): string | null {
  if (!value) return "err_required";
  if (!isStrongPassword(value)) return "err_password_rule";
  return null;
}

export function validateNameField(value: string): string | null {
  if (isBlank(value)) return "err_required";
  if (!isValidName(value)) return "err_required";
  return null;
}

export function validatePhoneField(value: string): string | null {
  if (isBlank(value)) return "err_required";
  if (!isValidPhone(value)) return "err_phone_invalid";
  return null;
}
