import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search as SearchIcon, User, TrendingUp,
    TrendingDown, FileText, ChevronRight, Play, Info, RefreshCcw
} from 'lucide-react';
import { getAccounts } from '../services/api';
import { mockCustomers, interventionStrategies } from '../data/mockData';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
    CartesianGrid, ReferenceLine
} from 'recharts';

const CustomerSearch = () => {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(null);
    const [timeRange, setTimeRange] = useState(30);
    const [simulating, setSimulating] = useState(null);

    // ── API state ─────────────────────────────────────────────────────
    const [accounts, setAccounts] = useState([]);
    const [apiLoading, setApiLoading] = useState(true);
    const [apiError, setApiError] = useState(false);

    const fetchAccounts = useCallback(async () => {
        setApiLoading(true);
        try {
            const res = await getAccounts({ limit: 100 });
            setAccounts(res.data || []);
            setApiError(false);
        } catch {
            setApiError(true);
            setAccounts(mockCustomers);
        } finally {
            setApiLoading(false);
        }
    }, []);

    useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

    const allAccounts = accounts.length > 0 ? accounts : mockCustomers;

    const filtered = allAccounts.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.id.toLowerCase().includes(query.toLowerCase())
    );

    const getChartData = (customer, range, simulationId = null) => {
        const history = Array.isArray(customer.history) ? customer.history : [];
        const data = history.slice(-range).map((val, i) => ({
            day: i,
            risk: parseFloat(Number(val).toFixed(2)),
            projected: null,
            date: new Date(Date.now() - (range - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            type: 'historical',
        }));

        if (simulationId) {
            const strategy = interventionStrategies.find(s => s.id === simulationId);
            if (!strategy || data.length === 0) return data;
            const lastRisk = data[data.length - 1].risk;
            data[data.length - 1].projected = lastRisk;
            for (let i = 1; i <= 14; i++) {
                const decay = Math.pow(0.8, i);
                const reduction = strategy.impact * 30 * (1 - decay);
                data.push({
                    day: range + i,
                    risk: null,
                    projected: parseFloat(Math.max(15, lastRisk - reduction + Math.random() * 2).toFixed(2)),
                    date: `D+${i}`,
                    type: 'projected',
                });
            }
        }
        return data;
    };

    const currentChartData = useMemo(() => {
        if (!selected) return [];
        return getChartData(selected, timeRange === 'max' ? (selected.history?.length || 90) : timeRange, simulating);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected, timeRange, simulating]);

    const handleSimulate = (id) => setSimulating(id === simulating ? null : id);
    const activeStrategy = simulating ? interventionStrategies.find(s => s.id === simulating) : null;

    if (apiLoading) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-container">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '4rem', alignItems: 'center' }}>
                    <RefreshCcw size={24} className="text-primary" style={{ animation: 'spin 1s linear infinite' }} />
                    <span className="mono text-dim" style={{ fontSize: '0.75rem' }}>LOADING_LOAN_ACCOUNT_DATA...</span>
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-container">
            <header className="page-header" style={{ marginBottom: '2.5rem' }}>
                <div>
                    <h1>Loan Account Audit</h1>
                    <p className="mono text-dim" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                        MONITORED_LOAN_ACCOUNTS // BATCH_PROCESSED_DATA {apiError && '// OFFLINE_MODE'}
                    </p>
                </div>
                {!selected && (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <button onClick={fetchAccounts} className="mono" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-dim)', padding: '0.4rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <RefreshCcw size={10} /> SYNC
                        </button>
                        <div className="search-box glass" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', width: '320px' }}>
                            <SearchIcon size={14} className="text-dim" />
                            <input type="text" placeholder="Find loan account (ID or name)..." value={query} onChange={(e) => { setQuery(e.target.value); }}
                                className="mono" style={{ background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: '0.8rem', width: '100%' }} />
                        </div>
                    </div>
                )}
            </header>

            <AnimatePresence>
                {!selected ? (
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                        <div className="technical-card" style={{ padding: 0, maxHeight: '70vh', overflowY: 'auto' }}>
                            <table className="institutional-table">
                                <thead>
                                    <tr>
                                        <th>Loan Account</th>
                                        <th>Account ID</th>
                                        <th>Risk Tier</th>
                                        <th>Kinetic Score</th>
                                        <th>∆ Phase</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(c => (
                                        <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(c)}>
                                            <td><div style={{ fontWeight: 700 }}>{c.name}</div></td>
                                            <td className="mono text-dim" style={{ fontSize: '0.7rem' }}>{c.loanAccountId ?? c.id}</td>
                                            <td><span className={`tier-tag ${c.tier.toLowerCase().replace(' ', '')}`}>{c.tier}</span></td>
                                            <td className="mono" style={{ fontWeight: 800, fontSize: '0.9rem' }}>{(c.risk * 100).toFixed(1)}%</td>
                                            <td className={c.riskChange?.startsWith('+') ? 'text-red' : 'text-green'}>
                                                <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700 }}>
                                                    {c.riskChange?.startsWith('+') ? '▲' : '▼'} {c.riskChange}
                                                </div>
                                            </td>
                                            <td><ChevronRight size={14} className="text-dim" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mono text-dim" style={{ fontSize: '0.6rem', marginTop: '0.5rem', textAlign: 'right' }}>
                            {filtered.length} accounts shown from <span style={{ color: 'var(--primary)' }}>{apiError ? 'MOCK' : 'MongoDB'}</span> datasource
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="detail" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.25 }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <button className="back-link" onClick={() => { setSelected(null); setSimulating(null); }}>← RETURN_TO_MASTER_LIST</button>
                        </div>

                        <div className="content-grid" style={{ gridTemplateColumns: '1fr 320px', overflow: 'visible' }}>
                            <main className="main-column">
                                <div className="technical-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                            <div style={{ width: 48, height: 48, background: 'var(--bg-surface)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                                <User size={24} className="text-primary" />
                                            </div>
                                            <div>
                                                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>{selected.name}</h2>
                                                <div className="mono text-dim" style={{ fontSize: '0.65rem' }}>
                                                    {selected.loanAccountId ?? selected.id} • LOAN_PORTFOLIO • SINCE: {selected.openedDate}
                                                    {selected.lastProcessedBatchId && ` • BATCH: ${selected.lastProcessedBatchId}`}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div className="stat-label">Urgency Phase</div>
                                            <div className="stat-value text-red" style={{ fontSize: '1.4rem' }}>{(selected.risk * selected.velocity * 10).toFixed(2)}U</div>
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                {[14, 30, 'max'].map(r => (
                                                    <button key={r} onClick={() => setTimeRange(r)} className={`mono ${timeRange === r ? 'active' : ''}`}
                                                        style={{ padding: '0.3rem 0.75rem', borderRadius: '4px', border: 'none', background: timeRange === r ? 'var(--primary)' : 'rgba(255,255,255,0.03)', color: timeRange === r ? 'black' : 'var(--text-dim)', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}>
                                                        {r === 'max' ? 'MAX' : `${r}D`}
                                                    </button>
                                                ))}
                                            </div>
                                            {simulating && (
                                                <div className="mono text-green pulse-subtle" style={{ fontSize: '0.65rem', fontWeight: 800 }}>
                                                    SIM_MODE: {activeStrategy.name.toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ height: 280 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={currentChartData}>
                                                    <defs>
                                                        <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} /><stop offset="95%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient>
                                                        <linearGradient id="colorSim" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--tier-1)" stopOpacity={0.2} /><stop offset="95%" stopColor="var(--tier-1)" stopOpacity={0} /></linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                                                    <XAxis dataKey="date" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                                                    <YAxis hide domain={[0, 100]} />
                                                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '10px' }} formatter={(value, name) => { if (value === null) return [null, null]; return [`${value}%`, name === 'projected' ? 'Projected Risk' : 'Risk Score']; }} />
                                                    {simulating && <ReferenceLine x={currentChartData.find(d => d.projected !== null)?.date} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" label={{ value: 'SIM START', fill: 'var(--text-dim)', fontSize: 9, position: 'top' }} />}
                                                    <Area type="monotone" dataKey="risk" stroke="var(--primary)" fill="url(#colorRisk)" strokeWidth={2} connectNulls={false} />
                                                    {simulating && <Area type="monotone" dataKey="projected" stroke="var(--tier-1)" fill="url(#colorSim)" strokeWidth={2} strokeDasharray="6 3" connectNulls={false} />}
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                                        {[
                                            { label: 'Kinetic Velocity', val: selected.velocity, sub: 'Score change / Time' },
                                            { label: 'Kinetic Accel', val: selected.accel, sub: 'Velocity change / Time' },
                                            { label: 'Interventions', val: Array.isArray(selected.interventions) ? selected.interventions.length : 0, sub: 'Historical total' },
                                        ].map((m, i) => (
                                            <div key={i} className="technical-card" style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.1)' }}>
                                                <div className="stat-label" style={{ fontSize: '0.6rem' }}>{m.label}</div>
                                                <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.4rem 0' }}>{m.val}</div>
                                                <div className="mono text-dim" style={{ fontSize: '0.55rem' }}>{m.sub}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </main>

                            <aside className="side-column">
                                <section>
                                    <div className="sidebar-section">What-If Simulation</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {interventionStrategies.map(s => (
                                            <button key={s.id} onClick={() => handleSimulate(s.id)}
                                                style={{ padding: '1rem', background: simulating === s.id ? 'var(--tier-1-soft)' : 'rgba(255,255,255,0.01)', border: simulating === s.id ? '1px solid var(--tier-1)' : '1px solid var(--border)', borderRadius: '0.75rem', color: 'white', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{s.name}</div>
                                                    {simulating === s.id && <Play size={10} className="text-tier-1" />}
                                                </div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                                                    Proj. Impact: <span className="text-green mono">+{(s.impact * 100).toFixed(0)}% Recovery</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {activeStrategy && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="technical-card glass" style={{ borderColor: 'var(--tier-1)', padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <Info size={14} className="text-green" />
                                            <span className="mono" style={{ fontSize: '0.7rem', fontWeight: 800 }}>EXPECTED OUTCOME</span>
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                                            Applying {activeStrategy.name} is projected to stabilize kinetic velocity within 4 days, resulting in a sustainable risk decay of ~{(activeStrategy.impact * 50).toFixed(0)}% over the next cycle.
                                        </p>
                                    </motion.div>
                                )}

                                <button style={{ width: '100%', padding: '1rem', background: 'white', border: 'none', color: 'black', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '0.85rem', fontWeight: 900, cursor: 'pointer', marginTop: 'auto' }}>
                                    <FileText size={16} /> GENERATE DOSSIER
                                </button>
                            </aside>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{ __html: `.tier-tag { font-size: 0.55rem; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 900; display: inline-block; text-transform: uppercase; border: 1px solid transparent; } .tier-tag.tier3 { background: var(--tier-3-soft); color: var(--tier-3); border-color: rgba(244,63,94,0.2); } .tier-tag.tier2 { background: var(--tier-2-soft); color: var(--tier-2); border-color: rgba(251,191,36,0.2); } .tier-tag.tier1 { background: var(--tier-1-soft); color: var(--tier-1); border-color: rgba(16,185,129,0.2); } .back-link { border: none; background: none; color: var(--text-dim); font-weight: 800; font-size: 0.7rem; cursor: pointer; letter-spacing: 0.15em; transition: color 0.2s; } .back-link:hover { color: var(--primary); } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }` }} />
        </motion.div>
    );
};

export default CustomerSearch;
