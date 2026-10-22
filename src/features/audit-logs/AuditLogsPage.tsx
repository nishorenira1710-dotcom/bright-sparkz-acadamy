import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/data-service';
import { AuditLog } from '../../types';
import { formatDateTime } from '../../utils/dates';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { ScrollText, ShieldCheck, Search, Filter } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadLogs = async () => {
      try {
        const list = await dataService.getAuditLogs(150);
        if (isMounted) setLogs(list);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadLogs();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <LoadingSpinner message="Retrieving administrative audit trail..." />;
  }

  const filtered = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.performedBy.toLowerCase().includes(q) ||
      log.targetCollection.toLowerCase().includes(q) ||
      log.targetId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Audit Trail</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-slate-100 text-slate-800 rounded-full font-mono">
              {filtered.length} Entries
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable chronological logging of administrative corrections, financial adjustments, and exit operations.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, administrator, collection, or record ID..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-orange-600">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {log.performedBy}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{log.targetCollection}</span>
                      <span className="block font-mono text-[10px] text-slate-400 truncate max-w-[150px]">
                        {log.targetId}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <pre className="font-mono text-[10px] bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-slate-600 max-w-xs overflow-x-auto">
                        {JSON.stringify(log.details)}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
