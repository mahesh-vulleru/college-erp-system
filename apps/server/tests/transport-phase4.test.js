const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const env = require('../src/config/env');
const { ROLES } = require('@college-erp/shared');
const {
  Bus,
  Route,
  Driver,
  Trip,
  GpsLocation,
  StudentTripAttendance,
  StudentTransportAllocation,
  StudentTransportFee,
  EmergencyAlert,
  TransportIncident,
  Geofence,
  GeofenceEvent,
  OverspeedEvent,
  TransportComplaint,
  TransportAnnouncement,
  TransportNotification
} = require('../src/modules/transport/models');
const User = require('../src/modules/auth/auth.model');
const Student = require('../src/modules/students/student.model');

describe('Transport Management System (Phase 4: Safety, SOS, Incidents, Parent Portal & Notifications) Test Suite', () => {
  let adminToken;
  let supervisorToken;
  let driverToken;
  let parentToken;
  let studentToken;

  const adminId = '507f1f77bcf86cd799439011';
  const supervisorId = '507f1f77bcf86cd799439012';
  const driverUserId = '507f1f77bcf86cd799439013';
  const parentId = '507f1f77bcf86cd799439014';
  const studentId = '507f1f77bcf86cd799439015';

  beforeAll(() => {
    const sign = (id, role) =>
      jwt.sign({ id, role }, env.JWT_SECRET, { expiresIn: '1d' });

    adminToken = sign(adminId, ROLES.TRANSPORT_ADMIN);
    supervisorToken = sign(supervisorId, ROLES.TRANSPORT_SUPERVISOR);
    driverToken = sign(driverUserId, ROLES.BUS_DRIVER);
    parentToken = sign(parentId, ROLES.PARENT);
    studentToken = sign(studentId, ROLES.STUDENT);
  });

  beforeEach(() => {
    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const idStr = String(id);
      let role = ROLES.TRANSPORT_ADMIN;
      let name = 'Admin User';
      if (idStr === supervisorId) {
        role = ROLES.TRANSPORT_SUPERVISOR;
        name = 'Supervisor Sharma';
      } else if (idStr === driverUserId) {
        role = ROLES.BUS_DRIVER;
        name = 'Driver Kumar';
      } else if (idStr === parentId) {
        role = ROLES.PARENT;
        name = 'Parent Patel';
      } else if (idStr === studentId) {
        role = ROLES.STUDENT;
        name = 'Aarav Sharma';
      }
      const userObj = {
        _id: id,
        name,
        role,
        status: 'active'
      };
      const query = Promise.resolve(userObj);
      query.select = jest.fn().mockResolvedValue(userObj);
      return query;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. SAFETY DASHBOARD & METRICS
  // -------------------------------------------------------------------------
  describe('1. Safety Dashboard Summary', () => {
    it('returns 200 and comprehensive safety statistics from database', async () => {
      jest.spyOn(TransportIncident, 'countDocuments')
        .mockResolvedValueOnce(12) // total
        .mockResolvedValueOnce(4)  // open
        .mockResolvedValueOnce(8)  // resolved
        .mockResolvedValueOnce(2)  // critical
        .mockResolvedValueOnce(3)  // accident
        .mockResolvedValueOnce(2); // breakdown
      jest.spyOn(EmergencyAlert, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(GeofenceEvent, 'countDocuments').mockResolvedValue(5);
      jest.spyOn(OverspeedEvent, 'countDocuments').mockResolvedValue(7);
      jest.spyOn(TransportComplaint, 'countDocuments').mockResolvedValue(3);

      jest.spyOn(TransportIncident, 'find').mockReturnValue({
        sort: () => ({ limit: () => ({ populate: () => ({ populate: () => Promise.resolve([]) }) }) })
      });
      jest.spyOn(EmergencyAlert, 'find').mockReturnValue({
        sort: () => ({ limit: () => ({ populate: () => ({ populate: () => Promise.resolve([]) }) }) })
      });
      jest.spyOn(GeofenceEvent, 'find').mockReturnValue({
        sort: () => ({ limit: () => ({ populate: () => Promise.resolve([]) }) })
      });

      const res = await request(app)
        .get('/api/v1/transport/safety/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary).toHaveProperty('totalSafetyIncidents', 12);
      expect(res.body.summary).toHaveProperty('openIncidents', 4);
      expect(res.body.summary).toHaveProperty('activeSosAlerts', 1);
    });
  });

  // -------------------------------------------------------------------------
  // 2. EMERGENCY SOS SYSTEM
  // -------------------------------------------------------------------------
  describe('2. Emergency SOS Management', () => {
    it('allows driver to trigger SOS alert and returns 201 Created', async () => {
      jest.spyOn(Bus, 'findById').mockResolvedValue({
        _id: 'bus1',
        busId: 'BUS-01',
        busName: 'Express 01',
        registrationNumber: 'KA-01-E-1001'
      });
      jest.spyOn(EmergencyAlert, 'findOne').mockResolvedValue(null);
      jest.spyOn(EmergencyAlert.prototype, 'save').mockResolvedValue({
        _id: 'sos1',
        alertId: 'SOS-2026-TEST1',
        bus: 'bus1',
        emergencyType: 'Medical Emergency',
        severity: 'Critical',
        status: 'Active'
      });
      jest.spyOn(User, 'find').mockReturnValue({
        select: () => Promise.resolve([])
      });

      const res = await request(app)
        .post('/api/v1/transport/safety/sos')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          bus: 'bus1',
          emergencyType: 'Medical Emergency',
          severity: 'Critical',
          description: 'Student experiencing sudden severe allergic reaction.'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Active');
    });

    it('acknowledges an active emergency SOS alert with response notes', async () => {
      const mockAlert = {
        _id: 'sos1',
        alertId: 'SOS-2026-TEST1',
        status: 'Active',
        auditHistory: [],
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(EmergencyAlert, 'findById').mockResolvedValue(mockAlert);

      const res = await request(app)
        .patch('/api/v1/transport/safety/sos/sos1/acknowledge')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ notes: 'Medical team dispatched from campus infirmary.' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockAlert.status).toBe('Acknowledged');
      expect(mockAlert.responseNotes).toContain('infirmary');
    });

    it('resolves an emergency alert and records audit log', async () => {
      const mockAlert = {
        _id: 'sos1',
        alertId: 'SOS-2026-TEST1',
        status: 'Acknowledged',
        auditHistory: [],
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(EmergencyAlert, 'findById').mockResolvedValue(mockAlert);

      const res = await request(app)
        .patch('/api/v1/transport/safety/sos/sos1/resolve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Student received medical care and is stable. Situation resolved.' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockAlert.status).toBe('Resolved');
    });
  });

  // -------------------------------------------------------------------------
  // 3. INCIDENT MANAGEMENT
  // -------------------------------------------------------------------------
  describe('3. Accident and Incident Management', () => {
    it('creates an incident report with valid category and description', async () => {
      jest.spyOn(Bus, 'findById').mockResolvedValue({
        _id: 'bus1',
        registrationNumber: 'KA-01-E-1001'
      });
      jest.spyOn(TransportIncident.prototype, 'save').mockResolvedValue({
        _id: 'inc1',
        incidentId: 'INC-2026-001',
        category: 'Vehicle Breakdown',
        severity: 'Medium',
        status: 'Reported'
      });

      const res = await request(app)
        .post('/api/v1/transport/safety/incidents')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          category: 'Vehicle Breakdown',
          severity: 'Medium',
          bus: 'bus1',
          description: 'Radiator overheating near Sector 12 junction.'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.incidentId).toBe('INC-2026-001');
    });

    it('assigns an incident to an investigation officer', async () => {
      const mockInc = {
        _id: 'inc1',
        incidentId: 'INC-2026-001',
        status: 'Reported',
        auditHistory: [],
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(TransportIncident, 'findById').mockResolvedValue(mockInc);

      const res = await request(app)
        .patch('/api/v1/transport/safety/incidents/inc1/assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ officerId: supervisorId, notes: 'Investigate radiator maintenance log.' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockInc.status).toBe('Under Investigation');
      expect(mockInc.assignedOfficerName).toBe('Supervisor Sharma');
    });
  });

  // -------------------------------------------------------------------------
  // 4. GEOFENCING & OVERSPEED
  // -------------------------------------------------------------------------
  describe('4. Route Safety & Geofencing', () => {
    it('creates a new campus geofence zone with speed threshold', async () => {
      jest.spyOn(Geofence.prototype, 'save').mockResolvedValue({
        _id: 'geo1',
        geofenceId: 'GEO-01',
        name: 'Apex Main Gate Hub',
        radiusMeters: 250,
        speedLimitKmh: 30
      });

      const res = await request(app)
        .post('/api/v1/transport/safety/geofences')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Apex Main Gate Hub',
          geofenceType: 'Campus',
          center: { latitude: 12.9716, longitude: 77.5946 },
          radiusMeters: 250,
          speedLimitKmh: 30
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Apex Main Gate Hub');
    });

    it('records an overspeed event when vehicle exceeds speed limit', async () => {
      jest.spyOn(Bus, 'findById').mockResolvedValue({
        _id: 'bus1',
        registrationNumber: 'KA-01-E-1001'
      });
      jest.spyOn(OverspeedEvent.prototype, 'save').mockResolvedValue({
        _id: 'spd1',
        speed: 68,
        speedLimit: 40,
        status: 'New'
      });

      const res = await request(app)
        .post('/api/v1/transport/safety/overspeed-events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bus: 'bus1',
          speed: 68,
          speedLimit: 40,
          notes: 'Breached speed limit near Outer Ring Road stop'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.speed).toBe(68);
    });
  });

  // -------------------------------------------------------------------------
  // 5. PARENT TRANSPORT PORTAL
  // -------------------------------------------------------------------------
  describe('5. Parent Transport Portal', () => {
    it('returns linked child transit data with GPS telemetry and fee status', async () => {
      jest.spyOn(StudentTransportAllocation, 'find').mockReturnValue({
        populate: () => ({
          populate: () =>
            Promise.resolve([
              {
                allocationId: 'ALLOC-01',
                studentName: 'Aarav Sharma',
                rollNumber: '21CS101',
                department: 'Computer Science',
                pickupStop: 'Sector 14',
                dropStop: 'Sector 14',
                allocationStatus: 'active',
                bus: { _id: '507f1f77bcf86cd799439099', busName: 'Bus 01', registrationNumber: 'KA-01-E-1001' },
                route: { routeName: 'Route 1', routeCode: 'R-01' }
              }
            ])
        })
      });

      jest.spyOn(GpsLocation, 'findOne').mockReturnValue({
        sort: () => Promise.resolve({
          latitude: 12.9716,
          longitude: 77.5946,
          speed: 38,
          timestamp: new Date()
        })
      });

      jest.spyOn(Trip, 'findOne').mockReturnValue({
        sort: () => Promise.resolve(null)
      });

      jest.spyOn(StudentTransportFee, 'findOne').mockResolvedValue({
        paymentStatus: 'paid',
        totalFee: 24000,
        totalPaid: 24000,
        pendingBalance: 0
      });

      jest.spyOn(EmergencyAlert, 'findOne').mockReturnValue({
        sort: () => Promise.resolve(null)
      });

      jest.spyOn(TransportAnnouncement, 'find').mockReturnValue({
        sort: () => ({ limit: () => Promise.resolve([]) })
      });

      const res = await request(app)
        .get('/api/v1/transport/parent/portal')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.totalLinkedChildren).toBe(1);
      expect(res.body.children[0]).toHaveProperty('studentName', 'Aarav Sharma');
      expect(res.body.children[0]).toHaveProperty('bus');
      expect(res.body.children[0].liveGps).toHaveProperty('speed', 38);
      expect(res.body.children[0].feeStatus).toHaveProperty('paymentStatus', 'paid');
    });
  });

  // -------------------------------------------------------------------------
  // 6. COMPLAINT MANAGEMENT
  // -------------------------------------------------------------------------
  describe('6. Transport Grievances & Complaints', () => {
    it('allows a parent to submit a transport complaint ticket', async () => {
      jest.spyOn(TransportComplaint.prototype, 'save').mockResolvedValue({
        _id: 'cmp1',
        complaintId: 'CMP-2026-001',
        category: 'Bus Delay',
        subject: 'Morning delay of 30 minutes',
        status: 'Submitted'
      });

      const res = await request(app)
        .post('/api/v1/transport/complaints')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          category: 'Bus Delay',
          subject: 'Morning delay of 30 minutes',
          description: 'Bus 01 arrived at Sector 14 pickup 30 minutes late today.'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.complaintId).toBe('CMP-2026-001');
    });

    it('records administrator response to a complaint', async () => {
      const mockCmp = {
        _id: 'cmp1',
        complaintId: 'CMP-2026-001',
        status: 'Submitted',
        auditHistory: [],
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(TransportComplaint, 'findById').mockResolvedValue(mockCmp);
      jest.spyOn(TransportNotification, 'create').mockResolvedValue(true);

      const res = await request(app)
        .patch('/api/v1/transport/complaints/cmp1/respond')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          response: 'Delay was due to unforeseen traffic detour. Driver briefed on alternative routes.',
          status: 'Resolved'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockCmp.status).toBe('Resolved');
      expect(mockCmp.adminResponse).toContain('unforeseen traffic detour');
    });
  });

  // -------------------------------------------------------------------------
  // 7. NOTIFICATIONS & ANNOUNCEMENTS
  // -------------------------------------------------------------------------
  describe('7. Notifications & Announcements', () => {
    it('fetches authenticated user transport notifications with unread count', async () => {
      jest.spyOn(TransportNotification, 'find').mockReturnValue({
        sort: () => ({ limit: () => Promise.resolve([
          { _id: 'n1', title: 'Schedule Update', read: false }
        ]) })
      });
      jest.spyOn(TransportNotification, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/transport/notifications')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.unreadCount).toBe(1);
    });

    it('marks all unread notifications as read', async () => {
      jest.spyOn(TransportNotification, 'updateMany').mockResolvedValue({ modifiedCount: 3 });

      const res = await request(app)
        .post('/api/v1/transport/notifications/read-all')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 8. RBAC PROTECTION ON PHASE 4 APIS
  // -------------------------------------------------------------------------
  describe('8. Role-Based Access Control on Safety APIs', () => {
    it('forbids Student role from creating geofences with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/transport/safety/geofences')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: 'Hacked Geofence' });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('forbids Student role from acknowledging emergency SOS alerts with 403 Forbidden', async () => {
      const res = await request(app)
        .patch('/api/v1/transport/safety/sos/sos1/acknowledge')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ notes: 'Student cannot acknowledge' });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
