import AonLogo from "@/components/AonLogo";

export default function HomePage() {
  return (
    <div className="min-h-dvh flex flex-col bg-[var(--surface)]">
      {/* Premium Header */}
      <header className="w-full glass-header border-b border-zinc-200/30 px-6 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <AonLogo height={28} />
          <span className="label-industrial text-zinc-400">Inspección Digital</span>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md text-center space-y-8">
          {/* Hero */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--primary)]/5 rounded-full mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
              <span className="label-industrial text-[var(--primary)]">Sistema Activo</span>
            </div>
            <h1 className="display-editorial text-[var(--on-surface)]">
              Validación<br />Fotográfica
            </h1>
            <p className="text-[var(--secondary)] font-medium text-lg max-w-xs mx-auto">
              Inspección vehicular inteligente impulsada por IA
            </p>
          </div>

          {/* Info Card */}
          <div className="bg-[var(--surface-container-lowest)] rounded-2xl p-8 card-ambient text-left space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--tertiary)]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--tertiary)] text-xl">verified</span>
              </div>
              <span className="text-sm font-semibold">Validación automatizada con Gemini AI</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--tertiary)]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--tertiary)] text-xl">photo_camera</span>
              </div>
              <span className="text-sm font-semibold">6 fotos guiadas del vehículo</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--tertiary)]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--tertiary)] text-xl">schedule</span>
              </div>
              <span className="text-sm font-semibold">Resultado en menos de 15 segundos</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--tertiary)]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--tertiary)] text-xl">lock</span>
              </div>
              <span className="text-sm font-semibold">Encriptación de grado bancario</span>
            </div>
          </div>

          {/* API Info */}
          <div className="bg-[var(--surface-container-low)] rounded-xl p-6 text-left">
            <p className="label-industrial text-[var(--primary)] mb-3">Para iniciar una inspección</p>
            <p className="text-sm text-[var(--secondary)]">
              Usa el endpoint <code className="bg-[var(--surface-container)] px-2 py-0.5 rounded text-xs font-mono">POST /api/v1/inspections</code> con
              los datos del vehículo. Se generará una URL de captura única.
            </p>
          </div>

          {/* Footer */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <AonLogo height={14} className="opacity-30" />
            <span className="text-[11px] text-zinc-400">
              Powered by rocket code • 2026
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
