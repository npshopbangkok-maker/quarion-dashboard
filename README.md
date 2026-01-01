# Quarion Dashboard

ระบบจัดการ รายรับ–รายจ่าย แบบ Dashboard

## Tech Stack

- **Frontend**: Next.js 14+ (App Router)
- **UI**: Tailwind CSS
- **Charts**: Recharts
- **Auth & Database**: Supabase
- **Storage**: Supabase Storage
- **Language**: TypeScript

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Schema

### users
- id (uuid, primary key)
- name (text)
- email (text)
- role (owner / admin / viewer)

### transactions
- id (uuid)
- type (income / expense)
- amount (numeric)
- category (text)
- description (text)
- date (date)
- created_by (uuid)
- slip_url (text, nullable)
- created_at (timestamp)

### categories
- id (uuid)
- name (text)
- type (income / expense)

## Role Permissions

| Role   | Dashboard | Transactions | Upload Slip | Users | Reports |
|--------|-----------|--------------|-------------|-------|---------|
| Owner  | ✅        | ✅           | ✅          | ✅    | ✅      |
| Admin  | ✅        | ✅           | ✅          | ❌    | ❌      |
| Viewer | ✅        | ❌           | ❌          | ❌    | ❌      |
