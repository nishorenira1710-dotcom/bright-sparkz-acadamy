import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { dataService } from '../../services/data-service';
import { useAuth } from '../../hooks/useAuth';
import { Student, StudentExitJob, ExitReport } from '../../types';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/dates';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { ConfirmationModal } from '../../components/feedback/ConfirmationModal';
import {
  UserMinus,
  AlertTriangle,
  FileCheck2,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Printer,
  ChevronRight,
  Database,
} from 'lucide-react';

export const StudentExitPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Workflow state machine
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [job, setJob] = useState<StudentExitJob | null>(null);
  const [report, setReport] = useState<ExitReport | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deletion double confirmation
  const [confirmNameInput, setConfirmNameInput] = useState('');
  const [deletionSuccessResult, setDeletionSuccessResult] = useState<{ recordsDeleted: number } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadStudents = async () => {
      try {
        const list = await dataService.getStudents({ activeOnly: true });
        if (!isMounted) return;
        setStudents(list);

        const paramId = searchParams.get('studentId');
        if (paramId && list.some((s) => s.id === paramId)) {
          setSelectedStudentId(paramId);
        } else if (list.length > 0) {
          setSelectedStudentId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load students for exit workflow:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadStudents();
    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || null;

  // Step 1 -> Step 2: Initiate Exit Job & Review
  const handleInitiateJob = async () => {
    if (!selectedStudent || !currentUser) return;
    setError(null);
    setActionLoading(true);
    try {
      const newJob = await dataService.initiateStudentExit(selectedStudent.id, currentUser.uid);
      setJob(newJob);
      setStep(2);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initiate exit job.';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Step 2 -> Step 3: Generate and Store Exit Report
  const handleGenerateReport = async () => {
    if (!job) return;
    setError(null);
    setActionLoading(true);
    try {
      const exitRep = await dataService.generateExitReport(job.id);
      setReport(exitRep);
      setStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to compile exit report.';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Step 3 -> Step 4: Verify Report Integrity in Isolated Storage
  const handleVerifyReport = async () => {
    if (!job || !report) return;
    setError(null);
    setActionLoading(true);
    try {
      const verified = await dataService.verifyExitReport(job.id, report.id);
      if (!verified) throw new Error('Report verification failed.');
      setStep(4);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed.';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Step 4 -> Step 5: Execute Permanent Deletion
  const handleExecuteDeletion = async () => {
    if (!job || !currentUser || !selectedStudent) return;
    if (confirmNameInput.trim().toLowerCase() !== selectedStudent.fullName.trim().toLowerCase()) {
      setError('Please type the exact student name to authorize permanent deletion.');
      return;
    }

    setError(null);
    setActionLoading(true);
    try {
      const result = await dataService.executeStudentDeletion(job.id, currentUser.uid);
      setDeletionSuccessResult(result);
      setStep(5);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deletion failed.';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Initializing student exit audit engine..." />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Workflow Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <UserMinus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Controlled Student Exit Workflow
            </h2>
            <p className="text-xs text-slate-500">
              High-security administrative offboarding. Generates an immutable audited dossier before purging operational documents.
            </p>
          </div>
        </div>

        {/* Multi-step Breadcrumb Tracker */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold overflow-x-auto gap-2">
          <span className={`px-2.5 py-1 rounded-lg ${step === 1 ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>
            1. Select Student
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className={`px-2.5 py-1 rounded-lg ${step === 2 ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>
            2. Review Dossier
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className={`px-2.5 py-1 rounded-lg ${step === 3 ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>
            3. Generate Report
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className={`px-2.5 py-1 rounded-lg ${step === 4 ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>
            4. Confirm & Purge
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className={`px-2.5 py-1 rounded-lg ${step === 5 ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>
            5. Audit Verification
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Select Student */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <h3 className="font-bold text-sm text-slate-900">Step 1: Select Student to Exit</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Select an enrolled student who is graduating, transferring, or exiting the tuition center. Simple client-side deletions are prohibited to prevent accidental data loss.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Active Student
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl cursor-pointer font-medium"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.id} • {s.grade} • Enrolled {formatDate(s.enrollmentDate)})
                </option>
              ))}
            </select>
          </div>

          {selectedStudent && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <p>Name: <strong className="text-slate-900">{selectedStudent.fullName}</strong></p>
              <p>Grade / Class: <strong className="text-slate-900">{selectedStudent.grade}</strong></p>
              <p>Monthly Rate: <strong className="text-slate-900">{formatINR(selectedStudent.monthlyFeePaise)}</strong></p>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleInitiateJob}
              disabled={actionLoading || !selectedStudent}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              Initiate Exit Review <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Review Manifest & Counts */}
      {step === 2 && job && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <h3 className="font-bold text-sm text-slate-900">Step 2: Manifest & Records Audit</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            The deletion manifest identifies all collections linked to <span className="font-semibold text-slate-800">{job.studentName}</span>.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-xl font-bold text-slate-900">{job.recordsCount?.attendance ?? '—'}</span>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Attendance Records</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-xl font-bold text-slate-900">{job.recordsCount?.feeRecords ?? '—'}</span>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Fee Records</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-xl font-bold text-slate-900">{job.recordsCount?.payments ?? '—'}</span>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Payments</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-xl font-bold text-slate-900">{job.recordsCount?.links ?? '—'}</span>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Parent Links</p>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> Next Step: Compilation of Final Exit Report
            </p>
            <p>
              Before deletion is permitted, an immutable Exit Report with final attendance percentage and payment summary must be stored in protected storage.
            </p>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <button
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Back
            </button>
            <button
              onClick={handleGenerateReport}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-xs transition cursor-pointer"
            >
              Generate Exit Report <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Generated Exit Report Review */}
      {step === 3 && report && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-start justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800 uppercase">
                Official Exit Dossier
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">{report.studentName}</h3>
              <p className="text-xs text-slate-500">
                Enrolled: {formatDate(report.enrollmentDate)} • Exit: {formatDate(report.exitDate)}
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              <Printer className="w-3.5 h-3.5" /> Print Dossier
            </button>
          </div>

          {/* Academic & Financial Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500">Present Sessions:</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">{report.presentCount}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500">Absent Sessions:</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">{report.absentCount}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500">Attendance Percentage:</span>
              <p className="text-base font-bold text-orange-600 mt-0.5">{report.attendancePercentage}%</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500">Total Billed:</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">{formatINR(report.totalFeesDuePaise)}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500">Total Paid:</span>
              <p className="text-base font-bold text-emerald-600 mt-0.5">{formatINR(report.totalConfirmedPaidPaise)}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500">Final Balance / Dues:</span>
              <p className="text-base font-bold text-amber-600 mt-0.5">{formatINR(report.outstandingBalancePaise)}</p>
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Back
            </button>
            <button
              onClick={handleVerifyReport}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-xs transition cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              Verify Report Storage & Proceed
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Double Confirmation & Permanent Purge */}
      {step === 4 && selectedStudent && (
        <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="font-bold text-base text-slate-900">Step 4: Confirm Permanent Deletion</h3>
          </div>

          <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800 space-y-2 leading-relaxed">
            <p className="font-bold">CRITICAL WARNING:</p>
            <p>
              This action will permanently delete student record <strong className="font-mono">{selectedStudent.id}</strong>, along with their associated attendance records, fee ledger entries, payment documents, and parent-child links.
            </p>
            <p>
              A verified exit report (<code className="font-mono bg-white/60 p-0.5 rounded">{report?.id}</code>) has been archived in protected storage.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              To confirm, type student's full name: <strong className="text-slate-900">{selectedStudent.fullName}</strong>
            </label>
            <input
              type="text"
              value={confirmNameInput}
              onChange={(e) => setConfirmNameInput(e.target.value)}
              placeholder={selectedStudent.fullName}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
            />
          </div>

          <div className="pt-2 flex justify-between items-center">
            <button
              onClick={() => setStep(3)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Back to Report
            </button>
            <button
              onClick={handleExecuteDeletion}
              disabled={
                actionLoading ||
                confirmNameInput.trim().toLowerCase() !== selectedStudent.fullName.trim().toLowerCase()
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-xs transition cursor-pointer disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
              {actionLoading ? 'Purging records...' : 'Permanently Purge Student Records'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Success & Audit Receipt */}
      {step === 5 && deletionSuccessResult && (
        <div className="bg-white p-8 rounded-2xl border border-emerald-200 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-slate-900">Student Exit Completed</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            All targeted operational documents ({deletionSuccessResult.recordsDeleted} records) have been safely purged. A verified audit receipt has been logged.
          </p>

          <div className="pt-4">
            <Link
              to="/admin/students"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-xs transition"
            >
              Return to Student Directory
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
