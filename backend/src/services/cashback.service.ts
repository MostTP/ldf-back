export type CashbackPackage = 'S' | 'G' | 'both';
export type CashbackType = 'reg' | 'upgrade' | 'monthly' | 'all';

const ALLOWED_PERCENTAGES = [10, 25, 50, 75, 100] as const;

export interface CashbackSettings {
  cashback_enabled?: boolean;
  cashback_percentage?: number;
  cashback_package?: string;
  cashback_type?: string;
}

export function normalizeCashbackPercentage(pct: number | string | undefined): number {
  const n = Number(pct);
  if (!Number.isFinite(n) || n < 0) return 0;
  if (ALLOWED_PERCENTAGES.includes(n as 10 | 25 | 50 | 75 | 100)) return n;
  if (n <= 10) return 10;
  if (n <= 25) return 25;
  if (n <= 50) return 50;
  if (n <= 75) return 75;
  return 100;
}

/** Returns true if sponsor (Gold) should give cashback in this context for the referred package. */
export function shouldApplyCashback(
  sponsorSettings: CashbackSettings,
  context: 'reg' | 'upgrade' | 'monthly',
  referredPackage: 'Silver' | 'Gold'
): boolean {
  if (!sponsorSettings.cashback_enabled) return false;
  const pct = normalizeCashbackPercentage(sponsorSettings.cashback_percentage);
  if (pct <= 0) return false;

  const pkg = (sponsorSettings.cashback_package ?? 'both').toLowerCase();
  const typeSetting = (sponsorSettings.cashback_type ?? 'all').toLowerCase();
  const refLetter = referredPackage === 'Gold' ? 'g' : 's';

  const packageMatch =
    pkg === 'both' || pkg === refLetter || (pkg === 's' && refLetter === 's') || (pkg === 'g' && refLetter === 'g');
  if (!packageMatch) return false;

  const typeMatch =
    typeSetting === 'all' ||
    (context === 'reg' && typeSetting === 'reg') ||
    (context === 'upgrade' && typeSetting === 'upgrade') ||
    (context === 'monthly' && typeSetting === 'monthly');
  if (!typeMatch) return false;

  return true;
}

/** Returns cashback amount (to give to referred user) and sponsor amount (affiliate - cashback). */
export function splitAffiliateCashback(
  affiliateTotal: number,
  sponsorSettings: CashbackSettings,
  context: 'reg' | 'upgrade' | 'monthly',
  referredPackage: 'Silver' | 'Gold'
): { sponsorAmount: number; cashbackAmount: number } {
  if (!shouldApplyCashback(sponsorSettings, context, referredPackage)) {
    return { sponsorAmount: Math.round(affiliateTotal * 100) / 100, cashbackAmount: 0 };
  }
  const pct = normalizeCashbackPercentage(sponsorSettings.cashback_percentage);
  const cashbackAmount = Math.round((affiliateTotal * pct) / 100 * 100) / 100;
  const sponsorAmount = Math.round((affiliateTotal - cashbackAmount) * 100) / 100;
  return { sponsorAmount, cashbackAmount };
}

export { ALLOWED_PERCENTAGES };
