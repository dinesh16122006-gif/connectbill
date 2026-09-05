const Customer = require('../models/Customer');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');

const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(200).json({
        success: true,
        results: { customers: [], bills: [], payments: [] }
      });
    }

    const query = q.trim();
    const regex = new RegExp(query, 'i');

    const [customers, bills, payments] = await Promise.all([
      Customer.find({
        $or: [{ name: regex }, { phone: regex }, { connectionId: regex }, { email: regex }]
      })
        .populate('providerId', 'name code color')
        .populate('planId', 'name speed')
        .limit(5),

      Bill.find({
        $or: [{ billNumber: regex }, { billingMonth: regex }, { billingMonthName: regex }]
      })
        .populate('customerId', 'name phone connectionId')
        .populate('providerId', 'name code')
        .limit(5),

      Payment.find({
        $or: [{ transactionId: regex }, { gatewayPaymentId: regex }, { gatewayOrderId: regex }]
      })
        .populate('customerId', 'name phone connectionId')
        .populate('billId', 'billNumber billingMonthName')
        .limit(5)
    ]);

    return res.status(200).json({
      success: true,
      query,
      results: {
        customers,
        bills,
        payments
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { globalSearch };
