import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { dataService } from '../../services/data-service';
import { Student, ParentStudentLink } from '../../types';
import { User, Mail, Phone, Shield, GraduationCap, CheckCircle2 } from 'lucide-react';

export const ParentProfilePage: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [links, setLinks] = useState<ParentStudentLink[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      const parentLinks = await dataService.getParentStudentLinks(currentUser.uid);
      setLinks(parentLinks);

      const list: Student[] = [];
      for (const l of parentLinks) {
        const s = await dataService.getStudentById(l.studentId);
        if (s) list.push(s);
      }
      setChildren(list);
    };
    load();
  }, [currentUser]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Parent Account Profile</h2>
        <p className="text-xs text-slate-500 mt-1">
          Authorized contact credentials and child guardian links.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-2xl ring-8 ring-blue-50/50">
            {currentUser?.displayName ? currentUser.displayName[0] : 'P'}
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">{currentUser?.displayName}</h3>
            <p className="text-xs text-slate-500">{currentUser?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
              Role: {role}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registered Email (Immutable ID)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                disabled
                value={currentUser?.email || ''}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Primary Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                disabled
                value={currentUser?.phoneNumber || 'Not provided'}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              To update contact numbers or add additional guardians, please contact the tuition administrator.
            </p>
          </div>
        </div>

        {/* Linked Children Summary */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-orange-600" />
            Verified Linked Children ({children.length})
          </h4>

          <div className="space-y-2">
            {children.map((c) => {
              const link = links.find((l) => l.studentId === c.id);
              return (
                <div
                  key={c.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">{c.fullName}</span>
                    <span className="text-slate-400 text-[10px] ml-2">({c.grade})</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {link?.relationship || 'Parent'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
