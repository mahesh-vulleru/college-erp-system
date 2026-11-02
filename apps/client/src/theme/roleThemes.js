/**
 * Global College ERP Design System (Dark Forest Green Theme)
 * Exactly matching the reference design:
 * - Dark forest-green sidebar (#062a1e / #083325)
 * - Mint-emerald active pill (bg-[#a7f3d0] text-[#064e3b] font-bold)
 * - White and light-cream workspace (#f4f7f5)
 * - Emerald-green primary buttons (bg-emerald-600 hover:bg-emerald-700)
 * - Clean cards, subtle shadows and borders
 * - Consistent icons and spacing across all institutional roles
 */

export const ROLE_THEMES = {
  super_admin: {
    id: 'super_admin',
    name: 'Super Admin',
    roleLabel: 'Super Admin',
    primary: 'emerald',
    sidebarBg: 'bg-[#062a1e]',
    sidebarBorder: 'border-emerald-950/60',
    sidebarActive: 'bg-[#a7f3d0] text-[#064e3b] font-bold shadow-xs',
    sidebarHover: 'hover:bg-white/10 hover:text-white',
    sidebarText: 'text-emerald-100/75',
    sidebarActiveText: 'text-[#064e3b]',
    avatarBg: 'bg-emerald-700 text-white',
    accentColor: 'emerald',
    badgeVariant: 'success',
    statAccent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    tagColor: 'bg-emerald-100 text-emerald-800'
  },
  principal: {
    id: 'principal',
    name: 'Principal / Management',
    roleLabel: 'Principal / Management',
    primary: 'emerald',
    sidebarBg: 'bg-[#062a1e]',
    sidebarBorder: 'border-emerald-950/60',
    sidebarActive: 'bg-[#a7f3d0] text-[#064e3b] font-bold shadow-xs',
    sidebarHover: 'hover:bg-white/10 hover:text-white',
    sidebarText: 'text-emerald-100/75',
    sidebarActiveText: 'text-[#064e3b]',
    avatarBg: 'bg-emerald-700 text-white',
    accentColor: 'emerald',
    badgeVariant: 'success',
    statAccent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    tagColor: 'bg-emerald-100 text-emerald-800'
  },
  hod: {
    id: 'hod',
    name: 'Head of Department',
    roleLabel: 'HOD',
    primary: 'emerald',
    sidebarBg: 'bg-[#062a1e]',
    sidebarBorder: 'border-emerald-950/60',
    sidebarActive: 'bg-[#a7f3d0] text-[#064e3b] font-bold shadow-xs',
    sidebarHover: 'hover:bg-white/10 hover:text-white',
    sidebarText: 'text-emerald-100/75',
    sidebarActiveText: 'text-[#064e3b]',
    avatarBg: 'bg-emerald-700 text-white',
    accentColor: 'emerald',
    badgeVariant: 'success',
    statAccent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    tagColor: 'bg-amber-100 text-amber-800'
  },
  faculty: {
    id: 'faculty',
    name: 'Faculty',
    roleLabel: 'Faculty Member',
    primary: 'emerald',
    sidebarBg: 'bg-[#062a1e]',
    sidebarBorder: 'border-emerald-950/60',
    sidebarActive: 'bg-[#a7f3d0] text-[#064e3b] font-bold shadow-xs',
    sidebarHover: 'hover:bg-white/10 hover:text-white',
    sidebarText: 'text-emerald-100/75',
    sidebarActiveText: 'text-[#064e3b]',
    avatarBg: 'bg-emerald-700 text-white',
    accentColor: 'emerald',
    badgeVariant: 'success',
    statAccent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    tagColor: 'bg-indigo-100 text-indigo-800'
  },
  student: {
    id: 'student',
    name: 'Student',
    roleLabel: 'Student',
    primary: 'emerald',
    sidebarBg: 'bg-[#062a1e]',
    sidebarBorder: 'border-emerald-950/60',
    sidebarActive: 'bg-[#a7f3d0] text-[#064e3b] font-bold shadow-xs',
    sidebarHover: 'hover:bg-white/10 hover:text-white',
    sidebarText: 'text-emerald-100/75',
    sidebarActiveText: 'text-[#064e3b]',
    avatarBg: 'bg-emerald-700 text-white',
    accentColor: 'emerald',
    badgeVariant: 'success',
    statAccent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    tagColor: 'bg-cyan-100 text-cyan-800'
  },
  accounts: {
    id: 'accounts',
    name: 'Accounts & Finance',
    roleLabel: 'Accounts & Finance',
    primary: 'emerald',
    sidebarBg: 'bg-[#062a1e]',
    sidebarBorder: 'border-emerald-950/60',
    sidebarActive: 'bg-[#a7f3d0] text-[#064e3b] font-bold shadow-xs',
    sidebarHover: 'hover:bg-white/10 hover:text-white',
    sidebarText: 'text-emerald-100/75',
    sidebarActiveText: 'text-[#064e3b]',
    avatarBg: 'bg-emerald-700 text-white',
    accentColor: 'emerald',
    badgeVariant: 'success',
    statAccent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    tagColor: 'bg-rose-100 text-rose-800'
  },
  librarian: {
    id: 'librarian',
    name: 'Librarian',
    roleLabel: 'Chief Librarian',
    primary: 'emerald',
    sidebarBg: 'bg-[#062a1e]',
    sidebarBorder: 'border-emerald-950/60',
    sidebarActive: 'bg-[#a7f3d0] text-[#064e3b] font-bold shadow-xs',
    sidebarHover: 'hover:bg-white/10 hover:text-white',
    sidebarText: 'text-emerald-100/75',
    sidebarActiveText: 'text-[#064e3b]',
    avatarBg: 'bg-emerald-700 text-white',
    accentColor: 'emerald',
    badgeVariant: 'success',
    statAccent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    tagColor: 'bg-blue-100 text-blue-800'
  },
  library_staff: {
    id: 'library_staff',
    name: 'Library Staff',
    roleLabel: 'Library Staff',
    primary: 'emerald',
    sidebarBg: 'bg-[#062a1e]',
    sidebarBorder: 'border-emerald-950/60',
    sidebarActive: 'bg-[#a7f3d0] text-[#064e3b] font-bold shadow-xs',
    sidebarHover: 'hover:bg-white/10 hover:text-white',
    sidebarText: 'text-emerald-100/75',
    sidebarActiveText: 'text-[#064e3b]',
    avatarBg: 'bg-emerald-700 text-white',
    accentColor: 'emerald',
    badgeVariant: 'success',
    statAccent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    tagColor: 'bg-teal-100 text-teal-800'
  },
  transport_admin: {
    id: 'transport_admin',
    name: 'Transport Administrator',
    roleLabel: 'Transport Administrator',
    primary: 'emerald',
    sidebarBg: 'bg-[#062a1e]',
    sidebarBorder: 'border-emerald-950/60',
    sidebarActive: 'bg-[#a7f3d0] text-[#064e3b] font-bold shadow-xs',
    sidebarHover: 'hover:bg-white/10 hover:text-white',
    sidebarText: 'text-emerald-100/75',
    sidebarActiveText: 'text-[#064e3b]',
    avatarBg: 'bg-emerald-700 text-white',
    accentColor: 'emerald',
    badgeVariant: 'success',
    statAccent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    tagColor: 'bg-amber-100 text-amber-800'
  },
  transport_supervisor: {
    id: 'transport_supervisor',
    name: 'Transport Supervisor',
    roleLabel: 'Transport Supervisor',
    primary: 'emerald',
    sidebarBg: 'bg-[#062a1e]',
    sidebarBorder: 'border-emerald-950/60',
    sidebarActive: 'bg-[#a7f3d0] text-[#064e3b] font-bold shadow-xs',
    sidebarHover: 'hover:bg-white/10 hover:text-white',
    sidebarText: 'text-emerald-100/75',
    sidebarActiveText: 'text-[#064e3b]',
    avatarBg: 'bg-emerald-700 text-white',
    accentColor: 'emerald',
    badgeVariant: 'success',
    statAccent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    tagColor: 'bg-teal-100 text-teal-800'
  },
  bus_driver: {
    id: 'bus_driver',
    name: 'Bus Driver',
    roleLabel: 'Bus Driver',
    primary: 'emerald',
    sidebarBg: 'bg-[#062a1e]',
    sidebarBorder: 'border-emerald-950/60',
    sidebarActive: 'bg-[#a7f3d0] text-[#064e3b] font-bold shadow-xs',
    sidebarHover: 'hover:bg-white/10 hover:text-white',
    sidebarText: 'text-emerald-100/75',
    sidebarActiveText: 'text-[#064e3b]',
    avatarBg: 'bg-emerald-700 text-white',
    accentColor: 'emerald',
    badgeVariant: 'success',
    statAccent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    tagColor: 'bg-sky-100 text-sky-800'
  },
  bus_attendant: {
    id: 'bus_attendant',
    name: 'Bus Attendant',
    roleLabel: 'Bus Attendant',
    primary: 'emerald',
    sidebarBg: 'bg-[#062a1e]',
    sidebarBorder: 'border-emerald-950/60',
    sidebarActive: 'bg-[#a7f3d0] text-[#064e3b] font-bold shadow-xs',
    sidebarHover: 'hover:bg-white/10 hover:text-white',
    sidebarText: 'text-emerald-100/75',
    sidebarActiveText: 'text-[#064e3b]',
    avatarBg: 'bg-emerald-700 text-white',
    accentColor: 'emerald',
    badgeVariant: 'success',
    statAccent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    tagColor: 'bg-sky-100 text-sky-800'
  },
  parent: {
    id: 'parent',
    name: 'Parent / Guardian',
    roleLabel: 'Parent',
    primary: 'emerald',
    sidebarBg: 'bg-[#062a1e]',
    sidebarBorder: 'border-emerald-950/60',
    sidebarActive: 'bg-[#a7f3d0] text-[#064e3b] font-bold shadow-xs',
    sidebarHover: 'hover:bg-white/10 hover:text-white',
    sidebarText: 'text-emerald-100/75',
    sidebarActiveText: 'text-[#064e3b]',
    avatarBg: 'bg-emerald-700 text-white',
    accentColor: 'emerald',
    badgeVariant: 'success',
    statAccent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    tagColor: 'bg-purple-100 text-purple-800'
  }
};

export const normalizeRoleKey = (role) => {
  if (!role) return 'principal';
  const r = String(role).toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (r === 'superadmin' || r === 'admin' || r === 'super_administrator') return 'super_admin';
  if (r === 'finance' || r === 'accountant') return 'accounts';
  if (r === 'librarystaff') return 'library_staff';
  if (r === 'transportadmin') return 'transport_admin';
  if (r === 'transportsupervisor') return 'transport_supervisor';
  if (r === 'busdriver') return 'bus_driver';
  if (r === 'busattendant') return 'bus_attendant';
  return ROLE_THEMES[r] ? r : 'principal';
};

export const getRoleTheme = (role, pathname = '') => {
  const normalized = normalizeRoleKey(role);
  return ROLE_THEMES[normalized] || ROLE_THEMES.principal;
};

export default ROLE_THEMES;
