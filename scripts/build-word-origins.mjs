import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const vocabulary = JSON.parse(fs.readFileSync(path.join(root, "app/data/vocabulary.json"), "utf8"));
const cache = JSON.parse(fs.readFileSync(path.join(root, "tmp/etymology-research/dictionary-cache.json"), "utf8"));

const KRDICT = "Korean Basic Dictionary (National Institute of Korean Language)";
const KAIKKI = "Wiktionary data via Kaikki.org";
const KRDICT_BASE = "https://krdict.korean.go.kr/kor/dicSearch/SearchView?ParaWordNo=";
const KIMCHI_SOURCE = "https://www.korean.go.kr/nkview/nklife/1999_1/1999_0108.pdf";
const TIME_SOURCE = "https://www.korean.go.kr/nkview/nknews/200101/30_1.htm";

const ORIGINAL_OVERRIDES = {
  "의사": "醫師", "모자": "帽子", "형": "兄", "시계": "時計", "방": "房",
  "영화": "映畫", "공원": "公園", "차": "茶", "사과": "沙果/砂果", "장": "張",
  "명": "名", "병": "甁", "이월": "二月", "일일": "一日", "수업": "授業",
  "회의": "會議", "제주도": "濟州島", "축구": "蹴球", "경기": "競技", "반": "班",
  "주": "週", "칠": "七", "수": "數", "영": "零", "공": "空", "일": "一",
  "삼": "三", "사": "四", "구": "九", "백": "百", "호": "號", "원": "圓",
  "이": "二", "육": "六", "오": "五", "팔": "八", "십": "十",
  "층": "層", "월": "月", "번": "番", "전화번호": "電話番號", "교실": "敎室", "PC방": "PC房",
  "세종학당": "世宗學堂", "영/공": "零/空"
};

const HV_OVERRIDES = {
  "上": "thượng", "食": "thực", "行": "hành", "數": "số", "生": "sinh",
  "重": "trọng", "長": "trưởng/trường", "樂": "nhạc/lạc", "便": "tiện",
  "白": "bạch", "百": "bách", "會": "hội", "間": "gian", "日": "nhật",
  "月": "nguyệt", "年": "niên", "時": "thời", "點": "điểm", "心": "tâm",
  "職": "chức", "業": "nghiệp", "國": "quốc", "學": "học", "堂": "đường",
  "畫": "họa", "住": "trú"
};

const SPECIAL = {
  "나라": {
    type: "native",
    note_vi: "Dạng cổ được ghi nhận là 나랗 trong tiếng Hàn Trung đại và 國惡 (*NALak) trong tiếng Hàn cổ; một giả thuyết liên hệ gốc này với nghĩa “đất”.",
    note_en: "Recorded as Middle Korean 나랗 and Old Korean 國惡 (*NALak); one proposal connects the root with the meaning “land”.",
    note_zh: "中古韩语记作“나랗”，古代韩语记作“國惡（*NALak）”；一种观点认为其词根与“土地”有关。",
    tip_vi: "Nhớ chuỗi 나라 ← 나랗: “đất” phát triển thành “đất nước, quốc gia”.",
    tip_en: "Remember 나라 ← 나랗: “land” developing into “country”.",
    tip_zh: "记住 나라 ← 나랗：由“土地”联想到“国家”。"
  },
  "사람": {
    type: "native",
    note_vi: "Có từ tiếng Hàn cổ 人音 (*SALOm) và tiếng Hàn Trung đại 사ᄅᆞᆷ. Từ này được phân tích từ 살다 “sống” + hậu tố danh từ hóa, nghĩa gốc là “người đang sống”.",
    note_en: "Inherited from Old Korean 人音 (*SALOm) and Middle Korean 사ᄅᆞᆷ; analyzed as 살다 “to live” plus a nominalizer, literally “one who is alive”.",
    note_zh: "承自古代韩语“人音（*SALOm）”和中古韩语“사ᄅᆞᆷ”；可分析为 살다“生活”加名词化成分，原义是“活着的人”。",
    tip_vi: "Liên hệ 사람 với 살다 “sống”: 사람 là “người đang sống”.",
    tip_en: "Link 사람 with 살다 “to live”: a 사람 is “one who is alive”.",
    tip_zh: "把 사람 与 살다“生活”联系起来：사람 是“活着的人”。"
  },
  "오늘": {
    type: "native",
    note_vi: "Được ghi nhận từ năm 1103 dưới dạng 烏捺 (*wonol). Phân tích lịch sử liên hệ 온 “đã đến” + một gốc cổ nghĩa là “ngày”: “ngày đã đến”.",
    note_en: "Attested in 1103 as 烏捺 (*wonol), historically analyzed as 온 “that has come” plus an old root meaning “day”: “the day that has come”.",
    note_zh: "1103年记作“烏捺（*wonol）”；历史分析为 온“已经到来”加表示“日”的古老词根，即“已经到来的这一天”。",
    tip_vi: "오늘 = “ngày đã đến” → hôm nay.", tip_en: "오늘 = “the day that has come” → today.", tip_zh: "오늘＝“已经到来的日子”→ 今天。"
  },
  "아침": {
    type: "native",
    note_vi: "Được ghi nhận năm 1103 dưới dạng 阿慘 (*achom) và năm 1447 dưới dạng tiếng Hàn Trung đại 아ᄎᆞᆷ. Đây là từ thuần Hàn có lịch sử lâu đời.",
    note_en: "Attested in 1103 as 阿慘 (*achom) and in 1447 as Middle Korean 아ᄎᆞᆷ; a native word with a long documented history.",
    note_zh: "1103年记作“阿慘（*achom）”，1447年中古韩语记作“아ᄎᆞᆷ”，是历史悠久的固有词。",
    tip_vi: "Nhìn sự đổi dạng 아ᄎᆞᆷ → 아침 để nhớ “buổi sáng”.", tip_en: "Use the change 아ᄎᆞᆷ → 아침 to remember “morning”.", tip_zh: "用 아ᄎᆞᆷ → 아침 的词形变化记住“早晨”。",
    source_url: TIME_SOURCE,
    source_title: "National Institute of Korean Language — 아침·점심·저녁"
  },
  "점심": {
    type: "sino",
    original: "點心",
    note_vi: "Từ Hán–Hàn 點心 (điểm tâm). Ban đầu chỉ món ăn nhẹ trong nhà Phật; về sau trong tiếng Hàn chuyển sang nghĩa bữa ăn giữa ngày.",
    note_en: "Sino-Korean 點心. It first referred to a light Buddhist snack and later developed the Korean meaning “midday meal”.",
    note_zh: "汉字词“點心（点心）”。最初指佛教中的少量点心，后来在韩语中发展为“午饭”。",
    tip_vi: "點心 đọc Hán–Việt là “điểm tâm”; trong tiếng Hàn hiện đại hãy gắn với “bữa trưa”.",
    tip_en: "Remember 點心 as an old “light snack” that shifted to “lunch” in Korean.",
    tip_zh: "记住“點心（点心）”在现代韩语里主要表示“午饭”。",
    source_url: TIME_SOURCE,
    source_title: "National Institute of Korean Language — 아침·점심·저녁"
  },
  "김치": {
    type: "other",
    note_vi: "Dạng cổ 딤/딤채 xuất hiện trong tài liệu thế kỷ XVI. Mối quan hệ với chữ 沈菜 (rau ngâm) có nhiều cách giải thích; vì vậy không nên coi một chuỗi biến âm duy nhất là hoàn toàn chắc chắn.",
    note_en: "The older form 딤/딤채 is documented in sixteenth-century sources. Its relationship to 沈菜 “soaked vegetables” is debated, so a single derivation should not be presented as certain.",
    note_zh: "16世纪文献中可见旧形“딤/딤채”。它与“沈菜（腌渍蔬菜）”的关系仍有不同解释，不宜把单一路径视为定论。",
    tip_vi: "Nhớ theo chuỗi hình thức lịch sử 딤채 → 김치, đồng thời lưu ý đây là vấn đề còn tranh luận.",
    tip_en: "Remember the documented form change 딤채 → 김치, while noting that the deeper derivation is debated.",
    tip_zh: "记住有文献依据的词形变化 딤채 → 김치，同时注意更早的来源仍有争议。",
    source_url: KIMCHI_SOURCE,
    source_title: "National Institute of Korean Language — 김치 어원 연구"
  },
  "아니요": {
    type: "grammar",
    note_vi: "Dạng đáp phủ định lịch sự được tạo từ 아니 “không” và tiểu từ kính ngữ 요; đây là cấu tạo ngữ pháp, không phải từ Hán–Hàn.",
    note_en: "A polite negative response formed from 아니 “no/not” plus the polite particle 요; it is grammatical, not Sino-Korean.",
    note_zh: "由 아니“不／不是”加礼貌语气成分 요 构成，是语法形式，不是汉字词。",
    tip_vi: "Tách 아니 + 요: thêm 요 để câu trả lời “không” trở nên lịch sự.", tip_en: "Split 아니 + 요: 요 makes the negative reply polite.", tip_zh: "拆成 아니 + 요：加上 요 后否定回答更礼貌。"
  },
  "아버지": {
    type: "native",
    note_vi: "Dạng trước của 아버지 là 아바지, được ghi nhận từ khoảng thế kỷ XVII–XVIII. Nghiên cứu phân tích 아바 “cha” + hậu tố -지 chỉ người; sau đó nguyên âm đổi 아바지 → 아버지.",
    note_en: "The earlier form was 아바지, attested around the seventeenth–eighteenth centuries and analyzed as 아바 “father” plus the person-denoting suffix -지; vowel change produced 아버지.",
    note_zh: "较早形式为“아바지”，约见于17—18世纪；可分析为 아바“父亲”加指人的后缀 -지，后来发生元音变化成为 아버지。",
    tip_vi: "Nhớ chuỗi 아바 + -지 → 아바지 → 아버지.", tip_en: "Remember 아바 + -지 → 아바지 → 아버지.", tip_zh: "记住 아바 + -지 → 아바지 → 아버지。",
    source_url: "https://www.korean.go.kr/nkview/nklife/2002_3/2002_0306.pdf",
    source_title: "National Institute of Korean Language — ‘아빠, 아버지’의 어원"
  },
  "언니": {
    type: "native",
    note_vi: "Nguồn gốc sâu hơn chưa chắc chắn. Từ này chỉ được ghi nhận rõ trong các từ điển khẩu ngữ cuối thế kỷ XIX; một giả thuyết cho rằng nó bắt nguồn từ cách trẻ nhỏ phát âm 형님, nhưng chưa phải kết luận cuối cùng.",
    note_en: "The deeper origin is uncertain. The word is clearly attested only in late-nineteenth-century colloquial dictionaries; one proposal derives it from a childish pronunciation of 형님, but this is not conclusive.",
    note_zh: "更早的来源尚无定论。该词到19世纪末的口语词典中才有明确记录；一种假说认为它来自儿童对 형님 的发音，但并非定论。",
    tip_vi: "Ghi nhớ mốc cuối thế kỷ XIX và không gán 언니 cho một nguồn tiếng Nhật chưa được chứng minh.", tip_en: "Remember the late-1800s attestation and avoid treating an unproven Japanese link as fact.", tip_zh: "记住19世纪末的文献记录，不要把未经证实的日语联系当成定论。"
  },
  "좀": {
    type: "native",
    note_vi: "좀 là dạng rút gọn của 조금. 조금 tiếp nối dạng tiếng Hàn Trung đại 죠곰, được phân tích từ gốc *죡- “nhỏ” + hậu tố -옴.",
    note_en: "좀 is a contraction of 조금. 조금 continues Middle Korean 죠곰, analyzed from the root *죡- “small” plus the suffix -옴.",
    note_zh: "좀 是 조금 的缩略形。조금 承自中古韩语 죠곰，可分析为词根 *죡-“小”加后缀 -옴。",
    tip_vi: "*죡- “nhỏ” → 죠곰 → 조금 → dạng rút gọn 좀.", tip_en: "*죡- “small” → 죠곰 → 조금 → shortened 좀.", tip_zh: "*죡-“小”→ 죠곰 → 조금 → 缩略形 좀。",
    source_url: "https://www.korean.go.kr/nkview/news/93/8_14.htm",
    source_title: "National Institute of Korean Language — 어원 이야기"
  },
  "가방": {
    type: "loanword",
    note_vi: "Từ mượn từ tiếng Nhật 鞄 (かばん, kaban) “túi/cặp”; nguồn sâu hơn của từ tiếng Nhật này vẫn được xem là chưa chắc chắn.",
    note_en: "Borrowed from Japanese 鞄 (かばん, kaban) “bag”; the Japanese word’s deeper origin remains uncertain.",
    note_zh: "借自日语“鞄（かばん，kaban）”，意为“包”；这个日语词更早的来源仍不确定。",
    tip_vi: "So sánh kaban → 가방: âm ka-ban được Hàn hóa thành ga-bang.", tip_en: "Compare kaban → 가방: the source sound was adapted to Korean.", tip_zh: "对照 kaban → 가방，记住外来音在韩语中的适应。"
  },
  "빵": {
    type: "loanword",
    note_vi: "Mượn từ tiếng Nhật パン (pan) “bánh mì”, mà tiếng Nhật lại mượn từ tiếng Bồ Đào Nha pão.",
    note_en: "Borrowed from Japanese パン (pan) “bread”, itself from Portuguese pão.",
    note_zh: "借自日语 パン（pan，“面包”），而日语形式又来自葡萄牙语 pão。",
    tip_vi: "pão → パン (pan) → 빵: theo dõi đường đi của âm để nhớ từ.", tip_en: "pão → パン (pan) → 빵: follow the sound path.", tip_zh: "pão → パン（pan）→ 빵：沿着语音借入路径记忆。"
  },
  "라면": {
    type: "loanword",
    note_vi: "Đi qua tiếng Nhật ラーメン (rāmen), vốn liên hệ với tiếng Quan thoại 拉麵/拉面 (lāmiàn) “mì kéo”. Thành tố 면/麵 trong tiếng Hàn cũng có nghĩa “mì”.",
    note_en: "Via Japanese ラーメン (rāmen), ultimately related to Mandarin 拉麵/拉面 (lāmiàn) “pulled noodles”; Korean 면/麵 also means “noodles”.",
    note_zh: "经日语 ラーメン（rāmen）传入，最终与普通话“拉面（lāmiàn）”有关；韩语 면／麵 本身也表示“面条”。",
    tip_vi: "拉麵 → ラーメン → 라면; nhận ra 면/麵 = mì.", tip_en: "拉麵 → ラーメン → 라면; notice 면/麵 “noodles”.", tip_zh: "拉面 → ラーメン → 라면；同时记住 면／麵＝面条。"
  },
  "구두": {
    type: "loanword",
    note_vi: "Thường được phân tích là từ mượn tiếng Nhật 靴 (kutsu) “giày”, nhưng chiều vay mượn từng được tranh luận; tư liệu tiếng Hàn ghi nhận từ này từ đầu thế kỷ XX.",
    note_en: "Usually analyzed as a loan from Japanese 靴 (kutsu) “shoes”, although the direction of borrowing has been debated; Korean attestations date from the early twentieth century.",
    note_zh: "通常分析为借自日语“靴（kutsu，鞋）”，但借词方向曾有争议；韩语文献记录始于20世纪初。",
    tip_vi: "So sánh kutsu → 구두 và nhớ rằng đây là cách giải thích có lưu ý học thuật.", tip_en: "Compare kutsu → 구두 while remembering that the borrowing direction is debated.", tip_zh: "对照 kutsu → 구두，同时记住借入方向仍有讨论。"
  },
  "세종학당": {
    type: "proper", original: "世宗學堂",
    note_vi: "Tên riêng ghép Sejong (世宗), miếu hiệu của vua Sejong, với 學堂 “học đường”; nghĩa đen là “Học đường Sejong”.",
    note_en: "A proper name combining Sejong (世宗), King Sejong’s temple name, with 學堂 “academy/school”: “Sejong Institute”.",
    note_zh: "专名，由世宗（世宗大王的庙号）与學堂（学堂）组成，字面义为“世宗学堂”。",
    tip_vi: "世宗 = Sejong, 學堂 = học đường.", tip_en: "世宗 = Sejong; 學堂 = academy.", tip_zh: "世宗＝Sejong，學堂＝学堂。"
  },
  "PC방": {
    type: "mixed", original: "PC房",
    note_vi: "Từ hỗn hợp gồm PC, viết tắt tiếng Anh của “personal computer”, và 방/房 “phòng”; nghĩa đen là “phòng máy tính”.",
    note_en: "A hybrid of English PC (“personal computer”) and 방/房 “room”, literally “computer room”.",
    note_zh: "由英语缩写 PC（personal computer）和 방／房“房间”组成，字面义为“电脑房”。",
    tip_vi: "PC + 방 (phòng) → tiệm máy tính/tiệm nét.", tip_en: "PC + 방 (room) → an internet/PC café.", tip_zh: "PC + 방（房间）→ 网吧／电脑房。"
  },
  "하고": {
    type: "grammar",
    note_vi: "Đây là trợ từ nối gắn sau danh từ để liên kết các danh từ với nghĩa “và/cùng với”; nên học như một đơn vị ngữ pháp, không phân tích theo chữ Hán.",
    note_en: "A connective particle attached to nouns with the meaning “and/with”; learn it as a grammatical unit rather than a Chinese-character word.",
    note_zh: "接在名词后的连接助词，表示“和／跟”；应作为语法单位记忆，不按汉字词分析。",
    tip_vi: "N하고 N = N và N.", tip_en: "N하고 N = N and N.", tip_zh: "N하고 N＝N和N。"
  },
  "날짜": {
    type: "native",
    note_vi: "Từ được cấu tạo trong tiếng Hàn từ 날 “ngày” và thành tố -짜 dùng khi nói ngày tháng cụ thể; không phải từ Hán–Hàn dù nghĩa liên quan đến lịch.",
    note_en: "A Korean formation from 날 “day” and the element -짜 used for a specified calendar date; it is not a Sino-Korean word.",
    note_zh: "由韩语 날“日子”和表示具体日期的成分 -짜 构成；虽然与日历有关，但不是汉字词。",
    tip_vi: "날 (ngày) + -짜 → 날짜 (ngày tháng cụ thể).", tip_en: "날 (day) + -짜 → 날짜 (a calendar date).", tip_zh: "날（日子）+ -짜 → 날짜（具体日期）。"
  },
  "서울": {
    type: "proper",
    note_vi: "Tên địa danh thuần Hàn, dùng chính thức cho thủ đô từ năm 1946. Tên này thường được liên hệ với các dạng lịch sử như 서라벌/서벌 chỉ kinh đô, nhưng chi tiết nguồn gốc sâu hơn chưa hoàn toàn thống nhất.",
    note_en: "A native Korean place name officially adopted for the capital in 1946. It is commonly connected with older forms such as 서라벌/서벌 meaning a capital, though the deeper derivation is not fully settled.",
    note_zh: "韩国固有地名，1946年正式定为首都名称。一般认为与表示都城的旧形“서라벌／서벌”有关，但更深层来源尚无完全一致的结论。",
    tip_vi: "Liên hệ 서라벌 → 서울 và ghi nhớ đây là tên riêng không viết bằng Hanja.", tip_en: "Link 서라벌 → 서울 and remember that the modern proper name has no official Hanja spelling.", tip_zh: "联想 서라벌 → 서울，并记住现代专名没有正式汉字写法。"
  }
};

const IMAGE_FALLBACKS = {
  "공": {
    path: "assets/vocabulary/gong.jpg",
    alt_vi: "Quả bóng trên sân cỏ", alt_en: "A ball on a grass field", alt_zh: "草地上的球",
    credit: "Daniel Norin · Unsplash", license: "Unsplash License", source_url: "https://unsplash.com/photos/lBhhnhndpE0"
  },
  "잘": {
    path: "assets/vocabulary/jal.jpg",
    alt_vi: "Cử chỉ giơ ngón cái biểu thị làm tốt", alt_en: "A thumbs-up gesture meaning well done", alt_zh: "表示做得好的竖拇指手势",
    credit: "Nataliya Vaitkevich · Pexels", license: "Pexels License", source_url: "https://www.pexels.com/photo/a-person-hand-with-the-thumbs-up-sign-7172856/"
  }
};

function parseHanviet() {
  const map = new Map();
  const csv = fs.readFileSync(path.join(root, "tmp/unihan/hanviet.csv"), "utf8").split(/\r?\n/).slice(1);
  for (const line of csv) {
    const match = line.match(/^([^,]+),\['([^']+)'\],/u);
    if (!match) continue;
    const values = map.get(match[1]) || [];
    if (!values.includes(match[2])) values.push(match[2]);
    map.set(match[1], values);
  }
  return map;
}

function parseUnihan(file, field) {
  const map = new Map();
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(new RegExp(`^U\\+([0-9A-F]+)\\s+(.)\\s+${field}\\s+(.+)$`, "u"));
    if (match) map.set(match[2], match[3]);
  }
  return map;
}

const hanviet = parseHanviet();
const definitions = parseUnihan(path.join(root, "tmp/unihan/kDefinition.txt"), "kDefinition");
const simplifiedCodes = parseUnihan(path.join(root, "tmp/unihan/kSimplifiedVariant.txt"), "kSimplifiedVariant");

function simplifiedChar(char) {
  const code = simplifiedCodes.get(char)?.match(/U\+([0-9A-F]+)/)?.[1];
  return code ? String.fromCodePoint(Number.parseInt(code, 16)) : char;
}

function variants(word) {
  return [...new Set(word.replace(/[()]/g, "/").split("/").map(part => part.trim()).filter(Boolean))];
}

function allEtymologies(word) {
  return variants(word).flatMap(part => {
    const data = cache[part]?.kaikki;
    return data?.etymology_texts?.length ? data.etymology_texts : [data?.etymology_text].filter(Boolean);
  });
}

function usefulEtymology(word) {
  return allEtymologies(word).find(text => text && !/^Of native Korean origin\.?$/i.test(text.trim()) && !/^Korean reading of/i.test(text.trim())) || "";
}

function exactEntries(word) {
  return variants(word).flatMap(part => cache[part]?.krdict?.exact || []);
}

const digitHanja = { 영: "零", 공: "空", 일: "一", 이: "二", 삼: "三", 사: "四", 오: "五", 육: "六", 칠: "七", 팔: "八", 구: "九", 십: "十" };
function sinoNumberHanja(word) {
  let output = "";
  for (const char of [...word]) {
    if (!digitHanja[char]) return "";
    output += digitHanja[char];
  }
  return output;
}

function systematicOriginal(item) {
  const word = item.word.replace(/\s+/g, "");
  if (item.lesson === 7 && /월$/u.test(word)) {
    const number = sinoNumberHanja(word.slice(0, -1).replace("유", "육").replace("시", "십"));
    if (number) return `${number}月`;
  }
  if (item.lesson === 7 && /일$/u.test(word) && !["생일", "매일"].includes(word)) {
    const number = sinoNumberHanja(word.slice(0, -1));
    if (number) return `${number}日`;
  }
  const weekdays = { 일요일: "日曜日", 월요일: "月曜日", 화요일: "火曜日", 수요일: "水曜日", 목요일: "木曜日", 금요일: "金曜日", 토요일: "土曜日" };
  if (weekdays[word]) return weekdays[word];
  if (item.lesson === 2 && [...word].every(char => digitHanja[char])) return sinoNumberHanja(word);
  return "";
}

function pickOriginal(item, etymology) {
  const cleanWord = item.word.replace(/\s+/g, "");
  if (ORIGINAL_OVERRIDES[cleanWord]) return ORIGINAL_OVERRIDES[cleanWord];
  const systematic = systematicOriginal(item);
  if (systematic) return systematic;
  const originals = exactEntries(item.word).map(entry => entry.original).filter(Boolean);
  const unique = [...new Set(originals)];
  if (unique.length === 1) return unique[0];
  const sinoMatch = etymology.match(/Sino-Korean word from\s+([\p{Script=Han}/]+)/u)?.[1];
  if (sinoMatch) return sinoMatch;
  return "";
}

function isHanja(value) {
  return /\p{Script=Han}/u.test(value) && !/[A-Za-z]/u.test(value);
}

function sourceFor(item, etymology, original) {
  const special = SPECIAL[item.word];
  if (special?.source_url) return { source_url: special.source_url, source_title: special.source_title };
  if (isHanja(original)) {
    const selected = original.replace(/▽/g, "");
    const matchingEntry = exactEntries(item.word).find(entry => {
      const candidate = entry.original.replace(/▽/g, "");
      return candidate === selected || candidate.split("/").includes(selected) || selected.split("/").includes(candidate);
    });
    if (matchingEntry?.id) return { source_url: `${KRDICT_BASE}${matchingEntry.id}`, source_title: KRDICT };
  }
  if (etymology) {
    const part = variants(item.word).find(value => {
      const data = cache[value]?.kaikki;
      const texts = data?.etymology_texts?.length ? data.etymology_texts : [data?.etymology_text];
      return texts?.includes(etymology);
    });
    return { source_url: cache[part]?.kaikki?.url || "", source_title: KAIKKI };
  }
  const entry = exactEntries(item.word)[0];
  if (entry?.id) return { source_url: `${KRDICT_BASE}${entry.id}`, source_title: KRDICT };
  const query = variants(item.word)[0];
  return {
    source_url: cache[query]?.krdict?.url || `https://krdict.korean.go.kr/kor/dicMarinerSearch/search?mainSearchWord=${encodeURIComponent(query)}`,
    source_title: KRDICT
  };
}

function cleanSourcePath(text) {
  return text
    .split("\n")[0]
    .replace(/^(?:(?:Borrowed|Derived) from|From)\s+/i, "")
    .replace(/\s*\([^)]*[“"][^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\.$/, "")
    .trim();
}

function localizedSourcePath(text, lang) {
  const languageNames = lang === "vi"
    ? { Japanese: "tiếng Nhật", Portuguese: "tiếng Bồ Đào Nha", English: "tiếng Anh", German: "tiếng Đức", Mandarin: "tiếng Quan thoại", Chinese: "tiếng Trung", French: "tiếng Pháp", Italian: "tiếng Ý", Russian: "tiếng Nga", Vietnamese: "tiếng Việt", Arabic: "tiếng Ả Rập", Dutch: "tiếng Hà Lan", Spanish: "tiếng Tây Ban Nha", Indonesian: "tiếng Indonesia", Malay: "tiếng Mã Lai", Tungusic: "ngữ hệ Tungus" }
    : { Japanese: "日语", Portuguese: "葡萄牙语", English: "英语", German: "德语", Mandarin: "汉语普通话", Chinese: "汉语", French: "法语", Italian: "意大利语", Russian: "俄语", Vietnamese: "越南语", Arabic: "阿拉伯语", Dutch: "荷兰语", Spanish: "西班牙语", Indonesian: "印度尼西亚语", Malay: "马来语", Tungusic: "通古斯语" };
  let output = text;
  for (const [source, target] of Object.entries(languageNames)) output = output.replace(new RegExp(`\\b${source}\\b`, "g"), target);
  output = output.replace(/,?\s+from\s+/gi, lang === "vi" ? " ← " : " ← ");
  output = output.replace(/,?\s+via\s+/gi, lang === "vi" ? " qua " : " 经由 ");
  output = output.replace(/,?\s+of possible\s+/gi, lang === "vi" ? ", có thể có " : "，可能有 ");
  output = output.replace(/\s+origin\b/gi, lang === "vi" ? " nguồn gốc" : "来源");
  output = output.replace(/\bProbably\b/gi, lang === "vi" ? "Có lẽ" : "可能");
  output = output.replace(/\bultimately\b/gi, lang === "vi" ? "cuối cùng" : "最终");
  output = output.replace(/\bpossibly\b/gi, lang === "vi" ? "có thể" : "可能");
  output = output.replace(/\bDoublet of\b/gi, lang === "vi" ? "Cùng gốc với" : "同源词为");
  return output.trim();
}

function historicalForm(text) {
  const matches = [...text.matchAll(/(?:as|from|Inherited from)\s+(?:(?:Late|Early)\s+)?(?:Old|Middle|Modern) Korean\s+([^,.;\n]+)/gi)];
  const form = matches.map(match => match[1].trim()).find(value => /[가-힣ᄀ-ᇿ\p{Script=Han}]/u.test(value));
  const year = text.match(/(?:first )?attested[^\d]*(before\s+\d{3,4}|\d{4})/i)?.[1] || "";
  return { form: form?.replace(/\s*\(Yale:[^)]+\)/i, "") || "", year };
}

function componentTokens(text) {
  const line = text.split("\n").find(part => /\s\+\s/u.test(part)) || "";
  if (!line) return [];
  return [...line.matchAll(/([가-힣ᄀ-ᇿ]+(?:\([^)]*\))?)\s*(?:\([^)]*[“"][^)]*\))?/gu)].map(match => match[1]).slice(0, 4);
}

function typeFrom(item, original, etymology) {
  if (SPECIAL[item.word]?.type) return SPECIAL[item.word].type;
  if (/^(?:(?:Borrowed|Derived) from|From (?:English|Japanese|German|French|Italian|Portuguese|Russian|Vietnamese|Indonesian|Malay|Dutch|Spanish))/i.test(etymology) || /[A-Za-z]/.test(original)) return "loanword";
  if (/Sino-Korean word from/i.test(etymology) || isHanja(original)) {
    if (/[가-힣].*\p{Script=Han}|\p{Script=Han}.*[가-힣]/u.test(original)) return "mixed";
    return item.origin_type === "proper" ? "proper" : "sino";
  }
  if (item.origin_type === "grammar") return "grammar";
  if (item.origin_type === "proper") return "proper";
  return "native";
}

const labels = {
  native: ["Từ thuần Hàn", "Native Korean word", "固有词"],
  sino: ["Từ Hán–Hàn", "Sino-Korean word", "汉字词"],
  loanword: ["Từ mượn", "Loanword", "外来词"],
  mixed: ["Từ hỗn hợp", "Hybrid word", "混合词"],
  proper: ["Tên riêng", "Proper noun", "专有名词"],
  grammar: ["Đơn vị ngữ pháp", "Grammar form", "语法形式"],
  other: ["Nguồn gốc đang tranh luận", "Etymology under discussion", "词源尚有争议"]
};

function hanjaDetails(original) {
  const clean = original.split("/")[0].replace(/[^\p{Script=Han}]/gu, "");
  const chars = [...clean];
  const simplified = chars.map(simplifiedChar).join("");
  const readings = chars.map(char => HV_OVERRIDES[char] || (hanviet.get(char) || []).slice(0, 3).join("/") || "?");
  const definitionParts = chars.map(char => (definitions.get(char) || "").split(/[;,]/)[0].trim() || "Chinese character");
  return { clean, chars, simplified, readings, definitionParts };
}

function generatedText(item, type, original, etymology) {
  if (type === "sino" || type === "mixed" || (type === "proper" && isHanja(original))) {
    const detail = hanjaDetails(original);
    const hv = detail.readings.join(" · ");
    const koParts = [...item.word.replace(/[\s/()A-Za-z-]/g, "")].slice(0, detail.chars.length).join(" + ");
    if (type === "mixed") {
      const nativePart = original.replace(/[\p{Script=Han}/]/gu, "").trim() || item.word.replace(new RegExp(`^${koParts.replaceAll(" + ", "")}`), "");
      return {
        note_vi: `Từ hỗn hợp: phần Hán–Hàn ${detail.clean}${detail.simplified !== detail.clean ? ` (giản thể: ${detail.simplified})` : ""} kết hợp với thành tố tiếng Hàn “${nativePart}”.`,
        note_en: `A hybrid word: Sino-Korean ${detail.clean}${detail.simplified !== detail.clean ? ` (simplified ${detail.simplified})` : ""} plus the Korean element “${nativePart}”.`,
        note_zh: `混合词：汉字部分“${detail.simplified}”${detail.simplified !== detail.clean ? `（韩文原字：${detail.clean}）` : ""}与韩语成分“${nativePart}”组合。`,
        tip_vi: `Nhớ riêng ${detail.chars.map((char, index) => `${char} (${detail.readings[index]})`).join(" + ")} rồi ghép với “${nativePart}”.`,
        tip_en: `Remember ${detail.chars.map((char, index) => `${char} (${detail.definitionParts[index]})`).join(" + ")} and then add “${nativePart}”.`,
        tip_zh: `先记 ${[...detail.simplified].join(" + ")}，再加上韩语成分“${nativePart}”。`,
        root_form: original,
        simplified: detail.simplified,
        hanviet: detail.readings.join(" ")
      };
    }
    return {
      note_vi: `Gốc Hán–Hàn ${detail.clean}${detail.simplified !== detail.clean ? ` (giản thể: ${detail.simplified})` : ""}; các âm Hán–Việt tương ứng thường gặp: ${hv}.`,
      note_en: `Sino-Korean from ${detail.clean}${detail.simplified !== detail.clean ? ` (simplified ${detail.simplified})` : ""}: ${detail.chars.map((char, index) => `${char} “${detail.definitionParts[index]}”`).join(" + ")}.`,
      note_zh: `源自汉字词“${detail.simplified}”${detail.simplified !== detail.clean ? `（韩文原字：${detail.clean}）` : ""}；韩语按音读写成“${item.word}”。`,
      tip_vi: `Tách ${detail.clean} thành ${detail.chars.map((char, index) => `${char} (${detail.readings[index]})`).join(" + ")} rồi nối lại với nghĩa “${item.meaning}”.`,
      tip_en: `Break ${detail.clean} into ${detail.chars.map((char, index) => `${char} (${detail.definitionParts[index]})`).join(" + ")}; Korean reads the parts as ${koParts || item.word}.`,
      tip_zh: `把“${detail.simplified}”拆成 ${[...detail.simplified].join(" + ")}；韩语音读依次对应 ${koParts || item.word}。`,
      root_form: detail.clean,
      simplified: detail.simplified,
      hanviet: detail.readings.join(" ")
    };
  }

  if (type === "loanword" || /^(?:(?:Borrowed|Derived) from|From (?:English|Japanese|German|French|Italian|Portuguese|Russian|Vietnamese|Indonesian|Malay|Dutch|Spanish))/i.test(etymology)) {
    const pathText = cleanSourcePath(etymology) || original.replace(/^←/, "");
    const pathVi = localizedSourcePath(pathText, "vi");
    const pathZh = localizedSourcePath(pathText, "zh");
    return {
      note_vi: `Từ mượn; đường vay mượn được ghi nhận: ${pathVi}.`,
      note_en: etymology.split("\n")[0] || `A loanword from ${pathText}.`,
      note_zh: `外来词；资料记录的借入路径为：${pathZh}。`,
      tip_vi: `Đối chiếu dạng nguồn “${pathVi}” với cách viết Hàn “${item.word}”.`,
      tip_en: `Compare the source form “${pathText}” with Korean “${item.word}”.`,
      tip_zh: `把来源形式“${pathZh}”与韩语写法“${item.word}”对照记忆。`,
      root_form: original || pathText
    };
  }

  const history = historicalForm(etymology);
  if (history.form) {
    return {
      note_vi: `Từ thuần Hàn có dạng lịch sử “${history.form}”${history.year ? `, được ghi nhận ${history.year}` : ""}; dạng “${item.word}” hiện nay phát triển từ hình thức cổ này.`,
      note_en: `A native Korean word recorded historically as “${history.form}”${history.year ? ` (${history.year})` : ""}; the modern form “${item.word}” developed from it.`,
      note_zh: `固有词，历史形式为“${history.form}”${history.year ? `（${history.year}年有记录）` : ""}；现代形式“${item.word}”由此演变。`,
      tip_vi: `So sánh ${history.form} → ${item.word} để nhớ sự thay đổi của từ qua thời gian.`,
      tip_en: `Compare ${history.form} → ${item.word} to remember its historical change.`,
      tip_zh: `对照 ${history.form} → ${item.word}，记住词形的历史变化。`,
      root_form: history.form
    };
  }

  const components = componentTokens(etymology);
  if (components.length >= 2) {
    const expression = components.join(" + ");
    return {
      note_vi: `Từ được hình thành bằng cách ghép các thành tố ${expression}; tổ hợp này phát triển thành nghĩa “${item.meaning}”.`,
      note_en: `Formed from the components ${expression}, yielding the present meaning “${item.meaning_en || item.meaning}”.`,
      note_zh: `由 ${expression} 等成分组合而成，形成现在“${item.meaning_zh || item.meaning}”的意思。`,
      tip_vi: `Tách “${item.word}” thành ${expression} để nhớ cấu tạo thay vì học rời từng âm.`,
      tip_en: `Split “${item.word}” into ${expression} to remember its structure.`,
      tip_zh: `把“${item.word}”拆成 ${expression} 来记构词关系。`
    };
  }

  if (/Unknown\./i.test(etymology)) {
    return {
      note_vi: `Nguồn gốc sâu hơn chưa được xác định chắc chắn. Tư liệu hiện có ghi nhận: ${etymology.split("\n")[0].replace(/^Unknown\.\s*/i, "")}`,
      note_en: etymology.split("\n")[0],
      note_zh: `更早的来源尚无定论；现有资料只给出较晚期的使用记录。`,
      tip_vi: `Ghi nhớ “${item.word}” theo nghĩa và mốc tư liệu, không gán một nguồn gốc chưa được chứng minh.`,
      tip_en: `Remember “${item.word}” by its meaning and attestation without assigning an unproven origin.`,
      tip_zh: `按词义和文献记录记住“${item.word}”，不要附会未经证实的词源。`
    };
  }

  if (etymology) {
    const forms = [...new Set([...etymology.split("\n")[0].matchAll(/[가-힣ᄀ-ᇿ]+(?:[-—][가-힣ᄀ-ᇿ]+)?/gu)].map(match => match[0]))].slice(0, 5);
    const expression = forms.length ? forms.join(" → ") : item.word;
    return {
      note_vi: `Nguồn từ điển phân tích “${item.word}” qua các hình thức/cấu tạo ${expression}; đây là lịch sử cấu tạo trong tiếng Hàn, không phải cách ghép chữ Hán.`,
      note_en: etymology.split("\n")[0],
      note_zh: `词源资料通过 ${expression} 解释“${item.word}”的构词或缩略过程；这属于韩语内部构词，不是汉字词。`,
      tip_vi: `Theo dõi chuỗi ${expression} để nhớ cách “${item.word}” được tạo thành.`,
      tip_en: `Follow the form sequence ${expression} to remember how “${item.word}” was formed.`,
      tip_zh: `按 ${expression} 的形式关系记住“${item.word}”的构成。`
    };
  }

  return null;
}

function unresolvedItem(item, image, source) {
  return {
    type: "native",
    label_vi: labels.native[0], label_en: labels.native[1], label_zh: labels.native[2],
    note_vi: `Các nguồn từ điển đã kiểm tra chỉ xác nhận “${item.word}” là từ thuần Hàn, chưa đưa ra nguồn gốc lịch sử đáng tin cậy hơn.`,
    note_en: `The checked dictionaries identify “${item.word}” as native Korean but provide no more reliable historical derivation.`,
    note_zh: `已核查的词典只确认“${item.word}”为固有词，尚未提供更可靠的历史词源。`,
    tip_vi: `Dùng hình ảnh “${image.alt_vi.toLowerCase()}” để ghi nhớ nghĩa của từ.`,
    tip_en: `Use the image of ${image.alt_en.toLowerCase()} to anchor the word’s meaning.`,
    tip_zh: `用“${image.alt_zh}”的图像记住这个词的意思。`,
    research_status: "unresolved",
    source_url: source.source_url,
    source_title: source.source_title,
    image_path: image.path,
    image_alt_vi: image.alt_vi, image_alt_en: image.alt_en, image_alt_zh: image.alt_zh,
    image_credit: image.credit, image_license: image.license, image_source_url: image.source_url
  };
}

const items = {};
for (const item of vocabulary) {
  const etymology = usefulEtymology(item.word);
  const special = SPECIAL[item.word];
  const original = special?.original || pickOriginal(item, etymology);
  const type = typeFrom(item, original, etymology);
  const source = sourceFor(item, etymology, original);
  const image = IMAGE_FALLBACKS[item.word];
  if (image) {
    items[item.id] = unresolvedItem(item, image, source);
    continue;
  }
  const generated = generatedText(item, type, original, etymology);
  if (!special && !generated) throw new Error(`No researched origin or image fallback for ${item.id} ${item.word}`);
  const text = { ...(generated || {}), ...(special || {}) };
  const typeLabel = labels[text.type || type] || labels.other;
  items[item.id] = {
    type: text.type || type,
    label_vi: typeLabel[0], label_en: typeLabel[1], label_zh: typeLabel[2],
    note_vi: text.note_vi, note_en: text.note_en, note_zh: text.note_zh,
    tip_vi: text.tip_vi, tip_en: text.tip_en, tip_zh: text.tip_zh,
    root_form: text.root_form || original || "",
    simplified: text.simplified || "",
    hanviet: text.hanviet || "",
    research_status: "documented",
    source_url: text.source_url || source.source_url,
    source_title: text.source_title || source.source_title
  };
}

const output = {
  version: "2026-08-15.1",
  generated_at: new Date().toISOString(),
  policy: "Images are used only when checked dictionary sources provide no reliable etymology beyond a generic native-word label.",
  research_sources: [
    { title: KRDICT, url: "https://krdict.korean.go.kr/" },
    { title: KAIKKI, url: "https://kaikki.org/dictionary/Korean/" },
    { title: "Unicode Unihan Database", url: "https://www.unicode.org/reports/tr38/" },
    { title: "Hán-Việt/Pinyin wordlist (MIT)", url: "https://github.com/ph0ngp/hanviet-pinyin-wordlist" }
  ],
  items
};

const outputPath = path.join(root, "app/data/word-origins.json");
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
const unresolved = Object.values(items).filter(item => item.research_status === "unresolved");
console.log(`Wrote ${Object.keys(items).length} researched origin records to app/data/word-origins.json.`);
console.log(`Image fallbacks: ${unresolved.length} (${unresolved.map(item => item.image_path).join(", ")}).`);
