import React, { useState, useEffect } from 'react';
import { zoho, auth, users } from '../services/api';

function Dashboard({ onLogout }) {
  const [user] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : { name: 'Employee', email: 'unknown', role: 'employee' };
  });

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showTransactions, setShowTransactions] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [managedUsers, setManagedUsers] = useState([]);
  const [showSales, setShowSales] = useState(false);
  const [salesData, setSalesData] = useState({ total: 0, revenue: 0, categories: [] });
  const [salesPeriod, setSalesPeriod] = useState('week');
  const [showDesk, setShowDesk] = useState(false);
  const [tickets, setTickets] = useState([]);

  useEffect(() => { fetchApps(); }, []);

  const fetchApps = async () => {
    try {
      const data = await zoho.getApps();
      setApps(Array.isArray(data) ? data : (data.apps || []));
    } catch (err) { setError('Failed to load applications'); } 
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try { await auth.logout(); } 
    catch (err) {} 
    finally {
      localStorage.removeItem('token'); localStorage.removeItem('user'); onLogout();
    }
  };

  const fetchSales = async (period) => {
    setSalesPeriod(period);
    try {
      const data = await zoho.getSales(period);
      setSalesData(data);
    } catch (err) { setError('Failed to load sales data'); }
  };

  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    try {
      await zoho.updateTicketStatus(ticketId, newStatus);
      setTickets(prevTickets => prevTickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    } catch (err) { setError('Failed to update ticket status'); }
  };

  const handleOpenApp = async (app) => {
    if (app.app === 'books') { setShowTransactions(true); try { const data = await zoho.getTransactions(); setTransactions(data); } catch (err) { setError('Failed to load transactions'); } }
    else if (app.app === 'people') { setShowUserManagement(true); try { const data = await users.getAll(); setManagedUsers(data); } catch (err) { setError('Failed to load users'); } }
    else if (app.app === 'crm') { setShowSales(true); fetchSales('week'); }
    else if (app.app === 'desk') { setShowDesk(true); try { const data = await zoho.getTickets(); setTickets(data); } catch (err) { setError('Failed to load tickets'); } }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'restricted' : 'active';
    await users.updateStatus(userId, newStatus);
    const updatedUsers = managedUsers.map(u => u.id === userId ? { ...u, status: newStatus } : u);
    setManagedUsers(updatedUsers);
  };

  const isAdmin = user?.role === 'admin';
  const visibleApps = apps.filter(app => isAdmin || app.role === user.role);

  const goBack = () => {
    setShowDesk(false); setShowSales(false); setShowUserManagement(false); setShowTransactions(false);
  };

  return (
    <div style={styles.appContainer}>
      {/* Top Navbar */}
      <header style={styles.navbar}>
        <div style={styles.logoSection}>
          <span style={styles.logo}>🏢</span>
          <span style={styles.brand}>Employee Portal</span>
        </div>
        <div style={styles.userSection}>
          <div style={styles.userInfo}>
            <div style={styles.userName}>{user.name}</div>
            <div style={styles.userRole}>{user.role}</div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        {/* VIEW: DESK / TICKETS */}
        {showDesk ? (
          <div>
            <button onClick={goBack} style={styles.backButton}>← Back</button>
            <h2 style={styles.pageTitle}>Zoho Desk - Helpdesk</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th style={styles.th}>Ticket</th>
                    <th style={styles.th}>Subject</th>
                    <th style={styles.th}>Customer</th>
                    <th style={styles.th}>Priority</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => {
                    const isClosed = t.status === 'Resolved' || t.status === 'Closed';
                    return (
                      <tr key={t.id} style={styles.tr}>
                        <td style={styles.td}><b>{t.id}</b></td>
                        <td style={styles.td}>{t.subject}</td>
                        <td style={styles.td}>{t.customer}</td>
                        <td style={styles.td}>{t.priority}</td>
                        <td style={styles.td}>
                          <span style={{...styles.badge, background: isClosed ? '#dcfce7' : '#fef3c7', color: isClosed ? '#166534' : '#854d0e'}}>
                            {t.status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <button 
                            style={{...styles.smallButton, background: isClosed ? '#10b981' : '#ef4444'}}
                            onClick={() => handleUpdateTicketStatus(t.id, isClosed ? 'Open' : 'Closed')}
                          >
                            {isClosed ? 'Reopen' : 'Close'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : showSales ? (
          /* VIEW: SALES */
          <div>
            <button onClick={goBack} style={styles.backButton}>← Back</button>
            <h2 style={styles.pageTitle}>Sales Dashboard</h2>
            <div style={styles.tabs}>
              {['week', 'month', 'year'].map(period => (
                <button 
                  key={period}
                  onClick={() => fetchSales(period)}
                  style={{...styles.tabButton, background: salesPeriod === period ? '#4f46e5' : '#e2e8f0', color: salesPeriod === period ? 'white' : '#334155'}}
                >
                  {period.toUpperCase()}
                </button>
              ))}
            </div>
            <div style={styles.summaryGrid}>
              <div style={styles.summaryCard}>
                <div style={styles.summaryLabel}>Total Sales</div>
                <div style={styles.summaryValue}>{salesData.total}</div>
              </div>
              <div style={styles.summaryCard}>
                <div style={styles.summaryLabel}>Revenue</div>
                <div style={styles.summaryValue}>${salesData.revenue.toLocaleString()}</div>
              </div>
            </div>
            <h3 style={styles.sectionTitle}>Top Categories this {salesPeriod}</h3>
            <div style={styles.card}>
              {salesData.categories.map(cat => (
                <div key={cat.name} style={styles.categoryRow}>
                  <span style={styles.categoryName}>{cat.name}</span>
                  <div style={styles.barContainer}>
                    <div style={{...styles.bar, width: `${(cat.count / salesData.total) * 100}%`}}></div>
                  </div>
                  <span style={styles.categoryCount}>{cat.count}</span>
                </div>
              ))}
            </div>
          </div>
        ) : showUserManagement ? (
          /* VIEW: HR */
          <div>
            <button onClick={goBack} style={styles.backButton}>← Back</button>
            <h2 style={styles.pageTitle}>Employee Management</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {managedUsers.map(u => (
                    <tr key={u.id} style={styles.tr}>
                      <td style={styles.td}><b>{u.name}</b></td>
                      <td style={styles.td}>{u.email}</td>
                      <td style={styles.td}>{u.role}</td>
                      <td style={styles.td}>
                        <span style={{...styles.badge, background: u.status === 'active' ? '#dcfce7' : '#fee2e2', color: u.status === 'active' ? '#166534' : '#991b1b'}}>
                          {u.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button 
                          style={{...styles.smallButton, background: u.status === 'active' ? '#ef4444' : '#10b981'}}
                          onClick={() => toggleUserStatus(u.id, u.status)}
                        >
                          {u.status === 'active' ? 'Restrict' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : showTransactions ? (
          /* VIEW: FINANCE */
          <div>
            <button onClick={goBack} style={styles.backButton}>← Back</button>
            <h2 style={styles.pageTitle}>Financial Transactions</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th style={styles.th}>Description</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id} style={styles.tr}>
                      <td style={styles.td}>{t.description}</td>
                      <td style={{...styles.td, color: t.amount < 0 ? '#ef4444' : '#10b981'}}>
                        {t.amount < 0 ? '-' : '+'}${Math.abs(t.amount).toFixed(2)}
                      </td>
                      <td style={styles.td}>{t.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* DEFAULT DASHBOARD VIEW */
          <>
            <div style={styles.headerArea}>
              <h2 style={styles.pageTitle}>Welcome, {user.name}!</h2>
              <p style={styles.pageSubtitle}>Select an application below to get started.</p>
            </div>

            <div style={styles.accountCard}>
              <div style={styles.cardHeader}>Account Information</div>
              <div style={styles.cardBody}>
                <div style={styles.infoRow}><b>Name:</b> {user.name}</div>
                <div style={styles.infoRow}><b>Email:</b> {user.email}</div>
                <div style={styles.infoRow}><b>Role:</b> {user.role}</div>
              </div>
            </div>

            <h3 style={styles.sectionTitle}>Authorized Zoho Services</h3>
            {loading ? (
              <div style={styles.loading}>Loading...</div>
            ) : error ? (
              <div style={styles.error}>{error}</div>
            ) : (
              <div style={styles.appGrid}>
                {visibleApps.map((app) => (
                  <div key={app.app} style={styles.appCard} onClick={() => handleOpenApp(app)}>
                    <div style={styles.appIcon}>{getIcon(app.app)}</div>
                    <div style={styles.appName}>{app.label}</div>
                    <div style={styles.appDesc}>{app.description}</div>
                    <button style={styles.openButton}>Open Service →</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Helper function for nice icons
function getIcon(app) {
  switch(app) {
    case 'people': return '👥';
    case 'crm': return '📈';
    case 'desk': return '🎧';
    case 'books': return '💰';
    default: return '📦';
  }
}

const styles = {
  appContainer: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '16px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  logoSection: { display: 'flex', alignItems: 'center', gap: '10px' },
  logo: { fontSize: '24px' },
  brand: { fontSize: '20px', fontWeight: '800', color: '#1e293b' },
  userSection: { display: 'flex', alignItems: 'center', gap: '20px' },
  userInfo: { textAlign: 'right' },
  userName: { fontWeight: '600', color: '#1e293b' },
  userRole: { fontSize: '12px', color: '#64748b', textTransform: 'capitalize' },
  logoutBtn: { padding: '8px 16px', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', color: '#64748b', fontWeight: '500' },
  mainContent: { maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' },
  headerArea: { marginBottom: '30px' },
  pageTitle: { margin: '0 0 10px 0', fontSize: '28px', color: '#1e293b', fontWeight: '700' },
  pageSubtitle: { margin: '0', color: '#64748b' },
  backButton: { marginBottom: '20px', padding: '10px 20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' },
  
  // Cards & Grids
  sectionTitle: { fontSize: '18px', margin: '30px 0 15px 0', color: '#1e293b' },
  card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  accountCard: { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  cardHeader: { padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#334155' },
  cardBody: { padding: '20px 24px' },
  infoRow: { marginBottom: '8px', color: '#475569' },

  // App Grid
  appGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' },
  appCard: { background: 'white', borderRadius: '12px', padding: '24px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' },
  appIcon: { fontSize: '40px', marginBottom: '10px' },
  appName: { fontSize: '18px', fontWeight: '700', marginBottom: '8px' },
  appDesc: { fontSize: '14px', color: '#64748b', marginBottom: '20px' },
  openButton: { background: '#1e293b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },

  // Tables
  tableContainer: { background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8fafc' },
  th: { textAlign: 'left', padding: '16px', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase', fontWeight: '700' },
  tr: { borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' },
  td: { padding: '16px', color: '#334155', fontSize: '14px' },

  // Badges and Buttons
  badge: { padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '700' },
  smallButton: { color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },

  // Sales Elements
  tabs: { display: 'flex', gap: '10px', marginBottom: '20px' },
  tabButton: { padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' },
  summaryCard: { background: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  summaryLabel: { fontSize: '14px', color: '#64748b', marginBottom: '10px' },
  summaryValue: { fontSize: '36px', fontWeight: '800', color: '#1e293b' },
  categoryRow: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' },
  categoryName: { width: '140px', fontWeight: '600' },
  barContainer: { flex: 1, background: '#e2e8f0', borderRadius: '999px', height: '10px', overflow: 'hidden' },
  bar: { height: '100%', background: 'linear-gradient(to right, #4f46e5, #9333ea)' },
  categoryCount: { width: '60px', textAlign: 'right', fontWeight: '600' },

  loading: { textAlign: 'center', padding: '40px', color: '#64748b' },
  error: { background: '#fee2e2', color: '#b91c1c', padding: '20px', borderRadius: '8px', textAlign: 'center' },
};

export default Dashboard;