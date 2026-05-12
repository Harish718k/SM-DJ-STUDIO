const User = require('../models/User.model');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Helper to send token response
const sendTokenResponse = (user, statusCode, res, message) => {
  const token = user.getSignedJwt();
  successResponse(res, {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profilePicture: user.profilePicture || null
    }
  }, message, statusCode);
};

// @desc    Register client
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return errorResponse(res, 'Email already registered', 400);
    const user = await User.create({ name, email, password, phone, role: 'client' });
    sendTokenResponse(user, 201, res, 'Registration successful');
  } catch (err) {
    errorResponse(res, err.message);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return errorResponse(res, 'Please provide email and password', 400);
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) return errorResponse(res, 'Invalid credentials', 401);
    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (err) {
    errorResponse(res, err.message);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    successResponse(res, {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profilePicture: user.profilePicture || null
    });
  } catch (err) {
    errorResponse(res, err.message);
  }
};

// @desc    Update profile (name, phone, profilePicture)
// @route   PUT /api/auth/me
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {};
    if (req.body.name)           fieldsToUpdate.name = req.body.name;
    if (req.body.phone !== undefined) fieldsToUpdate.phone = req.body.phone;
    if (req.body.profilePicture !== undefined) fieldsToUpdate.profilePicture = req.body.profilePicture;

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, { new: true, runValidators: true });
    successResponse(res, {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profilePicture: user.profilePicture || null
    }, 'Profile updated');
  } catch (err) {
    errorResponse(res, err.message);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return errorResponse(res, 'Please provide current and new password', 400);
    if (newPassword.length < 6) return errorResponse(res, 'New password must be at least 6 characters', 400);

    const user = await User.findById(req.user.id).select('+password');
    if (!(await user.matchPassword(currentPassword))) return errorResponse(res, 'Current password is incorrect', 401);

    user.password = newPassword;
    await user.save();  // triggers bcrypt pre-save hook
    successResponse(res, null, 'Password changed successfully');
  } catch (err) {
    errorResponse(res, err.message);
  }
};
