// routes/memberRoutes.js
const express = require('express');
const router = express.Router();
const memberController = require('../controllers/company-admin/member');
const { companyAuthToken } = require('../middlewares/authenticator');

router.post('/create',companyAuthToken, memberController.createMember);
router.get('/company/:companyId',companyAuthToken, memberController.getMembers);
router.put('/update/:id',companyAuthToken, memberController.updateMember);
router.delete('/delete/:id',companyAuthToken, memberController.deleteMember);

module.exports = router;
