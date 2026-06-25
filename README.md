# 🏛️ Lendi Portal (v2.1)

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

### 3. Verification & Notifications
*   **QR Code Generation**: Dynamically generates scannable QR codes for fully approved outpasses.
*   **Gate Scanning**: Security staff scan the QR code to check status and log student exit/entry events.
*   **Real-time Notification Logs**: Users receive automated notifications for actions taken on their requests (e.g., *Approved by Teacher*, *Rejected by HOD*, *Final Approval by Principal*).

---

## 🛠️ Technology Stack

*   **Core Framework**: [Next.js (v16)](https://nextjs.org/) (utilizing the App Router architecture)
*   **UI / Frontend**: React 19, HTML5, and Vanilla CSS with custom dark glassmorphic styling optimized for response speed and smooth transitions.
*   **Database**: SQLite managed via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) for high performance and lightweight, file-based persistence.
*   **Authentication**: JSON Web Token (JWT) securely stored client-side in local storage.
*   **Security**: Password encryption using `bcryptjs`.
*   **QR System**: `qrcode` package for generating high-resolution verification codes.

---

## 📂 Project Structure

```text
lendi-v2/
├── public/                 # Static assets (images, logos, etc.)
├── src/
│   ├── app/                # Next.js App Router Pages & API Routes
│   │   ├── admin/          # Admin Dashboard & User Management
│   │   ├── api/            # Route Handlers (Auth, Outpass, Notifications, Attendance)
│   │   │   ├── admin/
│   │   │   ├── attendance/
│   │   │   ├── auth/
│   │   │   ├── hod/
│   │   │   ├── notifications/
│   │   │   ├── outpass/
│   │   │   └── teacher/
│   │   ├── attendance/     # Student Attendance views
│   │   ├── dashboard/      # Student Dashboard
│   │   ├── hod/            # HOD Dashboard & Monitor Pages
│   │   ├── login/          # Interactive Login Page (with Quick Demo credentials)
│   │   ├── notifications/  # Notification center
│   │   ├── outpass/        # Student Outpass Request Form & Viewer
│   │   ├── principal/      # Principal Dashboard & Overview
│   │   ├── register/       # Student Registration form
│   │   ├── staff/          # Gate/Staff Dashboard
│   │   ├── teacher/        # Class Teacher Dashboard & Monitor Pages
│   │   ├── globals.css     # Global styles & HSL-color tokens
│   │   └── layout.js       # Main HTML envelope
│   ├── components/
│   │   └── Sidebar.js      # Responsive sidebar navigation for different roles
│   └── lib/
│       ├── auth.js         # JWT signing & validation middleware
│       └── db.js           # Database initialization and WAL mode setup
├── lendi.db                # SQLite Database file
├── next.config.mjs         # Next.js compiler settings
├── package.json            # Application dependencies and run scripts
└── jsconfig.json           # Path aliasing config (e.g. "@/*")
```

---

## 🔑 Demo Access Credentials

For quick evaluation, the application provides built-in demo credentials on the login screen:

| Role | Demo Email | Password | Icon |
| :--- | :--- | :--- | :---: |
| **Student** | `rahul.kumar@lendi.edu.in` | `password123` | 🎓 |
| **Teacher** | `teacher.cse@lendi.edu.in` | `password123` | 👨‍🏫 |
| **HOD** | `hod.cse@lendi.edu.in` | `password123` | 🏛️ |
| **Principal** | `principal@lendi.edu.in` | `password123` | 🎖️ |
| **Admin** | `admin@lendi.edu.in` | `admin123` | ⚙️ |

---

## ⚡ Getting Started

### Prerequisites
*   Node.js (version 18 or higher)
*   npm (installed with Node)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Udaykiran252/lendi.git
   cd lendi-v2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🛡️ Database Schema

The system persists data in `lendi.db` with the following main tables:
*   `users`: Stores general account details, department, roles, and hashed credentials.
*   `students`: Contains student-specific metadata (roll number, year, semester, section).
*   `outpasses`: Manages request parameters (reason, destination, date/time) and approval statuses for each tier.
*   `notifications`: Stores status updates to alert users of approval updates.

---

## 📜 License

This project is licensed under the MIT License.
