import { useState, useEffect } from 'react';
import api from '../../api/axios';
import DragDropRanking from '../../components/DragDropRanking';
import toast from 'react-hot-toast';
import { FiSave, FiInfo } from 'react-icons/fi';

export default function RankingsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/applications/my')
      .then((res) => {
        const apps = Array.isArray(res.data) ? res.data : [];
        const ranked = apps
          .filter((a) => a.status !== 'withdrawn')
          .map((a, i) => ({
            id: a._id,
            _id: a._id,
            name: a.committee?.name || a.committeeName || 'Unknown',
            type: a.committee?.type || a.committeeType,
            rank: a.rank || i + 1,
            committeeId: a.committeeId || a.committee?._id,
          }))
          .sort((a, b) => a.rank - b.rank);
        setItems(ranked);
      })
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const rankings = items.map((item, index) => ({
        applicationId: item._id,
        committeeId: item.committeeId,
        rank: index + 1,
      }));
      await api.put('/applications/rankings', { rankings });
      toast.success('Rankings saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save rankings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-800 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-2xl">
      <h1 className="mb-2">Rank Your Preferences</h1>

      <div className="flex items-start space-x-2 bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <FiInfo className="text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-800">
          Drag and drop the CCAs below to reorder them by your preference. Rank 1 is your top choice.
          Your ranking will be used during the allocation process.
        </p>
      </div>

      <DragDropRanking items={items} onReorder={setItems} />

      {items.length > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center space-x-2"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <FiSave />
                <span>Save Rankings</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
