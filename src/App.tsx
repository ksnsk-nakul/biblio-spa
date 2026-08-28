import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import AppShell from './components/AppShell'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import LibraryPage from './pages/LibraryPage'
import BookDetailPage from './pages/BookDetailPage'
import ReaderPage from './pages/reader/ReaderPage'
import FileManagerPage from './pages/files/FileManagerPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          {/* The reader gets its own layout (no app header/nav chrome) so the
              continuous-scroll view isn't fighting the shell for vertical space. */}
          <Route path="/read/:bookId" element={<ReaderPage />} />

          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/library/:folderId" element={<LibraryPage />} />
            <Route path="/books/:id" element={<BookDetailPage />} />
            <Route path="/files" element={<FileManagerPage />} />
            <Route path="/files/:folderId" element={<FileManagerPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}
