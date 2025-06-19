const express = require('express')
const { createVisitor, getCompanyVisitor, getDashboardVisitor, createVisitorField, getVisitorFields, updateVisitorField, deleteVisitorField, getVisitorFormFields } = require('../controllers/visitor/visitor')
const { companyAuthToken } = require('../middlewares/authenticator')
const router = express.Router()

router.post("/visitor-fields", companyAuthToken, createVisitorField);
router.get("/visitor-fields", companyAuthToken, getVisitorFields);
router.put("/visitor-fields/:id", companyAuthToken, updateVisitorField);
router.delete("/visitor-fields/:id", companyAuthToken, deleteVisitorField);

router.get("/visitor-fields/form/:companyId", getVisitorFormFields);



router.post('/create/:companyId', createVisitor)

router.get('/company-visitor' , companyAuthToken ,getCompanyVisitor )

router.get('/dashboard/visitor/:companyId',companyAuthToken, getDashboardVisitor);

module.exports = router