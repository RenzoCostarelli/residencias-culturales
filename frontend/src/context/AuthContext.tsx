import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiClient, registerUnauthorizedHandler } from "../api/client";
import type { Usuario } from "../types";

type AuthContextValue = {
  usuario: Usuario | null;
  token: string | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "residencias.token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common.Authorization;
    }
  }, [token]);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setUsuario(null);
    });
  }, []);

  useEffect(() => {
    if (!token) {
      setCargando(false);
      return;
    }
    let activo = true;
    apiClient
      .get<Usuario>("/auth/me")
      .then((res) => {
        if (activo) setUsuario(res.data);
      })
      .catch(() => {
        if (activo) {
          localStorage.removeItem(STORAGE_KEY);
          setToken(null);
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [token]);

  async function login(email: string, password: string) {
    const res = await apiClient.post<{ token: string; usuario: Usuario }>("/auth/login", {
      email,
      password,
    });
    localStorage.setItem(STORAGE_KEY, res.data.token);
    setToken(res.data.token);
    setUsuario(res.data.usuario);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUsuario(null);
  }

  const value = useMemo(
    () => ({ usuario, token, cargando, login, logout }),
    [usuario, token, cargando],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}
