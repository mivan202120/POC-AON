"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AonLogo from "@/components/AonLogo";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Photo {
  id: string;
  angleType: string;
  blobUrl: string;
  fileSizeBytes: number;
  widthPx: number;
  heightPx: number;
  aiAngleCorrect: boolean | null;
  aiVehiclePresent: boolean | null;
  aiObservations: string | null;
  timestampCapture: string;
}

interface Inspection {
  id: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleColor: string;
  vehiclePlate: string | null;
  vehicleYear: number | null;
  status: "PENDING" | "PROCESSING" | "APPROVED" | "REJECTED";
  confidenceScore: string | null;
  rejectionReasons: string[] | null;
  resultJson: Record<string, unknown> | null;
  geminiLatencyMs: number | null;
  geolocationLat: string | null;
  geolocationLng: string | null;
  createdAt: string;
  completedAt: string | null;
  photos: Photo[];
}

interface Stats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  processing: number;
  totalPhotos: number;
  avgLatencyMs: number | null;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
    if (!isLoading && user && user.role !== "admin") router.push("/");
  }, [user, isLoading, router]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/inspections");
      if (!res.ok) throw new Error("Error al cargar datos");
      const data = await res.json();
      setStats(data.stats);
      setInspections(data.inspections);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "admin") fetchData();
  }, [user, fetchData]);

  if (isLoading || !user) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-50">
        <AonLogo height={32} className="animate-pulse" />
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    APPROVED: { label: "Aprobado", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    REJECTED: { label: "Rechazado", color: "text-red-700", bg: "bg-red-50 border-red-200" },
    PENDING: { label: "Pendiente", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    PROCESSING: { label: "En proceso", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-dvh bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AonLogo height={28} />
            <div className="hidden sm:block h-6 w-px bg-zinc-200" />
            <span className="hidden sm:inline text-sm font-bold text-zinc-500 tracking-tight">
              Panel de Administración
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchData}
              className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
              title="Actualizar"
            >
              <span className="material-symbols-outlined text-zinc-500 text-xl">refresh</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-zinc-800 leading-none">{user.displayName}</p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider">admin</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
              title="Cerrar sesión"
            >
              <span className="material-symbols-outlined text-zinc-400 text-xl">logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">error</span>
            <span className="text-sm font-semibold text-red-700">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <svg className="w-10 h-10 animate-spin mx-auto text-[var(--primary)]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-zinc-500">Cargando inspecciones...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
                <StatCard icon="assignment" label="Total" value={stats.total} color="text-zinc-700" bg="bg-white" />
                <StatCard icon="check_circle" label="Aprobados" value={stats.approved} color="text-emerald-600" bg="bg-emerald-50" />
                <StatCard icon="cancel" label="Rechazados" value={stats.rejected} color="text-red-600" bg="bg-red-50" />
                <StatCard icon="hourglass_top" label="Pendientes" value={stats.pending} color="text-amber-600" bg="bg-amber-50" />
                <StatCard icon="sync" label="En proceso" value={stats.processing} color="text-blue-600" bg="bg-blue-50" />
                <StatCard icon="photo_library" label="Fotos" value={stats.totalPhotos} color="text-violet-600" bg="bg-violet-50" />
                <StatCard
                  icon="speed"
                  label="Latencia IA"
                  value={stats.avgLatencyMs ? `${(stats.avgLatencyMs / 1000).toFixed(1)}s` : "—"}
                  color="text-indigo-600"
                  bg="bg-indigo-50"
                />
              </div>
            )}

            {/* Users Section */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-zinc-800 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-zinc-500">group</span>
                Usuarios del Sistema
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UserCard name="Administrador" username="admin" role="admin" />
                <UserCard name="Ivan Hernández" username="ivan" role="user" />
              </div>
            </div>

            {/* Inspections Table */}
            <div>
              <h2 className="text-lg font-bold text-zinc-800 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-zinc-500">fact_check</span>
                Registro de Inspecciones
                <span className="ml-2 text-xs font-bold bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full">
                  {inspections.length}
                </span>
              </h2>

              {inspections.length === 0 ? (
                <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
                  <span className="material-symbols-outlined text-zinc-300 text-5xl mb-4 block">search_off</span>
                  <p className="text-zinc-500 font-medium">No hay inspecciones registradas</p>
                  <p className="text-zinc-400 text-sm mt-1">Las inspecciones aparecerán aquí cuando los usuarios las completen.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-100 bg-zinc-50/50">
                          <th className="text-left px-5 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider">Vehículo</th>
                          <th className="text-left px-5 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider">Placa</th>
                          <th className="text-left px-5 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider">Estado</th>
                          <th className="text-left px-5 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider">Confianza</th>
                          <th className="text-left px-5 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider">Fotos</th>
                          <th className="text-left px-5 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider">Latencia IA</th>
                          <th className="text-left px-5 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider">Fecha</th>
                          <th className="text-left px-5 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspections.map((insp) => {
                          const sc = statusConfig[insp.status];
                          return (
                            <tr
                              key={insp.id}
                              className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors cursor-pointer"
                              onClick={() => setSelectedInspection(insp)}
                            >
                              <td className="px-5 py-4">
                                <p className="font-bold text-zinc-800">{insp.vehicleMake} {insp.vehicleModel}</p>
                                <p className="text-xs text-zinc-400">{insp.vehicleYear || ""} • {insp.vehicleColor}</p>
                              </td>
                              <td className="px-5 py-4 font-mono font-bold text-zinc-700 tracking-wider text-xs">
                                {insp.vehiclePlate || "—"}
                              </td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${sc.bg} ${sc.color}`}>
                                  {sc.label}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                {insp.confidenceScore ? (
                                  <span className="font-bold text-zinc-700">{(parseFloat(insp.confidenceScore) * 100).toFixed(0)}%</span>
                                ) : (
                                  <span className="text-zinc-300">—</span>
                                )}
                              </td>
                              <td className="px-5 py-4">
                                <span className="font-semibold text-zinc-600">{insp.photos.length}/6</span>
                              </td>
                              <td className="px-5 py-4">
                                {insp.geminiLatencyMs ? (
                                  <span className="text-zinc-600">{(insp.geminiLatencyMs / 1000).toFixed(1)}s</span>
                                ) : (
                                  <span className="text-zinc-300">—</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-xs text-zinc-500">{formatDate(insp.createdAt)}</td>
                              <td className="px-5 py-4">
                                <span className="material-symbols-outlined text-zinc-400 text-lg">chevron_right</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Detail Modal */}
      {selectedInspection && (
        <InspectionDetailModal
          inspection={selectedInspection}
          onClose={() => setSelectedInspection(null)}
          statusConfig={statusConfig}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, bg }: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-xl border border-zinc-200/50 px-4 py-4 space-y-2`}>
      <div className="flex items-center gap-2">
        <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ── User Card ──────────────────────────────────────────────────────────────────

function UserCard({ name, username, role }: { name: string; username: string; role: string }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        role === "admin" ? "bg-[var(--primary)]" : "bg-zinc-700"
      }`}>
        <span className="text-white text-sm font-bold uppercase">{name.charAt(0)}</span>
      </div>
      <div className="flex-1">
        <p className="font-bold text-zinc-800 text-sm">{name}</p>
        <p className="text-xs text-zinc-400">@{username}</p>
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
        role === "admin" ? "bg-red-50 text-red-600 border border-red-200" : "bg-zinc-100 text-zinc-500 border border-zinc-200"
      }`}>
        {role}
      </span>
    </div>
  );
}

// ── Inspection Detail Modal ────────────────────────────────────────────────────

function InspectionDetailModal({
  inspection,
  onClose,
  statusConfig,
  formatDate,
}: {
  inspection: Inspection;
  onClose: () => void;
  statusConfig: Record<string, { label: string; color: string; bg: string }>;
  formatDate: (d: string) => string;
}) {
  const sc = statusConfig[inspection.status];
  const resultData = inspection.resultJson as Record<string, unknown> | null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4 pt-8" onClick={onClose}>
      <div
        className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-4xl animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div>
            <h2 className="text-xl font-bold text-zinc-800">
              {inspection.vehicleMake} {inspection.vehicleModel} {inspection.vehicleYear || ""}
            </h2>
            <p className="text-xs text-zinc-400 mt-1 font-mono">ID: {inspection.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${sc.bg} ${sc.color}`}>
              {sc.label}
            </span>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100 transition-colors">
              <span className="material-symbols-outlined text-zinc-400">close</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto">
          {/* Vehicle Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoCell label="Marca" value={inspection.vehicleMake} icon="precision_manufacturing" />
            <InfoCell label="Modelo" value={inspection.vehicleModel} icon="directions_car" />
            <InfoCell label="Año" value={inspection.vehicleYear?.toString() || "—"} icon="calendar_month" />
            <InfoCell label="Color" value={inspection.vehicleColor} icon="palette" />
            <InfoCell label="Placa" value={inspection.vehiclePlate || "—"} icon="badge" />
            <InfoCell label="Confianza IA" value={inspection.confidenceScore ? `${(parseFloat(inspection.confidenceScore) * 100).toFixed(0)}%` : "—"} icon="psychology" />
            <InfoCell label="Latencia IA" value={inspection.geminiLatencyMs ? `${(inspection.geminiLatencyMs / 1000).toFixed(2)}s` : "—"} icon="speed" />
            <InfoCell label="Creado" value={formatDate(inspection.createdAt)} icon="schedule" />
          </div>

          {/* GPS */}
          {inspection.geolocationLat && inspection.geolocationLng && (
            <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">location_on</span>
                Geolocalización
              </p>
              <p className="font-mono text-sm text-zinc-700">
                {parseFloat(inspection.geolocationLat).toFixed(6)}, {parseFloat(inspection.geolocationLng).toFixed(6)}
              </p>
            </div>
          )}

          {/* Rejection Reasons */}
          {inspection.rejectionReasons && inspection.rejectionReasons.length > 0 && (
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">warning</span>
                Motivos de Rechazo
              </p>
              <ul className="space-y-2">
                {inspection.rejectionReasons.map((r, i) => (
                  <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Photos Grid */}
          <div>
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">photo_library</span>
              Fotografías ({inspection.photos.length}/6)
            </p>
            {inspection.photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {inspection.photos.map((photo) => (
                  <div key={photo.id} className="bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200">
                    <div className="aspect-[4/3] relative">
                      <img
                        src={photo.blobUrl}
                        alt={photo.angleType}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase">
                          {photo.angleType}
                        </span>
                      </div>
                      {photo.aiAngleCorrect !== null && (
                        <div className="absolute top-2 right-2">
                          <span className={`material-symbols-outlined text-lg ${
                            photo.aiAngleCorrect ? "text-emerald-400" : "text-red-400"
                          }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                            {photo.aiAngleCorrect ? "check_circle" : "cancel"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-zinc-500">
                        <span>{photo.widthPx}×{photo.heightPx}</span>
                        <span>{(photo.fileSizeBytes / 1024).toFixed(0)} KB</span>
                      </div>
                      {photo.aiVehiclePresent !== null && (
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${photo.aiVehiclePresent ? "bg-emerald-500" : "bg-red-500"}`} />
                          <span className="text-[10px] text-zinc-500">{photo.aiVehiclePresent ? "Vehículo detectado" : "Sin vehículo"}</span>
                        </div>
                      )}
                      {photo.aiObservations && (
                        <p className="text-[11px] text-zinc-500 leading-relaxed italic">{photo.aiObservations}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-zinc-50 rounded-xl p-8 text-center border border-zinc-200">
                <span className="material-symbols-outlined text-zinc-300 text-3xl">no_photography</span>
                <p className="text-sm text-zinc-400 mt-2">No se han capturado fotos</p>
              </div>
            )}
          </div>

          {/* AI Raw Response */}
          {resultData && (
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                Respuesta completa de IA (Gemini)
              </p>
              <div className="bg-zinc-900 rounded-xl p-4 overflow-x-auto">
                <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap">
                  {JSON.stringify(resultData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Info Cell ──────────────────────────────────────────────────────────────────

function InfoCell({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-zinc-50 rounded-xl px-4 py-3 border border-zinc-200/50">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="material-symbols-outlined text-zinc-400 text-sm">{icon}</span>
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-bold text-zinc-800 truncate">{value}</p>
    </div>
  );
}
