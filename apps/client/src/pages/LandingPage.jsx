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
  X,
  ChevronDown,
  ChevronUp,
  Award,
  Compass,
  Briefcase,
  Clock,
  Bus,
  BedDouble,
  Cpu,
  Wifi,
  Sparkles,
  CalendarCheck,
  Lock,
  Server,
  HelpCircle,
  Globe,
  ExternalLink,
  FileText,
  Check,
  Activity,
  Flame,
  Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '@college-erp/shared';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState('about-erp');

  const toggleAccordion = (id) => {
    setOpenAccordion((prev) => (prev === id ? null : id));
  };

  const getPortalPath = (role) => {
    const normalized = (role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
switch (normalized) {
      case 'super_admin':
      case 'superadmin':
      case 'admin':
      case 'super_administrator':
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
      case 'transport_admin':
      case 'transportadmin':
      case 'transport_supervisor':
      case 'bus_driver':
      case 'bus_attendant':
      case 'parent':
        return '/transport';
      default:
        return '/login';
    }
  };

  // 1. All 8 Institutional Roles matching reference
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

  // 2. Verified Academic Departments
  const departmentsList = [
    {
      code: 'CSE',
      name: 'Computer Science & Engineering',
      icon: Cpu,
      intake: '120 Seats',
      programs: 'B.Tech, M.Tech, Ph.D.',
      specializations: 'Cloud Computing, Software Architecture, Full Stack',
      color: 'border-emerald-200 hover:border-emerald-500 bg-white'
    },
    {
      code: 'AI & DS',
      name: 'Artificial Intelligence & Data Science',
      icon: Sparkles,
      intake: '60 Seats',
      programs: 'B.Tech, M.Tech',
      specializations: 'Deep Learning, NLP, Big Data Analytics, Neural Nets',
      color: 'border-sky-200 hover:border-sky-500 bg-white'
    },
    {
      code: 'IT',
      name: 'Information Technology',
      icon: Globe,
      intake: '60 Seats',
      programs: 'B.Tech',
      specializations: 'Cybersecurity, Cloud Infrastructures, Web Systems',
      color: 'border-blue-200 hover:border-blue-500 bg-white'
    },
    {
      code: 'ECE',
      name: 'Electronics & Communication Engineering',
      icon: Activity,
      intake: '90 Seats',
      programs: 'B.Tech, M.Tech',
      specializations: 'VLSI Design, Embedded Systems, Wireless Networks',
      color: 'border-purple-200 hover:border-purple-500 bg-white'
    },
    {
      code: 'EEE',
      name: 'Electrical & Electronics Engineering',
      icon: Flame,
      intake: '60 Seats',
      programs: 'B.Tech, M.Tech',
      specializations: 'Smart Grids, Renewable Energy, Power Electronics',
      color: 'border-amber-200 hover:border-amber-500 bg-white'
    },
    {
      code: 'ME',
      name: 'Mechanical Engineering',
      icon: Compass,
      intake: '60 Seats',
      programs: 'B.Tech, M.Tech',
      specializations: 'CAD/CAM, Robotics, Thermal Engineering, Mechatronics',
      color: 'border-orange-200 hover:border-orange-500 bg-white'
    },
    {
      code: 'CE',
      name: 'Civil Engineering',
      icon: Building2,
      intake: '60 Seats',
      programs: 'B.Tech, M.Tech',
      specializations: 'Structural Engineering, Geotechnical, GIS & Surveying',
      color: 'border-teal-200 hover:border-teal-500 bg-white'
    }
  ];

  // 3. Campus Facilities
  const campusFacilities = [
    {
      title: 'Central Digital Library',
      desc: 'Over 38,500+ physical volumes, IEEE Xplore, DELNET online access, and RFID circulation desk.',
      icon: BookOpen,
      tag: 'Academic Resource'
    },
    {
      title: 'High-Tech Computer Labs',
      desc: '1,200+ networked Intel i7 and GPU workstations running Linux and Windows development environments.',
      icon: Cpu,
      tag: 'Computing Center'
    },
    {
      title: 'Advanced Research Facilities',
      desc: 'Sponsored R&D labs, IoT innovation centers, and institutional patent incubation facility.',
      icon: Target,
      tag: 'Innovation Hub'
    },
    {
      title: 'Sports & Gymnasium Complex',
      desc: '400m athletic track, indoor badminton auditorium, basketball, cricket, and modern gymnasium.',
      icon: Award,
      tag: 'Athletics & Health'
    },
    {
      title: 'On-Campus Student Hostels',
      desc: 'Separate secure residence halls for boys and girls with high-speed Wi-Fi, biometric security, and dining.',
      icon: BedDouble,
      tag: 'Campus Living'
    },
    {
      title: 'Campus Transportation Fleet',
      desc: '45+ GPS-tracked institutional buses connecting Hyderabad and Secunderabad twin-city zones.',
      icon: Bus,
      tag: 'Transit Network'
    },
    {
      title: 'Corporate Placement Directorate',
      desc: 'Dedicated career center with 94.2% placement record, 120+ recruiters, and mock interview studios.',
      icon: Briefcase,
      tag: 'Career Growth'
    },
    {
      title: 'Digital Smart Classrooms',
      desc: 'Air-conditioned multimedia lecture theaters with hybrid recording, smart boards, and LMS streaming.',
      icon: Monitor,
      tag: 'Modern Learning'
    }
  ];

  // 4. ERP Core Modules
  const erpModules = [
    {
      name: 'Academic Management',
      desc: 'Curriculum structure, department allocation, lecture timetables, and semester course catalogs.',
      path: '/courses',
      icon: GraduationCap
    },
    {
      name: 'Student Self-Service',
      desc: 'Academic profiles, period attendance records, internal test marks, and digital hall tickets.',
      path: '/student',
      icon: Users
    },
    {
      name: 'Faculty Workplace',
      desc: 'Daily attendance marking, syllabus progression tracker, grade entry, and leave applications.',
      path: '/faculty',
      icon: UserCheck
    },
    {
      name: 'Finance & Accounts',
      desc: 'Tuition fee plans, online payment gateway, digital receipts, and institutional ledger audits.',
      path: '/fees',
      icon: Coins
    },
    {
      name: 'Library Management',
      desc: 'Accessioning, catalog search, barcode checkouts, book reservations, and overdue fine ledgers.',
      path: '/library',
      icon: BookOpen
    },
    {
      name: 'Transport Management',
      desc: 'Bus routes, pickup stops, vehicle allocations, driver details, and student seat passes.',
      path: '/transport',
      icon: Bus
    },
    {
      name: 'Hostel Management',
      desc: 'Hostel blocks, room allocations, occupancy registers, warden contact, and meal plans.',
      path: '/hostel',
      icon: BedDouble
    },
    {
      name: 'Executive Reports & Analytics',
      desc: 'Accreditation audits, student risk analytics, council approvals, and statistical exports.',
      path: '/reports',
      icon: BarChart3
    }
  ];

  // 5. How It Works - 4 Steps
  const workflowSteps = [
    {
      step: '01',
      title: 'Login / Select Role',
      desc: 'Authenticate through the secure portal gateway and select your institutional designation.',
      icon: Lock
    },
    {
      step: '02',
      title: 'Access Modules',
      desc: 'Navigate role-specific modules seamlessly from the responsive dark forest-green workspace sidebar.',
      icon: Layers
    },
    {
      step: '03',
      title: 'Manage Operations',
      desc: 'Record period attendance, publish exam timetables, issue books, and process verified fee payments.',
      icon: Activity
    },
    {
      step: '04',
      title: 'Track & Grow',
      desc: 'Gain real-time institutional intelligence, resolve at-risk student flags, and meet compliance benchmarks.',
      icon: Target
    }
  ];

  // 6. Accordions
  const accordionsData = [
    {
      id: 'about-erp',
      title: 'About College ERP System',
      content:
        'The College ERP System is a comprehensive, production-grade enterprise platform engineered for higher educational institutions. Built with modern React, Vite, Node.js, Express, and MongoDB, it consolidates academic governance, student self-service, faculty registers, and financial auditing into a single zero-latency unified system.'
    },
    {
      id: 'benefits',
      title: 'Institutional Benefits & Operational Efficiency',
      content:
        'Eliminates paper-based logs, prevents duplicate data entry across departments, accelerates administrative workflow approvals by 85%, and ensures 100% transparency for students, faculty, and executive management through live synchronization.'
    },
    {
      id: 'supported-roles',
      title: 'Supported Roles & Strict Access Control',
      content:
        'Supports 8 distinct institutional personas: Super Admin, Principal, HOD, Faculty, Student, Accounts, Librarian, and Library Staff. Access is enforced both on frontend protected routes and independently verified on backend API endpoints with JWT credentials.'
    },
    {
      id: 'security-privacy',
      title: 'Security, Privacy & Data Integrity',
      content:
        'Protected by industry-standard bcrypt password hashing (10 salt rounds), secure stateless JSON Web Tokens (JWT), rate limiting, Helmet security headers, CORS origin protection, and immutable cryptographic action audit logs.'
    },
    {
      id: 'system-requirements',
      title: 'System Requirements & Browser Compatibility',
      content:
        'Zero client installation required. The modern responsive web UI works seamlessly on Chrome, Edge, Firefox, Safari, and all mobile and tablet browsers across desktop and mobile devices.'
    },
    {
      id: 'deployment-support',
      title: 'Deployment, Health Telemetry & 24/7 Support',
      content:
        'Container-ready modular architecture with built-in database health diagnostics, automatic reconnect fallbacks, and comprehensive administrative helpdesk utilities.'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* =========================================================================
          1. TOP NAVBAR
      ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
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
          <nav className="hidden lg:flex items-center space-x-7 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <a href="#home" className="text-emerald-600 font-black border-b-2 border-emerald-600 pb-1">
              Home
            </a>
            <a href="#roles" className="hover:text-emerald-600 transition-colors">
              Roles
            </a>
            <a href="#about" className="hover:text-emerald-600 transition-colors">
              About
            </a>
            <a href="#departments" className="hover:text-emerald-600 transition-colors">
              Departments
            </a>
            <a href="#facilities" className="hover:text-emerald-600 transition-colors">
              Facilities
            </a>
            <a href="#modules" className="hover:text-emerald-600 transition-colors">
              Modules
            </a>
            <a href="#workflow" className="hover:text-emerald-600 transition-colors">
              How It Works
            </a>
            <a href="#info" className="hover:text-emerald-600 transition-colors">
              FAQ
            </a>
            <a href="#contact" className="hover:text-emerald-600 transition-colors">
              Contact
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-3">
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

      {/* =========================================================================
          2. HERO SECTION
      ========================================================================= */}
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
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm border border-slate-300 shadow-2xs transition-all hover:scale-102 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-800" /> Watch Demo
                </button>
              </div>

              {/* Trust Indicators */}
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

            {/* Right: One attractive engineering college campus photograph */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 bg-emerald-950/5 group">
                <img
                  src="/campus-building.jpg"
                  alt="Apex Engineering College Main Academic Campus"
                  className="w-full h-[320px] sm:h-[400px] object-cover object-center transform group-hover:scale-102 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent pointer-events-none" />

                {/* Campus Badge Overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-lg flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 leading-tight">Apex Engineering College (Autonomous)</h4>
                      <p className="text-[11px] text-slate-500 font-medium">NAAC Grade 'A+' Accredited &bull; 68 Academic Programs</p>
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

      {/* =========================================================================
          3. INSTITUTIONAL ROLES (8 Roles)
      ========================================================================= */}
      <section id="roles" className="py-16 sm:py-20 bg-slate-50/70 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Role-Based Authentication
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Access Your Institutional Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Choose your authorized institutional role to proceed to your dedicated dashboard.
            </p>
          </div>

          {/* 8 Colorful Role Cards Grid */}
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

          {/* 4 Feature Pillars */}
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

      {/* =========================================================================
          4. STATISTICS RIBBON
      ========================================================================= */}
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

      {/* =========================================================================
          5. ABOUT OUR COLLEGE
      ========================================================================= */}
      <section id="about" className="py-16 sm:py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>Established 2001 &bull; 25 Years of Academic Brilliance</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                About Apex Engineering College
              </h2>

              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Apex Engineering College is an autonomous premier institution committed to nurturing visionary engineers, innovators, and leaders. Approved by AICTE, affiliated with Jawaharlal Nehru Technological University (JNTU), and accredited with Grade ‘A+’ by NAAC, the college fosters an environment where cutting-edge technology meets human-centric values.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#f8faf9] border border-slate-200/80 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-emerald-800">
                    <Target className="w-4 h-4 text-emerald-600" /> Our Vision
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    To be a globally renowned center of engineering excellence, high-impact research, and ethical innovation that drives sustainable societal progress.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#f8faf9] border border-slate-200/80 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-emerald-800">
                    <Compass className="w-4 h-4 text-emerald-600" /> Our Mission
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Delivering industry-aligned technical education, empowering interdisciplinary exploration, and cultivating leadership through modern pedagogical practices.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>NAAC Grade 'A+' Accreditation with top CGPA score</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>NBA Tier-1 Accredited Undergraduate Programs</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Outcome-Based Education (OBE) & CBCS Curriculum Framework</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="p-6 rounded-3xl bg-emerald-50/80 border border-emerald-100 text-center space-y-2 hover-card-elevate">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-900 block">6,482+</span>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Enrolled Students</span>
                  <p className="text-[11px] text-slate-500">Across Undergrad, Postgrad & Doctoral</p>
                </div>

                <div className="p-6 rounded-3xl bg-sky-50/80 border border-sky-100 text-center space-y-2 hover-card-elevate">
                  <span className="text-3xl sm:text-4xl font-black text-sky-900 block">421+</span>
                  <span className="text-xs font-bold text-sky-700 uppercase tracking-wider block">Faculty Members</span>
                  <p className="text-[11px] text-slate-500">80% PhD Holders & Industry Mentors</p>
                </div>
              </div>

              <div className="space-y-4 pt-6">
                <div className="p-6 rounded-3xl bg-amber-50/80 border border-amber-100 text-center space-y-2 hover-card-elevate">
                  <span className="text-3xl sm:text-4xl font-black text-amber-900 block">94%</span>
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Graduation Pass Rate</span>
                  <p className="text-[11px] text-slate-500">Rigorous Academic Evaluation</p>
                </div>

                <div className="p-6 rounded-3xl bg-purple-50/80 border border-purple-100 text-center space-y-2 hover-card-elevate">
                  <span className="text-3xl sm:text-4xl font-black text-purple-900 block">120+</span>
                  <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">Top Recruiters</span>
                  <p className="text-[11px] text-slate-500">Campus Placement Partnerships</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. ACADEMIC DEPARTMENTS
      ========================================================================= */}
      <section id="departments" className="py-16 sm:py-24 bg-slate-50/80 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                Verified Institutional Data
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Academic Departments
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Explore our accredited engineering disciplines, programs, and departmental facilities.
              </p>
            </div>

            <Link
              to="/departments"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              Browse All Departments <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departmentsList.map((dept) => {
              const Icon = dept.icon;
              return (
                <div
                  key={dept.code}
                  className={`p-6 rounded-3xl border shadow-2xs hover-card-elevate transition-all flex flex-col justify-between space-y-5 ${dept.color}`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-black text-xs">
                        {dept.code}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {dept.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        Intake: <strong className="text-slate-700">{dept.intake}</strong> &bull; {dept.programs}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Key Focus</span>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {dept.specializations}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      to="/departments"
                      className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold transition-all border border-slate-200"
                    >
                      <span>View Department</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. CAMPUS FACILITIES
      ========================================================================= */}
      <section id="facilities" className="py-16 sm:py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              World-Class Infrastructure
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Campus Facilities & Amenities
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              State-of-the-art academic laboratories, research centers, athletic arenas, and student living.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {campusFacilities.map((fac, idx) => {
              const Icon = fac.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-3xl bg-[#f8faf9] border border-slate-200/80 shadow-2xs hover-card-elevate transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-white text-emerald-700 flex items-center justify-center shadow-xs border border-slate-200/60">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800">
                        {fac.tag}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{fac.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                      {fac.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. ERP FEATURES & MODULES
      ========================================================================= */}
      <section id="modules" className="py-16 sm:py-24 bg-slate-50/70 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              Integrated Subsystems
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Features & Operational Modules
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Seamlessly connected modules powering everyday academic administration and student workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {erpModules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={idx}
                  to={mod.path}
                  className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs hover-card-elevate transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {mod.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                      {mod.desc}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                    <span>Open Module</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. HOW IT WORKS (4 Steps)
      ========================================================================= */}
      <section id="workflow" className="py-16 sm:py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              Streamlined Operations
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              How the College ERP Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Four intuitive steps from single sign-on to enterprise institutional intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {workflowSteps.map((wf) => {
              const Icon = wf.icon;
              return (
                <div
                  key={wf.step}
                  className="p-6 rounded-3xl bg-[#f8faf9] border border-slate-200/80 shadow-2xs relative flex flex-col justify-between space-y-4 hover-card-elevate transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-white text-emerald-700 flex items-center justify-center font-bold shadow-xs border border-slate-200/60">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-2xl font-black text-slate-300">
                        {wf.step}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{wf.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                      {wf.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          10. PLACEMENTS & STUDENT CAREER DEVELOPMENT
      ========================================================================= */}
      <section className="py-16 sm:py-24 bg-[#062a1e] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider">
                <Briefcase className="w-3.5 h-3.5" /> Corporate Relations Directorate
              </div>

              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Placements & Student Development
              </h2>

              <p className="text-sm text-emerald-100/80 leading-relaxed font-light">
                Our active Corporate Relations Cell bridges academic theory and real-world tech industry challenges through intensive placement bootcamps, paid internships, industry MoUs, and continuous career mentorship.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/60">
                  <span className="text-2xl font-black text-emerald-400 block">94.2%</span>
                  <span className="text-xs font-bold text-white block mt-0.5">Placement Record</span>
                  <p className="text-[11px] text-emerald-300/70 mt-1">2025-26 Graduating Cohort</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/60">
                  <span className="text-2xl font-black text-emerald-400 block">₹ 44 LPA</span>
                  <span className="text-xs font-bold text-white block mt-0.5">Highest Package</span>
                  <p className="text-[11px] text-emerald-300/70 mt-1">International Tech Giant</p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/placements"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all hover:scale-102"
                >
                  Explore Placement Cell <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-3.5">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Full-Stack Coding & Aptitude Bootcamps</h4>
                  <p className="text-[11px] text-emerald-200/70 mt-0.5 leading-snug">
                    Over 200+ hours of dedicated algorithmic training, mock code challenges, and system design interviews.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Global Industry Partnerships & MoUs</h4>
                  <p className="text-[11px] text-emerald-200/70 mt-0.5 leading-snug">
                    Formal collaborations with top tech leaders for semester-long paid internships and capstone live projects.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Technical Clubs & Hackathons</h4>
                  <p className="text-[11px] text-emerald-200/70 mt-0.5 leading-snug">
                    Active ACM, IEEE, Robotics, and Web3 clubs hosting national 36-hour hackathons and hands-on workshops.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Career Guidance & Higher Studies</h4>
                  <p className="text-[11px] text-emerald-200/70 mt-0.5 leading-snug">
                    Specialized guidance cells for GATE, GRE, CAT, and overseas university admissions with alumni mentors.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          11. INFORMATION & EXPANDABLE ACCORDIONS
      ========================================================================= */}
      <section id="info" className="py-16 sm:py-24 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
              Comprehensive Insights
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Information & Highlights
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Everything you need to know about the College ERP platform, architecture, and security protocols.
            </p>
          </div>

          <div className="space-y-3">
            {accordionsData.map((item) => {
              const isOpen = openAccordion === item.id;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(item.id)}
                    className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <span>{item.title}</span>
                    <span className="p-1 rounded-full bg-slate-100 text-slate-600">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-fade-in font-normal">
                      {item.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Highlights Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 space-y-1">
              <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Real-Time Notifications
              </h4>
              <p className="text-[11px] text-emerald-800/80">
                Instantly broadcast circulars, examination deadlines, and payment dues across campus.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/70 space-y-1">
              <h4 className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-sky-600" /> Role-Based Privacy
              </h4>
              <p className="text-[11px] text-sky-800/80">
                Strict RBAC guarantees users only access data permitted by their institutional designation.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/70 space-y-1">
              <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-purple-600" /> Idempotent Transactions
              </h4>
              <p className="text-[11px] text-purple-800/80">
                Verified payment reconciliation prevents double billing and ensures 100% financial audit compliance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          12. INSTITUTIONAL FOOTER
      ========================================================================= */}
      <footer id="contact" className="bg-[#041a13] text-emerald-100/70 py-14 border-t border-emerald-950 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-white font-black text-base">
              <GraduationCap className="w-5 h-5 text-emerald-400" />
              <span>Apex Engineering College</span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-200/60 font-light">
              Autonomous Technical Institution approved by AICTE, affiliated with JNTU, and accredited with Grade ‘A+’ by NAAC. Dedicated to technological excellence, transparency, and holistic education.
            </p>
            <div className="pt-2 text-[11px] text-emerald-300 font-mono">
              Estd: 2001 &bull; Code: APEX-075
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">Academic Departments</h4>
            <ul className="space-y-2 text-[11px]">
              <li><Link to="/departments" className="hover:text-white transition-colors">Computer Science & Engineering</Link></li>
              <li><Link to="/departments" className="hover:text-white transition-colors">Artificial Intelligence & DS</Link></li>
              <li><Link to="/departments" className="hover:text-white transition-colors">Information Technology</Link></li>
              <li><Link to="/departments" className="hover:text-white transition-colors">Electronics & Communication</Link></li>
              <li><Link to="/departments" className="hover:text-white transition-colors">Electrical & Electronics</Link></li>
              <li><Link to="/departments" className="hover:text-white transition-colors">Mechanical & Civil Engineering</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">Campus Modules</h4>
            <ul className="space-y-2 text-[11px]">
              <li><Link to="/courses" className="hover:text-white transition-colors">Curriculum & Syllabi</Link></li>
              <li><Link to="/attendance" className="hover:text-white transition-colors">Daily Period Attendance</Link></li>
              <li><Link to="/examinations" className="hover:text-white transition-colors">Examinations & Schedules</Link></li>
              <li><Link to="/fees" className="hover:text-white transition-colors">Digital Fee Management</Link></li>
              <li><Link to="/library" className="hover:text-white transition-colors">Central Library Catalog</Link></li>
              <li><Link to="/transport" className="hover:text-white transition-colors">Transport & Bus Passes</Link></li>
              <li><Link to="/hostel" className="hover:text-white transition-colors">Hostel Room Allotments</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">College Information</h4>
            <div className="space-y-2.5 text-[11px]">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Campus Road, Tech Valley, Hyderabad, Telangana – 500075</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+91 (800) 234-5678 / +91 (040) 2899-1234</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>registrar@college.edu / info@college.edu</span>
              </p>
              <p className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>https://college.edu</span>
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between text-[11px]">
          <p>&copy; 2026 Apex Engineering College ERP System. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 text-emerald-400/80">Affiliated with JNTU &bull; AICTE Approved &bull; NAAC 'A+'</p>
        </div>
      </footer>

      {/* =========================================================================
          DEMO MODAL
      ========================================================================= */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" /> College ERP Platform Walkthrough
              </h3>
              <button
                onClick={() => setIsDemoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
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
              <p className="leading-relaxed">
                The College ERP System connects directly to the institutional MongoDB cluster, providing real-time academic tracking, automated digital fee payments, weekly class schedules, library circulation desk, and executive pass percentages.
              </p>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsDemoModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
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
