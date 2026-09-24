import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { ErrorNotice } from '../components/ErrorNotice.jsx';
import { LoadingScreen } from '../components/LoadingScreen.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function AuthPage() {
  const { user, loading, login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/today" replace />;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (mode === 'register') await register(form);
      else await login({ email: form.email, password: form.password });
      navigate(location.state?.from || '/today', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="auth-brand">
          <span className="brand-mark brand-mark--light">HR</span>
          <span>HoopRoutine</span>
        </div>
        <div className="court-lines" aria-hidden="true" />
        <div className="auth-message">
          <span className="eyebrow eyebrow--light">Your work. Your numbers.</span>
          <h1>Train with<br />purpose.</h1>
          <p>A complete basketball session, ready when you are.</p>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <span className="eyebrow">Welcome to HoopRoutine</span>
          <h2>{mode === 'login' ? 'Pick up where you left off.' : 'Start building your game.'}</h2>
          <p className="muted">
            {mode === 'login'
              ? 'Log in to access your workouts and progress.'
              : 'Create an account to keep your results in one place.'}
          </p>

          <div className="auth-tabs" role="tablist" aria-label="Account action">
            <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => setMode('login')}>Log in</button>
            <button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => setMode('register')}>Create account</button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <label className="field">
                <span className="field-label">Name</span>
                <input value={form.name} onChange={(event) => update('name', event.target.value)} autoComplete="name" required minLength="2" />
              </label>
            )}
            <label className="field">
              <span className="field-label">Email</span>
              <input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" required />
            </label>
            <label className="field">
              <span className="field-label">Password</span>
              <input type="password" value={form.password} onChange={(event) => update('password', event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength="8" />
              {mode === 'register' && <span className="field-hint">At least 8 characters</span>}
            </label>
            <ErrorNotice message={error} />
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}

