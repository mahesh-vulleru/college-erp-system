import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  CalendarCheck,
  Award,
  CreditCard,
  Building2,
  Users,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  Layers
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Admissions Inquiry',
    message: ''
  });

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    if (!inquiryForm.name || !inquiryForm.email) return;
    setInquirySubmitted(true);
    setTimeout(() => {
      setInquiryForm({ name: '', email: '', phone: '', subject: 'Admissions Inquiry', message: '' });
      setInquirySubmitted(false);
    }, 5000);
  };

  const getRoleDashboard = (role) => {
    const normalized = (role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
    if (normalized === 'admin' || normalized === 'super_admin' || normalized === 'superadmin' || normalized === 'super_administrator') {
      return '/admin';
    }
    switch (role) {
      case 'super_admin': return '/admin';
      case 'principal': return '/principal';
      case 'hod': return '/hod';
      case 'faculty': return '/faculty';
      case 'student': return '/student';
      case 'accounts': return '/accounts';
      default: return '/login';
    }
  };

  const departments = [
    {
      code: 'CSE',
      name: 'Computer Science & Engineering',
      intake: 120,
      description: 'Specializations in Artificial Intelligence, Distributed Systems, Cloud Computing, and Cyber Security.',
      icon: BookOpen
    },
    {
      code: 'ECE',
      name: 'Electronics & Communication Engineering',
      intake: 90,
      description: 'Embedded Systems, VLSI Design, Digital Signal Processing, and IoT Hardware Architectures.',
      icon: Layers
    },
    {
      code: 'EEE',
      name: 'Electrical & Electronics Engineering',
      intake: 60,
      description: 'Renewable Power Systems, Smart Grids, Electric Vehicle Drives, and Control Automations.',
      icon: Sparkles
    },
    {
      code: 'ME',
      name: 'Mechanical Engineering',
      intake: 60,
      description: 'Thermodynamics, CAD/CAM Modeling, Robotics, Computational Fluid Dynamics, and Additive Manufacturing.',
      icon: Building2
    },
    {
      code: 'CE',
      name: 'Civil Engineering',
      intake: 60,
      description: 'Structural Analysis, Geotechnical Engineering, Smart Urban Infrastructure, and Environmental Systems.',
      icon: Building2
    },
    {
      code: 'IT',
      name: 'Information Technology',
      intake: 60,
      description: 'Enterprise Web Architectures, Database Management, Mobile Applications, and Data Engineering.',
      icon: BookOpen
    }
  ];

  const erpCapabilities = [
    {
      title: 'Academic Lifecycle Governance',
      desc: 'Centralized semester curriculum management, credit calculations, and course syllabus distribution across all 8 terms.',
      icon: BookOpen
    },
    {
      title: 'Real-Time Period Attendance',
      desc: 'Digital class registers recorded per session, automated 75% regulatory compliance tracking, and condonation monitoring.',
      icon: CalendarCheck
    },
    {
      title: 'Continuous Evaluation & Grading',
      desc: 'Internal mid-term test marks recording, practical lab evaluation, and automated semester grade card calculations.',
      icon: Award
    },
    {
      title: 'Transparent Institutional Accounts',
      desc: 'Itemized semester tuition fee structures, instantaneous digital receipt generation, and real-time dues reconciliation.',
      icon: CreditCard
    },
    {
      title: 'Role-Based Access Security',
      desc: 'Strict server-enforced boundaries separating Super Admin, Principal, Department Heads, Faculty, Students, and Accounts.',
      icon: ShieldCheck
    },
    {
      title: 'Campus Circulars & Notice Broadcasts',
      desc: 'Official institutional announcements, emergency notifications, and exam schedules targeted directly by audience role.',
      icon: Users
    }
  ];

  return (
    <div className="min-h-screen bg-warm-50 text-navy-950 font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* 1. Institutional Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-navy-100 shadow-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Name */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-2xl bg-navy-900 text-teal-400 flex items-center justify-center shadow-subtle group-hover:bg-navy-950 transition-colors">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-navy-950 block leading-tight">
                Apex Engineering College
              </span>
              <span className="text-[11px] text-teal-700 font-semibold uppercase tracking-wider block">
                Autonomous Technical Institution
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold uppercase tracking-wider text-navy-700">
            <a href="#about" className="hover:text-teal-700 transition-colors">About</a>
            <a href="#features" className="hover:text-teal-700 transition-colors">ERP Features</a>
            <a href="#academics" className="hover:text-teal-700 transition-colors">Academic Programs</a>
            <a href="#contact" className="hover:text-teal-700 transition-colors">Contact</a>
          </nav>

          {/* Prominent Action Button */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <Button
                variant="teal"
                size="sm"
                onClick={() => navigate(getRoleDashboard(user?.role))}
                icon={ArrowRight}
                iconPosition="right"
              >
                Go to Portal ({user?.role?.replace(/_/g, ' ')})
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/login?role=super_admin')}
                  icon={ShieldCheck}
                >
                  Admin Portal
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/login')}
                  icon={ArrowRight}
                  className="shadow-subtle"
                >
                  Portal Login
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Campus Hero Section */}
      <section className="relative bg-gradient-to-br from-navy-950 via-navy-900 to-teal-950 text-white overflow-hidden py-20 lg:py-28">
        {/* Subtle decorative architectural blur accents */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-navy-700/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-5 border border-teal-500/30">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Accredited Engineering Excellence &bull; Est. 1998</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Shaping Tomorrow's Engineers with Innovation & Academic Rigor
            </h1>

            <p className="mt-5 text-sm sm:text-base lg:text-lg text-navy-200 font-light leading-relaxed">
              Apex Engineering College is an autonomous undergraduate institution dedicated to world-class engineering education, outcome-based curricula, and transparent digital academic management.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Button
                variant="teal"
                size="lg"
                onClick={() => navigate('/login')}
                icon={ArrowRight}
                iconPosition="right"
                className="shadow-elevation text-sm font-bold"
              >
                Access Institutional ERP Portal
              </Button>

              <a
                href="#academics"
                className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all text-center"
              >
                Explore Academic Programs
              </a>
            </div>
          </div>

          {/* Quick Institutional Highlights Strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-navy-800">
            <div>
              <span className="text-2xl sm:text-3xl font-extrabold text-teal-400 block">6</span>
              <span className="text-xs text-navy-300 font-medium block mt-1">Accredited B.Tech Disciplines</span>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-extrabold text-teal-400 block">&lt;1,000</span>
              <span className="text-xs text-navy-300 font-medium block mt-1">Focused Campus Cohort</span>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-extrabold text-teal-400 block">1 : 13</span>
              <span className="text-xs text-navy-300 font-medium block mt-1">Faculty-Student Mentorship</span>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-extrabold text-teal-400 block">95%+</span>
              <span className="text-xs text-navy-300 font-medium block mt-1">Graduation & Placement Track</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. About Section */}
      <section id="about" className="py-20 bg-white border-b border-navy-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="teal" size="sm" className="mb-3">About Apex Engineering College</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
              A Legacy of Technical Distinction
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-navy-600 font-light leading-relaxed">
              Founded on the belief that engineering education must blend fundamental sciences with hands-on laboratory rigor, Apex Engineering College provides an immersive learning ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-warm-50 border border-navy-100 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4 border border-teal-200">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-navy-950 mb-2">Outcome-Based Curriculum</h3>
                <p className="text-xs sm:text-sm text-navy-600 font-light leading-relaxed">
                  Regularly updated course syllabi aligned with industrial demands, autonomous examination flexibility, and project-based laboratory components.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-navy-100 text-xs font-semibold text-teal-800">
                Continuous Evaluation Framework &rarr;
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-warm-50 border border-navy-100 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-navy-50 text-navy-800 flex items-center justify-center mb-4 border border-navy-200">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-navy-950 mb-2">Modern Laboratory Facilities</h3>
                <p className="text-xs sm:text-sm text-navy-600 font-light leading-relaxed">
                  Specialized research laboratories including Cloud Clusters, High-Performance Computing, VLSI Design, Robotics, and Advanced Materials testing.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-navy-100 text-xs font-semibold text-navy-800">
                Industry-Grade Toolchains &rarr;
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-warm-50 border border-navy-100 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4 border border-teal-200">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-navy-950 mb-2">Student-Centric Governance</h3>
                <p className="text-xs sm:text-sm text-navy-600 font-light leading-relaxed">
                  A transparent digital governance model where students and faculty seamlessly track attendance, results, circulars, and fee settlements without paperwork.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-navy-100 text-xs font-semibold text-teal-800">
                Zero Bureaucracy Digital Campus &rarr;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ERP Capabilities & Features Section */}
      <section id="features" className="py-20 bg-warm-50 border-b border-navy-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="neutral" size="sm" className="mb-3">Campus ERP Architecture</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
              Enterprise Academic Management System
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-navy-600 font-light leading-relaxed">
              Our unified ERP streamlines operational workflows across student admissions, lecture attendance, grading, fee ledgers, and governance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {erpCapabilities.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-2xl border border-navy-200/80 shadow-subtle hover:shadow-card transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4 border border-teal-200">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-navy-950 mb-2">{feat.title}</h3>
                  <p className="text-xs text-navy-600 font-light leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Dedicated Login CTA banner inside features */}
          <div className="mt-14 p-8 rounded-2xl bg-navy-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-elevation">
            <div>
              <h3 className="text-lg sm:text-xl font-bold">Authorized Institutional Access</h3>
              <p className="text-xs sm:text-sm text-navy-300 font-light mt-1">
                Faculty, students, and administrators can sign in directly using their institutional account.
              </p>
            </div>
            <Button
              variant="teal"
              size="md"
              onClick={() => navigate('/login')}
              icon={ArrowRight}
              iconPosition="right"
              className="flex-shrink-0"
            >
              Sign In to Your Account
            </Button>
          </div>
        </div>
      </section>

      {/* 5. Academic Services & Programs Section */}
      <section id="academics" className="py-20 bg-white border-b border-navy-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="teal" size="sm" className="mb-3">Curriculum Catalog</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
              Undergraduate Engineering Disciplines
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-navy-600 font-light leading-relaxed">
              Four-year Bachelor of Technology (B.Tech) degree programs designed to provide rigorous mathematical foundations and experiential application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => (
              <div
                key={dept.code}
                className="p-6 rounded-2xl bg-warm-50 border border-navy-200/80 shadow-subtle hover:border-teal-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-100/70 px-2.5 py-0.5 rounded-full border border-teal-200">
                      {dept.code}
                    </span>
                    <span className="text-[11px] text-navy-400 font-medium">
                      Intake: {dept.intake} seats
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-navy-950 mb-2">{dept.name}</h3>
                  <p className="text-xs text-navy-600 font-light leading-relaxed">{dept.description}</p>
                </div>
                <div className="mt-5 pt-4 border-t border-navy-100 flex items-center justify-between text-xs">
                  <span className="text-navy-500 font-medium">8 Semesters &bull; 160 Credits</span>
                  <span className="font-semibold text-teal-700">Full-Time B.Tech</span>
                </div>
              </div>
            ))}
          </div>

          {/* Academic Services Support Grid */}
          <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-teal-50/60 border border-teal-200">
            <h3 className="text-base font-bold text-navy-950 mb-4 text-center sm:text-left">
              Student Academic Support Infrastructure
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-navy-700 font-light">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-navy-900 block">Digital Central Library</strong>
                  <span>Access to over 50,000 volumes, IEEE Xplore, ScienceDirect, and high-speed research terminals.</span>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-navy-900 block">Training & Placement Cell</strong>
                  <span>Comprehensive technical interview coaching, algorithmic problem solving, and corporate recruitment drives.</span>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-navy-900 block">Autonomous Examination Cell</strong>
                  <span>Prompt continuous assessment scheduling, barcode-evaluated grading, and verified institutional transcripts.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Contact Section */}
      <section id="contact" className="py-20 bg-warm-50 border-b border-navy-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="neutral" size="sm" className="mb-3">Connect With Us</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
              Campus Inquiries & Administration
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-navy-600 font-light leading-relaxed">
              Have questions regarding admissions, academic regulations, or campus facilities? Reach out to our administrative offices.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Contact Details */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white border border-navy-200/80 shadow-subtle flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0 border border-teal-200">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-navy-950">Campus Location</h4>
                  <p className="text-xs text-navy-600 font-light mt-1 leading-relaxed">
                    Apex Engineering College Campus, Knowledge Corridor, Tech Institutional Zone, Landmark Highway, PIN: 500081
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-navy-200/80 shadow-subtle flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0 border border-teal-200">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-navy-950">Telephone & Inquiries</h4>
                  <p className="text-xs text-navy-600 font-light mt-1">
                    Admissions Desk: +91 (0) 40 2345 6789 &bull; Academic Registrar: +91 (0) 40 2345 6790
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-navy-200/80 shadow-subtle flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0 border border-teal-200">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-navy-950">Official Email Inquiries</h4>
                  <p className="text-xs text-navy-600 font-light mt-1">
                    General Inquiries: info@college.edu &bull; Admissions: admissions@college.edu
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-navy-200/80 shadow-subtle flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0 border border-teal-200">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-navy-950">Administrative Working Hours</h4>
                  <p className="text-xs text-navy-600 font-light mt-1">
                    Monday to Saturday: 8:30 AM to 5:00 PM (Closed on Government Gazetted Holidays)
                  </p>
                </div>
              </div>
            </div>

            {/* Public Inquiry Form */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-navy-200/80 shadow-subtle">
              <h3 className="text-base font-bold text-navy-950 mb-1">Submit an Inquiry</h3>
              <p className="text-xs text-navy-500 font-light mb-6">
                Our academic council desk responds to institutional inquiries within 24 business hours.
              </p>

              {inquirySubmitted ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <strong className="block font-semibold">Thank you for contacting us!</strong>
                    <span>Your inquiry has been logged. Our admissions desk will follow up shortly.</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                      placeholder="e.g. Ramesh Chandra"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-navy-200 bg-warm-50 text-navy-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={inquiryForm.email}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                        placeholder="you@domain.com"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-navy-200 bg-warm-50 text-navy-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={inquiryForm.phone}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-navy-200 bg-warm-50 text-navy-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1">
                      Inquiry Category
                    </label>
                    <select
                      value={inquiryForm.subject}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, subject: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-navy-200 bg-warm-50 text-navy-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition-colors"
                    >
                      <option value="Admissions Inquiry">Admissions & Intake Information</option>
                      <option value="Curriculum Syllabus">Academic Syllabus & Course Credits</option>
                      <option value="Campus Visit">Campus Tour & Laboratory Visitation</option>
                      <option value="General Query">General Administration Query</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1">
                      Message Details
                    </label>
                    <textarea
                      rows={3}
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                      placeholder="Please summarize your question or inquiry..."
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-navy-200 bg-warm-50 text-navy-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition-colors"
                    />
                  </div>

                  <Button type="submit" variant="teal" size="md" className="w-full shadow-subtle">
                    Send Campus Inquiry
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 7. Institutional Footer */}
      <footer className="bg-navy-950 text-navy-300 py-12 border-t border-navy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-subtle">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white block">Apex Engineering College</span>
              <span className="text-[10px] text-teal-400 block tracking-wider uppercase font-semibold">
                Autonomous Technical Institution &bull; &lt;1,000 Students
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-navy-400 font-medium">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#features" className="hover:text-white transition-colors">ERP Platform</a>
            <a href="#academics" className="hover:text-white transition-colors">Programs</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            <Link to="/login" className="text-teal-400 hover:text-teal-300 font-semibold transition-colors">
              Staff & Student Login &rarr;
            </Link>
          </div>

          <p className="text-[11px] text-navy-500 text-center md:text-right font-light">
            &copy; {new Date().getFullYear()} Apex Engineering College. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

