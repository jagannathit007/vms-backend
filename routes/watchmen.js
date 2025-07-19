const express = require('express');
const router = express.Router();
const watchmenController = require('../controllers/company-admin/watchmen');
const { companyAuthToken } = require('../middlewares/authenticator');

router.post('/create',companyAuthToken, watchmenController.createWatchmen);
router.get('/company/:companyId',companyAuthToken, watchmenController.getWatchmen);
router.put('/update/:id',companyAuthToken, watchmenController.updateWatchmen);
router.delete('/delete/:id',companyAuthToken, watchmenController.deleteWatchmen);

router.post('/signin', watchmenController.signInWatchmen);

module.exports = router;
