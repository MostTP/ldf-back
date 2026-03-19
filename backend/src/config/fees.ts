export const REGISTRATION = {
  Silver: {
    total: 6000,
    affiliate: 3000,
    matrix: 500,
    globalPool: 1000,
    operation: 1000,
  },
  Gold: {
    total: 15000,
    affiliate: 10000,
    matrix: 2000,
    globalPool: 1500,
    operation: 1000,
  },
} as const;

export const REGISTRATION_MATRIX_SILVER: [number, number, number, number, number] = [200, 150, 100, 50, 0];
export const REGISTRATION_MATRIX_GOLD: [number, number, number, number, number] = [800, 500, 400, 200, 100];

export function getRegistrationAmount(packageType: 'Silver' | 'Gold'): number {
  return REGISTRATION[packageType].total;
}

export function getRegistrationAffiliate(packageType: 'Silver' | 'Gold'): number {
  return REGISTRATION[packageType].affiliate;
}

export function getRegistrationMatrixRates(packageType: 'Silver' | 'Gold'): [number, number, number, number, number] {
  return packageType === 'Gold' ? [...REGISTRATION_MATRIX_GOLD] : [...REGISTRATION_MATRIX_SILVER];
}

export const SUBSCRIPTION_RENEWAL = {
  Silver: {
    total: 2000,
    affiliate: 500,
    matrix: 500,
    globalPool: 500,
    operation: 500,
  },
  Gold: {
    total: 5000,
    affiliate: 2000,
    matrix: 2000,
    globalPool: 500,
    operation: 500,
  },
} as const;

export const RENEWAL_MATRIX_SILVER: [number, number, number, number, number] = [200, 150, 100, 50, 0];
export const RENEWAL_MATRIX_GOLD: [number, number, number, number, number] = [800, 500, 400, 200, 100];

export function getRenewalAmount(packageType: 'Silver' | 'Gold'): number {
  return SUBSCRIPTION_RENEWAL[packageType].total;
}

export function getRenewalMatrixSchedule(packageType: 'Silver' | 'Gold'): [number, number, number, number, number] {
  return packageType === 'Gold' ? [...RENEWAL_MATRIX_GOLD] : [...RENEWAL_MATRIX_SILVER];
}

export const UPGRADE = {
  total: 9000,
  affiliate: 7000,
  matrix: 1500,
  globalPool: 500,
  operation: 0,
} as const;

export const UPGRADE_MATRIX_SCHEDULE: [number, number, number, number, number] = [600, 400, 300, 150, 50];

export function getUpgradeAmount(): number {
  return UPGRADE.total;
}
