import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dataService } from '../../services/data-service';
import { Batch, ClassSession, SessionStatus } from '../../types';
import { formatDate, formatTimeOnly, getTodayDateString } from '../../utils/dates';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { EmptyState } from '../../components/feedback/EmptyState';
import {
  Clock,
  PlusCircle,
  CalendarDays,
  CheckCircle2,
  Play,
  Check,
  Ban,
  ClipboardCheck,
  AlertCircle,
  X,
} from 'lucide-react';

export const SessionsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Filter
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Schedule modal
  const [showModal, setShowModal] = useState(false);
  const [newBatchId, setNewBatchId] = useState('');
  const [sessionDate, setSessionDate] = useState(getTodayDateString());
  const [startTime, setStartTime] = useState('16:30');
  const [endTime, setEndTime] = useState('18:00');
  const [gracePeriod, setGracePeriod] = useState<number>(10);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [sessList, bList] = await Promise.all([
        dataService.getClassSessions(),
        dataService.getBatches(),
      ]);
      setSessions(sessList);
      setBatches(bList);
      if (bList.length > 0 && !newBatchId) {
        setNewBatchId(bList[0].id);
        setGracePeriod(bList[0].defaultGracePeriodMinutes);
        setStartTime(bList[0].startTime);
        setEndTime(bList[0].endTime);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBatchSelectChange = (bId: string) => {
    setNewBatchId(bId);
    const b = batches.find((item) => item.id === bId);
    if (b) {
      setGracePeriod(b.defaultGracePeriodMinutes);
      setStartTime(b.startTime);
      setEndTime(b.endTime);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate duplicate session
    const isDuplicate = sessions.some(
      (s) => s.batchId === newBatchId && s.sessionDate === sessionDate && s.status !== 'CANCELLED'
    );
    if (isDuplicate) {
      setError('A session for this batch on this date already exists.');
      return;
    }

    setModalLoading(true);
    try {
      const scheduledStartAt = `${sessionDate}T${startTime}:00.000Z`;
      const scheduledEndAt = `${sessionDate}T${endTime}:00.000Z`;

      await dataService.createClassSession({
        batchId: newBatchId,
        sessionDate,
        scheduledStartAt,
        scheduledEndAt,
        gracePeriodMinutes: gracePeriod,
        status: 'SCHEDULED',
      });

      await loadData();
      setShowModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to schedule session.';
      setError(msg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateStatus = async (sessionId: string, newStatus: SessionStatus) => {
    try {
      await dataService.updateSessionStatus(sessionId, newStatus);
      await loadData();
    } catch (err) {
      console.error('Failed to update session status:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading class timetable..." />;
  }

  const filteredSessions = sessions.filter((s) => {
    if (selectedBatchId && s.batchId !== selectedBatchId) return false;
    if (selectedDate && s.sessionDate !== selectedDate) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Class Sessions</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-800 rounded-full">
              {filteredSessions.length} Sessions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Daily timetables, live session activation, and grace-period snapshots for attendance accuracy.
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
          Schedule Class Session
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-64">
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
          >
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-48">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
          />
        </div>

        {(selectedBatchId || selectedDate) && (
          <button
            onClick={() => {
              setSelectedBatchId('');
              setSelectedDate('');
            }}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 px-2 cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No Sessions Found"
          description="Schedule a class session to begin tracking attendance and student arrivals."
          actionLabel="Schedule Session"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filteredSessions.map((sess) => {
            const batch = batches.find((b) => b.id === sess.batchId);
            const isLive = sess.status === 'IN_PROGRESS';

            return (
              <div
                key={sess.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {batch?.name || 'Class Session'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isLive
                          ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                          : sess.status === 'COMPLETED'
                          ? 'bg-slate-100 text-slate-700'
                          : sess.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {sess.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                    <span className="font-medium text-slate-700">
                      📅 {formatDate(sess.sessionDate)}
                    </span>
                    <span>
                      🕒 {formatTimeOnly(sess.scheduledStartAt)} – {formatTimeOnly(sess.scheduledEndAt)}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Snapshot Grace: {sess.gracePeriodMinutes} mins
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {sess.status === 'SCHEDULED' && (
                    <button
                      onClick={() => handleUpdateStatus(sess.id, 'IN_PROGRESS')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" /> Start Session
                    </button>
                  )}

                  {sess.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleUpdateStatus(sess.id, 'COMPLETED')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Complete Session
                    </button>
                  )}

                  {sess.status !== 'CANCELLED' && sess.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleUpdateStatus(sess.id, 'CANCELLED')}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                      title="Cancel Session"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  )}

                  <Link
                    to={`/admin/attendance?sessionId=${sess.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    Attendance Sheet
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Schedule Class Session</h3>
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

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batch
                </label>
                <select
                  value={newBatchId}
                  onChange={(e) => handleBatchSelectChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Session Date
                </label>
                <input
                  type="date"
                  required
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Grace Period Snapshot (Minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  required
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Preserved in session record to ensure historical late calculations remain immutable.
                </p>
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
                  {modalLoading ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
