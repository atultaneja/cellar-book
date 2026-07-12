// A carved Tiki totem mask — the emblem of the Tantaan Tiki Bar.
export function Crest({ size = 44 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Totem plank */}
      <path
        d="M28 10 Q50 2 72 10 L74 84 Q50 96 26 84 Z"
        fill="#14432A"
        stroke="#B08D46"
        strokeWidth="2.5"
      />
      {/* Side ears */}
      <path d="M26 30 L16 38 L26 50 Z" fill="#14432A" stroke="#B08D46" strokeWidth="2" />
      <path d="M74 30 L84 38 L74 50 Z" fill="#14432A" stroke="#B08D46" strokeWidth="2" />

      {/* Brow band */}
      <path
        d="M30 34 Q50 26 70 34"
        fill="none"
        stroke="#C9A85E"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Eyes */}
      <ellipse cx="40" cy="44" rx="7" ry="5.5" fill="#C9A85E" />
      <ellipse cx="60" cy="44" rx="7" ry="5.5" fill="#C9A85E" />
      <circle cx="40" cy="44" r="2.4" fill="#0E2E1D" />
      <circle cx="60" cy="44" r="2.4" fill="#0E2E1D" />

      {/* Nose */}
      <path d="M50 50 L44 64 L56 64 Z" fill="#C9A85E" />

      {/* Mouth with teeth */}
      <rect x="36" y="68" width="28" height="9" rx="1.5" fill="#0E2E1D" stroke="#B08D46" strokeWidth="1.5" />
      <g stroke="#C9A85E" strokeWidth="1.4">
        <line x1="44" y1="68" x2="44" y2="77" />
        <line x1="50" y1="68" x2="50" y2="77" />
        <line x1="56" y1="68" x2="56" y2="77" />
      </g>
    </svg>
  );
}
