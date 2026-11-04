/**
 * Seed Demo Users
 * Creates core 13 role accounts + 5 HODs + 20 Faculty + 100 Students + 100 Parents + 10 Drivers + 10 Attendants
 */
const User = require('../../modules/auth/auth.model');
const { ROLES, USER_STATUS, DEMO_DOMAIN, DEMO_PASSWORD } = require('./config');

const CORE_ROLES = [
  { role: ROLES.SUPER_ADMIN, name: 'Dr. Arthur Mitchell [DEMO]', email: `demo.admin@${DEMO_DOMAIN}` },
  { role: ROLES.PRINCIPAL, name: 'Dr. Eleanor Vance [DEMO]', email: `demo.principal@${DEMO_DOMAIN}` },
  { role: ROLES.ACCOUNTS, name: 'Robert Sterling [DEMO]', email: `demo.accounts@${DEMO_DOMAIN}` },
  { role: ROLES.LIBRARIAN, name: 'Evelyn Reed [DEMO]', email: `demo.librarian@${DEMO_DOMAIN}` },
  { role: ROLES.LIBRARY_STAFF, name: 'Marcus Cole [DEMO]', email: `demo.librarystaff@${DEMO_DOMAIN}` },
  { role: ROLES.TRANSPORT_ADMIN, name: 'Robert Hayes [DEMO]', email: `demo.transportadmin@${DEMO_DOMAIN}` },
  { role: ROLES.TRANSPORT_SUPERVISOR, name: 'Vikram Chawla [DEMO]', email: `demo.supervisor@${DEMO_DOMAIN}` }
];

const HOD_DETAILS = [
  { dept: 'CSE', name: 'Dr. Arvind Sharma [DEMO]', email: `demo.hod.cse@${DEMO_DOMAIN}` },
  { dept: 'ECE', name: 'Dr. Sunita Deshmukh [DEMO]', email: `demo.hod.ece@${DEMO_DOMAIN}` },
  { dept: 'ME', name: 'Dr. Ramesh Kulkarni [DEMO]', email: `demo.hod.me@${DEMO_DOMAIN}` },
  { dept: 'CE', name: 'Dr. Priya Sundaram [DEMO]', email: `demo.hod.ce@${DEMO_DOMAIN}` },
  { dept: 'EEE', name: 'Dr. Manoj Tiwari [DEMO]', email: `demo.hod.eee@${DEMO_DOMAIN}` }
];

const FACULTY_NAMES = [
  'Prof. Alan Turing [DEMO]', 'Prof. Rajesh Iyer [DEMO]', 'Dr. Maya Sen [DEMO]', 'Prof. Naveen Rao [DEMO]',
  'Dr. Claude Shannon [DEMO]', 'Prof. Ananya Gupta [DEMO]', 'Dr. Sanjay Verma [DEMO]', 'Prof. Deepa Nair [DEMO]',
  'Dr. James Watt [DEMO]', 'Prof. Vikram Malhotra [DEMO]', 'Dr. Neha Kapoor [DEMO]', 'Prof. Sandeep Joshi [DEMO]',
  'Dr. Arthur Casagrande [DEMO]', 'Prof. Tarun Sen [DEMO]', 'Dr. Kavita Pillai [DEMO]', 'Prof. Alok Mukherjee [DEMO]',
  'Dr. Nikola Tesla [DEMO]', 'Prof. Gautam Roy [DEMO]', 'Dr. Shweta Bhatt [DEMO]', 'Prof. Harish Chandra [DEMO]'
];

async function upsertDemoUser(userData) {
  let user = await User.findOne({ email: userData.email.toLowerCase() });
  if (user) {
    user.name = userData.name;
    user.role = userData.role;
    user.status = USER_STATUS.ACTIVE;
    user.password = DEMO_PASSWORD;
    await user.save();
    return user;
  }
  return await User.create({
    name: userData.name,
    email: userData.email.toLowerCase(),
    password: DEMO_PASSWORD,
    role: userData.role,
    status: USER_STATUS.ACTIVE
  });
}

async function seedUsers() {
  console.log('[Users] Seeding 13 portal roles, 5 HODs, 20 faculty, 100 students, 100 parents, and 20 transport crew...');
  const userMap = {
    core: {},
    hods: {},
    faculty: [],
    students: [],
    parents: [],
    drivers: [],
    attendants: []
  };

  // 1. Core administrative users
  for (const c of CORE_ROLES) {
    const user = await upsertDemoUser(c);
    userMap.core[c.role] = user;
  }

  // 2. 5 HODs
  for (const h of HOD_DETAILS) {
    const user = await upsertDemoUser({ role: ROLES.HOD, name: h.name, email: h.email });
    userMap.hods[h.dept] = user;
    if (h.dept === 'CSE') {
      userMap.core[ROLES.HOD] = user; // link core HOD portal role
    }
  }

  // 3. 20 Faculty Members
  for (let i = 1; i <= 20; i++) {
    const num = String(i).padStart(2, '0');
    const user = await upsertDemoUser({
      role: ROLES.FACULTY,
      name: FACULTY_NAMES[i - 1],
      email: `demo.faculty${num}@${DEMO_DOMAIN}`
    });
    userMap.faculty.push(user);
    if (i === 1) {
      userMap.core[ROLES.FACULTY] = user; // link core Faculty portal role
    }
  }

  // 4. 100 Students & 100 Parents
  for (let i = 1; i <= 100; i++) {
    const num = String(i).padStart(3, '0');
    const studentUser = await upsertDemoUser({
      role: ROLES.STUDENT,
      name: `Student Demo ${num}`,
      email: `demo.student${num}@${DEMO_DOMAIN}`
    });
    userMap.students.push(studentUser);
    if (i === 1) {
      userMap.core[ROLES.STUDENT] = studentUser; // link core Student portal role
    }

    const parentUser = await upsertDemoUser({
      role: ROLES.PARENT,
      name: `Guardian of Student ${num} [DEMO]`,
      email: `demo.parent${num}@${DEMO_DOMAIN}`
    });
    userMap.parents.push(parentUser);
    if (i === 1) {
      userMap.core[ROLES.PARENT] = parentUser; // link core Parent portal role
    }
  }

  // 5. 10 Drivers
  for (let i = 1; i <= 10; i++) {
    const num = String(i).padStart(2, '0');
    const driverUser = await upsertDemoUser({
      role: ROLES.BUS_DRIVER,
      name: `Driver Captain ${num} [DEMO]`,
      email: `demo.driver${num}@${DEMO_DOMAIN}`
    });
    userMap.drivers.push(driverUser);
    if (i === 1) {
      userMap.core[ROLES.BUS_DRIVER] = driverUser;
    }
  }

  // 6. 10 Attendants
  for (let i = 1; i <= 10; i++) {
    const num = String(i).padStart(2, '0');
    const attendantUser = await upsertDemoUser({
      role: ROLES.BUS_ATTENDANT,
      name: `Attendant Marshal ${num} [DEMO]`,
      email: `demo.attendant${num}@${DEMO_DOMAIN}`
    });
    userMap.attendants.push(attendantUser);
    if (i === 1) {
      userMap.core[ROLES.BUS_ATTENDANT] = attendantUser;
    }
  }

  console.log(`[Users] Successfully provisioned ${Object.keys(userMap.core).length + 4 + userMap.faculty.length + userMap.students.length + userMap.parents.length + userMap.drivers.length + userMap.attendants.length} demo accounts.`);
  return userMap;
}

module.exports = { seedUsers };

