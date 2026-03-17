# 🌙 حياتي — Hayati

> تطبيق إدارة الحياة اليومية | Daily Life Management App

**Stack:** Node.js + Express + MongoDB + Vanilla HTML/CSS/JS  
**Design:** Dark Burgundy + Soft Pink | Arabic RTL | Zain Font  

---

## 📁 هيكل المشروع

```
hayati/
├── backend/
│   ├── middleware/
│   │   └── auth.js            ← JWT authentication middleware
│   ├── models/
│   │   ├── User.js            ← User model (bcrypt password)
│   │   └── OtherModels.js     ← Journal, Prayer, Debt, Habit models
│   ├── routes/
│   │   ├── auth.js            ← Register, Login, Profile
│   │   ├── tasks.js           ← CRUD tasks + monthly
│   │   ├── journal.js         ← Daily journal entries
│   │   ├── prayers.js         ← 5 daily prayers tracker
│   │   ├── debts.js           ← Debt management
│   │   ├── habits.js          ← Habit tracking + streaks
│   │   └── dashboard.js       ← Aggregated daily overview
│   ├── .env.example           ← Environment variables template
│   ├── package.json
│   └── server.js              ← Express app entry point
│
├── frontend/
│   ├── css/
│   │   └── styles.css         ← Full design system (tokens, components)
│   ├── js/
│   │   ├── app.js             ← API client, auth, utilities
│   │   └── nav.js             ← Navigation builder
│   ├── index.html             ← Landing page
│   ├── login.html             ← Sign in
│   ├── register.html          ← Sign up
│   ├── dashboard.html         ← Daily overview
│   ├── tasks.html             ← Task management (daily + monthly)
│   ├── prayers.html           ← Prayer tracker + monthly grid
│   ├── journal.html           ← Daily journal + history
│   ├── debts.html             ← Debt tracker with payments
│   └── habits.html            ← Habit tracker + streaks
│
└── docs/
    └── API.md                 ← Full API documentation
```

---

## 🚀 التشغيل

### 1. Backend

```bash
cd backend
cp .env.example .env
# عدّل القيم في .env:
# MONGODB_URI=mongodb://localhost:27017/hayati
# JWT_SECRET=your_secret_key_min_32_chars

npm install
npm run dev
# → يعمل على http://localhost:5000
```

### 2. Frontend

```bash
# الطريقة الأولى: VS Code Live Server
# افتح frontend/ واضغط Go Live

# الطريقة الثانية: Python
cd frontend
python -m http.server 3000
# → http://localhost:3000
```

---

## ✨ الميزات

| الميزة | الوصف |
|--------|-------|
| 🔐 المصادقة | تسجيل دخول وخروج بـ JWT، متعدد المستخدمين |
| ✅ المهام | يومية + شهرية + أولوية + تذكيرات |
| 🤲 الصلوات | تتبع 5 صلوات يومياً + شبكة شهرية |
| 📓 اليوميات | كتابة يومية + مزاج + شكر + سجل تاريخي |
| 💰 الديون | تتبع ما لك وما عليك + تسجيل الدفعات |
| ⭐ العادات | بناء عادات مع تتبع السلاسل اليومية |
| 🏠 الداشبورد | نظرة شاملة على اليوم |

---

## 🎨 نظام التصميم

- **اللون الرئيسي:** Burgundy `#8B1A4A` 
- **اللون الثانوي:** Soft Pink `#E8739A`
- **الخلفية:** `#1A0810` (Dark)
- **الخط:** Zain (Google Fonts)
- **الاتجاه:** RTL كامل

---

## 🔒 الأمان

- تشفير كلمات المرور بـ bcrypt (salt=12)
- JWT مع صلاحية 30 يوم
- Rate limiting على المصادقة (20 req/15min)
- Input validation بـ express-validator
- كل بيانات المستخدم معزولة بـ `user: req.user._id`
