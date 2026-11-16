import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const coursesPath = path.join(root, "app/data/courses.json");
const mapPath = path.join(root, "app/data/simplified-hanzi-map.json");
const courseData = JSON.parse(fs.readFileSync(coursesPath, "utf8"));
const characterMap = JSON.parse(fs.readFileSync(mapPath, "utf8"));

function toSimplified(value) {
  return [...String(value || "")].map(character => characterMap[character] || character).join("");
}

let updated = 0;
for (const course of courseData.courses || []) {
  const vocabulary = [
    ...(course.lessons || []).flatMap(lesson => lesson.vocabulary || []),
    ...(course.numberVocabulary?.sino || []),
    ...(course.numberVocabulary?.native || [])
  ];
  for (const item of vocabulary) {
    if (item.originType !== "sino") continue;
    const simplified = toSimplified(item.hanja);
    if (item.chineseEquivalent !== simplified) updated += 1;
    item.chineseEquivalent = simplified;
  }
}

fs.writeFileSync(coursesPath, `${JSON.stringify(courseData, null, 2)}\n`);
console.log(`Đã chuẩn hóa ${updated} mục liên hệ tiếng Hán sang chữ giản thể.`);
