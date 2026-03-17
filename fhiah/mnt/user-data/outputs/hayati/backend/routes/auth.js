const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, signToken } = require('../middleware/auth');

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar }
  });
};

// POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('الاسم مطلوب').isLength({ max: 50 }),
  body('email').isEmail().withMessage('بريد إلكتروني غير صالح').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('كلمة المرور لا تقل عن 6 أحرف')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'البريد الإلكتروني مسجل مسبقاً' });
    const user = await User.create({ name, email, password });
    sendToken(user, 201, res);
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في إنشاء الحساب' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('بريد إلكتروني غير صالح').normalizeEmail(),
  body('password').notEmpty().withMessage('كلمة المرور مطلوبة')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'بيانات تسجيل الدخول غير صحيحة' });
    }
    sendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في تسجيل الدخول' });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: { id: req.user._id, name: req.user.name, email: req.user.email, avatar: req.user.avatar } });
});

// PUT /api/auth/profile
router.put('/profile', protect, [
  body('name').optional().trim().notEmpty().isLength({ max: 50 })
], async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.avatar) updates.avatar = req.body.avatar;
    if (req.body.newPassword) {
      const user = await User.findById(req.user._id).select('+password');
      if (!(await user.comparePassword(req.body.currentPassword))) {
        return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
      }
      user.password = req.body.newPassword;
      await user.save();
    }
    const updated = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ success: true, user: { id: updated._id, name: updated.name, email: updated.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في تحديث الملف الشخصي' });
  }
});

module.exports = router;
