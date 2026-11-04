const mongoose = require('mongoose');
const Asset = require('../src/modules/assets/asset.model');
const {
  Company,
  PlacementDrive,
  PlacementApplication
} = require('../src/modules/placements');
const {
  CommunicationTemplate,
  CommunicationLog
} = require('../src/modules/communications');

describe('Phase 3 Stage 1 – Core Foundation & Data Persistence Models', () => {
  describe('Asset Model Schema Validation & Methods', () => {
    it('validates a valid Asset document', async () => {
      const asset = new Asset({
        name: 'HP ProDesk 400 G7 Microtower',
        assetCode: 'AST-LAB-001',
        category: 'it_equipment',
        subCategory: 'Desktop PC',
        location: {
          building: 'Engineering Block A',
          floor: '2nd Floor',
          roomNumber: 'LAB-204'
        },
        purchaseDate: new Date('2024-01-15'),
        purchaseCost: 55000,
        depreciationRate: 15,
        status: 'in_service'
      });

      const err = asset.validateSync();
      expect(err).toBeUndefined();
      expect(asset.assetCode).toBe('AST-LAB-001');
      expect(asset.category).toBe('it_equipment');
    });

    it('rejects an Asset missing required fields', () => {
      const asset = new Asset({});
      const err = asset.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.name).toBeDefined();
      expect(err.errors.assetCode).toBeDefined();
      expect(err.errors.purchaseCost).toBeDefined();
    });

    it('rejects invalid asset category enum', () => {
      const asset = new Asset({
        name: 'Test Asset',
        assetCode: 'AST-ERR-001',
        category: 'invalid_category',
        purchaseCost: 1000
      });
      const err = asset.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.category).toBeDefined();
    });

    it('correctly calculates straight-line depreciation value', () => {
      const purchaseDate = new Date();
      purchaseDate.setFullYear(purchaseDate.getFullYear() - 2); // 2 years ago

      const asset = new Asset({
        name: 'Dell Server PowerEdge',
        assetCode: 'AST-SRV-01',
        category: 'it_equipment',
        purchaseDate,
        purchaseCost: 100000,
        depreciationRate: 10 // 10% per year = 20% in 2 years
      });

      const depreciated = asset.calculateDepreciatedValue();
      // Should be approximately 80,000 (100000 - 20000)
      expect(depreciated).toBeLessThanOrEqual(80500);
      expect(depreciated).toBeGreaterThanOrEqual(79500);
    });
  });

  describe('Placement Models (Company, PlacementDrive, PlacementApplication)', () => {
    const validCompanyId = new mongoose.Types.ObjectId();
    const validDriveId = new mongoose.Types.ObjectId();
    const validStudentId = new mongoose.Types.ObjectId();

    it('validates a Company document with standard tier and status', () => {
      const company = new Company({
        name: 'Infosys Technologies',
        industry: 'Information Technology',
        website: 'https://www.infosys.com',
        tier: 'Tier 1',
        status: 'active',
        rating: 4.5
      });

      const err = company.validateSync();
      expect(err).toBeUndefined();
      expect(company.name).toBe('Infosys Technologies');
    });

    it('validates a PlacementDrive document with CTC, eligibility, and rounds', () => {
      const drive = new PlacementDrive({
        driveCode: 'DRV-2026-INFY-01',
        company: validCompanyId,
        jobTitle: 'Specialist Programmer',
        ctc: {
          annualSalaryLpa: 9.5,
          stipendMonthly: 25000
        },
        eligibility: {
          minCgpa: 7.0,
          maxBacklogs: 0,
          minTenthPercentage: 70,
          minTwelfthPercentage: 70
        },
        driveDate: new Date('2026-12-10'),
        registrationDeadline: new Date('2026-12-01'),
        rounds: [
          { roundNumber: 1, name: 'Online Coding Assessment', mode: 'online' },
          { roundNumber: 2, name: 'Technical Interview', mode: 'in_person' },
          { roundNumber: 3, name: 'HR Discussion', mode: 'in_person' }
        ],
        status: 'registrations_open'
      });

      const err = drive.validateSync();
      expect(err).toBeUndefined();
      expect(drive.driveCode).toBe('DRV-2026-INFY-01');
      expect(drive.rounds.length).toBe(3);
    });

    it('validates a PlacementApplication with unique compound index definition', () => {
      const application = new PlacementApplication({
        applicationId: 'APP-DRV-01-STU-001',
        drive: validDriveId,
        student: validStudentId,
        currentCgpaAtApplication: 8.4,
        activeBacklogsAtApplication: 0,
        status: 'applied'
      });

      const err = application.validateSync();
      expect(err).toBeUndefined();
      expect(application.status).toBe('applied');

      // Verify that compound unique index exists on schema
      const indexes = PlacementApplication.schema.indexes();
      const compoundIndex = indexes.find(
        (idx) => idx[0] && idx[0].drive === 1 && idx[0].student === 1 && idx[1]?.unique === true
      );
      expect(compoundIndex).toBeDefined();
    });
  });

  describe('Communication Models (CommunicationTemplate & CommunicationLog)', () => {
    it('validates CommunicationTemplate and renders template with dynamic tokens', () => {
      const template = new CommunicationTemplate({
        code: 'TPL-FEE-REMINDER-01',
        name: 'Semester Tuition Fee Due Reminder',
        channel: 'email',
        category: 'fee_reminder',
        subjectTemplate: 'Urgent: Pending Fee Due of ₹{{amount}} for {{studentName}}',
        bodyTemplate: 'Dear {{studentName}} (Roll No: {{rollNumber}}), your semester fee of ₹{{amount}} is due on {{dueDate}}.',
        allowedVariables: ['studentName', 'rollNumber', 'amount', 'dueDate'],
        targetRoles: ['student', 'parent']
      });

      const err = template.validateSync();
      expect(err).toBeUndefined();

      // Test dynamic token rendering method
      const rendered = template.render({
        studentName: 'Rahul Sharma',
        rollNumber: 'CSE2026042',
        amount: '65,000',
        dueDate: '15th Nov 2026'
      });

      expect(rendered.subject).toBe('Urgent: Pending Fee Due of ₹65,000 for Rahul Sharma');
      expect(rendered.body).toBe(
        'Dear Rahul Sharma (Roll No: CSE2026042), your semester fee of ₹65,000 is due on 15th Nov 2026.'
      );
    });

    it('validates CommunicationLog distinguishing simulated from real live delivery', () => {
      const senderId = new mongoose.Types.ObjectId();
      const recipientId = new mongoose.Types.ObjectId();

      const log = new CommunicationLog({
        logId: 'COMM-LOG-2026-0001',
        sender: senderId,
        senderRole: 'super_admin',
        recipient: recipientId,
        recipientRole: 'student',
        channel: 'email_simulated',
        category: 'fee_reminder',
        subject: 'Fee Due Reminder',
        content: 'Your fee is due.',
        status: 'simulated_local',
        metadata: {
          targetEmail: 'rahul@student.college.edu',
          deliveryNotes: 'Dispatched via simulated queue in local environment.'
        }
      });

      const err = log.validateSync();
      expect(err).toBeUndefined();
      expect(log.channel).toBe('email_simulated');
      expect(log.status).toBe('simulated_local');
    });
  });
});

