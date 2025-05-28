const asyncHandler = require("express-async-handler");
const Company = require("../../models/company");
const response = require("../../utils/response");
const { visitor } = require("../../models/zindex");

exports.createVisitor = asyncHandler(async (req,res) => {
    const {name , number , purpose} = req.body;
    const {companyId} = req.params;
    if(!name || !number || !purpose){
        return response.forbidden("All Fields Are Required")
    }

    const visitors = await visitor.create({
        name,
        number,
        purpose,
        companyId
    })

    return response.success("Visitor Created Successfully", visitors , res);
})


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