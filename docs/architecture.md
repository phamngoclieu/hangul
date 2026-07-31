# Kiến trúc Sejong Green

## Nguyên tắc

1. Nội dung học tập không nằm trong mã giao diện.
2. Bản phát hành mới không thay đổi các khóa lưu trữ cũ.
3. Web hoạt động khi không có Supabase và có thể đồng bộ khi Supabase được bật.
4. Mọi dữ liệu nhập thêm phải qua bước kiểm tra trước khi build.

## Luồng dữ liệu

```text
app/data/*.json
       │
       ├── scripts/validate-content.mjs
       │
       └── Vite build
              │
              ├── index.html
              └── assets/*
                     │
                     └── GitHub Pages
```

## Lưu trữ

- `storage.js` là cổng duy nhất của giao diện tới Local Storage và Session
  Storage.
- `remote-sync.js` chỉ khởi động khi có cấu hình Supabase và người dùng đã đăng
  nhập Supabase.
- Khi chưa cấu hình Supabase, hành vi giống hệt phiên bản cũ.

## Cập nhật nội dung

Trong giai đoạn hiện tại, có thể sửa các tệp JSON hoặc nhập/xuất từ trang
**Dữ liệu** trong web. Giai đoạn tiếp theo sẽ bổ sung trang quản trị dùng chung
và đẩy nội dung đã duyệt vào bảng `content_items`.

## Triển khai

Vite dùng `base: "/hangul/"`. Bản build được tạo trong `dist/`, sau đó
`scripts/publish-root.mjs` cập nhật `index.html` và `assets/` ở thư mục gốc để
giữ nguyên nguồn GitHub Pages hiện tại.
