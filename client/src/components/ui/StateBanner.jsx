import StatusBadge from './StatusBadge.jsx';

export default function StateBanner({ status, title, subtitle }) {
  return (
    <div className="dense-panel flex items-center justify-between gap-4 px-5 py-4 w-full">
      <div>
        <p className="font-heading text-lg">{title}</p>
        {subtitle && <p className="text-sm opacity-80">{subtitle}</p>}
      </div>
      <StatusBadge status={status} />
    </div>
  );
}
