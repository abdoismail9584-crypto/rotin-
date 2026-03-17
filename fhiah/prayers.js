const express = require('express');
const router = express.Router();
const { Prayer } = require('../models/OtherModels');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/prayers/:date
router.get('/:date', async (req, res) => {
  try {
    let record = await Prayer.findOne({ user: req.user._id, date: req.params.date });
    if (!record) {
      record = await Prayer.create({ user: req.user._id, date: req.params.date });
    }
    res.json({ success: true, prayers: record });
  } catch { res.status(500).json({ success: false, message: 'خطأ في جلب الصلوات' }); }
});

// GET /api/prayers?month=2024-01
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    const filter = { user: req.user._id };
    if (month) filter.date = { $regex: `^${month}` };
    const records = await Prayer.find(filter).sort({ date: -1 });
    res.json({ success: true, records });
  } catch { res.status(500).json({ success: false, message: 'خطأ' }); }
});

// PUT /api/prayers/:date  — toggle a prayer
router.put('/:date', async (req, res) => {
  try {
    const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const updates = {};
    prayers.forEach(p => {
      if (req.body[p] !== undefined) updates[p] = req.body[p];
    });
    const record = await Prayer.findOneAndUpdate(
      { user: req.user._id, date: req.params.date },
      { $set: updates },
      { new: true, upsert: true }
    );
    res.json({ success: true, prayers: record });
  } catch { res.status(500).json({ success: false, message: 'خطأ في تحديث الصلوات' }); }
});

module.exports = router;
