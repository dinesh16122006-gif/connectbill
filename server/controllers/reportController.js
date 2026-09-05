const Customer = require('../models/Customer');
const Connection = require('../models/Connection');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const Provider = require('../models/Provider');

// Admin Dashboard Summary Metrics & Charts
const getDashboardMetrics = async (req, res, next) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const activeConnections = await Connection.countDocuments({ status: 'ACTIVE' });

    // Active customers monthly billing total
    const activeCustomers = await Customer.find({ status: 'ACTIVE' });
    const totalMonthlyBilling = activeCustomers.reduce((sum, c) => sum + (c.monthlyAmount || 0), 0);

    // Payments aggregation (total collected)
    const allSuccessfulPayments = await Payment.find({ status: 'SUCCESS' });
    const collectedAmount = allSuccessfulPayments.reduce((sum, p) => sum + p.amount, 0);

    // Bills aggregation (pending & overdue)
    const now = new Date();
    const unpaidBills = await Bill.find({ status: { $in: ['PENDING', 'PARTIAL', 'OVERDUE'] } });
    const pendingAmount = unpaidBills.reduce((sum, b) => sum + (b.remainingAmount || 0), 0);

    const overdueBills = unpaidBills.filter((b) => new Date(b.dueDate) < now);
    const overdueAmount = overdueBills.reduce((sum, b) => sum + (b.remainingAmount || 0), 0);

    // Bill count totals
    const totalBills = await Bill.countDocuments();
    const paidBillsCount = await Bill.countDocuments({ status: 'PAID' });
    const pendingBillsCount = unpaidBills.length;
    const overdueBillsCount = overdueBills.length;

    // 1. Monthly Revenue (Past 6 months)
    const monthLabels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mName = d.toLocaleString('default', { month: 'short' });
      monthLabels.push({ key: mStr, name: mName });
    }

    const monthlyRevenue = await Promise.all(
      monthLabels.map(async ({ key, name }) => {
        const billsInMonth = await Bill.find({ billingMonth: key });
        const billed = billsInMonth.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

        // Payments in that month
        const [y, m] = key.split('-').map(Number);
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 0, 23, 59, 59);
        const paymentsInMonth = await Payment.find({
          status: 'SUCCESS',
          paymentDate: { $gte: start, $lte: end }
        });
        const collected = paymentsInMonth.reduce((acc, p) => acc + p.amount, 0);

        return {
          month: name,
          fullMonth: key,
          billed,
          collected
        };
      })
    );

    // 2. Daily Collections (Past 7 days)
    const dailyCollections = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
      const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });

      const dayPayments = await Payment.find({
        status: 'SUCCESS',
        paymentDate: { $gte: dayStart, $lte: dayEnd }
      });

      const cash = dayPayments.filter((p) => p.paymentMethod === 'CASH').reduce((s, p) => s + p.amount, 0);
      const upi = dayPayments.filter((p) => p.paymentMethod === 'UPI').reduce((s, p) => s + p.amount, 0);
      const online = dayPayments.filter((p) => p.paymentMethod === 'ONLINE').reduce((s, p) => s + p.amount, 0);
      const bank = dayPayments.filter((p) => p.paymentMethod === 'BANK_TRANSFER').reduce((s, p) => s + p.amount, 0);
      const total = cash + upi + online + bank;

      dailyCollections.push({
        date: dayLabel,
        total,
        cash,
        upi,
        online,
        bank
      });
    }

    // 3. Paid vs Pending breakdown (for Donut / Pie chart)
    const paidVsPending = [
      { name: 'Paid Bills', count: paidBillsCount, amount: collectedAmount, color: '#10b981' },
      { name: 'Pending Bills', count: pendingBillsCount - overdueBillsCount, amount: pendingAmount - overdueAmount, color: '#f59e0b' },
      { name: 'Overdue Bills', count: overdueBillsCount, amount: overdueAmount, color: '#ef4444' }
    ];

    // 4. Provider-wise Customers & Revenue
    const providers = await Provider.find({ status: 'ACTIVE' });
    const providerStats = await Promise.all(
      providers.map(async (p) => {
        const custCount = await Customer.countDocuments({ providerId: p._id });
        const custs = await Customer.find({ providerId: p._id, status: 'ACTIVE' });
        const revenue = custs.reduce((acc, c) => acc + (c.monthlyAmount || 0), 0);

        const pendingBills = await Bill.find({
          providerId: p._id,
          status: { $in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
        });
        const pending = pendingBills.reduce((acc, b) => acc + (b.remainingAmount || 0), 0);

        return {
          name: p.name,
          code: p.code,
          color: p.color || '#2563eb',
          customers: custCount,
          revenue,
          pending
        };
      })
    );

    // Recent 5 payments
    const recentPayments = await Payment.find({ status: 'SUCCESS' })
      .populate('customerId', 'name phone connectionId')
      .populate('billId', 'billingMonthName billNumber')
      .sort({ paymentDate: -1 })
      .limit(5);

    // Recent pending bills
    const recentPendingBills = await Bill.find({ status: { $in: ['PENDING', 'PARTIAL', 'OVERDUE'] } })
      .populate('customerId', 'name phone connectionId')
      .populate('providerId', 'name color')
      .sort({ dueDate: 1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      metrics: {
        totalCustomers,
        activeConnections,
        totalMonthlyBilling,
        collectedAmount,
        pendingAmount,
        overdueAmount,
        totalBills,
        paidBillsCount,
        pendingBillsCount,
        overdueBillsCount
      },
      charts: {
        monthlyRevenue,
        dailyCollections,
        paidVsPending,
        providerStats
      },
      recentPayments,
      recentPendingBills
    });
  } catch (error) {
    next(error);
  }
};

// Collections breakdown by period (Today, This Week, This Month, Custom)
const getCollectionsReport = async (req, res, next) => {
  try {
    const { period = 'TODAY', startDate, endDate } = req.query;

    let start = new Date();
    let end = new Date();

    if (period === 'TODAY') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'WEEK') {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start = new Date(start.setDate(diff));
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'MONTH') {
      start = new Date(start.getFullYear(), start.getMonth(), 1, 0, 0, 0);
      end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
    } else if (period === 'CUSTOM' && startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }

    const payments = await Payment.find({
      status: 'SUCCESS',
      paymentDate: { $gte: start, $lte: end }
    })
      .populate('customerId', 'name phone connectionId address')
      .populate('billId', 'billNumber billingMonthName')
      .sort({ paymentDate: -1 });

    const total = payments.reduce((acc, p) => acc + p.amount, 0);
    const cash = payments.filter((p) => p.paymentMethod === 'CASH').reduce((s, p) => s + p.amount, 0);
    const upi = payments.filter((p) => p.paymentMethod === 'UPI').reduce((s, p) => s + p.amount, 0);
    const online = payments.filter((p) => p.paymentMethod === 'ONLINE').reduce((s, p) => s + p.amount, 0);
    const bank = payments.filter((p) => p.paymentMethod === 'BANK_TRANSFER').reduce((s, p) => s + p.amount, 0);

    return res.status(200).json({
      success: true,
      period,
      startDate: start,
      endDate: end,
      breakdown: {
        total,
        cash,
        upi,
        online,
        bank,
        transactionCount: payments.length
      },
      payments
    });
  } catch (error) {
    next(error);
  }
};

// Provider-wise breakdown report
const getProviderWiseReport = async (req, res, next) => {
  try {
    const providers = await Provider.find();

    const report = await Promise.all(
      providers.map(async (provider) => {
        const customersCount = await Customer.countDocuments({ providerId: provider._id });
        const activeCustomers = await Customer.find({ providerId: provider._id, status: 'ACTIVE' });
        const monthlyBilling = activeCustomers.reduce((acc, c) => acc + (c.monthlyAmount || 0), 0);

        const customerIds = (await Customer.find({ providerId: provider._id })).map((c) => c._id);

        const payments = await Payment.find({
          customerId: { $in: customerIds },
          status: 'SUCCESS'
        });
        const collected = payments.reduce((acc, p) => acc + p.amount, 0);

        const pendingBills = await Bill.find({
          providerId: provider._id,
          status: { $in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
        });
        const pending = pendingBills.reduce((acc, b) => acc + (b.remainingAmount || 0), 0);

        return {
          id: provider._id,
          providerName: provider.name,
          code: provider.code,
          customersCount,
          activeConnections: activeCustomers.length,
          monthlyBilling,
          collected,
          pending
        };
      })
    );

    return res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  getCollectionsReport,
  getProviderWiseReport
};
