const Provider = require('../models/Provider');
const Customer = require('../models/Customer');
const Connection = require('../models/Connection');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');

const getProviders = async (req, res, next) => {
  try {
    const providers = await Provider.find().sort({ name: 1 });

    // Calculate aggregated metrics for each provider
    const providersWithStats = await Promise.all(
      providers.map(async (provider) => {
        const customerCount = await Customer.countDocuments({ providerId: provider._id });
        const activeConnections = await Connection.countDocuments({
          providerId: provider._id,
          status: 'ACTIVE'
        });

        // Monthly billing (sum of monthlyAmount for active customers)
        const activeCustomers = await Customer.find({
          providerId: provider._id,
          status: 'ACTIVE'
        });
        const monthlyBilling = activeCustomers.reduce((sum, c) => sum + (c.monthlyAmount || 0), 0);

        // Sum of all pending bills for this provider
        const pendingBills = await Bill.find({
          providerId: provider._id,
          status: { $in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
        });
        const pendingAmount = pendingBills.reduce((sum, b) => sum + (b.remainingAmount || 0), 0);

        // Sum of collected payments for this provider
        const customerIds = activeCustomers.map((c) => c._id);
        const payments = await Payment.find({
          customerId: { $in: customerIds },
          status: 'SUCCESS'
        });
        const collectedAmount = payments.reduce((sum, p) => sum + p.amount, 0);

        return {
          ...provider.toObject(),
          customerCount,
          activeConnections,
          monthlyBilling,
          collectedAmount,
          pendingAmount
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: providersWithStats.length,
      providers: providersWithStats
    });
  } catch (error) {
    next(error);
  }
};

const createProvider = async (req, res, next) => {
  try {
    const { name, code, description, iconName, color } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Provider name and unique code are required.'
      });
    }

    const provider = await Provider.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description,
      iconName: iconName || 'Wifi',
      color: color || '#2563eb'
    });

    return res.status(201).json({
      success: true,
      message: 'Provider created successfully.',
      provider
    });
  } catch (error) {
    next(error);
  }
};

const updateProvider = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, description, status, iconName, color } = req.body;

    const provider = await Provider.findById(id);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found.'
      });
    }

    if (name) provider.name = name.trim();
    if (code) provider.code = code.trim().toUpperCase();
    if (description !== undefined) provider.description = description;
    if (status) provider.status = status;
    if (iconName) provider.iconName = iconName;
    if (color) provider.color = color;

    await provider.save();

    return res.status(200).json({
      success: true,
      message: 'Provider updated successfully.',
      provider
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProviders,
  createProvider,
  updateProvider
};
