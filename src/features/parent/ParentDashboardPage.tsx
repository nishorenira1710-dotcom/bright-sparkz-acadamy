import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { dataService } from '../../services/data-service';
import {
  Student,
  ParentStudentLink,
  AttendanceRecord,
  FeeRecord,
  Payment,
  Announcement,
  Batch,
} from '../../types';
import { formatINR } from '../../utils/currency';
import { formatDate, formatTimeOnly } from '../../utils/dates';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { PrintableReceipt } from '../../components/receipts/PrintableReceipt';
import {
  Users,
  ClipboardCheck,
  CreditCard,
  Receipt,
  Megaphone,
  Bell,
  ArrowRight,
  Printer,
  ChevronDown,
  Sparkles,
  GraduationCap,
} from 'lucide-react';

export const ParentDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<ParentStudentLink[]>([]);
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Receipt modal state
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<Payment | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadParentData = async () => {
      if (!currentUser) return;
      try {
        const parentLinks = await dataService.getParentStudentLinks(currentUser.uid);
        if (!isMounted) return;
        setLinks(parentLinks);

        // Fetch children
        const childRecords: Student[] = [];
        for (const l of parentLinks) {
          const s = await dataService.getStudentById(l.studentId);
          if (s) childRecords.push(s);
        }
        setChildren(childRecords);

        const activeId = childRecords.length > 0 ? childRecords[0].id : '';
        setSelectedChildId(activeId);

        const [bList, anns] = await Promise.all([
          dataService.getBatches(),
          dataService.getAnnouncements(childRecords[0]?.batchId),
        ]);
        setBatches(bList);
        setAnnouncements(anns);

        if (activeId) {
          const [att, fList, pList] = await Promise.all([
            dataService.getAttendanceForStudent(activeId),
            dataService.getFeeRecords(activeId),
            dataService.getPayments(activeId),
          ]);
          if (isMounted) {
            setAttendance(att);
            setFees(fList);
            setPayments(pList);
          }
        }
      } catch (err) {
        console.error('Error loading parent portal:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadParentData();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleChildChange = async (childId: string) => {
    setSelectedChildId(childId);
    const child = children.find((c) => c.id === childId);
    if (!child) return;

    try {
      const [att, fList, pList, anns] = await Promise.all([
        dataService.getAttendanceForStudent(childId),
        dataService.getFeeRecords(childId),
        dataService.getPayments(childId),
        dataService.getAnnouncements(child.batchId),
      ]);
      setAttendance(att);
      setFees(fList);
      setPayments(pList);
      setAnnouncements(anns);
    } catch (err) {
      console.error('Failed to switch child data:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Securing child academic portal..." />;
  }

  const activeChild = children.find((c) => c.id === selectedChildId) || null;
  const activeBatch = batches.find((b) => b.id === activeChild?.batchId) || null;

  // Child metrics
  const presentCount = attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LEFT').length;
  const totalAtt = attendance.length;
  const attRatio = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 100;

  const totalDuePaise = fees.reduce((acc, f) => acc + f.amountDuePaise, 0);
  const totalPaidPaise = payments
    .filter((p) => p.status === 'CONFIRMED')
    .reduce((acc, p) => acc + p.amountPaise, 0);
  const balancePaise = totalDuePaise - totalPaidPaise;

  return (
    <div className="space-y-6">
      {/* Welcome & Child Switcher Bar */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-5 sm:p-6 text-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase bg-white/20 px-2.5 py-1 rounded-full">
              Parent Portal
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold mt-2 tracking-tight">
              Welcome, {currentUser?.displayName}
            </h2>
            <p className="text-xs text-orange-100 mt-1">
              Real-time attendance tracking and verified fee receipts for your enrolled children.
            </p>
          </div>

          {/* Child Switcher (if multiple linked children) */}
          {children.length > 1 ? (
            <div className="bg-white/10 backdrop-blur-xs p-2 rounded-xl border border-white/20">
              <label className="block text-[10px] uppercase font-bold text-orange-200 mb-1">
                Viewing Child Profile:
              </label>
              <select
                value={selectedChildId}
                onChange={(e) => handleChildChange(e.target.value)}
                className="bg-white text-slate-900 font-bold text-xs px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.grade})
                  </option>
                ))}
              </select>
            </div>
          ) : activeChild ? (
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/20">
              <p className="text-[10px] uppercase font-bold text-orange-200">Enrolled Student</p>
              <p className="font-bold text-sm text-white">{activeChild.fullName}</p>
              <p className="text-[11px] text-orange-100">{activeChild.grade} • {activeBatch?.name}</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* KPI Cards for Selected Child */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Attendance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Attendance Record
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-orange-600 mt-2">
            {attRatio}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {presentCount} of {totalAtt} class sessions attended
          </p>
        </div>

        {/* Outstanding Dues */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Fee Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-2xl sm:text-3xl font-extrabold mt-2 ${
              balancePaise > 0 ? 'text-amber-600' : 'text-emerald-600'
            }`}
          >
            {formatINR(balancePaise)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {balancePaise > 0 ? 'Pending monthly clearance' : 'All obligations settled in full'}
          </p>
        </div>

        {/* Total Confirmed Paid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Confirmed Fees Paid
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">
            {formatINR(totalPaidPaise)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {payments.filter((p) => p.status === 'CONFIRMED').length} verified receipts issued
          </p>
        </div>
      </div>

      {/* Two Column Layout: Recent Attendance & Confirmed Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-orange-600" />
              Recent Attendance
            </h3>
            <Link
              to="/parent/attendance"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              All History →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {attendance.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No attendance logs recorded yet for this child.
              </div>
            ) : (
              attendance.slice(0, 5).map((att) => (
                <div key={att.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {att.status}
                      </span>
                      {att.arrivalClassification && att.arrivalClassification !== 'NOT_APPLICABLE' && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            att.arrivalClassification === 'ON_TIME'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {att.arrivalClassification}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {att.arrivalAt && `Arrival: ${formatTimeOnly(att.arrivalAt)}`}
                      {att.departureAt && ` • Left: ${formatTimeOnly(att.departureAt)}`}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatDate(att.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Confirmed Receipts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              Verified Receipts
            </h3>
            <Link
              to="/parent/receipts"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              View All →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {payments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No confirmed payment receipts yet.
              </div>
            ) : (
              payments.slice(0, 5).map((p) => (
                <div key={p.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{p.receiptNumber}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700">
                        {p.method}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{formatDate(p.paymentDate)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-600 text-sm">{formatINR(p.amountPaise)}</span>
                    <button
                      onClick={() => setSelectedPaymentForReceipt(p)}
                      className="p-1 text-slate-400 hover:text-orange-600 rounded transition cursor-pointer"
                      title="Print receipt"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Announcements For Child's Batch */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-orange-600" />
            Center Notices & Timetables
          </h3>
          <Link
            to="/parent/announcements"
            className="text-xs font-semibold text-orange-600 hover:text-orange-700"
          >
            All Notices →
          </Link>
        </div>

        <div className="p-4 space-y-3">
          {announcements.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No active notices for your child's batch.</p>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">{a.title}</h4>
                  <span className="text-[10px] text-slate-400">{formatDate(a.publishedAt)}</span>
                </div>
                <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">{a.message}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {selectedPaymentForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <PrintableReceipt
            payment={selectedPaymentForReceipt}
            student={activeChild}
            feeRecord={fees.find((f) => f.id === selectedPaymentForReceipt.feeRecordId)}
            onClose={() => setSelectedPaymentForReceipt(null)}
          />
        </div>
      )}
    </div>
  );
};
