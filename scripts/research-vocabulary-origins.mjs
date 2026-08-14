import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const vocabulary = JSON.parse(fs.readFileSync(path.join(root, "app/data/vocabulary.json"), "utf8"));
const outputDir = path.join(root, "tmp/etymology-research");
const outputPath = path.join(outputDir, "dictionary-cache.json");
fs.mkdirSync(outputDir, { recursive: true });

const cache = fs.existsSync(outputPath)
  ? JSON.parse(fs.readFileSync(outputPath, "utf8"))
  : {};

const htmlEntities = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " "
};

function decodeHtml(value = "") {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => htmlEntities[name] ?? match);
}

function plainText(value = "") {
  return decodeHtml(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function variantsFor(word) {
  const variants = word
    .replace(/[()]/g, "/")
    .split("/")
    .map(part => part.trim())
    .filter(Boolean);
  return [...new Set(variants.length ? variants : [word])];
}

function parseKrdict(html, query) {
  const entries = [];
  for (const block of html.matchAll(/<dl[^>]*>([\s\S]*?)<\/dl>/gi)) {
    const body = block[1];
    const wordMatch = body.match(/<span class="word_type[^>]*>([\s\S]*?)<\/span>/i);
    if (!wordMatch) continue;
    const word = plainText(wordMatch[1])
      .replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]+$/u, "")
      .replace(/\s+\d+$/u, "");
    const id = body.match(/checkSubmit\('(\d+)'/i)?.[1] ?? "";
    const originArea = body.match(/<!-- 원어 -->([\s\S]*?)<!-- 품사 -->/i)?.[1] ?? "";
    const original = plainText(originArea).replace(/^\((.*)\)$/u, "$1");
    const pronunciationArea = body.match(/<!-- 발음 -->([\s\S]*?)<!-- 중요도 -->/i)?.[1] ?? "";
    const pronunciation = plainText(pronunciationArea).replace(/듣기/g, "").replace(/^\[|\]$/g, "").trim();
    entries.push({ word, id, original, pronunciation });
  }
  return {
    url: `https://krdict.korean.go.kr/kor/dicMarinerSearch/search?mainSearchWord=${encodeURIComponent(query)}`,
    exact: entries.filter(entry => entry.word === query),
    entries: entries.slice(0, 12)
  };
}

function parseKaikki(html, query, url) {
  const records = [];
  for (const match of html.matchAll(/<pre>([\s\S]*?)<\/pre>/gi)) {
    try {
      const record = JSON.parse(decodeHtml(match[1]));
      if (record?.word === query && record?.lang === "Korean") records.push(record);
    } catch {
      // Kaikki may include non-JSON preformatted blocks; ignore those.
    }
  }
  const record = records.find(item => item.etymology_text) ?? records[0] ?? null;
  const fallbackTexts = [...html.matchAll(/&quot;etymology_text&quot;\s*:\s*&quot;([\s\S]*?)&quot;\s*,/gi)]
    .map(match => {
      try {
        return JSON.parse(`"${decodeHtml(match[1])}"`);
      } catch {
        return "";
      }
    })
    .filter(Boolean);
  const etymologyTexts = [...new Set([
    ...records.map(item => item.etymology_text).filter(Boolean),
    ...fallbackTexts
  ])];
  const etymologyText = record?.etymology_text ?? etymologyTexts[0] ?? "";
  return {
    url,
    found: Boolean(record || etymologyText),
    etymology_text: etymologyText,
    etymology_texts: etymologyTexts,
    etymology_templates: record?.etymology_templates ?? [],
    categories: record?.categories ?? [],
    pos: record?.pos ?? ""
  };
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; SejongGreenVocabularyResearch/1.0)",
      accept: "text/html,application/xhtml+xml"
    },
    signal: AbortSignal.timeout(30_000)
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function researchVariant(query) {
  const explicitlyRequested = process.argv.slice(2).includes(query);
  if (!explicitlyRequested && cache[query]?.complete && cache[query]?.research_version === 3) return;
  const encoded = encodeURIComponent(query);
  const characters = [...query];
  const first = encodeURIComponent(characters[0] ?? query);
  const prefix = encodeURIComponent(characters.slice(0, 2).join(""));
  const krdictUrl = `https://krdict.korean.go.kr/kor/dicMarinerSearch/search?mainSearchWord=${encoded}`;
  const kaikkiUrl = `https://kaikki.org/dictionary/Korean/meaning/${first}/${prefix}/${encoded}.html`;
  const result = { updated_at: new Date().toISOString(), research_version: 3, complete: false };

  try {
    result.krdict = parseKrdict(await fetchText(krdictUrl), query);
  } catch (error) {
    result.krdict = { url: krdictUrl, error: error.message, exact: [], entries: [] };
  }
  try {
    result.kaikki = parseKaikki(await fetchText(kaikkiUrl), query, kaikkiUrl);
  } catch (error) {
    result.kaikki = { url: kaikkiUrl, error: error.message, found: false, etymology_text: "" };
  }
  result.complete = !result.krdict.error && (!result.kaikki.error || result.kaikki.error.startsWith("404 "));
  cache[query] = result;
  fs.writeFileSync(outputPath, `${JSON.stringify(cache, null, 2)}\n`);
}

const requestedQueries = process.argv.slice(2);
const queries = requestedQueries.length
  ? [...new Set(requestedQueries)]
  : [...new Set(vocabulary.flatMap(item => variantsFor(item.word)))];
const concurrency = 4;
let cursor = 0;

async function worker(workerId) {
  while (cursor < queries.length) {
    const index = cursor++;
    const query = queries[index];
    process.stdout.write(`[${index + 1}/${queries.length}] worker ${workerId}: ${query}\n`);
    await researchVariant(query);
    await new Promise(resolve => setTimeout(resolve, 120));
  }
}

await Promise.all(Array.from({ length: concurrency }, (_, index) => worker(index + 1)));

const summary = Object.values(cache).reduce((counts, item) => {
  if (item.krdict?.exact?.some(entry => entry.original)) counts.krdictOriginal += 1;
  if (item.kaikki?.etymology_text) counts.kaikkiEtymology += 1;
  if (!item.krdict?.exact?.some(entry => entry.original) && !item.kaikki?.etymology_text) counts.needsImage += 1;
  return counts;
}, { krdictOriginal: 0, kaikkiEtymology: 0, needsImage: 0 });

console.log(`Research cache written to ${path.relative(root, outputPath)}.`);
console.log(JSON.stringify(summary, null, 2));
