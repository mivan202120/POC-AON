"use client";

import { useState, useMemo } from "react";
import AonLogo from "@/components/AonLogo";

// ── Types ──────────────────────────────────────────────────────────────────────

interface VehicleFormData {
  year: number | null;
  make: string;
  model: string;
  color: string;
  plate: string;
}

type WizardStep = "year" | "make" | "model" | "details";

// ── Brand Definitions ──────────────────────────────────────────────────────────

const POPULAR_BRANDS = [
  { name: "Toyota",     logo: "🚗", color: "#EB0A1E" },
  { name: "Nissan",     logo: "🏎️", color: "#C3002F" },
  { name: "Volkswagen", logo: "🚙", color: "#001E50" },
  { name: "Honda",      logo: "⚡", color: "#CC0000" },
  { name: "Chevrolet",  logo: "🏁", color: "#D4A843" },
  { name: "Ford",       logo: "🔵", color: "#003478" },
  { name: "Hyundai",    logo: "💎", color: "#002C5F" },
  { name: "KIA",        logo: "🔴", color: "#BB162B" },
  { name: "Mazda",      logo: "🌀", color: "#101010" },
  { name: "BMW",        logo: "🔘", color: "#0066B1" },
  { name: "Mercedes",   logo: "⭐", color: "#333333" },
  { name: "Audi",       logo: "🔗", color: "#BB0A30" },
];

const ALL_BRANDS = [
  ...POPULAR_BRANDS.map((b) => b.name),
  "Acura", "Alfa Romeo", "Buick", "Cadillac", "Chrysler", "Dodge", "Fiat",
  "Genesis", "GMC", "Infiniti", "Jaguar", "Jeep", "Land Rover", "Lexus",
  "Lincoln", "Maserati", "Mini", "Mitsubishi", "Peugeot", "Porsche",
  "RAM", "Renault", "SEAT", "Subaru", "Suzuki", "Tesla", "Volvo",
].sort();

// ── Model Suggestions ──────────────────────────────────────────────────────────

const MODEL_SUGGESTIONS: Record<string, string[]> = {
  Toyota: ["Corolla", "Camry", "RAV4", "Hilux", "Yaris", "Avanza", "Prius", "Highlander"],
  Nissan: ["Versa", "Sentra", "March", "Kicks", "X-Trail", "Frontier", "Altima", "Pathfinder"],
  Volkswagen: ["Jetta", "Virtus", "Taos", "Tiguan", "T-Cross", "Polo", "Golf", "Passat"],
  Honda: ["Civic", "CR-V", "HR-V", "City", "Fit", "Accord", "Pilot", "BR-V"],
  Chevrolet: ["Aveo", "Onix", "Tracker", "Cavalier", "Equinox", "Blazer", "Silverado", "Trax"],
  Ford: ["Escape", "Bronco", "Ranger", "Explorer", "Maverick", "Territory", "Mustang", "Edge"],
  Hyundai: ["Tucson", "Creta", "Venue", "Accent", "Elantra", "Santa Fe", "Palisade", "Ioniq"],
  KIA: ["Seltos", "Sportage", "Forte", "Rio", "Sorento", "Soul", "Carnival", "EV6"],
  Mazda: ["3", "CX-5", "CX-30", "CX-50", "CX-3", "CX-9", "6", "MX-5"],
  BMW: ["Serie 3", "Serie 1", "X1", "X3", "X5", "Serie 5", "X2", "iX"],
  Mercedes: ["Clase C", "Clase A", "GLC", "GLA", "GLE", "Clase E", "CLA", "GLS"],
  Audi: ["A3", "A4", "Q3", "Q5", "A1", "Q7", "Q2", "e-tron"],
};

const COLORS = [
  { name: "Blanco",     hex: "#FFFFFF", border: true },
  { name: "Negro",      hex: "#1A1A1A" },
  { name: "Plata",      hex: "#C0C0C0" },
  { name: "Gris",       hex: "#808080" },
  { name: "Rojo",       hex: "#CC0000" },
  { name: "Azul",       hex: "#003399" },
  { name: "Azul Marino",hex: "#001F3F" },
  { name: "Café",       hex: "#6B3A2A" },
  { name: "Verde",      hex: "#2E7D32" },
  { name: "Dorado",     hex: "#B8860B" },
  { name: "Beige",      hex: "#D4C5A9", border: true },
  { name: "Naranja",    hex: "#E65100" },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function VehicleWizard({
  onComplete,
}: {
  onComplete: (data: VehicleFormData) => void;
}) {
  const [step, setStep] = useState<WizardStep>("year");
  const [form, setForm] = useState<VehicleFormData>({
    year: null,
    make: "",
    model: "",
    color: "",
    plate: "",
  });
  const [customModel, setCustomModel] = useState("");
  const [showAllBrands, setShowAllBrands] = useState(false);

  const currentStepIndex = ["year", "make", "model", "details"].indexOf(step);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 30 }, (_, i) => current + 1 - i);
  }, []);

  const models = useMemo(
    () => MODEL_SUGGESTIONS[form.make] || [],
    [form.make]
  );

  // ── Handlers ─────────────────────────────────────────────────────────────

  const selectYear = (year: number) => {
    setForm((f) => ({ ...f, year }));
    setStep("make");
  };

  const selectMake = (make: string) => {
    setForm((f) => ({ ...f, make, model: "" }));
    setCustomModel("");
    setShowAllBrands(false);
    setStep("model");
  };

  const selectModel = (model: string) => {
    setForm((f) => ({ ...f, model }));
    setStep("details");
  };

  const confirmCustomModel = () => {
    if (customModel.trim()) {
      selectModel(customModel.trim());
    }
  };

  const goBack = () => {
    if (step === "make") setStep("year");
    else if (step === "model") setStep("make");
    else if (step === "details") setStep("model");
  };

  const handleFinish = () => {
    if (form.color) {
      onComplete(form);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          {step !== "year" && (
            <button onClick={goBack} className="flex items-center gap-1 text-[var(--secondary)] hover:text-[var(--primary)] transition-colors">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span className="text-xs font-semibold">Atrás</span>
            </button>
          )}
          {step === "year" && <div />}
          <span className="label-industrial text-zinc-400">Paso {currentStepIndex + 1} de 4</span>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-zinc-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  i < currentStepIndex
                    ? "w-full bg-[var(--tertiary)]"
                    : i === currentStepIndex
                    ? "w-full bg-[var(--primary)]"
                    : "w-0"
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 1: Year ──────────────────────────────────────────────── */}
      {step === "year" && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--primary)]/5 rounded-full mb-3">
              <span className="material-symbols-outlined text-[var(--primary)] text-sm">calendar_month</span>
              <span className="label-industrial text-[var(--primary)]">Paso 1</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--on-surface)]">
              ¿De qué año es el vehículo?
            </h2>
            <p className="text-[var(--secondary)] text-sm mt-1">Selecciona el año de fabricación</p>
          </div>

          <div className="grid grid-cols-4 gap-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => selectYear(year)}
                className={`py-3.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  form.year === year
                    ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20 scale-105"
                    : "bg-[var(--surface-container-lowest)] text-[var(--on-surface)] hover:bg-[var(--surface-container)] card-ambient"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 2: Make/Brand ────────────────────────────────────────── */}
      {step === "make" && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--primary)]/5 rounded-full mb-3">
              <span className="material-symbols-outlined text-[var(--primary)] text-sm">precision_manufacturing</span>
              <span className="label-industrial text-[var(--primary)]">Paso 2</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--on-surface)]">
              ¿Cuál es la marca?
            </h2>
            <p className="text-[var(--secondary)] text-sm mt-1">
              Vehículo <span className="font-bold text-[var(--on-surface)]">{form.year}</span>
            </p>
          </div>

          {/* Popular Brands Grid */}
          <div className="grid grid-cols-3 gap-3">
            {POPULAR_BRANDS.map((brand) => (
              <button
                key={brand.name}
                onClick={() => selectMake(brand.name)}
                className="flex flex-col items-center gap-2 py-5 px-3 bg-[var(--surface-container-lowest)] rounded-2xl card-ambient hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-200 group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: brand.color + "12" }}
                >
                  {brand.logo}
                </div>
                <span className="text-xs font-bold text-[var(--on-surface)] tracking-tight">{brand.name}</span>
              </button>
            ))}
          </div>

          {/* More Brands */}
          {!showAllBrands ? (
            <button
              onClick={() => setShowAllBrands(true)}
              className="w-full py-3.5 border-2 border-dashed border-zinc-200 rounded-xl text-sm font-semibold text-[var(--secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">expand_more</span>
              Ver todas las marcas
            </button>
          ) : (
            <div className="space-y-3 p-4 bg-[var(--surface-container-low)] rounded-2xl">
              <p className="label-industrial text-zinc-400">Todas las marcas</p>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {ALL_BRANDS.filter(
                  (b) => !POPULAR_BRANDS.find((pb) => pb.name === b)
                ).map((brand) => (
                  <button
                    key={brand}
                    onClick={() => selectMake(brand)}
                    className="px-4 py-2 bg-[var(--surface-container-lowest)] rounded-lg text-xs font-bold text-[var(--on-surface)] hover:bg-[var(--primary)] hover:text-white transition-all card-ambient"
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Model ─────────────────────────────────────────────── */}
      {step === "model" && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--primary)]/5 rounded-full mb-3">
              <span className="material-symbols-outlined text-[var(--primary)] text-sm">directions_car</span>
              <span className="label-industrial text-[var(--primary)]">Paso 3</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--on-surface)]">
              ¿Cuál es el modelo?
            </h2>
            <p className="text-[var(--secondary)] text-sm mt-1">
              <span className="font-bold text-[var(--on-surface)]">{form.make}</span> • {form.year}
            </p>
          </div>

          {/* Model Suggestions */}
          {models.length > 0 && (
            <div className="space-y-3">
              <p className="label-industrial text-zinc-400">Modelos populares de {form.make}</p>
              <div className="grid grid-cols-2 gap-3">
                {models.map((model) => (
                  <button
                    key={model}
                    onClick={() => selectModel(model)}
                    className="py-4 px-4 bg-[var(--surface-container-lowest)] rounded-xl text-sm font-bold text-[var(--on-surface)] card-ambient hover:shadow-md hover:bg-[var(--primary)] hover:text-white active:scale-95 transition-all duration-200 text-left"
                  >
                    {model}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Model Input */}
          <div className="space-y-3">
            <p className="label-industrial text-zinc-400">
              {models.length > 0 ? "¿No encuentras tu modelo?" : "Escribe el modelo"}
            </p>
            <div className="flex gap-3">
              <div className="flex-1 relative bg-[var(--surface-container-lowest)] rounded-xl ring-1 ring-zinc-200 focus-within:ring-2 focus-within:ring-[var(--primary)] transition-all">
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmCustomModel()}
                  placeholder="Ej: Corolla Cross"
                  className="w-full px-4 py-4 bg-transparent outline-none text-sm font-medium placeholder:text-zinc-400"
                />
              </div>
              <button
                onClick={confirmCustomModel}
                disabled={!customModel.trim()}
                className={`px-5 rounded-xl font-bold text-sm transition-all ${
                  customModel.trim()
                    ? "bg-[var(--on-surface)] text-white hover:opacity-90"
                    : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Color + Plate ─────────────────────────────────────── */}
      {step === "details" && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--primary)]/5 rounded-full mb-3">
              <span className="material-symbols-outlined text-[var(--primary)] text-sm">palette</span>
              <span className="label-industrial text-[var(--primary)]">Paso 4</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--on-surface)]">
              Color y placa
            </h2>
            <p className="text-[var(--secondary)] text-sm mt-1">
              <span className="font-bold text-[var(--on-surface)]">{form.make} {form.model}</span> • {form.year}
            </p>
          </div>

          {/* Summary Card */}
          <div className="bg-[var(--surface-container-lowest)] rounded-2xl p-5 card-ambient flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[var(--primary)]/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-[var(--primary)] text-3xl">directions_car</span>
            </div>
            <div>
              <p className="font-bold text-lg text-[var(--on-surface)] leading-tight">{form.make} {form.model}</p>
              <p className="text-sm text-[var(--secondary)]">Año {form.year}</p>
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-3">
            <label className="label-industrial text-zinc-500 flex items-center gap-1.5">
              Color exterior <span className="text-[var(--primary)]">*</span>
            </label>
            <div className="grid grid-cols-4 gap-3">
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setForm((f) => ({ ...f, color: c.name }))}
                  className={`flex flex-col items-center gap-2 py-3 rounded-xl transition-all duration-200 ${
                    form.color === c.name
                      ? "bg-[var(--surface-container-lowest)] ring-2 ring-[var(--primary)] shadow-md scale-105"
                      : "hover:bg-[var(--surface-container-low)]"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full shadow-inner ${
                      c.border ? "border-2 border-zinc-200" : ""
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight text-center">
                    {c.name}
                  </span>
                  {form.color === c.name && (
                    <span className="material-symbols-outlined text-[var(--primary)] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Plate Input */}
          <div className="space-y-2">
            <label htmlFor="plate" className="label-industrial text-zinc-500 flex items-center gap-1.5">
              Placa vehicular <span className="text-zinc-300 text-[9px]">(opcional)</span>
            </label>
            <div className="relative bg-[var(--surface-container-lowest)] rounded-xl ring-1 ring-zinc-200 focus-within:ring-2 focus-within:ring-[var(--primary)] transition-all">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <span className="material-symbols-outlined text-zinc-400 text-xl">badge</span>
              </div>
              <input
                id="plate"
                type="text"
                value={form.plate}
                onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value.toUpperCase() }))}
                placeholder="ABC-123-D"
                className="w-full pl-12 pr-4 py-4 bg-transparent outline-none text-sm font-mono font-bold tracking-wider uppercase placeholder:text-zinc-400 placeholder:font-normal placeholder:tracking-normal"
              />
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              onClick={handleFinish}
              disabled={!form.color}
              className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all duration-300 flex items-center justify-center gap-3 ${
                form.color
                  ? "btn-primary"
                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              }`}
            >
              <span className="material-symbols-outlined text-xl">photo_camera</span>
              <span>Generar Inspección</span>
            </button>
          </div>

          {/* Info */}
          <div className="flex items-start gap-3 p-4 bg-[var(--surface-container-low)] rounded-xl">
            <span className="material-symbols-outlined text-[var(--tertiary)] text-xl mt-0.5">info</span>
            <p className="text-xs text-[var(--secondary)] leading-relaxed">
              Se generará un enlace para tomar <strong>6 fotos guiadas</strong> del vehículo.
              La IA verificará que las fotos coincidan con los datos registrados.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
