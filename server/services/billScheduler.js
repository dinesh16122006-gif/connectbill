const cron = require('node-cron');
const Customer = require('../models/Customer');
const Connection = require('../models/Connection');
const Bill = require('../models/Bill');
const Setting = require('../models/Setting');
const Notification = require('../models/Notification');

const getMonthNames = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const monthString = `${year}-${month}`;
  const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
  return { year, month, monthString, monthName };
};

const generateMonthlyBills = async (customMonthString = null) => {
  try {
    const now = new Date();
    let targetMonthString = customMonthString;
    let targetMonthName = '';

    if (!targetMonthString) {
      const { monthString, monthName } = getMonthNames(now);
      targetMonthString = monthString;
      targetMonthName = monthName;
    } else {
      const [y, m] = targetMonthString.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      targetMonthName = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    }

    const [year, month] = targetMonthString.split('-').map(Number);
    const settings = (await Setting.findOne()) || {};
    const defaultDueDay = settings.defaultDueDay || 10;
    const prefix = settings.invoicePrefix || 'CB';

    // Find all active customers
    const activeCustomers = await Customer.find({ status: 'ACTIVE' })
      .populate('providerId')
      .populate('planId');

    let generatedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Find current highest sequence for this month
    const existingBillsThisMonth = await Bill.find({ billingMonth: targetMonthString })
      .sort({ createdAt: -1 })
      .limit(1);

    let sequence = 1;
    if (existingBillsThisMonth.length > 0 && existingBillsThisMonth[0].billNumber) {
      const parts = existingBillsThisMonth[0].billNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    for (const customer of activeCustomers) {
      try {
        // Check if bill already exists for this customer & billing month
        const alreadyBilled = await Bill.findOne({
          customerId: customer._id,
          billingMonth: targetMonthString
        });

        if (alreadyBilled) {
          skippedCount++;
          continue;
        }

        // Calculate previous pending from all earlier unpaid bills
        const unpaidBills = await Bill.find({
          customerId: customer._id,
          billingMonth: { $ne: targetMonthString },
          status: { $in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
        });

        const previousPending = unpaidBills.reduce((sum, b) => sum + (b.remainingAmount || 0), 0);

        const baseAmount = customer.monthlyAmount || (customer.planId ? customer.planId.monthlyPrice : 0);
        const lateFee = 0;
        const discount = 0;
        const totalAmount = baseAmount + previousPending + lateFee - discount;

        // Due date: customer specific dueDay or default 10th
        const dueDay = customer.dueDay || defaultDueDay;
        const dueDate = new Date(year, month - 1, dueDay, 23, 59, 59);

        // Find connection
        const connection = await Connection.findOne({ customerId: customer._id });

        const billNumber = `${prefix}-${year}${String(month).padStart(2, '0')}-${String(sequence).padStart(4, '0')}`;
        sequence++;

        const newBill = await Bill.create({
          customerId: customer._id,
          connectionId: connection ? connection._id : undefined,
          providerId: customer.providerId._id || customer.providerId,
          billNumber,
          billingMonth: targetMonthString,
          billingMonthName: targetMonthName,
          billDate: new Date(),
          dueDate,
          baseAmount,
          previousPending,
          lateFee,
          discount,
          totalAmount,
          paidAmount: 0,
          remainingAmount: totalAmount,
          status: 'PENDING'
        });

        // Notify customer
        await Notification.create({
          customerId: customer._id,
          targetRole: 'CUSTOMER',
          title: `New Bill Generated - ${targetMonthName}`,
          message: `Your internet/cable bill of ₹${totalAmount} for ${targetMonthName} is ready. Due date: ${dueDate.toLocaleDateString('en-IN')}.`,
          type: 'BILL'
        });

        generatedCount++;
      } catch (custErr) {
        errors.push({
          customerId: customer._id,
          customerName: customer.name,
          error: custErr.message
        });
      }
    }

    console.log(
      `[Bill Scheduler] Month ${targetMonthString}: Generated ${generatedCount} bills, skipped ${skippedCount} existing.`
    );

    return {
      success: true,
      billingMonth: targetMonthString,
      billingMonthName: targetMonthName,
      generatedCount,
      skippedCount,
      errors
    };
  } catch (error) {
    console.error('[Bill Scheduler] Error during bill generation:', error);
    throw error;
  }
};

const initScheduler = () => {
  // Cron: Run at 00:01 on the 1st of every month
  cron.schedule('1 0 1 * *', async () => {
    console.log('[Bill Scheduler Cron] Running scheduled monthly bill generator...');
    try {
      await generateMonthlyBills();
    } catch (err) {
      console.error('[Bill Scheduler Cron] Cron execution failed:', err.message);
    }
  });
  console.log('[Bill Scheduler] Automated monthly bill generation cron initialized.');
};

module.exports = {
  generateMonthlyBills,
  initScheduler,
  getMonthNames
};
