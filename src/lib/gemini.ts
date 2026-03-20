import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// ── Types ──────────────────────────────────────────────────────────────────────

export interface VehicleData {
  make: string;
  model: string;
  color: string;
  plate?: string;
  vin?: string;
  year?: number;
}

export interface PhotoValidation {
  photo_index: number;
  expected_angle: string;
  angle_correct: boolean;
  vehicle_present: boolean;
  quality_acceptable: boolean;
  observations: string;
}

export interface InspectionResult {
  inspection_result: "APPROVED" | "REJECTED";
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
  photos_validation: PhotoValidation[];
  odometer_reading: string | null;
  vin_extracted: string | null;
  vin_format_valid: boolean;
  rejection_reasons: string[];
  recommendations: string[];
}

// ── System Prompt ──────────────────────────────────────────────────────────────

function buildSystemPrompt(vehicleData: VehicleData): string {
  return `Eres un sistema experto de inspección vehicular automatizado para seguros de auto en México.

Tu tarea es analizar 6 fotografías de un vehículo y validar que correspondan a los datos declarados por el usuario.

DATOS DECLARADOS POR EL USUARIO:
- Marca: ${vehicleData.make}
- Modelo: ${vehicleData.model}
- Color: ${vehicleData.color}
${vehicleData.plate ? `- Placa: ${vehicleData.plate}` : ""}
${vehicleData.vin ? `- VIN: ${vehicleData.vin}` : ""}
${vehicleData.year ? `- Año: ${vehicleData.year}` : ""}

LAS 6 FOTOS SE RECIBEN EN ESTE ORDEN:
1. FRONTAL — Vista completa del frente. Debe verse placa delantera, faros, cofre, parrilla.
2. TRASERA — Vista completa trasera. Placa trasera, calaveras, cajuela.
3. LATERAL IZQUIERDO — Costado izquierdo completo con ambas puertas.
4. LATERAL DERECHO — Costado derecho completo con ambas puertas.
5. TABLERO/ODÓMETRO — Tablero con odómetro visible.
6. VIN — Número de identificación vehicular en placa del chasis o parabrisas.

INSTRUCCIONES DE ANÁLISIS:
1. Verifica que cada imagen corresponde al ángulo asignado.
2. Confirma que hay un vehículo presente en cada foto.
3. Identifica marca, modelo y color del vehículo a partir de las fotos exteriores.
4. Extrae el kilometraje del odómetro mediante OCR (foto 5).
5. Extrae y valida el formato del VIN (foto 6).
6. Compara los datos extraídos contra los datos declarados.
7. Evalúa la calidad de cada imagen (nitidez, iluminación, encuadre).

REGLAS DE DECISIÓN:
- APPROVED: Todas las fotos tienen vehículo, ángulos correctos, marca/modelo/color coinciden, confidence ≥ 0.75.
- REJECTED: Cualquier foto sin vehículo, ángulo incorrecto, discrepancia marca/modelo/color, confidence < 0.75, o calidad insuficiente.

Para la comparación de marca y modelo, usa fuzzy matching (ej: "Corolla" = "corolla" = "COROLLA", "Toyota" incluye "TOYOTA MOTOR").
Para color, acepta variaciones similares (ej: "blanco" ≈ "blanco perla" ≈ "white").

IMPORTANTE: Responde ÚNICAMENTE con un JSON válido siguiendo el schema exacto. No incluyas texto adicional.`;
}

// ── Validate with Gemini ───────────────────────────────────────────────────────

export async function validateInspection(
  vehicleData: VehicleData,
  photoBuffers: { buffer: Buffer; mimeType: string }[]
): Promise<{ result: InspectionResult; latencyMs: number }> {
  const startTime = Date.now();

  const systemPrompt = buildSystemPrompt(vehicleData);

  // Build the content with images
  const parts: Array<{ inlineData: { data: string; mimeType: string } } | { text: string }> = [];

  // Add instruction text
  parts.push({
    text: "Analiza las siguientes 6 fotografías del vehículo y retorna el resultado de validación en formato JSON.",
  });

  // Add each photo as inline data
  const angleLabels = ["FRONTAL", "TRASERA", "LATERAL_IZQUIERDO", "LATERAL_DERECHO", "TABLERO", "VIN"];
  for (let i = 0; i < photoBuffers.length; i++) {
    parts.push({
      text: `Foto ${i + 1} — ${angleLabels[i]}:`,
    });
    parts.push({
      inlineData: {
        data: photoBuffers[i].buffer.toString("base64"),
        mimeType: photoBuffers[i].mimeType || "image/jpeg",
      },
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      temperature: 0.1,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
      systemInstruction: systemPrompt,
    },
    contents: [
      {
        role: "user",
        parts,
      },
    ],
  });

  const latencyMs = Date.now() - startTime;

  // Parse the JSON response
  const responseText = response.text || "";
  let result: InspectionResult;

  try {
    result = JSON.parse(responseText) as InspectionResult;
  } catch {
    // If Gemini returns malformed JSON, create a rejection
    result = {
      inspection_result: "REJECTED",
      confidence_score: 0,
      vehicle_detected: {
        make: "unknown",
        model: "unknown",
        color: "unknown",
        year_estimate: "unknown",
        body_type: "unknown",
      },
      declared_data_match: {
        make_match: false,
        model_match: false,
        color_match: false,
      },
      photos_validation: [],
      odometer_reading: null,
      vin_extracted: null,
      vin_format_valid: false,
      rejection_reasons: ["Error al procesar las imágenes. Por favor, intenta de nuevo."],
      recommendations: ["Asegúrate de que las fotos sean nítidas y estén bien iluminadas."],
    };
  }

  return { result, latencyMs };
}
