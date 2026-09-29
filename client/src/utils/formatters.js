import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function formatDate(date) {
  if (!date) return 'N/A';
  return dayjs(date).format('DD MMM YYYY, hh:mm A');
}

export function formatDeadline(deadline) {
  if (!deadline) return 'No deadline set';
  const dl = dayjs(deadline);
  const now = dayjs();
  if (dl.isBefore(now)) {
    return `Closed (${dl.format('DD MMM YYYY')})`;
  }
  const diff = dl.diff(now, 'hour');
  if (diff < 24) {
    return `${diff}h remaining`;
  }
  const days = dl.diff(now, 'day');
  return `${days}d remaining (${dl.format('DD MMM, hh:mm A')})`;
}

export function statusLabel(status) {
  const labels = {
    pending: 'Pending',
    selected: 'Selected',
    waitlisted: 'Waitlisted',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
  };
  return labels[status] || status || 'Unknown';
}

export function statusColor(status) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    selected: 'bg-green-100 text-green-800 border-green-300',
    waitlisted: 'bg-blue-100 text-blue-800 border-blue-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
    withdrawn: 'bg-gray-100 text-gray-600 border-gray-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-600 border-gray-300';
}

export function ccaTypeLabel(type) {
  const labels = {
    committee: 'Committee',
    club: 'Club',
    aig: 'AIG',
  };
  return labels[type] || type || 'Unknown';
}

export function ccaTypeBadgeColor(type) {
  const colors = {
    committee: 'bg-primary-100 text-primary-800',
    club: 'bg-gold-100 text-gold-800',
    aig: 'bg-purple-100 text-purple-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}
