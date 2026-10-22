import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { dataService } from '../../services/data-service';
import { Student, Payment, FeeRecord } from '../../types';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/dates';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { PrintableReceipt } from '../../components/receipts/PrintableReceipt';
import { Receipt, Printer, CheckCircle, Search } from 'lucide-react';

export const ParentPaymentsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<Payment | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
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
          const [pList, fList] = await Promise.all([
            dataService.getPayments(initialId),
            dataService.getFeeRecords(initialId),
          ]);
          if (isMounted) {
            setPayments(pList);
            setFees(fList);
          }
        }
      } catch (err) {
        console.error('Error loading parent payments:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleSelectChild = async (id: string) => {
    setSelectedChildId(id);
    const [pList, fList] = await Promise.all([
      dataService.getPayments(id),
      dataService.getFeeRecords(id),
    ]);
    setPayments(pList);
    setFees(fList);
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving confirmed payment receipts..." />;
  }

  const activeChild = children.find((c) => c.id === selectedChildId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Payment History</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
              {payments.length} Transactions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Confirmed tuition fee payments and printable tax receipts for your child.
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Receipt No</th>
                <th className="py-3 px-4">Amount Paid</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No payment transactions recorded for this child yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                    <td className="py-3 px-4 font-extrabold text-sm text-emerald-600">
                      {formatINR(p.amountPaise)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{p.method}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(p.paymentDate)}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{p.reference || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedPaymentForReceipt(p)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition cursor-pointer"
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
