/**
 * ALTS HOSTEL PORTAL — Avatar and Profile Image Utilities
 *
 * Provides central URL resolution for user profile photos across all seven portals,
 * ensuring relative upload paths (e.g., /api/uploads/profiles/...) resolve to the backend server origin,
 * and graceful fallback handling for missing or broken image assets.
 */

const API_BASE_URL: string =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  'http://localhost:5000/api';

/**
 * Backend root origin (e.g. "http://localhost:5000") derived from API_BASE_URL.
 */
export const BACKEND_ORIGIN: string = API_BASE_URL.replace(/\/api\/?$/, '');

/**
 * Resolves any raw avatar or profile photo URL to an absolute, loadable browser URL.
 * - Handles relative backend paths: "/api/uploads/profiles/..." -> "http://localhost:5000/api/uploads/profiles/..."
 * - Handles relative static paths: "/uploads/profiles/..." -> "http://localhost:5000/uploads/profiles/..."
 * - Preserves absolute URLs: "https://images.unsplash.com/..."
 * - Preserves blob/data URLs: "blob:...", "data:image/..."
 */
export const getResolvedAvatarUrl = (rawUrl?: string | null): string | null => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  // Already absolute or browser protocol
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Relative backend upload route
  if (trimmed.startsWith('/')) {
    return `${BACKEND_ORIGIN}${trimmed}`;
  }

  // Plain relative filename
  return `${BACKEND_ORIGIN}/${trimmed}`;
};

/**
 * Generates 1-2 letter uppercase initials from a user's full name.
 */
export const getInitials = (name?: string | null): string => {
  if (!name || typeof name !== 'string') {
    return 'U';
  }
  const clean = name.trim();
  if (!clean) return 'U';

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (clean[0] || 'U').toUpperCase();
};

