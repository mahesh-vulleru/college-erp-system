import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  ArrowRight,
  Play,
  ShieldCheck,
  CheckCircle2,
  Users,
  Building2,
  GitBranch,
  UserCheck,
  Coins,
  BookOpen,
  BookCheck,
  Moon,
  Sun,
  Layers,
  BarChart3,
  Monitor,
  Phone,
  Mail,
  MapPin,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '@college-erp/shared';
import CampusBuildingGraphic from '../components/common/CampusBuildingGraphic';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const getPortalPath = (role) => {
    const normalized = (role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
    switch (normalized) {
      case 'super_admin':
      case 'superadmin':
      case 'admin':
        return '/admin';
      case 'principal':
        return '/principal';
      case 'hod':
        return '/hod';
      case 'faculty':
        return '/faculty';
      case 'student':
        return '/student';
      case 'accounts':
      case 'accountant':
      case 'finance':
        return '/accounts';
      case 'librarian':
        return '/library';
      case 'library_staff':
      case 'librarystaff':
        return '/library-staff';
      default:
        return '/principal';
    }
  };

  const portalCards = [
    {
      id: ROLES.SUPER_ADMIN,
      title: 'Super Admin',
      desc: 'System setup, security audit & user accounts',
      icon: ShieldCheck,
      bgColor: 'bg-emerald-50/70',
      iconBg: 'bg-emerald-100 text-emerald-700',
      borderColor: 'border-emerald-200/60',
      roleParam: 'super_admin'
    },
    {
      id: ROLES.PRINCIPAL,
      title: 'Principal / Management',
      desc: 'Institutional analytics & executive governance',
      icon: Building2,
      bgColor: 'bg-sky-50/70',
      iconBg: 'bg-sky-100 text-sky-700',
      borderColor: 'border-sky-200/60',
      roleParam: 'principal'
    },
    {
      id: ROLES.HOD,
      title: 'HOD',
      desc: 'Curriculum, timetables & faculty loads',
      icon: GitBranch,
      bgColor: 'bg-amber-50/70',
      iconBg: 'bg-amber-100 text-amber-700',
      borderColor: 'border-amber-200/60',
      roleParam: 'hod'
    },
    {
      id: ROLES.FACULTY,
      title: 'Faculty',
      desc: 'Class attendance & internal exam marks',
      icon: GraduationCap,
      bgColor: 'bg-purple-50/70',
      iconBg: 'bg-purple-100 text-purple-700',
      borderColor: 'border-purple-200/60',
      roleParam: 'faculty'
    },
    {
      id: ROLES.STUDENT,
      title: 'Student',
      desc: 'Attendance %, grade cards & fee receipts',
      icon: Users,
      bgColor: 'bg-emerald-50/70',
      iconBg: 'bg-emerald-100 text-emerald-700',
      borderColor: 'border-emerald-200/60',
      roleParam: 'student'
    },
    {
      id: ROLES.ACCOUNTS,
      title: 'Accounts',
      desc: 'Fee structures, receipts & collection ledgers',
      icon: Coins,
      bgColor: 'bg-rose-50/70',
      iconBg: 'bg-rose-100 text-rose-700',
      borderColor: 'border-rose-200/60',
      roleParam: 'accounts'
    },
    {
      id: ROLES.LIBRARIAN,
      title: 'Librarian',
      desc: 'Catalog, book issues, returns & fines',
      icon: BookOpen,
      bgColor: 'bg-sky-50/70',
      iconBg: 'bg-sky-100 text-sky-700',
      borderColor: 'border-sky-200/60',
      roleParam: 'librarian'
    },
    {
      id: ROLES.LIBRARY_STAFF,
      title: 'Library Staff',
      desc: 'Book circulation, issue, return & reservation',
      icon: BookCheck,
      bgColor: 'bg-indigo-50/70',
      iconBg: 'bg-indigo-100 text-indigo-700',
      borderColor: 'border-indigo-200/60',
      roleParam: 'library_staff'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Top Navbar matching Image 1 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 block leading-tight">
                College ERP
              </span>
              <span className="text-[11px] text-slate-500 font-medium block">
                Integrated Campus Management
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-700">
            <a href="#home" className="text-emerald-600 font-bold border-b-2 border-emerald-600 pb-1">
              Home
            </a>
            <a href="#features" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
              Features <span className="text-[10px] text-slate-400">▾</span>
            </a>
            <a href="#modules" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
              Modules <span className="text-[10px] text-slate-400">▾</span>
            </a>
            <a href="#about" className="hover:text-emerald-600 transition-colors">
              About
            </a>
            <a href="#contact" className="hover:text-emerald-600 transition-colors">
              Contact
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-4">
            <button
              type="button"
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Toggle Appearance"
            >
              <Moon className="w-4 h-4" />
            </button>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate(getPortalPath(user?.role))}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all hover:scale-102"
              >
                Go to Portal ({user?.role?.replace(/_/g, ' ')}) <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#064e3b] hover:bg-[#075e47] text-white font-bold text-xs shadow-xs transition-all hover:scale-102"
              >
                Login to ERP <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section matching Image 1 */}
      <section id="home" className="relative overflow-hidden pt-8 pb-16 lg:py-20 bg-gradient-to-b from-[#f8faf9] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              {/* Badge Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>All-in-One College Management Platform</span>
              </div>

              {/* Main Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                College ERP <span className="text-[#064e3b]">System</span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                A unified, role-based platform to manage <strong className="font-semibold text-slate-800">academics</strong>, <strong className="font-semibold text-slate-800">administration</strong>, <strong className="font-semibold text-slate-800">students</strong>, <strong className="font-semibold text-slate-800">faculty</strong>, <strong className="font-semibold text-slate-800">finance</strong>, <strong className="font-semibold text-slate-800">library</strong> and campus operations efficiently.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#064e3b] hover:bg-[#085f48] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/15 transition-all hover:scale-102"
                >
                  <ArrowRight className="w-4 h-4" /> Login to Portal
                </Link>

                <button
                  type="button"
                  onClick={() => setIsDemoModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm border border-slate-300 shadow-2xs transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-800" /> Watch Demo
                </button>
              </div>

              {/* Value Checkpoints */}
              <div className="pt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Role-Based Access</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Secure & Reliable</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Paperless Operations</span>
                </div>
              </div>
            </div>

            {/* Right Hero Graphic with architectural campus visual */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-emerald-950/5 group">
                <img
                  src="/hero-screenshot.jpg"
                  alt="Apex Engineering College Campus"
                  className="w-full h-[320px] sm:h-[400px] object-cover object-right transform group-hover:scale-102 transition-transform duration-700"
                  onError={(e) => {
                    // Fallback to decorative illustration container if screenshot not available
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />

                {/* Campus Badge Overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-lg flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 leading-tight">Autonomous Engineering College</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Ranked Grade 'A+' Institutional Campus &bull; 68 Programs</p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                    Live ERP
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. "Access Your Institutional Portal" 8-Role Section matching Image 1 */}
      <section className="py-16 sm:py-20 bg-slate-50/60 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Access Your Institutional Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Choose your role to continue to the respective dashboard.
            </p>
          </div>

          {/* 8 Distinct Colorful Role Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {portalCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={() => navigate(`/login?role=${card.roleParam}`)}
                  className={`p-5 rounded-3xl border ${card.borderColor} ${card.bgColor} bg-white hover-card-elevate cursor-pointer transition-all flex flex-col justify-between space-y-4`}
                >
                  <div className="space-y-3">
                    <div className={`w-11 h-11 rounded-2xl ${card.iconBg} flex items-center justify-center shadow-2xs`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{card.title}</h3>
                      <p className="text-xs text-slate-500 leading-snug mt-1 font-normal">
                        {card.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 shadow-2xs transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4 Feature Pillars Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14 pt-10 border-t border-slate-200/80">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Unified Management</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">All college operations in one platform</p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Real-Time Insights</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Reports, analytics and performance tracking</p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Secure & Role-Based</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Controlled access for every user role</p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Web & Mobile Ready</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Access anytime, anywhere smoothly</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Dark Forest-Green Statistics Banner matching Image 1 */}
      <section className="py-8 bg-[#062a1e] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-emerald-800/60">
            <div className="pt-4 md:pt-0">
              <div className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span className="text-2xl sm:text-3xl font-black text-white">1,000+</span>
              </div>
              <p className="text-xs text-emerald-300/80 font-medium mt-1">Students</p>
            </div>

            <div className="pt-4 md:pt-0">
              <div className="flex items-center justify-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                <span className="text-2xl sm:text-3xl font-black text-white">100+</span>
              </div>
              <p className="text-xs text-emerald-300/80 font-medium mt-1">Faculty & Staff</p>
            </div>

            <div className="pt-4 md:pt-0">
              <div className="flex items-center justify-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <span className="text-2xl sm:text-3xl font-black text-white">10+</span>
              </div>
              <p className="text-xs text-emerald-300/80 font-medium mt-1">Departments</p>
            </div>

            <div className="pt-4 md:pt-0">
              <div className="flex items-center justify-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <span className="text-2xl sm:text-3xl font-black text-white">20+</span>
              </div>
              <p className="text-xs text-emerald-300/80 font-medium mt-1">Integrated Modules</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Institutional Footer */}
      <footer id="contact" className="bg-[#041a13] text-emerald-100/70 py-12 border-t border-emerald-950 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-white font-black text-base">
              <GraduationCap className="w-5 h-5 text-emerald-400" />
              <span>Apex Engineering College</span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-200/60">
              Autonomous Technical Institution approved by AICTE & UGC. Committed to engineering innovation, digital transparency, and institutional excellence.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">Academic Programs</h4>
            <ul className="space-y-2 text-[11px]">
              <li>Computer Science & Engineering</li>
              <li>Electronics & Communication</li>
              <li>Electrical & Electronics</li>
              <li>Mechanical & Robotics</li>
              <li>Artificial Intelligence & ML</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">Campus Modules</h4>
            <ul className="space-y-2 text-[11px]">
              <li><Link to="/courses" className="hover:text-white">Curriculum & Subjects</Link></li>
              <li><Link to="/attendance" className="hover:text-white">Daily Period Attendance</Link></li>
              <li><Link to="/examinations" className="hover:text-white">Examinations & Schedules</Link></li>
              <li><Link to="/fees" className="hover:text-white">Digital Fee Receipts</Link></li>
              <li><Link to="/library" className="hover:text-white">Central Library Catalog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">Campus Helpdesk</h4>
            <div className="space-y-2 text-[11px]">
              <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-emerald-400" /> Campus Road, Tech Valley, Hyderabad</p>
              <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-emerald-400" /> +91 (800) 234-5678</p>
              <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-emerald-400" /> registrar@college.edu</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between text-[11px]">
          <p>&copy; 2026 Apex Engineering College ERP System. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Designed & Engineered with React, Node.js & MongoDB.</p>
        </div>
      </footer>

      {/* Demo Video Modal */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" /> College ERP Platform Walkthrough
              </h3>
              <button
                onClick={() => setIsDemoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-6 space-y-4 text-xs text-slate-600">
              <div className="rounded-2xl bg-[#062a1e] p-6 text-white text-center space-y-2">
                <GraduationCap className="w-12 h-12 text-emerald-400 mx-auto animate-pulse-glow" />
                <h4 className="text-base font-bold">Interactive ERP Demonstration</h4>
                <p className="text-emerald-200/80 text-[11px]">
                  Experience instant role-based access for all 8 institutional personas directly from the portal login.
                </p>
              </div>
              <p>
                The College ERP System is fully connected to the live database, providing zero-latency academic tracking, digital fee payments, timetable scheduling and library circulation.
              </p>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsDemoModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Close
              </button>
              <Link
                to="/login"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
              >
                Try Live Portal <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
