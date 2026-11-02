const {
  Bus,
  Route,
  Driver,
  StudentTransportAllocation,
  TransportSetting,
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
  TransportNotification,
  NotificationPreference
} = require('./models');
const Student = require('../students/student.model');
const User = require('../auth/auth.model');
const {
  validateBusInput,
  validateRouteInput,
  validateDriverInput,
  validateAllocationInput,
  validateTripInput,
  validateGpsInput,
  validateAttendanceInput,
  validateAttendanceCorrection,
  validateMaintenanceInput,
  validateFuelInput,
  validateExpenseInput,
  validateFeeStructureInput,
  validatePaymentInput,
  validateSosAlertInput,
  validateIncidentInput,
  validateGeofenceInput,
  validateComplaintInput,
  validateAnnouncementInput
} = require('./transport.validator');
const { HTTP_STATUS } = require('@college-erp/shared');
const logger = require('../../utils/logger');
const { recordAuditLog } = require('../../utils/auditLogger');

// ---------------------------------------------------------------------------
// 1. DASHBOARD & SUMMARY APIS
// ---------------------------------------------------------------------------

async function getTransportSummary(req, res, next) {
  try {
    const [
      totalBuses,
      activeBuses,
      inactiveBuses,
      maintenanceBuses,
      totalRoutes,
      activeRoutes,
      totalDrivers,
      availableDrivers,
      totalAllocations,
      activeAllocations,
      pendingFeeAllocations,
      allBuses,
      routesWithAllocations
    ] = await Promise.all([
      Bus.countDocuments(),
      Bus.countDocuments({ currentStatus: 'active' }),
      Bus.countDocuments({ currentStatus: 'inactive' }),
      Bus.countDocuments({ currentStatus: { $in: ['under_maintenance', 'out_of_service'] } }),
      Route.countDocuments(),
      Route.countDocuments({ routeStatus: 'active' }),
      Driver.countDocuments({ staffType: 'driver' }),
      Driver.countDocuments({ staffType: 'driver', availabilityStatus: 'available', employmentStatus: 'active' }),
      StudentTransportAllocation.countDocuments(),
      StudentTransportAllocation.countDocuments({ allocationStatus: 'active' }),
      StudentTransportAllocation.countDocuments({ allocationStatus: 'active', transportFeeStatus: 'pending' }),
      Bus.find({ currentStatus: 'active' }).select('seatingCapacity busId busName'),
      Route.find({ routeStatus: 'active' }).select('routeName routeCode startingPoint destination')
    ]);

    // Calculate total capacity of active buses
    const totalCapacity = allBuses.reduce((sum, b) => sum + (b.seatingCapacity || 0), 0);
    const availableCapacity = Math.max(0, totalCapacity - activeAllocations);
    const capacityUtilization = totalCapacity > 0 ? Number(((activeAllocations / totalCapacity) * 100).toFixed(1)) : 0;

    // Route-wise student distribution
    const routeCounts = await StudentTransportAllocation.aggregate([
      { $match: { allocationStatus: 'active' } },
      { $group: { _id: '$route', count: { $sum: 1 } } }
    ]);
    const routeMap = new Map();
    routeCounts.forEach(rc => {
      if (rc._id) routeMap.set(String(rc._id), rc.count);
    });

    const routeDistribution = routesWithAllocations.map(r => ({
      routeId: r._id,
      routeName: r.routeName,
      routeCode: r.routeCode,
      destination: r.destination,
      studentCount: routeMap.get(String(r._id)) || 0
    }));

    // Driver availability breakdown
    const driverStats = await Driver.aggregate([
      { $group: { _id: '$availabilityStatus', count: { $sum: 1 } } }
    ]);
    const driverAvailability = {
      available: 0,
      on_duty: 0,
      off_duty: 0,
      sick_leave: 0
    };
    driverStats.forEach(ds => {
      if (driverAvailability.hasOwnProperty(ds._id)) {
        driverAvailability[ds._id] = ds.count;
      }
    });

    // Bus status overview breakdown
    const busStats = await Bus.aggregate([
      { $group: { _id: '$currentStatus', count: { $sum: 1 } } }
    ]);
    const busStatusOverview = {
      active: 0,
      inactive: 0,
      under_maintenance: 0,
      out_of_service: 0
    };
    busStats.forEach(bs => {
      if (busStatusOverview.hasOwnProperty(bs._id)) {
        busStatusOverview[bs._id] = bs.count;
      }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        summary: {
          totalBuses,
          activeBuses,
          inactiveBuses,
          pendingMaintenance: maintenanceBuses,
          totalRoutes,
          activeRoutes,
          totalDrivers,
          availableDrivers,
          totalTransportStudents: totalAllocations,
          assignedStudents: activeAllocations,
          availableBusCapacity: availableCapacity,
          totalBusCapacity: totalCapacity,
          capacityUtilization,
          pendingTransportFees: pendingFeeAllocations
        },
        charts: {
          busStatusOverview,
          routeDistribution,
          driverAvailability,
          capacityUtilization: {
            utilized: activeAllocations,
            available: availableCapacity,
            total: totalCapacity,
            percentage: capacityUtilization
          }
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching transport summary:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 2. BUS MANAGEMENT APIS
// ---------------------------------------------------------------------------

async function getBuses(req, res, next) {
  try {
    const { status, busType, search, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.currentStatus = status;
    }
    if (busType && busType !== 'all') {
      query.busType = busType;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { busId: regex },
        { registrationNumber: regex },
        { busName: regex },
        { manufacturer: regex }
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const total = await Bus.countDocuments(query);
    const buses = await Bus.find(query)
      .populate('assignedRoute', 'routeName routeCode startingPoint destination')
      .populate('assignedDriver', 'fullName phoneNumber availabilityStatus')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit, 10));

    // Attach active allocated student counts per bus
    const busIds = buses.map(b => b._id);
    const allocationCounts = await StudentTransportAllocation.aggregate([
      { $match: { bus: { $in: busIds }, allocationStatus: 'active' } },
      { $group: { _id: '$bus', count: { $sum: 1 } } }
    ]);
    const allocationMap = new Map();
    allocationCounts.forEach(ac => allocationMap.set(String(ac._id), ac.count));

    const enrichedBuses = buses.map(b => {
      const assignedCount = allocationMap.get(String(b._id)) || 0;
      const bObj = b.toObject();
      bObj.assignedStudentCount = assignedCount;
      bObj.availableSeats = Math.max(0, b.seatingCapacity - assignedCount);
      return bObj;
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: enrichedBuses,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)) || 1
      }
    });
  } catch (error) {
    logger.error('Error fetching buses:', error);
    next(error);
  }
}

async function getBusById(req, res, next) {
  try {
    const bus = await Bus.findById(req.params.id)
      .populate('assignedRoute')
      .populate('assignedDriver');

    if (!bus) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Bus not found'
      });
    }

    const assignedStudents = await StudentTransportAllocation.find({
      bus: bus._id,
      allocationStatus: 'active'
    }).select('studentName rollNumber department pickupStop dropStop transportFeeStatus allocationDate');

    const bObj = bus.toObject();
    bObj.assignedStudents = assignedStudents;
    bObj.assignedStudentCount = assignedStudents.length;
    bObj.availableSeats = Math.max(0, bus.seatingCapacity - assignedStudents.length);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: bObj
    });
  } catch (error) {
    logger.error('Error fetching bus by ID:', error);
    next(error);
  }
}

async function createBus(req, res, next) {
  try {
    const validation = validateBusInput(req.body);
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const normalizedBusId = (req.body.busId || '').trim().toUpperCase();
    const normalizedReg = (req.body.registrationNumber || '').trim().toUpperCase();

    const existingBus = await Bus.findOne({
      $or: [{ busId: normalizedBusId }, { registrationNumber: normalizedReg }]
    });

    if (existingBus) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: existingBus.busId === normalizedBusId
          ? `Bus ID '${normalizedBusId}' already exists.`
          : `Registration number '${normalizedReg}' is already registered.`
      });
    }

    const newBus = await Bus.create({
      ...req.body,
      busId: normalizedBusId,
      registrationNumber: normalizedReg
    });

    await recordAuditLog({
      req,
      action: 'TRANSPORT_BUS_CREATED',
      entityType: 'Bus',
      entityId: newBus._id,
      outcome: 'success',
      details: { busId: newBus.busId, registrationNumber: newBus.registrationNumber }
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Bus created successfully',
      data: newBus
    });
  } catch (error) {
    logger.error('Error creating bus:', error);
    next(error);
  }
}

async function updateBus(req, res, next) {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Bus not found'
      });
    }

    // Check unique conflicts if modifying ID or reg
    if (req.body.busId && req.body.busId.toUpperCase() !== bus.busId) {
      const dup = await Bus.findOne({ busId: req.body.busId.toUpperCase(), _id: { $ne: bus._id } });
      if (dup) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: `Bus ID '${req.body.busId.toUpperCase()}' is already in use.`
        });
      }
    }
    if (req.body.registrationNumber && req.body.registrationNumber.toUpperCase() !== bus.registrationNumber) {
      const dup = await Bus.findOne({ registrationNumber: req.body.registrationNumber.toUpperCase(), _id: { $ne: bus._id } });
      if (dup) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: `Registration number '${req.body.registrationNumber.toUpperCase()}' is already in use.`
        });
      }
    }

    const updated = await Bus.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('assignedRoute', 'routeName routeCode')
      .populate('assignedDriver', 'fullName phoneNumber');

    await recordAuditLog({
      req,
      action: 'TRANSPORT_BUS_UPDATED',
      entityType: 'Bus',
      entityId: updated._id,
      outcome: 'success',
      details: { busId: updated.busId, updates: req.body }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Bus updated successfully',
      data: updated
    });
  } catch (error) {
    logger.error('Error updating bus:', error);
    next(error);
  }
}

async function deactivateBus(req, res, next) {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Bus not found'
      });
    }

    const newStatus = req.body.status || 'inactive';
    bus.currentStatus = newStatus;
    await bus.save();

    await recordAuditLog({
      req,
      action: 'TRANSPORT_BUS_STATUS_CHANGED',
      entityType: 'Bus',
      entityId: bus._id,
      outcome: 'success',
      details: { busId: bus.busId, status: newStatus }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Bus status changed to '${newStatus}' successfully`,
      data: bus
    });
  } catch (error) {
    logger.error('Error deactivating bus:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 3. ROUTE & STOP MANAGEMENT APIS
// ---------------------------------------------------------------------------

async function getRoutes(req, res, next) {
  try {
    const { status, search, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.routeStatus = status;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { routeId: regex },
        { routeName: regex },
        { routeCode: regex },
        { startingPoint: regex },
        { destination: regex }
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const total = await Route.countDocuments(query);
    const routes = await Route.find(query)
      .populate('assignedBus', 'busId busName registrationNumber seatingCapacity currentStatus')
      .populate('assignedDriver', 'fullName phoneNumber availabilityStatus')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit, 10));

    // Compute student counts per route
    const routeIds = routes.map(r => r._id);
    const allocationCounts = await StudentTransportAllocation.aggregate([
      { $match: { route: { $in: routeIds }, allocationStatus: 'active' } },
      { $group: { _id: '$route', count: { $sum: 1 } } }
    ]);
    const allocationMap = new Map();
    allocationCounts.forEach(ac => allocationMap.set(String(ac._id), ac.count));

    const enrichedRoutes = routes.map(r => {
      const rObj = r.toObject();
      rObj.assignedStudentCount = allocationMap.get(String(r._id)) || 0;
      rObj.totalStops = (r.stops || []).length;
      return rObj;
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: enrichedRoutes,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)) || 1
      }
    });
  } catch (error) {
    logger.error('Error fetching routes:', error);
    next(error);
  }
}

async function getRouteById(req, res, next) {
  try {
    const route = await Route.findById(req.params.id)
      .populate('assignedBus')
      .populate('assignedDriver');

    if (!route) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Route not found'
      });
    }

    const assignedStudents = await StudentTransportAllocation.find({
      route: route._id,
      allocationStatus: 'active'
    }).select('studentName rollNumber department pickupStop dropStop transportFeeStatus allocationDate');

    const rObj = route.toObject();
    rObj.assignedStudents = assignedStudents;
    rObj.assignedStudentCount = assignedStudents.length;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: rObj
    });
  } catch (error) {
    logger.error('Error fetching route by ID:', error);
    next(error);
  }
}

async function createRoute(req, res, next) {
  try {
    const validation = validateRouteInput(req.body);
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const normalizedRouteId = (req.body.routeId || '').trim().toUpperCase();
    const normalizedRouteCode = (req.body.routeCode || '').trim().toUpperCase();

    const existing = await Route.findOne({
      $or: [{ routeId: normalizedRouteId }, { routeCode: normalizedRouteCode }]
    });

    if (existing) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: existing.routeId === normalizedRouteId
          ? `Route ID '${normalizedRouteId}' already exists.`
          : `Route Code '${normalizedRouteCode}' is already registered.`
      });
    }

    const newRoute = await Route.create({
      ...req.body,
      routeId: normalizedRouteId,
      routeCode: normalizedRouteCode
    });

    // If bus is assigned, update bus assignedRoute
    if (newRoute.assignedBus) {
      await Bus.findByIdAndUpdate(newRoute.assignedBus, { assignedRoute: newRoute._id });
    }

    await recordAuditLog({
      req,
      action: 'TRANSPORT_ROUTE_CREATED',
      entityType: 'Route',
      entityId: newRoute._id,
      outcome: 'success',
      details: { routeId: newRoute.routeId, routeCode: newRoute.routeCode }
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Route created successfully',
      data: newRoute
    });
  } catch (error) {
    logger.error('Error creating route:', error);
    next(error);
  }
}

async function updateRoute(req, res, next) {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Route not found'
      });
    }

    if (req.body.routeCode && req.body.routeCode.toUpperCase() !== route.routeCode) {
      const dup = await Route.findOne({ routeCode: req.body.routeCode.toUpperCase(), _id: { $ne: route._id } });
      if (dup) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: `Route code '${req.body.routeCode.toUpperCase()}' is already in use.`
        });
      }
    }

    const updated = await Route.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('assignedBus', 'busId busName')
      .populate('assignedDriver', 'fullName phoneNumber');

    // Sync bus assignment
    if (updated.assignedBus) {
      await Bus.findByIdAndUpdate(updated.assignedBus, { assignedRoute: updated._id });
    }

    await recordAuditLog({
      req,
      action: 'TRANSPORT_ROUTE_UPDATED',
      entityType: 'Route',
      entityId: updated._id,
      outcome: 'success',
      details: { routeId: updated.routeId, routeCode: updated.routeCode }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Route updated successfully',
      data: updated
    });
  } catch (error) {
    logger.error('Error updating route:', error);
    next(error);
  }
}

async function deactivateRoute(req, res, next) {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Route not found'
      });
    }

    const newStatus = req.body.status || 'inactive';
    route.routeStatus = newStatus;
    await route.save();

    await recordAuditLog({
      req,
      action: 'TRANSPORT_ROUTE_STATUS_CHANGED',
      entityType: 'Route',
      entityId: route._id,
      outcome: 'success',
      details: { routeId: route.routeId, status: newStatus }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Route status changed to '${newStatus}' successfully`,
      data: route
    });
  } catch (error) {
    logger.error('Error deactivating route:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 4. DRIVER & TRANSPORT STAFF MANAGEMENT APIS
// ---------------------------------------------------------------------------

async function getDrivers(req, res, next) {
  try {
    const { staffType, employmentStatus, availabilityStatus, search, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const query = {};

    if (staffType && staffType !== 'all') {
      query.staffType = staffType;
    }
    if (employmentStatus && employmentStatus !== 'all') {
      query.employmentStatus = employmentStatus;
    }
    if (availabilityStatus && availabilityStatus !== 'all') {
      query.availabilityStatus = availabilityStatus;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { driverId: regex },
        { fullName: regex },
        { phoneNumber: regex },
        { drivingLicenceNumber: regex }
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const total = await Driver.countDocuments(query);
    const drivers = await Driver.find(query)
      .populate('assignedBus', 'busId busName registrationNumber currentStatus')
      .populate('assignedRoute', 'routeName routeCode startingPoint destination')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: drivers,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)) || 1
      }
    });
  } catch (error) {
    logger.error('Error fetching drivers:', error);
    next(error);
  }
}

async function getDriverById(req, res, next) {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate('assignedBus')
      .populate('assignedRoute');

    if (!driver) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: driver
    });
  } catch (error) {
    logger.error('Error fetching driver by ID:', error);
    next(error);
  }
}

async function createDriver(req, res, next) {
  try {
    const validation = validateDriverInput(req.body);
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const normalizedDriverId = (req.body.driverId || '').trim().toUpperCase();
    const normalizedLicence = (req.body.drivingLicenceNumber || '').trim().toUpperCase();

    const existing = await Driver.findOne({
      $or: [{ driverId: normalizedDriverId }, { drivingLicenceNumber: normalizedLicence }]
    });

    if (existing) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: existing.driverId === normalizedDriverId
          ? `Driver ID '${normalizedDriverId}' already exists.`
          : `Driving licence '${normalizedLicence}' is already registered.`
      });
    }

    const newDriver = await Driver.create({
      ...req.body,
      driverId: normalizedDriverId,
      drivingLicenceNumber: normalizedLicence
    });

    // If bus is assigned, update bus assignedDriver
    if (newDriver.assignedBus) {
      await Bus.findByIdAndUpdate(newDriver.assignedBus, { assignedDriver: newDriver._id });
    }

    await recordAuditLog({
      req,
      action: 'TRANSPORT_DRIVER_CREATED',
      entityType: 'Driver',
      entityId: newDriver._id,
      outcome: 'success',
      details: { driverId: newDriver.driverId, fullName: newDriver.fullName }
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Driver profile created successfully',
      data: newDriver
    });
  } catch (error) {
    logger.error('Error creating driver:', error);
    next(error);
  }
}

async function updateDriver(req, res, next) {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Driver not found'
      });
    }

    if (req.body.drivingLicenceNumber && req.body.drivingLicenceNumber.toUpperCase() !== driver.drivingLicenceNumber) {
      const dup = await Driver.findOne({
        drivingLicenceNumber: req.body.drivingLicenceNumber.toUpperCase(),
        _id: { $ne: driver._id }
      });
      if (dup) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: `Driving licence '${req.body.drivingLicenceNumber.toUpperCase()}' is already registered.`
        });
      }
    }

    const updated = await Driver.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('assignedBus', 'busId busName')
      .populate('assignedRoute', 'routeName routeCode');

    // Sync bus driver assignment
    if (updated.assignedBus) {
      await Bus.findByIdAndUpdate(updated.assignedBus, { assignedDriver: updated._id });
    }

    await recordAuditLog({
      req,
      action: 'TRANSPORT_DRIVER_UPDATED',
      entityType: 'Driver',
      entityId: updated._id,
      outcome: 'success',
      details: { driverId: updated.driverId, fullName: updated.fullName }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Driver profile updated successfully',
      data: updated
    });
  } catch (error) {
    logger.error('Error updating driver:', error);
    next(error);
  }
}

async function deactivateDriver(req, res, next) {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Driver not found'
      });
    }

    const newStatus = req.body.status || 'inactive';
    driver.employmentStatus = newStatus;
    if (newStatus === 'inactive' || newStatus === 'terminated') {
      driver.availabilityStatus = 'off_duty';
    }
    await driver.save();

    await recordAuditLog({
      req,
      action: 'TRANSPORT_DRIVER_STATUS_CHANGED',
      entityType: 'Driver',
      entityId: driver._id,
      outcome: 'success',
      details: { driverId: driver.driverId, status: newStatus }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Driver status changed to '${newStatus}' successfully`,
      data: driver
    });
  } catch (error) {
    logger.error('Error deactivating driver:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 5. STUDENT TRANSPORT ALLOCATION APIS
// ---------------------------------------------------------------------------

async function getEligibleStudents(req, res, next) {
  try {
    const { search, department } = req.query;
    const query = {};

    if (department && department !== 'all') {
      query.department = department;
    }

    const students = await Student.find(query)
      .populate('user', 'name email status')
      .populate('department', 'name code')
      .limit(100);

    let filtered = students;
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = students.filter(st => {
        const name = (st.user?.name || '').toLowerCase();
        const roll = (st.rollNumber || '').toLowerCase();
        return name.includes(s) || roll.includes(s);
      });
    }

    // Check which students already have active allocations
    const studentIds = filtered.map(f => f._id);
    const existingActive = await StudentTransportAllocation.find({
      student: { $in: studentIds },
      allocationStatus: 'active'
    }).select('student bus route');

    const allocatedMap = new Map();
    existingActive.forEach(ea => allocatedMap.set(String(ea.student), ea));

    const result = filtered.map(st => ({
      _id: st._id,
      rollNumber: st.rollNumber,
      name: st.user?.name || 'Student',
      email: st.user?.email || '',
      department: st.department?.name || '',
      currentSemester: st.currentSemester,
      guardianName: st.guardianName || '',
      guardianPhone: st.guardianPhone || '',
      hasActiveTransport: allocatedMap.has(String(st._id)),
      activeAllocation: allocatedMap.get(String(st._id)) || null
    }));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching eligible students:', error);
    next(error);
  }
}

async function getAllocations(req, res, next) {
  try {
    const { bus, route, allocationStatus, transportFeeStatus, search, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const query = {};

    if (bus && bus !== 'all') {
      query.bus = bus;
    }
    if (route && route !== 'all') {
      query.route = route;
    }
    if (allocationStatus && allocationStatus !== 'all') {
      query.allocationStatus = allocationStatus;
    }
    if (transportFeeStatus && transportFeeStatus !== 'all') {
      query.transportFeeStatus = transportFeeStatus;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { studentName: regex },
        { rollNumber: regex },
        { department: regex },
        { allocationId: regex },
        { pickupStop: regex }
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const total = await StudentTransportAllocation.countDocuments(query);
    const allocations = await StudentTransportAllocation.find(query)
      .populate('bus', 'busId busName registrationNumber seatingCapacity')
      .populate('route', 'routeName routeCode startingPoint destination')
      .populate('student', 'rollNumber guardianName guardianPhone')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: allocations,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)) || 1
      }
    });
  } catch (error) {
    logger.error('Error fetching student allocations:', error);
    next(error);
  }
}

async function createAllocation(req, res, next) {
  try {
    const validation = validateAllocationInput(req.body);
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const { student: studentId, bus: busId, route: routeId, pickupStop, dropStop } = req.body;

    // 1. Verify student exists and does not already have an active transport allocation
    const student = await Student.findById(studentId).populate('user', 'name email').populate('department', 'name');
    if (!student) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Student record not found in ERP.'
      });
    }

    const existingActive = await StudentTransportAllocation.findOne({
      student: student._id,
      allocationStatus: 'active'
    });
    if (existingActive) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: `Student '${student.user?.name || student.rollNumber}' already has an active transport allocation (${existingActive.allocationId}). Cancel the active allocation first.`
      });
    }

    // 2. Verify bus exists and is active
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Selected bus not found.'
      });
    }
    if (bus.currentStatus !== 'active') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Bus '${bus.busName}' (${bus.busId}) is currently '${bus.currentStatus}' and cannot receive student allocations.`
      });
    }

    // 3. Verify route exists and is active
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Selected route not found.'
      });
    }
    if (route.routeStatus !== 'active') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Route '${route.routeName}' is currently '${route.routeStatus}'.`
      });
    }

    // 4. Validate stop belongs to route
    const stopExists = (route.stops || []).some(
      s => s.stopName.toLowerCase().trim() === pickupStop.toLowerCase().trim()
    );
    if (!stopExists) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Stop '${pickupStop}' does not belong to Route '${route.routeName}'. Please select a valid stop on this route.`
      });
    }

    // 5. Enforce bus capacity constraint
    const currentBusAssignedCount = await StudentTransportAllocation.countDocuments({
      bus: bus._id,
      allocationStatus: 'active'
    });

    if (currentBusAssignedCount >= bus.seatingCapacity) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Bus capacity exceeded: '${bus.busName}' has maximum ${bus.seatingCapacity} seats, and all ${currentBusAssignedCount} seats are currently occupied.`
      });
    }

    // Find stop pickup & drop timings
    const matchedStop = (route.stops || []).find(
      s => s.stopName.toLowerCase().trim() === pickupStop.toLowerCase().trim()
    );

    // Generate unique allocation ID
    const countTotal = await StudentTransportAllocation.countDocuments();
    const allocationId = `STA-2026-${String(countTotal + 1).padStart(4, '0')}`;

    const newAllocation = await StudentTransportAllocation.create({
      allocationId,
      student: student._id,
      user: student.user?._id,
      studentName: student.user?.name || req.body.studentName || 'Student',
      rollNumber: student.rollNumber,
      department: student.department?.name || 'Engineering',
      academicYear: req.body.academicYear || '2025-2026',
      guardianName: student.guardianName || req.body.guardianName || '',
      guardianPhone: student.guardianPhone || req.body.guardianPhone || '',
      bus: bus._id,
      route: route._id,
      pickupStop: pickupStop.trim(),
      dropStop: (dropStop || pickupStop).trim(),
      pickupTime: matchedStop?.pickupTime || req.body.pickupTime || '07:15 AM',
      dropTime: matchedStop?.dropTime || req.body.dropTime || '05:30 PM',
      allocationDate: new Date(),
      allocationStatus: 'active',
      transportFeeStatus: req.body.transportFeeStatus || 'pending',
      remarks: req.body.remarks || ''
    });

    await recordAuditLog({
      req,
      action: 'TRANSPORT_STUDENT_ALLOCATED',
      entityType: 'StudentTransportAllocation',
      entityId: newAllocation._id,
      outcome: 'success',
      details: {
        allocationId: newAllocation.allocationId,
        studentName: newAllocation.studentName,
        busId: bus.busId,
        routeCode: route.routeCode
      }
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Student transport allocation created successfully',
      data: newAllocation
    });
  } catch (error) {
    logger.error('Error creating student transport allocation:', error);
    next(error);
  }
}

async function cancelAllocation(req, res, next) {
  try {
    const allocation = await StudentTransportAllocation.findById(req.params.id);
    if (!allocation) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Transport allocation record not found'
      });
    }

    allocation.allocationStatus = 'cancelled';
    allocation.remarks = (allocation.remarks ? allocation.remarks + ' | ' : '') + `Cancelled on ${new Date().toLocaleDateString()}: ${req.body.reason || 'User requested'}`;
    await allocation.save();

    await recordAuditLog({
      req,
      action: 'TRANSPORT_ALLOCATION_CANCELLED',
      entityType: 'StudentTransportAllocation',
      entityId: allocation._id,
      outcome: 'success',
      details: { allocationId: allocation.allocationId, studentName: allocation.studentName }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Transport allocation cancelled successfully',
      data: allocation
    });
  } catch (error) {
    logger.error('Error cancelling transport allocation:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 6. TRANSPORT SETTINGS APIS
// ---------------------------------------------------------------------------

async function getTransportSettings(req, res, next) {
  try {
    let settings = await TransportSetting.findOne({ isDefault: true });
    if (!settings) {
      settings = await TransportSetting.create({
        academicYear: '2025-2026',
        transportWorkingStatus: 'operational',
        defaultMorningPickup: '07:00 AM',
        defaultEveningDrop: '05:00 PM',
        maxSeatThresholdPercentage: 100,
        emergencyContactPhone: '+91 98765 43210',
        transportHelplineEmail: 'transport@college.edu',
        isDefault: true
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('Error fetching transport settings:', error);
    next(error);
  }
}

async function updateTransportSettings(req, res, next) {
  try {
    let settings = await TransportSetting.findOneAndUpdate(
      { isDefault: true },
      { $set: req.body },
      { new: true, upsert: true, runValidators: true }
    );

    await recordAuditLog({
      req,
      action: 'TRANSPORT_SETTINGS_UPDATED',
      entityType: 'TransportSetting',
      entityId: settings._id,
      outcome: 'success',
      details: req.body
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Transport settings updated successfully',
      data: settings
    });
  } catch (error) {
    logger.error('Error updating transport settings:', error);
    next(error);
  }
}



// ---------------------------------------------------------------------------
// 6. TRIP MANAGEMENT APIS
// ---------------------------------------------------------------------------

function checkTimeOverlap(startA, endA, startB, endB) {
  // Strings in "HH:MM" format
  return startA < endB && endA > startB;
}

async function getTrips(req, res, next) {
  try {
    const { date, bus, route, driver, status, tripType, search } = req.query;
    const filter = {};

    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      filter.tripDate = { $gte: dayStart, $lte: dayEnd };
    }

    if (bus) filter.bus = bus;
    if (route) filter.route = route;
    if (driver) filter.driver = driver;
    if (status) filter.tripStatus = status;
    if (tripType) filter.tripType = tripType;

    if (search && search.trim()) {
      filter.tripId = { $regex: search.trim(), $options: 'i' };
    }

    const trips = await Trip.find(filter)
      .populate('bus', 'busId busName registrationNumber seatingCapacity currentStatus')
      .populate('driver', 'driverId fullName phoneNumber availabilityStatus')
      .populate('route', 'routeId routeName routeCode startingPoint destination')
      .populate('createdBy', 'name email role')
      .sort({ tripDate: -1, scheduledDeparture: 1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (error) {
    logger.error('Error fetching trips:', error);
    next(error);
  }
}

async function getTripById(req, res, next) {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('bus')
      .populate('driver')
      .populate('route')
      .populate('createdBy', 'name email role');

    if (!trip) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Trip not found'
      });
    }

    const attendanceRecords = await StudentTripAttendance.find({ trip: trip._id });
    const boardedCount = attendanceRecords.filter(a => a.boardingStatus === 'boarded').length;
    const droppedCount = attendanceRecords.filter(a => a.dropStatus === 'dropped').length;
    const pendingCount = attendanceRecords.filter(a => a.boardingStatus === 'pending').length;

    const tObj = trip.toObject();
    tObj.attendanceStats = {
      totalExpected: attendanceRecords.length,
      boardedCount,
      droppedCount,
      pendingCount
    };

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: tObj
    });
  } catch (error) {
    logger.error('Error fetching trip by ID:', error);
    next(error);
  }
}

async function createTrip(req, res, next) {
  try {
    const validation = validateTripInput(req.body);
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const {
      tripId,
      bus: busId,
      driver: driverId,
      route: routeId,
      tripType = 'morning_pickup',
      tripDate,
      scheduledDeparture,
      scheduledArrival,
      delayReason
    } = req.body;

    const normalizedTripId = tripId.trim().toUpperCase();

    // Check duplicate trip ID
    const existingTripId = await Trip.findOne({ tripId: normalizedTripId });
    if (existingTripId) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: `Trip ID "${normalizedTripId}" already exists`
      });
    }

    // Verify Bus
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Assigned bus does not exist'
      });
    }
    if (bus.currentStatus !== 'active') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Cannot assign bus: current status is "${bus.currentStatus}". Only active buses can be scheduled.`
      });
    }

    // Verify Driver
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Assigned driver does not exist'
      });
    }
    if (driver.availabilityStatus !== 'available' && driver.availabilityStatus !== 'on_duty') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Cannot assign driver: current status is "${driver.availabilityStatus}". Only available drivers can be scheduled.`
      });
    }

    // Verify Route
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Assigned route does not exist'
      });
    }

    // Date range for day
    const dayStart = new Date(tripDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(tripDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Conflict Check: Bus Overlapping Trips
    const existingBusTrips = await Trip.find({
      bus: bus._id,
      tripDate: { $gte: dayStart, $lte: dayEnd },
      tripStatus: { $nin: ['cancelled', 'completed'] }
    });

    for (const et of existingBusTrips) {
      if (checkTimeOverlap(scheduledDeparture, scheduledArrival, et.scheduledDeparture, et.scheduledArrival)) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: `Bus "${bus.busName}" has an overlapping trip (${et.tripId}: ${et.scheduledDeparture}-${et.scheduledArrival}) on this date.`
        });
      }
    }

    // Conflict Check: Driver Overlapping Trips
    const existingDriverTrips = await Trip.find({
      driver: driver._id,
      tripDate: { $gte: dayStart, $lte: dayEnd },
      tripStatus: { $nin: ['cancelled', 'completed'] }
    });

    for (const dt of existingDriverTrips) {
      if (checkTimeOverlap(scheduledDeparture, scheduledArrival, dt.scheduledDeparture, dt.scheduledArrival)) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: `Driver "${driver.fullName}" has an overlapping trip (${dt.tripId}: ${dt.scheduledDeparture}-${dt.scheduledArrival}) on this date.`
        });
      }
    }

    const newTrip = new Trip({
      tripId: normalizedTripId,
      bus: bus._id,
      driver: driver._id,
      route: route._id,
      tripType,
      tripDate: new Date(tripDate),
      scheduledDeparture,
      scheduledArrival,
      tripStatus: 'scheduled',
      delayReason,
      createdBy: req.user?._id
    });

    const savedTrip = await newTrip.save();

    // Auto-populate initial Student Trip Attendance records from allocations
    try {
      const activeAllocations = await StudentTransportAllocation.find({
        bus: bus._id,
        route: route._id,
        allocationStatus: 'active'
      });

      if (activeAllocations.length > 0) {
        const attendanceDocs = activeAllocations.map(alloc => ({
          attendanceId: `ATT-${savedTrip.tripId}-${alloc.rollNumber}`,
          trip: savedTrip._id,
          student: alloc.student,
          user: alloc.user,
          studentName: alloc.studentName,
          rollNumber: alloc.rollNumber,
          bus: bus._id,
          route: route._id,
          boardingStop: alloc.pickupStop || 'Campus Main Gate',
          dropStop: alloc.dropStop || 'Campus Main Gate',
          boardingStatus: 'pending',
          dropStatus: 'pending',
          markedBy: req.user?._id
        }));

        await StudentTripAttendance.insertMany(attendanceDocs, { ordered: false }).catch(() => {});
      }
    } catch (attErr) {
      logger.warn('Initial trip attendance creation warning:', attErr.message);
    }

    recordAuditLog({
      action: 'TRANSPORT_TRIP_CREATED',
      entity: 'Trip',
      entityId: savedTrip._id,
      performedBy: req.user?._id,
      details: { tripId: savedTrip.tripId, bus: bus.busId, driver: driver.fullName }
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Trip created successfully',
      data: savedTrip
    });
  } catch (error) {
    logger.error('Error creating trip:', error);
    next(error);
  }
}

async function updateTrip(req, res, next) {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.tripStatus === 'completed') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Completed trips cannot be modified'
      });
    }

    const updatable = ['scheduledDeparture', 'scheduledArrival', 'tripType', 'delayReason', 'tripStatus'];
    updatable.forEach(f => {
      if (req.body[f] !== undefined) trip[f] = req.body[f];
    });
    trip.updatedBy = req.user?._id;

    const updated = await trip.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Trip updated successfully',
      data: updated
    });
  } catch (error) {
    logger.error('Error updating trip:', error);
    next(error);
  }
}

async function startTrip(req, res, next) {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.tripStatus === 'completed' || trip.tripStatus === 'cancelled') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Cannot start a trip that is already "${trip.tripStatus}"`
      });
    }

    trip.tripStatus = 'in_progress';
    trip.actualDeparture = new Date();
    trip.updatedBy = req.user?._id;
    await trip.save();

    // Mark driver on duty
    await Driver.findByIdAndUpdate(trip.driver, { availabilityStatus: 'on_duty' });

    recordAuditLog({
      action: 'TRANSPORT_TRIP_STARTED',
      entity: 'Trip',
      entityId: trip._id,
      performedBy: req.user?._id,
      details: { tripId: trip.tripId, actualDeparture: trip.actualDeparture }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Trip ${trip.tripId} started successfully`,
      data: trip
    });
  } catch (error) {
    logger.error('Error starting trip:', error);
    next(error);
  }
}

async function completeTrip(req, res, next) {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Trip not found'
      });
    }

    trip.tripStatus = 'completed';
    trip.actualArrival = new Date();
    trip.updatedBy = req.user?._id;
    await trip.save();

    // Revert driver to available
    await Driver.findByIdAndUpdate(trip.driver, { availabilityStatus: 'available' });

    recordAuditLog({
      action: 'TRANSPORT_TRIP_COMPLETED',
      entity: 'Trip',
      entityId: trip._id,
      performedBy: req.user?._id,
      details: { tripId: trip.tripId, actualArrival: trip.actualArrival }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Trip ${trip.tripId} marked as completed`,
      data: trip
    });
  } catch (error) {
    logger.error('Error completing trip:', error);
    next(error);
  }
}

async function cancelTrip(req, res, next) {
  try {
    const { cancellationReason } = req.body;
    if (!cancellationReason || !cancellationReason.trim()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.tripStatus === 'completed') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Cannot cancel an already completed trip'
      });
    }

    trip.tripStatus = 'cancelled';
    trip.cancellationReason = cancellationReason.trim();
    trip.updatedBy = req.user?._id;
    await trip.save();

    await Driver.findByIdAndUpdate(trip.driver, { availabilityStatus: 'available' });

    recordAuditLog({
      action: 'TRANSPORT_TRIP_CANCELLED',
      entity: 'Trip',
      entityId: trip._id,
      performedBy: req.user?._id,
      details: { tripId: trip.tripId, reason: trip.cancellationReason }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Trip ${trip.tripId} cancelled`,
      data: trip
    });
  } catch (error) {
    logger.error('Error cancelling trip:', error);
    next(error);
  }
}

async function getDailySchedule(req, res, next) {
  try {
    const targetDateStr = req.query.date || new Date().toISOString().split('T')[0];
    const dayStart = new Date(targetDateStr);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDateStr);
    dayEnd.setHours(23, 59, 59, 999);

    const trips = await Trip.find({
      tripDate: { $gte: dayStart, $lte: dayEnd }
    })
      .populate('bus', 'busId busName registrationNumber seatingCapacity currentStatus')
      .populate('driver', 'driverId fullName phoneNumber availabilityStatus')
      .populate('route', 'routeId routeName routeCode startingPoint destination stops')
      .sort({ scheduledDeparture: 1 });

    const morningPickupTrips = trips.filter(t => t.tripType === 'morning_pickup');
    const eveningDropTrips = trips.filter(t => t.tripType === 'evening_drop');
    const activeTrips = trips.filter(t => t.tripStatus === 'started' || t.tripStatus === 'in_progress');
    const completedTrips = trips.filter(t => t.tripStatus === 'completed');
    const delayedTrips = trips.filter(t => t.tripStatus === 'delayed');
    const cancelledTrips = trips.filter(t => t.tripStatus === 'cancelled');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        date: targetDateStr,
        totalScheduled: trips.length,
        summary: {
          morningCount: morningPickupTrips.length,
          eveningCount: eveningDropTrips.length,
          activeCount: activeTrips.length,
          completedCount: completedTrips.length,
          delayedCount: delayedTrips.length,
          cancelledCount: cancelledTrips.length
        },
        trips,
        morningPickupTrips,
        eveningDropTrips,
        activeTrips,
        completedTrips,
        delayedTrips,
        cancelledTrips
      }
    });
  } catch (error) {
    logger.error('Error fetching daily transport schedule:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 7. LIVE GPS TRACKING APIS
// ---------------------------------------------------------------------------

async function submitGpsLocation(req, res, next) {
  try {
    const validation = validateGpsInput(req.body);
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const { bus, trip, driver, latitude, longitude, speed = 0, heading = 0, accuracy = 5 } = req.body;

    const newLoc = new GpsLocation({
      bus,
      trip: trip || undefined,
      driver: driver || undefined,
      latitude: Number(latitude),
      longitude: Number(longitude),
      speed: Number(speed),
      heading: Number(heading),
      accuracy: Number(accuracy),
      isOnline: true,
      timestamp: new Date()
    });

    const saved = await newLoc.save();

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'GPS location recorded successfully',
      data: saved
    });
  } catch (error) {
    logger.error('Error submitting GPS location:', error);
    next(error);
  }
}

async function getActiveBusLocations(req, res, next) {
  try {
    const buses = await Bus.find({ currentStatus: 'active' })
      .populate('assignedRoute', 'routeName routeCode startingPoint destination stops')
      .populate('assignedDriver', 'fullName phoneNumber driverId');

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    const busLocations = await Promise.all(
      buses.map(async (b) => {
        const latestLoc = await GpsLocation.findOne({ bus: b._id })
          .sort({ timestamp: -1 })
          .populate('trip', 'tripId tripType scheduledDeparture scheduledArrival tripStatus');

        let isOnline = false;
        let connectionStatus = 'unavailable';

        if (latestLoc) {
          if (new Date(latestLoc.timestamp) >= twoMinutesAgo) {
            isOnline = true;
            connectionStatus = 'connected';
          } else {
            isOnline = false;
            connectionStatus = 'disconnected';
          }
        }

        return {
          busId: b.busId,
          busName: b.busName,
          registrationNumber: b.registrationNumber,
          assignedRoute: b.assignedRoute,
          assignedDriver: b.assignedDriver,
          isOnline,
          connectionStatus,
          lastLocation: latestLoc
            ? {
                latitude: latestLoc.latitude,
                longitude: latestLoc.longitude,
                speed: latestLoc.speed,
                heading: latestLoc.heading,
                accuracy: latestLoc.accuracy,
                timestamp: latestLoc.timestamp
              }
            : null,
          currentTrip: latestLoc?.trip || null
        };
      })
    );

    const connectedCount = busLocations.filter(b => b.isOnline).length;
    const disconnectedCount = busLocations.filter(b => !b.isOnline).length;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        summary: {
          totalTrackedBuses: busLocations.length,
          connectedCount,
          disconnectedCount
        },
        buses: busLocations
      }
    });
  } catch (error) {
    logger.error('Error fetching active bus locations:', error);
    next(error);
  }
}

async function getBusLocationHistory(req, res, next) {
  try {
    const { busId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 100, 500);

    let busDoc = await Bus.findById(busId);
    if (!busDoc) {
      busDoc = await Bus.findOne({ busId: busId.toUpperCase() });
    }

    if (!busDoc) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Bus not found'
      });
    }

    const history = await GpsLocation.find({ bus: busDoc._id })
      .sort({ timestamp: -1 })
      .limit(limit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      bus: {
        busId: busDoc.busId,
        busName: busDoc.busName,
        registrationNumber: busDoc.registrationNumber
      },
      count: history.length,
      data: history.reverse()
    });
  } catch (error) {
    logger.error('Error fetching bus location history:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 8. STUDENT BOARDING & ATTENDANCE APIS
// ---------------------------------------------------------------------------

async function getTripAttendance(req, res, next) {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findById(tripId).populate('bus').populate('route');

    if (!trip) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Trip not found'
      });
    }

    let records = await StudentTripAttendance.find({ trip: trip._id })
      .populate('student', 'name rollNumber department phone')
      .populate('user', 'email name')
      .populate('markedBy', 'name role')
      .sort({ rollNumber: 1 });

    // If no attendance records exist yet, auto-generate from active allocations
    if (records.length === 0) {
      const allocations = await StudentTransportAllocation.find({
        bus: trip.bus._id,
        route: trip.route._id,
        allocationStatus: 'active'
      });

      if (allocations.length > 0) {
        const toInsert = allocations.map(a => ({
          attendanceId: `ATT-${trip.tripId}-${a.rollNumber}`,
          trip: trip._id,
          student: a.student,
          user: a.user,
          studentName: a.studentName,
          rollNumber: a.rollNumber,
          bus: trip.bus._id,
          route: trip.route._id,
          boardingStop: a.pickupStop || 'Campus Main Gate',
          dropStop: a.dropStop || 'Campus Main Gate',
          boardingStatus: 'pending',
          dropStatus: 'pending',
          markedBy: req.user?._id
        }));

        await StudentTripAttendance.insertMany(toInsert, { ordered: false }).catch(() => {});
        records = await StudentTripAttendance.find({ trip: trip._id }).sort({ rollNumber: 1 });
      }
    }

    const boarded = records.filter(r => r.boardingStatus === 'boarded').length;
    const dropped = records.filter(r => r.dropStatus === 'dropped').length;
    const pending = records.filter(r => r.boardingStatus === 'pending').length;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      trip: {
        tripId: trip.tripId,
        tripType: trip.tripType,
        tripStatus: trip.tripStatus,
        scheduledDeparture: trip.scheduledDeparture,
        scheduledArrival: trip.scheduledArrival
      },
      stats: {
        totalAllocated: records.length,
        boardedCount: boarded,
        droppedCount: dropped,
        pendingCount: pending
      },
      data: records
    });
  } catch (error) {
    logger.error('Error fetching trip attendance:', error);
    next(error);
  }
}

async function markStudentBoarding(req, res, next) {
  try {
    const { attendanceId } = req.params;
    const { remarks } = req.body;

    const record = await StudentTripAttendance.findOne({
      $or: [{ attendanceId }, { _id: attendanceId }]
    });

    if (!record) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    record.boardingStatus = 'boarded';
    record.boardingTimestamp = new Date();
    record.markedBy = req.user?._id;
    if (remarks) record.remarks = remarks.trim();

    await record.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `${record.studentName} marked as BOARDED`,
      data: record
    });
  } catch (error) {
    logger.error('Error marking student boarding:', error);
    next(error);
  }
}

async function markStudentDrop(req, res, next) {
  try {
    const { attendanceId } = req.params;
    const { remarks } = req.body;

    const record = await StudentTripAttendance.findOne({
      $or: [{ attendanceId }, { _id: attendanceId }]
    });

    if (!record) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    if (record.boardingStatus !== 'boarded' && !req.body.overrideCorrection) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Student has not been marked as boarded yet. Boarding confirmation required before drop-off.'
      });
    }

    record.dropStatus = 'dropped';
    record.dropTimestamp = new Date();
    record.markedBy = req.user?._id;
    if (remarks) record.remarks = remarks.trim();

    await record.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `${record.studentName} confirmed as DROPPED`,
      data: record
    });
  } catch (error) {
    logger.error('Error confirming student drop-off:', error);
    next(error);
  }
}

async function correctAttendance(req, res, next) {
  try {
    const { attendanceId } = req.params;
    const { reason, newBoardingStatus, newDropStatus } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Reason for correction is required for audit trail'
      });
    }

    const record = await StudentTripAttendance.findOne({
      $or: [{ attendanceId }, { _id: attendanceId }]
    });

    if (!record) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    const previousStatus = `Boarding: ${record.boardingStatus}, Drop: ${record.dropStatus}`;

    if (newBoardingStatus) record.boardingStatus = newBoardingStatus;
    if (newDropStatus) record.dropStatus = newDropStatus;

    const newStatus = `Boarding: ${record.boardingStatus}, Drop: ${record.dropStatus}`;

    record.correctionHistory.push({
      correctedBy: req.user?._id,
      previousStatus,
      newStatus,
      reason: reason.trim(),
      timestamp: new Date()
    });

    await record.save();

    recordAuditLog({
      action: 'TRANSPORT_ATTENDANCE_CORRECTED',
      entity: 'StudentTripAttendance',
      entityId: record._id,
      performedBy: req.user?._id,
      details: { rollNumber: record.rollNumber, previousStatus, newStatus, reason }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Attendance corrected successfully with audit log',
      data: record
    });
  } catch (error) {
    logger.error('Error correcting attendance:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 9. DRIVER, SUPERVISOR, PARENT & STUDENT ROLE PORTAL APIS
// ---------------------------------------------------------------------------

async function getDriverTrips(req, res, next) {
  try {
    let driverDoc = await Driver.findOne({ email: req.user.email });
    if (!driverDoc && req.query.driverId) {
      driverDoc = await Driver.findById(req.query.driverId);
    }

    if (!driverDoc) {
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        driver: null,
        todayTrips: [],
        historicalTrips: []
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayTrips = await Trip.find({
      driver: driverDoc._id,
      tripDate: { $gte: todayStart, $lte: todayEnd }
    })
      .populate('bus', 'busId busName registrationNumber seatingCapacity')
      .populate('route', 'routeName routeCode startingPoint destination stops')
      .sort({ scheduledDeparture: 1 });

    const historicalTrips = await Trip.find({
      driver: driverDoc._id,
      tripDate: { $lt: todayStart }
    })
      .populate('bus', 'busId busName registrationNumber')
      .populate('route', 'routeName routeCode')
      .sort({ tripDate: -1 })
      .limit(20);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      driver: {
        driverId: driverDoc.driverId,
        fullName: driverDoc.fullName,
        availabilityStatus: driverDoc.availabilityStatus,
        phoneNumber: driverDoc.phoneNumber
      },
      todayTrips,
      historicalTrips
    });
  } catch (error) {
    logger.error('Error fetching driver trips:', error);
    next(error);
  }
}

async function getSupervisorDashboardSummary(req, res, next) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [todayTrips, activeTrips, completedTrips, delayedTrips] = await Promise.all([
      Trip.countDocuments({ tripDate: { $gte: todayStart, $lte: todayEnd } }),
      Trip.countDocuments({
        tripDate: { $gte: todayStart, $lte: todayEnd },
        tripStatus: { $in: ['started', 'in_progress'] }
      }),
      Trip.countDocuments({
        tripDate: { $gte: todayStart, $lte: todayEnd },
        tripStatus: 'completed'
      }),
      Trip.countDocuments({
        tripDate: { $gte: todayStart, $lte: todayEnd },
        tripStatus: 'delayed'
      })
    ]);

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const recentLocations = await GpsLocation.aggregate([
      { $match: { timestamp: { $gte: twoMinutesAgo } } },
      { $group: { _id: '$bus' } }
    ]);

    const activeBusesCount = await Bus.countDocuments({ currentStatus: 'active' });
    const gpsConnected = recentLocations.length;
    const gpsDisconnected = Math.max(0, activeBusesCount - gpsConnected);

    const activeAllocationsCount = await StudentTransportAllocation.countDocuments({ allocationStatus: 'active' });
    const studentsBoarded = await StudentTripAttendance.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
      boardingStatus: 'boarded'
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        todayTrips,
        activeTrips,
        completedTrips,
        delayedTrips,
        gpsConnected,
        gpsDisconnected,
        totalStudentsExpected: activeAllocationsCount,
        studentsBoarded
      }
    });
  } catch (error) {
    logger.error('Error fetching supervisor dashboard summary:', error);
    next(error);
  }
}

async function getParentChildTransport(req, res, next) {
  try {
    // Find allocations by parent email or child link
    const allocations = await StudentTransportAllocation.find({
      $or: [
        { 'guardianDetails.guardianEmail': req.user.email },
        { user: req.user._id }
      ],
      allocationStatus: 'active'
    })
      .populate('bus', 'busId busName registrationNumber currentStatus')
      .populate('route', 'routeName routeCode startingPoint destination stops')
      .populate('student');

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    const childrenData = await Promise.all(
      allocations.map(async (alloc) => {
        let latestGps = null;
        let isOnline = false;

        if (alloc.bus) {
          latestGps = await GpsLocation.findOne({ bus: alloc.bus._id }).sort({ timestamp: -1 });
          if (latestGps && new Date(latestGps.timestamp) >= twoMinutesAgo) {
            isOnline = true;
          }
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayAttendance = await StudentTripAttendance.findOne({
          rollNumber: alloc.rollNumber,
          createdAt: { $gte: todayStart }
        }).sort({ createdAt: -1 });

        return {
          studentName: alloc.studentName,
          rollNumber: alloc.rollNumber,
          department: alloc.department,
          pickupStop: alloc.pickupStop,
          dropStop: alloc.dropStop,
          bus: alloc.bus,
          route: alloc.route,
          isOnline,
          latestGps: latestGps
            ? {
                latitude: latestGps.latitude,
                longitude: latestGps.longitude,
                speed: latestGps.speed,
                timestamp: latestGps.timestamp
              }
            : null,
          todayAttendance: todayAttendance
            ? {
                boardingStatus: todayAttendance.boardingStatus,
                dropStatus: todayAttendance.dropStatus,
                boardingTimestamp: todayAttendance.boardingTimestamp,
                dropTimestamp: todayAttendance.dropTimestamp
              }
            : {
                boardingStatus: 'pending',
                dropStatus: 'pending'
              }
        };
      })
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      children: childrenData
    });
  } catch (error) {
    logger.error('Error fetching parent child transport details:', error);
    next(error);
  }
}

async function getMyStudentTransport(req, res, next) {
  try {
    const allocation = await StudentTransportAllocation.findOne({
      $or: [{ user: req.user._id }, { student: req.user._id }],
      allocationStatus: 'active'
    })
      .populate('bus', 'busId busName registrationNumber currentStatus')
      .populate('route', 'routeName routeCode startingPoint destination stops');

    if (!allocation) {
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        hasAllocation: false,
        message: 'No active transport allocation found'
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayTrip = await Trip.findOne({
      bus: allocation.bus?._id,
      tripDate: { $gte: todayStart }
    }).sort({ scheduledDeparture: 1 });

    const attendance = await StudentTripAttendance.findOne({
      rollNumber: allocation.rollNumber,
      createdAt: { $gte: todayStart }
    }).sort({ createdAt: -1 });

    let latestGps = null;
    let isOnline = false;
    if (allocation.bus) {
      latestGps = await GpsLocation.findOne({ bus: allocation.bus._id }).sort({ timestamp: -1 });
      if (latestGps && Date.now() - new Date(latestGps.timestamp).getTime() < 120000) {
        isOnline = true;
      }
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      hasAllocation: true,
      allocation: {
        bus: allocation.bus,
        route: allocation.route,
        pickupStop: allocation.pickupStop,
        dropStop: allocation.dropStop,
        transportFeeStatus: allocation.transportFeeStatus
      },
      todayTrip: todayTrip
        ? {
            tripId: todayTrip.tripId,
            tripType: todayTrip.tripType,
            scheduledDeparture: todayTrip.scheduledDeparture,
            scheduledArrival: todayTrip.scheduledArrival,
            tripStatus: todayTrip.tripStatus
          }
        : null,
      todayAttendance: attendance
        ? {
            boardingStatus: attendance.boardingStatus,
            dropStatus: attendance.dropStatus,
            boardingTimestamp: attendance.boardingTimestamp,
            dropTimestamp: attendance.dropTimestamp
          }
        : {
            boardingStatus: 'pending',
            dropStatus: 'pending'
          },
      gps: {
        isOnline,
        location: latestGps
          ? {
              latitude: latestGps.latitude,
              longitude: latestGps.longitude,
              speed: latestGps.speed,
              timestamp: latestGps.timestamp
            }
          : null
      }
    });
  } catch (error) {
    logger.error('Error fetching student transport:', error);
    next(error);
  }
}




// ---------------------------------------------------------------------------
// 10. VEHICLE MAINTENANCE & COMPLIANCE APIS (PHASE 3)
// ---------------------------------------------------------------------------

async function getMaintenanceRecords(req, res, next) {
  try {
    const { bus, status, type, search } = req.query;
    const filter = {};

    if (bus && bus !== 'all') filter.bus = bus;
    if (status && status !== 'all') filter.maintenanceStatus = status;
    if (type && type !== 'all') filter.maintenanceType = type;

    if (search && search.trim()) {
      filter.$or = [
        { maintenanceId: { $regex: search.trim(), $options: 'i' } },
        { serviceProvider: { $regex: search.trim(), $options: 'i' } },
        { serviceDescription: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const records = await VehicleMaintenance.find(filter)
      .populate('bus', 'busId busName registrationNumber currentStatus')
      .populate('createdBy', 'name email role')
      .sort({ serviceDate: -1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    logger.error('Error fetching maintenance records:', error);
    next(error);
  }
}

async function getMaintenanceById(req, res, next) {
  try {
    const record = await VehicleMaintenance.findById(req.params.id)
      .populate('bus')
      .populate('createdBy', 'name email role');

    if (!record) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: record
    });
  } catch (error) {
    logger.error('Error fetching maintenance record by ID:', error);
    next(error);
  }
}

async function createMaintenanceRecord(req, res, next) {
  try {
    const validation = validateMaintenanceInput(req.body);
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const {
      maintenanceId,
      bus: busId,
      maintenanceType = 'Regular Service',
      serviceDate,
      nextServiceDate,
      odometerReading = 0,
      serviceProvider,
      serviceDescription,
      partsReplaced,
      labourCost = 0,
      partsCost = 0,
      invoiceReference,
      maintenanceStatus = 'Scheduled',
      remarks
    } = req.body;

    const normalizedMntId = maintenanceId.trim().toUpperCase();

    const existing = await VehicleMaintenance.findOne({ maintenanceId: normalizedMntId });
    if (existing) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: `Maintenance ID "${normalizedMntId}" already exists`
      });
    }

    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Assigned bus does not exist'
      });
    }

    const totalCost = Number(labourCost || 0) + Number(partsCost || 0);

    const record = new VehicleMaintenance({
      maintenanceId: normalizedMntId,
      bus: bus._id,
      busRegistrationNumber: bus.registrationNumber,
      maintenanceType,
      serviceDate: new Date(serviceDate),
      nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : undefined,
      odometerReading: Number(odometerReading) || 0,
      serviceProvider: serviceProvider.trim(),
      serviceDescription: serviceDescription.trim(),
      partsReplaced: partsReplaced?.trim(),
      labourCost: Number(labourCost) || 0,
      partsCost: Number(partsCost) || 0,
      totalCost,
      invoiceReference: invoiceReference?.trim(),
      maintenanceStatus,
      remarks: remarks?.trim(),
      createdBy: req.user?._id
    });

    const saved = await record.save();

    // If scheduled or in-progress maintenance, restrict vehicle availability
    if (maintenanceStatus === 'Scheduled' || maintenanceStatus === 'In Progress') {
      bus.currentStatus = 'under_maintenance';
      await bus.save();
    }

    recordAuditLog({
      action: 'TRANSPORT_MAINTENANCE_CREATED',
      entity: 'VehicleMaintenance',
      entityId: saved._id,
      performedBy: req.user?._id,
      details: { maintenanceId: saved.maintenanceId, bus: bus.busId, totalCost }
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Vehicle maintenance record created successfully',
      data: saved
    });
  } catch (error) {
    logger.error('Error creating maintenance record:', error);
    next(error);
  }
}

async function updateMaintenanceRecord(req, res, next) {
  try {
    const record = await VehicleMaintenance.findById(req.params.id);
    if (!record) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }

    const updatable = [
      'maintenanceType',
      'serviceDate',
      'nextServiceDate',
      'odometerReading',
      'serviceProvider',
      'serviceDescription',
      'partsReplaced',
      'labourCost',
      'partsCost',
      'invoiceReference',
      'maintenanceStatus',
      'remarks'
    ];

    updatable.forEach((f) => {
      if (req.body[f] !== undefined) record[f] = req.body[f];
    });

    record.totalCost = (Number(record.labourCost) || 0) + (Number(record.partsCost) || 0);
    record.updatedBy = req.user?._id;

    const updated = await record.save();

    // If marked Completed, return bus to active service
    if (record.maintenanceStatus === 'Completed') {
      await Bus.findByIdAndUpdate(record.bus, { currentStatus: 'active' });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Maintenance record updated successfully',
      data: updated
    });
  } catch (error) {
    logger.error('Error updating maintenance record:', error);
    next(error);
  }
}

async function completeMaintenance(req, res, next) {
  try {
    const record = await VehicleMaintenance.findById(req.params.id);
    if (!record) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }

    record.maintenanceStatus = 'Completed';
    record.updatedBy = req.user?._id;
    if (req.body.remarks) record.remarks = req.body.remarks.trim();
    await record.save();

    // Release bus back to active service
    await Bus.findByIdAndUpdate(record.bus, { currentStatus: 'active' });

    recordAuditLog({
      action: 'TRANSPORT_MAINTENANCE_COMPLETED',
      entity: 'VehicleMaintenance',
      entityId: record._id,
      performedBy: req.user?._id,
      details: { maintenanceId: record.maintenanceId }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Maintenance ${record.maintenanceId} marked as Completed. Vehicle returned to active service.`,
      data: record
    });
  } catch (error) {
    logger.error('Error completing maintenance:', error);
    next(error);
  }
}

async function getDocumentExpiryAlerts(req, res, next) {
  try {
    const buses = await Bus.find({ currentStatus: { $ne: 'out_of_service' } })
      .select('busId busName registrationNumber insuranceExpiryDate fitnessCertificateExpiryDate pollutionCertificateExpiryDate');

    const now = new Date();
    const alerts = [];

    buses.forEach((b) => {
      const docs = [
        { type: 'Vehicle Insurance', date: b.insuranceExpiryDate },
        { type: 'Fitness Certificate', date: b.fitnessCertificateExpiryDate },
        { type: 'Pollution Certificate (PUC)', date: b.pollutionCertificateExpiryDate }
      ];

      docs.forEach((doc) => {
        if (doc.date) {
          const exp = new Date(doc.date);
          const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          let status = 'Valid';
          if (diffDays <= 0) status = 'Expired';
          else if (diffDays <= 30) status = 'Expiring Soon';

          alerts.push({
            busId: b.busId,
            busName: b.busName,
            registrationNumber: b.registrationNumber,
            documentType: doc.type,
            expiryDate: doc.date,
            daysRemaining: diffDays,
            status
          });
        }
      });
    });

    const expiredCount = alerts.filter((a) => a.status === 'Expired').length;
    const expiringSoonCount = alerts.filter((a) => a.status === 'Expiring Soon').length;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      summary: {
        totalTrackedDocuments: alerts.length,
        expiredCount,
        expiringSoonCount
      },
      data: alerts.sort((a, b) => a.daysRemaining - b.daysRemaining)
    });
  } catch (error) {
    logger.error('Error fetching document expiry alerts:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 11. FUEL MANAGEMENT & MILEAGE TRACKING APIS (PHASE 3)
// ---------------------------------------------------------------------------

async function getFuelRecords(req, res, next) {
  try {
    const { bus, fuelType, search } = req.query;
    const filter = {};

    if (bus && bus !== 'all') filter.bus = bus;
    if (fuelType && fuelType !== 'all') filter.fuelType = fuelType;
    if (search && search.trim()) {
      filter.$or = [
        { fuelRecordId: { $regex: search.trim(), $options: 'i' } },
        { fuelStation: { $regex: search.trim(), $options: 'i' } },
        { invoiceNumber: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const records = await FuelRecord.find(filter)
      .populate('bus', 'busId busName registrationNumber fuelType')
      .populate('enteredBy', 'name email role')
      .sort({ fuelDate: -1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    logger.error('Error fetching fuel records:', error);
    next(error);
  }
}

async function createFuelRecord(req, res, next) {
  try {
    const validation = validateFuelInput(req.body);
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: validation.errors.join(', '),
        errors: validation.errors
      });
    }

    const {
      fuelRecordId,
      bus: busId,
      fuelType = 'diesel',
      fuelStation,
      fuelDate,
      fuelQuantity,
      pricePerLitre,
      odometerReading,
      paymentMethod = 'Fuel Card',
      invoiceNumber,
      remarks
    } = req.body;

    const normalizedFuelId = fuelRecordId.trim().toUpperCase();

    const existing = await FuelRecord.findOne({ fuelRecordId: normalizedFuelId });
    if (existing) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: `Fuel Record ID "${normalizedFuelId}" already exists`
      });
    }

    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Assigned bus does not exist'
      });
    }

    // Auto-derive previous odometer reading from latest fuel record if available
    let prevOdo = req.body.previousOdometerReading !== undefined ? Number(req.body.previousOdometerReading) : null;
    if (prevOdo === null) {
      const lastFuel = await FuelRecord.findOne({ bus: bus._id }).sort({ odometerReading: -1 });
      prevOdo = lastFuel ? lastFuel.odometerReading : 0;
    }

    const currentOdo = Number(odometerReading);
    if (currentOdo < prevOdo) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Odometer reading (${currentOdo} km) cannot decrease compared with previous reading (${prevOdo} km)`
      });
    }

    const distance = Math.max(0, currentOdo - prevOdo);
    const qty = Number(fuelQuantity);
    const price = Number(pricePerLitre);
    const totalCost = Number((qty * price).toFixed(2));
    const mileage = qty > 0 && distance > 0 ? Number((distance / qty).toFixed(2)) : 0;

    const newRecord = new FuelRecord({
      fuelRecordId: normalizedFuelId,
      bus: bus._id,
      busRegistrationNumber: bus.registrationNumber,
      fuelType,
      fuelStation: fuelStation.trim(),
      fuelDate: new Date(fuelDate),
      fuelQuantity: qty,
      pricePerLitre: price,
      totalFuelCost: totalCost,
      odometerReading: currentOdo,
      previousOdometerReading: prevOdo,
      distanceTravelled: distance,
      mileage,
      paymentMethod,
      invoiceNumber: invoiceNumber?.trim(),
      enteredBy: req.user?._id,
      remarks: remarks?.trim()
    });

    const saved = await newRecord.save();

    recordAuditLog({
      action: 'TRANSPORT_FUEL_RECORDED',
      entity: 'FuelRecord',
      entityId: saved._id,
      performedBy: req.user?._id,
      details: { fuelRecordId: saved.fuelRecordId, totalFuelCost: totalCost, mileage }
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Fuel record created successfully',
      data: saved
    });
  } catch (error) {
    logger.error('Error creating fuel record:', error);
    next(error);
  }
}

async function getFuelMileageStats(req, res, next) {
  try {
    const fuelStats = await FuelRecord.aggregate([
      {
        $group: {
          _id: null,
          totalLitres: { $sum: '$fuelQuantity' },
          totalCost: { $sum: '$totalFuelCost' },
          totalDistance: { $sum: '$distanceTravelled' }
        }
      }
    ]);

    const totals = fuelStats[0] || { totalLitres: 0, totalCost: 0, totalDistance: 0 };
    const avgMileage = totals.totalLitres > 0 ? Number((totals.totalDistance / totals.totalLitres).toFixed(2)) : 0;

    // Today's fuel expenses
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayFuel = await FuelRecord.aggregate([
      { $match: { fuelDate: { $gte: todayStart } } },
      { $group: { _id: null, cost: { $sum: '$totalFuelCost' } } }
    ]);

    // Current month fuel expenses
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthFuel = await FuelRecord.aggregate([
      { $match: { fuelDate: { $gte: monthStart } } },
      { $group: { _id: null, cost: { $sum: '$totalFuelCost' } } }
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        totalFuelConsumption: Number(totals.totalLitres.toFixed(1)),
        totalFuelExpenses: Number(totals.totalCost.toFixed(2)),
        todayFuelExpenses: todayFuel[0]?.cost || 0,
        monthlyFuelExpenses: monthFuel[0]?.cost || 0,
        totalFleetDistanceKm: totals.totalDistance,
        averageFleetMileage: avgMileage
      }
    });
  } catch (error) {
    logger.error('Error fetching fuel mileage statistics:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 12. TRANSPORT EXPENSE MANAGEMENT APIS (PHASE 3)
// ---------------------------------------------------------------------------

async function getExpenses(req, res, next) {
  try {
    const { category, status, bus, search } = req.query;
    const filter = {};

    if (category && category !== 'all') filter.category = category;
    if (status && status !== 'all') filter.approvalStatus = status;
    if (bus && bus !== 'all') filter.bus = bus;

    if (search && search.trim()) {
      filter.$or = [
        { expenseId: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { vendor: { $regex: search.trim(), $options: 'i' } },
        { invoiceNumber: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const expenses = await TransportExpense.find(filter)
      .populate('bus', 'busId busName registrationNumber')
      .populate('submittedBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .sort({ expenseDate: -1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (error) {
    logger.error('Error fetching expenses:', error);
    next(error);
  }
}

async function createExpense(req, res, next) {
  try {
    const validation = validateExpenseInput(req.body);
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const {
      expenseId,
      category,
      bus,
      trip,
      expenseDate,
      description,
      amount,
      vendor,
      invoiceNumber,
      attachmentReference,
      paymentMethod = 'Bank Transfer'
    } = req.body;

    const normalizedExpId = expenseId.trim().toUpperCase();

    const existing = await TransportExpense.findOne({ expenseId: normalizedExpId });
    if (existing) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: `Expense ID "${normalizedExpId}" already exists`
      });
    }

    const expense = new TransportExpense({
      expenseId: normalizedExpId,
      category,
      bus: bus || undefined,
      trip: trip || undefined,
      expenseDate: new Date(expenseDate),
      description: description.trim(),
      amount: Number(amount),
      vendor: vendor.trim(),
      invoiceNumber: invoiceNumber?.trim(),
      attachmentReference: attachmentReference?.trim(),
      paymentMethod,
      submittedBy: req.user._id,
      approvalStatus: 'Submitted'
    });

    const saved = await expense.save();

    recordAuditLog({
      action: 'TRANSPORT_EXPENSE_SUBMITTED',
      entity: 'TransportExpense',
      entityId: saved._id,
      performedBy: req.user?._id,
      details: { expenseId: saved.expenseId, amount: saved.amount, category: saved.category }
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Transport expense submitted for approval',
      data: saved
    });
  } catch (error) {
    logger.error('Error submitting expense:', error);
    next(error);
  }
}

async function approveExpense(req, res, next) {
  try {
    const expense = await TransportExpense.findById(req.params.id);
    if (!expense) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Prevent self-approval if non-admin
    if (String(expense.submittedBy) === String(req.user._id) && req.user.role !== ROLES.SUPER_ADMIN) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Self-approval of transport expenses is prohibited'
      });
    }

    expense.approvalStatus = 'Approved';
    expense.approvedBy = req.user._id;
    if (req.body.remarks) expense.approvalRemarks = req.body.remarks.trim();
    await expense.save();

    recordAuditLog({
      action: 'TRANSPORT_EXPENSE_APPROVED',
      entity: 'TransportExpense',
      entityId: expense._id,
      performedBy: req.user?._id,
      details: { expenseId: expense.expenseId, amount: expense.amount }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Expense ${expense.expenseId} approved successfully`,
      data: expense
    });
  } catch (error) {
    logger.error('Error approving expense:', error);
    next(error);
  }
}

async function rejectExpense(req, res, next) {
  try {
    const expense = await TransportExpense.findById(req.params.id);
    if (!expense) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Expense not found'
      });
    }

    expense.approvalStatus = 'Rejected';
    expense.approvedBy = req.user._id;
    expense.approvalRemarks = req.body.remarks?.trim() || 'Rejected by authorized finance officer';
    await expense.save();

    recordAuditLog({
      action: 'TRANSPORT_EXPENSE_REJECTED',
      entity: 'TransportExpense',
      entityId: expense._id,
      performedBy: req.user?._id,
      details: { expenseId: expense.expenseId, remarks: expense.approvalRemarks }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Expense ${expense.expenseId} marked as Rejected`,
      data: expense
    });
  } catch (error) {
    logger.error('Error rejecting expense:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 13. TRANSPORT FEE MANAGEMENT & RECEIPTS APIS (PHASE 3)
// ---------------------------------------------------------------------------

async function getFeeStructures(req, res, next) {
  try {
    const { academicYear } = req.query;
    const filter = {};
    if (academicYear) filter.academicYear = academicYear;

    const structures = await TransportFeeStructure.find(filter)
      .populate('route', 'routeId routeName routeCode startingPoint destination')
      .sort({ academicYear: -1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: structures.length,
      data: structures
    });
  } catch (error) {
    logger.error('Error fetching transport fee structures:', error);
    next(error);
  }
}

async function createFeeStructure(req, res, next) {
  try {
    const validation = validateFeeStructureInput(req.body);
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const { academicYear, route: routeId, feeCategory = 'Regular', annualFee, semesterFee = 0, dueDate } = req.body;

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Transit route does not exist'
      });
    }

    const existing = await TransportFeeStructure.findOne({
      academicYear: academicYear.trim(),
      route: route._id,
      feeCategory
    });

    if (existing) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: `Fee structure for ${academicYear} on route "${route.routeName}" (${feeCategory}) already exists`
      });
    }

    const structure = new TransportFeeStructure({
      academicYear: academicYear.trim(),
      route: route._id,
      routeName: route.routeName,
      feeCategory,
      annualFee: Number(annualFee),
      semesterFee: Number(semesterFee) || 0,
      dueDate: dueDate ? new Date(dueDate) : undefined
    });

    const saved = await structure.save();

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Transport fee structure configured successfully',
      data: saved
    });
  } catch (error) {
    logger.error('Error creating fee structure:', error);
    next(error);
  }
}

async function getStudentTransportFees(req, res, next) {
  try {
    const { academicYear, status, search } = req.query;
    const filter = {};

    if (academicYear) filter.academicYear = academicYear;
    if (status && status !== 'all') filter.paymentStatus = status;

    if (search && search.trim()) {
      filter.$or = [
        { rollNumber: { $regex: search.trim(), $options: 'i' } },
        { studentName: { $regex: search.trim(), $options: 'i' } },
        { feeRecordId: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const feeRecords = await StudentTransportFee.find(filter)
      .populate('route', 'routeName routeCode')
      .populate('bus', 'busName busId')
      .sort({ createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: feeRecords.length,
      data: feeRecords
    });
  } catch (error) {
    logger.error('Error fetching student transport fees:', error);
    next(error);
  }
}

async function assignStudentFee(req, res, next) {
  try {
    const { studentId, rollNumber, routeId, busId, academicYear, feeStructureId } = req.body;

    if (!rollNumber || !routeId || !academicYear) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'rollNumber, routeId, and academicYear are required'
      });
    }

    let feeStructure = null;
    if (feeStructureId) {
      feeStructure = await TransportFeeStructure.findById(feeStructureId);
    } else {
      feeStructure = await TransportFeeStructure.findOne({
        route: routeId,
        academicYear: academicYear.trim()
      });
    }

    const totalFee = feeStructure ? feeStructure.annualFee : 18000; // default standard annual fee if none configured
    const feeId = `TFEE-${academicYear.replace(/[^0-9]/g, '')}-${rollNumber.toUpperCase()}`;

    const existing = await StudentTransportFee.findOne({ feeRecordId: feeId });
    if (existing) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: `Transport fee record for student ${rollNumber} for ${academicYear} already exists`
      });
    }

    const studentUser = await User.findOne({
      $or: [{ rollNumber: rollNumber.trim() }, { email: `${rollNumber.toLowerCase()}@college.edu` }]
    });

    const newFee = new StudentTransportFee({
      feeRecordId: feeId,
      student: studentId || studentUser?._id,
      user: studentUser?._id,
      studentName: studentUser?.name || `Student ${rollNumber}`,
      rollNumber: rollNumber.trim().toUpperCase(),
      academicYear: academicYear.trim(),
      route: routeId,
      bus: busId || undefined,
      feeStructure: feeStructure?._id,
      totalFee,
      paidAmount: 0,
      pendingAmount: totalFee,
      dueDate: feeStructure?.dueDate,
      paymentStatus: 'Pending',
      payments: []
    });

    const saved = await newFee.save();

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Student transport fee assigned successfully',
      data: saved
    });
  } catch (error) {
    logger.error('Error assigning student transport fee:', error);
    next(error);
  }
}

async function recordFeePayment(req, res, next) {
  try {
    const validation = validatePaymentInput(req.body);
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const { amount, paymentMethod = 'Online Payment', transactionReference, remarks } = req.body;
    const feeRecord = await StudentTransportFee.findById(req.params.id);

    if (!feeRecord) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Student transport fee record not found'
      });
    }

    const payAmt = Number(amount);
    if (payAmt > feeRecord.pendingAmount) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Payment amount (₹${payAmt}) cannot exceed pending balance (₹${feeRecord.pendingAmount})`
      });
    }

    const receiptNumber = `RCPT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    feeRecord.paidAmount += payAmt;
    feeRecord.pendingAmount = Math.max(0, feeRecord.totalFee - feeRecord.paidAmount);

    if (feeRecord.pendingAmount === 0) {
      feeRecord.paymentStatus = 'Paid';
    } else {
      feeRecord.paymentStatus = 'Partially Paid';
    }

    const paymentEntry = {
      receiptNumber,
      amount: payAmt,
      paymentDate: new Date(),
      paymentMethod,
      transactionReference: transactionReference?.trim(),
      issuedBy: req.user?._id,
      remarks: remarks?.trim()
    };

    feeRecord.payments.push(paymentEntry);
    await feeRecord.save();

    // Update transport allocation fee status if linked
    await StudentTransportAllocation.findOneAndUpdate(
      { rollNumber: feeRecord.rollNumber, allocationStatus: 'active' },
      { transportFeeStatus: feeRecord.pendingAmount === 0 ? 'paid' : 'partial' }
    );

    recordAuditLog({
      action: 'TRANSPORT_FEE_PAID',
      entity: 'StudentTransportFee',
      entityId: feeRecord._id,
      performedBy: req.user?._id,
      details: { rollNumber: feeRecord.rollNumber, receiptNumber, amount: payAmt }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Payment of ₹${payAmt} recorded successfully. Receipt #${receiptNumber} generated.`,
      receipt: {
        receiptNumber,
        studentName: feeRecord.studentName,
        rollNumber: feeRecord.rollNumber,
        academicYear: feeRecord.academicYear,
        amountPaid: payAmt,
        totalFee: feeRecord.totalFee,
        pendingAmount: feeRecord.pendingAmount,
        paymentDate: paymentEntry.paymentDate,
        paymentMethod: paymentEntry.paymentMethod,
        transactionReference: paymentEntry.transactionReference,
        issuedBy: req.user?.name || 'Accounts Office'
      },
      data: feeRecord
    });
  } catch (error) {
    logger.error('Error recording transport fee payment:', error);
    next(error);
  }
}

async function getPaymentReceipt(req, res, next) {
  try {
    const { receiptNumber } = req.params;

    const feeRecord = await StudentTransportFee.findOne({
      'payments.receiptNumber': receiptNumber
    })
      .populate('route', 'routeName routeCode startingPoint destination')
      .populate('bus', 'busId busName registrationNumber')
      .populate('payments.issuedBy', 'name role');

    if (!feeRecord) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Payment receipt not found'
      });
    }

    const payment = feeRecord.payments.find((p) => p.receiptNumber === receiptNumber);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      receipt: {
        receiptNumber: payment.receiptNumber,
        studentName: feeRecord.studentName,
        rollNumber: feeRecord.rollNumber,
        department: feeRecord.department,
        academicYear: feeRecord.academicYear,
        route: feeRecord.route,
        bus: feeRecord.bus,
        totalFee: feeRecord.totalFee,
        amountPaid: payment.amount,
        cumulativePaid: feeRecord.paidAmount,
        pendingBalance: feeRecord.pendingAmount,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        transactionReference: payment.transactionReference,
        issuedBy: payment.issuedBy?.name || 'Accounts Cell'
      }
    });
  } catch (error) {
    logger.error('Error fetching payment receipt:', error);
    next(error);
  }
}

async function getTransportFinancialSummary(req, res, next) {
  try {
    // Maintenance totals
    const mntStats = await VehicleMaintenance.aggregate([
      { $match: { maintenanceStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalCost' } } }
    ]);
    const totalMaintenanceExpenses = mntStats[0]?.total || 0;

    // Fuel totals
    const fuelStats = await FuelRecord.aggregate([
      { $group: { _id: null, total: { $sum: '$totalFuelCost' } } }
    ]);
    const totalFuelExpenses = fuelStats[0]?.total || 0;

    // Other Approved Expenses totals
    const expStats = await TransportExpense.aggregate([
      { $match: { approvalStatus: { $in: ['Approved', 'Paid'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalApprovedExpenses = expStats[0]?.total || 0;

    const totalTransportExpenses = totalMaintenanceExpenses + totalFuelExpenses + totalApprovedExpenses;

    // Fee collections
    const feeStats = await StudentTransportFee.aggregate([
      {
        $group: {
          _id: null,
          totalAssessed: { $sum: '$totalFee' },
          totalCollected: { $sum: '$paidAmount' },
          totalPending: { $sum: '$pendingAmount' }
        }
      }
    ]);
    const feeSummary = feeStats[0] || { totalAssessed: 0, totalCollected: 0, totalPending: 0 };

    const overdueCount = await StudentTransportFee.countDocuments({ paymentStatus: 'Overdue' });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        totalTransportExpenses: Number(totalTransportExpenses.toFixed(2)),
        totalMaintenanceExpenses: Number(totalMaintenanceExpenses.toFixed(2)),
        totalFuelExpenses: Number(totalFuelExpenses.toFixed(2)),
        totalOtherExpenses: Number(totalApprovedExpenses.toFixed(2)),
        totalFeesAssessed: feeSummary.totalAssessed,
        totalFeesCollected: feeSummary.totalCollected,
        pendingTransportFees: feeSummary.totalPending,
        overdueFeeCount: overdueCount
      }
    });
  } catch (error) {
    logger.error('Error fetching transport financial summary:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 14. SAFETY DASHBOARD & EMERGENCY SOS APIS (PHASE 4)
// ---------------------------------------------------------------------------

async function getSafetyDashboardSummary(req, res, next) {
  try {
    const [
      totalIncidents,
      openIncidents,
      resolvedIncidents,
      criticalIncidents,
      activeSosAlerts,
      accidentReports,
      breakdownReports,
      routeDeviationAlerts,
      overspeedAlerts,
      recentIncidents,
      activeEmergencyAlerts,
      recentGeofenceEvents,
      unresolvedComplaints
    ] = await Promise.all([
      TransportIncident.countDocuments({}),
      TransportIncident.countDocuments({ status: { $in: ['Reported', 'Acknowledged', 'Under Investigation', 'Action Required'] } }),
      TransportIncident.countDocuments({ status: { $in: ['Resolved', 'Closed'] } }),
      TransportIncident.countDocuments({ severity: 'Critical' }),
      EmergencyAlert.countDocuments({ status: 'Active' }),
      TransportIncident.countDocuments({ category: 'Accident' }),
      TransportIncident.countDocuments({ category: 'Vehicle Breakdown' }),
      GeofenceEvent.countDocuments({ eventType: 'deviation' }),
      OverspeedEvent.countDocuments({}),
      TransportIncident.find({}).sort({ incidentDate: -1 }).limit(10).populate('bus', 'busId busName registrationNumber').populate('route', 'routeName routeCode'),
      EmergencyAlert.find({ status: { $ne: 'Closed' } }).sort({ createdAt: -1 }).limit(10).populate('bus', 'busId busName registrationNumber').populate('triggeredBy', 'name role'),
      GeofenceEvent.find({}).sort({ timestamp: -1 }).limit(10).populate('bus', 'busId busName registrationNumber'),
      TransportComplaint.countDocuments({ status: { $in: ['Submitted', 'Acknowledged', 'Assigned', 'In Progress'] } })
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      summary: {
        totalSafetyIncidents: totalIncidents,
        openIncidents,
        resolvedIncidents,
        criticalIncidents,
        activeSosAlerts,
        accidentReports,
        breakdownReports,
        routeDeviationAlerts,
        overspeedAlerts,
        pendingSafetyActions: openIncidents + activeSosAlerts,
        unresolvedComplaints
      },
      recentIncidents,
      activeEmergencyAlerts,
      recentGeofenceEvents
    });
  } catch (error) {
    logger.error('Error fetching safety dashboard summary:', error);
    next(error);
  }
}

async function triggerSosAlert(req, res, next) {
  try {
    const validation = validateSosAlertInput(req.body);
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: validation.errors.join(', '),
        errors: validation.errors
      });
    }

    const {
      bus: busId,
      trip: tripId,
      driver: driverId,
      emergencyType,
      severity = 'Critical',
      location,
      description
    } = req.body;

    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Debounce / duplicate prevention: prevent multiple rapid clicks within 60s for same bus
    const sixtySecondsAgo = new Date(Date.now() - 60000);
    const existing = await EmergencyAlert.findOne({
      bus: bus._id,
      status: 'Active',
      emergencyType,
      createdAt: { $gte: sixtySecondsAgo }
    });

    if (existing) {
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Active emergency SOS already registered for this vehicle',
        data: existing,
        duplicatePrevented: true
      });
    }

    const alertId = `SOS-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

    const alert = new EmergencyAlert({
      alertId,
      bus: bus._id,
      busRegistrationNumber: bus.registrationNumber,
      trip: tripId,
      driver: driverId,
      triggeredBy: req.user?._id,
      triggeredByName: req.user?.name || 'Authorized Staff',
      triggeredByRole: req.user?.role || 'staff',
      emergencyType,
      severity,
      location: location || {},
      description: description?.trim() || `Emergency SOS triggered for ${bus.busName} (${bus.registrationNumber})`,
      status: 'Active',
      auditHistory: [
        {
          action: 'SOS_TRIGGERED',
          performedBy: req.user?._id,
          performedByName: req.user?.name,
          timestamp: new Date(),
          notes: `SOS triggered by ${req.user?.name || 'Staff'}: ${emergencyType}`
        }
      ]
    });

    const saved = await alert.save();

    // Create high-priority in-app notification for all Transport Admins and Supervisors
    try {
      const staffUsers = await User.find({
        role: { $in: ['super_admin', 'transport_admin', 'transport_supervisor'] },
        status: 'active'
      }).select('_id role');

      if (staffUsers.length > 0) {
        const notifications = staffUsers.map((u) => ({
          recipient: u._id,
          recipientRole: u.role,
          category: 'Safety',
          title: `EMERGENCY SOS: ${bus.registrationNumber}`,
          message: `${emergencyType} reported by ${req.user?.name || 'Driver'}. Immediate response required!`,
          priority: 'urgent',
          link: '/transport?tab=safety'
        }));
        await TransportNotification.insertMany(notifications);
      }
    } catch (notifErr) {
      logger.warn('Failed to dispatch notifications for SOS alert:', notifErr.message);
    }

    await recordAuditLog({
      req,
      action: 'TRANSPORT_SOS_TRIGGERED',
      entityType: 'EmergencyAlert',
      entityId: saved._id,
      outcome: 'success',
      details: { alertId: saved.alertId, bus: bus.busId, emergencyType }
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Emergency SOS alert activated successfully. Transport control notified.',
      data: saved
    });
  } catch (error) {
    logger.error('Error triggering SOS alert:', error);
    next(error);
  }
}

async function getEmergencyAlerts(req, res, next) {
  try {
    const { status, bus, emergencyType } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (bus && bus !== 'all') filter.bus = bus;
    if (emergencyType && emergencyType !== 'all') filter.emergencyType = emergencyType;

    const alerts = await EmergencyAlert.find(filter)
      .populate('bus', 'busId busName registrationNumber currentStatus')
      .populate('triggeredBy', 'name email role')
      .populate('acknowledgedBy', 'name email role')
      .populate('resolvedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    logger.error('Error fetching emergency alerts:', error);
    next(error);
  }
}

async function getEmergencyAlertById(req, res, next) {
  try {
    const alert = await EmergencyAlert.findById(req.params.id)
      .populate('bus')
      .populate('triggeredBy', 'name email role')
      .populate('acknowledgedBy', 'name email role')
      .populate('resolvedBy', 'name email role');

    if (!alert) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Emergency alert not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: alert
    });
  } catch (error) {
    logger.error('Error fetching emergency alert by ID:', error);
    next(error);
  }
}

async function acknowledgeEmergencyAlert(req, res, next) {
  try {
    const alert = await EmergencyAlert.findById(req.params.id);
    if (!alert) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Emergency alert not found'
      });
    }

    const { notes } = req.body;
    alert.status = 'Acknowledged';
    alert.acknowledgedBy = req.user?._id;
    alert.acknowledgedAt = new Date();
    if (notes) alert.responseNotes = notes.trim();

    alert.auditHistory.push({
      action: 'SOS_ACKNOWLEDGED',
      performedBy: req.user?._id,
      performedByName: req.user?.name,
      timestamp: new Date(),
      notes: notes?.trim() || 'Emergency acknowledged by staff'
    });

    await alert.save();

    await recordAuditLog({
      req,
      action: 'TRANSPORT_SOS_ACKNOWLEDGED',
      entityType: 'EmergencyAlert',
      entityId: alert._id,
      outcome: 'success',
      details: { alertId: alert.alertId }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Emergency SOS ${alert.alertId} acknowledged.`,
      data: alert
    });
  } catch (error) {
    logger.error('Error acknowledging emergency alert:', error);
    next(error);
  }
}

async function updateEmergencyResponse(req, res, next) {
  try {
    const alert = await EmergencyAlert.findById(req.params.id);
    if (!alert) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Emergency alert not found'
      });
    }

    const { notes } = req.body;
    alert.status = 'Response Initiated';
    alert.responseInitiatedAt = new Date();
    if (notes) alert.responseNotes = notes.trim();

    alert.auditHistory.push({
      action: 'SOS_RESPONSE_INITIATED',
      performedBy: req.user?._id,
      performedByName: req.user?.name,
      timestamp: new Date(),
      notes: notes?.trim() || 'Response team dispatched'
    });

    await alert.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Emergency SOS ${alert.alertId} status updated to Response Initiated.`,
      data: alert
    });
  } catch (error) {
    logger.error('Error updating emergency response:', error);
    next(error);
  }
}

async function resolveEmergencyAlert(req, res, next) {
  try {
    const alert = await EmergencyAlert.findById(req.params.id);
    if (!alert) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Emergency alert not found'
      });
    }

    const { notes, status = 'Resolved' } = req.body;
    alert.status = status;
    alert.resolvedBy = req.user?._id;
    alert.resolvedAt = new Date();
    if (notes) alert.resolutionNotes = notes.trim();

    alert.auditHistory.push({
      action: status === 'Closed' ? 'SOS_CLOSED' : 'SOS_RESOLVED',
      performedBy: req.user?._id,
      performedByName: req.user?.name,
      timestamp: new Date(),
      notes: notes?.trim() || 'Incident handled and resolved'
    });

    await alert.save();

    await recordAuditLog({
      req,
      action: 'TRANSPORT_SOS_RESOLVED',
      entityType: 'EmergencyAlert',
      entityId: alert._id,
      outcome: 'success',
      details: { alertId: alert.alertId, status }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Emergency SOS ${alert.alertId} resolved successfully.`,
      data: alert
    });
  } catch (error) {
    logger.error('Error resolving emergency alert:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 15. ACCIDENT & INCIDENT MANAGEMENT APIS (PHASE 4)
// ---------------------------------------------------------------------------

async function getIncidents(req, res, next) {
  try {
    const { category, severity, status, bus, search } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (severity && severity !== 'all') filter.severity = severity;
    if (status && status !== 'all') filter.status = status;
    if (bus && bus !== 'all') filter.bus = bus;
    if (search && search.trim()) {
      filter.$or = [
        { incidentId: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const incidents = await TransportIncident.find(filter)
      .populate('bus', 'busId busName registrationNumber')
      .populate('route', 'routeName routeCode')
      .populate('reportedBy', 'name role email')
      .populate('assignedOfficer', 'name role email')
      .sort({ incidentDate: -1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: incidents.length,
      data: incidents
    });
  } catch (error) {
    logger.error('Error fetching incidents:', error);
    next(error);
  }
}

async function getIncidentById(req, res, next) {
  try {
    const incident = await TransportIncident.findById(req.params.id)
      .populate('bus')
      .populate('route')
      .populate('driver')
      .populate('student')
      .populate('reportedBy', 'name role email')
      .populate('assignedOfficer', 'name role email');

    if (!incident) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Incident not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: incident
    });
  } catch (error) {
    logger.error('Error fetching incident by ID:', error);
    next(error);
  }
}

async function createIncident(req, res, next) {
  try {
    const validation = validateIncidentInput(req.body);
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: validation.errors.join(', '),
        errors: validation.errors
      });
    }

    const {
      category,
      severity = 'Medium',
      bus: busId,
      route: routeId,
      trip: tripId,
      driver: driverId,
      student: studentId,
      incidentDate = new Date(),
      location,
      description,
      supportingAttachments = []
    } = req.body;

    let busReg = '';
    if (busId) {
      const bus = await Bus.findById(busId);
      if (bus) busReg = bus.registrationNumber;
    }

    const incidentId = `INC-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

    const incident = new TransportIncident({
      incidentId,
      category,
      severity,
      bus: busId || undefined,
      busRegistrationNumber: busReg,
      route: routeId || undefined,
      trip: tripId || undefined,
      driver: driverId || undefined,
      student: studentId || undefined,
      reportedBy: req.user?._id,
      reportedByName: req.user?.name || 'Staff',
      incidentDate: new Date(incidentDate),
      location: location || {},
      description: description.trim(),
      supportingAttachments,
      status: 'Reported',
      auditHistory: [
        {
          status: 'Reported',
          updatedBy: req.user?._id,
          updatedByName: req.user?.name,
          notes: `Incident reported: ${category} (${severity})`,
          timestamp: new Date()
        }
      ]
    });

    const saved = await incident.save();

    await recordAuditLog({
      req,
      action: 'TRANSPORT_INCIDENT_REPORTED',
      entityType: 'TransportIncident',
      entityId: saved._id,
      outcome: 'success',
      details: { incidentId: saved.incidentId, category, severity }
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Transport incident logged successfully',
      data: saved
    });
  } catch (error) {
    logger.error('Error creating incident:', error);
    next(error);
  }
}

async function assignIncident(req, res, next) {
  try {
    const incident = await TransportIncident.findById(req.params.id);
    if (!incident) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Incident not found'
      });
    }

    const { officerId, notes } = req.body;
    const officer = await User.findById(officerId);
    if (!officer) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Assigned officer not found'
      });
    }

    incident.assignedOfficer = officer._id;
    incident.assignedOfficerName = officer.name;
    incident.status = 'Under Investigation';
    if (notes) incident.investigationNotes = notes.trim();

    incident.auditHistory.push({
      status: 'Under Investigation',
      updatedBy: req.user?._id,
      updatedByName: req.user?.name,
      notes: `Assigned to ${officer.name}. ${notes || ''}`.trim(),
      timestamp: new Date()
    });

    await incident.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Incident ${incident.incidentId} assigned to ${officer.name}`,
      data: incident
    });
  } catch (error) {
    logger.error('Error assigning incident:', error);
    next(error);
  }
}

async function updateIncidentStatus(req, res, next) {
  try {
    const incident = await TransportIncident.findById(req.params.id);
    if (!incident) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Incident not found'
      });
    }

    const {
      status,
      investigationNotes,
      correctiveActions,
      resolutionDetails
    } = req.body;

    if (status) incident.status = status;
    if (investigationNotes) incident.investigationNotes = investigationNotes.trim();
    if (correctiveActions) incident.correctiveActions = correctiveActions.trim();
    if (resolutionDetails) incident.resolutionDetails = resolutionDetails.trim();

    if (status === 'Resolved') incident.resolvedAt = new Date();
    if (status === 'Closed') incident.closedAt = new Date();

    incident.auditHistory.push({
      status: incident.status,
      updatedBy: req.user?._id,
      updatedByName: req.user?.name,
      notes: `Status changed to ${incident.status}`,
      timestamp: new Date()
    });

    await incident.save();

    await recordAuditLog({
      req,
      action: 'TRANSPORT_INCIDENT_UPDATED',
      entityType: 'TransportIncident',
      entityId: incident._id,
      outcome: 'success',
      details: { incidentId: incident.incidentId, status: incident.status }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Incident ${incident.incidentId} updated successfully`,
      data: incident
    });
  } catch (error) {
    logger.error('Error updating incident status:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 16. GEOFENCING & OVERSPEED APIS (PHASE 4)
// ---------------------------------------------------------------------------

async function getGeofences(req, res, next) {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (type && type !== 'all') filter.geofenceType = type;

    const fences = await Geofence.find(filter)
      .populate('associatedRoute', 'routeName routeCode')
      .sort({ createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: fences.length,
      data: fences
    });
  } catch (error) {
    logger.error('Error fetching geofences:', error);
    next(error);
  }
}

async function createGeofence(req, res, next) {
  try {
    const validation = validateGeofenceInput(req.body);
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: validation.errors.join(', '),
        errors: validation.errors
      });
    }

    const {
      name,
      geofenceType = 'Campus',
      center,
      radiusMeters = 200,
      speedLimitKmh = 40,
      associatedRoute,
      description
    } = req.body;

    const geofenceId = `GEO-${Date.now().toString(36).toUpperCase()}`;

    const fence = new Geofence({
      geofenceId,
      name: name.trim(),
      geofenceType,
      center,
      radiusMeters: Number(radiusMeters),
      speedLimitKmh: Number(speedLimitKmh),
      associatedRoute: associatedRoute || undefined,
      description: description?.trim(),
      createdBy: req.user?._id
    });

    const saved = await fence.save();

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Geofence created successfully',
      data: saved
    });
  } catch (error) {
    logger.error('Error creating geofence:', error);
    next(error);
  }
}

async function updateGeofence(req, res, next) {
  try {
    const fence = await Geofence.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!fence) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Geofence not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Geofence updated successfully',
      data: fence
    });
  } catch (error) {
    logger.error('Error updating geofence:', error);
    next(error);
  }
}

async function getGeofenceEvents(req, res, next) {
  try {
    const { bus, eventType } = req.query;
    const filter = {};
    if (bus && bus !== 'all') filter.bus = bus;
    if (eventType && eventType !== 'all') filter.eventType = eventType;

    const events = await GeofenceEvent.find(filter)
      .populate('bus', 'busId busName registrationNumber')
      .populate('geofence', 'name geofenceType')
      .sort({ timestamp: -1 })
      .limit(100);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    logger.error('Error fetching geofence events:', error);
    next(error);
  }
}

async function recordGeofenceEvent(req, res, next) {
  try {
    const { geofence, bus, eventType, location, speed, details } = req.body;
    if (!bus || !eventType || !location) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Bus, eventType, and location are required'
      });
    }

    const busRecord = await Bus.findById(bus);
    let geofenceName = '';
    if (geofence) {
      const gf = await Geofence.findById(geofence);
      if (gf) geofenceName = gf.name;
    }

    const event = new GeofenceEvent({
      geofence: geofence || undefined,
      geofenceName,
      bus,
      busRegistrationNumber: busRecord ? busRecord.registrationNumber : '',
      eventType,
      location,
      speed: Number(speed) || 0,
      details: details?.trim()
    });

    const saved = await event.save();

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: saved
    });
  } catch (error) {
    logger.error('Error recording geofence event:', error);
    next(error);
  }
}

async function getOverspeedEvents(req, res, next) {
  try {
    const { bus, status } = req.query;
    const filter = {};
    if (bus && bus !== 'all') filter.bus = bus;
    if (status && status !== 'all') filter.status = status;

    const events = await OverspeedEvent.find(filter)
      .populate('bus', 'busId busName registrationNumber')
      .populate('driver', 'fullName driverId')
      .sort({ timestamp: -1 })
      .limit(100);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    logger.error('Error fetching overspeed events:', error);
    next(error);
  }
}

async function recordOverspeedEvent(req, res, next) {
  try {
    const { bus, speed, speedLimit, location, driver, trip, notes } = req.body;
    if (!bus || speed === undefined || speedLimit === undefined) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Bus, speed, and speedLimit are required'
      });
    }

    const busRecord = await Bus.findById(bus);
    let driverName = '';
    if (driver) {
      const d = await Driver.findById(driver);
      if (d) driverName = d.fullName;
    }

    const event = new OverspeedEvent({
      bus,
      busRegistrationNumber: busRecord ? busRecord.registrationNumber : '',
      trip: trip || undefined,
      driver: driver || undefined,
      driverName,
      speed: Number(speed),
      speedLimit: Number(speedLimit),
      location: location || {},
      notes: notes?.trim()
    });

    const saved = await event.save();

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Overspeed event logged',
      data: saved
    });
  } catch (error) {
    logger.error('Error recording overspeed event:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 17. PARENT TRANSPORT PORTAL APIS (PHASE 4)
// ---------------------------------------------------------------------------

async function getParentTransportData(req, res, next) {
  try {
    const user = req.user;
    let allocations = [];

    // Check if queried by admin/supervisor for rollNumber or finding linked student
    if (req.query.rollNumber && ['super_admin', 'transport_admin', 'transport_supervisor'].includes(user.role)) {
      allocations = await StudentTransportAllocation.find({
        rollNumber: req.query.rollNumber.trim().toUpperCase(),
        allocationStatus: 'active'
      })
        .populate('bus')
        .populate('route');
    } else {
      // Find linked students by parent identifier
      allocations = await StudentTransportAllocation.find({
        $or: [
          { guardianPhone: user.email },
          { guardianName: user.name },
          { guardianPhone: user.phone || 'NO_PHONE' }
        ],
        allocationStatus: 'active'
      })
        .populate('bus')
        .populate('route');

      if (allocations.length === 0) {
        const linkedStudents = await Student.find({
          $or: [
            { guardianName: user.name },
            { guardianPhone: user.email },
            { guardianPhone: user.phone || 'NO_PHONE' }
          ]
        }).select('_id rollNumber');

        if (linkedStudents.length > 0) {
          const rolls = linkedStudents.map((s) => s.rollNumber);
          allocations = await StudentTransportAllocation.find({
            rollNumber: { $in: rolls },
            allocationStatus: 'active'
          })
            .populate('bus')
            .populate('route');
        }
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const childrenData = await Promise.all(
      allocations.map(async (alloc) => {
        let busGps = null;
        let isGpsOnline = false;
        let assignedDriver = null;

        if (alloc.bus) {
          busGps = await GpsLocation.findOne({ bus: alloc.bus._id }).sort({ timestamp: -1 });
          if (busGps && Date.now() - new Date(busGps.timestamp).getTime() < 120000) {
            isGpsOnline = true;
          }
          if (alloc.bus.assignedDriver) {
            assignedDriver = await Driver.findById(alloc.bus.assignedDriver).select('fullName contactNumber driverId');
          }
        }

        const todayTrip = alloc.bus
          ? await Trip.findOne({
              bus: alloc.bus._id,
              tripDate: { $gte: today }
            }).sort({ scheduledDeparture: 1 })
          : null;

        let todayAttendance = null;
        if (todayTrip) {
          todayAttendance = await StudentTripAttendance.findOne({
            trip: todayTrip._id,
            rollNumber: alloc.rollNumber
          });
        }

        const feeRecord = await StudentTransportFee.findOne({
          rollNumber: alloc.rollNumber,
          academicYear: alloc.academicYear || '2025-2026'
        });

        const activeAlert = alloc.bus
          ? await EmergencyAlert.findOne({
              bus: alloc.bus._id,
              status: { $in: ['Active', 'Acknowledged', 'Response Initiated'] }
            }).sort({ createdAt: -1 })
          : null;

        return {
          allocationId: alloc.allocationId,
          studentName: alloc.studentName,
          rollNumber: alloc.rollNumber,
          department: alloc.department,
          pickupStop: alloc.pickupStop,
          dropStop: alloc.dropStop,
          allocationStatus: alloc.allocationStatus,
          bus: alloc.bus
            ? {
                _id: alloc.bus._id,
                busId: alloc.bus.busId,
                busName: alloc.bus.busName,
                registrationNumber: alloc.bus.registrationNumber,
                currentStatus: alloc.bus.currentStatus,
                driver: assignedDriver
              }
            : null,
          route: alloc.route
            ? {
                _id: alloc.route._id,
                routeName: alloc.route.routeName,
                routeCode: alloc.route.routeCode,
                stops: alloc.route.stops
              }
            : null,
          liveGps: {
            isOnline: isGpsOnline,
            latitude: busGps ? busGps.latitude : null,
            longitude: busGps ? busGps.longitude : null,
            speed: busGps ? busGps.speed : 0,
            lastUpdate: busGps ? busGps.timestamp : null
          },
          todayTrip: todayTrip
            ? {
                tripId: todayTrip.tripId,
                tripType: todayTrip.tripType,
                scheduledDeparture: todayTrip.scheduledDeparture,
                scheduledArrival: todayTrip.scheduledArrival,
                tripStatus: todayTrip.tripStatus
              }
            : null,
          attendance: todayAttendance
            ? {
                boardingStatus: todayAttendance.boardingStatus,
                boardingTime: todayAttendance.boardingTimestamp,
                dropStatus: todayAttendance.dropStatus,
                dropTime: todayAttendance.dropTimestamp
              }
            : {
                boardingStatus: 'Pending',
                dropStatus: 'Pending'
              },
          feeStatus: feeRecord
            ? {
                totalFee: feeRecord.totalFee,
                totalPaid: feeRecord.totalPaid,
                pendingBalance: feeRecord.pendingBalance,
                paymentStatus: feeRecord.paymentStatus,
                payments: feeRecord.payments
              }
            : null,
          activeSafetyAlert: activeAlert
            ? {
                alertId: activeAlert.alertId,
                emergencyType: activeAlert.emergencyType,
                severity: activeAlert.severity,
                status: activeAlert.status,
                createdAt: activeAlert.createdAt
              }
            : null
        };
      })
    );

    const announcements = await TransportAnnouncement.find({
      isActive: true,
      $or: [{ targetRoles: 'parent' }, { targetRoles: { $size: 0 } }]
    })
      .sort({ publishDate: -1 })
      .limit(5);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      totalLinkedChildren: childrenData.length,
      children: childrenData,
      announcements
    });
  } catch (error) {
    logger.error('Error fetching parent transport data:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 18. TRANSPORT COMPLAINT APIS (PHASE 4)
// ---------------------------------------------------------------------------

async function submitComplaint(req, res, next) {
  try {
    const validation = validateComplaintInput(req.body);
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: validation.errors.join(', '),
        errors: validation.errors
      });
    }

    const {
      category,
      subject,
      description,
      priority = 'Medium',
      bus: busId,
      route: routeId,
      studentName,
      rollNumber,
      supportingAttachments = []
    } = req.body;

    const complaintId = `CMP-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

    const complaint = new TransportComplaint({
      complaintId,
      category,
      subject: subject.trim(),
      description: description.trim(),
      priority,
      bus: busId || undefined,
      route: routeId || undefined,
      studentName: studentName?.trim(),
      rollNumber: rollNumber?.trim().toUpperCase(),
      submittedBy: req.user._id,
      submittedByName: req.user.name,
      submittedByRole: req.user.role,
      supportingAttachments,
      status: 'Submitted',
      auditHistory: [
        {
          action: 'COMPLAINT_SUBMITTED',
          performedBy: req.user._id,
          performedByName: req.user.name,
          notes: `Complaint submitted: ${category} - ${subject}`,
          timestamp: new Date()
        }
      ]
    });

    const saved = await complaint.save();

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Transport complaint submitted successfully. Tracking ID: ' + saved.complaintId,
      data: saved
    });
  } catch (error) {
    logger.error('Error submitting complaint:', error);
    next(error);
  }
}

async function getComplaints(req, res, next) {
  try {
    const user = req.user;
    const filter = {};

    // Privacy restriction: Parents and Students can ONLY view their own complaints
    if (user.role === 'student' || user.role === 'parent') {
      filter.submittedBy = user._id;
    } else {
      const { category, status, priority } = req.query;
      if (category && category !== 'all') filter.category = category;
      if (status && status !== 'all') filter.status = status;
      if (priority && priority !== 'all') filter.priority = priority;
    }

    const complaints = await TransportComplaint.find(filter)
      .populate('bus', 'busId busName registrationNumber')
      .populate('route', 'routeName routeCode')
      .populate('submittedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    logger.error('Error fetching complaints:', error);
    next(error);
  }
}

async function getComplaintById(req, res, next) {
  try {
    const complaint = await TransportComplaint.findById(req.params.id)
      .populate('bus')
      .populate('route')
      .populate('submittedBy', 'name email role')
      .populate('assignedTo', 'name email role');

    if (!complaint) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Enforce ownership check for students and parents
    if (['student', 'parent'].includes(req.user.role) && !complaint.submittedBy.equals(req.user._id)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You are not authorized to view this complaint'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    logger.error('Error fetching complaint by ID:', error);
    next(error);
  }
}

async function assignComplaint(req, res, next) {
  try {
    const complaint = await TransportComplaint.findById(req.params.id);
    if (!complaint) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    const { assignedToId, notes } = req.body;
    const staff = await User.findById(assignedToId);
    if (!staff) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    complaint.assignedTo = staff._id;
    complaint.assignedToName = staff.name;
    complaint.status = 'Assigned';

    complaint.auditHistory.push({
      action: 'COMPLAINT_ASSIGNED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      notes: `Assigned to ${staff.name}. ${notes || ''}`.trim(),
      timestamp: new Date()
    });

    await complaint.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Complaint assigned to ${staff.name}`,
      data: complaint
    });
  } catch (error) {
    logger.error('Error assigning complaint:', error);
    next(error);
  }
}

async function respondToComplaint(req, res, next) {
  try {
    const complaint = await TransportComplaint.findById(req.params.id);
    if (!complaint) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    const { response, status = 'Resolved' } = req.body;
    if (!response || !response.trim()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Response text is required'
      });
    }

    complaint.adminResponse = response.trim();
    complaint.status = status;
    if (status === 'Resolved') complaint.resolvedAt = new Date();
    if (status === 'Closed') complaint.closedAt = new Date();

    complaint.auditHistory.push({
      action: `COMPLAINT_STATUS_${status.toUpperCase()}`,
      performedBy: req.user._id,
      performedByName: req.user.name,
      notes: response.trim(),
      timestamp: new Date()
    });

    await complaint.save();

    // Notify submitter about response
    try {
      await TransportNotification.create({
        recipient: complaint.submittedBy,
        recipientRole: complaint.submittedByRole,
        category: 'General',
        title: `Response to Complaint ${complaint.complaintId}`,
        message: `Your transport complaint has been updated: ${status}. Response: ${response.substring(0, 100)}...`,
        priority: 'medium',
        link: '/transport?tab=complaints'
      });
    } catch (e) {}

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Response saved. Complaint status: ${status}`,
      data: complaint
    });
  } catch (error) {
    logger.error('Error responding to complaint:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 19. TRANSPORT ANNOUNCEMENT APIS (PHASE 4)
// ---------------------------------------------------------------------------

async function getAnnouncements(req, res, next) {
  try {
    const userRole = req.user?.role;
    const filter = { isActive: true };

    if (!['super_admin', 'transport_admin', 'transport_supervisor'].includes(userRole)) {
      filter.$or = [
        { targetRoles: userRole },
        { targetRoles: { $size: 0 } }
      ];
    }

    const announcements = await TransportAnnouncement.find(filter)
      .populate('targetRoutes', 'routeName routeCode')
      .populate('targetBuses', 'busId busName registrationNumber')
      .sort({ publishDate: -1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: announcements.length,
      data: announcements
    });
  } catch (error) {
    logger.error('Error fetching announcements:', error);
    next(error);
  }
}

async function createAnnouncement(req, res, next) {
  try {
    const validation = validateAnnouncementInput(req.body);
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: validation.errors.join(', '),
        errors: validation.errors
      });
    }

    const {
      title,
      content,
      priority = 'Normal',
      targetRoles = [],
      targetRoutes = [],
      targetBuses = [],
      expiryDate
    } = req.body;

    const announcementId = `ANN-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

    const ann = new TransportAnnouncement({
      announcementId,
      title: title.trim(),
      content: content.trim(),
      priority,
      targetRoles,
      targetRoutes,
      targetBuses,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      createdBy: req.user?._id,
      createdByName: req.user?.name
    });

    const saved = await ann.save();

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Transport announcement published successfully',
      data: saved
    });
  } catch (error) {
    logger.error('Error creating announcement:', error);
    next(error);
  }
}

async function updateAnnouncement(req, res, next) {
  try {
    const ann = await TransportAnnouncement.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!ann) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Announcement updated successfully',
      data: ann
    });
  } catch (error) {
    logger.error('Error updating announcement:', error);
    next(error);
  }
}

async function deactivateAnnouncement(req, res, next) {
  try {
    const ann = await TransportAnnouncement.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!ann) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Announcement deactivated',
      data: ann
    });
  } catch (error) {
    logger.error('Error deactivating announcement:', error);
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 20. TRANSPORT NOTIFICATION & PREFERENCE APIS (PHASE 4)
// ---------------------------------------------------------------------------

async function getMyNotifications(req, res, next) {
  try {
    const { category, read } = req.query;
    const filter = { recipient: req.user._id };

    if (category && category !== 'all') filter.category = category;
    if (read !== undefined) filter.read = read === 'true';

    const notifications = await TransportNotification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await TransportNotification.countDocuments({
      recipient: req.user._id,
      read: false
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    next(error);
  }
}

async function markNotificationAsRead(req, res, next) {
  try {
    const notif = await TransportNotification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { $set: { read: true, readAt: new Date() } },
      { new: true }
    );

    if (!notif) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: notif
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    next(error);
  }
}

async function markAllNotificationsAsRead(req, res, next) {
  try {
    await TransportNotification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    next(error);
  }
}

async function getNotificationPreferences(req, res, next) {
  try {
    let pref = await NotificationPreference.findOne({ user: req.user._id });
    if (!pref) {
      pref = await NotificationPreference.create({ user: req.user._id });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: pref
    });
  } catch (error) {
    logger.error('Error fetching notification preferences:', error);
    next(error);
  }
}

async function updateNotificationPreferences(req, res, next) {
  try {
    const pref = await NotificationPreference.findOneAndUpdate(
      { user: req.user._id },
      { $set: req.body },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Preferences updated successfully',
      data: pref
    });
  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    next(error);
  }
}


module.exports = {

  // Summary & Dashboard
  getTransportSummary,

  // Bus Management
  getBuses,
  getBusById,
  createBus,
  updateBus,
  deactivateBus,

  // Route Management
  getRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deactivateRoute,

  // Driver Management
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deactivateDriver,

  // Student Allocation
  getEligibleStudents,
  getAllocations,
  createAllocation,
  cancelAllocation,

  // Settings
  getTransportSettings,
  updateTransportSettings,

  // Phase 2: Trips
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  startTrip,
  completeTrip,
  cancelTrip,
  getDailySchedule,

  // Phase 2: GPS
  submitGpsLocation,
  getActiveBusLocations,
  getBusLocationHistory,

  // Phase 2: Attendance
  getTripAttendance,
  markStudentBoarding,
  markStudentDrop,
  correctAttendance,

  // Phase 2: Role Portals
  getDriverTrips,
  getSupervisorDashboardSummary,
  getParentChildTransport,
  getMyStudentTransport,

  // Phase 3: Vehicle Maintenance
  getMaintenanceRecords,
  getMaintenanceById,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  completeMaintenance,
  getDocumentExpiryAlerts,

  // Phase 3: Fuel & Mileage
  getFuelRecords,
  createFuelRecord,
  getFuelMileageStats,

  // Phase 3: Expenses
  getExpenses,
  createExpense,
  approveExpense,
  rejectExpense,

  // Phase 3: Fee Management & Receipts
  getFeeStructures,
  createFeeStructure,
  getStudentTransportFees,
  assignStudentFee,
  recordFeePayment,
  getPaymentReceipt,
  getTransportFinancialSummary,

  // Phase 4: Safety & Emergency SOS
  getSafetyDashboardSummary,
  triggerSosAlert,
  getEmergencyAlerts,
  getEmergencyAlertById,
  acknowledgeEmergencyAlert,
  updateEmergencyResponse,
  resolveEmergencyAlert,

  // Phase 4: Accidents & Incidents
  getIncidents,
  getIncidentById,
  createIncident,
  assignIncident,
  updateIncidentStatus,

  // Phase 4: Geofencing & Overspeed
  getGeofences,
  createGeofence,
  updateGeofence,
  getGeofenceEvents,
  recordGeofenceEvent,
  getOverspeedEvents,
  recordOverspeedEvent,

  // Phase 4: Parent Portal
  getParentTransportData,

  // Phase 4: Complaints
  submitComplaint,
  getComplaints,
  getComplaintById,
  assignComplaint,
  respondToComplaint,

  // Phase 4: Announcements
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deactivateAnnouncement,

  // Phase 4: Notifications & Preferences
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationPreferences,
  updateNotificationPreferences
};
