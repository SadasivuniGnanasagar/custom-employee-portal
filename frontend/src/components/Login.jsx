import React, { useState } from 'react';
import { auth } from '../services/api';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await auth.login(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>🏢</div>
          <h1 style={styles.title}>Employee Portal</h1>
          <p style={styles.subtitle}>Sign in to access your Zoho applications</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@company.com"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Added Demo Accounts Section */}
        <div style={styles.demoBox}>
          <p style={styles.demoTitle}>Demo Accounts (Password: 123456)</p>
          <p style={styles.demoItem}><span style={styles.demoRole}>Admin:</span> admin@test.com</p>
          <p style={styles.demoItem}><span style={styles.demoRole}>HR:</span> hr@test.com</p>
          <p style={styles.demoItem}><span style={styles.demoRole}>Sales:</span> sales@test.com</p>
          <p style={styles.demoItem}><span style={styles.demoRole}>Finance:</span> finance@test.com</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    background: 'white',
    padding: '48px',
    borderRadius: '20px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
    width: '100%',
    maxWidth: '420px',
  },
  header: { textAlign: 'center', marginBottom: '30px' },
  logo: { fontSize: '48px', marginBottom: '10px' },
  title: { margin: '0 0 8px 0', fontSize: '28px', color: '#1e293b', fontWeight: '700' },
  subtitle: { margin: '0', color: '#64748b', fontSize: '14px' },
  error: {
    background: '#fee2e2',
    color: '#b91c1c',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    textAlign: 'center',
    border: '1px solid #fca5a5',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#334155' },
  input: {
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '16px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
  },
  button: {
    padding: '14px',
    borderRadius: '10px',
    border: 'none',
    background: '#4f46e5',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s, transform 0.1s',
    marginTop: '10px',
  },
  /* New Demo Box Styles */
  demoBox: {
    marginTop: '24px',
    padding: '16px',
    background: '#f8fafc',
    border: '1px dashed #cbd5e1',
    borderRadius: '10px',
    textAlign: 'center',
  },
  demoTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: '700',
    color: '#475569',
  },
  demoItem: {
    margin: '6px 0',
    fontSize: '13px',
    color: '#64748b',
  },
  demoRole: {
    fontWeight: '700',
    color: '#4f46e5',
  },
};

export default Login;