import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserRole, 
  StudentProfile, 
  LeaveRequest, 
  GateMovementRecord, 
  SystemNotification,
  AuditActivity,
  LeaveStatus,
  Parent,
  FeeAccount,
  FeeTransaction,
  Announcement,
  MealType,
  MenuItem,
  MenuEntry,
  MessSchedule,
  FoodComplaint,
  FoodComplaintCategory,
  FoodComplaintStatus,
  MaintenanceIssue,
  MaintenanceCategory,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceNote,
  HostelRoom
} from '../types';
import { 
  INITIAL_STUDENTS, 
  INITIAL_LEAVE_REQUESTS, 
  INITIAL_MOVEMENT_RECORDS, 
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  WARDEN_PROFILES,
  INITIAL_PARENTS,
  INITIAL_FEE_ACCOUNTS,
  INITIAL_FEE_TRANSACTIONS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_MENU_ENTRIES,
  INITIAL_MESS_SCHEDULE,
  INITIAL_FOOD_COMPLAINTS,
  INITIAL_MAINTENANCE_ISSUES,
  INITIAL_HOSTEL_ROOMS,
  TODAY_STR,
  TOMORROW_STR
} from '../data/demoData';
import {
  authApi,
  leavesApi,
  movementsApi,
  maintenanceApi,
  notificationsApi,
  parentApi,
  messApi,
  travelSafetyApi,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  getStoredUser,
  setStoredUser,
} from '../services/api';
import {
  connectSocket,
  disconnectSocket,
  onNewNotification,
  onSocketStatus,
  onSocketEvent,
} from '../services/socket';

export const mapBackendRoleToFrontend = (roleStr: string): UserRole => {
  const norm = String(roleStr || '').toLowerCase().trim();
  switch (norm) {
    case 'student':
      return 'STUDENT';
    case 'girls_warden':
      return 'GIRLS_WARDEN';
    case 'boys_warden':
      return 'BOYS_WARDEN';
    case 'gate_security':
      return 'GATE_SECURITY';
    case 'parent':
      return 'PARENT';
    case 'mess_incharge':
      return 'MESS_INCHARGE';
    case 'maintenance_incharge':
      return 'MAINTENANCE_INCHARGE';
    case 'hostel_admin':
      return 'HOSTEL_ADMIN';
    default:
      return 'STUDENT';
  }
};

export const mapFrontendRoleToBackend = (role: UserRole): string => {
  return role.toLowerCase();
};

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface AppContextType {
  role: UserRole | null;
  setRole: (role: UserRole | null) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Students & Persona State
  students: StudentProfile[];
  activeStudent: StudentProfile;
  setActiveStudentId: (id: string) => void;

  // Gate & Leaves
  leaveRequests: LeaveRequest[];
  movementRecords: GateMovementRecord[];
  notifications: SystemNotification[];
  auditLogs: AuditActivity[];
  realtimeConnected: boolean;
  notificationsLoading: boolean;
  applyLeave: (leaveData: {
    leaveType: LeaveRequest['leaveType'];
    departureDate: string;
    departureTime: string;
    returnDate: string;
    returnTime: string;
    reason: string;
    destinationAddress: string;
    parentContactVerified: boolean;
    biometricFrame?: string;
    biometricConsent?: boolean;
  }) => boolean;
  approveLeave: (leaveId: string, reviewedBy?: string) => boolean;
  rejectLeave: (leaveId: string, reason: string, reviewedBy?: string) => boolean;
  recordGateMovement: (movement: Omit<GateMovementRecord, 'id' | 'timestamp'>) => boolean;
  logAuditActivity: (activity: Omit<AuditActivity, 'id' | 'timestamp'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: (targetRole?: UserRole | 'ALL') => void;

  // Parent & Fees
  parents: Parent[];
  activeParent: Parent;
  setActiveParentId: (id: string) => void;
  feeAccounts: FeeAccount[];
  feeTransactions: FeeTransaction[];
  makeDemoPayment: (
    studentId: string,
    amount: number,
    paymentMethod: 'UPI' | 'NET_BANKING' | 'DEBIT_CARD' | 'CREDIT_CARD',
    simulateFailure?: boolean
  ) => { success: boolean; message: string; transaction?: FeeTransaction };

  // Announcements
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'publishedAt'>) => void;

  // Mess & Food Menu
  menuEntries: MenuEntry[];
  todayMenu: MenuEntry;
  updateMenu: (
    date: string,
    mealType: MealType,
    items: MenuItem[],
    timings?: { startTime: string; endTime: string }
  ) => boolean;
  messSchedule: MessSchedule;
  updateMessSchedule: (updates: Partial<MessSchedule>) => void;
  foodComplaints: FoodComplaint[];
  submitFoodComplaint: (complaint: {
    studentId: string;
    category: FoodComplaintCategory;
    mealType: MealType;
    description: string;
  }) => string;
  updateFoodComplaint: (
    id: string,
    updates: {
      status: FoodComplaintStatus;
      response?: string;
      respondedBy?: string;
    }
  ) => boolean;

  // Hostel Maintenance
  maintenanceIssues: MaintenanceIssue[];
  reportMaintenanceIssue: (issue: {
    hostel: 'Chakrika Girls Hostel' | 'ALTS Boys Hostel' | 'Kaveri Girls Hostel' | 'Ganga Boys Hostel';
    roomNumber: string;
    category: MaintenanceCategory;
    priority: MaintenancePriority;
    description: string;
    reporter: string;
    reporterRole: UserRole;
  }) => string;
  updateMaintenanceIssue: (
    id: string,
    updates: {
      status?: MaintenanceStatus;
      assignedTo?: string;
      estimatedResolutionDate?: string;
      resolutionDetails?: string;
      note?: string;
      updatedBy?: string;
      updatedByRole?: string;
    }
  ) => boolean;
  reopenMaintenanceIssue: (id: string, reason: string, reopenedBy: string) => boolean;
  hostelRooms: HostelRoom[];

  // Authentication State
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authUser: any | null;
  updateAuthUser: (user: any) => void;
  refreshUserProfile: () => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  registerStudent: (data: any) => Promise<{ success: boolean; message: string; user?: any }>;
  registerParent: (data: any) => Promise<{ success: boolean; message: string; user?: any }>;
  logout: () => void;

  // Global actions
  resetDemoData: () => void;
  toasts: ToastMessage[];
  addToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Storage keys for demonstration session persistence
const STORAGE_KEYS = {
  ROLE: 'hostelguard_demo_role',
  THEME: 'hostelguard_theme',
  STUDENTS: 'hostelguard_students_v1',
  LEAVES: 'hostelguard_leaves_v1',
  MOVEMENTS: 'hostelguard_movements_v1',
  NOTIFS: 'hostelguard_notifs_v1',
  AUDIT: 'hostelguard_audit_v1',
  ACTIVE_STUDENT: 'hostelguard_active_student_id',
  ACTIVE_PARENT: 'hostelguard_active_parent_id',
  PARENTS: 'hostelguard_parents_v1',
  FEE_ACCOUNTS: 'hostelguard_fee_accounts_v1',
  FEE_TRANSACTIONS: 'hostelguard_fee_transactions_v1',
  ANNOUNCEMENTS: 'hostelguard_announcements_v1',
  MENU_ENTRIES: 'hostelguard_menu_entries_v1',
  MESS_SCHEDULE: 'hostelguard_mess_schedule_v1',
  FOOD_COMPLAINTS: 'hostelguard_food_complaints_v1',
  MAINTENANCE_ISSUES: 'hostelguard_maintenance_issues_v1',
  HOSTEL_ROOMS: 'hostelguard_hostel_rooms_v1',
};

// Safe localStorage JSON parser with graceful fallback
const safeGetJSON = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return Array.isArray(fallback) && !Array.isArray(parsed) ? fallback : parsed;
  } catch (err) {
    console.warn(`[HostelGuard AI Demo] LocalStorage key ${key} corrupted; restoring fallback.`, err);
    return fallback;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state (defaults to dark for high-tech security terminal aesthetic)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // Fallback
    }
    return 'dark';
  });

  // Role state - authoritative role strictly comes from verified backend JWT (/api/auth/me)
  const [role, setRoleState] = useState<UserRole | null>(null);

  // Active student id for resident scholar workspace view
  const [activeStudentId, setActiveStudentId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_STUDENT) || 'std_g_01';
    } catch {
      return 'std_g_01';
    }
  });

  // Active parent id for parent portal view
  const [activeParentId, setActiveParentId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_PARENT) || 'par_01';
    } catch {
      return 'par_01';
    }
  });

  // Persistent demonstration state in localStorage
  const [students, setStudents] = useState<StudentProfile[]>(() =>
    safeGetJSON(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS)
  );

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() =>
    safeGetJSON(STORAGE_KEYS.LEAVES, INITIAL_LEAVE_REQUESTS)
  );

  const [movementRecords, setMovementRecords] = useState<GateMovementRecord[]>(() =>
    safeGetJSON(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENT_RECORDS)
  );

  const [notifications, setNotifications] = useState<SystemNotification[]>(() =>
    safeGetJSON(STORAGE_KEYS.NOTIFS, INITIAL_NOTIFICATIONS)
  );

  const [auditLogs, setAuditLogs] = useState<AuditActivity[]>(() =>
    safeGetJSON(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS)
  );

  // Parent & Fee State
  const [parents, setParents] = useState<Parent[]>(() =>
    safeGetJSON(STORAGE_KEYS.PARENTS, INITIAL_PARENTS)
  );

  const [feeAccounts, setFeeAccounts] = useState<FeeAccount[]>(() =>
    safeGetJSON(STORAGE_KEYS.FEE_ACCOUNTS, INITIAL_FEE_ACCOUNTS)
  );

  const [feeTransactions, setFeeTransactions] = useState<FeeTransaction[]>(() =>
    safeGetJSON(STORAGE_KEYS.FEE_TRANSACTIONS, INITIAL_FEE_TRANSACTIONS)
  );

  // Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    safeGetJSON(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS)
  );

  // Mess & Menu State
  const [menuEntries, setMenuEntries] = useState<MenuEntry[]>(() =>
    safeGetJSON(STORAGE_KEYS.MENU_ENTRIES, INITIAL_MENU_ENTRIES)
  );

  const [messSchedule, setMessSchedule] = useState<MessSchedule>(() =>
    safeGetJSON(STORAGE_KEYS.MESS_SCHEDULE, INITIAL_MESS_SCHEDULE)
  );

  const [foodComplaints, setFoodComplaints] = useState<FoodComplaint[]>(() =>
    safeGetJSON(STORAGE_KEYS.FOOD_COMPLAINTS, INITIAL_FOOD_COMPLAINTS)
  );

  // Maintenance State
  const [maintenanceIssues, setMaintenanceIssues] = useState<MaintenanceIssue[]>(() =>
    safeGetJSON(STORAGE_KEYS.MAINTENANCE_ISSUES, INITIAL_MAINTENANCE_ISSUES)
  );

  const [hostelRooms, setHostelRooms] = useState<HostelRoom[]>(() =>
    safeGetJSON(STORAGE_KEYS.HOSTEL_ROOMS, INITIAL_HOSTEL_ROOMS)
  );

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Authentication & session state
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(() => !!getStoredToken());

  // Restore authenticated session strictly from backend verification on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = getStoredToken();
      if (!token) {
        setIsAuthenticated(false);
        setAuthUser(null);
        setRoleState(null);
        setIsAuthenticating(false);
        return;
      }

      setIsAuthenticating(true);
      try {
        const response = await authApi.getMe();
        if (response && response.success && response.user) {
          setAuthUser(response.user);
          setStoredUser(response.user);
          const mapped = mapBackendRoleToFrontend(response.user.role);
          setRoleState(mapped);
          setIsAuthenticated(true);
        } else {
          removeStoredToken();
          setIsAuthenticated(false);
          setAuthUser(null);
          setRoleState(null);
        }
      } catch (err: any) {
        removeStoredToken();
        setIsAuthenticated(false);
        setAuthUser(null);
        setRoleState(null);
      } finally {
        setIsAuthenticating(false);
      }
    };

    restoreSession();

    const handleSessionExpired = () => {
      removeStoredToken();
      setIsAuthenticated(false);
      setAuthUser(null);
      setRoleState(null);
      disconnectSocket();
      try {
        localStorage.removeItem(STORAGE_KEYS.ROLE);
      } catch {
        // Ignore
      }
      addToast(
        'Session Expired',
        'Your authentication session has expired. Please sign in again.',
        'warning'
      );
    };

    window.addEventListener('hostelguard:session-expired', handleSessionExpired);
    window.addEventListener('alts:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('hostelguard:session-expired', handleSessionExpired);
      window.removeEventListener('alts:session-expired', handleSessionExpired);
    };
  }, []);

  // Real-time Socket.IO Connection & Notification Lifecycle
  const [realtimeConnected, setRealtimeConnected] = useState<boolean>(false);
  const [notificationsLoading, setNotificationsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      setRealtimeConnected(false);
      return;
    }

    const token = getStoredToken();
    if (!token) return;

    // Connect authenticated Socket.IO instance
    connectSocket(token);

    const unsubStatus = onSocketStatus((connected) => {
      setRealtimeConnected(connected);
    });

    const unsubNotif = onNewNotification((newNotif) => {
      const mapped: SystemNotification = {
        id: newNotif.id,
        title: newNotif.title,
        message: newNotif.message,
        timestamp: 'Just now',
        read: false,
        type: newNotif.type === 'leave_update' ? 'INFO' : 'INFO',
        targetRole: 'ALL',
        category: (newNotif.type?.toUpperCase() as any) || 'GENERAL',
      };

      setNotifications((prev) => {
        // Prevent duplicate notification delivery
        if (prev.some((n) => n.id === mapped.id)) return prev;
        return [mapped, ...prev];
      });

      addToast(
        newNotif.title,
        newNotif.message,
        newNotif.type === 'gate_movement' ? 'info' : 'success'
      );
    });

    // Fetch initial notification history from MongoDB
    const fetchHistory = async () => {
      try {
        setNotificationsLoading(true);
        const res = await notificationsApi.getAll();
        if (res && res.success && Array.isArray(res.notifications)) {
          const backendMapped: SystemNotification[] = res.notifications.map((n: any) => ({
            id: n._id || n.id,
            title: n.title,
            message: n.message,
            timestamp: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: Boolean(n.isRead),
            type: n.type === 'leave_update' ? 'INFO' : 'INFO',
            targetRole: 'ALL',
            category: (n.type?.toUpperCase() as any) || 'GENERAL',
          }));

          setNotifications((prev) => {
            const existingIds = new Set(backendMapped.map((b) => b.id));
            const retainedLocal = prev.filter((p) => !existingIds.has(p.id));
            return [...backendMapped, ...retainedLocal];
          });
        }
      } catch (err) {
        console.warn('[HostelGuard AI] Backend notifications fetch note:', err);
      } finally {
        setNotificationsLoading(false);
      }
    };

    fetchHistory();

    // Fetch and synchronize leave requests from MongoDB Atlas
    const syncBackendLeaves = async () => {
      try {
        const leaveRes = await leavesApi.getLeaves();
        if (leaveRes && leaveRes.success && Array.isArray(leaveRes.leaves)) {
          const mappedLeaves: LeaveRequest[] = leaveRes.leaves.map((l: any) => {
            const student = l.student || {};
            const isFemale =
              (student.hostelName || '').toLowerCase().includes('chakrika') ||
              (student.hostelName || '').toLowerCase().includes('kaveri') ||
              (student.hostelName || '').toLowerCase().includes('girls');
            const dep = l.departureTime ? new Date(l.departureTime) : new Date();
            const ret = l.expectedReturnTime ? new Date(l.expectedReturnTime) : new Date();

            let mappedStatus: LeaveStatus = 'PENDING';
            const rawStatus = (l.status || '').toLowerCase();
            if (rawStatus === 'approved') mappedStatus = 'APPROVED';
            else if (rawStatus === 'checked_out') mappedStatus = 'CHECKED_OUT';
            else if (rawStatus === 'returned') mappedStatus = 'RETURNED';
            else if (rawStatus === 'rejected') mappedStatus = 'REJECTED';

            return {
              id: l._id || l.id,
              studentId: student._id || student.id || 'std_unknown',
              studentName: student.fullName || 'Resident Student',
              studentRollNo: student.rollNumber || 'ALTS-STUDENT',
              studentPhoto:
                student.photoUrl ||
                (isFemale
                  ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'
                  : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'),
              gender: isFemale ? 'FEMALE' : 'MALE',
              hostelName: student.hostelName || (isFemale ? 'Chakrika Girls Hostel' : 'ALTS Boys Hostel'),
              roomNumber: student.roomNumber || 'N/A',
              leaveType: ((l.leaveType || 'DAY_OUTING').toUpperCase().replace(' ', '_') as any) || 'DAY_OUTING',
              departureDate: dep.toISOString().split('T')[0],
              departureTime: dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              returnDate: ret.toISOString().split('T')[0],
              returnTime: ret.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              reason: l.reason || '',
              destinationAddress: l.destination || '',
              parentContactVerified: true,
              status: mappedStatus,
              appliedAt: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : 'Today',
              reviewedAt: l.reviewedAt ? new Date(l.reviewedAt).toLocaleDateString() : undefined,
              reviewedBy: l.reviewingWarden?.fullName || undefined,
              gatePassToken: l.gatePassToken || `GP-${String(l._id || '').slice(-6).toUpperCase()}`,
              isBiometricEnrolled: Boolean(l.biometricTemplate?.status === 'enrolled'),
              capturedFacePreview: l.biometricTemplate?.capturedFacePreview,
              biometricConsent: l.biometricTemplate?.consentGiven,
              isLate: l.isLate,
            };
          });

          setLeaveRequests((prev) => {
            const existingIds = new Set(mappedLeaves.map((m) => m.id));
            const retained = prev.filter((p) => !existingIds.has(p.id));
            return [...mappedLeaves, ...retained];
          });
        }
      } catch (err) {
        console.warn('[HostelGuard AI] Backend leaves sync note:', err);
      }
    };

    syncBackendLeaves();

    // Listen to real-time socket events for leave lifecycle
    const unsubLeaveApproved = onSocketEvent('leave:approved', () => {
      syncBackendLeaves();
    });

    const unsubGateRefresh = onSocketEvent('gate:refresh', () => {
      syncBackendLeaves();
    });

    return () => {
      unsubStatus();
      unsubNotif();
      unsubLeaveApproved();
      unsubGateRefresh();
    };
  }, [isAuthenticated]);

  // Apply theme class to HTML root and document body
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  // Sync demonstration state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch {
      // Ignore
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaveRequests));
    } catch {
      // Ignore
    }
  }, [leaveRequests]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movementRecords));
    } catch {
      // Ignore
    }
  }, [movementRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(notifications));
    } catch {
      // Ignore
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
    } catch {
      // Ignore
    }
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_STUDENT, activeStudentId);
    } catch {
      // Ignore
    }
  }, [activeStudentId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PARENT, activeParentId);
    } catch {
      // Ignore
    }
  }, [activeParentId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PARENTS, JSON.stringify(parents));
    } catch {
      // Ignore
    }
  }, [parents]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FEE_ACCOUNTS, JSON.stringify(feeAccounts));
    } catch {
      // Ignore
    }
  }, [feeAccounts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FEE_TRANSACTIONS, JSON.stringify(feeTransactions));
    } catch {
      // Ignore
    }
  }, [feeTransactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
    } catch {
      // Ignore
    }
  }, [announcements]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MENU_ENTRIES, JSON.stringify(menuEntries));
    } catch {
      // Ignore
    }
  }, [menuEntries]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MESS_SCHEDULE, JSON.stringify(messSchedule));
    } catch {
      // Ignore
    }
  }, [messSchedule]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FOOD_COMPLAINTS, JSON.stringify(foodComplaints));
    } catch {
      // Ignore
    }
  }, [foodComplaints]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MAINTENANCE_ISSUES, JSON.stringify(maintenanceIssues));
    } catch {
      // Ignore
    }
  }, [maintenanceIssues]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HOSTEL_ROOMS, JSON.stringify(hostelRooms));
    } catch {
      // Ignore
    }
  }, [hostelRooms]);

  const setRole = (newRole: UserRole | null) => {
    setRoleState(newRole);
    try {
      if (newRole) {
        localStorage.setItem(STORAGE_KEYS.ROLE, newRole);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ROLE);
      }
    } catch {
      // Ignore
    }

    if (!newRole) {
      removeStoredToken();
      setAuthUser(null);
      setIsAuthenticated(false);
      disconnectSocket();
    }
  };

  const updateAuthUser = (user: any) => {
    setAuthUser(user);
    setStoredUser(user);
    const newPhoto = user?.avatarUrl || user?.photoUrl;
    if (newPhoto) {
      setStudents((prev) =>
        prev.map((s) => {
          if (
            (user.rollNumber && s.rollNumber === user.rollNumber) ||
            (user.id && s.id === user.id) ||
            (user._id && s.id === user._id)
          ) {
            return { ...s, photoUrl: newPhoto };
          }
          return s;
        })
      );
    }
  };

  const refreshUserProfile = async () => {
    try {
      const response = await authApi.getMe();
      if (response && response.success && response.user) {
        updateAuthUser(response.user);
      }
    } catch {
      // Ignore
    }
  };

  const loginWithCredentials = async (
    identifier: string,
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    setIsAuthenticating(true);
    try {
      const result = await authApi.login({ identifier, email: identifier, password });
      if (result.success && result.token && result.user) {
        setStoredToken(result.token);
        setStoredUser(result.user);
        setAuthUser(result.user);
        const mappedRole = mapBackendRoleToFrontend(result.user.role);
        setRoleState(mappedRole);
        try {
          localStorage.setItem(STORAGE_KEYS.ROLE, mappedRole);
        } catch {
          // Ignore
        }
        setIsAuthenticated(true);
        addToast(
          'Sign In Successful',
          `Welcome to ALTS Portal, ${result.user.fullName} (${mappedRole.replace('_', ' ')})`,
          'success'
        );
        return { success: true, message: result.message || 'Login successful' };
      }
      return { success: false, message: result.message || 'Invalid credentials' };
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please verify credentials.';
      addToast('Login Failed', msg, 'error');
      return { success: false, message: msg };
    } finally {
      setIsAuthenticating(false);
    }
  };

  const registerStudent = async (
    data: any
  ): Promise<{ success: boolean; message: string; user?: any }> => {
    setIsAuthenticating(true);
    try {
      const result = await authApi.registerStudent(data);
      if (result.success && result.token && result.user) {
        setStoredToken(result.token);
        setStoredUser(result.user);
        setAuthUser(result.user);
        const mappedRole = mapBackendRoleToFrontend(result.user.role);
        setRoleState(mappedRole);
        try {
          localStorage.setItem(STORAGE_KEYS.ROLE, mappedRole);
        } catch {
          // Ignore
        }
        setIsAuthenticated(true);
        addToast(
          'Registration Successful',
          `Welcome to ALTS Hostel Portal, ${result.user.fullName}! Your student account is now active.`,
          'success'
        );
        return { success: true, message: result.message || 'Student registration successful', user: result.user };
      }
      return { success: false, message: result.message || 'Registration failed' };
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please check your details.';
      addToast('Registration Failed', msg, 'error');
      return { success: false, message: msg };
    } finally {
      setIsAuthenticating(false);
    }
  };

  const registerParent = async (
    data: any
  ): Promise<{ success: boolean; message: string; user?: any }> => {
    setIsAuthenticating(true);
    try {
      const result = await authApi.registerParent(data);
      if (result.success && result.token && result.user) {
        setStoredToken(result.token);
        setStoredUser(result.user);
        setAuthUser(result.user);
        const mappedRole = mapBackendRoleToFrontend(result.user.role);
        setRoleState(mappedRole);
        try {
          localStorage.setItem(STORAGE_KEYS.ROLE, mappedRole);
        } catch {
          // Ignore
        }
        setIsAuthenticated(true);
        addToast(
          'Registration Successful',
          `Welcome to ALTS Hostel Portal, ${result.user.fullName}! Your guardian account is verified and linked.`,
          'success'
        );
        return { success: true, message: result.message || 'Guardian registration successful', user: result.user };
      }
      return { success: false, message: result.message || 'Registration failed' };
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please check your details.';
      addToast('Registration Failed', msg, 'error');
      return { success: false, message: msg };
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = () => {
    removeStoredToken();
    setAuthUser(null);
    setRoleState(null);
    setIsAuthenticated(false);
    disconnectSocket();
    try {
      localStorage.removeItem(STORAGE_KEYS.ROLE);
      localStorage.removeItem(STORAGE_KEYS.LEAVES);
      localStorage.removeItem(STORAGE_KEYS.NOTIFS);
    } catch {
      // Ignore
    }
    addToast('Logged Out', 'You have been safely signed out from ALTS Portal.', 'info');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const addToast = (title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Currently active student persona derived from authenticated user
  const activeStudent: StudentProfile = React.useMemo(() => {
    if (authUser && (authUser.role === 'student' || authUser.rollNumber)) {
      const isFemale = authUser.hostelName?.toLowerCase().includes('girl') || false;
      const baseStudent = students[0];
      return {
        ...baseStudent,
        id: authUser.id || authUser._id || 'std_real',
        name: authUser.fullName || 'Resident Student',
        rollNumber: authUser.rollNumber || 'ALTS-STUDENT',
        gender: isFemale ? 'FEMALE' : 'MALE',
        hostelName: authUser.hostelName || (isFemale ? 'Chakrika Girls Hostel' : 'ALTS Boys Hostel'),
        roomNumber: authUser.roomNumber || 'A-101',
        hostelBlock: isFemale ? 'Chakrika Block B' : 'ALTS Block A',
        branch: 'Computer Science & Engineering',
        year: '3rd Year (VI Sem)',
        studentPhone: authUser.phone || '9876543210',
        photoUrl: authUser.avatarUrl || authUser.photoUrl || baseStudent.photoUrl,
        currentStatus: 'IN_HOSTEL',
      };
    }
    return students.find((s) => s.id === activeStudentId) || students[0];
  }, [authUser, students, activeStudentId]);

  // Currently active parent persona (corresponds to active student or parent list)
  const activeParent =
    parents.find((p) => p.id === activeParentId) ||
    parents.find((p) => p.studentId === activeStudent.id) ||
    parents[0];

  // Today's menu entry helper
  const todayMenu =
    menuEntries.find((m) => m.date === TODAY_STR) ||
    menuEntries[0] ||
    INITIAL_MENU_ENTRIES[0];

  // Helper to log centralized audit activities
  const logAuditActivity = (activity: Omit<AuditActivity, 'id' | 'timestamp'>) => {
    const now = new Date();
    const formatted = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newEntry: AuditActivity = {
      ...activity,
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: formatted,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  /**
   * Leave Application
   */
  const applyLeave = (leaveData: {
    leaveType: LeaveRequest['leaveType'];
    departureDate: string;
    departureTime: string;
    returnDate: string;
    returnTime: string;
    reason: string;
    destinationAddress: string;
    parentContactVerified: boolean;
    biometricFrame?: string;
    biometricConsent?: boolean;
  }): boolean => {
    if (
      !leaveData.departureDate ||
      !leaveData.departureTime ||
      !leaveData.returnDate ||
      !leaveData.returnTime ||
      !leaveData.reason.trim() ||
      !leaveData.destinationAddress.trim()
    ) {
      addToast('Validation Failed', 'All mandatory fields marked with * must be filled.', 'error');
      return false;
    }

    if (!leaveData.biometricConsent) {
      addToast('Consent Required', 'Facial biometric consent is mandatory for gate clearance.', 'error');
      return false;
    }

    if (!leaveData.biometricFrame) {
      addToast('Biometric Photo Required', 'Please capture your face using the live camera before submitting.', 'error');
      return false;
    }

    if (leaveData.departureDate > leaveData.returnDate) {
      addToast('Invalid Schedule', 'Return date cannot be earlier than departure date.', 'error');
      return false;
    }

    if (leaveData.departureDate === leaveData.returnDate) {
      if (leaveData.returnTime <= leaveData.departureTime) {
        addToast('Invalid Time Window', 'Expected return time must be after the departure time.', 'error');
        return false;
      }
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const newLeaveId = `LV-${now.getFullYear()}-${String(leaveRequests.length + 1).padStart(3, '0')}`;
    const targetWarden: UserRole = activeStudent.gender === 'FEMALE' ? 'GIRLS_WARDEN' : 'BOYS_WARDEN';

    const newRequest: LeaveRequest = {
      id: newLeaveId,
      studentId: activeStudent.id,
      studentName: activeStudent.name,
      studentRollNo: activeStudent.rollNumber,
      studentPhoto: activeStudent.photoUrl,
      gender: activeStudent.gender,
      hostelName: activeStudent.hostelName,
      roomNumber: activeStudent.roomNumber,
      leaveType: leaveData.leaveType,
      departureDate: leaveData.departureDate,
      departureTime: leaveData.departureTime,
      returnDate: leaveData.returnDate,
      returnTime: leaveData.returnTime,
      reason: leaveData.reason.trim(),
      destinationAddress: leaveData.destinationAddress.trim(),
      parentContactVerified: leaveData.parentContactVerified,
      status: 'PENDING',
      appliedAt: `${formattedDate} ${formattedTime}`,
      isBiometricEnrolled: true,
      capturedFacePreview: leaveData.biometricFrame,
      biometricConsent: true,
    };

    setLeaveRequests((prev) => [newRequest, ...prev]);

    // Dispatch notification to respective hostel warden and parent
    const wardenNotification: SystemNotification = {
      id: `notif_${Date.now()}`,
      title: 'New Leave Request Received',
      message: `${activeStudent.name} (${activeStudent.rollNumber}) applied for ${leaveData.leaveType.replace('_', ' ')}. Review in hostel queue.`,
      timestamp: 'Just now',
      read: false,
      type: 'INFO',
      targetRole: targetWarden,
      category: 'LEAVE',
    };

    const parentNotification: SystemNotification = {
      id: `notif_${Date.now() + 1}`,
      title: 'Leave Application Logged',
      message: `Your ward ${activeStudent.name} applied for ${leaveData.leaveType.replace('_', ' ')} (${leaveData.departureDate} to ${leaveData.returnDate}). Awaiting warden review.`,
      timestamp: 'Just now',
      read: false,
      type: 'INFO',
      targetRole: 'PARENT',
      category: 'LEAVE',
    };

    setNotifications((prev) => [wardenNotification, parentNotification, ...prev]);

    logAuditActivity({
      actionType: 'LEAVE_SUBMITTED',
      entityId: newLeaveId,
      entityName: `${activeStudent.name} (${activeStudent.rollNumber})`,
      performedBy: activeStudent.name,
      performedByRole: 'STUDENT',
      hostel: activeStudent.hostelName as 'Chakrika Girls Hostel' | 'ALTS Boys Hostel' | 'Kaveri Girls Hostel' | 'Ganga Boys Hostel',
      details: `${leaveData.leaveType.replace('_', ' ')} applied: ${leaveData.departureDate} ${leaveData.departureTime} to ${leaveData.returnDate} ${leaveData.returnTime}.`,
    });

    addToast(
      'Leave Application Submitted',
      `Application ${newLeaveId} submitted for ${activeStudent.hostelName} warden review.`,
      'success'
    );

    // Asynchronous backend persistence to MongoDB Atlas
    leavesApi
      .apply({
        leaveType: leaveData.leaveType,
        reason: leaveData.reason.trim(),
        destination: leaveData.destinationAddress.trim(),
        departureTime: `${leaveData.departureDate}T${leaveData.departureTime}:00.000Z`,
        expectedReturnTime: `${leaveData.returnDate}T${leaveData.returnTime}:00.000Z`,
        departureDate: `${leaveData.departureDate}T${leaveData.departureTime}:00.000Z`,
        expectedReturnDate: `${leaveData.returnDate}T${leaveData.returnTime}:00.000Z`,
        biometricFrame: leaveData.biometricFrame,
        biometricConsent: leaveData.biometricConsent,
      })
      .then((res: any) => {
        const savedLeave = res?.leave || res?.data;
        if (savedLeave && (savedLeave._id || savedLeave.id)) {
          const actualId = savedLeave._id || savedLeave.id;
          console.log('[HostelGuard AI] Leave saved to MongoDB Atlas:', actualId);
          setLeaveRequests((prev) =>
            prev.map((r) => (r.id === newLeaveId ? { ...r, id: actualId, _id: actualId } : r))
          );
        }
      })
      .catch((err) => {
        console.warn('[HostelGuard AI] Backend leave persistence note:', err?.message || err);
      });

    return true;
  };

  /**
   * Warden Approval Workflow
   */
  const approveLeave = (leaveId: string, reviewedBy?: string): boolean => {
    const targetReq = leaveRequests.find((r) => r.id === leaveId);
    if (!targetReq) {
      addToast('Error', 'Application not found.', 'error');
      return false;
    }

    if (targetReq.status !== 'PENDING') {
      addToast('Action Prohibited', `Only PENDING requests can receive a decision. Current status: ${targetReq.status}`, 'warning');
      return false;
    }

    if (role === 'GIRLS_WARDEN' && targetReq.gender !== 'FEMALE') {
      addToast('Authorization Error', 'Girls Hostel Warden cannot review or approve Boys Hostel applications.', 'error');
      return false;
    }
    if (role === 'BOYS_WARDEN' && targetReq.gender !== 'MALE') {
      addToast('Authorization Error', 'Boys Hostel Warden cannot review or approve Girls Hostel applications.', 'error');
      return false;
    }

    const now = new Date();
    const defaultReviewer =
      reviewedBy || (targetReq.gender === 'FEMALE' ? WARDEN_PROFILES.GIRLS_WARDEN.name : WARDEN_PROFILES.BOYS_WARDEN.name);

    const prefix = targetReq.gender === 'FEMALE' ? 'KAV' : 'GAN';
    const token = `GP-HG-${now.getFullYear()}-${prefix}-${targetReq.studentRollNo.slice(-3)}`;

    setLeaveRequests((prev) =>
      prev.map((req) => {
        if (req.id === leaveId) {
          return {
            ...req,
            status: 'APPROVED' as LeaveStatus,
            reviewedAt: `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            reviewedBy: defaultReviewer,
            gatePassToken: token,
          };
        }
        return req;
      })
    );

    // Notify student & parent
    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: 'Leave Request Approved!',
        message: `Your leave ${leaveId} has been approved by ${defaultReviewer}. Digital Gate Pass issued.`,
        timestamp: 'Just now',
        read: false,
        type: 'SUCCESS',
        targetRole: 'STUDENT',
        category: 'LEAVE',
      },
      {
        id: `notif_${Date.now() + 1}`,
        title: 'Leave Pass Approved by Warden',
        message: `Leave ${leaveId} for ${targetReq.studentName} approved by ${defaultReviewer}. Gate pass token generated.`,
        timestamp: 'Just now',
        read: false,
        type: 'SUCCESS',
        targetRole: 'PARENT',
        category: 'LEAVE',
      },
      ...prev,
    ]);

    logAuditActivity({
      actionType: 'LEAVE_APPROVED',
      entityId: leaveId,
      entityName: `${targetReq.studentName} (${targetReq.studentRollNo})`,
      performedBy: defaultReviewer,
      performedByRole: targetReq.gender === 'FEMALE' ? 'GIRLS_WARDEN' : 'BOYS_WARDEN',
      hostel: targetReq.hostelName as 'Chakrika Girls Hostel' | 'ALTS Boys Hostel' | 'Kaveri Girls Hostel' | 'Ganga Boys Hostel',
      details: `Approved ${targetReq.leaveType.replace('_', ' ')}. Digital Pass Token: ${token}`,
    });

    addToast(
      'Leave Approved',
      `Digital Gate Pass ${token} generated for ${targetReq.studentName}.`,
      'success'
    );

    // Instant local caching of the approved travel session so Student & Parent portals activate immediately
    const sessionPayload = {
      id: `ts_${leaveId}`,
      leaveId: leaveId,
      studentId: targetReq.studentId,
      studentName: targetReq.studentName,
      studentRollNo: targetReq.studentRollNo,
      hostelName: targetReq.hostelName,
      destination: targetReq.destination || targetReq.destinationAddress || 'Approved Outstation',
      departureTime: `${targetReq.departureDate}T${targetReq.departureTime || '09:00'}:00.000Z`,
      expectedArrivalTime: `${targetReq.returnDate}T${targetReq.returnTime || '18:00'}:00.000Z`,
      consentGranted: false,
      status: 'WAITING_FOR_CONSENT' as const,
      locationHistory: [],
    };
    try {
      localStorage.setItem('alts_travel_safety_session', JSON.stringify(sessionPayload));
      window.dispatchEvent(new CustomEvent('travel-safety:updated', { detail: sessionPayload }));
    } catch {}

    // Asynchronous backend approval to MongoDB Atlas & Travel Safety Session Initialization
    leavesApi
      .review(leaveId, 'approve', `Approved by ${defaultReviewer}`)
      .then(() => {
        travelSafetyApi
          .createOrGetSession(leaveId)
          .catch((err) => console.warn('[HostelGuard AI] Backend travel session note:', err?.message || err));
      })
      .catch((err) => console.warn('[HostelGuard AI] Backend leave review note:', err?.message || err));

    return true;
  };

  /**
   * Warden Rejection Workflow
   */
  const rejectLeave = (leaveId: string, reason: string, reviewedBy?: string): boolean => {
    const targetReq = leaveRequests.find((r) => r.id === leaveId);
    if (!targetReq) {
      addToast('Error', 'Application not found.', 'error');
      return false;
    }

    if (targetReq.status !== 'PENDING') {
      addToast('Action Prohibited', `Only PENDING requests can receive a decision. Current status: ${targetReq.status}`, 'warning');
      return false;
    }

    if (!reason || !reason.trim()) {
      addToast('Rejection Reason Required', 'Please enter a clear justification for rejecting the application.', 'error');
      return false;
    }

    if (role === 'GIRLS_WARDEN' && targetReq.gender !== 'FEMALE') {
      addToast('Authorization Error', 'Girls Hostel Warden cannot reject Boys Hostel applications.', 'error');
      return false;
    }
    if (role === 'BOYS_WARDEN' && targetReq.gender !== 'MALE') {
      addToast('Authorization Error', 'Boys Hostel Warden cannot reject Girls Hostel applications.', 'error');
      return false;
    }

    const now = new Date();
    const defaultReviewer =
      reviewedBy || (targetReq.gender === 'FEMALE' ? WARDEN_PROFILES.GIRLS_WARDEN.name : WARDEN_PROFILES.BOYS_WARDEN.name);

    setLeaveRequests((prev) =>
      prev.map((req) => {
        if (req.id === leaveId) {
          return {
            ...req,
            status: 'REJECTED' as LeaveStatus,
            reviewedAt: `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            reviewedBy: defaultReviewer,
            rejectionReason: reason.trim(),
          };
        }
        return req;
      })
    );

    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: 'Leave Request Rejected',
        message: `Leave ${leaveId} was rejected by ${defaultReviewer}. Reason: ${reason}`,
        timestamp: 'Just now',
        read: false,
        type: 'ALERT',
        targetRole: 'STUDENT',
        category: 'LEAVE',
      },
      {
        id: `notif_${Date.now() + 1}`,
        title: 'Leave Application Not Approved',
        message: `Leave ${leaveId} for ${targetReq.studentName} was declined by ${defaultReviewer}. Reason: ${reason}`,
        timestamp: 'Just now',
        read: false,
        type: 'WARNING',
        targetRole: 'PARENT',
        category: 'LEAVE',
      },
      ...prev,
    ]);

    logAuditActivity({
      actionType: 'LEAVE_REJECTED',
      entityId: leaveId,
      entityName: `${targetReq.studentName} (${targetReq.studentRollNo})`,
      performedBy: defaultReviewer,
      performedByRole: targetReq.gender === 'FEMALE' ? 'GIRLS_WARDEN' : 'BOYS_WARDEN',
      hostel: targetReq.hostelName as 'Chakrika Girls Hostel' | 'ALTS Boys Hostel' | 'Kaveri Girls Hostel' | 'Ganga Boys Hostel',
      details: `Rejected: ${reason.trim()}`,
    });

    addToast(
      'Leave Rejected',
      `Request ${leaveId} for ${targetReq.studentName} rejected. Reason logged.`,
      'warning'
    );

    // Asynchronous backend rejection to MongoDB Atlas
    leavesApi
      .review(leaveId, 'reject', reason.trim())
      .catch((err) => console.warn('[HostelGuard AI] Backend leave rejection note:', err?.message || err));

    return true;
  };

  /**
   * Gate Movement & Turnstile Simulation
   */
  const recordGateMovement = (movement: Omit<GateMovementRecord, 'id' | 'timestamp'>): boolean => {
    const student = students.find((s) => s.id === movement.studentId);
    if (!student) {
      addToast('Error', 'Student record not found.', 'error');
      return false;
    }

    if (movement.movementType === 'EXIT' && student.currentStatus === 'OUTSIDE_ON_LEAVE') {
      addToast(
        'Duplicate Exit Prevented',
        `${student.name} is already recorded as OUTSIDE campus. Turnstile exit barrier cannot be opened again.`,
        'error'
      );
      return false;
    }

    if (movement.movementType === 'ENTRY' && student.currentStatus === 'IN_HOSTEL') {
      addToast(
        'Duplicate Entry Prevented',
        `${student.name} is already recorded as INSIDE the hostel.`,
        'error'
      );
      return false;
    }

    const now = new Date();
    const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newRecord: GateMovementRecord = {
      ...movement,
      id: `MOV-${Date.now().toString().slice(-4)}`,
      timestamp: formattedTimestamp,
    };

    setMovementRecords((prev) => [newRecord, ...prev]);

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === movement.studentId) {
          return {
            ...s,
            currentStatus: movement.movementType === 'EXIT' ? 'OUTSIDE_ON_LEAVE' : 'IN_HOSTEL',
          };
        }
        return s;
      })
    );

    if (movement.movementType === 'ENTRY' && movement.leaveId) {
      setLeaveRequests((prev) =>
        prev.map((l) => (l.id === movement.leaveId ? { ...l, status: 'COMPLETED' } : l))
      );
    }

    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: `Gate ${movement.movementType} Recorded`,
        message: `${movement.studentName} (${movement.studentRollNo}) recorded ${movement.movementType} at ${movement.gateName}. Verification Score: ${movement.matchScore}%.`,
        timestamp: 'Just now',
        read: false,
        type: movement.authorized ? 'SUCCESS' : 'ALERT',
        targetRole: 'ALL',
        category: 'SECURITY',
      },
      {
        id: `notif_${Date.now() + 1}`,
        title: `Turnstile ${movement.movementType} Cleared`,
        message: `Turnstile ${movement.movementType} verified for ${movement.studentName} at ${movement.gateName} (${formattedTimestamp}).`,
        timestamp: 'Just now',
        read: false,
        type: 'INFO',
        targetRole: 'PARENT',
        category: 'SECURITY',
      },
      ...prev,
    ]);

    logAuditActivity({
      actionType: movement.movementType === 'EXIT' ? 'GATE_EXIT' : 'GATE_ENTRY',
      entityId: movement.studentRollNo,
      entityName: movement.studentName,
      performedBy: 'Inspector Baljit Singh',
      performedByRole: 'GATE_SECURITY',
      hostel: movement.hostelName as 'Chakrika Girls Hostel' | 'ALTS Boys Hostel' | 'Kaveri Girls Hostel' | 'Ganga Boys Hostel',
      details: `${movement.movementType} verified at ${movement.gateName}. Match: ${movement.matchScore}%. ${
        movement.authorized ? 'Pass authorized.' : 'Security override.'
      }`,
    });

    addToast(
      `Gate ${movement.movementType} Confirmed`,
      `${movement.studentName} verified (${movement.matchScore}% FaceNet match). Simulated parent notification queued for +91 ${student.parentPhone.slice(-5)}.`,
      movement.authorized ? 'success' : 'warning'
    );

    // Asynchronous backend movement recording to MongoDB Atlas
    movementsApi
      .record({
        studentId: movement.studentId,
        eventType: movement.movementType === 'EXIT' ? 'check_out' : 'check_in',
        leaveId: movement.leaveId,
        notes: `Turnstile at ${movement.gateName}. Verification: ${movement.matchScore}%.`,
      })
      .catch((err) => console.warn('[HostelGuard AI] Backend movement logging note:', err?.message || err));

    return true;
  };

  /**
   * DEMONSTRATION PAYMENT FLOW (WORKFLOW A)
   * Enforces:
   * - No real money transfer (simulated demo flow).
   * - Amount cannot exceed current outstanding balance.
   * - Simulated failure leaves balance unchanged.
   * - Simulated success generates unique transaction ID, decrements balance, updates history & notifications.
   */
  const makeDemoPayment = (
    studentId: string,
    amount: number,
    paymentMethod: 'UPI' | 'NET_BANKING' | 'DEBIT_CARD' | 'CREDIT_CARD' = 'UPI',
    simulateFailure: boolean = false
  ): { success: boolean; message: string; transaction?: FeeTransaction } => {
    const feeAccount = feeAccounts.find((f) => f.studentId === studentId);
    if (!feeAccount) {
      addToast('Fee Account Not Found', 'Could not locate fee records for the selected student.', 'error');
      return { success: false, message: 'Fee account not found' };
    }

    if (amount <= 0) {
      addToast('Invalid Amount', 'Please enter a payment amount greater than ₹0.', 'error');
      return { success: false, message: 'Amount must be greater than zero' };
    }

    if (amount > feeAccount.outstandingAmount) {
      addToast(
        'Amount Exceeds Dues',
        `Payment amount (₹${amount.toLocaleString('en-IN')}) cannot exceed the outstanding balance of ₹${feeAccount.outstandingAmount.toLocaleString('en-IN')}.`,
        'warning'
      );
      return { success: false, message: 'Amount exceeds outstanding balance' };
    }

    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const txnId = `TXN-DEMO-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const receiptNum = `RCP-HG-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    if (simulateFailure) {
      const failedTxn: FeeTransaction = {
        id: txnId,
        studentId,
        studentRollNo: feeAccount.studentRollNo,
        amount,
        timestamp,
        paymentMethod,
        status: 'FAILED',
        receiptNumber: receiptNum,
        mode: 'DEMO_SIMULATION',
        notes: 'Simulated payment gateway decline (testing failure flow). No balance modified.',
        payerName: activeParent.name,
      };

      setFeeTransactions((prev) => [failedTxn, ...prev]);

      // Add parent notification for failed attempt
      setNotifications((prev) => [
        {
          id: `notif_${Date.now()}`,
          title: 'Simulated Payment Declined',
          message: `Demo transaction ${txnId} for ₹${amount.toLocaleString('en-IN')} failed in simulated test mode. Your balance remains ₹${feeAccount.outstandingAmount.toLocaleString('en-IN')}.`,
          timestamp: 'Just now',
          read: false,
          type: 'ALERT',
          targetRole: 'PARENT',
          category: 'PAYMENT',
        },
        ...prev,
      ]);

      addToast(
        'Simulated Payment Failed',
        'Simulated gateway transaction declined. Outstanding balance remains unchanged.',
        'error'
      );

      return { success: false, message: 'Simulated payment declined by bank gateway', transaction: failedTxn };
    }

    // Success flow
    const newPaidAmount = feeAccount.paidAmount + amount;
    const newOutstanding = Math.max(0, feeAccount.totalFee - newPaidAmount);
    const newStatus: FeeAccount['status'] = newOutstanding === 0 ? 'PAID' : 'PARTIALLY_PAID';

    const successfulTxn: FeeTransaction = {
      id: txnId,
      studentId,
      studentRollNo: feeAccount.studentRollNo,
      amount,
      timestamp,
      paymentMethod,
      status: 'SUCCESS',
      receiptNumber: receiptNum,
      mode: 'DEMO_SIMULATION',
      notes: `Demonstration fee installment for ${feeAccount.semester}`,
      payerName: activeParent.name,
    };

    // Update fee account
    setFeeAccounts((prev) =>
      prev.map((acc) =>
        acc.studentId === studentId
          ? {
              ...acc,
              paidAmount: newPaidAmount,
              outstandingAmount: newOutstanding,
              status: newStatus,
            }
          : acc
      )
    );

    // Record transaction
    setFeeTransactions((prev) => [successfulTxn, ...prev]);

    // Dispatch notifications to parent and student
    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: 'Hostel Fee Payment Successful (Demo)',
        message: `₹${amount.toLocaleString('en-IN')} received for ${feeAccount.studentName} (${feeAccount.studentRollNo}). Remaining dues: ₹${newOutstanding.toLocaleString('en-IN')}. Receipt #${receiptNum}.`,
        timestamp: 'Just now',
        read: false,
        type: 'SUCCESS',
        targetRole: 'PARENT',
        category: 'PAYMENT',
      },
      {
        id: `notif_${Date.now() + 1}`,
        title: 'Fee Dues Updated',
        message: `Guardian payment of ₹${amount.toLocaleString('en-IN')} recorded. Current balance: ₹${newOutstanding.toLocaleString('en-IN')}.`,
        timestamp: 'Just now',
        read: false,
        type: 'SUCCESS',
        targetRole: 'STUDENT',
        category: 'PAYMENT',
      },
      ...prev,
    ]);

    // Log to audit activity
    logAuditActivity({
      actionType: 'PAYMENT_RECEIVED',
      entityId: txnId,
      entityName: `${feeAccount.studentName} (${feeAccount.studentRollNo})`,
      performedBy: `${activeParent.name} (Guardian)`,
      performedByRole: 'PARENT',
      hostel: feeAccount.hostelName as 'Chakrika Girls Hostel' | 'ALTS Boys Hostel' | 'Kaveri Girls Hostel' | 'Ganga Boys Hostel',
      details: `Simulated payment of ₹${amount.toLocaleString('en-IN')} via ${paymentMethod}. New outstanding balance: ₹${newOutstanding.toLocaleString('en-IN')}.`,
    });

    addToast(
      'Demo Payment Successful',
      `₹${amount.toLocaleString('en-IN')} payment recorded. Receipt #${receiptNum} generated.`,
      'success'
    );

    // Asynchronous backend simulation
    parentApi
      .simulatePayment(amount, paymentMethod, simulateFailure)
      .catch((err) => console.warn('[HostelGuard AI] Backend demo payment note:', err?.message || err));

    return {
      success: true,
      message: 'Demo transaction completed successfully. No real money transferred.',
      transaction: successfulTxn,
    };
  };

  /**
   * DEMONSTRATION FOOD MENU MANAGEMENT (WORKFLOW B)
   * Saves menu items and timings, syncing instantly with Student and Parent portals.
   */
  const updateMenu = (
    date: string,
    mealType: MealType,
    items: MenuItem[],
    timings?: { startTime: string; endTime: string }
  ): boolean => {
    if (!items || items.length === 0) {
      addToast('Menu Error', 'Please include at least one food item in the meal menu.', 'error');
      return false;
    }

    const now = new Date();
    const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setMenuEntries((prev) => {
      const existing = prev.find((m) => m.date === date);
      if (existing) {
        return prev.map((m) => {
          if (m.date === date) {
            return {
              ...m,
              lastUpdated: formattedTimestamp,
              updatedBy: 'Chef Raghavendra Rao',
              meals: {
                ...m.meals,
                [mealType]: {
                  mealType,
                  startTime: timings?.startTime || m.meals[mealType]?.startTime || '08:00',
                  endTime: timings?.endTime || m.meals[mealType]?.endTime || '10:00',
                  items,
                },
              },
            };
          }
          return m;
        });
      } else {
        const newEntry: MenuEntry = {
          id: `MENU-${date}`,
          date,
          dayOfWeek: new Date(date).toLocaleDateString('en-IN', { weekday: 'long' }),
          lastUpdated: formattedTimestamp,
          updatedBy: 'Chef Raghavendra Rao',
          meals: {
            ...INITIAL_MENU_ENTRIES[0].meals,
            [mealType]: {
              mealType,
              startTime: timings?.startTime || '08:00',
              endTime: timings?.endTime || '10:00',
              items,
            },
          },
        };
        return [newEntry, ...prev];
      }
    });

    // Notify students of menu updates
    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: `${mealType} Menu Updated`,
        message: `Today's ${mealType.toLowerCase()} menu has been updated with ${items.length} dishes by Chef Raghavendra Rao.`,
        timestamp: 'Just now',
        read: false,
        type: 'INFO',
        targetRole: 'STUDENT',
        category: 'MESS',
      },
      ...prev,
    ]);

    logAuditActivity({
      actionType: 'MENU_UPDATED',
      entityId: `MENU-${date}-${mealType}`,
      entityName: `${mealType} Menu (${date})`,
      performedBy: 'Chef Raghavendra Rao',
      performedByRole: 'MESS_INCHARGE',
      hostel: 'ALL',
      details: `${mealType} menu updated with ${items.map((i) => i.name).join(', ')}.`,
    });

    addToast(
      'Menu Saved Successfully',
      `${mealType} menu for ${date} updated and synchronized across student portals.`,
      'success'
    );

    return true;
  };

  /**
   * DEMONSTRATION MESS SCHEDULE & STATUS (WORKFLOW E)
   * Toggles OPEN / CLOSED status, sets closure reason & next opening time.
   */
  const updateMessSchedule = (updates: Partial<MessSchedule>) => {
    const now = new Date();
    const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setMessSchedule((prev) => {
      const next = {
        ...prev,
        ...updates,
        lastUpdated: formattedTimestamp,
      };

      const statusChanged = updates.status && updates.status !== prev.status;

      if (statusChanged) {
        setNotifications((prevNotifs) => [
          {
            id: `notif_${Date.now()}`,
            title: `Mess Status: ${updates.status}`,
            message:
              updates.status === 'CLOSED'
                ? `Central Mess closed${updates.closureReason ? `: ${updates.closureReason}` : ''}. Next opening: ${updates.nextOpeningTime || 'As scheduled'}.`
                : 'Central Dining Complex is now OPEN for meals.',
            timestamp: 'Just now',
            read: false,
            type: updates.status === 'CLOSED' ? 'WARNING' : 'SUCCESS',
            targetRole: 'STUDENT',
            category: 'MESS',
          },
          ...prevNotifs,
        ]);

        logAuditActivity({
          actionType: 'MESS_STATUS_CHANGED',
          entityId: 'MESS_CENTRAL',
          entityName: 'Central Mess Complex',
          performedBy: 'Chef Raghavendra Rao',
          performedByRole: 'MESS_INCHARGE',
          hostel: 'ALL',
          details: `Mess status marked as ${updates.status}. Reason: ${updates.closureReason || 'Regular transition'}. Next opening: ${updates.nextOpeningTime || 'N/A'}.`,
        });
      }

      return next;
    });

    addToast(
      'Mess Status Updated',
      `Dining status set to ${updates.status || messSchedule.status}. Synchronized with student dashboards.`,
      'info'
    );
  };

  /**
   * DEMONSTRATION FOOD COMPLAINT WORKFLOW (WORKFLOW C)
   * Students submit complaints; Mess Incharge investigates, updates status & responds.
   */
  const submitFoodComplaint = (complaint: {
    studentId: string;
    category: FoodComplaintCategory;
    mealType: MealType;
    description: string;
  }): string => {
    const student = students.find((s) => s.id === complaint.studentId) || activeStudent;
    const now = new Date();
    const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newId = `CMP-${now.getFullYear()}-${String(foodComplaints.length + 1).padStart(3, '0')}`;

    const newComplaint: FoodComplaint = {
      id: newId,
      studentId: student.id,
      studentName: student.name,
      studentRollNo: student.rollNumber,
      hostel: student.hostelName as 'Chakrika Girls Hostel' | 'ALTS Boys Hostel' | 'Kaveri Girls Hostel' | 'Ganga Boys Hostel',
      roomNumber: student.roomNumber,
      category: complaint.category,
      mealType: complaint.mealType,
      description: complaint.description.trim(),
      submittedAt: formattedTimestamp,
      status: 'PENDING',
    };

    setFoodComplaints((prev) => [newComplaint, ...prev]);

    // Notify Mess Incharge
    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: 'New Food Complaint Received',
        message: `${student.name} (${student.roomNumber}) reported ${complaint.category.replace('_', ' ')} for ${complaint.mealType}.`,
        timestamp: 'Just now',
        read: false,
        type: 'WARNING',
        targetRole: 'MESS_INCHARGE',
        category: 'MESS',
      },
      ...prev,
    ]);

    logAuditActivity({
      actionType: 'COMPLAINT_LOGGED',
      entityId: newId,
      entityName: `${student.name} (${student.rollNumber})`,
      performedBy: student.name,
      performedByRole: 'STUDENT',
      hostel: student.hostelName as 'Chakrika Girls Hostel' | 'ALTS Boys Hostel' | 'Kaveri Girls Hostel' | 'Ganga Boys Hostel',
      details: `${complaint.category.replace('_', ' ')} on ${complaint.mealType}: ${complaint.description.slice(0, 60)}...`,
    });

    addToast(
      'Complaint Submitted',
      `Ticket ${newId} logged. Chef Raghavendra Rao will review and investigate.`,
      'info'
    );

    // Asynchronous backend food complaint
    messApi
      .submitComplaint({
        category: complaint.category,
        mealType: complaint.mealType,
        description: complaint.description.trim(),
        hostel: student.hostelName,
        roomNumber: student.roomNumber,
      })
      .catch((err) => console.warn('[HostelGuard AI] Backend food complaint note:', err?.message || err));

    return newId;
  };

  const updateFoodComplaint = (
    id: string,
    updates: {
      status: FoodComplaintStatus;
      response?: string;
      respondedBy?: string;
    }
  ): boolean => {
    const target = foodComplaints.find((c) => c.id === id);
    if (!target) {
      addToast('Complaint Not Found', 'Could not locate complaint record.', 'error');
      return false;
    }

    const now = new Date();
    const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setFoodComplaints((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            status: updates.status,
            response: updates.response !== undefined ? updates.response : c.response,
            respondedAt: updates.response ? formattedTimestamp : c.respondedAt,
            respondedBy: updates.respondedBy || 'Chef Raghavendra Rao',
          };
        }
        return c;
      })
    );

    // Notify student of response / resolution
    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: `Food Complaint ${updates.status.replace('_', ' ')}`,
        message: `Your complaint #${id} regarding ${target.category.replace('_', ' ')} is now ${updates.status}. ${updates.response ? `Response: "${updates.response}"` : ''}`,
        timestamp: 'Just now',
        read: false,
        type: updates.status === 'RESOLVED' ? 'SUCCESS' : 'INFO',
        targetRole: 'STUDENT',
        category: 'MESS',
      },
      ...prev,
    ]);

    logAuditActivity({
      actionType: updates.status === 'RESOLVED' ? 'COMPLAINT_RESOLVED' : 'COMPLAINT_LOGGED',
      entityId: id,
      entityName: `${target.studentName} (${target.studentRollNo})`,
      performedBy: updates.respondedBy || 'Chef Raghavendra Rao',
      performedByRole: 'MESS_INCHARGE',
      hostel: target.hostel,
      details: `Status set to ${updates.status}. Response: ${updates.response || 'In progress'}`,
    });

    addToast(
      'Complaint Status Updated',
      `Ticket #${id} marked as ${updates.status}. Student notified.`,
      'success'
    );

    // Asynchronous backend complaint update
    messApi
      .updateComplaint(id, updates)
      .catch((err) => console.warn('[HostelGuard AI] Backend complaint update note:', err?.message || err));

    return true;
  };

  /**
   * DEMONSTRATION HOSTEL MAINTENANCE WORKFLOW (WORKFLOW D)
   * Wardens report issues; Maintenance Incharge assigns technicians, tracks progress, sets resolution date & marks resolved.
   */
  const reportMaintenanceIssue = (issue: {
    hostel: 'Chakrika Girls Hostel' | 'ALTS Boys Hostel' | 'Kaveri Girls Hostel' | 'Ganga Boys Hostel';
    roomNumber: string;
    category: MaintenanceCategory;
    priority: MaintenancePriority;
    description: string;
    reporter: string;
    reporterRole: UserRole;
  }): string => {
    if (!issue.description.trim() || !issue.roomNumber.trim()) {
      addToast('Validation Failed', 'Room number and problem description are required.', 'error');
      return '';
    }

    const now = new Date();
    const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newId = `MNT-${now.getFullYear()}-${String(maintenanceIssues.length + 1).padStart(3, '0')}`;

    const newIssue: MaintenanceIssue = {
      id: newId,
      hostel: issue.hostel,
      roomNumber: issue.roomNumber.trim(),
      category: issue.category,
      priority: issue.priority,
      description: issue.description.trim(),
      reporter: issue.reporter,
      reporterRole: issue.reporterRole,
      status: 'PENDING',
      reportedDate: formattedTimestamp,
      lastUpdatedDate: formattedTimestamp,
      estimatedResolutionDate: TOMORROW_STR,
      progressNotes: [
        {
          id: `note_${Date.now()}`,
          author: issue.reporter,
          authorRole: issue.reporterRole,
          timestamp: formattedTimestamp,
          note: `Work order submitted: ${issue.description.trim()}`,
        },
      ],
    };

    setMaintenanceIssues((prev) => [newIssue, ...prev]);

    // Increment active issues count on matching room
    setHostelRooms((prev) =>
      prev.map((r) =>
        r.hostel === issue.hostel && r.roomNumber === issue.roomNumber
          ? { ...r, activeIssuesCount: r.activeIssuesCount + 1 }
          : r
      )
    );

    // Notify Maintenance Incharge
    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: 'New Maintenance Ticket',
        message: `${issue.hostel} ${issue.roomNumber}: ${issue.category} (${issue.priority} priority) reported by ${issue.reporter}.`,
        timestamp: 'Just now',
        read: false,
        type: issue.priority === 'CRITICAL' ? 'ALERT' : 'INFO',
        targetRole: 'MAINTENANCE_INCHARGE',
        category: 'MAINTENANCE',
      },
      ...prev,
    ]);

    logAuditActivity({
      actionType: 'MAINTENANCE_LOGGED',
      entityId: newId,
      entityName: `${issue.hostel} ${issue.roomNumber}`,
      performedBy: issue.reporter,
      performedByRole: issue.reporterRole,
      hostel: issue.hostel,
      details: `${issue.priority} ${issue.category} request: ${issue.description.slice(0, 60)}...`,
    });

    addToast(
      'Maintenance Request Logged',
      `Ticket #${newId} dispatched to Er. Vikramaditya Joshi (Facilities Directorate).`,
      'success'
    );

    // Asynchronous backend maintenance creation
    maintenanceApi
      .create({
        hostelName: issue.hostel,
        roomNumber: issue.roomNumber.trim(),
        category: issue.category,
        priority: issue.priority,
        description: issue.description.trim(),
      })
      .catch((err) => console.warn('[HostelGuard AI] Backend maintenance create note:', err?.message || err));

    return newId;
  };

  const updateMaintenanceIssue = (
    id: string,
    updates: {
      status?: MaintenanceStatus;
      assignedTo?: string;
      estimatedResolutionDate?: string;
      resolutionDetails?: string;
      note?: string;
      updatedBy?: string;
      updatedByRole?: string;
    }
  ): boolean => {
    const target = maintenanceIssues.find((m) => m.id === id);
    if (!target) {
      addToast('Issue Not Found', 'Could not locate maintenance record.', 'error');
      return false;
    }

    const now = new Date();
    const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    let newNotes: MaintenanceNote[] = [...target.progressNotes];
    if (updates.note && updates.note.trim()) {
      newNotes.push({
        id: `note_${Date.now()}`,
        author: updates.updatedBy || 'Er. Vikramaditya Joshi',
        authorRole: updates.updatedByRole || 'MAINTENANCE_INCHARGE',
        timestamp: formattedTimestamp,
        note: updates.note.trim(),
      });
    }

    const nextStatus = updates.status || target.status;
    const isResolvedNow = nextStatus === 'RESOLVED' && target.status !== 'RESOLVED';

    setMaintenanceIssues((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          return {
            ...m,
            status: nextStatus,
            assignedTo: updates.assignedTo !== undefined ? updates.assignedTo : m.assignedTo,
            estimatedResolutionDate:
              updates.estimatedResolutionDate !== undefined
                ? updates.estimatedResolutionDate
                : m.estimatedResolutionDate,
            resolutionDetails:
              updates.resolutionDetails !== undefined
                ? updates.resolutionDetails
                : m.resolutionDetails,
            resolvedDate: isResolvedNow ? formattedTimestamp : m.resolvedDate,
            lastUpdatedDate: formattedTimestamp,
            progressNotes: newNotes,
          };
        }
        return m;
      })
    );

    // If resolved, decrement active issues count on room
    if (isResolvedNow) {
      setHostelRooms((prev) =>
        prev.map((r) =>
          r.hostel === target.hostel && r.roomNumber === target.roomNumber
            ? { ...r, activeIssuesCount: Math.max(0, r.activeIssuesCount - 1) }
            : r
        )
      );
    }

    // Notify relevant hostel warden
    const targetWarden: UserRole = target.hostel.includes('Girls') ? 'GIRLS_WARDEN' : 'BOYS_WARDEN';

    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: `Maintenance Ticket ${nextStatus}`,
        message: `${target.id} (${target.roomNumber}): Status updated to ${nextStatus}.${
          updates.assignedTo ? ` Assigned to ${updates.assignedTo}.` : ''
        }${updates.resolutionDetails ? ` Resolution: ${updates.resolutionDetails}` : ''}`,
        timestamp: 'Just now',
        read: false,
        type: nextStatus === 'RESOLVED' ? 'SUCCESS' : 'INFO',
        targetRole: targetWarden,
        category: 'MAINTENANCE',
      },
      ...prev,
    ]);

    logAuditActivity({
      actionType: 'MAINTENANCE_UPDATED',
      entityId: id,
      entityName: `${target.hostel} ${target.roomNumber}`,
      performedBy: updates.updatedBy || 'Er. Vikramaditya Joshi',
      performedByRole: (updates.updatedByRole as UserRole) || 'MAINTENANCE_INCHARGE',
      hostel: target.hostel,
      details: `Status: ${nextStatus}. Tech: ${updates.assignedTo || target.assignedTo || 'Unassigned'}. ${
        updates.resolutionDetails || updates.note || ''
      }`,
    });

    addToast(
      'Work Order Updated',
      `Ticket #${id} set to ${nextStatus}. Warden and maintenance schedules updated.`,
      'success'
    );

    // Asynchronous backend maintenance update
    maintenanceApi
      .update(id, updates)
      .catch((err) => console.warn('[HostelGuard AI] Backend maintenance update note:', err?.message || err));

    return true;
  };

  const reopenMaintenanceIssue = (id: string, reason: string, reopenedBy: string): boolean => {
    const target = maintenanceIssues.find((m) => m.id === id);
    if (!target) return false;

    return updateMaintenanceIssue(id, {
      status: 'REOPENED',
      note: `Ticket reopened by ${reopenedBy}. Reason: ${reason || 'Issue persists / further repair required.'}`,
      updatedBy: reopenedBy,
      updatedByRole: role || 'GIRLS_WARDEN',
    });
  };

  /**
   * Announcements System
   */
  const addAnnouncement = (announcement: Omit<Announcement, 'id' | 'publishedAt'>) => {
    const now = new Date();
    const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newId = `ANC-${now.getFullYear()}-${String(announcements.length + 1).padStart(3, '0')}`;

    const newAnnouncement: Announcement = {
      ...announcement,
      id: newId,
      publishedAt: formattedTimestamp,
    };

    setAnnouncements((prev) => [newAnnouncement, ...prev]);

    // Dispatch broadcast notifications
    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: `Announcement: ${announcement.title}`,
        message: announcement.content.slice(0, 110) + '...',
        timestamp: 'Just now',
        read: false,
        type: announcement.priority === 'URGENT' ? 'ALERT' : 'INFO',
        targetRole: announcement.targetAudience === 'ALL' ? 'ALL' : (announcement.targetAudience as UserRole),
        category: 'ANNOUNCEMENT',
      },
      ...prev,
    ]);

    addToast('Notice Published', `"${announcement.title}" posted to student & parent boards.`, 'info');
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    notificationsApi
      .markAsRead(id)
      .catch((err) => console.warn('[HostelGuard AI] Backend markAsRead note:', err?.message || err));
  };

  const markAllNotificationsAsRead = (targetRole?: UserRole | 'ALL') => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (!targetRole || targetRole === 'ALL' || n.targetRole === targetRole || n.targetRole === 'ALL') {
          return { ...n, read: true };
        }
        return n;
      })
    );
    notificationsApi
      .markAllAsRead()
      .catch((err) => console.warn('[HostelGuard AI] Backend markAllAsRead note:', err?.message || err));
    addToast('Notifications Cleared', 'All visible alerts marked as read.', 'info');
  };

  /**
   * DEMONSTRATION DATA MANAGEMENT & RESET
   * Restores initial fictional dataset, clears all custom localStorage demo keys.
   */
  const resetDemoData = () => {
    setStudents(INITIAL_STUDENTS);
    setLeaveRequests(INITIAL_LEAVE_REQUESTS);
    setMovementRecords(INITIAL_MOVEMENT_RECORDS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setActiveStudentId('std_g_01');
    setActiveParentId('par_01');
    setParents(INITIAL_PARENTS);
    setFeeAccounts(INITIAL_FEE_ACCOUNTS);
    setFeeTransactions(INITIAL_FEE_TRANSACTIONS);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setMenuEntries(INITIAL_MENU_ENTRIES);
    setMessSchedule(INITIAL_MESS_SCHEDULE);
    setFoodComplaints(INITIAL_FOOD_COMPLAINTS);
    setMaintenanceIssues(INITIAL_MAINTENANCE_ISSUES);
    setHostelRooms(INITIAL_HOSTEL_ROOMS);

    try {
      localStorage.removeItem(STORAGE_KEYS.STUDENTS);
      localStorage.removeItem(STORAGE_KEYS.LEAVES);
      localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);
      localStorage.removeItem(STORAGE_KEYS.NOTIFS);
      localStorage.removeItem(STORAGE_KEYS.AUDIT);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_STUDENT);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_PARENT);
      localStorage.removeItem(STORAGE_KEYS.PARENTS);
      localStorage.removeItem(STORAGE_KEYS.FEE_ACCOUNTS);
      localStorage.removeItem(STORAGE_KEYS.FEE_TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.ANNOUNCEMENTS);
      localStorage.removeItem(STORAGE_KEYS.MENU_ENTRIES);
      localStorage.removeItem(STORAGE_KEYS.MESS_SCHEDULE);
      localStorage.removeItem(STORAGE_KEYS.FOOD_COMPLAINTS);
      localStorage.removeItem(STORAGE_KEYS.MAINTENANCE_ISSUES);
      localStorage.removeItem(STORAGE_KEYS.HOSTEL_ROOMS);
    } catch {
      // Ignore
    }

    addToast('Demo State Reset', 'Original fictional college dataset restored successfully.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        theme,
        toggleTheme,

        // Students & Personas
        students,
        activeStudent,
        setActiveStudentId,

        // Gate & Leaves
        leaveRequests,
        movementRecords,
        notifications,
        auditLogs,
        realtimeConnected,
        notificationsLoading,
        applyLeave,
        approveLeave,
        rejectLeave,
        recordGateMovement,
        logAuditActivity,
        markNotificationAsRead,
        markAllNotificationsAsRead,

        // Parents & Fees
        parents,
        activeParent,
        setActiveParentId,
        feeAccounts,
        feeTransactions,
        makeDemoPayment,

        // Announcements
        announcements,
        addAnnouncement,

        // Mess & Dining
        menuEntries,
        todayMenu,
        updateMenu,
        messSchedule,
        updateMessSchedule,
        foodComplaints,
        submitFoodComplaint,
        updateFoodComplaint,

        // Hostel Maintenance
        maintenanceIssues,
        reportMaintenanceIssue,
        updateMaintenanceIssue,
        reopenMaintenanceIssue,
        hostelRooms,

        // Reset & UI
        resetDemoData,
        toasts,
        addToast,
        removeToast,

        // Authentication State
        isAuthenticated,
        isAuthenticating,
        authUser,
        updateAuthUser,
        refreshUserProfile,
        loginWithCredentials,
        registerStudent,
        registerParent,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
