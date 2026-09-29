import { FiUploadCloud } from 'react-icons/fi';

export default function FileDrop({ label, error, accept, onFileSelected, id }) {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-sm font-semibold">
        {label}
      </label>
      <label
        htmlFor={fieldId}
        className="dense-panel flex flex-col items-center justify-center gap-2 p-6 min-h-[96px] cursor-pointer bg-paper-light"
      >
        <FiUploadCloud size={24} aria-hidden="true" />
        <span className="text-sm">Click or drop a file here</span>
        <input
          id={fieldId}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => onFileSelected?.(e.target.files?.[0] ?? null)}
        />
      </label>
      {error && <p className="text-sm text-status-critical">{error}</p>}
    </div>
  );
}
