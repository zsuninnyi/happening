import { Link, Navigate, Outlet, useRouterState } from '@tanstack/react-router';
import { useAuth } from '../auth/AuthContext';

export function RootLayout() {
  const { user, token, logout } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <Link to={token ? (user?.role === 'admin' ? '/admin/events' : '/alerts') : '/login'}>
            happening
          </Link>
        </div>
        {user && (
          <div className="topbar-meta">
            <span>
              {user.name} ({user.role})
            </span>
            <button type="button" className="button button-secondary" onClick={logout}>
              Log out
            </button>
          </div>
        )}
      </header>

      {user && (
        <nav className="nav">
          {user.role === 'admin' ? (
            <>
              <NavLink to="/admin/events" current={pathname}>
                Events
              </NavLink>
              <NavLink to="/admin/alerts" current={pathname}>
                Alerts
              </NavLink>
              <NavLink to="/admin/history" current={pathname}>
                History
              </NavLink>
              <NavLink to="/admin/users" current={pathname}>
                Users
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/alerts" current={pathname}>
                My alerts
              </NavLink>
              <NavLink to="/history" current={pathname}>
                History
              </NavLink>
            </>
          )}
        </nav>
      )}

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, current, children }: { to: string; current: string; children: string }) {
  const active = current === to || current.startsWith(`${to}/`);
  return (
    <Link to={to} className={active ? 'nav-link active' : 'nav-link'}>
      {children}
    </Link>
  );
}

export function RequireAuth({ role }: { role?: 'user' | 'admin' }) {
  const { token, user } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" />;
  }

  if (role === 'admin' && user.role !== 'admin') {
    return <Navigate to="/alerts" />;
  }

  if (role === 'user' && user.role === 'admin') {
    // Admins use admin screens; keep user routes available only for non-admins.
    return <Navigate to="/admin/events" />;
  }

  return <Outlet />;
}
