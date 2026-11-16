import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const coursesPath = path.join(root, "app/data/courses.json");
const examplesPath = path.join(root, "app/data/book-examples.json");
const courseData = JSON.parse(fs.readFileSync(coursesPath, "utf8"));
const bookExamples = JSON.parse(fs.readFileSync(examplesPath, "utf8"));

let restored = 0;

for (const course of courseData.courses || []) {
  const vocabularyCollections = [
    ...(course.lessons || []).map(lesson => lesson.vocabulary || []),
    course.numberVocabulary?.sino || [],
    course.numberVocabulary?.native || [],
  ];
  for (const vocabulary of vocabularyCollections) {
    for (const item of vocabulary) {
      delete item.example;
      delete item.exampleVi;
      delete item.grammarPoint;
      delete item.exampleSourcePage;
      delete item.exampleSourceType;
      const bookExample = bookExamples.items?.[item.id];
      if (!bookExample) continue;
      item.example = bookExample.example;
      item.exampleSourcePage = bookExample.sourcePage;
      item.exampleSourceType = bookExample.sourceType;
      restored += 1;
    }
  }
}

fs.writeFileSync(coursesPath, `${JSON.stringify(courseData, null, 2)}\n`);
console.log(`Đã gắn ${restored} câu ví dụ từ sách vào từ vựng và flashcard.`);
