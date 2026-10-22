import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '../lib/firebase';
import { getFirebaseConfig } from '../lib/firebase-config';
import { IDataService, StudentFilter } from './api-interface';
import {
  Student,
  Batch,
  ClassSession,
  AttendanceRecord,
  FeeRecord,
  Payment,
  ParentStudentLink,
  Announcement,
  AppNotification,
  AuditLog,
  StudentExitJob,
  ExitReport,
  TuitionCenterSettings,
  UserProfile,
  FeeSummary,
  AttendanceStatus,
  ArrivalClassification,
} from '../types';
import { calculateArrivalClassification, getTodayDateString } from '../utils/dates';
import { getDerivedFeeStatus } from '../utils/currency';

export const DEFAULT_CENTER_SETTINGS: TuitionCenterSettings = {
  id: 'current',
  centerName: 'Bright Sparkz Academy',
  tagline: 'Learn Smarter, Shine Brighter',
  logoUrl: '/logo.jpg',
  address: 'No. 42, Academic Boulevard, Bangalore, Karnataka 560034',
  phoneNumber: '+91 98450 12345',
  email: 'admin@brightsparkz.edu',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  defaultGracePeriodMinutes: 10,
  receiptPrefix: 'BSA-2026-',
  receiptNotes: 'Thank you for your payment. Bright Sparkz Academy is dedicated to student growth and academic success.',
  updatedAt: new Date().toISOString(),
};

function requireDb() {
  if (!db) {
    throw new Error('Firebase Firestore is not initialized. Please configure your Firebase credentials in .env.');
  }
  return db;
}

export class FirebaseService implements IDataService {
  async getSettings(): Promise<TuitionCenterSettings> {
    const firestore = requireDb();
    const docRef = doc(firestore, 'centerSettings', 'current');
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      try {
        await setDoc(docRef, DEFAULT_CENTER_SETTINGS);
      } catch {
        // In case permissions prevent write before admin auth
      }
      return DEFAULT_CENTER_SETTINGS;
    }
    return snap.data() as TuitionCenterSettings;
  }

  async updateSettings(settings: Partial<TuitionCenterSettings>): Promise<TuitionCenterSettings> {
    const firestore = requireDb();
    const docRef = doc(firestore, 'centerSettings', 'current');
    await setDoc(
      docRef,
      {
        ...DEFAULT_CENTER_SETTINGS,
        ...settings,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    const updated = await getDoc(docRef);
    return updated.data() as TuitionCenterSettings;
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const firestore = requireDb();
    const docRef = doc(firestore, 'users', uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as UserProfile) : null;
  }

  async getAllParents(): Promise<UserProfile[]> {
    const firestore = requireDb();
    const q = query(collection(firestore, 'users'), where('role', '==', 'PARENT'), where('active', '==', true));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => d.data() as UserProfile);
  }

  async createParentAccount(data: {
    email: string;
    displayName: string;
    phoneNumber?: string;
    authUid?: string;
    password?: string;
  }): Promise<UserProfile> {
    const firestore = requireDb();
    let finalUid = data.authUid?.trim();

    // If a password was provided and no authUid was specified, register user in Firebase Auth directly
    if (data.password && !finalUid) {
      try {
        const config = getFirebaseConfig();
        const secondaryApp =
          getApps().find((a) => a.name === 'SecondaryAuthApp') ||
          initializeApp(config as unknown as Record<string, string>, 'SecondaryAuthApp');
        const secondaryAuth = getAuth(secondaryApp);
        const cred = await createUserWithEmailAndPassword(
          secondaryAuth,
          data.email.trim(),
          data.password
        );
        finalUid = cred.user.uid;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to register parent in Firebase Authentication.';
        throw new Error(msg);
      }
    }

    // Fallback to random ID if not provided (though entering a password or Auth UID is recommended)
    const effectiveUid = finalUid || doc(collection(firestore, 'users')).id;
    const userRef = doc(firestore, 'users', effectiveUid);

    const profile: UserProfile = {
      uid: effectiveUid,
      email: data.email.trim(),
      displayName: data.displayName.trim(),
      role: 'PARENT',
      active: true,
      phoneNumber: data.phoneNumber?.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userRef, profile);
    return profile;
  }

  async getStudents(filter?: StudentFilter): Promise<Student[]> {
    const firestore = requireDb();
    const constraints = [];
    if (filter?.activeOnly !== false) {
      constraints.push(where('active', '==', true));
    }
    if (filter?.grade) {
      constraints.push(where('grade', '==', filter.grade));
    }
    if (filter?.batchId) {
      constraints.push(where('batchId', '==', filter.batchId));
    }
    const q = query(collection(firestore, 'students'), ...constraints);
    const snaps = await getDocs(q);
    let list = snaps.docs.map(d => ({ ...d.data(), id: d.id } as Student));

    if (filter?.search) {
      const s = filter.search.toLowerCase();
      list = list.filter(item => item.fullName.toLowerCase().includes(s) || item.id.toLowerCase().includes(s));
    }
    return list;
  }

  async getStudentById(id: string): Promise<Student | null> {
    const firestore = requireDb();
    const snap = await getDoc(doc(firestore, 'students', id));
    return snap.exists() ? ({ ...snap.data(), id: snap.id } as Student) : null;
  }

  async createStudent(data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<Student> {
    const firestore = requireDb();
    const docRef = doc(collection(firestore, 'students'));
    const now = new Date().toISOString();
    const newStudent: Student = {
      ...data,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, newStudent);
    return newStudent;
  }

  async updateStudent(id: string, data: Partial<Student>): Promise<Student> {
    const firestore = requireDb();
    const docRef = doc(firestore, 'students', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
    const snap = await getDoc(docRef);
    return { ...snap.data(), id: snap.id } as Student;
  }

  async getParentStudentLinks(parentUid?: string, studentId?: string): Promise<ParentStudentLink[]> {
    const firestore = requireDb();
    const constraints = [];
    if (parentUid) constraints.push(where('parentUid', '==', parentUid));
    if (studentId) constraints.push(where('studentId', '==', studentId));
    const q = query(collection(firestore, 'parentStudentLinks'), ...constraints);
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ ...d.data(), id: d.id } as ParentStudentLink));
  }

  async linkParentToStudent(
    parentUid: string,
    studentId: string,
    relationship: 'FATHER' | 'MOTHER' | 'GUARDIAN'
  ): Promise<ParentStudentLink> {
    const firestore = requireDb();
    const docId = `${parentUid}_${studentId}`;
    const docRef = doc(firestore, 'parentStudentLinks', docId);
    const link: ParentStudentLink = {
      id: docId,
      parentUid,
      studentId,
      relationship,
      authorized: true,
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
    };
    await setDoc(docRef, link);
    return link;
  }

  async removeParentStudentLink(linkId: string): Promise<void> {
    const firestore = requireDb();
    await deleteDoc(doc(firestore, 'parentStudentLinks', linkId));
  }

  async getBatches(): Promise<Batch[]> {
    const firestore = requireDb();
    const q = query(collection(firestore, 'batches'), where('active', '==', true));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ ...d.data(), id: d.id } as Batch));
  }

  async getBatchById(id: string): Promise<Batch | null> {
    const firestore = requireDb();
    const snap = await getDoc(doc(firestore, 'batches', id));
    return snap.exists() ? ({ ...snap.data(), id: snap.id } as Batch) : null;
  }

  async createBatch(data: Omit<Batch, 'id' | 'createdAt' | 'updatedAt'>): Promise<Batch> {
    const firestore = requireDb();
    const docRef = doc(collection(firestore, 'batches'));
    const now = new Date().toISOString();
    const batch: Batch = {
      ...data,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, batch);
    return batch;
  }

  async updateBatch(id: string, data: Partial<Batch>): Promise<Batch> {
    const firestore = requireDb();
    const docRef = doc(firestore, 'batches', id);
    await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
    const snap = await getDoc(docRef);
    return { ...snap.data(), id: snap.id } as Batch;
  }

  async getClassSessions(batchId?: string, date?: string): Promise<ClassSession[]> {
    const firestore = requireDb();
    const constraints = [];
    if (batchId) constraints.push(where('batchId', '==', batchId));
    if (date) constraints.push(where('sessionDate', '==', date));
    const q = query(collection(firestore, 'classSessions'), ...constraints);
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ ...d.data(), id: d.id } as ClassSession));
  }

  async getSessionById(id: string): Promise<ClassSession | null> {
    const firestore = requireDb();
    const snap = await getDoc(doc(firestore, 'classSessions', id));
    return snap.exists() ? ({ ...snap.data(), id: snap.id } as ClassSession) : null;
  }

  async createClassSession(data: Omit<ClassSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClassSession> {
    const firestore = requireDb();
    const docRef = doc(collection(firestore, 'classSessions'));
    const now = new Date().toISOString();
    const session: ClassSession = {
      ...data,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, session);
    return session;
  }

  async updateSessionStatus(id: string, status: ClassSession['status']): Promise<ClassSession> {
    const firestore = requireDb();
    const docRef = doc(firestore, 'classSessions', id);
    await updateDoc(docRef, { status, updatedAt: new Date().toISOString() });
    const snap = await getDoc(docRef);
    return { ...snap.data(), id: snap.id } as ClassSession;
  }

  async getAttendanceForSession(sessionId: string): Promise<AttendanceRecord[]> {
    const firestore = requireDb();
    const q = query(collection(firestore, 'attendance'), where('sessionId', '==', sessionId));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ ...d.data(), id: d.id } as AttendanceRecord));
  }

  async getAttendanceForStudent(studentId: string): Promise<AttendanceRecord[]> {
    const firestore = requireDb();
    const q = query(collection(firestore, 'attendance'), where('studentId', '==', studentId));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ ...d.data(), id: d.id } as AttendanceRecord));
  }

  async recordAttendance(data: {
    studentId: string;
    sessionId: string;
    batchId: string;
    status: AttendanceStatus;
    arrivalAt?: string;
    departureAt?: string;
    arrivalClassification?: ArrivalClassification;
    recordedBy: string;
  }): Promise<AttendanceRecord> {
    const firestore = requireDb();
    const docId = `${data.studentId}_${data.sessionId}`;
    const docRef = doc(firestore, 'attendance', docId);

    const session = await this.getSessionById(data.sessionId);
    if (!session) throw new Error('Session not found.');

    const now = new Date().toISOString();
    let classification: ArrivalClassification = 'NOT_APPLICABLE';
    let arrivalAt = data.arrivalAt;
    let departureAt = data.departureAt;

    if (data.status === 'PRESENT') {
      if (!arrivalAt) arrivalAt = now;
      classification = calculateArrivalClassification(
        session.scheduledStartAt,
        arrivalAt,
        session.gracePeriodMinutes
      );
    } else if (data.status === 'LEFT') {
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error('Student must be marked PRESENT before LEFT.');
      const existing = snap.data() as AttendanceRecord;
      if (existing.status !== 'PRESENT' && existing.status !== 'LEFT') {
        throw new Error('Student must be marked PRESENT before LEFT.');
      }
      arrivalAt = existing.arrivalAt || now;
      departureAt = departureAt || now;
      classification = existing.arrivalClassification;
    }

    const record: AttendanceRecord = {
      id: docId,
      studentId: data.studentId,
      batchId: data.batchId,
      sessionId: data.sessionId,
      status: data.status,
      arrivalAt,
      departureAt,
      arrivalClassification: classification,
      createdAt: now,
      updatedAt: now,
      recordedBy: data.recordedBy,
    };

    await setDoc(docRef, record);
    return record;
  }

  async correctAttendance(
    recordId: string,
    updates: Partial<AttendanceRecord>,
    reason: string,
    adminUid: string
  ): Promise<AttendanceRecord> {
    const firestore = requireDb();
    const docRef = doc(firestore, 'attendance', recordId);
    await updateDoc(docRef, {
      ...updates,
      lastModifiedBy: adminUid,
      updatedAt: new Date().toISOString(),
    });
    await this.logAction('ATTENDANCE_CORRECTION', adminUid, 'attendance', recordId, { reason, updates });
    const snap = await getDoc(docRef);
    return { ...snap.data(), id: snap.id } as AttendanceRecord;
  }

  async getFeeRecords(studentId?: string, month?: number, year?: number): Promise<FeeRecord[]> {
    const firestore = requireDb();
    const constraints = [];
    if (studentId) constraints.push(where('studentId', '==', studentId));
    if (month) constraints.push(where('billingMonth', '==', month));
    if (year) constraints.push(where('billingYear', '==', year));
    const q = query(collection(firestore, 'feeRecords'), ...constraints);
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ ...d.data(), id: d.id } as FeeRecord));
  }

  async getFeeSummaries(month?: number, year?: number): Promise<FeeSummary[]> {
    const fees = await this.getFeeRecords(undefined, month, year);
    const payments = await this.getPayments();
    const students = await this.getStudents({ activeOnly: false });

    return fees.map(fee => {
      const student = students.find(s => s.id === fee.studentId);
      const studentPayments = payments.filter(
        p => p.feeRecordId === fee.id && p.status === 'CONFIRMED'
      );
      const totalPaid = studentPayments.reduce((acc, p) => acc + p.amountPaise, 0);
      const balance = fee.amountDuePaise - totalPaid;
      const status = getDerivedFeeStatus(fee.amountDuePaise, totalPaid);

      return {
        feeRecord: fee,
        studentName: student ? student.fullName : 'Unknown Student',
        totalPaidPaise: totalPaid,
        balancePaise: balance,
        status,
      };
    });
  }

  async createFeeRecord(data: Omit<FeeRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeeRecord> {
    const firestore = requireDb();
    const docRef = doc(collection(firestore, 'feeRecords'));
    const now = new Date().toISOString();
    const fee: FeeRecord = {
      ...data,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, fee);
    return fee;
  }

  async generateMonthlyFeesForBatch(batchId: string, month: number, year: number, dueDate: string): Promise<number> {
    const firestore = requireDb();
    const students = await this.getStudents({ batchId, activeOnly: true });
    const existing = await this.getFeeRecords(undefined, month, year);
    const batch = writeBatch(firestore);
    let count = 0;

    for (const student of students) {
      const exists = existing.some(e => e.studentId === student.id);
      if (!exists) {
        const docRef = doc(collection(firestore, 'feeRecords'));
        const now = new Date().toISOString();
        const record: FeeRecord = {
          id: docRef.id,
          studentId: student.id,
          billingMonth: month,
          billingYear: year,
          amountDuePaise: student.monthlyFeePaise,
          dueDate,
          description: `Tuition fee for ${month}/${year}`,
          createdAt: now,
          updatedAt: now,
        };
        batch.set(docRef, record);
        count++;
      }
    }

    if (count > 0) {
      await batch.commit();
    }
    return count;
  }

  async getPayments(studentId?: string, feeRecordId?: string): Promise<Payment[]> {
    const firestore = requireDb();
    const constraints = [];
    if (studentId) constraints.push(where('studentId', '==', studentId));
    if (feeRecordId) constraints.push(where('feeRecordId', '==', feeRecordId));
    const q = query(collection(firestore, 'payments'), ...constraints);
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ ...d.data(), id: d.id } as Payment));
  }

  async getPaymentById(paymentId: string): Promise<Payment | null> {
    const firestore = requireDb();
    const snap = await getDoc(doc(firestore, 'payments', paymentId));
    return snap.exists() ? ({ ...snap.data(), id: snap.id } as Payment) : null;
  }

  async recordPayment(data: {
    studentId: string;
    feeRecordId: string;
    amountPaise: number;
    method: 'CASH' | 'UPI';
    paymentDate: string;
    recordedBy: string;
    reference?: string;
    notes?: string;
  }): Promise<Payment> {
    const firestore = requireDb();
    const docRef = doc(collection(firestore, 'payments'));
    const receiptNumber = `BSA-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const payment: Payment = {
      id: docRef.id,
      ...data,
      receiptNumber,
      status: 'CONFIRMED',
      createdAt: now,
    };

    await setDoc(docRef, payment);
    await this.logAction('PAYMENT_RECORDED', data.recordedBy, 'payments', docRef.id, {
      amountPaise: data.amountPaise,
      receiptNumber,
    });
    return payment;
  }

  async reversePayment(paymentId: string, reason: string, adminUid: string): Promise<Payment> {
    const firestore = requireDb();
    const docRef = doc(firestore, 'payments', paymentId);
    await updateDoc(docRef, {
      status: 'REVERSED',
      reversalReason: reason,
      reversedAt: new Date().toISOString(),
      reversedBy: adminUid,
    });
    await this.logAction('PAYMENT_REVERSED', adminUid, 'payments', paymentId, { reason });
    const snap = await getDoc(docRef);
    return { ...snap.data(), id: snap.id } as Payment;
  }

  async getAnnouncements(batchId?: string): Promise<Announcement[]> {
    const firestore = requireDb();
    const q = query(collection(firestore, 'announcements'), where('active', '==', true));
    const snaps = await getDocs(q);
    const list = snaps.docs.map(d => ({ ...d.data(), id: d.id } as Announcement));
    return list.filter(a => a.targetAudience === 'ALL' || (batchId && a.batchId === batchId));
  }

  async createAnnouncement(data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Promise<Announcement> {
    const firestore = requireDb();
    const docRef = doc(collection(firestore, 'announcements'));
    const now = new Date().toISOString();
    const ann: Announcement = {
      ...data,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, ann);
    return ann;
  }

  async toggleAnnouncementStatus(id: string, active: boolean): Promise<Announcement> {
    const firestore = requireDb();
    const docRef = doc(firestore, 'announcements', id);
    await updateDoc(docRef, { active, updatedAt: new Date().toISOString() });
    const snap = await getDoc(docRef);
    return { ...snap.data(), id: snap.id } as Announcement;
  }

  async getNotifications(recipientUid: string): Promise<AppNotification[]> {
    const firestore = requireDb();
    const q = query(collection(firestore, 'notificationHistory'), where('recipientUid', '==', recipientUid));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ ...d.data(), id: d.id } as AppNotification));
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const firestore = requireDb();
    const docRef = doc(firestore, 'notificationHistory', id);
    await updateDoc(docRef, { readAt: new Date().toISOString() });
  }

  async markAllNotificationsAsRead(recipientUid: string): Promise<void> {
    const firestore = requireDb();
    const notifs = await this.getNotifications(recipientUid);
    const unread = notifs.filter(n => !n.readAt);
    const batch = writeBatch(firestore);
    const now = new Date().toISOString();
    unread.forEach(n => {
      batch.update(doc(firestore, 'notificationHistory', n.id), { readAt: now });
    });
    await batch.commit();
  }

  async createNotification(data: Omit<AppNotification, 'id' | 'createdAt'>): Promise<AppNotification> {
    const firestore = requireDb();
    const docRef = doc(collection(firestore, 'notificationHistory'));
    const notif: AppNotification = {
      ...data,
      id: docRef.id,
      createdAt: new Date().toISOString(),
    };
    await setDoc(docRef, notif);
    return notif;
  }

  async getAuditLogs(limitCount = 100): Promise<AuditLog[]> {
    const firestore = requireDb();
    const q = query(collection(firestore, 'auditLogs'), orderBy('timestamp', 'desc'), limit(limitCount));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ ...d.data(), id: d.id } as AuditLog));
  }

  async logAction(action: string, performedBy: string, collectionName: string, targetId: string, details: Record<string, unknown>): Promise<void> {
    const firestore = requireDb();
    const docRef = doc(collection(firestore, 'auditLogs'));
    const log: AuditLog = {
      id: docRef.id,
      action,
      performedBy,
      targetCollection: collectionName,
      targetId,
      details,
      timestamp: new Date().toISOString(),
    };
    await setDoc(docRef, log);
  }

  async initiateStudentExit(studentId: string, adminUid: string): Promise<StudentExitJob> {
    const firestore = requireDb();
    const student = await this.getStudentById(studentId);
    if (!student) throw new Error('Student not found.');

    const docRef = doc(collection(firestore, 'studentExitJobs'));
    const job: StudentExitJob = {
      id: docRef.id,
      studentId,
      studentName: student.fullName,
      status: 'REQUESTED',
      requestedBy: adminUid,
      requestedAt: new Date().toISOString(),
    };
    await setDoc(docRef, job);
    return job;
  }

  async generateExitReport(jobId: string): Promise<ExitReport> {
    const firestore = requireDb();
    const jobSnap = await getDoc(doc(firestore, 'studentExitJobs', jobId));
    if (!jobSnap.exists()) throw new Error('Job not found.');
    const job = jobSnap.data() as StudentExitJob;

    const student = await this.getStudentById(job.studentId);
    if (!student) throw new Error('Student not found.');

    const attendance = await this.getAttendanceForStudent(job.studentId);
    const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
    const absentCount = attendance.filter(a => a.status === 'ABSENT').length;
    const leftCount = attendance.filter(a => a.status === 'LEFT').length;
    const effectivePresent = presentCount + leftCount;
    const totalOutcomes = effectivePresent + absentCount;
    const attendancePercentage = totalOutcomes > 0 ? Math.round((effectivePresent / totalOutcomes) * 100) : 100;

    const fees = await this.getFeeRecords(job.studentId);
    const totalDue = fees.reduce((acc, f) => acc + f.amountDuePaise, 0);

    const payments = await this.getPayments(job.studentId);
    const confirmed = payments.filter(p => p.status === 'CONFIRMED');
    const totalPaid = confirmed.reduce((acc, p) => acc + p.amountPaise, 0);

    const repRef = doc(collection(firestore, 'exitReports'));
    const report: ExitReport = {
      id: repRef.id,
      studentId: student.id,
      studentName: student.fullName,
      enrollmentDate: student.enrollmentDate,
      exitDate: getTodayDateString(),
      sessionsCounted: totalOutcomes,
      presentCount: effectivePresent,
      absentCount,
      leftCount,
      attendancePercentage,
      totalFeesDuePaise: totalDue,
      totalConfirmedPaidPaise: totalPaid,
      outstandingBalancePaise: totalDue - totalPaid,
      paymentHistorySnippet: confirmed.map(p => ({
        receiptNumber: p.receiptNumber,
        amountPaise: p.amountPaise,
        method: p.method,
        paymentDate: p.paymentDate,
      })),
      generatedAt: new Date().toISOString(),
      generatedBy: job.requestedBy,
      verified: false,
    };

    await setDoc(repRef, report);
    await updateDoc(doc(firestore, 'studentExitJobs', jobId), {
      reportId: repRef.id,
      status: 'REPORT_STORED',
    });

    return report;
  }

  async verifyExitReport(jobId: string, reportId: string): Promise<boolean> {
    const firestore = requireDb();
    await updateDoc(doc(firestore, 'exitReports', reportId), { verified: true });
    await updateDoc(doc(firestore, 'studentExitJobs', jobId), { status: 'REPORT_VERIFIED' });
    return true;
  }

  async getExitReport(reportId: string): Promise<ExitReport | null> {
    const firestore = requireDb();
    const snap = await getDoc(doc(firestore, 'exitReports', reportId));
    return snap.exists() ? (snap.data() as ExitReport) : null;
  }

  async getExitJob(jobId: string): Promise<StudentExitJob | null> {
    const firestore = requireDb();
    const snap = await getDoc(doc(firestore, 'studentExitJobs', jobId));
    return snap.exists() ? (snap.data() as StudentExitJob) : null;
  }

  async executeStudentDeletion(jobId: string, adminUid: string): Promise<{ success: boolean; recordsDeleted: number }> {
    const firestore = requireDb();
    const jobSnap = await getDoc(doc(firestore, 'studentExitJobs', jobId));
    if (!jobSnap.exists()) throw new Error('Job not found.');
    const job = jobSnap.data() as StudentExitJob;

    if (job.status !== 'REPORT_VERIFIED') {
      throw new Error('Report must be verified before deletion.');
    }

    const studentId = job.studentId;
    const batch = writeBatch(firestore);

    // Delete attendance
    const attSnap = await getDocs(query(collection(firestore, 'attendance'), where('studentId', '==', studentId)));
    attSnap.forEach(d => batch.delete(d.ref));

    // Delete fee records
    const feeSnap = await getDocs(query(collection(firestore, 'feeRecords'), where('studentId', '==', studentId)));
    feeSnap.forEach(d => batch.delete(d.ref));

    // Delete payments
    const paySnap = await getDocs(query(collection(firestore, 'payments'), where('studentId', '==', studentId)));
    paySnap.forEach(d => batch.delete(d.ref));

    // Delete parent links
    const linkSnap = await getDocs(query(collection(firestore, 'parentStudentLinks'), where('studentId', '==', studentId)));
    linkSnap.forEach(d => batch.delete(d.ref));

    // Delete student
    batch.delete(doc(firestore, 'students', studentId));

    // Update job
    batch.update(doc(firestore, 'studentExitJobs', jobId), {
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
    });

    await batch.commit();

    const total = attSnap.size + feeSnap.size + paySnap.size + linkSnap.size + 1;
    await this.logAction('STUDENT_PERMANENT_DELETION_COMPLETED', adminUid, 'studentExitJobs', jobId, {
      recordsProcessed: total,
    });

    return { success: true, recordsDeleted: total };
  }
}

export const firebaseService = new FirebaseService();
