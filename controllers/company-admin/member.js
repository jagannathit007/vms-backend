// controllers/memberController.js
const Member = require('../../models/member');
const asyncHandler = require('express-async-handler');
const response = require('../../utils/response');
const {encrypt, decrypt} = require('../../utils/encryptor');

exports.createMember = asyncHandler(async (req, res) => {
  const { name, email, password, companyId } = req.body;
  if (!name || !email || !password || !companyId) {
    return response.success("All Fields Are Required", null, res);
  }
   const exists = await Member.findOne({ email, companyId });
  if (exists) {
    return response.success("Email already exists", null, res);
  }
  const encryptedPassword = encrypt(password);
  const member = await Member.create({ name, email, password:encryptedPassword, companyId });

 return response.success("Member created successfully", member, res);
});

exports.getMembers = asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  const members = await Member.find({ companyId });
  if (!members || members.length === 0) {
    return response.success("No members found", [], res);
  }

  const memberList = members.map(m => ({
    ...m.toObject(),
    password: decrypt(m.password)
  }));

  return response.success("Members fetched successfully", memberList, res);
});

exports.updateMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (!updates.name || !updates.email || !updates.password) {
    return response.success("All Fields Are Required", null, res);
  }

  const existing = await Member.findById(id);
  if (!existing) return response.success("Member not found", null, res);

  const emailExists = await Member.findOne({ email: updates.email, _id: { $ne: id }, companyId: existing.companyId });
  if (emailExists) {
    return response.success("Email already exists", null, res);
  }

  updates.password = encrypt(updates.password);

  const updated = await Member.findByIdAndUpdate(id, updates, { new: true });
  if (!updated) return response.success("Failed to update member", null, res);

  return response.success("Member updated successfully", updated, res);
});

exports.deleteMember = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const member = await Member.findById(id);
  if (!member) return response.success("Member not found", null, res);

  await Member.findByIdAndDelete(id);
  return response.success("Member deleted successfully", null, res);
});
