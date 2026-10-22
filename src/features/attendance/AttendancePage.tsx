import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { dataService } from '../../services/data-service';
import { useAuth } from '../../hooks/useAuth';
import {
  Student,
  Batch,
  ClassSession,
  AttendanceRecord,
  AttendanceStatus,
} from '../../types';
import { formatTimeOnly, formatDate, getTodayDateString } from '../../utils/dates';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  LogOut,
  Clock,
  AlertCircle,
  HelpCircle,
  Calendar,
  Users,
  Check,
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // Selected session
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [filterQuery, setFilterQuery] = useState('');

  // Correction modal state
  const [correctingRecord, setCorrectingRecord] = useState<AttendanceRecord | null>(null);
  const [correctionStatus, setCorrectionStatus] = useState<AttendanceStatus>('PRESENT');
  const [correctionReason, setCorrectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadInitialData = async () => {
    try {
      const [sessList, bList, sList] = await Promise.all([
        dataService.getClassSessions(),
        dataService.getBatches(),
        dataService.getStudents({ activeOnly: true }),
      ]);
      setSessions(sessList);
      setBatches(bList);
      setStudents(sList);

      const requestedSessId = searchParams.get('sessionId');
      const targetSessionId =
        requestedSessId || (sessList.length > 0 ? sessList[0].id : '');

      setSelectedSessionId(targetSessionId);
      if (targetSessionId) {
        const att = await dataService.getAttendanceForSession(targetSessionId);
        setAttendanceRecords(att);
      }
    } catch (err) {
      console.error('Failed to load attendance sheet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSessionChange = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setSearchParams({ sessionId });
    const att = await dataService.getAttendanceForSession(sessionId);
    setAttendanceRecords(att);
  };

  const currentSession = sessions.find((s) => s.id === selectedSessionId) || null;
  const currentBatch = batches.find((b) => b.id === currentSession?.batchId) || null;

  // Students belonging to the current session's batch
  const batchStudents = students.filter((s) => s.batchId === currentSession?.batchId);

  const handleMark = async (studentId: string, status: AttendanceStatus) => {
    if (!currentSession || !currentUser) return;
    setActionLoading(true);

    try {
      const record = await dataService.recordAttendance({
        studentId,
        sessionId: currentSession.id,
        batchId: currentSession.batchId,
        status,
        recordedBy: currentUser.uid,
      });

      // Update local state
      setAttendanceRecords((prev) => {
        const idx = prev.findIndex((a) => a.id === record.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = record;
          return next;
        }
        return [...prev, record];
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record attendance.';
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkMarkAbsent = async () => {
    if (!currentSession || !currentUser) return;
    setActionLoading(true);

    const unmarked = batchStudents.filter(
      (s) => !attendanceRecords.some((a) => a.studentId === s.id)
    );

    for (const s of unmarked) {
      await dataService.recordAttendance({
        studentId: s.id,
        sessionId: currentSession.id,
        batchId: currentSession.batchId,
        status: 'ABSENT',
        recordedBy: currentUser.uid,
      });
    }

    const updated = await dataService.getAttendanceForSession(currentSession.id);
    setAttendanceRecords(updated);
    setActionLoading(false);
  };

  const handleSaveCorrection = async () => {
    if (!correctingRecord || !currentUser || !correctionReason.trim()) return;
    setActionLoading(true);
    try {
      const now = new Date().toISOString();
      const updates: Partial<AttendanceRecord> = { status: correctionStatus };

      if (correctionStatus === 'PRESENT' && !correctingRecord.arrivalAt) {
        updates.arrivalAt = now;
      } else if (correctionStatus === 'LEFT' && !correctingRecord.departureAt) {
        updates.departureAt = now;
      }

      const updated = await dataService.correctAttendance(
        correctingRecord.id,
        updates,
        correctionReason,
        currentUser.uid
      );

      setAttendanceRecords((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
      setCorrectingRecord(null);
      setCorrectionReason('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to correct record.';
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading live attendance ledger..." />;
  }

  // Attendance metrics
  const presentCount = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
  const leftCount = attendanceRecords.filter((a) => a.status === 'LEFT').length;
  const absentCount = attendanceRecords.filter((a) => a.status === 'ABSENT').length;
  const totalMarked = attendanceRecords.length;
  const notMarkedCount = Math.max(0, batchStudents.length - totalMarked);

  const filteredStudents = batchStudents.filter((s) =>
    s.fullName.toLowerCase().includes(filterQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Session Selector & Quick Stats Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Mark Attendance</h2>
              {currentSession && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                  {currentSession.status}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Deterministic per-session records. Automatic arrival classification (On-Time / Late) based on grace period.
            </p>
          </div>

          {/* Session Picker Dropdown */}
          <div className="w-full sm:w-80">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Active Class Session
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => handleSessionChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl cursor-pointer font-medium"
            >
              {sessions.map((sess) => {
                const b = batches.find((item) => item.id === sess.batchId);
                return (
                  <option key={sess.id} value={sess.id}>
                    {formatDate(sess.sessionDate)} • {b?.name || sess.batchId} ({formatTimeOnly(sess.scheduledStartAt)})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
            <span className="text-xl font-extrabold text-emerald-700">{presentCount}</span>
            <p className="text-[11px] font-bold text-emerald-800 uppercase mt-0.5">Present</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
            <span className="text-xl font-extrabold text-amber-700">{leftCount}</span>
            <p className="text-[11px] font-bold text-amber-800 uppercase mt-0.5">Left Early</p>
          </div>
          <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-center">
            <span className="text-xl font-extrabold text-red-700">{absentCount}</span>
            <p className="text-[11px] font-bold text-red-800 uppercase mt-0.5">Absent</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-xl font-extrabold text-slate-700">{notMarkedCount}</span>
            <p className="text-[11px] font-bold text-slate-500 uppercase mt-0.5">Unmarked</p>
          </div>
        </div>
      </div>

      {/* Roster & Attendance Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Sub-header with search and bulk action */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-600" />
            <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Batch Roster ({batchStudents.length} Students)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search student in batch..."
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
            {notMarkedCount > 0 && (
              <button
                onClick={handleBulkMarkAbsent}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Mark Remaining Absent
              </button>
            )}
          </div>
        </div>

        {/* Student Rows */}
        <div className="divide-y divide-slate-100">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No students found for this batch roster.
            </div>
          ) : (
            filteredStudents.map((student) => {
              const record = attendanceRecords.find((a) => a.studentId === student.id);
              const status = record?.status || 'NOT_MARKED';

              return (
                <div
                  key={student.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition"
                >
                  {/* Student Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{student.fullName}</span>
                      <span className="font-mono text-[10px] text-slate-400">{student.id}</span>
                      {record?.arrivalClassification && record.arrivalClassification !== 'NOT_APPLICABLE' && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            record.arrivalClassification === 'ON_TIME'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {record.arrivalClassification}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                      <span>Status: <strong className="text-slate-700">{status}</strong></span>
                      {record?.arrivalAt && (
                        <span>Arrival: {formatTimeOnly(record.arrivalAt)}</span>
                      )}
                      {record?.departureAt && (
                        <span>Left: {formatTimeOnly(record.departureAt)}</span>
                      )}
                    </div>
                  </div>

                  {/* 1-Tap Action Buttons (mobile-friendly min 44px) */}
                  <div className="flex items-center gap-1.5">
                    {/* Mark Present */}
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleMark(student.id, 'PRESENT')}
                      className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        status === 'PRESENT'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Present
                    </button>

                    {/* Mark Left (Allowed only after Present) */}
                    <button
                      type="button"
                      disabled={actionLoading || (status !== 'PRESENT' && status !== 'LEFT')}
                      onClick={() => handleMark(student.id, 'LEFT')}
                      className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                        status === 'LEFT'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                      title={status !== 'PRESENT' && status !== 'LEFT' ? 'Must be PRESENT first' : 'Mark departure'}
                    >
                      <LogOut className="w-4 h-4" />
                      Left Early
                    </button>

                    {/* Mark Absent */}
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleMark(student.id, 'ABSENT')}
                      className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        status === 'ABSENT'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      Absent
                    </button>

                    {/* Admin Correction Tool */}
                    {record && (
                      <button
                        type="button"
                        onClick={() => {
                          setCorrectingRecord(record);
                          setCorrectionStatus(record.status);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-700 rounded-lg text-xs"
                        title="Audit & Correct Record"
                      >
                        Correct
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Audited Attendance Correction Modal */}
      {correctingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Audited Attendance Correction</h3>
            <p className="text-xs text-slate-500">
              All corrections are logged to <code className="font-mono bg-slate-100 p-0.5 rounded">auditLogs</code> with previous state, reason, and admin signature.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adjust Status To
                </label>
                <select
                  value={correctionStatus}
                  onChange={(e) => setCorrectionStatus(e.target.value as AttendanceStatus)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="LEFT">LEFT (Early Departure)</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correction Reason (Mandatory Audit Note)
                </label>
                <textarea
                  required
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Student arrived with teacher permission due to school bus delay..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCorrectingRecord(null)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading || !correctionReason.trim()}
                  onClick={handleSaveCorrection}
                  className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : 'Apply Correction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
