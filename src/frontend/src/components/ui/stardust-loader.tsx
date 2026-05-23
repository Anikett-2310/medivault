export default function ClassicLoader({
  className = "",
}: { className?: string }) {
  return (
    <div
      className={`border-primary flex h-10 w-10 animate-spin items-center justify-center rounded-full border-4 border-t-transparent ${className}`}
    />
  );
}

export function ConcentricLoader({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-4 ${className}`}
    >
      <div className="flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-transparent border-t-[var(--color-role-hospital)] text-4xl text-[var(--color-role-hospital)]">
        <div className="flex h-12 w-12 animate-spin items-center justify-center rounded-full border-4 border-transparent border-t-[var(--color-accent-teal)] text-2xl text-[var(--color-accent-teal)]" />
      </div>
    </div>
  );
}
