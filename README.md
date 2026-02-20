# 🚀 SmartTracking — GPS Tracking for Sales Team

ระบบติดตามเส้นทาง GPS สำหรับทีมขาย (Sale) พร้อมจัดการ Trip, แสดงแผนที่ Google Maps แบบ Real-time และออกรายงาน Excel/PDF สำหรับผู้จัดการ

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database](#-database)
- [API Endpoints](#-api-endpoints)
- [WebSocket Events](#-websocket-events)
- [User Roles](#-user-roles)
- [Default Accounts](#-default-accounts)

---

## ✨ Features

| Feature | Description |
|---|---|
| **Trip Management** | Start / Pause / Resume / Stop trip พร้อม segment tracking |
| **Real-time GPS Tracking** | บันทึกพิกัด GPS ผ่าน WebSocket แบบ real-time |
| **Google Maps** | แสดงเส้นทาง trip บนแผนที่ Google Maps |
| **Role-based Access** | ระบบสิทธิ์ 3 ระดับ: Admin, Manager, Sale |
| **Trip History** | ดูประวัติ trip ย้อนหลังพร้อมรายละเอียด |
| **Report & Dashboard** | สรุปรายงาน trip พร้อม filter ตามวันที่/พนักงาน |
| **Export Excel/PDF** | ส่งออกรายงานเป็น Excel (.xlsx) และ PDF |
| **User Management** | จัดการผู้ใช้งาน (CRUD) สำหรับ Admin |
| **JWT Authentication** | ระบบ login ด้วย JWT + Refresh Token |

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **NestJS 10** | REST API Framework |
| **Prisma 5** | ORM & Database Migration |
| **SQL Server** | Database |
| **Socket.IO** | Real-time WebSocket |
| **Passport + JWT** | Authentication |
| **ExcelJS** | Export Excel |
| **PDFKit** | Export PDF |

### Frontend
| Technology | Purpose |
|---|---|
| **Vue 3** | UI Framework |
| **Quasar 2** | Component Library & Build Tool |
| **Pinia** | State Management |
| **Vue Router 4** | Routing |
| **Axios** | HTTP Client |
| **Socket.IO Client** | Real-time Communication |
| **Google Maps API** | Map Display |

---

## 🏗 Architecture

```
┌─────────────┐       WebSocket (Socket.IO)       ┌──────────────┐
│             │ ◄──────────────────────────────── │              │
│   Frontend  │                                    │   Backend    │
│  (Quasar)   │ ────── REST API (HTTP) ──────────► │  (NestJS)    │
│  Port 9000  │                                    │  Port 3000   │
└─────────────┘                                    └──────┬───────┘
                                                          │
                                                   Prisma ORM
                                                          │
                                                   ┌──────▼───────┐
                                                   │  SQL Server   │
                                                   └──────────────┘
```

---

## 📁 Project Structure

```
SmartTracking/
├── backend/                    # NestJS Backend
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   ├── seed.ts             # Seed data
│   │   └── migrations/         # Database migrations
│   └── src/
│       ├── main.ts             # Entry point
│       ├── app.module.ts       # Root module
│       ├── auth/               # Authentication (login, JWT, guards)
│       ├── user/               # User management (CRUD)
│       ├── trip/               # Trip lifecycle (start/pause/resume/stop)
│       ├── gps/                # GPS point processing
│       ├── ws/                 # WebSocket gateway (real-time tracking)
│       ├── report/             # Report & export (summary, Excel, PDF)
│       ├── prisma/             # Prisma service
│       └── shared/             # Decorators, filters, interceptors
│
├── frontend/                   # Quasar (Vue 3) Frontend
│   └── src/
│       ├── boot/               # Axios & Google Maps setup
│       ├── layouts/            # Auth & Main layouts
│       ├── modules/
│       │   ├── auth/           # Login page & store
│       │   ├── trip/           # Trip control, history, detail pages
│       │   ├── gps/            # GPS socket service & composable
│       │   ├── map/            # Google Maps components
│       │   ├── report/         # Report page & store
│       │   └── user/           # User management pages
│       ├── router/             # Vue Router config
│       └── stores/             # Pinia store setup
│
└── README.md
```

---

## ⚙️ Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **SQL Server** (local หรือ Azure SQL)
- **Google Maps API Key** (สำหรับแสดงแผนที่)

---

## 🚀 Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/<your-username>/SmartTracking.git
cd SmartTracking
```

### 2. Backend Setup

```bash
cd backend
npm install

# สร้างไฟล์ .env (ดูหัวข้อ Environment Variables)

# Generate Prisma Client
npm run prisma:generate

# Run Database Migration
npm run prisma:migrate

# Seed ข้อมูลเริ่มต้น (roles + demo users)
npm run prisma:seed

# Start Development Server
npm run start:dev
```

Backend จะรันที่ `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend
npm install

# สร้างไฟล์ .env

# Start Development Server
npm run dev
```

Frontend จะรันที่ `http://localhost:9000`

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL="sqlserver://localhost:1433;database=SmartTracking;user=sa;password=YourPassword;encrypt=true;trustServerCertificate=true"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3000
CORS_ORIGIN=http://localhost:9000
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
```

---

## 🗄 Database

### Schema Overview

| Table | Description |
|---|---|
| `users` | ข้อมูลผู้ใช้งาน (employee code, email, password) |
| `roles` | บทบาท: Admin, Manager, Sale |
| `user_roles` | ความสัมพันธ์ User ↔ Role (many-to-many) |
| `refresh_tokens` | JWT Refresh Token storage |
| `trips` | ข้อมูล Trip (status, distance, duration) |
| `trip_segments` | แบ่ง segment เมื่อ pause/resume |
| `gps_points` | พิกัด GPS แต่ละจุด (lat, lng, speed, heading) |

### Migration Commands

```bash
npm run prisma:migrate    # Run migrations
npm run prisma:generate   # Regenerate Prisma Client
npm run prisma:seed       # Seed default data
npm run prisma:studio     # Open Prisma Studio (GUI)
```

---

## 📡 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/login` | เข้าสู่ระบบ | ❌ |
| `POST` | `/api/auth/refresh` | Refresh access token | ❌ |
| `POST` | `/api/auth/logout` | ออกจากระบบ | ✅ |
| `GET` | `/api/auth/me` | ดูข้อมูลตัวเอง | ✅ |

### Trips (`/api/trips`)

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `POST` | `/api/trips/start` | เริ่ม trip | Sale |
| `PATCH` | `/api/trips/:id/pause` | หยุด trip ชั่วคราว | Sale |
| `PATCH` | `/api/trips/:id/resume` | เริ่ม trip ต่อ | Sale |
| `PATCH` | `/api/trips/:id/stop` | จบ trip | Sale |
| `GET` | `/api/trips` | ดู trip ทั้งหมด | Sale, Manager, Admin |
| `GET` | `/api/trips/active` | ดู trip ที่กำลังทำอยู่ | Sale |
| `GET` | `/api/trips/:id` | ดูรายละเอียด trip | Sale, Manager, Admin |

### Reports (`/api/reports`)

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/api/reports/summary` | สรุปภาพรวม | Admin, Manager |
| `GET` | `/api/reports/trips` | รายการ trip (paginated) | Admin, Manager |
| `GET` | `/api/reports/export/excel` | ส่งออก Excel | Admin, Manager |
| `GET` | `/api/reports/export/pdf` | ส่งออก PDF | Admin, Manager |

### Users (`/api/users`)

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/api/users` | ดูผู้ใช้ทั้งหมด | Admin |
| `GET` | `/api/users/sales` | ดูรายชื่อ Sale | Admin, Manager |
| `GET` | `/api/users/:id` | ดูข้อมูลผู้ใช้ | Admin |
| `POST` | `/api/users` | สร้างผู้ใช้ | Admin |
| `PATCH` | `/api/users/:id` | แก้ไขผู้ใช้ | Admin |
| `DELETE` | `/api/users/:id` | ลบผู้ใช้ | Admin |

---

## 🔌 WebSocket Events

เชื่อมต่อผ่าน namespace `/tracking` พร้อม JWT token

| Event | Direction | Description |
|---|---|---|
| `gps:send` | Client → Server | ส่งพิกัด GPS |
| `gps:received` | Server → Client | ACK ยืนยันรับพิกัด |
| `gps:update` | Server → Room | Broadcast พิกัดไปยัง room ของ trip |

---

## 👥 User Roles

| Role | Permissions |
|---|---|
| **Admin** | จัดการผู้ใช้, ดูรายงาน, ดู trip ทั้งหมด |
| **Manager** | ดูรายงาน, ดู trip ของทีม |
| **Sale** | เริ่ม/หยุด/จบ trip, ดูประวัติ trip ของตัวเอง |

---

## 🔑 Default Accounts

หลังจากรัน `npm run prisma:seed`:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@smarttracking.com` | `Admin@123` |
| Sale | `sale01@smarttracking.com` | `Sale@123` |

---

## 📝 License

MIT
