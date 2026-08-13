import fs from "node:fs";

const vocabularyPath = "app/data/vocabulary.json";
const numberGroupsPath = "app/data/number-groups.json";
const vocabulary = JSON.parse(fs.readFileSync(vocabularyPath, "utf8"));
const numberGroups = JSON.parse(fs.readFileSync(numberGroupsPath, "utf8"));
const sinoNumberIds = new Set(numberGroups.sino);
const nativeNumberIds = new Set(numberGroups.native);

const ORIGIN_LABELS = {
  sino: { vi: "Từ Hán–Hàn", en: "Sino-Korean word", zh: "汉字词" },
  native: { vi: "Từ thuần Hàn", en: "Native Korean word", zh: "固有词" },
  loanword: { vi: "Từ mượn", en: "Loanword", zh: "外来词" },
  mixed: { vi: "Từ hỗn hợp", en: "Hybrid word", zh: "混合词" },
  proper: { vi: "Tên riêng", en: "Proper noun", zh: "专有名词" },
  grammar: { vi: "Thành phần ngữ pháp", en: "Grammar element", zh: "语法成分" },
  other: { vi: "Nguồn gốc khác/chưa xác định", en: "Other/uncertain origin", zh: "其他／来源未确定" }
};

const loanwordSources = {
  커피: "coffee", 카페: "café", 주스: "juice", 컴퓨터: "computer", 텔레비전: "television",
  "PC방": "PC + 방", 이메일: "e-mail", 피아노: "piano", 펜: "pen", 피자: "pizza",
  게임: "game", 쇼핑: "shopping", 마트: "mart", 아이스크림: "ice cream",
  케이크: "cake", 버스: "bus", 바나나: "banana", 아르바이트: "German Arbeit",
  드라마: "drama", 파티: "party", 콘서트: "concert", 메모: "memo", "케이팝(K-POP)": "K-pop"
};
const loanwordWords = new Set(Object.keys(loanwordSources));

const properWords = new Set([
  "한국", "캐나다", "베트남", "미국", "프랑스", "태국", "인도네시아", "중국", "일본", "러시아", "케냐",
  "세종학당", "서울", "부산", "하노이", "시드니", "모스크바", "자카르타", "제주도", "한라산", "한강"
]);

const grammarWords = new Set([
  "씨", "제", "무슨", "무엇", "누구", "누가", "몇", "얼마", "어디", "언제", "며칠", "하고", "그리고", "그럼", "그런데", "그렇지만"
]);

const sinoWords = new Set([
  "직업", "사람", "회사원", "대학생", "의사", "경찰", "선생님", "가수", "요리사", "모자", "공책", "학생", "자기소개",
  "한자어", "수", "층", "월", "쪽", "번", "호", "원", "전화번호", "식당", "영화관", "노래방", "지하", "교실", "남자", "의자", "주소",
  "물건", "책상", "필통", "시계", "오른쪽", "왼쪽", "사이", "학교", "칠판", "침대", "한국어", "요리하다", "공부하다", "영화", "정말", "음악", "공원", "운동하다",
  "장소", "식품", "회사", "과일", "우유", "과자", "백화점", "포도", "신발", "영어", "장", "개", "계란", "명", "마리", "잔", "병", "권", "창문", "대답하다", "내일", "편의점", "치약", "칫솔",
  "날짜", "요일", "달력", "생일", "주말", "수업", "여행", "사진", "도서관", "수영", "점심", "식사", "회의", "오후", "시작하다", "매일",
  "날씨", "계절", "사계절", "고향", "도시", "단풍", "활동", "미용실", "놀이공원", "박물관", "수영장", "산책하다", "구경하다", "자전거", "청소하다", "기분",
  "약속", "시간", "특별하다", "축구", "경기", "농구", "음료수", "등산", "반", "음식", "운동화", "방학", "내용", "주",
  "사과", "차", "구두", "이름", "우산"
]);

const sinoPatternWords = new Set([
  "일월", "이월", "삼월", "사월", "오월", "유월", "칠월", "팔월", "구월", "시월", "십일월", "십이월",
  "일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일",
  "일일", "이일", "삼일", "사일", "오일", "육일", "칠일", "팔일", "구일", "십일일", "십이일", "십삼일", "십사일", "십오일", "십육일", "십칠일", "십팔일", "십구일", "이십일", "이십일일", "이십이일", "이십삼일", "이십사일", "이십오일", "이십육일", "이십칠일", "이십팔일", "이십구일", "삼십일", "삼십일일"
]);

const otherWords = new Set(["라면", "김치"]);

const mixedWords = new Set(["PC방", "핸드폰", "쇼핑몰", "한복", "태권도", "비빔밥"]);

const pronunciationOverrides = {
  직업: "지겁", 한국: "한ː국", 미국: "미국", 태국: "태국", 중국: "중국", 대학생: "대학쌩", 경찰: "경찰", 책: "책", 공책: "공책", 한복: "한복", 동생: "동생", 학생: "학쌩",
  십일: "시빌", 십육: "심뉵", 십칠: "십칠", 십팔: "십팔", 십구: "십꾸", 이십: "이십", 삼십: "삼십", 사십: "사십", 오십: "오십", 육십: "육씹", 칠십: "칠씹", 팔십: "팔씹", 구십: "구십", 백: "백",
  층: "층", 쪽: "쪽", 몇: "멷", 식당: "식땅", 노래방: "노래방", 교실: "교실", 맞다: "맏따", 전화번호: "전화번호", 영화관: "영화관", 지하: "지하", 주소: "주소",
  책상: "책쌍", 필통: "필통", 앞: "압", 아래: "아래", 밑: "믿", 옆: "엽", 오른쪽: "오른쪽", 왼쪽: "왼쪽", 집: "집", 밖: "박", 무엇: "무얻", 꽃: "꼳",
  먹다: "먹따", 읽다: "익따", 듣다: "듣따", 일하다: "일하다", 정말: "정말", 맛있다: "마싣따/마딛따", 음악: "으막", 옷: "옫", 운동하다: "운동하다", 빵: "빵", 과일: "과일", 김밥: "김밥", 신발: "신발",
  다섯: "다섣", 여섯: "여섣", 일곱: "일곱", 여덟: "여덜", 아홉: "아홉", 열: "열", 장: "장", 공: "공", 창문: "창문", 앉다: "안따", 고맙다: "고맙따", 쓰다: "쓰다", 일찍: "일찍", 편의점: "펴늬점/펴니점",
  날짜: "날짜", 달력: "달력", 일월: "이뤌", 이월: "이월", 삼월: "사뭘", 사월: "사월", 오월: "오월", 유월: "유월", 칠월: "치뤌", 팔월: "파뤌", 구월: "구월", 시월: "시월", 십일월: "시비뤌", 십이월: "시비월",
  일일: "이릴", 이일: "이일", 삼일: "사밀", 사일: "사일", 오일: "오일", 육일: "유길", 칠일: "치릴", 팔일: "파릴", 구일: "구일",
  십일일: "시비릴", 십이일: "시비일", 십삼일: "십싸밀", 십사일: "십싸일", 십오일: "시보일", 십육일: "심뉴길", 십칠일: "십치릴", 십팔일: "십파릴", 십구일: "십꾸일", 이십일: "이시빌", 이십일일: "이시비릴", 이십이일: "이시비일", 이십삼일: "이십싸밀", 이십사일: "이십싸일", 이십오일: "이시보일", 이십육일: "이심뉴길", 이십칠일: "이십치릴", 이십팔일: "이십파릴", 이십구일: "이십꾸일", 삼십일: "삼시빌", 삼십일일: "삼시비릴",
  월요일: "워료일", 화요일: "화요일", 수요일: "수요일", 목요일: "모교일", 금요일: "그묘일", 토요일: "토요일", 일요일: "이료일", 생일: "생일", 언제: "언제", 주말: "주말", 수업: "수업", 여행: "여행", 며칠: "며칠", 사진: "사진", 찍다: "찍따", 도서관: "도서관", 아르바이트: "아르바이트", 수영: "수영", 점심: "점심", 식사: "식싸", 회의: "회의/훼이", 저녁: "저녁", 시작하다: "시자카다", 같이: "가치", 밥: "밥",
  날씨: "날씨", 계절: "계절", 맑다: "막따", 흐리다: "흐리다", 바람: "바람", 불다: "불다", 따뜻하다: "따뜨타다", 덥다: "덥따", 시원하다: "시원하다", 쌀쌀하다: "쌀쌀하다", 춥다: "춥따", 어떻다: "어떠타다", 좋다: "조타", 바쁘다: "바쁘다", 좀: "좀", 무겁다: "무겁따", 가볍다: "가볍따", 쉽다: "쉽따", 어렵다: "어렵따", 맵다: "맵따", 그렇지만: "그러치만", 아름답다: "아름답따",
  활동: "활똥", 미용실: "미용실", 놀이공원: "놀이공원", 박물관: "방물관", 수영장: "수영장", 산책하다: "산채카다", 구경하다: "구경하다", 자전거: "자전거", 청소하다: "청소하다", 어제: "어제", 재미있다: "재미읻따", 약속: "약쏙", 특별하다: "특뼐하다", 축구: "축꾸", 경기: "경기", 농구: "농구", 음료수: "음뇨수", 등산: "등산", 한강: "한강", 음식: "음식", 운동화: "운동화", 방학: "방학", 낚시: "낙씨", 걷다: "걷따", 내용: "내용", 다음: "다음"
};

function hasBatchim(word) {
  return [...word].some(char => {
    const code = char.charCodeAt(0);
    return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
  });
}

function classify(item) {
  if (sinoNumberIds.has(item.id)) return "sino";
  if (nativeNumberIds.has(item.id)) return "native";
  if (mixedWords.has(item.word)) return "mixed";
  if (loanwordWords.has(item.word)) return "loanword";
  if (properWords.has(item.word)) return "proper";
  if (grammarWords.has(item.word)) return "grammar";
  if (otherWords.has(item.word)) return "other";
  if (sinoWords.has(item.word) || sinoPatternWords.has(item.word)) return "sino";
  return "native";
}

function details(item, type) {
  const source = loanwordSources[item.word];
  if (item.word === "점심") return {
    vi: "Bắt nguồn từ chữ Hán 點心 (điểm tâm). Trong tiếng Hàn hiện đại, 점심 chủ yếu chỉ bữa trưa.",
    en: "From the Chinese characters 點心. In modern Korean, 점심 mainly means lunch.",
    zh: "源自汉字“點心”。在现代韩语中，점심 主要指午餐。"
  };
  if (item.word === "아르바이트") return {
    vi: "Mượn từ tiếng Đức Arbeit (“công việc”) qua tiếng Nhật; trong tiếng Hàn nghĩa là việc làm thêm.",
    en: "Borrowed from German Arbeit (“work”) via Japanese; in Korean it means a part-time job.",
    zh: "经日语借自德语 Arbeit（“工作”）；在韩语中指兼职。"
  };
  if (type === "loanword") return {
    vi: `Từ mượn dựa trên ${source}. Hãy liên hệ âm tiếng Hàn với từ gốc để ghi nhớ.`,
    en: `A loanword based on ${source}. Link the Korean sound to the source word to remember it.`,
    zh: `源自 ${source} 的外来词。可把韩语读音与原词联系起来记忆。`
  };
  if (type === "mixed") return {
    vi: "Từ ghép có thành phần ngoại lai và thành phần tiếng Hàn. Tách từng phần để ghi nhớ.",
    en: "A hybrid combining a foreign element with a Korean element. Remember it by splitting the parts.",
    zh: "由外来成分和韩语成分构成的混合词。拆分各部分记忆。"
  };
  if (item.word === "김밥") return {
    vi: "Tên món ăn ghép từ 김 (rong biển) và 밥 (cơm). Hình dung cơm được cuộn trong lá rong biển.",
    en: "A food name made from 김 (seaweed) and 밥 (rice). Picture rice rolled in a sheet of seaweed.",
    zh: "食物名称，由 김（紫菜）和 밥（米饭）组成。可想象米饭卷在紫菜里。"
  };
  if (item.word === "김치") return {
    vi: "Tên món ăn truyền thống của Hàn Quốc. Ghi nhớ bằng hình ảnh rau củ được muối và lên men.",
    en: "The name of a traditional Korean food. Remember it as salted and fermented vegetables.",
    zh: "韩国传统食物名称。可联系腌制、发酵蔬菜的形象来记忆。"
  };
  if (item.word === "불고기") return {
    vi: "Tên món ăn ghép từ 불 (lửa) và 고기 (thịt): thịt nướng hoặc chế biến trên lửa.",
    en: "A food name combining 불 (fire) and 고기 (meat): meat cooked over fire.",
    zh: "食物名称，由 불（火）和 고기（肉）组成：用火烹制的肉。"
  };
  if (type === "proper") return {
    vi: "Tên riêng hoặc tên văn hóa. Ghi nhớ bằng cách liên hệ với quốc gia, địa danh, món ăn hoặc văn hóa tương ứng.",
    en: "A proper or cultural name. Link it to the corresponding country, place, food, or cultural item.",
    zh: "专有名称或文化名称。可联系相应国家、地点、食物或文化来记忆。"
  };
  if (type === "grammar") return {
    vi: "Thành phần dùng để tạo cấu trúc câu. Hãy ghi nhớ trong cả cụm câu ví dụ thay vì học riêng lẻ.",
    en: "A grammar element used to build sentence patterns. Learn it inside the full example, not in isolation.",
    zh: "用于构成句型的语法成分。请结合完整例句记忆，不要孤立背诵。"
  };
  if (type === "sino") return {
    vi: "Từ Hán–Hàn. Thử liên hệ nghĩa với từ Hán Việt hoặc chữ Hán quen thuộc để ghi nhớ.",
    en: "A Sino-Korean word. Connect its meaning with familiar Chinese-character vocabulary.",
    zh: "汉字词。可联系熟悉的汉字词义来记忆。"
  };
  if (type === "native") return {
    vi: "Từ thuần Hàn. Hãy ghi nhớ theo hình ảnh, hành động hoặc tình huống trong câu ví dụ.",
    en: "A native Korean word. Remember it through an image, action, or the example situation.",
    zh: "固有词。可通过图像、动作或例句情境来记忆。"
  };
  return {
    vi: "Nguồn gốc chưa được xác định chắc chắn; không nên suy đoán. Hãy ghi nhớ qua câu ví dụ.",
    en: "The origin is uncertain, so it is not guessed here. Remember it through the example sentence.",
    zh: "词源尚未可靠确定，因此不作推测。请结合例句记忆。"
  };
}

function memoryTip(item, type) {
  const base = {
    vi: `Mẹo: gắn “${item.word}” với nghĩa “${item.meaning}” trong câu ví dụ.`,
    en: `Tip: connect “${item.word}” with “${item.meaning_en}” in the example sentence.`,
    zh: `记忆提示：把“${item.word}”与例句中的“${item.meaning_zh}”联系起来。`
  };
  if (type === "sino" && item.word.length >= 2) {
    base.vi = `Mẹo: tách các âm tiết của “${item.word}” và tìm lại chúng trong những từ Hán–Hàn khác.`;
    base.en = `Tip: split “${item.word}” into syllables and look for them in other Sino-Korean words.`;
    base.zh = `记忆提示：拆分“${item.word}”的音节，并在其他汉字词中寻找相同成分。`;
  }
  return base;
}

for (const item of vocabulary) {
  const type = classify(item);
  const detail = details(item, type);
  const tip = memoryTip(item, type);
  item.origin_type = type;
  item.origin_label_vi = ORIGIN_LABELS[type].vi;
  item.origin_label_en = ORIGIN_LABELS[type].en;
  item.origin_label_zh = ORIGIN_LABELS[type].zh;
  item.origin_note_vi = detail.vi;
  item.origin_note_en = detail.en;
  item.origin_note_zh = detail.zh;
  item.memory_tip_vi = tip.vi;
  item.memory_tip_en = tip.en;
  item.memory_tip_zh = tip.zh;
  const actual = pronunciationOverrides[item.word];
  item.actual_pronunciation = actual && actual !== item.word ? actual : "";
}

const lesson7Fixes = {
  수업: ["오후 세 시에 수업이 있어요.", "Tôi có lớp học lúc 3 giờ chiều.", "I have a class at 3 p.m.", "我下午三点有课。"],
  사진: ["오후 세 시에 사진을 찍어요.", "Tôi chụp ảnh lúc 3 giờ chiều.", "I take pictures at 3 p.m.", "我下午三点拍照。"],
  수영: ["오후 세 시에 수영을 해요.", "Tôi bơi lúc 3 giờ chiều.", "I swim at 3 p.m.", "我下午三点游泳。"],
  점심: ["오후 세 시에 점심을 먹어요.", "Tôi ăn trưa lúc 3 giờ chiều.", "I have lunch at 3 p.m.", "我下午三点吃午饭。"],
  식사: ["오후 세 시에 식사를 해요.", "Tôi dùng bữa lúc 3 giờ chiều.", "I have a meal at 3 p.m.", "我下午三点用餐。"],
  아르바이트: ["오후 세 시에 아르바이트를 해요.", "Tôi làm thêm lúc 3 giờ chiều.", "I work part-time at 3 p.m.", "我下午三点做兼职。"],
  드라마: ["오후 세 시에 드라마를 봐요.", "Tôi xem phim truyền hình lúc 3 giờ chiều.", "I watch a TV drama at 3 p.m.", "我下午三点看电视剧。"],
  파티: ["오후 세 시에 파티를 해요.", "Tôi tổ chức tiệc lúc 3 giờ chiều.", "I have a party at 3 p.m.", "我下午三点举办派对。"],
  밥: ["오후 세 시에 밥을 먹어요.", "Tôi ăn cơm lúc 3 giờ chiều.", "I eat a meal at 3 p.m.", "我下午三点吃饭。"]
};
for (const item of vocabulary) {
  const fix = item.lesson === 7 ? lesson7Fixes[item.word] : null;
  if (!fix) continue;
  [item.example, item.example_vi, item.example_en, item.example_zh] = fix;
}

fs.writeFileSync(vocabularyPath, `${JSON.stringify(vocabulary, null, 2)}\n`);
console.log(`Enriched ${vocabulary.length} vocabulary entries.`);
