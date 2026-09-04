require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const zohoRoutes = require('./src/routes/zohoRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());

// Critical: Explicitly handle the OPTIONS (Preflight) request
app.options('*', cors());

// --- HARDCODED USERS ---
const users = [
    { id: 1, email: "admin@test.com", password: "123456", name: "Admin User", role: "admin", status: "active" },
    { id: 2, email: "hr@test.com", password: "123456", name: "HR User", role: "hr", status: "active" },
    { id: 3, email: "sales@test.com", password: "123456", name: "Sales User", role: "sales", status: "active" },
    { id: 4, email: "finance@test.com", password: "123456", name: "Finance User", role: "finance", status: "active" }
];

// --- SALES DATA ---
const salesData = {
    week: { total: 42, revenue: 15200, categories: [{ name: 'Electronics', count: 15 }, { name: 'Clothing', count: 12 }, { name: 'Home & Kitchen', count: 9 }, { name: 'Sports', count: 6 }] },
    month: { total: 185, revenue: 64000, categories: [{ name: 'Electronics', count: 65 }, { name: 'Clothing', count: 54 }, { name: 'Home & Kitchen', count: 38 }, { name: 'Sports', count: 28 }] },
    year: { total: 2200, revenue: 780000, categories: [{ name: 'Electronics', count: 800 }, { name: 'Clothing', count: 650 }, { name: 'Home & Kitchen', count: 450 }, { name: 'Sports', count: 300 }] }
};

// --- DUMMY ROUTES TO STOP AUTO-LOGOUT ---
app.get('/api/auth/me', (req, res) => {
    const userEmail = req.headers['x-user-email']; 
    const user = users.find(u => u.email === userEmail);
    if (user) res.json({ email: user.email, name: user.name, role: user.role });
    else res.json({ email: "admin@test.com", name: "Admin User", role: "admin" });
});

app.get('/api/users', (req, res) => {
    const safeUsers = users.map(({ password, ...rest }) => rest);
    res.json(safeUsers);
});

app.put('/api/users/:id/status', (req, res) => {
    const userId = parseInt(req.params.id);
    const newStatus = req.body.status;
    const user = users.find(u => u.id === userId);
    if (user) {
        user.status = newStatus;
        res.json({ success: true, message: `User status updated to ${newStatus}` });
    } else res.status(404).json({ success: false, message: "User not found" });
});

app.get('/api/zoho/apps', (req, res) => {
    res.json([
        { app: 'people', label: 'Zoho People', description: 'HR and employee management', role: 'hr' },
        { app: 'crm', label: 'Zoho CRM', description: 'Customer relationship management', role: 'sales' },
        { app: 'desk', label: 'Zoho Desk', description: 'Customer support and ticket management', role: 'support' },
        { app: 'books', label: 'Zoho Books', description: 'Finance and accounting', role: 'finance' }
    ]);
});

app.get('/api/zoho/transactions', (req, res) => {
    res.json([
        { id: 1, description: 'Invoice #001 - Client A', amount: 1500.00, date: '2026-09-01' },
        { id: 2, description: 'Expense - Office Supplies', amount: -120.50, date: '2026-09-02' }
    ]);
});

app.get('/api/zoho/sales', (req, res) => {
    const period = req.query.period || 'week';
    res.json(salesData[period] || salesData.week);
});

// --- TICKETS API (UPDATED) ---
let tickets = [
    { id: 'TK-1001', subject: 'Cannot reset password', customer: 'John Doe', status: 'Open', priority: 'High', date: '2026-09-04' },
    { id: 'TK-1002', subject: 'Email not syncing to Outlook', customer: 'Jane Smith', status: 'In Progress', priority: 'Medium', date: '2026-09-03' },
    { id: 'TK-1003', subject: 'Request for new laptop', customer: 'Mike Johnson', status: 'Resolved', priority: 'Low', date: '2026-09-01' },
    { id: 'TK-1004', subject: 'Software installation issue', customer: 'Sarah Lee', status: 'Open', priority: 'High', date: '2026-09-02' }
];

app.get('/api/zoho/tickets', (req, res) => {
    res.json(tickets);
});

app.put('/api/zoho/tickets/:id/status', (req, res) => {
    const ticketId = req.params.id;
    const newStatus = req.body.status;

    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
        ticket.status = newStatus;
        res.json({ success: true, message: `Ticket status updated to ${newStatus}` });
    } else {
        res.status(404).json({ success: false, message: "Ticket not found" });
    }
});
// ------------------------------------------------------------------------

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/zoho', zohoRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ success: false, message: "Invalid email or password" });
    if (user.status === 'restricted' || user.status === 'inactive') return res.status(403).json({ success: false, message: "Your account has been restricted by HR." });
    res.json({ success: true, message: "Login successful!", token: "fake-jwt-token-12345", user: { email: user.email, name: user.name, role: user.role } });
});

// CRITICAL CHANGE: Bind to 0.0.0.0 for Render
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));