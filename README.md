# Học tiếng Hàn để thành kà su

Website học theo đúng hai giáo trình **Sejong Korean 1** và **Sejong Korean 2**.
Hai khu vực sử dụng dữ liệu, audio, bài tập và tiến độ riêng, không trộn lẫn.

## Nội dung

- Sejong 1: phần nhập môn, 12 bài, 4 bài văn hoá, 256 mục từ và 73 track.
- Sejong 2: 14 bài, 4 bài văn hoá, 389 mục từ và 70 track.
- Từ vựng lấy từ phần mục lục từ vựng của từng sách và đối chiếu với Từ điển
  tiếng Hàn cơ sở của Viện Quốc ngữ Quốc gia Hàn Quốc.
- Bài tập cần hình dùng ảnh chụp riêng từ đúng trang sách; không đăng nguyên PDF.
- Tài khoản Supabase đồng bộ tiến độ riêng của từng giáo trình trên nhiều thiết bị.

## Cấu trúc

- `app/data/courses.json`: hai giáo trình, bài học, từ vựng, ngữ pháp và ánh xạ tài nguyên.
- `app/public/audio/sejong-1/`, `app/public/audio/sejong-2/`: file nghe theo số track.
- `app/public/assets/exercises/`: ảnh bài tập theo giáo trình và bài.
- `app/public/assets/culture/`: ảnh các bài văn hoá.
- `app/src/`: giao diện, tiến độ và đồng bộ tài khoản.
- `scripts/build-sejong-courses.mjs`: tạo dữ liệu giáo trình từ kết quả trích xuất đã đối chiếu.
- `supabase/schema.sql`: bảng tài khoản, RLS và trạng thái đồng bộ.

## Chạy cục bộ

```bash
pnpm install
pnpm run dev
```

## Kiểm tra và phát hành

```bash
pnpm run validate
pnpm run release
```

`pnpm run release` kiểm tra dữ liệu, build bằng Vite rồi cập nhật `index.html`,
`assets/` và `audio/` ở thư mục gốc cho GitHub Pages.

## Quy tắc hiển thị nguồn gốc từ

- Từ thuần Hàn chỉ hiện phân loại **Từ thuần Hàn**.
- Từ Hán–Hàn luôn hiện Hán tự và từ tiếng Hán tương ứng.
- Flashcard có nút **Từ trước** và **Từ tiếp theo**.
