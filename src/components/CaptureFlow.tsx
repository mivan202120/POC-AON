"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface VehicleData {
  make: string;
  model: string;
  color: string;
  plate?: string;
  year?: number;
}

interface PhotoData {
  blob: Blob;
  url: string;
  timestamp: string;
  width: number;
  height: number;
  lat?: number;
  lng?: number;
}

interface InspectionResult {
  inspection_id: string;
  status: "APPROVED" | "REJECTED";
  confidence_score: number;
  vehicle_detected: {
    make: string;
    model: string;
    color: string;
    year_estimate: string;
    body_type: string;
  };
  declared_data_match: {
    make_match: boolean;
    model_match: boolean;
    color_match: boolean;
  };
  rejection_reasons: string[];
  recommendations: string[];
  odometer_reading: string | null;
  vin_extracted: string | null;
  latency_ms: number;
}

type Screen = "welcome" | "capture" | "review" | "processing" | "result";

const ANGLES = [
  { key: "FRONTAL", label: "Frontal", desc: "Vista completa del frente. Placa delantera visible." },
  { key: "REAR", label: "Trasera", desc: "Vista completa trasera. Placa trasera visible." },
  { key: "LEFT", label: "Lateral Izq", desc: "Costado izquierdo completo con ambas puertas." },
  { key: "RIGHT", label: "Lateral Der", desc: "Costado derecho completo con ambas puertas." },
  { key: "DASHBOARD", label: "Tablero", desc: "Tablero con odómetro visible. Vehículo encendido." },
  { key: "VIN", label: "VIN", desc: "Número de serie en placa del chasis o parabrisas." },
];

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CaptureFlow({
  inspectionId,
  token,
  vehicle,
}: {
  inspectionId: string;
  token: string;
  vehicle: VehicleData;
}) {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [currentAngle, setCurrentAngle] = useState(0);
  const [photos, setPhotos] = useState<(PhotoData | null)[]>(Array(6).fill(null));
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [geoPosition, setGeoPosition] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── Camera Control ─────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraPermission(true);
    } catch {
      setError("No se pudo acceder a la cámara. Verifica los permisos.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // ── Geolocation ────────────────────────────────────────────────────────────

  const requestLocation = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocationPermission(true);
      },
      () => {
        // Location not required but tracked
        setLocationPermission(false);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  // ── Photo Capture ──────────────────────────────────────────────────────────

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");

    // Resize to max 1200px on the longest side
    const maxDim = 1200;
    let w = video.videoWidth;
    let h = video.videoHeight;
    if (w > h && w > maxDim) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    } else if (h > maxDim) {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const newPhotos = [...photos];
        newPhotos[currentAngle] = {
          blob,
          url,
          timestamp: new Date().toISOString(),
          width: w,
          height: h,
          lat: geoPosition?.lat,
          lng: geoPosition?.lng,
        };
        setPhotos(newPhotos);

        // Auto-advance to next angle or review
        if (currentAngle < 5) {
          setCurrentAngle(currentAngle + 1);
        } else {
          stopCamera();
          setScreen("review");
        }
      },
      "image/jpeg",
      0.85
    );
  }, [photos, currentAngle, geoPosition, stopCamera]);

  // ── Retake Photo ───────────────────────────────────────────────────────────

  const retakePhoto = useCallback(
    async (index: number) => {
      setCurrentAngle(index);
      setScreen("capture");
      await startCamera();
    },
    [startCamera]
  );

  // ── Submit Photos ──────────────────────────────────────────────────────────

  const submitPhotos = useCallback(async () => {
    setScreen("processing");
    setError(null);

    try {
      const formData = new FormData();

      // Add photos
      for (let i = 0; i < 6; i++) {
        const photo = photos[i];
        if (!photo) throw new Error(`Falta la foto ${i + 1}`);
        formData.append(`photos[${i}]`, photo.blob, `photo_${i}.jpg`);
      }

      // Add metadata
      const metadata = {
        photos: photos.map((p) => ({
          timestamp: p!.timestamp,
          lat: p!.lat,
          lng: p!.lng,
          width: p!.width,
          height: p!.height,
        })),
        user_agent: navigator.userAgent,
        geolocation: geoPosition,
      };
      formData.append("metadata", JSON.stringify(metadata));

      const response = await fetch(`/api/v1/inspections/${inspectionId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Error al procesar las fotos");
      }

      const data = await response.json();
      setResult(data);
      setScreen("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setScreen("review");
    }
  }, [photos, inspectionId, token, geoPosition]);

  // ── Start Inspection ───────────────────────────────────────────────────────

  const startInspection = useCallback(async () => {
    requestLocation();
    await startCamera();
    setScreen("capture");
  }, [requestLocation, startCamera]);

  // ── Restart ────────────────────────────────────────────────────────────────

  const restart = useCallback(() => {
    setPhotos(Array(6).fill(null));
    setCurrentAngle(0);
    setResult(null);
    setError(null);
    setScreen("welcome");
  }, []);

  // ── Cleanup ────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh flex flex-col">
      {screen === "welcome" && (
        <WelcomeScreen
          vehicle={vehicle}
          inspectionId={inspectionId}
          cameraPermission={cameraPermission}
          locationPermission={locationPermission}
          onStart={startInspection}
        />
      )}
      {screen === "capture" && (
        <CaptureScreen
          videoRef={videoRef}
          angle={ANGLES[currentAngle]}
          angleIndex={currentAngle}
          onCapture={capturePhoto}
          inspectionId={inspectionId}
          locationActive={locationPermission}
        />
      )}
      {screen === "review" && (
        <ReviewScreen
          photos={photos}
          onRetake={retakePhoto}
          onSubmit={submitPhotos}
          error={error}
        />
      )}
      {screen === "processing" && <ProcessingScreen />}
      {screen === "result" && result && (
        <ResultScreen result={result} onRestart={restart} vehicle={vehicle} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 1: Welcome
// ══════════════════════════════════════════════════════════════════════════════

function WelcomeScreen({
  vehicle,
  inspectionId,
  onStart,
}: {
  vehicle: VehicleData;
  inspectionId: string;
  cameraPermission: boolean;
  locationPermission: boolean;
  onStart: () => void;
}) {
  return (
    <>
      <header className="sticky top-0 w-full z-50 glass-header border-b border-zinc-200/50 flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[var(--primary)]">analytics</span>
          <span className="text-lg font-black tracking-tighter text-[var(--primary)] uppercase">
            {inspectionId.slice(0, 8).toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-1.5 w-16 bg-[var(--surface-container)] rounded-full overflow-hidden">
            <div className="h-full w-1/4 bg-[var(--primary-container)]" />
          </div>
          <span className="label-industrial text-zinc-500">PASO 1 DE 4</span>
        </div>
      </header>

      <main className="flex-grow px-6 pt-14 pb-20 max-w-lg mx-auto w-full">
        <section className="mb-12">
          <h1 className="display-editorial text-[var(--on-surface)] mb-4">
            Confirmación del<br />Vehículo
          </h1>
          <p className="text-zinc-500 font-medium">
            Confirma que estos son los datos de tu vehículo
          </p>
        </section>

        <section className="mb-10">
          <div className="bg-[var(--surface-container-lowest)] rounded-xl p-6 card-ambient border border-[var(--outline-variant)]/10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="label-industrial text-[var(--primary)] block mb-1">VEHÍCULO ASIGNADO</span>
                <h2 className="text-2xl font-bold tracking-tight">
                  {vehicle.make} {vehicle.model} {vehicle.year || ""}
                </h2>
              </div>
              <span className="material-symbols-outlined text-zinc-300">directions_car</span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-[var(--surface-container)]">
              <div>
                <span className="label-industrial text-zinc-400 block">COLOR</span>
                <span className="text-lg font-bold">{vehicle.color}</span>
              </div>
              {vehicle.plate && (
                <div className="text-right">
                  <span className="label-industrial text-zinc-400 block">PLACA</span>
                  <span className="text-xl font-mono font-bold tracking-wider">{vehicle.plate}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4 mb-12">
          <span className="label-industrial text-zinc-500 block mb-2">PERMISOS REQUERIDOS</span>
          <div className="flex items-center justify-between p-4 bg-[var(--surface-container-low)] rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--surface-container-lowest)] flex items-center justify-center card-ambient">
                <span className="material-symbols-outlined text-zinc-600">photo_camera</span>
              </div>
              <span className="font-semibold text-zinc-800">Cámara</span>
            </div>
            <span className="material-symbols-outlined text-[var(--tertiary)]">check_circle</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-[var(--surface-container-low)] rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--surface-container-lowest)] flex items-center justify-center card-ambient">
                <span className="material-symbols-outlined text-zinc-600">location_on</span>
              </div>
              <span className="font-semibold text-zinc-800">Ubicación</span>
            </div>
            <span className="material-symbols-outlined text-[var(--tertiary)]">check_circle</span>
          </div>
        </section>

        <section className="space-y-6">
          <button onClick={onStart} className="btn-primary w-full">
            Iniciar Inspección
          </button>
          <div className="flex items-center justify-center gap-2 text-zinc-400">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span className="label-industrial">Tiempo estimado: 3 minutos</span>
          </div>
        </section>
      </main>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 2: Camera Capture
// ══════════════════════════════════════════════════════════════════════════════

function CaptureScreen({
  videoRef,
  angle,
  angleIndex,
  onCapture,
  inspectionId,
  locationActive,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  angle: (typeof ANGLES)[0];
  angleIndex: number;
  onCapture: () => void;
  inspectionId: string;
  locationActive: boolean;
}) {
  return (
    <div className="bg-zinc-950 text-white min-h-dvh flex flex-col overflow-hidden">
      <header className="sticky top-0 w-full z-50 glass-header-dark border-b border-white/10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">analytics</span>
            <span className="font-semibold tracking-tight">{inspectionId.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex gap-1.5">
            {ANGLES.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i < angleIndex
                    ? "bg-red-600"
                    : i === angleIndex
                    ? "bg-red-600 ring-4 ring-red-600/20"
                    : "bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="px-6 pb-3">
          <span className="label-industrial text-red-500">
            Foto {angleIndex + 1} de 6: {angle.label.toUpperCase()}
          </span>
        </div>
      </header>

      <main className="relative flex-1 flex flex-col items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
          <div className="relative w-[85%] aspect-[4/3] max-w-md">
            <div className="corner-guide top-0 left-0 border-t border-l rounded-tl-xl" />
            <div className="corner-guide top-0 right-0 border-t border-r rounded-tr-xl" />
            <div className="corner-guide bottom-0 left-0 border-b border-l rounded-bl-xl" />
            <div className="corner-guide bottom-0 right-0 border-b border-r rounded-br-xl" />
          </div>

          {locationActive && (
            <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-xl rounded-full border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="label-industrial text-white/90 text-[10px]">📍 Ubicación activa</span>
            </div>
          )}
        </div>
      </main>

      <section className="bg-zinc-950 px-8 pt-8 pb-10 flex flex-col items-center z-20">
        <div className="text-center mb-8 max-w-xs">
          <p className="text-white text-sm font-medium leading-relaxed tracking-tight">
            {angle.desc}
          </p>
        </div>
        <div className="w-full flex items-center justify-between">
          <div className="w-10" />
          <button onClick={onCapture} className="relative flex items-center justify-center group">
            <div className="absolute inset-0 bg-red-600/20 rounded-full scale-125 group-active:scale-110 transition-transform" />
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#eb0017] to-[#bc0010] p-1 shadow-2xl flex items-center justify-center group-active:scale-90 transition-transform duration-200 capture-btn-glow">
              <div className="w-full h-full rounded-full border-4 border-white/20" />
            </div>
          </button>
          <div className="w-10" />
        </div>
      </section>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 3: Photo Review
// ══════════════════════════════════════════════════════════════════════════════

function ReviewScreen({
  photos,
  onRetake,
  onSubmit,
  error,
}: {
  photos: (PhotoData | null)[];
  onRetake: (index: number) => void;
  onSubmit: () => void;
  error: string | null;
}) {
  const allPhotos = photos.every((p) => p !== null);

  return (
    <>
      <header className="sticky top-0 w-full z-50 bg-white border-b border-zinc-200/30 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-xl leading-none">Revisa tus fotos</h1>
            <p className="label-industrial text-[var(--secondary)] mt-1">Verificación visual</p>
          </div>
          <div className="text-[10px] font-black text-[var(--primary)] uppercase tracking-tighter">
            AON INSPECTION
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-8 pb-48">
        <section className="mb-10">
          <span className="label-industrial text-[var(--primary)] block mb-2">Verificación de Vehículo</span>
          <h2 className="text-3xl font-bold tracking-tight mb-3">Inspección Visual</h2>
          <p className="text-[var(--secondary)] text-sm leading-relaxed max-w-sm">
            Confirma que las capturas sean nítidas y muestren claramente los detalles solicitados.
          </p>
        </section>

        {error && (
          <div className="mb-6 p-4 bg-[var(--error-container)] rounded-xl border-l-4 border-[var(--error)]">
            <p className="text-[var(--on-error-container)] text-sm font-semibold">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {ANGLES.map((angle, i) => (
            <div key={i} className="bg-white p-2 rounded-lg card-ambient border border-zinc-200/20">
              <div className="relative aspect-[4/5] bg-zinc-100 rounded overflow-hidden mb-3">
                {photos[i] ? (
                  <>
                    <img
                      alt={angle.label}
                      className="w-full h-full object-cover"
                      src={photos[i]!.url}
                    />
                    <div className="absolute top-2 right-2 bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                      <span
                        className="material-symbols-outlined text-sm"
                        style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}
                      >
                        check
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300">
                    <span className="material-symbols-outlined text-4xl">photo_camera</span>
                  </div>
                )}
              </div>
              <div className="px-1">
                <p className="label-industrial text-[var(--secondary)] mb-2">{angle.label.toUpperCase()}</p>
                <button
                  onClick={() => onRetake(i)}
                  className="w-full py-2 border border-zinc-200 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-50 transition-colors rounded"
                >
                  Retomar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-zinc-100/80 p-5 rounded border border-zinc-200/20">
          <div className="flex gap-4 items-start">
            <span className="material-symbols-outlined text-[var(--primary)]">psychology</span>
            <div>
              <h3 className="label-industrial text-[var(--on-surface)] mb-1">
                Análisis por Inteligencia Artificial
              </h3>
              <p className="text-[var(--secondary)] text-xs leading-relaxed">
                Las fotos serán analizadas para detectar inconsistencias automáticamente.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 w-full bg-white border-t border-zinc-200/30 z-50 px-6 pt-4 pb-8">
        <button
          onClick={onSubmit}
          disabled={!allPhotos}
          className={`w-full py-4 rounded-lg font-bold uppercase tracking-widest text-sm transition-all ${
            allPhotos
              ? "btn-primary"
              : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
          }`}
        >
          Enviar para Validación
        </button>
      </footer>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 4: Processing
// ══════════════════════════════════════════════════════════════════════════════

function ProcessingScreen() {
  const steps = [
    { label: "Fotos recibidas", status: "done" },
    { label: "Verificando vehículo", status: "done" },
    { label: "Comparando datos declarados", status: "active" },
  ];

  return (
    <>
      <header className="sticky top-0 w-full z-50 glass-header border-b border-zinc-200/50 px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[var(--primary)]">analytics</span>
          <span className="label-industrial text-zinc-400">Inspección en curso</span>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md flex flex-col items-center text-center space-y-12">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-40 h-40 rounded-full border-2 border-[var(--primary)]/10 animate-ping-slow" />
            <div className="relative w-32 h-32 rounded-full flex items-center justify-center bg-[var(--surface-container-lowest)] card-ambient">
              <svg className="progress-ring w-28 h-28 transform -rotate-90">
                <circle
                  className="text-[var(--surface-container)]"
                  cx="56" cy="56" fill="transparent" r="50"
                  stroke="currentColor" strokeWidth="4"
                />
                <circle
                  cx="56" cy="56" fill="transparent" r="50"
                  stroke="url(#aon-gradient)" strokeDasharray="314.159"
                  strokeDashoffset="100" strokeLinecap="round" strokeWidth="6"
                />
                <defs>
                  <linearGradient id="aon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#eb0017" />
                    <stop offset="100%" stopColor="#bc0010" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute">
                <span
                  className="material-symbols-outlined text-[var(--primary)] text-4xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  auto_awesome
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="display-editorial text-[var(--on-surface)]">
              Validando tu vehículo...
            </h1>
            <p className="text-sm text-[var(--secondary)] font-medium max-w-[280px] mx-auto">
              Nuestro sistema de IA está analizando tus fotografías en tiempo real.
            </p>
          </div>

          <div className="w-full space-y-3">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center p-4 rounded-xl transition-all ${
                  step.status === "active"
                    ? "bg-[var(--surface-container-high)] border-l-4 border-[var(--primary)] relative overflow-hidden"
                    : "bg-[var(--surface-container-lowest)] card-ambient"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    step.status === "done"
                      ? "bg-[var(--tertiary-container)]"
                      : "border-2 border-[var(--primary)]/30 animate-pulse"
                  }`}
                >
                  {step.status === "done" ? (
                    <span className="material-symbols-outlined text-white text-lg">check</span>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                  )}
                </div>
                <div className="ml-4 text-left relative z-10">
                  <p
                    className={`label-wide ${
                      step.status === "active" ? "text-[var(--primary)]" : "text-[var(--secondary)]"
                    }`}
                  >
                    PASO {i + 1}{step.status === "active" ? ": EN PROCESO" : ""}
                  </p>
                  <p className="text-sm font-semibold text-[var(--on-surface)]">{step.label}</p>
                </div>
                {step.status === "active" && (
                  <div className="shimmer absolute inset-0 pointer-events-none opacity-30" />
                )}
              </div>
            ))}
          </div>

          <div className="pt-8 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--secondary-container)]/50 rounded-full">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span className="label-wide text-[var(--on-surface)]">Esto toma menos de 10 segundos</span>
            </div>
            <div className="text-[11px] text-zinc-400 italic">
              Seguridad AON: Encriptación de grado bancario activa
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 5: Results (Approved / Rejected)
// ══════════════════════════════════════════════════════════════════════════════

function ResultScreen({
  result,
  onRestart,
  vehicle,
}: {
  result: InspectionResult;
  onRestart: () => void;
  vehicle: VehicleData;
}) {
  const isApproved = result.status === "APPROVED";

  return (
    <>
      <header className="bg-white sticky top-0 w-full z-50 border-b border-slate-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--primary)]/10 p-1.5 rounded-lg">
              <span
                className="material-symbols-outlined text-[var(--primary)] text-xl"
                style={{ fontVariationSettings: "'wght' 700" }}
              >
                analytics
              </span>
            </div>
            <span className="text-xs font-bold tracking-tight text-slate-500">
              ID: {result.inspection_id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <div className="text-xl font-black tracking-tighter text-[var(--primary)]">AON</div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 pt-10 pb-28 space-y-8">
        {/* Status Header */}
        <div className="text-center space-y-2">
          <span
            className={`label-industrial ${
              isApproved ? "text-green-600" : "text-red-500"
            }`}
          >
            {isApproved ? "Verificación Exitosa" : "Alerta de Sistema"}
          </span>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            {isApproved ? "¡Inspección Aprobada!" : "Inspección No Aprobada"}
          </h1>
        </div>

        {/* Status Hero */}
        <div className="relative group">
          <div
            className={`aspect-video bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex items-center justify-center ${
              isApproved ? "shadow-green-500/5" : "shadow-red-500/5"
            }`}
          >
            <div className="relative">
              <div
                className={`absolute inset-0 blur-3xl rounded-full scale-150 ${
                  isApproved ? "bg-green-500/20" : "bg-red-500/20"
                }`}
              />
              <div
                className={`relative w-24 h-24 text-white rounded-[2rem] flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-transform duration-500 ${
                  isApproved ? "bg-green-500 shadow-green-500/40" : "bg-red-500 shadow-red-500/40"
                }`}
              >
                <span
                  className="material-symbols-outlined text-5xl"
                  style={{ fontVariationSettings: "'wght' 700" }}
                >
                  {isApproved ? "check_circle" : "cancel"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div
            className={`absolute top-0 left-0 w-1.5 h-full ${
              isApproved ? "bg-green-500" : "bg-red-500"
            }`}
          />

          {isApproved ? (
            <>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="label-industrial text-slate-400 mb-1">Vehículo Identificado</p>
                  <h2 className="text-2xl font-black text-slate-900">
                    {result.vehicle_detected.make} {result.vehicle_detected.model}
                  </h2>
                </div>
                <div className="bg-green-500/10 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-green-600 uppercase tracking-wider">
                    {Math.round(result.confidence_score * 100)}% Confianza
                  </span>
                </div>
              </div>
              <div className="space-y-5">
                <div className="flex items-center justify-between py-3 border-b border-slate-50">
                  <span className="text-sm font-semibold text-slate-500">Color detectado</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {result.vehicle_detected.color}
                    </span>
                    <span
                      className="material-symbols-outlined text-green-600 text-lg"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  </div>
                </div>
                {result.odometer_reading && (
                  <div className="flex items-center justify-between py-3 border-b border-slate-50">
                    <span className="text-sm font-semibold text-slate-500">Odómetro</span>
                    <span className="text-sm font-bold text-slate-900">{result.odometer_reading}</span>
                  </div>
                )}
                {result.vin_extracted && (
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm font-semibold text-slate-500">VIN</span>
                    <span className="text-sm font-mono font-medium text-slate-400">
                      {result.vin_extracted}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mb-8">
                <p className="label-industrial text-red-500 mb-1">Inconsistencias Detectadas</p>
                <h2 className="text-2xl font-black text-slate-900 leading-tight">Revisión Requerida</h2>
              </div>
              <div className="space-y-8">
                {result.rejection_reasons.map((reason, i) => (
                  <div key={i} className="flex gap-5">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-red-500 text-xl">warning</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 mb-1">Motivo {i + 1}</p>
                      <p className="text-sm text-slate-500 leading-relaxed">{reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Latency Info */}
        <div className="text-center">
          <span className="text-[11px] text-zinc-400">
            Procesado en {(result.latency_ms / 1000).toFixed(1)}s por IA
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4">
          {isApproved ? (
            <>
              <button className="btn-primary w-full flex items-center justify-center gap-3">
                <span>Continuar con la Emisión de Póliza</span>
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </button>
              <button className="w-full py-4 text-slate-400 font-bold text-[11px] uppercase tracking-widest hover:text-slate-600 transition-colors">
                Descargar comprobante
              </button>
            </>
          ) : (
            <>
              <button onClick={onRestart} className="btn-secondary w-full flex items-center justify-center gap-3">
                <span className="material-symbols-outlined text-xl">refresh</span>
                <span>Reintentar Inspección</span>
              </button>
              <button className="w-full py-4 text-[var(--primary)] font-bold text-[11px] uppercase tracking-widest hover:bg-red-50 rounded-2xl transition-all">
                Contactar soporte
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}
