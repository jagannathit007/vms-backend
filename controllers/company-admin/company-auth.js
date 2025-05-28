const response = require("../../utils/response");
const helpers = require("../../utils/helpers");
const { decrypt } = require("../../utils/encryptor");
const asyncHandler = require("express-async-handler");
const models = require("../../models/zindex");

exports.signInCompany = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return response.forbidden("All fields are required", res);
  }

  let company = await models.company.findOne({ email }).lean();
  if (!company) {
    return response.success("Invalid credentials!", null, res);
  }

  let encryptedPassword = company.password;
  let plainTextPassword = decrypt(encryptedPassword);

  if (plainTextPassword !== password) {
    return response.success("Invalid credentials!", null, res);
  }
  if (!company.isActive) {
    return response.success("Your account is not activated yet!", null ,res);
  }

  const token = helpers.generateToken({ id: String(company._id), type: "company" });

  return response.success("Company login successfully!", {token,company}, res);
});


exports.verifyCompany = asyncHandler(async (req, res) => {
  try {
   const userId = req.token.id;
  // Find the user
  const user = await models.company.findById(userId);
  if (!user) {
    return response.success("User not found!", null, res);
  }
  if (!user.isActive) {
    return response.forbidden("Your account is not activated yet!", res);
  }
  return response.success("User found!", user, res);
  } catch (error) {
    return response.forbidden("Invalid or expired token", res);
  }
});