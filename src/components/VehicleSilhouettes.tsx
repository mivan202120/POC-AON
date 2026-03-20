// Vehicle silhouette SVGs for each camera angle\n// Semi-transparent white outlines that overlay on the camera feed\nimport React from \"react\";

export function FrontalSilhouette() {
  return (
    <svg viewBox="0 0 400 300" fill="none" className="w-full h-full">
      {/* Car body front view */}
      <path
        d="M100 240 L100 160 Q100 130 120 120 L140 100 Q160 80 200 80 Q240 80 260 100 L280 120 Q300 130 300 160 L300 240"
        stroke="white" strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round"
      />
      {/* Roof line */}
      <path d="M140 100 Q170 70 200 65 Q230 70 260 100" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
      {/* Windshield */}
      <path d="M145 105 L155 130 L245 130 L255 105" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
      {/* Hood */}
      <path d="M130 145 L270 145" stroke="white" strokeWidth="1" strokeOpacity="0.25" />
      {/* Headlights */}
      <ellipse cx="130" cy="170" rx="18" ry="12" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" />
      <ellipse cx="270" cy="170" rx="18" ry="12" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" />
      {/* Grille */}
      <rect x="165" y="160" width="70" height="25" rx="4" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
      {/* Bumper */}
      <path d="M115 200 L285 200" stroke="white" strokeWidth="1" strokeOpacity="0.25" />
      {/* License plate area */}
      <rect x="170" y="210" width="60" height="20" rx="3" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
      <text x="200" y="224" textAnchor="middle" fill="white" fillOpacity="0.4" fontSize="8" fontFamily="monospace">PLACA</text>
      {/* Wheels */}
      <ellipse cx="135" cy="245" rx="22" ry="10" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
      <ellipse cx="265" cy="245" rx="22" ry="10" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
    </svg>
  );
}

export function RearSilhouette() {
  return (
    <svg viewBox="0 0 400 300" fill="none" className="w-full h-full">
      {/* Car body rear view */}
      <path
        d="M100 240 L100 160 Q100 130 120 120 L140 100 Q160 80 200 80 Q240 80 260 100 L280 120 Q300 130 300 160 L300 240"
        stroke="white" strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round"
      />
      {/* Roof */}
      <path d="M140 100 Q170 70 200 65 Q230 70 260 100" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
      {/* Rear windshield */}
      <path d="M150 108 L160 130 L240 130 L250 108" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
      {/* Trunk */}
      <path d="M135 145 L265 145" stroke="white" strokeWidth="1" strokeOpacity="0.25" />
      {/* Tail lights */}
      <rect x="108" y="160" width="25" height="14" rx="4" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" />
      <rect x="267" y="160" width="25" height="14" rx="4" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" />
      {/* Bumper */}
      <path d="M115 200 L285 200" stroke="white" strokeWidth="1" strokeOpacity="0.25" />
      {/* License plate area */}
      <rect x="170" y="205" width="60" height="20" rx="3" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
      <text x="200" y="219" textAnchor="middle" fill="white" fillOpacity="0.4" fontSize="8" fontFamily="monospace">PLACA</text>
      {/* Exhaust */}
      <ellipse cx="160" cy="235" rx="10" ry="5" stroke="white" strokeWidth="1" strokeOpacity="0.25" />
      {/* Wheels */}
      <ellipse cx="135" cy="245" rx="22" ry="10" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
      <ellipse cx="265" cy="245" rx="22" ry="10" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
    </svg>
  );
}

export function LeftSilhouette() {
  return (
    <svg viewBox="0 0 400 300" fill="none" className="w-full h-full">
      {/* Car body side view - left */}
      <path
        d="M50 220 L50 170 L70 170 L100 120 L160 90 L240 90 L280 120 L340 130 L360 150 L360 220"
        stroke="white" strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Roof line */}
      <path d="M100 120 L160 90 L240 90 L280 120" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
      {/* Windows */}
      <path d="M110 122 L155 95 L200 95 L200 130 L110 130 Z" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
      <path d="M205 95 L235 95 L270 122 L270 130 L205 130 Z" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
      {/* Door line */}
      <line x1="200" y1="95" x2="200" y2="210" stroke="white" strokeWidth="1" strokeOpacity="0.25" />
      {/* Door handles */}
      <line x1="175" y1="155" x2="190" y2="155" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
      <line x1="225" y1="155" x2="240" y2="155" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
      {/* Wheel arches */}
      <path d="M50 220 Q70 190 100 190 Q130 190 145 220" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
      <path d="M260 220 Q280 190 310 190 Q340 190 360 220" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
      {/* Wheels */}
      <circle cx="97" cy="225" r="25" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
      <circle cx="97" cy="225" r="10" stroke="white" strokeWidth="1" strokeOpacity="0.25" />
      <circle cx="310" cy="225" r="25" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
      <circle cx="310" cy="225" r="10" stroke="white" strokeWidth="1" strokeOpacity="0.25" />
      {/* Ground line */}
      <line x1="30" y1="250" x2="380" y2="250" stroke="white" strokeWidth="0.5" strokeOpacity="0.15" />
    </svg>
  );
}

export function RightSilhouette() {
  return (
    <svg viewBox="0 0 400 300" fill="none" className="w-full h-full" style={{ transform: "scaleX(-1)" }}>
      {/* Mirror of left side */}
      <path
        d="M50 220 L50 170 L70 170 L100 120 L160 90 L240 90 L280 120 L340 130 L360 150 L360 220"
        stroke="white" strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M100 120 L160 90 L240 90 L280 120" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
      <path d="M110 122 L155 95 L200 95 L200 130 L110 130 Z" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
      <path d="M205 95 L235 95 L270 122 L270 130 L205 130 Z" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
      <line x1="200" y1="95" x2="200" y2="210" stroke="white" strokeWidth="1" strokeOpacity="0.25" />
      <line x1="175" y1="155" x2="190" y2="155" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
      <line x1="225" y1="155" x2="240" y2="155" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
      <path d="M50 220 Q70 190 100 190 Q130 190 145 220" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
      <path d="M260 220 Q280 190 310 190 Q340 190 360 220" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
      <circle cx="97" cy="225" r="25" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
      <circle cx="97" cy="225" r="10" stroke="white" strokeWidth="1" strokeOpacity="0.25" />
      <circle cx="310" cy="225" r="25" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
      <circle cx="310" cy="225" r="10" stroke="white" strokeWidth="1" strokeOpacity="0.25" />
      <line x1="30" y1="250" x2="380" y2="250" stroke="white" strokeWidth="0.5" strokeOpacity="0.15" />
    </svg>
  );
}

export function DashboardSilhouette() {
  return (
    <svg viewBox="0 0 400 300" fill="none" className="w-full h-full">
      {/* Steering wheel */}
      <circle cx="130" cy="180" r="45" stroke="white" strokeWidth="2" strokeOpacity="0.35" />
      <circle cx="130" cy="180" r="15" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
      <line x1="130" y1="135" x2="130" y2="165" stroke="white" strokeWidth="1.5" strokeOpacity="0.25" />
      <line x1="85" y1="180" x2="115" y2="180" stroke="white" strokeWidth="1.5" strokeOpacity="0.25" />
      <line x1="145" y1="180" x2="175" y2="180" stroke="white" strokeWidth="1.5" strokeOpacity="0.25" />
      {/* Dashboard panel */}
      <path d="M60 100 L340 100 Q350 100 350 110 L350 150 Q350 160 340 160 L60 160 Q50 160 50 150 L50 110 Q50 100 60 100" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
      {/* Speedometer/Odometer - highlighted */}
      <circle cx="250" cy="130" r="30" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
      <text x="250" y="125" textAnchor="middle" fill="white" fillOpacity="0.4" fontSize="7" fontFamily="monospace">KM</text>
      <text x="250" y="140" textAnchor="middle" fill="white" fillOpacity="0.5" fontSize="10" fontFamily="monospace" fontWeight="bold">000000</text>
      {/* RPM gauge */}
      <circle cx="170" cy="130" r="22" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
      {/* Center console */}
      <rect x="200" y="175" width="80" height="100" rx="8" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
      {/* Screen */}
      <rect x="210" y="185" width="60" height="35" rx="4" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
    </svg>
  );
}

export function VINSilhouette() {
  return (
    <svg viewBox="0 0 400 300" fill="none" className="w-full h-full">
      {/* Windshield outline */}
      <path d="M80 60 L320 60 Q340 60 340 80 L340 220 Q340 240 320 240 L80 240 Q60 240 60 220 L60 80 Q60 60 80 60" stroke="white" strokeWidth="1.5" strokeOpacity="0.25" />
      {/* VIN plate area - highlighted */}
      <rect x="100" y="180" width="200" height="35" rx="4" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
      {/* VIN text placeholder */}
      <text x="200" y="195" textAnchor="middle" fill="white" fillOpacity="0.3" fontSize="7" fontFamily="monospace">NÚMERO DE SERIE</text>
      <text x="200" y="208" textAnchor="middle" fill="white" fillOpacity="0.45" fontSize="11" fontFamily="monospace" fontWeight="bold" letterSpacing="2">
        1HGBH41JXMN109186
      </text>
      {/* Arrow pointing to VIN */}
      <path d="M200 160 L200 175" stroke="white" strokeWidth="2" strokeOpacity="0.4" markerEnd="url(#arrow)" />
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L10 5 L0 10 Z" fill="white" fillOpacity="0.4" />
        </marker>
      </defs>
      {/* Label */}
      <text x="200" y="155" textAnchor="middle" fill="white" fillOpacity="0.4" fontSize="9" fontFamily="sans-serif">
        Ubica el VIN aquí
      </text>
      {/* Barcode-like lines */}
      {Array.from({ length: 17 }).map((_, i) => (
        <line key={i} x1={120 + i * 10} y1="220" x2={120 + i * 10} y2="232" stroke="white" strokeWidth={i % 3 === 0 ? 2 : 1} strokeOpacity="0.2" />
      ))}
    </svg>
  );
}

// Map angle keys to their silhouette components
export const SILHOUETTES: Record<string, () => React.JSX.Element> = {
  FRONTAL: FrontalSilhouette,
  REAR: RearSilhouette,
  LEFT: LeftSilhouette,
  RIGHT: RightSilhouette,
  DASHBOARD: DashboardSilhouette,
  VIN: VINSilhouette,
};
