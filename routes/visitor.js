const express = require('express')
const { createVisitor, getCompanyVisitor, getDashboardVisitor, createVisitorField, getVisitorFields, updateVisitorField, deleteVisitorField, getVisitorFormFields, sendOtp, verifyOtp, getLatestVisitor, getVisitorInfo } = require('../controllers/visitor/visitor')
const { companyAuthToken, superAdminAuthToken } = require('../middlewares/authenticator');
const visitorUpload = require('../utils/visitorUpload');
const router = express.Router()

router.post("/visitor-fields", superAdminAuthToken, createVisitorField);
router.get("/visitor-fields", superAdminAuthToken, getVisitorFields);
router.put("/visitor-fields/:id", superAdminAuthToken, updateVisitorField);
router.delete("/visitor-fields/:id", superAdminAuthToken, deleteVisitorField);
router.get("/visitor-fields/form/:companyId", getVisitorFormFields);


router.post("/create/:companyId", visitorUpload.any(), createVisitor);
router.get('/company-visitor' , companyAuthToken ,getCompanyVisitor )
router.get('/dashboard/visitor/:companyId',companyAuthToken, getDashboardVisitor);


router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);

router.get("/info", getVisitorInfo);

module.exports = router