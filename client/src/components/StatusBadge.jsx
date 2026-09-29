import { statusLabel, statusColor } from '../utils/formatters';

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusColor(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}
