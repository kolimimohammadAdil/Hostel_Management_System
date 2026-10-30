/**
 * ALTS HOSTEL PORTAL — Secure User Provisioning CLI Tool
 *
 * Anantha Lakshmi Institute of Technology & Sciences
 * Allows administrators/developers to provision authenticated user accounts
 * for any of the 7 official roles directly into MongoDB Atlas with salted bcrypt hashes.
 *
 * Usage:
 *   npx tsx src/scripts/provision-user.ts --role student --email rahul@alts.edu.in --password "Secret#2026" --name "Rahul Varma" --rollNumber "22CS101" --hostel "ALTS Boys Hostel" --room "A-201"
 */

import { connectDatabase, disconnectDatabase } from '../config/database';
import { User, UserRole, AccountStatus } from '../models/user.model';
import { hashPassword } from '../utils/auth';

function parseArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        params[key] = next;
        i++;
      } else {
        params[key] = 'true';
      }
    }
  }
  return params;
}

async function main() {
  const args = parseArgs();

  const roleInput = args.role?.toLowerCase() || '';
  const email = args.email?.trim().toLowerCase();
  const password = args.password;
  const fullName = args.name || args.fullName;
  const rollNumber = args.rollNumber?.trim().toUpperCase();
  const hostelName = args.hostel || args.hostelName;
  const roomNumber = args.room || args.roomNumber;
  const phone = args.phone;

  const validRoles = Object.values(UserRole);
  if (!roleInput || !validRoles.includes(roleInput as UserRole)) {
    console.error(`❌ Invalid or missing --role. Must be one of: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  if (!email || !email.includes('@')) {
    console.error('❌ Valid --email is required.');
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error('❌ Password must be at least 8 characters long.');
    process.exit(1);
  }

  if (!fullName) {
    console.error('❌ User full name is required (--name "Full Name").');
    process.exit(1);
  }

  if (roleInput === UserRole.STUDENT && !rollNumber) {
    console.error('❌ Student roll number is required (--rollNumber "22CS101").');
    process.exit(1);
  }

  await connectDatabase();

  // Check for duplicate email
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    console.error(`❌ Account with email "${email}" already exists (Role: ${existingEmail.role}).`);
    await disconnectDatabase();
    process.exit(1);
  }

  // Check for duplicate rollNumber
  if (rollNumber) {
    const existingRoll = await User.findOne({ rollNumber });
    if (existingRoll) {
      console.error(`❌ Student with roll number "${rollNumber}" already exists.`);
      await disconnectDatabase();
      process.exit(1);
    }
  }

  // Hash password using salted bcrypt
  const passwordHash = await hashPassword(password);

  const user = await User.create({
    fullName,
    email,
    passwordHash,
    role: roleInput as UserRole,
    rollNumber: rollNumber || undefined,
    hostelName: hostelName || undefined,
    roomNumber: roomNumber || undefined,
    phone: phone || undefined,
    status: AccountStatus.ACTIVE,
  });

  console.log('\n=======================================================');
  console.log('✅ ALTS HOSTEL PORTAL — User Account Successfully Provisioned');
  console.log('=======================================================');
  console.log(`👤 Name:       ${user.fullName}`);
  console.log(`📧 Email:      ${user.email}`);
  console.log(`🏷️  Role:       ${user.role}`);
  if (user.rollNumber) console.log(`🎓 Roll No:    ${user.rollNumber}`);
  if (user.hostelName) console.log(`🏢 Hostel:     ${user.hostelName}`);
  if (user.roomNumber) console.log(`🚪 Room No:    ${user.roomNumber}`);
  console.log(`🔒 Status:     ${user.status}`);
  console.log('=======================================================\n');

  await disconnectDatabase();
}

main().catch((err) => {
  console.error('❌ Provisioning failed:', err.message);
  process.exit(1);
});

