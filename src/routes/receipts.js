const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { auth } = require('../middleware/auth');

router.get('/', auth, receiptController.getAllReceipts);
router.get('/:id', auth, receiptController.getReceiptById);
router.get('/client/:clientId', auth, receiptController.getClientReceipts);

module.exports = router;
