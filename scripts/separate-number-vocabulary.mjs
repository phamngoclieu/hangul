import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const coursesPath = path.join(root, "app/data/courses.json");
const courseData = JSON.parse(fs.readFileSync(coursesPath, "utf8"));
const NUMBER_HANJA = /^[零〇一二三四五六七八九十百千萬万億亿兆]+$/u;
const NATIVE_NUMBER_WORDS = new Set(["하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉", "열", "열하나", "열둘", "스물", "서른", "마흔", "쉰", "예순", "일흔", "여든", "아흔"]);

function groupFor(item) {
  if (item.originType === "sino" && NUMBER_HANJA.test(item.hanja || "")) return "numbers-sino";
  if (item.originType === "native" && NATIVE_NUMBER_WORDS.has(item.word)) return "numbers-native";
  return "";
}

for (const course of courseData.courses || []) {
  const existingNumbers = [
    ...(course.numberVocabulary?.sino || []),
    ...(course.numberVocabulary?.native || []),
  ];
  const allVocabulary = [
    ...(course.lessons || []).flatMap(lesson => lesson.vocabulary || []),
    ...existingNumbers,
  ];
  const uniqueVocabulary = [...new Map(allVocabulary.map(item => [item.id, item])).values()];
  const numbers = { sino: [], native: [] };

  for (const item of uniqueVocabulary) {
    delete item.vocabularyGroup;
    const group = groupFor(item);
    if (!group) continue;
    item.vocabularyGroup = group;
    numbers[group === "numbers-sino" ? "sino" : "native"].push(item);
  }

  for (const lesson of course.lessons || []) {
    lesson.vocabulary = uniqueVocabulary.filter(item => item.lesson === lesson.id && !item.vocabularyGroup);
  }
  course.numberVocabulary = numbers;
}

courseData.version = "2026.08.31.2";
fs.writeFileSync(coursesPath, `${JSON.stringify(courseData, null, 2)}\n`);
console.log(courseData.courses.map(course => `${course.title}: ${course.numberVocabulary.sino.length} số Hán–Hàn, ${course.numberVocabulary.native.length} số thuần Hàn`).join("; "));
