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
  StudentTripAttendance,
  VehicleMaintenance,
  FuelRecord,
  TransportExpense,
  TransportFeeStructure,
  StudentTransportFee
} = require('../src/modules/transport/models');

describe('Transport Management System (Phase 3: Maintenance, Fuel, Expenses & Fees) Test Suite', () => {
  const adminUser = {
    _id: '507f1f77bcf86cd799439201',
    name: 'Mr. Robert Hayes',
    email: 'transport@college.edu',
    role: ROLES.TRANSPORT_ADMIN,
    status: 'active'
  };

  const accountsUser = {
    _id: '507f1f77bcf86cd799439202',
    name: 'Mr. Michael Finance',
    email: 'accounts@college.edu',
    role: ROLES.ACCOUNTS,
    status: 'active'
  };

  const studentUser = {
    _id: '507f1f77bcf86cd799439203',
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

  const accountsToken = jwt.sign(
    { id: accountsUser._id, role: accountsUser.role },
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
      if (idStr === String(accountsUser._id)) u = accountsUser;
      else if (idStr === String(studentUser._id)) u = studentUser;
      return {
        select: jest.fn().mockResolvedValue(u)
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. VEHICLE MAINTENANCE & COMPLIANCE
  // -------------------------------------------------------------------------
  describe('1. Vehicle Maintenance Management', () => {
    it('creates maintenance record and automatically marks bus as under_maintenance', async () => {
      jest.spyOn(VehicleMaintenance, 'findOne').mockResolvedValue(null);
      const mockBus = {
        _id: 'b1',
        busId: 'BUS-01',
        registrationNumber: 'KA-01-AB-1234',
        currentStatus: 'active',
        save: jest.fn().mockResolvedValue(true)
      };
      jest.spyOn(Bus, 'findById').mockResolvedValue(mockBus);

      jest.spyOn(VehicleMaintenance.prototype, 'save').mockResolvedValue({
        _id: 'm1',
        maintenanceId: 'MNT-2026-001',
        bus: 'b1',
        totalCost: 9500,
        maintenanceStatus: 'Scheduled'
      });

      const res = await request(app)
        .post('/api/v1/transport/maintenance')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          maintenanceId: 'MNT-2026-001',
          bus: 'b1',
          maintenanceType: 'Regular Service',
          serviceDate: '2026-11-04',
          serviceProvider: 'Apex Garage',
          serviceDescription: 'Brake pad overhaul',
          labourCost: 3500,
          partsCost: 6000,
          maintenanceStatus: 'Scheduled'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(mockBus.currentStatus).toBe('under_maintenance');
    });

    it('completes maintenance and releases vehicle back to active status', async () => {
      const mockMnt = {
        _id: 'm1',
        maintenanceId: 'MNT-2026-001',
        bus: 'b1',
        maintenanceStatus: 'Scheduled',
        save: jest.fn().mockResolvedValue(true)
      };
      jest.spyOn(VehicleMaintenance, 'findById').mockResolvedValue(mockMnt);
      jest.spyOn(Bus, 'findByIdAndUpdate').mockResolvedValue(true);

      const res = await request(app)
        .patch('/api/v1/transport/maintenance/m1/complete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ remarks: 'Repairs completed and certified' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockMnt.maintenanceStatus).toBe('Completed');
      expect(Bus.findByIdAndUpdate).toHaveBeenCalledWith('b1', { currentStatus: 'active' });
    });

    it('returns document expiry alerts for vehicle insurance and compliance certificates', async () => {
      jest.spyOn(Bus, 'find').mockReturnValue({
        select: jest.fn().mockResolvedValue([
          {
            busId: 'BUS-01',
            busName: 'Bus 1',
            registrationNumber: 'KA-01-AB-1234',
            insuranceExpiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days left
          }
        ])
      });

      const res = await request(app)
        .get('/api/v1/transport/maintenance/alerts/expiry')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary.expiringSoonCount).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // 2. FUEL MANAGEMENT & MILEAGE TRACKING
  // -------------------------------------------------------------------------
  describe('2. Fuel Management & Mileage', () => {
    it('creates fuel entry, correctly computing total cost, distance, and mileage', async () => {
      jest.spyOn(FuelRecord, 'findOne').mockResolvedValue(null);
      jest.spyOn(Bus, 'findById').mockResolvedValue({
        _id: 'b1',
        busId: 'BUS-01',
        registrationNumber: 'KA-01-AB-1234'
      });

      jest.spyOn(FuelRecord.prototype, 'save').mockResolvedValue({
        _id: 'f1',
        fuelRecordId: 'FUEL-2026-001',
        fuelQuantity: 50,
        pricePerLitre: 90,
        totalFuelCost: 4500,
        distanceTravelled: 200,
        mileage: 4.0
      });

      const res = await request(app)
        .post('/api/v1/transport/fuel')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fuelRecordId: 'FUEL-2026-001',
          bus: 'b1',
          fuelStation: 'IOCL Hub',
          fuelDate: '2026-11-03',
          fuelQuantity: 50,
          pricePerLitre: 90,
          odometerReading: 45200,
          previousOdometerReading: 45000
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalFuelCost).toBe(4500);
      expect(res.body.data.mileage).toBe(4.0);
    });

    it('rejects fuel entry if current odometer reading is less than previous reading', async () => {
      jest.spyOn(FuelRecord, 'findOne').mockResolvedValue(null);
      jest.spyOn(Bus, 'findById').mockResolvedValue({
        _id: 'b1',
        busId: 'BUS-01'
      });

      const res = await request(app)
        .post('/api/v1/transport/fuel')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fuelRecordId: 'FUEL-2026-002',
          bus: 'b1',
          fuelStation: 'IOCL Hub',
          fuelDate: '2026-11-03',
          fuelQuantity: 50,
          pricePerLitre: 90,
          odometerReading: 44000, // LESS than previous!
          previousOdometerReading: 45000
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('cannot decrease');
    });
  });

  // -------------------------------------------------------------------------
  // 3. TRANSPORT EXPENSE MANAGEMENT & APPROVALS
  // -------------------------------------------------------------------------
  describe('3. Transport Expense Management', () => {
    it('submits a new transport expense for approval', async () => {
      jest.spyOn(TransportExpense, 'findOne').mockResolvedValue(null);
      jest.spyOn(TransportExpense.prototype, 'save').mockResolvedValue({
        _id: 'exp1',
        expenseId: 'EXP-2026-001',
        amount: 3200,
        approvalStatus: 'Submitted'
      });

      const res = await request(app)
        .post('/api/v1/transport/expenses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          expenseId: 'EXP-2026-001',
          category: 'Repair Expenses',
          expenseDate: '2026-11-03',
          description: 'Emergency wiper motor fix',
          amount: 3200,
          vendor: 'Auto electrical works'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.approvalStatus).toBe('Submitted');
    });

    it('approves expense when authorized Accounts officer reviews it', async () => {
      const mockExpense = {
        _id: 'exp1',
        expenseId: 'EXP-2026-001',
        submittedBy: adminUser._id, // submitted by admin
        amount: 3200,
        approvalStatus: 'Submitted',
        save: jest.fn().mockResolvedValue(true)
      };
      jest.spyOn(TransportExpense, 'findById').mockResolvedValue(mockExpense);

      const res = await request(app)
        .patch('/api/v1/transport/expenses/exp1/approve')
        .set('Authorization', `Bearer ${accountsToken}`) // approved by accounts
        .send({ remarks: 'Invoice verified with physical voucher' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockExpense.approvalStatus).toBe('Approved');
    });
  });

  // -------------------------------------------------------------------------
  // 4. TRANSPORT FEE MANAGEMENT & RECEIPTS
  // -------------------------------------------------------------------------
  describe('4. Transport Fee Ledger & Receipts', () => {
    it('records partial fee payment and accurately calculates remaining balance', async () => {
      const mockFee = {
        _id: 'fee1',
        studentName: 'Aarav Sharma',
        rollNumber: '24CSE001',
        totalFee: 20000,
        paidAmount: 5000,
        pendingAmount: 15000,
        payments: [],
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(StudentTransportFee, 'findById').mockResolvedValue(mockFee);
      jest.spyOn(StudentTransportAllocation, 'findOneAndUpdate').mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/transport/fees/fee1/pay')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 10000,
          paymentMethod: 'UPI',
          transactionReference: 'UPI-99281729'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockFee.paidAmount).toBe(15000);
      expect(mockFee.pendingAmount).toBe(5000);
      expect(mockFee.paymentStatus).toBe('Partially Paid');
      expect(res.body).toHaveProperty('receipt');
      expect(res.body.receipt).toHaveProperty('receiptNumber');
    });

    it('rejects payment if payment amount exceeds pending balance', async () => {
      const mockFee = {
        _id: 'fee1',
        totalFee: 20000,
        paidAmount: 18000,
        pendingAmount: 2000
      };

      jest.spyOn(StudentTransportFee, 'findById').mockResolvedValue(mockFee);

      const res = await request(app)
        .post('/api/v1/transport/fees/fee1/pay')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 5000 // EXCEEDS pending balance of 2000
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('cannot exceed pending balance');
    });

    it('returns official transport receipt by receipt number', async () => {
      const mockPayment = {
        receiptNumber: 'RCPT-2026-001234',
        amount: 10000,
        paymentDate: new Date(),
        paymentMethod: 'UPI',
        transactionReference: 'TXN-991',
        issuedBy: { name: 'Accounts Officer' }
      };

      jest.spyOn(StudentTransportFee, 'findOne').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue({
              studentName: 'Aarav Sharma',
              rollNumber: '24CSE001',
              totalFee: 20000,
              paidAmount: 10000,
              pendingAmount: 10000,
              payments: [mockPayment]
            })
          })
        })
      });

      const res = await request(app)
        .get('/api/v1/transport/fees/receipts/RCPT-2026-001234')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.receipt.receiptNumber).toBe('RCPT-2026-001234');
      expect(res.body.receipt.amountPaid).toBe(10000);
    });
  });

  // -------------------------------------------------------------------------
  // 5. RBAC RESTRICTIONS
  // -------------------------------------------------------------------------
  describe('5. RBAC Protection on Phase 3 APIs', () => {
    it('forbids Student role from approving expenses with 403 Forbidden', async () => {
      const res = await request(app)
        .patch('/api/v1/transport/expenses/exp1/approve')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ remarks: 'Hack' });

      expect(res.statusCode).toBe(403);
    });

    it('forbids Student role from scheduling vehicle maintenance with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/transport/maintenance')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ maintenanceId: 'MNT-HACK' });

      expect(res.statusCode).toBe(403);
    });
  });
});

