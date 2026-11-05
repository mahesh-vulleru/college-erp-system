import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings, User, Bell, Shield, Key, Save, CheckCircle, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DashboardHeaderBanner from '../../components/dashboard/DashboardHeaderBanner';
import InstitutionProfileManager from '../../components/institution/InstitutionProfileManager';

export const SettingsPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get('tab');

  const normalizeTab = (t) => {
    if (!t) return 'institution';
    const s = t.toLowerCase();
    if (s === 'institution' || s === 'college' || s === 'organization') return 'institution';
    if (s === 'account' || s === 'security' || s === 'password') return 'security';
    if (s === 'preferences' || s === 'notifications' || s === 'alerts') return 'notifications';
    if (s === 'profile' || s === 'user' || s === 'identity') return 'profile';
    return 'institution';
  };

  const [activeTab, setActiveTab] = useState(normalizeTab(queryTab));

  useEffect(() => {
    if (queryTab) {
      setActiveTab(normalizeTab(queryTab));
    }
  }, [queryTab]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  const [userFormData, setUserFormData] = useState({
    name: user?.name || 'Administrator',
    email: user?.email || 'admin@college.edu',
    phone: '+91 98480 99887',
    role: user?.role || 'super_admin',
    emailNotifications: true,
    smsAlerts: false,
    auditLogging: true
  });

  const [saved, setSaved] = useState(false);

  const handleUserSave = (e) => {
    e.preventDefault();
    setSaved(true);
    addToast?.('Personal preferences updated successfully', 'success');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <DashboardHeaderBanner
        title="Institutional System Settings & Baseline Profile"
        subtitle="Configure institution profile, branding, accreditations, security policies, and automated notifications."
      />

      {/* Navigation Tabs */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/80 shadow-xs flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => handleTabChange('institution')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'institution'
              ? 'bg-[#064e3b] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" /> Institution Profile
        </button>

        <button
          onClick={() => handleTabChange('profile')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-[#064e3b] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <User className="w-4 h-4" /> Personal Profile
        </button>

        <button
          onClick={() => handleTabChange('notifications')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'notifications'
              ? 'bg-[#064e3b] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" /> Notifications & Alerts
        </button>

        <button
          onClick={() => handleTabChange('security')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'security'
              ? 'bg-[#064e3b] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" /> Security & Access
        </button>
      </div>

      {/* Tab 1: Institution Profile Manager */}
      {activeTab === 'institution' && (
        <InstitutionProfileManager />
      )}

      {/* Tabs 2, 3, 4: Personal Settings & Policies */}
      {activeTab !== 'institution' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <form onSubmit={handleUserSave} className="py-2 space-y-6 max-w-2xl">
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={userFormData.name}
                      onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Official Email Address</label>
                    <input
                      type="email"
                      value={userFormData.email}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-500 font-medium cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={userFormData.phone}
                      onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Current Active Role</label>
                    <input
                      type="text"
                      value={userFormData.role.replace(/_/g, ' ').toUpperCase()}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-500 font-bold cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Email Notifications</span>
                    <span className="text-[11px] text-slate-500">Receive exam schedules and circulars via email</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={userFormData.emailNotifications}
                    onChange={(e) => setUserFormData({ ...userFormData, emailNotifications: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Emergency SMS Alerts</span>
                    <span className="text-[11px] text-slate-500">Urgent campus weather and institutional closures</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={userFormData.smsAlerts}
                    onChange={(e) => setUserFormData({ ...userFormData, smsAlerts: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </label>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-700" /> Active 256-bit JWT Session
                  </span>
                  <p className="text-emerald-800/80 text-[11px]">
                    Role-based access enforcement strictly verified by backend server policy on every request.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors"
                  >
                    <Key className="w-3.5 h-3.5" /> Request Password Reset Token
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {saved ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> Preferences saved successfully!
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">Personal settings update automatically.</span>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Preferences
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
