# 🏛️ Lendi Portal (v2.2)

Welcome to the official repository of the **Lendi Portal**, a modern, high-performance, and feature-rich Web Application designed for **Lendi Institute of Engineering and Technology**. 

This application provides a digitized, secure, and streamlined multi-tier workflow for managing college outpasses, monitoring student attendance, distributing real-time notifications, and verifying gate entry using QR codes.

---

## 🚀 Key Features

### 1. Multi-Tier Approval Workflow
A secure, hierarchical request and approval pipeline:
*   **Student** ➔ **Class Teacher** ➔ **HOD** ➔ **Principal**
*   **Class Teacher** ➔ **HOD** ➔ **Principal**
*   **HOD** ➔ **Principal**

### 2. Role-Based Dashboards
Tailored interfaces with appropriate permissions and controls for:
*   **🎓 Students**: Request outpasses, view real-time approval status, download fully approved QR codes, and monitor attendance.
*   **👨‍🏫 Class Teachers**: Review and sign off on pending student requests within their specific department.
*   **🏛️ Head of Department (HOD)**: Oversee department-wide requests, initiate personal outpasses, and manage department faculty.
*   **🎖️ Principal**: Provide the final authorization for outpasses, monitor faculty and student records across all departments.
*   **🎫 Gate Security (Staff)**: Scan and verify the QR codes of approved student/faculty outpasses to record exit/entry.
*   **⚙️ Administrators**: Manage users, modify accounts, and assign roles.

---

## 🛠️ Technology Stack

*   **Frontend**: Next.js 16 (App Router), React 19, HTML5, Vanilla CSS dark glassmorphic styling.
*   **Backend**: Node.js & Express API server.
*   **Database**: SQLite via `better-sqlite3` with automated schema initialization & demo seeding.
*   **Authentication**: JSON Web Tokens (JWT) & `bcryptjs` password hashing.
*   **QR System**: `qrcode` package for generating high-resolution verification codes.

---

## 📂 Project Structure (Separated Frontend & Backend)

```text
lendi-v2/
├── backend/                  # Express Node.js Backend API Server
│   ├── lib/                  # Auth middleware & Database initialization
│   ├── routes/               # API Routers (Auth, Outpass, Teacher, HOD, Attendance, Staff, Admin)
│   ├── lendi.db              # SQLite Database file
│   ├── package.json          # Backend dependencies
│   └── server.js             # Express application entry (Port 5000)
├── frontend/                 # Next.js Frontend Client Application
│   ├── public/               # Static web assets
│   ├── src/                  # Next.js App Router UI Pages & Components
│   ├── next.config.mjs       # Next.js compiler settings & API proxy rewrite
│   └── package.json          # Frontend dependencies
├── package.json              # Workspace runner scripts
└── README.md                 # Documentation
```

---

## 🔑 Demo Access Credentials

| Role | Demo Email | Password | Icon |
| :--- | :--- | :--- | :---: |
| **Student** | `rahul.kumar@lendi.edu.in` | `password123` | 🎓 |
| **Teacher** | `teacher.cse@lendi.edu.in` | `password123` | 👨‍🏫 |
| **HOD** | `hod.cse@lendi.edu.in` | `password123` | 🏛️ |
| **Principal** | `principal@lendi.edu.in` | `password123` | 🎖️ |
| **Gate Staff** | `gate.security@lendi.edu.in` | `password123` | 🎫 |
| **Admin** | `admin@lendi.edu.in` | `admin123` | ⚙️ |

---

## ⚡ Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   npm

### Running the Application

1. **Start the Backend Server**:
   ```bash
   cd backend
   npm install
   npm run dev
   # Runs on http://localhost:5000
   ```

2. **Start the Frontend Client**:
   ```bash
   cd frontend
   npm install
   npm run dev
   # Runs on http://localhost:3000
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 License

This project is licensed under the MIT License.
