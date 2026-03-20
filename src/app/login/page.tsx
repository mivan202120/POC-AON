"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AonLogo from "@/components/AonLogo";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { login, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Micro-delay for premium feel
    await new Promise((r) => setTimeout(r, 600));

    const result = login(username, password);
    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "Credenciales inválidas");
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--surface)] relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-[0.03] pointer-events-none">
        <svg viewBox="0 0 512 200" fill="#E30613" className="w-full h-full">
          <path d="M0 199 L82 0 L104 0 L186 199 L146 199 L130 155 L56 155 L40 199 Z M68 124 L118 124 L93 52 Z"/>
          <path d="M258 204 C206 204 168 164 168 102 C168 40 206 0 258 0 C310 0 348 40 348 102 C348 164 310 204 258 204 Z M258 40 C230 40 210 66 210 102 C210 138 230 164 258 164 C286 164 306 138 306 102 C306 66 286 40 258 40 Z"/>
          <path d="M366 199 L366 0 L404 0 L476 140 L476 0 L512 0 L512 199 L476 199 L402 58 L402 199 Z"/>
        </svg>
      </div>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-sm space-y-10">
          {/* Logo & Welcome */}
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-8">
              <AonLogo height={40} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--on-surface)] mb-2">
                Bienvenido
              </h1>
              <p className="text-[var(--secondary)] text-sm font-medium">
                Ingresa tus credenciales para acceder al sistema
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="label-industrial text-zinc-500 block"
              >
                Usuario
              </label>
              <div
                className={`relative bg-[var(--surface-container-lowest)] rounded-xl transition-all duration-300 ${
                  focusedField === "username"
                    ? "ring-2 ring-[var(--primary)] shadow-lg shadow-[var(--primary)]/5"
                    : "ring-1 ring-zinc-200"
                }`}
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <span
                    className={`material-symbols-outlined text-xl transition-colors duration-300 ${
                      focusedField === "username" ? "text-[var(--primary)]" : "text-zinc-400"
                    }`}
                  >
                    person
                  </span>
                </div>
                <input
                  ref={usernameRef}
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Ingresa tu usuario"
                  autoComplete="username"
                  className="w-full pl-12 pr-4 py-4 bg-transparent text-[var(--on-surface)] font-medium placeholder:text-zinc-400 outline-none rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="label-industrial text-zinc-500 block"
              >
                Contraseña
              </label>
              <div
                className={`relative bg-[var(--surface-container-lowest)] rounded-xl transition-all duration-300 ${
                  focusedField === "password"
                    ? "ring-2 ring-[var(--primary)] shadow-lg shadow-[var(--primary)]/5"
                    : "ring-1 ring-zinc-200"
                }`}
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <span
                    className={`material-symbols-outlined text-xl transition-colors duration-300 ${
                      focusedField === "password" ? "text-[var(--primary)]" : "text-zinc-400"
                    }`}
                  >
                    lock
                  </span>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  className="w-full pl-12 pr-12 py-4 bg-transparent text-[var(--on-surface)] font-medium placeholder:text-zinc-400 outline-none rounded-xl text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-[var(--error-container)] rounded-xl animate-shake">
                <span className="material-symbols-outlined text-[var(--error)] text-xl">error</span>
                <p className="text-[var(--on-error-container)] text-sm font-semibold">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!username || !password || isSubmitting}
              className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all duration-300 flex items-center justify-center gap-3 ${
                !username || !password
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
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <span className="material-symbols-outlined text-zinc-400 text-sm">shield</span>
            <span className="text-[11px] text-zinc-400 font-medium">
              Conexión segura • Encriptación AES-256
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-8 pt-4 px-6 text-center relative z-10">
        <div className="flex items-center justify-center gap-3">
          <AonLogo height={12} className="opacity-20" />
          <span className="text-[11px] text-zinc-300">
            Powered by rocket code • 2026
          </span>
        </div>
      </footer>
    </div>
  );
}
