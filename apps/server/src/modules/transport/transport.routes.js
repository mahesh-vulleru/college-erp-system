const express = require('express');
const router = express.Router();

const {
  getTransportSummary,
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  startTrip,
  completeTrip,
  cancelTrip,
  getDailySchedule,
  submitGpsLocation,
  getActiveBusLocations,
  getBusLocationHistory,
  getTripAttendance,
  markStudentBoarding,
  markStudentDrop,
  correctAttendance,
  getDriverTrips,
  getSupervisorDashboardSummary,
  getParentChildTransport,
  getMyStudentTransport,
  getBuses,
  getBusById,
  createBus,
  updateBus,
  deactivateBus,
  getRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deactivateRoute,
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deactivateDriver,
  getEligibleStudents,
  getAllocations,
  createAllocation,
  cancelAllocation,
  getTransportSettings,
  updateTransportSettings,
  getMaintenanceRecords,
  getMaintenanceById,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  completeMaintenance,
  getDocumentExpiryAlerts,
  getFuelRecords,
  createFuelRecord,
  getFuelMileageStats,
  getExpenses,
  createExpense,
  approveExpense,
  rejectExpense,
  getFeeStructures,
  createFeeStructure,
  getStudentTransportFees,
  assignStudentFee,
  recordFeePayment,
  getPaymentReceipt,
  getTransportFinancialSummary,
  getSafetyDashboardSummary,
  triggerSosAlert,
  getEmergencyAlerts,
  getEmergencyAlertById,
  acknowledgeEmergencyAlert,
  updateEmergencyResponse,
  resolveEmergencyAlert,
  getIncidents,
  getIncidentById,
  createIncident,
  assignIncident,
  updateIncidentStatus,
  getGeofences,
  createGeofence,
  updateGeofence,
  getGeofenceEvents,
  recordGeofenceEvent,
  getOverspeedEvents,
  recordOverspeedEvent,
  getParentTransportData,
  submitComplaint,
  getComplaints,
  getComplaintById,
  assignComplaint,
  respondToComplaint,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deactivateAnnouncement,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationPreferences,
  updateNotificationPreferences
} = require('./transport.controller');

const {
  getExecutiveAnalytics,
  getFleetAnalytics,
  getRouteAnalytics,
  getDriverAnalytics,
  getStudentTransportAnalytics,
  getTripAndAttendanceAnalytics,
  getFuelAndMaintenanceAnalytics,
  getFinancialAnalytics,
  getSafetyAnalytics
} = require('./transport.analytics.controller');

const {
  getReportData,
  exportReport
} = require('./transport.reports.controller');

const authenticate = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/rbac');
const { ROLES } = require('@college-erp/shared');

// Apply authentication to all transport endpoints
router.use(authenticate);

// ---------------------------------------------------------------------------
// 1. DASHBOARD & SUMMARY APIS
// ---------------------------------------------------------------------------
router.get(
  '/summary',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getTransportSummary
);

// ---------------------------------------------------------------------------
// 2. BUS MANAGEMENT APIS
// ---------------------------------------------------------------------------
router.get(
  '/buses',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getBuses
);

router.get(
  '/buses/:id',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getBusById
);

router.post(
  '/buses',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN),
  createBus
);

router.put(
  '/buses/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN),
  updateBus
);

router.patch(
  '/buses/:id/deactivate',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN),
  deactivateBus
);

// ---------------------------------------------------------------------------
// 3. ROUTE & STOP MANAGEMENT APIS
// ---------------------------------------------------------------------------
router.get(
  '/routes',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.STUDENT
  ),
  getRoutes
);

router.get(
  '/routes/:id',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.STUDENT
  ),
  getRouteById
);

router.post(
  '/routes',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN),
  createRoute
);

router.put(
  '/routes/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN),
  updateRoute
);

router.patch(
  '/routes/:id/deactivate',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN),
  deactivateRoute
);

// ---------------------------------------------------------------------------
// 4. DRIVER MANAGEMENT APIS
// ---------------------------------------------------------------------------
router.get(
  '/drivers',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getDrivers
);

router.get(
  '/drivers/:id',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getDriverById
);

router.post(
  '/drivers',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN),
  createDriver
);

router.put(
  '/drivers/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN),
  updateDriver
);

router.patch(
  '/drivers/:id/deactivate',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN),
  deactivateDriver
);

// ---------------------------------------------------------------------------
// 5. STUDENT TRANSPORT ALLOCATION APIS
// ---------------------------------------------------------------------------
router.get(
  '/students/eligible',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getEligibleStudents
);

router.get(
  '/allocations',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.STUDENT
  ),
  getAllocations
);

router.post(
  '/allocations',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  createAllocation
);

router.patch(
  '/allocations/:id/cancel',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN),
  cancelAllocation
);

// ---------------------------------------------------------------------------
// 6. TRANSPORT SETTINGS APIS
// ---------------------------------------------------------------------------
router.get(
  '/settings',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getTransportSettings
);

router.put(
  '/settings',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN),
  updateTransportSettings
);


// ---------------------------------------------------------------------------
// 7. TRIP & DAILY SCHEDULE APIS (PHASE 2)
// ---------------------------------------------------------------------------
router.get(
  '/trips/schedule/daily',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getDailySchedule
);

router.get(
  '/trips',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getTrips
);

router.get(
  '/trips/:id',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.BUS_DRIVER
  ),
  getTripById
);

router.post(
  '/trips',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN, ROLES.TRANSPORT_SUPERVISOR),
  createTrip
);

router.put(
  '/trips/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN, ROLES.TRANSPORT_SUPERVISOR),
  updateTrip
);

router.patch(
  '/trips/:id/start',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.BUS_DRIVER
  ),
  startTrip
);

router.patch(
  '/trips/:id/complete',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.BUS_DRIVER
  ),
  completeTrip
);

router.patch(
  '/trips/:id/cancel',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN, ROLES.TRANSPORT_SUPERVISOR),
  cancelTrip
);

// ---------------------------------------------------------------------------
// 8. LIVE GPS TRACKING APIS (PHASE 2)
// ---------------------------------------------------------------------------
router.post(
  '/gps/update',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.BUS_DRIVER
  ),
  submitGpsLocation
);

router.get(
  '/gps/active',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.PARENT,
    ROLES.STUDENT
  ),
  getActiveBusLocations
);

router.get(
  '/gps/history/:busId',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getBusLocationHistory
);

// ---------------------------------------------------------------------------
// 9. STUDENT TRIP ATTENDANCE APIS (PHASE 2)
// ---------------------------------------------------------------------------
router.get(
  '/attendance/trip/:tripId',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.BUS_DRIVER,
    ROLES.BUS_ATTENDANT
  ),
  getTripAttendance
);

router.patch(
  '/attendance/:attendanceId/board',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.BUS_DRIVER,
    ROLES.BUS_ATTENDANT
  ),
  markStudentBoarding
);

router.patch(
  '/attendance/:attendanceId/drop',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.BUS_DRIVER,
    ROLES.BUS_ATTENDANT
  ),
  markStudentDrop
);

router.patch(
  '/attendance/:attendanceId/correct',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  correctAttendance
);

// ---------------------------------------------------------------------------
// 10. ROLE-SPECIFIC PORTAL APIS (PHASE 2)
// ---------------------------------------------------------------------------
router.get(
  ['/driver/my-trips', '/driver/trips'],
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.BUS_DRIVER
  ),
  getDriverTrips
);

router.get(
  '/supervisor/summary',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getSupervisorDashboardSummary
);

router.get(
  '/parent/my-children',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PARENT
  ),
  getParentChildTransport
);

router.get(
  '/student/my-transport',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.STUDENT
  ),
  getMyStudentTransport
);


// ---------------------------------------------------------------------------
// 11. VEHICLE MAINTENANCE APIS (PHASE 3)
// ---------------------------------------------------------------------------
router.get(
  '/maintenance/alerts/expiry',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getDocumentExpiryAlerts
);

router.get(
  '/maintenance',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getMaintenanceRecords
);

router.get(
  '/maintenance/:id',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getMaintenanceById
);

router.post(
  '/maintenance',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN, ROLES.TRANSPORT_SUPERVISOR),
  createMaintenanceRecord
);

router.put(
  '/maintenance/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN),
  updateMaintenanceRecord
);

router.patch(
  '/maintenance/:id/complete',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN, ROLES.TRANSPORT_SUPERVISOR),
  completeMaintenance
);

// ---------------------------------------------------------------------------
// 12. FUEL MANAGEMENT & MILEAGE APIS (PHASE 3)
// ---------------------------------------------------------------------------
router.get(
  '/fuel/stats',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getFuelMileageStats
);

router.get(
  '/fuel',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getFuelRecords
);

router.post(
  '/fuel',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.BUS_DRIVER
  ),
  createFuelRecord
);

// ---------------------------------------------------------------------------
// 13. TRANSPORT EXPENSE MANAGEMENT APIS (PHASE 3)
// ---------------------------------------------------------------------------
router.get(
  '/expenses',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ACCOUNTS,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getExpenses
);

router.post(
  '/expenses',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  createExpense
);

router.patch(
  '/expenses/:id/approve',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ACCOUNTS
  ),
  approveExpense
);

router.patch(
  '/expenses/:id/reject',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ACCOUNTS
  ),
  rejectExpense
);

// ---------------------------------------------------------------------------
// 14. TRANSPORT FEE MANAGEMENT & RECEIPTS APIS (PHASE 3)
// ---------------------------------------------------------------------------
router.get(
  '/finance/summary',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ACCOUNTS,
    ROLES.TRANSPORT_ADMIN
  ),
  getTransportFinancialSummary
);

router.get(
  '/fees/structures',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ACCOUNTS,
    ROLES.TRANSPORT_ADMIN
  ),
  getFeeStructures
);

router.post(
  '/fees/structures',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.ACCOUNTS,
    ROLES.TRANSPORT_ADMIN
  ),
  createFeeStructure
);

router.get(
  '/fees/students',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ACCOUNTS,
    ROLES.TRANSPORT_ADMIN
  ),
  getStudentTransportFees
);

router.post(
  '/fees/assign',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.ACCOUNTS,
    ROLES.TRANSPORT_ADMIN
  ),
  assignStudentFee
);

router.post(
  '/fees/:id/pay',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.ACCOUNTS,
    ROLES.TRANSPORT_ADMIN
  ),
  recordFeePayment
);

router.get(
  '/fees/receipts/:receiptNumber',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ACCOUNTS,
    ROLES.TRANSPORT_ADMIN,
    ROLES.PARENT,
    ROLES.STUDENT
  ),
  getPaymentReceipt
);

// ---------------------------------------------------------------------------
// 14. SAFETY DASHBOARD & EMERGENCY SOS APIS (PHASE 4)
// ---------------------------------------------------------------------------
router.get(
  '/safety/summary',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getSafetyDashboardSummary
);

router.post(
  '/safety/sos',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.BUS_DRIVER,
    ROLES.BUS_ATTENDANT
  ),
  triggerSosAlert
);

router.get(
  '/safety/sos',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.BUS_DRIVER,
    ROLES.BUS_ATTENDANT
  ),
  getEmergencyAlerts
);

router.get(
  '/safety/sos/:id',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.BUS_DRIVER,
    ROLES.BUS_ATTENDANT
  ),
  getEmergencyAlertById
);

router.patch(
  '/safety/sos/:id/acknowledge',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  acknowledgeEmergencyAlert
);

router.patch(
  '/safety/sos/:id/respond',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  updateEmergencyResponse
);

router.patch(
  '/safety/sos/:id/resolve',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  resolveEmergencyAlert
);

// ---------------------------------------------------------------------------
// 15. ACCIDENT & INCIDENT MANAGEMENT APIS (PHASE 4)
// ---------------------------------------------------------------------------
router.get(
  '/safety/incidents',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getIncidents
);

router.get(
  '/safety/incidents/:id',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getIncidentById
);

router.post(
  '/safety/incidents',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.BUS_DRIVER,
    ROLES.BUS_ATTENDANT
  ),
  createIncident
);

router.patch(
  '/safety/incidents/:id/assign',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  assignIncident
);

router.patch(
  '/safety/incidents/:id/status',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  updateIncidentStatus
);

// ---------------------------------------------------------------------------
// 16. GEOFENCING & OVERSPEED APIS (PHASE 4)
// ---------------------------------------------------------------------------
router.get(
  '/safety/geofences',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getGeofences
);

router.post(
  '/safety/geofences',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN),
  createGeofence
);

router.put(
  '/safety/geofences/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN),
  updateGeofence
);

router.get(
  '/safety/geofence-events',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getGeofenceEvents
);

router.post(
  '/safety/geofence-events',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.BUS_DRIVER
  ),
  recordGeofenceEvent
);

router.get(
  '/safety/overspeed-events',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getOverspeedEvents
);

router.post(
  '/safety/overspeed-events',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.BUS_DRIVER
  ),
  recordOverspeedEvent
);

// ---------------------------------------------------------------------------
// 17. PARENT TRANSPORT PORTAL APIS (PHASE 4)
// ---------------------------------------------------------------------------
router.get(
  '/parent/portal',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.PARENT
  ),
  getParentTransportData
);

// ---------------------------------------------------------------------------
// 18. TRANSPORT COMPLAINT APIS (PHASE 4)
// ---------------------------------------------------------------------------
router.post(
  '/complaints',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.PARENT,
    ROLES.STUDENT,
    ROLES.BUS_DRIVER,
    ROLES.BUS_ATTENDANT
  ),
  submitComplaint
);

router.get(
  '/complaints',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.PARENT,
    ROLES.STUDENT
  ),
  getComplaints
);

router.get(
  '/complaints/:id',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.PARENT,
    ROLES.STUDENT
  ),
  getComplaintById
);

router.patch(
  '/complaints/:id/assign',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  assignComplaint
);

router.patch(
  '/complaints/:id/respond',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  respondToComplaint
);

// ---------------------------------------------------------------------------
// 19. TRANSPORT ANNOUNCEMENT APIS (PHASE 4)
// ---------------------------------------------------------------------------
router.get(
  '/announcements',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.BUS_DRIVER,
    ROLES.BUS_ATTENDANT,
    ROLES.PARENT,
    ROLES.STUDENT
  ),
  getAnnouncements
);

router.post(
  '/announcements',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN),
  createAnnouncement
);

router.put(
  '/announcements/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN),
  updateAnnouncement
);

router.patch(
  '/announcements/:id/deactivate',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.TRANSPORT_ADMIN),
  deactivateAnnouncement
);

// ---------------------------------------------------------------------------
// 20. TRANSPORT NOTIFICATION & PREFERENCE APIS (PHASE 4)
// ---------------------------------------------------------------------------
router.get(
  '/notifications',
  getMyNotifications
);

router.patch(
  '/notifications/:id/read',
  markNotificationAsRead
);

router.post(
  '/notifications/read-all',
  markAllNotificationsAsRead
);

router.get(
  '/notifications/preferences',
  getNotificationPreferences
);

router.put(
  '/notifications/preferences',
  updateNotificationPreferences
);

// ---------------------------------------------------------------------------
// 21. TRANSPORT ANALYTICS APIS (PHASE 5)
// ---------------------------------------------------------------------------
router.get(
  '/analytics/executive',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getExecutiveAnalytics
);

router.get(
  '/analytics/fleet',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getFleetAnalytics
);

router.get(
  '/analytics/routes',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getRouteAnalytics
);

router.get(
  '/analytics/drivers',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getDriverAnalytics
);

router.get(
  '/analytics/students',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.STUDENT,
    ROLES.PARENT
  ),
  getStudentTransportAnalytics
);

router.get(
  '/analytics/trips',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getTripAndAttendanceAnalytics
);

router.get(
  '/analytics/attendance',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getTripAndAttendanceAnalytics
);

router.get(
  '/analytics/fuel',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getFuelAndMaintenanceAnalytics
);

router.get(
  '/analytics/maintenance',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getFuelAndMaintenanceAnalytics
);

router.get(
  '/analytics/finance',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.ACCOUNTS
  ),
  getFinancialAnalytics
);

router.get(
  '/analytics/safety',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR
  ),
  getSafetyAnalytics
);

// ---------------------------------------------------------------------------
// 22. TRANSPORT REPORT CENTER & EXPORTS (PHASE 5)
// ---------------------------------------------------------------------------
router.get(
  '/reports',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.ACCOUNTS,
    ROLES.PARENT,
    ROLES.STUDENT
  ),
  getReportData
);

router.get(
  '/reports/export',
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TRANSPORT_ADMIN,
    ROLES.TRANSPORT_SUPERVISOR,
    ROLES.ACCOUNTS,
    ROLES.PARENT,
    ROLES.STUDENT
  ),
  exportReport
);

module.exports = router;



