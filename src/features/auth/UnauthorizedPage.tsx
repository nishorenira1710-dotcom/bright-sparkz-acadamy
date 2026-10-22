import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const { role, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 text-center">
      <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mb-4 ring-8 ring-red-50">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
      <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed">
        You do not have permission to access this administrative resource. Your current account role is{' '}
        <span className="font-bold text-slate-800 uppercase">{role || 'GUEST'}</span>.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          to={isAdmin ? '/admin/dashboard' : '/parent/dashboard'}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 shadow-xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Authorized Dashboard
        </Link>
        <Link
          to="/login"
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition"
        >
          Switch Account
        </Link>
      </div>
    </div>
  );
};
