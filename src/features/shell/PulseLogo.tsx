/** Four line-coloured arcs orbiting one bright core — the network as a single pulse. */
export function PulseLogo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true" fill="none" strokeWidth="3" strokeLinecap="round">
      <path d="M16 3a13 13 0 0 1 13 13" stroke="#3D8BFF" />
      <path d="M29 16a13 13 0 0 1-13 13" stroke="#FF4D5E" />
      <path d="M16 29A13 13 0 0 1 3 16" stroke="#FFC83D" />
      <path d="M3 16A13 13 0 0 1 16 3" stroke="#A270FF" />
      <circle cx="16" cy="16" r="4.5" fill="#F4F4F6" />
    </svg>
  );
}
