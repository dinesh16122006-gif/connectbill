const Customer = require('../models/Customer');
const Connection = require('../models/Connection');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Plan = require('../models/Plan');

// Admin: Get all customers with search and filters
const getCustomers = async (req, res, next) => {
  try {
    const { search, providerId, status, area, billingStatus, page = 1, limit = 50 } = req.query;

    const filter = {};

    if (providerId && providerId !== 'ALL') {
      filter.providerId = providerId;
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (area && area !== 'ALL') {
      filter.area = area;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { connectionId: searchRegex },
        { email: searchRegex }
      ];
    }

    const customers = await Customer.find(filter)
      .populate('providerId', 'name code color iconName')
      .populate('planId', 'name speed monthlyPrice')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Customer.countDocuments(filter);

    // Attach latest pending bill status to each customer
    const enhancedCustomers = await Promise.all(
      customers.map(async (cust) => {
        const pendingBills = await Bill.find({
          customerId: cust._id,
          status: { $in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
        }).select('totalAmount paidAmount remainingAmount status dueDate billingMonthName');

        const totalPending = pendingBills.reduce((acc, b) => acc + (b.remainingAmount || 0), 0);

        return {
          ...cust.toObject(),
          totalPending,
          hasPendingBills: pendingBills.length > 0,
          pendingBillsCount: pendingBills.length
        };
      })
    );

    // Optional filter by billing status (PAID vs PENDING)
    let finalResult = enhancedCustomers;
    if (billingStatus === 'PENDING') {
      finalResult = finalResult.filter((c) => c.totalPending > 0);
    } else if (billingStatus === 'PAID') {
      finalResult = finalResult.filter((c) => c.totalPending === 0);
    }

    return res.status(200).json({
      success: true,
      total,
      count: finalResult.length,
      customers: finalResult
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get customer by ID with full connection, bills, payments
const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id)
      .populate('providerId')
      .populate('planId');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.'
      });
    }

    const connection = await Connection.findOne({ customerId: customer._id })
      .populate('providerId')
      .populate('planId');

    const bills = await Bill.find({ customerId: customer._id })
      .sort({ createdAt: -1 });

    const payments = await Payment.find({ customerId: customer._id })
      .sort({ paymentDate: -1 });

    const totalPending = bills
      .filter((b) => ['PENDING', 'PARTIAL', 'OVERDUE'].includes(b.status))
      .reduce((sum, b) => sum + (b.remainingAmount || 0), 0);

    const totalPaid = payments
      .filter((p) => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + p.amount, 0);

    return res.status(200).json({
      success: true,
      customer: {
        ...customer.toObject(),
        connection,
        bills,
        payments,
        totalPending,
        totalPaid
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Create new customer
const createCustomer = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      area,
      providerId,
      connectionId,
      planId,
      monthlyAmount,
      dueDay = 10,
      notes,
      joiningDate
    } = req.body;

    if (!name || !phone || !address || !providerId || !connectionId || !planId) {
      return res.status(400).json({
        success: false,
        message: 'Name, mobile phone, address, provider, connection ID, and plan are all required.'
      });
    }

    const sanitizedPhone = phone.replace(/\D/g, '').slice(-10);
    const sanitizedConnId = connectionId.trim().toUpperCase();

    // Check unique connectionId
    const existingConn = await Customer.findOne({ connectionId: sanitizedConnId });
    if (existingConn) {
      return res.status(409).json({
        success: false,
        message: `A customer with Connection ID "${sanitizedConnId}" already exists.`
      });
    }

    // Check unique phone
    const existingPhone = await Customer.findOne({ phone: sanitizedPhone });
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: `A customer with Phone Number "${sanitizedPhone}" already exists.`
      });
    }

    // Resolve plan monthly amount if not explicitly provided
    let finalMonthlyAmount = monthlyAmount;
    if (!finalMonthlyAmount) {
      const plan = await Plan.findById(planId);
      finalMonthlyAmount = plan ? plan.monthlyPrice : 0;
    }

    // Create User record for Customer
    let user = await User.findOne({ phone: sanitizedPhone });
    if (!user) {
      user = await User.create({
        name,
        phone: sanitizedPhone,
        email: email || undefined,
        role: 'CUSTOMER',
        status: 'ACTIVE'
      });
    }

    // Create Customer
    const customer = await Customer.create({
      userId: user._id,
      name,
      phone: sanitizedPhone,
      email: email || undefined,
      address,
      area: area || 'Main Sector',
      providerId,
      connectionId: sanitizedConnId,
      planId,
      monthlyAmount: Number(finalMonthlyAmount),
      dueDay: Number(dueDay) || 10,
      joiningDate: joiningDate || new Date(),
      status: 'ACTIVE',
      notes
    });

    // Create Connection
    const connection = await Connection.create({
      customerId: customer._id,
      providerId,
      planId,
      connectionNumber: sanitizedConnId,
      installationDate: joiningDate || new Date(),
      status: 'ACTIVE',
      monthlyAmount: Number(finalMonthlyAmount)
    });

    return res.status(201).json({
      success: true,
      message: 'Customer and connection created successfully.',
      customer,
      connection
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update Customer
const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      address,
      area,
      providerId,
      planId,
      monthlyAmount,
      dueDay,
      status,
      notes
    } = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.'
      });
    }

    if (name) customer.name = name.trim();
    if (phone) customer.phone = phone.replace(/\D/g, '').slice(-10);
    if (email !== undefined) customer.email = email ? email.trim() : undefined;
    if (address) customer.address = address.trim();
    if (area) customer.area = area.trim();
    if (providerId) customer.providerId = providerId;
    if (planId) customer.planId = planId;
    if (monthlyAmount !== undefined) customer.monthlyAmount = Number(monthlyAmount);
    if (dueDay !== undefined) customer.dueDay = Number(dueDay);
    if (status) customer.status = status;
    if (notes !== undefined) customer.notes = notes;

    await customer.save();

    // Also update connection if provider/plan/amount changed
    await Connection.findOneAndUpdate(
      { customerId: customer._id },
      {
        providerId: customer.providerId,
        planId: customer.planId,
        monthlyAmount: customer.monthlyAmount,
        status: customer.status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED'
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully.',
      customer
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete/Deactivate Customer
const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.'
      });
    }

    // Mark inactive
    customer.status = 'INACTIVE';
    await customer.save();

    await Connection.findOneAndUpdate(
      { customerId: customer._id },
      { status: 'DISCONNECTED' }
    );

    return res.status(200).json({
      success: true,
      message: 'Customer deactivated and connection disconnected successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// Customer: Get logged-in customer profile
const getCustomerProfile = async (req, res, next) => {
  try {
    // req.customer is populated by requireCustomer middleware
    const customer = await Customer.findById(req.customer._id)
      .populate('providerId')
      .populate('planId');

    const connection = await Connection.findOne({ customerId: customer._id });

    // Pending bills summary
    const pendingBills = await Bill.find({
      customerId: customer._id,
      status: { $in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
    });

    const totalPending = pendingBills.reduce((acc, b) => acc + (b.remainingAmount || 0), 0);

    return res.status(200).json({
      success: true,
      customer: {
        ...customer.toObject(),
        connection,
        totalPending,
        pendingBillsCount: pendingBills.length
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerProfile
};
