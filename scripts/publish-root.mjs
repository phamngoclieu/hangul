import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const distRoot = path.join(root, "dist");
const builtIndex = path.join(distRoot, "index.html");
const builtAssets = path.join(distRoot, "assets");
const builtAudio = path.join(distRoot, "audio");
const publicIndex = path.join(root, "index.html");
const publicAssets = path.join(root, "assets");
const publicAudio = path.join(root, "audio");

if (!fs.existsSync(builtIndex) || !fs.existsSync(builtAssets)) {
  throw new Error("Chưa có bản build. Hãy chạy npm run build trước.");
}

fs.copyFileSync(builtIndex, publicIndex);
fs.mkdirSync(publicAssets, { recursive: true });
fs.cpSync(builtAssets, publicAssets, { recursive: true });
if (fs.existsSync(builtAudio)) {
  fs.mkdirSync(publicAudio, { recursive: true });
  fs.cpSync(builtAudio, publicAudio, { recursive: true });
}

console.log("Đã cập nhật index.html, assets/ và audio/ cho GitHub Pages.");
