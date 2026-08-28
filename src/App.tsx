import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import AppShell from './components/AppShell'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import LibraryPage from './pages/LibraryPage'
import FileManagerPage from './pages/files/FileManagerPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/library" replace />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/files" element={<FileManagerPage />} />
            <Route path="/files/:folderId" element={<FileManagerPage />} />
            <Route path="*" element={<Navigate to="/library" replace />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}
