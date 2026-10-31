/**
 * Six Independent, Fixed Role Themes matching system requirements:
 * - Super Admin: Navy and Blue
 * - Principal: Forest Green and Emerald
 * - HOD: Teal and Blue
 * - Faculty: Indigo and Violet
 * - Student: Blue and Cyan
 * - Accounts: Emerald and Gold
 */
export const ROLE_THEMES = {
  super_admin: {
    id: 'super_admin',
    name: 'Navy & Blue Theme',
    primary: 'blue',
    sidebarBg: 'bg-[#0B132B]',
    sidebarBorder: 'border-slate-800',
    sidebarActive: 'bg-blue-600 text-white shadow-md shadow-blue-600/30',
    sidebarHover: 'hover:bg-slate-800/80 hover:text-white',
    sidebarText: 'text-slate-300',
    sidebarActiveText: 'text-white',
    avatarBg: 'bg-blue-700 text-white',
    bannerGradient: 'bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white shadow-lg shadow-blue-900/20 border border-blue-900/40',
    bannerTitleColor: 'text-white',
    bannerSubtitleColor: 'text-blue-200 font-light',
    accentColor: 'blue',
    badgeVariant: 'primary',
    statAccent: 'bg-blue-50 text-blue-700 border-blue-100'
  },
  principal: {
    id: 'principal',
    name: 'Forest Green & Emerald Theme',
    primary: 'emerald',
    sidebarBg: 'bg-[#062c1e]',
    sidebarBorder: 'border-emerald-950',
    sidebarActive: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30',
    sidebarHover: 'hover:bg-emerald-900/60 hover:text-white',
    sidebarText: 'text-emerald-200/80',
    sidebarActiveText: 'text-white',
    avatarBg: 'bg-emerald-700 text-white',
    bannerGradient: 'bg-gradient-to-r from-emerald-950 via-[#063323] to-[#04281c] text-white border border-emerald-800/40 shadow-lg shadow-emerald-950/20',
    bannerTitleColor: 'text-white',
    bannerSubtitleColor: 'text-emerald-200 font-light',
    accentColor: 'emerald',
    badgeVariant: 'success',
    statAccent: 'bg-emerald-50 text-emerald-700 border-emerald-100'
  },
  hod: {
    id: 'hod',
    name: 'Teal & Blue Theme',
    primary: 'teal',
    sidebarBg: 'bg-[#052e33]',
    sidebarBorder: 'border-teal-950',
    sidebarActive: 'bg-teal-600 text-white shadow-md shadow-teal-600/30',
    sidebarHover: 'hover:bg-teal-900/60 hover:text-white',
    sidebarText: 'text-teal-200/80',
    sidebarActiveText: 'text-white',
    avatarBg: 'bg-teal-700 text-white',
    bannerGradient: 'bg-gradient-to-r from-teal-950 via-[#063b42] to-cyan-950 text-white border border-teal-800/40 shadow-lg shadow-teal-950/20',
    bannerTitleColor: 'text-white',
    bannerSubtitleColor: 'text-teal-200 font-light',
    accentColor: 'teal',
    badgeVariant: 'teal',
    statAccent: 'bg-teal-50 text-teal-700 border-teal-100'
  },
  faculty: {
    id: 'faculty',
    name: 'Indigo & Violet Theme',
    primary: 'indigo',
    sidebarBg: 'bg-[#1a153b]',
    sidebarBorder: 'border-indigo-950',
    sidebarActive: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30',
    sidebarHover: 'hover:bg-indigo-900/60 hover:text-white',
    sidebarText: 'text-indigo-200/80',
    sidebarActiveText: 'text-white',
    avatarBg: 'bg-indigo-700 text-white',
    bannerGradient: 'bg-gradient-to-r from-indigo-950 via-[#231b4e] to-purple-950 text-white border border-indigo-800/40 shadow-lg shadow-indigo-950/20',
    bannerTitleColor: 'text-white',
    bannerSubtitleColor: 'text-indigo-200 font-light',
    accentColor: 'indigo',
    badgeVariant: 'primary',
    statAccent: 'bg-indigo-50 text-indigo-700 border-indigo-100'
  },
  student: {
    id: 'student',
    name: 'Blue & Cyan Theme',
    primary: 'cyan',
    sidebarBg: 'bg-[#0b1b36]',
    sidebarBorder: 'border-cyan-950',
    sidebarActive: 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30',
    sidebarHover: 'hover:bg-cyan-950/60 hover:text-white',
    sidebarText: 'text-cyan-200/80',
    sidebarActiveText: 'text-white',
    avatarBg: 'bg-cyan-700 text-white',
    bannerGradient: 'bg-gradient-to-r from-slate-900 via-[#0e274a] to-cyan-950 text-white border border-cyan-800/40 shadow-lg shadow-cyan-950/20',
    bannerTitleColor: 'text-white',
    bannerSubtitleColor: 'text-cyan-200 font-light',
    accentColor: 'cyan',
    badgeVariant: 'info',
    statAccent: 'bg-cyan-50 text-cyan-800 border-cyan-100'
  },
  accounts: {
    id: 'accounts',
    name: 'Emerald & Gold Theme',
    primary: 'amber',
    sidebarBg: 'bg-[#072418]',
    sidebarBorder: 'border-emerald-950',
    sidebarActive: 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/30',
    sidebarHover: 'hover:bg-emerald-900/60 hover:text-white',
    sidebarText: 'text-emerald-200/80',
    sidebarActiveText: 'text-slate-950 font-semibold',
    avatarBg: 'bg-amber-600 text-slate-950 font-bold',
    bannerGradient: 'bg-gradient-to-r from-emerald-950 via-[#093524] to-[#1a2f14] text-white border border-amber-600/40 shadow-lg shadow-emerald-950/20',
    bannerTitleColor: 'text-white',
    bannerSubtitleColor: 'text-amber-200 font-light',
    accentColor: 'amber',
    badgeVariant: 'warning',
    statAccent: 'bg-amber-50 text-amber-800 border-amber-100'
  },
  librarian: {
    id: 'librarian',
    name: 'Burgundy & Rose Theme',
    primary: 'rose',
    sidebarBg: 'bg-[#230914]',
    sidebarBorder: 'border-rose-950',
    sidebarActive: 'bg-rose-600 text-white shadow-md shadow-rose-600/30',
    sidebarHover: 'hover:bg-rose-950/60 hover:text-white',
    sidebarText: 'text-rose-200/80',
    sidebarActiveText: 'text-white',
    avatarBg: 'bg-rose-700 text-white',
    bannerGradient: 'bg-gradient-to-r from-[#230914] via-[#350d1e] to-[#1d0610] text-white border border-rose-900/40 shadow-lg shadow-rose-950/20',
    bannerTitleColor: 'text-white',
    bannerSubtitleColor: 'text-rose-200 font-light',
    accentColor: 'rose',
    badgeVariant: 'danger',
    statAccent: 'bg-rose-50 text-rose-800 border-rose-100'
  }
};

/**
 * Resolves the theme.
 * Crucial rule: The authenticated user role is the single source of truth.
 * Clicking navigation links must NEVER alter the role theme.
 * Pathname is used ONLY as fallback for unauthenticated previews.
 */
export function getRoleTheme(role, pathname = '') {
  if (role) {
    const normalized = String(role).toLowerCase().trim().replace(/[\s-]+/g, '_');
    if (normalized === 'admin' || normalized === 'superadmin' || normalized === 'super_administrator') {
      return ROLE_THEMES.super_admin;
    }
    if (ROLE_THEMES[normalized]) {
      return ROLE_THEMES[normalized];
    }
  }

  // Fallback for direct unauthenticated/landing page routing:
  if (pathname.startsWith('/admin')) return ROLE_THEMES.super_admin;
  if (pathname.startsWith('/principal')) return ROLE_THEMES.principal;
  if (pathname.startsWith('/hod')) return ROLE_THEMES.hod;
  if (pathname.startsWith('/faculty')) return ROLE_THEMES.faculty;
  if (pathname.startsWith('/student')) return ROLE_THEMES.student;
    if (pathname.startsWith('/accounts') || pathname.startsWith('/fees')) return ROLE_THEMES.accounts;
  if (pathname.startsWith('/library')) return ROLE_THEMES.librarian;

  return ROLE_THEMES.super_admin;
}

export default ROLE_THEMES;
