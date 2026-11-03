const {
  Bus,
  Route,
  Driver,
  StudentTransportAllocation,
  Trip,
  StudentTripAttendance,
  VehicleMaintenance,
  FuelRecord,
  TransportExpense,
  StudentTransportFee,
  EmergencyAlert,
  TransportIncident,
  GeofenceEvent,
  OverspeedEvent
} = require('./models');
const { sendFormattedReport } = require('../../utils/exportGenerators');
const { resolveDateRange } = require('./transport.analytics.controller');
const logger = require('../../utils/logger');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');

/**
 * Report Data Fetcher Engine
 * Centralized logic for both preview grid (JSON pagination) and file exports (CSV, XLSX, PDF)
 */
async function fetchReportData(reportType, queryParams, user) {
  const {
    range,
    startDate,
    endDate,
    search,
    busId,
    routeId,
    driverId,
    status,
    category,
    page = 1,
    limit = 25,
    isExport = false
  } = queryParams;

  const { start, end } = resolveDateRange(range, startDate, endDate);
  const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
  const take = isExport ? 5000 : Math.max(1, parseInt(limit, 10));

  let headers = [];
  let rows = [];
  let totalCount = 0;
  let summaryTotals = {};
  let title = 'Transport Report';

  switch (reportType) {
    case 'vehicle': {
      title = 'Fleet & Vehicle Inventory Report';
      headers = ['Bus ID', 'Bus Name', 'Registration Number', 'Vehicle Type', 'Capacity', 'Driver Name', 'Status', 'Odometer (Km)'];
      const q = {};
      if (status && status !== 'all') q.currentStatus = status;
      if (busId) q._id = busId;
      if (search) {
        q.$or = [
          { busName: { $regex: search, $options: 'i' } },
          { registrationNumber: { $regex: search, $options: 'i' } },
          { busId: { $regex: search, $options: 'i' } }
        ];
      }
      totalCount = await Bus.countDocuments(q);
      const docs = await Bus.find(q)
        .populate('assignedDriver', 'fullName')
        .sort({ busName: 1 })
        .skip(skip)
        .limit(take);

      rows = docs.map((b) => [
        b.busId || 'N/A',
        b.busName || 'N/A',
        b.registrationNumber || 'N/A',
        b.vehicleType || 'Bus',
        b.capacity || 0,
        b.assignedDriver?.fullName || 'Unassigned',
        b.currentStatus || 'N/A',
        b.odometerReading || 0
      ]);
      summaryTotals = { totalVehicles: totalCount };
      break;
    }

    case 'driver': {
      title = 'Transport Drivers & Staff Report';
      headers = ['Driver ID', 'Full Name', 'License Number', 'Contact Number', 'Assigned Bus', 'Status'];
      const q = {};
      if (status && status !== 'all') q.employmentStatus = status;
      if (driverId) q._id = driverId;
      if (search) {
        q.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { licenseNumber: { $regex: search, $options: 'i' } },
          { driverId: { $regex: search, $options: 'i' } }
        ];
      }
      totalCount = await Driver.countDocuments(q);
      const docs = await Driver.find(q)
        .populate('assignedBus', 'busName registrationNumber')
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(take);

      rows = docs.map((d) => [
        d.driverId || 'N/A',
        d.fullName || 'N/A',
        d.licenseNumber || 'N/A',
        d.contactNumber || 'N/A',
        d.assignedBus ? `${d.assignedBus.busName} (${d.assignedBus.registrationNumber})` : 'Unassigned',
        d.employmentStatus || 'N/A'
      ]);
      summaryTotals = { totalDrivers: totalCount };
      break;
    }

    case 'route': {
      title = 'Transport Routes & Coverage Report';
      headers = ['Route Code', 'Route Name', 'Start Location', 'End Location', 'Distance (Km)', 'Stops Count', 'Status'];
      const q = {};
      if (status && status !== 'all') q.status = status;
      if (routeId) q._id = routeId;
      if (search) {
        q.$or = [
          { routeName: { $regex: search, $options: 'i' } },
          { routeCode: { $regex: search, $options: 'i' } }
        ];
      }
      totalCount = await Route.countDocuments(q);
      const docs = await Route.find(q)
        .sort({ routeName: 1 })
        .skip(skip)
        .limit(take);

      rows = docs.map((r) => [
        r.routeCode || 'N/A',
        r.routeName || 'N/A',
        r.startLocation || 'N/A',
        r.endLocation || 'N/A',
        r.totalDistanceKm || 0,
        r.stops?.length || 0,
        r.status || 'N/A'
      ]);
      summaryTotals = { totalRoutes: totalCount };
      break;
    }

    case 'student-transport': {
      title = 'Student Transport Allocations Report';
      headers = ['Allocation ID', 'Roll Number', 'Student Name', 'Department', 'Route', 'Pickup Stop', 'Drop Stop', 'Status'];
      const q = {};
      if (status && status !== 'all') q.allocationStatus = status;
      if (routeId) q.route = routeId;
      if (user.role === ROLES.STUDENT) {
        q.$or = [{ student: user._id }, { rollNumber: user.rollNumber }];
      } else if (user.role === ROLES.PARENT) {
        q.$or = [{ guardianPhone: user.email }, { guardianName: user.name }, { guardianPhone: user.phone || 'N/A' }];
      } else if (search) {
        q.$or = [
          { studentName: { $regex: search, $options: 'i' } },
          { rollNumber: { $regex: search, $options: 'i' } },
          { pickupStop: { $regex: search, $options: 'i' } }
        ];
      }
      totalCount = await StudentTransportAllocation.countDocuments(q);
      const docs = await StudentTransportAllocation.find(q)
        .populate('route', 'routeName routeCode')
        .sort({ studentName: 1 })
        .skip(skip)
        .limit(take);

      rows = docs.map((a) => [
        a.allocationId || 'N/A',
        a.rollNumber || 'N/A',
        a.studentName || 'N/A',
        a.department || 'N/A',
        a.route?.routeName || 'N/A',
        a.pickupStop || 'N/A',
        a.dropStop || 'N/A',
        a.allocationStatus || 'N/A'
      ]);
      summaryTotals = { totalAllocations: totalCount };
      break;
    }

    case 'trip': {
      title = 'Trip Operations Log Report';
      headers = ['Trip ID', 'Type', 'Bus', 'Route', 'Driver', 'Scheduled Dep', 'Actual Dep', 'Status'];
      const q = { tripDate: { $gte: start, $lte: end } };
      if (status && status !== 'all') q.tripStatus = status;
      if (busId) q.bus = busId;
      if (routeId) q.route = routeId;
      if (driverId) q.driver = driverId;
      if (search) q.tripId = { $regex: search, $options: 'i' };

      totalCount = await Trip.countDocuments(q);
      const docs = await Trip.find(q)
        .populate('bus', 'busName registrationNumber')
        .populate('route', 'routeName')
        .populate('driver', 'fullName')
        .sort({ tripDate: -1, scheduledDeparture: -1 })
        .skip(skip)
        .limit(take);

      rows = docs.map((t) => [
        t.tripId || 'N/A',
        t.tripType || 'N/A',
        t.bus?.busName || 'N/A',
        t.route?.routeName || 'N/A',
        t.driver?.fullName || 'N/A',
        t.scheduledDeparture ? new Date(t.scheduledDeparture).toLocaleTimeString() : 'N/A',
        t.actualDeparture ? new Date(t.actualDeparture).toLocaleTimeString() : 'N/A',
        t.tripStatus || 'N/A'
      ]);
      summaryTotals = { totalTrips: totalCount };
      break;
    }

    case 'student-attendance': {
      title = 'Student Transport Attendance Ledger';
      headers = ['Date', 'Student Name', 'Roll Number', 'Route', 'Bus', 'Boarding Status', 'Boarding Time', 'Drop Status'];
      const q = { createdAt: { $gte: start, $lte: end } };
      if (routeId) q.route = routeId;
      if (status && status !== 'all') q.boardingStatus = status;
      if (user.role === ROLES.STUDENT) {
        q.rollNumber = user.rollNumber;
      } else if (search) {
        q.$or = [{ studentName: { $regex: search, $options: 'i' } }, { rollNumber: { $regex: search, $options: 'i' } }];
      }

      totalCount = await StudentTripAttendance.countDocuments(q);
      const docs = await StudentTripAttendance.find(q)
        .populate('route', 'routeName')
        .populate('bus', 'busName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take);

      rows = docs.map((att) => [
        new Date(att.createdAt).toLocaleDateString(),
        att.studentName || 'N/A',
        att.rollNumber || 'N/A',
        att.route?.routeName || 'N/A',
        att.bus?.busName || 'N/A',
        att.boardingStatus || 'Pending',
        att.boardingTimestamp ? new Date(att.boardingTimestamp).toLocaleTimeString() : 'N/A',
        att.dropStatus || 'Pending'
      ]);
      summaryTotals = { totalAttendanceRecords: totalCount };
      break;
    }

    case 'fuel-consumption': {
      title = 'Fleet Fuel Consumption & Mileage Report';
      headers = ['Fuel Date', 'Bus Name', 'Reg Number', 'Quantity (Liters)', 'Total Cost (₹)', 'Rate/Liter', 'Odometer (Km)', 'Receipt No'];
      const q = { fuelDate: { $gte: start, $lte: end } };
      if (busId) q.bus = busId;
      if (search) q.receiptNumber = { $regex: search, $options: 'i' };

      totalCount = await FuelRecord.countDocuments(q);
      const docs = await FuelRecord.find(q)
        .populate('bus', 'busName registrationNumber')
        .sort({ fuelDate: -1 })
        .skip(skip)
        .limit(take);

      let sumCost = 0;
      let sumLiters = 0;
      rows = docs.map((f) => {
        sumCost += f.totalCost || 0;
        sumLiters += f.quantityLiters || 0;
        return [
          f.fuelDate ? new Date(f.fuelDate).toLocaleDateString() : 'N/A',
          f.bus?.busName || 'N/A',
          f.bus?.registrationNumber || 'N/A',
          f.quantityLiters || 0,
          f.totalCost || 0,
          f.costPerLiter || 0,
          f.odometerKm || 0,
          f.receiptNumber || 'N/A'
        ];
      });
      summaryTotals = { totalRecords: totalCount, totalCost: sumCost, totalLiters: sumLiters };
      break;
    }

    case 'vehicle-maintenance': {
      title = 'Vehicle Maintenance & Service History Report';
      headers = ['Service Date', 'Bus Name', 'Reg Number', 'Service Type', 'Cost (₹)', 'Vendor Name', 'Status', 'Invoice No'];
      const q = { serviceDate: { $gte: start, $lte: end } };
      if (busId) q.bus = busId;
      if (status && status !== 'all') q.status = status;
      if (search) q.vendorName = { $regex: search, $options: 'i' };

      totalCount = await VehicleMaintenance.countDocuments(q);
      const docs = await VehicleMaintenance.find(q)
        .populate('bus', 'busName registrationNumber')
        .sort({ serviceDate: -1 })
        .skip(skip)
        .limit(take);

      let sumCost = 0;
      rows = docs.map((m) => {
        sumCost += m.cost || 0;
        return [
          m.serviceDate ? new Date(m.serviceDate).toLocaleDateString() : 'N/A',
          m.bus?.busName || 'N/A',
          m.bus?.registrationNumber || 'N/A',
          m.serviceType || 'N/A',
          m.cost || 0,
          m.vendorName || 'N/A',
          m.status || 'N/A',
          m.invoiceNumber || 'N/A'
        ];
      });
      summaryTotals = { totalMaintenanceCount: totalCount, totalMaintenanceCost: sumCost };
      break;
    }

    case 'transport-expense': {
      title = 'Transport Operational Expense Ledger';
      headers = ['Expense ID', 'Category', 'Description', 'Amount (₹)', 'Date', 'Payment Mode', 'Status'];
      const q = { expenseDate: { $gte: start, $lte: end } };
      if (category && category !== 'all') q.category = category;
      if (status && status !== 'all') q.status = status;
      if (search) q.title = { $regex: search, $options: 'i' };

      totalCount = await TransportExpense.countDocuments(q);
      const docs = await TransportExpense.find(q)
        .sort({ expenseDate: -1 })
        .skip(skip)
        .limit(take);

      let sumExp = 0;
      rows = docs.map((e) => {
        sumExp += e.amount || 0;
        return [
          e.expenseId || 'N/A',
          e.category || 'N/A',
          e.title || e.description || 'N/A',
          e.amount || 0,
          e.expenseDate ? new Date(e.expenseDate).toLocaleDateString() : 'N/A',
          e.paymentMethod || 'N/A',
          e.status || 'N/A'
        ];
      });
      summaryTotals = { totalExpenses: totalCount, totalAmount: sumExp };
      break;
    }

    case 'fee-collection': {
      title = 'Transport Fee Collection & Payment Audit';
      headers = ['Roll Number', 'Student Name', 'Academic Year', 'Total Fee (₹)', 'Paid (₹)', 'Pending (₹)', 'Payment Status'];
      const q = {};
      if (status && status !== 'all') q.paymentStatus = status;
      if (search) {
        q.$or = [{ studentName: { $regex: search, $options: 'i' } }, { rollNumber: { $regex: search, $options: 'i' } }];
      }

      totalCount = await StudentTransportFee.countDocuments(q);
      const docs = await StudentTransportFee.find(q)
        .sort({ studentName: 1 })
        .skip(skip)
        .limit(take);

      let totalDemand = 0;
      let totalPaid = 0;
      let totalPending = 0;
      rows = docs.map((f) => {
        totalDemand += f.totalFee || 0;
        totalPaid += f.totalPaid || 0;
        totalPending += f.pendingBalance || 0;
        return [
          f.rollNumber || 'N/A',
          f.studentName || 'N/A',
          f.academicYear || '2025-2026',
          f.totalFee || 0,
          f.totalPaid || 0,
          f.pendingBalance || 0,
          f.paymentStatus || 'N/A'
        ];
      });
      summaryTotals = { totalStudents: totalCount, totalDemand, totalPaid, totalPending };
      break;
    }

    case 'pending-fee': {
      title = 'Outstanding Transport Fee Defaulters Report';
      headers = ['Roll Number', 'Student Name', 'Academic Year', 'Total Fee (₹)', 'Paid (₹)', 'Pending Dues (₹)', 'Status'];
      const q = { pendingBalance: { $gt: 0 } };
      if (search) {
        q.$or = [{ studentName: { $regex: search, $options: 'i' } }, { rollNumber: { $regex: search, $options: 'i' } }];
      }

      totalCount = await StudentTransportFee.countDocuments(q);
      const docs = await StudentTransportFee.find(q)
        .sort({ pendingBalance: -1 })
        .skip(skip)
        .limit(take);

      let pendingSum = 0;
      rows = docs.map((f) => {
        pendingSum += f.pendingBalance || 0;
        return [
          f.rollNumber || 'N/A',
          f.studentName || 'N/A',
          f.academicYear || '2025-2026',
          f.totalFee || 0,
          f.totalPaid || 0,
          f.pendingBalance || 0,
          f.paymentStatus || 'pending'
        ];
      });
      summaryTotals = { defaultersCount: totalCount, totalOutstandingBalance: pendingSum };
      break;
    }

    case 'safety-incident': {
      title = 'Transport Safety Incidents & Accidents Log';
      headers = ['Incident ID', 'Category', 'Severity', 'Bus', 'Reported Date', 'Status', 'Investigator'];
      const q = { createdAt: { $gte: start, $lte: end } };
      if (status && status !== 'all') q.status = status;
      if (category && category !== 'all') q.category = category;
      if (search) q.incidentId = { $regex: search, $options: 'i' };

      totalCount = await TransportIncident.countDocuments(q);
      const docs = await TransportIncident.find(q)
        .populate('bus', 'busName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take);

      rows = docs.map((inc) => [
        inc.incidentId || 'N/A',
        inc.category || 'N/A',
        inc.severity || 'N/A',
        inc.bus?.busName || 'N/A',
        inc.reportedAt ? new Date(inc.reportedAt).toLocaleDateString() : 'N/A',
        inc.status || 'N/A',
        inc.assignedOfficerName || 'Unassigned'
      ]);
      summaryTotals = { totalIncidents: totalCount };
      break;
    }

    case 'emergency-alert': {
      title = 'Emergency SOS Dispatches & Response Audit';
      headers = ['Alert ID', 'Emergency Type', 'Severity', 'Bus', 'Status', 'Triggered Time', 'Resolved At'];
      const q = { createdAt: { $gte: start, $lte: end } };
      if (status && status !== 'all') q.status = status;
      if (busId) q.bus = busId;

      totalCount = await EmergencyAlert.countDocuments(q);
      const docs = await EmergencyAlert.find(q)
        .populate('bus', 'busName registrationNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take);

      rows = docs.map((sos) => [
        sos.alertId || 'N/A',
        sos.emergencyType || 'N/A',
        sos.severity || 'Critical',
        sos.bus?.busName || 'N/A',
        sos.status || 'N/A',
        sos.createdAt ? new Date(sos.createdAt).toLocaleString() : 'N/A',
        sos.resolvedAt ? new Date(sos.resolvedAt).toLocaleString() : 'Open'
      ]);
      summaryTotals = { totalAlerts: totalCount };
      break;
    }

    case 'overspeed': {
      title = 'Fleet Overspeed Violations Log';
      headers = ['Event ID', 'Bus', 'Speed Recorded (Km/h)', 'Speed Limit (Km/h)', 'Excess Speed', 'Timestamp'];
      const q = { timestamp: { $gte: start, $lte: end } };
      if (busId) q.bus = busId;

      totalCount = await OverspeedEvent.countDocuments(q);
      const docs = await OverspeedEvent.find(q)
        .populate('bus', 'busName registrationNumber')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(take);

      rows = docs.map((ov) => {
        const excess = Math.max(0, (ov.speed || 0) - (ov.speedLimit || 60));
        return [
          ov.eventId || 'N/A',
          ov.bus ? `${ov.bus.busName} (${ov.bus.registrationNumber})` : 'N/A',
          ov.speed || 0,
          ov.speedLimit || 60,
          `+${excess} km/h`,
          ov.timestamp ? new Date(ov.timestamp).toLocaleString() : 'N/A'
        ];
      });
      summaryTotals = { totalViolations: totalCount };
      break;
    }

    case 'geofence-violation': {
      title = 'Geofence Entry & Deviation Events Report';
      headers = ['Event ID', 'Geofence Zone', 'Bus', 'Event Type', 'Speed (Km/h)', 'Timestamp'];
      const q = { timestamp: { $gte: start, $lte: end } };
      if (busId) q.bus = busId;

      totalCount = await GeofenceEvent.countDocuments(q);
      const docs = await GeofenceEvent.find(q)
        .populate('bus', 'busName')
        .populate('geofence', 'name')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(take);

      rows = docs.map((geo) => [
        geo.eventId || 'N/A',
        geo.geofence?.name || 'Corridor Zone',
        geo.bus?.busName || 'N/A',
        geo.eventType || 'N/A',
        geo.speed || 0,
        geo.timestamp ? new Date(geo.timestamp).toLocaleString() : 'N/A'
      ]);
      summaryTotals = { totalGeofenceEvents: totalCount };
      break;
    }

    default:
      throw new Error(`Invalid report type: '${reportType}'`);
  }

  return { title, headers, rows, totalCount, summaryTotals, page: parseInt(page, 10), limit: parseInt(limit, 10) };
}

// ---------------------------------------------------------------------------
// 10. GET REPORT DATA (GRID PREVIEW WITH PAGINATION)
// ---------------------------------------------------------------------------
async function getReportData(req, res, next) {
  try {
    const { reportType = 'vehicle' } = req.query;
    const user = req.user;

    // Financial permission check
    const financialReports = ['fee-collection', 'pending-fee', 'transport-expense'];
    if (financialReports.includes(reportType)) {
      const allowedRoles = [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.TRANSPORT_ADMIN, ROLES.ACCOUNTS];
      if (!allowedRoles.includes(user.role)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Access denied: You do not have permission to view transport financial reports.'
        });
      }
    }

    const data = await fetchReportData(reportType, req.query, user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `${data.title} generated successfully`,
      data: {
        reportType,
        title: data.title,
        headers: data.headers,
        rows: data.rows,
        pagination: {
          total: data.totalCount,
          page: data.page,
          limit: data.limit,
          totalPages: Math.ceil(data.totalCount / data.limit)
        },
        summaryTotals: data.summaryTotals
      }
    });
  } catch (error) {
    logger.error('Error generating report data:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 11. EXPORT REPORT (PDF, EXCEL XLSX, CSV)
// ---------------------------------------------------------------------------
async function exportReport(req, res, next) {
  try {
    const { reportType = 'vehicle', format = 'csv' } = req.query;
    const user = req.user;

    // RBAC: Check financial permission if financial report
    const financialReports = ['fee-collection', 'pending-fee', 'transport-expense'];
    if (financialReports.includes(reportType)) {
      const allowedRoles = [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.TRANSPORT_ADMIN, ROLES.ACCOUNTS];
      if (!allowedRoles.includes(user.role)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Access denied: You do not have permission to export transport financial reports.'
        });
      }
    }

    // RBAC: Prevent students and parents from exporting administrative fleet/driver data
    if ([ROLES.STUDENT, ROLES.PARENT].includes(user.role)) {
      if (['vehicle', 'driver', 'fuel-consumption', 'vehicle-maintenance', 'transport-expense', 'fee-collection', 'pending-fee'].includes(reportType)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Access denied: Unauthorized to export institutional transport records.'
        });
      }
    }

    const reportData = await fetchReportData(reportType, { ...req.query, isExport: true }, user);

    sendFormattedReport(res, {
      title: reportData.title,
      filenameBase: `transport-${reportType}`,
      headers: reportData.headers,
      rows: reportData.rows,
      format
    });
  } catch (error) {
    logger.error('Error exporting transport report:', error);
    next(error);
  }
}

module.exports = {
  getReportData,
  exportReport
};
