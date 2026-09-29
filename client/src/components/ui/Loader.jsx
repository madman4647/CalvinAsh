export default function Loader() {
  return (
    <div role="status" className="inline-flex items-center gap-2">
      <svg
        className="animate-spin"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" stroke="var(--ink)" strokeWidth="3" strokeDasharray="40 20" />
      </svg>
      <span className="sr-only">Loading</span>
    </div>
  );
}
