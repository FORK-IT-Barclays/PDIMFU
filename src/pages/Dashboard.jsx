import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Info, Activity, ShieldCheck, AlertTriangle, TrendingUp, TrendingDown, Users, DollarSign, Target, Clock, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { portfolioStats, mockCustomers, batchProcessor } from '../data/mockData';
import '../App.css';

const TIER_COLORS = {
    'Tier 3': 'var(--tier-3)',
    'Tier 2': 'var(--tier-2)',
    'Tier 1': 'var(--tier-1)',
};

const Dashboard = () => {
    const [timeRange, setTimeRange] = useState(30);

    const chartData = useMemo(() => {
        const data = portfolioStats.fleetHistory.slice(-timeRange);
        return data.map((val, i) => ({
            index: i,
            risk: val.toFixed(1),
            date: new Date(Date.now() - (timeRange - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short'
            })
        }));
    }, [timeRange]);

    // Compute meaningful stats from mock data
    const t3Count = mockCustomers.filter(c => c.tier === 'Tier 3').length;
    const t2Count = mockCustomers.filter(c => c.tier === 'Tier 2').length;
    const t1Count = mockCustomers.filter(c => c.tier === 'Tier 1').length;

    const avgRisk = (mockCustomers.reduce((s, c) => s + c.risk, 0) / mockCustomers.length * 100).toFixed(1);
    const highVelocityCount = mockCustomers.filter(c => c.velocity > 0.08).length;
    const acceleratingCount = mockCustomers.filter(c => c.accel > 0.005).length;
    const recoveringCount = mockCustomers.filter(c => c.velocity < 0 && c.accel < 0).length;

    const pieData = [
        { name: 'Tier 3 (Critical)', value: t3Count, color: '#f43f5e' },
        { name: 'Tier 2 (Warning)', value: t2Count, color: '#fbbf24' },
        { name: 'Tier 1 (Watch)', value: t1Count, color: '#10b981' },
    ];

    const diagnosisData = portfolioStats.diagnosisDistribution.map(d => ({
        name: d.diagnosis.length > 14 ? d.diagnosis.substring(0, 14) + '…' : d.diagnosis,
        fullName: d.diagnosis,
        count: d.count,
        fill: d.diagnosis.includes('SPIRAL') || d.diagnosis.includes('ACCELERATION') ? '#f43f5e'
            : d.diagnosis.includes('DECLINE') || d.diagnosis.includes('STABLE') ? '#fbbf24'
                : '#10b981',
    }));

    // Recent signal events (derived from data)
    const signalEvents = useMemo(() => {
        const events = [];
        mockCustomers.slice(0, 8).forEach(c => {
            const maxSignal = Object.entries(c.signals).reduce((max, [k, v]) => v > max.v ? { k, v } : max, { k: 's1', v: 0 });
            const signalNames = { s1: 'PAY_DRIFT', s2: 'LIQUIDITY', s3: 'EXHAUSTION', s4: 'SPEND_VEL', s5: 'APP_DECAY', s6: 'EXTERNAL', s7: 'CASH_SHIFT', s8: 'FAILURE' };
            events.push({
                time: `${String(23 - events.length).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                name: c.name,
                signal: `${maxSignal.k.toUpperCase()}: ${signalNames[maxSignal.k]}`,
                value: maxSignal.v.toFixed(2),
                color: maxSignal.v > 0.7 ? 'var(--tier-3)' : maxSignal.v > 0.5 ? 'var(--tier-2)' : 'var(--tier-1)',
            });
        });
        return events;
    }, []);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-container">
            <header className="page-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1>Portfolio Overwatch</h1>
                    <p className="mono text-dim" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>LOAN_ACCOUNTS_MONITORED // BATCH_PROCESSED // ADMIN_VIEW</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="mono" style={{ fontSize: '0.65rem', padding: '0.4rem 0.8rem', background: 'var(--tier-1-soft)', color: 'var(--tier-1)', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        SYSTEM_HEALTH: OPTIMAL
                    </div>
                </div>
            </header>

            {/* KPI Cards Row */}
            <div className="stats-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {[
                    { label: 'Monitored Accounts', value: portfolioStats.totalLoanAccounts?.toLocaleString() ?? '—', delta: `Batch ${batchProcessor.lastBatchId}`, up: false, desc: 'Total loan book', icon: Users },
                    { label: 'Total Exposure', value: portfolioStats.totalExposure, delta: '+2.4%', up: true, desc: 'Outstanding principal', icon: DollarSign },
                    { label: 'At-Risk Exposure', value: portfolioStats.atRiskExposure, delta: `${t3Count} T3 accounts`, up: true, desc: 'T3 segment exposure', icon: AlertTriangle },
                    { label: 'Avg Portfolio Risk', value: `${avgRisk}%`, delta: portfolioStats.portfolioVelocity, up: parseFloat(portfolioStats.portfolioVelocity) > 0, desc: 'Weighted kinetic avg', icon: Target },
                    { label: 'Collection Efficiency', value: portfolioStats.collectionEfficiency.current, delta: portfolioStats.collectionEfficiency.delta, up: false, desc: 'vs prev period', icon: TrendingUp },
                ].map((stat, i) => (
                    <div key={i} className="technical-card" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div className="stat-label" style={{ fontSize: '0.6rem' }}>{stat.label}</div>
                            <stat.icon size={14} className="text-dim" />
                        </div>
                        <div className="stat-value" style={{ fontSize: '1.6rem', fontWeight: 900 }}>{stat.value}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                            <div className={`mono ${stat.up ? 'text-red' : 'text-green'}`} style={{ fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                {stat.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />} {stat.delta}
                            </div>
                            <div className="mono text-dim" style={{ fontSize: '0.5rem' }}>{stat.desc}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Secondary KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Active Interventions', value: portfolioStats.activeInterventions, color: 'var(--primary)' },
                    { label: 'Intervention Success Rate', value: `${portfolioStats.interventionSuccessRate}%`, color: 'var(--tier-1)' },
                    { label: 'High-Velocity Accounts', value: highVelocityCount, color: 'var(--tier-3)' },
                    { label: 'Recovering Accounts', value: recoveringCount, color: 'var(--tier-1)' },
                ].map((m, i) => (
                    <div key={i} className="technical-card" style={{ padding: '1rem', background: 'rgba(0,0,0,0.15)' }}>
                        <div className="stat-label" style={{ fontSize: '0.55rem', marginBottom: '0.3rem' }}>{m.label}</div>
                        <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: m.color }}>{m.value}</div>
                    </div>
                ))}
            </div>

            <div className="content-grid" style={{ gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
                <main className="main-column">
                    {/* Portfolio Kinetic Chart */}
                    <div className="technical-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                            <div className="sidebar-section" style={{ margin: 0, padding: 0 }}>Loan Portfolio Kinetic Trajectory</div>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                {[7, 30, 90].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setTimeRange(r)}
                                        className={`mono ${timeRange === r ? 'active' : ''}`}
                                        style={{
                                            background: timeRange === r ? 'var(--primary)' : 'transparent',
                                            border: '1px solid var(--border)', color: timeRange === r ? 'black' : 'var(--text-dim)',
                                            padding: '0.2rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 800
                                        }}
                                    >
                                        {r}D
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ height: 240 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorFleet" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                                    <XAxis dataKey="date" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '10px' }} />
                                    <Area type="monotone" dataKey="risk" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorFleet)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Two-column charts */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {/* Tier Distribution Pie */}
                        <div className="technical-card">
                            <div className="sidebar-section" style={{ margin: 0, padding: 0, marginBottom: '1rem' }}>Tier Distribution</div>
                            <div style={{ height: 200 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3} strokeWidth={0}>
                                            {pieData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '10px' }} />
                                        <Legend
                                            formatter={(value) => <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>{value}</span>}
                                            iconSize={8}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Diagnosis Distribution Bar */}
                        <div className="technical-card">
                            <div className="sidebar-section" style={{ margin: 0, padding: 0, marginBottom: '1rem' }}>Diagnosis Breakdown</div>
                            <div style={{ height: 200 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={diagnosisData} layout="vertical" barSize={12}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="name" width={90} tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '10px' }}
                                            formatter={(value, name, props) => [value, props.payload.fullName]}
                                        />
                                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                            {diagnosisData.map((entry, i) => (
                                                <Cell key={i} fill={entry.fill} fillOpacity={0.8} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Daily Trends Chart */}
                    <div className="technical-card">
                        <div className="sidebar-section" style={{ margin: 0, padding: 0, marginBottom: '1rem' }}>Weekly Operations Trend</div>
                        <div style={{ height: 200 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={portfolioStats.dailyTrends} barGap={2}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                                    <XAxis dataKey="day" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '10px' }} />
                                    <Bar dataKey="newT3" name="New T3 Escalations" fill="#f43f5e" radius={[3, 3, 0, 0]} barSize={14} />
                                    <Bar dataKey="resolved" name="Cases Resolved" fill="#10b981" radius={[3, 3, 0, 0]} barSize={14} />
                                    <Bar dataKey="interventions" name="Interventions Fired" fill="#38bdf8" radius={[3, 3, 0, 0]} barSize={14} opacity={0.5} />
                                    <Legend
                                        formatter={(value) => <span style={{ color: 'var(--text-muted)', fontSize: '0.55rem' }}>{value}</span>}
                                        iconSize={8}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Signal Event Log */}
                    <div className="technical-card" style={{ padding: 0 }}>
                        <div className="sidebar-section" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
                            Operational Signal Log
                        </div>
                        <table className="institutional-table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Loan Account</th>
                                    <th>Signal Phase</th>
                                    <th>V-Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {signalEvents.map((row, i) => (
                                    <tr key={i}>
                                        <td className="mono text-dim" style={{ fontSize: '0.7rem' }}>{row.time}</td>
                                        <td style={{ fontWeight: 800, fontSize: '0.85rem' }}>{row.name}</td>
                                        <td><span className="mono" style={{ fontSize: '0.65rem', color: row.color, fontWeight: 800 }}>{row.signal}</span></td>
                                        <td className="mono" style={{ fontWeight: 800 }}>{row.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>

                <aside className="side-column">
                    {/* Health Intelligence */}
                    <div className="technical-card" style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                            <Info size={14} className="text-primary" />
                            <span className="mono" style={{ fontSize: '0.7rem', fontWeight: 800 }}>HEALTH_INTELLIGENCE</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                            Loan portfolio is currently <span className="text-green" style={{ fontWeight: 800 }}>STABLE</span>.
                            Kinetic growth is localized in the Tier 3 segment, which represents <span style={{ color: 'white' }}>{((t3Count / mockCustomers.length) * 100).toFixed(1)}%</span> of monitored accounts.
                            {acceleratingCount > 0 && <> <span className="text-red" style={{ fontWeight: 700 }}>{acceleratingCount} accounts</span> showing accelerating risk.</>}
                            {recoveringCount > 0 && <> <span className="text-green" style={{ fontWeight: 700 }}>{recoveringCount} accounts</span> in recovery trajectory.</>}
                        </p>
                    </div>

                    {/* NPA Projection */}
                    <div className="technical-card" style={{ borderColor: 'rgba(244,63,94,0.15)' }}>
                        <div className="sidebar-section" style={{ padding: 0, marginBottom: '1rem' }}>NPA Projection</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {[
                                { label: 'Current T3 (Pre-NPA)', val: portfolioStats.npaProjection.current, color: 'var(--tier-3)' },
                                { label: 'Est. 30-Day NPA', val: portfolioStats.npaProjection.estimated30Days, color: 'var(--tier-2)' },
                                { label: 'Est. 90-Day NPA', val: portfolioStats.npaProjection.estimated90Days, color: 'var(--text-muted)' },
                            ].map((p, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="mono text-dim" style={{ fontSize: '0.6rem' }}>{p.label}</span>
                                    <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: p.color }}>{p.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recovery Metrics */}
                    <div className="technical-card" style={{ borderColor: 'rgba(16,185,129,0.15)' }}>
                        <div className="sidebar-section" style={{ padding: 0, marginBottom: '1rem' }}>Recovery Metrics</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {[
                                { label: 'Total Recovered', val: portfolioStats.recoveryMetrics.totalRecovered },
                                { label: 'Avg Recovery Time', val: portfolioStats.recoveryMetrics.avgRecoveryTime },
                                { label: 'Recovery Rate', val: portfolioStats.recoveryMetrics.recoveryRate },
                            ].map((p, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="mono text-dim" style={{ fontSize: '0.6rem' }}>{p.label}</span>
                                    <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--tier-1)' }}>{p.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Batch Processor */}
                    <div className="technical-card" style={{ borderColor: 'var(--primary-glow)' }}>
                        <div className="sidebar-section" style={{ padding: 0, marginBottom: '1rem' }}>Batch Processor</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {[
                                { label: 'Last batch', val: batchProcessor.lastBatchId, color: 'var(--primary)' },
                                { label: 'Accounts processed', val: batchProcessor.accountsProcessed?.toLocaleString() },
                                { label: 'Status', val: batchProcessor.status, color: 'var(--tier-1)' },
                                { label: 'Next run', val: batchProcessor.nextScheduledRun?.replace('T', ' ').slice(0, 16) },
                            ].map((s, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="mono text-dim" style={{ fontSize: '0.65rem' }}>{s.label}</span>
                                    <span className="mono" style={{ fontSize: '0.65rem', fontWeight: 800, color: s.color || 'white' }}>{s.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Operational Status */}
                    <div className="technical-card">
                        <div className="sidebar-section" style={{ padding: 0, marginBottom: '1rem' }}>Operational Status</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[
                                { label: 'Signal Engine', status: 'SYNCHRONIZED', color: 'var(--tier-1)' },
                                { label: 'Audit Trail', status: 'ACTIVE_UID_882', color: 'var(--text-dim)' },
                                { label: 'Latency', status: '14ms', color: 'var(--primary)' },
                                { label: 'Model Version', status: 'KRM-v4.0.2', color: 'var(--text-dim)' },
                            ].map((s, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{s.label}</div>
                                    <div className="mono" style={{ fontSize: '0.65rem', color: s.color, fontWeight: 800 }}>{s.status}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="technical-card glass" style={{ borderColor: 'var(--primary-glow)', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <ShieldCheck size={14} className="text-primary" />
                            <span className="mono" style={{ fontSize: '0.65rem', fontWeight: 800 }}>SECURE_SESSION</span>
                        </div>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.4, margin: 0 }}>
                            Terminal access authorized for level L1_OVERWATCH. Logging all interactions per compliance protocol SEC-99.
                        </p>
                    </div>
                </aside>
            </div>
        </motion.div>
    );
};

export default Dashboard;
