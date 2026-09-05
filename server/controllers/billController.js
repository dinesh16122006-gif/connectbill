const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const Setting = require('../models/Setting');
const { generateMonthlyBills } = require('../services/billScheduler');

// Get bills (Customer gets their own; Admin gets all with filters)
const getBills = async (req, res, next) => {
  try {
    const {
      customerId,
      status,
      providerId,
      billingMonth,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const filter = {};

    // Strict access control: Customers can ONLY see their own bills
    if (req.user.role === 'CUSTOMER') {
      filter.customerId = req.customer._id;
    } else if (customerId && customerId !== 'ALL') {
      filter.customerId = customerId;
    }

    if (status && status !== 'ALL') {
      if (status === 'PENDING') {
        filter.status = { $in: ['PENDING', 'PARTIAL'] };
      } else {
        filter.status = status;
      }
    }

    if (providerId && providerId !== 'ALL') {
      filter.providerId = providerId;
    }

    if (billingMonth && billingMonth !== 'ALL') {
      filter.billingMonth = billingMonth;
    }

    let bills = await Bill.find(filter)
      .populate('customerId', 'name phone connectionId address email')
      .populate('providerId', 'name code color iconName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Dynamic overdue check: if due date passed and status is PENDING/PARTIAL, consider overdue
    const now = new Date();
    const updatedBills = bills.map((bill) => {
      const bObj = bill.toObject();
      if (['PENDING', 'PARTIAL'].includes(bObj.status) && new Date(bObj.dueDate) < now) {
        bObj.isOverdue = true;
      }
      return bObj;
    });

    if (search && search.trim() !== '') {
      const s = search.toLowerCase();
      const filtered = updatedBills.filter(
        (b) =>
          (b.billNumber && b.billNumber.toLowerCase().includes(s)) ||
          (b.customerId && b.customerId.name && b.customerId.name.toLowerCase().includes(s)) ||
          (b.customerId && b.customerId.connectionId && b.customerId.connectionId.toLowerCase().includes(s))
      );
      return res.status(200).json({
        success: true,
        count: filtered.length,
        bills: filtered
      });
    }

    const total = await Bill.countDocuments(filter);

    return res.status(200).json({
      success: true,
      total,
      count: updatedBills.length,
      bills: updatedBills
    });
  } catch (error) {
    next(error);
  }
};

// Get single bill by ID
const getBillById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const bill = await Bill.findById(id)
      .populate('customerId')
      .populate('providerId')
      .populate('connectionId');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found.'
      });
    }

    // Access control
    if (req.user.role === 'CUSTOMER' && bill.customerId._id.toString() !== req.customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own bills.'
      });
    }

    // Find payments associated with this bill
    const payments = await Payment.find({ billId: bill._id }).sort({ paymentDate: -1 });

    return res.status(200).json({
      success: true,
      bill: {
        ...bill.toObject(),
        payments
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Manually create a single bill
const createBill = async (req, res, next) => {
  try {
    const {
      customerId,
      billingMonth,
      dueDate,
      baseAmount,
      previousPending = 0,
      lateFee = 0,
      discount = 0,
      notes
    } = req.body;

    if (!customerId || !billingMonth || !dueDate || baseAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Customer, billing month (YYYY-MM), due date, and base amount are required.'
      });
    }

    const customer = await Customer.findById(customerId).populate('providerId');
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.'
      });
    }

    // Check duplicate bill for the month
    const existing = await Bill.findOne({ customerId, billingMonth });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A bill for customer ${customer.name} for month ${billingMonth} already exists (Bill #${existing.billNumber}).`
      });
    }

    const [year, month] = billingMonth.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    const billingMonthName = d.toLocaleString('default', { month: 'long', year: 'numeric' });

    const settings = (await Setting.findOne()) || {};
    const prefix = settings.invoicePrefix || 'CB';
    const count = await Bill.countDocuments();
    const billNumber = `${prefix}-${year}${String(month).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

    const totalAmount = Number(baseAmount) + Number(previousPending) + Number(lateFee) - Number(discount);

    const bill = await Bill.create({
      customerId,
      providerId: customer.providerId._id || customer.providerId,
      billNumber,
      billingMonth,
      billingMonthName,
      billDate: new Date(),
      dueDate: new Date(dueDate),
      baseAmount: Number(baseAmount),
      previousPending: Number(previousPending),
      lateFee: Number(lateFee),
      discount: Number(discount),
      totalAmount,
      paidAmount: 0,
      remainingAmount: totalAmount,
      status: 'PENDING',
      notes
    });

    return res.status(201).json({
      success: true,
      message: 'Bill created successfully.',
      bill
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Trigger monthly billing cycle (manual or automated)
const triggerMonthlyBills = async (req, res, next) => {
  try {
    const { month } = req.body; // e.g. '2026-09'
    const result = await generateMonthlyBills(month || null);

    return res.status(200).json({
      success: true,
      message: `Monthly billing processed. Generated: ${result.generatedCount}, Skipped: ${result.skippedCount}`,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update bill
const updateBill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { dueDate, baseAmount, lateFee, discount, notes } = req.body;

    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found.' });
    }

    if (bill.status === 'PAID') {
      return res.status(400).json({ success: false, message: 'Cannot edit a fully paid bill.' });
    }

    if (dueDate) bill.dueDate = new Date(dueDate);
    if (baseAmount !== undefined) bill.baseAmount = Number(baseAmount);
    if (lateFee !== undefined) bill.lateFee = Number(lateFee);
    if (discount !== undefined) bill.discount = Number(discount);
    if (notes !== undefined) bill.notes = notes;

    bill.totalAmount = bill.baseAmount + bill.previousPending + bill.lateFee - bill.discount;
    bill.remainingAmount = Math.max(0, bill.totalAmount - bill.paidAmount);

    if (bill.remainingAmount === 0 && bill.paidAmount > 0) {
      bill.status = 'PAID';
    } else if (bill.paidAmount > 0) {
      bill.status = 'PARTIAL';
    } else {
      bill.status = 'PENDING';
    }

    await bill.save();

    return res.status(200).json({
      success: true,
      message: 'Bill updated successfully.',
      bill
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Cancel bill
const cancelBill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findById(id);

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found.' });
    }

    if (bill.paidAmount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a bill that already has payments recorded.'
      });
    }

    bill.status = 'CANCELLED';
    await bill.save();

    return res.status(200).json({
      success: true,
      message: 'Bill cancelled successfully.',
      bill
    });
  } catch (error) {
    next(error);
  }
};

// Get Pending Bills
const getPendingBills = async (req, res, next) => {
  try {
    const filter = {
      status: { $in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
    };

    if (req.user.role === 'CUSTOMER') {
      filter.customerId = req.customer._id;
    }

    const pendingBills = await Bill.find(filter)
      .populate('customerId', 'name phone connectionId address')
      .populate('providerId', 'name code color')
      .sort({ dueDate: 1 });

    const totalPendingAmount = pendingBills.reduce((acc, b) => acc + (b.remainingAmount || 0), 0);

    return res.status(200).json({
      success: true,
      count: pendingBills.length,
      totalPendingAmount,
      bills: pendingBills
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBills,
  getBillById,
  createBill,
  triggerMonthlyBills,
  updateBill,
  cancelBill,
  getPendingBills
};
