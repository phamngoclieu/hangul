import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const distRoot = path.join(root, "dist");
const builtIndex = path.join(distRoot, "index.html");
const builtAssets = path.join(distRoot, "assets");
const publicIndex = path.join(root, "index.html");
const publicAssets = path.join(root, "assets");

if (!fs.existsSync(builtIndex) || !fs.existsSync(builtAssets)) {
  throw new Error("Chưa có bản build. Hãy chạy npm run build trước.");
}

fs.copyFileSync(builtIndex, publicIndex);
fs.rmSync(publicAssets, { recursive: true, force: true });
fs.cpSync(builtAssets, publicAssets, { recursive: true });

console.log("Đã cập nhật index.html và assets/ cho GitHub Pages.");
