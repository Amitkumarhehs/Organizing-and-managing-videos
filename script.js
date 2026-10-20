/* =============================================================
   My Learning Hub — application script
   Modular structure:
     Store      – safe localStorage helpers
     Theme      – light/dark mode
     Auth       – login/sign-up (demo mode, Firebase-ready)
     Progress   – lesson completion tracking
     Courses    – course catalogue data
     Lessons    – lesson list handling
     Player     – <video> player controls
     Dashboard  – stats & progress rendering
     UI         – nav, modal, scroll spy
   ============================================================= */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  /* ---------------------------------------------------------
     Store – localStorage wrapper (never throws)
     --------------------------------------------------------- */
  var Store = {
    get: function (key, fallback) {
      try {
        var raw = window.localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (err) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (err) {
        return false;
      }
    },
    remove: function (key) {
      try {
        window.localStorage.removeItem(key);
      } catch (err) {
        /* ignore */
      }
    }
  };

  var KEYS = {
    theme: "mlh.theme",
    user: "mlh.user",
    progress: "mlh.progress"
  };

  /* ---------------------------------------------------------
     Theme – light / dark mode
     --------------------------------------------------------- */
  var Theme = {
    init: function () {
      var saved = Store.get(KEYS.theme, null);
      var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      this.apply(saved || (prefersDark ? "dark" : "light"));

      var toggle = $("themeToggle");
      if (toggle) {
        toggle.addEventListener("click", function () {
          var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
          Theme.apply(next);
          Store.set(KEYS.theme, next);
        });
      }
    },
    apply: function (theme) {
      document.documentElement.setAttribute("data-theme", theme);
    }
  };

  /* ---------------------------------------------------------
     Auth – modular so a real provider can be plugged in later.
     Demo mode: no password is ever stored, nothing is verified.
     --------------------------------------------------------- */
  var Auth = {
    mode: "demo", // change to "firebase" once a backend is configured
    user: null,
    listeners: [],

    init: function () {
      var saved = Store.get(KEYS.user, null);
      if (saved && saved.email) {
        this.user = saved;
      }
      this.bind();
      this.render();
    },

    onChange: function (fn) {
      this.listeners.push(fn);
    },

    bind: function () {
      var self = this;

      [$("loginBtn"), $("footerAuthLink")].forEach(function (el) {
        if (!el) return;
        el.addEventListener("click", function (e) {
          e.preventDefault();
          UI.openAuth("login");
        });
      });

      var logout = $("logoutBtn");
      if (logout) {
        logout.addEventListener("click", function () {
          self.logout();
        });
      }

      var profileBtn = $("profileBtn");
      if (profileBtn) {
        profileBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          var menu = $("profileMenu");
          menu.hidden = !menu.hidden;
          profileBtn.setAttribute("aria-expanded", String(!menu.hidden));
        });
      }

      document.addEventListener("click", function () {
        var menu = $("profileMenu");
        if (menu && !menu.hidden) {
          menu.hidden = true;
          if (profileBtn) profileBtn.setAttribute("aria-expanded", "false");
        }
      });
    },

    /** Sign in / sign up. Returns {ok, message} or {ok, errors}. */
    submit: function (mode, data) {
      var errors = this.validate(mode, data);
      if (errors.length) {
        return { ok: false, errors: errors };
      }

      if (this.mode === "firebase") {
        return this.firebaseAuth(mode, data);
      }

      // Demo mode: a local session only. No password is stored.
      this.user = {
        email: data.email,
        name: data.name || data.email.split("@")[0],
        provider: "demo",
        signedInAt: Date.now()
      };
      Store.set(KEYS.user, this.user);
      this.render();
      this.notify();
      return {
        ok: true,
        message: mode === "signup" ? "Demo account created on this device." : "Signed in to demo mode."
      };
    },

    validate: function (mode, data) {
      var errors = [];
      var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

      if (mode === "signup" && (!data.name || data.name.trim().length < 2)) {
        errors.push({ field: "name", message: "Please enter your name." });
      }
      if (!emailRe.test(data.email || "")) {
        errors.push({ field: "email", message: "Please enter a valid email address." });
      }
      if (!data.password || data.password.length < 6) {
        errors.push({ field: "password", message: "Password must be at least 6 characters." });
      }
      if (mode === "signup" && data.password !== data.confirm) {
        errors.push({ field: "confirm", message: "Passwords do not match." });
      }
      return errors;
    },

    /**
     * Placeholder for a real provider.
     * Connect Firebase here later, e.g.:
     *   firebase.auth().createUserWithEmailAndPassword(email, password)
     * No credentials or secrets live in this file.
     */
    firebaseAuth: function (mode, data) {
      return Promise.resolve({
        ok: false,
        message: "Real authentication is not connected yet."
      });
    },

    logout: function () {
      this.user = null;
      Store.remove(KEYS.user);
      this.render();
      this.notify();
    },

    render: function () {
      var loginBtn = $("loginBtn");
      var profileWrap = $("profileWrap");
      var modePill = $("modePill");

      if (this.user) {
        if (loginBtn) loginBtn.hidden = true;
        if (profileWrap) profileWrap.hidden = false;
        var name = this.user.name || this.user.email;
        var initial = name.charAt(0).toUpperCase();
        if ($("avatar")) $("avatar").textContent = initial;
        if ($("profileName")) $("profileName").textContent = name;
        if ($("menuName")) $("menuName").textContent = name;
        if ($("menuEmail")) $("menuEmail").textContent = this.user.email;
      } else {
        if (loginBtn) loginBtn.hidden = false;
        if (profileWrap) profileWrap.hidden = true;
      }

      if (modePill) {
        if (this.mode === "firebase") {
          modePill.textContent = "Signed in with a real account";
          modePill.classList.add("live");
        } else {
          modePill.textContent = this.user
            ? "Demo mode — progress saved on this device"
            : "Demo mode — sign in to track progress";
          modePill.classList.remove("live");
        }
      }

      var welcome = $("dashWelcome");
      if (welcome) {
        welcome.textContent = this.user
          ? "Welcome back, " + (this.user.name || this.user.email) + "!"
          : "Welcome! Sign in to save your progress, or just start watching.";
      }
    },

    notify: function () {
      var self = this;
      this.listeners.forEach(function (fn) { fn(self.user); });
    }
  };

  /* ---------------------------------------------------------
     Progress – non-sensitive learning progress in localStorage
     --------------------------------------------------------- */
  var Progress = {
    data: { completed: [], lastLesson: null, lastWatchedAt: null, watched: {} },

    init: function () {
      var saved = Store.get(KEYS.progress, null);
      if (saved && typeof saved === "object") {
        this.data.completed = saved.completed || [];
        this.data.lastLesson = saved.lastLesson || null;
        this.data.lastWatchedAt = saved.lastWatchedAt || null;
        this.data.watched = saved.watched || {};
      }
      if (!Array.isArray(this.data.completed)) this.data.completed = [];
      if (!this.data.watched || typeof this.data.watched !== "object") this.data.watched = {};
    },

    save: function () {
      Store.set(KEYS.progress, this.data);
    },

    isDone: function (id) {
      return this.data.completed.indexOf(id) !== -1;
    },

    toggle: function (id) {
      var index = this.data.completed.indexOf(id);
      if (index === -1) {
        this.data.completed.push(id);
      } else {
        this.data.completed.splice(index, 1);
      }
      this.save();
      return index === -1;
    },

    markWatched: function (id, seconds) {
      this.data.lastLesson = id;
      this.data.lastWatchedAt = Date.now();
      if (typeof seconds === "number" && seconds > 0) {
        this.data.watched[id] = Math.max(this.data.watched[id] || 0, Math.round(seconds));
      }
      this.save();
    },

    watchedSeconds: function (id) {
      return this.data.watched[id] || 0;
    },

    reset: function () {
      this.data = { completed: [], lastLesson: null, lastWatchedAt: null, watched: {} };
      this.save();
    }
  };

  /* ---------------------------------------------------------
     Courses – catalogue data
     --------------------------------------------------------- */
  var Courses = {
    items: [
      {
        id: "organizing-videos",
        title: "Organizing and Managing Videos",
        description: "Build a clean video library with folder structures, naming rules and smart searches.",
        level: "Beginner",
        lessons: 3,
        duration: "30 min",
        thumb: "blue",
        primary: true
      },
      {
        id: "editing-workflow",
        title: "Editing Workflow Essentials",
        description: "Move from raw footage to a finished cut with a repeatable, low-stress workflow.",
        level: "Intermediate",
        lessons: 3,
        duration: "31 min",
        thumb: "purple"
      },
      {
        id: "backup-export",
        title: "Backup, Export & Delivery",
        description: "Export the right format, back up your masters and deliver files to every platform.",
        level: "Advanced",
        lessons: 3,
        duration: "30 min",
        thumb: "indigo"
      }
    ],

    init: function () {
      this.render();
    },

    render: function () {
      var grid = $("courseGrid");
      if (!grid) return;

      grid.innerHTML = this.items.map(function (course) {
        return (
          '<article class="course-card" data-course="' + course.id + '">' +
            '<div class="course-thumb ' + course.thumb + '">' +
              '<span class="course-level">' + course.level + "</span>" +
            "</div>" +
            '<div class="course-body">' +
              "<h3>" + course.title + "</h3>" +
              "<p>" + course.description + "</p>" +
              '<div class="course-meta">' +
                "<span>" + course.lessons + " lessons</span>" +
                "<span>" + course.duration + "</span>" +
              "</div>" +
              '<button class="btn btn-outline course-start" type="button" data-course="' + course.id + '">Start course</button>' +
            "</div>" +
          "</article>"
        );
      }).join("");

      grid.querySelectorAll(".course-start").forEach(function (btn) {
        btn.addEventListener("click", function () {
          Lessons.focusCourse(btn.getAttribute("data-course"));
          var section = $("learning");
          if (section) section.scrollIntoView({ behavior: "smooth" });
          Lessons.select(0);
        });
      });
    }
  };

  /* ---------------------------------------------------------
     Lessons – reads the existing lesson buttons from the DOM
     and enriches them with duration + completion status.
     --------------------------------------------------------- */
  var Lessons = {
    items: [],
    activeIndex: 0,
    activeCourse: "organizing-videos",

    init: function () {
      var buttons = document.querySelectorAll("#lessonList .lesson-btn");
      var self = this;

      this.items = Array.prototype.map.call(buttons, function (btn, index) {
        return {
          index: index,
          id: "lesson" + (index + 1),
          btn: btn,
          src: btn.getAttribute("data-src"),
          title: btn.getAttribute("data-title") || "Lesson " + (index + 1),
          duration: btn.getAttribute("data-duration") || "--:--",
          desc: btn.getAttribute("data-desc") || ""
        };
      });

      this.enhanceButtons();
      this.bind();

      var countLabel = $("lessonCountLabel");
      if (countLabel) countLabel.textContent = this.items.length + " lessons";
    },

    enhanceButtons: function () {
      var self = this;
      this.items.forEach(function (lesson) {
        var btn = lesson.btn;

        if (!btn.querySelector(".lesson-duration")) {
          var dur = document.createElement("span");
          dur.className = "lesson-duration";
          dur.textContent = lesson.duration;
          btn.appendChild(dur);
        }

        if (!btn.querySelector(".lesson-check")) {
          var check = document.createElement("span");
          check.className = "lesson-check";
          check.setAttribute("aria-hidden", "true");
          check.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" ' +
            'stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>';
          btn.appendChild(check);
        }

        btn.addEventListener("click", function () {
          self.select(lesson.index);
        });
      });
    },

    bind: function () {
      var self = this;

      var prev = $("prevLessonBtn");
      if (prev) {
        prev.addEventListener("click", function () { self.select(self.activeIndex - 1); });
      }

      var next = $("nextLessonBtn");
      if (next) {
        next.addEventListener("click", function () { self.select(self.activeIndex + 1); });
      }

      var mark = $("markCompleteBtn");
      if (mark) {
        mark.addEventListener("click", function () {
          var lesson = self.items[self.activeIndex];
          if (!lesson) return;
          var nowDone = Progress.toggle(lesson.id);
          self.renderStatus();
          Dashboard.render();
          self.setActiveTitle(
            nowDone
              ? "Nice work — \"" + lesson.title + "\" marked as complete!"
              : "\"" + lesson.title + "\" marked as not complete."
          );
        });
      }
    },

    /** Play a lesson by index (clamped to the available range). */
    select: function (index) {
      if (!this.items.length) return;
      var target = Math.max(0, Math.min(index, this.items.length - 1));
      var lesson = this.items[target];

      this.activeIndex = target;
      this.items.forEach(function (item, i) {
        item.btn.classList.toggle("active", i === target);
      });

      Player.load(lesson.src);
      this.setActiveTitle(lesson.title);
      this.updateMeta();
      this.updateNavButtons();
      this.renderStatus();
      Progress.markWatched(lesson.id, 0);
      Dashboard.render();
    },

    setActiveTitle: function (text) {
      var el = $("nowPlaying");
      if (el) el.textContent = text;
    },

    updateMeta: function () {
      var lesson = this.items[this.activeIndex];
      if (!lesson) return;

      var chip = $("activeLessonChip");
      if (chip) chip.textContent = lesson.title + " of " + this.items.length;

      var desc = $("lessonDescription");
      if (desc) desc.textContent = lesson.desc || "Video lesson — press play to begin.";
    },

    updateNavButtons: function () {
      var prev = $("prevLessonBtn");
      var next = $("nextLessonBtn");
      if (prev) prev.disabled = this.activeIndex === 0;
      if (next) next.disabled = this.activeIndex === this.items.length - 1;
    },

    renderStatus: function () {
      this.items.forEach(function (lesson) {
        lesson.btn.classList.toggle("done", Progress.isDone(lesson.id));
      });
      var mark = $("markCompleteBtn");
      if (mark) {
        var done = Progress.isDone(this.items[this.activeIndex].id);
        mark.textContent = done ? "Marked as complete ✓" : "Mark as complete";
      }
    },

    focusCourse: function (courseId) {
      this.activeCourse = courseId;
      var course = Courses.items.filter(function (c) { return c.id === courseId; })[0];
      var sub = $("courseSub");
      if (sub) {
        sub.textContent = course
          ? "Now watching: " + course.title
          : "Watch the lessons of your selected course.";
      }
    }
  };

  /* ---------------------------------------------------------
     Player – the built-in <video> element
     --------------------------------------------------------- */
  var Player = {
    video: null,
    source: null,

    init: function () {
      this.video = $("videoPlayer");
      this.source = $("videoSource");
      if (!this.video) return;

      var self = this;

      this.video.addEventListener("timeupdate", function () { self.updateProgress(); });
      this.video.addEventListener("play", function () { self.updateProgress(); });
      this.video.addEventListener("ended", function () { self.completeCurrent(); });
      this.video.addEventListener("error", function () { self.showMissing(true); });
      this.source.addEventListener("error", function () { self.showMissing(true); });

      this.video.addEventListener("loadedmetadata", function () { self.showMissing(false); });

      // The source may already have failed before this script ran.
      if (this.video.error || this.video.networkState === 3) {
        this.showMissing(true);
      }
    },

    /** Show a friendly notice when the MP4 file is not present yet. */
    showMissing: function (visible) {
      var notice = $("videoMissing");
      if (notice) notice.hidden = !visible;
    },

    /** Load a new MP4 source and try to play it. */
    load: function (src) {
      if (!this.video || !src) return;

      if (this.source.getAttribute("src") !== src) {
        this.source.setAttribute("src", src);
        this.video.load();
      }

      var promise = this.video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {
          /* Autoplay blocked – native controls still allow manual play. */
        });
      }
    },

    updateProgress: function () {
      var lesson = Lessons.items[Lessons.activeIndex];
      if (!lesson || !this.video || !this.video.duration) return;

      var pct = Math.min(100, (this.video.currentTime / this.video.duration) * 100);
      var bar = $("lessonProgressBar");
      var text = $("lessonProgressText");
      if (bar) bar.style.width = pct + "%";
      if (text) text.textContent = Math.round(pct) + "% of this lesson watched";

      if (this.video.currentTime > 0) {
        Progress.markWatched(lesson.id, this.video.currentTime);
      }
    },

    completeCurrent: function () {
      var lesson = Lessons.items[Lessons.activeIndex];
      if (!lesson) return;

      if (!Progress.isDone(lesson.id)) {
        Progress.toggle(lesson.id);
        Lessons.renderStatus();
        Dashboard.render();
      }
      Progress.markWatched(lesson.id, this.video ? this.video.currentTime : 0);

      // Auto-advance to the next lesson when one is available.
      if (Lessons.activeIndex < Lessons.items.length - 1) {
        Lessons.select(Lessons.activeIndex + 1);
      }
    }
  };

  /* ---------------------------------------------------------
     Dashboard – stats, progress bar, continue learning
     --------------------------------------------------------- */
  var Dashboard = {
    init: function () {
      this.render();
      this.bind();
    },

    bind: function () {
      var start = $("startLearningBtn");
      if (start) {
        start.addEventListener("click", function () { UI.goToLearning(); });
      }

      var browse = $("browseCoursesBtn");
      if (browse) {
        browse.addEventListener("click", function () { UI.goToSection("courses"); });
      }

      var cont = $("continueBtn");
      if (cont) {
        cont.addEventListener("click", function () {
          UI.goToLearning();
          var target = Progress.data.lastLesson;
          var index = 0;
          Lessons.items.forEach(function (lesson, i) {
            if (lesson.id === target) index = i;
          });
          Lessons.select(index);
        });
      }
    },

    render: function () {
      var total = Lessons.items.length;
      var completed = Lessons.items.filter(function (l) { return Progress.isDone(l.id); }).length;
      var pct = total ? Math.round((completed / total) * 100) : 0;

      var set = function (id, value) {
        var el = $(id);
        if (el) el.textContent = value;
      };

      set("cardTotalLessons", total);
      set("cardCompleted", completed);
      set("cardProgress", pct + "%");
      set("progressLabel", completed + " of " + total + " lessons complete");

      var bar = $("progressBar");
      if (bar) bar.style.width = pct + "%";

      // Remaining time, based on the placeholder durations.
      var remaining = 0;
      Lessons.items.forEach(function (lesson) {
        if (!Progress.isDone(lesson.id)) {
          var parts = (lesson.duration || "").split(":");
          var mins = parseInt(parts[0], 10);
          var secs = parseInt(parts[1], 10);
          if (!isNaN(mins)) remaining += mins + (isNaN(secs) ? 0 : secs / 60);
        }
      });
      set("cardTimeLeft", Math.round(remaining) + "m");

      // Hero statistics.
      set("statLessons", total);
      set("statCourses", Courses.items.length);
      set("statDuration", Math.round((total * 10) / 6) / 10 + "h");

      // Continue learning + recently watched.
      var lastId = Progress.data.lastLesson;
      var last = null;
      Lessons.items.forEach(function (lesson) {
        if (lesson.id === lastId) last = lesson;
      });

      if (last) {
        set("continueTitle", "Continue: " + last.title);
        set(
          "continueText",
          Progress.isDone(last.id)
            ? "You already completed this one — or replay it any time."
            : "Jump back in and keep the momentum going."
        );

        var block = $("recentBlock");
        var item = $("recentItem");
        if (block) block.hidden = false;
        if (item) {
          item.innerHTML =
            "<div><strong>" + last.title + "</strong><small>" + last.duration +
            " &middot; " + (Progress.isDone(last.id) ? "Completed" : "In progress") +
            "</small></div>" +
            '<button class="btn btn-outline btn-sm" type="button" id="recentPlayBtn">Replay</button>';

          var replay = $("recentPlayBtn");
          if (replay) {
            replay.addEventListener("click", function () {
              UI.goToLearning();
              var index = 0;
              Lessons.items.forEach(function (lesson, i) {
                if (lesson.id === last.id) index = i;
              });
              Lessons.select(index);
            });
          }
        }
      } else {
        set("continueTitle", "Start with " + (Lessons.items[0] ? Lessons.items[0].title : "Lesson 1"));
        set("continueText", "Pick a lesson and pick up right where you stopped.");
        var block = $("recentBlock");
        if (block) block.hidden = true;
      }
    }
  };

  /* ---------------------------------------------------------
     UI – navigation, auth modal, scroll spy
     --------------------------------------------------------- */
  var UI = {
    authMode: "login",

    init: function () {
      this.bindNav();
      this.bindAuth();
      this.bindScrollSpy();
      this.setYear();
    },

    setYear: function () {
      var el = $("year");
      if (el) el.textContent = new Date().getFullYear();
    },

    bindNav: function () {
      var toggle = $("navToggle");
      var links = $("navLinks");
      if (toggle && links) {
        toggle.addEventListener("click", function () {
          var open = links.classList.toggle("open");
          toggle.setAttribute("aria-expanded", String(open));
        });
      }

      if (links) {
        links.querySelectorAll(".nav-link").forEach(function (link) {
          link.addEventListener("click", function () {
            links.classList.remove("open");
            if (toggle) toggle.setAttribute("aria-expanded", "false");
          });
        });
      }
    },

    goToSection: function (id) {
      var section = $(id);
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
    },

    goToLearning: function () {
      this.goToSection("learning");
    },

    bindScrollSpy: function () {
      var links = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));
      var sections = links
        .map(function (link) {
          var href = link.getAttribute("href") || "";
          return href.charAt(0) === "#" ? document.querySelector(href) : null;
        })
        .filter(Boolean);

      if (!sections.length || !("IntersectionObserver" in window)) return;

      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            links.forEach(function (link) {
              link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
            });
          });
        },
        { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
      );

      sections.forEach(function (section) { observer.observe(section); });
    },

    /* ---------------- Auth modal ---------------- */
    bindAuth: function () {
      var self = this;
      var modal = $("authModal");
      var form = $("authForm");
      if (!modal || !form) return;

      var close = $("authClose");
      if (close) {
        close.addEventListener("click", function () { self.closeAuth(); });
      }

      modal.addEventListener("click", function (e) {
        if (e.target === modal) self.closeAuth();
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !modal.hidden) self.closeAuth();
      });

      var tabLogin = $("tabLogin");
      var tabSignup = $("tabSignup");
      if (tabLogin) tabLogin.addEventListener("click", function () { self.openAuth("login"); });
      if (tabSignup) tabSignup.addEventListener("click", function () { self.openAuth("signup"); });

      var eye = $("togglePassword");
      if (eye) {
        eye.addEventListener("click", function () {
          var input = $("authPassword");
          var wrap = eye.parentNode;
          var showing = wrap.classList.toggle("showing");
          input.type = showing ? "text" : "password";
          eye.setAttribute("aria-label", showing ? "Hide password" : "Show password");
        });
      }

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        self.handleAuthSubmit();
      });

      ["authName", "authEmail", "authPassword", "authConfirm"].forEach(function (id) {
        var input = $(id);
        if (!input) return;
        input.addEventListener("input", function () { self.clearError(id); });
      });
    },

    openAuth: function (mode) {
      var modal = $("authModal");
      if (!modal) return;
      this.authMode = mode === "signup" ? "signup" : "login";
      this.applyAuthMode();
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      var email = $("authEmail");
      if (email) setTimeout(function () { email.focus(); }, 60);
    },

    closeAuth: function () {
      var modal = $("authModal");
      if (!modal) return;
      modal.hidden = true;
      document.body.style.overflow = "";
      this.clearAllErrors();
    },

    applyAuthMode: function () {
      var isSignup = this.authMode === "signup";
      var tabLogin = $("tabLogin");
      var tabSignup = $("tabSignup");
      var nameField = $("nameField");
      var confirmField = $("confirmField");
      var submit = $("authSubmit");
      var title = $("authTitle");
      var subtitle = $("authSubtitle");
      var password = $("authPassword");

      if (tabLogin) {
        tabLogin.classList.toggle("active", !isSignup);
        tabLogin.setAttribute("aria-selected", String(!isSignup));
      }
      if (tabSignup) {
        tabSignup.classList.toggle("active", isSignup);
        tabSignup.setAttribute("aria-selected", String(isSignup));
      }
      if (nameField) nameField.hidden = !isSignup;
      if (confirmField) confirmField.hidden = !isSignup;
      if (submit) submit.textContent = isSignup ? "Create account" : "Log in";
      if (title) title.textContent = isSignup ? "Create your account" : "Welcome back";
      if (subtitle) {
        subtitle.textContent = isSignup
          ? "Join the hub and track your learning progress."
          : "Log in to continue your learning journey.";
      }
      if (password) password.setAttribute("autocomplete", isSignup ? "new-password" : "current-password");

      this.clearAllErrors();
    },

    handleAuthSubmit: function () {
      var self = this;
      var msg = $("authMsg");
      var data = {
        name: ($("authName") || {}).value || "",
        email: (($("authEmail") || {}).value || "").trim(),
        password: ($("authPassword") || {}).value || "",
        confirm: ($("authConfirm") || {}).value || ""
      };

      var result = Auth.submit(this.authMode, data);

      if (result && result.ok) {
        if (msg) {
          msg.textContent = result.message || "Done.";
          msg.className = "auth-msg success";
        }
        setTimeout(function () { self.closeAuth(); }, 900);
        return;
      }

      this.clearAllErrors();
      if (result && result.errors) {
        result.errors.forEach(function (err) { self.showError(err.field, err.message); });
        if (msg) {
          msg.textContent = "Please fix the highlighted fields.";
          msg.className = "auth-msg fail";
        }
      } else if (msg) {
        msg.textContent = (result && result.message) || "Something went wrong.";
        msg.className = "auth-msg fail";
      }
    },

    showError: function (field, message) {
      var map = { name: "nameError", email: "emailError", password: "passwordError", confirm: "confirmError" };
      var errorEl = $(map[field]);
      if (errorEl) errorEl.textContent = message;

      var inputMap = { name: "authName", email: "authEmail", password: "authPassword", confirm: "authConfirm" };
      var input = $(inputMap[field]);
      if (input) input.classList.add("invalid");
    },

    clearError: function (field) {
      var map = { name: "nameError", email: "emailError", password: "passwordError", confirm: "confirmError" };
      var errorEl = $(map[field]);
      if (errorEl) errorEl.textContent = "";

      var inputMap = { name: "authName", email: "authEmail", password: "authPassword", confirm: "authConfirm" };
      var input = $(inputMap[field]);
      if (input) input.classList.remove("invalid");
    },

    clearAllErrors: function () {
      ["name", "email", "password", "confirm"].forEach(function (field) {
        UI.clearError(field);
      });
      var msg = $("authMsg");
      if (msg) {
        msg.textContent = "";
        msg.className = "auth-msg";
      }
    }
  };

  /* ---------------------------------------------------------
     Bootstrap
     --------------------------------------------------------- */
  function init() {
    Theme.init();
    Auth.init();
    Progress.init();
    Courses.init();
    Lessons.init();
    Player.init();
    Dashboard.init();
    UI.init();

    // Restore the previously watched lesson, if any.
    if (Progress.data.lastLesson) {
      var index = 0;
      Lessons.items.forEach(function (lesson, i) {
        if (lesson.id === Progress.data.lastLesson) index = i;
      });
      Lessons.activeIndex = index;
      Lessons.items.forEach(function (lesson, i) {
        lesson.btn.classList.toggle("active", i === index);
      });
      Lessons.updateMeta();
      Lessons.updateNavButtons();
      Lessons.renderStatus();
    }

    Auth.onChange(function () {
      Dashboard.render();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();








