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
    hotel: { name: string; slug?: string; country?: string; currency?: string };
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
    if (payload.hotel.slug) fd.append("hotel[slug]", payload.hotel.slug);
    if (payload.hotel.country) fd.append("hotel[country]", payload.hotel.country);
    if (payload.hotel.currency) fd.append("hotel[currency]", payload.hotel.currency);
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