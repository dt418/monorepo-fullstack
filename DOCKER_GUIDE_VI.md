# Tài liệu hướng dẫn Docker & Docker Compose (Tiếng Việt)

Tài liệu này hướng dẫn cách sử dụng Docker và Docker Compose để phát triển, kiểm thử và triển khai dự án `monorepo-fullstack`.

---

## 🏗 Kiến trúc Docker

Dự án sử dụng mô hình Microservices đơn giản, được đóng gói và quản lý bằng Docker Compose.

- **Frontend**: Nginx phục vụ ứng dụng React (đã build).
- **Backend**: Node.js API chạy ứng dụng [Hono](https://hono.dev/).
- **Database**: PostgreSQL 16.
- **Database GUI**: Prisma Studio.
- **Cache**: Redis 7.

---

## 🚀 Hướng dẫn nhanh

### 1. Yêu cầu hệ thống

- Docker Engine >= 20.10
- Docker Compose v2
- Node.js & pnpm (chỉ khi cần build local)

### 2. Chạy ứng dụng lần đầu

```bash
# Copy file môi trường mẫu
cp .env.example .env

# Build và chạy các container ở chế độ background
pnpm docker:up
```

### 3. Các lệnh thường dùng (via pnpm)

Trong `package.json` đã tích hợp sẵn các script tiện ích:

- `pnpm docker:up`: Khởi động toàn bộ hệ thống (`docker-compose up -d`).
- `pnpm docker:down`: Dừng và xóa các container (`docker-compose down`).
- `pnpm docker:build`: Build lại các service (`docker-compose build`).
- `pnpm docker:db:migrate`: Chạy migration database trong container.
- `pnpm docker:db:seed`: Chạy seed database trong container.

---

## 📦 Chi tiết các Dịch vụ (Services)

| Service         | Port | Image                | Mô tả                                                     |
| :-------------- | :--- | :------------------- | :-------------------------------------------------------- |
| `postgres`      | 5432 | `postgres:16-alpine` | Lưu trữ dữ liệu chính. Có healthcheck tự động.            |
| `redis`         | 6379 | `redis:7-alpine`     | Caching và Pub/Sub.                                       |
| `api`           | 3001 | Custom (Node 20)     | Backend server. Kết nối Postgres & Redis.                 |
| `web`           | 3000 | Custom (Nginx)       | Frontend app. Proxy các request `/api` tới service `api`. |
| `prisma-studio` | 5555 | Custom (Node 20)     | Giao diện trực quan để quản lý database qua Prisma.       |

---

## 🛠 Giải thích Dockerfile

### Backend (`apps/api/Dockerfile`)

Sử dụng **Multi-stage build** để tối ưu dung lượng image:

1.  **Stage 1 (Builder)**: Cài đặt `pnpm`, copy toàn bộ workspace, chạy `prisma generate` và `pnpm build`.
2.  **Stage 2 (Runner)**: Chỉ copy file thực thi (`dist`), `node_modules` sản xuất và các file cấu hình. Chạy dưới quyền user non-root (`api`).

### Frontend (`apps/web/Dockerfile`)

1.  **Stage 1 (Builder)**: Build ứng dụng web và các package phụ thuộc (`@myorg/types`, `@myorg/ui`).
2.  **Stage 2 (Runner)**: Sử dụng **Nginx Alpine**. Copy file đã build vào folder html của Nginx và sử dụng `nginx.conf` tùy chỉnh cho SPA Routing.

---

## ⚙️ Biến môi trường (Environment Variables)

Các biến quan trọng cần lưu ý trong file `.env`:

| Biến                | Mặc định     | Mô tả                    |
| :------------------ | :----------- | :----------------------- |
| `POSTGRES_USER`     | `postgres`   | User của database        |
| `POSTGRES_PASSWORD` | `postgres`   | Password của database    |
| `POSTGRES_DB`       | `myorg`      | Tên database khởi tạo    |
| `JWT_SECRET`        | (ngẫu nhiên) | Khóa bí mật cho JWT      |
| `API_PORT`          | `3001`       | Port export của Backend  |
| `WEB_PORT`          | `3000`       | Port export của Frontend |

---

## 💾 Quản lý Dữ liệu (Volumes)

- `postgres_data`: Lưu trữ dữ liệu PostgreSQL bền vững.
- `redis_data`: Lưu trữ dữ liệu Redis.
- `uploads_data`: Lưu trữ các file upload trong container `api` tại `/app/uploads`.

---

## 🛠 Môi trường Phát triển Docker (Development)

Chúng tôi cung cấp một môi trường Docker độc lập dành riêng cho phát triển, bao gồm tính năng hot-reloading cho cả API và Web.

```bash
# Khởi động môi trường phát triển
pnpm docker:dev

# Build lại container (nếu có thay đổi package)
pnpm docker:dev:build
```

Truy cập các dịch vụ:

- **Web**: http://localhost:5173
- **API**: http://localhost:3001
- **Prisma Studio**: http://localhost:5555

---

## 🔍 Kiểm tra sức khỏe (Healthchecks)

Hệ thống được cấu hình để đảm bảo các service khởi động đúng trình tự:

- `api` chỉ khởi động khi `postgres` và `redis` đã ở trạng thái **Healthy**.
- `web` chỉ khởi động khi `api` đã sẵn sàng.

---

> [!IMPORTANT]
> Trong môi trường Production, hãy đảm bảo thay đổi `POSTGRES_PASSWORD` và `JWT_SECRET` trong file `.env`.
