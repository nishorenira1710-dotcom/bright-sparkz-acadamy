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

export interface AttendanceFilter {
  batchId?: string;
  sessionId?: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
}

export interface StudentFilter {
  search?: string;
  grade?: string;
  batchId?: string;
  activeOnly?: boolean;
}

export interface IDataService {
  // Center Settings
  getSettings(): Promise<TuitionCenterSettings>;
  updateSettings(settings: Partial<TuitionCenterSettings>): Promise<TuitionCenterSettings>;

  // Users & Parents
  getUserProfile(uid: string): Promise<UserProfile | null>;
  getAllParents(): Promise<UserProfile[]>;
  createParentAccount(data: {
    email: string;
    displayName: string;
    phoneNumber?: string;
    authUid?: string;
    password?: string;
  }): Promise<UserProfile>;
  
  // Students
  getStudents(filter?: StudentFilter): Promise<Student[]>;
  getStudentById(id: string): Promise<Student | null>;
  createStudent(data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<Student>;
  updateStudent(id: string, data: Partial<Student>): Promise<Student>;

  // Parent-Student Relationships
  getParentStudentLinks(parentUid?: string, studentId?: string): Promise<ParentStudentLink[]>;
  linkParentToStudent(parentUid: string, studentId: string, relationship: 'FATHER' | 'MOTHER' | 'GUARDIAN'): Promise<ParentStudentLink>;
  removeParentStudentLink(linkId: string): Promise<void>;

  // Batches
  getBatches(): Promise<Batch[]>;
  getBatchById(id: string): Promise<Batch | null>;
  createBatch(data: Omit<Batch, 'id' | 'createdAt' | 'updatedAt'>): Promise<Batch>;
  updateBatch(id: string, data: Partial<Batch>): Promise<Batch>;

  // Class Sessions
  getClassSessions(batchId?: string, date?: string): Promise<ClassSession[]>;
  getSessionById(id: string): Promise<ClassSession | null>;
  createClassSession(data: Omit<ClassSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClassSession>;
  updateSessionStatus(id: string, status: ClassSession['status']): Promise<ClassSession>;

  // Attendance
  getAttendanceForSession(sessionId: string): Promise<AttendanceRecord[]>;
  getAttendanceForStudent(studentId: string): Promise<AttendanceRecord[]>;
  recordAttendance(data: {
    studentId: string;
    sessionId: string;
    batchId: string;
    status: AttendanceStatus;
    arrivalAt?: string;
    departureAt?: string;
    arrivalClassification?: ArrivalClassification;
    recordedBy: string;
  }): Promise<AttendanceRecord>;
  correctAttendance(
    recordId: string,
    updates: Partial<AttendanceRecord>,
    reason: string,
    adminUid: string
  ): Promise<AttendanceRecord>;

  // Fees & Payments
  getFeeRecords(studentId?: string, month?: number, year?: number): Promise<FeeRecord[]>;
  getFeeSummaries(month?: number, year?: number): Promise<FeeSummary[]>;
  createFeeRecord(data: Omit<FeeRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeeRecord>;
  generateMonthlyFeesForBatch(batchId: string, month: number, year: number, dueDate: string): Promise<number>;

  getPayments(studentId?: string, feeRecordId?: string): Promise<Payment[]>;
  getPaymentById(paymentId: string): Promise<Payment | null>;
  recordPayment(data: {
    studentId: string;
    feeRecordId: string;
    amountPaise: number;
    method: 'CASH' | 'UPI';
    paymentDate: string;
    recordedBy: string;
    reference?: string;
    notes?: string;
  }): Promise<Payment>;
  reversePayment(paymentId: string, reason: string, adminUid: string): Promise<Payment>;

  // Announcements
  getAnnouncements(batchId?: string): Promise<Announcement[]>;
  createAnnouncement(data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Promise<Announcement>;
  toggleAnnouncementStatus(id: string, active: boolean): Promise<Announcement>;

  // Notifications
  getNotifications(recipientUid: string): Promise<AppNotification[]>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(recipientUid: string): Promise<void>;
  createNotification(data: Omit<AppNotification, 'id' | 'createdAt'>): Promise<AppNotification>;

  // Audit Logs
  getAuditLogs(limitCount?: number): Promise<AuditLog[]>;
  logAction(action: string, performedBy: string, collection: string, targetId: string, details: Record<string, unknown>): Promise<void>;

  // Student Exit & Permanent Deletion Workflow
  initiateStudentExit(studentId: string, adminUid: string): Promise<StudentExitJob>;
  generateExitReport(jobId: string): Promise<ExitReport>;
  verifyExitReport(jobId: string, reportId: string): Promise<boolean>;
  getExitReport(reportId: string): Promise<ExitReport | null>;
  getExitJob(jobId: string): Promise<StudentExitJob | null>;
  executeStudentDeletion(jobId: string, adminUid: string): Promise<{ success: boolean; recordsDeleted: number }>;
}
