import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { dataService } from '../../services/data-service';
import { Student, Batch, ParentStudentLink } from '../../types';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/dates';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Users, GraduationCap, Calendar, Clock, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ParentChildrenPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [links, setLinks] = useState<ParentStudentLink[]>([]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!currentUser) return;
      try {
        const parentLinks = await dataService.getParentStudentLinks(currentUser.uid);
        if (!isMounted) return;
        setLinks(parentLinks);

        const childRecords: Student[] = [];
        for (const l of parentLinks) {
          const s = await dataService.getStudentById(l.studentId);
          if (s) childRecords.push(s);
        }
        setChildren(childRecords);

        const bList = await dataService.getBatches();
        setBatches(bList);
      } catch (err) {
        console.error('Failed to load children:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  if (loading) {
    return <LoadingSpinner message="Retrieving authorized child dossiers..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Linked Children</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
              {children.length} Enrolled
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official profile records, assigned academic batches, and fee structures authorized for your parent account.
          </p>
        </div>
      </div>

      {children.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Children Linked"
          description="Your parent account has not been linked to a student record yet. Please contact the tuition administrator."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {children.map((child) => {
            const batch = batches.find((b) => b.id === child.batchId);
            const link = links.find((l) => l.studentId === child.id);

            return (
              <div
                key={child.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-lg">
                      {child.fullName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{child.fullName}</h3>
                      <p className="text-xs text-slate-500">{child.grade} • {child.schoolName || 'Enrolled Student'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {link?.relationship || 'PARENT'}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-orange-600" /> Batch:
                    </span>
                    <span className="font-bold text-slate-900 truncate max-w-[200px]">
                      {batch?.name || 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" /> Class Hours:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {batch ? `${batch.startTime} - ${batch.endTime}` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" /> Enrolled Since:
                    </span>
                    <span className="text-slate-700">{formatDate(child.enrollmentDate)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500 font-semibold">Monthly Tuition Fee:</span>
                    <span className="text-sm font-extrabold text-slate-900">{formatINR(child.monthlyFeePaise)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Link
                    to="/parent/attendance"
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                  >
                    Attendance
                  </Link>
                  <Link
                    to="/parent/receipts"
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-xs transition"
                  >
                    Receipts
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
