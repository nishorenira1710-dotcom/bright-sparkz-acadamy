/**
 * Monetary utilities: All monetary amounts are stored in integer Paise (1 INR = 100 Paise).
 * For example, ₹1,500.00 is stored as 150000.
 */

export function paiseToRupees(paise: number): number {
  return Math.round(paise) / 100;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function formatINR(paise: number, showDecimals: boolean = true): string {
  if (isNaN(paise)) return '₹0.00';
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = absPaise / 100;

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(rupees);

  return isNegative ? `-${formatted}` : formatted;
}

export function calculateFeeBalance(amountDuePaise: number, totalPaidPaise: number): number {
  return amountDuePaise - totalPaidPaise;
}

export function getDerivedFeeStatus(amountDuePaise: number, totalPaidPaise: number): 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERPAID' {
  if (totalPaidPaise <= 0) return 'UNPAID';
  if (totalPaidPaise < amountDuePaise) return 'PARTIALLY_PAID';
  if (totalPaidPaise === amountDuePaise) return 'PAID';
  return 'OVERPAID';
}
