import { UserRole } from '../types';

/**
 * Authoritative central mapping of backend roles to frontend portal routes.
 * Supports all official institutional roles:
 *  1. student -> /student
 *  2. girls_warden -> /girls-warden
 *  3. boys_warden -> /boys-warden
 *  4. gate_security -> /gate-security
 *  5. parent -> /parent
 *  6. mess_incharge -> /mess-incharge
 *  7. maintenance_incharge -> /maintenance-incharge
 *  8. hostel_admin -> /admin
 */
export const ROLE_PORTAL_MAP: Record<UserRole, string> = {
  STUDENT: '/student',
  GIRLS_WARDEN: '/girls-warden',
  BOYS_WARDEN: '/boys-warden',
  GATE_SECURITY: '/gate-security',
  PARENT: '/parent',
  MESS_INCHARGE: '/mess-incharge',
  MAINTENANCE_INCHARGE: '/maintenance-incharge',
  HOSTEL_ADMIN: '/admin',
};

export const getPortalPathForRole = (role: UserRole | null | undefined): string => {
  if (!role) return '/login';
  return ROLE_PORTAL_MAP[role] || '/login';
};

export const getProfilePathForRole = (role: UserRole | null | undefined): string => {
  if (!role) return '/login';
  const basePath = ROLE_PORTAL_MAP[role] || '/login';
  return `${basePath}/profile`;
};

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  STUDENT: 'Resident Student',
  GIRLS_WARDEN: 'Girls Hostel Warden',
  BOYS_WARDEN: 'Boys Hostel Warden',
  GATE_SECURITY: 'Gate Security Officer',
  PARENT: 'Parent / Guardian',
  MESS_INCHARGE: 'Mess Incharge',
  MAINTENANCE_INCHARGE: 'Maintenance Incharge',
  HOSTEL_ADMIN: 'Hostel Administrator',
};
