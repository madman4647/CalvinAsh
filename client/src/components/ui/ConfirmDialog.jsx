import Button from './Button.jsx';

export default function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="comic-panel comic-panel--quiet max-w-md w-full mx-4">
        <h2 className="font-heading text-xl mb-2">{title}</h2>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="plain" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" quiet onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
