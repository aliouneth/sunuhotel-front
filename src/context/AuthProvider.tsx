"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "@/lib/api";
import type { User } from "@/types/dto";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    locale?: string;
    hotel: {
      name: string;
      legal_name?: string;
      address?: string;
      city?: string;
      country?: string;
      currency?: string;
      phone?: string;
      phone_2?: string;
      email?: string;
      website?: string;
      description?: string;
      other_services?: string;
      tax_rate?: number;
      stars?: number;
      check_in_time?: string;
      check_out_time?: string;
      timezone?: string;
      locale?: string;
      has_restaurant?: boolean;
      has_spa?: boolean;
      has_leisure?: boolean;
    };
    logo?: File | null;
  }) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const existing = getToken();
    if (!existing) {
      setLoading(false);
      return;
    }
    setTokenState(existing);
    api<{ data: User }>("/me")
      .then((body) => setUser(body.data))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const body = (await api<{ token: string; user: User }>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })) as { token: string; user: User };
    setToken(body.token);
    setTokenState(body.token);
    setUser(body.user);
    return body.user;
  }, []);

  const register = useCallback<AuthContextValue["register"]>(async (payload) => {
    const fd = new FormData();
    fd.append("name", payload.name);
    fd.append("email", payload.email);
    fd.append("password", payload.password);
    fd.append("password_confirmation", payload.password_confirmation);
    if (payload.locale) fd.append("locale", payload.locale);
    fd.append("hotel[name]", payload.hotel.name);
    if (payload.hotel.legal_name) fd.append("hotel[legal_name]", payload.hotel.legal_name);
    if (payload.hotel.address) fd.append("hotel[address]", payload.hotel.address);
    if (payload.hotel.city) fd.append("hotel[city]", payload.hotel.city);
    if (payload.hotel.country) fd.append("hotel[country]", payload.hotel.country);
    if (payload.hotel.currency) fd.append("hotel[currency]", payload.hotel.currency);
    if (payload.hotel.phone) fd.append("hotel[phone]", payload.hotel.phone);
    if (payload.hotel.phone_2) fd.append("hotel[phone_2]", payload.hotel.phone_2);
    if (payload.hotel.email) fd.append("hotel[email]", payload.hotel.email);
    if (payload.hotel.website) fd.append("hotel[website]", payload.hotel.website);
    if (payload.hotel.description) fd.append("hotel[description]", payload.hotel.description);
    if (payload.hotel.other_services) fd.append("hotel[other_services]", payload.hotel.other_services);
    if (payload.hotel.tax_rate !== undefined) fd.append("hotel[tax_rate]", String(payload.hotel.tax_rate));
    if (payload.hotel.stars !== undefined) fd.append("hotel[stars]", String(payload.hotel.stars));
    if (payload.hotel.check_in_time) fd.append("hotel[check_in_time]", payload.hotel.check_in_time);
    if (payload.hotel.check_out_time) fd.append("hotel[check_out_time]", payload.hotel.check_out_time);
    if (payload.hotel.timezone) fd.append("hotel[timezone]", payload.hotel.timezone);
    if (payload.hotel.locale) fd.append("hotel[locale]", payload.hotel.locale);
    fd.append("hotel[has_restaurant]", payload.hotel.has_restaurant ? "1" : "0");
    fd.append("hotel[has_spa]", payload.hotel.has_spa ? "1" : "0");
    fd.append("hotel[has_leisure]", payload.hotel.has_leisure ? "1" : "0");
    if (payload.logo) fd.append("logo", payload.logo);
    const body = (await api<{ token: string; user: User }>("/register", {
      method: "POST",
      body: fd,
    })) as { token: string; user: User };
    setToken(body.token);
    setTokenState(body.token);
    setUser(body.user);
    return body.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/logout", { method: "POST" });
    } catch {
      /* ignore network errors on logout */
    } finally {
      setToken(null);
      setTokenState(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}