import { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ExcelExportButton({ url, filename = 'export.xlsx', label = 'Export Excel' }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success('Export downloaded successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to export');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleExport} disabled={loading} className="btn-secondary flex items-center space-x-2">
      <FiDownload />
      <span>{loading ? 'Exporting...' : label}</span>
    </button>
  );
}
