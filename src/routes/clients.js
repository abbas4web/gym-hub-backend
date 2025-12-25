const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { auth } = require('../middleware/auth');

router.get('/', auth, clientController.getAllClients);
router.post('/', auth, clientController.addClient);
router.put('/:id', auth, clientController.updateClient);
router.delete('/:id', auth, clientController.deleteClient);
router.post('/:id/renew', auth, clientController.renewMembership);

module.exports = router;
