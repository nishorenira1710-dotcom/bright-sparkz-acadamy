import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dataService } from '../../services/data-service';
import { Student, Batch } from '../../types';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/dates';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { EmptyState } from '../../components/feedback/EmptyState';
import {
  Users,
  Search,
  Filter,
  PlusCircle,
  Eye,
  Edit2,
  ChevronLeft,
  ChevronRight,
  UserMinus,
  CheckCircle,
} from 'lucide-react';

export const StudentListPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Filter states
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('ACTIVE');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [studs, bList] = await Promise.all([
          dataService.getStudents({ activeOnly: false }),
          dataService.getBatches(),
        ]);
        if (!isMounted) return;
        setStudents(studs);
        setBatches(bList);
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading student records..." />;
  }

  // Filter logic
  const filteredStudents = students.filter((s) => {
    if (activeFilter === 'ACTIVE' && !s.active) return false;
    if (activeFilter === 'INACTIVE' && s.active) return false;
    if (gradeFilter && s.grade !== gradeFilter) return false;
    if (batchFilter && s.batchId !== batchFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.schoolName && s.schoolName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const grades = Array.from(new Set(students.map((s) => s.grade))).sort();

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Student Directory</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-800 rounded-full">
              {filteredStudents.length} Students
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Search, manage batches, review attendance history, and configure tuition fee plans.
          </p>
        </div>

        <Link
          to="/admin/students/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-xs transition cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Enroll New Student
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search student name, ID or school..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>

        {/* Grade Filter */}
        <div className="w-full sm:w-40">
          <select
            value={gradeFilter}
            onChange={(e) => {
              setGradeFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by Grade"
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="">All Grades</option>
            {grades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Batch Filter */}
        <div className="w-full sm:w-52">
          <select
            value={batchFilter}
            onChange={(e) => {
              setBatchFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by Batch"
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none cursor-pointer truncate"
          >
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-32">
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by Status"
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Exited / Inactive</option>
            <option value="ALL">All Records</option>
          </select>
        </div>
      </div>

      {/* Student Cards (Responsive grid on mobile / table on desktop) */}
      {paginatedStudents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Students Found"
          description="Try adjusting your search criteria or enroll a new student to begin."
          actionLabel="Enroll Student"
          onAction={() => (window.location.href = '/admin/students/new')}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Grade & School</th>
                  <th className="py-3 px-4">Assigned Batch</th>
                  <th className="py-3 px-4">Monthly Fee</th>
                  <th className="py-3 px-4">Enrolled On</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.map((s) => {
                  const batch = batches.find((b) => b.id === s.batchId);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/admin/students/${s.id}`}
                          className="font-bold text-slate-900 hover:text-orange-600 block"
                        >
                          {s.fullName}
                        </Link>
                        <span className="font-mono text-[10px] text-slate-400">{s.id}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="font-semibold text-slate-800">{s.grade}</span>
                        {s.schoolName && (
                          <span className="block text-[11px] text-slate-400 truncate max-w-xs">
                            {s.schoolName}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <span className="font-medium text-xs truncate max-w-xs block">
                          {batch?.name || 'Unassigned'}
                        </span>
                        <span className="text-[10px] text-slate-400">{batch?.subject}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatINR(s.monthlyFeePaise)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{formatDate(s.enrollmentDate)}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${s.active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {s.active ? 'Active' : 'Exited'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/students/${s.id}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition"
                            title="View Student Dossier"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/admin/students/${s.id}?edit=true`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Edit Student Info"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (optimized for non-technical administrator on phone) */}
          <div className="md:hidden divide-y divide-slate-100">
            {paginatedStudents.map((s) => {
              const batch = batches.find((b) => b.id === s.batchId);
              return (
                <div key={s.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        to={`/admin/students/${s.id}`}
                        className="font-bold text-sm text-slate-900 hover:text-orange-600"
                      >
                        {s.fullName}
                      </Link>
                      <span className="block font-mono text-[10px] text-slate-400">{s.id}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {s.active ? 'Active' : 'Exited'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <p className="flex justify-between">
                      <span>Grade:</span>
                      <span className="font-semibold text-slate-800">{s.grade}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Batch:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[200px]">
                        {batch?.name || 'Unassigned'}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span>Monthly Fee:</span>
                      <span className="font-bold text-slate-900">{formatINR(s.monthlyFeePaise)}</span>
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <Link
                      to={`/admin/students/${s.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 transition"
                    >
                      Dossier
                    </Link>
                    <Link
                      to={`/admin/students/${s.id}?edit=true`}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Page <span className="font-semibold text-slate-800">{currentPage}</span> of{' '}
                <span className="font-semibold text-slate-800">{totalPages}</span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
