// ============================================================
// routes/journal.js
// ============================================================
const express = require('express');
const journalRouter = express.Router();
const { Journal } = require('../models/OtherModels');
const { protect } = require('../middleware/auth');

journalRouter.use(protect);

journalRouter.get('/', async (req, res) => {
  try {
    const { limit = 30, page = 1 } = req.query;
    const entries = await Journal.find({ user: req.user._id })
      .sort({ date: -1 }).limit(+limit).skip((+page - 1) * +limit);
    const total = await Journal.countDocuments({ user: req.user._id });
    res.json({ success: true, entries, total });
  } catch { res.status(500).json({ success: false, message: 'خطأ في جلب اليوميات' }); }
});

journalRouter.get('/:date', async (req, res) => {
  try {
    const entry = await Journal.findOne({ user: req.user._id, date: req.params.date });
    res.json({ success: true, entry });
  } catch { res.status(500).json({ success: false, message: 'خطأ' }); }
});

journalRouter.post('/', async (req, res) => {
  try {
    const existing = await Journal.findOne({ user: req.user._id, date: req.body.date });
    if (existing) {
      const updated = await Journal.findByIdAndUpdate(existing._id, req.body, { new: true });
      return res.json({ success: true, entry: updated });
    }
    const entry = await Journal.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, entry });
  } catch { res.status(500).json({ success: false, message: 'خطأ في حفظ اليومية' }); }
});

journalRouter.delete('/:id', async (req, res) => {
  try {
    await Journal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'تم حذف اليومية' });
  } catch { res.status(500).json({ success: false, message: 'خطأ' }); }
});

module.exports = journalRouter;
