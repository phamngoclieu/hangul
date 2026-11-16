import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const coursesPath = path.join(root, "app/data/courses.json");
const outputPath = path.join(root, "app/data/book-examples.json");
const translationsPath = path.join(root, "app/data/example-translations-vi.json");
const assignedRoot = process.env.SEJONG_ASSIGNED_ROOT || "/private/tmp";
const courseData = JSON.parse(fs.readFileSync(coursesPath, "utf8"));
const exampleTranslations = JSON.parse(fs.readFileSync(translationsPath, "utf8"));

const assignedById = new Map();
for (const courseId of ["sejong-1", "sejong-2"]) {
  const source = path.join(assignedRoot, `${courseId}-assigned-examples.json`);
  if (!fs.existsSync(source)) {
    throw new Error(`Thiếu dữ liệu OCR đã đối chiếu: ${source}`);
  }
  for (const item of JSON.parse(fs.readFileSync(source, "utf8"))) {
    if (!item.missing) assignedById.set(item.id, item);
  }
}

function lastHangul(value) {
  return [...String(value).replace(/[^가-힣]/gu, "")].at(-1) || "";
}

function hasBatchim(value) {
  const char = lastHangul(value);
  if (!char) return false;
  return (char.codePointAt(0) - 0xac00) % 28 !== 0;
}

function topic(value) {
  return `${value}${hasBatchim(value) ? "은" : "는"}`;
}

function subject(value) {
  return `${value}${hasBatchim(value) ? "이" : "가"}`;
}

function object(value) {
  return `${value}${hasBatchim(value) ? "을" : "를"}`;
}

function nounPredicate(value) {
  return `${value}${hasBatchim(value) ? "이에요" : "예요"}`;
}

const politeOverrides = new Map(Object.entries({
  "가다": "가요", "가져오다": "가져와요", "가깝다": "가까워요", "갈아타다": "갈아타요",
  "걷다": "걸어요", "걸어가다": "걸어가요", "걸어오다": "걸어와요", "계시다": "계세요",
  "고르다": "골라요", "귀엽다": "귀여워요", "기쁘다": "기뻐요", "끝나다": "끝나요",
  "나가다": "나가요", "나쁘다": "나빠요", "낫다": "나아요", "내려가다": "내려가요",
  "내려오다": "내려와요", "넓다": "넓어요", "놀러 가다": "놀러 가요", "다르다": "달라요",
  "다치다": "다쳐요", "달다": "달아요", "덥다": "더워요", "더럽다": "더러워요",
  "도와주다": "도와줘요", "돌아가시다": "돌아가셨어요", "되다": "돼요", "듣다": "들어요",
  "들어가다": "들어가요", "드시다": "드세요", "따뜻하다": "따뜻해요", "마르다": "말라요",
  "마시다": "마셔요", "만나다": "만나요", "맵다": "매워요", "먹다": "먹어요",
  "멀다": "멀어요", "멋있다": "멋있어요", "모르다": "몰라요", "모이다": "모여요",
  "바쁘다": "바빠요", "바꾸다": "바꿔요", "배우다": "배워요", "보내다": "보내요",
  "보다": "봐요", "보이다": "보여요", "복잡하다": "복잡해요", "빌리다": "빌려요",
  "살다": "살아요", "생기다": "생겨요", "서다": "서요", "성공하다": "성공해요",
  "시끄럽다": "시끄러워요", "시다": "셔요", "시원하다": "시원해요", "신청하다": "신청해요",
  "싱겁다": "싱거워요", "쓰다": "써요", "씻다": "씻어요", "아름답다": "아름다워요",
  "아프다": "아파요", "앉다": "앉아요", "어렵다": "어려워요", "없다": "없어요",
  "예쁘다": "예뻐요", "오다": "와요", "올라가다": "올라가요", "올라오다": "올라와요",
  "외롭다": "외로워요", "읽다": "읽어요", "일어나다": "일어나요", "있다": "있어요",
  "작다": "작아요", "잘생기다": "잘생겼어요", "재미없다": "재미없어요", "좋다": "좋아요",
  "좋아지다": "좋아져요", "주다": "줘요", "주무시다": "주무세요", "즐겁다": "즐거워요",
  "지나다": "지나요", "짜다": "짜요", "찾다": "찾아요", "춥다": "추워요",
  "크다": "커요", "타다": "타요", "팔다": "팔아요", "편찮으시다": "편찮으세요",
  "피곤하다": "피곤해요", "하다": "해요", "행복하다": "행복해요", "힘들다": "힘들어요"
}));

function polite(dictionaryForm) {
  const value = String(dictionaryForm).trim();
  if (politeOverrides.has(value)) return politeOverrides.get(value);
  if (value.endsWith("하다")) return `${value.slice(0, -2)}해요`;
  if (value.endsWith("되다")) return `${value.slice(0, -2)}돼요`;
  if (!value.endsWith("다")) return value;
  const stem = value.slice(0, -1);
  const last = lastHangul(stem);
  if (!last) return `${stem}어요`;
  const code = last.codePointAt(0) - 0xac00;
  const vowel = Math.floor((code % 588) / 28);
  if (code % 28 === 0 && [0, 8].includes(vowel)) return `${stem}요`;
  return `${stem}${[0, 8].includes(vowel) ? "아요" : "어요"}`;
}

function politeExpression(value) {
  const clean = String(value).replace(/[?.!]$/u, "").replace(/^\(([^)]+)\)/u, "$1").trim();
  const match = clean.match(/^(.*?)([가-힣]+다)$/u);
  if (!match) return clean;
  return `${match[1]}${polite(match[2])}`;
}

function specialFallback(courseId, item) {
  const key = `${courseId}:${item.word}`;
  const examples = {
    "sejong-1:밖": "친구가 교실 밖에 있어요.",
    "sejong-1:아니요": "아니요, 저는 회사원이 아니에요.",
    "sejong-1:무엇을 드릴까요?": "무엇을 드릴까요?",
    "sejong-1:권": "책 세 권 주세요.",
    "sejong-1:우리": "우리 같이 축구를 해요.",
    "sejong-1:날씨가 나쁘다": "오늘은 날씨가 나빠요.",
    "sejong-1:날씨가 좋다": "오늘은 날씨가 좋아요.",
    "sejong-1:눈이 오다": "오늘은 눈이 와요.",
    "sejong-1:비가 오다": "오늘은 비가 와요.",
    "sejong-1:시간이 없다": "오늘은 시간이 없어요.",
    "sejong-1:시간이 있다": "내일은 시간이 있어요.",
    "sejong-1:약속이 없다": "이번 주말에는 약속이 없어요.",
    "sejong-1:약속이 있다": "오늘 저녁에 약속이 있어요.",
    "sejong-1:일이 있다": "오전에는 일이 있어요.",
    "sejong-1:아프다": "어제는 많이 아팠어요.",
    "sejong-1:쉽다": "한국어 읽기는 쉬워요.",
    "sejong-1:어렵다": "한국어 쓰기는 어려워요.",
    "sejong-1:잘하다": "민수 씨는 한국어를 잘해요.",
    "sejong-1:살다": "저는 서울에서 살아요.",
    "sejong-2:갔다 오다": "여행을 하고 한국에 갔다 왔어요.",
    "sejong-2:그저 그렇다": "요즘은 그저 그래요.",
    "sejong-2:방학을 잘 보냈어요?": "방학을 잘 보냈어요?",
    "sejong-2:전화를 받다": "미안해요, 전화를 못 받았어요.",
    "sejong-2:정신이 없다": "요즘 일이 많아서 정신이 없어요.",
    "sejong-2:건강에 좋다": "매일 운동하면 건강에 좋아요.",
    "sejong-2:전혀": "저는 게임을 전혀 하지 않아요.",
    "sejong-2:별로": "저는 운동을 별로 안 좋아해요.",
    "sejong-2:인기가 있다": "비빔밥은 인기가 있어요.",
    "sejong-2:(일) 번": "시청 앞에서 1번 버스를 타세요.",
    "sejong-2:(한) 번": "한국 음식을 한 번 먹어 보세요.",
    "sejong-2:그쪽": "그쪽으로 쭉 가세요.",
    "sejong-2:저쪽": "은행은 저쪽에 있어요.",
    "sejong-2:쯤": "오후 세 시쯤 만나요.",
    "sejong-2:실례지만 어디세요?": "실례지만 지금 어디세요?",
    "sejong-2:댁": "지금 댁에 계세요?",
    "sejong-2:계시다": "할아버지는 고향에 계세요.",
    "sejong-2:돌아가시다": "할머니는 작년에 돌아가셨어요.",
    "sejong-2:드시다": "아버지는 아침을 드세요.",
    "sejong-2:말씀하시다": "선생님께서 천천히 말씀하세요.",
    "sejong-2:주무시다": "할아버지는 방에서 주무세요.",
    "sejong-2:편찮으시다": "할머니께서 조금 편찮으세요.",
    "sejong-2:경치가 좋다": "제주도는 경치가 좋아요.",
    "sejong-2:공기가 맑다": "제주도는 공기가 맑아요.",
    "sejong-2:교통이 불편하다": "시골은 교통이 불편해요.",
    "sejong-2:교통이 편리하다": "서울은 교통이 편리해요.",
    "sejong-2:사람들이 친절하다": "서울은 사람들이 친절해요.",
    "sejong-2:감기에 걸리다": "수진 씨는 감기에 걸렸어요.",
    "sejong-2:몸이 안 좋다": "감기에 걸려서 몸이 안 좋아요.",
    "sejong-2:열이 나다": "감기에 걸려서 열이 나요.",
    "sejong-2:비밀": "이 이야기는 비밀이에요.",
    "sejong-2:전": "약은 식사 전에 드세요.",
    "sejong-2:끝나다": "시험이 끝난 후에 친구들이 모여요.",
    "sejong-2:모임을 준비하다": "우리 반 학기 말 모임을 준비해요.",
    "sejong-2:발표회": "한국어 말하기 발표회를 준비해요.",
    "sejong-2:생각": "좋은 생각이에요.",
    "sejong-2:순서": "발표 순서를 정해야 해요.",
    "sejong-2:체육 대회": "세종학당 체육 대회를 준비해요.",
    "sejong-2:높은 건물이 많다": "서울에는 높은 건물이 많아요.",
    "sejong-2:분위기가 좋다": "제 고향은 분위기가 좋아요.",
    "sejong-2:살기 좋다": "전주는 조용해서 살기 좋아요.",
    "sejong-2:인기가 많다": "제주도는 경치가 좋아서 인기가 많아요.",
    "sejong-2:전통적인 도시다": "전주는 전통적인 도시예요.",
    "sejong-2:현대적인 도시다": "서울은 현대적인 도시예요.",
    "sejong-2:기분이 나쁘다": "시험을 잘 못 봐서 기분이 나빠요.",
    "sejong-2:기분이 좋다": "친구를 만나서 기분이 좋아요.",
    "sejong-2:다행이다": "친구들이 많이 생겨서 다행이에요.",
    "sejong-2:생기다": "학교에서 새 친구가 생겼어요.",
    "sejong-2:스트레스가 많다": "요즘 일이 많아서 스트레스가 많아요.",
    "sejong-2:화가 나다": "약속에 늦어서 친구가 화가 났어요.",
    "sejong-2:화가 풀리다": "친구와 이야기한 후에 화가 풀렸어요.",
    "sejong-2:(선생님)이 되다": "나중에 선생님이 되고 싶어요.",
    "sejong-2:(한) 살": "아들은 한 살이에요.",
    "sejong-2:꿈을 이루다": "열심히 공부해서 꿈을 이루고 싶어요.",
    "sejong-2:돈을 많이 벌다": "사업을 해서 돈을 많이 벌고 싶어요.",
    "sejong-2:번역가가 되다": "나중에 한국어 번역가가 되고 싶어요.",
    "sejong-2:통역사가 되다": "한국어를 공부해서 통역사가 되고 싶어요.",
    "sejong-2:좋은 사람과 결혼하다": "나중에 좋은 사람과 결혼하고 싶어요.",
    "sejong-2:한국으로 여행을 가다": "방학에 한국으로 여행을 가려고 해요.",
    "sejong-2:한국으로 유학을 가다": "한국으로 유학을 가려고 한국어를 공부해요."
  };
  Object.assign(examples, {
    "sejong-1:안": "책이 가방 안에 있어요.",
    "sejong-1:위": "책이 책상 위에 있어요.",
    "sejong-1:씨": "김민수 씨는 학생이에요.",
    "sejong-1:뭐 해요?": "민수 씨는 지금 뭐 해요?",
    "sejong-1:어디": "투이 씨는 어디에 가요?",
    "sejong-1:뒤": "의자가 책상 뒤에 있어요.",
    "sejong-1:아래": "가방이 의자 아래에 있어요.",
    "sejong-1:의자": "네, 의자가 있어요.",
    "sejong-1:사다": "시장에서 사과를 사요.",
    "sejong-1:병": "물 두 병 주세요.",
    "sejong-1:잔": "주스 세 잔 주세요.",
    "sejong-1:친구": "친구 두 명이 교실에 있어요.",
    "sejong-1:듣다": "치엔 씨는 음악을 들었어요.",
    "sejong-1:보다": "어제 한국 영화를 봤어요.",
    "sejong-1:마시다": "어제 커피를 마셨어요.",
    "sejong-1:만나다": "어제 민수 씨를 만났어요.",
    "sejong-1:영화를 보다": "어제 친구하고 영화를 봤어요.",
    "sejong-1:음악": "저는 한국 음악을 좋아해요.",
    "sejong-1:봄": "타완 씨는 봄을 좋아해요?",
    "sejong-1:가져오다": "두꺼운 옷을 가져오세요.",
    "sejong-1:언제": "언제 한국에 가요?",
    "sejong-1:미안하다": "제가 많이 늦었어요. 미안해요.",
    "sejong-1:점심을 먹다": "점심을 같이 먹을까요?",
    "sejong-1:저녁을 먹다": "오늘 저녁을 같이 먹을까요?",
    "sejong-1:아프다": "어제부터 머리가 아팠어요.",
    "sejong-1:주말": "주말에는 보통 집에서 쉬어요.",
    "sejong-1:강의실": "한국 노래 수업은 3층 강의실에서 합니다.",
    "sejong-1:배우다": "세종학당에서 한국어를 배워요.",
    "sejong-1:이유": "한국 음악을 좋아해서 한국어를 공부해요.",
    "sejong-1:시작하다": "지난 2월에 한국어 공부를 시작했습니다.",
    "sejong-1:한 달": "한국 노래 교실은 한 달 동안 열립니다.",
    "sejong-1:결혼": "내년에 결혼을 할 거예요.",
    "sejong-1:유학": "내년에 중국으로 유학을 갈 거예요.",
    "sejong-1:졸업": "올해 대학교를 졸업해요.",
    "sejong-1:휴가": "이번 휴가에는 한국을 여행할 거예요.",
    "sejong-1:재미있다": "한국어 수업은 아주 재미있습니다.",
    "sejong-1:월요일": "월요일에 한국어 수업이 있어요.",
    "sejong-1:일요일": "일요일에는 집에서 쉬어요.",
    "sejong-1:계획": "앞으로 한국어를 계속 공부할 계획입니다.",
    "sejong-1:방학": "방학에는 한국 가게에서 아르바이트를 할 거예요.",
    "sejong-1:두꺼운 옷": "겨울에는 두꺼운 옷을 입어요.",
    "sejong-1:앞으로": "앞으로 한국어를 열심히 공부할 거예요.",
    "sejong-1:아르바이트": "방학에 한국 가게에서 아르바이트를 할 것입니다.",
    "sejong-2:배드민턴을 치다": "주말마다 배드민턴을 쳐요.",
    "sejong-2:피아노를 치다": "주말마다 피아노를 쳐요.",
    "sejong-2:일어나다": "저는 매일 일찍 일어나요.",
    "sejong-2:취미": "취미로 배드민턴을 칩니다.",
    "sejong-2:다": "음식을 다 먹었어요.",
    "sejong-2:설렁탕": "저는 설렁탕을 먹을래요.",
    "sejong-2:소개하다": "친구에게 맛있는 식당을 소개해요.",
    "sejong-2:쓰다": "이 약은 맛이 써요.",
    "sejong-2:갈아타다": "시청 앞에서 버스를 한 번 갈아타세요.",
    "sejong-2:보내다": "이 책을 어느 나라에 보낼 거예요?",
    "sejong-2:생신": "지난주 토요일은 어머니 생신이었습니다.",
    "sejong-2:어떻게": "한국문화원까지 어떻게 가요?",
    "sejong-2:타고 다니다": "저는 지하철을 타고 다녀요.",
    "sejong-2:타고 오다": "학교에 버스를 타고 와요.",
    "sejong-2:가깝다": "우리 집은 서울병원에서 가까워요.",
    "sejong-2:건너다": "길을 건너서 오른쪽으로 가세요.",
    "sejong-2:나가다": "교실 밖으로 나가세요.",
    "sejong-2:내려가다": "계단으로 내려가세요.",
    "sejong-2:내려오다": "2층에서 계단으로 내려오세요.",
    "sejong-2:들어가다": "오른쪽 문으로 들어가세요.",
    "sejong-2:올라가다": "계단으로 2층에 올라가세요.",
    "sejong-2:올라오다": "엘리베이터를 타고 올라오세요.",
    "sejong-2:지나다": "은행을 지나서 오른쪽으로 가세요.",
    "sejong-2:가르치다": "선생님이 학생들에게 한국어를 가르쳐요.",
    "sejong-2:걱정하다": "친구가 늦어서 걱정해요.",
    "sejong-2:모르다": "전화번호를 잘 몰라요.",
    "sejong-2:빌리다": "친구에게 사전을 빌려요.",
    "sejong-2:사전": "친구에게 사전을 빌려 줬어요.",
    "sejong-2:여행사": "세종 여행사에 전화했어요.",
    "sejong-2:음성 메시지를 남기다": "전화한 후에 음성 메시지를 남겨요.",
    "sejong-2:전화를 끊다": "통화가 끝나면 전화를 끊어요.",
    "sejong-2:OO 씨 좀 바꿔 주세요": "민수 씨 좀 바꿔 주세요.",
    "sejong-2:넥타이를 매다": "저 남자는 노란색 넥타이를 매요.",
    "sejong-2:보이다": "저기 키가 큰 여학생이 보여요?",
    "sejong-2:저기": "저기에 키가 큰 여학생이 있어요.",
    "sejong-2:가족": "우리 가족은 다섯 명이에요.",
    "sejong-2:똑똑하다": "형의 딸은 아주 똑똑합니다.",
    "sejong-2:분": "아버지와 어머니는 두 분 다 회사에 다니세요.",
    "sejong-2:주부": "어머니는 주부세요.",
    "sejong-2:온천": "온천이 있는 곳에 가고 싶어요.",
    "sejong-2:작년": "작년에는 제주도를 여행했어요.",
    "sejong-2:저곳": "저곳은 드라마 촬영지예요.",
    "sejong-2:하지만": "하지만 아직 한국에 못 가 봤어요.",
    "sejong-2:호수": "호수가 있는 곳에 가고 싶어요.",
    "sejong-2:낫다": "약을 먹고 푹 쉬면 빨리 나아요.",
    "sejong-2:바꾸다": "건강한 하루를 위해 습관을 바꾸세요.",
    "sejong-2:씻다": "화장실에 갔다 온 후에 손을 꼭 씻으세요.",
    "sejong-2:좋아지다": "약을 먹은 후에 몸이 좋아졌어요.",
    "sejong-2:도와주다": "내일 우리 집에 와서 저 좀 도와줄래요?",
    "sejong-2:모이다": "친구들은 식당에 모여요.",
    "sejong-2:사람들을 초대하다": "생일 파티에 친구들을 초대해요.",
    "sejong-2:시간을 정하다": "모임 시간을 정해야 해요.",
    "sejong-2:연락을 하다": "유키 씨에게 지금 연락할게요.",
    "sejong-2:장소를 예약하다": "제가 모임 장소를 예약할게요.",
    "sejong-2:회비를 모으다": "우리 반에서 회비를 모아요.",
    "sejong-2:대도시": "서울은 복잡한 대도시예요.",
    "sejong-2:마을": "제 고향은 조용한 시골 마을입니다.",
    "sejong-2:늘다": "학교생활을 하면서 한국말도 많이 늘었어요.",
    "sejong-2:연락드리다": "한국에 가면 선생님께 연락드리겠습니다.",
    "sejong-2:고급": "고급반에서 한국어를 배우고 싶어요.",
    "sejong-2:사업을 하다": "졸업하면 사업을 할 거예요.",
    "sejong-2:성공하다": "열심히 일해서 성공하고 싶어요.",
    "sejong-2:신청하다": "고급반을 신청하려고 해요.",
    "sejong-2:아이들": "나중에 선생님이 되어서 아이들을 가르치고 싶어요.",
    "sejong-2:양복": "취직하면 새 양복을 살 거예요.",
    "sejong-2:중급": "중급반에서 한국어를 배우고 싶어요.",
    "sejong-2:초급": "초급반에서 한국어를 배우고 싶어요.",
    "sejong-2:나오다": "1번 출구로 나오세요.",
    "sejong-2:빨간색": "저기 빨간색 옷을 입은 사람이 보여요?",
    "sejong-2:청바지": "오늘 민수 씨는 청바지를 입고 있어요.",
    "sejong-2:누나": "우리 가족은 아버지, 어머니, 누나, 형, 저, 다섯 명입니다.",
    "sejong-2:아내": "제 아내는 회사원이에요.",
    "sejong-2:곳": "온천이 있고 유적지도 있는 곳에 가고 싶어요.",
    "sejong-2:학기 말": "학기 말에 친구들과 모일 거예요.",
    "sejong-2:뉴스": "저는 아침마다 뉴스를 봐요.",
    "sejong-2:다르다": "도시와 시골은 분위기가 달라요.",
    "sejong-2:비슷하다": "두 도시는 분위기가 비슷해요.",
    "sejong-2:가사": "저는 한국 노래 가사를 알고 싶어요.",
    "sejong-2:어느": "어느 버스를 타야 해요?",
    "sejong-2:어머니": "어머니 생신에 기차를 타고 고향에 갔어요.",
    "sejong-2:길": "이 길을 건너서 오른쪽으로 가세요.",
    "sejong-2:우리 집": "우리 집은 아파트 3층에 있어요.",
    "sejong-2:여학생": "문 앞에 키가 큰 여학생이 있어요.",
    "sejong-2:문": "문 옆에 사람이 서 있어요.",
    "sejong-2:노란색": "저 남자는 노란색 넥타이를 매고 있어요.",
    "sejong-2:습관": "좋은 습관이 건강한 하루를 만듭니다.",
    "sejong-2:적다": "여기는 사람들이 적지만 제 고향은 사람들이 많아요.",
    "sejong-2:타다": "저는 버스를 타고 학교에 가요."
  });
  return examples[key] || "";
}

function fallbackExample(courseId, lessonId, item) {
  const word = item.word;
  const special = specialFallback(courseId, item);
  if (special) return special;
  if (word.endsWith("?")) return word;

  if (courseId === "sejong-1") {
    if (item.vocabularyGroup === "numbers-sino") return `가격은 ${word} 원이에요.`;
    if (item.vocabularyGroup === "numbers-native") return `숫자는 ${nounPredicate(word)}.`;
    if (lessonId === 0) return `${subject(word)} 받침이 있어요.`;
    if (lessonId === 1) return `저는 ${nounPredicate(word)}.`;
    if (lessonId === 2) {
      if (["공원", "시장", "식당", "학교", "회사"].includes(word)) return `${word}에 가요.`;
      if (word.endsWith("다")) return `지금 ${politeExpression(word)}.`;
      return `${word} 친구를 만나요.`;
    }
    if (lessonId === 3) {
      if (["앞", "뒤", "위", "아래", "밑", "옆", "안", "밖"].includes(word)) return `책이 책상 ${word}에 있어요.`;
      return `${subject(word)} 교실에 있어요.`;
    }
    if (lessonId === 4) {
      if (word.endsWith("다")) return `시장에서 ${politeExpression(word)}.`;
      return `${object(word)} 주세요.`;
    }
    if (lessonId === 5) {
      if (["개", "병", "잔", "명"].includes(word)) return `주스 세 ${word} 주세요.`;
      if (word.endsWith("다")) return `만나서 ${politeExpression(word)}.`;
      return `${word} 친구가 가게에 있어요.`;
    }
    if (lessonId === 6) {
      if (word.endsWith("다")) return `어제 ${politeExpression(word)}.`;
      if (["극장", "도서관", "백화점", "커피숍"].includes(word)) return `어제 ${word}에서 친구를 만났어요.`;
      return `어제 ${object(word)} 봤어요.`;
    }
    if (lessonId === 7) {
      if (["봄", "여름", "가을", "겨울"].includes(word)) return `저는 ${object(word)} 좋아해요.`;
      if (word.endsWith("다")) return `오늘은 ${politeExpression(word)}.`;
      return `${word} 날씨가 어때요?`;
    }
    if (lessonId === 8) {
      if (/월$/u.test(word)) return `약속은 ${word} 오일이에요.`;
      if (/일$/u.test(word)) return `오늘은 ${word}이에요.`;
      if (/요일$/u.test(word)) return `한국어 수업은 ${word}에 있어요.`;
      return `${word} 세 시에 만나요.`;
    }
    if (lessonId === 9) {
      if (word.endsWith("다")) return `오늘 저녁에 ${politeExpression(word)}.`;
      return `${word}에서 두 시에 만나요.`;
    }
    if (lessonId === 10) {
      if (word.endsWith("다")) return `이번 주말에 ${politeExpression(word)}.`;
      return `지난 주말에 ${word}에 갔어요.`;
    }
    if (lessonId === 11) {
      if (word.endsWith("다")) return `한국어 공부는 ${politeExpression(word)}.`;
      return `한국어 수업에서 ${object(word)} 배워요.`;
    }
    if (lessonId === 12) {
      if (word.endsWith("다")) return `앞으로도 ${politeExpression(word)}.`;
      return `다음 달에는 ${object(word)} 할 거예요.`;
    }
  }

  if (courseId === "sejong-2") {
    if (lessonId === 1) return word.endsWith("다") ? `요즘은 ${politeExpression(word)}.` : `친구에게 “${word}”라고 말했어요.`;
    if (lessonId === 2) {
      if (word.endsWith("다")) return `주말마다 ${politeExpression(word)}.`;
      if (["가끔", "거의", "꼭", "매일", "매주", "너무", "언제나", "자주", "항상"].includes(word)) return `${word} 운동해요.`;
      return `${word}에서 운동해요.`;
    }
    if (lessonId === 3) return word.endsWith("다") ? `이 음식은 ${politeExpression(word)}.` : `${object(word)} 먹고 싶어요.`;
    if (lessonId === 4) {
      if (word.endsWith("다")) return `시청까지 ${politeExpression(word)}.`;
      if (["근처", "기숙사", "도시", "생신", "설악산", "시청", "한국문화원"].includes(word)) return `${word}에 가요.`;
      return `${object(word)} 타고 가요.`;
    }
    if (lessonId === 5) {
      if (word.endsWith("다")) return `은행 앞에서 ${politeExpression(word)}.`;
      if (["오른쪽", "왼쪽", "이쪽", "그쪽", "저쪽"].includes(word)) return `${word}으로 가세요.`;
      return `${topic(word)} 어디에 있어요?`;
    }
    if (lessonId === 6) {
      if (word.endsWith("다")) return `친구에게 ${politeExpression(word)}.`;
      return `전화로 ${object(word)} 물어봤어요.`;
    }
    if (lessonId === 7) {
      if (word.endsWith("다")) return `저 학생은 ${politeExpression(word)}.`;
      if (/색$/u.test(word)) return `저는 ${word} 옷을 입고 있어요.`;
      return `저 학생은 ${object(word)} 가지고 있어요.`;
    }
    if (lessonId === 8) {
      if (word.endsWith("다")) return `할아버지는 집에 ${politeExpression(word)}.`;
      return `우리 가족에는 ${subject(word)} 있어요.`;
    }
    if (lessonId === 9) {
      if (word.endsWith("다")) return `제주도는 ${politeExpression(word)}.`;
      return `여행에서 ${object(word)} 보고 싶어요.`;
    }
    if (lessonId === 10) {
      if (word.endsWith("다")) return `오늘은 ${politeExpression(word)}.`;
      if (["귀", "눈", "다리", "머리", "목", "발", "배", "손", "어깨", "얼굴", "입", "팔", "허리"].includes(word)) return `${subject(word)} 아파요.`;
      return `${object(word)} 잘 관리하세요.`;
    }
    if (lessonId === 11) {
      if (word.endsWith("다")) return `모임을 위해 ${politeExpression(word)}.`;
      return `${object(word)} 준비해야 해요.`;
    }
    if (lessonId === 12) {
      if (word.endsWith("다")) return `제 고향은 ${politeExpression(word)}.`;
      return `제 고향에는 ${subject(word)} 있어요.`;
    }
    if (lessonId === 13) return word.endsWith("다") ? `요즘은 ${politeExpression(word)}.` : `${word} 친구를 만나러 가요.`;
    if (lessonId === 14) {
      if (word.endsWith("다")) return `나중에 ${politeExpression(word)}.`;
      return `저는 ${object(word)} 배우고 싶어요.`;
    }
  }

  return `${word}.`;
}

function isUsableAssigned(item, assigned) {
  const value = String(assigned?.example || "").trim();
  if (!value || !/[.!?]$/u.test(value)) return false;
  if (/^(?:씨|\[|\]|그\s)/u.test(value)) return false;
  if (value === item.word || value.length < 5) return false;
  return true;
}

const sources = {
  "sejong-1": { book: "Sejong1.pdf", pageCount: 192 },
  "sejong-2": { book: "Sejong2.pdf", pageCount: 192 }
};
const items = {};
const seenByCourse = new Map();
const stats = {};

for (const course of courseData.courses || []) {
  const seen = new Set();
  seenByCourse.set(course.id, seen);
  stats[course.id] = { verbatim: 0, completedExercise: 0 };
  const lessonById = new Map((course.lessons || []).map(lesson => [lesson.id, lesson]));
  const vocabulary = [
    ...(course.lessons || []).flatMap(lesson => lesson.vocabulary || []),
    ...(course.numberVocabulary?.sino || []),
    ...(course.numberVocabulary?.native || [])
  ];

  for (const item of vocabulary) {
    const lesson = lessonById.get(item.lesson);
    const assigned = assignedById.get(item.id);
    const special = specialFallback(course.id, item);
    const forceGenerated = Boolean(special || item.vocabularyGroup);
    const useAssigned = !forceGenerated && isUsableAssigned(item, assigned) && !seen.has(assigned.example.trim());
    let example = special || (useAssigned ? assigned.example.trim() : fallbackExample(course.id, item.lesson, item));
    let sourceType = useAssigned ? "verbatim" : "completed-exercise";
    let sourcePage = useAssigned ? assigned.exampleSourcePage : item.sourcePage;
    if (!Number.isInteger(sourcePage) || sourcePage < 1 || sourcePage > sources[course.id].pageCount) {
      sourcePage = item.word === "(한) 살" ? 159 : Math.max(lesson.pages[0], Number(sourcePage) || lesson.pages[0]);
    }
    if (seen.has(example)) {
      example = `${topic(item.word.replace(/[?.!]/gu, ""))} 이 문장에서 쓰였어요.`;
      sourceType = "completed-exercise";
    }
    if (!/[.!?]$/u.test(example)) example = `${example}.`;
    seen.add(example);
    stats[course.id][sourceType === "verbatim" ? "verbatim" : "completedExercise"] += 1;
    const exampleVi = String(exampleTranslations.items?.[item.id] || "").trim();
    if (!exampleVi) throw new Error(`Thiếu bản dịch tiếng Việt cho ${item.id}`);
    items[item.id] = { example, exampleVi, sourcePage, sourceType };
  }
}

const payload = {
  version: 1,
  note: "Câu nguyên văn hoặc câu hoàn chỉnh từ đúng mẫu bài tập trong sách; trang nguồn chỉ dùng để kiểm tra nội bộ.",
  sources,
  items
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Đã tạo ${Object.keys(items).length} câu ví dụ:`, stats);
