const mongoose = require('mongoose');
const {
  Bus,
  Route,
  Driver,
  StudentTransportAllocation,
  Trip,
  GpsLocation,
  StudentTripAttendance,
  VehicleMaintenance,
  FuelRecord,
  TransportExpense,
  TransportFeeStructure,
  StudentTransportFee,
  EmergencyAlert,
  TransportIncident,
  Geofence,
  GeofenceEvent,
  OverspeedEvent,
  TransportComplaint,
  TransportAnnouncement,
  TransportNotification
} = require('./models');
const User = require('../auth/auth.model');
const Student = require('../students/student.model');
const logger = require('../../utils/logger');
const { HTTP_STATUS, ROLES } = require('@college-erp/shared');

/**
 * Standard Date Range Parser Helper
 */
function resolveDateRange(range, startDate, endDate) {
  const now = new Date();
  let start = null;
  let end = null;

  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      if (end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0) {
        end.setHours(23, 59, 59, 999);
      }
      return { start, end };
    }
  }

  const normalized = (range || 'last30days').toLowerCase();
  switch (normalized) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case 'yesterday':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      break;
    case 'last7days':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      end = new Date(now);
      break;
    case 'last30days':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = new Date(now);
      break;
    case 'thismonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now);
      break;
    case 'lastmonth':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'thisyear':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now);
      break;
    case 'all':
      start = new Date(0);
      end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      break;
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = new Date(now);
  }
  return { start, end };
}

// ---------------------------------------------------------------------------
// 1. EXECUTIVE TRANSPORT DASHBOARD ANALYTICS
// ---------------------------------------------------------------------------
async function getExecutiveAnalytics(req, res, next) {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = resolveDateRange(range, startDate, endDate);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Fleet KPIs
    const [
      totalVehicles,
      activeVehicles,
      inactiveVehicles,
      maintenanceVehicles,
      totalDrivers,
      activeDrivers,
      totalStudents,
      activeRoutes
    ] = await Promise.all([
      Bus.countDocuments(),
      Bus.countDocuments({ currentStatus: 'active' }),
      Bus.countDocuments({ currentStatus: { $in: ['inactive', 'decommissioned'] } }),
      Bus.countDocuments({ currentStatus: 'under_maintenance' }),
      Driver.countDocuments(),
      Driver.countDocuments({ employmentStatus: 'active' }),
      StudentTransportAllocation.countDocuments({ allocationStatus: 'active' }),
      Route.countDocuments({ status: 'active' })
    ]);

    // Today's Trip & Attendance KPIs
    const [
      todayScheduledTrips,
      todayCompletedTrips,
      todayCancelledTrips,
      todayAttendanceRecords
    ] = await Promise.all([
      Trip.countDocuments({ tripDate: { $gte: todayStart, $lte: todayEnd } }),
      Trip.countDocuments({ tripDate: { $gte: todayStart, $lte: todayEnd }, tripStatus: 'completed' }),
      Trip.countDocuments({ tripDate: { $gte: todayStart, $lte: todayEnd }, tripStatus: 'cancelled' }),
      StudentTripAttendance.find({ createdAt: { $gte: todayStart, $lte: todayEnd } }).select('boardingStatus')
    ]);

    const todayBoarded = todayAttendanceRecords.filter((r) => r.boardingStatus === 'Boarded').length;
    const todayAttendanceRate =
      todayAttendanceRecords.length > 0
        ? Math.round((todayBoarded / todayAttendanceRecords.length) * 100)
        : 0;

    // Financial & Incident KPIs within selected date range
    const [fuelAgg, maintAgg, feeAgg, totalSafetyIncidents] = await Promise.all([
      FuelRecord.aggregate([
        { $match: { fuelDate: { $gte: start, $lte: end } } },
        { $group: { _id: null, totalFuelCost: { $sum: '$totalCost' }, totalQuantity: { $sum: '$quantityLiters' } } }
      ]),
      VehicleMaintenance.aggregate([
        { $match: { serviceDate: { $gte: start, $lte: end } } },
        { $group: { _id: null, totalMaintCost: { $sum: '$cost' } } }
      ]),
      StudentTransportFee.aggregate([
        {
          $group: {
            _id: null,
            totalDemand: { $sum: '$totalFee' },
            totalCollected: { $sum: '$totalPaid' },
            totalPending: { $sum: '$pendingBalance' }
          }
        }
      ]),
      TransportIncident.countDocuments({ createdAt: { $gte: start, $lte: end } })
    ]);

    const totalFuelExpenses = fuelAgg[0]?.totalFuelCost || 0;
    const totalMaintenanceExpenses = maintAgg[0]?.totalMaintCost || 0;
    const pendingTransportFees = feeAgg[0]?.totalPending || 0;
    const totalCollectedFees = feeAgg[0]?.totalCollected || 0;
    const totalFeeDemand = feeAgg[0]?.totalDemand || 0;

    // Monthly Expenses Trend (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [monthlyFuel, monthlyMaint, monthlyExpenses] = await Promise.all([
      FuelRecord.aggregate([
        { $match: { fuelDate: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$fuelDate' } },
            amount: { $sum: '$totalCost' },
            liters: { $sum: '$quantityLiters' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      VehicleMaintenance.aggregate([
        { $match: { serviceDate: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$serviceDate' } },
            amount: { $sum: '$cost' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      TransportExpense.aggregate([
        { $match: { expenseDate: { $gte: sixMonthsAgo }, status: 'Approved' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$expenseDate' } },
            amount: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Merge monthly trends
    const monthKeys = new Set([
      ...monthlyFuel.map((m) => m._id),
      ...monthlyMaint.map((m) => m._id),
      ...monthlyExpenses.map((m) => m._id)
    ]);
    const monthlyTransportExpenses = Array.from(monthKeys)
      .sort()
      .map((mKey) => {
        const fuel = monthlyFuel.find((m) => m._id === mKey)?.amount || 0;
        const maint = monthlyMaint.find((m) => m._id === mKey)?.amount || 0;
        const other = monthlyExpenses.find((m) => m._id === mKey)?.amount || 0;
        return {
          month: mKey,
          fuelCost: fuel,
          maintenanceCost: maint,
          otherExpenses: other,
          total: fuel + maint + other
        };
      });

    // Route-wise Student Distribution
    const routeDistribution = await StudentTransportAllocation.aggregate([
      { $match: { allocationStatus: 'active' } },
      { $group: { _id: '$route', studentCount: { $sum: 1 } } },
      { $lookup: { from: 'routes', localField: '_id', foreignField: '_id', as: 'routeDoc' } },
      { $unwind: { path: '$routeDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          routeId: '$_id',
          routeName: { $ifNull: ['$routeDoc.routeName', 'Unassigned Route'] },
          routeCode: { $ifNull: ['$routeDoc.routeCode', 'N/A'] },
          studentCount: 1
        }
      },
      { $sort: { studentCount: -1 } },
      { $limit: 10 }
    ]);

    // Safety Incident Trends (by Category)
    const incidentsByCategory = await TransportIncident.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Executive transport analytics retrieved successfully',
      dateRange: { start, end, range: range || 'last30days' },
      kpis: {
        totalVehicles,
        activeVehicles,
        inactiveVehicles,
        maintenanceVehicles,
        totalDrivers,
        activeDrivers,
        totalStudents,
        activeRoutes,
        todayScheduledTrips,
        todayCompletedTrips,
        todayCancelledTrips,
        todayAttendanceRate,
        totalFuelExpenses,
        totalMaintenanceExpenses,
        pendingTransportFees,
        totalCollectedFees,
        totalFeeDemand,
        totalSafetyIncidents
      },
      visualizations: {
        monthlyTransportExpenses,
        routeDistribution,
        incidentsByCategory,
        feeCollectionSummary: {
          totalDemand: totalFeeDemand,
          totalCollected: totalCollectedFees,
          totalPending: pendingTransportFees,
          collectionPercentage: totalFeeDemand > 0 ? Math.round((totalCollectedFees / totalFeeDemand) * 100) : 0
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching executive analytics:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 2. FLEET & VEHICLE ANALYTICS
// ---------------------------------------------------------------------------
async function getFleetAnalytics(req, res, next) {
  try {
    const { vehicleType, status, busId, search, range, startDate, endDate } = req.query;
    const { start, end } = resolveDateRange(range, startDate, endDate);

    const busQuery = {};
    if (status && status !== 'all') busQuery.currentStatus = status;
    if (vehicleType && vehicleType !== 'all') busQuery.vehicleType = vehicleType;
    if (busId) busQuery._id = busId;
    if (search) {
      busQuery.$or = [
        { busName: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
        { busId: { $regex: search, $options: 'i' } }
      ];
    }

    const buses = await Bus.find(busQuery).populate('assignedDriver', 'fullName contactNumber driverId');

    const totalFleet = await Bus.countDocuments();
    const activeFleet = await Bus.countDocuments({ currentStatus: 'active' });
    const inactiveFleet = await Bus.countDocuments({ currentStatus: { $in: ['inactive', 'decommissioned'] } });
    const maintenanceFleet = await Bus.countDocuments({ currentStatus: 'under_maintenance' });

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Compute vehicle-level metrics
    const vehicleAnalytics = await Promise.all(
      buses.map(async (bus) => {
        const [
          completedTrips,
          fuelRecords,
          maintenanceRecords,
          activeAllocations,
          incidentsCount
        ] = await Promise.all([
          Trip.countDocuments({ bus: bus._id, tripStatus: 'completed', tripDate: { $gte: start, $lte: end } }),
          FuelRecord.find({ bus: bus._id, fuelDate: { $gte: start, $lte: end } }).select('quantityLiters totalCost odometerKm'),
          VehicleMaintenance.find({ bus: bus._id, serviceDate: { $gte: start, $lte: end } }).select('cost serviceType status'),
          StudentTransportAllocation.countDocuments({ bus: bus._id, allocationStatus: 'active' }),
          TransportIncident.countDocuments({ bus: bus._id, createdAt: { $gte: start, $lte: end } })
        ]);

        const totalFuelLiters = fuelRecords.reduce((acc, f) => acc + (f.quantityLiters || 0), 0);
        const totalFuelCost = fuelRecords.reduce((acc, f) => acc + (f.totalCost || 0), 0);
        const totalMaintenanceCost = maintenanceRecords.reduce((acc, m) => acc + (m.cost || 0), 0);

        // Document Expiry Alerts for this bus
        const docs = bus.documents || {};
        const documentStatuses = [];
        ['fitnessCertificate', 'insurancePolicy', 'pollutionCertificate', 'roadPermit'].forEach((docKey) => {
          const doc = docs[docKey];
          if (doc?.expiryDate) {
            const exp = new Date(doc.expiryDate);
            let state = 'valid';
            if (exp < now) state = 'expired';
            else if (exp <= thirtyDaysFromNow) state = 'expiring_soon';
            documentStatuses.push({ docName: docKey, expiryDate: doc.expiryDate, status: state });
          }
        });

        const capacity = bus.capacity || 40;
        const capacityUtilization = Math.min(100, Math.round((activeAllocations / capacity) * 100));

        return {
          _id: bus._id,
          busId: bus.busId,
          busName: bus.busName,
          registrationNumber: bus.registrationNumber,
          vehicleType: bus.vehicleType,
          currentStatus: bus.currentStatus,
          capacity,
          allocatedStudents: activeAllocations,
          capacityUtilization,
          assignedDriver: bus.assignedDriver
            ? { name: bus.assignedDriver.fullName, phone: bus.assignedDriver.contactNumber }
            : null,
          metrics: {
            completedTrips,
            totalFuelLiters,
            totalFuelCost,
            totalMaintenanceCost,
            totalOperatingCost: totalFuelCost + totalMaintenanceCost,
            maintenanceCount: maintenanceRecords.length,
            incidentsCount
          },
          documentStatuses
        };
      })
    );

    const totalFleetCapacity = buses.reduce((acc, b) => acc + (b.capacity || 40), 0);
    const totalAllocatedStudents = vehicleAnalytics.reduce((acc, v) => acc + v.allocatedStudents, 0);
    const overallCapacityUtilization =
      totalFleetCapacity > 0 ? Math.round((totalAllocatedStudents / totalFleetCapacity) * 100) : 0;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Fleet analytics retrieved successfully',
      summary: {
        totalFleet,
        activeFleet,
        inactiveFleet,
        maintenanceFleet,
        totalFleetCapacity,
        totalAllocatedStudents,
        overallCapacityUtilization
      },
      vehicles: vehicleAnalytics
    });
  } catch (error) {
    logger.error('Error fetching fleet analytics:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 3. ROUTE PERFORMANCE ANALYTICS
// ---------------------------------------------------------------------------
async function getRouteAnalytics(req, res, next) {
  try {
    const { routeId, status, range, startDate, endDate } = req.query;
    const { start, end } = resolveDateRange(range, startDate, endDate);

    const routeQuery = {};
    if (status && status !== 'all') routeQuery.status = status;
    if (routeId) routeQuery._id = routeId;

    const routes = await Route.find(routeQuery);

    const routeMetrics = await Promise.all(
      routes.map(async (route) => {
        const [
          assignedStudents,
          assignedBuses,
          completedTrips,
          cancelledTrips,
          allAttendance
        ] = await Promise.all([
          StudentTransportAllocation.countDocuments({ route: route._id, allocationStatus: 'active' }),
          Bus.countDocuments({ assignedRoute: route._id }),
          Trip.find({ route: route._id, tripStatus: 'completed', tripDate: { $gte: start, $lte: end } }).select('actualDeparture actualArrival scheduledDeparture scheduledArrival'),
          Trip.countDocuments({ route: route._id, tripStatus: 'cancelled', tripDate: { $gte: start, $lte: end } }),
          StudentTripAttendance.find({ route: route._id, createdAt: { $gte: start, $lte: end } }).select('boardingStatus')
        ]);

        // Calculate average duration in minutes for completed trips
        let totalDurationMin = 0;
        let validDurationTrips = 0;
        completedTrips.forEach((t) => {
          if (t.actualDeparture && t.actualArrival) {
            const diff = (new Date(t.actualArrival) - new Date(t.actualDeparture)) / (1000 * 60);
            if (diff > 0 && diff < 300) {
              totalDurationMin += diff;
              validDurationTrips += 1;
            }
          }
        });
        const averageDurationMinutes =
          validDurationTrips > 0 ? Math.round(totalDurationMin / validDurationTrips) : 0;

        const boardedCount = allAttendance.filter((a) => a.boardingStatus === 'Boarded').length;
        const attendancePercentage =
          allAttendance.length > 0 ? Math.round((boardedCount / allAttendance.length) * 100) : 0;

        const totalScheduledTrips = completedTrips.length + cancelledTrips;
        const tripCompletionRate =
          totalScheduledTrips > 0 ? Math.round((completedTrips.length / totalScheduledTrips) * 100) : 100;

        return {
          _id: route._id,
          routeName: route.routeName,
          routeCode: route.routeCode,
          startLocation: route.startLocation,
          endLocation: route.endLocation,
          totalDistanceKm: route.totalDistanceKm || 0,
          stopsCount: route.stops?.length || 0,
          status: route.status,
          assignedStudents,
          assignedBuses,
          completedTripsCount: completedTrips.length,
          cancelledTripsCount: cancelledTrips,
          tripCompletionRate,
          averageDurationMinutes,
          attendancePercentage
        };
      })
    );

    // Sort by assigned students descending
    const topRoutes = [...routeMetrics].sort((a, b) => b.assignedStudents - a.assignedStudents).slice(0, 10);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Route performance analytics retrieved successfully',
      totalRoutes: routes.length,
      topRoutes,
      routes: routeMetrics
    });
  } catch (error) {
    logger.error('Error fetching route analytics:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 4. DRIVER PERFORMANCE ANALYTICS
// ---------------------------------------------------------------------------
async function getDriverAnalytics(req, res, next) {
  try {
    const { driverId, employmentStatus, range, startDate, endDate } = req.query;
    const { start, end } = resolveDateRange(range, startDate, endDate);

    const driverQuery = {};
    if (employmentStatus && employmentStatus !== 'all') driverQuery.employmentStatus = employmentStatus;
    if (driverId) driverQuery._id = driverId;

    const drivers = await Driver.find(driverQuery).populate('assignedBus', 'busName registrationNumber');

    const driverAnalytics = await Promise.all(
      drivers.map(async (driver) => {
        const [
          completedTrips,
          cancelledTrips,
          overspeedCount,
          incidentsCount
        ] = await Promise.all([
          Trip.countDocuments({ driver: driver._id, tripStatus: 'completed', tripDate: { $gte: start, $lte: end } }),
          Trip.countDocuments({ driver: driver._id, tripStatus: 'cancelled', tripDate: { $gte: start, $lte: end } }),
          OverspeedEvent.countDocuments({
            $or: [{ driver: driver._id }, { bus: driver.assignedBus?._id }],
            timestamp: { $gte: start, $lte: end }
          }),
          TransportIncident.countDocuments({
            $or: [{ driver: driver._id }, { bus: driver.assignedBus?._id }],
            createdAt: { $gte: start, $lte: end }
          })
        ]);

        // Documented Transparent Performance Score Formula:
        // Base = 100
        // - (Cancelled Trips * 5)
        // - (Overspeed Violations * 3)
        // - (Safety Incidents * 10)
        // + (Completed Trips * 0.5)
        // Clamped between 0 and 100
        const rawScore = 100 - (cancelledTrips * 5) - (overspeedCount * 3) - (incidentsCount * 10) + (completedTrips * 0.5);
        const performanceScore = Math.max(0, Math.min(100, Math.round(rawScore)));

        let performanceGrade = 'A';
        if (performanceScore < 60) performanceGrade = 'F';
        else if (performanceScore < 70) performanceGrade = 'D';
        else if (performanceScore < 80) performanceGrade = 'C';
        else if (performanceScore < 90) performanceGrade = 'B';

        return {
          _id: driver._id,
          driverId: driver.driverId,
          fullName: driver.fullName,
          licenseNumber: driver.licenseNumber,
          contactNumber: driver.contactNumber,
          employmentStatus: driver.employmentStatus,
          assignedBus: driver.assignedBus
            ? { busName: driver.assignedBus.busName, registrationNumber: driver.assignedBus.registrationNumber }
            : null,
          metrics: {
            completedTrips,
            cancelledTrips,
            overspeedCount,
            incidentsCount,
            performanceScore,
            performanceGrade
          }
        };
      })
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Driver performance analytics retrieved successfully',
      totalDrivers: drivers.length,
      drivers: driverAnalytics
    });
  } catch (error) {
    logger.error('Error fetching driver analytics:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 5. STUDENT TRANSPORT ANALYTICS
// ---------------------------------------------------------------------------
async function getStudentTransportAnalytics(req, res, next) {
  try {
    const user = req.user;
    const { routeId, department, search, range, startDate, endDate } = req.query;
    const { start, end } = resolveDateRange(range, startDate, endDate);

    // If student or parent, restrict strictly to their own data
    let filter = {};
    if (user.role === ROLES.STUDENT) {
      filter.$or = [{ student: user._id }, { rollNumber: user.rollNumber }];
    } else if (user.role === ROLES.PARENT) {
      filter.$or = [{ guardianPhone: user.email }, { guardianName: user.name }, { guardianPhone: user.phone || 'N/A' }];
    } else {
      if (routeId) filter.route = routeId;
      if (department) filter.department = department;
      if (search) {
        filter.$or = [
          { studentName: { $regex: search, $options: 'i' } },
          { rollNumber: { $regex: search, $options: 'i' } },
          { pickupStop: { $regex: search, $options: 'i' } }
        ];
      }
    }

    const allocations = await StudentTransportAllocation.find(filter)
      .populate('route', 'routeName routeCode')
      .populate('bus', 'busName registrationNumber');

    const totalStudents = allocations.length;
    const activeAllocations = allocations.filter((a) => a.allocationStatus === 'active').length;

    // Route-wise student distribution
    const routeCounts = {};
    const stopCounts = {};
    const departmentCounts = {};

    allocations.forEach((alloc) => {
      const rName = alloc.route?.routeName || 'Unassigned';
      routeCounts[rName] = (routeCounts[rName] || 0) + 1;

      const stop = alloc.pickupStop || 'Unassigned Stop';
      stopCounts[stop] = (stopCounts[stop] || 0) + 1;

      const dept = alloc.department || 'General';
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    });

    // Attendance summary for these students
    const rollNumbers = allocations.map((a) => a.rollNumber);
    const attendanceRecords = await StudentTripAttendance.find({
      rollNumber: { $in: rollNumbers },
      createdAt: { $gte: start, $lte: end }
    }).select('rollNumber boardingStatus dropStatus');

    const totalAttendanceMarks = attendanceRecords.length;
    const boardedMarks = attendanceRecords.filter((a) => a.boardingStatus === 'Boarded').length;
    const dropMarks = attendanceRecords.filter((a) => a.dropStatus === 'Dropped').length;
    const absentMarks = attendanceRecords.filter((a) => a.boardingStatus === 'Absent').length;

    // Fee breakdown for these students
    const feeRecords = await StudentTransportFee.find({ rollNumber: { $in: rollNumbers } }).select('paymentStatus totalFee totalPaid pendingBalance');
    const feeStatusCounts = {
      paid: feeRecords.filter((f) => f.paymentStatus === 'paid').length,
      partial: feeRecords.filter((f) => f.paymentStatus === 'partial').length,
      pending: feeRecords.filter((f) => f.paymentStatus === 'pending' || f.paymentStatus === 'overdue').length
    };

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Student transport analytics retrieved successfully',
      summary: {
        totalStudents,
        activeAllocations,
        totalAttendanceMarks,
        boardedCount: boardedMarks,
        droppedCount: dropMarks,
        absentCount: absentMarks,
        boardingRate: totalAttendanceMarks > 0 ? Math.round((boardedMarks / totalAttendanceMarks) * 100) : 0
      },
      distributions: {
        byRoute: routeCounts,
        byStop: stopCounts,
        byDepartment: departmentCounts,
        byFeeStatus: feeStatusCounts
      },
      allocations: user.role === ROLES.STUDENT || user.role === ROLES.PARENT ? allocations : undefined
    });
  } catch (error) {
    logger.error('Error fetching student transport analytics:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 6. TRIP & ATTENDANCE ANALYTICS
// ---------------------------------------------------------------------------
async function getTripAndAttendanceAnalytics(req, res, next) {
  try {
    const { routeId, busId, driverId, tripStatus, range, startDate, endDate } = req.query;
    const { start, end } = resolveDateRange(range, startDate, endDate);

    const tripQuery = { tripDate: { $gte: start, $lte: end } };
    if (routeId) tripQuery.route = routeId;
    if (busId) tripQuery.bus = busId;
    if (driverId) tripQuery.driver = driverId;
    if (tripStatus && tripStatus !== 'all') tripQuery.tripStatus = tripStatus;

    const trips = await Trip.find(tripQuery).populate('route', 'routeName routeCode').populate('bus', 'busName registrationNumber');

    const totalScheduled = trips.length;
    const completedTrips = trips.filter((t) => t.tripStatus === 'completed');
    const cancelledTrips = trips.filter((t) => t.tripStatus === 'cancelled');
    const inProgressTrips = trips.filter((t) => t.tripStatus === 'in_progress');

    // Delayed Trips Analysis: scheduledDeparture < actualDeparture by >= 5 minutes
    let delayedTripsCount = 0;
    trips.forEach((t) => {
      if (t.scheduledDeparture && t.actualDeparture) {
        const diffMinutes = (new Date(t.actualDeparture) - new Date(t.scheduledDeparture)) / (1000 * 60);
        if (diffMinutes >= 5) delayedTripsCount += 1;
      }
    });

    const completionRate = totalScheduled > 0 ? Math.round((completedTrips.length / totalScheduled) * 100) : 0;

    // Student Attendance for these trips
    const tripIds = trips.map((t) => t._id);
    const attendanceRecords = await StudentTripAttendance.find({ trip: { $in: tripIds } }).select('boardingStatus dropStatus trip');

    const totalBoarded = attendanceRecords.filter((a) => a.boardingStatus === 'Boarded').length;
    const totalDropped = attendanceRecords.filter((a) => a.dropStatus === 'Dropped').length;
    const totalAbsent = attendanceRecords.filter((a) => a.boardingStatus === 'Absent').length;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Trip and attendance analytics retrieved successfully',
      tripsSummary: {
        totalScheduled,
        completedCount: completedTrips.length,
        cancelledCount: cancelledTrips.length,
        inProgressCount: inProgressTrips.length,
        delayedCount: delayedTripsCount,
        completionRate
      },
      attendanceSummary: {
        totalRecords: attendanceRecords.length,
        boardedCount: totalBoarded,
        droppedCount: totalDropped,
        absentCount: totalAbsent,
        attendanceRate: attendanceRecords.length > 0 ? Math.round((totalBoarded / attendanceRecords.length) * 100) : 0
      }
    });
  } catch (error) {
    logger.error('Error fetching trip and attendance analytics:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 7. FUEL & MAINTENANCE COST ANALYTICS
// ---------------------------------------------------------------------------
async function getFuelAndMaintenanceAnalytics(req, res, next) {
  try {
    const { busId, range, startDate, endDate } = req.query;
    const { start, end } = resolveDateRange(range, startDate, endDate);

    const fuelQuery = { fuelDate: { $gte: start, $lte: end } };
    const maintQuery = { serviceDate: { $gte: start, $lte: end } };
    if (busId) {
      fuelQuery.bus = busId;
      maintQuery.bus = busId;
    }

    const [fuelRecords, maintRecords, buses] = await Promise.all([
      FuelRecord.find(fuelQuery).populate('bus', 'busName registrationNumber'),
      VehicleMaintenance.find(maintQuery).populate('bus', 'busName registrationNumber'),
      Bus.find().select('busName registrationNumber currentStatus')
    ]);

    const totalFuelExpenses = fuelRecords.reduce((acc, f) => acc + (f.totalCost || 0), 0);
    const totalFuelLiters = fuelRecords.reduce((acc, f) => acc + (f.quantityLiters || 0), 0);
    const totalMaintenanceExpenses = maintRecords.reduce((acc, m) => acc + (m.cost || 0), 0);

    // Vehicle-wise Breakdown
    const vehicleCostMap = {};
    fuelRecords.forEach((f) => {
      const bKey = f.bus ? `${f.bus.busName} (${f.bus.registrationNumber})` : 'Unknown Vehicle';
      if (!vehicleCostMap[bKey]) vehicleCostMap[bKey] = { fuelCost: 0, fuelLiters: 0, maintCost: 0 };
      vehicleCostMap[bKey].fuelCost += f.totalCost || 0;
      vehicleCostMap[bKey].fuelLiters += f.quantityLiters || 0;
    });

    maintRecords.forEach((m) => {
      const bKey = m.bus ? `${m.bus.busName} (${m.bus.registrationNumber})` : 'Unknown Vehicle';
      if (!vehicleCostMap[bKey]) vehicleCostMap[bKey] = { fuelCost: 0, fuelLiters: 0, maintCost: 0 };
      vehicleCostMap[bKey].maintCost += m.cost || 0;
    });

    const vehicleCostComparison = Object.entries(vehicleCostMap).map(([vehicle, data]) => ({
      vehicle,
      fuelCost: data.fuelCost,
      fuelLiters: data.fuelLiters,
      maintenanceCost: data.maintCost,
      totalOperatingCost: data.fuelCost + data.maintCost
    }));

    // Maintenance by Type Breakdown
    const maintTypeMap = {};
    maintRecords.forEach((m) => {
      const t = m.serviceType || 'Routine';
      maintTypeMap[t] = (maintTypeMap[t] || 0) + (m.cost || 0);
    });

    // Upcoming and Overdue Maintenance
    const now = new Date();
    const upcomingMaintCount = await VehicleMaintenance.countDocuments({
      status: 'Scheduled',
      scheduledDate: { $gte: now }
    });
    const overdueMaintCount = await VehicleMaintenance.countDocuments({
      status: 'Scheduled',
      scheduledDate: { $lt: now }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Fuel and maintenance cost analytics retrieved successfully',
      summary: {
        totalFuelExpenses,
        totalFuelLiters,
        totalMaintenanceExpenses,
        totalOperatingCost: totalFuelExpenses + totalMaintenanceExpenses,
        averageFuelRate: totalFuelLiters > 0 ? (totalFuelExpenses / totalFuelLiters).toFixed(2) : 0,
        upcomingMaintCount,
        overdueMaintCount
      },
      vehicleCostComparison,
      maintenanceByType: maintTypeMap
    });
  } catch (error) {
    logger.error('Error fetching fuel and maintenance analytics:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 8. TRANSPORT FINANCIAL ANALYTICS
// ---------------------------------------------------------------------------
async function getFinancialAnalytics(req, res, next) {
  try {
    const { academicYear, range, startDate, endDate } = req.query;
    const { start, end } = resolveDateRange(range, startDate, endDate);

    const feeQuery = {};
    if (academicYear) feeQuery.academicYear = academicYear;

    const [feeRecords, fuelAgg, maintAgg, otherExpenseAgg] = await Promise.all([
      StudentTransportFee.find(feeQuery).select('totalFee totalPaid pendingBalance paymentStatus payments academicYear'),
      FuelRecord.aggregate([
        { $match: { fuelDate: { $gte: start, $lte: end } } },
        { $group: { _id: null, totalFuelCost: { $sum: '$totalCost' } } }
      ]),
      VehicleMaintenance.aggregate([
        { $match: { serviceDate: { $gte: start, $lte: end } } },
        { $group: { _id: null, totalMaintCost: { $sum: '$cost' } } }
      ]),
      TransportExpense.aggregate([
        { $match: { expenseDate: { $gte: start, $lte: end }, status: 'Approved' } },
        { $group: { _id: null, totalOtherCost: { $sum: '$amount' } } }
      ])
    ]);

    const totalFeeDemand = feeRecords.reduce((acc, f) => acc + (f.totalFee || 0), 0);
    const totalCollectedAmount = feeRecords.reduce((acc, f) => acc + (f.totalPaid || 0), 0);
    const totalPendingAmount = feeRecords.reduce((acc, f) => acc + (f.pendingBalance || 0), 0);
    const collectionPercentage =
      totalFeeDemand > 0 ? Math.round((totalCollectedAmount / totalFeeDemand) * 100) : 0;

    // Payment Methods Breakdown from recorded payment transactions
    const paymentMethodsMap = {};
    feeRecords.forEach((rec) => {
      (rec.payments || []).forEach((p) => {
        const method = p.paymentMethod || 'Online';
        paymentMethodsMap[method] = (paymentMethodsMap[method] || 0) + (p.amount || 0);
      });
    });

    const totalFuelExpenses = fuelAgg[0]?.totalFuelCost || 0;
    const totalMaintenanceExpenses = maintAgg[0]?.totalMaintCost || 0;
    const totalOtherExpenses = otherExpenseAgg[0]?.totalOtherCost || 0;
    const totalOperatingCost = totalFuelExpenses + totalMaintenanceExpenses + totalOtherExpenses;

    // Net Operating Margin & Cost Recovery Ratio
    const netMargin = totalCollectedAmount - totalOperatingCost;
    const costRecoveryRatio =
      totalOperatingCost > 0 ? ((totalCollectedAmount / totalOperatingCost) * 100).toFixed(1) : '100.0';

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Transport financial analytics retrieved successfully',
      revenue: {
        totalFeeDemand,
        totalCollectedAmount,
        totalPendingAmount,
        collectionPercentage,
        paymentMethods: paymentMethodsMap
      },
      operatingExpenses: {
        fuelExpenses: totalFuelExpenses,
        maintenanceExpenses: totalMaintenanceExpenses,
        otherExpenses: totalOtherExpenses,
        totalOperatingCost
      },
      financialHealth: {
        netMargin,
        costRecoveryRatio: `${costRecoveryRatio}%`,
        isProfitable: netMargin >= 0
      }
    });
  } catch (error) {
    logger.error('Error fetching financial analytics:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 9. SAFETY & INCIDENT ANALYTICS
// ---------------------------------------------------------------------------
async function getSafetyAnalytics(req, res, next) {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = resolveDateRange(range, startDate, endDate);

    const [
      totalIncidents,
      openIncidents,
      resolvedIncidents,
      emergencyAlertsCount,
      overspeedEventsCount,
      geofenceEventsCount,
      incidents
    ] = await Promise.all([
      TransportIncident.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      TransportIncident.countDocuments({ createdAt: { $gte: start, $lte: end }, status: { $in: ['Reported', 'Under Investigation', 'Pending Action'] } }),
      TransportIncident.countDocuments({ createdAt: { $gte: start, $lte: end }, status: { $in: ['Resolved', 'Closed'] } }),
      EmergencyAlert.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      OverspeedEvent.countDocuments({ timestamp: { $gte: start, $lte: end } }),
      GeofenceEvent.countDocuments({ timestamp: { $gte: start, $lte: end } }),
      TransportIncident.find({ createdAt: { $gte: start, $lte: end } }).select('category severity status reportedAt resolvedAt')
    ]);

    // Breakdown by Category
    const categoryMap = {};
    const severityMap = {};
    let totalResolutionHours = 0;
    let resolvedWithTimesCount = 0;

    incidents.forEach((inc) => {
      const cat = inc.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;

      const sev = inc.severity || 'Medium';
      severityMap[sev] = (severityMap[sev] || 0) + 1;

      if (inc.reportedAt && inc.resolvedAt) {
        const diffHrs = (new Date(inc.resolvedAt) - new Date(inc.reportedAt)) / (1000 * 60 * 60);
        if (diffHrs > 0 && diffHrs < 720) {
          totalResolutionHours += diffHrs;
          resolvedWithTimesCount += 1;
        }
      }
    });

    const averageResolutionHours =
      resolvedWithTimesCount > 0 ? Math.round(totalResolutionHours / resolvedWithTimesCount) : 0;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Safety and incident analytics retrieved successfully',
      summary: {
        totalIncidents,
        openIncidents,
        resolvedIncidents,
        emergencyAlertsCount,
        overspeedEventsCount,
        geofenceEventsCount,
        averageResolutionHours
      },
      breakdowns: {
        byCategory: categoryMap,
        bySeverity: severityMap
      }
    });
  } catch (error) {
    logger.error('Error fetching safety analytics:', error);
    next(error);
  }
}

module.exports = {
  resolveDateRange,
  getExecutiveAnalytics,
  getFleetAnalytics,
  getRouteAnalytics,
  getDriverAnalytics,
  getStudentTransportAnalytics,
  getTripAndAttendanceAnalytics,
  getFuelAndMaintenanceAnalytics,
  getFinancialAnalytics,
  getSafetyAnalytics
};

