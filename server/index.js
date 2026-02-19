import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Routes
import accountRoutes from './routes/accounts.js';
import transactionRoutes from './routes/transactions.js';
import batchRoutes from './routes/batches.js';

// ─── Load environment variables ───────────────────────────────────────
dotenv.config();

// ─── Connect to MongoDB ───────────────────────────────────────────────
connectDB();

// ─── Express app setup ────────────────────────────────────────────────
const app = express();

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? 'https://your-deployed-frontend.com'  // ← change in production
        : 'http://localhost:5173',              // Vite dev server
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ───────────────────────────────────────────────────────
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/batches', batchRoutes);

// ─── Health check ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'VECTOR Terminal API is live',
        version: 'v4.0.2',
        timestamp: new Date().toISOString(),
    });
});

// ─── 404 handler ─────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.path} not found` });
});

// ─── Global error handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// ─── Start server ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀  VECTOR API running at http://localhost:${PORT}`);
    console.log(`    Health check: http://localhost:${PORT}/api/health\n`);
});
