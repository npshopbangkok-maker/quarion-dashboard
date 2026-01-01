# Quarion Dashboard - Financial Management System

## Project Overview
A comprehensive Income/Expense Management Dashboard built with Next.js App Router.

## Tech Stack
- **Frontend**: Next.js 14+ (App Router)
- **UI**: Tailwind CSS
- **Charts**: Recharts
- **Auth & Database**: Supabase
- **Storage**: Supabase Storage (for slip uploads)
- **State**: React Hooks
- **Language**: TypeScript

## Database Schema

### users
- id (uuid, primary key)
- name (text)
- email (text)
- role (text: owner/admin/viewer)

### transactions
- id (uuid, primary key)
- type (text: income/expense)
- amount (numeric)
- category (text)
- description (text)
- date (date)
- created_by (uuid, foreign key to users)
- slip_url (text, nullable)
- created_at (timestamp)

### categories
- id (uuid, primary key)
- name (text)
- type (text: income/expense)

## Role Permissions
- **Owner**: Full access, manage users, export reports
- **Admin**: Add/edit transactions, upload slips
- **Viewer**: View dashboard only

## UI Guidelines
- Card-based layout with rounded-xl
- Soft shadows
- Income colors: Pink/Purple gradient
- Expense colors: Orange/Red
- Neutral: Gray/White
- Large, readable numbers
- Desktop-first responsive design
