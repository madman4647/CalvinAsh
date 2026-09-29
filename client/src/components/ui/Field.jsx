export default function Field({ label, error, id, ...props }) {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={fieldId}
        className="dense-panel px-3 py-2 min-h-[44px] bg-paper-light"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${fieldId}-error`} className="text-sm text-status-critical">
          {error}
        </p>
      )}
    </div>
  );
}
