"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AonLogo from "@/components/AonLogo";

// ── Types ──────────────────────────────────────────────────────────────────────

type Section = "dashboard" | "users" | "validations";

interface PlatformUser {
  id: string;
  username: string;
  displayName: string;
  role: "admin" | "user";
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

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
  createdByUsername: string | null;
  createdByName: string | null;
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

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  APPROVED: { label: "Aprobado", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: "check_circle" },
  REJECTED: { label: "Rechazado", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: "cancel" },
  PENDING: { label: "Pendiente", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: "hourglass_top" },
  PROCESSING: { label: "En proceso", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: "sync" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatShortDate(d: string) {
  return new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function AdminDashboard() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [section, setSection] = useState<Section>("dashboard");
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
    if (!isLoading && user && user.role !== "admin") router.push("/");
  }, [user, isLoading, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [inspRes, usersRes] = await Promise.all([
        fetch("/api/admin/inspections"),
        fetch("/api/admin/users"),
      ]);
      if (inspRes.ok) {
        const d = await inspRes.json();
        setStats(d.stats);
        setInspections(d.inspections);
      }
      if (usersRes.ok) {
        const d = await usersRes.json();
        setUsers(d.users);
      }
    } catch { /* silent */ } finally {
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

  const NAV_ITEMS: { key: Section; icon: string; label: string }[] = [
    { key: "dashboard", icon: "dashboard", label: "Dashboard" },
    { key: "users", icon: "group", label: "Usuarios" },
    { key: "validations", icon: "fact_check", label: "Validaciones" },
  ];

  return (
    <div className="min-h-dvh flex bg-zinc-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-zinc-900 text-white flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <AonLogo height={24} className="brightness-0 invert" />
            <div className="h-5 w-px bg-white/20" />
            <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Admin</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => { setSection(item.key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                section === item.key
                  ? "bg-white/10 text-white shadow-lg shadow-white/5"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={section === item.key ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.key === "validations" && inspections.length > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                  {inspections.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-3 pb-6 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
              <p className="text-[10px] text-white/40">@{user.username}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-dvh overflow-x-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-zinc-100 transition-colors">
                <span className="material-symbols-outlined text-zinc-600">menu</span>
              </button>
              <h1 className="text-lg font-bold text-zinc-800 tracking-tight">
                {NAV_ITEMS.find((n) => n.key === section)?.label}
              </h1>
            </div>
            <button onClick={fetchData} className="p-2 rounded-lg hover:bg-zinc-100 transition-colors" title="Actualizar">
              <span className="material-symbols-outlined text-zinc-500 text-xl">refresh</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <svg className="w-8 h-8 animate-spin text-red-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <>
              {section === "dashboard" && <DashboardSection stats={stats} inspections={inspections} users={users} />}
              {section === "users" && <UsersSection users={users} onRefresh={fetchData} />}
              {section === "validations" && <ValidationsSection inspections={inspections} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD SECTION
// ══════════════════════════════════════════════════════════════════════════════

function DashboardSection({ stats, inspections, users }: { stats: Stats | null; inspections: Inspection[]; users: PlatformUser[] }) {
  if (!stats) return null;

  const recentInspections = inspections.slice(0, 5);

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-800 tracking-tight">Bienvenido, Administrador</h2>
        <p className="text-sm text-zinc-500 mt-1">Resumen del sistema de inspección vehicular AON</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon="assignment" label="Total Inspecciones" value={stats.total} color="text-zinc-800" border="border-zinc-200" />
        <KPICard icon="check_circle" label="Aprobadas" value={stats.approved} color="text-emerald-600" border="border-emerald-200" accent="bg-emerald-50" />
        <KPICard icon="cancel" label="Rechazadas" value={stats.rejected} color="text-red-600" border="border-red-200" accent="bg-red-50" />
        <KPICard icon="hourglass_top" label="Pendientes" value={stats.pending + stats.processing} color="text-amber-600" border="border-amber-200" accent="bg-amber-50" />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPICard icon="photo_library" label="Fotos Capturadas" value={stats.totalPhotos} color="text-violet-600" border="border-violet-200" accent="bg-violet-50" />
        <KPICard icon="speed" label="Latencia Promedio IA" value={stats.avgLatencyMs ? `${(stats.avgLatencyMs / 1000).toFixed(1)}s` : "—"} color="text-indigo-600" border="border-indigo-200" accent="bg-indigo-50" />
        <KPICard icon="group" label="Usuarios" value={users.length} color="text-sky-600" border="border-sky-200" accent="bg-sky-50" />
      </div>

      {/* Approval Rate Bar */}
      {stats.total > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h3 className="text-sm font-bold text-zinc-700 mb-4">Tasa de Aprobación</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-4 bg-zinc-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(stats.approved / stats.total) * 100}%` }} />
              <div className="h-full bg-red-500 transition-all" style={{ width: `${(stats.rejected / stats.total) * 100}%` }} />
              <div className="h-full bg-amber-400 transition-all" style={{ width: `${((stats.pending + stats.processing) / stats.total) * 100}%` }} />
            </div>
            <span className="text-2xl font-bold text-emerald-600">{stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(0) : 0}%</span>
          </div>
          <div className="flex gap-6 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-zinc-500"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Aprobados</span>
            <span className="flex items-center gap-1.5 text-xs text-zinc-500"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />Rechazados</span>
            <span className="flex items-center gap-1.5 text-xs text-zinc-500"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" />Pendientes</span>
          </div>
        </div>
      )}

      {/* Recent Inspections */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-700">Inspecciones Recientes</h3>
          <span className="text-xs text-zinc-400">Últimas 5</span>
        </div>
        {recentInspections.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-zinc-300 text-4xl">search_off</span>
            <p className="text-sm text-zinc-400 mt-2">Sin inspecciones todavía</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {recentInspections.map((insp) => {
              const sc = STATUS_CONFIG[insp.status];
              return (
                <div key={insp.id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-zinc-500 text-xl">directions_car</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-800">{insp.vehicleMake} {insp.vehicleModel}</p>
                      <p className="text-xs text-zinc-400">{insp.vehiclePlate || "Sin placa"} • {formatShortDate(insp.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${sc.bg} ${sc.color}`}>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{sc.icon}</span>
                    {sc.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, color, border, accent }: { icon: string; label: string; value: string | number; color: string; border: string; accent?: string }) {
  return (
    <div className={`bg-white rounded-2xl border ${border} p-5 ${accent || ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`material-symbols-outlined text-lg ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// USERS SECTION
// ══════════════════════════════════════════════════════════════════════════════

function UsersSection({ users, onRefresh }: { users: PlatformUser[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<PlatformUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [formUsername, setFormUsername] = useState("");
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"admin" | "user">("user");
  const [formError, setFormError] = useState("");

  const openCreate = () => {
    setEditUser(null);
    setFormUsername("");
    setFormDisplayName("");
    setFormPassword("");
    setFormRole("user");
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (u: PlatformUser) => {
    setEditUser(u);
    setFormUsername(u.username);
    setFormDisplayName(u.displayName);
    setFormPassword("");
    setFormRole(u.role);
    setFormError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError("");
    try {
      if (editUser) {
        // Update
        const body: Record<string, unknown> = { id: editUser.id };
        if (formUsername !== editUser.username) body.username = formUsername;
        if (formDisplayName !== editUser.displayName) body.displayName = formDisplayName;
        if (formPassword) body.password = formPassword;
        if (formRole !== editUser.role) body.role = formRole;

        const res = await fetch("/api/admin/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Error al actualizar");
        }
      } else {
        // Create
        if (!formPassword) { setFormError("Contraseña requerida"); setSaving(false); return; }
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: formUsername, password: formPassword, displayName: formDisplayName, role: formRole }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Error al crear");
        }
      }
      setShowModal(false);
      onRefresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
    setDeleting(id);
    try {
      await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      onRefresh();
    } catch { /* silent */ } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-800 tracking-tight">Gestión de Usuarios</h2>
          <p className="text-sm text-zinc-500 mt-1">{users.length} usuarios registrados en la plataforma</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20">
          <span className="material-symbols-outlined text-lg">person_add</span>
          Nuevo Usuario
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="text-left px-6 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider">Usuario</th>
                <th className="text-left px-6 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider">Nombre</th>
                <th className="text-left px-6 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider">Rol</th>
                <th className="text-left px-6 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider">Estado</th>
                <th className="text-left px-6 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider">Creado</th>
                <th className="text-right px-6 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${u.role === "admin" ? "bg-red-600" : "bg-zinc-700"}`}>
                        <span className="text-white text-xs font-bold uppercase">{u.displayName.charAt(0)}</span>
                      </div>
                      <span className="font-mono text-zinc-700 font-semibold">@{u.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-zinc-800">{u.displayName}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      u.role === "admin" ? "bg-red-50 text-red-600 border-red-200" : "bg-zinc-100 text-zinc-500 border-zinc-200"
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${u.isActive ? "text-emerald-600" : "text-zinc-400"}`}>
                      <span className={`w-2 h-2 rounded-full ${u.isActive ? "bg-emerald-500" : "bg-zinc-300"}`} />
                      {u.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-500">{formatShortDate(u.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(u)} className="p-2 rounded-lg hover:bg-zinc-100 transition-colors" title="Editar">
                        <span className="material-symbols-outlined text-zinc-500 text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={deleting === u.id}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <span className="material-symbols-outlined text-red-400 text-lg">
                          {deleting === u.id ? "hourglass_top" : "delete"}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
              <h3 className="font-bold text-lg text-zinc-800">{editUser ? "Editar Usuario" : "Nuevo Usuario"}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-zinc-100 transition-colors">
                <span className="material-symbols-outlined text-zinc-400">close</span>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nombre de usuario</label>
                <input value={formUsername} onChange={(e) => setFormUsername(e.target.value)} placeholder="ej: juan.perez"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-800 outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nombre completo</label>
                <input value={formDisplayName} onChange={(e) => setFormDisplayName(e.target.value)} placeholder="ej: Juan Pérez"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-800 outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Contraseña {editUser && <span className="text-zinc-400 normal-case tracking-normal">(dejar vacío para no cambiar)</span>}
                </label>
                <input value={formPassword} onChange={(e) => setFormPassword(e.target.value)} type="password" placeholder="••••••"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-800 outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Rol</label>
                <div className="flex gap-3">
                  {(["user", "admin"] as const).map((r) => (
                    <button key={r} type="button" onClick={() => setFormRole(r)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                        formRole === r
                          ? r === "admin" ? "border-red-500 bg-red-50 text-red-700" : "border-zinc-700 bg-zinc-50 text-zinc-800"
                          : "border-zinc-200 text-zinc-400 hover:border-zinc-300"
                      }`}
                    >
                      {r === "admin" ? "Administrador" : "Usuario"}
                    </button>
                  ))}
                </div>
              </div>
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
                  <span className="material-symbols-outlined text-red-500 text-lg">error</span>
                  <span className="text-sm font-semibold text-red-700">{formError}</span>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-zinc-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !formUsername || !formDisplayName}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <span className="material-symbols-outlined text-lg">save</span>
                )}
                {editUser ? "Guardar Cambios" : "Crear Usuario"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VALIDATIONS SECTION
// ══════════════════════════════════════════════════════════════════════════════

function ValidationsSection({ inspections }: { inspections: Inspection[] }) {
  const [selected, setSelected] = useState<Inspection | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const filtered = filterStatus === "ALL" ? inspections : inspections.filter((i) => i.status === filterStatus);

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-800 tracking-tight">Validaciones</h2>
          <p className="text-sm text-zinc-500 mt-1">{filtered.length} registro{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["ALL", "APPROVED", "REJECTED", "PENDING", "PROCESSING"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                filterStatus === s ? "bg-zinc-800 text-white border-zinc-800" : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300"
              }`}>
              {s === "ALL" ? "Todos" : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <span className="material-symbols-outlined text-zinc-300 text-5xl">search_off</span>
          <p className="text-zinc-500 font-medium mt-4">No hay validaciones con este filtro</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="text-left px-5 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider">ID</th>
                  <th className="text-left px-5 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider">Usuario</th>
                  <th className="text-left px-5 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider">Vehículo</th>
                  <th className="text-left px-5 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider">Placa</th>
                  <th className="text-left px-5 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider">Estado</th>
                  <th className="text-left px-5 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider">Confianza</th>
                  <th className="text-left px-5 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider">Fotos</th>
                  <th className="text-left px-5 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider">Latencia IA</th>
                  <th className="text-left px-5 py-3 font-bold text-zinc-500 text-[11px] uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((insp) => {
                  const sc = STATUS_CONFIG[insp.status];
                  return (
                    <tr key={insp.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors cursor-pointer" onClick={() => setSelected(insp)}>
                      <td className="px-5 py-4 font-mono text-xs text-zinc-400">{insp.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-5 py-4">
                        {insp.createdByName ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-zinc-600 uppercase">{insp.createdByName.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-zinc-700 leading-none">{insp.createdByName}</p>
                              <p className="text-[10px] text-zinc-400">@{insp.createdByUsername}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-zinc-800">{insp.vehicleMake} {insp.vehicleModel}</p>
                        <p className="text-[11px] text-zinc-400">{insp.vehicleYear || ""} • {insp.vehicleColor}</p>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-zinc-700 tracking-wider text-xs">{insp.vehiclePlate || "—"}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${sc.bg} ${sc.color}`}>
                          <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>{sc.icon}</span>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">{insp.confidenceScore ? <span className="font-bold text-zinc-700">{(parseFloat(insp.confidenceScore) * 100).toFixed(0)}%</span> : <span className="text-zinc-300">—</span>}</td>
                      <td className="px-5 py-4"><span className="font-semibold text-zinc-600">{insp.photos.length}/6</span></td>
                      <td className="px-5 py-4">{insp.geminiLatencyMs ? <span className="text-zinc-600">{(insp.geminiLatencyMs / 1000).toFixed(1)}s</span> : <span className="text-zinc-300">—</span>}</td>
                      <td className="px-5 py-4 text-xs text-zinc-500">{formatDate(insp.createdAt)}</td>
                      <td className="px-5 py-4"><span className="material-symbols-outlined text-zinc-400 text-lg">chevron_right</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && <ValidationDetailModal inspection={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ── Validation Detail Modal ────────────────────────────────────────────────────

function ValidationDetailModal({ inspection, onClose }: { inspection: Inspection; onClose: () => void }) {
  const sc = STATUS_CONFIG[inspection.status];
  const resultData = inspection.resultJson;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4 pt-8" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-4xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div>
            <h2 className="text-xl font-bold text-zinc-800">{inspection.vehicleMake} {inspection.vehicleModel} {inspection.vehicleYear || ""}</h2>
            <p className="text-xs text-zinc-400 mt-1 font-mono">ID: {inspection.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border ${sc.bg} ${sc.color}`}>
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{sc.icon}</span>
              {sc.label}
            </span>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100 transition-colors">
              <span className="material-symbols-outlined text-zinc-400">close</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto">
          {/* Info Grid */}
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

          {/* Photos */}
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
                      <img src={photo.blobUrl} alt={photo.angleType} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2">
                        <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase">{photo.angleType}</span>
                      </div>
                      {photo.aiAngleCorrect !== null && (
                        <div className="absolute top-2 right-2">
                          <span className={`material-symbols-outlined text-lg ${photo.aiAngleCorrect ? "text-emerald-400" : "text-red-400"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
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
                      {photo.aiObservations && <p className="text-[11px] text-zinc-500 leading-relaxed italic">{photo.aiObservations}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-zinc-50 rounded-xl p-8 text-center border border-zinc-200">
                <span className="material-symbols-outlined text-zinc-300 text-3xl">no_photography</span>
                <p className="text-sm text-zinc-400 mt-2">Sin fotos capturadas</p>
              </div>
            )}
          </div>

          {/* AI Response */}
          {resultData && (
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                Respuesta completa de IA (Gemini 2.5 Flash)
              </p>
              <div className="bg-zinc-900 rounded-xl p-4 overflow-x-auto">
                <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap">{JSON.stringify(resultData, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
