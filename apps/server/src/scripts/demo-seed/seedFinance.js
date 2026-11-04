/**
 * Seed Demo Finance & Accounts
 * Populates fee structures and 100+ simulated payment transactions and receipt records
 */
const FeeStructure = require('../../modules/fees/fee.model');
const Payment = require('../../modules/payments/payment.model');
const { DEMO_PREFIX, DEMO_TAG, DEPARTMENTS } = require('./config');

const PAYMENT_METHODS = ['UPI', 'NetBanking', 'Card', 'DemandDraft'];

async function seedFinance(academicMap, studentProfiles) {
  console.log('[Finance] Seeding institutional fee structures and 100+ student fee payments...');

  // 1. Fee Structures for all 5 departments
  const feeStructures = {};
  for (const d of DEPARTMENTS) {
    const dept = academicMap.departments[d.code];
    const title = `${d.code} B.Tech Semester Fee Structure ${DEMO_TAG}`;

    let fee = await FeeStructure.findOne({ title });
    if (!fee) {
      fee = await FeeStructure.create({
        title,
        department: dept._id,
        academicYear: '2025-2026',
        semester: 4,
        feeCategory: 'composite',
        currency: 'INR',
        tuitionFee: 35000,
        labFee: 5000,
        libraryFee: 2000,
        examFee: 1500,
        otherFee: 1000,
        totalAmount: 44500,
        dueDate: new Date('2026-12-31'),
        status: 'active'
      });
    }
    feeStructures[d.code] = fee;
  }

  // 2. 100 Student Payments & Receipts
  let paymentsCount = 0;
  for (let i = 0; i < studentProfiles.length; i++) {
    const student = studentProfiles[i];
    const deptIdx = Math.floor(i / 20);
    const deptCode = DEPARTMENTS[deptIdx].code;
    const fee = feeStructures[deptCode];
    const num = String(i + 1).padStart(3, '0');
    const receiptNumber = `${DEMO_PREFIX}REC-2026-${num}`;

    let pay = await Payment.findOne({ receiptNumber });
    if (!pay) {
      const paymentDate = new Date();
      paymentDate.setDate(paymentDate.getDate() - (i % 60)); // staggered across past 60 days

      await Payment.create({
        student: student._id,
        feeStructure: fee._id,
        receiptNumber,
        amountPaid: 44500,
        currency: 'INR',
        paymentDate,
        paymentMethod: PAYMENT_METHODS[i % PAYMENT_METHODS.length],
        transactionReference: `DEMO-TXN-${100000 + i}`,
        status: 'completed',
        isVerified: true
      });
      paymentsCount++;
    }
  }

  console.log(`[Finance] Successfully provisioned ${Object.keys(feeStructures).length} fee structures and ${paymentsCount} payment ledger receipts.`);
}

module.exports = { seedFinance };

