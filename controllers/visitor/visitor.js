const asyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const Company = require("../../models/company");
const response = require("../../utils/response");
const { visitor } = require("../../models/zindex");
const VisitorField = require("../../models/visitorField");
const Otp = require('../../models/visitorOTP');
const sendSms = require('../../utils/sendSms');

exports.createVisitorField = asyncHandler(async (req, res) => {
  const { label, fieldType, validation, otpRequired,position ,companyId} = req.body;

  if (!label) return response.badRequest("Label is required", res);
  const lablecheck = await VisitorField.findOne({ companyId, label});
      if (lablecheck) {
        return response.success("Label already added",null,res);
      }

  if (fieldType === 'number') {
    const min = validation?.min;
    const max = validation?.max;
    if (min !== undefined && max !== undefined && min > max) {
      return response.badRequest("Min value cannot be greater than max value", res);
    }

    // ✅ Check if another OTP field already exists
    if (otpRequired) {
      const existingOtp = await VisitorField.findOne({ companyId, otpRequired: true });
      if (existingOtp) {
        return response.badRequest("An OTP field already exists. Only one is allowed.", res);
      }
    }
  }

  const field = await VisitorField.create({
    label,
    fieldType,
    companyId,
    validation: fieldType === 'number' ? {
      min: validation?.min ?? undefined,
      max: validation?.max ?? undefined,
    } : undefined,
    otpRequired: !!otpRequired,
    position: position || 1
  });

  return response.success("Field added successfully", field, res);
});

exports.getVisitorFields = asyncHandler(async (req, res) => {
  const { companyId } = req.query;
  const fields = await VisitorField.find({ companyId }).sort({ position: 1 });
  return response.success("Fields fetched", fields, res);
});
exports.getVisitorFormFields = asyncHandler(async (req, res) => {
  const {companyId} = req.params;
  const fields = await VisitorField.find({ companyId }).sort({ position: 1 });
  return response.success("Fields fetched", fields, res);
});

exports.updateVisitorField = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { label, fieldType, validation, otpRequired,position ,companyId} = req.body;

  if (!label) return response.badRequest("Label is required", res);

  // ✅ Update label in all existing visitors
  const field = await VisitorField.findById(id);
  if (!field) return response.notFound("Field not found", res);
  const oldLabel = field.label;

  const lablecheck = await VisitorField.findOne({ companyId, label});
      if (lablecheck && lablecheck._id.toString() !== id) {
        return response.success("Label already added",null,res);
      }

  if (fieldType === 'number') {
    const min = validation?.min;
    const max = validation?.max;
    if (min !== undefined && max !== undefined && min > max) {
      return response.badRequest("Min value cannot be greater than max value", res);
    }

    // ✅ Prevent assigning OTP to another field if one already exists
    if (otpRequired) {
      const existingOtp = await VisitorField.findOne({ 
        _id: { $ne: id }, 
        companyId, 
        otpRequired: true 
      });
      if (existingOtp) {
        return response.badRequest("An OTP field already exists. Only one is allowed.", res);
      }
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
      } : undefined,
      otpRequired: !!otpRequired,
      position: position || 1
    },
    { new: true }
  );

  // ✅ Update label in all existing visitors
  if (label !== oldLabel) {
    await visitor.updateMany(
      {
        companyId,
        [`fields.${oldLabel}`]: { $exists: true }
      },
      {
        $rename: {
          [`fields.${oldLabel}`]: `fields.${label}`
        }
      }
    );
  }

  return response.success("Field updated successfully", updated, res);
});

exports.deleteVisitorField = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await VisitorField.findByIdAndDelete(id);
  return response.success("Field deleted successfully", {}, res);
});


exports.createVisitor = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const formData = { ...req.body };

  if (!companyId || (Object.keys(formData).length === 0 && req.files.length === 0)) {
    return response.forbidden("All Fields Are Required", res);
  }
  // Map uploaded files to corresponding field labels
  if (req.files && req.files.length > 0) {
    req.files.forEach((file) => {
      formData[file.fieldname] = file.path; // This stores: "uploads/visitor-images/xxxx.png"
    });
  }

  const newVisitor = await visitor.create({companyId,fields: formData,});
  return response.success("Visitor Created Successfully", newVisitor, res);
});

exports.getCompanyVisitor = asyncHandler(async (req, res) => {
  const companyId = req.user._id;
  const visitors = await visitor.find({ companyId }).sort({ createdAt: -1 });
  const vfield = await VisitorField.find({ companyId }).sort({ position: 1 });

  const allowedLabels = vfield.map(field => field.label);
  const filteredVisitors = visitors.map(vis => {
    const filteredFields = {};

    for (const key in vis.fields) {
      if (allowedLabels.includes(key)) {
        filteredFields[key] = vis.fields[key];
      }
    }

    return {
      ...vis.toObject(),
      fields: filteredFields,
    };
  });
  return response.success("Visitors fetched successfully", filteredVisitors, res);
});

exports.getDashboardVisitor = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const totalVisitors = await visitor.countDocuments({ companyId });
  const monthlyVisitors = await visitor.countDocuments({companyId,createdAt: { $gte: startOfMonth, $lt: endOfMonth }});

  res.status(200).json({
    status: true,
    message: "Visitor stats fetched",
    data: {
      totalVisitors,
      monthlyVisitors
    }
  });
});


exports.sendOtp = asyncHandler(async (req, res) => {
  const { mobile, companyId } = req.body;
  if (!mobile || !companyId) return response.badRequest("Mobile number and Company ID required", res);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await Otp.findOneAndDelete({ mobile, companyId });
  await Otp.create({ mobile, otp, companyId });

  const smsSent = await sendSms(mobile, otp);
  if (!smsSent) {
    return response.badRequest("Failed to send OTP", res);
  }
  return response.success("OTP sent successfully", null, res);
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  const { mobile, otp, companyId } = req.body;

  const found = await Otp.findOne({ mobile, companyId });
  if (!found || found.otp !== otp) {
    return response.badRequest("Invalid or expired OTP", res);
  }

  await Otp.deleteOne({ _id: found._id }); // OTP one-time use
  return response.success("OTP verified successfully", null, res);
});


exports.getVisitorInfo = asyncHandler(async (req, res) => {
  const { companyId, label, number } = req.query;
  if (!companyId || !label || !number) {
    return response.badRequest("Missing required fields", res);
  }

  const visitorDetails = await visitor.findOne({
    companyId,
    $expr: {
      $eq: [`$fields.${label}`, number]
    }
  }).sort({ createdAt: -1 });;

  if (!visitorDetails) {
    return response.success("No visitor found", null, res);
  }
  return response.success("Visitor data fetched", visitorDetails.fields, res);
});
