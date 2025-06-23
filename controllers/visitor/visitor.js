const asyncHandler = require("express-async-handler");
const Company = require("../../models/company");
const response = require("../../utils/response");
const { visitor } = require("../../models/zindex");
const VisitorField = require("../../models/visitorField");

exports.createVisitorField = asyncHandler(async (req, res) => {
  const { label, fieldType, validation } = req.body;
  const companyId = req.user._id;

  if (!label) return response.badRequest("Label is required", res);

  if (fieldType === 'number') {
    const min = validation?.min;
    const max = validation?.max;
    if (min !== undefined && max !== undefined && min > max) {
      return response.badRequest("Min value cannot be greater than max value", res);
    }
  }

  const field = await VisitorField.create({
    label,
    fieldType,
    companyId,
    validation: fieldType === 'number' ? {
      min: validation?.min ?? undefined,
      max: validation?.max ?? undefined,
    } : undefined
  });

  return response.success("Field added successfully", field, res);
});

exports.getVisitorFields = asyncHandler(async (req, res) => {
  const companyId = req.user._id;

  const fields = await VisitorField.find({ companyId }).sort({ updatedAt: 1 });
  return response.success("Fields fetched", fields, res);
});
exports.getVisitorFormFields = asyncHandler(async (req, res) => {
  const {companyId} = req.params;

  const fields = await VisitorField.find({ companyId }).sort({ updatedAt: 1 });
  return response.success("Fields fetched", fields, res);
});

exports.updateVisitorField = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { label, fieldType, validation } = req.body;

  if (fieldType === 'number') {
    const min = validation?.min;
    const max = validation?.max;
    if (min !== undefined && max !== undefined && min > max) {
      return response.badRequest("Min value cannot be greater than max value", res);
    }
  }

  const updated = await VisitorField.findByIdAndUpdate(
    id,
    {
      label,
      fieldType,
      validation: fieldType === 'number' ? {
        min: validation?.min ?? undefined,
        max: validation?.max ?? undefined,
      } : undefined
    },
    { new: true }
  );

  return response.success("Field updated successfully", updated, res);
});

exports.deleteVisitorField = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await VisitorField.findByIdAndDelete(id);
  return response.success("Field deleted successfully", {}, res);
});





exports.createVisitor = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const formData = req.body;

  if (!companyId || !formData || Object.keys(formData).length === 0) {
    return response.forbidden("All Fields Are Required", res);
  }

  const newVisitor = await visitor.create({
    companyId,
    fields: formData
  });

  return response.success("Visitor Created Successfully", newVisitor, res);
});


exports.getCompanyVisitor = asyncHandler(async (req, res) => {
  const companyId = req.user._id;

  const visitors = await visitor.find({ companyId }).sort({ createdAt: -1 });

  return response.success("Visitors fetched successfully", visitors, res);
});


exports.getDashboardVisitor = asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const totalVisitors = await visitor.countDocuments({ companyId });
  const monthlyVisitors = await visitor.countDocuments({
    companyId,
    createdAt: { $gte: startOfMonth, $lt: endOfMonth }
  });

  res.status(200).json({
    status: true,
    message: "Visitor stats fetched",
    data: {
      totalVisitors,
      monthlyVisitors
    }
  });
});