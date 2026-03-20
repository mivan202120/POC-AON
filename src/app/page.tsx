"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AonLogo from "@/components/AonLogo";

interface FormData {
  make: string;
  model: string;
  year: string;
  color: string;
  plate: string;
}

const INITIAL_FORM: FormData = { make: "", model: "", year: "", color: "", plate: "" };

export default function HomePage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [captureUrl, setCaptureUrl] = useState("");

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

  const isFormValid = form.make.trim() && form.model.trim() && form.color.trim();

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/v1/inspections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": "aon-poc-api-key-2026",
        },
        body: JSON.stringify({
          vehicle_make: form.make,
          vehicle_model: form.model,
          vehicle_color: form.color,
          vehicle_year: form.year ? parseInt(form.year) : undefined,
          vehicle_plate: form.plate || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Error al crear la inspección");
      }

      const data = await response.json();
      // Use local URL for the capture flow
      const localUrl = `/capture/${data.inspection_id}?token=${data.session_token}`;
      setCaptureUrl(localUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const FIELDS: {
    key: keyof FormData;
    label: string;
    placeholder: string;
    icon: string;
    required: boolean;
    type?: string;
    hint?: string;
  }[] = [
    {
      key: "make",
      label: "Marca",
      placeholder: "Ej: Toyota, Nissan, Honda",
      icon: "precision_manufacturing",
      required: true,
      hint: "Fabricante del vehículo",
    },
    {
      key: "model",
      label: "Modelo",
      placeholder: "Ej: Corolla, Versa, Civic",
      icon: "directions_car",
      required: true,
      hint: "Línea o modelo del vehículo",
    },
    {
      key: "year",
      label: "Año",
      placeholder: "Ej: 2024",
      icon: "calendar_month",
      required: false,
      type: "number",
      hint: "Año de fabricación",
    },
    {
      key: "color",
      label: "Color",
      placeholder: "Ej: Blanco, Negro, Plata",
      icon: "palette",
      required: true,
      hint: "Color exterior del vehículo",
    },
    {
      key: "plate",
      label: "Placa",
      placeholder: "Ej: ABC-123-D",
      icon: "badge",
      required: false,
      hint: "Número de placa vehicular",
    },
  ];

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
                Comparte el siguiente enlace con el usuario o abre directamente la cámara.
              </p>
            </div>

            <div className="bg-[var(--surface-container-lowest)] rounded-2xl p-5 card-ambient space-y-4">
              <p className="label-industrial text-zinc-400">Vehículo registrado</p>
              <p className="text-lg font-bold text-[var(--on-surface)]">
                {form.make} {form.model} {form.year} — {form.color}
              </p>
              {form.plate && (
                <p className="font-mono font-bold text-xl tracking-wider text-[var(--primary)]">{form.plate}</p>
              )}
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
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + captureUrl);
                }}
                className="w-full py-4 border-2 border-zinc-200 rounded-xl text-sm font-bold uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined text-xl">content_copy</span>
                <span>Copiar Enlace</span>
              </button>
              <button
                onClick={() => { setCaptureUrl(""); setForm(INITIAL_FORM); }}
                className="w-full py-3 text-[var(--secondary)] text-sm font-semibold hover:text-[var(--primary)] transition-colors"
              >
                + Nueva Inspección
              </button>
            </div>
          </div>
        ) : (
          /* Form State */
          <div className="space-y-8">
            {/* Hero CTA */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--primary)]/5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                <span className="label-industrial text-[var(--primary)]">Nueva Inspección</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--on-surface)] leading-tight">
                Registra los datos<br />del vehículo
              </h1>
              <p className="text-[var(--secondary)] text-sm font-medium max-w-xs">
                Completa la información del vehículo para generar el enlace de inspección fotográfica.
              </p>
            </div>

            {/* Vehicle Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label htmlFor={field.key} className="flex items-center gap-1.5">
                    <span className="label-industrial text-zinc-500">{field.label}</span>
                    {field.required && <span className="text-[var(--primary)] text-xs">*</span>}
                  </label>
                  <div
                    className={`relative bg-[var(--surface-container-lowest)] rounded-xl transition-all duration-300 ${
                      focusedField === field.key
                        ? "ring-2 ring-[var(--primary)] shadow-lg shadow-[var(--primary)]/5"
                        : "ring-1 ring-zinc-200"
                    }`}
                  >
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <span
                        className={`material-symbols-outlined text-xl transition-colors duration-300 ${
                          focusedField === field.key ? "text-[var(--primary)]" : "text-zinc-400"
                        }`}
                      >
                        {field.icon}
                      </span>
                    </div>
                    <input
                      id={field.key}
                      type={field.type || "text"}
                      value={form[field.key]}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      onFocus={() => setFocusedField(field.key)}
                      onBlur={() => setFocusedField(null)}
                      placeholder={field.placeholder}
                      className="w-full pl-12 pr-4 py-4 bg-transparent text-[var(--on-surface)] font-medium placeholder:text-zinc-400 outline-none rounded-xl text-sm"
                    />
                    {form[field.key] && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <span className="material-symbols-outlined text-green-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      </div>
                    )}
                  </div>
                  {focusedField === field.key && field.hint && (
                    <p className="text-[11px] text-zinc-400 pl-1">{field.hint}</p>
                  )}
                </div>
              ))}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-[var(--error-container)] rounded-xl animate-shake">
                  <span className="material-symbols-outlined text-[var(--error)] text-xl">error</span>
                  <p className="text-[var(--on-error-container)] text-sm font-semibold">{error}</p>
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-4 space-y-4">
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all duration-300 flex items-center justify-center gap-3 ${
                    !isFormValid
                      ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                      : isSubmitting
                      ? "bg-[var(--on-surface)] text-white cursor-wait"
                      : "btn-primary"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Creando inspección...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xl">photo_camera</span>
                      <span>Generar Inspección</span>
                    </>
                  )}
                </button>

                {/* Info Note */}
                <div className="flex items-start gap-3 p-4 bg-[var(--surface-container-low)] rounded-xl">
                  <span className="material-symbols-outlined text-[var(--tertiary)] text-xl mt-0.5">info</span>
                  <p className="text-xs text-[var(--secondary)] leading-relaxed">
                    Se generará un enlace único para que el usuario tome <strong>6 fotos guiadas</strong> del vehículo. 
                    La IA verificará que las fotos coincidan con los datos registrados.
                  </p>
                </div>
              </div>
            </form>
          </div>
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
