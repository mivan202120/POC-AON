"use client";

import { AuthProvider } from "@/lib/auth-context";
import { ReactNode } from "react";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
