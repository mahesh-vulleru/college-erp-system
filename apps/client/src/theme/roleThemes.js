/**
 * Six Coordinated Role Themes matching the Reference Design
 */
export const ROLE_THEMES = {
  super_admin: {
    id: 'super_admin',
    name: 'Modern Indigo Theme',
    primary: 'indigo',
    sidebarBg: 'bg-[#0d1527]',
    sidebarBorder: 'border-slate-800',
    sidebarActive: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30',
    sidebarHover: 'hover:bg-slate-800/70 hover:text-white',
    sidebarText: 'text-slate-400',
    sidebarActiveText: 'text-white',
    avatarBg: 'bg-purple-600 text-white',
    bannerGradient: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/10',
    bannerTitleColor: 'text-white',
    bannerSubtitleColor: 'text-indigo-100 font-light',
    accentColor: 'indigo',
    badgeVariant: 'primary',
    statAccent: 'bg-indigo-50 text-indigo-600 border-indigo-100'
  },
  principal: {
    id: 'principal',
    name: 'Elegant Green Theme',
    primary: 'emerald',
    sidebarBg: 'bg-[#09261d]',
    sidebarBorder: 'border-emerald-950',
    sidebarActive: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30',
    sidebarHover: 'hover:bg-emerald-900/60 hover:text-white',
    sidebarText: 'text-emerald-200/70',
    sidebarActiveText: 'text-white',
    avatarBg: 'bg-emerald-700 text-white',
    bannerGradient: 'bg-gradient-to-r from-emerald-50 via-teal-50/90 to-emerald-100/70 text-emerald-950 border border-emerald-200/80 shadow-sm',
    bannerTitleColor: 'text-emerald-950',
    bannerSubtitleColor: 'text-emerald-700 font-light',
    accentColor: 'emerald',
    badgeVariant: 'success',
    statAccent: 'bg-emerald-50 text-emerald-700 border-emerald-100'
  },
  hod: {
    id: 'hod',
    name: 'Warm Amber Theme',
    primary: 'amber',
    sidebarBg: 'bg-[#1f1c19]',
    sidebarBorder: 'border-[#2d2924]',
    sidebarActive: 'bg-amber-500 text-white shadow-md shadow-amber-500/30',
    sidebarHover: 'hover:bg-[#2d2924] hover:text-white',
    sidebarText: 'text-amber-100/70',
    sidebarActiveText: 'text-white',
    avatarBg: 'bg-amber-600 text-white',
    bannerGradient: 'bg-gradient-to-r from-amber-50 via-orange-50/90 to-amber-100/70 text-amber-950 border border-amber-200/80 shadow-sm',
    bannerTitleColor: 'text-amber-950',
    bannerSubtitleColor: 'text-amber-800 font-light',
    accentColor: 'amber',
    badgeVariant: 'warning',
    statAccent: 'bg-amber-50 text-amber-700 border-amber-100'
  },
  faculty: {
    id: 'faculty',
    name: 'Modern Purple Theme',
    primary: 'purple',
    sidebarBg: 'bg-[#1a1528]',
    sidebarBorder: 'border-[#29223e]',
    sidebarActive: 'bg-purple-600 text-white shadow-md shadow-purple-600/30',
    sidebarHover: 'hover:bg-[#29223e] hover:text-white',
    sidebarText: 'text-purple-200/70',
    sidebarActiveText: 'text-white',
    avatarBg: 'bg-purple-600 text-white',
    bannerGradient: 'bg-gradient-to-r from-purple-50 via-fuchsia-50/80 to-purple-100/70 text-purple-950 border border-purple-200/80 shadow-sm',
    bannerTitleColor: 'text-purple-950',
    bannerSubtitleColor: 'text-purple-700 font-light',
    accentColor: 'purple',
    badgeVariant: 'primary',
    statAccent: 'bg-purple-50 text-purple-700 border-purple-100'
  },
  student: {
    id: 'student',
    name: 'Clean Blue Theme',
    primary: 'blue',
    sidebarBg: 'bg-[#0c1b33]',
    sidebarBorder: 'border-slate-800',
    sidebarActive: 'bg-blue-600 text-white shadow-md shadow-blue-600/30',
    sidebarHover: 'hover:bg-slate-800/80 hover:text-white',
    sidebarText: 'text-slate-300',
    sidebarActiveText: 'text-white',
    avatarBg: 'bg-blue-600 text-white',
    bannerGradient: 'bg-gradient-to-r from-sky-50 via-blue-50/90 to-indigo-50/70 text-blue-950 border border-blue-200/80 shadow-sm',
    bannerTitleColor: 'text-blue-950',
    bannerSubtitleColor: 'text-blue-700 font-light',
    accentColor: 'blue',
    badgeVariant: 'info',
    statAccent: 'bg-blue-50 text-blue-700 border-blue-100'
  },
  accounts: {
    id: 'accounts',
    name: 'Modern Teal Theme',
    primary: 'teal',
    sidebarBg: 'bg-[#052524]',
    sidebarBorder: 'border-[#0a3a38]',
    sidebarActive: 'bg-teal-500 text-white shadow-md shadow-teal-500/30',
    sidebarHover: 'hover:bg-[#0a3a38] hover:text-white',
    sidebarText: 'text-teal-200/70',
    sidebarActiveText: 'text-white',
    avatarBg: 'bg-teal-700 text-white',
    bannerGradient: 'bg-gradient-to-r from-[#042826] via-[#093e3b] to-[#042f2e] text-white border border-teal-800/50 shadow-md',
    bannerTitleColor: 'text-white',
    bannerSubtitleColor: 'text-teal-200 font-light',
    accentColor: 'teal',
    badgeVariant: 'teal',
    statAccent: 'bg-teal-50 text-teal-700 border-teal-100'
  }
};

/**
 * Resolves the theme given a role or current pathname
 */
export function getRoleTheme(role, pathname = '') {
  if (pathname.startsWith('/admin')) return ROLE_THEMES.super_admin;
  if (pathname.startsWith('/principal')) return ROLE_THEMES.principal;
  if (pathname.startsWith('/hod')) return ROLE_THEMES.hod;
  if (pathname.startsWith('/faculty')) return ROLE_THEMES.faculty;
  if (pathname.startsWith('/student')) return ROLE_THEMES.student;
  if (pathname.startsWith('/accounts') || pathname.startsWith('/fees')) return ROLE_THEMES.accounts;

  if (role && ROLE_THEMES[role]) return ROLE_THEMES[role];
  return ROLE_THEMES.super_admin;
}

export default ROLE_THEMES;

