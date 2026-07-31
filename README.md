# Sejong Green

Web học tiếng Hàn Sejong 1A, tối ưu cho máy tính và iPad.

## Cấu trúc

- `app/index.html`: khung HTML nguồn.
- `app/src/`: giao diện, chức năng và lớp lưu trữ.
- `app/data/`: từ vựng, shadowing và bài nghe tách riêng.
- `app/public/`: ảnh và tài nguyên tĩnh.
- `supabase/schema.sql`: cấu trúc đồng bộ tài khoản trong giai đoạn tiếp theo.
- `index.html` và `assets/`: bản build đang được GitHub Pages phục vụ.

## Chạy cục bộ

```bash
npm install
npm run dev
```

## Kiểm tra và tạo bản phát hành

```bash
npm run validate
npm run release
```

`npm run release` kiểm tra dữ liệu, build bằng Vite rồi cập nhật bản tĩnh ở thư
mục gốc để đường dẫn GitHub Pages hiện tại tiếp tục hoạt động.

## Cấu hình Supabase

Web mặc định vẫn dùng dữ liệu trình duyệt và giữ nguyên các khóa
`sejongGreen.*`. Khi đã có dự án Supabase:

1. Chạy `supabase/schema.sql` trong Supabase SQL Editor.
2. Sao chép `.env.example` thành `.env`.
3. Điền `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.
4. Build lại web.

Không đưa service-role key vào frontend hoặc GitHub.
