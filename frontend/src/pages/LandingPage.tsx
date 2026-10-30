import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Shield, 
  ShieldCheck,
  ScanFace, 
  FileCheck2, 
  Smartphone, 
  DoorClosed, 
  ArrowRight, 
  Sparkles, 
  Users, 
  Sun, 
  Moon, 
  Building,
  CheckCircle2,
  LockKeyhole,
  Activity
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme, setRole } = useApp();
  const navigate = useNavigate();

  const handleRoleQuickStart = (targetRole: 'STUDENT' | 'GIRLS_WARDEN' | 'BOYS_WARDEN' | 'GATE_SECURITY', path: string) => {
    setRole(targetRole);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060b17] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#060b17]/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                ALTS
                <span className="text-[10px] font-mono uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-semibold border border-blue-500/20">
                  HOSTEL PORTAL
                </span>
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-medium hidden sm:block">
                Anantha Lakshmi ITS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            <Link to="/login">
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Sign In to Portal
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24">
        {/* Subtle Ambient Light */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-5">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Intelligent Campus Security & Biometric Leave Automation</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            Hostel Security & Leave Automation with{' '}
            <span className="text-blue-600 dark:text-blue-400">
              Biometric Face Verification
            </span>
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            A unified digital governance platform connecting resident scholars, hostel wardens, and turnstile gate security. Eliminates manual registers with encrypted QR passes and optical biometric verification.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/select-role" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto px-6 shadow-sm shadow-blue-500/20"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Launch Demo Portals
              </Button>
            </Link>
            <a href="#features" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="md"
                className="w-full sm:w-auto"
              >
                Explore Architecture
              </Button>
            </a>
          </div>

          {/* Concise Metric Highlights */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
              <div className="text-xl font-bold text-slate-900 dark:text-white">99.4%</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Biometric Match (Sim)</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">&lt; 1.2s</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Gate Clearance Speed</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">100%</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Paperless Approvals</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Automated</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Parent Notification Sync</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Portals Section */}
      <section className="py-12 bg-slate-100/60 dark:bg-[#070e1e] border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Modular Role Dashboards
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select any role to test the live frontend simulation environment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Student */}
            <div 
              onClick={() => handleRoleQuickStart('STUDENT', '/student')}
              className="p-5 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500/50 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Student Portal</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Apply for day outings and home leaves with real-time validation, download digital QR gate passes, and track entry/exit logs.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400">
                <span>Enter Portal</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Girls Warden */}
            <div 
              onClick={() => handleRoleQuickStart('GIRLS_WARDEN', '/girls-warden')}
              className="p-5 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/50 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Girls Hostel Warden</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Review Chakrika Hostel requests with parent verification flags, manage active outside inmates, and issue digital passes.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span>Enter Portal</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Boys Warden */}
            <div 
              onClick={() => handleRoleQuickStart('BOYS_WARDEN', '/boys-warden')}
              className="p-5 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/50 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Building className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Boys Hostel Warden</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Oversee ALTS Hostel residents, night-out requests, curfew tracking, and view weekly leave analytics graphs.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <span>Enter Portal</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Gate Security */}
            <div 
              onClick={() => handleRoleQuickStart('GATE_SECURITY', '/gate-security')}
              className="p-5 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 hover:border-purple-500/50 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <ScanFace className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Gate Security Post</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Biometric turnstile terminal with optical scanning HUD, webcam option, leave pass audit, and movement logger.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs font-semibold text-purple-600 dark:text-purple-400">
                <span>Enter Terminal</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Architecture Features */}
      <section id="features" className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              System Capabilities
            </span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
              Campus Security Architecture
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ScanFace className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                Biometric Face Verification
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Contactless facial recognition at turnstiles prevents proxy exits and unauthorized campus departures.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                Digital Warden Approvals
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Warden console provides single-click approvals, mandatory rejection reasons, and parent verification logs.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <DoorClosed className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                Real-Time Movement Logs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Synchronized turnstile logs track entries and exits with exact timestamps, gate ID, and biometric match confidence.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                Parent SMS & WhatsApp Sync
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Automated notification gateways dispatch departure and arrival confirmations to registered guardian phone numbers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Process Section */}
      <section className="py-14 bg-slate-100/50 dark:bg-[#070e1e] border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              End-to-End Movement Workflow
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mx-auto mb-2.5">
                1
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">Student Applies</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Submits digital leave request specifying departure, return time, and stated purpose.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mx-auto mb-2.5">
                2
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">Warden Authorization</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Warden verifies parent consent and approves request, issuing a digital QR Gate Pass.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mx-auto mb-2.5">
                3
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">Biometric Scan</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Student looks into security terminal camera. AI compares facial embedding with active pass.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80">
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center mx-auto mb-2.5">
                4
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">Gate Clearance & SMS</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Turnstile barrier opens, timestamp is sealed in movement logs, and parent receives automated alert.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white dark:bg-[#050a14] border-t border-slate-200/80 dark:border-slate-800/80 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">ALTS HOSTEL PORTAL</span>
            <span>• Anantha Lakshmi Institute of Technology & Sciences</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-blue-500 transition-colors">Portal Login</Link>
          </div>

          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} ALTS Security & Administration
          </p>
        </div>
      </footer>
    </div>
  );
};
