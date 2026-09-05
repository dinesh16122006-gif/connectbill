const crypto = require('crypto');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const Receipt = require('../models/Receipt');
const Customer = require('../models/Customer');
const Notification = require('../models/Notification');
const Setting = require('../models/Setting');
const { razorpayInstance, isSimulate, keyId, verifySignature } = require('../config/razorpay');

// Helper to generate professional receipt numbers
const generateReceiptNumber = async (year = new Date().getFullYear()) => {
  const count = await Receipt.countDocuments();
  const settings = (await Setting.findOne()) || {};
  const prefix = settings.invoicePrefix || 'CB';
  return `${prefix}-REC-${year}-${String(count + 1).padStart(5, '0')}`;
};

// Create Payment Order (Razorpay)
const createPaymentOrder = async (req, res, next) => {
  try {
    const { billIds } = req.body;

    if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one bill to pay.'
      });
    }

    // Access control: If CUSTOMER, ensure all bills belong to them
    const customerFilter = { _id: { $in: billIds } };
    if (req.user.role === 'CUSTOMER') {
      customerFilter.customerId = req.customer._id;
    }

    const bills = await Bill.find(customerFilter);

    if (bills.length !== billIds.length) {
      return res.status(403).json({
        success: false,
        message: 'One or more selected bills do not belong to your account or could not be found.'
      });
    }

    // Verify bills have pending amounts
    const totalPayable = bills.reduce((sum, b) => {
      if (['PAID', 'CANCELLED'].includes(b.status)) return sum;
      return sum + (b.remainingAmount > 0 ? b.remainingAmount : b.totalAmount);
    }, 0);

    if (totalPayable <= 0) {
      return res.status(400).json({
        success: false,
        message: 'All selected bills are already paid.'
      });
    }

    const amountInPaise = Math.round(totalPayable * 100);
    const receiptRef = `rcpt_${Date.now()}`;

    let order = null;

    if (!isSimulate && razorpayInstance) {
      try {
        order = await razorpayInstance.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: receiptRef,
          notes: {
            billIds: billIds.join(','),
            customerId: bills[0].customerId.toString()
          }
        });
      } catch (rzpErr) {
        console.warn('[Razorpay] Live order creation failed, falling back to simulated order:', rzpErr.message);
      }
    }

    // Fallback or Simulation mode order object
    if (!order) {
      order = {
        id: `order_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        entity: 'order',
        amount: amountInPaise,
        amount_paid: 0,
        amount_due: amountInPaise,
        currency: 'INR',
        receipt: receiptRef,
        status: 'created',
        simulated: true
      };
    }

    return res.status(200).json({
      success: true,
      order,
      amount: totalPayable,
      currency: 'INR',
      keyId,
      billIds,
      isSimulate: order.simulated || isSimulate
    });
  } catch (error) {
    next(error);
  }
};

// Verify Payment & Process Settlement
const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      billIds,
      paymentMethod = 'ONLINE'
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification parameters missing (order_id, payment_id, signature are required).'
      });
    }

    // 1. Verify payment signature on the backend
    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Cryptographic signature verification failed. Payment cannot be verified.'
      });
    }

    // 2. Idempotency check: Ensure payment was not already recorded
    const existingPayment = await Payment.findOne({ gatewayPaymentId: razorpay_payment_id });
    if (existingPayment) {
      const receipt = await Receipt.findOne({ paymentId: existingPayment._id });
      return res.status(200).json({
        success: true,
        message: 'Payment was already processed successfully.',
        payment: existingPayment,
        receipt
      });
    }

    // 3. Find the bills to settle
    const bills = await Bill.find({ _id: { $in: billIds } }).populate('customerId');
    if (!bills.length) {
      return res.status(404).json({ success: false, message: 'Bills not found.' });
    }

    const customer = bills[0].customerId;
    const processedPayments = [];
    const generatedReceipts = [];

    // 4. Update each bill and record payments
    for (const bill of bills) {
      if (bill.status === 'PAID') continue;

      const settleAmount = bill.remainingAmount > 0 ? bill.remainingAmount : bill.totalAmount;
      bill.paidAmount = bill.totalAmount;
      bill.remainingAmount = 0;
      bill.status = 'PAID';
      await bill.save();

      const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const payment = await Payment.create({
        customerId: customer._id,
        billId: bill._id,
        amount: settleAmount,
        paymentMethod: paymentMethod.toUpperCase(),
        gateway: 'RAZORPAY',
        gatewayOrderId: razorpay_order_id,
        gatewayPaymentId: razorpay_payment_id,
        transactionId,
        status: 'SUCCESS',
        paymentDate: new Date(),
        notes: `Online payment via Razorpay (${paymentMethod})`,
        recordedBy: 'CUSTOMER_ONLINE'
      });

      const receiptNumber = await generateReceiptNumber();
      const receipt = await Receipt.create({
        paymentId: payment._id,
        billId: bill._id,
        customerId: customer._id,
        receiptNumber,
        receiptDate: new Date()
      });

      processedPayments.push(payment);
      generatedReceipts.push(receipt);

      // Customer notification
      await Notification.create({
        customerId: customer._id,
        targetRole: 'CUSTOMER',
        title: 'Payment Received Successfully',
        message: `Your payment of ₹${settleAmount} for ${bill.billingMonthName} has been received. Receipt #${receiptNumber} generated.`,
        type: 'PAYMENT'
      });
    }

    // Admin notification
    await Notification.create({
      targetRole: 'ADMIN',
      title: 'Online Payment Received',
      message: `Customer ${customer.name} paid ₹${processedPayments.reduce((s, p) => s + p.amount, 0)} online via ${paymentMethod}.`,
      type: 'PAYMENT'
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified and settled successfully.',
      payments: processedPayments,
      receipts: generatedReceipts,
      primaryReceipt: generatedReceipts[0] || null
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Record Manual Cash / Counter Payment
const recordCashPayment = async (req, res, next) => {
  try {
    const {
      billId,
      customerId,
      amount,
      paymentMethod = 'CASH',
      paymentDate = new Date(),
      notes
    } = req.body;

    if (!billId || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Bill and valid payment amount greater than zero are required.'
      });
    }

    const bill = await Bill.findById(billId).populate('customerId');
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found.' });
    }

    const custId = customerId || bill.customerId._id;
    const customer = await Customer.findById(custId);

    const payAmount = Number(amount);
    const prevPaid = bill.paidAmount || 0;
    const newPaid = prevPaid + payAmount;
    const newRemaining = Math.max(0, bill.totalAmount - newPaid);

    // Update bill
    bill.paidAmount = newPaid;
    bill.remainingAmount = newRemaining;

    if (newRemaining === 0) {
      bill.status = 'PAID';
    } else {
      bill.status = 'PARTIAL';
    }

    await bill.save();

    const transactionId = `MAN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create payment record
    const payment = await Payment.create({
      customerId: custId,
      billId: bill._id,
      amount: payAmount,
      paymentMethod: paymentMethod.toUpperCase(),
      gateway: 'MANUAL',
      transactionId,
      status: 'SUCCESS',
      paymentDate: new Date(paymentDate),
      notes: notes || `Recorded by Admin at counter (${paymentMethod})`,
      recordedBy: 'ADMIN'
    });

    // Create receipt
    const receiptNumber = await generateReceiptNumber();
    const receipt = await Receipt.create({
      paymentId: payment._id,
      billId: bill._id,
      customerId: custId,
      receiptNumber,
      receiptDate: new Date()
    });

    // Customer notification
    await Notification.create({
      customerId: custId,
      targetRole: 'CUSTOMER',
      title: 'Payment Received',
      message: `${paymentMethod} payment of ₹${payAmount} received for ${bill.billingMonthName}. Balance: ₹${newRemaining}. Receipt #${receiptNumber}.`,
      type: 'PAYMENT'
    });

    return res.status(201).json({
      success: true,
      message: `Payment of ₹${payAmount} recorded successfully. Status: ${bill.status}`,
      bill,
      payment,
      receipt
    });
  } catch (error) {
    next(error);
  }
};

// Razorpay Webhook Endpoint
const handleWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (expectedSignature !== signature) {
        return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
      }
    }

    const event = req.body.event;
    console.log(`[Razorpay Webhook] Received event: ${event}`);

    if (event === 'payment.captured') {
      const paymentEntity = req.body.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      // Check if already processed
      const existing = await Payment.findOne({ gatewayPaymentId: paymentId });
      if (!existing && paymentEntity.notes && paymentEntity.notes.billIds) {
        const billIds = paymentEntity.notes.billIds.split(',');
        const bills = await Bill.find({ _id: { $in: billIds } });

        for (const bill of bills) {
          if (bill.status !== 'PAID') {
            bill.paidAmount = bill.totalAmount;
            bill.remainingAmount = 0;
            bill.status = 'PAID';
            await bill.save();

            const p = await Payment.create({
              customerId: bill.customerId,
              billId: bill._id,
              amount: bill.totalAmount,
              paymentMethod: (paymentEntity.method || 'ONLINE').toUpperCase(),
              gateway: 'RAZORPAY',
              gatewayOrderId: orderId,
              gatewayPaymentId: paymentId,
              transactionId: `TXN-WH-${Date.now()}`,
              status: 'SUCCESS',
              notes: 'Settled via Razorpay Webhook'
            });

            const receiptNumber = await generateReceiptNumber();
            await Receipt.create({
              paymentId: p._id,
              billId: bill._id,
              customerId: bill.customerId,
              receiptNumber
            });
          }
        }
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[Razorpay Webhook Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Payments Audit Log
const getPayments = async (req, res, next) => {
  try {
    const {
      customerId,
      paymentMethod,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const filter = {};

    if (req.user.role === 'CUSTOMER') {
      filter.customerId = req.customer._id;
    } else if (customerId && customerId !== 'ALL') {
      filter.customerId = customerId;
    }

    if (paymentMethod && paymentMethod !== 'ALL') {
      filter.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.paymentDate.$lte = end;
      }
    }

    const payments = await Payment.find(filter)
      .populate('customerId', 'name phone connectionId email address')
      .populate('billId', 'billNumber billingMonth billingMonthName totalAmount status')
      .sort({ paymentDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Attach receipt numbers
    const paymentsWithReceipts = await Promise.all(
      payments.map(async (payment) => {
        const receipt = await Receipt.findOne({ paymentId: payment._id });
        return {
          ...payment.toObject(),
          receiptNumber: receipt ? receipt.receiptNumber : null,
          receiptId: receipt ? receipt._id : null
        };
      })
    );

    let finalResults = paymentsWithReceipts;
    if (search && search.trim() !== '') {
      const s = search.toLowerCase();
      finalResults = finalResults.filter(
        (p) =>
          (p.transactionId && p.transactionId.toLowerCase().includes(s)) ||
          (p.receiptNumber && p.receiptNumber.toLowerCase().includes(s)) ||
          (p.customerId && p.customerId.name && p.customerId.name.toLowerCase().includes(s)) ||
          (p.customerId && p.customerId.phone && p.customerId.phone.includes(s)) ||
          (p.billId && p.billId.billNumber && p.billId.billNumber.toLowerCase().includes(s))
      );
    }

    const total = await Payment.countDocuments(filter);

    return res.status(200).json({
      success: true,
      total,
      count: finalResults.length,
      payments: finalResults
    });
  } catch (error) {
    next(error);
  }
};

// Get Receipt Details for Printing/PDF
const getReceipt = async (req, res, next) => {
  try {
    const { id } = req.params; // Can be receiptId, paymentId, or billId

    let receipt = await Receipt.findById(id)
      .populate('paymentId')
      .populate({
        path: 'billId',
        populate: { path: 'providerId' }
      })
      .populate({
        path: 'customerId',
        populate: [{ path: 'providerId' }, { path: 'planId' }]
      });

    if (!receipt) {
      receipt = await Receipt.findOne({ paymentId: id })
        .populate('paymentId')
        .populate({
          path: 'billId',
          populate: { path: 'providerId' }
        })
        .populate({
          path: 'customerId',
          populate: [{ path: 'providerId' }, { path: 'planId' }]
        });
    }

    if (!receipt) {
      receipt = await Receipt.findOne({ billId: id })
        .populate('paymentId')
        .populate({
          path: 'billId',
          populate: { path: 'providerId' }
        })
        .populate({
          path: 'customerId',
          populate: [{ path: 'providerId' }, { path: 'planId' }]
        });
    }

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found.' });
    }

    // Access control
    if (req.user.role === 'CUSTOMER' && receipt.customerId._id.toString() !== req.customer._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const settings = (await Setting.findOne()) || {};

    return res.status(200).json({
      success: true,
      receipt,
      business: settings
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  recordCashPayment,
  handleWebhook,
  getPayments,
  getReceipt
};
