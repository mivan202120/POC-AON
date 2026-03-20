"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AonLogo from "@/components/AonLogo";
import VehicleWizard from "@/components/VehicleWizard";

export default function HomePage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [captureUrl, setCaptureUrl] = useState("");
  const [vehicleLabel, setVehicleLabel] = useState("");

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--surface)]">
        <AonLogo height={32} className="animate-pulse" />
      </div>
    );
  }

  const handleVehicleComplete = async (data: {
    year: number | null;
    make: string;
    model: string;
    color: string;
    plate: string;
  }) => {
    setIsSubmitting(true);
    setError("");
    setVehicleLabel(`${data.make} ${data.model} ${data.year || ""} — ${data.color}`);

    try {
      const response = await fetch("/api/v1/inspections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": "aon-poc-api-key-2026",
        },
        body: JSON.stringify({
          vehicle_make: data.make,
          vehicle_model: data.model,
          vehicle_color: data.color,
          vehicle_year: data.year || undefined,
          vehicle_plate: data.plate || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Error al crear la inspección");
      }

      const result = await response.json();
      setCaptureUrl(`/capture/${result.inspection_id}?token=${result.session_token}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--surface)]">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full glass-header border-b border-zinc-200/30 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <AonLogo height={28} />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold uppercase">
                  {user.displayName.charAt(0)}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-[var(--on-surface)] leading-none">{user.displayName}</p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider">{user.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-zinc-100 transition-colors group"
              title="Cerrar sesión"
            >
              <span className="material-symbols-outlined text-zinc-400 group-hover:text-[var(--primary)] transition-colors text-xl">logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow px-6 pt-8 pb-16 max-w-lg mx-auto w-full">
        {/* Success State */}
        {captureUrl ? (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500 flex items-center justify-center shadow-xl shadow-green-500/20 mb-4">
                <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--on-surface)]">¡Inspección Creada!</h1>
              <p className="text-[var(--secondary)] text-sm">
                Comparte el enlace o abre la cámara directamente.
              </p>
            </div>

            <div className="bg-[var(--surface-container-lowest)] rounded-2xl p-5 card-ambient">
              <p className="label-industrial text-zinc-400 mb-2">Vehículo registrado</p>
              <p className="text-lg font-bold text-[var(--on-surface)]">{vehicleLabel}</p>
            </div>

            <div className="space-y-4">
              <a
                href={captureUrl}
                className="btn-primary w-full flex items-center justify-center gap-3 no-underline text-center"
              >
                <span className="material-symbols-outlined text-xl">photo_camera</span>
                <span>Abrir Cámara de Inspección</span>
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(window.location.origin + captureUrl)}
                className="w-full py-4 border-2 border-zinc-200 rounded-xl text-sm font-bold uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined text-xl">content_copy</span>
                <span>Copiar Enlace</span>
              </button>
              <button
                onClick={() => { setCaptureUrl(""); setVehicleLabel(""); }}
                className="w-full py-3 text-[var(--secondary)] text-sm font-semibold hover:text-[var(--primary)] transition-colors"
              >
                + Nueva Inspección
              </button>
            </div>
          </div>
        ) : isSubmitting ? (
          /* Loading State */
          <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-fadeIn">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-[var(--surface-container-lowest)] card-ambient flex items-center justify-center">
                <svg className="w-10 h-10 animate-spin text-[var(--primary)]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-[var(--on-surface)] mb-2">Creando inspección...</h2>
              <p className="text-sm text-[var(--secondary)]">{vehicleLabel}</p>
            </div>
          </div>
        ) : (
          /* Wizard */
          <>
            {error && (
              <div className="mb-6 flex items-center gap-3 p-4 bg-[var(--error-container)] rounded-xl animate-shake">
                <span className="material-symbols-outlined text-[var(--error)] text-xl">error</span>
                <p className="text-[var(--on-error-container)] text-sm font-semibold">{error}</p>
              </div>
            )}
            <VehicleWizard onComplete={handleVehicleComplete} />
          </>
        )}

        {/* Footer */}
        <div className="pt-12 flex items-center justify-center gap-3">
          <AonLogo height={14} className="opacity-30" />
          <span className="text-[11px] text-zinc-400">Powered by rocket code • 2026</span>
        </div>
      </main>
    </div>
  );
}
