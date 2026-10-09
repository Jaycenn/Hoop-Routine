import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useState } from 'react';
import { ErrorNotice } from './ErrorNotice.jsx';

export function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true); setError('');
    try { await logout(); navigate('/login', { replace: true }); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  return (
    <header className="app-header">
      <NavLink to="/today" className="brand" aria-label="HoopRoutine home">
        <span className="brand-mark" aria-hidden="true">HR</span>
        <span>HoopRoutine</span>
      </NavLink>

      <nav className="main-nav" aria-label="Main navigation">
        <NavLink to="/today">Today</NavLink>
        <NavLink to="/history">History</NavLink>
        <NavLink to="/progress">Progress</NavLink>
      </nav>

      <div className="account-menu">
        <span className="account-name">{user?.name}</span>
        <button className="text-button" type="button" disabled={busy} onClick={handleLogout}>{busy ? 'Logging out…' : 'Log out'}</button>
        <ErrorNotice message={error} />
      </div>
    </header>
  );
}

