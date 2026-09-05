const Setting = require('../models/Setting');

const getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    return res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const {
      businessName,
      businessLogo,
      businessAddress,
      phone,
      email,
      upiId,
      invoicePrefix,
      defaultDueDay,
      lateFeeAmount,
      workingHours
    } = req.body;

    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }

    if (businessName) settings.businessName = businessName.trim();
    if (businessLogo !== undefined) settings.businessLogo = businessLogo;
    if (businessAddress) settings.businessAddress = businessAddress.trim();
    if (phone) settings.phone = phone.trim();
    if (email) settings.email = email.trim();
    if (upiId) settings.upiId = upiId.trim();
    if (invoicePrefix) settings.invoicePrefix = invoicePrefix.trim().toUpperCase();
    if (defaultDueDay !== undefined) settings.defaultDueDay = Number(defaultDueDay);
    if (lateFeeAmount !== undefined) settings.lateFeeAmount = Number(lateFeeAmount);
    if (workingHours) settings.workingHours = workingHours.trim();

    await settings.save();

    return res.status(200).json({
      success: true,
      message: 'Business settings updated successfully.',
      settings
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings
};
