# Sejong Green

Web học tiếng Hàn Sejong 1A, tối ưu cho máy tính và iPad.

Web hỗ trợ tài khoản email/mật khẩu, đồng bộ tiến độ giữa nhiều thiết bị và
đưa một hồ sơ cục bộ cũ lên tài khoản trực tuyến khi đăng ký.

## Cấu trúc

- `app/index.html`: khung HTML nguồn.
- `app/src/`: giao diện, chức năng và lớp lưu trữ.
- `app/data/`: từ vựng, shadowing và bài nghe tách riêng.
- `app/data/number-groups.json`: hai nhóm số Hán–Hàn và thuần Hàn, tách khỏi từ mới của Bài 2/Bài 6 nhưng giữ nguyên ID và tiến độ học.
- `app/public/`: ảnh và tài nguyên tĩnh.
- `supabase/schema.sql`: cấu trúc tài khoản, RLS và đồng bộ thời gian thực.
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

1. Chạy `supabase/schema.sql` bằng một migration Supabase.
2. Sao chép `.env.example` thành `.env`.
3. Điền `VITE_SUPABASE_URL` và `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Build lại web.

Trong **Authentication → URL Configuration**, đặt:

- Site URL: `https://phamngoclieu.github.io/hangul/`
- Redirect URL: `https://phamngoclieu.github.io/hangul/**`

Hai URL này cần thiết cho xác nhận email và đặt lại mật khẩu. Khi chạy cục bộ,
có thể thêm `http://localhost:5173/hangul/**` hoặc URL preview tương ứng.

Không đưa service-role key vào frontend hoặc GitHub.
