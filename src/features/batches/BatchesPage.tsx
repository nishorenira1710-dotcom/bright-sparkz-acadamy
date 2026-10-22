import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/data-service';
import { Batch, Student } from '../../types';
import { getDayName } from '../../utils/dates';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import {
  CalendarDays,
  PlusCircle,
  Clock,
  Users,
  Edit2,
  CheckCircle,
  XCircle,
  Save,
  X,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const BatchesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Batch modal
  const [showModal, setShowModal] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('Grade 10');
  const [subject, setSubject] = useState('');
  const [startTime, setStartTime] = useState('16:30');
  const [endTime, setEndTime] = useState('18:00');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 3, 5]);
  const [gracePeriod, setGracePeriod] = useState<number>(10);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [bList, sList] = await Promise.all([
        dataService.getBatches(),
        dataService.getStudents({ activeOnly: true }),
      ]);
      setBatches(bList);
      setStudents(sList);
    } catch (err) {
      console.error('Failed to load batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading batch schedules..." />;
  }

  const handleOpenCreate = () => {
    setEditingBatchId(null);
    setName('');
    setGrade('Grade 10');
    setSubject('');
    setStartTime('16:30');
    setEndTime('18:00');
    setDaysOfWeek([1, 3, 5]);
    setGracePeriod(10);
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (batch: Batch) => {
    setEditingBatchId(batch.id);
    setName(batch.name);
    setGrade(batch.grade);
    setSubject(batch.subject);
    setStartTime(batch.startTime);
    setEndTime(batch.endTime);
    setDaysOfWeek(batch.daysOfWeek);
    setGracePeriod(batch.defaultGracePeriodMinutes);
    setError(null);
    setShowModal(true);
  };

  const handleDayToggle = (dayIndex: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex].sort()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subject) {
      setError('Batch name and subject are required.');
      return;
    }
    if (daysOfWeek.length === 0) {
      setError('Please select at least one day of the week.');
      return;
    }

    setModalLoading(true);
    try {
      if (editingBatchId) {
        await dataService.updateBatch(editingBatchId, {
          name,
          grade,
          subject,
          startTime,
          endTime,
          daysOfWeek,
          defaultGracePeriodMinutes: gracePeriod,
        });
      } else {
        await dataService.createBatch({
          name,
          grade,
          subject,
          startTime,
          endTime,
          daysOfWeek,
          active: true,
          defaultGracePeriodMinutes: gracePeriod,
        });
      }
      await loadData();
      setShowModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save batch.';
      setError(msg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleActive = async (batch: Batch) => {
    try {
      await dataService.updateBatch(batch.id, { active: !batch.active });
      await loadData();
    } catch (err) {
      console.error('Failed to toggle batch status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Academic Batches</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-800 rounded-full">
              {batches.length} Batches
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure subjects, teaching days, schedules, and late-arrival grace periods.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-xs transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Batch
        </button>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {batches.map((batch) => {
          const studentCount = students.filter((s) => s.batchId === batch.id).length;
          return (
            <div
              key={batch.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                    {batch.grade}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleActive(batch)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer ${
                        batch.active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {batch.active ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(batch)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                      title="Edit Batch"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-snug">{batch.name}</h3>
                  <p className="text-xs font-semibold text-orange-600 mt-0.5">{batch.subject}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">
                      {batch.startTime} - {batch.endTime}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({batch.defaultGracePeriodMinutes}m grace)
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                    <span>Days:</span>
                    <span className="font-medium text-slate-800">
                      {batch.daysOfWeek.map((d) => getDayName(d)).join(', ')}
                    </span>
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Users className="w-4 h-4 text-slate-400" />
                  {studentCount} Students Enrolled
                </span>
                <Link
                  to={`/admin/students?batchId=${batch.id}`}
                  className="font-bold text-orange-600 hover:text-orange-700"
                >
                  View Students →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Batch Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingBatchId ? 'Edit Academic Batch' : 'Create Academic Batch'}
              </h3>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batch Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Grade 10 — CBSE Math & Science (Batch Alpha)"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Grade / Level
                  </label>
                  <input
                    type="text"
                    required
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="Grade 10"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject Focus
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Math & Science"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Grace (Mins)
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
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Teaching Days
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                    const active = daysOfWeek.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => handleDayToggle(day)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                          active
                            ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {getDayName(day)}
                      </button>
                    );
                  })}
                </div>
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {modalLoading ? 'Saving...' : 'Save Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
