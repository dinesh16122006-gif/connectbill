const Connection = require('../models/Connection');
const Customer = require('../models/Customer');

const getConnections = async (req, res, next) => {
  try {
    const { status, providerId, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (providerId && providerId !== 'ALL') {
      filter.providerId = providerId;
    }

    let connections = await Connection.find(filter)
      .populate('customerId', 'name phone email address area connectionId')
      .populate('providerId', 'name code color')
      .populate('planId', 'name speed monthlyPrice')
      .sort({ createdAt: -1 });

    if (search && search.trim() !== '') {
      const s = search.toLowerCase();
      connections = connections.filter(
        (c) =>
          (c.connectionNumber && c.connectionNumber.toLowerCase().includes(s)) ||
          (c.customerId && c.customerId.name && c.customerId.name.toLowerCase().includes(s)) ||
          (c.customerId && c.customerId.phone && c.customerId.phone.includes(s))
      );
    }

    return res.status(200).json({
      success: true,
      count: connections.length,
      connections
    });
  } catch (error) {
    next(error);
  }
};

const updateConnectionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'SUSPENDED', 'DISCONNECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be ACTIVE, SUSPENDED, or DISCONNECTED.'
      });
    }

    const connection = await Connection.findById(id);
    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found.'
      });
    }

    connection.status = status;
    await connection.save();

    // Also update Customer status
    const customerStatus = status === 'DISCONNECTED' ? 'INACTIVE' : 'ACTIVE';
    await Customer.findByIdAndUpdate(connection.customerId, { status: customerStatus });

    return res.status(200).json({
      success: true,
      message: `Connection status updated to ${status}.`,
      connection
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConnections,
  updateConnectionStatus
};
