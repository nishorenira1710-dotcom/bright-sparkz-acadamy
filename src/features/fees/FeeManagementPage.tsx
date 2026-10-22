import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dataService } from '../../services/data-service';
import { FeeSummary, Batch } from '../../types';
import { formatINR } from '../../utils/currency';
import { formatDate, getMonthName } from '../../utils/dates';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import {
  CreditCard,
  PlusCircle,
  Receipt,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';

export const FeeManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [feeSummaries, setFeeSummaries] = useState<FeeSummary[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Month & Year filter
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Batch fee generator modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genBatchId, setGenBatchId] = useState('');
  const [genDueDate, setGenDueDate] = useState('2026-10-10');
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [summaries, bList] = await Promise.all([
        dataService.getFeeSummaries(selectedMonth, selectedYear),
        dataService.getBatches(),
      ]);
      setFeeSummaries(summaries);
      setBatches(bList);
      if (bList.length > 0 && !genBatchId) {
        setGenBatchId(bList[0].id);
      }
    } catch (err) {
      console.error('Failed to load fee summaries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const handleGenerateBatchFees = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genBatchId) return;

    setGenLoading(true);
    setGenResult(null);
    try {
      const count = await dataService.generateMonthlyFeesForBatch(
        genBatchId,
        selectedMonth,
        selectedYear,
        genDueDate
      );
      setGenResult(`Successfully generated ${count} fee obligations for the selected batch.`);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generation failed.';
      setGenResult(`Error: ${msg}`);
    } finally {
      setGenLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Calculating fee obligations and ledger balances..." />;
  }

  // Filtered summaries
  const filteredSummaries = feeSummaries.filter((f) => {
    if (statusFilter && f.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        f.studentName.toLowerCase().includes(q) ||
        f.feeRecord.studentId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalDuePaise = filteredSummaries.reduce((acc, f) => acc + f.feeRecord.amountDuePaise, 0);
  const totalCollectedPaise = filteredSummaries.reduce((acc, f) => acc + f.totalPaidPaise, 0);
  const totalBalancePaise = Math.max(0, totalDuePaise - totalCollectedPaise);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Fee Management</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-800 rounded-full">
              {getMonthName(selectedMonth)} {selectedYear}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Student fee obligations, batch generation, and real-time payment settlement ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setGenResult(null);
              setShowGenerateModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-xs transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Batch Fee Generator
          </button>
          <Link
            to="/admin/payments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-slate-600" />
            Record Payment
          </Link>
        </div>
      </div>

      {/* Financial Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Billed</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{formatINR(totalDuePaise)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{filteredSummaries.length} fee records</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Collected</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatINR(totalCollectedPaise)}</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
            {totalDuePaise > 0 ? `${Math.round((totalCollectedPaise / totalDuePaise) * 100)}% collection rate` : '—'}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Outstanding Balance</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{formatINR(totalBalancePaise)}</p>
          <p className="text-[11px] text-amber-700 font-medium mt-0.5">Pending collection</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        {/* Month selector */}
        <div className="w-36">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
              <option key={m} value={m}>
                {getMonthName(m)}
              </option>
            ))}
          </select>
        </div>

        {/* Year selector */}
        <div className="w-28">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
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
            <option value="UNPAID">UNPAID</option>
            <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
            <option value="PAID">PAID</option>
            <option value="OVERPAID">OVERPAID</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student name or ID..."
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Fee Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Billing Period</th>
                <th className="py-3 px-4">Amount Due</th>
                <th className="py-3 px-4">Amount Paid</th>
                <th className="py-3 px-4">Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No fee records found for this billing period. Use the Batch Fee Generator above to generate monthly obligations.
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((f) => (
                  <tr key={f.feeRecord.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/admin/students/${f.feeRecord.studentId}`}
                        className="font-bold text-slate-900 hover:text-orange-600 block"
                      >
                        {f.studentName}
                      </Link>
                      <span className="font-mono text-[10px] text-slate-400">
                        {f.feeRecord.studentId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span>{getMonthName(f.feeRecord.billingMonth)} {f.feeRecord.billingYear}</span>
                      <span className="block text-[10px] text-slate-400">
                        Due: {formatDate(f.feeRecord.dueDate)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatINR(f.feeRecord.amountDuePaise)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">
                      {formatINR(f.totalPaidPaise)}
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      <span className={f.balancePaise > 0 ? 'text-amber-600' : 'text-slate-600'}>
                        {formatINR(f.balancePaise)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          f.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : f.status === 'PARTIALLY_PAID'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : f.status === 'OVERPAID'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/admin/payments?studentId=${f.feeRecord.studentId}&feeId=${f.feeRecord.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-xs transition cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        Collect
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Fee Generator Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Generate Batch Monthly Fees</h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Creates fee obligations for all active students assigned to the selected batch based on each student's configured monthly fee amount.
            </p>

            {genResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  genResult.startsWith('Error')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{genResult}</span>
              </div>
            )}

            <form onSubmit={handleGenerateBatchFees} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Batch
                </label>
                <select
                  value={genBatchId}
                  onChange={(e) => setGenBatchId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Billing Period
                </label>
                <input
                  type="text"
                  disabled
                  value={`${getMonthName(selectedMonth)} ${selectedYear}`}
                  className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fee Due Date
                </label>
                <input
                  type="date"
                  required
                  value={genDueDate}
                  onChange={(e) => setGenDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={genLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl cursor-pointer"
                >
                  {genLoading ? 'Generating...' : 'Run Generation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
