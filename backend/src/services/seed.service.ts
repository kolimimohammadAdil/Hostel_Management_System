import { User, UserRole, AccountStatus, IUser } from '../models/user.model';
import { hashPassword } from '../utils/auth';

export const DEMO_PASSWORD = 'HostelGuard#2026';

export interface DemoAccountDef {
  fullName: string;
  email: string;
  role: UserRole;
  rollNumber?: string;
  hostelName?: string;
  roomNumber?: string;
  phone?: string;
}

export const DEMO_ACCOUNTS: DemoAccountDef[] = [
  {
    fullName: 'Priya Sharma',
    email: 'student.priya@hostelguard.edu',
    role: UserRole.STUDENT,
    rollNumber: '21CS042',
    hostelName: 'Chakrika Girls Hostel',
    roomNumber: 'B-204',
    phone: '9876543210',
  },
  {
    fullName: 'Aarav Patel',
    email: 'student.aarav@hostelguard.edu',
    role: UserRole.STUDENT,
    rollNumber: '21CS089',
    hostelName: 'ALTS Boys Hostel',
    roomNumber: 'A-101',
    phone: '9876543211',
  },
  {
    fullName: 'Dr. Sarah Mathews',
    email: 'warden.girls@hostelguard.edu',
    role: UserRole.GIRLS_WARDEN,
    hostelName: 'Chakrika Girls Hostel',
    phone: '9876543212',
  },
  {
    fullName: 'Prof. Vikram Chauhan',
    email: 'warden.boys@hostelguard.edu',
    role: UserRole.BOYS_WARDEN,
    hostelName: 'ALTS Boys Hostel',
    phone: '9876543213',
  },
  {
    fullName: 'Officer Rajesh Kumar',
    email: 'security.gate@hostelguard.edu',
    role: UserRole.GATE_SECURITY,
    phone: '9876543214',
  },
  {
    fullName: 'Mr. Rakesh Sharma',
    email: 'parent.sharma@hostelguard.edu',
    role: UserRole.PARENT,
    phone: '9876543215',
  },
  {
    fullName: 'Chef Suresh Nair',
    email: 'mess.incharge@hostelguard.edu',
    role: UserRole.MESS_INCHARGE,
    phone: '9876543216',
  },
  {
    fullName: 'Er. Kailash Verma',
    email: 'maintenance.incharge@hostelguard.edu',
    role: UserRole.MAINTENANCE_INCHARGE,
    phone: '9876543217',
  },
  {
    fullName: 'Chief Administrator Dr. Ramesh Varma',
    email: 'admin@alts.edu.in',
    role: UserRole.HOSTEL_ADMIN,
    phone: '9876543200',
  },
  {
    fullName: 'Hostel Director Admin',
    email: 'admin.hostel@hostelguard.edu',
    role: UserRole.HOSTEL_ADMIN,
    phone: '9876543201',
  },
];

/**
 * Idempotently provisions initial demonstration accounts in MongoDB for all seven roles.
 */
export const seedDemoAccounts = async (): Promise<void> => {
  try {
    const passwordHash = await hashPassword(DEMO_PASSWORD);

    for (const def of DEMO_ACCOUNTS) {
      const existing = await User.findOne({ email: def.email.toLowerCase() });
      if (!existing) {
        await User.create({
          fullName: def.fullName,
          email: def.email.toLowerCase(),
          passwordHash,
          role: def.role,
          rollNumber: def.rollNumber,
          hostelName: def.hostelName,
          roomNumber: def.roomNumber,
          phone: def.phone,
          status: AccountStatus.ACTIVE,
        });
      }
    }
    console.log('✅ Demo operational accounts verified/seeded in MongoDB.');
  } catch (error: any) {
    console.warn(`⚠️ Demo account seeding deferred: ${error.message}`);
  }
};

