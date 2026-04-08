// ══════════════════════════════════════
//  يومياتي — Application Logic (v2)
// ══════════════════════════════════════

// ══════════════════════════════════════
//  DATA LAYER
// ══════════════════════════════════════
const DB = {
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || null;
    } catch {
      return null;
    }
  },
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },
  getUsers() {
    return this.get("users") || [];
  },
  saveUsers(u) {
    this.set("users", u);
  },
  getUserData(uid) {
    return (
      this.get("data_" + uid) || {
        tasks: [],
        habits: [],
        prayers: {},
        journal: [],
        debts: [],
      }
    );
  },
  saveUserData(uid, data) {
    this.set("data_" + uid, data);
  },
  getCurrentUser() {
    return this.get("current_user");
  },
  setCurrentUser(u) {
    this.set("current_user", u);
  },
  logout() {
    localStorage.removeItem("current_user");
  },
  // Avatar stored separately (base64 can be large)
  getAvatar(uid) {
    return localStorage.getItem("avatar_" + uid) || null;
  },
  setAvatar(uid, b64) {
    localStorage.setItem("avatar_" + uid, b64);
  },
};

// ══════════════════════════════════════
//  AUTH
// ══════════════════════════════════════
function hashPass(p) {
  let h = 0;
  for (let i = 0; i < p.length; i++) {
    h = (h << 5) - h + p.charCodeAt(i);
    h |= 0;
  }
  return h.toString(36);
}

const Auth = {
  register(name, email, pass) {
    const users = DB.getUsers();
    if (users.find((u) => u.email === email))
      return { error: "البريد الإلكتروني مستخدم بالفعل" };
    const user = {
      id: "u_" + Date.now(),
      name,
      email,
      pass: hashPass(pass),
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    DB.saveUsers(users);
    const safe = { ...user };
    delete safe.pass;
    DB.setCurrentUser(safe);
    return { user: safe };
  },
  login(email, pass) {
    const users = DB.getUsers();
    const user = users.find(
      (u) => u.email === email && u.pass === hashPass(pass),
    );
    if (!user) return { error: "البريد أو كلمة المرور غير صحيحة" };
    const safe = { ...user };
    delete safe.pass;
    DB.setCurrentUser(safe);
    return { user: safe };
  },
  changePassword(uid, oldPass, newPass) {
    const users = DB.getUsers();
    const idx = users.findIndex((u) => u.id === uid);
    if (idx === -1) return { error: "المستخدم غير موجود" };
    if (users[idx].pass !== hashPass(oldPass))
      return { error: "كلمة المرور الحالية غير صحيحة" };
    users[idx].pass = hashPass(newPass);
    DB.saveUsers(users);
    return { ok: true };
  },
  updateName(uid, name) {
    const users = DB.getUsers();
    const idx = users.findIndex((u) => u.id === uid);
    if (idx === -1) return { error: "المستخدم غير موجود" };
    users[idx].name = name;
    DB.saveUsers(users);
    const safe = { ...users[idx] };
    delete safe.pass;
    DB.setCurrentUser(safe);
    return { user: safe };
  },
};

// ══════════════════════════════════════
//  UTILITIES
// ══════════════════════════════════════
function today() {
  return new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
function todayKey() {
  return new Date().toISOString().split("T")[0];
}
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}
function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k.startsWith("on"))
      e.addEventListener(k.slice(2).toLowerCase(), v);
    else e.setAttribute(k, v);
  }
  for (const c of children) {
    if (typeof c === "string") e.appendChild(document.createTextNode(c));
    else if (c) e.appendChild(c);
  }
  return e;
}
function h(tag, attrs, children) {
  return el(
    tag,
    attrs || {},
    Array.isArray(children) ? children : children ? [children] : [],
  );
}

function passwordStrength(p) {
  if (!p) return { score: 0, label: "", color: "" };
  let score = 0;
  if (p.length >= 6) score++;
  if (p.length >= 10) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  const levels = [
    { label: "ضعيفة جداً", color: "#f87171" },
    { label: "ضعيفة", color: "#fb923c" },
    { label: "متوسطة", color: "#fbbf24" },
    { label: "جيدة", color: "#34d399" },
    { label: "قوية", color: "#a78bfa" },
    { label: "ممتازة", color: "#06b6d4" },
  ];
  return { score, ...levels[Math.min(score, 5)] };
}

// ══════════════════════════════════════
//  APP CONTROLLER
// ══════════════════════════════════════
const App = {
  currentUser: null,
  page: "dashboard",
  sidebarOpen: false,

  init() {
    this.currentUser = DB.getCurrentUser();
    if (this.currentUser) {
      this.render();
    } else {
      this.renderAuth();
    }
  },
  getData() {
    return DB.getUserData(this.currentUser.id);
  },
  render() {
    document.getElementById("root").innerHTML = "";
    document.getElementById("root").appendChild(this.buildApp());
  },
  renderAuth() {
    document.getElementById("root").innerHTML = "";
    document.getElementById("root").appendChild(this.buildAuth());
  },
  refreshContent() {
    App.renderPage(document.getElementById("main-content"));
  },

  // ══════════════════════════════════════
  //  AUTH UI
  // ══════════════════════════════════════
  buildAuth() {
    const wrap = h("div", { class: "auth-wrap" });
    let tab = "login";
    const box = h("div", { class: "auth-box" });
    const logo = h("div", { class: "auth-logo" }, [
      h("span", { class: "logo-icon" }, ["📅"]),
      h("h1", {}, [" يومياتي"]),
      h("p", {}, ["تتبع يومك بذكاء وانتظام"]),
    ]);
    const tabsEl = h("div", { class: "auth-tabs" });
    const tabLogin = h(
      "button",
      {
        class: "auth-tab active",
        onclick: () => {
          tab = "login";
          updateForm();
        },
      },
      [" تسجيل الدخول"],
    );
    const tabReg = h(
      "button",
      {
        class: "auth-tab",
        onclick: () => {
          tab = "register";
          updateForm();
        },
      },
      [" حساب جديد"],
    );
    tabsEl.appendChild(tabLogin);
    tabsEl.appendChild(tabReg);
    const errorEl = h("div", { class: "auth-error" });
    errorEl.style.display = "none";
    const form = h("div", {});

    function makeField(id, label, type) {
      return h("div", { class: "field" }, [
        h("label", {}, [label]),
        h("input", { type, id, placeholder: label }),
      ]);
    }
    function updateForm() {
      tabLogin.className = "auth-tab" + (tab === "login" ? " active" : "");
      tabReg.className = "auth-tab" + (tab === "register" ? " active" : "");
      form.innerHTML = "";
      errorEl.style.display = "none";
      if (tab === "register")
        form.appendChild(makeField("reg-name", "الاسم الكامل", "text"));
      if (tab === "login") {
        form.appendChild(
          makeField("login-email", "البريد الإلكتروني", "email"),
        );
        form.appendChild(makeField("login-pass", "كلمة المرور", "password"));
      } else {
        form.appendChild(makeField("reg-email", "البريد الإلكتروني", "email"));
        form.appendChild(makeField("reg-pass", "كلمة المرور", "password"));
      }
      form.appendChild(
        h("button", { class: "btn-primary", onclick: handleSubmit }, [
          tab === "login" ? "دخول" : "إنشاء حساب",
        ]),
      );
    }
    function handleSubmit() {
      errorEl.style.display = "none";
      if (tab === "login") {
        const email = document.getElementById("login-email").value.trim();
        const pass = document.getElementById("login-pass").value;
        if (!email || !pass) {
          errorEl.style.display = "block";
          errorEl.textContent = "يرجى ملء جميع الحقول";
          return;
        }
        const res = Auth.login(email, pass);
        if (res.error) {
          errorEl.style.display = "block";
          errorEl.textContent = res.error;
          return;
        }
        App.currentUser = res.user;
        App.render();
      } else {
        const name = document.getElementById("reg-name").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const pass = document.getElementById("reg-pass").value;
        if (!name || !email || !pass) {
          errorEl.style.display = "block";
          errorEl.textContent = "يرجى ملء جميع الحقول";
          return;
        }
        if (pass.length < 6) {
          errorEl.style.display = "block";
          errorEl.textContent = "كلمة المرور 6 أحرف على الأقل";
          return;
        }
        const res = Auth.register(name, email, pass);
        if (res.error) {
          errorEl.style.display = "block";
          errorEl.textContent = res.error;
          return;
        }
        App.currentUser = res.user;
        App.render();
      }
    }
    updateForm();
    box.appendChild(logo);
    box.appendChild(tabsEl);
    box.appendChild(errorEl);
    box.appendChild(form);
    wrap.appendChild(box);
    return wrap;
  },

  // ══════════════════════════════════════
  //  MAIN SHELL
  // ══════════════════════════════════════
  buildApp() {
    const root = h("div", { class: "app" });
    const overlay = h("div", {
      class: "overlay",
      onclick: () => {
        App.sidebarOpen = false;
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
      },
    });
    const sidebar = this.buildSidebar(() => {
      App.sidebarOpen = false;
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
    });
    const main = h("div", { class: "main" });
    const topbar = this.buildTopbar(() => {
      App.sidebarOpen = !App.sidebarOpen;
      sidebar.classList.toggle("open", App.sidebarOpen);
      overlay.classList.toggle("show", App.sidebarOpen);
    });
    const contentWrap = h("div", { class: "content", id: "main-content" });
    this.renderPage(contentWrap);
    main.appendChild(topbar);
    main.appendChild(contentWrap);
    root.appendChild(overlay);
    root.appendChild(sidebar);
    root.appendChild(main);
    return root;
  },

  buildSidebar(closeFn) {
    const nav = [
      { id: "dashboard", icon: "🏠", label: "لوحة التحكم" },
      { id: "tasks", icon: "✅", label: "المهام" },
      { id: "habits", icon: "🔄", label: "العادات" },
      { id: "prayers", icon: "🕌", label: "الصلوات" },
      { id: "debts", icon: "💰", label: "الديون" },
      { id: "journal", icon: "📔", label: "اليوميات" },
      { id: "history", icon: "📅", label: "السجل" },
      { id: "account", icon: "👤", label: "حسابي" },
    ];
    const sidebar = h("div", { class: "sidebar" });
    sidebar.appendChild(
      h("div", { class: "sidebar-logo" }, [
        h("div", {}, [
          h("div", { class: "logo-txt" }, ["📅 يومياتي"]),
          h("div", { class: "logo-sub" }, ["متابعتك اليومية"]),
        ]),
      ]),
    );
    const u = this.currentUser;
    const avatar = DB.getAvatar(u.id);
    const avatarEl = h("div", { class: "user-avatar" });
    if (avatar) {
      const img = document.createElement("img");
      img.src = avatar;
      avatarEl.appendChild(img);
    } else {
      avatarEl.textContent = u.name.charAt(0);
    }
    sidebar.appendChild(
      h(
        "div",
        {
          class: "user-badge",
          onclick: () => {
            App.page = "account";
            navItems.forEach((i) => i.el.classList.remove("active"));
            navItems.find((n) => n.id === "account").el.classList.add("active");
            App.renderPage(document.getElementById("main-content"));
            closeFn();
          },
        },
        [
          avatarEl,
          h("div", {}, [
            h("div", { class: "user-name" }, [u.name]),
            h("div", { class: "user-email" }, [u.email]),
            h("div", { class: "user-settings-hint" }, ["اضغط لإعدادات الحساب"]),
          ]),
        ],
      ),
    );
    const navEl = h("div", { class: "nav" });
    const navItems = [];
    for (const n of nav) {
      const item = h(
        "button",
        {
          class: "nav-item" + (this.page === n.id ? " active" : ""),
          onclick: () => {
            App.page = n.id;
            navItems.forEach((i) => i.el.classList.remove("active"));
            item.classList.add("active");
            App.renderPage(document.getElementById("main-content"));
            closeFn();
          },
        },
        [h("span", { class: "nav-icon" }, [n.icon]), n.label],
      );
      navItems.push({ id: n.id, el: item });
      navEl.appendChild(item);
    }
    sidebar.appendChild(navEl);
    sidebar.appendChild(
      h("div", { class: "sidebar-footer" }, [
        h(
          "button",
          {
            class: "btn-logout",
            onclick: () => {
              DB.logout();
              App.currentUser = null;
              App.renderAuth();
            },
          },
          [h("span", {}, [" 🚪"]), " تسجيل الخروج"],
        ),
      ]),
    );
    return sidebar;
  },

  buildTopbar(toggleSidebar) {
    const titles = {
      dashboard: "لوحة التحكم",
      tasks: "المهام",
      habits: "العادات",
      prayers: "الصلوات",
      debts: "الديون",
      journal: "اليوميات",
      history: "السجل",
      account: "حسابي",
    };
    return h("div", { class: "topbar" }, [
      h("div", { class: "topbar-right" }, [
        h("div", { class: "hamburger", onclick: toggleSidebar }, [
          h("span"),
          h("span"),
          h("span"),
        ]),
      ]),
      h("div", {}, [
        h("div", { class: "topbar-title" }, [titles[this.page] || ""]),
        h("div", { class: "topbar-date" }, [today()]),
      ]),
    ]);
  },

  renderPage(container) {
    container.innerHTML = "";
    const pages = {
      dashboard: () => this.buildDashboard(),
      tasks: () => this.buildTasks(),
      habits: () => this.buildHabits(),
      prayers: () => this.buildPrayers(),
      debts: () => this.buildDebts(),
      journal: () => this.buildJournal(),
      history: () => this.buildHistory(),
      account: () => this.buildAccount(),
    };
    container.appendChild((pages[this.page] || pages.dashboard)());
  },

  // ══════════════════════════════════════
  //  ACCOUNT SETTINGS PAGE
  // ══════════════════════════════════════
  buildAccount() {
    const u = this.currentUser;
    const avatar = DB.getAvatar(u.id);
    const wrap = h("div", {});

    // ─── Hero / avatar ───
    const hero = h("div", { class: "account-hero" });
    const avatarWrap = h("div", { class: "avatar-upload-wrap" });
    const avatarLarge = h("div", { class: "avatar-large" });
    if (avatar) {
      const img = document.createElement("img");
      img.src = avatar;
      avatarLarge.appendChild(img);
    } else {
      avatarLarge.textContent = u.name.charAt(0);
    }
    const avatarOverlay = h("div", { class: "avatar-overlay" }, [
      "📷 تغيير\nالصورة",
    ]);
    const fileInput = h("input", {
      type: "file",
      id: "avatar-file-input",
      accept: "image/*",
    });
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        showToast("الصورة أكبر من 2MB، اختر صورة أصغر");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        DB.setAvatar(u.id, ev.target.result);
        showToast("تم تحديث صورة الملف الشخصي ✅");
        App.render(); // re-render everything to update sidebar avatar too
        App.page = "account";
        App.refreshContent();
      };
      reader.readAsDataURL(file);
    });
    avatarWrap.addEventListener("click", () => fileInput.click());
    avatarWrap.appendChild(avatarLarge);
    avatarWrap.appendChild(avatarOverlay);
    avatarWrap.appendChild(fileInput);
    hero.appendChild(avatarWrap);
    hero.appendChild(h("div", { class: "account-name" }, [u.name]));
    hero.appendChild(h("div", { class: "account-email" }, [u.email]));
    const since = u.createdAt
      ? new Date(u.createdAt).toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";
    if (since)
      hero.appendChild(
        h("div", { class: "account-since" }, ["عضو منذ " + since]),
      );
    wrap.appendChild(hero);

    // ─── Profile info section ───
    const infoCard = h("div", { class: "card", style: "margin-bottom:1rem" });
    infoCard.appendChild(
      h("div", { class: "settings-label" }, ["✏️ المعلومات الشخصية"]),
    );
    const nameSuccessEl = h("div", { class: "alert-success" }, [
      "تم تحديث الاسم بنجاح ✅",
    ]);
    const nameErrEl = h("div", { class: "alert-danger" });
    infoCard.appendChild(nameSuccessEl);
    infoCard.appendChild(nameErrEl);

    const nameField = h("div", { class: "settings-field" });
    nameField.appendChild(h("label", {}, ["الاسم الكامل"]));
    const nameInp = h("input", {
      class: "settings-input",
      type: "text",
      value: u.name,
      placeholder: "الاسم الكامل",
    });
    nameField.appendChild(nameInp);
    infoCard.appendChild(nameField);

    const emailField = h("div", { class: "settings-field" });
    emailField.appendChild(h("label", {}, ["البريد الإلكتروني"]));
    const emailInp = h("input", {
      class: "settings-input",
      type: "email",
      value: u.email,
      readonly: "true",
      placeholder: "البريد الإلكتروني",
    });
    emailField.appendChild(emailInp);
    emailField.appendChild(
      h(
        "div",
        { style: "font-size:.78rem;color:var(--text-dim);margin-top:.3rem" },
        ["البريد الإلكتروني لا يمكن تغييره"],
      ),
    );
    infoCard.appendChild(emailField);

    infoCard.appendChild(
      h(
        "button",
        {
          class: "btn-primary",
          style: "margin-top:.5rem",
          onclick: () => {
            const newName = nameInp.value.trim();
            nameSuccessEl.style.display = "none";
            nameErrEl.style.display = "none";
            if (!newName) {
              nameErrEl.style.display = "block";
              nameErrEl.textContent = "الاسم لا يمكن أن يكون فارغاً";
              return;
            }
            const res = Auth.updateName(u.id, newName);
            if (res.error) {
              nameErrEl.style.display = "block";
              nameErrEl.textContent = res.error;
              return;
            }
            App.currentUser = res.user;
            nameSuccessEl.style.display = "block";
            // Update sidebar name without full re-render
            const sidebarName = document.querySelector(".user-name");
            const accountName = document.querySelector(".account-name");
            if (sidebarName) sidebarName.textContent = newName;
            if (accountName) accountName.textContent = newName;
          },
        },
        ["حفظ المعلومات"],
      ),
    );
    wrap.appendChild(infoCard);

    // ─── Change password section ───
    const passCard = h("div", { class: "card", style: "margin-bottom:1rem" });
    passCard.appendChild(
      h("div", { class: "settings-label" }, ["🔒 تغيير كلمة المرور"]),
    );
    const passSuccessEl = h("div", { class: "alert-success" }, [
      "تم تغيير كلمة المرور بنجاح 🔒",
    ]);
    const passErrEl = h("div", { class: "alert-danger" });
    passCard.appendChild(passSuccessEl);
    passCard.appendChild(passErrEl);

    const oldPassField = h("div", { class: "settings-field" });
    oldPassField.appendChild(h("label", {}, ["كلمة المرور الحالية"]));
    const oldPassInp = h("input", {
      class: "settings-input",
      type: "password",
      placeholder: "أدخل كلمة المرور الحالية",
    });
    oldPassField.appendChild(oldPassInp);
    passCard.appendChild(oldPassField);

    const newPassField = h("div", { class: "settings-field" });
    newPassField.appendChild(h("label", {}, ["كلمة المرور الجديدة"]));
    const newPassInp = h("input", {
      class: "settings-input",
      type: "password",
      placeholder: "أدخل كلمة المرور الجديدة (6 أحرف على الأقل)",
    });
    const strengthBar = h("div", { class: "pass-strength" });
    const strengthFill = h("div", {
      class: "pass-strength-fill",
      style: "width:0%",
    });
    const strengthLabel = h(
      "div",
      { style: "font-size:.78rem;margin-top:.3rem;color:var(--text-muted)" },
      [""],
    );
    strengthBar.appendChild(strengthFill);
    newPassInp.addEventListener("input", () => {
      const s = passwordStrength(newPassInp.value);
      strengthFill.style.width = (s.score / 5) * 100 + "%";
      strengthFill.style.background = s.color;
      strengthLabel.textContent = s.label ? "قوة كلمة المرور: " + s.label : "";
      strengthLabel.style.color = s.color;
    });
    newPassField.appendChild(newPassInp);
    newPassField.appendChild(strengthBar);
    newPassField.appendChild(strengthLabel);
    passCard.appendChild(newPassField);

    const confirmField = h("div", { class: "settings-field" });
    confirmField.appendChild(h("label", {}, ["تأكيد كلمة المرور الجديدة"]));
    const confirmInp = h("input", {
      class: "settings-input",
      type: "password",
      placeholder: "أعد كتابة كلمة المرور الجديدة",
    });
    confirmField.appendChild(confirmInp);
    passCard.appendChild(confirmField);

    passCard.appendChild(
      h(
        "button",
        {
          class: "btn-primary",
          style: "margin-top:.5rem",
          onclick: () => {
            passSuccessEl.style.display = "none";
            passErrEl.style.display = "none";
            const old = oldPassInp.value;
            const nw = newPassInp.value;
            const conf = confirmInp.value;
            if (!old || !nw || !conf) {
              passErrEl.style.display = "block";
              passErrEl.textContent = "يرجى ملء جميع الحقول";
              return;
            }
            if (nw.length < 6) {
              passErrEl.style.display = "block";
              passErrEl.textContent = "كلمة المرور الجديدة 6 أحرف على الأقل";
              return;
            }
            if (nw !== conf) {
              passErrEl.style.display = "block";
              passErrEl.textContent =
                "كلمة المرور الجديدة وتأكيدها غير متطابقتين";
              return;
            }
            const res = Auth.changePassword(u.id, old, nw);
            if (res.error) {
              passErrEl.style.display = "block";
              passErrEl.textContent = res.error;
              return;
            }
            passSuccessEl.style.display = "block";
            oldPassInp.value = "";
            newPassInp.value = "";
            confirmInp.value = "";
            strengthFill.style.width = "0%";
            strengthLabel.textContent = "";
            showToast("تم تغيير كلمة المرور 🔒");
          },
        },
        ["تغيير كلمة المرور"],
      ),
    );
    wrap.appendChild(passCard);

    // ─── Avatar remove ───
    if (avatar) {
      const avatarCard = h("div", { class: "card" });
      avatarCard.appendChild(
        h("div", { class: "settings-label" }, ["🖼️ الصورة الشخصية"]),
      );
      avatarCard.appendChild(
        h(
          "p",
          {
            style:
              "font-size:.9rem;color:var(--text-muted);margin-bottom:.75rem",
          },
          ["لحذف صورتك الحالية والعودة إلى الحرف الأولي"],
        ),
      );
      avatarCard.appendChild(
        h(
          "button",
          {
            class: "btn-sm danger",
            onclick: () => {
              localStorage.removeItem("avatar_" + u.id);
              showToast("تم حذف الصورة الشخصية");
              App.render();
              App.page = "account";
              App.refreshContent();
            },
          },
          ["🗑 حذف الصورة الشخصية"],
        ),
      );
      wrap.appendChild(avatarCard);
    }

    return wrap;
  },

  // ══════════════════════════════════════
  //  DASHBOARD
  // ══════════════════════════════════════
  buildDashboard() {
    const data = this.getData();
    const dk = todayKey();
    const todayTasks = data.tasks.filter((t) => t.date === dk);
    const prayers = data.prayers[dk] || {};
    const prayerNames = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    const prayersDone = prayerNames.filter((p) => prayers[p] === "done").length;
    const tasksDone = todayTasks.filter((t) => t.done).length;
    const habitsDone = data.habits.filter(
      (hb) => hb.log && hb.log[dk] === "done",
    ).length;
    const activeDebts = data.debts.filter((d) => !d.settled).length;
    const wrap = h("div", {});

    const statsGrid = h("div", { class: "stats-grid" });
    for (const s of [
      { n: `${prayersDone}/5`, l: "الصلوات اليوم", icon: "🕌" },
      { n: `${tasksDone}/${todayTasks.length}`, l: "مهام اليوم", icon: "✅" },
      { n: `${habitsDone}/${data.habits.length}`, l: "العادات", icon: "🔄" },
      { n: activeDebts, l: "ديون نشطة", icon: "💰" },
    ]) {
      statsGrid.appendChild(
        h("div", { class: "stat-card" }, [
          h("div", { class: "stat-num" }, [s.icon + " " + s.n]),
          h("div", { class: "stat-label" }, [s.l]),
        ]),
      );
    }
    wrap.appendChild(statsGrid);

    const pCard = h("div", { class: "card", style: "margin-bottom:1rem" });
    pCard.appendChild(
      h("div", { class: "card-header" }, [
        h("div", { class: "card-title" }, ["🕌 الصلوات"]),
        h(
          "button",
          {
            class: "btn-sm outline",
            onclick: () => {
              App.page = "prayers";
              App.refreshContent();
            },
          },
          ["إدارة"],
        ),
      ]),
    );
    pCard.appendChild(this.buildPrayerButtons(prayers, dk, data));
    wrap.appendChild(pCard);

    const grid = h("div", { class: "dash-grid" });
    const tCard = h("div", { class: "card" });
    tCard.appendChild(
      h("div", { class: "card-header" }, [
        h("div", { class: "card-title" }, ["✅ مهام اليوم"]),
        h(
          "button",
          {
            class: "btn-sm outline",
            onclick: () => {
              App.page = "tasks";
              App.refreshContent();
            },
          },
          ["عرض الكل"],
        ),
      ]),
    );
    if (todayTasks.length === 0)
      tCard.appendChild(
        h("div", { class: "empty" }, [
          h("span", { class: "empty-icon" }, ["📋"]),
          "لا توجد مهام اليوم",
        ]),
      );
    else {
      const list = h("div", { class: "item-list" });
      todayTasks
        .slice(0, 4)
        .forEach((t) => list.appendChild(this.buildTaskRow(t, data, true)));
      tCard.appendChild(list);
    }
    grid.appendChild(tCard);

    const hCard = h("div", { class: "card" });
    hCard.appendChild(
      h("div", { class: "card-header" }, [
        h("div", { class: "card-title" }, ["🔄 العادات"]),
      ]),
    );
    if (data.habits.length === 0)
      hCard.appendChild(
        h("div", { class: "empty" }, [
          h("span", { class: "empty-icon" }, ["📋"]),
          "لا توجد عادات",
        ]),
      );
    else {
      const list = h("div", { class: "item-list" });
      data.habits
        .slice(0, 4)
        .forEach((hb) => list.appendChild(this.buildHabitRow(hb, data, true)));
      hCard.appendChild(list);
    }
    grid.appendChild(hCard);
    wrap.appendChild(grid);

    const todayJournal = data.journal.find((j) => j.date === dk);
    const jCard = h("div", { class: "card", style: "margin-top:1rem" });
    jCard.appendChild(
      h("div", { class: "card-header" }, [
        h("div", { class: "card-title" }, ["📔 تدوينة اليوم"]),
        h(
          "button",
          {
            class: "btn-sm outline",
            onclick: () => {
              App.page = "journal";
              App.refreshContent();
            },
          },
          ["اليوميات"],
        ),
      ]),
    );
    if (todayJournal)
      jCard.appendChild(
        h("div", { class: "journal-entry-text", style: "line-height:1.8" }, [
          todayJournal.text || "",
        ]),
      );
    else
      jCard.appendChild(
        h("div", { class: "empty" }, [
          h("span", { class: "empty-icon" }, ["✍️"]),
          "لم تكتب شيئاً اليوم بعد",
        ]),
      );
    wrap.appendChild(jCard);
    return wrap;
  },

  buildPrayerButtons(prayers, dk, data) {
    const prayerNames = [
      { id: "fajr", label: "الفجر" },
      { id: "dhuhr", label: "الظهر" },
      { id: "asr", label: "العصر" },
      { id: "maghrib", label: "المغرب" },
      { id: "isha", label: "العشاء" },
    ];
    const grid = h("div", { class: "prayers-grid" });
    for (const p of prayerNames) {
      const status = prayers[p.id] || "";
      grid.appendChild(
        h(
          "div",
          {
            class:
              "prayer-btn" +
              (status === "done"
                ? " done"
                : status === "missed"
                  ? " missed"
                  : ""),
            onclick: () => {
              if (!data.prayers[dk]) data.prayers[dk] = {};
              const cur = data.prayers[dk][p.id] || "";
              data.prayers[dk][p.id] =
                cur === "done" ? "missed" : cur === "missed" ? "" : "done";
              DB.saveUserData(App.currentUser.id, data);
              App.refreshContent();
            },
          },
          [
            h("span", { class: "prayer-icon" }, [
              status === "done" ? "✅" : status === "missed" ? "❌" : "🕌",
            ]),
            h("span", { class: "prayer-name" }, [p.label]),
          ],
        ),
      );
    }
    return grid;
  },

  // ══════════════════════════════════════
  //  TASKS
  // ══════════════════════════════════════
  buildTasks() {
    const data = this.getData();
    const dk = todayKey();
    const todayTasks = data.tasks.filter((t) => t.date === dk);
    const wrap = h("div", {});
    wrap.appendChild(h("div", { class: "section-title" }, ["✅ مهام اليوم"]));
    const card = h("div", { class: "card" });
    const list = h("div", { class: "item-list" });
    if (todayTasks.length === 0)
      list.appendChild(
        h("div", { class: "empty" }, [
          h("span", { class: "empty-icon" }, ["📋"]),
          "أضف مهامك ليوم اليوم",
        ]),
      );
    else
      todayTasks.forEach((t) =>
        list.appendChild(this.buildTaskRow(t, data, false)),
      );
    card.appendChild(list);
    const addRow = h("div", { class: "add-row" });
    const inp = h("input", {
      class: "add-input",
      placeholder: "أضف مهمة جديدة...",
    });
    const btn = h(
      "button",
      {
        class: "btn-add",
        onclick: () => {
          const v = inp.value.trim();
          if (!v) return;
          data.tasks.push({
            id: "t_" + Date.now(),
            text: v,
            done: false,
            date: dk,
            priority: "normal",
          });
          DB.saveUserData(App.currentUser.id, data);
          App.refreshContent();
        },
      },
      ["+ إضافة"],
    );
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") btn.click();
    });
    addRow.appendChild(inp);
    addRow.appendChild(btn);
    card.appendChild(addRow);
    wrap.appendChild(card);
    const older = data.tasks.filter((t) => t.date !== dk && !t.done);
    if (older.length > 0) {
      wrap.appendChild(
        h(
          "div",
          { class: "section-title", style: "margin-top:1.5rem;font-size:1rem" },
          ["📌 مهام سابقة غير منتهية"],
        ),
      );
      const oCard = h("div", { class: "card" });
      const oList = h("div", { class: "item-list" });
      older.forEach((t) =>
        oList.appendChild(this.buildTaskRow(t, data, false)),
      );
      oCard.appendChild(oList);
      wrap.appendChild(oCard);
    }
    return wrap;
  },

  buildTaskRow(task, data, readOnly) {
    const row = h("div", {
      class: "item-row" + (task.done ? " done-item" : ""),
    });
    row.appendChild(
      h(
        "div",
        {
          class: "checkbox" + (task.done ? " checked" : ""),
          onclick: readOnly
            ? null
            : () => {
                task.done = !task.done;
                DB.saveUserData(App.currentUser.id, data);
                App.refreshContent();
              },
        },
        [task.done ? "✓" : ""],
      ),
    );
    row.appendChild(h("span", { class: "item-text" }, [task.text]));
    if (!readOnly) {
      row.appendChild(
        h(
          "button",
          {
            class: "btn-del",
            onclick: () => {
              data.tasks = data.tasks.filter((t) => t.id !== task.id);
              DB.saveUserData(App.currentUser.id, data);
              App.refreshContent();
            },
          },
          ["🗑"],
        ),
      );
    }
    return row;
  },

  // ══════════════════════════════════════
  //  HABITS
  // ══════════════════════════════════════
  buildHabits() {
    const data = this.getData();
    const dk = todayKey();
    const wrap = h("div", {});
    wrap.appendChild(
      h("div", { class: "section-title" }, ["🔄 العادات اليومية"]),
    );
    const card = h("div", { class: "card" });
    const list = h("div", { class: "item-list" });
    if (data.habits.length === 0)
      list.appendChild(
        h("div", { class: "empty" }, [
          h("span", { class: "empty-icon" }, ["🔄"]),
          "لا توجد عادات مضافة بعد",
        ]),
      );
    else
      data.habits.forEach((hb) =>
        list.appendChild(this.buildHabitRow(hb, data, false)),
      );
    card.appendChild(list);
    const addRow = h("div", { class: "add-row" });
    const inp = h("input", {
      class: "add-input",
      placeholder: "أضف عادة جديدة...",
    });
    const btn = h(
      "button",
      {
        class: "btn-add",
        onclick: () => {
          const v = inp.value.trim();
          if (!v) return;
          data.habits.push({ id: "h_" + Date.now(), text: v, log: {} });
          DB.saveUserData(App.currentUser.id, data);
          App.refreshContent();
        },
      },
      ["+ إضافة"],
    );
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") btn.click();
    });
    addRow.appendChild(inp);
    addRow.appendChild(btn);
    card.appendChild(addRow);
    wrap.appendChild(card);
    if (data.habits.length > 0) {
      wrap.appendChild(
        h(
          "div",
          { class: "section-title", style: "margin-top:1.5rem;font-size:1rem" },
          ["📊 التقدم"],
        ),
      );
      const sCard = h("div", { class: "card" });
      data.habits.forEach((hb) => {
        const streak = this.calcStreak(hb.log);
        const row = h("div", { style: "margin-bottom:1rem" });
        row.appendChild(
          h(
            "div",
            {
              style:
                "display:flex;justify-content:space-between;margin-bottom:.25rem",
            },
            [
              h("span", { style: "font-weight:700" }, [hb.text]),
              h("span", { style: "color:var(--gold);font-size:.85rem" }, [
                streak + " يوم متتالي 🔥",
              ]),
            ],
          ),
        );
        const bar = h("div", { class: "progress-wrap" });
        bar.appendChild(
          h("div", {
            class: "progress-fill",
            style: "width:" + Math.min(100, streak * 10) + "%",
          }),
        );
        row.appendChild(bar);
        sCard.appendChild(row);
      });
      wrap.appendChild(sCard);
    }
    return wrap;
  },

  buildHabitRow(habit, data, readOnly) {
    const dk = todayKey();
    const status = (habit.log && habit.log[dk]) || "";
    const row = h("div", {
      class: "item-row" + (status === "done" ? " done-item" : ""),
    });
    row.appendChild(
      h(
        "div",
        {
          class: "checkbox" + (status === "done" ? " checked" : ""),
          onclick: readOnly
            ? null
            : () => {
                if (!habit.log) habit.log = {};
                habit.log[dk] = habit.log[dk] === "done" ? "" : "done";
                DB.saveUserData(App.currentUser.id, data);
                App.refreshContent();
              },
        },
        [status === "done" ? "✓" : ""],
      ),
    );
    row.appendChild(h("span", { class: "item-text" }, [habit.text]));
    if (!readOnly) {
      row.appendChild(
        h(
          "button",
          {
            class: "btn-del",
            onclick: () => {
              data.habits = data.habits.filter((hb) => hb.id !== habit.id);
              DB.saveUserData(App.currentUser.id, data);
              App.refreshContent();
            },
          },
          ["🗑"],
        ),
      );
    }
    return row;
  },

  calcStreak(log) {
    if (!log) return 0;
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 30; i++) {
      if (log[d.toISOString().split("T")[0]] === "done") streak++;
      else break;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  },

  // ══════════════════════════════════════
  //  PRAYERS
  // ══════════════════════════════════════
  buildPrayers() {
    const data = this.getData();
    const dk = todayKey();
    const prayers = data.prayers[dk] || {};
    const pNames = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    const wrap = h("div", {});
    wrap.appendChild(h("div", { class: "section-title" }, ["🕌 الصلوات"]));
    const card = h("div", { class: "card" });
    card.appendChild(
      h(
        "p",
        { style: "color:var(--text-muted);font-size:.9rem;margin-bottom:1rem" },
        ["اضغط على الصلاة لتغيير حالتها: ✅ أُديّت | ❌ فاتت | 🕌 لم تُسجّل"],
      ),
    );
    card.appendChild(this.buildPrayerButtons(prayers, dk, data));
    const done = pNames.filter((p) => prayers[p] === "done").length;
    const missed = pNames.filter((p) => prayers[p] === "missed").length;
    card.appendChild(h("div", { class: "divider" }));
    const sg = h("div", { style: "display:flex;gap:1rem;text-align:center" });
    for (const [val, label, color] of [
      [done, "مُؤدّاة", "var(--green)"],
      [missed, "فاتت", "var(--red)"],
      [5 - done - missed, "لم تُسجّل", "var(--text-muted)"],
    ]) {
      sg.appendChild(
        h(
          "div",
          {
            style:
              "flex:1;background:var(--bg-dark);border-radius:10px;padding:.75rem",
          },
          [
            h(
              "div",
              { style: `font-size:1.5rem;font-weight:800;color:${color}` },
              [val + ""],
            ),
            h("div", { style: "font-size:.8rem;color:var(--text-muted)" }, [
              label,
            ]),
          ],
        ),
      );
    }
    card.appendChild(sg);
    wrap.appendChild(card);
    wrap.appendChild(
      h(
        "div",
        { class: "section-title", style: "margin-top:1.5rem;font-size:1rem" },
        ["📅 آخر 7 أيام"],
      ),
    );
    const histCard = h("div", { class: "card" });
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = d.toISOString().split("T")[0];
      const p = data.prayers[k] || {};
      const dc = pNames.filter((n) => p[n] === "done").length;
      const row = h("div", {
        style:
          "display:flex;align-items:center;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid var(--border)",
      });
      row.appendChild(
        h("span", { style: "font-size:.9rem;color:var(--text-muted)" }, [
          i === 0
            ? "اليوم"
            : d.toLocaleDateString("ar-EG", {
                weekday: "short",
                day: "numeric",
                month: "short",
              }),
        ]),
      );
      const pRow = h("div", { style: "display:flex;gap:.3rem" });
      pNames.forEach((pn) =>
        pRow.appendChild(
          h("span", { style: "font-size:1rem" }, [
            p[pn] === "done" ? "✅" : p[pn] === "missed" ? "❌" : "⬜",
          ]),
        ),
      );
      row.appendChild(pRow);
      row.appendChild(
        h(
          "span",
          {
            style: `font-size:.85rem;font-weight:800;color:${dc >= 5 ? "var(--green)" : dc >= 3 ? "var(--amber)" : "var(--red)"}`,
          },
          [dc + "/5"],
        ),
      );
      histCard.appendChild(row);
    }
    wrap.appendChild(histCard);
    return wrap;
  },

  // ══════════════════════════════════════
  //  DEBTS
  // ══════════════════════════════════════
  buildDebts() {
    const data = this.getData();
    const wrap = h("div", {});
    wrap.appendChild(h("div", { class: "section-title" }, ["💰 تتبع الديون"]));
    const active = data.debts.filter((d) => !d.settled);
    const settled = data.debts.filter((d) => d.settled);
    const card = h("div", { class: "card" });
    card.appendChild(
      h("div", { class: "card-header" }, [
        h("div", { class: "card-title" }, ["الديون النشطة"]),
        h("span", { class: "badge" }, [active.length + ""]),
      ]),
    );
    if (active.length === 0)
      card.appendChild(
        h("div", { class: "empty" }, [
          h("span", { class: "empty-icon" }, ["💸"]),
          "لا توجد ديون نشطة",
        ]),
      );
    else {
      const list = h("div", { class: "item-list" });
      active.forEach((d) => list.appendChild(this.buildDebtRow(d, data)));
      card.appendChild(list);
    }
    card.appendChild(h("div", { class: "divider" }));
    card.appendChild(
      h(
        "div",
        {
          style:
            "font-weight:700;color:var(--text-muted);margin-bottom:.75rem;font-size:.9rem",
        },
        ["➕ إضافة دين"],
      ),
    );
    const form = h("div", { class: "debt-form" });
    const personInp = h("input", { class: "add-input", placeholder: "الشخص" });
    const amountInp = h("input", {
      class: "add-input",
      type: "number",
      placeholder: "المبلغ",
    });
    const noteInp = h("input", {
      class: "add-input",
      placeholder: "ملاحظة (اختياري)",
    });
    const dirSel = h("select", { class: "add-input" });
    dirSel.appendChild(h("option", { value: "owe" }, ["أنا مدين له"]));
    dirSel.appendChild(h("option", { value: "owed" }, ["هو مدين لي"]));
    [personInp, amountInp, noteInp, dirSel].forEach((e) => form.appendChild(e));
    card.appendChild(form);
    card.appendChild(
      h(
        "button",
        {
          class: "btn-add",
          style: "margin-top:.75rem",
          onclick: () => {
            const p = personInp.value.trim(),
              a = parseFloat(amountInp.value);
            if (!p || !a) return showToast("يرجى إدخال الشخص والمبلغ");
            data.debts.push({
              id: "d_" + Date.now(),
              person: p,
              amount: a,
              note: noteInp.value.trim(),
              direction: dirSel.value,
              settled: false,
              date: new Date().toISOString().split("T")[0],
            });
            DB.saveUserData(App.currentUser.id, data);
            App.refreshContent();
            showToast("تم إضافة الدين");
          },
        },
        ["حفظ الدين"],
      ),
    );
    wrap.appendChild(card);
    const iOwe = active
      .filter((d) => d.direction === "owe")
      .reduce((s, d) => s + d.amount, 0);
    const owedToMe = active
      .filter((d) => d.direction === "owed")
      .reduce((s, d) => s + d.amount, 0);
    const sGrid = h("div", { class: "stats-grid", style: "margin-top:1rem" });
    sGrid.appendChild(
      h("div", { class: "stat-card" }, [
        h(
          "div",
          {
            class: "stat-num",
            style: "color:var(--red);-webkit-text-fill-color:var(--red)",
          },
          [iOwe.toLocaleString("ar-EG")],
        ),
        h("div", { class: "stat-label" }, ["مديون به"]),
      ]),
    );
    sGrid.appendChild(
      h("div", { class: "stat-card" }, [
        h(
          "div",
          {
            class: "stat-num",
            style: "color:var(--green);-webkit-text-fill-color:var(--green)",
          },
          [owedToMe.toLocaleString("ar-EG")],
        ),
        h("div", { class: "stat-label" }, ["مستحق لي"]),
      ]),
    );
    wrap.appendChild(sGrid);
    if (settled.length > 0) {
      wrap.appendChild(
        h(
          "div",
          { class: "section-title", style: "margin-top:1.5rem;font-size:1rem" },
          ["✔ الديون المسدّدة"],
        ),
      );
      const sCard = h("div", { class: "card" });
      const sList = h("div", { class: "item-list" });
      settled.forEach((d) => sList.appendChild(this.buildDebtRow(d, data)));
      sCard.appendChild(sList);
      wrap.appendChild(sCard);
    }
    return wrap;
  },

  buildDebtRow(debt, data) {
    const row = h("div", {
      class: "debt-row" + (debt.settled ? " debt-settled" : ""),
    });
    row.appendChild(
      h(
        "span",
        { class: "debt-dir " + (debt.direction === "owe" ? "owe" : "owed") },
        [debt.direction === "owe" ? "مدين" : "دائن"],
      ),
    );
    const info = h("div", { style: "flex:1" });
    info.appendChild(h("div", { style: "font-weight:700" }, [debt.person]));
    if (debt.note)
      info.appendChild(h("div", { class: "item-meta" }, [debt.note]));
    info.appendChild(h("div", { class: "item-meta" }, [debt.date]));
    row.appendChild(info);
    row.appendChild(
      h("span", { class: "debt-amount" }, [
        debt.amount.toLocaleString("ar-EG"),
      ]),
    );
    if (!debt.settled) {
      row.appendChild(
        h(
          "button",
          {
            class: "btn-sm primary",
            onclick: () => {
              debt.settled = true;
              DB.saveUserData(App.currentUser.id, data);
              App.refreshContent();
              showToast("تم تسديد الدين");
            },
          },
          ["سدّد"],
        ),
      );
    }
    row.appendChild(
      h(
        "button",
        {
          class: "btn-del",
          onclick: () => {
            data.debts = data.debts.filter((d) => d.id !== debt.id);
            DB.saveUserData(App.currentUser.id, data);
            App.refreshContent();
          },
        },
        ["🗑"],
      ),
    );
    return row;
  },

  // ══════════════════════════════════════
  //  JOURNAL
  // ══════════════════════════════════════
  buildJournal() {
    const data = this.getData();
    const dk = todayKey();
    const existing = data.journal.find((j) => j.date === dk);
    const wrap = h("div", {});
    wrap.appendChild(h("div", { class: "section-title" }, ["📔 تدوينة اليوم"]));
    const card = h("div", { class: "card" });
    const moods = [
      { e: "😊", l: "سعيد" },
      { e: "😐", l: "عادي" },
      { e: "😔", l: "حزين" },
      { e: "😤", l: "متوتر" },
      { e: "🙏", l: "شاكر" },
    ];
    let selectedMood = existing ? existing.mood : "";
    const moodRow = h("div", { class: "journal-mood" });
    const updateMoods = () =>
      moodRow.querySelectorAll(".mood-btn").forEach((b, i) => {
        b.className =
          "mood-btn" + (moods[i].e === selectedMood ? " selected" : "");
      });
    moods.forEach((m) => {
      const btn = h(
        "button",
        {
          class: "mood-btn",
          title: m.l,
          onclick: () => {
            selectedMood = m.e;
            updateMoods();
          },
        },
        [m.e],
      );
      moodRow.appendChild(btn);
    });
    card.appendChild(
      h(
        "div",
        {
          style: "font-size:.9rem;color:var(--text-muted);margin-bottom:.5rem",
        },
        ["كيف حالك اليوم؟"],
      ),
    );
    card.appendChild(moodRow);
    const textarea = h("textarea", {
      class: "journal-textarea",
      placeholder: "اكتب ما حدث معك اليوم، أفكارك، مشاعرك...",
    });
    if (existing) textarea.value = existing.text || "";
    card.appendChild(textarea);
    card.appendChild(
      h(
        "button",
        {
          class: "btn-primary",
          style: "margin-top:.75rem",
          onclick: () => {
            const text = textarea.value.trim();
            if (!text) return showToast("اكتب شيئاً أولاً");
            if (existing) {
              existing.text = text;
              existing.mood = selectedMood;
            } else
              data.journal.push({
                id: "j_" + Date.now(),
                date: dk,
                text,
                mood: selectedMood,
              });
            DB.saveUserData(App.currentUser.id, data);
            showToast("تم حفظ التدوينة ✍️");
          },
        },
        ["حفظ التدوينة"],
      ),
    );
    wrap.appendChild(card);
    const past = data.journal
      .filter((j) => j.date !== dk)
      .sort((a, b) => b.date.localeCompare(a.date));
    if (past.length > 0) {
      wrap.appendChild(
        h(
          "div",
          { class: "section-title", style: "margin-top:1.5rem;font-size:1rem" },
          ["📚 التدوينات السابقة"],
        ),
      );
      const pCard = h("div", { class: "card" });
      past.slice(0, 10).forEach((j) => {
        const entry = h("div", { class: "journal-entry" });
        const dLabel = new Date(j.date).toLocaleDateString("ar-EG", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        entry.appendChild(
          h("div", { class: "journal-entry-date" }, [
            (j.mood ? j.mood + " " : "") + dLabel,
          ]),
        );
        entry.appendChild(h("div", { class: "journal-entry-text" }, [j.text]));
        entry.appendChild(
          h(
            "button",
            {
              class: "btn-del",
              style: "margin-top:.5rem;display:block",
              onclick: () => {
                data.journal = data.journal.filter((jj) => jj.id !== j.id);
                DB.saveUserData(App.currentUser.id, data);
                App.refreshContent();
              },
            },
            ["🗑 حذف"],
          ),
        );
        pCard.appendChild(entry);
      });
      wrap.appendChild(pCard);
    }
    return wrap;
  },

  // ══════════════════════════════════════
  //  HISTORY
  // ══════════════════════════════════════
  buildHistory() {
    const data = this.getData();
    const wrap = h("div", {});
    wrap.appendChild(
      h("div", { class: "section-title" }, ["📅 السجل التاريخي"]),
    );
    const datesSet = new Set();
    data.tasks.forEach((t) => datesSet.add(t.date));
    Object.keys(data.prayers).forEach((k) => datesSet.add(k));
    data.journal.forEach((j) => datesSet.add(j.date));
    const dates = [...datesSet].sort((a, b) => b.localeCompare(a));
    if (dates.length === 0) {
      wrap.appendChild(
        h("div", { class: "empty", style: "margin-top:2rem" }, [
          h("span", { class: "empty-icon" }, ["📅"]),
          "لا توجد سجلات بعد",
        ]),
      );
      return wrap;
    }
    const pNames = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    dates.slice(0, 30).forEach((dk) => {
      const dayTasks = data.tasks.filter((t) => t.date === dk);
      const dayPrayers = data.prayers[dk] || {};
      const pDone = pNames.filter((p) => dayPrayers[p] === "done").length;
      const tDone = dayTasks.filter((t) => t.done).length;
      const hbDone = data.habits.filter(
        (hb) => hb.log && hb.log[dk] === "done",
      ).length;
      const journal = data.journal.find((j) => j.date === dk);
      const item = h("div", { class: "history-item" });
      item.appendChild(
        h("div", { class: "history-date" }, [
          new Date(dk).toLocaleDateString("ar-EG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        ]),
      );
      const pills = h("div", { class: "history-pills" });
      pills.appendChild(
        h(
          "span",
          {
            class:
              "pill " + (pDone >= 5 ? "green" : pDone >= 3 ? "amber" : "red"),
          },
          ["🕌 " + pDone + "/5 صلوات"],
        ),
      );
      if (dayTasks.length > 0)
        pills.appendChild(
          h(
            "span",
            {
              class:
                "pill " +
                (tDone === dayTasks.length
                  ? "green"
                  : tDone > 0
                    ? "amber"
                    : "red"),
            },
            ["✅ " + tDone + "/" + dayTasks.length + " مهام"],
          ),
        );
      if (data.habits.length > 0)
        pills.appendChild(
          h("span", { class: "pill amber" }, [
            "🔄 " + hbDone + "/" + data.habits.length + " عادات",
          ]),
        );
      if (journal)
        pills.appendChild(
          h("span", { class: "pill pink" }, [
            "📔 يوميات " + (journal.mood || ""),
          ]),
        );
      item.appendChild(pills);
      wrap.appendChild(item);
    });
    return wrap;
  },
};

// ══════════════════════════════════════
//  BOOT
// ══════════════════════════════════════
App.init();
