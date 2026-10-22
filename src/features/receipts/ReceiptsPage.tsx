import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/data-service';
import { Payment, Student, FeeRecord, TuitionCenterSettings } from '../../types';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/dates';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { PrintableReceipt } from '../../components/receipts/PrintableReceipt';
import { ScrollText, Search, Printer, CheckCircle, FileText } from 'lucide-react';

export const ReceiptsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [settings, setSettings] = useState<TuitionCenterSettings | null>(null);
  const [search, setSearch] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [payList, sList, fList, setts] = await Promise.all([
          dataService.getPayments(),
          dataService.getStudents({ activeOnly: false }),
          dataService.getFeeRecords(),
          dataService.getSettings(),
        ]);
        if (!isMounted) return;
        setPayments(payList);
        setStudents(sList);
        setFees(fList);
        setSettings(setts);
      } catch (err) {
        console.error('Error loading receipts archive:', err);
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
    return <LoadingSpinner message="Loading receipts archive..." />;
  }

  const filtered = payments.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const s = students.find((item) => item.id === p.studentId);
    return (
      p.receiptNumber.toLowerCase().includes(q) ||
      p.studentId.toLowerCase().includes(q) ||
      (s && s.fullName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Receipts Archive</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
              {filtered.length} Official Receipts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official immutable computer-generated fee vouchers for student fee clearance and tax records.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search receipt number, student name, or ID..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Grid of Receipts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const student = students.find((s) => s.id === p.studentId);
          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs font-bold text-slate-900 px-2.5 py-1 bg-slate-100 rounded-lg">
                    {p.receiptNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.status === 'CONFIRMED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900">{student?.fullName || p.studentId}</h4>
                  <p className="text-xs text-slate-500">{student?.grade || 'Student'}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Amount Received:</span>
                  <span className="text-base font-extrabold text-slate-900">{formatINR(p.amountPaise)}</span>
                </div>

                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <p>Method: <strong className="text-slate-700">{p.method}</strong></p>
                  <p>Date: {formatDate(p.paymentDate)}</p>
                  {p.reference && <p className="truncate font-mono">Ref: {p.reference}</p>}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => setSelectedPayment(p)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  View & Print
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Printable Receipt Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <PrintableReceipt
            payment={selectedPayment}
            student={students.find((s) => s.id === selectedPayment.studentId)}
            feeRecord={fees.find((f) => f.id === selectedPayment.feeRecordId)}
            settings={settings}
            onClose={() => setSelectedPayment(null)}
          />
        </div>
      )}
    </div>
  );
};
