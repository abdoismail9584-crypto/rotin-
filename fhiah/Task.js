const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: [true, 'عنوان المهمة مطلوب'], trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 500 },
  completed: { type: Boolean, default: false },
  priority: { type: String, enum: ['منخفض', 'متوسط', 'عالي'], default: 'متوسط' },
  type: { type: String, enum: ['يومي', 'أسبوعي', 'شهري', 'مرة واحدة'], default: 'يومي' },
  dueDate: { type: Date },
  completedAt: { type: Date },
  date: { type: String, required: true } // YYYY-MM-DD for daily grouping
}, { timestamps: true });

taskSchema.index({ user: 1, date: 1 });
module.exports = mongoose.model('Task', taskSchema);
