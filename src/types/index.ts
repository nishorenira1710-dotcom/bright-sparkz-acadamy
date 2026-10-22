export type UserRole = 'ADMIN' | 'PARENT';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  active: boolean;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  fullName: string;
  grade: string;
  schoolName?: string;
  batchId: string;
  enrollmentDate: string; // YYYY-MM-DD
  monthlyFeePaise: number; // Stored in paise (e.g. 150000 = ₹1,500)
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ParentStudentLink {
  id: string; // Deterministic: `${parentUid}_${studentId}`
  parentUid: string;
  studentId: string;
  relationship: 'FATHER' | 'MOTHER' | 'GUARDIAN';
  authorized: boolean;
  createdAt: string;
  createdBy: string;
}

export interface Batch {
  id: string;
  name: string;
  grade: string;
  subject: string;
  startTime: string; // "16:00"
  endTime: string;   // "17:30"
  daysOfWeek: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  active: boolean;
  defaultGracePeriodMinutes: number; // e.g. 10
  createdAt: string;
  updatedAt: string;
}

export type SessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ClassSession {
  id: string;
  batchId: string;
  sessionDate: string; // YYYY-MM-DD
  scheduledStartAt: string; // ISO 8601
  scheduledEndAt: string;   // ISO 8601
  gracePeriodMinutes: number; // Snapshot of grace period
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = 'NOT_MARKED' | 'PRESENT' | 'ABSENT' | 'LEFT';
export type ArrivalClassification = 'ON_TIME' | 'LATE' | 'NOT_APPLICABLE';

export interface AttendanceRecord {
  id: string; // Deterministic: `${studentId}_${sessionId}`
  studentId: string;
  batchId: string;
  sessionId: string;
  status: AttendanceStatus;
  arrivalAt?: string; // ISO 8601 timestamp for PRESENT/LEFT
  departureAt?: string; // ISO 8601 timestamp for LEFT
  arrivalClassification: ArrivalClassification;
  createdAt: string;
  updatedAt: string;
  recordedBy: string;
  lastModifiedBy?: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  billingMonth: number; // 1 - 12
  billingYear: number;  // e.g. 2026
  amountDuePaise: number; // Integer in paise
  dueDate: string; // YYYY-MM-DD
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'CASH' | 'UPI';
export type PaymentStatus = 'CONFIRMED' | 'REVERSED';

export interface Payment {
  id: string;
  studentId: string;
  feeRecordId: string;
  amountPaise: number; // Integer in paise
  method: PaymentMethod;
  paymentDate: string; // ISO or YYYY-MM-DD
  receiptNumber: string; // e.g. "TC-2026-0042"
  recordedBy: string;
  reference?: string; // UPI txn ref / cash receipt note
  notes?: string;
  status: PaymentStatus;
  reversalReason?: string;
  reversedAt?: string;
  reversedBy?: string;
  createdAt: string;
}

export type FeeDerivedStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERPAID';

export interface FeeSummary {
  feeRecord: FeeRecord;
  studentName: string;
  totalPaidPaise: number;
  balancePaise: number;
  status: FeeDerivedStatus;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  targetAudience: 'ALL' | 'BATCH';
  batchId?: string;
  publishedAt: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'ATTENDANCE' | 'FEE' | 'PAYMENT' | 'ANNOUNCEMENT' | 'SYSTEM';

export interface AppNotification {
  id: string;
  recipientUid: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedRecordId?: string;
  readAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  targetCollection: string;
  targetId: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export type ExitJobStatus =
  | 'REQUESTED'
  | 'REPORT_GENERATING'
  | 'REPORT_STORED'
  | 'REPORT_VERIFIED'
  | 'AWAITING_CONFIRMATION'
  | 'DELETING'
  | 'COMPLETED'
  | 'FAILED';

export interface StudentExitJob {
  id: string;
  studentId: string;
  studentName: string;
  status: ExitJobStatus;
  requestedBy: string;
  requestedAt: string;
  reportId?: string;
  deletionStartedAt?: string;
  completedAt?: string;
  failureReason?: string;
  recordsCount?: {
    attendance: number;
    feeRecords: number;
    payments: number;
    links: number;
  };
}

export interface ExitReport {
  id: string;
  studentId: string;
  studentName: string;
  enrollmentDate: string;
  exitDate: string;
  sessionsCounted: number;
  presentCount: number;
  absentCount: number;
  leftCount: number;
  attendancePercentage: number;
  totalFeesDuePaise: number;
  totalConfirmedPaidPaise: number;
  outstandingBalancePaise: number;
  paymentHistorySnippet: Array<{
    receiptNumber: string;
    amountPaise: number;
    method: string;
    paymentDate: string;
  }>;
  generatedAt: string;
  generatedBy: string;
  verified: boolean;
}

export interface TuitionCenterSettings {
  id: string;
  centerName: string;
  tagline: string;
  logoUrl: string | null;
  address: string;
  phoneNumber: string;
  email: string;
  timezone: string;
  currency: string; // 'INR'
  defaultGracePeriodMinutes: number;
  receiptPrefix: string;
  receiptNotes: string;
  updatedAt: string;
}

export type ApplicationMode = 'DEMO' | 'FIREBASE';
