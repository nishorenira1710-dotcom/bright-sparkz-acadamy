import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/data-service';
import { UserProfile, Student, ParentStudentLink } from '../../types';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { ConfirmationModal } from '../../components/feedback/ConfirmationModal';
import {
  UserCheck,
  PlusCircle,
  Link2,
  Trash2,
  Search,
  Mail,
  Phone,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const ParentManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [parents, setParents] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [links, setLinks] = useState<ParentStudentLink[]>([]);
  const [search, setSearch] = useState('');

  // Link dialog state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedParentUid, setSelectedParentUid] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [relationshipType, setRelationshipType] = useState<'FATHER' | 'MOTHER' | 'GUARDIAN'>('FATHER');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // New parent state
  const [showNewParentModal, setShowNewParentModal] = useState(false);
  const [newParentName, setNewParentName] = useState('');
  const [newParentEmail, setNewParentEmail] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');
  const [newParentPassword, setNewParentPassword] = useState('');
  const [newParentAuthUid, setNewParentAuthUid] = useState('');

  // Unlink confirmation
  const [linkToDelete, setLinkToDelete] = useState<ParentStudentLink | null>(null);

  const loadData = async () => {
    try {
      const [parentList, studentList, linkList] = await Promise.all([
        dataService.getAllParents(),
        dataService.getStudents({ activeOnly: true }),
        dataService.getParentStudentLinks(),
      ]);
      setParents(parentList);
      setStudents(studentList);
      setLinks(linkList);
    } catch (err) {
      console.error('Failed to load parents & links:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading authorized parent accounts..." />;
  }

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!selectedParentUid || !selectedStudentId) {
      setModalError('Please select both a parent and a student.');
      return;
    }

    setModalLoading(true);
    try {
      await dataService.linkParentToStudent(
        selectedParentUid,
        selectedStudentId,
        relationshipType
      );
      await loadData();
      setShowLinkModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create parent-child link.';
      setModalError(msg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!newParentName || !newParentEmail) {
      setModalError('Name and email are required.');
      return;
    }

    setModalLoading(true);
    try {
      await dataService.createParentAccount({
        displayName: newParentName,
        email: newParentEmail,
        phoneNumber: newParentPhone || undefined,
        password: newParentPassword || undefined,
        authUid: newParentAuthUid || undefined,
      });
      await loadData();
      setShowNewParentModal(false);
      setNewParentName('');
      setNewParentEmail('');
      setNewParentPhone('');
      setNewParentPassword('');
      setNewParentAuthUid('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create parent account.';
      setModalError(msg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmUnlink = async () => {
    if (!linkToDelete) return;
    try {
      await dataService.removeParentStudentLink(linkToDelete.id);
      await loadData();
      setLinkToDelete(null);
    } catch (err) {
      console.error('Failed to unlink:', err);
    }
  };

  const filteredParents = parents.filter(
    (p) =>
      p.displayName.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.phoneNumber?.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Parent-Child Linking</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
              {parents.length} Authorized Parents
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic parent-child relationships governing role-based data isolation and access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewParentModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-slate-600" />
            New Parent Account
          </button>
          <button
            onClick={() => {
              if (parents.length > 0) setSelectedParentUid(parents[0].uid);
              if (students.length > 0) setSelectedStudentId(students[0].id);
              setShowLinkModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-xs transition cursor-pointer"
          >
            <Link2 className="w-4 h-4" />
            Link Child to Parent
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search parent by name, email or phone number..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Parents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredParents.map((parent) => {
          const linkedStudentLinks = links.filter((l) => l.parentUid === parent.uid);
          return (
            <div
              key={parent.uid}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{parent.displayName}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {parent.email}
                    </span>
                    {parent.phoneNumber && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {parent.phoneNumber}
                      </span>
                    )}
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-600 font-mono">
                  {parent.uid}
                </span>
              </div>

              {/* Linked Children List */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Linked Enrolled Children ({linkedStudentLinks.length})</span>
                </p>

                {linkedStudentLinks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No students linked to this account.</p>
                ) : (
                  <div className="space-y-2">
                    {linkedStudentLinks.map((link) => {
                      const student = students.find((s) => s.id === link.studentId);
                      return (
                        <div
                          key={link.id}
                          className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-orange-600" />
                            <div>
                              <span className="font-bold text-slate-900">
                                {student?.fullName || link.studentId}
                              </span>
                              <span className="text-slate-400 text-[10px] ml-1.5 font-mono">
                                ({link.studentId})
                              </span>
                              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-50 text-blue-700">
                                {link.relationship}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setLinkToDelete(link)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                            title="Unlink student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Link Child Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Link Child to Parent</h3>
            <p className="text-xs text-slate-500">
              Creates a verified relationship document in <code className="font-mono text-[10px] bg-slate-100 p-0.5 rounded">parentStudentLinks/{'{parentUid}_{studentId}'}</code>.
            </p>

            {modalError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parent Account
                </label>
                <select
                  value={selectedParentUid}
                  onChange={(e) => setSelectedParentUid(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                >
                  {parents.map((p) => (
                    <option key={p.uid} value={p.uid}>
                      {p.displayName} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enrolled Student
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.id} • {s.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relationship
                </label>
                <select
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value as 'FATHER' | 'MOTHER' | 'GUARDIAN')}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                >
                  <option value="FATHER">Father</option>
                  <option value="MOTHER">Mother</option>
                  <option value="GUARDIAN">Legal Guardian</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl cursor-pointer"
                >
                  {modalLoading ? 'Linking...' : 'Establish Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Parent Modal */}
      {showNewParentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Authorized Parent</h3>
            <p className="text-xs text-slate-500">
              Parent accounts have read-only access restricted solely to their verified children.
            </p>

            {modalError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateParent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newParentName}
                  onChange={(e) => setNewParentName(e.target.value)}
                  placeholder="e.g. Dr. Sunita Verma"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newParentEmail}
                  onChange={(e) => setNewParentEmail(e.target.value)}
                  placeholder="sunita.verma@example.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={newParentPhone}
                  onChange={(e) => setNewParentPhone(e.target.value)}
                  placeholder="+91 94480 99887"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parent Login Password (Recommended)
                </label>
                <input
                  type="password"
                  value={newParentPassword}
                  onChange={(e) => setNewParentPassword(e.target.value)}
                  placeholder="Min 6 characters (e.g. Parent@2026)"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Registers the parent in Firebase Authentication so they can immediately sign in at /login.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Or Existing Firebase Auth UID (Optional)
                </label>
                <input
                  type="text"
                  value={newParentAuthUid}
                  onChange={(e) => setNewParentAuthUid(e.target.value)}
                  placeholder="Only if created manually in Firebase Console"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewParentModal(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl cursor-pointer"
                >
                  {modalLoading ? 'Creating...' : 'Create Parent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Unlinking */}
      <ConfirmationModal
        isOpen={Boolean(linkToDelete)}
        title="Unlink Student from Parent"
        message="Are you sure you want to remove this parent-child link? The parent will immediately lose access to this student's attendance and fee records."
        confirmLabel="Unlink Student"
        isDestructive
        onConfirm={handleConfirmUnlink}
        onClose={() => setLinkToDelete(null)}
      />
    </div>
  );
};
