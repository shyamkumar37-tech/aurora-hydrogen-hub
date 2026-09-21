# Aurora Hydrogen Hub — Next-Gen Hydrogen Refueling & Station Management Platform

A high-performance full-stack web application designed for hydrogen mobility, fuel station logistics, and smart booking management. Built with Node.js, Express, MongoDB, Socket.io, React, and Vite, featuring WebAuthn / Biometric Passkey authentication with real-time dispenser status.

---

## 🌟 Key Features

- **Biometric Passkey & Multi-Auth Access**:
  - WebAuthn biometric passkey authentication with precision 4K Ultra-DPI fingerprint reticle scanner.
  - Role-segmented access (Customer, Station Staff, Admin).
- **Dynamic Station Management & Dispenser Booking**:
  - Real-time station capacity and dispenser availability monitoring.
  - 1-Touch biometric reservation confirmation.
- **Real-Time Telemetry & Operations**:
  - Live dispenser pressure, temperature, and queue tracking via WebSockets (`Socket.io`).
  - Automated queue processing and booking lifecycle management.
- **Forensic UI/UX**:
  - High-clarity typography with dark-mode aesthetic and glassmorphism styling.
  - Responsive layouts tailored for mobile, tablet, and widescreen desktop displays.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Vanilla CSS, Modern Glassmorphism & High-DPI Canvas/SVG
- **Icons**: Lucide React
- **Real-Time Client**: Socket.io Client

### Backend
- **Runtime**: Node.js & Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT & Biometric Passkey credentials
- **Real-Time Server**: Socket.io
- **Scheduling**: Node-Cron for dispenser queue automation

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or MongoDB Atlas connection string)

### 2. Backend Setup
```bash
cd backend
npm install
# Create a .env file with your PORT, MONGO_URI, and JWT_SECRET
npm run dev # or node server.js
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📄 License
MIT
