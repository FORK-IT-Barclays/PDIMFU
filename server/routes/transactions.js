import express from 'express';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// ─── GET /api/transactions ─────────────────────────────────────────────
// Query: status, type, channel, loanAccountId, page, limit, sortBy, sortDir
router.get('/', async (req, res) => {
    try {
        const {
            status,
            type,
            channel,
            loanAccountId,
            page = 1,
            limit = 50,
            sortBy = 'timestamp',
            sortDir = 'desc',
        } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (channel) filter.channel = channel;
        if (loanAccountId) filter.loanAccountId = loanAccountId;

        const sort = { [sortBy]: sortDir === 'asc' ? 1 : -1 };
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [transactions, total] = await Promise.all([
            Transaction.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
            Transaction.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data: transactions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── GET /api/transactions/stats ──────────────────────────────────────
router.get('/stats', async (req, res) => {
    try {
        const [statusBreakdown, typeBreakdown, totalVolume] = await Promise.all([
            Transaction.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } },
            ]),
            Transaction.aggregate([
                { $group: { _id: '$type', count: { $sum: 1 }, total: { $sum: '$amount' } } },
            ]),
            Transaction.aggregate([
                {
                    $group: {
                        _id: null,
                        totalCount: { $sum: 1 },
                        totalAmount: { $sum: '$amount' },
                        avgAmount: { $avg: '$amount' },
                        avgRisk: { $avg: '$risk' },
                    },
                },
            ]),
        ]);

        res.json({
            success: true,
            data: {
                statusBreakdown,
                typeBreakdown,
                summary: totalVolume[0] || {},
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── GET /api/transactions/:txId ──────────────────────────────────────
router.get('/:txId', async (req, res) => {
    try {
        const tx = await Transaction.findOne({ txId: req.params.txId });
        if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
        res.json({ success: true, data: tx });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── POST /api/transactions ───────────────────────────────────────────
// Manually inject a transaction (used by TransactionLog "inject" feature)
router.post('/', async (req, res) => {
    try {
        const tx = await Transaction.create(req.body);
        res.status(201).json({ success: true, data: tx });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

export default router;
