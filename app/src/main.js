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
const REPORT_URL_KEY = "sejongGreen.reportUrl.v1";
const CONTENT_VERSION = coursesData.version;
const courses = coursesData.courses;
const courseById = new Map(courses.map(course => [course.id, course]));

const NAV_ITEMS = [
  ["dashboard", "Tổng quan", "⌂"],
  ["lessons", "Bài học", "▤"],
  ["vocabulary", "Từ vựng", "가"],
  ["flashcards", "Flashcard", "▱"],
  ["quiz", "Trắc nghiệm", "?"],
  ["listening", "Luyện nghe", "♪"],
  ["shadowing", "Shadowing", "◌"],
  ["writing", "Luyện viết", "✎"],
  ["reading", "Luyện đọc", "文"],
  ["culture", "Văn hoá", "◉"],
  ["progress", "Tiến độ", "↗"],
  ["reports", "Báo cáo", "!"],
  ["data", "Dữ liệu", "⇩"],
];

const ui = {
  courseId: null,
  view: "courses",
  lessonId: null,
  vocabularySearch: "",
  vocabularyLesson: "all",
  flashLesson: "all",
  flashDirection: "ko-vi",
  flashDeckMode: "lesson",
  flashDeckIds: [],
  flashIndex: 0,
  flashFlipped: false,
  quizLesson: "1",
  quizDirection: "both",
  quiz: null,
  listeningLesson: "1",
  listeningTranscript: false,
  listeningDictationFeedback: "",
  shadowLesson: "1",
  shadowDialogue: 0,
  shadowSentence: 0,
  recordings: new Map(),
  recording: null,
  shadowFeedback: "",
  writingLesson: "1",
  writingMode: "vocab",
  writingDeckIds: [],
  writingIndex: 0,
  writingFeedback: "",
  writingBookMessage: "",
  readingLesson: "1",
  readingMessage: "",
  importMode: "merge",
  syncStatus: "local",
  accountSession: null,
  accountMessage: "",
  accountError: "",
};

let profile;
let authUnsubscribe;
let noteTimer;
let speechSequenceId = 0;

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
    srs: {},
    reviewAgain: {},
    reviewHard: {},
    flashNotes: {},
    quizHistory: [],
    listening: {},
    shadow: {},
    writing: {},
    writingNotes: {},
    reading: {},
    reports: [],
    customVocabulary: [],
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
  state.srs ||= {};
  state.reviewAgain ||= {};
  state.reviewHard ||= {};
  state.flashNotes ||= {};
  state.quizHistory ||= [];
  state.listening ||= {};
  state.shadow ||= {};
  state.writing ||= {};
  state.writingNotes ||= {};
  state.reading ||= {};
  state.reports ||= [];
  state.customVocabulary ||= [];
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
  if (!course) return [];
  return [...course.lessons.flatMap(lesson => lesson.vocabulary), ...(courseProgress(course.id).customVocabulary || [])];
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + Number(days));
  return date.toISOString().slice(0, 10);
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function normalizeAnswer(value) {
  return String(value || "").normalize("NFC").trim().replace(/\s+/g, "").replace(/[.,!?\"'“”‘’]/g, "").toLowerCase();
}

function koreanVoices() {
  if (!("speechSynthesis" in window)) return [];
  return speechSynthesis.getVoices().filter(voice => voice.lang?.toLowerCase().startsWith("ko"));
}

function speakText(text, onend, options = {}) {
  if (!("speechSynthesis" in window) || !text) return false;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.rate = Number(options.rate ?? profile.settings?.rate) || 0.9;
  const voice = koreanVoices().find(item => item.voiceURI === profile.settings?.voiceURI);
  if (voice) utterance.voice = voice;
  if (onend) utterance.onend = onend;
  speechSynthesis.speak(utterance);
  return true;
}

function speakLines(lines, index = 0, sequenceId = null) {
  const currentSequence = sequenceId ?? ++speechSequenceId;
  if (!lines[index] || currentSequence !== speechSequenceId) return;
  const slowerRate = Math.max(0.65, (Number(profile.settings?.rate) || 0.9) - 0.12);
  speakText(lines[index], () => {
    window.setTimeout(() => speakLines(lines, index + 1, currentSequence), 700);
  }, { rate: slowerRate });
}

function answerSimilarity(expected, actual) {
  const left = normalizeAnswer(expected);
  const right = normalizeAnswer(actual);
  if (!left || !right) return 0;
  const rows = Array.from({ length: left.length + 1 }, (_, row) => [row]);
  for (let column = 0; column <= right.length; column += 1) rows[0][column] = column;
  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
    }
  }
  return Math.max(0, Math.round((1 - rows[left.length][right.length] / Math.max(left.length, right.length)) * 100));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function lessonOptions(course, selected, includeAll = false) {
  return `${includeAll ? `<option value="all" ${selected === "all" ? "selected" : ""}>Toàn bộ ${escapeHtml(course.title)}</option>` : ""}${course.lessons.map(lesson => `<option value="${lesson.id}" ${String(selected) === String(lesson.id) ? "selected" : ""}>${lesson.id === 0 ? "Nhập môn" : `Bài ${lesson.id}`} · ${escapeHtml(lesson.titleVi)}</option>`).join("")}`;
}

function scopedLesson(course, value, fallback = 1) {
  return course.lessons.find(lesson => lesson.id === Number(value)) || course.lessons.find(lesson => lesson.id === fallback) || course.lessons[0];
}

function progressPercent(course) {
  if (!course) return 0;
  const progress = courseProgress(course.id);
  const completedListening = Object.values(progress.listening).filter(item => item?.completed).length;
  const completedReading = Object.values(progress.reading).filter(item => item?.completed).length;
  const completedWriting = Object.values(progress.writing).filter(item => item?.text || item?.bookAnswer).length;
  const total = course.lessons.length * 4;
  const complete = progress.completedLessons.length + completedListening + completedReading + completedWriting;
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
  if (ui.view === "exercises") ui.view = "reading";
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
      ${NAV_ITEMS.map(([view, label, icon]) => `
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
      <article><span>文</span><div><b>${Object.values(progress.reading).filter(item => item?.completed).length}</b><small>bài đọc đã luyện</small></div></article>
    </section>
    <section class="quick-tools" aria-label="Công cụ luyện tập">
      ${[
        ["flashcards", "▱", "Flashcard", "Ôn từ chưa nhớ và từ khó"],
        ["quiz", "?", "Trắc nghiệm", "Kiểm tra hai chiều"],
        ["listening", "♪", "Luyện nghe", "Track đúng theo sách"],
        ["shadowing", "◌", "Shadowing", "Nghe, lặp và ghi âm"],
        ["writing", "✎", "Luyện viết", "Từ vựng, chính tả, bài viết"],
        ["reading", "文", "Luyện đọc", "Bài đọc lấy từ giáo trình"],
      ].map(([view, icon, title, copy]) => `<button type="button" data-action="navigate" data-view="${view}"><span>${icon}</span><b>${title}</b><small>${copy}</small></button>`).join("")}
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
      <button class="text-button" type="button" data-action="print-vocabulary">In danh sách</button>
    </section>
    <div class="result-count" data-vocabulary-count>${vocabulary.length} mục từ trong ${escapeHtml(course.title)}</div>
    <section class="vocabulary-grid" data-vocabulary-grid>${vocabulary.map(renderVocabularyCard).join("")}</section>
    <div class="empty-state" data-vocabulary-empty hidden>Không tìm thấy mục từ phù hợp trong giáo trình này.</div>
  `;
}

function flashSourceVocabulary(course, mode = ui.flashDeckMode) {
  const progress = courseProgress(course.id);
  const all = allCourseVocabulary(course);
  if (mode === "again") return all.filter(item => progress.reviewAgain[item.id]);
  if (mode === "hard") return all.filter(item => progress.reviewHard[item.id]);
  return ui.flashLesson === "all" ? all : all.filter(item => item.lesson === Number(ui.flashLesson));
}

function initializeFlashDeck(course, randomize = true) {
  const source = flashSourceVocabulary(course);
  ui.flashDeckIds = (randomize ? shuffle(source) : source).map(item => item.id);
  ui.flashIndex = 0;
  ui.flashFlipped = false;
}

function flashVocabulary(course) {
  const source = flashSourceVocabulary(course);
  const sourceById = new Map(source.map(item => [item.id, item]));
  const invalidDeck = ui.flashDeckIds.length !== source.length || ui.flashDeckIds.some(itemId => !sourceById.has(itemId));
  if (invalidDeck) initializeFlashDeck(course, false);
  return ui.flashDeckIds.map(itemId => sourceById.get(itemId)).filter(Boolean);
}

function rateFlashCard(item, rating) {
  const progress = courseProgress();
  const previous = progress.srs[item.id] || { level: 0, interval: 0, reviews: 0, lapses: 0, due: today() };
  const next = { ...previous, reviews: previous.reviews + 1, last: today() };
  if (rating === "again") {
    next.level = Math.max(0, previous.level - 1);
    next.interval = 0;
    next.due = today();
    next.lapses = (previous.lapses || 0) + 1;
    progress.reviewAgain[item.id] = today();
    delete progress.reviewHard[item.id];
    toggleInArray(progress.masteredWords, item.id, false);
  } else if (rating === "hard") {
    next.level = Math.max(1, previous.level || 1);
    next.interval = Math.max(2, Math.round((previous.interval || 1) * 1.6));
    next.due = addDays(next.interval);
    progress.reviewHard[item.id] = today();
    delete progress.reviewAgain[item.id];
    toggleInArray(progress.masteredWords, item.id, false);
  } else {
    next.level = Math.min(5, previous.level + 1);
    next.interval = [1, 3, 7, 16, 35, 70][next.level] || 70;
    next.due = addDays(next.interval);
    delete progress.reviewAgain[item.id];
    delete progress.reviewHard[item.id];
    toggleInArray(progress.masteredWords, item.id, true);
  }
  progress.srs[item.id] = next;
  saveProfile();
  const remaining = flashVocabulary(selectedCourse());
  ui.flashIndex = remaining.length ? (ui.flashIndex + 1) % remaining.length : 0;
  ui.flashFlipped = false;
  render();
}

function renderFlashcards(course) {
  const progress = courseProgress();
  const items = flashVocabulary(course);
  if (ui.flashIndex >= items.length) ui.flashIndex = 0;
  const item = items[ui.flashIndex];
  const againCount = Object.keys(progress.reviewAgain).filter(itemId => progress.reviewAgain[itemId]).length;
  const hardCount = Object.keys(progress.reviewHard).filter(itemId => progress.reviewHard[itemId]).length;
  const direction = ui.flashDirection === "both" ? (ui.flashIndex % 2 ? "vi-ko" : "ko-vi") : ui.flashDirection;
  const frontMain = item ? (direction === "ko-vi" ? item.word : item.meaningVi) : "";
  const note = item ? progress.flashNotes[item.id] || "" : "";
  return `
    ${sectionHeading(course.title, "Flashcard", "Giữ nguyên bộ ôn chưa nhớ, từ khó, hai chiều, ghi chú và lịch lặp ngắt quãng của web cũ.")}
    <section class="flash-deck-tabs">
      <button class="${ui.flashDeckMode === "lesson" ? "active" : ""}" type="button" data-action="flash-mode" data-mode="lesson">Tất cả từ trong bài <span>${flashSourceVocabulary(course, "lesson").length}</span></button>
      <button class="${ui.flashDeckMode === "again" ? "active" : ""}" type="button" data-action="flash-mode" data-mode="again">Ôn từ chưa thuộc <span>${againCount}</span></button>
      <button class="${ui.flashDeckMode === "hard" ? "active" : ""}" type="button" data-action="flash-mode" data-mode="hard">Ôn từ khó <span>${hardCount}</span></button>
    </section>
    <section class="flash-toolbar">
      <label><span>Phạm vi</span><select data-filter="flash-lesson">${lessonOptions(course, ui.flashLesson, true)}</select></label>
      <label><span>Chiều thẻ</span><select data-filter="flash-direction"><option value="both" ${ui.flashDirection === "both" ? "selected" : ""}>Hai chiều</option><option value="ko-vi" ${ui.flashDirection === "ko-vi" ? "selected" : ""}>Hàn → Việt</option><option value="vi-ko" ${ui.flashDirection === "vi-ko" ? "selected" : ""}>Việt → Hàn</option></select></label>
      <span>${items.length ? ui.flashIndex + 1 : 0} / ${items.length}</span>
    </section>
    ${item ? `
      <section class="flash-stage">
        <button class="flash-arrow" type="button" data-action="flash-prev" aria-label="Từ trước">←<small>Từ trước</small></button>
        <button class="flashcard ${ui.flashFlipped ? "flipped" : ""}" type="button" data-action="flip-card" aria-label="Lật thẻ">
          <span class="flash-side flash-front"><small>Bài ${item.lesson} · ${direction === "ko-vi" ? "Hàn → Việt" : "Việt → Hàn"} · Chạm để lật</small><strong>${escapeHtml(frontMain)}</strong>${direction === "ko-vi" ? `<i>${escapeHtml(item.romanization)}</i>` : ""}</span>
          <span class="flash-side flash-back"><small>Đáp án</small><strong>${escapeHtml(item.word)}</strong><i>${escapeHtml(item.romanization)} · ${escapeHtml(item.meaningVi)}</i>${renderOrigin(item)}<i>Trang ${item.sourcePage || "—"} · ${escapeHtml(course.source)}</i></span>
        </button>
        <button class="flash-arrow" type="button" data-action="flash-next" aria-label="Từ tiếp theo">→<small>Từ tiếp theo</small></button>
      </section>
      <section class="flash-actions">
        <button class="secondary-button" type="button" data-action="speak" data-text="${escapeHtml(item.word)}">♪ Nghe từ</button>
        <button class="secondary-button" type="button" data-action="flash-shuffle">⇄ Xáo trộn lại</button>
      </section>
      <section class="rating-row ${ui.flashFlipped ? "visible" : ""}" aria-label="Tự đánh giá">
        <button class="rating-again" type="button" data-action="flash-rate" data-rate="again">Chưa nhớ</button>
        <button class="rating-hard ${progress.reviewHard[item.id] ? "selected" : ""}" type="button" data-action="flash-rate" data-rate="hard">Khó</button>
        <button class="rating-known" type="button" data-action="flash-rate" data-rate="known">Đã nhớ</button>
      </section>
      <section class="word-note-panel">
        <div><b>Ghi chú của tôi</b><small>Đã tự động lưu</small></div>
        <textarea data-flash-note="${escapeHtml(item.id)}" placeholder="Ghi điều bạn cần nhớ về từ này…">${escapeHtml(note)}</textarea>
        <button class="text-button danger-text" type="button" data-action="delete-flash-note" data-word="${escapeHtml(item.id)}" ${note ? "" : "disabled"}>Xóa ghi chú</button>
      </section>
    ` : `<div class="empty-state"><h2>Bộ ôn này chưa có từ nào.</h2><p>Hãy đánh dấu “Chưa nhớ” hoặc “Khó” trong bộ thẻ toàn bài trước.</p><button class="primary-button" type="button" data-action="flash-mode" data-mode="lesson">Quay lại toàn bộ từ</button></div>`}
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

function renderReading(course) {
  const lesson = scopedLesson(course, ui.readingLesson);
  const reading = lesson.reading;
  const lines = reading?.lines || [];
  const completed = Boolean(courseProgress().reading[lesson.id]?.completed);
  return `
    ${sectionHeading(course.title, `Luyện đọc · ${lesson.id === 0 ? "Nhập môn" : `Bài ${lesson.id}`}`, "Đọc nội dung lấy trực tiếp từ đúng trang sách, nghe từng câu và lưu thêm từ mới gặp trong bài.")}
    <section class="practice-toolbar">
      <label><span>Bài học</span><select data-filter="reading-lesson">${lessonOptions(course, lesson.id)}</select></label>
      <div class="source-badge">${escapeHtml(course.source)} · trang ${reading?.page || "—"}</div>
      <button class="complete-button ${completed ? "done" : ""}" type="button" data-action="mark-reading" data-lesson="${lesson.id}">${completed ? "✓ Đã đọc" : "Đánh dấu đã đọc"}</button>
    </section>
    <section class="reading-layout">
      <article class="practice-panel reading-passage">
        <span class="eyebrow">Bài đọc trong sách · trang ${reading?.page || "—"}</span>
        <h2>${escapeHtml(lesson.titleVi)}</h2>
        ${lines.length ? `<div class="reading-lines">${lines.map(line => `<div><p>${escapeHtml(line)}</p><button class="icon-button" type="button" data-action="speak" data-text="${escapeHtml(line)}" aria-label="Nghe câu">♪</button></div>`).join("")}</div>` : `<div class="empty-state">Bài này chưa có đoạn đọc phù hợp để hiển thị.</div>`}
      </article>
      <form class="practice-panel reading-word-form" data-form="reading-add-word">
        <span class="eyebrow">Từ mới trong bài đọc</span><h2>Nạp thêm vào từ vựng</h2>
        ${ui.readingMessage ? `<div class="inline-feedback">${escapeHtml(ui.readingMessage)}</div>` : ""}
        <input type="hidden" name="lesson" value="${lesson.id}" />
        <label>Từ tiếng Hàn<input required name="word" placeholder="Ví dụ: 회사원" /></label>
        <label>Phiên âm RR<input required name="romanization" placeholder="hoesawon" /></label>
        <label>Nghĩa tiếng Việt<input required name="meaningVi" /></label>
        <label>Phân loại<select name="originType"><option value="native">Từ thuần Hàn</option><option value="sino">Từ Hán–Hàn</option><option value="loanword">Từ mượn</option><option value="expression">Cụm diễn đạt</option></select></label>
        <label>Hán tự / từ tiếng Hán liên hệ<input name="hanja" placeholder="Bắt buộc nếu là từ Hán–Hàn" /></label>
        <button class="primary-button" type="submit">Thêm vào ${escapeHtml(course.title)}</button>
      </form>
    </section>
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
    <section class="lesson-section lesson-practice-links"><div class="panel-heading"><div><span class="eyebrow">Luyện tập</span><h2>Chọn đúng kỹ năng cần luyện</h2></div></div><div><button class="secondary-button" type="button" data-action="lesson-practice" data-view="listening" data-lesson="${lesson.id}">♪ Luyện nghe</button><button class="secondary-button" type="button" data-action="lesson-practice" data-view="reading" data-lesson="${lesson.id}">文 Luyện đọc</button><button class="secondary-button" type="button" data-action="lesson-practice" data-view="writing" data-lesson="${lesson.id}">✎ Luyện viết</button></div></section>
  `;
}

function quizWords(course) {
  const words = allCourseVocabulary(course);
  return ui.quizLesson === "all" ? words : words.filter(item => item.lesson === Number(ui.quizLesson));
}

function startQuiz(course) {
  const words = shuffle(quizWords(course));
  ui.quiz = { words, index: 0, score: 0, answered: false, selected: "", current: null, mistakes: [], saved: false };
  render();
}

function currentQuizQuestion(course) {
  const quiz = ui.quiz;
  if (!quiz || quiz.index >= quiz.words.length) return null;
  if (quiz.current) return quiz.current;
  const word = quiz.words[quiz.index];
  const direction = ui.quizDirection === "both" ? (quiz.index % 2 ? "vi-ko" : "ko-vi") : ui.quizDirection;
  const correct = direction === "ko-vi" ? word.meaningVi : word.word;
  const pool = quizWords(course).filter(item => item.id !== word.id);
  const alternatives = shuffle(pool)
    .map(item => direction === "ko-vi" ? item.meaningVi : item.word)
    .filter((value, index, values) => value !== correct && values.indexOf(value) === index)
    .slice(0, 3);
  quiz.current = { word, direction, correct, options: shuffle([correct, ...alternatives]) };
  return quiz.current;
}

function renderQuizResult(course) {
  const quiz = ui.quiz;
  const percent = quiz.words.length ? Math.round((quiz.score / quiz.words.length) * 100) : 0;
  if (!quiz.saved) {
    const progress = courseProgress(course.id);
    progress.quizHistory.unshift({ date: new Date().toISOString(), lesson: ui.quizLesson, score: quiz.score, total: quiz.words.length, percent, mistakes: quiz.mistakes });
    progress.quizHistory = progress.quizHistory.slice(0, 30);
    quiz.mistakes.forEach(wordId => { progress.reviewAgain[wordId] = today(); });
    quiz.saved = true;
    saveProfile();
  }
  return `
    ${sectionHeading(course.title, "Kết quả trắc nghiệm", "Điểm và từ trả lời sai đã được lưu riêng trong giáo trình này.")}
    <section class="result-panel"><span>${percent}%</span><h2>${quiz.score}/${quiz.words.length} câu đúng</h2><p>${percent >= 85 ? "Rất tốt. Hãy duy trì nhịp học này." : "Các từ trả lời sai đã được đưa vào bộ Ôn từ chưa thuộc."}</p><div><button class="secondary-button" type="button" data-action="quiz-reset">Chọn bài khác</button><button class="primary-button" type="button" data-action="quiz-retry">Làm lại</button></div></section>
  `;
}

function renderQuiz(course) {
  if (!ui.quiz) {
    return `
      ${sectionHeading(course.title, "Trắc nghiệm", "Giữ lại chế độ Hàn → Việt, Việt → Hàn, xáo trộn và lưu lịch sử như web cũ.")}
      <section class="practice-panel setup-panel">
        <label><span>Bài / chủ đề</span><select data-filter="quiz-lesson">${lessonOptions(course, ui.quizLesson, true)}</select></label>
        <label><span>Chiều hỏi</span><select data-filter="quiz-direction"><option value="both" ${ui.quizDirection === "both" ? "selected" : ""}>Xen kẽ hai chiều</option><option value="ko-vi" ${ui.quizDirection === "ko-vi" ? "selected" : ""}>Hàn → Việt</option><option value="vi-ko" ${ui.quizDirection === "vi-ko" ? "selected" : ""}>Việt → Hàn</option></select></label>
        <div><b>${quizWords(course).length}</b><span> câu · xáo trộn tự động</span></div>
        <button class="primary-button" type="button" data-action="quiz-start">Bắt đầu →</button>
      </section>
    `;
  }
  if (ui.quiz.index >= ui.quiz.words.length) return renderQuizResult(course);
  const quiz = ui.quiz;
  const question = currentQuizQuestion(course);
  return `
    ${sectionHeading(course.title, "Trắc nghiệm", `Câu ${quiz.index + 1}/${quiz.words.length} · đúng ${quiz.score}`)}
    <section class="practice-panel quiz-panel">
      <div class="linear-progress"><span style="width:${Math.round((quiz.index / quiz.words.length) * 100)}%"></span></div>
      <span class="eyebrow">${question.direction === "ko-vi" ? "Chọn nghĩa đúng" : "Chọn từ tiếng Hàn đúng"}</span>
      <h2 class="quiz-question">${escapeHtml(question.direction === "ko-vi" ? question.word.word : question.word.meaningVi)}</h2>
      ${question.direction === "ko-vi" ? `<p class="romanization">${escapeHtml(question.word.romanization)}</p>` : ""}
      <div class="quiz-options">${question.options.map(option => {
        let className = "";
        if (quiz.answered && option === question.correct) className = "correct";
        else if (quiz.answered && option === quiz.selected) className = "wrong";
        return `<button class="${className}" type="button" data-action="quiz-answer" data-option="${escapeHtml(option)}" ${quiz.answered ? "disabled" : ""}>${escapeHtml(option)}</button>`;
      }).join("")}</div>
      ${quiz.answered ? `<div class="quiz-feedback ${quiz.selected === question.correct ? "success" : "error"}">${quiz.selected === question.correct ? "Chính xác." : `Đáp án đúng: ${escapeHtml(question.correct)}`}</div><button class="primary-button quiz-next" type="button" data-action="quiz-next">${quiz.index + 1 === quiz.words.length ? "Xem kết quả" : "Câu tiếp theo"} →</button>` : ""}
    </section>
  `;
}

function listeningLines(lesson) {
  return lesson.dialogues.flatMap(dialogue => dialogue.lines).filter(Boolean);
}

function renderListening(course) {
  const lesson = scopedLesson(course, ui.listeningLesson);
  const lines = listeningLines(lesson);
  const dictation = lines[0] || "";
  const listeningImage = lesson.exercises.find(item => item.kind === "listening");
  const completed = Boolean(courseProgress().listening[lesson.id]?.completed);
  return `
    ${sectionHeading(course.title, `Luyện nghe · ${lesson.id === 0 ? "Nhập môn" : `Bài ${lesson.id}`}`, "Nghe track gốc, chép chính tả và xem lời thoại lấy trực tiếp từ đúng bài trong sách.")}
    <section class="practice-toolbar"><label><span>Bài học</span><select data-filter="listening-lesson">${lessonOptions(course, lesson.id)}</select></label><button class="complete-button ${completed ? "done" : ""}" type="button" data-action="mark-listening" data-lesson="${lesson.id}">${completed ? "✓ Đã luyện" : "Đánh dấu đã luyện"}</button></section>
    <section class="listening-layout">
      <article class="audio-practice"><span class="eyebrow">File nghe gốc</span><h2>${escapeHtml(lesson.titleVi)}</h2><div class="audio-list">${lesson.audio.map(renderAudio).join("")}</div></article>
      <div class="listening-exercises">
        <article class="practice-panel"><span class="eyebrow">Nghe chép chính tả</span><p>Nghe hội thoại rồi nhập lại câu đầu tiên.</p><input class="ko-input" data-listening-answer placeholder="Nhập câu tiếng Hàn" /><button class="secondary-button" type="button" data-action="check-listening-dictation" data-answer="${escapeHtml(dictation)}">Kiểm tra chính tả</button>${ui.listeningDictationFeedback ? `<div class="inline-feedback">${escapeHtml(ui.listeningDictationFeedback)}</div>` : ""}</article>
        <article class="practice-panel"><button class="secondary-button wide" type="button" data-action="toggle-listening-transcript">${ui.listeningTranscript ? "Ẩn lời thoại" : "Xem lời thoại"}</button>${ui.listeningTranscript ? `<div class="transcript-list">${lesson.dialogues.map(dialogue => `<h3>${escapeHtml(dialogue.title)} · Track ${dialogue.track}</h3>${dialogue.lines.map(line => `<p>${escapeHtml(line)}</p>`).join("")}`).join("")}</div>` : ""}</article>
        ${listeningImage ? `<article class="book-page-preview"><button type="button" data-action="open-image" data-src="${asset(listeningImage.path)}" data-alt="Nghe và chọn đáp án · trang ${listeningImage.page}"><img src="${asset(listeningImage.path)}" alt="Trang luyện nghe ${lesson.titleVi}" /><span>Phóng to trang nghe · tr. ${listeningImage.page}</span></button></article>` : ""}
      </div>
    </section>
  `;
}

function currentShadowSentence(course) {
  const lesson = scopedLesson(course, ui.shadowLesson);
  const dialogue = lesson.dialogues[ui.shadowDialogue] || lesson.dialogues[0];
  const lines = dialogue?.lines || [];
  ui.shadowSentence = Math.max(0, Math.min(ui.shadowSentence, Math.max(0, lines.length - 1)));
  return { lesson, dialogue, lines, sentence: lines[ui.shadowSentence] || "" };
}

function renderShadowing(course) {
  const { lesson, dialogue, lines, sentence } = currentShadowSentence(course);
  const key = `${course.id}:${lesson.id}:${ui.shadowDialogue}:${ui.shadowSentence}`;
  const recording = ui.recordings.get(key);
  const completed = Boolean(courseProgress().shadow[lesson.id]?.completed);
  return `
    ${sectionHeading(course.title, "Shadowing", "Nghe từng câu, ghi âm và chấm phát âm; chế độ Nghe toàn đoạn đọc chậm hơn và nghỉ 0,7 giây giữa mỗi câu.")}
    <section class="practice-toolbar"><label><span>Bài học</span><select data-filter="shadow-lesson">${lessonOptions(course, lesson.id)}</select></label>${lesson.dialogues.length ? `<label><span>Hội thoại</span><select data-filter="shadow-dialogue">${lesson.dialogues.map((item, index) => `<option value="${index}" ${ui.shadowDialogue === index ? "selected" : ""}>${escapeHtml(item.title)} · Track ${item.track}</option>`).join("")}</select></label>` : ""}<button class="complete-button ${completed ? "done" : ""}" type="button" data-action="mark-shadow" data-lesson="${lesson.id}">${completed ? "✓ Đã luyện" : "Đánh dấu đã luyện"}</button></section>
    ${sentence ? `<section class="shadow-layout"><article class="practice-panel shadow-card"><span>${ui.shadowSentence + 1}/${lines.length}</span><h2>${escapeHtml(sentence)}</h2><div class="shadow-navigation"><button type="button" data-action="shadow-prev">← Câu trước</button><button type="button" data-action="shadow-next">Câu tiếp →</button></div><div class="practice-actions"><button class="secondary-button" type="button" data-action="speak" data-text="${escapeHtml(sentence)}">♪ Nghe câu</button><button class="secondary-button" type="button" data-action="shadow-play-all" data-lines="${escapeHtml(JSON.stringify(lines))}">Nghe toàn đoạn</button><button class="${ui.recording?.key === key ? "danger-button" : "secondary-button"}" type="button" data-action="shadow-record" data-key="${escapeHtml(key)}">${ui.recording?.key === key ? "Dừng ghi âm" : "Bắt đầu ghi âm"}</button><button class="secondary-button" type="button" data-action="shadow-score" data-text="${escapeHtml(sentence)}">Chấm phát âm</button></div>${recording ? `<audio controls src="${escapeHtml(recording)}"></audio>` : ""}${ui.shadowFeedback ? `<div class="inline-feedback">${escapeHtml(ui.shadowFeedback)}</div>` : ""}</article><article class="practice-panel transcript-list"><h3>${escapeHtml(dialogue.title)}</h3>${lines.map((line, index) => `<button class="${index === ui.shadowSentence ? "active" : ""}" type="button" data-action="shadow-select" data-index="${index}">${escapeHtml(line)}</button>`).join("")}</article></section>` : `<div class="empty-state">Bài này chưa có đoạn hội thoại để luyện Shadowing.</div>`}
  `;
}

function writingWords(course, lessonId) {
  const source = allCourseVocabulary(course).filter(item => item.lesson === Number(lessonId));
  const sourceById = new Map(source.map(item => [item.id, item]));
  const validDeck = ui.writingDeckIds.length === source.length && ui.writingDeckIds.every(itemId => sourceById.has(itemId));
  if (!validDeck) ui.writingDeckIds = source.map(item => item.id);
  return ui.writingDeckIds.map(itemId => sourceById.get(itemId)).filter(Boolean);
}

function shuffleWritingDeck(course) {
  const words = allCourseVocabulary(course).filter(item => item.lesson === Number(ui.writingLesson));
  ui.writingDeckIds = shuffle(words).map(item => item.id);
  ui.writingIndex = 0;
  ui.writingFeedback = words.length ? "Đã xáo trộn thứ tự từ." : "";
}

function renderWriting(course) {
  const lesson = scopedLesson(course, ui.writingLesson);
  const words = writingWords(course, lesson.id);
  if (ui.writingIndex >= words.length) ui.writingIndex = 0;
  const word = words[ui.writingIndex];
  const progress = courseProgress();
  const writingState = progress.writing[lesson.id] || {};
  const readingImage = lesson.exercises.find(item => item.kind === "reading");
  let practice = "";
  if (ui.writingMode === "topic") {
    practice = `<article class="practice-panel writing-topic"><span class="eyebrow">Viết theo chủ đề · ${escapeHtml(lesson.titleVi)}</span><p>${escapeHtml(lesson.objectives.join(" · "))}</p><textarea data-writing-topic placeholder="Viết câu tiếng Hàn của bạn…">${escapeHtml(writingState.text || "")}</textarea><label>Ghi chú tự sửa<textarea data-writing-note placeholder="Ghi lại lỗi, cách sửa hoặc điều cần hỏi giáo viên…">${escapeHtml(progress.writingNotes[lesson.id] || "")}</textarea></label><button class="primary-button" type="button" data-action="save-writing" data-lesson="${lesson.id}">Lưu bài viết</button></article>`;
  } else if (word) {
    const prompt = ui.writingMode === "vocab" ? `Viết từ tiếng Hàn có nghĩa: ${word.meaningVi}` : "Nghe rồi viết lại từ tiếng Hàn";
    practice = `<article class="practice-panel writing-word"><span>${ui.writingIndex + 1}/${words.length}</span><h2>${escapeHtml(prompt)}</h2>${ui.writingMode === "dictation" ? `<button class="secondary-button" type="button" data-action="speak" data-text="${escapeHtml(word.word)}">♪ Nghe từ</button>` : ""}<input class="ko-input" data-writing-answer placeholder="Nhập tiếng Hàn" /><div class="practice-actions"><button class="secondary-button" type="button" data-action="writing-check" data-answer="${escapeHtml(word.word)}">Kiểm tra</button><button class="text-button" type="button" data-action="writing-show" data-answer="${escapeHtml(word.word)}">Xem đáp án</button><button class="primary-button" type="button" data-action="writing-next">Từ tiếp theo →</button></div>${ui.writingFeedback ? `<div class="inline-feedback">${escapeHtml(ui.writingFeedback)}</div>` : ""}</article>`;
  } else practice = `<div class="empty-state">Bài này chưa có từ để luyện viết.</div>`;
  return `
    ${sectionHeading(course.title, "Luyện viết", "Viết từ, nghe chép chính tả, xáo trộn thứ tự và trả lời trực tiếp bài tập trên trang sách.")}
    <section class="practice-toolbar"><label><span>Bài học</span><select data-filter="writing-lesson">${lessonOptions(course, lesson.id)}</select></label><label><span>Chế độ</span><select data-filter="writing-mode"><option value="vocab" ${ui.writingMode === "vocab" ? "selected" : ""}>Viết từ</option><option value="dictation" ${ui.writingMode === "dictation" ? "selected" : ""}>Nghe chép</option><option value="topic" ${ui.writingMode === "topic" ? "selected" : ""}>Viết theo chủ đề</option></select></label>${ui.writingMode === "topic" ? "" : `<button class="secondary-button shuffle-writing" type="button" data-action="writing-shuffle">⇄ Xáo trộn</button>`}</section>
    <section class="writing-layout">${practice}${readingImage ? `<article class="practice-panel book-writing-panel"><button class="book-page-preview" type="button" data-action="open-image" data-src="${asset(readingImage.path)}" data-alt="Đọc và viết · trang ${readingImage.page}"><img src="${asset(readingImage.path)}" alt="Trang đọc và viết ${lesson.titleVi}" /><span>Phóng to trang đọc–viết · tr. ${readingImage.page}</span></button><label><b>Câu trả lời cho bài trong sách</b><textarea data-book-writing-answer placeholder="Ví dụ:\n1) ...\n2) ...">${escapeHtml(writingState.bookAnswer || "")}</textarea></label><button class="primary-button" type="button" data-action="save-book-writing" data-lesson="${lesson.id}">Lưu câu trả lời</button>${ui.writingBookMessage ? `<div class="inline-feedback">${escapeHtml(ui.writingBookMessage)}</div>` : ""}</article>` : ""}</section>
  `;
}

function renderReports(course) {
  const progress = courseProgress();
  const reportUrl = storage.local.getItem(REPORT_URL_KEY) || "";
  return `
    ${sectionHeading(course.title, "Báo cáo và góp ý", "Giữ lại biểu mẫu báo lỗi nội dung, ảnh minh hoạ và xuất báo cáo cục bộ của web cũ.")}
    <section class="reports-layout">
      <form class="practice-panel report-form" data-form="report"><label>Loại lỗi<select name="type"><option>Sai nghĩa</option><option>Sai chính tả</option><option>Sai phát âm/phiên âm</option><option>Lỗi âm thanh</option><option>Lỗi giao diện</option><option>Đề xuất khác</option></select></label><label>Nội dung hiện tại<textarea name="current" required></textarea></label><label>Đề xuất sửa<textarea name="suggestion" required></textarea></label><label>Thông tin liên hệ<input name="contact" /></label><label>Ảnh minh hoạ<input name="image" type="file" accept="image/*" /></label><button class="primary-button" type="submit">Lưu báo cáo thành JSON</button></form>
      <aside class="practice-panel"><h2>Kết nối Google Form</h2><label>Liên kết Google Form<input data-report-url type="url" value="${escapeHtml(reportUrl)}" placeholder="https://forms.google.com/…" /></label><button class="secondary-button" type="button" data-action="save-report-url">Lưu liên kết</button>${reportUrl ? `<a class="primary-button link-button" href="${escapeHtml(reportUrl)}" target="_blank" rel="noopener">Mở Google Form</a>` : ""}<h3>Báo cáo trên thiết bị</h3>${progress.reports.length ? `<ul class="report-list">${progress.reports.slice(0, 8).map(item => `<li><b>${escapeHtml(item.type)}</b><span>${escapeHtml(item.createdAt.slice(0, 10))}</span><p>${escapeHtml(item.suggestion)}</p></li>`).join("")}</ul><button class="text-button" type="button" data-action="export-reports">Xuất tất cả báo cáo</button>` : `<p>Chưa có báo cáo cục bộ.</p>`}</aside>
    </section>
  `;
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadText(filename, content, type = "application/json") {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type }));
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 500);
}

function exportVocabularyCsv(course) {
  const rows = [["lesson", "word", "romanization", "meaning_vi", "origin_type", "hanja", "chinese_equivalent"], ...allCourseVocabulary(course).map(item => [item.lesson, item.word, item.romanization, item.meaningVi, item.originType, item.hanja, item.chineseEquivalent])];
  downloadText(`${course.id}-vocabulary.csv`, rows.map(row => row.map(csvCell).join(",")).join("\n"), "text/csv;charset=utf-8");
}

async function importCourseData(file, course) {
  const payload = JSON.parse(await file.text());
  const incoming = payload.courseState || payload.progress?.courseState?.[course.id] || payload.progress || payload;
  if (!incoming || typeof incoming !== "object") throw new Error("Tệp không chứa dữ liệu tiến độ hợp lệ.");
  const current = courseProgress(course.id);
  if (ui.importMode === "replace") profile.progress.courseState[course.id] = { ...defaultCourseProgress(), ...incoming };
  else profile.progress.courseState[course.id] = {
    ...current,
    ...incoming,
    completedLessons: [...new Set([...(current.completedLessons || []), ...(incoming.completedLessons || [])])],
    completedExercises: [...new Set([...(current.completedExercises || []), ...(incoming.completedExercises || [])])],
    masteredWords: [...new Set([...(current.masteredWords || []), ...(incoming.masteredWords || [])])],
    notes: { ...(current.notes || {}), ...(incoming.notes || {}) },
    srs: { ...(current.srs || {}), ...(incoming.srs || {}) },
    reviewAgain: { ...(current.reviewAgain || {}), ...(incoming.reviewAgain || {}) },
    reviewHard: { ...(current.reviewHard || {}), ...(incoming.reviewHard || {}) },
    flashNotes: { ...(current.flashNotes || {}), ...(incoming.flashNotes || {}) },
    customVocabulary: [...new Map([...(current.customVocabulary || []), ...(incoming.customVocabulary || [])].map(item => [item.id || item.word, item])).values()],
  };
  saveProfile();
}

function renderData(course) {
  const progress = courseProgress();
  return `
    ${sectionHeading(course.title, "Quản lý dữ liệu", "Giữ lại nhập, xuất, sao lưu, CSV và thêm nhanh từ mới; dữ liệu vẫn tách riêng theo từng giáo trình.")}
    <section class="data-grid">
      <article class="practice-panel"><h2>Xuất và sao lưu</h2><div class="data-actions"><button type="button" data-action="export-vocabulary">Từ vựng JSON</button><button type="button" data-action="export-progress">Tiến độ JSON</button><button type="button" data-action="export-profile">Bản sao hồ sơ</button><button type="button" data-action="export-csv">Từ vựng CSV</button><button type="button" data-action="download-template">CSV mẫu</button></div><h3>Nhập bản sao</h3><label><input type="radio" name="importMode" value="merge" ${ui.importMode === "merge" ? "checked" : ""} /> Gộp thêm và loại trùng</label><label><input type="radio" name="importMode" value="replace" ${ui.importMode === "replace" ? "checked" : ""} /> Thay thế tiến độ giáo trình này</label><input data-import-file type="file" accept="application/json,.json" /><button class="danger-button" type="button" data-action="reset-progress">Khôi phục tiến độ trống</button></article>
      <form class="practice-panel" data-form="add-word"><h2>Thêm nhanh một từ</h2><label>Từ tiếng Hàn<input required name="word" /></label><label>Phiên âm RR<input required name="romanization" /></label><label>Nghĩa tiếng Việt<input required name="meaningVi" /></label><label>Bài học<select name="lesson">${lessonOptions(course, progress.lastLesson)}</select></label><label>Phân loại<select name="originType"><option value="native">Từ thuần Hàn</option><option value="sino">Từ Hán–Hàn</option><option value="loanword">Từ mượn</option><option value="expression">Cụm diễn đạt</option></select></label><label>Hán tự / từ tiếng Hán liên hệ<input name="hanja" /></label><button class="primary-button" type="submit">Thêm vào ${escapeHtml(course.title)}</button><p>${progress.customVocabulary.length} từ do bạn thêm trong giáo trình này.</p></form>
    </section>
  `;
}

function renderProgress(course) {
  const progress = courseProgress();
  const vocabulary = allCourseVocabulary(course);
  const quizAverage = progress.quizHistory.length ? Math.round(progress.quizHistory.reduce((sum, item) => sum + item.percent, 0) / progress.quizHistory.length) : 0;
  const againWords = Object.keys(progress.reviewAgain).filter(itemId => progress.reviewAgain[itemId]);
  const hardWords = Object.keys(progress.reviewHard).filter(itemId => progress.reviewHard[itemId]);
  const completedListening = Object.values(progress.listening).filter(item => item?.completed).length;
  const completedReading = Object.values(progress.reading).filter(item => item?.completed).length;
  const completedShadow = Object.values(progress.shadow).filter(item => item?.completed).length;
  const savedWriting = Object.values(progress.writing).filter(item => item?.text || item?.bookAnswer || item?.savedAt || item?.bookSavedAt).length;
  return `
    ${sectionHeading(course.title, "Tiến độ học tập", `Tiến độ dưới đây chỉ tính cho ${course.title}, không gộp với giáo trình còn lại.`)}
    <section class="progress-summary">
      <div class="progress-ring large" style="--progress:${progressPercent(course) * 3.6}deg"><span><b>${progressPercent(course)}%</b><small>${escapeHtml(course.title)}</small></span></div>
      <div><span class="eyebrow">Tổng tiến độ</span><h2>${progress.completedLessons.length}/${course.lessons.length} bài đã hoàn thành</h2><p>${completedListening} bài nghe · ${completedReading} bài đọc · ${savedWriting} bài viết đã lưu · ${progress.masteredWords.length}/${vocabulary.length} mục từ đã nhớ</p><button class="text-button" type="button" data-action="export-progress">Xuất tiến độ giáo trình →</button></div>
    </section>
    <section class="progress-metrics">
      <article><span>?</span><b>${quizAverage}%</b><small>Điểm trắc nghiệm trung bình</small></article>
      <article><span>◇</span><b>${againWords.length}</b><small>Từ chưa thuộc cần ôn</small></article>
      <article><span>!</span><b>${hardWords.length}</b><small>Từ khó đã đánh dấu</small></article>
      <article><span>♪</span><b>${completedListening}</b><small>Bài luyện nghe</small></article>
      <article><span>◌</span><b>${completedShadow}</b><small>Bài Shadowing</small></article>
      <article><span>✎</span><b>${savedWriting}</b><small>Bài viết đã lưu</small></article>
    </section>
    ${(againWords.length || hardWords.length) ? `<section class="focus-panel"><div><span class="eyebrow">Cần ôn tiếp</span><h2>${againWords.length} từ chưa thuộc · ${hardWords.length} từ khó</h2></div><button class="primary-button" type="button" data-action="progress-review-hard">Mở bộ từ khó →</button></section>` : ""}
    <section class="progress-lessons">
      ${course.lessons.map(lesson => {
        const skillCount = Number(Boolean(progress.listening[lesson.id]?.completed)) + Number(Boolean(progress.reading[lesson.id]?.completed)) + Number(Boolean(progress.writing[lesson.id]?.text || progress.writing[lesson.id]?.bookAnswer));
        const done = progress.completedLessons.includes(lesson.id);
        return `<button type="button" data-action="open-lesson" data-lesson="${lesson.id}"><span class="lesson-index">${lesson.id === 0 ? "가" : String(lesson.id).padStart(2, "0")}</span><span><b>${escapeHtml(lesson.titleVi)}</b><small>${skillCount}/3 kỹ năng nghe–đọc–viết · ${lesson.vocabulary.filter(item => progress.masteredWords.includes(item.id)).length}/${lesson.vocabulary.length} từ</small></span><i class="${done ? "done" : ""}">${done ? "✓" : "→"}</i></button>`;
      }).join("")}
    </section>
    ${progress.quizHistory.length ? `<section class="history-panel"><div class="panel-heading"><div><span class="eyebrow">Lịch sử</span><h2>Các lần làm trắc nghiệm gần đây</h2></div></div><div class="history-list">${progress.quizHistory.slice(0, 8).map(item => `<div><b>${item.percent}%</b><span>${item.score}/${item.total} câu · ${item.lesson === "all" ? "Toàn bộ sách" : `Bài ${item.lesson}`}</span><small>${escapeHtml(item.date.slice(0, 10))}</small></div>`).join("")}</div></section>` : ""}
  `;
}

function renderMain(course) {
  if (ui.view === "dashboard") return renderDashboard(course);
  if (ui.view === "lessons") return renderLessons(course);
  if (ui.view === "lesson") return renderLesson(course, selectedLesson() || course.lessons[0]);
  if (ui.view === "vocabulary") return renderVocabulary(course);
  if (ui.view === "flashcards") return renderFlashcards(course);
  if (ui.view === "quiz") return renderQuiz(course);
  if (ui.view === "listening") return renderListening(course);
  if (ui.view === "shadowing") return renderShadowing(course);
  if (ui.view === "writing") return renderWriting(course);
  if (ui.view === "reading") return renderReading(course);
  if (ui.view === "culture") return renderCulture(course);
  if (ui.view === "progress") return renderProgress(course);
  if (ui.view === "reports") return renderReports(course);
  if (ui.view === "data") return renderData(course);
  return renderDashboard(course);
}

function passwordField(name, autocomplete) {
  return `<span class="password-field"><input required minlength="6" type="password" name="${name}" autocomplete="${autocomplete}" /><button type="button" data-action="toggle-password" aria-label="Hiển thị mật khẩu" aria-pressed="false">Hiện</button></span>`;
}

function friendlyAuthError(error) {
  const message = String(error?.message || "");
  const code = String(error?.code || "");
  if (code === "invalid_credentials" || /invalid login credentials/i.test(message)) {
    return "Email hoặc mật khẩu chưa đúng. Nếu chưa có tài khoản người học trên website này, hãy đăng ký trước; nếu đã có, hãy dùng Quên mật khẩu.";
  }
  if (code === "email_not_confirmed" || /email not confirmed/i.test(message)) return "Email chưa được xác nhận. Hãy mở email xác nhận rồi đăng nhập lại.";
  if (code === "user_already_exists" || /already registered|already exists/i.test(message)) return "Email này đã có tài khoản. Hãy đăng nhập hoặc dùng Quên mật khẩu.";
  if (/failed to fetch|network|load failed/i.test(message)) return "Không kết nối được máy chủ tài khoản. Hãy kiểm tra mạng rồi thử lại.";
  return message || "Không thể hoàn tất thao tác. Hãy thử lại.";
}

function renderAccountDialog() {
  const configured = hasSupabaseConfig();
  const signedIn = Boolean(ui.accountSession?.user);
  const settings = profile.settings || {};
  const voices = koreanVoices();
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
        <p class="auth-help">Đăng nhập bằng <b>tài khoản người học đã đăng ký trên website này</b>. Tài khoản quản trị Supabase không phải là tài khoản học.</p>
        <div class="auth-grid">
          <form data-form="sign-in"><h3>Đăng nhập</h3><label>Email<input required type="email" name="email" autocomplete="email" /></label><label>Mật khẩu${passwordField("password", "current-password")}</label><button class="primary-button" type="submit">Đăng nhập</button><button class="text-button" type="button" data-action="show-reset">Quên mật khẩu?</button></form>
          <form data-form="sign-up"><h3>Tạo tài khoản</h3><label>Tên hiển thị<input required maxlength="64" name="displayName" autocomplete="name" /></label><label>Email<input required type="email" name="email" autocomplete="email" /></label><label>Mật khẩu${passwordField("password", "new-password")}</label><button class="secondary-button" type="submit">Đăng ký miễn phí</button></form>
        </div>
        <form class="reset-form" data-form="reset" hidden><h3>Đặt lại mật khẩu</h3><label>Email<input required type="email" name="email" autocomplete="email" /></label><button class="secondary-button" type="submit">Gửi email đặt lại</button></form>
      ` : `<p>Website đang lưu tiến độ trên thiết bị này. Cần cấu hình Supabase khi phát hành để bật đăng nhập trực tuyến.</p>`}
      <form class="settings-form" data-form="settings">
        <h3>Cài đặt học tập</h3>
        <label>Tên hiển thị<input required maxlength="64" name="displayName" value="${escapeHtml(profile.name || "Học viên")}" /></label>
        <label>Ngôn ngữ hỗ trợ<select name="language"><option value="vi" ${settings.language === "vi" ? "selected" : ""}>Tiếng Việt</option><option value="zh" ${settings.language === "zh" ? "selected" : ""}>中文</option><option value="en" ${settings.language === "en" ? "selected" : ""}>English</option></select></label>
        <label>Giọng tiếng Hàn<select name="voiceURI"><option value="">Mặc định của thiết bị</option>${voices.map(voice => `<option value="${escapeHtml(voice.voiceURI)}" ${settings.voiceURI === voice.voiceURI ? "selected" : ""}>${escapeHtml(voice.name)}</option>`).join("")}</select></label>
        <label>Tốc độ đọc<select name="rate"><option value="0.7" ${Number(settings.rate) === 0.7 ? "selected" : ""}>Chậm</option><option value="0.9" ${Number(settings.rate ?? 0.9) === 0.9 ? "selected" : ""}>Vừa</option><option value="1.05" ${Number(settings.rate) === 1.05 ? "selected" : ""}>Nhanh</option></select></label>
        <div><button class="secondary-button" type="button" data-action="test-voice">Nghe thử</button><button class="primary-button" type="submit">Lưu cài đặt</button></div>
      </form>
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

function toggleInArray(array, value, desired = null) {
  const index = array.indexOf(value);
  if (desired === false && index >= 0) array.splice(index, 1);
  else if (desired === true && index < 0) array.push(value);
  else if (desired === null && index >= 0) array.splice(index, 1);
  else if (desired === null && index < 0) array.push(value);
}

async function toggleShadowRecording(key) {
  if (ui.recording?.key === key) {
    ui.recording.recorder.stop();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) {
    ui.shadowFeedback = "Thiết bị này chưa hỗ trợ ghi âm trong trình duyệt.";
    render();
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];
    recorder.addEventListener("dataavailable", event => {
      if (event.data.size) chunks.push(event.data);
    });
    recorder.addEventListener("stop", () => {
      const previous = ui.recordings.get(key);
      if (previous) URL.revokeObjectURL(previous);
      ui.recordings.set(key, URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || "audio/webm" })));
      stream.getTracks().forEach(track => track.stop());
      ui.recording = null;
      ui.shadowFeedback = "Đã lưu bản ghi trên thiết bị này.";
      render();
    });
    recorder.start();
    ui.recording = { key, recorder };
    ui.shadowFeedback = "Đang ghi âm… hãy đọc câu tiếng Hàn rồi bấm dừng.";
    render();
  } catch (error) {
    ui.shadowFeedback = error.name === "NotAllowedError" ? "Cần cho phép micro để ghi âm." : "Không thể bắt đầu ghi âm trên thiết bị này.";
    render();
  }
}

function scoreShadowPronunciation(expected) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    ui.shadowFeedback = "Trình duyệt này chưa hỗ trợ nhận dạng phát âm. Bạn vẫn có thể nghe lại bản ghi.";
    render();
    return;
  }
  const recognition = new Recognition();
  recognition.lang = "ko-KR";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  ui.shadowFeedback = "Đang nghe… hãy đọc câu trên thẻ.";
  render();
  recognition.addEventListener("result", event => {
    const heard = event.results[0][0].transcript;
    const score = answerSimilarity(expected, heard);
    ui.shadowFeedback = `Độ khớp ${score}% · Hệ thống nghe được: ${heard}`;
    render();
  });
  recognition.addEventListener("error", event => {
    ui.shadowFeedback = event.error === "not-allowed" ? "Cần cho phép micro để chấm phát âm." : "Chưa nhận được giọng nói. Hãy thử lại.";
    render();
  });
  recognition.start();
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
  if (action === "lesson-practice") {
    const lessonId = String(button.dataset.lesson);
    if (button.dataset.view === "listening") ui.listeningLesson = lessonId;
    if (button.dataset.view === "reading") ui.readingLesson = lessonId;
    if (button.dataset.view === "writing") {
      ui.writingLesson = lessonId;
      ui.writingDeckIds = [];
    }
    navigate(ui.courseId, button.dataset.view);
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
    speechSequenceId += 1;
    if (!speakText(button.dataset.text)) {
      ui.shadowFeedback = "Thiết bị này chưa hỗ trợ đọc thành tiếng.";
      if (ui.view === "shadowing") render();
    }
  }
  if (action === "print-vocabulary") window.print();
  if (action === "flash-mode") {
    ui.flashDeckMode = button.dataset.mode;
    initializeFlashDeck(selectedCourse());
    render();
  }
  if (action === "flash-shuffle") {
    initializeFlashDeck(selectedCourse());
    render();
  }
  if (action === "flash-rate") {
    const item = flashVocabulary(selectedCourse())[ui.flashIndex];
    if (item) rateFlashCard(item, button.dataset.rate);
  }
  if (action === "delete-flash-note") {
    delete courseProgress().flashNotes[button.dataset.word];
    saveProfile();
    render();
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
    root.querySelector(".rating-row")?.classList.toggle("visible", ui.flashFlipped);
  }
  if (action === "quiz-start") startQuiz(selectedCourse());
  if (action === "quiz-answer" && ui.quiz && !ui.quiz.answered) {
    const question = currentQuizQuestion(selectedCourse());
    ui.quiz.selected = button.dataset.option;
    ui.quiz.answered = true;
    if (ui.quiz.selected === question.correct) ui.quiz.score += 1;
    else ui.quiz.mistakes.push(question.word.id);
    render();
  }
  if (action === "quiz-next" && ui.quiz?.answered) {
    ui.quiz.index += 1;
    ui.quiz.answered = false;
    ui.quiz.selected = "";
    ui.quiz.current = null;
    render();
  }
  if (action === "quiz-reset") {
    ui.quiz = null;
    render();
  }
  if (action === "quiz-retry") startQuiz(selectedCourse());
  if (action === "toggle-listening-transcript") {
    ui.listeningTranscript = !ui.listeningTranscript;
    render();
  }
  if (action === "check-listening-dictation") {
    const input = root.querySelector("[data-listening-answer]");
    const score = answerSimilarity(button.dataset.answer, input?.value);
    ui.listeningDictationFeedback = score === 100 ? "Chính xác." : `Độ khớp ${score}% · Đáp án: ${button.dataset.answer || "Chưa có lời thoại"}`;
    render();
  }
  if (action === "mark-listening") {
    const lessonId = Number(button.dataset.lesson);
    const current = courseProgress().listening[lessonId] || {};
    courseProgress().listening[lessonId] = { ...current, completed: !current.completed, updatedAt: new Date().toISOString() };
    saveProfile();
    render();
  }
  if (action === "shadow-prev" || action === "shadow-next") {
    speechSequenceId += 1;
    const length = currentShadowSentence(selectedCourse()).lines.length;
    if (length) ui.shadowSentence = (ui.shadowSentence + (action === "shadow-next" ? 1 : -1) + length) % length;
    ui.shadowFeedback = "";
    render();
  }
  if (action === "shadow-select") {
    speechSequenceId += 1;
    ui.shadowSentence = Number(button.dataset.index);
    ui.shadowFeedback = "";
    render();
  }
  if (action === "shadow-play-all") {
    try {
      speakLines(JSON.parse(button.dataset.lines || "[]"));
    } catch {
      ui.shadowFeedback = "Không thể đọc toàn đoạn này.";
      render();
    }
  }
  if (action === "shadow-record") await toggleShadowRecording(button.dataset.key);
  if (action === "shadow-score") scoreShadowPronunciation(button.dataset.text);
  if (action === "mark-shadow") {
    const lessonId = Number(button.dataset.lesson);
    const current = courseProgress().shadow[lessonId] || {};
    courseProgress().shadow[lessonId] = { ...current, completed: !current.completed, updatedAt: new Date().toISOString() };
    saveProfile();
    render();
  }
  if (action === "mark-reading") {
    const lessonId = Number(button.dataset.lesson);
    const current = courseProgress().reading[lessonId] || {};
    courseProgress().reading[lessonId] = { ...current, completed: !current.completed, updatedAt: new Date().toISOString() };
    saveProfile();
    render();
  }
  if (action === "writing-check") {
    const input = root.querySelector("[data-writing-answer]");
    const score = answerSimilarity(button.dataset.answer, input?.value);
    ui.writingFeedback = score === 100 ? "Chính xác." : `Độ khớp ${score}% · Đáp án: ${button.dataset.answer}`;
    render();
  }
  if (action === "writing-show") {
    ui.writingFeedback = `Đáp án: ${button.dataset.answer}`;
    render();
  }
  if (action === "writing-next") {
    const length = writingWords(selectedCourse(), ui.writingLesson).length;
    if (length) ui.writingIndex = (ui.writingIndex + 1) % length;
    ui.writingFeedback = "";
    render();
  }
  if (action === "writing-shuffle") {
    shuffleWritingDeck(selectedCourse());
    render();
  }
  if (action === "save-writing") {
    const lessonId = Number(button.dataset.lesson);
    courseProgress().writing[lessonId] = { text: root.querySelector("[data-writing-topic]")?.value || "", savedAt: new Date().toISOString() };
    courseProgress().writingNotes[lessonId] = root.querySelector("[data-writing-note]")?.value || "";
    saveProfile();
    ui.writingFeedback = "Đã lưu bài viết và ghi chú tự sửa.";
    render();
  }
  if (action === "save-book-writing") {
    const lessonId = Number(button.dataset.lesson);
    const current = courseProgress().writing[lessonId] || {};
    courseProgress().writing[lessonId] = {
      ...current,
      bookAnswer: root.querySelector("[data-book-writing-answer]")?.value || "",
      bookSavedAt: new Date().toISOString(),
    };
    saveProfile();
    ui.writingBookMessage = "Đã lưu câu trả lời cho trang bài tập.";
    render();
  }
  if (action === "progress-review-hard") {
    ui.flashDeckMode = Object.keys(courseProgress().reviewHard).length ? "hard" : "again";
    initializeFlashDeck(selectedCourse());
    navigate(ui.courseId, "flashcards");
  }
  if (action === "save-report-url") {
    const url = root.querySelector("[data-report-url]")?.value.trim() || "";
    storage.local.setItem(REPORT_URL_KEY, url);
    render();
  }
  if (action === "export-reports") downloadText(`${ui.courseId}-reports.json`, JSON.stringify(courseProgress().reports, null, 2));
  if (action === "export-vocabulary") downloadText(`${ui.courseId}-vocabulary.json`, JSON.stringify({ course: ui.courseId, version: CONTENT_VERSION, vocabulary: allCourseVocabulary(selectedCourse()) }, null, 2));
  if (action === "export-progress") downloadText(`${ui.courseId}-progress.json`, JSON.stringify({ course: ui.courseId, version: CONTENT_VERSION, exportedAt: new Date().toISOString(), courseState: courseProgress() }, null, 2));
  if (action === "export-profile") downloadText(`sejong-profile-${today()}.json`, JSON.stringify(profile, null, 2));
  if (action === "export-csv") exportVocabularyCsv(selectedCourse());
  if (action === "download-template") {
    const template = [["lesson", "word", "romanization", "meaning_vi", "origin_type", "hanja"], [1, "한국어", "hangugeo", "tiếng Hàn", "sino", "韓國語"]];
    downloadText("vocabulary-template.csv", template.map(row => row.map(csvCell).join(",")).join("\n"), "text/csv;charset=utf-8");
  }
  if (action === "reset-progress" && confirm(`Khôi phục toàn bộ tiến độ ${selectedCourse().title} về trống? Dữ liệu của cuốn còn lại sẽ được giữ nguyên.`)) {
    profile.progress.courseState[ui.courseId] = defaultCourseProgress();
    saveProfile();
    render();
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
  if (action === "toggle-password") {
    const field = button.closest(".password-field");
    const input = field?.querySelector("input");
    if (input) {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.textContent = show ? "Ẩn" : "Hiện";
      button.setAttribute("aria-label", show ? "Ẩn mật khẩu" : "Hiển thị mật khẩu");
      button.setAttribute("aria-pressed", String(show));
    }
  }
  if (action === "show-reset") root.querySelector(".reset-form")?.removeAttribute("hidden");
  if (action === "test-voice") {
    speechSequenceId += 1;
    speakText("안녕하세요. 한국어를 공부해요.");
  }
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
  if (event.target.matches("[data-flash-note]")) {
    const key = event.target.dataset.flashNote;
    courseProgress().flashNotes[key] = event.target.value;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(saveProfile, 400);
  }
});

root.addEventListener("change", event => {
  if (event.target.matches('[data-filter="vocabulary-lesson"]')) {
    ui.vocabularyLesson = event.target.value;
    applyVocabularyFilter();
  }
  if (event.target.matches('[data-filter="flash-lesson"]')) {
    ui.flashLesson = event.target.value;
    initializeFlashDeck(selectedCourse(), false);
    render();
  }
  if (event.target.matches('[data-filter="flash-direction"]')) {
    ui.flashDirection = event.target.value;
    ui.flashFlipped = false;
    render();
  }
  if (event.target.matches('[data-filter="quiz-lesson"]')) ui.quizLesson = event.target.value;
  if (event.target.matches('[data-filter="quiz-direction"]')) ui.quizDirection = event.target.value;
  if (event.target.matches('[data-filter="listening-lesson"]')) {
    ui.listeningLesson = event.target.value;
    ui.listeningTranscript = false;
    ui.listeningDictationFeedback = "";
    render();
  }
  if (event.target.matches('[data-filter="shadow-lesson"]')) {
    ui.shadowLesson = event.target.value;
    ui.shadowDialogue = 0;
    ui.shadowSentence = 0;
    ui.shadowFeedback = "";
    render();
  }
  if (event.target.matches('[data-filter="shadow-dialogue"]')) {
    ui.shadowDialogue = Number(event.target.value);
    ui.shadowSentence = 0;
    ui.shadowFeedback = "";
    render();
  }
  if (event.target.matches('[data-filter="writing-lesson"]')) {
    ui.writingLesson = event.target.value;
    ui.writingDeckIds = [];
    ui.writingIndex = 0;
    ui.writingFeedback = "";
    ui.writingBookMessage = "";
    render();
  }
  if (event.target.matches('[data-filter="writing-mode"]')) {
    ui.writingMode = event.target.value;
    ui.writingFeedback = "";
    render();
  }
  if (event.target.matches('[data-filter="reading-lesson"]')) {
    ui.readingLesson = event.target.value;
    ui.readingMessage = "";
    render();
  }
  if (event.target.matches('input[name="importMode"]')) ui.importMode = event.target.value;
  if (event.target.matches("[data-import-file]") && event.target.files?.[0]) {
    importCourseData(event.target.files[0], selectedCourse())
      .then(() => { alert("Đã nhập dữ liệu cho giáo trình này."); render(); })
      .catch(error => alert(error.message || "Không thể nhập tệp này."));
  }
});

root.addEventListener("submit", async event => {
  const form = event.target.closest("[data-form]");
  if (!form) return;
  event.preventDefault();
  const data = new FormData(form);
  const submit = form.querySelector('[type="submit"]');
  if (submit) submit.disabled = true;
  try {
    if (form.dataset.form === "report") {
      const image = data.get("image");
      const report = {
        id: id(),
        course: ui.courseId,
        type: data.get("type"),
        current: data.get("current"),
        suggestion: data.get("suggestion"),
        contact: data.get("contact"),
        page: location.hash,
        contentVersion: CONTENT_VERSION,
        createdAt: new Date().toISOString(),
        imageName: image?.size ? image.name : "",
        imageData: image?.size ? await fileToDataUrl(image) : "",
      };
      courseProgress().reports.unshift({ ...report, imageData: "" });
      courseProgress().reports = courseProgress().reports.slice(0, 50);
      saveProfile();
      downloadText(`${ui.courseId}-report-${today()}.json`, JSON.stringify(report, null, 2));
      render();
      return;
    }
    if (["add-word", "reading-add-word"].includes(form.dataset.form)) {
      const originType = data.get("originType");
      const hanja = String(data.get("hanja") || "").trim();
      if (originType === "sino" && !hanja) throw new Error("Từ Hán–Hàn cần ghi rõ Hán tự hoặc từ tiếng Hán liên hệ.");
      courseProgress().customVocabulary.push({
        id: `custom:${ui.courseId}:${id()}`,
        lesson: Number(data.get("lesson")),
        word: String(data.get("word")).trim(),
        romanization: String(data.get("romanization")).trim(),
        meaningVi: String(data.get("meaningVi")).trim(),
        originType,
        originLabelVi: { native: "Từ thuần Hàn", sino: "Từ Hán–Hàn", loanword: "Từ mượn", expression: "Cụm diễn đạt" }[originType],
        hanja,
        chineseEquivalent: hanja,
        hanviet: "",
        sourcePage: null,
        custom: true,
      });
      saveProfile();
      if (form.dataset.form === "reading-add-word") ui.readingMessage = `Đã thêm “${String(data.get("word")).trim()}” vào từ vựng Bài ${Number(data.get("lesson"))}.`;
      render();
      return;
    }
    if (form.dataset.form === "settings") {
      profile.name = String(data.get("displayName") || "Học viên").trim();
      profile.settings = { language: data.get("language"), voiceURI: data.get("voiceURI"), rate: Number(data.get("rate")) };
      saveProfile();
      ui.accountMessage = "Đã lưu cài đặt học tập.";
      render();
      root.querySelector("#account-dialog")?.showModal();
      return;
    }

    ui.accountError = "";
    ui.accountMessage = "";
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
    if (["sign-in", "sign-up", "reset", "settings"].includes(form.dataset.form)) {
      ui.accountError = friendlyAuthError(error);
      render();
      root.querySelector("#account-dialog")?.showModal();
    } else alert(error.message || "Không thể hoàn tất thao tác.");
  } finally {
    if (submit) submit.disabled = false;
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
