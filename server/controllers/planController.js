const Plan = require('../models/Plan');

const getPlans = async (req, res, next) => {
  try {
    const { providerId, status } = req.query;
    const filter = {};

    if (providerId && providerId !== 'ALL') {
      filter.providerId = providerId;
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const plans = await Plan.find(filter)
      .populate('providerId', 'name code color')
      .sort({ monthlyPrice: 1 });

    return res.status(200).json({
      success: true,
      count: plans.length,
      plans
    });
  } catch (error) {
    next(error);
  }
};

const createPlan = async (req, res, next) => {
  try {
    const { providerId, name, speed, monthlyPrice, description, type } = req.body;

    if (!providerId || !name || !speed || monthlyPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Provider, plan name, speed, and monthly price are required.'
      });
    }

    const plan = await Plan.create({
      providerId,
      name: name.trim(),
      speed: speed.trim(),
      monthlyPrice: Number(monthlyPrice),
      description: description ? description.trim() : undefined,
      type: type || 'FIBER',
      status: 'ACTIVE'
    });

    return res.status(201).json({
      success: true,
      message: 'Plan created successfully.',
      plan
    });
  } catch (error) {
    next(error);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, speed, monthlyPrice, description, type, status, providerId } = req.body;

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found.'
      });
    }

    if (name) plan.name = name.trim();
    if (speed) plan.speed = speed.trim();
    if (monthlyPrice !== undefined) plan.monthlyPrice = Number(monthlyPrice);
    if (description !== undefined) plan.description = description;
    if (type) plan.type = type;
    if (status) plan.status = status;
    if (providerId) plan.providerId = providerId;

    await plan.save();

    return res.status(200).json({
      success: true,
      message: 'Plan updated successfully.',
      plan
    });
  } catch (error) {
    next(error);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await Plan.findById(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found.'
      });
    }

    plan.status = 'INACTIVE';
    await plan.save();

    return res.status(200).json({
      success: true,
      message: 'Plan marked inactive.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan
};
