const mongoose = require('mongoose');

// ─── Journal Entry ─────────────────────────────────────────────────────────────
const journalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  content: { type: String, required: [true, 'محتوى اليومية مطلوب'], maxlength: 5000 },
  mood: { type: String, enum: ['ممتاز', 'جيد', 'عادي', 'سيء', 'سيء جداً'], default: 'عادي' },
  highlights: [{ type: String, maxlength: 200 }],
  gratitude: { type: String, maxlength: 500 }
}, { timestamps: true });

journalSchema.index({ user: 1, date: 1 }, { unique: true });

// ─── Prayer Tracker ────────────────────────────────────────────────────────────
const prayerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  fajr:    { completed: { type: Boolean, default: false }, time: String },
  dhuhr:   { completed: { type: Boolean, default: false }, time: String },
  asr:     { completed: { type: Boolean, default: false }, time: String },
  maghrib: { completed: { type: Boolean, default: false }, time: String },
  isha:    { completed: { type: Boolean, default: false }, time: String }
}, { timestamps: true });

prayerSchema.index({ user: 1, date: 1 }, { unique: true });

// ─── Debt Tracker ──────────────────────────────────────────────────────────────
const debtSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  personName: { type: String, required: [true, 'اسم الشخص مطلوب'], trim: true },
  amount: { type: Number, required: [true, 'المبلغ مطلوب'], min: 0 },
  currency: { type: String, default: 'ج.م' },
  type: { type: String, enum: ['أنا مدين', 'مدين لي'], required: true },
  description: { type: String, maxlength: 300 },
  dueDate: { type: Date },
  status: { type: String, enum: ['قائم', 'مسدد جزئياً', 'مسدد'], default: 'قائم' },
  paidAmount: { type: Number, default: 0 },
  date: { type: String } // date debt was recorded
}, { timestamps: true });

debtSchema.index({ user: 1, status: 1 });

// ─── Habit Tracker ─────────────────────────────────────────────────────────────
const habitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: [true, 'اسم العادة مطلوب'], trim: true, maxlength: 100 },
  description: { type: String, maxlength: 300 },
  icon: { type: String, default: '⭐' },
  color: { type: String, default: '#8B1A4A' },
  frequency: { type: String, enum: ['يومي', 'أسبوعي', 'شهري'], default: 'يومي' },
  isActive: { type: Boolean, default: true },
  completions: [{
    date: String, // YYYY-MM-DD
    completed: { type: Boolean, default: false },
    note: String
  }],
  streak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 }
}, { timestamps: true });

habitSchema.index({ user: 1, isActive: 1 });

module.exports = {
  Journal: mongoose.model('Journal', journalSchema),
  Prayer: mongoose.model('Prayer', prayerSchema),
  Debt: mongoose.model('Debt', debtSchema),
  Habit: mongoose.model('Habit', habitSchema)
};
