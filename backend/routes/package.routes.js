const express = require('express');
const router = express.Router();
const { getPackages, getAllPackages, createPackage, updatePackage, deletePackage } = require('../controllers/package.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', getPackages);
router.get('/all', protect, authorize('admin'), getAllPackages);
router.post('/', protect, authorize('admin'), createPackage);
router.put('/:id', protect, authorize('admin'), updatePackage);
router.delete('/:id', protect, authorize('admin'), deletePackage);

module.exports = router;
