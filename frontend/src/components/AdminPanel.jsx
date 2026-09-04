import React, { useState, useEffect } from 'react';
import { users } from '../services/api';

function AdminPanel() {
  const [userList, setUserList] = useState([]);
  const [roleList, setRoleList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  // New user form
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    roleIds: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData, logsData] = await Promise.all([
        users.getAll(),
        users.getRoles(),
        users.getAuditLogs({ limit: 50 }),
      ]);
      setUserList(usersData || []);
      setRoleList(rolesData || []);
      setAuditLogs(logsData || []);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await users.create(newUser);
      setNewUser({ email: '', password: '', full_name: '', roleIds: [] });
      fetchData();
    } catch (err) {
      alert('Failed to create user: ' + err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await users.delete(id);
      fetchData();
    } catch (err) {
      alert('Failed to delete user: ' + err.message);
    }
  };

  const handleToggleRole = (userId, roleId) => {
    const user = userList.find(u => u.id === userId);
    const currentRoles = user?.roles || [];
    const hasRole = currentRoles.includes(roleList.find(r => r.id === roleId)?.name);

    // For demo: just update local state and show message
    // In production, call API to update user roles
    alert(`Toggle role ${roleId} for user ${userId} (${hasRole ? 'remove' : 'add'})`);
  };

  if (loading) {
    return <div style={styles.loading}>Loading admin panel...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🔧 Admin Panel</h1>

      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab === 'users' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'audit' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('audit')}
        >
          Audit Logs
        </button>
      </div>

      {activeTab === 'users' && (
        <div>
          {/* Create User Form */}
          <div style={styles.card}>
            <h3>Create New User</h3>
            <form onSubmit={handleCreateUser} style={styles.form}>
              <div style={styles.formRow}>
                <input
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  style={styles.formInput}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  style={styles.formInput}
                  required
                />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  style={styles.formInput}
                  required
                />
                <select
                  multiple
                  value={newUser.roleIds.map(String)}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, opt => parseInt(opt.value));
                    setNewUser({ ...newUser, roleIds: selected });
                  }}
                  style={styles.formSelect}
                >
                  {roleList.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                <button type="submit" style={styles.button}>Create User</button>
              </div>
            </form>
          </div>

          {/* User List */}
          <div style={styles.card}>
            <h3>All Users</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {userList.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>
                      {user.roles?.filter(r => r).join(', ') || 'None'}
                    </td>
                    <td>{user.is_active ? '✅ Active' : '❌ Inactive'}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        style={styles.dangerButton}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div style={styles.card}>
          <h3>Audit Logs</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                  <td>{log.full_name || log.email || 'System'}</td>
                  <td>{log.action}</td>
                  <td>{log.details ? JSON.stringify(log.details) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    margin: '0 0 24px 0',
    fontSize: '28px',
    color: '#333',
  },
  loading: {
    textAlign: 'center',
    padding: '60px 0',
    color: '#666',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
  },
  tab: {
    padding: '10px 24px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    background: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  tabActive: {
    background: '#667eea',
    color: 'white',
    borderColor: '#667eea',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    marginBottom: '24px',
  },
  form: {
    marginTop: '16px',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  formInput: {
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    flex: '1',
    minWidth: '150px',
  },
  formSelect: {
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    minWidth: '150px',
    height: '80px',
  },
  button: {
    padding: '10px 24px',
    borderRadius: '6px',
    border: 'none',
    background: '#667eea',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
  },
  dangerButton: {
    padding: '6px 14px',
    borderRadius: '6px',
    border: 'none',
    background: '#e74c3c',
    color: 'white',
    cursor: 'pointer',
    fontSize: '12px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
};

export default AdminPanel;