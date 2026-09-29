import { FiCheckCircle, FiPlayCircle, FiClock, FiAlertTriangle, FiAlertOctagon } from 'react-icons/fi';

const STATUS = {
  normal: { label: 'Completed', bg: 'bg-status-normal', text: 'text-white', Icon: FiCheckCircle },
  active: { label: 'Active', bg: 'bg-status-active', text: 'text-white', Icon: FiPlayCircle },
  pending: { label: 'Pending', bg: 'bg-status-pending', text: 'text-ink', Icon: FiClock },
  attention: { label: 'Attention', bg: 'bg-status-attention', text: 'text-ink', Icon: FiAlertTriangle },
  critical: { label: 'Exception', bg: 'bg-status-critical', text: 'text-white', Icon: FiAlertOctagon },
};

export default function StatusBadge({ status, label }) {
  const config = STATUS[status];
  const { Icon } = config;
  return (
    <span
      className={`inline-flex items-center gap-1.5 dense-panel px-3 py-1 text-sm font-semibold ${config.bg} ${config.text}`}
    >
      <Icon aria-hidden="true" />
      {label || config.label}
    </span>
  );
}
