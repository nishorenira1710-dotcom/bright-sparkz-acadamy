import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/data-service';
import { useAuth } from '../../hooks/useAuth';
import { Announcement, Batch } from '../../types';
import { formatDate } from '../../utils/dates';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { EmptyState } from '../../components/feedback/EmptyState';
import {
  Megaphone,
  PlusCircle,
  Eye,
  EyeOff,
  Calendar,
  Layers,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const AnnouncementsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Create modal state
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'BATCH'>('ALL');
  const [batchId, setBatchId] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [annList, bList] = await Promise.all([
        dataService.getAnnouncements(),
        dataService.getBatches(),
      ]);
      setAnnouncements(annList);
      setBatches(bList);
      if (bList.length > 0 && !batchId) {
        setBatchId(bList[0].id);
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required.');
      return;
    }
    if (!currentUser) return;

    setModalLoading(true);
    try {
      await dataService.createAnnouncement({
        title: title.trim(),
        message: message.trim(),
        targetAudience,
        batchId: targetAudience === 'BATCH' ? batchId : undefined,
        publishedAt: new Date().toISOString(),
        active: true,
        createdBy: currentUser.uid,
      });

      await loadData();
      setShowModal(false);
      setTitle('');
      setMessage('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish announcement.';
      setError(msg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await dataService.toggleAnnouncementStatus(id, !currentActive);
      await loadData();
    } catch (err) {
      console.error('Failed to update announcement status:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading center announcements..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Announcements</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-800 rounded-full">
              {announcements.length} Published
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Broadcast test schedules, holiday breaks, and batch-specific notices to parents.
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-xs transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Publish Announcement
        </button>
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No Announcements Yet"
          description="Publish tuition notices, exam timetables, or holiday schedules for parents."
          actionLabel="Create Announcement"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((ann) => {
            const batch = batches.find((b) => b.id === ann.batchId);
            return (
              <div
                key={ann.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        ann.targetAudience === 'ALL'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {ann.targetAudience === 'ALL' ? '🌐 All Center Parents' : `🎯 ${batch?.name || 'Batch Targeted'}`}
                    </span>

                    <button
                      onClick={() => handleToggleActive(ann.id, ann.active)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition cursor-pointer ${
                        ann.active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {ann.active ? 'ACTIVE' : 'ARCHIVED'}
                    </button>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-900">{ann.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-line">
                      {ann.message}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Published: {formatDate(ann.publishedAt)}</span>
                  <span>By: {ann.createdBy}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Publish Notice</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notice Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mid-Term Mock Test Schedule"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Audience <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetAudience('ALL')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition cursor-pointer ${
                      targetAudience === 'ALL'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    All Parents
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetAudience('BATCH')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition cursor-pointer ${
                      targetAudience === 'BATCH'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Target Specific Batch
                  </button>
                </div>
              </div>

              {targetAudience === 'BATCH' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Batch
                  </label>
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter detailed notice information for parents..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl cursor-pointer"
                >
                  {modalLoading ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
