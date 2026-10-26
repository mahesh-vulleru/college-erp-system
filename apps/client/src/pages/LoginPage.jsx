import React, { useState } from 'react';
import { GraduationCap, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Notification from '../components/common/Notification';

export const LoginPage = ({ onLoginSuccess, onCancel }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both your registered email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            College ERP Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Secure Role-Based Authentication Gateway
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-gray-100">
          {error && (
            <Notification
              type="error"
              message={error}
              onClose={() => setError('')}
              className="mb-5"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Institutional Email"
              id="email"
              name="email"
              type="email"
              required
              placeholder="e.g. principal@college.edu or student123@college.edu"
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

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Passcode encrypted on transit</span>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="font-semibold text-blue-600 hover:text-blue-800"
                >
                  Return to Dashboard
                </button>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full shadow-md"
            >
              <span>Sign In to College ERP</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          {/* Real Backend Notice & Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-[11px] text-gray-500 space-y-2">
            <div className="flex items-center space-x-1.5 text-slate-700 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Strict Security Notice:</span>
            </div>
            <p className="leading-relaxed">
              Authentication requests are validated directly against MongoDB via <code>/api/v1/auth/login</code>. Roles are assigned and verified server-side.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
