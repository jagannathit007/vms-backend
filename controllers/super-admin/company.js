const asyncHandler = require("express-async-handler");
const Company = require("../../models/company");
const response = require("../../utils/response");
const { encrypt, decrypt } = require("../../utils/encryptor");
const fs = require("fs");
const path = require("path");
const { visitor } = require("../../models/zindex");
const visitorField = require("../../models/visitorField");

const deleteFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) console.error("Failed to delete image:", err);
  });
};

exports.createCompany = asyncHandler(async (req, res) => {
  const { name, email, password,mobile,pname,address, isActive } = req.body;
  const logo = req.file ? req.file.path : null;

  if(!name || !email || !password || !mobile || !pname || !address || !isActive){
    if (logo) deleteFile(logo);
    return response.success("All Fields Are Required",null,res)
  }
  if(!logo){
    return response.success("Logo image is Required",null,res)
  }

  const exists = await Company.findOne({ email });
  if (exists) {
    deleteFile(logo);
    return response.success("Email already exists",null, res);
  }
  
const encryptedPassword = encrypt(password);
  const company = await Company.create({
    name,
    logo,
    email,
    password: encryptedPassword,
    mobile,
    pname,
    address,
    isActive,
  });
  // 2. Insert 3 default visitor fields
  const defaultFields = [
    { label: 'Mobile No', fieldType: 'number', companyId: company._id,"validation":{min:10,max:10},position:1 },
    { label: 'Name', fieldType: 'text', companyId: company._id ,position:2},
    { label: 'Purpose', fieldType: 'textarea', companyId: company._id,position:3 }
  ];

  await visitorField.insertMany(defaultFields);
  return response.success("Company created successfully", company, res);
});

exports.updateCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  if(!updates.name || !updates.email || !updates.password || !updates.mobile || !updates.pname || !updates.address || !updates.isActive){
    if (req.file) deleteFile(req.file.path);
    return response.success("All Fields Are Required",null,res)
  }
  const existingCompany = await Company.findById(id);
  if (!existingCompany) {
    if (req.file) deleteFile(req.file.path);
    return response.success("Company not found.",null,res)
  }
  
  const emailExists = await Company.findOne({ email: updates.email, _id: { $ne: id } });
  if (emailExists) {
    if (req.file) deleteFile(req.file.path);
    return response.success("Email already exists.", null, res);
  }

  if (updates.password) {
    updates.password = encrypt(updates.password);
  }

  if (req.file) {
    if (existingCompany.logo) {
      deleteFile(existingCompany.logo);
    }
    updates.logo = req.file.path;
  } else {
    updates.logo = existingCompany.logo
  }

  const company = await Company.findByIdAndUpdate(id, updates, { new: true });
  if (!company) return response.success("Failed to update company.",null,res)

  return response.success("Company updated successfully", company, res);
});

exports.deleteCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const company = await Company.findById(id);
  if (!company) return response.notFound(res);

  if (company.logo) {
    deleteFile(company.logo);
  }

  const result = await Company.findByIdAndDelete(id);
  if (!result) return response.notFound(res);
  return response.success("Company deleted successfully", null, res);
});

exports.getAllCompany = asyncHandler(async (req,res) =>{
  const companies = await Company.find();
  if(!companies){
    return response.notFound(res)
  }
  const company = companies.map(c => ({
    ...c.toObject(),
    password: decrypt(c.password),
  }));
  return response.success("All companies fetched successfully", company, res)
});


exports.updateStatus = asyncHandler(async (req,res) => {
  const {companyId} = req.params;
  const company = await Company.findById(companyId);
  if (!company) return response.notFound(res);
  
  company.isActive = !company.isActive;
  await company.save();

  return response.success(`Company status updated to ${company.isActive ? 'Active' : 'Inactive'}`,company,res);
}) 

exports.getDashboardCompany = asyncHandler(async (req, res) => {
  const totalCompanies = await Company.countDocuments();
  const totalVisitor = await visitor.countDocuments();
  return response.success("Company stats fetched", {totalCompanies,totalVisitor}, res);
});

exports.updateCompanyProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (!updates.name || !updates.email || !updates.mobile || !updates.pname || !updates.address) {
    if (req.file) deleteFile(req.file.path);
    return response.success("All fields are required.", null, res);
  }

  const company = await Company.findById(id);
  if (!company) {
    if (req.file) deleteFile(req.file.path);
    return response.success("Company not found.", null, res);
  }

  const emailExists = await Company.findOne({ email: updates.email, _id: { $ne: id } });
  if (emailExists) {
    if (req.file) deleteFile(req.file.path);
    return response.success("Email already exists.", null, res);
  }

  if (req.file) {
    if (company.logo) {
      deleteFile(company.logo);
    }
    updates.logo = req.file.path;
  } else {
    updates.logo = company.logo;
  }

  delete updates.password;
  delete updates.isActive;

  const updatedCompany = await Company.findByIdAndUpdate(id, updates, { new: true });
  if (!updatedCompany) return response.success("Failed to update profile.", null, res);
  return response.success("Profile updated successfully", updatedCompany, res);
});

exports.UpdateCompanyPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return response.success("All fields are required.", null, res);
  }
  if (newPassword !== confirmPassword) {
    return response.success("New password and confirm password do not match.", null, res);
  }

  const company = await Company.findById(id);
  if (!company) return response.notFound(res);

  const decryptedPassword = decrypt(company.password);
  if (decryptedPassword !== currentPassword) {
    return response.success("Current password is incorrect.", null, res);
  }
  company.password = encrypt(newPassword);
  await company.save();

  return response.success("Password updated successfully", null, res);
});

exports.companyInfoVisit = asyncHandler(async (req,res) => {
  const {companyId} = req.params;

  const companyStatus = await Company.findById(companyId).select("isActive").lean();
    if (!companyStatus) {
      return response.success("Company not found!", null, res);
    }
    if (!companyStatus.isActive) {
      return response.success("Company is inactive!", null, res);
    }

  const company = await Company.findById(companyId).select("logo name");
    if (!company) {
      return response.success("User not found!", null, res);
    }

    return response.success("User found successfully!", company, res);
})
