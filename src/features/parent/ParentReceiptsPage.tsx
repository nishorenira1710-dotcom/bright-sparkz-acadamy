import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { dataService } from '../../services/data-service';
import { Student, Payment, FeeRecord, TuitionCenterSettings } from '../../types';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/dates';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { PrintableReceipt } from '../../components/receipts/PrintableReceipt';
import { ScrollText, Printer, CheckCircle } from 'lucide-react';

export const ParentReceiptsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [settings, setSettings] = useState<TuitionCenterSettings | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<Payment | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!currentUser) return;
      try {
        const [links, setts] = await Promise.all([
          dataService.getParentStudentLinks(currentUser.uid),
          dataService.getSettings(),
        ]);
        const childList: Student[] = [];
        for (const l of links) {
          const s = await dataService.getStudentById(l.studentId);
          if (s) childList.push(s);
        }
        if (!isMounted) return;
        setChildren(childList);
        setSettings(setts);

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
        console.error('Error loading parent receipts:', err);
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
    return <LoadingSpinner message="Retrieving official child receipts..." />;
  }

  const activeChild = children.find((c) => c.id === selectedChildId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Official Fee Receipts</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
              {payments.length} Available
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Printable computer-generated vouchers containing tuition center accreditation and payment references.
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {payments.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            No receipts generated for this student yet.
          </div>
        ) : (
          payments.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded-lg">
                    {p.receiptNumber}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    {p.method}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900">{activeChild?.fullName}</h4>
                  <p className="text-xs text-slate-500">{activeChild?.grade}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Amount Paid:</span>
                  <span className="text-base font-extrabold text-emerald-600">{formatINR(p.amountPaise)}</span>
                </div>

                <p className="text-[11px] text-slate-500">
                  Payment Date: <strong className="text-slate-700">{formatDate(p.paymentDate)}</strong>
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => setActiveReceipt(p)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> View & Print Receipt
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <PrintableReceipt
            payment={activeReceipt}
            student={activeChild}
            feeRecord={fees.find((f) => f.id === activeReceipt.feeRecordId)}
            settings={settings}
            onClose={() => setActiveReceipt(null)}
          />
        </div>
      )}
    </div>
  );
};
