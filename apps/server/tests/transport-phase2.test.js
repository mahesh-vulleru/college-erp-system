const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const { ROLES } = require('@college-erp/shared');

const User = require('../src/modules/auth/auth.model');
const {
  Bus,
  Route,
  Driver,
  StudentTransportAllocation,
  TransportSetting,
  Trip,
  GpsLocation,
  StudentTripAttendance
} = require('../src/modules/transport/models');

describe('Transport Management System (Phase 2: Trips, GPS & Attendance) Test Suite', () => {
  const adminUser = {
    _id: '507f1f77bcf86cd799439201',
    name: 'Mr. Robert Hayes',
    email: 'transport@college.edu',
    role: ROLES.TRANSPORT_ADMIN,
    status: 'active'
  };

  const supervisorUser = {
    _id: '507f1f77bcf86cd799439202',
    name: 'Ms. Sarah Connor',
    email: 'supervisor.transport@college.edu',
    role: ROLES.TRANSPORT_SUPERVISOR,
    status: 'active'
  };

  const driverUser = {
    _id: '507f1f77bcf86cd799439203',
    name: 'Mr. James Wilson',
    email: 'driver.james@college.edu',
    role: ROLES.BUS_DRIVER,
    status: 'active'
  };

  const studentUser = {
    _id: '507f1f77bcf86cd799439204',
    name: 'Aarav Sharma',
    email: 'student.aarav@college.edu',
    role: ROLES.STUDENT,
    status: 'active'
  };

  const adminToken = jwt.sign(
    { id: adminUser._id, role: adminUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const supervisorToken = jwt.sign(
    { id: supervisorUser._id, role: supervisorUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const driverToken = jwt.sign(
    { id: driverUser._id, role: driverUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const studentToken = jwt.sign(
    { id: studentUser._id, role: studentUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  beforeEach(() => {
    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const idStr = String(id);
      let u = adminUser;
      if (idStr === String(studentUser._id)) u = studentUser;
      else if (idStr === String(supervisorUser._id)) u = supervisorUser;
      else if (idStr === String(driverUser._id)) u = driverUser;
      return {
        select: jest.fn().mockResolvedValue(u)
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. TRIP & SCHEDULE CREATION & VALIDATION
  // -------------------------------------------------------------------------
  describe('1. Trip Management & Conflict Prevention', () => {
    it('creates a scheduled trip successfully when bus and driver are available', async () => {
      jest.spyOn(Trip, 'findOne').mockResolvedValue(null);
      jest.spyOn(Bus, 'findById').mockResolvedValue({
        _id: 'b1',
        busId: 'BUS-01',
        busName: 'Bus 1',
        currentStatus: 'active'
      });
      jest.spyOn(Driver, 'findById').mockResolvedValue({
        _id: 'd1',
        fullName: 'James Wilson',
        availabilityStatus: 'available'
      });
      jest.spyOn(Route, 'findById').mockResolvedValue({
        _id: 'r1',
        routeName: 'North Corridor'
      });
      jest.spyOn(Trip, 'find').mockResolvedValue([]);
      jest.spyOn(StudentTransportAllocation, 'find').mockResolvedValue([]);
      jest.spyOn(Trip.prototype, 'save').mockResolvedValue({
        _id: 't1',
        tripId: 'TRP-2026-001',
        tripType: 'morning_pickup',
        scheduledDeparture: '07:30',
        scheduledArrival: '08:45',
        tripStatus: 'scheduled'
      });

      const res = await request(app)
        .post('/api/v1/transport/trips')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tripId: 'TRP-2026-001',
          bus: 'b1',
          driver: 'd1',
          route: 'r1',
          tripType: 'morning_pickup',
          tripDate: '2026-11-03',
          scheduledDeparture: '07:30',
          scheduledArrival: '08:45'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tripId).toBe('TRP-2026-001');
    });

    it('rejects trip creation if the assigned bus is inactive or under maintenance', async () => {
      jest.spyOn(Trip, 'findOne').mockResolvedValue(null);
      jest.spyOn(Bus, 'findById').mockResolvedValue({
        _id: 'b1',
        busName: 'Bus 1',
        currentStatus: 'under_maintenance'
      });

      const res = await request(app)
        .post('/api/v1/transport/trips')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tripId: 'TRP-2026-002',
          bus: 'b1',
          driver: 'd1',
          route: 'r1',
          tripDate: '2026-11-03',
          scheduledDeparture: '07:30',
          scheduledArrival: '08:45'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Only active buses can be scheduled');
    });

    it('prevents overlapping trips for the same bus on the same date with 409 Conflict', async () => {
      jest.spyOn(Trip, 'findOne').mockResolvedValue(null);
      jest.spyOn(Bus, 'findById').mockResolvedValue({
        _id: 'b1',
        busName: 'Campus Express 1',
        currentStatus: 'active'
      });
      jest.spyOn(Driver, 'findById').mockResolvedValue({
        _id: 'd1',
        fullName: 'Driver One',
        availabilityStatus: 'available'
      });
      jest.spyOn(Route, 'findById').mockResolvedValue({ _id: 'r1' });
      // Simulate existing overlapping trip for bus
      jest.spyOn(Trip, 'find').mockResolvedValue([
        {
          tripId: 'EXISTING-001',
          scheduledDeparture: '07:00',
          scheduledArrival: '08:00',
          tripStatus: 'scheduled'
        }
      ]);

      const res = await request(app)
        .post('/api/v1/transport/trips')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tripId: 'TRP-NEW',
          bus: 'b1',
          driver: 'd1',
          route: 'r1',
          tripDate: '2026-11-03',
          scheduledDeparture: '07:30', // overlaps with 07:00 - 08:00
          scheduledArrival: '08:30'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('overlapping trip');
    });

    it('starts an active trip and updates driver availability to on_duty', async () => {
      const mockTrip = {
        _id: 't1',
        tripId: 'TRP-2026-001',
        driver: 'd1',
        tripStatus: 'scheduled',
        save: jest.fn().mockResolvedValue(true)
      };
      jest.spyOn(Trip, 'findById').mockResolvedValue(mockTrip);
      jest.spyOn(Driver, 'findByIdAndUpdate').mockResolvedValue(true);

      const res = await request(app)
        .patch('/api/v1/transport/trips/t1/start')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockTrip.tripStatus).toBe('in_progress');
      expect(Driver.findByIdAndUpdate).toHaveBeenCalledWith('d1', { availabilityStatus: 'on_duty' });
    });

    it('completes an active trip and returns driver to available status', async () => {
      const mockTrip = {
        _id: 't1',
        tripId: 'TRP-2026-001',
        driver: 'd1',
        tripStatus: 'in_progress',
        save: jest.fn().mockResolvedValue(true)
      };
      jest.spyOn(Trip, 'findById').mockResolvedValue(mockTrip);
      jest.spyOn(Driver, 'findByIdAndUpdate').mockResolvedValue(true);

      const res = await request(app)
        .patch('/api/v1/transport/trips/t1/complete')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockTrip.tripStatus).toBe('completed');
      expect(Driver.findByIdAndUpdate).toHaveBeenCalledWith('d1', { availabilityStatus: 'available' });
    });
  });

  // -------------------------------------------------------------------------
  // 2. DAILY TRANSPORT SCHEDULE
  // -------------------------------------------------------------------------
  describe('2. Daily Transport Schedule', () => {
    it('returns 200 with categorised morning pickup and evening drop trips', async () => {
      const mockTrips = [
        {
          _id: 't1',
          tripId: 'TRP-M1',
          tripType: 'morning_pickup',
          tripStatus: 'completed',
          scheduledDeparture: '07:00'
        },
        {
          _id: 't2',
          tripId: 'TRP-E1',
          tripType: 'evening_drop',
          tripStatus: 'scheduled',
          scheduledDeparture: '16:30'
        }
      ];

      jest.spyOn(Trip, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(mockTrips)
            })
          })
        })
      });

      const res = await request(app)
        .get('/api/v1/transport/trips/schedule/daily?date=2026-11-03')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.morningCount).toBe(1);
      expect(res.body.data.summary.eveningCount).toBe(1);
      expect(res.body.data.summary.completedCount).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // 3. LIVE GPS TRACKING
  // -------------------------------------------------------------------------
  describe('3. Live GPS Tracking & Telemetry', () => {
    it('records valid driver GPS telemetry coordinates', async () => {
      jest.spyOn(GpsLocation.prototype, 'save').mockResolvedValue({
        _id: 'g1',
        bus: 'b1',
        latitude: 12.9716,
        longitude: 77.5946,
        speed: 40,
        isOnline: true
      });

      const res = await request(app)
        .post('/api/v1/transport/gps/update')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          bus: 'b1',
          latitude: 12.9716,
          longitude: 77.5946,
          speed: 40,
          heading: 90
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('rejects invalid or out-of-range GPS coordinates with 400', async () => {
      const res = await request(app)
        .post('/api/v1/transport/gps/update')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          bus: 'b1',
          latitude: 999.0, // invalid latitude > 90
          longitude: 77.5946
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.includes('Latitude'))).toBe(true);
    });

    it('accurately reports disconnected status when bus GPS data is older than threshold', async () => {
      jest.spyOn(Bus, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue([
            {
              _id: 'b1',
              busId: 'BUS-01',
              busName: 'Bus 1',
              registrationNumber: 'KA-01-1234',
              currentStatus: 'active'
            }
          ])
        })
      });

      // 10 minutes old location
      const oldTimestamp = new Date(Date.now() - 10 * 60 * 1000);
      jest.spyOn(GpsLocation, 'findOne').mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            latitude: 12.9716,
            longitude: 77.5946,
            speed: 0,
            timestamp: oldTimestamp
          })
        })
      });

      const res = await request(app)
        .get('/api/v1/transport/gps/active')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.buses[0].isOnline).toBe(false);
      expect(res.body.data.buses[0].connectionStatus).toBe('disconnected');
    });
  });

  // -------------------------------------------------------------------------
  // 4. STUDENT BOARDING & ATTENDANCE
  // -------------------------------------------------------------------------
  describe('4. Student Boarding & Attendance Operations', () => {
    it('marks student boarding and updates timestamp and boardingStatus', async () => {
      const mockRecord = {
        _id: 'att1',
        attendanceId: 'ATT-TRP-001-24CSE001',
        studentName: 'Aarav Sharma',
        boardingStatus: 'pending',
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(StudentTripAttendance, 'findOne').mockResolvedValue(mockRecord);

      const res = await request(app)
        .patch('/api/v1/transport/attendance/att1/board')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockRecord.boardingStatus).toBe('boarded');
    });

    it('rejects student drop-off confirmation if the student was not marked as boarded first', async () => {
      const mockRecord = {
        _id: 'att1',
        attendanceId: 'ATT-TRP-001-24CSE001',
        studentName: 'Aarav Sharma',
        boardingStatus: 'pending', // NOT boarded!
        dropStatus: 'pending',
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(StudentTripAttendance, 'findOne').mockResolvedValue(mockRecord);

      const res = await request(app)
        .patch('/api/v1/transport/attendance/att1/drop')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ overrideCorrection: false });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Boarding confirmation required before drop-off');
    });

    it('corrects attendance with mandatory audit reason and records correction history', async () => {
      const mockRecord = {
        _id: 'att1',
        rollNumber: '24CSE001',
        boardingStatus: 'pending',
        dropStatus: 'pending',
        correctionHistory: [],
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(StudentTripAttendance, 'findOne').mockResolvedValue(mockRecord);

      const res = await request(app)
        .patch('/api/v1/transport/attendance/att1/correct')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          reason: 'Manual boarding verification confirmed by bus attendant',
          newBoardingStatus: 'boarded',
          newDropStatus: 'pending'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockRecord.boardingStatus).toBe('boarded');
      expect(mockRecord.correctionHistory.length).toBe(1);
      expect(mockRecord.correctionHistory[0].reason).toContain('Manual boarding verification');
    });
  });

  // -------------------------------------------------------------------------
  // 5. ROLE-BASED ACCESS CONTROL (RBAC) SECURITY
  // -------------------------------------------------------------------------
  describe('5. RBAC Enforcement on Phase 2 APIs', () => {
    it('forbids Student role from creating trips with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/transport/trips')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          tripId: 'TRP-HACK',
          bus: 'b1'
        });

      expect(res.statusCode).toBe(403);
    });

    it('forbids Student role from executing attendance corrections with 403 Forbidden', async () => {
      const res = await request(app)
        .patch('/api/v1/transport/attendance/att1/correct')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          reason: 'Unauthorized student override'
        });

      expect(res.statusCode).toBe(403);
    });
  });
});

