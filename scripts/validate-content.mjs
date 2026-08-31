import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    throw new Error(`${relativePath}: ${error.message}`);
  }
}

function requireValue(condition, message, errors) {
  if (!condition) errors.push(message);
}

const vocabulary = readJson("app/data/vocabulary.json");
const wordOrigins = readJson("app/data/word-origins.json");
const numberGroups = readJson("app/data/number-groups.json");
const shadowing = readJson("app/data/shadowing.json");
const listening = readJson("app/data/listening.json");
const courseData = readJson("app/data/courses.json");
const errors = [];
const ids = new Set();

requireValue(Array.isArray(vocabulary), "Từ vựng phải là một mảng.", errors);
requireValue(wordOrigins && typeof wordOrigins === "object", "Dữ liệu nguồn gốc từ không hợp lệ.", errors);
requireValue(numberGroups && typeof numberGroups === "object", "Nhóm số phải là một đối tượng.", errors);
requireValue(Array.isArray(shadowing), "Shadowing phải là một mảng.", errors);
requireValue(Array.isArray(listening), "Bài nghe phải là một mảng.", errors);

for (const [index, item] of vocabulary.entries()) {
  const label = `vocabulary[${index}]`;
  requireValue(item && typeof item === "object", `${label}: mục không hợp lệ.`, errors);
  if (!item || typeof item !== "object") continue;

  for (const field of [
    "id",
    "word",
    "meaning",
    "meaning_en",
    "meaning_zh",
    "example",
    "example_vi",
    "example_en",
    "example_zh",
    "topic",
    "origin_type",
    "origin_label_vi",
    "origin_label_en",
    "origin_label_zh",
    "origin_note_vi",
    "origin_note_en",
    "origin_note_zh",
    "memory_tip_vi",
    "memory_tip_en",
    "memory_tip_zh"
  ]) {
    requireValue(
      typeof item[field] === "string" && item[field].trim().length > 0,
      `${label}: thiếu ${field}.`,
      errors
    );
  }

  requireValue(Number.isInteger(item.lesson) && item.lesson > 0, `${label}: lesson không hợp lệ.`, errors);
  requireValue(
    ["sino", "native", "loanword", "mixed", "proper", "grammar", "other"].includes(item.origin_type),
    `${label}: origin_type không hợp lệ.`,
    errors
  );
  requireValue(typeof item.actual_pronunciation === "string", `${label}: actual_pronunciation không hợp lệ.`, errors);
  requireValue(!ids.has(item.id), `${label}: id bị trùng (${item.id}).`, errors);
  ids.add(item.id);
}

const vocabularyById = new Map(vocabulary.map(item => [item.id, item]));
const originItems = wordOrigins?.items || {};
requireValue(
  Object.keys(originItems).length === vocabulary.length,
  `Nguồn gốc từ phải có đúng ${vocabulary.length} mục (hiện có ${Object.keys(originItems).length}).`,
  errors
);

const bannedGenericOriginText = [
  "Từ thuần Hàn. Hãy ghi nhớ theo hình ảnh",
  "A native Korean word. Remember it through an image",
  "Từ Hán–Hàn. Thử liên hệ nghĩa",
  "A Sino-Korean word. Connect its meaning"
];

for (const item of vocabulary) {
  const origin = originItems[item.id];
  const label = `word-origins.items.${item.id}`;
  requireValue(Boolean(origin), `${label}: thiếu dữ liệu cho “${item.word}”.`, errors);
  if (!origin) continue;

  requireValue(
    ["sino", "native", "loanword", "mixed", "proper", "grammar", "other"].includes(origin.type),
    `${label}: type không hợp lệ.`,
    errors
  );
  requireValue(["documented", "unresolved"].includes(origin.research_status), `${label}: research_status không hợp lệ.`, errors);
  for (const field of ["label_vi", "label_en", "label_zh", "note_vi", "note_en", "note_zh", "tip_vi", "tip_en", "tip_zh", "source_url", "source_title"]) {
    requireValue(typeof origin[field] === "string" && origin[field].trim(), `${label}: thiếu ${field}.`, errors);
  }
  requireValue(/^https:\/\//.test(origin.source_url), `${label}: source_url phải dùng HTTPS.`, errors);
  for (const banned of bannedGenericOriginText) {
    requireValue(!Object.values(origin).some(value => typeof value === "string" && value.includes(banned)), `${label}: còn nội dung nguồn gốc chung chung bị cấm.`, errors);
  }

  if (origin.type === "sino") {
    for (const field of ["root_form", "simplified", "hanviet"]) {
      requireValue(typeof origin[field] === "string" && origin[field].trim(), `${label}: từ Hán–Hàn thiếu ${field}.`, errors);
    }
    requireValue(!origin.hanviet.includes("?"), `${label}: âm Hán–Việt còn chưa xác định.`, errors);
  }

  if (origin.research_status === "unresolved") {
    for (const field of ["image_path", "image_alt_vi", "image_alt_en", "image_alt_zh", "image_credit", "image_license", "image_source_url"]) {
      requireValue(typeof origin[field] === "string" && origin[field].trim(), `${label}: mục chưa rõ nguồn gốc thiếu ${field}.`, errors);
    }
    if (origin.image_path) {
      const imagePath = path.join(root, "app/public", origin.image_path);
      requireValue(fs.existsSync(imagePath), `${label}: không tìm thấy ảnh ${origin.image_path}.`, errors);
    }
  } else {
    requireValue(!origin.image_path, `${label}: chỉ từ chưa tìm được nguồn gốc mới được có ảnh.`, errors);
  }
}

for (const id of Object.keys(originItems)) {
  requireValue(vocabularyById.has(id), `Nguồn gốc từ chứa ID lạ: ${id}.`, errors);
}

const groupedIds = new Set();
for (const group of ["sino", "native"]) {
  const groupIds = numberGroups?.[group];
  requireValue(Array.isArray(groupIds) && groupIds.length > 0, `Nhóm số ${group} đang trống.`, errors);
  if (!Array.isArray(groupIds)) continue;
  for (const id of groupIds) {
    const item = vocabularyById.get(id);
    requireValue(Boolean(item), `Nhóm số ${group}: không tìm thấy id ${id}.`, errors);
    requireValue(!groupedIds.has(id), `Từ ${id} xuất hiện trong nhiều nhóm số.`, errors);
    groupedIds.add(id);
    if (item) requireValue([2, 6].includes(item.lesson), `Từ số ${id} không thuộc Bài 2 hoặc Bài 6.`, errors);
  }
}

for (const [index, lesson] of shadowing.entries()) {
  const label = `shadowing[${index}]`;
  requireValue(Number.isInteger(lesson.lesson), `${label}: lesson không hợp lệ.`, errors);
  requireValue(typeof lesson.topic === "string" && lesson.topic.trim(), `${label}: thiếu topic.`, errors);

  for (const sectionName of ["book", "original"]) {
    const sentences = lesson?.[sectionName]?.sentences;
    requireValue(Array.isArray(sentences) && sentences.length > 0, `${label}.${sectionName}: thiếu câu.`, errors);
    if (!Array.isArray(sentences)) continue;

    for (const [sentenceIndex, sentence] of sentences.entries()) {
      for (const field of ["ko", "vi", "en", "zh"]) {
        requireValue(
          typeof sentence[field] === "string" && sentence[field].trim(),
          `${label}.${sectionName}.sentences[${sentenceIndex}]: thiếu ${field}.`,
          errors
        );
      }
    }
  }
}

for (const [index, lesson] of listening.entries()) {
  const label = `listening[${index}]`;
  for (const field of [
    "title",
    "transcript",
    "translation",
    "translation_en",
    "translation_zh",
    "question",
    "questionVi",
    "question_en",
    "question_zh"
  ]) {
    requireValue(
      typeof lesson[field] === "string" && lesson[field].trim(),
      `${label}: thiếu ${field}.`,
      errors
    );
  }
  requireValue(Array.isArray(lesson.options) && lesson.options.length >= 2, `${label}: options không hợp lệ.`, errors);
  requireValue(
    Number.isInteger(lesson.answer) && lesson.answer >= 0 && lesson.answer < lesson.options.length,
    `${label}: answer nằm ngoài options.`,
    errors
  );
}

requireValue(Array.isArray(courseData?.courses), "Dữ liệu giáo trình phải có courses.", errors);
const expectedCourses = { "sejong-1": { tracks: 73, lessons: 13 }, "sejong-2": { tracks: 70, lessons: 14 } };
const courseVocabularyIds = new Set();

for (const course of courseData?.courses || []) {
  const expected = expectedCourses[course.id];
  requireValue(Boolean(expected), `Giáo trình không hợp lệ: ${course.id}.`, errors);
  if (!expected) continue;
  requireValue(course.audioCount === expected.tracks, `${course.id}: phải có ${expected.tracks} track.`, errors);
  requireValue(course.lessons?.length === expected.lessons, `${course.id}: số bài học không đúng.`, errors);
  requireValue(course.source === (course.id === "sejong-1" ? "Sejong1.pdf" : "Sejong2.pdf"), `${course.id}: sai sách nguồn.`, errors);

  let vocabularyCount = 0;
  for (const lesson of course.lessons || []) {
    requireValue(Array.isArray(lesson.vocabulary), `${course.id} bài ${lesson.id}: thiếu từ vựng.`, errors);
    requireValue(Array.isArray(lesson.audio), `${course.id} bài ${lesson.id}: thiếu audio.`, errors);
    requireValue(Array.isArray(lesson.exercises), `${course.id} bài ${lesson.id}: thiếu bài tập.`, errors);

    for (const item of lesson.vocabulary || []) {
      vocabularyCount += 1;
      requireValue(item.id.startsWith(`${course.id}-`), `${course.id}: ID từ vựng không mang phạm vi giáo trình (${item.id}).`, errors);
      requireValue(!courseVocabularyIds.has(item.id), `ID từ vựng bị trùng: ${item.id}.`, errors);
      courseVocabularyIds.add(item.id);
      requireValue(typeof item.meaningVi === "string" && item.meaningVi.trim(), `${item.id}: thiếu nghĩa Việt.`, errors);
      requireValue(typeof item.romanization === "string" && item.romanization.trim(), `${item.id}: thiếu phiên âm.`, errors);
      for (const field of ["pronunciation", "example", "exampleVi", "grammarPoint"]) {
        if (field in item) requireValue(typeof item[field] === "string", `${item.id}: ${field} không hợp lệ.`, errors);
      }

      if (item.originType === "native") {
        requireValue(item.originLabelVi === "Từ thuần Hàn", `${item.id}: từ thuần Hàn chỉ được giữ phân loại.`, errors);
        requireValue(!item.hanja && !item.chineseEquivalent && !item.hanviet, `${item.id}: từ thuần Hàn không được có phần nguồn gốc/Hán tự.`, errors);
        requireValue(!item.dictionarySource && !item.dictionaryUrl, `${item.id}: từ thuần Hàn không được hiển thị nguồn.`, errors);
      }
      if (item.originType === "sino") {
        requireValue(Boolean(item.hanja), `${item.id}: từ Hán–Hàn thiếu Hán tự.`, errors);
        requireValue(Boolean(item.chineseEquivalent), `${item.id}: từ Hán–Hàn thiếu từ tiếng Hán liên hệ.`, errors);
        requireValue(!/[^\p{Script=Han}/]/u.test(item.hanja || ""), `${item.id}: liên hệ Hán–Hàn còn lẫn ký tự không phải Hán tự.`, errors);
      }
    }

    for (const audio of lesson.audio || []) {
      requireValue(audio.path?.startsWith(`audio/${course.id}/`), `${course.id} bài ${lesson.id}: audio bị lẫn giáo trình.`, errors);
      const audioPath = path.join(root, "app/public", audio.path || "");
      requireValue(fs.existsSync(audioPath), `${course.id}: không tìm thấy ${audio.path}.`, errors);
    }
    for (const exercise of lesson.exercises || []) {
      requireValue(exercise.path?.includes(`/exercises/${course.id}/`), `${course.id} bài ${lesson.id}: ảnh bài tập bị lẫn giáo trình.`, errors);
      const imagePath = path.join(root, "app/public", exercise.path || "");
      requireValue(fs.existsSync(imagePath), `${course.id}: không tìm thấy ${exercise.path}.`, errors);
    }
  }
  requireValue(vocabularyCount === course.vocabularyCount, `${course.id}: vocabularyCount không khớp (${vocabularyCount}/${course.vocabularyCount}).`, errors);

  for (const culture of course.cultures || []) {
    for (const image of culture.images || []) {
      requireValue(image.path?.includes(`/culture/${course.id}/`), `${course.id}: ảnh văn hoá bị lẫn giáo trình.`, errors);
      requireValue(fs.existsSync(path.join(root, "app/public", image.path || "")), `${course.id}: thiếu ${image.path}.`, errors);
    }
  }
}

requireValue((courseData?.courses || []).length === 2, "Phải có đúng hai khu vực Sejong 1 và Sejong 2.", errors);

if (errors.length) {
  console.error(`Dữ liệu chưa hợp lệ (${errors.length} lỗi):`);
  errors.slice(0, 100).forEach(error => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(
    `Dữ liệu hợp lệ: ${courseData.courses.map(course => `${course.title} ${course.vocabularyCount} mục từ/${course.audioCount} track`).join("; ")}.`
  );
}
