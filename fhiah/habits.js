const express = require('express');
const router = express.Router();
const { Habit } = require('../models/OtherModels');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user._id, isActive: true }).sort({ createdAt: 1 });
    res.json({ success: true, habits });
  } catch { res.status(500).json({ success: false, message: 'خطأ في جلب العادات' }); }
});

router.post('/', async (req, res) => {
  try {
    const habit = await Habit.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, habit });
  } catch { res.status(500).json({ success: false, message: 'خطأ في إنشاء العادة' }); }
});

// PUT /api/habits/:id/complete  — mark completion for a date
router.put('/:id/complete', async (req, res) => {
  try {
    const { date, completed, note } = req.body;
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });
    if (!habit) return res.status(404).json({ success: false, message: 'العادة غير موجودة' });

    const idx = habit.completions.findIndex(c => c.date === date);
    if (idx >= 0) {
      habit.completions[idx].completed = completed;
      habit.completions[idx].note = note;
    } else {
      habit.completions.push({ date, completed, note });
    }

    // Recalculate streak
    const sorted = habit.completions.filter(c => c.completed).map(c => c.date).sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let check = today;
    for (const d of sorted) {
      if (d === check) { streak++; const dt = new Date(check); dt.setDate(dt.getDate() - 1); check = dt.toISOString().split('T')[0]; }
      else break;
    }
    habit.streak = streak;
    if (streak > habit.longestStreak) habit.longestStreak = streak;

    await habit.save();
    res.json({ success: true, habit });
  } catch { res.status(500).json({ success: false, message: 'خطأ في تحديث العادة' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, { new: true });
    if (!habit) return res.status(404).json({ success: false, message: 'العادة غير موجودة' });
    res.json({ success: true, habit });
  } catch { res.status(500).json({ success: false, message: 'خطأ' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await Habit.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isActive: false });
    res.json({ success: true, message: 'تم أرشفة العادة' });
  } catch { res.status(500).json({ success: false, message: 'خطأ' }); }
});

module.exports = router;
