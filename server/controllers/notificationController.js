const Notification = require('../models/Notification');
const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const { sendReminder } = require('../services/reminderService');

const getNotifications = async (req, res, next) => {
  try {
    const filter = {};

    if (req.user.role === 'ADMIN') {
      filter.targetRole = 'ADMIN';
    } else if (req.user.role === 'CUSTOMER') {
      filter.targetRole = 'CUSTOMER';
      filter.customerId = req.customer._id;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ ...filter, read: false });

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { read: true });
    return res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'ADMIN') {
      filter.targetRole = 'ADMIN';
    } else if (req.user.role === 'CUSTOMER') {
      filter.targetRole = 'CUSTOMER';
      filter.customerId = req.customer._id;
    }

    await Notification.updateMany(filter, { read: true });
    return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

// Admin: Send reminder to customer for a pending bill
const sendCustomerReminder = async (req, res, next) => {
  try {
    const { billId, channel = 'ALL' } = req.body;

    if (!billId) {
      return res.status(400).json({ success: false, message: 'Bill ID is required.' });
    }

    const bill = await Bill.findById(billId).populate('customerId');
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found.' });
    }

    const customer = bill.customerId;
    const result = await sendReminder({ customer, bill, channel });

    return res.status(200).json({
      success: true,
      message: `Reminder generated for ${customer.name}.`,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  sendCustomerReminder
};
