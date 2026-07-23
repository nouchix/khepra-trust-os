export function NxShield({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 32) / 28} viewBox="0 0 28 32" fill="none" aria-hidden="true">
      <path d="M14 1L2 6V17C2 23.6 7.4 29.6 14 31C20.6 29.6 26 23.6 26 17V6L14 1Z"
            fill="none" stroke="#1a9fe8" strokeWidth="1.5" />
      <circle cx="14" cy="16" r="2.5" fill="#1a9fe8" />
    </svg>
  );
}