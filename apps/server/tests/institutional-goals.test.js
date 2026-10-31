const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const { ROLES } = require('@college-erp/shared');

const User = require('../src/modules/auth/auth.model');
const Goal = require('../src/modules/goals/goal.model');

describe('Institutional Goals & KPI Tracker Test Suite', () => {
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

  const mockGoal = {
    _id: '507f1f77bcf86cd799439070',
    title: 'Increase Peer-Reviewed Scopus Publications',
    description: 'Target 50 high-impact papers across departments',
    targetValue: 50,
    currentValue: 35,
    unit: 'papers',
    priority: 'high',
    owner: {
      _id: principalUser._id,
      name: principalUser.name,
      email: principalUser.email
    },
    department: null,
    academicYear: '2025-26',
    deadline: new Date(Date.now() + 60 * 24 * 3600 * 1000),
    status: 'in_progress',
    achievementPercentage: 70,
    progressHistory: [
      {
        _id: '507f1f77bcf86cd799439071',
        value: 35,
        note: 'Mid-term publication compilation',
        updatedBy: principalUser._id,
        createdAt: new Date()
      }
    ],
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

  describe('GET /api/v1/institutional-goals/summary', () => {
    it('should compute institutional goal achievement and status metrics', async () => {
      jest.spyOn(Goal, 'find').mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: mockGoal._id,
            targetValue: 50,
            currentValue: 35,
            achievementPercentage: 70,
            status: 'in_progress',
            deadline: new Date(Date.now() + 30 * 24 * 3600 * 1000)
          },
          {
            _id: '507f1f77bcf86cd799439072',
            targetValue: 100,
            currentValue: 100,
            achievementPercentage: 100,
            status: 'completed',
            deadline: new Date(Date.now() + 10 * 24 * 3600 * 1000)
          }
        ])
      });

      const res = await request(app)
        .get('/api/v1/institutional-goals/summary')
        .set('Authorization', `Bearer ${principalToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalGoals).toBe(2);
      expect(res.body.data.completedGoals).toBe(1);
      expect(res.body.data.overallTargetAchievement).toBe(85);
    });
  });

  describe('GET /api/v1/institutional-goals', () => {
    it('should list goals with pagination and filters', async () => {
      jest.spyOn(Goal, 'find').mockImplementation(() => {
        return {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([mockGoal])
        };
      });

      const res = await request(app)
        .get('/api/v1/institutional-goals?priority=high')
        .set('Authorization', `Bearer ${principalToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.goals.length).toBe(1);
      expect(res.body.data.goals[0].title).toBe('Increase Peer-Reviewed Scopus Publications');
    });

    it('should restrict student access', async () => {
      const res = await request(app)
        .get('/api/v1/institutional-goals')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/institutional-goals', () => {
    it('should validate targetValue is positive number', async () => {
      const res = await request(app)
        .post('/api/v1/institutional-goals')
        .set('Authorization', `Bearer ${principalToken}`)
        .send({
          title: 'Invalid Target Goal',
          targetValue: -5,
          deadline: '2026-12-31'
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should create goal when input is valid', async () => {
      jest.spyOn(Goal, 'create').mockResolvedValue(mockGoal);

      const res = await request(app)
        .post('/api/v1/institutional-goals')
        .set('Authorization', `Bearer ${principalToken}`)
        .send({
          title: 'Increase Peer-Reviewed Scopus Publications',
          description: 'Target 50 high-impact papers across departments',
          targetValue: 50,
          currentValue: 0,
          unit: 'papers',
          priority: 'high',
          owner: principalUser._id,
          deadline: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
          academicYear: '2025-26'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(mockGoal.title);
    });
  });

  describe('POST /api/v1/institutional-goals/:id/progress', () => {
    it('should record progress history and auto-update achievement percentage', async () => {
      const goalInstance = {
        ...mockGoal,
        currentValue: 35,
        targetValue: 50,
        achievementPercentage: 70,
        progressHistory: [],
        save: jest.fn().mockImplementation(function() {
          return Promise.resolve(this);
        })
      };

      jest.spyOn(Goal, 'findById').mockImplementation(() => createQueryMock(goalInstance));

      const res = await request(app)
        .post(`/api/v1/institutional-goals/${mockGoal._id}/progress`)
        .set('Authorization', `Bearer ${principalToken}`)
        .send({
          value: 45,
          note: 'Q3 update from research committee'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(goalInstance.currentValue).toBe(45);
      expect(goalInstance.achievementPercentage).toBe(90);
      expect(goalInstance.save).toHaveBeenCalled();
    });
  });
});

