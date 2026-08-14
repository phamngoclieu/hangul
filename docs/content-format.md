# Cập nhật nội dung học tập

Nội dung nguồn nằm trong các tệp JSON ở `app/data/`. Không sửa trực tiếp các
tệp đã build trong `assets/`.

## Từ vựng

Mỗi mục trong `vocabulary.json` cần có:

- `lesson`, `topic`, `ko`, `romanization`;
- ba nghĩa `vi`, `en`, `zh`;
- câu ví dụ tiếng Hàn `example`;
- ba bản dịch `exampleVi`, `exampleEn`, `exampleZh`;
- `grammar` và `grammarNote`.

Tổ hợp `lesson + ko` phải là duy nhất.

Hai nhóm số được khai báo bằng ID trong `number-groups.json`. Những từ có ID ở
đây không xuất hiện trong danh sách từ mới của từng bài, nhưng vẫn có thể được
chọn và ôn riêng dưới mục **Số Hán–Hàn** hoặc **Số thuần Hàn**. Không đổi ID khi
chỉnh nội dung vì ID được dùng để giữ tiến độ học viên.

Nguồn gốc từ được tách riêng trong `word-origins.json`, liên kết với từ vựng bằng
ID. Mỗi mục có loại từ, giải thích và mẹo ghi nhớ bằng Việt - Anh - Trung, dạng
gốc, nguồn nghiên cứu và trạng thái nghiên cứu. Ảnh chỉ được phép thêm cho mục
`research_status: "unresolved"`, phải lưu trong `app/public/assets/vocabulary/`,
có nguồn và giấy phép. Ảnh được tải lười và chỉ xuất hiện ở mặt sau flashcard.

Quy trình cập nhật dữ liệu nguồn gốc:

1. Chạy `scripts/research-vocabulary-origins.mjs` để cập nhật bộ nhớ đệm từ điển.
2. Kiểm tra các từ đồng âm và bổ sung ngoại lệ chính xác trong
   `scripts/build-word-origins.mjs`.
3. Chạy `scripts/build-word-origins.mjs` để tạo đủ 404 mục.
4. Chạy `npm run validate` trước khi phát hành.

## Shadowing

Mỗi bài trong `shadowing.json` cần có mã bài, tên chủ đề, đoạn tiếng Hàn và ba
bản dịch Việt - Anh - Trung. Phần ngữ pháp là một danh sách các mẫu câu kèm giải
thích ở cả ba ngôn ngữ.

## Luyện nghe

Mỗi bài trong `listening.json` cần có mã bài, tiêu đề, URL nguồn Nuri, ghi chú
và hướng dẫn ở cả ba ngôn ngữ.

## Kiểm tra trước khi xuất bản

Chạy `npm run validate`. Bản cập nhật chỉ nên được phát hành khi lệnh này báo
toàn bộ dữ liệu hợp lệ. GitHub cũng tự động chạy lại bước kiểm tra này mỗi khi
mã nguồn được cập nhật.
