"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
  username: string;
  displayName: string;
  role: "admin" | "user";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

const USERS: Record<string, { password: string; displayName: string; role: "admin" | "user" }> = {
  admin: { password: "1234", displayName: "Administrador", role: "admin" },
  ivan: { password: "1234", displayName: "Ivan Hernández", role: "user" },
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("aon_session");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("aon_session");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (username: string, password: string) => {
    const entry = USERS[username];
    if (!entry) {
      return { success: false, error: "Usuario no encontrado" };
    }
    if (entry.password !== password) {
      return { success: false, error: "Contraseña incorrecta" };
    }
    const userData: User = {
      username,
      displayName: entry.displayName,
      role: entry.role,
    };
    setUser(userData);
    localStorage.setItem("aon_session", JSON.stringify(userData));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("aon_session");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
