const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/tasks?date=YYYY-MM-DD&type=شهري
router.get('/', async (req, res) => {
  try {
    const { date, type, completed } = req.query;
    const filter = { user: req.user._id };
    if (date) filter.date = date;
    if (type) filter.type = type;
    if (completed !== undefined) filter.completed = completed === 'true';
    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في جلب المهام' });
  }
});

// GET /api/tasks/monthly?month=2024-01
router.get('/monthly', async (req, res) => {
  try {
    const { month } = req.query; // e.g. 2024-01
    const tasks = await Task.find({
      user: req.user._id,
      type: 'شهري',
      date: { $regex: `^${month}` }
    }).sort({ dueDate: 1 });
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في جلب المهام الشهرية' });
  }
});

// POST /api/tasks
router.post('/', [
  body('title').trim().notEmpty().withMessage('عنوان المهمة مطلوب'),
  body('date').notEmpty().withMessage('التاريخ مطلوب'),
  body('type').optional().isIn(['يومي', 'أسبوعي', 'شهري', 'مرة واحدة'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  try {
    const task = await Task.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في إنشاء المهمة' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  try {
    if (req.body.completed === true) req.body.completedAt = new Date();
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body, { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ success: false, message: 'المهمة غير موجودة' });
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في تحديث المهمة' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'المهمة غير موجودة' });
    res.json({ success: true, message: 'تم حذف المهمة' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في حذف المهمة' });
  }
});

module.exports = router;
