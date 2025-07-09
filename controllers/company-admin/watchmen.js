const Watchmen = require('../../models/watchmen');
const asyncHandler = require('express-async-handler');
const response = require('../../utils/response');
const { encrypt, decrypt } = require('../../utils/encryptor');

exports.createWatchmen = asyncHandler(async (req, res) => {
  const { name, mobile, password, companyId } = req.body;

  if (!name || !mobile || !password || !companyId) {
    return response.success("All Fields Are Required", null, res);
  }

  const exists = await Watchmen.findOne({ mobile, companyId });
  if (exists) {
    return response.success("Mobile number already exists", null, res);
  }

  const encryptedPassword = encrypt(password);

  const entryPoint = await Watchmen.create({
    name,
    mobile,
    password: encryptedPassword,
    companyId,
  });

  return response.success("Entry Point created successfully", entryPoint, res);
});

exports.getWatchmen = asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  const entryPoints = await Watchmen.find({ companyId });
  if (!entryPoints || entryPoints.length === 0) {
    return response.success("No entry points found", [], res);
  }

  const result = entryPoints.map(e => ({
    ...e.toObject(),
    password: decrypt(e.password),
  }));

  return response.success("Entry points fetched successfully", result, res);
});

exports.updateWatchmen= asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (!updates.name || !updates.mobile || !updates.password) {
    return response.success("All Fields Are Required", null, res);
  }

  const existing = await Watchmen.findById(id);
  if (!existing) return response.success("Entry Point not found", null, res);

  const mobileExists = await Watchmen.findOne({
    mobile: updates.mobile,
    _id: { $ne: id },
    companyId: existing.companyId,
  });

  if (mobileExists) {
    return response.success("Mobile number already exists", null, res);
  }

  updates.password = encrypt(updates.password);

  const updated = await Watchmen.findByIdAndUpdate(id, updates, { new: true });
  if (!updated) return response.success("Failed to update entry point", null, res);

  return response.success("Entry Point updated successfully", updated, res);
});

exports.deleteWatchmen = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const entryPoint = await Watchmen.findById(id);
  if (!entryPoint) return response.success("Entry Point not found", null, res);

  await Watchmen.findByIdAndDelete(id);
  return response.success("Entry Point deleted successfully", null, res);
});
