import { FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';

const KIND = {
  success: { Icon: FiCheckCircle, className: 'bg-status-normal text-white' },
  error: { Icon: FiAlertCircle, className: 'bg-status-critical text-white' },
  info: { Icon: FiInfo, className: 'bg-paper-light text-ink' },
};

export default function Toast({ kind = 'info', message }) {
  const { Icon, className } = KIND[kind];
  return (
    <div role="status" className={`dense-panel flex items-center gap-2 px-4 py-3 ${className}`}>
      <Icon aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
