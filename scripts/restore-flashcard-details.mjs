import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const coursesPath = path.join(root, "app/data/courses.json");
const legacyPath = path.join(root, "app/data/vocabulary.json");
const courseData = JSON.parse(fs.readFileSync(coursesPath, "utf8"));
const legacyVocabulary = JSON.parse(fs.readFileSync(legacyPath, "utf8"));

const legacyByWord = new Map(legacyVocabulary.map(item => [item.word, item]));
let restored = 0;

for (const course of courseData.courses || []) {
  for (const lesson of course.lessons || []) {
    for (const item of lesson.vocabulary || []) {
      delete item.example;
      delete item.exampleVi;
      delete item.grammarPoint;
      if (course.id !== "sejong-1") continue;
      const legacy = legacyByWord.get(item.word);
      if (!legacy) continue;
      item.example = legacy.example || "";
      item.exampleVi = legacy.example_vi || "";
      item.grammarPoint = legacy.grammar_point || "";
      restored += 1;
    }
  }
}

fs.writeFileSync(coursesPath, `${JSON.stringify(courseData, null, 2)}\n`);
console.log(`Đã khôi phục câu ví dụ và ngữ pháp cho ${restored} flashcard.`);
