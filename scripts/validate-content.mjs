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

if (errors.length) {
  console.error(`Dữ liệu chưa hợp lệ (${errors.length} lỗi):`);
  errors.slice(0, 100).forEach(error => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(
    `Dữ liệu hợp lệ: ${vocabulary.length} từ, ${shadowing.length} bài shadowing, ${listening.length} bài nghe.`
  );
}
