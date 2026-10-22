import { IDataService } from './api-interface';
import { firebaseService } from './firebase-service';
import { isFirebaseConfigured, getMissingFirebaseFields } from '../lib/firebase-config';

class DataServiceProxy implements IDataService {
  private get activeService(): IDataService {
    if (!isFirebaseConfigured()) {
      const missing = getMissingFirebaseFields();
      throw new Error(
        `Firebase is not configured. Missing required environment variables: ${missing.join(', ')}. Please configure your Firebase credentials in .env.`
      );
    }
    return firebaseService;
  }

  getSettings() { return this.activeService.getSettings(); }
  updateSettings(settings: Parameters<IDataService['updateSettings']>[0]) { return this.activeService.updateSettings(settings); }

  getUserProfile(uid: string) { return this.activeService.getUserProfile(uid); }
  getAllParents() { return this.activeService.getAllParents(); }
  createParentAccount(data: Parameters<IDataService['createParentAccount']>[0]) { return this.activeService.createParentAccount(data); }

  getStudents(filter?: Parameters<IDataService['getStudents']>[0]) { return this.activeService.getStudents(filter); }
  getStudentById(id: string) { return this.activeService.getStudentById(id); }
  createStudent(data: Parameters<IDataService['createStudent']>[0]) { return this.activeService.createStudent(data); }
  updateStudent(id: string, data: Parameters<IDataService['updateStudent']>[1]) { return this.activeService.updateStudent(id, data); }

  getParentStudentLinks(parentUid?: string, studentId?: string) { return this.activeService.getParentStudentLinks(parentUid, studentId); }
  linkParentToStudent(parentUid: string, studentId: string, rel: Parameters<IDataService['linkParentToStudent']>[2]) { return this.activeService.linkParentToStudent(parentUid, studentId, rel); }
  removeParentStudentLink(linkId: string) { return this.activeService.removeParentStudentLink(linkId); }

  getBatches() { return this.activeService.getBatches(); }
  getBatchById(id: string) { return this.activeService.getBatchById(id); }
  createBatch(data: Parameters<IDataService['createBatch']>[0]) { return this.activeService.createBatch(data); }
  updateBatch(id: string, data: Parameters<IDataService['updateBatch']>[1]) { return this.activeService.updateBatch(id, data); }

  getClassSessions(batchId?: string, date?: string) { return this.activeService.getClassSessions(batchId, date); }
  getSessionById(id: string) { return this.activeService.getSessionById(id); }
  createClassSession(data: Parameters<IDataService['createClassSession']>[0]) { return this.activeService.createClassSession(data); }
  updateSessionStatus(id: string, status: Parameters<IDataService['updateSessionStatus']>[1]) { return this.activeService.updateSessionStatus(id, status); }

  getAttendanceForSession(sessionId: string) { return this.activeService.getAttendanceForSession(sessionId); }
  getAttendanceForStudent(studentId: string) { return this.activeService.getAttendanceForStudent(studentId); }
  recordAttendance(data: Parameters<IDataService['recordAttendance']>[0]) { return this.activeService.recordAttendance(data); }
  correctAttendance(recordId: string, updates: Parameters<IDataService['correctAttendance']>[1], reason: string, adminUid: string) {
    return this.activeService.correctAttendance(recordId, updates, reason, adminUid);
  }

  getFeeRecords(studentId?: string, month?: number, year?: number) { return this.activeService.getFeeRecords(studentId, month, year); }
  getFeeSummaries(month?: number, year?: number) { return this.activeService.getFeeSummaries(month, year); }
  createFeeRecord(data: Parameters<IDataService['createFeeRecord']>[0]) { return this.activeService.createFeeRecord(data); }
  generateMonthlyFeesForBatch(batchId: string, month: number, year: number, dueDate: string) {
    return this.activeService.generateMonthlyFeesForBatch(batchId, month, year, dueDate);
  }

  getPayments(studentId?: string, feeRecordId?: string) { return this.activeService.getPayments(studentId, feeRecordId); }
  getPaymentById(paymentId: string) { return this.activeService.getPaymentById(paymentId); }
  recordPayment(data: Parameters<IDataService['recordPayment']>[0]) { return this.activeService.recordPayment(data); }
  reversePayment(paymentId: string, reason: string, adminUid: string) { return this.activeService.reversePayment(paymentId, reason, adminUid); }

  getAnnouncements(batchId?: string) { return this.activeService.getAnnouncements(batchId); }
  createAnnouncement(data: Parameters<IDataService['createAnnouncement']>[0]) { return this.activeService.createAnnouncement(data); }
  toggleAnnouncementStatus(id: string, active: boolean) { return this.activeService.toggleAnnouncementStatus(id, active); }

  getNotifications(recipientUid: string) { return this.activeService.getNotifications(recipientUid); }
  markNotificationAsRead(id: string) { return this.activeService.markNotificationAsRead(id); }
  markAllNotificationsAsRead(recipientUid: string) { return this.activeService.markAllNotificationsAsRead(recipientUid); }
  createNotification(data: Parameters<IDataService['createNotification']>[0]) { return this.activeService.createNotification(data); }

  getAuditLogs(limitCount?: number) { return this.activeService.getAuditLogs(limitCount); }
  logAction(action: string, performedBy: string, col: string, id: string, details: Record<string, unknown>) {
    return this.activeService.logAction(action, performedBy, col, id, details);
  }

  initiateStudentExit(studentId: string, adminUid: string) { return this.activeService.initiateStudentExit(studentId, adminUid); }
  generateExitReport(jobId: string) { return this.activeService.generateExitReport(jobId); }
  verifyExitReport(jobId: string, reportId: string) { return this.activeService.verifyExitReport(jobId, reportId); }
  getExitReport(reportId: string) { return this.activeService.getExitReport(reportId); }
  getExitJob(jobId: string) { return this.activeService.getExitJob(jobId); }
  executeStudentDeletion(jobId: string, adminUid: string) { return this.activeService.executeStudentDeletion(jobId, adminUid); }
}

export const dataService = new DataServiceProxy();
