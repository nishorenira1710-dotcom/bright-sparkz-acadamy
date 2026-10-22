export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateStudentInput(data: {
  fullName: string;
  grade: string;
  batchId: string;
  enrollmentDate: string;
  monthlyFeePaise: number;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = 'Full name is required (minimum 2 characters).';
  }

  if (!data.grade || data.grade.trim().length === 0) {
    errors.grade = 'Grade/Class is required.';
  }

  if (!data.batchId || data.batchId.trim().length === 0) {
    errors.batchId = 'Batch selection is required.';
  }

  if (!data.enrollmentDate || isNaN(new Date(data.enrollmentDate).getTime())) {
    errors.enrollmentDate = 'Valid enrollment date is required.';
  }

  if (typeof data.monthlyFeePaise !== 'number' || isNaN(data.monthlyFeePaise) || data.monthlyFeePaise < 0) {
    errors.monthlyFeePaise = 'Monthly fee must be a non-negative amount.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePaymentInput(data: {
  studentId: string;
  feeRecordId: string;
  amountPaise: number;
  method: string;
  paymentDate: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.studentId) {
    errors.studentId = 'Student is required.';
  }

  if (!data.feeRecordId) {
    errors.feeRecordId = 'Associated fee record is required.';
  }

  if (typeof data.amountPaise !== 'number' || isNaN(data.amountPaise) || data.amountPaise <= 0) {
    errors.amountPaise = 'Payment amount must be greater than zero.';
  }

  if (!['CASH', 'UPI'].includes(data.method)) {
    errors.method = 'Payment method must be CASH or UPI.';
  }

  if (!data.paymentDate || isNaN(new Date(data.paymentDate).getTime())) {
    errors.paymentDate = 'Valid payment date is required.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateLogoFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
  const maxSizeBytes = 2 * 1024 * 1024; // 2MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file format. Allowed formats: PNG, JPEG, WebP, SVG.',
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: 'File size exceeds maximum allowed size of 2MB.',
    };
  }

  return { valid: true };
}
