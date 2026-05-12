const { Package } = require('../models/Package.model');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.getPackages = async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true }).sort({ basePrice: 1 });
    successResponse(res, packages);
  } catch (err) { errorResponse(res, err.message); }
};

exports.getAllPackages = async (req, res) => {
  try {
    const packages = await Package.find().sort({ basePrice: 1 });
    successResponse(res, packages);
  } catch (err) { errorResponse(res, err.message); }
};

exports.createPackage = async (req, res) => {
  try {
    const pkg = await Package.create(req.body);
    successResponse(res, pkg, 'Package created', 201);
  } catch (err) { errorResponse(res, err.message); }
};

exports.updatePackage = async (req, res) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!pkg) return errorResponse(res, 'Package not found', 404);
    successResponse(res, pkg, 'Package updated');
  } catch (err) { errorResponse(res, err.message); }
};

exports.deletePackage = async (req, res) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!pkg) return errorResponse(res, 'Package not found', 404);
    successResponse(res, null, 'Package deactivated');
  } catch (err) { errorResponse(res, err.message); }
};
