# توثيق Hayati API

Base URL: `http://localhost:5000/api`

جميع النقاط المحمية تتطلب: `Authorization: Bearer <JWT_TOKEN>`

---

## 🔐 المصادقة `/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | إنشاء حساب جديد |
| POST | `/auth/login` | ❌ | تسجيل الدخول |
| GET | `/auth/me` | ✅ | بيانات المستخدم الحالي |
| PUT | `/auth/profile` | ✅ | تحديث الملف الشخصي |

**Register Body:** `{ name, email, password }`
**Login Body:** `{ email, password }`
**Response:** `{ success, token, user: { id, name, email } }`

---

## ✅ المهام `/tasks`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks?date=YYYY-MM-DD&type=شهري` | جلب المهام |
| GET | `/tasks/monthly?month=YYYY-MM` | المهام الشهرية |
| POST | `/tasks` | إنشاء مهمة جديدة |
| PUT | `/tasks/:id` | تحديث مهمة |
| DELETE | `/tasks/:id` | حذف مهمة |

**Task Schema:**
```json
{
  "title": "اسم المهمة",
  "description": "وصف اختياري",
  "priority": "منخفض | متوسط | عالي",
  "type": "يومي | أسبوعي | شهري | مرة واحدة",
  "date": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "completed": false
}
```

---

## 📓 اليوميات `/journal`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/journal?page=1&limit=30` | قائمة اليوميات |
| GET | `/journal/:date` | يومية يوم محدد |
| POST | `/journal` | إنشاء/تحديث يومية |
| DELETE | `/journal/:id` | حذف يومية |

**Journal Schema:**
```json
{
  "date": "YYYY-MM-DD",
  "content": "نص اليومية",
  "mood": "ممتاز | جيد | عادي | سيء | سيء جداً",
  "gratitude": "شيء أشكر عليه"
}
```

---

## 🤲 الصلوات `/prayers`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/prayers?month=YYYY-MM` | سجل الصلوات |
| GET | `/prayers/:date` | صلوات يوم محدد |
| PUT | `/prayers/:date` | تحديث صلاة |

**Update Body:**
```json
{
  "fajr":    { "completed": true },
  "dhuhr":   { "completed": false },
  "asr":     { "completed": true },
  "maghrib": { "completed": true },
  "isha":    { "completed": false }
}
```

---

## 💰 الديون `/debts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/debts?status=قائم&type=أنا مدين` | قائمة الديون |
| POST | `/debts` | إضافة دين |
| PUT | `/debts/:id` | تحديث / سداد |
| DELETE | `/debts/:id` | حذف دين |

**Debt Schema:**
```json
{
  "personName": "اسم الشخص",
  "amount": 500,
  "currency": "ج.م",
  "type": "أنا مدين | مدين لي",
  "description": "سبب الدين",
  "dueDate": "YYYY-MM-DD",
  "paidAmount": 0
}
```

---

## ⭐ العادات `/habits`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/habits` | جلب العادات النشطة |
| POST | `/habits` | إنشاء عادة |
| PUT | `/habits/:id/complete` | تسجيل إنجاز اليوم |
| PUT | `/habits/:id` | تحديث العادة |
| DELETE | `/habits/:id` | أرشفة العادة |

**Complete Body:** `{ "date": "YYYY-MM-DD", "completed": true }`

---

## 🏠 لوحة التحكم `/dashboard`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard?date=YYYY-MM-DD` | بيانات اليوم كاملة |

**Response يشمل:**
- ملخص اليوم (مهام، صلوات، عادات، ديون)
- قائمة المهام
- سجل الصلوات
- العادات مع إنجاز اليوم
- آخر يومية

---

## قاعدة البيانات — المخطط

```
Users:        { name, email, password(hashed), avatar }
Tasks:        { user, title, desc, completed, priority, type, date, dueDate }
Journal:      { user, date(unique/user), content, mood, gratitude }
Prayer:       { user, date(unique/user), fajr, dhuhr, asr, maghrib, isha }
Debt:         { user, personName, amount, currency, type, status, paidAmount, dueDate }
Habit:        { user, title, icon, frequency, isActive, completions[], streak }
```

---

## تشغيل المشروع

```bash
# Backend
cd backend
cp .env.example .env
# عدّل MONGODB_URI و JWT_SECRET
npm install
npm run dev

# Frontend
# افتح frontend/index.html في المتصفح
# أو استخدم Live Server
```
