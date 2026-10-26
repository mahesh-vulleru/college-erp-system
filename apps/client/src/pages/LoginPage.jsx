import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  GraduationCap,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Notification from '../components/common/Notification';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  const demoAccounts = [
    { label: 'Super Admin', email: 'admin@college.edu', role: 'Full System Control' },
    { label: 'Principal', email: 'principal@college.edu', role: 'Academic Oversight' },
    { label: 'HOD (CSE)', email: 'hod.cse@college.edu', role: 'Department Head' },
    { label: 'Faculty', email: 'faculty.turing@college.edu', role: 'Attendance & Marks' },
    { label: 'Student', email: 'student.aarav@college.edu', role: 'Grades & Fees' },
    { label: 'Accounts', email: 'accounts@college.edu', role: 'Fee Ledger & Billing' }
  ];

  const handleDemoSelect = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both your registered institutional email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-navy-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-elevation shadow-teal-900/40">
              <GraduationCap className="w-8 h-8" />
            </div>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Apex Engineering College
          </h2>
          <p className="text-xs sm:text-sm text-navy-300 font-light">
            Institutional ERP &bull; Unified Authentication Gateway
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-white py-8 px-6 sm:px-10 shadow-elevation rounded-2xl border border-navy-100">
          {error && (
            <Notification
              type="error"
              message={error}
              onClose={() => setError('')}
              className="mb-5"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Institutional Email"
              id="email"
              name="email"
              type="email"
              required
              placeholder="e.g. principal@college.edu"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              required
              placeholder="Enter your confidential password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="teal"
                size="md"
                isLoading={isLoading}
                className="w-full shadow-subtle"
                icon={ArrowRight}
                iconPosition="right"
              >
                Sign In to College Account
              </Button>
            </div>
          </form>

          {/* Quick Demo Role Autofill Shortcuts for Rapid Testing */}
          <div className="mt-6 pt-5 border-t border-navy-100">
            <div className="flex items-center space-x-1.5 text-navy-700 font-semibold text-xs mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Instant Test Role Presets (Development):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {demoAccounts.map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDemoSelect(acc.email)}
                  className="px-2 py-1.5 rounded-lg bg-warm-100 hover:bg-teal-50 hover:text-teal-900 border border-navy-200/60 text-navy-700 text-[11px] font-medium transition-colors text-left"
                >
                  <span className="block font-semibold truncate">{acc.label}</span>
                  <span className="block text-[9px] text-navy-400 truncate">{acc.role}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-navy-400 italic">
              Default password for all demo seed fixtures: <code>Password123!</code>
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-navy-100 text-center">
            <Link to="/" className="text-xs text-navy-500 hover:text-navy-900 font-medium">
              &larr; Return to Institutional Hub (Guest View)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
