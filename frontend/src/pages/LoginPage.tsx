import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp, mapBackendRoleToFrontend } from '../context/AppContext';
import { getPortalPathForRole } from '../utils/portalRoutes';
import { getStoredUser } from '../services/api';
import {
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  GraduationCap,
  Calendar,
  Users,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sun,
  Moon,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  X,
  ChevronRight,
  ArrowRight,
  KeyRound,
  Info
} from 'lucide-react';

/**
 * ALTS HOSTEL PORTAL — Modern Authentication Interface
 * 
 * Recreated with exact visual language, sliding overlay mechanics,
 * wavy scalloped divider, floating playful vector shapes, and deep pink/magenta
 * gradients inspired by the reference video "Website loginpage.mp4".
 */
export const LoginPage: React.FC = () => {
  const {
    isAuthenticated,
    role,
    loginWithCredentials,
    registerStudent,
    registerParent,
    isAuthenticating,
    theme,
    toggleTheme,
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();

  // Sliding state: false = Sign In (Right overlay), true = Sign Up (Left overlay)
  const [isSignUp, setIsSignUp] = useState(false);

  // Active registration tab for Sign Up: 'student' | 'parent'
  const [regCategory, setRegCategory] = useState<'student' | 'parent'>('student');

  // Sign In Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const [loginRememberMe, setLoginRememberMe] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sign Up Form State (Student)
  const [studentName, setStudentName] = useState('');
  const [studentRoll, setStudentRoll] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentDept, setStudentDept] = useState('Computer Science & Engineering');
  const [studentYear, setStudentYear] = useState('3rd Year');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentConfirmPassword, setStudentConfirmPassword] = useState('');
  const [studentShowPassword, setStudentShowPassword] = useState(false);
  const [studentAcceptTerms, setStudentAcceptTerms] = useState(false);
  const [studentAddress, setStudentAddress] = useState('');
  const [studentEmergency, setStudentEmergency] = useState('');
  const [showStudentOptional, setShowStudentOptional] = useState(false);

  // Sign Up Form State (Parent)
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentLinkedRoll, setParentLinkedRoll] = useState('');
  const [parentRelation, setParentRelation] = useState<'Father' | 'Mother' | 'Guardian'>('Father');
  const [parentPassword, setParentPassword] = useState('');
  const [parentConfirmPassword, setParentConfirmPassword] = useState('');
  const [parentShowPassword, setParentShowPassword] = useState(false);
  const [parentAcceptTerms, setParentAcceptTerms] = useState(false);
  const [parentAddress, setParentAddress] = useState('');
  const [parentEmergency, setParentEmergency] = useState('');
  const [showParentOptional, setShowParentOptional] = useState(false);

  // Feedback State
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // If already authenticated with an authorized role, redirect to their portal
  useEffect(() => {
    if (isAuthenticated && role) {
      const fromPath = (location.state as any)?.from?.pathname;
      const destination =
        fromPath && !fromPath.includes('/login') && !fromPath.includes('/select-role')
          ? fromPath
          : getPortalPathForRole(role);
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, role, navigate, location]);

  // Handle Sign In submission
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const trimmedId = loginIdentifier.trim();
    if (!trimmedId) {
      setLoginError('Please enter your institutional email or student roll number.');
      return;
    }

    if (!loginPassword) {
      setLoginError('Please enter your account password.');
      return;
    }

    const res = await loginWithCredentials(trimmedId, loginPassword);
    if (res.success) {
      const stored = getStoredUser();
      const verifiedRole = stored?.role ? mapBackendRoleToFrontend(stored.role) : 'STUDENT';
      navigate(getPortalPathForRole(verifiedRole), { replace: true });
    } else {
      setLoginError(res.message || 'Invalid email/roll number or password.');
    }
  };

  // Handle Student Registration
  const handleStudentRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setSignupSuccess(null);

    if (!studentName.trim() || studentName.trim().length < 2) {
      setSignupError('Full name is required (at least 2 characters).');
      return;
    }
    if (!studentRoll.trim() || studentRoll.trim().length < 3) {
      setSignupError('A valid student roll number is required (e.g. 21CS042).');
      return;
    }
    if (!studentEmail.trim() || !studentEmail.includes('@')) {
      setSignupError('Please provide a valid college or personal email address.');
      return;
    }
    if (!studentPhone.trim() || studentPhone.trim().length < 10) {
      setSignupError('Please provide a valid 10-digit contact mobile number.');
      return;
    }
    if (!studentPassword || studentPassword.length < 8) {
      setSignupError('Password must be at least 8 characters long.');
      return;
    }
    if (studentPassword !== studentConfirmPassword) {
      setSignupError('Password and confirm password do not match.');
      return;
    }
    if (!studentAcceptTerms) {
      setSignupError('You must accept the terms of service and hostel regulations.');
      return;
    }

    const payload = {
      fullName: studentName.trim(),
      rollNumber: studentRoll.trim().toUpperCase(),
      email: studentEmail.trim().toLowerCase(),
      phone: studentPhone.trim(),
      department: studentDept,
      academicYear: studentYear,
      password: studentPassword,
      confirmPassword: studentConfirmPassword,
      acceptTerms: true,
      address: studentAddress.trim() || undefined,
      emergencyContact: studentEmergency.trim() || undefined,
    };

    const res = await registerStudent(payload);
    if (res.success) {
      setSignupSuccess('Account registered successfully! Redirecting to student portal...');
      setTimeout(() => {
        navigate('/student', { replace: true });
      }, 900);
    } else {
      setSignupError(res.message || 'Registration failed. Please verify your details.');
    }
  };

  // Handle Parent Registration
  const handleParentRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setSignupSuccess(null);

    if (!parentName.trim() || parentName.trim().length < 2) {
      setSignupError('Full name is required (at least 2 characters).');
      return;
    }
    if (!parentEmail.trim() || !parentEmail.includes('@')) {
      setSignupError('Please provide a valid email address.');
      return;
    }
    if (!parentPhone.trim() || parentPhone.trim().length < 10) {
      setSignupError('Please provide a valid 10-digit mobile number.');
      return;
    }
    if (!parentLinkedRoll.trim()) {
      setSignupError("Linked student roll number is required to verify your ward's record.");
      return;
    }
    if (!parentPassword || parentPassword.length < 8) {
      setSignupError('Password must be at least 8 characters long.');
      return;
    }
    if (parentPassword !== parentConfirmPassword) {
      setSignupError('Password and confirm password do not match.');
      return;
    }
    if (!parentAcceptTerms) {
      setSignupError('You must accept the terms of service and parental authorization.');
      return;
    }

    const payload = {
      fullName: parentName.trim(),
      email: parentEmail.trim().toLowerCase(),
      phone: parentPhone.trim(),
      linkedStudentRoll: parentLinkedRoll.trim().toUpperCase(),
      relationship: parentRelation,
      password: parentPassword,
      confirmPassword: parentConfirmPassword,
      acceptTerms: true,
      address: parentAddress.trim() || undefined,
      emergencyContact: parentEmergency.trim() || undefined,
    };

    const res = await registerParent(payload);
    if (res.success) {
      setSignupSuccess('Guardian account verified & registered! Redirecting to parent portal...');
      setTimeout(() => {
        navigate('/parent', { replace: true });
      }, 900);
    } else {
      setSignupError(res.message || 'Parent registration failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fbf5fb] via-[#f8f9fc] to-[#f4f2fb] dark:from-[#060b17] dark:via-[#091124] dark:to-[#12081d] text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans relative overflow-x-hidden selection:bg-pink-500 selection:text-white">
      {/* Decorative ambient background glows */}
      <div className="fixed -top-36 -left-36 w-96 h-96 rounded-full bg-pink-400/15 dark:bg-pink-600/10 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-36 -right-36 w-96 h-96 rounded-full bg-purple-500/15 dark:bg-purple-600/10 blur-3xl pointer-events-none" />
      <div className="fixed top-1/2 left-1/3 -translate-y-1/2 w-80 h-80 rounded-full bg-fuchsia-300/10 dark:bg-fuchsia-600/5 blur-3xl pointer-events-none" />

      {/* Top Institutional Header */}
      <header className="w-full border-b border-pink-100/60 dark:border-slate-800/80 bg-white/70 dark:bg-[#070e1e]/70 backdrop-blur-md sticky top-0 z-30 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-fuchsia-600 text-white flex items-center justify-center shadow-md shadow-pink-500/25">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                ALTS HOSTEL MANAGEMENT
                <span className="text-[10px] font-mono uppercase bg-gradient-to-r from-pink-500/15 to-purple-500/15 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full font-bold border border-pink-500/25">
                  Web Portal
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Anantha Lakshmi Institute of Technology & Sciences
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100/80 dark:bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-200/60 dark:border-slate-700/60">
              <ShieldCheck className="w-3.5 h-3.5 text-pink-500" />
              <span>Campus Biometric Access</span>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-pink-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-90 transition-transform duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 hover:-rotate-45 transition-transform duration-300" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 z-10">
        <div className="w-full max-w-[960px] bg-white dark:bg-[#0c1427] rounded-[28px] sm:rounded-[32px] shadow-[0_20px_60px_-15px_rgba(168,19,99,0.14),0_10px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] border border-pink-100/70 dark:border-slate-800/90 relative overflow-hidden min-h-[640px] md:min-h-[660px] flex flex-col md:block">

          {/* ============================================================== */}
          {/* MOBILE TOGGLE HEADER (Visible on screens < md)                 */}
          {/* ============================================================== */}
          <div className="md:hidden w-full bg-gradient-to-r from-[#8a0f58] via-[#c91873] to-[#e82583] text-white p-6 relative overflow-hidden">
            <div className="relative z-10 text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold text-white">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ALTS Autonomous Hostel System</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">
                {isSignUp ? 'Join ALTS Portal' : 'Welcome Back'}
              </h2>
              <p className="text-xs text-pink-100/90 max-w-xs mx-auto">
                {isSignUp
                  ? 'Create your resident scholar or parent guardian account.'
                  : 'Enter your credentials to access your authorized portal.'}
              </p>

              {/* Mobile Mode Switcher Tabs */}
              <div className="pt-2 flex items-center justify-center">
                <div className="bg-black/20 p-1 rounded-full flex gap-1 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setSignupError(null);
                    }}
                    className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${!isSignUp
                      ? 'bg-white text-pink-600 shadow-md'
                      : 'text-white/80 hover:text-white'
                      }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setLoginError(null);
                    }}
                    className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${isSignUp
                      ? 'bg-white text-pink-600 shadow-md'
                      : 'text-white/80 hover:text-white'
                      }`}
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile wavy bottom SVG */}
            <svg
              className="absolute -bottom-1 left-0 w-full h-4 text-white dark:text-[#0c1427]"
              preserveAspectRatio="none"
              viewBox="0 0 1200 120"
            >
              <path
                d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,45 L1200,120 L0,120 Z"
                fill="currentColor"
              />
            </svg>
          </div>

          {/* ============================================================== */}
          {/* 1. SIGN IN FORM PANEL (Left Half on Desktop)                    */}
          {/* ============================================================== */}
          <div
            className={`w-full md:w-1/2 p-6 sm:p-10 md:p-12 flex flex-col justify-center transition-all duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] ${isSignUp
              ? 'md:opacity-0 md:pointer-events-none md:-translate-x-12 hidden md:flex'
              : 'md:opacity-100 md:pointer-events-auto md:translate-x-0 flex'
              } md:absolute md:top-0 md:left-0 md:h-full z-10`}
          >
            <div className="max-w-sm w-full mx-auto space-y-6">
              {/* Form Title */}
              <div className="text-center md:text-left space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
                  Institutional Login form
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  Sign In to ALTS Hostel Portal
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter your registered institutional email or student roll number.
                </p>
              </div>

              {/* Error Alert Box */}
              {loginError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in zoom-in-95 duration-200"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{loginError}</div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Email or Roll Number</span>
                    <span className="text-[10px] text-slate-400 font-normal">e.g. 21CS042</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      autoComplete="username"
                      required
                      value={loginIdentifier}
                      onChange={(e) => {
                        setLoginIdentifier(e.target.value);
                        setLoginError(null);
                      }}
                      placeholder="student.priya@hostelguard.edu or 21CS042"
                      className="w-full text-xs pl-10 pr-3.5 py-3 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] text-pink-600 dark:text-pink-400 hover:underline cursor-pointer font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={loginShowPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginError(null);
                      }}
                      placeholder="Enter your account password"
                      className="w-full text-xs pl-10 pr-10 py-3 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setLoginShowPassword(!loginShowPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                      aria-label={loginShowPassword ? 'Hide password' : 'Show password'}
                    >
                      {loginShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400 select-none">
                    <input
                      type="checkbox"
                      checked={loginRememberMe}
                      onChange={(e) => setLoginRememberMe(e.target.checked)}
                      className="rounded text-pink-600 focus:ring-pink-500/20 border-slate-300 dark:border-slate-700 w-3.5 h-3.5 accent-pink-600"
                    />
                    <span>Remember my device</span>
                  </label>
                </div>

                {/* Sign In CTA Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-pink-600 via-rose-500 to-fuchsia-600 hover:from-pink-500 hover:to-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isAuthenticating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>SIGN IN</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Staff Provisioning Notice */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Wardens & Staff:</strong> Use your official institutional credentials or contact administration for account provisioning.
                </span>
              </div>

              {/* Mobile Switch to Sign Up */}
              <div className="text-center md:hidden pt-2">
                <p className="text-xs text-slate-500">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="text-pink-600 dark:text-pink-400 font-bold hover:underline cursor-pointer"
                  >
                    Sign Up here
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 2. SIGN UP FORM PANEL (Right Half on Desktop)                   */}
          {/* ============================================================== */}
          <div
            className={`w-full md:w-1/2 p-6 sm:p-10 md:p-12 flex flex-col justify-center transition-all duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] ${isSignUp
              ? 'md:opacity-100 md:pointer-events-auto md:translate-x-0 flex'
              : 'md:opacity-0 md:pointer-events-none md:translate-x-12 hidden md:flex'
              } md:absolute md:top-0 md:right-0 md:h-full z-10 md:overflow-y-auto`}
          >
            <div className="max-w-sm w-full mx-auto space-y-5 my-auto">
              {/* Header & Category Switch */}
              <div className="text-center md:text-left space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
                  New Registration
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  Create Account
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Register as a resident scholar or parent guardian.
                </p>
              </div>

              {/* Category Segmented Tabs */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-900/90 rounded-full border border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setRegCategory('student');
                    setSignupError(null);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${regCategory === 'student'
                    ? 'bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegCategory('parent');
                    setSignupError(null);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${regCategory === 'parent'
                    ? 'bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Parent / Guardian</span>
                </button>
              </div>

              {/* Error / Success Feedback */}
              {signupError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in zoom-in-95 duration-200"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{signupError}</div>
                </div>
              )}

              {signupSuccess && (
                <div
                  role="status"
                  className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in zoom-in-95 duration-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{signupSuccess}</div>
                </div>
              )}

              {/* ============================================================ */}
              {/* CATEGORY A: STUDENT REGISTRATION FORM                         */}
              {/* ============================================================ */}
              {regCategory === 'student' ? (
                <form onSubmit={handleStudentRegisterSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          placeholder="Priya Sharma"
                          className="w-full text-xs pl-8 pr-3 py-2.5 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Roll Number *
                      </label>
                      <div className="relative">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={studentRoll}
                          onChange={(e) => setStudentRoll(e.target.value.toUpperCase())}
                          placeholder="21CS042"
                          className="w-full text-xs pl-8 pr-3 py-2.5 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 uppercase focus:outline-none focus:border-pink-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          placeholder="priya@alts.edu"
                          className="w-full text-xs pl-8 pr-3 py-2.5 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Mobile Number *
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="tel"
                          required
                          value={studentPhone}
                          onChange={(e) => setStudentPhone(e.target.value)}
                          placeholder="9876543210"
                          className="w-full text-xs pl-8 pr-3 py-2.5 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Department *
                      </label>
                      <select
                        value={studentDept}
                        onChange={(e) => setStudentDept(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-pink-500 cursor-pointer"
                      >
                        <option value="Computer Science & Engineering">CSE</option>
                        <option value="Electronics & Communication">ECE</option>
                        <option value="Electrical & Electronics">EEE</option>
                        <option value="Mechanical Engineering">Mechanical</option>
                        <option value="Civil Engineering">Civil</option>
                        <option value="Artificial Intelligence & DS">AI & DS</option>
                        <option value="Information Technology">IT</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Academic Year *
                      </label>
                      <select
                        value={studentYear}
                        onChange={(e) => setStudentYear(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-pink-500 cursor-pointer"
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Password (min 8) *
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={studentShowPassword ? 'text' : 'password'}
                          required
                          value={studentPassword}
                          onChange={(e) => setStudentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full text-xs pl-8 pr-8 py-2.5 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-pink-500"
                        />
                        <button
                          type="button"
                          onClick={() => setStudentShowPassword(!studentShowPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {studentShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={studentShowPassword ? 'text' : 'password'}
                          required
                          value={studentConfirmPassword}
                          onChange={(e) => setStudentConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full text-xs pl-8 pr-3 py-2.5 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Optional Details Accordion */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowStudentOptional(!showStudentOptional)}
                      className="text-[11px] text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <span>{showStudentOptional ? '− Hide' : '+ Add'} Optional Contact & Address</span>
                    </button>
                    {showStudentOptional && (
                      <div className="mt-2 space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 animate-in fade-in-50 duration-200">
                        <input
                          type="text"
                          value={studentAddress}
                          onChange={(e) => setStudentAddress(e.target.value)}
                          placeholder="Permanent Home Address"
                          className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                        />
                        <input
                          type="text"
                          value={studentEmergency}
                          onChange={(e) => setStudentEmergency(e.target.value)}
                          placeholder="Emergency Contact Name & Phone"
                          className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    )}
                  </div>

                  {/* Accept Terms Checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2 cursor-pointer text-[11px] text-slate-600 dark:text-slate-400 select-none">
                      <input
                        type="checkbox"
                        required
                        checked={studentAcceptTerms}
                        onChange={(e) => setStudentAcceptTerms(e.target.checked)}
                        className="rounded text-pink-600 focus:ring-pink-500/20 border-slate-300 dark:border-slate-700 w-3.5 h-3.5 accent-pink-600 mt-0.5"
                      />
                      <span>
                        I accept the ALTS Hostel Portal terms of service and residential code of conduct.
                      </span>
                    </label>
                  </div>

                  {/* Submit CTA */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isAuthenticating}
                      className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-pink-600 via-rose-500 to-fuchsia-600 hover:from-pink-500 hover:to-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isAuthenticating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Creating Student Account...</span>
                        </>
                      ) : (
                        <>
                          <span>REGISTER SCHOLAR</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* ============================================================ */
                /* CATEGORY B: PARENT REGISTRATION FORM                         */
                /* ============================================================ */
                <form onSubmit={handleParentRegisterSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Parent / Guardian Name *
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={parentName}
                          onChange={(e) => setParentName(e.target.value)}
                          placeholder="Rakesh Sharma"
                          className="w-full text-xs pl-8 pr-3 py-2.5 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Relationship *
                      </label>
                      <select
                        value={parentRelation}
                        onChange={(e) => setParentRelation(e.target.value as any)}
                        className="w-full text-xs px-3 py-2.5 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-pink-500 cursor-pointer"
                      >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Guardian">Guardian</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={parentEmail}
                          onChange={(e) => setParentEmail(e.target.value)}
                          placeholder="parent@gmail.com"
                          className="w-full text-xs pl-8 pr-3 py-2.5 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Mobile Number *
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="tel"
                          required
                          value={parentPhone}
                          onChange={(e) => setParentPhone(e.target.value)}
                          placeholder="9876543215"
                          className="w-full text-xs pl-8 pr-3 py-2.5 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Linked Student Roll Number (Verified by server) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Linked Student Roll Number *</span>
                      <span className="text-[10px] text-pink-600 dark:text-pink-400 font-medium">Verified by Server</span>
                    </label>
                    <div className="relative">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={parentLinkedRoll}
                        onChange={(e) => setParentLinkedRoll(e.target.value.toUpperCase())}
                        placeholder="21CS042 (Enter your ward's roll number)"
                        className="w-full text-xs pl-8 pr-3 py-2.5 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 uppercase focus:outline-none focus:border-pink-500 font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Must match an active student record in ALTS database.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Password (min 8) *
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={parentShowPassword ? 'text' : 'password'}
                          required
                          value={parentPassword}
                          onChange={(e) => setParentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full text-xs pl-8 pr-8 py-2.5 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-pink-500"
                        />
                        <button
                          type="button"
                          onClick={() => setParentShowPassword(!parentShowPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {parentShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={parentShowPassword ? 'text' : 'password'}
                          required
                          value={parentConfirmPassword}
                          onChange={(e) => setParentConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full text-xs pl-8 pr-3 py-2.5 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Optional Details Accordion */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowParentOptional(!showParentOptional)}
                      className="text-[11px] text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <span>{showParentOptional ? '− Hide' : '+ Add'} Optional Contact & Address</span>
                    </button>
                    {showParentOptional && (
                      <div className="mt-2 space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 animate-in fade-in-50 duration-200">
                        <input
                          type="text"
                          value={parentAddress}
                          onChange={(e) => setParentAddress(e.target.value)}
                          placeholder="Residential Address"
                          className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                        />
                        <input
                          type="text"
                          value={parentEmergency}
                          onChange={(e) => setParentEmergency(e.target.value)}
                          placeholder="Alternate Emergency Phone"
                          className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    )}
                  </div>

                  {/* Terms Checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2 cursor-pointer text-[11px] text-slate-600 dark:text-slate-400 select-none">
                      <input
                        type="checkbox"
                        required
                        checked={parentAcceptTerms}
                        onChange={(e) => setParentAcceptTerms(e.target.checked)}
                        className="rounded text-pink-600 focus:ring-pink-500/20 border-slate-300 dark:border-slate-700 w-3.5 h-3.5 accent-pink-600 mt-0.5"
                      />
                      <span>
                        I confirm that I am the authorized guardian of the linked scholar and agree to hostel guidelines.
                      </span>
                    </label>
                  </div>

                  {/* Submit CTA */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isAuthenticating}
                      className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-pink-600 via-rose-500 to-fuchsia-600 hover:from-pink-500 hover:to-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isAuthenticating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Verifying & Registering...</span>
                        </>
                      ) : (
                        <>
                          <span>REGISTER GUARDIAN</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Mobile Switch to Sign In */}
              <div className="text-center md:hidden pt-2">
                <p className="text-xs text-slate-500">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className="text-pink-600 dark:text-pink-400 font-bold hover:underline cursor-pointer"
                  >
                    Sign In here
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 3. SLIDING OVERLAY CONTAINER (Desktop Only - from Video Ref)   */}
          {/* ============================================================== */}
          <div
            className={`hidden md:block absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] z-20 ${isSignUp ? '-translate-x-full' : 'translate-x-0'
              }`}
          >
            {/* Inner Double-Width Canvas */}
            <div
              className={`w-[200%] h-full relative -left-full transition-transform duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] flex ${isSignUp ? 'translate-x-1/2' : 'translate-x-0'
                }`}
            >
              {/* ---------------------------------------------------------- */}
              {/* OVERLAY PANEL A: LEFT SIDE (Visible when Sign Up is open)  */}
              {/* "Welcome Back - To keep connected with us please sign in"  */}
              {/* ---------------------------------------------------------- */}
              <div className="w-1/2 h-full bg-gradient-to-br from-[#8a0f58] via-[#c91873] to-[#e82583] text-white flex flex-col justify-center items-center text-center p-10 sm:p-12 relative overflow-hidden">
                {/* Wavy scalloped divider on right edge */}
                <div className="absolute top-0 right-0 h-full w-12 pointer-events-none overflow-hidden z-10">
                  <svg
                    viewBox="0 0 100 800"
                    preserveAspectRatio="none"
                    className="w-full h-full text-white dark:text-[#0c1427] fill-current"
                  >
                    <path d="M100,0 C20,100 80,200 30,300 C-10,400 70,500 20,600 C-20,700 80,750 100,800 Z" />
                  </svg>
                </div>

                {/* Floating Decorative Shapes inspired by video */}
                <div className="absolute top-10 left-10 w-20 h-20 rounded-2xl border-2 border-white/20 -rotate-12 animate-float-slow pointer-events-none" />
                <div className="absolute bottom-12 left-16 w-14 h-14 rounded-full bg-white/10 animate-pulse-soft pointer-events-none" />
                <div className="absolute top-24 right-16 w-8 h-8 rounded-lg bg-white/15 rotate-45 animate-float-reverse pointer-events-none" />
                <div className="absolute bottom-24 right-20 w-16 h-16 rounded-3xl border-2 border-white/15 rotate-12 pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 max-w-xs space-y-4">
                  {/* Decorative Camera / Film Reel Vector from Video */}
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl shadow-pink-900/30">
                    <KeyRound className="w-10 h-10 text-white animate-pulse-soft" />
                  </div>

                  <h3 className="text-3xl font-black tracking-tight text-white">
                    Welcome Back
                  </h3>
                  <p className="text-xs text-pink-100/90 leading-relaxed font-normal">
                    To keep connected with your hostel room, gate passes, leaves, and mess status, please sign in with your personal credentials.
                  </p>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(false);
                        setSignupError(null);
                        setSignupSuccess(null);
                      }}
                      className="border-2 border-white text-white rounded-full px-10 py-2.5 font-bold uppercase tracking-wider text-xs hover:bg-white hover:text-pink-600 transition-all cursor-pointer shadow-lg hover:shadow-white/25 active:scale-95"
                    >
                      SIGN IN
                    </button>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------------- */}
              {/* OVERLAY PANEL B: RIGHT SIDE (Visible when Sign In is open) */}
              {/* "Hello, friend! - Watch and share your best moments"       */}
              {/* ---------------------------------------------------------- */}
              <div className="w-1/2 h-full bg-gradient-to-bl from-[#8a0f58] via-[#c91873] to-[#e82583] text-white flex flex-col justify-center items-center text-center p-10 sm:p-12 relative overflow-hidden">
                {/* Wavy scalloped divider on left edge */}
                <div className="absolute top-0 left-0 h-full w-12 pointer-events-none overflow-hidden z-10">
                  <svg
                    viewBox="0 0 100 800"
                    preserveAspectRatio="none"
                    className="w-full h-full text-white dark:text-[#0c1427] fill-current"
                  >
                    <path d="M0,0 C80,100 20,200 70,300 C110,400 30,500 80,600 C120,700 20,750 0,800 Z" />
                  </svg>
                </div>

                {/* Floating Decorative Shapes inspired by video */}
                <div className="absolute top-12 right-12 w-20 h-20 rounded-3xl border-2 border-white/20 rotate-12 animate-float-slow pointer-events-none" />
                <div className="absolute bottom-10 right-14 w-12 h-12 rounded-full bg-white/10 animate-pulse-soft pointer-events-none" />
                <div className="absolute top-20 left-14 w-10 h-10 rounded-xl bg-white/15 -rotate-45 animate-float-reverse pointer-events-none" />
                <div className="absolute bottom-20 left-20 w-16 h-16 rounded-2xl border-2 border-white/15 -rotate-12 pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 max-w-xs space-y-4">
                  {/* Decorative Projector / Film Slate Icon from Video */}
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl shadow-pink-900/30">
                    <Sparkles className="w-10 h-10 text-white animate-pulse-soft" />
                  </div>

                  <h3 className="text-3xl font-black tracking-tight text-white">
                    Hello, friend!
                  </h3>
                  <p className="text-xs text-pink-100/90 leading-relaxed font-normal">
                    Enter your personal institutional details and start your journey with ALTS Autonomous Hostel Portal.
                  </p>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(true);
                        setLoginError(null);
                      }}
                      className="border-2 border-white text-white rounded-full px-10 py-2.5 font-bold uppercase tracking-wider text-xs hover:bg-white hover:text-pink-600 transition-all cursor-pointer shadow-lg hover:shadow-white/25 active:scale-95"
                    >
                      SIGN UP
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c1427] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-pink-100 dark:border-slate-800 space-y-4 relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Password Recovery & Reset
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                For security reasons in the residential campus management system, password resets are processed through institutional verification:
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <p>
                <strong>Resident Students:</strong> Visit your respective hostel warden's office (Chakrika Girls Hostel / ALTS Boys Hostel) with your college ID card.
              </p>
              <p className="pt-1">
                <strong>Parents & Staff:</strong> Contact the ALTS Campus IT & Hostel Systems desk at <span className="font-mono text-pink-600 dark:text-pink-400">hostel-support@alts.edu.in</span>.
              </p>
            </div>

            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-[#060b17]/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} Anantha Lakshmi Institute of Technology & Sciences. All rights reserved.
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            ALTS Autonomous Hostel Portal v2.0
          </span>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
