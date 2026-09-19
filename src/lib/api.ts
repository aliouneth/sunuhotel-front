const TOKEN_KEY = "sunuhotel_token";
const GUEST_TOKEN_KEY = "sunuhotel_guest_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

/**
 * Guest-portal token, stored separately so a guest logging in through a
 * hotel's public page never clobbers the staff/manager token.
 */
export function getGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(GUEST_TOKEN_KEY);
}

export function setGuestToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(GUEST_TOKEN_KEY, token);
  else window.localStorage.removeItem(GUEST_TOKEN_KEY);
}
export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000/api/v1";

export function redirectToLogin(): void {
  setToken(null);
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.assign("/login");
  }
}

async function readError(res: Response): Promise<ApiError> {
  let detail: unknown = null;
  let message = `Request failed (${res.status})`;

  try {
    const body = await res.json();
    detail = body;
    if (body?.message) message = body.message;
  } catch {
    /* keep default message */
  }

  return new ApiError(res.status, message, detail);
}

export interface ApiOptions extends RequestInit {
  /** Send the guest self-service token instead of the staff token. */
  guest?: boolean;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = getToken();
  const guestToken = getGuestToken();
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(!isForm && options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  // Guest endpoints authenticate with the guest token (stored separately);
  // prefer it when the caller opts in, otherwise use the staff token.
  if (options.guest && guestToken) headers.Authorization = `Bearer ${guestToken}`;
  else if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Only the login/register endpoints legitimately return 401.
    if (!path.startsWith("/login")) redirectToLogin();
    throw await readError(res);
  }

  if (!res.ok) throw await readError(res);

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export function queryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export { TOKEN_KEY };