import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { dataService } from '../../services/data-service';
import { Batch } from '../../types';
import { rupeesToPaise } from '../../utils/currency';
import { validateStudentInput } from '../../utils/validation';
import { getTodayDateString } from '../../utils/dates';
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export const StudentFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [fullName, setFullName] = useState('');
  const [grade, setGrade] = useState('Grade 10');
  const [schoolName, setSchoolName] = useState('');
  const [batchId, setBatchId] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState(getTodayDateString());
  const [feeRupees, setFeeRupees] = useState<number>(2000);

  useEffect(() => {
    const loadBatches = async () => {
      const bList = await dataService.getBatches();
      setBatches(bList);
      if (bList.length > 0) {
        setBatchId(bList[0].id);
      }
    };
    loadBatches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const monthlyFeePaise = rupeesToPaise(Number(feeRupees) || 0);

    const validation = validateStudentInput({
      fullName,
      grade,
      batchId,
      enrollmentDate,
      monthlyFeePaise,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      await dataService.createStudent({
        fullName: fullName.trim(),
        grade: grade.trim(),
        schoolName: schoolName.trim() || undefined,
        batchId,
        enrollmentDate,
        monthlyFeePaise,
        active: true,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/students');
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to enroll student.';
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/students"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
          aria-label="Back to student list"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Enroll New Student</h2>
          <p className="text-xs text-slate-500">
            Create student profile, assign academic batch, and establish monthly tuition fee structure.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Student enrolled successfully! Redirecting to directory...</span>
          </div>
        )}

        {errors.form && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{errors.form}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none transition ${
                errors.fullName ? 'border-red-500 focus:ring-2 focus:ring-red-400' : 'border-slate-200 focus:ring-2 focus:ring-orange-500'
              }`}
            />
            {errors.fullName && <p className="text-[11px] text-red-600 mt-1">{errors.fullName}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Grade / Class <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g. Grade 10"
                className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none transition ${
                  errors.grade ? 'border-red-500' : 'border-slate-200 focus:ring-2 focus:ring-orange-500'
                }`}
              />
              {errors.grade && <p className="text-[11px] text-red-600 mt-1">{errors.grade}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                School Name (Optional)
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g. Delhi Public School"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Batch <span className="text-red-500">*</span>
              </label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none cursor-pointer transition ${
                  errors.batchId ? 'border-red-500' : 'border-slate-200 focus:ring-2 focus:ring-orange-500'
                }`}
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.startTime} - {b.endTime})
                  </option>
                ))}
              </select>
              {errors.batchId && <p className="text-[11px] text-red-600 mt-1">{errors.batchId}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enrollment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={enrollmentDate}
                onChange={(e) => setEnrollmentDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none transition ${
                  errors.enrollmentDate ? 'border-red-500' : 'border-slate-200 focus:ring-2 focus:ring-orange-500'
                }`}
              />
              {errors.enrollmentDate && <p className="text-[11px] text-red-600 mt-1">{errors.enrollmentDate}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Monthly Tuition Fee (₹ INR) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">₹</span>
              <input
                type="number"
                min="0"
                step="50"
                required
                value={feeRupees}
                onChange={(e) => setFeeRupees(Number(e.target.value))}
                placeholder="2000"
                className={`w-full pl-8 pr-3.5 py-2.5 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none transition ${
                  errors.monthlyFeePaise ? 'border-red-500' : 'border-slate-200 focus:ring-2 focus:ring-orange-500'
                }`}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Stored securely as {(feeRupees * 100).toLocaleString()} integer paise to guarantee zero rounding errors.
            </p>
            {errors.monthlyFeePaise && <p className="text-[11px] text-red-600 mt-1">{errors.monthlyFeePaise}</p>}
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Link
              to="/admin/students"
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || success}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Enrolling...' : 'Save & Enroll Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
