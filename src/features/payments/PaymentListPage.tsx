import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { dataService } from '../../services/data-service';
import { useAuth } from '../../hooks/useAuth';
import { Payment, Student, FeeRecord } from '../../types';
import { formatINR, rupeesToPaise } from '../../utils/currency';
import { formatDate, getTodayDateString } from '../../utils/dates';
import { validatePaymentInput } from '../../utils/validation';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { PrintableReceipt } from '../../components/receipts/PrintableReceipt';
import {
  Receipt,
  PlusCircle,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  RotateCcw,
  Printer,
  AlertCircle,
  X,
  CreditCard,
} from 'lucide-react';

export const PaymentListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Record payment dialog state
  const [showModal, setShowModal] = useState(false);
  const [modalStudentId, setModalStudentId] = useState('');
  const [modalFeeRecordId, setModalFeeRecordId] = useState('');
  const [modalAmountRupees, setModalAmountRupees] = useState<number>(1500);
  const [modalMethod, setModalMethod] = useState<'CASH' | 'UPI'>('UPI');
  const [modalDate, setModalDate] = useState(getTodayDateString());
  const [modalRef, setModalRef] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalErrors, setModalErrors] = useState<Record<string, string>>({});

  // Reversal dialog state
  const [reversingPayment, setReversingPayment] = useState<Payment | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  // Printable receipt state
  const [activeReceiptPayment, setActiveReceiptPayment] = useState<Payment | null>(null);

  const loadData = async () => {
    try {
      const [payList, sList, fList] = await Promise.all([
        dataService.getPayments(),
        dataService.getStudents({ activeOnly: false }),
        dataService.getFeeRecords(),
      ]);
      setPayments(payList);
      setStudents(sList);
      setFeeRecords(fList);

      const queryStudentId = searchParams.get('studentId');
      const queryFeeId = searchParams.get('feeId');
      if (queryStudentId) {
        setModalStudentId(queryStudentId);
        if (queryFeeId) setModalFeeRecordId(queryFeeId);
        setShowModal(true);
      } else if (sList.length > 0 && !modalStudentId) {
        setModalStudentId(sList[0].id);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStudentSelect = (studId: string) => {
    setModalStudentId(studId);
    const studentFees = feeRecords.filter((f) => f.studentId === studId);
    if (studentFees.length > 0) {
      setModalFeeRecordId(studentFees[0].id);
      setModalAmountRupees(studentFees[0].amountDuePaise / 100);
    } else {
      setModalFeeRecordId('');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalErrors({});
    if (!currentUser) return;

    const amountPaise = rupeesToPaise(Number(modalAmountRupees) || 0);
    const validation = validatePaymentInput({
      studentId: modalStudentId,
      feeRecordId: modalFeeRecordId,
      amountPaise,
      method: modalMethod,
      paymentDate: modalDate,
    });

    if (!validation.valid) {
      setModalErrors(validation.errors);
      return;
    }

    setModalLoading(true);
    try {
      const created = await dataService.recordPayment({
        studentId: modalStudentId,
        feeRecordId: modalFeeRecordId,
        amountPaise,
        method: modalMethod,
        paymentDate: modalDate,
        recordedBy: currentUser.uid,
        reference: modalRef.trim() || undefined,
        notes: modalNotes.trim() || undefined,
      });

      await loadData();
      setShowModal(false);
      setActiveReceiptPayment(created); // Automatically display generated receipt
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record payment.';
      setModalErrors({ form: msg });
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmReversal = async () => {
    if (!reversingPayment || !currentUser || !reversalReason.trim()) return;
    setModalLoading(true);
    try {
      await dataService.reversePayment(
        reversingPayment.id,
        reversalReason.trim(),
        currentUser.uid
      );
      await loadData();
      setReversingPayment(null);
      setReversalReason('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reversal failed.';
      alert(msg);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading financial transactions and receipts..." />;
  }

  const filteredPayments = payments.filter((p) => {
    if (methodFilter && p.method !== methodFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const s = students.find((stud) => stud.id === p.studentId);
      return (
        p.receiptNumber.toLowerCase().includes(q) ||
        p.studentId.toLowerCase().includes(q) ||
        (s && s.fullName.toLowerCase().includes(q)) ||
        (p.reference && p.reference.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const availableFeesForSelectedStudent = feeRecords.filter(
    (f) => f.studentId === modalStudentId
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Payment Collections</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
              {payments.length} Transactions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cash & UPI ledger, instant receipt generation, and controlled reversal audits.
          </p>
        </div>

        <button
          onClick={() => {
            setModalErrors({});
            setShowModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-xs transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Record New Payment
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        {/* Method filter */}
        <div className="w-36">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
          >
            <option value="">All Methods</option>
            <option value="UPI">UPI</option>
            <option value="CASH">CASH</option>
          </select>
        </div>

        {/* Status filter */}
        <div className="w-36">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="REVERSED">REVERSED</option>
          </select>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[220px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search receipt no, student, or txn reference..."
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Payment Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Receipt No</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method & Date</th>
                <th className="py-3 px-4">Reference / Notes</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No payment records match your filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const student = students.find((s) => s.id === p.studentId);
                  const isConfirmed = p.status === 'CONFIRMED';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {p.receiptNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">
                          {student?.fullName || p.studentId}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{p.studentId}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-sm text-emerald-600">
                        {formatINR(p.amountPaise)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="font-semibold text-slate-800">{p.method}</span>
                        <span className="block text-[10px] text-slate-400">
                          {formatDate(p.paymentDate)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {p.reference && <p className="font-mono text-[11px] text-slate-700">{p.reference}</p>}
                        {p.notes && <p className="text-[11px] text-slate-400 line-clamp-1">{p.notes}</p>}
                        {p.status === 'REVERSED' && (
                          <p className="text-[10px] text-red-600 font-medium mt-0.5">
                            Reversal: {p.reversalReason}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isConfirmed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setActiveReceiptPayment(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition cursor-pointer"
                            title="Print / View Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" /> Receipt
                          </button>
                          {isConfirmed && (
                            <button
                              onClick={() => {
                                setReversalReason('');
                                setReversingPayment(p);
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                              title="Audit Reversal"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Fee Payment</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalErrors.form && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalErrors.form}</span>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enrolled Student <span className="text-red-500">*</span>
                </label>
                <select
                  value={modalStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.id} • {s.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fee Obligation Record <span className="text-red-500">*</span>
                </label>
                {availableFeesForSelectedStudent.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    No active fee obligations for this student. Please generate fee record first under Fee Management.
                  </p>
                ) : (
                  <select
                    value={modalFeeRecordId}
                    onChange={(e) => setModalFeeRecordId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                  >
                    {availableFeesForSelectedStudent.map((f) => (
                      <option key={f.id} value={f.id}>
                        Month {f.billingMonth}/{f.billingYear} — Due: {formatINR(f.amountDuePaise)}
                      </option>
                    ))}
                  </select>
                )}
                {modalErrors.feeRecordId && (
                  <p className="text-[11px] text-red-600 mt-1">{modalErrors.feeRecordId}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount Received (₹ INR) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={modalAmountRupees}
                      onChange={(e) => setModalAmountRupees(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  {modalErrors.amountPaise && (
                    <p className="text-[11px] text-red-600 mt-1">{modalErrors.amountPaise}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={modalMethod}
                    onChange={(e) => setModalMethod(e.target.value as 'CASH' | 'UPI')}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl cursor-pointer font-semibold"
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="CASH">CASH (Physical Receipt)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reference / UPI Txn ID
                  </label>
                  <input
                    type="text"
                    value={modalRef}
                    onChange={(e) => setModalRef(e.target.value)}
                    placeholder="e.g. UPI/229048194812"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes / Counter Memo (Optional)
                </label>
                <input
                  type="text"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="e.g. Paid in full by father"
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
                  disabled={modalLoading || availableFeesForSelectedStudent.length === 0}
                  className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {modalLoading ? 'Confirming...' : 'Record Payment & Generate Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Reversal Modal */}
      {reversingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reverse Payment Transaction</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              In accordance with financial integrity rules, reversed payments are never permanently erased.
              The record will be marked REVERSED and audited with your mandatory explanation.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p>Receipt: <strong className="font-mono">{reversingPayment.receiptNumber}</strong></p>
              <p>Amount: <strong className="text-emerald-700">{formatINR(reversingPayment.amountPaise)}</strong></p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mandatory Reversal Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="e.g. Bank chargeback / Cash entry duplicate mistake..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReversingPayment(null)}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={modalLoading || !reversalReason.trim()}
                onClick={handleConfirmReversal}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl cursor-pointer disabled:opacity-50"
              >
                {modalLoading ? 'Reversing...' : 'Confirm Reversal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Viewer */}
      {activeReceiptPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <PrintableReceipt
            payment={activeReceiptPayment}
            student={students.find((s) => s.id === activeReceiptPayment.studentId)}
            feeRecord={feeRecords.find((f) => f.id === activeReceiptPayment.feeRecordId)}
            onClose={() => setActiveReceiptPayment(null)}
          />
        </div>
      )}
    </div>
  );
};
