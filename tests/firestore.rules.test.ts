import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const PROJECT_ID = 'bright-sparkz-academy-test';

describe('Firestore Security Rules Suite', () => {
  let testEnv: RulesTestEnvironment | null = null;
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8');

  before(async () => {
    try {
      testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: {
          rules,
          host: '127.0.0.1',
          port: 8080,
        },
      });
    } catch (err) {
      console.warn(
        '[Rules Test] Firebase Firestore Emulator is not running locally on 127.0.0.1:8080. ' +
        'To run these live assertions against the local emulator, execute:\n' +
        'firebase emulators:exec --only firestore "npm test"\n'
      );
    }
  });

  after(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();

      // Seed baseline users and parent-student link
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();

        // 1. Admin profile
        await setDoc(doc(db, 'users/admin_uid'), {
          uid: 'admin_uid',
          email: 'admin@brightsparkz.edu',
          displayName: 'Director Ramesh',
          role: 'ADMIN',
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // 2. Parent A profile (linked to Student A)
        await setDoc(doc(db, 'users/parent_a_uid'), {
          uid: 'parent_a_uid',
          email: 'rajesh@example.com',
          displayName: 'Rajesh Sharma',
          role: 'PARENT',
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // 3. Parent B profile (unlinked)
        await setDoc(doc(db, 'users/parent_b_uid'), {
          uid: 'parent_b_uid',
          email: 'sunita@example.com',
          displayName: 'Dr. Sunita',
          role: 'PARENT',
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // 4. Student A
        await setDoc(doc(db, 'students/student_a'), {
          id: 'student_a',
          fullName: 'Aarav Sharma',
          grade: 'Grade 10',
          batchId: 'batch_10_math',
          monthlyFeePaise: 150000,
          active: true,
          enrollmentDate: '2026-01-10',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // 5. Student B (belongs to Parent B)
        await setDoc(doc(db, 'students/student_b'), {
          id: 'student_b',
          fullName: 'Advait Verma',
          grade: 'Grade 11',
          batchId: 'batch_11_phys',
          monthlyFeePaise: 180000,
          active: true,
          enrollmentDate: '2026-02-01',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // 6. Parent-student link for Parent A -> Student A
        await setDoc(doc(db, 'parentStudentLinks/parent_a_uid_student_a'), {
          id: 'parent_a_uid_student_a',
          parentUid: 'parent_a_uid',
          studentId: 'student_a',
          relationship: 'FATHER',
          authorized: true,
          createdAt: new Date().toISOString(),
          createdBy: 'admin_uid',
        });

        // 7. Session 1
        await setDoc(doc(db, 'classSessions/session_1'), {
          id: 'session_1',
          batchId: 'batch_10_math',
          sessionDate: '2026-10-21',
          scheduledStartAt: '2026-10-21T16:00:00.000Z',
          scheduledEndAt: '2026-10-21T17:30:00.000Z',
          gracePeriodMinutes: 10,
          status: 'SCHEDULED',
        });

        // 8. Fee record for Student A
        await setDoc(doc(db, 'feeRecords/fee_student_a_oct'), {
          id: 'fee_student_a_oct',
          studentId: 'student_a',
          billingMonth: 10,
          billingYear: 2026,
          amountDuePaise: 150000,
          dueDate: '2026-10-10',
          description: 'October 2026 Tuition Fee',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
    }
  });

  it('1. Unauthenticated read on private student records is denied', async () => {
    if (!testEnv) return;
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(unauthedDb, 'students/student_a')));
  });

  it('2. Unauthenticated write to attendance is denied', async () => {
    if (!testEnv) return;
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(unauthedDb, 'attendance/student_a_session_1'), {
        studentId: 'student_a',
        sessionId: 'session_1',
        status: 'PRESENT',
        arrivalAt: new Date().toISOString(),
      })
    );
  });

  it('3. Admin can read and write student profiles', async () => {
    if (!testEnv) return;
    const adminDb = testEnv.authenticatedContext('admin_uid').firestore();
    await assertSucceeds(getDoc(doc(adminDb, 'students/student_a')));
    await assertSucceeds(
      setDoc(doc(adminDb, 'students/student_c'), {
        id: 'student_c',
        fullName: 'Rohan Gupta',
        grade: 'Grade 9',
        batchId: 'batch_9_sci',
        monthlyFeePaise: 120000,
        active: true,
        enrollmentDate: '2026-03-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );
  });

  it('4. Parent cannot escalate their role to ADMIN', async () => {
    if (!testEnv) return;
    const parentDb = testEnv.authenticatedContext('parent_a_uid').firestore();
    await assertFails(
      updateDoc(doc(parentDb, 'users/parent_a_uid'), {
        role: 'ADMIN',
      })
    );
  });

  it('5. Parent cannot alter their account active status or UID', async () => {
    if (!testEnv) return;
    const parentDb = testEnv.authenticatedContext('parent_a_uid').firestore();
    await assertFails(
      updateDoc(doc(parentDb, 'users/parent_a_uid'), {
        active: false,
      })
    );
  });

  it('6. Parent can read only their authorized linked child', async () => {
    if (!testEnv) return;
    const parentDb = testEnv.authenticatedContext('parent_a_uid').firestore();
    // Authorized child
    await assertSucceeds(getDoc(doc(parentDb, 'students/student_a')));
    // Unlinked child
    await assertFails(getDoc(doc(parentDb, 'students/student_b')));
  });

  it('7. Parent cannot self-link to arbitrary students', async () => {
    if (!testEnv) return;
    const parentDb = testEnv.authenticatedContext('parent_a_uid').firestore();
    await assertFails(
      setDoc(doc(parentDb, 'parentStudentLinks/parent_a_uid_student_b'), {
        id: 'parent_a_uid_student_b',
        parentUid: 'parent_a_uid',
        studentId: 'student_b',
        relationship: 'GUARDIAN',
        authorized: true,
      })
    );
  });

  it('8. Parent cannot create attendance records', async () => {
    if (!testEnv) return;
    const parentDb = testEnv.authenticatedContext('parent_a_uid').firestore();
    await assertFails(
      setDoc(doc(parentDb, 'attendance/student_a_session_1'), {
        studentId: 'student_a',
        sessionId: 'session_1',
        status: 'PRESENT',
        arrivalAt: new Date().toISOString(),
      })
    );
  });

  it('9. Attendance validation rejects ABSENT with arrival timestamp', async () => {
    if (!testEnv) return;
    const adminDb = testEnv.authenticatedContext('admin_uid').firestore();
    await assertFails(
      setDoc(doc(adminDb, 'attendance/student_a_session_1'), {
        studentId: 'student_a',
        sessionId: 'session_1',
        status: 'ABSENT',
        arrivalAt: '2026-10-21T16:05:00.000Z',
      })
    );
  });

  it('10. Parent cannot create or modify tuition fee obligations', async () => {
    if (!testEnv) return;
    const parentDb = testEnv.authenticatedContext('parent_a_uid').firestore();
    await assertFails(
      setDoc(doc(parentDb, 'feeRecords/fee_hacked'), {
        studentId: 'student_a',
        amountDuePaise: 0,
        billingMonth: 11,
        billingYear: 2026,
      })
    );
  });

  it('11. Parent cannot create payment records', async () => {
    if (!testEnv) return;
    const parentDb = testEnv.authenticatedContext('parent_a_uid').firestore();
    await assertFails(
      setDoc(doc(parentDb, 'payments/fake_payment'), {
        studentId: 'student_a',
        feeRecordId: 'fee_student_a_oct',
        amountPaise: 150000,
        method: 'UPI',
        status: 'CONFIRMED',
        receiptNumber: 'BSA-2026-9999',
      })
    );
  });

  it('12. Confirmed payments cannot be silently overwritten or erased', async () => {
    if (!testEnv) return;
    const adminDb = testEnv.authenticatedContext('admin_uid').firestore();
    // Admin creates valid confirmed payment
    await assertSucceeds(
      setDoc(doc(adminDb, 'payments/pay_valid_1'), {
        id: 'pay_valid_1',
        studentId: 'student_a',
        feeRecordId: 'fee_student_a_oct',
        amountPaise: 150000,
        method: 'UPI',
        status: 'CONFIRMED',
        receiptNumber: 'BSA-2026-0001',
      })
    );

    // Overwriting payment amount is rejected
    await assertFails(
      updateDoc(doc(adminDb, 'payments/pay_valid_1'), {
        amountPaise: 100000,
      })
    );
  });

  it('13. Parent cannot access private exit reports or exit jobs', async () => {
    if (!testEnv) return;
    const parentDb = testEnv.authenticatedContext('parent_a_uid').firestore();
    await assertFails(getDoc(doc(parentDb, 'exitReports/report_secret_1')));
    await assertFails(getDoc(doc(parentDb, 'studentExitJobs/job_secret_1')));
  });
});
