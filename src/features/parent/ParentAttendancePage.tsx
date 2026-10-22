import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { dataService } from '../../services/data-service';
import { Student, AttendanceRecord } from '../../types';
import { formatDate, formatTimeOnly } from '../../utils/dates';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ClipboardCheck, CheckCircle2, XCircle, LogOut, Clock, Calendar } from 'lucide-react';

export const ParentAttendancePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!currentUser) return;
      try {
        const links = await dataService.getParentStudentLinks(currentUser.uid);
        const childList: Student[] = [];
        for (const l of links) {
          const s = await dataService.getStudentById(l.studentId);
          if (s) childList.push(s);
        }
        if (!isMounted) return;
        setChildren(childList);

        if (childList.length > 0) {
          const initialId = childList[0].id;
          setSelectedChildId(initialId);
          const att = await dataService.getAttendanceForStudent(initialId);
          if (isMounted) setAttendance(att);
        }
      } catch (err) {
        console.error('Error loading child attendance:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleSelectChild = async (id: string) => {
    setSelectedChildId(id);
    const att = await dataService.getAttendanceForStudent(id);
    setAttendance(att);
  };

  if (loading) {
    return <LoadingSpinner message="Loading child attendance history..." />;
  }

  const activeChild = children.find((c) => c.id === selectedChildId);

  const presentCount = attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LEFT').length;
  const onTimeCount = attendance.filter((a) => a.arrivalClassification === 'ON_TIME').length;
  const lateCount = attendance.filter((a) => a.arrivalClassification === 'LATE').length;
  const absentCount = attendance.filter((a) => a.status === 'ABSENT').length;
  const total = attendance.length;
  const attRatio = total > 0 ? Math.round((presentCount / total) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Attendance Record</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-800 rounded-full">
              {attRatio}% Attendance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete arrival and departure logs for your child. Permanent historical preservation.
          </p>
        </div>

        {children.length > 1 && (
          <div className="w-full sm:w-56">
            <select
              value={selectedChildId}
              onChange={(e) => handleSelectChild(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer"
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.grade})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
          <span className="text-2xl font-extrabold text-orange-600">{attRatio}%</span>
          <p className="text-[11px] font-bold text-slate-500 uppercase mt-1">Attendance Rate</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
          <span className="text-2xl font-extrabold text-emerald-600">{onTimeCount}</span>
          <p className="text-[11px] font-bold text-emerald-700 uppercase mt-1">On-Time Arrivals</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
          <span className="text-2xl font-extrabold text-amber-600">{lateCount}</span>
          <p className="text-[11px] font-bold text-amber-700 uppercase mt-1">Late Arrivals</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
          <span className="text-2xl font-extrabold text-red-600">{absentCount}</span>
          <p className="text-[11px] font-bold text-red-700 uppercase mt-1">Absences</p>
        </div>
      </div>

      {/* Attendance History Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-orange-600" />
            Class Session Log for {activeChild?.fullName}
          </h3>
          <span className="text-xs text-slate-400">{attendance.length} Total Sessions</span>
        </div>

        <div className="divide-y divide-slate-100">
          {attendance.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No class attendance logged yet for this child.
            </div>
          ) : (
            attendance.map((att) => (
              <div
                key={att.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      Session {att.sessionId}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        att.status === 'PRESENT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : att.status === 'LEFT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {att.status}
                    </span>
                    {att.arrivalClassification !== 'NOT_APPLICABLE' && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          att.arrivalClassification === 'ON_TIME'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {att.arrivalClassification}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500">
                    {att.arrivalAt && `Arrival: ${formatTimeOnly(att.arrivalAt)}`}
                    {att.departureAt && ` • Left Early: ${formatTimeOnly(att.departureAt)}`}
                  </p>
                </div>

                <div className="text-right text-xs text-slate-500">
                  <p className="font-semibold text-slate-800">{formatDate(att.createdAt)}</p>
                  <p className="text-[10px] text-slate-400">Logged by Admin</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
