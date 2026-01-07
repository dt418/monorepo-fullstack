# Product Overview

MyOrg Monorepo is a production-ready full-stack application featuring:

## Core Features

- **Task Management**: CRUD operations for tasks with real-time updates
- **User Authentication**: JWT-based auth with role-based access control (Admin/User)
- **File Upload**: Multi-file upload with storage management
- **Real-time Communication**: WebSocket integration with Redis pub/sub
- **Admin Panel**: User management for administrators

## Default Users

- Admin: `admin@example.com` / `admin123`
- User: `user@example.com` / `user1234`

## Key Endpoints

- Auth: `/api/auth/*` (register, login, logout, refresh)
- Tasks: `/api/tasks/*` (CRUD operations)
- Files: `/api/upload`, `/api/files/*`
- Admin: `/api/admin/*` (user management)
- Health: `/health`, `/ready`

## Real-time Events

WebSocket events for task operations (`task.created`, `task.updated`, `task.deleted`) and user presence (`user.online`, `user.offline`, `presence.list`).
