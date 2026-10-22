import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { dataService } from '../../services/data-service';
import {
  Student,
  Batch,
  ParentStudentLink,
  AttendanceRecord,
  FeeRecord,
  Payment,
  UserProfile,
} from '../../types';
import { formatINR } from '../../utils/currency';
import { formatDate, formatTimeOnly } from '../../utils/dates';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { PrintableReceipt } from '../../components/receipts/PrintableReceipt';
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  Users,
  ClipboardCheck,
  CreditCard,
  Receipt,
  UserMinus,
  CheckCircle,
  Clock,
  Printer,
  AlertTriangle,
} from 'lucide-react';

export const StudentDetailPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [links, setLinks] = useState<ParentStudentLink[]>([]);
  const [parents, setParents] = useState<UserProfile[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Editing state
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [editName, setEditName] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [editBatchId, setEditBatchId] = useState('');
  const [editFeeRupees, setEditFeeRupees] = useState<number>(0);
  const [saveLoading, setSaveLoading] = useState(false);

  // Receipt preview modal state
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<Payment | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadDetails = async () => {
      if (!studentId) return;
      try {
        const [stud, bList, parentLinks, parentProfiles, attList, feeList, payList] = await Promise.all([
          dataService.getStudentById(studentId),
          dataService.getBatches(),
          dataService.getParentStudentLinks(undefined, studentId),
          dataService.getAllParents(),
          dataService.getAttendanceForStudent(studentId),
          dataService.getFeeRecords(studentId),
          dataService.getPayments(studentId),
        ]);

        if (!isMounted) return;
        setStudent(stud);
        setAllBatches(bList);
        setLinks(parentLinks);
        setParents(parentProfiles);
        setAttendance(attList);
        setFees(feeList);
        setPayments(payList);

        if (stud) {
          const matchedBatch = bList.find((b) => b.id === stud.batchId) || null;
          setBatch(matchedBatch);
          setEditName(stud.fullName);
          setEditGrade(stud.grade);
          setEditSchool(stud.schoolName || '');
          setEditBatchId(stud.batchId);
          setEditFeeRupees(stud.monthlyFeePaise / 100);
        }
      } catch (err) {
        console.error('Error loading student details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDetails();
    return () => {
      isMounted = false;
    };
  }, [studentId]);

  if (loading) {
    return <LoadingSpinner message="Loading student dossier..." />;
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <h3 className="text-base font-bold text-slate-800">Student Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">The requested student record does not exist.</p>
        <Link to="/admin/students" className="mt-4 inline-block text-xs font-semibold text-orange-600">
          ← Back to Students
        </Link>
      </div>
    );
  }

  const handleSaveEdit = async () => {
    if (!studentId) return;
    setSaveLoading(true);
    try {
      const updated = await dataService.updateStudent(studentId, {
        fullName: editName,
        grade: editGrade,
        schoolName: editSchool || undefined,
        batchId: editBatchId,
        monthlyFeePaise: Math.round(editFeeRupees * 100),
      });
      setStudent(updated);
      setBatch(allBatches.find((b) => b.id === updated.batchId) || null);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update student:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  // Metrics
  const presentCount = attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LEFT').length;
  const absentCount = attendance.filter((a) => a.status === 'ABSENT').length;
  const totalAttSessions = presentCount + absentCount;
  const attendancePercent = totalAttSessions > 0 ? Math.round((presentCount / totalAttSessions) * 100) : 100;

  const totalFeesDue = fees.reduce((acc, f) => acc + f.amountDuePaise, 0);
  const totalPaid = payments
    .filter((p) => p.status === 'CONFIRMED')
    .reduce((acc, p) => acc + p.amountPaise, 0);
  const balance = totalFeesDue - totalPaid;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/students"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{student.fullName}</h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {student.id}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  student.active
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {student.active ? 'ACTIVE' : 'EXITED'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Enrolled: {formatDate(student.enrollmentDate)} • Grade {student.grade}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              <Edit2 className="w-4 h-4 text-slate-600" />
              Edit Student
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saveLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {saveLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {student.active && (
            <Link
              to={`/admin/student-exit?studentId=${student.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition cursor-pointer"
            >
              <UserMinus className="w-4 h-4" />
              Student Exit Workflow
            </Link>
          )}
        </div>
      </div>

      {/* Editing Drawer / Box if Active */}
      {isEditing && (
        <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-200 space-y-4 animate-in fade-in duration-150">
          <h4 className="text-xs font-bold text-orange-950 uppercase tracking-wider">
            Edit Student Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Grade / Class
              </label>
              <input
                type="text"
                value={editGrade}
                onChange={(e) => setEditGrade(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                School Name
              </label>
              <input
                type="text"
                value={editSchool}
                onChange={(e) => setEditSchool(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Assigned Batch
              </label>
              <select
                value={editBatchId}
                onChange={(e) => setEditBatchId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl cursor-pointer"
              >
                {allBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Monthly Fee (₹ INR)
              </label>
              <input
                type="number"
                value={editFeeRupees}
                onChange={(e) => setEditFeeRupees(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Batch</p>
          <p className="text-sm font-bold text-slate-900 mt-1 truncate">
            {batch?.name || 'Unassigned'}
          </p>
          <p className="text-[10px] text-slate-400">{batch?.startTime} - {batch?.endTime}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Attendance Ratio</p>
          <p className="text-2xl font-extrabold text-orange-600 mt-1">{attendancePercent}%</p>
          <p className="text-[10px] text-slate-400">{presentCount} of {totalAttSessions} sessions present</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Monthly Fee Plan</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{formatINR(student.monthlyFeePaise)}</p>
          <p className="text-[10px] text-slate-400">Fixed monthly rate</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Current Balance</p>
          <p
            className={`text-2xl font-extrabold mt-1 ${
              balance > 0 ? 'text-amber-600' : 'text-emerald-600'
            }`}
          >
            {formatINR(balance)}
          </p>
          <p className="text-[10px] text-slate-400">
            {balance > 0 ? 'Pending dues' : balance < 0 ? 'Overpaid / Credit' : 'Fully settled'}
          </p>
        </div>
      </div>

      {/* Two Columns: Linked Parents & Attendance History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Linked Parents & Guardians */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-600" />
              Linked Parents
            </h3>
            <Link
              to="/admin/parents"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              Manage →
            </Link>
          </div>

          {links.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
              No parent account linked yet. Link a parent to grant portal access.
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => {
                const pProfile = parents.find((p) => p.uid === link.parentUid);
                return (
                  <div key={link.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {pProfile?.displayName || link.parentUid}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {link.relationship}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{pProfile?.email}</p>
                    {pProfile?.phoneNumber && (
                      <p className="text-[11px] text-slate-500">{pProfile.phoneNumber}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right (2 Cols): Attendance Log */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-orange-600" />
              Attendance Record ({attendance.length} sessions logged)
            </h3>
            <span className="text-xs text-slate-500">Retained permanently</span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {attendance.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No attendance sessions recorded yet for this student.
              </div>
            ) : (
              attendance.map((att) => (
                <div key={att.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        Session: {att.sessionId}
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
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            att.arrivalClassification === 'ON_TIME'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {att.arrivalClassification}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {att.arrivalAt && `Arrival: ${formatTimeOnly(att.arrivalAt)}`}
                      {att.departureAt && ` • Departure: ${formatTimeOnly(att.departureAt)}`}
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
      </div>

      {/* Payment History & Receipts */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            Confirmed Payment Transactions
          </h3>
          <Link
            to="/admin/payments"
            className="text-xs font-semibold text-orange-600 hover:text-orange-700"
          >
            Record Payment →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-4">Receipt No</th>
                <th className="py-2.5 px-4">Amount</th>
                <th className="py-2.5 px-4">Method</th>
                <th className="py-2.5 px-4">Payment Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No payment transactions recorded for this student yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600 text-sm">{formatINR(p.amountPaise)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{p.method}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(p.paymentDate)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.status === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedPaymentForReceipt(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" /> View Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedPaymentForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <PrintableReceipt
            payment={selectedPaymentForReceipt}
            student={student}
            feeRecord={fees.find((f) => f.id === selectedPaymentForReceipt.feeRecordId)}
            onClose={() => setSelectedPaymentForReceipt(null)}
          />
        </div>
      )}
    </div>
  );
};
