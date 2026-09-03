import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const generatedRoot = process.env.SEJONG_GENERATED_ROOT || "/private/tmp/sejong-full-ocr";

const currentVocabulary = JSON.parse(fs.readFileSync(path.join(root, "app/data/vocabulary.json"), "utf8"));
const currentOrigins = JSON.parse(fs.readFileSync(path.join(root, "app/data/word-origins.json"), "utf8"));
const dictionary = JSON.parse(fs.readFileSync(path.join(generatedRoot, "dictionary.json"), "utf8"));
const assets = JSON.parse(fs.readFileSync(path.join(generatedRoot, "assets-manifest.json"), "utf8"));

const oldVocabularyByWord = new Map(currentVocabulary.map(item => [item.word, item]));
const oldOriginByWord = new Map(currentVocabulary.map(item => [item.word, currentOrigins.items[item.id]]));

const SOURCE_DICTIONARY = "Từ điển tiếng Hàn cơ sở · Viện Quốc ngữ Quốc gia Hàn Quốc";

const FALLBACK_MEANINGS = {
  "날씨가 나쁘다": "thời tiết xấu", "날씨가 어때요?": "thời tiết thế nào?", "날씨가 좋다": "thời tiết đẹp",
  "남자 친구를 만나다": "gặp bạn trai", "낮잠을 자다": "ngủ trưa", "놀러 가다": "đi chơi", "눈이 오다": "tuyết rơi",
  "두꺼운 옷": "quần áo dày", "다음 달": "tháng sau", "몽골 사람": "người Mông Cổ", "무엇을 드릴까요?": "quý khách muốn lấy gì?",
  "무슨 요일": "thứ mấy", "뭐 해요?": "đang làm gì?", "베트남 사람": "người Việt Nam", "비가 오다": "trời mưa",
  "사진을 찍다": "chụp ảnh", "삼십일": "ngày ba mươi", "삼십일일": "ngày ba mươi mốt", "삼일": "ngày mùng ba",
  "쇼핑을 하다": "đi mua sắm", "시간이 없다": "không có thời gian", "시간이 있다": "có thời gian", "같이": "cùng nhau",
  "십육": "mười sáu", "십이": "mười hai", "십일": "mười một", "십일일": "ngày mười một", "십칠": "mười bảy", "십팔": "mười tám",
  "앞으로": "từ nay về sau; phía trước", "약속을 하다": "hẹn; lập cuộc hẹn", "약속이 있다": "có hẹn", "약속이 없다": "không có hẹn",
  "얼마예요?": "bao nhiêu tiền?", "여자 친구를 만나다": "gặp bạn gái", "여행을 가다": "đi du lịch", "여행을 하다": "du lịch",
  "열하나": "mười một (số thuần Hàn)", "영화를 보다": "xem phim", "육일": "ngày mùng sáu", "이번 주말": "cuối tuần này",
  "이십구일": "ngày hai mươi chín", "이일": "ngày mùng hai", "일본 사람": "người Nhật", "일이 있다": "có việc",
  "저녁을 먹다": "ăn tối", "점심을 먹다": "ăn trưa", "죄송합니다": "xin lỗi", "중국 사람": "người Trung Quốc",
  "지난": "trước; đã qua", "지난 주말": "cuối tuần trước", "집에서 쉬다": "nghỉ ở nhà", "차를 마시다": "uống trà",
  "축구를 하다": "chơi bóng đá", "칠일": "ngày mùng bảy", "커피를 마시다": "uống cà phê", "태국 사람": "người Thái Lan",
  "한 달": "một tháng", "한국 사람": "người Hàn Quốc", "가방을 들다": "xách túi", "갔다 오다": "đi rồi trở về",
  "감기에 걸리다": "bị cảm", "건강에 좋다": "tốt cho sức khỏe", "경치가 좋다": "phong cảnh đẹp", "게임을 하다": "chơi trò chơi",
  "공연을 보다": "xem biểu diễn", "공기가 맑다": "không khí trong lành", "교통이 불편하다": "giao thông bất tiện",
  "교통이 편리하다": "giao thông thuận tiện", "구두를 신다": "đi giày", "그동안 어떻게 지냈어요?": "thời gian qua bạn sống thế nào?",
  "그저 그렇다": "bình thường; tàm tạm", "기분 전환을 하다": "thay đổi tâm trạng; giải khuây", "기분이 좋다": "tâm trạng tốt",
  "기분이 나쁘다": "tâm trạng không tốt", "기침을 하다": "ho", "꽃": "hoa", "꿈을 이루다": "thực hiện ước mơ",
  "나중에 다시 하겠습니다": "tôi sẽ gọi/làm lại sau", "낚시를 하다": "đi câu cá", "남이섬": "đảo Nami", "넥타이를 매다": "thắt cà vạt",
  "노래방에 가다": "đi hát karaoke", "높은 건물이 많다": "có nhiều tòa nhà cao", "다행이다": "thật may mắn",
  "돈을 많이 벌다": "kiếm nhiều tiền", "드시다": "ăn/uống (kính ngữ)", "드라마 촬영지": "địa điểm quay phim truyền hình",
  "등산을 하다": "leo núi", "(선생님)이 되다": "trở thành (giáo viên)", "말씀하시다": "nói (kính ngữ)",
  "맛있는 것을 먹다": "ăn món ngon", "머리가 길다": "tóc dài", "머리가 짧다": "tóc ngắn", "모임을 준비하다": "chuẩn bị buổi gặp mặt",
  "모자를 쓰다": "đội mũ", "목도리를 하다": "quàng khăn", "몸이 안 좋다": "trong người không khỏe",
  "문자 메시지를 보내다": "gửi tin nhắn", "바람을 쐬다": "đi hóng gió", "바지를 입다": "mặc quần",
  "방학을 잘 보냈어요?": "bạn đã trải qua kỳ nghỉ vui chứ?", "배드민턴을 치다": "chơi cầu lông", "번역가가 되다": "trở thành biên dịch viên",
  "(일) 번": "số (một)", "(한) 번": "một lần", "분위기가 좋다": "bầu không khí tốt", "사람들을 초대하다": "mời mọi người",
  "사업을 하다": "kinh doanh", "사람들이 친절하다": "mọi người thân thiện", "살기 좋다": "đáng sống; sống thuận tiện",
  "생일 파티": "tiệc sinh nhật", "(한) 살": "một tuổi", "수다를 떨다": "tán gẫu", "손": "bàn tay",
  "스트레스가 많다": "căng thẳng nhiều", "시간을 정하다": "ấn định thời gian", "시다": "chua", "시험을 잘 못 보다": "làm bài thi không tốt",
  "신발을 신다": "đi giày", "실례지만": "xin lỗi, nhưng…", "OO 씨 좀 바꿔 주세요": "cho tôi gặp anh/chị OO",
  "실례지만 어디세요?": "xin lỗi, ai đang gọi/đây là đâu?", "아이들": "trẻ em", "안경을 쓰다": "đeo kính",
  "안 계신데요": "hiện không có ở đây (kính ngữ)", "어떻게": "như thế nào", "연락드리다": "liên lạc (kính ngữ)",
  "연락을 하다": "liên lạc", "열이 나다": "bị sốt", "오랜만이에요": "lâu rồi không gặp", "외국 여행을 가다": "đi du lịch nước ngoài",
  "옷을 입다": "mặc quần áo", "요즘 어떻게 지내요?": "dạo này bạn thế nào?", "우리 집": "nhà chúng tôi/nhà tôi",
  "운동화를 신다": "đi giày thể thao", "음성 메시지를 남기다": "để lại tin nhắn thoại", "인기가 많다": "rất được yêu thích",
  "인기가 있다": "được ưa chuộng", "자전거를 타다": "đi xe đạp", "잘 지내요": "vẫn khỏe/vẫn tốt", "잘못 걸었습니다": "tôi gọi nhầm số",
  "장소를 예약하다": "đặt địa điểm", "잠깐만 기다리세요": "xin chờ một lát", "전 세계": "toàn thế giới", "전화를 걸다": "gọi điện",
  "전통적인 도시다": "là thành phố truyền thống", "전화를 끊다": "cúp máy", "전화를 하다": "gọi điện thoại", "전화를 받다": "nghe máy",
  "정신이 없다": "bận tối mắt; rối bời", "좋아지다": "trở nên tốt hơn", "좋은 사람과 결혼하다": "kết hôn với người tốt",
  "쯤": "khoảng; chừng", "치마를 입다": "mặc váy", "키가 크다": "cao", "키가 작다": "thấp",
  "타고 가다": "đi bằng (phương tiện)", "타고 오다": "đến bằng (phương tiện)", "타고 다니다": "thường xuyên đi bằng (phương tiện)",
  "통화 중입니다": "máy đang bận", "통역사가 되다": "trở thành phiên dịch viên", "편찮으시다": "ốm/không khỏe (kính ngữ)",
  "피아노를 치다": "chơi piano", "학기 말": "cuối học kỳ", "한국 친구를 사귀다": "kết bạn với người Hàn",
  "한국 회사에 취직하다": "xin việc vào công ty Hàn Quốc", "한국 문화에 관심이 있다": "quan tâm đến văn hóa Hàn Quốc",
  "한국과 무역을 하다": "buôn bán với Hàn Quốc", "한국문화원": "Trung tâm Văn hóa Hàn Quốc", "한국으로 유학을 가다": "đi du học Hàn Quốc",
  "한국으로 여행을 가다": "đi du lịch Hàn Quốc", "한옥마을": "làng nhà truyền thống Hanok", "현대적인 도시다": "là thành phố hiện đại",
  "화가 나다": "nổi giận", "휴가 때 뭐 했어요?": "bạn đã làm gì trong kỳ nghỉ?", "화가 풀리다": "nguôi giận", "회비를 모으다": "thu hội phí",
  "저곳": "chỗ kia"
};

const GRAMMAR_NOTES = {
  "이에요/예요": "‘Là…’ trong lối nói lịch sự; 이에요 đi sau danh từ có 받침, 예요 đi sau danh từ không có 받침.",
  "은/는": "Tiểu từ chủ đề; 은 đi sau phụ âm, 는 đi sau nguyên âm.",
  "-아요/어요": "Đuôi câu lịch sự thân mật cho động từ và tính từ.",
  "에 가다": "Đi đến một địa điểm; 에 đánh dấu đích đến.",
  "이/가": "Tiểu từ chủ ngữ; 이 đi sau phụ âm, 가 đi sau nguyên âm.",
  "에 있다/없다": "Diễn tả người hoặc vật có/không có ở một địa điểm.",
  "을/를": "Tiểu từ tân ngữ; 을 đi sau phụ âm, 를 đi sau nguyên âm.",
  "-(으)세요": "Dùng để yêu cầu hoặc đề nghị một cách lịch sự.",
  "-ㅂ니다/습니다": "Đuôi trần thuật trang trọng.", "-ㅂ니까/습니까": "Đuôi nghi vấn trang trọng.",
  "하고": "Nối các danh từ với nghĩa ‘và/cùng với’.", "-았/었-": "Dấu hiệu thì quá khứ.",
  "에서": "Đánh dấu nơi hành động diễn ra.", "그리고": "Nối thêm thông tin với nghĩa ‘và, rồi’.",
  "안": "Đặt trước động từ/tính từ để phủ định.", "에": "Đánh dấu thời điểm hành động diễn ra.",
  "○시 ○분": "Cách nói giờ và phút: giờ dùng số thuần Hàn, phút dùng số Hán–Hàn.",
  "-(으)ㄹ까요": "Hỏi ý kiến hoặc đưa ra đề nghị.", "그래서": "Nối nguyên nhân với kết quả: ‘vì vậy’.",
  "-(으)ㄹ 거예요": "Diễn tả kế hoạch hoặc dự định tương lai.",
  "-고": "Nối hai hành động/trạng thái ngang hàng: ‘và’.", "그런데": "Mở ý trái ngược hoặc chuyển ý: ‘nhưng/mà’.",
  "못": "Phủ định khả năng: ‘không thể/không làm được’.", "-아서/어서": "Nối nguyên nhân, kết quả hoặc chuỗi hành động.",
  "-(으)ㄹ래요": "Hỏi hoặc nói ý muốn: ‘muốn/sẽ…’.", "무슨": "Đứng trước danh từ để hỏi ‘loại nào/cái gì’.",
  "이/가 걸리다": "Diễn tả thời gian cần để đi hoặc hoàn thành việc gì.", "에서…까지": "Từ địa điểm/thời điểm… đến…",
  "(으)로": "Chỉ hướng đi, phương tiện hoặc cách thức.", "-아/어 주다": "Làm một việc cho người khác.",
  "-지요": "Xác nhận điều người nói cho là đã biết hoặc mời người nghe đồng ý.", "-(으)ㄴ": "Biến tính từ thành định ngữ đứng trước danh từ.",
  "-고 있다": "Diễn tả hành động đang diễn ra hoặc trạng thái đang duy trì.", "의": "Đánh dấu quan hệ sở hữu.",
  "-(으)시-": "Thành tố kính ngữ nâng chủ thể của câu.", "-아/어 보다": "Diễn tả kinh nghiệm hoặc thử làm việc gì.",
  "-고 싶다": "Diễn tả mong muốn của người nói.", "-지 말다": "Cấm hoặc khuyên đừng làm việc gì.",
  "-(으)ㄴ 후에": "Sau khi làm một việc.", "-아야/어야 하다": "Diễn tả nghĩa vụ: ‘phải…’.",
  "-(으)ㄹ게요": "Lời hứa hoặc quyết định của người nói.", "-지만": "Nối hai ý tương phản: ‘nhưng’.",
  "보다": "Đánh dấu đối tượng so sánh: ‘hơn/so với’.", "-(으)ㄹ 때": "Khi/trong lúc một việc xảy ra.",
  "-(으)러 가다": "Đi đâu để làm một việc.", "-(으)려고": "Diễn tả mục đích hoặc ý định.",
  "-(으)면": "Điều kiện hoặc giả định: ‘nếu/khi’.",
};

// Several short Korean words are homonyms. The dictionary search endpoint returns
// the first headword, which is not always the sense used on the cited textbook
// page. Keep these decisions explicit and tied to their course/lesson context.
const VOCABULARY_OVERRIDES = {
  "sejong-1:0:명": { meaningVi: "người (đơn vị đếm)", originType: "sino", hanja: "名", hanviet: "danh" },
  "sejong-1:0:안": { meaningVi: "trong, bên trong; không (phủ định)", originType: "native" },
  "sejong-1:0:집": { meaningVi: "nhà", originType: "native" },
  "sejong-1:1:네": { meaningVi: "vâng, có", originType: "native" },
  "sejong-1:2:어디": { meaningVi: "đâu, ở đâu", originType: "native" },
  "sejong-1:4:구": { meaningVi: "chín", originType: "sino", hanja: "九", hanviet: "cửu" },
  "sejong-1:4:백": { meaningVi: "một trăm", originType: "sino", hanja: "百", hanviet: "bách" },
  "sejong-1:4:삼": { meaningVi: "ba", originType: "sino", hanja: "三", hanviet: "tam" },
  "sejong-1:4:십일": { meaningVi: "mười một", originType: "sino", hanja: "十一", hanviet: "thập nhất" },
  "sejong-1:4:싸다": { meaningVi: "rẻ", originType: "native" },
  "sejong-1:4:이": { meaningVi: "hai", originType: "sino", hanja: "二", hanviet: "nhị" },
  "sejong-1:4:일": { meaningVi: "một", originType: "sino", hanja: "一", hanviet: "nhất" },
  "sejong-1:4:팔": { meaningVi: "tám", originType: "sino", hanja: "八", hanviet: "bát" },
  "sejong-1:5:개": { meaningVi: "cái (đơn vị đếm đồ vật)", originType: "sino", hanja: "個", hanviet: "cá" },
  "sejong-1:5:병": { meaningVi: "chai, lọ; chai (đơn vị đếm)", originType: "sino", hanja: "瓶", hanviet: "bình" },
  "sejong-1:5:얼마나": { meaningVi: "bao nhiêu", originType: "native" },
  "sejong-1:5:하나": { meaningVi: "một", originType: "native" },
  "sejong-1:8:일일": { meaningVi: "ngày mùng một", originType: "sino", hanja: "一日", hanviet: "nhất nhật" },
  "sejong-1:10:수영": { meaningVi: "bơi lội", originType: "sino", hanja: "水泳", hanviet: "thủy vịnh" },
  "sejong-1:11:주": { meaningVi: "tuần", originType: "sino", hanja: "週", hanviet: "chu" },

  "sejong-2:2:별로": { meaningVi: "không… lắm, không đặc biệt (dùng với phủ định)", originType: "mixed" },
  "sejong-2:2:제": { meaningVi: "của tôi", originType: "native" },
  "sejong-2:3:쓰다": { meaningVi: "đắng", originType: "native" },
  "sejong-2:3:이": { meaningVi: "này (đứng trước danh từ)", originType: "native" },
  "sejong-2:3:된장찌개": { originType: "mixed" },
  "sejong-2:3:설렁탕": { originType: "mixed" },
  "sejong-2:4:내리다": { meaningVi: "xuống, xuống xe", originType: "native" },
  "sejong-2:4:먼저": { meaningVi: "trước tiên", originType: "native" },
  "sejong-2:4:타다": { meaningVi: "đi, lên (phương tiện)", originType: "native" },
  "sejong-2:7:마르다": { meaningVi: "gầy, mảnh khảnh", originType: "native" },
  "sejong-2:7:검은색": { originType: "mixed" },
  "sejong-2:7:노란색": { originType: "mixed" },
  "sejong-2:7:빨간색": { originType: "mixed" },
  "sejong-2:7:청바지": { originType: "mixed" },
  "sejong-2:7:흰색": { originType: "mixed" },
  "sejong-2:8:남동생": { meaningVi: "em trai", originType: "sino", hanja: "男同生", hanviet: "nam đồng sinh" },
  "sejong-2:8:똑똑하다": { meaningVi: "thông minh", originType: "native" },
  "sejong-2:8:여동생": { meaningVi: "em gái", originType: "sino", hanja: "女同生", hanviet: "nữ đồng sinh" },
  "sejong-2:8:형": { meaningVi: "anh trai (cách nam giới gọi)", originType: "sino", hanja: "兄", hanviet: "huynh" },
  "sejong-2:9:경주": { meaningVi: "Gyeongju (thành phố Khánh Châu)", originType: "proper" },
  "sejong-2:9:사원": { meaningVi: "chùa, tu viện", originType: "sino", hanja: "寺院", hanviet: "tự viện" },
  "sejong-2:9:저곳": { meaningVi: "chỗ kia, nơi kia", originType: "native" },
  "sejong-2:10:약": { meaningVi: "thuốc", originType: "sino", hanja: "藥", hanviet: "dược" },
  "sejong-2:10:전": { meaningVi: "trước", originType: "sino", hanja: "前", hanviet: "tiền" },
  "sejong-2:10:팔": { meaningVi: "cánh tay", originType: "native" },
  "sejong-2:11:풍선": { meaningVi: "bóng bay", originType: "sino", hanja: "風船", hanviet: "phong thuyền" },
  "sejong-2:11:한번": { meaningVi: "một lần, thử một lần", originType: "mixed" },
  "sejong-2:12:적다": { meaningVi: "ít", originType: "native" },
  "sejong-2:12:전주": { meaningVi: "Jeonju (thành phố Toàn Châu)", originType: "proper" },
  "sejong-2:13:늘다": { meaningVi: "tăng lên, tiến bộ", originType: "native" },
  "sejong-2:14:고급": { meaningVi: "cao cấp, trình độ cao cấp", originType: "sino", hanja: "高級", hanviet: "cao cấp" },
};

const S1_LESSONS = [
  { id: 0, titleKo: "예비편", titleVi: "Nhập môn", pages: [13, 35], tracks: [1, 19], objectives: ["Làm quen với tiếng Hàn và Hangeul", "Học chữ cái, âm tiết, 받침 và biểu hiện lớp học"], grammar: [] },
  { id: 1, titleKo: "자기소개", titleVi: "Tự giới thiệu", pages: [36, 45], tracks: [20, 24], objectives: ["Chào hỏi", "Tự giới thiệu"], grammar: ["이에요/예요", "은/는"] },
  { id: 2, titleKo: "일상생활", titleVi: "Sinh hoạt hằng ngày", pages: [46, 55], tracks: [25, 29], objectives: ["Hỏi và trả lời về sinh hoạt hằng ngày"], grammar: ["-아요/어요", "에 가다"] },
  { id: 3, titleKo: "위치", titleVi: "Vị trí", pages: [56, 65], tracks: [30, 34], objectives: ["Nói về vị trí của đồ vật"], grammar: ["이/가", "에 있다/없다"] },
  { id: 4, titleKo: "물건 사기 1", titleVi: "Mua đồ 1", pages: [68, 77], tracks: [35, 39], objectives: ["Đọc số", "Yêu cầu khi mua hàng"], grammar: ["을/를", "-(으)세요"] },
  { id: 5, titleKo: "물건 사기 2", titleVi: "Mua đồ 2", pages: [78, 87], tracks: [40, 44], objectives: ["Nói số lượng", "Mua đồ"], grammar: ["-ㅂ니다/습니다", "-ㅂ니까/습니까", "하고"] },
  { id: 6, titleKo: "어제 일과", titleVi: "Hoạt động hôm qua", pages: [88, 97], tracks: [45, 49], objectives: ["Kể về hoạt động trong quá khứ"], grammar: ["-았/었-", "에서"] },
  { id: 7, titleKo: "날씨", titleVi: "Thời tiết", pages: [100, 109], tracks: [50, 54], objectives: ["Nói về mùa và thời tiết"], grammar: ["그리고", "안"] },
  { id: 8, titleKo: "시간", titleVi: "Thời gian", pages: [110, 119], tracks: [55, 59], objectives: ["Hỏi và trả lời ngày, thứ và giờ"], grammar: ["에", "○시 ○분"] },
  { id: 9, titleKo: "약속", titleVi: "Cuộc hẹn", pages: [120, 129], tracks: [60, 64], objectives: ["Đề nghị và hẹn gặp"], grammar: ["-(으)ㄹ까요", "-아요/어요"] },
  { id: 10, titleKo: "주말 활동", titleVi: "Hoạt động cuối tuần", pages: [132, 141], tracks: [65, 69], objectives: ["Hỏi đáp về cuối tuần", "Nói về kế hoạch"], grammar: ["그래서", "-(으)ㄹ 거예요"] },
  { id: 11, titleKo: "한국어 공부", titleVi: "Học tiếng Hàn", pages: [142, 151], tracks: [70, 71], objectives: ["Ôn tập tổng hợp", "Nói về việc học tiếng Hàn"], grammar: [] },
  { id: 12, titleKo: "계획", titleVi: "Kế hoạch", pages: [152, 161], tracks: [72, 73], objectives: ["Ôn tập tổng hợp", "Nói về kế hoạch cá nhân"], grammar: [] },
];

const S2_LESSONS = [
  [1, "안부", "Hỏi thăm", 12, ["Hỏi thăm", "Hỏi và trả lời về tình hình gần đây"], ["-고", "그런데"]],
  [2, "취미 활동", "Hoạt động sở thích", 22, ["Nói về sở thích và tần suất"], ["못", "-아서/어서"]],
  [3, "음식", "Đồ ăn", 32, ["Gọi món", "Nói về hương vị"], ["-(으)ㄹ래요", "무슨"]],
  [4, "교통", "Giao thông", 44, ["Hỏi đáp về phương tiện giao thông"], ["이/가 걸리다", "에서…까지"]],
  [5, "길 찾기", "Tìm đường", 54, ["Hỏi đường và chỉ đường"], ["(으)로", "-아서/어서"]],
  [6, "전화", "Điện thoại", 64, ["Hỏi số điện thoại", "Gọi điện"], ["-아/어 주다", "-지요"]],
  [7, "외모", "Ngoại hình", 76, ["Miêu tả ngoại hình"], ["-(으)ㄴ", "-고 있다"]],
  [8, "가족", "Gia đình", 86, ["Giới thiệu và hỏi đáp về gia đình"], ["의", "-(으)시-"]],
  [9, "여행", "Du lịch", 96, ["Nói về kinh nghiệm và kế hoạch du lịch"], ["-아/어 보다", "-고 싶다"]],
  [10, "건강", "Sức khỏe", 108, ["Nói triệu chứng", "Đưa lời khuyên"], ["-지 말다", "-(으)ㄴ 후에"]],
  [11, "모임", "Gặp mặt", 118, ["Chuẩn bị một buổi gặp mặt"], ["-아야/어야 하다", "-(으)ㄹ게요"]],
  [12, "고향", "Quê hương", 128, ["Giới thiệu quê hương"], ["-지만", "보다"]],
  [13, "기분과 감정", "Tâm trạng và cảm xúc", 140, ["Nói về tâm trạng và cảm xúc"], ["-(으)ㄹ 때", "-(으)러 가다"]],
  [14, "미래", "Tương lai", 150, ["Nói về lý do học tiếng Hàn và ước mơ"], ["-(으)려고", "-(으)면"]],
].map(([id, titleKo, titleVi, start, objectives, grammar]) => ({
  id, titleKo, titleVi, pages: [start, start + 9], tracks: [(id - 1) * 5 + 1, id * 5], objectives, grammar
}));

const COURSE_META = {
  "sejong-1": {
    id: "sejong-1", title: "Sejong 1", titleKo: "세종한국어 1", source: "Sejong1.pdf", pageCount: 192,
    description: "Phần nhập môn, 12 bài học và 4 bài văn hóa theo đúng sách Sejong Korean 1.",
    lessons: S1_LESSONS,
    cultures: [
      [1, "한국인의 인사법", "Cách chào hỏi của người Hàn", [66, 67]],
      [2, "한국의 화폐", "Tiền tệ Hàn Quốc", [98, 99]],
      [3, "한국의 사계절", "Bốn mùa ở Hàn Quốc", [130, 131]],
      [4, "한국인의 주말 활동", "Hoạt động cuối tuần của người Hàn", [162, 164]],
    ],
  },
  "sejong-2": {
    id: "sejong-2", title: "Sejong 2", titleKo: "세종한국어 2", source: "Sejong2.pdf", pageCount: 192,
    description: "14 bài học và 4 bài văn hóa theo đúng sách Sejong Korean 2.",
    lessons: S2_LESSONS,
    cultures: [
      [1, "한국 음식", "Ẩm thực Hàn Quốc", [42, 43]],
      [2, "한국의 대중교통", "Giao thông công cộng Hàn Quốc", [74, 75]],
      [3, "한국의 여행지", "Điểm du lịch Hàn Quốc", [106, 107]],
      [4, "한국 사람들의 모임", "Các buổi gặp mặt của người Hàn", [138, 139]],
    ],
  },
};

const correctedDictionaryKeys = { "꽃": "꾳", "손": "손…", "시다": "시다!", "저곳": "제공" };
const NUMBER_HANJA = /^[零〇一二三四五六七八九十百千萬万億亿兆]+$/u;
const NATIVE_NUMBER_WORDS = new Set(["하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉", "열", "열하나", "열둘", "스물", "서른", "마흔", "쉰", "예순", "일흔", "여든", "아흔"]);

function readOcr(courseCode) {
  const rows = fs.readFileSync(path.join(generatedRoot, `${courseCode}.jsonl`), "utf8").trim().split(/\r?\n/).map(JSON.parse);
  return new Map(rows.map(row => [Number(row.path.match(/(\d+)\.jpg$/)?.[1]), row.lines.map(line => line.text)]));
}

function extractDialogue(lines, label) {
  const start = lines.findIndex(line => line.trim() === label);
  if (start < 0) return [];
  const end = lines.findIndex((line, index) => index > start && line.includes("어휘와 표현"));
  return lines.slice(start + 1, end > start ? end : undefined)
    .filter(line => !/^Track\s*\d+/i.test(line))
    .filter(line => /[가-힣]/u.test(line))
    .filter(line => !/^\d+\s*세종한국어/u.test(line));
}

function readingPage(courseId, lesson, readingAsset) {
  // Sejong 1 inserts culture spreads before lessons 4 and 7. The first
  // generated manifest used the pre-insert offsets for lessons 4-10.
  if (courseId === "sejong-1" && lesson.id >= 4 && lesson.id <= 10) return lesson.pages[1] - 1;
  return readingAsset?.page || null;
}

function extractReading(lines) {
  return lines
    .map(line => String(line || "").trim())
    .filter(Boolean)
    .filter(line => /[가-힣]/u.test(line))
    .filter(line => !/^(읽고 쓰기|읽기)$/u.test(line))
    .filter(line => !(/^\d+\./u.test(line) && /(다음|아래).*(읽|답|고르|표시|쓰|이야기)/u.test(line)))
    .filter(line => !/^\d+\)/u.test(line))
    .filter(line => !/^\(\d+\)/u.test(line))
    .filter(line => !/^[①-⑩]/u.test(line))
    .filter(line => !/^\d+\s*세종한국어\s*[12]?$/u.test(line))
    .filter(line => !/^\d+\s+.+\s+\d+$/u.test(line))
    .filter(line => !/^(네|아니요|[OX×x])$/u.test(line))
    .filter(line => !/^\(?\s*(답장|삭제)/u.test(line))
    .filter(line => !/그제고한 제주도로/u.test(line));
}

function romanize(value) {
  const initials = ["g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"];
  const vowels = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i"];
  const finals = ["", "k", "k", "k", "n", "n", "n", "t", "l", "k", "m", "l", "l", "l", "p", "l", "m", "p", "p", "t", "t", "ng", "t", "t", "k", "t", "p", "h"];
  return [...value].map(char => {
    const code = char.codePointAt(0) - 0xac00;
    if (code < 0 || code > 11171) return char;
    return `${initials[Math.floor(code / 588)]}${vowels[Math.floor((code % 588) / 28)]}${finals[code % 28]}`;
  }).join("").replace(/\s+/g, " ").trim();
}

const simplifiedCharacterMap = new Map();
for (const origin of Object.values(currentOrigins.items)) {
  if (!origin?.root_form || !origin?.simplified) continue;
  const traditional = [...origin.root_form.replace(/[^\p{Script=Han}]/gu, "")];
  const simplified = [...origin.simplified.replace(/[^\p{Script=Han}]/gu, "")];
  if (traditional.length !== simplified.length) continue;
  traditional.forEach((char, index) => simplifiedCharacterMap.set(char, simplified[index]));
}
function simplified(value) {
  return [...value].map(char => simplifiedCharacterMap.get(char) || char).join("");
}

function systematicNumberHanja(courseId, lesson, term) {
  if (courseId !== "sejong-1" || lesson !== 4) return "";
  const digit = { 영: "零", 공: "空", 일: "一", 이: "二", 삼: "三", 사: "四", 오: "五", 육: "六", 칠: "七", 팔: "八", 구: "九", 십: "十" };
  if ([...term].length && [...term].every(char => digit[char])) return [...term].map(char => digit[char]).join("");
  return "";
}

function cleanHanja(value) {
  return String(value || "")
    .replace(/[^\p{Script=Han}/]/gu, "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/{2,}/g, "/");
}

function vocabularyRecord(courseId, item) {
  const old = oldVocabularyByWord.get(item.term);
  const oldFlashcard = courseId === "sejong-1" ? old : null;
  const oldOrigin = oldOriginByWord.get(item.term);
  const override = VOCABULARY_OVERRIDES[`${courseId}:${item.lesson}:${item.term}`] || {};
  const dictionaryKey = dictionary[item.term] ? item.term : correctedDictionaryKeys[item.term];
  const entry = dictionary[dictionaryKey] || {};
  const trustedDictionary = entry.status === "exact";
  const numericHanja = systematicNumberHanja(courseId, item.lesson, item.term);
  const original = cleanHanja(override.hanja || numericHanja || (trustedDictionary ? entry.original : "") || (oldOrigin?.type === "sino" ? oldOrigin.root_form : ""));
  let originType = "native";
  if (/\p{Script=Han}/u.test(original)) originType = "sino";
  else if (/[A-Za-z\p{Script=Katakana}]/u.test(original)) originType = "loanword";
  if (!trustedDictionary && !oldOrigin && /\s|[?()]|을 |를 |가 |이 |에 |하다$|되다$|있다$|없다$/u.test(item.term)) originType = "expression";
  if (oldOrigin?.type && !["other", "grammar"].includes(oldOrigin.type)) originType = oldOrigin.type;
  if (override.originType) originType = override.originType;

  const meaning = override.meaningVi || FALLBACK_MEANINGS[item.term] || (trustedDictionary ? entry.meaning_vi : "") || old?.meaning || "Xem nghĩa trong ngữ cảnh bài học";
  const vocabularyGroup = originType === "sino" && NUMBER_HANJA.test(original)
    ? "numbers-sino"
    : originType === "native" && NATIVE_NUMBER_WORDS.has(item.term)
      ? "numbers-native"
      : "";
  const originLabels = {
    native: "Từ thuần Hàn", sino: "Từ Hán–Hàn", loanword: "Từ mượn", mixed: "Từ hỗn hợp",
    proper: "Tên riêng", expression: "Cụm diễn đạt"
  };
  return {
    id: `${courseId}-l${String(item.lesson).padStart(2, "0")}-${item.term}`,
    lesson: item.lesson,
    word: item.term,
    romanization: old?.romanization || romanize(item.term),
    meaningVi: meaning,
    meaningZh: old?.meaning_zh || "",
    originType,
    originLabelVi: originLabels[originType] || "Từ/cụm từ",
    hanja: originType === "sino" ? original : "",
    chineseEquivalent: originType === "sino" ? simplified(original) : "",
    hanviet: originType === "sino" ? (override.hanviet || oldOrigin?.hanviet || "") : "",
    pronunciation: old?.actual_pronunciation || entry.pronunciation || "",
    example: oldFlashcard?.example || "",
    exampleVi: oldFlashcard?.example_vi || "",
    grammarPoint: oldFlashcard?.grammar_point || "",
    ...(vocabularyGroup ? { vocabularyGroup } : {}),
    sourcePage: item.references[0] || null,
    dictionarySource: trustedDictionary && originType !== "native" ? SOURCE_DICTIONARY : "",
    dictionaryUrl: trustedDictionary && originType !== "native" ? entry.source_url : "",
  };
}

function buildCourse(courseId, courseCode) {
  const meta = COURSE_META[courseId];
  const ocr = readOcr(courseCode);
  const index = JSON.parse(fs.readFileSync(path.join(generatedRoot, `${courseCode}-index.json`), "utf8"));
  const vocabulary = index
    .filter(item => item.lesson !== null && !/^세종한국어\s+[12]$/u.test(item.term))
    .map(item => vocabularyRecord(courseId, item))
    .sort((a, b) => a.lesson - b.lesson || a.word.localeCompare(b.word, "ko"));
  const exerciseAssets = assets.exercises[courseId] || [];
  const courseAudio = new Map((assets.audio[courseId] || []).map(item => [item.track, item.path]));

  const lessons = meta.lessons.map(lesson => {
    let dialogues = [];
    if (lesson.id > 0 && !(courseId === "sejong-1" && lesson.id > 10)) {
      dialogues = [
        { title: "Hội thoại 1", track: lesson.tracks[0], lines: extractDialogue(ocr.get(lesson.pages[0] + 2) || [], "대화 1") },
        { title: "Hội thoại 2", track: lesson.tracks[0] + 1, lines: extractDialogue(ocr.get(lesson.pages[0] + 4) || [], "대화 2") },
      ];
    }
    const trackList = [];
    for (let track = lesson.tracks[0]; track <= lesson.tracks[1]; track++) {
      const offset = track - lesson.tracks[0];
      trackList.push({
        number: track,
        label: dialogues.length ? (["Hội thoại 1", "Hội thoại 2", "Bài nghe 1", "Bài nghe 2", "Bài nghe 3"][offset] || `Track ${track}`) : `Track ${track}`,
        path: courseAudio.get(track),
      });
    }
    let lessonExercises = exerciseAssets.filter(item => item.lesson === lesson.id && ["listening", "reading"].includes(item.kind));
    if (courseId === "sejong-1" && lesson.id >= 4 && lesson.id <= 10) {
      const listeningPage = lesson.pages[1] - 3;
      const sourceReadingPage = lesson.pages[1] - 1;
      lessonExercises = [
        { lesson: lesson.id, kind: "listening", page: listeningPage, path: `assets/exercises/sejong-1/lesson-${String(lesson.id).padStart(2, "0")}-listening-p${String(listeningPage).padStart(3, "0")}.jpg` },
        { lesson: lesson.id, kind: "reading", page: sourceReadingPage, path: `assets/exercises/sejong-1/lesson-${String(lesson.id).padStart(2, "0")}-reading-p${String(sourceReadingPage).padStart(3, "0")}.jpg` },
      ];
    }
    const readingAsset = lessonExercises.find(item => item.kind === "reading");
    const sourceReadingPage = readingPage(courseId, lesson, readingAsset);
    return {
      ...lesson,
      grammar: lesson.grammar.map(form => ({ form, noteVi: GRAMMAR_NOTES[form] || "Ôn mẫu ngữ pháp trong bài." })),
      vocabulary: vocabulary.filter(item => item.lesson === lesson.id && !item.vocabularyGroup),
      dialogues,
      audio: trackList,
      reading: sourceReadingPage ? {
        page: sourceReadingPage,
        lines: extractReading(ocr.get(sourceReadingPage) || []),
      } : null,
      // The website only publishes the listening and reading/writing pages.
      // Grammar drills, Hangeul worksheets and review games stay local.
      exercises: lessonExercises,
    };
  });

  return {
    ...meta,
    audioCount: assets.audio[courseId]?.length || 0,
    vocabularyCount: vocabulary.length,
    lessons,
    numberVocabulary: {
      sino: vocabulary.filter(item => item.vocabularyGroup === "numbers-sino"),
      native: vocabulary.filter(item => item.vocabularyGroup === "numbers-native"),
    },
    cultures: meta.cultures.map(([id, titleKo, titleVi, pages]) => ({
      id, titleKo, titleVi, pages,
      images: (assets.culture[courseId] || []).filter(item => item.unit === id)
    })),
  };
}

const output = {
  version: "2026.08.28.1",
  generatedAt: new Date().toISOString(),
  courses: [buildCourse("sejong-1", "s1"), buildCourse("sejong-2", "s2")]
};

fs.writeFileSync(path.join(root, "app/data/courses.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Đã tạo ${output.courses.map(course => `${course.title}: ${course.vocabularyCount} mục từ, ${course.audioCount} track`).join("; ")}.`);
