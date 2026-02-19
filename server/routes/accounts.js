import express from 'express';
import LoanAccount from '../models/LoanAccount.js';

const router = express.Router();

// ─── GET /api/accounts ───────────────────────────────────────────────
// Query params: tier, diagnosis, search, page, limit, sortBy, sortDir
router.get('/', async (req, res) => {
    try {
        const {
            tier,
            diagnosis,
            search,
            page = 1,
            limit = 50,
            sortBy = 'risk',
            sortDir = 'desc',
        } = req.query;

        const filter = {};
        if (tier) filter.tier = tier;
        if (diagnosis) filter.diagnosis = diagnosis;
        if (search) filter.$text = { $search: search };

        const sort = { [sortBy]: sortDir === 'asc' ? 1 : -1 };
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [accounts, total] = await Promise.all([
            LoanAccount.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .select('-history -__v'), // exclude heavy history array in list view
            LoanAccount.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data: accounts,
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

// ─── GET /api/accounts/:id ─────────────────────────────────────────────
// Returns full account including history (for CustomerSearch detail view)
router.get('/:id', async (req, res) => {
    try {
        const account = await LoanAccount.findOne({
            $or: [{ id: req.params.id }, { loanAccountId: req.params.id }],
        });
        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }
        res.json({ success: true, data: account });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── GET /api/accounts/:id/interventions ─────────────────────────────
router.get('/:id/interventions', async (req, res) => {
    try {
        const account = await LoanAccount.findOne({ id: req.params.id }).select('interventions name');
        if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
        res.json({ success: true, data: account.interventions, name: account.name });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── POST /api/accounts/:id/interventions ────────────────────────────
router.post('/:id/interventions', async (req, res) => {
    try {
        const { type, outcome } = req.body;
        if (!type || !outcome) {
            return res.status(400).json({ success: false, message: 'type and outcome are required' });
        }
        const account = await LoanAccount.findOneAndUpdate(
            { id: req.params.id },
            {
                $push: {
                    interventions: {
                        date: new Date().toISOString().split('T')[0],
                        type,
                        outcome,
                    },
                },
            },
            { new: true }
        );
        if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
        res.status(201).json({ success: true, data: account.interventions.at(-1) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── GET /api/accounts/stats/portfolio ────────────────────────────────
// Aggregate portfolio statistics used by Dashboard
router.get('/stats/portfolio', async (req, res) => {
    try {
        const [total, tierCounts, diagnosisCounts, velocityStats] = await Promise.all([
            LoanAccount.countDocuments(),
            LoanAccount.aggregate([
                { $group: { _id: '$tier', count: { $sum: 1 }, avgRisk: { $avg: '$risk' } } },
            ]),
            LoanAccount.aggregate([
                { $group: { _id: '$diagnosis', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            LoanAccount.aggregate([
                {
                    $group: {
                        _id: null,
                        avgRisk: { $avg: '$risk' },
                        avgVelocity: { $avg: '$velocity' },
                        avgAccel: { $avg: '$accel' },
                        highVelocity: {
                            $sum: { $cond: [{ $gt: ['$velocity', 0.08] }, 1, 0] },
                        },
                        recovering: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $lt: ['$velocity', 0] },
                                            { $lt: ['$accel', 0] },
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]),
        ]);

        const tiers = {};
        tierCounts.forEach(t => (tiers[t._id] = { count: t.count, avgRisk: t.avgRisk }));

        res.json({
            success: true,
            data: {
                total,
                tiers,
                diagnosisDistribution: diagnosisCounts.map(d => ({
                    diagnosis: d._id,
                    count: d.count,
                })),
                velocityStats: velocityStats[0] || {},
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
