export default function HomePage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-[var(--surface)]">
      <div className="max-w-md text-center space-y-8">
        {/* AON Branding */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span
              className="material-symbols-outlined text-[var(--primary)] text-3xl"
              style={{ fontVariationSettings: "'wght' 700" }}
            >
              analytics
            </span>
          </div>
          <h1 className="display-editorial text-[var(--on-surface)]">
            Validación<br />Fotográfica
          </h1>
          <p className="text-[var(--secondary)] font-medium text-lg">
            Sistema de inspección vehicular con IA
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-[var(--surface-container-lowest)] rounded-xl p-6 card-ambient text-left space-y-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[var(--tertiary)]">verified</span>
            <span className="text-sm font-semibold">Validación automatizada con Gemini AI</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[var(--tertiary)]">photo_camera</span>
            <span className="text-sm font-semibold">6 fotos guiadas del vehículo</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[var(--tertiary)]">schedule</span>
            <span className="text-sm font-semibold">Resultado en menos de 15 segundos</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[var(--tertiary)]">lock</span>
            <span className="text-sm font-semibold">Encriptación de grado bancario</span>
          </div>
        </div>

        {/* API Test Section */}
        <div className="bg-[var(--surface-container-low)] rounded-xl p-6 text-left">
          <p className="label-industrial text-[var(--primary)] mb-3">Para iniciar una inspección</p>
          <p className="text-sm text-[var(--secondary)]">
            Usa el endpoint <code className="bg-[var(--surface-container)] px-2 py-0.5 rounded text-xs font-mono">POST /api/v1/inspections</code> con
            los datos del vehículo. Se generará una URL de captura única.
          </p>
        </div>

        {/* Footer */}
        <div className="pt-4">
          <p className="text-[11px] text-zinc-400 italic">
            rocket code — POC AON • Marzo 2026
          </p>
        </div>
      </div>
    </div>
  );
}
