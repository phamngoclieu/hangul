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
const shadowing = readJson("app/data/shadowing.json");
const listening = readJson("app/data/listening.json");
const errors = [];
const ids = new Set();

requireValue(Array.isArray(vocabulary), "Từ vựng phải là một mảng.", errors);
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
    "topic"
  ]) {
    requireValue(
      typeof item[field] === "string" && item[field].trim().length > 0,
      `${label}: thiếu ${field}.`,
      errors
    );
  }

  requireValue(Number.isInteger(item.lesson) && item.lesson > 0, `${label}: lesson không hợp lệ.`, errors);
  requireValue(!ids.has(item.id), `${label}: id bị trùng (${item.id}).`, errors);
  ids.add(item.id);
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
