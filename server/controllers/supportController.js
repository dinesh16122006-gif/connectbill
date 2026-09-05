const SupportTicket = require('../models/SupportTicket');
const Notification = require('../models/Notification');

const submitTicket = async (req, res, next) => {
  try {
    const { name, phone, issue, message } = req.body;

    if (!name || !phone || !issue || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, issue category, and message are required.'
      });
    }

    const ticket = await SupportTicket.create({
      customerId: req.customer ? req.customer._id : undefined,
      name: name.trim(),
      phone: phone.trim(),
      issue: issue.trim(),
      message: message.trim(),
      status: 'OPEN'
    });

    // Notify Admin
    await Notification.create({
      targetRole: 'ADMIN',
      title: 'New Support Request',
      message: `${name} (${phone}) submitted an issue regarding "${issue}".`,
      type: 'SUPPORT'
    });

    return res.status(201).json({
      success: true,
      message: 'Support request submitted successfully. Our team will contact you shortly.',
      ticket
    });
  } catch (error) {
    next(error);
  }
};

const getTickets = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const tickets = await SupportTicket.find(filter)
      .populate('customerId', 'name phone connectionId address')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tickets.length,
      tickets
    });
  } catch (error) {
    next(error);
  }
};

const updateTicketStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    if (status) ticket.status = status;
    if (adminNotes !== undefined) ticket.adminNotes = adminNotes;

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: 'Support ticket updated.',
      ticket
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitTicket,
  getTickets,
  updateTicketStatus
};
