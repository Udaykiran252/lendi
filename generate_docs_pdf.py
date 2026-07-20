import sys
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

pdf_path = os.path.join(os.getcwd(), 'Lendi_Portal_Architecture_Documentation.pdf')

doc = SimpleDocTemplate(
    pdf_path,
    pagesize=letter,
    rightMargin=40,
    leftMargin=40,
    topMargin=40,
    bottomMargin=40
)

styles = getSampleStyleSheet()

# Custom Palette
PRIMARY = colors.HexColor('#0F172A')    # Dark Slate
SECONDARY = colors.HexColor('#1E293B')  # Deep Blue Gray
ACCENT = colors.HexColor('#0284C7')     # Vibrant Blue
HIGHLIGHT = colors.HexColor('#F59E0B')  # Amber Gold
TEXT_DARK = colors.HexColor('#334155')  # Slate Text
BG_LIGHT = colors.HexColor('#F8FAFC')   # Light Gray
BORDER_COLOR = colors.HexColor('#E2E8F0')

# Custom Typography Styles
title_style = ParagraphStyle(
    'DocTitle',
    parent=styles['Title'],
    fontName='Helvetica-Bold',
    fontSize=24,
    leading=28,
    textColor=PRIMARY,
    alignment=TA_LEFT
)

subtitle_style = ParagraphStyle(
    'DocSubtitle',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=11,
    leading=15,
    textColor=colors.HexColor('#64748B'),
    alignment=TA_LEFT
)

h1_style = ParagraphStyle(
    'Heading1_Custom',
    parent=styles['Heading1'],
    fontName='Helvetica-Bold',
    fontSize=15,
    leading=19,
    textColor=PRIMARY,
    spaceBefore=14,
    spaceAfter=6
)

h2_style = ParagraphStyle(
    'Heading2_Custom',
    parent=styles['Heading2'],
    fontName='Helvetica-Bold',
    fontSize=12,
    leading=16,
    textColor=ACCENT,
    spaceBefore=10,
    spaceAfter=4
)

body_style = ParagraphStyle(
    'Body_Custom',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=9.5,
    leading=14,
    textColor=TEXT_DARK,
    spaceAfter=6
)

code_style = ParagraphStyle(
    'Code_Custom',
    parent=styles['Normal'],
    fontName='Courier',
    fontSize=8.5,
    leading=11,
    textColor=colors.HexColor('#0F172A'),
    backColor=colors.HexColor('#F1F5F9'),
    borderPadding=4,
    spaceAfter=6
)

table_header_style = ParagraphStyle(
    'TableHeader',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=9,
    leading=12,
    textColor=colors.white,
    alignment=TA_LEFT
)

table_cell_style = ParagraphStyle(
    'TableCell',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=8.5,
    leading=11,
    textColor=TEXT_DARK,
    alignment=TA_LEFT
)

table_cell_bold = ParagraphStyle(
    'TableCellBold',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=8.5,
    leading=11,
    textColor=PRIMARY,
    alignment=TA_LEFT
)

story = []

# Header Section
story.append(Paragraph("🏛️ LENDI PORTAL (v2.2)", title_style))
story.append(Spacer(1, 4))
story.append(Paragraph("Comprehensive System Architecture, Database Schema & API Documentation", subtitle_style))
story.append(Paragraph("Lendi Institute of Engineering and Technology · Generated July 2026", subtitle_style))
story.append(Spacer(1, 10))
story.append(HRFlowable(width="100%", thickness=2, color=ACCENT, spaceBefore=0, spaceAfter=14))

# Executive Summary
story.append(Paragraph("1. Executive System Overview", h1_style))
story.append(Paragraph(
    "The <b>Lendi Portal</b> is a full-stack web application developed for the Lendi Institute of Engineering & Technology. "
    "It provides a digitized, multi-tier outpass approval pipeline, automated student attendance monitoring, role-based administration, "
    "and real-time gate security QR code verification. The codebase has been refactored into decoupled <b>Frontend</b> (Next.js 16) and "
    "<b>Backend</b> (Node.js/Express) modules.",
    body_style
))

# Key Features Table
tech_data = [
    [Paragraph("Module", table_header_style), Paragraph("Technology Stack", table_header_style), Paragraph("Description", table_header_style)],
    [Paragraph("Frontend Client", table_cell_bold), Paragraph("Next.js 16 (App Router), React 19", table_cell_style), Paragraph("Responsive dark glassmorphic UI with role-tailored dashboards.", table_cell_style)],
    [Paragraph("Backend Server", table_cell_bold), Paragraph("Node.js, Express.js", table_cell_style), Paragraph("RESTful API server running on port 5000 with CORS & JWT middleware.", table_cell_style)],
    [Paragraph("Database Engine", table_cell_bold), Paragraph("SQLite (better-sqlite3)", table_cell_style), Paragraph("High-performance file-based storage with WAL mode & auto-seeding.", table_cell_style)],
    [Paragraph("Security & Auth", table_cell_bold), Paragraph("JWT, bcryptjs", table_cell_style), Paragraph("Stateless token verification & salted password hashing.", table_cell_style)],
    [Paragraph("Verification", table_cell_bold), Paragraph("qrcode package", table_cell_style), Paragraph("Dynamic QR pass generation & Gate Staff exit/entry scanning.", table_cell_style)],
]

t_tech = Table(tech_data, colWidths=[110, 160, 260])
t_tech.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), SECONDARY),
    ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(t_tech)
story.append(Spacer(1, 14))

# 2. Database Schema & Data Models
story.append(Paragraph("2. Database Schema & Data Models (`backend/lib/db.js`)", h1_style))
story.append(Paragraph(
    "The backend utilizes SQLite managed by <code>better-sqlite3</code> with foreign key enforcement and Write-Ahead Logging (WAL) enabled. "
    "The database schema automatically initializes the required tables upon server launch if missing.",
    body_style
))

schema_data = [
    [Paragraph("Table Name", table_header_style), Paragraph("Primary Fields", table_header_style), Paragraph("Purpose & Foreign Keys", table_header_style)],
    [Paragraph("<code>users</code>", table_cell_bold), Paragraph("id, email, password, name, role, department, created_at", table_cell_style), Paragraph("System accounts & roles (student, class_teacher, hod, principal, gate_staff, admin).", table_cell_style)],
    [Paragraph("<code>students</code>", table_cell_bold), Paragraph("id, user_id, roll_no, year, semester, section", table_cell_style), Paragraph("Student metadata linked to users.id (ON DELETE CASCADE).", table_cell_style)],
    [Paragraph("<code>outpasses</code>", table_cell_bold), Paragraph("id, user_id, student_id, reason, destination, from_date, to_date, status, teacher_status, hod_status, principal_status, exit_time, entry_time", table_cell_style), Paragraph("Multi-stage outpass request details & timestamp tracking.", table_cell_style)],
    [Paragraph("<code>notifications</code>", table_cell_bold), Paragraph("id, user_id, title, message, type, outpass_id, read, created_at", table_cell_style), Paragraph("Real-time alert records linked to users.id.", table_cell_style)],
    [Paragraph("<code>subjects</code>", table_cell_bold), Paragraph("id, code, name, faculty_name, department, year, semester", table_cell_style), Paragraph("Academic course catalogue for student attendance.", table_cell_style)],
    [Paragraph("<code>attendance</code>", table_cell_bold), Paragraph("id, student_id, subject_id, date, status", table_cell_style), Paragraph("Class attendance logs (present/absent) linked to students.id.", table_cell_style)],
]

t_schema = Table(schema_data, colWidths=[100, 200, 230])
t_schema.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), SECONDARY),
    ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(t_schema)
story.append(Spacer(1, 14))

# Demo Credentials Table
story.append(Paragraph("Demo Access Accounts (Auto-seeded)", h2_style))
cred_data = [
    [Paragraph("Role", table_header_style), Paragraph("Email Address", table_header_style), Paragraph("Password", table_header_style), Paragraph("Department", table_header_style)],
    [Paragraph("Student", table_cell_bold), Paragraph("rahul.kumar@lendi.edu.in", table_cell_style), Paragraph("password123", table_cell_style), Paragraph("CSE", table_cell_style)],
    [Paragraph("Class Teacher", table_cell_bold), Paragraph("teacher.cse@lendi.edu.in", table_cell_style), Paragraph("password123", table_cell_style), Paragraph("CSE", table_cell_style)],
    [Paragraph("HOD", table_cell_bold), Paragraph("hod.cse@lendi.edu.in", table_cell_style), Paragraph("password123", table_cell_style), Paragraph("CSE", table_cell_style)],
    [Paragraph("Principal", table_cell_bold), Paragraph("principal@lendi.edu.in", table_cell_style), Paragraph("password123", table_cell_style), Paragraph("All Depts", table_cell_style)],
    [Paragraph("Gate Security", table_cell_bold), Paragraph("gate.security@lendi.edu.in", table_cell_style), Paragraph("password123", table_cell_style), Paragraph("Security", table_cell_style)],
    [Paragraph("System Admin", table_cell_bold), Paragraph("admin@lendi.edu.in", table_cell_style), Paragraph("admin123", table_cell_style), Paragraph("System", table_cell_style)],
]

t_cred = Table(cred_data, colWidths=[100, 190, 120, 120])
t_cred.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
    ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
]))
story.append(t_cred)
story.append(Spacer(1, 14))

story.append(PageBreak())

# 3. Backend RESTful API Specification
story.append(Paragraph("3. Backend RESTful API Reference (`backend/routes/`)", h1_style))
story.append(Paragraph(
    "All backend endpoints run under the <code>/api</code> prefix on port 5000. JWT token authentication is enforced via the "
    "<code>Authorization: Bearer &lt;token&gt;</code> header.",
    body_style
))

api_data = [
    [Paragraph("Endpoint", table_header_style), Paragraph("Method", table_header_style), Paragraph("Auth / Role", table_header_style), Paragraph("Function & Description", table_header_style)],
    [Paragraph("<code>/api/auth/login</code>", table_cell_bold), Paragraph("POST", table_cell_style), Paragraph("Public", table_cell_style), Paragraph("Authenticates email & password, signs and returns 7-day JWT token.", table_cell_style)],
    [Paragraph("<code>/api/auth/register</code>", table_cell_bold), Paragraph("POST", table_cell_style), Paragraph("Public (@lendi.edu.in)", table_cell_style), Paragraph("Registers new student account & creates student metadata record.", table_cell_style)],
    [Paragraph("<code>/api/auth/me</code>", table_cell_bold), Paragraph("GET", table_cell_style), Paragraph("JWT (Any Role)", table_cell_style), Paragraph("Validates active token and returns current user/student profile.", table_cell_style)],
    [Paragraph("<code>/api/outpass</code>", table_cell_bold), Paragraph("GET", table_cell_style), Paragraph("JWT (User/Student)", table_cell_style), Paragraph("Fetches list of submitted outpasses for the logged-in user.", table_cell_style)],
    [Paragraph("<code>/api/outpass</code>", table_cell_bold), Paragraph("POST", table_cell_style), Paragraph("JWT (Student)", table_cell_style), Paragraph("Creates outpass request & notifies class teacher.", table_cell_style)],
    [Paragraph("<code>/api/outpass/:id</code>", table_cell_bold), Paragraph("GET", table_cell_style), Paragraph("JWT (Any Role)", table_cell_style), Paragraph("Retrieves detailed view of a specific outpass request.", table_cell_style)],
    [Paragraph("<code>/api/outpass/:id</code>", table_cell_bold), Paragraph("PATCH", table_cell_style), Paragraph("Teacher / HOD / Principal", table_cell_style), Paragraph("Approves/rejects outpass at current tier and advances state.", table_cell_style)],
    [Paragraph("<code>/api/teacher</code>", table_cell_bold), Paragraph("GET", table_cell_style), Paragraph("Teacher / HOD / Principal", table_cell_style), Paragraph("Fetches department outpasses filtered by approval status.", table_cell_style)],
    [Paragraph("<code>/api/hod</code>", table_cell_bold), Paragraph("GET", table_cell_style), Paragraph("HOD / Principal", table_cell_style), Paragraph("Returns department student attendance metrics & outpass statistics.", table_cell_style)],
    [Paragraph("<code>/api/attendance</code>", table_cell_bold), Paragraph("GET", table_cell_style), Paragraph("JWT (Student)", table_cell_style), Paragraph("Computes subject-wise attendance percentages & logs.", table_cell_style)],
    [Paragraph("<code>/api/notifications</code>", table_cell_bold), Paragraph("GET, PATCH", table_cell_style), Paragraph("JWT (Any Role)", table_cell_style), Paragraph("Retrieves notifications list or marks notifications as read.", table_cell_style)],
    [Paragraph("<code>/api/staff/verify</code>", table_cell_bold), Paragraph("POST", table_cell_style), Paragraph("Gate Staff / Admin", table_cell_style), Paragraph("Scans approved QR code outpass and logs exit/entry timestamps.", table_cell_style)],
    [Paragraph("<code>/api/admin/users</code>", table_cell_bold), Paragraph("GET, POST, DELETE", table_cell_style), Paragraph("Admin Only", table_cell_style), Paragraph("Manages users, account creation, and user deletion.", table_cell_style)],
]

t_api = Table(api_data, colWidths=[120, 50, 110, 250])
t_api.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), SECONDARY),
    ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
]))
story.append(t_api)
story.append(Spacer(1, 14))

# 4. Outpass Multi-Tier Workflow
story.append(Paragraph("4. Multi-Tier Outpass State Machine", h1_style))
story.append(Paragraph(
    "Outpass requests follow a strict sequential approval state pipeline. Rejection at any stage immediately terminates the workflow.",
    body_style
))

workflow_data = [
    [Paragraph("Stage", table_header_style), Paragraph("Status Key", table_header_style), Paragraph("Responsible Role", table_header_style), Paragraph("Next Transition State", table_header_style)],
    [Paragraph("1. Submission", table_cell_bold), Paragraph("<code>pending_teacher</code>", table_cell_style), Paragraph("Student", table_cell_style), Paragraph("Teacher approves ➔ <code>pending_hod</code>", table_cell_style)],
    [Paragraph("2. HOD Review", table_cell_bold), Paragraph("<code>pending_hod</code>", table_cell_style), Paragraph("Head of Department", table_cell_style), Paragraph("HOD approves ➔ <code>pending_principal</code>", table_cell_style)],
    [Paragraph("3. Principal Approval", table_cell_bold), Paragraph("<code>pending_principal</code>", table_cell_style), Paragraph("Principal", table_cell_style), Paragraph("Principal approves ➔ <code>approved</code>", table_cell_style)],
    [Paragraph("4. Final Approval", table_cell_bold), Paragraph("<code>approved</code>", table_cell_style), Paragraph("Student", table_cell_style), Paragraph("Student views & downloads scannable QR pass.", table_cell_style)],
    [Paragraph("5. Gate Verification", table_cell_bold), Paragraph("<code>approved</code>", table_cell_style), Paragraph("Gate Security Staff", table_cell_style), Paragraph("Logs <code>exit_time</code> and <code>entry_time</code>.", table_cell_style)],
]

t_wf = Table(workflow_data, colWidths=[90, 110, 130, 200])
t_wf.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
    ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(t_wf)
story.append(Spacer(1, 14))

# 5. Frontend Architecture & Next.js Rewrite
story.append(Paragraph("5. Frontend Architecture & Routing (`frontend/`)", h1_style))
story.append(Paragraph(
    "The frontend is built with Next.js 16 (App Router). During development and production, Next.js proxy rewrites in "
    "<code>frontend/next.config.mjs</code> automatically forward all client API requests to the Express backend on port 5000:",
    body_style
))
story.append(Paragraph(
    "<code>rewrites() =&gt; [{ source: '/api/:path*', destination: 'http://localhost:5000/api/:path*' }]</code>",
    code_style
))

frontend_data = [
    [Paragraph("Route Path", table_header_style), Paragraph("View Component", table_header_style), Paragraph("Description & Controls", table_header_style)],
    [Paragraph("<code>/</code>", table_cell_bold), Paragraph("Landing Page", table_cell_style), Paragraph("College portal landing page with features overview.", table_cell_style)],
    [Paragraph("<code>/login</code>", table_cell_bold), Paragraph("LoginPage (Suspense)", table_cell_style), Paragraph("Interactive sign-in with quick role-based demo buttons.", table_cell_style)],
    [Paragraph("<code>/register</code>", table_cell_bold), Paragraph("RegisterPage", table_cell_style), Paragraph("Student sign-up form restricted to @lendi.edu.in emails.", table_cell_style)],
    [Paragraph("<code>/dashboard</code>", table_cell_bold), Paragraph("StudentDashboard", table_cell_style), Paragraph("Student hub for active outpasses & attendance summary.", table_cell_style)],
    [Paragraph("<code>/outpass</code>", table_cell_bold), Paragraph("StudentOutpassPage", table_cell_style), Paragraph("Form to request outpass & view generated QR gate passes.", table_cell_style)],
    [Paragraph("<code>/teacher/dashboard</code>", table_cell_bold), Paragraph("TeacherDashboard", table_cell_style), Paragraph("Class Teacher queue for reviewing department requests.", table_cell_style)],
    [Paragraph("<code>/hod/dashboard</code>", table_cell_bold), Paragraph("HodDashboard", table_cell_style), Paragraph("HOD overview for department outpasses & student records.", table_cell_style)],
    [Paragraph("<code>/principal/dashboard</code>", table_cell_bold), Paragraph("PrincipalDashboard", table_cell_style), Paragraph("Executive overview of outpasses & student attendance.", table_cell_style)],
    [Paragraph("<code>/staff/outpasses</code>", table_cell_bold), Paragraph("StaffVerificationPage", table_cell_style), Paragraph("Gate Security scanner interface for exit/entry logging.", table_cell_style)],
    [Paragraph("<code>/admin/users</code>", table_cell_bold), Paragraph("AdminUsersPage", table_cell_style), Paragraph("System administration panel for user account management.", table_cell_style)],
]

t_fe = Table(frontend_data, colWidths=[130, 140, 260])
t_fe.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), SECONDARY),
    ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
]))
story.append(t_fe)

# Build PDF Document
doc.build(story)
print(f"SUCCESS: PDF generated at {pdf_path}")
