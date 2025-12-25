const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { auth } = require('../middleware/auth');

router.get('/', auth, subscriptionController.getSubscription);
router.put('/', auth, subscriptionController.updateSubscription);
router.get('/can-add-client', auth, subscriptionController.canAddClient);

module.exports = router;
