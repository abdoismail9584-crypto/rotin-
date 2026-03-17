const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Debt } = require('../models/OtherModels');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (type) filter.type = type;
    const debts = await Debt.find(filter).sort({ createdAt: -1 });
    const totalOwe = debts.filter(d => d.type === 'أنا مدين' && d.status !== 'مسدد')
      .reduce((s, d) => s + (d.amount - d.paidAmount), 0);
    const totalOwed = debts.filter(d => d.type === 'مدين لي' && d.status !== 'مسدد')
      .reduce((s, d) => s + (d.amount - d.paidAmount), 0);
    res.json({ success: true, debts, totalOwe, totalOwed });
  } catch { res.status(500).json({ success: false, message: 'خطأ في جلب الديون' }); }
});

router.post('/', [
  body('personName').trim().notEmpty().withMessage('اسم الشخص مطلوب'),
  body('amount').isNumeric().withMessage('المبلغ يجب أن يكون رقماً'),
  body('type').isIn(['أنا مدين', 'مدين لي']).withMessage('نوع الدين غير صالح')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  try {
    const debt = await Debt.create({ ...req.body, user: req.user._id, date: new Date().toISOString().split('T')[0] });
    res.status(201).json({ success: true, debt });
  } catch { res.status(500).json({ success: false, message: 'خطأ في إضافة الدين' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const debt = await Debt.findOne({ _id: req.params.id, user: req.user._id });
    if (!debt) return res.status(404).json({ success: false, message: 'الدين غير موجود' });
    if (req.body.paidAmount !== undefined) {
      debt.paidAmount = req.body.paidAmount;
      if (debt.paidAmount >= debt.amount) debt.status = 'مسدد';
      else if (debt.paidAmount > 0) debt.status = 'مسدد جزئياً';
    }
    Object.assign(debt, req.body);
    await debt.save();
    res.json({ success: true, debt });
  } catch { res.status(500).json({ success: false, message: 'خطأ في تحديث الدين' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await Debt.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'تم حذف الدين' });
  } catch { res.status(500).json({ success: false, message: 'خطأ' }); }
});

module.exports = router;
