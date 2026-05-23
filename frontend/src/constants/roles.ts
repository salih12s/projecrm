/**
 * Kullanıcı rolleri. Backend ile birebir aynı string'ler.
 */

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  BAYI: 'bayi',
  SAHA: 'saha',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

const ROLE_SET = new Set<string>(Object.values(ROLES));

export const isRole = (value: string | undefined | null): value is Role =>
  typeof value === 'string' && ROLE_SET.has(value);
