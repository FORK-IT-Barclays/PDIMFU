import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowUpRight, ArrowDownRight, RefreshCcw, Filter, Play, Pause,
    AlertTriangle, CheckCircle2, Clock, Zap, CreditCard,
    Smartphone, Globe, Building2, Banknote, ShieldAlert, X, Send
} from 'lucide-react';
import { mockCustomers } from '../data/mockData';

// ───────── Transaction Generator ─────────
const txnTypes = ['CREDIT', 'DEBIT', 'TRANSFER', 'EMI_PAYMENT', 'UPI', 'NEFT', 'RTGS', 'ATM_WITHDRAWAL'];
const channels = ['UPI', 'NEFT', 'RTGS', 'IMPS', 'ATM', 'BRANCH', 'NET_BANKING', 'MOBILE_APP'];
const statusOptions = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'PENDING', 'FLAGGED', 'FAILED'];
const merchants = [
    'Amazon India', 'Flipkart', 'Swiggy', 'Zomato', 'BigBasket', 'Reliance Retail',
    'HDFC Life Insurance', 'LIC Premium', 'Airtel Recharge', 'Jio Recharge',
    'IRCTC', 'Uber India', 'Ola Cabs', 'Myntra', 'PhonePe Merchant',
    'DMart', 'Croma Electronics', 'Tata Motors EMI', 'SBI Card Payment',
    'Petrol Pump - IOCL', 'Electricity - BESCOM', 'Water Bill - Municipal',
    'Rent Transfer', 'Salary Credit', 'FD Maturity', 'Loan Disbursement',
    'Mutual Fund - SIP', 'Gold Purchase', 'Medical - Apollo', 'Education Fee'
];
const riskReasons = [
    'Unusual amount for account profile',
    'Transaction outside normal hours',
    'Rapid succession of withdrawals',
    'New merchant — first interaction',
    'Cross-state transaction detected',
    'Amount exceeds 90-day average by 3x',
    'Cash preference spike (S7 signal)',
    'Multiple failed attempts before success',
];

let txnIdCounter = 10000;

function generateTransaction(forceAccount = null) {
    const customer = forceAccount || mockCustomers[Math.floor(Math.random() * mockCustomers.length)];
    const type = txnTypes[Math.floor(Math.random() * txnTypes.length)];
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];

    const isCredit = type === 'CREDIT' || merchant === 'Salary Credit' || merchant === 'FD Maturity' || merchant === 'Loan Disbursement';
    const baseAmount = isCredit
        ? Math.floor(5000 + Math.random() * 200000)
        : Math.floor(50 + Math.random() * 50000);

    // Higher-risk accounts have higher chance of flagged transactions
    const isFlagged = status === 'FLAGGED' || (customer.risk > 0.7 && Math.random() < 0.15);
    const riskScore = isFlagged ? +(0.6 + Math.random() * 0.4).toFixed(2) : +(Math.random() * 0.4).toFixed(2);

    const now = new Date();
    now.setMinutes(now.getMinutes() - Math.floor(Math.random() * 120));

    txnIdCounter++;

    return {
        id: `TXN-${txnIdCounter}`,
        timestamp: now,
        accountId: customer.loanAccountId || customer.id,
        accountName: customer.name,
        accountTier: customer.tier,
        type,
        channel,
        status: isFlagged ? 'FLAGGED' : status,
        merchant,
        amount: baseAmount,
        isCredit,
        riskScore,
        riskReason: isFlagged ? riskReasons[Math.floor(Math.random() * riskReasons.length)] : null,
    };
}

function generateInitialTransactions(count) {
    const txns = [];
    for (let i = 0; i < count; i++) txns.push(generateTransaction());
    return txns.sort((a, b) => b.timestamp - a.timestamp);
}

// ───────── Component ─────────
const TransactionLog = () => {
    const [transactions, setTransactions] = useState(() => generateInitialTransactions(60));
    const [isLive, setIsLive] = useState(true);
    const [speed, setSpeed] = useState(2500); // ms between new txns
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [channelFilter, setChannelFilter] = useState('all');
    const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedTxn, setSelectedTxn] = useState(null);
    const [simAccount, setSimAccount] = useState('');
    const [simType, setSimType] = useState('DEBIT');
    const [simAmount, setSimAmount] = useState('');
    const tableRef = useRef(null);

    // Live transaction generator
    useEffect(() => {
        if (!isLive) return;
        const interval = setInterval(() => {
            const newTxn = generateTransaction();
            setTransactions(prev => [newTxn, ...prev].slice(0, 200));
        }, speed);
        return () => clearInterval(interval);
    }, [isLive, speed]);

    // Filtered transactions
    const filtered = useMemo(() => {
        let list = [...transactions];
        if (typeFilter !== 'all') list = list.filter(t => t.type === typeFilter);
        if (statusFilter !== 'all') list = list.filter(t => t.status === statusFilter);
        if (channelFilter !== 'all') list = list.filter(t => t.channel === channelFilter);
        if (showFlaggedOnly) list = list.filter(t => t.status === 'FLAGGED');
        return list;
    }, [transactions, typeFilter, statusFilter, channelFilter, showFlaggedOnly]);

    // Stats
    const stats = useMemo(() => {
        const total = transactions.length;
        const flagged = transactions.filter(t => t.status === 'FLAGGED').length;
        const failed = transactions.filter(t => t.status === 'FAILED').length;
        const totalVolume = transactions.reduce((s, t) => s + t.amount, 0);
        const creditVol = transactions.filter(t => t.isCredit).reduce((s, t) => s + t.amount, 0);
        const debitVol = transactions.filter(t => !t.isCredit).reduce((s, t) => s + t.amount, 0);
        return { total, flagged, failed, totalVolume, creditVol, debitVol };
    }, [transactions]);

    const formatAmount = (amt) => `₹${amt.toLocaleString('en-IN')}`;
    const formatTime = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    const handleSimulate = useCallback(() => {
        const account = simAccount ? mockCustomers.find(c => c.name.toLowerCase().includes(simAccount.toLowerCase()) || c.id.toLowerCase().includes(simAccount.toLowerCase())) : null;
        const txn = generateTransaction(account || undefined);
        txn.type = simType;
        txn.isCredit = simType === 'CREDIT';
        if (simAmount && !isNaN(parseFloat(simAmount))) txn.amount = parseInt(simAmount);
        txn.timestamp = new Date();
        setTransactions(prev => [txn, ...prev].slice(0, 200));
        setSimAmount('');
    }, [simAccount, simType, simAmount]);

    const getStatusColor = (s) => {
        switch (s) {
            case 'COMPLETED': return 'var(--tier-1)';
            case 'PENDING': return 'var(--tier-2)';
            case 'FLAGGED': return 'var(--tier-3)';
            case 'FAILED': return '#ef4444';
            default: return 'var(--text-dim)';
        }
    };

    const getStatusIcon = (s) => {
        switch (s) {
            case 'COMPLETED': return <CheckCircle2 size={11} />;
            case 'PENDING': return <Clock size={11} />;
            case 'FLAGGED': return <AlertTriangle size={11} />;
            case 'FAILED': return <X size={11} />;
            default: return null;
        }
    };

    const getChannelIcon = (ch) => {
        switch (ch) {
            case 'UPI': case 'MOBILE_APP': return <Smartphone size={12} />;
            case 'NET_BANKING': return <Globe size={12} />;
            case 'BRANCH': return <Building2 size={12} />;
            case 'ATM': return <Banknote size={12} />;
            default: return <CreditCard size={12} />;
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-container">
            <header className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1>Transaction Ledger</h1>
                    <p className="mono text-dim" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                        REAL_TIME_TRANSACTION_STREAM // SIMULATED_BANK_OPERATIONS
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {/* Live toggle */}
                    <button
                        onClick={() => setIsLive(!isLive)}
                        className="mono"
                        style={{
                            padding: '0.4rem 0.8rem', borderRadius: '0.5rem', cursor: 'pointer',
                            background: isLive ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                            border: isLive ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(244,63,94,0.3)',
                            color: isLive ? 'var(--tier-1)' : 'var(--tier-3)',
                            fontSize: '0.65rem', fontWeight: 800,
                            display: 'flex', alignItems: 'center', gap: '0.4rem'
                        }}
                    >
                        {isLive ? <><Play size={10} /> LIVE</> : <><Pause size={10} /> PAUSED</>}
                    </button>
                    {/* Speed control */}
                    <select
                        value={speed}
                        onChange={e => setSpeed(+e.target.value)}
                        className="mono"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'white', padding: '0.4rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.6rem', cursor: 'pointer' }}
                    >
                        <option value={5000}>SPEED: 0.5x</option>
                        <option value={2500}>SPEED: 1x</option>
                        <option value={1200}>SPEED: 2x</option>
                        <option value={600}>SPEED: 5x</option>
                    </select>
                    {/* Filter toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="mono"
                        style={{
                            padding: '0.4rem 0.8rem', borderRadius: '0.5rem', cursor: 'pointer',
                            background: showFilters ? 'var(--primary)' : 'transparent',
                            border: '1px solid var(--border)',
                            color: showFilters ? 'black' : 'var(--text-muted)',
                            fontSize: '0.65rem', fontWeight: 800,
                            display: 'flex', alignItems: 'center', gap: '0.4rem'
                        }}
                    >
                        <Filter size={12} /> FILTERS
                    </button>
                </div>
            </header>

            {/* Stats Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Txns', value: stats.total, color: 'var(--primary)' },
                    { label: 'Volume', value: formatAmount(stats.totalVolume), color: 'white' },
                    { label: 'Credits', value: formatAmount(stats.creditVol), color: 'var(--tier-1)' },
                    { label: 'Debits', value: formatAmount(stats.debitVol), color: 'var(--tier-2)' },
                    { label: 'Flagged', value: stats.flagged, color: 'var(--tier-3)' },
                    { label: 'Failed', value: stats.failed, color: '#ef4444' },
                ].map((s, i) => (
                    <div key={i} className="technical-card" style={{ padding: '1rem', background: 'rgba(0,0,0,0.15)' }}>
                        <div className="stat-label" style={{ fontSize: '0.55rem', marginBottom: '0.3rem' }}>{s.label}</div>
                        <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginBottom: '1rem' }}>
                        <div className="technical-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', padding: '1.25rem' }}>
                            <div>
                                <label className="stat-label" style={{ fontSize: '0.55rem', display: 'block', marginBottom: '0.4rem' }}>Type</label>
                                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="mono"
                                    style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'white', padding: '0.4rem', borderRadius: '4px', fontSize: '0.65rem' }}>
                                    <option value="all">ALL_TYPES</option>
                                    {txnTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="stat-label" style={{ fontSize: '0.55rem', display: 'block', marginBottom: '0.4rem' }}>Status</label>
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="mono"
                                    style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'white', padding: '0.4rem', borderRadius: '4px', fontSize: '0.65rem' }}>
                                    <option value="all">ALL_STATUS</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                    <option value="PENDING">PENDING</option>
                                    <option value="FLAGGED">FLAGGED</option>
                                    <option value="FAILED">FAILED</option>
                                </select>
                            </div>
                            <div>
                                <label className="stat-label" style={{ fontSize: '0.55rem', display: 'block', marginBottom: '0.4rem' }}>Channel</label>
                                <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)} className="mono"
                                    style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'white', padding: '0.4rem', borderRadius: '4px', fontSize: '0.65rem' }}>
                                    <option value="all">ALL_CHANNELS</option>
                                    {channels.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button
                                    onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
                                    className="mono"
                                    style={{
                                        width: '100%', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 800,
                                        background: showFlaggedOnly ? 'rgba(244,63,94,0.15)' : 'var(--bg-surface)',
                                        border: showFlaggedOnly ? '1px solid var(--tier-3)' : '1px solid var(--border)',
                                        color: showFlaggedOnly ? 'var(--tier-3)' : 'var(--text-dim)',
                                    }}
                                >
                                    <AlertTriangle size={11} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
                                    {showFlaggedOnly ? 'FLAGGED ONLY ✓' : 'SHOW FLAGGED ONLY'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="content-grid" style={{ gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
                <main className="main-column">
                    {/* Live indicator */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {isLive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--tier-1)', boxShadow: '0 0 10px var(--tier-1)', animation: 'pulse-op 2s infinite' }} />}
                            <span className="mono text-dim" style={{ fontSize: '0.6rem' }}>
                                {isLive ? 'LIVE STREAM ACTIVE' : 'STREAM PAUSED'} — {filtered.length} transactions
                            </span>
                        </div>
                        <button onClick={() => { setTransactions(generateInitialTransactions(60)); }} className="mono text-dim" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <RefreshCcw size={10} /> RESET
                        </button>
                    </div>

                    {/* Transaction Table */}
                    <div ref={tableRef} className="technical-card" style={{ padding: 0, maxHeight: '60vh', overflowY: 'auto' }}>
                        <table className="institutional-table">
                            <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--bg-card)' }}>
                                <tr>
                                    <th style={{ width: 70 }}>Time</th>
                                    <th>Account</th>
                                    <th>Type</th>
                                    <th>Merchant / Desc</th>
                                    <th style={{ textAlign: 'right' }}>Amount</th>
                                    <th>Channel</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence initial={false}>
                                    {filtered.slice(0, 100).map((txn) => (
                                        <motion.tr
                                            key={txn.id}
                                            initial={{ opacity: 0, backgroundColor: 'rgba(56,189,248,0.06)' }}
                                            animate={{ opacity: 1, backgroundColor: txn.status === 'FLAGGED' ? 'rgba(244,63,94,0.03)' : 'transparent' }}
                                            transition={{ duration: 0.8 }}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => setSelectedTxn(selectedTxn?.id === txn.id ? null : txn)}
                                        >
                                            <td className="mono text-dim" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                                                {formatTime(txn.timestamp)}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{txn.accountName}</div>
                                                <div className="mono text-dim" style={{ fontSize: '0.5rem' }}>{txn.accountId}</div>
                                            </td>
                                            <td>
                                                <span className="mono" style={{ fontSize: '0.6rem', fontWeight: 700, color: txn.isCredit ? 'var(--tier-1)' : 'var(--text-muted)' }}>
                                                    {txn.type}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {txn.merchant}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <span className="mono" style={{
                                                    fontSize: '0.8rem', fontWeight: 800,
                                                    color: txn.isCredit ? 'var(--tier-1)' : 'white'
                                                }}>
                                                    {txn.isCredit ? '+' : '−'}{formatAmount(txn.amount)}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-dim)' }}>
                                                    {getChannelIcon(txn.channel)}
                                                    <span className="mono" style={{ fontSize: '0.55rem' }}>{txn.channel}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="mono" style={{
                                                    fontSize: '0.6rem', fontWeight: 800, color: getStatusColor(txn.status),
                                                    display: 'flex', alignItems: 'center', gap: '0.3rem'
                                                }}>
                                                    {getStatusIcon(txn.status)} {txn.status}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </main>

                <aside className="side-column">
                    {/* Simulate Transaction */}
                    <div className="technical-card" style={{ borderColor: 'rgba(56,189,248,0.2)' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                            <Zap size={16} className="text-primary" />
                            <span className="mono" style={{ fontSize: '0.7rem', fontWeight: 900 }}>INJECT_TRANSACTION</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div>
                                <label className="stat-label" style={{ fontSize: '0.55rem', display: 'block', marginBottom: '0.3rem' }}>Account (name or ID)</label>
                                <input
                                    type="text" value={simAccount} onChange={e => setSimAccount(e.target.value)}
                                    placeholder="e.g. Aditya Sharma"
                                    className="mono"
                                    style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'white', padding: '0.4rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label className="stat-label" style={{ fontSize: '0.55rem', display: 'block', marginBottom: '0.3rem' }}>Type</label>
                                <select value={simType} onChange={e => setSimType(e.target.value)} className="mono"
                                    style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'white', padding: '0.4rem', borderRadius: '4px', fontSize: '0.65rem' }}>
                                    {txnTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="stat-label" style={{ fontSize: '0.55rem', display: 'block', marginBottom: '0.3rem' }}>Amount (₹)</label>
                                <input
                                    type="number" value={simAmount} onChange={e => setSimAmount(e.target.value)}
                                    placeholder="e.g. 25000"
                                    className="mono"
                                    style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'white', padding: '0.4rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', boxSizing: 'border-box' }}
                                />
                            </div>
                            <button
                                onClick={handleSimulate}
                                className="mono"
                                style={{
                                    width: '100%', padding: '0.7rem', borderRadius: '0.5rem', cursor: 'pointer',
                                    background: 'var(--primary)', border: 'none', color: 'black',
                                    fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.05em',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                }}
                            >
                                <Send size={13} /> INJECT
                            </button>
                        </div>
                    </div>

                    {/* Selected Transaction Detail */}
                    <AnimatePresence>
                        {selectedTxn && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="technical-card"
                                style={{ borderColor: selectedTxn.status === 'FLAGGED' ? 'rgba(244,63,94,0.3)' : 'var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span className="mono" style={{ fontSize: '0.7rem', fontWeight: 900 }}>TXN_DETAIL</span>
                                    <button onClick={() => setSelectedTxn(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                        <X size={14} className="text-dim" />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                                    {[
                                        { k: 'TXN_ID', v: selectedTxn.id },
                                        { k: 'Time', v: selectedTxn.timestamp.toLocaleString('en-IN') },
                                        { k: 'Account', v: `${selectedTxn.accountName} (${selectedTxn.accountId})` },
                                        { k: 'Tier', v: selectedTxn.accountTier },
                                        { k: 'Type', v: selectedTxn.type },
                                        { k: 'Channel', v: selectedTxn.channel },
                                        { k: 'Merchant', v: selectedTxn.merchant },
                                        { k: 'Amount', v: `${selectedTxn.isCredit ? '+' : '−'}${formatAmount(selectedTxn.amount)}` },
                                        { k: 'Status', v: selectedTxn.status },
                                        { k: 'Risk Score', v: selectedTxn.riskScore },
                                    ].map((row, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <span className="mono text-dim" style={{ fontSize: '0.55rem', flexShrink: 0 }}>{row.k}</span>
                                            <span className="mono" style={{
                                                fontSize: '0.65rem', fontWeight: 700, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word',
                                                color: row.k === 'Status' ? getStatusColor(selectedTxn.status)
                                                    : row.k === 'Amount' ? (selectedTxn.isCredit ? 'var(--tier-1)' : 'white')
                                                        : 'white'
                                            }}>{row.v}</span>
                                        </div>
                                    ))}
                                    {selectedTxn.riskReason && (
                                        <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: '0.5rem' }}>
                                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                                                <ShieldAlert size={12} className="text-red" />
                                                <span className="mono" style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--tier-3)' }}>RISK_FLAG</span>
                                            </div>
                                            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                                                {selectedTxn.riskReason}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Channel Breakdown */}
                    <div className="technical-card">
                        <div className="sidebar-section" style={{ padding: 0, marginBottom: '1rem' }}>Channel Activity</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {(() => {
                                const counts = {};
                                transactions.forEach(t => { counts[t.channel] = (counts[t.channel] || 0) + 1; });
                                const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
                                const max = sorted[0]?.[1] || 1;
                                return sorted.slice(0, 6).map(([ch, count], i) => (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                            <span className="mono text-dim" style={{ fontSize: '0.55rem' }}>{ch}</span>
                                            <span className="mono" style={{ fontSize: '0.55rem', fontWeight: 700 }}>{count}</span>
                                        </div>
                                        <div style={{ height: 3, background: 'var(--bg-surface)', borderRadius: 2 }}>
                                            <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: 'var(--primary)', borderRadius: 2, transition: 'width 0.5s' }} />
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>

                    {/* Alert Summary */}
                    <div className="technical-card glass" style={{ borderColor: 'rgba(244,63,94,0.15)' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <AlertTriangle size={14} className="text-red" />
                            <span className="mono" style={{ fontSize: '0.65rem', fontWeight: 800 }}>ANOMALY_SUMMARY</span>
                        </div>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>
                            <span className="mono text-red" style={{ fontWeight: 800 }}>{stats.flagged}</span> transactions flagged in current session.
                            {stats.flagged > 5 ? ' Elevated anomaly rate detected — manual review recommended.' : ' Anomaly rate within normal parameters.'}
                        </p>
                    </div>
                </aside>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes pulse-op { 0% { opacity:0.4; transform:scale(0.9); } 50% { opacity:1; transform:scale(1.1); } 100% { opacity:0.4; transform:scale(0.9); } }
            `}} />
        </motion.div>
    );
};

export default TransactionLog;
