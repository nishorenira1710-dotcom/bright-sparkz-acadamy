import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { dataService } from '../../services/data-service';
import { Student, FeeRecord, Payment } from '../../types';
import { formatINR, getDerivedFeeStatus } from '../../utils/currency';
import { formatDate, getMonthName } from '../../utils/dates';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ParentFeesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

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
          const [fList, pList] = await Promise.all([
            dataService.getFeeRecords(initialId),
            dataService.getPayments(initialId),
          ]);
          if (isMounted) {
            setFees(fList);
            setPayments(pList);
          }
        }
      } catch (err) {
        console.error('Error loading parent fees:', err);
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
    const [fList, pList] = await Promise.all([
      dataService.getFeeRecords(id),
      dataService.getPayments(id),
    ]);
    setFees(fList);
    setPayments(pList);
  };

  if (loading) {
    return <LoadingSpinner message="Loading fee ledger and invoices..." />;
  }

  const activeChild = children.find((c) => c.id === selectedChildId);

  const totalDue = fees.reduce((acc, f) => acc + f.amountDuePaise, 0);
  const totalPaid = payments
    .filter((p) => p.status === 'CONFIRMED')
    .reduce((acc, p) => acc + p.amountPaise, 0);
  const balance = totalDue - totalPaid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Fee Ledger</h2>
            <span
              className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                balance > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {balance > 0 ? 'Dues Outstanding' : 'All Clear'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monthly tuition fee obligations, due dates, payment status, and historical ledgers.
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Billed Fees</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{formatINR(totalDue)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across all billing periods</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Confirmed Paid</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatINR(totalPaid)}</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Verified cash & UPI payments</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Remaining Balance</span>
          <p className={`text-2xl font-extrabold mt-1 ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {formatINR(balance)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {balance > 0 ? 'Payment due to center' : 'No balance due'}
          </p>
        </div>
      </div>

      {/* Monthly Fee Invoices */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-orange-600" />
            Monthly Tuition Invoices for {activeChild?.fullName}
          </h3>
          <Link
            to="/parent/receipts"
            className="text-xs font-semibold text-orange-600 hover:text-orange-700"
          >
            Download Receipts →
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {fees.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No fee invoices issued yet for this child.
            </div>
          ) : (
            fees.map((fee) => {
              const feePayments = payments.filter(
                (p) => p.feeRecordId === fee.id && p.status === 'CONFIRMED'
              );
              const paidAmount = feePayments.reduce((acc, p) => acc + p.amountPaise, 0);
              const feeBal = fee.amountDuePaise - paidAmount;
              const status = getDerivedFeeStatus(fee.amountDuePaise, paidAmount);

              return (
                <div
                  key={fee.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {getMonthName(fee.billingMonth)} {fee.billingYear} Tuition Fee
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : status === 'PARTIALLY_PAID'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      Due Date: <strong className="text-slate-700">{formatDate(fee.dueDate)}</strong>
                      {fee.description && ` • ${fee.description}`}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Amount Due</span>
                      <span className="font-bold text-slate-900">{formatINR(fee.amountDuePaise)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Paid</span>
                      <span className="font-bold text-emerald-600">{formatINR(paidAmount)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Balance</span>
                      <span className={`font-bold ${feeBal > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
                        {formatINR(feeBal)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
