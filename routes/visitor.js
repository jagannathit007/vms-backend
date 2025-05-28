const express = require('express')
const { createVisitor, getCompanyVisitor, getDashboardVisitor } = require('../controllers/visitor/visitor')
const { companyAuthToken } = require('../middlewares/authenticator')
const router = express.Router()

router.post('/create/:companyId', createVisitor)

router.get('/company-visitor' , companyAuthToken ,getCompanyVisitor )

router.get('/dashboard/visitor/:companyId',companyAuthToken, getDashboardVisitor);

module.exports = router