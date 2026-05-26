type IconVariant = "outline" | "filled";

const circleBase =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full";

export function ManagerIcon({ variant }: { variant: IconVariant }) {
  const filled = variant === "filled";
  return (
    <div
      className={`${circleBase} ${
        filled ? "bg-[#2B7FFF] text-white" : "border-2 border-[#2B7FFF] text-[#2B7FFF]"
      }`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <circle cx="12" cy="8" r="4" />
        <path d="M6 20c1.2-3.5 10.8-3.5 12 0" />
      </svg>
    </div>
  );
}

export function DeveloperIcon({ variant }: { variant: IconVariant }) {
  const filled = variant === "filled";
  return (
    <div
      className={`${circleBase} ${
        filled ? "bg-[#2B7FFF] text-white" : "border-2 border-[#2B7FFF] text-[#2B7FFF]"
      }`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden
      >
        <rect x="3" y="8" width="18" height="12" rx="2" />
        <path d="M8 8V6a4 4 0 0 1 8 0v2" />
      </svg>
    </div>
  );
}

export function QAIcon({ variant }: { variant: IconVariant }) {
  const filled = variant === "filled";
  return (
    <div
      className={`${circleBase} ${
        filled ? "bg-[#2B7FFF] text-white" : "border-2 border-[#2B7FFF] text-[#2B7FFF]"
      }`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden
      >
        <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
        <path d="M6 18h12v2H6z" />
        <circle cx="12" cy="11" r="2" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}
