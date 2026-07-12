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
      {/* Shield */}
      <path
        d="M50 6 L88 18 V50 C88 74 70 88 50 95 C30 88 12 74 12 50 V18 Z"
        fill="#14432A"
        stroke="#B08D46"
        strokeWidth="2.5"
      />
      <path
        d="M50 14 L81 24 V50 C81 69 66 81 50 87 C34 81 19 69 19 50 V24 Z"
        fill="none"
        stroke="#C9A85E"
        strokeWidth="1"
        opacity="0.7"
      />
      {/* Crossed bottles */}
      <g stroke="#C9A85E" strokeWidth="3" strokeLinecap="round">
        <line x1="36" y1="34" x2="64" y2="66" />
        <line x1="64" y1="34" x2="36" y2="66" />
      </g>
      {/* Star */}
      <circle cx="50" cy="50" r="6" fill="#B08D46" />
    </svg>
  );
}
