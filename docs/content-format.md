# Cập nhật nội dung học tập

Nội dung nguồn nằm trong ba tệp JSON ở `app/data/`. Không sửa trực tiếp các
tệp đã build trong `assets/`.

## Từ vựng

Mỗi mục trong `vocabulary.json` cần có:

- `lesson`, `topic`, `ko`, `romanization`;
- ba nghĩa `vi`, `en`, `zh`;
- câu ví dụ tiếng Hàn `example`;
- ba bản dịch `exampleVi`, `exampleEn`, `exampleZh`;
- `grammar` và `grammarNote`.

Tổ hợp `lesson + ko` phải là duy nhất.

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
