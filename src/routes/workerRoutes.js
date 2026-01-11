const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const { auth, authorize } = require('../middleware/auth');

// All routes require Owner authentication
router.use(auth);
router.use(authorize('owner'));

// POST /api/workers - Add a new worker
router.post('/', workerController.addWorker);

// GET /api/workers - List all workers
router.get('/', workerController.getWorkers);

// DELETE /api/workers/:id - Delete a worker
router.delete('/:id', workerController.deleteWorker);

module.exports = router;
