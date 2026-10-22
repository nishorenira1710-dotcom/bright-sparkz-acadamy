import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/data-service';
import { Student, Batch, AttendanceRecord, FeeSummary, Payment } from '../../types';
import { formatINR } from '../../utils/currency';
import { formatDate, getMonthName } from '../../utils/dates';
import { downloadCSV } from '../../utils/csv';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import {
  BarChart3,
  Download,
  Printer,
  Users,
  CreditCard,
  ClipboardCheck,
  Calendar,
  Filter,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [feeSummaries, setFeeSummaries] = useState<FeeSummary[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'ATTENDANCE' | 'FINANCE'>('DIRECTORY');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [studs, bList, attList, fList, payList] = await Promise.all([
          dataService.getStudents({ activeOnly: false }),
          dataService.getBatches(),
          dataService.getAttendanceForStudent(''), // All attendance or empty
          dataService.getFeeSummaries(),
          dataService.getPayments(),
        ]);
        if (!isMounted) return;
        setStudents(studs);
        setBatches(bList);
        setAttendance(attList);
        setFeeSummaries(fList);
        setPayments(payList);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <LoadingSpinner message="Generating aggregated tuition intelligence..." />;
  }

  const exportStudentDirectoryCSV = () => {
    const headers = ['Student ID', 'Full Name', 'Grade', 'School', 'Batch', 'Enrollment Date', 'Monthly Fee (INR)', 'Active'];
    const rows = students.map((s) => {
      const b = batches.find((batch) => batch.id === s.batchId);
      return [
        s.id,
        s.fullName,
        s.grade,
        s.schoolName || '—',
        b?.name || 'Unassigned',
        s.enrollmentDate,
        (s.monthlyFeePaise / 100).toFixed(2),
        s.active ? 'YES' : 'NO',
      ];
    });
    downloadCSV(`student_directory_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const exportFinancialReportCSV = () => {
    const headers = ['Student ID', 'Student Name', 'Billing Month', 'Billing Year', 'Amount Due (INR)', 'Paid (INR)', 'Balance (INR)', 'Status'];
    const rows = feeSummaries.map((f) => [
      f.feeRecord.studentId,
      f.studentName,
      f.feeRecord.billingMonth,
      f.feeRecord.billingYear,
      (f.feeRecord.amountDuePaise / 100).toFixed(2),
      (f.totalPaidPaise / 100).toFixed(2),
      (f.balancePaise / 100).toFixed(2),
      f.status,
    ]);
    downloadCSV(`fee_ledger_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const exportPaymentsCSV = () => {
    const headers = ['Receipt No', 'Student ID', 'Amount (INR)', 'Method', 'Payment Date', 'Status', 'Reference'];
    const rows = payments.map((p) => [
      p.receiptNumber,
      p.studentId,
      (p.amountPaise / 100).toFixed(2),
      p.method,
      p.paymentDate,
      p.status,
      p.reference || '—',
    ]);
    downloadCSV(`payments_ledger_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const activeStudents = students.filter((s) => s.active);
  const inactiveStudents = students.filter((s) => !s.active);
  const totalBilledPaise = feeSummaries.reduce((acc, f) => acc + f.feeRecord.amountDuePaise, 0);
  const totalCollectedPaise = feeSummaries.reduce((acc, f) => acc + f.totalPaidPaise, 0);
  const totalOutstandingPaise = Math.max(0, totalBilledPaise - totalCollectedPaise);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-800 rounded-full">
              Export Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated directories, batch attendance distributions, and financial collection statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            Print Report
          </button>
          <button
            onClick={() => {
              if (activeTab === 'DIRECTORY') exportStudentDirectoryCSV();
              else if (activeTab === 'FINANCE') exportFinancialReportCSV();
              else exportPaymentsCSV();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveTab('DIRECTORY')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'DIRECTORY'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Student Directory ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('FINANCE')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'FINANCE'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Monthly Collection & Balances
        </button>
        <button
          onClick={() => setActiveTab('ATTENDANCE')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'ATTENDANCE'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" /> Batch Enrollment Breakdown
        </button>
      </div>

      {/* Tab 1: Student Directory */}
      {activeTab === 'DIRECTORY' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Enrolled</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{students.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase">Active Students</span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">{activeStudents.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase">Exited Students</span>
              <p className="text-2xl font-extrabold text-slate-500 mt-1">{inactiveStudents.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Grade & School</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Enrollment Date</th>
                  <th className="py-3 px-4">Monthly Fee</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.slice(0, 30).map((s) => {
                  const b = batches.find((batch) => batch.id === s.batchId);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4">
                        <span className="font-bold text-slate-900 block">{s.fullName}</span>
                        <span className="font-mono text-[10px] text-slate-400">{s.id}</span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {s.grade} {s.schoolName ? `• ${s.schoolName}` : ''}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">{b?.name || 'Unassigned'}</td>
                      <td className="py-2.5 px-4 text-slate-500">{formatDate(s.enrollmentDate)}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{formatINR(s.monthlyFeePaise)}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            s.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {s.active ? 'ACTIVE' : 'EXITED'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Financial Statements */}
      {activeTab === 'FINANCE' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Monthly Billed</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{formatINR(totalBilledPaise)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Fees Collected</span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatINR(totalCollectedPaise)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Outstanding</span>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">{formatINR(totalOutstandingPaise)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Billing Month</th>
                  <th className="py-3 px-4">Due (INR)</th>
                  <th className="py-3 px-4">Paid (INR)</th>
                  <th className="py-3 px-4">Outstanding (INR)</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feeSummaries.map((f) => (
                  <tr key={f.feeRecord.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{f.studentName}</td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {getMonthName(f.feeRecord.billingMonth)} {f.feeRecord.billingYear}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      {formatINR(f.feeRecord.amountDuePaise)}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-emerald-600">
                      {formatINR(f.totalPaidPaise)}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-amber-600">
                      {formatINR(f.balancePaise)}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Batch Enrollment Breakdown */}
      {activeTab === 'ATTENDANCE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {batches.map((b) => {
            const batchStuds = students.filter((s) => s.batchId === b.id);
            const totalBatchFees = batchStuds.reduce((acc, s) => acc + s.monthlyFeePaise, 0);

            return (
              <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-sm text-slate-900">{b.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {b.grade}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                  <div>
                    <span className="text-slate-500">Enrolled Students:</span>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">{batchStuds.length}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Monthly Run Rate:</span>
                    <p className="text-base font-extrabold text-emerald-600 mt-0.5">{formatINR(totalBatchFees)}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Schedule: <strong className="text-slate-700">{b.startTime} - {b.endTime}</strong> (Grace: {b.defaultGracePeriodMinutes}m)
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
