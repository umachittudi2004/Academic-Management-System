# 🎓 Academic Management System

A full-stack academic management platform designed to centralize and simplify day-to-day academic activities for **students and faculty**.

The system provides dedicated role-based dashboards for managing attendance, subjects, assignments, notices, timetables, academic communication, and group messaging through a modern web interface.

Built with **React, Node.js, Express.js, MongoDB and Socket.IO**, the application combines REST APIs, authentication, real-time communication, and cloud-based document storage into a single academic platform.

---

## ✨ Key Features

### 👨‍🎓 Student Portal

Students can access their academic information and classroom activities from a centralized dashboard.

* Secure student authentication
* Student profile management
* Subject information
* Attendance tracking
* Personalized timetable
* Assignment management
* Assignment submissions
* Assignment status and grading information
* Targeted notices and announcements
* Group participation
* Real-time messaging
* Group chat
* Academic notifications

---

### 👨‍🏫 Faculty Portal

Faculty members have dedicated tools for managing academic activities.

* Secure faculty authentication
* Faculty profile management
* Subject management
* Attendance session management
* Student attendance tracking
* Assignment creation and management
* Assignment attachments
* Assignment submission monitoring
* Submission and grading statistics
* Notice creation and management
* Targeted notices based on:

  * Year
  * Branch
  * Section
* Timetable management
* Student/class-specific academic workflows
* Group creation and communication
* Real-time messaging

---

## 📚 Academic Management

The platform brings several academic workflows together instead of requiring separate systems.

### Attendance

Faculty can create and manage attendance sessions for their subjects, while students can view their attendance records.

The backend also contains authentication and IP-related middleware to support controlled access to academic operations.

### Assignments

Faculty can:

* Create assignments
* Define assignment descriptions
* Set total marks
* Specify due dates
* Target a particular year, branch and section
* Attach files
* Monitor submissions
* Track submission rates
* Track graded and pending submissions

Students can view assignments relevant to their academic group and submit their work.

The backend also validates that students only access assignments belonging to their own year, branch and section.

### Notices

Faculty can publish notices with:

* Title
* Content
* Category
* Target year
* Target branch
* Target section
* Urgency status
* Pinning
* Expiration date
* File attachments

Students receive notices according to their academic profile.

The system also maintains notice read/view information, allowing faculty to obtain engagement statistics.

---

## ☁️ File Storage Architecture

### Google Drive API

The application uses **Google Drive API as the cloud storage layer for uploaded academic files**.

This includes attachments associated with notices and assignments.

The backend implements Google OAuth2 authentication using the `googleapis` package and maintains Google Drive credentials through environment variables or a local token file during development.

### Upload Flow

```text
User uploads file
       ↓
Multer receives multipart file
       ↓
Temporary local file
       ↓
Google Drive API
       ↓
Application / category folder
       ↓
File metadata + Drive ID stored in MongoDB
       ↓
Temporary local file deleted
```

The application automatically creates or reuses an application-level Google Drive folder and category-specific subfolders such as `Notices` and assignment-related folders.

Uploaded files are stored with their Google Drive file ID, view/download links, MIME type and size.

When applicable, the backend also removes files from Google Drive when the corresponding academic resource is deleted.

> **Note:** Cloudinary exists as a dependency in the current `server/package.json`, but the implemented attachment-storage flow uses **Google Drive API**, not Cloudinary. Cloudinary should therefore not be presented as the project's active storage provider.

---

## 💬 Real-Time Communication

The application uses **Socket.IO** to support real-time communication.

Implemented communication areas include:

* Individual messaging
* Group messaging
* Group conversations
* Message notifications
* Real-time academic communication

This allows users to communicate without relying entirely on traditional request/response polling.

---

## 🔐 Authentication & Security

The backend implements role-aware authentication for students and faculty.

### Authentication technologies

* JSON Web Tokens (JWT)
* HTTP cookies
* `cookie-parser`
* Password hashing with `bcrypt`
* Role-specific authentication middleware
* CORS configuration
* Environment-based configuration

The server contains separate middleware for:

* Student authentication
* Faculty authentication
* General authentication
* IP-related access checks

JWT-based authentication is used to identify authenticated users and protect protected API routes.

---

## 🏗️ System Architecture

```text
                    ┌───────────────────────┐
                    │       React UI        │
                    │      Vite Client      │
                    └───────────┬───────────┘
                                │
                         REST API / Socket.IO
                                │
                    ┌───────────▼───────────┐
                    │    Node.js Server     │
                    │       Express.js      │
                    └───────┬───────┬───────┘
                            │       │
                ┌───────────┘       └──────────────┐
                │                                  │
        ┌───────▼────────┐                ┌────────▼────────┐
        │    MongoDB     │                │    Socket.IO    │
        │ Academic Data  │                │ Real-time Chat  │
        └────────────────┘                └─────────────────┘
                │
                │ File metadata
                │
        ┌───────▼────────────┐
        │   Google Drive     │
        │ Cloud File Storage │
        └────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

| Technology       | Purpose                                |
| ---------------- | -------------------------------------- |
| React            | User interface                         |
| Vite             | Frontend development and build tooling |
| JavaScript / JSX | Application development                |
| React Router     | Client-side routing                    |
| Axios            | API communication                      |
| Socket.IO Client | Real-time communication                |
| CSS              | UI styling                             |

### Backend

| Technology       | Purpose                       |
| ---------------- | ----------------------------- |
| Node.js          | Server runtime                |
| Express.js       | REST API framework            |
| MongoDB          | Database                      |
| Mongoose         | MongoDB ODM                   |
| JWT              | Authentication                |
| bcrypt           | Password hashing              |
| Socket.IO        | Real-time communication       |
| Multer           | Multipart file uploads        |
| Google Drive API | Cloud file storage            |
| Google OAuth2    | Drive authorization           |
| CORS             | Cross-origin request handling |
| dotenv           | Environment configuration     |
| Nodemon          | Development server            |

---

## 📁 Project Structure

```text
Academic-Management-System/
│
├── client/
│   ├── public/
│   └── src/
│       ├── api/
│       ├── assets/
│       ├── components/
│       ├── pages/
│       ├── socket/
│       ├── state/
│       ├── App.jsx
│       ├── App.css
│       ├── components.css
│       └── main.jsx
│
├── server/
│   ├── bin/
│   ├── controllers/
│   ├── lib/
│   │   ├── db.config.js
│   │   ├── generateToken.js
│   │   ├── googleDrive.js
│   │   └── multer.config.js
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── socket/
│   ├── uploads/
│   ├── app.js
│   ├── seedData_Version3.js
│   ├── seed-timetable.js
│   └── package.json
│
└── .gitignore
```

The backend follows a modular structure separating controllers, models, routes, middleware, storage utilities and real-time communication. The frontend is similarly separated into pages, reusable components, API utilities, state management and Socket.IO integration.

---

## 🗃️ Core Data Models

The backend currently contains models for major academic and communication entities, including:

* Student
* Faculty
* Subject
* Attendance
* Attendance Access
* Assignment
* Submission
* Grade
* Notice
* Notice Read
* Notice View
* Timetable
* Group
* Conversation
* Message
* Message Notification

This separation keeps academic records, authentication data and communication data independently manageable.

---

## 🚀 Getting Started

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* MongoDB
* Git
* Google Cloud project with Google Drive API enabled

---

### 1. Clone the repository

```bash
git clone https://github.com/umachittudi2004/Academic-Management-System.git

cd Academic-Management-System
```

---

### 2. Install frontend dependencies

```bash
cd client
npm install
```

---

### 3. Install backend dependencies

Open another terminal:

```bash
cd server
npm install
```

---



---

## ▶️ Running the Application

### Start backend

```bash
cd server
npm start
```

The server uses Nodemon through the configured start script.

### Start frontend

```bash
cd client
npm run dev
```

The Vite development server will provide the frontend URL.

---

## ❤️ Health Check

The backend exposes a health endpoint:

```text
GET /health
```

A successful response indicates that the server is running.

---

## 🔌 API Modules

The backend organizes APIs around major application domains:

```text
/api/userAuth
/api/subject
/api/attendence
/api/notice
/api/assignment
/api/oauth
/api/timetable
/api/group
/api/message
```



---

## 🔄 Assignment Workflow

```text
Faculty
   │
   ├── Create Assignment
   │       │
   │       ├── Validate Subject Ownership
   │       ├── Validate Due Date
   │       └── Upload Attachments
   │                    │
   │                    ▼
   │             Google Drive
   │
   ▼
Students in Target Class
   │
   ├── View Assignment
   ├── Submit Work
   │
   ▼
Faculty
   │
   ├── View Submissions
   ├── Track Submission Rate
   └── Grade Submissions
```

---

## 📢 Notice Workflow

```text
Faculty
   │
   ├── Create Notice
   ├── Select Target Year
   ├── Select Branch
   ├── Select Section
   └── Add Attachments
              │
              ▼
        Google Drive
              │
              ▼
         MongoDB Metadata
              │
              ▼
       Targeted Students
```

Students only receive active notices matching their academic profile and the notice publication/expiry conditions.

---

## 🎯 Design Goals

The project was developed with the following goals:

* Centralize academic workflows
* Reduce dependency on fragmented communication channels
* Provide role-specific experiences
* Improve visibility into attendance and assignments
* Simplify academic document sharing
* Enable real-time student-faculty communication
* Provide a scalable foundation for additional academic modules

---

## 🔒 Security Considerations

This project includes several security-oriented mechanisms:

* Password hashing
* JWT authentication
* HTTP cookie-based authentication
* Role-specific authorization middleware
* CORS origin restrictions
* Environment-based secrets
* Controlled Google Drive OAuth access
* Academic-group access validation
* Ownership checks for faculty resources

Production deployments should additionally use:

* HTTPS
* Secure cookie configuration
* Proper secret management
* Restricted Google OAuth redirect URIs
* Database access controls
* Rate limiting
* Input validation and sanitization
* File type and file size restrictions

---

## 📌 Current Project Status

The application contains functional modules covering:

* Student authentication
* Faculty authentication
* Student and faculty dashboards
* Subjects
* Attendance
* Assignments
* Assignment submissions
* Notices
* Timetables
* Groups
* Messaging
* Real-time communication
* Google Drive-based file storage

The project is actively structured as a full-stack academic platform and can be extended with additional administrative and academic modules.

---

## 🔮 Potential Future Enhancements

Some logical next steps include:

* Admin/HOD dashboard
* Advanced academic analytics
* Attendance trend visualization
* Automated attendance alerts
* Email notifications
* Push notifications
* Advanced assignment plagiarism detection
* Calendar integration
* Audit logs
* Fine-grained RBAC
* Automated database backups
* Improved file validation and scanning
* API documentation with Swagger/OpenAPI
* Automated testing
* CI/CD pipeline
* Production-grade observability and logging

---

## 👨‍💻 Author

**Uma Chittudi**

Computer Science & Engineering

GitHub: [@umachittudi2004](https://github.com/umachittudi2004)

---

## 📄 License

This project is currently maintained as a personal/academic project.

If you intend to reuse or distribute the project, contact the author regarding licensing and usage permissions.

---

## ⭐ Acknowledgements

Built using the open-source ecosystem around:

* React
* Node.js
* Express.js
* MongoDB
* Mongoose
* Socket.IO
* Google Drive API
* Vite

---

## ⭐ Support

If you find the project useful, consider giving the repository a ⭐ on GitHub.

**Repository:**
https://github.com/umachittudi2004/Academic-Management-System
