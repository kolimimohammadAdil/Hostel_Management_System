import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useApp, mapBackendRoleToFrontend } from '../context/AppContext';
import { 
  Shield, 
  GraduationCap, 
  ShieldCheck, 
  Building2, 
  ScanFace, 
  ArrowRight, 
  Info, 
  RefreshCw,
  Sun,
  Moon,
  IndianRupee,
  UtensilsCrossed,
  Wrench,
  CheckCircle2,
  UserCheck,
  Lock,
  LogIn,
  AlertTriangle,
  LogOut,
  Sparkles,
  KeyRound
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import type { UserRole } from '../types';
import { getStoredUser } from '../services/api';

export const RoleSelectionPage: React.FC = () => {
  const { 
    setRole, 
    role,
    isAuthenticated,
    authUser,
    loginWithCredentials,
    isAuthenticating,
    logout,
    resetDemoData, 
    theme, 
    toggleTheme, 
    students, 
    activeStudent, 
    setActiveStudentId,
    parents,
    activeParent,
    setActiveParentId
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'cards' | 'login'>('cards');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const isUnauthorized = (location.state as any)?.unauthorized;
  const attemptedRole = (location.state as any)?.attemptedRole;

  const getRolePath = (targetRole: UserRole): string => {
    switch (targetRole) {
      case 'STUDENT': return '/student';
      case 'GIRLS_WARDEN': return '/girls-warden';
      case 'BOYS_WARDEN': return '/boys-warden';
      case 'GATE_SECURITY': return '/gate-security';
      case 'PARENT': return '/parent';
      case 'MESS_INCHARGE': return '/mess-incharge';
      case 'MAINTENANCE_INCHARGE': return '/maintenance-incharge';
      case 'HOSTEL_ADMIN': return '/admin';
      default: return '/student';
    }
  };

  const handleSelectRole = (selectedRole: UserRole, targetPath: string) => {
    setRole(selectedRole);
    navigate(targetPath);
  };

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both email address and password.');
      return;
    }

    const result = await loginWithCredentials(loginEmail, loginPassword);
    if (result.success) {
      const stored = getStoredUser();
      const userRole = stored?.role ? mapBackendRoleToFrontend(stored.role) : 'STUDENT';
      navigate(getRolePath(userRole));
    } else {
      setLoginError(result.message);
    }
  };

  const demoCredentials = [
    { label: 'Student (Priya)', email: 'student.priya@hostelguard.edu', role: 'STUDENT' },
    { label: 'Girls Warden', email: 'warden.girls@hostelguard.edu', role: 'GIRLS_WARDEN' },
    { label: 'Boys Warden', email: 'warden.boys@hostelguard.edu', role: 'BOYS_WARDEN' },
    { label: 'Gate Security', email: 'security.gate@hostelguard.edu', role: 'GATE_SECURITY' },
    { label: 'Parent', email: 'parent.sharma@hostelguard.edu', role: 'PARENT' },
    { label: 'Mess Incharge', email: 'mess.incharge@hostelguard.edu', role: 'MESS_INCHARGE' },
    { label: 'Maintenance', email: 'maintenance.incharge@hostelguard.edu', role: 'MAINTENANCE_INCHARGE' },
    { label: 'Hostel Admin', email: 'admin@alts.edu.in', role: 'HOSTEL_ADMIN' },
  ];

  const roles = [
    {
      id: 'STUDENT' as UserRole,
      title: 'Student Portal',
      subtitle: 'Resident Scholar Workspace',
      description:
        'Submit digital leave requests, check approval queues, access generated QR gate passes, view today\'s mess menu, report food complaints, and review turnstile logs.',
      icon: <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      badge: 'RESIDENT',
      badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      path: '/student',
      actionText: 'Access Student Portal',
      features: ['Digital Leave Application', 'QR Gate Pass & Movements', 'Mess Menu & Food Feedback', 'Hostel Maintenance Notices'],
    },
    {
      id: 'GIRLS_WARDEN' as UserRole,
      title: 'Girls Hostel Warden',
      subtitle: 'Chakrika Residential Complex',
      description:
        'Inspect leave applications for Chakrika Hostel inmates, verify parent telephonic consent, submit room maintenance work orders, and track outside students.',
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      badge: 'WARDEN (GIRLS)',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      path: '/girls-warden',
      actionText: 'Access Girls Warden Console',
      features: ['Application Review Queue', 'Parent Consent Verification', 'Chakrika Maintenance Requests', 'Outside Inmates Roster'],
    },
    {
      id: 'BOYS_WARDEN' as UserRole,
      title: 'Boys Hostel Warden',
      subtitle: 'ALTS Residential Complex',
      description:
        'Oversee boys hostel applications, manage night-out permits, monitor curfew compliance, create maintenance tickets, and review resident movement analytics.',
      icon: <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      badge: 'WARDEN (BOYS)',
      badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      path: '/boys-warden',
      actionText: 'Access Boys Warden Console',
      features: ['Dedicated Boys Dataset', 'ALTS Maintenance Requests', 'Active Outings Monitor', 'Curfew & Passage Audit'],
    },
    {
      id: 'GATE_SECURITY' as UserRole,
      title: 'Gate Security Post',
      subtitle: 'Biometric Access Control Terminal',
      description:
        'Simulate optical face recognition verification against student biometric embeddings, validate active gate passes, and record turnstile movements.',
      icon: <ScanFace className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
      badge: 'GATE SECURITY',
      badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      path: '/gate-security',
      actionText: 'Launch Security Terminal',
      features: ['Biometric Face HUD', 'Webcam / Simulation Toggle', 'Leave Validity Check', 'Movement Turnstile Logger'],
    },
    {
      id: 'PARENT' as UserRole,
      title: 'Parent Portal',
      subtitle: 'Guardian Dashboard & Dues',
      description:
        'Inspect ward hostel fees breakdown, review payment history, test simulated fee payments, track leave approvals, and view warden announcements.',
      icon: <IndianRupee className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      badge: 'GUARDIAN / PARENT',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      path: '/parent',
      actionText: 'Access Parent Portal',
      features: ['Ward In/Out Status', 'Fee Breakdown (₹80,000)', 'Simulated Payment Flow', 'Warden & Mess Circulars'],
    },
    {
      id: 'MESS_INCHARGE' as UserRole,
      title: 'Mess Incharge',
      subtitle: 'Dining Services & Menu Management',
      description:
        'Manage 4-meal daily & weekly food menus, broadcast mess open/closed status, set meal timings, publish dining notices, and resolve student complaints.',
      icon: <UtensilsCrossed className="w-6 h-6 text-orange-600 dark:text-orange-400" />,
      badge: 'MESS INCHARGE',
      badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
      path: '/mess-incharge',
      actionText: 'Access Mess Console',
      features: ['Menu Management & Items', 'Live Open/Closed Broadcast', 'Student Grievance Redressal', 'Meal Timings Configuration'],
    },
    {
      id: 'MAINTENANCE_INCHARGE' as UserRole,
      title: 'Hostel Maintenance Incharge',
      subtitle: 'Facilities & Work Order Directorate',
      description:
        'Receive warden maintenance requests, assign technicians, update estimated resolution dates, record resolution notes, and inspect room directories.',
      icon: <Wrench className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />,
      badge: 'MAINTENANCE',
      badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      path: '/maintenance-incharge',
      actionText: 'Access Maintenance Console',
      features: ['Central Work Order Roster', 'Technician Dispatch', 'Room Facilities Directory', 'Resolution & Reopen Audit'],
    },
    {
      id: 'HOSTEL_ADMIN' as UserRole,
      title: 'Hostel Administrator',
      subtitle: 'Central Directorate Supervisory Portal',
      description:
        'Oversee campus-wide statistics across all hostels, supervise users & staff, manage central complaints with dual notifications, and monitor live movements & travel safety.',
      icon: <Shield className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
      badge: 'HOSTEL ADMIN',
      badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      path: '/admin',
      actionText: 'Access Admin Console',
      features: ['Campus-Wide Executive KPIs', 'Unified User & Staff Provisioning', 'Multi-Department Complaints Resolution', 'Real-Time Leave & GPS Monitoring'],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060b17] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#060b17]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                HOSTELGUARD <span className="text-blue-600 dark:text-blue-400">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">Evaluation Portal Gateway (7 Roles)</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={resetDemoData}
              className="px-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset sample demonstration data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Unauthorized Access Warning */}
        {isUnauthorized && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                Access Restricted • Role Boundary Enforced
              </p>
              <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                You attempted to access a protected portal {attemptedRole ? `requiring ${attemptedRole} permissions` : ''}.
                Please authenticate with credentials matching that role or select an authorized portal below.
              </p>
            </div>
          </div>
        )}

        {/* Active Authenticated Session Status Bar */}
        {isAuthenticated && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-800 dark:text-emerald-200">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>
                Active Session: <strong>{authUser?.fullName || 'Authenticated User'}</strong> ({role?.replace('_', ' ') || 'ACTIVE'})
              </span>
            </div>
            <div className="flex items-center gap-2">
              {role && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs py-1 px-3 h-auto text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10"
                  onClick={() => navigate(getRolePath(role))}
                >
                  Enter Active Portal
                </Button>
              )}
              <button
                onClick={logout}
                className="text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer px-2 py-1"
                title="Sign out of current session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Academic Demo Disclaimer Banner */}
        <div className="mb-6 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 flex items-start gap-3 text-slate-700 dark:text-slate-300">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              College Project Demonstration Environment • 7 Integrated Portals
            </p>
            <p className="mt-0.5 text-slate-500 dark:text-slate-400">
              Select any role below for instant authenticated access with automatic JWT token provisioning, or switch to Credential Sign In to test authentication with custom accounts.
            </p>
          </div>
        </div>

        {/* Section Heading */}
        <div className="text-center max-w-xl mx-auto mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Portal Access & Authentication
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Choose between 1-click role provisioning or sign in using secured JWT credentials.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl border border-slate-300/50 dark:border-slate-700/50">
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'cards'
                  ? 'bg-white dark:bg-[#0b1329] text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>1-Click Portal Access</span>
            </button>
            <button
              onClick={() => setActiveTab('login')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white dark:bg-[#0b1329] text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Credential Sign In (JWT)</span>
            </button>
          </div>
        </div>

        {activeTab === 'login' ? (
          /* Credential Login Form */
          <div className="max-w-md mx-auto p-6 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-md">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sign In to HostelGuard AI</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your credentials to receive a verified JWT authentication token.
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleCredentialLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@hostelguard.edu"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isAuthenticating}
                className="w-full justify-center mt-2"
              >
                {isAuthenticating ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    <span>Sign In & Enter Portal</span>
                  </span>
                )}
              </Button>
            </form>

            {/* Quick Autofill Pills */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-semibold text-slate-400 mb-2">
                Quick Autofill Test Accounts (Password: HostelGuard#2026):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {demoCredentials.map((cred, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setLoginEmail(cred.email);
                      setLoginPassword('HostelGuard#2026');
                      setLoginError(null);
                    }}
                    className="text-[10px] px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    {cred.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Quick Persona Switcher for Student & Parent Testing */}
            <div className="mb-8 p-4 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Active Student & Guardian Context:
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Select which student or guardian record to simulate across Student & Parent portals
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={activeStudent.id}
                  onChange={(e) => {
                    setActiveStudentId(e.target.value);
                    const matchingParent = parents.find((p) => p.studentId === e.target.value);
                    if (matchingParent) setActiveParentId(matchingParent.id);
                  }}
                  className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-blue-500 cursor-pointer w-full md:w-auto"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.rollNumber}) — {s.gender === 'FEMALE' ? 'Chakrika Girls (B-304)' : 'ALTS Boys (A-102)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 7 Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
              {roles.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs hover:shadow-md hover:border-blue-500/40 transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group-hover:scale-105 transition-transform">
                        {item.icon}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${item.badgeClass}`}>
                        {item.badge}
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      {item.title}
                    </h2>
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                      {item.subtitle}
                    </p>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Key Modules & Workflows
                      </p>
                      <ul className="space-y-1">
                        {item.features.map((feat, idx) => (
                          <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-5 pt-3">
                    <Button
                      variant="primary"
                      className="w-full justify-center group-hover:bg-blue-700 transition-colors"
                      onClick={() => handleSelectRole(item.id, item.path)}
                    >
                      <span>{item.actionText}</span>
                      <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>HOSTELGUARD AI • College Mini-Project Demonstration Architecture</span>
          <span className="font-mono text-[11px] text-slate-500">
            FRONTEND SIMULATION • 7 ROLE-SPECIFIC WORKSPACES
          </span>
        </div>
      </footer>
    </div>
  );
};
