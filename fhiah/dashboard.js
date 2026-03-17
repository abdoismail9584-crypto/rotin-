const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { Journal, Prayer, Debt, Habit } = require('../models/OtherModels');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/dashboard?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const userId = req.user._id;

    const [tasks, journal, prayers, debts, habits] = await Promise.all([
      Task.find({ user: userId, date }),
      Journal.findOne({ user: userId, date }),
      Prayer.findOne({ user: userId, date }),
      Debt.find({ user: userId, status: { $ne: 'مسدد' } }),
      Habit.find({ user: userId, isActive: true })
    ]);

    const completedTasks = tasks.filter(t => t.completed).length;
    const prayersCompleted = prayers
      ? ['fajr','dhuhr','asr','maghrib','isha'].filter(p => prayers[p]?.completed).length
      : 0;

    const todayHabits = habits.map(h => {
      const completion = h.completions.find(c => c.date === date);
      return { ...h.toObject(), todayCompleted: completion?.completed || false };
    });

    const totalOwe = debts.filter(d => d.type === 'أنا مدين').reduce((s, d) => s + (d.amount - d.paidAmount), 0);
    const totalOwed = debts.filter(d => d.type === 'مدين لي').reduce((s, d) => s + (d.amount - d.paidAmount), 0);

    res.json({
      success: true,
      date,
      summary: {
        tasks: { total: tasks.length, completed: completedTasks },
        prayers: { completed: prayersCompleted, total: 5 },
        habits: { total: habits.length, completed: todayHabits.filter(h => h.todayCompleted).length },
        debts: { totalOwe, totalOwed, activeDebts: debts.length },
        hasJournal: !!journal
      },
      tasks,
      prayers,
      habits: todayHabits,
      journal,
      recentDebts: debts.slice(0, 5)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في جلب بيانات اللوحة' });
  }
});

module.exports = router;
