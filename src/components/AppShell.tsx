import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function AppShell() {
  const { user, logout } = useAuth()

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-logo">
          Bibliocon
        </Link>

        <nav className="app-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Home
          </NavLink>
          <NavLink to="/library" className={({ isActive }) => (isActive ? 'active' : '')}>
            Library
          </NavLink>
          {user?.is_admin && (
            <NavLink to="/files" className={({ isActive }) => (isActive ? 'active' : '')}>
              Files
            </NavLink>
          )}
        </nav>

        <div className="app-user-menu">
          <span className="app-user-name">{user?.name}</span>
          <button type="button" className="btn btn-ghost" onClick={() => logout()}>
            Log out
          </button>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
