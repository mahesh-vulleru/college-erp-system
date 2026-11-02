const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const env = require('../src/config/env');
const { ROLES } = require('@college-erp/shared');
const {
  Bus,
  Route,
  Driver,
  StudentTransportAllocation,
  Trip,
  GpsLocation,
  StudentTripAttendance,
  VehicleMaintenance,
  FuelRecord,
  TransportExpense,
  StudentTransportFee,
  EmergencyAlert,
  TransportIncident,
  Geofence,
  GeofenceEvent,
  OverspeedEvent
} = require('../src/modules/transport/models');
const User = require('../src/modules/auth/auth.model');
const { resolveDateRange } = require('../src/modules/transport/transport.analytics.controller');

describe('Transport Management System (Phase 5: Analytics, Reports & Executive Dashboard) Test Suite', () => {
  let adminToken;
  let supervisorToken;
  let accountsToken;
  let driverToken;
  let parentToken;
  let studentToken;

  const adminId = '507f1f77bcf86cd799439011';
  const supervisorId = '507f1f77bcf86cd799439012';
  const accountsId = '507f1f77bcf86cd799439013';
  const driverUserId = '507f1f77bcf86cd799439014';
  const parentId = '507f1f77bcf86cd799439015';
  const studentId = '507f1f77bcf86cd799439016';

  beforeAll(() => {
    const sign = (id, role) =>
      jwt.sign({ id, role }, env.JWT_SECRET, { expiresIn: '1d' });

    adminToken = sign(adminId, ROLES.TRANSPORT_ADMIN);
    supervisorToken = sign(supervisorId, ROLES.TRANSPORT_SUPERVISOR);
    accountsToken = sign(accountsId, ROLES.ACCOUNTS);
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
      } else if (idStr === accountsId) {
        role = ROLES.ACCOUNTS;
        name = 'Accountant Verma';
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
  // 1. DATE RANGE HELPER UNIT TESTS
  // -------------------------------------------------------------------------
  describe('1. Date Range Resolution Helper', () => {
    it('correctly resolves today, last7days, thismonth and custom date ranges', () => {
      const todayRange = resolveDateRange('today');
      expect(todayRange.start).toBeInstanceOf(Date);
      expect(todayRange.end).toBeInstanceOf(Date);

      const last7DaysRange = resolveDateRange('last7days');
      expect(last7DaysRange.start.getTime()).toBeLessThan(last7DaysRange.end.getTime());

      const customRange = resolveDateRange('custom', '2026-01-01', '2026-01-31');
      expect(customRange.start.toISOString().startsWith('2026-01-01')).toBe(true);
      expect(customRange.end.toISOString().startsWith('2026-01-31')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 2. EXECUTIVE DASHBOARD ANALYTICS
  // -------------------------------------------------------------------------
  describe('2. Executive Transport Dashboard Analytics', () => {
    it('returns 200 with comprehensive fleet, trip, financial and safety KPIs from DB', async () => {
      jest.spyOn(Bus, 'countDocuments')
        .mockResolvedValueOnce(15) // totalVehicles
        .mockResolvedValueOnce(12) // activeVehicles
        .mockResolvedValueOnce(2)  // inactiveVehicles
        .mockResolvedValueOnce(1); // maintenanceVehicles

      jest.spyOn(Driver, 'countDocuments')
        .mockResolvedValueOnce(14) // totalDrivers
        .mockResolvedValueOnce(12); // activeDrivers

      jest.spyOn(StudentTransportAllocation, 'countDocuments').mockResolvedValue(450);
      jest.spyOn(Route, 'countDocuments').mockResolvedValue(8);

      jest.spyOn(Trip, 'countDocuments')
        .mockResolvedValueOnce(16) // todayScheduledTrips
        .mockResolvedValueOnce(14) // todayCompletedTrips
        .mockResolvedValueOnce(1); // todayCancelledTrips

      jest.spyOn(StudentTripAttendance, 'find').mockReturnValue({
        select: () => Promise.resolve([
          { boardingStatus: 'Boarded' },
          { boardingStatus: 'Boarded' },
          { boardingStatus: 'Absent' }
        ])
      });

      jest.spyOn(FuelRecord, 'aggregate')
        .mockResolvedValueOnce([{ totalFuelCost: 45000, totalQuantity: 500 }]) // fuel range
        .mockResolvedValueOnce([]); // monthlyFuel

      jest.spyOn(VehicleMaintenance, 'aggregate')
        .mockResolvedValueOnce([{ totalMaintCost: 22000 }]) // maint range
        .mockResolvedValueOnce([]); // monthlyMaint

      jest.spyOn(StudentTransportFee, 'aggregate').mockResolvedValue([
        { totalDemand: 500000, totalCollected: 420000, totalPending: 80000 }
      ]);

      jest.spyOn(TransportIncident, 'countDocuments').mockResolvedValue(3);
      jest.spyOn(TransportExpense, 'aggregate').mockResolvedValue([]);
      jest.spyOn(StudentTransportAllocation, 'aggregate').mockResolvedValue([
        { routeId: 'r1', routeName: 'Route 1', routeCode: 'R-01', studentCount: 65 }
      ]);
      jest.spyOn(TransportIncident, 'aggregate').mockResolvedValue([
        { _id: 'Vehicle Breakdown', count: 2 }
      ]);

      const res = await request(app)
        .get('/api/v1/transport/analytics/executive?range=last30days')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.kpis.totalVehicles).toBe(15);
      expect(res.body.kpis.activeVehicles).toBe(12);
      expect(res.body.kpis.totalStudents).toBe(450);
      expect(res.body.kpis.totalFuelExpenses).toBe(45000);
      expect(res.body.kpis.totalMaintenanceExpenses).toBe(22000);
      expect(res.body.kpis.pendingTransportFees).toBe(80000);
      expect(res.body.visualizations).toHaveProperty('feeCollectionSummary');
    });
  });

  // -------------------------------------------------------------------------
  // 3. FLEET & VEHICLE ANALYTICS
  // -------------------------------------------------------------------------
  describe('3. Fleet & Vehicle Analytics', () => {
    it('returns vehicle metrics, capacity utilization %, fuel and operating costs', async () => {
      jest.spyOn(Bus, 'countDocuments')
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8)  // active
        .mockResolvedValueOnce(1)  // inactive
        .mockResolvedValueOnce(1); // maintenance

      const mockBus = {
        _id: '507f1f77bcf86cd799439091',
        busId: 'BUS-01',
        busName: 'Express 01',
        registrationNumber: 'KA-01-E-1001',
        vehicleType: 'Bus',
        capacity: 40,
        currentStatus: 'active',
        assignedDriver: { fullName: 'Suresh Kumar', contactNumber: '9876543210' },
        documents: {
          fitnessCertificate: { expiryDate: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000) }
        }
      };

      jest.spyOn(Bus, 'find').mockReturnValue({
        populate: () => Promise.resolve([mockBus])
      });

      jest.spyOn(Trip, 'countDocuments').mockResolvedValue(24);
      jest.spyOn(FuelRecord, 'find').mockReturnValue({
        select: () => Promise.resolve([{ quantityLiters: 120, totalCost: 11000 }])
      });
      jest.spyOn(VehicleMaintenance, 'find').mockReturnValue({
        select: () => Promise.resolve([{ cost: 4500, serviceType: 'Routine' }])
      });
      jest.spyOn(StudentTransportAllocation, 'countDocuments').mockResolvedValue(32);
      jest.spyOn(TransportIncident, 'countDocuments').mockResolvedValue(0);

      const res = await request(app)
        .get('/api/v1/transport/analytics/fleet')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary.totalFleetCapacity).toBe(40);
      expect(res.body.vehicles[0].capacityUtilization).toBe(80); // 32/40 = 80%
      expect(res.body.vehicles[0].metrics.totalOperatingCost).toBe(15500); // 11000 + 4500
    });
  });

  // -------------------------------------------------------------------------
  // 4. ROUTE PERFORMANCE ANALYTICS
  // -------------------------------------------------------------------------
  describe('4. Route Performance Analytics', () => {
    it('returns route metrics, student density, average duration and attendance %', async () => {
      const mockRoute = {
        _id: '507f1f77bcf86cd799439092',
        routeName: 'Route 1 - North Campus',
        routeCode: 'R-01',
        startLocation: 'Hebbal',
        endLocation: 'Campus',
        totalDistanceKm: 28,
        stops: [{ stopName: 'Stop 1' }, { stopName: 'Stop 2' }],
        status: 'active'
      };

      jest.spyOn(Route, 'find').mockResolvedValue([mockRoute]);
      jest.spyOn(StudentTransportAllocation, 'countDocuments').mockResolvedValue(45);
      jest.spyOn(Bus, 'countDocuments').mockResolvedValue(2);
      jest.spyOn(Trip, 'find').mockReturnValue({
        select: () => Promise.resolve([
          {
            actualDeparture: new Date('2026-11-01T08:00:00Z'),
            actualArrival: new Date('2026-11-01T08:45:00Z')
          }
        ])
      });
      jest.spyOn(Trip, 'countDocuments').mockResolvedValue(0); // cancelled
      jest.spyOn(StudentTripAttendance, 'find').mockReturnValue({
        select: () => Promise.resolve([
          { boardingStatus: 'Boarded' },
          { boardingStatus: 'Boarded' },
          { boardingStatus: 'Absent' }
        ])
      });

      const res = await request(app)
        .get('/api/v1/transport/analytics/routes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.routes[0].assignedStudents).toBe(45);
      expect(res.body.routes[0].averageDurationMinutes).toBe(45);
      expect(res.body.routes[0].attendancePercentage).toBe(67); // 2/3 = 67%
    });
  });

  // -------------------------------------------------------------------------
  // 5. DRIVER PERFORMANCE ANALYTICS
  // -------------------------------------------------------------------------
  describe('5. Driver Performance Analytics', () => {
    it('evaluates transparent driver performance scores based on trips and incidents', async () => {
      const mockDriver = {
        _id: '507f1f77bcf86cd799439093',
        driverId: 'DRV-01',
        fullName: 'Ramesh Singh',
        licenseNumber: 'KA0120200001234',
        contactNumber: '9876543210',
        employmentStatus: 'active',
        assignedBus: { busName: 'Bus 01', registrationNumber: 'KA-01-E-1001' }
      };

      jest.spyOn(Driver, 'find').mockReturnValue({
        populate: () => Promise.resolve([mockDriver])
      });

      jest.spyOn(Trip, 'countDocuments')
        .mockResolvedValueOnce(30) // completedTrips
        .mockResolvedValueOnce(1);  // cancelledTrips

      jest.spyOn(OverspeedEvent, 'countDocuments').mockResolvedValue(1); // 1 overspeed
      jest.spyOn(TransportIncident, 'countDocuments').mockResolvedValue(0); // 0 incidents

      // Formula: 100 - (1*5) - (1*3) - (0*10) + (30*0.5) = 100 - 5 - 3 + 15 = 107 -> clamped to 100
      const res = await request(app)
        .get('/api/v1/transport/analytics/drivers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.drivers[0].metrics.performanceScore).toBe(100);
      expect(res.body.drivers[0].metrics.performanceGrade).toBe('A');
    });
  });

  // -------------------------------------------------------------------------
  // 6. STUDENT TRANSPORT ANALYTICS
  // -------------------------------------------------------------------------
  describe('6. Student Transport Analytics', () => {
    it('returns student distributions by department, route and stop', async () => {
      const mockAllocations = [
        {
          allocationId: 'ALLOC-01',
          studentName: 'Aarav Sharma',
          rollNumber: '21CS101',
          department: 'Computer Science',
          pickupStop: 'Sector 14',
          allocationStatus: 'active',
          route: { routeName: 'Route 1' }
        }
      ];

      jest.spyOn(StudentTransportAllocation, 'find').mockReturnValue({
        populate: () => ({
          populate: () => Promise.resolve(mockAllocations)
        })
      });

      jest.spyOn(StudentTripAttendance, 'find').mockReturnValue({
        select: () => Promise.resolve([
          { rollNumber: '21CS101', boardingStatus: 'Boarded', dropStatus: 'Dropped' }
        ])
      });

      jest.spyOn(StudentTransportFee, 'find').mockReturnValue({
        select: () => Promise.resolve([
          { paymentStatus: 'paid', totalFee: 25000, totalPaid: 25000, pendingBalance: 0 }
        ])
      });

      const res = await request(app)
        .get('/api/v1/transport/analytics/students')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary.totalStudents).toBe(1);
      expect(res.body.summary.boardingRate).toBe(100);
      expect(res.body.distributions.byDepartment).toHaveProperty('Computer Science', 1);
    });
  });

  // -------------------------------------------------------------------------
  // 7. FUEL & MAINTENANCE ANALYTICS
  // -------------------------------------------------------------------------
  describe('7. Fuel & Maintenance Cost Analytics', () => {
    it('returns fuel consumption metrics and vehicle maintenance breakdown', async () => {
      jest.spyOn(FuelRecord, 'find').mockReturnValue({
        populate: () => Promise.resolve([
          {
            bus: { busName: 'Bus 01', registrationNumber: 'KA-01-E-1001' },
            quantityLiters: 100,
            totalCost: 9500
          }
        ])
      });

      jest.spyOn(VehicleMaintenance, 'find').mockReturnValue({
        populate: () => Promise.resolve([
          {
            bus: { busName: 'Bus 01', registrationNumber: 'KA-01-E-1001' },
            serviceType: 'Oil Change',
            cost: 3500
          }
        ])
      });

      jest.spyOn(Bus, 'find').mockReturnValue({
        select: () => Promise.resolve([])
      });

      jest.spyOn(VehicleMaintenance, 'countDocuments')
        .mockResolvedValueOnce(2) // upcoming
        .mockResolvedValueOnce(1); // overdue

      const res = await request(app)
        .get('/api/v1/transport/analytics/fuel')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary.totalFuelExpenses).toBe(9500);
      expect(res.body.summary.totalMaintenanceExpenses).toBe(3500);
      expect(res.body.summary.totalOperatingCost).toBe(13000);
      expect(res.body.vehicleCostComparison[0].totalOperatingCost).toBe(13000);
    });
  });

  // -------------------------------------------------------------------------
  // 8. FINANCIAL ANALYTICS
  // -------------------------------------------------------------------------
  describe('8. Transport Financial Analytics', () => {
    it('returns fee demand, collection, operating expenses, and net margin', async () => {
      jest.spyOn(StudentTransportFee, 'find').mockReturnValue({
        select: () => Promise.resolve([
          {
            totalFee: 30000,
            totalPaid: 30000,
            pendingBalance: 0,
            paymentStatus: 'paid',
            payments: [{ paymentMethod: 'UPI', amount: 30000 }]
          }
        ])
      });

      jest.spyOn(FuelRecord, 'aggregate').mockResolvedValue([{ totalFuelCost: 12000 }]);
      jest.spyOn(VehicleMaintenance, 'aggregate').mockResolvedValue([{ totalMaintCost: 6000 }]);
      jest.spyOn(TransportExpense, 'aggregate').mockResolvedValue([{ totalOtherCost: 2000 }]);

      const res = await request(app)
        .get('/api/v1/transport/analytics/finance')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.revenue.totalFeeDemand).toBe(30000);
      expect(res.body.revenue.totalCollectedAmount).toBe(30000);
      expect(res.body.operatingExpenses.totalOperatingCost).toBe(20000); // 12000 + 6000 + 2000
      expect(res.body.financialHealth.netMargin).toBe(10000); // 30000 - 20000
      expect(res.body.financialHealth.isProfitable).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 9. SAFETY & INCIDENT ANALYTICS
  // -------------------------------------------------------------------------
  describe('9. Safety & Incident Analytics', () => {
    it('returns incident category breakdown, resolution time, and SOS counts', async () => {
      jest.spyOn(TransportIncident, 'countDocuments')
        .mockResolvedValueOnce(5) // total
        .mockResolvedValueOnce(2) // open
        .mockResolvedValueOnce(3); // resolved

      jest.spyOn(EmergencyAlert, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(OverspeedEvent, 'countDocuments').mockResolvedValue(4);
      jest.spyOn(GeofenceEvent, 'countDocuments').mockResolvedValue(2);

      jest.spyOn(TransportIncident, 'find').mockReturnValue({
        select: () => Promise.resolve([
          {
            category: 'Minor Collision',
            severity: 'Medium',
            reportedAt: new Date('2026-11-01T10:00:00Z'),
            resolvedAt: new Date('2026-11-01T14:00:00Z')
          }
        ])
      });

      const res = await request(app)
        .get('/api/v1/transport/analytics/safety')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary.totalIncidents).toBe(5);
      expect(res.body.summary.averageResolutionHours).toBe(4); // 4 hours resolution
      expect(res.body.breakdowns.byCategory).toHaveProperty('Minor Collision', 1);
    });
  });

  // -------------------------------------------------------------------------
  // 10. REPORT CENTER (PAGINATED GRID PREVIEW)
  // -------------------------------------------------------------------------
  describe('10. Central Transport Report Center', () => {
    it('returns paginated vehicle inventory report with column headers', async () => {
      jest.spyOn(Bus, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(Bus, 'find').mockReturnValue({
        populate: () => ({
          sort: () => ({
            skip: () => ({
              limit: () => Promise.resolve([
                {
                  busId: 'BUS-01',
                  busName: 'Express 01',
                  registrationNumber: 'KA-01-E-1001',
                  vehicleType: 'Bus',
                  capacity: 40,
                  assignedDriver: { fullName: 'Suresh' },
                  currentStatus: 'active',
                  odometerReading: 24500
                }
              ])
            })
          })
        })
      });

      const res = await request(app)
        .get('/api/v1/transport/reports?reportType=vehicle&page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.headers).toContain('Bus Name');
      expect(res.body.data.rows[0]).toContain('Express 01');
      expect(res.body.data.pagination.total).toBe(1);
    });

    it('returns fee collection report with demand and payment totals', async () => {
      jest.spyOn(StudentTransportFee, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(StudentTransportFee, 'find').mockReturnValue({
        sort: () => ({
          skip: () => ({
            limit: () => Promise.resolve([
              {
                rollNumber: '21CS101',
                studentName: 'Aarav Sharma',
                academicYear: '2025-2026',
                totalFee: 25000,
                totalPaid: 25000,
                pendingBalance: 0,
                paymentStatus: 'paid'
              }
            ])
          })
        })
      });

      const res = await request(app)
        .get('/api/v1/transport/reports?reportType=fee-collection')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summaryTotals.totalDemand).toBe(25000);
    });
  });

  // -------------------------------------------------------------------------
  // 11. REPORT EXPORT SYSTEM (PDF, EXCEL XLSX, CSV)
  // -------------------------------------------------------------------------
  describe('11. Report Export System', () => {
    beforeEach(() => {
      jest.spyOn(Bus, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(Bus, 'find').mockReturnValue({
        populate: () => ({
          sort: () => ({
            skip: () => ({
              limit: () => Promise.resolve([
                {
                  busId: 'BUS-01',
                  busName: 'Express 01',
                  registrationNumber: 'KA-01-E-1001',
                  vehicleType: 'Bus',
                  capacity: 40,
                  assignedDriver: { fullName: 'Suresh' },
                  currentStatus: 'active',
                  odometerReading: 24500
                }
              ])
            })
          })
        })
      });
    });

    it('exports vehicle report as CSV with UTF-8 BOM and correct disposition', async () => {
      const res = await request(app)
        .get('/api/v1/transport/reports/export?reportType=vehicle&format=csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment; filename="transport-vehicle');
      expect(res.text).toContain('Bus ID,Bus Name');
    });

    it('exports vehicle report as Excel XLSX (SpreadsheetML) XML document', async () => {
      const res = await request(app)
        .get('/api/v1/transport/reports/export?reportType=vehicle&format=xlsx')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/vnd.ms-excel');
      expect(res.headers['content-disposition']).toContain('.xlsx');
      expect(res.text).toContain('xmlns="urn:schemas-microsoft-com:office:spreadsheet"');
    });

    it('exports vehicle report as a binary PDF document stream', async () => {
      const res = await request(app)
        .get('/api/v1/transport/reports/export?reportType=vehicle&format=pdf')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toContain('.pdf');
      const text = res.body ? res.body.toString('latin1') : (res.text || '');
      expect(text).toContain('%PDF-1.4');
    });
  });

  // -------------------------------------------------------------------------
  // 12. ROLE-BASED ACCESS CONTROL (RBAC)
  // -------------------------------------------------------------------------
  describe('12. Role-Based Access Control on Analytics & Reports', () => {
    it('allows Accountant to access financial analytics and reports', async () => {
      jest.spyOn(StudentTransportFee, 'find').mockReturnValue({
        select: () => Promise.resolve([])
      });
      jest.spyOn(FuelRecord, 'aggregate').mockResolvedValue([]);
      jest.spyOn(VehicleMaintenance, 'aggregate').mockResolvedValue([]);
      jest.spyOn(TransportExpense, 'aggregate').mockResolvedValue([]);

      const res = await request(app)
        .get('/api/v1/transport/analytics/finance')
        .set('Authorization', `Bearer ${accountsToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('forbids Student role from accessing executive transport analytics (403)', async () => {
      const res = await request(app)
        .get('/api/v1/transport/analytics/executive')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('forbids Student role from exporting institutional fleet inventory (403)', async () => {
      const res = await request(app)
        .get('/api/v1/transport/reports/export?reportType=vehicle&format=csv')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('forbids Transport Supervisor from accessing financial analytics (403)', async () => {
      const res = await request(app)
        .get('/api/v1/transport/analytics/finance')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
});
