export default function Select({ label, error, id, options, ...props }) {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-sm font-semibold">
        {label}
      </label>
      <select
        id={fieldId}
        className="dense-panel px-3 py-2 min-h-[44px] bg-paper-light"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${fieldId}-error`} className="text-sm text-status-critical">
          {error}
        </p>
      )}
    </div>
  );
}
