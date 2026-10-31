const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const { ROLES } = require('@college-erp/shared');

const User = require('../src/modules/auth/auth.model');
const InstitutionalEvent = require('../src/modules/events/institutionalEvent.model');

describe('Institutional Deadline & Event Tracker Test Suite', () => {
  const principalUser = {
    _id: '507f1f77bcf86cd799439001',
    name: 'Dr. Eleanor Vance',
    email: 'principal@college.edu',
    role: ROLES.PRINCIPAL,
    status: 'active'
  };

  const studentUser = {
    _id: '507f1f77bcf86cd799439003',
    name: 'Alice Cooper',
    email: 'alice@student.college.edu',
    role: ROLES.STUDENT,
    status: 'active'
  };

  const principalToken = jwt.sign(
    { id: principalUser._id, role: principalUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const studentToken = jwt.sign(
    { id: studentUser._id, role: studentUser.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const now = new Date();
  const mockEvent = {
    _id: '507f1f77bcf86cd799439080',
    title: 'NAAC Peer Team Annual Review Visit',
    description: 'On-site verification of academic and infrastructural criteria',
    eventCategory: 'Institutional Review',
    startDate: new Date(now.getTime() + 2 * 24 * 3600 * 1000),
    endDate: new Date(now.getTime() + 4 * 24 * 3600 * 1000),
    priority: 'urgent',
    department: null,
    venue: 'Executive Boardroom & Campus Facilities',
    assignedOwner: {
      _id: principalUser._id,
      name: principalUser.name,
      email: principalUser.email
    },
    status: 'scheduled',
    isAllDay: true,
    reminderDaysBefore: 3,
    save: jest.fn().mockResolvedValue(true)
  };

  const createQueryMock = (result) => {
    const p = Promise.resolve(result);
    p.populate = jest.fn().mockImplementation(() => p);
    p.sort = jest.fn().mockImplementation(() => p);
    p.lean = jest.fn().mockResolvedValue(result);
    return p;
  };

  beforeEach(() => {
    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const idStr = id ? id.toString() : '';
      if (idStr === principalUser._id) return { select: jest.fn().mockResolvedValue(principalUser) };
      if (idStr === studentUser._id) return { select: jest.fn().mockResolvedValue(studentUser) };
      return { select: jest.fn().mockResolvedValue(null) };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/v1/institutional-events/summary', () => {
    it('should calculate upcoming, overdue, today, and completed metrics', async () => {
      const today = new Date();
      jest.spyOn(InstitutionalEvent, 'find').mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: mockEvent._id,
            title: mockEvent.title,
            startDate: new Date(today.getTime() + 2 * 24 * 3600 * 1000),
            endDate: new Date(today.getTime() + 4 * 24 * 3600 * 1000),
            status: 'scheduled',
            eventCategory: 'Institutional Review'
          },
          {
            _id: '507f1f77bcf86cd799439081',
            title: 'Past Submission',
            startDate: new Date(today.getTime() - 10 * 24 * 3600 * 1000),
            endDate: new Date(today.getTime() - 5 * 24 * 3600 * 1000),
            status: 'scheduled', // overdue dynamically
            eventCategory: 'Examination Deadline'
          }
        ])
      });

      const res = await request(app)
        .get('/api/v1/institutional-events/summary')
        .set('Authorization', `Bearer ${principalToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.upcomingDeadlines).toBe(1);
      expect(res.body.data.overdueTasks).toBe(1);
    });
  });

  describe('GET /api/v1/institutional-events', () => {
    it('should list events with filters and pagination', async () => {
      jest.spyOn(InstitutionalEvent, 'find').mockImplementation(() => {
        return {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([mockEvent])
        };
      });

      const res = await request(app)
        .get('/api/v1/institutional-events?eventCategory=Institutional+Review')
        .set('Authorization', `Bearer ${principalToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.events.length).toBe(1);
      expect(res.body.data.events[0].title).toBe('NAAC Peer Team Annual Review Visit');
    });

    it('should restrict student access', async () => {
      const res = await request(app)
        .get('/api/v1/institutional-events')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/institutional-events', () => {
    it('should reject if startDate is after endDate', async () => {
      const res = await request(app)
        .post('/api/v1/institutional-events')
        .set('Authorization', `Bearer ${principalToken}`)
        .send({
          title: 'Invalid Date Range Event',
          description: 'Testing date sequence validation',
          eventCategory: 'Academic Event',
          startDate: '2026-11-10T10:00:00',
          endDate: '2026-11-05T10:00:00',
          priority: 'medium',
          assignedOwner: principalUser._id
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toContain('Start date cannot be after end date');
    });

    it('should create event successfully with valid inputs', async () => {
      jest.spyOn(InstitutionalEvent, 'create').mockResolvedValue(mockEvent);

      const res = await request(app)
        .post('/api/v1/institutional-events')
        .set('Authorization', `Bearer ${principalToken}`)
        .send({
          title: 'NAAC Peer Team Annual Review Visit',
          description: 'On-site verification of academic and infrastructural criteria',
          eventCategory: 'Institutional Review',
          startDate: new Date(now.getTime() + 2 * 24 * 3600 * 1000).toISOString(),
          endDate: new Date(now.getTime() + 4 * 24 * 3600 * 1000).toISOString(),
          priority: 'urgent',
          assignedOwner: principalUser._id,
          venue: 'Executive Boardroom & Campus Facilities'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(mockEvent.title);
    });
  });

  describe('PATCH /api/v1/institutional-events/:id/complete', () => {
    it('should mark an event as completed with completion notes', async () => {
      const eventInstance = {
        ...mockEvent,
        status: 'scheduled',
        save: jest.fn().mockImplementation(function() {
          return Promise.resolve(this);
        })
      };

      jest.spyOn(InstitutionalEvent, 'findById').mockImplementation(() => createQueryMock(eventInstance));

      const res = await request(app)
        .patch(`/api/v1/institutional-events/${mockEvent._id}/complete`)
        .set('Authorization', `Bearer ${principalToken}`)
        .send({
          completionNotes: 'Review successfully completed with grade recommendation.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(eventInstance.status).toBe('completed');
      expect(eventInstance.completionNotes).toContain('Review successfully completed');
      expect(eventInstance.save).toHaveBeenCalled();
    });
  });
});

