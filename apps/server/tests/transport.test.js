const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const { ROLES } = require('@college-erp/shared');

const User = require('../src/modules/auth/auth.model');
const Student = require('../src/modules/students/student.model');
const {
  Bus,
  Route,
  Driver,
  StudentTransportAllocation,
  TransportSetting
} = require('../src/modules/transport/models');

describe('Transport Management System (Phase 1) Test Suite', () => {
  const transportAdminUser = {
    _id: '507f1f77bcf86cd799439201',
    name: 'Mr. Robert Hayes',
    email: 'transport@college.edu',
    role: ROLES.TRANSPORT_ADMIN,
    status: 'active'
  };

  const studentUser = {
    _id: '507f1f77bcf86cd799439202',
    name: 'Aarav Sharma',
    email: 'student.aarav@college.edu',
    role: ROLES.STUDENT,
    status: 'active'
  };

  const adminToken = jwt.sign(
    { id: transportAdminUser._id, role: transportAdminUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const studentToken = jwt.sign(
    { id: studentUser._id, role: studentUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  beforeEach(() => {
    jest.spyOn(User, 'findById').mockImplementation((id) => ({
      select: jest.fn().mockResolvedValue(
        String(id) === String(studentUser._id) ? studentUser : transportAdminUser
      )
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. DASHBOARD & SUMMARY METRICS
  // -------------------------------------------------------------------------
  describe('1. Dashboard Summary & Fleet Analytics', () => {
    it('rejects unauthenticated requests to summary with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/transport/summary');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 200 and comprehensive fleet summary statistics for Transport Admin', async () => {
      jest.spyOn(Bus, 'countDocuments').mockResolvedValue(4);
      jest.spyOn(Route, 'countDocuments').mockResolvedValue(2);
      jest.spyOn(Driver, 'countDocuments').mockResolvedValue(3);
      jest.spyOn(StudentTransportAllocation, 'countDocuments').mockResolvedValue(10);
      jest.spyOn(Bus, 'find').mockReturnValue({
        select: jest.fn().mockResolvedValue([
          { _id: 'b1', seatingCapacity: 40, busId: 'BUS-01', busName: 'Bus 1' },
          { _id: 'b2', seatingCapacity: 50, busId: 'BUS-02', busName: 'Bus 2' }
        ])
      });
      jest.spyOn(Route, 'find').mockReturnValue({
        select: jest.fn().mockResolvedValue([
          { _id: 'r1', routeName: 'Route 1', routeCode: 'R-01', destination: 'Campus' }
        ])
      });
      jest.spyOn(StudentTransportAllocation, 'aggregate').mockResolvedValue([
        { _id: 'r1', count: 10 }
      ]);
      jest.spyOn(Driver, 'aggregate').mockResolvedValue([
        { _id: 'available', count: 3 }
      ]);
      jest.spyOn(Bus, 'aggregate').mockResolvedValue([
        { _id: 'active', count: 2 }
      ]);

      const res = await request(app)
        .get('/api/v1/transport/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data.summary).toHaveProperty('totalBuses');
      expect(res.body.data.summary).toHaveProperty('availableBusCapacity');
      expect(res.body.data).toHaveProperty('charts');
    });
  });

  // -------------------------------------------------------------------------
  // 2. BUS MANAGEMENT
  // -------------------------------------------------------------------------
  describe('2. Bus & Vehicle Management', () => {
    it('lists buses with pagination and calculated seat availability', async () => {
      const mockBuses = [
        {
          _id: '507f1f77bcf86cd799439210',
          busId: 'BUS-01',
          busName: 'Campus Express 1',
          registrationNumber: 'KA-01-AB-1234',
          seatingCapacity: 40,
          currentStatus: 'active',
          toObject() { return { ...this }; }
        }
      ];

      jest.spyOn(Bus, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(Bus, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockBuses)
      });
      jest.spyOn(StudentTransportAllocation, 'aggregate').mockResolvedValue([
        { _id: '507f1f77bcf86cd799439210', count: 15 }
      ]);

      const res = await request(app)
        .get('/api/v1/transport/buses')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].assignedStudentCount).toBe(15);
      expect(res.body.data[0].availableSeats).toBe(25);
    });

    it('rejects bus creation with non-positive or invalid capacity', async () => {
      const res = await request(app)
        .post('/api/v1/transport/buses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          busId: 'BUS-99',
          registrationNumber: 'KA-01-ZZ-9999',
          busName: 'Invalid Bus',
          seatingCapacity: -5
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toContain('Seating capacity must be a positive integer');
    });

    it('creates a new bus successfully with unique registration', async () => {
      jest.spyOn(Bus, 'findOne').mockResolvedValue(null);
      jest.spyOn(Bus, 'create').mockResolvedValue({
        _id: '507f1f77bcf86cd799439211',
        busId: 'BUS-02',
        registrationNumber: 'KA-01-CD-5678',
        busName: 'Campus Express 2',
        seatingCapacity: 50,
        currentStatus: 'active'
      });

      const res = await request(app)
        .post('/api/v1/transport/buses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          busId: 'BUS-02',
          registrationNumber: 'KA-01-CD-5678',
          busName: 'Campus Express 2',
          seatingCapacity: 50,
          currentStatus: 'active'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.busId).toBe('BUS-02');
    });
  });

  // -------------------------------------------------------------------------
  // 3. ROUTE & STOP MANAGEMENT
  // -------------------------------------------------------------------------
  describe('3. Route & Stop Management', () => {
    it('creates a new transit route with multiple ordered stops', async () => {
      jest.spyOn(Route, 'findOne').mockResolvedValue(null);
      jest.spyOn(Route, 'create').mockResolvedValue({
        _id: '507f1f77bcf86cd799439220',
        routeId: 'RT-01',
        routeName: 'North City Express',
        routeCode: 'R-NC-101',
        startingPoint: 'City Station',
        destination: 'Campus',
        stops: [
          { stopId: 'ST-01', stopName: 'Halt 1', stopSequence: 1, pickupTime: '07:00 AM', dropTime: '05:30 PM' }
        ]
      });

      const res = await request(app)
        .post('/api/v1/transport/routes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          routeId: 'RT-01',
          routeName: 'North City Express',
          routeCode: 'R-NC-101',
          startingPoint: 'City Station',
          destination: 'Campus',
          stops: [
            { stopId: 'ST-01', stopName: 'Halt 1', stopSequence: 1, pickupTime: '07:00 AM', dropTime: '05:30 PM' }
          ]
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.routeCode).toBe('R-NC-101');
    });

    it('rejects route with duplicate stop sequence numbers', async () => {
      const res = await request(app)
        .post('/api/v1/transport/routes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          routeId: 'RT-02',
          routeName: 'Duplicate Sequence Route',
          routeCode: 'R-DUP-01',
          startingPoint: 'Start',
          destination: 'End',
          stops: [
            { stopId: 'ST-01', stopName: 'Stop A', stopSequence: 1, pickupTime: '07:00 AM', dropTime: '05:30 PM' },
            { stopId: 'ST-02', stopName: 'Stop B', stopSequence: 1, pickupTime: '07:15 AM', dropTime: '05:15 PM' }
          ]
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.includes('Duplicate stop sequence'))).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 4. DRIVER & PERSONNEL MANAGEMENT
  // -------------------------------------------------------------------------
  describe('4. Driver & Personnel Management', () => {
    it('creates a qualified driver record with valid driving licence', async () => {
      jest.spyOn(Driver, 'findOne').mockResolvedValue(null);
      jest.spyOn(Driver, 'create').mockResolvedValue({
        _id: '507f1f77bcf86cd799439230',
        driverId: 'DRV-01',
        fullName: 'Rajesh Kumar',
        phoneNumber: '+91 98450 11223',
        drivingLicenceNumber: 'DL-KA-2015-001234',
        licenceExpiryDate: new Date('2028-12-31'),
        availabilityStatus: 'available'
      });

      const res = await request(app)
        .post('/api/v1/transport/drivers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          driverId: 'DRV-01',
          fullName: 'Rajesh Kumar',
          phoneNumber: '+91 98450 11223',
          drivingLicenceNumber: 'DL-KA-2015-001234',
          licenceExpiryDate: '2028-12-31'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fullName).toBe('Rajesh Kumar');
    });
  });

  // -------------------------------------------------------------------------
  // 5. STUDENT TRANSPORT ALLOCATION & CAPACITY VALIDATION
  // -------------------------------------------------------------------------
  describe('5. Student Transport Allocation & Bus Capacity Enforcement', () => {
    const mockStudent = {
      _id: '507f1f77bcf86cd799439240',
      rollNumber: 'CS2023001',
      guardianName: 'Rajesh Sharma',
      guardianPhone: '+91 98765 11223',
      user: { name: 'Aarav Sharma', email: 'student.aarav@college.edu' },
      department: { name: 'Computer Science & Engineering' }
    };

    const mockBus = {
      _id: '507f1f77bcf86cd799439210',
      busId: 'BUS-01',
      busName: 'Campus Express 1',
      seatingCapacity: 40,
      currentStatus: 'active'
    };

    const mockRoute = {
      _id: '507f1f77bcf86cd799439220',
      routeId: 'RT-01',
      routeName: 'North City Express',
      routeStatus: 'active',
      stops: [
        { stopName: 'Hebbal Flyover Junction', pickupTime: '07:35 AM', dropTime: '05:10 PM' }
      ]
    };

    it('successfully allocates eligible student when bus has remaining seats', async () => {
      jest.spyOn(Student, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: (cb) => cb(mockStudent)
      });
      jest.spyOn(StudentTransportAllocation, 'findOne').mockResolvedValue(null);
      jest.spyOn(Bus, 'findById').mockResolvedValue(mockBus);
      jest.spyOn(Route, 'findById').mockResolvedValue(mockRoute);
      jest.spyOn(StudentTransportAllocation, 'countDocuments').mockResolvedValue(10);
      jest.spyOn(StudentTransportAllocation, 'create').mockResolvedValue({
        _id: '507f1f77bcf86cd799439250',
        allocationId: 'STA-2026-0001',
        studentName: 'Aarav Sharma',
        rollNumber: 'CS2023001',
        pickupStop: 'Hebbal Flyover Junction',
        allocationStatus: 'active'
      });

      const res = await request(app)
        .post('/api/v1/transport/allocations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student: mockStudent._id,
          bus: mockBus._id,
          route: mockRoute._id,
          pickupStop: 'Hebbal Flyover Junction',
          dropStop: 'Hebbal Flyover Junction'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.allocationId).toBe('STA-2026-0001');
    });

    it('strictly prevents allocation when bus capacity is full', async () => {
      jest.spyOn(Student, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: (cb) => cb(mockStudent)
      });
      jest.spyOn(StudentTransportAllocation, 'findOne').mockResolvedValue(null);
      jest.spyOn(Bus, 'findById').mockResolvedValue(mockBus);
      jest.spyOn(Route, 'findById').mockResolvedValue(mockRoute);
      // Mock bus is 100% full (40 active allocations for 40 seats)
      jest.spyOn(StudentTransportAllocation, 'countDocuments').mockResolvedValue(40);

      const res = await request(app)
        .post('/api/v1/transport/allocations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student: mockStudent._id,
          bus: mockBus._id,
          route: mockRoute._id,
          pickupStop: 'Hebbal Flyover Junction',
          dropStop: 'Hebbal Flyover Junction'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Bus capacity exceeded');
    });

    it('rejects allocation when selected pickup stop does not belong to route', async () => {
      jest.spyOn(Student, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: (cb) => cb(mockStudent)
      });
      jest.spyOn(StudentTransportAllocation, 'findOne').mockResolvedValue(null);
      jest.spyOn(Bus, 'findById').mockResolvedValue(mockBus);
      jest.spyOn(Route, 'findById').mockResolvedValue(mockRoute);

      const res = await request(app)
        .post('/api/v1/transport/allocations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student: mockStudent._id,
          bus: mockBus._id,
          route: mockRoute._id,
          pickupStop: 'Nonexistent Unknown Stop',
          dropStop: 'Nonexistent Unknown Stop'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('does not belong to Route');
    });
  });

  // -------------------------------------------------------------------------
  // 6. ROLE-BASED ACCESS CONTROL
  // -------------------------------------------------------------------------
  describe('6. Role-Based Access Control on Transport APIs', () => {
    it('forbids Student role from registering a bus with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/transport/buses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          busId: 'BUS-HACK',
          registrationNumber: 'KA-01-XX-0000',
          busName: 'Hacked Bus',
          seatingCapacity: 30
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });
  });
});
