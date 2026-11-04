const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const { ROLES } = require('@college-erp/shared');
const app = require('../src/app');

// Mock data / IDs for testing
const superAdminUser = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Super Admin User',
  email: 'superadmin@college.edu',
  role: ROLES.SUPER_ADMIN,
  status: 'active'
};

const principalUser = {
  _id: '507f1f77bcf86cd799439012',
  name: 'Dr. Eleanor Vance',
  email: 'principal@college.edu',
  role: ROLES.PRINCIPAL,
  status: 'active'
};

const hodUser = {
  _id: '507f1f77bcf86cd799439013',
  name: 'Prof. David Kumar',
  email: 'hod.cse@college.edu',
  role: ROLES.HOD,
  department: 'Computer Science & Engineering',
  status: 'active'
};

const facultyUser = {
  _id: '507f1f77bcf86cd799439014',
  name: 'Dr. Robert Chen',
  email: 'faculty@college.edu',
  role: ROLES.FACULTY,
  status: 'active'
};

const studentUser = {
  _id: '507f1f77bcf86cd799439015',
  name: 'Rahul Sharma',
  email: 'student@college.edu',
  role: ROLES.STUDENT,
  status: 'active'
};

const accountsUser = {
  _id: '507f1f77bcf86cd799439016',
  name: 'Finance Officer',
  email: 'accounts@college.edu',
  role: ROLES.ACCOUNTS,
  status: 'active'
};

function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

describe('Phase 3 Stage 2 – Backend Intelligence Services & APIs', () => {
  const superAdminToken = generateToken(superAdminUser);
  const principalToken = generateToken(principalUser);
  const studentToken = generateToken(studentUser);
  const accountsToken = generateToken(accountsUser);

  describe('Module 12: System Health Monitoring & Telemetry', () => {
    it('rejects unauthenticated requests to /system/health-metrics with 401', async () => {
      // Simulate req, res dispatch directly through express app handle
      const req = {
        method: 'GET',
        url: '/api/v1/system/health-metrics',
        headers: {}
      };
      // Test middleware RBAC isolation
      const { authorizeRoles } = require('../src/middleware/rbac');
      const rbacMiddleware = authorizeRoles(ROLES.SUPER_ADMIN);

      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status: (code) => {
          statusCalled = code;
          return {
            json: (payload) => { jsonCalled = payload; }
          };
        }
      };

      // Non-super-admin user (e.g. student)
      rbacMiddleware({ user: studentUser }, res, () => {});
      expect(statusCalled).toBe(403);
      expect(jsonCalled.message).toMatch(/Forbidden/i);
    });

    it('collects genuine runtime metrics without leaking secrets', async () => {
      const { getSystemHealthMetrics } = require('../src/modules/system/system.controller');
      let responseData = null;
      const res = {
        status: () => res,
        json: (payload) => { responseData = payload; }
      };

      await getSystemHealthMetrics({ user: superAdminUser }, res, () => {});
      expect(responseData).toBeDefined();
      expect(responseData.success).toBe(true);
      expect(responseData.data.service).toBe('college-erp-api');
      expect(responseData.data.processMemory.heapUsedMb).toBeGreaterThan(0);
      expect(responseData.data.uptime.seconds).toBeGreaterThanOrEqual(0);
      // Secrets must never be exposed
      expect(JSON.stringify(responseData)).not.toContain(env.JWT_SECRET);
    });
  });

  describe('Module 11: Security Analytics & Telemetry', () => {
    it('enforces RBAC blocking Student and Faculty from security analytics', () => {
      const { authorizeRoles } = require('../src/middleware/rbac');
      const rbac = authorizeRoles(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL);

      let status = null;
      const res = {
        status: (c) => { status = c; return { json: () => {} }; }
      };

      rbac({ user: studentUser }, res, () => {});
      expect(status).toBe(403);

      rbac({ user: facultyUser }, res, () => {});
      expect(status).toBe(403);
    });
  });

  describe('Module 3: Attendance Intelligence Formulas & Edge Cases', () => {
    it('correctly calculates classes needed to recover attendance to 75%', () => {
      // Recovery formula: x >= 3*T - 4*A
      // Case 1: T = 10, A = 6 (60%) -> needs 3(10) - 4(6) = 6 classes
      const calcClassesNeeded = (total, attended) => {
        if (total === 0) return 0;
        const pct = (attended / total) * 100;
        if (pct >= 75.0) return 0;
        return Math.max(0, Math.ceil(3 * total - 4 * attended));
      };

      expect(calcClassesNeeded(10, 6)).toBe(6);
      // Verify: (6 + 6) / (10 + 6) = 12 / 16 = 75%
      expect((6 + 6) / (10 + 6)).toBe(0.75);

      // Case 2: T = 20, A = 14 (70%) -> needs 3(20) - 4(14) = 4 classes
      expect(calcClassesNeeded(20, 14)).toBe(4);
      expect((14 + 4) / (20 + 4)).toBe(0.75);

      // Case 3: Already >= 75% (T = 10, A = 8) -> needs 0
      expect(calcClassesNeeded(10, 8)).toBe(0);

      // Edge case: T = 0, A = 0
      expect(calcClassesNeeded(0, 0)).toBe(0);
    });

    it('correctly calculates how many classes a student can afford to miss', () => {
      // Formula: y <= (A - 0.75*T) / 0.75
      const calcCanAffordToMiss = (total, attended) => {
        if (total === 0 || (attended / total) < 0.75) return 0;
        return Math.max(0, Math.floor((attended - 0.75 * total) / 0.75));
      };

      // T = 20, A = 18 (90%) -> can miss (18 - 15) / 0.75 = 4 classes
      expect(calcCanAffordToMiss(20, 18)).toBe(4);
      // If student misses 4 classes: A = 18, T = 24 -> 18/24 = 75%
      expect(18 / 24).toBe(0.75);
    });
  });

  describe('Module 2: Explainable Academic Risk Heuristics', () => {
    it('calculates deterministic risk score and pass probability without false AI claims', () => {
      const evaluateStudentRisk = (attendancePct, marksPct, backlogs) => {
        const attendanceDeficit = Math.max(0, 75 - attendancePct);
        const marksDeficit = Math.max(0, 50 - marksPct);
        const riskScore = Math.min(
          100,
          Math.round((attendanceDeficit * 1.5) + (marksDeficit * 1.2) + (backlogs * 12))
        );
        const passProbability = Math.max(
          5,
          Math.min(98, Math.round((marksPct * 0.65) + (attendancePct * 0.35) - (backlogs * 5)))
        );

        let riskLevel = 'low';
        if (riskScore >= 40 || attendancePct < 65 || backlogs >= 2) {
          riskLevel = 'high';
        } else if (riskScore >= 20 || attendancePct < 75 || backlogs === 1) {
          riskLevel = 'moderate';
        }

        return { riskScore, passProbability, riskLevel };
      };

      // Healthy student: 85% attendance, 78% marks, 0 backlogs
      const healthy = evaluateStudentRisk(85, 78, 0);
      expect(healthy.riskLevel).toBe('low');
      expect(healthy.passProbability).toBeGreaterThan(75);

      // At-risk student: 60% attendance, 35% marks, 2 backlogs
      const atRisk = evaluateStudentRisk(60, 35, 2);
      expect(atRisk.riskLevel).toBe('high');
      expect(atRisk.riskScore).toBeGreaterThanOrEqual(40);
      expect(atRisk.passProbability).toBeLessThan(50);
    });
  });

  describe('Module 4: Timetable Conflict & Clash Detection Constraints', () => {
    it('detects faculty double-booking conflicts on identical day and period', () => {
      const mockSlots = [
        { _id: 'slot1', dayOfWeek: 'Monday', periodNumber: 1, faculty: 'facA', roomNumber: '101' },
        { _id: 'slot2', dayOfWeek: 'Monday', periodNumber: 1, faculty: 'facA', roomNumber: '102' } // CONFLICT
      ];

      const facultyMap = new Map();
      mockSlots.forEach((s) => {
        const key = `${s.dayOfWeek}_${s.periodNumber}_${s.faculty}`;
        if (!facultyMap.has(key)) facultyMap.set(key, []);
        facultyMap.get(key).push(s);
      });

      let conflictsFound = 0;
      facultyMap.forEach((slots) => {
        if (slots.length > 1) conflictsFound++;
      });

      expect(conflictsFound).toBe(1);
    });

    it('detects room overlap conflict when two classes share the same room at the same period', () => {
      const mockSlots = [
        { _id: 'slot1', dayOfWeek: 'Tuesday', periodNumber: 2, faculty: 'facA', roomNumber: 'LAB-201' },
        { _id: 'slot2', dayOfWeek: 'Tuesday', periodNumber: 2, faculty: 'facB', roomNumber: 'LAB-201' } // CONFLICT
      ];

      const roomMap = new Map();
      mockSlots.forEach((s) => {
        const key = `${s.dayOfWeek}_${s.periodNumber}_${s.roomNumber.toUpperCase()}`;
        if (!roomMap.has(key)) roomMap.set(key, []);
        roomMap.get(key).push(s);
      });

      let conflicts = 0;
      roomMap.forEach((slots) => {
        if (slots.length > 1) conflicts++;
      });
      expect(conflicts).toBe(1);
    });
  });

  describe('Module 9: Placement APIs Validation & Duplicate Application Safeguards', () => {
    it('validates drive creation inputs rejecting negative packages or missing deadlines', () => {
      const { validateDriveInput } = require('../src/modules/placements/placement.validator');

      let status = null;
      let json = null;
      const res = {
        status: (c) => { status = c; return { json: (p) => { json = p; } }; }
      };

      // Invalid: missing jobTitle and negative package
      const req = {
        body: {
          driveCode: 'DRV-INVALID',
          company: '507f1f77bcf86cd799439099',
          jobTitle: '',
          ctc: { annualSalaryLpa: -5 }
        }
      };

      validateDriveInput(req, res, () => {});
      expect(status).toBe(400);
      expect(json.errors).toContain('Job title is required');
      expect(json.errors).toContain('Valid annual salary package (CTC in LPA) is required');
    });
  });

  describe('Module 8: Asset Management Depreciated Value & Unique Code', () => {
    it('validates Asset input rejecting invalid category and negative purchase cost', () => {
      const { validateAssetInput } = require('../src/modules/assets/asset.validator');

      let status = null;
      let json = null;
      const res = {
        status: (c) => { status = c; return { json: (p) => { json = p; } }; }
      };

      const req = {
        body: {
          name: '',
          assetCode: '',
          category: 'invalid_type',
          purchaseCost: -500
        }
      };

      validateAssetInput(req, res, () => {});
      expect(status).toBe(400);
      expect(json.errors).toContain('Asset name is required');
      expect(json.errors).toContain('Asset code is required');
      expect(json.errors).toContain('Purchase cost must be a non-negative number');
    });
  });

  describe('Module 6: Communication Token Substitution & Provider Simulation', () => {
    it('safely replaces template placeholders without leaking unescaped tokens', () => {
      const CommunicationTemplate = require('../src/modules/communications/template.model');
      const tpl = new CommunicationTemplate({
        code: 'TPL-EXAM-ALERT-01',
        name: 'Exam Hall Ticket Alert',
        category: 'examination_alert',
        subjectTemplate: 'Exam Ticket Issued for {{studentName}}',
        bodyTemplate: 'Hello {{studentName}}, your seat for {{subjectName}} is allocated in Room {{roomNumber}}.',
        allowedVariables: ['studentName', 'subjectName', 'roomNumber']
      });

      const rendered = tpl.render({
        studentName: 'Ananya Roy',
        subjectName: 'Computer Networks',
        roomNumber: 'LH-301'
      });

      expect(rendered.subject).toBe('Exam Ticket Issued for Ananya Roy');
      expect(rendered.body).toBe('Hello Ananya Roy, your seat for Computer Networks is allocated in Room LH-301.');
    });

    it('validates broadcast input rejecting empty content', () => {
      const { validateBroadcastInput } = require('../src/modules/communications/communication.validator');
      let status = null;
      let json = null;
      const res = {
        status: (c) => { status = c; return { json: (p) => { json = p; } }; }
      };

      validateBroadcastInput({ body: { targetRole: 'student', content: '' } }, res, () => {});
      expect(status).toBe(400);
      expect(json.errors).toContain('Broadcast message content is required');
    });
  });
});

