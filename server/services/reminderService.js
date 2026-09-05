const Notification = require('../models/Notification');
const Setting = require('../models/Setting');

const formatReminderMessage = ({ customerName, monthName, amount, dueDate, connectionId, businessName, payUrl }) => {
  const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Due Soon';

  return `Dear ${customerName}, your ${monthName} bill of ₹${amount} for Connection ID ${connectionId} is pending. Please make the payment before ${formattedDueDate} to ensure uninterrupted service. Pay online at: ${payUrl} - ${businessName || 'ConnectBill'}`;
};

const sendReminder = async ({ customer, bill, channel = 'ALL' }) => {
  const settings = (await Setting.findOne()) || {};
  const businessName = settings.businessName || 'ConnectBill';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const payUrl = `${frontendUrl}/customer/bills`;

  const messageText = formatReminderMessage({
    customerName: customer.name,
    monthName: bill.billingMonthName || bill.billingMonth,
    amount: bill.remainingAmount || bill.totalAmount,
    dueDate: bill.dueDate,
    connectionId: customer.connectionId,
    businessName,
    payUrl
  });

  const sanitizedPhone = customer.phone.replace(/\D/g, '').slice(-10);
  const whatsappLink = `https://wa.me/91${sanitizedPhone}?text=${encodeURIComponent(messageText)}`;
  const smsLink = `sms:+91${sanitizedPhone}?body=${encodeURIComponent(messageText)}`;
  const mailSubject = `Payment Reminder: ${bill.billingMonthName} Bill for Connection ${customer.connectionId}`;
  const mailLink = customer.email ? `mailto:${customer.email}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(messageText)}` : null;

  // Log in notifications
  const notification = await Notification.create({
    customerId: customer._id,
    targetRole: 'CUSTOMER',
    title: `Payment Reminder - ${bill.billingMonthName}`,
    message: messageText,
    type: 'REMINDER'
  });

  console.log(`[Reminder Service] Reminder created for ${customer.name} (${customer.phone}) via ${channel}`);

  return {
    success: true,
    customerName: customer.name,
    phone: customer.phone,
    email: customer.email,
    messageText,
    whatsappLink,
    smsLink,
    mailLink,
    notificationId: notification._id
  };
};

module.exports = {
  formatReminderMessage,
  sendReminder
};
