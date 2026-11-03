const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const { ROLES } = require('@college-erp/shared');

const User = require('../src/modules/auth/auth.model');
const Notification = require('../src/modules/notifications/notification.model');
const InstitutionalEvent = require('../src/modules/events/institutionalEvent.model');
const Bus = require('../src/modules/transport/models/bus.model');
const Route = require('../src/modules/transport/models/route.model');
const Driver = require('../src/modules/transport/models/driver.model');
const StudentTransportAllocation = require('../src/modules/transport/models/studentTransportAllocation.model');

describe('Notifications, Calendar & Transport Admin Authorization Test Suite', () => {
  // Test users
  const transportAdminUser = {
    _id: '507f1f77bcf86cd799439010',
    name: 'Chief Fleet Manager',
    email: 'transport@college.edu',
    role: ROLES.TRANSPORT_ADMIN,
    status: 'active'
  };

  const studentUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Alice Cooper',
    email: 'alice@student.college.edu',
    role: ROLES.STUDENT,
    status: 'active'
  };

  const driverUser = {
    _id: '507f1f77bcf86cd799439012',
    name: 'Rajesh Sharma',
    email: 'rajesh.driver@college.edu',
    role: ROLES.BUS_DRIVER,
    status: 'active'
  };

  const parentUser = {
    _id: '507f1f77bcf86cd799439013',
    name: 'Robert Cooper',
    email: 'robert.parent@gmail.com',
    role: ROLES.PARENT,
    status: 'active'
  };

  const superAdminUser = {
    _id: '507f1f77bcf86cd799439014',
    name: 'System Super Admin',
    email: 'admin@college.edu',
    role: ROLES.SUPER_ADMIN,
    status: 'active'
  };

  const transportAdminToken = jwt.sign(
    { id: transportAdminUser._id, role: transportAdminUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const studentToken = jwt.sign(
    { id: studentUser._id, role: studentUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const driverToken = jwt.sign(
    { id: driverUser._id, role: driverUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const parentToken = jwt.sign(
    { id: parentUser._id, role: parentUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const superAdminToken = jwt.sign(
    { id: superAdminUser._id, role: superAdminUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  beforeEach(() => {
    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const idStr = id ? id.toString() : '';
      if (idStr === transportAdminUser._id) return { select: jest.fn().mockResolvedValue(transportAdminUser) };
      if (idStr === studentUser._id) return { select: jest.fn().mockResolvedValue(studentUser) };
      if (idStr === driverUser._id) return { select: jest.fn().mockResolvedValue(driverUser) };
      if (idStr === parentUser._id) return { select: jest.fn().mockResolvedValue(parentUser) };
      if (idStr === superAdminUser._id) return { select: jest.fn().mockResolvedValue(superAdminUser) };
      return { select: jest.fn().mockResolvedValue(null) };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ------------------------------------------
  // SECTION 1: Transport Admin Authorization
  // ------------------------------------------
  describe('1. Transport Admin RBAC & Scope Enforcement', () => {
    it('allows Transport Admin to access transport summary dashboard', async () => {
      jest.spyOn(Bus, 'countDocuments').mockResolvedValue(2);
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
      jest.spyOn(StudentTransportAllocation, 'aggregate').mockResolvedValue([{ _id: 'r1', count: 10 }]);
      jest.spyOn(Driver, 'aggregate').mockResolvedValue([{ _id: 'available', count: 3 }]);
      jest.spyOn(Bus, 'aggregate').mockResolvedValue([{ _id: 'active', count: 2 }]);

      const res = await request(app)
        .get('/api/v1/transport/summary')
        .set('Authorization', `Bearer ${transportAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('summary');
    });

    it('denies Transport Admin access to Super Admin user management with 403', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${transportAdminToken}`)
        .send({
          name: 'Unauthorized User Add',
          email: 'unauthorized@college.edu',
          role: 'super_admin'
        });

      // Must be 403 Forbidden - Transport Admin does not have Super Admin permissions
      expect(res.status).toBe(403);
    });
  });

  // ------------------------------------------
  // SECTION 2: Universal Notifications
  // ------------------------------------------
  describe('2. Universal Notifications Module', () => {
    const createQueryChain = (result) => {
      return {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(result)
      };
    };

    it('returns notifications for Transport Admin and unread counts', async () => {
      const mockNotifications = [
        {
          _id: '507f1f77bcf86cd799439091',
          title: 'Preventive Maintenance Due - Bus #04',
          message: 'Bus #04 scheduled for engine inspection.',
          category: 'Transport',
          priority: 'urgent',
          read: false,
          createdAt: new Date()
        }
      ];

      jest.spyOn(Notification, 'find').mockImplementation(() => createQueryChain(mockNotifications));
      jest.spyOn(Notification, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${transportAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.unreadCount).toBe(1);
    });

    it('returns notifications for Student', async () => {
      const mockNotifications = [
        {
          _id: '507f1f77bcf86cd799439092',
          title: 'Bus Approaching Stop: North Campus Gate',
          message: 'Your morning transit bus is 5 minutes away.',
          category: 'Transport',
          priority: 'medium',
          read: false,
          createdAt: new Date()
        }
      ];

      jest.spyOn(Notification, 'find').mockImplementation(() => createQueryChain(mockNotifications));
      jest.spyOn(Notification, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].title).toContain('Bus Approaching');
    });

    it('marks a single notification as read', async () => {
      const mockNotif = {
        _id: '507f1f77bcf86cd799439091',
        title: 'Preventive Maintenance Due',
        read: true,
        readAt: new Date()
      };
      jest.spyOn(Notification, 'findOneAndUpdate').mockResolvedValue(mockNotif);
      jest.spyOn(Notification, 'countDocuments').mockResolvedValue(0);

      const res = await request(app)
        .patch(`/api/v1/notifications/${mockNotif._id}/read`)
        .set('Authorization', `Bearer ${transportAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.read).toBe(true);
      expect(res.body.unreadCount).toBe(0);
    });

    it('marks all notifications as read for current user and role', async () => {
      jest.spyOn(Notification, 'updateMany').mockResolvedValue({ modifiedCount: 4 });

      const res = await request(app)
        .post('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${transportAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.unreadCount).toBe(0);
    });
  });

  // ------------------------------------------
  // SECTION 3: Universal Calendar & Events
  // ------------------------------------------
  describe('3. Universal Calendar Module', () => {
    const mockCalendarEvent = {
      _id: '507f1f77bcf86cd799439095',
      title: 'Annual Campus Sports Meet 2026',
      description: 'Inter-department athletic competitions and opening ceremony',
      eventCategory: 'Academic Event',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      priority: 'medium',
      status: 'scheduled',
      venue: 'Main Sports Complex'
    };

    it('allows Student to read calendar events via /api/v1/calendar', async () => {
      jest.spyOn(InstitutionalEvent, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockCalendarEvent])
      });
      jest.spyOn(InstitutionalEvent, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/calendar')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.events.length).toBe(1);
      expect(res.body.data.events[0].title).toBe('Annual Campus Sports Meet 2026');
    });

    it('allows Transport Admin to read calendar events via /api/v1/calendar', async () => {
      jest.spyOn(InstitutionalEvent, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockCalendarEvent])
      });
      jest.spyOn(InstitutionalEvent, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/calendar')
        .set('Authorization', `Bearer ${transportAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.events.length).toBe(1);
    });

    it('allows Parent to read calendar events via /api/v1/calendar', async () => {
      jest.spyOn(InstitutionalEvent, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockCalendarEvent])
      });
      jest.spyOn(InstitutionalEvent, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/calendar')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('allows Transport Admin to schedule calendar events via /api/v1/calendar', async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const nextDay = new Date(Date.now() + 172800000).toISOString();
      jest.spyOn(InstitutionalEvent, 'create').mockResolvedValue({
        ...mockCalendarEvent,
        title: 'Fleet Annual Safety Inspection Day'
      });

      const res = await request(app)
        .post('/api/v1/calendar')
        .set('Authorization', `Bearer ${transportAdminToken}`)
        .send({
          title: 'Fleet Annual Safety Inspection Day',
          description: 'Mandatory vehicle and driver safety check',
          eventCategory: 'Administrative Deadline',
          startDate: tomorrow,
          endDate: nextDay,
          priority: 'high',
          venue: 'Transport Yard',
          assignedOwner: transportAdminUser._id
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('rejects Student from creating calendar events with 403', async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const nextDay = new Date(Date.now() + 172800000).toISOString();

      const res = await request(app)
        .post('/api/v1/calendar')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Unauthorized Event Attempt',
          description: 'Should fail',
          eventCategory: 'Academic Event',
          startDate: tomorrow,
          endDate: nextDay,
          priority: 'low'
        });

      expect(res.status).toBe(403);
    });
  });
});
