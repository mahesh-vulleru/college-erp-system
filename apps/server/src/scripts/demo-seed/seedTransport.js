/**
 * Seed Demo Transport Management
 * 10 Buses, 10 Routes, 10 Drivers, 10 Attendants, 100 Student Allocations, 10 Trips, Maintenance, Fuel & GPS
 */
const Bus = require('../../modules/transport/models/bus.model');
const Driver = require('../../modules/transport/models/driver.model');
const Route = require('../../modules/transport/models/route.model');
const StudentTransportAllocation = require('../../modules/transport/models/studentTransportAllocation.model');
const Trip = require('../../modules/transport/models/trip.model');
const FuelRecord = require('../../modules/transport/models/fuelRecord.model');
const VehicleMaintenance = require('../../modules/transport/models/vehicleMaintenance.model');
const GpsLocation = require('../../modules/transport/models/gpsLocation.model');
const { DEMO_PREFIX, DEMO_TAG } = require('./config');

const ROUTE_DEFINITIONS = [
  { name: 'City Center Express Corridor', start: 'Central Railway Station', end: 'College Main Campus Gate' },
  { name: 'Cyber Hub Tech Corridor', start: 'Cyber City Metro Interchange', end: 'College Tech Gate' },
  { name: 'North Suburb Radial Line', start: 'North Terminal Bus Stand', end: 'College North Gate' },
  { name: 'South Ring Express Feeder', start: 'South Ring Road Flyover', end: 'College Main Campus Gate' },
  { name: 'East Metro Feeder Route', start: 'East Metro Station Junction', end: 'College Main Gate' },
  { name: 'West Residential Shuttle', start: 'West Enclave Market', end: 'College Campus Bus Bay' },
  { name: 'Airport Highway Direct', start: 'Airport Express Road Crossing', end: 'College Tech Gate' },
  { name: 'Old Town Heritage Link', start: 'Old City Clock Tower Square', end: 'College Main Gate' },
  { name: 'Industrial Zone Transit', start: 'Industrial Area Sector 5', end: 'College Campus Bus Bay' },
  { name: 'Greenfield Valley Shuttle', start: 'Greenfield Eco Park Terminal', end: 'College North Gate' }
];

async function seedTransport(userMap, studentProfiles) {
  console.log('[Transport] Seeding 10 buses, 10 routes, drivers, attendants, 100 allocations, trips, and telemetry...');

  const buses = [];
  const drivers = [];
  const attendants = [];
  const routes = [];

  // 1. 10 Buses
  for (let i = 1; i <= 10; i++) {
    const num = String(i).padStart(2, '0');
    const busId = `${DEMO_PREFIX}BUS-${num}`;
    const registrationNumber = `DL 01 DM ${1000 + i}`;

    let bus = await Bus.findOne({ busId });
    if (!bus) {
      bus = await Bus.create({
        busId,
        registrationNumber,
        busName: `Demo Express Cruiser ${num} ${DEMO_TAG}`,
        manufacturer: i % 2 === 0 ? 'Tata Motors' : 'Ashok Leyland',
        model: i % 2 === 0 ? 'Starbus Ultra 40' : 'Lynx Smart 45',
        manufacturingYear: 2023 + (i % 2),
        busType: i <= 2 ? 'ac' : 'deluxe',
        fuelType: i % 3 === 0 ? 'cng' : 'diesel',
        seatingCapacity: 45,
        status: 'active'
      });
    }
    buses.push(bus);
  }

  // 2. 10 Drivers & 10 Attendants
  for (let i = 1; i <= 10; i++) {
    const num = String(i).padStart(2, '0');
    const bus = buses[i - 1];

    // Driver
    const driverId = `${DEMO_PREFIX}DRV-${num}`;
    let driver = await Driver.findOne({ driverId });
    if (!driver) {
      driver = await Driver.create({
        driverId,
        user: userMap.drivers[i - 1]._id,
        fullName: userMap.drivers[i - 1].name,
        staffType: 'driver',
        phoneNumber: `98765432${num}`,
        drivingLicenceNumber: `DL-DEMO-${1000 + i}`,
        licenceExpiryDate: new Date('2032-01-01'),
        assignedBus: bus._id,
        status: 'active'
      });
    }
    drivers.push(driver);

    // Attendant
    const attendantId = `${DEMO_PREFIX}ATT-${num}`;
    let attendant = await Driver.findOne({ driverId: attendantId });
    if (!attendant) {
      attendant = await Driver.create({
        driverId: attendantId,
        user: userMap.attendants[i - 1]._id,
        fullName: userMap.attendants[i - 1].name,
        staffType: 'attendant',
        phoneNumber: `98765442${num}`,
        drivingLicenceNumber: `DL-ATT-DEMO-${1000 + i}`,
        licenceExpiryDate: new Date('2032-01-01'),
        assignedBus: bus._id,
        status: 'active'
      });
    }
    attendants.push(attendant);
  }

  // 3. Supervisor Profile
  let supervisor = await Driver.findOne({ driverId: `${DEMO_PREFIX}SUP-01` });
  if (!supervisor) {
    supervisor = await Driver.create({
      driverId: `${DEMO_PREFIX}SUP-01`,
      user: userMap.core.transport_supervisor._id,
      fullName: userMap.core.transport_supervisor.name,
      staffType: 'supervisor',
      phoneNumber: '9876545000',
      drivingLicenceNumber: 'DL-SUP-DEMO-001',
      licenceExpiryDate: new Date('2032-01-01'),
      status: 'active'
    });
  }

  // 4. 10 Routes
  for (let i = 0; i < 10; i++) {
    const num = String(i + 1).padStart(2, '0');
    const routeCode = `${DEMO_PREFIX}RT-${num}`;
    const bus = buses[i];
    const driver = drivers[i];
    const attendant = attendants[i];
    const def = ROUTE_DEFINITIONS[i];

    let route = await Route.findOne({ routeCode });
    if (!route) {
      route = await Route.create({
        routeId: `${DEMO_PREFIX}ROUTE-${num}`,
        routeCode,
        routeName: `${def.name} ${DEMO_TAG}`,
        startingPoint: def.start,
        destination: def.end,
        totalDistance: 18 + i * 2,
        estimatedDuration: `${35 + i * 3} mins`,
        stops: [
          { stopId: `${DEMO_PREFIX}ST-${num}-1`, stopName: def.start, stopSequence: 1, pickupTime: '07:15', dropTime: '17:45', latitude: 28.6139 + i * 0.01, longitude: 77.2090 + i * 0.01 },
          { stopId: `${DEMO_PREFIX}ST-${num}-2`, stopName: `Midway Junction Sector ${10 + i}`, stopSequence: 2, pickupTime: '07:35', dropTime: '17:25', latitude: 28.6239 + i * 0.01, longitude: 77.2190 + i * 0.01 },
          { stopId: `${DEMO_PREFIX}ST-${num}-3`, stopName: def.end, stopSequence: 3, pickupTime: '08:10', dropTime: '16:50', latitude: 28.6339 + i * 0.01, longitude: 77.2290 + i * 0.01 }
        ],
        assignedBus: bus._id,
        assignedDriver: driver._id,
        assignedAttendant: attendant._id,
        routeStatus: 'active'
      });
    }
    routes.push(route);
  }

  // 5. 100 Student Transport Allocations (10 students per bus/route)
  let allocCount = 0;
  for (let i = 0; i < studentProfiles.length; i++) {
    const student = studentProfiles[i];
    const parentUser = userMap.parents[i];
    const routeIdx = i % 10;
    const bus = buses[routeIdx];
    const route = routes[routeIdx];
    const num = String(i + 1).padStart(3, '0');
    const allocationId = `${DEMO_PREFIX}STA-${num}`;

    let alloc = await StudentTransportAllocation.findOne({ allocationId });
    if (!alloc) {
      await StudentTransportAllocation.create({
        allocationId,
        student: student._id,
        user: student.user,
        studentName: userMap.students[i].name,
        rollNumber: student.rollNumber,
        department: 'Engineering',
        academicYear: '2025-2026',
        guardianName: parentUser.name,
        guardianPhone: parentUser.email,
        bus: bus._id,
        route: route._id,
        pickupStop: route.stops[1].stopName,
        dropStop: route.destination,
        pickupTime: '07:35',
        dropTime: '16:50',
        allocationStatus: 'active',
        transportFeeStatus: i % 4 === 0 ? 'pending' : 'paid'
      });
      allocCount++;
    }
  }

  // 6. 10 Daily Trips & Telemetry
  let tripCount = 0;
  for (let i = 0; i < 10; i++) {
    const num = String(i + 1).padStart(2, '0');
    const tripId = `${DEMO_PREFIX}TRIP-${num}`;
    const bus = buses[i];
    const driver = drivers[i];
    const route = routes[i];

    let trip = await Trip.findOne({ tripId });
    if (!trip) {
      trip = await Trip.create({
        tripId,
        bus: bus._id,
        driver: driver._id,
        route: route._id,
        tripType: 'morning_pickup',
        tripDate: new Date(),
        scheduledDeparture: '07:15',
        scheduledArrival: '08:10',
        tripStatus: i < 5 ? 'in_progress' : 'completed'
      });
      tripCount++;
    }

    // Telemetry location
    let gps = await GpsLocation.findOne({ bus: bus._id });
    if (!gps) {
      await GpsLocation.create({
        bus: bus._id,
        trip: trip._id,
        driver: driver._id,
        latitude: 28.6250 + i * 0.015,
        longitude: 77.2150 + i * 0.015,
        speed: 38.5,
        heading: 120,
        accuracy: 4.5,
        isOnline: true,
        timestamp: new Date()
      });
    }
  }

  // 7. Fuel & Maintenance Records
  for (let i = 0; i < 10; i++) {
    const bus = buses[i];
    const num = String(i + 1).padStart(3, '0');

    // Fuel
    const fuelRecordId = `${DEMO_PREFIX}FUEL-${num}`;
    let fuel = await FuelRecord.findOne({ fuelRecordId });
    if (!fuel) {
      await FuelRecord.create({
        fuelRecordId,
        bus: bus._id,
        busRegistrationNumber: bus.registrationNumber,
        fuelType: bus.fuelType || 'diesel',
        fuelStation: 'Campus Transit Fuel Hub',
        fuelDate: new Date(Date.now() - (i * 2 + 1) * 24 * 60 * 60 * 1000),
        fuelQuantity: 45.0,
        pricePerLitre: 92.5,
        totalFuelCost: 4162.5,
        odometerReading: 15000 + i * 200
      });
    }

    // Maintenance
    const maintenanceId = `${DEMO_PREFIX}MAINT-${num}`;
    let maint = await VehicleMaintenance.findOne({ maintenanceId });
    if (!maint) {
      await VehicleMaintenance.create({
        maintenanceId,
        bus: bus._id,
        busRegistrationNumber: bus.registrationNumber,
        maintenanceType: i % 2 === 0 ? 'Regular Service' : 'Brake Inspection',
        serviceDate: new Date(Date.now() - (i * 7 + 3) * 24 * 60 * 60 * 1000),
        nextServiceDate: new Date(Date.now() + (60 - i * 3) * 24 * 60 * 60 * 1000),
        odometerReading: 15400 + i * 1250,
        serviceProvider: 'Tata Authorized Fleet Workshop',
        serviceDescription: 'Periodic mechanical maintenance, brake check and oil lubrication',
        totalCost: 3500 + i * 450
      });
    }
  }

  console.log(`[Transport] Successfully provisioned ${buses.length} buses, ${routes.length} routes, ${allocCount} student allocations, and ${tripCount} active trips.`);
}

module.exports = { seedTransport };
