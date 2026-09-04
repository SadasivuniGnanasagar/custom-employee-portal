import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setIsAdmin(parsed?.roles?.includes('Admin') || false);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAdmin(userData?.roles?.includes('Admin') || false);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdmin(false);
  };

  const isAdminRoute = window.location.pathname === '/admin';

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (isAdminRoute && isAdmin) {
    return <AdminPanel />;
  }

  if (isAdminRoute && !isAdmin) {
    window.location.href = '/';
    return null;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}

export default App;