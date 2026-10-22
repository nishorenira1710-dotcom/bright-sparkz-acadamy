import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { dataService } from '../../services/data-service';
import { Announcement, Student } from '../../types';
import { formatDate } from '../../utils/dates';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Megaphone, Calendar, Users } from 'lucide-react';

export const ParentAnnouncementsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadAnnouncements = async () => {
      if (!currentUser) return;
      try {
        const links = await dataService.getParentStudentLinks(currentUser.uid);
        let batchId: string | undefined = undefined;
        if (links.length > 0) {
          const s = await dataService.getStudentById(links[0].studentId);
          if (s) batchId = s.batchId;
        }

        const list = await dataService.getAnnouncements(batchId);
        if (isMounted) setAnnouncements(list);
      } catch (err) {
        console.error('Error loading parent announcements:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadAnnouncements();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  if (loading) {
    return <LoadingSpinner message="Checking center broadcast notices..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Center Notices</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-800 rounded-full">
              {announcements.length} Notices
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Exam dates, extra class announcements, holiday schedules, and academic updates.
          </p>
        </div>
      </div>

      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No Notices Active"
          description="There are currently no active announcements for your child's batch."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 uppercase">
                  {a.targetAudience === 'ALL' ? 'All Parents' : 'Batch Targeted'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {formatDate(a.publishedAt)}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900">{a.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-line">
                  {a.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
