import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import StudentLogin from './pages/StudentLogin.jsx'
import FacultyLogin from './pages/FacultyLogin.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'
import FacultyDashboard from './pages/FacultyDashboard.jsx'
import CreateSubject from './pages/CreateSubject.jsx'
import Subjects from './pages/Subjects.jsx'
import Attendance from './pages/Attendance.jsx'
import StudentProfile from './pages/StudentProfile.jsx'
import FacultyProfile from './pages/FacultyProfile.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import CreateNotice from './pages/CreateNotice.jsx'
import FacultyNotices from './pages/FacultyNotices.jsx'
import StudentNoticeBoard from './pages/StudentNoticeBoard.jsx'
import CreateTimetable from './pages/CreateTimetable.jsx'
import FacultyTimetable from './pages/FacultyTimetable.jsx'
import StudentTimetable from './pages/StudentTimetable.jsx'
import CreateAssignment from './pages/CreateAssignment.jsx'
import FacultyAssignments from './pages/FacultyAssignments.jsx'
import AssignmentSubmissions from './pages/AssignmentSubmissions.jsx'
import StudentAssignments from './pages/StudentAssignments.jsx'
import Messages from './pages/Messages.jsx'
import Groups from './pages/Groups.jsx'
import GroupChat from './pages/GroupChat.jsx'

export default function App() {
  const location = useLocation()
  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: 16 }}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/login/student" element={<StudentLogin />} />
            <Route path="/login/faculty" element={<FacultyLogin />} />

            {/* ========== STUDENT ROUTES ========== */}
            <Route
              path="/student"
              element={
                <ProtectedRoute role="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/subjects"
              element={
                <ProtectedRoute role="student">
                  <Subjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/attendance"
              element={
                <ProtectedRoute role="student">
                  <Attendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute role="student">
                  <StudentProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/timetable"
              element={
                <ProtectedRoute role="student">
                  <StudentTimetable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/assignments"
              element={
                <ProtectedRoute role="student">
                  <StudentAssignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/notices"
              element={
                <ProtectedRoute role="student">
                  <StudentNoticeBoard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/messages"
              element={
                <ProtectedRoute role="student">
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/groups"
              element={
                <ProtectedRoute role="student">
                  <Groups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/groups/:id"
              element={
                <ProtectedRoute role="student">
                  <GroupChat />
                </ProtectedRoute>
              }
            />

            {/* ========== FACULTY ROUTES ========== */}
            <Route
              path="/faculty"
              element={
                <ProtectedRoute role="faculty">
                  <FacultyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/profile"
              element={
                <ProtectedRoute role="faculty">
                  <FacultyProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/create-subject"
              element={
                <ProtectedRoute role="faculty">
                  <CreateSubject />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/timetable/view"
              element={
                <ProtectedRoute role="faculty">
                  <FacultyTimetable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/assignments"
              element={
                <ProtectedRoute role="faculty">
                  <FacultyAssignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/assignments/create"
              element={
                <ProtectedRoute role="faculty">
                  <CreateAssignment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/assignments/:id/submissions"
              element={
                <ProtectedRoute role="faculty">
                  <AssignmentSubmissions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/notices"
              element={
                <ProtectedRoute role="faculty">
                  <FacultyNotices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/notices/create"
              element={
                <ProtectedRoute role="faculty">
                  <CreateNotice />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/timetable"
              element={
                <ProtectedRoute role="faculty">
                  <CreateTimetable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/messages"
              element={
                <ProtectedRoute role="faculty">
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/groups"
              element={
                <ProtectedRoute role="faculty">
                  <Groups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/groups/:id"
              element={
                <ProtectedRoute role="faculty">
                  <GroupChat />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
    </>
  )
}