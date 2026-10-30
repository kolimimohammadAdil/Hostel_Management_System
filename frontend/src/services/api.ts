/**
 * HOSTELGUARD AI — Centralized Frontend API Client
 *
 * Configurable base URL via VITE_API_BASE_URL with transparent JWT token injection,
 * error normalization, and session handling.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'hostelguard_auth_token';
const USER_KEY = 'hostelguard_auth_user';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = (): any | null => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setStoredUser = (user: any): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Low-level HTTP fetch wrapper with authorization header injection.
 */
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getStoredToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkErr: any) {
    throw new ApiError(
      `Unable to connect to server at ${API_BASE_URL}. Ensure the backend is running.`,
      0,
      networkErr
    );
  }

  let data: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Clear expired credentials
      removeStoredToken();
      window.dispatchEvent(new CustomEvent('hostelguard:session-expired'));
    }

    const message =
      (data && typeof data === 'object' && (data.message || data.error)) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

// =============================================================================
// API NAMESPACES
// =============================================================================

export const authApi = {
  register: (body: any) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  registerStudent: (body: any) =>
    apiRequest('/auth/register/student', { method: 'POST', body: JSON.stringify(body) }),
  registerParent: (body: any) =>
    apiRequest('/auth/register/parent', { method: 'POST', body: JSON.stringify(body) }),
  login: (credentials: { email?: string; password: string; identifier?: string; rollNumber?: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  demoLogin: (role: string, email?: string) =>
    apiRequest('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role, email }) }),
  getMe: () => apiRequest('/auth/me', { method: 'GET' }),
};

export const leavesApi = {
  apply: (leaveData: any) =>
    apiRequest('/leaves', { method: 'POST', body: JSON.stringify(leaveData) }),
  getMyLeaves: () => apiRequest('/leaves/my', { method: 'GET' }),
  getLeaves: (status?: string) =>
    apiRequest(`/leaves${status ? `?status=${status}` : ''}`, { method: 'GET' }),
  getLateReturns: () => apiRequest('/leaves/late-returns', { method: 'GET' }),
  sendDelayMessage: (id: string, message: string) =>
    apiRequest(`/leaves/${id}/send-delay-message`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  review: (id: string, decision: 'approve' | 'reject', reviewRemarks?: string) =>
    apiRequest(`/leaves/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ decision, reviewRemarks }),
    }),
};

export const movementsApi = {
  getActivePasses: (query?: string) =>
    apiRequest(`/movements/active-passes${query ? `?query=${encodeURIComponent(query)}` : ''}`, {
      method: 'GET',
    }),
  record: (data: any) =>
    apiRequest('/movements/record', { method: 'POST', body: JSON.stringify(data) }),
  getMovements: () => apiRequest('/movements', { method: 'GET' }),
};

export const maintenanceApi = {
  create: (data: any) =>
    apiRequest('/maintenance', { method: 'POST', body: JSON.stringify(data) }),
  getAll: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiRequest(`/maintenance${qs}`, { method: 'GET' });
  },
  update: (id: string, data: any) =>
    apiRequest(`/maintenance/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const notificationsApi = {
  getAll: () => apiRequest('/notifications', { method: 'GET' }),
  markAsRead: (id: string) =>
    apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () =>
    apiRequest('/notifications/read-all', { method: 'PATCH' }),
};

export const parentApi = {
  getStudent: () => apiRequest('/parent/student', { method: 'GET' }),
  getFees: () => apiRequest('/parent/fees', { method: 'GET' }),
  simulatePayment: (amount: number, paymentMethod: string, simulateFailure: boolean = false) =>
    apiRequest('/parent/payments/simulate', {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod, simulateFailure }),
    }),
};

export const messApi = {
  getMenu: () => apiRequest('/mess/menu', { method: 'GET' }),
  updateMenu: (menu: any[]) =>
    apiRequest('/mess/menu', { method: 'POST', body: JSON.stringify({ menu }) }),
  getSchedule: () => apiRequest('/mess/schedule', { method: 'GET' }),
  updateSchedule: (schedule: any) =>
    apiRequest('/mess/schedule', { method: 'PATCH', body: JSON.stringify(schedule) }),
  getComplaints: () => apiRequest('/mess/complaints', { method: 'GET' }),
  submitComplaint: (data: any) =>
    apiRequest('/mess/complaints', { method: 'POST', body: JSON.stringify(data) }),
  updateComplaint: (id: string, data: any) =>
    apiRequest(`/mess/complaints/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const healthApi = {
  check: () => apiRequest('/health', { method: 'GET' }),
};

export const biometricsApi = {
  enroll: (studentId: string, image: string) =>
    apiRequest(`/biometrics/enroll/${studentId}`, {
      method: 'POST',
      body: JSON.stringify({ image }),
    }),
  delete: (studentId: string) =>
    apiRequest(`/biometrics/${studentId}`, { method: 'DELETE' }),
  getStatus: (studentId: string) =>
    apiRequest(`/biometrics/status/${studentId}`, { method: 'GET' }),
  verifyFace: (data: { image: string; expectedStudentId?: string; expectedRollNumber?: string; leaveId?: string }) =>
    apiRequest('/biometrics/verify-face', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  verifyLeaveCheckout: (data: { leaveId: string; image: string }) =>
    apiRequest('/biometrics/verify-leave-checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  verifyLeaveCheckin: (data: { leaveId: string; image: string }) =>
    apiRequest('/biometrics/verify-leave-checkin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  validateFace: (image: string) =>
    apiRequest('/biometrics/validate-face', {
      method: 'POST',
      body: JSON.stringify({ image }),
    }),
};

export const usersApi = {
  getMyProfile: () => apiRequest('/users/me', { method: 'GET' }),
  updateProfile: (updates: { fullName?: string; phone?: string; address?: string; relationship?: string }) =>
    apiRequest('/users/me', { method: 'PATCH', body: JSON.stringify(updates) }),
  uploadProfilePhoto: async (file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}/users/me/profile-photo`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new ApiError(data.message || 'Failed to upload profile photo', response.status, data);
    }
    return data;
  },
  removeProfilePhoto: () => apiRequest('/users/me/profile-photo', { method: 'DELETE' }),
  changePassword: (passwords: { currentPassword: string; newPassword: string }) =>
    apiRequest('/users/me/change-password', { method: 'PATCH', body: JSON.stringify(passwords) }),
};

export const attendanceApi = {
  getRooms: (params?: { date?: string; session?: string; hostel?: string }) => {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.session) query.set('session', params.session);
    if (params?.hostel) query.set('hostel', params.hostel);
    return apiRequest(`/attendance/rooms?${query.toString()}`, { method: 'GET' });
  },
  getRoomDetails: (roomNumber: string, params?: { date?: string; session?: string; hostel?: string }) => {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.session) query.set('session', params.session);
    if (params?.hostel) query.set('hostel', params.hostel);
    return apiRequest(`/attendance/room/${encodeURIComponent(roomNumber)}?${query.toString()}`, { method: 'GET' });
  },
  markAttendance: (data: {
    roomNumber: string;
    floor?: number;
    date: string;
    session: string;
    students: any[];
    hostel?: string;
  }) => apiRequest('/attendance/mark', { method: 'POST', body: JSON.stringify(data) }),
  getReports: (params?: { hostel?: string }) => {
    const query = new URLSearchParams();
    if (params?.hostel) query.set('hostel', params.hostel);
    return apiRequest(`/attendance/reports?${query.toString()}`, { method: 'GET' });
  },
  getMyAttendance: () => apiRequest('/attendance/student/me', { method: 'GET' }),
};

export const adminApi = {
  getMetrics: () => apiRequest('/admin/metrics', { method: 'GET' }),
  getUsers: (params?: { role?: string; search?: string; status?: string; hostel?: string }) => {
    const query = new URLSearchParams();
    if (params?.role) query.set('role', params.role);
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.hostel) query.set('hostel', params.hostel);
    return apiRequest(`/admin/users?${query.toString()}`, { method: 'GET' });
  },
  updateUserStatus: (id: string, status: string) =>
    apiRequest(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  createStaffAccount: (staffData: any) =>
    apiRequest('/admin/users/staff', { method: 'POST', body: JSON.stringify(staffData) }),
  getMonitoringLeaves: (params?: { status?: string; hostel?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.hostel) query.set('hostel', params.hostel);
    return apiRequest(`/admin/monitoring/leaves?${query.toString()}`, { method: 'GET' });
  },
  getMonitoringMovements: (params?: { eventType?: string }) => {
    const query = new URLSearchParams();
    if (params?.eventType) query.set('eventType', params.eventType);
    return apiRequest(`/admin/monitoring/movements?${query.toString()}`, { method: 'GET' });
  },
};

export const complaintsApi = {
  createComplaint: (data: {
    category: string;
    title: string;
    description: string;
    roomNumber?: string;
    hostelName?: string;
  }) => apiRequest('/complaints', { method: 'POST', body: JSON.stringify(data) }),
  getComplaints: (params?: {
    category?: string;
    status?: string;
    department?: string;
    search?: string;
    hostel?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    if (params?.department) query.set('department', params.department);
    if (params?.search) query.set('search', params.search);
    if (params?.hostel) query.set('hostel', params.hostel);
    return apiRequest(`/complaints?${query.toString()}`, { method: 'GET' });
  },
  getComplaintById: (id: string) => apiRequest(`/complaints/${id}`, { method: 'GET' }),
  updateStatus: (
    id: string,
    data: {
      status?: string;
      resolutionDetails?: string;
      assignedDepartment?: string;
      assignedStaffName?: string;
      comment?: string;
      reopenedReason?: string;
    }
  ) => apiRequest(`/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  addComment: (id: string, comment: string) =>
    apiRequest(`/complaints/${id}/comments`, { method: 'POST', body: JSON.stringify({ comment }) }),
};

export const travelSafetyApi = {
  createOrGetSession: (leaveId: string) =>
    apiRequest('/travel-safety/session', { method: 'POST', body: JSON.stringify({ leaveId }) }),
  getMySession: () => apiRequest('/travel-safety/my-session', { method: 'GET' }),
  updateConsent: (sessionId: string, consentGranted: boolean) =>
    apiRequest('/travel-safety/consent', {
      method: 'POST',
      body: JSON.stringify({ sessionId, consentGranted }),
    }),
  postLocation: (data: {
    sessionId: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    addressLabel?: string;
  }) => apiRequest('/travel-safety/location', { method: 'POST', body: JSON.stringify(data) }),
  confirmArrival: (sessionId: string, remarks?: string) =>
    apiRequest('/travel-safety/confirm-arrival', {
      method: 'POST',
      body: JSON.stringify({ sessionId, remarks }),
    }),
  getWardenList: (hostel?: string) => {
    const query = new URLSearchParams();
    if (hostel) query.set('hostel', hostel);
    return apiRequest(`/travel-safety/warden-list?${query.toString()}`, { method: 'GET' });
  },
  getParentStatus: () => apiRequest('/travel-safety/parent-status', { method: 'GET' }),
};

export default {
  auth: authApi,
  users: usersApi,
  leaves: leavesApi,
  movements: movementsApi,
  maintenance: maintenanceApi,
  notifications: notificationsApi,
  parent: parentApi,
  mess: messApi,
  health: healthApi,
  biometrics: biometricsApi,
  attendance: attendanceApi,
  admin: adminApi,
  complaints: complaintsApi,
  travelSafety: travelSafetyApi,
};

