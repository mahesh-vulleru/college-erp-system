import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Award,
  ShieldCheck,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Edit3,
  Save,
  X,
  Upload,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  Sparkles,
  Lock,
  Layers,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/apiClient';
import { ROLES } from '@college-erp/shared';

const DEFAULT_PROFILE = {
  name: 'Apex Institute of Technology & Engineering',
  code: 'AITE-500032',
  establishedYear: 2008,
  tagline: 'Excellence in Engineering & Technological Innovation',
  institutionType: 'Autonomous Engineering College',
  logoUrl: '',
  address: {
    line1: 'Survey No. 45/2, Knowledge City Road',
    line2: 'Financial District, Gachibowli',
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500032',
    country: 'India'
  },
  contact: {
    email: 'registrar@apexengineering.edu',
    phone: '+91 40 2345 6789',
    emergencyPhone: '+91 98480 99887',
    website: 'https://www.apexengineering.edu'
  },
  affiliation: {
    university: 'Jawaharlal Nehru Technological University (JNTU)',
    approvalBody: 'All India Council for Technical Education (AICTE)',
    aicteApprovalNumber: 'AICTE-F-1-432891901/2024',
    ugcStatus: '2(f) & 12(B) Recognized',
    autonomousStatus: 'UGC Autonomous Status Conferred (2020-2030)'
  },
  accreditation: {
    naacGrade: 'A++',
    naacCgpa: '3.68 / 4.00',
    naacValidUntil: '2028-12-31',
    nbaStatus: 'Tier-1 Accredited (CSE, ECE, MECH, EEE)',
    nirfRankBand: 'Rank Band 101 - 150 (Engineering)'
  },
  targetStudentCapacity: 1000,
  currentAcademicYear: '2026 - 2027',
  activeSemesterTerm: 'Odd Semester (Sem 1, 3, 5, 7)'
};

export const InstitutionProfileManager = ({ onProfileUpdated }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  // Authorization check: Only Super Admin can edit
  const isAuthorizedToEdit =
    user?.role === ROLES.SUPER_ADMIN ||
    user?.role === 'admin' ||
    user?.role === 'superadmin' ||
    user?.role === 'super_administrator';

  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [formData, setFormData] = useState(DEFAULT_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // 1. Fetch live institution profile from MongoDB
  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res = await api.getInstitutionProfile();
      if (res?.data) {
        setProfile(res.data);
        setFormData(res.data);
        setLogoPreview(res.data.logoUrl || '');
        if (onProfileUpdated) onProfileUpdated(res.data);
      }
    } catch (err) {
      console.error('Failed to load institution profile:', err);
      // Fallback gracefully to default profile
      setProfile(DEFAULT_PROFILE);
      setFormData(DEFAULT_PROFILE);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // 2. Logo Upload Handlers
  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate mime type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      addToast?.('Please upload a valid image file (PNG, JPG, WEBP, or SVG).', 'error');
      return;
    }

    // Validate size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      addToast?.('College logo file size must not exceed 2 MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result;
      setLogoPreview(base64Data);
      setFormData((prev) => ({ ...prev, logoUrl: base64Data }));
      addToast?.('Logo uploaded and ready to save.', 'info');
    };
    reader.onerror = () => {
      addToast?.('Failed to read image file. Please try another file.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview('');
    setFormData((prev) => ({ ...prev, logoUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    addToast?.('Logo removed. Click Save Changes to apply.', 'info');
  };

  // 3. Validation
  const validateForm = () => {
    const errors = {};

    if (!formData.name?.trim()) {
      errors.name = 'College Name is required.';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'College Name must be at least 3 characters.';
    }

    if (!formData.code?.trim()) {
      errors.code = 'Institution Code is required.';
    }

    if (formData.contact?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contact.email.trim())) {
        errors.email = 'Please provide a valid official email address.';
      }
    }

    if (formData.contact?.website) {
      const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
      if (!urlRegex.test(formData.contact.website.trim())) {
        errors.website = 'Please provide a valid official website URL.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 4. Save & Update
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) {
      addToast?.('Please review the form for highlighted validation errors.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.updateInstitutionProfile(formData);
      if (res?.data) {
        setProfile(res.data);
        setFormData(res.data);
        setLogoPreview(res.data.logoUrl || '');
        setIsEditing(false);
        addToast?.('Institution profile successfully saved and persisted to MongoDB.', 'success');
        if (onProfileUpdated) onProfileUpdated(res.data);
      }
    } catch (err) {
      console.error('Error updating institution profile:', err);
      addToast?.(err.message || 'Failed to update institution profile in database.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setLogoPreview(profile.logoUrl || '');
    setFormErrors({});
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-slate-200/80 shadow-xs text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
        <p className="text-xs font-semibold text-slate-600">Loading institutional baseline profile from MongoDB...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Identity Overview */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 rounded-3xl p-6 md:p-8 text-white shadow-md border border-teal-900/40">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-6 w-48 h-48 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Logo Avatar or Monogram */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/10 backdrop-blur-md p-1.5 border border-white/20 shadow-inner flex items-center justify-center overflow-hidden flex-shrink-0">
              {profile.logoUrl ? (
                <img
                  src={profile.logoUrl}
                  alt={profile.name}
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-teal-200">
                  <Building2 className="w-9 h-9" />
                  <span className="text-[10px] font-bold tracking-wider uppercase mt-0.5">APEX</span>
                </div>
              )}
            </div>

            {/* Institution Titles & Badges */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  {profile.code || 'AITE-500032'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Award className="w-3 h-3" /> NAAC {profile.accreditation?.naacGrade || 'A++'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Est. {profile.establishedYear || 2008}
                </span>
              </div>

              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                {profile.name}
              </h1>

              <p className="text-xs text-teal-200/90 font-medium max-w-2xl">
                {profile.tagline || 'Excellence in Engineering & Technological Innovation'}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-300">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  {profile.address?.city}, {profile.address?.state}
                </span>
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-teal-400" />
                  {profile.institutionType || 'Autonomous Engineering College'}
                </span>
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-teal-400" />
                  AY {profile.currentAcademicYear || '2026 - 2027'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Trigger: Edit Profile or Read-Only Notice */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
            {isAuthorizedToEdit ? (
              !isEditing ? (
                <button
                  type="button"
                  onClick={() => {
                    setFormData(profile);
                    setLogoPreview(profile.logoUrl || '');
                    setIsEditing(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              )
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-slate-300 text-[11px] font-medium flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-teal-400" />
                Read-Only (Super Admin Managed)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Content: View Mode vs Edit Mode */}
      {!isEditing ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Detailed Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: College Identification & Basic Info */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  College Identification & Identity
                </h2>
                <span className="text-[11px] font-semibold text-slate-500">
                  Code: <strong className="text-slate-900">{profile.code}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                    Official College Name
                  </span>
                  <span className="text-sm font-bold text-slate-900 mt-1 block">
                    {profile.name}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                    Institution Code
                  </span>
                  <span className="text-sm font-bold text-slate-900 mt-1 block font-mono">
                    {profile.code}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                    Year of Establishment
                  </span>
                  <span className="text-sm font-bold text-slate-900 mt-1 block">
                    {profile.establishedYear || 2008}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                    Institution Classification
                  </span>
                  <span className="text-sm font-bold text-slate-900 mt-1 block">
                    {profile.institutionType || 'Autonomous Engineering College'}
                  </span>
                </div>

                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                    Institutional Motto / Tagline
                  </span>
                  <span className="text-xs font-semibold text-slate-800 mt-1 block italic">
                    "{profile.tagline || 'Excellence in Engineering & Technological Innovation'}"
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: University Affiliation & Accreditations */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  University Affiliation & Accreditations
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Regulatory Approved
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                    Affiliated University
                  </span>
                  <span className="text-sm font-bold text-slate-900 mt-1 block">
                    {profile.affiliation?.university || 'Jawaharlal Nehru Technological University (JNTU)'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                    Statutory Approval Body
                  </span>
                  <span className="text-sm font-bold text-slate-900 mt-1 block">
                    {profile.affiliation?.approvalBody || 'All India Council for Technical Education (AICTE)'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                    AICTE Permanent Approval ID
                  </span>
                  <span className="text-xs font-bold text-slate-900 mt-1 block font-mono">
                    {profile.affiliation?.aicteApprovalNumber || 'AICTE-F-1-432891901/2024'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                    UGC & Autonomous Status
                  </span>
                  <span className="text-xs font-bold text-slate-900 mt-1 block">
                    {profile.affiliation?.autonomousStatus || 'UGC Autonomous Status Conferred'}
                  </span>
                </div>

                {/* NAAC & NBA Seals */}
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                      NAAC Accreditation
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white font-black text-xs">
                      Grade {profile.accreditation?.naacGrade || 'A++'}
                    </span>
                  </div>
                  <div className="mt-2 space-y-0.5 text-[11px] text-amber-900">
                    <div>CGPA Score: <strong>{profile.accreditation?.naacCgpa || '3.68 / 4.00'}</strong></div>
                    <div>Valid Until: <strong>{profile.accreditation?.naacValidUntil || '2028-12-31'}</strong></div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-200/70">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wider">
                      NBA Accreditation
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-teal-600 text-white font-bold text-xs">
                      Tier-1
                    </span>
                  </div>
                  <div className="mt-2 space-y-0.5 text-[11px] text-teal-900">
                    <div>Programs: <strong>{profile.accreditation?.nbaStatus || 'CSE, ECE, MECH, EEE'}</strong></div>
                    <div>NIRF: <strong>{profile.accreditation?.nirfRankBand || 'Rank Band 101 - 150'}</strong></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Address & Geographic Location */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Campus Address & Geographic Location
                </h2>
                <span className="text-[11px] font-semibold text-slate-500">
                  PIN: <strong className="text-slate-900">{profile.address?.postalCode}</strong>
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-800 space-y-1">
                <p className="font-semibold text-slate-900">{profile.address?.line1}</p>
                {profile.address?.line2 && <p className="text-slate-600">{profile.address?.line2}</p>}
                <p className="text-slate-700">
                  {profile.address?.city}, {profile.address?.state} - <strong>{profile.address?.postalCode}</strong>
                </p>
                <p className="text-slate-500 font-medium">{profile.address?.country}</p>
              </div>
            </div>
          </div>

          {/* Column 3: Contact & Operational Badges */}
          <div className="space-y-6">
            {/* Card 4: Contact & Digital Reach */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-sky-600" />
                  Official Contact Channels
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
                  <Mail className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-0.5 overflow-hidden">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Registrar Email</span>
                    <a
                      href={`mailto:${profile.contact?.email}`}
                      className="text-xs font-bold text-teal-700 hover:underline block truncate"
                    >
                      {profile.contact?.email || 'registrar@apexengineering.edu'}
                    </a>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
                  <Phone className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Telephone / EPABX</span>
                    <span className="text-xs font-bold text-slate-900 block font-mono">
                      {profile.contact?.phone || '+91 40 2345 6789'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-start gap-3">
                  <Phone className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-amber-700 uppercase block">Campus Helpline (24/7)</span>
                    <span className="text-xs font-bold text-amber-950 block font-mono">
                      {profile.contact?.emergencyPhone || '+91 98480 99887'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
                  <Globe className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-0.5 overflow-hidden">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Official Website</span>
                    <a
                      href={profile.contact?.website || 'https://www.apexengineering.edu'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-sky-700 hover:underline flex items-center gap-1 truncate"
                    >
                      <span>{profile.contact?.website || 'https://www.apexengineering.edu'}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 5: Operational Parameters */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Operational Specifications
              </h2>

              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500">Academic Year</span>
                  <span className="font-bold text-slate-900">{profile.currentAcademicYear || '2026 - 2027'}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500">Current Semester</span>
                  <span className="font-bold text-slate-900">{profile.activeSemesterTerm || 'Odd (Sem 1, 3, 5, 7)'}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500">Target Student Capacity</span>
                  <span className="font-bold text-slate-900">&lt; {profile.targetStudentCapacity || 1000} Students</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500">Multi-Tenancy Mode</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px]">
                    Single Dedicated Institution
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* EDIT MODE FORM */
        <form onSubmit={handleSave} className="space-y-6">
          {/* Card: Logo Upload & Branding */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Upload className="w-4 h-4 text-teal-600" />
              College Logo Upload & Visual Branding
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              {/* Preview Box */}
              <div className="w-28 h-28 rounded-2xl bg-white border border-slate-300 shadow-xs flex items-center justify-center p-2 overflow-hidden flex-shrink-0">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto" />
                    <span className="text-[10px] block mt-1 font-semibold">No Logo</span>
                  </div>
                )}
              </div>

              {/* Upload Action */}
              <div className="space-y-2 text-center sm:text-left flex-1">
                <p className="text-xs font-bold text-slate-800">
                  Upload Official Institutional Logo or Crest
                </p>
                <p className="text-[11px] text-slate-500">
                  Accepted formats: PNG, JPG, JPEG, WEBP, or SVG. Maximum file size: 2 MB.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoSelect}
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Choose Logo Image
                  </button>

                  {logoPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card: Basic Identity & Affiliation Inputs */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-4 h-4 text-teal-600" />
              1. Institutional Identification & Governance
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Official College Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Apex Institute of Technology & Engineering"
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-1 ${
                    formErrors.name ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-emerald-500'
                  }`}
                />
                {formErrors.name && (
                  <span className="text-[11px] text-rose-500 mt-1 block">{formErrors.name}</span>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Institution Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. AITE-500032"
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-1 ${
                    formErrors.code ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-emerald-500'
                  }`}
                />
                {formErrors.code && (
                  <span className="text-[11px] text-rose-500 mt-1 block">{formErrors.code}</span>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Year Established</label>
                <input
                  type="number"
                  value={formData.establishedYear || 2008}
                  onChange={(e) => setFormData({ ...formData, establishedYear: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Institution Classification</label>
                <select
                  value={formData.institutionType || 'Autonomous Engineering College'}
                  onChange={(e) => setFormData({ ...formData, institutionType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Autonomous Engineering College">Autonomous Engineering College</option>
                  <option value="University Constituent College">University Constituent College</option>
                  <option value="Affiliated Technical Institute">Affiliated Technical Institute</option>
                  <option value="Deemed-to-be University">Deemed-to-be University</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Tagline / Motto</label>
                <input
                  type="text"
                  value={formData.tagline || ''}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. Excellence in Engineering & Technological Innovation"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Card: Affiliation & Accreditations */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award className="w-4 h-4 text-amber-600" />
              2. University Affiliation & Accreditations Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Affiliated University</label>
                <input
                  type="text"
                  value={formData.affiliation?.university || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      affiliation: { ...formData.affiliation, university: e.target.value }
                    })
                  }
                  placeholder="e.g. Jawaharlal Nehru Technological University (JNTU)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Statutory Approval Body</label>
                <input
                  type="text"
                  value={formData.affiliation?.approvalBody || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      affiliation: { ...formData.affiliation, approvalBody: e.target.value }
                    })
                  }
                  placeholder="e.g. All India Council for Technical Education (AICTE)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Permanent AICTE Approval ID</label>
                <input
                  type="text"
                  value={formData.affiliation?.aicteApprovalNumber || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      affiliation: { ...formData.affiliation, aicteApprovalNumber: e.target.value }
                    })
                  }
                  placeholder="e.g. AICTE-F-1-432891901/2024"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">UGC Recognition Status</label>
                <input
                  type="text"
                  value={formData.affiliation?.ugcStatus || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      affiliation: { ...formData.affiliation, ugcStatus: e.target.value }
                    })
                  }
                  placeholder="e.g. 2(f) & 12(B) Recognized"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">NAAC Grade</label>
                <select
                  value={formData.accreditation?.naacGrade || 'A++'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accreditation: { ...formData.accreditation, naacGrade: e.target.value }
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="A++">A++ (Highest Distinction)</option>
                  <option value="A+">A+ (Distinction)</option>
                  <option value="A">A (Very Good)</option>
                  <option value="B++">B++</option>
                  <option value="B+">B+</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="Not Accredited">Not Accredited</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">NAAC CGPA Score</label>
                <input
                  type="text"
                  value={formData.accreditation?.naacCgpa || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accreditation: { ...formData.accreditation, naacCgpa: e.target.value }
                    })
                  }
                  placeholder="e.g. 3.68 / 4.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">NAAC Valid Until Date</label>
                <input
                  type="date"
                  value={formData.accreditation?.naacValidUntil || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accreditation: { ...formData.accreditation, naacValidUntil: e.target.value }
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">NBA Accreditation Status</label>
                <input
                  type="text"
                  value={formData.accreditation?.nbaStatus || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accreditation: { ...formData.accreditation, nbaStatus: e.target.value }
                    })
                  }
                  placeholder="e.g. Tier-1 Accredited (CSE, ECE, MECH, EEE)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Card: Address & Contact Inputs */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin className="w-4 h-4 text-emerald-600" />
              3. Campus Address & Official Contact Channels
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Address Line 1</label>
                <input
                  type="text"
                  value={formData.address?.line1 || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, line1: e.target.value }
                    })
                  }
                  placeholder="e.g. Survey No. 45/2, Knowledge City Road"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Address Line 2 (District / Area)</label>
                <input
                  type="text"
                  value={formData.address?.line2 || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, line2: e.target.value }
                    })
                  }
                  placeholder="e.g. Financial District, Gachibowli"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
                <input
                  type="text"
                  value={formData.address?.city || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value }
                    })
                  }
                  placeholder="e.g. Hyderabad"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">State</label>
                <input
                  type="text"
                  value={formData.address?.state || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value }
                    })
                  }
                  placeholder="e.g. Telangana"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Postal PIN Code</label>
                <input
                  type="text"
                  value={formData.address?.postalCode || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, postalCode: e.target.value }
                    })
                  }
                  placeholder="e.g. 500032"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Registrar Official Email</label>
                <input
                  type="email"
                  value={formData.contact?.email || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact: { ...formData.contact, email: e.target.value }
                    })
                  }
                  placeholder="e.g. registrar@apexengineering.edu"
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-1 ${
                    formErrors.email ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-emerald-500'
                  }`}
                />
                {formErrors.email && (
                  <span className="text-[11px] text-rose-500 mt-1 block">{formErrors.email}</span>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Official Telephone / EPABX</label>
                <input
                  type="tel"
                  value={formData.contact?.phone || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact: { ...formData.contact, phone: e.target.value }
                    })
                  }
                  placeholder="e.g. +91 40 2345 6789"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">24/7 Campus Helpline</label>
                <input
                  type="tel"
                  value={formData.contact?.emergencyPhone || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact: { ...formData.contact, emergencyPhone: e.target.value }
                    })
                  }
                  placeholder="e.g. +91 98480 99887"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Official Website URL</label>
                <input
                  type="url"
                  value={formData.contact?.website || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact: { ...formData.contact, website: e.target.value }
                    })
                  }
                  placeholder="e.g. https://www.apexengineering.edu"
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-1 ${
                    formErrors.website ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-emerald-500'
                  }`}
                />
                {formErrors.website && (
                  <span className="text-[11px] text-rose-500 mt-1 block">{formErrors.website}</span>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <X className="w-4 h-4" /> Discard Changes
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving Changes to MongoDB...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save & Update Institutional Profile
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default InstitutionProfileManager;

