/**
 * Seed Demo Notices, Notifications, and Leave Applications
 * Populates 35+ institutional circulars, user notifications, and leave records
 */
const Notice = require('../../modules/notices/notice.model');
const Notification = require('../../modules/notifications/notification.model');
const Leave = require('../../modules/leave/leave.model');
const { DEMO_PREFIX, DEMO_TAG, DEPARTMENTS } = require('./config');

const NOTICES = [
  { title: `Commencement of Academic Semester 2025-2026 ${DEMO_TAG}`, content: 'Classes for all B.Tech branches commence Monday at 09:00 AM.', cat: 'Academic', roles: ['*'] },
  { title: `Mid-Term Examination Schedule Released ${DEMO_TAG}`, content: 'The comprehensive timetable for Mid-Term 1 is published on the portal.', cat: 'Examination', roles: ['student', 'faculty', 'hod'] },
  { title: `Semester Tuition Fee Due Date Reminder ${DEMO_TAG}`, content: 'All students are requested to clear composite semester dues by the deadline.', cat: 'Fees', roles: ['student', 'parent'] },
  { title: `Annual Inter-College Hackathon & Tech Fest ${DEMO_TAG}`, content: 'Registrations are open for the annual technical symposium and coding arena.', cat: 'General', roles: ['*'] },
  { title: `Central Library Extended Operating Hours ${DEMO_TAG}`, content: 'The Central Library reading rooms will remain open until 10:00 PM during exam weeks.', cat: 'General', roles: ['student', 'faculty'] },
  { title: `Campus Bus Route 04 Transit Schedule Revision ${DEMO_TAG}`, content: 'Morning pickup times for Route 04 advance by 10 minutes due to flyover construction.', cat: 'Emergency', roles: ['student', 'parent', 'bus_driver'] },
  { title: `Faculty Faculty Development Program on AI Systems ${DEMO_TAG}`, content: 'A 5-day national workshop on modern AI engineering patterns begins next week.', cat: 'Academic', roles: ['faculty', 'hod'] },
  { title: `Accreditation Committee Campus Visit Notice ${DEMO_TAG}`, content: 'All departments are instructed to finalize departmental dossiers and course files.', cat: 'Academic', roles: ['principal', 'hod', 'faculty'] },
  { title: `National Holiday - Institutional Closure Notice ${DEMO_TAG}`, content: 'The college will observe a general holiday on upcoming Friday.', cat: 'Holiday', roles: ['*'] },
  { title: `Hostel and Transportation Safety Protocol Update ${DEMO_TAG}`, content: 'Mandatory safety and RFID student check-in procedures are in effect.', cat: 'Emergency', roles: ['*'] },
  { title: `Campus Placement Drive: Top Tier Tech Companies ${DEMO_TAG}`, content: 'Pre-placement talks and mock interview sessions begin this Saturday.', cat: 'Placement', roles: ['student', 'faculty'] },
  { title: `National Science Day Technical Exhibition ${DEMO_TAG}`, content: 'Submit student project abstracts to your respective department HODs.', cat: 'Academic', roles: ['student', 'faculty', 'hod'] },
  { title: `Accounts Clearance for Final Hall Tickets ${DEMO_TAG}`, content: 'Obtain digital finance clearance slips before examination hall ticket generation.', cat: 'Fees', roles: ['student', 'accounts'] },
  { title: `Fleet Maintenance & Winter Inspection Camp ${DEMO_TAG}`, content: 'All 10 college transit buses scheduled for rigorous mechanical safety checks.', cat: 'Emergency', roles: ['transport_admin', 'transport_supervisor', 'bus_driver'] },
  { title: `Parent-Teacher Consultative Meet Invitation ${DEMO_TAG}`, content: 'Parents are invited to review semester progress reports with department heads.', cat: 'General', roles: ['parent', 'faculty', 'hod'] }
];

async function seedNotices(userMap, academicMap) {
  console.log('[Notices] Seeding 35+ notices, notifications, and faculty leave applications...');

  const adminUser = userMap.core.super_admin;
  const principalUser = userMap.core.principal;

  // 1. Notices
  let noticesCount = 0;
  for (const n of NOTICES) {
    let exist = await Notice.findOne({ title: n.title });
    if (!exist) {
      await Notice.create({
        title: n.title,
        content: n.content,
        category: n.cat,
        targetRoles: n.roles,
        status: 'published',
        publishedBy: adminUser._id
      });
      noticesCount++;
    }
  }

  // 2. Notifications
  const notificationSamples = [
    { title: `Fee Clearance Verified ${DEMO_TAG}`, msg: 'Your Semester 4 composite fee payment of INR 44,500 has been received.', cat: 'Fee', role: 'student' },
    { title: `Mid-Term Result Published ${DEMO_TAG}`, msg: 'Your exam result for Data Structures has been published (Grade A+).', cat: 'Academic', role: 'student' },
    { title: `Transit Bus Departure Notification ${DEMO_TAG}`, msg: 'Campus Bus 02 has departed Cyber City Stop on schedule.', cat: 'Transport', role: 'parent' },
    { title: `New Leave Application Received ${DEMO_TAG}`, msg: 'Prof. Alan Turing submitted a 3-day casual leave application for review.', cat: 'System', role: 'hod' },
    { title: `Library Book Due Date Approaching ${DEMO_TAG}`, msg: 'Book "Introduction to Algorithms" is due for return in 3 days.', cat: 'Academic', role: 'student' },
    { title: `Inspection Roster Assigned ${DEMO_TAG}`, msg: 'Daily fleet radar dispatch log is ready for supervisor sign-off.', cat: 'Transport', role: 'transport_supervisor' }
  ];

  let notifCount = 0;
  for (const ns of notificationSamples) {
    let exist = await Notification.findOne({ title: ns.title });
    if (!exist) {
      await Notification.create({
        title: ns.title,
        message: ns.msg,
        category: ns.cat,
        recipientRole: ns.role,
        priority: 'high',
        read: false
      });
      notifCount++;
    }
  }

  // 3. 15 Faculty Leave Applications
  let leaveCount = 0;
  const leaveTypes = ['casual', 'medical', 'earned', 'duty'];
  for (let i = 0; i < 15; i++) {
    const facultyUser = userMap.faculty[i];
    const facProfile = academicMap.faculties[i];
    const deptIdx = Math.floor(i / 4);
    const dept = academicMap.departments[DEPARTMENTS[deptIdx].code];
    const num = String(i + 1).padStart(3, '0');
    const applicationId = `${DEMO_PREFIX}LV-2026-${num}`;

    let leave = await Leave.findOne({ applicationId });
    if (!leave) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + (i * 3 + 2));
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + ((i % 3) + 1));

      await Leave.create({
        applicationId,
        user: facultyUser._id,
        applicantRole: 'faculty',
        applicantName: facultyUser.name,
        applicantIdNumber: facProfile.employeeId,
        faculty: facProfile._id,
        department: dept._id,
        leaveType: leaveTypes[i % leaveTypes.length],
        startDate,
        endDate,
        numberOfDays: (i % 3) + 1,
        reason: `${DEMO_TAG} Attending technical paper presentation / conference seminar ${i + 1}`,
        status: i % 3 === 0 ? 'approved' : (i % 3 === 1 ? 'pending' : 'rejected'),
        stage: i % 3 === 0 ? 2 : 1
      });
      leaveCount++;
    }
  }

  console.log(`[Notices] Successfully provisioned ${noticesCount} notices, ${notifCount} notifications, and ${leaveCount} faculty leave records.`);
}

module.exports = { seedNotices };
