import coursesData from "../data/courses.json";
import "./styles.css";
import { storage } from "./services/storage.js";
import { startRemoteSync, stopRemoteSync } from "./services/remote-sync.js";
import {
  getAccountSession,
  hasSupabaseConfig,
  sendPasswordReset,
  signInAccount,
  signOutAccount,
  signUpAccount,
  watchAccountAuth,
} from "./services/account-service.js";

const root = document.querySelector("#app");
const PROFILE_KEY = "sejongGreen.profiles.v1";
const SESSION_KEY = "sejongGreen.session.v1";
const CONTENT_VERSION = coursesData.version;
const courses = coursesData.courses;
const courseById = new Map(courses.map(course => [course.id, course]));

const NAV_ITEMS = [
  ["dashboard", "Tổng quan", "⌂"],
  ["lessons", "Bài học", "▤"],
  ["vocabulary", "Từ vựng", "가"],
  ["flashcards", "Flashcard", "▱"],
  ["exercises", "Bài tập", "✓"],
  ["culture", "Văn hoá", "◉"],
  ["progress", "Tiến độ", "↗"],
];

const ui = {
  courseId: null,
  view: "courses",
  lessonId: null,
  vocabularySearch: "",
  vocabularyLesson: "all",
  flashLesson: "all",
  flashIndex: 0,
  flashFlipped: false,
  exerciseLesson: "all",
  syncStatus: "local",
  accountSession: null,
  accountMessage: "",
  accountError: "",
};

let profile;
let authUnsubscribe;
let noteTimer;

function parse(value, fallback) {
  try {
    return JSON.parse(value) ?? fallback;
  } catch {
    return fallback;
  }
}

function id() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function asset(relativePath) {
  return `${import.meta.env.BASE_URL}${relativePath}`;
}

function defaultCourseProgress() {
  return {
    completedLessons: [],
    completedExercises: [],
    masteredWords: [],
    notes: {},
    lastLesson: 1,
  };
}

function defaultProfile(name = "Học viên") {
  return {
    id: `local:${id()}`,
    name,
    createdAt: new Date().toISOString(),
    settings: { language: "vi", voiceURI: "", rate: 0.9 },
    progress: { courseState: {} },
  };
}

function readProfiles() {
  return parse(storage.local.getItem(PROFILE_KEY), []);
}

function writeProfiles(profiles) {
  storage.local.setItem(PROFILE_KEY, JSON.stringify(profiles));
}

function ensureLocalProfile() {
  const profiles = readProfiles();
  const sessionProfileId = storage.session.getItem(SESSION_KEY);
  let selected = profiles.find(item => item.id === sessionProfileId);
  if (!selected || selected.accountId) selected = profiles.find(item => !item.accountId);
  if (!selected) {
    selected = defaultProfile();
    writeProfiles([...profiles, selected]);
  }
  storage.session.setItem(SESSION_KEY, selected.id);
  return selected;
}

function accountProfile(userId) {
  return readProfiles().find(item => item.accountId === userId || item.id === `account:${userId}`);
}

function refreshProfile() {
  if (ui.accountSession?.user?.id) profile = accountProfile(ui.accountSession.user.id) || profile;
  else profile = ensureLocalProfile();
  profile.progress ||= {};
  profile.progress.courseState ||= {};
}

function courseProgress(courseId = ui.courseId) {
  profile.progress ||= {};
  profile.progress.courseState ||= {};
  profile.progress.courseState[courseId] ||= defaultCourseProgress();
  const state = profile.progress.courseState[courseId];
  state.completedLessons ||= [];
  state.completedExercises ||= [];
  state.masteredWords ||= [];
  state.notes ||= {};
  state.lastLesson ||= 1;
  return state;
}

function saveProfile() {
  const profiles = readProfiles();
  const index = profiles.findIndex(item => item.id === profile.id || (profile.accountId && item.accountId === profile.accountId));
  if (index >= 0) profiles[index] = profile;
  else profiles.push(profile);
  writeProfiles(profiles);
}

function selectedCourse() {
  return courseById.get(ui.courseId);
}

function selectedLesson() {
  return selectedCourse()?.lessons.find(lesson => lesson.id === Number(ui.lessonId));
}

function allCourseVocabulary(course = selectedCourse()) {
  return course?.lessons.flatMap(lesson => lesson.vocabulary) || [];
}

function progressPercent(course) {
  if (!course) return 0;
  const progress = courseProgress(course.id);
  const total = course.lessons.length + course.lessons.reduce((sum, lesson) => sum + lesson.exercises.length, 0);
  const complete = progress.completedLessons.length + progress.completedExercises.length;
  return total ? Math.round((complete / total) * 100) : 0;
}

function parseRoute() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (!parts.length || parts[0] === "courses" || !courseById.has(parts[0])) {
    ui.courseId = null;
    ui.view = "courses";
    ui.lessonId = null;
    return;
  }
  ui.courseId = parts[0];
  ui.view = parts[1] || "dashboard";
  ui.lessonId = parts[2] ?? null;
  if (ui.view === "lesson" && ui.lessonId === null) ui.view = "lessons";
}

function navigate(courseId, view = "dashboard", detail = null) {
  const suffix = detail === null ? "" : `/${detail}`;
  location.hash = courseId ? `${courseId}/${view}${suffix}` : "courses";
}

function iconButton(action, label, icon, extra = "") {
  return `<button class="icon-button" type="button" data-action="${action}" aria-label="${escapeHtml(label)}" ${extra}>${icon}</button>`;
}

function renderHeader(course) {
  const accountLabel = ui.accountSession?.user?.email || profile?.name || "Học viên";
  const syncCopy = {
    synced: "Đã đồng bộ",
    saving: "Đang lưu",
    connecting: "Đang kết nối",
    offline: "Ngoại tuyến",
    error: "Lỗi đồng bộ",
    local: "Lưu trên máy",
  }[ui.syncStatus] || "Lưu trên máy";
  return `
    <header class="topbar">
      <button class="brand" type="button" data-action="go-courses" aria-label="Chọn giáo trình">
        <img src="${asset("assets/sejong-green.webp")}" alt="" />
        <span><b>Học tiếng Hàn</b><small>để thành kà su</small></span>
      </button>
      ${course ? `
        <button class="course-chip" type="button" data-action="go-courses">
          <span>${escapeHtml(course.titleKo)}</span><b>${escapeHtml(course.title)}</b><i>Đổi sách</i>
        </button>
      ` : `<span class="topbar-prompt">Hai giáo trình, hai lộ trình riêng biệt</span>`}
      <button class="account-button" type="button" data-action="open-account">
        <span class="avatar">${escapeHtml((profile?.name || accountLabel).slice(0, 1).toUpperCase())}</span>
        <span><b>${escapeHtml(accountLabel)}</b><small>${escapeHtml(syncCopy)}</small></span>
      </button>
    </header>
  `;
}

function renderSidebar(course) {
  return `
    <aside class="sidebar" aria-label="Điều hướng ${escapeHtml(course.title)}">
      <div class="sidebar-course">
        <span>Đang học</span>
        <strong>${escapeHtml(course.title)}</strong>
        <small>${course.lessons.length} bài · ${course.vocabularyCount} mục từ</small>
      </div>
      <nav>
        ${NAV_ITEMS.map(([view, label, icon]) => `
          <button class="nav-item ${ui.view === view || (view === "lessons" && ui.view === "lesson") ? "active" : ""}"
            type="button" data-action="navigate" data-view="${view}">
            <span>${icon}</span><b>${label}</b>
          </button>
        `).join("")}
      </nav>
      <button class="switch-course" type="button" data-action="go-courses">⇄ Chuyển giáo trình</button>
    </aside>
  `;
}

function renderMobileNav() {
  return `
    <nav class="mobile-nav" aria-label="Điều hướng nhanh">
      ${NAV_ITEMS.slice(0, 6).map(([view, label, icon]) => `
        <button class="${ui.view === view || (view === "lessons" && ui.view === "lesson") ? "active" : ""}"
          type="button" data-action="navigate" data-view="${view}"><span>${icon}</span><small>${label}</small></button>
      `).join("")}
    </nav>
  `;
}

function renderCoursePicker() {
  return `
    <main id="main-content" class="course-picker">
      <section class="picker-intro">
        <span class="eyebrow">Chọn đúng cuốn đang học</span>
        <h1>Sejong 1 và Sejong 2<br />được tách thành hai khu vực riêng</h1>
        <p>Từ vựng, bài tập, tiến độ và file nghe của mỗi cuốn không trộn lẫn với nhau.</p>
      </section>
      <section class="course-grid" aria-label="Danh sách giáo trình">
        ${courses.map((course, index) => `
          <article class="course-card course-card-${index + 1}">
            <div class="course-number">0${index + 1}</div>
            <span class="book-label">Giáo trình gốc · ${course.pageCount} trang</span>
            <h2>${escapeHtml(course.title)}</h2>
            <h3>${escapeHtml(course.titleKo)}</h3>
            <p>${escapeHtml(course.description)}</p>
            <dl>
              <div><dt>Bài học</dt><dd>${course.lessons.length}</dd></div>
              <div><dt>Mục từ</dt><dd>${course.vocabularyCount}</dd></div>
              <div><dt>File nghe</dt><dd>${course.audioCount}</dd></div>
            </dl>
            <div class="course-progress"><span style="width:${progressPercent(course)}%"></span></div>
            <small>${progressPercent(course)}% tiến độ trong giáo trình này</small>
            <button class="primary-button" type="button" data-action="select-course" data-course="${course.id}">
              Vào khu vực ${escapeHtml(course.title)} <span>→</span>
            </button>
          </article>
        `).join("")}
      </section>
      <section class="source-note">
        <span>✓</span>
        <div><b>Nội dung theo đúng hai cuốn sách trên máy</b><p>Ảnh chỉ dùng cho bài tập cần nhìn hình; sách PDF gốc không được đăng nguyên cuốn.</p></div>
      </section>
    </main>
  `;
}

function sectionHeading(eyebrow, title, description = "") {
  return `<header class="page-heading"><span class="eyebrow">${escapeHtml(eyebrow)}</span><h1>${escapeHtml(title)}</h1>${description ? `<p>${escapeHtml(description)}</p>` : ""}</header>`;
}

function renderDashboard(course) {
  const progress = courseProgress();
  const nextLesson = course.lessons.find(lesson => lesson.id === progress.lastLesson) || course.lessons[0];
  const percent = progressPercent(course);
  return `
    ${sectionHeading(course.title, `Chào mừng trở lại ${course.titleKo}`, "Mọi nội dung bên dưới chỉ thuộc giáo trình đang chọn.")}
    <section class="hero-panel">
      <div>
        <span class="eyebrow">Tiếp tục đúng chỗ đã dừng</span>
        <h2>${nextLesson.id === 0 ? "Nhập môn" : `Bài ${nextLesson.id}`} · ${escapeHtml(nextLesson.titleVi)}</h2>
        <p>${escapeHtml(nextLesson.objectives.join(" · "))}</p>
        <button class="primary-button" type="button" data-action="open-lesson" data-lesson="${nextLesson.id}">Tiếp tục học <span>→</span></button>
      </div>
      <div class="progress-ring" style="--progress:${percent * 3.6}deg"><span><b>${percent}%</b><small>hoàn thành</small></span></div>
    </section>
    <section class="metric-grid">
      <article><span>▤</span><div><b>${course.lessons.length}</b><small>bài học riêng</small></div></article>
      <article><span>가</span><div><b>${course.vocabularyCount}</b><small>mục từ theo sách</small></div></article>
      <article><span>♪</span><div><b>${course.audioCount}</b><small>file nghe gốc</small></div></article>
      <article><span>✓</span><div><b>${progress.completedExercises.length}</b><small>bài tập đã làm</small></div></article>
    </section>
    <section class="dashboard-grid">
      <article class="panel">
        <div class="panel-heading"><div><span class="eyebrow">Bài học</span><h2>Lộ trình ${escapeHtml(course.title)}</h2></div><button class="text-button" type="button" data-action="navigate" data-view="lessons">Xem tất cả →</button></div>
        <div class="compact-lessons">
          ${course.lessons.slice(0, 5).map(lesson => renderCompactLesson(course, lesson)).join("")}
        </div>
      </article>
      <article class="panel audio-preview">
        <span class="eyebrow">File nghe</span><h2>Nghe theo đúng track của sách</h2>
        <p>Mỗi bài có hội thoại và bài luyện nghe được gắn đúng số track.</p>
        ${nextLesson.audio.slice(0, 2).map(renderAudio).join("")}
        <button class="secondary-button" type="button" data-action="open-lesson" data-lesson="${nextLesson.id}">Mở toàn bộ bài</button>
      </article>
    </section>
  `;
}

function renderCompactLesson(course, lesson) {
  const done = courseProgress(course.id).completedLessons.includes(lesson.id);
  return `
    <button class="compact-lesson" type="button" data-action="open-lesson" data-lesson="${lesson.id}">
      <span class="lesson-index">${lesson.id === 0 ? "가" : String(lesson.id).padStart(2, "0")}</span>
      <span><b>${escapeHtml(lesson.titleVi)}</b><small>${escapeHtml(lesson.titleKo)} · ${lesson.vocabulary.length} mục từ</small></span>
      <i class="${done ? "done" : ""}">${done ? "✓" : "→"}</i>
    </button>
  `;
}

function renderLessons(course) {
  const progress = courseProgress();
  return `
    ${sectionHeading(course.title, "Danh sách bài học", `${course.lessons.length} bài được sắp đúng thứ tự trong ${course.source}.`)}
    <section class="lesson-grid">
      ${course.lessons.map(lesson => {
        const done = progress.completedLessons.includes(lesson.id);
        return `
          <article class="lesson-card ${done ? "completed" : ""}">
            <div class="lesson-card-top"><span>${lesson.id === 0 ? "Nhập môn" : `Bài ${String(lesson.id).padStart(2, "0")}`}</span><i>${done ? "✓ Đã học" : `tr. ${lesson.pages[0]}–${lesson.pages[1]}`}</i></div>
            <h2>${escapeHtml(lesson.titleVi)}</h2><h3>${escapeHtml(lesson.titleKo)}</h3>
            <p>${escapeHtml(lesson.objectives.join(" · "))}</p>
            <div class="lesson-tags">
              ${lesson.grammar.map(item => `<span>${escapeHtml(item.form)}</span>`).join("")}
              <span>${lesson.vocabulary.length} mục từ</span><span>${lesson.audio.length} track</span>
            </div>
            <button class="primary-button" type="button" data-action="open-lesson" data-lesson="${lesson.id}">Mở bài học <span>→</span></button>
          </article>
        `;
      }).join("")}
    </section>
  `;
}

function renderAudio(item) {
  if (!item?.path) return "";
  return `
    <div class="audio-row">
      <span class="track-number">${String(item.number).padStart(2, "0")}</span>
      <div><b>${escapeHtml(item.label)}</b><small>Track ${String(item.number).padStart(2, "0")}</small></div>
      <audio controls preload="none" src="${asset(item.path)}">Trình duyệt không hỗ trợ audio.</audio>
    </div>
  `;
}

function renderOrigin(item, compact = false) {
  if (item.originType === "native") {
    return `<div class="origin-box native"><span>Phân loại</span><b>Từ thuần Hàn</b></div>`;
  }
  if (item.originType === "sino") {
    const chinese = item.chineseEquivalent || item.hanja;
    return `
      <div class="origin-box sino">
        <span>Phân loại · Từ Hán–Hàn</span>
        <b>Liên hệ với từ tiếng Hán: ${escapeHtml(chinese)}</b>
        ${compact ? "" : `<small>Hán tự của từ Hàn: ${escapeHtml(item.hanja)}${item.hanviet ? ` · Âm Hán–Việt: ${escapeHtml(item.hanviet)}` : ""}</small>`}
      </div>
    `;
  }
  return `<div class="origin-box other"><span>Phân loại</span><b>${escapeHtml(item.originLabelVi)}</b></div>`;
}

function renderVocabularyCard(item) {
  const mastered = courseProgress().masteredWords.includes(item.id);
  return `
    <article class="vocab-card" data-vocab-card data-lesson="${item.lesson}" data-search="${escapeHtml(`${item.word} ${item.romanization} ${item.meaningVi}`.toLowerCase())}">
      <div class="vocab-top"><span>Bài ${item.lesson}</span><button type="button" data-action="speak" data-text="${escapeHtml(item.word)}" aria-label="Nghe ${escapeHtml(item.word)}">♪</button></div>
      <h2>${escapeHtml(item.word)}</h2><p class="romanization">${escapeHtml(item.romanization)}</p>
      <p class="meaning">${escapeHtml(item.meaningVi)}</p>
      ${renderOrigin(item, true)}
      <button class="master-button ${mastered ? "mastered" : ""}" type="button" data-action="toggle-word" data-word="${escapeHtml(item.id)}">${mastered ? "✓ Đã nhớ" : "+ Đánh dấu đã nhớ"}</button>
    </article>
  `;
}

function renderVocabulary(course) {
  const vocabulary = allCourseVocabulary(course);
  return `
    ${sectionHeading(course.title, "Từ vựng theo đúng giáo trình", `${vocabulary.length} mục từ được lấy từ phần mục lục từ vựng của ${course.source}.`)}
    <section class="filter-bar">
      <label class="search-field"><span>⌕</span><input data-filter="vocabulary-search" type="search" placeholder="Tìm từ Hàn, phiên âm hoặc nghĩa Việt" value="${escapeHtml(ui.vocabularySearch)}" /></label>
      <label><span>Bài học</span><select data-filter="vocabulary-lesson"><option value="all">Tất cả bài</option>${course.lessons.map(lesson => `<option value="${lesson.id}" ${ui.vocabularyLesson === String(lesson.id) ? "selected" : ""}>${lesson.id === 0 ? "Nhập môn" : `Bài ${lesson.id}`} · ${escapeHtml(lesson.titleVi)}</option>`).join("")}</select></label>
      <button class="secondary-button" type="button" data-action="navigate" data-view="flashcards">Học bằng flashcard →</button>
    </section>
    <div class="result-count" data-vocabulary-count>${vocabulary.length} mục từ trong ${escapeHtml(course.title)}</div>
    <section class="vocabulary-grid" data-vocabulary-grid>${vocabulary.map(renderVocabularyCard).join("")}</section>
    <div class="empty-state" data-vocabulary-empty hidden>Không tìm thấy mục từ phù hợp trong giáo trình này.</div>
  `;
}

function flashVocabulary(course) {
  const items = allCourseVocabulary(course);
  return ui.flashLesson === "all" ? items : items.filter(item => item.lesson === Number(ui.flashLesson));
}

function renderFlashcards(course) {
  const items = flashVocabulary(course);
  if (ui.flashIndex >= items.length) ui.flashIndex = 0;
  const item = items[ui.flashIndex];
  const progress = courseProgress();
  return `
    ${sectionHeading(course.title, "Flashcard", "Thẻ của Sejong 1 và Sejong 2 luôn được lọc theo giáo trình đang chọn.")}
    <section class="flash-toolbar">
      <label><span>Phạm vi</span><select data-filter="flash-lesson"><option value="all">Toàn bộ ${escapeHtml(course.title)}</option>${course.lessons.map(lesson => `<option value="${lesson.id}" ${ui.flashLesson === String(lesson.id) ? "selected" : ""}>${lesson.id === 0 ? "Nhập môn" : `Bài ${lesson.id}`} · ${escapeHtml(lesson.titleVi)}</option>`).join("")}</select></label>
      <span>${items.length ? ui.flashIndex + 1 : 0} / ${items.length}</span>
    </section>
    ${item ? `
      <section class="flash-stage">
        <button class="flash-arrow" type="button" data-action="flash-prev" aria-label="Từ trước">←<small>Từ trước</small></button>
        <button class="flashcard ${ui.flashFlipped ? "flipped" : ""}" type="button" data-action="flip-card" aria-label="Lật thẻ">
          <span class="flash-side flash-front"><small>Bài ${item.lesson} · Chạm để lật</small><strong>${escapeHtml(item.word)}</strong><i>${escapeHtml(item.romanization)}</i></span>
          <span class="flash-side flash-back"><small>Nghĩa</small><strong>${escapeHtml(item.meaningVi)}</strong>${renderOrigin(item)}<i>Trang ${item.sourcePage || "—"} · ${escapeHtml(course.source)}</i></span>
        </button>
        <button class="flash-arrow" type="button" data-action="flash-next" aria-label="Từ tiếp theo">→<small>Từ tiếp theo</small></button>
      </section>
      <section class="flash-actions">
        <button class="secondary-button" type="button" data-action="speak" data-text="${escapeHtml(item.word)}">♪ Nghe từ</button>
        <button class="review-button" type="button" data-action="toggle-word" data-word="${escapeHtml(item.id)}">${progress.masteredWords.includes(item.id) ? "↺ Đưa về ôn lại" : "✓ Đã nhớ"}</button>
      </section>
    ` : `<div class="empty-state">Bài này chưa có mục từ.</div>`}
  `;
}

function exerciseTitle(item) {
  return {
    "practice-1": "Luyện ngữ pháp 1",
    "practice-2": "Luyện ngữ pháp 2",
    listening: "Nghe và chọn đáp án",
    reading: "Đọc và viết",
    hangul: "Luyện Hangeul",
    "review-game": "Trò chơi ôn tập",
  }[item.kind] || "Bài tập";
}

function renderExerciseCard(item, lesson) {
  const key = `${ui.courseId}:${lesson.id}:${item.page}:${item.kind}`;
  const progress = courseProgress();
  const done = progress.completedExercises.includes(key);
  const note = progress.notes[key] || "";
  return `
    <article class="exercise-card ${done ? "completed" : ""}" data-exercise-card data-lesson="${lesson.id}">
      <button class="exercise-image" type="button" data-action="open-image" data-src="${asset(item.path)}" data-alt="${escapeHtml(`${exerciseTitle(item)} · trang ${item.page}`)}">
        <img src="${asset(item.path)}" alt="${escapeHtml(`${exerciseTitle(item)} của ${lesson.titleVi}, trang ${item.page}`)}" loading="lazy" />
        <span>Phóng to ảnh bài tập</span>
      </button>
      <div class="exercise-body">
        <span class="eyebrow">${lesson.id === 0 ? "Nhập môn" : `Bài ${lesson.id}`} · trang ${item.page}</span>
        <h3>${exerciseTitle(item)}</h3>
        <label>Ghi câu trả lời<textarea data-note-key="${escapeHtml(key)}" placeholder="Gõ câu trả lời hoặc ghi chú của bạn…">${escapeHtml(note)}</textarea></label>
        <button class="complete-button ${done ? "done" : ""}" type="button" data-action="toggle-exercise" data-key="${escapeHtml(key)}">${done ? "✓ Đã hoàn thành" : "Đánh dấu hoàn thành"}</button>
      </div>
    </article>
  `;
}

function renderExercises(course) {
  const exercises = course.lessons.flatMap(lesson => lesson.exercises.map(item => ({ item, lesson })));
  return `
    ${sectionHeading(course.title, "Bài tập có hình từ sách", "Ảnh được chụp từ đúng trang cần nhìn hình; có ô ghi câu trả lời và trạng thái hoàn thành riêng.")}
    <section class="filter-bar compact">
      <label><span>Bài học</span><select data-filter="exercise-lesson"><option value="all">Tất cả bài tập</option>${course.lessons.map(lesson => `<option value="${lesson.id}" ${ui.exerciseLesson === String(lesson.id) ? "selected" : ""}>${lesson.id === 0 ? "Nhập môn" : `Bài ${lesson.id}`} · ${escapeHtml(lesson.titleVi)}</option>`).join("")}</select></label>
      <div class="source-badge">${exercises.length} ảnh bài tập · ${escapeHtml(course.source)}</div>
    </section>
    <section class="exercise-grid">${exercises.map(({ item, lesson }) => renderExerciseCard(item, lesson)).join("")}</section>
  `;
}

function renderCulture(course) {
  return `
    ${sectionHeading(course.title, "Bài văn hoá", "Các đơn vị văn hoá được giữ đúng vị trí trong từng giáo trình.")}
    <section class="culture-list">
      ${course.cultures.map(culture => `
        <article class="culture-card">
          <div class="culture-copy"><span class="eyebrow">Văn hoá ${culture.id} · trang ${culture.pages[0]}–${culture.pages[1]}</span><h2>${escapeHtml(culture.titleVi)}</h2><h3>${escapeHtml(culture.titleKo)}</h3></div>
          <div class="culture-images">${culture.images.map(image => `<button type="button" data-action="open-image" data-src="${asset(image.path)}" data-alt="${escapeHtml(culture.titleVi)}"><img src="${asset(image.path)}" alt="${escapeHtml(`${culture.titleVi}, trang ${image.page}`)}" loading="lazy" /></button>`).join("")}</div>
        </article>
      `).join("")}
    </section>
  `;
}

function renderLesson(course, lesson) {
  const progress = courseProgress();
  const done = progress.completedLessons.includes(lesson.id);
  return `
    <button class="back-button" type="button" data-action="navigate" data-view="lessons">← Tất cả bài học ${escapeHtml(course.title)}</button>
    <header class="lesson-hero">
      <div><span class="eyebrow">${lesson.id === 0 ? "Phần nhập môn" : `Bài ${String(lesson.id).padStart(2, "0")}`} · trang ${lesson.pages[0]}–${lesson.pages[1]}</span><h1>${escapeHtml(lesson.titleVi)}</h1><h2>${escapeHtml(lesson.titleKo)}</h2><p>${escapeHtml(lesson.objectives.join(" · "))}</p></div>
      <button class="complete-button ${done ? "done" : ""}" type="button" data-action="toggle-lesson" data-lesson="${lesson.id}">${done ? "✓ Đã hoàn thành bài" : "Đánh dấu hoàn thành"}</button>
    </header>
    ${lesson.grammar.length ? `<section class="lesson-section"><div class="panel-heading"><div><span class="eyebrow">Ngữ pháp</span><h2>Mẫu câu của bài</h2></div></div><div class="grammar-grid">${lesson.grammar.map(item => `<article><b>${escapeHtml(item.form)}</b><p>${escapeHtml(item.noteVi)}</p></article>`).join("")}</div></section>` : ""}
    ${lesson.dialogues.length ? `<section class="lesson-section"><div class="panel-heading"><div><span class="eyebrow">Hội thoại</span><h2>Đọc và nghe theo track</h2></div></div><div class="dialogue-grid">${lesson.dialogues.map(dialogue => `<article class="dialogue-card"><div><span>Track ${dialogue.track}</span><h3>${escapeHtml(dialogue.title)}</h3></div><div class="dialogue-lines">${dialogue.lines.map(line => `<p>${escapeHtml(line)}</p>`).join("")}</div>${renderAudio(lesson.audio.find(item => item.number === dialogue.track))}</article>`).join("")}</div></section>` : ""}
    <section class="lesson-section"><div class="panel-heading"><div><span class="eyebrow">Từ vựng</span><h2>${lesson.vocabulary.length} mục từ trong bài</h2></div><button class="text-button" type="button" data-action="lesson-vocabulary" data-lesson="${lesson.id}">Xem toàn bộ →</button></div><div class="lesson-vocabulary">${lesson.vocabulary.slice(0, 12).map(renderVocabularyCard).join("")}</div></section>
    <section class="lesson-section"><div class="panel-heading"><div><span class="eyebrow">File nghe</span><h2>${lesson.audio.length} track đúng theo sách</h2></div></div><div class="audio-list">${lesson.audio.map(renderAudio).join("")}</div></section>
    ${lesson.exercises.length ? `<section class="lesson-section"><div class="panel-heading"><div><span class="eyebrow">Bài tập</span><h2>Ảnh bài tập cần nhìn hình</h2></div></div><div class="exercise-grid lesson-exercises">${lesson.exercises.map(item => renderExerciseCard(item, lesson)).join("")}</div></section>` : ""}
  `;
}

function renderProgress(course) {
  const progress = courseProgress();
  const vocabulary = allCourseVocabulary(course);
  const exerciseCount = course.lessons.reduce((sum, lesson) => sum + lesson.exercises.length, 0);
  return `
    ${sectionHeading(course.title, "Tiến độ học tập", `Tiến độ dưới đây chỉ tính cho ${course.title}, không gộp với giáo trình còn lại.`)}
    <section class="progress-summary">
      <div class="progress-ring large" style="--progress:${progressPercent(course) * 3.6}deg"><span><b>${progressPercent(course)}%</b><small>${escapeHtml(course.title)}</small></span></div>
      <div><span class="eyebrow">Tổng tiến độ</span><h2>${progress.completedLessons.length}/${course.lessons.length} bài đã hoàn thành</h2><p>${progress.completedExercises.length}/${exerciseCount} bài tập · ${progress.masteredWords.length}/${vocabulary.length} mục từ đã nhớ</p></div>
    </section>
    <section class="progress-lessons">
      ${course.lessons.map(lesson => {
        const lessonExercises = lesson.exercises.map(item => `${course.id}:${lesson.id}:${item.page}:${item.kind}`);
        const doneExercises = lessonExercises.filter(key => progress.completedExercises.includes(key)).length;
        const done = progress.completedLessons.includes(lesson.id);
        return `<button type="button" data-action="open-lesson" data-lesson="${lesson.id}"><span class="lesson-index">${lesson.id === 0 ? "가" : String(lesson.id).padStart(2, "0")}</span><span><b>${escapeHtml(lesson.titleVi)}</b><small>${doneExercises}/${lessonExercises.length} bài tập · ${lesson.vocabulary.filter(item => progress.masteredWords.includes(item.id)).length}/${lesson.vocabulary.length} từ</small></span><i class="${done ? "done" : ""}">${done ? "✓" : "→"}</i></button>`;
      }).join("")}
    </section>
  `;
}

function renderMain(course) {
  if (ui.view === "dashboard") return renderDashboard(course);
  if (ui.view === "lessons") return renderLessons(course);
  if (ui.view === "lesson") return renderLesson(course, selectedLesson() || course.lessons[0]);
  if (ui.view === "vocabulary") return renderVocabulary(course);
  if (ui.view === "flashcards") return renderFlashcards(course);
  if (ui.view === "exercises") return renderExercises(course);
  if (ui.view === "culture") return renderCulture(course);
  if (ui.view === "progress") return renderProgress(course);
  return renderDashboard(course);
}

function renderAccountDialog() {
  const configured = hasSupabaseConfig();
  const signedIn = Boolean(ui.accountSession?.user);
  return `
    <dialog id="account-dialog" class="account-dialog">
      <button class="dialog-close" type="button" data-action="close-account" aria-label="Đóng">×</button>
      <span class="eyebrow">Tài khoản và đồng bộ</span>
      <h2>${signedIn ? "Tài khoản đang đăng nhập" : "Học trên nhiều thiết bị"}</h2>
      ${ui.accountError ? `<p class="form-message error">${escapeHtml(ui.accountError)}</p>` : ""}
      ${ui.accountMessage ? `<p class="form-message success">${escapeHtml(ui.accountMessage)}</p>` : ""}
      ${signedIn ? `
        <div class="signed-account"><span class="avatar">${escapeHtml((profile?.name || "H").slice(0, 1))}</span><div><b>${escapeHtml(profile?.name || "Học viên")}</b><p>${escapeHtml(ui.accountSession.user.email || "")}</p><small>Tiến độ Sejong 1 và Sejong 2 được đồng bộ riêng trong cùng tài khoản.</small></div></div>
        <button class="danger-button" type="button" data-action="sign-out">Đăng xuất trên thiết bị này</button>
      ` : configured ? `
        <div class="auth-grid">
          <form data-form="sign-in"><h3>Đăng nhập</h3><label>Email<input required type="email" name="email" autocomplete="email" /></label><label>Mật khẩu<input required minlength="6" type="password" name="password" autocomplete="current-password" /></label><button class="primary-button" type="submit">Đăng nhập</button><button class="text-button" type="button" data-action="show-reset">Quên mật khẩu?</button></form>
          <form data-form="sign-up"><h3>Tạo tài khoản</h3><label>Tên hiển thị<input required maxlength="64" name="displayName" autocomplete="name" /></label><label>Email<input required type="email" name="email" autocomplete="email" /></label><label>Mật khẩu<input required minlength="6" type="password" name="password" autocomplete="new-password" /></label><button class="secondary-button" type="submit">Đăng ký miễn phí</button></form>
        </div>
        <form class="reset-form" data-form="reset" hidden><h3>Đặt lại mật khẩu</h3><label>Email<input required type="email" name="email" autocomplete="email" /></label><button class="secondary-button" type="submit">Gửi email đặt lại</button></form>
      ` : `<p>Website đang lưu tiến độ trên thiết bị này. Cần cấu hình Supabase khi phát hành để bật đăng nhập trực tuyến.</p>`}
    </dialog>
    <dialog id="image-dialog" class="image-dialog"><button class="dialog-close" type="button" data-action="close-image" aria-label="Đóng">×</button><img src="" alt="" /></dialog>
  `;
}

function render() {
  refreshProfile();
  const course = selectedCourse();
  document.documentElement.dataset.course = course?.id || "courses";
  document.title = course ? `${course.title} · Học tiếng Hàn để thành kà su` : "Học tiếng Hàn để thành kà su";
  root.innerHTML = `
    ${renderHeader(course)}
    ${course ? `<div class="app-layout">${renderSidebar(course)}<main id="main-content" class="content">${renderMain(course)}</main></div>${renderMobileNav()}` : renderCoursePicker()}
    <footer class="site-footer"><span>Học tiếng Hàn để thành kà su</span><small>Nội dung tách theo Sejong 1 / Sejong 2 · phiên bản ${escapeHtml(CONTENT_VERSION)}</small></footer>
    ${renderAccountDialog()}
  `;
  if (ui.view === "vocabulary") applyVocabularyFilter();
  if (ui.view === "exercises") applyExerciseFilter();
}

function applyVocabularyFilter() {
  const query = ui.vocabularySearch.trim().toLowerCase();
  let visible = 0;
  root.querySelectorAll("[data-vocab-card]").forEach(card => {
    const matchesLesson = ui.vocabularyLesson === "all" || card.dataset.lesson === ui.vocabularyLesson;
    const matchesQuery = !query || card.dataset.search.includes(query);
    card.hidden = !(matchesLesson && matchesQuery);
    if (!card.hidden) visible += 1;
  });
  const count = root.querySelector("[data-vocabulary-count]");
  if (count) count.textContent = `${visible} mục từ trong ${selectedCourse().title}`;
  const empty = root.querySelector("[data-vocabulary-empty]");
  if (empty) empty.hidden = visible > 0;
}

function applyExerciseFilter() {
  root.querySelectorAll("[data-exercise-card]").forEach(card => {
    card.hidden = ui.exerciseLesson !== "all" && card.dataset.lesson !== ui.exerciseLesson;
  });
}

function toggleInArray(array, value) {
  const index = array.indexOf(value);
  if (index >= 0) array.splice(index, 1);
  else array.push(value);
}

async function connectAccount(session) {
  ui.accountSession = session;
  if (!session?.user) {
    await stopRemoteSync({ flush: false });
    ui.syncStatus = "local";
    profile = ensureLocalProfile();
    render();
    return;
  }
  ui.syncStatus = "connecting";
  await startRemoteSync(storage, {
    user: session.user,
    preferredProfileId: profile?.id,
    onStatus(status) {
      ui.syncStatus = status;
      const label = root.querySelector(".account-button small");
      if (label) label.textContent = { synced: "Đã đồng bộ", saving: "Đang lưu", connecting: "Đang kết nối", offline: "Ngoại tuyến", error: "Lỗi đồng bộ" }[status] || status;
    },
    onRemoteChange() {
      refreshProfile();
      render();
    },
  });
  storage.session.setItem(SESSION_KEY, `account:${session.user.id}`);
  refreshProfile();
  render();
}

async function initializeAuth() {
  if (!hasSupabaseConfig()) return;
  try {
    const session = await getAccountSession();
    if (session) await connectAccount(session);
    authUnsubscribe = await watchAccountAuth((event, nextSession) => {
      if (event === "SIGNED_IN" && nextSession?.user?.id === ui.accountSession?.user?.id) return;
      if (["SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event) && nextSession) connectAccount(nextSession).catch(console.warn);
      if (event === "SIGNED_OUT") connectAccount(null).catch(console.warn);
    });
  } catch (error) {
    console.warn("Account initialization failed:", error);
    ui.syncStatus = "error";
    render();
  }
}

root.addEventListener("click", async event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;

  if (action === "select-course") navigate(button.dataset.course, "dashboard");
  if (action === "go-courses") navigate(null);
  if (action === "navigate" && ui.courseId) navigate(ui.courseId, button.dataset.view);
  if (action === "open-lesson") {
    const lessonId = Number(button.dataset.lesson);
    courseProgress().lastLesson = lessonId;
    saveProfile();
    navigate(ui.courseId, "lesson", lessonId);
  }
  if (action === "lesson-vocabulary") {
    ui.vocabularyLesson = button.dataset.lesson;
    navigate(ui.courseId, "vocabulary");
  }
  if (action === "toggle-lesson") {
    toggleInArray(courseProgress().completedLessons, Number(button.dataset.lesson));
    saveProfile();
    render();
  }
  if (action === "toggle-exercise") {
    toggleInArray(courseProgress().completedExercises, button.dataset.key);
    saveProfile();
    render();
  }
  if (action === "toggle-word") {
    toggleInArray(courseProgress().masteredWords, button.dataset.word);
    saveProfile();
    render();
  }
  if (action === "speak") {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(button.dataset.text);
    utterance.lang = "ko-KR";
    utterance.rate = profile.settings?.rate || 0.9;
    speechSynthesis.speak(utterance);
  }
  if (action === "flash-prev" || action === "flash-next") {
    const length = flashVocabulary(selectedCourse()).length;
    if (length) ui.flashIndex = (ui.flashIndex + (action === "flash-next" ? 1 : -1) + length) % length;
    ui.flashFlipped = false;
    render();
  }
  if (action === "flip-card") {
    ui.flashFlipped = !ui.flashFlipped;
    root.querySelector(".flashcard")?.classList.toggle("flipped", ui.flashFlipped);
  }
  if (action === "open-image") {
    const dialog = root.querySelector("#image-dialog");
    const image = dialog.querySelector("img");
    image.src = button.dataset.src;
    image.alt = button.dataset.alt || "Ảnh bài tập";
    dialog.showModal();
  }
  if (action === "close-image") root.querySelector("#image-dialog")?.close();
  if (action === "open-account") {
    ui.accountError = "";
    ui.accountMessage = "";
    root.querySelector("#account-dialog")?.showModal();
  }
  if (action === "close-account") root.querySelector("#account-dialog")?.close();
  if (action === "show-reset") root.querySelector(".reset-form")?.removeAttribute("hidden");
  if (action === "sign-out") {
    try {
      await signOutAccount();
      await connectAccount(null);
    } catch (error) {
      ui.accountError = error.message;
      render();
      root.querySelector("#account-dialog")?.showModal();
    }
  }
});

root.addEventListener("input", event => {
  if (event.target.matches('[data-filter="vocabulary-search"]')) {
    ui.vocabularySearch = event.target.value;
    applyVocabularyFilter();
  }
  if (event.target.matches("[data-note-key]")) {
    const key = event.target.dataset.noteKey;
    courseProgress().notes[key] = event.target.value;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(saveProfile, 400);
  }
});

root.addEventListener("change", event => {
  if (event.target.matches('[data-filter="vocabulary-lesson"]')) {
    ui.vocabularyLesson = event.target.value;
    applyVocabularyFilter();
  }
  if (event.target.matches('[data-filter="exercise-lesson"]')) {
    ui.exerciseLesson = event.target.value;
    applyExerciseFilter();
  }
  if (event.target.matches('[data-filter="flash-lesson"]')) {
    ui.flashLesson = event.target.value;
    ui.flashIndex = 0;
    ui.flashFlipped = false;
    render();
  }
});

root.addEventListener("submit", async event => {
  const form = event.target.closest("[data-form]");
  if (!form) return;
  event.preventDefault();
  const data = new FormData(form);
  ui.accountError = "";
  ui.accountMessage = "";
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  try {
    if (form.dataset.form === "sign-in") {
      const result = await signInAccount(data.get("email"), data.get("password"));
      await connectAccount(result.session);
      ui.accountMessage = "Đăng nhập thành công.";
    }
    if (form.dataset.form === "sign-up") {
      const result = await signUpAccount({ displayName: data.get("displayName"), email: data.get("email"), password: data.get("password") });
      if (result.session) await connectAccount(result.session);
      ui.accountMessage = result.session ? "Tài khoản đã được tạo." : "Đã tạo tài khoản. Hãy kiểm tra email để xác nhận.";
    }
    if (form.dataset.form === "reset") {
      await sendPasswordReset(data.get("email"));
      ui.accountMessage = "Đã gửi email đặt lại mật khẩu.";
    }
    render();
    root.querySelector("#account-dialog")?.showModal();
  } catch (error) {
    ui.accountError = error.message || "Không thể hoàn tất thao tác.";
    render();
    root.querySelector("#account-dialog")?.showModal();
  } finally {
    submit.disabled = false;
  }
});

window.addEventListener("hashchange", () => {
  parseRoute();
  render();
  window.scrollTo({ top: 0, behavior: "instant" });
});

window.addEventListener("beforeunload", () => {
  authUnsubscribe?.();
  stopRemoteSync().catch(() => {});
});

profile = ensureLocalProfile();
parseRoute();
render();
initializeAuth();
