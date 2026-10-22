import React from 'react';
import { Payment, Student, FeeRecord, TuitionCenterSettings } from '../../types';
import { formatINR } from '../../utils/currency';
import { formatDate, formatDateTime } from '../../utils/dates';
import { CenterLogo } from '../logo/CenterLogo';
import { Printer, X, CheckCircle, ShieldCheck } from 'lucide-react';

interface PrintableReceiptProps {
  payment: Payment;
  student?: Student | null;
  feeRecord?: FeeRecord | null;
  settings?: TuitionCenterSettings | null;
  onClose?: () => void;
}

export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({
  payment,
  student,
  feeRecord,
  settings,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const centerName = settings?.centerName || 'Bright Sparkz Academy';
  const address = settings?.address || 'No. 42, Academic Boulevard, Bangalore, Karnataka 560034';
  const phone = settings?.phoneNumber || '+91 98450 12345';
  const email = settings?.email || 'admin@brightsparkz.edu';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-w-xl mx-auto">
      {/* Action Header (Hidden during print) */}
      <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-sm">Official Fee Receipt</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Printable Area */}
      <div id="printable-receipt-area" className="p-6 sm:p-8 space-y-6 bg-white text-slate-900">
        {/* Receipt Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <CenterLogo logoUrl={settings?.logoUrl} name={centerName} size="lg" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">{centerName}</h2>
              <p className="text-xs text-slate-500 max-w-xs">{address}</p>
              <p className="text-xs text-slate-500">Phone: {phone} | Email: {email}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md uppercase tracking-wider">
              {payment.status === 'CONFIRMED' ? 'Confirmed Receipt' : 'Reversed'}
            </span>
            <p className="mt-2 text-xs font-mono font-semibold text-slate-800">
              No: {payment.receiptNumber}
            </p>
            <p className="text-xs text-slate-500">
              Date: {formatDate(payment.paymentDate)}
            </p>
          </div>
        </div>

        {/* Student & Bill Details Grid */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <p className="text-slate-500 font-medium">Student Name:</p>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{student?.fullName || 'Student Record'}</p>
            <p className="text-slate-500 mt-1">Student ID: <span className="font-mono text-slate-700">{student?.id || payment.studentId}</span></p>
            {student?.grade && <p className="text-slate-500">Grade: {student.grade}</p>}
          </div>
          <div>
            <p className="text-slate-500 font-medium">Billing Period:</p>
            <p className="font-bold text-slate-900 text-sm mt-0.5">
              {feeRecord ? `Month ${feeRecord.billingMonth}/${feeRecord.billingYear}` : 'Regular Tuition'}
            </p>
            <p className="text-slate-500 mt-1">Payment Method: <span className="font-semibold text-slate-800">{payment.method}</span></p>
            {payment.reference && (
              <p className="text-slate-500 truncate">Ref: <span className="font-mono text-slate-700">{payment.reference}</span></p>
            )}
          </div>
        </div>

        {/* Financial Line Item Table */}
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Amount (INR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-3">
                <span className="font-semibold text-slate-800">
                  {feeRecord?.description || 'Tuition Fee Payment'}
                </span>
                {payment.notes && <p className="text-slate-500 text-[11px] mt-0.5">{payment.notes}</p>}
              </td>
              <td className="py-3 text-right font-bold text-slate-900 text-sm">
                {formatINR(payment.amountPaise)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-900">
              <td className="py-3 text-xs font-bold text-slate-900 uppercase">Total Amount Received</td>
              <td className="py-3 text-right text-base font-extrabold text-orange-600">
                {formatINR(payment.amountPaise)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Footer Notes & Signature */}
        <div className="pt-4 border-t border-slate-200 flex items-end justify-between text-xs">
          <div className="max-w-xs text-slate-500 text-[11px] leading-relaxed">
            <p className="font-semibold text-slate-700">Notice:</p>
            <p>{settings?.receiptNotes || 'This is a computer-generated receipt from the Tuition Center Management System. Fees once paid are subject to tuition center policies.'}</p>
          </div>
          <div className="text-center">
            <div className="h-10 border-b border-slate-300 w-36 mb-1"></div>
            <p className="text-[11px] font-semibold text-slate-700">Authorized Signature</p>
            <p className="text-[10px] text-slate-400">Head Tutor / Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
};
