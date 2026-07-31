import vocabularyData from "../data/vocabulary.json";
import shadowingData from "../data/shadowing.json";
import listeningData from "../data/listening.json";
import { storage } from "./services/storage.js";
import { startRemoteSync } from "./services/remote-sync.js";

const BASE_VOCAB = vocabularyData;
const SHADOW_DATA = shadowingData;
const LISTEN_DATA = listeningData;
const BRAND_LOGO = `${import.meta.env.BASE_URL}assets/sejong-green.webp`;

const STORAGE = {
    profiles: "sejongGreen.profiles.v1",
    shared: "sejongGreen.shared.v1",
    reportUrl: "sejongGreen.reportUrl.v1"
  };
  const SESSION_KEY = "sejongGreen.session.v1";
  const CONTENT_VERSION = "2026.07.31.1";
  const OFFICIAL_AUDIO_PAGE = "https://nuri.iksi.or.kr/front/cms/contents/layout2/learningsejong/detail.do?csCmsMastrSeq=15227&menuSn=649";
  const OFFICIAL_EBOOK = "https://nuri.iksi.or.kr/e-book/ecatalog5.jsp?Dir=773&catimage=&callmode=admin";
  const NAVER_VOICE_SAMPLE = "https://korean.dict.naver.com/kovidict/#/entry/kovi/91a283a46498440f829043e121f8b52f";
  const VOCAB_TRANSLATION_FIXES = {
    "사람": ["person", "人"],
    "회사원": ["office worker", "公司职员"],
    "요리사": ["chef", "厨师"],
    "언니": ["older sister (female speaker)", "姐姐（女性称呼）"],
    "동생": ["younger sibling", "弟弟／妹妹"],
    "책": ["book", "书"],
    "친구": ["friend", "朋友"],
    "씨": ["Mr./Ms. (after a name)", "先生／女士（用于姓名后）"],
    "자기소개": ["self-introduction", "自我介绍"],
    "이": ["two", "二"],
    "한자어": ["Sino-Korean word", "汉字词"],
    "수": ["number", "数字"],
    "영/공": ["zero (0)", "零（0）"],
    "일": ["one", "一"],
    "오": ["five", "五"],
    "팔": ["eight", "八"],
    "구": ["nine", "九"],
    "백": ["one hundred", "一百"],
    "번": ["route/number", "路线号／编号"],
    "호": ["room number", "房间号"],
    "몇": ["how many", "几／多少"],
    "형": ["older brother (male speaker)", "哥哥（男性称呼）"],
    "물건": ["object; item", "物品"],
    "가방": ["bag", "包"],
    "위": ["above; on top", "上面"],
    "집": ["home; house", "家"],
    "밖": ["outside", "外面"],
    "한국어": ["Korean language", "韩语"],
    "꽃": ["flower", "花"],
    "보다": ["to see; to watch", "看"],
    "영화": ["movie", "电影"],
    "사다": ["to buy", "买"],
    "과자": ["snack; sweets", "零食／糖果"],
    "누가": ["who", "谁"],
    "사과": ["apple", "苹果"],
    "김밥": ["gimbap; seaweed rice roll", "紫菜包饭"],
    "영어": ["English language", "英语"],
    "고유어": ["native Korean word", "固有词"],
    "셋/세": ["three", "三"],
    "넷/네": ["four", "四"],
    "열": ["ten", "十"],
    "스물 / 스무": ["twenty", "二十"],
    "쉰": ["fifty", "五十"],
    "장": ["sheet; ticket (counter)", "张（量词）"],
    "개": ["item (counter)", "个（量词）"],
    "공": ["ball", "球"],
    "명": ["person (counter)", "名（量词）"],
    "마리": ["animal (counter)", "只（量词）"],
    "잔": ["cup/glass (counter)", "杯（量词）"],
    "권": ["book/volume (counter)", "本（量词）"],
    "살": ["years old", "岁"],
    "오다": ["to come", "来"],
    "타다": ["to ride; to take", "乘坐"],
    "일월": ["January", "一月"],
    "이월": ["February", "二月"],
    "시월": ["October", "十月"],
    "며칠": ["what date; how many days", "几号／几天"],
    "도서관": ["library", "图书馆"],
    "다니다": ["to attend; to go regularly", "上／经常去"],
    "눈": ["snow", "雪"],
    "가볍다": ["light (not heavy)", "轻"],
    "쉽다": ["easy", "容易"],
    "잘": ["well", "好／熟练地"],
    "지내다": ["to spend time; to live", "生活／度过"],
    "한라산": ["Hallasan Mountain", "汉拿山"],
    "우리": ["we; our", "我们／我们的"],
    "약속": ["appointment; plan", "约会／约定"],
    "경기": ["match; game", "比赛"],
    "하다": ["to do", "做"],
    "반": ["class", "班"],
    "다": ["all", "全部"],
    "내용": ["content", "内容"]
  };
  BASE_VOCAB.forEach(item => {
    const fix = VOCAB_TRANSLATION_FIXES[item.word];
    if (!fix) return;
    item.meaning_en = fix[0];
    item.meaning_zh = fix[1];
  });
  const DATE_NUMBER_FIXES = {
    "일일": 1, "이일": 2, "삼일": 3, "사일": 4, "오일": 5, "육일": 6, "칠일": 7, "팔일": 8, "구일": 9,
    "십일일": 11, "십이일": 12, "십삼일": 13, "십사일": 14, "십오일": 15, "십육일": 16, "십칠일": 17,
    "십팔일": 18, "십구일": 19, "이십일": 20, "이십일일": 21, "이십이일": 22, "이십삼일": 23,
    "이십사일": 24, "이십오일": 25, "이십육일": 26, "이십칠일": 27, "이십팔일": 28, "이십구일": 29,
    "삼십일": 30, "삼십일일": 31
  };
  BASE_VOCAB.forEach(item => {
    const day = DATE_NUMBER_FIXES[item.word];
    if (!day) return;
    item.meaning_en = `day ${day}`;
    item.meaning_zh = `${day}日`;
  });
  const exampleFixes = {
    "아버지": {
      example_en: "My father is an office worker.",
      example_zh: "我父亲是公司职员。"
    },
    "오일": {
      example_en: "The Korean class is on the fifth.",
      example_zh: "韩语课在五号。"
    }
  };
  BASE_VOCAB.forEach(item => Object.assign(item, exampleFixes[item.word] || {}));
  const LESSONS = [...new Map(BASE_VOCAB.map(item => [item.lesson, item.topic])).entries()]
    .map(([lesson, topic]) => ({ lesson: Number(lesson), topic }))
    .sort((a, b) => a.lesson - b.lesson);
  const NAV = [
    ["dashboard", "Tổng quan", "home"],
    ["vocabulary", "Từ vựng", "book"],
    ["flashcards", "Flashcard", "cards"],
    ["quiz", "Trắc nghiệm", "check"],
    ["listening", "Luyện nghe", "headphones"],
    ["shadowing", "Shadowing", "mic"],
    ["writing", "Luyện viết", "pen"],
    ["progress", "Tiến độ", "chart"],
    ["reports", "Báo cáo", "report"],
    ["data", "Dữ liệu", "database"]
  ];

  const LANGUAGE_META = {
    vi: { label: "Tiếng Việt", short: "VI", locale: "vi-VN" },
    en: { label: "English", short: "EN", locale: "en-US" },
    zh: { label: "简体中文", short: "中", locale: "zh-CN" }
  };
  const TOPIC_TEXT = {
    1: { vi: "Chào hỏi và giới thiệu", en: "Greetings and introductions", zh: "问候与自我介绍" },
    2: { vi: "Số và thông tin liên lạc", en: "Numbers and contact information", zh: "数字与联系方式" },
    3: { vi: "Đồ vật và vị trí", en: "Objects and locations", zh: "物品与位置" },
    4: { vi: "Hoạt động thường ngày", en: "Daily activities", zh: "日常活动" },
    5: { vi: "Địa điểm và mua sắm", en: "Places and shopping", zh: "地点与购物" },
    6: { vi: "Số lượng và yêu cầu", en: "Quantities and requests", zh: "数量与请求" },
    7: { vi: "Thời gian và lịch", en: "Time and schedules", zh: "时间与日程" },
    8: { vi: "Thời tiết và mùa", en: "Weather and seasons", zh: "天气与季节" },
    9: { vi: "Hoạt động đã làm", en: "Past activities", zh: "过去的活动" },
    10: { vi: "Kế hoạch cuối tuần", en: "Weekend plans", zh: "周末计划" }
  };
  const UI_COPY = {
    "Tổng quan": { en: "Overview", zh: "总览" },
    "Từ vựng": { en: "Vocabulary", zh: "词汇" },
    "Trắc nghiệm": { en: "Quiz", zh: "测验" },
    "Luyện nghe": { en: "Listening", zh: "听力练习" },
    "Luyện viết": { en: "Writing", zh: "写作练习" },
    "Tiến độ": { en: "Progress", zh: "学习进度" },
    "Báo cáo": { en: "Feedback", zh: "反馈" },
    "Dữ liệu": { en: "Data", zh: "数据" },
    "Bỏ qua điều hướng": { en: "Skip navigation", zh: "跳过导航" },
    "Điều hướng chính": { en: "Main navigation", zh: "主导航" },
    "Mở cài đặt hồ sơ": { en: "Open profile settings", zh: "打开档案设置" },
    "Cài đặt giọng đọc": { en: "Voice settings", zh: "语音设置" },
    "Cài đặt hồ sơ": { en: "Profile settings", zh: "档案设置" },
    "Đóng": { en: "Close", zh: "关闭" },
    "Học đều, nhớ lâu.": { en: "Study steadily, remember longer.", zh: "坚持学习，记得更牢。" },
    "Tiếp tục đúng chỗ bạn đã dừng và dành vài phút ôn các từ đến hạn hôm nay.": { en: "Continue where you stopped and review today's due words.", zh: "从上次停下的地方继续，并复习今天到期的单词。" },
    "Tiếp tục bài đang học": { en: "Continue current lesson", zh: "继续当前课程" },
    "Bài đang học": { en: "Current lesson", zh: "当前课程" },
    "Tiến độ bài học": { en: "Lesson progress", zh: "课程进度" },
    "Tổng từ:": { en: "Total words:", zh: "单词总数：" },
    "Đã ôn:": { en: "Reviewed:", zh: "已复习：" },
    "Đã nhớ:": { en: "Learned:", zh: "已掌握：" },
    "Chuỗi ngày học:": { en: "Study streak:", zh: "连续学习：" },
    "Đã ôn": { en: "Reviewed", zh: "已复习" },
    "Ôn tập hôm nay": { en: "Today's review", zh: "今日复习" },
    "Ôn ngay": { en: "Review now", zh: "立即复习" },
    "Trắc nghiệm + nghe chép chính tả": { en: "Quiz + dictation", zh: "测验＋听写" },
    "Đoạn sách + đoạn luyện thêm": { en: "Book passage + extra practice", zh: "教材段落＋补充练习" },
    "Từ, chính tả và câu theo chủ đề": { en: "Words, dictation, and topic writing", zh: "单词、听写和主题写作" },
    "Toàn bộ danh sách 1A, được loại trùng và bổ sung phiên âm Revised Romanization.": { en: "The complete 1A list, deduplicated and supplied with Revised Romanization.", zh: "完整的1A词汇表，已去重并补充修订罗马字。" },
    "In chủ đề": { en: "Print topic", zh: "打印主题" },
    "Học bằng flashcard": { en: "Study with flashcards", zh: "使用闪卡学习" },
    "Tìm nhanh": { en: "Quick search", zh: "快速搜索" },
    "Bài / chủ đề": { en: "Lesson / topic", zh: "课程／主题" },
    "Từ Hàn, phiên âm hoặc nghĩa Việt": { en: "Korean, romanization, or meaning", zh: "韩语、罗马字或释义" },
    "Phiên âm": { en: "Romanization", zh: "罗马字" },
    "Nghĩa": { en: "Meanings", zh: "释义" },
    "Ví dụ": { en: "Example", zh: "例句" },
    "Ví dụ trong tài liệu": { en: "Example from the source", zh: "教材原例" },
    "Không tìm thấy từ phù hợp.": { en: "No matching word found.", zh: "未找到匹配的单词。" },
    "Lật thẻ, tự đánh giá và để lịch ôn lặp ngắt quãng lo phần còn lại.": { en: "Flip, rate yourself, and let spaced repetition schedule the rest.", zh: "翻卡并自我评价，其余交给间隔重复计划。" },
    "Hai chiều": { en: "Both directions", zh: "双向" },
    "Hàn → Việt": { en: "Korean → meaning", zh: "韩语 → 释义" },
    "Việt → Hàn": { en: "Meaning → Korean", zh: "释义 → 韩语" },
    "Chạm để lật": { en: "Tap to flip", zh: "点击翻面" },
    "Lật thẻ": { en: "Flip card", zh: "翻卡" },
    "Nghe từ": { en: "Play word", zh: "播放单词" },
    "Nghe câu ví dụ": { en: "Play example sentence", zh: "播放例句" },
    "Xáo trộn lại": { en: "Shuffle", zh: "重新洗牌" },
    "Chưa nhớ": { en: "Not learned", zh: "未掌握" },
    "Khó": { en: "Hard", zh: "难词" },
    "Đã nhớ": { en: "Learned", zh: "已掌握" },
    "Tất cả từ trong bài": { en: "All lesson words", zh: "本课全部单词" },
    "Ôn từ chưa thuộc": { en: "Review not learned", zh: "复习未掌握词" },
    "Ôn từ khó": { en: "Review hard words", zh: "复习难词" },
    "Ghi chú của tôi": { en: "My note", zh: "我的笔记" },
    "Ghi điều bạn cần nhớ về từ này…": { en: "Write what you want to remember about this word…", zh: "写下你想记住的内容……" },
    "Xóa ghi chú": { en: "Delete note", zh: "删除笔记" },
    "Đã tự động lưu": { en: "Saved automatically", zh: "已自动保存" },
    "Bộ ôn này chưa có từ nào.": { en: "This review deck is empty.", zh: "此复习词组暂无单词。" },
    "Quay lại toàn bộ từ": { en: "Back to all words", zh: "返回全部单词" },
    "Mỗi lượt bao gồm toàn bộ từ của chủ đề đang chọn.": { en: "Each attempt includes every word in the selected topic.", zh: "每次练习包含所选主题的全部单词。" },
    "Chiều hỏi": { en: "Question direction", zh: "出题方向" },
    "Xen kẽ hai chiều": { en: "Alternate both directions", zh: "双向交替" },
    "Bắt đầu": { en: "Start", zh: "开始" },
    "câu · xáo trộn tự động · lưu điểm vào tiến độ": { en: "questions · shuffled automatically · score saved to progress", zh: "题 · 自动打乱 · 成绩保存到学习进度" },
    "Chọn nghĩa đúng": { en: "Choose the correct meaning", zh: "选择正确释义" },
    "Chọn từ tiếng Hàn đúng": { en: "Choose the correct Korean word", zh: "选择正确的韩语单词" },
    "Chính xác": { en: "Correct", zh: "正确" },
    "Câu tiếp theo": { en: "Next question", zh: "下一题" },
    "Làm lại": { en: "Try again", zh: "再试一次" },
    "Chọn bài khác": { en: "Choose another lesson", zh: "选择其他课程" },
    "Rất tốt. Hãy duy trì nhịp học này.": { en: "Excellent. Keep up this study rhythm.", zh: "很好，请继续保持这个学习节奏。" },
    "Những từ sai đã được đưa vào danh sách cần ôn.": { en: "Incorrect words were added to the review list.", zh: "答错的单词已加入复习列表。" },
    "Mở bài nghe chính thức": { en: "Open official audio", zh: "打开官方音频" },
    "Âm thanh chính thức": { en: "Official audio", zh: "官方音频" },
    "Nghe và bắt ý chính": { en: "Listen for the main idea", zh: "听取大意" },
    "Phát bản luyện ko-KR": { en: "Play ko-KR practice audio", zh: "播放ko-KR练习音频" },
    "Chọn MP3 của bài": { en: "Choose lesson MP3 files", zh: "选择本课MP3文件" },
    "Mở sách điện tử Nuri": { en: "Open Nuri e-book", zh: "打开Nuri电子书" },
    "Nghe chọn đáp án": { en: "Listen and choose", zh: "听音选择" },
    "Nộp đáp án": { en: "Submit answer", zh: "提交答案" },
    "Nghe chép chính tả": { en: "Dictation", zh: "听写" },
    "Nhập phần còn thiếu bằng tiếng Hàn": { en: "Enter the missing Korean text", zh: "输入缺少的韩语内容" },
    "Kiểm tra chính tả": { en: "Check dictation", zh: "检查听写" },
    "Xem lời thoại và nghĩa": { en: "Show transcript and translation", zh: "显示原文和翻译" },
    "Ẩn lời thoại": { en: "Hide transcript", zh: "隐藏原文" },
    "Chưa chọn tệp MP3 chính thức. Bạn vẫn có thể nghe bản luyện bằng giọng ko-KR của trình duyệt.": { en: "No official MP3 selected. You can still use the browser's ko-KR practice voice.", zh: "尚未选择官方MP3，仍可使用浏览器的ko-KR练习语音。" },
    "Tải file nghe": { en: "Upload audio", zh: "上传音频" },
    "Nghe đoạn": { en: "Play passage", zh: "播放段落" },
    "Tạm dừng": { en: "Pause", zh: "暂停" },
    "Hiện lời thoại": { en: "Show transcript", zh: "显示原文" },
    "Ẩn lời thoại": { en: "Hide transcript", zh: "隐藏原文" },
    "Kiểm tra": { en: "Check", zh: "检查" },
    "Nghe chép": { en: "Dictation", zh: "听写" },
    "Phần đọc": { en: "Reading", zh: "朗读材料" },
    "Đoạn trong sách": { en: "Book passage", zh: "教材段落" },
    "Đoạn luyện thêm": { en: "Extra practice", zh: "补充练习" },
    "Trích từ Sejong 1": { en: "From Sejong 1", zh: "世宗1教材" },
    "Nghe toàn đoạn": { en: "Play full passage", zh: "播放全文" },
    "Lặp câu đang chọn": { en: "Repeat selected sentence", zh: "重复当前句" },
    "Phân tích ngữ pháp": { en: "Grammar analysis", zh: "语法分析" },
    "Bắt đầu ghi âm": { en: "Start recording", zh: "开始录音" },
    "Nhấn để ghi âm. Trình duyệt sẽ xin quyền micro.": { en: "Press to record. The browser will request microphone access.", zh: "点击开始录音，浏览器将请求麦克风权限。" },
    "Chấm phát âm dùng nhận dạng giọng nói của trình duyệt và hoạt động tốt nhất trên Chrome.": { en: "Pronunciation scoring uses browser speech recognition and works best in Chrome.", zh: "发音评分使用浏览器语音识别，在Chrome中效果最佳。" },
    "Đánh dấu hoàn thành": { en: "Mark complete", zh: "标记完成" },
    "✓ Đã hoàn thành": { en: "✓ Completed", zh: "✓ 已完成" },
    "Bản dịch": { en: "Translation", zh: "翻译" },
    "Ngữ pháp": { en: "Grammar", zh: "语法" },
    "Đánh dấu đã luyện": { en: "Mark as practised", zh: "标记为已练习" },
    "Đã luyện": { en: "Practised", zh: "已练习" },
    "Ghi âm": { en: "Record", zh: "录音" },
    "Dừng ghi âm": { en: "Stop recording", zh: "停止录音" },
    "Nghe bản ghi": { en: "Play recording", zh: "播放录音" },
    "Viết từ": { en: "Write words", zh: "单词书写" },
    "Viết theo chủ đề": { en: "Topic writing", zh: "主题写作" },
    "Viết từ theo nghĩa, nghe chép chính tả và tự tạo câu ngắn theo chủ đề.": { en: "Write Korean from meanings, practise dictation, and compose a short topic paragraph.", zh: "根据释义写韩语、进行听写，并完成主题短文。" },
    "Viết từ tiếng Hàn có nghĩa": { en: "Write the Korean word for", zh: "请写出对应的韩语单词" },
    "Nhập tiếng Hàn": { en: "Enter Korean", zh: "输入韩语" },
    "Xem đáp án": { en: "Show answer", zh: "查看答案" },
    "Nghe rồi viết lại từ tiếng Hàn": { en: "Listen and write the Korean word", zh: "听后写出韩语单词" },
    "Nghe từ": { en: "Play word", zh: "播放单词" },
    "Nhập điều bạn nghe được": { en: "Type what you hear", zh: "输入你听到的内容" },
    "Bài viết của tôi": { en: "My writing", zh: "我的作文" },
    "Viết câu tiếng Hàn của bạn…": { en: "Write your Korean sentences…", zh: "写下你的韩语句子……" },
    "Lưu bài viết": { en: "Save writing", zh: "保存作文" },
    "Đáp án tham khảo": { en: "Reference answer", zh: "参考答案" },
    "Nghe đáp án": { en: "Play answer", zh: "播放答案" },
    "Sao chép": { en: "Copy", zh: "复制" },
    "Ghi chú tự sửa": { en: "Self-correction notes", zh: "自我修改笔记" },
    "Ghi lại lỗi, cách sửa hoặc điều cần hỏi giáo viên…": { en: "Note errors, corrections, or questions for your teacher…", zh: "记录错误、修改方法或想问老师的问题……" },
    "Tổng quan tiến độ": { en: "Progress overview", zh: "进度总览" },
    "Dữ liệu này chỉ thuộc hồ sơ hiện tại trên trình duyệt này.": { en: "This data belongs only to the current profile in this browser.", zh: "这些数据仅属于当前浏览器中的此档案。" },
    "Lịch sử trắc nghiệm": { en: "Quiz history", zh: "测验记录" },
    "Gửi góp ý sửa nội dung": { en: "Send content feedback", zh: "提交内容反馈" },
    "Quản lý dữ liệu": { en: "Manage data", zh: "数据管理" },
    "Giọng đọc tiếng Hàn": { en: "Korean voice", zh: "韩语语音" },
    "Giọng đọc": { en: "Voice", zh: "语音" },
    "Tốc độ": { en: "Speed", zh: "语速" },
    "Nghe thử": { en: "Test voice", zh: "试听" },
    "Lưu cài đặt": { en: "Save settings", zh: "保存设置" },
    "Hồ sơ học viên": { en: "Learner profile", zh: "学习者档案" },
    "Tên hồ sơ": { en: "Profile name", zh: "档案名称" },
    "Ngôn ngữ hệ thống": { en: "System language", zh: "系统语言" },
    "Ngôn ngữ được lưu riêng cho hồ sơ này.": { en: "The language is saved separately for this profile.", zh: "语言设置会单独保存到此档案。" },
    "Đổi PIN": { en: "Change PIN", zh: "修改PIN" },
    "PIN hiện tại": { en: "Current PIN", zh: "当前PIN" },
    "PIN mới": { en: "New PIN", zh: "新PIN" },
    "Quản lý hồ sơ": { en: "Profile management", zh: "档案管理" },
    "Đăng xuất": { en: "Sign out", zh: "退出登录" },
    "Xóa hồ sơ": { en: "Delete profile", zh: "删除档案" },
    "Tiến độ theo bài": { en: "Progress by lesson", zh: "各课进度" },
    "Từ cần chú ý": { en: "Words to focus on", zh: "需要注意的单词" },
    "Ngày": { en: "Date", zh: "日期" },
    "Bài": { en: "Lesson", zh: "课程" },
    "Điểm": { en: "Score", zh: "分数" },
    "Tỷ lệ": { en: "Percentage", zh: "正确率" },
    "Chuỗi ngày học": { en: "Study streak", zh: "连续学习天数" },
    "Từ đã ôn": { en: "Reviewed words", zh: "已复习单词" },
    "Từ đã nhớ": { en: "Learned words", zh: "已掌握单词" },
    "Điểm quiz trung bình": { en: "Average quiz score", zh: "测验平均分" },
    "Xuất tiến độ": { en: "Export progress", zh: "导出进度" },
    "Chưa có từ yếu. Hãy làm một lượt flashcard.": { en: "No weak words yet. Complete a flashcard round.", zh: "暂无薄弱词汇，请先完成一轮闪卡练习。" },
    "Chưa có kết quả. Hãy hoàn thành một lượt trắc nghiệm.": { en: "No results yet. Complete a quiz.", zh: "暂无结果，请先完成一次测验。" },
    "Báo cáo và góp ý": { en: "Reports and feedback", zh: "报告与反馈" },
    "Thu thập lỗi nội dung, đề xuất sửa và ảnh minh họa từ người học.": { en: "Collect content errors, suggested corrections, and learner screenshots.", zh: "收集内容错误、修改建议和学习者截图。" },
    "Mở Google Form": { en: "Open Google Form", zh: "打开Google表单" },
    "Kết nối Google Form": { en: "Connect Google Form", zh: "连接Google表单" },
    "Dán liên kết biểu mẫu “Góp ý và báo lỗi – Học tiếng Hàn Sejong 1”. Người tải ảnh sẽ cần đăng nhập Google.": { en: "Paste the “Feedback and error report – Sejong Korean 1” form link. Image uploaders will need to sign in to Google.", zh: "粘贴“反馈与报错－世宗韩语1”表单链接。上传图片者需要登录Google。" },
    "Nếu chưa có Form, biểu mẫu cục bộ bên cạnh có thể xuất một tệp JSON kèm ảnh để gửi thủ công cho người quản trị.": { en: "If no form is connected, the local form can export a JSON file with the image for manual delivery to the administrator.", zh: "如果尚未连接表单，可使用本地表单导出含图片的JSON文件，再手动发送给管理员。" },
    "Liên kết Google Form": { en: "Google Form link", zh: "Google表单链接" },
    "Lưu liên kết": { en: "Save link", zh: "保存链接" },
    "Tạo báo cáo cục bộ": { en: "Create local report", zh: "创建本地报告" },
    "Tên người góp ý (không bắt buộc)": { en: "Contributor name (optional)", zh: "反馈者姓名（选填）" },
    "Tên hiển thị": { en: "Display name", zh: "显示名称" },
    "Loại lỗi": { en: "Issue type", zh: "问题类型" },
    "Sai nghĩa": { en: "Incorrect meaning", zh: "释义错误" },
    "Sai chính tả": { en: "Spelling error", zh: "拼写错误" },
    "Sai phát âm/phiên âm": { en: "Pronunciation/romanization error", zh: "发音／罗马字错误" },
    "Lỗi âm thanh": { en: "Audio issue", zh: "音频问题" },
    "Lỗi giao diện": { en: "Interface issue", zh: "界面问题" },
    "Đề xuất khác": { en: "Other suggestion", zh: "其他建议" },
    "Nội dung hiện tại": { en: "Current content", zh: "当前内容" },
    "Đề xuất sửa": { en: "Suggested correction", zh: "修改建议" },
    "Thông tin liên hệ (không bắt buộc)": { en: "Contact information (optional)", zh: "联系方式（选填）" },
    "Email hoặc cách liên hệ": { en: "Email or contact method", zh: "邮箱或联系方式" },
    "Ảnh minh họa": { en: "Screenshot", zh: "截图" },
    "Lưu báo cáo thành JSON": { en: "Save report as JSON", zh: "将报告保存为JSON" },
    "Báo cáo đã lưu trên thiết bị": { en: "Reports saved on this device", zh: "设备上已保存的报告" },
    "Chưa có báo cáo cục bộ.": { en: "No local reports yet.", zh: "暂无本地报告。" },
    "Nhập thêm từ mới, gộp hoặc thay thế, tự loại trùng và xuất bản sao lưu.": { en: "Add words, merge or replace data, deduplicate automatically, and export backups.", zh: "添加新词、合并或替换数据、自动去重并导出备份。" },
    "Xuất toàn bộ dữ liệu": { en: "Export all data", zh: "导出全部数据" },
    "Tổng từ": { en: "Total words", zh: "单词总数" },
    "Từ gốc 1A": { en: "Built-in 1A words", zh: "1A内置词汇" },
    "Từ thêm vào": { en: "Added words", zh: "新增词汇" },
    "Chủ đề": { en: "Topics", zh: "主题" },
    "Nhập CSV hoặc JSON": { en: "Import CSV or JSON", zh: "导入CSV或JSON" },
    "Chọn file dữ liệu": { en: "Choose a data file", zh: "选择数据文件" },
    "Chọn file": { en: "Choose file", zh: "选择文件" },
    "Gộp thêm và loại trùng": { en: "Merge and deduplicate", zh: "合并并去重" },
    "Thay thế toàn bộ": { en: "Replace all", zh: "全部替换" },
    "Tải CSV mẫu": { en: "Download CSV template", zh: "下载CSV模板" },
    "Xuất từ vựng CSV": { en: "Export vocabulary CSV", zh: "导出词汇CSV" },
    "Thêm nhanh một từ": { en: "Quickly add a word", zh: "快速添加单词" },
    "Từ tiếng Hàn": { en: "Korean word", zh: "韩语单词" },
    "Phiên âm RR": { en: "RR romanization", zh: "RR罗马字" },
    "Nghĩa tiếng Việt": { en: "Vietnamese meaning", zh: "越南语释义" },
    "Nghĩa tiếng Anh": { en: "English meaning", zh: "英语释义" },
    "Nghĩa tiếng Trung": { en: "Chinese meaning", zh: "中文释义" },
    "Câu ví dụ Hàn": { en: "Korean example sentence", zh: "韩语例句" },
    "Dịch câu ví dụ tiếng Việt": { en: "Vietnamese example translation", zh: "例句越南语翻译" },
    "Dịch câu ví dụ tiếng Anh": { en: "English example translation", zh: "例句英语翻译" },
    "Dịch câu ví dụ tiếng Trung": { en: "Chinese example translation", zh: "例句中文翻译" },
    "Thêm vào dữ liệu dùng chung": { en: "Add to shared data", zh: "添加到共享数据" },
    "Sao lưu": { en: "Backup", zh: "备份" },
    "Xuất riêng dữ liệu học hoặc tiến độ của hồ sơ hiện tại.": { en: "Export learning data or the current profile's progress separately.", zh: "单独导出学习数据或当前档案的进度。" },
    "Dữ liệu bài học dùng chung cho mọi hồ sơ trên thiết bị; SRS, điểm, Shadowing và bài viết vẫn lưu riêng theo từng tài khoản cục bộ.": { en: "Lesson data is shared by profiles on this device; SRS, scores, Shadowing, and writing remain separate for each local profile.", zh: "本设备上的档案共享课程数据；SRS、成绩、Shadowing和写作仍按本地档案分别保存。" },
    "Từ vựng JSON": { en: "Vocabulary JSON", zh: "词汇JSON" },
    "Tiến độ JSON": { en: "Progress JSON", zh: "进度JSON" },
    "Bản sao hồ sơ": { en: "Profile backup", zh: "档案备份" },
    "Khôi phục dữ liệu gốc": { en: "Restore original data", zh: "恢复原始数据" },
    "Khôi phục danh sách gốc": { en: "Restore original list", zh: "恢复原始词表" }
  };

  const state = {
    view: "dashboard",
    profiles: [],
    profile: null,
    vocab: [],
    vocabLesson: 1,
    vocabSearch: "",
    flashLesson: 1,
    flashDirection: "both",
    flashDeckMode: "lesson",
    flashDeck: [],
    flashIndex: 0,
    flashFlipped: false,
    quizLesson: 1,
    quizDirection: "both",
    quiz: null,
    listeningLesson: 1,
    listeningAnswer: null,
    listeningChecked: false,
    listeningTranscript: false,
    audioFiles: new Map(),
    shadowLesson: 1,
    shadowMode: "book",
    shadowSentence: 0,
    recordings: new Map(),
    recognized: new Map(),
    mediaRecorder: null,
    mediaStream: null,
    recognition: null,
    writingLesson: 1,
    writingMode: "vocab",
    writingWordIndex: 0,
    writingFeedback: null,
    writingReview: null,
    importMode: "merge",
    voices: [],
    toastTimer: null
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const today = () => new Date().toISOString().slice(0, 10);
  const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  const esc = value => String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const normalize = value => String(value ?? "").normalize("NFC").trim().replace(/\s+/g, "").replace(/[.,!?'"“”‘’]/g, "").toLowerCase();
  const language = () => state.profile?.settings?.language || "vi";
  const uiText = source => language() === "vi" ? source : (UI_COPY[source]?.[language()] || source);
  const localizedTopic = lesson => TOPIC_TEXT[Number(lesson)]?.[language()] || lessonInfo(lesson)?.topic || "";
  const meaningFor = (word, lang = language()) => lang === "vi"
    ? word.meaning
    : (word[`meaning_${lang}`] || word.meaning);
  const exampleTranslationFor = (word, lang = language()) => lang === "vi"
    ? word.example_vi
    : (word[`example_${lang}`] || word.example_vi);
  const meaningOrder = () => language() === "en"
    ? ["en", "zh", "vi"]
    : language() === "zh"
      ? ["zh", "en", "vi"]
      : ["vi", "zh", "en"];
  const meaningMarkup = (word, compact = false) => `
    <span class="meaning-stack ${compact ? "compact" : ""}">
      ${meaningOrder().map(lang => `
        <span class="meaning-line ${lang === language() ? "primary" : ""}">
          <span class="language-badge">${LANGUAGE_META[lang].short}</span>
          <span>${esc(meaningFor(word, lang))}</span>
        </span>
      `).join("")}
    </span>
  `;
  const shuffle = input => {
    const array = [...input];
    for (let index = array.length - 1; index > 0; index--) {
      const next = Math.floor(Math.random() * (index + 1));
      [array[index], array[next]] = [array[next], array[index]];
    }
    return array;
  };
  const safeParse = (value, fallback) => {
    try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
  };
  const cloneData = value => typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
  const loadProfiles = () => safeParse(storage.local.getItem(STORAGE.profiles), []);
  const saveProfiles = () => storage.local.setItem(STORAGE.profiles, JSON.stringify(state.profiles));
  const loadShared = () => safeParse(storage.local.getItem(STORAGE.shared), { vocabulary: null, reports: [] });
  const saveShared = shared => storage.local.setItem(STORAGE.shared, JSON.stringify(shared));
  const loadVocabularyContent = shared => {
    if (!Array.isArray(shared.vocabulary) || !shared.vocabulary.length) return cloneData(BASE_VOCAB);
    if (shared.contentVersion === CONTENT_VERSION) return shared.vocabulary;
    const baseIds = new Set(BASE_VOCAB.map(item => item.id));
    const baseKeys = new Set(BASE_VOCAB.map(item => `${Number(item.lesson)}:${normalize(item.word)}`));
    const containsBuiltInData = shared.vocabulary.some(item => baseIds.has(item.id));
    if (!containsBuiltInData) return shared.vocabulary;
    const customWords = shared.vocabulary.filter(item =>
      !baseIds.has(item.id) && !baseKeys.has(`${Number(item.lesson)}:${normalize(item.word)}`)
    );
    const merged = [...cloneData(BASE_VOCAB), ...customWords];
    shared.vocabulary = merged;
    shared.contentVersion = CONTENT_VERSION;
    saveShared(shared);
    return merged;
  };
  const lessonWords = lesson => state.vocab.filter(item => Number(item.lesson) === Number(lesson));
  const lessonInfo = lesson => LESSONS.find(item => item.lesson === Number(lesson)) || LESSONS[0];
  const defaultProgress = () => ({
    srs: {},
    quizHistory: [],
    listening: {},
    shadow: {},
    writing: {},
    flashNotes: {},
    writingNotes: {},
    reviewAgain: {},
    reviewHard: {},
    lastLesson: 1,
    streak: 0,
    lastActive: "",
    sessions: 0
  });
  const profileProgress = () => state.profile?.progress || defaultProgress();
  const persistProfile = () => {
    if (!state.profile) return;
    const index = state.profiles.findIndex(item => item.id === state.profile.id);
    if (index >= 0) state.profiles[index] = state.profile;
    saveProfiles();
  };
  const lessonOptions = selected => LESSONS.map(item =>
    `<option value="${item.lesson}" ${Number(selected) === item.lesson ? "selected" : ""}>${language() === "zh" ? `第${item.lesson}课` : `${language() === "vi" ? "Bài" : "Lesson"} ${item.lesson}`} · ${esc(localizedTopic(item.lesson))}</option>`
  ).join("");

  function translateDynamicUiText(source) {
    if (language() === "vi") return source;
    const direct = UI_COPY[source]?.[language()];
    if (direct) return direct;
    let match = source.match(/^Bài (\d+) · (.+)$/);
    if (match) return language() === "zh"
      ? `第${match[1]}课 · ${localizedTopic(Number(match[1]))}`
      : `Lesson ${match[1]} · ${localizedTopic(Number(match[1]))}`;
    match = source.match(/^Bài (\d+)$/);
    if (match) return language() === "zh" ? `第${match[1]}课` : `Lesson ${match[1]}`;
    match = source.match(/^Luyện nghe · Bài (\d+)$/);
    if (match) return language() === "zh" ? `听力练习 · 第${match[1]}课` : `Listening · Lesson ${match[1]}`;
    match = source.match(/^(\d+) · (.+)$/);
    if (match) return `${match[1]} · ${translateDynamicUiText(match[2])}`;
    match = source.match(/^Câu (\d+) \/ (\d+)$/);
    if (match) return language() === "zh" ? `第 ${match[1]} / ${match[2]} 题` : `Question ${match[1]} / ${match[2]}`;
    match = source.match(/^Thẻ (\d+) \/ (\d+)$/);
    if (match) return language() === "zh" ? `卡片 ${match[1]} / ${match[2]}` : `Card ${match[1]} / ${match[2]}`;
    match = source.match(/^Đúng (\d+)$/);
    if (match) return language() === "zh" ? `答对 ${match[1]}` : `Correct ${match[1]}`;
    match = source.match(/^(\d+) mục$/);
    if (match) return language() === "zh" ? `${match[1]} 项` : `${match[1]} items`;
    match = source.match(/^(\d+) mục · có phiên âm và ví dụ$/);
    if (match) return language() === "zh" ? `${match[1]}项 · 含罗马字和例句` : `${match[1]} items · romanization and examples`;
    match = source.match(/^(\d+) từ$/);
    if (match) return language() === "zh" ? `${match[1]} 个单词` : `${match[1]} words`;
    match = source.match(/^(\d+) ký tự Hangul$/);
    if (match) return language() === "zh" ? `${match[1]} 个韩文字符` : `${match[1]} Hangul characters`;
    match = source.match(/^Tiến độ của (.+)$/);
    if (match) return language() === "zh" ? `${match[1]}的学习进度` : `${match[1]}'s progress`;
    match = source.match(/^(\d+) ngày$/);
    if (match) return language() === "zh" ? `${match[1]} 天` : `${match[1]} days`;
    match = source.match(/^(\d+) lượt$/);
    if (match) return language() === "zh" ? `${match[1]} 次` : `${match[1]} attempts`;
    match = source.match(/^(\d+) câu$/);
    if (match) return language() === "zh" ? `${match[1]} 句` : `${match[1]} sentences`;
    match = source.match(/^(\d+)\/(\d+) câu Shadowing$/);
    if (match) return language() === "zh" ? `${match[1]}/${match[2]}句Shadowing` : `${match[1]}/${match[2]} Shadowing sentences`;
    match = source.match(/^Nghe câu (\d+)$/);
    if (match) return language() === "zh" ? `播放第${match[1]}句` : `Play sentence ${match[1]}`;
    match = source.match(/^Xóa danh sách từ đã nhập thêm và quay về (\d+) mục gốc\. Tiến độ học không bị xóa\.$/);
    if (match) return language() === "zh"
      ? `删除已添加的词汇并恢复为${match[1]}个原始词条。学习进度不会被删除。`
      : `Remove added words and restore the ${match[1]} original entries. Learning progress will not be deleted.`;
    match = source.match(/^Nghe (.+)$/);
    if (match) return language() === "zh" ? `播放${match[1]}` : `Play ${match[1]}`;
    return source;
  }

  function translateVisibleUi(root = document) {
    if (!state.profile || language() === "vi") return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const parent = node.parentElement;
      if (!parent || parent.closest("script, style, [lang='ko'], .ko, .example-ko, .reference-writing, .record-target")) return;
      if (parent.closest("#loginGate")?.hidden) return;
      const original = node.nodeValue;
      const trimmed = original.trim();
      if (!trimmed) return;
      const translated = translateDynamicUiText(trimmed);
      if (translated !== trimmed) node.nodeValue = original.replace(trimmed, translated);
    });
    $$("[placeholder], [title], [aria-label]", root).forEach(element => {
      if (element.closest("#loginGate")?.hidden) return;
      for (const attribute of ["placeholder", "title", "aria-label"]) {
        const value = element.getAttribute(attribute);
        if (!value) continue;
        const translated = translateDynamicUiText(value);
        if (translated !== value) element.setAttribute(attribute, translated);
      }
    });
  }

  let translateFrame = 0;
  function scheduleUiTranslation() {
    cancelAnimationFrame(translateFrame);
    translateFrame = requestAnimationFrame(() => translateVisibleUi(document));
  }

  function icon(name, label = "") {
    const paths = {
      home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5M9.5 20v-6h5v6"/>',
      book: '<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23V5.5Z"/><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5A3.5 3.5 0 0 1 20 23V5.5Z"/>',
      cards: '<rect x="4" y="5" width="15" height="13" rx="2"/><path d="m8 9 7 0M8 13h4M7 21h12a2 2 0 0 0 2-2V9"/>',
      check: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="m9 12 2 2 4-5M9 7h6"/>',
      headphones: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14h3v6H5a1 1 0 0 1-1-1v-5Zm16 0h-3v6h2a1 1 0 0 0 1-1v-5Z"/>',
      mic: '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>',
      pen: '<path d="m4 20 4.5-1 10-10a2 2 0 0 0-3-3l-10 10L4 20Z"/><path d="m13.5 7.5 3 3"/>',
      chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20V7"/>',
      report: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/>',
      database: '<ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
      user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
      close: '<path d="m6 6 12 12M18 6 6 18"/>',
      volume: '<path d="M4 10v4h4l5 4V6L8 10H4Z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
      play: '<path d="m9 6 9 6-9 6V6Z"/>',
      pause: '<path d="M9 6v12M15 6v12"/>',
      arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
      upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 15v5h16v-5"/>',
      download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/>',
      trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
      refresh: '<path d="M20 7v5h-5"/><path d="M19 12a7 7 0 1 0-2 5"/>',
      search: '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>',
      calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',
      star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>'
    };
    return `<svg aria-hidden="${label ? "false" : "true"}" ${label ? `aria-label="${esc(label)}"` : ""} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.star}</svg>`;
  }

  function toast(message) {
    const element = $("#toast");
    element.textContent = message;
    element.classList.add("show");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => element.classList.remove("show"), 2600);
  }

  async function hashPin(pin) {
    const bytes = new TextEncoder().encode(`sejong-green:${pin}`);
    if (window.crypto?.subtle) {
      const digest = await window.crypto.subtle.digest("SHA-256", bytes);
      return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
    }
    return btoa(String.fromCharCode(...bytes));
  }

  function setActiveDay() {
    if (!state.profile) return;
    const progress = profileProgress();
    const current = today();
    if (progress.lastActive !== current) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      progress.streak = progress.lastActive === yesterday ? (progress.streak || 0) + 1 : 1;
      progress.lastActive = current;
      progress.sessions = (progress.sessions || 0) + 1;
      persistProfile();
    }
  }

  function renderProfileSelect() {
    state.profiles = loadProfiles();
    const select = $("#loginProfile");
    select.innerHTML = state.profiles.length
      ? state.profiles.map(item => `<option value="${esc(item.id)}">${esc(item.name)}</option>`).join("")
      : '<option value="">Chưa có hồ sơ</option>';
    $("#loginButton").disabled = !state.profiles.length;
  }

  async function registerProfile() {
    const name = $("#registerName").value.trim();
    const pin = $("#registerPin").value.trim();
    if (!name) return toast("Hãy nhập tên hiển thị.");
    if (!/^\d{4,12}$/.test(pin)) return toast("PIN cần từ 4 đến 12 chữ số.");
    const duplicate = state.profiles.some(item => item.name.toLowerCase() === name.toLowerCase());
    if (duplicate) return toast("Tên hồ sơ này đã tồn tại.");
    const profile = {
      id: uid(),
      name,
      pinHash: await hashPin(pin),
      createdAt: new Date().toISOString(),
      settings: { voiceURI: "", rate: 0.9, language: "vi" },
      progress: defaultProgress()
    };
    state.profiles.push(profile);
    saveProfiles();
    $("#registerPin").value = "";
    await enterApp(profile.id);
  }

  async function login() {
    const profile = state.profiles.find(item => item.id === $("#loginProfile").value);
    if (!profile) return toast("Hãy tạo hồ sơ trước.");
    const candidate = await hashPin($("#loginPin").value);
    if (candidate !== profile.pinHash) return toast("PIN chưa đúng.");
    $("#loginPin").value = "";
    await enterApp(profile.id);
  }

  async function enterApp(profileId) {
    state.profiles = loadProfiles();
    state.profile = state.profiles.find(item => item.id === profileId) || null;
    if (!state.profile) return;
    state.profile.progress = { ...defaultProgress(), ...(state.profile.progress || {}) };
    state.profile.progress.flashNotes = { ...(state.profile.progress.flashNotes || {}) };
    state.profile.progress.writingNotes = { ...(state.profile.progress.writingNotes || {}) };
    state.profile.progress.reviewAgain = { ...(state.profile.progress.reviewAgain || {}) };
    state.profile.progress.reviewHard = { ...(state.profile.progress.reviewHard || {}) };
    state.profile.settings = { voiceURI: "", rate: 0.9, language: "vi", ...(state.profile.settings || {}) };
    document.documentElement.lang = state.profile.settings.language === "zh" ? "zh-CN" : state.profile.settings.language;
    const shared = loadShared();
    state.vocab = loadVocabularyContent(shared);
    state.vocabLesson = state.profile.progress.lastLesson || 1;
    state.flashLesson = state.vocabLesson;
    state.quizLesson = state.vocabLesson;
    state.listeningLesson = state.vocabLesson;
    state.shadowLesson = state.vocabLesson;
    state.writingLesson = state.vocabLesson;
    storage.session.setItem(SESSION_KEY, state.profile.id);
    setActiveDay();
    $("#loginGate").hidden = true;
    $("#appShell").hidden = false;
    $("#sidebarName").textContent = state.profile.name;
    $("#avatarInitial").textContent = state.profile.name.trim().charAt(0).toUpperCase() || "S";
    $("#topGreeting").textContent = language() === "en"
      ? `Hi ${state.profile.name}, let's keep learning today`
      : language() === "zh"
        ? `${state.profile.name}，今天继续学习吧`
        : `Chào ${state.profile.name}, hôm nay mình học tiếp nhé`;
    renderNav();
    loadVoices();
    activateView("dashboard");
  }

  function logout() {
    stopAllMedia();
    storage.session.removeItem(SESSION_KEY);
    state.profile = null;
    $("#appShell").hidden = true;
    $("#loginGate").hidden = false;
    renderProfileSelect();
  }

  function renderNav() {
    $("#mainNav").innerHTML = NAV.map(([id, label, glyph]) =>
      `<button class="nav-button ${state.view === id ? "active" : ""}" type="button" data-nav="${id}" title="${esc(uiText(label))}">${icon(glyph)}<span>${esc(uiText(label))}</span></button>`
    ).join("");
    $$("[data-nav]").forEach(button => button.addEventListener("click", () => activateView(button.dataset.nav)));
  }

  function activateView(view) {
    stopAllMedia();
    state.view = view;
    $$(".view").forEach(item => item.classList.toggle("active", item.dataset.view === view));
    $$(".nav-button").forEach(item => item.classList.toggle("active", item.dataset.nav === view));
    renderCurrentView();
    $("#mainContent").focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderCurrentView() {
    const renderers = {
      dashboard: renderDashboard,
      vocabulary: renderVocabulary,
      flashcards: renderFlashcards,
      quiz: renderQuiz,
      listening: renderListening,
      shadowing: renderShadowing,
      writing: renderWriting,
      progress: renderProgress,
      reports: renderReports,
      data: renderData
    };
    renderers[state.view]?.();
    scheduleUiTranslation();
  }

  function openDialog(title, html) {
    $("#dialogTitle").textContent = uiText(title);
    $("#dialogBody").innerHTML = html;
    $("#appDialog").showModal();
    scheduleUiTranslation();
  }

  function closeDialog() { $("#appDialog").close(); }

  function openVoiceSettings() {
    const selected = state.profile.settings.voiceURI || chooseVoice()?.voiceURI || "";
    openDialog("Giọng đọc tiếng Hàn", `
      <p class="muted">Web ưu tiên giọng <strong>ko-KR</strong> chuẩn Seoul có sẵn trên thiết bị. Danh sách giọng khác nhau giữa Safari, Chrome và từng hệ điều hành.</p>
      <p class="source-note">Mẫu đối chiếu phát âm: <a href="${NAVER_VOICE_SAMPLE}" target="_blank" rel="noopener">Từ điển Hàn–Việt Naver</a>. Web không sao chép âm thanh của Naver.</p>
      <label class="field-label" for="voiceSelect">Giọng đọc</label>
      <select class="field" id="voiceSelect">
        ${state.voices.filter(voice => voice.lang?.toLowerCase().startsWith("ko")).map(voice =>
          `<option value="${esc(voice.voiceURI)}" ${voice.voiceURI === selected ? "selected" : ""}>${esc(voice.name)} · ${esc(voice.lang)}</option>`
        ).join("") || '<option value="">Giọng ko-KR mặc định</option>'}
      </select>
      <label class="field-label" for="voiceRate">Tốc độ <span id="voiceRateLabel">${Number(state.profile.settings.rate || .9).toFixed(1)}x</span></label>
      <input id="voiceRate" class="field" type="range" min="0.5" max="1.3" step="0.1" value="${state.profile.settings.rate || .9}">
      <div class="control-row" style="margin-top:18px">
        <button class="button" id="testVoice" type="button">${icon("volume")} Nghe thử</button>
        <button class="button primary" id="saveVoice" type="button">Lưu cài đặt</button>
      </div>
    `);
    $("#voiceRate").addEventListener("input", event => $("#voiceRateLabel").textContent = `${Number(event.target.value).toFixed(1)}x`);
    $("#testVoice").addEventListener("click", () => {
      state.profile.settings.rate = Number($("#voiceRate").value);
      state.profile.settings.voiceURI = $("#voiceSelect").value;
      speak("안녕하세요. 오늘도 한국어를 같이 공부해요.");
    });
    $("#saveVoice").addEventListener("click", () => {
      state.profile.settings.rate = Number($("#voiceRate").value);
      state.profile.settings.voiceURI = $("#voiceSelect").value;
      persistProfile();
      closeDialog();
      toast("Đã lưu giọng đọc.");
    });
  }

  function openProfileSettings() {
    openDialog("Hồ sơ học viên", `
      <label class="field-label">Tên hồ sơ</label>
      <input class="field" value="${esc(state.profile.name)}" disabled>
      <div class="open-section">
        <h3>Ngôn ngữ hệ thống</h3>
        <p class="muted small">Ngôn ngữ được lưu riêng cho hồ sơ này.</p>
        <select class="field" id="systemLanguage">
          ${Object.entries(LANGUAGE_META).map(([code, meta]) => `
            <option value="${code}" ${language() === code ? "selected" : ""}>${esc(meta.label)}</option>
          `).join("")}
        </select>
      </div>
      <div class="open-section">
        <h3>Đổi PIN</h3>
        <label class="field-label" for="oldPin">PIN hiện tại</label>
        <input class="field" id="oldPin" type="password" inputmode="numeric">
        <label class="field-label" for="newPin">PIN mới</label>
        <input class="field" id="newPin" type="password" inputmode="numeric" minlength="4" maxlength="12">
        <button class="button primary" id="changePin" type="button" style="margin-top:14px">Đổi PIN</button>
      </div>
      <div class="open-section danger-zone" style="padding:18px">
        <h3>Quản lý hồ sơ</h3>
        <div class="data-actions">
          <button class="button" id="logoutButton" type="button">Đăng xuất</button>
          <button class="button danger" id="deleteProfile" type="button">${icon("trash")} Xóa hồ sơ</button>
        </div>
      </div>
    `);
    $("#systemLanguage").addEventListener("change", event => {
      state.profile.settings.language = event.target.value;
      document.documentElement.lang = event.target.value === "zh" ? "zh-CN" : event.target.value;
      persistProfile();
      closeDialog();
      $("#topGreeting").textContent = language() === "en"
        ? `Hi ${state.profile.name}, let's keep learning today`
        : language() === "zh"
          ? `${state.profile.name}，今天继续学习吧`
          : `Chào ${state.profile.name}, hôm nay mình học tiếp nhé`;
      renderNav();
      renderCurrentView();
      toast(language() === "en" ? "Language saved for this profile." : language() === "zh" ? "已为此档案保存语言设置。" : "Đã lưu ngôn ngữ cho hồ sơ.");
    });
    $("#logoutButton").addEventListener("click", () => { closeDialog(); logout(); });
    $("#changePin").addEventListener("click", async () => {
      if (await hashPin($("#oldPin").value) !== state.profile.pinHash) return toast("PIN hiện tại chưa đúng.");
      if (!/^\d{4,12}$/.test($("#newPin").value)) return toast("PIN mới cần từ 4 đến 12 chữ số.");
      state.profile.pinHash = await hashPin($("#newPin").value);
      persistProfile();
      closeDialog();
      toast("Đã đổi PIN.");
    });
    $("#deleteProfile").addEventListener("click", () => {
      if (!confirm(`Xóa hồ sơ “${state.profile.name}” cùng toàn bộ tiến độ? Thao tác này không thể hoàn tác.`)) return;
      state.profiles = state.profiles.filter(item => item.id !== state.profile.id);
      saveProfiles();
      closeDialog();
      logout();
      toast("Đã xóa hồ sơ.");
    });
  }

  function loadVoices() {
    const update = () => {
      state.voices = window.speechSynthesis?.getVoices?.() || [];
      state.voices.sort((a, b) => Number(b.lang?.toLowerCase().startsWith("ko")) - Number(a.lang?.toLowerCase().startsWith("ko")));
    };
    update();
    if ("speechSynthesis" in window) window.speechSynthesis.onvoiceschanged = update;
  }

  function chooseVoice() {
    const korean = state.voices.filter(voice => voice.lang?.toLowerCase().startsWith("ko"));
    const saved = korean.find(voice => voice.voiceURI === state.profile?.settings?.voiceURI);
    if (saved) return saved;
    const preferred = korean.find(voice => /yuna|sora|sunhi|heami|seoyeon|korean|한국/i.test(voice.name));
    return preferred || korean[0] || null;
  }

  function speak(text, options = {}) {
    if (!("speechSynthesis" in window)) return toast("Trình duyệt này chưa hỗ trợ giọng đọc.");
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = Number(options.rate || state.profile?.settings?.rate || .9);
    const voice = chooseVoice();
    if (voice) utterance.voice = voice;
    if (options.onend) utterance.onend = options.onend;
    if (options.onerror) utterance.onerror = options.onerror;
    window.speechSynthesis.speak(utterance);
    return utterance;
  }

  function speakSequence(sentences, index = 0) {
    if (index >= sentences.length) return;
    speak(sentences[index], { onend: () => speakSequence(sentences, index + 1) });
  }

  function stopAllMedia() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (state.mediaRecorder?.state === "recording") state.mediaRecorder.stop();
    if (state.mediaStream) state.mediaStream.getTracks().forEach(track => track.stop());
    state.mediaRecorder = null;
    state.mediaStream = null;
    if (state.recognition) {
      try { state.recognition.stop(); } catch {}
      state.recognition = null;
    }
  }

  function srsEntry(wordId) {
    return profileProgress().srs[wordId] || { level: 0, interval: 0, due: today(), reviews: 0, lapses: 0 };
  }

  function dueWords(lesson = null) {
    const current = today();
    return state.vocab.filter(word => {
      if (lesson && Number(word.lesson) !== Number(lesson)) return false;
      const item = srsEntry(word.id);
      return item.reviews > 0 && item.due <= current;
    });
  }

  function knownCount(words) {
    return words.filter(word => (srsEntry(word.id).level || 0) >= 3).length;
  }

  function setLastLesson(lesson) {
    if (!state.profile) return;
    state.profile.progress.lastLesson = Number(lesson);
    persistProfile();
  }

  function renderDashboard() {
    const progress = profileProgress();
    const lesson = progress.lastLesson || 1;
    const info = lessonInfo(lesson);
    const words = lessonWords(lesson);
    const known = knownCount(words);
    const reviewed = words.filter(word => srsEntry(word.id).reviews > 0).length;
    const percent = words.length ? Math.round((reviewed / words.length) * 100) : 0;
    const due = dueWords(lesson);
    $("#view-dashboard").innerHTML = `
      <div class="page-heading">
        <div>
          <h1>Học đều, nhớ lâu.</h1>
          <p>Tiếp tục đúng chỗ bạn đã dừng và dành vài phút ôn các từ đến hạn hôm nay.</p>
        </div>
        <div class="heading-actions">
          <button class="button primary" id="continueLesson" type="button">${icon("play")} Tiếp tục bài đang học ${icon("arrow")}</button>
        </div>
      </div>
      <div class="dashboard-grid">
        <div>
          <section class="panel lesson-hero">
            <p class="lesson-label">Bài đang học</p>
            <h1>${language() === "zh" ? `第${lesson}课` : language() === "en" ? `Lesson ${lesson}` : `Bài ${lesson}`} · ${esc(localizedTopic(lesson))}</h1>
            <div class="hero-progress">
              <div class="progress-track" aria-label="Tiến độ bài học"><span style="width:${percent}%"></span></div>
              <strong>${percent}%</strong>
            </div>
            <div class="metric-line">
              <span>Tổng từ: <strong>${words.length}</strong></span>
              <span>Đã ôn: <strong>${reviewed}</strong></span>
              <span>Đã nhớ: <strong>${known}</strong></span>
              <span>Chuỗi ngày học: <strong>${progress.streak || 0}</strong></span>
            </div>
            <div class="activity-rail">
              ${[
                ["vocabulary", "book", "Từ vựng", `${words.length} mục · có phiên âm và ví dụ`, percent],
                ["listening", "headphones", "Luyện nghe", "Trắc nghiệm + nghe chép chính tả", progress.listening[lesson] ? 100 : 0],
                ["shadowing", "mic", "Shadowing", "Đoạn sách + đoạn luyện thêm", shadowPercentForLesson(lesson)],
                ["writing", "pen", "Luyện viết", "Từ, chính tả và câu theo chủ đề", progress.writing[lesson] ? 100 : 0]
              ].map(([view, glyph, title, copy, value]) => `
                <a class="activity-row" href="#${view}" data-go="${view}">
                  <span class="activity-icon">${icon(glyph)}</span>
                  <span class="activity-copy"><strong>${title}</strong><small>${copy}</small></span>
                  <span class="progress-track"><span style="width:${value}%"></span></span>
                  <span aria-hidden="true">›</span>
                </a>
              `).join("")}
            </div>
          </section>
          <div class="source-note">
            ${language() === "en"
              ? `The vocabulary contains ${state.vocab.length} normalized entries from “Từ vựng 1A.pdf”; Shadowing excerpts cite pages from “Sejong1.pdf”.`
              : language() === "zh"
                ? `词汇包含从《Từ vựng 1A.pdf》整理的${state.vocab.length}个词条；Shadowing教材节选标注《Sejong1.pdf》页码。`
                : `Dữ liệu gồm ${state.vocab.length} mục từ đã chuẩn hóa từ “Từ vựng 1A.pdf”; đoạn trích Shadowing dẫn trang từ “Sejong1.pdf”.`}
          </div>
        </div>
        <aside class="panel">
          <div class="panel-header">
            <h2>Ôn tập hôm nay</h2>
            <span class="muted">${due.length} từ</span>
          </div>
          <div class="review-list">
            ${(due.length ? due.slice(0, 7) : shuffle(words).slice(0, 5)).map(word => `
              <div class="review-row">
                <span class="ko"><i class="status-dot"></i>${esc(word.word)}</span>
                <span>${esc(meaningFor(word))}</span>
                <button class="speak-mini" data-speak="${esc(word.word)}" type="button" aria-label="Nghe ${esc(word.word)}">${icon("volume")}</button>
              </div>
            `).join("")}
          </div>
          <div class="panel-body">
            <button class="button wide" id="reviewNow" type="button">${icon("cards")} Ôn ngay</button>
          </div>
        </aside>
      </div>
    `;
    $("#continueLesson").addEventListener("click", () => { state.flashLesson = lesson; state.flashDeckMode = "lesson"; initFlashDeck(); activateView("flashcards"); });
    $("#reviewNow").addEventListener("click", () => { state.flashLesson = lesson; state.flashDeckMode = "lesson"; initFlashDeck(); activateView("flashcards"); });
    $$("[data-go]", $("#view-dashboard")).forEach(link => link.addEventListener("click", event => {
      event.preventDefault();
      activateView(link.dataset.go);
    }));
    $$("[data-speak]", $("#view-dashboard")).forEach(button => button.addEventListener("click", () => speak(button.dataset.speak)));
  }

  function shadowPercentForLesson(lesson) {
    const item = SHADOW_DATA.find(entry => Number(entry.lesson) === Number(lesson));
    if (!item) return 0;
    const total = item.book.sentences.length + item.original.sentences.length;
    const done = ["book", "original"].reduce((sum, mode) =>
      sum + item[mode].sentences.filter((_, index) => profileProgress().shadow[`${lesson}-${mode}-${index}`]).length, 0);
    return total ? Math.round(done / total * 100) : 0;
  }

  function renderVocabulary() {
    const words = lessonWords(state.vocabLesson).filter(word => {
      const needle = normalize(state.vocabSearch);
      return !needle || [
        word.word,
        word.romanization,
        word.meaning,
        word.meaning_en,
        word.meaning_zh,
        word.source_example
      ].some(value => normalize(value).includes(needle));
    });
    $("#view-vocabulary").innerHTML = `
      <div class="page-heading">
        <div>
          <h1>Từ vựng</h1>
          <p>Toàn bộ danh sách 1A, được loại trùng và bổ sung phiên âm Revised Romanization.</p>
        </div>
        <div class="heading-actions">
          <button class="button" id="printVocabulary" type="button">In chủ đề</button>
          <button class="button primary" id="studyVocabulary" type="button">${icon("cards")} Học bằng flashcard</button>
        </div>
      </div>
      <div class="filter-bar">
        <label>
          <span class="field-label" style="margin-top:0">Tìm nhanh</span>
          <span style="position:relative;display:block">
            <input class="field" id="vocabSearch" value="${esc(state.vocabSearch)}" placeholder="Từ Hàn, phiên âm hoặc nghĩa Việt">
          </span>
        </label>
        <label>
          <span class="field-label" style="margin-top:0">Bài / chủ đề</span>
          <select class="field" id="vocabLesson">${lessonOptions(state.vocabLesson)}</select>
        </label>
        <div style="align-self:end;color:var(--muted);padding:10px">${words.length} mục</div>
      </div>
      <section class="panel" style="overflow:auto">
        <table class="vocab-table">
          <thead><tr><th>Từ vựng</th><th>Phiên âm</th><th>Nghĩa</th><th>Ví dụ</th></tr></thead>
          <tbody>
            ${words.map(word => `
              <tr>
                <td>
                  <div class="vocab-word">
                    <button class="speak-mini" type="button" data-speak="${esc(word.word)}" aria-label="Nghe ${esc(word.word)}">${icon("volume")}</button>
                    <strong>${esc(word.word)}</strong>
                  </div>
                </td>
                <td><span class="romanization">${esc(word.romanization)}</span></td>
                <td>${meaningMarkup(word, true)}</td>
                <td>
                  <div class="example-ko">${esc(word.example)}</div>
                  <div class="muted small">${esc(exampleTranslationFor(word))}</div>
                  ${word.source_example ? `<details class="source-example"><summary>Ví dụ trong tài liệu</summary><span class="ko">${esc(word.source_example)}</span></details>` : ""}
                </td>
              </tr>
            `).join("") || '<tr><td colspan="4"><div class="empty-state">Không tìm thấy từ phù hợp.</div></td></tr>'}
          </tbody>
        </table>
      </section>
    `;
    $("#vocabLesson").addEventListener("change", event => {
      state.vocabLesson = Number(event.target.value);
      setLastLesson(state.vocabLesson);
      renderVocabulary();
    });
    $("#vocabSearch").addEventListener("input", event => {
      state.vocabSearch = event.target.value;
      renderVocabulary();
      const input = $("#vocabSearch");
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
    $("#studyVocabulary").addEventListener("click", () => {
      state.flashLesson = state.vocabLesson;
      state.flashDeckMode = "lesson";
      initFlashDeck();
      activateView("flashcards");
    });
    $("#printVocabulary").addEventListener("click", () => window.print());
    $$("[data-speak]", $("#view-vocabulary")).forEach(button => button.addEventListener("click", () => speak(button.dataset.speak)));
    scheduleUiTranslation();
  }

  function flashWordsForMode(mode = state.flashDeckMode) {
    const progress = profileProgress();
    if (mode === "again") return state.vocab.filter(word => progress.reviewAgain?.[word.id]);
    if (mode === "hard") return state.vocab.filter(word => progress.reviewHard?.[word.id]);
    return lessonWords(state.flashLesson);
  }

  function initFlashDeck() {
    state.flashDeck = shuffle(flashWordsForMode());
    state.flashIndex = 0;
    state.flashFlipped = false;
  }

  function flashDirectionFor(word) {
    if (state.flashDirection === "both") return Math.random() > .5 ? "ko-vi" : "vi-ko";
    return state.flashDirection;
  }

  function renderFlashcards() {
    const sourceWords = flashWordsForMode();
    const sourceIds = new Set(sourceWords.map(word => word.id));
    if (state.flashDeck.some(word => !sourceIds.has(word.id)) || (!state.flashDeck.length && sourceWords.length)) initFlashDeck();
    const word = state.flashDeck[state.flashIndex] || sourceWords[0];
    const progress = profileProgress();
    const againCount = Object.values(progress.reviewAgain || {}).filter(Boolean).length;
    const hardCount = Object.values(progress.reviewHard || {}).filter(Boolean).length;
    const deckLabel = state.flashDeckMode === "again"
      ? uiText("Ôn từ chưa thuộc")
      : state.flashDeckMode === "hard"
        ? uiText("Ôn từ khó")
        : localizedTopic(state.flashLesson);
    if (!word) {
      $("#view-flashcards").innerHTML = `
        <div class="study-shell">
          <div class="page-heading">
            <div><h1>Flashcard</h1><p>Lật thẻ, tự đánh giá và để lịch ôn lặp ngắt quãng lo phần còn lại.</p></div>
          </div>
          <div class="flash-deck-tabs">
            <button class="${state.flashDeckMode === "lesson" ? "active" : ""}" data-flash-deck="lesson" type="button">Tất cả từ trong bài <span>${lessonWords(state.flashLesson).length}</span></button>
            <button class="${state.flashDeckMode === "again" ? "active" : ""}" data-flash-deck="again" type="button">Ôn từ chưa thuộc <span>${againCount}</span></button>
            <button class="${state.flashDeckMode === "hard" ? "active" : ""}" data-flash-deck="hard" type="button">Ôn từ khó <span>${hardCount}</span></button>
          </div>
          <section class="panel empty-review-deck">
            ${icon("cards")}
            <h2>Bộ ôn này chưa có từ nào.</h2>
            <button class="button primary" id="backToLessonDeck" type="button">Quay lại toàn bộ từ</button>
          </section>
        </div>
      `;
      $$("[data-flash-deck]", $("#view-flashcards")).forEach(button => button.addEventListener("click", () => {
        state.flashDeckMode = button.dataset.flashDeck;
        initFlashDeck();
        renderFlashcards();
      }));
      $("#backToLessonDeck").addEventListener("click", () => {
        state.flashDeckMode = "lesson";
        initFlashDeck();
        renderFlashcards();
      });
      scheduleUiTranslation();
      return;
    }
    const direction = word._direction || (word._direction = flashDirectionFor(word));
    const front = direction === "ko-vi" ? word.word : meaningFor(word);
    const frontClass = direction === "ko-vi" ? "flash-main ko" : "flash-meaning";
    const note = progress.flashNotes?.[word.id] || "";
    $("#view-flashcards").innerHTML = `
      <div class="study-shell">
        <div class="page-heading">
          <div><h1>Flashcard</h1><p>Lật thẻ, tự đánh giá và để lịch ôn lặp ngắt quãng lo phần còn lại.</p></div>
          <div class="heading-actions">
            <select class="field" id="flashLesson" style="width:auto">${lessonOptions(state.flashLesson)}</select>
            <select class="field" id="flashDirection" style="width:auto">
              <option value="both" ${state.flashDirection === "both" ? "selected" : ""}>Hai chiều</option>
              <option value="ko-vi" ${state.flashDirection === "ko-vi" ? "selected" : ""}>Hàn → Việt</option>
              <option value="vi-ko" ${state.flashDirection === "vi-ko" ? "selected" : ""}>Việt → Hàn</option>
            </select>
          </div>
        </div>
        <div class="flash-deck-tabs">
          <button class="${state.flashDeckMode === "lesson" ? "active" : ""}" data-flash-deck="lesson" type="button">Tất cả từ trong bài <span>${lessonWords(state.flashLesson).length}</span></button>
          <button class="${state.flashDeckMode === "again" ? "active" : ""}" data-flash-deck="again" type="button">Ôn từ chưa thuộc <span>${againCount}</span></button>
          <button class="${state.flashDeckMode === "hard" ? "active" : ""}" data-flash-deck="hard" type="button">Ôn từ khó <span>${hardCount}</span></button>
        </div>
        <div class="study-progress">
          <span>Thẻ ${state.flashIndex + 1} / ${state.flashDeck.length}</span>
          <span>${esc(deckLabel)}</span>
        </div>
        <div class="flashcard-stage">
          <div class="flashcard ${state.flashFlipped ? "flipped" : ""}" id="flashcard" role="button" tabindex="0" aria-label="Lật thẻ" aria-pressed="${state.flashFlipped}">
            <span class="flash-face flash-front">
              <span class="${frontClass}">${esc(front)}</span>
              ${direction === "ko-vi" ? `<span class="romanization">${esc(word.romanization)}</span>` : ""}
              <span class="muted" style="margin-top:28px">Chạm để lật</span>
            </span>
            <span class="flash-face flash-back">
              ${meaningMarkup(word)}
              <span class="flash-main ko" style="font-size:44px">${esc(word.word)}</span>
              <span class="romanization">${esc(word.romanization)}</span>
              <span class="flash-example">
                <span class="flash-example-line">
                  <span class="ko">${esc(word.example)}</span>
                  <button class="example-speak" id="speakFlashExample" type="button" aria-label="Nghe câu ví dụ">${icon("volume")}</button>
                </span>
                <span class="muted">${esc(exampleTranslationFor(word))}</span>
                ${word.grammar_point ? `<span class="grammar-chip">Ngữ pháp · ${esc(word.grammar_point)}</span>` : ""}
              </span>
            </span>
          </div>
        </div>
        <div class="control-row" style="justify-content:center;margin-bottom:14px">
          <button class="button" id="speakFlash" type="button">${icon("volume")} Nghe từ</button>
          <button class="button" id="shuffleFlash" type="button">${icon("refresh")} Xáo trộn lại</button>
        </div>
        <div class="rating-row" ${state.flashFlipped ? "" : 'style="visibility:hidden"'}>
          <button class="button again" data-rate="again" type="button">Chưa nhớ</button>
          <button class="button hard" data-rate="hard" type="button">Khó</button>
          <button class="button primary" data-rate="known" type="button">Đã nhớ</button>
        </div>
        <section class="word-note-panel">
          <div class="word-note-head">
            <div><strong>Ghi chú của tôi</strong><small>Đã tự động lưu</small></div>
            <button class="button subtle danger-text" id="deleteFlashNote" type="button" ${note ? "" : "disabled"}>${icon("trash")} Xóa ghi chú</button>
          </div>
          <textarea class="field" id="flashNote" placeholder="Ghi điều bạn cần nhớ về từ này…">${esc(note)}</textarea>
        </section>
      </div>
    `;
    $("#flashLesson").addEventListener("change", event => {
      state.flashLesson = Number(event.target.value);
      state.flashDeckMode = "lesson";
      setLastLesson(state.flashLesson);
      initFlashDeck();
      renderFlashcards();
    });
    $("#flashDirection").addEventListener("change", event => {
      state.flashDirection = event.target.value;
      initFlashDeck();
      renderFlashcards();
    });
    $$("[data-flash-deck]", $("#view-flashcards")).forEach(button => button.addEventListener("click", () => {
      state.flashDeckMode = button.dataset.flashDeck;
      initFlashDeck();
      renderFlashcards();
    }));
    $("#flashcard").addEventListener("click", event => {
      if (event.target.closest("#speakFlashExample")) return;
      state.flashFlipped = !state.flashFlipped;
      renderFlashcards();
    });
    $("#flashcard").addEventListener("keydown", event => {
      if (event.target.closest("#speakFlashExample")) return;
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      state.flashFlipped = !state.flashFlipped;
      renderFlashcards();
    });
    $("#speakFlash").addEventListener("click", () => speak(word.word));
    $("#speakFlashExample")?.addEventListener("click", event => {
      event.stopPropagation();
      speak(word.example);
    });
    $("#shuffleFlash").addEventListener("click", () => { initFlashDeck(); renderFlashcards(); });
    $$("[data-rate]", $("#view-flashcards")).forEach(button => button.addEventListener("click", () => rateCard(word, button.dataset.rate)));
    $("#flashNote").addEventListener("input", event => {
      const value = event.target.value;
      if (value) progress.flashNotes[word.id] = value;
      else delete progress.flashNotes[word.id];
      persistProfile();
      $("#deleteFlashNote").disabled = !value;
    });
    $("#deleteFlashNote").addEventListener("click", () => {
      delete progress.flashNotes[word.id];
      persistProfile();
      renderFlashcards();
      toast(language() === "en" ? "Note deleted." : language() === "zh" ? "笔记已删除。" : "Đã xóa ghi chú.");
    });
    scheduleUiTranslation();
  }

  function rateCard(word, rating) {
    const progress = profileProgress();
    const previous = srsEntry(word.id);
    const next = { ...previous, reviews: (previous.reviews || 0) + 1, last: today() };
    if (rating === "again") {
      next.level = Math.max(0, (previous.level || 0) - 1);
      next.interval = 0;
      next.due = today();
      next.lapses = (previous.lapses || 0) + 1;
      progress.reviewAgain[word.id] = today();
    } else if (rating === "hard") {
      next.level = Math.max(1, previous.level || 1);
      next.interval = Math.max(2, Math.round((previous.interval || 1) * 1.6));
      next.due = addDays(next.interval);
      progress.reviewHard[word.id] = today();
    } else {
      next.level = Math.min(5, (previous.level || 0) + 1);
      const schedule = [1, 3, 7, 16, 35, 70];
      next.interval = schedule[next.level] || 70;
      next.due = addDays(next.interval);
      delete progress.reviewAgain[word.id];
      delete progress.reviewHard[word.id];
    }
    progress.srs[word.id] = next;
    persistProfile();
    if (rating === "known" && state.flashDeckMode !== "lesson") {
      state.flashDeck = state.flashDeck.filter(item => item.id !== word.id);
      state.flashIndex = state.flashDeck.length ? state.flashIndex % state.flashDeck.length : 0;
    } else {
      state.flashIndex = (state.flashIndex + 1) % state.flashDeck.length;
    }
    state.flashFlipped = false;
    const upcoming = state.flashDeck[state.flashIndex];
    if (upcoming) delete upcoming._direction;
    renderFlashcards();
  }

  function addDays(days) {
    const date = new Date();
    date.setDate(date.getDate() + Number(days));
    return date.toISOString().slice(0, 10);
  }

  function startQuiz() {
    const words = shuffle(lessonWords(state.quizLesson));
    state.quiz = { words, index: 0, score: 0, answered: false, selected: null, startedAt: Date.now(), mistakes: [] };
    renderQuiz();
  }

  function quizQuestion() {
    const quiz = state.quiz;
    const word = quiz.words[quiz.index];
    const direction = state.quizDirection === "both" ? (quiz.index % 2 ? "vi-ko" : "ko-vi") : state.quizDirection;
    const pool = lessonWords(state.quizLesson).filter(item => item.id !== word.id);
    const correct = direction === "ko-vi" ? meaningFor(word) : word.word;
    const distractors = shuffle(pool).map(item => direction === "ko-vi" ? meaningFor(item) : item.word)
      .filter((value, index, array) => value !== correct && array.indexOf(value) === index).slice(0, 3);
    return { word, direction, correct, options: shuffle([correct, ...distractors]) };
  }

  function renderQuiz() {
    if (!state.quiz) {
      $("#view-quiz").innerHTML = `
        <div class="study-shell">
          <div class="page-heading"><div><h1>Trắc nghiệm</h1><p>Mỗi lượt bao gồm toàn bộ từ của chủ đề đang chọn.</p></div></div>
          <section class="panel quiz-box">
            <div class="control-row">
              <label class="control-group"><span class="field-label">Bài / chủ đề</span><select class="field" id="quizLesson">${lessonOptions(state.quizLesson)}</select></label>
              <label class="control-group"><span class="field-label">Chiều hỏi</span><select class="field" id="quizDirection">
                <option value="both" ${state.quizDirection === "both" ? "selected" : ""}>Xen kẽ hai chiều</option>
                <option value="ko-vi" ${state.quizDirection === "ko-vi" ? "selected" : ""}>Hàn → Việt</option>
                <option value="vi-ko" ${state.quizDirection === "vi-ko" ? "selected" : ""}>Việt → Hàn</option>
              </select></label>
            </div>
            <div class="open-section" style="text-align:center">
              <p><strong>${lessonWords(state.quizLesson).length}</strong> câu · xáo trộn tự động · lưu điểm vào tiến độ</p>
              <button class="button primary" id="startQuiz" type="button">${icon("play")} Bắt đầu</button>
            </div>
          </section>
        </div>
      `;
      $("#quizLesson").addEventListener("change", event => { state.quizLesson = Number(event.target.value); setLastLesson(state.quizLesson); renderQuiz(); });
      $("#quizDirection").addEventListener("change", event => { state.quizDirection = event.target.value; });
      $("#startQuiz").addEventListener("click", startQuiz);
      return;
    }
    const quiz = state.quiz;
    if (quiz.index >= quiz.words.length) return renderQuizResult();
    if (!quiz.current || quiz.currentIndex !== quiz.index) {
      quiz.current = quizQuestion();
      quiz.currentIndex = quiz.index;
    }
    const question = quiz.current;
    const percent = Math.round((quiz.index / quiz.words.length) * 100);
    $("#view-quiz").innerHTML = `
      <div class="study-shell">
        <div class="study-progress"><span>Câu ${quiz.index + 1} / ${quiz.words.length}</span><span>Đúng ${quiz.score}</span></div>
        <div class="progress-track" style="margin:10px 0 22px"><span style="width:${percent}%"></span></div>
        <section class="panel quiz-box">
          <div class="quiz-prompt">
            <span class="muted">${question.direction === "ko-vi" ? "Chọn nghĩa đúng" : "Chọn từ tiếng Hàn đúng"}</span>
            ${question.direction === "ko-vi"
              ? `<span class="ko">${esc(question.word.word)}</span><span class="romanization">${esc(question.word.romanization)}</span>`
              : `<span class="meaning-prompt">${esc(meaningFor(question.word))}</span>`}
          </div>
          <div class="option-grid">
            ${question.options.map(option => {
              let status = "";
              if (quiz.answered && option === question.correct) status = "correct";
              else if (quiz.answered && option === quiz.selected) status = "wrong";
              return `<button class="quiz-option ${status} ${question.direction === "vi-ko" ? "ko" : ""}" type="button" data-option="${esc(option)}" ${quiz.answered ? "disabled" : ""}>${esc(option)}</button>`;
            }).join("")}
          </div>
          ${quiz.answered ? `
            <div class="feedback-box ${quiz.selected === question.correct ? "success" : "error"}">
              ${quiz.selected === question.correct ? "Chính xác." : `Đáp án đúng: ${esc(question.correct)}`}
            </div>
            <div style="text-align:right;margin-top:16px"><button class="button primary" id="nextQuiz" type="button">${quiz.index + 1 === quiz.words.length ? "Xem kết quả" : "Câu tiếp theo"} ${icon("arrow")}</button></div>
          ` : ""}
        </section>
      </div>
    `;
    $$("[data-option]", $("#view-quiz")).forEach(button => button.addEventListener("click", () => answerQuiz(button.dataset.option)));
    $("#nextQuiz")?.addEventListener("click", () => {
      quiz.index += 1;
      quiz.answered = false;
      quiz.selected = null;
      quiz.current = null;
      renderQuiz();
    });
  }

  function answerQuiz(option) {
    const quiz = state.quiz;
    if (!quiz || quiz.answered) return;
    quiz.answered = true;
    quiz.selected = option;
    if (option === quiz.current.correct) {
      quiz.score += 1;
    } else {
      quiz.mistakes.push(quiz.current.word.id);
    }
    renderQuiz();
  }

  function renderQuizResult() {
    const quiz = state.quiz;
    const percent = Math.round(quiz.score / quiz.words.length * 100);
    const history = {
      id: uid(),
      date: new Date().toISOString(),
      lesson: state.quizLesson,
      score: quiz.score,
      total: quiz.words.length,
      percent,
      mistakes: quiz.mistakes
    };
    if (!quiz.saved) {
      profileProgress().quizHistory.unshift(history);
      profileProgress().quizHistory = profileProgress().quizHistory.slice(0, 30);
      persistProfile();
      quiz.saved = true;
    }
    $("#view-quiz").innerHTML = `
      <div class="study-shell">
        <section class="panel quiz-box" style="text-align:center">
          <p class="muted">Kết quả bài ${state.quizLesson}</p>
          <div class="result-score">${percent}%</div>
          <h1>${quiz.score} / ${quiz.words.length} câu đúng</h1>
          <p class="muted">${percent >= 85 ? "Rất tốt. Hãy duy trì nhịp học này." : "Những từ sai đã được đưa vào danh sách cần ôn."}</p>
          <div class="control-row" style="justify-content:center;margin-top:22px">
            <button class="button" id="backQuiz" type="button">Chọn bài khác</button>
            <button class="button primary" id="retryQuiz" type="button">${icon("refresh")} Làm lại</button>
          </div>
        </section>
      </div>
    `;
    $("#backQuiz").addEventListener("click", () => { state.quiz = null; renderQuiz(); });
    $("#retryQuiz").addEventListener("click", startQuiz);
  }

  function renderListening() {
    const item = LISTEN_DATA.find(entry => Number(entry.lesson) === Number(state.listeningLesson)) || LISTEN_DATA[0];
    const files = state.audioFiles.get(Number(item.lesson)) || [];
    const selectedAnswer = state.listeningAnswer;
    $("#view-listening").innerHTML = `
      <div class="page-heading">
        <div><h1>Luyện nghe · Bài ${item.lesson}</h1><p>${esc(localizedTopic(item.lesson))} · ${language() === "en" ? "choose answers, practise dictation, and reveal the transcript after completing the exercises." : language() === "zh" ? "选择答案、练习听写，并在完成后查看原文。" : "chọn đáp án, nghe chép và chỉ xem lời thoại sau khi hoàn thành."}</p></div>
        <div class="heading-actions">
          <select class="field" id="listeningLesson" style="width:auto">${lessonOptions(state.listeningLesson)}</select>
          <a class="button" href="${OFFICIAL_AUDIO_PAGE}" target="_blank" rel="noopener">${icon("download")} Âm thanh chính thức</a>
        </div>
      </div>
      <div class="listening-layout">
        <div>
          <section class="panel audio-stage paused" id="audioStage">
            <p class="small" style="margin:0;color:rgba(255,255,255,.68)">${language() === "zh" ? `第${item.lesson}课` : language() === "en" ? `Lesson ${item.lesson}` : `Bài ${item.lesson}`} · ${esc(localizedTopic(item.lesson))}</p>
            <h2>Nghe và bắt ý chính</h2>
            <div class="wave-bars" aria-hidden="true">
              ${Array.from({ length: 54 }, (_, index) => `<i style="--h:${28 + (index * 37 % 66)}%;--d:${-(index % 9) * .12}s"></i>`).join("")}
            </div>
            ${files.length ? `
              <audio id="lessonAudio" controls preload="metadata" src="${esc(files[0].url)}" style="width:100%;margin-bottom:16px"></audio>
              <div class="audio-file-list">
                ${files.map((file, index) => `<button class="audio-file-row" type="button" data-audio-index="${index}">${icon("play")}<span>${esc(file.name)}</span></button>`).join("")}
              </div>
            ` : `
              <p style="color:rgba(255,255,255,.72)">Chưa chọn tệp MP3 chính thức. Bạn vẫn có thể nghe bản luyện bằng giọng ko-KR của trình duyệt.</p>
            `}
            <div class="audio-actions">
              <button class="button" id="playListeningTts" type="button">${icon("volume")} Phát bản luyện ko-KR</button>
              <label class="button" for="listenFiles">${icon("upload")} Chọn MP3 của bài</label>
              <input id="listenFiles" type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg" multiple hidden>
            </div>
          </section>
          <div class="source-note">
            ${language() === "en"
              ? "Official source: “세종한국어 익힘책 1A”, Nuri King Sejong Institute. If embedded playback is blocked, download the official audio and select the lesson files here. Files remain only for this browser session."
              : language() === "zh"
                ? "官方来源：《세종한국어 익힘책 1A》，Nuri King Sejong Institute。如无法嵌入播放，请从官方页面下载音频，并在此选择本课文件。文件仅保留在当前浏览器会话中。"
                : "Nguồn chính thức: “세종한국어 익힘책 1A”, Nuri King Sejong Institute. Do máy chủ có thể chặn phát nhúng, hãy tải bộ âm thanh từ trang chính thức rồi chọn toàn bộ tệp của bài tại đây. Tệp chỉ tồn tại trong phiên mở trang."}
            <a href="${OFFICIAL_EBOOK}" target="_blank" rel="noopener">Mở sách điện tử Nuri</a>.
          </div>
        </div>
        <div class="exercise-stack">
          <section class="panel panel-body">
            <p class="small muted">1 · Nghe chọn đáp án</p>
            <div class="exercise-question">${esc(item.question)}</div>
            <p class="muted">${esc(language() === "vi" ? item.questionVi : (item[`question_${language()}`] || item.questionVi))}</p>
            <div style="display:grid;gap:8px">
              ${item.options.map((option, index) => {
                let status = "";
                if (state.listeningChecked && index === item.answer) status = "correct";
                else if (state.listeningChecked && index === selectedAnswer) status = "wrong";
                return `<button class="quiz-option ${status} ko" type="button" data-listen-option="${index}" ${state.listeningChecked ? "disabled" : ""}>${esc(option)}</button>`;
              }).join("")}
            </div>
            <button class="button primary wide" id="checkListening" type="button" ${selectedAnswer === null || state.listeningChecked ? "disabled" : ""}>Nộp đáp án</button>
          </section>
          <section class="panel panel-body">
            <p class="small muted">2 · Nghe chép chính tả</p>
            <p class="exercise-question">${esc(item.dictation)}</p>
            <input class="field ko" id="dictationInput" placeholder="Nhập phần còn thiếu bằng tiếng Hàn">
            <button class="button wide" id="checkDictation" type="button">Kiểm tra chính tả</button>
            <div id="dictationFeedback"></div>
          </section>
          <section class="panel panel-body">
            <button class="button wide" id="toggleTranscript" type="button">${state.listeningTranscript ? "Ẩn lời thoại" : "Xem lời thoại và nghĩa"}</button>
            ${state.listeningTranscript ? `
              <div class="transcript-box">
                <p class="ko" style="font-size:18px">${esc(item.transcript)}</p>
                <p class="muted">${esc(language() === "vi" ? item.translation : (item[`translation_${language()}`] || item.translation))}</p>
              </div>
            ` : ""}
          </section>
        </div>
      </div>
    `;
    $("#listeningLesson").addEventListener("change", event => {
      state.listeningLesson = Number(event.target.value);
      state.listeningAnswer = null;
      state.listeningChecked = false;
      state.listeningTranscript = false;
      setLastLesson(state.listeningLesson);
      renderListening();
    });
    $("#playListeningTts").addEventListener("click", () => speak(item.transcript));
    $("#listenFiles").addEventListener("change", event => addAudioFiles(item.lesson, [...event.target.files]));
    $$("[data-audio-index]", $("#view-listening")).forEach(button => button.addEventListener("click", () => {
      const audio = $("#lessonAudio");
      const file = files[Number(button.dataset.audioIndex)];
      if (!audio || !file) return;
      audio.src = file.url;
      audio.play();
    }));
    const audio = $("#lessonAudio");
    if (audio) {
      audio.addEventListener("play", () => $("#audioStage").classList.remove("paused"));
      audio.addEventListener("pause", () => $("#audioStage").classList.add("paused"));
      audio.addEventListener("ended", () => $("#audioStage").classList.add("paused"));
    }
    $$("[data-listen-option]", $("#view-listening")).forEach(button => button.addEventListener("click", () => {
      state.listeningAnswer = Number(button.dataset.listenOption);
      renderListening();
    }));
    $("#checkListening").addEventListener("click", () => {
      state.listeningChecked = true;
      state.listeningTranscript = true;
      if (state.listeningAnswer === item.answer) {
        profileProgress().listening[item.lesson] = { completed: true, date: today() };
        persistProfile();
      }
      renderListening();
    });
    $("#checkDictation").addEventListener("click", () => {
      const value = $("#dictationInput").value;
      const correct = normalize(value) === normalize(item.dictationAnswer);
      $("#dictationFeedback").innerHTML = `<div class="feedback-box ${correct ? "success" : "error"}">${correct ? "Chính xác." : `Đáp án: ${esc(item.dictationAnswer)}`}</div>`;
      if (correct) {
        profileProgress().listening[item.lesson] = { completed: true, date: today(), dictation: true };
        persistProfile();
      }
    });
    $("#toggleTranscript").addEventListener("click", () => { state.listeningTranscript = !state.listeningTranscript; renderListening(); });
  }

  function addAudioFiles(lesson, files) {
    if (!files.length) return;
    const previous = state.audioFiles.get(Number(lesson)) || [];
    const next = files.map(file => ({ name: file.name, url: URL.createObjectURL(file), type: file.type }));
    state.audioFiles.set(Number(lesson), [...previous, ...next]);
    toast(`Đã thêm ${files.length} tệp nghe cho bài ${lesson}.`);
    renderListening();
  }

  function currentShadow() {
    const lesson = SHADOW_DATA.find(entry => Number(entry.lesson) === Number(state.shadowLesson)) || SHADOW_DATA[0];
    return { lesson, passage: lesson[state.shadowMode] };
  }

  function renderShadowing() {
    const { lesson, passage } = currentShadow();
    state.shadowSentence = clamp(state.shadowSentence, 0, passage.sentences.length - 1);
    const selected = passage.sentences[state.shadowSentence];
    const recordKey = `${lesson.lesson}-${state.shadowMode}-${state.shadowSentence}`;
    const recording = state.recordings.get(recordKey);
    const recognized = state.recognized.get(recordKey);
    $("#view-shadowing").innerHTML = `
      <div class="page-heading">
        <div><h1>Shadowing · ${language() === "zh" ? `第${lesson.lesson}课` : language() === "en" ? `Lesson ${lesson.lesson}` : `Bài ${lesson.lesson}`}</h1><p>${esc(localizedTopic(lesson.lesson))} · ${language() === "en" ? "listen, imitate, record, and practise sentence by sentence." : language() === "zh" ? "逐句听、模仿、录音和练习。" : "nghe, bắt chước, ghi âm và kiểm tra từng câu."}</p></div>
        <div class="heading-actions"><select class="field" id="shadowLesson" style="width:auto">${lessonOptions(state.shadowLesson)}</select></div>
      </div>
      <div class="segmented" style="margin-bottom:16px">
        <button type="button" data-shadow-mode="book" class="${state.shadowMode === "book" ? "active" : ""}">Trích từ Sejong 1</button>
        <button type="button" data-shadow-mode="original" class="${state.shadowMode === "original" ? "active" : ""}">Đoạn luyện thêm</button>
      </div>
      <div class="shadow-toolbar">
        <button class="button primary" id="playPassage" type="button">${icon("play")} Nghe toàn đoạn</button>
        <button class="button" id="repeatSentence" type="button">${icon("refresh")} Lặp câu đang chọn</button>
        <label class="small">Tốc độ
          <select class="field" id="shadowRate" style="width:92px;min-height:36px;padding-block:4px">
            ${[.6,.75,.9,1,1.1].map(rate => `<option value="${rate}" ${Number(state.profile.settings.rate) === rate ? "selected" : ""}>${rate}x</option>`).join("")}
          </select>
        </label>
        <span class="muted small">${state.shadowMode === "book"
          ? (language() === "en" ? `Source: Sejong1.pdf · page ${passage.sourcePage}` : language() === "zh" ? `来源：Sejong1.pdf · 第${passage.sourcePage}页` : `Nguồn: Sejong1.pdf · trang ${passage.sourcePage}`)
          : (language() === "en" ? "Original practice based on the 1A topic" : language() === "zh" ? "根据1A主题编写的补充内容" : "Nội dung mới theo chủ đề 1A")}</span>
      </div>
      <div class="shadow-layout">
        <section class="panel sentence-list">
          <div class="panel-header"><h2>${esc(language() === "vi" ? passage.title : state.shadowMode === "book" ? (language() === "zh" ? `世宗1教材节选 · ${localizedTopic(lesson.lesson)}` : `Sejong 1 excerpt · ${localizedTopic(lesson.lesson)}`) : (language() === "zh" ? `补充练习 · ${localizedTopic(lesson.lesson)}` : `Extra practice · ${localizedTopic(lesson.lesson)}`))}</h2><span class="muted">${passage.sentences.length} câu</span></div>
          ${passage.sentences.map((sentence, index) => {
            const key = `${lesson.lesson}-${state.shadowMode}-${index}`;
            const done = Boolean(profileProgress().shadow[key]);
            return `
              <article class="sentence-row ${index === state.shadowSentence ? "selected" : ""}" data-sentence="${index}">
                <div class="sentence-head">
                  <span class="sentence-number ${done ? "done" : ""}">${done ? "✓" : index + 1}</span>
                  <div>
                    <p class="sentence-ko">${esc(sentence.ko)}</p>
                    <p class="sentence-vi">${esc(language() === "vi" ? sentence.vi : (sentence[language()] || sentence.vi))}</p>
                  </div>
                  <button class="speak-mini" type="button" data-shadow-speak="${index}" aria-label="Nghe câu ${index + 1}">${icon("play")}</button>
                </div>
                <details class="grammar-list" ${index === state.shadowSentence ? "open" : ""}>
                  <summary>Phân tích ngữ pháp</summary>
                  <ul>${sentence.grammar.map(item => `<li>${esc(item)}</li>`).join("")}</ul>
                </details>
              </article>
            `;
          }).join("")}
        </section>
        <aside class="panel record-panel">
          <p class="small muted">${language() === "en" ? "Practice sentence" : language() === "zh" ? "练习句子" : "Luyện câu"} ${state.shadowSentence + 1}/${passage.sentences.length}</p>
          <div class="record-target">${esc(selected.ko)}</div>
          <p class="sentence-vi">${esc(language() === "vi" ? selected.vi : (selected[language()] || selected.vi))}</p>
          <button class="record-orb" id="recordButton" type="button" aria-label="Bắt đầu ghi âm">${icon("mic")}</button>
          <p class="record-status" id="recordStatus">Nhấn để ghi âm. Trình duyệt sẽ xin quyền micro.</p>
          ${recording ? `<audio controls src="${esc(recording.url)}" style="width:100%"></audio>` : ""}
          ${recognized ? `
            <div class="score-card">
              <span class="small muted">Điểm phát âm tự động</span>
              <div class="score-value">${recognized.score}/100</div>
              <span class="small muted">Nội dung nhận dạng</span>
              <p class="ko">${esc(recognized.text || "Không nhận dạng được.")}</p>
            </div>
          ` : `
            <div class="score-card"><span class="small muted">Chấm phát âm dùng nhận dạng giọng nói của trình duyệt và hoạt động tốt nhất trên Chrome.</span></div>
          `}
          <button class="button primary wide" id="completeSentence" type="button">${profileProgress().shadow[recordKey] ? "✓ Đã hoàn thành" : "Đánh dấu hoàn thành"}</button>
        </aside>
      </div>
    `;
    $("#shadowLesson").addEventListener("change", event => {
      state.shadowLesson = Number(event.target.value);
      state.shadowSentence = 0;
      setLastLesson(state.shadowLesson);
      renderShadowing();
    });
    $$("[data-shadow-mode]", $("#view-shadowing")).forEach(button => button.addEventListener("click", () => {
      state.shadowMode = button.dataset.shadowMode;
      state.shadowSentence = 0;
      renderShadowing();
    }));
    $$("[data-sentence]", $("#view-shadowing")).forEach(row => row.addEventListener("click", event => {
      if (event.target.closest("button") || event.target.closest("summary")) return;
      state.shadowSentence = Number(row.dataset.sentence);
      renderShadowing();
    }));
    $$("[data-shadow-speak]", $("#view-shadowing")).forEach(button => button.addEventListener("click", event => {
      event.stopPropagation();
      speak(passage.sentences[Number(button.dataset.shadowSpeak)].ko);
    }));
    $("#playPassage").addEventListener("click", () => speakSequence(passage.sentences.map(sentence => sentence.ko)));
    $("#repeatSentence").addEventListener("click", () => speak(selected.ko));
    $("#shadowRate").addEventListener("change", event => {
      state.profile.settings.rate = Number(event.target.value);
      persistProfile();
      speak(selected.ko);
    });
    $("#recordButton").addEventListener("click", () => toggleRecording(recordKey, selected.ko));
    $("#completeSentence").addEventListener("click", () => {
      profileProgress().shadow[recordKey] = !profileProgress().shadow[recordKey];
      persistProfile();
      if (state.shadowSentence < passage.sentences.length - 1) state.shadowSentence += 1;
      renderShadowing();
    });
  }

  async function toggleRecording(key, targetText) {
    if (state.mediaRecorder?.state === "recording") {
      state.mediaRecorder.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return toast("Trình duyệt này chưa hỗ trợ ghi âm.");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.mediaStream = stream;
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      state.mediaRecorder = recorder;
      recorder.addEventListener("dataavailable", event => { if (event.data.size) chunks.push(event.data); });
      recorder.addEventListener("stop", () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        const old = state.recordings.get(key);
        if (old) URL.revokeObjectURL(old.url);
        state.recordings.set(key, { blob, url: URL.createObjectURL(blob) });
        stream.getTracks().forEach(track => track.stop());
        state.mediaStream = null;
        state.mediaRecorder = null;
        if (state.recognition) {
          try { state.recognition.stop(); } catch {}
        }
        renderShadowing();
      });
      startRecognition(key, targetText);
      recorder.start();
      $("#recordButton").classList.add("recording");
      $("#recordButton").innerHTML = '<span style="width:24px;height:24px;background:white;border-radius:3px"></span>';
      $("#recordStatus").textContent = "Đang ghi âm… nhấn lần nữa để dừng.";
    } catch {
      toast("Không thể truy cập micro. Hãy kiểm tra quyền của trình duyệt.");
    }
  }

  function startRecognition(key, targetText) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    try {
      const recognition = new Recognition();
      recognition.lang = "ko-KR";
      recognition.interimResults = true;
      recognition.continuous = true;
      state.recognition = recognition;
      let latest = "";
      recognition.onresult = event => {
        latest = [...event.results].map(result => result[0].transcript).join(" ");
        const score = similarityScore(targetText, latest);
        state.recognized.set(key, { text: latest, score });
        const status = $("#recordStatus");
        if (status) status.textContent = `Đã nhận dạng: ${latest}`;
      };
      recognition.onerror = () => {};
      recognition.start();
    } catch {}
  }

  function similarityScore(target, candidate) {
    const a = normalize(target);
    const b = normalize(candidate);
    if (!a || !b) return 0;
    const rows = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) rows[i][0] = i;
    for (let j = 0; j <= b.length; j++) rows[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
    }
    return clamp(Math.round((1 - rows[a.length][b.length] / Math.max(a.length, b.length)) * 100), 0, 100);
  }

  function currentWritingWord() {
    const words = lessonWords(state.writingLesson);
    state.writingWordIndex = clamp(state.writingWordIndex, 0, Math.max(0, words.length - 1));
    return words[state.writingWordIndex] || state.vocab[0];
  }

  function nextWritingWord() {
    const words = lessonWords(state.writingLesson);
    state.writingWordIndex = (state.writingWordIndex + 1) % words.length;
    state.writingFeedback = null;
    renderWriting();
  }

  const WRITING_REFERENCES = {
    1: {
      text: "안녕하세요? 저는 리에우예요. 저는 베트남 사람이에요. 저는 학생이에요. 제 친구는 선생님이에요. 만나서 반가워요.",
      vi: "Xin chào. Tôi là Liễu. Tôi là người Việt Nam. Tôi là học sinh. Bạn tôi là giáo viên. Rất vui được gặp bạn.",
      grammar: "N은/는 · N이에요/예요"
    },
    2: {
      text: "제 전화번호는 공일공-이삼사오-육칠팔구예요. 이메일 주소는 lieu@example.com이에요. 교실은 이백삼 호예요.",
      vi: "Số điện thoại của tôi là 010-2345-6789. Địa chỉ email là lieu@example.com. Phòng học là phòng 203.",
      grammar: "Số Hán–Hàn · N은/는 N이에요/예요"
    },
    3: {
      text: "제 방에 책상하고 침대가 있어요. 가방은 책상 옆에 있어요. 시계는 책상 위에 있어요.",
      vi: "Trong phòng tôi có bàn và giường. Cặp ở cạnh bàn. Đồng hồ ở trên bàn.",
      grammar: "N에 N이/가 있어요 · 위치에 있어요"
    },
    4: {
      text: "저는 아침에 한국어를 공부해요. 오후에는 친구를 만나요. 저녁에는 음악을 듣고 책을 읽어요.",
      vi: "Buổi sáng tôi học tiếng Hàn. Buổi chiều tôi gặp bạn. Buổi tối tôi nghe nhạc và đọc sách.",
      grammar: "N을/를 V-아요/어요 · N에서 · V-고"
    },
    5: {
      text: "오늘 마트에 가요. 빵하고 우유를 사요. 사과도 사고 싶어요. 사과는 얼마예요?",
      vi: "Hôm nay tôi đi siêu thị. Tôi mua bánh mì và sữa. Tôi cũng muốn mua táo. Táo bao nhiêu tiền?",
      grammar: "N하고 N · N을/를 사요 · 얼마예요?"
    },
    6: {
      text: "사과 다섯 개 주세요. 우유 두 병하고 빵 한 개도 주세요. 모두 얼마예요?",
      vi: "Cho tôi năm quả táo. Cho tôi thêm hai chai sữa và một chiếc bánh. Tất cả bao nhiêu tiền?",
      grammar: "Số thuần Hàn + đơn vị đếm · N 주세요"
    },
    7: {
      text: "월요일 오전 아홉 시에 한국어 수업이 있어요. 오후 세 시에는 도서관에 가요. 저녁 여섯 시에 친구를 만나요.",
      vi: "Thứ Hai lúc 9 giờ sáng tôi có lớp tiếng Hàn. Lúc 3 giờ chiều tôi đi thư viện. Lúc 6 giờ tối tôi gặp bạn.",
      grammar: "요일/시간 + 에 · N이/가 있어요"
    },
    8: {
      text: "오늘 서울 날씨는 맑고 따뜻해요. 바람이 조금 불지만 춥지 않아요. 저는 봄 날씨를 좋아해요.",
      vi: "Hôm nay thời tiết Seoul trong và ấm. Gió thổi nhẹ nhưng không lạnh. Tôi thích thời tiết mùa xuân.",
      grammar: "A-고 · A/V-지만 · A/V-지 않아요"
    },
    9: {
      text: "어제 공원에서 산책했어요. 친구하고 자전거를 탔어요. 저녁에는 집에서 쉬었어요. 정말 재미있었어요.",
      vi: "Hôm qua tôi đi dạo trong công viên. Tôi đạp xe cùng bạn. Buổi tối tôi nghỉ ở nhà. Thật sự rất vui.",
      grammar: "V-았/었어요 · N에서"
    },
    10: {
      text: "이번 주말에는 특별한 약속이 있어요. 토요일에 친구하고 콘서트에 갈 거예요. 같이 사진을 찍고 맛있는 음식을 먹을 거예요.",
      vi: "Cuối tuần này tôi có một cuộc hẹn đặc biệt. Thứ Bảy tôi sẽ đi xem hòa nhạc cùng bạn. Chúng tôi sẽ chụp ảnh và ăn món ngon.",
      grammar: "V-(으)ㄹ 거예요 · V-고"
    }
  };

  const WRITING_GRAMMAR_CHECKS = {
    1: /(?:이에요|예요|아니에요|은|는)/,
    2: /(?:뭐예요|몇|얼마|호예요|층이에요|원이에요)/,
    3: /(?:에\s|에요|있어요|앞에|뒤에|옆에|위에|아래에|안에|밖에)/,
    4: /(?:아요|어요|해요|에서|을|를|고\s)/,
    5: /(?:하고|사요|얼마예요|에서)/,
    6: /(?:주세요|으세요|세요|개|명|마리|잔|병|권)/,
    7: /(?:시에|요일에|월에|일에|시작해요|있어요)/,
    8: /(?:지만|지 않아요|고\s|더워요|추워요|따뜻해요|어때요)/,
    9: /(?:았어요|었어요|했어요|갔어요|에서)/,
    10: /(?:[가-힣]\s거예요|할 거예요|갈까요|고\s)/
  };

  function koreanHasBatchim(value) {
    const characters = [...String(value)].filter(character => character >= "가" && character <= "힣");
    if (!characters.length) return false;
    return (characters[characters.length - 1].charCodeAt(0) - 0xAC00) % 28 !== 0;
  }

  function analyzeWritingLocally(input, lesson) {
    let corrected = String(input || "").normalize("NFC").trim();
    const issues = [];
    const addIssue = (original, suggestion, reason, type = "fix") => {
      if (issues.some(item => item.original === original && item.suggestion === suggestion && item.reason === reason)) return;
      issues.push({ original, suggestion, reason, type });
    };
    const replaceWithIssue = (pattern, replacement, reason) => {
      corrected = corrected.replace(pattern, (...args) => {
        const original = args[0];
        const suggestion = typeof replacement === "function" ? replacement(...args) : replacement;
        if (original !== suggestion) addIssue(original, suggestion, reason);
        return suggestion;
      });
    };

    replaceWithIssue(/\s{2,}/g, " ", "Chỉ nên dùng một khoảng trắng giữa các từ.");
    replaceWithIssue(/안녕\s+하세요/g, "안녕하세요", "안녕하세요 được viết liền.");
    replaceWithIssue(/공부\s+해요/g, "공부해요", "Danh từ 하다 và 해요 được viết liền.");
    replaceWithIssue(/운동\s+해요/g, "운동해요", "Danh từ 하다 và 해요 được viết liền.");
    replaceWithIssue(/요리\s+해요/g, "요리해요", "Danh từ 하다 và 해요 được viết liền.");
    replaceWithIssue(/재미\s+있어요/g, "재미있어요", "재미있어요 là một từ và được viết liền.");
    replaceWithIssue(/할거예요/g, "할 거예요", "Danh từ phụ thuộc 거 được viết cách động từ.");
    replaceWithIssue(/갈거예요/g, "갈 거예요", "Danh từ phụ thuộc 거 được viết cách động từ.");
    replaceWithIssue(/먹을거예요/g, "먹을 거예요", "Danh từ phụ thuộc 거 được viết cách động từ.");
    replaceWithIssue(/볼거예요/g, "볼 거예요", "Danh từ phụ thuộc 거 được viết cách động từ.");
    replaceWithIssue(/([가-힣]+)\s+(은|는|이|가|을|를|에|에서|하고|도)(?=\s|[.,!?]|$)/g,
      (_match, noun, suffix) => `${noun}${suffix}`,
      "Tiểu từ phải viết liền với danh từ đứng trước."
    );
    replaceWithIssue(/([가-힣]+)이예요/g, (_match, noun) => `${noun}이에요`, "Dạng đúng là 이에요, không phải 이예요.");

    corrected = corrected.replace(/([가-힣]{1,15})(은|는|이|가|을|를)(?=\s|[.,!?]|$)/g, (match, noun, suffix) => {
      const pair = suffix === "은" || suffix === "는"
        ? ["은", "는"]
        : suffix === "이" || suffix === "가"
          ? ["이", "가"]
          : ["을", "를"];
      const expected = koreanHasBatchim(noun) ? pair[0] : pair[1];
      if (suffix !== expected) {
        const suggestion = `${noun}${expected}`;
        addIssue(match, suggestion, `Danh từ “${noun}” cần đi với tiểu từ ${expected}.`);
        return suggestion;
      }
      return match;
    });

    corrected = corrected.replace(/([가-힣]{1,15})(이에요|예요)(?=\s|[.,!?]|$)/g, (match, noun, suffix) => {
      const expected = koreanHasBatchim(noun) ? "이에요" : "예요";
      if (suffix !== expected) {
        const suggestion = `${noun}${expected}`;
        addIssue(match, suggestion, `Sau “${noun}” nên dùng ${expected}.`);
        return suggestion;
      }
      return match;
    });

    if (!/[가-힣]/.test(corrected)) {
      addIssue("Bài viết", "Hãy viết ít nhất một câu bằng tiếng Hàn.", "Chưa tìm thấy ký tự Hangul.", "advice");
    }
    if (corrected && !/[.!?]$/.test(corrected)) {
      addIssue(corrected.slice(-18), `${corrected.slice(-18)}.`, "Nên kết thúc đoạn bằng dấu câu.");
      corrected += ".";
    }
    const sentences = corrected.split(/[.!?]+/).map(value => value.trim()).filter(Boolean);
    const informal = sentences.filter(sentence => /[가-힣]$/.test(sentence) && !/(?:요|니다|니까|세요|까요)$/.test(sentence));
    if (informal.length) {
      addIssue(informal[0], "Kiểm tra lại đuôi câu -요 hoặc -ㅂ/습니다.", "Bài sơ cấp nên thống nhất đuôi câu lịch sự.", "advice");
    }

    const check = WRITING_GRAMMAR_CHECKS[lesson];
    const reference = WRITING_REFERENCES[lesson];
    if (check && !check.test(corrected)) {
      addIssue("Điểm ngữ pháp của bài", reference.grammar, "Bài viết chưa thể hiện rõ mẫu ngữ pháp trọng tâm.", "advice");
    }

    const usedWords = lessonWords(lesson)
      .filter(item => {
        const token = item.word.split(/[\/\s(]/)[0];
        const variants = [token];
        if (token.endsWith("다")) variants.push(token.slice(0, -1));
        return variants.some(value => value.length > 1 && corrected.includes(value));
      })
      .map(item => item.word);
    const uniqueUsedWords = [...new Set(usedWords)];
    if (uniqueUsedWords.length < 3) {
      addIssue(
        `${uniqueUsedWords.length} từ của bài`,
        "Hãy dùng ít nhất 3 từ vựng trong chủ đề.",
        "Dùng từ của bài giúp đoạn văn bám sát mục tiêu luyện tập.",
        "advice"
      );
    }

    const fixCount = issues.filter(item => item.type === "fix").length;
    const adviceCount = issues.length - fixCount;
    const score = clamp(100 - fixCount * 10 - adviceCount * 6, 35, 100);
    return { lesson, corrected, issues, score, usedWords: uniqueUsedWords, reference };
  }

  async function copyWritingText(value) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    toast(language() === "en" ? "Reference answer copied." : language() === "zh" ? "参考答案已复制。" : "Đã sao chép đáp án tham khảo.");
  }

  function writingReviewMarkup(review) {
    const noIssues = !review.issues.length;
    return `
      <section class="smart-review" aria-live="polite">
        <div class="smart-review-header">
          <div>
            <h3>Trợ lý sửa bài trên thiết bị</h3>
            <span class="muted small">${noIssues ? "Chưa phát hiện lỗi cơ bản." : `${review.issues.length} điểm cần xem lại.`}</span>
          </div>
          <span class="review-score">${review.score}/100</span>
        </div>
        <div class="smart-review-grid">
          <div class="review-card">
            <h4>Gợi ý sửa</h4>
            ${review.issues.length ? `
              <div class="issue-list">
                ${review.issues.map(item => `
                  <div class="issue-item">
                    <strong>${esc(item.reason)}</strong>
                    <span>${esc(item.original)} → ${esc(item.suggestion)}</span>
                  </div>
                `).join("")}
              </div>
            ` : '<p class="muted">Cấu trúc, khoảng cách và đuôi câu cơ bản đều ổn.</p>'}
            <h4 style="margin-top:16px">Bản đã chỉnh tự động</h4>
            <p class="corrected-writing ko">${esc(review.corrected)}</p>
            <button class="button wide" id="useCorrectedWriting" type="button">Dùng bản đã sửa</button>
          </div>
          <div class="review-card">
            <h4>Đáp án tham khảo · Bài ${review.lesson}</h4>
            <span class="grammar-chip" style="margin:0">${esc(review.reference.grammar)}</span>
            <p class="reference-writing ko">${esc(review.reference.text)}</p>
            <p class="muted small">${esc(review.reference.vi)}</p>
            <div class="control-row">
              <button class="button" id="listenWritingReference" type="button">${icon("volume")} Nghe đáp án</button>
              <button class="button" id="copyWritingReference" type="button">${icon("cards")} Sao chép</button>
            </div>
          </div>
        </div>
        <p class="privacy-note">${icon("check")}<span>Phân tích chạy hoàn toàn trong trình duyệt, không gửi bài viết ra ngoài. Đây là gợi ý theo quy tắc Sejong 1A, không phải phản hồi trực tiếp từ ChatGPT.</span></p>
      </section>
    `;
  }

  function renderWriting() {
    const word = currentWritingWord();
    const words = lessonWords(state.writingLesson);
    const exerciseNumber = state.writingWordIndex + 1;
    const freePrompt = language() === "en"
      ? `Write 3–5 short Korean sentences about “${localizedTopic(state.writingLesson)}”.`
      : language() === "zh"
        ? `请围绕“${localizedTopic(state.writingLesson)}”写3–5句简短的韩语句子。`
        : `Hãy viết 3–5 câu tiếng Hàn ngắn về chủ đề “${localizedTopic(state.writingLesson)}”.`;
    const savedFree = profileProgress().writing[state.writingLesson]?.text || "";
    const savedNote = profileProgress().writingNotes?.[state.writingLesson] || "";
    const reference = WRITING_REFERENCES[state.writingLesson];
    $("#view-writing").innerHTML = `
      <div class="page-heading">
        <div><h1>Luyện viết</h1><p>Viết từ theo nghĩa, nghe chép chính tả và tự tạo câu ngắn theo chủ đề.</p></div>
        <div class="heading-actions"><select class="field" id="writingLesson" style="width:auto">${lessonOptions(state.writingLesson)}</select></div>
      </div>
      <div class="writing-tabs">
        ${[["vocab","Viết từ"],["dictation","Nghe chép"],["free","Viết theo chủ đề"]].map(([mode,label]) => `<button type="button" data-writing-mode="${mode}" class="${state.writingMode === mode ? "active" : ""}">${label}</button>`).join("")}
      </div>
      <section class="panel writing-stage">
        ${state.writingMode === "vocab" ? `
          <div class="writing-prompt">
            <span class="exercise-number">${language() === "zh" ? `第 ${exerciseNumber} / ${words.length} 题` : language() === "en" ? `Question ${exerciseNumber} / ${words.length}` : `Câu ${exerciseNumber} / ${words.length}`}</span>
            <p class="muted">Viết từ tiếng Hàn có nghĩa</p>
            <h2>${esc(meaningFor(word))}</h2>
          </div>
          <input class="field writing-input" id="writingInput" lang="ko" autocomplete="off" placeholder="Nhập tiếng Hàn">
          <div class="control-row" style="justify-content:center;margin-top:16px">
            <button class="button" id="revealWriting" type="button">Xem đáp án</button>
            <button class="button primary" id="checkWriting" type="button">Kiểm tra</button>
          </div>
        ` : state.writingMode === "dictation" ? `
          <div class="writing-prompt">
            <span class="exercise-number">${language() === "zh" ? `第 ${exerciseNumber} / ${words.length} 题` : language() === "en" ? `Question ${exerciseNumber} / ${words.length}` : `Câu ${exerciseNumber} / ${words.length}`}</span>
            <p class="muted">Nghe rồi viết lại từ tiếng Hàn</p>
            <button class="button primary" id="playDictation" type="button">${icon("volume")} Nghe từ</button>
          </div>
          <input class="field writing-input" id="writingInput" lang="ko" autocomplete="off" placeholder="Nhập điều bạn nghe được">
          <div class="control-row" style="justify-content:center;margin-top:16px">
            <button class="button" id="revealWriting" type="button">Xem đáp án</button>
            <button class="button primary" id="checkWriting" type="button">Kiểm tra</button>
          </div>
        ` : `
          <div class="writing-prompt">
            <span class="exercise-number">${language() === "zh" ? `第${state.writingLesson}题` : language() === "en" ? `Exercise ${state.writingLesson}` : `Bài tập ${state.writingLesson}`}</span>
            <h2 style="font-size:28px">${esc(localizedTopic(state.writingLesson))}</h2>
            <p class="muted">${esc(freePrompt)}</p>
          </div>
          <label class="field-label" for="freeWriting">Bài viết của tôi</label>
          <textarea class="field ko" id="freeWriting" placeholder="Viết câu tiếng Hàn của bạn…">${esc(savedFree)}</textarea>
          <div class="writing-save-line">
            <span class="muted small" id="freeCount">0 ký tự Hangul</span>
            <button class="button primary" id="saveFreeWriting" type="button">Lưu bài viết</button>
          </div>
          <div class="writing-reference">
            <div class="writing-reference-head">
              <h3>Đáp án tham khảo</h3>
              <div class="control-row">
                <button class="button subtle" id="listenWritingReference" type="button">${icon("volume")} Nghe đáp án</button>
                <button class="button subtle" id="copyWritingReference" type="button">${icon("cards")} Sao chép</button>
              </div>
            </div>
            <p class="reference-writing ko" lang="ko">${esc(reference.text)}</p>
          </div>
          <div class="writing-note">
            <div class="word-note-head">
              <div><strong>Ghi chú tự sửa</strong><small>Đã tự động lưu</small></div>
              <button class="button subtle danger-text" id="deleteWritingNote" type="button" ${savedNote ? "" : "disabled"}>${icon("trash")} Xóa ghi chú</button>
            </div>
            <textarea class="field" id="writingNote" placeholder="Ghi lại lỗi, cách sửa hoặc điều cần hỏi giáo viên…">${esc(savedNote)}</textarea>
          </div>
        `}
        ${state.writingFeedback ? `<div class="feedback-box ${state.writingFeedback.ok ? "success" : "error"}">${esc(state.writingFeedback.message)}</div>` : ""}
      </section>
    `;
    $("#writingLesson").addEventListener("change", event => {
      state.writingLesson = Number(event.target.value);
      state.writingWordIndex = 0;
      state.writingFeedback = null;
      setLastLesson(state.writingLesson);
      renderWriting();
    });
    $$("[data-writing-mode]", $("#view-writing")).forEach(button => button.addEventListener("click", () => {
      state.writingMode = button.dataset.writingMode;
      state.writingFeedback = null;
      renderWriting();
    }));
    $("#playDictation")?.addEventListener("click", () => speak(word.word));
    $("#revealWriting")?.addEventListener("click", () => {
      state.writingFeedback = {
        ok: true,
        message: language() === "en" ? `Answer: ${word.word}` : language() === "zh" ? `答案：${word.word}` : `Đáp án: ${word.word}`
      };
      renderWriting();
    });
    $("#checkWriting")?.addEventListener("click", () => {
      const answer = $("#writingInput").value;
      const ok = normalize(answer) === normalize(word.word);
      state.writingFeedback = {
        ok,
        message: ok
          ? (language() === "en" ? "Correct. Well done!" : language() === "zh" ? "正确，做得好！" : "Chính xác. Tốt lắm!")
          : (language() === "en" ? `Not quite. The answer is ${word.word}.` : language() === "zh" ? `还不对，答案是 ${word.word}。` : `Chưa đúng. Đáp án là ${word.word}.`)
      };
      if (ok) {
        profileProgress().writing[state.writingLesson] = { ...(profileProgress().writing[state.writingLesson] || {}), lastCorrect: word.id, date: today() };
        persistProfile();
      }
      renderWriting();
      if (ok) setTimeout(nextWritingWord, 900);
    });
    const free = $("#freeWriting");
    if (free) {
      const updateCount = () => $("#freeCount").textContent = `${(free.value.match(/[가-힣]/g) || []).length} ký tự Hangul`;
      updateCount();
      free.addEventListener("input", updateCount);
      $("#saveFreeWriting").addEventListener("click", () => {
        const text = free.value.trim();
        if (!text) return toast("Hãy viết ít nhất một câu.");
        profileProgress().writing[state.writingLesson] = { text, date: today() };
        persistProfile();
        toast("Đã lưu bài viết.");
      });
      $("#listenWritingReference").addEventListener("click", () => speak(reference.text));
      $("#copyWritingReference").addEventListener("click", () => copyWritingText(reference.text));
      $("#writingNote").addEventListener("input", event => {
        const value = event.target.value;
        if (value) profileProgress().writingNotes[state.writingLesson] = value;
        else delete profileProgress().writingNotes[state.writingLesson];
        persistProfile();
        $("#deleteWritingNote").disabled = !value;
      });
      $("#deleteWritingNote").addEventListener("click", () => {
        delete profileProgress().writingNotes[state.writingLesson];
        persistProfile();
        renderWriting();
        toast(language() === "en" ? "Note deleted." : language() === "zh" ? "笔记已删除。" : "Đã xóa ghi chú.");
      });
    }
    scheduleUiTranslation();
  }

  function renderProgress() {
    const progress = profileProgress();
    const reviewed = state.vocab.filter(word => srsEntry(word.id).reviews > 0).length;
    const known = knownCount(state.vocab);
    const quizHistory = progress.quizHistory || [];
    const average = quizHistory.length ? Math.round(quizHistory.reduce((sum, item) => sum + item.percent, 0) / quizHistory.length) : 0;
    const totalShadow = SHADOW_DATA.reduce((sum, lesson) => sum + lesson.book.sentences.length + lesson.original.sentences.length, 0);
    const doneShadow = Object.values(progress.shadow || {}).filter(Boolean).length;
    const weakIds = Object.entries(progress.srs || {})
      .filter(([, entry]) => (entry.lapses || 0) > 0 || entry.level < 2)
      .sort((a, b) => (b[1].lapses || 0) - (a[1].lapses || 0))
      .slice(0, 8).map(([id]) => id);
    const weakWords = weakIds.map(id => state.vocab.find(word => word.id === id)).filter(Boolean);
    $("#view-progress").innerHTML = `
      <div class="page-heading">
        <div><h1>Tiến độ của ${esc(state.profile.name)}</h1><p>Dữ liệu này chỉ thuộc hồ sơ hiện tại trên trình duyệt này.</p></div>
        <div class="heading-actions"><button class="button" id="exportProgressTop" type="button">${icon("download")} Xuất tiến độ</button></div>
      </div>
      <div class="stat-grid">
        <section class="panel stat-item"><small>Chuỗi ngày học</small><strong>${progress.streak || 0} ngày</strong></section>
        <section class="panel stat-item"><small>Từ đã ôn</small><strong>${reviewed}/${state.vocab.length}</strong></section>
        <section class="panel stat-item"><small>Từ đã nhớ</small><strong>${known}</strong></section>
        <section class="panel stat-item"><small>Điểm quiz trung bình</small><strong>${average}%</strong></section>
      </div>
      <div class="dashboard-grid" style="margin-top:22px">
        <section class="panel">
          <div class="panel-header"><h2>Tiến độ theo bài</h2><span class="muted">${doneShadow}/${totalShadow} câu Shadowing</span></div>
          <div class="panel-body lesson-progress-list">
            ${LESSONS.map(info => {
              const words = lessonWords(info.lesson);
              const lessonKnown = knownCount(words);
              const percent = words.length ? Math.round(lessonKnown / words.length * 100) : 0;
              return `<div class="lesson-progress-row">
                <span><strong>${language() === "zh" ? `第${info.lesson}课` : language() === "en" ? `Lesson ${info.lesson}` : `Bài ${info.lesson}`}</strong><br><small class="muted">${esc(localizedTopic(info.lesson))}</small></span>
                <span class="progress-track"><span style="width:${percent}%"></span></span>
                <span>${percent}%</span>
              </div>`;
            }).join("")}
          </div>
        </section>
        <aside class="panel">
          <div class="panel-header"><h2>Từ cần chú ý</h2><span class="muted">${weakWords.length}</span></div>
          <div class="review-list">
            ${(weakWords.length ? weakWords : dueWords().slice(0, 6)).map(word => `
              <div class="review-row">
                <span class="ko">${esc(word.word)}</span><span>${esc(meaningFor(word))}</span>
                <button class="speak-mini" type="button" data-progress-speak="${esc(word.word)}">${icon("volume")}</button>
              </div>`).join("") || '<div class="empty-state">Chưa có từ yếu. Hãy làm một lượt flashcard.</div>'}
          </div>
        </aside>
      </div>
      <section class="panel" style="margin-top:22px;overflow:auto">
        <div class="panel-header"><h2>Lịch sử trắc nghiệm</h2><span class="muted">${quizHistory.length} lượt</span></div>
        ${quizHistory.length ? `<table class="history-table"><thead><tr><th>Ngày</th><th>Bài</th><th>Điểm</th><th>Tỷ lệ</th></tr></thead><tbody>
          ${quizHistory.slice(0, 12).map(item => `<tr><td>${new Date(item.date).toLocaleDateString(LANGUAGE_META[language()].locale)}</td><td>${language() === "zh" ? `第${item.lesson}课` : language() === "en" ? `Lesson ${item.lesson}` : `Bài ${item.lesson}`}</td><td>${item.score}/${item.total}</td><td>${item.percent}%</td></tr>`).join("")}
        </tbody></table>` : '<div class="empty-state">Chưa có kết quả. Hãy hoàn thành một lượt trắc nghiệm.</div>'}
      </section>
    `;
    $("#exportProgressTop").addEventListener("click", exportProgress);
    $$("[data-progress-speak]", $("#view-progress")).forEach(button => button.addEventListener("click", () => speak(button.dataset.progressSpeak)));
  }

  function renderReports() {
    const reportUrl = storage.local.getItem(STORAGE.reportUrl) || "";
    const shared = loadShared();
    $("#view-reports").innerHTML = `
      <div class="page-heading">
        <div><h1>Báo cáo và góp ý</h1><p>Thu thập lỗi nội dung, đề xuất sửa và ảnh minh họa từ người học.</p></div>
        <div class="heading-actions">
          ${reportUrl ? `<a class="button primary" href="${esc(reportUrl)}" target="_blank" rel="noopener">${icon("report")} Mở Google Form</a>` : ""}
        </div>
      </div>
      <div class="report-grid">
        <section class="panel panel-body">
          <h2>Kết nối Google Form</h2>
          <p class="muted">Dán liên kết biểu mẫu “Góp ý và báo lỗi – Học tiếng Hàn Sejong 1”. Người tải ảnh sẽ cần đăng nhập Google.</p>
          <label class="field-label" for="reportUrl">Liên kết Google Form</label>
          <input class="field" id="reportUrl" type="url" value="${esc(reportUrl)}" placeholder="https://forms.gle/...">
          <button class="button primary wide" id="saveReportUrl" type="button">Lưu liên kết</button>
          <div class="source-note">Nếu chưa có Form, biểu mẫu cục bộ bên cạnh có thể xuất một tệp JSON kèm ảnh để gửi thủ công cho người quản trị.</div>
        </section>
        <section class="panel panel-body">
          <h2>Tạo báo cáo cục bộ</h2>
          <label class="field-label" for="reporterName">Tên người góp ý (không bắt buộc)</label>
          <input class="field" id="reporterName" placeholder="Tên hiển thị">
          <div class="inline-form">
            <label><span class="field-label">Bài / chủ đề</span><select class="field" id="reportLesson">${lessonOptions(profileProgress().lastLesson || 1)}</select></label>
            <label><span class="field-label">Loại lỗi</span><select class="field" id="reportType">
              <option>Sai nghĩa</option><option>Sai chính tả</option><option>Sai phát âm/phiên âm</option><option>Lỗi âm thanh</option><option>Lỗi giao diện</option><option>Đề xuất khác</option>
            </select></label>
          </div>
          <label class="field-label" for="reportCurrent">Nội dung hiện tại</label>
          <textarea class="field" id="reportCurrent"></textarea>
          <label class="field-label" for="reportSuggestion">Đề xuất sửa</label>
          <textarea class="field" id="reportSuggestion"></textarea>
          <label class="field-label" for="reportContact">Thông tin liên hệ (không bắt buộc)</label>
          <input class="field" id="reportContact" placeholder="Email hoặc cách liên hệ">
          <label class="field-label" for="reportImage">Ảnh minh họa</label>
          <input class="field" id="reportImage" type="file" accept="image/*">
          <button class="button primary wide" id="exportReport" type="button">${icon("download")} Lưu báo cáo thành JSON</button>
        </section>
      </div>
      <section class="panel" style="margin-top:22px">
        <div class="panel-header"><h2>Báo cáo đã lưu trên thiết bị</h2><span class="muted">${(shared.reports || []).length}</span></div>
        <div class="panel-body">
          ${(shared.reports || []).length ? (shared.reports || []).slice(-8).reverse().map(report => `
            <div class="open-section"><strong>Bài ${report.lesson} · ${esc(report.type)}</strong><p>${esc(report.suggestion || report.current || "Không có mô tả")}</p><small class="muted">${new Date(report.createdAt).toLocaleString("vi-VN")}</small></div>
          `).join("") : '<div class="empty-state">Chưa có báo cáo cục bộ.</div>'}
        </div>
      </section>
    `;
    $("#saveReportUrl").addEventListener("click", () => {
      const url = $("#reportUrl").value.trim();
      if (url && !/^https:\/\/(docs\.google\.com\/forms|forms\.gle)\//i.test(url)) return toast("Hãy dùng liên kết Google Forms hợp lệ.");
      storage.local.setItem(STORAGE.reportUrl, url);
      toast("Đã lưu liên kết Google Form.");
      renderReports();
    });
    $("#exportReport").addEventListener("click", exportLocalReport);
  }

  async function exportLocalReport() {
    const file = $("#reportImage").files[0];
    let image = null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast("Ảnh cần nhỏ hơn 5 MB.");
      image = { name: file.name, type: file.type, dataUrl: await fileToDataUrl(file) };
    }
    const report = {
      schema: "sejong-green-report-v1",
      id: uid(),
      createdAt: new Date().toISOString(),
      reporter: $("#reporterName").value.trim(),
      lesson: Number($("#reportLesson").value),
      type: $("#reportType").value,
      current: $("#reportCurrent").value.trim(),
      suggestion: $("#reportSuggestion").value.trim(),
      contact: $("#reportContact").value.trim(),
      image
    };
    if (!report.current && !report.suggestion) return toast("Hãy mô tả nội dung cần góp ý.");
    const shared = loadShared();
    shared.reports = [...(shared.reports || []), { ...report, image: image ? { name: image.name, type: image.type } : null }].slice(-50);
    saveShared(shared);
    downloadText(`bao-cao-sejong-${report.id}.json`, JSON.stringify(report, null, 2), "application/json");
    toast("Đã lưu và xuất báo cáo.");
    renderReports();
  }

  const fileToDataUrl = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  function renderData() {
    const shared = loadShared();
    const customCount = Math.max(0, state.vocab.length - BASE_VOCAB.length);
    $("#view-data").innerHTML = `
      <div class="page-heading">
        <div><h1>Quản lý dữ liệu</h1><p>Nhập thêm từ mới, gộp hoặc thay thế, tự loại trùng và xuất bản sao lưu.</p></div>
        <div class="heading-actions"><button class="button" id="exportAll" type="button">${icon("download")} Xuất toàn bộ dữ liệu</button></div>
      </div>
      <div class="stat-grid" style="margin-bottom:22px">
        <section class="panel stat-item"><small>Tổng từ</small><strong>${state.vocab.length}</strong></section>
        <section class="panel stat-item"><small>Từ gốc 1A</small><strong>${BASE_VOCAB.length}</strong></section>
        <section class="panel stat-item"><small>Từ thêm vào</small><strong>${customCount}</strong></section>
        <section class="panel stat-item"><small>Chủ đề</small><strong>${new Set(state.vocab.map(item => item.lesson)).size}</strong></section>
      </div>
      <div class="data-grid">
        <section class="panel panel-body">
          <h2>Nhập CSV hoặc JSON</h2>
          <div class="drop-zone">
            ${icon("upload")}
            <p><strong>Chọn file dữ liệu</strong></p>
            <p class="muted small">CSV: lesson, topic, word, romanization, meaning, meaning_en, meaning_zh, example, example_vi, example_en, example_zh, grammar_point</p>
            <button class="button primary" id="chooseImport" type="button">Chọn file</button>
          </div>
          <div class="control-row" style="margin-top:14px">
            <label><input type="radio" name="importMode" value="merge" ${state.importMode === "merge" ? "checked" : ""}> Gộp thêm và loại trùng</label>
            <label><input type="radio" name="importMode" value="replace" ${state.importMode === "replace" ? "checked" : ""}> Thay thế toàn bộ</label>
          </div>
          <div class="data-actions" style="margin-top:14px">
            <button class="button" id="downloadTemplate" type="button">Tải CSV mẫu</button>
            <button class="button" id="exportCsv" type="button">Xuất từ vựng CSV</button>
          </div>
        </section>
        <section class="panel panel-body">
          <h2>Thêm nhanh một từ</h2>
          <div class="inline-form">
            <label><span class="field-label">Bài</span><select class="field" id="addLesson">${lessonOptions(profileProgress().lastLesson || 1)}</select></label>
            <label><span class="field-label">Từ tiếng Hàn</span><input class="field ko" id="addWord"></label>
            <label><span class="field-label">Phiên âm RR</span><input class="field" id="addRomanization"></label>
            <label><span class="field-label">Nghĩa tiếng Việt</span><input class="field" id="addMeaning"></label>
            <label><span class="field-label">Nghĩa tiếng Anh</span><input class="field" id="addMeaningEn"></label>
            <label><span class="field-label">Nghĩa tiếng Trung</span><input class="field" id="addMeaningZh"></label>
            <label class="span-2"><span class="field-label">Câu ví dụ Hàn</span><input class="field ko" id="addExample"></label>
            <label class="span-2"><span class="field-label">Dịch câu ví dụ tiếng Việt</span><input class="field" id="addExampleVi"></label>
            <label class="span-2"><span class="field-label">Dịch câu ví dụ tiếng Anh</span><input class="field" id="addExampleEn"></label>
            <label class="span-2"><span class="field-label">Dịch câu ví dụ tiếng Trung</span><input class="field" id="addExampleZh"></label>
          </div>
          <button class="button primary wide" id="addVocabulary" type="button">Thêm vào dữ liệu dùng chung</button>
        </section>
        <section class="panel panel-body">
          <h2>Sao lưu</h2>
          <p class="muted">Xuất riêng dữ liệu học hoặc tiến độ của hồ sơ hiện tại.</p>
          <div class="data-actions">
            <button class="button" id="exportVocabJson" type="button">Từ vựng JSON</button>
            <button class="button" id="exportProgress" type="button">Tiến độ JSON</button>
            <button class="button" id="exportProfileBackup" type="button">Bản sao hồ sơ</button>
          </div>
        </section>
        <section class="panel panel-body danger-zone">
          <h2>Khôi phục dữ liệu gốc</h2>
          <p class="muted">Xóa danh sách từ đã nhập thêm và quay về ${BASE_VOCAB.length} mục gốc. Tiến độ học không bị xóa.</p>
          <button class="button danger" id="resetVocabulary" type="button">${icon("trash")} Khôi phục danh sách gốc</button>
        </section>
      </div>
      <div class="source-note">
        Dữ liệu bài học dùng chung cho mọi hồ sơ trên thiết bị; SRS, điểm, Shadowing và bài viết vẫn lưu riêng theo từng tài khoản cục bộ.
      </div>
    `;
    $$('input[name="importMode"]', $("#view-data")).forEach(input => input.addEventListener("change", () => { state.importMode = input.value; }));
    $("#chooseImport").addEventListener("click", () => $("#hiddenImport").click());
    $("#downloadTemplate").addEventListener("click", downloadCsvTemplate);
    $("#exportCsv").addEventListener("click", exportVocabCsv);
    $("#exportVocabJson").addEventListener("click", exportVocabJson);
    $("#exportProgress").addEventListener("click", exportProgress);
    $("#exportProfileBackup").addEventListener("click", exportProfileBackup);
    $("#exportAll").addEventListener("click", exportAllData);
    $("#addVocabulary").addEventListener("click", addVocabulary);
    $("#resetVocabulary").addEventListener("click", () => {
      if (!confirm("Khôi phục danh sách từ vựng gốc và bỏ các từ đã nhập thêm?")) return;
      shared.vocabulary = null;
      saveShared(shared);
      state.vocab = cloneData(BASE_VOCAB);
      renderData();
      toast("Đã khôi phục dữ liệu gốc.");
    });
  }

  function fallbackVocabularyExample(word, meaning, lesson) {
    const subjectParticle = koreanHasBatchim(word) ? "이" : "가";
    const topicParticle = koreanHasBatchim(word) ? "은" : "는";
    const objectParticle = koreanHasBatchim(word) ? "을" : "를";
    const ending = koreanHasBatchim(word) ? "이에요" : "예요";
    const templates = {
      1: { example: `이것은 ${word}${ending}.`, exampleVi: `Đây là ${meaning}.`, grammar: "이것은 N이에요/예요" },
      2: { example: `${word}${subjectParticle} 뭐예요?`, exampleVi: `“${meaning}” là gì?`, grammar: "N이/가 뭐예요?" },
      3: { example: `방에 ${word}${subjectParticle} 있어요.`, exampleVi: `Trong phòng có ${meaning}.`, grammar: "N에 N이/가 있어요" },
      4: { example: `저는 ${word}${objectParticle} 좋아해요.`, exampleVi: `Tôi thích ${meaning}.`, grammar: "N을/를 좋아해요" },
      5: { example: `${word}하고 우유를 사요.`, exampleVi: `Tôi mua ${meaning} và sữa.`, grammar: "N하고 N을/를 사요" },
      6: { example: `${word}${objectParticle} 주세요.`, exampleVi: `Cho tôi ${meaning}.`, grammar: "N을/를 주세요" },
      7: { example: `${word}${topicParticle} 언제 시작해요?`, exampleVi: `${meaning} bắt đầu khi nào?`, grammar: "N은/는 언제 V-아요/어요?" },
      8: { example: `${word}${topicParticle} 요즘 어때요?`, exampleVi: `Dạo này ${meaning} thế nào?`, grammar: "N은/는 요즘 어때요?" },
      9: { example: `어제 ${word}${objectParticle} 했어요.`, exampleVi: `Hôm qua tôi đã thực hiện ${meaning}.`, grammar: "V-았/었어요" },
      10: { example: `주말에 ${word}${objectParticle} 할 거예요.`, exampleVi: `Cuối tuần tôi sẽ thực hiện ${meaning}.`, grammar: "V-(으)ㄹ 거예요" }
    };
    return templates[lesson] || templates[1];
  }

  function addVocabulary() {
    const lesson = Number($("#addLesson").value);
    const word = $("#addWord").value.trim();
    const meaning = $("#addMeaning").value.trim();
    const meaningEn = $("#addMeaningEn").value.trim();
    const meaningZh = $("#addMeaningZh").value.trim();
    const example = $("#addExample").value.trim();
    const exampleVi = $("#addExampleVi").value.trim();
    const exampleEn = $("#addExampleEn").value.trim();
    const exampleZh = $("#addExampleZh").value.trim();
    if (!word || !meaning || !meaningEn || !meaningZh) return toast("Hãy nhập từ tiếng Hàn và đủ ba nghĩa Việt, Anh, Trung.");
    if (!example || !exampleVi || !exampleEn || !exampleZh) return toast("Hãy nhập câu ví dụ tiếng Hàn và đủ ba bản dịch.");
    if (state.vocab.some(item => Number(item.lesson) === lesson && normalize(item.word) === normalize(word))) return toast("Từ này đã có trong bài.");
    const fallback = fallbackVocabularyExample(word, meaning, lesson);
    const entry = {
      id: `custom-${uid()}`,
      lesson,
      topic: lessonInfo(lesson).topic,
      word,
      romanization: $("#addRomanization").value.trim(),
      meaning,
      meaning_en: meaningEn,
      meaning_zh: meaningZh,
      example,
      example_vi: exampleVi,
      example_en: exampleEn,
      example_zh: exampleZh,
      grammar_point: fallback.grammar,
      source_example: "",
      source_page: null,
      custom: true
    };
    state.vocab.push(entry);
    const shared = loadShared();
    shared.vocabulary = state.vocab;
    saveShared(shared);
    toast("Đã thêm từ mới.");
    renderData();
  }

  function exportVocabJson() {
    downloadText("sejong-green-tu-vung.json", JSON.stringify({ schema: "sejong-green-vocabulary-v1", exportedAt: new Date().toISOString(), vocabulary: state.vocab }, null, 2), "application/json");
  }

  function exportProgress() {
    downloadText(`sejong-green-tien-do-${slug(state.profile.name)}.json`, JSON.stringify({
      schema: "sejong-green-progress-v1",
      exportedAt: new Date().toISOString(),
      profile: { id: state.profile.id, name: state.profile.name, createdAt: state.profile.createdAt },
      progress: state.profile.progress,
      settings: state.profile.settings
    }, null, 2), "application/json");
  }

  function exportProfileBackup() {
    downloadText(`sejong-green-ho-so-${slug(state.profile.name)}.json`, JSON.stringify({
      schema: "sejong-green-profile-backup-v1",
      exportedAt: new Date().toISOString(),
      profile: state.profile
    }, null, 2), "application/json");
  }

  function exportAllData() {
    const shared = loadShared();
    downloadText("sejong-green-du-lieu-day-du.json", JSON.stringify({
      schema: "sejong-green-full-data-v1",
      exportedAt: new Date().toISOString(),
      vocabulary: state.vocab,
      shadowing: SHADOW_DATA,
      listening: LISTEN_DATA,
      reports: shared.reports || []
    }, null, 2), "application/json");
  }

  function csvEscape(value) {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }

  function exportVocabCsv() {
    const headers = ["lesson", "topic", "word", "romanization", "meaning", "meaning_en", "meaning_zh", "example", "example_vi", "example_en", "example_zh", "grammar_point"];
    const lines = [headers.join(","), ...state.vocab.map(item => headers.map(header => csvEscape(item[header])).join(","))];
    downloadText("sejong-green-tu-vung.csv", "\uFEFF" + lines.join("\n"), "text/csv;charset=utf-8");
  }

  function downloadCsvTemplate() {
    const value = "\uFEFFlesson,topic,word,romanization,meaning,meaning_en,meaning_zh,example,example_vi,example_en,example_zh,grammar_point\n1,Chào hỏi và giới thiệu,안녕하세요,annyeonghaseyo,xin chào,hello,你好,안녕하세요? 저는 안나예요.,Xin chào tôi là Anna.,Hello I am Anna.,你好，我是安娜。,N은/는 N이에요/예요";
    downloadText("mau-tu-vung-sejong-green.csv", value, "text/csv;charset=utf-8");
  }

  function downloadText(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const slug = value => String(value || "hoc-vien").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  async function importDataFile(file) {
    if (!file) return;
    try {
      const text = await file.text();
      let entries;
      if (file.name.toLowerCase().endsWith(".csv")) {
        entries = parseCsv(text);
      } else {
        const parsed = JSON.parse(text);
        entries = Array.isArray(parsed) ? parsed : parsed.vocabulary;
      }
      if (!Array.isArray(entries) || !entries.length) throw new Error("Không tìm thấy danh sách từ vựng.");
      const clean = entries.map(normalizeImportedEntry).filter(Boolean);
      if (!clean.length) throw new Error("Không có dòng hợp lệ.");
      if (state.importMode === "replace") {
        if (!confirm(`Thay thế toàn bộ dữ liệu hiện tại bằng ${clean.length} mục?`)) return;
        state.vocab = clean;
      } else {
        const seen = new Set(state.vocab.map(item => `${Number(item.lesson)}:${normalize(item.word)}`));
        const additions = clean.filter(item => {
          const key = `${Number(item.lesson)}:${normalize(item.word)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        state.vocab = [...state.vocab, ...additions];
        toast(`Đã gộp ${additions.length} mục mới; bỏ qua ${clean.length - additions.length} mục trùng.`);
      }
      const shared = loadShared();
      shared.vocabulary = state.vocab;
      saveShared(shared);
      renderData();
    } catch (error) {
      toast(`Không thể nhập file: ${error.message}`);
    } finally {
      $("#hiddenImport").value = "";
    }
  }

  function normalizeImportedEntry(item, index) {
    if (!item || !item.word || !item.meaning) return null;
    const lesson = clamp(Number(item.lesson) || 1, 1, 99);
    const fallback = fallbackVocabularyExample(String(item.word).trim(), String(item.meaning).trim(), lesson);
    return {
      id: item.id || `import-${uid()}-${index}`,
      lesson,
      topic: item.topic || lessonInfo(lesson)?.topic || `Chủ đề ${lesson}`,
      word: String(item.word).trim(),
      romanization: String(item.romanization || "").trim(),
      meaning: String(item.meaning).trim(),
      meaning_en: String(item.meaning_en || item.meaningEn || "").trim(),
      meaning_zh: String(item.meaning_zh || item.meaningZh || "").trim(),
      example: String(item.example || fallback.example).trim(),
      example_vi: String(item.example_vi || item.exampleVi || fallback.exampleVi).trim(),
      example_en: String(item.example_en || item.exampleEn || "").trim(),
      example_zh: String(item.example_zh || item.exampleZh || "").trim(),
      grammar_point: String(item.grammar_point || fallback.grammar).trim(),
      source_example: String(item.source_example || "").trim(),
      source_page: item.source_page || null,
      custom: true
    };
  }

  function parseCsv(text) {
    const rows = [];
    let row = [], field = "", quoted = false;
    const source = text.replace(/^\uFEFF/, "");
    for (let index = 0; index < source.length; index++) {
      const char = source[index];
      if (quoted) {
        if (char === '"' && source[index + 1] === '"') { field += '"'; index++; }
        else if (char === '"') quoted = false;
        else field += char;
      } else if (char === '"') quoted = true;
      else if (char === ",") { row.push(field); field = ""; }
      else if (char === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (char !== "\r") field += char;
    }
    row.push(field);
    if (row.some(value => value.trim())) rows.push(row);
    const headers = rows.shift().map(value => value.trim());
    return rows.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
  }

  function bindStaticEvents() {
    $$("[data-auth-tab]").forEach(button => button.addEventListener("click", () => {
      $$("[data-auth-tab]").forEach(item => item.classList.toggle("active", item === button));
      $("#loginPane").hidden = button.dataset.authTab !== "login";
      $("#registerPane").hidden = button.dataset.authTab !== "register";
    }));
    $("#loginButton").addEventListener("click", login);
    $("#registerButton").addEventListener("click", registerProfile);
    $("#loginPin").addEventListener("keydown", event => { if (event.key === "Enter") login(); });
    $("#registerPin").addEventListener("keydown", event => { if (event.key === "Enter") registerProfile(); });
    $("#voiceSettingsButton").innerHTML = icon("volume");
    $("#profileSettingsButton").innerHTML = icon("settings");
    $("#dialogClose").innerHTML = icon("close");
    $("#voiceSettingsButton").addEventListener("click", openVoiceSettings);
    $("#profileSettingsButton").addEventListener("click", openProfileSettings);
    $("#profileMenuButton").addEventListener("click", openProfileSettings);
    $("#dialogClose").addEventListener("click", closeDialog);
    $("#appDialog").addEventListener("click", event => {
      if (event.target === $("#appDialog")) closeDialog();
    });
    $("#hiddenImport").addEventListener("change", event => importDataFile(event.target.files[0]));
  }

  function boot() {
    bindStaticEvents();
    const observer = new MutationObserver(scheduleUiTranslation);
    observer.observe(document.body, { childList: true, subtree: true });
    renderProfileSelect();
    const sessionId = storage.session.getItem(SESSION_KEY);
    if (sessionId && state.profiles.some(item => item.id === sessionId)) {
      enterApp(sessionId);
    }
  }

  window.addEventListener("beforeunload", () => {
    for (const files of state.audioFiles.values()) files.forEach(file => URL.revokeObjectURL(file.url));
    for (const recording of state.recordings.values()) URL.revokeObjectURL(recording.url);
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden && "speechSynthesis" in window) window.speechSynthesis.cancel(); });
  boot();
  startRemoteSync(storage).catch(error => console.warn("Remote sync unavailable:", error));
