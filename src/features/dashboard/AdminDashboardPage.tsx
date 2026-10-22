import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dataService } from '../../services/data-service';
import {
  Student,
  Batch,
  ClassSession,
  AttendanceRecord,
  FeeSummary,
  Payment,
  Announcement,
} from '../../types';
import { formatINR } from '../../utils/currency';
import { formatDate, formatTimeOnly } from '../../utils/dates';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import {
  Users,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  PlusCircle,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Megaphone,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [feeSummaries, setFeeSummaries] = useState<FeeSummary[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      try {
        const [studs, batchList, sessList, feeSums, pays, anns] = await Promise.all([
          dataService.getStudents({ activeOnly: true }),
          dataService.getBatches(),
          dataService.getClassSessions(),
          dataService.getFeeSummaries(),
          dataService.getPayments(),
          dataService.getAnnouncements(),
        ]);

        if (!isMounted) return;
        setStudents(studs);
        setBatches(batchList);
        setSessions(sessList);
        setFeeSummaries(feeSums);
        setRecentPayments(pays.slice(0, 5));
        setAnnouncements(anns.slice(0, 3));

        // Load attendance for the latest session
        if (sessList.length > 0) {
          const latestSess = sessList[0];
          const att = await dataService.getAttendanceForSession(latestSess.id);
          if (isMounted) setAttendance(att);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <LoadingSpinner message="Calculating tuition metrics..." />;
  }

  // Financial aggregates
  const totalExpectedPaise = feeSummaries.reduce((acc, f) => acc + f.feeRecord.amountDuePaise, 0);
  const totalCollectedPaise = feeSummaries.reduce((acc, f) => acc + f.totalPaidPaise, 0);
  const totalOutstandingPaise = Math.max(0, totalExpectedPaise - totalCollectedPaise);

  // Today's sessions
  const todaySessions = sessions.filter(s => s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS');

  // Attendance metrics for today's active session
  const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
  const absentCount = attendance.filter(a => a.status === 'ABSENT').length;
  const leftCount = attendance.filter(a => a.status === 'LEFT').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Center Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Managing <span className="font-semibold text-slate-800">{students.length} active students</span> across {batches.length} academic batches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/attendance"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-xs transition cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4" />
            Mark Attendance
          </Link>
          <Link
            to="/admin/payments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-slate-600" />
            Record Payment
          </Link>
          <Link
            to="/admin/students/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-slate-600" />
            Add Student
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Enrolled Students
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {students.length}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span>●</span> 100% Active Directory
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Expected Monthly Fees */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Monthly Expected
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {formatINR(totalExpectedPaise, false)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              October 2026 Billing
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Total Confirmed Payments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Fees Collected
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
              {formatINR(totalCollectedPaise, false)}
            </p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              Cash & Confirmed UPI
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Outstanding Dues */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Outstanding Dues
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
              {formatINR(totalOutstandingPaise, false)}
            </p>
            <p className="text-[11px] text-amber-700 font-medium mt-1">
              Pending Parent Clearance
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Today's Sessions & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Class Sessions & Attendance */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Class Sessions Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-sm text-slate-900">Today's Class Sessions</h3>
              </div>
              <Link
                to="/admin/sessions"
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                All sessions <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {sessions.slice(0, 3).map((sess) => {
                const batch = batches.find(b => b.id === sess.batchId);
                const isLive = sess.status === 'IN_PROGRESS';
                return (
                  <div key={sess.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition">
                    <div>
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
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {sess.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span>🕒 {formatTimeOnly(sess.scheduledStartAt)} - {formatTimeOnly(sess.scheduledEndAt)}</span>
                        <span>⏱️ Grace: {sess.gracePeriodMinutes} mins</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to="/admin/attendance"
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 shadow-xs transition"
                      >
                        {isLive ? 'Mark Attendance' : 'View Sheet'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attendance Stats Snapshot */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-orange-600" />
              Latest Session Attendance Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-xl font-extrabold text-emerald-700">{presentCount}</p>
                <p className="text-[11px] font-semibold text-emerald-800 mt-0.5">PRESENT</p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                <p className="text-xl font-extrabold text-red-700">{absentCount}</p>
                <p className="text-[11px] font-semibold text-red-800 mt-0.5">ABSENT</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xl font-extrabold text-amber-700">{leftCount}</p>
                <p className="text-[11px] font-semibold text-amber-800 mt-0.5">LEFT EARLY</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Payments & Announcements */}
        <div className="space-y-6">
          {/* Recent Payments */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-600" />
                Recent Payments
              </h3>
              <Link
                to="/admin/payments"
                className="text-xs font-semibold text-orange-600 hover:text-orange-700"
              >
                Ledger →
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentPayments.length === 0 ? (
                <div className="p-4 text-xs text-slate-400 text-center">No recent payments.</div>
              ) : (
                recentPayments.map((p) => {
                  const student = students.find(s => s.id === p.studentId);
                  return (
                    <div key={p.id} className="p-3.5 hover:bg-slate-50 transition text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{student?.fullName || p.studentId}</span>
                        <span className="font-extrabold text-emerald-600">{formatINR(p.amountPaise)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 text-[11px] mt-1">
                        <span className="font-mono">{p.receiptNumber}</span>
                        <span className="font-semibold text-slate-600">{p.method} • {formatDate(p.paymentDate)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Announcements */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-orange-600" />
                Center Announcements
              </h3>
              <Link
                to="/admin/announcements"
                className="text-xs font-semibold text-orange-600 hover:text-orange-700"
              >
                Manage →
              </Link>
            </div>

            <div className="p-4 space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <h4 className="font-bold text-slate-900">{a.title}</h4>
                  <p className="text-slate-600 text-[11px] mt-1 line-clamp-2 leading-relaxed">
                    {a.message}
                  </p>
                  <span className="inline-block mt-2 text-[10px] text-slate-400 font-medium">
                    {formatDate(a.publishedAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
